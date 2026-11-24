// Server-owned game state. The browser holds it only as an encrypted token,
// so it cannot read the answer or change its own guesses.
import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import {
  FULL_CLIP_SECONDS,
  GUESS_TIMES,
  MAX_GUESSES,
  SONGS,
  puzzleForDate,
  songById,
  type GameResponse,
  type GameView,
  type Mode,
  type Status,
} from "@/lib/game";

type Session = {
  mode: Mode;
  puzzle: number | null;
  songId: number;
  guesses: (number | null)[];
};

function secret(): string {
  const value = process.env.GAME_SECRET;
  if (!value || value.length < 32) {
    throw new Error("GAME_SECRET must be set to at least 32 characters");
  }
  return value;
}

const key = () => createHash("sha256").update(`token:${secret()}`).digest();

function seal(session: Session): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

/** Returns null for a token that is malformed, forged, or not valid JSON. */
function open(token: unknown): Session | null {
  if (typeof token !== "string" || token.length > 4096) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    return JSON.parse(json) as Session;
  } catch {
    return null;
  }
}

// mulberry32: small seeded PRNG, good enough for shuffling a song list.
function prng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Song for a daily puzzle. Each pass through the list is a secret shuffle, so
 * no song repeats until every song has been used.
 */
function dailySongId(puzzle: number): number {
  const index = puzzle - 1;
  const cycle = Math.floor(index / SONGS.length);
  const seed = createHmac("sha256", secret()).update(`cycle:${cycle}`).digest().readUInt32LE(0);
  const random = prng(seed);
  const order = SONGS.map((song) => song.id);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order[index % order.length]!;
}

/** The server only serves today's puzzle, allowing for time zones (±1 day of UTC). */
export function isPlayablePuzzle(puzzle: unknown): puzzle is number {
  const now = new Date();
  const today = puzzleForDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Number.isInteger(puzzle) && Math.abs((puzzle as number) - today) <= 1 && (puzzle as number) >= 1;
}

function status(session: Session): Status {
  if (session.guesses.at(-1) === session.songId) return "won";
  return session.guesses.length >= MAX_GUESSES ? "lost" : "playing";
}

function clipSeconds(session: Session): number {
  return status(session) === "playing" ? GUESS_TIMES[session.guesses.length]! : FULL_CLIP_SECONDS;
}

function viewOf(session: Session): GameView {
  const state = status(session);
  return {
    mode: session.mode,
    puzzle: session.puzzle,
    guesses: session.guesses.map((songId) => ({ songId, correct: songId === session.songId })),
    status: state,
    clipSeconds: clipSeconds(session),
    answer: state === "playing" ? null : songById(session.songId)!,
  };
}

function respond(session: Session): GameResponse {
  return { token: seal(session), view: viewOf(session) };
}

export function startDaily(puzzle: number): GameResponse {
  return respond({ mode: "daily", puzzle, songId: dailySongId(puzzle), guesses: [] });
}

/**
 * A daily game as it ended on another device. Without its picks (older results),
 * it is rebuilt from the result alone: skips, then the answer for a win.
 */
export function restoreDaily(puzzle: number, result: number, picks: (number | null)[] | null): GameResponse {
  const songId = dailySongId(puzzle);
  const guesses = picks ?? (result ? [...Array<null>(result - 1).fill(null), songId] : Array<null>(MAX_GUESSES).fill(null));
  return respond({ mode: "daily", puzzle, songId, guesses });
}

export function startUnlimited(): GameResponse {
  const song = SONGS[randomInt(SONGS.length)]!;
  return respond({ mode: "unlimited", puzzle: null, songId: song.id, guesses: [] });
}

export type GuessResult = GameResponse | { error: string };

/** songId null means skip. */
export function guess(token: unknown, songId: unknown): GuessResult {
  const session = open(token);
  if (!session) return { error: "Invalid game" };
  if (session.mode === "daily" && !isPlayablePuzzle(session.puzzle)) return { error: "This puzzle has ended" };
  if (status(session) !== "playing") return { error: "Game is over" };
  if (songId !== null && (typeof songId !== "number" || !songById(songId))) return { error: "Unknown song" };
  if (songId !== null && session.guesses.includes(songId)) return { error: "Already guessed" };
  session.guesses.push(songId);
  return respond(session);
}

/** The song and the seconds of it this token may hear, or null for a bad token. */
export function clipFor(token: unknown): { songId: number; seconds: number } | null {
  const session = open(token);
  return session ? { songId: session.songId, seconds: clipSeconds(session) } : null;
}

/** The view of a finished daily game, or null. Lets a guest prove past results when they log in. */
export function finishedDaily(token: unknown): GameView | null {
  const session = open(token);
  if (session?.mode !== "daily") return null;
  const view = viewOf(session);
  return view.status === "playing" ? null : view;
}
