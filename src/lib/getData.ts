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

export async function getTracks(): Promise<Track[]> {
  const res = await fetch("https://api.deezer.com/artist/230/albums");
  const { data } = await res.json();

  const excludeIds = [
    592940562, 601728212, 613158772, 624172811, 549402492, 261749392, 617800801,
    8256130, 77941212, 9605676, 12786196,
  ];

  const filteredAlbums = data.filter(
    (album: Album) => !excludeIds.includes(album.id),
  );

  const randomAlbum =
    filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)];

  const { tracklist } = randomAlbum;
  const tracklistRes = await fetch(tracklist);
  const tracklistData = await tracklistRes.json();

  const excludeInterludesSkits = [
    126772739, 126772757, 126772745, 130412318, 1184306, 1184310, 1184317,
    1184320, 1184323, 7667060, 2931496111, 1553692562, 528869431, 528869451,
    528869471, 528869521, 528869561, 528869581, 528869591,
  ];

  const filteredTracks = tracklistData.data.filter(
    (track: Track) => !excludeInterludesSkits.includes(track.id),
  );

  return filteredTracks.map((track: Track) => ({
    title: track.title,
    label: track.title,
    value: track.title.toLowerCase().replace(/\s+/g, "-"),
  }));
}
