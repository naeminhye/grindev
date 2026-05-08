"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import type { PublicQuiz, QuizAnswer } from "@/types";

interface QuizPanelProps {
  quiz: PublicQuiz;
  isSolved: boolean;
  onSubmit: (answers: QuizAnswer[]) => void;
  isSubmitting: boolean;
}

const TOPIC_LABELS: Record<string, string> = {
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  PYTHON: "Python",
  CSS: "CSS",
  HTML: "HTML",
  REACT: "React",
  NODE: "Node.js",
  DATABASES: "Databases",
  SYSTEM_DESIGN: "System Design",
  GENERAL_CS: "General CS",
};

export function QuizPanel({
  quiz,
  isSolved,
  onSubmit,
  isSubmitting,
}: QuizPanelProps) {
  const { t } = useI18n();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const total = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;
  const q = quiz.questions[currentQuestion];

  function selectAnswer(questionIndex: number, selectedIndex: number) {
    if (isSolved) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedIndex }));
  }

  function handleSubmit() {
    if (!allAnswered || isSubmitting) return;
    const answerArray: QuizAnswer[] = Object.entries(answers).map(
      ([qi, si]) => ({
        questionIndex: parseInt(qi),
        selectedIndex: si,
      }),
    );
    onSubmit(answerArray);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Quiz header */}
      <div className="px-4 md:px-6 py-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono px-2 py-0.5 rounded border border-border bg-zinc-900 text-zinc-400">
            {TOPIC_LABELS[quiz.topic] ?? quiz.topic}
          </span>
          <DifficultyBadge difficulty={quiz.difficulty} />
          <span className="text-xs font-mono text-zinc-500 ml-auto">
            {answeredCount}/{total} answered
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-lime-400 rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>

        {/* Question nav pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQuestion(i)}
              className={cn(
                "w-7 h-7 rounded text-xs font-mono font-bold transition-colors",
                currentQuestion === i
                  ? "bg-lime-400 text-zinc-950"
                  : answers[i] !== undefined
                    ? "bg-lime-400/20 text-lime-400 border border-lime-500/30"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-500",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-xs font-mono text-zinc-500 shrink-0 mt-1">
              Q{currentQuestion + 1}.
            </span>
            <p className="font-mono text-sm text-foreground leading-relaxed">
              {q.question}
            </p>
          </div>

          {/* Code block */}
          {q.code && (
            <pre className="p-4 bg-zinc-950 border border-border rounded-md text-xs font-mono text-zinc-200 overflow-x-auto">
              {q.code}
            </pre>
          )}

          {/* Options */}
          <div className="space-y-2">
            {q.options.map((option, oi) => {
              const isSelected = answers[currentQuestion] === oi;
              return (
                <button
                  key={oi}
                  onClick={() => selectAnswer(currentQuestion, oi)}
                  disabled={isSolved}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all text-sm font-mono",
                    isSelected
                      ? "border-lime-500/50 bg-lime-500/5 text-foreground"
                      : "border-border bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800",
                    isSolved && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded border text-xs flex items-center justify-center shrink-0 font-bold",
                      isSelected
                        ? "bg-lime-400 border-lime-400 text-zinc-950"
                        : "border-zinc-600 text-zinc-500",
                    )}
                  >
                    {String.fromCharCode(65 + oi)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation + submit */}
      <div className="border-t border-border p-3 md:p-4 bg-background shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
              disabled={currentQuestion === 0}
              className="h-9 px-3 rounded border border-border text-zinc-400 hover:text-foreground hover:border-zinc-500 text-xs font-mono disabled:opacity-30 transition-colors"
            >
              <i className="ri-arrow-left-line" />
            </button>
            <button
              onClick={() =>
                setCurrentQuestion((c) => Math.min(total - 1, c + 1))
              }
              disabled={currentQuestion === total - 1}
              className="h-9 px-3 rounded border border-border text-zinc-400 hover:text-foreground hover:border-zinc-500 text-xs font-mono disabled:opacity-30 transition-colors"
            >
              <i className="ri-arrow-right-line" />
            </button>
            <span className="text-xs font-mono text-zinc-600">
              {currentQuestion + 1} / {total}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting || isSolved}
            className={cn(
              "h-9 flex items-center gap-2 px-5 rounded font-mono text-sm font-bold transition-all",
              allAnswered && !isSolved
                ? "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700",
            )}
          >
            {isSubmitting ? (
              <>
                <i className="ri-loader-4-line animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <i className="ri-send-plane-fill" /> Submit Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
