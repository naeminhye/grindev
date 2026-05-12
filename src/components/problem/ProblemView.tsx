"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";

import 'katex/dist/katex.min.css';
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { Difficulty, ReportReason } from "@prisma/client";
import { ReportProblemButton, ReportReasonItem } from "@/components/problem/ReportProblemButton";
import Link from "next/link";

export interface ProblemViewData {
    id: string;
    title: string;
    slug: string;
    description: string;
    examples: any[];
    constraints: string;
    difficulty: string;
    topics: string[];
    functionName: string;
    sourceName: string | null | undefined;
    sourceUrl: string | null | undefined;
    isSolved: boolean;
}

interface ProblemViewProps {
    problem: ProblemViewData;
}

const REPORT_REASONS: ReportReasonItem[] = [
    {
        id: ReportReason.UNCLEAR_DESCRIPTION,
        label: 'Unclear description',
        icon: 'ri-question-line'
    },
    {
        id: ReportReason.OTHER,
        label: 'Other',
        icon: 'ri-more-line'
    },
];

// Markdown components
const markdownComponents = {
    img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        const { src, alt, ...rest } = props;
        if (typeof src !== "string") return null;
        return (
            <img
                src={src}
                alt={alt || "Problem illustration"}
                className="max-w-full h-auto rounded-md border border-zinc-800 my-4 cursor-pointer hover:border-zinc-600 transition-colors"
                loading="lazy"
                onClick={() => window.open(src, "_blank", "noopener,noreferrer")}
                title="Click to view full size"
                {...rest}
            />
        );
    },
};

export default function ProblemView({ problem }: ProblemViewProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col h-screen bg-[hsl(var(--background))] text-zinc-100">

            {/* Top Bar: Title & Solved Badge */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-800 bg-[hsl(var(--surface))] shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold tracking-tight text-zinc-100">{problem.title}</h1>
                    <DifficultyBadge
                        difficulty={problem.difficulty as Difficulty}
                    />
                    {problem.isSolved && (
                        <span className="flex items-center gap-1 text-xs font-mono text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded">
                            <i className="ri-check-line" /> Solved
                        </span>
                    )}
                </div>
                <button
                    onClick={() => router.back()}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:bg-[hsl(var(--surface-raised))] rounded-md transition-colors border border-transparent hover:border-border"
                >
                    <i className="ri-arrow-left-line" />
                    Back
                </button>
            </div>

            {/* Main Content - Chỉ còn 1 cột toàn màn hình để đọc bài toán */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">

                {/* Container giới hạn độ rộng để dễ đọc */}
                <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">

                    {/* Topics */}
                    {problem.topics.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {problem.topics.map((topic) => (
                                <span
                                    key={topic}
                                    className="text-xs font-mono text-zinc-500 uppercase tracking-wide px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900"
                                >
                                    {topic.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                        >
                            {problem.description}
                        </ReactMarkdown>
                    </div>

                    <div className={`flex flex-col md:flex-row gap-3 ${problem?.sourceName ? 'justify-between' : 'justify-end'}`}>
                        {problem.sourceName && (
                            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                                <i className="ri-links-line text-zinc-600" />
                                {problem.sourceUrl ? (
                                    <a
                                        href={problem.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-zinc-300 underline underline-offset-2 transition-colors"
                                    >
                                        {problem.sourceName}
                                    </a>
                                ) : (
                                    <span>{problem.sourceName}</span>
                                )}
                            </div>
                        )}
                        <ReportProblemButton problemId={problem.id} problemTitle={problem.title} reasons={REPORT_REASONS} />
                    </div>

                    {/* Examples */}
                    {problem.examples.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <i className="ri-book-3-line text-yellow-400" />
                                <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Examples</h2>
                            </div>
                            {problem.examples.map((example: any, index: number) => (
                                <div key={index} className="rounded-md border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                                    <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900">
                                        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Example {index + 1}</span>
                                    </div>
                                    <div className="p-4 space-y-3 text-sm">
                                        <div>
                                            <strong className="text-zinc-400 text-xs block mb-1">Input:</strong>
                                            <code className="text-zinc-200">{example.input}</code>
                                        </div>
                                        <div>
                                            <strong className="text-zinc-400 text-xs block mb-1">Output:</strong>
                                            <code className="text-zinc-200">{example.output}</code>
                                        </div>
                                        {example.explanation && (
                                            <div>
                                                <strong className="text-zinc-400 text-xs block mb-1">Explanation:</strong>
                                                <div className="prose prose-invert text-zinc-300 text-sm max-w-none">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{example.explanation}</ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Constraints */}
                    {problem.constraints && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                                <i className="ri-alert-line text-yellow-400" />
                                <h2 className="font-mono text-xs uppercase tracking-widest text-zinc-400">Constraints</h2>
                            </div>
                            <div className="prose prose-invert text-zinc-300 text-sm max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{problem.constraints}</ReactMarkdown>
                            </div>
                        </section>
                    )}

                </div>
            </main>
        </div>
    );
}