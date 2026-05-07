"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpButton } from "@/components/ui/HelpButton";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useI18n } from "@/lib/i18n";
import { APP_MENUS } from "@/lib/menus";
import { useEffect, useState } from "react";

interface AppNavProps {
  userName: string;
  userImage: string | null;
}

export function AppNav({ userName, userImage }: AppNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          {APP_MENUS.map((menu) => (
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
              {mounted ? t(menu.labelKey) : ""}
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

        <HelpButton />
        <SignOutButton />
      </div>
    </nav>
  );
}
