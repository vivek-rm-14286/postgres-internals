import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Md } from '../../lesson/Md'

/** Small shared pieces for the f2 visualizers. */

export function Stat({ k, v, t }: { k: string; v: ReactNode; t?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{k}</p>
      <motion.p key={String(v)} initial={{ opacity: 0.3, y: -3 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-lg font-bold break-all" style={t ? { color: t } : undefined}>{v}</motion.p>
    </div>
  )
}

export function Btn({ children, onClick, primary, testid, active, disabled }: {
  children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; active?: boolean; disabled?: boolean
}) {
  const cls = primary
    ? 'bg-accent text-on-accent'
    : active ? 'border border-accent text-ink bg-accent-soft' : 'border border-line text-muted hover:text-ink hover:border-accent'
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${cls}`}>{children}</button>
  )
}

/** A one-line SQL call and its result, as psql would show it. */
export function SqlLine({ sql, result, error }: { sql: string; result?: string; error?: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[12.5px] leading-relaxed [font-variant-ligatures:none]">
      <p className="whitespace-pre-wrap break-all text-ink"><span className="text-muted select-none">=&gt; </span>{sql}</p>
      <motion.p key={(result ?? '') + (error ?? '')} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
        className="whitespace-pre-wrap break-all" style={{ color: error ? 'var(--t-dead)' : 'var(--t-ok)' }}>
        {error ? `ERROR:  ${error}` : result}
      </motion.p>
    </div>
  )
}

export function Note({ children }: { children: string }) {
  return (
    <div className="min-h-[48px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
      <motion.p key={children} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Md>{children}</Md></motion.p>
    </div>
  )
}
