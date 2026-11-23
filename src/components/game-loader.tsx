"use client";

import dynamic from "next/dynamic";

// The game reads saved progress from localStorage, so it renders in the browser only.
const GameLoader = dynamic(() => import("@/components/game"), { ssr: false });

export default GameLoader;
