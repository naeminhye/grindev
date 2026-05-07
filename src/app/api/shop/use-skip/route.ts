import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";

export async function POST() {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const [purchased, used] = await Promise.all([
    prisma.starTransaction.count({ where: { userId, reason: "PROBLEM_SKIP" } }),
    prisma.starTransaction.count({
      where: { userId, reason: "PROBLEM_SKIP_USED" },
    }),
  ]);

  if (purchased - used <= 0) {
    return NextResponse.json({ error: "No skips available" }, { status: 400 });
  }

  await prisma.starTransaction.create({
    data: { userId, amount: 0, reason: "PROBLEM_SKIP_USED" },
  });

  return NextResponse.json({ ok: true });
}
