"use client";

import { cn } from "@/lib/utils";

type MobileTab = "problem" | "code";

interface MobileTabsProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  problemLabel?: string;
  codeLabel?: string;
}

export function MobileTabs({
  activeTab,
  onTabChange,
  problemLabel = "Problem",
  codeLabel = "Code",
}: MobileTabsProps) {
  return (
    <div className="flex md:hidden border-b border-border shrink-0">
      {(["problem", "code"] as MobileTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "flex-1 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors",
            activeTab === tab
              ? "text-lime-400 border-b-2 border-lime-400"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {tab === "problem" ? (
            <>
              <i className="ri-file-text-line mr-1.5" />
              {problemLabel}
            </>
          ) : (
            <>
              <i className="ri-code-s-slash-line mr-1.5" />
              {codeLabel}
            </>
          )}
        </button>
      ))}
    </div>
  );
}
