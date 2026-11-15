import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLang, PostgreSQL } from '@codemirror/lang-sql'
import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CircleCheck, CircleX, Eye, FlaskConical, Lightbulb, Loader2, Play, Square, Table2 } from 'lucide-react'
import { DATASETS, EXERCISES, datasetById, exerciseById } from './registry'
import { LEVELS, type Level } from './types'
import { checkAnswer, type Verdict } from './compare'
import { Engine, type RunOutput } from '../playground/engine'
import { ErrorBox, ResultTable } from '../playground/Playground'
import { Md } from '../lesson/Md'
import { setDone, useProgress } from '../app/progress'
import { useTheme } from '../app/theme'

const LEVEL_STYLE: Record<Level, string> = {
  beginner: 'bg-ok/15 text-ok', intermediate: 'bg-tuple/15 text-tuple', advanced: 'bg-new/15 text-new', expert: 'bg-dead/15 text-dead',
}
const EDITOR_LABEL = EditorView.contentAttributes.of({ 'aria-label': 'Your SQL answer' })
const solvedKey = (id: string) => `cb:${id}`

export function Cookbook() {
  return (
    <Routes>
      <Route index element={<CookbookIndex />} />
      <Route path=":id" element={<ExerciseView />} />
    </Routes>
  )
}

function LevelTag({ level }: { level: Level }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${LEVEL_STYLE[level]}`}>{level}</span>
}

function CookbookIndex() {
  const done = useProgress()
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [dataset, setDataset] = useState<string>('all')
  const [topic, setTopic] = useState<string>('all')
  useEffect(() => { document.title = 'SQL Cookbook · Postgres, Visualized' }, [])
  const topics = useMemo(() => [...new Set(EXERCISES.map((e) => e.topic))].sort(), [])
  const list = EXERCISES.filter((e) => (level === 'all' || e.level === level) && (dataset === 'all' || e.dataset === dataset) && (topic === 'all' || e.topic === topic))
  const solved = EXERCISES.filter((e) => done.has(solvedKey(e.id))).length

  const chip = (active: boolean) => `shrink-0 rounded-full border px-3 py-1 text-[13px] capitalize ${active ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line text-muted hover:text-ink'}`
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-24 sm:px-8">
      <p className="flex items-center gap-1.5 font-mono text-xs text-accent"><FlaskConical className="size-3.5" /> Cookbook</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Practise SQL, beginner to expert</h1>
      <p className="mt-2 max-w-3xl text-muted">Graded exercises on realistic datasets. Write a query, press <b className="text-ink">Check</b>, and your result is compared with a reference solution on a fresh copy of the data. Everything runs on a real PostgreSQL 18 in your browser.</p>
      <p className="mt-3 font-mono text-xs text-muted">{solved}/{EXERCISES.length} solved</p>

      <div className="mt-6 grid gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin" role="group" aria-label="Level">
          {(['all', ...LEVELS] as const).map((l) => <button key={l} className={chip(level === l)} onClick={() => setLevel(l)}>{l === 'all' ? 'All levels' : l}</button>)}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin" role="group" aria-label="Dataset">
          <button className={chip(dataset === 'all')} onClick={() => setDataset('all')}>All datasets</button>
          {DATASETS.map((d) => <button key={d.id} className={chip(dataset === d.id)} onClick={() => setDataset(d.id)}>{d.title}</button>)}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">Topic
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1 text-ink">
            <option value="all">All topics</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      <ol className="mt-6 grid gap-2">
        {list.map((e) => (
          <li key={e.id}>
            <Link to={`/cookbook/${e.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-accent">
              {done.has(solvedKey(e.id)) ? <CircleCheck className="size-5 shrink-0 text-ok" aria-label="solved" /> : <span className="size-5 shrink-0 rounded-full border-2 border-line" />}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold"><Md>{e.title}</Md></span>
                <span className="mt-0.5 block text-xs text-muted">{datasetById(e.dataset)?.title} · {e.topic}</span>
              </span>
              <LevelTag level={e.level} />
            </Link>
          </li>
        ))}
        {list.length === 0 && <p className="text-sm text-muted">No exercises match these filters.</p>}
      </ol>
    </div>
  )
}

function ExerciseView() {
  const { id = '' } = useParams()
  const ex = exerciseById(id)
  const ds = ex ? datasetById(ex.dataset) : undefined
  const done = useProgress()
  const { dark } = useTheme()
  const [code, setCode] = useState(ex?.starter ?? '')
  const [out, setOut] = useState<RunOutput | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [busy, setBusy] = useState<'run' | 'check' | null>(null)
  const [hint, setHint] = useState(false)
  const [sol, setSol] = useState(false)
  const engine = useMemo(() => (ds ? new Engine(ds.extensions ?? [], ds.setup) : null), [ds])

  useEffect(() => { setCode(ex?.starter ?? ''); setOut(null); setVerdict(null); setHint(false); setSol(false) }, [ex])
  useEffect(() => () => { void engine?.close() }, [engine])
  useEffect(() => { if (ex) document.title = `${ex.title.replace(/[*`]/g, '')} · Cookbook · Postgres, Visualized` }, [ex])

  const run = useCallback(async () => {
    if (!engine || !code.trim()) return
    setBusy('run'); setVerdict(null)
    try { setOut(await engine.run(code)) } finally { setBusy(null) }
  }, [engine, code])
  const abort = useRef<AbortController | null>(null)
  const check = useCallback(async () => {
    if (!ex || !ds || !code.trim()) return
    setBusy('check')
    abort.current = new AbortController()
    try { const v = await checkAnswer(ex, ds, code, abort.current.signal); setVerdict(v); if (v.ok) setDone(solvedKey(ex.id), true) } finally { setBusy(null); abort.current = null }
  }, [ex, ds, code])
  // Stop a query that is taking too long: Run stops its database, Check stops the copy running the reader's SQL.
  const stop = () => { if (busy === 'run') engine?.stop('Stopped.'); else abort.current?.abort() }
  const runKey = useMemo(() => Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => { void run(); return true } }])), [run])

  if (!ex || !ds) return <div className="px-8 pt-10"><p>Unknown exercise. <Link className="text-accent" to="/cookbook">Back to the Cookbook</Link></p></div>
  const i = EXERCISES.indexOf(ex)
  const prev = EXERCISES[i - 1], next = EXERCISES[i + 1]
  const shown = out?.results.filter((r) => r.fields.length) ?? []

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pt-6 pb-24 sm:px-8" data-testid="exercise">
      <Link to="/cookbook" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Cookbook</Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <LevelTag level={ex.level} /><span className="text-xs text-muted">{ds.title} · {ex.topic}</span>
        {done.has(solvedKey(ex.id)) && <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok"><Check className="size-3.5" /> solved</span>}
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"><Md>{ex.title}</Md></h1>
      <p className="mt-3 text-[16px] leading-relaxed"><Md>{ex.task}</Md></p>

      <details className="mt-5 rounded-xl border border-line bg-surface" open>
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-semibold"><Table2 className="size-4 text-accent" /> Dataset: {ds.title}</summary>
        <div className="border-t border-line px-4 py-3">
          <p className="mb-2 text-sm text-muted"><Md>{ds.description}</Md></p>
          <ul className="grid gap-1 font-mono text-[12.5px]">
            {ds.tables.map((t) => <li key={t.name}><b>{t.name}</b><span className="text-muted">({t.columns})</span></li>)}
          </ul>
        </div>
      </details>

      <div className="mt-5 overflow-hidden rounded-xl border border-line bg-surface">
        <CodeMirror value={code} onChange={setCode} theme={dark ? 'dark' : 'light'} placeholder="Write your SQL here…" basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          extensions={[sqlLang({ dialect: PostgreSQL }), EditorView.lineWrapping, runKey, EDITOR_LABEL]} minHeight="120px" maxHeight="360px" />
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-2 px-3 py-2">
          <button onClick={run} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-semibold disabled:opacity-60">
            {busy === 'run' ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />} Run
          </button>
          <button onClick={check} disabled={!!busy} data-testid="check" className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-60">
            {busy === 'check' ? <Loader2 className="size-3.5 animate-spin" /> : <CircleCheck className="size-3.5" />} Check answer
          </button>
          {busy && engine?.stoppable && (
            <button onClick={stop} data-testid="stop" title="Stop this query. The database restarts from the dataset."
              className="inline-flex items-center gap-1.5 rounded-md border border-dead/50 bg-dead/10 px-3 py-1.5 text-xs font-semibold text-dead hover:bg-dead/20">
              <Square className="size-3 fill-current" aria-hidden /> Stop
            </button>
          )}
          <span className="ml-auto flex gap-1.5">
            {ex.hint && <button onClick={() => setHint((h) => !h)} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted hover:text-ink"><Lightbulb className="size-3.5" /> Hint</button>}
            <button onClick={() => setSol((s) => !s)} data-testid="show-solution" className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted hover:text-ink"><Eye className="size-3.5" /> Solution</button>
          </span>
        </div>
        <AnimatePresence>
          {verdict && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0 }} className={`flex items-start gap-2 border-t border-line px-4 py-3 text-sm ${verdict.ok ? 'bg-ok/10 text-ok' : 'bg-dead/10 text-dead'}`} data-testid="verdict" data-ok={verdict.ok}>
              {verdict.ok ? <CircleCheck className="mt-0.5 size-4 shrink-0" /> : <CircleX className="mt-0.5 size-4 shrink-0" />}<span className="font-semibold">{verdict.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
        {verdict?.error && <ErrorBox {...verdict.error} />}
        {verdict && !verdict.ok && verdict.expected && (
          <div className="grid border-t border-line lg:grid-cols-2">
            {verdict.mine && (
              <div className="min-w-0 overflow-x-auto border-b border-line lg:border-r lg:border-b-0" tabIndex={0} role="region" aria-label="Your result">
                <p className="px-4 pt-2 text-xs font-semibold text-muted">Your result (first rows)</p><ResultTable fields={verdict.mine.fields} rows={verdict.mine.rows.slice(0, 10)} />
              </div>
            )}
            <div className="min-w-0 overflow-x-auto" tabIndex={0} role="region" aria-label="Expected result">
              <p className="px-4 pt-2 text-xs font-semibold text-muted">Expected (first rows)</p><ResultTable fields={verdict.expected.fields} rows={verdict.expected.rows.slice(0, 10)} />
            </div>
          </div>
        )}
        {out && !verdict && (
          <div className="max-h-[420px] overflow-auto border-t border-line scrollbar-thin" tabIndex={0} role="region" aria-label="Query results">
            {out.notices.length > 0 && <pre className="bg-code px-4 py-2 text-[12px] text-muted">{out.notices.join('\n')}</pre>}
            {shown.map((r, k) => <ResultTable key={k} fields={r.fields} rows={r.rows} />)}
            {out.error && <ErrorBox {...out.error} />}
          </div>
        )}
      </div>

      {hint && ex.hint && <div className="mt-4 rounded-xl border border-new/40 bg-new/10 px-4 py-3 text-sm"><b>Hint.</b> <Md>{ex.hint}</Md></div>}
      {sol && (
        <div className="mt-4 rounded-xl border border-line bg-surface">
          <p className="border-b border-line px-4 py-2 text-sm font-semibold">Reference solution</p>
          <pre className="overflow-x-auto bg-code px-4 py-3 text-[12.5px] leading-relaxed">{ex.solution.trim()}</pre>
          <p className="px-4 py-3 text-sm leading-relaxed"><Md>{ex.explanation}</Md></p>
          <div className="px-4 pb-3"><button onClick={() => setCode(ex.solution.trim())} className="text-xs font-semibold text-accent hover:underline">Copy into the editor</button></div>
        </div>
      )}

      <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Exercise navigation">
        {prev ? <Link to={`/cookbook/${prev.id}`} className="rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-accent"><span className="flex items-center gap-1 text-xs text-muted"><ArrowLeft className="size-3" /> Previous</span><span className="block font-semibold"><Md>{prev.title}</Md></span></Link> : <span />}
        {next && <Link to={`/cookbook/${next.id}`} className="rounded-xl border border-line bg-surface px-4 py-3 text-right hover:border-accent sm:col-start-2"><span className="flex items-center justify-end gap-1 text-xs text-muted">Next <ArrowRight className="size-3" /></span><span className="block font-semibold"><Md>{next.title}</Md></span></Link>}
      </nav>
    </div>
  )
}
