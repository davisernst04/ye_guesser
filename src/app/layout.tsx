import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Ye Guesser - Guess the Kanye West Track",
    template: "%s | Ye Guesser",
  },
  description:
    "Test your Kanye West music knowledge! Listen to track previews and guess the song title. Play the ultimate Ye music guessing game.",
  keywords: [
    "Kanye West",
    "Ye",
    "music game",
    "song quiz",
    "music trivia",
    "guess the song",
    "hip hop game",
  ],
  authors: [{ name: "Ye Guesser" }],
  creator: "Ye Guesser",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ye-guesser.vercel.app",
    title: "Ye Guesser - Guess the Kanye West Track",
    description:
      "Test your Kanye West music knowledge! Listen to track previews and guess the song title.",
    siteName: "Ye Guesser",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ye Guesser - Guess the Kanye West Track",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
