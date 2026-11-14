import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Small helpers shared by the e2 (TimescaleDB) visualizers. Not a lesson: no `lesson` export. */

export function Btn({ children, onClick, primary, testid, disabled, title, active }: {
  children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean; title?: string; active?: boolean
}) {
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled} title={title}
      className={primary
        ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-40'
        : `rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${active ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface hover:border-accent'}`}>
      {children}
    </button>
  )
}

export function Stat({ label, value, t, sub }: { label: string; value: ReactNode; t?: Tone; sub?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="truncate text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-mono text-lg font-bold tabular-nums"
        style={t ? { color: tone.text(t) } : undefined}>{value}</motion.p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

export function Pill({ t, children }: { t: Tone; children: ReactNode }) {
  return <span className="inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold"
    style={{ borderColor: tone(t), background: toneBg(t, 14), color: 'var(--text)' }}>{children}</span>
}

export type Edition = 'apache' | 'community' | 'cloud'
const edLabel: Record<Edition, string> = { apache: 'Apache 2 edition', community: 'Community edition only', cloud: 'Tiger Cloud only' }
const edTone: Record<Edition, Tone> = { apache: 'ok', community: 'new', cloud: 'header' }
/** Licensing badge: which TimescaleDB edition a feature needs. */
export function EditionTag({ ed }: { ed: Edition }) {
  return <span className="inline-block rounded px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap" style={{ background: toneBg(edTone[ed], 18), color: tone.text(edTone[ed]) }}>{edLabel[ed]}</span>
}

export function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded bg-code p-2 font-mono text-[11.5px] leading-snug whitespace-pre">{children}</pre>
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted">{children}</p>
}

/** Live message box with a fade between messages. */
export function Msg({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="min-h-[52px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
      <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>{children}</motion.div>
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** ms since epoch → "Mar 01 06:00" (UTC). */
export const fmtDT = (ms: number) => { const d = new Date(ms); return `${MON[d.getUTCMonth()]} ${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` }
/** ms since epoch → "06:00" (UTC). */
export const fmtHM = (ms: number) => { const d = new Date(ms); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` }
/** ms since epoch → "2026-03-01" (UTC). */
export const fmtD = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const H = 3_600_000
export const DAY = 24 * H
