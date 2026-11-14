import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* Small building blocks shared by the f4 visualizers. Colours come only from kit tones and CSS variables. */

/** Monospace fonts with ligatures turn `->` and `>=` into arrows; SQL must show the characters typed. */
export const NO_LIG = { fontVariantLigatures: 'none' } as const

export type Cell = string | number | null

export function Val({ v }: { v: Cell }) {
  if (v === null) return <span className="text-muted italic">NULL</span>
  return <>{String(v)}</>
}

export interface ResultRow { key: string; cells: Cell[]; t?: Tone; note?: string; dim?: boolean }

/** A compact result grid whose rows animate in and out. */
export function ResultTable({ fields, rows, empty = '(0 rows)', caption, compact }: {
  fields: string[]; rows: ResultRow[]; empty?: string; caption?: ReactNode; compact?: boolean
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
      {caption && <div className="border-b border-line px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">{caption}</div>}
      <table className={`w-full border-collapse font-mono ${compact ? 'text-[11px]' : 'text-[12px]'}`} style={NO_LIG}>
        <thead>
          <tr className="border-b border-line text-left text-muted">
            {fields.map((f) => <th key={f} className="px-2 py-1 font-semibold whitespace-nowrap">{f}</th>)}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.tr key={r.key} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: r.dim ? 0.45 : 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }} className="border-b border-line last:border-0"
                style={r.t ? { background: toneBg(r.t, 14), boxShadow: `inset 3px 0 0 ${tone(r.t)}` } : undefined} title={r.note}>
                {r.cells.map((c, i) => <td key={i} className="px-2 py-0.5 whitespace-nowrap"><Val v={c} /></td>)}
              </motion.tr>
            ))}
          </AnimatePresence>
          {rows.length === 0 && <tr><td colSpan={fields.length} className="px-2 py-1.5 text-muted italic">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

/** Monospace SQL snippet with a subtle frame. */
export function Sql({ children, className = '' }: { children: string; className?: string }) {
  return <pre style={NO_LIG} className={`overflow-x-auto rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[11.5px] leading-relaxed whitespace-pre scrollbar-thin ${className}`}>{children}</pre>
}

/** A labelled number tile. */
export function Stat({ label, value, t, sub }: { label: string; value: ReactNode; t?: Tone; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3, y: 2 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-lg font-bold tabular-nums" style={t ? { color: tone.text(t) } : undefined}>{value}</motion.p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

export function Btn({ children, onClick, primary, testid, disabled }: { children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled}
      className={primary
        ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-40'
        : 'rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent disabled:opacity-40'}>
      {children}
    </button>
  )
}

/** Animated caption box for live (non-Stepper) visualizers. */
export function Caption({ k, text }: { k: string; text: string }) {
  return (
    <div className="min-h-[56px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.p key={k} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}><Md>{text}</Md></motion.p>
      </AnimatePresence>
    </div>
  )
}

/** An EXPLAIN plan rendered line by line; lines matching `flag` patterns are highlighted with a tone. */
export function PlanBox({ lines, marks = {} }: { lines: string[]; marks?: Record<number, Tone> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface-2 py-1.5 scrollbar-thin" style={NO_LIG}>
      {lines.map((l, i) => {
        const t = marks[i]
        return (
          <motion.div key={i + l} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="px-3 font-mono text-[11.5px] leading-relaxed whitespace-pre"
            style={t ? { background: toneBg(t, 18), boxShadow: `inset 3px 0 0 ${tone(t)}` } : undefined}>{l}</motion.div>
        )
      })}
    </div>
  )
}
