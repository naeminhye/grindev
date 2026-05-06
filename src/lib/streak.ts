import { format, isYesterday, isToday } from "date-fns";
import { prisma } from "./prisma";
import { adjustStars } from "./stars";

export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const lastSolved = user.lastSolvedAt;

  if (lastSolved && isToday(lastSolved)) {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      isNewRecord: false,
    };
  }

  const newStreak =
    lastSolved && isYesterday(lastSolved) ? user.currentStreak + 1 : 1;

  const newLongest = Math.max(newStreak, user.longestStreak);
  const isNewRecord = newStreak > user.longestStreak;

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastSolvedAt: now,
    },
  });

  return { currentStreak: newStreak, longestStreak: newLongest, isNewRecord };
}

export async function checkAndResetStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.lastSolvedAt) return;

  const lastSolved = user.lastSolvedAt;
  const missedYesterday = !isToday(lastSolved) && !isYesterday(lastSolved);

  if (missedYesterday && user.currentStreak > 0) {
    // Use a freeze if available
    if (user.streakFreezeCount > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { streakFreezeCount: { decrement: 1 } },
      });
      // Log freeze usage (no star change — freeze was already paid for)
      await prisma.starTransaction.create({
        data: {
          userId,
          amount: 0,
          reason: "STREAK_MILESTONE",
          meta: { type: "freeze_used" },
        },
      });
      // Don't reset streak
      return;
    }

    // No freeze — reset streak
    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: 0 },
    });
  }
}

export function getTodayUTC(): string {
  return format(new Date(), "yyyy-MM-dd");
}
