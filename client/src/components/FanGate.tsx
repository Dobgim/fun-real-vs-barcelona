import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Scale } from 'lucide-react';
import type { Side } from '@shared/types';
import { useStore } from '../lib/store';
import { unlockAudio } from '../lib/audio';
import { barcaWelcome, madridWelcome } from '../lib/celebrate';
import { fx } from '../lib/fx';
import { formatDate } from '../lib/time';
import { Button } from './ui';
import { ClubBadge, TeamArt } from './art/Players';
import { LaughFace, TissueRoll } from './art/Icons';

type Screen = 'choose' | 'madrid' | 'barca';

export function FanGate({ onClose }: { onClose: () => void }) {
  const { chooseSide, data } = useStore();
  const [screen, setScreen] = useState<Screen>('choose');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const pick = (side: Side) => {
    unlockAudio();
    chooseSide(side);
    if (side === 'neutral') return onClose();
    if (side === 'madrid') madridWelcome();
    else barcaWelcome();
    setScreen(side === 'madrid' ? 'madrid' : 'barca');
  };

  const enterTo = (hash: string) => {
    onClose();
    requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }));
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-night" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="stripes h-1.5 w-full" />
      {/* background art: three stars per side, faded */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex h-[55vh] justify-between opacity-25 [mask-image:linear-gradient(to_top,black_30%,transparent)] sm:opacity-35">
        <TeamArt kit="home" className="h-full w-1/2 max-w-[520px]" />
        <TeamArt kit="away" className="h-full w-1/2 max-w-[520px]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100%-6px)] w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        {screen === 'choose' && (
          <div className="w-full motion-safe:animate-rise">
            <p className="label text-sm text-gold">El Clásico · {formatDate(data.match.kickoff, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 id="gate-title" className="fluid-hero mt-3 font-display font-black uppercase">
              Which side
              <br />
              are you on?
            </h1>
            <div className="mx-auto mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-3">
              <GateChoice onClick={() => pick('barca')} tone="barca" label="FC Barcelona" icon={<ClubBadge team="home" size={56} />} />
              <GateChoice onClick={() => pick('madrid')} tone="madrid" label="Real Madrid" icon={<ClubBadge team="away" size={56} />} />
              <GateChoice
                onClick={() => pick('neutral')}
                tone="neutral"
                label="Neutral"
                icon={
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10">
                    <Scale size={28} aria-hidden />
                  </span>
                }
              />
            </div>
            <p className="mt-6 text-sm text-muted">Playful banter only. Be kind to each other.</p>
          </div>
        )}

        {screen === 'madrid' && (
          <div className="w-full motion-safe:animate-pop">
            <LaughFace size={150} className="mx-auto motion-safe:animate-shake" title="Laughing face" />
            <h1 id="gate-title" className="fluid-hero mt-4 font-display font-black uppercase">
              A Madridista?!
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-white/90 sm:text-xl">
              Ha ha ha… sorry. Welcome, brave one. Barça have won <strong className="text-gold">6 of the last 7</strong> Clásicos, including{' '}
              <strong className="whitespace-nowrap">0–4</strong> and <strong className="whitespace-nowrap">2–5</strong>. We saved you a tissue.
            </p>
            <TissueRoll size={64} className="mx-auto mt-3" title="Tissue roll" />
            <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
              <Button variant="white" className="flex-1" onClick={() => enterTo('excuses')}>
                I can take it
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  chooseSide('barca');
                  fx.clear();
                  barcaWelcome();
                  setScreen('barca');
                }}
              >
                Actually, I'm Barça
              </Button>
            </div>
          </div>
        )}

        {screen === 'barca' && (
          <div className="w-full motion-safe:animate-pop">
            <ClubBadge team="home" size={84} className="mx-auto" />
            <p className="label mt-4 text-sm text-gold">All-time head to head</p>
            <h1 id="gate-title" className="mt-1 font-display text-[clamp(4rem,20vw,8rem)] font-black leading-none tabular">
              {data.match.record.homeWins} – {data.match.record.awayWins}
            </h1>
            <p className="font-display text-2xl font-extrabold uppercase sm:text-3xl">Tonight we take the lead.</p>
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {data.match.famousWins.map((w) => (
                <div key={w.date} className="panel px-3 py-3 text-left">
                  <p className="font-display text-3xl font-black text-gold tabular">{w.score}</p>
                  <p className="label mt-0.5 text-xs text-white">{w.label}</p>
                  <p className="text-xs text-muted">{formatDate(w.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
            <Button variant="garnet" className="mt-7 w-full max-w-sm text-lg" onClick={onClose}>
              Força Barça! Let me in <ArrowRight size={18} aria-hidden />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function GateChoice({ onClick, label, icon, tone }: { onClick: () => void; label: string; icon: ReactNode; tone: 'barca' | 'madrid' | 'neutral' }) {
  const toneCls = {
    barca: 'border-blau bg-[linear-gradient(135deg,#004D98_0%,#A50044_100%)] hover:brightness-110',
    madrid: 'border-white/70 bg-white text-night hover:bg-[#e9ecf8]',
    neutral: 'border-line bg-panel hover:bg-panel-2',
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`flex min-h-20 items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition active:scale-[0.97] sm:flex-col sm:justify-center sm:text-center ${toneCls}`}
    >
      {icon}
      <span className="font-display text-2xl font-extrabold uppercase leading-none">{label}</span>
    </button>
  );
}
