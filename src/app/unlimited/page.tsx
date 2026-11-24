import type { Metadata } from "next";
import GameLoader from "@/components/game-loader";

export const metadata: Metadata = {
  title: "Unlimited",
  description: "Unlimited Ye Guesser. Guess random Kanye West songs from short clips.",
};

export default function UnlimitedPage() {
  return <GameLoader mode="unlimited" />;
}
