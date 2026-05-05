import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProblemForm from "@/components/admin/ProblemForm";
import type { ProblemFormData } from "@/components/admin/ProblemForm";
import { parseProblemExamples } from "@/types";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problem = await prisma.problem.findUnique({
    where: { id, deletedAt: null },
  });
  if (!problem) notFound();

  const initial: Partial<ProblemFormData> = {
    title: problem.title,
    slug: problem.slug,
    functionName: problem.functionName,
    description: problem.description,
    examples: parseProblemExamples(problem.examples),
    constraints: problem.constraints ?? "",
    difficulty: problem.difficulty as any,
    topics: problem.topics as any,
    starterCode: problem.starterCode as any,
    testCases: problem.testCases as any,
    hints: problem.hints as any,
  };

  return <ProblemForm initial={initial} problemId={problem.id} />;
}
