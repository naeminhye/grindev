"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { STAR_REWARD_DEFAULTS, TIME_LIMIT_DEFAULTS } from "@/lib/game-config";
import { useI18n } from "@/lib/i18n";

type Config = Record<string, number>;

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
const MODES = ["NORMAL", "HARD"] as const;

export default function AdminConfigPage() {
  const { t } = useI18n();

  const [config, setConfig] = useState<{
    starRewards: Config;
    timeLimits: Config;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState<Config>({});

  function getDifficultyLabel(diff: (typeof DIFFICULTIES)[number]) {
    if (diff === "EASY") return t("settings.easy");
    if (diff === "MEDIUM") return t("settings.medium");
    return t("settings.hard");
  }

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  function set(key: string, value: number) {
    setConfig((c) =>
      c
        ? {
            ...c,
            starRewards:
              key in STAR_REWARD_DEFAULTS
                ? { ...c.starRewards, [key]: value }
                : c.starRewards,
            timeLimits:
              key in TIME_LIMIT_DEFAULTS
                ? { ...c.timeLimits, [key]: value }
                : c.timeLimits,
          }
        : c,
    );
    setDirty((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!Object.keys(dirty).length) return;
    setSaving(true);
    await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dirty),
    });
    setSaving(false);
    setSaved(true);
    setDirty({});
    setTimeout(() => setSaved(false), 2000);
  }

  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10 w-full space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {t("admin.config.title")}
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            {t("admin.config.desc")}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !Object.keys(dirty).length}
          className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 disabled:opacity-40 transition-colors"
        >
          {saving ? (
            <i className="ri-loader-4-line animate-spin" />
          ) : (
            <i className="ri-save-line" />
          )}
          {saving
            ? t("admin.config.saving")
            : saved
              ? t("admin.config.saved")
              : t("common.save")}
        </button>
      </div>

      {/* Hard mode time limits */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base">
            {t("admin.config.timeLimits.title")}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {t("admin.config.timeLimits.desc")}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((diff) => {
            const key = `HARD_TIME_${diff}` as keyof typeof TIME_LIMIT_DEFAULTS;
            const mins = Math.floor(config.timeLimits[key] / 60);
            const secs = config.timeLimits[key] % 60;
            return (
              <div
                key={diff}
                className="p-4 bg-zinc-900 border border-border rounded-md space-y-3"
              >
                <span
                  className={cn(
                    "text-xs font-mono font-bold uppercase",
                    diff === "EASY"
                      ? "text-green-400"
                      : diff === "MEDIUM"
                        ? "text-yellow-400"
                        : "text-red-400",
                  )}
                >
                  {getDifficultyLabel(diff)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-zinc-600 uppercase">
                      {t("admin.config.timeLimits.min")}
                    </label>
                    <input
                      type="number"
                      value={mins}
                      min={1}
                      max={120}
                      onChange={(e) =>
                        set(key, parseInt(e.target.value) * 60 + secs)
                      }
                      className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono text-zinc-200 text-center"
                    />
                  </div>
                  <span className="text-zinc-600 mt-4">:</span>
                  <div className="flex-1">
                    <label className="text-[10px] font-mono text-zinc-600 uppercase">
                      {t("admin.config.timeLimits.sec")}
                    </label>
                    <input
                      type="number"
                      value={secs}
                      min={0}
                      max={59}
                      onChange={(e) =>
                        set(key, mins * 60 + parseInt(e.target.value))
                      }
                      className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm font-mono text-zinc-200 text-center"
                    />
                  </div>
                </div>
                <p className="text-[10px] font-mono text-zinc-600 text-center">
                  {t("admin.config.timeLimits.total").replace(
                    "{seconds}",
                    String(config.timeLimits[key]),
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Star rewards */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base">
            {t("admin.config.starRewards.title")}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {t("admin.config.starRewards.desc")}
          </p>
        </div>

        {MODES.map((mode) => (
          <div key={mode} className="space-y-3">
            <h3
              className={cn(
                "text-xs font-mono font-bold uppercase tracking-widest",
                mode === "HARD" ? "text-orange-400" : "text-zinc-400",
              )}
            >
              {mode === "HARD"
                ? t("admin.config.modes.hard")
                : t("admin.config.modes.normal")}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-zinc-500 font-normal">
                      {t("admin.config.starRewards.type")}
                    </th>
                    {DIFFICULTIES.map((d) => (
                      <th
                        key={d}
                        className={cn(
                          "text-center py-2 font-bold w-24",
                          d === "EASY"
                            ? "text-green-400"
                            : d === "MEDIUM"
                              ? "text-yellow-400"
                              : "text-red-400",
                        )}
                      >
                        {getDifficultyLabel(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {["CLEAN", "HINTS"].map((solveType) => (
                    <tr key={solveType}>
                      <td className="py-2 pr-4 text-zinc-400">
                        {solveType === "CLEAN"
                          ? t("admin.config.starRewards.cleanSolve")
                          : t("admin.config.starRewards.withHints")}
                      </td>
                      {DIFFICULTIES.map((diff) => {
                        const key =
                          `STARS_${mode}_${solveType}_${diff}` as keyof typeof STAR_REWARD_DEFAULTS;
                        return (
                          <td key={diff} className="py-2 px-2">
                            <input
                              type="number"
                              value={config.starRewards[key]}
                              min={-20}
                              max={50}
                              onChange={(e) =>
                                set(key, parseInt(e.target.value))
                              }
                              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-center text-zinc-200 focus:outline-none focus:border-lime-500/50"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Time expired penalty */}
        <div className="flex items-center gap-4 p-4 bg-zinc-900 border border-border rounded-md">
          <div className="flex-1">
            <p className="text-sm font-mono text-zinc-300">
              {t("admin.config.timeExpiredPenalty.title")}
            </p>
            <p className="text-xs font-mono text-zinc-600 mt-0.5">
              {t("admin.config.timeExpiredPenalty.desc")}
            </p>
          </div>
          <input
            type="number"
            value={config.starRewards["STARS_TIME_EXPIRED_PENALTY"]}
            min={-20}
            max={0}
            onChange={(e) =>
              set("STARS_TIME_EXPIRED_PENALTY", parseInt(e.target.value))
            }
            className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-center text-zinc-200 font-mono text-sm focus:outline-none focus:border-lime-500/50"
          />
        </div>
      </section>
    </div>
  );
}
