import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  if (!admin) redirect("/today");

  return (
    <div className="min-h-screen flex flex-col">
      {/* <div className="min-h-screen bg-background flex flex-col"> */}
      <AdminNav />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
