import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await getAdminUserId();
  if (error) return error;

  const slots = await prisma.dailyQuiz.findMany({
    include: {
      quiz: {
        select: { id: true, title: true, topic: true, difficulty: true },
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ scheduled: slots });
}

export async function POST(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      quizId: z.string().min(1),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { date, quizId } = parsed.data;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId, deletedAt: null },
  });
  if (!quiz)
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Warn if this quiz is already scheduled on another date
  const existingSlot = await prisma.dailyQuiz.findFirst({
    where: { quizId, NOT: { date } },
  });
  const warning = existingSlot
    ? `This quiz is already scheduled on ${existingSlot.date}.`
    : null;

  const slot = await prisma.dailyQuiz.upsert({
    where: { date },
    update: { quizId },
    create: { date, quizId },
  });

  return NextResponse.json({ slot, warning }, { status: 201 });
}
