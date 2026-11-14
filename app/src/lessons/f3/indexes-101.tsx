import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, tone, toneBg } from '../../viz/kit'
import { Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a 100,000-row `customers` table is 935 pages of 8 KB. Each square below is one page.
 * Every plan, cost, row count and page count in the steps comes from EXPLAIN (ANALYZE, BUFFERS) on
 * the same table the playground builds. Page numbers for the lit squares are the real ones the
 * matching rows live on (from their ctid).
 * ---------------------------------------------------------------------------------------------- */

const PAGES = 935, COLS = 55, CELL = 10, GAP = 1
// pages holding the 56 customers who signed up on 2021-01-01
const DAY = [3, 20, 37, 53, 70, 87, 104, 121, 137, 154, 171, 188, 205, 222, 238, 255, 272, 289, 306, 323, 339, 356, 373, 390, 407, 423, 440, 457, 474, 491, 508, 524, 541, 558, 575, 592, 609, 625, 642, 659, 676, 693, 709, 726, 743, 760, 777, 794, 810, 827, 844, 861, 878, 894, 911, 928]
// the 247 pages holding the 20,440 customers who signed up in 2021: runs of 4 or 5 pages
const YEAR_RUNS: [number, number][] = [[3, 6], [20, 23], [37, 40], [53, 57], [70, 74], [87, 90], [104, 107], [121, 124], [137, 141], [154, 158], [171, 175], [188, 191], [205, 208], [222, 225], [238, 242], [255, 259], [272, 275], [289, 292], [306, 309], [323, 326], [339, 343], [356, 360], [373, 376], [390, 393], [407, 410], [423, 427], [440, 444], [457, 461], [474, 477], [491, 494], [508, 511], [524, 528], [541, 545], [558, 561], [575, 578], [592, 595], [609, 612], [625, 629], [642, 646], [659, 662], [676, 679], [693, 696], [709, 713], [726, 730], [743, 746], [760, 763], [777, 780], [794, 797], [810, 814], [827, 831], [844, 847], [861, 864], [878, 881], [894, 898], [911, 915], [928, 932]]
const YEAR = YEAR_RUNS.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))

type Tree = 'none' | 'built' | 'point' | 'day' | 'year'
interface S {
  sql: string
  plan: string
  cost: string
  rows: string
  removed: string
  pages: string
  lit: number[] | 'all' | 'none'
  sweep?: boolean
  tree: Tree
  multi?: 'both' | 'city'
  write?: boolean
}

const steps: Step<S>[] = [
  { title: 'A table is a stack of pages', body: '`customers` holds **100,000 rows**. PostgreSQL stores them in **935 pages** of 8 KB, about 107 rows per page. Each square is one page. There is no index on `email` yet.',
    state: { sql: 'SELECT count(*) FROM customers;', plan: '—', cost: '—', rows: '100,000', removed: '—', pages: '935', lit: 'none', tree: 'none' } },
  { title: 'No index: read the whole book', body: 'To find one email, PostgreSQL must open **every page** and test every row. This is a **Seq Scan** (sequential scan). It returns 1 row and throws away **99,999**.',
    state: { sql: "SELECT * FROM customers WHERE email = 'user4242@example.com';", plan: 'Seq Scan', cost: '2185.00', rows: '1', removed: '99,999', pages: '935', lit: 'all', sweep: true, tree: 'none' } },
  { title: 'CREATE INDEX: build the book\'s index', body: 'An **index** is a separate, sorted structure: each entry is an email plus the page and slot of its row. This one is a **B-tree** of **3 levels** and 499 pages. While it builds, reads continue but writes wait.',
    state: { sql: 'CREATE INDEX customers_email_idx ON customers (email);', plan: '—', cost: '—', rows: '—', removed: '—', pages: '499 index pages', lit: 'none', tree: 'built' } },
  { title: 'Same query, now an Index Scan', body: 'PostgreSQL walks the tree **root → internal → leaf**, finds the entry, and jumps straight to **page 39**, slot 68. Four pages read instead of 935. The estimated cost drops from 2185 to **8.44**.',
    state: { sql: "SELECT * FROM customers WHERE email = 'user4242@example.com';", plan: 'Index Scan', cost: '8.44', rows: '1', removed: '0', pages: '4 (3 index + 1 table)', lit: [39], tree: 'point' } },
  { title: 'A range: everyone from one day', body: 'With an index on `signup_date`, one day matches **56 rows** on **56 different pages**. A **Bitmap Heap Scan** first collects every matching page from the index, then visits each page once, in page order.',
    state: { sql: "SELECT * FROM customers WHERE signup_date = '2021-01-01';", plan: 'Bitmap Heap Scan', cost: '≈ 182', rows: '56', removed: '0', pages: '58 (2 index + 56 table)', lit: DAY, tree: 'day' } },
  { title: 'A wider range: a whole year', body: '**20,440 rows** match, spread over **247 pages**. The index still wins: about a quarter of the table is read, in page order.',
    state: { sql: "SELECT * FROM customers WHERE signup_date BETWEEN '2021-01-01' AND '2021-12-31';", plan: 'Bitmap Heap Scan', cost: '≈ 1531', rows: '20,440', removed: '0', pages: '266 (19 index + 247 table)', lit: YEAR, tree: 'year' } },
  { title: 'Most of the table: the index is skipped', body: '**79,505 rows** (80%) match. Using the index would touch 869 pages for an estimated cost of about **2839**. Reading all 935 pages straight through costs **2185**, so the planner picks the **Seq Scan**. An index helps only when a query wants a *small part* of the table.',
    state: { sql: "SELECT * FROM customers WHERE signup_date >= '2021-01-01';", plan: 'Seq Scan', cost: '2185.00', rows: '79,505', removed: '20,495', pages: '935', lit: 'all', sweep: true, tree: 'none' } },
  { title: 'A function hides the column', body: 'The index stores `email`, not `lower(email)`, so it cannot answer this query. PostgreSQL falls back to a Seq Scan and computes `lower()` 100,000 times. The fix is an **expression index** on `lower(email)`.',
    state: { sql: "SELECT * FROM customers WHERE lower(email) = 'user4242@example.com';", plan: 'Seq Scan', cost: '2435.00', rows: '1', removed: '99,999', pages: '935', lit: 'all', sweep: true, tree: 'none' } },
  { title: 'Two columns: order matters', body: 'An index on `(country, city)` is sorted like a phone book: by country first, then city. **country + city** is one short stretch of entries. With **city alone**, PostgreSQL cannot know which countries hold that city, so it has to look inside every country\'s stretch, and the index is much less useful.',
    state: { sql: 'CREATE INDEX ON customers (country, city);', plan: 'Bitmap Heap Scan', cost: '≈ 112', rows: '250', removed: '0', pages: '252 (2 index + 250 table)', lit: 'none', tree: 'none', multi: 'both' } },
  { title: 'Every index costs writes', body: 'Each INSERT, and each UPDATE that changes an indexed column, must also update **every index**. Loading the same 100,000 rows took about **3×** as long with four extra indexes, and the indexes grew to 1.5× the size of the table.',
    state: { sql: 'INSERT INTO … SELECT … FROM generate_series(1, 100000);', plan: '—', cost: '—', rows: '100,000 inserted', removed: '—', pages: '—', lit: 'none', tree: 'none', write: true } },
]

/* ---------- drawings ---------- */

function HeapGrid({ s, k }: { s: S; k: number }) {
  const rows = Math.ceil(PAGES / COLS)
  const W = COLS * (CELL + GAP), H = rows * (CELL + GAP)
  const litSet = new Set(Array.isArray(s.lit) ? s.lit : [])
  const xy = (p: number) => [(p % COLS) * (CELL + GAP), Math.floor(p / COLS) * (CELL + GAP)]
  const cells = Array.from({ length: PAGES }, (_, p) => p)
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full min-w-[300px]" role="img" aria-label="935 table pages">
      <defs><clipPath id="f3-sweep"><motion.rect key={k} x={0} y={0} height={H} initial={{ width: 0 }} animate={{ width: W }} transition={{ duration: 1.4, ease: 'linear' }} /></clipPath></defs>
      {cells.map((p) => { const [x, y] = xy(p); const on = litSet.has(p)
        return <motion.rect key={p} x={x} y={y} width={CELL} height={CELL} rx={1.5} initial={false}
          animate={{ fill: on ? 'var(--c-new)' : toneBg('muted', 18) }} transition={{ duration: 0.3, delay: on ? (p / PAGES) * 0.6 : 0 }} stroke={toneBg('muted', 30)} strokeWidth={0.5} /> })}
      {s.lit === 'all' && (
        <g clipPath="url(#f3-sweep)">
          {cells.map((p) => { const [x, y] = xy(p); return <rect key={p} x={x} y={y} width={CELL} height={CELL} rx={1.5} fill={toneBg('tuple', 70)} /> })}
        </g>
      )}
      {s.lit === 'all' && s.sweep && <motion.line key={`l${k}`} y1={0} y2={H} stroke="var(--c-tuple)" strokeWidth={2} initial={{ x1: 0, x2: 0 }} animate={{ x1: W, x2: W }} transition={{ duration: 1.4, ease: 'linear' }} />}
      <text x={0} y={H + 12} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">page 0</text>
      <text x={W} y={H + 12} fontSize={10} textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">page 934</text>
    </svg>
  )
}

function MiniTree({ mode }: { mode: Tree }) {
  if (mode === 'none') return null
  const deep = mode === 'built' || mode === 'point' // email index: 3 levels; signup_date index: 2 levels
  const W = 300, leafX = (i: number) => 8 + i * 41, midX = (i: number) => 40 + i * 90
  const leafOn = (i: number) => (mode === 'point' && i === 3) || (mode === 'day' && i === 2) || (mode === 'year' && i >= 2 && i <= 5)
  const midOn = (i: number) => mode === 'point' && i === 1
  const rootOn = mode !== 'built'
  const fill = (on: boolean) => (on ? toneBg('accent', 30) : toneBg('header', 14))
  const stroke = (on: boolean) => (on ? tone('accent') : tone('header'))
  const txt = { fontFamily: 'var(--font-mono)' }
  const leafY = deep ? 104 : 80
  const parentOf = (i: number) => Math.min(2, Math.floor(i / 2.4))
  return (
    <svg viewBox={`0 0 ${W} ${leafY + 46}`} className="w-full min-w-[260px]" role="img" aria-label="B-tree index">
      <text x={W / 2} y={11} textAnchor="middle" fontSize={10.5} fill="var(--muted)" style={txt}>{deep ? 'customers_email_idx · 3 levels' : 'customers_signup_idx · 2 levels'}</text>
      {deep && [0, 1, 2].map((i) => <line key={`rm${i}`} x1={W / 2} y1={38} x2={midX(i) + 30} y2={62} stroke={midOn(i) ? tone('accent') : 'var(--border)'} strokeWidth={midOn(i) ? 2 : 1} />)}
      {Array.from({ length: 7 }, (_, i) => {
        const on = leafOn(i) && (!deep || midOn(parentOf(i)))
        return <line key={`ml${i}`} x1={deep ? midX(parentOf(i)) + 30 : W / 2} y1={deep ? 80 : 38} x2={leafX(i) + 17} y2={leafY} stroke={on || (!deep && leafOn(i)) ? tone('accent') : 'var(--border)'} strokeWidth={on || (!deep && leafOn(i)) ? 2 : 1} />
      })}
      <motion.rect x={W / 2 - 30} y={18} width={60} height={20} rx={4} initial={{ opacity: 0 }} animate={{ opacity: 1, fill: fill(rootOn), stroke: stroke(rootOn) }} />
      <text x={W / 2} y={32} textAnchor="middle" fontSize={11} fill="var(--text)" style={txt}>root</text>
      {deep && [0, 1, 2].map((i) => <g key={`m${i}`}><motion.rect x={midX(i)} y={62} width={60} height={18} rx={4} initial={{ opacity: 0 }} animate={{ opacity: 1, fill: fill(midOn(i)), stroke: stroke(midOn(i)) }} transition={{ delay: 0.15 }} />
        <text x={midX(i) + 30} y={75} textAnchor="middle" fontSize={10} fill="var(--text)" style={txt}>internal</text></g>)}
      {Array.from({ length: 7 }, (_, i) => <motion.rect key={`l${i}`} x={leafX(i)} y={leafY} width={34} height={16} rx={3} initial={{ opacity: 0 }} animate={{ opacity: 1, fill: fill(leafOn(i)), stroke: stroke(leafOn(i)) }} transition={{ delay: 0.3 }} />)}
      <text x={W / 2} y={leafY + 30} textAnchor="middle" fontSize={10} fill="var(--muted)" style={txt}>leaves: sorted keys + row address</text>
      <text x={W / 2} y={leafY + 43} textAnchor="middle" fontSize={10} fill="var(--muted)" style={txt}>(page, slot) of each row</text>
    </svg>
  )
}

const COUNTRIES = ['BR', 'CA', 'DE', 'FR', 'IN', 'JP', 'NG', 'US']
function MultiBar({ mode }: { mode: 'both' | 'city' }) {
  const W = 560, segW = W / 8
  return (
    <div className="grid gap-1">
      <svg viewBox={`0 0 ${W} 42`} className="w-full min-w-[300px]" role="img" aria-label="Index entries sorted by country, then city">
        {COUNTRIES.map((c, i) => (
          <g key={c}>
            <rect x={i * segW + 1} y={14} width={segW - 2} height={24} rx={3} fill={toneBg('header', 14)} stroke={tone('header')} strokeWidth={0.8} />
            <text x={i * segW + segW / 2} y={10} textAnchor="middle" fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">{c}</text>
            {(mode === 'city' || c === 'DE') && (
              <motion.rect initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.1 * i }}
                x={i * segW + 1 + ((8 + 0.5) / 400) * (segW - 2)} y={14} width={4} height={24} fill="var(--c-new)" />
            )}
          </g>
        ))}
      </svg>
      <p className="text-xs text-muted">
        {mode === 'both'
          ? "WHERE country = 'DE' AND city = 'city-8' → one slice: 250 rows, 2 index pages read."
          : "WHERE city = 'city-8' → city-8 could sit under any country, so PostgreSQL 18 skips from country to country and searches the index 14 times instead of once."}
      </p>
    </div>
  )
}

// Inserting the 100 000 setup rows with these indexes in place (index sizes exact; insert-time ratios vary run to run).
const WRITES: [string, number, number][] = [['primary key only', 2208, 1.0], ['+ 1 index', 9136, 1.3], ['+ 2 indexes', 10032, 1.5], ['+ 4 indexes', 11640, 3.3]]
function WriteBars() {
  return (
    <div className="grid gap-1.5">
      {WRITES.map(([label, kb, x], i) => (
        <div key={label} className="grid grid-cols-[96px_1fr] items-center gap-2 text-[12px] sm:grid-cols-[120px_1fr]">
          <span className="font-mono text-muted">{label}</span>
          <div className="grid gap-0.5">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(kb / 11640) * 100}%` }} transition={{ delay: i * 0.12 }} className="h-3 rounded-sm" style={{ background: toneBg('header', 60) }} />
            <motion.div initial={{ width: 0 }} animate={{ width: `${(x / 3.3) * 100}%` }} transition={{ delay: i * 0.12 + 0.1 }} className="h-3 rounded-sm" style={{ background: toneBg('dead', 60) }} />
          </div>
          <span />
          <span className="-mt-1 font-mono text-[11px] text-muted">{kb.toLocaleString('en-US')} kB of index · about {x.toFixed(1)}× insert time</span>
        </div>
      ))}
      <p className="text-xs text-muted">Inserting the same 100,000 rows each time. The table itself is 7,480 kB in every case: four extra indexes take more space than the table and triple the insert time.</p>
    </div>
  )
}

function render(s: S, i: number) {
  return (
    <div className="grid gap-3">
      <p className="rounded-md bg-surface-2 px-3 py-1.5 font-mono text-[12px] break-words" style={{ color: tone.text('accent') }}>{s.sql}</p>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Stat label="Plan" value={s.plan} t={s.plan === 'Seq Scan' ? 'tuple' : s.plan === '—' ? undefined : 'accent'} />
        <Stat label="Est. cost" value={s.cost} />
        <Stat label="Rows returned" value={s.rows} />
        <Stat label="Rows thrown away" value={s.removed} t={s.removed !== '0' && s.removed !== '—' ? 'dead' : undefined} />
        <Stat label="Pages read" value={s.pages} />
      </div>
      {s.write ? <WriteBars /> : s.multi ? (
        <div className="grid gap-2">
          <div className="rounded-lg border border-line bg-bg p-2"><MultiBar mode="both" /></div>
          <div className="rounded-lg border border-line bg-bg p-2"><MultiBar mode="city" /></div>
        </div>
      ) : (
        <div className={`grid gap-3 ${s.tree !== 'none' ? 'md:grid-cols-[1fr_300px]' : ''}`}>
          <div className="rounded-lg border border-line bg-bg p-2"><HeapGrid s={s} k={i} /></div>
          {s.tree !== 'none' && <div className="rounded-lg border border-line bg-bg p-2"><MiniTree mode={s.tree} /></div>}
        </div>
      )}
      <Legend items={s.write ? [['header', 'size of all indexes'], ['dead', 'time to insert 100,000 rows']]
        : s.multi ? [['header', 'index entries for one country, sorted by city'], ['new', 'where the index is searched for city-8']]
        : [['muted', 'table page'], ['tuple', 'page read by a scan'], ['new', 'page holding a matching row'], ['accent', 'index pages visited']]} />
    </div>
  )
}

function IndexViz() {
  return <Stepper steps={steps} render={render} interval={2600} />
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'indexes-101',
  module: 'f3',
  order: 3,
  title: 'Indexes for beginners',
  tldr: [
    'An **index** is a separate, sorted copy of one or more columns, with a pointer from each entry to its row, like the index at the back of a book.',
    'It lets PostgreSQL jump to the few rows a query needs instead of reading the whole table, at the price of extra disk space and slower writes.',
  ],
  visualizer: {
    title: 'Reading the whole book vs using its index',
    caption: 'Step through the same 100,000-row table. Watch **Pages read** and **Rows thrown away** change as an index appears, and see when the planner decides not to use it.',
    Component: IndexViz,
  },
  playground: {
    setup: `CREATE TABLE customers (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       text NOT NULL,
  country     text NOT NULL,
  city        text NOT NULL,
  signup_date date NOT NULL
);
INSERT INTO customers (email, country, city, signup_date)
SELECT 'user' || g || '@example.com',
       (ARRAY['DE','FR','IN','US','BR','JP','NG','CA'])[1 + g % 8],
       'city-' || (g % 400),
       date '2020-01-01' + (g % 1800)
FROM generate_series(1, 100000) g;
ANALYZE customers;`,
    presets: [
      { label: '1. No index: Seq Scan', sql: `EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM customers WHERE email = 'user4242@example.com';`,
        note: 'Look for **Seq Scan**, **Rows Removed by Filter: 99999** and **Buffers: shared hit=935**: every page of the table was read to return one row.' },
      { label: '2. Add an index', sql: `CREATE INDEX customers_email_idx ON customers (email);

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM customers WHERE email = 'user4242@example.com';`,
        note: 'Now it says **Index Scan using customers_email_idx**, with an `Index Cond` instead of a `Filter`. Buffers drop from 935 to about 4, and the cost from 2185 to about 8.' },
      { label: '3. Ranges and the tipping point', sql: `CREATE INDEX customers_signup_idx ON customers (signup_date);

EXPLAIN SELECT * FROM customers WHERE signup_date = '2021-01-01';
EXPLAIN SELECT * FROM customers WHERE signup_date >= '2021-01-01';`,
        note: 'One day (about 55 rows) uses a **Bitmap Heap Scan** on the new index. Four years (80% of rows) goes back to a **Seq Scan**: reading everything is cheaper than jumping around.' },
      { label: '4. Multicolumn: leading column first', sql: `CREATE INDEX customers_country_city_idx ON customers (country, city);

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM customers WHERE country = 'DE' AND city = 'city-8';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM customers WHERE city = 'city-8';`,
        note: 'With both columns, `Index Searches: 1`. With only `city`, PostgreSQL 18 skips through the index country by country, so **Index Searches** is much higher (14 here). Put the column you always filter on first.' },
      { label: '5. Functions and expression indexes', sql: `EXPLAIN SELECT * FROM customers WHERE lower(email) = 'user4242@example.com';

CREATE INDEX customers_lower_email_idx ON customers (lower(email));
ANALYZE customers;

EXPLAIN SELECT * FROM customers WHERE lower(email) = 'user4242@example.com';`,
        note: 'The first plan is a Seq Scan: an index on `email` does not help `lower(email)`. After indexing the expression itself, the same query uses an **Index Scan**.' },
      { label: '6. What the indexes cost', sql: `SELECT relname AS object,
       CASE relkind WHEN 'r' THEN 'table' ELSE 'index' END AS kind,
       pg_size_pretty(pg_relation_size(oid)) AS size
FROM pg_class
WHERE relname LIKE 'customers%' AND relkind IN ('r', 'i')
ORDER BY pg_relation_size(oid) DESC;`,
        note: 'The five indexes together are bigger than the table itself. Every one of them must be updated on each INSERT, so add indexes for the queries you actually run.' },
      { label: '7. Where is an index missing?', sql: `SELECT pg_stat_force_next_flush();

SELECT relname AS table_name, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
ORDER BY seq_tup_read DESC;`,
        note: '`seq_scan` counts full reads of the table and `seq_tup_read` the rows those reads went through. A large table where both keep climbing is being read end to end again and again: find the query and check whether an index would serve it.' },
    ],
  },
  production: {
    title: 'An order-history page that slowed down every month',
    context: 'A shop shows each customer their orders with `SELECT … FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20`. The `orders` table grows by a million rows a month.',
    problem: 'Page loads crept from 20 ms to over a second. `EXPLAIN (ANALYZE, BUFFERS)` showed a **Seq Scan** on `orders` reading every page and removing millions of rows by filter, for every page view.',
    solution: 'Create one index that matches both the filter and the sort, with the filter column first. Build it with `CONCURRENTLY` so checkout keeps writing orders during the build.',
    sql: `CREATE INDEX CONCURRENTLY orders_customer_created_idx
  ON orders (customer_id, created_at DESC);

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_id = 42
ORDER BY created_at DESC LIMIT 20;
-- Limit -> Index Scan using orders_customer_created_idx`,
    outcome: 'The plan reads one customer\'s newest 20 index entries and their rows, a few dozen pages, no matter how large the table grows. Load time no longer depends on total order count.',
  },
  pitfalls: [
    { title: 'Indexing every column "just in case"',
      symptom: 'Inserts and updates get slower and the database grows, but queries are no faster.',
      cause: 'Every index must be updated on every write. An index that no query uses is pure cost.',
      fix: 'Index for real queries you have looked at with EXPLAIN. Find indexes that are never scanned and drop them.',
      sql: `SELECT indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes ORDER BY idx_scan, pg_relation_size(indexrelid) DESC;` },
    { title: 'A function or cast on the indexed column',
      symptom: '`WHERE lower(email) = …` or `WHERE created_at::date = …` does a Seq Scan even though the column is indexed.',
      cause: 'A plain index stores the raw column value. An expression of that column is a different value the index does not contain.',
      fix: 'Rewrite the condition to leave the column bare (`created_at >= $1::date AND created_at < $1::date + 1`) or create an index on the exact expression.' },
    { title: 'Expecting the index to always be used',
      symptom: 'You added an index and EXPLAIN still shows a Seq Scan.',
      cause: 'When a query matches a large share of the table, or the table is tiny, reading it straight through is cheaper. The planner chooses by estimated cost.',
      fix: 'Check how many rows the query really returns. Make sure statistics are fresh with `ANALYZE`. A Seq Scan for a big result is correct, not a bug.' },
    { title: 'Plain CREATE INDEX on a busy table',
      symptom: 'Checkout or other writes hang for the whole duration of an index build.',
      cause: '`CREATE INDEX` blocks INSERT, UPDATE and DELETE on the table until it finishes (reads still work).',
      fix: 'Use `CREATE INDEX CONCURRENTLY` in production. It takes longer but lets writes continue.' },
  ],
  pointers: [
    'A **Seq Scan** reads every page; an **Index Scan** walks a B-tree (root → internal → leaf) and jumps to the matching rows.',
    'An index pays off when a query needs a **small fraction** of the rows. For most of the table, a Seq Scan is cheaper and the planner picks it.',
    'In EXPLAIN, `Index Cond` means the index did the filtering; `Filter` plus a big **Rows Removed by Filter** means rows were read and thrown away.',
    'Multicolumn indexes are sorted by the **first column first**. Functions on a column need an **expression index**. Every index slows writes.',
    '**Going deeper:** [Designing indexes](/m4/index-design) and [Reading EXPLAIN (ANALYZE, BUFFERS)](/m4/explain-analyze).',
  ],
  sources: ['indexes-intro.html', 'indexes-multicolumn.html', 'indexes-expressional.html', 'sql-createindex.html', 'using-explain.html', 'indexes-bitmap-scans.html', 'monitoring-stats.html'],
}
