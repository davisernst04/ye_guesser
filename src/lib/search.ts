/** Lowercase words with accents, apostrophes and punctuation removed. */
function words(text: string): string[] {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Rank a song for a search query, from 0 (hide) to 1 (best).
 * Every query word must start a word of the title or album, so "all of"
 * finds "All Of The Lights" but not "The Life Of Pablo".
 */
export function songScore(query: string, title: string, album: string): number {
  const q = words(query);
  if (q.length === 0) return 1;
  const t = words(title);
  const a = words(album);
  const inTitle = (w: string) => t.some((word) => word.startsWith(w));
  // Short titles rank first inside a tier.
  const tiebreak = t.join(" ").length / 1000;

  if (!q.every((w) => inTitle(w) || a.some((word) => word.startsWith(w)))) return 0;

  const phrase = q.join(" ");
  const name = t.join(" ");
  if (name.startsWith(phrase)) return 1 - tiebreak;
  if (` ${name}`.includes(` ${phrase}`)) return 0.8 - tiebreak;
  if (q.every(inTitle)) return 0.6 - tiebreak;
  return 0.3 - tiebreak;
}
