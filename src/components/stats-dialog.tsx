"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Stats } from "@/lib/stats";

type Props = {
  stats: Stats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Guesses used in today's win, to highlight its bar. */
  highlight?: number;
  children?: React.ReactNode;
};

export function StatsDialog({ stats, open, onOpenChange, highlight, children }: Props) {
  const max = Math.max(1, ...stats.distribution);
  const tiles = [
    ["Played", stats.played],
    ["Win %", stats.winPercent],
    ["Streak", stats.currentStreak],
    ["Best", stats.bestStreak],
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>STATS</DialogTitle>
          <DialogDescription>Daily games only. Practice doesn&apos;t count.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2 text-center">
          {tiles.map(([label, value]) => (
            <div key={label}>
              <div className="text-2xl font-bold tabular-nums">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">GUESSES PER WIN</h3>
          {stats.distribution.map((count, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-3 tabular-nums">{i + 1}</span>
              <div
                className={`rounded-sm px-2 text-right text-xs leading-5 font-bold tabular-nums ${
                  highlight === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
                style={{ width: `max(1.75rem, ${(count / max) * 100}%)` }}
              >
                {count}
              </div>
            </div>
          ))}
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
