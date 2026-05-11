'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface RedeemCodeButtonProps {
    onStarsChange?: (newBalance: number) => void
}

type State = 'idle' | 'submitting' | 'success' | 'error'

export function RedeemCodeButton({ onStarsChange }: RedeemCodeButtonProps) {
    const [open, setOpen] = useState(false)
    const [code, setCode] = useState('')
    const [state, setState] = useState<State>('idle')
    const [message, setMessage] = useState('')
    const [starsEarned, setStarsEarned] = useState(0)
    const [expired, setExpired] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const popupRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                handleClose()
            }
        }
        if (open) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    function handleClose() {
        setOpen(false)
        // Keep success message visible briefly
        if (state !== 'success') {
            setState('idle')
            setCode('')
            setMessage('')
            setExpired(false)
        }
    }

    function handleOpen() {
        setOpen(true)
        if (state === 'success') {
            setState('idle')
            setCode('')
            setMessage('')
            setStarsEarned(0)
            setExpired(false)
        }
    }

    async function handleSubmit() {
        const trimmed = code.trim().toUpperCase()
        if (!trimmed || state === 'submitting') return

        setState('submitting')
        setMessage('')
        setExpired(false)

        try {
            const res = await fetch('/api/star-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: trimmed }),
            })

            const data = await res.json()

            if (res.ok) {
                setStarsEarned(data.stars)
                setMessage(data.message)
                setState('success')
                if (onStarsChange && data.newBalance !== undefined) {
                    onStarsChange(data.newBalance)
                }
            } else {
                setMessage(data.error ?? 'Something went wrong.')
                setExpired(!!data.expired)
                setState('error')
            }
        } catch {
            setMessage('Network error. Please try again.')
            setState('error')
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') handleSubmit()
        if (e.key === 'Escape') handleClose()
    }

    return (
        <div className="relative" ref={popupRef}>
            {/* Trigger button */}
            <button
                onClick={handleOpen}
                className={cn(
                    'flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-mono transition-colors',
                    state === 'success'
                        ? 'border-lime-500/40 bg-lime-500/10 text-lime-400'
                        : 'border-border bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
                )}
                title="Redeem a star code"
            >
                <i className={state === 'success' ? 'ri-gift-fill text-lime-400' : 'ri-coupon-line'} />
                <span className="hidden md:inline">
                    {state === 'success' ? `+${starsEarned}★` : 'Enter code'}
                </span>
            </button>

            {/* Popup */}
            {open && (
                <div className={cn(
                    'absolute z-50 mt-2 w-72 bg-zinc-900 border border-border rounded-lg shadow-2xl overflow-hidden',
                    'right-0', // align to right edge of button
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <i className="ri-coupon-line text-lime-400" />
                            <span className="font-heading font-bold text-sm">Redeem Code</span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <i className="ri-close-line" />
                        </button>
                    </div>

                    <div className="p-4 space-y-3">
                        {state === 'success' ? (
                            /* Success state */
                            <div className="flex flex-col items-center gap-3 py-3 text-center">
                                <div className="w-12 h-12 rounded-full bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
                                    <i className="ri-gift-fill text-lime-400 text-xl" />
                                </div>
                                <div>
                                    <p className="font-heading font-bold text-base text-foreground">Code redeemed!</p>
                                    <p className="text-xs font-mono text-zinc-400 mt-1">{message}</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                                    <i className="ri-star-fill text-yellow-400" />
                                    <span className="font-heading font-bold text-yellow-400 text-lg">+{starsEarned}</span>
                                    <span className="text-xs font-mono text-zinc-400 ml-1">stars</span>
                                </div>
                                <button
                                    onClick={() => { setState('idle'); setCode(''); setStarsEarned(0) }}
                                    className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    Redeem another →
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                                        Enter your code
                                    </label>
                                    <input
                                        ref={inputRef}
                                        value={code}
                                        onChange={(e) => {
                                            setCode(e.target.value.toUpperCase())
                                            if (state === 'error') { setState('idle'); setMessage(''); setExpired(false) }
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="e.g. LAUNCH2026"
                                        maxLength={32}
                                        disabled={state === 'submitting'}
                                        className={cn(
                                            'w-full px-3 py-2 bg-zinc-800 border rounded-md text-sm font-mono tracking-widest text-center uppercase focus:outline-none transition-colors',
                                            state === 'error'
                                                ? expired
                                                    ? 'border-orange-500/50 text-orange-400'
                                                    : 'border-red-500/50 text-red-400'
                                                : 'border-zinc-700 text-zinc-200 focus:border-lime-500/50',
                                        )}
                                    />
                                </div>

                                {/* Error message */}
                                {state === 'error' && message && (
                                    <div className={cn(
                                        'flex items-start gap-2 p-2.5 rounded-md border text-xs font-mono',
                                        expired
                                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                            : 'bg-red-500/10 border-red-500/20 text-red-400',
                                    )}>
                                        <i className={cn('shrink-0 mt-0.5', expired ? 'ri-time-line' : 'ri-error-warning-line')} />
                                        <span>{message}</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={!code.trim() || state === 'submitting'}
                                    className={cn(
                                        'w-full py-2.5 rounded font-mono text-sm font-bold transition-all',
                                        code.trim() && state !== 'submitting'
                                            ? 'bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95'
                                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700',
                                    )}
                                >
                                    {state === 'submitting' ? (
                                        <><i className="ri-loader-4-line animate-spin mr-1" /> Checking...</>
                                    ) : (
                                        <><i className="ri-gift-line mr-1" /> Redeem</>
                                    )}
                                </button>

                                <p className="text-[10px] font-mono text-zinc-600 text-center">
                                    Codes are case-insensitive and single-use per account.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}