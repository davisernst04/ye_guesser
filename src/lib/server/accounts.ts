// Account data. Only the server writes it; see supabase/migrations.
import "server-only";
import { resultOf } from "@/lib/game";
import type { Results } from "@/lib/stats";
import { finishedDaily } from "@/lib/server/session";
import { admin } from "@/lib/server/supabase";

export async function loadResults(userId: string): Promise<Results> {
  const { data, error } = await admin().from("results").select("puzzle, guesses").eq("user_id", userId);
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.puzzle, row.guesses]));
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

/** Deletes the auth user. The database deletes their results with it. */
export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await admin().auth.admin.deleteUser(userId);
  if (error) throw error;
}
