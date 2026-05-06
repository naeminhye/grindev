import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";
import {
  adjustStars,
  STREAK_FREEZE_COST,
  PROBLEM_SKIP_COST,
} from "@/lib/stars";
import { getTodayUTC } from "@/lib/streak";

const bodySchema = z.object({
  item: z.enum(["STREAK_FREEZE", "PROBLEM_SKIP"]),
});

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { item } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (item === "STREAK_FREEZE") {
    if (user.stars < STREAK_FREEZE_COST) {
      return NextResponse.json(
        { error: `Not enough stars. Need ${STREAK_FREEZE_COST}⭐` },
        { status: 402 },
      );
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          stars: { decrement: STREAK_FREEZE_COST },
          streakFreezeCount: { increment: 1 },
        },
      }),
      prisma.starTransaction.create({
        data: {
          userId,
          amount: -STREAK_FREEZE_COST,
          reason: "STREAK_FREEZE_PURCHASE",
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stars: updatedUser.stars,
      streakFreezeCount: updatedUser.streakFreezeCount,
    });
  }

  if (item === "PROBLEM_SKIP") {
    if (user.stars < PROBLEM_SKIP_COST) {
      return NextResponse.json(
        { error: `Not enough stars. Need ${PROBLEM_SKIP_COST}⭐` },
        { status: 402 },
      );
    }

    // Pick a random problem from the bank (not today's, not already solved today)
    const today = getTodayUTC();
    const todaySlots = await prisma.dailyProblem.findMany({
      where: { date: today },
      select: { problemId: true },
    });
    const todayProblemIds = todaySlots.map((s) => s.problemId);

    const solvedIds = await prisma.solve.findMany({
      where: { userId, passed: true },
      select: { problemId: true },
    });
    const solvedProblemIds = new Set(solvedIds.map((s) => s.problemId));

    const candidates = await prisma.problem.findMany({
      where: {
        deletedAt: null,
        id: { notIn: [...todayProblemIds, ...solvedProblemIds] },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        examples: true,
        constraints: true,
        difficulty: true,
        topics: true,
        functionName: true,
        starterCode: true,
        testCases: true,
        hints: true,
      },
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No available problems to skip to." },
        { status: 404 },
      );
    }

    const skippedProblem =
      candidates[Math.floor(Math.random() * candidates.length)];

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { stars: { decrement: PROBLEM_SKIP_COST } },
      }),
      prisma.starTransaction.create({
        data: {
          userId,
          amount: -PROBLEM_SKIP_COST,
          reason: "PROBLEM_SKIP",
          meta: { problemId: skippedProblem.id },
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stars: updatedUser.stars,
      problem: skippedProblem,
    });
  }
}
