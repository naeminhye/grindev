import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export const DEFAULT_REVIEW_COST = 5;

function buildSystemPrompt(): string {
  return `You are an experienced software engineer doing a code review. Your job is to review a developer's solution to a DSA (Data Structures and Algorithms) problem.

Your review must cover:
1. **Correctness** — Does the logic handle all cases, including edge cases?
2. **Time & Space Complexity** — What is the Big O? Is it optimal?
3. **Code Quality** — Naming, readability, structure, unnecessary operations
4. **Edge Cases** — Any inputs that might break the solution?
5. **Suggestions** — Concrete improvements (but don't rewrite the whole thing)

Format with ## sections. Use \`code\` for variable names and short snippets.
Be constructive and specific. If the solution is good, say so clearly.
Do NOT solve the problem for them if they haven't — only review what they submitted.`;
}

function buildUserPrompt(
  problemTitle: string,
  problemDescription: string,
  code: string,
  language: string,
  passed: boolean,
): string {
  return `Please review my solution to this problem:

**Problem:** ${problemTitle}
**Language:** ${language}
**All tests passed:** ${passed ? "Yes" : "No"}

**My solution:**
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

**Problem description:**
${problemDescription}

Please give me a constructive code review.`;
}

export async function POST(req: Request) {
  const { userId, error } = await getAuthUserId();
  if (error) return error;

  const {
    problemId,
    problemTitle,
    problemDescription,
    code,
    language,
    passed,
  } = await req.json();

  if (!problemId || !code || !problemTitle) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 503 },
    );
  }

  // ── Deduct stars ──────────────────────────────────────────────────────
  const [costConfig, user] = await Promise.all([
    prisma.appConfig.findUnique({ where: { key: "AI_CODE_REVIEW_COST" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { stars: true } }),
  ]);
  const cost = costConfig ? parseInt(costConfig.value) : DEFAULT_REVIEW_COST;

  if (!user || user.stars < cost) {
    return NextResponse.json(
      { error: `Not enough stars. Code review costs ${cost} stars.`, cost },
      { status: 402 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { stars: { decrement: cost } },
  });
  await prisma.starTransaction.create({
    data: { userId, amount: -cost, reason: "AI_CODE_REVIEW" as any },
  });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildUserPrompt(
                  problemTitle,
                  problemDescription,
                  code,
                  language,
                  passed,
                ),
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini review error:", response.status, err);
      // Refund
      await prisma.user.update({
        where: { id: userId },
        data: { stars: { increment: cost } },
      });
      await prisma.starTransaction.create({
        data: { userId, amount: cost, reason: "ADMIN_ADJUSTMENT" as any },
      });
      if (response.status === 429) {
        return NextResponse.json(
          { error: "AI service is busy. Please try again shortly." },
          { status: 429 },
        );
      }
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const review = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!review) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 },
      );
    }

    const freshUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { stars: true },
    });
    return NextResponse.json({ review, starsRemaining: freshUser?.stars });
  } catch (err) {
    console.error("AI review error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
