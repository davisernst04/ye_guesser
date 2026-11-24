"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GUESS_TIMES, MAX_GUESSES, coverUrl, type GameView } from "@/lib/game";
import { RECENT_DAYS, type Stats } from "@/lib/stats";

type Props = {
  stats: Stats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Guesses used in today's win, to highlight its track. */
  highlight?: number;
  /** Set for guests: opens the login sheet. The stats show blurred behind a login prompt. */
  onLogin?: () => void;
  /** Today's finished daily game. When set, the dialog leads with its song. */
  view?: GameView;
  children?: React.ReactNode;
};

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];

function dayLabel(result: number | null, daysAgo: number) {
  const when = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
  if (result === null) return `${when}: not played`;
  return result > 0 ? `${when}: solved in ${result}` : `${when}: missed`;
}

/** Today's song, styled like a now-playing header, with one pill per guess. */
function Recap({ view }: { view: GameView & { answer: NonNullable<GameView["answer"]> } }) {
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
          {Array.from({ length: MAX_GUESSES }, (_, i) => {
            const guess = view.guesses[i];
            const color = !guess
              ? "bg-glass-strong"
              : guess.correct
                ? "bg-ye"
                : guess.songId === null
                  ? "bg-white/40"
                  : "bg-miss";
            return <span key={i} className={`h-1.5 w-5 rounded-full ${color}`} />;
          })}
        </div>
      </div>
    </section>
  );
}

/** The stats as one sentence of liner notes. */
function Credits({ stats, view }: { stats: Stats; view?: GameView }) {
  const won = view?.status === "won";
  return (
    <p className="text-sm leading-relaxed font-normal text-label-2">
      {view?.answer &&
        (won ? (
          <>
            Solved at <b className="text-ye">{GUESS_TIMES[view.guesses.length - 1]}s</b> on the{" "}
            {ORDINALS[view.guesses.length - 1]} guess.{" "}
          </>
        ) : (
          <>
            <b className="text-miss">Missed</b> today&apos;s song.{" "}
          </>
        ))}
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
  const details = (
    <>
      <Credits stats={stats} view={view} />

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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5">
        {/* With a recap, today's song is the heading, so the title is for screen readers only. */}
        <DialogHeader className={answer ? "sr-only" : undefined}>
          <DialogTitle>Stats</DialogTitle>
          <DialogDescription>Daily games only</DialogDescription>
        </DialogHeader>

        {view && answer && <Recap view={{ ...view, answer }} />}

        {/* Guests see their stats blurred behind a login prompt. */}
        {onLogin ? (
          <div className="relative">
            <div aria-hidden inert className="grid gap-5 opacity-55 blur-[7px] select-none">
              {details}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
              <p className="text-[22px] leading-tight tracking-tight">
                {view?.status === "won" ? "Log in to keep your streak alive" : "Log in to save every result"}
              </p>
              <button
                type="button"
                onClick={onLogin}
                className="h-11 rounded-full bg-white px-6 text-[15px] text-black transition-colors outline-none hover:bg-white/85 focus-visible:ring-[3px] focus-visible:ring-ye/60"
              >
                Log in
              </button>
            </div>
          </div>
        ) : (
          details
        )}

        {children}
      </DialogContent>
    </Dialog>
  );
}
