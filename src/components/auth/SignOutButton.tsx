"use client";

import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n";

export function SignOutButton() {
  const { t } = useI18n();
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-[hsl(var(--surface-raised))] rounded-md transition-colors"
    >
      <i className="ri-logout-box-line" />
      <span className="hidden sm:inline">{t("nav.signOut")}</span>
    </button>
  );
}
