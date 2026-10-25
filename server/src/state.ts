import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, kvGet, kvSet } from './db.js';
import { slug } from './names.js';
import {
  RATINGS_WINDOW_MS,
  type Lineup,
  type Lineups,
  type MatchData,
  type MeState,
  type PollChoice,
  type PublicState,
  type RatingAgg,
  type ReactionType,
  type ScoreState,
  type Side,
} from '../../shared/types.js';

// match.json is re-read whenever the file changes, so it can be edited while the server runs.
const matchPath = fileURLToPath(new URL('../data/match.json', import.meta.url));
let matchCache: { mtime: number; data: MatchData } | null = null;

export function getMatch(): MatchData {
  const mtime = statSync(matchPath).mtimeMs;
  if (!matchCache || matchCache.mtime !== mtime) {
    matchCache = { mtime, data: JSON.parse(readFileSync(matchPath, 'utf8')) as MatchData };
  }
  return matchCache.data;
}

export const kickoffMs = () => Date.parse(getMatch().kickoff);

const DEFAULT_SCORE: ScoreState = { status: 'pre', home: 0, away: 0, minute: null, ftAt: null, scorers: [], updatedAt: 0 };

export function getScore(): ScoreState {
  return { ...DEFAULT_SCORE, ...kvGet<ScoreState>('score') };
}
export function setScore(s: ScoreState) {
  kvSet('score', s);
}

/** Admin-confirmed lineups override the predicted ones from match.json. */
export function getLineups(): Lineups {
  return kvGet<Lineups>('lineups') ?? { ...getMatch().lineups, confirmed: false };
}
export function setLineups(l: Lineups) {
  kvSet('lineups', l);
}

export function withIds(team: 'home' | 'away', lineup: Lineup): Lineup {
  const fix = (p: Lineup['players'][number]) => ({ ...p, id: `${team}:${slug(p.name)}` });
  return { ...lineup, players: lineup.players.map(fix), subs: lineup.subs.map(fix) };
}

export function ratablePlayerIds(): Set<string> {
  const l = getLineups();
  return new Set([...l.home.players, ...l.home.subs, ...l.away.players, ...l.away.subs].map((p) => p.id));
}

export function predictionsOpen(now = Date.now()) {
  return getScore().status === 'pre' && now < kickoffMs();
}

export function ratingsOpen(now = Date.now()) {
  const s = getScore();
  if (s.status === 'live' || s.status === 'ht') return true;
  if (s.status === 'pre') return now >= kickoffMs();
  return s.ftAt !== null && now < s.ftAt + RATINGS_WINDOW_MS;
}

/** Exact score 3, correct result 1, plus 1 if the picked player scored (or "no goalscorer" in a 0–0). */
function points(p: { home: number; away: number; scorer: string | null }, s: ScoreState) {
  const base = p.home === s.home && p.away === s.away ? 3 : Math.sign(p.home - p.away) === Math.sign(s.home - s.away) ? 1 : 0;
  const scorerHit = p.scorer === 'none' ? s.home + s.away === 0 : p.scorer !== null && s.scorers.includes(p.scorer);
  return base + (scorerHit ? 1 : 0);
}

export function getRatings(): Record<string, RatingAgg> {
  const rows = db
    .prepare('SELECT player_id, AVG(value) AS avg, COUNT(*) AS count FROM ratings GROUP BY player_id')
    .all() as { player_id: string; avg: number; count: number }[];
  return Object.fromEntries(rows.map((r) => [r.player_id, { avg: Math.round(r.avg * 10) / 10, count: r.count }]));
}

export function getReactions(): Record<ReactionType, number> {
  const out: Record<ReactionType, number> = { hype: 0, close: 0, card: 0, ref: 0 };
  for (const r of db.prepare('SELECT type, count FROM reactions').all() as { type: ReactionType; count: number }[]) {
    out[r.type] = r.count;
  }
  return out;
}

export function getPublicState(): PublicState {
  const score = getScore();
  const ft = score.status === 'ft';

  const poll: Record<PollChoice, number> = { barca: 0, draw: 0, madrid: 0 };
  for (const r of db.prepare('SELECT choice, COUNT(*) AS n FROM poll GROUP BY choice').all() as { choice: PollChoice; n: number }[]) {
    poll[r.choice] = r.n;
  }

  const sides: Record<Side, number> = { barca: 0, madrid: 0, neutral: 0 };
  for (const r of db.prepare('SELECT side, COUNT(*) AS n FROM visitors GROUP BY side').all() as { side: Side; n: number }[]) {
    sides[r.side] = r.n;
  }

  const preds = db
    .prepare('SELECT name, home, away, scorer, created_at FROM predictions ORDER BY created_at DESC LIMIT 1000')
    .all() as { name: string; home: number; away: number; scorer: string | null; created_at: number }[];
  const entries = preds.map((p) => ({ name: p.name, home: p.home, away: p.away, scorer: p.scorer, points: ft ? points(p, score) : null }));
  if (ft) entries.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

  const counts = db
    .prepare(
      "SELECT home || '-' || away AS score, COUNT(*) AS count FROM predictions GROUP BY home, away ORDER BY count DESC, home DESC LIMIT 12",
    )
    .all() as { score: string; count: number }[];

  const scorerCounts = db
    .prepare('SELECT scorer, COUNT(*) AS count FROM predictions WHERE scorer IS NOT NULL GROUP BY scorer ORDER BY count DESC LIMIT 12')
    .all() as { scorer: string; count: number }[];

  const nerves = db
    .prepare("SELECT AVG(n.value) AS avg, COUNT(*) AS count FROM nerves n JOIN visitors v ON v.visitor_id = n.visitor_id WHERE v.side = 'barca'")
    .get() as { avg: number | null; count: number };

  const bingoWinners = db.prepare('SELECT name, at FROM bingo_winners ORDER BY at ASC LIMIT 200').all() as { name: string; at: number }[];

  return {
    match: getMatch(),
    lineups: getLineups(),
    score,
    poll,
    predictions: { open: predictionsOpen(), entries, counts, scorerCounts },
    ratings: getRatings(),
    ratingsOpen: ratingsOpen(),
    reactions: getReactions(),
    sides,
    nerves: { avg: nerves.avg === null ? null : Math.round(nerves.avg), count: nerves.count },
    bingoWinners,
    serverTime: Date.now(),
  };
}

export function getMe(visitorId: string | undefined): MeState {
  const empty: MeState = { side: null, prediction: null, poll: null, ratings: {}, nerves: null, bingo: false };
  if (!visitorId) return empty;
  const side = db.prepare('SELECT side FROM visitors WHERE visitor_id = ?').get(visitorId) as { side: Side } | undefined;
  const prediction = db.prepare('SELECT name, home, away, scorer FROM predictions WHERE visitor_id = ?').get(visitorId) as MeState['prediction'] | undefined;
  const poll = db.prepare('SELECT choice FROM poll WHERE visitor_id = ?').get(visitorId) as { choice: PollChoice } | undefined;
  const ratings = db.prepare('SELECT player_id, value FROM ratings WHERE visitor_id = ?').all(visitorId) as { player_id: string; value: number }[];
  const nerves = db.prepare('SELECT value FROM nerves WHERE visitor_id = ?').get(visitorId) as { value: number } | undefined;
  const bingo = db.prepare('SELECT 1 FROM bingo_winners WHERE visitor_id = ?').get(visitorId);
  return {
    side: side?.side ?? null,
    prediction: prediction ?? null,
    poll: poll?.choice ?? null,
    ratings: Object.fromEntries(ratings.map((r) => [r.player_id, r.value])),
    nerves: nerves?.value ?? null,
    bingo: Boolean(bingo),
  };
}
