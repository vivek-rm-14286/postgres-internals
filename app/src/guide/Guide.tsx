import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, CircleX, Search, ShieldCheck } from 'lucide-react'
import { GUIDE_CATEGORIES, GUIDE_RULES } from './data'
import type { GuideRule, Impact } from './types'
import { Md } from '../lesson/Md'
import { LESSONS, lessonPath } from '../lessons'

const IMPACT_STYLE: Record<Impact, string> = {
  correctness: 'bg-dead/15 text-dead', performance: 'bg-new/15 text-new', availability: 'bg-tuple/15 text-tuple',
  security: 'bg-header/15 text-header', operability: 'bg-ok/15 text-ok',
}
const IMPACTS = Object.keys(IMPACT_STYLE) as Impact[]
const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1').replace(/[`*]/g, '').toLowerCase()
const titleOf = new Map(LESSONS.map((l) => [lessonPath(l), l.title]))
/** Label for a "learn more" path: the lesson title, or a readable name for Cookbook / Reference pages. */
const learnLabel = (p: string) => titleOf.get(p) ?? (p === '/cookbook' ? 'Cookbook' : p.startsWith('/reference/') ? `Reference: ${p.slice(11).replace(/-/g, ' ')}` : p)

/**
 * The Production guide: every rule on one page, filtered by category, impact and free text.
 * State lives in the URL (?c=category&i=impact&q=words&r=rule) so any view or single rule can be linked to.
 */
export function Guide() {
  const [params, setParams] = useSearchParams()
  const c = params.get('c') ?? 'all'
  const i = params.get('i') ?? 'all'
  const q = params.get('q') ?? ''
  const focus = params.get('r')
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (!v || v === 'all') next.delete(k); else next.set(k, v)
    next.delete('r')
    setParams(next, { replace: true })
  }
  useEffect(() => { document.title = 'Production guide · Postgres, Visualized' }, [])

  const haystack = useMemo(() => GUIDE_RULES.map((r) => plain([r.rule, r.why, r.avoid, r.prefer, r.unless, r.id.replace(/-/g, ' '), ...r.learn.map(learnLabel)].filter(Boolean).join(' '))), [])
  const shown = useMemo(() => {
    const words = plain(q).split(/\s+/).filter(Boolean)
    return GUIDE_RULES.filter((r, k) => (c === 'all' || r.category === c) && (i === 'all' || r.impact === i) && words.every((w) => haystack[k].includes(w)))
  }, [c, i, q, haystack])
  const byCat = GUIDE_CATEGORIES.map((cat) => ({ cat, rules: shown.filter((r) => r.category === cat.id) })).filter((g) => g.rules.length)

  // A link to one rule (?r=id) scrolls to it and marks it.
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => { if (focus) list.current?.querySelector(`#rule-${CSS.escape(focus)}`)?.scrollIntoView({ block: 'center' }) }, [focus])

  const chip = (active: boolean) => `shrink-0 rounded-full border px-3 py-1 text-[13px] ${active ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line text-muted hover:text-ink'}`
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pt-8 pb-24 sm:px-8" data-testid="guide">
      <p className="flex items-center gap-1.5 font-mono text-xs text-accent"><ShieldCheck className="size-3.5" /> Production guide</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Recommendations for production and scalable services</h1>
      <p className="mt-2 max-w-3xl text-muted">
        {GUIDE_RULES.length} rules for running PostgreSQL behind real services: what to do, what it prevents, the pattern to avoid and the one to use.
        Each rule links to the lesson that shows the mechanism.
      </p>

      <div className="mt-6 grid gap-2">
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <input value={q} onChange={(e) => set('q', e.target.value)} placeholder="Filter rules: pagination, lock_timeout…" aria-label="Filter rules" data-testid="guide-filter"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
          <span className="shrink-0 font-mono text-xs text-muted" aria-live="polite">{shown.length} of {GUIDE_RULES.length}</span>
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin" role="group" aria-label="Category">
          <button className={chip(c === 'all')} onClick={() => set('c', 'all')}>All</button>
          {GUIDE_CATEGORIES.map((cat) => <button key={cat.id} className={chip(c === cat.id)} onClick={() => set('c', cat.id)}>{cat.title}</button>)}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin" role="group" aria-label="What the rule protects">
          <button className={chip(i === 'all')} onClick={() => set('i', 'all')}>Any impact</button>
          {IMPACTS.map((im) => <button key={im} className={`${chip(i === im)} capitalize`} onClick={() => set('i', im)}>{im}</button>)}
        </div>
      </div>

      <div ref={list}>
        {byCat.map(({ cat, rules }) => (
          <section key={cat.id} className="mt-10" aria-labelledby={`cat-${cat.id}`}>
            <h2 id={`cat-${cat.id}`} className="text-2xl font-bold tracking-tight">{cat.title} <span className="font-mono text-sm font-normal text-muted">{rules.length}</span></h2>
            <p className="mt-1 text-muted"><Md>{cat.blurb}</Md></p>
            <div className="mt-4 grid gap-3">
              {rules.map((r) => <RuleCard key={r.id} r={r} marked={r.id === focus} />)}
            </div>
          </section>
        ))}
        {shown.length === 0 && <p className="mt-10 text-sm text-muted">No rule matches these filters.</p>}
      </div>
    </div>
  )
}

function RuleCard({ r, marked }: { r: GuideRule; marked: boolean }) {
  return (
    <article id={`rule-${r.id}`} className={`scroll-mt-20 rounded-xl border bg-surface px-5 py-4 ${marked ? 'border-accent ring-2 ring-accent/30' : 'border-line'}`}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <h3 className="min-w-0 flex-1 text-[17px] leading-snug font-semibold"><Md>{r.rule}</Md></h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${IMPACT_STYLE[r.impact]}`}>{r.impact}</span>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed"><Md>{r.why}</Md></p>
      {(r.avoid || r.prefer) && (
        <div className={`mt-3 grid gap-3 ${r.avoid && r.prefer ? 'lg:grid-cols-2' : ''}`}>
          {r.avoid && (
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wider text-dead uppercase"><CircleX className="size-3.5" /> Avoid</p>
              <pre className="overflow-x-auto rounded-lg border border-dead/30 bg-code p-3 text-[12.5px] leading-relaxed" tabIndex={0}>{r.avoid.trim()}</pre>
            </div>
          )}
          {r.prefer && (
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wider text-ok uppercase"><CircleCheck className="size-3.5" /> Prefer</p>
              <pre className="overflow-x-auto rounded-lg border border-ok/40 bg-code p-3 text-[12.5px] leading-relaxed" tabIndex={0}>{r.prefer.trim()}</pre>
            </div>
          )}
        </div>
      )}
      {r.unless && <p className="mt-3 text-[14px] leading-relaxed text-muted"><span className="font-semibold text-ink">Unless: </span><Md>{r.unless}</Md></p>}
      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
        <span className="text-muted">Learn the mechanism:</span>
        {r.learn.map((p) => <Link key={p} to={p} className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">{learnLabel(p)}</Link>)}
      </p>
    </article>
  )
}
