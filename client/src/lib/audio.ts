// Every sound on the site is synthesized with the Web Audio API: no audio files.
import { store } from './visitor';

let ctx: AudioContext | null = null;
let muted = store.get('cn:muted') === '1';
const listeners = new Set<(m: boolean) => void>();

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  store.set('cn:muted', m ? '1' : '0');
  listeners.forEach((l) => l(m));
}
export function onMutedChange(fn: (m: boolean) => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** Call from a user gesture (the fan gate) so later broadcast sounds can play. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* no audio support */
  }
}

// Browsers only allow audio after a user gesture, so the context is created on the first
// tap anywhere (capture phase, before any click handler asks for a sound).
if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown'] as const) window.addEventListener(ev, unlockAudio, { capture: true, passive: true });
}

function ac(): AudioContext | null {
  if (muted || !ctx) return null;
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

let noise: AudioBuffer | null = null;
function noiseSource(c: AudioContext) {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noise;
  s.loop = true;
  return s;
}

function master(c: AudioContext, volume = 0.6) {
  const g = c.createGain();
  g.gain.value = volume;
  const comp = c.createDynamicsCompressor();
  g.connect(comp).connect(c.destination);
  return g;
}

function envelope(g: GainNode, t: number, attack: number, peak: number, hold: number, release: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
}

/** "Ha-ha-ha-ha" from a sawtooth voice through two vowel formants. */
export function playLaugh() {
  const c = ac();
  if (!c) return;
  const out = master(c, 0.55);
  const t0 = c.currentTime + 0.02;
  const syllables = 8;
  for (let i = 0; i < syllables; i++) {
    const t = t0 + i * 0.15 + (i > 3 ? 0.05 : 0);
    const pitch = 360 - i * 16 + Math.random() * 20;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch * 1.12, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.82, t + 0.12);
    const f1 = c.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 820;
    f1.Q.value = 5;
    const f2 = c.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 1250;
    f2.Q.value = 6;
    const g = c.createGain();
    envelope(g, t, 0.012, 0.9, 0.04, 0.08);
    osc.connect(f1).connect(g);
    osc.connect(f2).connect(g);
    // breathy "h" at the start of each syllable
    const n = noiseSource(c);
    const nf = c.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = 1500;
    const ng = c.createGain();
    envelope(ng, t - 0.01, 0.008, 0.25, 0.01, 0.05);
    n.connect(nf).connect(ng).connect(out);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.2);
    n.start(t - 0.01);
    n.stop(t + 0.1);
  }
}

function crowd(c: AudioContext, out: AudioNode, t: number, attack: number, hold: number, release: number, peak: number, centre = 900) {
  const n = noiseSource(c);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = centre;
  bp.Q.value = 0.6;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2600;
  const g = c.createGain();
  envelope(g, t, attack, peak, hold, release);
  n.connect(bp).connect(lp).connect(g).connect(out);
  n.start(t);
  n.stop(t + attack + hold + release + 0.1);
}

function whoo(c: AudioContext, out: AudioNode, t: number) {
  const o = c.createOscillator();
  o.type = 'triangle';
  const base = 380 + Math.random() * 420;
  o.frequency.setValueAtTime(base, t);
  o.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.35);
  o.frequency.exponentialRampToValueAtTime(base * 1.1, t + 0.8);
  const g = c.createGain();
  envelope(g, t, 0.06, 0.05, 0.3, 0.45);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.9);
}

export function playCheer() {
  const c = ac();
  if (!c) return;
  const out = master(c, 0.6);
  const t = c.currentTime + 0.02;
  crowd(c, out, t, 0.35, 0.9, 1.4, 0.7, 1100);
  for (let i = 0; i < 9; i++) whoo(c, out, t + 0.1 + Math.random() * 1.1);
}

/** Stadium roar with an air horn on top: used for goals. */
export function playRoar() {
  const c = ac();
  if (!c) return;
  const out = master(c, 0.75);
  const t = c.currentTime + 0.02;
  crowd(c, out, t, 0.25, 1.8, 1.8, 0.9, 700);
  crowd(c, out, t + 0.1, 0.4, 1.5, 1.6, 0.4, 1800);
  for (let i = 0; i < 14; i++) whoo(c, out, t + 0.15 + Math.random() * 1.6);
  for (const [start, len] of [[0, 0.45], [0.55, 0.45], [1.1, 0.9]] as const) {
    for (const f of [233, 311]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      const g = c.createGain();
      envelope(g, t + start, 0.02, 0.12, len, 0.08);
      o.connect(lp).connect(g).connect(out);
      o.start(t + start);
      o.stop(t + start + len + 0.15);
    }
  }
}

export function playReaction(type: 'hype' | 'close' | 'card' | 'ref') {
  const c = ac();
  if (!c) return;
  const out = master(c, 0.5);
  const t = c.currentTime + 0.01;
  if (type === 'hype') {
    const n = noiseSource(c);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + 0.4);
    const g = c.createGain();
    envelope(g, t, 0.05, 0.9, 0.2, 0.2);
    n.connect(bp).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.5);
  } else if (type === 'close') {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(560, t);
    o.frequency.exponentialRampToValueAtTime(240, t + 0.6);
    const g = c.createGain();
    envelope(g, t, 0.04, 0.35, 0.25, 0.35);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.7);
    crowd(c, out, t, 0.1, 0.2, 0.4, 0.25, 600);
  } else if (type === 'card') {
    // referee's whistle: a high sine with a fast trill, blown twice
    for (const start of [0, 0.32]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = 2700;
      const lfo = c.createOscillator();
      lfo.frequency.value = 28;
      const depth = c.createGain();
      depth.gain.value = 140;
      lfo.connect(depth).connect(o.frequency);
      const g = c.createGain();
      envelope(g, t + start, 0.01, 0.3, start ? 0.35 : 0.14, 0.05);
      o.connect(g).connect(out);
      o.start(t + start);
      lfo.start(t + start);
      o.stop(t + start + 0.5);
      lfo.stop(t + start + 0.5);
    }
  } else {
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.value = 110;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = c.createGain();
    envelope(g, t, 0.01, 0.35, 0.3, 0.08);
    o.connect(lp).connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.45);
  }
}

export function playClick() {
  const c = ac();
  if (!c) return;
  const out = master(c, 0.3);
  const t = c.currentTime;
  const o = c.createOscillator();
  o.frequency.setValueAtTime(880, t);
  o.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
  const g = c.createGain();
  envelope(g, t, 0.005, 0.3, 0.02, 0.06);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.12);
}
