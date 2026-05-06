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
      problem: { select: { topics: true, difficulty: true } },
    },
    orderBy: { solvedAt: "desc" },
  });

  // Get ALL solves (passed) with their dates
  const allSolves = await prisma.solve.findMany({
    where: { userId, passed: true },
    select: {
      cleanSolve: true,
      challengeMode: true,
      isMakeup: true,
      makeupDate: true,
      solvedAt: true,
      attempts: true,
      problem: { select: { topics: true, difficulty: true } },
    },
    orderBy: { solvedAt: "desc" },
  });

  // Topic breakdown
  const topicMap: Record<string, number> = {};
  for (const s of solves) {
    for (const topic of s.problem.topics ?? []) {
      topicMap[topic] = (topicMap[topic] ?? 0) + 1;
    }
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

  // Regular solves — use solvedAt date
  const regularSolvedDates = new Set(
    allSolves
      .filter((s) => !s.isMakeup)
      .map((s) => format(new Date(s.solvedAt), "yyyy-MM-dd")),
  );

  console.log("regular dates:", [...regularSolvedDates]);
  console.log("today UTC:", format(new Date(), "yyyy-MM-dd"));

  // Makeup solves — use makeupDate (the original missed day)
  const makeupDates = new Set(
    allSolves
      .filter((s) => s.isMakeup && s.makeupDate)
      .map((s) => s.makeupDate!),
  );

  // Build heatmap — a day is "solved" if regular solve on that day
  // OR if user did a makeup for that day
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(today, i), "yyyy-MM-dd");
    const isSolvedRegular = regularSolvedDates.has(date);
    const isMakeup = makeupDates.has(date) && !isSolvedRegular;
    recentActivity.push({
      date,
      solved: isSolvedRegular,
      isMakeup,
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
    streakFreezeCount: 0,
  };

  return NextResponse.json(stats);
}
