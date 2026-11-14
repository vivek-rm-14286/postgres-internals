import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Shared helpers for module 6 visualizers. No lesson export here. */

/**
 * Playground helper: run one statement inside an EXCEPTION block and report the outcome as a row.
 * Lets a preset show an error message ("new row violates…") without the preset itself failing.
 */
export const TRY_SQL = `
CREATE FUNCTION try_sql(stmt text) RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  EXECUTE stmt;
  RETURN 'OK';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR ' || SQLSTATE || ': ' || SQLERRM;
END $fn$;`

/** Monospace code listing with an animated highlight bar on the active line(s). */
export function Code({ lines, active = [], dim = [], className = '', marks = {} }: {
  lines: string[]; active?: number[]; dim?: number[]; className?: string; marks?: Record<number, { t: Tone; label: string }>
}) {
  return (
    <div className={`relative overflow-x-auto rounded-lg border border-line bg-bg py-1.5 font-mono text-[12px] leading-[20px] scrollbar-thin ${className}`}>
      {lines.map((l, i) => {
        const on = active.includes(i)
        const mark = marks[i]
        return (
          <div key={i} className="relative flex items-center gap-2 px-2 whitespace-pre" style={{ opacity: dim.includes(i) ? 0.38 : 1 }}>
            {on && <motion.div layoutId={`hl-${lines.length}-${lines[0]}`} className="absolute inset-0" style={{ background: toneBg('accent', 16), borderLeft: `3px solid ${tone('accent')}` }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
            <span className="relative w-5 shrink-0 text-right text-[10.5px] text-muted select-none">{i + 1}</span>
            <span className="relative">{l || ' '}</span>
            {mark && <span className="relative ml-auto shrink-0 rounded px-1.5 text-[10.5px] font-semibold" style={{ background: toneBg(mark.t, 22), color: tone.text(mark.t) }}>{mark.label}</span>}
          </div>
        )
      })}
    </div>
  )
}

/** Stat tile in the style of the reference B-tree lesson. */
export function Tile({ label, value, t, sub }: { label: string; value: ReactNode; t?: Tone; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3, y: 2 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-lg font-bold" style={t ? { color: tone.text(t) } : undefined}>{value}</motion.p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

/** Small toggle chip (checkbox semantics). */
export function Chip({ on, onClick, children, t = 'accent', testid }: { on: boolean; onClick: () => void; children: ReactNode; t?: Tone; testid?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} data-testid={testid}
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-left text-xs transition"
      style={{ borderColor: on ? tone(t) : 'var(--border)', background: on ? toneBg(t, 14) : 'transparent', color: 'var(--text)' }}>
      <span className="grid size-3.5 shrink-0 place-items-center rounded-sm border text-[9px] font-bold" style={{ borderColor: on ? tone(t) : 'var(--muted)', background: on ? tone(t) : 'transparent', color: 'var(--bg)' }}>{on ? '✓' : ''}</span>
      {children}
    </button>
  )
}

/** A labelled row of a catalog or table, used for tiny result grids. */
export function MiniTable({ head, rows, tones }: { head: string[]; rows: ReactNode[][]; tones?: (Tone | undefined)[] }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full border-collapse font-mono text-[12px]">
        <thead><tr>{head.map((h) => <th key={h} className="border-b border-line px-2 py-1 text-left text-[11px] font-semibold text-muted">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr key={i} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-line last:border-0"
              style={tones?.[i] ? { background: toneBg(tones[i]!, 14) } : undefined}>
              {r.map((c, j) => <td key={j} className="px-2 py-1 whitespace-nowrap">{c}</td>)}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
