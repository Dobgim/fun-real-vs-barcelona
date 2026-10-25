// Hand-drawn, colourful SVG icons used instead of emoji across the site.
import { useId, type ReactNode } from 'react';

interface IconProps {
  size?: number | string;
  className?: string;
  title?: string;
}

function Svg({ size = 32, className, title, children, viewBox = '0 0 64 64' }: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

function FaceBase({ id, from = '#FFE36E', to = '#F5A623' }: { id: string; from?: string; to?: string }) {
  return (
    <>
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill={`url(#${id})`} />
      <circle cx="32" cy="32" r="29" fill="none" stroke="#000" strokeOpacity=".12" strokeWidth="2" />
    </>
  );
}

export function LaughFace(p: IconProps) {
  const id = useId();
  return (
    <Svg {...p}>
      <FaceBase id={id} />
      <path d="M13 25q6-8 13-1M38 24q7-7 13 1" fill="none" stroke="#5B3A00" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M13 33h38q0 20-19 20T13 33z" fill="#5B1A1A" />
      <path d="M15.5 33h33q-.6 4-2.5 5H18q-2-1-2.5-5z" fill="#fff" />
      <path d="M22 47q10-7 20 0q-4 6-10 6t-10-6z" fill="#F0626B" />
      <path d="M8 22q-5 8-1 13q5 2 6-4q0-4-5-9zM56 22q5 8 1 13q-5 2-6-4q0-4 5-9z" fill="#5BC8F5" stroke="#2F8FC2" strokeWidth="1.2" />
    </Svg>
  );
}

export function SadFace(p: IconProps) {
  const id = useId();
  return (
    <Svg {...p}>
      <FaceBase id={id} from="#FFE89A" to="#E2A93B" />
      <path d="M17 22l9 4M47 22l-9 4" stroke="#5B3A00" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23" cy="31" r="3.6" fill="#5B3A00" />
      <circle cx="41" cy="31" r="3.6" fill="#5B3A00" />
      <path d="M21 48q11-10 22 0" fill="none" stroke="#5B3A00" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M44 36q-4 7-1 10q4 2 5-2q0-3-4-8z" fill="#5BC8F5" stroke="#2F8FC2" strokeWidth="1.2" />
    </Svg>
  );
}

export function ShockedFace(p: IconProps) {
  const id = useId();
  return (
    <Svg {...p}>
      <FaceBase id={id} />
      <ellipse cx="22" cy="26" rx="6" ry="7.5" fill="#fff" stroke="#5B3A00" strokeWidth="2" />
      <ellipse cx="42" cy="26" rx="6" ry="7.5" fill="#fff" stroke="#5B3A00" strokeWidth="2" />
      <circle cx="22" cy="27" r="3" fill="#2B1A00" />
      <circle cx="42" cy="27" r="3" fill="#2B1A00" />
      <path d="M15 15q5-4 11-2M49 15q-5-4-11-2" fill="none" stroke="#5B3A00" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="32" cy="45" rx="7" ry="9" fill="#5B1A1A" />
      <ellipse cx="32" cy="49" rx="4.5" ry="3.5" fill="#F0626B" />
    </Svg>
  );
}

export function AngryFace(p: IconProps) {
  const id = useId();
  return (
    <Svg {...p}>
      <FaceBase id={id} from="#FF8A5B" to="#D7263D" />
      <path d="M14 20l13 6M50 20l-13 6" stroke="#3A0A0A" strokeWidth="3.8" strokeLinecap="round" />
      <circle cx="23" cy="31" r="3.6" fill="#3A0A0A" />
      <circle cx="41" cy="31" r="3.6" fill="#3A0A0A" />
      <rect x="19" y="41" width="26" height="9" rx="3" fill="#fff" stroke="#3A0A0A" strokeWidth="2.4" />
      <path d="M25.5 41v9M32 41v9M38.5 41v9" stroke="#3A0A0A" strokeWidth="1.8" />
    </Svg>
  );
}

export function CoolFace(p: IconProps) {
  const id = useId();
  return (
    <Svg {...p}>
      <FaceBase id={id} />
      <path d="M9 23h46v3l-3 1q-1 9-9 9q-8 0-10-8h-2q-2 8-10 8q-8 0-9-9l-3-1z" fill="#111827" />
      <path d="M15 27l5-2M40 27l5-2" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 45q11 8 22 0" fill="none" stroke="#5B3A00" strokeWidth="3.4" strokeLinecap="round" />
    </Svg>
  );
}

export function DizzyFace(p: IconProps) {
  const id = useId();
  return (
    <Svg {...p}>
      <FaceBase id={id} from="#D9F5A8" to="#8CC152" />
      <path d="M17 22l10 10M27 22L17 32M37 22l10 10M47 22L37 32" stroke="#2D4A12" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M18 46q3.5-4 7 0t7 0t7 0t7 0" fill="none" stroke="#2D4A12" strokeWidth="3.2" strokeLinecap="round" />
    </Svg>
  );
}

export function TissueRoll(p: IconProps) {
  const id = useId();
  return (
    <Svg {...p}>
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor="#E6E9F5" />
          <stop offset=".5" stopColor="#fff" />
          <stop offset="1" stopColor="#C9CEE4" />
        </linearGradient>
      </defs>
      <path d="M12 16h30v34H12z" fill={`url(#${id})`} />
      <ellipse cx="12" cy="33" rx="7" ry="17" fill="#F4F6FC" stroke="#B5BBD8" strokeWidth="1.5" />
      <ellipse cx="12" cy="33" rx="2.6" ry="6" fill="#8A93BC" />
      <path d="M42 16q8 0 8 12v28l-4-2-4 2-4-2-4 2V50h8z" fill="#fff" stroke="#B5BBD8" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M42 16q-7 0-7 17q0 17 7 17" fill="none" stroke="#B5BBD8" strokeWidth="1.5" />
      <path d="M41 30h8M41 38h8" stroke="#D9DDEE" strokeWidth="1.5" strokeDasharray="2 2" />
    </Svg>
  );
}

export function Flame(p: IconProps) {
  const id = useId();
  return (
    <Svg {...p}>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#D7263D" />
          <stop offset=".55" stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#FFD23F" />
        </linearGradient>
      </defs>
      <path d="M32 4q5 12 14 20q9 9 9 19c0 10-9 18-23 18S9 53 9 43q0-9 7-15q0 7 5 9q-2-17 11-33z" fill={`url(#${id})`} />
      <path d="M32 30q4 7 8 11q4 4 4 8c0 6-5 9-12 9s-12-3-12-9q0-5 5-8q1 4 4 5q-1-9 3-16z" fill="#FFE36E" />
    </Svg>
  );
}

export function YellowCard(p: IconProps) {
  return (
    <Svg {...p}>
      <g transform="rotate(12 32 32)">
        <rect x="17" y="7" width="30" height="44" rx="4" fill="#F9C80E" stroke="#B88A00" strokeWidth="2" />
        <path d="M21 11h12l-12 18z" fill="#fff" fillOpacity=".35" />
      </g>
      <path d="M10 56q4-6 10-4" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function Ball(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="32" cy="32" r="29" fill="#fff" stroke="#0B1030" strokeWidth="2.5" />
      <path d="M32 21l10.5 7.6-4 12.4h-13l-4-12.4z" fill="#0B1030" />
      <path
        d="M32 21V8M42.5 28.6l12-4M38.5 41l7.5 10.5M25.5 41L18 51.5M21.5 28.6l-12-4"
        stroke="#0B1030"
        strokeWidth="2.5"
      />
      <path d="M26 4.5L32 8l6-3.5q-6-1.6-12 0zM58.5 22l-4 2.6 1.4 7.6 4-3.2q0-3.6-1.4-7zM50.6 55l-4.6-3.5-7 2.7 1.5 4.6q6-1 10.1-3.8zM13.4 55q4 2.8 10 3.8l1.6-4.6-7-2.7zM5.5 22q-1.4 3.4-1.4 7l4 3.2 1.4-7.6z" fill="#0B1030" />
    </Svg>
  );
}

export function Whistle(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M8 30a16 16 0 1 0 30 8h18V24H24A16 16 0 0 0 8 30z" fill="#D4D9EE" stroke="#5B648F" strokeWidth="2.4" />
      <circle cx="24" cy="38" r="6" fill="#5B648F" />
      <path d="M40 24v-6h6v6" fill="none" stroke="#5B648F" strokeWidth="2.4" />
    </Svg>
  );
}

/** Two linked hands, drawn as interlocking blue and white sleeves. */
export function Handshake(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M2 24l12-6 8 4 10-3 10 3 8-4 12 6-6 14-6-2-12 10q-4 3-7 0L18 36l-6 2z" fill="#F2C38B" stroke="#8A5A2B" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2 24l12-6 4 16-6 4z" fill="#004D98" />
      <path d="M62 24l-12-6-4 16 6 4z" fill="#fff" stroke="#C9CEE4" strokeWidth="1.5" />
      <path d="M24 37l4 4M28 33l5 5M33 30l5 5" stroke="#8A5A2B" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function LiveDot({ className = '' }: { className?: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full bg-[#ff2d55] shadow-[0_0_10px_#ff2d55] motion-safe:animate-live ${className}`} />;
}
