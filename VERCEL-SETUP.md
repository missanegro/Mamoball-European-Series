# MES: configure the online website

No localhost is required to use the deployed website. In the MES Vercel project, open Settings → Environment Variables → Add Environment Variable.

| Type | Key | Value | Environment |
| --- | --- | --- | --- |
| Secret | TURSO_AUTH_TOKEN | Complete token from Turso's Token Created dialog, first field | Production |
| Config | TURSO_DATABASE_URL | Database URL from that dialog, second field, starting libsql:// | Production |
| Config | NEXUS_SITE_URL | https://mamoball-european-series.vercel.app | Production |
| Config | DISCORD_CLIENT_ID | Discord application Client ID | Production |
| Secret | DISCORD_CLIENT_SECRET | Discord application Client Secret | Production |
| Config | DISCORD_OWNER_ID | League owner's personal Discord user ID | Production |
| Secret | OAUTH_ENCRYPTION_KEY | Private random 32-byte key represented as 64 hexadecimal characters | Production |

Copy each full value with its copy button. Do not include quotation marks, `Bearer`, or the key name in the Value field. Save the variables. Environment changes only take effect in a new deployment: Deployments → latest production deployment → Redeploy.

The database URL is not a token. A token cannot be validated from a screenshot. Keep the full token private. Discord credentials and the session encryption key are separate from the Turso token.

## Database tables

Credentials connect to the database; they do not create tables. The normal migration runner is `scripts/migrate.mjs`, which records applied files in `nexus_migrations`. Do not blindly rerun the three initial SQL files if any have already been executed manually. Check existing tables first. A partial manual setup needs reconciliation before running the migration runner; otherwise it will try to create existing tables. Never delete a populated database to resolve this.

## Step 6: deployment protection

This is Vercel's access gate in front of the entire website, separate from MES Discord login. Open the MES project → Settings → Deployment Protection → Vercel Authentication. Turning it off and saving makes the affected deployments publicly viewable. If public access is desired, test the production URL in a private/incognito browser window afterwards. Team registration remains restricted by the application's admin checks.

## Discord login

In the Discord Developer Portal, add this exact OAuth2 redirect for the configured production origin:

`https://mamoball-european-series.vercel.app/api/auth/discord/callback`

Add the credentials above and redeploy. The owner ID belongs to a person, not to the Discord application. A bot token is not required for this login flow. Optional DISCORD_GUILD_ID will restrict login to members of the league server once configured. OAuth2 alone cannot prevent somebody from owning multiple Discord accounts.

## Verify

Open `/api/health` after provisioning the schema. It should report `ok: true`. Then test Discord login and admin actions. Until storage and login are configured, a successful Vercel build does not mean the league is operational.

## Auto-join the MES Discord server

On login the site asks for `guilds.join` and adds the player to the home server automatically.

1. Discord Developer Portal → MES app → **Bot** → Reset Token → copy it.
2. Invite the bot to the home server with this URL (permission: Create Invite):
   `https://discord.com/oauth2/authorize?client_id=1557374299877277767&scope=bot&permissions=1`
3. Discord → User Settings → Advanced → Developer Mode on → right-click the server → Copy Server ID.
4. Vercel → Settings → Environment Variables (Production):
   - `DISCORD_BOT_TOKEN` = the bot token
   - `DISCORD_GUILD_ID` = the server ID
5. Redeploy.

Without both variables, login works as before (no auto-join).

## Languages

English by default. The globe button in the top bar switches to Português, Español, Français,
Italiano, Русский, Українська or Türkçe (saved in the browser; `?lang=fr` also works).
Translations live in `public/i18n/<code>.json` (key = Portuguese source text).

## Ticket button (Mamoball ID help)

The "Open a ticket on Discord" button links to `DISCORD_TICKET_URL` if set (e.g. your ticket channel link
`https://discord.com/channels/<server id>/<channel id>`). Otherwise it uses `DISCORD_GUILD_ID`
(+ `DISCORD_TICKET_CHANNEL_ID` if set). With none of these, the button is shown disabled.

## Mamoball ID and profile images

- Mamoball ID: 6 letters/digits, unique per account. The player sets it once; changes are requests
  approved in Admin → "ID change requests", limited to one per 24 hours (counted from the first save and from each request).
- Avatars and banners: Discord picture, uploaded image (stored in Turso, resized in the browser to 256×256 / 1500×500), or MES presets.
