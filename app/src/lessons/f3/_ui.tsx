import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* Small building blocks shared by the F3 visualizers. Colours come from the semantic tokens only. */

export function Btn({ children, onClick, primary, testid, disabled, active }: {
  children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean; active?: boolean
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-testid={testid}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${primary ? 'bg-accent text-white' : active ? 'border border-accent text-accent' : 'border border-line text-ink hover:border-accent'}`}>
      {children}
    </button>
  )
}

export function Stat({ label, value, t }: { label: string; value: ReactNode; t?: Tone }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3, y: 2 }} animate={{ opacity: 1, y: 0 }}
        className={`font-mono font-bold break-words ${String(value).length > 12 ? 'text-sm' : 'text-base sm:text-lg'}`} style={t ? { color: tone(t) } : undefined}>{value}</motion.p>
    </div>
  )
}

/** A result banner: either a server error (SQLSTATE + message + detail) or a success line. */
export interface Outcome { ok: boolean; title: string; code?: string; detail?: string }
export function OutcomeBox({ o, k }: { o: Outcome | null; k: string | number }) {
  return (
    <div className="min-h-[64px]" aria-live="polite">
      <AnimatePresence mode="wait">
        {o && (
          <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: tone(o.ok ? 'ok' : 'dead'), background: toneBg(o.ok ? 'ok' : 'dead', 10) }}>
            <p className="font-mono text-[12.5px] font-semibold break-words" style={{ color: tone(o.ok ? 'ok' : 'dead') }}>
              {o.code && <span className="mr-2 rounded px-1.5 py-0.5 text-[11px]" style={{ background: toneBg(o.ok ? 'ok' : 'dead', 22) }}>{o.code}</span>}
              {o.title}
            </p>
            {o.detail && <p className="mt-1 text-[12.5px] text-muted break-words"><Md>{o.detail}</Md></p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A compact table card. Rows animate in and out; `hl` maps a row key to a highlight tone. */
export function TableCard({ name, cols, rows, hl, onRow, note, keyCols = [], fkCols = [] }: {
  name: string; cols: string[]; rows: { key: string; cells: ReactNode[] }[]; hl?: Record<string, Tone>
  onRow?: (key: string) => void; note?: string; keyCols?: number[]; fkCols?: number[]
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface">
      <div className="flex items-baseline justify-between gap-2 border-b border-line px-2.5 py-1.5">
        <span className="font-mono text-[12.5px] font-bold">{name}</span>
        {note && <span className="text-[11px] text-muted">{note}</span>}
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse font-mono text-[12px]">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              {cols.map((c, i) => (
                <th key={c} className="px-2 py-1 font-semibold whitespace-nowrap">
                  {c}{keyCols.includes(i) && <span className="ml-1" style={{ color: tone('header') }}>PK</span>}
                  {fkCols.includes(i) && <span className="ml-1" style={{ color: tone('pointer') }}>FK</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((r) => {
                const t = hl?.[r.key]
                return (
                  <motion.tr key={r.key} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.3 }} onClick={onRow ? () => onRow(r.key) : undefined}
                    className={`border-t border-line ${onRow ? 'cursor-pointer hover:bg-surface-2' : ''}`}
                    style={{ background: t ? toneBg(t, 20) : 'transparent', boxShadow: t ? `inset 3px 0 0 ${tone(t)}` : 'inset 0 0 0 transparent' }}>
                    {r.cells.map((c, i) => <td key={i} className="px-2 py-1 whitespace-nowrap">{c}</td>)}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-2 py-2 text-[12px] text-muted">(0 rows)</p>}
      </div>
    </div>
  )
}

export const Null = () => <span className="text-muted italic">NULL</span>

/** The `try()` helper used by playground presets: runs a statement and returns OK or the error, so a preset never aborts. */
export const TRY_FN = `CREATE FUNCTION try(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE d text;
BEGIN
  EXECUTE q;
  RETURN 'OK';
EXCEPTION WHEN others THEN
  GET STACKED DIAGNOSTICS d = PG_EXCEPTION_DETAIL;
  RETURN SQLSTATE || ': ' || SQLERRM || CASE WHEN d <> '' THEN ' | ' || d ELSE '' END;
END $$;`
