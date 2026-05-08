"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type HelpSectionKey =
  | "dailyProblems"
  | "streaks"
  | "stars"
  | "hints"
  | "challengeModes"
  | "makeUpTasks"
  | "codeEditor";

type Section = {
  key: HelpSectionKey;
  icon: string;
  color: string;
  itemCount: number;
};

const SECTIONS: Section[] = [
  {
    key: "dailyProblems",
    icon: "ri-calendar-check-line",
    color: "text-lime-400",
    itemCount: 3,
  },
  {
    key: "streaks",
    icon: "ri-fire-line",
    color: "text-orange-400",
    itemCount: 2,
  },
  {
    key: "stars",
    icon: "ri-star-fill",
    color: "text-yellow-400",
    itemCount: 3,
  },
  {
    key: "hints",
    icon: "ri-lightbulb-line",
    color: "text-yellow-300",
    itemCount: 4,
  },
  {
    key: "challengeModes",
    icon: "ri-sword-line",
    color: "text-orange-400",
    itemCount: 3,
  },
  {
    key: "makeUpTasks",
    icon: "ri-history-line",
    color: "text-blue-400",
    itemCount: 3,
  },
  {
    key: "codeEditor",
    icon: "ri-code-s-slash-line",
    color: "text-lime-400",
    itemCount: 3,
  },
];

export function HelpButton() {
  const { t } = useI18n();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tFunc = (key: string) => (mounted ? t(key) : "");

  useEffect(() => {
    function handleHelpKey(e: KeyboardEvent) {
      if (e.key !== "?") return;

      const target = e.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.closest(".monaco-editor") !== null ||
        target.closest('[role="textbox"]') !== null ||
        target.isContentEditable
      ) {
        return;
      }

      setOpen((o) => !o);
    }

    window.addEventListener("keydown", handleHelpKey);
    return () => window.removeEventListener("keydown", handleHelpKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full border transition-colors",
          "border-zinc-700 bg-[hsl(var(--surface-raised))] text-zinc-500 cursor-pointer",
          "hover:border-lime-500/50 hover:text-lime-400 hover:bg-zinc-700",
        )}
        title={tFunc("help.buttonTitle")}
        aria-label={tFunc("help.buttonTitle")}
      >
        <i className="ri-question-line" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative bg-[hsl(var(--surface))] border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="h-0.5 bg-lime-400 w-full shrink-0" />

            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-lime-400/10 border border-lime-500/30 flex items-center justify-center">
                  <i className="ri-question-line text-lime-400" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-base tracking-tight">
                    {tFunc("help.title")}
                  </h2>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">
                    {tFunc("help.subtitle")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-[hsl(var(--surface-raised))] rounded transition-colors"
                title={tFunc("common.close")}
              >
                <i className="ri-close-line text-base" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
              <div className="w-44 shrink-0 border-r border-border overflow-y-auto py-2">
                {SECTIONS.map((section, i) => (
                  <button
                    key={section.key}
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
                    <span className="truncate">
                      {t(`help.sections.${section.key}.title`)}
                    </span>
                  </button>
                ))}
              </div>

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
                          {t(`help.sections.${section.key}.title`)}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {Array.from({ length: section.itemCount }).map(
                          (_, i) => (
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
                                  {t(
                                    `help.sections.${section.key}.items.${i}.label`,
                                  )}
                                </span>
                              </div>
                              <p className="font-mono text-xs text-zinc-400 leading-relaxed pl-3.5">
                                {t(
                                  `help.sections.${section.key}.items.${i}.desc`,
                                )}
                              </p>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() =>
                            setActiveSection((i) => Math.max(0, i - 1))
                          }
                          disabled={activeSection === 0}
                          className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <i className="ri-arrow-left-line" />
                          {tFunc("help.previous")}
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
                          {tFunc("help.next")}
                          <i className="ri-arrow-right-line" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <p className="text-xs font-mono text-zinc-600">
                {tFunc("help.tipPrefix")}{" "}
                <kbd className="px-1.5 py-0.5 bg-[hsl(var(--surface-raised))] border border-zinc-700 rounded text-zinc-400">
                  ?
                </kbd>{" "}
                {tFunc("help.tipSuffix")}
              </p>

              <button
                onClick={() => setOpen(false)}
                className="px-4 py-1.5 bg-lime-400 text-zinc-950 font-mono text-xs font-bold rounded hover:bg-lime-300 transition-colors"
              >
                {tFunc("help.gotIt")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
