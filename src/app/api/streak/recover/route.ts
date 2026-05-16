import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";
import { StarTransactionReason } from "@prisma/client";

const STREAK_SHIELD_COST = 20;

const schema = z.object({
  action: z.enum(["USE_SHIELD", "BUY_AND_USE_SHIELD", "DISMISS"]),
});

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { action } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Only AT_RISK users can use this endpoint for shield actions
  if (action !== "DISMISS" && user.streakStatus !== "AT_RISK") {
    return NextResponse.json(
      {
        error: "Your streak is not at risk.",
      },
      { status: 400 },
    );
  }

  // ── DISMISS — just acknowledge, doesn't change state ─────────────────
  if (action === "DISMISS") {
    // Frontend handles per-session dismissal via localStorage
    return NextResponse.json({ ok: true, dismissed: true });
  }

  // ── Calculate shield inventory ────────────────────────────────────────
  // Streak shield uses StarTransactionReason.STREAK_FREEZE_PURCHASE / STREAK_FREEZE_USED
  const [purchased, used] = await Promise.all([
    prisma.starTransaction.count({
      where: { userId, reason: "STREAK_FREEZE_PURCHASE" },
    }),
    prisma.starTransaction.count({
      where: { userId, reason: "STREAK_FREEZE_USED" as StarTransactionReason },
    }),
  ]);
  const inventory = Math.max(0, purchased - used);

  // ── USE_SHIELD — apply an existing shield ────────────────────────────
  if (action === "USE_SHIELD") {
    if (inventory <= 0) {
      return NextResponse.json(
        {
          error: "You don't have any Streak Shields. Purchase one first.",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          streakStatus: "FROZEN",
          frozenStreakValue: user.currentStreak,
          streakAtRiskSince: null,
          // Keep streakAtRiskDate for reference
        },
      }),
      prisma.starTransaction.create({
        data: {
          userId,
          amount: 0,
          reason: "STREAK_FREEZE_USED" as StarTransactionReason,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      newStatus: "FROZEN",
      frozenStreakValue: user.currentStreak,
      shieldsRemaining: inventory - 1,
    });
  }

  // ── BUY_AND_USE_SHIELD — purchase a shield and immediately apply it ──
  if (action === "BUY_AND_USE_SHIELD") {
    if (user.stars < STREAK_SHIELD_COST) {
      return NextResponse.json(
        {
          error: `Not enough stars. You need ${STREAK_SHIELD_COST}★ but only have ${user.stars}★.`,
          notEnoughStars: true,
          cost: STREAK_SHIELD_COST,
        },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: {
          stars: { decrement: STREAK_SHIELD_COST },
          streakStatus: "FROZEN",
          frozenStreakValue: user.currentStreak,
          streakAtRiskSince: null,
        },
      });
      await tx.starTransaction.create({
        data: {
          userId,
          amount: -STREAK_SHIELD_COST,
          reason: "STREAK_FREEZE_PURCHASE",
        },
      });
      await tx.starTransaction.create({
        data: {
          userId,
          amount: 0,
          reason: "STREAK_FREEZE_USED" as StarTransactionReason,
        },
      });
      return u;
    });

    return NextResponse.json({
      ok: true,
      newStatus: "FROZEN",
      frozenStreakValue: user.currentStreak,
      newBalance: updatedUser.stars,
      shieldsRemaining: inventory, // bought + used in one go, so unchanged
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// GET — return current at-risk state and shield inventory
export async function GET() {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [purchased, used] = await Promise.all([
    prisma.starTransaction.count({
      where: { userId, reason: "STREAK_FREEZE_PURCHASE" },
    }),
    prisma.starTransaction.count({
      where: { userId, reason: "STREAK_FREEZE_USED" as StarTransactionReason },
    }),
  ]);

  return NextResponse.json({
    streakStatus: user.streakStatus,
    streakAtRiskDate: user.streakAtRiskDate,
    streakAtRiskSince: user.streakAtRiskSince?.toISOString() ?? null,
    currentStreak: user.currentStreak,
    frozenStreakValue: user.frozenStreakValue,
    stars: user.stars,
    shieldInventory: Math.max(0, purchased - used),
    shieldCost: STREAK_SHIELD_COST,
  });
}
