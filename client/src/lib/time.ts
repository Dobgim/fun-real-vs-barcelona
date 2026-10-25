export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions) {
  // Date-only strings are parsed as UTC; keep them on the same calendar day everywhere.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return new Intl.DateTimeFormat(undefined, { ...opts, ...(dateOnly ? { timeZone: 'UTC' } : {}) }).format(new Date(iso));
}

export function formatKickoffLocal(iso: string) {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(d);
  const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  return { time, day };
}

export function splitDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
