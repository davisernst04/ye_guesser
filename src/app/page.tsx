"use client";

import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ALBUM_COVERS } from "@/lib/covers";
import { memo } from "react";

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

      <div className="relative z-20 flex flex-wrap items-center justify-center gap-4 mt-6 sm:mt-8">
        <Button asChild variant="default" size="lg" className="w-48 bg-primary">
          <Link href="/play" prefetch={true}>
            PLAY / NOW
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="w-48">
          <Link href="/unlimited">UNLIMITED</Link>
        </Button>
      </div>

      <div className="absolute inset-0 z-10 h-full w-full bg-black/60 dark:bg-black/40" />
      <ThreeDMarquee
        className="pointer-events-none absolute inset-0 h-full w-full z-0 "
        images={ALBUM_COVERS}
      />
    </div>
  );
}

export default memo(HomePage);
