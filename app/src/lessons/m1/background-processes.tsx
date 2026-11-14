import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { T } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one UPDATE followed through every background process that touches it.
 * Processes on the left, shared memory in the middle, disk on the right. Each step lights the
 * process that acts, animates where its data flows, and lists the GUCs (PostgreSQL 18 defaults)
 * and the statistics counters that record it. LSNs and segment names are illustrative but well-formed.
 * ---------------------------------------------------------------------------------------------- */

type P = 'backend' | 'io' | 'walwriter' | 'bgwriter' | 'checkpointer' | 'autovacuum' | 'archiver' | 'logger'
type Region = 'buffers' | 'walbuf' | 'stats' | 'datafile' | 'pgwal' | 'archive'
interface S {
  active: P[]; flows: [P | Region, Region | P, string][]
  dirty: number[]; cached: number[]; wal: number; walFlushed: number; segs: number; archived: number; worker: boolean
  gucs: [string, string, string][]; view: [string, string][]; viewName: string; datafileWritten: number[]
}

const PROCS: [P, string, string][] = [
  ['backend', 'client backend', 'runs your SQL'],
  ['io', 'io worker ×3', 'PG18 AIO reads'],
  ['walwriter', 'walwriter', 'flushes WAL'],
  ['bgwriter', 'background writer', 'cleans buffers'],
  ['checkpointer', 'checkpointer', 'checkpoints'],
  ['autovacuum', 'autovacuum', 'launcher + workers'],
  ['archiver', 'archiver', 'copies WAL out'],
  ['logger', 'logger', 'writes the log'],
]
const procY = (k: number) => 14 + k * 44
const PI = (p: P) => PROCS.findIndex((x) => x[0] === p)

const base: Omit<S, 'active' | 'flows' | 'gucs' | 'view' | 'viewName'> = { dirty: [], cached: [0, 1, 2, 3, 8, 9], wal: 0, walFlushed: 0, segs: 2, archived: 1, worker: false, datafileWritten: [] }
const st = (o: Partial<S>): S => ({ ...base, active: [], flows: [], gucs: [], view: [], viewName: '', ...o })

const steps: Step<S>[] = [
  { title: 'The crew at rest', body: 'Besides one **backend** per client, the postmaster keeps a fixed crew of **auxiliary processes**. Each sleeps in its main loop until a timer or a request wakes it.',
    state: st({ active: ['walwriter', 'bgwriter', 'checkpointer', 'autovacuum', 'archiver', 'logger', 'io'], viewName: 'pg_stat_activity',
      view: [['checkpointer', 'wait_event = CheckpointerMain'], ['background writer', 'BgwriterHibernate'], ['walwriter', 'WalWriterMain'], ['autovacuum launcher', 'AutovacuumMain'], ['io worker', 'IoWorkerMain']],
      gucs: [['max_worker_processes', '8', 'slots for background workers'], ['logging_collector', 'off', 'logger process only when on'], ['archive_mode', 'off', 'archiver only when on']] }) },
  { title: 'Reads go through I/O workers (PG18)', body: 'The backend scans `orders`. With `io_method = worker` it queues **asynchronous reads**, and the **io workers** perform them, so several pages are in flight at once. The pages land in **shared buffers**.',
    state: st({ active: ['backend', 'io'], flows: [['backend', 'buffers', 'request'], ['datafile', 'io', 'readv'], ['io', 'buffers', 'pages']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      gucs: [['io_method', 'worker', 'worker / io_uring / sync, restart needed'], ['io_workers', '3', 'number of io worker processes'], ['effective_io_concurrency', '16', 'reads kept in flight']],
      viewName: 'pg_stat_io (backend_type = io worker)', view: [['object', 'relation'], ['context', 'normal'], ['reads', '+12']] }) },
  { title: 'UPDATE: dirty pages and WAL records', body: 'The backend changes 3 pages **in memory only**, marking them **dirty**. Before each change it inserts a **WAL record** into the WAL buffers. The table file on disk is untouched.',
    state: st({ active: ['backend'], flows: [['backend', 'buffers', 'modify'], ['backend', 'walbuf', 'WAL insert']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], dirty: [2, 5, 9], wal: 3,
      gucs: [['wal_buffers', '-1 → 4MB', '1/32 of shared_buffers, max one segment'], ['full_page_writes', 'on', 'first change after a checkpoint logs the whole page']],
      viewName: 'pg_stat_wal', view: [['wal_records', '+3'], ['wal_fpi', '+3 (first touch since checkpoint)']] }) },
  { title: 'COMMIT: the backend flushes WAL itself', body: 'With `synchronous_commit = on` the committing backend **writes and fsyncs WAL** up to its commit record and only then reports success. That is the durability point. The dirty data pages stay in memory.',
    state: st({ active: ['backend'], flows: [['walbuf', 'pgwal', 'write + fsync']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], dirty: [2, 5, 9], wal: 4, walFlushed: 4,
      gucs: [['synchronous_commit', 'on', 'wait for local WAL flush'], ['commit_delay', '0', 'group commit wait (µs)'], ['wal_sync_method', 'fdatasync', 'Linux default']],
      viewName: 'pg_stat_io (object = wal)', view: [['writes', '+1'], ['fsyncs', '+1']] }) },
  { title: 'walwriter: WAL in the background', body: 'Transactions with `synchronous_commit = off` and bulk operations leave WAL unflushed. The **walwriter** wakes every `wal_writer_delay` and flushes it, which bounds the loss window to about **3 × 200 ms**.',
    state: st({ active: ['walwriter'], flows: [['walbuf', 'walwriter', ''], ['walwriter', 'pgwal', 'write + fsync']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], dirty: [2, 5, 9, 10], wal: 6, walFlushed: 6,
      gucs: [['wal_writer_delay', '200ms', 'sleep between flushes'], ['wal_writer_flush_after', '1MB', 'flush once this much is written']],
      viewName: 'pg_stat_io (backend_type = walwriter)', view: [['object', 'wal'], ['writes', '+1']] }) },
  { title: 'bgwriter: keep clean buffers ready', body: 'Every `bgwriter_delay` the **background writer** looks just ahead of the clock-sweep hand and writes dirty buffers that are about to be reused. Then a backend that needs a free buffer finds a clean one and does not have to write it.',
    state: st({ active: ['bgwriter'], flows: [['buffers', 'bgwriter', ''], ['bgwriter', 'datafile', 'write']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], dirty: [2, 5, 9], wal: 6, walFlushed: 6, datafileWritten: [10],
      gucs: [['bgwriter_delay', '200ms', 'sleep between rounds'], ['bgwriter_lru_maxpages', '100', 'max writes per round (0 = off)'], ['bgwriter_lru_multiplier', '2.0', 'how far ahead of demand to clean']],
      viewName: 'pg_stat_bgwriter', view: [['buffers_clean', '+1'], ['maxwritten_clean', '0'], ['buffers_alloc', '+12']] }) },
  { title: 'Statistics: counters in shared memory', body: 'Each process keeps counters locally and flushes them to the **cumulative statistics** area in shared memory when it goes idle, at most once a second. They are saved to `pg_stat/` on a clean shutdown and reset after a crash.',
    state: st({ active: ['backend'], flows: [['backend', 'stats', 'flush']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], dirty: [2, 5, 9], wal: 6, walFlushed: 6, datafileWritten: [10],
      gucs: [['track_counts', 'on', 'needed by autovacuum'], ['track_io_timing', 'off', 'adds I/O time columns'], ['stats_fetch_consistency', 'cache', 'values stable within a transaction']],
      viewName: 'pg_stat_user_tables (orders)', view: [['n_tup_upd', '+12,000'], ['n_dead_tup', '12,000'], ['n_live_tup', '50,000']] }) },
  { title: 'autovacuum: launcher starts a worker', body: 'The **launcher** wakes every `autovacuum_naptime` and checks each table. `orders` has 12,000 dead tuples, over its threshold of 50 + 0.2 × 50,000 = **10,050**, so a **worker** is started to VACUUM it.',
    state: st({ active: ['autovacuum'], worker: true, flows: [['stats', 'autovacuum', 'n_dead_tup'], ['autovacuum', 'buffers', 'VACUUM']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], dirty: [2, 5, 9, 1, 6], wal: 7, walFlushed: 6, datafileWritten: [10],
      gucs: [['autovacuum_naptime', '1min', 'per-database check interval'], ['autovacuum_max_workers', '3', 'concurrent workers'], ['autovacuum_vacuum_threshold', '50', 'base dead tuples'], ['autovacuum_vacuum_scale_factor', '0.2', '× reltuples']],
      viewName: 'pg_stat_user_tables (orders)', view: [['n_dead_tup', '12,000 → 0'], ['last_autovacuum', 'now()'], ['autovacuum_count', '+1']] }) },
  { title: 'Checkpoint: write every dirty page', body: 'Every `checkpoint_timeout`, or when WAL reaches `max_wal_size`, the **checkpointer** writes **all** dirty buffers. It spreads the writes over 90% of the interval, then fsyncs the data files.',
    state: st({ active: ['checkpointer'], flows: [['buffers', 'checkpointer', ''], ['checkpointer', 'datafile', 'write + fsync']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], dirty: [], wal: 7, walFlushed: 7, datafileWritten: [1, 2, 5, 6, 9, 10],
      gucs: [['checkpoint_timeout', '5min', 'time-based trigger'], ['max_wal_size', '1GB', 'WAL-volume trigger'], ['checkpoint_completion_target', '0.9', 'spread writes over 90%']],
      viewName: 'pg_stat_checkpointer', view: [['num_timed', '+1'], ['buffers_written', '+5'], ['write_time / sync_time', 'ms spent']] }) },
  { title: 'Checkpoint record: WAL before it is disposable', body: 'The checkpointer writes a **checkpoint record** and updates `pg_control`. Crash recovery will start from its redo point, so WAL segments older than that point can be **recycled**.',
    state: st({ active: ['checkpointer'], flows: [['checkpointer', 'pgwal', 'checkpoint record']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], wal: 8, walFlushed: 8, segs: 3, datafileWritten: [1, 2, 5, 6, 9, 10],
      gucs: [['min_wal_size', '80MB', 'keep at least this much for recycling'], ['wal_segment_size', '16MB', 'set at initdb']],
      viewName: 'pg_control_checkpoint()', view: [['checkpoint_lsn', '0/3000060'], ['redo_lsn', '0/3000028'], ['redo_wal_file', '000000010000000000000003']] }) },
  { title: 'archiver: ship completed segments', body: 'With `archive_mode = on`, each completed 16 MB segment gets a `.ready` file. The **archiver** runs `archive_command` for it and renames the marker to `.done`. Until that succeeds, the segment cannot be recycled.',
    state: st({ active: ['archiver'], flows: [['pgwal', 'archiver', '.ready'], ['archiver', 'archive', 'archive_command']], cached: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], wal: 8, walFlushed: 8, segs: 3, archived: 2, datafileWritten: [1, 2, 5, 6, 9, 10],
      gucs: [['archive_mode', 'on', 'restart needed'], ['archive_command', "'cp %p /archive/%f'", 'must return 0 only on success'], ['archive_timeout', '0', 'force a switch after N seconds']],
      viewName: 'pg_stat_archiver', view: [['archived_count', '+1'], ['last_archived_wal', '000000010000000000000002'], ['failed_count', '0']] }) },
]

const W = 800, H = 372
const MX = 262, DX = 600
const regionBox: Record<Region, { x: number; y: number; w: number; h: number }> = {
  buffers: { x: MX, y: 10, w: 290, h: 150 },
  walbuf: { x: MX, y: 176, w: 290, h: 70 },
  stats: { x: MX, y: 262, w: 290, h: 100 },
  datafile: { x: DX, y: 10, w: 190, h: 150 },
  pgwal: { x: DX, y: 176, w: 190, h: 90 },
  archive: { x: DX, y: 282, w: 190, h: 80 },
}
const PW = 176 // process box width
const isRegion = (n: P | Region): n is Region => n in regionBox
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const CHANNEL = 254 // free horizontal lane between WAL buffers and statistics

/** Route a flow between two nodes: process column ↔ memory column ↔ disk column. */
function route(a: P | Region, b: P | Region): { d: string; lx: number; ly: number } {
  const procPt = (p: P) => procY(PI(p)) + 18
  const col = (n: P | Region) => (!isRegion(n) ? 0 : regionBox[n].x >= DX ? 2 : 1)
  const ca = col(a), cb = col(b)
  if (ca + cb === 2 && ca !== cb) { // process ↔ disk, through the free lane
    const p = (ca === 0 ? a : b) as P, r = regionBox[(ca === 2 ? a : b) as Region]
    const py = procPt(p), ry = clamp(CHANNEL, r.y + 10, r.y + r.h - 10)
    const fwd = `M${8 + PW},${py} C${8 + PW + 40},${py} ${MX - 40},${CHANNEL} ${MX},${CHANNEL} L${DX - 40},${CHANNEL} C${DX - 15},${CHANNEL} ${DX - 25},${ry} ${DX},${ry}`
    const rev = `M${DX},${ry} C${DX - 25},${ry} ${DX - 15},${CHANNEL} ${DX - 40},${CHANNEL} L${MX},${CHANNEL} C${MX - 40},${CHANNEL} ${8 + PW + 40},${py} ${8 + PW},${py}`
    return { d: ca === 0 ? fwd : rev, lx: (MX + DX) / 2, ly: CHANNEL - 3 }
  }
  if (ca === 0 || cb === 0) { // process ↔ memory
    const p = (ca === 0 ? a : b) as P, r = regionBox[(ca === 0 ? b : a) as Region]
    const py = procPt(p), ry = clamp(py, r.y + 12, r.y + r.h - 12)
    const x1 = 8 + PW, x2 = MX
    const d = ca === 0 ? `M${x1},${py} C${x1 + 40},${py} ${x2 - 40},${ry} ${x2},${ry}` : `M${x2},${ry} C${x2 - 40},${ry} ${x1 + 40},${py} ${x1},${py}`
    return { d, lx: (x1 + x2) / 2, ly: (py + ry) / 2 - 5 }
  }
  // memory ↔ disk
  const m = regionBox[(ca === 1 ? a : b) as Region], k = regionBox[(ca === 1 ? b : a) as Region]
  const y = clamp(m.y + m.h / 2, k.y + 12, k.y + k.h - 12)
  const my = clamp(y, m.y + 12, m.y + m.h - 12)
  const x1 = m.x + m.w, x2 = k.x
  const d = ca === 1 ? `M${x1},${my} C${x1 + 20},${my} ${x2 - 20},${y} ${x2},${y}` : `M${x2},${y} C${x2 - 20},${y} ${x1 + 20},${my} ${x1},${my}`
  return { d, lx: (x1 + x2) / 2, ly: Math.min(my, y) - 6 }
}

function Flow({ a, b, label, k }: { a: P | Region; b: Region | P; label: string; k: number }) {
  const r = route(a, b)
  return <FlowPath d={r.d} label={label} lx={r.lx} ly={r.ly} k={k} />
}

function FlowPath({ d, label, lx, ly, k }: { d: string; label: string; lx: number; ly: number; k: number }) {
  return (
    <g>
      <motion.path d={d} fill="none" stroke={tone('new')} strokeWidth={2.2} strokeDasharray="7 6" markerEnd="url(#bgArrow)"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [26, 0] }}
        transition={{ pathLength: { duration: 0.6, delay: k * 0.35 }, opacity: { duration: 0.2, delay: k * 0.35 }, strokeDashoffset: { duration: 0.8, repeat: Infinity, ease: 'linear' } }} />
      {label && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: k * 0.35 + 0.4 }}>
          <rect x={lx - label.length * 3.3 - 5} y={ly - 11} width={label.length * 6.6 + 10} height={15} rx={4} fill="var(--surface)" stroke={tone('new')} strokeWidth={0.8} />
          <T x={lx} y={ly} size={9.5} anchor="middle" fill={tone('new')} w={600}>{label}</T>
        </motion.g>
      )}
    </g>
  )
}

function Diagram({ s, i }: { s: S; i: number }) {
  const cellTone = (c: number): Tone => (s.dirty.includes(c) ? 'dead' : s.cached.includes(c) ? 'tuple' : 'free')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[720px]" role="img" aria-label="Background processes, shared memory and disk">
      <defs><marker id="bgArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={tone('new')} /></marker></defs>
      {/* processes */}
      {PROCS.map(([p, name, role], k) => {
        const on = s.active.includes(p)
        const t: Tone = p === 'backend' ? 'accent' : 'pointer'
        return (
          <motion.g key={p} animate={{ opacity: on ? 1 : 0.42 }}>
            <rect x={8} y={procY(k)} width={PW} height={36} rx={7} fill={toneBg(t, on ? 24 : 8)} stroke={tone(t)} strokeWidth={on ? 2 : 1} />
            <T x={18} y={procY(k) + 15} size={11} w={700}>{p === 'autovacuum' && s.worker ? 'autovacuum + worker' : name}</T>
            <T x={18} y={procY(k) + 29} size={9.5} fill="var(--muted)">{role}</T>
            {on && <motion.circle cx={PW - 4} cy={procY(k) + 18} r={4} fill={tone(t)} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />}
          </motion.g>
        )
      })}
      {/* shared memory column */}
      <rect x={MX - 8} y={2} width={306} height={H - 4} rx={9} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
      {(['buffers', 'walbuf', 'stats'] as Region[]).map((r) => {
        const b = regionBox[r]
        return <rect key={r} x={b.x} y={b.y} width={b.w} height={b.h} rx={7} fill="var(--surface)" stroke="var(--border)" />
      })}
      <T x={MX + 10} y={28} size={11} w={700}>shared buffers</T>
      <T x={MX + 280} y={28} size={9.5} anchor="end" fill="var(--muted)">{s.dirty.length} dirty</T>
      {[...Array(24).keys()].map((c) => {
        const t = cellTone(c)
        return <motion.rect key={c} x={MX + 10 + (c % 8) * 34} y={38 + Math.floor(c / 8) * 38} width={30} height={32} rx={4} initial={false}
          animate={{ fill: t === 'free' ? 'var(--c-free)' : toneBg(t, 40), stroke: t === 'free' ? 'var(--border)' : tone(t) }} transition={{ duration: 0.5, delay: 0.3 }} />
      })}
      <T x={MX + 10} y={194} size={11} w={700}>WAL buffers</T>
      <T x={MX + 280} y={194} size={9.5} anchor="end" fill="var(--muted)">flushed up to rec {s.walFlushed}</T>
      {[...Array(8).keys()].map((c) => (
        <motion.rect key={c} x={MX + 10 + c * 34} y={204} width={30} height={30} rx={4} initial={false}
          animate={{ fill: c < s.walFlushed ? toneBg('ok', 35) : c < s.wal ? toneBg('new', 45) : 'var(--c-free)', stroke: c < s.wal ? tone(c < s.walFlushed ? 'ok' : 'new') : 'var(--border)' }} transition={{ duration: 0.4, delay: 0.3 }} />
      ))}
      <T x={MX + 10} y={280} size={11} w={700}>cumulative statistics</T>
      {[['n_dead_tup', i >= 6 && i < 7 ? '12,000' : i >= 7 ? (i === 7 ? '12,000 → 0' : '0') : '0'], ['buffers_clean', i >= 5 ? '1' : '0'], ['checkpoints', i >= 8 ? '1' : '0']].map(([k, v], n) => (
        <g key={k}><T x={MX + 10} y={300 + n * 18} size={10} fill="var(--muted)">{k}</T><T x={MX + 280} y={300 + n * 18} size={10} anchor="end" w={700}>{v}</T></g>
      ))}
      {/* disk column */}
      {(['datafile', 'pgwal', 'archive'] as Region[]).map((r) => {
        const b = regionBox[r]
        return <rect key={r} x={b.x} y={b.y} width={b.w} height={b.h} rx={7} fill="var(--surface-2)" stroke="var(--border)" />
      })}
      <T x={DX + 10} y={28} size={11} w={700}>base/5/16384</T>
      <T x={DX + 10} y={42} size={9.5} fill="var(--muted)">orders table file on disk</T>
      {[...Array(12).keys()].map((c) => (
        <motion.rect key={c} x={DX + 10 + (c % 6) * 29} y={54 + Math.floor(c / 6) * 46} width={25} height={40} rx={3} initial={false}
          animate={{ fill: s.datafileWritten.includes(c) ? toneBg('ok', 45) : 'var(--surface)', stroke: s.datafileWritten.includes(c) ? tone('ok') : 'var(--border)' }} transition={{ duration: 0.5, delay: 0.5 }} />
      ))}
      <T x={DX + 10} y={194} size={11} w={700}>pg_wal/</T>
      {[...Array(s.segs).keys()].map((k) => (
        <motion.g key={k} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          <rect x={DX + 10} y={204 + k * 20} width={170} height={16} rx={3} fill={k < s.archived ? toneBg('ok', 20) : toneBg('new', 18)} stroke={k < s.archived ? tone('ok') : tone('new')} strokeWidth={0.8} />
          <T x={DX + 16} y={216 + k * 20} size={9.5}>{`00000001000000000000000${k + 1}`}</T>
        </motion.g>
      ))}
      <T x={DX + 10} y={300} size={11} w={700}>WAL archive</T>
      {[...Array(s.archived).keys()].map((k) => (
        <motion.g key={k} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <rect x={DX + 10} y={310 + k * 20} width={170} height={16} rx={3} fill={toneBg('ok', 18)} stroke={tone('ok')} strokeWidth={0.8} />
          <T x={DX + 16} y={322 + k * 20} size={9.5}>{`00000001000000000000000${k + 1}`}</T>
        </motion.g>
      ))}
      {/* flows */}
      {s.flows.map(([a, b, l], k) => <Flow key={`${i}-${k}`} a={a} b={b} label={l} k={k} />)}
    </svg>
  )
}

function CrewViz() {
  return (
    <Stepper steps={steps} interval={3400} render={(s, i) => (
      <div className="grid gap-3">
        <Legend items={[['accent', 'client backend'], ['pointer', 'auxiliary / background process'], ['tuple', 'cached page'], ['dead', 'dirty page'], ['new', 'unflushed WAL / data flow'], ['ok', 'written to disk']]} />
        <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin"><Diagram s={s} i={i} /></div>
        <div className="grid gap-3 md:grid-cols-2">
          <Panel title="Settings that govern this step (PG18 defaults)">
            <FieldTable rows={s.gucs.map(([k, v, d]) => [k, v, d])} />
          </Panel>
          <Panel title={`What records it: ${s.viewName}`}>
            <FieldTable rows={s.view.map(([k, v]) => [k, v])} />
          </Panel>
        </div>
      </div>
    )} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'background-processes',
  module: 'm1',
  order: 4,
  title: 'The background crew',
  tldr: [
    'Next to the client backends, an instance runs a crew of **background processes**: the walwriter, background writer, checkpointer, autovacuum, archiver, logger and, in PostgreSQL 18, **I/O workers**.',
    'They move slow work off the query path, so a commit only waits for one WAL flush while dirty pages, cleanup, statistics and archiving happen later and in bulk.',
  ],
  visualizer: {
    title: 'Follow one UPDATE through the whole crew',
    caption: 'Step through an UPDATE from the first read to the archived WAL segment. Each step lights the process that acts and lists the settings and statistics views that belong to it.',
    Component: CrewViz,
  },
  playground: {
    setup: `
CREATE TABLE orders (id int PRIMARY KEY, status text, amount numeric);
INSERT INTO orders SELECT g, 'new', g % 500 FROM generate_series(1, 50000) g;
SELECT pg_stat_force_next_flush();
ANALYZE orders;`,
    presets: [
      { label: 'The crew and its settings', sql: `SELECT name, setting, unit, context FROM pg_settings
WHERE name IN ('bgwriter_delay', 'bgwriter_lru_maxpages', 'bgwriter_lru_multiplier',
               'checkpoint_timeout', 'max_wal_size', 'checkpoint_completion_target',
               'wal_writer_delay', 'autovacuum_naptime', 'autovacuum_max_workers',
               'io_method', 'io_workers', 'archive_mode')
ORDER BY name;`,
        note: 'The defaults from the visualizer. This sandbox reports `io_method = sync` because the whole server runs in one process; a normal PostgreSQL 18 server defaults to `worker` with 3 `io_workers`.' },
      { label: 'I/O by process type', sql: `SELECT backend_type, object, context, reads, hits, writes, extends
FROM pg_stat_io
WHERE reads > 0 OR writes > 0 OR hits > 0 OR extends > 0
ORDER BY backend_type, object, context;`,
        note: '`pg_stat_io` splits I/O by **process type**, object (relation, temp relation, wal) and context (normal, bulkread, bulkwrite, vacuum). Here one standalone backend does every job. The `wal` rows are new in 18.' },
      { label: 'Who is doing I/O right now?', sql: `SELECT object, context, reads, pg_size_pretty(read_bytes) AS read, writes, pg_size_pretty(write_bytes) AS written, extends
FROM pg_stat_get_backend_io(pg_backend_pid())
WHERE reads > 0 OR writes > 0 OR extends > 0;

SELECT name, setting FROM pg_settings
WHERE name IN ('io_method', 'io_workers', 'io_combine_limit', 'effective_io_concurrency') ORDER BY name;

SELECT count(*) AS async_ios_in_flight FROM pg_aios;`,
        note: '`pg_stat_get_backend_io(pid)` (new in 18) gives one backend\'s own I/O, in operations and in bytes. `io_combine_limit` (16 × 8 kB) caps how many adjacent blocks one read may merge. `pg_aios` lists I/Os in flight; with `sync` it stays empty.' },
      { label: 'Make work for the crew', sql: `UPDATE orders SET status = 'paid' WHERE id <= 12000;

-- counters reach shared memory only when the backend flushes them (at most once a second)
SELECT n_dead_tup AS before_flush FROM pg_stat_user_tables WHERE relname = 'orders';
SELECT pg_stat_force_next_flush();

SELECT n_live_tup, n_dead_tup, n_tup_upd, n_tup_hot_upd
FROM pg_stat_user_tables WHERE relname = 'orders';`,
        note: 'The first read still shows the old value: statistics lag until the backend flushes them. After the flush, 12,000 dead row versions are visible to autovacuum.' },
      { label: 'Would autovacuum run?', sql: `SELECT s.relname, s.n_dead_tup,
       current_setting('autovacuum_vacuum_threshold')::int
         + current_setting('autovacuum_vacuum_scale_factor')::float8 * c.reltuples AS vacuum_threshold,
       s.n_dead_tup > current_setting('autovacuum_vacuum_threshold')::int
         + current_setting('autovacuum_vacuum_scale_factor')::float8 * c.reltuples AS needs_vacuum
FROM pg_stat_user_tables s JOIN pg_class c ON c.oid = s.relid
WHERE s.relname = 'orders';`,
        note: 'Threshold = 50 + 0.2 × 50,000 = **10,050**. With 12,000 dead tuples the launcher would start a worker on its next wake-up.' },
      { label: 'Run the checkpointer\'s job', sql: `SELECT pg_current_wal_lsn() AS lsn_before;
CHECKPOINT;
SELECT checkpoint_lsn, redo_lsn, redo_wal_file, timeline_id
FROM pg_control_checkpoint();`,
        note: '`CHECKPOINT` forces what the checkpointer does on its timer. The new **redo point** is where crash recovery would start.' },
      { label: 'WAL written so far', sql: `SELECT wal_records, wal_fpi, pg_size_pretty(wal_bytes) AS wal_bytes, wal_buffers_full
FROM pg_stat_wal;

SELECT pg_walfile_name(pg_current_wal_lsn()) AS current_segment,
       current_setting('wal_segment_size') AS segment_size;`,
        note: '`wal_fpi` counts full-page images: the first change to a page after a checkpoint logs the whole page. `wal_buffers_full` > 0 would mean WAL buffers are too small.' },
      { label: 'Vacuum by hand', sql: `VACUUM (VERBOSE) orders;
SELECT pg_stat_force_next_flush();

SELECT n_dead_tup, last_vacuum IS NOT NULL AS vacuumed, vacuum_count
FROM pg_stat_user_tables WHERE relname = 'orders';`,
        note: 'This is what an autovacuum worker does for you. Afterwards `n_dead_tup` is back to 0 and the freed space is reusable.' },
    ],
  },
  production: {
    title: 'Checkpoint spikes every few minutes',
    context: 'A write-heavy ingestion service sees write latency jump every two to three minutes, even though `checkpoint_timeout` is the default 5 minutes.',
    problem: '`pg_stat_checkpointer` shows `num_requested` far above `num_timed`: checkpoints are triggered by WAL volume, not time. With `max_wal_size = 1GB` the service fills the allowance in about two minutes, and every checkpoint also restarts full-page writes, so WAL grows even faster.',
    solution: 'Confirm the trigger, then give WAL more room so checkpoints become time-based and spread out. Keep `checkpoint_completion_target` at 0.9 and turn on `log_checkpoints` (on by default since 15) to verify.',
    sql: `SELECT num_timed, num_requested, buffers_written,
       round(100.0 * num_requested / nullif(num_timed + num_requested, 0), 1) AS pct_requested
FROM pg_stat_checkpointer;

ALTER SYSTEM SET max_wal_size = '8GB';
SELECT pg_reload_conf();`,
    outcome: 'Requested checkpoints dropped to near zero, checkpoints ran every 5 minutes, and WAL volume fell because fewer full-page images were written after each checkpoint.',
  },
  pitfalls: [
    { title: 'Turning autovacuum off',
      symptom: 'Tables and indexes bloat, queries slow down, and eventually the server warns about transaction ID wraparound.',
      cause: 'Nothing else removes dead row versions or freezes old ones. Disabling autovacuum only postpones the work and makes it larger.',
      fix: 'Leave `autovacuum = on`. Tune busy tables with per-table settings such as `ALTER TABLE t SET (autovacuum_vacuum_scale_factor = 0.02)`.' },
    { title: 'Backends doing the background writer\'s job',
      symptom: '`pg_stat_io` shows large `writes` for `client backend` in context `normal`, and queries stall on I/O.',
      cause: 'When the clock sweep picks a dirty victim, the backend must write it itself. The bgwriter and checkpointer are not keeping up.',
      fix: 'Raise `bgwriter_lru_maxpages` and `bgwriter_lru_multiplier`, check checkpoint frequency, and size `shared_buffers` for the working set.',
      sql: `SELECT backend_type, writes, writebacks FROM pg_stat_io
WHERE object = 'relation' AND context = 'normal' AND writes > 0;` },
    { title: 'A failing archive_command fills the disk',
      symptom: '`pg_wal` grows without limit and the server finally stops with a disk-full PANIC.',
      cause: 'A segment cannot be recycled until it is archived. If `archive_command` keeps failing, every segment since the failure is kept.',
      fix: 'Monitor `pg_stat_archiver.failed_count` and `last_failed_wal`, fix the command, and make sure it returns non-zero exit status only on real failure.' },
    { title: 'Expecting asynchronous I/O to speed up writes',
      symptom: 'After moving to 18 with `io_method = worker`, a write-heavy job is no faster, while a cold sequential scan on network storage is clearly faster.',
      cause: 'A common claim is that AIO makes all I/O asynchronous. In 18 backends queue **read** requests (sequential scans, bitmap heap scans, VACUUM); data and WAL writes take the usual paths. The gain is largest for cold reads from slow storage and small when pages are already cached.',
      fix: 'Measure reads, not commits: compare `EXPLAIN (ANALYZE, BUFFERS)` of a cold scan and `pg_stat_io` read times (`track_io_timing = on`). Tune `effective_io_concurrency` and `io_workers` for read-heavy workloads.' },
    { title: 'Expecting io_method to change on reload',
      symptom: '`ALTER SYSTEM SET io_method = \'io_uring\'` plus `pg_reload_conf()` changes nothing.',
      cause: '`io_method` has context `postmaster`: the I/O subsystem is set up at server start. `pending_restart` shows the waiting value.',
      fix: 'Restart the server. Check `SELECT name, setting, pending_restart FROM pg_settings WHERE name = \'io_method\'` afterwards.' },
  ],
  pointers: [
    'Auxiliary processes: **checkpointer, background writer, walwriter, autovacuum launcher, archiver, logger, startup, walreceiver, walsummarizer**; plus PG18 **io workers**.',
    'A COMMIT waits only for its **WAL flush**. Data pages are written later by the **bgwriter** and the **checkpointer**.',
    'Checkpoints run every `checkpoint_timeout` (5min) or at `max_wal_size` (1GB), spread over `checkpoint_completion_target` (0.9).',
    'Autovacuum: launcher every `autovacuum_naptime` (1min); VACUUM when dead tuples > **50 + 0.2 × reltuples**.',
    'Watch them with `pg_stat_activity.backend_type`, `pg_stat_io`, `pg_stat_bgwriter`, `pg_stat_checkpointer`, `pg_stat_archiver`.',
  ],
  sources: ['glossary.html', 'runtime-config-resource.html', 'runtime-config-wal.html', 'wal-configuration.html', 'wal-async-commit.html', 'routine-vacuuming.html', 'monitoring-stats.html', 'continuous-archiving.html', 'view-pg-aios.html', 'release-18.html'],
}
