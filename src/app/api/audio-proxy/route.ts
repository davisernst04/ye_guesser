import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    if (
      !url.startsWith("https://cdns-preview") &&
      !url.startsWith("https://cdnt-preview")
    ) {
      return NextResponse.json(
        { error: "Invalid URL source" },
        { status: 400 },
      );
    }

    const headers = new Headers({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });

    const range = request.headers.get("range");
    if (range) {
      headers.set("Range", range);
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Upstream audio fetch failed" },
        { status: response.status },
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Type",
      response.headers.get("Content-Type") || "audio/mpeg",
    );
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Cache-Control", "public, max-age=3600");
    responseHeaders.set("Accept-Ranges", "bytes");

    if (response.headers.has("Content-Length")) {
      responseHeaders.set(
        "Content-Length",
        response.headers.get("Content-Length")!,
      );
    }
    if (response.headers.has("Content-Range")) {
      responseHeaders.set(
        "Content-Range",
        response.headers.get("Content-Range")!,
      );
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Audio proxy error:", error);
    return NextResponse.json(
      { error: "Failed to proxy audio" },
      { status: 500 },
    );
  }
}
