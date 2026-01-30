import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const arialBold = localFont({
  src: "../fonts/Arial Bold.ttf",
  variable: "--font-arial-bold",
  display: "swap",
  preload: true,
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

const customFont = localFont({
  src: "../fonts/AwesomeBi_polar-Regular.ttf",
  variable: "--font-custom",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Ye Guesser",
    template: "%s | Ye Guesser",
  },
  description:
    "Test your Ye music knowledge! Listen to track previews and guess the song title.",
  keywords: [
    "Kanye West",
    "Ye",
    "music game",
    "song quiz",
    "music trivia",
    "guess the song",
    "hip hop game",
  ],
  authors: [{ name: "Davis Ernst" }],
  creator: "Davis Ernst",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ye-guesser.vercel.app",
    title: "Ye Guesser",
    description:
      "Test your Kanye West music knowledge! Listen to track previews and guess the song title.",
    siteName: "Ye Guesser",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ye Guesser",
    description:
      "Test your Kanye West music knowledge! Listen to track previews and guess the song title.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${arialBold.variable} ${customFont.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
