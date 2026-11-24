import { NextResponse } from "next/server";
import { savedDaily } from "@/lib/server/accounts";
import { isPlayablePuzzle, startDaily, startUnlimited } from "@/lib/server/session";
import { currentUserId } from "@/lib/server/supabase";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { mode?: unknown; puzzle?: unknown } | null;
  if (body?.mode === "unlimited") return NextResponse.json(startUnlimited());
  if (body?.mode === "daily" && isPlayablePuzzle(body.puzzle)) {
    // A logged-in player who already finished this puzzle gets that game back.
    const userId = await currentUserId();
    const saved = userId ? await savedDaily(userId, body.puzzle) : null;
    return NextResponse.json(saved ?? startDaily(body.puzzle));
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
