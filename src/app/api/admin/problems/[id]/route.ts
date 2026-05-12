import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";
import { Topic } from "@prisma/client";

const problemExampleSchema = z.object({
  input: z.string().min(1, "Input is required"),
  output: z.string().min(1, "Output is required"),
  explanation: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  functionName: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  examples: z.array(problemExampleSchema).min(1).max(5),
  constraints: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  starterCode: z.record(z.string(), z.string()),
  testCases: z
    .array(z.object({ input: z.string(), expected: z.string() }))
    .optional(),
  hints: z
    .array(
      z.object({ tier: z.number(), cost: z.number(), content: z.string() }),
    )
    .optional(),
  sourceName: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().max(255).nullable().default(null)
  ),
  sourceUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url().max(500).nullable().default(null)
  ),
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
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
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
      examples: parsed.data.examples as any,
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
