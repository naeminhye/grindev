"use client";

import { useEffect, useState, useCallback } from "react";
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

type AutoScheduleConfig = {
  days: number;
  difficulties: ("EASY" | "MEDIUM" | "HARD")[];
  skipExisting: boolean;
};

export default function SchedulePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  // Auto schedule state
  const [showAutoPanel, setShowAutoPanel] = useState(false);
  const [autoConfig, setAutoConfig] = useState<AutoScheduleConfig>({
    days: 7,
    difficulties: ["EASY", "MEDIUM", "HARD"],
    skipExisting: true,
  });
  const [autoPreview, setAutoPreview] = useState<
    { date: string; difficulty: string; problem: Problem }[]
  >([]);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoMessage, setAutoMessage] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

  const loadData = useCallback(async () => {
    const [p, s] = await Promise.all([
      fetch("/api/admin/problems")
        .then((r) => r.text())
        .then((t) => (t ? JSON.parse(t) : { problems: [] })),
      fetch("/api/admin/schedule")
        .then((r) => r.text())
        .then((t) => (t ? JSON.parse(t) : { scheduled: [] })),
    ]);

    const probs: Problem[] = p.problems ?? [];
    setProblems(probs);

    const days: DaySchedule[] = s.scheduled ?? [];
    setSchedule(days);

    // Auto-select closest date with missing slots
    const scheduledMap = new Map(days.map((d) => [d.date, d]));
    let autoDate = today;
    for (let i = 0; i < 90; i++) {
      const d = format(addDays(new Date(), i), "yyyy-MM-dd");
      const day = scheduledMap.get(d);
      if (!day || day.slots.length < 3) {
        autoDate = d;
        break;
      }
    }
    setSelectedDate(autoDate);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Auto schedule preview ─────────────────────────────────────────────
  const buildPreview = useCallback(() => {
    const scheduledMap = new Map(schedule.map((d) => [d.date, d]));
    const preview: { date: string; difficulty: string; problem: Problem }[] =
      [];

    // Track which problems are used per difficulty to avoid repeating too soon
    const usedByDiff: Record<string, string[]> = {
      EASY: [],
      MEDIUM: [],
      HARD: [],
    };

    for (let i = 0; i < autoConfig.days; i++) {
      const date = format(addDays(new Date(), i), "yyyy-MM-dd");
      const existingDay = scheduledMap.get(date);

      for (const diff of autoConfig.difficulties) {
        // Skip if already has this difficulty scheduled
        if (
          autoConfig.skipExisting &&
          existingDay?.slots.find((s) => s.difficulty === diff)
        ) {
          continue;
        }

        // Pick next unscheduled problem for this difficulty
        const available = problems.filter((p) => p.difficulty === diff);
        if (available.length === 0) continue;

        // Rotate through problems — pick one not recently used
        const recentlyUsed = new Set(usedByDiff[diff].slice(-available.length));
        const candidates = available.filter((p) => !recentlyUsed.has(p.id));
        const pool = candidates.length > 0 ? candidates : available;

        // Pick problem not already scheduled in preview for same diff
        const alreadyInPreview = new Set(
          preview.filter((p) => p.difficulty === diff).map((p) => p.problem.id),
        );
        const freshPool = pool.filter((p) => !alreadyInPreview.has(p.id));
        const pick = freshPool.length > 0 ? freshPool[0] : pool[0];

        preview.push({ date, difficulty: diff, problem: pick });
        usedByDiff[diff].push(pick.id);
      }
    }

    setAutoPreview(preview);
  }, [autoConfig, problems, schedule]);

  useEffect(() => {
    if (showAutoPanel && problems.length > 0) buildPreview();
  }, [showAutoPanel, buildPreview, problems.length]);

  async function handleAutoSchedule() {
    if (autoPreview.length === 0) return;
    setAutoRunning(true);
    setAutoMessage("");

    let created = 0;
    let failed = 0;

    for (const item of autoPreview) {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: item.date,
          difficulty: item.difficulty,
          problemId: item.problem.id,
        }),
      });
      if (res.ok) created++;
      else failed++;
    }

    setAutoMessage(
      `✓ Scheduled ${created} slots${failed > 0 ? `, ${failed} failed` : ""}`,
    );
    setAutoRunning(false);
    await loadData();
    buildPreview();
  }

  const selectedDay = schedule.find((d) => d.date === selectedDate);
  const slotsForDate = selectedDay?.slots ?? [];

  function getSlot(diff: (typeof DIFFICULTIES)[number]) {
    return slotsForDate.find((s) => s.difficulty === diff);
  }

  function problemsByDifficulty(diff: (typeof DIFFICULTIES)[number]) {
    return problems.filter((p) => p.difficulty === diff);
  }

  async function handleAssign(
    difficulty: (typeof DIFFICULTIES)[number],
    problemId: string,
  ) {
    if (!selectedDate || !problemId) return;
    setSaving(difficulty);
    setMessage("");

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
      setMessage(`✓ ${difficulty} assigned for ${selectedDate}`);
    } else {
      setMessage(`✗ ${data.error}`);
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
      setMessage(`✓ ${difficulty} removed from ${selectedDate}`);
    }
    setSaving(null);
  }

  const upcoming = schedule
    .filter((d) => d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 14);

  const past = schedule
    .filter((d) => d.date < today)
    .sort((a, b) => b.date.localeCompare(a.date)) // newest first
    .slice(0, 7);

  // Unscheduled counts by difficulty
  const unscheduledCounts = DIFFICULTIES.reduce(
    (acc, diff) => {
      const scheduled = new Set(
        schedule.flatMap((d) =>
          d.slots.filter((s) => s.difficulty === diff).map((s) => s.problem.id),
        ),
      );
      acc[diff] = problems.filter(
        (p) => p.difficulty === diff && !scheduled.has(p.id),
      ).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Schedule
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Assign up to 3 problems per day — one per difficulty.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAutoPanel((v) => !v);
            setAutoMessage("");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 font-mono text-sm rounded border transition-colors",
            showAutoPanel
              ? "bg-lime-400/10 border-lime-500/30 text-lime-400"
              : "border-border text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
          )}
        >
          <i className="ri-magic-line" />
          Auto Schedule
        </button>
      </div>

      {/* ── Auto Schedule Panel ─────────────────────────────────────────── */}
      {showAutoPanel && (
        <div className="bg-zinc-900 border border-lime-500/20 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <i className="ri-magic-line text-lime-400" />
            <span className="font-mono text-sm font-bold text-lime-400">
              Auto Schedule
            </span>
            <span className="text-xs font-mono text-zinc-500 ml-2">
              Fills nearest upcoming dates with unscheduled problems
            </span>
          </div>

          <div className="p-5 space-y-5">
            {/* Config */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Days ahead */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Days ahead
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={autoConfig.days}
                  onChange={(e) =>
                    setAutoConfig((c) => ({
                      ...c,
                      days: Math.max(1, Math.min(60, Number(e.target.value))),
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
                />
              </div>

              {/* Skip existing */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Existing slots
                </label>
                <div className="flex items-center gap-2 h-10">
                  <button
                    onClick={() =>
                      setAutoConfig((c) => ({
                        ...c,
                        skipExisting: !c.skipExisting,
                      }))
                    }
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded border text-xs font-mono transition-colors",
                      autoConfig.skipExisting
                        ? "bg-lime-400/10 border-lime-500/30 text-lime-400"
                        : "border-border text-zinc-400 hover:border-zinc-600",
                    )}
                  >
                    <i
                      className={
                        autoConfig.skipExisting
                          ? "ri-checkbox-line"
                          : "ri-checkbox-blank-line"
                      }
                    />
                    Skip already filled
                  </button>
                </div>
              </div>

              {/* Difficulties */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Include difficulties
                </label>
                <div className="flex items-center gap-1.5">
                  {DIFFICULTIES.map((diff) => {
                    const selected = autoConfig.difficulties.includes(diff);
                    const cfg = DIFF_CONFIG[diff];
                    return (
                      <button
                        key={diff}
                        onClick={() =>
                          setAutoConfig((c) => ({
                            ...c,
                            difficulties: selected
                              ? c.difficulties.filter((d) => d !== diff)
                              : [...c.difficulties, diff],
                          }))
                        }
                        className={cn(
                          "px-2.5 py-1 rounded border text-xs font-mono transition-colors",
                          selected
                            ? cn(cfg.bg, cfg.color)
                            : "border-border text-zinc-600 hover:border-zinc-600",
                        )}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Unscheduled summary */}
            <div className="flex items-center gap-4 p-3 bg-zinc-800 rounded-md text-xs font-mono flex-wrap">
              <span className="text-zinc-500">Unscheduled problems:</span>
              {DIFFICULTIES.map((diff) => (
                <span
                  key={diff}
                  className={cn(
                    "flex items-center gap-1",
                    DIFF_CONFIG[diff].color,
                  )}
                >
                  {DIFF_CONFIG[diff].label}:{" "}
                  <strong>{unscheduledCounts[diff]}</strong>
                </span>
              ))}
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Preview — {autoPreview.length} slot
                  {autoPreview.length !== 1 ? "s" : ""} to schedule
                </span>
                <button
                  onClick={buildPreview}
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                >
                  <i className="ri-refresh-line" /> Refresh
                </button>
              </div>

              {autoPreview.length === 0 ? (
                <p className="text-xs font-mono text-zinc-600 py-3">
                  {autoConfig.difficulties.length === 0
                    ? "Select at least one difficulty."
                    : "All slots for the selected period are already filled."}
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {/* Group by date */}
                  {Array.from(new Set(autoPreview.map((p) => p.date))).map(
                    (date) => {
                      const dayItems = autoPreview.filter(
                        (p) => p.date === date,
                      );
                      return (
                        <div
                          key={date}
                          className="flex items-center gap-3 p-2.5 bg-zinc-800 rounded text-xs font-mono"
                        >
                          <span className="text-zinc-500 w-24 shrink-0">
                            {date}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            {dayItems.map((item) => (
                              <span
                                key={item.difficulty}
                                className={cn(
                                  "px-2 py-0.5 rounded border",
                                  DIFF_CONFIG[
                                    item.difficulty as keyof typeof DIFF_CONFIG
                                  ].bg,
                                  DIFF_CONFIG[
                                    item.difficulty as keyof typeof DIFF_CONFIG
                                  ].color,
                                )}
                              >
                                {
                                  DIFF_CONFIG[
                                    item.difficulty as keyof typeof DIFF_CONFIG
                                  ].label
                                }
                                : {item.problem.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {/* Action */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {autoMessage && (
                <p
                  className={cn(
                    "text-xs font-mono",
                    autoMessage.startsWith("✓")
                      ? "text-lime-400"
                      : "text-red-400",
                  )}
                >
                  {autoMessage}
                </p>
              )}
              <button
                onClick={handleAutoSchedule}
                disabled={autoRunning || autoPreview.length === 0}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {autoRunning ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" />{" "}
                    Scheduling...
                  </>
                ) : (
                  <>
                    <i className="ri-calendar-check-line" /> Apply Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual date picker ──────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-border rounded-md p-5 space-y-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
            />
            {selectedDate < today && (
              <p className="text-xs font-mono text-yellow-400 flex items-center gap-1.5">
                <i className="ri-history-line" /> Past date — manual schedule
                only
              </p>
            )}
          </div>
          {message && (
            <p
              className={cn(
                "text-xs font-mono mt-5",
                message.startsWith("✓") ? "text-lime-400" : "text-red-400",
              )}
            >
              {message}
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
                    <span className="font-mono text-sm text-zinc-200 truncate flex-1">
                      {slot.problem.title}
                    </span>
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
                      key={selectedDate + diff} // reset on date change
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

      {/* ── Upcoming 14 days ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Next 14 days
        </h2>
        {upcoming.length === 0 && (
          <p className="text-sm font-mono text-zinc-600 py-4">
            Nothing scheduled.
          </p>
        )}
        {upcoming.map((day) => (
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
            <span className="font-mono text-xs text-zinc-500 w-24 shrink-0">
              {day.date}
            </span>
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {DIFFICULTIES.map((diff) => {
                const slot = day.slots.find((s) => s.difficulty === diff);
                const cfg = DIFF_CONFIG[diff];
                return slot ? (
                  <span
                    key={diff}
                    className={cn(
                      "text-xs font-mono px-2 py-0.5 rounded border",
                      cfg.bg,
                      cfg.color,
                    )}
                  >
                    {cfg.label}: {slot.problem.title}
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
        ))}

        {past.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Past (last 7 days)
            </h2>
            {past.map((day) => (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-md border transition-colors text-left opacity-60 hover:opacity-100",
                  selectedDate === day.date
                    ? "border-lime-500/30 bg-lime-500/5 opacity-100"
                    : "border-border bg-zinc-900 hover:border-zinc-600",
                )}
              >
                <span className="font-mono text-xs text-zinc-500 w-24 shrink-0">
                  {day.date}
                </span>
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {DIFFICULTIES.map((diff) => {
                    const slot = day.slots.find((s) => s.difficulty === diff);
                    const cfg = DIFF_CONFIG[diff];
                    return slot ? (
                      <span
                        key={diff}
                        className={cn(
                          "text-xs font-mono px-2 py-0.5 rounded border",
                          cfg.bg,
                          cfg.color,
                        )}
                      >
                        {cfg.label}: {slot.problem.title}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
