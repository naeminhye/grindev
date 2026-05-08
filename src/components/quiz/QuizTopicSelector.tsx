"use client";

import { BUILT_IN_TOPICS } from "@/lib/quiz-topics";
export type { BuiltInTopicId } from '@/lib/quiz-topics'
import { cn } from "@/lib/utils";

export type QuizTopic = (typeof BUILT_IN_TOPICS)[number]["id"] | string;

export type TopicAvailability = {
  topic: QuizTopic;
  label: string;
  count: number; // number of unsolved quizzes in this topic
};

interface QuizTopicSelectorProps {
  value: QuizTopic | null;
  onChange: (topic: QuizTopic | null) => void;
  variant?: "compact" | "full";
  /** Pass availability data to disable/show empty topics */
  availability?: TopicAvailability[];
}

export function QuizTopicSelector({
  value,
  onChange,
  variant = "compact",
  availability,
}: QuizTopicSelectorProps) {
  // Build topic list — built-in topics + any custom ones from availability
  const builtInIds = new Set<string>(BUILT_IN_TOPICS.map((t) => t.id));
  
  // Custom topics that don't have a built-in entry
  const customTopics: { id: string; label: string; count: number }[] =
    availability
      ?.filter((a) => !builtInIds.has(a.topic))
      .map((a) => ({ id: a.topic, label: a.label, count: a.count })) ?? [];

  function getAvailability(topicId: string | null) {
    if (!availability) return { available: true, count: null };
    if (topicId === null) {
      const total = availability.reduce((sum, a) => sum + a.count, 0);
      return { available: total > 0, count: total };
    }
    const a = availability.find((a) => a.topic === topicId);
    return { available: (a?.count ?? 0) > 0, count: a?.count ?? 0 };
  }

  const anyAvail = getAvailability(null);

  if (variant === "compact") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Any topic */}
        <TopicButton
          id={null}
          label="Any topic"
          icon="ri-shuffle-line"
          iconColor="text-lime-400"
          isSelected={value === null}
          available={anyAvail.available}
          count={anyAvail.count}
          onClick={() => onChange(null)}
          variant="compact"
        />

        {/* Built-in topics */}
        {BUILT_IN_TOPICS.map((topic) => {
          const avail = getAvailability(topic.id);
          return (
            <TopicButton
              key={topic.id}
              id={topic.id}
              label={topic.label}
              icon={topic.icon}
              iconColor={topic.color}
              isSelected={value === topic.id}
              available={avail.available}
              count={avail.count}
              onClick={() => avail.available && onChange(topic.id)}
              variant="compact"
            />
          );
        })}

        {/* Custom topics */}
        {customTopics.map((topic) => {
          const avail = getAvailability(topic.id);
          return (
            <TopicButton
              key={topic.id}
              id={topic.id}
              label={topic.label}
              icon="ri-bookmark-line"
              iconColor="text-zinc-400"
              isSelected={value === topic.id}
              available={avail.available}
              count={avail.count}
              onClick={() => avail.available && onChange(topic.id)}
              variant="compact"
            />
          );
        })}
      </div>
    );
  }

  // Full variant
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <TopicButton
        id={null}
        label="Any Topic"
        icon="ri-shuffle-line"
        iconColor="text-lime-400"
        isSelected={value === null}
        available={anyAvail.available}
        count={anyAvail.count}
        onClick={() => onChange(null)}
        variant="full"
      />
      {BUILT_IN_TOPICS.map((topic) => {
        const avail = getAvailability(topic.id);
        return (
          <TopicButton
            key={topic.id}
            id={topic.id}
            label={topic.label}
            icon={topic.icon}
            iconColor={topic.color}
            isSelected={value === topic.id}
            available={avail.available}
            count={avail.count}
            onClick={() => avail.available && onChange(topic.id)}
            variant="full"
          />
        );
      })}
      {customTopics.map((topic) => {
        const avail = getAvailability(topic.id);
        return (
          <TopicButton
            key={topic.id}
            id={topic.id}
            label={topic.label}
            icon="ri-bookmark-line"
            iconColor="text-zinc-400"
            isSelected={value === topic.id}
            available={avail.available}
            count={avail.count}
            onClick={() => avail.available && onChange(topic.id)}
            variant="full"
          />
        );
      })}
    </div>
  );
}

function TopicButton({
  id,
  label,
  icon,
  iconColor,
  isSelected,
  available,
  count,
  onClick,
  variant,
}: {
  id: string | null;
  label: string;
  icon: string;
  iconColor: string;
  isSelected: boolean;
  available: boolean;
  count: number | null;
  onClick: () => void;
  variant: "compact" | "full";
}) {
  const isEmpty = count !== null && count === 0;

  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        disabled={isEmpty}
        title={isEmpty ? "No quizzes available for this topic" : undefined}
        className={cn(
          "flex items-center gap-2 p-3 rounded-md border text-left transition-all text-xs font-mono",
          isSelected && !isEmpty
            ? "border-lime-500/50 bg-lime-500/5"
            : isEmpty
              ? "border-border bg-zinc-900/30 opacity-40 cursor-not-allowed"
              : "border-border bg-zinc-900 hover:border-zinc-600",
        )}
      >
        <i
          className={cn(
            icon,
            isEmpty ? "text-zinc-600" : iconColor,
            "shrink-0",
          )}
        />
        <span
          className={cn(
            "flex-1",
            isSelected && !isEmpty ? "text-foreground" : "text-zinc-400",
          )}
        >
          {label}
        </span>
        {isEmpty ? (
          <span className="text-[10px] text-zinc-600 shrink-0">0</span>
        ) : isSelected ? (
          <i className="ri-check-line text-lime-400 shrink-0" />
        ) : count !== null ? (
          <span className="text-[10px] text-zinc-600 shrink-0">{count}</span>
        ) : null}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isEmpty}
      title={isEmpty ? "No quizzes available for this topic" : undefined}
      className={cn(
        "flex flex-col items-center gap-2 p-5 rounded-lg border text-center transition-all relative",
        isSelected && !isEmpty
          ? "border-lime-500/50 bg-lime-500/5"
          : isEmpty
            ? "border-border bg-zinc-900/30 opacity-40 cursor-not-allowed"
            : "border-border bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800",
      )}
    >
      <i
        className={cn(icon, isEmpty ? "text-zinc-600" : iconColor, "text-2xl")}
      />
      <span className="text-xs font-mono text-zinc-300">{label}</span>
      {isEmpty && (
        <span className="text-[10px] font-mono text-zinc-600">No quizzes</span>
      )}
      {isSelected && !isEmpty && (
        <i className="ri-check-line text-lime-400 text-xs" />
      )}
      {!isEmpty && count !== null && !isSelected && (
        <span className="text-[10px] font-mono text-zinc-600">
          {count} available
        </span>
      )}
    </button>
  );
}
