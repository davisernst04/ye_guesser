import { NextResponse } from "next/server";
import { guess } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: unknown; songId?: unknown } | null;
  const result = guess(body?.token, body?.songId ?? null);
  return NextResponse.json(result, { status: "error" in result ? 400 : 200 });
}
