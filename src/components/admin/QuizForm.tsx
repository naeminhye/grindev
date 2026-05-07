"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";

const QUIZ_TOPICS = [
  "JAVASCRIPT",
  "TYPESCRIPT",
  "PYTHON",
  "CSS",
  "HTML",
  "REACT",
  "NODE",
  "DATABASES",
  "SYSTEM_DESIGN",
  "GENERAL_CS",
] as const;

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

export type QuizFormData = {
  title: string;
  topic: (typeof QUIZ_TOPICS)[number];
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questions: QuizQuestion[];
};

interface QuizFormProps {
  initial?: Partial<QuizFormData>;
  quizId?: string;
}

const BLANK_QUESTION: QuizQuestion = {
  question: "",
  code: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
};

const inputCls =
  "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50 transition-colors";

export default function QuizForm({ initial, quizId }: QuizFormProps) {
  const router = useRouter();
  const isEditing = !!quizId;

  const [form, setForm] = useState<QuizFormData>({
    title: initial?.title ?? "",
    topic: initial?.topic ?? "JAVASCRIPT",
    difficulty: initial?.difficulty ?? "EASY",
    questions: initial?.questions ?? [
      { ...BLANK_QUESTION, options: ["", "", "", ""] },
    ],
  });

  const [activeQuestion, setActiveQuestion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"meta" | "questions">("meta");

  // ── Question helpers ──────────────────────────────────────────────────

  function setQuestion(index: number, patch: Partial<QuizQuestion>) {
    setForm((f) => {
      const questions = [...f.questions];
      questions[index] = { ...questions[index], ...patch };
      return { ...f, questions };
    });
  }

  function setOption(qIndex: number, oIndex: number, value: string) {
    setForm((f) => {
      const questions = [...f.questions];
      const options = [...questions[qIndex].options];
      options[oIndex] = value;
      questions[qIndex] = { ...questions[qIndex], options };
      return { ...f, questions };
    });
  }

  function addQuestion() {
    if (form.questions.length >= 20) return;
    setForm((f) => ({
      ...f,
      questions: [
        ...f.questions,
        { ...BLANK_QUESTION, options: ["", "", "", ""] },
      ],
    }));
    setActiveQuestion(form.questions.length);
  }

  function removeQuestion(index: number) {
    if (form.questions.length <= 1) return;
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== index),
    }));
    setActiveQuestion((q) => Math.min(q, form.questions.length - 2));
  }

  function duplicateQuestion(index: number) {
    if (form.questions.length >= 20) return;
    const copy = {
      ...form.questions[index],
      options: [...form.questions[index].options],
    };
    setForm((f) => {
      const questions = [...f.questions];
      questions.splice(index + 1, 0, copy);
      return { ...f, questions };
    });
    setActiveQuestion(index + 1);
  }

  // ── Validation ────────────────────────────────────────────────────────

  function validate(): string | null {
    if (!form.title.trim()) return "Title is required.";
    if (form.questions.length === 0)
      return "At least one question is required.";
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question.trim()) return `Question ${i + 1} has no text.`;
      if (q.options.some((o) => !o.trim()))
        return `Question ${i + 1} has empty options.`;
    }
    return null;
  }

  // ── Save / Delete ─────────────────────────────────────────────────────

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/quizzes/${quizId}`
        : "/api/admin/quizzes";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          questions: form.questions.map((q) => ({
            ...q,
            code: q.code?.trim() || undefined,
            explanation: q.explanation?.trim() || undefined,
          })),
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setError(data.error ?? `Server error: ${res.status}`);
        return;
      }
      router.push("/admin/quizzes");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!quizId) return;
    if (!confirm("Delete this quiz? Attempt history will be preserved."))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Failed to delete");
        return;
      }
      router.push("/admin/quizzes");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const q = form.questions[activeQuestion];
  const completedCount = form.questions.filter(
    (q) => q.question.trim() && q.options.every((o) => o.trim()),
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Quiz" : "New Quiz"}
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            {isEditing
              ? `Editing: ${form.title}`
              : "Create a multiple-choice quiz."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-sm rounded transition-colors"
            >
              {deleting ? (
                <i className="ri-loader-4-line animate-spin" />
              ) : (
                <i className="ri-delete-bin-line" />
              )}
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 transition-colors"
          >
            {saving ? (
              <i className="ri-loader-4-line animate-spin" />
            ) : (
              <i className="ri-save-line" />
            )}
            {isEditing ? "Save Changes" : "Create Quiz"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm font-mono">
          <i className="ri-error-warning-line" /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(
          [
            { id: "meta", label: "Basic Info", icon: "ri-file-text-line" },
            {
              id: "questions",
              label: `Questions (${form.questions.length})`,
              icon: "ri-questionnaire-line",
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300",
            )}
          >
            <i className={tab.icon} />
            {tab.label}
            {tab.id === "questions" &&
              completedCount === form.questions.length &&
              form.questions.length > 0 && (
                <i className="ri-check-line text-lime-400 ml-1" />
              )}
          </button>
        ))}
      </div>

      {/* ── Basic Info tab ─────────────────────────────────────────────── */}
      {activeTab === "meta" && (
        <div className="space-y-5 max-w-xl">
          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="JavaScript Fundamentals"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Topic" required>
              <select
                value={form.topic}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topic: e.target.value as any }))
                }
                className={inputCls}
              >
                {QUIZ_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {TOPIC_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Difficulty" required>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, difficulty: e.target.value as any }))
                }
                className={inputCls}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </Field>
          </div>

          <div className="p-4 bg-zinc-900 border border-border rounded-md space-y-2 text-xs font-mono text-zinc-400">
            <p className="font-bold text-zinc-300">Tips for good quizzes:</p>
            <ul className="space-y-1 list-disc list-inside text-zinc-500">
              <li>5–10 questions is a good length for a daily quiz</li>
              <li>Use code blocks for questions involving syntax</li>
              <li>Add explanations to help users learn from wrong answers</li>
              <li>
                Make all 4 options plausible — avoid obvious filler answers
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Questions tab ──────────────────────────────────────────────── */}
      {activeTab === "questions" && (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 items-start">
          {/* Question list sidebar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Questions
              </span>
              <span className="text-xs font-mono text-zinc-600">
                {completedCount}/{form.questions.length}
              </span>
            </div>

            {form.questions.map((q, i) => {
              const isComplete =
                q.question.trim() && q.options.every((o) => o.trim());
              return (
                <button
                  key={i}
                  onClick={() => setActiveQuestion(i)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-md border text-left transition-colors text-xs font-mono",
                    activeQuestion === i
                      ? "border-lime-500/40 bg-lime-500/5 text-lime-400"
                      : "border-border bg-zinc-900 text-zinc-400 hover:border-zinc-600",
                  )}
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0",
                      isComplete
                        ? "bg-lime-400/20 text-lime-400"
                        : "bg-zinc-800 text-zinc-500",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate flex-1">
                    {q.question.trim()
                      ? q.question.substring(0, 40)
                      : "Empty question"}
                  </span>
                </button>
              );
            })}

            <button
              onClick={addQuestion}
              disabled={form.questions.length >= 20}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-zinc-700 text-xs font-mono text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className="ri-add-line" /> Add Question
            </button>
          </div>

          {/* Question editor */}
          <div className="space-y-5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Question {activeQuestion + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => duplicateQuestion(activeQuestion)}
                  disabled={form.questions.length >= 20}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors disabled:opacity-40"
                  title="Duplicate"
                >
                  <i className="ri-file-copy-line text-sm" />
                </button>
                <button
                  onClick={() => removeQuestion(activeQuestion)}
                  disabled={form.questions.length <= 1}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors disabled:opacity-40"
                  title="Remove"
                >
                  <i className="ri-delete-bin-line text-sm" />
                </button>
              </div>
            </div>

            {/* Question text */}
            <Field label="Question" required>
              <textarea
                value={q.question}
                onChange={(e) =>
                  setQuestion(activeQuestion, { question: e.target.value })
                }
                placeholder="What is the output of typeof null?"
                rows={3}
                className={cn(inputCls, "resize-y")}
              />
            </Field>

            {/* Code block (optional) */}
            <Field label="Code Block (optional)">
              <textarea
                value={q.code ?? ""}
                onChange={(e) =>
                  setQuestion(activeQuestion, { code: e.target.value })
                }
                placeholder={"const x = [1, 2, 3]\nconsole.log(x[3])"}
                rows={4}
                className={cn(inputCls, "resize-y font-mono text-xs")}
              />
              <p className="text-[11px] font-mono text-zinc-600 mt-1">
                Leave empty if the question has no code. Shown as a code block
                above the options.
              </p>
            </Field>

            {/* Options */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Options <span className="text-red-400 ml-1">*</span>
              </label>
              <p className="text-[11px] font-mono text-zinc-600">
                Click the radio button to mark the correct answer.
              </p>
              {q.options.map((option, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setQuestion(activeQuestion, { correctIndex: oi })
                    }
                    className={cn(
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      q.correctIndex === oi
                        ? "border-lime-400 bg-lime-400"
                        : "border-zinc-600 hover:border-zinc-400",
                    )}
                    title="Mark as correct"
                  >
                    {q.correctIndex === oi && (
                      <i className="ri-check-line text-zinc-950 text-sm" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "w-6 text-xs font-mono font-bold text-center shrink-0",
                      q.correctIndex === oi ? "text-lime-400" : "text-zinc-500",
                    )}
                  >
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <input
                    value={option}
                    onChange={(e) =>
                      setOption(activeQuestion, oi, e.target.value)
                    }
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    className={cn(
                      inputCls,
                      "flex-1",
                      q.correctIndex === oi && "border-lime-500/40",
                    )}
                  />
                </div>
              ))}
              <p className="text-[11px] font-mono text-zinc-600">
                Correct answer:{" "}
                <span className="text-lime-400">
                  Option {String.fromCharCode(65 + q.correctIndex)}
                </span>
              </p>
            </div>

            {/* Explanation */}
            <Field label="Explanation (optional)">
              <textarea
                value={q.explanation ?? ""}
                onChange={(e) =>
                  setQuestion(activeQuestion, { explanation: e.target.value })
                }
                placeholder="typeof null returns 'object' due to a historical bug in JavaScript..."
                rows={3}
                className={cn(inputCls, "resize-y")}
              />
              <p className="text-[11px] font-mono text-zinc-600 mt-1">
                Shown to users after they answer incorrectly.
              </p>
            </Field>

            {/* Navigation between questions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <button
                onClick={() => setActiveQuestion((q) => Math.max(0, q - 1))}
                disabled={activeQuestion === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
              >
                <i className="ri-arrow-left-line" /> Previous
              </button>
              <span className="text-xs font-mono text-zinc-600">
                {activeQuestion + 1} / {form.questions.length}
              </span>
              {activeQuestion < form.questions.length - 1 ? (
                <button
                  onClick={() => setActiveQuestion((q) => q + 1)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Next <i className="ri-arrow-right-line" />
                </button>
              ) : (
                <button
                  onClick={addQuestion}
                  disabled={form.questions.length >= 20}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-lime-400 hover:text-lime-300 disabled:opacity-30 transition-colors"
                >
                  <i className="ri-add-line" /> New Question
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom save */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => router.push("/admin/quizzes")}
          className="px-4 py-2 text-sm font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 transition-colors"
        >
          {saving ? (
            <i className="ri-loader-4-line animate-spin" />
          ) : (
            <i className="ri-save-line" />
          )}
          {isEditing ? "Save Changes" : "Create Quiz"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
