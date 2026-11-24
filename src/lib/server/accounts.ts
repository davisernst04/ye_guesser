// Account data. Only the server writes it; see supabase/migrations.
import "server-only";
import { resultOf, type GameResponse, type GameView } from "@/lib/game";
import type { Results } from "@/lib/stats";
import { finishedDaily, restoreDaily } from "@/lib/server/session";
import { admin } from "@/lib/server/supabase";

export async function loadResults(userId: string): Promise<Results> {
  const { data, error } = await admin().from("results").select("puzzle, guesses").eq("user_id", userId);
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.puzzle, row.guesses]));
}

/** Today's daily game as this account finished it, or null if it has not. */
export async function savedDaily(userId: string, puzzle: number): Promise<GameResponse | null> {
  const { data, error } = await admin()
    .from("results")
    .select("guesses, picks")
    .eq("user_id", userId)
    .eq("puzzle", puzzle)
    .maybeSingle();
  if (error) throw error;
  return data && restoreDaily(puzzle, data.guesses, data.picks);
}

/** Saves finished daily games. A puzzle that already has a result keeps it. */
async function saveResults(userId: string, views: GameView[]): Promise<void> {
  const rows = views.map((view) => ({
    user_id: userId,
    puzzle: view.puzzle!,
    guesses: resultOf(view),
    picks: view.guesses.map((g) => g.songId),
  }));
  if (!rows.length) return;
  const { error } = await admin()
    .from("results")
    .upsert(rows, { onConflict: "user_id,puzzle", ignoreDuplicates: true });
  if (error) throw error;
}

/** Records a finished daily game, given its sealed game token. */
export async function recordGame(userId: string, token: string): Promise<void> {
  const view = finishedDaily(token);
  if (view) await saveResults(userId, [view]);
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

  const views = new Map<number, GameView>();
  for (const token of tokens.slice(0, 2000)) {
    const view = finishedDaily(token);
    if (view && !views.has(view.puzzle!)) views.set(view.puzzle!, view);
  }
  await saveResults(userId, [...views.values()]);
}

/** Deletes the auth user. The database deletes their results with it. */
export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await admin().auth.admin.deleteUser(userId);
  if (error) throw error;
}
