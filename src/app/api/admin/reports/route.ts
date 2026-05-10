// src/app/api/admin/reports/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUserId } from '@/lib/admin-auth'

export async function GET(req: Request) {
    const { error } = await getAdminUserId()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? ''

    const reports = await prisma.problemReport.findMany({
        where: status ? { status: status as any } : {},
        include: {
            problem: { select: { id: true, title: true, difficulty: true, slug: true } },
            user: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reports })
}

export async function PATCH(req: Request) {
    const { error } = await getAdminUserId()
    if (error) return error

    const { reportId, status } = await req.json()
    if (!reportId || !status) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existing = await prisma.problemReport.findUnique({
        where: { id: reportId },
        select: { status: true, userId: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const report = await prisma.problemReport.update({
        where: { id: reportId },
        data: { status },
    })

    // Award stars when moving to RESOLVED for the first time
    if (status === 'RESOLVED' && existing.status !== 'RESOLVED') {
        try {
            const rewardConfig = await prisma.appConfig.findUnique({
                where: { key: 'REPORT_ACCEPTED_REWARD' },
            })
            const reward = rewardConfig ? parseInt(rewardConfig.value) : 5

            await prisma.user.update({
                where: { id: existing.userId },
                data: { stars: { increment: reward } },
            })
            await prisma.starTransaction.create({
                data: {
                    userId: existing.userId,
                    amount: reward,
                    reason: 'REPORT_ACCEPTED' as any,
                },
            })
            console.log(`[reports] awarded ${reward} stars to ${existing.userId}`)
        } catch (err) {
            console.error('[reports] failed to award stars:', err)
        }
    }

    return NextResponse.json({ report })
}