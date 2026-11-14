import { useEffect, useState } from 'react'

type Mode = 'light' | 'dark' | 'system'

function systemDark() { return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches }

function read(): Mode {
  try { const t = localStorage.getItem('theme'); return t === 'light' || t === 'dark' ? t : 'system' } catch { return 'system' }
}

const listeners = new Set<() => void>()

export function setThemeMode(m: Mode) {
  try { if (m === 'system') localStorage.removeItem('theme'); else localStorage.setItem('theme', m) } catch { /* private mode */ }
  if (m === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = m
  listeners.forEach((l) => l())
}

export function useTheme() {
  const [mode, setMode] = useState<Mode>(read)
  const [sys, setSys] = useState(systemDark)
  useEffect(() => {
    const l = () => setMode(read())
    listeners.add(l)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMq = () => setSys(mq.matches)
    mq.addEventListener('change', onMq)
    return () => { listeners.delete(l); mq.removeEventListener('change', onMq) }
  }, [])
  return { mode, dark: mode === 'dark' || (mode === 'system' && sys) }
}
