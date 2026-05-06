"use client";

import { cn } from "@/lib/utils";

interface MilestoneModalProps {
  streak: number;
  bonusStars: number;
  onConfirm: () => void;
}

export function MilestoneModal({
  streak,
  bonusStars,
  onConfirm,
}: MilestoneModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-[hsl(var(--surface))] border border-border rounded-lg shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-0.5 bg-yellow-400 w-full" />

        <div className="p-6 space-y-6 text-center">
          {/* Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-full bg-yellow-400/10 border border-yellow-500/30 flex items-center justify-center">
              <i className="ri-trophy-fill text-yellow-400 text-4xl" />
            </div>
            {/* Streak badge */}
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-lime-400 flex items-center justify-center">
              <i className="ri-fire-fill text-zinc-950 text-sm" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-yellow-400">
              Streak Milestone
            </p>
            <h2 className="font-heading font-bold text-2xl tracking-tight">
              {streak} Day Streak!
            </h2>
            <p className="font-mono text-sm text-zinc-400">
              You've maintained your streak for {streak} days straight. Here's
              your reward.
            </p>
          </div>

          {/* Bonus */}
          <div className="flex items-center justify-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-md">
            <i className="ri-star-fill text-yellow-400 text-2xl" />
            <div className="text-left">
              <div className="font-heading font-bold text-2xl text-yellow-400">
                +{bonusStars}
              </div>
              <div className="font-mono text-xs text-zinc-500">
                bonus stars awarded
              </div>
            </div>
          </div>

          <button
            onClick={onConfirm}
            autoFocus
            className="w-full py-3 bg-yellow-400 text-zinc-950 font-mono font-bold text-sm rounded hover:bg-yellow-300 active:scale-95 transition-all"
          >
            Keep it up! 🔥
          </button>
        </div>
      </div>
    </div>
  );
}
