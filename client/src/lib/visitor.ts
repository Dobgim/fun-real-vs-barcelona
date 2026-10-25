import type { Side } from '@shared/types';

export const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode: fine, we just forget */
    }
  },
};

function uuid() {
  // randomUUID only exists in secure contexts (not on http://192.168.x.x while testing on a phone)
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

let cached: string | null = null;
export function visitorId() {
  if (cached) return cached;
  cached = store.get('cn:visitorId') ?? uuid();
  store.set('cn:visitorId', cached);
  return cached;
}

export function savedSide(): Side | null {
  const s = store.get('cn:side');
  return s === 'barca' || s === 'madrid' || s === 'neutral' ? s : null;
}
export function saveSide(side: Side) {
  store.set('cn:side', side);
}
