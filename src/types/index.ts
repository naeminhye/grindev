import type { Difficulty, Topic } from "@prisma/client";
import type { Language } from "@/lib/languages";
import type { MakeupDay } from "@/lib/makeup";
import { ChallengeMode } from "@/lib/challenge";

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

export interface ProblemHint {
  tier: number;
  cost: number;
  content: string | null;
}

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
  sourceName?: string | null;
  sourceUrl?: string | null;
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
  streakStatus?: "ACTIVE" | "AT_RISK" | "FROZEN" | "BROKEN";
  frozenStreakValue?: number;
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
  hintDiscount: number;
  explainCost: number;
  reviewCost: number;
  starRewards?: Record<string, number>;
  doubleStarsActive?: boolean;
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
  hintDiscount?: number;
  explainCost?: number;
  reviewCost?: number;
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

/////////////////////////////////////////////////////////////////////

// Add to src/types/index.ts

export type QuizQuestion = {
  question: string;
  code?: string; // optional code block
  options: string[]; // exactly 4
  correctIndex: number; // 0–3
  explanation?: string; // shown after answering
};

export type PublicQuiz = {
  id: string;
  title: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questions: QuizQuestion[];
};

export type QuizAnswer = {
  questionIndex: number;
  selectedIndex: number;
};

export type QuizSubmitResponse = {
  passed: boolean;
  score: number;
  total: number;
  starDelta: number;
  results: {
    questionIndex: number;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation?: string;
  }[];
  streak?: {
    currentStreak: number;
    longestStreak: number;
    isNewRecord: boolean;
  };
};

export type DailyQuizResponse = {
  quiz: PublicQuiz;
  alreadySolved: boolean;
  makeupDays: MakeupDay[];
  makeupRewardGivenToday: boolean;
  userStats: UserStats;
  hardTimeLimits?: never; // not used for quiz
};

export type NoDailyQuizResponse = {
  noQuizToday: true;
  bonusStars: number;
  bonusAlreadyGiven: boolean;
  userStats: UserStats;
};

export type PreferredDifficulty = "ANY" | "EASY" | "MEDIUM" | "HARD";

export type Settings = {
  challengeMode: ChallengeMode;
  preferredDifficulty: PreferredDifficulty;
  practiceMode: "DSA" | "QUIZ";
};
