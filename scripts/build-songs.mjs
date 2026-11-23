// Builds src/data/songs.json from Deezer. Run: node scripts/build-songs.mjs
// The output is reviewed by hand and committed. See docs/SPEC.md "Song pool".
import { writeFile } from "node:fs/promises";

const KANYE = 230;
const YS = 14756433; // ¥$ (Kanye & Ty Dolla $ign)

// Ye-led albums, oldest first. The first copy of a song wins, so base albums
// come before their deluxe editions.
const ALBUMS = [
  68440261, // The College Dropout
  126525, // Late Registration
  86994002, // Graduation
  13833162, // 808s & Heartbreak
  707965, // My Beautiful Dark Twisted Fantasy
  6694046, // Yeezus
  13357219, // The Life Of Pablo (explicit)
  77941202, // ye (explicit)
  65434762, // KIDS SEE GHOSTS
  116355212, // JESUS IS KING
  272700102, // Donda (Deluxe)
  624563281, // VULTURES 1
  627336881, // VULTURES 2
  977096211, // DONDA 2
  949407771, // BULLY
  1010171471, // BULLY - DELUXE
];

// Singles that are features, other artists' songs, or alternate versions.
const EXCLUDE_SINGLES = new Set([
  9760426, // FourFiveSeconds (Rihanna)
  400170, // Forever (Drake)
  231269, // Impossible (Twista)
  294824962, // City of Gods (Fivio Foreign)
  320895747, // Stronger (Remixes)
  321138187, // Diamonds From Sierra Leone Remix
]);

const EXCLUDE_TRACKS = new Set([
  528869451, // Graduation Day (skit just over the length cutoff)
  4005560761, // 530 (DONDA 2 cut; the full song is on VULTURES 2)
]);

const JUNK =
  /\b(skit|interlude|remix|live|instrumental|slowed|sped up|acapella|a cappella|clean|edited|freaky girl edit|hooligans version)\b| - .*version/i;
const MIN_SECONDS = 60;

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const body = await res.json();
  if (body.error) throw new Error(`${url}: ${JSON.stringify(body.error)}`);
  return body;
}

async function albumTracks(id) {
  const { data } = await get(`https://api.deezer.com/album/${id}/tracks?limit=200`);
  return data;
}

// "FATHER (feat. Travis Scott)" -> "FATHER"; "H•A•M (Album Version Explicit)" -> "H•A•M"
function cleanTitle(title) {
  return title
    .replace(/\s*[([](feat\.?|ft\.?|with|album version|bonus track|explicit version|charlie heat version)[^)\]]*[)\]]/gi, "")
    .trim();
}

function key(title) {
  return cleanTitle(title)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const songs = [];
// Title key -> album. Two albums can hold different songs with the same title
// (KING on VULTURES 1 and BULLY), so only the same album, or a single, repeats.
const seen = new Map();

function add(track, album) {
  const k = key(track.title);
  if (!track.readable || EXCLUDE_TRACKS.has(track.id)) return;
  if (seen.has(k) && (album === "Single" || seen.get(k) === album)) return;
  if (JUNK.test(track.title) || track.duration < MIN_SECONDS) return;
  seen.set(k, album);
  songs.push({
    id: track.id,
    title: cleanTitle(track.title),
    album,
    cover: track.md5_image,
  });
}

for (const id of ALBUMS) {
  const album = await get(`https://api.deezer.com/album/${id}`);
  for (const track of album.tracks.data) add(track, album.title.replace(/ \(Deluxe\)| - DELUXE/i, ""));
}

const { data: releases } = await get(`https://api.deezer.com/artist/${KANYE}/albums?limit=200`);
const singles = releases
  .filter((r) => r.record_type !== "album" && !EXCLUDE_SINGLES.has(r.id))
  .sort((a, b) => a.release_date.localeCompare(b.release_date));

for (const single of singles) {
  for (const track of await albumTracks(single.id)) {
    if (track.artist.id === KANYE || track.artist.id === YS) add(track, "Single");
  }
}

await writeFile(new URL("../src/data/songs.json", import.meta.url), JSON.stringify(songs, null, 2) + "\n");
console.log(`${songs.length} songs`);
