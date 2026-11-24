# Ye Guesser

A Wordle-style browser game where you name Kanye West songs from short audio clips. Each wrong guess plays a longer part of the clip, until you get the song or run out of guesses.

## How it works

- Daily mode has one song a day, the same for everyone. A new one starts at your local midnight.
- Unlimited mode plays random songs, as many as you want. They don't count toward your stats.
- You get 6 guesses. Each miss or skip unlocks more of the clip: 1, 3, 5, 10, 20, then 30 seconds.
- The game tracks stats and streaks and has a share button (`Ye Guesser #327 🟥⬛🟩⬜⬜⬜ 🔥12`). Guests keep stats in the browser.
- You can log in with Google or Discord to save stats to an account. The game then shows your Google or Discord name and picture.
  On your first login, your guest stats move into the new account. An account that already has
  stats keeps its own. "Delete account" removes everything.

The server runs each game. The browser holds an encrypted token, so it never sees the answer
before the game ends. The server sends only the part of the clip that has been unlocked.

The full design is in [docs/SPEC.md](docs/SPEC.md).

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI
- Supabase (auth and Postgres, optional)

## Development

```bash
npm install
echo "GAME_SECRET=$(openssl rand -hex 32)" > .env.local
npm run dev
```

Open `http://localhost:3000`.

`GAME_SECRET` encrypts game tokens and seeds the secret daily song order. Changing it
changes every daily song, so set it once per environment and keep it.

## Accounts

Without Supabase settings the game runs guest-only. To turn on accounts:

1. Run `supabase/migrations/*.sql` in the Supabase project.
2. In Supabase Auth, turn on the Google and Discord providers. Add your site's
   `/auth/callback` URLs (for example `http://localhost:3000/**`) to the redirect allow list.
3. Add these to `.env.local` (and to Vercel):

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

All Supabase calls run on the server, so none of these keys reach the browser. The tables
have row level security on and no policies, so only the server (secret key) can read or
write them. When a daily game ends, the server records the result for a logged-in player.
Guest results move into a new account only with their sealed game tokens, so a player
cannot make up results.

## Production

```bash
npm run build
npm start
```

## Vercel deployment

Deploy the repository root with the Next.js preset. Install with `npm ci` and build with
`npm run build`. The project uses npm, and `package-lock.json` is the lockfile to trust.
Set `GAME_SECRET` and the three `SUPABASE_*` variables in the project's environment variables.

Song metadata, cover art, and audio previews come from outside providers. A deploy can
succeed while one of them is down.

## Scripts

- `npm run dev`: start the development server
- `npm run build`: build for production
- `npm run start`: run the production build
- `npm run lint`: run linting

## Song list

`src/data/songs.json` is the fixed song pool. Rebuild it from Deezer with:

```bash
node scripts/build-songs.mjs
```

Check the output by hand before you commit it. Adding or removing songs changes the
daily order from that day on. Watch the Throne is left out because Deezer does not
allow playback of it.

## License

MIT
