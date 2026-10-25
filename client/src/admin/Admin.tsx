import { useEffect, useState, type ReactNode } from 'react';
import { KeyRound, Minus, Plus, Save } from 'lucide-react';
import type { Lineup, Lineups, ScoreState, Status } from '@shared/types';
import { adminRequest, fetchState } from '../lib/api';
import { store } from '../lib/visitor';
import { Button } from '../components/ui';
import { ClubBadge } from '../components/art/Players';

const POSITIONS = ['GK', 'RB', 'RCB', 'LCB', 'LB', 'DM (R)', 'DM (L)', 'RW', 'AM', 'LW', 'ST'];
const STATUSES: { id: Status; label: string }[] = [
  { id: 'pre', label: 'Pre-match' },
  { id: 'live', label: 'Live' },
  { id: 'ht', label: 'Half-time' },
  { id: 'ft', label: 'Full time' },
];

export default function Admin() {
  const [key, setKey] = useState(store.get('cn:adminKey') ?? '');
  const [authed, setAuthed] = useState(false);
  const [score, setScore] = useState<ScoreState | null>(null);
  const [lineups, setLineups] = useState<Lineups | null>(null);
  const [minute, setMinute] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 2500);
  };

  const load = async () => {
    const s = await fetchState();
    setScore(s.score);
    setMinute(s.score.minute ?? '');
    setLineups(s.lineups);
  };

  const login = async (k = key) => {
    try {
      await adminRequest(k, '/ping');
      store.set('cn:adminKey', k);
      setAuthed(true);
      await load();
    } catch (e) {
      flash(false, (e as Error).message);
    }
  };

  useEffect(() => {
    if (key) void login(key);
  }, []);

  const call = async <T,>(path: string, body: unknown, ok: string) => {
    setBusy(true);
    try {
      const r = await adminRequest<T>(key, path, body);
      flash(true, ok);
      return r;
    } catch (e) {
      flash(false, (e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const pushScore = async (home: number, away: number) => {
    const r = await call<ScoreState>('/score', { home, away, minute: minute || null }, `Score ${home}–${away} sent`);
    if (r) setScore(r);
  };
  const pushStatus = async (status: Status) => {
    if (status === 'ft' && !window.confirm('Blow the final whistle? This scores the predictions.')) return;
    const r = await call<ScoreState>('/status', { status, minute: minute || null }, `Status: ${status}`);
    if (r) setScore(r);
  };
  const pushLineups = async () => {
    if (!lineups) return;
    const r = await call<Lineups>('/lineups', lineups, 'Lineups saved');
    if (r) setLineups(r);
  };

  if (!authed) {
    return (
      <Shell>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
          className="panel mx-auto mt-10 max-w-sm space-y-4 p-6"
        >
          <p className="flex items-center gap-2 font-display text-2xl font-extrabold uppercase">
            <KeyRound size={22} aria-hidden /> Admin
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ADMIN_KEY"
            autoComplete="current-password"
            className="block min-h-12 w-full rounded-xl border border-line bg-night px-4 outline-none focus:border-gold"
          />
          <Button type="submit" className="w-full">
            Unlock
          </Button>
          {msg && <p className="text-sm text-[#ff7a92]">{msg.text}</p>}
        </form>
      </Shell>
    );
  }

  return (
    <Shell>
      {msg && (
        <div className={`label fixed inset-x-4 top-4 z-50 mx-auto max-w-sm rounded-xl px-4 py-3 text-center text-sm shadow-lg ${msg.ok ? 'bg-[#2bb673] text-night' : 'bg-[#ff2d55]'}`}>
          {msg.text}
        </div>
      )}

      {score && (
        <div className="panel space-y-5 p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase">Score</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['home', 'away'] as const).map((t) => (
              <div key={t} className="flex flex-col items-center gap-2 rounded-2xl bg-night p-3">
                <ClubBadge team={t} size={36} />
                <div className="flex items-center gap-2">
                  <button
                    className="grid h-12 w-12 place-items-center rounded-xl border border-line"
                    onClick={() => setScore({ ...score, [t]: Math.max(0, score[t] - 1) })}
                    aria-label="Minus one"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-10 text-center font-display text-5xl font-black tabular">{score[t]}</span>
                  <button className="grid h-12 w-12 place-items-center rounded-xl border border-line" onClick={() => setScore({ ...score, [t]: score[t] + 1 })} aria-label="Plus one">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="block">
            <span className="label text-xs text-muted">Minute (e.g. 37 or 90+3)</span>
            <input value={minute} onChange={(e) => setMinute(e.target.value.slice(0, 8))} inputMode="text" className="mt-1 block min-h-12 w-full rounded-xl border border-line bg-night px-4 outline-none focus:border-gold" />
          </label>
          <Button variant="gold" className="w-full" disabled={busy} onClick={() => pushScore(score.home, score.away)}>
            <Save size={16} /> Send score
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="garnet" className="min-h-14" disabled={busy} onClick={() => pushScore(score.home + 1, score.away)}>
              + Barça goal
            </Button>
            <Button variant="white" className="min-h-14" disabled={busy} onClick={() => pushScore(score.home, score.away + 1)}>
              + Madrid goal
            </Button>
          </div>
          <div>
            <p className="label mb-2 text-xs text-muted">Status · now {score.status}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUSES.map((s) => (
                <Button key={s.id} variant={score.status === s.id ? 'primary' : 'ghost'} disabled={busy} onClick={() => pushStatus(s.id)}>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {lineups && (
        <div className="panel mt-5 space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-extrabold uppercase">Lineups</h2>
            <label className="label flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-[#EDBB00]" checked={lineups.confirmed} onChange={(e) => setLineups({ ...lineups, confirmed: e.target.checked })} />
              Confirmed XI
            </label>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {(['home', 'away'] as const).map((t) => (
              <LineupEditor key={t} team={t} value={lineups[t]} onChange={(l) => setLineups({ ...lineups, [t]: l })} />
            ))}
          </div>
          <Button variant="gold" className="w-full" disabled={busy} onClick={pushLineups}>
            <Save size={16} /> Save lineups
          </Button>
        </div>
      )}
    </Shell>
  );
}

function LineupEditor({ team, value, onChange }: { team: 'home' | 'away'; value: Lineup; onChange: (l: Lineup) => void }) {
  const setPlayer = (i: number, patch: Partial<Lineup['players'][number]>) =>
    onChange({ ...value, players: value.players.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const list = (s: string) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

  return (
    <div className="space-y-2 rounded-2xl bg-night p-3">
      <p className="flex items-center gap-2 font-display text-xl font-extrabold uppercase">
        <ClubBadge team={team} size={24} /> {team === 'home' ? 'Barça' : 'Madrid'}
      </p>
      {value.players.map((p, i) => (
        <div key={i} className="grid grid-cols-[3.4rem_1fr_1fr] items-center gap-1.5">
          <span className="label text-xs text-muted">{POSITIONS[i]}</span>
          <input value={p.name} onChange={(e) => setPlayer(i, { name: e.target.value })} className="min-h-11 min-w-0 rounded-lg border border-line bg-panel px-2 text-sm" aria-label={`${POSITIONS[i]} name`} />
          <input
            value={p.doubt ?? ''}
            onChange={(e) => setPlayer(i, { doubt: e.target.value || undefined })}
            placeholder="doubt note"
            className="min-h-11 min-w-0 rounded-lg border border-line bg-panel px-2 text-sm"
            aria-label={`${POSITIONS[i]} doubt note`}
          />
        </div>
      ))}
      <Field label="Subs who came on (comma separated, ratable)">
        <input
          defaultValue={value.subs.map((s) => s.name).join(', ')}
          onBlur={(e) => onChange({ ...value, subs: list(e.target.value).map((name) => ({ id: '', name })) })}
          className="min-h-11 w-full rounded-lg border border-line bg-panel px-2 text-sm"
        />
      </Field>
      <Field label="Out (comma separated)">
        <input defaultValue={value.out.join(', ')} onBlur={(e) => onChange({ ...value, out: list(e.target.value) })} className="min-h-11 w-full rounded-lg border border-line bg-panel px-2 text-sm" />
      </Field>
      <Field label="Notes (comma separated)">
        <input defaultValue={value.notes.join(', ')} onBlur={(e) => onChange({ ...value, notes: list(e.target.value) })} className="min-h-11 w-full rounded-lg border border-line bg-panel px-2 text-sm" />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label text-[0.7rem] text-muted">{label}</span>
      {children}
    </label>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="stripes h-1.5" />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="label text-xs text-gold">Clásico Night</p>
        <h1 className="font-display text-4xl font-black uppercase">Control room</h1>
        <a href="/" className="label text-xs text-muted underline">
          Back to the site
        </a>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
