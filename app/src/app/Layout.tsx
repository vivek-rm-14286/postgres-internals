import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BookMarked, Check, ChevronDown, FlaskConical, Menu, Monitor, Moon, Sun, X } from 'lucide-react'
import { LESSONS, TRACKS, modulesIn, lessonsIn, lessonPath } from '../lessons'
import { useProgress } from './progress'
import { setThemeMode, useTheme } from './theme'

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [loc.pathname])
  const done = useProgress()
  const total = LESSONS.length
  const pct = total ? Math.round((LESSONS.filter((l) => done.has(l.slug)).length / total) * 100) : 0

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur">
        <button className="rounded-md p-1.5 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <img src="./favicon.svg" alt="" className="size-6" /> <span className="hidden sm:inline">Postgres, Visualized</span><span className="sm:hidden">PG Visualized</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <Link to="/cookbook" className="hidden items-center gap-1.5 text-sm text-muted hover:text-ink sm:flex"><FlaskConical className="size-4" /> Cookbook</Link>
          <Link to="/reference" className="hidden items-center gap-1.5 text-sm text-muted hover:text-ink sm:flex"><BookMarked className="size-4" /> Reference</Link>
          <div className="hidden items-center gap-2 md:flex" title={`${pct}% of lessons complete`}>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-ok transition-all" style={{ width: `${pct}%` }} /></div>
            <span className="font-mono text-xs text-muted">{pct}%</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex">
        <aside className={`fixed inset-y-0 top-14 z-20 w-80 shrink-0 overflow-y-auto border-r border-line bg-bg scrollbar-thin transition-transform lg:sticky lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </aside>
        {open && <div className="fixed inset-0 top-14 z-10 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

function Sidebar() {
  const done = useProgress()
  const loc = useLocation()
  const current = loc.pathname.split('/')[1]
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  return (
    <nav className="px-3 py-4" aria-label="Curriculum">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Link to="/cookbook" className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-[13px] font-semibold hover:border-accent"><FlaskConical className="size-4 text-accent" /> Cookbook</Link>
        <Link to="/reference" className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-[13px] font-semibold hover:border-accent"><BookMarked className="size-4 text-accent" /> Reference</Link>
      </div>
      {TRACKS.map((t) => (
        <div key={t.id} className="mb-3">
          <p className="px-2 pt-2 pb-1 text-[11px] font-bold tracking-wider text-muted uppercase">{t.title}</p>
          {modulesIn(t.id).map((m) => {
            const ls = lessonsIn(m.id)
            const n = ls.filter((l) => done.has(l.slug)).length
            const isOpen = expanded[m.id] ?? current === m.id
            return (
              <div key={m.id} className="mb-0.5">
                <button onClick={() => setExpanded((e) => ({ ...e, [m.id]: !isOpen }))} className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-surface-2" aria-expanded={isOpen}>
                  <span className="mt-0.5 flex h-6 min-w-7 shrink-0 items-center justify-center rounded-md bg-accent-soft px-1 font-mono text-[11px] font-bold text-accent">{m.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug font-semibold">{m.title}</span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full bg-ok transition-all" style={{ width: ls.length ? `${(n / ls.length) * 100}%` : 0 }} /></span>
                      <span className="font-mono text-[10px] text-muted">{n}/{ls.length}</span>
                    </span>
                  </span>
                  <ChevronDown className={`mt-1 size-4 shrink-0 text-muted transition ${isOpen ? '' : '-rotate-90'}`} />
                </button>
                {isOpen && (
                  <ol className="mt-0.5 mb-2 ml-5 border-l border-line">
                    {ls.map((l) => (
                      <li key={l.slug}>
                        <NavLink to={lessonPath(l)} className={({ isActive }) => `-ml-px flex items-center gap-2 border-l-2 py-1.5 pr-2 pl-3 text-[13px] leading-snug ${isActive ? 'border-accent font-semibold text-accent' : 'border-transparent text-muted hover:text-ink'}`}>
                          <span className="flex-1">{l.title}</span>
                          {done.has(l.slug) && <Check className="size-3.5 shrink-0 text-ok" aria-label="completed" />}
                        </NavLink>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function ThemeToggle() {
  const { mode } = useTheme()
  const next = mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system'
  const Icon = mode === 'system' ? Monitor : mode === 'dark' ? Moon : Sun
  return (
    <button onClick={() => setThemeMode(next)} className="rounded-md p-1.5 text-muted hover:text-ink" aria-label={`Theme: ${mode}. Switch to ${next}`} title={`Theme: ${mode}`}>
      <Icon className="size-4.5" />
    </button>
  )
}
