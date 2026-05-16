import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";
import { recalculateStreak, getTodayInTz } from "@/lib/streak";
import {
  calculateQuizStars,
  quizPassed,
  QUIZ_STAR_DEFAULTS,
} from "@/lib/quiz-rewards";
import type { QuizQuestion, QuizSubmitResponse } from "@/types";

const schema = z.object({
  quizId: z.string().min(1),
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      selectedIndex: z.number().int().min(0).max(3),
    }),
  ),
  isMakeup: z.boolean().default(false),
  makeupDate: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { quizId, answers, isMakeup, makeupDate } = parsed.data;

  const timeZone =
    (req.headers.get("x-timezone") ??
      decodeURIComponent(
        req.headers.get("cookie")?.match(/tz=([^;]+)/)?.[1] ?? "",
      )) ||
    "UTC";
  const today = getTodayInTz(timeZone);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, deletedAt: null },
  });
  if (!quiz)
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const existing = await prisma.quizAttempt.findUnique({
    where: { userId_quizId: { userId, quizId } },
  });
  if (existing?.passed) {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  const questions = quiz.questions as QuizQuestion[];
  const total = questions.length;

  // ── Grade answers ─────────────────────────────────────────────────────
  let score = 0;
  const results = questions.map((q, i) => {
    const answer = answers.find((a) => a.questionIndex === i);
    const selectedIndex = answer?.selectedIndex ?? -1;
    const isCorrect = selectedIndex === q.correctIndex;
    if (isCorrect) score++;
    return {
      questionIndex: i,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    };
  });

  // ── Fetch star config ─────────────────────────────────────────────────
  const configKeys = Object.keys(QUIZ_STAR_DEFAULTS);
  const configs = await prisma.appConfig.findMany({
    where: { key: { in: configKeys } },
  });
  const configMap = Object.fromEntries(
    configs.map((c) => [c.key, parseInt(c.value)]),
  );

  const threshold =
    configMap["QUIZ_PASS_THRESHOLD"] ?? QUIZ_STAR_DEFAULTS.QUIZ_PASS_THRESHOLD;
  const passed = quizPassed(score, total, threshold);
  const starDelta = calculateQuizStars(score, total, configMap);

  // ── Save attempt ──────────────────────────────────────────────────────
  const answersJson = answers as any;

  if (existing) {
    await prisma.quizAttempt.update({
      where: { userId_quizId: { userId, quizId } },
      data: { answers: answersJson, score, total, passed, stars: starDelta },
    });
  } else {
    await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        answers: answersJson,
        score,
        total,
        passed,
        stars: starDelta,
        isMakeup,
        makeupDate: isMakeup ? (makeupDate ?? null) : null,
      },
    });
  }

  // ── Update stars + streak ─────────────────────────────────────────────
  let streakUpdate: Awaited<ReturnType<typeof recalculateStreak>> | undefined;

  if (passed) {
    if (starDelta > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { stars: Math.max(0, (user?.stars ?? 0) + starDelta) },
      });
      await prisma.starTransaction.create({
        data: { userId, amount: starDelta, reason: "QUIZ_REWARD" },
      });
    }

    // Makeup cost deduction
    if (isMakeup) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true, lastMakeupDate: true },
      });
      const daysAgo = makeupDate
        ? Math.floor(
            (new Date(today).getTime() - new Date(makeupDate).getTime()) /
              86400000,
          )
        : 0;
      const { getMakeupCost } = await import("@/lib/makeup");
      const cost = getMakeupCost(daysAgo);
      await prisma.user.update({
        where: { id: userId },
        data: {
          stars: Math.max(0, (user?.stars ?? 0) - cost),
          lastMakeupDate:
            user?.lastMakeupDate !== today ? today : user.lastMakeupDate,
        },
      });
    }

    streakUpdate = await recalculateStreak(userId, timeZone);
  }

  return NextResponse.json({
    passed,
    score,
    total,
    starDelta,
    results,
    ...(passed && streakUpdate ? { streak: streakUpdate } : {}),
  } satisfies QuizSubmitResponse);
}
