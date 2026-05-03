import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Drop-in replacement for Clerk's auth() in API routes.
 * Returns { userId } or a 401 response.
 */
export async function getAuthUserId(): Promise<
  { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { userId: session.user.id };
}
