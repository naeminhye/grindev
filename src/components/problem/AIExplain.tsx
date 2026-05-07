"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { PublicProblem } from "@/types";

interface AIExplainProps {
  problem: PublicProblem;
}

type AIState = "idle" | "loading" | "done" | "error";

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a friendly DSA (Data Structures and Algorithms) tutor helping a developer understand a coding problem. 

Your explanation must:
- Start with a plain-English summary of what the problem is asking
- Identify the key insight or "aha moment" needed to solve it
- Name the relevant data structure or algorithm pattern (e.g. sliding window, hash map, two pointers)
- Walk through one example step by step to show how the pattern applies
- End with a brief note on time and space complexity of the optimal approach

Do NOT write any code. Do NOT give away the full solution. Keep the tone encouraging and clear.
Format your response in clear sections using markdown headings.`;
}

function buildUserPrompt(problem: PublicProblem): string {
  const examplesText = problem.examples
    .slice(0, 2)
    .map(
      (e, i) =>
        `Example ${i + 1}:\nInput: ${e.input}\nOutput: ${e.output}${e.explanation ? `\nExplanation: ${e.explanation}` : ""}`,
    )
    .join("\n\n");

  return `Please explain this coding problem to me:

**Problem:** ${problem.title}
**Difficulty:** ${problem.difficulty}
**Topics:** ${problem.topics.join(", ")}

**Description:**
${problem.description}

**Examples:**
${examplesText}

**Constraints:**
${problem.constraints}

Help me understand what this problem is asking and what approach I should think about, without giving me the actual solution code.`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AIExplain({ problem }: AIExplainProps) {
  const { t } = useI18n();
  const [state, setState] = useState<AIState>("idle");
  const [explanation, setExplanation] = useState("");
  const [open, setOpen] = useState(false);

  async function handleExplain() {
    setOpen(true);
    if (explanation) return; // already loaded, just re-open
    setState("loading");

    try {
      // ── Anthropic API call ────────────────────────────────────────────
      // This calls the Anthropic messages API via a Next.js route to keep
      // the API key server-side. The route at /api/ai/explain handles it.
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: buildSystemPrompt(),
          userPrompt: buildUserPrompt(problem),
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setExplanation(data.explanation);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      {/* Trigger button — sits in the hints section */}
      <button
        onClick={handleExplain}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs font-mono transition-colors",
          "border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30",
        )}
      >
        <i className="ri-sparkling-line text-sm" />
        <span className="flex-1 text-left">{t("ai.explain")}</span>
        <i className="ri-arrow-right-line text-zinc-600" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-zinc-900 border border-border rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <i className="ri-sparkling-line text-blue-400" />
                <h2 className="font-heading font-bold text-base tracking-tight">
                  {t("ai.title")}
                </h2>
                <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">
                  {t("ai.poweredBy", { model: "Claude" })}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
              {state === "loading" && (
                <div className="flex items-center gap-3 text-zinc-400 font-mono text-sm py-8 justify-center">
                  <i className="ri-loader-4-line animate-spin text-blue-400 text-lg" />
                  {t("ai.thinking")}
                </div>
              )}

              {state === "error" && (
                <div className="flex items-center gap-2 text-red-400 font-mono text-sm py-8 justify-center">
                  <i className="ri-error-warning-line" />
                  {t("ai.errorFallback")}
                </div>
              )}

              {state === "done" && explanation && (
                <div
                  className={cn(
                    "prose prose-invert prose-sm max-w-none font-mono",
                    "prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-foreground prose-headings:text-sm",
                    "prose-p:text-zinc-300 prose-li:text-zinc-300",
                    "prose-strong:text-zinc-100",
                    "prose-code:bg-zinc-800 prose-code:text-blue-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
                  )}
                >
                  {/* Render markdown — import ReactMarkdown if available */}
                  <div className="whitespace-pre-wrap text-zinc-300 text-xs leading-relaxed">
                    {explanation}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <p className="text-[10px] font-mono text-zinc-600">
                {t("ai.hintTiersAvailable")}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-border text-xs font-mono text-zinc-300 rounded transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
