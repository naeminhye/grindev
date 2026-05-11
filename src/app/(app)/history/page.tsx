"use client";

import { useEffect, useState } from "react";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@prisma/client";
import { useI18n } from "@/lib/i18n";

type SolveRecord = {
  id: string;
  passed: boolean;
  cleanSolve: boolean;
  usedHints: boolean;
  challengeMode: "NORMAL" | "HARD";
  timeExpired: boolean;
  attempts: number;
  solvedAt: string;
  code: string;
  problem: {
    description: string;
    id: string;
    title: string;
    slug: string;
    difficulty: Difficulty;
    topics: string[];
  };
};

type QuizAttemptRecord = {
  id: string;
  passed: boolean;
  score: number;
  total: number;
  stars: number;
  isMakeup: boolean;
  solvedAt: string;
  answers: { questionIndex: number; selectedIndex: number }[];
  quiz: {
    id: string;
    title: string;
    difficulty: Difficulty;
    topic: string;
    questions: {
      question: string
      code?: string
      options: string[]
      correctIndex: number
      explanation?: string
    }[]
  };
};

const TOPIC_LABELS: Record<string, string> = {
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  PYTHON: "Python",
  CSS: "CSS",
  HTML: "HTML",
  REACT: "React",
  NODE: "Node.js",
  DATABASES: "Databases",
  SYSTEM_DESIGN: "System Design",
  GENERAL_CS: "General CS",
};

type DSAFilter = "ALL" | "CLEAN" | "HARD" | "HINTS";
type Tab = "DSA" | "QUIZ";

export default function HistoryPage() {
  const { t, locale } = useI18n();

  const [solves, setSolves] = useState<SolveRecord[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("DSA");
  const [filter, setFilter] = useState<DSAFilter>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        setSolves(data.solves ?? []);
        setQuizAttempts(data.quizAttempts ?? []);
        setLoading(false);
      });
  }, []);

  const filteredSolves = solves.filter((s) => {
    if (filter === "CLEAN") return s.cleanSolve;
    if (filter === "HARD") return s.challengeMode === "HARD";
    if (filter === "HINTS") return s.usedHints;
    return true;
  });

  const dsaStats = {
    total: solves.length,
    clean: solves.filter((s) => s.cleanSolve).length,
    hard: solves.filter((s) => s.challengeMode === "HARD").length,
    withHints: solves.filter((s) => s.usedHints).length,
  };

  const quizStats = {
    total: quizAttempts.length,
    passed: quizAttempts.filter((a) => a.passed).length,
    perfect: quizAttempts.filter((a) => a.score === a.total).length,
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6 md:space-y-8 w-full">
      <div>
        <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
          {t("history.title")}
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          {t("history.desc")}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(["DSA", "QUIZ"] as Tab[]).map((tabId) => (
          <button
            key={tabId}
            onClick={() => {
              setTab(tabId);
              setExpanded(null);
            }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px",
              tab === tabId
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300",
            )}
          >
            <i
              className={
                tabId === "DSA"
                  ? "ri-code-s-slash-line"
                  : "ri-questionnaire-line"
              }
            />
            {tabId === "DSA" ? "DSA Problems" : "Quizzes"}
            <span className="ml-1 text-zinc-600">
              ({tabId === "DSA" ? solves.length : quizAttempts.length})
            </span>
          </button>
        ))}
      </div>

      {/* ── DSA Tab ─────────────────────────────────────────────────────── */}
      {tab === "DSA" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              {
                label: t("history.total"),
                value: dsaStats.total,
                icon: "ri-code-s-slash-line",
                color: "text-zinc-300",
              },
              {
                label: t("history.clean"),
                value: dsaStats.clean,
                icon: "ri-shield-star-line",
                color: "text-lime-400",
              },
              {
                label: t("history.hardMode"),
                value: dsaStats.hard,
                icon: "ri-sword-line",
                color: "text-orange-400",
              },
              {
                label: t("history.usedHints"),
                value: dsaStats.withHints,
                icon: "ri-lightbulb-line",
                color: "text-yellow-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-[hsl(var(--surface))] border border-border rounded-md p-3 md:p-4 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <i className={cn(s.icon, s.color, "text-sm")} />
                  <span className="text-xs font-mono text-zinc-500">
                    {s.label}
                  </span>
                </div>
                <div
                  className={cn(
                    "font-heading font-bold text-xl md:text-2xl",
                    s.color,
                  )}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            {(["ALL", "CLEAN", "HARD", "HINTS"] as DSAFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors shrink-0",
                  filter === f
                    ? "bg-lime-400 text-zinc-950 font-bold"
                    : "bg-[hsl(var(--surface))] border border-border text-zinc-400 hover:text-foreground",
                )}
              >
                {f === "ALL" && (
                  <>
                    <i className="ri-list-check mr-1.5" />
                    {t("history.all")}
                  </>
                )}
                {f === "CLEAN" && (
                  <>
                    <i className="ri-shield-star-line mr-1.5" />
                    {t("history.clean")}
                  </>
                )}
                {f === "HARD" && (
                  <>
                    <i className="ri-sword-line mr-1.5" />
                    Hard
                  </>
                )}
                {f === "HINTS" && (
                  <>
                    <i className="ri-lightbulb-line mr-1.5" />
                    {t("problem.hints")}
                  </>
                )}
              </button>
            ))}
            <span className="ml-auto text-xs font-mono text-zinc-600 shrink-0">
              {filteredSolves.length !== 1
                ? t("history.solves_plural", { count: filteredSolves.length })
                : t("history.solves", { count: filteredSolves.length })}
            </span>
          </div>

          {/* DSA list */}
          {filteredSolves.length === 0 ? (
            <EmptyState
              filter={filter}
              onClear={() => setFilter("ALL")}
              t={t}
            />
          ) : (
            <div className="space-y-2">
              {filteredSolves.map((solve) => {
                const isExpanded = expanded === solve.id;
                return (
                  <div
                    key={solve.id}
                    className="border border-border rounded-md overflow-hidden bg-[hsl(var(--surface))]"
                  >
                    <button
                      onClick={() => setExpanded(isExpanded ? null : solve.id)}
                      className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 hover:bg-[hsl(var(--surface-raised))]/50 transition-colors text-left"
                    >
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          solve.passed ? "bg-lime-400" : "bg-red-400",
                        )}
                      />
                      <span className="font-mono text-sm font-medium flex-1 truncate">
                        {solve.problem.title}
                      </span>
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <DifficultyBadge
                          difficulty={solve.problem.difficulty}
                        />
                        {solve.cleanSolve && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/20">
                            <i className="ri-shield-star-line mr-1" />
                            clean
                          </span>
                        )}
                        {solve.challengeMode === "HARD" && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <i className="ri-sword-line mr-1" />
                            hard
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-600 shrink-0">
                        {formatDate(solve.solvedAt, locale)}
                      </span>
                      <i
                        className={cn(
                          "ri-arrow-down-s-line text-zinc-600 transition-transform shrink-0",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border">
                        {/* Problem description */}
                        <div className="px-3 md:px-4 py-3 bg-zinc-950 border-b border-border">
                          <p className="text-xs font-mono text-zinc-400 leading-relaxed line-clamp-4">
                            {solve.problem.description}
                          </p>
                          <a
                            href={`/problems/${solve.problem.slug}`}
                            className="text-[10px] font-mono text-lime-400 hover:underline mt-1 inline-block"
                          >
                            View problem →
                          </a>
                        </div>
                        <div className="flex sm:hidden items-center gap-2 px-3 py-2 bg-zinc-950 flex-wrap">
                          <DifficultyBadge
                            difficulty={solve.problem.difficulty}
                          />
                          {solve.cleanSolve && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/20">
                              clean
                            </span>
                          )}
                          {solve.challengeMode === "HARD" && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                              hard
                            </span>
                          )}
                          <span className="text-xs font-mono text-zinc-600 ml-auto">
                            {solve.attempts} attempt
                            {solve.attempts !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-zinc-950">
                          <span className="text-xs font-mono text-zinc-500">
                            {(solve.problem.topics ?? [])
                              .map((t: string) => t.replace(/_/g, " "))
                              .join(", ")}{" "}
                            · JavaScript
                          </span>
                          <span className="hidden sm:block text-xs font-mono text-zinc-600">
                            {new Date(solve.solvedAt).toLocaleString()}
                          </span>
                        </div>
                        <pre className="p-3 md:p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed bg-zinc-950 max-h-64">
                          <code>{solve.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Quiz Tab ─────────────────────────────────────────────────────── */}
      {tab === "QUIZ" && (
        <>
          {/* Quiz stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: "Total attempts",
                value: quizStats.total,
                icon: "ri-questionnaire-line",
                color: "text-zinc-300",
              },
              {
                label: "Passed",
                value: quizStats.passed,
                icon: "ri-checkbox-circle-line",
                color: "text-lime-400",
              },
              {
                label: "Perfect score",
                value: quizStats.perfect,
                icon: "ri-star-fill",
                color: "text-yellow-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-[hsl(var(--surface))] border border-border rounded-md p-3 md:p-4 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <i className={cn(s.icon, s.color, "text-sm")} />
                  <span className="text-xs font-mono text-zinc-500">
                    {s.label}
                  </span>
                </div>
                <div
                  className={cn(
                    "font-heading font-bold text-xl md:text-2xl",
                    s.color,
                  )}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {quizAttempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
              <i className="ri-questionnaire-line text-4xl text-zinc-700" />
              <p className="font-mono text-sm text-zinc-500">
                No quiz attempts yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-600">
                {quizAttempts.length} attempt
                {quizAttempts.length !== 1 ? "s" : ""}
              </span>
              {quizAttempts.map((attempt) => {
                const pct = Math.round((attempt.score / attempt.total) * 100)
                const scoreColor =
                  pct === 100 ? 'text-lime-400' :
                    pct >= 80 ? 'text-green-400' :
                      pct >= 60 ? 'text-yellow-400' : 'text-red-400'
                const isExpanded = expandedQuiz === attempt.id
                const answersMap = Object.fromEntries(
                  (attempt.answers ?? []).map((a) => [a.questionIndex, a.selectedIndex])
                )

                return (
                  <div key={attempt.id} className="border border-border rounded-md overflow-hidden bg-[hsl(var(--surface))]">
                    {/* Header row */}
                    <button
                      onClick={() => setExpandedQuiz(isExpanded ? null : attempt.id)}
                      className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 hover:bg-[hsl(var(--surface-raised))]/50 transition-colors text-left"
                    >
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', attempt.passed ? 'bg-lime-400' : 'bg-red-400')} />
                      <span className="font-mono text-sm font-medium flex-1 truncate">{attempt.quiz.title}</span>
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <DifficultyBadge difficulty={attempt.quiz.difficulty} />
                        <span className="text-xs font-mono text-blue-400 border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 rounded">
                          {TOPIC_LABELS[attempt.quiz.topic] ?? attempt.quiz.topic}
                        </span>
                      </div>
                      <span className={cn('font-heading font-bold text-sm shrink-0', scoreColor)}>
                        {attempt.score}/{attempt.total}
                      </span>
                      <span className="text-xs font-mono text-zinc-600 shrink-0">{formatDate(attempt.solvedAt, locale)}</span>
                      <i className={cn('ri-arrow-down-s-line text-zinc-600 transition-transform shrink-0', isExpanded && 'rotate-180')} />
                    </button>

                    {/* Expanded questions */}
                    {isExpanded && (
                      <div className="border-t border-border divide-y divide-border">
                        {attempt.quiz.questions.map((q, qi) => {
                          const userAnswer = answersMap[qi] ?? -1
                          const isCorrect = userAnswer === q.correctIndex
                          return (
                            <div key={qi} className="px-3 md:px-4 py-3 space-y-2 bg-zinc-950">
                              {/* Question */}
                              <div className="flex items-start gap-2">
                                <span className={cn(
                                  'text-xs font-mono shrink-0 mt-0.5',
                                  isCorrect ? 'text-lime-400' : 'text-red-400'
                                )}>
                                  <i className={isCorrect ? 'ri-check-line' : 'ri-close-line'} /> Q{qi + 1}
                                </span>
                                <p className="text-xs font-mono text-zinc-300 leading-relaxed">{q.question}</p>
                              </div>

                              {/* Code block */}
                              {q.code && (
                                <pre className="ml-5 p-2 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-300 overflow-x-auto">
                                  {q.code}
                                </pre>
                              )}

                              {/* Options */}
                              <div className="ml-5 space-y-1">
                                {q.options.map((opt, oi) => {
                                  const isUserPick = oi === userAnswer
                                  const isCorrectOpt = oi === q.correctIndex
                                  return (
                                    <div
                                      key={oi}
                                      className={cn(
                                        'flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono',
                                        isCorrectOpt
                                          ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                                          : isUserPick && !isCorrectOpt
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : 'text-zinc-600',
                                      )}
                                    >
                                      <span className="shrink-0 w-4">{String.fromCharCode(65 + oi)}.</span>
                                      <span className="flex-1">{opt}</span>
                                      {isCorrectOpt && <i className="ri-check-line shrink-0" />}
                                      {isUserPick && !isCorrectOpt && <i className="ri-close-line shrink-0" />}
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Explanation */}
                              {!isCorrect && q.explanation && (
                                <p className="ml-5 text-[10px] font-mono text-zinc-500 leading-relaxed border-l-2 border-zinc-700 pl-2">
                                  {q.explanation}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  filter,
  onClear,
  t,
}: {
  filter: DSAFilter;
  onClear: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
      <i className="ri-inbox-line text-4xl text-zinc-700" />
      <p className="font-mono text-sm text-zinc-500">{t("history.noSolves")}</p>
      {filter !== "ALL" && (
        <button
          onClick={onClear}
          className="text-xs font-mono text-lime-400 hover:underline"
        >
          {t("history.clearFilter")}
        </button>
      )}
    </div>
  );
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  const now = new Date();

  // Compare calendar dates in local timezone, not elapsed hours
  const dateStr = date.toLocaleDateString("en-CA"); // YYYY-MM-DD
  const todayStr = now.toLocaleDateString("en-CA");
  const yesterdayStr = new Date(now.getTime() - 86400000).toLocaleDateString(
    "en-CA",
  );

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) return `${diffDays}d ago`;

  const localeMap: Record<string, string> = { en: "en-US", vi: "vi-VN" };
  return date.toLocaleDateString(localeMap[locale] ?? "en-US", {
    month: "short",
    day: "numeric",
  });
}
