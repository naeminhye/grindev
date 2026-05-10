import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";
import {
  AI_COST_DEFAULTS,
  allKeys,
  STAR_REWARD_DEFAULTS,
  TIME_LIMIT_DEFAULTS,
} from "@/lib/game-config";
import { QUIZ_STAR_DEFAULTS } from "@/lib/quiz-rewards";

export async function GET() {
  const { error } = await getAdminUserId();
  if (error) return error;

  const configs = await prisma.appConfig.findMany({
    where: { key: { in: allKeys } },
  });

  const configMap = Object.fromEntries(
    configs.map((c: { key: any; value: string; }) => [c.key, parseInt(c.value)]),
  );

  // Merge with defaults
  const starRewards = Object.fromEntries(
    Object.entries(STAR_REWARD_DEFAULTS).map(([k, v]) => [
      k,
      configMap[k] ?? v,
    ]),
  );
  const timeLimits = Object.fromEntries(
    Object.entries(TIME_LIMIT_DEFAULTS).map(([k, v]) => [k, configMap[k] ?? v]),
  );
  const aiCosts = Object.fromEntries(
    Object.entries(AI_COST_DEFAULTS).map(([k, v]) => [k, configMap[k] ?? v]),
  );
  return NextResponse.json({ starRewards, timeLimits, aiCosts });
}

export async function PATCH(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);

  const allDefaults = {
    ...STAR_REWARD_DEFAULTS,
    ...TIME_LIMIT_DEFAULTS,
    ...QUIZ_STAR_DEFAULTS,
    ...AI_COST_DEFAULTS,
  };
  const schema = z.record(z.string(), z.number().int());
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const validKeys = new Set(Object.keys(allDefaults));
  const updates = Object.entries(parsed.data).filter(([k]) => validKeys.has(k));

  await Promise.all(
    updates.map(([key, value]) =>
      prisma.appConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
