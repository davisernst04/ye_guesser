// Supabase clients. Accounts are optional: without these env vars the game runs
// guest-only and every account route reports that accounts are off.
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export const accountsEnabled = Boolean(url && publishableKey && secretKey);

/** Client that acts as the player, through their auth cookies. Used for login and logout only. */
export async function authClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(url!, publishableKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
}

let adminClient: SupabaseClient | undefined;

/** Server-only client that bypasses RLS. Every query must filter by a verified user ID. */
export function admin(): SupabaseClient {
  adminClient ??= createClient(url!, secretKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

/** The logged-in player's user ID, verified with Supabase Auth, or null. */
export async function currentUserId(): Promise<string | null> {
  if (!accountsEnabled) return null;
  const { data } = await (await authClient()).auth.getClaims();
  return data?.claims.sub ?? null;
}

/** Where to send a player after login. Only our own game pages, never another site. */
export function safeNext(next: string | null): string {
  return next === "/unlimited" ? "/unlimited" : "/play";
}
