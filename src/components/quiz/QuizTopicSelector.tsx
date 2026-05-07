"use client";

import { cn } from "@/lib/utils";

const TOPICS = [
  {
    id: "JAVASCRIPT",
    label: "JavaScript",
    icon: "ri-javascript-line",
    color: "text-yellow-400",
  },
  {
    id: "TYPESCRIPT",
    label: "TypeScript",
    icon: "ri-code-s-slash-line",
    color: "text-blue-400",
  },
  {
    id: "PYTHON",
    label: "Python",
    icon: "ri-code-line",
    color: "text-green-400",
  },
  { id: "CSS", label: "CSS", icon: "ri-css3-line", color: "text-blue-300" },
  {
    id: "HTML",
    label: "HTML",
    icon: "ri-html5-line",
    color: "text-orange-400",
  },
  {
    id: "REACT",
    label: "React",
    icon: "ri-reactjs-line",
    color: "text-cyan-400",
  },
  {
    id: "NODE",
    label: "Node.js",
    icon: "ri-server-line",
    color: "text-green-500",
  },
  {
    id: "DATABASES",
    label: "Databases",
    icon: "ri-database-2-line",
    color: "text-purple-400",
  },
  {
    id: "SYSTEM_DESIGN",
    label: "System Design",
    icon: "ri-flow-chart",
    color: "text-pink-400",
  },
  {
    id: "GENERAL_CS",
    label: "General CS",
    icon: "ri-cpu-line",
    color: "text-zinc-300",
  },
] as const;

export type QuizTopic = (typeof TOPICS)[number]["id"];

interface QuizTopicSelectorProps {
  value: QuizTopic | null;
  onChange: (topic: QuizTopic | null) => void;
  /** Show as compact grid (settings page) vs full cards (today page) */
  variant?: "compact" | "full";
}

export function QuizTopicSelector({
  value,
  onChange,
  variant = "compact",
}: QuizTopicSelectorProps) {
  if (variant === "compact") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Any topic option */}
        <button
          onClick={() => onChange(null)}
          className={cn(
            "flex items-center gap-2 p-3 rounded-md border text-left transition-all text-xs font-mono",
            value === null
              ? "border-lime-500/50 bg-lime-500/5 text-lime-400"
              : "border-border bg-zinc-900 text-zinc-400 hover:border-zinc-600",
          )}
        >
          <i className="ri-shuffle-line text-lime-400" />
          <span>Any topic</span>
          {value === null && (
            <i className="ri-check-line text-lime-400 ml-auto" />
          )}
        </button>

        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onChange(topic.id)}
            className={cn(
              "flex items-center gap-2 p-3 rounded-md border text-left transition-all text-xs font-mono",
              value === topic.id
                ? "border-lime-500/50 bg-lime-500/5"
                : "border-border bg-zinc-900 hover:border-zinc-600",
            )}
          >
            <i className={cn(topic.icon, topic.color, "shrink-0")} />
            <span
              className={cn(
                "flex-1",
                value === topic.id ? "text-foreground" : "text-zinc-400",
              )}
            >
              {topic.label}
            </span>
            {value === topic.id && (
              <i className="ri-check-line text-lime-400 shrink-0" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Full variant — larger cards for today page
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "flex flex-col items-center gap-2 p-5 rounded-lg border text-center transition-all",
          value === null
            ? "border-lime-500/50 bg-lime-500/5"
            : "border-border bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800",
        )}
      >
        <i className="ri-shuffle-line text-2xl text-lime-400" />
        <span className="text-xs font-mono text-zinc-300">Any Topic</span>
        {value === null && (
          <i className="ri-check-line text-lime-400 text-xs" />
        )}
      </button>

      {TOPICS.map((topic) => (
        <button
          key={topic.id}
          onClick={() => onChange(topic.id)}
          className={cn(
            "flex flex-col items-center gap-2 p-5 rounded-lg border text-center transition-all",
            value === topic.id
              ? "border-lime-500/50 bg-lime-500/5"
              : "border-border bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800",
          )}
        >
          <i className={cn(topic.icon, topic.color, "text-2xl")} />
          <span className="text-xs font-mono text-zinc-300">{topic.label}</span>
          {value === topic.id && (
            <i className="ri-check-line text-lime-400 text-xs" />
          )}
        </button>
      ))}
    </div>
  );
}
