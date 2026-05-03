import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav
        userName={session.user?.name ?? session.user?.email ?? ""}
        userImage={session.user?.image ?? null}
      />
      <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}

function MobileBottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-around px-2 py-2">
        {[
          { href: "/today", icon: "ri-code-s-slash-line", label: "Today" },
          { href: "/history", icon: "ri-history-line", label: "History" },
          { href: "/profile", icon: "ri-bar-chart-box-line", label: "Profile" },
          { href: "/settings", icon: "ri-settings-3-line", label: "Settings" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-zinc-500 hover:text-foreground transition-colors min-w-[56px]"
          >
            <i className={`${item.icon} text-lg`} />
            <span className="text-[10px] font-mono">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
