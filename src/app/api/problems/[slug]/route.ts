import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    try {
        const session = await auth();
        const userId = session?.user?.id || null;

        const problem = await prisma.problem.findFirst({
            where: {
                slug,
                deletedAt: null
            },
        });

        if (!problem) {
            return NextResponse.json(
                { error: "Problem not found" },
                { status: 404 }
            );
        }

        let isSolved = false;
        let purchasedTiers: number[] = [];

        if (userId) {
            const solveRecord = await prisma.solve.findUnique({
                where: {
                    userId_problemId: {
                        userId,
                        problemId: problem.id,
                    },
                },
                select: { id: true },
            });
            isSolved = !!solveRecord;

            const hintPurchases = await prisma.hintPurchase.findMany({
                where: {
                    userId,
                    problemId: problem.id
                },
                select: { tier: true },
            });
            purchasedTiers = hintPurchases.map((h) => h.tier);
        }

        const responseData = {
            id: problem.id,
            title: problem.title,
            slug: problem.slug,
            description: problem.description,
            examples: problem.examples,
            constraints: problem.constraints,
            difficulty: problem.difficulty,
            topics: problem.topics,
            functionName: problem.functionName,
            starterCode: problem.starterCode,
            sourceName: problem.sourceName,
            sourceUrl: problem.sourceUrl,
            isSolved,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Error fetching problem:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}