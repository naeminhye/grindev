import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getHintCost, canAffordHint } from '@/lib/hints'
import type { HintTier } from '@/lib/hints'
import type { HintData, HintResponse } from '@/types'

const bodySchema = z.object({
  problemId: z.string().min(1),
  tier: z.number().int().min(1).max(4),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { problemId, tier } = parsed.data as { problemId: string; tier: HintTier }

  // Check if already purchased this tier
  const existing = await prisma.hintPurchase.findFirst({
    where: { userId, problemId, tier },
  })

  if (existing) {
    // Already bought — just return the content without charging again
    const problem = await prisma.problem.findUnique({ where: { id: problemId } })
    const hints = problem?.hints as HintData[]
    const hint = hints?.find((h) => h.tier === tier)
    const user = await prisma.user.findUnique({ where: { id: userId } })

    return NextResponse.json({
      content: hint?.content ?? '',
      tier,
      starsRemaining: user?.stars ?? 0,
    } satisfies HintResponse)
  }

  // Check user can afford it
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const cost = getHintCost(tier)
  if (!canAffordHint(user.stars, tier)) {
    return NextResponse.json(
      { error: `Not enough stars. Need ${cost}, have ${user.stars}.` },
      { status: 402 }
    )
  }

  // Fetch the hint content
  const problem = await prisma.problem.findUnique({ where: { id: problemId } })
  if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 })

  const hints = problem.hints as HintData[]
  const hint = hints.find((h) => h.tier === tier)
  if (!hint) return NextResponse.json({ error: 'Hint not found' }, { status: 404 })

  // Deduct stars and record purchase in a transaction
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { stars: { decrement: cost } },
    }),
    prisma.hintPurchase.create({
      data: { userId, problemId, tier, cost },
    }),
  ])

  return NextResponse.json({
    content: hint.content,
    tier,
    starsRemaining: updatedUser.stars,
  } satisfies HintResponse)
}
