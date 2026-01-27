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

export const runtime = "edge";
export const revalidate = 7200;

export async function GET() {
  try {
    const albumRes = await fetch("https://api.deezer.com/artist/230/albums", {
      next: { revalidate: 7200 },
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
          next: { revalidate: 7200 },
        });

        if (!res.ok) {
          console.error(`Failed to fetch tracks for album ${album.id}`);
          return [];
        }

        const { data: trackData } = (await res.json()) as { data: Track[] };
        return trackData.filter((track) => !EXCLUDE_TRACKS.includes(track.id));
      } catch (error) {
        console.error(
          `Error fetching tracks for album ${album.id}:`,
          error instanceof Error ? error.message : "Unknown error",
        );
        return [];
      }
    });

    const allTracksArrays = await Promise.all(trackPromises);
    const allTracks = allTracksArrays.flat();

    return NextResponse.json(allTracks);
  } catch (error) {
    console.error(
      "Error in tracks API:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 },
    );
  }
}
