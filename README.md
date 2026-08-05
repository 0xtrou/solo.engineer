# Signal

A personal, live web reader for AI research, SOTA technology, business growth, global compliance, social administration, and Vietnam / US technology regulation.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Public APIs and RSS feeds, normalized through `app/api/feed`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Configuration

Copy `.env.example` to `.env.local` to customize optional GitHub credentials or the public Bluesky profiles used in the feed.

## Deploy

This app uses server-side fetching and a Next route handler for live data. Deploy it to a Next.js runtime such as Vercel, Netlify, or a Node server. GitHub Pages alone cannot serve the live `/api/feed` route.
