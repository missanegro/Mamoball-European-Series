# MES — Mamoball European Series

Website-first league platform: competitions (league, knockout, groups/playoffs, Swiss), teams, player profiles, link requests, results, automatic graphics and Hall of Fame. Standard Next.js + React, SQLite locally, Turso/libSQL for Vercel. Discord OAuth2 is implemented; the bot is a later phase.

## Test on your PC

Install **Node.js 24** from https://nodejs.org. Extract this folder, open a terminal inside it, then run:

```sh
npm ci
npm run setup
npm run dev
```

Open http://localhost:3000. Setup creates a private `.env.local`, unique encryption key and an empty database. Development starts with local admin enabled so you can create your first competition, teams and players. Data survives restarts in `nexus.db`. No Discord credentials are needed for this local testing mode. Never upload that database or `.env.local`.

Read [SETUP.md](SETUP.md) for Discord login, GitHub and Vercel deployment.

## Commands

- `npm run setup`: first-time local setup; safe to rerun, preserves existing settings/data.
- `npm run dev`: PC development, bound to loopback only.
- `npm test`: frontend rendering, local authorization and mocked OAuth checks.
- `npm run build`: production build and TypeScript check.
- `npm start`: production server; requires a remote database and HTTPS OAuth origin.
- `npm run db:migrate`: applies pending migrations using `.env.local`.

## Current limits

Real Discord authorization requires your application credentials. Provider tests use simulated Discord responses. Local admin is disabled in production and on Vercel. The remote database starts empty; data from the previous preview is not imported. The UI remains Portuguese. No bot deployment is included in this website package.

## Online deployment

Team creation and competition entries are admin-only. Public registration is disabled in both the UI and API. Without a configured production database, the website opens in a clearly labelled read-only preparation mode; login and all mutations remain disabled. Configure Turso and Discord credentials to activate the league.
