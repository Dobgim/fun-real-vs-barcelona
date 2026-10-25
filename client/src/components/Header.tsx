import { useEffect, useState } from 'react';
import { Repeat2, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../lib/store';
import { isMuted, onMutedChange, setMuted, unlockAudio } from '../lib/audio';
import { Ball, LiveDot } from './art/Icons';
import { ClubBadge } from './art/Players';

const NAV = [
  ['record', 'Record'],
  ['players', 'Players'],
  ['lineups', 'Lineups'],
  ['predict', 'Predict'],
  ['live', 'Match zone'],
  ['bingo', 'Bingo'],
  ['ratings', 'Ratings'],
  ['excuses', 'Excuses'],
] as const;

export function Header({ onSwitchSide }: { onSwitchSide: () => void }) {
  const { side, phase, data } = useStore();
  const [muted, setM] = useState(isMuted);
  useEffect(() => onMutedChange(setM), []);

  const sideChip = {
    barca: { label: 'Culer', badge: <ClubBadge team="home" size={22} /> },
    madrid: { label: 'Madridista', badge: <ClubBadge team="away" size={22} /> },
    neutral: { label: 'Neutral', badge: null },
  }[side ?? 'neutral'];

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-night/85 backdrop-blur-md">
      <div className="stripes h-1 w-full" />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-2">
          <Ball size={26} />
          <span className="truncate font-display text-xl font-black uppercase tracking-wide sm:text-2xl">Clásico Night</span>
        </a>
        {phase === 'live' || phase === 'ht' ? (
          <span className="label ml-1 hidden items-center gap-1.5 rounded-full bg-[#ff2d55]/15 px-2.5 py-1 text-xs text-[#ff6b86] min-[420px]:inline-flex">
            <LiveDot className="h-2 w-2" /> {phase === 'ht' ? 'HT' : 'Live'} {data.score.home}–{data.score.away}
          </span>
        ) : null}
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="label rounded-lg px-2.5 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5 lg:ml-2">
          <button
            onClick={onSwitchSide}
            className="label inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-panel px-3 text-xs transition hover:border-gold sm:text-sm"
            aria-label={`You are ${sideChip.label}. Switch side`}
          >
            {sideChip.badge}
            <span className="hidden min-[380px]:inline">{sideChip.label}</span>
            <Repeat2 size={15} aria-hidden className="text-muted" />
          </button>
          <button
            onClick={() => {
              unlockAudio();
              setMuted(!muted);
            }}
            className="grid h-11 w-11 place-items-center rounded-full border border-line bg-panel transition hover:border-gold"
            aria-label={muted ? 'Turn sound on' : 'Mute sounds'}
            aria-pressed={muted}
          >
            {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
          </button>
        </div>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden" aria-label="Sections">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="label shrink-0 rounded-full border border-line/80 px-3 py-1.5 text-xs text-muted active:bg-white/10">
            {label}
          </a>
        ))}
      </nav>
    </header>
  );
}
