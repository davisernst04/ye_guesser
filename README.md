# Ye Guesser

Browser game inspired by Wordle, built around identifying Kanye West tracks from short audio clips. Each incorrect guess reveals a longer portion of the snippet until the player either identifies the song or runs out of attempts.

## How it works

- **Daily:** one song a day, the same for everyone. A new one starts at your local midnight.
- **Unlimited:** random songs, as many as you want. They don't count toward your stats.
- You get 6 guesses. Each miss or skip unlocks more of the clip: 1, 3, 5, 10, 20, then 30 seconds.
- Stats, streaks and a share button (`Ye Guesser #327 🟥⬛🟩⬜⬜⬜ 🔥12`). Guests keep stats in the browser.
- Optional login with Google or Discord saves stats to your account and shows your Google or Discord name and picture.
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

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build for production
- `npm run start` - run the production build
- `npm run lint` - run linting

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

## Vercel deployment

Deploy the repository root using the Next.js preset. Install with `npm ci` and
build with `npm run build`. Set `GAME_SECRET` and the three `SUPABASE_*` variables in
the project's environment variables.
npm is the deployment package manager;
`package-lock.json` is the authoritative lockfile. Music metadata, cover art, and audio previews rely on external
providers; their availability is separate from deployment success.
