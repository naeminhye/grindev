"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpButton } from "@/components/ui/HelpButton";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { StreakBadge } from "@/components/streak/StreakBadge";
import { StarCount } from '@/components/ui/StarCount'
import { RedeemCodeButton } from '@/components/ui/RedeemCodeButton'
import { useI18n } from "@/lib/i18n";
import { APP_MENUS } from "@/lib/menus";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

interface AppNavProps {
  userName: string;
  userImage: string | null;
  streak: number;
  isAdmin: boolean;
  stars: number;
}

export function AppNav({ userName, userImage, streak, isAdmin, stars }: AppNavProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [currentStars, setCurrentStars] = useState(stars)

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => { setCurrentStars(stars) }, [stars])

  async function handleSignOut() {
    // Clear AI explain cache for this user before signing out
    const session = await fetch('/api/auth/session').then(r => r.json())
    if (session?.user?.id) {
      const prefix = `grindev_ai_explain_${session.user.id}_`
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k))
    }
    await signOut({ callbackUrl: '/sign-in' })
  }

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
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border border-lime-500/30 bg-lime-500/5 text-lime-400 hover:bg-lime-500/10 transition-colors"
            title="Admin panel"
          >
            <i className="ri-shield-keyhole-line" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}
        <StreakBadge streak={streak} />
        <StarCount stars={currentStars} />
        <RedeemCodeButton onStarsChange={setCurrentStars} />
        <HelpButton />
        <SignOutButton signOut={handleSignOut} />
      </div>
    </nav>
  );
}
