import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAdminUserId } from '@/lib/admin-auth'

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await getAdminUserId()
    if (error) return error

    const { id } = await params
    await prisma.starCode.delete({ where: { id } })
    return NextResponse.json({ ok: true })
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await getAdminUserId()
    if (error) return error

    const { id } = await params
    const body = await req.json().catch(() => null)

    const parsed = z.object({
        expiresAt: z.string().datetime().nullable().optional(),
        maxUses: z.number().int().min(1).nullable().optional(),
        note: z.string().max(200).optional(),
    }).safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const code = await prisma.starCode.update({
        where: { id },
        data: {
            ...(parsed.data.expiresAt !== undefined && { expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null }),
            ...(parsed.data.maxUses !== undefined && { maxUses: parsed.data.maxUses }),
            ...(parsed.data.note !== undefined && { note: parsed.data.note }),
        },
    })

    return NextResponse.json({ code })
}