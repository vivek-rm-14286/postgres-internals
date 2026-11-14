import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Shared helpers for the e5 (distributed database theory) visualizers. Not a lesson: no `lesson` export. */

export function Btn({ children, onClick, primary, testid, disabled, title, active }: {
  children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean; title?: string; active?: boolean
}) {
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled} title={title}
      className={primary
        ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-40'
        : `rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${active ? 'border-dead text-dead' : 'border-line bg-surface hover:border-accent'}`}>
      {children}
    </button>
  )
}

export function Stat({ label, value, t, sub }: { label: string; value: ReactNode; t?: Tone; sub?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="truncate text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="truncate font-mono text-base font-bold tabular-nums sm:text-lg"
        style={t ? { color: tone.text(t) } : undefined}>{value}</motion.p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

export function Pill({ t, children }: { t: Tone; children: ReactNode }) {
  return <span className="inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold"
    style={{ borderColor: tone(t), background: toneBg(t, 14), color: 'var(--text)' }}>{children}</span>
}

export function Slider({ label, value, min, max, step = 1, onChange, show }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; show: string
}) {
  return (
    <label className="grid min-w-0 gap-0.5 text-xs">
      <span className="flex justify-between gap-2 font-mono text-muted"><span className="truncate">{label}</span><b className="text-ink">{show}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="accent-[var(--accent)]" aria-label={label} />
    </label>
  )
}

export function Code({ children, className = '' }: { children: string; className?: string }) {
  return <pre className={`overflow-x-auto rounded-lg border border-line bg-surface-2 p-2 font-mono text-[11px] leading-snug whitespace-pre scrollbar-thin ${className}`}>{children}</pre>
}

/** A horizontal tab strip that wraps on phones (Segmented does not wrap). */
export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1.5">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${value === v ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-muted hover:text-ink'}`}>{l}</button>
      ))}
    </div>
  )
}

/**
 * PostgreSQL's hashint4() (hash_bytes_uint32, Jenkins lookup3 final mix), ported bit for bit.
 * Checked against PostgreSQL 18: hashint4(42) = 1509752520.
 */
const rot = (x: number, k: number) => ((x << k) | (x >>> (32 - k))) >>> 0
export function hashint4(k: number): number {
  let a = (0x9e3779b9 + 4 + 3923095) >>> 0
  let b = a, c = a
  a = (a + (k >>> 0)) >>> 0
  c = ((c ^ b) - rot(b, 14)) >>> 0
  a = ((a ^ c) - rot(c, 11)) >>> 0
  b = ((b ^ a) - rot(a, 25)) >>> 0
  c = ((c ^ b) - rot(b, 16)) >>> 0
  a = ((a ^ c) - rot(c, 4)) >>> 0
  b = ((b ^ a) - rot(a, 14)) >>> 0
  c = ((c ^ b) - rot(b, 24)) >>> 0
  return c | 0
}

/** Complementary error function (Numerical Recipes erfcc, fractional error < 1.2e-7). */
export function erfc(x: number): number {
  const z = Math.abs(x)
  const t = 1 / (1 + 0.5 * z)
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
    t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))))
  return x >= 0 ? r : 2 - r
}

/** Deterministic PRNG (mulberry32) so simulations replay identically. */
export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const TRY_SQL = `-- try_sql runs one statement and returns 'ok' or the error text, so a preset can show an error and keep going
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE msg text;
BEGIN
  EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
  RETURN 'ERROR: ' || msg;
END $$;`

/** SVG arrowhead markers, one per tone, referenced as url(#e5-arrow-<tone>). */
export function Arrows({ tones }: { tones: Tone[] }) {
  return (
    <defs>
      {tones.map((t) => (
        <marker key={t} id={`e5-arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={tone(t)} />
        </marker>
      ))}
    </defs>
  )
}

/** A dot that travels from (x1,y1) to (x2,y2) after `delay` seconds. Re-mounting (new key) replays it. */
export function Packet({ x1, y1, x2, y2, delay = 0, t = 'new', r = 5, dur = 0.6 }: {
  x1: number; y1: number; x2: number; y2: number; delay?: number; t?: Tone; r?: number; dur?: number
}) {
  return (
    <motion.circle r={r} fill={tone(t)} stroke="var(--surface)" strokeWidth={1.5}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [1, 1, 0] }}
      transition={{ duration: dur, delay, ease: 'easeInOut', opacity: { duration: dur + 0.3, delay, times: [0, 0.8, 1] } }} />
  )
}

/** Format a byte count. */
export function bytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} kB`
  return `${Math.round(n)} B`
}
