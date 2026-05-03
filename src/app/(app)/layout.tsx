"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  {
    href: "/today",
    label: "Today",
    icon: "ri-code-s-slash-line",
  },
  {
    href: "/history",
    label: "History",
    icon: "ri-history-line",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: "ri-bar-chart-box-line",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: "ri-settings-3-line",
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-heading font-bold text-base tracking-tight"
          >
            Grin<span className="text-lime-400">Dev</span>
          </Link>

          <div className="flex items-center gap-1">
            {menus.map((menu) => {
              const isActive = pathname === menu.href;

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className={
                    isActive
                      ? "px-3 py-1.5 text-sm text-foreground bg-zinc-800 rounded-md font-mono"
                      : "px-3 py-1.5 text-sm text-zinc-400 hover:text-foreground hover:bg-zinc-800 rounded-md transition-colors font-mono"
                  }
                >
                  <i className={`${menu.icon} mr-1.5`} />
                  {menu.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </div>
      </nav>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
