import ProblemView, { ProblemViewData } from '@/components/problem/ProblemView';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ProblemPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;

    try {
        const problem = await prisma.problem.findFirst({
            where: { slug, deletedAt: null },
        });

        if (!problem) {
            return <div className="flex h-screen items-center justify-center text-zinc-400 font-mono">404 - Problem not found</div>;
        }

        const session = await auth();
        const userId = session?.user?.id || null;

        let isSolved = false;

        if (userId) {
            const solveRecord = await prisma.solve.findUnique({
                where: { userId_problemId: { userId, problemId: problem.id } },
            });
            isSolved = !!solveRecord;
        }

        const problemData: ProblemViewData = {
            id: problem.id,
            title: problem.title,
            slug: problem.slug,
            description: problem.description,
            examples: problem.examples as any[],
            constraints: problem.constraints,
            difficulty: problem.difficulty,
            topics: problem.topics as string[],
            functionName: problem.functionName,
            sourceName: problem.sourceName,
            sourceUrl: problem.sourceUrl,
            isSolved: isSolved,
        };

        return <ProblemView problem={problemData} />;

    } catch (error) {
        console.error("Error loading problem page:", error);
        return <div className="flex h-screen items-center justify-center text-red-400 font-mono">Error loading problem</div>;
    }
}