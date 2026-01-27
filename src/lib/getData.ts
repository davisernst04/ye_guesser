export interface Album {
  id: number;
  title: string;
  tracklist: string;
}

export interface Track {
  id: number;
  title: string;
  preview: string;
  md5_image: string;
}

const EXCLUDE_ALBUM_IDS: readonly number[] = [
  592940562, 601728212, 613158772, 624172811, 549402492, 261749392, 617800801,
  8256130, 77941212, 9605676, 12786196,
];

const EXCLUDE_TRACK_IDS: readonly number[] = [
  126772739, 126772757, 126772745, 130412318, 1184306, 1184310, 1184317,
  1184320, 1184323, 7667060, 2931496111, 1553692562, 528869431, 528869451,
  528869471, 528869521, 528869561, 528869581, 528869591,
];

export async function getTracks(): Promise<Track[]> {
  const res = await fetch("https://api.deezer.com/artist/230/albums");

  if (!res.ok) {
    throw new Error("Failed to fetch albums");
  }

  const { data } = (await res.json()) as { data: Album[] };

  const filteredAlbums = data.filter(
    (album) => !EXCLUDE_ALBUM_IDS.includes(album.id),
  );

  if (filteredAlbums.length === 0) {
    throw new Error("No albums available");
  }

  const randomAlbum =
    filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)];

  if (!randomAlbum) {
    throw new Error("Failed to select random album");
  }

  const tracklistRes = await fetch(randomAlbum.tracklist);

  if (!tracklistRes.ok) {
    throw new Error("Failed to fetch tracklist");
  }

  const tracklistData = (await tracklistRes.json()) as { data: Track[] };

  const filteredTracks = tracklistData.data.filter(
    (track) => !EXCLUDE_TRACK_IDS.includes(track.id),
  );

  return filteredTracks.map((track) => ({
    id: track.id,
    title: track.title,
    preview: track.preview,
    md5_image: track.md5_image,
  }));
}
