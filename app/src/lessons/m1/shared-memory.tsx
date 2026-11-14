import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Stat, T, fmtBytes } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a 16-buffer shared buffer pool running PostgreSQL's clock-sweep replacement.
 *  - hit: pin, usage_count + 1 (capped at 5, BM_MAX_USAGE_COUNT)
 *  - miss: take a never-used buffer from the free list, else sweep: skip pinned buffers, decrement
 *    usage_count, and evict the first unpinned buffer whose count is 0. A dirty victim is written by the
 *    backend itself before reuse.
 *  - a bulk-read Buffer Access Strategy keeps a scan inside a small ring and only sets usage_count to 1.
 *  - the background writer cleans dirty, unpinned, usage-0 buffers just ahead of the hand.
 * The shared-memory map uses real pg_shmem_allocations sizes from PostgreSQL 18 with shared_buffers = 128MB.
 * ---------------------------------------------------------------------------------------------- */

const N = 16
const MAXU = 5
const RING = 4
type Rel = 'orders' | 'customers' | 'report'
interface Buf { rel: Rel | null; blk: number; usage: number; pins: number; dirty: boolean }
interface Stats { hits: number; reads: number; evictions: number; backendWrites: number; bgwWrites: number; ckptWrites: number }
interface Pool { bufs: Buf[]; hand: number; path: number[]; dec: number[]; touched: number[]; victims: number[]; ring: number[]; ringPos: number; scanNext: number; stats: Stats; msg: string; seq: number }

const relTone: Record<Rel, Tone> = { orders: 'tuple', customers: 'pointer', report: 'header' }
const HOT: [Rel, number][] = [['orders', 0], ['orders', 1], ['orders', 2], ['orders', 3], ['customers', 0], ['customers', 1], ['orders', 0], ['customers', 2], ['orders', 1], ['orders', 4]]

function initial(): Pool {
  const pre: [Rel, number, number, boolean][] = [
    ['orders', 0, 3, false], ['orders', 1, 2, true], ['customers', 0, 1, false], ['orders', 2, 4, false], ['customers', 1, 0, true], ['orders', 3, 1, false],
    ['customers', 2, 2, false], ['orders', 4, 0, false], ['orders', 5, 1, true], ['customers', 3, 0, false], ['orders', 6, 5, false], ['orders', 7, 1, false],
  ]
  const bufs: Buf[] = Array.from({ length: N }, (_, k) => {
    const p = pre[k]
    return p ? { rel: p[0], blk: p[1], usage: p[2], pins: 0, dirty: p[3] } : { rel: null, blk: 0, usage: 0, pins: 0, dirty: false }
  })
  return { bufs, hand: 0, path: [0], dec: [], touched: [], victims: [], ring: [], ringPos: 0, scanNext: 0, seq: 0,
    stats: { hits: 0, reads: 0, evictions: 0, backendWrites: 0, bgwWrites: 0, ckptWrites: 0 },
    msg: '12 of 16 buffers hold pages, 4 are still on the **free list**. The clock hand points at buffer 0.' }
}

const label = (b: Buf) => (b.rel ? `${b.rel}/${b.blk}` : 'free')
const clone = (p: Pool): Pool => ({ ...p, bufs: p.bufs.map((b) => ({ ...b })), stats: { ...p.stats }, path: [p.hand], dec: [], touched: [], victims: [], ring: [...p.ring] })

/** Clock sweep: returns the victim buffer id and mutates usage counts / hand on the cloned pool. */
function sweep(p: Pool, notes: string[]): number {
  for (let guard = 0; guard < N * (MAXU + 2); guard++) {
    const id = p.hand % N
    const b = p.bufs[id]
    p.hand++; p.path.push(p.hand)
    if (b.pins > 0) { if (!notes.includes(`skip pinned ${id}`)) notes.push(`skip pinned ${id}`); continue }
    if (b.usage > 0) { b.usage--; p.dec.push(id); continue }
    return id
  }
  throw new Error('every buffer is pinned')
}

function load(p0: Pool, rel: Rel, blk: number, opts: { dirty?: boolean; ring?: boolean }): { p: Pool; text: string } {
  const p = p0
  const at = p.bufs.findIndex((b) => b.rel === rel && b.blk === blk)
  const tag = `${rel}/${blk}`
  if (at >= 0) {
    const b = p.bufs[at]
    p.stats.hits++
    b.usage = opts.ring ? Math.max(b.usage, 1) : Math.min(MAXU, b.usage + 1)
    if (opts.dirty) b.dirty = true
    p.touched.push(at)
    return { p, text: `**hit** on \`${tag}\` in buffer ${at}: usage_count → ${b.usage}${opts.dirty ? ', now **dirty**' : ''}.` }
  }
  p.stats.reads++
  const notes: string[] = []
  let id = -1
  let how = ''
  // 1. strategy ring: reuse the ring's next buffer if nobody else is using it
  if (opts.ring && p.ring.length === RING) {
    const cand = p.ring[p.ringPos % RING]
    const b = p.bufs[cand]
    if (b.pins === 0 && b.usage <= 1) { id = cand; how = `reused ring buffer ${cand}` }
  }
  // 2. free list
  if (id < 0) {
    const free = p.bufs.findIndex((b) => b.rel === null)
    if (free >= 0) { id = free; how = `took buffer ${free} from the free list` }
  }
  // 3. clock sweep
  if (id < 0) { id = sweep(p, notes); how = `clock sweep chose buffer ${id}${p.dec.length ? ` after ${p.dec.length} decrement${p.dec.length > 1 ? 's' : ''}` : ''}` }
  if (opts.ring) {
    if (p.ring.length < RING) p.ring.push(id)
    else p.ring[p.ringPos % RING] = id
    p.ringPos++
  }
  const v = p.bufs[id]
  let extra = ''
  if (v.rel) {
    p.stats.evictions++; p.victims.push(id)
    extra = ` Evicted \`${label(v)}\``
    if (v.dirty) { p.stats.backendWrites++; extra += ', which was **dirty**, so this backend had to **flush WAL and write it** first' }
    extra += '.'
  }
  p.bufs[id] = { rel, blk, usage: 1, pins: 0, dirty: !!opts.dirty }
  p.touched.push(id)
  return { p, text: `**miss** on \`${tag}\`: ${how}.${extra}${notes.length ? ` (${notes.join(', ')})` : ''}` }
}

const MEM: [string, number, Tone, string][] = [
  ['Buffer Blocks', 134221824, 'tuple', '16384 pages × 8 kB'],
  ['XLOG Ctl', 4208256, 'new', 'wal_buffers = 512 × 8 kB'],
  ['AIO handles', 4107008, 'header', 'PG18 asynchronous I/O'],
  ['anonymous', 2801024, 'muted', 'hash tables, locks, misc'],
  ['unused', 2514688, 'free', 'not yet allocated'],
  ['SLRU caches', 1865984, 'pointer', 'pg_xact 517 kB + 6 others'],
  ['Buffer Descriptors', 1048576, 'accent', '16384 × 64 B'],
  ['Checkpointer', 852096, 'ok', 'fsync queue + buffer ids'],
  ['other', 1472640, 'muted', 'stats, PGPROC, sinval, …'],
]
const MEM_TOTAL = MEM.reduce((s, m) => s + m[1], 0)

function MemMap() {
  return (
    <Panel title={`Main shared memory segment: ${fmtBytes(MEM_TOTAL)} (pg_shmem_allocations, shared_buffers = 128MB)`}>
      <div className="flex h-6 w-full overflow-hidden rounded border border-line">
        {MEM.map(([n, sz, t]) => (
          <motion.div key={n} title={`${n}: ${fmtBytes(sz)}`} initial={false} animate={{ width: `${(sz / MEM_TOTAL) * 100}%` }}
            style={{ background: t === 'free' ? 'var(--c-free)' : toneBg(t, 55), borderRight: '1px solid var(--surface)' }} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 font-mono text-[11px] sm:grid-cols-2">
        {MEM.map(([n, sz, t, d]) => (
          <div key={n} className="flex items-baseline gap-1.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: t === 'free' ? 'var(--c-free)' : toneBg(t, 70), border: '1px solid var(--border)' }} />
            <span className="font-semibold whitespace-nowrap">{n}</span><span className="whitespace-nowrap">{fmtBytes(sz)}</span><span className="truncate font-sans text-muted">{d}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Buffer pages are <b className="text-ink">88%</b> of the segment. Everything else is bookkeeping: one 64-byte descriptor per buffer, WAL buffers, the commit-log cache, lock tables. Per-backend memory (<code className="inline-code">work_mem</code>, catalog caches) is <i>not</i> here.</p>
    </Panel>
  )
}

const CX = 256, CY = 256, R = 214, BW = 74, BH = 44
const ang = (k: number) => (-90 + (k * 360) / N) * (Math.PI / 180)
const pos = (k: number) => ({ x: CX + R * Math.cos(ang(k)) - BW / 2, y: CY + R * Math.sin(ang(k)) - BH / 2 })

function Ring({ p, sel, onSel }: { p: Pool; sel: number | null; onSel: (k: number) => void }) {
  const angles = p.path.map((h) => (h * 360) / N)
  const dur = Math.min(2.2, 0.12 * Math.max(1, angles.length - 1))
  return (
    <svg viewBox="0 0 512 512" className="mx-auto w-full min-w-[400px] max-w-[540px]" role="img" aria-label="Clock-sweep buffer ring">
      <circle cx={CX} cy={CY} r={R - 40} fill="none" stroke="var(--border)" strokeDasharray="3 5" />
      {/* hand */}
      <g transform={`translate(${CX} ${CY})`}>
        <motion.g key={p.seq} initial={{ rotate: angles[0] }} animate={{ rotate: angles }} transition={{ duration: dur, ease: 'linear' }}>
          {/* transparent disc keeps the bounding box centred on the pivot, so the default origin is the centre */}
          <circle cx={0} cy={0} r={R - 62} fill="transparent" />
          <line x1={0} y1={0} x2={0} y2={-(R - 62)} stroke={tone('accent')} strokeWidth={3} strokeLinecap="round" />
          <circle cx={0} cy={-(R - 62)} r={4} fill={tone('accent')} />
        </motion.g>
      </g>
      <circle cx={CX} cy={CY} r={7} fill={tone('accent')} />
      <T x={CX} y={CY + 30} size={10.5} anchor="middle" fill="var(--muted)">clock hand</T>
      <T x={CX} y={CY + 45} size={10.5} anchor="middle" fill="var(--muted)">next victim = {p.hand % N}</T>
      {p.bufs.map((b, k) => {
        const { x, y } = pos(k)
        const t: Tone = b.rel ? relTone[b.rel] : 'free'
        const isRing = p.ring.includes(k)
        const flash = p.touched.includes(k)
        const victim = p.victims.includes(k)
        return (
          <motion.g key={k} onClick={() => onSel(k)} style={{ cursor: 'pointer' }} animate={{ scale: flash ? [1, 1.08, 1] : 1 }} transition={{ duration: 0.5, delay: flash ? dur : 0 }}>
            <rect x={x} y={y} width={BW} height={BH} rx={6} fill={b.rel ? toneBg(t, 20) : 'var(--c-free)'} stroke={b.dirty ? tone('dead') : victim ? tone('new') : b.rel ? tone(t) : 'var(--border)'}
              strokeWidth={sel === k ? 3 : b.dirty || victim ? 2 : 1} strokeDasharray={b.rel ? undefined : '4 3'} />
            {isRing && <rect x={x - 3} y={y - 3} width={BW + 6} height={BH + 6} rx={8} fill="none" stroke={tone('header')} strokeDasharray="2 3" />}
            <T x={x + 5} y={y + 13} size={9.5} fill="var(--muted)">{k}</T>
            {b.dirty && <T x={x + BW - 5} y={y + 13} size={9.5} w={700} fill={tone('dead')} anchor="end">dirty</T>}
            {b.pins > 0 && <T x={x + BW - 5} y={y + 13} size={9.5} w={700} fill={tone('new')} anchor="end">{b.dirty ? '' : `pin ${b.pins}`}</T>}
            <T x={x + BW / 2} y={y + 28} size={10.5} w={700} anchor="middle" fill={b.rel ? 'var(--text)' : 'var(--muted)'}>{label(b)}</T>
            {b.rel && [...Array(MAXU).keys()].map((u) => (
              <motion.rect key={u} x={x + 7 + u * 11.5} y={y + 33} width={9} height={6} rx={1.5} initial={false}
                animate={{ fill: u < b.usage ? tone(t) : 'var(--border)' }} transition={{ delay: p.dec.includes(k) ? 0 : dur }} />
            ))}
            {p.dec.includes(k) && <T x={x + BW + 2} y={y + 44} size={9.5} w={700} fill={tone('accent')}>−{p.dec.filter((d) => d === k).length}</T>}
          </motion.g>
        )
      })}
    </svg>
  )
}

function ShmemViz() {
  const [p, setP] = useState<Pool>(initial)
  const [ringOn, setRingOn] = useState<'ring' | 'none'>('ring')
  const [sel, setSel] = useState<number | null>(null)
  const [hot, setHot] = useState(0)
  const act = (fn: (q: Pool) => string) => setP((old) => { const q = clone(old); q.seq = old.seq + 1; q.msg = fn(q); return q })

  const read = (dirty: boolean) => {
    const [rel, blk] = HOT[hot % HOT.length]
    setHot((h) => h + 1)
    act((q) => load(q, rel, blk, { dirty }).text)
  }
  const scan = () => act((q) => {
    const start = q.scanNext
    const ev: string[] = []
    for (let i = 0; i < 6; i++) {
      const before = q.bufs.map(label)
      load(q, 'report', q.scanNext++, { ring: ringOn === 'ring' })
      q.bufs.forEach((b, k) => { if (before[k] !== label(b) && before[k] !== 'free' && !before[k].startsWith('report')) ev.push(before[k]) })
    }
    return ringOn === 'ring'
      ? `Sequential scan of \`report\` blocks ${start}–${q.scanNext - 1} through a **${RING}-buffer ring**${ev.length ? `: evicted only ${ev.map((e) => `\`${e}\``).join(', ')} while filling the ring` : ''}. The hot set survives.`
      : `Sequential scan of \`report\` blocks ${start}–${q.scanNext - 1} with **no ring**: evicted ${ev.length ? ev.map((e) => `\`${e}\``).join(', ') : 'nothing yet'}. Every new page enters with usage_count 1 and pushes hot pages out.`
  })
  const bgwriter = () => act((q) => {
    let written = 0
    const ids: number[] = []
    for (let i = 0; i < 8 && written < 4; i++) {
      const id = (q.hand + i) % N
      const b = q.bufs[id]
      if (b.rel && b.dirty && b.pins === 0 && b.usage === 0) { b.dirty = false; written++; ids.push(id); q.touched.push(id) }
    }
    q.stats.bgwWrites += written
    return written
      ? `**Background writer** looked ahead of the hand and wrote ${written} dirty buffer${written > 1 ? 's' : ''} (${ids.join(', ')}) with usage_count 0. When the sweep reaches them they can be reused without a backend write.`
      : '**Background writer** found no dirty, unpinned buffers with usage_count 0 just ahead of the hand, so it wrote nothing. Recently used dirty pages are left for the checkpointer.'
  })
  const checkpoint = () => act((q) => {
    const ids = q.bufs.map((b, k) => (b.dirty ? k : -1)).filter((k) => k >= 0)
    ids.forEach((k) => { q.bufs[k].dirty = false; q.touched.push(k) })
    q.stats.ckptWrites += ids.length
    return ids.length ? `**Checkpoint** wrote all ${ids.length} dirty buffers (${ids.join(', ')}), whatever their usage count. They stay cached, now clean.` : '**Checkpoint**: no dirty buffers, nothing to write.'
  })
  const togglePin = () => { if (sel === null) return; act((q) => { const b = q.bufs[sel]; if (!b.rel) return 'Free buffers cannot be pinned.'; b.pins = b.pins ? 0 : 1; return b.pins ? `Buffer ${sel} is now **pinned** (a cursor holds it). The sweep must skip it, and it can never be evicted while pinned.` : `Buffer ${sel} unpinned.` }) }

  const s = p.stats
  const ratio = s.hits + s.reads ? Math.round((100 * s.hits) / (s.hits + s.reads)) : 0
  const b = sel !== null ? p.bufs[sel] : null
  const hotLeft = useMemo(() => p.bufs.filter((x) => x.rel === 'orders' || x.rel === 'customers').length, [p])

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => read(false)}>Read a hot page</Btn>
        <Btn onClick={() => read(true)}>UPDATE a hot page</Btn>
        <Btn onClick={scan} t="header">Seq scan 6 report pages</Btn>
        <Segmented label="Buffer access strategy" value={ringOn} onChange={setRingOn} options={[['ring', 'ring on'], ['none', 'ring off']]} />
        <Btn onClick={bgwriter} t="pointer">bgwriter round</Btn>
        <Btn onClick={checkpoint} t="ok">CHECKPOINT</Btn>
        <Btn onClick={() => { setP(initial()); setSel(null); setHot(0) }}>Reset</Btn>
      </div>
      <div className="min-h-[52px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
        <AnimatePresence mode="wait"><motion.p key={p.seq} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Md>{p.msg}</Md></motion.p></AnimatePresence>
      </div>
      <Legend items={[['tuple', 'orders page'], ['pointer', 'customers page'], ['header', 'report page / strategy ring'], ['dead', 'dirty'], ['new', 'just evicted / pinned'], ['accent', 'clock hand, usage_count −1']]} />
      <div className="grid items-start gap-3 md:grid-cols-[minmax(400px,1.35fr)_minmax(0,0.75fr)]">
        <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin"><Ring p={p} sel={sel} onSel={setSel} /></div>
        <div className="grid gap-2">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="hits" value={s.hits} t="ok" /><Stat label="reads" value={s.reads} /><Stat label="hit ratio" value={`${ratio}%`} />
            <Stat label="evictions" value={s.evictions} /><Stat label="backend writes" value={s.backendWrites} t={s.backendWrites ? 'dead' : undefined} /><Stat label="hot cached" value={hotLeft} t="tuple" />
            <Stat label="bgwriter writes" value={s.bgwWrites} t="pointer" /><Stat label="checkpoint writes" value={s.ckptWrites} t="ok" /><Stat label="ring buffers" value={p.ring.length ? `${p.ring.length} of ${RING}` : '—'} t="header" />
          </div>
          <Panel title={b ? `Buffer descriptor ${sel}` : 'Buffer descriptor'}>
            {b ? (
              <>
                <FieldTable rows={[
                  ['tag', b.rel ? `(${b.rel}, main, block ${b.blk})` : '—', 'relfilenode, fork, block'],
                  ['usage_count', `${b.usage} / ${MAXU}`, 'clock-sweep credit'],
                  ['refcount', String(b.pins), 'pins by backends'],
                  ['dirty', b.dirty ? 'yes' : 'no', b.dirty ? 'must be written before reuse' : 'disk copy is current'],
                ]} />
                <div className="mt-2"><Btn onClick={togglePin} disabled={!b.rel}>{b.pins ? 'Unpin' : 'Pin (hold with a cursor)'}</Btn></div>
              </>
            ) : <p className="text-sm text-muted">Click a buffer to inspect its descriptor and pin it.</p>}
          </Panel>
        </div>
      </div>
      <MemMap />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'shared-memory',
  module: 'm1',
  order: 3,
  title: 'Shared memory: buffers, WAL buffers and the commit log',
  tldr: [
    'At startup the postmaster allocates one **shared memory** segment that every process maps: the **shared buffer pool** of 8 kB pages, the **WAL buffers**, the **commit-log (pg_xact) cache** and the lock tables.',
    'Disk is slow and backends are separate processes, so they share one cache of hot pages and pick victims with a cheap **clock-sweep** algorithm instead of each keeping its own copy.',
  ],
  visualizer: {
    title: 'The buffer pool and its clock sweep',
    caption: 'Read and update hot pages, then run a large sequential scan with the ring **off** and watch the hot set get evicted. Reset, scan with the ring **on**, and compare. Click a buffer to pin it.',
    Component: ShmemViz,
  },
  playground: {
    extensions: ['pg_buffercache'],
    setup: `
CREATE TABLE orders AS
SELECT g AS id, (g % 100) AS customer_id, md5(g::text) AS note
FROM generate_series(1, 20000) g;
VACUUM orders;
CHECKPOINT;
SELECT pg_buffercache_evict_relation('orders');`,
    presets: [
      { label: 'Buffer pool summary', sql: `SELECT current_setting('shared_buffers') AS shared_buffers,
       current_setting('block_size') AS block_size;

SELECT * FROM pg_buffercache_summary();
SELECT * FROM pg_buffercache_usage_counts();`,
        note: '16384 buffers of 8 kB = 128 MB. Usage counts run from 0 to **5**. Most buffers are still unused in a fresh instance.' },
      { label: 'First scan: reads from disk', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM orders;

SELECT count(*) AS buffers, min(usagecount), max(usagecount)
FROM pg_buffercache WHERE relfilenode = pg_relation_filenode('orders');`,
        note: 'The setup evicted `orders`, so all 192 pages are `shared read`. Each page now sits in a buffer with `usagecount = 1`.' },
      { label: 'Second scan: all hits', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM orders;

SELECT usagecount, count(*) AS buffers
FROM pg_buffercache WHERE relfilenode = pg_relation_filenode('orders')
GROUP BY 1 ORDER BY 1;`,
        note: 'Now `shared hit=192`. Every access bumped `usagecount` by one: this is the credit the clock sweep spends before evicting a page.' },
      { label: 'UPDATE makes pages dirty', sql: `UPDATE orders SET note = 'changed' WHERE id <= 300;

SELECT count(*) FILTER (WHERE isdirty) AS dirty, count(*) AS cached
FROM pg_buffercache WHERE relfilenode = pg_relation_filenode('orders');`,
        note: 'Changed pages are **dirty** in memory. The table file on disk is not touched yet; the WAL record is what makes the change durable.' },
      { label: 'CHECKPOINT cleans them', sql: `CHECKPOINT;

SELECT count(*) FILTER (WHERE isdirty) AS dirty, count(*) AS cached
FROM pg_buffercache WHERE relfilenode = pg_relation_filenode('orders');`,
        note: 'The checkpoint wrote every dirty buffer. The pages stay cached, now clean, so the next read is still a hit.' },
      { label: 'Evict and look again', sql: `SELECT * FROM pg_buffercache_evict_relation('orders');

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM orders WHERE customer_id = 7;`,
        note: 'Eviction drops the pages from shared buffers (a developer tool, new in 18). The next scan reads them back: `shared read` again.' },
      { label: 'Hit ratio, computed honestly', sql: `SELECT pg_stat_force_next_flush();

SELECT relname, heap_blks_read, heap_blks_hit,
       heap_blks_hit / nullif(heap_blks_hit + heap_blks_read, 0)                  AS integer_math,
       round(100.0 * heap_blks_hit / nullif(heap_blks_hit + heap_blks_read, 0), 1) AS hit_pct
FROM pg_statio_user_tables WHERE relname = 'orders';

SELECT backend_type, context, reads, hits,
       round(100.0 * hits / nullif(hits + reads, 0), 1) AS hit_pct
FROM pg_stat_io WHERE object = 'relation' AND hits + reads > 0 ORDER BY reads DESC;`,
        note: 'The counters are bigint, so `hit / (hit + read)` truncates to **0**; multiply by `100.0` first. `nullif` avoids a division by zero on a table nobody has read yet. `pg_stat_io` shows the same ratio per process type and context.' },
      { label: 'Shared memory map', sql: `SELECT coalesce(name, '(unused)') AS name, pg_size_pretty(allocated_size) AS size
FROM pg_shmem_allocations ORDER BY allocated_size DESC LIMIT 8;

SELECT name, setting, unit FROM pg_settings
WHERE name IN ('shared_buffers', 'wal_buffers', 'transaction_buffers', 'work_mem', 'maintenance_work_mem', 'temp_buffers', 'huge_pages')
ORDER BY name;`,
        note: '`Buffer Blocks` is the page pool. `XLOG Ctl` holds the 4 MB of WAL buffers (auto = 1/32 of shared_buffers). `transaction` is the pg_xact commit-log cache.' },
    ],
  },
  production: {
    title: 'A nightly report that flushed the cache',
    context: 'An order service keeps a few GB of hot pages (recent orders, customers) in a 16 GB `shared_buffers`. A nightly job reads a 200 GB archive table.',
    problem: 'Right after the job started, p95 latency of the order API tripled and `pg_stat_io` showed reads jumping for client backends. The report walked the archive through an **index scan**. Only large sequential scans get the bulk-read ring, so every archive page entered the pool like a normal page and the clock sweep pushed the hot set out.',
    solution: 'Measure what is cached, make the report scan sequentially (or move it to a replica), and warm the hot set back after the job with `pg_prewarm`, which **loads** a relation into shared buffers. It is a common mistake to call it to clear the cache; eviction is `pg_buffercache_evict_relation()`.',
    sql: `-- what is cached right now
SELECT c.relname, count(*) AS buffers, round(avg(b.usagecount), 1) AS avg_usage
FROM pg_buffercache b JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)
WHERE b.reldatabase IN (0, (SELECT oid FROM pg_database WHERE datname = current_database()))
GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
-- per backend type hit ratio
SELECT backend_type, round(100.0 * hits / nullif(hits + reads, 0), 1) AS hit_pct
FROM pg_stat_io WHERE object = 'relation' AND context = 'normal' AND hits + reads > 0;
-- after the job: reload the hot tables (pg_prewarm extension)
SELECT pg_prewarm('orders'), pg_prewarm('customers');`,
    outcome: 'With the report on a replica, the hot set stayed resident on the primary through the night, client-backend reads in `pg_stat_io` stayed flat, and the API latency spike disappeared.',
  },
  pitfalls: [
    { title: 'Giving shared_buffers most of the RAM',
      symptom: 'With `shared_buffers` at 75% of RAM the server swaps, or the OOM killer strikes when many sorts run at once.',
      cause: 'PostgreSQL also relies on the OS page cache, and every backend needs private memory for sorts and hashes. Pages cached twice waste RAM.',
      fix: 'Start at **25% of RAM** on a dedicated server; going above 40% rarely helps. Raise `max_wal_size` with it, and enable huge pages for large pools.' },
    { title: 'work_mem multiplied by everything',
      symptom: 'Setting `work_mem = 1GB` globally looks fine in testing, then production runs out of memory.',
      cause: '`work_mem` is per sort or hash **node**, per backend and per parallel worker. Hash nodes may use `work_mem × hash_mem_multiplier` (2.0). Ten nodes × 100 sessions is 1,000 allocations.',
      fix: 'Keep the global value modest and raise it for the one query that needs it: `SET LOCAL work_mem = \'256MB\'` inside its transaction.' },
    { title: 'Trusting one global hit ratio',
      symptom: 'A dashboard shows a 99% buffer hit ratio while one important query is slow from disk reads.',
      cause: 'A global ratio averages many cheap hits on hot pages with the few expensive misses that matter. A hit in shared buffers can also be a miss that the OS cache served cheaply, so the ratio does not equal disk I/O.',
      fix: 'Look per query with `EXPLAIN (ANALYZE, BUFFERS)`, per backend type in `pg_stat_io`, and per statement in `pg_stat_statements` (`shared_blks_read`).' },
    { title: 'A hit-ratio query that lies',
      symptom: 'A monitoring query reports a hit ratio of exactly 0 (or 100) for every table, or fails with `division by zero` right after a restart or a stats reset.',
      cause: '`pg_statio_*` and `pg_stat_io` counters are bigint, so `hits * 100 / (hits + reads)` is integer division and truncates. A fresh instance has `hits + reads = 0`. Home-grown formulas such as `(hit - read) / hit` are not a ratio at all.',
      fix: 'Use `round(100.0 * hit / nullif(hit + read, 0), 1)`, and read it per table or per backend type rather than as one global number.' },
    { title: 'Transparent huge pages',
      symptom: 'Random latency stalls on Linux with a large `shared_buffers`.',
      cause: 'Transparent huge pages (THP) compaction can stall processes. PostgreSQL only benefits from **explicit** huge pages.',
      fix: 'Disable THP, reserve huge pages with `vm.nr_hugepages` from `postgres -C shared_memory_size_in_huge_pages`, and set `huge_pages = on` to fail fast if they are missing.' },
  ],
  pointers: [
    '`shared_buffers` (default 128MB) is a pool of 8 kB pages shared by all processes. Start at **25% of RAM**.',
    'Each buffer has a descriptor: **tag, refcount (pins), usage_count 0–5, dirty flag**.',
    '**Clock sweep**: skip pinned buffers, decrement usage counts, evict the first unpinned buffer at 0. A dirty victim must be written first.',
    'Large scans, VACUUM and COPY use a small **buffer access strategy ring** so they cannot flush the cache.',
    'Also in shared memory: **WAL buffers** (1/32 of shared_buffers, max 16 MB) and **SLRU caches** such as `pg_xact`. `work_mem` is per backend, not shared.',
  ],
  sources: ['runtime-config-resource.html', 'runtime-config-wal.html', 'pgbuffercache.html', 'view-pg-shmem-allocations.html', 'glossary.html', 'monitoring-stats.html', 'kernel-resources.html', 'storage-file-layout.html'],
}
