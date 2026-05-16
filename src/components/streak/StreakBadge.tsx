// src/components/streak/StreakBadge.tsx
"use client";

import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  lastSolvedAt?: string | null;
  streakStatus?: "ACTIVE" | "AT_RISK" | "FROZEN" | "BROKEN";
  frozenStreakValue?: number;
}

export function StreakBadge({
  streak,
  lastSolvedAt,
  streakStatus = "ACTIVE",
  frozenStreakValue = 0,
}: StreakBadgeProps) {
  const solvedToday = lastSolvedAt
    ? new Date(lastSolvedAt).toLocaleDateString("en-CA") ===
      new Date().toLocaleDateString("en-CA")
    : false;

  // ── FROZEN ──
  if (streakStatus === "FROZEN") {
    const displayValue = frozenStreakValue || streak;
    return (
      <div
        className="flex items-center gap-1.5 h-8 px-2.5 rounded border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-mono text-xs"
        title="Streak frozen — solve today to thaw it"
      >
        <i className="ri-snowflake-fill text-sm text-cyan-300" />
        <span className="font-bold">{displayValue}</span>
        <span className="hidden sm:inline text-[10px] opacity-70">frozen</span>
      </div>
    );
  }

  // ── AT_RISK ──
  if (streakStatus === "AT_RISK") {
    return (
      <div
        className="flex items-center gap-1.5 h-8 px-2.5 rounded border border-orange-500/40 bg-orange-500/10 text-orange-400 font-mono text-xs animate-pulse"
        title="Streak at risk — open the recovery modal"
      >
        <i className="ri-fire-line text-sm" />
        <span className="font-bold">{streak}</span>
        <i className="ri-error-warning-line text-[10px] text-orange-300" />
      </div>
    );
  }

  // ── BROKEN ──
  if (streakStatus === "BROKEN") {
    return (
      <div
        className="flex items-center gap-1.5 h-8 px-2.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-500 font-mono text-xs"
        title="Streak broken — solve today to start a new one"
      >
        <i className="ri-fire-line text-sm" />
        <span>0</span>
      </div>
    );
  }

  // ── ACTIVE — distinguish solved-today vs not-yet-solved ──
  const atRiskVisual = streak > 0 && !solvedToday;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 h-8 px-2.5 rounded border font-mono text-xs transition-colors",
        atRiskVisual
          ? "border-orange-500/40 bg-orange-500/10 text-orange-400 animate-pulse"
          : "border-lime-500/30 bg-lime-500/10 text-lime-400",
      )}
      title={
        atRiskVisual ? "Solve today to keep the streak alive" : "Streak active"
      }
    >
      <i
        className={cn(
          "text-sm",
          atRiskVisual ? "ri-fire-line" : "ri-fire-fill",
        )}
      />
      <span className="font-bold">{streak}</span>
      <span className="hidden sm:inline text-[10px] opacity-70">days</span>
      {atRiskVisual && (
        <i className="ri-error-warning-line text-[10px] text-orange-300" />
      )}
    </div>
  );
}
