"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState, useCallback, useEffect, memo } from "react";
import { Play, AudioLines, AlertCircle } from "lucide-react";

type AudioPlayerProps = {
  audiosrc: string;
  time: number;
  autoPlay?: boolean;
};

function AudioPlayer({ audiosrc, time, autoPlay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasAttemptedAutoPlay = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      console.log("Audio can play:", audiosrc);
      setIsLoaded(true);
      setError(false);
    };

    const handleError = (e: Event) => {
      console.error("Audio load error:", e, audiosrc);
      setError(true);
      setIsLoaded(false);
    };

    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded");
      setIsLoaded(true);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);

    audio.load();

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
    };
  }, [audiosrc]);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isPlaying) return;

    console.log("Attempting to play audio:", audiosrc);
    setError(false);
    
    // Reset audio before playing
    audio.currentTime = 0;
    
    setIsPlaying(true);

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Audio playing successfully");
          timeoutRef.current = setTimeout(() => {
            if (audio) {
              audio.pause();
              audio.currentTime = 0;
              setIsPlaying(false);
              console.log("Audio stopped after", time, "seconds");
            }
          }, time * 1000);
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            console.log("Autoplay blocked - user interaction required");
          } else {
            console.error("Failed to play audio:", err);
            console.error("Audio source:", audiosrc);
            setError(true);
          }
          setIsPlaying(false);
        });
    }
  }, [time, isPlaying, audiosrc]);

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
      hasAttemptedAutoPlay.current = false;
    };
  }, []);

  useEffect(() => {
    if (autoPlay && isLoaded && !isPlaying && !hasAttemptedAutoPlay.current) {
      hasAttemptedAutoPlay.current = true;
      playAudio();
    }
  }, [autoPlay, isLoaded, isPlaying]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <audio
        ref={audioRef}
        src={audiosrc}
        preload="metadata"
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
        disabled={isPlaying || error}
        aria-label={isPlaying ? "Playing audio preview" : "Play audio preview"}
        title={
          error
            ? "Failed to load audio"
            : isPlaying
              ? "Playing..."
              : isLoaded
                ? "Play preview"
                : "Loading..."
        }
      >
        {isPlaying ? (
          <AudioLines className="h-4 w-4 animate-pulse" />
        ) : error ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-500 text-center">Failed to load audio preview</p>
      )}
      {!isLoaded && !error && (
        <p className="text-xs text-muted-foreground text-center">Loading audio...</p>
      )}
    </div>
  );
}

export default memo(AudioPlayer);
