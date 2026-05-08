import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";
import { checkAndResetStreak, getTodayInTz } from "@/lib/streak";
import { BUILT_IN_TOPICS, BUILT_IN_TOPIC_LABELS } from "@/lib/quiz-topics";
import type { QuizQuestion } from "@/types";

export async function GET(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  const timeZone = req.headers.get("x-timezone") ?? "UTC";
  await checkAndResetStreak(userId, timeZone);

  const user = await prisma.user.findUnique({ where: { id: userId } });

  // ── Solved quiz IDs ───────────────────────────────────────────────────
  const solvedQuizIds = await prisma.quizAttempt
    .findMany({
      where: { userId, passed: true },
      select: { quizId: true },
    })
    .then((a) => a.map((x) => x.quizId));

  // ── Topic availability — all available quizzes grouped by topic ───────
  const allAvailable = await prisma.quiz.findMany({
    where: {
      deletedAt: null,
      id: solvedQuizIds.length > 0 ? { notIn: solvedQuizIds } : undefined,
    },
    select: { id: true, topic: true },
  });

  // Build availability map: topic → count of unsolved quizzes
  const topicCounts = new Map<string, number>();
  for (const q of allAvailable) {
    topicCounts.set(q.topic, (topicCounts.get(q.topic) ?? 0) + 1);
  }

  const builtInLabels = BUILT_IN_TOPIC_LABELS;

  const allTopics = new Set([
    ...BUILT_IN_TOPICS.map((t) => t.id),
    ...topicCounts.keys(),
  ]);

  const topicAvailability = [...allTopics].map((topic) => ({
    topic,
    label: builtInLabels[topic] ?? topic.replace(/_/g, " "),
    count: topicCounts.get(topic) ?? 0,
  }));

  // ── Pick quiz for preferred topic ─────────────────────────────────────
  const preferred = user?.preferredQuizTopic ?? null;
  let pool = preferred
    ? allAvailable.filter((q) => q.topic === preferred)
    : allAvailable;

  // Fallback: if preferred topic has no quizzes, use any topic
  const usedFallback = preferred && pool.length === 0;
  if (usedFallback) {
    pool = allAvailable;
  }

  // If all quizzes solved, allow retrying any
  let allDone = false;
  if (pool.length === 0) {
    allDone = true;
    const retryPool = await prisma.quiz.findMany({
      where: {
        deletedAt: null,
        ...(preferred && !usedFallback ? { topic: preferred } : {}),
      },
      select: { id: true, topic: true },
    });
    pool = retryPool;
  }

  if (pool.length === 0) {
    return NextResponse.json({
      noQuizToday: true,
      reason: "no_quizzes",
      topicAvailability,
      userStats: buildStats(user),
    });
  }

  // Pick random
  const picked = await prisma.quiz.findUnique({
    where: { id: pool[Math.floor(Math.random() * pool.length)].id },
    select: {
      id: true,
      title: true,
      topic: true,
      difficulty: true,
      questions: true,
    },
  });

  if (!picked) {
    return NextResponse.json({
      noQuizToday: true,
      reason: "no_quizzes",
      topicAvailability,
      userStats: buildStats(user),
    });
  }

  const freshUser = await prisma.user.findUnique({ where: { id: userId } });

  return NextResponse.json({
    quiz: {
      id: picked.id,
      title: picked.title,
      topic: picked.topic,
      difficulty: picked.difficulty,
      questions: picked.questions as QuizQuestion[],
    },
    topicAvailability,
    allTopicsDone: allDone,
    usedFallback, // true = preferred topic was empty, showing from other topics
    userStats: buildStats(freshUser),
  });
}

function buildStats(user: any) {
  return {
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    stars: user?.stars ?? 10,
    lastSolvedAt: user?.lastSolvedAt?.toISOString() ?? null,
  };
}
