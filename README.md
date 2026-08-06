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

### OmniRoute VPS with PM2

The production PM2 definition is `ecosystem.config.cjs`; it binds the app only to `127.0.0.1:3002`. Caddy terminates HTTPS and proxies the public site to that port.

1. Point both `solo.engineer` and `www.solo.engineer` DNS records to the OmniRoute VPS.
2. Copy `.env.example` to `/opt/solo-engineer/shared/.env.local` and set `NEXT_PUBLIC_SITE_URL=https://www.solo.engineer` plus any optional source credentials.
3. Add `deploy/Caddyfile.solo-engineer` to `/etc/caddy/Caddyfile`, validate it with `caddy validate --config /etc/caddy/Caddyfile`, then reload Caddy.
4. Run `/opt/solo-engineer/app/scripts/deploy-omniroute.sh` as `ubuntu` after the initial clone.

The deploy script pins the checkout to `origin/main`, installs locked dependencies, builds, reloads PM2, saves process state, and probes `/api/health`.
