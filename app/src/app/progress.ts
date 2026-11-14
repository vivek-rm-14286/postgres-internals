import { useEffect, useState } from 'react'

// Per-viewer progress tracker. localStorage only; the site works fully without it.
const KEY = 'pgi-progress-v1'
const listeners = new Set<() => void>()

function load(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]) } catch { return new Set() }
}
let done = load()

export function setDone(slug: string, value: boolean) {
  done = new Set(done)
  if (value) done.add(slug); else done.delete(slug)
  try { localStorage.setItem(KEY, JSON.stringify([...done])) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

export function useProgress() {
  const [, tick] = useState(0)
  useEffect(() => { const l = () => tick((n) => n + 1); listeners.add(l); return () => { listeners.delete(l) } }, [])
  return done
}
