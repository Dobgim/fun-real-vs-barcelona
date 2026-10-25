// Visual effects: a canvas confetti engine plus a tiny event bus for the SVG rain / float layer.

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const BARCA_COLORS = ['#004D98', '#A50044', '#EDBB00', '#ffffff'];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
}

let canvas: HTMLCanvasElement | null = null;
let pieces: Piece[] = [];
let raf = 0;

function ensureCanvas() {
  if (canvas) return canvas;
  canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '90' });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  return canvas;
}

function frame() {
  const c = ensureCanvas();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (c.width !== W * dpr || c.height !== H * dpr) {
    c.width = W * dpr;
    c.height = H * dpr;
  }
  const g = c.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  pieces = pieces.filter((p) => p.y < H + 40);
  for (const p of pieces) {
    p.vy += 0.16;
    p.vx *= 0.992;
    p.vy *= 0.992;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.r);
    g.scale(1, Math.cos(p.r * 1.7));
    g.fillStyle = p.color;
    if (p.round) {
      g.beginPath();
      g.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      g.fill();
    } else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    g.restore();
  }
  if (pieces.length) raf = requestAnimationFrame(frame);
  else {
    raf = 0;
    g.clearRect(0, 0, W, H);
  }
}

export function confetti(opts: { count?: number; colors?: string[]; origin?: { x: number; y: number }; spread?: number } = {}) {
  if (reducedMotion()) return;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const count = Math.min(opts.count ?? 160, W < 500 ? 160 : 280);
  const colors = opts.colors ?? BARCA_COLORS;
  const ox = (opts.origin?.x ?? 0.5) * W;
  const oy = (opts.origin?.y ?? 0.6) * H;
  const spread = opts.spread ?? 1;
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9 * spread;
    const speed = 7 + Math.random() * 10;
    pieces.push({
      x: ox + (Math.random() - 0.5) * 40,
      y: oy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 3,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 7,
      h: 9 + Math.random() * 8,
      color: colors[i % colors.length],
      round: Math.random() < 0.18,
    });
  }
  if (!raf) raf = requestAnimationFrame(frame);
}

/** Two cannons from the bottom corners plus a centre burst. */
export function bigConfetti(colors = BARCA_COLORS) {
  confetti({ colors, origin: { x: 0.1, y: 1 }, count: 110, spread: 0.6 });
  confetti({ colors, origin: { x: 0.9, y: 1 }, count: 110, spread: 0.6 });
  setTimeout(() => confetti({ colors, origin: { x: 0.5, y: 0.45 }, count: 140, spread: 1.6 }), 250);
}

// ---------- event bus for the React FX layer ----------

export type RainKind = 'laugh' | 'tissue' | 'sad' | 'ball';
export type FloatKind = 'hype' | 'close' | 'card' | 'ref' | 'ball';

export type FxEvent =
  | { type: 'rain'; kinds: RainKind[]; count: number }
  | { type: 'float'; kind: FloatKind; x: number; y: number; count: number }
  | { type: 'goal'; text: string }
  | { type: 'clear' };

const subs = new Set<(e: FxEvent) => void>();
export function onFx(fn: (e: FxEvent) => void) {
  subs.add(fn);
  return () => void subs.delete(fn);
}
const emit = (e: FxEvent) => subs.forEach((s) => s(e));

export const fx = {
  rain: (kinds: RainKind[], count = 36) => emit({ type: 'rain', kinds, count }),
  float: (kind: FloatKind, x: number, y: number, count = 5) => emit({ type: 'float', kind, x, y, count }),
  goal: (text = 'GOOOL!') => emit({ type: 'goal', text }),
  clear: () => emit({ type: 'clear' }),
};
