import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth-helper'
import { getTodayInTz } from '@/lib/streak'
import { StarTransactionReason } from '@prisma/client'

const schema = z.object({
  problemId: z.string().min(1),
  tier: z.number().int().min(1).max(4),
})

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const { problemId, tier } = parsed.data


  const timeZone =
    (req.headers.get("x-timezone") ??
      decodeURIComponent(
        req.headers.get("cookie")?.match(/tz=([^;]+)/)?.[1] ?? "",
      )) ||
    "UTC";

  const today = getTodayInTz(timeZone)

  const problem = await prisma.problem.findUnique({ where: { id: problemId, deletedAt: null } })
  if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 })

  const hints = problem.hints as any[]
  const hint = hints.find((h) => h.tier === tier)
  if (!hint) return NextResponse.json({ error: 'Hint not found' }, { status: 404 })

  const existing = await prisma.hintPurchase.findFirst({ where: { userId, problemId, tier } })
  if (existing) return NextResponse.json({ error: 'Already purchased' }, { status: 400 })

  // ── Check for active hint day pass ────────────────────────────────────
  // Day pass: purchased today, each pass gives 50% off all hints for today
  // Count passes purchased today vs used today
  const [passesToday, passesUsedToday] = await Promise.all([
    prisma.starTransaction.count({
      where: { userId, reason: StarTransactionReason.HINT_DISCOUNT_PURCHASE, createdAt: { gte: new Date(today + 'T00:00:00') } },
    }),
    prisma.starTransaction.count({
      where: { userId, reason: StarTransactionReason.HINT_DISCOUNT_USED, createdAt: { gte: new Date(today + 'T00:00:00') } },
    }),
  ])
  const hasActivePass = passesToday > passesUsedToday

  // 50% off, rounded up (so tier 1 cost 1 = still 1, tier 3 cost 7 = 4)
  const baseCost: number = hint.cost
  const cost = hasActivePass ? Math.ceil(baseCost * 0.5) : baseCost

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stars: true } })
  if (!user || user.stars < cost) {
    return NextResponse.json({ error: 'Not enough stars' }, { status: 400 })
  }

  // Transact
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { stars: { decrement: cost } },
    }),
    prisma.hintPurchase.create({
      data: { userId, problemId, tier, cost },
    }),
    prisma.starTransaction.create({
      data: { userId, amount: -cost, reason: 'HINT_PURCHASE' },
    }),
    ...(hasActivePass ? [
      prisma.starTransaction.create({
        data: { userId, amount: 0, reason: 'HINT_DISCOUNT_USED' as any },
      }),
    ] : []),
  ])

  const freshUser = await prisma.user.findUnique({ where: { id: userId }, select: { stars: true } })

  return NextResponse.json({
    content: hint.content,
    tier,
    starsRemaining: freshUser?.stars ?? 0,
    discountApplied: hasActivePass,
    savedStars: hasActivePass ? baseCost - cost : 0,
  })
}