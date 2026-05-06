import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";
import { Topic } from "@prisma/client";

export async function POST(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: "Expected a JSON array" },
      { status: 400 },
    );
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] };

  for (const p of body) {
    try {
      const existing = await prisma.problem.findUnique({
        where: { slug: p.slug },
      });
      if (existing) {
        results.skipped++;
        continue;
      }

      await prisma.problem.create({
        data: {
          ...p,
          topics: p.topics as Topic[],
        },
      });
      results.created++;
    } catch (e: any) {
      results.errors.push(`${p.slug}: ${e.message}`);
    }
  }

  return NextResponse.json(results);
}
