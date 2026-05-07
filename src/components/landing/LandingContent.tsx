"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { LandingLanguageSelector } from "@/components/landing/LandingLanguageSelector";

const FEATURES = [
  { icon: "ri-fire-line", key: "dailyStreaks" },
  { icon: "ri-forbid-2-line", key: "noPaste" },
  { icon: "ri-star-line", key: "hintEconomy" },
  { icon: "ri-sword-line", key: "hardMode" },
  { icon: "ri-history-line", key: "makeUpTasks" },
] as const;

const STATS = [
  { value: "150+", key: "problems" },
  { value: "4", key: "hintTiers" },
  { value: "∞", key: "streakPotential" },
] as const;

const STEPS = [
  {
    num: "01",
    icon: "ri-calendar-check-line",
    key: "dailyProblem",
  },
  {
    num: "02",
    icon: "ri-keyboard-line",
    key: "solveScratch",
  },
  {
    num: "03",
    icon: "ri-trophy-line",
    key: "earnBadge",
  },
] as const;

const HINT_TIERS = [
  { tier: "01", cost: "1⭐", key: "tier1" },
  { tier: "02", cost: "3⭐", key: "tier2" },
  { tier: "03", cost: "7⭐", key: "tier3" },
  { tier: "04", cost: "15⭐", key: "tier4" },
] as const;

export function LandingContent() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.25)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-lime-400/5 blur-3xl pointer-events-none" />

      <nav className="relative z-[100] flex items-center justify-between gap-3 px-4 sm:px-6 md:px-10 py-5 border-b border-border">
        <span className="font-heading font-bold text-lg tracking-tight">
          Grin<span className="text-lime-400">Dev</span>
        </span>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <LandingLanguageSelector />

          <Link
            href="/sign-in"
            className="hidden md:inline-flex text-sm font-mono text-zinc-400 hover:text-foreground transition-colors px-3 py-1.5"
          >
            {t("landing.nav.signIn")}
          </Link>

          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center text-xs sm:text-sm font-mono font-bold px-3 sm:px-4 py-2 bg-lime-400 text-zinc-950 rounded hover:bg-lime-300 transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">
              {t("landing.nav.startFree")}
            </span>
            <span className="sm:hidden">{t("landing.nav.startFreeShort")}</span>
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-20 md:py-32">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px w-8 bg-lime-400" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-lime-400">
            {t("landing.hero.label")}
          </span>
          <div className="h-px w-8 bg-lime-400" />
        </div>

        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.92] mb-8 max-w-3xl">
          {t("landing.hero.titleLine1")}
          <br />
          <span className="text-lime-400">{t("landing.hero.titleLine2")}</span>
        </h1>

        <p className="font-mono text-zinc-400 text-sm md:text-base leading-relaxed max-w-md mb-10">
          {t("landing.hero.subtitleLine1")}
          <br className="hidden md:block" />
          {t("landing.hero.subtitleLine2")}
        </p>

        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-lime-400 text-zinc-950 font-mono font-bold text-sm rounded hover:bg-lime-300 active:scale-95 transition-all mb-16"
        >
          <i className="ri-play-fill" />
          {t("landing.hero.cta")}
        </Link>

        <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
          {FEATURES.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-2 text-xs font-mono text-zinc-500"
            >
              <i className={`${f.icon} text-lime-400`} />
              {t(`landing.features.${f.key}`)}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 border-t border-border">
        <div className="grid grid-cols-3 divide-x divide-border max-w-2xl mx-auto">
          {STATS.map((s) => (
            <div key={s.key} className="py-8 text-center">
              <div className="font-heading font-bold text-2xl md:text-3xl text-lime-400 mb-1">
                {s.value}
              </div>
              <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                {t(`landing.stats.${s.key}`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="relative z-10 border-t border-border px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-400">
              {t("landing.howItWorks.kicker")}
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
              {t("landing.howItWorks.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.key}
                className="relative p-6 bg-[hsl(var(--surface))] border border-border rounded-md overflow-hidden group hover:border-zinc-600 transition-colors"
              >
                <div className="absolute top-3 right-4 font-heading font-bold text-6xl text-zinc-800 leading-none select-none">
                  {step.num}
                </div>

                <i
                  className={`${step.icon} text-lime-400 text-2xl mb-4 block`}
                />

                <h3 className="font-heading font-bold text-sm mb-2">
                  {t(`landing.howItWorks.steps.${step.key}.title`)}
                </h3>

                <p className="font-mono text-xs text-zinc-500 leading-relaxed">
                  {t(`landing.howItWorks.steps.${step.key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border bg-[hsl(var(--surface))]/50 px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-400">
              {t("landing.hints.kicker")}
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
              {t("landing.hints.title")}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HINT_TIERS.map((h) => (
              <div
                key={h.key}
                className="p-4 bg-[hsl(var(--surface))] border border-border rounded-md space-y-3 hover:border-lime-500/30 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    {t("landing.hints.tier")} {h.tier}
                  </span>
                  <span className="font-mono text-xs text-lime-400">
                    {h.cost}
                  </span>
                </div>

                <div>
                  <div className="font-heading font-bold text-sm mb-1">
                    {t(`landing.hints.items.${h.key}.title`)}
                  </div>
                  <p className="font-mono text-[11px] text-zinc-500 leading-relaxed">
                    {t(`landing.hints.items.${h.key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative z-10 border-t border-border px-6 py-16 text-center space-y-6">
        <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tighter">
          {t("landing.footer.titlePrefix")}{" "}
          <span className="text-lime-400">
            {t("landing.footer.titleHighlight")}
          </span>
        </h2>

        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-lime-400 text-zinc-950 font-mono font-bold text-sm rounded hover:bg-lime-300 active:scale-95 transition-all"
        >
          <i className="ri-play-fill" />
          {t("landing.footer.startNow")}
        </Link>

        <p className="font-mono text-xs text-zinc-600">
          {t("landing.footer.noCreditCard")}
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-heading font-bold text-sm">
          Grin<span className="text-lime-400">Dev</span>
        </span>

        <p className="font-mono text-xs text-zinc-600 text-center sm:text-right">
          {t("landing.footer.copyright")}
        </p>
      </footer>
    </div>
  );
}
