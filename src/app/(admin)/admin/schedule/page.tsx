"use client";

import { useEffect, useState } from "react";
import { format, addDays } from "date-fns";

type Problem = { id: string; title: string; difficulty: string };
type ScheduledDay = {
  date: string;
  problem: { id: string; title: string; difficulty: string };
};

export default function SchedulePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledDay[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/admin/problems").then((r) => r.json()),
      fetch("/api/admin/schedule").then((r) => r.json()),
    ])
      .then(([p, s]) => {
        setProblems(p.problems ?? []);
        const days = s.scheduled ?? [];
        setScheduled(days);

        // Auto-select closest unscheduled future date
        const scheduledDates = new Set(days.map((d: ScheduledDay) => d.date));
        let autoDate = format(new Date(), "yyyy-MM-dd");
        for (let i = 0; i < 90; i++) {
          const d = format(addDays(new Date(), i), "yyyy-MM-dd");
          if (!scheduledDates.has(d)) {
            autoDate = d;
            break;
          }
        }
        setSelectedDate(autoDate);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
      });

    return () => controller.abort();
  }, []);

  const scheduledDates = new Set(scheduled.map((s) => s.date));

  async function handleSchedule() {
    if (!selectedProblemId || !selectedDate) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problemId: selectedProblemId,
        date: selectedDate,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const problem = problems.find((p) => p.id === selectedProblemId)!;
      setScheduled((prev) =>
        [...prev, { date: selectedDate, problem }].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      );
      setMessage(`✓ Scheduled "${problem.title}" for ${selectedDate}`);

      // Auto-advance to next unscheduled date
      const newScheduled = new Set([...scheduledDates, selectedDate]);
      for (let i = 1; i < 90; i++) {
        const d = format(addDays(new Date(selectedDate), i), "yyyy-MM-dd");
        if (!newScheduled.has(d)) {
          setSelectedDate(d);
          break;
        }
      }
    } else {
      setMessage(`✗ ${data.error}`);
    }
    setSaving(false);
  }

  async function handleUnschedule(date: string) {
    if (!confirm(`Remove problem from ${date}?`)) return;
    const res = await fetch(`/api/admin/schedule/${date}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setScheduled((prev) => prev.filter((s) => s.date !== date));
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  const upcoming = scheduled.filter(
    (s) => s.date >= format(new Date(), "yyyy-MM-dd"),
  );
  const past = scheduled.filter(
    (s) => s.date < format(new Date(), "yyyy-MM-dd"),
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 w-full space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Schedule
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          Assign problems to dates.
        </p>
      </div>

      {/* Scheduler form */}
      <div className="bg-zinc-900 border border-border rounded-md p-6 space-y-4">
        <h2 className="font-mono text-sm font-bold text-zinc-300">
          Assign a problem
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Problem
            </label>
            <select
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
            >
              <option value="">Select a problem...</option>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} (
                  {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                  )
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
            />
            {scheduledDates.has(selectedDate) && (
              <p className="text-xs font-mono text-yellow-400 flex items-center gap-1">
                <i className="ri-error-warning-line" /> This date already has a
                problem
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          {message && (
            <p
              className={`text-xs font-mono ${message.startsWith("✓") ? "text-lime-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
          <button
            onClick={handleSchedule}
            disabled={
              saving || !selectedProblemId || scheduledDates.has(selectedDate)
            }
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <i className="ri-loader-4-line animate-spin" />
            ) : (
              <i className="ri-calendar-check-line" />
            )}
            Schedule
          </button>
        </div>
      </div>

      {/* Upcoming */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 && (
          <p className="text-sm font-mono text-zinc-600 py-3">
            Nothing scheduled yet.
          </p>
        )}
        {upcoming.map((s) => (
          <ScheduleRow key={s.date} s={s} onDelete={handleUnschedule} />
        ))}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Past ({past.length})
          </h2>
          {past.slice(0, 10).map((s) => (
            <ScheduleRow key={s.date} s={s} past />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleRow({
  s,
  onDelete,
  past,
}: {
  s: ScheduledDay;
  onDelete?: (date: string) => void;
  past?: boolean;
}) {
  const diffConfig: Record<string, string> = {
    EASY: "text-green-400",
    MEDIUM: "text-yellow-400",
    HARD: "text-red-400",
  };
  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-md border ${past ? "border-border bg-zinc-900/30 opacity-60" : "border-border bg-zinc-900"}`}
    >
      <span className="font-mono text-xs text-zinc-500 w-28 shrink-0">
        {s.date}
      </span>
      <span className="font-mono text-sm flex-1 truncate">
        {s.problem.title}
      </span>
      <span
        className={`text-xs font-mono ${diffConfig[s.problem.difficulty] ?? ""}`}
      >
        {s.problem.difficulty.charAt(0) +
          s.problem.difficulty.slice(1).toLowerCase()}
      </span>
      {!past && onDelete && (
        <button
          onClick={() => onDelete(s.date)}
          className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
        >
          <i className="ri-delete-bin-line text-sm" />
        </button>
      )}
    </div>
  );
}
