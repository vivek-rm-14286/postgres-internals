import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { Md } from '../lesson/Md'

export interface Step<S = unknown> {
  /** Short label, e.g. "UPDATE id=2". */
  title: string
  /** One or two sentences explaining what changed in this step. Inline markup allowed. */
  body: string
  /** Arbitrary state the renderer draws for this step. */
  state: S
}

interface Props<S> {
  steps: Step<S>[]
  render: (state: S, index: number) => ReactNode
  /** ms per step when playing. */
  interval?: number
  /** Optional controls rendered on the right of the toolbar (toggles, selects). */
  extra?: ReactNode
}

/** Step-through animation shell used by most visualizers: play / pause / prev / next / scrub, plus a caption. */
export function Stepper<S>({ steps, render, interval = 2200, extra }: Props<S>) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const last = steps.length - 1

  useEffect(() => { if (i > last) setI(0) }, [last, i])
  useEffect(() => {
    if (!playing) return
    if (i >= last) { setPlaying(false); return }
    const t = setTimeout(() => setI((n) => Math.min(n + 1, last)), interval)
    return () => clearTimeout(t)
  }, [playing, i, last, interval])

  const step = steps[Math.min(i, last)]
  return (
    <div className="flex flex-col gap-3" data-testid="stepper">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-line bg-surface">
          <IconBtn label="Restart" onClick={() => { setI(0); setPlaying(false) }}><RotateCcw className="size-4" /></IconBtn>
          <IconBtn label="Previous step" onClick={() => { setPlaying(false); setI((n) => Math.max(0, n - 1)) }} disabled={i === 0}><ChevronLeft className="size-4" /></IconBtn>
          <IconBtn label={playing ? 'Pause' : 'Play'} onClick={() => { if (i >= last) setI(0); setPlaying((p) => !p) }}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </IconBtn>
          <IconBtn label="Next step" testid="viz-next" onClick={() => { setPlaying(false); setI((n) => Math.min(last, n + 1)) }} disabled={i === last}><ChevronRight className="size-4" /></IconBtn>
        </div>
        <input type="range" min={0} max={last} value={i} onChange={(e) => { setPlaying(false); setI(+e.target.value) }}
          className="min-w-24 flex-1 accent-[var(--accent)]" aria-label="Scrub through steps" />
        <span className="font-mono text-xs text-muted tabular-nums">{i + 1}/{steps.length}</span>
        {extra}
      </div>

      <div className="min-h-[64px] rounded-lg border border-line bg-surface-2 px-4 py-2.5">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}>
            <p className="text-sm font-semibold"><span className="mr-2 font-mono text-accent">{String(i + 1).padStart(2, '0')}</span>{step.title}</p>
            <p className="mt-0.5 text-sm text-muted"><Md>{step.body}</Md></p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="overflow-x-auto scrollbar-thin">{render(step.state, i)}</div>
    </div>
  )
}

function IconBtn({ children, label, onClick, disabled, testid }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean; testid?: string }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} data-testid={testid}
      className="p-2 text-muted hover:text-ink disabled:opacity-30">{children}</button>
  )
}
