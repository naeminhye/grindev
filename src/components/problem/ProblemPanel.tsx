"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { HINT_TIERS } from "@/lib/hints";
import { ProblemMarkdownSection } from "@/components/problem/ProblemMarkdownSection";
import type { PublicProblem, ProblemExample } from "@/types";
import { AIExplain } from "@/components/problem/AIExplain";

interface ProblemPanelProps {
  problem: PublicProblem;
  mobileTab: "problem" | "code";
  stars: number;
  hintsUnlocked: number[];
  hintContents: Record<number, string>;
  hintLoading: number | null;
  onBuyHint: (tier: number) => void;
}

export function ProblemPanel({
  problem,
  mobileTab,
  stars,
  hintsUnlocked,
  hintContents,
  hintLoading,
  onBuyHint,
}: ProblemPanelProps) {
  const { t } = useI18n();
  const examples = (problem.examples ?? []) as ProblemExample[];

  return (
    <aside
      className={cn(
        "min-h-0 overflow-y-auto custom-scrollbar border-border",
        "md:border-r",
        mobileTab === "problem" ? "block" : "hidden md:block",
      )}
    >
      <div className="p-4 md:p-6 space-y-8">
        {/* Topics */}
        {problem.topics.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {problem.topics.map((topic) => (
              <span
                key={topic}
                className="text-xs font-mono text-zinc-500 uppercase tracking-wide px-2 py-0.5 rounded border border-border bg-[hsl(var(--surface))]"
              >
                {topic.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
        <ProblemMarkdownSection>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.description}
          </ReactMarkdown>
        </ProblemMarkdownSection>

        {examples.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-book-3-line text-yellow-400" />
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                {t("problem.examples")}
              </h2>
            </div>
            {examples.map((example, index) => (
              <div
                key={index}
                className="rounded-md border border-border bg-[hsl(var(--surface))]/50 overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-border bg-[hsl(var(--surface))]">
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    Example {index + 1}
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                      {t("problem.input")}
                    </p>
                    <ProblemMarkdownSection compact>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {example.input}
                      </ReactMarkdown>
                    </ProblemMarkdownSection>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                      {t("problem.output")}
                    </p>
                    <ProblemMarkdownSection compact>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {example.output}
                      </ReactMarkdown>
                    </ProblemMarkdownSection>
                  </div>
                  {example.explanation && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                        {t("problem.explanation")}
                      </p>
                      <ProblemMarkdownSection compact>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {example.explanation}
                        </ReactMarkdown>
                      </ProblemMarkdownSection>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {problem.constraints && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-links-line text-yellow-400" />
              <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                {t("problem.constraints")}
              </h2>
            </div>
            <ProblemMarkdownSection>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problem.constraints}
              </ReactMarkdown>
            </ProblemMarkdownSection>
          </section>
        )}
      </div>

      {/* Hints */}
      <div className="border-t border-border p-4 md:p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <i className="ri-lightbulb-line text-yellow-400" />
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            {t("problem.hints")}
          </span>
          <span className="text-xs text-zinc-600 ml-auto">
            {t("problem.costsStars")}
          </span>
        </div>

        {HINT_TIERS.map((tier) => {
          const isUnlocked = hintsUnlocked.includes(tier.tier);
          const content = hintContents[tier.tier];
          const isLoading = hintLoading === tier.tier;

          // Use translated hint tier labels
          const tierLabels: Record<number, string> = {
            1: t("hints.tier1"),
            2: t("hints.tier2"),
            3: t("hints.tier3"),
            4: t("hints.tier4"),
          };

          return (
            <div
              key={tier.tier}
              className={cn(
                "rounded-md border transition-colors",
                isUnlocked
                  ? "border-lime-500/20 bg-lime-500/5"
                  : "border-border bg-[hsl(var(--surface))]/50",
              )}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <i
                    className={cn(
                      tier.icon,
                      "text-sm",
                      isUnlocked ? "text-lime-400" : "text-zinc-500",
                    )}
                  />
                  <span className="font-mono text-xs font-medium">
                    {tierLabels[tier.tier] ?? tier.label}
                  </span>
                </div>
                {isUnlocked ? (
                  <span className="text-xs text-lime-400 font-mono flex items-center gap-1">
                    <i className="ri-check-line" /> {t("problem.unlocked")}
                  </span>
                ) : (
                  <button
                    onClick={() => onBuyHint(tier.tier)}
                    disabled={isLoading || stars < tier.cost}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors",
                      stars >= tier.cost
                        ? "bg-[hsl(var(--surface-raised))] hover:bg-zinc-700 text-yellow-400 border border-zinc-700"
                        : "bg-[hsl(var(--surface))] text-zinc-600 border border-zinc-800 cursor-not-allowed",
                    )}
                  >
                    {isLoading ? (
                      <i className="ri-loader-4-line animate-spin" />
                    ) : (
                      <>
                        <i className="ri-star-fill" /> {tier.cost}
                      </>
                    )}
                  </button>
                )}
              </div>
              {isUnlocked && content && (
                <div className="px-3 pb-3">
                  <div className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap border-t border-lime-500/10 pt-3">
                    {content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div className="border-t border-border my-3" />
        <AIExplain problem={problem} />
      </div>
    </aside>
  );
}
