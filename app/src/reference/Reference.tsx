import { useEffect, useMemo, useState } from 'react'
import { NavLink, useParams, Routes, Route, Navigate } from 'react-router-dom'
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
  const [q, setQ] = useState('')
  useEffect(() => { document.title = `${table.title} · Reference · Postgres Internals, Visualized`; setQ('') }, [table])
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? table.rows.filter((r) => r.some((c) => c.toLowerCase().includes(s))) : table.rows
  }, [q, table])

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-8">
      <p className="font-mono text-xs text-accent">Reference</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Everything in one place</h1>
      <p className="mt-2 max-w-3xl text-muted">Complete, searchable tables for PostgreSQL 18: every configuration parameter, catalog, view, lock mode, wait event, data type, index method, extension, error code and glossary term.</p>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {TABLES.map((t) => (
          <NavLink key={t.id} to={`/reference/${t.id}`} className={({ isActive }) => `rounded-full border px-3 py-1 text-[13px] ${isActive ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line text-muted hover:text-ink'}`}>
            {t.title} <span className="font-mono text-[11px] opacity-70">{t.rows.length}</span>
          </NavLink>
        ))}
      </div>
      <section className="mt-6 rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{table.title}</h2>
            <p className="text-sm text-muted"><Md>{table.description}</Md></p>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-bg px-2.5 py-1.5">
            <Search className="size-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${table.rows.length} rows`} className="w-48 bg-transparent text-sm outline-none" aria-label="Filter rows" />
          </label>
        </div>
        <div className="max-h-[70vh] overflow-auto scrollbar-thin">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 bg-surface-2">
              <tr>{table.columns.map((c) => <th key={c} className="border-b border-line px-3 py-2 text-left font-semibold whitespace-nowrap">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-line align-top last:border-0">
                  {r.map((c, j) => <td key={j} className={`px-3 py-1.5 ${j === 0 ? 'font-mono font-semibold whitespace-nowrap' : ''}`}><Md>{c}</Md></td>)}
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
