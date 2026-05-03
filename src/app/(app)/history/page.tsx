"use client";

import { useEffect, useState } from "react";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@prisma/client";

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
    id: string;
    title: string;
    slug: string;
    difficulty: Difficulty;
    topic: string;
  };
};

type Filter = "ALL" | "CLEAN" | "HARD" | "HINTS";

export default function HistoryPage() {
  const [solves, setSolves] = useState<SolveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        setSolves(data.solves ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // ignore cancellation
      });

    return () => controller.abort();
  }, []);

  const filtered = solves.filter((s) => {
    if (filter === "CLEAN") return s.cleanSolve;
    if (filter === "HARD") return s.challengeMode === "HARD";
    if (filter === "HINTS") return s.usedHints;
    return true;
  });

  const stats = {
    total: solves.length,
    clean: solves.filter((s) => s.cleanSolve).length,
    hard: solves.filter((s) => s.challengeMode === "HARD").length,
    withHints: solves.filter((s) => s.usedHints).length,
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
          History
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          Your past solves.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: "ri-code-s-slash-line",
            color: "text-zinc-300",
          },
          {
            label: "Clean",
            value: stats.clean,
            icon: "ri-shield-star-line",
            color: "text-lime-400",
          },
          {
            label: "Hard mode",
            value: stats.hard,
            icon: "ri-sword-line",
            color: "text-orange-400",
          },
          {
            label: "Used hints",
            value: stats.withHints,
            icon: "ri-lightbulb-line",
            color: "text-yellow-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-zinc-900 border border-border rounded-md p-3 md:p-4 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <i className={cn(s.icon, s.color, "text-sm")} />
              <span className="text-xs font-mono text-zinc-500">{s.label}</span>
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

      {/* Filters — scrollable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {(["ALL", "CLEAN", "HARD", "HINTS"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors shrink-0",
              filter === f
                ? "bg-lime-400 text-zinc-950 font-bold"
                : "bg-zinc-900 border border-border text-zinc-400 hover:text-foreground",
            )}
          >
            {f === "ALL" && (
              <>
                <i className="ri-list-check mr-1.5" />
                All
              </>
            )}
            {f === "CLEAN" && (
              <>
                <i className="ri-shield-star-line mr-1.5" />
                Clean
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
                Hints
              </>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono text-zinc-600 shrink-0">
          {filtered.length} solve{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
          <i className="ri-inbox-line text-4xl text-zinc-700" />
          <p className="font-mono text-sm text-zinc-500">No solves found.</p>
          {filter !== "ALL" && (
            <button
              onClick={() => setFilter("ALL")}
              className="text-xs font-mono text-lime-400 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((solve) => {
            const isExpanded = expanded === solve.id;
            return (
              <div
                key={solve.id}
                className="border border-border rounded-md overflow-hidden bg-zinc-900"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : solve.id)}
                  className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
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
                    <DifficultyBadge difficulty={solve.problem.difficulty} />
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
                    {formatDate(solve.solvedAt)}
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
                    {/* Mobile badges */}
                    <div className="flex sm:hidden items-center gap-2 px-3 py-2 bg-zinc-950 flex-wrap">
                      <DifficultyBadge difficulty={solve.problem.difficulty} />
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
                        {solve.problem.topic.replace(/_/g, " ")} · JavaScript
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
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
