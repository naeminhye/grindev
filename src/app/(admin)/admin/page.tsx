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
type ViewMode = "list" | "grid";
type SortKey = "title" | "createdAt" | "solves";
type SortDir = "asc" | "desc";

const DIFF_CONFIG = {
  EASY: {
    label: "Easy",
    cls: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  MEDIUM: {
    label: "Medium",
    cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  HARD: { label: "Hard", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function AdminDashboard() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
      fetch(`/api/admin/problems?${params}`)
        .then((r) => r.text())
        .then((t) => (t ? JSON.parse(t) : { problems: [] })),
      fetch("/api/admin/stats")
        .then((r) => r.text())
        .then((t) =>
          t
            ? JSON.parse(t)
            : { problems: 0, scheduled: 0, solves: 0, users: 0 },
        ),
    ]);

    setProblems(problemsRes.problems ?? []);
    setStats(statsRes);
    setLoading(false);
  }, [search, diffFilter, topicFilter, scheduledFilter]);

  useEffect(() => {
    const t = setTimeout(fetchProblems, 200);
    return () => clearTimeout(t);
  }, [fetchProblems]);

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      alert("Invalid JSON file");
      return;
    }
    const res = await fetch("/api/admin/problems/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    alert(
      `Created: ${result.created}, Skipped: ${result.skipped}${result.errors?.length ? `, Errors: ${result.errors.length}` : ""}`,
    );
    fetchProblems();
    e.target.value = "";
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  }

  const sorted = [...problems].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "title") cmp = a.title.localeCompare(b.title);
    else if (sortKey === "createdAt")
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    else if (sortKey === "solves") cmp = a._count.solves - b._count.solves;
    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortButton({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono border transition-colors",
          active
            ? "bg-lime-400/10 border-lime-500/30 text-lime-400"
            : "border-border text-zinc-500 hover:text-zinc-300 hover:border-zinc-600",
        )}
      >
        {label}
        {active && (
          <i
            className={cn(
              "text-xs",
              sortDir === "asc" ? "ri-arrow-up-line" : "ri-arrow-down-line",
            )}
          />
        )}
      </button>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Manage problems and schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 border border-border text-zinc-400 hover:text-zinc-200 font-mono text-sm rounded cursor-pointer hover:border-zinc-500 transition-colors">
            <i className="ri-upload-2-line" /> Bulk Upload
            <input
              type="file"
              accept=".json"
              onChange={handleBulkUpload}
              className="hidden"
            />
          </label>
          <Link
            href="/admin/problems/new"
            className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 transition-colors"
          >
            <i className="ri-add-line" /> New Problem
          </Link>
        </div>
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
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50 transition-colors"
            />
          </div>

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

          <select
            value={scheduledFilter}
            onChange={(e) => setScheduledFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
          >
            <option value="all">All (scheduled + not)</option>
            <option value="scheduled">Scheduled only</option>
            <option value="unscheduled">Not scheduled</option>
          </select>

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

        <div>
          <p className="text-xs font-mono text-zinc-500 mb-1.5">
            Filter by topics
          </p>
          <TopicTagInput value={topicFilter} onChange={setTopicFilter} />
        </div>
      </div>

      {/* Toolbar — count, sort, view toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs font-mono text-zinc-500">
          {loading
            ? "Loading..."
            : `${sorted.length} problem${sorted.length !== 1 ? "s" : ""}`}
        </span>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-zinc-600">Sort:</span>
            <SortButton label="Name" k="title" />
            <SortButton label="Date" k="createdAt" />
            <SortButton label="Solves" k="solves" />
          </div>

          {/* View toggle */}
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-2.5 py-1.5 transition-colors",
                viewMode === "list"
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
              title="List view"
            >
              <i className="ri-list-check text-sm" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-2.5 py-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
              title="Grid view"
            >
              <i className="ri-grid-line text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!loading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
          <i className="ri-inbox-line text-4xl text-zinc-700" />
          <p className="font-mono text-sm text-zinc-500">
            No problems match your filters.
          </p>
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {sorted.map((p) => (
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
                      DIFF_CONFIG[p.difficulty].cls,
                    )}
                  >
                    {DIFF_CONFIG[p.difficulty].label}
                  </span>
                  {p._count.dailySlots > 0 && (
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <i className="ri-calendar-check-line mr-1" />×
                      {p._count.dailySlots}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.topics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono text-zinc-600"
                      >
                        #{t.replace(/_/g, " ").toLowerCase()}
                      </span>
                    ))}
                    {p.topics.length > 3 && (
                      <span className="text-[10px] font-mono text-zinc-700">
                        +{p.topics.length - 3}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-700 ml-auto">
                    {p._count.solves} solve{p._count.solves !== 1 ? "s" : ""} ·{" "}
                    {formatDate(p.createdAt)}
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
      )}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sorted.map((p) => (
            <div
              key={p.id}
              className="bg-zinc-900 border border-border rounded-md p-4 space-y-3 hover:border-zinc-600 transition-colors group flex flex-col"
            >
              {/* Title + difficulty */}
              <div className="space-y-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-medium leading-snug line-clamp-2">
                    {p.title}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono px-1.5 py-0.5 rounded border shrink-0",
                      DIFF_CONFIG[p.difficulty].cls,
                    )}
                  >
                    {DIFF_CONFIG[p.difficulty].label}
                  </span>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-1">
                  {p.topics.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded"
                    >
                      {t.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ))}
                  {p.topics.length > 4 && (
                    <span className="text-[10px] font-mono text-zinc-700">
                      +{p.topics.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-600 flex items-center gap-1">
                    <i className="ri-check-double-line" />
                    {p._count.solves}
                  </span>
                  {p._count.dailySlots > 0 && (
                    <span className="text-[10px] font-mono text-blue-500 flex items-center gap-1">
                      <i className="ri-calendar-check-line" />×
                      {p._count.dailySlots}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-zinc-700">
                    {formatDate(p.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/admin/problems/${p.id}/edit`}
                    className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="Edit"
                  >
                    <i className="ri-edit-line text-xs" />
                  </Link>
                  <Link
                    href={`/admin/schedule?highlight=${p.id}`}
                    className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    title="Schedule"
                  >
                    <i className="ri-calendar-line text-xs" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}
