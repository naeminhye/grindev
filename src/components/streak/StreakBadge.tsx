'use client'

import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  streak: number
  className?: string
}

export function StreakBadge({ streak, className }: StreakBadgeProps) {
  const isHot = streak >= 7
  const isOnFire = streak >= 30

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md border font-mono text-sm',
        isOnFire
          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
          : isHot
          ? 'bg-lime-500/10 border-lime-500/30 text-lime-400'
          : 'bg-zinc-800 border-zinc-700 text-zinc-400',
        className
      )}
    >
      <i
        className={cn(
          'text-base',
          isOnFire ? 'ri-fire-fill text-orange-400' : 'ri-fire-line'
        )}
      />
      <span className="font-heading font-bold tabular-nums">{streak}</span>
      <span className="text-xs text-zinc-500">
        {streak === 1 ? 'day' : 'days'}
      </span>
    </div>
  )
}
