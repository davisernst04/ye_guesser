import { NextResponse } from "next/server";
import type { Account } from "@/lib/account";
import { deleteAccount, loadFavorites, loadResults } from "@/lib/server/accounts";
import { accountsEnabled, authClient, currentUser, currentUserId } from "@/lib/server/supabase";

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ enabled: accountsEnabled, user: null } satisfies Account, noStore);
  const [results, favorites] = await Promise.all([loadResults(user.id), loadFavorites(user.id)]);
  const account: Account = { enabled: true, user: { ...user.profile, results, favorites } };
  return NextResponse.json(account, noStore);
}

export async function DELETE() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  await (await authClient()).auth.signOut({ scope: "local" });
  await deleteAccount(userId);
  return new NextResponse(null, { status: 204 });
}
