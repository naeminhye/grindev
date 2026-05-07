"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Quiz = {
  id: string;
  title: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  createdAt: string;
  _count: { attempts: number; dailySlots: number };
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

const DIFF_CONFIG = {
  EASY: "bg-green-500/10 text-green-400 border-green-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HARD: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (diffFilter) params.set("difficulty", diffFilter);
    if (topicFilter) params.set("topic", topicFilter);

    const t = setTimeout(() => {
      fetch(`/api/admin/quizzes?${params}`)
        .then((r) => r.json())
        .then((d) => {
          setQuizzes(d.quizzes ?? []);
          setLoading(false);
        });
    }, 200);
    return () => clearTimeout(t);
  }, [search, diffFilter, topicFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6 w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Quizzes
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Manage knowledge quizzes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/quiz-schedule"
            className="flex items-center gap-2 px-4 py-2 border border-border text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 font-mono text-sm rounded transition-colors"
          >
            <i className="ri-calendar-line" /> Schedule
          </Link>
          <Link
            href="/admin/quizzes/new"
            className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 transition-colors"
          >
            <i className="ri-add-line" /> New Quiz
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full pl-8 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
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
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
        >
          <option value="">All topics</option>
          {Object.entries(TOPIC_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <i className="ri-questionnaire-line text-4xl text-zinc-700" />
          <p className="font-mono text-sm text-zinc-500">No quizzes found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-mono text-zinc-500">
            {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}
          </p>
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="flex items-center gap-3 p-3 md:p-4 bg-zinc-900 border border-border rounded-md hover:border-zinc-600 transition-colors group"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-medium truncate">
                    {q.title}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-mono px-1.5 py-0.5 rounded border",
                      DIFF_CONFIG[q.difficulty],
                    )}
                  >
                    {q.difficulty.charAt(0) +
                      q.difficulty.slice(1).toLowerCase()}
                  </span>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    {TOPIC_LABELS[q.topic] ?? q.topic}
                  </span>
                  {q._count.dailySlots > 0 && (
                    <span className="text-xs font-mono text-zinc-600">
                      <i className="ri-calendar-check-line mr-1" />
                      scheduled ×{q._count.dailySlots}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-zinc-700">
                  {q._count.attempts} attempt
                  {q._count.attempts !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Link
                  href={`/admin/quizzes/${q.id}/edit`}
                  className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                  title="Edit"
                >
                  <i className="ri-edit-line text-sm" />
                </Link>
                <Link
                  href="/admin/quiz-schedule"
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
    </div>
  );
}
