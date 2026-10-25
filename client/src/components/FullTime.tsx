import { useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import { playCheer, playRoar } from '../lib/audio';
import { bigConfetti, fx } from '../lib/fx';
import { ClubBadge } from './art/Players';
import { Handshake, SadFace } from './art/Icons';

export function FullTimeBanner() {
  const { data, phase } = useStore();
  const { home, away } = data.score;
  const r = data.match.record;
  const result = home > away ? 'win' : home === away ? 'draw' : 'loss';
  const celebrated = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== 'ft') return;
    const key = `${home}-${away}`;
    if (celebrated.current === key) return;
    celebrated.current = key;
    if (result === 'win') {
      bigConfetti();
      setTimeout(bigConfetti, 900);
      playRoar();
    } else if (result === 'loss') fx.rain(['sad'], 34);
    else playCheer();
  }, [phase, home, away, result]);

  if (phase !== 'ft') return null;

  const content = {
    win: {
      icon: <ClubBadge team="home" size={72} />,
      title: 'Visca el Barça!',
      sub: `${r.homeWins + 1}–${r.awayWins}, the rivalry is ours`,
      cls: 'bg-[linear-gradient(120deg,#004D98,#A50044)]',
    },
    draw: {
      icon: <Handshake size={72} />,
      title: 'Honours even',
      sub: `Still ${r.homeWins} each`,
      cls: 'bg-panel-2',
    },
    loss: {
      icon: <SadFace size={72} />,
      title: "We don't talk about tonight",
      sub: 'The excuse generator is now unlocked for Barça fans too.',
      cls: 'bg-[linear-gradient(120deg,#1a2050,#2a3470)]',
    },
  }[result];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
      <div className={`flex flex-col items-center gap-4 rounded-3xl border border-white/15 p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,.45)] motion-safe:animate-pop sm:flex-row sm:p-8 sm:text-left ${content.cls}`} role="status">
        <div className="shrink-0">{content.icon}</div>
        <div className="min-w-0">
          <p className="label text-xs text-gold">
            Full time · Barça {home}–{away} Madrid
          </p>
          <p className="font-display text-[clamp(2.2rem,8vw,4rem)] font-black uppercase leading-none">{content.title}</p>
          <p className="mt-2 text-lg text-white/90">{content.sub}</p>
          {result === 'loss' && (
            <a href="#excuses" className="label mt-3 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm text-night">
              Open the excuse generator
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
