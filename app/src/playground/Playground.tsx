import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLang, PostgreSQL } from '@codemirror/lang-sql'
import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { AnimatePresence, motion } from 'framer-motion'
import { Database, Loader2, Play, RotateCcw, TriangleAlert } from 'lucide-react'
import { Engine, formatCell, type RunOutput } from './engine'
import type { ExtensionName } from './extensions'
import type { Preset } from '../lesson/types'
import { Md } from '../lesson/Md'
import { useTheme } from '../app/theme'
import { MOD_KEY } from './modkey'

interface Props {
  setup: string
  config?: string[]
  presets: Preset[]
  extensions?: ExtensionName[]
}

/** Names the editable element for assistive technology (an aria-label on the wrapper is not read). */
const EDITOR_LABEL = EditorView.contentAttributes.of({ 'aria-label': 'SQL editor' })
type Status = 'idle' | 'booting' | 'ready' | 'running' | 'failed'

export function Playground({ setup, presets, extensions = [], config = [] }: Props) {
  // Key on content, not identity: a default `[]` is a new array every render and must not rebuild the database.
  const extKey = extensions.join(',')
  const cfgKey = config.join('\n')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const engine = useMemo(() => new Engine(extKey ? (extKey.split(',') as ExtensionName[]) : [], setup, cfgKey ? cfgKey.split('\n') : []), [extKey, setup, cfgKey])
  const [status, setStatus] = useState<Status>('idle')
  const [bootError, setBootError] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const [code, setCode] = useState(presets[0]?.sql ?? 'SELECT version();')
  const [out, setOut] = useState<RunOutput | null>(null)
  const [runCount, setRunCount] = useState(0)
  const { dark } = useTheme()
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => () => { void engine.close() }, [engine])

  // Boot when the playground scrolls near the viewport, so the WASM download never blocks reading.
  useEffect(() => {
    const el = host.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); void boot() }
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine])

  const boot = useCallback(async () => {
    if (engine.ready) return
    setStatus('booting')
    try { await engine.boot(); setStatus('ready') } catch (e) { setBootError((e as Error).message); setStatus('failed') }
  }, [engine])

  const run = useCallback(async (text?: string) => {
    const q = (text ?? code).trim()
    if (!q) return
    setStatus(engine.ready ? 'running' : 'booting')
    try {
      const r = await engine.run(q)
      setOut(r); setRunCount((n) => n + 1); setStatus('ready')
    } catch (e) { setBootError((e as Error).message); setStatus('failed') }
  }, [code, engine])

  const reset = useCallback(async () => {
    setOut(null); setStatus('booting'); await engine.close()
    try { await engine.boot(); setStatus('ready') } catch (e) { setBootError((e as Error).message); setStatus('failed') }
  }, [engine])

  const pick = (i: number) => { setActive(i); setCode(presets[i].sql); setOut(null) }

  const runKey = useMemo(() => Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { void run(); return true } }])), [run])
  const busy = status === 'booting' || status === 'running'

  return (
    <div ref={host} className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm" data-testid="playground" data-status={status}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <Database className="size-4 text-accent" aria-hidden />
        <span className="text-sm font-semibold">PostgreSQL 18 in your browser</span>
        <StatusBadge status={status} />
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={reset} disabled={busy} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-surface hover:text-ink disabled:opacity-50" title="Throw away this database and rebuild it from the lesson schema">
            <RotateCcw className="size-3.5" /> Reset DB
          </button>
          <button onClick={() => run()} disabled={busy} data-testid="run" className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent hover:opacity-90 disabled:opacity-60">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Run <kbd className="hidden opacity-80 sm:inline">{MOD_KEY}↵</kbd>
          </button>
        </div>
      </div>

      {presets.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2 scrollbar-thin" role="tablist" aria-label="Example queries">
          {presets.map((p, i) => (
            <button key={p.label} role="tab" aria-selected={i === active} onClick={() => pick(i)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${i === active ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line text-muted hover:text-ink'}`}>
              {i + 1}. {p.label}
            </button>
          ))}
        </div>
      )}

      {presets[active]?.note && (
        <p className="border-b border-line px-4 py-2 text-[13px] text-muted"><span className="font-semibold text-ink">Look for: </span><Md>{presets[active].note!}</Md></p>
      )}

      <CodeMirror value={code} onChange={setCode} theme={dark ? 'dark' : 'light'} basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
        extensions={[sqlLang({ dialect: PostgreSQL }), EditorView.lineWrapping, runKey, EDITOR_LABEL]} minHeight="96px" maxHeight="320px" />

      <div className="border-t border-line" aria-live="polite">
        {status === 'failed' && bootError && <ErrorBox message={`Could not start the database: ${bootError}`} />}
        {status === 'booting' && !out && <p className="flex items-center gap-2 px-4 py-3 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> Starting Postgres (WebAssembly) and loading the lesson schema…</p>}
        {status === 'ready' && !out && <p className="px-4 py-3 text-sm text-muted">Database ready with the lesson schema. Edit the query and press <b>Run</b>.</p>}
        <AnimatePresence mode="wait">
          {out && (
            <motion.div key={runCount} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Results out={out} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, [string, string]> = {
    idle: ['not started', 'bg-surface text-muted'], booting: ['starting…', 'bg-new/15 text-new'], ready: ['ready', 'bg-ok/15 text-ok'],
    running: ['running…', 'bg-new/15 text-new'], failed: ['error', 'bg-dead/15 text-dead'],
  }
  const [label, cls] = map[status]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>
}

export function ErrorBox({ message, code, hint, detail }: { message: string; code?: string; hint?: string; detail?: string }) {
  return (
    <div className="flex gap-2 bg-dead/10 px-4 py-3 text-sm text-dead">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-mono text-[13px] break-words">ERROR{code ? ` ${code}` : ''}: {message}</p>
        {detail && <p className="mt-1 text-[13px] opacity-90">DETAIL: {detail}</p>}
        {hint && <p className="mt-1 text-[13px] opacity-90">HINT: {hint}</p>}
      </div>
    </div>
  )
}

function Results({ out }: { out: RunOutput }) {
  const shown = out.results.filter((r) => r.fields.length > 0)
  const last = out.results[out.results.length - 1]
  return (
    <div className="max-h-[480px] overflow-auto scrollbar-thin" data-testid="results" tabIndex={0} role="region" aria-label="Query results">
      {out.notices.length > 0 && (
        <pre className="border-b border-line bg-code px-4 py-2.5 text-[12px] leading-relaxed whitespace-pre-wrap text-muted" data-testid="notices">{out.notices.join('\n')}</pre>
      )}
      {shown.map((r, i) => <ResultTable key={i} fields={r.fields} rows={r.rows} />)}
      {out.error && <ErrorBox {...out.error} />}
      <p className="px-4 py-2 font-mono text-[11px] text-muted">
        {out.results.length} statement{out.results.length === 1 ? '' : 's'}
        {last && shown.length === 0 && last.affectedRows !== undefined ? ` · ${last.affectedRows} row(s) affected` : ''} · {out.ms.toFixed(1)} ms
      </p>
    </div>
  )
}

export function ResultTable({ fields, rows }: { fields: string[]; rows: unknown[][] }) {
  // EXPLAIN output reads best as preformatted text.
  if (fields.length === 1 && fields[0] === 'QUERY PLAN') {
    return <pre className="overflow-x-auto bg-code px-4 py-3 text-[12.5px] leading-relaxed">{rows.map((r) => formatCell(r[0])).join('\n')}</pre>
  }
  const LIMIT = 200
  return (
    <div className="border-b border-line">
      <table className="w-full border-collapse font-mono text-[12.5px]">
        <thead className="sticky top-0 bg-surface-2">
          <tr>{fields.map((f, i) => <th key={i} className="border-b border-line px-3 py-1.5 text-left font-semibold whitespace-nowrap">{f}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, LIMIT).map((row, i) => (
            <tr key={i} className="odd:bg-surface even:bg-surface-2/40">
              {row.map((c, j) => <td key={j} className={`px-3 py-1 align-top whitespace-pre ${c === null ? 'text-muted italic' : ''}`}>{formatCell(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-1 text-[11px] text-muted">{rows.length} row{rows.length === 1 ? '' : 's'}{rows.length > LIMIT ? ` (showing first ${LIMIT})` : ''}</p>
    </div>
  )
}
