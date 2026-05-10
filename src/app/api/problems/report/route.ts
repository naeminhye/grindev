// src/app/api/problems/report/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUserId } from '@/lib/auth-helper'

const schema = z.object({
    problemId: z.string().min(1),
    reason: z.enum(['WRONG_TEST_CASE', 'WRONG_EXPECTED_OUTPUT', 'UNCLEAR_DESCRIPTION', 'BROKEN_STARTER_CODE', 'OTHER']),
    description: z.string().max(500).optional(),
})

export async function POST(req: Request) {
    const { userId, error } = await getAuthUserId()
    if (error) return error

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const { problemId, reason, description } = parsed.data

    const problem = await prisma.problem.findUnique({
        where: { id: problemId, deletedAt: null },
        select: { id: true },
    })
    if (!problem) {
        return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
    }

    // Upsert — update if already reported
    const report = await prisma.problemReport.upsert({
        where: { userId_problemId: { userId, problemId } },
        update: { reason, description, status: 'OPEN', updatedAt: new Date() },
        create: { userId, problemId, reason, description },
    })

    return NextResponse.json({ ok: true, reportId: report.id })
}