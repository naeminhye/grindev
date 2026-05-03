import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await getAdminUserId();
  if (error) return error;

  const scheduled = await prisma.dailyProblem.findMany({
    include: {
      problem: { select: { id: true, title: true, difficulty: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ scheduled });
}

export async function POST(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      problemId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { problemId, date } = parsed.data;

  // Check date not already taken
  const existing = await prisma.dailyProblem.findUnique({ where: { date } });
  if (existing) {
    return NextResponse.json(
      { error: "This date already has a problem scheduled" },
      { status: 409 },
    );
  }

  // Check problem exists
  const problem = await prisma.problem.findUnique({
    where: { id: problemId, deletedAt: null },
  });
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  const slot = await prisma.dailyProblem.create({ data: { date, problemId } });
  return NextResponse.json({ slot }, { status: 201 });
}
