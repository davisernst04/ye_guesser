"use client";

import { useLayoutEffect, useRef, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
} from "motion/react";
import type { Mode } from "@/lib/game";

const MODES = [
  { mode: "daily", label: "DAILY", href: "/play" },
  { mode: "unlimited", label: "UNLIMITED", href: "/unlimited" },
] as const;

// Daily sits left of Unlimited, so the game slides that way (see game-loader.tsx).
const slideTo = (mode: Mode) => [mode === "unlimited" ? "mode-left" : "mode-right"];

// A quick spring with a little overshoot, like the iOS segmented control.
// It counts as done once it is within half a pixel, so the page does not wait on the tail.
const SPRING = { type: "spring", stiffness: 600, damping: 36, mass: 0.8, restDelta: 0.5, restSpeed: 10 } as const;

/**
 * The Daily / Unlimited toggle. The pill glides to the tab you tap, then the page follows.
 * The glide must end before the page changes: during the page's view transition the
 * browser draws the header from a snapshot, and iOS Safari updates that snapshot late,
 * so a pill still moving there snaps into place when the transition ends.
 */
export function ModeSwitch({ mode }: { mode: Mode }) {
  const nav = useRef<HTMLElement>(null);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const w = useMotionValue(0);

  // Squash and stretch: the faster the pill moves, the wider, flatter and clearer it gets.
  const speed = useTransform(useVelocity(x), (v) => Math.min(Math.abs(v) / 1500, 1));
  const scaleX = useTransform(speed, (s) => 1 + s * 0.18);
  const scaleY = useTransform(speed, (s) => 1 - s * 0.12);
  const fill = useTransform(speed, (s) => 0.9 - s * 0.45);
  const background = useMotionTemplate`rgb(255 255 255 / ${fill})`;
  // The dark labels show only where the pill is.
  const clipPath = useMotionTemplate`inset(0 calc(100% - ${x}px - ${w}px) 0 ${x}px round 999px)`;

  /** Puts the pill on a tab. Resolves when it gets there. */
  const moveTo = async (target: Mode) => {
    const tab = nav.current?.querySelector<HTMLElement>(`[data-mode="${target}"]`);
    if (!tab) return;
    if (reduceMotion || !w.get()) {
      x.jump(tab.offsetLeft);
      w.jump(tab.offsetWidth);
      return;
    }
    await Promise.all([animate(x, tab.offsetLeft, SPRING), animate(w, tab.offsetWidth, SPRING)]);
  };

  const go = async (event: MouseEvent<HTMLAnchorElement>, target: Mode, href: string) => {
    // Let the browser handle new-tab and new-window clicks.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    await moveTo(target);
    router.push(href, { transitionTypes: slideTo(target) });
  };

  useLayoutEffect(() => {
    void moveTo(mode);
    // Keep the pill on its tab if the labels change size (for example, when the font loads).
    const resize = new ResizeObserver(() => {
      if (!x.isAnimating()) void moveTo(mode);
    });
    if (nav.current) resize.observe(nav.current);
    return () => resize.disconnect();
    // Each mode is its own page, so `mode` never changes for one mounted switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labels = (className: string, link: boolean) =>
    MODES.map(({ mode: m, label, href }) =>
      link && m !== mode ? (
        <Link
          key={m}
          data-mode={m}
          href={href}
          onClick={(event) => go(event, m, href)}
          className={`${className} transition-[color,transform] duration-200 ease-spring hover:text-white active:scale-95`}
        >
          {label}
        </Link>
      ) : (
        <span key={m} data-mode={link ? m : undefined} aria-current={link ? "page" : undefined} className={className}>
          {label}
        </span>
      ),
    ) as ReactNode;

  return (
    <nav ref={nav} className="relative flex rounded-full bg-white/10 p-0.5 text-xs backdrop-blur-xl">
      <motion.span
        aria-hidden
        className="absolute inset-y-0.5 left-0 rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_2px_10px_rgb(0_0_0/0.25)] backdrop-blur-md"
        style={{ x, width: w, scaleX, scaleY, background }}
      />
      {labels("relative rounded-full px-3 py-1.5 text-white/60", true)}
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 flex p-0.5 text-black" style={{ clipPath }}>
        {labels("rounded-full px-3 py-1.5", false)}
      </motion.span>
    </nav>
  );
}
