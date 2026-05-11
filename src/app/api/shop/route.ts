import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";

export async function GET() {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  try {
    const [
      user,
      transactions,
      skipPurchased,
      skipUsed,
      hintDiscount,
      doubleStars,
      extraAttempt,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true, streakFreezeCount: true },
      }),
      prisma.starTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "PROBLEM_SKIP" },
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "PROBLEM_SKIP_USED" },
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "HINT_DISCOUNT_PURCHASE" },
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "DOUBLE_STARS_PURCHASE" },
      }),
      prisma.starTransaction.count({
        where: { userId, reason: "EXTRA_ATTEMPT_PURCHASE" },
      }),
    ]);

    // const [hintDiscountBought, hintDiscountUsed] = await Promise.all([
    //   prisma.starTransaction.count({
    //     where: { userId, reason: "HINT_DISCOUNT_PURCHASE" },
    //   }),
    //   prisma.starTransaction.count({
    //     where: { userId, reason: "HINT_DISCOUNT_USED" as any },
    //   }),
    // ]);

    const [hintPassBought, hintPassUsed] = await Promise.all([
      prisma.starTransaction.count({
        where: {
          userId,
          reason: 'HINT_DISCOUNT_PURCHASE',
          createdAt: { gte: new Date(new Date().toLocaleDateString('en-CA') + 'T00:00:00') },
        },
      }),
      prisma.starTransaction.count({
        where: {
          userId,
          reason: 'HINT_DISCOUNT_USED' as any,
          createdAt: { gte: new Date(new Date().toLocaleDateString('en-CA') + 'T00:00:00') },
        },
      }),
    ])


    const owned: Record<string, number> = {
      "streak-freeze": user?.streakFreezeCount ?? 0,
      "problem-skip": Math.max(0, skipPurchased - skipUsed),
      // "hint-discount": Math.max(0, hintDiscountBought - hintDiscountUsed),
      'hint-discount': Math.max(0, hintPassBought - hintPassUsed),
      "double-stars": doubleStars,
      "extra-attempt": extraAttempt,
    };

    return NextResponse.json({
      stars: user?.stars ?? 0,
      owned,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Shop GET error:", err);
    return NextResponse.json({ stars: 0, owned: {}, transactions: [] });
  }
}
