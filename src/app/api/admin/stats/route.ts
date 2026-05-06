import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await getAdminUserId();
  if (error) return error;

  const [problems, scheduled, solves, users] = await Promise.all([
    prisma.problem.count({ where: { deletedAt: null } }),
    prisma.dailyProblem.count(),
    prisma.solve.count(),
    prisma.user.count(),
  ]);

  return NextResponse.json({ problems, scheduled, solves, users });
}
