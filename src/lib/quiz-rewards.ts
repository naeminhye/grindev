export const QUIZ_STAR_DEFAULTS = {
  QUIZ_STARS_PERFECT: 5, // 100%
  QUIZ_STARS_GREAT: 3, // 80-99%
  QUIZ_STARS_PASS: 1, // 60-79%
  QUIZ_PASS_THRESHOLD: 60, // % needed to "pass"
} as const;

export type QuizStarKey = keyof typeof QUIZ_STAR_DEFAULTS;

export function calculateQuizStars(
  score: number,
  total: number,
  config: Record<string, number> = {},
): number {
  if (total === 0) return 0;
  const pct = Math.round((score / total) * 100);

  const perfect =
    config["QUIZ_STARS_PERFECT"] ?? QUIZ_STAR_DEFAULTS.QUIZ_STARS_PERFECT;
  const great =
    config["QUIZ_STARS_GREAT"] ?? QUIZ_STAR_DEFAULTS.QUIZ_STARS_GREAT;
  const pass = config["QUIZ_STARS_PASS"] ?? QUIZ_STAR_DEFAULTS.QUIZ_STARS_PASS;

  if (pct === 100) return perfect;
  if (pct >= 80) return great;
  if (pct >= 60) return pass;
  return 0;
}

export function quizPassed(
  score: number,
  total: number,
  threshold?: number,
): boolean {
  if (total === 0) return false;
  const pct = Math.round((score / total) * 100);
  return pct >= (threshold ?? QUIZ_STAR_DEFAULTS.QUIZ_PASS_THRESHOLD);
}
