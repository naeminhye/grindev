"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface CodeActionBarProps {
  attempts: number;
  pageState: "loading" | "ready" | "running" | "solved" | "error";
  isSolved: boolean;
  onReset: () => void;
  onRun: () => void;
  onSubmit: () => void;
}

export function CodeActionBar({
  attempts,
  pageState,
  isSolved,
  onReset,
  onRun,
  onSubmit,
}: CodeActionBarProps) {
  const { t } = useI18n();

  const isRunning = pageState === "running";

  const attemptsLabel =
    attempts === 0
      ? t("today.noAttempts")
      : attempts !== 1
        ? t("today.attempts_plural", { count: attempts })
        : t("today.attempts", { count: attempts });

  return (
    <div className="border-t border-border p-3 md:p-4 bg-background">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-zinc-600 flex items-center gap-1.5 shrink-0">
          <i className="ri-send-plane-line" />
          {attemptsLabel}
        </span>

        <div className="flex items-center gap-2">
          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            disabled={isRunning || isSolved}
            className={cn(
              "h-9 shrink-0 rounded-md border border-border px-3 text-sm font-mono text-zinc-400 transition-colors",
              "hover:border-zinc-500 hover:text-zinc-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <span className="flex items-center gap-1.5">
              <i className="ri-reset-left-line" />
              <span className="hidden sm:inline">{t("today.reset")}</span>
            </span>
          </button>

          {/* Run — trial only, no submission */}
          <button
            onClick={onRun}
            disabled={isRunning || isSolved}
            className={cn(
              "h-9 flex items-center gap-1.5 px-3 rounded border font-mono text-xs font-semibold transition-all",
              isSolved
                ? "bg-[hsl(var(--surface-raised))] text-zinc-500 cursor-not-allowed border-border"
                : "bg-[hsl(var(--surface-raised))] text-zinc-300 hover:text-foreground border-border hover:border-zinc-500 active:scale-95",
              isRunning && "cursor-not-allowed",
            )}
            title="Run code to see test output — does not count as a submission"
          >
            {isRunning ? (
              <i className="ri-loader-4-line animate-spin" />
            ) : (
              <i className="ri-play-line" />
            )}
            <span className="hidden sm:inline">{t("today.runCode")}</span>
          </button>

          {/* Submit — counts attempt, awards stars */}
          <button
            onClick={onSubmit}
            disabled={isRunning || isSolved}
            className={cn(
              "h-9 flex items-center gap-1.5 px-4 rounded font-mono text-sm font-bold transition-all",
              isSolved
                ? "bg-[hsl(var(--surface-raised))] text-zinc-500 cursor-not-allowed"
                : "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95",
              isRunning && "opacity-60 cursor-not-allowed",
            )}
          >
            {isRunning ? (
              <>
                <i className="ri-loader-4-line animate-spin" />{" "}
                {t("today.running")}
              </>
            ) : (
              <>
                <i className="ri-send-plane-fill" /> {t("today.submit")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
