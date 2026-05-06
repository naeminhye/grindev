"use client";

import { useEffect, useState } from "react";
import { StarCount } from "@/components/ui/StarCount";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { STREAK_FREEZE_COST, PROBLEM_SKIP_COST } from "@/lib/stars";

type Transaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

type UserStats = {
  stars: number;
  streakFreezeCount: number;
  currentStreak: number;
};

const REASON_LABELS: Record<string, { label: string; icon: string }> = {
  SOLVE_CLEAN_NORMAL: {
    label: "Clean solve (Normal)",
    icon: "ri-shield-star-line",
  },
  SOLVE_CLEAN_HARD: {
    label: "Clean solve (Hard)",
    icon: "ri-shield-star-fill",
  },
  SOLVE_HINTS_NORMAL: { label: "Solve with hints", icon: "ri-lightbulb-line" },
  SOLVE_HINTS_HARD: {
    label: "Hard solve with hints",
    icon: "ri-lightbulb-fill",
  },
  HINT_PURCHASE: { label: "Hint unlocked", icon: "ri-eye-line" },
  MAKEUP_COST: { label: "Make-up attempt", icon: "ri-history-line" },
  MAKEUP_REWARD: { label: "Make-up reward", icon: "ri-history-line" },
  STREAK_FREEZE_PURCHASE: {
    label: "Streak freeze purchased",
    icon: "ri-shield-flash-line",
  },
  PROBLEM_SKIP: { label: "Problem skip", icon: "ri-skip-forward-line" },
  DAILY_LOGIN_BONUS: {
    label: "Daily login bonus",
    icon: "ri-calendar-check-line",
  },
  NO_PROBLEM_BONUS: { label: "No problem day bonus", icon: "ri-gift-line" },
  STREAK_MILESTONE: { label: "Streak milestone bonus", icon: "ri-trophy-line" },
  FIRST_SOLVE_BONUS: { label: "First solve bonus", icon: "ri-award-line" },
  ADMIN_ADJUSTMENT: { label: "Admin adjustment", icon: "ri-settings-line" },
};

export default function ShopPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<
    "STREAK_FREEZE" | "PROBLEM_SKIP" | null
  >(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/daily").then((r) => r.json()),
      fetch("/api/stars").then((r) => r.json()),
    ]).then(([daily, starsData]) => {
      setStats({
        stars: daily.userStats?.stars ?? 0,
        streakFreezeCount: daily.userStats?.streakFreezeCount ?? 0,
        currentStreak: daily.userStats?.currentStreak ?? 0,
      });
      setTransactions(starsData.transactions ?? []);
      setLoading(false);
    });
  }, []);

  async function handleBuy(item: "STREAK_FREEZE" | "PROBLEM_SKIP") {
    setBuying(item);
    setMessage(null);

    const res = await fetch("/api/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });

    const data = await res.json();
    setBuying(null);
    setConfirmItem(null);

    if (!res.ok) {
      setMessage({ text: data.error, ok: false });
      return;
    }

    setStats((s) =>
      s
        ? {
            ...s,
            stars: data.stars,
            streakFreezeCount:
              data.streakFreezeCount ??
              s.streakFreezeCount + (item === "STREAK_FREEZE" ? 1 : 0),
          }
        : s,
    );

    setMessage({
      text:
        item === "STREAK_FREEZE"
          ? `Streak freeze purchased! You now have ${data.streakFreezeCount} freeze${data.streakFreezeCount !== 1 ? "s" : ""}.`
          : "Problem skipped! Check Today for your new problem.",
      ok: true,
    });

    // Refresh transactions
    fetch("/api/stars")
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions ?? []));
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    );
  }

  const shopItems = [
    {
      id: "STREAK_FREEZE" as const,
      icon: "ri-shield-flash-line",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      title: "Streak Freeze",
      desc: "Protect your streak for one missed day. Your streak stays intact even if you skip a day.",
      cost: STREAK_FREEZE_COST,
      stock: stats
        ? `You have ${stats.streakFreezeCount} freeze${stats.streakFreezeCount !== 1 ? "s" : ""}`
        : "",
      canBuy: (stats?.stars ?? 0) >= STREAK_FREEZE_COST,
    },
    {
      id: "PROBLEM_SKIP" as const,
      icon: "ri-skip-forward-line",
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      title: "Problem Skip",
      desc: "Not feeling today's problem? Skip it and get a random problem from the full problem bank instead.",
      cost: PROBLEM_SKIP_COST,
      stock: "One-time use",
      canBuy: (stats?.stars ?? 0) >= PROBLEM_SKIP_COST,
    },
  ];

  const confirmConfig =
    confirmItem === "STREAK_FREEZE"
      ? {
          title: "Buy Streak Freeze",
          message: `Spend ${STREAK_FREEZE_COST}⭐ for a streak freeze? It will activate automatically the next time you miss a day.`,
        }
      : {
          title: "Skip Today's Problem",
          message: `Spend ${PROBLEM_SKIP_COST}⭐ to get a random problem instead of today\'s scheduled one?`,
        };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8 w-full">
      {confirmItem && (
        <ConfirmDialog
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={buying ? "Buying..." : "Confirm"}
          variant="warning"
          onConfirm={() => handleBuy(confirmItem)}
          onCancel={() => !buying && setConfirmItem(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
            Star Shop
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Spend stars on power-ups.
          </p>
        </div>
        {stats && <StarCount stars={stats.stars} />}
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-md border text-xs font-mono",
            message.ok
              ? "bg-lime-500/10 border-lime-500/20 text-lime-400"
              : "bg-red-500/10 border-red-500/20 text-red-400",
          )}
        >
          <i
            className={message.ok ? "ri-check-line" : "ri-error-warning-line"}
          />
          {message.text}
        </div>
      )}

      {/* Shop items */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Available
        </h2>
        {shopItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-5 bg-[hsl(var(--surface))] border border-border rounded-md hover:border-zinc-600 transition-colors"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-md flex items-center justify-center shrink-0 border",
                item.bg,
              )}
            >
              <i className={cn(item.icon, item.color, "text-2xl")} />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm">
                  {item.title}
                </span>
                <span className="text-xs font-mono text-zinc-600">
                  {item.stock}
                </span>
              </div>
              <p className="font-mono text-xs text-zinc-500 leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="flex items-center gap-1 font-mono text-sm text-yellow-400 font-bold">
                <i className="ri-star-fill text-xs" /> {item.cost}
              </span>
              <button
                onClick={() => setConfirmItem(item.id)}
                disabled={!item.canBuy || buying !== null}
                className={cn(
                  "px-4 py-1.5 rounded text-xs font-mono font-bold transition-all",
                  item.canBuy
                    ? "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95"
                    : "bg-[hsl(var(--surface-raised))] text-zinc-600 border border-zinc-700 cursor-not-allowed",
                )}
              >
                {!item.canBuy ? "Need more ⭐" : "Buy"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon */}
      <div className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Coming soon
        </h2>
        <div className="p-5 bg-[hsl(var(--surface))]/50 border border-dashed border-zinc-800 rounded-md text-center space-y-2">
          <i className="ri-store-2-line text-2xl text-zinc-700" />
          <p className="font-mono text-xs text-zinc-600">
            More ways to earn and spend stars are coming — including star packs,
            subscriptions, and exclusive features.
          </p>
        </div>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Recent transactions
          </h2>
          <div className="space-y-1.5">
            {transactions.slice(0, 20).map((tx) => {
              const meta = REASON_LABELS[tx.reason] ?? {
                label: tx.reason,
                icon: "ri-exchange-line",
              };
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 bg-[hsl(var(--surface))] border border-border rounded-md"
                >
                  <i
                    className={cn(
                      meta.icon,
                      "text-sm shrink-0",
                      tx.amount >= 0 ? "text-lime-400" : "text-zinc-500",
                    )}
                  />
                  <span className="font-mono text-xs text-zinc-400 flex-1 truncate">
                    {meta.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm font-bold shrink-0",
                      tx.amount > 0
                        ? "text-lime-400"
                        : tx.amount < 0
                          ? "text-red-400"
                          : "text-zinc-600",
                    )}
                  >
                    {tx.amount > 0
                      ? `+${tx.amount}`
                      : tx.amount === 0
                        ? "—"
                        : tx.amount}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-700 shrink-0">
                    {formatDate(tx.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
