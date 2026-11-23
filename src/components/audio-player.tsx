"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FULL_CLIP_SECONDS, GUESS_TIMES } from "@/lib/game";

type Props = {
  /** Game token. The server decides how much audio it unlocks. */
  token: string;
  seconds: number;
  autoPlay?: boolean;
};

export default function AudioPlayer({ token, seconds, autoPlay = false }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

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

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      audio.currentTime = 0;
      audio.play().catch(() => setFailed(true));
    }
  }

  const percent = (s: number) => `${(s / FULL_CLIP_SECONDS) * 100}%`;

  return (
    <div className="w-full space-y-2">
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
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
        />
      )}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="absolute inset-y-0 left-0 bg-primary/30" style={{ width: percent(seconds) }} />
        <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: percent(position) }} />
        {GUESS_TIMES.slice(0, -1).map((t) => (
          <div key={t} className="absolute inset-y-0 w-px bg-background" style={{ left: percent(t) }} />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0:00</span>
        <Button
          onClick={toggle}
          variant="outline"
          size="icon"
          className="size-12 rounded-full"
          disabled={!src}
          aria-label={playing ? "Stop" : `Play ${seconds} second clip`}
        >
          {!src && !failed ? (
            <Loader2 className="size-5 animate-spin" />
          ) : playing ? (
            <Square className="size-5" />
          ) : (
            <Play className="size-5" />
          )}
        </Button>
        <span>0:{String(seconds).padStart(2, "0")}</span>
      </div>
      {failed && <p className="text-center text-xs text-red-500">Audio unavailable. Try again later.</p>}
    </div>
  );
}
