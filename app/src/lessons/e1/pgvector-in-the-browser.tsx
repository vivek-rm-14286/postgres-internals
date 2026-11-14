import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { PGlite } from '@electric-sql/pglite'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Tile } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Four views of the browser stack this site itself runs on.
 * 1. Stack: a Stepper timeline over five lanes (network, UI thread, embedding worker, PGlite worker,
 *    storage). Byte sizes are the real files of @electric-sql/pglite 0.5.16, pglite-pgvector (pgvector
 *    0.8.7), Transformers.js 4.3.2 and Xenova/all-MiniLM-L6-v2 (q8). Timings were measured in desktop
 *    Chromium; network time depends on the connection and is shown as a size, not a time.
 * 2. Two tabs: a scripted timeline of PGliteWorker leader election.
 * 3. Persistence (live): a real PGlite on idb://pgvector-lesson-demo, closed and reopened on click.
 * 4. Real model (live, opt-in): Transformers.js imported from a pinned CDN URL inside a Worker, a real
 *    in-memory PGlite with an HNSW index, and a local semantic search. Nothing loads until clicked.
 * ---------------------------------------------------------------------------------------------- */

const fmtBytes = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(b >= 1e7 ? 0 : 1)} MB` : b >= 1e3 ? `${Math.round(b / 1e3)} kB` : `${b} B`)
const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`)

// Measured sizes (bytes). Compressed = what crosses the network with gzip or brotli.
const SZ = {
  pgJs: 143_000, pgWasmRaw: 9_086_480, pgWasmGz: 3_238_147, pgDataRaw: 6_242_272, pgDataGz: 1_849_952,
  initdbGz: 128_408, vectorTar: 50_946, vectorSo: 102_540, dataDir: 40_373_248, dataDirGz: 4_462_944,
  tjsJs: 142_367, ortWasm: 5_573_891, ortWasmRaw: 26_861_777, model: 22_985_621, tokenizer: 202_000, files: 972,
}
const MODEL_TOTAL = SZ.tjsJs + SZ.ortWasm + SZ.model + SZ.tokenizer

// Measured timings (ms) in desktop Chromium on a laptop with a fast connection, first visit vs return visit.
const MS = {
  boot: 900, bootReturn: 600, ext: 25, initdb: 750, restore: 180, model: 2900, modelReturn: 630,
  embedOne: 8, embedBatch: 150, search: 3, flush: 30,
}

/* ======================================================================================== Stack */

type Lane = 'net' | 'ui' | 'emb' | 'pg' | 'disk'
const LANES: { id: Lane; label: string; sub: string; t: Tone }[] = [
  { id: 'net', label: 'Network', sub: 'CDN, model hub', t: 'muted' },
  { id: 'ui', label: 'UI thread', sub: 'the page', t: 'accent' },
  { id: 'emb', label: 'Embed worker', sub: 'Transformers.js', t: 'new' },
  { id: 'pg', label: 'PGlite worker', sub: 'PG 18 + pgvector', t: 'tuple' },
  { id: 'disk', label: 'Storage', sub: 'IndexedDB / OPFS', t: 'header' },
]
const laneIdx = (l: Lane) => LANES.findIndex((x) => x.id === l)

interface Hop {
  title: string; body: string; bodyReturn: string
  from: Lane; to: Lane; chip: string; chipReturn: string
  net: number; netReturn: number; local: number; localReturn: number; ms: number; msReturn: number
  files: [string, string, string][]
}

const HOPS: Hop[] = [
  { title: 'Download PostgreSQL', from: 'net', to: 'pg', chip: fmtBytes(SZ.pgJs + SZ.pgWasmGz + SZ.pgDataGz + SZ.initdbGz), chipReturn: 'cache',
    body: `The worker fetches PostgreSQL compiled to **WebAssembly**: \`pglite.wasm\` (${fmtBytes(SZ.pgWasmRaw)}, ${fmtBytes(SZ.pgWasmGz)} gzipped), \`pglite.data\` (${fmtBytes(SZ.pgDataGz)} gzipped) and \`initdb.wasm\` (${fmtBytes(SZ.initdbGz)} gzipped). About **5.4 MB** compressed before any extension.`,
    bodyReturn: 'The same files come from the HTTP cache: hashed file names never change, so nothing crosses the network.',
    net: SZ.pgJs + SZ.pgWasmGz + SZ.pgDataGz + SZ.initdbGz, netReturn: 0, local: 0, localReturn: 0, ms: MS.boot, msReturn: MS.bootReturn,
    files: [['pglite.wasm', `${fmtBytes(SZ.pgWasmGz)}`, `${fmtBytes(SZ.pgWasmRaw)} raw`], ['pglite.data', fmtBytes(SZ.pgDataGz), `${fmtBytes(SZ.pgDataRaw)} raw: share/ files, timezones`], ['initdb.wasm', fmtBytes(SZ.initdbGz), 'gzipped, creates a new cluster'], ['PGlite JS', fmtBytes(SZ.pgJs), 'gzipped']] },
  { title: 'Load pgvector', from: 'net', to: 'pg', chip: fmtBytes(SZ.vectorTar), chipReturn: 'cache',
    body: `\`extensions: { vector }\` adds one more file, \`vector.tar.gz\` (**${fmtBytes(SZ.vectorTar)}**). It unpacks \`vector.so\` (${fmtBytes(SZ.vectorSo)}) into the virtual file system, then \`CREATE EXTENSION vector\` runs as on any server.`,
    bodyReturn: '`vector.tar.gz` also comes from the HTTP cache. `CREATE EXTENSION` is already recorded in the stored catalog, so it is a no-op.',
    net: SZ.vectorTar, netReturn: 0, local: 0, localReturn: 0, ms: MS.ext, msReturn: MS.ext,
    files: [['vector.tar.gz', fmtBytes(SZ.vectorTar), 'pgvector 0.8.7'], ['vector.so', fmtBytes(SZ.vectorSo), 'unpacked, WebAssembly side module']] },
  { title: 'Open the data directory', from: 'pg', to: 'disk', chip: '40 MB', chipReturn: '40 MB',
    body: `\`dataDir: 'idb://notes'\` has no files yet, so PGlite runs **initdb** and writes a fresh cluster into IndexedDB: **${SZ.files} files**, about **${fmtBytes(SZ.dataDir)}**. This happens once per origin and name.`,
    bodyReturn: 'The cluster already exists: PGlite reads every file back from IndexedDB into its in-memory file system, then starts Postgres with your tables intact.',
    net: 0, netReturn: 0, local: SZ.dataDir, localReturn: SZ.dataDir, ms: MS.initdb, msReturn: MS.restore,
    files: [['fresh data directory', `${SZ.files} files, ${fmtBytes(SZ.dataDir)}`, `${fmtBytes(SZ.dataDirGz)} as a gzipped dumpDataDir()`], ['idb://', 'IndexedDB', 'every browser'], ['opfs-ahp://', 'OPFS', 'Chrome and Firefox, Worker only']] },
  { title: 'Download the model (opt-in)', from: 'net', to: 'emb', chip: fmtBytes(MODEL_TOTAL), chipReturn: 'cache',
    body: `The embedding worker imports **Transformers.js** and fetches \`all-MiniLM-L6-v2\` in 8-bit form, plus the ONNX Runtime WebAssembly engine: **${fmtBytes(MODEL_TOTAL)}** in total. Transformers.js stores the files in the **Cache API**.`,
    bodyReturn: 'Model, tokenizer and runtime come from the Cache API (`transformers-cache`). The worker only compiles the runtime and builds the session.',
    net: MODEL_TOTAL, netReturn: 0, local: SZ.model + SZ.tokenizer, localReturn: SZ.model + SZ.tokenizer, ms: MS.model, msReturn: MS.modelReturn,
    files: [['model_quantized.onnx', fmtBytes(SZ.model), 'q8, the WASM default'], ['ONNX Runtime .wasm', fmtBytes(SZ.ortWasm), `${fmtBytes(SZ.ortWasmRaw)} raw`], ['tokenizer + config', fmtBytes(SZ.tokenizer), 'compressed JSON'], ['transformers.min.js', fmtBytes(SZ.tjsJs), 'compressed']] },
  { title: 'Send text to the embed worker', from: 'ui', to: 'emb', chip: 'text', chipReturn: 'text',
    body: 'The page posts the note text to the embedding worker with `postMessage`. The UI thread stays free: typing and scrolling never wait for the model.',
    bodyReturn: 'Same path on every visit.',
    net: 0, netReturn: 0, local: 0, localReturn: 0, ms: 0, msReturn: 0,
    files: [['postMessage', '{ texts: [...] }', 'structured clone, a few bytes']] },
  { title: 'Embed: 384 numbers', from: 'emb', to: 'ui', chip: '1536 B', chipReturn: '1536 B',
    body: `\`extractor(text, { pooling: 'mean', normalize: true })\` returns a tensor of shape [1, 384]: one **Float32Array of 384** numbers with norm 1. About ${MS.embedOne} ms for one sentence on one laptop CPU; slower devices take longer. The buffer is **transferred**, not copied.`,
    bodyReturn: 'Same cost on every visit: inference does not depend on the cache.',
    net: 0, netReturn: 0, local: 0, localReturn: 0, ms: MS.embedOne, msReturn: MS.embedOne,
    files: [['Float32Array(384)', '1536 B', '4 bytes × 384'], ['as vector(384)', '1544 B', '4·384 + 8 in the heap'], ['norm', '1.000', 'normalize: true']] },
  { title: 'Insert and search with HNSW', from: 'ui', to: 'pg', chip: 'SQL', chipReturn: 'SQL',
    body: 'The vector goes to PGlite as a query parameter. `INSERT` stores it; `ORDER BY embedding <#> $1 LIMIT 5` walks the **HNSW** graph. On a few thousand rows a search takes a few milliseconds.',
    bodyReturn: 'Same SQL. The index pages are already in memory after the restore.',
    net: 0, netReturn: 0, local: 0, localReturn: 0, ms: MS.search, msReturn: MS.search,
    files: [['INSERT … VALUES ($1, $2::vector)', '1 row', ''], ['ORDER BY embedding <#> $1 LIMIT 5', 'Index Scan', 'vector_ip_ops']] },
  { title: 'Flush to storage', from: 'pg', to: 'disk', chip: 'files', chipReturn: 'files',
    body: 'After each query that changed files, PGlite writes the changed files back to IndexedDB. With `relaxedDurability: true` it returns the result first and flushes afterwards.',
    bodyReturn: 'Same on every visit: only changed files are written.',
    net: 0, netReturn: 0, local: -1, localReturn: -1, ms: MS.flush, msReturn: MS.flush,
    files: [['changed heap, index and WAL files', 'whole files', 'not just the changed 8 kB pages'], ['relaxedDurability', 'false (default)', 'true: answer first, flush later']] },
  { title: 'Rows back to the page', from: 'pg', to: 'ui', chip: '5 rows', chipReturn: '5 rows',
    body: 'Five rows come back through the worker to the page. The text, its vector and the query never left the device.',
    bodyReturn: 'Second visit total: no downloads, and about 1.4 s from page load to a ready database and model on a fast laptop. Slower devices take longer.',
    net: 0, netReturn: 0, local: 0, localReturn: 0, ms: 0, msReturn: 0,
    files: [['network requests for search', '0', 'fully local'], ['server-side storage', 'none', 'IndexedDB on this device']] },
]

interface SState { i: number; ret: boolean }

const VW = 640, LH = 54, TOP = 6, COL0 = 128, COLW = (VW - COL0) / HOPS.length
const laneY = (l: Lane) => TOP + laneIdx(l) * LH + LH / 2

function StackDiagram({ i, ret }: SState) {
  return (
    <svg viewBox={`0 0 ${VW} ${TOP * 2 + LANES.length * LH}`} className="w-full min-w-[560px]" role="img" aria-label="Browser stack timeline">
      {LANES.map((l, k) => (
        <g key={l.id}>
          <rect x={0} y={TOP + k * LH + 2} width={VW} height={LH - 4} rx={8} fill={toneBg(l.t, 8)} stroke={toneBg(l.t, 35)} />
          <text x={10} y={TOP + k * LH + LH / 2 - 3} fontSize={12} fontWeight={600} fill="var(--text)">{l.label}</text>
          <text x={10} y={TOP + k * LH + LH / 2 + 12} fontSize={10} fill="var(--muted)">{l.sub}</text>
        </g>
      ))}
      {HOPS.map((h, k) => {
        const x = COL0 + k * COLW + COLW / 2
        const y1 = laneY(h.from), y2 = laneY(h.to)
        const state = k < i ? 'past' : k === i ? 'now' : 'future'
        const cached = ret && h.chipReturn === 'cache'
        const t: Tone = state === 'future' ? 'muted' : cached ? 'ok' : LANES[laneIdx(h.to)].t === 'muted' ? 'accent' : LANES[laneIdx(h.from === 'net' ? h.to : h.from)].t
        const dir = y2 > y1 ? 1 : -1
        const label = ret ? h.chipReturn : h.chip
        return (
          <g key={k} opacity={state === 'future' ? 0.28 : state === 'past' ? 0.6 : 1}>
            <motion.line x1={x} x2={x} y1={y1} y2={y2 - dir * 8} stroke={tone(t)} strokeWidth={state === 'now' ? 2.6 : 1.6}
              strokeDasharray={cached ? '4 3' : undefined}
              initial={false} animate={{ pathLength: state === 'future' ? 0 : 1 }} transition={{ duration: 0.5 }} />
            <motion.path d={`M ${x - 5} ${y2 - dir * 10} L ${x} ${y2 - dir * 2} L ${x + 5} ${y2 - dir * 10} Z`} fill={tone(t)}
              initial={false} animate={{ opacity: state === 'future' ? 0 : 1 }} />
            <circle cx={x} cy={y1} r={3.5} fill={tone(t)} />
            <motion.g initial={false} animate={{ scale: state === 'now' ? 1.08 : 1 }} style={{ originX: `${x}px`, originY: `${(y1 + y2) / 2}px` }}>
              <rect x={x - COLW / 2 + 3} y={(y1 + y2) / 2 - 9} width={COLW - 6} height={18} rx={4}
                fill="var(--surface)" stroke={tone(t)} strokeWidth={state === 'now' ? 1.6 : 1} />
              <text x={x} y={(y1 + y2) / 2 + 3.5} fontSize={9.5} textAnchor="middle" fontFamily="var(--font-mono, monospace)" fill="var(--text)">{label}</text>
            </motion.g>
            <text x={x} y={TOP + 12} fontSize={9.5} textAnchor="middle" fill={state === 'now' ? tone('accent') : 'var(--muted)'} fontWeight={state === 'now' ? 700 : 400}>{k + 1}</text>
          </g>
        )
      })}
    </svg>
  )
}

function StackViz() {
  const [ret, setRet] = useState(false)
  const steps: Step<SState>[] = useMemo(() => HOPS.map((h, i) => ({ title: h.title, body: ret ? h.bodyReturn : h.body, state: { i, ret } })), [ret])
  return (
    <Stepper steps={steps} interval={2600}
      extra={<Segmented label="Visit" value={ret ? 'ret' : 'first'} onChange={(v) => setRet(v === 'ret')} options={[['first', 'First visit'], ['ret', 'Return visit']]} />}
      render={(s) => {
        const upto = HOPS.slice(0, s.i + 1)
        const net = upto.reduce((a, h) => a + (s.ret ? h.netReturn : h.net), 0)
        const ms = upto.reduce((a, h) => a + (s.ret ? h.msReturn : h.ms), 0)
        const h = HOPS[s.i]
        return (
          <div className="grid gap-3">
            <div className="overflow-x-auto scrollbar-thin"><StackDiagram {...s} /></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Tile label="network so far" value={fmtBytes(net)} t={s.ret ? 'ok' : 'accent'} sub={s.ret ? 'everything cached' : 'compressed bytes'} />
              <Tile label="time so far" value={fmtMs(ms)} sub="one laptop; varies by device and link" />
              <Tile label="this step" value={(s.ret ? h.msReturn : h.ms) ? fmtMs(s.ret ? h.msReturn : h.ms) : 'instant'} t={LANES[laneIdx(h.to === 'net' ? h.from : h.to)].t} />
              <Tile label="local storage" value={(s.ret ? h.localReturn : h.local) < 0 ? 'changed files' : fmtBytes(s.ret ? h.localReturn : h.local)} sub={s.ret ? 'read this step' : 'written this step'} t="header" />
            </div>
            <Panel title="Files and messages in this step">
              <FieldTable rows={h.files} />
            </Panel>
            <Legend items={[['tuple', 'PostgreSQL (PGlite)'], ['new', 'embedding model'], ['header', 'browser storage'], ['ok', 'served from cache']]} />
          </div>
        )
      }} />
  )
}

/* ===================================================================================== Two tabs */

interface TState { a: 'leader' | 'closed'; b: 'none' | 'follower' | 'leader'; msg: 'none' | 'a' | 'b' | 'clash'; election: boolean }
const TAB_STEPS: Step<TState>[] = [
  { title: 'Tab A opens', body: 'Tab A creates `new PGliteWorker(worker, { dataDir: \'idb://notes\' })`. Its worker runs an **election**, wins it, and only then calls `init()` to start PGlite.', state: { a: 'leader', b: 'none', msg: 'none', election: true } },
  { title: 'Tab A queries', body: 'Queries go from the page to its own worker. One PGlite instance, one connection, one copy of the files in memory.', state: { a: 'leader', b: 'none', msg: 'a', election: false } },
  { title: 'Tab B opens the same id', body: 'Tab B starts a worker with the same `id` (by default the worker URL plus `dataDir`). It loses the election, so it **never starts PGlite**: it becomes a follower.', state: { a: 'leader', b: 'follower', msg: 'none', election: true } },
  { title: 'Tab B queries', body: 'Tab B\'s queries are forwarded to the leader and run on Tab A\'s instance. Both tabs see the same rows at once.', state: { a: 'leader', b: 'follower', msg: 'b', election: false } },
  { title: 'Tab A closes', body: 'The leader is gone. A new election runs among the remaining workers, Tab B wins and starts PGlite from the same IndexedDB files. `onLeaderChange` fires; a query caught mid-switch can fail with `LeaderChangedError`.', state: { a: 'closed', b: 'leader', msg: 'none', election: true } },
  { title: 'Without PGliteWorker', body: 'Two plain `PGlite` instances on one `dataDir` are two Postgres servers on one set of files. Neither sees the other\'s writes, and each flush can overwrite the other\'s files.', state: { a: 'leader', b: 'leader', msg: 'clash', election: false } },
]

function TabBox({ name, role, active }: { name: string; role: 'leader' | 'follower' | 'closed' | 'none'; active: boolean }) {
  const t: Tone = role === 'leader' ? 'tuple' : role === 'follower' ? 'pointer' : 'muted'
  return (
    <motion.div layout className="rounded-lg border-2 p-2" animate={{ opacity: role === 'closed' || role === 'none' ? 0.35 : 1, scale: active ? 1.03 : 1 }}
      style={{ borderColor: tone(t), background: toneBg(t, 8) }}>
      <p className="text-xs font-semibold">{name}</p>
      <p className="font-mono text-[11px]" style={{ color: tone(t) }}>{role === 'none' ? 'not open' : role === 'closed' ? 'closed' : role}</p>
      <div className="mt-1.5 grid gap-1">
        <div className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px]">page (UI thread)</div>
        <div className="rounded border px-1.5 py-0.5 text-[11px]" style={{ borderColor: tone(t) }}>
          worker {role === 'leader' ? <b style={{ color: tone('tuple') }}>+ PGlite</b> : role === 'follower' ? '(proxy only)' : ''}
        </div>
      </div>
    </motion.div>
  )
}

function TabsViz() {
  return (
    <Stepper steps={TAB_STEPS} interval={2800} render={(s) => (
      <div className="grid gap-3">
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <TabBox name="Tab A" role={s.a} active={s.msg === 'a'} />
          <div className="flex flex-col items-center justify-center gap-1 text-xs">
            <AnimatePresence mode="wait">
              <motion.div key={s.msg + String(s.election)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-md border px-2 py-1 text-center font-mono text-[11px]"
                style={{ borderColor: tone(s.msg === 'clash' ? 'dead' : s.election ? 'new' : 'pointer'), color: tone(s.msg === 'clash' ? 'dead' : s.election ? 'new' : 'pointer') }}>
                {s.msg === 'clash' ? 'two servers, one dataDir' : s.election ? 'election' : s.msg === 'b' ? 'B → A: query, A → B: rows' : s.msg === 'a' ? 'A → own worker' : 'idle'}
              </motion.div>
            </AnimatePresence>
          </div>
          <TabBox name="Tab B" role={s.b} active={s.msg === 'b'} />
        </div>
        <motion.div layout className="rounded-lg border-2 px-3 py-2 text-xs" style={{ borderColor: tone(s.msg === 'clash' ? 'dead' : 'header'), background: toneBg(s.msg === 'clash' ? 'dead' : 'header', 8) }}>
          <span className="font-semibold">IndexedDB: </span><code className="inline-code">idb://notes</code>
          <span className="text-muted"> · {s.msg === 'clash' ? 'written by two independent instances: lost updates' : `one writer: ${s.a === 'leader' ? 'Tab A' : 'Tab B'}`}</span>
        </motion.div>
        <Legend items={[['tuple', 'leader, runs PGlite'], ['pointer', 'follower, forwards queries'], ['new', 'election'], ['dead', 'unsupported']]} />
      </div>
    )} />
  )
}

/* ============================================================================ Persistence (live) */

const DEMO_NAME = 'pgvector-lesson-demo'
type Dir = 'idb' | 'memory'
interface LogLine { t: Tone; text: string; ms?: number }
interface SavedRow { id: number; body: string; opened_by: number; embedding: string }
const NOTES = ['buy oat milk', 'call the plumber', 'book the train', 'return the library book', 'water the basil', 'renew the passport']

async function openDemo(dir: Dir): Promise<PGlite> {
  const [{ PGlite }, { vector }] = await Promise.all([import('@electric-sql/pglite'), import('@electric-sql/pglite-pgvector')])
  const db = await PGlite.create({ dataDir: dir === 'idb' ? `idb://${DEMO_NAME}` : 'memory://', extensions: { vector } })
  await db.exec(`CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS opens (n int PRIMARY KEY, at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS saved_notes (id int PRIMARY KEY, body text NOT NULL, opened_by int NOT NULL, embedding vector(3) NOT NULL);`)
  return db
}

async function deleteIdb() {
  const names = new Set<string>([`/pglite/${DEMO_NAME}`, DEMO_NAME])
  try {
    const list = await (indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> }).databases?.()
    for (const d of list ?? []) if (d.name?.includes(DEMO_NAME)) names.add(d.name)
  } catch { /* databases() is not available everywhere */ }
  await Promise.all([...names].map((n) => new Promise<void>((res) => {
    try { const r = indexedDB.deleteDatabase(n); r.onsuccess = r.onerror = r.onblocked = () => res() } catch { res() }
  })))
}

function PersistViz() {
  const db = useRef<PGlite | null>(null)
  const opening = useRef<Promise<PGlite> | null>(null)
  const [dir, setDir] = useState<Dir>('idb')
  const [instance, setInstance] = useState<number | null>(null)
  const [rows, setRows] = useState<SavedRow[]>([])
  const [log, setLog] = useState<LogLine[]>([])
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState<string | null>(null)
  const [usage, setUsage] = useState<number | null>(null)

  useEffect(() => () => { const d = db.current; db.current = null; d?.close().catch(() => {}) }, [])
  const add = (l: LogLine) => setLog((x) => [...x.slice(-7), l])
  const estimate = async () => { try { const e = await navigator.storage?.estimate?.(); if (e?.usage !== undefined) setUsage(e.usage) } catch { /* not available */ } }
  const refresh = async (d: PGlite) => setRows((await d.query<SavedRow>('SELECT id, body, opened_by, embedding::text AS embedding FROM saved_notes ORDER BY id')).rows)

  async function ensure(): Promise<PGlite> {
    if (db.current) return db.current
    if (!opening.current) {
      opening.current = (async () => {
        const t0 = performance.now()
        const d = await openDemo(dir)
        const n = (await d.query<{ n: number }>('INSERT INTO opens (n) SELECT coalesce(max(n), 0) + 1 FROM opens RETURNING n')).rows[0].n
        db.current = d
        setInstance(n)
        await refresh(d)
        const count = (await d.query<{ c: number }>('SELECT count(*)::int AS c FROM saved_notes')).rows[0].c
        add({ t: 'tuple', text: `PGlite.create({ dataDir: '${dir === 'idb' ? `idb://${DEMO_NAME}` : 'memory://'}' }): open #${n}, found ${count} row${count === 1 ? '' : 's'}`, ms: performance.now() - t0 })
        return d
      })().finally(() => { opening.current = null })
    }
    return opening.current
  }

  async function guard(fn: () => Promise<void>) {
    setBusy(true)
    try { await fn(); setBlocked(null) } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (dir === 'idb') setBlocked(msg)
      add({ t: 'dead', text: `failed: ${msg}` })
      const d = db.current; db.current = null; setInstance(null); await d?.close().catch(() => {})
    } finally { setBusy(false); void estimate() }
  }

  const insert = () => guard(async () => {
    const d = await ensure()
    const t0 = performance.now()
    const body = NOTES[rows.length % NOTES.length]
    const v = `[${[0, 1, 2].map((k) => Math.cos((rows.length + 1) * (k + 1)).toFixed(3)).join(',')}]`
    await d.query('INSERT INTO saved_notes SELECT coalesce(max(id), 0) + 1, $1, (SELECT max(n) FROM opens), l2_normalize($2::vector) FROM saved_notes', [body, v])
    await refresh(d)
    add({ t: 'new', text: `INSERT '${body}' (flushed to ${dir === 'idb' ? 'IndexedDB' : 'nowhere: memory only'})`, ms: performance.now() - t0 })
  })
  const reopen = () => guard(async () => {
    const d = db.current ?? await ensure()
    const t0 = performance.now()
    await d.close()
    db.current = null
    setInstance(null)
    setRows([])
    add({ t: 'muted', text: 'db.close(): the instance and its memory are gone', ms: performance.now() - t0 })
    await ensure()
  })
  const wipe = () => guard(async () => {
    const d = db.current; db.current = null; setInstance(null)
    await d?.close()
    if (dir === 'idb') await deleteIdb()
    setRows([])
    add({ t: 'dead', text: dir === 'idb' ? `deleted the IndexedDB database for ${DEMO_NAME}` : 'closed the in-memory instance' })
  })
  const switchDir = async (v: Dir) => {
    const d = db.current; db.current = null; setInstance(null); setRows([]); setLog([])
    await d?.close().catch(() => {})
    setDir(v)
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="dataDir" value={dir} onChange={(v) => { if (!busy) void switchDir(v) }} options={[['idb', `idb://${DEMO_NAME}`], ['memory', 'memory://']]} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary onClick={insert} disabled={busy}>{instance ? 'Insert a row' : 'Open and insert a row'}</Btn>
        <Btn onClick={reopen} disabled={busy || (!instance && !rows.length)}>Close and reopen</Btn>
        <Btn onClick={wipe} disabled={busy}>{dir === 'idb' ? 'Delete the stored database' : 'Close'}</Btn>
        {busy && <span className="text-xs text-muted">working…</span>}
      </div>
      {blocked && (
        <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: tone('dead'), background: toneBg('dead', 8) }}>
          <Md>{`IndexedDB is not available in this window (${blocked.slice(0, 120)}). Private windows and strict privacy settings can block it. Switch to \`memory://\` to run the same steps: the rows will not survive the reopen, which is exactly what \`idb://\` prevents.`}</Md>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="instance" value={instance ? `open #${instance}` : 'closed'} t={instance ? 'tuple' : 'muted'} sub={dir === 'idb' ? 'counter stored in the database' : 'starts at 1 every time'} />
        <Tile label="rows" value={rows.length} t={rows.length ? 'ok' : 'muted'} />
        <Tile label="written by earlier opens" value={instance ? rows.filter((r) => r.opened_by < instance).length : '–'} t="header" sub="rows that survived a reopen" />
        <Tile label="origin storage" value={usage === null ? '–' : fmtBytes(usage)} sub="navigator.storage.estimate()" />
      </div>
      <Panel title="saved_notes">
        {rows.length === 0 ? <p className="text-xs text-muted">{instance ? 'Empty.' : 'Not open. Click the first button: the first open of a new idb:// name runs initdb, which takes about a second or more.'}</p> : (
          <div className="grid gap-1">
            <AnimatePresence initial={false}>
              {rows.map((r) => (
                <motion.div key={r.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded border px-2 py-1 font-mono text-[11.5px]"
                  style={{ borderColor: tone(instance && r.opened_by < instance ? 'header' : 'new'), background: toneBg(instance && r.opened_by < instance ? 'header' : 'new', 8) }}>
                  <span>{r.id}</span><span className="truncate">{r.body} <span className="text-muted">{r.embedding}</span></span><span className="text-muted">open #{r.opened_by}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Panel>
      {log.length > 0 && (
        <div className="grid gap-0.5 rounded-lg border border-line bg-code px-3 py-2 font-mono text-[11px]">
          {log.map((l, k) => <div key={k} className="flex justify-between gap-2"><span style={{ color: tone(l.t) }}>{l.text}</span>{l.ms !== undefined && <span className="shrink-0 text-muted">{fmtMs(l.ms)}</span>}</div>)}
        </div>
      )}
      <Legend items={[['new', 'written by this open'], ['header', 'read back from storage'], ['tuple', 'open'], ['dead', 'deleted or failed']]} />
      <p className="text-xs text-muted"><Md>{'This demo runs PGlite on the page itself to stay small. Reloading the browser tab works too: the rows are still there. Delete the stored database when you are done.'}</Md></p>
    </div>
  )
}

/* ============================================================================= Real model (live) */

const TJS_VERSION = '4.3.2'
const TJS_URL = `https://cdn.jsdelivr.net/npm/@huggingface/transformers@${TJS_VERSION}/dist/transformers.min.js`
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'
const WORKER_SRC = `
let extractor = null;
self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.type === 'load') {
      const t0 = performance.now();
      const { pipeline, env } = await import(${JSON.stringify(TJS_URL)});
      env.allowLocalModels = false;
      const files = {};
      extractor = await pipeline('feature-extraction', ${JSON.stringify(MODEL_ID)}, {
        dtype: 'q8', device: 'wasm',
        progress_callback: (p) => {
          if (p && p.file && typeof p.loaded === 'number') { files[p.file] = [p.loaded, p.total || p.loaded]; self.postMessage({ type: 'progress', files }); }
        },
      });
      self.postMessage({ type: 'ready', ms: performance.now() - t0 });
    } else if (m.type === 'embed') {
      const t0 = performance.now();
      const out = await extractor(m.texts, { pooling: 'mean', normalize: true });
      const data = new Float32Array(out.data);
      self.postMessage({ type: 'embedded', id: m.id, data, dims: out.dims, ms: performance.now() - t0 }, [data.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: m.id, message: String((err && err.message) || err) });
  }
};`

const DOCS = [
  'Vacuum removes dead row versions so their space can be reused.',
  'An index lets the database find rows without reading the whole table.',
  'Write-ahead logging makes committed transactions survive a crash.',
  'Simmer the tomato sauce for twenty minutes, then add fresh basil.',
  'Knead the dough until it is smooth and springs back when pressed.',
  'A pinch of salt makes caramel taste richer.',
  'Lower your tyre pressure a little for gravel roads.',
  'Clean and oil the chain every few hundred kilometres.',
  'Shift to an easier gear before the climb starts.',
  'Jupiter\'s four largest moons are visible with binoculars.',
  'A new moon gives the darkest skies for spotting galaxies.',
  'Saturn\'s rings are made mostly of ice.',
]
const QUERIES = ['keeping my bike in good shape', 'baking bread at home', 'what happens to deleted rows', 'looking at planets at night']

type Phase = 'idle' | 'loading' | 'indexing' | 'ready' | 'error'
interface Hit { id: number; body: string; ip: number; cos: number }
const vecLit = (a: Float32Array) => `[${Array.from(a, (x) => x.toFixed(6)).join(',')}]`

function ModelViz() {
  const worker = useRef<Worker | null>(null)
  const db = useRef<PGlite | null>(null)
  const pending = useRef(new Map<number, (v: { data: Float32Array; ms: number }) => void>())
  const seq = useRef(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [files, setFiles] = useState<Record<string, [number, number]>>({})
  const [err, setErr] = useState<string | null>(null)
  const [times, setTimes] = useState<{ load?: number; batch?: number; index?: number; embed?: number; sql?: number }>({})
  const [q, setQ] = useState(QUERIES[0])
  const [hits, setHits] = useState<Hit[]>([])
  const [plan, setPlan] = useState('')

  useEffect(() => () => {
    worker.current?.terminate(); worker.current = null
    const d = db.current; db.current = null; d?.close().catch(() => {})
  }, [])

  const embed = (texts: string[]) => new Promise<{ data: Float32Array; ms: number }>((res, rej) => {
    const w = worker.current
    if (!w) return rej(new Error('model not loaded'))
    const id = ++seq.current
    pending.current.set(id, res)
    w.postMessage({ type: 'embed', id, texts })
  })

  async function search(text: string) {
    const d = db.current
    if (!d || !text.trim()) return
    try {
      const e = await embed([text])
      const t0 = performance.now()
      const lit = vecLit(e.data)
      await d.exec('SET enable_seqscan = off')
      const r = await d.query<{ id: number; body: string; ip: number; cos: number }>(
        `SELECT id, body, (embedding <#> $1::vector)::float8 AS ip, (embedding <=> $1::vector)::float8 AS cos
         FROM docs ORDER BY embedding <#> $1::vector LIMIT 5`, [lit])
      const sql = performance.now() - t0
      const p = await d.query<{ 'QUERY PLAN': string }>(`EXPLAIN (COSTS OFF) SELECT id FROM docs ORDER BY embedding <#> $1::vector LIMIT 5`, [lit])
      setPlan(p.rows.map((x) => x['QUERY PLAN'].replace(/'\[[^\]]*\]'/, "'[…384 numbers…]'")).join('\n'))
      setHits(r.rows)
      setTimes((t) => ({ ...t, embed: e.ms, sql }))
    } catch (x) { setErr(x instanceof Error ? x.message : String(x)); setPhase('error') }
  }

  async function load() {
    setErr(null); setPhase('loading'); setFiles({})
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setErr('This device is offline. The model and runtime download from cdn.jsdelivr.net and huggingface.co the first time; connect and try again.')
      setPhase('error'); return
    }
    try {
      worker.current?.terminate()
      const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }))
      const w = new Worker(url, { type: 'module' })
      worker.current = w
      const ready = new Promise<number>((res, rej) => {
        w.onmessage = (ev: MessageEvent) => {
          const m = ev.data
          if (m.type === 'progress') setFiles({ ...m.files })
          else if (m.type === 'ready') res(m.ms)
          else if (m.type === 'embedded') { pending.current.get(m.id)?.({ data: m.data, ms: m.ms }); pending.current.delete(m.id) }
          else if (m.type === 'error') rej(new Error(m.message))
        }
        w.onerror = (ev) => { ev.preventDefault(); rej(new Error(ev.message || 'the worker could not start')) }
      })
      w.postMessage({ type: 'load' })
      const loadMs = await ready
      URL.revokeObjectURL(url)
      setTimes({ load: loadMs })
      setPhase('indexing')
      const batch = await embed(DOCS)
      const t0 = performance.now()
      const [{ PGlite }, { vector }] = await Promise.all([import('@electric-sql/pglite'), import('@electric-sql/pglite-pgvector')])
      const d = await PGlite.create({ extensions: { vector } })
      await d.exec('CREATE EXTENSION vector; CREATE TABLE docs (id int PRIMARY KEY, body text NOT NULL, embedding vector(384) NOT NULL);')
      for (let k = 0; k < DOCS.length; k++) {
        await d.query('INSERT INTO docs VALUES ($1, $2, $3::vector)', [k + 1, DOCS[k], vecLit(batch.data.subarray(k * 384, (k + 1) * 384))])
      }
      await d.exec('CREATE INDEX docs_hnsw ON docs USING hnsw (embedding vector_ip_ops)')
      db.current = d
      setTimes((t) => ({ ...t, batch: batch.ms, index: performance.now() - t0 }))
      setPhase('ready')
      await search(q)
    } catch (x) {
      const msg = x instanceof Error ? x.message : String(x)
      setErr(`Could not load the model: ${msg}. The first load needs a network connection to cdn.jsdelivr.net and huggingface.co; content blockers or an offline device stop it.`)
      setPhase('error')
      worker.current?.terminate(); worker.current = null
    }
  }

  const fileList = Object.entries(files)
  return (
    <div className="grid gap-3">
      {phase === 'idle' || phase === 'error' ? (
        <Panel title="Opt-in download">
          <p className="text-sm"><Md>{`Loads **Transformers.js ${TJS_VERSION}** from \`cdn.jsdelivr.net\` into a Web Worker, then \`${MODEL_ID}\` (8-bit) from the Hugging Face hub. Download: about **${fmtBytes(MODEL_TOTAL)}** the first time, cached by the browser afterwards. Everything after the download runs on this device.`}</Md></p>
          <div className="mt-2 grid gap-1 text-xs">
            <FieldTable rows={[['model_quantized.onnx', fmtBytes(SZ.model), '384-d sentence embeddings'], ['ONNX Runtime .wasm', fmtBytes(SZ.ortWasm), 'compressed transfer'], ['tokenizer + config', fmtBytes(SZ.tokenizer), 'compressed transfer'], ['transformers.min.js', fmtBytes(SZ.tjsJs), 'compressed transfer']]} />
          </div>
          <div className="mt-2"><Btn primary onClick={load}>{`Load a real embedding model (${fmtBytes(MODEL_TOTAL)})`}</Btn></div>
          {err && <p className="mt-2 text-xs" style={{ color: tone('dead') }}>{err}</p>}
        </Panel>
      ) : null}
      {(phase === 'loading' || phase === 'indexing') && (
        <Panel title={phase === 'loading' ? 'Downloading and compiling' : 'Embedding 12 sentences and building HNSW'}>
          <div className="grid gap-1.5">
            {fileList.length === 0 && <p className="text-xs text-muted">Importing Transformers.js in the worker…</p>}
            {fileList.map(([f, [l, t]]) => (
              <div key={f} className="grid grid-cols-[minmax(0,10rem)_1fr_5rem] items-center gap-2 text-xs">
                <span className="truncate font-mono text-muted">{f}</span>
                <div className="h-3 overflow-hidden rounded bg-surface-2">
                  <motion.div className="h-full" initial={false} animate={{ width: `${t ? (100 * l) / t : 0}%` }} style={{ background: toneBg('new', 60) }} />
                </div>
                <span className="text-right font-mono">{fmtBytes(t)}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {phase === 'ready' && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {QUERIES.map((x) => (
              <button key={x} type="button" onClick={() => { setQ(x); void search(x) }}
                className={`rounded-full border px-2.5 py-1 text-xs ${q === x ? 'border-accent text-accent' : 'border-line text-muted hover:text-ink'}`}>{x}</button>
            ))}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void search(q) }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search text"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-1 text-sm" />
            <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">Search</button>
          </form>
          <Panel title="ORDER BY embedding <#> $1 LIMIT 5">
            <div className="grid gap-1">
              <AnimatePresence initial={false}>
                {hits.map((h, k) => (
                  <motion.div key={h.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
                    <div className="relative overflow-hidden rounded border border-line px-2 py-1">
                      <motion.div className="absolute inset-y-0 left-0" initial={false} animate={{ width: `${Math.max(0, -h.ip) * 100}%` }} style={{ background: toneBg(k === 0 ? 'ok' : 'tuple', 18) }} />
                      <span className="relative">{h.body}</span>
                    </div>
                    <span className="font-mono text-[11px] whitespace-nowrap"><span title="inner product">{(-h.ip).toFixed(3)}</span> <span className="text-muted" title="cosine distance">{'<=>'} {h.cos.toFixed(3)}</span></span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <p className="mt-1.5 text-xs text-muted"><Md>{'Left number: similarity, `-(embedding <#> $1)`. Right: `embedding <=> $1`. For unit vectors **`<=>` = 1 − similarity** up to float rounding, so both operators give the same order.'}</Md></p>
          </Panel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="model ready" value={times.load ? fmtMs(times.load) : '–'} sub="download + compile" />
            <Tile label="embed 12 docs" value={times.batch ? fmtMs(times.batch) : '–'} t="new" sub="one batch" />
            <Tile label="embed query" value={times.embed ? fmtMs(times.embed) : '–'} t="new" />
            <Tile label="SQL search" value={times.sql ? fmtMs(times.sql) : '–'} t="tuple" sub="HNSW, vector_ip_ops" />
          </div>
          {plan && <pre className="overflow-x-auto rounded-lg border border-line bg-code px-3 py-2 font-mono text-[11px] scrollbar-thin">{plan}</pre>}
          <p className="text-xs text-muted"><Md>{'The plan uses the index because `enable_seqscan` is off: on 12 rows the planner would rightly prefer an exact scan.'}</Md></p>
        </>
      )}
      <Legend items={[['new', 'embedding worker'], ['tuple', 'PGlite + HNSW'], ['ok', 'best match']]} />
    </div>
  )
}

/* ======================================================================================== Shell */

function BrowserViz() {
  const [view, setView] = useState<'stack' | 'tabs' | 'persist' | 'model'>('stack')
  return (
    <div className="grid gap-3">
      <Segmented label="View" value={view} onChange={setView} options={[['stack', 'Browser stack'], ['tabs', 'Two tabs'], ['persist', 'Persistence (live)'], ['model', 'Real model (live)']]} />
      {view === 'stack' ? <StackViz /> : view === 'tabs' ? <TabsViz /> : view === 'persist' ? <PersistViz /> : <ModelViz />}
    </div>
  )
}

/* ==================================================================================== Playground */

const SETUP = `SELECT setseed(0.7);
CREATE TABLE topics (topic int PRIMARY KEY, name text NOT NULL);
INSERT INTO topics VALUES (0, 'postgres'), (1, 'cooking'), (2, 'cycling'), (3, 'astronomy'),
                          (4, 'gardening'), (5, 'jazz'), (6, 'finance'), (7, 'chess');
-- 8 topic centres in 384 dimensions (the size of all-MiniLM-L6-v2 embeddings)
CREATE TABLE centers AS
  SELECT t AS topic, array_agg(random() * 2 - 1 ORDER BY j)::real[] AS c
  FROM generate_series(0, 7) t, generate_series(1, 384) j GROUP BY t;
-- 1 000 notes: centre + noise, then scaled to length 1, like normalize: true
CREATE TABLE notes (
  id        int PRIMARY KEY,
  topic     int NOT NULL REFERENCES topics,
  title     text NOT NULL,
  embedding vector(384) NOT NULL
);
INSERT INTO notes
  SELECT i, c.topic, tp.name || ' note #' || i,
         l2_normalize(array_agg(c.c[j] + (random() - 0.5) * 2.4 ORDER BY j)::vector(384))
  FROM generate_series(1, 1000) i
  JOIN centers c ON c.topic = i % 8
  JOIN topics tp ON tp.topic = c.topic
  CROSS JOIN generate_series(1, 384) j
  GROUP BY i, c.topic, tp.name;
-- 8 query vectors, one per topic
CREATE TABLE queries AS
  SELECT q AS qid, c.topic,
         l2_normalize(array_agg(c.c[j] + (random() - 0.5) * 2.4 ORDER BY j)::vector(384)) AS v
  FROM generate_series(1, 8) q
  JOIN centers c ON c.topic = q % 8
  CROSS JOIN generate_series(1, 384) j
  GROUP BY q, c.topic;
ANALYZE;`

export const lesson: Lesson = {
  slug: 'pgvector-in-the-browser',
  module: 'e1',
  order: 7,
  title: 'pgvector in the browser',
  tldr: [
    '**PGlite** is PostgreSQL compiled to WebAssembly: with the `vector` extension it runs pgvector, HNSW indexes included, inside a browser tab, and it stores its files in IndexedDB or OPFS.',
    'Paired with an embedding model running in a Web Worker, it gives semantic search that works offline and never sends the user\'s text or vectors to a server.',
  ],
  visualizer: {
    title: 'The browser stack, byte by byte',
    caption: 'Step through one search from first download to result, then flip to **Return visit**. **Two tabs** shows how PGliteWorker shares one database. The two live views write to IndexedDB and load a real model, only when you click.',
    Component: BrowserViz,
  },
  playground: {
    extensions: ['vector'],
    setup: SETUP,
    presets: [
      { label: 'What is running here',
        sql: `SELECT version();
SELECT extversion AS pgvector FROM pg_extension WHERE extname = 'vector';
SELECT backend_type, count(*) FROM pg_stat_activity GROUP BY backend_type;
SHOW max_parallel_maintenance_workers;`,
        note: 'PostgreSQL 18.6 on **wasm32-unknown-emscripten**, pgvector 0.8.7, and exactly one `standalone backend`: no postmaster, no other connections, no parallel workers. This is the database running in this tab.' },
      { label: '384-d unit vectors',
        sql: `SELECT id, title,
       vector_dims(embedding)                      AS dims,
       pg_column_size(embedding)                   AS bytes,
       round(vector_norm(embedding)::numeric, 6)   AS norm
FROM notes ORDER BY id LIMIT 5;
SELECT pg_size_pretty(pg_table_size('notes')) AS table_size;`,
        note: 'Each embedding is **1544 bytes** (4 × 384 + 8) and has length exactly 1, like `normalize: true` output. A thousand of them take 1.6 MB.' },
      { label: '<#> and <=> agree',
        sql: `WITH q AS (SELECT v FROM queries WHERE qid = 3)
SELECT n.id, n.title,
       round((n.embedding <#> q.v)::numeric, 4)        AS neg_inner_product,
       round((n.embedding <=> q.v)::numeric, 4)        AS cosine_distance,
       round(((n.embedding <=> q.v) - (1 + (n.embedding <#> q.v)))::numeric, 9) AS difference
FROM notes n, q
ORDER BY n.embedding <#> q.v LIMIT 5;
-- same top 10 under both operators, for all 8 queries?
SELECT count(*) AS queries,
       count(*) FILTER (WHERE ip_ids = cos_ids) AS identical_top10
FROM queries q,
  LATERAL (SELECT array_agg(id) AS ip_ids  FROM (SELECT id FROM notes ORDER BY embedding <#> q.v LIMIT 10) s) a,
  LATERAL (SELECT array_agg(id) AS cos_ids FROM (SELECT id FROM notes ORDER BY embedding <=> q.v LIMIT 10) s) b;`,
        note: 'For unit vectors `<=>` is `1 + <#>`: the difference column is under 0.000001 (float32 rounding) and all 8 top-10 lists match. So use `<#>` with `vector_ip_ops`: it skips the norm computation.' },
      { label: 'Exact search is already fast',
        sql: `EXPLAIN (ANALYZE, COSTS OFF, BUFFERS)
SELECT id, title FROM notes
ORDER BY embedding <#> (SELECT v FROM queries WHERE qid = 3)
LIMIT 5;`,
        note: 'Without an index the plan is a **Seq Scan** plus a top-N heapsort over 1 000 rows, in a couple of milliseconds. Many on-device datasets are this small: measure before adding an index.' },
      { label: 'HNSW on 384 dimensions',
        sql: `CREATE INDEX notes_hnsw ON notes USING hnsw (embedding vector_ip_ops);
SELECT pg_size_pretty(pg_relation_size('notes'))      AS heap,
       pg_size_pretty(pg_relation_size('notes_hnsw')) AS hnsw_index;
BEGIN;
SET LOCAL enable_seqscan = off;
EXPLAIN (ANALYZE, COSTS OFF, BUFFERS)
SELECT id, title FROM notes
ORDER BY embedding <#> (SELECT v FROM queries WHERE qid = 3)
LIMIT 5;
COMMIT;`,
        note: 'Note the build time in the status bar: one backend, no parallel workers. The index is about **2008 kB**, larger than the 1600 kB heap. On 1 000 rows the planner still prefers the seq scan, so the transaction switches it off to show the **Index Scan … Order By: (embedding <#> …)**.' },
      { label: 'Wrong operator, no index',
        sql: `BEGIN;
SET LOCAL enable_seqscan = off;
EXPLAIN (COSTS OFF)
SELECT id FROM notes ORDER BY embedding <=> (SELECT v FROM queries WHERE qid = 3) LIMIT 5;
COMMIT;`,
        note: 'Same ranking, but `<=>` belongs to `vector_cosine_ops`, not `vector_ip_ops`: the plan falls back to a sort over a disabled seq scan. The query operator must match the index operator class.' },
      { label: 'What gets persisted',
        sql: `SELECT datname, pg_size_pretty(pg_database_size(oid)) AS size
FROM pg_database ORDER BY pg_database_size(oid) DESC;
SELECT pg_size_pretty(sum(pg_database_size(oid))) AS all_databases FROM pg_database;
SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) AS total
FROM pg_class WHERE relname IN ('notes', 'notes_hnsw', 'centers', 'queries')
ORDER BY pg_total_relation_size(oid) DESC;`,
        note: 'With `idb://` every one of these files lives in IndexedDB: the system catalogs and template databases of a fresh cluster come first, then your tables and indexes. That is why the first open of a new name is several times slower than a reopen.' },
    ],
  },
  production: {
    title: 'A private, offline notes search',
    context: 'A note-taking web app wants "find similar notes" that works on a plane and never uploads note text, for users who keep a few thousand notes each.',
    problem: 'A server-side vector database means sending every note and query to the backend, a network round trip per search, and no search offline. A naive in-browser version froze typing while the model ran and lost the index on every reload.',
    solution: 'Run PGlite with pgvector in a **PGliteWorker** on `idb://notes`, so all tabs share one database and the main thread stays free. Run **Transformers.js** with `all-MiniLM-L6-v2` in a second worker with `pooling: \'mean\', normalize: true`. Store 384-d unit vectors, index them with `vector_ip_ops`, and query with `<#>`. Record the model name next to each vector so a model change triggers re-embedding.',
    sql: `CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS notes (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  body       text NOT NULL,
  model      text NOT NULL DEFAULT 'Xenova/all-MiniLM-L6-v2',
  embedding  vector(384) NOT NULL
);
CREATE INDEX IF NOT EXISTS notes_hnsw ON notes USING hnsw (embedding vector_ip_ops);

-- $1 = the query embedding from the worker, as '[0.012, -0.034, ...]'
SELECT id, body, -(embedding <#> $1) AS similarity
FROM notes
WHERE model = 'Xenova/all-MiniLM-L6-v2'
ORDER BY embedding <#> $1
LIMIT 10;`,
    outcome: 'The first visit downloads about 5 MB of compressed database files and, once, about 29 MB of model and runtime. Every later visit starts from the browser caches with no network. Embedding a query takes on the order of 10 ms on a laptop CPU and the search a few milliseconds, and no note text leaves the device.',
  },
  pitfalls: [
    { title: 'Everything on the main thread',
      symptom: 'The page freezes for seconds while the database starts, an HNSW index builds, or the model embeds a batch.',
      cause: 'WebAssembly runs synchronously on whatever thread calls it. PGlite and ONNX Runtime on the main thread block rendering and input.',
      fix: 'Run PGlite in a Web Worker with `PGliteWorker` (`@electric-sql/pglite/worker`) and the embedding model in its own worker. Pass vectors as transferable `Float32Array`s.' },
    { title: 'Two tabs, two databases',
      symptom: 'Notes saved in one tab are missing in another, or disappear after both tabs are closed.',
      cause: 'PGlite has one exclusive connection. Two plain `PGlite` instances on the same `dataDir` are two separate servers with their own in-memory copy of the files, and each flush can overwrite the other.',
      fix: 'Use `PGliteWorker`. Tabs with the same `id` elect one leader that runs PGlite; the others forward their queries to it. Handle `onLeaderChange` to re-run live queries after a failover.' },
    { title: 'OPFS that works only in some browsers',
      symptom: 'The app works in Chrome and Firefox but fails to start in Safari, or fails on the main thread everywhere.',
      cause: '`opfs-ahp://` needs synchronous access handles, which exist only in workers, and Safari appears to cap open sync access handles at 252 while a Postgres cluster has more than 300 files.',
      fix: 'Use `idb://` unless you control the browser. If you use `opfs-ahp://`, run it inside a worker and fall back to `idb://` on Safari.' },
    { title: 'Changing the model without re-embedding',
      symptom: 'After a model upgrade, search results become nonsense even though nothing errored.',
      cause: 'Vectors from different models live in different spaces. Even with the same dimension, comparing them produces meaningless distances.',
      fix: 'Store the model name with each vector, filter on it, and re-embed old rows in the background when the model changes.',
      sql: `SELECT model, count(*) FROM notes GROUP BY model;` },
  ],
  pointers: [
    'PGlite 0.5.16: `pglite.wasm` 3.24 MB + `pglite.data` 1.85 MB + `initdb.wasm` 0.13 MB gzipped, about 5.2 MB before JS; `vector.tar.gz` adds 51 kB.',
    '`dataDir`: `memory://` (default), `idb://name` (every browser), `opfs-ahp://name` (worker only, not Safari). A fresh cluster is about 40 MB of files.',
    'One connection per database: share it across tabs with `PGliteWorker`, which elects a leader per `id`.',
    'Transformers.js: `pipeline(\'feature-extraction\', \'Xenova/all-MiniLM-L6-v2\')` with `pooling: \'mean\', normalize: true` gives 384-d unit vectors; about 29 MB to download once, then the Cache API.',
    'Unit vectors: `<=>` = 1 + `<#>`, so rank with `<#>` and `vector_ip_ops`. Index basics are in [HNSW](/e1/hnsw); operators in [distance and exact search](/e1/distance-and-exact-search).',
  ],
  sources: ['sql-createextension.html', 'sql-createindex.html', 'storage-file-layout.html', 'functions-admin.html', 'runtime-config-resource.html'],
}
