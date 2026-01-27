"use client";

import { useEffect, useState, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const AudioPlayer = dynamic(() => import("./audio-player"), {
  ssr: false,
  loading: () => <div className="h-9 w-9 animate-pulse bg-gray-200 rounded" />,
});

const ComboboxDemo = dynamic(
  () => import("./guess").then((mod) => ({ default: mod.ComboboxDemo })),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-48 animate-pulse bg-gray-200 rounded" />
    ),
  },
);

type Track = {
  id: number;
  title: string;
  md5_image: string;
  preview: string;
};

type GameState = {
  gameId: string;
  track: Track;
  guesses: string[];
  isCompleted: boolean;
};

const STORAGE_KEY = "songGameCurrent" as const;

function generateGameId(): string {
  return crypto.randomUUID();
}

function Game() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startNewGame = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await fetch("/api/random-track", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch track");
      }

      const track = (await res.json()) as Track;
      const newGame: GameState = {
        gameId: generateGameId(),
        track,
        guesses: [],
        isCompleted: false,
      };

      setGameState(newGame);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newGame));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start new game",
      );
      console.error("Error starting new game:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGameState(JSON.parse(saved) as GameState);
        setIsLoading(false);
      } catch {
        startNewGame();
      }
    } else {
      startNewGame();
    }
  }, [startNewGame]);

  const handleGuess = useCallback(
    (guess: string) => {
      if (!gameState || gameState.isCompleted) return;

      const updated: GameState = {
        ...gameState,
        guesses: [...gameState.guesses, guess],
        isCompleted:
          guess.toLowerCase() === gameState.track.title.toLowerCase(),
      };

      setGameState(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [gameState],
  );

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-red-600 text-lg" role="alert">
            {error}
          </p>
          <Button onClick={() => startNewGame()} variant="default">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-lg">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Guess the Song</h1>

      <div className="flex justify-center">
        <Image
          src={`https://e-cdns-images.dzcdn.net/images/cover/${gameState.track.md5_image}/500x500.jpg`}
          alt={`Album cover for ${gameState.isCompleted ? gameState.track.title : "mystery track"}`}
          width={300}
          height={300}
          className="rounded-lg shadow-lg"
          priority
          quality={85}
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <AudioPlayer audiosrc={gameState.track.preview} time={5} />
        <ComboboxDemo onGuess={handleGuess} />
      </div>

      {gameState.isCompleted && (
        <div
          className="text-green-600 dark:text-green-400 font-bold text-center text-xl animate-bounce"
          role="status"
          aria-live="polite"
        >
          🎉 Correct! You guessed &quot;{gameState.track.title}&quot;!
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button onClick={() => startNewGame()} variant="secondary" size="lg">
          Play Again
        </Button>
      </div>
    </main>
  );
}

export default memo(Game);
