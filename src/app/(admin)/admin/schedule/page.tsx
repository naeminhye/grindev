"use client";

import { useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

type Problem = {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};
type DaySchedule = {
  date: string;
  slots: { difficulty: "EASY" | "MEDIUM" | "HARD"; problem: Problem }[];
};

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
const DIFF_CONFIG = {
  EASY: {
    label: "Easy",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  HARD: {
    label: "Hard",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

export default function SchedulePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/problems").then((r) => r.json()),
      fetch("/api/admin/schedule").then((r) => r.json()),
    ]).then(([p, s]) => {
      const probs: Problem[] = p.problems ?? [];
      setProblems(probs);
      const days: DaySchedule[] = s.scheduled ?? [];
      setSchedule(days);

      const today = format(new Date(), "yyyy-MM-dd");
      let autoDate = today;
      for (let i = 0; i < 90; i++) {
        const d = format(addDays(new Date(), i), "yyyy-MM-dd");
        const daySlots = days.find((s) => s.date === d);
        if (!daySlots || daySlots.slots.length < 3) {
          autoDate = d;
          break;
        }
      }
      setSelectedDate(autoDate);
      setLoading(false);
    });
  }, []);

  const selectedDay = schedule.find((d) => d.date === selectedDate);
  const slotsForDate = selectedDay?.slots ?? [];

  function getSlot(diff: (typeof DIFFICULTIES)[number]) {
    return slotsForDate.find((s) => s.difficulty === diff);
  }

  function problemsByDifficulty(diff: (typeof DIFFICULTIES)[number]) {
    return problems.filter((p) => p.difficulty === diff);
  }

  // Count how many dates each problem is scheduled on
  const problemScheduleCount = new Map<string, number>();
  for (const day of schedule) {
    for (const slot of day.slots) {
      problemScheduleCount.set(
        slot.problem.id,
        (problemScheduleCount.get(slot.problem.id) ?? 0) + 1,
      );
    }
  }

  async function handleAssign(
    difficulty: (typeof DIFFICULTIES)[number],
    problemId: string,
  ) {
    if (!selectedDate || !problemId) return;
    setSaving(difficulty);
    setMessage(null);

    const res = await fetch("/api/admin/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, difficulty, problemId }),
    });

    const data = await res.json();
    if (res.ok) {
      const problem = problems.find((p) => p.id === problemId)!;
      setSchedule((prev) => {
        const existing = prev.find((d) => d.date === selectedDate);
        if (existing) {
          return prev.map((d) =>
            d.date === selectedDate
              ? {
                  ...d,
                  slots: [
                    ...d.slots.filter((s) => s.difficulty !== difficulty),
                    { difficulty, problem },
                  ],
                }
              : d,
          );
        }
        return [
          ...prev,
          { date: selectedDate, slots: [{ difficulty, problem }] },
        ];
      });

      if (data.warning) {
        setMessage({
          text: `✓ Assigned — ⚠️ ${data.warning}`,
          type: "warning",
        });
      } else {
        setMessage({
          text: `✓ ${difficulty} assigned for ${selectedDate}`,
          type: "success",
        });
      }
    } else {
      setMessage({ text: `✗ ${data.error}`, type: "error" });
    }
    setSaving(null);
  }

  async function handleRemove(difficulty: (typeof DIFFICULTIES)[number]) {
    if (!confirm(`Remove ${difficulty} problem from ${selectedDate}?`)) return;
    setSaving(difficulty);

    const res = await fetch(
      `/api/admin/schedule/${selectedDate}/${difficulty}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      setSchedule((prev) =>
        prev
          .map((d) =>
            d.date === selectedDate
              ? {
                  ...d,
                  slots: d.slots.filter((s) => s.difficulty !== difficulty),
                }
              : d,
          )
          .filter((d) => d.slots.length > 0),
      );
      setMessage({
        text: `✓ ${difficulty} removed from ${selectedDate}`,
        type: "success",
      });
    }
    setSaving(null);
  }

  const upcoming = schedule
    .filter((d) => d.date >= format(new Date(), "yyyy-MM-dd"))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 14);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 w-full space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Schedule
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          Assign up to 3 problems per day — one per difficulty.
        </p>
      </div>

      {/* Date picker */}
      <div className="bg-zinc-900 border border-border rounded-md p-5 space-y-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setMessage(null);
              }}
              min={format(new Date(), "yyyy-MM-dd")}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
            />
          </div>
          {message && (
            <p
              className={cn(
                "text-xs font-mono mt-5 flex-1",
                message.type === "success"
                  ? "text-lime-400"
                  : message.type === "warning"
                    ? "text-yellow-400"
                    : "text-red-400",
              )}
            >
              {message.text}
            </p>
          )}
        </div>

        {/* Three difficulty slots */}
        <div className="space-y-3">
          {DIFFICULTIES.map((diff) => {
            const slot = getSlot(diff);
            const available = problemsByDifficulty(diff);
            const isSaving = saving === diff;
            const cfg = DIFF_CONFIG[diff];

            return (
              <div
                key={diff}
                className="p-4 border border-border rounded-md bg-zinc-800/50 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-mono font-bold uppercase tracking-widest",
                      cfg.color,
                    )}
                  >
                    {cfg.label}
                  </span>
                  {slot ? (
                    <span
                      className={cn(
                        "text-xs font-mono px-2 py-0.5 rounded border ml-auto",
                        cfg.bg,
                        cfg.color,
                      )}
                    >
                      <i className="ri-check-line mr-1" />
                      assigned
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-zinc-600 ml-auto">
                      not assigned
                    </span>
                  )}
                </div>

                {slot ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-sm text-zinc-200 truncate">
                        {slot.problem.title}
                      </span>
                      {/* Duplicate warning */}
                      {(problemScheduleCount.get(slot.problem.id) ?? 0) > 1 && (
                        <span className="flex items-center gap-1 text-xs font-mono text-yellow-400 border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 rounded shrink-0">
                          <i className="ri-error-warning-line" />
                          scheduled {problemScheduleCount.get(slot.problem.id)}×
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(diff)}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-red-400 border border-red-500/20 hover:bg-red-500/10 rounded transition-colors shrink-0"
                    >
                      {isSaving ? (
                        <i className="ri-loader-4-line animate-spin" />
                      ) : (
                        <i className="ri-delete-bin-line" />
                      )}
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleAssign(diff, e.target.value);
                      }}
                      disabled={isSaving || available.length === 0}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50 disabled:opacity-50"
                    >
                      <option value="">
                        {available.length === 0
                          ? `No ${cfg.label} problems available`
                          : `Select ${cfg.label} problem...`}
                      </option>
                      {available.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                          {(problemScheduleCount.get(p.id) ?? 0) > 0
                            ? ` (scheduled ${problemScheduleCount.get(p.id)}×)`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {isSaving && (
                      <i className="ri-loader-4-line animate-spin text-lime-400 shrink-0" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming 14 days */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Next 14 days
        </h2>
        {upcoming.length === 0 && (
          <p className="text-sm font-mono text-zinc-600 py-4">
            Nothing scheduled.
          </p>
        )}
        {upcoming.map((day) => {
          // Check if any slot has a duplicate
          const hasDuplicate = day.slots.some(
            (s) => (problemScheduleCount.get(s.problem.id) ?? 0) > 1,
          );
          return (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-md border transition-colors text-left",
                selectedDate === day.date
                  ? "border-lime-500/30 bg-lime-500/5"
                  : "border-border bg-zinc-900 hover:border-zinc-600",
              )}
            >
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-zinc-500 w-24">
                  {day.date}
                </span>
                {hasDuplicate && (
                  <i
                    className="ri-error-warning-line text-yellow-400 text-xs"
                    title="Contains a problem scheduled on multiple days"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                {DIFFICULTIES.map((diff) => {
                  const slot = day.slots.find((s) => s.difficulty === diff);
                  const cfg = DIFF_CONFIG[diff];
                  const isDupe =
                    slot &&
                    (problemScheduleCount.get(slot.problem.id) ?? 0) > 1;
                  return slot ? (
                    <span
                      key={diff}
                      className={cn(
                        "text-xs font-mono px-2 py-0.5 rounded border",
                        isDupe
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : `${cfg.bg} ${cfg.color}`,
                      )}
                    >
                      {cfg.label}: {slot.problem.title}
                      {isDupe && " ⚠️"}
                    </span>
                  ) : (
                    <span
                      key={diff}
                      className="text-xs font-mono text-zinc-700 px-2 py-0.5 border border-zinc-800 rounded"
                    >
                      {cfg.label}: —
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
