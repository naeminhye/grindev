import { getAuthUserId } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runCode } from "@/lib/piston";
import { updateStreak } from "@/lib/streak";
import { calculateStarDelta } from "@/lib/challenge";
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

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const timeZone =
    (req.headers.get("x-timezone") ??
      decodeURIComponent(
        req.headers.get("cookie")?.match(/tz=([^;]+)/)?.[1] ?? "",
      )) ||
    "UTC";

  const { problemId, code, language, challengeMode, timeExpired, submit } =
    parsed.data;

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });

  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  const existing = await prisma.solve.findUnique({
    where: { userId_problemId: { userId, problemId } },
  });
  if (existing?.passed) {
    return NextResponse.json({ error: "Already solved" }, { status: 400 });
  }

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
    console.log("result pushed:", results[results.length - 1]);
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

  let streakUpdate;
  let starDelta = 0;

  if (allPassed) {
    streakUpdate = await updateStreak(userId, timeZone);
    starDelta = calculateStarDelta({
      mode: challengeMode,
      passed: true,
      usedHints,
      timeExpired,
      difficulty: problem.difficulty,
      config: starConfig,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stars: true },
    });
    const newStars = Math.max(0, (user?.stars ?? 0) + starDelta);
    await prisma.user.update({
      where: { id: userId },
      data: { stars: newStars },
    });

    await prisma.starTransaction.create({
      data: {
        userId,
        amount: starDelta,
        reason: cleanSolve
          ? challengeMode === "HARD"
            ? "SOLVE_CLEAN_HARD"
            : "SOLVE_CLEAN_NORMAL"
          : challengeMode === "HARD"
            ? "SOLVE_HINTS_HARD"
            : "SOLVE_HINTS_NORMAL",
      },
    });
  }

  return NextResponse.json({
    passed: allPassed,
    results,
    starDelta,
    ...(allPassed && streakUpdate ? { streak: streakUpdate } : {}),
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
