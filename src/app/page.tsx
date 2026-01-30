"use client";

import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { memo } from "react";

const ALBUM_COVERS = [
  "https://lastfm.freetls.fastly.net/i/u/ar0/61d5e94c9aa712b29e283325bc5ae87f.jpg",
  "https://dailytrojan.com/wp-content/uploads/2016/08/14-Late-Registration-2005-Kanye-West-Album-Covers.jpg",
  "https://i.imgur.com/aAEEK.jpeg",
  "https://www.hmv.ca/dw/image/v2/BDFX_PRD/on/demandware.static/-/Sites-toys-master-catalog/default/dw5b52f7eb/images/24401BFC_1.jpg?sw=767&sh=767&sm=fit",
  "https://lastfm.freetls.fastly.net/i/u/ar0/f5afd8fe052b452c999b657664cae99f.jpg",
  "https://upload.wikimedia.org/wikipedia/en/e/ee/Watch_The_Throne.jpg",
  "https://upload.wikimedia.org/wikipedia/en/0/03/Yeezus_album_cover.png",
  "https://upload.wikimedia.org/wikipedia/en/4/4d/The_life_of_pablo_alternate.jpg",
  "https://upload.wikimedia.org/wikipedia/en/7/74/Ye_album_cover.jpg",
  "https://m.media-amazon.com/images/I/81vqCvM2EJL._UF1000,1000_QL80_.jpg",
  "https://m.media-amazon.com/images/I/61Ptk7IYKDL._UF1000,1000_QL80_.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Almost_black_square_020305.svg/220px-Almost_black_square_020305.svg.png",
  "https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/Kanye_West_and_Ty_Dolla_Sign_%28%C2%A5%24%29_%E2%80%93_Vultures.png/220px-Kanye_West_and_Ty_Dolla_Sign_%28%C2%A5%24%29_%E2%80%93_Vultures.png",
  "https://upload.wikimedia.org/wikipedia/en/6/66/%C2%A5%24_-_Vultures_2.png",
] as const;

const MARQUEE_IMAGES = [...ALBUM_COVERS, ...ALBUM_COVERS];

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
      </div>

      <div className="absolute inset-0 z-10 h-full w-full bg-black/60 dark:bg-black/40" />
      <ThreeDMarquee
        className="pointer-events-none absolute inset-0 h-full w-full z-0"
        images={MARQUEE_IMAGES}
      />
    </div>
  );
}

export default memo(HomePage);
