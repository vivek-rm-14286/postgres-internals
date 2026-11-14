import { useEffect, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Minimize2, MoveHorizontal } from 'lucide-react'

/**
 * Frames a lesson visualizer. On narrow screens wide diagrams scroll inside the card (never the page), with a hint,
 * and an Expand button opens the same visualizer full-screen — in landscape it usually fits without scrolling.
 */
export function VizFrame({ Component, title }: { Component: ComponentType; title: string }) {
  const [full, setFull] = useState(false)
  useEffect(() => {
    if (!full) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [full])

  const toggle = (
    <button type="button" onClick={() => setFull((f) => !f)} aria-label={full ? 'Exit full screen' : 'Expand visualizer to full screen'}
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted hover:text-ink">
      {full ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />} {full ? 'Close' : 'Expand'}
    </button>
  )

  if (full) {
    return (
      <>
        <div className="rounded-xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">Showing full screen… {toggle}</div>
        {createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label={title}>
            <div className="flex items-center gap-3 border-b border-line px-4 py-2">
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
              <span className="hidden text-xs text-muted portrait:inline sm:portrait:hidden">Rotate for more room</span>
              {toggle}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5" data-testid="visualizer"><Component /></div>
          </div>,
          document.body,
        )}
      </>
    )
  }

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-end gap-2">
        <span className="flex items-center gap-1 text-[11px] text-muted sm:hidden"><MoveHorizontal className="size-3.5" /> wide visuals scroll sideways</span>
        {toggle}
      </div>
      <div className="min-w-0 overflow-x-auto rounded-xl border border-line bg-surface p-3 scrollbar-thin sm:p-5" data-testid="visualizer"><Component /></div>
    </div>
  )
}
