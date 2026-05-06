import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth-helper";
import { getAdminUserId } from "@/lib/admin-auth";

export async function GET() {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const [user, bonusConfig] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { challengeMode: true, preferredDifficulty: true },
    }),
    prisma.appConfig.findUnique({ where: { key: "NO_PROBLEM_BONUS_STARS" } }),
  ]);

  return NextResponse.json({
    challengeMode: user?.challengeMode ?? "NORMAL",
    preferredDifficulty: user?.preferredDifficulty ?? "ANY",
    noProblemBonusStars: bonusConfig ? parseInt(bonusConfig.value) : 5,
  });
}

export async function PATCH(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      challengeMode: z.enum(["NORMAL", "HARD"]).optional(),
      preferredDifficulty: z.enum(["ANY", "EASY", "MEDIUM", "HARD"]).optional(),
      noProblemBonusStars: z.number().int().min(0).max(100).optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { noProblemBonusStars, ...userFields } = parsed.data;

  // Update user settings
  if (Object.keys(userFields).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: userFields,
    });
  }

  // Only admins can update bonus stars
  if (noProblemBonusStars !== undefined) {
    const { error: adminError } = await getAdminUserId();
    if (!adminError) {
      await prisma.appConfig.upsert({
        where: { key: "NO_PROBLEM_BONUS_STARS" },
        update: { value: String(noProblemBonusStars) },
        create: {
          key: "NO_PROBLEM_BONUS_STARS",
          value: String(noProblemBonusStars),
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
