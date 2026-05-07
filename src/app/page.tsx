import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing/LandingContent";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/today");

  return <LandingContent />;
}
