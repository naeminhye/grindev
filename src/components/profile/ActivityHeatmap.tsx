'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

type DayActivity = {
    date: string
    solved: boolean
    isMakeup: boolean
    hasDSA: boolean
    hasQuiz: boolean
    hasMakeup: boolean
}

interface ActivityHeatmapProps {
    activity: DayActivity[]
    currentStreak: number
    longestStreak: number
}

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CELL_PX = 13
const CELL_GAP = 2    // gap between cells within a month
const MONTH_GAP = 8   // extra gap between months

type Cell = {
    date: string
    solved: boolean
    isMakeup: boolean
    hasDSA: boolean
    hasQuiz: boolean
    hasMakeup: boolean
} | null

type MonthGroup = {
    month: number
    year: number
    label: string
    weeks: Cell[][]
}

export function ActivityHeatmap({ activity, currentStreak, longestStreak }: ActivityHeatmapProps) {
    const monthGroups = useMemo((): MonthGroup[] => {
        const activityMap = new Map<string, DayActivity>()
        for (const day of activity) activityMap.set(day.date, day)

        const today = new Date()

        // Start from Sunday 26 weeks ago
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - 26 * 7)
        startDate.setDate(startDate.getDate() - startDate.getDay())

        // Build all days grouped by month
        const monthMap = new Map<string, { month: number; year: number; days: { date: string; dayOfWeek: number; cell: Cell }[] }>()

        const cursor = new Date(startDate)
        while (cursor <= today) {
            const dateStr = cursor.toLocaleDateString('en-CA')
            const month = cursor.getMonth()
            const year = cursor.getFullYear()
            const key = `${year}-${month}`

            if (!monthMap.has(key)) {
                monthMap.set(key, { month, year, days: [] })
            }

            monthMap.get(key)!.days.push({
                date: dateStr,
                dayOfWeek: cursor.getDay(),
                cell: activityMap.get(dateStr) ?? {
                    date: dateStr,
                    solved: false,
                    isMakeup: false,
                    hasDSA: false,
                    hasQuiz: false,
                    hasMakeup: false,
                },
            })

            cursor.setDate(cursor.getDate() + 1)
        }

        // Convert each month's days into week columns (Sun=0 ... Sat=6)
        return [...monthMap.values()].map(({ month, year, days }) => {
            const weeks: Cell[][] = []
            let currentWeek: Cell[] = new Array(days[0].dayOfWeek).fill(null) // pad start

            for (const { cell } of days) {
                currentWeek.push(cell)
                if (currentWeek.length === 7) {
                    weeks.push(currentWeek)
                    currentWeek = []
                }
            }

            // Pad last week
            if (currentWeek.length > 0) {
                while (currentWeek.length < 7) currentWeek.push(null)
                weeks.push(currentWeek)
            }

            return {
                month,
                year,
                label: MONTHS[month],
                weeks,
            }
        })
    }, [activity])


    function getCellColor(cell: Cell): string {
        if (!cell) return 'bg-transparent border-transparent'
        if (!cell.solved && !cell.hasMakeup) return 'bg-zinc-800 border-zinc-700/40'
        if (cell.hasDSA && cell.hasQuiz) return 'bg-lime-300 border-lime-200/60'   // both — lightest (most intense)
        if (cell.hasDSA) return 'bg-lime-500 border-lime-400/60'                 // dsa
        if (cell.hasQuiz) return 'bg-lime-600 border-lime-500/60'                 // quiz
        if (cell.hasMakeup) return 'bg-lime-900 border-lime-800/60'                 // makeup — darkest lime
        return 'bg-zinc-800 border-zinc-700/40'
    }

    function getTooltip(cell: Cell): string {
        if (!cell) return ''
        const parts: string[] = [cell.date]
        if (cell.hasDSA) parts.push('DSA ✓')
        if (cell.hasQuiz) parts.push('Quiz ✓')
        if (cell.hasMakeup) parts.push('Make-up ✓')
        if (!cell.solved && !cell.hasMakeup) parts.push('No activity')
        return parts.join(' · ')
    }

    return (
        <div className="space-y-3">
            <div className="overflow-x-auto pb-1">
                <div className="inline-flex flex-col gap-0">

                    {/* Month labels row */}
                    <div className="flex items-end mb-1.5" style={{ paddingLeft: 24 }}>
                        {monthGroups.map((mg, i) => {
                            const groupWidth = mg.weeks.length * (CELL_PX + CELL_GAP) - CELL_GAP
                            return (
                                <div
                                    key={`${mg.year}-${mg.month}`}
                                    className="shrink-0 text-[10px] font-mono text-zinc-400 select-none"
                                    style={{
                                        width: groupWidth,
                                        marginRight: i < monthGroups.length - 1 ? MONTH_GAP : 0,
                                    }}
                                >
                                    {mg.label}
                                </div>
                            )
                        })}
                    </div>

                    {/* Day labels + grid */}
                    <div className="flex" style={{ gap: CELL_GAP }}>
                        {/* Day-of-week labels */}
                        <div className="flex flex-col shrink-0" style={{ gap: CELL_GAP, width: 20 }}>
                            {DAY_INITIALS.map((d, i) => (
                                <div
                                    key={i}
                                    className="text-[9px] font-mono text-zinc-600 flex items-center justify-end select-none"
                                    style={{
                                        height: CELL_PX,
                                        paddingRight: 3,
                                        visibility: [1, 3, 5].includes(i) ? 'visible' : 'hidden',
                                    }}
                                >
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Month groups */}
                        <div className="flex" style={{ gap: MONTH_GAP }}>
                            {monthGroups.map((mg, mi) => (
                                <div
                                    key={`${mg.year}-${mg.month}`}
                                    className="flex shrink-0"
                                    style={{ gap: CELL_GAP }}
                                >
                                    {mg.weeks.map((week, wi) => (
                                        <div key={wi} className="flex flex-col shrink-0" style={{ gap: CELL_GAP }}>
                                            {week.map((cell, di) => (
                                                <div
                                                    key={di}
                                                    title={getTooltip(cell)}
                                                    className={cn(
                                                        'rounded-sm border shrink-0 transition-all',
                                                        getCellColor(cell),
                                                        cell !== null ? 'hover:brightness-125 cursor-default' : '',
                                                    )}
                                                    style={{ width: CELL_PX, height: CELL_PX }}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend + streak stats */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    {[
                        { color: 'bg-lime-300', label: 'DSA + Quiz' },
                        { color: 'bg-lime-500', label: 'DSA' },
                        { color: 'bg-lime-600', label: 'Quiz' },
                        { color: 'bg-lime-900', label: 'Make-up' },
                        { color: 'bg-zinc-800 border border-zinc-700', label: 'None' },
                    ].map(({ color, label }) => (
                        <span key={label} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                            <span className={cn('w-2.5 h-2.5 rounded-sm inline-block shrink-0', color)} />
                            {label}
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-zinc-500">
                        Longest: <span className="text-yellow-400 font-bold">{longestStreak}</span>
                        <span className="text-zinc-600 ml-1">days</span>
                    </span>
                    <span className="text-zinc-500">
                        Current: <span className="text-lime-400 font-bold">{currentStreak}</span>
                        <span className="text-zinc-600 ml-1">days</span>
                    </span>
                </div>
            </div>
        </div>
    )
}