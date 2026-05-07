import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/today");

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.25)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-lime-400/5 blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-border">
        <span className="font-heading font-bold text-lg tracking-tight">
          Grin<span className="text-lime-400">Dev</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-mono text-zinc-400 hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-mono font-bold px-4 py-2 bg-lime-400 text-zinc-950 rounded hover:bg-lime-300 transition-colors"
          >
            Start Free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-20 md:py-32">
        {/* Label */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px w-8 bg-lime-400" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-lime-400">
            Code · Daily · No Excuses
          </span>
          <div className="h-px w-8 bg-lime-400" />
        </div>

        {/* Headline */}
        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.92] mb-8 max-w-3xl">
          Sharpen
          <br />
          <span className="text-lime-400">Your Edge.</span>
        </h1>

        {/* Sub */}
        <p className="font-mono text-zinc-400 text-sm md:text-base leading-relaxed max-w-md mb-10">
          One DSA problem a day. No copy-paste. No Googling.
          <br className="hidden md:block" />
          Hints cost stars — earn them back by solving clean.
        </p>

        {/* CTA */}
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-lime-400 text-zinc-950 font-mono font-bold text-sm rounded hover:bg-lime-300 active:scale-95 transition-all mb-16"
        >
          <i className="ri-play-fill" />
          Start Today's Problem
        </Link>

        {/* Feature pills */}
        <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
          {[
            { icon: "ri-fire-line", label: "Daily Streaks" },
            { icon: "ri-forbid-2-line", label: "No Paste" },
            { icon: "ri-star-line", label: "Hint Economy" },
            { icon: "ri-sword-line", label: "Hard Mode" },
            { icon: "ri-history-line", label: "Make-Up Tasks" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 text-xs font-mono text-zinc-500"
            >
              <i className={`${f.icon} text-lime-400`} />
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 border-t border-border">
        <div className="grid grid-cols-3 divide-x divide-border max-w-2xl mx-auto">
          {[
            { value: "150+", label: "Problems" },
            { value: "4", label: "Hint tiers" },
            { value: "∞", label: "Streak potential" },
          ].map((s) => (
            <div key={s.label} className="py-8 text-center">
              <div className="font-heading font-bold text-2xl md:text-3xl text-lime-400 mb-1">
                {s.value}
              </div>
              <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="relative z-10 border-t border-border px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-400">
              How it works
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
              Three steps to getting sharper.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                icon: "ri-calendar-check-line",
                title: "Get today's problem",
                desc: "One DSA problem every day. Difficulty matches your preference. Miss a day — streak resets.",
              },
              {
                num: "02",
                icon: "ri-keyboard-line",
                title: "Solve it from scratch",
                desc: "The editor blocks paste in Hard mode. Type every character. That's where the learning is.",
              },
              {
                num: "03",
                icon: "ri-trophy-line",
                title: "Earn your badge",
                desc: "Clean solve (no hints) earns stars. Stars unlock hints on harder days. Virtuous cycle.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="relative p-6 bg-[hsl(var(--surface))] border border-border rounded-md overflow-hidden group hover:border-zinc-600 transition-colors"
              >
                <div className="absolute top-3 right-4 font-heading font-bold text-6xl text-zinc-800 leading-none select-none">
                  {step.num}
                </div>
                <i
                  className={`${step.icon} text-lime-400 text-2xl mb-4 block`}
                />
                <h3 className="font-heading font-bold text-sm mb-2">
                  {step.title}
                </h3>
                <p className="font-mono text-xs text-zinc-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hint tiers */}
      <div className="relative z-10 border-t border-border bg-[hsl(var(--surface))]/50 px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-400">
              Hint Economy
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
              Stuck? It'll cost you.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                tier: "Tier 01",
                cost: "1⭐",
                title: "Data Structure",
                desc: "A nudge toward the right data structure.",
              },
              {
                tier: "Tier 02",
                cost: "3⭐",
                title: "Algorithm Name",
                desc: "The pattern or algorithm that solves this.",
              },
              {
                tier: "Tier 03",
                cost: "7⭐",
                title: "Pseudocode",
                desc: "Step-by-step logic in plain English.",
              },
              {
                tier: "Tier 04",
                cost: "15⭐",
                title: "Full Walkthrough",
                desc: "Complete explanation. Streak survives.",
              },
            ].map((h) => (
              <div
                key={h.tier}
                className="p-4 bg-[hsl(var(--surface))] border border-border rounded-md space-y-3 hover:border-lime-500/30 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    {h.tier}
                  </span>
                  <span className="font-mono text-xs text-lime-400">
                    {h.cost}
                  </span>
                </div>
                <div>
                  <div className="font-heading font-bold text-sm mb-1">
                    {h.title}
                  </div>
                  <p className="font-mono text-[11px] text-zinc-500 leading-relaxed">
                    {h.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA footer */}
      <div className="relative z-10 border-t border-border px-6 py-16 text-center space-y-6">
        <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tighter">
          Today's problem is <span className="text-lime-400">waiting.</span>
        </h2>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-lime-400 text-zinc-950 font-mono font-bold text-sm rounded hover:bg-lime-300 active:scale-95 transition-all"
        >
          Start Now — It's Free →
        </Link>
        <p className="font-mono text-xs text-zinc-600">
          No credit card. No excuses.
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 md:px-10 py-6 flex items-center justify-between">
        <span className="font-heading font-bold text-sm">
          Grin<span className="text-lime-400">Dev</span>
        </span>
        <p className="font-mono text-xs text-zinc-600">
          © 2026 GrinDev. Built for devs who want to get better.
        </p>
      </footer>
    </div>
  );
}
