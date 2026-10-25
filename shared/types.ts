// Types shared by the client and the server. Keep this file type-only.

export type Side = 'barca' | 'madrid' | 'neutral';
export type Team = 'home' | 'away'; // home = Barça, away = Madrid
export type Status = 'pre' | 'live' | 'ht' | 'ft';
export type PollChoice = 'barca' | 'draw' | 'madrid';
export type ReactionType = 'hype' | 'close' | 'card' | 'ref';

export interface Player {
  id: string; // stable slug, e.g. "home:pedri"
  name: string; // surname or shirt name shown under the circle
  doubt?: string; // shown as a "doubt" badge with this note
}

export interface Lineup {
  coach: string;
  formation: string;
  // Order: GK, RB, RCB, LCB, LB, DM (right), DM (left), RW, AM, LW, ST
  players: Player[];
  subs: Player[]; // players who came on (ratable), editable from /admin
  out: string[];
  notes: string[];
}

export interface Lineups {
  home: Lineup;
  away: Lineup;
  confirmed: boolean;
}

export interface ResultRow {
  date: string; // ISO date
  competition: string;
  homeCode: string;
  homeGoals: number;
  awayGoals: number;
  awayCode: string;
}

export interface FamousWin {
  score: string;
  label: string;
  date: string;
}

export interface PlayerToWatch {
  team: 'home' | 'away';
  name: string; // must match the name used in lineups / gameRatings
  position: string;
  photo: string; // path under client/public
  note: string;
  credit: { author: string; license: string; url: string };
}

export interface MatchData {
  title: string;
  competition: string;
  kickoff: string; // ISO UTC
  venue: string;
  home: { name: string; short: string; code: string };
  away: { name: string; short: string; code: string };
  record: {
    played: number;
    homeWins: number;
    draws: number;
    awayWins: number;
    asOf: string;
    note: string;
  };
  lastSeven: ('W' | 'D' | 'L')[]; // Barça's view, newest first
  results: ResultRow[];
  famousWins: FamousWin[];
  winProbability: { home: number; draw: number; away: number };
  gameRatings: Record<string, number>; // EA Sports FC 27 overall, by player name
  lineups: Omit<Lineups, 'confirmed'>;
  playersToWatch: PlayerToWatch[];
  sources: { label: string; url: string }[];
}

export interface ScoreState {
  status: Status;
  home: number;
  away: number;
  minute: string | null;
  ftAt: number | null; // epoch ms when status became full time
  scorers: string[]; // player ids of goalscorers, one entry per goal
  updatedAt: number;
}

export interface PredictionEntry {
  name: string;
  home: number;
  away: number;
  scorer: string | null; // player id, 'none' for "no goalscorer", null if not picked
  points: number | null; // null until full time
}

export interface RatingAgg {
  avg: number;
  count: number;
}

export interface PublicState {
  match: MatchData;
  lineups: Lineups;
  score: ScoreState;
  poll: Record<PollChoice, number>;
  predictions: {
    open: boolean;
    entries: PredictionEntry[];
    counts: { score: string; count: number }[];
    scorerCounts: { scorer: string; count: number }[];
  };
  ratings: Record<string, RatingAgg>;
  ratingsOpen: boolean;
  reactions: Record<ReactionType, number>;
  sides: Record<Side, number>;
  nerves: { avg: number | null; count: number };
  bingoWinners: { name: string; at: number }[];
  serverTime: number;
}

export interface MeState {
  side: Side | null;
  prediction: { name: string; home: number; away: number; scorer: string | null } | null;
  poll: PollChoice | null;
  ratings: Record<string, number>;
  nerves: number | null;
  bingo: boolean;
}

export interface StateResponse extends PublicState {
  me: MeState;
}

export interface GoalEvent {
  team: Team;
  home: number;
  away: number;
  minute: string | null;
}

export const RATINGS_WINDOW_MS = 2 * 60 * 60 * 1000;
