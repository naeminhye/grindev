"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProfileStats } from "@/types";
import { useI18n } from "@/lib/i18n";

export default function ProfilePage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/profile")
      .then((r) => r.json())
      .then(setStats)
      .catch((err) => {
        if (err.name === "AbortError") return;
      });

    return () => controller.abort();
  }, []);

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  const cleanRate =
    stats.totalSolves > 0
      ? Math.round((stats.cleanSolves / stats.totalSolves) * 100)
      : 0;
  const avgAttempts =
    stats.totalSolves > 0
      ? (stats.totalAttempts / stats.totalSolves).toFixed(1)
      : "—";

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6 md:space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
            {t("profile.title")}
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            {t("profile.desc")}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono",
            stats.challengeMode === "HARD"
              ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
              : "bg-[hsl(var(--surface-raised))] border-zinc-700 text-zinc-400",
          )}
        >
          <i
            className={
              stats.challengeMode === "HARD"
                ? "ri-sword-line"
                : "ri-shield-line"
            }
          />
          <span className="hidden sm:inline">
            {stats.challengeMode === "HARD"
              ? t("profile.hardMode")
              : t("profile.normalMode")}
          </span>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: t("profile.streak"),
            value: stats.currentStreak,
            suffix: "days",
            icon: "ri-fire-line",
            color: "text-lime-400",
          },
          {
            label: t("profile.best"),
            value: stats.longestStreak,
            suffix: "days",
            icon: "ri-trophy-line",
            color: "text-yellow-400",
          },
          {
            label: t("profile.stars"),
            value: stats.stars,
            suffix: "",
            icon: "ri-star-fill",
            color: "text-yellow-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[hsl(var(--surface))] border border-border rounded-md p-3 md:p-5 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <i className={cn(s.icon, s.color, "text-sm")} />
              <span className="text-xs font-mono text-zinc-500">{s.label}</span>
            </div>
            <div
              className={cn(
                "font-heading font-bold text-2xl md:text-3xl",
                s.color,
              )}
            >
              {s.value}
              {s.suffix && (
                <span className="text-xs md:text-sm font-mono text-zinc-500 ml-1">
                  {s.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Solve stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          {
            label: t("profile.totalSolved"),
            value: stats.totalSolves,
            icon: "ri-code-s-slash-line",
            color: "text-zinc-300",
          },
          {
            label: t("profile.cleanSolves"),
            value: stats.cleanSolves,
            icon: "ri-shield-star-line",
            color: "text-lime-400",
          },
          {
            label: t("profile.hardMode"),
            value: stats.hardModeSolves,
            icon: "ri-sword-line",
            color: "text-orange-400",
          },
          {
            label: t("profile.avgAttempts"),
            value: avgAttempts,
            icon: "ri-refresh-line",
            color: "text-blue-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[hsl(var(--surface))] border border-border rounded-md p-3 md:p-4 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <i className={cn(s.icon, s.color, "text-sm")} />
              <span className="text-xs font-mono text-zinc-500">{s.label}</span>
            </div>
            <div
              className={cn(
                "font-heading font-bold text-xl md:text-2xl",
                s.color,
              )}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Clean rate */}
      <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-shield-star-line text-lime-400" />
            <span className="font-mono text-sm">{t("profile.cleanRate")}</span>
          </div>
          <span className="font-heading font-bold text-lime-400">
            {cleanRate}%
          </span>
        </div>
        <div className="h-2 bg-[hsl(var(--surface-raised))] rounded-full overflow-hidden">
          <div
            className="h-full bg-lime-400 rounded-full transition-all duration-700"
            style={{ width: `${cleanRate}%` }}
          />
        </div>
        <p className="text-xs font-mono text-zinc-600">
          {t("profile.cleanRateDesc", {
            clean: stats.cleanSolves,
            total: stats.totalSolves,
          })}
        </p>
      </div>

      {/* Activity heatmap */}
      <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <i className="ri-calendar-check-line text-lime-400" />
          <span className="font-mono text-sm">{t("profile.last30Days")}</span>
        </div>
        <div className="flex gap-1 md:gap-1.5 flex-wrap">
          {stats.recentActivity.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className={cn(
                "w-6 h-6 md:w-7 md:h-7 rounded-sm border transition-colors",
                day.solved && !day.isMakeup
                  ? "bg-lime-400/80 border-lime-400/50"
                  : day.isMakeup
                    ? "bg-blue-400/60 border-blue-400/40"
                    : "bg-[hsl(var(--surface-raised))] border-zinc-700",
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-lime-400/80 inline-block" />{" "}
            {t("profile.solved")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-400/60 inline-block" />{" "}
            {t("profile.make-up")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[hsl(var(--surface-raised))] border border-zinc-700 inline-block" />{" "}
            {t("profile.missed")}
          </span>
        </div>
      </div>

      {/* Topic breakdown */}
      {stats.topicBreakdown.length > 0 && (
        <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <i className="ri-bar-chart-box-line text-lime-400" />
            <span className="font-mono text-sm">{t("profile.byTopic")}</span>
          </div>
          <div className="space-y-2">
            {stats.topicBreakdown.map((t) => {
              const pct = Math.round((t.count / stats.totalSolves) * 100);
              return (
                <div key={t.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">
                      {t.topic.replace(/_/g, " ")}
                    </span>
                    <span className="text-zinc-500">{t.count}</span>
                  </div>
                  <div className="h-1.5 bg-[hsl(var(--surface-raised))] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-400/60 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Difficulty breakdown */}
      {stats.difficultyBreakdown.length > 0 && (
        <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <i className="ri-pie-chart-line text-lime-400" />
            <span className="font-mono text-sm">
              {t("profile.byDifficulty")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["EASY", "MEDIUM", "HARD"].map((d) => {
              const entry = stats.difficultyBreakdown.find(
                (x) => x.difficulty === d,
              );
              return (
                <div key={d} className="text-center space-y-1">
                  <div
                    className={cn(
                      "font-heading font-bold text-2xl",
                      d === "EASY"
                        ? "text-green-400"
                        : d === "MEDIUM"
                          ? "text-yellow-400"
                          : "text-red-400",
                    )}
                  >
                    {entry?.count ?? 0}
                  </div>
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    {d}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
