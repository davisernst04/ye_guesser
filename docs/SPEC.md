# Ye Guesser v1 spec

Agreed 2026-11-23. When everything below is shipped, v1 is done.

## Purpose

A fun Kanye-only daily song guesser for big fans. It should be polished enough to
show on GitHub. It will stay Kanye-only. It has no leaderboard and no plans to grow
or make money.

## Song pool

- A fixed, clean list is committed to the repo. A script builds it from Deezer once,
  and the list is checked by hand.
- In: solo studio albums; collab albums (Kids See Ghosts, Vultures 1 and 2);
  his own bonus songs and loose singles. Only songs Deezer can play count, so
  Watch the Throne is out.
- Out: features on other artists' songs, skits, interludes, remixes, live versions,
  clean versions, and duplicates.
- The daily order is a fixed shuffle. No song repeats until the whole list has been
  used. Then a new shuffle starts.
- Deezer clip URLs expire. The server gets a fresh clip by Deezer track ID each time
  a song is played.

## Play

- Daily puzzle: puzzle #N is the same song for everyone. A new puzzle starts at the
  player's local midnight. The server accepts only today's puzzle number, plus or
  minus one day.
- 6 guesses. The clip unlocks at 1, 3, 5, 10, 20, then 30 seconds.
- Guesses are picked from the song list. A Skip button uses up one guess.
- Unlimited mode: a random song with the same rules and a "Next song" button. It never
  changes stats.

## Anti-cheat

- The server owns the game state. It checks every guess.
- The server sends only the part of the clip that the current guess has unlocked.
- No endpoint shows the answer before the game ends.

## Accounts (optional)

- Guests can play fully. Guest stats are kept in the browser.
- Login: Google and Discord, through Supabase Auth. No email or password in v1.
- After login, the account shows the name, email and picture that Google or Discord
  sends (plus the Discord username). Only the player sees them. No custom usernames
  for now.
- On first login to a new account, guest stats and today's game move into the
  account. An account that already has history keeps its own stats. Guest stats are
  dropped, never merged.
- Stored data: the provider user ID and game results. Supabase Auth also keeps the
  provider profile. The game reads it from the login token and does not copy it.
- A "delete my account" button removes all of it. A short privacy note explains this.
- Database rules stop players from writing their own results. Only the server writes
  them.

## Stats and sharing

- Stats: games played, win %, current streak, best streak, and a chart of guesses
  per win (1 to 6).
- A streak counts daily wins in a row. A loss or a missed day resets it to 0.
- The share button copies text like `Ye Guesser #327 🟥🟥🟩⬜⬜⬜ 🔥12`.
- No leaderboard, no public profiles, no friends lists.

## Look and legal

- Keep the current look. Polish it to fit the new features.
- Add a "fan project, not affiliated with Ye" note.

## Done when

- Everything above is deployed to ye-guesser.vercel.app.
- It has been tested on a phone.
- The README has been updated.

## Owner-only setup

The owner creates the Supabase project, the Google OAuth app and the Discord OAuth
app, and gives the keys. Everything else is done by the agent.
