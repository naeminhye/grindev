import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runCode } from "@/lib/piston";
import { updateStreak } from "@/lib/streak";
import type { SolveResponse, TestCase } from "@/types";

const bodySchema = z.object({
  problemId: z.string().min(1),
  code: z.string().min(1).max(50_000),
  language: z.enum(["javascript", "typescript", "python", "java", "cpp"]),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { problemId, code, language } = parsed.data;

  // Fetch test cases server-side only
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  const testCases = problem.testCases as TestCase[];
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    // Wrap solution in a runner that reads stdin and prints result
    const runner = wrapWithRunner(code, language, tc.input);

    let result;
    try {
      result = await runCode(language, runner, tc.input);
    } catch (e) {
      console.error("Piston error:", e);
      return NextResponse.json(
        { error: "Execution service unavailable" },
        { status: 503 },
      );
    }

    // status descriptions from Judge0: "Accepted", "Wrong Answer", "Runtime Error", etc.
    // stdout is null on error, so guard it:
    const actual = (result.stdout ?? "").trim();
    const expected = tc.expected.trim();
    const passed = actual === expected;

    results.push({
      index: i + 1,
      passed,
      stderr: result.stderr,
      // Never include tc.input or tc.expected in response
    });
  }

  const allPassed = results.every((r) => r.passed);

  // Check if user has used any hints for this problem
  const hintCount = await prisma.hintPurchase.count({
    where: { userId, problemId },
  });

  // Upsert solve record
  // await prisma.solve.upsert({
  //   where: { userId_problemId: { userId, problemId } },
  //   update: { code, passed: allPassed, usedHints: hintCount > 0, cleanSolve: allPassed && hintCount === 0 },
  //   create: {
  //     userId,
  //     problemId,
  //     code,
  //     language,
  //     passed: allPassed,
  //     usedHints: hintCount > 0,
  //     cleanSolve: allPassed && hintCount === 0,
  //   },
  // })

  const existingSolve = await prisma.solve.findFirst({
    where: { userId, problemId },
  });

  if (existingSolve) {
    await prisma.solve.update({
      where: { id: existingSolve.id },
      data: {
        code,
        passed: allPassed,
        usedHints: hintCount > 0,
        cleanSolve: allPassed && hintCount === 0,
      },
    });
  } else {
    await prisma.solve.create({
      data: {
        userId,
        problemId,
        code,
        language,
        passed: allPassed,
        usedHints: hintCount > 0,
        cleanSolve: allPassed && hintCount === 0,
      },
    });
  }

  let streakUpdate;
  if (allPassed) {
    streakUpdate = await updateStreak(userId);
  }

  const response: SolveResponse = {
    passed: allPassed,
    results,
    ...(allPassed && streakUpdate ? { streak: streakUpdate } : {}),
  };

  return NextResponse.json(response);
}

/**
 * Wraps the user's solution function with a stdin-reading runner.
 * The test harness calls the function with parsed input and prints the result.
 * This is JavaScript-specific — extend per language as needed.
 */
function wrapWithRunner(code: string, language: string, input: string): string {
  if (language === "javascript" || language === "typescript") {
    return `
${code}

const lines = \`${input.replace(/`/g, "\\`")}\`.trim().split('\\n');
const args = lines.map(l => { try { return JSON.parse(l) } catch { return l } });

const fns = [twoSum, isValid, maxSubArray].filter(name => {
  try { return typeof eval(name) === 'function' } catch { return false }
});

if (fns.length > 0) {
  const result = fns[0](...args);
  process.stdout.write(JSON.stringify(result));
}
`;
  }
  return code;
}
