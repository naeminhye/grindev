"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type ShopItem = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  cost: number;
  icon: string;
  iconBg: string;
  badgeKey?: string;
};

type Transaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

const SHOP_ITEMS: ShopItem[] = [
  // {
  //   id: 'streak-freeze',
  //   nameKey: 'shop.items.streakFreeze.title',
  //   descriptionKey: 'shop.items.streakFreeze.desc',
  //   cost: 20,
  //   icon: 'ri-shield-flash-line',
  //   iconBg: 'bg-blue-500/20 text-blue-400',
  //   badgeKey: 'shop.badges.mostPopular',
  // },
  {
    id: "streak-freeze",
    nameKey: "Streak Shield", // ← was "Streak Freeze"
    descriptionKey:
      "Shields your streak if you miss a day. Activates automatically the next time a missed day is detected. Must be in your inventory before the miss.",
    cost: 20,
    icon: "ri-shield-flash-line",
    iconBg: "bg-blue-500/20 text-blue-400",
    badgeKey: "Auto-activates", // ← was "Most popular"
  },
  {
    id: "problem-skip",
    nameKey: "shop.items.problemSkip.title",
    descriptionKey: "shop.items.problemSkip.desc",
    cost: 10,
    icon: "ri-skip-forward-fill",
    iconBg: "bg-purple-500/20 text-purple-400",
    badgeKey: "shop.badges.oneTimeUse",
  },
  {
    id: "hint-discount",
    nameKey: "shop.items.hintDiscount.title",
    descriptionKey: "shop.items.hintDiscount.desc",
    cost: 5,
    icon: "ri-lightbulb-flash-line",
    iconBg: "bg-yellow-500/20 text-yellow-400",
    badgeKey: "shop.badges.dayPass",
  },
  {
    id: "double-stars",
    nameKey: "shop.items.doubleStars.title",
    descriptionKey: "shop.items.doubleStars.desc",
    cost: 15,
    icon: "ri-star-smile-line",
    iconBg: "bg-lime-500/20 text-lime-400",
    badgeKey: "shop.badges.oneTimeUse",
  },
  {
    id: "extra-attempt",
    nameKey: "shop.items.secondChance.title",
    descriptionKey: "shop.items.secondChance.desc",
    cost: 8,
    icon: "ri-restart-line",
    iconBg: "bg-orange-500/20 text-orange-400",
    badgeKey: "shop.badges.oneTimeUse",
  },
];

const REASON_LABELS: Record<
  string,
  { labelKey: string; icon: string; color: string }
> = {
  SOLVE_CLEAN_NORMAL: {
    labelKey: "shop.transactions.reasons.solveCleanNormal",
    icon: "ri-shield-star-line",
    color: "text-lime-400",
  },
  SOLVE_CLEAN_HARD: {
    labelKey: "shop.transactions.reasons.solveCleanHard",
    icon: "ri-sword-line",
    color: "text-orange-400",
  },
  SOLVE_HINTS_NORMAL: {
    labelKey: "shop.transactions.reasons.solveHintsNormal",
    icon: "ri-lightbulb-line",
    color: "text-yellow-400",
  },
  SOLVE_HINTS_HARD: {
    labelKey: "shop.transactions.reasons.solveHintsHard",
    icon: "ri-lightbulb-line",
    color: "text-yellow-400",
  },
  HINT_PURCHASE: {
    labelKey: "shop.transactions.reasons.hintPurchase",
    icon: "ri-lightbulb-line",
    color: "text-zinc-400",
  },
  MAKEUP_COST: {
    labelKey: "shop.transactions.reasons.makeupCost",
    icon: "ri-history-line",
    color: "text-zinc-400",
  },
  MAKEUP_REWARD: {
    labelKey: "shop.transactions.reasons.makeupReward",
    icon: "ri-history-line",
    color: "text-lime-400",
  },
  PROBLEM_SKIP: {
    labelKey: "shop.transactions.reasons.problemSkip",
    icon: "ri-skip-forward-fill",
    color: "text-purple-400",
  },
  PROBLEM_SKIP_USED: {
    labelKey: "shop.transactions.reasons.problemSkipUsed",
    icon: "ri-skip-forward-line",
    color: "text-zinc-400",
  },
  DAILY_LOGIN_BONUS: {
    labelKey: "shop.transactions.reasons.dailyLoginBonus",
    icon: "ri-calendar-check-line",
    color: "text-lime-400",
  },
  NO_PROBLEM_BONUS: {
    labelKey: "shop.transactions.reasons.noProblemBonus",
    icon: "ri-calendar-close-line",
    color: "text-lime-400",
  },
  QUIZ_REWARD: {
    labelKey: "shop.transactions.reasons.quizReward",
    icon: "ri-questionnaire-line",
    color: "text-lime-400",
  },
  ADMIN_ADJUSTMENT: {
    labelKey: "shop.transactions.reasons.adminAdjustment",
    icon: "ri-admin-line",
    color: "text-zinc-400",
  },
  HINT_DISCOUNT_PURCHASE: {
    labelKey: "shop.transactions.reasons.hintDiscountPurchase",
    icon: "ri-lightbulb-flash-line",
    color: "text-yellow-400",
  },
  DOUBLE_STARS_PURCHASE: {
    labelKey: "shop.transactions.reasons.doubleStarsPurchase",
    icon: "ri-star-smile-line",
    color: "text-lime-400",
  },
  DOUBLE_STARS_USED: {
    labelKey: "Double Stars used",
    icon: "ri-star-smile-line",
    color: "text-lime-400",
  },
  EXTRA_ATTEMPT_PURCHASE: {
    labelKey: "shop.transactions.reasons.extraAttemptPurchase",
    icon: "ri-restart-line",
    color: "text-orange-400",
  },
  HINT_DISCOUNT_USED: {
    labelKey: "shop.transactions.reasons.hintDiscountUsed",
    icon: "ri-lightbulb-flash-line",
    color: "text-yellow-400",
  },
  AI_EXPLAIN: {
    labelKey: "shop.transactions.reasons.aiExplain",
    icon: "ri-sparkling-line",
    color: "text-blue-400",
  },
  AI_CODE_REVIEW: {
    labelKey: "shop.transactions.reasons.aiCodeReview",
    icon: "ri-code-ai-line",
    color: "text-purple-400",
  },
  REPORT_ACCEPTED: {
    labelKey: "shop.transactions.reasons.reportAccepted",
    icon: "ri-flag-line",
    color: "text-lime-400",
  },
  // TODO: add transs
  STAR_CODE_REDEMPTION: {
    labelKey: "Code redeemed",
    icon: "ri-coupon-line",
    color: "text-lime-400",
  },
  STREAK_FREEZE_PURCHASE: {
    // labelKey: "Streak Shield bought",
    labelKey: "shop.transactions.reasons.streakFreezePurchase",
    icon: "ri-shield-flash-line",
    color: "text-blue-400",
  },
  STREAK_FREEZE_USED: {
    labelKey: "Streak Shield applied",
    icon: "ri-shield-check-line",
    color: "text-cyan-400",
  },
};

type Tab = "SHOP" | "HISTORY";

export default function ShopPage() {
  const { t } = useI18n();
  const [stars, setStars] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ownedCounts, setOwnedCounts] = useState<Record<string, number>>({});
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [tab, setTab] = useState<Tab>("SHOP");

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((d) => {
        setStars(d.stars ?? 0);
        setTransactions(d.transactions ?? []);
        setOwnedCounts(d.owned ?? {});
      });
  }, []);

  async function handlePurchase(item: ShopItem) {
    if (stars < item.cost || purchasing) return;
    setPurchasing(item.id);
    setMessage(null);

    const res = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });

    const data = await res.json();
    if (res.ok) {
      setStars(data.stars);
      setOwnedCounts((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] ?? 0) + 1,
      }));
      setTransactions((prev) => [data.transaction, ...prev]);
      setMessage({
        text: `✓ ${t("shop.messages.itemPurchased", { item: t(item.nameKey) })}`,
        type: "success",
      });
    } else {
      setMessage({ text: `✗ ${data.error}`, type: "error" });
    }
    setPurchasing(null);
    setTimeout(() => setMessage(null), 3000);
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return t("shop.date.today");
    if (diff === 1) return t("shop.date.yesterday");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const earnedTotal = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const spentTotal = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-10 w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
            {t("shop.title")}
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            {t("shop.desc")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-yellow-500/20 bg-yellow-500/10">
          <i className="ri-star-fill text-yellow-400" />
          <span className="font-heading font-bold text-yellow-400">
            {t("shop.starsCount", { count: stars })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { id: "SHOP", label: t("shop.available"), icon: "ri-store-2-line" },
          {
            id: "HISTORY",
            label: `${t("shop.transactions.title")} (${transactions.length})`,
            icon: "ri-exchange-line",
          },
        ].map((tTab) => (
          <button
            key={tTab.id}
            onClick={() => setTab(tTab.id as Tab)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px",
              tab === tTab.id
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300",
            )}
          >
            <i className={tTab.icon} />
            {tTab.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-md border text-sm font-mono",
            message.type === "success"
              ? "bg-lime-500/10 border-lime-500/20 text-lime-400"
              : "bg-red-500/10 border-red-500/20 text-red-400",
          )}
        >
          <i
            className={
              message.type === "success"
                ? "ri-check-line"
                : "ri-error-warning-line"
            }
          />
          {message.text}
        </div>
      )}

      {/* Shop tab */}
      {tab === "SHOP" && (
        <div className="space-y-3">
          {SHOP_ITEMS.map((item) => {
            const canAfford = stars >= item.cost;
            const owned = ownedCounts[item.id] ?? 0;
            const isPurchasing = purchasing === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-md border transition-colors",
                  canAfford
                    ? "bg-zinc-900 border-border"
                    : "bg-zinc-900/50 border-border opacity-70",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-xl",
                    item.iconBg,
                  )}
                >
                  <i className={item.icon} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm text-foreground">
                      {t(item.nameKey)}
                    </span>
                    {item.badgeKey && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                        {t(item.badgeKey)}
                      </span>
                    )}
                    {owned > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/20">
                        {t("shop.owned", { count: owned })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                    {t(item.descriptionKey)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-sm font-mono font-bold text-yellow-400">
                    <i
                      className={canAfford ? "ri-star-fill" : "ri-star-line"}
                    />
                    {item.cost}
                  </div>
                  <button
                    onClick={() => handlePurchase(item)}
                    disabled={!canAfford || !!purchasing}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-mono font-bold transition-all",
                      canAfford && !purchasing
                        ? "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95"
                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700",
                    )}
                  >
                    {isPurchasing ? (
                      <i className="ri-loader-4-line animate-spin" />
                    ) : canAfford ? (
                      t("shop.buy")
                    ) : (
                      t("shop.needMore")
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="p-6 rounded-md border border-dashed border-zinc-700 text-center space-y-2">
            <i className="ri-store-2-line text-3xl text-zinc-700" />
            <p className="text-xs font-mono text-zinc-500">
              {t("shop.comingSoon.desc")}
            </p>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === "HISTORY" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: t("shop.history.balance"),
                value: `${stars}`,
                color: "text-yellow-400",
              },
              {
                label: t("shop.history.totalEarned"),
                value: `+${earnedTotal}`,
                color: "text-lime-400",
              },
              {
                label: t("shop.history.totalSpent"),
                value: `-${spentTotal}`,
                color: "text-red-400",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-zinc-900 border border-border rounded-md p-3 space-y-1"
              >
                <p className="text-[10px] font-mono text-zinc-500">{s.label}</p>
                <p className={cn("font-heading font-bold text-lg", s.color)}>
                  {s.value}
                  <i className="ri-star-fill text-yellow-400 text-sm ml-1" />
                </p>
              </div>
            ))}
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <i className="ri-exchange-line text-4xl text-zinc-700" />
              <p className="font-mono text-sm text-zinc-500">
                {t("shop.history.empty")}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {transactions.map((tx) => {
                const meta = REASON_LABELS[tx.reason] ?? {
                  labelKey: tx.reason,
                  icon: "ri-exchange-line",
                  color: "text-zinc-400",
                };

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-md bg-zinc-900 border border-border"
                  >
                    <i
                      className={cn(meta.icon, meta.color, "text-sm shrink-0")}
                    />

                    <span className="font-mono text-sm text-zinc-300 flex-1">
                      {t(meta.labelKey)}
                    </span>
                    <span
                      className={cn(
                        "font-heading font-bold text-sm flex items-center gap-1",
                        tx.amount > 0
                          ? "text-lime-400"
                          : tx.amount < 0
                            ? "text-red-400"
                            : "text-zinc-600",
                      )}
                    >
                      {tx.amount !== 0 && (tx.amount > 0 ? "+" : "")}
                      {tx.amount}
                      {tx.amount !== 0 && (
                        <i
                          className={
                            tx.amount > 0
                              ? "ri-star-fill text-yellow-400 text-xs"
                              : "ri-star-line text-red-400 text-xs"
                          }
                        />
                      )}
                    </span>

                    <span className="text-xs font-mono text-zinc-600 shrink-0 w-16 text-right">
                      {formatDate(tx.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
