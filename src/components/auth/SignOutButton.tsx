"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
    >
      <i className="ri-logout-box-line" />
      Sign out
    </button>
  );
}
