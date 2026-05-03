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
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
