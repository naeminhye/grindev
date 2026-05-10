'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const REASONS = [
    { id: 'WRONG_TEST_CASE', label: 'Wrong test case', icon: 'ri-bug-line' },
    { id: 'WRONG_EXPECTED_OUTPUT', label: 'Wrong expected output', icon: 'ri-error-warning-line' },
    { id: 'UNCLEAR_DESCRIPTION', label: 'Unclear description', icon: 'ri-question-line' },
    { id: 'BROKEN_STARTER_CODE', label: 'Broken starter code', icon: 'ri-code-s-slash-line' },
    { id: 'OTHER', label: 'Other', icon: 'ri-more-line' },
] as const

type Reason = typeof REASONS[number]['id']
type State = 'idle' | 'open' | 'submitting' | 'done' | 'error'

interface ReportProblemButtonProps {
    problemId: string
    problemTitle: string
}

export function ReportProblemButton({ problemId, problemTitle }: ReportProblemButtonProps) {
    const [state, setState] = useState<State>('idle')
    const [reason, setReason] = useState<Reason | null>(null)
    const [description, setDescription] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    async function handleSubmit() {
        if (!reason) return
        setState('submitting')
        setErrorMsg('')

        try {
            const res = await fetch('/api/problems/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problemId, reason, description: description.trim() || undefined }),
            })

            if (!res.ok) {
                const data = await res.json()
                setErrorMsg(data.error ?? 'Failed to submit report.')
                setState('error')
                return
            }

            setState('done')
        } catch {
            setErrorMsg('An error occurred. Please try again.')
            setState('error')
        }
    }

    function handleClose() {
        setState('idle')
        setReason(null)
        setDescription('')
        setErrorMsg('')
    }

    return (
        <>
            {/* Trigger */}
            <button
                onClick={() => setState('open')}
                className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-red-400 transition-colors"
                title="Report a problem with this question"
            >
                <i className="ri-flag-line" />
                <span>Report</span>
            </button>

            {/* Modal */}
            {(state === 'open' || state === 'submitting' || state === 'done' || state === 'error') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

                    <div className="relative bg-zinc-900 border border-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <i className="ri-flag-line text-red-400" />
                                <h2 className="font-heading font-bold text-base">Report Problem</h2>
                            </div>
                            <button onClick={handleClose} className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors">
                                <i className="ri-close-line text-lg" />
                            </button>
                        </div>

                        {/* Problem title */}
                        <div className="px-5 py-2 border-b border-border bg-zinc-800/50">
                            <p className="text-xs font-mono text-zinc-400 truncate">
                                <span className="text-zinc-600">Problem: </span>{problemTitle}
                            </p>
                        </div>

                        <div className="p-5 space-y-4">
                            {state === 'done' ? (
                                /* Success state */
                                <div className="flex flex-col items-center gap-4 py-6 text-center">
                                    <div className="w-14 h-14 rounded-full bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                                        <i className="ri-check-line text-lime-400 text-2xl" />
                                    </div>
                                    <div>
                                        <p className="font-heading font-bold text-base">Report submitted</p>
                                        <p className="text-xs font-mono text-zinc-400 mt-1">
                                            Thanks for the feedback! We'll look into it.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-border text-xs font-mono text-zinc-300 rounded transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Reason selector */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                            What's the issue? <span className="text-red-400">*</span>
                                        </label>
                                        <div className="space-y-1.5">
                                            {REASONS.map((r) => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => setReason(r.id)}
                                                    className={cn(
                                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-all text-xs font-mono',
                                                        reason === r.id
                                                            ? 'border-red-500/40 bg-red-500/5 text-foreground'
                                                            : 'border-border bg-zinc-800 text-zinc-400 hover:border-zinc-600',
                                                    )}
                                                >
                                                    <i className={cn(r.icon, reason === r.id ? 'text-red-400' : 'text-zinc-600')} />
                                                    {r.label}
                                                    {reason === r.id && <i className="ri-check-line text-red-400 ml-auto" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Optional description */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                            Additional details <span className="text-zinc-600">(optional)</span>
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe the issue in more detail — e.g. which test case is wrong, what the expected output should be..."
                                            rows={3}
                                            maxLength={500}
                                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500/40 resize-none transition-colors"
                                        />
                                        <p className="text-[10px] font-mono text-zinc-600 text-right">
                                            {description.length}/500
                                        </p>
                                    </div>

                                    {/* Error */}
                                    {state === 'error' && errorMsg && (
                                        <p className="text-xs font-mono text-red-400 flex items-center gap-1.5">
                                            <i className="ri-error-warning-line" /> {errorMsg}
                                        </p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-3 pt-1">
                                        <button
                                            onClick={handleClose}
                                            className="px-4 py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!reason || state === 'submitting'}
                                            className={cn(
                                                'flex items-center gap-2 px-5 py-2 rounded font-mono text-xs font-bold transition-all',
                                                reason && state !== 'submitting'
                                                    ? 'bg-red-500 text-white hover:bg-red-400 active:scale-95'
                                                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700',
                                            )}
                                        >
                                            {state === 'submitting'
                                                ? <><i className="ri-loader-4-line animate-spin" /> Submitting...</>
                                                : <><i className="ri-flag-line" /> Submit Report</>
                                            }
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}