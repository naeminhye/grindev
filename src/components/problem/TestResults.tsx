"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { TestResult, SolveResponse } from "@/types";

interface TestResultsProps {
  solveResult: SolveResponse;
  starDelta?: number | null;
  showStreakInfo?: boolean;
}

export function TestResults({
  solveResult,
  starDelta,
  showStreakInfo = true,
}: TestResultsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-2 max-h-32 md:max-h-44 overflow-y-auto custom-scrollbar">
      {solveResult.results.map((r) => (
        <div
          key={r.index}
          className={cn(
            "rounded-md border p-3 text-xs font-mono space-y-2",
            r.passed
              ? "bg-green-500/5 border-green-500/20"
              : "bg-red-500/5 border-red-500/20",
          )}
        >
          <div className="flex items-center gap-2">
            <i
              className={
                r.passed
                  ? "ri-check-line text-green-400"
                  : "ri-close-line text-red-400"
              }
            />
            <span className={r.passed ? "text-green-400" : "text-red-400"}>
              Test {r.index}
            </span>
            {r.passed && (
              <span className="text-green-600">{t("testResults.passed")}</span>
            )}
          </div>

          {!r.passed && (
            <div className="space-y-1 pl-5">
              {r.input && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-zinc-600 w-20 shrink-0">Input</span>
                  <span className="text-zinc-400 whitespace-pre break-all">
                    {r.input}
                  </span>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <span className="text-zinc-600 w-20 shrink-0">
                  {t("testResults.expected")}
                </span>
                <span className="text-green-400 break-all">{r.expected}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-zinc-600 w-20 shrink-0">
                  {t("testResults.yourOutput")}
                </span>
                <span className="text-red-400 break-all">
                  {r.actual || (
                    <em className="text-zinc-600">{t("testResults.empty")}</em>
                  )}
                </span>
              </div>
              {r.stderr && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-zinc-600 w-20 shrink-0">
                    {t("testResults.error")}
                  </span>
                  <span className="text-red-400 break-all">{r.stderr}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {solveResult.passed && showStreakInfo && (
        <div className="flex items-center gap-3 flex-wrap pt-1">
          {starDelta !== undefined && starDelta !== null && starDelta !== 0 && (
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-mono",
                starDelta > 0 ? "text-yellow-400" : "text-red-400",
              )}
            >
              <i className="ri-star-fill text-xs" />
              {starDelta > 0 ? `+${starDelta}` : starDelta}
            </span>
          )}
          <span className="text-lime-400 text-sm font-mono flex items-center gap-1.5">
            <i className="ri-trophy-line" />
            {solveResult.streak?.isNewRecord
              ? `New record! ${solveResult.streak.currentStreak} days 🔥`
              : `${solveResult.streak?.currentStreak ?? 0} day streak`}
          </span>
        </div>
      )}
    </div>
  );
}
