"use client";

import { useEffect, useState } from "react";
import DSATodayPage from "@/components/today/DSATodayPage";
import QuizTodayPage from "@/components/today/QuizTodayPage";

export default function TodayPage() {
  const [practiceMode, setPracticeMode] = useState<"DSA" | "QUIZ" | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => {
        if (!r.ok) return { practiceMode: "DSA" };
        return r
          .text()
          .then((text) => (text ? JSON.parse(text) : { practiceMode: "DSA" }));
      })
      .then((s) => setPracticeMode(s.practiceMode ?? "DSA"))
      .catch(() => setPracticeMode("DSA"));
  }, []);

  if (practiceMode === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  return practiceMode === "QUIZ" ? <QuizTodayPage /> : <DSATodayPage />;
}
