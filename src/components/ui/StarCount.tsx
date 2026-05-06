'use client'

import { cn } from '@/lib/utils'

interface StarCountProps {
  stars: number
  className?: string
}

export function StarCount({ stars, className }: StarCountProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-[hsl(var(--surface-raised))] border-zinc-700 font-mono text-sm',
        className
      )}
    >
      <i className="ri-star-fill text-yellow-400 text-base" />
      <span className="font-heading font-bold tabular-nums text-yellow-400">{stars}</span>
      <span className="text-xs text-zinc-500">stars</span>
    </div>
  )
}
