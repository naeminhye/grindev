"use client";

import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid">
      <div className="space-y-8 text-center w-full max-w-sm px-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Grin<span className="text-lime-400">Dev</span>
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Sharpen your edge. Daily.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-8 space-y-4">
          <p className="font-mono text-sm text-zinc-400">Sign in to continue</p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/today" })}
            className={cn(
              "w-full flex items-center justify-center gap-3",
              "px-4 py-3 rounded border border-zinc-700",
              "bg-zinc-800 hover:bg-zinc-700 transition-colors",
              "font-mono text-sm text-zinc-200",
            )}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-xs font-mono text-zinc-600">
          No account needed — sign in with Google to start.
        </p>
      </div>
    </div>
  );
}
