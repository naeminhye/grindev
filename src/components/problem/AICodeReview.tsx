"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface AICodeReviewProps {
  problemId: string;
  problemTitle: string;
  problemDescription: string;
  code: string;
  language: string;
  passed: boolean;
  stars: number;
  onStarsChange: (stars: number) => void;
  reviewCost?: number;
}

type ReviewState = "idle" | "confirm" | "loading" | "done" | "error";

export function AICodeReview({
  problemId,
  problemTitle,
  problemDescription,
  code,
  language,
  passed,
  stars,
  onStarsChange,
  reviewCost = 5,
}: AICodeReviewProps) {
  const { t } = useI18n();
  const [state, setReviewState] = useState<ReviewState>("idle");
  const [review, setReview] = useState("");
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canAfford = stars >= reviewCost;

  function handleClick() {
    setOpen(true);
    if (state === "done" && review) return;
    setReviewState("confirm");
  }

  async function handleConfirm() {
    if (!canAfford) {
      setErrorMsg(`You need ${reviewCost} stars to use AI code review.`);
      setReviewState("error");
      return;
    }

    setReviewState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          problemTitle,
          problemDescription,
          code,
          language,
          passed,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Failed to get code review.");
        setReviewState("error");
        return;
      }

      const data = await res.json();
      setReview(data.review);
      setReviewState("done");
      if (data.starsRemaining !== undefined) onStarsChange(data.starsRemaining);
    } catch {
      setErrorMsg("An error occurred. Please try again.");
      setReviewState("error");
    }
  }

  function handleRetry() {
    setReviewState("confirm");
    setReview("");
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono transition-colors",
          state === "done"
            ? "border-purple-500/30 bg-purple-500/5 text-purple-400"
            : canAfford
              ? "border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30"
              : "border-zinc-700 bg-zinc-900 text-zinc-500 cursor-not-allowed",
        )}
        title="AI Code Review"
      >
        <i
          className={cn(
            "shrink-0",
            state === "loading"
              ? "ri-loader-4-line animate-spin"
              : "ri-code-ai-line",
          )}
        />
        <span className="hidden sm:inline">Review</span>
        {state === "done" ? (
          <i className="ri-check-line text-purple-400" />
        ) : (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[10px]",
              canAfford ? "text-yellow-500" : "text-red-500",
            )}
          >
            <i className="ri-star-fill text-[10px]" />
            {reviewCost}
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
                <i className="ri-code-ai-line text-purple-400" />
                <h2 className="font-heading font-bold text-base">
                  AI Code Review
                </h2>
                <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">
                  Gemini 2.5
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Problem + code info */}
            <div className="px-5 py-2 border-b border-border bg-zinc-800/50 shrink-0 flex items-center gap-3">
              <p className="text-xs font-mono text-zinc-400 flex-1 truncate">
                <span className="text-zinc-600">Reviewing: </span>
                {problemTitle}
              </p>
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0",
                  passed
                    ? "bg-lime-500/10 text-lime-400 border-lime-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20",
                )}
              >
                {passed ? "✓ Passed" : "✗ Failed"}
              </span>
            </div>

            {/* Content */}
            <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
              {/* Confirm */}
              {state === "confirm" && (
                <div className="flex flex-col items-center gap-5 py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <i className="ri-code-ai-line text-purple-400 text-2xl" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-heading font-bold text-base text-foreground">
                      AI Code Review
                    </p>
                    <p className="text-xs font-mono text-zinc-400 max-w-xs">
                      Get feedback on correctness, complexity, code quality,
                      edge cases, and suggestions for improvement.
                    </p>
                  </div>

                  {/* Code preview */}
                  <div className="w-full text-left p-3 bg-zinc-800 rounded-md border border-zinc-700 max-h-32 overflow-y-auto">
                    <pre className="text-[10px] font-mono text-zinc-300 whitespace-pre-wrap">
                      {code.slice(0, 300)}
                      {code.length > 300 ? "..." : ""}
                    </pre>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 border border-zinc-700">
                    <i className="ri-star-fill text-yellow-400" />
                    <span className="font-mono text-sm font-bold text-yellow-400">
                      {reviewCost} stars
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      · each review costs stars
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
                          ? "bg-purple-500 text-white hover:bg-purple-400 active:scale-95"
                          : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700",
                      )}
                    >
                      <i className="ri-code-ai-line" />
                      Review for {reviewCost}{" "}
                      <i className="ri-star-fill text-yellow-400 text-xs" />
                    </button>
                  </div>
                </div>
              )}

              {state === "loading" && (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <i className="ri-loader-4-line animate-spin text-purple-400 text-2xl" />
                  <p className="font-mono text-sm text-zinc-300">
                    Reviewing your code...
                  </p>
                  <p className="font-mono text-xs text-zinc-600">
                    Checking correctness, complexity, and style...
                  </p>
                </div>
              )}

              {state === "error" && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <i className="ri-error-warning-line text-yellow-400 text-2xl" />
                  <p className="font-mono text-sm text-zinc-300">{errorMsg}</p>
                  {!errorMsg.includes("stars") && (
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-border rounded hover:border-zinc-600 text-zinc-400 transition-colors"
                    >
                      <i className="ri-refresh-line" /> Try again
                    </button>
                  )}
                </div>
              )}

              {state === "done" && review && (
                <article
                  className={cn(
                    "prose prose-invert prose-sm max-w-none",
                    "prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-foreground",
                    "prose-h2:text-sm prose-h2:font-bold prose-h2:mt-5 prose-h2:mb-2",
                    "prose-h2:border-b prose-h2:border-border prose-h2:pb-1 prose-h2:text-purple-400",
                    "prose-h3:text-xs prose-h3:font-bold prose-h3:mt-3 prose-h3:mb-1 prose-h3:text-zinc-200",
                    "prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-xs prose-p:font-sans",
                    "prose-li:text-zinc-300 prose-li:text-xs prose-li:font-sans prose-li:leading-relaxed",
                    "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
                    "prose-strong:text-zinc-100 prose-strong:font-bold",
                    "prose-code:bg-zinc-800 prose-code:text-purple-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono",
                    "prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:text-xs",
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {review}
                  </ReactMarkdown>
                </article>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <p className="text-[10px] font-mono text-zinc-600">
                Powered by Gemini 2.5 · Each review costs {reviewCost}{" "}
                <i className="ri-star-fill text-yellow-400" />
              </p>
              <div className="flex items-center gap-2">
                {state === "done" && (
                  <button
                    onClick={handleRetry}
                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Get new review"
                  >
                    <i className="ri-refresh-line text-sm" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-border text-xs font-mono text-zinc-300 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
