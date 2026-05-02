import { format, isYesterday, isToday, parseISO } from 'date-fns'
import { prisma } from './prisma'

/**
 * Call this after a successful solve.
 * Handles streak increment, reset, and longest streak tracking.
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number
  longestStreak: number
  isNewRecord: boolean
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) throw new Error('User not found')

  const now = new Date()
  const lastSolved = user.lastSolvedAt

  // Already solved today — don't double count
  if (lastSolved && isToday(lastSolved)) {
    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      isNewRecord: false,
    }
  }

  // Solved yesterday → extend streak
  // Solved longer ago → reset to 1
  const newStreak =
    lastSolved && isYesterday(lastSolved)
      ? user.currentStreak + 1
      : 1

  const newLongest = Math.max(newStreak, user.longestStreak)
  const isNewRecord = newStreak > user.longestStreak

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastSolvedAt: now,
    },
  })

  return { currentStreak: newStreak, longestStreak: newLongest, isNewRecord }
}

/**
 * On app load / login, check if the streak should be reset
 * because the user missed yesterday.
 */
export async function checkAndResetStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.lastSolvedAt) return

  const lastSolved = user.lastSolvedAt
  const missedYesterday = !isToday(lastSolved) && !isYesterday(lastSolved)

  if (missedYesterday && user.currentStreak > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentStreak: 0 },
    })
  }
}

/**
 * Get today's date string in UTC — used for DailyProblem lookup.
 */
export function getTodayUTC(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
