"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    { href: "/today", icon: "ri-code-s-slash-line", label: t("nav.today") },
    { href: "/history", icon: "ri-history-line", label: t("nav.history") },
    {
      href: "/profile",
      icon: "ri-bar-chart-box-line",
      label: t("nav.profile"),
    },
    { href: "/shop", icon: "ri-settings-3-line", label: t("nav.shop") },
    { href: "/settings", icon: "ri-settings-3-line", label: t("nav.settings") },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors min-w-[56px]",
              pathname === item.href
                ? "text-lime-400"
                : "text-zinc-500 hover:text-foreground",
            )}
          >
            <i className={`${item.icon} text-lg`} />
            <span className="text-[10px] font-mono">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
