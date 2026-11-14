import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Shared building blocks and the shared dataset for the f1 (Getting Started) visualizers.
 * Colours come only from kit tones and CSS variables, so both themes work. */

export type Cell = string | number | boolean | null

export interface Product { id: number; name: string; category: 'home' | 'kitchen' | 'office'; price: number; stock: number | null }

/** The module's running example: a small shop catalog. Two rows have an unknown (NULL) stock; two prices tie at 15.00. */
export const PRODUCTS: Product[] = [
  { id: 1, name: 'Desk lamp', category: 'home', price: 24, stock: 12 },
  { id: 2, name: 'Coffee mug', category: 'kitchen', price: 9.5, stock: 40 },
  { id: 3, name: 'Chef knife', category: 'kitchen', price: 45, stock: 0 },
  { id: 4, name: 'Wool blanket', category: 'home', price: 60, stock: 5 },
  { id: 5, name: 'Teapot', category: 'kitchen', price: 18, stock: null },
  { id: 6, name: 'Notebook', category: 'office', price: 4.5, stock: 120 },
  { id: 7, name: 'Desk chair', category: 'office', price: 150, stock: 3 },
  { id: 8, name: 'Pen set', category: 'office', price: 15, stock: null },
  { id: 9, name: 'Plant pot', category: 'home', price: 15, stock: 25 },
]

/** SQL that creates the same table in a playground. */
export const PRODUCTS_SQL = `CREATE TABLE products (
  id       int PRIMARY KEY,
  name     text NOT NULL,
  category text NOT NULL,
  price    numeric(8,2) NOT NULL,
  stock    int            -- NULL means "not counted yet"
);
INSERT INTO products (id, name, category, price, stock) VALUES
  (1, 'Desk lamp',    'home',     24.00,   12),
  (2, 'Coffee mug',   'kitchen',   9.50,   40),
  (3, 'Chef knife',   'kitchen',  45.00,    0),
  (4, 'Wool blanket', 'home',     60.00,    5),
  (5, 'Teapot',       'kitchen',  18.00, NULL),
  (6, 'Notebook',     'office',    4.50,  120),
  (7, 'Desk chair',   'office',  150.00,    3),
  (8, 'Pen set',      'office',   15.00, NULL),
  (9, 'Plant pot',    'home',     15.00,   25);`

/** numeric(8,2) display. */
export const money = (n: number) => n.toFixed(2)

/** Renders a SQL value: NULL is a muted italic marker, booleans print as PostgreSQL does (t / f in psql, true / false here). */
export function Val({ v }: { v: Cell }) {
  if (v === null) return <span className="text-muted italic">NULL</span>
  return <>{String(v)}</>
}

export interface ResultRow { key: string; cells: Cell[]; t?: Tone; dim?: boolean; strike?: boolean; note?: string }

/** A compact result grid whose rows animate in, out and into new positions. */
export function ResultTable({ fields, rows, empty = '(0 rows)', caption, hiCols = [] }: {
  fields: string[]; rows: ResultRow[]; empty?: string; caption?: ReactNode; hiCols?: number[]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
      {caption && <div className="border-b border-line px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">{caption}</div>}
      <table className="w-full border-collapse font-mono text-[12px]">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            {fields.map((f, i) => (
              <th key={f + i} className="px-2.5 py-1 font-semibold whitespace-nowrap" style={hiCols.includes(i) ? { color: tone.text('new') } : undefined}>{f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.tr key={r.key} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: r.dim ? 0.4 : 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} className="border-b border-line last:border-0" title={r.note}
                style={r.t ? { background: toneBg(r.t, 14), boxShadow: `inset 3px 0 0 ${tone(r.t)}` } : undefined}>
                {r.cells.map((c, i) => (
                  <td key={i} className={`px-2.5 py-1 whitespace-nowrap ${r.strike ? 'line-through' : ''}`}><Val v={c} /></td>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
          {rows.length === 0 && <tr><td colSpan={fields.length} className="px-2.5 py-1.5 text-muted italic">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

export interface SqlLine { text: string; t?: Tone; badge?: string }

/** A SQL card. Pass a string, or lines with optional highlight tones and a small badge (such as the run order). */
export function Sql({ children, lines, className = '' }: { children?: string; lines?: SqlLine[]; className?: string }) {
  const ls: SqlLine[] = lines ?? (children ?? '').split('\n').map((text) => ({ text }))
  return (
    <pre className={`overflow-x-auto rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[12px] leading-relaxed scrollbar-thin ${className}`}>
      {ls.map((l, i) => (
        <motion.div key={i} className="-mx-1.5 flex items-center gap-2 rounded px-1.5 whitespace-pre" initial={false}
          animate={{ backgroundColor: l.t && l.t !== 'muted' ? toneBg(l.t, 22) : 'rgba(0,0,0,0)' }} transition={{ duration: 0.3 }}>
          {l.badge !== undefined && (
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={l.badge.trim() ? { background: l.t && l.t !== 'muted' ? tone(l.t) : 'var(--border)', color: l.t && l.t !== 'muted' ? 'var(--bg)' : 'var(--muted)' } : undefined}>{l.badge}</span>
          )}
          <span style={l.t === 'muted' ? { color: 'var(--muted)' } : undefined}>{l.text || ' '}</span>
        </motion.div>
      ))}
    </pre>
  )
}

/** A labelled number tile. */
export function Stat({ label, value, t }: { label: string; value: ReactNode; t?: Tone }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3, y: 2 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-lg font-bold" style={t ? { color: tone.text(t) } : undefined}>{value}</motion.p>
    </div>
  )
}

export function Btn({ children, onClick, primary, testid, disabled, active }: {
  children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean; active?: boolean
}) {
  const cls = primary
    ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-40'
    : `rounded-lg border px-2.5 py-1 font-mono text-[11.5px] transition disabled:opacity-40 ${active ? 'border-accent text-ink' : 'border-line text-muted hover:border-accent hover:text-ink'}`
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled} className={cls}
      style={active && !primary ? { background: toneBg('accent', 14) } : undefined}>{children}</button>
  )
}

/** Three-valued logic badge: true / false / NULL. */
export function Tri({ v }: { v: boolean | null }) {
  const t: Tone = v === null ? 'header' : v ? 'ok' : 'dead'
  return <span className="inline-block min-w-[3.2em] rounded px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold" style={{ background: toneBg(t, 22), color: tone.text(t) }}>{v === null ? 'NULL' : String(v)}</span>
}

/** A one-line status message area that cross-fades when its text changes. */
export function Note({ children, k, t }: { children: ReactNode; k: string; t?: Tone }) {
  return (
    <div className="min-h-[44px] rounded-lg border px-3 py-2 text-sm" aria-live="polite"
      style={{ borderColor: t ? tone(t) : 'var(--border)', background: t ? toneBg(t, 10) : 'var(--surface-2)' }}>
      <AnimatePresence mode="wait">
        <motion.div key={k} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>{children}</motion.div>
      </AnimatePresence>
    </div>
  )
}
