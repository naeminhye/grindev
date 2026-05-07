import type { Difficulty } from "@prisma/client";

export type ChallengeMode = "NORMAL" | "HARD";

// Time limits in seconds for Hard mode
export const TIME_LIMITS: Record<Difficulty, number> = {
  EASY: 15 * 60, // 15 minutes
  MEDIUM: 30 * 60, // 30 minutes
  HARD: 45 * 60, // 45 minutes
};

export type StarRewardConfig = {
  STARS_NORMAL_CLEAN_EASY: number;
  STARS_NORMAL_CLEAN_MEDIUM: number;
  STARS_NORMAL_CLEAN_HARD: number;
  STARS_NORMAL_HINTS_EASY: number;
  STARS_NORMAL_HINTS_MEDIUM: number;
  STARS_NORMAL_HINTS_HARD: number;
  STARS_HARD_CLEAN_EASY: number;
  STARS_HARD_CLEAN_MEDIUM: number;
  STARS_HARD_CLEAN_HARD: number;
  STARS_HARD_HINTS_EASY: number;
  STARS_HARD_HINTS_MEDIUM: number;
  STARS_HARD_HINTS_HARD: number;
  STARS_TIME_EXPIRED_PENALTY: number;
};

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
  difficulty,
  config,
}: {
  mode: "NORMAL" | "HARD";
  passed: boolean;
  usedHints: boolean;
  timeExpired: boolean;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  config: StarRewardConfig;
}): number {
  if (!passed) return 0;

  const modeKey = mode === "HARD" ? "HARD" : "NORMAL";
  const solveKey = usedHints ? "HINTS" : "CLEAN";
  const key =
    `STARS_${modeKey}_${solveKey}_${difficulty}` as keyof StarRewardConfig;

  let delta = config[key];

  if (mode === "HARD" && timeExpired) {
    delta += config.STARS_TIME_EXPIRED_PENALTY;
  }

  return delta;
}
