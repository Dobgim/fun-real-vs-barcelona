import { useMemo, useState } from 'react';
import { ArrowDownUp, Award, ChevronDown, Lock } from 'lucide-react';
import type { Player } from '@shared/types';
import { useStore } from '../lib/store';
import { post } from '../lib/api';
import { playClick } from '../lib/audio';
import { OfflineNote, Section } from './ui';
import { ClubBadge } from './art/Players';
import { initials } from './Lineups';

type Row = Player & { team: 'home' | 'away'; avg: number | null; count: number };
type SortKey = 'name' | 'team' | 'avg' | 'count';

export function Ratings() {
  const { data, me, patchMe, online, phase } = useStore();
  const { lineups, ratings, ratingsOpen } = data;
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'avg', dir: -1 });

  const rows: Row[] = useMemo(
    () =>
      (['home', 'away'] as const).flatMap((team) =>
        [...lineups[team].players, ...lineups[team].subs].map((p) => ({
          ...p,
          team,
          avg: ratings[p.id]?.avg ?? null,
          count: ratings[p.id]?.count ?? 0,
        })),
      ),
    [lineups, ratings],
  );

  const rate = async (id: string, value: number) => {
    setError('');
    const prev = me.ratings[id];
    patchMe({ ratings: { ...me.ratings, [id]: value } });
    playClick();
    try {
      await post('/ratings', { playerId: id, value });
    } catch (e) {
      patchMe({ ratings: { ...me.ratings, [id]: prev } });
      setError((e as Error).message);
    }
  };

  const ft = phase === 'ft';
  const motm = (team: 'home' | 'away') =>
    rows.filter((r) => r.team === team && r.count >= 5 && r.avg !== null).sort((a, b) => b.avg! - a.avg! || b.count - a.count)[0];

  const sorted = [...rows].sort((a, b) => {
    const k = sort.key;
    const av = k === 'avg' ? (a.avg ?? -1) : k === 'count' ? a.count : k === 'team' ? a.team : a.name;
    const bv = k === 'avg' ? (b.avg ?? -1) : k === 'count' ? b.count : k === 'team' ? b.team : b.name;
    return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
  });
  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === 'name' || key === 'team' ? 1 : -1 }));

  const status = ratingsOpen
    ? 'Rate 1–10. Change your mind any time until 2 hours after full time.'
    : phase === 'pre'
      ? 'Fan ratings open at kick-off.'
      : 'Fan ratings are closed.';

  return (
    <Section id="ratings" eyebrow="Fan ratings, live" title="Rate the players" aside={!online ? <OfflineNote /> : undefined}>
      <p className="mb-4 flex items-center gap-2 text-sm text-muted">
        {!ratingsOpen && <Lock size={14} aria-hidden />} {status}
      </p>

      {ft && online && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {(['home', 'away'] as const).map((t) => {
            const m = motm(t);
            return (
              <div key={t} className="panel flex items-center gap-4 p-4">
                <ClubBadge team={t} size={44} />
                <div className="min-w-0">
                  <p className="label flex items-center gap-1.5 text-xs text-gold">
                    <Award size={14} aria-hidden /> Fans' Man of the Match
                  </p>
                  <p className="truncate font-display text-2xl font-extrabold uppercase">{m ? m.name : 'Not enough votes'}</p>
                  {m && (
                    <p className="text-sm text-muted">
                      {m.avg?.toFixed(1)} avg · {m.count} votes
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {online && ratingsOpen && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(['home', 'away'] as const).map((team) => (
            <div key={team} className="panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <ClubBadge team={team} size={26} />
                <p className="font-display text-xl font-extrabold uppercase">{team === 'home' ? 'Barça' : 'Madrid'}</p>
              </div>
              <ul className="divide-y divide-line/60">
                {rows
                  .filter((r) => r.team === team)
                  .map((r) => {
                    const mine = me.ratings[r.id];
                    const expanded = open === r.id;
                    return (
                      <li key={r.id}>
                        <button
                          onClick={() => setOpen(expanded ? null : r.id)}
                          aria-expanded={expanded}
                          className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-white/[.03]"
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-black ${
                              team === 'home' ? 'bg-[linear-gradient(90deg,#004D98_50%,#A50044_50%)]' : 'bg-white text-[#0F1A4A]'
                            }`}
                          >
                            {initials(r.name)}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                          <span className="text-right">
                            <span className="block font-display text-xl font-black leading-none tabular">{r.avg?.toFixed(1) ?? '–'}</span>
                            <span className="label text-[0.65rem] text-muted">{r.count} votes</span>
                          </span>
                          <span className={`label grid h-9 w-9 place-items-center rounded-lg text-sm ${mine ? 'bg-gold text-night' : 'border border-line text-muted'}`}>
                            {mine ?? '?'}
                          </span>
                          <ChevronDown size={16} className={`shrink-0 text-muted transition ${expanded ? 'rotate-180' : ''}`} aria-hidden />
                        </button>
                        {expanded && (
                          <div className="grid grid-cols-5 gap-1.5 px-4 pb-4 sm:grid-cols-10" role="group" aria-label={`Rate ${r.name}`}>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                              <button
                                key={v}
                                onClick={() => rate(r.id, v)}
                                aria-pressed={mine === v}
                                className={`h-11 rounded-lg font-display text-lg font-black transition active:scale-95 ${
                                  mine === v ? 'bg-gold text-night' : 'bg-night ring-1 ring-line hover:ring-gold'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-[#ff7a92]">{error}</p>}

      {online && ft && (
        <div className="panel mt-4 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                {(
                  [
                    ['name', 'Player'],
                    ['team', 'Team'],
                    ['avg', 'Avg'],
                    ['count', 'Votes'],
                  ] as const
                ).map(([k, label]) => (
                  <th key={k} className="p-0" aria-sort={sort.key === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                    <button onClick={() => sortBy(k)} className="label flex min-h-11 w-full items-center gap-1 px-3 text-xs text-muted hover:text-white">
                      {label} <ArrowDownUp size={12} aria-hidden className={sort.key === k ? 'text-gold' : ''} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-b border-line/50 last:border-0">
                  <td className="px-3 py-2.5 font-medium">{r.name}</td>
                  <td className="px-3 py-2.5">
                    <ClubBadge team={r.team} size={20} />
                  </td>
                  <td className="px-3 py-2.5 font-display text-lg font-black tabular">{r.avg?.toFixed(1) ?? '–'}</td>
                  <td className="px-3 py-2.5 tabular text-muted">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
