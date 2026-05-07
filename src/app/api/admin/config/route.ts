import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/admin-auth";
import { STAR_REWARD_DEFAULTS, TIME_LIMIT_DEFAULTS } from "@/lib/game-config";

export async function GET() {
  const { error } = await getAdminUserId();
  if (error) return error;

  const allKeys = [
    ...Object.keys(STAR_REWARD_DEFAULTS),
    ...Object.keys(TIME_LIMIT_DEFAULTS),
  ];

  const configs = await prisma.appConfig.findMany({
    where: { key: { in: allKeys } },
  });

  const configMap = Object.fromEntries(
    configs.map((c) => [c.key, parseInt(c.value)]),
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

  return NextResponse.json({ starRewards, timeLimits });
}

export async function PATCH(req: Request) {
  const { error } = await getAdminUserId();
  if (error) return error;

  const body = await req.json().catch(() => null);

  const allDefaults = { ...STAR_REWARD_DEFAULTS, ...TIME_LIMIT_DEFAULTS };
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
