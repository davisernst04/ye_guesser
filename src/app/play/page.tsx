"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const AudioPlayer = dynamic(() => import("@/components/audio-player"), {
  ssr: false,
  loading: () => <div className="h-9 w-9 animate-pulse bg-gray-200 rounded" />,
});

const ComboboxDemo = dynamic(
  () =>
    import("@/components/guess").then((mod) => ({ default: mod.ComboboxDemo })),
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
  dayNumber?: number;
};

type GameState = {
  gameId: string;
  track: Track;
  guesses: string[];
  isCompleted: boolean;
  isFailed: boolean;
  currentGuessNumber: number;
  dayNumber: number;
};

const STORAGE_KEY = "songGameCurrent" as const;

const GUESS_TIMES = [1, 3, 5, 10, 20, 30] as const;
const MAX_GUESSES = 6;

function generateGameId(): string {
  return crypto.randomUUID();
}

function getCurrentDayNumber(): number {
  const now = new Date();
  const utcDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const epoch = new Date(Date.UTC(2026, 0, 1)); // January 1, 2026
  const daysSinceEpoch = Math.floor(
    (utcDate.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysSinceEpoch;
}

export default function PlayPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startNewGame = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Clear localStorage to ensure fresh start
      localStorage.removeItem(STORAGE_KEY);

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
        isFailed: false,
        currentGuessNumber: 0,
        dayNumber: track.dayNumber ?? getCurrentDayNumber(),
      };

      setGameState(newGame);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newGame));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start new game");
      console.error("Error starting new game:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentDay = getCurrentDayNumber();
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsedState = JSON.parse(saved) as GameState;

        // Check if it's a new day - if so, start a new game
        if (parsedState.dayNumber !== currentDay) {
          startNewGame();
          return;
        }

        // Ensure currentGuessNumber exists for old saved games
        if (typeof parsedState.currentGuessNumber !== "number") {
          parsedState.currentGuessNumber = parsedState.guesses?.length || 0;
        }

        // Ensure isFailed exists for old saved games
        if (typeof parsedState.isFailed !== "boolean") {
          parsedState.isFailed = false;
        }

        // Ensure dayNumber exists for old saved games
        if (typeof parsedState.dayNumber !== "number") {
          parsedState.dayNumber = currentDay;
        }

        setGameState(parsedState);
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
      if (!gameState || gameState.isCompleted || gameState.isFailed) return;

      const isCorrect =
        guess.toLowerCase() === gameState.track.title.toLowerCase();
      const newGuessNumber = gameState.currentGuessNumber + 1;
      const hasFailed = !isCorrect && newGuessNumber >= MAX_GUESSES;

      const updated: GameState = {
        ...gameState,
        guesses: [...gameState.guesses, guess],
        isCompleted: isCorrect,
        isFailed: hasFailed,
        currentGuessNumber: newGuessNumber,
      };

      setGameState(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },
    [gameState],
  );

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

  const currentGuessIndex = Math.min(
    gameState.currentGuessNumber,
    MAX_GUESSES - 1,
  );
  const currentTime: number =
    GUESS_TIMES[currentGuessIndex as 0 | 1 | 2 | 3 | 4 | 5];

  return (
    <main className="container mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Guess the Song</h1>

      {/* Guess Counter */}
      <div className="text-center">
        <p className="text-lg">
          Guess{" "}
          <span className="font-bold text-primary">
            {gameState.currentGuessNumber + 1}
          </span>{" "}
          of <span className="font-bold">{MAX_GUESSES}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Audio plays for {currentTime} second{currentTime !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Previous Guesses */}
      {gameState.guesses.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Previous Guesses:</h3>
          <div className="space-y-1">
            {gameState.guesses.map((guess, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">#{idx + 1}</span>
                <span className="text-red-500 line-through">{guess}</span>
                <span className="text-xs text-muted-foreground">
                  ({GUESS_TIMES[idx]}s)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState.isCompleted ? (
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <AspectRatio ratio={1 / 1}>
              <Image
                src={`https://e-cdns-images.dzcdn.net/images/cover/${gameState.track.md5_image}/500x500.jpg`}
                alt={`Album cover for ${gameState.track.title}`}
                fill
                className="rounded-lg shadow-lg object-cover"
                priority
                quality={85}
              />
            </AspectRatio>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <AspectRatio ratio={1 / 1}>
              <Image
                src="/ye_stare.jpg"
                alt="Ye Stare"
                fill
                className="rounded-lg shadow-lg object-cover"
                priority
                quality={85}
              />
            </AspectRatio>
          </div>
        </div>
      )}

      {!gameState.isCompleted && !gameState.isFailed && (
        <div className="flex flex-col items-center gap-4">
          <AudioPlayer audiosrc={gameState.track.preview} time={currentTime} />
          <ComboboxDemo onGuess={handleGuess} />
        </div>
      )}

      {gameState.isCompleted && (
        <div
          className="text-green-600 dark:text-green-400 font-bold text-center text-xl animate-bounce"
          role="status"
          aria-live="polite"
        >
          🎉 Correct! You guessed &quot;{gameState.track.title}&quot; in{" "}
          {gameState.guesses.length}{" "}
          {gameState.guesses.length === 1 ? "guess" : "guesses"}!
        </div>
      )}

      {gameState.isFailed && (
        <div
          className="text-red-600 dark:text-red-400 font-bold text-center text-xl"
          role="status"
          aria-live="polite"
        >
          ❌ Game Over! The correct answer was &quot;{gameState.track.title}
          &quot;
        </div>
      )}
    </main>
  );
}
