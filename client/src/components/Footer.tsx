import { ExternalLink } from 'lucide-react';
import { useStore } from '../lib/store';
import { Ball } from './art/Icons';

export function Footer() {
  const { match } = useStore().data;
  return (
    <footer className="mt-10 border-t border-line/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Ball size={22} />
          <p className="font-display text-xl font-black uppercase">Clásico Night</p>
        </div>
        <p className="mt-3 max-w-xl text-sm text-white/80">A fan-made page for one night. Not affiliated with either club or La Liga.</p>
        <p className="mt-1 max-w-xl text-xs text-muted">
          Club crests are trademarks of FC Barcelona and Real Madrid CF, shown to identify the teams on a non-commercial fan page. Player photos are
          freely licensed from Wikimedia Commons:{' '}
          {match.playersToWatch.map((p, i) => (
            <span key={p.name}>
              {i > 0 && ' · '}
              <a href={p.credit.url} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-white">
                {p.name}
              </a>{' '}
              ({p.credit.author}, {p.credit.license})
            </span>
          ))}
          . Game ratings are EA Sports FC 27 overalls; fan ratings come from visitors to this page.
        </p>
        <ul className="mt-5 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
          {match.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-1.5 text-[#7fb2ff] underline-offset-4 hover:underline">
                {s.label} <ExternalLink size={13} aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="stripes h-1 w-full" />
    </footer>
  );
}
