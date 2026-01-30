"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState, useCallback, useEffect, memo } from "react";
import { Play, AudioLines, AlertCircle } from "lucide-react";

type AudioPlayerProps = {
  audiosrc: string;
  time: number;
  autoPlay?: boolean;
  dayNumber: number;
};

function AudioPlayer({ audiosrc, time, autoPlay = false, dayNumber }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasAttemptedAutoPlay = useRef(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(audiosrc);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      console.log("Audio can play:", audiosrc);
      setIsLoaded(true);
      setError(false);
    };

    const handleError = (e: ErrorEvent | Event) => {
      console.error("Audio load error:", e, audiosrc);
      const audioElement = e.target as HTMLAudioElement;
      if (audioElement?.error) {
        console.error("Audio error code:", audioElement.error.code);
        console.error("Audio error message:", audioElement.error.message);
      }
      // Don't set error on initial load, only on play failure
      setIsLoaded(false);
    };

    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded");
      setIsLoaded(true);
      setError(false);
    };

    const handleLoadedData = () => {
      console.log("Audio data loaded");
      setIsLoaded(true);
      setError(false);
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("error", handleError);

    // Don't preload, let user interaction trigger load
    // audio.load();

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("error", handleError);
    };
  }, [audiosrc]);

  const playAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || isPlaying) return;

    console.log("Attempting to play audio:", currentPreviewUrl);
    setError(false);
    
    try {
      // Fetch fresh preview URL
      const res = await fetch("/api/get-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch preview URL");
      }

      const { preview } = await res.json();
      setCurrentPreviewUrl(preview);
      
      // Update audio source with fresh URL
      audio.src = preview;
    } catch (err) {
      console.error("Failed to fetch fresh preview URL:", err);
      setError(true);
      return;
    }
    
    // Load the audio on user interaction for mobile Safari
    if (audio.readyState < 2) {
      audio.load();
    }
    
    // Reset audio before playing
    audio.currentTime = 0;
    
    setIsPlaying(true);

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Audio playing successfully");
          setIsLoaded(true);
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
            setIsPlaying(false);
          } else if (err.name === 'NotSupportedError') {
            console.error("Audio format not supported:", currentPreviewUrl);
            setError(true);
            setIsPlaying(false);
          } else {
            console.error("Failed to play audio:", err);
            console.error("Error name:", err.name);
            console.error("Audio source:", currentPreviewUrl);
            setError(true);
            setIsPlaying(false);
          }
        });
    }
  }, [time, isPlaying, currentPreviewUrl, dayNumber]);

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
        src={currentPreviewUrl}
        preload="none"
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
        disabled={isPlaying}
        aria-label={isPlaying ? "Playing audio preview" : "Play audio preview"}
        title={isPlaying ? "Playing..." : "Play preview"}
      >
        {isPlaying ? (
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
