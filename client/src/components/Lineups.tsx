import { useState } from 'react';
import { AlertTriangle, BadgeCheck, CircleSlash } from 'lucide-react';
import type { Lineup, Player } from '@shared/types';
import { useStore } from '../lib/store';
import { Section } from './ui';
import { ClubBadge } from './art/Players';

// 4-2-3-1 slots as % of the pitch (attacking upwards). Order matches Lineup.players.
const SLOTS: [number, number][] = [
  [50, 89], // GK
  [86, 70], [62, 73], [38, 73], [14, 70], // RB, RCB, LCB, LB
  [65, 53], [35, 53], // DM right, DM left
  [84, 32], [50, 35], [16, 32], // RW, AM, LW
  [50, 13], // ST
];

export function initials(name: string) {
  const parts = name.replace(/\(.*\)/, '').trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
}

export function Lineups() {
  const { data } = useStore();
  const [tab, setTab] = useState<'home' | 'away'>('home');
  const { lineups, match } = data;

  return (
    <Section
      id="lineups"
      eyebrow={lineups.confirmed ? 'Official team sheets' : 'Predicted lineups, not confirmed'}
      title="The XIs"
      aside={
        <span
          className={`label inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
            lineups.confirmed ? 'bg-[#2bb673]/15 text-[#5fe0a0]' : 'bg-gold/15 text-gold'
          }`}
        >
          {lineups.confirmed ? <BadgeCheck size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}
          {lineups.confirmed ? 'Confirmed XI' : 'Predicted lineup, not confirmed'}
        </span>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-panel p-1 lg:hidden" role="tablist">
        {(['home', 'away'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`label flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm transition ${
              tab === t ? (t === 'home' ? 'bg-blau text-white' : 'bg-white text-night') : 'text-muted'
            }`}
          >
            <ClubBadge team={t} size={22} /> {t === 'home' ? 'Barça' : 'Madrid'}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {(['home', 'away'] as const).map((t) => (
          <div key={t} className={tab === t ? '' : 'hidden lg:block'}>
            <TeamSheet
              team={t}
              lineup={lineups[t]}
              ratings={match.gameRatings}
              photos={Object.fromEntries(match.playersToWatch.map((p) => [p.name, p.photo]))}
              name={t === 'home' ? match.home.name : match.away.name}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Numbers on the circles are EA Sports FC 27 overall ratings (game ratings, not form). Blank where we don't have one.</p>
    </Section>
  );
}

function TeamSheet({
  team,
  lineup,
  ratings,
  photos,
  name,
}: {
  team: 'home' | 'away';
  lineup: Lineup;
  ratings: Record<string, number>;
  photos: Record<string, string>;
  name: string;
}) {
  const doubts = lineup.players.filter((p) => p.doubt);
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <ClubBadge team={team} size={36} />
        <div className="min-w-0">
          <p className="font-display text-xl font-extrabold uppercase leading-none">{name}</p>
          <p className="label text-xs text-muted">
            {lineup.formation} · {lineup.coach}
          </p>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="pitch relative mx-auto aspect-[3/4] w-full max-w-[520px] overflow-hidden rounded-xl ring-1 ring-white/10">
          <PitchLines />
          <ClubBadge team={team} size={160} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" />
          {lineup.players.slice(0, 11).map((p, i) => (
            <PlayerDot key={p.id + i} player={p} team={team} rating={ratings[p.name]} photo={photos[p.name]} pos={SLOTS[i]} />
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-line px-4 py-4 text-sm">
        {doubts.map((p) => (
          <p key={p.id} className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#ff9f43]" aria-hidden />
            <span>
              <strong>{p.name}</strong> <span className="text-muted">— {p.doubt}</span>
            </span>
          </p>
        ))}
        {lineup.notes.map((n) => (
          <p key={n} className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#ff9f43]" aria-hidden />
            <span className="text-muted">{n}</span>
          </p>
        ))}
        {lineup.out.length > 0 && (
          <p className="flex items-start gap-2">
            <CircleSlash size={16} className="mt-0.5 shrink-0 text-[#ff5c7a]" aria-hidden />
            <span>
              <span className="label text-xs text-muted">Out: </span>
              {lineup.out.join(', ')}
            </span>
          </p>
        )}
        {lineup.subs.length > 0 && (
          <p className="text-muted">
            <span className="label text-xs">Subs used: </span>
            {lineup.subs.map((s) => s.name).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerDot({ player, team, rating, photo, pos }: { player: Player; team: 'home' | 'away'; rating?: number; photo?: string; pos: [number, number] }) {
  return (
    <div className="absolute flex w-[22%] -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}>
      <div className="relative">
        <div
          className={`grid h-11 w-11 place-items-center overflow-hidden rounded-full font-display text-lg font-black shadow-[0_4px_12px_rgba(0,0,0,.4)] ring-2 sm:h-14 sm:w-14 sm:text-xl ${
            team === 'home' ? 'bg-[linear-gradient(90deg,#004D98_50%,#A50044_50%)] text-white ring-gold' : 'bg-white text-[#0F1A4A] ring-[#C9A227]'
          }`}
        >
          {photo ? <img src={photo} alt="" className="h-full w-full rounded-full object-cover object-top" /> : initials(player.name)}
        </div>
        {rating !== undefined && (
          <span className="absolute -right-2.5 -top-2 rounded-md bg-gold px-1 font-display text-xs font-black leading-5 text-night tabular sm:text-sm" title="EA Sports FC 27 overall">
            {rating}
          </span>
        )}
        {player.doubt && (
          <span className="label absolute -bottom-1.5 -left-3 rounded-md bg-[#ff9f43] px-1 text-[0.6rem] leading-4 text-night" title={player.doubt}>
            Doubt
          </span>
        )}
      </div>
      <p className="mt-1 max-w-full rounded bg-night/60 px-1 text-center text-[0.68rem] font-semibold leading-[1.1] [overflow-wrap:anywhere] sm:text-xs">{player.name}</p>
    </div>
  );
}

function PitchLines() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden>
      <g fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2">
        <rect x="10" y="10" width="280" height="380" />
        <line x1="10" y1="200" x2="290" y2="200" />
        <circle cx="150" cy="200" r="38" />
        <rect x="70" y="10" width="160" height="60" />
        <rect x="112" y="10" width="76" height="22" />
        <rect x="70" y="330" width="160" height="60" />
        <rect x="112" y="368" width="76" height="22" />
        <path d="M120 70a34 34 0 0 0 60 0M120 330a34 34 0 0 1 60 0" />
      </g>
      <circle cx="150" cy="200" r="3" fill="#fff" fillOpacity=".7" />
    </svg>
  );
}
