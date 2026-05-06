"use client";

import { cn } from "@/lib/utils";

interface SuccessModalProps {
  streak: number;
  isNewRecord: boolean;
  starDelta: number | null;
  isHard: boolean;
  timeExpired: boolean;
  cleanSolve: boolean;
  onConfirm: () => void;
}

export function SuccessModal({
  streak,
  isNewRecord,
  starDelta,
  isHard,
  timeExpired,
  cleanSolve,
  onConfirm,
}: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-[hsl(var(--surface))] border border-border rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Green accent top bar */}
        <div className="h-1 bg-lime-400 w-full" />

        <div className="p-6 space-y-6">
          {/* Icon + title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-lime-400/10 border border-lime-500/30 flex items-center justify-center mx-auto">
              <i className="ri-checkbox-circle-fill text-lime-400 text-3xl" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl tracking-tight text-foreground">
                All tests passed!
              </h2>
              {isNewRecord && (
                <p className="text-xs font-mono text-lime-400 mt-1">
                  🔥 New personal record!
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            {/* Streak */}
            <div className="flex items-center justify-between px-4 py-3 bg-[hsl(var(--surface-raised))] rounded-md">
              <div className="flex items-center gap-2 font-mono text-sm text-zinc-300">
                <i className="ri-fire-line text-lime-400" />
                Streak
              </div>
              <span className="font-heading font-bold text-lime-400">
                {streak} {streak === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Stars */}
            {starDelta !== null && starDelta !== 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-[hsl(var(--surface-raised))] rounded-md">
                <div className="flex items-center gap-2 font-mono text-sm text-zinc-300">
                  <i className="ri-star-fill text-yellow-400" />
                  Stars earned
                </div>
                <span
                  className={cn(
                    "font-heading font-bold",
                    starDelta > 0 ? "text-yellow-400" : "text-red-400",
                  )}
                >
                  {starDelta > 0 ? `+${starDelta}` : starDelta}
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {cleanSolve && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs font-mono">
                  <i className="ri-shield-star-line" /> Clean solve
                </span>
              )}
              {isHard && !timeExpired && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono">
                  <i className="ri-sword-line" /> Hard mode
                </span>
              )}
              {timeExpired && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  <i className="ri-alarm-warning-line" /> Time expired
                </span>
              )}
            </div>
          </div>

          {/* OK button */}
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
