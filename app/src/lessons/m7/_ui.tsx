import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Small helpers shared by the m7 visualizers. Not a lesson: no `lesson` export. */

export function Btn({ children, onClick, primary, testid, disabled, title }: {
  children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean; title?: string
}) {
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled} title={title}
      className={primary
        ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40'
        : 'rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:border-accent disabled:opacity-40'}>
      {children}
    </button>
  )
}

export function Stat({ label, value, t, sub }: { label: string; value: ReactNode; t?: Tone; sub?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-mono text-lg font-bold tabular-nums"
        style={t ? { color: tone(t) } : undefined}>{value}</motion.p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

/** A labelled horizontal bar whose width animates. `pct` is 0..100. */
export function Meter({ label, pct, t = 'accent', right }: { label: ReactNode; pct: number; t?: Tone; right?: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr_auto] items-center gap-2 text-xs">
      <span className="truncate text-muted">{label}</span>
      <div className="h-3 overflow-hidden rounded-full border border-line bg-surface-2">
        <motion.div className="h-full rounded-full" initial={false} animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }} style={{ background: tone(t) }} />
      </div>
      <span className="min-w-16 text-right font-mono tabular-nums">{right}</span>
    </div>
  )
}

export const fmtBytes = (n: number) => {
  if (Math.abs(n) < 1024) return `${Math.round(n)} B`
  if (Math.abs(n) < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} kB`
  if (Math.abs(n) < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

export const fmtNum = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1e9) return `${(n / 1e9).toFixed(a >= 1e10 ? 0 : 2).replace(/\.00$/, '')} B`
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, '')} M`
  if (a >= 1e4) return `${(n / 1e3).toFixed(0)} k`
  return Math.round(n).toLocaleString('en-US')
}

/** pg_lsn text 'X/Y' to a number of bytes (safe below 2^53). */
export const lsnNum = (lsn: string) => { const [hi, lo] = lsn.split('/'); return parseInt(hi, 16) * 2 ** 32 + parseInt(lo, 16) }
export const numLsn = (n: number) => `${Math.floor(n / 2 ** 32).toString(16).toUpperCase()}/${(n % 2 ** 32).toString(16).toUpperCase()}`
/** WAL segment file name for an LSN with 16 MB segments, as pg_walfile_name() computes it. */
export function walFile(lsn: string, timeline = 1) {
  const n = lsnNum(lsn)
  const seg = Math.floor(n / (16 * 1024 * 1024))
  const hex = (v: number) => v.toString(16).toUpperCase().padStart(8, '0')
  return { name: hex(timeline) + hex(Math.floor(seg / 256)) + hex(seg % 256), seg, offset: n % (16 * 1024 * 1024) }
}

/** A coloured pill used as a lane label in timeline diagrams. */
export function Pill({ t, children }: { t: Tone; children: ReactNode }) {
  return <span className="inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold"
    style={{ borderColor: tone(t), background: toneBg(t, 14), color: 'var(--text)' }}>{children}</span>
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted">{children}</p>
}
