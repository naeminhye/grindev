import { prisma } from "./prisma";
import type { StarTransactionReason } from "@prisma/client";

const STREAK_MILESTONES: Record<number, number> = {
  7: 10,
  14: 10,
  21: 10,
  30: 30,
  60: 30,
  90: 50,
  180: 100,
  365: 200,
};

export const STREAK_FREEZE_COST = 20;
export const PROBLEM_SKIP_COST = 10;
export const DAILY_LOGIN_BONUS = 1;
export const FIRST_SOLVE_BONUS = 5;

/**
 * Add or subtract stars from a user, logging the transaction.
 * Returns the new star total.
 */
export async function adjustStars(
  userId: string,
  amount: number,
  reason: StarTransactionReason,
  meta?: Record<string, unknown>,
): Promise<number> {
  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { stars: { increment: amount } },
    }),
    prisma.starTransaction.create({
      data: { userId, amount, reason, meta: meta ?? undefined },
    }),
  ]);
  return Math.max(0, user.stars);
}

/**
 * Check if this solve hits a streak milestone and award bonus stars.
 * Returns the milestone bonus (0 if no milestone).
 */
export async function checkStreakMilestone(
  userId: string,
  streak: number,
): Promise<number> {
  const bonus = STREAK_MILESTONES[streak] ?? 0;
  if (bonus === 0) return 0;

  await adjustStars(userId, bonus, "STREAK_MILESTONE", { streak });
  return bonus;
}

/**
 * Award daily login bonus if not already given today.
 * Returns stars awarded (0 if already given).
 */
export async function checkDailyLoginBonus(
  userId: string,
  today: string,
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastLoginBonus: true },
  });

  if (user?.lastLoginBonus === today) return 0;

  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginBonus: today },
  });

  await adjustStars(userId, DAILY_LOGIN_BONUS, "DAILY_LOGIN_BONUS", {
    date: today,
  });
  return DAILY_LOGIN_BONUS;
}

/**
 * Award first solve bonus if user has never solved before.
 * Returns bonus stars (0 if not first solve).
 */
export async function checkFirstSolveBonus(userId: string): Promise<number> {
  const count = await prisma.solve.count({
    where: { userId, passed: true },
  });

  if (count !== 1) return 0; // only fires when count goes from 0→1

  await adjustStars(userId, FIRST_SOLVE_BONUS, "FIRST_SOLVE_BONUS");
  return FIRST_SOLVE_BONUS;
}
