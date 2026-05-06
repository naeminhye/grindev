"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { StarCount } from "@/components/ui/StarCount";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { HINT_TIERS } from "@/lib/hints";
import { getMonacoLanguage } from "@/lib/languages";
import type {
  MakeupProblemResponse,
  SolveResponse,
  HintResponse,
  ProblemExample,
} from "@/types";
import { cn } from "@/lib/utils";

type PageState = "loading" | "ready" | "running" | "solved" | "error";
type MobileTab = "problem" | "code";

export default function MakeupPage() {
  const { date } = useParams<{ date: string }>();
  const router = useRouter();

  const [data, setData] = useState<MakeupProblemResponse | null>(null);
  const [code, setCode] = useState("");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [solveResult, setSolveResult] = useState<SolveResponse | null>(null);
  const [stars, setStars] = useState(0);
  const [hintsUnlocked, setHintsUnlocked] = useState<number[]>([]);
  const [hintContents, setHintContents] = useState<Record<number, string>>({});
  const [hintLoading, setHintLoading] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [starDelta, setStarDelta] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("problem");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasStartedTyping = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/makeup/${date}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: MakeupProblemResponse) => {
        setData(d);
        setCode((d.problem.starterCode as any)["JAVASCRIPT"] ?? "");
        setStars(d.userStats.stars);
        setHintsUnlocked(d.hintsUnlocked);
        setHintContents(d.unlockedHintContents ?? {});
        setPageState(d.alreadySolved ? "solved" : "ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setPageState("error");
      });

    return () => controller.abort();
  }, [date]);

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
        const starter = (data.problem.starterCode as any)["JAVASCRIPT"] ?? "";
        if (value !== starter) hasStartedTyping.current = true;
      }
    },
    [data],
  );

  function handleResetCode() {
    setShowResetConfirm(true);
  }
  function confirmResetCode() {
    const starter = (data?.problem?.starterCode as any)?.["JAVASCRIPT"] ?? "";
    setCode(starter);
    setSolveResult(null);
    hasStartedTyping.current = false;
    setShowResetConfirm(false);
  }

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
          language: "JAVASCRIPT",
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
        setMobileTab("code");
      }
    } catch {
      setPageState("ready");
    }
  }, [data, date, code, pageState]);

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

  // ── Loading ───────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 font-mono text-sm">
          <i className="ri-loader-4-line animate-spin text-lime-400" />
          Loading make-up problem...
        </div>
      </div>
    );
  }

  if (pageState === "error" || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="ri-error-warning-line text-4xl text-red-400" />
          <p className="font-mono text-sm text-zinc-400">
            No problem found for this date.
          </p>
          <button
            onClick={() => router.push("/today")}
            className="text-xs font-mono text-lime-400 hover:underline"
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
  const examples = (problem.examples ?? []) as ProblemExample[];

  // ── Header ────────────────────────────────────────────────────────────
  const Header = (
    <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 gap-2 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => router.push("/today")}
          className="text-zinc-500 hover:text-foreground transition-colors shrink-0"
        >
          <i className="ri-arrow-left-line" />
        </button>
        <div className="w-px h-4 bg-border shrink-0" />
        <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5 shrink-0">
          <i className="ri-history-line" />
          <span className="hidden sm:inline">Make-up ·</span> {daysLabel}
        </span>
        <div className="w-px h-4 bg-border shrink-0" />
        <h1 className="font-heading font-bold text-sm md:text-base truncate">
          {problem.title}
        </h1>
        <DifficultyBadge difficulty={problem.difficulty} />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Star cost */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border bg-yellow-500/10 border-yellow-500/20 text-yellow-400 text-xs font-mono">
          <i className="ri-star-fill" />
          {data.starCost} to attempt
        </div>

        {/* No reward notice */}
        {data.makeupRewardGivenToday && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border bg-zinc-800 border-zinc-700 text-zinc-500 text-xs font-mono">
            <i className="ri-information-line" /> No reward today
          </div>
        )}

        <StarCount stars={stars} />
      </div>
    </div>
  );

  // ── Mobile tabs ───────────────────────────────────────────────────────
  const MobileTabs = (
    <div className="flex md:hidden border-b border-border shrink-0">
      {(["problem", "code"] as MobileTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setMobileTab(tab)}
          className={cn(
            "flex-1 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors",
            mobileTab === tab
              ? "text-lime-400 border-b-2 border-lime-400"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {tab === "problem" ? (
            <>
              <i className="ri-file-text-line mr-1.5" />
              Problem
            </>
          ) : (
            <>
              <i className="ri-code-s-slash-line mr-1.5" />
              Code
            </>
          )}
        </button>
      ))}
    </div>
  );

  // ── Problem panel ─────────────────────────────────────────────────────
  const ProblemPanel = (
    <aside
      className={cn(
        "min-h-0 overflow-y-auto custom-scrollbar border-border",
        "md:border-r",
        mobileTab === "problem" ? "block" : "hidden md:block",
      )}
    >
      <div className="p-4 md:p-6 space-y-8">
        <ProblemMarkdownSection>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.description}
          </ReactMarkdown>
        </ProblemMarkdownSection>

        {examples.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-base font-bold tracking-tight text-zinc-100">
              Examples
            </h2>
            {examples.map((example, index) => (
              <div
                key={index}
                className="rounded-md border border-border bg-zinc-900/50 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-border bg-zinc-900">
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    Example {index + 1}
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                      Input
                    </p>
                    <ProblemMarkdownSection compact>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {example.input}
                      </ReactMarkdown>
                    </ProblemMarkdownSection>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                      Output
                    </p>
                    <ProblemMarkdownSection compact>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {example.output}
                      </ReactMarkdown>
                    </ProblemMarkdownSection>
                  </div>
                  {example.explanation && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                        Explanation
                      </p>
                      <ProblemMarkdownSection compact>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {example.explanation}
                        </ReactMarkdown>
                      </ProblemMarkdownSection>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {problem.constraints && (
          <section className="space-y-3">
            <h2 className="font-heading text-base font-bold tracking-tight text-zinc-100">
              Constraints
            </h2>
            <ProblemMarkdownSection>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problem.constraints}
              </ReactMarkdown>
            </ProblemMarkdownSection>
          </section>
        )}
      </div>

      {/* Hints */}
      <div className="border-t border-border p-4 md:p-6 space-y-3">
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
    </aside>
  );

  // ── Code panel ────────────────────────────────────────────────────────
  const CodePanel = (
    <section
      className={cn(
        "min-h-0 overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]",
        mobileTab === "code" ? "grid" : "hidden md:grid",
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-zinc-900 border-b border-border shrink-0">
        <i className="ri-information-line text-zinc-600 text-sm" />
        <span className="text-xs font-mono text-zinc-600 hidden sm:inline">
          Make-up mode — Normal rules apply
        </span>
        <div className="ml-auto">
          {/* TODO: add more language */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-xs font-mono text-zinc-400">
            <i className="ri-code-s-slash-line text-lime-400" />
            JavaScript
            <span className="text-zinc-600 text-[10px]">only</span>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-0 overflow-hidden">
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          language={getMonacoLanguage("JAVASCRIPT")}
          disabled={isSolved}
          pasteBlocked={false}
          className="h-full min-h-0 rounded-none border-0"
        />
      </div>

      {/* Footer */}
      <div className="border-t border-border shrink-0 space-y-3">
        {/* Solved banner */}
        {isSolved && (
          <div className="px-3 md:px-4 pt-3">
            <div className="flex items-center gap-3 p-3 rounded-md bg-lime-500/5 border border-lime-500/20 flex-wrap">
              <i className="ri-checkbox-circle-line text-lime-400 shrink-0" />
              <span className="text-sm font-mono text-lime-400">
                Make-up complete!
              </span>
              {starDelta !== null && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-mono",
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
                ← Back to today
              </button>
            </div>
          </div>
        )}

        {/* Test results */}
        {solveResult && solveResult.results && !isSolved && (
          <div className="px-3 md:px-4 pt-3 space-y-2 max-h-32 md:max-h-44 overflow-y-auto custom-scrollbar">
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
                  {r.passed && <span className="text-green-600">Passed</span>}
                </div>
                {!r.passed && (
                  <div className="space-y-1 pl-5">
                    {r.input && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-zinc-600 w-20 shrink-0">
                          Input
                        </span>
                        <span className="text-zinc-400 whitespace-pre break-all">
                          {r.input}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-zinc-600 w-20 shrink-0">
                        Expected
                      </span>
                      <span className="text-green-400 break-all">
                        {r.expected}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-zinc-600 w-20 shrink-0">
                        Your output
                      </span>
                      <span className="text-red-400 break-all">
                        {r.actual || <em className="text-zinc-600">empty</em>}
                      </span>
                    </div>
                    {r.stderr && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-zinc-600 w-20 shrink-0">
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

        {/* Action bar */}
        <div className="border-t border-border p-3 md:p-4 bg-background">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-zinc-600 flex items-center gap-1.5 shrink-0">
              <i className="ri-refresh-line" />
              {attempts === 0
                ? "No attempts"
                : `${attempts} attempt${attempts !== 1 ? "s" : ""}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCode}
                disabled={pageState === "running" || isSolved}
                className={cn(
                  "h-10 shrink-0 rounded-md border border-border px-4 text-sm font-mono font-semibold text-zinc-400 transition-colors",
                  "hover:border-primary hover:text-primary",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-reset-left-line" />
                  Reset
                </span>
              </button>
              <button
                onClick={handleRun}
                disabled={pageState === "running" || isSolved}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-5 py-2.5 rounded font-mono text-sm font-bold transition-all",
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
    </section>
  );

  return (
    <div className="h-[calc(100dvh-3.5rem)] overflow-hidden grid grid-rows-[auto_auto_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)]">
      {showResetConfirm && (
        <ConfirmDialog
          title="Reset Code"
          message="Reset to the starter template? Your current code will be lost."
          confirmLabel="Reset"
          variant="warning"
          onConfirm={confirmResetCode}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      <div className="shrink-0">{Header}</div>
      <div className="md:hidden shrink-0">{MobileTabs}</div>
      <div className="min-h-0 overflow-hidden grid grid-cols-1 md:grid-cols-[50%_minmax(0,1fr)]">
        {ProblemPanel}
        {CodePanel}
      </div>
    </div>
  );
}

function ProblemMarkdownSection({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none font-mono",
        "prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-zinc-100",
        "prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-100",
        "prose-code:bg-zinc-800 prose-code:text-lime-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border prose-pre:text-zinc-200",
        "prose-a:text-lime-400",
        "prose-table:border prose-table:border-border",
        "prose-th:border prose-th:border-border prose-th:bg-zinc-900 prose-th:px-3 prose-th:py-2",
        "prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2",
        compact && "prose-p:my-1 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2",
      )}
    >
      {children}
    </div>
  );
}
