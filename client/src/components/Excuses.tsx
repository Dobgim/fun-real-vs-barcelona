import { useRef, useState } from 'react';
import { Quote, RefreshCw } from 'lucide-react';
import { useStore } from '../lib/store';
import { playClick, playLaugh } from '../lib/audio';
import { fx } from '../lib/fx';
import { Button, Section } from './ui';
import { ClubBadge } from './art/Players';
import { LaughFace } from './art/Icons';

const MADRID_EXCUSES = [
  'The grass was too long.',
  'The ball was too round.',
  'The sun was in our eyes. At night.',
  "The goalposts moved. We're sure of it.",
  'Our lucky socks were in the wash.',
  'The team bus took the scenic route.',
  'Someone set the stadium clock to Barcelona time.',
  'The pitch was tilted towards our goal.',
  'We were saving our goals for the Champions League.',
  'The wind changed direction every time we shot.',
  "Our shirts were too white. The ball couldn't see us.",
  'We let them win so the rivalry stays interesting.',
  'The crowd was too loud. And also too quiet.',
  'The half-time oranges were lemons.',
  'Our goalkeeper was looking at a very interesting cloud.',
  'We forgot which end we were attacking. Twice.',
  'The referee had a Barça keyring. Probably.',
  'It was a friendly. Nobody told us it counted.',
];

const BARCA_EXCUSES = [
  "We were being polite. They're guests.",
  'The ball had a Madrid accent.',
  'Our boots were still celebrating last season.',
  'Our wingers were too fast for the ball.',
  'We left our 0–4 energy in the dressing room.',
  'Six out of seven is still a lot.',
  'Football is a game of two halves. We only played one.',
  'The pitch was freshly painted and we were told not to touch it.',
];

function pick(list: string[], last: string | null) {
  let e = last;
  while (e === last) e = list[Math.floor(Math.random() * list.length)];
  return e!;
}

export function Excuses() {
  const { side, data, phase } = useStore();
  const madridWon = phase === 'ft' && data.score.away > data.score.home;
  const [mode, setMode] = useState<'madrid' | 'barca'>('madrid');
  const list = mode === 'barca' && madridWon ? BARCA_EXCUSES : MADRID_EXCUSES;
  const [excuse, setExcuse] = useState(() => pick(MADRID_EXCUSES, null));
  const [n, setN] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);

  const next = () => {
    setExcuse((e) => pick(list, e));
    setN((x) => x + 1);
    if (side === 'madrid' && mode === 'madrid') {
      playLaugh();
      const r = btn.current?.getBoundingClientRect();
      if (r) fx.float('ball', r.left + r.width / 2, r.top, 3);
    } else playClick();
  };

  return (
    <Section id="excuses" eyebrow="Generator" title={mode === 'barca' ? 'Barça excuse generator' : 'Madrid excuse generator'}>
      {madridWon && (
        <div className="mb-4 grid max-w-md grid-cols-2 gap-2 rounded-2xl border border-line bg-panel p-1">
          {(['madrid', 'barca'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setExcuse(pick(m === 'barca' ? BARCA_EXCUSES : MADRID_EXCUSES, null));
              }}
              className={`label min-h-11 rounded-xl text-sm ${mode === m ? 'bg-blau' : 'text-muted'}`}
            >
              {m === 'madrid' ? 'Madrid excuses' : 'Barça excuses (unlocked)'}
            </button>
          ))}
        </div>
      )}
      <div className="panel relative overflow-hidden p-6 sm:p-10">
        <ClubBadge team={mode === 'barca' ? 'home' : 'away'} size={260} className="pointer-events-none absolute -right-14 -top-10 opacity-[0.06]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <LaughFace size={84} className={`shrink-0 ${side === 'madrid' ? 'motion-safe:animate-shake' : ''}`} />
          <div className="min-w-0 flex-1">
            <Quote size={28} className="text-gold" aria-hidden />
            <p key={n} className="mt-2 font-display text-[clamp(1.9rem,7vw,3.4rem)] font-extrabold leading-[1.02] motion-safe:animate-rise" aria-live="polite">
              {excuse}
            </p>
            <p className="label mt-3 text-xs text-muted">— {mode === 'barca' ? 'A Culer, after a bad night' : 'An anonymous Madridista, tonight'}</p>
          </div>
        </div>
        <Button ref={btn} variant={mode === 'barca' ? 'primary' : 'white'} onClick={next} className="relative mt-7 w-full sm:w-auto">
          <RefreshCw size={16} aria-hidden /> Another excuse
        </Button>
      </div>
    </Section>
  );
}
