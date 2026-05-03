"use client";

import { formatTime } from "@/lib/challenge";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  secondsLeft: number;
  isExpired: boolean;
  isVisible: boolean;
  onToggleVisibility: () => void;
  className?: string;
}

export function TimerDisplay({
  secondsLeft,
  isExpired,
  isVisible,
  onToggleVisibility,
  className,
}: TimerDisplayProps) {
  const isWarning = secondsLeft <= 300 && !isExpired; // last 5 minutes
  const isCritical = secondsLeft <= 60 && !isExpired; // last 1 minute

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-sm transition-colors",
        isExpired
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : isCritical
            ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse"
            : isWarning
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              : "bg-zinc-800 border-zinc-700 text-zinc-300",
        className,
      )}
    >
      <i
        className={cn(
          "text-base",
          isExpired ? "ri-alarm-warning-line" : "ri-time-line",
        )}
      />

      {isVisible ? (
        <span className="font-heading font-bold tabular-nums w-[4.5ch] text-center">
          {isExpired ? "TIME" : formatTime(secondsLeft)}
        </span>
      ) : (
        <span className="font-heading font-bold w-[4.5ch] text-center tracking-widest text-zinc-600">
          ••:••
        </span>
      )}

      <button
        onClick={onToggleVisibility}
        className="text-zinc-600 hover:text-zinc-400 transition-colors ml-0.5"
        title={isVisible ? "Hide timer" : "Show timer"}
      >
        <i
          className={
            isVisible ? "ri-eye-line text-xs" : "ri-eye-off-line text-xs"
          }
        />
      </button>
    </div>
  );
}
