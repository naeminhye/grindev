import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAdminUserId } from '@/lib/admin-auth'

const createSchema = z.object({
    code: z.string().min(3).max(32).toUpperCase().regex(/^[A-Z0-9_-]+$/, 'Only uppercase letters, numbers, hyphens and underscores'),
    stars: z.number().int().min(1).max(10000),
    maxUses: z.number().int().min(1).optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
    note: z.string().max(200).optional(),
})

export async function GET() {
    const { error, email } = await getAdminUserId()
    if (error) return error

    const codes = await prisma.starCode.findMany({
        include: { _count: { select: { redemptions: true } } },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ codes })
}

export async function POST(req: Request) {
    const { error, email } = await getAdminUserId()
    if (error) return error

    const body = await req.json().catch(() => null)
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { code, stars, maxUses, expiresAt, note } = parsed.data

    const existing = await prisma.starCode.findUnique({ where: { code } })
    if (existing) {
        return NextResponse.json({ error: 'Code already exists.' }, { status: 409 })
    }

    const starCode = await prisma.starCode.create({
        data: {
            code,
            stars,
            maxUses: maxUses ?? null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: email ?? 'admin',
            note: note ?? null,
        },
    })

    return NextResponse.json({ starCode }, { status: 201 })
}