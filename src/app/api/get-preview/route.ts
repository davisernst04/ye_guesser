import { NextResponse } from "next/server";

type Album = {
  id: number;
  title: string;
  tracklist: string;
};

type Track = {
  id: number;
  title: string;
  preview: string;
  md5_image: string;
};

const EXCLUDE_ALBUMS: readonly number[] = [
  592940562, 601728212, 613158772, 624172811, 549402492, 261749392, 617800801,
  8256130, 77941212, 9605676, 12786196,
];

const EXCLUDE_TRACKS: readonly number[] = [
  126772739, 126772757, 126772745, 130412318, 1184306, 1184310, 1184317,
  1184320, 1184323, 7667060, 2931496111, 1553692562, 528869431, 528869451,
  528869471, 528869521, 528869561, 528869581, 528869591,
];

function getDayNumber(): number {
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

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { dayNumber } = await request.json();

    if (typeof dayNumber !== "number") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const currentDay = getDayNumber();
    if (dayNumber !== currentDay) {
      return NextResponse.json(
        { error: "Invalid day number" },
        { status: 400 },
      );
    }

    const albumRes = await fetch("https://api.deezer.com/artist/230/albums", {
      cache: "no-store",
    });

    if (!albumRes.ok) {
      throw new Error("Failed to fetch albums");
    }

    const { data: albums } = (await albumRes.json()) as { data: Album[] };
    const filteredAlbums = albums.filter(
      (album) => !EXCLUDE_ALBUMS.includes(album.id),
    );

    const trackPromises = filteredAlbums.map(async (album) => {
      try {
        const res = await fetch(album.tracklist, {
          cache: "no-store",
        });

        if (!res.ok) return [];

        const { data: trackData } = (await res.json()) as { data: Track[] };
        return trackData.filter((track) => !EXCLUDE_TRACKS.includes(track.id));
      } catch {
        return [];
      }
    });

    const allTracksArrays = await Promise.all(trackPromises);
    const allTracks = allTracksArrays.flat();

    if (allTracks.length === 0) {
      throw new Error("No tracks available");
    }

    const trackIndex = Math.floor(seededRandom(dayNumber) * allTracks.length);
    const dailyTrack = allTracks[trackIndex];

    if (!dailyTrack) {
      throw new Error("Failed to get daily track");
    }

    return NextResponse.json({
      preview: dailyTrack.preview,
    });
  } catch (error) {
    console.error("Error in get-preview API:", error);
    return NextResponse.json(
      { error: "Failed to get preview URL" },
      { status: 500 },
    );
  }
}
