import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuizForm from "@/components/admin/QuizForm";
import type { QuizQuestion } from "@/types";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id, deletedAt: null } });
  if (!quiz) notFound();

  return (
    <QuizForm
      quizId={quiz.id}
      initial={{
        title: quiz.title,
        topic: quiz.topic as any,
        difficulty: quiz.difficulty,
        questions: quiz.questions as QuizQuestion[],
      }}
    />
  );
}
