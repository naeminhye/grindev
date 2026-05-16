import { redirect } from "next/navigation";

// components
import { AppNav } from "@/components/layout/AppNav";
import { ToastContainer } from "@/components/ui/Toast";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { TimezoneSync } from "@/components/TimezoneSync";
import { StreakRecoveryModal } from "@/components/streak/StreakRecoveryModal";

// libs
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  const [user, adminCheck] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        currentStreak: true,
        stars: true,
        lastSolvedAt: true,
        streakStatus: true,
        frozenStreakValue: true,
      },
    }),
    isAdmin(session.user.email ?? ""),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TimezoneSync />
      <StreakRecoveryModal />

      <AppNav
        userName={session.user?.name ?? session.user?.email ?? ""}
        userImage={session.user?.image ?? null}
        streak={user?.currentStreak ?? 0}
        isAdmin={adminCheck}
        stars={user?.stars ?? 0}
        lastSolvedAt={user?.lastSolvedAt?.toISOString() ?? null}
        streakStatus={user?.streakStatus ?? "ACTIVE"}
        frozenStreakValue={user?.frozenStreakValue ?? 0}
      />
      <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
      {/* Mobile bottom nav */}
      <MobileBottomNav />
      <ToastContainer />
    </div>
  );
}
