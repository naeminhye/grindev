"use client";

import { useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

type Quiz = {
  id: string;
  title: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};
type ScheduledSlot = { date: string; quiz: Quiz };

const TOPIC_LABELS: Record<string, string> = {
  JAVASCRIPT: "JS",
  TYPESCRIPT: "TS",
  PYTHON: "Python",
  CSS: "CSS",
  HTML: "HTML",
  REACT: "React",
  NODE: "Node",
  DATABASES: "DB",
  SYSTEM_DESIGN: "SysDesign",
  GENERAL_CS: "CS",
};

export default function QuizSchedulePage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [schedule, setSchedule] = useState<ScheduledSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/quizzes").then((r) => r.json()),
      fetch("/api/admin/quiz-schedule").then((r) => r.json()),
    ]).then(([q, s]) => {
      setQuizzes(q.quizzes ?? []);
      setSchedule(s.scheduled ?? []);
      setLoading(false);
    });
  }, []);

  const selectedSlot = schedule.find((s) => s.date === selectedDate);

  async function handleAssign(quizId: string) {
    if (!quizId) return;
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/admin/quiz-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: selectedDate, quizId }),
    });

    const data = await res.json();
    if (res.ok) {
      const quiz = quizzes.find((q) => q.id === quizId)!;
      setSchedule((prev) => [
        ...prev.filter((s) => s.date !== selectedDate),
        { date: selectedDate, quiz },
      ]);
      setMessage({
        text: data.warning
          ? `✓ Assigned — ⚠️ ${data.warning}`
          : `✓ Quiz assigned for ${selectedDate}`,
        type: data.warning ? "warning" : "success",
      });
    } else {
      setMessage({ text: `✗ ${data.error}`, type: "error" });
    }
    setSaving(false);
  }

  async function handleRemove() {
    if (!confirm(`Remove quiz from ${selectedDate}?`)) return;
    setSaving(true);

    const res = await fetch(`/api/admin/quiz-schedule/${selectedDate}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSchedule((prev) => prev.filter((s) => s.date !== selectedDate));
      setMessage({
        text: `✓ Quiz removed from ${selectedDate}`,
        type: "success",
      });
    }
    setSaving(false);
  }

  const upcoming = schedule
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 14);

  const past = schedule
    .filter((s) => s.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10 w-full space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Quiz Schedule
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          Assign one quiz per day for Quiz Mode users.
        </p>
      </div>

      {/* Date picker + slot */}
      <div className="bg-zinc-900 border border-border rounded-md p-5 space-y-4">
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
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50"
            />
            {selectedDate < today && (
              <p className="text-xs font-mono text-yellow-400 flex items-center gap-1.5">
                <i className="ri-history-line" /> Past date
              </p>
            )}
          </div>
          {message && (
            <p
              className={cn(
                "text-xs font-mono mt-5",
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

        {/* Slot */}
        <div className="p-4 border border-border rounded-md bg-zinc-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
              Quiz
            </span>
            {selectedSlot ? (
              <span className="text-xs font-mono px-2 py-0.5 rounded border bg-lime-500/10 border-lime-500/20 text-lime-400">
                <i className="ri-check-line mr-1" />
                assigned
              </span>
            ) : (
              <span className="text-xs font-mono text-zinc-600">
                not assigned
              </span>
            )}
          </div>

          {selectedSlot ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-mono text-sm text-zinc-200 truncate">
                  {selectedSlot.quiz.title}
                </span>
                <span className="text-xs font-mono text-blue-400 border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">
                  {TOPIC_LABELS[selectedSlot.quiz.topic] ??
                    selectedSlot.quiz.topic}
                </span>
              </div>
              <button
                onClick={handleRemove}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-red-400 border border-red-500/20 hover:bg-red-500/10 rounded transition-colors shrink-0"
              >
                {saving ? (
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
                key={selectedDate}
                onChange={(e) => {
                  if (e.target.value) handleAssign(e.target.value);
                }}
                disabled={saving || quizzes.length === 0}
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50 disabled:opacity-50"
              >
                <option value="">
                  {quizzes.length === 0
                    ? "No quizzes available"
                    : "Select quiz..."}
                </option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({TOPIC_LABELS[q.topic] ?? q.topic} ·{" "}
                    {q.difficulty.charAt(0) +
                      q.difficulty.slice(1).toLowerCase()}
                    )
                  </option>
                ))}
              </select>
              {saving && (
                <i className="ri-loader-4-line animate-spin text-lime-400 shrink-0" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Next 14 days
        </h2>
        {upcoming.length === 0 && (
          <p className="text-sm font-mono text-zinc-600 py-4">
            Nothing scheduled.
          </p>
        )}
        {upcoming.map((slot) => (
          <button
            key={slot.date}
            onClick={() => setSelectedDate(slot.date)}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-md border transition-colors text-left",
              selectedDate === slot.date
                ? "border-lime-500/30 bg-lime-500/5"
                : "border-border bg-zinc-900 hover:border-zinc-600",
            )}
          >
            <span className="font-mono text-xs text-zinc-500 w-24 shrink-0">
              {slot.date}
            </span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-mono text-zinc-200 truncate">
                {slot.quiz.title}
              </span>
              <span className="text-xs font-mono text-blue-400 border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0">
                {TOPIC_LABELS[slot.quiz.topic] ?? slot.quiz.topic}
              </span>
            </div>
          </button>
        ))}

        {past.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Past (last 7 days)
            </h2>
            {past.map((slot) => (
              <button
                key={slot.date}
                onClick={() => setSelectedDate(slot.date)}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-md border transition-colors text-left opacity-60 hover:opacity-100",
                  selectedDate === slot.date
                    ? "border-lime-500/30 bg-lime-500/5 opacity-100"
                    : "border-border bg-zinc-900 hover:border-zinc-600",
                )}
              >
                <span className="font-mono text-xs text-zinc-500 w-24 shrink-0">
                  {slot.date}
                </span>
                <span className="text-xs font-mono text-zinc-400 truncate">
                  {slot.quiz.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
