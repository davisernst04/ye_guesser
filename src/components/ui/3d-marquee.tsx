import type React from "react";

import Image from "next/image";
import { cn } from "@/lib/utils";
const COLUMNS = 6;
// Each column repeats its list 3 times and scrolls by exactly one copy, so
// the loop is seamless and neither end of the column ever comes into view.
const COPIES = 3;

export const ThreeDMarquee = ({
  images,
  className,
}: {
  images: { src: string; alt: string }[];
  className?: string;
}) => {
  // Every column keeps the list in order but starts at a different item, so
  // neighbouring columns don't line up.
  const columns = Array.from({ length: COLUMNS }, (_, colIndex) => {
    const start = Math.floor((colIndex * images.length) / COLUMNS);
    const rotated = [...images.slice(start), ...images.slice(0, start)];
    return Array.from({ length: COPIES }, () => rotated).flat();
  });
  return (
    <div
      className={cn(
        "mx-auto block h-full w-full animate-[marquee-fade-in_1s_ease-out] overflow-hidden",
        className,
      )}
    >
      <div className="flex size-full items-center justify-center">
        <div className="h-[1720px] w-[2600px] shrink-0 scale-[0.6] sm:scale-[0.85] lg:scale-110">
          <div
            style={{
              transform: "rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
            }}
            className="relative top-[30vh] right-[50%] grid size-full origin-top-left grid-cols-6 gap-8 transform-3d"
          >
            {columns.map((column, colIndex) => {
              const down = colIndex % 2 === 0;
              return (
                // A CSS animation, not JS, so it runs from the first paint
                // instead of freezing until React hydrates.
                <div
                  style={
                    {
                      "--marquee-copy": `${100 / COPIES}%`,
                      animation: `marquee-scroll ${down ? 220 : 270}s linear infinite ${down ? "normal" : "reverse"}`,
                    } as React.CSSProperties
                  }
                  key={colIndex + "marquee"}
                  className="flex flex-col items-start motion-reduce:[animation-play-state:paused]"
                >
                  {/* Spacing is padding, not flex gap, so one copy is exactly
                      1/COPIES of the column height. */}
                  {column.map((image, imageIndex) => (
                    <div className="pb-8" key={imageIndex}>
                      <Image
                        src={image.src}
                        alt={image.alt}
                        className="aspect-[970/700] rounded-lg object-cover ring ring-gray-950/5"
                        width={970}
                        height={700}
                        sizes="500px"
                        loading="eager"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
