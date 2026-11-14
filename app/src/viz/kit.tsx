import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/**
 * Small, shared building blocks for visualizers. Colours come from semantic tokens
 * (header / pointer / tuple / dead / new / free / ok) so every diagram reads the same way in both themes.
 */
export type Tone = 'header' | 'pointer' | 'tuple' | 'dead' | 'new' | 'free' | 'ok' | 'muted' | 'accent'

const toneVar: Record<Tone, string> = {
  header: 'var(--c-header)', pointer: 'var(--c-pointer)', tuple: 'var(--c-tuple)', dead: 'var(--c-dead)',
  new: 'var(--c-new)', free: 'var(--c-free)', ok: 'var(--c-ok)', muted: 'var(--muted)', accent: 'var(--accent)',
}
/** Text shade of a tone: darker than the fill in light mode so small text stays readable (4.5:1). */
const toneTextVar: Record<Tone, string> = { ...toneVar, pointer: 'var(--t-pointer)', tuple: 'var(--t-tuple)', dead: 'var(--t-dead)', new: 'var(--t-new)', ok: 'var(--t-ok)' }
/** `tone(t)` is the fill / border colour; `tone.text(t)` is the same hue for text. */
export const tone = Object.assign((t: Tone) => toneVar[t], { text: (t: Tone) => toneTextVar[t] })
/** Translucent fill for a tone. */
export const toneBg = (t: Tone, pct = 16) => (t === 'free' ? 'var(--c-free)' : `color-mix(in srgb, ${toneVar[t]} ${pct}%, transparent)`)

/** A labelled block (tuple, buffer, page, process…). Animates position and colour changes. */
export function Block({ t = 'tuple', children, className = '', layoutId, dim, pulse, title }: {
  t?: Tone; children: ReactNode; className?: string; layoutId?: string; dim?: boolean; pulse?: boolean; title?: string
}) {
  return (
    <motion.div layout layoutId={layoutId} title={title}
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: dim ? 0.4 : 1, scale: pulse ? [1, 1.04, 1] : 1 }}
      transition={{ duration: 0.35 }}
      className={`rounded-md border px-2 py-1 font-mono text-[12px] leading-tight ${className}`}
      style={{ borderColor: tone(t), background: toneBg(t), color: 'var(--text)' }}>
      {children}
    </motion.div>
  )
}

export function Tag({ t = 'accent', children }: { t?: Tone; children: ReactNode }) {
  return <span className="inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-medium" style={{ background: toneBg(t, 20), color: tone.text(t) }}>{children}</span>
}

/** Colour key. Every visualizer with more than two colours shows one. */
export function Legend({ items }: { items: [Tone, string][] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map(([t, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border" style={{ borderColor: tone(t), background: toneBg(t, 30) }} />{label}
        </span>
      ))}
    </div>
  )
}

/** Toggle group for switching a visualizer's mode (e.g. HOT vs non-HOT). */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-xs">
      {options.map(([v, l]) => (
        <button key={v} role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1 transition ${value === v ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'}`}>{l}</button>
      ))}
    </div>
  )
}

/** Monospace key/value table, used for struct fields and catalog rows. */
export function FieldTable({ rows, highlight }: { rows: [string, ReactNode, string?][]; highlight?: string }) {
  return (
    <table className="w-full border-collapse font-mono text-[12px]">
      <tbody>
        {rows.map(([k, v, note]) => (
          <tr key={k} className="border-b border-line last:border-0" style={highlight === k ? { background: toneBg('new', 18) } : undefined}>
            <td className="py-1 pr-3 font-semibold whitespace-nowrap">{k}</td>
            <td className="py-1 pr-3">{v}</td>
            {note !== undefined && <td className="py-1 font-sans text-muted">{note}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Horizontal panel used to frame a visual region with a small caption. */
export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-surface p-3 ${className}`}>
      {title && <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">{title}</p>}
      {children}
    </div>
  )
}
