import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Small building blocks shared by the m3 visualizers. Colours come only from kit tones / CSS variables. */

export type Cell = string | number | null

/** Renders a SQL cell: NULL is shown as a muted, italic marker so NULL-extended rows are obvious. */
export function Val({ v }: { v: Cell }) {
  if (v === null) return <span className="text-muted italic">NULL</span>
  return <>{String(v)}</>
}

export interface ResultRow { key: string; cells: Cell[]; t?: Tone; note?: string; dim?: boolean }

/** A compact result grid whose rows animate in and out. */
export function ResultTable({ fields, rows, empty = '(0 rows)', caption }: { fields: string[]; rows: ResultRow[]; empty?: string; caption?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
      {caption && <div className="border-b border-line px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">{caption}</div>}
      <table className="w-full border-collapse font-mono text-[12px]">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            {fields.map((f) => <th key={f} className="px-2.5 py-1 font-semibold whitespace-nowrap">{f}</th>)}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.tr key={r.key} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: r.dim ? 0.45 : 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }} className="border-b border-line last:border-0"
                style={r.t ? { background: toneBg(r.t, 14), boxShadow: `inset 3px 0 0 ${tone(r.t)}` } : undefined} title={r.note}>
                {r.cells.map((c, i) => <td key={i} className="px-2.5 py-1 whitespace-nowrap"><Val v={c} /></td>)}
              </motion.tr>
            ))}
          </AnimatePresence>
          {rows.length === 0 && <tr><td colSpan={fields.length} className="px-2.5 py-1.5 text-muted italic">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

/** Monospace SQL snippet with a subtle frame. */
export function Sql({ children, className = '' }: { children: string; className?: string }) {
  return <pre className={`overflow-x-auto rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[12px] leading-relaxed whitespace-pre scrollbar-thin ${className}`}>{children}</pre>
}

/** A labelled number tile, as in the reference lessons. */
export function Stat({ label, value, t }: { label: string; value: ReactNode; t?: Tone }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-mono text-lg font-bold" style={t ? { color: tone.text(t) } : undefined}>{value}</motion.p>
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

/** Three-valued logic badge: true / false / NULL. */
export function Tri({ v }: { v: boolean | null }) {
  const t: Tone = v === null ? 'header' : v ? 'ok' : 'dead'
  return <span className="inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold" style={{ background: toneBg(t, 22), color: tone.text(t) }}>{v === null ? 'NULL' : String(v)}</span>
}
