import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
            <Link
              href="/today"
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-foreground hover:bg-zinc-800 rounded-md transition-colors font-mono"
            >
              <i className="ri-code-s-slash-line mr-1.5" />
              Today
            </Link>
            <Link
              href="/history"
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-foreground hover:bg-zinc-800 rounded-md transition-colors font-mono"
            >
              <i className="ri-history-line mr-1.5" />
              History
            </Link>
            <Link
              href="/profile"
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-foreground hover:bg-zinc-800 rounded-md transition-colors font-mono"
            >
              <i className="ri-bar-chart-box-line mr-1.5" />
              Stats
            </Link>
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
