import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runCode } from "@/lib/piston";
import { calculateStarDelta } from "@/lib/challenge";
import { getMakeupCost, getDaysAgo } from "@/lib/makeup";
import { getTodayUTC } from "@/lib/streak";
import type { SolveResponse, TestCase } from "@/types";
import type { Language } from "@/lib/languages";

const bodySchema = z.object({
  problemId: z.string().min(1),
  code: z.string().min(1).max(50_000),
  language: z.enum(["JAVASCRIPT", "TYPESCRIPT", "PYTHON", "CPP", "JAVA"]),
  challengeMode: z.enum(["NORMAL", "HARD"]).default("NORMAL"),
  timeExpired: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date } = await params;
  const today = getTodayUTC();

  if (date >= today) {
    return NextResponse.json(
      { error: "Can only make up past problems" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { problemId, code, language, challengeMode, timeExpired } = parsed.data;

  // Verify problem belongs to this date
  const daily = await prisma.dailyProblem.findUnique({ where: { date } });
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
    const runner = wrapWithRunner(code, language as Language, tc.input);

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
): string {
  if (language === "JAVASCRIPT" || language === "TYPESCRIPT") {
    const escapedInput = input.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
    return `
${code}

const __input = \`${escapedInput}\`.trim().split('\\n');
const __args = __input.map(l => { try { return JSON.parse(l) } catch { return l } });

let __result;
if (typeof isValid !== 'undefined') __result = isValid(...__args);
else if (typeof twoSum !== 'undefined') __result = twoSum(...__args);
else if (typeof maxSubArray !== 'undefined') __result = maxSubArray(...__args);

console.log(JSON.stringify(__result));
`;
  }
  return code;
}
