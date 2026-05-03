"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { StreakBadge } from "@/components/streak/StreakBadge";
import { StarCount } from "@/components/ui/StarCount";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { TimerDisplay } from "@/components/ui/TimerDisplay";
import { useTimer } from "@/hooks/useTimer";
import { HINT_TIERS } from "@/lib/hints";
import { getTimeLimit, calculateStarDelta } from "@/lib/challenge";
import type { DailyResponse, SolveResponse, HintResponse } from "@/types";
import type { ChallengeMode } from "@/lib/challenge";
import { cn } from "@/lib/utils";

type PageState = "loading" | "ready" | "running" | "solved" | "error";

export default function TodayPage() {
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [code, setCode] = useState("");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [solveResult, setSolveResult] = useState<SolveResponse | null>(null);
  const [stars, setStars] = useState(0);
  const [hintsUnlocked, setHintsUnlocked] = useState<number[]>([]);
  const [hintContents, setHintContents] = useState<Record<number, string>>({});
  const [hintLoading, setHintLoading] = useState<number | null>(null);
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>("NORMAL");
  const [modeLocked, setModeLocked] = useState(false);
  const [starDelta, setStarDelta] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const hasStartedTyping = useRef(false);

  const timer = useTimer({
    initialSeconds: daily ? getTimeLimit(daily.problem.difficulty) : 15 * 60,
    onExpire: () => {},
  });

  // ── Load daily + settings ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/daily").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(
        ([dailyData, settingsData]: [
          DailyResponse,
          { challengeMode: ChallengeMode },
        ]) => {
          setDaily(dailyData);
          setCode(dailyData.problem.starterCode);
          setStars(dailyData.userStats.stars);
          setHintsUnlocked(dailyData.hintsUnlocked);
          setHintContents(dailyData.unlockedHintContents ?? {}); // ← restore on reload
          setChallengeMode(settingsData.challengeMode);
          setPageState(dailyData.alreadySolved ? "solved" : "ready");
          if (dailyData.alreadySolved) setModeLocked(true);
        },
      )
      .catch(() => setPageState("error"));
  }, []);

  // ── Tab close warning ─────────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasStartedTyping.current && pageState === "ready") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pageState]);

  // ── Code change — lock mode + start timer on first edit ──────────────
  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      if (!hasStartedTyping.current && value !== daily?.problem.starterCode) {
        hasStartedTyping.current = true;
        setModeLocked(true);
        if (challengeMode === "HARD") timer.start();
      }
    },
    [daily, challengeMode, timer],
  );

  // ── Run code ──────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!daily || pageState === "running") return;
    setPageState("running");
    setSolveResult(null);
    setStarDelta(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: daily.problem.id,
          code,
          language: "javascript",
          challengeMode,
          timeExpired: timer.isExpired,
        }),
      });
      const result: SolveResponse = await res.json();
      setSolveResult(result);
      setAttempts((a) => a + 1);

      if (result.passed) {
        setPageState("solved");
        timer.stop();
        if (result.starDelta !== undefined) {
          setStarDelta(result.starDelta);
          setStars((s) => Math.max(0, s + result.starDelta!));
        }
      } else {
        setPageState("ready");
      }
    } catch {
      setPageState("ready");
    }
  }, [daily, code, pageState, challengeMode, timer]);

  // ── Buy hint ──────────────────────────────────────────────────────────
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
          alert((await res.json()).error);
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
  const isHard = challengeMode === "HARD";

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-heading font-bold text-base">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
            {problem.topic.replace(/_/g, " ")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Challenge mode badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono",
              isHard
                ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-400",
            )}
          >
            <i className={isHard ? "ri-sword-line" : "ri-shield-line"} />
            {isHard ? "Hard" : "Normal"}
            {modeLocked && (
              <i
                className="ri-lock-line text-zinc-600 ml-0.5"
                title="Mode locked for this problem"
              />
            )}
          </div>

          {/* Timer */}
          {isHard && modeLocked && (
            <TimerDisplay
              secondsLeft={timer.secondsLeft}
              isExpired={timer.isExpired}
              isVisible={timer.isVisible}
              onToggleVisibility={timer.toggleVisibility}
            />
          )}

          <StreakBadge streak={userStats.currentStreak} />
          <StarCount stars={stars} />
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Problem + Hints */}
        <div className="w-[42%] flex flex-col border-r border-border overflow-y-auto">
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

          {/* Hints */}
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
          {/* Mode bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-border shrink-0">
            {isHard ? (
              <>
                <i className="ri-forbid-2-line text-red-400 text-sm" />
                <span className="text-xs font-mono text-zinc-500">
                  Hard mode — paste disabled
                </span>
              </>
            ) : (
              <>
                <i className="ri-information-line text-zinc-600 text-sm" />
                <span className="text-xs font-mono text-zinc-600">
                  Normal mode — paste allowed, fewer stars
                </span>
              </>
            )}
            <span className="ml-auto text-xs font-mono text-zinc-600">
              JavaScript
            </span>
          </div>

          {/* Editor */}
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            language="javascript"
            disabled={pageState === "solved"}
            pasteBlocked={isHard}
            className="flex-1 rounded-none border-0"
          />

          {/* Footer */}
          <div className="border-t border-border p-4 shrink-0 space-y-3">
            {/* Test results */}
            {solveResult && solveResult.results && (
              <div className="space-y-2">
                {solveResult.results.map((r) => (
                  <div
                    key={r.index}
                    className={cn(
                      "rounded-md border p-3 text-xs font-mono space-y-2",
                      r.passed
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-red-500/5 border-red-500/20",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <i
                        className={
                          r.passed
                            ? "ri-check-line text-green-400"
                            : "ri-close-line text-red-400"
                        }
                      />
                      <span
                        className={r.passed ? "text-green-400" : "text-red-400"}
                      >
                        Test {r.index}
                      </span>
                      {r.passed && (
                        <span className="text-green-600">Passed</span>
                      )}
                    </div>
                    {!r.passed && (
                      <div className="space-y-1 pl-5">
                        <div className="flex gap-3">
                          <span className="text-zinc-600 w-24 shrink-0">
                            Expected
                          </span>
                          <span className="text-green-400">{r.expected}</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-zinc-600 w-24 shrink-0">
                            Your output
                          </span>
                          <span className="text-red-400">
                            {r.actual || (
                              <em className="text-zinc-600">empty</em>
                            )}
                          </span>
                        </div>
                        {r.stderr && (
                          <div className="flex gap-3">
                            <span className="text-zinc-600 w-24 shrink-0">
                              Error
                            </span>
                            <span className="text-red-400 break-all">
                              {r.stderr}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {solveResult.passed && (
                  <div className="flex items-center gap-3 pt-1">
                    {solveResult.starDelta !== undefined &&
                      solveResult.starDelta !== 0 && (
                        <span
                          className={cn(
                            "flex items-center gap-1 text-sm font-mono",
                            solveResult.starDelta > 0
                              ? "text-yellow-400"
                              : "text-red-400",
                          )}
                        >
                          <i className="ri-star-fill text-xs" />
                          {solveResult.starDelta > 0
                            ? `+${solveResult.starDelta}`
                            : solveResult.starDelta}
                        </span>
                      )}
                    {timer.isExpired && isHard && (
                      <span className="text-red-400 text-xs flex items-center gap-1">
                        <i className="ri-alarm-warning-line" /> Time expired
                      </span>
                    )}
                    <span className="text-lime-400 text-sm font-mono flex items-center gap-1.5">
                      <i className="ri-trophy-line" />
                      {solveResult.streak?.isNewRecord
                        ? `New record! ${solveResult.streak.currentStreak} days 🔥`
                        : `${solveResult.streak?.currentStreak ?? 0} day streak`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Already solved */}
            {pageState === "solved" && !solveResult && (
              <div className="flex items-center gap-2 text-sm font-mono text-lime-400">
                <i className="ri-checkbox-circle-line" />
                Already solved today. Come back tomorrow!
              </div>
            )}

            <div className="flex items-center justify-between">
              {/* Attempts counter */}
              <span className="text-xs font-mono text-zinc-600 flex items-center gap-1.5">
                <i className="ri-refresh-line" />
                {attempts === 0
                  ? "No attempts yet"
                  : `${attempts} attempt${attempts !== 1 ? "s" : ""}`}
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
