import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export const DEFAULT_EXPLAIN_COST = 5;

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const { systemPrompt, userPrompt, problemId, free } = await req.json();
  if (!systemPrompt || !userPrompt) {
    return NextResponse.json({ error: "Missing prompts" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 503 },
    );
  }

  // ── Star cost (skip if free = cached result just needs re-fetch) ───────
  if (!free) {
    const [costConfig, user] = await Promise.all([
      prisma.appConfig.findUnique({ where: { key: "AI_EXPLAIN_COST" } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { stars: true },
      }),
    ]);
    const cost = costConfig ? parseInt(costConfig.value) : DEFAULT_EXPLAIN_COST;

    if (!user || user.stars < cost) {
      return NextResponse.json(
        {
          error: `Not enough stars. AI explanation costs ${cost} stars.`,
          cost,
        },
        { status: 402 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { stars: { decrement: cost } },
    });
    await prisma.starTransaction.create({
      data: { userId, amount: -cost, reason: "AI_EXPLAIN" as any },
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", response.status, err);
      // Refund stars on API failure
      if (!free) {
        const costConfig = await prisma.appConfig.findUnique({
          where: { key: "AI_EXPLAIN_COST" },
        });
        const cost = costConfig ? parseInt(costConfig.value) : DEFAULT_EXPLAIN_COST;
        await prisma.user.update({
          where: { id: userId },
          data: { stars: { increment: cost } },
        });
        await prisma.starTransaction.create({
          data: { userId, amount: cost, reason: "ADMIN_ADJUSTMENT" as any },
        });
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "AI service is busy. Please try again shortly." },
          { status: 429 },
        );
      }
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!explanation) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 },
      );
    }

    // Return updated star count
    const freshUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { stars: true },
    });
    return NextResponse.json({ explanation, starsRemaining: freshUser?.stars });
  } catch (err) {
    console.error("AI explain error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
