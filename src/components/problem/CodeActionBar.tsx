"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface CodeActionBarProps {
  attempts: number;
  pageState: "loading" | "ready" | "running" | "solved" | "error";
  isSolved: boolean;
  onReset: () => void;
  onRun: () => void;
}

export function CodeActionBar({
  attempts,
  pageState,
  isSolved,
  onReset,
  onRun,
}: CodeActionBarProps) {
  const { t } = useI18n();

  const attemptsLabel =
    attempts === 0
      ? t("today.noAttempts")
      : attempts !== 1
        ? t("today.attempts_plural", { count: attempts })
        : t("today.attempts", { count: attempts });

  return (
    <div className="border-t border-border p-3 md:p-4 bg-background">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-mono text-zinc-600 flex items-center gap-1.5 shrink-0">
          <i className="ri-refresh-line" />
          {attemptsLabel}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={pageState === "running" || isSolved}
            className={cn(
              "h-10 shrink-0 rounded-md border border-border px-4 text-sm font-mono font-semibold text-zinc-400 transition-colors",
              "hover:border-primary hover:text-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <i className="ri-reset-left-line" />
              {t("today.reset")}
            </span>
          </button>

          <button
            onClick={onRun}
            disabled={pageState === "running" || isSolved}
            className={cn(
              "flex items-center gap-2 px-4 md:px-5 py-2.5 rounded font-mono text-sm font-bold transition-all",
              isSolved
                ? "bg-[hsl(var(--surface-raised))] text-zinc-500 cursor-not-allowed"
                : "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95",
            )}
          >
            {pageState === "running" ? (
              <>
                <i className="ri-loader-4-line animate-spin" />{" "}
                {t("today.running")}
              </>
            ) : (
              <>
                <i className="ri-play-fill" /> {t("today.runCode")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
