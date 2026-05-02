import { cn } from '@/lib/utils'
import type { Difficulty } from '@prisma/client'

interface DifficultyBadgeProps {
  difficulty: Difficulty
  className?: string
}

const config: Record<Difficulty, { label: string; className: string }> = {
  EASY: {
    label: 'Easy',
    className: 'bg-green-500/10 text-green-400 border border-green-500/20',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  },
  HARD: {
    label: 'Hard',
    className: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const { label, className: diffClass } = config[difficulty]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-wide',
        diffClass,
        className
      )}
    >
      {label}
    </span>
  )
}
