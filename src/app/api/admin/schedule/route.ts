import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await getAdminUserId();
  if (error) return error;

  const slots = await prisma.dailyProblem.findMany({
    include: {
      problem: { select: { id: true, title: true, difficulty: true } },
    },
    orderBy: { date: "asc" },
  });

  // Group by date
  const byDate = new Map<string, { date: string; slots: any[] }>();
  for (const slot of slots) {
    if (!byDate.has(slot.date))
      byDate.set(slot.date, { date: slot.date, slots: [] });
    byDate
      .get(slot.date)!
      .slots.push({ difficulty: slot.difficulty, problem: slot.problem });
  }

  return NextResponse.json({ scheduled: [...byDate.values()] });
}

export async function POST(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
      problemId: z.string().min(1),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { date, difficulty, problemId } = parsed.data;

  const problem = await prisma.problem.findUnique({
    where: { id: problemId, deletedAt: null },
  });
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  if (problem.difficulty !== difficulty) {
    return NextResponse.json(
      {
        error: `Problem difficulty (${problem.difficulty}) doesn't match slot (${difficulty})`,
      },
      { status: 400 },
    );
  }

  // Check if this problem is already scheduled on a DIFFERENT date
  const existingSlot = await prisma.dailyProblem.findFirst({
    where: { problemId, NOT: { date } },
  });

  const warning = existingSlot
    ? `This problem is already scheduled on ${existingSlot.date}. It will appear on both days.`
    : null;

  const slot = await prisma.dailyProblem.upsert({
    where: { date_difficulty: { date, difficulty } },
    update: { problemId },
    create: { date, difficulty, problemId },
  });

  return NextResponse.json({ slot, warning }, { status: 201 });
}
