import { NextResponse } from "next/server";
import { importGuest } from "@/lib/server/accounts";
import { currentUserId } from "@/lib/server/supabase";

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { tokens?: unknown } | null;
  await importGuest(userId, body?.tokens);
  return new NextResponse(null, { status: 204 });
}
