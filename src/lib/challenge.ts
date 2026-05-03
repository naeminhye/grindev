import type { Difficulty } from "@prisma/client";

export type ChallengeMode = "NORMAL" | "HARD";

// Time limits in seconds for Hard mode
export const TIME_LIMITS: Record<Difficulty, number> = {
  EASY: 15 * 60, // 15 minutes
  MEDIUM: 30 * 60, // 30 minutes
  HARD: 45 * 60, // 45 minutes
};

// Star rewards
export const STAR_REWARDS = {
  NORMAL: {
    clean: 3, // passed, no hints
    hints: 1, // passed, used hints
  },
  HARD: {
    clean: 8, // passed, no hints, within time
    hints: 3, // passed, used hints, within time
    timeExpired: -2, // deducted if time exceeded (applied on top of reward)
  },
};

export function getTimeLimit(difficulty: Difficulty): number {
  return TIME_LIMITS[difficulty];
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function calculateStarDelta({
  mode,
  passed,
  usedHints,
  timeExpired,
}: {
  mode: ChallengeMode;
  passed: boolean;
  usedHints: boolean;
  timeExpired: boolean;
}): number {
  if (!passed) return 0;

  if (mode === "NORMAL") {
    return usedHints ? STAR_REWARDS.NORMAL.hints : STAR_REWARDS.NORMAL.clean;
  }

  // Hard mode
  const base = usedHints ? STAR_REWARDS.HARD.hints : STAR_REWARDS.HARD.clean;
  const penalty = timeExpired ? STAR_REWARDS.HARD.timeExpired : 0;
  return base + penalty; // penalty is negative
}
