import { NextResponse } from "next/server";
import type { Account } from "@/lib/account";
import { deleteAccount, loadResults } from "@/lib/server/accounts";
import { accountsEnabled, authClient, currentUser, currentUserId } from "@/lib/server/supabase";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const user = await currentUser();
  const account: Account = user
    ? { enabled: true, user: { ...user.profile, results: await loadResults(user.id) } }
    : { enabled: accountsEnabled, user: null };
  return NextResponse.json(account, noStore);
}

export async function DELETE() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  await (await authClient()).auth.signOut({ scope: "local" });
  await deleteAccount(userId);
  return new NextResponse(null, { status: 204 });
}
