import { getAuthUserId } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId, error } = await getAuthUserId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { challengeMode: true },
  });

  return NextResponse.json({ challengeMode: user?.challengeMode ?? "NORMAL" });
}

export async function PATCH(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return NextResponse.json({ error }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      challengeMode: z.enum(["NORMAL", "HARD"]),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { challengeMode: parsed.data.challengeMode },
    select: { challengeMode: true },
  });

  return NextResponse.json({ challengeMode: user.challengeMode });
}
