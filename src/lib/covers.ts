// Major releases in release order. The home marquee shows them top to bottom,
// one column after the next. Covers come from Deezer and live in public/covers.
export const ALBUM_COVERS = [
  { src: "/covers/01-the-college-dropout.jpg", alt: "The College Dropout" },
  { src: "/covers/02-late-registration.jpg", alt: "Late Registration" },
  { src: "/covers/03-graduation.jpg", alt: "Graduation" },
  { src: "/covers/04-808s-and-heartbreak.jpg", alt: "808s & Heartbreak" },
  { src: "/covers/05-my-beautiful-dark-twisted-fantasy.jpg", alt: "My Beautiful Dark Twisted Fantasy" },
  { src: "/covers/06-watch-the-throne.jpg", alt: "Watch the Throne" },
  { src: "/covers/07-yeezus.jpg", alt: "Yeezus" },
  { src: "/covers/08-the-life-of-pablo.jpg", alt: "The Life of Pablo" },
  { src: "/covers/09-ye.jpg", alt: "ye" },
  { src: "/covers/10-kids-see-ghosts.jpg", alt: "Kids See Ghosts" },
  { src: "/covers/11-jesus-is-king.jpg", alt: "Jesus Is King" },
  { src: "/covers/12-donda.jpg", alt: "Donda" },
  { src: "/covers/13-donda-2.jpg", alt: "Donda 2" },
  { src: "/covers/14-vultures-1.jpg", alt: "Vultures 1" },
  { src: "/covers/15-vultures-2.jpg", alt: "Vultures 2" },
  { src: "/covers/16-bully.jpg", alt: "Bully" },
];

// The albums the game uses. Watch the Throne isn't playable, so it is left out.
export const GAME_ALBUMS = ALBUM_COVERS.filter((cover) => cover.alt !== "Watch the Throne");

/** How many favourite albums an account can pick. */
export const MAX_FAVORITES = 4;
