"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { StarCount } from "@/components/ui/StarCount";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { HINT_TIERS } from "@/lib/hints";
import { getMonacoLanguage } from "@/lib/languages";
import type { Language } from "@/lib/languages";
import type {
  MakeupProblemResponse,
  SolveResponse,
  HintResponse,
} from "@/types";
import { cn } from "@/lib/utils";

type PageState = "loading" | "ready" | "running" | "solved" | "error";

export default function MakeupPage() {
  const { date } = useParams<{ date: string }>();
  const router = useRouter();

  const [data, setData] = useState<MakeupProblemResponse | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("JAVASCRIPT");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [solveResult, setSolveResult] = useState<SolveResponse | null>(null);
  const [stars, setStars] = useState(0);
  const [hintsUnlocked, setHintsUnlocked] = useState<number[]>([]);
  const [hintContents, setHintContents] = useState<Record<number, string>>({});
  const [hintLoading, setHintLoading] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [starDelta, setStarDelta] = useState<number | null>(null);
  const hasStartedTyping = useRef(false);

  useEffect(() => {
    fetch(`/api/makeup/${date}`)
      .then((r) => r.json())
      .then((d: MakeupProblemResponse) => {
        setData(d);
        setCode((d.problem.starterCode as any)["JAVASCRIPT"] ?? "");
        setStars(d.userStats.stars);
        setHintsUnlocked(d.hintsUnlocked);
        setHintContents(d.unlockedHintContents ?? {});
        setPageState(d.alreadySolved ? "solved" : "ready");
      })
      .catch(() => setPageState("error"));
  }, [date]);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      if (!hasStartedTyping.current && data) {
        setCode((data.problem.starterCode as any)[lang] ?? "");
      }
    },
    [data],
  );

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

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      if (!hasStartedTyping.current && data) {
        const starter = (data.problem.starterCode as any)[language] ?? "";
        if (value !== starter) hasStartedTyping.current = true;
      }
    },
    [data, language],
  );

  const handleRun = useCallback(async () => {
    if (!data || pageState === "running") return;
    setPageState("running");
    setSolveResult(null);
    setStarDelta(null);

    try {
      const res = await fetch(`/api/makeup/${date}/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: data.problem.id,
          code,
          language,
          challengeMode: "NORMAL",
          timeExpired: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        setPageState("ready");
        return;
      }

      const result: SolveResponse = await res.json();
      setSolveResult(result);
      setAttempts((a) => a + 1);

      if (result.passed) {
        setPageState("solved");
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
  }, [data, date, code, language, pageState]);

  const handleBuyHint = useCallback(
    async (tier: number) => {
      if (!data || hintLoading !== null) return;
      setHintLoading(tier);
      try {
        const res = await fetch("/api/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId: data.problem.id, tier }),
        });
        if (!res.ok) {
          alert((await res.json()).error);
          return;
        }
        const hint: HintResponse = await res.json();
        setStars(hint.starsRemaining);
        setHintsUnlocked((prev) => [...new Set([...prev, tier])]);
        setHintContents((prev) => ({ ...prev, [tier]: hint.content }));
      } finally {
        setHintLoading(null);
      }
    },
    [data, hintLoading],
  );

  if (pageState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  if (pageState === "error" || !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-center space-y-3">
        <div>
          <i className="ri-error-warning-line text-4xl text-red-400 block mb-3" />
          <p className="font-mono text-sm text-zinc-400">
            No problem found for this date.
          </p>
          <button
            onClick={() => router.push("/today")}
            className="mt-4 text-xs font-mono text-lime-400 hover:underline"
          >
            ← Back to today
          </button>
        </div>
      </div>
    );
  }

  const { problem } = data;
  const isSolved = pageState === "solved";
  const daysLabel =
    data.daysAgo === 1 ? "Yesterday" : `${data.daysAgo} days ago`;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/today")}
            className="text-zinc-500 hover:text-foreground transition-colors"
          >
            <i className="ri-arrow-left-line" />
          </button>
          <div className="w-px h-4 bg-border" />
          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5">
            <i className="ri-history-line" /> Make-up · {daysLabel}
          </span>
          <div className="w-px h-4 bg-border" />
          <h1 className="font-heading font-bold text-base">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex items-center gap-3">
          {/* Star cost badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border bg-yellow-500/10 border-yellow-500/20 text-yellow-400 text-xs font-mono">
            <i className="ri-star-fill" />
            {data.starCost} to attempt
          </div>
          {/* Reward notice */}
          {data.makeupRewardGivenToday && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border bg-zinc-800 border-zinc-700 text-zinc-500 text-xs font-mono">
              <i className="ri-information-line" /> No reward today
            </div>
          )}
          <StarCount stars={stars} />
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT */}
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

        {/* RIGHT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-border shrink-0">
            <i className="ri-information-line text-zinc-600 text-sm" />
            <span className="text-xs font-mono text-zinc-600">
              Make-up mode — Normal rules apply
            </span>
            <div className="ml-auto">
              <LanguageSelector
                value={language}
                onChange={handleLanguageChange}
              />
            </div>
          </div>

          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            language={getMonacoLanguage(language)}
            disabled={isSolved}
            pasteBlocked={false}
            className="flex-1 rounded-none border-0"
          />

          <div className="border-t border-border p-4 shrink-0 space-y-3">
            {/* Solved banner */}
            {isSolved && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-lime-500/5 border border-lime-500/20">
                <i className="ri-checkbox-circle-line text-lime-400" />
                <span className="text-sm font-mono text-lime-400">
                  Make-up complete!
                </span>
                {starDelta !== null && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-sm font-mono ml-auto",
                      starDelta >= 0 ? "text-yellow-400" : "text-red-400",
                    )}
                  >
                    <i className="ri-star-fill text-xs" />
                    {starDelta >= 0 ? `+${starDelta}` : starDelta} net
                  </span>
                )}
                <button
                  onClick={() => router.push("/today")}
                  className="ml-auto text-xs font-mono text-zinc-400 hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </div>
            )}

            {/* Test results */}
            {solveResult && solveResult.results && !isSolved && (
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
                    </div>
                    {!r.passed && (
                      <div className="space-y-1 pl-5">
                        {r.input && (
                          <div className="flex gap-3">
                            <span className="text-zinc-600 w-24 shrink-0">
                              Input
                            </span>
                            <span className="text-zinc-400 whitespace-pre">
                              {r.input}
                            </span>
                          </div>
                        )}
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
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-600 flex items-center gap-1.5">
                <i className="ri-refresh-line" />
                {attempts === 0
                  ? "No attempts yet"
                  : `${attempts} attempt${attempts !== 1 ? "s" : ""}`}
              </span>
              <button
                onClick={handleRun}
                disabled={pageState === "running" || isSolved}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-bold transition-all",
                  isSolved
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
