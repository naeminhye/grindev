import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";

const schema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  functionName: z.string().min(1).optional(),
  description: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topic: z.enum([
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
  ]),
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
      topic: true,
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

  const problem = await prisma.problem.create({ data: parsed.data });
  return NextResponse.json({ problem }, { status: 201 });
}
