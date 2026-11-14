import { useState } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, tone, toneBg, type Tone } from '../../viz/kit'
import { Sql } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a monthly sales report built up one SQL idea at a time. The 17 (month, channel) sums are
 * the playground's GROUP BY output (2 866 orders, Jan to Jun 2026; the store channel was closed in April).
 * Cells carry a layoutId, so the long rows physically move into the pivot grid.
 * ---------------------------------------------------------------------------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const CH = ['web', 'app', 'store'] as const
type Ch = (typeof CH)[number]
const SUMS: Record<Ch, (number | null)[]> = {
  web: [26909, 23937, 27143, 25926, 26410, 25829],
  app: [13466, 12098, 13102, 13140, 13374, 12616],
  store: [13452, 12210, 13468, null, 13739, 12890],
}
const COUNTS: Record<Ch, (number | null)[]> = {
  web: [257, 231, 257, 248, 256, 246],
  app: [128, 116, 128, 125, 128, 123],
  store: [128, 116, 128, null, 129, 122],
}
const monthTotal = (m: number) => CH.reduce((s, c) => s + (SUMS[c][m] ?? 0), 0)
const chTotal = (c: Ch) => SUMS[c].reduce<number>((s, v) => s + (v ?? 0), 0)
const grand = CH.reduce((s, c) => s + chTotal(c), 0)
const fmt = (n: number) => n.toLocaleString('en-US')

type Phase = 'long' | 'pivot' | 'spine' | 'rollup' | 'pct' | 'delta' | 'deltaGap'
interface S { phase: Phase; sql: string }

const steps: Step<S>[] = [
  { title: 'Long format: one row per (month, channel)', body: '`GROUP BY` returns **17 rows**, not 18: no orders means no group, so April store is simply absent. Reports want months down and channels across.',
    state: { phase: 'long', sql: `SELECT date_trunc('month', ordered_at) AS month, channel, sum(amount)
FROM orders GROUP BY 1, 2 ORDER BY 1, 2;` } },
  { title: 'Pivot with FILTER: one column per channel', body: 'Each output column is its own aggregate with a `FILTER (WHERE …)`. One scan fills the grid. The April store cell is **NULL**, because `sum` of no rows is NULL, not 0.',
    state: { phase: 'pivot', sql: `SELECT date_trunc('month', ordered_at) AS month,
       sum(amount) FILTER (WHERE channel = 'web')   AS web,
       sum(amount) FILTER (WHERE channel = 'app')   AS app,
       sum(amount) FILTER (WHERE channel = 'store') AS store
FROM orders GROUP BY 1 ORDER BY 1;` } },
  { title: 'Date spine: every month, every channel', body: 'Generate the months you *want* with `generate_series`, cross join the channels, then LEFT JOIN the facts. Missing combinations become explicit **0** rows instead of holes.',
    state: { phase: 'spine', sql: `SELECT m.month, c.channel, coalesce(sum(o.amount), 0) AS sales
FROM generate_series(timestamptz '2026-01-01', '2026-06-01', interval '1 month') AS m(month)
CROSS JOIN (VALUES ('web'), ('app'), ('store')) AS c(channel)
LEFT JOIN orders o ON o.channel = c.channel
                  AND o.ordered_at >= m.month AND o.ordered_at < m.month + interval '1 month'
GROUP BY 1, 2;` } },
  { title: 'Totals: ROLLUP adds the margins', body: '`GROUP BY ROLLUP (month)` adds a grand-total row in the same pass. Row totals are just the sum of the three FILTER columns.',
    state: { phase: 'rollup', sql: `SELECT CASE WHEN grouping(month) = 1 THEN 'Total' ELSE to_char(month, 'Mon') END AS month,
       sum(sales) FILTER (WHERE channel = 'web') AS web, …,
       sum(sales) AS total
FROM spine GROUP BY ROLLUP (month) ORDER BY grouping(month), month;` } },
  { title: 'Share of the month', body: 'A window aggregate with `PARTITION BY month` divides each cell by its month total, without a second query or a self-join.',
    state: { phase: 'pct', sql: `SELECT month, channel,
       round(100.0 * sales / sum(sales) OVER (PARTITION BY month), 1) AS pct
FROM spine;` } },
  { title: 'Change vs previous month (with the spine)', body: '`lag(sales) OVER (PARTITION BY channel ORDER BY month)` reads the previous row. With the spine, May store is compared with April (0), so it shows as new revenue.',
    state: { phase: 'delta', sql: `SELECT month, channel, sales,
       sales - lag(sales) OVER (PARTITION BY channel ORDER BY month) AS delta
FROM spine;` } },
  { title: 'The same lag without the spine', body: '`lag` means *previous row*, not *previous month*. Without the spine, April store has no row, so May is compared with **March** and the closure disappears from the report.',
    state: { phase: 'deltaGap', sql: `-- no spine: the previous row for May store is March
SELECT month, channel, sales,
       sales - lag(sales) OVER (PARTITION BY channel ORDER BY month) AS delta
FROM monthly_sales_without_spine;` } },
]

function cellTone(phase: Phase, c: Ch, m: number): Tone | undefined {
  if (c === 'store' && m === 3) return phase === 'pivot' || phase === 'deltaGap' ? 'dead' : phase === 'long' ? undefined : 'new'
  if (phase === 'deltaGap' && c === 'store' && m === 4) return 'dead'
  if ((phase === 'delta') && c === 'store' && m === 4) return 'new'
  return undefined
}

function cellText(phase: Phase, c: Ch, m: number): string {
  const v = SUMS[c][m]
  if (phase === 'pct') return v === null ? '0.0%' : `${((100 * v) / monthTotal(m)).toFixed(1)}%`
  if (phase === 'delta' || phase === 'deltaGap') {
    if (m === 0) return '·'
    if (phase === 'deltaGap' && c === 'store') {
      if (m === 3) return ''
      const prev = m === 4 ? SUMS.store[2]! : SUMS.store[m - 1]!
      return signed(v! - prev)
    }
    return signed((v ?? 0) - (SUMS[c][m - 1] ?? 0))
  }
  if (v === null) return phase === 'pivot' ? 'NULL' : '0'
  return fmt(v)
}
const signed = (n: number) => (n > 0 ? '+' : '') + fmt(n)

function Report({ s, sel, onSel }: { s: S; sel: [Ch, number] | null; onSel: (x: [Ch, number] | null) => void }) {
  const { phase } = s
  const long = phase === 'long'
  const showTotals = phase === 'rollup'
  return (
    <LayoutGroup>
      <div className="grid gap-3">
        <Sql>{s.sql}</Sql>
        {long ? (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-6">
            {MONTHS.map((mn, m) => (
              <div key={mn} className="grid gap-1">
                {CH.map((c) => SUMS[c][m] === null ? (
                  <div key={c} className="rounded-md border border-dashed border-line px-2 py-1 font-mono text-[11px] text-muted">{mn} · {c} · no row</div>
                ) : (
                  <motion.div key={c} layoutId={`${c}-${m}`} className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[11px]">
                    {mn} · {c} · <b>{fmt(SUMS[c][m]!)}</b>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
            <table className="w-full min-w-[420px] border-collapse font-mono text-[12px]">
              <thead><tr className="border-b border-line text-left text-muted">
                <th className="px-2 py-1">month</th>{CH.map((c) => <th key={c} className="px-2 py-1 text-right">{c}</th>)}
                {showTotals && <th className="px-2 py-1 text-right">total</th>}
              </tr></thead>
              <tbody>
                {MONTHS.map((mn, m) => (
                  <tr key={mn} className="border-b border-line last:border-0">
                    <td className="px-2 py-0.5 text-muted">{mn}</td>
                    {CH.map((c) => {
                      const t = cellTone(phase, c, m)
                      const active = sel && sel[0] === c && sel[1] === m
                      return (
                        <td key={c} className="p-0.5 text-right">
                          <motion.button layoutId={SUMS[c][m] === null ? undefined : `${c}-${m}`} type="button" onClick={() => onSel(active ? null : [c, m])}
                            className="w-full rounded px-1.5 py-0.5 text-right tabular-nums"
                            style={{ background: t ? toneBg(t, 20) : active ? toneBg('accent', 18) : undefined, color: t ? tone(t) : undefined, outline: active ? `1.5px solid ${tone('accent')}` : undefined }}>
                            {cellText(phase, c, m)}
                          </motion.button>
                        </td>
                      )
                    })}
                    {showTotals && <td className="px-2 py-0.5 text-right font-semibold tabular-nums">{fmt(monthTotal(m))}</td>}
                  </tr>
                ))}
                {showTotals && (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: toneBg('header', 14) }}>
                    <td className="px-2 py-1 font-semibold">Total</td>
                    {CH.map((c) => <td key={c} className="px-2 py-1 text-right font-semibold tabular-nums">{fmt(chTotal(c))}</td>)}
                    <td className="px-2 py-1 text-right font-bold tabular-nums">{fmt(grand)}</td>
                  </motion.tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!long && (
          <p className="text-xs text-muted">
            {sel
              ? <>Cell <b className="font-mono">{MONTHS[sel[1]]} · {sel[0]}</b> = <span className="font-mono">sum(amount) FILTER (WHERE channel = '{sel[0]}')</span> over the <b>{COUNTS[sel[0]][sel[1]] ?? 0}</b> orders of {MONTHS[sel[1]]}{COUNTS[sel[0]][sel[1]] === null ? ' (no rows: only the spine puts a 0 here)' : ''}.</>
              : 'Click any cell to see the aggregate and the source rows that feed it.'}
          </p>
        )}
      </div>
    </LayoutGroup>
  )
}

function PivotViz() {
  const [sel, setSel] = useState<[Ch, number] | null>(null)
  return (
    <div className="grid gap-3">
      <Stepper steps={steps} interval={2600} render={(s) => <Report s={s} sel={sel} onSel={setSel} />} />
      <Legend items={[['dead', 'wrong or missing'], ['new', 'filled by the spine'], ['header', 'ROLLUP total row'], ['accent', 'selected cell']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'pivot-reporting',
  module: 'f4',
  order: 3,
  title: 'Pivots and reports',
  tldr: [
    'A **pivot** turns rows into columns: `sum(amount) FILTER (WHERE channel = \'web\')` per output column, over a **date spine** from `generate_series`, gives one report row per period with zeros where nothing happened.',
    'Reports go wrong in the gaps, so the spine, `coalesce`, window shares and `lag` over a complete series are what keep the totals, percentages and month-over-month changes honest.',
  ],
  visualizer: {
    title: 'Build a monthly report, one SQL idea at a time',
    caption: 'Step from long GROUP BY rows to a pivot, then add the date spine, totals, shares and month-over-month change. The last step shows what `lag` does when the spine is missing. Click a cell to see what feeds it.',
    Component: PivotViz,
  },
  playground: {
    extensions: ['tablefunc'],
    setup: `
SET TimeZone = 'UTC';
CREATE TABLE orders (
  id int PRIMARY KEY,
  ordered_at timestamptz NOT NULL,
  channel text NOT NULL,
  amount numeric(10,2) NOT NULL);
INSERT INTO orders
SELECT g,
       timestamptz '2026-01-01 00:00+00' + g * interval '87 minutes',
       (ARRAY['web', 'web', 'app', 'store'])[1 + g % 4],
       10 + (g * 37) % 190
FROM generate_series(1, 2990) g;
-- the store was closed for renovation in April
DELETE FROM orders WHERE channel = 'store' AND ordered_at >= '2026-04-01' AND ordered_at < '2026-05-01';
-- the spine every report below builds on
CREATE VIEW monthly_sales AS
SELECT m.month, c.channel, coalesce(sum(o.amount), 0) AS sales, count(o.id) AS orders
FROM generate_series(timestamptz '2026-01-01', '2026-06-01', interval '1 month') AS m(month)
CROSS JOIN (VALUES ('web'), ('app'), ('store')) AS c(channel)
LEFT JOIN orders o ON o.channel = c.channel
                  AND o.ordered_at >= m.month AND o.ordered_at < m.month + interval '1 month'
GROUP BY m.month, c.channel;`,
    presets: [
      { label: '1. Pivot with FILTER', sql: `SELECT to_char(date_trunc('month', ordered_at), 'YYYY-MM') AS month,
       sum(amount) FILTER (WHERE channel = 'web')   AS web,
       sum(amount) FILTER (WHERE channel = 'app')   AS app,
       sum(amount) FILTER (WHERE channel = 'store') AS store,
       count(*) AS orders
FROM orders
GROUP BY 1 ORDER BY 1;`,
        note: 'Six rows, one per month. April `store` is **NULL**: `sum` over zero rows is NULL. `count` is the only aggregate that returns 0 for no rows.' },
      { label: '2. Missing rows vs the spine', sql: `SELECT 'plain GROUP BY' AS source, count(*) AS rows
FROM (SELECT 1 FROM orders GROUP BY date_trunc('month', ordered_at), channel) g
UNION ALL
SELECT 'date spine', count(*) FROM monthly_sales;

SELECT to_char(month, 'YYYY-MM') AS month, channel, sales, orders
FROM monthly_sales WHERE month = '2026-04-01' ORDER BY channel;`,
        note: 'Plain GROUP BY yields 17 groups, the spine 18. April store is there with `sales = 0` and `orders = 0`, so charts and averages see the closure instead of skipping it.' },
      { label: '3. crosstab (tablefunc)', sql: `SELECT * FROM crosstab(
  $$SELECT to_char(month, 'YYYY-MM'), channel, sales FROM monthly_sales ORDER BY 1$$,
  $$VALUES ('web'), ('app'), ('store')$$
) AS ct(month text, web numeric, app numeric, store numeric);`,
        note: 'The two-argument form maps each value to its category column, so order within a month does not matter. Columns must still be declared by hand: crosstab cannot invent columns at run time.' },
      { label: '4. Subtotals with ROLLUP', sql: `SELECT CASE WHEN grouping(month) = 1 THEN 'Total' ELSE to_char(month, 'YYYY-MM') END AS month,
       sum(sales) FILTER (WHERE channel = 'web')   AS web,
       sum(sales) FILTER (WHERE channel = 'app')   AS app,
       sum(sales) FILTER (WHERE channel = 'store') AS store,
       sum(sales) AS total
FROM monthly_sales
GROUP BY ROLLUP (month)
ORDER BY grouping(month), month;`,
        note: 'The extra row has `grouping(month) = 1`: it is the grand total, computed in the same pass. Labelling it with `grouping()` rather than `coalesce` keeps it apart from real NULL keys.' },
      { label: '5. Percent of the month', sql: `SELECT to_char(month, 'YYYY-MM') AS month, channel, sales,
       round(100.0 * sales / sum(sales) OVER (PARTITION BY month), 1) AS pct_of_month,
       round(100.0 * sales / sum(sales) OVER (), 2) AS pct_of_half_year
FROM monthly_sales
ORDER BY month, channel
LIMIT 9;`,
        note: 'Window aggregates compute the denominators without collapsing rows: `PARTITION BY month` for the month share, an empty `OVER ()` for the share of everything. Web is about 50% in each month shown; remove the `LIMIT` and April jumps to 66%, because the store sold nothing.' },
      { label: '6. Month over month: the lag trap', sql: `-- with the spine: May store is compared with April (0)
SELECT to_char(month, 'YYYY-MM') AS month, sales,
       sales - lag(sales) OVER (ORDER BY month) AS delta
FROM monthly_sales WHERE channel = 'store' ORDER BY month;

-- without the spine: May is compared with March
SELECT to_char(month, 'YYYY-MM') AS month, sales,
       sales - lag(sales) OVER (ORDER BY month) AS delta
FROM (SELECT date_trunc('month', ordered_at) AS month, sum(amount) AS sales
      FROM orders WHERE channel = 'store' GROUP BY 1) s
ORDER BY month;`,
        note: 'With the spine, April shows `-13468` and May `+13739`. Without it there are only five rows and May shows **+271**: `lag` returned March, the previous *row*, and the closure vanished from the report.' },
    ],
  },
  production: {
    title: 'A revenue dashboard that hid a lost channel',
    context: 'A retail analytics team feeds a weekly dashboard from `GROUP BY week, region` and a week-over-week column computed with `lag()`.',
    problem: 'One region stopped selling for two weeks after a payment outage. Those weeks produced no rows, so the chart joined the points on either side, the average per week went *up*, and `lag` compared the recovery week with the week before the outage, showing healthy growth.',
    solution: 'Generate the expected periods (and dimension members) first, LEFT JOIN the facts and `coalesce` empty cells to 0. Compute `lag`, shares and averages only over that complete grid.',
    sql: `WITH spine AS (
  SELECT w.week, r.region
  FROM generate_series(date_trunc('week', now()) - interval '12 weeks',
                       date_trunc('week', now()), interval '1 week') AS w(week)
  CROSS JOIN regions r)
SELECT s.week, s.region, coalesce(sum(o.amount), 0) AS sales,
       coalesce(sum(o.amount), 0)
         - lag(coalesce(sum(o.amount), 0)) OVER (PARTITION BY s.region ORDER BY s.week) AS wow
FROM spine s
LEFT JOIN orders o ON o.region = s.region
                  AND o.ordered_at >= s.week AND o.ordered_at < s.week + interval '1 week'
GROUP BY s.week, s.region;`,
    outcome: 'The outage weeks show as zeros and the recovery week as a jump from 0. In the playground, the same mistake turns the store\'s real -13 468 / +13 739 swing into a quiet +271.',
  },
  pitfalls: [
    { title: 'Missing periods silently disappear',
      symptom: 'Charts skip periods, averages per period are too high, and `lag` compares the wrong periods.',
      cause: 'GROUP BY only returns groups that have rows. A period with no data produces no row at all.',
      fix: 'Build a spine with `generate_series` (cross joined with the dimension values) and LEFT JOIN the facts to it.' },
    { title: 'NULL where the report needs 0',
      symptom: 'Totals or percentages come out NULL, or a cell shows blank.',
      cause: 'Every aggregate except `count` returns NULL over zero rows, and NULL plus anything is NULL.',
      fix: 'Wrap the aggregate: `coalesce(sum(amount), 0)`. Use `NULLIF(denominator, 0)` when dividing.' },
    { title: 'crosstab with the one-argument form',
      symptom: 'Values land in the wrong column when a category is missing for some row.',
      cause: 'The one-argument form fills columns left to right and ignores the category value, so a missing category shifts the rest left.',
      fix: 'Use the two-argument form `crosstab(source_sql, category_sql)`, or plain `FILTER` aggregates, which never shift.' },
    { title: 'Time-zone boundaries',
      symptom: 'Monthly totals differ between the report and the finance export by a few orders.',
      cause: '`date_trunc` on a `timestamptz` uses the session `TimeZone`, so months start at different instants for different clients.',
      fix: 'Set the reporting zone explicitly: `date_trunc(\'month\', ordered_at, \'Europe/Berlin\')`, or `SET TimeZone` in the reporting session.' },
  ],
  pointers: [
    'Pivot with one `agg(...) FILTER (WHERE key = …)` per output column: one scan, no shifting columns.',
    'Build a **date spine** with `generate_series`, cross join the dimensions, LEFT JOIN the facts, `coalesce` to 0.',
    '`lag()` means the previous **row**. It is only "the previous period" over a complete spine.',
    'Shares come from window aggregates: `x / sum(x) OVER (PARTITION BY period)`. Subtotals come from `ROLLUP` in the same pass.',
    '**Going deeper:** [Aggregates, FILTER and GROUPING SETS](/m3/aggregates-grouping) and [Window functions and frames](/m3/window-functions).',
  ],
  sources: ['sql-expressions.html', 'tablefunc.html', 'queries-table-expressions.html', 'functions-aggregate.html', 'functions-srf.html', 'functions-window.html', 'functions-datetime.html', 'tutorial-window.html'],
}
