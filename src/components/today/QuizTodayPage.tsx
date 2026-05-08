"use client";

import { useEffect, useState, useCallback } from "react";
import { StarCount } from "@/components/ui/StarCount";
import { StreakBadge } from "@/components/streak/StreakBadge";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { QuizPanel } from "@/components/quiz/QuizPanel";
import { QuizResultModal } from "@/components/quiz/QuizResultModal";
import {
  QuizTopicSelector,
  type QuizTopic,
  type TopicAvailability,
} from "@/components/quiz/QuizTopicSelector";
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
  quiz?: {
    id: string;
    title: string;
    topic: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    questions: any[];
  };
  noQuizToday?: boolean;
  reason?: string;
  topicAvailability: TopicAvailability[];
  allTopicsDone: boolean;
  usedFallback: boolean;
  userStats: {
    currentStreak: number;
    longestStreak: number;
    stars: number;
    lastSolvedAt: string | null;
  };
};

type PageState = "loading" | "topic-select" | "ready" | "submitting" | "error";

export default function QuizTodayPage() {
  const { t } = useI18n();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [stars, setStars] = useState(0);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [preferredTopic, setPreferredTopic] = useState<QuizTopic | null>(null);
  const [savingTopic, setSavingTopic] = useState(false);
  const [totalSolvedToday, setTotalSolvedToday] = useState(0);
  const [quizKey, setQuizKey] = useState(0); // force QuizPanel remount on new quiz

  async function loadQuiz() {
    const res = await fetch("/api/daily-quiz").then((r) => r.json());
    setQuizData(res);
    setStars(res.userStats?.stars ?? 0);
    return res;
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/daily-quiz").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([quizRes, settingsRes]) => {
        setPreferredTopic(settingsRes.preferredQuizTopic ?? null);
        setStars(quizRes.userStats?.stars ?? 0);
        setQuizData(quizRes);
        setPageState("topic-select");
      })
      .catch(() => setPageState("error"));
  }, []);

  async function handleStartQuiz() {
    setPageState("loading");
    const res = await loadQuiz();
    if (res.noQuizToday || !res.quiz) {
      setPageState("topic-select");
    } else {
      setPageState("ready");
      setQuizKey((k) => k + 1);
    }
  }

  async function handleTopicChange(topic: QuizTopic | null) {
    setPreferredTopic(topic);
    setSavingTopic(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredQuizTopic: topic }),
    });
    setSavingTopic(false);
    const res = await loadQuiz();
    setQuizData(res);
  }

  const handleSubmit = useCallback(
    async (answers: QuizAnswer[]) => {
      if (!quizData?.quiz || pageState === "submitting") return;
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
        if (submitResult.starDelta > 0)
          setStars((s) => s + submitResult.starDelta);
        if (submitResult.passed) setTotalSolvedToday((n) => n + 1);
        setShowResultModal(true);
        setPageState("ready");
      } catch {
        setPageState("ready");
      }
    },
    [quizData, pageState],
  );

  function handleModalConfirm() {
    setShowResultModal(false);
    if (result?.passed) {
      // Reload availability then go back to topic select
      loadQuiz().then(() => setPageState("topic-select"));
    }
  }

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
            Failed to load quiz.
          </p>
        </div>
      </div>
    );
  }

  const userStats = quizData?.userStats;
  const availability = quizData?.topicAvailability ?? [];

  // ── Topic selection ───────────────────────────────────────────────────
  if (pageState === "topic-select") {
    const quiz = quizData?.quiz;
    const noQuiz = quizData?.noQuizToday || !quiz;

    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 gap-2">
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

          {/* Next quiz preview */}
          {!noQuiz && quiz && (
            <div className="p-4 rounded-md bg-zinc-900 border border-border space-y-2">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Next quiz
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-foreground">
                  {quiz.title}
                </span>
                <DifficultyBadge difficulty={quiz.difficulty} />
                <span className="text-xs font-mono text-blue-400 border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 rounded">
                  {TOPIC_LABELS[quiz.topic] ?? quiz.topic}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {quiz.questions.length} questions
                </span>
              </div>
              {quizData?.usedFallback && (
                <p className="text-xs font-mono text-yellow-400 flex items-center gap-1.5">
                  <i className="ri-information-line" />
                  No quizzes left in your preferred topic — showing from other
                  topics.
                </p>
              )}
              {quizData?.allTopicsDone && (
                <p className="text-xs font-mono text-yellow-400 flex items-center gap-1.5">
                  <i className="ri-trophy-line" />
                  You've completed all available quizzes! Showing repeats.
                </p>
              )}
            </div>
          )}

          {/* No quiz at all */}
          {noQuiz && (
            <div className="p-4 rounded-md bg-zinc-900 border border-border text-center space-y-2 py-8">
              <i className="ri-questionnaire-line text-3xl text-zinc-600" />
              <p className="font-mono text-sm text-zinc-400">
                No quizzes available for this topic.
              </p>
              <p className="text-xs font-mono text-zinc-600">
                Try selecting a different topic below.
              </p>
            </div>
          )}

          {/* Topic selector with availability */}
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
              availability={availability}
            />
          </div>

          {/* Start button */}
          <button
            onClick={handleStartQuiz}
            disabled={noQuiz}
            className={cn(
              "w-full py-3.5 font-heading font-bold text-base rounded-lg flex items-center justify-center gap-2 transition-all",
              noQuiz
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700"
                : "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95",
            )}
          >
            <i className="ri-play-fill" />
            {noQuiz ? "No Quiz Available" : "Start Quiz"}
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz in progress ──────────────────────────────────────────────────
  if (!quizData?.quiz) return null;
  const { quiz } = quizData;

  return (
    <>
      {showResultModal && result && (
        <QuizResultModal result={result} onConfirm={handleModalConfirm} />
      )}
      <div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setPageState("topic-select")}
              className="text-zinc-500 hover:text-foreground transition-colors shrink-0"
              title="Back to topic selection"
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
            {userStats && <StreakBadge streak={userStats.currentStreak} />}
            <StarCount stars={stars} />
          </div>
        </div>
        <QuizPanel
          key={quizKey}
          quiz={quiz}
          isSolved={false}
          onSubmit={handleSubmit}
          isSubmitting={pageState === "submitting"}
        />
      </div>
    </>
  );
}
