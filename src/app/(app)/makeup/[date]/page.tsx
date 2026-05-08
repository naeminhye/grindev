"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { CodeEditor } from "@/components/editor/CodeEditor";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { StarCount } from "@/components/ui/StarCount";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProblemPanel } from "@/components/problem/ProblemPanel";
import { MobileTabs } from "@/components/problem/MobileTabs";
import { TestResults } from "@/components/problem/TestResults";
import { CodeActionBar } from "@/components/problem/CodeActionBar";

import { getMonacoLanguage } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type {
  MakeupProblemResponse,
  SolveResponse,
  HintResponse,
} from "@/types";
import { DEFAULT_EXPLAIN_COST } from "@/app/api/ai/explain/route";
import { DEFAULT_REVIEW_COST } from "@/app/api/ai/review/route";
import { AICodeReview } from "@/components/problem/AICodeReview";

type PageState = "loading" | "ready" | "running" | "solved" | "error";
type MobileTab = "problem" | "code";

export default function MakeupPage() {
  const { t } = useI18n();
  const { date } = useParams<{ date: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

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
  const [hintDiscount, setHintDiscount] = useState(0);
  const [explainCost, setExplainCost] = useState(DEFAULT_EXPLAIN_COST);
  const [reviewCost, setReviewCost] = useState(DEFAULT_REVIEW_COST);

  const hasStartedTyping = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/makeup/${date}?slug=${slug}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: MakeupProblemResponse) => {
        setData(d);
        setCode((d.problem.starterCode as any)["JAVASCRIPT"] ?? "");
        setStars(d.userStats.stars);
        setHintsUnlocked(d.hintsUnlocked);
        setHintContents(d.unlockedHintContents ?? {});
        setHintDiscount((d as any).hintDiscount ?? 0);
        setExplainCost((d as any).explainCost ?? 5);
        setReviewCost((d as any).reviewCost ?? 5);
        setPageState(d.alreadySolved ? "solved" : "ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setPageState("error");
      });
    return () => controller.abort();
  }, [date, searchParams]);

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

  // Trial run — no DB writes, no attempt count
  const handleRun = useCallback(async () => {
    if (!data || pageState === "running") return;
    setPageState("running");
    setSolveResult(null);
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
          submit: false,
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
      setPageState("ready");
      setMobileTab("code");
    } catch {
      setPageState("ready");
    }
  }, [data, date, code, pageState]);

  // Submit — counts attempt, deducts star cost, awards reward
  const handleSubmit = useCallback(async () => {
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
          submit: true,
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

  if (pageState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 font-mono text-sm">
          <i className="ri-loader-4-line animate-spin text-lime-400" />
          {t("makeup.loading")}
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
            onClick={() => router.push(`/today?t=${Date.now()}`)}
            className="text-xs font-mono text-lime-400 hover:underline"
          >
            {t("makeup.back")}
          </button>
        </div>
      </div>
    );
  }

  const { problem } = data;
  const isSolved = pageState === "solved";
  const daysLabel =
    data.daysAgo === 1
      ? t("makeup.yesterday")
      : t("makeup.daysAgo", { count: data.daysAgo });

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

      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push(`/today?t=${Date.now()}`)}
            className="text-zinc-500 hover:text-foreground transition-colors shrink-0"
          >
            <i className="ri-arrow-left-line" />
          </button>
          <div className="w-px h-4 bg-border shrink-0" />
          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1.5 shrink-0">
            <i className="ri-history-line" />
            <span className="hidden sm:inline">
              {t("profile.makeUp")} ·
            </span>{" "}
            {daysLabel}
          </span>
          <div className="w-px h-4 bg-border shrink-0" />
          <h1 className="font-heading font-bold text-sm md:text-base truncate">
            {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        {/* Left part */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-8 flex items-center gap-1.5 px-2.5 py-1 rounded border bg-yellow-500/10 border-yellow-500/20 text-yellow-400 text-xs font-mono">
            <i className="ri-star-fill" />
            {data.starCost} {t("makeup.toAttempt")}
          </div>
          {data.makeupRewardGivenToday && (
            <div className="h-8 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border bg-[hsl(var(--surface-raised))] border-zinc-700 text-zinc-500 text-xs font-mono">
              <i className="ri-information-line" /> {t("makeup.noRewardToday")}
            </div>
          )}
          <StarCount stars={stars} />
        </div>
      </div>

      <MobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />

      <div className="min-h-0 overflow-hidden grid grid-cols-1 md:grid-cols-[50%_minmax(0,1fr)]">
        <ProblemPanel
          problem={problem}
          mobileTab={mobileTab}
          stars={stars}
          hintsUnlocked={hintsUnlocked}
          hintContents={hintContents}
          hintLoading={hintLoading}
          onBuyHint={handleBuyHint}
          hintDiscount={hintDiscount}
          onStarsChange={setStars}
          explainCost={explainCost}
        />

        {/* Code panel */}
        <section
          className={cn(
            "min-h-0 overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]",
            mobileTab === "code" ? "grid" : "hidden md:grid",
          )}
        >
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[hsl(var(--surface))] border-b border-border shrink-0">
            <i className="ri-information-line text-zinc-600 text-sm" />
            <span className="text-xs font-mono text-zinc-600 hidden sm:inline">
              {t("today.makeupMode")}
            </span>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded border border-zinc-700 bg-[hsl(var(--surface-raised))] text-xs font-mono text-zinc-400">
              <i className="ri-code-s-slash-line text-lime-400" />
              JavaScript
              <span className="text-zinc-600 text-[10px]">only</span>
            </div>
          </div>

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

          <div className="border-t border-border shrink-0">
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
                    onClick={() => router.push(`/today?t=${Date.now()}`)}
                    className="ml-auto text-xs font-mono text-zinc-400 hover:text-foreground transition-colors"
                  >
                    {t("makeup.backShort")}
                  </button>
                </div>
              </div>
            )}

            {solveResult?.results && !isSolved && (
              <div className="px-3 md:px-4 pt-3">
                <TestResults
                  solveResult={solveResult}
                  starDelta={starDelta}
                  showStreakInfo={false}
                />
              </div>
            )}

            {solveResult && (
              <div className="px-3 md:px-4 pt-2">
                <AICodeReview
                  problemId={problem.id}
                  problemTitle={problem.title}
                  problemDescription={problem.description}
                  code={code}
                  language="JAVASCRIPT"
                  passed={solveResult.passed}
                  stars={stars}
                  onStarsChange={setStars}
                  reviewCost={reviewCost}
                />
              </div>
            )}

            <CodeActionBar
              attempts={attempts}
              pageState={pageState}
              isSolved={isSolved}
              onReset={handleResetCode}
              onRun={handleRun}
              onSubmit={handleSubmit}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
