import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ye Guesser - Kanye West Music Game",
    short_name: "Ye Guesser",
    description:
      "Test your Kanye West music knowledge! Listen to track previews and guess the song title.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#13f235",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
