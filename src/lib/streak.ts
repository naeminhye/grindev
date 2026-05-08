// import { isYesterday, isToday, parseISO } from "date-fns";
import { prisma } from "./prisma";
import { formatInTimeZone } from "date-fns-tz";
import { addDays, subDays } from "date-fns";

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

export async function updateStreakForDate(
  userId: string,
  solveDate: string, // the date being made up e.g. '2026-05-06'
  timeZone = "UTC",
): Promise<{
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const today = getTodayInTz(timeZone);

  // If already solved today (normal solve), don't let makeup override lastSolvedAt
  const lastSolvedDay = user.lastSolvedAt
    ? getDateStr(user.lastSolvedAt, timeZone)
    : null;

  // Don't decrement streak if user already solved today
  if (lastSolvedDay === today) {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      isNewRecord: false,
    };
  }

  // For streak purposes, treat solveDate as the solved day
  const yesterday = formatInTimeZone(
    subDays(new Date(), 1),
    timeZone,
    "yyyy-MM-dd",
  );
  const dayBeforeYesterday = formatInTimeZone(
    subDays(new Date(), 2),
    timeZone,
    "yyyy-MM-dd",
  );

  // Extend streak if makeup date is yesterday or fills a gap
  const newStreak =
    lastSolvedDay === yesterday || lastSolvedDay === dayBeforeYesterday
      ? user.currentStreak + 1
      : user.currentStreak > 0
        ? user.currentStreak // makeup doesn't reset, just maintains
        : 1;

  const newLongest = Math.max(newStreak, user.longestStreak);
  const isNewRecord = newStreak > user.longestStreak;

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastSolvedAt: new Date(), // still use now for lastSolvedAt
    },
  });

  return { currentStreak: newStreak, longestStreak: newLongest, isNewRecord };
}

export async function recalculateStreak(
  userId: string,
  timeZone = "UTC",
): Promise<{
  currentStreak: number;
  longestStreak: number;
  isNewRecord: boolean;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // Get all active dates — normal solves use solvedAt date, makeup solves use makeupDate
  const solves = await prisma.solve.findMany({
    where: { userId, passed: true },
    select: { solvedAt: true, isMakeup: true, makeupDate: true },
  });

  // Also get passed quiz attempts
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId, passed: true },
    select: { solvedAt: true, isMakeup: true, makeupDate: true },
  });

  // Build set of active dates
  const activeDates = new Set<string>();
  for (const s of [...solves, ...quizAttempts]) {
    if (s.isMakeup && s.makeupDate) {
      activeDates.add(s.makeupDate); // use the date being made up
    } else {
      activeDates.add(getDateStr(s.solvedAt, timeZone));
    }
  }

  const today = getTodayInTz(timeZone);
  const sortedDates = [...activeDates].sort().reverse(); // newest first

  // Calculate current streak — consecutive days ending today or yesterday
  let currentStreak = 0;
  const todayOrYesterday =
    sortedDates[0] === today ||
    sortedDates[0] ===
      formatInTimeZone(subDays(new Date(), 1), timeZone, "yyyy-MM-dd");

  if (todayOrYesterday) {
    let checkDate = sortedDates[0];
    for (const date of sortedDates) {
      if (date === checkDate) {
        currentStreak++;
        checkDate = formatInTimeZone(
          subDays(new Date(checkDate), 1),
          timeZone,
          "yyyy-MM-dd",
        );
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const date of [...sortedDates].reverse()) {
    // oldest first
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const expected = formatInTimeZone(
        addDays(new Date(prevDate), 1),
        timeZone,
        "yyyy-MM-dd",
      );
      tempStreak = date === expected ? tempStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prevDate = date;
  }

  const isNewRecord = currentStreak > user.longestStreak;

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak: Math.max(longestStreak, user.longestStreak),
    },
  });

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, user.longestStreak),
    isNewRecord,
  };
}
