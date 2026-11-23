import { NextResponse } from "next/server";
import { accountsEnabled, authClient } from "@/lib/server/supabase";

export async function POST() {
  if (accountsEnabled) await (await authClient()).auth.signOut({ scope: "local" });
  return new NextResponse(null, { status: 204 });
}
