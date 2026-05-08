import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  topic: z
    .enum([
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
    ])
    .optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        code: z.string().optional(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string().optional(),
      }),
    )
    .min(1)
    .max(20)
    .optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const quiz = await prisma.quiz.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.questions
        ? { questions: parsed.data.questions as any }
        : {}),
    },
  });

  return NextResponse.json({ quiz });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const { id } = await params;
  await prisma.quiz.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
