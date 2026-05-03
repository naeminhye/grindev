import Link from "next/link";
// import { getAuthUserId } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  // const { userId, error } = await getAuthUserId();
  // if (error) return error;

  // Logged in users go straight to the app
  const session = await auth();
  if (session) redirect("/today");

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <span className="font-heading font-bold text-lg">
          Grin<span className="text-lime-400">Dev</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-mono text-zinc-400 hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-mono font-bold px-4 py-2 bg-lime-400 text-zinc-950 rounded hover:bg-lime-300 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-8">
        <div className="space-y-4 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-400">
            Code · Daily · No Excuses
          </p>
          <h1 className="font-heading text-6xl font-bold tracking-tighter leading-none">
            Sharpen
            <br />
            <span className="text-lime-400">Your Edge.</span>
          </h1>
          <p className="font-mono text-zinc-400 text-base leading-relaxed max-w-lg mx-auto">
            One DSA problem a day. No copy-paste. No Googling. Hints cost stars
            — earn them back by solving clean.
          </p>
        </div>

        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-lime-400 text-zinc-950 font-mono font-bold text-sm rounded hover:bg-lime-300 transition-colors"
        >
          <i className="ri-play-fill" />
          Start Today's Problem
        </Link>

        <div className="flex items-center gap-8 pt-4">
          {[
            { icon: "ri-fire-line", label: "Daily Streaks" },
            { icon: "ri-forbid-2-line", label: "No Paste" },
            { icon: "ri-star-line", label: "Hint Economy" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 text-sm font-mono text-zinc-500"
            >
              <i className={`${f.icon} text-lime-400`} />
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
