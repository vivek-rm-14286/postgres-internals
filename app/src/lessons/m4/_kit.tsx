import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Md } from '../../lesson/Md'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Small local building blocks shared by the m4 visualizers. Not a lesson file. */

export function Tiles({ items }: { items: [string, ReactNode, Tone?][] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([k, v, t]) => (
        <div key={k} className="rounded-lg border border-line bg-surface-2 px-3 py-2">
          <p className="text-[11px] tracking-wide text-muted uppercase">{k}</p>
          <motion.p key={String(v)} initial={{ opacity: 0.3, y: 2 }} animate={{ opacity: 1, y: 0 }}
            className="font-mono text-lg font-bold tabular-nums" style={t ? { color: tone.text(t) } : undefined}>{v}</motion.p>
        </div>
      ))}
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

/** Animated one-line explanation under a live simulation. */
export function Msg({ k, text }: { k: string | number; text: string }) {
  return (
    <div className="min-h-[56px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.p key={k} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}>
          <Md>{text}</Md>
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

export function Slider({ label, value, min, max, step = 1, onChange, show }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; show: ReactNode
}) {
  return (
    <label className="flex min-w-[220px] flex-1 items-center gap-2 text-xs">
      <span className="whitespace-nowrap text-muted">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)}
        className="min-w-20 flex-1 accent-[var(--accent)]" aria-label={label} />
      <span className="min-w-14 text-right font-mono font-semibold tabular-nums">{show}</span>
    </label>
  )
}

const lineTone = (l: string): Tone | null => {
  if (/Rows Removed|external merge|Disk:|Batches: [2-9]|Heap Fetches: [1-9]|temp (read|written)|lossy/.test(l)) return 'dead'
  if (/Index Cond|Index Only Scan|Heap Fetches: 0|Order By/.test(l)) return 'ok'
  if (/Filter:|Recheck Cond/.test(l)) return 'new'
  if (/Buffers:|Index Searches/.test(l)) return 'pointer'
  return null
}

/** EXPLAIN text with the lines that matter tinted. */
export function PlanText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <pre className={`overflow-x-auto rounded-lg border border-line bg-code p-3 font-mono text-[11.5px] leading-relaxed scrollbar-thin ${className}`}>
      {text.split('\n').map((l, i) => {
        const t = lineTone(l)
        return <div key={i} style={t ? { color: tone.text(t), background: toneBg(t, 8) } : undefined}>{l || ' '}</div>
      })}
    </pre>
  )
}

/** Horizontal bar used for comparing costs or sizes. */
export function Bar({ label, value, max, t, note, win }: { label: ReactNode; value: number; max: number; t: Tone; note?: ReactNode; win?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(90px,150px)_1fr_auto] items-center gap-2 text-xs">
      <span className="truncate font-mono" style={win ? { color: tone.text(t), fontWeight: 700 } : undefined}>{label}</span>
      <div className="h-4 overflow-hidden rounded bg-surface-2">
        <motion.div className="h-full rounded" initial={false} animate={{ width: `${Math.max(1.5, Math.min(100, (value / max) * 100))}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 22 }} style={{ background: win ? tone(t) : toneBg(t, 45) }} />
      </div>
      <span className="min-w-16 text-right font-mono tabular-nums">{note ?? value}</span>
    </div>
  )
}
