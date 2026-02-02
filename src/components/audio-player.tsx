"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState, useCallback, useEffect, memo } from "react";
import { Play, AudioLines, Loader2 } from "lucide-react";

type AudioPlayerProps = {
  audiosrc: string;
  time: number;
  autoPlay?: boolean;
  dayNumber: number;
};

function AudioPlayer({
  audiosrc,
  time,
  autoPlay = false,
  dayNumber,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasAttemptedAutoPlay = useRef(false);

  const currentPreviewUrl = audiosrc
    ? `/api/audio-proxy?url=${encodeURIComponent(audiosrc)}`
    : undefined;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      setError(false);
    };

    const handleError = (e: ErrorEvent | Event) => {
      console.error("Audio load error:", e);
      setIsLoaded(false);
      if (isPlaying) setError(true);
    };

    setIsLoaded(false);
    setError(false);
    setIsPlaying(false);

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    if (currentPreviewUrl) {
      audio.load();
    }

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [currentPreviewUrl]);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isPlaying || !currentPreviewUrl) return;

    setError(false);

    const playPromise = audio.play();
    setIsBuffering(true);

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsBuffering(false);
          setIsPlaying(true);
          setIsLoaded(true);

          if (timeoutRef.current) clearTimeout(timeoutRef.current);

          timeoutRef.current = setTimeout(() => {
            if (audio) {
              audio.pause();
              audio.currentTime = 0;
              setIsPlaying(false);
            }
          }, time * 1000);
        })
        .catch((err) => {
          console.error("Playback failed:", err);
          setIsBuffering(false);
          setIsPlaying(false);
          if (err.name !== "AbortError") {
            setError(true);
          }
        });
    } else {
      setIsBuffering(false);
    }
  }, [time, isPlaying, currentPreviewUrl]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (autoPlay && isLoaded && !isPlaying && !hasAttemptedAutoPlay.current) {
      hasAttemptedAutoPlay.current = true;
      playAudio();
    }
  }, [autoPlay, isLoaded, isPlaying, playAudio]);

  useEffect(() => {
    hasAttemptedAutoPlay.current = false;
  }, [audiosrc]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <audio
        ref={audioRef}
        src={currentPreviewUrl}
        preload="auto"
        playsInline
        crossOrigin="anonymous"
      >
        <track kind="captions" />
      </audio>
      <Button
        onClick={playAudio}
        className="cursor-pointer"
        variant="outline"
        size="icon"
        disabled={isPlaying || isBuffering || !currentPreviewUrl}
        aria-label={isPlaying ? "Playing audio preview" : "Play audio preview"}
        title={isPlaying ? "Playing..." : "Play preview"}
      >
        {isBuffering ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <AudioLines className="h-4 w-4 animate-pulse" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-500 text-center">Audio unavailable</p>
      )}
    </div>
  );
}

export default memo(AudioPlayer);
