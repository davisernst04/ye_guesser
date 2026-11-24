"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Pause, Play, Rewind } from "lucide-react";
import { FULL_CLIP_SECONDS, GUESS_TIMES } from "@/lib/game";

type Props = {
  /** Game token. The server decides how much audio it unlocks. */
  token: string;
  seconds: number;
  autoPlay?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  /** Small label in the middle under the bar, where Apple Music shows "Dolby Atmos". */
  label: string;
  /** Control to the right of the play button, such as Skip. */
  after?: React.ReactNode;
};

const time = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;
const percent = (s: number) => `${(s / FULL_CLIP_SECONDS) * 100}%`;

/** A plain white glyph button, like the transport controls in Apple Music. */
export const glyphButton =
  "tooltip grid place-items-center rounded-full text-white transition-[transform,background-color,opacity] duration-200 ease-spring outline-none hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ye/60 active:scale-85 active:bg-white/15 disabled:opacity-30";

export default function AudioPlayer({ token, seconds, autoPlay = false, onPlayingChange, label, after }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  // Where the finger is while it drags the bar. The audio seeks only on release, like Apple Music.
  const [scrub, setScrub] = useState<number | null>(null);
  const shown = scrub ?? position;

  // The parent keys this component by token, so each new token gets a fresh clip.
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    fetch("/api/game/clip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`clip ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setFailed(false);
        setSrc(url);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [token]);

  useEffect(() => {
    if (autoPlay && src) audioRef.current?.play().catch(() => {});
  }, [autoPlay, src]);

  useEffect(() => onPlayingChange?.(playing), [playing, onPlayingChange]);

  // timeupdate fires only a few times a second, so follow the playhead each frame instead.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      setPosition(audioRef.current?.currentTime ?? 0);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  function play() {
    audioRef.current?.play().catch(() => setFailed(true));
  }

  function toggle() {
    if (playing) audioRef.current?.pause();
    else play();
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setPosition(0);
    play();
  }

  function seek(to: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = to;
    setPosition(to);
  }

  /** The time under the pointer, kept inside the unlocked part of the clip. */
  function timeAt(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - rect.left) / rect.width) * FULL_CLIP_SECONDS;
    return Math.min(seconds, Math.max(0, t));
  }

  function onScrubKey(e: React.KeyboardEvent) {
    const step = seconds <= 5 ? 0.5 : 1;
    const to =
      e.key === "ArrowLeft" || e.key === "ArrowDown" ? shown - step
      : e.key === "ArrowRight" || e.key === "ArrowUp" ? shown + step
      : e.key === "Home" ? 0
      : e.key === "End" ? seconds
      : null;
    if (to === null) return;
    e.preventDefault();
    seek(Math.min(seconds, Math.max(0, to)));
  }

  const icon = !src && !failed ? "loading" : playing ? "pause" : "play";

  return (
    <div className="w-full">
      {src && (
        <audio
          ref={audioRef}
          src={src}
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setPosition(0);
          }}
        />
      )}

      {/* The unlocked part of the 30 s preview is lighter; ticks mark where each skip unlocks more.
          Drag or tap the bar to scrub, but only inside the unlocked part. The tall wrapper is the touch target. */}
      <div
        role="slider"
        tabIndex={src ? 0 : -1}
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={seconds}
        aria-valuenow={Math.round(shown * 10) / 10}
        aria-valuetext={`${time(shown)} of ${time(seconds)}`}
        aria-disabled={!src}
        onKeyDown={onScrubKey}
        onPointerDown={(e) => {
          if (!src) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setScrub(timeAt(e));
        }}
        onPointerMove={(e) => scrub !== null && setScrub(timeAt(e))}
        onPointerUp={() => {
          if (scrub !== null) seek(scrub);
          setScrub(null);
        }}
        onPointerCancel={() => setScrub(null)}
        className="-my-3 flex h-8 w-full cursor-pointer touch-none items-center rounded-full outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ye/60 aria-disabled:cursor-default"
      >
        <div
          className={`relative w-full overflow-hidden rounded-full bg-white/20 transition-[height] duration-200 ease-spring ${scrub !== null ? "h-3" : "h-1.5"}`}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/35 transition-[width] duration-700 ease-spring"
            style={{ width: percent(seconds) }}
          />
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/90" style={{ width: percent(shown) }} />
          {GUESS_TIMES.slice(0, -1).map((t) => (
            <div key={t} className="absolute inset-y-0 w-0.5 bg-black/40" style={{ left: percent(t) }} />
          ))}
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center text-[11px] text-white/55 tabular-nums">
        <span>{time(shown)}</span>
        <span className="text-[10px] tracking-wide text-white/70">{label}</span>
        <span className="text-right">-{time(Math.max(0, seconds - shown))}</span>
      </div>

      <div className="mt-5 grid grid-cols-3 items-center justify-items-center">
        <button type="button" onClick={restart} disabled={!src} aria-label="Play from the start" className={`${glyphButton} size-14`}>
          <Rewind className="size-8" fill="currentColor" strokeWidth={0} />
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={!src}
          aria-label={playing ? "Pause" : `Play ${seconds} second clip`}
          className={`${glyphButton} size-20`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={icon}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="grid place-items-center"
            >
              {icon === "loading" ? (
                <Loader2 className="size-9 animate-spin" />
              ) : icon === "pause" ? (
                <Pause className="size-12" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play className="size-12" fill="currentColor" strokeWidth={0} />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
        {after}
      </div>
      {failed && <p className="mt-3 text-center text-xs text-miss">Audio unavailable. Try again later.</p>}
    </div>
  );
}
