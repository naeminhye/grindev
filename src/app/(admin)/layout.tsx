import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  if (!admin) redirect("/today");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Link
            href="/today"
            className="font-heading font-bold text-base tracking-tight"
          >
            Grin<span className="text-lime-400">Dev</span>
            <span className="ml-2 text-xs font-mono text-orange-400 border border-orange-400/30 px-1.5 py-0.5 rounded">
              admin
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/admin"
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-foreground hover:bg-[hsl(var(--surface-raised))] rounded-md transition-colors font-mono"
            >
              <i className="ri-dashboard-line mr-1.5" />
              Dashboard
            </Link>
            <Link
              href="/admin/problems/new"
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-foreground hover:bg-[hsl(var(--surface-raised))] rounded-md transition-colors font-mono"
            >
              <i className="ri-add-line mr-1.5" />
              New Problem
            </Link>
            <Link
              href="/admin/schedule"
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-foreground hover:bg-[hsl(var(--surface-raised))] rounded-md transition-colors font-mono"
            >
              <i className="ri-calendar-line mr-1.5" />
              Schedule
            </Link>
          </div>
        </div>
        <Link
          href="/today"
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to app
        </Link>
      </nav>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
