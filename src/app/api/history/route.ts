import { getAuthUserId } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId, error } = await getAuthUserId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const [solves, quizAttempts] = await Promise.all([
    prisma.solve.findMany({
      where: { userId },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            topics: true,
          },
        },
      },
      orderBy: { solvedAt: "desc" },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          select: { id: true, title: true, difficulty: true, topic: true },
        },
      },
      orderBy: { solvedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ solves, quizAttempts });
}
