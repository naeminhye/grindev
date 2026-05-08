import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";

const ITEM_COSTS: Record<string, number> = {
  "streak-freeze": 20,
  "problem-skip": 10,
  "hint-discount": 5,
  "double-stars": 15,
  "extra-attempt": 8,
};
const ITEM_REASONS: Record<string, string> = {
  "streak-freeze": "STREAK_FREEZE_PURCHASE",
  "problem-skip": "PROBLEM_SKIP",
  "hint-discount": "HINT_DISCOUNT_PURCHASE",
  "double-stars": "DOUBLE_STARS_PURCHASE",
  "extra-attempt": "EXTRA_ATTEMPT_PURCHASE",
};

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = z.object({ itemId: z.string().min(1) }).safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { itemId } = parsed.data;
  const cost = ITEM_COSTS[itemId];
  if (!cost)
    return NextResponse.json({ error: "Unknown item" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stars: true, streakFreezeCount: true },
  });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.stars < cost)
    return NextResponse.json({ error: "Not enough stars" }, { status: 400 });

  // Apply item-specific effects
  const updates: any = { stars: user.stars - cost };
  if (itemId === "streak-freeze") {
    updates.streakFreezeCount = (user.streakFreezeCount ?? 0) + 1;
  }

  await prisma.user.update({ where: { id: userId }, data: updates });

  const transaction = await prisma.starTransaction.create({
    data: {
      userId,
      amount: -cost,
      reason: ITEM_REASONS[itemId] as any,
    },
  });

  return NextResponse.json({
    ok: true,
    stars: updates.stars,
    transaction: {
      id: transaction.id,
      amount: transaction.amount,
      reason: transaction.reason,
      createdAt: transaction.createdAt.toISOString(),
    },
  });
}
