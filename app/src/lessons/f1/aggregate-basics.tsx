import { useState, type ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { PRODUCTS, PRODUCTS_SQL, Sql, money, type Product, type SqlLine } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one grouped query evaluated clause by clause in its logical order
 * (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT). Rows fade out at WHERE, fly into one
 * bucket per category at GROUP BY, buckets are dropped by HAVING, collapse into one output row at SELECT,
 * reorder at ORDER BY and are cut at LIMIT. Aggregate values (including avg = 24.1666666666666667 and
 * count(stock) = 2 vs count(*) = 3 in kitchen) are exactly what PostgreSQL 18 returns for this data.
 * ---------------------------------------------------------------------------------------------- */

type Cat = Product['category']
const CATS: Cat[] = ['home', 'kitchen', 'office']
const STAGES = ['FROM', 'WHERE', 'GROUP BY', 'HAVING', 'SELECT', 'ORDER BY', 'LIMIT'] as const
const kept = PRODUCTS.filter((p) => p.price < 100)
const members = (c: Cat) => kept.filter((p) => p.category === c)

/** Aggregates per bucket, as PostgreSQL prints them for this data. */
const AGG: Record<Cat, { n: number; nStock: number; sumStock: number; sumPrice: string; avg: string; avg2: string; min: string; max: string }> = {
  home: { n: 3, nStock: 3, sumStock: 42, sumPrice: '99.00', avg: '33.0000000000000000', avg2: '33.00', min: '15.00', max: '60.00' },
  kitchen: { n: 3, nStock: 2, sumStock: 40, sumPrice: '72.50', avg: '24.1666666666666667', avg2: '24.17', min: '9.50', max: '45.00' },
  office: { n: 2, nStock: 1, sumStock: 120, sumPrice: '19.50', avg: '9.7500000000000000', avg2: '9.75', min: '4.50', max: '15.00' },
}
const CAT_TONE: Record<Cat, Tone> = { home: 'tuple', kitchen: 'pointer', office: 'header' }

interface S { stage: number }

const STEPS: Step<S>[] = [
  { title: 'Written order is not run order',
    body: 'You write `SELECT` first, but it runs fifth. The numbers show the order PostgreSQL applies the clauses. Follow the rows through each one.',
    state: { stage: -1 } },
  { title: '1 · FROM: start with every row',
    body: '`FROM products` supplies all 9 rows. Everything after this works on these rows.',
    state: { stage: 0 } },
  { title: '2 · WHERE: drop rows one by one',
    body: '`WHERE price < 100` tests each **row**. Desk chair (150.00) is false, so it is gone before any grouping happens.',
    state: { stage: 1 } },
  { title: '3 · GROUP BY: fold rows into buckets',
    body: '`GROUP BY category` puts rows with the same category in one **bucket**. Aggregates such as `count(*)` and `avg(price)` are computed per bucket.',
    state: { stage: 2 } },
  { title: '4 · HAVING: drop whole buckets',
    body: '`HAVING count(*) >= 3` tests each **group**, not each row. Office has only 2 rows left, so the whole bucket is dropped.',
    state: { stage: 3 } },
  { title: '5 · SELECT: one output row per bucket',
    body: 'Each bucket collapses into one row. `round(avg(price), 2)` turns `24.1666666666666667` into `24.17`. Only now do the names `n` and `avg_price` exist.',
    state: { stage: 4 } },
  { title: '6 · ORDER BY: sort the output rows',
    body: '`ORDER BY avg_price DESC` can use the output name, because it runs after SELECT. Home (33.00) moves above kitchen (24.17).',
    state: { stage: 5 } },
  { title: '7 · LIMIT: keep the first row',
    body: '`LIMIT 1` keeps home and cuts kitchen. Result: **home | 3 | 33.00**, the most expensive category with at least 3 products under 100.',
    state: { stage: 6 } },
]

const LINES: { text: string; stage: number }[] = [
  { text: 'SELECT category, count(*) AS n,', stage: 4 },
  { text: '  round(avg(price), 2) AS avg_price', stage: 4 },
  { text: 'FROM products', stage: 0 },
  { text: 'WHERE price < 100', stage: 1 },
  { text: 'GROUP BY category', stage: 2 },
  { text: 'HAVING count(*) >= 3', stage: 3 },
  { text: 'ORDER BY avg_price DESC', stage: 5 },
  { text: 'LIMIT 1;', stage: 6 },
]

function sqlLines(stage: number): SqlLine[] {
  return LINES.map((l, i) => ({
    text: l.text,
    badge: i === 1 ? ' ' : String(l.stage + 1),
    t: stage === l.stage ? 'new' : stage > l.stage ? 'ok' : stage === -1 ? undefined : 'muted',
  }))
}

function Rail({ stage }: { stage: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {STAGES.map((st, i) => {
        const t: Tone = i === stage ? 'new' : i < stage ? 'ok' : 'muted'
        return (
          <div key={st} className="flex items-center gap-1">
            <motion.span className="rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold" animate={{ scale: i === stage ? 1.08 : 1 }}
              style={{ borderColor: tone(t), background: toneBg(t, i === stage ? 22 : 10), color: i > stage ? 'var(--muted)' : 'var(--text)' }}>
              {i + 1} {st}
            </motion.span>
            {i < STAGES.length - 1 && <span className="text-muted" aria-hidden>→</span>}
          </div>
        )
      })}
    </div>
  )
}

function RowChip({ p, dropped, compact }: { p: Product; dropped?: boolean; compact?: boolean }) {
  const t = CAT_TONE[p.category]
  return (
    <motion.div layout layoutId={`p${p.id}`} transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      animate={{ opacity: dropped ? 0.35 : 1 }}
      className={`flex items-center justify-between gap-2 rounded border px-2 py-0.5 font-mono text-[11.5px] ${dropped ? 'line-through' : ''}`}
      style={{ borderColor: dropped ? tone('dead') : tone(t), background: toneBg(dropped ? 'dead' : t, 12) }}>
      <span className="truncate">{p.name}</span>
      {!compact && <span className="ml-auto text-muted">{p.category}</span>}
      <span>{money(p.price)}</span>
    </motion.div>
  )
}

function PipelineViz() {
  const [pick, setPick] = useState<Cat>('kitchen')
  return (
    <Stepper steps={STEPS} interval={3000} render={(s) => {
      const st = s.stage
      // Before ORDER BY the output order is arbitrary; kitchen first makes the sort visible.
      const order: Cat[] = st >= 5 ? ['home', 'kitchen', 'office'] : ['kitchen', 'home', 'office']
      return (
        <div className="grid gap-3">
          <Rail stage={st} />
          <Legend items={[['new', 'clause running now'], ['ok', 'already applied'], ['dead', 'removed'], ['tuple', 'home'], ['pointer', 'kitchen'], ['header', 'office']]} />
          <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="grid content-start gap-2">
              <Sql lines={sqlLines(st)} />
              <Panel title={`inside the ${pick} bucket`}>
                <div className="mb-2 flex flex-wrap gap-1">
                  {CATS.map((c) => (
                    <button key={c} type="button" onClick={() => setPick(c)} className="rounded border px-2 py-0.5 font-mono text-[11px]"
                      style={{ borderColor: tone(CAT_TONE[c]), background: toneBg(CAT_TONE[c], pick === c ? 28 : 6) }}>{c}</button>
                  ))}
                </div>
                <FieldTable rows={([
                  ['count(*)', AGG[pick].n, 'all rows'],
                  ['count(stock)', AGG[pick].nStock, 'non-NULL only'],
                  ['sum(stock)', AGG[pick].sumStock, 'skips NULL'],
                  ['sum(price)', AGG[pick].sumPrice, ''],
                  ['avg(price)', AGG[pick].avg, 'sum ÷ count'],
                  ['min / max', `${AGG[pick].min} / ${AGG[pick].max}`, ''],
                ] as [string, string | number, string][]).map(([k, v, n]) => [k, <span key={k}>{v}{n && <span className="ml-2 font-sans text-[11px] text-muted">{n}</span>}</span>] as [string, ReactNode])} highlight={AGG[pick].n !== AGG[pick].nStock ? 'count(stock)' : undefined} />
                <p className="mt-1.5 text-[11px] text-muted">Rows after WHERE: {members(pick).map((p) => `${p.name} (stock ${p.stock ?? 'NULL'})`).join(', ')}.</p>
              </Panel>
            </div>
            <LayoutGroup>
              <div className="grid content-start gap-2">
                {st < 2 && (
                  <div className="grid gap-1 rounded-lg border border-line bg-surface p-2">
                    <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{st < 0 ? 'products' : st === 0 ? 'rows from FROM: 9' : 'rows after WHERE: 8'}</p>
                    {PRODUCTS.map((p) => <RowChip key={p.id} p={p} dropped={st >= 1 && p.price >= 100} />)}
                  </div>
                )}
                {st >= 2 && st < 4 && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {CATS.map((c) => {
                      const gone = st >= 3 && AGG[c].n < 3
                      return (
                        <motion.div key={c} layoutId={`b-${c}`} className="grid content-start gap-1 rounded-lg border-2 p-2"
                          animate={{ opacity: gone ? 0.45 : 1 }}
                          style={{ borderColor: gone ? tone('dead') : tone(CAT_TONE[c]), background: toneBg(gone ? 'dead' : CAT_TONE[c], 8) }}>
                          <div className="font-mono text-[12px]">
                            <p className={`font-bold ${gone ? 'line-through' : ''}`}>{c}</p>
                            <p className="text-[11px]" style={{ color: gone ? tone('dead') : 'var(--muted)' }}>count(*) = {AGG[c].n}</p>
                          </div>
                          {members(c).map((p) => <RowChip key={p.id} p={p} compact />)}
                          {gone && <p className="text-[11px] font-semibold" style={{ color: tone.text('dead') }}>2 &lt; 3: dropped by HAVING</p>}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
                {st >= 4 && (
                  <div className="overflow-hidden rounded-lg border border-line bg-surface">
                    <div className="grid grid-cols-[1fr_3rem_5.5rem] gap-2 border-b border-line px-3 py-1 font-mono text-[11px] font-semibold text-muted">
                      <span>category</span><span className="text-right">n</span><span className="text-right">avg_price</span>
                    </div>
                    <AnimatePresence initial={false}>
                      {order.filter((c) => AGG[c].n >= 3).map((c, i) => {
                        const cut = st >= 6 && i >= 1
                        return (
                          <motion.div key={c} layoutId={`b-${c}`} transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                            className="grid grid-cols-[1fr_3rem_5.5rem] gap-2 border-b border-line px-3 py-1.5 font-mono text-[12.5px] last:border-0"
                            animate={{ opacity: cut ? 0.4 : 1 }}
                            style={{ background: toneBg(cut ? 'dead' : CAT_TONE[c], 12), boxShadow: `inset 3px 0 0 ${tone(cut ? 'dead' : CAT_TONE[c])}` }}>
                            <span className={cut ? 'line-through' : ''}>{c}</span>
                            <span className="text-right">{AGG[c].n}</span>
                            <span className="text-right font-bold">{AGG[c].avg2}</span>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                    <p className="border-t border-line px-3 py-1 text-[11px] text-muted">
                      {st === 4 ? 'office never reaches SELECT: HAVING removed it.' : st === 5 ? 'sorted by avg_price, highest first' : 'LIMIT 1: (1 row)'}
                    </p>
                  </div>
                )}
              </div>
            </LayoutGroup>
          </div>
        </div>
      )
    }} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'aggregate-basics',
  module: 'f1',
  order: 4,
  title: 'Counting, summing and grouping',
  tldr: [
    'An **aggregate** such as `count`, `sum` or `avg` turns many rows into one value, and `GROUP BY` computes it once per group of rows that share a key.',
    'Most questions people ask of data ("how many", "how much", "per what") are aggregates, and knowing the order the clauses run in tells you where each filter belongs.',
  ],
  visualizer: {
    title: 'How a grouped SELECT is evaluated',
    caption: 'Step through the clauses in the order they run. Watch rows drop at WHERE, fold into buckets at GROUP BY, and buckets drop at HAVING. Click a bucket name to see all its aggregates.',
    Component: PipelineViz,
  },
  playground: {
    setup: `${PRODUCTS_SQL}
-- A tiny helper so the error presets show the message instead of stopping.
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'count(*) vs count(col)', sql: `SELECT count(*)     AS all_rows,
       count(stock) AS rows_with_stock,
       count(DISTINCT category) AS categories,
       sum(stock)   AS units,
       min(price)   AS cheapest,
       max(price)   AS dearest,
       avg(price)   AS avg_price,
       round(avg(price), 2) AS avg_rounded
FROM products;`,
        note: '`count(*)` = 9 rows, `count(stock)` = 7: the two NULL stocks are skipped. `count(DISTINCT category)` = 3: distinct non-NULL values. `avg` prints 16 decimals (37.8888888888888889); `round(…, 2)` gives 37.89.' },
      { label: 'GROUP BY', sql: `SELECT category,
       count(*)              AS products,
       sum(stock)            AS units,
       round(avg(price), 2)  AS avg_price
FROM products
GROUP BY category
ORDER BY category;`,
        note: 'One output row per category. Each aggregate is computed over that category\'s rows only.' },
      { label: 'The GROUP BY rule', sql: `SELECT try_sql('SELECT category, name, count(*) FROM products GROUP BY category') AS ungrouped_column;

SELECT category, string_agg(name, ', ' ORDER BY name) AS names, count(*)
FROM products
GROUP BY category
ORDER BY category;`,
        note: 'Error **42803**: a bucket has many names, so `name` must be grouped or aggregated. `string_agg` is an aggregate that joins them into one text value.' },
      { label: 'WHERE vs HAVING', sql: `SELECT try_sql('SELECT category FROM products WHERE count(*) >= 3 GROUP BY category') AS aggregate_in_where;

SELECT category, count(*) AS n, round(avg(price), 2) AS avg_price
FROM products
WHERE price < 100
GROUP BY category
HAVING count(*) >= 3
ORDER BY avg_price DESC;`,
        note: 'Aggregates are not allowed in WHERE (**42803**): WHERE runs before groups exist. WHERE drops the Desk chair row; HAVING drops the office group (only 2 rows left).' },
      { label: 'The full pipeline', sql: `SELECT category, count(*) AS n, round(avg(price), 2) AS avg_price
FROM products
WHERE price < 100
GROUP BY category
HAVING count(*) >= 3
ORDER BY avg_price DESC
LIMIT 1;

SELECT try_sql('SELECT category, avg(price) AS a FROM products GROUP BY category HAVING a > 30') AS alias_in_having;`,
        note: 'The visualizer\'s query: **home | 3 | 33.00**. ORDER BY may use the alias `avg_price`, but HAVING may not (**42703**), because it runs before SELECT names the columns.' },
      { label: 'Group by an expression', sql: `SELECT price >= 20 AS pricey, count(*), round(avg(price), 2) AS avg_price
FROM products
GROUP BY price >= 20
ORDER BY pricey;

SELECT stock IS NULL AS stock_unknown, count(*)
FROM products
GROUP BY stock IS NULL;`,
        note: 'Any expression can be a group key. 5 products are under 20.00 and 4 are not; 2 have unknown stock.' },
      { label: 'Aggregates over no rows', sql: `SELECT count(*) AS n, sum(stock) AS units, avg(price) AS avg_price,
       coalesce(sum(stock), 0) AS units_or_zero
FROM products
WHERE category = 'garden';`,
        note: 'No garden products: `count` gives 0, but `sum` and `avg` give **NULL**. `coalesce(x, 0)` replaces NULL with 0.' },
    ],
  },
  production: {
    title: 'A category summary for a dashboard',
    context: 'A shop dashboard shows one tile per category: number of products, units in stock and average price.',
    problem: 'The first version loaded every product into the app and counted in code. It sent every row over the network on each page view, and the "units" tile silently treated uncounted products as having 0 units, so nobody could see that some had never been counted.',
    solution: 'Let the database aggregate and send only the summary rows. Count uncounted products separately so the gap is visible.',
    sql: `SELECT category,
       count(*)                         AS products,
       count(stock)                     AS counted,
       count(*) - count(stock)          AS not_counted,
       coalesce(sum(stock), 0)          AS units,
       round(avg(price), 2)             AS avg_price
FROM products
GROUP BY category
ORDER BY category;`,
    outcome: 'The app receives 3 rows instead of 9 (and the saving grows with the catalog: always one row per category). Kitchen and office each show 1 product as "not counted" (Teapot and Pen set) instead of hiding it.',
  },
  pitfalls: [
    { title: 'A column that is neither grouped nor aggregated',
      symptom: '`ERROR: column "products.name" must appear in the GROUP BY clause or be used in an aggregate function`.',
      cause: 'After GROUP BY each output row stands for a whole bucket. A bucket has many names, so `name` alone has no single value.',
      fix: 'Add the column to GROUP BY if you want a row per value, or wrap it in an aggregate (`min(name)`, `string_agg(name, \', \')`).' },
    { title: 'count(col) when you meant count(*)',
      symptom: 'A "products per category" number is lower than the real count.',
      cause: '`count(col)` skips rows where `col` is NULL. `count(*)` counts rows.',
      fix: 'Use `count(*)` to count rows. Use `count(col)` only when "rows that have a value" is what you mean.' },
    { title: 'Filtering groups in WHERE',
      symptom: '`ERROR: aggregate functions are not allowed in WHERE`.',
      cause: 'WHERE runs before GROUP BY, when there are no groups to count yet.',
      fix: 'Filter rows in WHERE, and filter groups in HAVING: `HAVING count(*) >= 3`. Repeat the expression; HAVING cannot see SELECT aliases.' },
    { title: 'sum() of nothing is NULL, not 0',
      symptom: 'A total shows blank for a category with no matching rows, or app code crashes on a null.',
      cause: 'Every aggregate except `count` returns NULL when it sees no rows.',
      fix: 'Wrap it: `coalesce(sum(stock), 0)`.' },
  ],
  pointers: [
    '`count(*)` counts rows; `count(col)` counts non-NULL values; `sum`, `avg`, `min`, `max` skip NULLs and return NULL on zero rows.',
    'With GROUP BY, every selected column must be in the GROUP BY or inside an aggregate (or the primary key of its table is in the GROUP BY).',
    'WHERE filters **rows** before grouping. HAVING filters **groups** after. Aggregates belong in HAVING.',
    'Run order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. WHERE and HAVING cannot use SELECT aliases; ORDER BY can. PostgreSQL also lets `GROUP BY` name an output column or its position: `GROUP BY pricey`, `GROUP BY 1`.',
    '**Going deeper:** [Aggregates, FILTER and GROUPING SETS](/m3/aggregates-grouping) adds subtotals and conditional counts; [From SQL text to rows](/m4/query-pipeline) shows the plan that runs a query.',
  ],
  sources: ['tutorial-agg.html', 'functions-aggregate.html', 'queries-table-expressions.html', 'sql-select.html', 'functions-math.html', 'functions-conditional.html'],
}
