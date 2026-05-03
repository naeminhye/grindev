"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/languages";

const TOPICS = [
  "ARRAYS",
  "STRINGS",
  "LINKED_LISTS",
  "TREES",
  "GRAPHS",
  "DYNAMIC_PROGRAMMING",
  "SORTING",
  "BINARY_SEARCH",
  "STACK_QUEUE",
  "HASH_MAP",
];

const HINT_DEFAULTS = [
  { tier: 1, cost: 1, content: "" },
  { tier: 2, cost: 3, content: "" },
  { tier: 3, cost: 7, content: "" },
  { tier: 4, cost: 15, content: "" },
];

export type ProblemFormData = {
  title: string;
  slug: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
  starterCode: Record<string, string>;
  testCases: { input: string; expected: string }[];
  hints: { tier: number; cost: number; content: string }[];
};

interface ProblemFormProps {
  initial?: Partial<ProblemFormData>;
  problemId?: string; // if editing
}

export default function ProblemForm({ initial, problemId }: ProblemFormProps) {
  const router = useRouter();
  const isEditing = !!problemId;

  const [form, setForm] = useState<ProblemFormData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    difficulty: initial?.difficulty ?? "EASY",
    topic: initial?.topic ?? "ARRAYS",
    starterCode:
      initial?.starterCode ??
      Object.fromEntries(LANGUAGES.map((l) => [l.id, ""])),
    testCases: initial?.testCases ?? [{ input: "", expected: "" }],
    hints: initial?.hints ?? HINT_DEFAULTS,
  });

  const [activeTab, setActiveTab] = useState<
    "basic" | "code" | "tests" | "hints"
  >("basic");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [activeLang, setActiveLang] = useState("JAVASCRIPT");

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug:
        f.slug === autoSlug(f.title) || f.slug === ""
          ? autoSlug(title)
          : f.slug,
    }));
  }

  function setTestCase(
    index: number,
    field: "input" | "expected",
    value: string,
  ) {
    setForm((f) => {
      const testCases = [...f.testCases];
      testCases[index] = { ...testCases[index], [field]: value };
      return { ...f, testCases };
    });
  }

  function addTestCase() {
    setForm((f) => ({
      ...f,
      testCases: [...f.testCases, { input: "", expected: "" }],
    }));
  }

  function removeTestCase(index: number) {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.filter((_, i) => i !== index),
    }));
  }

  function setHint(
    tier: number,
    field: "content" | "cost",
    value: string | number,
  ) {
    setForm((f) => ({
      ...f,
      hints: f.hints.map((h) =>
        h.tier === tier ? { ...h, [field]: value } : h,
      ),
    }));
  }

  async function handleSave() {
    if (!form.title || !form.slug || !form.description) {
      setError("Title, slug and description are required.");
      return;
    }
    if (form.testCases.some((tc) => !tc.input || !tc.expected)) {
      setError("All test cases must have input and expected output.");
      setActiveTab("tests");
      return;
    }
    setError("");
    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/problems/${problemId}`
        : "/api/admin/problems";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!problemId) return;
    if (
      !confirm(
        "Delete this problem? Solve history will be preserved for users.",
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/problems/${problemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Failed to delete");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "ri-file-text-line" },
    { id: "code", label: "Starter Code", icon: "ri-code-s-slash-line" },
    {
      id: "tests",
      label: `Test Cases (${form.testCases.length})`,
      icon: "ri-test-tube-line",
    },
    { id: "hints", label: "Hints", icon: "ri-lightbulb-line" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Problem" : "New Problem"}
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            {isEditing ? `Editing: ${form.title}` : "Create a new DSA problem."}
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
            {isEditing ? "Save Changes" : "Create Problem"}
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
        {tabs.map((tab) => (
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
          </button>
        ))}
      </div>

      {/* Basic Info */}
      {activeTab === "basic" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" required>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Two Sum"
                className={inputCls}
              />
            </Field>
            <Field label="Slug" required>
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="two-sum"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Difficulty">
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
            <Field label="Topic">
              <select
                value={form.topic}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topic: e.target.value }))
                }
                className={inputCls}
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description (Markdown)" required>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="## Problem Title&#10;&#10;Given..."
              rows={16}
              className={cn(
                inputCls,
                "resize-y font-mono text-xs leading-relaxed",
              )}
            />
          </Field>

          {/* Markdown preview */}
          {form.description && (
            <Field label="Preview">
              <div
                className="p-4 bg-zinc-950 border border-border rounded-md prose prose-invert prose-sm max-w-none font-mono
                  prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-border"
                dangerouslySetInnerHTML={{ __html: mdToHtml(form.description) }}
              />
            </Field>
          )}
        </div>
      )}

      {/* Starter Code */}
      {activeTab === "code" && (
        <div className="space-y-4">
          <p className="text-xs font-mono text-zinc-500">
            Provide starter code for each language. Users see this when they
            open the problem.
          </p>

          {/* Language tabs */}
          <div className="flex items-center gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setActiveLang(lang.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono rounded transition-colors",
                  activeLang === lang.id
                    ? "bg-lime-400/10 text-lime-400 border border-lime-500/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent",
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <textarea
            value={form.starterCode[activeLang] ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                starterCode: { ...f.starterCode, [activeLang]: e.target.value },
              }))
            }
            placeholder={`// ${activeLang} starter code`}
            rows={16}
            className={cn(
              inputCls,
              "resize-y font-mono text-xs leading-relaxed",
            )}
          />
        </div>
      )}

      {/* Test Cases */}
      {activeTab === "tests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-zinc-500">
              Test cases are hidden from users. Input lines are parsed as JSON
              args.
            </p>
            <button
              onClick={addTestCase}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-border rounded hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <i className="ri-add-line" /> Add Test Case
            </button>
          </div>

          {form.testCases.map((tc, i) => (
            <div
              key={i}
              className="p-4 bg-zinc-900 border border-border rounded-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  Test {i + 1}
                </span>
                {form.testCases.length > 1 && (
                  <button
                    onClick={() => removeTestCase(i)}
                    className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Input (one arg per line, JSON format)">
                  <textarea
                    value={tc.input}
                    onChange={(e) => setTestCase(i, "input", e.target.value)}
                    placeholder={"[2,7,11,15]\n9"}
                    rows={4}
                    className={cn(inputCls, "resize-none font-mono text-xs")}
                  />
                </Field>
                <Field label="Expected Output (JSON)">
                  <textarea
                    value={tc.expected}
                    onChange={(e) => setTestCase(i, "expected", e.target.value)}
                    placeholder={"[0,1]"}
                    rows={4}
                    className={cn(inputCls, "resize-none font-mono text-xs")}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hints */}
      {activeTab === "hints" && (
        <div className="space-y-4">
          <p className="text-xs font-mono text-zinc-500">
            4 tiers — each progressively more revealing. Users spend stars to
            unlock.
          </p>
          {form.hints.map((hint) => (
            <div
              key={hint.tier}
              className="p-4 bg-zinc-900 border border-border rounded-md space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                    Tier {hint.tier}
                  </span>
                  <span className="text-xs font-mono text-zinc-600">
                    {hint.tier === 1 && "Data structure nudge"}
                    {hint.tier === 2 && "Algorithm name"}
                    {hint.tier === 3 && "Pseudocode"}
                    {hint.tier === 4 && "Full walkthrough"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-500">Cost:</span>
                  <input
                    type="number"
                    value={hint.cost}
                    onChange={(e) =>
                      setHint(hint.tier, "cost", Number(e.target.value))
                    }
                    className="w-16 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-300 text-center"
                    min={1}
                  />
                  <span className="text-xs font-mono text-yellow-400">⭐</span>
                </div>
              </div>
              <textarea
                value={hint.content}
                onChange={(e) => setHint(hint.tier, "content", e.target.value)}
                placeholder={
                  hint.tier === 1
                    ? "Think about which data structure allows O(1) lookups..."
                    : hint.tier === 2
                      ? "This problem uses a Hash Map pattern..."
                      : hint.tier === 3
                        ? "1. Create a map\n2. For each num..."
                        : "Full solution:\n```js\nfunction solution() {...}\n```"
                }
                rows={hint.tier >= 3 ? 8 : 4}
                className={cn(
                  inputCls,
                  "resize-y font-mono text-xs leading-relaxed",
                )}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom save */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => router.push("/admin")}
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
          {isEditing ? "Save Changes" : "Create Problem"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50 transition-colors";

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

function mdToHtml(md: string): string {
  return md
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
