import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, PlanBox, Sql, Stat } from './_ui'
import { Md } from '../../lesson/Md'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: an EXPLAIN "smell detector". Six plans captured with EXPLAIN (ANALYZE, BUFFERS) on the
 * playground schema (10 000 users, 60 000 orders). Costs are abbreviated to the estimated row count.
 * Flagged lines carry the smell; "After the fix" shows the plan once the fix is applied.
 * ---------------------------------------------------------------------------------------------- */

interface Smell {
  id: string; name: string; rule: string; query: string
  before: string[]; marks: number[]; after: string[]; good: number[]
  fix: string; why: string; metric: string; b: number; a: number
}

const SMELLS: Smell[] = [
  { id: 'fn', name: 'Function on a column', rule: 'Rows Removed by Filter ≫ rows returned, on a column that has an index',
    query: "SELECT id FROM users WHERE lower(email) = 'user4242@example.com';",
    before: ['Seq Scan on users (est rows=50) (actual rows=1 loops=1)', "  Filter: (lower(email) = 'user4242@example.com'::text)", '  Rows Removed by Filter: 9999', '  Buffers: shared hit=84'],
    marks: [0, 1, 2],
    after: ['Bitmap Heap Scan on users (est rows=50) (actual rows=1 loops=1)', "  Recheck Cond: (lower(email) = 'user4242@example.com'::text)", '  Buffers: shared hit=1 read=2', '  ->  Bitmap Index Scan on users_lower_email (est rows=50) (actual rows=1 loops=1)', "        Index Cond: (lower(email) = 'user4242@example.com'::text)"],
    good: [3, 4], fix: 'CREATE INDEX users_lower_email ON users (lower(email));',
    why: 'The index on `email` stores raw values, not `lower(email)`, so the planner cannot use it and filters all 10 000 rows. An **expression index** stores exactly what the WHERE compares.',
    metric: 'buffers', b: 84, a: 3 },
  { id: 'cast', name: 'Cast on the column', rule: 'A Filter applies ::type to the column instead of the constant',
    query: "SELECT count(*) FROM orders WHERE created_at::date = '2026-03-01';",
    before: ['Aggregate (est rows=1) (actual rows=1 loops=1)', '  Buffers: shared hit=500', '  ->  Seq Scan on orders (est rows=300) (actual rows=480 loops=1)', "        Filter: ((created_at)::date = '2026-03-01'::date)", '        Rows Removed by Filter: 59520'],
    marks: [2, 3, 4],
    after: ['Aggregate (est rows=1) (actual rows=1 loops=1)', '  Buffers: shared hit=1 read=3', '  ->  Index Only Scan using orders_created on orders (est rows=462) (actual rows=480 loops=1)', "        Index Cond: ((created_at >= '2026-03-01 00:00+00') AND (created_at < '2026-03-02 00:00+00'))", '        Heap Fetches: 0'],
    good: [2, 3], fix: "WHERE created_at >= '2026-03-01' AND created_at < '2026-03-02'",
    why: 'Casting every row to `date` hides the column from its index. Rewrite the condition as a **half-open range** on the raw column: it is **sargable** (usable as an index condition).',
    metric: 'buffers', b: 500, a: 4 },
  { id: 'type', name: 'Type mismatch', rule: 'The column is cast to the parameter\'s type: (user_id)::numeric',
    query: 'SELECT * FROM orders WHERE user_id = 4242.0;   -- a numeric parameter from the driver',
    before: ['Seq Scan on orders (est rows=300) (actual rows=6 loops=1)', '  Filter: ((user_id)::numeric = 4242.0)', '  Rows Removed by Filter: 59994', '  Buffers: shared hit=500'],
    marks: [0, 1, 2],
    after: ['Bitmap Heap Scan on orders (est rows=6) (actual rows=6 loops=1)', '  Recheck Cond: (user_id = 4242)', '  Buffers: shared hit=9 read=2', '  ->  Bitmap Index Scan on orders_user (est rows=6) (actual rows=6 loops=1)', '        Index Cond: (user_id = 4242)'],
    good: [3, 4], fix: 'WHERE user_id = 4242      -- or $1::bigint: send the column\'s type',
    why: '`bigint = numeric` resolves to a numeric comparison, so every `user_id` is converted and the bigint index is useless. Bind parameters with the column\'s own type.',
    metric: 'buffers', b: 500, a: 11 },
  { id: 'stats', name: 'Stale statistics', rule: 'Estimated rows and actual rows differ by orders of magnitude',
    query: "-- right after a bulk load of 20 000 'imported' orders\nSELECT u.country, count(*) FROM orders o JOIN users u ON u.id = o.user_id\nWHERE o.status = 'imported' GROUP BY 1;",
    before: ['GroupAggregate (est rows=1) (actual rows=5 loops=1)', '  Buffers: shared hit=60184', '  ->  Sort (est rows=1) (actual rows=20000 loops=1)', '        ->  Nested Loop (est rows=1) (actual rows=20000 loops=1)', '              ->  Index Scan using orders_status on orders o (est rows=1) (actual rows=20000 loops=1)', '              ->  Index Scan using users_pkey on users u (est rows=1) (actual rows=1 loops=20000)', '                    Index Searches: 20000', '                    Buffers: shared hit=60000'],
    marks: [3, 4, 5, 6],
    after: ['HashAggregate (est rows=5) (actual rows=5 loops=1)', '  Buffers: shared hit=268', '  ->  Hash Join (est rows=20043) (actual rows=20000 loops=1)', '        ->  Bitmap Heap Scan on orders o (est rows=20043) (actual rows=20000 loops=1)', '        ->  Hash (est rows=10000) (actual rows=10000 loops=1)', '              ->  Seq Scan on users u (est rows=10000) (actual rows=10000 loops=1)'],
    good: [2, 3], fix: 'ANALYZE orders;',
    why: 'Statistics still say no row has status `imported`, so the planner expects 1 row and picks a **nested loop**: 20 000 index probes. After `ANALYZE` the estimate is right and a hash join reads each table once.',
    metric: 'buffers', b: 60184, a: 268 },
  { id: 'sort', name: 'Sort spills to disk', rule: 'Sort Method: external merge, temp read/written buffers',
    query: "SET work_mem = '64kB';\nSELECT id, amount FROM orders ORDER BY amount DESC, id;",
    before: ['Sort (est rows=80000) (actual rows=80000 loops=1)', '  Sort Key: amount DESC, id', '  Sort Method: external merge  Disk: 1912kB', '  Buffers: shared hit=667, temp read=700 written=758', '  ->  Seq Scan on orders (est rows=80000) (actual rows=80000 loops=1)'],
    marks: [2, 3],
    after: ['Sort (est rows=80000) (actual rows=80000 loops=1)', '  Sort Key: amount DESC, id', '  Sort Method: quicksort  Memory: 4549kB', '  Buffers: shared hit=667', '  ->  Seq Scan on orders (est rows=80000) (actual rows=80000 loops=1)'],
    good: [2], fix: "SET work_mem = '8MB';   -- for this session or this report only",
    why: 'The sort needed about 4.5 MB but `work_mem` allowed 64 kB, so it wrote runs to temporary files and merged them. Raise `work_mem` for the heavy query, add a `LIMIT`, or serve the order from an index.',
    metric: 'temp buffers', b: 1458, a: 0 },
  { id: 'n1', name: 'N+1 queries', rule: 'One cheap statement with a huge call count in pg_stat_statements',
    query: '-- ORM: for each of 50 users …\nSELECT id, amount FROM orders WHERE user_id = $1;',
    before: ['pg_stat_statements', '  query: SELECT id, amount FROM orders WHERE user_id = $1', '  calls: 50', '  rows: 400', '  shared blocks: 500'],
    marks: [2, 4],
    after: ['pg_stat_statements', '  query: SELECT user_id, id, amount FROM orders WHERE user_id = ANY($1)', '  calls: 1', '  rows: 400', '  shared blocks: 305'],
    good: [2, 4], fix: 'SELECT user_id, id, amount FROM orders WHERE user_id = ANY($1);   -- $1 = array of 50 ids',
    why: 'Each call is fast, but 50 round trips each pay network latency, parsing and a separate index descent. One statement with an array returns the same 400 rows in **one round trip**.',
    metric: 'round trips', b: 50, a: 1 },
]

function SmellViz() {
  const [i, setI] = useState(0)
  const [view, setView] = useState<'before' | 'after'>('before')
  const s = SMELLS[i]
  const marks: Record<number, Tone> = Object.fromEntries((view === 'before' ? s.marks : s.good).map((m) => [m, view === 'before' ? 'dead' : 'ok']))
  const next = () => { if (view === 'before') setView('after'); else { setI((i + 1) % SMELLS.length); setView('before') } }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-1.5">
        {SMELLS.map((x, k) => (
          <button key={x.id} type="button" onClick={() => { setI(k); setView('before') }}
            className={`rounded-md px-2 py-1 text-[11.5px] font-medium ${k === i ? 'bg-accent text-white' : 'border border-line text-muted hover:text-ink'}`}>{k + 1}. {x.name}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Plan" value={view} onChange={setView} options={[['before', 'As written'], ['after', 'After the fix']]} />
        <Btn primary testid="viz-next" onClick={next}>{view === 'before' ? 'Apply the fix' : 'Next smell'}</Btn>
      </div>
      <Sql>{view === 'before' ? s.query : `-- fix\n${s.fix}`}</Sql>
      <motion.div key={`${s.id}-${view}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PlanBox lines={view === 'before' ? s.before : s.after} marks={marks} />
      </motion.div>
      <p className="-mt-1 text-[11px] text-muted">Plans are trimmed to the relevant lines; <code className="inline-code">(cost=… rows=N width=…)</code> is shown as <code className="inline-code">(est rows=N)</code>.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: tone(view === 'before' ? 'dead' : 'ok'), background: toneBg(view === 'before' ? 'dead' : 'ok', 8) }}>
          <p className="mb-1 flex flex-wrap items-center gap-2"><Tag t={view === 'before' ? 'dead' : 'ok'}>{view === 'before' ? 'smell' : 'fixed'}</Tag><span className="text-xs text-muted">{s.rule}</span></p>
          <p className="text-muted"><Md>{view === 'before' ? s.why : `Fix: \`${s.fix}\``}</Md></p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-64">
          <Stat label={`${s.metric} before`} value={s.b.toLocaleString('en-US')} t="dead" />
          <Stat label="after" value={s.a.toLocaleString('en-US')} t={view === 'after' ? 'ok' : 'muted'} />
        </div>
      </div>
      <Panel title="The 30-second read">
        <ol className="grid gap-1 text-xs text-muted sm:grid-cols-2">
          <li>1. Start at the node with the most buffers or time.</li>
          <li>2. Compare <b>est rows</b> with <b>actual rows × loops</b>.</li>
          <li>3. Look for <b>Rows Removed by Filter</b> far above rows returned.</li>
          <li>4. Look for casts or functions wrapped around a column.</li>
          <li>5. Look for <b>external merge</b>, temp buffers, Batches &gt; 1.</li>
          <li>6. In pg_stat_statements, sort by total time and by calls.</li>
        </ol>
      </Panel>
      <Legend items={[['dead', 'smell'], ['ok', 'what the fix changed']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'performance-checklist',
  module: 'f4',
  order: 8,
  title: 'A query performance checklist',
  tldr: [
    'Most slow queries come from a short list of causes (functions or casts on indexed columns, stale statistics, memory spills and N+1 round trips) and each leaves a recognizable mark in `EXPLAIN (ANALYZE, BUFFERS)` or `pg_stat_statements`.',
    'A checklist turns tuning from guesswork into a routine: find the top queries, read the plan for the smell, apply the matching fix, and measure buffers before and after.',
  ],
  visualizer: {
    title: 'An EXPLAIN smell detector',
    caption: 'Pick a smell, read the flagged plan lines, then press **Apply the fix** to see the plan change and the buffer count drop. Every plan was measured on the playground schema.',
    Component: SmellViz,
  },
  playground: {
    extensions: ['pg_stat_statements'],
    setup: `
SET TimeZone = 'UTC';
CREATE TABLE users (id bigint PRIMARY KEY, email text NOT NULL, country text NOT NULL, created_at timestamptz NOT NULL);
INSERT INTO users
SELECT g, 'User' || g || '@Example.com', (ARRAY['DE','FR','US','IN','BR'])[1 + g % 5],
       timestamptz '2025-01-01 00:00+00' + g * interval '25 minutes'
FROM generate_series(1, 10000) g;
CREATE INDEX users_email ON users (email);
CREATE TABLE orders (
  id bigint PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users,
  status text NOT NULL,
  amount numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL);
INSERT INTO orders
SELECT g, 1 + (g * 7919) % 10000, (ARRAY['paid','paid','paid','refunded','pending'])[1 + g % 5],
       5 + (g * 37) % 300, timestamptz '2026-01-01 00:00+00' + g * interval '3 minutes'
FROM generate_series(1, 60000) g;
CREATE INDEX orders_user ON orders (user_id);
CREATE INDEX orders_created ON orders (created_at);
CREATE INDEX orders_status ON orders (status);
VACUUM ANALYZE;`,
    presets: [
      { label: '1. Find the top queries', sql: `SELECT pg_stat_statements_reset();

-- a little workload: an N+1 loop and one report
SELECT id, amount FROM orders WHERE user_id = 1;
SELECT id, amount FROM orders WHERE user_id = 2;
SELECT id, amount FROM orders WHERE user_id = 3;
SELECT id, amount FROM orders WHERE user_id = 4;
SELECT id, amount FROM orders WHERE user_id = 5;
SELECT status, sum(amount) FROM orders GROUP BY status;

SELECT calls, rows, round(total_exec_time::numeric, 3) AS total_ms,
       shared_blks_hit + shared_blks_read AS blocks, left(query, 60) AS query
FROM pg_stat_statements
WHERE query ILIKE '%orders%' AND query NOT ILIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC;`,
        note: 'Five statements with different constants collapse into **one normalized entry** (`user_id = $1`, calls = 5). Sort by `total_exec_time` for what costs the most overall, and by `calls` to spot N+1 loops.' },
      { label: '2. Function on an indexed column', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id FROM users WHERE lower(email) = 'user4242@example.com';

CREATE INDEX users_lower_email ON users (lower(email));

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id FROM users WHERE lower(email) = 'user4242@example.com';`,
        note: 'Before: Seq Scan, **Rows Removed by Filter: 9999**, 84 buffers. After the expression index: a Bitmap Index Scan, 3 buffers. The plain `users_email` index never helped `lower(email)`.' },
      { label: '3. Casts and type mismatches', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM orders WHERE created_at::date = '2026-03-01';

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM orders WHERE created_at >= '2026-03-01' AND created_at < '2026-03-02';

EXPLAIN (COSTS OFF) SELECT * FROM orders WHERE user_id = 4242.0;
EXPLAIN (COSTS OFF) SELECT * FROM orders WHERE user_id = 4242;`,
        note: 'The cast version filters 59 520 rows (500 buffers); the half-open range is an Index Only Scan (4 buffers). With `4242.0` the filter reads `(user_id)::numeric = 4242.0`: the column is converted, so `orders_user` cannot be used.' },
      { label: '4. Stale statistics after a bulk load', sql: `INSERT INTO orders
SELECT 60000 + g, 1 + g % 10000, 'imported', 9.99, timestamptz '2026-07-01 00:00+00' + g * interval '1 second'
FROM generate_series(1, 20000) g;

EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT u.country, count(*) FROM orders o JOIN users u ON u.id = o.user_id
WHERE o.status = 'imported' GROUP BY 1;

ANALYZE orders;

EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT u.country, count(*) FROM orders o JOIN users u ON u.id = o.user_id
WHERE o.status = 'imported' GROUP BY 1;`,
        note: 'Before ANALYZE the planner estimates **rows=1** for 20 000 actual rows and runs a Nested Loop with `loops=20000` (about 60 000 buffers). After ANALYZE: a Hash Join, about 270 buffers. Run ANALYZE after every bulk load.' },
      { label: '5. Sort spilling to disk', sql: `SET work_mem = '64kB';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id, amount FROM orders ORDER BY amount DESC, id;

SET work_mem = '8MB';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id, amount FROM orders ORDER BY amount DESC, id;
RESET work_mem;`,
        note: 'At 64 kB the plan says **Sort Method: external merge** with temp read/written buffers. At 8 MB it is an in-memory quicksort. `work_mem` applies per sort or hash node, so raise it per session or per query, not globally.' },
      { label: '6. Batch instead of N+1', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT user_id, id, amount FROM orders
WHERE user_id = ANY (ARRAY(SELECT generate_series(1, 50)::bigint));

-- or join once instead of looping in the application
SELECT u.id, count(o.id) AS orders, coalesce(sum(o.amount), 0) AS total
FROM users u LEFT JOIN orders o ON o.user_id = u.id
WHERE u.id <= 5 GROUP BY u.id ORDER BY u.id;`,
        note: 'One statement fetches all 50 users\' orders: one round trip, one plan, and a single Bitmap Index Scan with `user_id = ANY(…)` that returns every matching row (400 after preset 4\'s import, 300 without it) for about 300 buffers, against about 500 for 50 separate queries. A join with GROUP BY replaces a per-row loop entirely.' },
      { label: '7. Indexes that never get used', sql: `SELECT relname AS table_name, seq_scan, idx_scan
FROM pg_stat_user_tables ORDER BY seq_scan DESC;

SELECT indexrelname AS index_name, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes ORDER BY idx_scan, indexrelname;`,
        note: 'Indexes with `idx_scan = 0` after a representative workload cost writes and space for nothing (here `users_email`, made redundant by the `lower(email)` index). A primary key or unique index at 0 still enforces its constraint, so keep it. Check replicas too before dropping one.' },
    ],
  },
  production: {
    title: 'A weekly tuning routine for an API database',
    context: 'An API team saw p95 latency creep up over months. Nothing was obviously broken, and every query looked fine in isolation.',
    problem: 'The top of `pg_stat_statements` held three kinds of trouble: a login lookup on `lower(email)` doing a sequential scan on every request, an ORM loop issuing 200 single-row queries per page, and a nightly import after which reports switched to nested loops until autovacuum next analyzed the table.',
    solution: 'Run the checklist weekly: list the top statements by total time and by calls, `EXPLAIN (ANALYZE, BUFFERS)` each, match the smell, apply the fix, and compare buffers. Here: an expression index, a batched `= ANY($1)` query, and an explicit `ANALYZE` at the end of the import job.',
    sql: `SELECT queryid, calls, round(total_exec_time) AS total_ms,
       round(mean_exec_time::numeric, 2) AS mean_ms, rows,
       shared_blks_hit + shared_blks_read AS blocks, left(query, 80) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

CREATE INDEX CONCURRENTLY users_lower_email ON users (lower(email));
-- end of the import job
ANALYZE orders;`,
    outcome: 'On the playground data the same three fixes cut the login lookup from 84 to 3 buffers, the report after a bulk load from about 60 000 to 270 buffers, and the page from 50 round trips to 1. The routine catches regressions while they are still small.',
  },
  pitfalls: [
    { title: 'Tuning from EXPLAIN without ANALYZE',
      symptom: 'An index is added, the cost estimate drops, and production gets no faster.',
      cause: 'Plain EXPLAIN shows only estimates. If the estimates are wrong, so is every conclusion drawn from them.',
      fix: 'Use `EXPLAIN (ANALYZE, BUFFERS)` and compare estimated with actual rows. Wrap writes in `BEGIN … ROLLBACK`, because ANALYZE really executes the statement.' },
    { title: 'Testing on tiny tables',
      symptom: 'A query uses an index in development and a sequential scan in production, or the other way round.',
      cause: 'The planner picks plans by table size and statistics. A table that fits on a few pages is always cheapest to scan.',
      fix: 'Test with production-sized data, or at least realistic row counts and distributions, and run ANALYZE before reading plans.' },
    { title: 'Raising work_mem globally',
      symptom: 'Out-of-memory errors under load after "fixing" sort spills.',
      cause: '`work_mem` is granted per sort or hash node, per query, per connection. A complex query with many connections multiplies it.',
      fix: 'Raise it only where needed: `SET LOCAL work_mem = \'64MB\'` inside the reporting transaction, or `ALTER ROLE reporting SET work_mem = …`.' },
    { title: 'Indexing every column',
      symptom: 'Writes slow down and the database grows, while reads do not improve.',
      cause: 'Every index is updated on every insert and non-HOT update, and unused indexes are pure cost.',
      fix: 'Index for the queries you actually run (check `pg_stat_statements`), and drop indexes that stay at `idx_scan = 0`.' },
  ],
  pointers: [
    'Find: `pg_stat_statements` sorted by **total time** and by **calls**.',
    'Read: estimated vs **actual rows × loops**, **Rows Removed by Filter**, buffers, **external merge**.',
    'Fix: expression index or half-open range for wrapped columns, matching parameter types, `ANALYZE` after loads, batch N+1.',
    'Measure: compare **shared buffers** before and after; timings vary, buffer counts are stable.',
    'Going deeper: [EXPLAIN ANALYZE](/m4/explain-analyze) and [Planner statistics](/m4/statistics) explain every number in a plan.',
  ],
  sources: ['using-explain.html', 'sql-explain.html', 'indexes-expressional.html', 'typeconv-oper.html', 'planner-stats.html', 'runtime-config-resource.html', 'pgstatstatements.html', 'monitoring-stats.html', 'performance-tips.html'],
}
