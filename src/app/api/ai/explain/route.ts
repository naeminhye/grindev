import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth-helper";

export async function POST(req: Request) {
  const { error } = await getAuthUserId();
  if (error) return error;

  const { systemPrompt, userPrompt } = await req.json();

  if (!systemPrompt || !userPrompt) {
    return NextResponse.json({ error: "Missing prompts" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const explanation = data.content?.[0]?.text ?? "";

    return NextResponse.json({ explanation });
  } catch (err) {
    console.error("AI explain error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
