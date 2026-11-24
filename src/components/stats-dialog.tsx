"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GUESS_TIMES } from "@/lib/game";
import { RECENT_DAYS, type Stats } from "@/lib/stats";

type Props = {
  stats: Stats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Guesses used in today's win, to highlight its bar. */
  highlight?: number;
  children?: React.ReactNode;
};

const spring = { type: "spring", stiffness: 260, damping: 26 } as const;

function dayLabel(result: number | null, daysAgo: number) {
  const when = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
  if (result === null) return `${when}: not played`;
  return result > 0 ? `${when}: solved in ${result}` : `${when}: missed`;
}

export function StatsDialog({ stats, open, onOpenChange, highlight, children }: Props) {
  const max = Math.max(1, ...stats.distribution);
  const days = stats.currentStreak === 1 ? "day" : "days";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stats</DialogTitle>
          <DialogDescription>Daily games only. Practice doesn&apos;t count.</DialogDescription>
        </DialogHeader>

        {/* The streak is the number players care about most, so it leads. */}
        <section className="relative overflow-hidden rounded-3xl bg-ye p-5 text-black">
          <Flame aria-hidden className="absolute -right-6 -bottom-8 size-40 opacity-10" strokeWidth={1.5} />
          <p className="text-sm">Current streak</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-6xl leading-none font-bold tracking-tighter tabular-nums">{stats.currentStreak}</span>
            <span className="text-lg">{days}</span>
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
            {(
              [
                ["Best streak", stats.bestStreak],
                ["Played", stats.played],
                ["Win rate", `${stats.winPercent}%`],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-black/60">{label}</dt>
                <dd className="text-xl font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Wins by how much of the clip it took, drawn like a level meter. */}
        <section aria-labelledby="solved-at">
          <h3 id="solved-at" className="text-base font-bold">
            Solved at
          </h3>
          <p className="text-xs text-label-2">How much of the clip each win needed</p>
          <ol className="mt-4 grid h-32 grid-cols-6 gap-2">
            {stats.distribution.map((count, i) => {
              const today = highlight === i + 1;
              return (
                <li key={i} className="flex h-full flex-col items-center gap-1.5">
                  <span className="sr-only">
                    {count} {count === 1 ? "win" : "wins"} at {GUESS_TIMES[i]} seconds
                  </span>
                  <div aria-hidden className="flex w-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className={`text-xs tabular-nums ${today ? "text-ye" : "text-label-2"}`}>{count}</span>
                    <motion.div
                      className={`w-full rounded-lg ${today ? "bg-ye" : count ? "bg-white/80" : "bg-glass-strong"}`}
                      initial={{ height: "0%" }}
                      animate={{ height: `${(count / max) * 80}%` }}
                      transition={{ ...spring, delay: 0.15 + i * 0.04 }}
                      style={{ minHeight: 4 }}
                    />
                  </div>
                  <span aria-hidden className="text-xs text-label-2 tabular-nums">
                    {GUESS_TIMES[i]}s
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="recent">
          <h3 id="recent" className="text-base font-bold">
            Last 4 weeks
          </h3>
          <ol className="mt-3 grid grid-cols-14 gap-1">
            {stats.recent.map((result, i) => {
              const daysAgo = RECENT_DAYS - 1 - i;
              const color = result === null ? "bg-glass" : result > 0 ? "bg-ye" : "bg-miss";
              return (
                <li
                  key={i}
                  title={dayLabel(result, daysAgo)}
                  aria-label={dayLabel(result, daysAgo)}
                  className={`aspect-square rounded-[5px] ${color} ${daysAgo === 0 ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900" : ""}`}
                />
              );
            })}
          </ol>
          <div className="mt-3 flex gap-4 text-xs text-label-2">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-ye" /> Solved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-miss" /> Missed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-glass-strong" /> Not played
            </span>
          </div>
        </section>

        {children}
      </DialogContent>
    </Dialog>
  );
}
