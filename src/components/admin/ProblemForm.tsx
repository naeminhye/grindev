"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/languages";
import { TopicTagInput } from "@/components/admin/TopicTagInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProblemExample } from "@/types";

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
  "HEAPS",
  "TWO_POINTERS",
  "SLIDING_WINDOW",
  "DFS_BFS",
  "BACKTRACKING",
  "GREEDY",
  "RECURSION",
  "DIVIDE_AND_CONQUER",
  "BIT_MANIPULATION",
  "MATH",
  "TRIE",
  "UNION_FIND",
  "SEGMENT_TREE",
  "FENWICK_TREE",
  "MONOTONIC_STACK",
  "MONOTONIC_QUEUE",
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
  functionName: string;
  description: string;
  examples: ProblemExample[];
  constraints: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topics: string[];
  starterCode: Record<string, string>;
  testCases: { input: string; expected: string }[];
  hints: { tier: number; cost: number; content: string }[];
  sourceName: string | null;
  sourceUrl: string | null;
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
    functionName: initial?.functionName ?? "",
    description: initial?.description ?? "",
    examples: initial?.examples ?? [
      {
        input: "",
        output: "",
        explanation: "",
      },
    ],
    constraints: initial?.constraints ?? "",
    difficulty: initial?.difficulty ?? "EASY",
    topics: initial?.topics ?? [],
    starterCode:
      initial?.starterCode ??
      Object.fromEntries(LANGUAGES.map((l) => [l.id, ""])),
    testCases: initial?.testCases ?? [{ input: "", expected: "" }],
    hints: initial?.hints ?? HINT_DEFAULTS,
    sourceName: initial?.sourceName ?? null,
    sourceUrl: initial?.sourceUrl ?? null,
  });

  const [activeTab, setActiveTab] = useState<
    "basic" | "code" | "tests" | "hints"
  >("basic");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [activeLang, setActiveLang] = useState("JAVASCRIPT");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  function setExample(
    index: number,
    field: "input" | "output" | "explanation",
    value: string,
  ) {
    setForm((f) => {
      const examples = [...f.examples];
      examples[index] = { ...examples[index], [field]: value };
      return { ...f, examples };
    });
  }

  function addExample() {
    setForm((f) => {
      if (f.examples.length >= 5) return f;

      return {
        ...f,
        examples: [
          ...f.examples,
          {
            input: "",
            output: "",
            explanation: "",
          },
        ],
      };
    });
  }

  function removeExample(index: number) {
    setForm((f) => ({
      ...f,
      examples: f.examples.filter((_, i) => i !== index),
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
    if (!form.title || !form.slug || !form.description || !form.constraints) {
      setError("Title, slug, description and constraints are required.");
      setActiveTab("basic");
      return;
    }

    if (form.topics.length === 0) {
      setError("Please select at least one topic.");
      setActiveTab("basic");
      return;
    }

    if (
      form.examples.length < 1 ||
      form.examples.length > 5 ||
      form.examples.some((example) => !example.input || !example.output)
    ) {
      setError(
        "Please add 1 to 5 examples. Each example needs input and output.",
      );
      setActiveTab("basic");
      return;
    }
    if (form.testCases.some((tc) => !tc.input || !tc.expected)) {
      setError("All test cases must have input and expected output.");
      setActiveTab("tests");
      return;
    }

    // Validate URL nếu có nhập
    if (form.sourceUrl && form.sourceUrl.trim() !== "") {
      try {
        new URL(form.sourceUrl);
      } catch {
        setError("Source URL is not a valid URL.");
        setActiveTab("basic");
        return;
      }
    }

    setError("");
    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/problems/${problemId}`
        : "/api/admin/problems";
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        ...form,
        sourceName: form.sourceName?.trim() || null,
        sourceUrl: form.sourceUrl?.trim() || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Guard against empty response
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        setError(data.error ?? `Server error: ${res.status}`);
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
      setShowDeleteConfirm(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full space-y-6">
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Problem"
          message={`Delete "${form.title}"? Solve history will be preserved for users.`}
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => !deleting && setShowDeleteConfirm(false)}
        />
      )}
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
              onClick={() => setShowDeleteConfirm(true)}
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
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
          {/* Form */}
          <div className="space-y-5 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Source Name">
                <input
                  value={form.sourceName ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sourceName: e.target.value || null }))
                  }
                  placeholder="LeetCode, GeeksforGeeks..."
                  className={inputCls}
                />
              </Field>

              <Field label="Source URL">
                <input
                  value={form.sourceUrl ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sourceUrl: e.target.value || null }))
                  }
                  placeholder="https://leetcode.com/problems/..."
                  type="url"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Function Name" required>
              <input
                value={form.functionName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, functionName: e.target.value }))
                }
                placeholder="twoSum"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Difficulty">
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      difficulty: e.target.value as any,
                    }))
                  }
                  className={inputCls}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </Field>

              <Field label="Topics" required>
                <TopicTagInput
                  value={form.topics ?? []}
                  onChange={(topics) => setForm((f) => ({ ...f, topics }))}
                />
              </Field>
            </div>

            <Field label="Description (Markdown)" required>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Given an array of integers..."
                rows={12}
                className={cn(
                  inputCls,
                  "resize-y font-mono text-xs leading-relaxed",
                )}
              />
            </Field>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Examples <span className="text-red-400">*</span>
                  </h2>
                  <p className="text-xs font-mono text-zinc-600 mt-1">
                    Add 1 to 5 examples. Input and output support Markdown.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addExample}
                  disabled={form.examples.length >= 5}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-border rounded hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="ri-add-line" />
                  Add Example
                </button>
              </div>

              {form.examples.map((example, index) => (
                <div
                  key={index}
                  className="p-4 bg-[hsl(var(--surface))] border border-border rounded-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                      Example {index + 1}
                    </span>

                    {form.examples.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExample(index)}
                        className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Input (Markdown)" required>
                      <textarea
                        value={example.input}
                        onChange={(e) =>
                          setExample(index, "input", e.target.value)
                        }
                        placeholder={
                          "```txt\nnums = [2, 7, 11, 15], target = 9\n```"
                        }
                        rows={5}
                        className={cn(
                          inputCls,
                          "resize-y font-mono text-xs leading-relaxed",
                        )}
                      />
                    </Field>

                    <Field label="Output (Markdown)" required>
                      <textarea
                        value={example.output}
                        onChange={(e) =>
                          setExample(index, "output", e.target.value)
                        }
                        placeholder={"```txt\n[0, 1]\n```"}
                        rows={5}
                        className={cn(
                          inputCls,
                          "resize-y font-mono text-xs leading-relaxed",
                        )}
                      />
                    </Field>
                  </div>

                  <Field label="Explanation (Markdown)">
                    <textarea
                      value={example.explanation ?? ""}
                      onChange={(e) =>
                        setExample(index, "explanation", e.target.value)
                      }
                      placeholder="Because nums[0] + nums[1] equals the target."
                      rows={4}
                      className={cn(
                        inputCls,
                        "resize-y font-mono text-xs leading-relaxed",
                      )}
                    />
                  </Field>
                </div>
              ))}
            </section>

            <Field label="Constraints (Markdown)" required>
              <textarea
                value={form.constraints}
                onChange={(e) =>
                  setForm((f) => ({ ...f, constraints: e.target.value }))
                }
                placeholder={
                  "- `2 <= nums.length <= 10^4`\n- `-10^9 <= nums[i] <= 10^9`"
                }
                rows={8}
                className={cn(
                  inputCls,
                  "resize-y font-mono text-xs leading-relaxed",
                )}
              />
            </Field>
          </div>

          {/* Markdown Preview */}
          <aside className="xl:sticky xl:top-6 min-w-0">
            <div className="border border-border rounded-md bg-zinc-950 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[hsl(var(--surface))]">
                <div>
                  <h2 className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                    Markdown Preview
                  </h2>
                  <p className="text-[11px] font-mono text-zinc-600 mt-0.5">
                    {/* Desktop: side preview · Mobile: stacked below form */}
                  </p>
                </div>
              </div>

              <div className="p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                <ProblemMarkdownPreview
                  description={form.description}
                  examples={form.examples}
                  constraints={form.constraints}
                  sourceName={form.sourceName}
                  sourceUrl={form.sourceUrl}
                />
              </div>
            </div>
          </aside>
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
              className="p-4 bg-[hsl(var(--surface))] border border-border rounded-md space-y-3"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              className="p-4 bg-[hsl(var(--surface))] border border-border rounded-md space-y-3"
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
                    className="w-16 px-2 py-1 bg-[hsl(var(--surface-raised))] border border-zinc-700 rounded text-xs font-mono text-zinc-300 text-center"
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
  "w-full px-3 py-2 bg-[hsl(var(--surface-raised))] border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50 transition-colors";

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

const adminPreviewComponents = {
  img: (props: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) => {
    const { src, alt, ...rest } = props;

    if (typeof src !== "string") return null;

    return (
      <img
        src={src}
        alt={alt || "Problem illustration"}
        className="max-w-full h-auto rounded-md border border-zinc-800 my-4"
        loading="lazy"
        {...rest}
      />
    );
  },
};

function ProblemMarkdownPreview({
  description,
  examples,
  constraints,
  sourceName,
  sourceUrl,
}: {
  description: string;
  examples: ProblemExample[];
  constraints: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
}) {
  return (
    <article
      className="prose prose-invert prose-sm max-w-none font-mono
        prose-headings:font-heading prose-headings:tracking-tight
        prose-p:text-zinc-300 prose-li:text-zinc-300
        prose-code:bg-[hsl(var(--surface-raised))] prose-code:text-lime-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-[hsl(var(--surface))] prose-pre:border prose-pre:border-border prose-pre:text-zinc-200
        prose-strong:text-zinc-100
        prose-a:text-lime-400
        prose-table:border prose-table:border-border
        prose-th:border prose-th:border-border prose-th:bg-[hsl(var(--surface))] prose-th:px-3 prose-th:py-2
        prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2"
    >
      {description ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={adminPreviewComponents}>
          {description}
        </ReactMarkdown>
      ) : (
        <p className="text-zinc-600">
          Problem description preview will appear here.
        </p>
      )}

      {sourceName && (
        <div className="not-prose text-xs text-zinc-500 flex items-center gap-1.5 mt-2 border-t border-zinc-800 pt-2">
          <i className="ri-links-line text-zinc-600" />
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 underline underline-offset-2 transition-colors"
            >
              {sourceName}
            </a>
          ) : (
            <span>{sourceName}</span>
          )}
        </div>
      )}

      {examples.length > 0 && (
        <>
          <h2>Examples</h2>

          {examples.map((example, index) => (
            <section key={index}>
              <h3>Example {index + 1}</h3>

              <p>
                <strong>Input:</strong>
              </p>
              {example.input ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]} components={adminPreviewComponents}>
                  {example.input}
                </ReactMarkdown>
              ) : (
                <p className="text-zinc-600">No input yet.</p>
              )}

              <p>
                <strong>Output:</strong>
              </p>
              {example.output ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]} components={adminPreviewComponents}>
                  {example.output}
                </ReactMarkdown>
              ) : (
                <p className="text-zinc-600">No output yet.</p>
              )}

              {example.explanation && (
                <>
                  <p>
                    <strong>Explanation:</strong>
                  </p>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]} components={adminPreviewComponents}>
                    {example.explanation}
                  </ReactMarkdown>
                </>
              )}
            </section>
          ))}
        </>
      )}

      {constraints && (
        <>
          <h2>Constraints</h2>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]} components={adminPreviewComponents}>
            {constraints}
          </ReactMarkdown>
        </>
      )}
    </article>
  );
}