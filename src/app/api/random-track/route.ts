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

export async function GET() {
  const albumRes = await fetch("https://api.deezer.com/artist/230/albums");
  const { data: albums } = await albumRes.json();

  const excludeAlbums = [
    592940562, 601728212, 613158772, 624172811, 549402492, 261749392, 617800801,
    8256130, 77941212, 9605676, 12786196,
  ];

  const excludeTracks = [
    126772739, 126772757, 126772745, 130412318, 1184306, 1184310, 1184317,
    1184320, 1184323, 7667060, 2931496111, 1553692562, 528869431, 528869451,
    528869471, 528869521, 528869561, 528869581, 528869591,
  ];

  const filteredAlbums = albums.filter(
    (album: Album) => !excludeAlbums.includes(album.id),
  );

  const trackPromises = filteredAlbums.map(async (album: Album) => {
    try {
      const res = await fetch(album.tracklist);
      const { data: trackData } = await res.json();
      return trackData.filter(
        (track: Track) => !excludeTracks.includes(track.id),
      );
    } catch {
      console.error(`Failed to fetch tracks for album ${album.id}`);
      return [];
    }
  });

  const allTracksArrays = await Promise.all(trackPromises);
  const allTracks = allTracksArrays.flat();

  return NextResponse.json(allTracks);
}
