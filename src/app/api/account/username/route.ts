import { NextResponse } from "next/server";
import { setUsername } from "@/lib/server/accounts";
import { currentUserId } from "@/lib/server/supabase";

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { username?: unknown } | null;
  const error = await setUsername(userId, body?.username);
  return error ? NextResponse.json({ error }, { status: 400 }) : new NextResponse(null, { status: 204 });
}
