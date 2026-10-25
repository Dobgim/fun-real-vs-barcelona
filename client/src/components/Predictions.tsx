import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Check, Copy, Lock, Minus, Plus, Trophy } from 'lucide-react';
import type { PollChoice } from '@shared/types';
import { serverNow, useStore } from '../lib/store';
import { post } from '../lib/api';
import { store } from '../lib/visitor';
import { playClick } from '../lib/audio';
import { confetti } from '../lib/fx';
import { Button, OfflineNote, Section, SplitBar, pct } from './ui';
import { ClubBadge } from './art/Players';
import { Handshake } from './art/Icons';

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function Predictions() {
  const { data, me, patchMe, online, kickoff } = useStore();
  const p = data.predictions;
  const open = p.open && serverNow() < kickoff;
  const ft = data.score.status === 'ft';

  const [home, setHome] = useState(me.prediction?.home ?? 2);
  const [away, setAway] = useState(me.prediction?.away ?? 1);
  const [name, setName] = useState(me.prediction?.name ?? store.get('cn:name') ?? '');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (me.prediction) {
      setHome(me.prediction.home);
      setAway(me.prediction.away);
      setName(me.prediction.name);
    }
  }, [me.prediction]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await post('/predictions', { name, home, away });
      store.set('cn:name', name.trim());
      patchMe({ prediction: { name: name.trim(), home, away } });
      setEditing(false);
      confetti({ count: 80, origin: { x: 0.5, y: 0.7 } });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const mine = me.prediction;
  const share = async () => {
    if (!mine) return;
    const text = `⚽ El Clásico tonight — ${mine.name} predicts: Barça ${mine.home} – ${mine.away} Madrid. What's your score? ${window.location.origin}`;
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const best = ft ? Math.max(0, ...p.entries.map((e) => e.points ?? 0)) : 0;
  const winners = ft && best > 0 ? p.entries.filter((e) => e.points === best) : [];
  const showForm = online && open && (!mine || editing);

  return (
    <Section id="predict" eyebrow="Score prediction game" title="Call the score" aside={!online ? <OfflineNote /> : undefined}>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="panel p-5 sm:p-6 lg:col-span-2">
          {showForm ? (
            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Stepper team="home" label="Barça" value={home} onChange={setHome} />
                <span className="font-display text-4xl font-black text-muted">–</span>
                <Stepper team="away" label="Madrid" value={away} onChange={setAway} />
              </div>
              <label className="block">
                <span className="label text-xs text-muted">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 24))}
                  maxLength={24}
                  required
                  autoComplete="nickname"
                  placeholder="e.g. Culer from Douala"
                  className="mt-1.5 block min-h-12 w-full rounded-xl border border-line bg-night px-4 text-base outline-none transition focus:border-gold"
                />
              </label>
              {error && <p className="text-sm text-[#ff7a92]">{error}</p>}
              <Button type="submit" variant="garnet" className="w-full text-base" disabled={busy || !name.trim()}>
                <Lock size={16} aria-hidden /> {mine ? 'Update my prediction' : 'Lock in my prediction'}
              </Button>
              <p className="text-xs text-muted">Exact score = 3 pts · correct result = 1 pt. Predictions close at kick-off.</p>
            </form>
          ) : (
            <div className="text-center">
              {mine ? (
                <>
                  <p className="label text-xs text-muted">{mine.name}, your call</p>
                  <p className="mt-2 font-display text-6xl font-black tabular">
                    {mine.home}
                    <span className="mx-2 text-muted">–</span>
                    {mine.away}
                  </p>
                  <p className="label text-xs text-muted">Barça – Madrid</p>
                </>
              ) : (
                <p className="py-6 text-muted">{online ? 'Predictions closed at kick-off.' : 'Predictions need the live server.'}</p>
              )}
              <div className="mt-5 flex flex-col gap-2">
                {mine && (
                  <Button variant="primary" onClick={share}>
                    {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                    {copied ? 'Copied! Paste it in WhatsApp' : 'Copy for WhatsApp'}
                  </Button>
                )}
                {mine && open && online && (
                  <Button variant="ghost" onClick={() => setEditing(true)}>
                    Change it
                  </Button>
                )}
                {!open && <p className="label mt-1 inline-flex items-center justify-center gap-1.5 text-xs text-muted"><Lock size={13} aria-hidden /> Closed at kick-off</p>}
              </div>
            </div>
          )}
        </div>

        <div className="panel p-5 sm:p-6 lg:col-span-3">
          {winners.length > 0 && (
            <div className="mb-5 rounded-2xl bg-[linear-gradient(135deg,rgba(237,187,0,.2),rgba(165,0,68,.2))] p-4">
              <p className="label flex items-center gap-2 text-sm text-gold">
                <Trophy size={18} aria-hidden /> {best === 3 ? 'Nailed the exact score' : 'Got the result right'}
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold">{winners.map((w) => w.name).join(', ')}</p>
            </div>
          )}
          <p className="label text-xs text-muted">Most picked scores · {p.entries.length} predictions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.counts.length === 0 && <p className="text-sm text-muted">No predictions yet. Be the first.</p>}
            {p.counts.map((c) => (
              <span key={c.score} className="label inline-flex items-center gap-2 rounded-xl border border-line bg-night px-3 py-2 text-sm">
                <span className="font-display text-lg font-black tabular">{c.score.replace('-', '–')}</span>
                <span className="text-muted">× {c.count}</span>
              </span>
            ))}
          </div>
          <ol className="mt-5 max-h-80 divide-y divide-line/60 overflow-y-auto pr-1">
            {p.entries.map((e, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <span className="label w-6 text-xs text-muted tabular">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{e.name}</span>
                <span className="font-display text-lg font-black tabular">
                  {e.home}–{e.away}
                </span>
                {e.points !== null && (
                  <span className={`label w-12 rounded-md py-0.5 text-center text-xs ${e.points === 3 ? 'bg-gold text-night' : e.points === 1 ? 'bg-blau' : 'bg-white/5 text-muted'}`}>
                    {e.points} pt{e.points === 1 ? '' : 's'}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <Poll />
    </Section>
  );
}

function Stepper({ team, label, value, onChange }: { team: 'home' | 'away'; label: string; value: number; onChange: (v: number) => void }) {
  const set = (v: number) => {
    playClick();
    onChange(Math.max(0, Math.min(9, v)));
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <ClubBadge team={team} size={40} />
      <span className="label text-xs text-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => set(value - 1)} disabled={value <= 0} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-night disabled:opacity-40" aria-label={`${label} one goal fewer`}>
          <Minus size={18} aria-hidden />
        </button>
        <output className="w-10 text-center font-display text-5xl font-black tabular" aria-live="polite">
          {value}
        </output>
        <button type="button" onClick={() => set(value + 1)} disabled={value >= 9} className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-night disabled:opacity-40" aria-label={`${label} one goal more`}>
          <Plus size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function Poll() {
  const { data, me, patchMe, online } = useStore();
  const [error, setError] = useState('');
  const t = data.poll;
  const total = t.barca + t.draw + t.madrid;

  const vote = async (choice: PollChoice) => {
    setError('');
    const prev = me.poll;
    patchMe({ poll: choice });
    playClick();
    try {
      await post('/poll', { choice });
    } catch (e) {
      patchMe({ poll: prev });
      setError((e as Error).message);
    }
  };

  const options: { id: PollChoice; label: string; icon: ReactNode; cls: string }[] = [
    { id: 'barca', label: 'Barça', icon: <ClubBadge team="home" size={30} />, cls: 'bg-[linear-gradient(135deg,#004D98,#A50044)]' },
    { id: 'draw', label: 'Draw', icon: <Handshake size={30} />, cls: 'bg-panel-2' },
    { id: 'madrid', label: 'Madrid', icon: <ClubBadge team="away" size={30} />, cls: 'bg-white text-night' },
  ];

  return (
    <div className="panel mt-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="label text-xs text-gold">Poll</p>
          <h3 className="font-display text-3xl font-extrabold uppercase">Who wins?</h3>
        </div>
        {online && <p className="label text-xs text-muted">{total} {total === 1 ? 'vote' : 'votes'}</p>}
      </div>
      {online ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {options.map((o) => (
              <button
                key={o.id}
                onClick={() => vote(o.id)}
                aria-pressed={me.poll === o.id}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 transition active:scale-[0.97] sm:flex-row sm:gap-3 ${o.cls} ${
                  me.poll === o.id ? 'border-gold shadow-[0_0_0_3px_rgba(237,187,0,.25)]' : 'border-transparent opacity-90 hover:opacity-100'
                }`}
              >
                {o.icon}
                <span className="font-display text-lg font-extrabold uppercase sm:text-xl">{o.label}</span>
                {me.poll === o.id && <Check size={16} aria-hidden />}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <SplitBar
              parts={[t.barca, t.draw, t.madrid]}
              labels={[`Barça ${pct(t.barca, total)}%`, `Draw ${pct(t.draw, total)}%`, `Madrid ${pct(t.madrid, total)}%`]}
            />
          </div>
          {error && <p className="mt-2 text-sm text-[#ff7a92]">{error}</p>}
        </>
      ) : (
        <OfflineNote className="mt-4" />
      )}
    </div>
  );
}
