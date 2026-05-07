import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";
import { checkAndResetStreak, getTodayInTz } from "@/lib/streak";
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

  const today = getTodayInTz(timeZone);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // ── Find a quiz the user hasn't completed yet ────────────────────────
  // Filter by preferred topic if set
  const solvedQuizIds = await prisma.quizAttempt
    .findMany({
      where: { userId, passed: true },
      select: { quizId: true },
    })
    .then((a) => a.map((x) => x.quizId));

  const availableQuizzes = await prisma.quiz.findMany({
    where: {
      deletedAt: null,
      id: { notIn: solvedQuizIds.length > 0 ? solvedQuizIds : undefined },
      ...(user?.preferredQuizTopic ? { topic: user.preferredQuizTopic } : {}),
    },
    select: {
      id: true,
      title: true,
      topic: true,
      difficulty: true,
      questions: true,
    },
  });

  // If all quizzes in preferred topic are done, fall back to any topic
  let quizPool = availableQuizzes;
  if (quizPool.length === 0 && user?.preferredQuizTopic) {
    quizPool = await prisma.quiz.findMany({
      where: {
        deletedAt: null,
        id: { notIn: solvedQuizIds.length > 0 ? solvedQuizIds : undefined },
      },
      select: {
        id: true,
        title: true,
        topic: true,
        difficulty: true,
        questions: true,
      },
    });
  }

  const allTopicsDone = quizPool.length === 0;

  // If all quizzes are done, pick a random one to redo
  if (allTopicsDone) {
    const allQuizzes = await prisma.quiz.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        topic: true,
        difficulty: true,
        questions: true,
      },
    });
    if (allQuizzes.length === 0) {
      return NextResponse.json({
        noQuizToday: true,
        reason: "no_quizzes",
        userStats: buildUserStats(user),
      });
    }
    quizPool = allQuizzes;
  }

  // Pick random from pool
  const quiz = quizPool[Math.floor(Math.random() * quizPool.length)];

  const freshUser = await prisma.user.findUnique({ where: { id: userId } });

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      title: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      questions: quiz.questions as QuizQuestion[],
    },
    alreadySolved: false, // on-demand — always fresh
    allTopicsDone, // true = user finished all quizzes in their topic, showing random
    userStats: buildUserStats(freshUser),
  });
}

function buildUserStats(user: any) {
  return {
    currentStreak: user?.currentStreak ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    stars: user?.stars ?? 10,
    lastSolvedAt: user?.lastSolvedAt?.toISOString() ?? null,
  };
}
