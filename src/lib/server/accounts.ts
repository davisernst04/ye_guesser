// Account data. Only the server writes it; see supabase/migrations.
import "server-only";
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";
import { resultOf } from "@/lib/game";
import type { Results } from "@/lib/stats";
import { finishedDaily } from "@/lib/server/session";
import { admin } from "@/lib/server/supabase";

export type AccountData = { username: string | null; results: Results };

export async function loadAccount(userId: string): Promise<AccountData> {
  const [profile, results] = await Promise.all([
    admin().from("profiles").select("username").eq("user_id", userId).maybeSingle(),
    admin().from("results").select("puzzle, guesses").eq("user_id", userId),
  ]);
  if (profile.error) throw profile.error;
  if (results.error) throw results.error;
  return {
    username: profile.data?.username ?? null,
    results: Object.fromEntries(results.data.map((row) => [row.puzzle, row.guesses])),
  };
}

/** Saves results. A puzzle that already has a result keeps it. */
async function saveResults(userId: string, results: Results): Promise<void> {
  const rows = Object.entries(results).map(([puzzle, guesses]) => ({ user_id: userId, puzzle: Number(puzzle), guesses }));
  if (!rows.length) return;
  const { error } = await admin()
    .from("results")
    .upsert(rows, { onConflict: "user_id,puzzle", ignoreDuplicates: true });
  if (error) throw error;
}

/** Records a finished daily game, given its sealed game token. */
export async function recordGame(userId: string, token: string): Promise<void> {
  const view = finishedDaily(token);
  if (view) await saveResults(userId, { [view.puzzle!]: resultOf(view) });
}

/**
 * Moves guest results into a new account. Each result must come with its sealed
 * game token, so a guest cannot make up results. An account that already has
 * history keeps its own, and the guest results are dropped.
 */
export async function importGuest(userId: string, tokens: unknown): Promise<void> {
  if (!Array.isArray(tokens)) return;
  const { count, error } = await admin()
    .from("results")
    .select("puzzle", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  if (count) return;

  const results: Results = {};
  for (const token of tokens.slice(0, 2000)) {
    const view = finishedDaily(token);
    if (view && !(view.puzzle! in results)) results[view.puzzle!] = resultOf(view);
  }
  await saveResults(userId, results);
}

const profanity = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });

/** Sets or clears (empty string) the username. Returns an error message for the player, or null. */
export async function setUsername(userId: string, input: unknown): Promise<string | null> {
  if (typeof input !== "string") return "Invalid username";
  const username = input.trim() || null;
  if (username !== null) {
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return "Use 3 to 20 letters, numbers or underscores";
    if (profanity.hasMatch(username.replaceAll("_", " "))) return "Pick a different username";
  }
  const { error } = await admin().from("profiles").upsert({ user_id: userId, username });
  if (error?.code === "23505") return "That username is taken";
  if (error) throw error;
  return null;
}

/** Deletes the auth user. The database deletes their profile and results with it. */
export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await admin().auth.admin.deleteUser(userId);
  if (error) throw error;
}
