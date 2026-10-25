import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { serverNow, useStore } from '../lib/store';
import { formatKickoffLocal, splitDuration } from '../lib/time';
import { ClubBadge, TeamArt } from './art/Players';
import { LiveDot } from './art/Icons';
import { OfflineNote, SplitBar } from './ui';

function useCountdown(target: number) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(id);
  }, []);
  return target - now;
}

export function Hero() {
  const { data, phase, kickoff, online, connecting } = useStore();
  const remaining = useCountdown(kickoff);
  const { d, h, m, s } = splitDuration(remaining);
  const local = formatKickoffLocal(data.match.kickoff);
  const { score, sides } = data;
  const showScore = phase !== 'pre';

  return (
    <section id="top" className="relative overflow-hidden border-b border-line/60">
      {/* stadium glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(237,187,0,.18),transparent_55%),radial-gradient(ellipse_at_0%_100%,rgba(0,77,152,.45),transparent_55%),radial-gradient(ellipse_at_100%_100%,rgba(255,255,255,.12),transparent_50%)]" />
      {/* the three stars of each side */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[78%] items-end justify-between [mask-image:linear-gradient(to_top,black_55%,transparent)] md:h-[92%]">
        <TeamArt kit="home" className="h-full w-[52%] max-w-[560px] -translate-x-[18%] opacity-30 sm:opacity-45 md:translate-x-0 lg:opacity-80" />
        <TeamArt kit="away" className="h-full w-[52%] max-w-[560px] translate-x-[18%] opacity-30 sm:opacity-45 md:translate-x-0 lg:opacity-80" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,#070B1F)]" />

      <div className="relative mx-auto w-full max-w-4xl px-4 pb-12 pt-8 text-center sm:px-6 sm:pt-14 md:pb-20">
        <p className="label text-xs text-gold sm:text-sm">
          {data.match.competition} · {data.match.venue}
        </p>

        {/* scoreboard */}
        <div className="mx-auto mt-5 grid max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-3xl border border-line bg-night/70 px-3 py-5 shadow-[0_20px_60px_rgba(0,0,0,.5)] backdrop-blur-sm sm:gap-6 sm:px-8 sm:py-7">
          <TeamSide team="home" name="Barça" />
          <div className="min-w-[5.5rem] sm:min-w-[11rem]">
            {showScore ? (
              <p className="font-display text-[clamp(3.4rem,15vw,7.5rem)] font-black leading-none tabular" aria-live="polite">
                {score.home}
                <span className="mx-1 text-muted sm:mx-2">–</span>
                {score.away}
              </p>
            ) : (
              <p className="font-display text-[clamp(2.6rem,12vw,5.5rem)] font-black leading-none text-gold">VS</p>
            )}
            <StatusPill phase={phase} minute={score.minute} />
          </div>
          <TeamSide team="away" name="Madrid" />
        </div>

        {phase === 'pre' && (
          <div className="mt-7">
            <p className="label text-xs text-muted sm:text-sm">Kick-off in</p>
            <div className="mt-2 flex justify-center gap-2 sm:gap-3" role="timer" aria-label={`${d} days ${h} hours ${m} minutes ${s} seconds to kick-off`}>
              {d > 0 && <TimeBox value={d} label="days" />}
              <TimeBox value={h} label="hours" />
              <TimeBox value={m} label="min" />
              <TimeBox value={s} label="sec" />
            </div>
            <p className="mt-4 text-sm text-white/85 sm:text-base">
              Kick-off <strong className="text-gold">{local.time}</strong> your time · {local.day}
            </p>
          </div>
        )}

        <div className="mx-auto mt-7 max-w-md">
          {online ? (
            <div className="panel px-4 py-3 text-left">
              <p className="label mb-2 flex items-center gap-2 text-xs text-muted">
                <Users size={14} aria-hidden /> Fans in the building · {sides.barca + sides.madrid + sides.neutral}
              </p>
              <SplitBar
                parts={[sides.barca, sides.neutral, sides.madrid]}
                labels={[`Barça ${sides.barca}`, `Neutral ${sides.neutral}`, `Madrid ${sides.madrid}`]}
                height="h-3"
              />
            </div>
          ) : (
            !connecting && <OfflineNote />
          )}
        </div>
      </div>
    </section>
  );
}

function TeamSide({ team, name }: { team: 'home' | 'away'; name: string }) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-2 ${team === 'home' ? 'sm:flex-row-reverse sm:justify-start' : 'sm:flex-row sm:justify-start'}`}>
      <ClubBadge team={team} size={56} className="h-12 w-12 shrink-0 sm:h-20 sm:w-20" />
      <div className={team === 'home' ? 'sm:text-right' : 'sm:text-left'}>
        <p className="font-display text-[clamp(1.4rem,6vw,2.6rem)] font-black uppercase leading-none">{name}</p>
        <p className="label text-[0.65rem] text-muted sm:text-xs">{team === 'home' ? 'Home' : 'Away'}</p>
      </div>
    </div>
  );
}

function StatusPill({ phase, minute }: { phase: string; minute: string | null }) {
  if (phase === 'pre') return <p className="label mt-2 text-xs text-muted">Tonight</p>;
  if (phase === 'ft') return <p className="label mt-2 inline-block rounded-full bg-gold px-3 py-1 text-xs text-night">Full time</p>;
  return (
    <p className="label mt-2 inline-flex items-center gap-2 rounded-full bg-[#ff2d55]/15 px-3 py-1 text-xs text-[#ff7a92] sm:text-sm">
      <LiveDot /> {phase === 'ht' ? 'Half-time' : 'Live'}
      {phase === 'live' && minute ? ` · ${minute}′` : ''}
    </p>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="panel w-[4.6rem] py-2.5 sm:w-24 sm:py-3">
      <p className="font-display text-4xl font-black leading-none tabular sm:text-5xl">{String(value).padStart(2, '0')}</p>
      <p className="label mt-1 text-[0.65rem] text-muted sm:text-xs">{label}</p>
    </div>
  );
}
