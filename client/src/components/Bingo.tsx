import { useMemo, useState } from 'react';
import { PartyPopper, Send, Shuffle, Trophy } from 'lucide-react';
import { useStore } from '../lib/store';
import { post } from '../lib/api';
import { store } from '../lib/visitor';
import { playCheer, playClick } from '../lib/audio';
import { bigConfetti } from '../lib/fx';
import { Button, OfflineNote, Section } from './ui';

const POOL = [
  'VAR check',
  'Penalty awarded',
  'Shot hits the woodwork',
  'Goal from outside the box',
  'Headed goal',
  'Red card',
  'Goal in added time',
  '0–0 at half-time',
  'Own goal',
  'Free-kick goal',
  'Players push and shove',
  'Huge goalkeeper save',
  'Goal ruled out for offside',
  'Commentator screams GOAL',
  'Sitter missed',
  'Goal from a corner',
  'Barça score 2+',
  'Comeback',
  'Five-minute added time',
  'Manager shouts at the ref',
];

const LINES: number[][] = [
  ...[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => r * 4 + c)),
  ...[0, 1, 2, 3].map((c) => [0, 1, 2, 3].map((r) => r * 4 + c)),
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];

interface Card {
  cells: string[];
  marked: boolean[];
}

function newCard(): Card {
  const pool = [...POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { cells: pool.slice(0, 16), marked: Array(16).fill(false) };
}

function loadCard(): Card {
  try {
    const c = JSON.parse(store.get('cn:bingo') ?? '') as Card;
    if (c.cells?.length === 16 && c.marked?.length === 16) return c;
  } catch {
    /* fall through */
  }
  const c = newCard();
  store.set('cn:bingo', JSON.stringify(c));
  return c;
}

const completed = (marked: boolean[]) => LINES.filter((l) => l.every((i) => marked[i]));

export function Bingo() {
  const { data, me, patchMe, online } = useStore();
  const [card, setCard] = useState(loadCard);
  const [name, setName] = useState(store.get('cn:name') ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const lines = useMemo(() => completed(card.marked), [card.marked]);
  const winning = new Set(lines.flat());
  const hasBingo = lines.length > 0;

  const save = (c: Card) => {
    setCard(c);
    store.set('cn:bingo', JSON.stringify(c));
  };

  const toggle = (i: number) => {
    const marked = [...card.marked];
    marked[i] = !marked[i];
    const before = completed(card.marked).length;
    const after = completed(marked).length;
    save({ ...card, marked });
    if (after > before) {
      bigConfetti();
      playCheer();
    } else playClick();
  };

  const shuffle = () => {
    if (card.marked.some(Boolean) && !window.confirm('Get a new card? Your marks will be cleared.')) return;
    save(newCard());
  };

  const claim = async () => {
    setError('');
    setBusy(true);
    try {
      await post('/bingo-winners', { name });
      store.set('cn:name', name.trim());
      patchMe({ bingo: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section
      id="bingo"
      eyebrow="Tap a square when it happens"
      title="Clásico Bingo"
      aside={
        <Button variant="ghost" onClick={shuffle} className="text-sm">
          <Shuffle size={16} aria-hidden /> New card
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
            {card.cells.map((cell, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                aria-pressed={card.marked[i]}
                className={`relative flex aspect-square min-h-11 items-center justify-center rounded-xl border-2 p-1 text-center text-[0.7rem] font-semibold leading-tight transition active:scale-95 min-[400px]:text-xs sm:rounded-2xl sm:p-2 sm:text-sm md:text-base ${
                  winning.has(i)
                    ? 'border-gold bg-[linear-gradient(135deg,#004D98,#A50044)] text-white shadow-[0_0_18px_rgba(237,187,0,.35)]'
                    : card.marked[i]
                      ? 'border-blau bg-blau/70 text-white'
                      : 'border-line bg-panel text-white/90 hover:border-muted'
                }`}
              >
                {cell}
                {card.marked[i] && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gold sm:right-1.5 sm:top-1.5" />}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Your card is saved on this phone. A full row, column or diagonal is a bingo.</p>
        </div>

        <div className="panel p-5 sm:p-6 lg:col-span-2">
          {hasBingo && (
            <div className="mb-5 rounded-2xl bg-[linear-gradient(135deg,rgba(237,187,0,.22),rgba(0,77,152,.25))] p-4">
              <p className="flex items-center gap-2 font-display text-3xl font-black uppercase text-gold">
                <PartyPopper size={28} aria-hidden /> Bingo!
              </p>
              {online && !me.bingo && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 24))}
                    maxLength={24}
                    placeholder="Your name"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-night px-3 outline-none focus:border-gold"
                  />
                  <Button variant="gold" onClick={claim} disabled={busy || !name.trim()}>
                    <Send size={16} aria-hidden /> Post it
                  </Button>
                </div>
              )}
              {me.bingo && <p className="mt-1 text-sm">You're on the winners list.</p>}
              {error && <p className="mt-2 text-sm text-[#ff7a92]">{error}</p>}
            </div>
          )}
          <p className="label flex items-center gap-2 text-xs text-muted">
            <Trophy size={14} aria-hidden /> Bingo winners
          </p>
          {online ? (
            data.bingoWinners.length ? (
              <ol className="mt-3 space-y-1.5">
                {data.bingoWinners.map((w, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl bg-night px-3 py-2">
                    <span className="font-display text-lg font-black text-gold tabular">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{w.name}</span>
                    <span className="label text-xs text-muted">{new Date(w.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted">Nobody yet. Keep your eyes on the pitch.</p>
            )
          ) : (
            <OfflineNote className="mt-3" />
          )}
        </div>
      </div>
    </Section>
  );
}
