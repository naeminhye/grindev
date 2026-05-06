import type { Difficulty, PreferredDifficulty } from "@prisma/client";

const DIFFICULTY_ORDER: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

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
 * Returns the note shown in settings when user changes preferred difficulty.
 */
export function getDifficultyNote(preferred: PreferredDifficulty): string {
  if (preferred === "ANY") {
    return "You'll get a random problem each day.";
  }
  return `You'll get ${preferred.charAt(0) + preferred.slice(1).toLowerCase()} problems when available. If none are scheduled, you'll get the closest difficulty instead.`;
}
