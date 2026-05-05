import type { Difficulty, Prisma, Topic } from "@prisma/client";
import type { Language } from "@/lib/languages";
import type { MakeupDay } from "@/lib/makeup";

export type HintData = {
  tier: 1 | 2 | 3 | 4;
  cost: number;
  content: string;
};

export type TestCase = {
  input: string;
  expected: string;
};

// export type ProblemTestCase = {
//   input: unknown;
//   expected: unknown;
//   hidden?: boolean;
// };

export type StarterCode = Record<Language, string>;
// export type ProblemStarterCode = Partial<
//   Record<"JAVASCRIPT" | "TYPESCRIPT" | "PYTHON" | "CPP" | "JAVA", string>
// >;

export type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

export type PublicProblem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string;
  difficulty: Difficulty;
  topics: Topic[];
  starterCode: StarterCode;
};

export type TestResult = {
  index: number;
  passed: boolean;
  stderr: string;
  actual?: string;
  expected?: string;
  input?: string;
};

export type SolveResponse = {
  passed: boolean;
  results: TestResult[];
  starDelta?: number;
  streak?: {
    currentStreak: number;
    longestStreak: number;
    isNewRecord: boolean;
  };
};

export type HintResponse = {
  content: string;
  tier: number;
  starsRemaining: number;
};

export type UserStats = {
  currentStreak: number;
  longestStreak: number;
  stars: number;
  lastSolvedAt: string | null;
};

export type DailyResponse = {
  problem: PublicProblem;
  alreadySolved: boolean;
  hintsUnlocked: number[];
  unlockedHintContents: Record<number, string>;
  userStats: UserStats;
  makeupDays: MakeupDay[]; // available makeup tasks
  makeupRewardGivenToday: boolean; // whether star reward already given today
};

export type MakeupProblemResponse = {
  problem: PublicProblem;
  date: string;
  daysAgo: number;
  starCost: number;
  alreadySolved: boolean;
  hintsUnlocked: number[];
  unlockedHintContents: Record<number, string>;
  makeupRewardGivenToday: boolean;
  userStats: UserStats;
};

export type ProfileStats = {
  totalSolves: number;
  cleanSolves: number;
  hardModeSolves: number;
  makeupSolves: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
  stars: number;
  challengeMode: "NORMAL" | "HARD";
  topicBreakdown: { topic: string; count: number }[];
  difficultyBreakdown: { difficulty: string; count: number }[];
  recentActivity: { date: string; solved: boolean; isMakeup: boolean }[];
};

// TODO: move to utils
export function parseProblemExamples(
  value: Prisma.JsonValue,
): ProblemExample[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Prisma.JsonObject => {
      return typeof item === "object" && item !== null && !Array.isArray(item);
    })
    .map((item) => ({
      input: typeof item.input === "string" ? item.input : "",
      output: typeof item.output === "string" ? item.output : "",
      explanation:
        typeof item.explanation === "string" ? item.explanation : undefined,
    }))
    .filter((example) => example.input && example.output);
}
