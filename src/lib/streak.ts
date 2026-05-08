// import { isYesterday, isToday, parseISO } from "date-fns";
import { prisma } from "./prisma";
import { formatInTimeZone } from "date-fns-tz";
import { subDays } from "date-fns";

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

function getTodayStr(timeZone: string) {
  return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
}

function getDateStr(date: Date, timeZone: string) {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

export async function checkAndResetStreak(userId: string, timeZone = "UTC") {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.lastSolvedAt) return;

  const today = getTodayStr(timeZone);
  const yesterday = formatInTimeZone(
    subDays(new Date(), 1),
    timeZone,
    "yyyy-MM-dd",
  );
  const lastSolvedDay = getDateStr(user.lastSolvedAt, timeZone);

  console.log("[streak check]", {
    today,
    yesterday,
    lastSolvedDay,
    timeZone,
    currentStreak: user.currentStreak,
  });

  const missedYesterday =
    lastSolvedDay !== today && lastSolvedDay !== yesterday;
  if (missedYesterday && user.currentStreak > 0) {
    console.log("[streak reset] resetting to 0");
    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: 0 },
    });
  }
}

export async function updateStreak(
  userId: string,
  timeZone = "UTC",
): Promise<{
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const today = getTodayStr(timeZone);
  const yesterday = formatInTimeZone(
    subDays(new Date(), 1),
    timeZone,
    "yyyy-MM-dd",
  );

  if (user.lastSolvedAt) {
    const lastSolvedDay = getDateStr(user.lastSolvedAt, timeZone);
    if (lastSolvedDay === today) {
      return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        isNewRecord: false,
      };
    }
  }

  const newStreak =
    user.lastSolvedAt && getDateStr(user.lastSolvedAt, timeZone) === yesterday
      ? user.currentStreak + 1
      : 1;

  const newLongest = Math.max(newStreak, user.longestStreak);
  const isNewRecord = newStreak > user.longestStreak;

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastSolvedAt: new Date(),
    },
  });

  return { currentStreak: newStreak, longestStreak: newLongest, isNewRecord };
}
