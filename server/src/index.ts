import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { z } from 'zod';
import { db } from './db.js';
import { cleanName, isProfane } from './names.js';
import {
  getLineups,
  getMe,
  getPublicState,
  getRatings,
  getReactions,
  getScore,
  kickoffMs,
  predictionsOpen,
  ratablePlayerIds,
  ratingsOpen,
  setLineups,
  setScore,
  withIds,
} from './state.js';
import type { GoalEvent, ReactionType, ScoreState } from '../../shared/types.js';

if (existsSync('.env')) process.loadEnvFile('.env');

const PORT = Number(process.env.PORT ?? 4000);
const ADMIN_KEY = process.env.ADMIN_KEY ?? '';
const ORIGINS = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5250')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

if (!ADMIN_KEY) console.warn('[warn] ADMIN_KEY is not set: /api/admin/* will reject every request.');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: ORIGINS }));
app.use(express.json({ limit: '32kb' }));

const http = createServer(app);
const io = new Server(http, { cors: { origin: ORIGINS } });

// ---------- broadcasting ----------

let stateTimer: NodeJS.Timeout | null = null;
function broadcastState() {
  if (stateTimer) return;
  stateTimer = setTimeout(() => {
    stateTimer = null;
    io.emit('state:update', getPublicState());
  }, 300);
}

let reactionsTimer: NodeJS.Timeout | null = null;
function broadcastReactions() {
  if (reactionsTimer) return;
  reactionsTimer = setTimeout(() => {
    reactionsTimer = null;
    io.emit('reactions:update', getReactions());
  }, 250);
}

let ratingsTimer: NodeJS.Timeout | null = null;
function broadcastRatings() {
  if (ratingsTimer) return;
  ratingsTimer = setTimeout(() => {
    ratingsTimer = null;
    io.emit('ratings:update', { ratings: getRatings(), ratingsOpen: ratingsOpen() });
  }, 400);
}

// Time-based switches (predictions closing, ratings window) need a nudge with no writes happening.
setInterval(() => {
  if (io.engine.clientsCount > 0) io.emit('state:update', getPublicState());
}, 60_000);

// ---------- validation helpers ----------

const visitorId = z.string().uuid();
const name = z
  .string()
  .transform(cleanName)
  .pipe(z.string().min(1, 'Name is required').max(24))
  .refine((n) => !isProfane(n), 'Please pick a friendlier name');

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const r = schema.safeParse(body);
  if (!r.success) throw new HttpError(400, r.error.issues[0]?.message ?? 'Invalid input');
  return r.data;
}

const route =
  (fn: (req: Request, res: Response) => unknown) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const out = fn(req, res);
      if (!res.headersSent) res.json(out ?? { ok: true });
    } catch (e) {
      next(e);
    }
  };

// ---------- rate limits ----------

const writeLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });

const lastReaction = new Map<string, number>();
setInterval(() => {
  const cutoff = Date.now() - 10_000;
  for (const [k, t] of lastReaction) if (t < cutoff) lastReaction.delete(k);
}, 60_000);

// ---------- public routes ----------

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get(
  '/api/state',
  route((req) => {
    const id = typeof req.query.visitorId === 'string' && visitorId.safeParse(req.query.visitorId).success ? req.query.visitorId : undefined;
    return { ...getPublicState(), me: getMe(id) };
  }),
);

app.use('/api', (req, _res, next) => (req.method === 'POST' && !req.path.startsWith('/admin') ? writeLimiter(req, _res, next) : next()));

app.post(
  '/api/side',
  route((req) => {
    const b = parse(z.object({ visitorId, side: z.enum(['barca', 'madrid', 'neutral']) }), req.body);
    db.prepare(
      'INSERT INTO visitors (visitor_id, side, updated_at) VALUES (?, ?, ?) ON CONFLICT(visitor_id) DO UPDATE SET side = excluded.side, updated_at = excluded.updated_at',
    ).run(b.visitorId, b.side, Date.now());
    broadcastState();
  }),
);

app.post(
  '/api/predictions',
  route((req) => {
    const b = parse(
      z.object({ visitorId, name, home: z.number().int().min(0).max(9), away: z.number().int().min(0).max(9) }),
      req.body,
    );
    if (!predictionsOpen()) throw new HttpError(403, 'Predictions closed at kick-off');
    db.prepare(
      'INSERT INTO predictions (visitor_id, name, home, away, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(visitor_id) DO UPDATE SET name = excluded.name, home = excluded.home, away = excluded.away',
    ).run(b.visitorId, b.name, b.home, b.away, Date.now());
    broadcastState();
  }),
);

app.post(
  '/api/poll',
  route((req) => {
    const b = parse(z.object({ visitorId, choice: z.enum(['barca', 'draw', 'madrid']) }), req.body);
    db.prepare('INSERT INTO poll (visitor_id, choice) VALUES (?, ?) ON CONFLICT(visitor_id) DO UPDATE SET choice = excluded.choice').run(
      b.visitorId,
      b.choice,
    );
    broadcastState();
  }),
);

app.post(
  '/api/ratings',
  route((req) => {
    const b = parse(z.object({ visitorId, playerId: z.string().max(80), value: z.number().int().min(1).max(10) }), req.body);
    if (!ratingsOpen()) throw new HttpError(403, 'Fan ratings open at kick-off and close 2 hours after full time');
    if (!ratablePlayerIds().has(b.playerId)) throw new HttpError(400, 'Unknown player');
    db.prepare(
      'INSERT INTO ratings (visitor_id, player_id, value) VALUES (?, ?, ?) ON CONFLICT(visitor_id, player_id) DO UPDATE SET value = excluded.value',
    ).run(b.visitorId, b.playerId, b.value);
    broadcastRatings();
  }),
);

app.post(
  '/api/reactions',
  route((req) => {
    const b = parse(z.object({ visitorId, type: z.enum(['hype', 'close', 'card', 'ref']) }), req.body);
    const now = Date.now();
    if (now - (lastReaction.get(b.visitorId) ?? 0) < 1000) throw new HttpError(429, 'One reaction per second');
    lastReaction.set(b.visitorId, now);
    db.prepare('INSERT INTO reactions (type, count) VALUES (?, 1) ON CONFLICT(type) DO UPDATE SET count = count + 1').run(b.type as ReactionType);
    broadcastReactions();
  }),
);

app.post(
  '/api/nerves',
  route((req) => {
    const b = parse(z.object({ visitorId, value: z.number().int().min(0).max(100) }), req.body);
    db.prepare('INSERT INTO nerves (visitor_id, value) VALUES (?, ?) ON CONFLICT(visitor_id) DO UPDATE SET value = excluded.value').run(
      b.visitorId,
      b.value,
    );
    broadcastState();
  }),
);

app.post(
  '/api/bingo-winners',
  route((req) => {
    const b = parse(z.object({ visitorId, name }), req.body);
    db.prepare('INSERT INTO bingo_winners (visitor_id, name, at) VALUES (?, ?, ?) ON CONFLICT(visitor_id) DO UPDATE SET name = excluded.name').run(
      b.visitorId,
      b.name,
      Date.now(),
    );
    broadcastState();
  }),
);

// ---------- admin routes ----------

function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const given = Buffer.from(String(req.header('x-admin-key') ?? ''));
  const expected = Buffer.from(ADMIN_KEY);
  if (!ADMIN_KEY || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return next(new HttpError(401, 'Wrong admin key'));
  }
  next();
}
app.use('/api/admin', adminLimiter, requireAdmin);

app.get('/api/admin/ping', (_req, res) => res.json({ ok: true }));

function saveScore(next: ScoreState, prev: ScoreState) {
  setScore(next);
  io.emit('score:update', next);
  if (next.home > prev.home) io.emit('goal', { team: 'home', home: next.home, away: next.away, minute: next.minute } satisfies GoalEvent);
  if (next.away > prev.away) io.emit('goal', { team: 'away', home: next.home, away: next.away, minute: next.minute } satisfies GoalEvent);
  broadcastState();
  return next;
}

const minute = z.string().trim().max(8).nullable().optional();

app.post(
  '/api/admin/score',
  route((req) => {
    const b = parse(z.object({ home: z.number().int().min(0).max(30), away: z.number().int().min(0).max(30), minute }), req.body);
    const prev = getScore();
    return saveScore({ ...prev, home: b.home, away: b.away, minute: b.minute === undefined ? prev.minute : b.minute || null, updatedAt: Date.now() }, prev);
  }),
);

app.post(
  '/api/admin/status',
  route((req) => {
    const b = parse(z.object({ status: z.enum(['pre', 'live', 'ht', 'ft']), minute }), req.body);
    const prev = getScore();
    const ftAt = b.status === 'ft' ? (prev.status === 'ft' ? prev.ftAt : Date.now()) : null;
    return saveScore({ ...prev, status: b.status, ftAt, minute: b.minute === undefined ? prev.minute : b.minute || null, updatedAt: Date.now() }, prev);
  }),
);

const playerSchema = z.object({
  id: z.string().max(80).optional().default(''),
  name: z.string().trim().min(1).max(32),
  doubt: z.string().trim().max(60).optional(),
});
const lineupSchema = z.object({
  coach: z.string().trim().max(40),
  formation: z.string().trim().max(12),
  players: z.array(playerSchema).length(11),
  subs: z.array(playerSchema).max(12),
  out: z.array(z.string().trim().max(40)).max(15),
  notes: z.array(z.string().trim().max(80)).max(10),
});

app.post(
  '/api/admin/lineups',
  route((req) => {
    const b = parse(z.object({ home: lineupSchema.optional(), away: lineupSchema.optional(), confirmed: z.boolean().optional() }), req.body);
    const cur = getLineups();
    const clean = (p: z.infer<typeof playerSchema>) => ({ id: p.id, name: p.name, ...(p.doubt ? { doubt: p.doubt } : {}) });
    const next = {
      home: b.home ? withIds('home', { ...b.home, players: b.home.players.map(clean), subs: b.home.subs.map(clean) }) : cur.home,
      away: b.away ? withIds('away', { ...b.away, players: b.away.players.map(clean), subs: b.away.subs.map(clean) }) : cur.away,
      confirmed: b.confirmed ?? cur.confirmed,
    };
    setLineups(next);
    broadcastState();
    return next;
  }),
);

// ---------- errors ----------

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

http.listen(PORT, () => {
  console.log(`Clásico Night server on :${PORT} · kick-off ${new Date(kickoffMs()).toISOString()} · CORS ${ORIGINS.join(', ')}`);
});
