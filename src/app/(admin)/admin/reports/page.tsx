'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Report = {
    id: string
    reason: string
    description: string | null
    status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'
    createdAt: string
    problem: { id: string; title: string; difficulty: string; slug: string }
    user: { id: string }
}

const REASON_LABELS: Record<string, string> = {
    WRONG_TEST_CASE: 'Wrong test case',
    WRONG_EXPECTED_OUTPUT: 'Wrong expected output',
    UNCLEAR_DESCRIPTION: 'Unclear description',
    BROKEN_STARTER_CODE: 'Broken starter code',
    OTHER: 'Other',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    OPEN: { label: 'Open', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    REVIEWING: { label: 'Reviewing', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    RESOLVED: { label: 'Resolved', color: 'text-lime-400 bg-lime-500/10 border-lime-500/20' },
    DISMISSED: { label: 'Dismissed', color: 'text-zinc-500 bg-zinc-800 border-zinc-700' },
}

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetch(`/api/admin/reports${statusFilter ? `?status=${statusFilter}` : ''}`)
            .then((r) => r.json())
            .then((d) => { setReports(d.reports ?? []); setLoading(false) })
    }, [statusFilter])

    async function updateStatus(reportId: string, status: string) {
        setUpdating(reportId)
        const res = await fetch('/api/admin/reports', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportId, status }),
        })
        if (res.ok) {
            setReports((prev) => prev.map((r) =>
                r.id === reportId ? { ...r, status: status as Report['status'] } : r
            ))
        }
        setUpdating(null)
    }

    function formatDate(iso: string) {
        const d = new Date(iso)
        const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
        if (diff === 0) return 'Today'
        if (diff === 1) return 'Yesterday'
        return `${diff}d ago`
    }

    const openCount = reports.filter((r) => r.status === 'OPEN').length

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6 w-full">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight flex items-center gap-2">
                        Problem Reports
                        {openCount > 0 && (
                            <span className="text-sm font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                {openCount} open
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-zinc-500 font-mono mt-1">User-reported issues with problems.</p>
                </div>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap">
                {['', 'OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                            'px-3 py-1.5 rounded text-xs font-mono transition-colors border',
                            statusFilter === s
                                ? 'bg-lime-400 text-zinc-950 font-bold border-lime-400'
                                : 'border-border text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
                        )}
                    >
                        {s === '' ? 'All' : STATUS_CONFIG[s].label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
                </div>
            ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <i className="ri-flag-line text-4xl text-zinc-700" />
                    <p className="font-mono text-sm text-zinc-500">No reports found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reports.map((report) => {
                        const statusCfg = STATUS_CONFIG[report.status]
                        return (
                            <div key={report.id} className="p-4 bg-zinc-900 border border-border rounded-md space-y-3">
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={`/admin/problems/${report.problem.id}/edit`}
                                                className="font-mono text-sm font-bold text-foreground hover:text-lime-400 transition-colors truncate"
                                            >
                                                {report.problem.title}
                                            </Link>
                                            <span className={cn(
                                                'text-xs font-mono px-1.5 py-0.5 rounded border',
                                                report.problem.difficulty === 'EASY' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                                    report.problem.difficulty === 'MEDIUM' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                                                        'text-red-400 bg-red-500/10 border-red-500/20',
                                            )}>
                                                {report.problem.difficulty}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                                            <i className="ri-flag-line" />
                                            <span>{REASON_LABELS[report.reason] ?? report.reason}</span>
                                            <span>·</span>
                                            <span>{report.user.id}</span>
                                            <span>·</span>
                                            <span>{formatDate(report.createdAt)}</span>
                                        </div>
                                    </div>
                                    <span className={cn('text-xs font-mono px-2 py-0.5 rounded border shrink-0', statusCfg.color)}>
                                        {statusCfg.label}
                                    </span>
                                </div>

                                {/* Description */}
                                {report.description && (
                                    <p className="text-xs font-mono text-zinc-400 bg-zinc-800 px-3 py-2 rounded-md border border-zinc-700">
                                        "{report.description}"
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-mono text-zinc-600">Update status:</span>
                                    {(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => updateStatus(report.id, s)}
                                            disabled={report.status === s || updating === report.id}
                                            className={cn(
                                                'px-2.5 py-1 rounded text-[10px] font-mono border transition-colors',
                                                report.status === s
                                                    ? cn(STATUS_CONFIG[s].color, 'opacity-60 cursor-not-allowed')
                                                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300',
                                            )}
                                        >
                                            {updating === report.id ? <i className="ri-loader-4-line animate-spin" /> : STATUS_CONFIG[s].label}
                                        </button>
                                    ))}
                                    <Link
                                        href={`/admin/problems/${report.problem.id}/edit`}
                                        className="ml-auto text-xs font-mono text-zinc-500 hover:text-lime-400 flex items-center gap-1 transition-colors"
                                    >
                                        <i className="ri-edit-line" /> Edit problem
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}