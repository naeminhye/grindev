// No schema model changes needed — AppConfig key/value handles this.
// Keys used:
//
// Star rewards (per difficulty × mode × clean):
//   STARS_NORMAL_CLEAN_EASY, STARS_NORMAL_CLEAN_MEDIUM, STARS_NORMAL_CLEAN_HARD
//   STARS_NORMAL_HINTS_EASY, STARS_NORMAL_HINTS_MEDIUM, STARS_NORMAL_HINTS_HARD
//   STARS_HARD_CLEAN_EASY,   STARS_HARD_CLEAN_MEDIUM,   STARS_HARD_CLEAN_HARD
//   STARS_HARD_HINTS_EASY,   STARS_HARD_HINTS_MEDIUM,   STARS_HARD_HINTS_HARD
//   STARS_TIME_EXPIRED_PENALTY   (default: -2)
//
// Hard mode time limits (seconds):
//   HARD_TIME_EASY   (default: 900  = 15 min)
//   HARD_TIME_MEDIUM (default: 1800 = 30 min)
//   HARD_TIME_HARD   (default: 2700 = 45 min)
//
// Default values are used when key is not in AppConfig.

import { QUIZ_STAR_DEFAULTS } from "./quiz-rewards";

export const STAR_REWARD_DEFAULTS = {
  STARS_NORMAL_CLEAN_EASY: 3,
  STARS_NORMAL_CLEAN_MEDIUM: 4,
  STARS_NORMAL_CLEAN_HARD: 5,
  STARS_NORMAL_HINTS_EASY: 1,
  STARS_NORMAL_HINTS_MEDIUM: 2,
  STARS_NORMAL_HINTS_HARD: 3,
  STARS_HARD_CLEAN_EASY: 6,
  STARS_HARD_CLEAN_MEDIUM: 8,
  STARS_HARD_CLEAN_HARD: 10,
  STARS_HARD_HINTS_EASY: 2,
  STARS_HARD_HINTS_MEDIUM: 3,
  STARS_HARD_HINTS_HARD: 5,
  STARS_TIME_EXPIRED_PENALTY: -2,
} as const;

export const TIME_LIMIT_DEFAULTS = {
  HARD_TIME_EASY: 900,
  HARD_TIME_MEDIUM: 1800,
  HARD_TIME_HARD: 2700,
} as const;

export type StarRewardKey = keyof typeof STAR_REWARD_DEFAULTS;
export type TimeLimitKey = keyof typeof TIME_LIMIT_DEFAULTS;

export async function getConfigValue(
  prisma: any,
  key: string,
  defaultValue: number,
): Promise<number> {
  const config = await prisma.appConfig.findUnique({ where: { key } });
  return config ? parseInt(config.value) : defaultValue;
}

export async function getStarReward(
  prisma: any,
  key: StarRewardKey,
): Promise<number> {
  return getConfigValue(prisma, key, STAR_REWARD_DEFAULTS[key]);
}

export async function getTimeLimit(
  prisma: any,
  key: TimeLimitKey,
): Promise<number> {
  return getConfigValue(prisma, key, TIME_LIMIT_DEFAULTS[key]);
}

export const AI_COST_DEFAULTS = {
  AI_EXPLAIN_COST: 5,
  AI_CODE_REVIEW_COST: 5,
} as const;

export const allKeys = [
  ...Object.keys(STAR_REWARD_DEFAULTS),
  ...Object.keys(TIME_LIMIT_DEFAULTS),
  ...Object.keys(QUIZ_STAR_DEFAULTS),
  ...Object.keys(AI_COST_DEFAULTS),
];
