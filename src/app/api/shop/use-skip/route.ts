import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";
import { getTodayInTz } from "@/lib/streak";

export async function POST(req: Request) {
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

  // Record skip as used and set skipRequestedAt to now
  await Promise.all([
    prisma.starTransaction.create({
      data: { userId, amount: 0, reason: "PROBLEM_SKIP_USED" },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { skipRequestedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
