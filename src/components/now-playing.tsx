"use client";

// The pieces of the player screen that only draw things: background, artwork and guess list.
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Check, SkipForward, X } from "lucide-react";
import { GUESS_TIMES, MAX_GUESSES, coverUrl, songById, type GameView } from "@/lib/game";

const HIDDEN_COVER = "/ye_stare.jpg";

/** A blurred, slowly drifting copy of the artwork that fills the screen behind the player. */
export function Ambient({ cover }: { cover: string | null }) {
  const src = cover ? coverUrl(cover, 120) : HIDDEN_COVER;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-black">
      <AnimatePresence initial={false}>
        <motion.div
          key={src}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="120px"
            unoptimized={!!cover}
            className="animate-ambient object-cover blur-3xl saturate-[1.8]"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
    </div>
  );
}

/**
 * The square at the top of the player. It shows the album art, or the guess list when
 * the queue button is on, like Apple Music's "Playing Next" view.
 * The art casts a deeper shadow while playing and flips over on the reveal.
 */
export function Stage({ view, playing, queue }: { view: GameView; playing: boolean; queue: boolean }) {
  const answer = view.answer;
  const big = playing || view.status !== "playing";
  return (
    // Full column width, so the cover lines up with the 30 s track bar below it.
    <div className="relative aspect-square w-full [perspective:1200px]">
      <AnimatePresence initial={false}>
        {queue ? (
          <motion.div
            key="queue"
            className="absolute inset-0 overflow-y-auto overscroll-contain"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
          >
            <h2 className="mb-2 text-[15px] font-bold">Your guesses</h2>
            <GuessQueue view={view} />
          </motion.div>
        ) : (
          <motion.div
            key="art"
            className={`absolute inset-0 rounded-xl ${big ? "shadow-[0_30px_60px_-12px_rgb(0_0_0/0.7)]" : "shadow-[0_16px_32px_-12px_rgb(0_0_0/0.5)]"} transition-shadow duration-500`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={answer ? answer.cover : "hidden"}
                className="absolute inset-0 overflow-hidden rounded-xl"
                initial={{ rotateY: -90, opacity: 0.4 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0.4 }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              >
                <Image
                  src={answer ? coverUrl(answer.cover) : HIDDEN_COVER}
                  alt={answer ? `Cover of ${answer.album}` : "Ye staring. The cover stays hidden until the game ends."}
                  fill
                  sizes="(max-width: 448px) 90vw, 400px"
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The six guesses, listed like Apple Music's "Playing Next" queue. */
export function GuessQueue({ view }: { view: GameView }) {
  return (
    <ol className="space-y-0.5" aria-label="Your guesses">
      {Array.from({ length: MAX_GUESSES }, (_, i) => {
        const guess = view.guesses[i];
        const song = guess?.songId ? songById(guess.songId) : null;
        const current = view.status === "playing" && i === view.guesses.length;
        const state = !guess ? "empty" : guess.correct ? "correct" : song ? "wrong" : "skipped";
        return (
          <li
            key={i}
            className={`overflow-hidden rounded-xl transition-colors duration-500 ${
              state === "correct" ? "bg-ye/20" : current ? "bg-white/10" : ""
            }`}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={state}
                className="flex h-12 items-center gap-3 px-2"
                initial={{ opacity: 0, y: 10 }}
                animate={state === "wrong" ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] } : { opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, x: { duration: 0.4 } }}
              >
                <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-glass text-sm text-label-2 tabular-nums">
                  {song ? (
                    <Image src={coverUrl(song.cover, 120)} alt="" fill sizes="36px" unoptimized className="object-cover" />
                  ) : state === "skipped" ? (
                    <SkipForward className="size-4" fill="currentColor" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  {song ? (
                    <>
                      <span className="block truncate text-[15px]">{song.title}</span>
                      <span className="block truncate text-xs text-label-2">{song.album}</span>
                    </>
                  ) : (
                    <span className={`block truncate text-[15px] ${current || state === "skipped" ? "text-label-2" : "text-label-3"}`}>
                      {state === "skipped" ? "Skipped" : current ? "Listening now" : `Guess ${i + 1}`}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-xs text-label-2 tabular-nums">
                  {GUESS_TIMES[i]}s
                  {state === "correct" && <Check className="size-4 text-ye" strokeWidth={3} aria-label="Correct" />}
                  {state === "wrong" && <X className="size-4 text-miss" strokeWidth={3} aria-label="Wrong" />}
                </span>
              </motion.div>
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
