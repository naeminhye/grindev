"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useI18n } from "@/lib/i18n";

interface AppNavProps {
  userName: string;
  userImage: string | null;
}

export function AppNav({ userName, userImage }: AppNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const menus = [
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
    <nav className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-4 md:gap-6">
        <Link
          href="/today"
          className="font-heading font-bold text-base tracking-tight"
        >
          Grin<span className="text-lime-400">Dev</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={
                pathname === menu.href
                  ? "px-3 py-1.5 text-sm text-foreground bg-[hsl(var(--surface))] rounded-md font-mono border border-border"
                  : "px-3 py-1.5 text-sm text-zinc-400 hover:text-foreground hover:bg-[hsl(var(--surface))] rounded-md transition-colors font-mono"
              }
            >
              <i className={`${menu.icon} mr-1.5`} />
              {menu.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {userImage && (
          <img
            src={userImage}
            alt="avatar"
            className="w-7 h-7 rounded-full border border-border"
          />
        )}
        <span className="hidden sm:block text-xs font-mono text-zinc-400 max-w-[120px] truncate">
          {userName}
        </span>
        <SignOutButton />
      </div>
    </nav>
  );
}
