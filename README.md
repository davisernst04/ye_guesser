# Ye Guesser

Browser game inspired by Wordle, built around identifying Kanye West tracks from short audio clips. Each incorrect guess reveals a longer portion of the snippet until the player either identifies the song or runs out of attempts.

## Overview

Ye Guesser is a lightweight music guessing game with a simple loop:

- hear a short audio sample
- submit a track guess
- unlock a longer snippet after each incorrect attempt
- continue until the track is identified or attempts are exhausted

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI

## Development

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

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

## Data and APIs

The project does not require local environment variables for basic development. It relies on publicly accessible music metadata and preview sources.

## License

MIT
