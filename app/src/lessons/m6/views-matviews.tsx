import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { TRY_SQL, Tile } from './_shared'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1: how the rewriter expands a view (query tree → _RETURN rule → subquery → pull-up → plan).
 * Visualizer 2: a materialized view through CREATE → stale → REFRESH → REFRESH CONCURRENTLY.
 * Costs, relfilenodes, xmins and row counts were captured from PostgreSQL 18.6 (PGlite) by running the
 * playground setup and presets in order, so the reader sees the same values there.
 * ---------------------------------------------------------------------------------------------- */

interface VState { phase: 0 | 1 | 2 | 3 | 4 | 5 }
const vSteps: Step<VState>[] = [
  { title: 'Parse: the view is just a name in the range table', body: 'The parser turns `SELECT name, total FROM order_lines WHERE id = 42` into a **query tree**. Range-table entry 1 is `order_lines`, a relation with `relkind = v` and **no storage** (`relfilenode = 0`).', state: { phase: 0 } },
  { title: 'Rewriter finds the _RETURN rule', body: 'The rewriter walks the range table and finds an `ON SELECT DO INSTEAD` rule named `_RETURN` in `pg_rewrite`. Its action is the view\'s SELECT, stored as a serialized query tree.', state: { phase: 1 } },
  { title: 'Substitute a subquery', body: 'Entry 1 becomes an **RTE_SUBQUERY** holding a copy of the rule\'s query tree, as if you had written `FROM (SELECT …) order_lines`. Your privilege check on the view is kept with the entry.', state: { phase: 2 } },
  { title: 'Recurse into the subquery', body: 'The rewriter checks the new range-table entries. `orders` and `products` are plain tables with no rules, so rewriting ends. Output: **one** query tree.', state: { phase: 3 } },
  { title: 'Planner pulls the subquery up', body: 'The planner flattens the simple subquery into the outer query. Now `id = 42` sits next to the join and can be **pushed down** to `orders` as an index condition.', state: { phase: 4 } },
  { title: 'Same plan as hand-written SQL', body: 'The view costs **8.32..12.86**, exactly the cost of the equivalent subquery. A view adds no runtime layer: it is text substitution done on trees.', state: { phase: 5 } },
]

const Box = ({ id, t = 'muted', children, className = '' }: { id?: string; t?: Tone; children: ReactNode; className?: string }) => (
  <motion.div layout layoutId={id} transition={{ type: 'spring', stiffness: 220, damping: 26 }}
    className={`rounded-md border px-2 py-1.5 font-mono text-[12px] ${className}`} style={{ borderColor: tone(t), background: toneBg(t, 12) }}>
    {children}
  </motion.div>
)
const Label = ({ children }: { children: ReactNode }) => <p className="mb-1 font-sans text-[10.5px] font-semibold tracking-wide text-muted uppercase">{children}</p>

function QueryTree({ phase }: { phase: VState['phase'] }) {
  const inner = (
    <Box id="subq" t="new" className="mt-1">
      <Label>RTE_SUBQUERY: Query (SELECT)</Label>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <Box id="in-rt" t={phase === 3 ? 'ok' : 'tuple'}>
          <Label>rtable</Label>
          <div>[1] orders o {phase === 3 && <Tag t="ok">no rules</Tag>}</div>
          <div>[2] products p {phase === 3 && <Tag t="ok">no rules</Tag>}</div>
        </Box>
        <Box id="in-jt" t="pointer"><Label>jointree</Label>o JOIN p ON p.id = o.product_id</Box>
      </div>
      <Box id="in-tl" t="muted" className="mt-1.5"><Label>targetList</Label>o.id, o.ordered_at, p.name, p.category, o.qty * p.price AS total</Box>
    </Box>
  )
  if (phase >= 4) {
    return (
      <Box id="q" t="header">
        <Label>Query (SELECT) after pull-up</Label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          <Box id="in-rt" t="tuple"><Label>rtable</Label><div>[2] orders o</div><div>[3] products p</div></Box>
          <Box id="in-jt" t="pointer"><Label>jointree</Label>o JOIN p ON p.id = o.product_id<br /><span style={{ color: tone.text('new') }}>WHERE o.id = 42</span></Box>
        </div>
        <Box id="tl" t="muted" className="mt-1.5"><Label>targetList</Label>p.name, o.qty * p.price</Box>
      </Box>
    )
  }
  return (
    <Box id="q" t="header">
      <Label>Query (SELECT)</Label>
      <Box id="tl" t="muted"><Label>targetList</Label>name, total</Box>
      <Box id="rt" t={phase === 1 ? 'new' : 'tuple'} className="mt-1.5">
        <Label>rtable</Label>
        {phase < 2
          ? <div>[1] order_lines <Tag t="header">RTE_RELATION</Tag> <Tag t="muted">relkind v</Tag></div>
          : <div>[1] order_lines <Tag t="new">RTE_SUBQUERY</Tag>{inner}</div>}
      </Box>
      <Box id="jt" t="pointer" className="mt-1.5"><Label>jointree</Label>FROM [1] WHERE id = 42</Box>
    </Box>
  )
}

const PLAN: [number, string, string][] = [
  [0, 'Hash Join', 'cost=8.32..12.86 rows=1'],
  [1, 'Hash Cond: (p.id = o.product_id)', ''],
  [1, 'Seq Scan on products p', 'cost=0.00..4.00 rows=200'],
  [1, 'Hash', 'cost=8.30..8.30 rows=1'],
  [2, 'Index Scan using orders_pkey on orders o', 'cost=0.29..8.30 rows=1'],
  [3, 'Index Cond: (id = 42)', ''],
]

function ViewExpansion() {
  return (
    <Stepper steps={vSteps} interval={3000} render={(s) => (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <Legend items={[['header', 'query tree'], ['tuple', 'range table'], ['pointer', 'join tree + quals'], ['new', 'changed by this step'], ['ok', 'checked, nothing to expand']]} />
        <div className="grid gap-3 md:grid-cols-[1.35fr_1fr]">
          <Panel title={s.phase >= 4 ? 'Planner input (flattened)' : 'Rewriter: query tree'}><QueryTree phase={s.phase} /></Panel>
          <div className="grid content-start gap-3">
            <Panel title="pg_rewrite row for order_lines">
              <motion.div animate={{ opacity: s.phase >= 1 ? 1 : 0.35 }}>
                <FieldTable highlight={s.phase === 1 ? 'rulename' : undefined} rows={[
                  ['rulename', '_RETURN'], ['ev_type', "'1'", 'SELECT'], ['is_instead', 't'],
                  ['ev_action', <span key="a" className="break-all text-[11px]">{'({QUERY :commandType 1 … :rtable ({RANGETBLENTRY :alias {ALIAS :aliasname o …'}</span>],
                ]} />
              </motion.div>
            </Panel>
            <Panel title="EXPLAIN SELECT name, total FROM order_lines WHERE id = 42">
              <AnimatePresence mode="wait">
                {s.phase === 5 ? (
                  <motion.div key="plan" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-mono text-[11.5px] leading-5">
                    {PLAN.map(([d, n, c], i) => (
                      <div key={i} style={{ paddingLeft: d * 14 }}>
                        <span style={{ color: n.includes('Cond') ? 'var(--muted)' : 'var(--text)', fontWeight: n.includes('Cond') ? 400 : 600 }}>{d > 0 && !n.includes('Cond') ? '-> ' : ''}{n}</span>{' '}
                        <span className="text-muted">{c}</span>
                      </div>
                    ))}
                    <p className="mt-2 font-sans text-xs text-muted">Hand-written subquery: identical plan, identical cost.</p>
                  </motion.div>
                ) : (
                  <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-muted">No plan yet. Planning starts after rewriting finishes.</motion.p>
                )}
              </AnimatePresence>
            </Panel>
          </div>
        </div>
      </div>
    )} />
  )
}

/* ---------------------------------------------- matview ---------------------------------------------- */

interface MState {
  orders: number; relfilenode: number; mvRows: number; books: { rev: string; n: number; xmin: number; ctid: string }; truth: { rev: string; n: number }
  lock: string; readers: 'ok' | 'blocked' | 'none'; op?: string; rewritten?: string
}
const mSteps: Step<MState>[] = [
  { title: 'CREATE MATERIALIZED VIEW daily_revenue', body: 'The defining query runs **once**. Its 360 result rows are written into a real heap (`relkind = m`, 4 pages = 32 KB) with its own **relfilenode**.',
    state: { orders: 20000, relfilenode: 16420, mvRows: 360, books: { rev: '2919.00', n: 56, xmin: 758, ctid: '(0,27)' }, truth: { rev: '2919.00', n: 56 }, lock: '—', readers: 'none', op: 'populate' } },
  { title: 'SELECT reads stored rows', body: 'A query on the matview is a plain **Seq Scan on daily_revenue**. No join, no aggregate: the rule is used only to populate it.',
    state: { orders: 20000, relfilenode: 16420, mvRows: 360, books: { rev: '2919.00', n: 56, xmin: 758, ctid: '(0,27)' }, truth: { rev: '2919.00', n: 56 }, lock: 'ACCESS SHARE', readers: 'ok', op: 'read' } },
  { title: 'A new order arrives: the matview is stale', body: 'Base tables changed; the matview did not. Books on 2026-01-01 still shows **2919.00 / 56**, while the truth is **3084.00 / 57**. Nothing tracks staleness for you.',
    state: { orders: 20001, relfilenode: 16420, mvRows: 360, books: { rev: '2919.00', n: 56, xmin: 758, ctid: '(0,27)' }, truth: { rev: '3084.00', n: 57 }, lock: '—', readers: 'ok', op: 'stale' } },
  { title: 'REFRESH MATERIALIZED VIEW', body: 'The query reruns into a **new heap file** and swaps it in: relfilenode 16420 → **16434**. It holds **ACCESS EXCLUSIVE**, so readers wait until it finishes.',
    state: { orders: 20001, relfilenode: 16434, mvRows: 360, books: { rev: '3084.00', n: 57, xmin: 803, ctid: '(1,78)' }, truth: { rev: '3084.00', n: 57 }, lock: 'ACCESS EXCLUSIVE', readers: 'blocked', op: 'swap' } },
  { title: 'REFRESH … CONCURRENTLY (with a unique index)', body: 'One more order. CONCURRENTLY builds the new result in a temp table, **diffs** it against the old rows by the unique key, and applies only the changes. Relfilenode stays **16434**; only **1 of 360** rows got a new version.',
    state: { orders: 20002, relfilenode: 16434, mvRows: 360, books: { rev: '3117.00', n: 58, xmin: 807, ctid: '(3,1)' }, truth: { rev: '3117.00', n: 58 }, lock: 'EXCLUSIVE', readers: 'ok', op: 'diff', rewritten: '1 / 360' } },
]

function MatviewViz() {
  return (
    <Stepper steps={mSteps} interval={3200} render={(s) => {
      const stale = s.books.rev !== s.truth.rev
      return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <Legend items={[['tuple', 'stored heap'], ['new', 'rewritten row'], ['dead', 'stale or blocked'], ['ok', 'readers proceed']]} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="orders rows" value={s.orders.toLocaleString()} />
            <Tile label="relfilenode" value={s.relfilenode} t={s.op === 'swap' ? 'new' : undefined} />
            <Tile label="lock held" value={s.lock} t={s.lock === 'ACCESS EXCLUSIVE' ? 'dead' : s.lock === 'EXCLUSIVE' ? 'new' : undefined} />
            <Tile label="rows rewritten" value={s.rewritten ?? (s.op === 'swap' ? 'all 360' : s.op === 'populate' ? '360' : '0')} />
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <Panel title="base tables (truth)">
              <p className="font-mono text-[12px]">orders ⋈ products, GROUP BY day, category</p>
              <p className="mt-1 font-mono text-[12px]">books · 2026-01-01 = <b>{s.truth.rev}</b> / {s.truth.n} orders</p>
            </Panel>
            <motion.div animate={{ opacity: s.op === 'populate' || s.op === 'swap' || s.op === 'diff' ? 1 : 0.25 }} className="text-center font-mono text-xs text-muted">
              {s.op === 'diff' ? 'diff by (day, category) →' : 'rerun query →'}
            </motion.div>
            <motion.div layout className="rounded-lg border p-3" style={{ borderColor: tone(stale ? 'dead' : 'tuple'), background: toneBg(stale ? 'dead' : 'tuple', 10) }}>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">daily_revenue heap · file {s.relfilenode}</p>
              <div className="grid grid-cols-12 gap-0.5" aria-label="360 stored rows">
                {Array.from({ length: 36 }, (_, i) => (
                  <motion.div key={`${s.relfilenode}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: s.op === 'swap' ? i * 0.012 : 0 }}
                    className="h-2.5 rounded-[2px]" style={{ background: i === 13 && (s.op === 'diff' || s.op === 'swap') ? tone('new') : i === 13 && stale ? tone('dead') : toneBg('tuple', 45) }} />
                ))}
              </div>
              <p className="mt-2 font-mono text-[12px]">books · 2026-01-01 = <b style={{ color: stale ? tone('dead') : undefined }}>{s.books.rev}</b> / {s.books.n}</p>
              <p className="font-mono text-[11px] text-muted">xmin {s.books.xmin} · ctid {s.books.ctid}</p>
            </motion.div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted">Concurrent <code className="inline-code">SELECT * FROM daily_revenue</code>:</span>
            {s.readers === 'blocked' && <Tag t="dead">waits for the refresh</Tag>}
            {s.readers === 'ok' && <Tag t="ok">runs</Tag>}
            {s.readers === 'none' && <Tag t="muted">none yet</Tag>}
          </div>
        </div>
      )
    }} />
  )
}

function ViewsViz() {
  const [mode, setMode] = useState<'view' | 'mat'>('view')
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <Segmented label="View kind" value={mode} onChange={setMode} options={[['view', 'View: rewrite'], ['mat', 'Materialized view: refresh']]} />
      {mode === 'view' ? <ViewExpansion key="v" /> : <MatviewViz key="m" />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'views-matviews',
  module: 'm6',
  order: 1,
  title: 'Views and materialized views',
  tldr: [
    'A **view** is a stored query that the rewriter splices into your query tree through an `ON SELECT DO INSTEAD` rule named `_RETURN`, while a **materialized view** runs that query once and keeps the result in a real heap.',
    'Views give you reusable, permission-controlled abstractions at zero runtime cost, and materialized views trade freshness for speed when the query is too expensive to run on every read.',
  ],
  visualizer: {
    title: 'From view name to plan, and from matview to refresh',
    caption: 'Step through the rewriter expanding a view, then switch to **Materialized view** and watch REFRESH swap files while CONCURRENTLY patches one row. The numbers match what the playground presets print.',
    Component: ViewsViz,
  },
  playground: {
    setup: `
CREATE TABLE products (id int PRIMARY KEY, name text NOT NULL, category text NOT NULL, price numeric(8,2) NOT NULL);
CREATE TABLE orders (id int PRIMARY KEY, product_id int NOT NULL REFERENCES products, qty int NOT NULL, ordered_at date NOT NULL);
INSERT INTO products SELECT g, 'product ' || g, (ARRAY['books','games','tools','toys'])[1 + g % 4], (5 + (g * 7) % 95)::numeric(8,2)
FROM generate_series(1, 200) g;
INSERT INTO orders SELECT g, 1 + (g * 13 + g / 90) % 200, 1 + g % 5, date '2026-01-01' + (g % 90)
FROM generate_series(1, 20000) g;
CREATE INDEX ON orders (product_id);
CREATE VIEW order_lines AS
  SELECT o.id, o.ordered_at, p.name, p.category, o.qty * p.price AS total
  FROM orders o JOIN products p ON p.id = o.product_id;
CREATE MATERIALIZED VIEW daily_revenue AS
  SELECT ordered_at AS day, category, sum(total) AS revenue, count(*) AS orders
  FROM order_lines GROUP BY 1, 2;
ANALYZE;
${TRY_SQL}`,
    presets: [
      { label: 'The _RETURN rule', sql: `SELECT c.relname, c.relkind, c.relfilenode, r.rulename, r.ev_type, r.is_instead
FROM pg_rewrite r JOIN pg_class c ON c.oid = r.ev_class
WHERE c.relname = 'order_lines';

SELECT pg_get_viewdef('order_lines', true);`,
        note: 'The view is a relation with `relkind = v` and `relfilenode = 0` (no file). Its query lives in `pg_rewrite` as the `_RETURN` rule, `ev_type = 1` (SELECT), `is_instead = t`.' },
      { label: 'View vs subquery plan', sql: `EXPLAIN SELECT name, total FROM order_lines WHERE id = 42;

EXPLAIN SELECT name, total
FROM (SELECT o.id, p.name, o.qty * p.price AS total
      FROM orders o JOIN products p ON p.id = o.product_id) v
WHERE id = 42;`,
        note: 'Both plans are identical (`Hash Join cost=8.32..12.86`). The `id = 42` filter was pushed through the view down to `Index Scan using orders_pkey`.' },
      { label: 'Matview goes stale', sql: `SELECT xmin, ctid, * FROM daily_revenue WHERE day = '2026-01-01' ORDER BY category;

INSERT INTO orders VALUES (20001, 4, 5, date '2026-01-01');

SELECT 'matview' AS source, revenue, orders FROM daily_revenue WHERE day = '2026-01-01' AND category = 'books'
UNION ALL
SELECT 'live', sum(total), count(*) FROM order_lines WHERE ordered_at = '2026-01-01' AND category = 'books';`,
        note: 'The matview still reports 2919.00 from 56 orders. The live view already sees 3084.00 from 57.' },
      { label: 'REFRESH swaps the file', sql: `SELECT relfilenode AS before FROM pg_class WHERE relname = 'daily_revenue';
REFRESH MATERIALIZED VIEW daily_revenue;
SELECT relfilenode AS after FROM pg_class WHERE relname = 'daily_revenue';
SELECT xmin, ctid, revenue, orders FROM daily_revenue WHERE day = '2026-01-01' AND category = 'books';

SELECT try_sql('REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue') AS concurrently_without_index;

CREATE MATERIALIZED VIEW revenue_shell AS SELECT category, sum(price) AS list_value FROM products GROUP BY 1 WITH NO DATA;
SELECT try_sql('SELECT * FROM revenue_shell') AS read_unpopulated;
SELECT matviewname, ispopulated FROM pg_matviews ORDER BY 1;`,
        note: 'A plain REFRESH writes a brand new heap, so `relfilenode` changes. CONCURRENTLY is refused until the matview has a unique index. A matview created `WITH NO DATA` exists (`ispopulated = f`) but cannot be read at all until its first plain REFRESH.' },
      { label: 'CONCURRENTLY patches rows', sql: `CREATE UNIQUE INDEX daily_revenue_key ON daily_revenue (day, category);
INSERT INTO orders VALUES (20002, 4, 1, date '2026-01-01');

SELECT relfilenode FROM pg_class WHERE relname = 'daily_revenue';
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;
SELECT relfilenode FROM pg_class WHERE relname = 'daily_revenue';

SELECT xmin, ctid, * FROM daily_revenue WHERE day = '2026-01-01' AND category = 'books';
SELECT count(*) FILTER (WHERE xmin = (SELECT xmin FROM daily_revenue WHERE day = '2026-01-01' AND category = 'books')) AS rows_rewritten,
       count(*) AS total_rows
FROM daily_revenue;`,
        note: 'Run after the previous preset. The relfilenode does not change, and only **1 of 360** rows has the new xmin: the diff touched just the changed group.' },
      { label: 'Updatable view + CHECK OPTION', sql: `CREATE VIEW cheap_products AS
  SELECT id, name, category, price FROM products WHERE price < 20
  WITH CHECK OPTION;

SELECT table_name, is_updatable, is_insertable_into
FROM information_schema.views WHERE table_schema = 'public' ORDER BY 1;

SELECT try_sql($$INSERT INTO cheap_products VALUES (500, 'cheap', 'toys', 9)$$) AS fits,
       try_sql($$INSERT INTO cheap_products VALUES (501, 'pricey', 'toys', 50)$$) AS outside_view;`,
        note: '`cheap_products` reads one table with a plain WHERE, so it is **automatically updatable**; `order_lines` (a join) is not. The second insert fails `WITH CHECK OPTION` because the row would be invisible through the view.' },
      { label: 'Stacked views: LOCAL vs CASCADED', sql: `CREATE TABLE employees (id serial PRIMARY KEY, first_name text NOT NULL, last_name text NOT NULL,
  department_id int, employee_type text CHECK (employee_type IN ('FTE', 'Contractor')));
INSERT INTO employees (first_name, last_name, department_id, employee_type) VALUES
  ('John','Doe',1,'FTE'), ('Jane','Smith',2,'FTE'), ('Bob','Johnson',1,'Contractor'), ('Alice','Williams',3,'FTE'),
  ('Charlie','Brown',2,'Contractor'), ('Eva','Jones',1,'FTE'), ('Frank','Miller',3,'FTE'), ('Grace','Davis',2,'Contractor');
CREATE VIEW fte AS SELECT id, first_name, last_name, department_id, employee_type FROM employees WHERE employee_type = 'FTE';
CREATE VIEW fte_1 AS SELECT * FROM fte WHERE department_id = 1 WITH LOCAL CHECK OPTION;

-- 1. No check option on fte: a contractor goes in and vanishes from the view.
SELECT try_sql($$INSERT INTO fte (first_name, last_name, department_id, employee_type) VALUES ('John','Snow',1,'Contractor')$$) AS via_fte;
-- 2. LOCAL checks only fte_1's own WHERE (department_id = 1).
SELECT try_sql($$INSERT INTO fte_1 (first_name, last_name, department_id, employee_type) VALUES ('Mia','Jackson',1,'Contractor')$$) AS local_contractor,
       try_sql($$INSERT INTO fte_1 (first_name, last_name, department_id, employee_type) VALUES ('Sam','Lee',2,'FTE')$$) AS local_dept_2;
-- 3. CASCADED also checks every view underneath.
ALTER VIEW fte_1 SET (check_option = cascaded);
SELECT try_sql($$INSERT INTO fte_1 (first_name, last_name, department_id, employee_type) VALUES ('Peter','Taylor',1,'Contractor')$$) AS cascaded_contractor;

-- 4. UPDATE and DELETE through a view only reach rows the view shows.
DELETE FROM fte WHERE id = 3;
SELECT id, first_name, employee_type FROM employees WHERE id = 3 OR employee_type = 'Contractor' ORDER BY id;
SELECT table_name, check_option FROM information_schema.views WHERE table_name LIKE 'fte%' ORDER BY 1;`,
        note: 'Without a check option, John Snow is inserted through `fte` and becomes invisible in it. **LOCAL** on `fte_1` rejects department 2 but lets contractor Mia in, because `fte`\'s own filter is not checked. **CASCADED** (the default for a bare `WITH CHECK OPTION`) checks `fte` too: `new row violates check option for view "fte"`. `DELETE … WHERE id = 3` removes nothing: Bob is a contractor, so he is not a row of `fte`.' },
      { label: 'Recursive view: org chart', sql: `CREATE TABLE org (employee_id int PRIMARY KEY, full_name text NOT NULL, manager_id int REFERENCES org);
INSERT INTO org VALUES
  (1,'Michael North',NULL), (2,'Megan Berry',1), (3,'Sarah Berry',1), (4,'Zoe Black',1), (5,'Tim James',1),
  (6,'Bella Tucker',2), (7,'Ryan Metcalfe',2), (8,'Max Mills',2), (9,'Benjamin Glover',2),
  (10,'Carolyn Henderson',3), (11,'Nicola Kelly',3), (12,'Alexandra Climo',3), (13,'Dominic King',3),
  (14,'Leonard Gray',4), (15,'Eric Rampling',4), (16,'Piers Paige',7), (17,'Ryan Henderson',7),
  (18,'Frank Tucker',8), (19,'Nathan Ferguson',8), (20,'Kevin Rampling',8);

CREATE RECURSIVE VIEW reporting_line (employee_id, depth, chain) AS
  SELECT employee_id, 0, full_name FROM org WHERE manager_id IS NULL
  UNION ALL
  SELECT o.employee_id, r.depth + 1, r.chain || ' > ' || o.full_name
  FROM org o JOIN reporting_line r ON o.manager_id = r.employee_id;

SELECT chain FROM reporting_line WHERE employee_id IN (10, 17) ORDER BY employee_id;
SELECT depth, count(*) AS people FROM reporting_line GROUP BY depth ORDER BY depth;
EXPLAIN (COSTS OFF) SELECT * FROM reporting_line WHERE employee_id = 10;`,
        note: '`CREATE RECURSIVE VIEW` is shorthand for a view over `WITH RECURSIVE`; the column list is mandatory. Each pass joins the previous level: 1, 4, 10, then 5 people, then an empty working table ends it. The plan shows `Recursive Union` under a `CTE Scan` with `Filter: (employee_id = 10)` on top: the filter is applied **after** the whole tree is built, not pushed into the recursion.' },
    ],
  },
  production: {
    title: 'A revenue dashboard that stopped melting the primary',
    context: 'An e-commerce analytics page showed revenue per day and category. Its query joined `orders` (tens of millions of rows) to `products` and grouped by day, and ran on every page load.',
    problem: 'Each load scanned and aggregated the whole orders table. With dozens of viewers refreshing, the database spent most of its CPU on identical aggregates, and order inserts slowed down.',
    solution: 'Move the aggregate into a **materialized view** keyed by `(day, category)`. Add the **unique index** that `REFRESH … CONCURRENTLY` requires, and refresh every five minutes from a scheduler. Readers keep reading during each refresh, and each refresh rewrites only the groups that changed.',
    sql: `CREATE MATERIALIZED VIEW daily_revenue AS
  SELECT ordered_at AS day, category, sum(total) AS revenue, count(*) AS orders
  FROM order_lines GROUP BY 1, 2;
CREATE UNIQUE INDEX daily_revenue_key ON daily_revenue (day, category);
-- every 5 minutes (cron, pg_cron or the app scheduler):
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;`,
    outcome: 'Dashboard reads became an index lookup on a table of a few thousand rows instead of a full aggregate. The trade-off is explicit: numbers can be up to five minutes old, and the page shows when the last refresh ran. In the playground, a concurrent refresh after one new order rewrote 1 of 360 rows.',
  },
  pitfalls: [
    { title: 'CONCURRENTLY without a usable unique index',
      symptom: '`ERROR: cannot refresh materialized view "public.daily_revenue" concurrently`, or the refresh job falls back to a plain REFRESH that blocks every reader.',
      cause: 'CONCURRENTLY diffs old and new contents by a key. It needs at least one **UNIQUE** index on plain columns, with no WHERE clause and no expressions, and the matview must already be populated.',
      fix: 'Create a unique index on the natural grouping key. Populate once with a plain REFRESH if the matview was created `WITH NO DATA`.',
      sql: `CREATE UNIQUE INDEX ON daily_revenue (day, category);` },
    { title: '`SELECT *` in a view freezes the column list',
      symptom: 'A column added to the base table never shows up through the view, and nobody notices for months.',
      cause: 'The `*` is expanded when the view is created. The stored query tree points at the columns that existed then, by number, not by name. So renaming a base column is followed silently (the view keeps its old output name: `pg_get_viewdef` now shows `new_name AS old_name`), and dropping one the view uses fails with `cannot drop column … because other objects depend on it`.',
      fix: 'List columns explicitly. After altering the base table, run `CREATE OR REPLACE VIEW` with the new column added **at the end** (replacing may add columns but not reorder, rename or drop them: `cannot drop columns from view`). To remove a column, drop and recreate the view, or `DROP … CASCADE` knowing which dependants go with it.' },
    { title: 'A view that hides rows leaks them anyway',
      symptom: 'Users with access only to `public_phones` (a view filtering out private rows) can still learn private values.',
      cause: 'The planner may run a **cheap user function** in the outer WHERE before the view\'s own filter. A function that raises a NOTICE with its arguments sees every row. Views hide columns reliably, but not rows.',
      fix: 'Declare the view `WITH (security_barrier)` so its quals run first, or use row-level security. Only **LEAKPROOF** functions may then be pushed below the barrier.',
      sql: `CREATE VIEW public_phones WITH (security_barrier) AS
  SELECT person, phone FROM phone_data WHERE NOT private;` },
    { title: 'Base-table privileges checked as the view owner',
      symptom: 'A role with no rights on `orders` can read it through a view, or row-level security policies on the base table seem to be ignored.',
      cause: 'By default, relations inside a view are accessed with the **view owner\'s** privileges and policies. If the owner is the table owner, RLS does not apply to them.',
      fix: 'Set `security_invoker = true` on views that should run with the caller\'s rights and policies.',
      sql: `ALTER VIEW order_lines SET (security_invoker = true);` },
    { title: 'Blaming REFRESH for blocked order writes',
      symptom: 'Refreshes are moved to 3 a.m. "because REFRESH locks the orders table", yet the dashboard still hangs for the length of every daytime refresh.',
      cause: 'A common claim is that REFRESH locks the underlying tables. It does not: the base tables get only **ACCESS SHARE**, the lock any SELECT takes, so writes to them continue. The lock that hurts is on the **matview**: a plain REFRESH holds **ACCESS EXCLUSIVE** on it, so every reader of the dashboard waits. CONCURRENTLY holds **EXCLUSIVE** instead, which blocks only other refreshes and writes to the matview, and its diff applies inserts, updates **and** deletes.',
      fix: 'Use `REFRESH … CONCURRENTLY` with a unique index for matviews that are read during the day. Check the locks yourself inside a transaction.',
      sql: `BEGIN;
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;
SELECT relation::regclass, mode FROM pg_locks
WHERE relation IN ('orders'::regclass, 'daily_revenue'::regclass);
COMMIT;` },
    { title: 'Relying on the ORDER BY inside a matview',
      symptom: 'A "top 10 products" widget runs `SELECT * FROM top_products LIMIT 10` and starts showing the wrong products after a few refreshes.',
      cause: 'The ORDER BY in the defining query only orders the rows as they are first written. A matview is a heap: CONCURRENTLY applies its diff as row changes, so new versions land wherever there is free space, and a plain SELECT returns rows in physical order.',
      fix: 'Put the ORDER BY in the query that reads the matview, and index the sort column if the list is long.',
      sql: `SELECT * FROM daily_revenue ORDER BY revenue DESC LIMIT 10;` },
  ],
  pointers: [
    'A view is `relkind = v` plus a `_RETURN` rule in `pg_rewrite`. The rewriter substitutes it as a subquery before planning, and the planner usually flattens it away. See [The rule system](/m6/rule-system).',
    'Auto-updatable views: **one FROM item**, no aggregates, DISTINCT, GROUP BY, LIMIT or set operations. Add `WITH CHECK OPTION` (CASCADED by default; LOCAL checks only the top view) so writes stay visible through the view.',
    'A **materialized view** is a real heap filled by its query. It is stale until you REFRESH it.',
    '**REFRESH** rewrites the whole file under ACCESS EXCLUSIVE. **REFRESH CONCURRENTLY** needs a unique index, diffs rows, and lets readers continue.',
    'Use `security_barrier` for row-filtering views and `security_invoker` when the caller\'s privileges and policies must apply.',
  ],
  sources: ['rules-views.html', 'rules-materializedviews.html', 'rules-privileges.html', 'sql-createview.html', 'sql-creatematerializedview.html', 'sql-refreshmaterializedview.html'],
}
