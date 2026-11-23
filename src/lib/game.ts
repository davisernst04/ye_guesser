// Game rules and types shared by the browser and the server.
import songList from "@/data/songs.json";

export type Song = { id: number; title: string; album: string; cover: string };

export const SONGS: readonly Song[] = songList;

export const GUESS_TIMES = [1, 3, 5, 10, 20, 30] as const;
export const MAX_GUESSES = GUESS_TIMES.length;
export const FULL_CLIP_SECONDS = 30;

export type Mode = "daily" | "practice";
export type Status = "playing" | "won" | "lost";

/** Public game state. The answer is only present once the game is over. */
export type GameView = {
  mode: Mode;
  puzzle: number | null;
  /** One entry per guess: the song guessed (null = skipped) and if it was right. */
  guesses: { songId: number | null; correct: boolean }[];
  status: Status;
  /** Seconds of audio the player may hear now. */
  clipSeconds: number;
  answer: Song | null;
};

export type GameResponse = { token: string; view: GameView };

const DAY_MS = 86_400_000;
// Puzzle #1 is 2026-01-01.
const EPOCH_UTC = Date.UTC(2025, 11, 31);

/** Puzzle number for a calendar date (year, month 0-11, day). */
export function puzzleForDate(year: number, month: number, day: number): number {
  return Math.round((Date.UTC(year, month, day) - EPOCH_UTC) / DAY_MS);
}

/** Today's puzzle number in the player's own time zone. */
export function localPuzzle(now = new Date()): number {
  return puzzleForDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function songById(id: number): Song | undefined {
  return SONGS.find((song) => song.id === id);
}

export function coverUrl(md5: string): string {
  return `https://e-cdns-images.dzcdn.net/images/cover/${md5}/500x500.jpg`;
}
