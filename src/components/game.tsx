"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Check, Share2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioPlayer from "@/components/audio-player";
import { SongPicker } from "@/components/guess";
import { StatsDialog } from "@/components/stats-dialog";
import { FanNote } from "@/components/fan-note";
import { AccountDialog } from "@/components/account-dialog";
import { useAccount } from "@/lib/account";
import {
  GUESS_TIMES,
  MAX_GUESSES,
  coverUrl,
  localPuzzle,
  songById,
  type GameResponse,
  type GameView,
  type Mode,
} from "@/lib/game";
import { computeStats, loadJson, loadResults, recordResult, saveJson, shareText } from "@/lib/stats";

type Saved = GameResponse;

async function post(path: string, body: unknown): Promise<GameResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as GameResponse;
}

/** Saved game for this mode, or null if there is none or the daily one is stale. */
function loadGame(mode: Mode, storageKey: string): Saved | null {
  const saved = loadJson<Saved>(storageKey);
  if (!saved?.token || !saved.view) return null;
  if (mode === "daily" && saved.view.puzzle !== localPuzzle()) return null;
  return saved;
}

export default function Game({ mode }: { mode: Mode }) {
  const storageKey = `ye:${mode}`;
  const [game, setGame] = useState<Saved | null>(() => loadGame(mode, storageKey));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(loadResults);
  const [statsOpen, setStatsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const { account, refresh: refreshAccount } = useAccount();
  const [accountOpen, setAccountOpen] = useState(false);
  const [shareName, setShareName] = useState(() => loadJson<boolean>("ye:shareName") ?? false);
  const user = account?.user;

  const update = useCallback(
    (next: Saved) => {
      setGame(next);
      saveJson(storageKey, next);
      if (next.view.mode !== "daily" || next.view.status === "playing") return;
      // The server records results for logged-in players.
      if (user) void refreshAccount();
      else setResults(recordResult(next));
    },
    [storageKey, user, refreshAccount],
  );

  const start = useCallback(async () => {
    setError(null);
    setBusy(true);
    setJustFinished(false);
    try {
      update(await post("/api/game/start", { mode, puzzle: localPuzzle() }));
    } catch {
      setError("Couldn't start a game");
    } finally {
      setBusy(false);
    }
  }, [mode, update]);

  // On first load only, fetch a game from the server if none is saved.
  // Later games start from user actions.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    localStorage.removeItem("songGameCurrent"); // old save format
    if (new URLSearchParams(window.location.search).get("login") === "failed") {
      setError("Login failed. Try again.");
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (!game) void start();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  async function guess(songId: number | null) {
    if (!game || busy) return;
    setBusy(true);
    try {
      const next = await post("/api/game/guess", { token: game.token, songId });
      update(next);
      if (next.view.status !== "playing") {
        setJustFinished(true);
        if (mode === "daily") setTimeout(() => setStatsOpen(true), 1500);
      }
    } catch (err) {
      // An expired or broken game can't be continued; start a fresh one.
      if (err instanceof Error && /ended|Invalid game/.test(err.message)) void start();
      else setError("Couldn't send that guess. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const today = localPuzzle();
  const stats = computeStats(user ? user.results : results, today);
  const view = game?.view;
  // This account finished today's puzzle on another device, so this game wouldn't count.
  const playedElsewhere = mode === "daily" && view?.status === "playing" && user?.results[today] !== undefined;

  async function share(view: GameView) {
    const name = shareName ? user?.username : null;
    const text = shareText(view, stats.currentStreak, window.location.host, name);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy. Your browser blocked the clipboard.");
    }
  }

  const shareButton = view && view.mode === "daily" && view.status !== "playing" && (
    <Button onClick={() => share(view)} className="w-full">
      {copied ? <Check /> : <Share2 />} {copied ? "COPIED" : "SHARE"}
    </Button>
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <header className="flex items-center justify-between py-4">
        <Link href="/" className="font-custom text-xl" style={{ color: "#13f235" }}>
          Ye Guesser
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Button asChild variant={mode === "daily" ? "secondary" : "ghost"} size="sm">
            <Link href="/play">DAILY</Link>
          </Button>
          <Button asChild variant={mode === "practice" ? "secondary" : "ghost"} size="sm">
            <Link href="/practice">PRACTICE</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setStatsOpen(true)} aria-label="Stats">
            <BarChart3 />
          </Button>
          {account?.enabled &&
            (user?.username ? (
              <Button variant="ghost" size="sm" onClick={() => setAccountOpen(true)} className="max-w-24">
                <span className="truncate">{user.username}</span>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setAccountOpen(true)} aria-label="Account">
                <UserRound />
              </Button>
            ))}
        </nav>
      </header>

      <main className="flex-1 space-y-5 pb-6">
        {error && (
          <div role="alert" className="space-y-2 text-center text-sm text-red-500">
            <p>{error}</p>
            {!game && <Button onClick={start}>Try again</Button>}
          </div>
        )}

        {playedElsewhere ? (
          <div className="mt-24 space-y-3 text-center">
            <h1 className="text-2xl font-bold">DAILY #{today}</h1>
            <p className="text-sm text-muted-foreground">
              You already played today&apos;s song on another device. New song at midnight.
            </p>
            <Button onClick={() => setStatsOpen(true)}>SEE STATS</Button>
          </div>
        ) : !view ? (
          !error && <div className="mx-auto mt-24 size-12 animate-spin rounded-full border-b-2 border-primary" />
        ) : (
          <>
            <div className="text-center" role="status" aria-live="polite">
              {view.status === "playing" ? (
                <>
                  <h1 className="text-2xl font-bold">
                    {view.mode === "daily" ? `DAILY #${view.puzzle}` : "PRACTICE"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    GUESS {view.guesses.length + 1} OF {MAX_GUESSES} · {view.clipSeconds}s CLIP
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">{view.status === "won" ? "CORRECT" : "NOT THIS TIME"}</h1>
                  <p className="text-sm text-muted-foreground">
                    {view.status === "won"
                      ? `Got it in ${view.guesses.length} ${view.guesses.length === 1 ? "guess" : "guesses"}`
                      : "The answer was"}
                  </p>
                </>
              )}
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-64">
              <Image
                src={view.answer ? coverUrl(view.answer.cover) : "/ye_stare.jpg"}
                alt={view.answer ? `Cover of ${view.answer.album}` : "Ye stare"}
                fill
                sizes="256px"
                className="rounded-lg object-cover shadow-lg"
                priority
              />
            </div>

            {view.answer && (
              <div className="text-center">
                <p className="text-lg font-bold">{view.answer.title}</p>
                <p className="text-sm text-muted-foreground">{view.answer.album}</p>
              </div>
            )}

            <AudioPlayer
              key={game.token}
              token={game.token}
              seconds={view.clipSeconds}
              autoPlay={justFinished}
            />

            {view.status === "playing" ? (
              <div className="flex gap-2">
                <SongPicker
                  onGuess={guess}
                  exclude={view.guesses.map((g) => g.songId)}
                  disabled={busy}
                  className="min-w-0 flex-1"
                />
                <Button variant="secondary" onClick={() => guess(null)} disabled={busy}>
                  {view.guesses.length < MAX_GUESSES - 1
                    ? `SKIP +${GUESS_TIMES[view.guesses.length + 1]! - GUESS_TIMES[view.guesses.length]!}s`
                    : "GIVE UP"}
                </Button>
              </div>
            ) : view.mode === "daily" ? (
              <div className="space-y-2 text-center">
                {shareButton}
                <p className="text-sm text-muted-foreground">New song at midnight. Try practice while you wait.</p>
              </div>
            ) : (
              <Button onClick={start} disabled={busy} className="w-full">
                NEXT SONG
              </Button>
            )}

            <ol className="space-y-1.5">
              {Array.from({ length: MAX_GUESSES }, (_, i) => {
                const g = view.guesses[i];
                const song = g?.songId ? songById(g.songId) : null;
                return (
                  <li
                    key={i}
                    className={`flex h-9 items-center justify-between rounded-md border px-3 text-sm ${
                      g?.correct ? "border-green-500 text-green-500" : g ? "border-red-500/60" : "border-dashed"
                    }`}
                  >
                    <span className={`truncate ${g && !g.correct && song ? "line-through" : ""}`}>
                      {g ? (song ? song.title : "Skipped") : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">{GUESS_TIMES[i]}s</span>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </main>

      <FanNote />

      <StatsDialog
        stats={stats}
        open={statsOpen}
        onOpenChange={setStatsOpen}
        highlight={view?.mode === "daily" && view.status === "won" ? view.guesses.length : undefined}
      >
        {shareButton}
      </StatsDialog>

      {account?.enabled && (
        <AccountDialog
          key={user ? `user:${user.username}` : "guest"}
          account={account}
          open={accountOpen}
          onOpenChange={setAccountOpen}
          onChange={refreshAccount}
          next={mode === "daily" ? "/play" : "/practice"}
          shareName={shareName}
          onShareNameChange={(value) => {
            setShareName(value);
            saveJson("ye:shareName", value);
          }}
        />
      )}
    </div>
  );
}
