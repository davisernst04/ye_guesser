"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginButtons } from "@/components/account-dialog";
import { GUESS_TIMES, MAX_GUESSES, coverUrl, type GameView } from "@/lib/game";
import { RECENT_DAYS, type Stats } from "@/lib/stats";

type Props = {
  stats: Stats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Guesses used in today's win, to highlight its bar. */
  highlight?: number;
  /** Set for guests: the page to come back to after login. Shows the login prompt in place of the stats. */
  loginNext?: string;
  /** Today's finished daily game. When set, the dialog leads with its song. */
  view?: GameView;
  children?: React.ReactNode;
};

const spring = { type: "spring", stiffness: 260, damping: 26 } as const;
const label = "mb-2 text-sm text-label-2";

function dayLabel(result: number | null, daysAgo: number) {
  const when = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
  if (result === null) return `${when}: not played`;
  return result > 0 ? `${when}: solved in ${result}` : `${when}: missed`;
}

/** Today's song, the result, and one pill per guess. */
function Recap({ view }: { view: GameView & { answer: NonNullable<GameView["answer"]> } }) {
  const won = view.status === "won";
  return (
    <section className="flex items-center gap-4 pt-2 pr-10">
      <Image
        src={coverUrl(view.answer.cover, 250)}
        alt=""
        width={88}
        height={88}
        unoptimized
        className="size-22 shrink-0 rounded-lg shadow-[0_12px_24px_-8px_rgb(0_0_0/0.7)]"
      />
      <div className="min-w-0">
        <p className="text-sm text-label-2">Daily #{view.puzzle}</p>
        <p className="truncate text-xl font-bold">{view.answer.title}</p>
        <p className={`text-sm ${won ? "text-ye" : "text-miss"}`}>
          {won ? `Solved at ${GUESS_TIMES[view.guesses.length - 1]}s` : "Missed"}
        </p>
        <div aria-hidden className="mt-2 flex gap-1">
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

export function StatsDialog({ stats, open, onOpenChange, highlight, loginNext, view, children }: Props) {
  const max = Math.max(1, ...stats.distribution);
  const lit = stats.currentStreak > 0;
  const answer = view?.answer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5">
        {/* With a recap, today's song is the heading, so the title is for screen readers only. */}
        <DialogHeader className={answer ? "sr-only" : undefined}>
          <DialogTitle>Stats</DialogTitle>
          <DialogDescription>Daily games only</DialogDescription>
        </DialogHeader>

        {view && answer && <Recap view={{ ...view, answer }} />}

        {/* Guests keep stats only in this browser, so they get the login prompt instead. */}
        {loginNext ? (
          <section className="rounded-2xl bg-white/[0.06] p-4">
            <p className="mb-3 font-bold">Log in to keep your streak</p>
            <LoginButtons next={loginNext} compact />
          </section>
        ) : (
          <>
            <section className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.06] px-4 py-3">
              <p className="flex items-center gap-2">
                <Flame className={`size-6 ${lit ? "text-ye" : "text-label-3"}`} fill={lit ? "currentColor" : "none"} />
                <span className="text-2xl font-bold tabular-nums">{stats.currentStreak}</span>
                <span className="text-label-2">day streak</span>
              </p>
              <p className="text-right text-xs leading-snug text-label-2">
                Best {stats.bestStreak}
                <br />
                {stats.winPercent}% of {stats.played}
              </p>
            </section>

            {/* Wins by how much of the clip they needed, as thin pills like the guess row above. */}
            <section aria-labelledby="solved-at">
              <h3 id="solved-at" className={label}>
                Solved at
              </h3>
              <ol className="space-y-1.5">
                {stats.distribution.map((count, i) => {
                  const today = highlight === i + 1;
                  return (
                    <li key={i} className="flex items-center gap-3 text-xs tabular-nums">
                      <span className="sr-only">
                        {count} {count === 1 ? "win" : "wins"} at {GUESS_TIMES[i]} seconds
                      </span>
                      <span aria-hidden className={`w-7 ${today ? "text-ye" : "text-label-2"}`}>
                        {GUESS_TIMES[i]}s
                      </span>
                      <span aria-hidden className="h-2 flex-1 rounded-full bg-glass">
                        <motion.span
                          className={`block h-full rounded-full ${today ? "bg-ye" : "bg-white/70"}`}
                          initial={{ width: "0%" }}
                          animate={{ width: `${(count / max) * 100}%` }}
                          transition={{ ...spring, delay: 0.15 + i * 0.04 }}
                        />
                      </span>
                      <span aria-hidden className={`w-5 text-right ${today ? "text-ye" : count ? "" : "text-label-3"}`}>
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section aria-labelledby="recent">
              <h3 id="recent" className={label}>
                Last {RECENT_DAYS} days
              </h3>
              <ol className="flex gap-[3px] pr-1">
                {stats.recent.map((result, i) => {
                  const daysAgo = RECENT_DAYS - 1 - i;
                  const color = result === null ? "bg-glass-strong" : result > 0 ? "bg-ye" : "bg-miss";
                  return (
                    <li
                      key={i}
                      title={dayLabel(result, daysAgo)}
                      aria-label={dayLabel(result, daysAgo)}
                      className={`h-6 flex-1 rounded-full ${color} ${daysAgo === 0 ? "outline-2 outline-offset-1 outline-white/70" : ""}`}
                    />
                  );
                })}
              </ol>
            </section>
          </>
        )}

        {children}
      </DialogContent>
    </Dialog>
  );
}
