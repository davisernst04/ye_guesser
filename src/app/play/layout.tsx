import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play Game",
  description:
    "Play the Ye Guesser game. Listen to Kanye West track previews and test your knowledge by guessing the song titles.",
};

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
