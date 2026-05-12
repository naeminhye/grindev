import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";
import { Topic } from "@prisma/client";

const schema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  examples: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      }),
    )
    .default([]),
  constraints: z.string().default(""),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  functionName: z.string().min(1).default("solution"),
  starterCode: z.record(z.string(), z.string()),
  testCases: z
    .array(z.object({ input: z.string(), expected: z.string() }))
    .min(1),
  hints: z.array(
    z.object({ tier: z.number(), cost: z.number(), content: z.string() }),
  ),
  sourceName: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().max(255).nullable().default(null)
  ),
  sourceUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url().max(500).nullable().default(null)
  ),
});

export async function GET(req: Request) {
  try {
    const { error } = await getAdminUserId();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const difficulty = searchParams.get("difficulty") ?? "";
    const topics = searchParams.getAll("topic");
    const scheduled = searchParams.get("scheduled") ?? "all";

    // Get all scheduled problem IDs for filter
    let scheduledProblemIds: Set<string> | null = null;
    if (scheduled !== "all") {
      const slots = await prisma.dailyProblem.findMany({
        select: { problemId: true },
      });
      scheduledProblemIds = new Set(slots.map((s) => s.problemId));
    }

    const problems = await prisma.problem.findMany({
      where: {
        deletedAt: null,
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
        ...(difficulty ? { difficulty: difficulty as any } : {}),
        ...(topics.length > 0
          ? { topics: { hasSome: topics as Topic[] } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { solves: true, dailySlots: true } } },
    });

    const filtered = problems.filter((p) => {
      if (!scheduledProblemIds) return true;
      if (scheduled === "scheduled") return scheduledProblemIds.has(p.id);
      if (scheduled === "unscheduled") return !scheduledProblemIds.has(p.id);
      return true;
    });

    return NextResponse.json({ problems: filtered });
  } catch (e: any) {
    console.error("ADMIN PROBLEMS ERROR:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.problem.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const problem = await prisma.problem.create({
    data: {
      ...parsed.data,
      topics: parsed.data.topics as Topic[],
      examples: parsed.data.examples as any,
    },
  });

  return NextResponse.json({ problem }, { status: 201 });
}
