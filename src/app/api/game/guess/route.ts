import { NextResponse } from "next/server";
import { recordGame } from "@/lib/server/accounts";
import { guess } from "@/lib/server/session";
import { currentUserId } from "@/lib/server/supabase";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: unknown; songId?: unknown } | null;
  const result = guess(body?.token, body?.songId ?? null);
  if ("error" in result) return NextResponse.json(result, { status: 400 });

  if (result.view.mode === "daily" && result.view.status !== "playing") {
    const userId = await currentUserId();
    if (userId) await recordGame(userId, result.token);
  }
  return NextResponse.json(result);
}
