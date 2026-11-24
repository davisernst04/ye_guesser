import { NextResponse } from "next/server";
import { isPlayablePuzzle, startDaily, startUnlimited } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { mode?: unknown; puzzle?: unknown } | null;
  if (body?.mode === "unlimited") return NextResponse.json(startUnlimited());
  if (body?.mode === "daily" && isPlayablePuzzle(body.puzzle)) {
    return NextResponse.json(startDaily(body.puzzle));
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
