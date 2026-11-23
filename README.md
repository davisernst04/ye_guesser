# Ye Guesser

Browser game inspired by Wordle, built around identifying Kanye West tracks from short audio clips. Each incorrect guess reveals a longer portion of the snippet until the player either identifies the song or runs out of attempts.

## How it works

- **Daily:** one song a day, the same for everyone. A new one starts at your local midnight.
- **Practice:** unlimited random songs. They don't count toward your stats.
- You get 6 guesses. Each miss or skip unlocks more of the clip: 1, 3, 5, 10, 20, then 30 seconds.
- Stats, streaks and a share button (`Ye Guesser #327 🟥⬛🟩⬜⬜⬜ 🔥12`) are saved in your browser.

The server runs each game. The browser holds an encrypted token, so it never sees the answer
before the game ends. The server sends only the part of the clip that has been unlocked.

The full design is in [docs/SPEC.md](docs/SPEC.md).

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI

## Development

```bash
npm install
echo "GAME_SECRET=$(openssl rand -hex 32)" > .env.local
npm run dev
```

Open `http://localhost:3000`.

`GAME_SECRET` encrypts game tokens and seeds the secret daily song order. Changing it
changes every daily song, so set it once per environment and keep it.

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
build with `npm run build`. Set `GAME_SECRET` in the project's environment variables.
npm is the deployment package manager;
`package-lock.json` is the authoritative lockfile. Music metadata, cover art, and audio previews rely on external
providers; their availability is separate from deployment success.
