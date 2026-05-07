import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProblemMarkdownSectionProps {
  children: ReactNode;
  compact?: boolean;
}

export function ProblemMarkdownSection({
  children,
  compact = false,
}: ProblemMarkdownSectionProps) {
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none font-mono",
        "prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-100",
        "prose-code:bg-[hsl(var(--surface-raised))] prose-code:text-lime-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
        "prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border prose-pre:text-zinc-200",
        "prose-a:text-lime-400",
        "prose-table:border prose-table:border-border",
        "prose-th:border prose-th:border-border prose-th:bg-[hsl(var(--surface))] prose-th:px-3 prose-th:py-2",
        "prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2",
        compact && "prose-p:my-1 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2",
      )}
    >
      {children}
    </div>
  );
}
