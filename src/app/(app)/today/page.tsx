"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { StreakBadge } from "@/components/streak/StreakBadge";
import { StarCount } from "@/components/ui/StarCount";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { TimerDisplay } from "@/components/ui/TimerDisplay";
import { LanguageSelector } from "@/components/editor/LanguageSelector";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { useTimer } from "@/hooks/useTimer";
import { HINT_TIERS } from "@/lib/hints";
import { getTimeLimit } from "@/lib/challenge";
import { getMonacoLanguage } from "@/lib/languages";
import type { Language } from "@/lib/languages";
import type {
  DailyResponse,
  SolveResponse,
  HintResponse,
  ProblemExample,
  NoProblemResponse,
} from "@/types";
import type { ChallengeMode } from "@/lib/challenge";
import type { MakeupDay } from "@/lib/makeup";
import { cn } from "@/lib/utils";
import { NoProblemScreen } from "@/components/ui/NoProblemScreen";

type PageState = "loading" | "ready" | "running" | "solved" | "error";
type MobileTab = "problem" | "code";

export default function TodayPage() {
  const router = useRouter();
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("JAVASCRIPT");
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

  const hasStartedTyping = useRef(false);

  const timer = useTimer({
    initialSeconds: daily ? getTimeLimit(daily?.problem?.difficulty) : 15 * 60,
    onExpire: () => {},
  });

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch("/api/daily").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(
        ([dailyData, settingsData]: [
          DailyResponse,
          { challengeMode: ChallengeMode },
        ]) => {
          if ((dailyData as any).noProblemToday) {
            setNoProblemData(dailyData as unknown as NoProblemResponse);
            setPageState("ready"); // stop loading spinner
            return;
          }

          setDaily(dailyData);
          setCode((dailyData.problem.starterCode as any)["JAVASCRIPT"] ?? "");
          setStars(dailyData.userStats.stars);
          setHintsUnlocked(dailyData.hintsUnlocked);
          setHintContents(dailyData.unlockedHintContents ?? {});
          setChallengeMode(settingsData.challengeMode);
          setPageState(dailyData.alreadySolved ? "solved" : "ready");
          if (dailyData.alreadySolved) setModeLocked(true);
          setDiffNoteVisible(true);
        },
      )
      .catch((err) => {
        if (err.name === "AbortError") return; // ignore cancellation
        setPageState("error");
      });

    return () => controller.abort();
  }, []);

  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      if (!hasStartedTyping.current && daily) {
        setCode((daily.problem.starterCode as any)[lang] ?? "");
      }
    },
    [daily],
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
      const starter = daily
        ? ((daily.problem.starterCode as any)[language] ?? "")
        : "";

      if (!hasStartedTyping.current && value !== starter) {
        hasStartedTyping.current = true;
        setModeLocked(true);
        if (challengeMode === "HARD") timer.start();
      }
    },
    [daily, language, challengeMode, timer, modeLocked],
  );

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
          language,
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
        setShowSuccessModal(true);
      } else {
        setPageState("ready");
        // Switch to problem tab on mobile to show results
        setMobileTab("code");
      }
    } catch {
      setPageState("ready");
    }
  }, [daily, code, language, pageState, challengeMode, timer]);

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
            {/* TODO: On days when no scheduled problems occur, write an apology on the screen today and give the user 15 stars for that day. */}
          </p>
        </div>
      </div>
    );
  }

  function handleResetCode() {
    // TODO: show confirmation before reseting
    const starter = (daily?.problem?.starterCode as any)[language] ?? "";
    setCode(starter);
    setSolveResult(null);
    setModeLocked(false);
    hasStartedTyping.current = false;
  }

  const { problem, userStats } = daily;
  const isHard = challengeMode === "HARD";
  const isSolved = pageState === "solved";

  // ── Makeup section after solve ────────────────────────────────────────
  if (isSolved) {
    const unsolvedMakeups = daily.makeupDays.filter((d) => !d.alreadySolved);
    return (
      <div className="flex-1 flex flex-col">
        {/* Solved banner */}
        <div className="bg-lime-400/10 border-b border-lime-500/20 px-4 md:px-6 py-4 flex items-center gap-3 flex-wrap">
          <i className="ri-checkbox-circle-fill text-lime-400 text-xl" />
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm text-lime-400">
              Today's problem solved!
            </p>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              {userStats.currentStreak} day streak
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StreakBadge streak={userStats.currentStreak} />
            <StarCount stars={stars} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
          {unsolvedMakeups.length === 0 ? (
            // No makeup tasks
            <div className="text-center py-16 space-y-3">
              <i className="ri-check-double-line text-4xl text-lime-400" />
              <p className="font-heading font-bold text-lg">All caught up!</p>
              <p className="font-mono text-sm text-zinc-400">
                No missed problems. Come back tomorrow.
              </p>
            </div>
          ) : (
            // Makeup tasks available
            <>
              <div>
                <h2 className="font-heading text-xl font-bold tracking-tight">
                  Make-Up Tasks
                </h2>
                <p className="text-sm font-mono text-zinc-400 mt-1">
                  Catch up on missed problems.
                </p>
              </div>

              <div
                className={cn(
                  "flex items-start gap-3 p-4 rounded-md border text-xs font-mono",
                  daily.makeupRewardGivenToday
                    ? "bg-zinc-900 border-zinc-700 text-zinc-500"
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
                    ? "You've already received your makeup star reward today. Additional make-ups cost stars with no reward."
                    : "First make-up solve today earns stars (minus the attempt cost). After that, additional make-ups only cost stars."}
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

          {/* Already completed makeups */}
          {daily.makeupDays.filter((d) => d.alreadySolved).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                Completed
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

  // ── Problem header ────────────────────────────────────────────────────
  const Header = (
    <div className="shrink-0">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="font-heading font-bold text-sm md:text-base truncate">
            {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="hidden sm:block text-xs text-zinc-500 font-mono uppercase tracking-wider">
            {(problem.topics ?? [])
              .map((t: string) => t.replace(/_/g, " "))
              .join(", ")}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono",
              isHard
                ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-400",
            )}
          >
            <i className={isHard ? "ri-sword-line" : "ri-shield-line"} />
            <span className="hidden sm:inline">
              {isHard ? "Hard" : "Normal"}
            </span>
            {modeLocked && <i className="ri-lock-line text-zinc-600 ml-0.5" />}
          </div>
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

      {/* Difficulty note — shown when fallback used */}
      {daily.difficultyNote && diffNoteVisible && (
        <div className="px-4 md:px-6 py-2 bg-yellow-500/5 border-b border-yellow-500/20 flex items-center gap-2 text-xs font-mono text-yellow-400">
          <i className="ri-information-line shrink-0" />
          <span className="flex-1">{daily.difficultyNote}</span>
          <button
            onClick={() => setDiffNoteVisible(false)}
            className="text-yellow-600 hover:text-yellow-400 transition-colors shrink-0"
          >
            <i className="ri-close-line" />
          </button>
        </div>
      )}
    </div>
  );

  // ── Mobile tab switcher ───────────────────────────────────────────────
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
  const examples = (problem.examples ?? []) as ProblemExample[];

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
      {/* Code toolbar */}
      <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-zinc-900 border-b border-border shrink-0">
        {isHard ? (
          <>
            <i className="ri-forbid-2-line text-red-400 text-sm" />
            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
              Hard mode — paste disabled
            </span>
          </>
        ) : (
          <>
            <i className="ri-information-line text-zinc-600 text-sm" />
            <span className="text-xs font-mono text-zinc-600 hidden sm:inline">
              Normal mode — fewer stars
            </span>
          </>
        )}
        <div className="ml-auto">
          <LanguageSelector
            value={language}
            onChange={handleLanguageChange}
            disabled={modeLocked}
          />
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-0 overflow-hidden">
        <CodeEditor
          value={code}
          onChange={handleCodeChange}
          language={getMonacoLanguage(language)}
          disabled={isSolved}
          pasteBlocked={isHard}
          className="h-full min-h-0 rounded-none border-0"
        />
      </div>

      <div className="border-t border-border shrink-0 space-y-3">
        {solveResult && solveResult.results && (
          <div className="space-y-2 max-h-32 md:max-h-44 overflow-y-auto custom-scrollbar">
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
            {solveResult.passed && (
              <div className="flex items-center gap-3 flex-wrap pt-1">
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

        {isSolved && !solveResult && (
          <div className="flex items-center gap-2 text-sm font-mono text-lime-400">
            <i className="ri-checkbox-circle-line" /> Already solved today!
          </div>
        )}

        <div className="shrink-0 border-t border-border p-3 md:p-4 space-y-3 bg-background">
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
    <>
      {" "}
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
      {noProblemData ? (
        <NoProblemScreen
          bonusStars={noProblemData.bonusStars}
          bonusAlreadyGiven={noProblemData.bonusAlreadyGiven}
          userStats={noProblemData.userStats}
        />
      ) : (
        <div className="h-[calc(100dvh-3.5rem)] overflow-hidden grid grid-rows-[auto_auto_minmax(0,1fr)] md:grid-rows-[auto_minmax(0,1fr)]">
          <div className="shrink-0">{Header}</div>

          <div className="md:hidden shrink-0">{MobileTabs}</div>

          <div className="min-h-0 overflow-hidden grid grid-cols-1 md:grid-cols-[50%_minmax(0,1fr)]">
            {ProblemPanel}
            {CodePanel}
          </div>
        </div>
      )}
    </>
  );
}

function MakeupCard({
  day,
  userStars,
  completed = false,
  onStart,
}: {
  day: MakeupDay;
  userStars: number;
  completed?: boolean;
  onStart?: () => void;
}) {
  const canAfford = userStars >= day.starCost;
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 md:p-4 rounded-md border transition-colors",
        completed
          ? "border-border bg-zinc-900/30 opacity-60"
          : "border-border bg-zinc-900 hover:border-zinc-600",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-mono text-sm font-medium truncate">
            {day.problemTitle}
          </span>
          <DifficultyBadge difficulty={day.difficulty as any} />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 flex-wrap">
          <span>
            {day.daysAgo === 1 ? "Yesterday" : `${day.daysAgo} days ago`}
          </span>
          <span className="hidden sm:inline">
            · {(day.topics ?? []).map((t) => t.replace(/_/g, " ")).join(", ")}
          </span>
        </div>
      </div>
      {completed ? (
        <span className="flex items-center gap-1.5 text-xs font-mono text-lime-400 shrink-0">
          <i className="ri-check-line" /> Done
        </span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-mono",
              canAfford ? "text-yellow-400" : "text-red-400",
            )}
          >
            <i className="ri-star-fill" /> {day.starCost}
          </span>
          <button
            onClick={onStart}
            disabled={!canAfford}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-mono font-bold transition-all",
              canAfford
                ? "bg-lime-400 text-zinc-950 hover:bg-lime-300"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700",
            )}
          >
            {canAfford ? "Start" : "Need ⭐"}
          </button>
        </div>
      )}
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
