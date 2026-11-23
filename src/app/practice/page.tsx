import type { Metadata } from "next";
import GameLoader from "@/components/game-loader";

export const metadata: Metadata = {
  title: "Practice",
  description: "Unlimited Ye Guesser practice. Guess random Kanye West songs from short clips.",
};

export default function PracticePage() {
  return <GameLoader mode="practice" />;
}
