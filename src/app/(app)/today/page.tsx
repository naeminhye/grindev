"use client";

import { useEffect, useState, useCallback } from "react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { StreakBadge } from "@/components/streak/StreakBadge";
import { StarCount } from "@/components/ui/StarCount";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { HINT_TIERS } from "@/lib/hints";
import type { DailyResponse, SolveResponse, HintResponse } from "@/types";
import { cn } from "@/lib/utils";

type PageState = "loading" | "ready" | "running" | "solved" | "error";

export default function DailyPage() {
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [code, setCode] = useState("");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [solveResult, setSolveResult] = useState<SolveResponse | null>(null);
  const [stars, setStars] = useState(0);
  const [hintsUnlocked, setHintsUnlocked] = useState<number[]>([]);
  const [hintContents, setHintContents] = useState<Record<number, string>>({});
  const [hintLoading, setHintLoading] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((data: DailyResponse) => {
        setDaily(data);
        setCode(data.problem.starterCode);
        setStars(data.userStats.stars);
        setHintsUnlocked(data.hintsUnlocked);
        setPageState(data.alreadySolved ? "solved" : "ready");
      })
      .catch(() => setPageState("error"));
  }, []);

  const handleRun = useCallback(async () => {
    if (!daily || pageState === "running") return;
    setPageState("running");
    setSolveResult(null);

    try {
      // 1. Run code via Piston from browser (avoids server egress block)
      const pistonRes = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "javascript",
          version: "18.15.0",
          files: [{ content: code }],
        }),
      });
      const pistonData = await pistonRes.json();
      console.log("piston output:", pistonData);

      // 2. Send code + piston output to your API for test validation
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: daily.problem.id,
          code,
          language: "javascript",
          pistonOutput: pistonData.run?.stdout ?? "",
        }),
      });
      const result: SolveResponse = await res.json();
      console.log("solve result:", result);
      setSolveResult(result);
      setPageState(result.passed ? "solved" : "ready");
    } catch (e) {
      console.error(e);
      setPageState("ready");
    }
  }, [daily, code, pageState]);

  const handleBuyHint = useCallback(
    async (tier: number) => {
      if (!daily || hintLoading !== null) return;
      setHintLoading(tier);

      try {
        const res = await fetch("/api/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId: daily.problem.id, tier }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error);
          return;
        }

        const data: HintResponse = await res.json();
        setStars(data.starsRemaining);
        setHintsUnlocked((prev) => [...new Set([...prev, tier])]);
        setHintContents((prev) => ({ ...prev, [tier]: data.content }));
      } finally {
        setHintLoading(null);
      }
    },
    [daily, hintLoading],
  );

  if (pageState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 font-mono text-sm">
          <i className="ri-loader-4-line animate-spin text-lime-400" />
          Loading today's problem...
        </div>
      </div>
    );
  }

  if (pageState === "error" || !daily) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="ri-error-warning-line text-4xl text-red-400" />
          <p className="font-mono text-sm text-zinc-400">
            No problem scheduled for today.
          </p>
        </div>
      </div>
    );
  }

  const { problem, userStats } = daily;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-heading font-bold text-base">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
            {problem.topic.replace("_", " ")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge streak={userStats.currentStreak} />
          <StarCount stars={stars} />
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Problem + Hints */}
        <div className="w-[42%] flex flex-col border-r border-border overflow-y-auto">
          {/* Problem description */}
          <div
            className="p-6 prose prose-invert prose-sm max-w-none font-mono
            prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-border"
          >
            <div
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(problem.description),
              }}
            />
          </div>

          {/* Hint panel */}
          <div className="border-t border-border p-6 space-y-3 mt-auto">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-lightbulb-line text-yellow-400" />
              <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                Hints
              </span>
              <span className="text-xs text-zinc-600 ml-auto">costs stars</span>
            </div>

            {HINT_TIERS.map((tier) => {
              const isUnlocked = hintsUnlocked.includes(tier.tier);
              const content = hintContents[tier.tier];
              const isLoading = hintLoading === tier.tier;

              return (
                <div
                  key={tier.tier}
                  className={cn(
                    "rounded-md border transition-colors",
                    isUnlocked
                      ? "border-lime-500/20 bg-lime-500/5"
                      : "border-border bg-zinc-900/50",
                  )}
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <i
                        className={cn(
                          tier.icon,
                          "text-sm",
                          isUnlocked ? "text-lime-400" : "text-zinc-500",
                        )}
                      />
                      <span className="font-mono text-xs font-medium">
                        {tier.label}
                      </span>
                    </div>
                    {isUnlocked ? (
                      <span className="text-xs text-lime-400 font-mono flex items-center gap-1">
                        <i className="ri-check-line" /> unlocked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuyHint(tier.tier)}
                        disabled={isLoading || stars < tier.cost}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors",
                          stars >= tier.cost
                            ? "bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-zinc-700"
                            : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed",
                        )}
                      >
                        {isLoading ? (
                          <i className="ri-loader-4-line animate-spin" />
                        ) : (
                          <>
                            <i className="ri-star-fill" /> {tier.cost}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {isUnlocked && content && (
                    <div className="px-3 pb-3">
                      <div className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap border-t border-lime-500/10 pt-3">
                        {content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Editor + Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Paste warning bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-border shrink-0">
            <i className="ri-forbid-2-line text-red-400 text-sm" />
            <span className="text-xs font-mono text-zinc-500">
              Paste disabled — type your solution from scratch
            </span>
            <span className="ml-auto text-xs font-mono text-zinc-600">
              JavaScript
            </span>
          </div>

          {/* Monaco */}
          <CodeEditor
            value={code}
            onChange={setCode}
            language="javascript"
            disabled={pageState === "solved"}
            className="flex-1 rounded-none border-0"
          />

          {/* Footer — run button + results */}
          <div className="border-t border-border p-4 shrink-0 space-y-3">
            {/* Test results */}
            {solveResult && solveResult.results && (
              <div className="flex items-center gap-2 flex-wrap">
                {solveResult.results.map((r) => (
                  <div
                    key={r.index}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono",
                      r.passed
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20",
                    )}
                  >
                    <i
                      className={r.passed ? "ri-check-line" : "ri-close-line"}
                    />
                    Test {r.index}
                  </div>
                ))}
                {solveResult.passed && (
                  <div className="ml-auto flex items-center gap-2 text-sm font-mono text-lime-400">
                    <i className="ri-trophy-line" />
                    {solveResult.streak?.isNewRecord
                      ? `New record! ${solveResult.streak.currentStreak} day streak 🔥`
                      : `All tests passed · ${solveResult.streak?.currentStreak ?? 0} day streak`}
                  </div>
                )}
              </div>
            )}

            {/* Already solved banner */}
            {pageState === "solved" && !solveResult && (
              <div className="flex items-center gap-2 text-sm font-mono text-lime-400">
                <i className="ri-checkbox-circle-line" />
                Already solved today. Come back tomorrow!
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-600">
                <i className="ri-time-line mr-1" />
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <button
                onClick={handleRun}
                disabled={pageState === "running" || pageState === "solved"}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-bold transition-all",
                  pageState === "solved"
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95",
                )}
              >
                {pageState === "running" ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" /> Running...
                  </>
                ) : (
                  <>
                    <i className="ri-play-fill" /> Run Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal markdown renderer — replace with react-markdown in a real app
function markdownToHtml(md: string): string {
  return md
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
