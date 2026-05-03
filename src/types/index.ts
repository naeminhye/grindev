import { Difficulty, Topic } from "@prisma/client";

export type HintData = {
  tier: 1 | 2 | 3 | 4;
  cost: number;
  content: string;
};

export type TestCase = {
  input: string;
  expected: string;
};

export type PublicProblem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  topic: Topic;
  starterCode: string;
};

export type TestResult = {
  index: number;
  passed: boolean;
  stderr: string;
  actual?: string;
  expected?: string;
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
};

export type ProfileStats = {
  totalSolves: number;
  cleanSolves: number;
  hardModeSolves: number;
  totalAttempts: number;
  currentStreak: number;
  longestStreak: number;
  stars: number;
  challengeMode: "NORMAL" | "HARD";
  topicBreakdown: { topic: string; count: number }[];
  difficultyBreakdown: { difficulty: string; count: number }[];
  recentActivity: { date: string; solved: boolean }[];
};
