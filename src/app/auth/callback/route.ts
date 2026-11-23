import { NextResponse, type NextRequest } from "next/server";
import { accountsEnabled, authClient, safeNext } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  if (!accountsEnabled || !code) return NextResponse.redirect(new URL(`${next}?login=failed`, origin));

  const { error } = await (await authClient()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? `${next}?login=failed` : next, origin));
}
