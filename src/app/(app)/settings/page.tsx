"use client";

import { useState, useEffect } from "react";
import type { ChallengeMode } from "@/lib/challenge";

type Settings = {
  challengeMode: ChallengeMode;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function handleSave(mode: ChallengeMode) {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeMode: mode }),
    });
    setSettings((s) => (s ? { ...s, challengeMode: mode } : s));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!settings) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">
          Configure your challenge experience.
        </p>
      </div>

      {/* Challenge Mode */}
      <div className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base">Challenge Mode</h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Mode is locked once you start a problem. Resets each day.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Normal */}
          <button
            onClick={() => handleSave("NORMAL")}
            className={`p-5 rounded-md border text-left transition-all space-y-3 ${
              settings.challengeMode === "NORMAL"
                ? "border-lime-500/50 bg-lime-500/5"
                : "border-border bg-zinc-900 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm">Normal</span>
              {settings.challengeMode === "NORMAL" && (
                <i className="ri-check-line text-lime-400" />
              )}
            </div>
            <ul className="space-y-1.5 font-mono text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <i className="ri-check-line text-green-400" /> Paste allowed
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-close-line text-zinc-600" /> No timer
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-star-line text-yellow-400" /> +3 stars clean
                solve
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-star-line text-yellow-400" /> +1 star hint
                solve
              </li>
            </ul>
          </button>

          {/* Hard */}
          <button
            onClick={() => handleSave("HARD")}
            className={`p-5 rounded-md border text-left transition-all space-y-3 ${
              settings.challengeMode === "HARD"
                ? "border-lime-500/50 bg-lime-500/5"
                : "border-border bg-zinc-900 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm">Hard</span>
              {settings.challengeMode === "HARD" && (
                <i className="ri-check-line text-lime-400" />
              )}
            </div>
            <ul className="space-y-1.5 font-mono text-xs text-zinc-400">
              <li className="flex items-center gap-2">
                <i className="ri-close-line text-red-400" /> No paste
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-time-line text-yellow-400" /> Timer active
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-star-fill text-yellow-400" /> +8 stars clean
                solve
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-star-fill text-yellow-400" /> +3 stars hint
                solve
              </li>
              <li className="flex items-center gap-2">
                <i className="ri-arrow-down-line text-red-400" /> −2 stars if
                time expires
              </li>
            </ul>
          </button>
        </div>

        {/* Time limits reference */}
        <div className="rounded-md border border-border bg-zinc-900/50 p-4 space-y-2">
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            Hard mode time limits
          </p>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { label: "Easy", time: "15:00", color: "text-green-400" },
              { label: "Medium", time: "30:00", color: "text-yellow-400" },
              { label: "Hard", time: "45:00", color: "text-red-400" },
            ].map((d) => (
              <div key={d.label} className="text-center">
                <div className={`font-heading font-bold text-lg ${d.color}`}>
                  {d.time}
                </div>
                <div className="font-mono text-xs text-zinc-500">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {saved && (
          <p className="text-xs font-mono text-lime-400 flex items-center gap-1.5">
            <i className="ri-check-line" /> Saved
          </p>
        )}
      </div>
    </div>
  );
}
