// Daily results and stats, kept in the browser for guests.
import { MAX_GUESSES, type GameView } from "@/lib/game";

/** Puzzle number -> guesses used to win (1-6), or 0 for a loss. */
export type Results = Record<number, number>;

const RESULTS_KEY = "ye:results";

export function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game still works, it just won't be remembered.
  }
}

export function loadResults(): Results {
  return loadJson<Results>(RESULTS_KEY) ?? {};
}

export function recordResult(view: GameView): Results {
  const results = loadResults();
  if (view.puzzle !== null && view.status !== "playing" && !(view.puzzle in results)) {
    results[view.puzzle] = view.status === "won" ? view.guesses.length : 0;
    saveJson(RESULTS_KEY, results);
  }
  return results;
}

export type Stats = {
  played: number;
  winPercent: number;
  currentStreak: number;
  bestStreak: number;
  /** Wins by number of guesses: index 0 = won in 1 guess. */
  distribution: number[];
};

export function computeStats(results: Results, today: number): Stats {
  const puzzles = Object.keys(results).map(Number).sort((a, b) => a - b);
  const distribution = Array<number>(MAX_GUESSES).fill(0);
  let wins = 0;
  let bestStreak = 0;
  let run = 0;
  let previous = -Infinity;

  for (const puzzle of puzzles) {
    const guesses = results[puzzle]!;
    if (guesses > 0) {
      wins++;
      distribution[guesses - 1]!++;
      run = puzzle === previous + 1 ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
    previous = puzzle;
  }

  // Today's puzzle doesn't break the streak until it is lost or the day ends.
  let currentStreak = 0;
  for (let p = (today in results) ? today : today - 1; (results[p] ?? 0) > 0; p--) currentStreak++;

  return {
    played: puzzles.length,
    winPercent: puzzles.length ? Math.round((wins / puzzles.length) * 100) : 0,
    currentStreak,
    bestStreak,
    distribution,
  };
}

/** e.g. "Ye Guesser #327 🟥⬛🟩⬜⬜⬜ 🔥12" plus the site link. */
export function shareText(view: GameView, streak: number, site: string): string {
  const squares = Array.from({ length: MAX_GUESSES }, (_, i) => {
    const guess = view.guesses[i];
    if (!guess) return "⬜";
    if (guess.correct) return "🟩";
    return guess.songId === null ? "⬛" : "🟥";
  }).join("");
  const fire = streak > 0 ? ` 🔥${streak}` : "";
  return `Ye Guesser #${view.puzzle} ${squares}${fire}\n${site}`;
}
