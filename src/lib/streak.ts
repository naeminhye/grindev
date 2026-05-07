import { isYesterday, isToday, parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { prisma } from "./prisma";

/**
 * Get today's date string in the user's timezone.
 * Falls back to UTC if no timezone provided.
 */
export function getTodayInTz(timeZone = "UTC"): string {
  try {
    return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
  } catch {
    return formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
  }
}

/**
 * Legacy — used by server-side routes that don't have user timezone.
 * Use getTodayInTz() with the user's timezone when available.
 */
export function getTodayUTC(): string {
  return formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd");
}

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
    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: 0 },
    });
  }
}
