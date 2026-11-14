import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Tiles } from './_kit'
import { PLANS, type PlanNode } from './_plans'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: seven real EXPLAIN (ANALYZE, BUFFERS) plans captured from PGlite (PostgreSQL 18.6) on
 * the playground schema, drawn as a clickable tree. Each node prints the same lines as the text
 * format; clicking it explains every field and flags the classic problems (spills, batches,
 * heap fetches, misestimates, discarded rows).
 * ---------------------------------------------------------------------------------------------- */

const SCEN: { id: string; label: string; setting: string; story: string }[] = [
  { id: 'sort_mem', label: 'Sort in memory', setting: "SET work_mem = '16MB'", story: 'All 100000 rows fit in `work_mem`, so the Sort node uses **quicksort** in 5174 kB of memory.' },
  { id: 'sort_disk', label: 'Sort spills', setting: "SET work_mem = '64kB'", story: 'Same query, tiny `work_mem`: **external merge** on disk. `temp read/written` buffers appear, and the startup cost rises from 9942 to 15076.' },
  { id: 'hash_1', label: 'Hash join + HashAggregate', setting: "SET work_mem = '4MB'", story: 'The **Hash** node builds a hash table of 5000 customers (1 batch, 208 kB). The join probes it once per order, and HashAggregate groups 100000 rows into 4.' },
  { id: 'hash_n', label: 'Hash join, 2 batches', setting: "SET work_mem = '64kB'", story: 'The inner side no longer fits in `work_mem × hash_mem_multiplier`, so it is split into **2 batches**, written to temp files and joined batch by batch.' },
  { id: 'nestloop', label: 'Nested loop, loops=3', setting: "SET work_mem = '4MB'", story: 'The inner side runs **once per outer row**: `loops=3`. Its rows and times are **per loop**, so multiply by 3 for totals.' },
  { id: 'ios_before', label: 'Index-only, before VACUUM', setting: 'SET enable_seqscan = off; SET enable_bitmapscan = off', story: 'Fresh data: no page is marked all-visible yet, so the "index-only" scan checks the heap for **every** row: `Heap Fetches: 6020`, 6028 buffers.' },
  { id: 'ios_after', label: 'Index-only, after VACUUM', setting: 'VACUUM orders', story: 'VACUUM set the visibility-map bits. Now the same scan skips the heap entirely: `Heap Fetches: 0`, **9 buffers**, and the planner picks it on its own.' },
]

const num = (n: PlanNode, k: string) => (typeof n[k] === 'number' ? (n[k] as number) : undefined)
const str = (n: PlanNode, k: string) => (n[k] === undefined ? undefined : Array.isArray(n[k]) ? (n[k] as string[]).join(', ') : String(n[k]))
const f2 = (x?: number) => (x ?? 0).toFixed(2)

function title(n: PlanNode) {
  let t = str(n, 'Node Type')!
  if (t === 'Aggregate') t = n.Strategy === 'Hashed' ? 'HashAggregate' : n.Strategy === 'Sorted' ? 'GroupAggregate' : 'Aggregate'
  if (n['Index Name'] && t !== 'Bitmap Index Scan') t += ` using ${n['Index Name']}`
  if (t === 'Bitmap Index Scan') t += ` on ${n['Index Name']}`
  if (n['Relation Name']) t += ` on ${n['Relation Name']}${n.Alias && n.Alias !== n['Relation Name'] ? ` ${n.Alias}` : ''}`
  return t
}

/** Property lines, in the same order and wording as EXPLAIN's text format. */
function props(n: PlanNode): [string, string, Tone?][] {
  const out: [string, string, Tone?][] = []
  const add = (k: string, v: string | undefined, t?: Tone) => { if (v !== undefined) out.push([k, v, t]) }
  add('Sort Key', str(n, 'Sort Key'))
  if (n['Sort Method']) add('Sort Method', `${n['Sort Method']}  ${n['Sort Space Type'] === 'Disk' ? 'Disk' : 'Memory'}: ${n['Sort Space Used']}kB`, n['Sort Space Type'] === 'Disk' ? 'dead' : 'ok')
  add('Group Key', str(n, 'Group Key'))
  if (n['HashAgg Batches'] !== undefined) add('Batches', `${n['HashAgg Batches']}  Memory Usage: ${n['Peak Memory Usage']}kB`, num(n, 'HashAgg Batches')! > 1 ? 'dead' : undefined)
  add('Hash Cond', str(n, 'Hash Cond'))
  if (n['Hash Buckets'] !== undefined) add('Buckets', `${n['Hash Buckets']}  Batches: ${n['Hash Batches']}  Memory Usage: ${n['Peak Memory Usage']}kB`, num(n, 'Hash Batches')! > 1 ? 'dead' : 'ok')
  add('Index Cond', str(n, 'Index Cond'), 'ok')
  add('Recheck Cond', str(n, 'Recheck Cond'), 'new')
  add('Filter', str(n, 'Filter'), 'new')
  if (num(n, 'Rows Removed by Filter')) add('Rows Removed by Filter', String(n['Rows Removed by Filter']), 'dead')
  if (n['Exact Heap Blocks'] !== undefined) add('Heap Blocks', `exact=${n['Exact Heap Blocks']}${num(n, 'Lossy Heap Blocks') ? ` lossy=${n['Lossy Heap Blocks']}` : ''}`)
  if (n['Heap Fetches'] !== undefined) add('Heap Fetches', String(n['Heap Fetches']), num(n, 'Heap Fetches') ? 'dead' : 'ok')
  add('Index Searches', str(n, 'Index Searches'), 'pointer')
  const buf = [`shared hit=${n['Shared Hit Blocks'] ?? 0}`]
  if (num(n, 'Shared Read Blocks')) buf.push(`read=${n['Shared Read Blocks']}`)
  const temp = [num(n, 'Temp Read Blocks') ? `read=${n['Temp Read Blocks']}` : '', num(n, 'Temp Written Blocks') ? `written=${n['Temp Written Blocks']}` : ''].filter(Boolean)
  add('Buffers', buf.join(' ') + (temp.length ? `, temp ${temp.join(' ')}` : ''), temp.length ? 'dead' : 'pointer')
  return out
}

const FIELD_HELP: Record<string, string> = {
  cost: '**Estimated** startup..total cost in planner units. Startup is spent before the first row comes out; total assumes the node runs to completion.',
  rows: '**Estimated rows** the node emits per loop, from statistics. Compare with actual rows: a big gap is the most common root cause of a bad plan.',
  actual: '**actual time** = ms to first row .. ms to last row, and **rows** (two decimals since 18) are **averages per loop**. Multiply by loops for totals.',
  loops: 'How many times the node ran. Inner sides of nested loops and correlated subplans run many times.',
  'Sort Method': '**quicksort** = in memory; **top-N heapsort** = kept only the LIMIT rows; **external merge** = spilled to temp files because the data exceeded `work_mem`.',
  Batches: 'More than one batch means the hash table did not fit in `work_mem × hash_mem_multiplier` and was partitioned to disk.',
  Buckets: 'Hash table size. **Batches** > 1 means the inner side spilled to temp files; **Memory Usage** is the peak hash table size.',
  'Hash Cond': 'The join condition used to probe the hash table.',
  'Index Cond': 'Conditions used to **search the index**: they bound how much of the index is read.',
  'Recheck Cond': 'Re-tested on each heap row of a bitmap scan, needed when the bitmap became lossy or the index is lossy.',
  Filter: 'Tested on every row **after** it was fetched. Rows failing it were read for nothing.',
  'Rows Removed by Filter': 'Rows read and then thrown away by `Filter`. Large numbers suggest a missing or better index.',
  'Heap Blocks': 'Heap pages a bitmap scan visited. **exact** = per-row bitmap; **lossy** = only the page was remembered, so every row on it is rechecked.',
  'Heap Fetches': 'Index-only scans visit the heap for rows on pages that are not marked **all-visible** in the visibility map. 0 is the goal; VACUUM sets the bits.',
  'Index Searches': 'New in 18: how many times the index was descended, across all loops (IN lists, skip scans and nested loops raise it).',
  Buffers: '**shared hit** = page found in shared buffers; **read** = fetched from the OS/disk; **temp** = sort/hash spill files. Counts include all child nodes. On by default with ANALYZE in 18.',
  'Sort Key': 'The columns being sorted.',
  'Group Key': 'The columns being grouped.',
}

function flags(n: PlanNode): string[] {
  const w: string[] = []
  const est = num(n, 'Plan Rows') ?? 0, act = num(n, 'Actual Rows') ?? 0
  if (Math.max(est, act) / Math.max(1, Math.min(est, act)) > 10) w.push(`Estimate off by ${(Math.max(est, act) / Math.max(1, Math.min(est, act))).toFixed(0)}×`)
  if (n['Sort Space Type'] === 'Disk') w.push('Sort spilled to disk')
  if (num(n, 'Hash Batches')! > 1) w.push(`Hash table split into ${n['Hash Batches']} batches`)
  if (num(n, 'Heap Fetches')) w.push(`${n['Heap Fetches']} heap fetches in an index-only scan`)
  if ((num(n, 'Rows Removed by Filter') ?? 0) > act * 5) w.push(`${n['Rows Removed by Filter']} rows read and discarded`)
  return w
}

function preorder(n: PlanNode, out: PlanNode[] = []) { out.push(n); n.Plans?.forEach((c) => preorder(c, out)); return out }

function NodeCard({ n, sel, onSel, depth }: { n: PlanNode; sel: PlanNode | null; onSel: (n: PlanNode) => void; depth: number }) {
  const on = sel === n
  const warn = flags(n).length > 0
  const t: Tone = on ? 'accent' : warn ? 'dead' : 'header'
  return (
    <div className={depth ? 'ml-3 border-l border-line pl-3 sm:ml-5 sm:pl-4' : ''}>
      <motion.button type="button" layout onClick={() => onSel(n)} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: depth * 0.05 }}
        className="my-1 block w-full rounded-lg border px-2.5 py-1.5 text-left" style={{ borderColor: tone(t), background: toneBg(t, on ? 14 : 6), boxShadow: on ? `0 0 0 1px ${tone('accent')}` : '0 0 0 0px transparent' }}>
        <div className="font-mono text-[12px] leading-snug">
          {depth > 0 && <span className="text-muted">-&gt; </span>}
          <span className="font-bold">{title(n)}</span>
          <span className="text-muted">  (cost={f2(num(n, 'Startup Cost'))}..{f2(num(n, 'Total Cost'))} rows={n['Plan Rows'] as number})</span>
          <span style={{ color: tone('tuple') }}> (actual time={num(n, 'Actual Startup Time')?.toFixed(3)}..{num(n, 'Actual Total Time')?.toFixed(3)} rows={f2(num(n, 'Actual Rows'))} loops={n['Actual Loops'] as number})</span>
        </div>
        <div className="mt-0.5 grid gap-px font-mono text-[11px]">
          {props(n).map(([k, v, pt]) => <div key={k} style={pt ? { color: tone(pt) } : { color: 'var(--muted)' }}>{k}: {v}</div>)}
        </div>
        {warn && <div className="mt-1 flex flex-wrap gap-1">{flags(n).map((w) => <span key={w} className="rounded px-1.5 py-px text-[10.5px] font-semibold" style={{ background: toneBg('dead', 18), color: tone('dead') }}>{w}</span>)}</div>}
      </motion.button>
      {n.Plans?.map((c, i) => <NodeCard key={i} n={c} sel={sel} onSel={onSel} depth={depth + 1} />)}
    </div>
  )
}

function Inspector({ n }: { n: PlanNode }) {
  const rows: [string, string, string][] = [
    ['cost', `${f2(num(n, 'Startup Cost'))}..${f2(num(n, 'Total Cost'))}`, FIELD_HELP.cost],
    ['rows (est.)', String(n['Plan Rows']), FIELD_HELP.rows],
    ['actual', `${num(n, 'Actual Startup Time')?.toFixed(3)}..${num(n, 'Actual Total Time')?.toFixed(3)} ms, rows=${f2(num(n, 'Actual Rows'))}`, FIELD_HELP.actual],
    ['loops', String(n['Actual Loops']), FIELD_HELP.loops],
    ...props(n).map(([k, v]) => [k, v, FIELD_HELP[k] ?? ''] as [string, string, string]),
  ]
  const loops = num(n, 'Actual Loops') ?? 1
  return (
    <Panel title={`Inspector: ${title(n)}`}>
      <div className="grid gap-1.5">
        {rows.map(([k, v, h]) => (
          <div key={k} className="rounded-md border border-line px-2 py-1">
            <p className="font-mono text-[11.5px]"><b>{k}</b>: {v}</p>
            {h && <p className="text-[12px] text-muted"><Md>{h}</Md></p>}
          </div>
        ))}
        {loops > 1 && <p className="text-xs"><Md>{`Totals for this node: **${((num(n, 'Actual Rows') ?? 0) * loops).toFixed(0)} rows** and about **${((num(n, 'Actual Total Time') ?? 0) * loops).toFixed(3)} ms** across ${loops} loops.`}</Md></p>}
      </div>
    </Panel>
  )
}

function ExplainViz() {
  const [si, setSi] = useState(0)
  const [ni, setNi] = useState(0)
  const sc = SCEN[si], p = PLANS[sc.id]
  const nodes = useMemo(() => preorder(p.plan), [p])
  const sel = nodes[Math.min(ni, nodes.length - 1)]
  const next = () => { if (ni + 1 < nodes.length) setNi(ni + 1); else { setSi((si + 1) % SCEN.length); setNi(0) } }
  const top = p.plan
  const temp = ((num(top, 'Temp Read Blocks') ?? 0) + (num(top, 'Temp Written Blocks') ?? 0))
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {SCEN.map((s, i) => (
          <button key={s.id} type="button" onClick={() => { setSi(i); setNi(0) }} className="rounded-md border px-2 py-1 text-xs"
            style={{ borderColor: i === si ? tone('accent') : 'var(--border)', background: i === si ? toneBg('accent', 14) : 'transparent' }}>{s.label}</button>
        ))}
        <Btn primary testid="viz-next" onClick={next}>Next node</Btn>
      </div>
      <Tiles items={[['Execution time', `${p.execution.toFixed(2)} ms`], ['Planning time', `${p.planning.toFixed(3)} ms`], ['Shared buffers (top)', (num(top, 'Shared Hit Blocks') ?? 0) + (num(top, 'Shared Read Blocks') ?? 0)], ['Temp buffers', temp, temp ? 'dead' : 'ok']]} />
      <div className="rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm">
        <p className="font-mono text-[11.5px] text-muted">{sc.setting};  EXPLAIN (ANALYZE, BUFFERS) {p.sql};</p>
        <AnimatePresence mode="wait"><motion.p key={sc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1"><Md>{sc.story}</Md></motion.p></AnimatePresence>
      </div>
      <Legend items={[['header', 'plan node (click it)'], ['accent', 'selected'], ['dead', 'problem flagged'], ['ok', 'index condition / healthy'], ['new', 'filter applied after fetch']]} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
          <div className="min-w-[300px]"><NodeCard n={p.plan} sel={sel} onSel={(n) => setNi(nodes.indexOf(n))} depth={0} /></div>
        </div>
        <Inspector n={sel} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE customers (id int PRIMARY KEY, region text NOT NULL, name text NOT NULL);
INSERT INTO customers SELECT g, (ARRAY['north','south','east','west'])[1 + g % 4], 'cust ' || g
FROM generate_series(1, 5000) g;
CREATE TABLE orders (id int PRIMARY KEY, customer_id int NOT NULL, amount numeric(10,2) NOT NULL, created_at timestamptz NOT NULL);
INSERT INTO orders SELECT g, 1 + (g * 7) % 5000, (g % 997) + 0.99, timestamptz '2026-01-01' + g * interval '1 minute'
FROM generate_series(1, 100000) g;
CREATE INDEX orders_customer ON orders (customer_id);
ANALYZE customers;
ANALYZE orders;`

export const lesson: Lesson = {
  slug: 'explain-analyze',
  module: 'm4',
  order: 10,
  title: 'Reading EXPLAIN (ANALYZE, BUFFERS)',
  tldr: [
    '`EXPLAIN ANALYZE` runs the query and prints the plan tree with each node\'s **estimated** cost and rows next to its **actual** time, rows, loops and (by default in PostgreSQL 18) **buffers**.',
    'Reading it bottom-up shows where time and I/O really go, and the gaps between estimates and reality point straight at the statistics, indexes or memory settings to fix.',
  ],
  visualizer: {
    title: 'Click through seven real plans',
    caption: 'Pick a scenario and click any node, or press Next node to tour the tree. Compare the in-memory and spilled sort, 1 and 2 hash batches, and an index-only scan before and after VACUUM.',
    Component: ExplainViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'Node anatomy', sql: `EXPLAIN (ANALYZE)
SELECT c.region, count(*), sum(o.amount)
FROM orders o JOIN customers c ON c.id = o.customer_id
GROUP BY c.region;`,
        note: 'Read bottom-up: two scans feed a Hash Join, which feeds HashAggregate. Each line shows `(cost=… rows=…)` then `(actual time=… rows=… loops=…)`. Buffers appear without asking: BUFFERS is on by default with ANALYZE in 18.' },
      { label: 'Filter becomes Index Cond', sql: `-- 1. baseline
EXPLAIN (ANALYZE) SELECT * FROM customers WHERE name = 'cust 4242';

-- 2. add an index and run the same query again
CREATE INDEX customers_name ON customers (name);
EXPLAIN (ANALYZE) SELECT * FROM customers WHERE name = 'cust 4242';

-- 3. an IN list descends the tree once per value
EXPLAIN (ANALYZE) SELECT * FROM customers WHERE name IN ('cust 1', 'cust 2', 'cust 3');

-- 4. what exists now
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'customers';
DROP INDEX customers_name;`,
        note: 'Before: `Seq Scan`, `Filter`, `Rows Removed by Filter: 4999`, cost 94.50 and 32 buffers. After: `Index Scan`, `Index Cond`, cost 8.30 and 3 buffers. A **Filter** is checked on every row after it is read. An **Index Cond** decides which rows are read at all. The IN list shows `Index Searches: 3`.' },
      { label: 'Sort spill', sql: `SET work_mem = '64kB';
EXPLAIN (ANALYZE) SELECT id, amount FROM orders ORDER BY amount DESC, id;
SET work_mem = '16MB';
EXPLAIN (ANALYZE) SELECT id, amount FROM orders ORDER BY amount DESC, id;
RESET work_mem;`,
        note: '`Sort Method: external merge  Disk: 2128kB` with `temp read/written` buffers, versus `quicksort  Memory: 5174kB`. The fix is memory for that query, not an index.' },
      { label: 'Hash batches', sql: `SET work_mem = '64kB';
EXPLAIN (ANALYZE)
SELECT c.name, o.amount FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.amount > 900;
RESET work_mem;`,
        note: '`Batches: 2` on the Hash node: the inner side did not fit in `work_mem × hash_mem_multiplier` (2.0), so it went to temp files and was processed in two passes.' },
      { label: 'Loops multiply', sql: `EXPLAIN (ANALYZE)
SELECT c.name, o.id, o.amount
FROM customers c JOIN orders o ON o.customer_id = c.id
WHERE c.id <= 3;`,
        note: 'The inner Bitmap Heap Scan shows `rows=20.00 loops=3`: 60 rows in total. `Index Searches: 3` counts one descent per loop.' },
      { label: 'Heap fetches → 0', sql: `SET enable_seqscan = off;
SET enable_bitmapscan = off;
EXPLAIN (ANALYZE) SELECT count(*) FROM orders WHERE customer_id BETWEEN 100 AND 400;
VACUUM orders;
EXPLAIN (ANALYZE) SELECT count(*) FROM orders WHERE customer_id BETWEEN 100 AND 400;
RESET enable_seqscan;
RESET enable_bitmapscan;`,
        note: 'Before VACUUM: `Heap Fetches: 6020` and about 6028 buffers. After VACUUM sets the visibility map: `Heap Fetches: 0` and 9 buffers. Same plan shape, a 600× difference in I/O.' },
      { label: 'Misestimate', sql: `EXPLAIN (ANALYZE, BUFFERS OFF)
SELECT * FROM orders WHERE amount::int % 10 = 0 AND customer_id < 100;`,
        note: 'An expression the planner has no statistics for gets a default selectivity, here **10 rows estimated, 199 actual**. Compare the two `rows=` values on each line first: everything above a misestimate is planned on wrong numbers.' },
      { label: 'JSON and settings', sql: `SET work_mem = '64kB';
EXPLAIN (ANALYZE, SETTINGS, FORMAT JSON, TIMING OFF) SELECT id FROM orders ORDER BY amount LIMIT 10;
RESET work_mem;`,
        note: '`SETTINGS` lists planner-relevant settings that differ from defaults: `work_mem`, and also `max_parallel_workers_per_gather = 0`, which is why the playground never shows parallel plans. `FORMAT JSON` is what plan visualizers parse. The `Sort Method` is `top-N heapsort`: LIMIT keeps only 10 rows, so no spill.' },
    ],
  },
  production: {
    title: 'A nightly report that took 40 minutes',
    context: 'A finance team\'s nightly job joined invoices to line items and sorted the result for export. It ran for 40 minutes and got slower every month.',
    problem: '`EXPLAIN (ANALYZE, BUFFERS)` showed a Hash node with **Batches: 64** and gigabytes of temp writes, then a Sort with **external merge**. The server ran with the default `work_mem` of 4MB, so every hash and sort spilled to disk.',
    solution: 'Give this one job more memory instead of raising it globally (each sort or hash node in every session may use `work_mem`, and hashes up to `hash_mem_multiplier` times that). Set it in the job\'s transaction, rerun EXPLAIN, and confirm `Batches: 1` and an in-memory sort.',
    sql: `BEGIN;
SET LOCAL work_mem = '512MB';
SET LOCAL hash_mem_multiplier = 2.0;
EXPLAIN (ANALYZE, BUFFERS)
SELECT i.id, i.issued_at, l.*
FROM invoices i JOIN line_items l ON l.invoice_id = i.id
ORDER BY i.issued_at;
COMMIT;`,
    outcome: 'In the playground the same effect is visible at small scale: the sort goes from external merge with 1636 temp blocks to an in-memory quicksort, and the hash join from 2 batches to 1. Spill-free plans also stop competing for disk with daytime traffic.',
  },
  pitfalls: [
    { title: 'Reading per-loop numbers as totals',
      symptom: 'A nested-loop inner node shows `actual time=0.014 rows=20` and looks cheap, yet the query is slow.',
      cause: 'Actual time and rows are **averages per loop**. With `loops=50000` that node ran 50000 times.',
      fix: 'Multiply time and rows by `loops`. Look for the node whose time × loops dominates. Buffers, unlike rows, are already totals.' },
    { title: 'Running EXPLAIN ANALYZE on writes',
      symptom: 'Someone "just explains" a DELETE in production and the rows are gone.',
      cause: 'ANALYZE really **executes** the statement, side effects included.',
      fix: 'Wrap it in a transaction and roll back.',
      sql: `BEGIN;
EXPLAIN (ANALYZE, BUFFERS) DELETE FROM orders WHERE created_at < now() - interval '1 year';
ROLLBACK;` },
    { title: 'Blaming the wrong node',
      symptom: 'Tuning effort goes into the top node because it shows the largest time.',
      cause: 'A node\'s actual time **includes its children**. The top node is always the slowest.',
      fix: 'Subtract children\'s times to find each node\'s own work, or use a visualizer that does it. Start from the deepest node whose estimate first diverges from actual rows.' },
    { title: 'Index-only scans that are not',
      symptom: '`Index Only Scan` with a large `Heap Fetches` count is barely faster than an index scan.',
      cause: 'Index entries carry no visibility information. Pages not marked all-visible in the visibility map force a heap visit per row.',
      fix: 'VACUUM the table (or tune autovacuum for insert-heavy tables with `autovacuum_vacuum_insert_scale_factor`) so pages become all-visible.' },
    { title: 'Looking for EXPLAIN options that do not exist',
      symptom: '`ERROR: unrecognized EXPLAIN option "io"`, or a search through `EXPLAIN (ANALYZE, VERBOSE)` output for CPU figures that never appear.',
      cause: 'Common claims say PostgreSQL 18 added an `IO` option and that VERBOSE reports CPU usage. Neither is true. The options are ANALYZE, VERBOSE, COSTS, SETTINGS, GENERIC_PLAN, BUFFERS, SERIALIZE, WAL, TIMING, SUMMARY, MEMORY and FORMAT. The CPU, WAL and read statistics added in 18 appear in `VACUUM (VERBOSE)` and `ANALYZE (VERBOSE)` output.',
      fix: 'For I/O, read the `Buffers:` lines (automatic with ANALYZE in 18), and set `track_io_timing = on` to add `I/O Timings`. Use `BUFFERS OFF` to hide them. For CPU time, compare `actual time` with the I/O timings.',
      sql: `SET track_io_timing = on;
EXPLAIN (ANALYZE) SELECT count(*) FROM orders;` },
  ],
  pointers: [
    'Each node: `(cost=startup..total rows= width=)` estimated, then `(actual time=first..last rows= loops=)` measured. **Compare the two rows values first.**',
    'Actual rows and time are **per loop**; multiply by `loops`. A node\'s time includes its children.',
    '**Buffers** (default with ANALYZE in 18): shared hit = cached, read = from OS, temp = spills. They include child nodes.',
    'Red flags: `external merge Disk`, `Batches` > 1, `Heap Fetches` > 0, big `Rows Removed by Filter`, `lossy` heap blocks.',
    'Not shown in the playground but common in production: `Gather` with `Workers Planned/Launched` for parallel query, and a `JIT:` block when the plan cost exceeds `jit_above_cost`.',
  ],
  sources: ['using-explain.html', 'sql-explain.html', 'runtime-config-resource.html', 'indexes-index-only-scans.html', 'parallel-plans.html', 'jit-decision.html'],
}
