import type { Difficulty, Topic } from "@prisma/client";
import type { Language } from "@/lib/languages";
import type { MakeupDay } from "@/lib/makeup";

export type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

export type HintData = {
  tier: 1 | 2 | 3 | 4;
  cost: number;
  content: string;
};

export type TestCase = {
  input: string;
  expected: string;
};

export type StarterCode = Record<Language, string>;

export type PublicProblem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  examples: ProblemExample[];
  constraints: string;
  difficulty: Difficulty;
  topics: Topic[];
  functionName: string;
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
  milestoneBonus?: number; // extra stars from streak milestone
  firstSolveBonus?: number; // extra stars for first ever solve
  streak?: {
    currentStreak: number;
    longestStreak: number;
    isNewRecord: boolean;
  };
  isTrialRun?: boolean;
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
  streakFreezeCount: number;
};

export type DailyResponse = {
  problem: PublicProblem;
  difficultyNote: string | null;
  alreadySolved: boolean;
  hintsUnlocked: number[];
  unlockedHintContents: Record<number, string>;
  makeupDays: MakeupDay[];
  makeupRewardGivenToday: boolean;
  loginBonus: number; // 0 if already received today
  userStats: UserStats;
  skipCount: number;
  hardTimeLimits: { EASY: number; MEDIUM: number; HARD: number };
};

export type NoProblemResponse = {
  noProblemToday: true;
  bonusStars: number;
  bonusAlreadyGiven: boolean;
  loginBonus: number;
  userStats: UserStats;
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
  streakFreezeCount: number;
  challengeMode: "NORMAL" | "HARD";
  topicBreakdown: { topic: string; count: number }[];
  difficultyBreakdown: { difficulty: string; count: number }[];
  recentActivity: { date: string; solved: boolean; isMakeup: boolean }[];
};
