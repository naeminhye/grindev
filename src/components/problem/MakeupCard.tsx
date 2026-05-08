"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import type { MakeupDay } from "@/lib/makeup";

interface MakeupCardProps {
  day: MakeupDay;
  userStars: number;
  completed?: boolean;
  onStart?: () => void;
}

export function MakeupCard({
  day,
  userStars,
  completed = false,
  onStart,
}: MakeupCardProps) {
  const { t } = useI18n();
  const canAfford = userStars >= day.starCost;

  const daysLabel =
    day.daysAgo === 0
      ? t("shop.date.today") // or just 'Today' if no i18n key
      : day.daysAgo === 1
        ? t("makeup.yesterday")
        : t("makeup.daysAgo", { count: day.daysAgo });

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 md:p-4 rounded-md border transition-colors",
        completed
          ? "border-border bg-[hsl(var(--surface))]/30 opacity-60"
          : "border-border bg-[hsl(var(--surface))] hover:border-zinc-600",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-mono text-sm font-medium truncate">
            {day.problemTitle}
          </span>
          <DifficultyBadge difficulty={day.difficulty as any} />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 flex-wrap">
          <span>{daysLabel}</span>
          <span className="hidden sm:inline">
            ·{" "}
            {(day.topics ?? [])
              .map((t: string) => t.replace(/_/g, " "))
              .join(", ")}
          </span>
        </div>
      </div>

      {completed ? (
        <span className="flex items-center gap-1.5 text-xs font-mono text-lime-400 shrink-0">
          <i className="ri-check-line" /> {t("makeup.done")}
        </span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-mono",
              canAfford ? "text-yellow-400" : "text-red-400",
            )}
          >
            <i className="ri-star-fill" /> {day.starCost}
          </span>
          <button
            onClick={onStart}
            disabled={!canAfford}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-mono font-bold transition-all",
              canAfford
                ? "bg-lime-400 text-zinc-950 hover:bg-lime-300"
                : "bg-[hsl(var(--surface-raised))] text-zinc-600 cursor-not-allowed border border-zinc-700",
            )}
          >
            {canAfford ? t("makeup.start") : t("makeup.needStars")}
          </button>
        </div>
      )}
    </div>
  );
}
