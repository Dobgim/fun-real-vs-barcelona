import { useStore } from '../lib/store';
import { formatDate } from '../lib/time';
import { Section, SplitBar } from './ui';
import { ClubBadge } from './art/Players';

export function HeadToHead() {
  const { match } = useStore().data;
  const r = match.record;
  const p = match.winProbability;

  return (
    <Section id="record" eyebrow="All-time official record" title="106 each. Tonight decides it.">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="panel relative overflow-hidden p-5 sm:p-7 lg:col-span-3">
          <ClubBadge team="home" size={220} className="pointer-events-none absolute -left-10 -top-6 opacity-[0.07]" />
          <ClubBadge team="away" size={220} className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.07]" />
          <div className="relative grid grid-cols-3 items-end text-center">
            <Stat value={r.homeWins} label="Barça wins" className="text-[#7fb2ff]" />
            <Stat value={r.draws} label="Draws" className="text-muted" />
            <Stat value={r.awayWins} label="Madrid wins" className="text-white" />
          </div>
          <div className="relative mt-5">
            <SplitBar parts={[r.homeWins, r.draws, r.awayWins]} height="h-5" />
          </div>
          <p className="relative mt-5 font-display text-2xl font-extrabold uppercase text-gold sm:text-3xl">Whoever wins tonight leads the rivalry.</p>
          <p className="relative mt-2 text-xs leading-relaxed text-muted">
            {r.played} matches. {r.note}
          </p>
        </div>

        <div className="panel p-5 sm:p-7 lg:col-span-2">
          <p className="label text-xs text-muted">Pre-match win probability</p>
          <div className="mt-4">
            <SplitBar parts={[p.home, p.draw, p.away]} labels={[`Barça ${p.home}%`, `Draw ${p.draw}%`, `Madrid ${p.away}%`]} height="h-5" />
          </div>
          <p className="label mt-7 text-xs text-muted">Last 7 Clásicos · Barça's view · newest first</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {match.lastSeven.map((res, i) => (
              <span
                key={i}
                className={`label grid h-11 w-11 place-items-center rounded-xl text-lg ${
                  res === 'W' ? 'bg-[linear-gradient(135deg,#004D98,#A50044)]' : res === 'D' ? 'bg-[#5B648F]' : 'bg-white text-night'
                }`}
                aria-label={res === 'W' ? 'Win' : res === 'D' ? 'Draw' : 'Loss'}
              >
                {res}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {match.results.map((g) => {
          const barcaHome = g.homeCode === 'BAR';
          const bar = barcaHome ? g.homeGoals : g.awayGoals;
          const rma = barcaHome ? g.awayGoals : g.homeGoals;
          const res = bar > rma ? 'W' : bar === rma ? 'D' : 'L';
          return (
            <li key={g.date} className="panel flex items-center gap-3 px-4 py-3">
              <span className={`h-9 w-1.5 shrink-0 rounded-full ${res === 'W' ? 'bg-grana' : res === 'L' ? 'bg-white' : 'bg-[#5B648F]'}`} />
              <div className="min-w-0 flex-1">
                <p className="label truncate text-xs text-muted">
                  {formatDate(g.date, { day: 'numeric', month: 'short', year: 'numeric' })} · {g.competition}
                </p>
                <p className="font-display text-xl font-extrabold tabular">
                  {g.homeCode} {g.homeGoals}–{g.awayGoals} {g.awayCode}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Stat({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div>
      <p className={`font-display text-[clamp(3rem,13vw,5.5rem)] font-black leading-none tabular ${className}`}>{value}</p>
      <p className="label mt-1 text-[0.7rem] text-muted sm:text-xs">{label}</p>
    </div>
  );
}
