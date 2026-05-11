'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type StarCode = {
    id: string
    code: string
    stars: number
    maxUses: number | null
    usedCount: number
    expiresAt: string | null
    createdAt: string
    createdBy: string
    note: string | null
    _count: { redemptions: number }
}

export default function AdminStarCodesPage() {
    const [codes, setCodes] = useState<StarCode[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState<string | null>(null)

    const [form, setForm] = useState({
        code: '',
        stars: 10,
        maxUses: '',
        expiresAt: '',
        note: '',
    })

    useEffect(() => {
        fetch('/api/admin/star-codes')
            .then((r) => r.json())
            .then((d) => { setCodes(d.codes ?? []); setLoading(false) })
    }, [])

    function isExpired(code: StarCode) {
        return !!code.expiresAt && new Date() > new Date(code.expiresAt)
    }

    function isExhausted(code: StarCode) {
        return code.maxUses !== null && code.usedCount >= code.maxUses
    }

    function getStatus(code: StarCode): { label: string; color: string } {
        if (isExpired(code)) return { label: 'Expired', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
        if (isExhausted(code)) return { label: 'Exhausted', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
        return { label: 'Active', color: 'text-lime-400 bg-lime-500/10 border-lime-500/20' }
    }

    function formatDate(iso: string | null) {
        if (!iso) return '—'
        return new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' })
    }

    async function handleCreate() {
        if (!form.code.trim() || !form.stars) return
        setError('')
        setSaving(true)

        const body: any = {
            code: form.code.trim().toUpperCase(),
            stars: form.stars,
            maxUses: form.maxUses ? parseInt(form.maxUses) : null,
            expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
            note: form.note.trim() || undefined,
        }

        const res = await fetch('/api/admin/star-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const data = await res.json()
        if (!res.ok) {
            setError(typeof data.error === 'string' ? data.error : 'Validation error')
            setSaving(false)
            return
        }

        setCodes((prev) => [data.starCode, ...prev])
        setForm({ code: '', stars: 10, maxUses: '', expiresAt: '', note: '' })
        setShowForm(false)
        setSaving(false)
    }

    async function handleDelete(id: string, code: string) {
        if (!confirm(`Delete code "${code}"? All redemption records will be removed.`)) return
        setDeleting(id)
        const res = await fetch(`/api/admin/star-codes/${id}`, { method: 'DELETE' })
        if (res.ok) setCodes((prev) => prev.filter((c) => c.id !== id))
        setDeleting(null)
    }

    function copyCode(code: string) {
        navigator.clipboard.writeText(code)
        setCopied(code)
        setTimeout(() => setCopied(null), 2000)
    }

    const inputCls = 'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm font-mono text-zinc-200 focus:outline-none focus:border-lime-500/50'

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6 w-full">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">Star Codes</h1>
                    <p className="text-sm text-zinc-500 font-mono mt-1">Create redeemable codes that award stars to users.</p>
                </div>
                <button
                    onClick={() => { setShowForm((v) => !v); setError('') }}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 font-mono text-sm rounded border transition-colors',
                        showForm
                            ? 'bg-lime-400/10 border-lime-500/30 text-lime-400'
                            : 'bg-lime-400 text-zinc-950 font-bold hover:bg-lime-300',
                    )}
                >
                    <i className={showForm ? 'ri-close-line' : 'ri-add-line'} />
                    {showForm ? 'Cancel' : 'New Code'}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div className="bg-zinc-900 border border-lime-500/20 rounded-lg p-5 space-y-4">
                    <h2 className="font-mono text-xs uppercase tracking-widest text-lime-400 flex items-center gap-2">
                        <i className="ri-coupon-line" /> New Star Code
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                Code <span className="text-red-400">*</span>
                            </label>
                            <input
                                value={form.code}
                                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
                                placeholder="LAUNCH2026"
                                maxLength={32}
                                className={cn(inputCls, 'tracking-widest font-bold')}
                            />
                            <p className="text-[10px] font-mono text-zinc-600">Uppercase letters, numbers, hyphens, underscores only.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                Stars to award <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                value={form.stars}
                                min={1}
                                max={10000}
                                onChange={(e) => setForm((f) => ({ ...f, stars: parseInt(e.target.value) || 0 }))}
                                className={inputCls}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                Max uses <span className="text-zinc-600">(leave blank = unlimited)</span>
                            </label>
                            <input
                                type="number"
                                value={form.maxUses}
                                min={1}
                                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                                placeholder="Unlimited"
                                className={inputCls}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                Expires at <span className="text-zinc-600">(leave blank = never)</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={form.expiresAt}
                                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                                className={inputCls}
                            />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                                Internal note <span className="text-zinc-600">(optional)</span>
                            </label>
                            <input
                                value={form.note}
                                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                                placeholder="e.g. Launch promotion May 2026"
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs font-mono text-red-400 flex items-center gap-1.5">
                            <i className="ri-error-warning-line" /> {error}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleCreate}
                            disabled={saving || !form.code.trim() || !form.stars}
                            className="flex items-center gap-2 px-5 py-2.5 bg-lime-400 text-zinc-950 font-mono text-sm font-bold rounded hover:bg-lime-300 disabled:opacity-40 transition-colors"
                        >
                            {saving ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-save-line" />}
                            Create Code
                        </button>
                    </div>
                </div>
            )}

            {/* Codes list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
                </div>
            ) : codes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <i className="ri-coupon-line text-4xl text-zinc-700" />
                    <p className="font-mono text-sm text-zinc-500">No codes yet. Create one above.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs font-mono text-zinc-600">{codes.length} code{codes.length !== 1 ? 's' : ''}</p>
                    {codes.map((sc) => {
                        const status = getStatus(sc)
                        const progress = sc.maxUses ? Math.round((sc.usedCount / sc.maxUses) * 100) : null

                        return (
                            <div key={sc.id} className="p-4 bg-zinc-900 border border-border rounded-md space-y-3">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => copyCode(sc.code)}
                                                className="font-heading font-bold text-base tracking-widest text-foreground hover:text-lime-400 transition-colors flex items-center gap-1.5"
                                                title="Click to copy"
                                            >
                                                {sc.code}
                                                <i className={cn('text-xs', copied === sc.code ? 'ri-check-line text-lime-400' : 'ri-file-copy-line text-zinc-600')} />
                                            </button>
                                            <span className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded border', status.color)}>
                                                {status.label}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs font-mono text-yellow-400">
                                                <i className="ri-star-fill text-xs" />{sc.stars} stars
                                            </span>
                                        </div>
                                        {sc.note && (
                                            <p className="text-xs font-mono text-zinc-500">{sc.note}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(sc.id, sc.code)}
                                        disabled={deleting === sc.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-red-400 border border-red-500/20 hover:bg-red-500/10 rounded transition-colors shrink-0"
                                    >
                                        {deleting === sc.id ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-delete-bin-line" />}
                                        Delete
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <i className="ri-user-line" />
                                        {sc.usedCount}{sc.maxUses ? `/${sc.maxUses}` : ''} uses
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <i className="ri-time-line" />
                                        Expires: {formatDate(sc.expiresAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <i className="ri-calendar-line" />
                                        Created: {formatDate(sc.createdAt)}
                                    </span>
                                </div>

                                {/* Usage bar */}
                                {progress !== null && (
                                    <div className="space-y-1">
                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-red-400' : progress >= 80 ? 'bg-yellow-400' : 'bg-lime-400')}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}