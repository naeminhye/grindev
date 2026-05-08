import { getAuthUserId } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runCode } from "@/lib/piston";
import { calculateStarDelta } from "@/lib/challenge";
import { getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getTodayInTz, getTodayUTC } from "@/lib/streak";
import type { SolveResponse, TestCase } from "@/types";
import type { Language } from "@/lib/languages";
import { STAR_REWARD_DEFAULTS } from "@/lib/game-config";
import type { StarRewardConfig } from "@/lib/challenge";

const bodySchema = z.object({
  problemId: z.string().min(1),
  code: z.string().min(1).max(50_000),
  language: z.enum(["JAVASCRIPT", "TYPESCRIPT", "PYTHON", "CPP", "JAVA"]),
  challengeMode: z.enum(["NORMAL", "HARD"]).default("NORMAL"),
  timeExpired: z.boolean().default(false),
  submit: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { userId, error } = await getAuthUserId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const { date } = await params;
  const timeZone =
    (req.headers.get("x-timezone") ??
      decodeURIComponent(
        req.headers.get("cookie")?.match(/tz=([^;]+)/)?.[1] ?? "",
      )) ||
    "UTC";
  const today = getTodayInTz(timeZone);

  if (date >= today) {
    return NextResponse.json(
      { error: "Can only make up past problems" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { problemId, code, language, challengeMode, timeExpired, submit } =
    parsed.data;

  // find the best slot for this date
  const slots = await prisma.dailyProblem.findMany({
    where: { date },
    include: { problem: true },
  });
  const daily = slots[0]; // or pick by difficulty if needed

  if (!daily || daily.problemId !== problemId) {
    return NextResponse.json({ error: "Problem mismatch" }, { status: 400 });
  }

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  // Already passed — don't re-run
  const existing = await prisma.solve.findUnique({
    where: { userId_problemId: { userId, problemId } },
  });
  if (existing?.passed) {
    return NextResponse.json({ error: "Already solved" }, { status: 400 });
  }

  // Check user has enough stars for makeup cost
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const daysAgo = getDaysAgo(date);
  const starCost = getMakeupCost(daysAgo);

  if ((user?.stars ?? 0) < starCost) {
    return NextResponse.json(
      { error: `Not enough stars. Need ${starCost} to attempt this makeup.` },
      { status: 402 },
    );
  }

  // Run test cases
  const testCases = problem.testCases as TestCase[];
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const runner = wrapWithRunner(
      code,
      language as Language,
      tc.input,
      problem.functionName,
    );

    let result;
    try {
      result = await runCode(language as Language, runner);
    } catch (e) {
      console.error("Execution error:", e);
      return NextResponse.json(
        { error: "Execution service unavailable" },
        { status: 503 },
      );
    }

    const actual = (result.stdout ?? "").trim();
    const expected = tc.expected.trim();
    results.push({
      index: i + 1,
      passed: actual === expected,
      stderr: result.stderr,
      actual,
      expected,
      input: actual === expected ? undefined : tc.input, // only return input for failed cases to save bandwidth
    });
  }

  const allPassed = results.every((r) => r.passed);

  // ── Trial run — no DB writes ──────────────────────────────────────────
  if (!submit) {
    return NextResponse.json({
      passed: allPassed,
      results,
      isTrialRun: true,
    } satisfies SolveResponse);
  }

  // ── Submission — record solve, update streak and stars ────────────────
  const hintCount = await prisma.hintPurchase.count({
    where: { userId, problemId },
  });
  const usedHints = hintCount > 0;
  const cleanSolve = allPassed && !usedHints;

  // Upsert solve
  if (existing) {
    await prisma.solve.update({
      where: { userId_problemId: { userId, problemId } },
      data: {
        code,
        passed: allPassed,
        usedHints,
        cleanSolve,
        challengeMode,
        timeExpired,
        attempts: { increment: 1 },
        isMakeup: true,
        makeupDate: date,
      },
    });
  } else {
    await prisma.solve.create({
      data: {
        userId,
        problemId,
        code,
        language: language as any,
        passed: allPassed,
        usedHints,
        cleanSolve,
        challengeMode,
        timeExpired,
        attempts: 1,
        isMakeup: true,
        makeupDate: date,
      },
    });
  }

  const rewardKeys = Object.keys(STAR_REWARD_DEFAULTS);
  const rewardConfigs = await prisma.appConfig.findMany({
    where: { key: { in: rewardKeys } },
  });
  const rewardMap = Object.fromEntries(
    rewardConfigs.map((c) => [c.key, parseInt(c.value)]),
  );
  const starConfig = Object.fromEntries(
    rewardKeys.map((k) => [
      k,
      rewardMap[k] ??
        STAR_REWARD_DEFAULTS[k as keyof typeof STAR_REWARD_DEFAULTS],
    ]),
  ) as StarRewardConfig;

  let starDelta = 0;

  if (allPassed) {
    const makeupRewardGivenToday = user?.lastMakeupDate === today;

    // Deduct makeup cost first
    const costDeducted = Math.max(0, (user?.stars ?? 0) - starCost);

    if (!makeupRewardGivenToday) {
      // First makeup solve today — give reward on top
      const reward = calculateStarDelta({
        mode: challengeMode,
        passed: true,
        usedHints,
        timeExpired,
        difficulty: problem.difficulty,
        config: starConfig,
      });
      starDelta = reward - starCost; // net: reward minus cost
      const newStars = Math.max(0, (user?.stars ?? 0) + starDelta);
      await prisma.user.update({
        where: { id: userId },
        data: { stars: newStars, lastMakeupDate: today },
      });
    } else {
      // Subsequent makeup today — only deduct cost, no reward
      starDelta = -starCost;
      const newStars = Math.max(0, (user?.stars ?? 0) - starCost);
      await prisma.user.update({
        where: { id: userId },
        data: { stars: newStars },
      });
    }
  }

  return NextResponse.json({
    passed: allPassed,
    results,
    starDelta,
  } satisfies SolveResponse);
}

function wrapWithRunner(
  code: string,
  language: Language,
  input: string,
  functionName: string,
): string {
  if (language === "JAVASCRIPT" || language === "TYPESCRIPT") {
    const escapedInput = input.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
    return `
${code}

const __input = \`${escapedInput}\`.trim().split('\\n');
const __args = __input.map(l => { try { return JSON.parse(l) } catch { return l } });

if (typeof ${functionName} !== 'undefined') {
  const __result = ${functionName}(...__args);
  console.log(JSON.stringify(__result));
} else {
  console.log('ERROR: function ${functionName} not found');
}
`;
  }
  return code;
}
