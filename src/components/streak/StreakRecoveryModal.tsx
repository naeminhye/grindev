"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type RecoveryData = {
  streakStatus: "ACTIVE" | "AT_RISK" | "FROZEN" | "BROKEN";
  streakAtRiskDate: string | null;
  streakAtRiskSince: string | null;
  currentStreak: number;
  frozenStreakValue: number;
  stars: number;
  shieldInventory: number;
  shieldCost: number;
};

const DISMISS_KEY = "grindev_streak_modal_dismissed";

export function StreakRecoveryModal() {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA");
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed === today) {
      setDismissed(true);
      return;
    }

    fetch("/api/streak/recover")
      .then((r) => {
        if (!r.ok || r.status === 204) return null;
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        console.log("[StreakRecoveryModal] data:", d);
        setData(d);
      })
      .catch((err) => {
        console.error("[StreakRecoveryModal] fetch error:", err);
      });
  }, []);

  if (!data || dismissed) return null;
  if (data.streakStatus !== "AT_RISK") return null;

  async function performAction(
    action: "USE_SHIELD" | "BUY_AND_USE_SHIELD" | "DISMISS",
  ) {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/streak/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Failed.");
        setSubmitting(false);
        return;
      }

      if (action === "DISMISS") {
        sessionStorage.setItem(
          DISMISS_KEY,
          new Date().toLocaleDateString("en-CA"),
        );
        setDismissed(true);
      } else {
        // Shield applied — refetch to update state
        const fresh = await fetch("/api/streak/recover").then((r) => r.json());
        setData(fresh);
        // Refresh page so streak badge updates everywhere
        setTimeout(() => window.location.reload(), 600);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatMissedDate(date: string) {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  const hasShield = data.shieldInventory > 0;
  const canAffordShield = data.stars >= data.shieldCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative bg-zinc-900 border border-orange-500/30 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-gradient-to-b from-orange-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <i className="ri-fire-line text-orange-400 text-xl" />
            <h2 className="font-heading font-bold text-base">
              Your streak is at risk!
            </h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Big streak number */}
          <div className="text-center py-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <i className="ri-fire-line text-orange-400 text-3xl animate-pulse" />
              <span className="font-heading font-bold text-5xl text-orange-400">
                {data.currentStreak}
              </span>
              <span className="text-zinc-500 font-mono">days</span>
            </div>
            <p className="text-xs font-mono text-zinc-400">
              You missed{" "}
              <span className="text-orange-400 font-bold">
                {data.streakAtRiskDate
                  ? formatMissedDate(data.streakAtRiskDate)
                  : "yesterday"}
              </span>
            </p>
          </div>

          {/* Explanation */}
          <div className="text-xs font-mono text-zinc-400 leading-relaxed space-y-2 bg-zinc-800/50 p-3 rounded-md border border-zinc-700">
            <p>You have a few options to save your streak:</p>
            <ul className="space-y-1 pl-4 list-disc text-zinc-500">
              <li>
                Use a <span className="text-blue-400">Streak Shield</span> to
                freeze your streak — you'll need to solve today's problem to
                thaw it.
              </li>
              <li>
                Or complete a <span className="text-purple-400">make-up</span>{" "}
                for the missed day on the Today page.
              </li>
              <li>Dismiss this and let the streak break — your call.</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-md border border-red-500/20 bg-red-500/10 text-xs font-mono text-red-400">
              <i className="ri-error-warning-line shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Use existing shield */}
            {hasShield && (
              <button
                onClick={() => performAction("USE_SHIELD")}
                disabled={submitting}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <i className="ri-shield-flash-fill text-xl" />
                  <div className="text-left">
                    <p className="font-mono text-sm font-bold">
                      Use Streak Shield
                    </p>
                    <p className="text-[10px] text-blue-400/70">
                      You have {data.shieldInventory} available
                    </p>
                  </div>
                </div>
                <i className="ri-arrow-right-line" />
              </button>
            )}

            {/* Buy + use shield */}
            {!hasShield && (
              <button
                onClick={() => performAction("BUY_AND_USE_SHIELD")}
                disabled={submitting || !canAffordShield}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md border transition-colors",
                  canAffordShield
                    ? "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                    : "border-zinc-700 bg-zinc-800 text-zinc-600 cursor-not-allowed",
                  submitting && "opacity-50",
                )}
              >
                <div className="flex items-center gap-3">
                  <i className="ri-shield-flash-line text-xl" />
                  <div className="text-left">
                    <p className="font-mono text-sm font-bold">
                      {canAffordShield
                        ? "Buy & Apply Shield"
                        : "Buy & Apply Shield"}
                    </p>
                    <p className="text-[10px] opacity-70">
                      {canAffordShield
                        ? `${data.shieldCost}★ from your balance (${data.stars}★)`
                        : `Need ${data.shieldCost}★ — you have ${data.stars}★`}
                    </p>
                  </div>
                </div>
                <i
                  className={
                    canAffordShield ? "ri-arrow-right-line" : "ri-lock-line"
                  }
                />
              </button>
            )}

            {/* Dismiss */}
            <button
              onClick={() => performAction("DISMISS")}
              disabled={submitting}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-md border border-border bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <i className="ri-history-line text-lg" />
                <div className="text-left">
                  <p className="font-mono text-sm">I'll make it up instead</p>
                  <p className="text-[10px] text-zinc-600">
                    Complete a make-up on the Today page
                  </p>
                </div>
              </div>
              <i className="ri-arrow-right-line" />
            </button>
          </div>

          <p className="text-[10px] font-mono text-zinc-600 text-center">
            Note: Streak Shield protects only the missed day — you still need to
            solve today's problem.
          </p>
        </div>
      </div>
    </div>
  );
}
