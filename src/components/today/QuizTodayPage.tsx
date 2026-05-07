"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StarCount } from "@/components/ui/StarCount";
import { StreakBadge } from "@/components/streak/StreakBadge";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { NoProblemScreen } from "@/components/ui/NoProblemScreen";
import { QuizPanel } from "@/components/quiz/QuizPanel";
import { QuizResultModal } from "@/components/quiz/QuizResultModal";
import {
  QuizTopicSelector,
  type QuizTopic,
} from "@/components/quiz/QuizTopicSelector";
import { MakeupCard } from "@/components/problem/MakeupCard";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { QuizAnswer, QuizSubmitResponse } from "@/types";

const TOPIC_LABELS: Record<string, string> = {
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  PYTHON: "Python",
  CSS: "CSS",
  HTML: "HTML",
  REACT: "React",
  NODE: "Node.js",
  DATABASES: "Databases",
  SYSTEM_DESIGN: "System Design",
  GENERAL_CS: "General CS",
};

type QuizData = {
  quiz: {
    id: string;
    title: string;
    topic: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    questions: any[];
  };
  alreadySolved: boolean;
  allTopicsDone: boolean;
  userStats: {
    currentStreak: number;
    longestStreak: number;
    stars: number;
    lastSolvedAt: string | null;
  };
};

type PageState =
  | "loading"
  | "topic-select"
  | "ready"
  | "submitting"
  | "solved"
  | "error";

export default function QuizTodayPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [stars, setStars] = useState(0);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [preferredTopic, setPreferredTopic] = useState<QuizTopic | null>(null);
  const [savingTopic, setSavingTopic] = useState(false);
  const [totalSolvedToday, setTotalSolvedToday] = useState(0);

  // ── Load quiz + settings ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/daily-quiz").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([quizRes, settingsRes]) => {
        setPreferredTopic(settingsRes.preferredQuizTopic ?? null);
        setStars(quizRes.userStats?.stars ?? 0);
        setQuizData(quizRes);
        // Always show topic selector first so user can change before starting
        setPageState("topic-select");
      })
      .catch(() => setPageState("error"));
  }, []);

  // ── Start quiz with current topic ────────────────────────────────────
  async function handleStartQuiz() {
    setPageState("loading");
    const res = await fetch("/api/daily-quiz").then((r) => r.json());
    setQuizData(res);
    setStars(res.userStats?.stars ?? stars);
    setPageState("ready");
  }

  // ── Save topic preference + reload quiz ──────────────────────────────
  async function handleTopicChange(topic: QuizTopic | null) {
    setPreferredTopic(topic);
    setSavingTopic(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredQuizTopic: topic }),
    });
    setSavingTopic(false);
    // Reload quiz with new topic
    const res = await fetch("/api/daily-quiz").then((r) => r.json());
    setQuizData(res);
    setStars(res.userStats?.stars ?? stars);
  }

  // ── Submit answers ───────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (answers: QuizAnswer[]) => {
      if (!quizData || pageState === "submitting") return;
      setPageState("submitting");

      try {
        const res = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quizData.quiz.id, answers }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error);
          setPageState("ready");
          return;
        }

        const submitResult: QuizSubmitResponse = await res.json();
        setResult(submitResult);
        setTotalSolvedToday((n) => n + 1);

        if (submitResult.starDelta > 0) {
          setStars((s) => s + submitResult.starDelta);
        }

        setShowResultModal(true);
        setPageState(submitResult.passed ? "solved" : "ready");
      } catch {
        setPageState("ready");
      }
    },
    [quizData, pageState],
  );

  // ── After modal confirm — offer next quiz ────────────────────────────
  function handleModalConfirm() {
    setShowResultModal(false);
    if (result?.passed) {
      setPageState("topic-select"); // go back to topic select to pick next
    }
    // If failed, stay on ready (QuizPanel resets internally or user retries)
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 font-mono text-sm">
          <i className="ri-loader-4-line animate-spin text-lime-400" />
          Loading quiz...
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="ri-error-warning-line text-4xl text-red-400" />
          <p className="font-mono text-sm text-zinc-400">
            No quizzes available.
          </p>
        </div>
      </div>
    );
  }

  const userStats = quizData?.userStats;

  // ── Topic selection screen ────────────────────────────────────────────
  if (pageState === "topic-select") {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <i className="ri-questionnaire-line text-lime-400" />
            <h1 className="font-heading font-bold text-sm md:text-base">
              Knowledge Quiz
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {userStats && <StreakBadge streak={userStats.currentStreak} />}
            <StarCount stars={stars} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-8 space-y-8">
          {/* Today's progress */}
          {totalSolvedToday > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-md bg-lime-500/5 border border-lime-500/20 text-sm font-mono text-lime-400">
              <i className="ri-checkbox-circle-fill text-xl shrink-0" />
              <div>
                <p className="font-bold">
                  {totalSolvedToday} quiz{totalSolvedToday !== 1 ? "zes" : ""}{" "}
                  completed today!
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Keep going — every quiz counts.
                </p>
              </div>
            </div>
          )}

          {/* Preview of next quiz */}
          {quizData?.quiz && (
            <div className="p-4 rounded-md bg-zinc-900 border border-border space-y-2">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Next quiz
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-foreground">
                  {quizData.quiz.title}
                </span>
                <DifficultyBadge difficulty={quizData.quiz.difficulty} />
                <span className="text-xs font-mono text-blue-400 border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 rounded">
                  {TOPIC_LABELS[quizData.quiz.topic] ?? quizData.quiz.topic}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {quizData.quiz.questions.length} questions
                </span>
              </div>
              {quizData.allTopicsDone && (
                <p className="text-xs font-mono text-yellow-400 flex items-center gap-1.5">
                  <i className="ri-trophy-line" />
                  You've completed all quizzes in your preferred topic! Showing
                  from other topics.
                </p>
              )}
            </div>
          )}

          {/* Topic selector */}
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-base">Choose Topic</h2>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Your preference is saved. You can change it anytime.
                {savingTopic && (
                  <span className="text-lime-400 ml-2">
                    <i className="ri-loader-4-line animate-spin" /> Saving...
                  </span>
                )}
              </p>
            </div>
            <QuizTopicSelector
              value={preferredTopic}
              onChange={handleTopicChange}
              variant="compact"
            />
          </div>

          {/* Start button */}
          <button
            onClick={handleStartQuiz}
            className="w-full py-3.5 bg-lime-400 text-zinc-950 font-heading font-bold text-base rounded-lg hover:bg-lime-300 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="ri-play-fill" />
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (!quizData) return null;

  const { quiz, userStats: stats } = quizData;

  return (
    <>
      {showResultModal && result && (
        <QuizResultModal result={result} onConfirm={handleModalConfirm} />
      )}

      <div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setPageState("topic-select")}
              className="text-zinc-500 hover:text-foreground transition-colors shrink-0"
              title="Change topic"
            >
              <i className="ri-arrow-left-line" />
            </button>
            <div className="w-px h-4 bg-border shrink-0" />
            <h1 className="font-heading font-bold text-sm md:text-base truncate">
              {quiz.title}
            </h1>
            <DifficultyBadge difficulty={quiz.difficulty} />
            <span className="hidden sm:block text-xs font-mono text-blue-400 border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 rounded">
              {TOPIC_LABELS[quiz.topic] ?? quiz.topic}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {stats && <StreakBadge streak={stats.currentStreak} />}
            <StarCount stars={stars} />
          </div>
        </div>

        <QuizPanel
          quiz={quiz}
          isSolved={false}
          onSubmit={handleSubmit}
          isSubmitting={pageState === "submitting"}
        />
      </div>
    </>
  );
}
