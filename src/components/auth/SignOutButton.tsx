"use client";

import { useI18n } from "@/lib/i18n";

interface SignOutButtonProps {
  signOut: VoidFunction
}

export function SignOutButton({ signOut }: SignOutButtonProps) {
  const { t } = useI18n();
  return (
    <button
      onClick={signOut}
      className="h-8 flex items-center gap2 px-3 py-1.5 rounded-md border text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-[hsl(var(--surface-raised))] rounded-md transition-colors"
    >
      <i className="ri-logout-circle-r-line" />
      <span className="hidden md:inline">{t("nav.signOut")}</span>
    </button>
  );
}
