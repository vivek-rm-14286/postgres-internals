import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Small helpers shared by the m2 visualizers. Not a lesson. */

export interface Seg {
  /** stable key (used for layout animation) */
  id: string
  label: string
  bytes: number
  t: Tone
  /** padding is drawn hatched */
  pad?: boolean
  /** small text under the label, e.g. the value */
  sub?: string
}

/**
 * A byte map: segments laid out on rows of `perRow` bytes, like a hex dump.
 * A segment that crosses a row boundary is split into pieces. Byte offsets are printed on the left.
 */
export function ByteGrid({ segs, perRow = 8, cell = 52, selected, onSelect, startOffset = 0 }: {
  segs: Seg[]; perRow?: number; cell?: number; selected?: string; onSelect?: (id: string) => void; startOffset?: number
}) {
  const pieces: { seg: Seg; row: number; col: number; span: number; first: boolean; k: number }[] = []
  let off = 0
  for (const s of segs) {
    let left = s.bytes, k = 0
    while (left > 0) {
      const row = Math.floor(off / perRow), col = off % perRow
      const span = Math.min(left, perRow - col)
      pieces.push({ seg: s, row, col, span, first: k === 0, k })
      off += span; left -= span; k++
    }
  }
  const rows = Math.max(1, Math.ceil(off / perRow))
  return (
    <div className="flex gap-2">
      <div className="grid shrink-0 font-mono text-[10px] text-muted" style={{ gridTemplateRows: `repeat(${rows}, 34px)`, rowGap: 3 }}>
        {Array.from({ length: rows }, (_, r) => <span key={r} className="flex items-center justify-end tabular-nums">{startOffset + r * perRow}</span>)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${perRow}, ${cell}px)`, gridAutoRows: '34px', gap: 3 }}>
        {pieces.map((p) => {
          const sel = selected === p.seg.id
          return (
            <motion.button type="button" layout key={`${p.seg.id}-${p.k}`} onClick={() => onSelect?.(p.seg.id)}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              title={`${p.seg.label}: ${p.seg.bytes} byte${p.seg.bytes === 1 ? '' : 's'}`}
              className="relative overflow-hidden rounded border text-left"
              style={{
                gridRow: p.row + 1, gridColumn: `${p.col + 1} / span ${p.span}`,
                borderColor: tone(p.seg.t), borderWidth: sel ? 2 : 1,
                background: p.seg.pad
                  ? `repeating-linear-gradient(135deg, ${toneBg(p.seg.t, 30)} 0 4px, transparent 4px 8px)`
                  : toneBg(p.seg.t, sel ? 30 : 18),
              }}>
              {(p.first || p.span >= 3) && (
                <span className="absolute inset-x-1 top-0.5 truncate font-mono text-[10px] leading-tight font-semibold" style={{ color: 'var(--text)' }}>
                  {p.first ? p.seg.label : '…'}
                </span>
              )}
              {p.first && p.seg.sub && p.span * cell >= 40 && (
                <span className="absolute inset-x-1 bottom-0.5 truncate font-mono text-[10px] leading-tight text-muted">{p.seg.sub}</span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/** Row of numeric stat tiles (as in the btree reference lesson). */
export function Stats({ items }: { items: [string, ReactNode, Tone?][] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([k, v, t]) => (
        <div key={k} className="rounded-lg border border-line bg-surface-2 px-3 py-2">
          <p className="text-[11px] tracking-wide text-muted uppercase">{k}</p>
          <motion.p key={String(v)} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-mono text-lg font-bold" style={t ? { color: tone.text(t) } : undefined}>{v}</motion.p>
        </div>
      ))}
    </div>
  )
}

export function Btn({ children, onClick, primary, testid, disabled, active }: { children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled}
      className={primary
        ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-40'
        : `rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${active ? 'border-accent text-accent' : 'border-line hover:border-accent'}`}>
      {children}
    </button>
  )
}

/** Message strip under the controls, animated on change. */
export function Note({ children, k }: { children: ReactNode; k: string }) {
  return (
    <div className="min-h-[48px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
      <motion.div key={k} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>{children}</motion.div>
    </div>
  )
}
