import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const solves = await prisma.solve.findMany({
    where: { userId },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          topic: true,
        },
      },
    },
    orderBy: { solvedAt: "desc" },
  });

  return NextResponse.json({ solves });
}
