import { subDays, addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { StarTransactionReason } from "@prisma/client";

export function getTodayInTz(timeZone = "UTC"): string {
  return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
}

export function getDateStr(date: Date, timeZone = "UTC"): string {
  return formatInTimeZone(date, timeZone, "yyyy-MM-dd");
}

function yesterdayInTz(timeZone = "UTC"): string {
  return formatInTimeZone(subDays(new Date(), 1), timeZone, "yyyy-MM-dd");
}

/**
 * Recalculates streak from full solve history including makeup dates.
 * Counts both DSA solves (using makeupDate if isMakeup) and quiz attempts.
 */
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

  const [solves, quizAttempts] = await Promise.all([
    prisma.solve.findMany({
      where: { userId, passed: true },
      select: { solvedAt: true, isMakeup: true, makeupDate: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      select: { solvedAt: true, isMakeup: true, makeupDate: true },
    }),
  ]);

  const activeDates = new Set<string>();
  for (const s of [...solves, ...quizAttempts]) {
    if (s.isMakeup && s.makeupDate) activeDates.add(s.makeupDate);
    else activeDates.add(getDateStr(s.solvedAt, timeZone));
  }

  const today = getTodayInTz(timeZone);
  const yesterday = yesterdayInTz(timeZone);
  const sortedDesc = [...activeDates].sort().reverse();

  // Current streak — consecutive days ending today or yesterday
  let currentStreak = 0;
  const startsRecent = sortedDesc[0] === today || sortedDesc[0] === yesterday;
  if (startsRecent) {
    let check = sortedDesc[0];
    for (const date of sortedDesc) {
      if (date === check) {
        currentStreak++;
        check = formatInTimeZone(
          subDays(new Date(check), 1),
          timeZone,
          "yyyy-MM-dd",
        );
      } else break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let temp = 0;
  let prev: string | null = null;
  for (const date of [...sortedDesc].reverse()) {
    if (!prev) temp = 1;
    else {
      const expected = formatInTimeZone(
        addDays(new Date(prev), 1),
        timeZone,
        "yyyy-MM-dd",
      );
      temp = date === expected ? temp + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, temp);
    prev = date;
  }

  longestStreak = Math.max(longestStreak, user.longestStreak);
  const isNewRecord = currentStreak > user.longestStreak;

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak,
      ...(currentStreak > 0
        ? {
            streakStatus: "ACTIVE",
            streakAtRiskDate: null,
            streakAtRiskSince: null,
          }
        : {}),
    },
  });

  return { currentStreak, longestStreak, isNewRecord };
}

/**
 * Checks the user's streak status on login.
 * - If solved today: ACTIVE
 * - If solved yesterday: ACTIVE (still alive, just hasn't done today yet)
 * - If last solved 2 days ago: AT_RISK (missed yesterday)
 * - If last solved 3+ days ago: BROKEN (will reset on next solve)
 *
 * Should be called on every authenticated route (e.g. in daily route).
 */
export async function checkStreakStatus(
  userId: string,
  timeZone = "UTC",
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.lastSolvedAt) return;

  const today = getTodayInTz(timeZone);
  const yesterday = yesterdayInTz(timeZone);
  const dayBeforeYesterday = formatInTimeZone(
    subDays(new Date(), 2),
    timeZone,
    "yyyy-MM-dd",
  );

  const lastSolvedDay = getDateStr(user.lastSolvedAt, timeZone);

  // Clear stale skip/skipProblem from previous days
  if (user.skipRequestedAt) {
    const skipDate = getDateStr(user.skipRequestedAt, timeZone);
    if (skipDate !== today) {
      await prisma.user.update({
        where: { id: userId },
        data: { skipRequestedAt: null, skippedProblemId: null },
      });
    }
  }

  // ── Status transitions ────────────────────────────────────────────────

  // If user is FROZEN and has now solved today, thaw → ACTIVE
  if (user.streakStatus === "FROZEN" && lastSolvedDay === today) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        streakStatus: "ACTIVE",
        streakAtRiskSince: null,
        streakAtRiskDate: null,
        frozenStreakValue: 0,
      },
    });
    return;
  }

  // If user is FROZEN but still hasn't solved today, stay FROZEN
  // (the frozen state persists for one day — they have today to solve)
  if (user.streakStatus === "FROZEN") {
    // If they haven't solved today AND it's now past today (e.g. tomorrow),
    // the frozen streak breaks
    if (lastSolvedDay !== today && lastSolvedDay !== yesterday) {
      // Frozen state expired — reset
      await prisma.user.update({
        where: { id: userId },
        data: {
          streakStatus: "BROKEN",
          currentStreak: 0,
          frozenStreakValue: 0,
          streakAtRiskDate: null,
          streakAtRiskSince: null,
        },
      });
    }
    return;
  }

  // If user is AT_RISK
  if (user.streakStatus === "AT_RISK") {
    // If user solved today, they've broken the at-risk by continuing — resolve it
    if (lastSolvedDay === today) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          streakStatus: "ACTIVE",
          streakAtRiskDate: null,
          streakAtRiskSince: null,
        },
      });
      return;
    }

    const atRiskDate = user.streakAtRiskDate;
    if (atRiskDate) {
      const daysPast = Math.floor(
        (new Date(today).getTime() - new Date(atRiskDate).getTime()) / 86400000,
      );
      if (daysPast >= 2) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            streakStatus: "BROKEN",
            currentStreak: 0,
            streakAtRiskDate: null,
            streakAtRiskSince: null,
          },
        });
        return;
      }
    }
    // Still AT_RISK — do nothing
    return;
  }

  // With — only check for ACTIVE status, not streak value:
  if (user.streakStatus === "ACTIVE") {
    // But only show modal if there's something worth protecting
    // i.e. user has a shield AND missed days (even if streak already shows 0)
    const [purchased, used] = await Promise.all([
      prisma.starTransaction.count({
        where: { userId, reason: "STREAK_FREEZE_PURCHASE" },
      }),
      prisma.starTransaction.count({
        where: {
          userId,
          reason: "STREAK_FREEZE_USED" as StarTransactionReason,
        },
      }),
    ]);
    const hasShield = purchased - used > 0;

    const missedDays = lastSolvedDay !== today && lastSolvedDay !== yesterday;

    if (!missedDays) return; // solved today or yesterday — all good

    if (lastSolvedDay === dayBeforeYesterday || hasShield) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          streakStatus: "AT_RISK",
          streakAtRiskSince: new Date(),
          streakAtRiskDate: yesterday,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          streakStatus: "BROKEN",
          currentStreak: 0,
          streakAtRiskDate: null,
          streakAtRiskSince: null,
        },
      });
    }
  }
}

/**
 * Called after a successful makeup solve. If the makeup date matches
 * the at-risk date, the streak is restored (status → ACTIVE).
 */
export async function resolveAtRiskAfterMakeup(
  userId: string,
  makeupDate: string,
  timeZone = "UTC",
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  if (user.streakStatus === "AT_RISK" && user.streakAtRiskDate === makeupDate) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        streakStatus: "ACTIVE",
        streakAtRiskDate: null,
        streakAtRiskSince: null,
      },
    });
    // Recalculate streak — makeup now counts
    await recalculateStreak(userId, timeZone);
  }
}

/**
 * Legacy alias — kept for backward compat. Now delegates to checkStreakStatus.
 */
export async function checkAndResetStreak(
  userId: string,
  timeZone = "UTC",
): Promise<void> {
  await checkStreakStatus(userId, timeZone);
}
