'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { ActivityHeatmap } from '@/components/profile/ActivityHeatmap'

const TOPIC_LABELS: Record<string, string> = {
  JAVASCRIPT: 'JavaScript', TYPESCRIPT: 'TypeScript', PYTHON: 'Python',
  CSS: 'CSS', HTML: 'HTML', REACT: 'React', NODE: 'Node.js',
  DATABASES: 'Databases', SYSTEM_DESIGN: 'System Design', GENERAL_CS: 'General CS',
}

type Tab = 'DSA' | 'QUIZ'

type ProfileStats = {
  currentStreak: number
  longestStreak: number
  stars: number
  challengeMode: string
  practiceMode: string
  // DSA
  totalSolves: number
  cleanSolves: number
  hardModeSolves: number
  totalAttempts: number
  topicBreakdown: { topic: string; count: number }[]
  difficultyBreakdown: { difficulty: string; count: number }[]
  // Quiz
  totalQuizzes: number
  perfectQuizzes: number
  avgScore: number
  quizTopicBreakdown: { topic: string; count: number }[]
  quizDifficultyBreakdown: { difficulty: string; count: number }[]
  // Heatmap
  recentActivity: {
    date: string
    solved: boolean
    isMakeup: boolean
    hasDSA: boolean
    hasQuiz: boolean
    hasMakeup: boolean
  }[]
}

export default function ProfilePage() {
  const { t } = useI18n()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [tab, setTab] = useState<Tab>('DSA')

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
        // Default to user's current practice mode tab
        setTab(data.practiceMode === 'QUIZ' ? 'QUIZ' : 'DSA')
      })
  }, [])

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-lime-400 text-xl" />
      </div>
    )
  }

  const cleanRate = stats.totalSolves > 0
    ? Math.round((stats.cleanSolves / stats.totalSolves) * 100)
    : 0
  const avgAttempts = stats.totalSolves > 0
    ? (stats.totalAttempts / stats.totalSolves).toFixed(1)
    : '—'

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6 md:space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
          {t('profile.title')}
        </h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">{t('profile.desc')}</p>
      </div>

      {/* Key stats — always visible */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t('profile.streak'), value: stats.currentStreak, suffix: 'days', icon: 'ri-fire-line', color: 'text-lime-400' },
          { label: t('profile.best'), value: stats.longestStreak, suffix: 'days', icon: 'ri-trophy-line', color: 'text-yellow-400' },
          { label: t('profile.stars'), value: stats.stars, suffix: '', icon: 'ri-star-fill', color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[hsl(var(--surface))] border border-border rounded-md p-3 md:p-5 space-y-1">
            <div className="flex items-center gap-1.5">
              <i className={cn(s.icon, s.color, 'text-sm')} />
              <span className="text-xs font-mono text-zinc-500">{s.label}</span>
            </div>
            <div className={cn('font-heading font-bold text-2xl md:text-3xl', s.color)}>
              {s.value}
              {s.suffix && <span className="text-xs md:text-sm font-mono text-zinc-500 ml-1">{s.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Activity heatmap — always visible */}
      <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <i className="ri-calendar-check-line text-lime-400" />
          <span className="font-mono text-sm">{t('profile.last30Days')}</span>
        </div>
        <ActivityHeatmap
          activity={stats.recentActivity}
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          { id: 'DSA', label: 'DSA Problems', icon: 'ri-code-s-slash-line', count: stats.totalSolves },
          { id: 'QUIZ', label: 'Quizzes', icon: 'ri-questionnaire-line', count: (stats.totalQuizzes ?? 0) },
        ] as { id: Tab; label: string; icon: string; count: number }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px',
              tab === t.id
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300',
            )}
          >
            <i className={t.icon} />
            {t.label}
            <span className="text-zinc-600">({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── DSA Tab ──────────────────────────────────────────────────────── */}
      {tab === 'DSA' && (
        <>
          {/* DSA solve stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: t('profile.totalSolved'), value: stats.totalSolves, icon: 'ri-code-s-slash-line', color: 'text-zinc-300' },
              { label: t('profile.cleanSolves'), value: stats.cleanSolves, icon: 'ri-shield-star-line', color: 'text-lime-400' },
              { label: 'Hard mode', value: stats.hardModeSolves, icon: 'ri-sword-line', color: 'text-orange-400' },
              { label: t('profile.avgAttempts'), value: avgAttempts, icon: 'ri-refresh-line', color: 'text-blue-400' },
            ].map((s) => (
              <div key={s.label} className="bg-[hsl(var(--surface))] border border-border rounded-md p-3 md:p-4 space-y-1">
                <div className="flex items-center gap-1.5">
                  <i className={cn(s.icon, s.color, 'text-sm')} />
                  <span className="text-xs font-mono text-zinc-500">{s.label}</span>
                </div>
                <div className={cn('font-heading font-bold text-xl md:text-2xl', s.color)}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Clean rate */}
          <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="ri-shield-star-line text-lime-400" />
                <span className="font-mono text-sm">{t('profile.cleanRate')}</span>
              </div>
              <span className="font-heading font-bold text-lime-400">{cleanRate}%</span>
            </div>
            <div className="h-2 bg-[hsl(var(--surface-raised))] rounded-full overflow-hidden">
              <div className="h-full bg-lime-400 rounded-full transition-all duration-700" style={{ width: `${cleanRate}%` }} />
            </div>
            <p className="text-xs font-mono text-zinc-600">
              {t('profile.cleanRateDesc', { clean: stats.cleanSolves, total: stats.totalSolves })}
            </p>
          </div>

          {/* Topic breakdown */}
          {stats.topicBreakdown.length > 0 && (
            <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <i className="ri-bar-chart-box-line text-lime-400" />
                <span className="font-mono text-sm">{t('profile.byTopic')}</span>
              </div>
              <div className="space-y-2">
                {stats.topicBreakdown.map((item) => {
                  const pct = Math.round((item.count / stats.totalSolves) * 100)
                  return (
                    <div key={item.topic} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400">{item.topic.replace(/_/g, ' ')}</span>
                        <span className="text-zinc-500">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-[hsl(var(--surface-raised))] rounded-full overflow-hidden">
                        <div className="h-full bg-lime-400/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Difficulty breakdown */}
          {stats.difficultyBreakdown.length > 0 && (
            <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <i className="ri-pie-chart-line text-lime-400" />
                <span className="font-mono text-sm">{t('profile.byDifficulty')}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['EASY', 'MEDIUM', 'HARD'].map((d) => {
                  const entry = stats.difficultyBreakdown.find((x) => x.difficulty === d)
                  return (
                    <div key={d} className="text-center space-y-1">
                      <div className={cn(
                        'font-heading font-bold text-2xl',
                        d === 'EASY' ? 'text-green-400' : d === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400',
                      )}>
                        {entry?.count ?? 0}
                      </div>
                      <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{d}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Quiz Tab ─────────────────────────────────────────────────────── */}
      {tab === 'QUIZ' && (
        <>
          {/* Quiz stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total quizzes', value: (stats.totalQuizzes ?? 0), icon: 'ri-questionnaire-line', color: 'text-zinc-300' },
              { label: 'Perfect score', value: (stats.perfectQuizzes ?? 0), icon: 'ri-star-fill', color: 'text-yellow-400' },
              { label: 'Avg score', value: `${(stats.avgScore ?? 0)}%`, icon: 'ri-percent-line', color: 'text-lime-400' },
            ].map((s) => (
              <div key={s.label} className="bg-[hsl(var(--surface))] border border-border rounded-md p-3 md:p-4 space-y-1">
                <div className="flex items-center gap-1.5">
                  <i className={cn(s.icon, s.color, 'text-sm')} />
                  <span className="text-xs font-mono text-zinc-500">{s.label}</span>
                </div>
                <div className={cn('font-heading font-bold text-xl md:text-2xl', s.color)}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Avg score bar */}
          {(stats.totalQuizzes ?? 0) > 0 && (
            <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-percent-line text-lime-400" />
                  <span className="font-mono text-sm">Average score</span>
                </div>
                <span className="font-heading font-bold text-lime-400">{(stats.avgScore ?? 0)}%</span>
              </div>
              <div className="h-2 bg-[hsl(var(--surface-raised))] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    (stats.avgScore ?? 0) === 100 ? 'bg-lime-400' : (stats.avgScore ?? 0) >= 80 ? 'bg-green-400' : (stats.avgScore ?? 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                  )}
                  style={{ width: `${(stats.avgScore ?? 0)}%` }}
                />
              </div>
              <p className="text-xs font-mono text-zinc-600">
                {(stats.perfectQuizzes ?? 0)} perfect score{(stats.perfectQuizzes ?? 0) !== 1 ? 's' : ''} out of {(stats.totalQuizzes ?? 0)} total
              </p>
            </div>
          )}

          {/* Quiz topic breakdown */}
          {(stats.quizTopicBreakdown ?? []).length > 0 && (
            <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <i className="ri-bar-chart-box-line text-lime-400" />
                <span className="font-mono text-sm">By topic</span>
              </div>
              <div className="space-y-2">
                {(stats.quizTopicBreakdown ?? []).map((item) => {
                  const pct = Math.round((item.count / (stats.totalQuizzes ?? 0)) * 100)
                  return (
                    <div key={item.topic} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400">{TOPIC_LABELS[item.topic] ?? item.topic}</span>
                        <span className="text-zinc-500">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-[hsl(var(--surface-raised))] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quiz difficulty breakdown */}
          {(stats.quizDifficultyBreakdown ?? []).length > 0 && (
            <div className="bg-[hsl(var(--surface))] border border-border rounded-md p-4 md:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <i className="ri-pie-chart-line text-lime-400" />
                <span className="font-mono text-sm">By difficulty</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['EASY', 'MEDIUM', 'HARD'].map((d) => {
                  const entry = (stats.quizDifficultyBreakdown ?? []).find((x) => x.difficulty === d)
                  return (
                    <div key={d} className="text-center space-y-1">
                      <div className={cn(
                        'font-heading font-bold text-2xl',
                        d === 'EASY' ? 'text-green-400' : d === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400',
                      )}>
                        {entry?.count ?? 0}
                      </div>
                      <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{d}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(stats.totalQuizzes ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
              <i className="ri-questionnaire-line text-4xl text-zinc-700" />
              <p className="font-mono text-sm text-zinc-500">No quizzes completed yet.</p>
              <p className="text-xs font-mono text-zinc-600">Switch to Quiz mode in Settings to get started.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}