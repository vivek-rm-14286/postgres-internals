import { useEffect, useMemo } from 'react'
import { NavLink, useParams, useSearchParams, Routes, Route, Navigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import data from './data.json'
import { Md } from '../lesson/Md'

/** One reference table: columns plus rows of short text cells (inline markup allowed). */
export interface RefTable {
  id: string
  title: string
  description: string
  columns: string[]
  rows: string[][]
}
const TABLES = data as RefTable[]

export function Reference() {
  return (
    <Routes>
      <Route index element={TABLES[0] ? <Navigate to={TABLES[0].id} replace /> : <p className="p-8">No reference data.</p>} />
      <Route path=":id" element={<RefView />} />
    </Routes>
  )
}

function RefView() {
  const { id } = useParams()
  const table = TABLES.find((t) => t.id === id) ?? TABLES[0]
  // The filter lives in the URL (/reference/<table>?q=…), so a filtered view can be linked to and survives reload.
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const setQ = (v: string) => setParams(v ? { q: v } : {}, { replace: true })
  useEffect(() => { document.title = `${table.title} · Reference · Postgres, Visualized` }, [table])
  // Every word must appear somewhere in the row; inline markup (`code`, **bold**) is ignored when matching.
  const haystack = useMemo(() => table.rows.map((r) => r.join(' \u0001 ').replace(/[`*]/g, '').toLowerCase()), [table])
  const rows = useMemo(() => {
    const words = q.toLowerCase().replace(/[`*]/g, '').split(/\s+/).filter(Boolean)
    return words.length ? table.rows.filter((_, i) => words.every((w) => haystack[i].includes(w))) : table.rows
  }, [q, table, haystack])

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-8">
      <p className="font-mono text-xs text-accent">Reference · everything in one place</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{table.title}</h1>
      <p className="mt-2 max-w-3xl text-muted">Complete, searchable tables for PostgreSQL 18: every configuration parameter, catalog, view, lock mode, wait event, data type, index method, extension, error code and glossary term.</p>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {TABLES.map((t) => (
          <NavLink key={t.id} to={`/reference/${t.id}`} className={({ isActive }) => `rounded-full border px-3 py-1 text-[13px] ${isActive ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line text-muted hover:text-ink'}`}>
            {t.title} <span className="font-mono text-[11px]">{t.rows.length}</span>
          </NavLink>
        ))}
      </div>
      <section className="mt-6 rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted"><Md>{table.description}</Md></p>
            <p className="mt-0.5 font-mono text-xs text-muted" aria-live="polite">{q.trim() ? `${rows.length} of ${table.rows.length} rows` : `${table.rows.length} rows`}</p>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-bg px-2.5 py-1.5">
            <Search className="size-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter rows" className="w-48 bg-transparent text-sm outline-none" aria-label="Filter rows" />
          </label>
        </div>
        <div className="max-h-[70vh] overflow-auto scrollbar-thin" tabIndex={0} role="region" aria-label={`${table.title} table`}>
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 bg-surface-2">
              <tr>{table.columns.map((c) => <th key={c} className="border-b border-line px-3 py-2 text-left font-semibold whitespace-nowrap">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-line align-top last:border-0">
                  {r.map((c, j) => <td key={j} className={`px-3 py-1.5 ${j === 0 ? 'max-w-[22rem] font-mono font-semibold break-words' : ''}`}><Md>{c}</Md></td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-4 py-6 text-sm text-muted">No rows match “{q}”.</p>}
        </div>
      </section>
    </div>
  )
}
