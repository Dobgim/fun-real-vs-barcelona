import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import { onFx, reducedMotion, type FloatKind, type RainKind } from '../lib/fx';
import { AngryFace, Ball, Flame, LaughFace, SadFace, ShockedFace, TissueRoll, YellowCard } from './art/Icons';

const ART: Record<RainKind | FloatKind, (size: number) => ReactElement> = {
  laugh: (s) => <LaughFace size={s} />,
  tissue: (s) => <TissueRoll size={s} />,
  sad: (s) => <SadFace size={s} />,
  ball: (s) => <Ball size={s} />,
  hype: (s) => <Flame size={s} />,
  close: (s) => <ShockedFace size={s} />,
  card: (s) => <YellowCard size={s} />,
  ref: (s) => <AngryFace size={s} />,
};

interface Particle {
  id: number;
  kind: RainKind | FloatKind;
  style: CSSProperties;
  size: number;
  cls: string;
}

let nextId = 1;

export function FxLayer() {
  const [items, setItems] = useState<Particle[]>([]);
  const [goal, setGoal] = useState<{ id: number; text: string } | null>(null);

  useEffect(
    () =>
      onFx((e) => {
        if (e.type === 'clear') return setItems([]);
        if (e.type === 'goal') {
          const id = nextId++;
          setGoal({ id, text: e.text });
          setTimeout(() => setGoal((g) => (g?.id === id ? null : g)), 2700);
          return;
        }
        if (reducedMotion()) return;
        const fresh: Particle[] = [];
        if (e.type === 'rain') {
          const count = window.innerWidth < 500 ? Math.round(e.count * 0.7) : e.count;
          for (let i = 0; i < count; i++) {
            const dur = 2.4 + Math.random() * 2.2;
            fresh.push({
              id: nextId++,
              kind: e.kinds[i % e.kinds.length],
              size: 28 + Math.random() * 26,
              cls: 'rain-item',
              style: {
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.6}s`,
                ['--dur' as string]: `${dur}s`,
                ['--drift' as string]: `${(Math.random() - 0.5) * 120}px`,
                ['--spin' as string]: `${(Math.random() - 0.5) * 720}deg`,
              },
            });
          }
        } else {
          for (let i = 0; i < e.count; i++) {
            fresh.push({
              id: nextId++,
              kind: e.kind,
              size: 26 + Math.random() * 16,
              cls: 'float-item',
              style: {
                left: e.x - 18 + (Math.random() - 0.5) * 40,
                top: e.y - 18,
                animationDelay: `${i * 0.08}s`,
                ['--dur' as string]: `${1.4 + Math.random() * 0.8}s`,
                ['--drift' as string]: `${(Math.random() - 0.5) * 140}px`,
              },
            });
          }
        }
        setItems((cur) => [...cur.slice(-120), ...fresh]);
        const ids = new Set(fresh.map((f) => f.id));
        setTimeout(() => setItems((cur) => cur.filter((p) => !ids.has(p.id))), 6000);
      }),
    [],
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden>
        {items.map((p) => (
          <div key={p.id} className={p.cls} style={p.style}>
            {ART[p.kind](p.size)}
          </div>
        ))}
      </div>
      {goal && (
        <div className="pointer-events-none fixed inset-0 z-[95] grid place-items-center bg-night/40" role="status" aria-live="assertive">
          <div key={goal.id} className="gol-text text-center">
            <Ball size={88} className="mx-auto mb-2 motion-safe:animate-spin [animation-duration:1.2s]" />
            <p className="font-display text-[clamp(4.5rem,22vw,12rem)] font-black leading-none tracking-tight text-gold [text-shadow:0_6px_0_#A50044,0_12px_30px_rgba(0,0,0,.6)]">
              {goal.text}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
