import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { ReactionType } from '@shared/types';
import { useStore } from '../lib/store';
import { post } from '../lib/api';
import { playReaction } from '../lib/audio';
import { celebrateGoal } from '../lib/celebrate';
import { fx } from '../lib/fx';
import { Button, OfflineNote, Section } from './ui';
import { AngryFace, Ball, CoolFace, DizzyFace, Flame, ShockedFace, YellowCard } from './art/Icons';

const REACTIONS: { type: ReactionType; label: string; icon: (s: number) => ReactElement; ring: string }[] = [
  { type: 'hype', label: 'Hype', icon: (s) => <Flame size={s} />, ring: 'hover:border-[#FF7A1A]' },
  { type: 'close', label: 'So close', icon: (s) => <ShockedFace size={s} />, ring: 'hover:border-[#FFD23F]' },
  { type: 'card', label: 'Card!', icon: (s) => <YellowCard size={s} />, ring: 'hover:border-[#F9C80E]' },
  { type: 'ref', label: 'Ref!', icon: (s) => <AngryFace size={s} />, ring: 'hover:border-[#D7263D]' },
];

export function MatchZone() {
  const { data, online, side, me, patchMe } = useStore();
  const [cooldown, setCooldown] = useState(false);
  const total = Object.values(data.reactions).reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...Object.values(data.reactions));

  const react = (type: ReactionType, el: HTMLElement) => {
    if (cooldown) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1000);
    const r = el.getBoundingClientRect();
    fx.float(type, r.left + r.width / 2, r.top + r.height / 3, 6);
    playReaction(type);
    if (online) void post('/reactions', { type }).catch(() => {});
  };

  // nervousness: debounce writes while the slider moves
  const [nerves, setNerves] = useState(me.nerves ?? 50);
  useEffect(() => {
    if (me.nerves !== null) setNerves(me.nerves);
  }, [me.nerves]);
  const timer = useRef<number>();
  const onNerves = (v: number) => {
    setNerves(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      patchMe({ nerves: v });
      if (online) void post('/nerves', { value: v }).catch(() => {});
    }, 400);
  };

  return (
    <Section id="live" eyebrow="During the match" title="Match zone" aside={!online ? <OfflineNote /> : undefined}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-end justify-between gap-2">
            <h3 className="font-display text-2xl font-extrabold uppercase">React live</h3>
            {online && <p className="label text-xs text-muted">{total.toLocaleString()} reactions</p>}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                onClick={(e) => react(r.type, e.currentTarget)}
                disabled={cooldown}
                className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-line bg-night transition active:scale-95 disabled:opacity-60 ${r.ring}`}
              >
                {r.icon(40)}
                <span className="label text-sm">{r.label}</span>
              </button>
            ))}
          </div>
          {online && (
            <div className="mt-5 space-y-2">
              <p className="label text-xs text-muted">Hype meter</p>
              {REACTIONS.map((r) => (
                <div key={r.type} className="flex items-center gap-3">
                  <span className="shrink-0">{r.icon(22)}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-night ring-1 ring-line">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#004D98,#A50044,#EDBB00)] transition-[width] duration-500" style={{ width: `${(data.reactions[r.type] / max) * 100}%` }} />
                  </div>
                  <span className="label w-12 text-right text-xs tabular">{data.reactions[r.type]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="panel p-5 sm:p-6">
            <h3 className="font-display text-2xl font-extrabold uppercase">Nervousness meter</h3>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="label inline-flex items-center gap-1.5 text-xs text-muted">
                <CoolFace size={28} /> Relaxed
              </span>
              <span className="label inline-flex items-center gap-1.5 text-right text-xs text-muted">
                Hiding behind the sofa <DizzyFace size={28} />
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={nerves}
              onChange={(e) => onNerves(Number(e.target.value))}
              className="nerves mt-1"
              aria-label="How nervous are you?"
            />
            {online && (
              <div className="mt-3">
                <p className="label text-xs text-muted">
                  Average Barça fan · {data.nerves.count} {data.nerves.count === 1 ? 'fan' : 'fans'}
                  {side !== 'barca' && ' (only Barça fans count)'}
                </p>
                <div className="relative mt-2 h-3 rounded-full bg-[linear-gradient(90deg,#2bb673,#EDBB00,#A50044)] opacity-80">
                  {data.nerves.avg !== null && (
                    <span
                      className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-night bg-white transition-[left] duration-700"
                      style={{ left: `${data.nerves.avg}%` }}
                    />
                  )}
                </div>
                <p className="mt-2 font-display text-xl font-extrabold">{nervesLabel(data.nerves.avg)}</p>
              </div>
            )}
          </div>

          <div className="panel flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center sm:p-6">
            <Button variant="gold" onClick={celebrateGoal} className="min-h-20 w-full max-w-sm rounded-2xl text-3xl">
              <Ball size={36} /> <span className="font-display font-black">GOOOL!</span>
            </Button>
            <p className="text-xs text-muted">Press it whenever you like. Your own confetti, your own crowd.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function nervesLabel(avg: number | null) {
  if (avg === null) return 'No readings yet';
  if (avg < 20) return `${avg}/100 · Ice cold`;
  if (avg < 45) return `${avg}/100 · Calm-ish`;
  if (avg < 70) return `${avg}/100 · Biting nails`;
  if (avg < 90) return `${avg}/100 · Can't watch`;
  return `${avg}/100 · Behind the sofa`;
}
