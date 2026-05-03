import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export default async function AdminDashboard() {
  const [problems, scheduled, solveCount, userCount] = await Promise.all([
    prisma.problem.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { solves: true, dailySlots: true } } },
    }),
    prisma.dailyProblem.findMany({
      where: { date: { gte: format(new Date(), "yyyy-MM-dd") } },
      include: { problem: { select: { title: true, difficulty: true } } },
      orderBy: { date: "asc" },
      take: 10,
    }),
    prisma.solve.count(),
    prisma.user.count(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Manage problems and schedule.
          </p>
        </div>
        <Link
          href="/admin/problems/new"
          className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 transition-colors"
        >
          <i className="ri-add-line" /> New Problem
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          {
            label: "Problems",
            value: problems.length,
            icon: "ri-code-s-slash-line",
            color: "text-lime-400",
          },
          {
            label: "Scheduled",
            value: scheduled.length,
            icon: "ri-calendar-check-line",
            color: "text-blue-400",
          },
          {
            label: "Total solves",
            value: solveCount,
            icon: "ri-check-double-line",
            color: "text-green-400",
          },
          {
            label: "Users",
            value: userCount,
            icon: "ri-user-line",
            color: "text-yellow-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-zinc-900 border border-border rounded-md p-4 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <i className={`${s.icon} ${s.color} text-sm`} />
              <span className="text-xs font-mono text-zinc-500">{s.label}</span>
            </div>
            <div className={`font-heading font-bold text-2xl ${s.color}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Problems list */}
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-zinc-400">
            Problems
          </h2>
          <div className="space-y-1.5">
            {problems.length === 0 && (
              <p className="text-sm font-mono text-zinc-600 py-4">
                No problems yet.
              </p>
            )}
            {problems.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 bg-zinc-900 border border-border rounded-md hover:border-zinc-600 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm truncate">
                      {p.title}
                    </span>
                    <DiffBadge difficulty={p.difficulty} />
                  </div>
                  <div className="text-xs font-mono text-zinc-600 mt-0.5">
                    {p._count.solves} solves · {p._count.dailySlots} scheduled
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/admin/problems/${p.id}/edit`}
                    className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <i className="ri-edit-line text-sm" />
                  </Link>
                  <Link
                    href={`/admin/schedule?problemId=${p.id}`}
                    className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                  >
                    <i className="ri-calendar-line text-sm" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming schedule */}
        <div className="space-y-3">
          <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-zinc-400">
            Upcoming
          </h2>
          <div className="space-y-1.5">
            {scheduled.length === 0 && (
              <p className="text-sm font-mono text-zinc-600 py-4">
                Nothing scheduled.
              </p>
            )}
            {scheduled.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 p-3 bg-zinc-900 border border-border rounded-md"
              >
                <span className="font-mono text-xs text-zinc-500 w-24 shrink-0">
                  {s.date}
                </span>
                <span className="font-mono text-sm flex-1 truncate">
                  {s.problem.title}
                </span>
                <DiffBadge difficulty={s.problem.difficulty} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffBadge({ difficulty }: { difficulty: string }) {
  const config: Record<string, string> = {
    EASY: "bg-green-500/10 text-green-400 border-green-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    HARD: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`text-xs font-mono px-1.5 py-0.5 rounded border ${config[difficulty] ?? ""}`}
    >
      {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
    </span>
  );
}
