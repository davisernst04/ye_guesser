"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Pause, Play } from "lucide-react";

export function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const percent = (audio.currentTime / audio.duration) * 100 || 0;
      setProgress(percent);
    };

    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const newTime = (value[0] / 100) * audio.duration;
    audio.currentTime = newTime;
    setProgress(value[0]);
  };

  return (
    <Card className="w-full max-w-md p-4">
      <CardContent className="flex flex-col gap-4 items-center">
        <audio ref={audioRef} src={src} preload="metadata" />
        <div className="w-full flex justify-center gap-2">
          <Button onClick={togglePlay} variant="outline" size="icon">
            {isPlaying ? <Pause /> : <Play />}
          </Button>
        </div>
        <Slider value={[progress]} onValueChange={handleSeek} />
      </CardContent>
    </Card>
  );
}
