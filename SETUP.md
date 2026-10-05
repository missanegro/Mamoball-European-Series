# PC → GitHub → Vercel

## 1. Run the website locally

Install Node.js 24 (https://nodejs.org) and Git (https://git-scm.com/downloads). Extract `nexus-league.zip`. In Windows, open the extracted `nexus-league` folder, click the Explorer address bar, type `cmd`, and press Enter. On macOS/Linux open Terminal in that folder.

Run these commands one at a time:

```sh
npm ci
npm run setup
npm run dev
```

Open http://localhost:3000. Keep the terminal running. Press Ctrl+C to stop it. Restart later with `npm run dev`; you do not need to reinstall or rerun setup each time. Your teams and competitions remain in `nexus.db`.

Local admin mode lets you test the complete administration flow without Discord. It is accepted only in development, only on localhost/127.0.0.1, and never on Vercel. For testing genuine login/logout behavior, set `NEXUS_LOCAL_ADMIN=false` in `.env.local` and restart.

## 2. Enable Discord login

1. Open https://discord.com/developers/applications and create an application named after the league.
2. In OAuth2, add exactly `http://localhost:3000/api/auth/discord/callback` to Redirects.
3. Copy the Client ID and Client Secret into `.env.local` as `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`. Do not put secrets in public JavaScript or commit them.
4. In Discord settings, enable Developer Mode, then copy your **user ID**. Put it in `DISCORD_OWNER_ID`. This is your admin identity; it is different from the application's Client ID.
5. Set `NEXUS_LOCAL_ADMIN=false`, restart `npm run dev`, and click “Entrar com Discord”.

The setup script already generated `OAUTH_ENCRYPTION_KEY`; keep it private. The app requests `identify` and `guilds.members.read`, uses an authorization code exchanged on the server, checks one-time browser-bound state and stores encrypted access tokens with hashed sessions. Session expiry requires signing in again.

The league Discord server can be created later. Until `DISCORD_GUILD_ID` is configured, users can log in and edit their profiles, while league registrations require the owner. Once set, login checks server membership and pending membership screening; role permissions are checked again for mutations. Optional `DISCORD_ADMIN_ROLE_IDS` is a comma-separated list of role IDs. No bot token is needed for website login.

## 3. Put your source on GitHub

Create an **empty private repository** named `nexus-league` at https://github.com/new. Leave README, license and .gitignore unchecked because they are already in this package.

From your project folder:

```sh
git init
git add .
git commit -m "Create NEXUS league website with Discord OAuth"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nexus-league.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. Git may ask for your name/email and browser sign-in. Alternatively, GitHub Desktop can add this local repository and publish it as private. Before pushing, `git status --short` should never list `.env.local`, `nexus.db` or `node_modules`; the included .gitignore excludes them. GitHub Actions checks tests and build on pushes.

## 4. Create the deployment database

Vercel needs a persistent remote database. This project supports Turso (https://turso.tech) using the same SQLite schema as the local version.

Create a database in your Turso account and obtain its `libsql://...` URL and auth token. Create a private `.env.production` in the project folder containing:

```dotenv
TURSO_DATABASE_URL=libsql://YOUR_DATABASE_HOST
TURSO_AUTH_TOKEN=YOUR_DATABASE_TOKEN
```

Apply the schema **once before the first deployment**, and again whenever new migration files are added:

```sh
node --env-file=.env.production scripts/migrate.mjs
```

This uses an ordered migration ledger and transactions. Rerunning it skips applied migrations. The production database starts empty; local test data is not uploaded. Keep this environment file out of Git (already ignored).

## 5. Deploy on Vercel

Open https://vercel.com/new, connect GitHub and import `nexus-league`. Select Next.js, root directory `./`, build command `npm run build`, install command `npm ci`, and Node.js 24.x.

Add these server environment variables for **Production** before deploying:

| Variable | Value |
| --- | --- |
| TURSO_DATABASE_URL | Your remote database URL |
| TURSO_AUTH_TOKEN | Your database token |
| NEXUS_SITE_URL | Exact final HTTPS origin, e.g. `https://nexus-league.vercel.app`, no trailing slash |
| DISCORD_CLIENT_ID | Your Discord application Client ID |
| DISCORD_CLIENT_SECRET | Your Discord application secret |
| DISCORD_OWNER_ID | Your personal Discord user ID |
| OAUTH_ENCRYPTION_KEY | A fresh random 64-character hex key |
| DISCORD_GUILD_ID | Optional until the league server exists |
| DISCORD_ADMIN_ROLE_IDS | Optional comma-separated admin role IDs |

Generate a fresh production encryption key locally:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not prefix secrets with `NEXT_PUBLIC_`. Do not set `NEXUS_LOCAL_ADMIN=true` in Vercel. Never use `file:nexus.db` there; the app rejects local production storage.

Deploy. If Vercel assigns a different domain, update `NEXUS_SITE_URL` to that exact HTTPS origin and redeploy. In Discord OAuth2 Redirects add the corresponding URL:

```text
https://YOUR_PROJECT.vercel.app/api/auth/discord/callback
```

Keep the localhost redirect for development. Login is intentionally tied to the canonical origin; arbitrary preview deployment domains will not accept it. Use separate credentials/database and an explicitly registered callback if you want preview authentication.

Test the live `/api/health` URL, browse the website while signed out, then sign in with your owner Discord account and create a test competition. Environment-variable changes require redeployment. Future pushes to main trigger Vercel deployments when the repository is connected.

## Troubleshooting

- `npm` not recognized: install Node.js 24 and reopen the terminal.
- Port 3000 occupied: stop the other process; keep port 3000 for the configured Discord redirect.
- Login not configured: check `.env.local` or Vercel variables and restart/redeploy.
- Invalid redirect: protocol, host, port and callback path must match exactly.
- Cannot create teams after login: configure the league guild ID and join that server, or use your configured owner ID.
- Database not configured / missing table: run migrations against the matching database before opening the website.
- To reset local testing: stop the server, remove only your local `nexus.db` and rerun setup. This deletes local test data.

## Reference documentation

- Discord OAuth2: https://docs.discord.com/developers/topics/oauth2
- Turso JavaScript client: https://docs.turso.tech/sdk/ts/reference
- Vercel environment variables: https://vercel.com/docs/environment-variables/managing-environment-variables
- Vercel GitHub integration: https://vercel.com/docs/git/vercel-for-github
