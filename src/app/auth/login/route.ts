import { NextResponse, type NextRequest } from "next/server";
import { accountsEnabled, authClient, safeNext } from "@/lib/server/supabase";

const PROVIDERS = ["google", "discord"] as const;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const provider = PROVIDERS.find((p) => p === searchParams.get("provider"));
  const next = safeNext(searchParams.get("next"));
  if (!accountsEnabled || !provider) return NextResponse.redirect(new URL(next, origin));

  const { data, error } = await (await authClient()).auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return NextResponse.redirect(new URL(`${next}?login=failed`, origin));
  return NextResponse.redirect(data.url);
}
