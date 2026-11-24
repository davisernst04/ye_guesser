"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GUESS_TIMES, MAX_GUESSES, clipPercent, coverUrl, type GameView } from "@/lib/game";
import { RECENT_DAYS, type Stats } from "@/lib/stats";

type Props = {
  stats: Stats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Guesses used in today's win, to highlight its track. */
  highlight?: number;
  /**
   * Set for guests, who only see this dialog when a daily game ends: opens the login sheet.
   * A guest recap and a login strip take the place of the stats.
   */
  onLogin?: () => void;
  /** Today's finished daily game. When set, the dialog leads with its song. */
  view?: GameView;
  children?: React.ReactNode;
};

function dayLabel(result: number | null, daysAgo: number) {
  const when = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
  if (result === null) return `${when}: not played`;
  return result > 0 ? `${when}: solved in ${result}` : `${when}: missed`;
}

type Finished = GameView & { answer: NonNullable<GameView["answer"]> };

function guessColor(guess: GameView["guesses"][number] | undefined) {
  if (!guess) return "bg-glass-strong";
  if (guess.correct) return "bg-ye";
  return guess.songId === null ? "bg-white/40" : "bg-miss";
}

/** Today's song, styled like a now-playing header, with one pill per guess. */
function Recap({ view }: { view: Finished }) {
  return (
    <section className="flex items-end gap-4 pt-2 pr-10">
      <Image
        src={coverUrl(view.answer.cover, 250)}
        alt=""
        width={96}
        height={96}
        unoptimized
        className="size-24 shrink-0 rounded-lg shadow-[0_12px_24px_-8px_rgb(0_0_0/0.7)]"
      />
      <div className="min-w-0">
        <p className="text-xs text-label-2">Daily #{view.puzzle}</p>
        <p className="my-1 line-clamp-2 text-2xl leading-tight tracking-tight">{view.answer.title}</p>
        <div aria-hidden className="flex gap-1">
          {Array.from({ length: MAX_GUESSES }, (_, i) => (
            <span key={i} className={`h-1.5 w-5 rounded-full ${guessColor(view.guesses[i])}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Today's result, stacked and fading like the type on The Life of Pablo cover. */
function Verdict({ view }: { view: Finished }) {
  const won = view.status === "won";
  const verdict = won ? `Got it / in ${view.guesses.length}` : "Missed / it";
  return (
    <p className={`text-[40px] leading-[0.92] tracking-[-0.045em] uppercase ${won ? "text-ye" : "text-miss"}`}>
      <span className="sr-only">{won ? `Got it in ${view.guesses.length}` : "Missed it"}</span>
      <span aria-hidden className="block">{verdict}</span>
      <span aria-hidden className="block opacity-45">{verdict}</span>
      <span aria-hidden className="block opacity-20">{verdict}</span>
    </p>
  );
}

/** Guest recap: the song, the verdict and the guesses on the clip's real 30 s timeline. */
function GuestRecap({ view }: { view: Finished }) {
  const won = view.status === "won";
  const end = view.guesses.length - 1;
  return (
    <>
      <section className="flex items-center gap-3 pr-10">
        <Image
          src={coverUrl(view.answer.cover, 120)}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="size-14 shrink-0 rounded-lg"
        />
        <div className="min-w-0">
          <p className="text-xs font-normal text-label-2">
            Daily #{view.puzzle}
            {!won && " · the song was"}
          </p>
          <p className="truncate text-lg">{view.answer.title}</p>
        </div>
      </section>

      <Verdict view={view} />

      <div aria-hidden className="relative">
        <div className="relative h-2 overflow-hidden rounded-full bg-glass">
          {view.guesses.map((guess, i) => {
            const from = GUESS_TIMES[i - 1] ?? 0;
            const to = GUESS_TIMES[i]!;
            return (
              <span
                key={i}
                className={`absolute inset-y-0 ${guessColor(guess)}`}
                style={{ left: clipPercent(from), width: clipPercent(to - from) }}
              />
            );
          })}
          {GUESS_TIMES.slice(0, -1).map((t) => (
            <span key={t} className="absolute inset-y-0 -ml-px w-0.5 bg-neutral-900" style={{ left: clipPercent(t) }} />
          ))}
        </div>
        {won && (
          <span
            className="absolute -top-[5px] size-[18px] -translate-x-1/2 rounded-full bg-white ring-4 ring-ye/25"
            style={{ left: clipPercent(GUESS_TIMES[end]!) }}
          />
        )}
        <div className="relative mt-1.5 h-3.5 text-[11px] font-normal text-label-3 tabular-nums">
          {GUESS_TIMES.map((t, i) => (
            <span
              key={t}
              className={`absolute ${i === MAX_GUESSES - 1 ? "-translate-x-full" : "-translate-x-1/2"} ${
                won && i === end ? "font-bold text-ye" : ""
              }`}
              style={{ left: clipPercent(t) }}
            >
              {t}s
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

/** Asks a guest to log in. After a win it shows the streak that login keeps alive. */
function LoginStrip({ streak, onLogin }: { streak: number; onLogin: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-glass py-3 pr-3 pl-4">
      {streak > 0 && <span className="text-[30px] leading-none tracking-tight tabular-nums">{streak}</span>}
      <p className="min-w-0 flex-1 text-[13px] leading-snug font-normal text-label-2">
        <span className="block text-sm font-bold text-foreground">{streak > 0 ? "Day streak" : "Your stats"}</span>
        {streak > 0 ? "Log in to keep it alive" : "Log in to save every result"}
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="h-9 shrink-0 rounded-full bg-white px-4 text-sm text-black transition-colors outline-none hover:bg-white/85 focus-visible:ring-[3px] focus-visible:ring-ye/60"
      >
        Log in
      </button>
    </div>
  );
}

/** The stats as one sentence of liner notes. */
function Credits({ stats }: { stats: Stats }) {
  return (
    <p className="text-sm leading-relaxed font-normal text-label-2">
      {stats.currentStreak > 0 ? (
        <>
          <b className="text-foreground">{stats.currentStreak}-day streak</b>, best {stats.bestStreak}.
        </>
      ) : (
        <>No streak running, best {stats.bestStreak}.</>
      )}{" "}
      You solved{" "}
      <b className="text-foreground">
        {stats.wins} of {stats.played}
      </b>{" "}
      dailies ({stats.winPercent}%).
    </p>
  );
}

export function StatsDialog({ stats, open, onOpenChange, highlight, onLogin, view, children }: Props) {
  const answer = view?.answer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5">
        {/* With a recap, today's song is the heading, so the title is for screen readers only. */}
        <DialogHeader className={answer ? "sr-only" : undefined}>
          <DialogTitle>Stats</DialogTitle>
          <DialogDescription>Daily games only</DialogDescription>
        </DialogHeader>

        {view &&
          answer &&
          (onLogin ? (
            <GuestRecap view={{ ...view, answer }} />
          ) : (
            <>
              <Recap view={{ ...view, answer }} />
              <Verdict view={{ ...view, answer }} />
            </>
          ))}

        {onLogin ? (
          <LoginStrip streak={view?.status === "won" ? stats.currentStreak : 0} onLogin={onLogin} />
        ) : (
          <>
            <Credits stats={stats} />

            {/* Wins by clip length, laid out like the tracklist on an album's back cover. */}
            <section aria-label="Solved at">
              <ol className="border-t border-glass-strong">
                {stats.distribution.map((count, i) => {
                  const today = highlight === i + 1;
                  const wins = `${count} ${count === 1 ? "win" : "wins"}`;
                  return (
                    <li
                      key={i}
                      aria-label={`${wins} at ${GUESS_TIMES[i]} seconds`}
                      className={`flex items-baseline gap-2.5 border-b border-glass py-2 text-sm tabular-nums ${
                        today ? "text-ye" : count ? "" : "text-label-3"
                      }`}
                    >
                      <span aria-hidden className={`w-4 ${today ? "" : "text-label-3"}`}>
                        {i + 1}
                      </span>
                      <span aria-hidden className="w-9">
                        0:{String(GUESS_TIMES[i]).padStart(2, "0")}
                      </span>
                      <span aria-hidden className="flex-1 -translate-y-1 border-b-2 border-dotted border-glass-strong" />
                      <span aria-hidden>{wins}</span>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* The last few weeks as a barcode, oldest on the left. */}
            <section aria-label={`Last ${RECENT_DAYS} days`}>
              <ol className="flex h-8 gap-0.5">
                {stats.recent.map((result, i) => {
                  const daysAgo = RECENT_DAYS - 1 - i;
                  const color =
                    daysAgo === 0 && result !== null
                      ? result > 0
                        ? "bg-ye"
                        : "bg-miss"
                      : result === null
                        ? "bg-glass-strong"
                        : result > 0
                          ? "bg-white"
                          : "bg-miss";
                  return (
                    <li
                      key={i}
                      title={dayLabel(result, daysAgo)}
                      aria-label={dayLabel(result, daysAgo)}
                      className={`flex-1 ${color}`}
                    />
                  );
                })}
              </ol>
              <p aria-hidden className="mt-1.5 flex justify-between text-[11px] font-normal text-label-3">
                <span>{RECENT_DAYS} days ago</span>
                <span>Today</span>
              </p>
            </section>
          </>
        )}

        {children}
      </DialogContent>
    </Dialog>
  );
}
