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

### Easiest: everything on Render (site + API on one URL)
1. https://dashboard.render.com/blueprint/new → pick this repo → **Apply** (uses `render.yaml`).
2. When it's live, open the service URL. That URL *is* the site; `/admin` is the control room.
   The admin password is the generated `ADMIN_KEY` under the service's **Environment** tab.
3. Free tier sleeps after 15 min idle: open it a few minutes before kick-off. Don't redeploy mid-match
   (without a paid disk the SQLite data resets on restart).

### Optional: website on Vercel too
Vercel can only host the **website** (static files). It cannot run the server: Socket.IO and SQLite need
a long-running process, which is why deploying `server/` there fails with `FUNCTION_INVOCATION_FAILED`.
- Root Directory: repo root, `client` or `server` all work; the `vercel.json` in each builds the website only.
- The Vercel build talks to `https://barcelonavsrealmadridfans-api.onrender.com` (`client/.env.production`).
  If your Render URL differs, set `VITE_API_URL` in Vercel's environment variables and redeploy.
- `render.yaml` allows any `https://*.vercel.app` origin, so new Vercel projects work without changes.

## On match night (from your phone)

Open `/admin`:
- **Lineups**: about an hour before kick-off, type in the confirmed XIs, tick *Confirmed XI*, save.
  Add substitutes under *Subs who came on* during the match so fans can rate them.
- **Status**: *Live* at kick-off, *Half-time*, *Live* again, then *Full time* (this scores the predictions
  and starts the 2-hour fan-ratings countdown).
- **Score**: pick the goalscorer (optional), then tap *+ Barça goal* / *+ Madrid goal* (optionally type the
  minute first). Fans who picked that scorer get +1 point at full time; tap a scorer chip to remove a mistake. A Barça goal fires
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
