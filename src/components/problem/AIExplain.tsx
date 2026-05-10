"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { PublicProblem } from "@/types";

interface AIExplainProps {
  problem: PublicProblem;
  stars: number;
  onStarsChange: (stars: number) => void;
  explainCost?: number;
}

type AIState = "idle" | "confirm" | "loading" | "done" | "error";

const CACHE_PREFIX = "grindev_ai_explain_";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getCached(problemId: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + problemId);
    if (!raw) return null;
    const { explanation, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + problemId);
      return null;
    }
    return explanation;
  } catch {
    return null;
  }
}

function setCache(problemId: string, explanation: string) {
  try {
    localStorage.setItem(
      CACHE_PREFIX + problemId,
      JSON.stringify({ explanation, savedAt: Date.now() }),
    );
  } catch { }
}

function buildSystemPrompt(): string {
  return `You are a concise and witty DSA tutor.

  Rules:
  - Do NOT restate or summarize the problem — the user already read it
  - Do NOT mention the difficulty level
  - Be brief and direct — no padding or filler
  - Use a light, occasionally humorous tone but keep it tight
  - Format with ## markdown headings, bullet points, and **bold** for key terms
  - Use \`inline code\` for variable names or algorithm names
  - Use code blocks for pseudocode

  Your response must follow this exact structure:

  ## The Approach
  Name the pattern/technique and why it fits in 1-2 sentences. One analogy if it helps.

  Then provide pseudocode showing the core logic — keep it short and language-agnostic.
  Walk through one of the given examples step by step using the pseudocode to show how it produces the correct output.

  ## Watch Out For
  Edge cases or common mistakes only. Skip entirely if there are none worth mentioning.

  ## Similar Problems
  2-3 well-known problems using the same technique. Include a LeetCode or similar link where possible.
  - **Problem Name** — why it's similar ([link](url))

  ## Alternative Approaches
  1-2 alternatives with a one-line tradeoff each. Skip if no meaningful alternatives exist.`
}

function buildUserPrompt(problem: PublicProblem): string {
  return `Here is the problem I need help understanding:

  **Title:** ${problem.title}
  **Topics:** ${problem.topics.join(', ')}

  **Description:**
  ${problem.description}

  **Examples:**
  ${problem.examples.slice(0, 2).map((e, i) =>
    `Example ${i + 1}:\nInput: ${e.input}\nOutput: ${e.output}${e.explanation ? `\nExplanation: ${e.explanation}` : ''}`
  ).join('\n\n')}

  **Constraints:**
  ${problem.constraints}

  Please explain the solution approach — not the code itself. Focus on the thinking process, the pattern, and how to recognize this type of problem in the future.`
}

export function AIExplain({
  problem,
  stars,
  onStarsChange,
  explainCost = 5,
}: AIExplainProps) {
  const { t } = useI18n();
  const [state, setState] = useState<AIState>("idle");
  const [explanation, setExplanation] = useState("");
  const [open, setOpen] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const cached = getCached(problem.id);
    if (cached) {
      setExplanation(cached);
      setState("done");
      setFromCache(true);
    }
  }, [problem.id]);

  function handleClick() {
    setOpen(true);
    if (state === "done" && explanation) return; // already loaded

    const cached = getCached(problem.id);
    if (cached) {
      setExplanation(cached);
      setState("done");
      setFromCache(true);
      return;
    }

    // Show cost confirmation
    setState("confirm");
  }

  async function handleConfirm() {
    if (stars < explainCost) {
      setErrorMsg(`You need ${explainCost} stars to use AI explanation.`);
      setState("error");
      return;
    }
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: buildSystemPrompt(),
          userPrompt: buildUserPrompt(problem),
          problemId: problem.id,
          free: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? t("ai.errorFallback"));
        setState("error");
        return;
      }

      const data = await res.json();
      setExplanation(data.explanation);
      setState("done");
      setFromCache(false);
      setCache(problem.id, data.explanation);
      if (data.starsRemaining !== undefined) onStarsChange(data.starsRemaining);
    } catch {
      setErrorMsg(t("ai.errorFallback"));
      setState("error");
    }
  }

  async function handleRetry() {
    try {
      localStorage.removeItem(CACHE_PREFIX + problem.id);
    } catch { }
    setState("confirm");
    setExplanation("");
    setFromCache(false);
  }

  const canAfford = stars >= explainCost;

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs font-mono transition-colors cursor-pointer",
          state === "done"
            ? "border-blue-500/30 bg-blue-500/5 text-blue-400"
            : canAfford
              ? "border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30"
              : "border-zinc-700 bg-zinc-900 text-zinc-500 cursor-not-allowed",
        )}
      >
        <i
          className={cn(
            "text-sm shrink-0",
            state === "loading"
              ? "ri-loader-4-line animate-spin"
              : "ri-sparkling-line",
          )}
        />
        <span className="flex-1 text-left">{t("ai.explain")}</span>
        {state === "done" ? (
          <span className="text-[10px] text-blue-600">
            {fromCache ? "cached ✓" : "✓"}
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors min-w-[56px] justify-center",
              "bg-[hsl(var(--surface-raised))] border border-zinc-700",
              canAfford ? "text-yellow-500" : "text-red-500",
            )}
          >
            <i className="ri-star-fill text-[10px]" />
            {explainCost}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-zinc-900 border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <i className="ri-sparkling-line text-blue-400" />
                <h2 className="font-heading font-bold text-base">
                  {t("ai.title")}
                </h2>
                <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">
                  Gemini 2.5
                </span>
                {fromCache && (
                  <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <i className="ri-database-2-line" /> cached · free
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Problem title */}
            <div className="px-5 py-2 border-b border-border bg-zinc-800/50 shrink-0">
              <p className="text-xs font-mono text-zinc-400 truncate">
                <span className="text-zinc-600">Explaining: </span>
                {problem.title}
              </p>
            </div>

            {/* Content */}
            <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
              {/* Confirm cost */}
              {state === "confirm" && (
                <div className="flex flex-col items-center gap-5 py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <i className="ri-sparkling-line text-blue-400 text-2xl" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-heading font-bold text-base text-foreground">
                      AI Problem Explanation
                    </p>
                    <p className="text-xs font-mono text-zinc-400 max-w-xs">
                      Get a detailed explanation of this problem — key insight,
                      pattern, and worked example.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 border border-zinc-700">
                    <i className="ri-star-fill text-yellow-400" />
                    <span className="font-mono text-sm font-bold text-yellow-400">
                      {explainCost} stars
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      · once per problem (cached after)
                    </span>
                  </div>
                  {!canAfford && (
                    <p className="text-xs font-mono text-red-400 flex items-center gap-1">
                      <i className="ri-error-warning-line" /> Not enough stars —
                      you have {stars}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 border border-border text-xs font-mono text-zinc-400 hover:text-zinc-200 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={!canAfford}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded font-mono text-sm font-bold transition-all",
                        canAfford
                          ? "bg-blue-500 text-white hover:bg-blue-400 active:scale-95"
                          : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700",
                      )}
                    >
                      <i className="ri-sparkling-line" />
                      Explain for {explainCost}{" "}
                      <i className="ri-star-fill text-yellow-400 text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {state === "loading" && (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <i className="ri-loader-4-line animate-spin text-blue-400 text-2xl" />
                  <p className="font-mono text-sm text-zinc-300">
                    {t("ai.thinking")}
                  </p>
                </div>
              )}

              {state === "error" && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <i className="ri-error-warning-line text-yellow-400 text-2xl" />
                  <p className="font-mono text-sm text-zinc-300">{errorMsg}</p>
                  {errorMsg.includes("stars") ? (
                    <p className="text-xs font-mono text-zinc-600">
                      Visit the shop to earn more stars.
                    </p>
                  ) : (
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-border rounded hover:border-zinc-600 text-zinc-400 transition-colors"
                    >
                      <i className="ri-refresh-line" /> Try again
                    </button>
                  )}
                </div>
              )}

              {state === "done" && explanation && (
                <article
                  className={cn(
                    "prose prose-invert prose-sm max-w-none",
                    "prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-foreground",
                    "prose-h2:text-sm prose-h2:font-bold prose-h2:mt-5 prose-h2:mb-2",
                    "prose-h2:border-b prose-h2:border-border prose-h2:pb-1 prose-h2:text-lime-400",
                    "prose-h3:text-xs prose-h3:font-bold prose-h3:mt-3 prose-h3:mb-1 prose-h3:text-zinc-200",
                    "prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-xs prose-p:font-sans",
                    "prose-li:text-zinc-300 prose-li:text-xs prose-li:font-sans prose-li:leading-relaxed",
                    "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
                    "prose-strong:text-zinc-100 prose-strong:font-bold",
                    "prose-code:bg-zinc-800 prose-code:text-lime-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono",
                    "prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:text-xs",
                    "prose-blockquote:border-l-2 prose-blockquote:border-blue-500/50 prose-blockquote:text-zinc-400 prose-blockquote:italic",
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {explanation}
                  </ReactMarkdown>
                </article>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <p className="text-[10px] font-mono text-zinc-600">
                {t("ai.poweredBy")} · No solution revealed
              </p>
              <div className="flex items-center gap-2">
                {state === "done" && !fromCache && (
                  <button
                    onClick={handleRetry}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Regenerate (costs stars again)"
                  >
                    <i className="ri-refresh-line text-sm" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-border text-xs font-mono text-zinc-300 rounded transition-colors"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
