import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  if (!isAdmin(session.user?.email ?? "")) {
    redirect("/today");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
