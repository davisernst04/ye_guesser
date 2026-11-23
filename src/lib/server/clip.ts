// Cuts the start of a Deezer MP3 preview, so the browser never gets more
// audio than the player has unlocked.
import "server-only";

const BITRATES_KBPS = {
  v1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  v2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] } as const;

type Frame = { length: number; seconds: number };

/** Parses an MPEG Layer III frame header at offset, or returns null. */
function readFrame(buf: Uint8Array, at: number): Frame | null {
  if (at + 4 > buf.length || buf[at] !== 0xff || (buf[at + 1]! & 0xe0) !== 0xe0) return null;
  const version = (buf[at + 1]! >> 3) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
  const layer = (buf[at + 1]! >> 1) & 3; // 1 = Layer III
  if (version === 1 || layer !== 1) return null;
  const bitrate = (version === 3 ? BITRATES_KBPS.v1 : BITRATES_KBPS.v2)[buf[at + 2]! >> 4];
  const sampleRate = SAMPLE_RATES[version as 0 | 2 | 3][(buf[at + 2]! >> 2) & 3];
  if (!bitrate || !sampleRate) return null;
  const padding = (buf[at + 2]! >> 1) & 1;
  const samples = version === 3 ? 1152 : 576;
  return {
    length: Math.floor((samples / 8) * (bitrate * 1000) / sampleRate) + padding,
    seconds: samples / sampleRate,
  };
}

function id3Size(buf: Uint8Array): number {
  if (buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) return 0; // "ID3"
  const size = ((buf[6]! & 0x7f) << 21) | ((buf[7]! & 0x7f) << 14) | ((buf[8]! & 0x7f) << 7) | (buf[9]! & 0x7f);
  return 10 + size + (buf[5]! & 0x10 ? 10 : 0);
}

/** True if a frame is a Xing/Info header, which states the full length of the file. */
function isInfoFrame(buf: Uint8Array, at: number, length: number): boolean {
  const text = new TextDecoder("latin1").decode(buf.subarray(at, at + Math.min(length, 64)));
  return text.includes("Xing") || text.includes("Info");
}

/** The first `seconds` of MP3 audio, cut on a frame edge, without tags or length headers. */
export function sliceMp3(buf: Uint8Array, seconds: number): Uint8Array {
  let at = id3Size(buf);
  const first = readFrame(buf, at);
  if (first && isInfoFrame(buf, at, first.length)) at += first.length;
  const start = at;
  let total = 0;
  while (total < seconds) {
    const frame = readFrame(buf, at);
    if (!frame || at + frame.length > buf.length) break;
    at += frame.length;
    total += frame.seconds;
  }
  return buf.subarray(start, at);
}

/** Downloads the current preview for a Deezer track. Preview URLs expire, so look it up each time. */
export async function fetchPreview(trackId: number): Promise<Uint8Array> {
  const meta = await fetch(`https://api.deezer.com/track/${trackId}`, { cache: "no-store" });
  if (!meta.ok) throw new Error(`Deezer track ${trackId}: ${meta.status}`);
  const { preview } = (await meta.json()) as { preview?: string };
  if (!preview || !new URL(preview).hostname.endsWith(".dzcdn.net")) {
    throw new Error(`Deezer track ${trackId}: no preview`);
  }
  const audio = await fetch(preview, { cache: "no-store" });
  if (!audio.ok) throw new Error(`Deezer preview ${trackId}: ${audio.status}`);
  return new Uint8Array(await audio.arrayBuffer());
}
