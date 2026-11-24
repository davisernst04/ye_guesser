"use client";

import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { Button } from "@/components/ui/button";
import { FanNote } from "@/components/fan-note";
import { SPRING, useStretch } from "@/lib/glass-motion";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import Link from "next/link";
import { memo, type PointerEvent } from "react";

// Major releases in release order. The marquee shows them top to bottom,
// one column after the next. Covers come from Deezer and live in public/covers.
const ALBUM_COVERS = [
  { src: "/covers/01-the-college-dropout.jpg", alt: "The College Dropout" },
  { src: "/covers/02-late-registration.jpg", alt: "Late Registration" },
  { src: "/covers/03-graduation.jpg", alt: "Graduation" },
  { src: "/covers/04-808s-and-heartbreak.jpg", alt: "808s & Heartbreak" },
  { src: "/covers/05-my-beautiful-dark-twisted-fantasy.jpg", alt: "My Beautiful Dark Twisted Fantasy" },
  { src: "/covers/06-watch-the-throne.jpg", alt: "Watch the Throne" },
  { src: "/covers/07-yeezus.jpg", alt: "Yeezus" },
  { src: "/covers/08-the-life-of-pablo.jpg", alt: "The Life of Pablo" },
  { src: "/covers/09-ye.jpg", alt: "ye" },
  { src: "/covers/10-kids-see-ghosts.jpg", alt: "Kids See Ghosts" },
  { src: "/covers/11-jesus-is-king.jpg", alt: "Jesus Is King" },
  { src: "/covers/12-donda.jpg", alt: "Donda" },
  { src: "/covers/13-donda-2.jpg", alt: "Donda 2" },
  { src: "/covers/14-vultures-1.jpg", alt: "Vultures 1" },
  { src: "/covers/15-vultures-2.jpg", alt: "Vultures 2" },
  { src: "/covers/16-bully.jpg", alt: "Bully" },
];

// How far the glass pill reaches past the hovered button, in px.
const PILL_PAD = 6;

/** Play / Unlimited. A liquid glass pill sits behind the hovered button and glides between them. */
function PlayButtons() {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const opacity = useMotionValue(0);
  const { scaleX, scaleY } = useStretch(x);

  const glideTo = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const button = e.currentTarget;
    const glide = opacity.get() > 0 && !reduceMotion;
    const targets = [
      [x, button.offsetLeft - PILL_PAD],
      [y, button.offsetTop - PILL_PAD],
      [width, button.offsetWidth + PILL_PAD * 2],
      [height, button.offsetHeight + PILL_PAD * 2],
    ] as const;
    for (const [value, to] of targets) {
      if (glide) animate(value, to, SPRING);
      else value.jump(to);
    }
    animate(opacity, 1, { duration: 0.2 });
  };

  return (
    <div
      className="relative z-20 flex flex-wrap items-center justify-center gap-4 mt-6 sm:mt-8"
      onPointerLeave={() => animate(opacity, 0, { duration: 0.25 })}
    >
      <motion.span
        aria-hidden
        className="liquid-glass absolute top-0 left-0 rounded-full"
        style={{ x, y, width, height, scaleX, scaleY, opacity }}
      />
      <Button asChild variant="default" size="lg" className="relative w-48 bg-primary">
        <Link href="/play" prefetch={true} onPointerEnter={glideTo}>
          PLAY / NOW
        </Link>
      </Button>
      <Button asChild variant="secondary" size="lg" className="relative w-48">
        <Link href="/unlimited" onPointerEnter={glideTo}>
          UNLIMITED
        </Link>
      </Button>
    </div>
  );
}

function HomePage() {
  return (
    <div className="relative mx-auto flex h-screen w-full flex-col items-center justify-center overflow-hidden px-4 sm:px-6">
      <header className="relative z-20 mx-auto max-w-4xl text-center px-4">
        <h1
          className="text-4xl font-bold text-balance sm:text-5xl md:text-6xl lg:text-8xl font-custom"
          style={{ color: "#13f235" }}
        >
          I hate guessing <br />
          Ye tracks <br />
          its awesome
        </h1>
      </header>

      <PlayButtons />

      <FanNote className="absolute bottom-0 z-20 text-white/70" />

      <div className="absolute inset-0 z-10 h-full w-full bg-black/60 dark:bg-black/40" />
      <ThreeDMarquee
        className="pointer-events-none absolute inset-0 h-full w-full z-0 "
        images={ALBUM_COVERS}
      />
    </div>
  );
}

export default memo(HomePage);
