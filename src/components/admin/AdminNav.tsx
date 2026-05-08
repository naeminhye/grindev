"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ADMIN_MENUS = [
  { href: "/admin", label: "Dashboard", icon: "ri-dashboard-line" },
  {
    href: "/admin/problems/new",
    label: "New Problem",
    icon: "ri-add-circle-line",
  },
  { href: "/admin/schedule", label: "Schedule", icon: "ri-calendar-line" },
  { href: "/admin/quizzes", label: "Quizzes", icon: "ri-questionnaire-line" },
  {
    href: "/admin/quiz-schedule",
    label: "Quiz Schedule",
    icon: "ri-calendar-check-line",
  },
  { href: "/admin/config", label: "Config", icon: "ri-settings-3-line" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeMenu = ADMIN_MENUS.find((m) =>
    m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href),
  );

  return (
    <nav className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="font-heading font-bold text-base tracking-tight"
        >
          Grin<span className="text-lime-400">Dev</span>
          <span className="ml-2 text-xs font-mono text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded">
            admin
          </span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-1">
          {ADMIN_MENUS.map((menu) => {
            const isActive =
              menu.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(menu.href);
            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-mono rounded-md transition-colors",
                  isActive
                    ? "text-foreground bg-[hsl(var(--surface-raised))] border border-border"
                    : "text-zinc-400 hover:text-foreground hover:bg-[hsl(var(--surface-raised))]",
                )}
              >
                <i className={`${menu.icon} mr-1.5`} />
                {menu.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Back to app */}
        <Link
          href="/today"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-[hsl(var(--surface-raised))] rounded-md transition-colors border border-transparent hover:border-border"
        >
          <i className="ri-arrow-left-line" />
          Back to app
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-md border border-border text-zinc-400 hover:text-foreground hover:bg-[hsl(var(--surface-raised))] transition-colors"
        >
          <i
            className={
              mobileOpen ? "ri-close-line text-lg" : "ri-menu-line text-lg"
            }
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Menu panel */}
          <div className="fixed top-14 left-0 right-0 z-50 md:hidden bg-background border-b border-border shadow-lg">
            <div className="px-4 py-3 space-y-1">
              {ADMIN_MENUS.map((menu) => {
                const isActive =
                  menu.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(menu.href);
                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-mono transition-colors",
                      isActive
                        ? "text-foreground bg-[hsl(var(--surface-raised))] border border-border"
                        : "text-zinc-400 hover:text-foreground hover:bg-[hsl(var(--surface-raised))]",
                    )}
                  >
                    <i className={`${menu.icon} text-base`} />
                    {menu.label}
                    {isActive && (
                      <i className="ri-arrow-right-s-line ml-auto text-lime-400" />
                    )}
                  </Link>
                );
              })}
              <div className="border-t border-border pt-2 mt-2">
                <Link
                  href="/today"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-mono text-zinc-500 hover:text-zinc-300 hover:bg-[hsl(var(--surface-raised))] transition-colors"
                >
                  <i className="ri-arrow-left-line text-base" />
                  Back to app
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
