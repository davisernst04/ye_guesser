"use client";
import { Button } from "@/components/ui/button";
import { Url } from "next/dist/shared/lib/router/router";
import React, { useRef } from "react";
import { Play, AudioLines } from "lucide-react";
import { useState } from "react";

const AudioPlayer = ({ audiosrc, time }: { audiosrc: Url; time: number }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playAudio = () => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play();

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      }, time * 1000);
    }
  };

  return (
    <div>
      <audio ref={audioRef} src={audiosrc as string} />
      <Button onClick={playAudio} variant="outline" size="icon">
        {isPlaying ? (
          <AudioLines className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default AudioPlayer;
