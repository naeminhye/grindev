// src/app/api/admin/quizzes/import/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

const questionSchema = z.object({
  question: z.string().min(1),
  code: z.string().optional(),
  options: z.array(z.string().min(1)).length(4),
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

// Accepts either a single quiz object or an array of quiz objects
const importSchema = z.union([quizSchema, z.array(quizSchema)]);

export async function POST(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid quiz data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const quizzes = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  const created = await Promise.all(
    quizzes.map((q) =>
      prisma.quiz.create({
        data: { ...q, questions: q.questions as any },
      }),
    ),
  );

  return NextResponse.json(
    {
      imported: created.length,
      quizzes: created.map((q) => ({ id: q.id, title: q.title })),
    },
    { status: 201 },
  );
}
