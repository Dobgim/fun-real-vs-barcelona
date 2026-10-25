# Clásico Night

A one-night fan site for **FC Barcelona vs Real Madrid** (La Liga, Sunday 25 October 2026, 20:00 UTC).
Fan gate, countdown, live score, head-to-head record, predicted lineups, score predictions, poll,
Clásico Bingo, live reactions, nervousness meter, fan player ratings and a Madrid excuse generator.

```
client/   React 18 + Vite + TypeScript + Tailwind CSS v4   (port 5250)
server/   Node 20+ + Express + Socket.IO + SQLite (better-sqlite3)   (port 4000)
shared/   TypeScript types used by both
server/data/match.json   all the editable match content (record, results, lineups, ratings, sources)
```

## Run locally

```bash
npm install
cp server/.env.example server/.env      # set ADMIN_KEY
cp client/.env.example client/.env      # VITE_API_URL=http://localhost:4000
npm run dev                             # server :4000 + client :5250
```

- Site: http://localhost:5250
- Admin: http://localhost:5250/admin (enter your `ADMIN_KEY`)

To test on your phone on the same Wi-Fi: run `npm run dev -w client -- --host`, set
`VITE_API_URL=http://<your-pc-ip>:4000` and add `http://<your-pc-ip>:5250` to `CLIENT_ORIGIN`
(comma-separated).

## Environment variables

| Where  | Name            | What                                                                     |
| ------ | --------------- | ------------------------------------------------------------------------ |
| client | `VITE_API_URL`  | URL of the server, e.g. `https://clasico-night-api.onrender.com`         |
| server | `PORT`          | Port to listen on (Render/Railway set this for you)                      |
| server | `ADMIN_KEY`     | Secret for `/admin`. Long and random. Admin routes reject all requests without it |
| server | `CLIENT_ORIGIN` | The site URL(s) allowed by CORS, comma-separated, e.g. `https://clasico-night.vercel.app` |
| server | `DB_PATH`       | Optional. Where the SQLite file lives (default `server/data/clasico.db`) |

## Deploy

### Server on Render
1. New **Web Service** from this repo (or use `render.yaml` as a Blueprint).
2. Root directory: *(repo root)*. Runtime: Node.
3. Build command: `npm install --include=dev && npm run build -w server`
4. Start command: `npm start -w server`
5. Env vars: `ADMIN_KEY`, `CLIENT_ORIGIN` (your Vercel URL, e.g. `https://fun-real-vs-barcelona.vercel.app`; add `,https://*.vercel.app` to also allow preview links), `NODE_ENV=production`, `NODE_VERSION=20`.
6. Optional: attach a disk at `/var/data` and set `DB_PATH=/var/data/clasico.db`. Without a disk the
   database resets whenever the service restarts or redeploys, which is fine for one night, but don't
   redeploy mid-match.

Render's free tier sleeps after 15 minutes idle; open the site once before kick-off to wake it.

### Server on Railway
New project from the repo, same build/start commands as above, add the env vars, and add a volume
mounted at `/data` with `DB_PATH=/data/clasico.db`.

### Client on Vercel
1. New project from the repo. **Root directory: `client`**. Framework preset: Vite.
2. Env var: `VITE_API_URL` = your server URL (no trailing slash).
3. Deploy. `client/vercel.json` rewrites every path to `index.html` so `/admin` works.
4. Put the Vercel URL into the server's `CLIENT_ORIGIN` and restart the server.

## On match night (from your phone)

Open `/admin`:
- **Lineups**: about an hour before kick-off, type in the confirmed XIs, tick *Confirmed XI*, save.
  Add substitutes under *Subs who came on* during the match so fans can rate them.
- **Status**: *Live* at kick-off, *Half-time*, *Live* again, then *Full time* (this scores the predictions
  and starts the 2-hour fan-ratings countdown).
- **Score**: tap *+ Barça goal* / *+ Madrid goal* (optionally type the minute first). A Barça goal fires
  the full-screen GOOOL! + crowd roar for every visitor.

Rules enforced by the server: predictions close at kick-off; fan ratings open at kick-off and close
2 hours after full time; one reaction per second per visitor; names are trimmed to 24 characters and
run through a small profanity filter.

## Editing content

Everything in `server/data/match.json` (record, last results, famous wins, win probability, EA Sports
FC ratings, predicted lineups, sources) is re-read by the server whenever the file changes. The client
also bundles a copy at build time so the page still shows it if the server is down; rebuild the client
after editing.

## Artwork

`client/public/art/` holds the real club crests (from the clubs' Wikipedia pages; trademarks of
FC Barcelona and Real Madrid CF, used to identify the teams) and player photos from Wikimedia Commons
under CC BY / CC BY-SA licences. The licences require credit, which the footer and each "Players to
watch" card show; keep it if you change the photos. Paths are set in `client/src/art.config.ts`, and the
players to watch (with photo credits) live in `server/data/match.json` under `playersToWatch`.

## API

`GET /api/state?visitorId=…` · `POST /api/side | predictions | poll | ratings | reactions | nerves | bingo-winners`
(all take `visitorId`) · `POST /api/admin/score | status | lineups` (header `x-admin-key`).
Socket.IO events: `state:update`, `score:update`, `goal`, `reactions:update`, `ratings:update`.

A fan-made page for one night. Not affiliated with either club or La Liga.
