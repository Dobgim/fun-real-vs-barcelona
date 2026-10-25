import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { GoalEvent, MatchData, MeState, PublicState, RatingAgg, ReactionType, ScoreState, Side, Status } from '@shared/types';
import matchJson from '@data/match.json';
import { API_URL, fetchState, post } from './api';
import { saveSide, savedSide } from './visitor';
import { celebrateGoal, celebrateAwayGoal } from './celebrate';

const MATCH = matchJson as MatchData;

/** Static content used when the backend can't be reached. */
export const FALLBACK: PublicState = {
  match: MATCH,
  lineups: { ...MATCH.lineups, confirmed: false },
  score: { status: 'pre', home: 0, away: 0, minute: null, ftAt: null, scorers: [], updatedAt: 0 },
  poll: { barca: 0, draw: 0, madrid: 0 },
  predictions: { open: true, entries: [], counts: [], scorerCounts: [] },
  ratings: {},
  ratingsOpen: false,
  reactions: { hype: 0, close: 0, card: 0, ref: 0 },
  sides: { barca: 0, madrid: 0, neutral: 0 },
  nerves: { avg: null, count: 0 },
  bingoWinners: [],
  serverTime: Date.now(),
};

const EMPTY_ME: MeState = { side: null, prediction: null, poll: null, ratings: {}, nerves: null, bingo: false };

let clockOffset = 0;
export const serverNow = () => Date.now() + clockOffset;

export function phaseOf(score: ScoreState, kickoff: number, now: number): Status {
  if (score.status !== 'pre') return score.status;
  return now >= kickoff ? 'live' : 'pre';
}

interface Ctx {
  data: PublicState;
  me: MeState;
  patchMe: (p: Partial<MeState>) => void;
  online: boolean;
  connecting: boolean;
  side: Side | null;
  chooseSide: (s: Side) => void;
  phase: Status;
  kickoff: number;
  refresh: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<PublicState | null>(null);
  const [me, setMe] = useState<MeState>(EMPTY_ME);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [side, setSide] = useState<Side | null>(savedSide);
  const [tick, setTick] = useState(0);
  const sideRef = useRef(side);
  sideRef.current = side;

  const refresh = useCallback(() => {
    fetchState()
      .then((s) => {
        clockOffset = s.serverTime - Date.now();
        const { me: m, ...pub } = s;
        setLive(pub);
        setMe(m);
        // a fresh server DB won't know our side yet
        if (sideRef.current && m.side !== sideRef.current) void post('/side', { side: sideRef.current }).catch(() => {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const socket: Socket = io(API_URL, { transports: ['websocket', 'polling'], reconnectionDelayMax: 8000 });
    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      refresh();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnecting(false));
    socket.on('state:update', (s: PublicState) => {
      clockOffset = s.serverTime - Date.now();
      setLive(s);
    });
    socket.on('score:update', (score: ScoreState) => setLive((s) => (s ? { ...s, score } : s)));
    socket.on('reactions:update', (reactions: Record<ReactionType, number>) => setLive((s) => (s ? { ...s, reactions } : s)));
    socket.on('ratings:update', (r: { ratings: Record<string, RatingAgg>; ratingsOpen: boolean }) =>
      setLive((s) => (s ? { ...s, ...r } : s)),
    );
    socket.on('goal', (g: GoalEvent) => {
      if (g.team === 'home') celebrateGoal();
      else if (sideRef.current === 'madrid') celebrateAwayGoal();
    });
    const giveUp = setTimeout(() => setConnecting(false), 5000);
    return () => {
      clearTimeout(giveUp);
      socket.close();
    };
  }, [refresh]);

  // Re-evaluate time-based phase (countdown → live) every few seconds.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const chooseSide = useCallback((s: Side) => {
    setSide(s);
    saveSide(s);
    setMe((m) => ({ ...m, side: s }));
    void post('/side', { side: s }).catch(() => {});
  }, []);

  const patchMe = useCallback((p: Partial<MeState>) => setMe((m) => ({ ...m, ...p })), []);

  const data = live ?? FALLBACK;
  const kickoff = Date.parse(data.match.kickoff);
  const online = connected && live !== null;

  const value = useMemo<Ctx>(
    () => ({
      data,
      me,
      patchMe,
      online,
      connecting,
      side,
      chooseSide,
      phase: phaseOf(data.score, kickoff, serverNow()),
      kickoff,
      refresh,
    }),
    [data, me, online, connecting, side, kickoff, tick],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('useStore outside provider');
  return c;
}
