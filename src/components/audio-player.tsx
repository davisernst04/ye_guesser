"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState, useCallback, useEffect, memo } from "react";
import { Play, AudioLines } from "lucide-react";

type AudioPlayerProps = {
  audiosrc: string;
  time: number;
};

function AudioPlayer({ audiosrc, time }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isPlaying) return;

    setError(false);
    setIsPlaying(true);

    audio
      .play()
      .then(() => {
        timeoutRef.current = setTimeout(() => {
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false);
          }
        }, time * 1000);
      })
      .catch((err) => {
        console.error("Failed to play audio:", err);
        setIsPlaying(false);
        setError(true);
      });
  }, [time, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <audio ref={audioRef} src={audiosrc} preload="metadata">
        <track kind="captions" />
      </audio>
      <Button
        onClick={playAudio}
        variant="outline"
        size="icon"
        disabled={isPlaying || error}
        aria-label={isPlaying ? "Playing audio preview" : "Play audio preview"}
        title={
          error
            ? "Failed to load audio"
            : isPlaying
              ? "Playing..."
              : "Play preview"
        }
      >
        {isPlaying ? (
          <AudioLines className="h-4 w-4 animate-pulse" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-500">Failed to load audio preview</p>
      )}
    </div>
  );
}

export default memo(AudioPlayer);
