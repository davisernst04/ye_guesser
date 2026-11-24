"use client";

import { ViewTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { BarChart3, Check, FastForward, Flag, ListMusic, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioPlayer, { glyphButton } from "@/components/audio-player";
import { SongPicker } from "@/components/guess";
import { StatsDialog } from "@/components/stats-dialog";
import { FanNote } from "@/components/fan-note";
import { AccountDialog, Avatar } from "@/components/account-dialog";
import { Ambient, Stage } from "@/components/now-playing";
import { useAccount } from "@/lib/account";
import { cn } from "@/lib/utils";
import {
  GUESS_TIMES,
  MAX_GUESSES,
  localPuzzle,
  songById,
  type GameResponse,
  type GameView,
  type Mode,
} from "@/lib/game";
import { computeStats, loadJson, loadResults, recordResult, saveJson, shareText } from "@/lib/stats";

type Saved = GameResponse;

// Daily sits left of Unlimited in the toggle, so the screen slides that way (see game-loader.tsx).
const slideTo = (mode: Mode) => [mode === "unlimited" ? "mode-left" : "mode-right"];

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
  const [playing, setPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
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
    <Button onClick={() => share(view)} size="lg" className="w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "copied" : "share"}
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        >
          {copied ? <Check /> : <Share2 />} {copied ? "Copied to clipboard" : "Share result"}
        </motion.span>
      </AnimatePresence>
    </Button>
  );

  const skipSeconds = view && view.guesses.length < MAX_GUESSES - 1
    ? GUESS_TIMES[view.guesses.length + 1]! - GUESS_TIMES[view.guesses.length]!
    : null;
  // The ▶▶ button skips while playing, and goes to the next song once an unlimited game ends.
  const forward =
    view?.status === "playing"
      ? { onClick: () => guess(null), caption: skipSeconds ? `+${skipSeconds}s` : "Give up",
          label: skipSeconds ? `Skip and unlock ${skipSeconds} more seconds` : "Give up" }
      : view?.mode === "unlimited"
        ? { onClick: start, caption: "Next", label: "Next song" }
        : null;
  const forwardButton = (
    <button
      type="button"
      onClick={forward?.onClick}
      disabled={!forward || busy}
      aria-label={forward?.label ?? "No skip after the game ends"}
      className={`${glyphButton} relative size-14`}
    >
      {forward?.caption === "Give up" ? (
        <Flag className="size-7" fill="currentColor" />
      ) : (
        <FastForward className="size-8" fill="currentColor" strokeWidth={0} />
      )}
      {forward && (
        <span className="absolute -bottom-3 text-[11px] text-white/60 tabular-nums">{forward.caption}</span>
      )}
    </button>
  );

  const last = view?.guesses.at(-1);
  const lastSong = last?.songId ? songById(last.songId) : null;
  const hint = !last
    ? "Play the clip, then guess the song"
    : lastSong
      ? `Not ${lastSong.title}`
      : "Skipped. More of the clip is unlocked";

  return (
    <MotionConfig reducedMotion="user">
      <Ambient cover={view?.answer?.cover ?? null} />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6">
        {/* The header stays put while the game slides under it. */}
        <ViewTransition name="game-header">
        <header className="flex items-center justify-between gap-2 py-4">
          <Link href="/" className="font-custom text-xl text-ye transition-opacity hover:opacity-80">
            Ye Guesser
          </Link>
          <nav className="flex rounded-full bg-white/10 p-0.5 text-xs backdrop-blur-xl">
            {(["daily", "unlimited"] as const).map((m) => {
              const label = m === "daily" ? "DAILY" : "UNLIMITED";
              return mode === m ? (
                // The pill glides to the other tab when the mode changes.
                <ViewTransition key={m} name="mode-pill">
                  <span aria-current="page" className="rounded-full bg-white/90 px-3 py-1.5 text-black">
                    {label}
                  </span>
                </ViewTransition>
              ) : (
                <Link
                  key={m}
                  href={m === "daily" ? "/play" : "/unlimited"}
                  transitionTypes={slideTo(m)}
                  className="rounded-full px-3 py-1.5 text-white/60 transition-[color,transform] duration-200 ease-spring hover:text-white active:scale-95"
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>
        </ViewTransition>

        <main className="flex-1 pb-4">
          {error && (
            <div role="alert" className="mb-4 space-y-3 rounded-2xl bg-miss/15 p-4 text-center text-sm text-miss">
              <p>{error}</p>
              {!game && <Button onClick={start}>Try again</Button>}
            </div>
          )}

          {playedElsewhere ? (
            <div className="mt-24 space-y-4 text-center">
              <h1 className="text-2xl font-bold">DAILY #{today}</h1>
              <p className="text-sm text-label-2">
                You already played today&apos;s song on another device.
              </p>
              <Button onClick={() => setStatsOpen(true)}>See stats</Button>
            </div>
          ) : !view ? (
            !error && (
              <div className="mt-2 aspect-square w-full animate-pulse rounded-xl bg-white/10" />
            )
          ) : (
            <div className="pt-2">
              <Stage view={view} playing={playing} queue={showQueue} />

              <div className="mt-8 flex items-center gap-3" role="status" aria-live="polite">
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-xl font-bold">
                    {view.answer ? view.answer.title : `Guess ${view.guesses.length + 1} of ${MAX_GUESSES}`}
                  </h1>
                  <p className="truncate text-white/60">{view.answer ? view.answer.album : hint}</p>
                </div>
                <AnimatePresence>
                  {view.status !== "playing" && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.3 }}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                        view.status === "won" ? "bg-ye text-black" : "bg-miss/25 text-[#ff8a80]"
                      }`}
                    >
                      {view.status === "won" ? `Solved in ${view.guesses.length}` : "Missed"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-5">
                <AudioPlayer
                  key={game.token}
                  token={game.token}
                  seconds={view.clipSeconds}
                  autoPlay={justFinished}
                  onPlayingChange={setPlaying}
                  label={view.mode === "daily" ? `DAILY #${view.puzzle}` : "UNLIMITED"}
                  after={forwardButton}
                />
              </div>

              {/* Where Apple Music has the volume slider. */}
              <div className="mt-6">
                {view.status === "playing" ? (
                  <SongPicker onGuess={guess} exclude={view.guesses.map((g) => g.songId)} disabled={busy} />
                ) : view.mode === "daily" ? (
                  shareButton
                ) : (
                  <Button onClick={start} disabled={busy} size="lg" className="w-full">
                    Next song
                  </Button>
                )}
              </div>
            </div>
          )}

          <nav className="mt-6 grid grid-cols-3 justify-items-center" aria-label="Player">
            <button type="button" onClick={() => setStatsOpen(true)} aria-label="Stats" className={`${glyphButton} size-11 text-white/80`}>
              <BarChart3 className="size-[22px]" />
            </button>
            {account?.enabled ? (
              <button
                type="button"
                onClick={() => setAccountOpen(true)}
                aria-label={user?.username ? `Account: ${user.username}` : "Account"}
                className={`${glyphButton} size-11`}
              >
                <Avatar name={user?.username} className={`size-7 text-xs ${user ? "" : "bg-transparent text-white/80"}`} />
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setShowQueue((on) => !on)}
              disabled={!view}
              aria-pressed={showQueue}
              aria-label="Your guesses"
              className={cn(glyphButton, "size-11 rounded-xl", showQueue ? "bg-white/90 text-black hover:bg-white active:bg-white" : "text-white/80")}
            >
              <ListMusic className="size-[22px]" />
            </button>
          </nav>
        </main>

        <FanNote className="text-label-3" />
      </div>

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
          next={mode === "daily" ? "/play" : "/unlimited"}
          shareName={shareName}
          onShareNameChange={(value) => {
            setShareName(value);
            saveJson("ye:shareName", value);
          }}
        />
      )}
    </MotionConfig>
  );
}
