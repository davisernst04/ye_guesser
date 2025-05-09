"use client";

import { useEffect, useState } from "react";
import AudioPlayer from "./audio-player";
import Image from "next/image";
import { ComboboxDemo } from "./guess";
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

function generateGameId() {
  return crypto.randomUUID();
}

export default function Game() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Load or start a new game
  useEffect(() => {
    const saved = localStorage.getItem("songGameCurrent");
    if (saved) {
      setGameState(JSON.parse(saved));
    } else {
      startNewGame();
    }
  }, []);

  const startNewGame = () => {
    fetch("/api/random-track")
      .then((res) => res.json())
      .then((track: Track) => {
        const newGame: GameState = {
          gameId: generateGameId(),
          track,
          guesses: [],
          isCompleted: false,
        };
        setGameState(newGame);
        localStorage.setItem("songGameCurrent", JSON.stringify(newGame));
      });
  };

  const handleGuess = (guess: string) => {
    if (!gameState || gameState.isCompleted) return;

    const updated: GameState = {
      ...gameState,
      guesses: [...gameState.guesses, guess],
      isCompleted: guess.toLowerCase() === gameState.track.title.toLowerCase(),
    };

    setGameState(updated);
    localStorage.setItem("songGameCurrent", JSON.stringify(updated));
  };

  if (!gameState) return <p>Loading game...</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-center">Guess the Song</h1>

      <Image
        src={`https://e-cdns-images.dzcdn.net/images/cover/${gameState.track.md5_image}/500x500.jpg`}
        alt={gameState.track.title}
        width={300}
        height={300}
        className="rounded-lg mx-auto"
      />

      <div className="flex flex-col items-center">
        <AudioPlayer audiosrc={gameState.track.preview} time={5} />
        <ComboboxDemo onGuess={handleGuess} />
      </div>

      {/* Fake guess input for demo */}
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => handleGuess("Some Guess")}
      >
        Guess: Some Guess
      </button>

      {gameState.isCompleted && (
        <div className="text-green-600 font-bold text-center">🎉 Correct!</div>
      )}

      <button
        className="bg-gray-800 text-white px-4 py-2 rounded mt-6"
        onClick={startNewGame}
      >
        Play Again
      </button>
    </div>
  );
}
