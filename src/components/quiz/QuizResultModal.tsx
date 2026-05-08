"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { QuizSubmitResponse } from "@/types";

interface QuizResultModalProps {
  result: QuizSubmitResponse;
  onConfirm: () => void;
}

export function QuizResultModal({ result, onConfirm }: QuizResultModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const pct = Math.round((result.score / result.total) * 100);

  const scoreColor =
    pct === 100
      ? "text-lime-400"
      : pct >= 80
        ? "text-green-400"
        : pct >= 60
          ? "text-yellow-400"
          : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-zinc-900 border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div
          className={cn(
            "h-1 w-full",
            result.passed ? "bg-lime-400" : "bg-red-400",
          )}
        />

        <div className="p-6 space-y-5">
          {/* Icon + title */}
          <div className="text-center space-y-3">
            <div
              className={cn(
                "w-16 h-16 rounded-full border flex items-center justify-center mx-auto",
                result.passed
                  ? "bg-lime-400/10 border-lime-500/30"
                  : "bg-red-500/10 border-red-500/30",
              )}
            >
              <i
                className={cn(
                  "text-3xl",
                  result.passed
                    ? "ri-checkbox-circle-fill text-lime-400"
                    : "ri-close-circle-fill text-red-400",
                )}
              />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl tracking-tight">
                {result.passed ? "Quiz Passed!" : "Keep Practicing!"}
              </h2>
              {result.streak?.isNewRecord && (
                <p className="text-xs font-mono text-lime-400 mt-1">
                  🔥 New personal record!
                </p>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="text-center">
              <div
                className={cn("font-heading font-bold text-4xl", scoreColor)}
              >
                {pct}%
              </div>
              <div className="text-xs font-mono text-zinc-500 mt-1">
                {result.score} / {result.total} correct
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            {result.streak && (
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-md">
                <div className="flex items-center gap-2 font-mono text-sm text-zinc-300">
                  <i className="ri-fire-line text-lime-400" /> Streak
                </div>
                <span className="font-heading font-bold text-lime-400">
                  {result.streak.currentStreak}{" "}
                  {result.streak.currentStreak === 1 ? "day" : "days"}
                </span>
              </div>
            )}
            {result.starDelta > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-md">
                <div className="flex items-center gap-2 font-mono text-sm text-zinc-300">
                  <i className="ri-star-fill text-yellow-400" /> Stars earned
                </div>
                <span className="font-heading font-bold text-yellow-400">
                  +{result.starDelta}
                </span>
              </div>
            )}
          </div>

          {/* Answer details toggle */}
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-border rounded-md transition-colors"
          >
            <span>Review answers</span>
            <i
              className={
                showDetails ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"
              }
            />
          </button>

          {showDetails && (
            <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
              {result.results.map((r, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-md border text-xs font-mono space-y-1",
                    r.isCorrect
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-red-500/5 border-red-500/20",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <i
                      className={
                        r.isCorrect
                          ? "ri-check-line text-green-400"
                          : "ri-close-line text-red-400"
                      }
                    />
                    <span
                      className={
                        r.isCorrect ? "text-green-400" : "text-red-400"
                      }
                    >
                      Q{r.questionIndex + 1}
                    </span>
                  </div>
                  {!r.isCorrect && r.explanation && (
                    <p className="text-zinc-400 pl-5 leading-relaxed">
                      {r.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onConfirm}
            autoFocus
            className="w-full py-3 bg-lime-400 text-zinc-950 font-mono font-bold text-sm rounded hover:bg-lime-300 active:scale-95 transition-all"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
