import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

const questionSchema = z.object({
  question: z.string().min(1),
  code: z.string().optional(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
});

const quizSchema = z.object({
  title: z.string().min(1),
  topic: z.enum([
    "JAVASCRIPT",
    "TYPESCRIPT",
    "PYTHON",
    "CSS",
    "HTML",
    "REACT",
    "NODE",
    "DATABASES",
    "SYSTEM_DESIGN",
    "GENERAL_CS",
  ]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questions: z.array(questionSchema).min(1).max(20),
});

export async function GET(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const topic = searchParams.get("topic") ?? "";

  const quizzes = await prisma.quiz.findMany({
    where: {
      deletedAt: null,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(difficulty ? { difficulty: difficulty as any } : {}),
      ...(topic ? { topic: topic as any } : {}),
    },
    include: { _count: { select: { attempts: true, dailySlots: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ quizzes });
}

export async function POST(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = quizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const quiz = await prisma.quiz.create({
    data: { ...parsed.data, questions: parsed.data.questions as any },
  });

  return NextResponse.json({ quiz }, { status: 201 });
}
