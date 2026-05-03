import { getAuthUserId } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";
import type { ProfileStats } from "@/types";

export async function GET() {
  const { userId, error } = await getAuthUserId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const solves = await prisma.solve.findMany({
    where: { userId, passed: true },
    select: {
      cleanSolve: true,
      challengeMode: true,
      isMakeup: true,
      makeupDate: true,
      solvedAt: true,
      problem: { select: { topic: true, difficulty: true } },
    },
    orderBy: { solvedAt: "desc" },
  });

  const allSolves = await prisma.solve.findMany({
    where: { userId },
    select: { attempts: true, solvedAt: true, passed: true },
  });

  // Topic breakdown
  const topicMap: Record<string, number> = {};
  for (const s of solves) {
    topicMap[s.problem.topic] = (topicMap[s.problem.topic] ?? 0) + 1;
  }
  const topicBreakdown = Object.entries(topicMap)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  // Difficulty breakdown
  const diffMap: Record<string, number> = {};
  for (const s of solves) {
    diffMap[s.problem.difficulty] = (diffMap[s.problem.difficulty] ?? 0) + 1;
  }
  const difficultyBreakdown = Object.entries(diffMap).map(
    ([difficulty, count]) => ({ difficulty, count }),
  );

  // Last 30 days activity
  const today = new Date();
  const recentActivity = [];

  // Use makeupDate for makeup solves, solvedAt for regular ones
  const solvedDates = new Set(
    solves.map((s) =>
      s.isMakeup && s.makeupDate
        ? s.makeupDate
        : format(new Date(s.solvedAt), "yyyy-MM-dd"),
    ),
  );

  // Regular solves (not makeup)
  const regularSolvedDates = new Set(
    solves
      .filter((s) => !s.isMakeup)
      .map((s) => format(new Date(s.solvedAt), "yyyy-MM-dd")),
  );

  // Makeup solves — use the original missed date
  const makeupDates = new Set(
    solves.filter((s) => s.isMakeup && s.makeupDate).map((s) => s.makeupDate!),
  );

  // Combined for "solved" check
  const allSolvedDates = new Set([...regularSolvedDates, ...makeupDates]);

  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    recentActivity.push({
      date,
      solved: regularSolvedDates.has(date), // green = regular solve
      isMakeup: makeupDates.has(date), // blue = makeup (even if also regular)
    });
  }

  const totalAttempts = allSolves.reduce((sum, s) => sum + s.attempts, 0);

  const stats: ProfileStats = {
    totalSolves: solves.length,
    cleanSolves: solves.filter((s) => s.cleanSolve).length,
    hardModeSolves: solves.filter((s) => s.challengeMode === "HARD").length,
    totalAttempts,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    stars: user.stars,
    challengeMode: user.challengeMode as "NORMAL" | "HARD",
    topicBreakdown,
    difficultyBreakdown,
    recentActivity,
    makeupSolves: solves.filter((s) => s.isMakeup).length,
  };

  return NextResponse.json(stats);
}
