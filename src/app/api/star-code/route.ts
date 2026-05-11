import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth-helper'
import { StarTransactionReason } from '@prisma/client'

const schema = z.object({
    code: z.string().min(1).max(32).toUpperCase(),
})

export async function POST(req: Request) {
    const { userId, error } = await getAuthUserId()
    if (error) return error

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid code format.' }, { status: 400 })
    }

    const { code } = parsed.data

    const starCode = await prisma.starCode.findUnique({ where: { code } })

    // Code not found
    if (!starCode) {
        return NextResponse.json({ error: 'Invalid code. Please check and try again.' }, { status: 404 })
    }

    // Expired
    if (starCode.expiresAt && new Date() > starCode.expiresAt) {
        return NextResponse.json({
            error: `This code expired on ${starCode.expiresAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}.`,
            expired: true,
        }, { status: 410 })
    }

    // Max uses reached
    if (starCode.maxUses !== null && starCode.usedCount >= starCode.maxUses) {
        return NextResponse.json({
            error: 'This code has already been fully redeemed.',
            exhausted: true,
        }, { status: 410 })
    }

    // Already redeemed by this user
    const existing = await prisma.starCodeRedemption.findUnique({
        where: { codeId_userId: { codeId: starCode.id, userId } },
    })
    if (existing) {
        return NextResponse.json({
            error: 'You have already redeemed this code.',
            alreadyUsed: true,
        }, { status: 409 })
    }

    // Redeem — atomic transaction
    const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { stars: { increment: starCode.stars } },
        }),
        prisma.starCodeRedemption.create({
            data: { codeId: starCode.id, userId },
        }),
        prisma.starCode.update({
            where: { id: starCode.id },
            data: { usedCount: { increment: 1 } },
        }),
        prisma.starTransaction.create({
            data: {
                userId,
                amount: starCode.stars,
                reason: StarTransactionReason.STAR_CODE_REDEMPTION,
                meta: { code: starCode.code },
            },
        }),
    ])

    return NextResponse.json({
        ok: true,
        stars: starCode.stars,
        newBalance: updatedUser.stars,
        message: `+${starCode.stars} stars added to your account!`,
    })
}