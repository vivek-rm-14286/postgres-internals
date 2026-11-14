import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tone, type Tone } from '../../viz/kit'

/** Small local primitives shared by the m1 visualizers. No lesson export here. */

export function Btn({ children, onClick, primary, disabled, testid, title, t }: {
  children: ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean; testid?: string; title?: string; t?: Tone
}) {
  const style = t && !primary ? { borderColor: tone(t), color: tone(t) } : undefined
  return (
    <button type="button" onClick={onClick} disabled={disabled} data-testid={testid} title={title} style={style}
      className={primary
        ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40'
        : 'rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent disabled:opacity-40'}>
      {children}
    </button>
  )
}

export function Stat({ label, value, t }: { label: string; value: ReactNode; t?: Tone }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-mono text-lg font-bold"
        style={t ? { color: tone(t) } : undefined}>{value}</motion.p>
    </div>
  )
}

/** Monospace SVG text with sane defaults. */
export function T({ x, y, children, size = 11, w = 400, fill = 'var(--text)', anchor = 'start', mono = true }: {
  x: number; y: number; children: ReactNode; size?: number; w?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean
}) {
  return <text x={x} y={y} fontSize={size} fontWeight={w} fill={fill} textAnchor={anchor} fontFamily={mono ? 'var(--font-mono)' : 'var(--font-sans)'}>{children}</text>
}

export const fmtBytes = (n: number) =>
  n >= 1 << 20 ? `${(n / (1 << 20)).toFixed(n >= 10 << 20 ? 0 : 1)} MB` : n >= 1024 ? `${(n / 1024).toFixed(0)} kB` : `${n} B`
