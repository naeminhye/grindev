import type { Difficulty, PreferredDifficulty } from "@prisma/client";

const DIFFICULTY_ORDER: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * Given a user's preferred difficulty and the available difficulties for today,
 * returns the best matching difficulty.
 *
 * Rules:
 * - ANY → random pick from available
 * - Exact match → use it
 * - No exact match → pick closest (prefer easier if tied)
 */
export function pickBestDifficulty(
  preferred: PreferredDifficulty,
  available: Difficulty[],
): Difficulty | null {
  if (available.length === 0) return null;

  if (preferred === "ANY") {
    return available[Math.floor(Math.random() * available.length)];
  }

  const target = preferred as Difficulty;

  if (available.includes(target)) return target;

  const sorted = [...available].sort((a, b) => {
    const da = Math.abs(
      DIFFICULTY_ORDER.indexOf(a) - DIFFICULTY_ORDER.indexOf(target),
    );
    const db = Math.abs(
      DIFFICULTY_ORDER.indexOf(b) - DIFFICULTY_ORDER.indexOf(target),
    );
    if (da !== db) return da - db;
    // Tie → prefer easier
    return DIFFICULTY_ORDER.indexOf(a) - DIFFICULTY_ORDER.indexOf(b);
  });

  return sorted[0];
}

/**
 * Returns the localized note shown in settings
 * when user changes preferred difficulty.
 */
export function getDifficultyNote(
  preferred: PreferredDifficulty,
  t: Translate,
): string {
  if (preferred === "ANY") {
    return t("settings.difficultyNotes.any");
  }

  const difficultyKey = preferred.toLowerCase();

  return t("settings.difficultyNotes.specific", {
    difficulty: t(`settings.difficultyNotes.${difficultyKey}`),
  });
}
