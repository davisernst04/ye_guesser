import { NextResponse } from "next/server";
import { saveFavorites } from "@/lib/server/accounts";
import { currentUserId } from "@/lib/server/supabase";

export async function PUT(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { albums?: unknown } | null;
  if (!(await saveFavorites(userId, body?.albums))) {
    return NextResponse.json({ error: "Pick up to 4 different albums." }, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}
