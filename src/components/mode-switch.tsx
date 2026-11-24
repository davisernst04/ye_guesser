"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import type { Mode } from "@/lib/game";
import { SPRING, useStretch } from "@/lib/glass-motion";

const MODES = [
  { mode: "daily", label: "DAILY", href: "/play" },
  { mode: "unlimited", label: "UNLIMITED", href: "/unlimited" },
] as const;

// Daily sits left of Unlimited, so the game slides that way (see game-loader.tsx).
const slideTo = (mode: Mode) => [mode === "unlimited" ? "mode-left" : "mode-right"];

// Each mode is its own page, so the switch remounts on every change. The old
// switch hands its pill to the new one here, and the glide carries on unbroken.
let handoff: { x: number; w: number; vx: number; vw: number } | null = null;

/** The Daily / Unlimited toggle. The pill moves the moment you tap, then the page follows. */
export function ModeSwitch({ mode }: { mode: Mode }) {
  const nav = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const w = useMotionValue(0);

  // The faster the pill moves, the wider, flatter and clearer it gets.
  const { speed, scaleX, scaleY } = useStretch(x);
  const fill = useTransform(speed, (s) => 0.9 - s * 0.45);
  const background = useMotionTemplate`rgb(255 255 255 / ${fill})`;
  // The dark labels show only where the pill is.
  const clipPath = useMotionTemplate`inset(0 calc(100% - ${x}px - ${w}px) 0 ${x}px round 999px)`;

  const moveTo = (target: Mode, from?: typeof handoff) => {
    const tab = nav.current?.querySelector<HTMLElement>(`[data-mode="${target}"]`);
    if (!tab) return;
    if (from) {
      x.jump(from.x);
      w.jump(from.w);
    }
    if (reduceMotion || (!from && !w.get())) {
      x.jump(tab.offsetLeft);
      w.jump(tab.offsetWidth);
      return;
    }
    animate(x, tab.offsetLeft, { ...SPRING, velocity: from?.vx ?? 0 });
    animate(w, tab.offsetWidth, { ...SPRING, velocity: from?.vw ?? 0 });
  };

  useLayoutEffect(() => {
    moveTo(mode, handoff);
    handoff = null;
    // Keep the pill on its tab if the labels change size (for example, when the font loads).
    const resize = new ResizeObserver(() => {
      if (!x.isAnimating()) moveTo(mode);
    });
    if (nav.current) resize.observe(nav.current);
    return () => {
      resize.disconnect();
      handoff = { x: x.get(), w: w.get(), vx: x.getVelocity(), vw: w.getVelocity() };
    };
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
          transitionTypes={slideTo(m)}
          onClick={() => moveTo(m)}
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
