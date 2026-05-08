import { getAuthUserId } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getHintCost, canAffordHint } from "@/lib/hints";
import type { HintTier } from "@/lib/hints";
import type { HintData, HintResponse } from "@/types";

const bodySchema = z.object({
  problemId: z.string().min(1),
  tier: z.number().int().min(1).max(4),
});

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const { problemId, tier } = await req.json();

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem)
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  const hints = problem.hints as any[];
  const hint = hints.find((h) => h.tier === tier);
  if (!hint)
    return NextResponse.json({ error: "Hint not found" }, { status: 404 });

  // Check if already purchased
  const existing = await prisma.hintPurchase.findFirst({
    where: { userId, problemId, tier },
  });
  if (existing)
    return NextResponse.json({ error: "Already purchased" }, { status: 400 });

  // Check for hint discount
  const [discountsBought, discountsUsed] = await Promise.all([
    prisma.starTransaction.count({
      where: { userId, reason: "HINT_DISCOUNT_PURCHASE" },
    }),
    prisma.starTransaction.count({
      where: { userId, reason: "HINT_DISCOUNT_USED" as any },
    }),
  ]);
  const hasDiscount = discountsBought - discountsUsed > 0;
  const cost = Math.max(0, hint.cost - (hasDiscount ? 1 : 0));

  // Check stars
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stars: true },
  });
  if (!user || user.stars < cost) {
    return NextResponse.json({ error: "Not enough stars" }, { status: 400 });
  }

  // Deduct stars, record purchase, consume discount if used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { stars: { decrement: cost } },
    }),
    prisma.hintPurchase.create({
      data: { userId, problemId, tier, cost },
    }),
    prisma.starTransaction.create({
      data: { userId, amount: -cost, reason: "HINT_PURCHASE" },
    }),
    ...(hasDiscount
      ? [
          prisma.starTransaction.create({
            data: { userId, amount: 0, reason: "HINT_DISCOUNT_USED" as any },
          }),
        ]
      : []),
  ]);

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { stars: true },
  });

  return NextResponse.json({
    content: hint.content,
    tier,
    starsRemaining: updatedUser?.stars ?? 0,
    discountApplied: hasDiscount,
  });
}
