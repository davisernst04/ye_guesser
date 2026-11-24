"use client";

import { ViewTransition } from "react";
import dynamic from "next/dynamic";
import type { Mode } from "@/lib/game";

// The game reads saved progress from localStorage, so it renders in the browser only.
const Game = dynamic(() => import("@/components/game"), { ssr: false });

// Links between Daily and Unlimited tag the navigation with a direction.
// The boundary sits outside the dynamic import, because React skips it inside.
const SLIDE = { "mode-left": "mode-left", "mode-right": "mode-right", default: "none" };

export default function GameLoader({ mode }: { mode: Mode }) {
  return (
    <ViewTransition enter={SLIDE} exit={SLIDE} default="none">
      {/* One element to slide. Named parts inside (header, background) stay out of it. */}
      <div>
        <Game mode={mode} />
      </div>
    </ViewTransition>
  );
}
