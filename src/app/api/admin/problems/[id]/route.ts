import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";
import { Topic } from "@prisma/client";

const TOPICS = [
  "ARRAYS",
  "STRINGS",
  "LINKED_LISTS",
  "TREES",
  "GRAPHS",
  "DYNAMIC_PROGRAMMING",
  "SORTING",
  "BINARY_SEARCH",
  "STACK_QUEUE",
  "HASH_MAP",
  "HEAPS",
  "TWO_POINTERS",
  "SLIDING_WINDOW",
  "DFS_BFS",
  "BACKTRACKING",
  "GREEDY",
  "RECURSION",
  "DIVIDE_AND_CONQUER",
  "BIT_MANIPULATION",
  "MATH",
  "TRIE",
  "UNION_FIND",
  "SEGMENT_TREE",
  "FENWICK_TREE",
  "MONOTONIC_STACK",
  "MONOTONIC_QUEUE",
] as const;

const schema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  functionName: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  topics: z.array(z.enum(TOPICS)).min(1),
  starterCode: z.record(z.string(), z.string()),
  testCases: z
    .array(z.object({ input: z.string(), expected: z.string() }))
    .optional(),
  hints: z
    .array(
      z.object({ tier: z.number(), cost: z.number(), content: z.string() }),
    )
    .optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const problem = await prisma.problem.findUnique({
    where: { id, deletedAt: null },
  });
  if (!problem)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check slug uniqueness if changing
  if (parsed.data.slug && parsed.data.slug !== problem.slug) {
    const existing = await prisma.problem.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (existing)
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 },
      );
  }

  const updated = await prisma.problem.update({
    where: { id },
    data: {
      ...parsed.data,
      topics: parsed.data.topics?.map((t) => t as Topic),
    },
  });

  return NextResponse.json({ problem: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const { id } = await params;

  const problem = await prisma.problem.findUnique({ where: { id } });
  if (!problem)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft delete — preserves solve history
  await prisma.problem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
