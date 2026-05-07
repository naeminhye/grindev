"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StarCount } from "@/components/ui/StarCount";
import { StreakBadge } from "@/components/streak/StreakBadge";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { NoProblemScreen } from "@/components/ui/NoProblemScreen";
import { QuizPanel } from "@/components/quiz/QuizPanel";
import { QuizResultModal } from "@/components/quiz/QuizResultModal";
import { MakeupCard } from "@/components/problem/MakeupCard";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  QuizAnswer,
  QuizSubmitResponse,
  NoProblemResponse,
} from "@/types";

type DailyQuizData = {
  quiz: {
    id: string;
    title: string;
    topic: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    questions: any[];
  };
  alreadySolved: boolean;
  makeupDays: any[];
  makeupRewardGivenToday: boolean;
  userStats: {
    currentStreak: number;
    longestStreak: number;
    stars: number;
    lastSolvedAt: string | null;
  };
};

type PageState = "loading" | "ready" | "submitting" | "solved" | "error";

export default function QuizTodayPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [data, setData] = useState<DailyQuizData | null>(null);
  const [noProblemData, setNoProblemData] = useState<NoProblemResponse | null>(
    null,
  );
  const [pageState, setPageState] = useState<PageState>("loading");
  const [stars, setStars] = useState(0);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    fetch("/api/daily-quiz")
      .then((r) => r.json())
      .then((d) => {
        if (d.noQuizToday) {
          setNoProblemData(d as NoProblemResponse);
          setPageState("ready");
          return;
        }
        setData(d);
        setStars(d.userStats.stars);
        setPageState(d.alreadySolved ? "solved" : "ready");
      })
      .catch(() => setPageState("error"));
  }, []);

  const handleSubmit = useCallback(
    async (answers: QuizAnswer[]) => {
      if (!data || pageState === "submitting") return;
      setPageState("submitting");

      try {
        const res = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: data.quiz.id, answers }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error);
          setPageState("ready");
          return;
        }

        const submitResult: QuizSubmitResponse = await res.json();
        setResult(submitResult);

        if (submitResult.passed) {
          setPageState("solved");
          if (submitResult.starDelta > 0) {
            setStars((s) => s + submitResult.starDelta);
          }
          setShowResultModal(true);
        } else {
          setPageState("ready");
          setShowResultModal(true);
        }
      } catch {
        setPageState("ready");
      }
    },
    [data, pageState],
  );

  if (pageState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 font-mono text-sm">
          <i className="ri-loader-4-line animate-spin text-lime-400" />
          Loading today's quiz...
        </div>
      </div>
    );
  }

  if (noProblemData) {
    return (
      <NoProblemScreen
        bonusStars={noProblemData.bonusStars}
        bonusAlreadyGiven={noProblemData.bonusAlreadyGiven}
        userStats={noProblemData.userStats}
      />
    );
  }

  if (pageState === "error" || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="ri-error-warning-line text-4xl text-red-400" />
          <p className="font-mono text-sm text-zinc-400">
            No quiz scheduled for today.
          </p>
        </div>
      </div>
    );
  }

  const isSolved = pageState === "solved";
  const { quiz, userStats } = data;

  // ── Solved view ───────────────────────────────────────────────────────
  if (isSolved && !showResultModal) {
    const unsolvedMakeups = data.makeupDays.filter(
      (d: any) => !d.alreadySolved,
    );
    return (
      <div className="flex-1 flex flex-col">
        <div className="bg-lime-400/10 border-b border-lime-500/20 px-4 md:px-6 py-4 flex items-center gap-3 flex-wrap">
          <i className="ri-checkbox-circle-fill text-lime-400 text-xl" />
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-lime-400">
              Today's quiz complete!
            </p>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {t("today.streakDays", { count: userStats.currentStreak })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge streak={userStats.currentStreak} />
            <StarCount stars={stars} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
          {unsolvedMakeups.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <i className="ri-check-double-line text-4xl text-lime-400" />
              <p className="font-heading font-bold text-lg">
                {t("makeup.allCaughtUp")}
              </p>
              <p className="font-mono text-sm text-zinc-400">
                {t("makeup.noPastProblems")}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-heading text-xl font-bold tracking-tight">
                  {t("makeup.title")}
                </h2>
                <p className="text-sm font-mono text-zinc-400 mt-1">
                  {t("makeup.desc")}
                </p>
              </div>
              <div className="space-y-2">
                {unsolvedMakeups.map((day: any) => (
                  <MakeupCard
                    key={day.date}
                    day={day}
                    userStars={stars}
                    onStart={() => router.push(`/makeup-quiz/${day.date}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {showResultModal && result && (
        <QuizResultModal
          result={result}
          onConfirm={() => setShowResultModal(false)}
        />
      )}

      <div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-heading font-bold text-sm md:text-base truncate">
              {quiz.title}
            </h1>
            <DifficultyBadge difficulty={quiz.difficulty} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StreakBadge streak={userStats.currentStreak} />
            <StarCount stars={stars} />
          </div>
        </div>

        <QuizPanel
          quiz={quiz}
          isSolved={isSolved}
          onSubmit={handleSubmit}
          isSubmitting={pageState === "submitting"}
        />
      </div>
    </>
  );
}
