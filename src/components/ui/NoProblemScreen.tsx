"use client";

import { StarCount } from "@/components/ui/StarCount";
import { StreakBadge } from "@/components/streak/StreakBadge";
import type { UserStats } from "@/types";

interface NoProblemScreenProps {
  bonusStars: number;
  bonusAlreadyGiven: boolean;
  userStats: UserStats;
}

export function NoProblemScreen({
  bonusStars,
  bonusAlreadyGiven,
  userStats,
}: NoProblemScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-8">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--surface-raised))] border border-border flex items-center justify-center mx-auto">
          <i className="ri-calendar-close-line text-3xl text-zinc-500" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Rest day!
          </h1>
          <p className="font-mono text-sm text-zinc-400 leading-relaxed">
            No problem is scheduled for today. Take a breath — you've earned it.
          </p>
        </div>

        {/* Bonus stars notification */}
        {!bonusAlreadyGiven && bonusStars > 0 && (
          <div className="p-4 rounded-md bg-yellow-500/5 border border-yellow-500/20 space-y-2">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <i className="ri-gift-line text-lg" />
              <span className="font-heading font-bold text-lg">
                +{bonusStars} stars
              </span>
            </div>
            <p className="font-mono text-xs text-zinc-500">
              Sorry for the gap — here's a bonus to keep you going!
            </p>
          </div>
        )}

        {bonusAlreadyGiven && (
          <p className="font-mono text-xs text-zinc-600">
            You already received your bonus stars for today.
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-3">
          <StreakBadge streak={userStats.currentStreak} />
          <StarCount stars={userStats.stars} />
        </div>

        <p className="font-mono text-xs text-zinc-600">
          Come back tomorrow for a new problem.
        </p>
      </div>
    </div>
  );
}
