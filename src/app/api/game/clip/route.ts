import { NextResponse } from "next/server";
import { fetchPreview, sliceMp3 } from "@/lib/server/clip";
import { clipFor } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const clip = clipFor(body?.token);
  if (!clip) return NextResponse.json({ error: "Invalid game" }, { status: 400 });

  try {
    const audio = sliceMp3(await fetchPreview(clip.songId), clip.seconds);
    return new NextResponse(Buffer.from(audio), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Clip error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Audio unavailable" }, { status: 502 });
  }
}
