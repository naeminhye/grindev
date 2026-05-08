"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { CodeEditor } from "@/components/editor/CodeEditor";
import { StarCount } from "@/components/ui/StarCount";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { TimerDisplay } from "@/components/ui/TimerDisplay";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { NoProblemScreen } from "@/components/ui/NoProblemScreen";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProblemPanel } from "@/components/problem/ProblemPanel";
import { MobileTabs } from "@/components/problem/MobileTabs";
import { TestResults } from "@/components/problem/TestResults";
import { CodeActionBar } from "@/components/problem/CodeActionBar";
import { HardModeGate } from "@/components/ui/HardModeGate";
import {
  DifficultyReloadBanner,
  useReloadWarning,
} from "@/components/ui/ReloadWarning";

import { useTimer } from "@/hooks/useTimer";
import { getMonacoLanguage } from "@/lib/languages";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import type {
  DailyResponse,
  SolveResponse,
  HintResponse,
  NoProblemResponse,
  Settings,
} from "@/types";
import type { ChallengeMode } from "@/lib/challenge";
import { MakeupCard } from "@/components/problem/MakeupCard";

import { TIME_LIMIT_DEFAULTS } from "@/lib/game-config";

type PageState = "loading" | "ready" | "running" | "solved" | "error";
type MobileTab = "problem" | "code";

export default function DSATodayPage() {
  const { t } = useI18n();
  const router = useRouter();

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
  const [mobileTab, setMobileTab] = useState<MobileTab>("problem");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [noProblemData, setNoProblemData] = useState<NoProblemResponse | null>(
    null,
  );
  const [diffNoteVisible, setDiffNoteVisible] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [skipCount, setSkipCount] = useState(0);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [hardGatePassed, setHardGatePassed] = useState(false);
  const [preferredDifficulty, setPreferredDifficulty] = useState("ANY");
  const [hintDiscount, setHintDiscount] = useState(0);

  const hasStartedTyping = useRef(false);

  const timeLimitSeconds = daily
    ? (daily.hardTimeLimits?.[daily.problem.difficulty] ??
      TIME_LIMIT_DEFAULTS[
        `HARD_TIME_${daily.problem.difficulty}` as keyof typeof TIME_LIMIT_DEFAULTS
      ])
    : TIME_LIMIT_DEFAULTS.HARD_TIME_EASY;

  const timer = useTimer({
    initialSeconds: TIME_LIMIT_DEFAULTS.HARD_TIME_EASY, // placeholder — reset below when daily loads
    onExpire: () => {},
  });

  // Reset to correct duration once daily data and time limits are known
  useEffect(() => {
    if (!daily || timer.isRunning || timer.isExpired) return;
    timer.reset(timeLimitSeconds);
  }, [daily?.problem?.difficulty, timeLimitSeconds]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/daily").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([dailyData, settingsData]: [DailyResponse, Settings]) => {
        if ((dailyData as any).noProblemToday) {
          setNoProblemData(dailyData as unknown as NoProblemResponse);
          setPageState("ready");
          return;
        }
        setDaily(dailyData);
        setCode((dailyData.problem.starterCode as any)["JAVASCRIPT"] ?? "");
        setStars(dailyData.userStats.stars);
        setHintsUnlocked(dailyData.hintsUnlocked);
        setHintContents(dailyData.unlockedHintContents ?? {});
        setChallengeMode(settingsData.challengeMode);
        setPreferredDifficulty(settingsData.preferredDifficulty ?? "ANY");
        setPageState(dailyData.alreadySolved ? "solved" : "ready");
        setSkipCount((dailyData as any).skipCount ?? 0);
        setDiffNoteVisible(true);
        setHintDiscount(dailyData.hintDiscount ?? 0);
        if (dailyData.alreadySolved) setModeLocked(true);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setPageState("error");
      });
    return () => controller.abort();
  }, []);

  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     if (hasStartedTyping.current && pageState === "ready") {
  //       e.preventDefault();
  //       e.returnValue = "";
  //     }
  //   };
  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  // }, [pageState]);
  useReloadWarning(hasStartedTyping.current);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      const starter = daily
        ? ((daily.problem.starterCode as any)["JAVASCRIPT"] ?? "")
        : "";
      if (!hasStartedTyping.current && value !== starter) {
        hasStartedTyping.current = true;
        setModeLocked(true);
        if (challengeMode === "HARD") timer.start();
      }
    },
    [daily, challengeMode, timer],
  );

  // Run (trial) — no submission
  const handleRun = useCallback(async () => {
    if (!daily || pageState === "running") return;
    setPageState("running");
    setSolveResult(null);
    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: daily.problem.id,
          code,
          language: "JAVASCRIPT",
          challengeMode,
          timeExpired: timer.isExpired,
          submit: false,
        }),
      });
      const result: SolveResponse = await res.json();
      setSolveResult(result);
      setPageState("ready");
      setMobileTab("code");
    } catch {
      setPageState("ready");
    }
  }, [daily, code, pageState, challengeMode, timer]);

  // Submit — counts attempts and awards stars
  const handleSubmit = useCallback(async () => {
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
          language: "JAVASCRIPT",
          challengeMode,
          timeExpired: timer.isExpired,
          submit: true,
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
        setShowSuccessModal(true);
      } else {
        setPageState("ready");
        setMobileTab("code");
      }
    } catch {
      setPageState("ready");
    }
  }, [daily, code, pageState, challengeMode, timer]);

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

  const handleSkip = useCallback(async () => {
    if (!daily || skipCount === 0 || modeLocked) return;
    const res = await fetch("/api/shop/use-skip", { method: "POST" });
    if (res.ok) {
      setSkipCount((c) => c - 1);
      window.location.reload();
    }
  }, [daily, skipCount, modeLocked]);

  if (pageState === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 font-mono text-sm">
          <i className="ri-loader-4-line animate-spin text-lime-400" />
          {t("today.loading")}
        </div>
      </div>
    );
  }

  if (noProblemData) {
    return (
      <NoProblemScreen
        bonusStars={noProblemData.bonusStars}
        bonusAlreadyGiven={noProblemData.bonusAlreadyGiven}
        userStats={noProblemData.userStats}
      />
    );
  }

  if (pageState === "error" || !daily) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <i className="ri-error-warning-line text-4xl text-red-400" />
          <p className="font-mono text-sm text-zinc-400">
            {t("common.noScheduled")}
          </p>
        </div>
      </div>
    );
  }

  function handleResetCode() {
    setShowResetConfirm(true);
  }

  function confirmResetCode() {
    const starter = (daily?.problem?.starterCode as any)?.["JAVASCRIPT"] ?? "";
    setCode(starter);
    setSolveResult(null);
    setModeLocked(false);
    hasStartedTyping.current = false;
    setShowResetConfirm(false);
  }

  const { problem, userStats } = daily;
  const isHard = challengeMode === "HARD";
  const isSolved = pageState === "solved";

  // ── Solved / makeup section ───────────────────────────────────────────
  if (isSolved) {
    const unsolvedMakeups = daily.makeupDays.filter((d) => !d.alreadySolved);
    return (
      <div className="flex-1 flex flex-col">
        {showSuccessModal && solveResult && (
          <SuccessModal
            streak={
              solveResult.streak?.currentStreak ?? userStats.currentStreak
            }
            isNewRecord={solveResult.streak?.isNewRecord ?? false}
            starDelta={starDelta}
            isHard={isHard}
            timeExpired={timer.isExpired}
            cleanSolve={!hintsUnlocked.length}
            onConfirm={() => setShowSuccessModal(false)}
          />
        )}
        <div className="bg-lime-400/10 border-b border-lime-500/20 px-4 md:px-6 py-4 flex items-center gap-3 flex-wrap">
          <i className="ri-checkbox-circle-fill text-lime-400 text-xl" />
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-lime-400">
              {t("today.solved")}
            </p>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {t("today.streakDays", { count: userStats.currentStreak })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StarCount stars={stars} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
          {unsolvedMakeups.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <i className="ri-check-double-line text-4xl text-lime-400" />
              <p className="font-heading font-bold text-lg">
                {t("makeup.allCaughtUp")}
              </p>
              <p className="font-mono text-sm text-zinc-400">
                {t("makeup.noPastProblems")}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-heading text-xl font-bold tracking-tight">
                  {t("makeup.title")}
                </h2>
                <p className="text-sm font-mono text-zinc-400 mt-1">
                  {t("makeup.desc")}
                </p>
              </div>
              <div
                className={cn(
                  "flex items-start gap-3 p-4 rounded-md border text-xs font-mono",
                  daily.makeupRewardGivenToday
                    ? "bg-[hsl(var(--surface))] border-zinc-700 text-zinc-500"
                    : "bg-yellow-500/5 border-yellow-500/20 text-yellow-400",
                )}
              >
                <i
                  className={cn(
                    "text-base mt-0.5",
                    daily.makeupRewardGivenToday
                      ? "ri-information-line text-zinc-600"
                      : "ri-star-line",
                  )}
                />
                <div>
                  {daily.makeupRewardGivenToday
                    ? t("makeup.rewardGiven")
                    : t("makeup.firstReward")}
                </div>
              </div>
              <div className="space-y-2">
                {unsolvedMakeups.map((day) => (
                  <MakeupCard
                    key={day.date}
                    day={day}
                    userStars={stars}
                    onStart={() => router.push(`/makeup/${day.date}`)}
                  />
                ))}
              </div>
            </>
          )}
          {daily.makeupDays.filter((d) => d.alreadySolved).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                {t("makeup.completed")}
              </p>
              {daily.makeupDays
                .filter((d) => d.alreadySolved)
                .map((day) => (
                  <MakeupCard
                    key={day.date}
                    day={day}
                    userStars={stars}
                    completed
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isHard && !hardGatePassed && !isSolved) {
    return (
      <HardModeGate
        problemTitle={problem.title}
        onStart={() => {
          setHardGatePassed(true);
          timer.start();
          setModeLocked(true);
        }}
      />
    );
  }

  return (
    <>
      {showSuccessModal && solveResult && (
        <SuccessModal
          streak={solveResult.streak?.currentStreak ?? userStats.currentStreak}
          isNewRecord={solveResult.streak?.isNewRecord ?? false}
          starDelta={starDelta}
          isHard={isHard}
          timeExpired={timer.isExpired}
          cleanSolve={!hintsUnlocked.length}
          onConfirm={() => setShowSuccessModal(false)}
        />
      )}
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
      {showSkipConfirm && (
        <ConfirmDialog
          title="Use Problem Skip"
          message="Swap today's problem for a random one from the full problem bank? This uses 1 skip."
          confirmLabel="Use Skip"
          variant="warning"
          onConfirm={() => {
            setShowSkipConfirm(false);
            handleSkip();
          }}
          onCancel={() => setShowSkipConfirm(false)}
        />
      )}

      <div className="h-[calc(100dvh-3.5rem)] overflow-hidden grid grid-rows-[auto_auto_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)]">
        {/* Header */}
        <div className="border-b border-border shrink-0">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h1 className="font-heading font-bold text-sm md:text-base truncate">
                {problem.title}
              </h1>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Challenge mode badge */}
              <div
                className={cn(
                  "h-8 flex items-center gap-1 px-2.5 rounded border text-xs font-mono",
                  isHard
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                    : "bg-[hsl(var(--surface))] border-border text-zinc-400",
                )}
              >
                <i className={isHard ? "ri-sword-line" : "ri-shield-line"} />
                <span className="hidden sm:inline">
                  {isHard ? "Hard" : "Normal"}
                </span>
                {modeLocked && (
                  <i className="ri-lock-line text-zinc-600 ml-0.5" />
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

              {/* Skip button */}
              <button
                type="button"
                onClick={() => setShowSkipConfirm(true)}
                disabled={skipCount <= 0 || modeLocked}
                className={cn(
                  "h-8 items-center gap-1.5 px-2.5 rounded border border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/60 text-xs font-mono cursor-pointer transition-colors",
                  skipCount > 0 && !modeLocked ? "flex" : "hidden",
                )}
              >
                <i className="ri-skip-forward-line" />
                <span>
                  {t("shop.items.problemSkip.title")} ({skipCount})
                </span>
              </button>
              <StarCount stars={stars} />
            </div>
          </div>

          {daily.difficultyNote && diffNoteVisible && (
            <div className="px-4 md:px-6 py-2 bg-yellow-500/5 border-t border-yellow-500/20 flex items-center gap-2 text-xs font-mono text-yellow-600 dark:text-yellow-400">
              <i className="ri-information-line shrink-0" />
              <span className="flex-1">{daily.difficultyNote}</span>
              <button
                onClick={() => setDiffNoteVisible(false)}
                className="text-yellow-600/50 hover:text-yellow-600 transition-colors shrink-0"
              >
                <i className="ri-close-line" />
              </button>
            </div>
          )}

          <DifficultyReloadBanner preferredDifficulty={preferredDifficulty} />
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
          />

          {/* Code panel */}
          <section
            className={cn(
              "min-h-0 overflow-hidden grid grid-rows-[auto_minmax(0,1fr)_auto]",
              mobileTab === "code" ? "grid" : "hidden md:grid",
            )}
          >
            <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[hsl(var(--surface))] border-b border-border shrink-0">
              {isHard ? (
                <>
                  <i className="ri-forbid-2-line text-red-400 text-sm" />
                  <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                    {t("today.hardMode")}
                  </span>
                </>
              ) : (
                <>
                  <i className="ri-information-line text-zinc-600 text-sm" />
                  <span className="text-xs font-mono text-zinc-600 hidden sm:inline">
                    {t("today.normalMode")}
                  </span>
                </>
              )}
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
                pasteBlocked={isHard}
                className="h-full min-h-0 rounded-none border-0"
              />
            </div>

            <div className="border-t border-border shrink-0">
              {solveResult?.results && (
                <div className="p-3 md:px-4 md:pt-3">
                  <TestResults
                    solveResult={solveResult}
                    starDelta={starDelta}
                  />
                </div>
              )}
              {isSolved && !solveResult && (
                <div className="p-3 flex items-center gap-2 text-sm font-mono text-lime-400">
                  <i className="ri-checkbox-circle-line" />{" "}
                  {t("today.alreadySolved")}
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
    </>
  );
}
