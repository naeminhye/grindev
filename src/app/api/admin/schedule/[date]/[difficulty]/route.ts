import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ date: string; difficulty: string }> },
) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const { date, difficulty } = await params;

  if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }

  const slot = await prisma.dailyProblem.findUnique({
    where: { date_difficulty: { date, difficulty: difficulty as any } },
  });

  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.dailyProblem.delete({
    where: { date_difficulty: { date, difficulty: difficulty as any } },
  });

  return NextResponse.json({ ok: true });
}
