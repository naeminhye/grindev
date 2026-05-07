"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getDifficultyNote } from "@/lib/daily-logic";
import { useTheme, type Theme } from "@/lib/theme";
import { useI18n, type Locale } from "@/lib/i18n";
import { PreferredDifficulty, Settings } from "@/types";

// TODO: add to common
const LANGUAGES = [
  {
    id: "en",
    label: "English",
    nativeName: "English",
    flag: "🇺🇸",
  },
  {
    id: "vi",
    label: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
  },
  {
    id: "ko",
    label: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
  },
  {
    id: "ja",
    label: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
  },
  {
    id: "zh",
    label: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
  },
  {
    id: "th",
    label: "Thai",
    nativeName: "ไทย",
    flag: "🇹🇭",
  },
  {
    id: "fr",
    label: "French",
    nativeName: "Français",
    flag: "🇫🇷",
  },
] as {
  id: Locale;
  label: string;
  nativeName: string;
  flag: string;
}[];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const diffNote = settings
    ? getDifficultyNote(settings.preferredDifficulty, t)
    : "";

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setSettings(s);
      });
  }, []);

  async function save(patch: Partial<Settings>) {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSettings((s) => (s ? { ...s, ...patch } : s));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handlePreferredDifficultyChange(diff: PreferredDifficulty) {
    save({ preferredDifficulty: diff });
  }

  if (!settings) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-10 w-full">
      <div>
        <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          {t("settings.desc")}
        </p>
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base">
            {t("settings.appearance")}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {t("settings.appearanceDesc")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["dark", "light"] as Theme[]).map((t_) => (
            <button
              key={t_}
              onClick={() => setTheme(t_)}
              className={cn(
                "p-4 rounded-md border text-left transition-all space-y-2",
                theme === t_
                  ? "border-lime-500/50 bg-lime-500/5"
                  : "border-border bg-[hsl(var(--surface))] hover:border-zinc-600",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i
                    className={
                      t_ === "dark"
                        ? "ri-moon-line text-zinc-400"
                        : "ri-sun-line text-yellow-400"
                    }
                  />
                  <span className="font-heading font-bold text-sm">
                    {t_ === "dark"
                      ? t("settings.darkTheme")
                      : t("settings.lightTheme")}
                  </span>
                </div>

                <div
                  className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                    theme === t_
                      ? "border-lime-400 bg-lime-400 text-zinc-950"
                      : "border-zinc-700 text-transparent group-hover:border-zinc-500",
                  )}
                >
                  <i className="ri-check-line text-sm" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base">
            {t("settings.language")}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {t("settings.languageDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => {
            const active = locale === lang.id;

            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLocale(lang.id)}
                className={cn(
                  "group p-4 rounded-md border text-left transition-all",
                  "bg-[hsl(var(--surface))] hover:border-zinc-600",
                  active
                    ? "border-lime-500/50 bg-lime-500/5 shadow-[0_0_0_1px_rgba(132,204,22,0.15)]"
                    : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{lang.flag}</span>
                    <div className="min-w-0">
                      <div className="font-heading font-bold text-sm truncate">
                        {lang.nativeName}
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500 truncate">
                        {lang.label} · {lang.id.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      active
                        ? "border-lime-400 bg-lime-400 text-zinc-950"
                        : "border-zinc-700 text-transparent group-hover:border-zinc-500",
                    )}
                  >
                    <i className="ri-check-line text-sm" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Practice Mode */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base">
            {t("settings.practiceMode.title")}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {t("settings.practiceMode.desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              {
                id: "DSA",
                labelKey: "settings.practiceMode.modes.dsa.label",
                icon: "ri-code-s-slash-line",
                descKey: "settings.practiceMode.modes.dsa.desc",
              },
              {
                id: "QUIZ",
                labelKey: "settings.practiceMode.modes.quiz.label",
                icon: "ri-questionnaire-line",
                descKey: "settings.practiceMode.modes.quiz.desc",
              },
            ] as {
              id: "DSA" | "QUIZ";
              labelKey: string;
              icon: string;
              descKey: string;
            }[]
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => save({ practiceMode: mode.id })}
              className={cn(
                "p-4 rounded-md border text-left transition-all space-y-2",
                settings.practiceMode === mode.id
                  ? "border-lime-500/50 bg-lime-500/5"
                  : "border-border bg-zinc-900 hover:border-zinc-600",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <i className={`${mode.icon} text-lime-400 shrink-0`} />
                  <span className="font-heading font-bold text-sm truncate">
                    {t(mode.labelKey)}
                  </span>
                </div>

                {settings.practiceMode === mode.id && (
                  <i className="ri-check-line text-lime-400 shrink-0" />
                )}
              </div>

              <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                {t(mode.descKey)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Difficulty */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base">
            {t("settings.preferredDifficulty")}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {t("settings.preferredDifficultyDesc")}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(["ANY", "EASY", "MEDIUM", "HARD"] as PreferredDifficulty[]).map(
            (d) => (
              <button
                key={d}
                onClick={() => handlePreferredDifficultyChange(d)}
                className={cn(
                  "flex items-center justify-between",
                  "p-3 rounded-md border text-left transition-all",
                  settings.preferredDifficulty === d
                    ? "border-lime-500/50 bg-lime-500/5"
                    : "border-border bg-[hsl(var(--surface))] hover:border-zinc-600",
                )}
              >
                <div
                  className={cn(
                    "font-heading font-bold text-sm mb-1",
                    d === "EASY"
                      ? "text-green-400"
                      : d === "MEDIUM"
                        ? "text-yellow-400"
                        : d === "HARD"
                          ? "text-red-400"
                          : "text-lime-400",
                  )}
                >
                  {d === "ANY"
                    ? t("settings.any")
                    : d === "EASY"
                      ? t("settings.easy")
                      : d === "MEDIUM"
                        ? t("settings.medium")
                        : t("settings.hard")}
                </div>
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                    settings.preferredDifficulty === d
                      ? "border-lime-400 bg-lime-400 text-zinc-950"
                      : "border-zinc-700 text-transparent group-hover:border-zinc-500",
                  )}
                >
                  <i className="ri-check-line text-sm" />
                </div>
              </button>
            ),
          )}
        </div>
        {diffNote && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-[hsl(var(--surface))] border border-zinc-700 text-xs font-mono text-zinc-400">
            <i className="ri-information-line text-lime-400 mt-0.5 shrink-0" />
            {diffNote}
          </div>
        )}
      </div>

      {/* Challenge Mode */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base">
            {t("settings.challengeMode")}
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {t("settings.challengeModeDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => save({ challengeMode: "NORMAL" })}
            className={cn(
              "p-4 md:p-5 rounded-md border text-left transition-all space-y-3",
              settings.challengeMode === "NORMAL"
                ? "border-lime-500/50 bg-lime-500/5"
                : "border-border bg-[hsl(var(--surface))] hover:border-zinc-600",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm">
                {t("settings.normal")}
              </span>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  settings.challengeMode === "NORMAL"
                    ? "border-lime-400 bg-lime-400 text-zinc-950"
                    : "border-zinc-700 text-transparent group-hover:border-zinc-500",
                )}
              >
                <i className="ri-check-line text-sm" />
              </div>
            </div>
            <ul className="space-y-1.5 font-mono text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <i className="ri-check-line text-green-400" />
                {t("settings.pasteAllowed")}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-close-line text-zinc-600" />
                {t("settings.noTimer")}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-star-line text-yellow-400" />
                {t("settings.cleanSolveStars")}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-star-line text-yellow-400" />
                {t("settings.hintSolveStars")}
              </li>
            </ul>
          </button>

          <button
            onClick={() => save({ challengeMode: "HARD" })}
            className={cn(
              "p-4 md:p-5 rounded-md border text-left transition-all space-y-3",
              settings.challengeMode === "HARD"
                ? "border-lime-500/50 bg-lime-500/5"
                : "border-border bg-[hsl(var(--surface))] hover:border-zinc-600",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm">
                {t("settings.hard")}
              </span>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  settings.challengeMode === "HARD"
                    ? "border-lime-400 bg-lime-400 text-zinc-950"
                    : "border-zinc-700 text-transparent group-hover:border-zinc-500",
                )}
              >
                <i className="ri-check-line text-sm" />
              </div>
            </div>
            <ul className="space-y-1.5 font-mono text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <i className="ri-close-line text-red-400" />
                {t("settings.noPaste")}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-time-line text-yellow-400" />
                {t("settings.timerActive")}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-star-fill text-yellow-400" />
                {t("settings.hardCleanStars")}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-star-fill text-yellow-400" />
                {t("settings.hardHintStars")}
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-arrow-down-line text-red-400" />
                {t("settings.timeExpiredPenalty")}
              </li>
            </ul>
          </button>
        </div>

        <div className="rounded-md border border-border bg-[hsl(var(--surface))]/50 p-4 space-y-3">
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            {t("settings.timeLimits")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: t("settings.easy"),
                time: "15:00",
                color: "text-green-400",
              },
              {
                label: t("settings.medium"),
                time: "30:00",
                color: "text-yellow-400",
              },
              {
                label: t("settings.hard"),
                time: "45:00",
                color: "text-red-400",
              },
            ].map((d) => (
              <div key={d.label} className="text-center">
                <div
                  className={cn(
                    "font-heading font-bold text-lg md:text-xl",
                    d.color,
                  )}
                >
                  {d.time}
                </div>
                <div className="font-mono text-xs text-zinc-500">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {saved && (
        <p className="text-xs font-mono text-lime-400 flex items-center gap-1.5">
          <i className="ri-check-line" />
          {t("settings.saved")}
        </p>
      )}
    </div>
  );
}
