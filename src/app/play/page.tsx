import type { Metadata } from "next";
import Game from "@/components/game";

export const metadata: Metadata = {
  title: "Play Game",
  description:
    "Play the Ye Guesser game. Listen to Kanye West track previews and test your knowledge by guessing the song titles.",
};

export default function PlayPage() {
  return <Game />;
}
