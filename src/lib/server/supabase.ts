// Supabase clients. Accounts are optional: without these env vars the game runs
// guest-only and every account route reports that accounts are off.
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type JwtPayload, type SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/account";

const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export const accountsEnabled = Boolean(url && publishableKey && secretKey);

/** Client that acts as the player, through their auth cookies. Used for login and logout only. */
export async function authClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(url!, publishableKey!, {
    // Only the server reads the auth cookies, so page scripts never get the session.
    cookieOptions: { httpOnly: true },
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

/** The logged-in player's verified token claims, or null. */
async function currentClaims(): Promise<JwtPayload | null> {
  if (!accountsEnabled) return null;
  const { data } = await (await authClient()).auth.getClaims();
  return data?.claims ?? null;
}

/** The logged-in player's user ID, verified with Supabase Auth, or null. */
export async function currentUserId(): Promise<string | null> {
  return (await currentClaims())?.sub ?? null;
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

/** Only provider avatar hosts that next.config.ts allows for next/image. */
function avatarUrl(value: unknown): string | null {
  try {
    const url = new URL(text(value) ?? "");
    const ok =
      url.protocol === "https:" &&
      (url.hostname === "lh3.googleusercontent.com" ||
        (url.hostname === "cdn.discordapp.com" && url.pathname.startsWith("/avatars/")));
    return ok ? url.href : null;
  } catch {
    return null;
  }
}

/** The logged-in player's ID and the profile their login provider sent, or null. */
export async function currentUser(): Promise<{ id: string; profile: Profile } | null> {
  const claims = await currentClaims();
  if (!claims) return null;
  const meta = claims.user_metadata ?? {};
  const provider = claims.app_metadata?.provider;
  return {
    id: claims.sub,
    profile: {
      provider: provider === "google" || provider === "discord" ? provider : null,
      name: text(meta.full_name) ?? text(meta.name),
      email: text(claims.email),
      // Discord sends "name#0"; the "#0" is a leftover of old Discord tags.
      handle: provider === "discord" ? (text(meta.name)?.replace(/#0$/, "") ?? null) : null,
      avatarUrl: avatarUrl(meta.avatar_url ?? meta.picture),
    },
  };
}

/** Where to send a player after login. Only our own game pages, never another site. */
export function safeNext(next: string | null): string {
  return next === "/unlimited" ? "/unlimited" : "/play";
}
