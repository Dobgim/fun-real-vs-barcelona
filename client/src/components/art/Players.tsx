// Illustrated players (back view, name + number) and original monogram badges.
// These are drawings in club colours, not official crests or photos. To use licensed
// images instead, set the paths in src/art.config.ts.
import { useId } from 'react';
import { ART } from '../../art.config';

type Kit = 'home' | 'away';
type Pose = 'stand' | 'raise' | 'point' | 'wide';

const ARMS: Record<Pose, [string, string]> = {
  stand: ['M52 104 Q 34 160 40 222', 'M148 104 Q 166 160 160 222'],
  raise: ['M52 102 Q 26 62 34 14', 'M148 102 Q 174 62 166 14'],
  point: ['M52 104 Q 34 160 40 222', 'M148 102 Q 170 56 160 6'],
  wide: ['M52 104 Q 22 100 6 60', 'M148 104 Q 178 100 194 60'],
};

const SILHOUETTE = '#1A2352';

export function PlayerFigure({
  kit,
  name,
  number,
  pose = 'stand',
  x = 0,
  y = 0,
  width = 200,
}: {
  kit: Kit;
  name: string;
  number: number;
  pose?: Pose;
  x?: number;
  y?: number;
  width?: number;
}) {
  const uid = useId().replace(/:/g, '');
  const torso = 'M52 92 Q100 80 148 92 L152 124 Q147 182 143 242 L57 242 Q53 182 48 124 Z';
  const home = kit === 'home';
  const sleeve = home ? '#A50044' : '#F4F6FC';
  const label = name.toUpperCase();
  const [armL, armR] = ARMS[pose];

  return (
    <svg x={x} y={y} width={width} height={width * 2.2} viewBox="0 0 200 440" overflow="visible">
      <defs>
        <clipPath id={`t${uid}`}>
          <path d={torso} />
        </clipPath>
        <linearGradient id={`s${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".28" />
          <stop offset=".35" stopColor="#000" stopOpacity="0" />
          <stop offset=".7" stopColor="#fff" stopOpacity=".06" />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
      </defs>

      {/* arms with sleeves (sleeve = first stretch of the same path) */}
      {[armL, armR].map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={SILHOUETTE} strokeWidth="20" strokeLinecap="round" />
          <path d={d} fill="none" stroke={sleeve} strokeWidth="27" strokeDasharray="42 999" />
        </g>
      ))}

      {/* legs, socks, boots */}
      <path d="M64 296h26v80H64zM110 296h26v80h-26z" fill={SILHOUETTE} />
      <path d="M62 340h30v66H62zM108 340h30v66h-30z" fill={home ? '#A50044' : '#F4F6FC'} />
      <path d="M62 346h30v5H62zM108 346h30v5h-30z" fill={home ? '#004D98' : '#C9A227'} />
      <ellipse cx="77" cy="414" rx="20" ry="9" fill="#05081A" />
      <ellipse cx="123" cy="414" rx="20" ry="9" fill="#05081A" />

      {/* shorts */}
      <path d="M57 238h86l7 64-44 4-6-24-6 24-44-4z" fill={home ? '#0B2F6E' : '#F4F6FC'} />
      {!home && <path d="M57 238h86l1 8H56z" fill="#C9A227" opacity=".8" />}

      {/* shirt */}
      <g clipPath={`url(#t${uid})`}>
        {home ? (
          <>
            <rect x="40" y="70" width="130" height="190" fill="#A50044" />
            {[44, 84, 124].map((sx) => (
              <rect key={sx} x={sx} y="70" width="22" height="190" fill="#004D98" />
            ))}
          </>
        ) : (
          <rect x="40" y="70" width="130" height="190" fill="#F4F6FC" />
        )}
        <rect x="40" y="70" width="130" height="190" fill={`url(#s${uid})`} />
      </g>
      <path d="M84 86q16 9 32 0" fill="none" stroke={home ? '#EDBB00' : '#0F1A4A'} strokeWidth="5" strokeLinecap="round" />

      {/* name + number */}
      <text
        x="100"
        y="130"
        textAnchor="middle"
        fontFamily="Barlow Condensed, Arial Narrow, sans-serif"
        fontWeight="700"
        fontSize="17"
        letterSpacing="1.5"
        fill={home ? '#EDBB00' : '#0F1A4A'}
        {...(label.length > 9 ? { textLength: 88, lengthAdjust: 'spacingAndGlyphs' } : {})}
      >
        {label}
      </text>
      <text
        x="100"
        y="214"
        textAnchor="middle"
        fontFamily="Big Shoulders Display, Arial Narrow, sans-serif"
        fontWeight="900"
        fontSize="84"
        fill={home ? '#EDBB00' : '#0F1A4A'}
        stroke={home ? '#5A2A00' : '#C9A227'}
        strokeWidth="1.5"
        paintOrder="stroke"
      >
        {number}
      </text>

      {/* neck + head */}
      <path d="M88 66h24v24H88z" fill={SILHOUETTE} />
      <ellipse cx="100" cy="50" rx="25" ry="29" fill={SILHOUETTE} />
      <path d="M76 44q2-24 24-25q22 1 24 25q-8-10-24-10t-24 10z" fill="#0C1130" />
      <path d="M77 52a4 7 0 0 1 0 12M123 52a4 7 0 0 0 0 12" fill="none" stroke="#0C1130" strokeWidth="5" />
    </svg>
  );
}

export const STARS: Record<Kit, { name: string; number: number; pose: Pose }[]> = {
  home: [
    { name: 'Pedri', number: 8, pose: 'stand' },
    { name: 'Lamine Yamal', number: 10, pose: 'raise' },
    { name: 'Raphinha', number: 11, pose: 'point' },
  ],
  away: [
    { name: 'Valverde', number: 8, pose: 'stand' },
    { name: 'Mbappé', number: 10, pose: 'wide' },
    { name: 'Bellingham', number: 5, pose: 'raise' },
  ],
};

/** Three stars of one side, the middle one in front. */
export function TeamArt({ kit, className = '' }: { kit: Kit; className?: string }) {
  const custom = kit === 'home' ? ART.homePlayers : ART.awayPlayers;
  if (custom.length) {
    return (
      <div className={`flex items-end justify-center gap-0 ${className}`} aria-hidden>
        {custom.slice(0, 3).map((src, i) => (
          <img key={src} src={src} alt="" className={`h-full w-1/3 object-contain object-bottom ${i === 1 ? 'z-10 scale-110' : 'opacity-80'}`} />
        ))}
      </div>
    );
  }
  const [a, b, c] = STARS[kit];
  return (
    <svg viewBox="0 0 520 560" className={className} aria-hidden preserveAspectRatio="xMidYMax meet">
      <PlayerFigure kit={kit} {...a} x={10} y={110} width={180} />
      <PlayerFigure kit={kit} {...c} x={330} y={110} width={180} />
      <PlayerFigure kit={kit} {...b} x={150} y={70} width={220} />
    </svg>
  );
}

export function ClubBadge({ team, size = 64, className = '' }: { team: Kit; size?: number | string; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const custom = team === 'home' ? ART.homeBadge : ART.awayBadge;
  if (custom) return <img src={custom} alt="" width={size as number} height={size as number} className={`object-contain ${className}`} />;

  if (team === 'home') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 112" className={className} aria-hidden>
        <defs>
          <clipPath id={`b${uid}`}>
            <path d="M8 8h84v46q0 34-42 52Q8 88 8 54z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#b${uid})`}>
          <rect width="100" height="112" fill="#A50044" />
          {[8, 36, 64].map((x) => (
            <rect key={x} x={x} y="0" width="14" height="112" fill="#004D98" />
          ))}
          <rect x="0" y="8" width="100" height="30" fill="#0B1030" />
          <rect x="0" y="36" width="100" height="3" fill="#EDBB00" />
        </g>
        <path d="M8 8h84v46q0 34-42 52Q8 88 8 54z" fill="none" stroke="#EDBB00" strokeWidth="5" strokeLinejoin="round" />
        <text x="50" y="31" textAnchor="middle" fontFamily="Big Shoulders Display, sans-serif" fontWeight="900" fontSize="22" fill="#EDBB00" letterSpacing="2">
          FCB
        </text>
        <circle cx="50" cy="68" r="13" fill="#fff" stroke="#0B1030" strokeWidth="2" />
        <path d="M50 61.5l6.2 4.5-2.4 7.2h-7.6L43.8 66z" fill="#0B1030" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 112" className={className} aria-hidden>
      <circle cx="50" cy="58" r="44" fill="#F4F6FC" stroke="#C9A227" strokeWidth="5" />
      <circle cx="50" cy="58" r="36" fill="none" stroke="#0F1A4A" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="50" y="72" textAnchor="middle" fontFamily="Big Shoulders Display, sans-serif" fontWeight="900" fontSize="40" fill="#0F1A4A">
        RM
      </text>
      <path d="M50 22l2.4 5 5.4.6-4 3.7 1.1 5.4-4.9-2.8-4.9 2.8 1.1-5.4-4-3.7 5.4-.6z" fill="#C9A227" />
    </svg>
  );
}
