import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { ResultTable, Sql, type ResultRow } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a grouping-sets builder over the docs' items_sold table plus one row with a real NULL size.
 * GROUP BY ROLLUP / CUBE / GROUPING SETS is equivalent to a UNION ALL of one GROUP BY per grouping set,
 * computed here set by set. Output rows, sums and grouping() bitmasks match PostgreSQL 18 (PGlite),
 * which runs all sets in one MixedAggregate node over a single scan.
 * ---------------------------------------------------------------------------------------------- */

interface Item { brand: string; size: string | null; sales: number }
const ITEMS: Item[] = [
  { brand: 'Foo', size: 'L', sales: 10 }, { brand: 'Foo', size: 'M', sales: 20 }, { brand: 'Bar', size: 'M', sales: 15 },
  { brand: 'Bar', size: 'L', sales: 5 }, { brand: 'Baz', size: null, sales: 8 },
]
type SetKey = 'bs' | 'b' | 's' | 'e'
const SETS: Record<SetKey, { cols: ('brand' | 'size')[]; label: string }> = {
  bs: { cols: ['brand', 'size'], label: '(brand, size)' }, b: { cols: ['brand'], label: '(brand)' },
  s: { cols: ['size'], label: '(size)' }, e: { cols: [], label: '()' },
}
type Mode = 'plain' | 'rollup' | 'cube' | 'custom'
const MODE_SETS: Record<Exclude<Mode, 'custom'>, SetKey[]> = { plain: ['bs'], rollup: ['bs', 'b', 'e'], cube: ['bs', 'b', 's', 'e'] }
const PALETTE: Tone[] = ['tuple', 'ok', 'new', 'header', 'pointer']
const grouping = (k: SetKey) => (SETS[k].cols.includes('brand') ? 0 : 2) + (SETS[k].cols.includes('size') ? 0 : 1)

interface GState { active: SetKey | null; done: SetKey[]; rowGroup: (number | null)[]; out: ResultRow[] }

function groupsFor(k: SetKey) {
  const cols = SETS[k].cols
  const keys: string[] = []
  const rowGroup = ITEMS.map((it) => {
    const key = cols.map((c) => String(it[c])).join('|')
    if (!keys.includes(key)) keys.push(key)
    return keys.indexOf(key)
  })
  const rows = keys.map((_k, gi) => {
    const members = ITEMS.filter((_, r) => rowGroup[r] === gi)
    const first = members[0]
    return { brand: cols.includes('brand') ? first.brand : null, size: cols.includes('size') ? first.size : null, sum: members.reduce((a, m) => a + m.sales, 0), n: members.length, gi }
  })
  return { rowGroup, rows }
}

function sqlFor(mode: Mode, sets: SetKey[]) {
  const by = mode === 'plain' ? 'brand, size' : mode === 'rollup' ? 'ROLLUP (brand, size)' : mode === 'cube' ? 'CUBE (brand, size)' : `GROUPING SETS (${sets.map((k) => SETS[k].label).join(', ') || '()'})`
  return `SELECT brand, size, sum(sales),\n       grouping(brand, size) AS g\nFROM items_sold\nGROUP BY ${by};`
}

function buildSteps(mode: Mode, sets: SetKey[]): Step<GState>[] {
  const steps: Step<GState>[] = [{
    title: mode === 'plain' ? 'One grouping set' : `${sets.length} grouping sets, one scan`,
    body: mode === 'plain' ? 'A plain GROUP BY is a single grouping set: one output row per distinct **(brand, size)**.' :
      `${mode === 'rollup' ? '`ROLLUP (brand, size)` means the list and all its **prefixes**' : mode === 'cube' ? '`CUBE (brand, size)` means **every subset** (2² = 4)' : 'You picked the sets'}: ${sets.map((k) => SETS[k].label).join(', ')}. The result equals a UNION ALL of one GROUP BY per set.`,
    state: { active: null, done: [], rowGroup: ITEMS.map(() => null), out: [] },
  }]
  const out: ResultRow[] = []
  const done: SetKey[] = []
  for (const k of sets) {
    const { rowGroup, rows } = groupsFor(k)
    rows.forEach((r) => out.push({ key: `${k}-${r.gi}`, cells: [r.brand, r.size, r.sum, grouping(k)], t: PALETTE[r.gi % PALETTE.length] }))
    done.push(k)
    const g = grouping(k)
    const nullNote = k === 's' ? ' Note the second **(NULL, NULL)** row: Baz\'s size really is NULL, so it forms its own group, and only `g = 2` tells it apart from the grand total.'
      : k === 'b' ? ' Its `size` column is NULL because size is **not in this set**, not because the data is NULL.'
      : k === 'bs' ? ' Baz has a real NULL size, which simply groups like any other value.'
      : ' The empty set puts **every row in one group**: the grand total, emitted even on empty input.'
    steps.push({ title: `Set ${SETS[k].label}: ${rows.length} group${rows.length === 1 ? '' : 's'}, grouping() = ${g}`,
      body: `Input rows fold into ${rows.length} group${rows.length === 1 ? '' : 's'} by ${SETS[k].cols.length ? SETS[k].cols.join(' and ') : 'nothing'}. \`grouping(brand, size)\` = ${g} (binary ${g.toString(2).padStart(2, '0')}): a 1 bit means that column is **not** grouped here.${nullNote}`,
      state: { active: k, done: [...done], rowGroup, out: [...out] } })
  }
  steps.push({ title: `Result: ${out.length} rows`, body: 'PostgreSQL computes all sets in **one pass** (a `MixedAggregate` node with one Hash Key per set), not one scan per set. Use `grouping()` to label subtotal rows, never `IS NULL`.',
    state: { active: null, done: [...done], rowGroup: ITEMS.map(() => null), out: [...out] } })
  return steps
}

const LATTICE: Record<SetKey, [number, number]> = { bs: [150, 26], b: [70, 90], s: [230, 90], e: [150, 154] }

function Lattice({ sets, s }: { sets: SetKey[]; s: GState }) {
  return (
    <svg viewBox="0 0 300 180" className="w-full min-w-[240px]" role="img" aria-label="Lattice of grouping sets">
      {([['bs', 'b'], ['bs', 's'], ['b', 'e'], ['s', 'e']] as [SetKey, SetKey][]).map(([a, b]) => (
        <line key={a + b} x1={LATTICE[a][0]} y1={LATTICE[a][1] + 14} x2={LATTICE[b][0]} y2={LATTICE[b][1] - 14} stroke="var(--border)" strokeWidth={1.5} />
      ))}
      {(Object.keys(LATTICE) as SetKey[]).map((k) => {
        const [x, y] = LATTICE[k]
        const on = sets.includes(k), act = s.active === k, fin = s.done.includes(k)
        const t: Tone = act ? 'new' : fin ? 'ok' : on ? 'tuple' : 'muted'
        return (
          <motion.g key={k} animate={{ scale: act ? 1.08 : 1, opacity: on ? 1 : 0.35 }} style={{ originX: `${x}px`, originY: `${y}px` }}>
            <rect x={x - 52} y={y - 14} width={104} height={28} rx={14} fill={toneBg(t, on ? 20 : 6)} stroke={tone(t)} strokeWidth={act ? 2.2 : 1.2} strokeDasharray={on ? undefined : '4 3'} />
            <text x={x} y={y + 4.5} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--text)" fontFamily="var(--font-mono)">{SETS[k].label}</text>
          </motion.g>
        )
      })}
    </svg>
  )
}

function GroupingViz() {
  const [mode, setMode] = useState<Mode>('cube')
  const [custom, setCustom] = useState<SetKey[]>(['b', 's'])
  const sets = mode === 'custom' ? (['bs', 'b', 's', 'e'] as SetKey[]).filter((k) => custom.includes(k)) : MODE_SETS[mode]
  const steps = useMemo(() => buildSteps(mode, sets), [mode, sets.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (k: SetKey) => setCustom((c) => (c.includes(k) ? (c.length > 1 ? c.filter((x) => x !== k) : c) : [...c, k]))
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="GROUP BY" value={mode} onChange={setMode} options={[['plain', 'GROUP BY brand, size'], ['rollup', 'ROLLUP'], ['cube', 'CUBE'], ['custom', 'GROUPING SETS …']]} />
        {mode === 'custom' && (['bs', 'b', 's', 'e'] as SetKey[]).map((k) => (
          <label key={k} className="inline-flex items-center gap-1 font-mono text-[12px]">
            <input type="checkbox" checked={custom.includes(k)} onChange={() => toggle(k)} className="accent-[var(--accent)]" />{SETS[k].label}
          </label>
        ))}
      </div>
      <Stepper key={`${mode}-${sets.join()}`} steps={steps} interval={2800} render={(s) => (
        <div className="grid gap-3">
          <Legend items={[['new', 'grouping set being computed'], ['ok', 'set done'], ['tuple', 'set still to run'], ['muted', 'set not requested']]} />
          <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr]">
            <div className="grid content-start gap-2">
              <div className="rounded-lg border border-line bg-bg p-2"><Lattice sets={sets} s={s} /></div>
              <Panel title={s.active ? `input rows, grouped by ${SETS[s.active].label}` : 'items_sold (input)'}>
                <div className="grid gap-1">
                  {ITEMS.map((it, r) => {
                    const g = s.rowGroup[r]
                    const t = g === null ? null : PALETTE[g % PALETTE.length]
                    return (
                      <motion.div key={r} layout className="grid grid-cols-[3rem_3rem_1fr] rounded px-2 py-1 font-mono text-[12px]"
                        style={{ background: t ? toneBg(t, 18) : 'transparent', boxShadow: t ? `inset 3px 0 0 ${tone(t)}` : 'inset 0 0 0 transparent' }}>
                        <span>{it.brand}</span><span>{it.size ?? <i className="text-muted">NULL</i>}</span><span className="text-right">{it.sales}</span>
                      </motion.div>
                    )
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">Rows of one colour fold into one output row.</p>
              </Panel>
            </div>
            <div className="grid content-start gap-2">
              <ResultTable caption="output (one block per grouping set)" fields={['brand', 'size', 'sum', 'g']} rows={s.out} empty="(no set computed yet)" />
              <Sql>{sqlFor(mode, sets)}</Sql>
            </div>
          </div>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'aggregates-grouping',
  module: 'm3',
  order: 8,
  title: 'Aggregates, FILTER and GROUPING SETS',
  tldr: [
    'An **aggregate** folds many input rows into one value per group, and `FILTER`, ordered-set aggregates and `GROUPING SETS` / `ROLLUP` / `CUBE` control which rows feed it and which groupings are produced.',
    'Together they turn a dozen report queries (totals, subtotals, conditional counts, medians) into one pass over the data, provided you respect the NULL rules that make `count(col)` differ from `count(*)` and `sum` of nothing NULL.',
  ],
  visualizer: {
    title: 'Grouping sets, one set at a time',
    caption: 'Pick ROLLUP, CUBE or your own GROUPING SETS and step through each set. Watch which input rows fold together, and how `grouping()` tells a subtotal\'s NULL from Baz\'s real NULL size.',
    Component: GroupingViz,
  },
  playground: {
    setup: `
CREATE TABLE items_sold (brand text, size text, sales int);
INSERT INTO items_sold VALUES ('Foo', 'L', 10), ('Foo', 'M', 20), ('Bar', 'M', 15), ('Bar', 'L', 5), ('Baz', NULL, 8);
CREATE TABLE orders (
  id int PRIMARY KEY, region text NOT NULL, status text NOT NULL,
  amount numeric(10,2), coupon text, created_at date NOT NULL);
INSERT INTO orders
SELECT g, (ARRAY['north','south','east','west'])[1 + g % 4],
       (ARRAY['paid','paid','paid','refunded','pending'])[1 + g % 5],
       CASE WHEN g % 50 = 0 THEN NULL ELSE 10 + (g * 37) % 190 END,
       CASE WHEN g % 3 = 0 THEN 'WELCOME' END,
       DATE '2026-10-01' + g % 61
FROM generate_series(1, 2000) g;
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'CUBE and grouping()', sql: `SELECT brand, size, sum(sales), grouping(brand, size) AS g
FROM items_sold
GROUP BY CUBE (brand, size)
ORDER BY g, brand, size;`,
        note: '12 rows. Two rows read `NULL, NULL`: sum 8 with g = 2 (Baz\'s real NULL size, grouped by size) and sum 58 with g = 3 (the grand total).' },
      { label: 'Four queries, or one GROUPING SETS', sql: `-- four GROUP BYs glued together: four scans
EXPLAIN (COSTS OFF)
SELECT brand, size, sum(sales) FROM items_sold GROUP BY brand, size
UNION ALL SELECT brand, NULL, sum(sales) FROM items_sold GROUP BY brand
UNION ALL SELECT NULL, size, sum(sales) FROM items_sold GROUP BY size
UNION ALL SELECT NULL, NULL, sum(sales) FROM items_sold;

-- the same 12 rows from one scan
SELECT brand, size, sum(sales)
FROM items_sold
GROUP BY GROUPING SETS ((brand, size), (brand), (size), ())
ORDER BY brand, size;

EXPLAIN (COSTS OFF)
SELECT brand, size, sum(sales) FROM items_sold
GROUP BY GROUPING SETS ((brand, size), (brand), (size), ());`,
        note: 'The UNION ALL plan is an **Append** of four aggregates, each over its own Seq Scan. GROUPING SETS returns the same 12 rows from one **MixedAggregate** (one Hash Key per set, `Group Key: ()` for the total) over a single scan. `CUBE (brand, size)` is shorthand for exactly these four sets.' },
      { label: 'ROLLUP with labels', sql: `SELECT CASE WHEN grouping(brand) = 1 THEN 'ALL brands' ELSE brand END AS brand,
       CASE WHEN grouping(size) = 1 THEN 'all sizes' ELSE coalesce(size, '(none)') END AS size,
       sum(sales)
FROM items_sold
GROUP BY ROLLUP (brand, size)
ORDER BY grouping(brand), brand, grouping(size), size;

EXPLAIN (COSTS OFF)
SELECT brand, size, sum(sales) FROM items_sold GROUP BY ROLLUP (brand, size);`,
        note: 'ROLLUP gives detail rows, a subtotal per brand and a grand total. The plan is one **MixedAggregate** with a Hash Key per set: a single scan.' },
      { label: 'count(*) vs count(col)', sql: `SELECT count(*)               AS all_rows,
       count(amount)          AS with_amount,
       count(coupon)          AS with_coupon,
       count(DISTINCT region) AS regions,
       sum(amount)            AS total,
       round(avg(amount), 2)  AS avg_amount,
       round(sum(amount) / count(*), 2) AS naive_avg
FROM orders;

SELECT sum(amount) AS sum_of_nothing, count(*) AS count_of_nothing,
       coalesce(sum(amount), 0) AS fixed
FROM orders WHERE false;`,
        note: '`count(*)` counts rows, `count(col)` skips NULLs (40 orders have no amount, so `avg` ignores them: 104.63). Dividing `sum` by `count(*)` counts those 40 rows as zeros and gives 102.54. Over zero rows `sum` is **NULL**, not 0; only count returns 0.' },
      { label: 'FILTER: one pass, many counts', sql: `SELECT region,
       count(*)                                    AS orders,
       count(*)    FILTER (WHERE status = 'paid')     AS paid,
       sum(amount) FILTER (WHERE status = 'refunded') AS refunded,
       round(100.0 * count(*) FILTER (WHERE coupon IS NOT NULL) / count(*), 1) AS coupon_pct
FROM orders
GROUP BY region ORDER BY region;`,
        note: 'Each aggregate sees only the rows its FILTER allows, all in a single scan. Clearer than `sum(CASE WHEN … THEN 1 ELSE 0 END)`, and it works with any aggregate: `array_agg(x) FILTER (…)` skips rows, while the CASE trick would collect NULLs. FILTER is standard SQL, not a PostgreSQL extension.' },
      { label: 'Median and mode', sql: `SELECT region,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY amount) AS median_cont,
       percentile_disc(0.5) WITHIN GROUP (ORDER BY amount) AS median_disc,
       mode() WITHIN GROUP (ORDER BY status)              AS most_common_status
FROM orders GROUP BY region ORDER BY region;`,
        note: 'Ordered-set aggregates sort their input. `percentile_cont` interpolates between the two middle values; `percentile_disc` returns an actual input value. There is no separate `median()`: `percentile_cont(0.5)` is the median.' },
      { label: 'WHERE vs HAVING', sql: `SELECT try_sql($q$
  SELECT region FROM orders WHERE sum(amount) > 50000 GROUP BY region $q$) AS in_where;

SELECT try_sql($q$
  SELECT region, sum(amount) AS total FROM orders GROUP BY region HAVING total > 1 $q$) AS alias_in_having;

SELECT region, sum(amount) AS total
FROM orders
WHERE status = 'paid'
GROUP BY region
HAVING sum(amount) > 30000
ORDER BY region;`,
        note: 'Aggregates are not allowed in WHERE (`42803`): WHERE filters input rows, HAVING filters groups after aggregation. HAVING cannot use the output alias `total` either (`42703`), because the SELECT list is computed after HAVING. Logical order: FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT. ORDER BY can use output names, and so can GROUP BY as a PostgreSQL extension; WHERE and HAVING cannot.' },
      { label: 'DISTINCT ON: first row per key', sql: `SELECT DISTINCT ON (region) region, id, amount, created_at
FROM orders
WHERE amount IS NOT NULL
ORDER BY region, amount DESC, id;`,
        note: 'One row per region: the first after sorting, here the largest order. The DISTINCT ON expressions must lead the ORDER BY; add a tie-breaker (`id`) for a deterministic pick.' },
    ],
  },
  production: {
    title: 'A finance dashboard: from 9 queries to 1',
    context: 'A finance dashboard shows revenue by region and month, subtotals per region, per month, a grand total, and for each cell the refunded amount and the share of coupon orders.',
    problem: 'It ran 9 separate queries (one per breakdown and metric), each scanning the orders table, and the page took seconds. Subtotal rows were found with `WHERE month IS NULL`, which also caught orders whose month column was legitimately NULL.',
    solution: 'One `GROUP BY CUBE` with FILTER clauses, and `grouping()` to label the subtotal rows.',
    sql: `SELECT region, date_trunc('month', created_at) AS month,
       grouping(region, date_trunc('month', created_at)) AS level,
       sum(amount) FILTER (WHERE status = 'paid')     AS revenue,
       sum(amount) FILTER (WHERE status = 'refunded') AS refunded,
       round(100.0 * count(*) FILTER (WHERE coupon IS NOT NULL) / count(*), 1) AS coupon_pct
FROM orders
GROUP BY CUBE (region, date_trunc('month', created_at));`,
    outcome: 'One scan feeding one MixedAggregate instead of nine scans. For 4 regions and 2 months that is 4 × 2 + 4 + 2 + 1 = 15 rows. Subtotal rows are identified by `level`, so a real NULL can never be mistaken for a total.',
  },
  pitfalls: [
    { title: 'sum() of no rows is NULL',
      symptom: 'A balance shows blank (or the app crashes on null) for a customer with no transactions.',
      cause: 'Every aggregate except `count` returns **NULL** on an empty input: `sum`, `avg`, `max`, even `array_agg`.',
      fix: "Wrap it: `coalesce(sum(amount), 0)`. For arrays, `coalesce(array_agg(x), '{}')`. The same applies to FILTER: a month with no matching rows gives `sum(x) FILTER (…)` = NULL, so a CASE or FILTER rewrite of a report that used to print 0 needs the COALESCE back." },
    { title: 'count(col) where count(*) was meant',
      symptom: 'A conversion rate is too high: the denominator is smaller than the number of visits.',
      cause: '`count(col)` counts only non-NULL values. If the column is nullable, rows silently drop out.',
      fix: 'Use `count(*)` to count rows; use `count(col)` only when "rows with a value" is what you mean.' },
    { title: 'Telling subtotals apart with IS NULL',
      symptom: 'A ROLLUP report shows two "Total" lines for one region.',
      cause: 'Grouping sets fill ungrouped columns with NULL, which is indistinguishable from a real NULL in the data.',
      fix: 'Use `grouping(col)`: 1 means the NULL is a subtotal placeholder, 0 means it is data.' },
    { title: 'Order-sensitive aggregates without ORDER BY',
      symptom: '`string_agg(name, \', \')` lists names in a different order on each run.',
      cause: 'Aggregate input order is unspecified. A sorted subquery usually works but is not guaranteed once the plan changes.',
      fix: 'Put the order inside the call: `string_agg(name, \', \' ORDER BY name)`, `array_agg(x ORDER BY ts)`.' },
    { title: 'BETWEEN on a timestamp drops the last day',
      symptom: 'An October report built with `WHERE created_at BETWEEN \'2026-10-01\' AND \'2026-10-31\'` is missing most of October 31.',
      cause: 'BETWEEN is inclusive on both ends, and `\'2026-10-31\'` on a timestamp means midnight at the **start** of the 31st. Hourly rows for October: 721 instead of 744. In adjacent BETWEEN buckets the boundary row lands in both.',
      fix: 'Use a half-open range: `created_at >= \'2026-10-01\' AND created_at < \'2026-11-01\'`. It is exact for dates and timestamps, never double-counts, and an index can use it.',
      sql: `SELECT count(*) FILTER (WHERE t BETWEEN '2026-10-01' AND '2026-10-31') AS between_rows,
       count(*) FILTER (WHERE t >= '2026-10-01' AND t < '2026-11-01')  AS half_open_rows
FROM generate_series(timestamp '2026-10-01', timestamp '2026-10-31 23:00', interval '1 hour') t;` },
    { title: 'Integer division in ratios',
      symptom: 'A conversion rate prints 0 for every row, or a share prints 33 instead of 33.3.',
      cause: '`count(*)` returns bigint, and integer / integer truncates: `2 / 3` is 0. A zero denominator raises `division by zero`.',
      fix: 'Make one operand numeric first (`100.0 * count(*) FILTER (…) / count(*)`) and guard the denominator with `NULLIF(count(*), 0)`, which turns 0 into NULL so the ratio is NULL instead of an error.' },
  ],
  pointers: [
    '`count(*)` counts rows; `count(col)` counts non-NULL values; every other aggregate returns **NULL** on no rows.',
    '`agg(...) FILTER (WHERE ...)` restricts one aggregate\'s input; WHERE restricts all rows; HAVING filters groups.',
    '`ROLLUP (a, b)` = (a,b), (a), (); `CUBE (a, b)` = all 4 subsets; all sets run in one scan.',
    '`grouping(a, b)` is a bitmask: bit = 1 when that column is **not** grouped in the current row\'s set.',
    'Ordered-set aggregates: `percentile_cont` interpolates, `percentile_disc` picks a value, `mode()` returns the most frequent.',
  ],
  sources: ['functions-aggregate.html', 'queries-table-expressions.html', 'sql-expressions.html', 'sql-select.html', 'tutorial-agg.html'],
}
