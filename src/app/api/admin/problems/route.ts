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

const problemExampleSchema = z.object({
  input: z.string().min(1, "Input is required"),
  output: z.string().min(1, "Output is required"),
  explanation: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  functionName: z.string().min(1).optional(),
  description: z.string().min(1),
  examples: z.array(problemExampleSchema).min(1).max(5),
  constraints: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topics: z.array(z.enum(TOPICS)).min(1),
  starterCode: z.record(z.string(), z.string()),
  testCases: z
    .array(z.object({ input: z.string(), expected: z.string() }))
    .min(1),
  hints: z.array(
    z.object({ tier: z.number(), cost: z.number(), content: z.string() }),
  ),
});

export async function GET() {
  const { error } = await getAdminUserId();
  if (error) return error;

  const problems = await prisma.problem.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      topics: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ problems });
}

export async function POST(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check slug uniqueness
  const existing = await prisma.problem.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const problem = await prisma.problem.create({
    data: {
      ...parsed.data,
      topics: parsed.data.topics.map((t) => t as Topic),
    },
  });
  return NextResponse.json({ problem }, { status: 201 });
}
