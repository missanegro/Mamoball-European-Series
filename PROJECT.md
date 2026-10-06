# MES — The Future of Mamoball

Mamoball European Series aims to connect European leagues through one website and a shared Discord bot, keeping a lasting record of seasons, results, clubs and players. Partner leagues should manage their own competitions while their community can discover fixtures and open competitions in one place.

## Current implementation

The website includes competitions, fixtures, standings, clubs, players, profile association requests, Hall of Fame and SVG/PNG graphics. Discord OAuth2 is implemented but requires credentials and a production database. Only admins create teams and register them in competitions. League-wide statistics currently come from results; individual goals and assists are not tracked yet. About MES and newcomer guidance explain the project without presenting planned services as active.

## Next development milestones

1. Activate the production database and owner Discord login.
2. Introduce leagues, league-scoped admin memberships, seasons and competition ownership. Every mutation and public filter must use a league ID; no partner staff may edit another league. Migrate existing competitions explicitly to the founding league before adding partners.
3. Add match events and individual/collective statistics, historical rosters and season archives. Do not infer individual statistics from team scores.
4. Add verified partner listings, news publishing, events and recruitment posts. Public submissions require moderation; team creation stays admin-only.
5. Create the MES Discord server, announcement channels and ticket support. Integrate the shared bot after the website and server are ready, with guild-to-league mapping and scoped permissions.
6. Add website chat with moderation, reporting and retention controls to reduce dependence on Discord for communication. Discord remains the current sign-in method.
7. Develop Rankeds in the planned collaboration with Iwain WKCup. No ranking rules, integrations or launch date are implemented or confirmed in this release.

## Identity wording

Discord OAuth2 verifies control of a Discord account, not a unique real person. One Discord ID maps to one MES profile. Linking a competition player requires admin approval. Suspected duplicate or fraudulent accounts require review; automatic proof of identity or guaranteed anti-alt protection must never be advertised.
