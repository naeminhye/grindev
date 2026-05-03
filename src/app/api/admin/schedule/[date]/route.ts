import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const { date } = await params;

  const slot = await prisma.dailyProblem.findUnique({ where: { date } });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.dailyProblem.delete({ where: { date } });
  return NextResponse.json({ ok: true });
}
