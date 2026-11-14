import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Meter, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: VACUUM and VACUUM FULL on the playground table, page by page. Numbers come from a real
 * PostgreSQL 18 run (VACUUM VERBOSE): orders, 10,000 rows, fillfactor 70 → 106 heap pages (95 rows each).
 * UPDATE 2,500 rows (all HOT), DELETE id > 8500 (1,500 rows on pages 89-105). VACUUM: "1500 dead item
 * identifiers removed" on 17 pages, index scans: 1, "truncated 106 to 90 pages", 106 pages set all-visible.
 * VACUUM FULL: relfilenode 16396 → 16407, orders_pkey 30 → 26 pages, orders_status_idx 11 → 10.
 * ---------------------------------------------------------------------------------------------- */

type P = 'live' | 'pruned' | 'partial' | 'dead' | 'empty' | 'gone' | 'new'
interface S {
  pages: P[]; vm: boolean[]; cursor?: number; phase: string; lock: string; tids: number
  idx: [number, number]; idxDead: number; heapPages: number; file: string; note?: string
}
const N = 106
const range = (a: number, b: number) => Array.from({ length: b - a }, (_, i) => a + i)

const afterDml: P[] = Array.from({ length: N }, (_, i) => (i < 89 ? 'pruned' : i === 89 ? 'partial' : 'dead'))
const noVm = Array<boolean>(N).fill(false)

function vacuumSteps(): Step<S>[] {
  const scanAt = (c: number): P[] => afterDml.map((p, i) => (i < c && p === 'pruned' ? 'live' : p))
  const vmAt = (c: number) => afterDml.map((p, i) => i < c && p === 'pruned')
  const base = { idx: [30, 11] as [number, number], file: 'base/5/16396', heapPages: 106 }
  const cleaned: P[] = afterDml.map((p) => (p === 'pruned' || p === 'partial' ? 'live' : 'empty'))
  return [
    { title: 'After the UPDATE and DELETE', body: '2,500 HOT updates left old versions on pages 0-88, mostly pruned already on access. DELETE id > 8500 left **1,500 dead rows** on pages 89-105. Every page lost its all-visible bit.',
      state: { ...base, pages: afterDml, vm: noVm, phase: '—', lock: 'none', tids: 0, idxDead: 1500 } },
    { title: 'initializing', body: 'VACUUM takes **SHARE UPDATE EXCLUSIVE**: reads and writes continue, only DDL and other vacuums wait. The visibility map shows no all-visible page, so all 106 pages must be read.',
      state: { ...base, pages: afterDml, vm: noVm, phase: 'initializing', lock: 'SHARE UPDATE EXCLUSIVE', tids: 0, idxDead: 1500 } },
    { title: 'scanning heap: prune page by page', body: 'Each page is **pruned**: dead HOT versions vanish, deleted rows become `LP_DEAD` stubs whose TIDs go into the dead-TID store. Pages with nothing dead are marked **all-visible** at once.',
      state: { ...base, pages: scanAt(60), vm: vmAt(60), cursor: 60, phase: 'scanning heap', lock: 'SHARE UPDATE EXCLUSIVE', tids: 0, idxDead: 1500 } },
    { title: 'scanning heap: the dead-TID store fills', body: 'Pages 89-105 yield **1,500 dead item identifiers**. They fit easily in `maintenance_work_mem`; if they did not, VACUUM would stop here, clean the indexes, and come back.',
      state: { ...base, pages: scanAt(106), vm: vmAt(106), cursor: 105, phase: 'scanning heap', lock: 'SHARE UPDATE EXCLUSIVE', tids: 1500, idxDead: 1500 } },
    { title: 'vacuuming indexes', body: 'Each index is scanned once and every entry pointing at a stored TID is deleted: `orders_pkey` and `orders_status_idx`. This is why the stubs had to stay until now.',
      state: { ...base, pages: scanAt(106), vm: vmAt(106), phase: 'vacuuming indexes', lock: 'SHARE UPDATE EXCLUSIVE', tids: 1500, idxDead: 0 } },
    { title: 'vacuuming heap', body: 'Back to the 17 pages with stubs: `LP_DEAD` becomes `LP_UNUSED`, free space is recorded in the **FSM**, and the pages are marked all-visible. 16 of them are now completely empty.',
      state: { ...base, pages: cleaned, vm: Array<boolean>(N).fill(true), phase: 'vacuuming heap', lock: 'SHARE UPDATE EXCLUSIVE', tids: 0, idxDead: 0 } },
    { title: 'cleaning up indexes', body: 'Index statistics are updated and fully empty index pages are marked deleted (3 in `orders_pkey`) so they can be recycled later.',
      state: { ...base, pages: cleaned, vm: Array<boolean>(N).fill(true), phase: 'cleaning up indexes', lock: 'SHARE UPDATE EXCLUSIVE', tids: 0, idxDead: 0 } },
    { title: 'truncating heap', body: 'Only **empty pages at the end** can go back to the OS. VACUUM briefly takes ACCESS EXCLUSIVE and truncates **106 → 90 pages**. Free space in the middle stays inside the table for reuse.',
      state: { ...base, pages: cleaned.map((p, i) => (i >= 90 ? 'gone' : p)), vm: range(0, N).map((i) => i < 90), phase: 'truncating heap', lock: 'ACCESS EXCLUSIVE (brief)', tids: 0, idxDead: 0, heapPages: 90 } },
    { title: 'performing final cleanup', body: 'The FSM is vacuumed and `pg_class` gets `relpages` 90, `reltuples` 8500, `relallvisible` 90. The next VACUUM can skip all 90 pages until something changes them.',
      state: { ...base, pages: cleaned.map((p, i) => (i >= 90 ? 'gone' : p)), vm: range(0, N).map((i) => i < 90), phase: 'performing final cleanup', lock: 'none', tids: 0, idxDead: 0, heapPages: 90 } },
  ]
}

function fullSteps(): Step<S>[] {
  const base = { idx: [30, 11] as [number, number], file: 'base/5/16396', heapPages: 106, tids: 0 }
  const copied = (c: number): P[] => Array.from({ length: N }, (_, i) => (i < c ? 'new' : 'gone'))
  return [
    { title: 'After the UPDATE and DELETE', body: 'Same starting point: 106 pages, 1,500 dead rows at the tail, pruned HOT versions everywhere else.',
      state: { ...base, pages: afterDml, vm: noVm, phase: '—', lock: 'none', idxDead: 1500 } },
    { title: 'Lock: ACCESS EXCLUSIVE', body: 'VACUUM FULL takes **ACCESS EXCLUSIVE** for the whole run. Every SELECT, INSERT, UPDATE and DELETE on `orders` now waits.',
      state: { ...base, pages: afterDml, vm: noVm, phase: 'initializing', lock: 'ACCESS EXCLUSIVE', idxDead: 1500 } },
    { title: 'seq scanning heap → writing new heap', body: 'Live rows are copied into a **brand-new file**. The old file stays until the end, so you need free disk space about the size of the table plus its indexes.',
      state: { ...base, pages: afterDml, vm: noVm, phase: 'writing new heap', lock: 'ACCESS EXCLUSIVE', idxDead: 1500, note: 'new file base/5/16407: 50 of 90 pages written' } },
    { title: 'rebuilding indexes', body: 'Every index is rebuilt from scratch: `orders_pkey` comes out at **26 pages** instead of 30, `orders_status_idx` at 10 instead of 11.',
      state: { ...base, pages: copied(90), vm: noVm, phase: 'rebuilding index', lock: 'ACCESS EXCLUSIVE', idxDead: 0, idx: [26, 10], heapPages: 90, note: 'new file base/5/16407: 90 pages' } },
    { title: 'swapping relation files', body: '`pg_class.relfilenode` changes from **16396 to 16407** and the old files are deleted. Every row has a new ctid. Rows were frozen as they were copied.',
      state: { ...base, pages: copied(90), vm: noVm, phase: 'swapping relation files', lock: 'ACCESS EXCLUSIVE', idxDead: 0, idx: [26, 10], heapPages: 90, file: 'base/5/16407' } },
    { title: 'Done: same 90 pages, but the table was offline', body: 'Here FULL ends at 90 pages, exactly what plain VACUUM reached, because the dead space was at the tail. FULL only wins when free space is scattered through the table.',
      state: { ...base, pages: copied(90).map((p) => (p === 'new' ? 'live' : p)), vm: noVm, phase: 'performing final cleanup', lock: 'none', idxDead: 0, idx: [26, 10], heapPages: 90, file: 'base/5/16407' } },
  ]
}

const pTone: Record<P, Tone> = { live: 'tuple', pruned: 'tuple', partial: 'new', dead: 'dead', empty: 'free', gone: 'muted', new: 'ok' }
const COLS = 18, CW = 40, CH = 26, GAP = 4

function Grid({ s }: { s: S }) {
  const rows = Math.ceil(N / COLS)
  return (
    <svg viewBox={`0 0 ${COLS * (CW + GAP) + 8} ${rows * (CH + GAP) + 8}`} className="w-full min-w-[640px]" role="img" aria-label="Heap pages of the orders table">
      {s.pages.map((p, i) => {
        const x = 4 + (i % COLS) * (CW + GAP), y = 4 + Math.floor(i / COLS) * (CH + GAP)
        const t = pTone[p]
        return (
          <motion.g key={i} initial={false} animate={{ opacity: p === 'gone' ? 0.18 : 1 }}>
            <motion.rect x={x} y={y} width={CW} height={CH} rx={4} initial={false}
              animate={{ fill: p === 'empty' ? 'var(--c-free)' : toneBg(t, p === 'pruned' ? 14 : 30), stroke: s.cursor === i ? tone('accent') : tone(t) }}
              strokeWidth={s.cursor === i ? 2.5 : 1} strokeDasharray={p === 'gone' ? '3 3' : undefined} />
            <text x={x + 4} y={y + 16} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{i}</text>
            {s.vm[i] && <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} cx={x + CW - 7} cy={y + 7} r={3.5} fill={tone('ok')} />}
          </motion.g>
        )
      })}
    </svg>
  )
}

function VacuumViz() {
  const [mode, setMode] = useState<'plain' | 'full'>('plain')
  const steps = mode === 'plain' ? vacuumSteps() : fullSteps()
  return (
    <Stepper key={mode} steps={steps} interval={3000}
      extra={<Segmented label="Command" value={mode} onChange={setMode} options={[['plain', 'VACUUM'], ['full', 'VACUUM FULL']]} />}
      render={(s) => (
        <div className="grid gap-3">
          <Legend items={[['tuple', 'live rows'], ['new', 'partly deleted'], ['dead', 'dead rows / LP_DEAD stubs'], ['free', 'empty page'], ['ok', 'all-visible bit (dot) / new file']]} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="phase" value={<span className="text-sm">{s.phase}</span>} />
            <Stat label="lock on orders" value={<span className="text-sm">{s.lock}</span>} t={s.lock.startsWith('ACCESS') ? 'dead' : s.lock === 'none' ? undefined : 'ok'} />
            <Stat label="heap pages" value={s.heapPages} />
            <Stat label="all-visible pages" value={s.vm.filter(Boolean).length} t="ok" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2"><Grid s={s} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Dead-TID store (maintenance_work_mem)">
              <Meter label="dead TIDs" pct={(s.tids / 1500) * 18} t="dead" right={s.tids.toLocaleString('en-US')} />
              <p className="mt-2 text-xs text-muted">1,500 TIDs use a sliver of the default 64 MB. Overflowing it forces extra index passes.</p>
            </Panel>
            <Panel title="Indexes">
              <div className="grid gap-1.5">
                <Meter label={`orders_pkey · ${s.idx[0]} pg`} pct={(s.idx[0] / 30) * 100} t="pointer" right={`${s.idxDead} dead`} />
                <Meter label={`status_idx · ${s.idx[1]} pg`} pct={(s.idx[1] / 30) * 100} t="pointer" right={`${s.idxDead} dead`} />
              </div>
              <p className="mt-2 font-mono text-xs text-muted">heap file: {s.file}{s.note ? ` · ${s.note}` : ''}</p>
            </Panel>
          </div>
        </div>
      )} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'vacuum',
  module: 'm7',
  order: 3,
  title: 'VACUUM vs VACUUM FULL',
  tldr: [
    '**VACUUM** removes dead row versions so their space can be reused, updates the visibility and free space maps, and runs alongside normal reads and writes.',
    '**VACUUM FULL** instead rewrites the whole table into a new file to give space back to the operating system, at the price of an ACCESS EXCLUSIVE lock for the entire run.',
  ],
  visualizer: {
    title: 'Vacuum a real table, phase by phase',
    caption: 'Step through the seven phases of `pg_stat_progress_vacuum` on 106 pages, then switch to **VACUUM FULL** and compare locks, files and results. All counts are from VACUUM VERBOSE on the playground table.',
    Component: VacuumViz,
  },
  playground: {
    extensions: ['pg_visibility', 'pg_freespacemap'],
    setup: `
CREATE TABLE orders (
  id int PRIMARY KEY, status text NOT NULL, amount numeric(10,2) NOT NULL, note text
) WITH (autovacuum_enabled = false, fillfactor = 70);
INSERT INTO orders SELECT g, 'new', (g % 500) + 0.99, 'order #' || g FROM generate_series(1, 10000) g;
CREATE INDEX orders_status_idx ON orders (status);
VACUUM orders;`,
    presets: [
      { label: 'Make dead rows', sql: `UPDATE orders SET amount = amount + 1 WHERE id % 4 = 0;   -- 2,500 rows, no indexed column
DELETE FROM orders WHERE id > 8500;                         -- 1,500 rows at the end

SELECT pg_stat_force_next_flush();
SELECT n_dead_tup, n_tup_upd, n_tup_hot_upd, n_tup_del,
       pg_relation_size('orders') / 8192 AS heap_pages
FROM pg_stat_user_tables WHERE relname = 'orders';`,
        note: 'All 2,500 updates were **HOT** (fillfactor 70 left room). The table is still 106 pages: DELETE frees nothing by itself.' },
      { label: 'Before VACUUM: maps', sql: `SELECT * FROM pg_visibility_map_summary('orders');
SELECT count(*) AS pages, sum(avail) AS fsm_free_bytes FROM pg_freespace('orders');`,
        note: 'No page is all-visible: every page was modified. The FSM still reports only the fillfactor headroom, because the FSM is updated by VACUUM, not by DELETE.' },
      { label: 'Run VACUUM', sql: `VACUUM orders;

SELECT pg_stat_force_next_flush();
SELECT relpages, reltuples, relallvisible, relallfrozen,
       pg_relation_size('orders') / 8192 AS heap_pages
FROM pg_class WHERE relname = 'orders';
SELECT n_dead_tup, vacuum_count, last_vacuum IS NOT NULL AS vacuumed
FROM pg_stat_user_tables WHERE relname = 'orders';`,
        note: 'The 16 empty pages at the end were truncated: **106 → 90**. All remaining pages are all-visible, and `n_dead_tup` is back to 0.' },
      { label: 'Free space after VACUUM', sql: `SELECT blkno, avail FROM pg_freespace('orders') ORDER BY blkno LIMIT 5;
SELECT count(*) AS pages, sum(avail) AS fsm_free_bytes FROM pg_freespace('orders');
SELECT * FROM pg_visibility_map_summary('orders');`,
        note: 'Each page now advertises its free bytes to the FSM, so the next INSERTs and non-HOT UPDATEs reuse them instead of growing the file.' },
      { label: 'How VACUUM reads: its own ring', sql: `SELECT backend_type, context, reads, hits, writes
FROM pg_stat_io
WHERE object = 'relation' AND context IN ('normal', 'vacuum') AND reads + hits > 0
ORDER BY context;

SELECT name, setting FROM pg_settings
WHERE name IN ('io_method', 'maintenance_io_concurrency', 'vacuum_buffer_usage_limit')
ORDER BY name;`,
        note: 'VACUUM\'s page accesses are counted under context **vacuum**: it reads through a small ring of buffers (`vacuum_buffer_usage_limit`, 2 MB) so a big table does not evict the hot working set. In 18, `io_method = worker` (the server default) lets VACUUM issue its reads ahead asynchronously; writes stay synchronous. This single-process build reports `sync`.' },
      { label: 'TRUNCATE false keeps the tail', sql: `DELETE FROM orders WHERE id > 8000;
VACUUM (TRUNCATE false) orders;
SELECT pg_relation_size('orders') / 8192 AS pages_after_truncate_false;

VACUUM orders;
SELECT pg_relation_size('orders') / 8192 AS pages_after_plain_vacuum;`,
        note: 'With `TRUNCATE false` the emptied tail pages stay (no ACCESS EXCLUSIVE needed). A later plain VACUUM gives them back.' },
      { label: 'VACUUM FULL rewrites the file', sql: `SELECT relfilenode, pg_relation_size('orders') / 8192 AS pages,
       pg_relation_size('orders_pkey') / 8192 AS pkey_pages
FROM pg_class WHERE relname = 'orders';

VACUUM FULL orders;

SELECT relfilenode, pg_relation_size('orders') / 8192 AS pages,
       pg_relation_size('orders_pkey') / 8192 AS pkey_pages
FROM pg_class WHERE relname = 'orders';`,
        note: 'A new `relfilenode` means a brand-new file. The index is rebuilt and smaller. In production this whole step holds ACCESS EXCLUSIVE.' },
      { label: 'Emptying a table: DELETE vs TRUNCATE', sql: `CREATE TABLE staging AS SELECT g AS id, md5(g::text) AS v FROM generate_series(1, 5000) g;
DELETE FROM staging;
SELECT pg_stat_force_next_flush();
SELECT n_dead_tup, pg_relation_filenode('staging') AS filenode, pg_relation_size('staging') / 8192 AS pages
FROM pg_stat_user_tables WHERE relname = 'staging';

BEGIN;
TRUNCATE staging;
SELECT mode FROM pg_locks WHERE relation = 'staging'::regclass;
SELECT pg_relation_filenode('staging') AS new_filenode, pg_relation_size('staging') AS bytes;
COMMIT;

SELECT pg_stat_force_next_flush();
SELECT n_dead_tup FROM pg_stat_user_tables WHERE relname = 'staging';`,
        note: 'DELETE left **5,000 dead rows** in 64 pages for VACUUM. TRUNCATE swapped in a new empty file (new filenode, 0 bytes) and left nothing to clean, but it holds **AccessExclusiveLock** until COMMIT. Roll it back and the old file comes back.' },
    ],
  },
  production: {
    title: 'An audit table that was "fixed" nightly with VACUUM FULL',
    context: 'A SaaS team keeps 90 days of audit events in one 120 GB table. A nightly job deletes rows older than 90 days, then runs `VACUUM FULL audit_events` to "reclaim space".',
    problem: 'VACUUM FULL took over 40 minutes and held ACCESS EXCLUSIVE the whole time, so every API call that wrote an audit row queued behind it and timed out. It also needed about 120 GB of free disk for the copy.',
    solution: 'Stop rewriting. The deleted space is reused by the next day\'s inserts, so a plain VACUUM after the purge keeps the table at a steady size. For the long term, partition by day and drop old partitions, which removes data without dead tuples at all.',
    sql: `-- short term: plain VACUUM, online
DELETE FROM audit_events WHERE created_at < now() - interval '90 days';
VACUUM (ANALYZE) audit_events;

-- long term: partitions you can drop
CREATE TABLE audit_events_p (LIKE audit_events) PARTITION BY RANGE (created_at);
-- ... one partition per day; retention becomes:
-- DROP TABLE audit_events_2026_08_15;`,
    outcome: 'The table settles at its steady-state size (about 90 days of data plus one day of churn) without ever going offline. Plain VACUUM runs alongside writes, needs no extra disk, and with partitions the nightly purge becomes a metadata change.',
  },
  pitfalls: [
    { title: 'Running VACUUM FULL in business hours',
      symptom: 'Every query on the table hangs; `pg_locks` shows a granted AccessExclusiveLock and a queue of waiters.',
      cause: 'VACUUM FULL holds ACCESS EXCLUSIVE until the new file and all indexes are built. Even a plain SELECT must wait.',
      fix: 'Use plain VACUUM for routine work. If only the indexes are bloated, `REINDEX INDEX CONCURRENTLY` rebuilds one online under SHARE UPDATE EXCLUSIVE (if it fails, it leaves an INVALID index to drop). To shrink the table itself online, use an extension such as pg_repack, or rebuild into a new table and swap.',
      sql: `SELECT pid, mode, granted FROM pg_locks WHERE relation = 'orders'::regclass;` },
    { title: 'A long transaction makes VACUUM useless',
      symptom: 'VACUUM VERBOSE says `N are dead but not yet removable` and `n_dead_tup` never drops.',
      cause: 'VACUUM may remove a row version only when no snapshot can still see it. One old transaction, an idle-in-transaction session, or a stale replication slot holds the horizon back for the whole cluster.',
      fix: 'Find and end the oldest snapshot holders; set `idle_in_transaction_session_timeout`.',
      sql: `SELECT pid, state, xact_start, age(backend_xmin) AS xmin_age
FROM pg_stat_activity WHERE backend_xmin IS NOT NULL ORDER BY xmin_age DESC;` },
    { title: 'Expecting plain VACUUM to shrink the file',
      symptom: 'After deleting most rows and vacuuming, `pg_relation_size` barely moves.',
      cause: 'Plain VACUUM only truncates empty pages at the end of the file. Space freed in the middle is kept for reuse.',
      fix: 'That is usually what you want. If the table will stay small, rewrite it once in a maintenance window, or partition so you can drop whole chunks.' },
    { title: 'VACUUM from application code fails',
      symptom: 'A maintenance job gets `VACUUM cannot run inside a transaction block` (or `cannot be executed from a function`), while the same command works in psql.',
      cause: 'Many drivers open a transaction implicitly before the first statement, and VACUUM manages its own transactions, so it refuses to run inside one.',
      fix: 'Switch that connection to autocommit before sending VACUUM, and never wrap it in BEGIN, a function or a DO block.' },
    { title: 'Treating TRUNCATE as a cheap DELETE',
      symptom: 'A nightly `TRUNCATE staging` stalls every query on the table, and a report running at the same time sees the table as empty.',
      cause: 'A common claim is that TRUNCATE is fast because it locks lightly. It takes **ACCESS EXCLUSIVE**, the strongest lock, and swaps in a new file. It is not MVCC-safe: a REPEATABLE READ snapshot taken before it sees no rows afterwards.',
      fix: 'Use TRUNCATE for tables nobody else is reading at that moment. Keep its transaction short, and set `lock_timeout` so it gives up instead of queueing everyone behind it.',
      sql: `SET lock_timeout = '2s';
TRUNCATE staging;` },
  ],
  pointers: [
    'Plain VACUUM: **SHARE UPDATE EXCLUSIVE**, runs online, space is **reused**, only the empty tail goes back to the OS.',
    'Phases: **scan heap (prune, collect dead TIDs) → vacuum indexes → vacuum heap → clean up indexes → truncate → final cleanup**.',
    'Dead TIDs must fit in **`maintenance_work_mem`**, or indexes are scanned more than once.',
    'VACUUM sets **all-visible / all-frozen** bits and fills the **FSM**; DELETE does neither.',
    'VACUUM FULL: **ACCESS EXCLUSIVE**, new relfilenode, rebuilt indexes, needs disk for a full copy.',
  ],
  sources: ['routine-vacuuming.html', 'sql-vacuum.html', 'progress-reporting.html', 'storage-vm.html', 'storage-fsm.html', 'storage-hot.html', 'runtime-config-vacuum.html', 'pgvisibility.html', 'pgfreespacemap.html'],
}
