"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Section = {
  icon: string;
  title: string;
  color: string;
  items: { label: string; desc: string }[];
};

const SECTIONS: Section[] = [
  {
    icon: "ri-calendar-check-line",
    title: "Daily Problems",
    color: "text-lime-400",
    items: [
      {
        label: "One problem per day",
        desc: "A new DSA problem is scheduled every day. Solve it before midnight to keep your streak.",
      },
      {
        label: "Preferred difficulty",
        desc: "Set your preferred difficulty in Settings. We pick the closest available if your level isn't scheduled.",
      },
      {
        label: "Already solved?",
        desc: "Once you solve today's problem, you'll see the Make-Up Tasks section.",
      },
    ],
  },
  {
    icon: "ri-fire-line",
    title: "Streaks",
    color: "text-orange-400",
    items: [
      {
        label: "Keep it alive",
        desc: "Solve at least one problem per day to maintain your streak. Miss a day and it resets to 0.",
      },
      {
        label: "Streak counter",
        desc: "Shown in the top-right corner. Your longest streak is tracked on your Profile page.",
      },
    ],
  },
  {
    icon: "ri-star-fill",
    title: "Stars",
    color: "text-yellow-400",
    items: [
      {
        label: "Earning stars",
        desc: "Normal mode: +3 clean solve, +1 with hints. Hard mode: +8 clean, +3 with hints.",
      },
      {
        label: "Spending stars",
        desc: "Unlock hints (1–15 ⭐) and pay for Make-Up Tasks (5–25 ⭐ depending on how far back).",
      },
      {
        label: "Bonus stars",
        desc: "On days with no scheduled problem, you'll receive bonus stars as compensation.",
      },
    ],
  },
  {
    icon: "ri-lightbulb-line",
    title: "Hints",
    color: "text-yellow-300",
    items: [
      {
        label: "Tier 1 — 1 ⭐",
        desc: "A nudge toward the right data structure.",
      },
      { label: "Tier 2 — 3 ⭐", desc: "The name of the algorithm or pattern." },
      { label: "Tier 3 — 7 ⭐", desc: "Step-by-step pseudocode." },
      {
        label: "Tier 4 — 15 ⭐",
        desc: "Full working solution. Streak stays alive, but no clean solve badge.",
      },
    ],
  },
  {
    icon: "ri-sword-line",
    title: "Challenge Modes",
    color: "text-orange-400",
    items: [
      {
        label: "Normal mode",
        desc: "Paste is allowed. No timer. Fewer stars rewarded.",
      },
      {
        label: "Hard mode",
        desc: "Paste disabled. Timer counts down (Easy 15min, Medium 30min, Hard 45min). Higher rewards, but −2⭐ if time expires.",
      },
      {
        label: "Mode lock",
        desc: "Mode is locked once you start typing. Change it in Settings before beginning.",
      },
    ],
  },
  {
    icon: "ri-history-line",
    title: "Make-Up Tasks",
    color: "text-blue-400",
    items: [
      {
        label: "Catch up on missed days",
        desc: "After solving today's problem, you can attempt problems from previous days you missed.",
      },
      {
        label: "Star cost",
        desc: "Make-ups cost stars: 5⭐ yesterday, up to 25⭐ for older days.",
      },
      {
        label: "One reward per day",
        desc: "Only the first make-up solve today earns stars. Additional make-ups only cost stars, no reward.",
      },
    ],
  },
  {
    icon: "ri-code-s-slash-line",
    title: "Code Editor",
    color: "text-lime-400",
    items: [
      {
        label: "Write from scratch",
        desc: "In Hard mode, paste is disabled — you must type your solution character by character.",
      },
      {
        label: "Run Code",
        desc: "Runs your code against hidden test cases. Results show expected vs your output on failure.",
      },
      {
        label: "Reset",
        desc: "Resets the editor back to the starter template. Requires confirmation.",
      },
    ],
  },
];

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    function handleHelpKey(e: KeyboardEvent) {
      if (e.key !== "?") return;

      const target = e.target as HTMLElement;

      // Block if typing in any input, textarea, or Monaco editor
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.closest(".monaco-editor") !== null ||
        target.closest('[role="textbox"]') !== null ||
        target.isContentEditable
      )
        return;

      setOpen((o) => !o);
    }

    window.addEventListener("keydown", handleHelpKey);
    return () => window.removeEventListener("keydown", handleHelpKey);
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border transition-colors",
          "border-zinc-700 bg-[hsl(var(--surface-raised))] text-zinc-500 cursor-pointer",
          "hover:border-lime-500/50 hover:text-lime-400 hover:bg-zinc-700",
        )}
        title="Help & Instructions"
      >
        <i className="ri-question-line" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-[hsl(var(--surface))] border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Top accent */}
            <div className="h-0.5 bg-lime-400 w-full shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-lime-400/10 border border-lime-500/30 flex items-center justify-center">
                  <i className="ri-question-line text-lime-400" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base tracking-tight">
                    How to use GrinDev
                  </h2>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">
                    Everything you need to know
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-[hsl(var(--surface-raised))] rounded transition-colors"
              >
                <i className="ri-close-line text-base" />
              </button>
            </div>

            {/* Body — sidebar + content */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Sidebar */}
              <div className="w-44 shrink-0 border-r border-border overflow-y-auto py-2">
                {SECTIONS.map((section, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSection(i)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors text-xs font-mono",
                      activeSection === i
                        ? "bg-[hsl(var(--surface-raised))] text-foreground"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-[hsl(var(--surface-raised))]/50",
                    )}
                  >
                    <i
                      className={cn(
                        section.icon,
                        "text-sm shrink-0",
                        activeSection === i ? section.color : "text-zinc-600",
                      )}
                    />
                    <span className="truncate">{section.title}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const section = SECTIONS[activeSection];
                  return (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2.5">
                        <i
                          className={cn(section.icon, section.color, "text-lg")}
                        />
                        <h3 className="font-heading font-bold text-base tracking-tight">
                          {section.title}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {section.items.map((item, i) => (
                          <div
                            key={i}
                            className="p-4 bg-[hsl(var(--surface-raised))]/60 border border-border rounded-md space-y-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  section.color.replace("text-", "bg-"),
                                )}
                              />
                              <span className="font-mono text-xs font-bold text-zinc-200">
                                {item.label}
                              </span>
                            </div>
                            <p className="font-mono text-xs text-zinc-400 leading-relaxed pl-3.5">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() =>
                            setActiveSection((i) => Math.max(0, i - 1))
                          }
                          disabled={activeSection === 0}
                          className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <i className="ri-arrow-left-line" /> Previous
                        </button>
                        <span className="text-xs font-mono text-zinc-600">
                          {activeSection + 1} / {SECTIONS.length}
                        </span>
                        <button
                          onClick={() =>
                            setActiveSection((i) =>
                              Math.min(SECTIONS.length - 1, i + 1),
                            )
                          }
                          disabled={activeSection === SECTIONS.length - 1}
                          className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Next <i className="ri-arrow-right-line" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <p className="text-xs font-mono text-zinc-600">
                Tip: keyboard shortcut{" "}
                <kbd className="px-1.5 py-0.5 bg-[hsl(var(--surface-raised))] border border-zinc-700 rounded text-zinc-400">
                  ?
                </kbd>{" "}
                opens this
              </p>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 bg-lime-400 text-zinc-950 font-mono text-xs font-bold rounded hover:bg-lime-300 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
