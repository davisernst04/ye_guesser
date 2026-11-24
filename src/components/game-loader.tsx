"use client";

import dynamic from "next/dynamic";
import type { Mode } from "@/lib/game";

// The game reads saved progress from localStorage, so it renders in the browser only.
const Game = dynamic(() => import("@/components/game"), { ssr: false });

export default function GameLoader({ mode }: { mode: Mode }) {
  return <Game mode={mode} />;
}
