"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
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
  preview: string;
  dayNumber?: number;
};

type GameState = {
  gameId: string;
  preview: string;
  guesses: string[];
  isCompleted: boolean;
  isFailed: boolean;
  currentGuessNumber: number;
  dayNumber: number;
  trackTitle?: string;
  trackImage?: string;
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
  const epoch = new Date(Date.UTC(2026, 0, 1));
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
        preview: track.preview,
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

        if (parsedState.dayNumber !== currentDay) {
          startNewGame();
          return;
        }

        if (typeof parsedState.currentGuessNumber !== "number") {
          parsedState.currentGuessNumber = parsedState.guesses?.length || 0;
        }

        if (typeof parsedState.isFailed !== "boolean") {
          parsedState.isFailed = false;
        }

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
    async (guess: string) => {
      if (!gameState || gameState.isCompleted || gameState.isFailed) return;

      try {
        const res = await fetch("/api/validate-guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guess, dayNumber: gameState.dayNumber }),
        });

        if (!res.ok) {
          throw new Error("Failed to validate guess");
        }

        const { isCorrect, trackTitle, trackImage } = await res.json();
        const newGuessNumber = gameState.currentGuessNumber + 1;
        const hasFailed = !isCorrect && newGuessNumber >= MAX_GUESSES;

        let updatedState: GameState = {
          ...gameState,
          guesses: [...gameState.guesses, guess],
          isCompleted: isCorrect,
          isFailed: hasFailed,
          currentGuessNumber: newGuessNumber,
        };

        if (isCorrect) {
          updatedState.trackTitle = trackTitle;
          updatedState.trackImage = trackImage;
        } else if (hasFailed) {
          const answerRes = await fetch("/api/get-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dayNumber: gameState.dayNumber }),
          });

          if (answerRes.ok) {
            const { title, md5_image } = await answerRes.json();
            updatedState.trackTitle = title;
            updatedState.trackImage = md5_image;
          }
        }

        setGameState(updatedState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
      } catch (err) {
        console.error("Error validating guess:", err);
      }
    },
    [gameState],
  );

  if (isLoading || !gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
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
    <main className="max-w-2xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 mx-auto space-y-6">
      <div className="flex flex-col justify-center">
        {gameState.isCompleted || gameState.isFailed ? (
          <>
            {gameState.isCompleted && (
              <div
                className="font-bold text-center text-lg sm:text-xl px-4"
                role="status"
                aria-live="polite"
              >
                CORRECT / YOU GUESSED &quot;{gameState.trackTitle}&quot; IN{" "}
                {gameState.guesses.length}{" "}
                {gameState.guesses.length === 1 ? "GUESS" : "GUESSES"}
              </div>
            )}

            {gameState.isFailed && (
              <div
                className="font-bold text-center text-lg sm:text-xl px-4"
                role="status"
                aria-live="polite"
              >
                INCORRECT / THE CORRECT ANSWER WAS &quot;{gameState.trackTitle}
                &quot;
              </div>
            )}
            <h1
              className="text-center font-custom font-bold text-2xl sm:text-3xl mt-4 px-4"
              style={{ color: "#13f235" }}
            >
              Come back tomorrow for a new song to guess
            </h1>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-center px-4">
              GUESS THE SONG
            </h1>

            {/* Guess Counter */}
            <div className="text-center space-y-1 mt-3 px-4">
              <p className="text-base sm:text-lg">
                GUESS{" "}
                <span className="font-bold text-primary">
                  {gameState.currentGuessNumber + 1}
                </span>{" "}
                OF <span className="font-bold">{MAX_GUESSES}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                AUDIO PLAYS FOR {currentTime} SECOND
                {currentTime !== 1 ? "S" : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {gameState.isCompleted || gameState.isFailed ? (
        <div className="flex justify-center px-4">
          <div className="w-full max-w-[280px] sm:max-w-xs">
            <AspectRatio ratio={1 / 1}>
              <Image
                src={`https://e-cdns-images.dzcdn.net/images/cover/${gameState.trackImage}/500x500.jpg`}
                alt={`Album cover for ${gameState.trackTitle}`}
                fill
                className="rounded-lg shadow-lg object-cover"
                priority
                quality={85}
              />
            </AspectRatio>
          </div>
        </div>
      ) : (
        <div className="flex justify-center px-4">
          <div className="w-full max-w-[280px] sm:max-w-xs">
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

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
        <AudioPlayer 
          audiosrc={gameState.preview} 
          time={gameState.isCompleted || gameState.isFailed ? 30 : currentTime}
          autoPlay={gameState.isCompleted || gameState.isFailed}
        />
        <ComboboxDemo 
          onGuess={handleGuess} 
          disabled={gameState.isCompleted || gameState.isFailed}
        />
      </div>

      {gameState.guesses.length > 0 && (
        <div className="flex justify-center px-4">
          <div className="w-full max-w-[280px] sm:max-w-xs space-y-2">
            <div className="items-center justify-center">
              <h3 className="font-semibold text-sm sm:text-base">
                PREVIOUS / GUESSES
              </h3>
              {gameState.guesses.map((guess, idx) => (
                <div key={idx} className="text-left text-sm">
                  {gameState.isCompleted &&
                  idx === gameState.guesses.length - 1 ? (
                    <>
                      <span className="text-green-500 font-medium">
                        {guess}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        ({GUESS_TIMES[idx]}s)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500 line-through">{guess}</span>
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        ({GUESS_TIMES[idx]}s)
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
