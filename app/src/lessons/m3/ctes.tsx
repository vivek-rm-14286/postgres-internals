import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { Sql, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the same CTE planned five ways. Every plan tree, row count, buffer count and storage size
 * is copied from EXPLAIN (ANALYZE, BUFFERS) on PostgreSQL 18 (PGlite) against the playground's
 * orders table: 20,000 rows in 128 pages, an index on customer_id, 40 orders for customer 42.
 * ---------------------------------------------------------------------------------------------- */

interface PNode { name: string; detail?: string[]; rows: number; t: Tone; kids?: PNode[]; label?: string }
interface CState { sql: string; plan?: PNode[]; read: number; hits: number; storage: string; snapshot?: { table: string; returning: string } }

const TOTAL = 20000
const bitmap: PNode = { name: 'Bitmap Heap Scan on orders', rows: 40, t: 'ok', detail: ['Recheck Cond: (customer_id = 42)', 'Heap Blocks: exact=40'],
  kids: [{ name: 'Bitmap Index Scan on orders_customer_id_idx', rows: 40, t: 'pointer', detail: ['Index Cond: (customer_id = 42)'] }] }
const cteSeq = (storage: string): PNode => ({ name: 'Seq Scan on orders', rows: TOTAL, t: 'dead', label: `CTE c: run first, copied into a ${storage} tuplestore` })

const steps: Step<CState>[] = [
  { title: 'Referenced once: the CTE is inlined', body: 'A plain, side-effect-free CTE used **once** is folded into the outer query, as if you wrote the subquery inline. The `customer_id = 42` filter reaches the table, so the **index** is used: 40 rows read.',
    state: { sql: `WITH c AS (SELECT * FROM orders)\nSELECT * FROM c WHERE customer_id = 42;`, plan: [bitmap], read: 40, hits: 42, storage: '0' } },
  { title: 'MATERIALIZED: an optimization fence', body: '`AS MATERIALIZED` forces the CTE to run **on its own first**. All 20,000 rows are copied into a **tuplestore** (a temporary row buffer, in memory or spilled to disk), then the outer filter throws away 19,960 of them. The index is never considered.',
    state: { sql: `WITH c AS MATERIALIZED (\n  SELECT * FROM orders)\nSELECT * FROM c WHERE customer_id = 42;`, read: TOTAL, hits: 128, storage: '1066 kB',
      plan: [{ name: 'CTE Scan on c', rows: 40, t: 'new', detail: ['Filter: (customer_id = 42)', 'Rows Removed by Filter: 19960'] }, cteSeq('1066 kB')] } },
  { title: 'A volatile function blocks inlining', body: 'Inlining is only allowed when the CTE has **no side effects**. `random()` is volatile, so the CTE is materialized even without the keyword, with the same full scan.',
    state: { sql: `WITH c AS (\n  SELECT *, random() AS r FROM orders)\nSELECT * FROM c WHERE customer_id = 42;`, read: TOTAL, hits: 128, storage: '1222 kB',
      plan: [{ name: 'CTE Scan on c', rows: 40, t: 'new', detail: ['Filter: (customer_id = 42)', 'Rows Removed by Filter: 19960'] }, cteSeq('1222 kB')] } },
  { title: 'Referenced twice: materialized by default', body: 'With **two references** PostgreSQL computes the CTE once and scans the copy twice. Here that is wasteful: the query needs **one** row from each side, but the copy holds all 20,000.',
    state: { sql: `WITH c AS (SELECT * FROM orders)\nSELECT *\nFROM c a JOIN c b\n  ON a.id = b.customer_id\nWHERE b.id = 123;`, read: TOTAL, hits: 128, storage: '1066 kB',
      plan: [{ name: 'Hash Join', rows: 1, t: 'muted', detail: ['Hash Cond: (a.id = b.customer_id)'], kids: [
        { name: 'CTE Scan on c a', rows: TOTAL, t: 'new' },
        { name: 'Hash', rows: 1, t: 'muted', kids: [{ name: 'CTE Scan on c b', rows: 1, t: 'new', detail: ['Filter: (id = 123)', 'Rows Removed by Filter: 19999'] }] }] },
      cteSeq('1066 kB')] } },
  { title: 'NOT MATERIALIZED: inline each reference', body: '`AS NOT MATERIALIZED` folds **every** reference. Each copy of the subquery gets its own filter, so both sides become primary-key lookups: **6 buffers instead of 128**.',
    state: { sql: `WITH c AS NOT MATERIALIZED (\n  SELECT * FROM orders)\nSELECT *\nFROM c a JOIN c b\n  ON a.id = b.customer_id\nWHERE b.id = 123;`, read: 2, hits: 6, storage: '0',
      plan: [{ name: 'Nested Loop', rows: 1, t: 'muted', kids: [
        { name: 'Index Scan using orders_pkey on orders orders_1', rows: 1, t: 'ok', detail: ['Index Cond: (id = 123)'] },
        { name: 'Index Scan using orders_pkey on orders', rows: 1, t: 'ok', detail: ['Index Cond: (id = orders_1.customer_id)'] }] }] } },
  { title: 'Data-modifying CTE: one snapshot for all', body: 'A CTE may UPDATE. It runs **exactly once, to completion**, but every part of the statement uses the **same snapshot** (one frozen view of the data, taken when the statement starts), so the outer SELECT still reads the old amount. Only `RETURNING` carries the new value out.',
    state: { sql: `WITH t AS (\n  UPDATE orders SET amount = amount * 2\n  WHERE id = 1 RETURNING amount)\nSELECT (SELECT amount FROM orders WHERE id = 1) AS table_sees,\n       (SELECT amount FROM t) AS returning_sees;`, read: 1, hits: 0, storage: '0',
      snapshot: { table: '1.99', returning: '3.98' } } },
]

function rowsBar(n: number) { return Math.max(3, (Math.log10(n + 1) / Math.log10(TOTAL + 1)) * 100) }

function NodeBox({ n, depth, i }: { n: PNode; depth: number; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i + depth * 0.06 }} className="grid gap-1.5" style={{ marginLeft: depth ? 18 : 0 }}>
      {n.label && <p className="text-[11px] font-semibold text-muted">{n.label}</p>}
      <div className="relative rounded-md border px-2.5 py-1.5" style={{ borderColor: tone(n.t), background: toneBg(n.t, 10) }}>
        {depth > 0 && <span className="absolute top-1/2 -left-[13px] h-px w-3" style={{ background: 'var(--border)' }} />}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="font-mono text-[12px] font-semibold">{depth > 0 && <span className="text-muted">-&gt; </span>}{n.name}</span>
          <span className="font-mono text-[11px] text-muted">actual rows={n.rows.toLocaleString('en-US')}</span>
        </div>
        {n.detail?.map((d) => <p key={d} className="font-mono text-[11px] text-muted">{d}</p>)}
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded" style={{ background: 'var(--surface-2)' }}>
          <motion.div className="h-full rounded" initial={{ width: 0 }} animate={{ width: `${rowsBar(n.rows)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} style={{ background: tone(n.t) }} />
        </div>
      </div>
      {n.kids && <div className="grid gap-1.5 border-l border-line pl-0" style={{ marginLeft: 6 }}>{n.kids.map((k, j) => <NodeBox key={k.name + j} n={k} depth={depth + 1} i={i + j + 1} />)}</div>}
    </motion.div>
  )
}

function CteViz() {
  return (
    <Stepper steps={steps} interval={3600} render={(s, i) => (
      <div className="grid gap-3">
        <Legend items={[['ok', 'index access: reads only what it needs'], ['pointer', 'index scan'], ['dead', 'full scan into the CTE'], ['new', 'scan of the materialized copy']]} />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="rows read from orders" value={s.read.toLocaleString('en-US')} t={s.read > 100 ? 'dead' : 'ok'} />
          <Stat label="shared buffers touched" value={s.snapshot ? 'n/a' : s.hits} t={s.hits > 100 ? 'dead' : 'ok'} />
          <Stat label="CTE tuplestore" value={s.storage === '0' ? 'none' : s.storage} t={s.storage === '0' ? 'ok' : 'new'} />
        </div>
        <div className="grid gap-3 md:grid-cols-[0.85fr_1.15fr]">
          <Sql>{s.sql}</Sql>
          <Panel title={s.snapshot ? 'result' : 'EXPLAIN (ANALYZE, BUFFERS)'}>
            {s.plan && <div key={i} className="grid gap-2">{s.plan.map((n, k) => <NodeBox key={n.name + k} n={n} depth={0} i={k * 3} />)}</div>}
            {s.snapshot && (
              <div className="grid grid-cols-2 gap-2">
                {([['table_sees', s.snapshot.table, 'snapshot taken before the UPDATE', 'tuple'], ['returning_sees', s.snapshot.returning, 'rows the UPDATE produced', 'new']] as const).map(([k, v, note, t]) => (
                  <motion.div key={k} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border px-3 py-2" style={{ borderColor: tone(t), background: toneBg(t, 12) }}>
                    <p className="font-mono text-[11px] text-muted">{k}</p>
                    <p className="font-mono text-2xl font-bold">{v}</p>
                    <p className="text-xs text-muted">{note}</p>
                  </motion.div>
                ))}
                <p className="col-span-2 text-xs text-muted">Afterwards a new statement reads 3.98: the update did happen.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    )} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'ctes',
  module: 'm3',
  order: 4,
  title: 'CTEs: inlined vs MATERIALIZED',
  tldr: [
    'A **common table expression** (`WITH name AS (…)`) names a subquery for one statement, and since PostgreSQL 12 the planner **inlines** it when it is referenced once and has no side effects, otherwise it **materializes** it once.',
    'CTEs exist to make complex queries readable and to chain data-modifying steps in one statement, and the `MATERIALIZED` / `NOT MATERIALIZED` keywords let you decide when the planner may see through them.',
  ],
  visualizer: {
    title: 'One CTE, five plans',
    caption: 'Step through the same CTE planned five ways, then a data-modifying CTE. Watch rows read and shared buffers per plan: the same 20,000-row table, five very different amounts of work.',
    Component: CteViz,
  },
  playground: {
    setup: `
CREATE TABLE orders (
  id int PRIMARY KEY, customer_id int NOT NULL,
  amount numeric(10,2) NOT NULL, created_at date NOT NULL);
INSERT INTO orders
SELECT g, 1 + g % 500, (g % 97) + 0.99, DATE '2026-01-01' + (g % 300)
FROM generate_series(1, 20000) g;
CREATE INDEX ON orders (customer_id);
ANALYZE orders;
CREATE TABLE orders_archive (LIKE orders);
CREATE TABLE customers (customer_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL UNIQUE);
CREATE TABLE invoices (invoice_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers);
CREATE TABLE items (item_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id bigint NOT NULL REFERENCES invoices, name text NOT NULL);
INSERT INTO customers (name) VALUES ('Peter'), ('Paul'), ('Mary');`,
    presets: [
      { label: 'Inlined (default)', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
WITH c AS (SELECT * FROM orders)
SELECT * FROM c WHERE customer_id = 42;`,
        note: 'No CTE node at all: the plan is a Bitmap Index Scan, exactly as if you wrote `SELECT * FROM orders WHERE customer_id = 42`.' },
      { label: 'MATERIALIZED fence', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
WITH c AS MATERIALIZED (SELECT * FROM orders)
SELECT * FROM c WHERE customer_id = 42;`,
        note: 'A `CTE c` subplan scans all 20,000 rows into a tuplestore (`Storage: Memory`), then `CTE Scan` filters. Shared hits go from about 42 to 128.' },
      { label: 'Two references', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
WITH c AS (SELECT * FROM orders)
SELECT * FROM c a JOIN c b ON a.id = b.customer_id WHERE b.id = 123;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
WITH c AS NOT MATERIALIZED (SELECT * FROM orders)
SELECT * FROM c a JOIN c b ON a.id = b.customer_id WHERE b.id = 123;`,
        note: 'Default: CTE Scan twice over a materialized copy (128 buffers). NOT MATERIALIZED: a Nested Loop of two primary-key Index Scans (6 buffers).' },
      { label: 'When materializing wins', sql: `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
WITH totals AS MATERIALIZED (
  SELECT customer_id, sum(amount) AS total FROM orders GROUP BY customer_id)
SELECT a.customer_id, a.total
FROM totals a JOIN totals b ON b.total = a.total AND b.customer_id <> a.customer_id
ORDER BY 1 LIMIT 5;`,
        note: 'The expensive aggregate runs **once** (one HashAggregate over 20,000 rows) and both references read the 500-row result. Inlining would aggregate twice.' },
      { label: 'Same snapshot', sql: `SELECT amount FROM orders WHERE id = 1;

WITH t AS (UPDATE orders SET amount = amount * 2 WHERE id = 1 RETURNING amount)
SELECT (SELECT amount FROM orders WHERE id = 1) AS table_sees,
       (SELECT amount FROM t) AS returning_sees;

SELECT amount FROM orders WHERE id = 1;`,
        note: 'Inside the statement the table still shows 1.99, RETURNING shows 3.98, and the next statement sees 3.98. Sub-statements cannot see each other\'s writes.' },
      { label: 'Move rows atomically', sql: `WITH moved AS (
  DELETE FROM orders WHERE created_at < DATE '2026-01-08' RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;

SELECT (SELECT count(*) FROM orders) AS left_in_orders,
       (SELECT count(*) FROM orders_archive) AS archived;`,
        note: 'DELETE and INSERT commit together or not at all. Seven days of orders move: 468 rows, leaving 19,532.' },
      { label: 'Parent and children in one statement', sql: `-- an invoice for Mary plus two line items: no id round trip
WITH new_invoice AS (
  INSERT INTO invoices (customer_id)
  SELECT customer_id FROM customers WHERE name = 'Mary'
  RETURNING invoice_id
)
INSERT INTO items (invoice_id, name)
SELECT ni.invoice_id, v.name
FROM new_invoice ni
CROSS JOIN (VALUES ('Purple Automobile'), ('Yellow Automobile')) AS v(name)
RETURNING invoice_id, item_id, name;

-- three levels deep: a new customer, an invoice, an item
WITH c AS (INSERT INTO customers (name) VALUES ('Ann') RETURNING customer_id),
     inv AS (INSERT INTO invoices (customer_id) SELECT customer_id FROM c RETURNING invoice_id)
INSERT INTO items (invoice_id, name)
SELECT invoice_id, 'Red Train' FROM inv
RETURNING *;

SELECT c.name, count(DISTINCT i.invoice_id) AS invoices, count(it.item_id) AS items
FROM customers c
LEFT JOIN invoices i USING (customer_id)
LEFT JOIN items it USING (invoice_id)
GROUP BY c.name ORDER BY c.name;`,
        note: 'The generated `invoice_id` flows from one INSERT to the next through RETURNING, never back to the client. The foreign keys are checked at the end of the statement, so the child rows may reference a parent inserted in a sibling CTE. If any part fails, nothing is written.' },
    ],
  },
  production: {
    title: 'Removing CTE fences from a multi-tenant dashboard',
    context: 'A reporting service wrote every query as a chain of CTEs, then filtered the last one by tenant: `WITH base AS (SELECT … FROM events) … SELECT … FROM base WHERE tenant_id = $1`.',
    problem: 'On PostgreSQL 11 every CTE was an optimization fence. Each request scanned and materialized all tenants\' events, then threw away 99% of them. Someone had also added `MATERIALIZED` everywhere "for safety" while preparing the upgrade, which kept the old behaviour.',
    solution: 'Remove the blanket `MATERIALIZED`. Single-reference CTEs are then inlined, so the tenant filter is pushed into the scan and uses the `(tenant_id, created_at)` index. Keep `MATERIALIZED` only on the one CTE that is referenced several times and is expensive, and check each plan with EXPLAIN.',
    sql: `-- before: fence, full scan
WITH base AS MATERIALIZED (SELECT * FROM events)
SELECT count(*) FROM base WHERE tenant_id = 42;

-- after: inlined, index scan on (tenant_id, created_at)
WITH base AS (SELECT * FROM events)
SELECT count(*) FROM base WHERE tenant_id = 42;`,
    outcome: 'At 20,000 rows the gap is already 42 shared buffers inlined vs 128 materialized for one customer. The materialized cost grows with the whole table while the inlined cost grows only with one tenant\'s rows, so the saving grows with the number of tenants in the table.',
  },
  pitfalls: [
    { title: 'Using a CTE as a "temporary table" for speed',
      symptom: 'Moving a subquery into a CTE "so it is computed once" makes no difference, or makes it slower.',
      cause: 'A common claim is that a CTE is calculated once and reused. Since PostgreSQL 12 a single-reference CTE is simply inlined: it is not computed separately at all. Materializing only happens with 2+ references, side effects, recursion or `MATERIALIZED`.',
      fix: 'Decide with EXPLAIN. If you need computed-once semantics for an expensive or volatile expression, write `AS MATERIALIZED` explicitly.' },
    { title: 'A fence left behind by an old query',
      symptom: 'A query filters a CTE by a selective key but the plan shows `CTE Scan` with a huge `Rows Removed by Filter`.',
      cause: 'The CTE is referenced twice, is `MATERIALIZED`, or calls a volatile function, so the filter cannot be pushed down into it.',
      fix: 'Use `AS NOT MATERIALIZED` (if duplicated work is cheap), move the filter inside the CTE, or remove the volatile call.' },
    { title: 'Reading your own writes inside one statement',
      symptom: 'A query updates rows in one CTE and reads the table in another part of the statement, and sees the old values.',
      cause: 'All sub-statements run with **one snapshot**. Changes made by a data-modifying CTE are invisible to the rest of the statement, except through RETURNING.',
      fix: 'Pass data along with `RETURNING` and select from the CTE name, not from the table. Never modify the same row in two sub-statements: which change wins is unspecified.' },
    { title: 'ORDER BY inside the CTE',
      symptom: 'A report sorted inside `WITH ranked AS (… ORDER BY total DESC)` comes back unsorted after a harmless change, such as a join added to the outer query.',
      cause: 'Only the outermost ORDER BY defines the order of a result. An ORDER BY inside a CTE or subquery orders the rows that one step produces; a join, aggregate or parallel plan above it can reorder them.',
      fix: 'Sort in the outer query. Keep ORDER BY inside a CTE only where it feeds `LIMIT` or an order-sensitive step in that same CTE.' },
  ],
  pointers: [
    'Default: a side-effect-free, non-recursive CTE referenced **once** is **inlined**; referenced 2+ times it is **materialized** once.',
    '`AS MATERIALIZED` forces a fence; `AS NOT MATERIALIZED` forces inlining of every reference.',
    'Volatile functions, data-modifying statements and recursion always materialize.',
    'Data-modifying CTEs run once, to completion, on the **same snapshot**; use RETURNING to pass rows on.',
    'In [EXPLAIN](/m4/explain-analyze), a `CTE Scan` node means materialized; no CTE node means inlined.',
  ],
  sources: ['queries-with.html', 'sql-select.html', 'using-explain.html', 'dml-returning.html'],
}
