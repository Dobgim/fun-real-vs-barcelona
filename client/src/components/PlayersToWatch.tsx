import type { PlayerToWatch } from '@shared/types';
import { useStore } from '../lib/store';
import { Section } from './ui';
import { ClubBadge } from './art/Players';

export function PlayersToWatch() {
  const { match } = useStore().data;

  return (
    <Section id="players" eyebrow="Three each" title="Players to watch">
      <div className="space-y-6">
        {(['home', 'away'] as const).map((team) => (
          <div key={team}>
            <p className="label mb-3 flex items-center gap-2 text-sm">
              <ClubBadge team={team} size={26} /> {team === 'home' ? match.home.name : match.away.name}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {match.playersToWatch
                .filter((p) => p.team === team)
                .map((p) => (
                  <Card key={p.name} player={p} rating={match.gameRatings[p.name]} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Card({ player, rating }: { player: PlayerToWatch; rating?: number }) {
  const home = player.team === 'home';
  return (
    <article className="panel group flex overflow-hidden sm:flex-col">
      <div className="relative w-32 shrink-0 overflow-hidden min-[420px]:w-40 sm:aspect-[4/5] sm:w-full">
        <img
          src={player.photo}
          alt={player.name}
          loading="lazy"
          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
        />
        <div className={`absolute inset-x-0 bottom-0 h-1.5 ${home ? 'stripes' : 'bg-[linear-gradient(90deg,#fff,#C9A227)]'}`} />
        {rating !== undefined && (
          <span className="absolute left-2 top-2 rounded-lg bg-gold px-2 py-0.5 font-display text-lg font-black leading-tight text-night shadow" title="EA Sports FC 27 overall">
            {rating}
          </span>
        )}
        <ClubBadge team={player.team} size={34} className="absolute right-2 top-2" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="label text-xs text-gold">{player.position}</p>
        <h3 className="font-display text-2xl font-black uppercase leading-none sm:text-3xl">{player.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/85">{player.note}</p>
        <a
          href={player.credit.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-auto pt-3 text-[0.68rem] text-muted underline-offset-2 hover:underline"
        >
          Photo: {player.credit.author}, {player.credit.license}
        </a>
      </div>
    </article>
  );
}
