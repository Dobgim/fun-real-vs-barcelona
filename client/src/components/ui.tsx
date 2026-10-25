import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { WifiOff } from 'lucide-react';

export function Section({
  id,
  eyebrow,
  title,
  children,
  className = '',
  aside,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 ${className}`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label text-xs text-gold sm:text-sm">{eyebrow}</p>
          <h2 className="fluid-h2 mt-1 font-display font-extrabold uppercase">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

type Variant = 'primary' | 'garnet' | 'ghost' | 'gold' | 'white';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blau hover:bg-[#0a5cb3] text-white border-transparent',
  garnet: 'bg-grana hover:bg-[#bb0a52] text-white border-transparent',
  gold: 'bg-gold hover:bg-[#ffcc1a] text-night border-transparent',
  white: 'bg-white hover:bg-[#e8ebf7] text-night border-transparent',
  ghost: 'bg-transparent hover:bg-white/5 text-white border-line',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(function Button(
  { variant = 'primary', className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={`label inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-[0.95rem] transition active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
});

export function OfflineNote({ className = '' }: { className?: string }) {
  return (
    <p className={`label inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-muted ${className}`}>
      <WifiOff size={14} aria-hidden /> Live features offline
    </p>
  );
}

/** Three-part horizontal bar: Barça / middle / Madrid. */
export function SplitBar({
  parts,
  labels,
  height = 'h-4',
}: {
  parts: [number, number, number];
  labels?: [string, string, string];
  height?: string;
}) {
  const total = parts.reduce((a, b) => a + b, 0) || 1;
  const colors = ['bg-blau', 'bg-[#5B648F]', 'bg-white'];
  return (
    <div>
      <div className={`flex w-full overflow-hidden rounded-full bg-night ring-1 ring-line ${height}`}>
        {parts.map((v, i) => (
          <div
            key={i}
            className={`${colors[i]} ${i === 0 ? 'bg-[linear-gradient(90deg,#004D98,#A50044)]' : ''} transition-[width] duration-700`}
            style={{ width: `${(v / total) * 100}%` }}
          />
        ))}
      </div>
      {labels && (
        <div className="label mt-2 flex justify-between gap-2 text-xs sm:text-sm">
          <span className="text-[#7fb2ff]">{labels[0]}</span>
          <span className="text-muted">{labels[1]}</span>
          <span className="text-white">{labels[2]}</span>
        </div>
      )}
    </div>
  );
}

export const pct = (v: number, total: number) => (total ? Math.round((v / total) * 100) : 0);
