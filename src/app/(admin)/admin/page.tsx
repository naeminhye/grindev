"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TopicTagInput } from "@/components/admin/TopicTagInput";

type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topics: string[];
  createdAt: string;
  _count: { solves: number; dailySlots: number };
};

type Stats = {
  problems: number;
  scheduled: number;
  solves: number;
  users: number;
};

const DIFF_CONFIG = {
  EASY: "bg-green-500/10 text-green-400 border-green-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HARD: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminDashboard() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState<string[]>([]);
  const [scheduledFilter, setScheduledFilter] = useState("all");

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (diffFilter) params.set("difficulty", diffFilter);
    topicFilter.forEach((t) => params.append("topic", t));
    if (scheduledFilter !== "all") params.set("scheduled", scheduledFilter);

    const [problemsRes, statsRes] = await Promise.all([
      fetch(`/api/admin/problems?${params}`).then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
    ]);
    setProblems(problemsRes.problems ?? []);
    setStats(statsRes);
    setLoading(false);
  }, [search, diffFilter, topicFilter, scheduledFilter]);

  useEffect(() => {
    const t = setTimeout(fetchProblems, 200);
    return () => clearTimeout(t);
  }, [fetchProblems]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Manage problems and schedule.
          </p>
        </div>
        <Link
          href="/admin/problems/new"
          className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 transition-colors"
        >
          <i className="ri-add-line" /> New Problem
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              label: "Problems",
              value: stats.problems,
              icon: "ri-code-s-slash-line",
              color: "text-lime-400",
            },
            {
              label: "Scheduled",
              value: stats.scheduled,
              icon: "ri-calendar-check-line",
              color: "text-blue-400",
            },
            {
              label: "Total solves",
              value: stats.solves,
              icon: "ri-check-double-line",
              color: "text-green-400",
            },
            {
              label: "Users",
              value: stats.users,
              icon: "ri-user-line",
              color: "text-yellow-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-zinc-900 border border-border rounded-md p-4 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <i className={`${s.icon} ${s.color} text-sm`} />
                <span className="text-xs font-mono text-zinc-500">
                  {s.label}
                </span>
              </div>
              <div className={`font-heading font-bold text-2xl ${s.color}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3 p-4 bg-zinc-900 border border-border rounded-md">
        <div className="flex items-center gap-2">
          <i className="ri-filter-3-line text-zinc-500 text-sm" />
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
            Filters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50 transition-colors"
            />
          </div>

          {/* Difficulty */}
          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
          >
            <option value="">All difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          {/* Scheduled */}
          <select
            value={scheduledFilter}
            onChange={(e) => setScheduledFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
          >
            <option value="all">All (scheduled + not)</option>
            <option value="scheduled">Scheduled only</option>
            <option value="unscheduled">Not scheduled</option>
          </select>

          {/* Clear */}
          {(search ||
            diffFilter ||
            topicFilter.length > 0 ||
            scheduledFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setDiffFilter("");
                setTopicFilter([]);
                setScheduledFilter("all");
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-border rounded-md hover:border-zinc-600 transition-colors"
            >
              <i className="ri-close-line" /> Clear filters
            </button>
          )}
        </div>

        {/* Topic filter — full width */}
        <div>
          <p className="text-xs font-mono text-zinc-500 mb-1.5">
            Filter by topics
          </p>
          <TopicTagInput value={topicFilter} onChange={setTopicFilter} />
        </div>
      </div>

      {/* Problems list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500">
            {loading
              ? "Loading..."
              : `${problems.length} problem${problems.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {!loading && problems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
            <i className="ri-inbox-line text-4xl text-zinc-700" />
            <p className="font-mono text-sm text-zinc-500">
              No problems match your filters.
            </p>
          </div>
        )}

        {problems.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 md:p-4 bg-zinc-900 border border-border rounded-md hover:border-zinc-600 transition-colors group"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-medium truncate">
                  {p.title}
                </span>
                <span
                  className={cn(
                    "text-xs font-mono px-1.5 py-0.5 rounded border",
                    DIFF_CONFIG[p.difficulty],
                  )}
                >
                  {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                </span>
                {p._count.dailySlots > 0 && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <i className="ri-calendar-check-line mr-1" />
                    scheduled ×{p._count.dailySlots}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {p.topics.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] font-mono text-zinc-600">
                    #{t.replace(/_/g, " ").toLowerCase()}
                  </span>
                ))}
                {p.topics.length > 3 && (
                  <span className="text-[10px] font-mono text-zinc-700">
                    +{p.topics.length - 3} more
                  </span>
                )}
                <span className="text-[10px] font-mono text-zinc-700 ml-auto">
                  {p._count.solves} solve{p._count.solves !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Link
                href={`/admin/problems/${p.id}/edit`}
                className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                title="Edit"
              >
                <i className="ri-edit-line text-sm" />
              </Link>
              <Link
                href={`/admin/schedule?highlight=${p.id}`}
                className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                title="Schedule"
              >
                <i className="ri-calendar-line text-sm" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
