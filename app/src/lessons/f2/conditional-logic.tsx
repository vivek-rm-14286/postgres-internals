import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, Note } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: walk the five playground orders one row at a time and watch a conditional expression
 * evaluate. Every branch result and every output value matches PostgreSQL 18 on the same rows.
 * ---------------------------------------------------------------------------------------------- */

interface Order { id: number; customer: string; status: string; total: number | null; qty: number; coupon: number | null; promo: number | null }
const ORDERS: Order[] = [
  { id: 1, customer: 'Ann', status: 'paid', total: 120, qty: 4, coupon: null, promo: 5 },
  { id: 2, customer: 'Bob', status: 'refunded', total: 64.5, qty: 3, coupon: 10, promo: null },
  { id: 3, customer: 'Cy', status: 'paid', total: null, qty: 2, coupon: null, promo: null },
  { id: 4, customer: 'Dee', status: 'pending', total: 18, qty: 2, coupon: null, promo: 2.5 },
  { id: 5, customer: 'Eve', status: 'paid', total: 50, qty: 0, coupon: null, promo: null },
]
const money = (v: number | null) => (v === null ? 'NULL' : v.toFixed(2))

type V = 'true' | 'false' | 'null' | 'skip' | 'value'
interface Line { code: string; v: V; shown?: string }
interface Eval { lines: Line[]; result: string; note: string }

type Mode = 'case' | 'coalesce' | 'nullif' | 'filter'
const cmp = (x: number | null, k: number): V => (x === null ? 'null' : x >= k ? 'true' : 'false')

function evalCase(o: Order): Eval {
  const tests: [string, V, string][] = [
    ['WHEN total >= 100', cmp(o.total, 100), "THEN 'gold'"],
    ['WHEN total >= 50', cmp(o.total, 50), "THEN 'silver'"],
    ['WHEN total IS NULL', o.total === null ? 'true' : 'false', "THEN 'unknown'"],
  ]
  const lines: Line[] = []; let result = 'bronze', hit = -1
  tests.forEach(([c, v, then], i) => {
    if (hit >= 0) { lines.push({ code: `${c} ${then}`, v: 'skip' }); return }
    lines.push({ code: `${c} ${then}`, v })
    if (v === 'true') { hit = i; result = then.slice(6, -1) }
  })
  lines.push({ code: "ELSE 'bronze'", v: hit >= 0 ? 'skip' : 'value', shown: hit >= 0 ? undefined : "'bronze'" })
  const note = o.total === null
    ? 'total is NULL, so `total >= 100` is **NULL**, not false. CASE only takes a branch whose condition is **true**, so it moves on until `IS NULL` matches.'
    : hit === 0 ? 'The first condition is true, so CASE returns **gold** and never looks at the later branches.'
      : hit === 1 ? `${o.total} is not >= 100 but is >= 50: the **first true** branch wins, so order matters. Swap the branches and every order over 50 would be silver.`
        : 'No condition is true, so the **ELSE** value is used. Without an ELSE the result would be NULL.'
  return { lines, result, note }
}

function evalCoalesce(o: Order): Eval {
  const args: [string, number | null][] = [['coupon', o.coupon], ['promo', o.promo], ['0', 0]]
  const lines: Line[] = []; let result = ''
  for (const [name, v] of args) {
    if (result) { lines.push({ code: name, v: 'skip' }); continue }
    if (v === null) lines.push({ code: name, v: 'null' })
    else { result = name === '0' ? '0' : money(v); lines.push({ code: name, v: 'value', shown: result }) }
  }
  const firstNull = o.coupon === null
  return { lines, result, note: !firstNull ? '`coupon` is not NULL, so COALESCE returns it at once and does **not evaluate** the rest.' : result === '0' ? 'Both discounts are NULL, so the fallback **0** is returned. Always end a COALESCE with a safe default.' : '`coupon` is NULL, so COALESCE tries the next argument: `promo` has a value.' }
}

function evalNullif(o: Order): Eval {
  const den = o.qty === 0 ? null : o.qty
  const lines: Line[] = [
    { code: `NULLIF(qty, 0)  -- qty = ${o.qty}`, v: den === null ? 'null' : 'value', shown: den === null ? undefined : String(den) },
    { code: `total / ${den === null ? 'NULL' : den}  -- total = ${money(o.total)}`, v: o.total === null || den === null ? 'null' : 'value', shown: o.total === null || den === null ? undefined : (o.total / den).toFixed(16) },
    { code: 'round(…, 2)', v: o.total === null || den === null ? 'null' : 'value', shown: o.total === null || den === null ? undefined : (o.total / den).toFixed(2) },
  ]
  const result = o.total === null || den === null ? 'NULL' : (o.total / den).toFixed(2)
  return { lines, result, note: o.qty === 0 ? 'qty is 0. Plain `total / qty` would stop the whole query with **division by zero**. `NULLIF(qty, 0)` turns the 0 into NULL, and anything divided by NULL is NULL.' : o.total === null ? 'total is NULL, so the result is NULL: most operators return NULL when any input is NULL.' : `qty is ${o.qty}, not 0, so NULLIF returns it unchanged and the division runs normally.` }
}

const FILTERS: { code: string; test: (o: Order) => boolean; add: (o: Order) => number | null; fmt: (n: number | null) => string }[] = [
  { code: 'count(*)', test: () => true, add: () => 1, fmt: (n) => String(n ?? 0) },
  { code: "count(*) FILTER (WHERE status = 'paid')", test: (o) => o.status === 'paid', add: () => 1, fmt: (n) => String(n ?? 0) },
  { code: "sum(total) FILTER (WHERE status = 'paid')", test: (o) => o.status === 'paid', add: (o) => o.total, fmt: (n) => (n === null ? 'NULL' : n.toFixed(2)) },
  { code: 'count(*) FILTER (WHERE total IS NULL)', test: (o) => o.total === null, add: () => 1, fmt: (n) => String(n ?? 0) },
]
function accumulate(upto: number) {
  return FILTERS.map((f) => {
    let acc: number | null = f.code.startsWith('sum') ? null : 0
    for (const o of ORDERS.slice(0, upto + 1)) if (f.test(o)) { const a = f.add(o); if (a !== null) acc = (acc ?? 0) + a }
    return acc
  })
}

const vTone: Record<V, Tone> = { true: 'ok', false: 'muted', null: 'new', skip: 'muted', value: 'pointer' }
const vText = (l: Line) => (l.v === 'skip' ? 'not evaluated' : l.v === 'value' ? (l.shown ?? '') : l.v === 'null' ? 'NULL' : l.v.toUpperCase())

const MODES: Record<Exclude<Mode, 'filter'>, { title: string; sql: string; cols: (keyof Order)[]; out: string; run: (o: Order) => Eval }> = {
  case: { title: 'Searched CASE', sql: "CASE WHEN total >= 100 THEN 'gold'\n     WHEN total >= 50  THEN 'silver'\n     WHEN total IS NULL THEN 'unknown'\n     ELSE 'bronze' END AS tier", cols: ['id', 'customer', 'total'], out: 'tier', run: evalCase },
  coalesce: { title: 'COALESCE chain', sql: 'COALESCE(coupon, promo, 0) AS discount', cols: ['id', 'customer', 'coupon', 'promo'], out: 'discount', run: evalCoalesce },
  nullif: { title: 'Safe division', sql: 'round(total / NULLIF(qty, 0), 2) AS per_item', cols: ['id', 'customer', 'total', 'qty'], out: 'per_item', run: evalNullif },
}

function cellText(o: Order, c: keyof Order) {
  const v = o[c]
  if (v === null) return 'NULL'
  return typeof v === 'number' && (c === 'total' || c === 'coupon' || c === 'promo') ? v.toFixed(2) : String(v)
}

function RowWalker() {
  const [mode, setMode] = useState<Mode>('case')
  const [row, setRow] = useState(0)
  const next = () => setRow((r) => (r + 1) % ORDERS.length)
  const m = mode === 'filter' ? null : MODES[mode]
  const cols: (keyof Order)[] = m ? m.cols : ['id', 'customer', 'status', 'total']
  const ev = m ? m.run(ORDERS[row]) : null
  const acc = accumulate(row)
  const o = ORDERS[row]
  return (
    <div className="grid gap-3 [font-variant-ligatures:none]">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Expression" value={mode} onChange={(v) => { setMode(v); setRow(0) }} options={[['case', 'CASE'], ['coalesce', 'COALESCE'], ['nullif', 'NULLIF'], ['filter', 'FILTER']]} />
        <Btn primary testid="viz-next" onClick={next}>{row === ORDERS.length - 1 ? 'Start over ↺' : 'Next row →'}</Btn>
      </div>
      <pre className="[font-variant-ligatures:none] overflow-x-auto rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[12.5px] leading-relaxed text-ink scrollbar-thin">{m ? `SELECT ${cols.join(', ')},\n       ${m.sql.replace(/\n/g, '\n       ')}\nFROM orders ORDER BY id;` : `SELECT ${FILTERS.map((f) => f.code).join(',\n       ')}\nFROM orders;`}</pre>
      <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="orders">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse font-mono text-[12px]">
              <thead><tr className="text-left text-muted">{cols.map((c) => <th key={c} className="py-1 pr-3 font-semibold">{c}</th>)}{m && <th className="py-1 font-semibold" style={{ color: tone.text('pointer') }}>{m.out}</th>}</tr></thead>
              <tbody>
                {ORDERS.map((r, i) => {
                  const done = i < row, cur = i === row
                  const passes = !m && FILTERS[1].test(r)
                  return (
                    <motion.tr key={r.id} layout className="border-t border-line" animate={{ backgroundColor: cur ? toneBg('accent', 16) : 'rgba(0,0,0,0)' }}>
                      {cols.map((c) => <td key={c} className="py-1.5 pr-3" style={{ color: r[c] === null ? tone('new') : undefined, fontWeight: !m && c === 'status' && passes && (cur || done) ? 700 : undefined }}>{cellText(r, c)}</td>)}
                      {m && (
                        <td className="py-1.5 font-bold" style={{ color: tone.text('pointer') }}>
                          <AnimatePresence>{(done || cur) && <motion.span key={`${mode}${r.id}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: cur ? 0.5 : 0 }}>{m.run(r).result}</motion.span>}</AnimatePresence>
                        </td>
                      )}
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        {ev ? (
          <Panel title={`${m!.title}: row id ${o.id}`}>
            <div className="grid gap-1.5">
              {ev.lines.map((l, i) => (
                <motion.div key={`${mode}${row}${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: l.v === 'skip' ? 0.5 : 1, x: 0 }} transition={{ delay: i * 0.14 }}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-2 py-1" style={{ borderColor: tone(vTone[l.v]), background: toneBg(vTone[l.v], l.v === 'skip' ? 4 : 12) }}>
                  <code className="font-mono text-[12px]">{l.code}</code>
                  <span className="rounded px-1.5 py-0.5 font-mono text-[11px] font-bold" style={{ color: tone.text(vTone[l.v]), background: toneBg(vTone[l.v], 18) }}>{vText(l)}</span>
                </motion.div>
              ))}
              <motion.p key={`r${mode}${row}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ev.lines.length * 0.14 }} className="mt-1 font-mono text-sm">
                → <b style={{ color: tone.text('pointer') }}>{ev.result}</b>
              </motion.p>
            </div>
          </Panel>
        ) : (
          <Panel title={`Accumulators after row id ${o.id}`}>
            <div className="grid grid-cols-2 gap-2">
              {FILTERS.map((f, i) => {
                const hit = f.test(o)
                return (
                  <div key={f.code} className="rounded-lg border px-2 py-1.5" style={{ borderColor: hit ? tone('ok') : 'var(--border)', background: hit ? toneBg('ok', 10) : 'transparent' }}>
                    <p className="font-mono text-[10.5px] leading-tight text-muted">{f.code}</p>
                    <motion.p key={`${row}${i}`} initial={{ scale: hit ? 1.25 : 1 }} animate={{ scale: 1 }} className="font-mono text-lg font-bold" style={{ color: hit ? tone('ok') : 'var(--text)' }}>{f.fmt(acc[i])}</motion.p>
                    <p className="text-[10.5px]" style={{ color: hit ? tone('ok') : 'var(--muted)' }}>{hit ? (f.code.startsWith('sum') && o.total === null ? 'row passes, but NULL adds nothing' : 'row passes the filter') : 'row skipped'}</p>
                  </div>
                )
              })}
            </div>
          </Panel>
        )}
      </div>
      <Note>{ev ? ev.note : o.total === null && o.status === 'paid'
        ? 'Row 3 is paid, so the paid count goes up, but its total is NULL: `sum` ignores NULLs and the revenue stays the same. The last counter catches the missing value.'
        : 'Each aggregate sees only the rows that pass its own **FILTER**. One pass over the table produces every metric.'}</Note>
      <Legend items={[['ok', 'condition TRUE'], ['muted', 'FALSE / not evaluated'], ['new', 'NULL (unknown)'], ['pointer', 'value returned']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'conditional-logic',
  module: 'f2',
  order: 4,
  title: 'Conditional logic',
  tldr: [
    '`CASE`, `COALESCE`, `NULLIF`, `GREATEST`/`LEAST` and aggregate `FILTER` let one query choose a value per row, replace missing data and count different things in a single pass.',
    'They exist so that labels, defaults and guarded calculations such as division by zero live in SQL, right next to the data, instead of in a loop in application code.',
  ],
  visualizer: {
    title: 'Evaluate a conditional expression row by row',
    caption: 'Choose an expression and press **Next row**. Branches light up in order: true, false, NULL or not evaluated at all. In **FILTER** mode, watch four aggregates fill up in one pass.',
    Component: RowWalker,
  },
  playground: {
    setup: `
CREATE TABLE orders (
  id       int PRIMARY KEY,
  customer text NOT NULL,
  status   text NOT NULL,          -- paid / refunded / pending
  total    numeric(8,2),           -- NULL = not known yet
  qty      int,
  coupon   numeric(6,2),
  promo    numeric(6,2)
);
INSERT INTO orders VALUES
  (1, 'Ann', 'paid',     120.00, 4, NULL,  5.00),
  (2, 'Bob', 'refunded',  64.50, 3, 10.00, NULL),
  (3, 'Cy',  'paid',      NULL,  2, NULL,  NULL),
  (4, 'Dee', 'pending',   18.00, 2, NULL,  2.50),
  (5, 'Eve', 'paid',      50.00, 0, NULL,  NULL);`,
    presets: [
      { label: 'Searched CASE', sql: `SELECT id, customer, total,
       CASE WHEN total >= 100 THEN 'gold'
            WHEN total >= 50  THEN 'silver'
            WHEN total IS NULL THEN 'unknown'
            ELSE 'bronze'
       END AS tier
FROM orders ORDER BY id;`,
        note: 'The first true branch wins. For Cy the comparisons are NULL (not true), so CASE falls through to `IS NULL`. Without that branch Cy would be `bronze`.' },
      { label: 'Simple CASE and NULL', sql: `SELECT id, status,
       CASE status WHEN 'paid' THEN 'ok' WHEN 'refunded' THEN 'money back' ELSE 'waiting' END AS label
FROM orders ORDER BY id;

SELECT CASE NULL WHEN NULL THEN 'matched' ELSE 'not matched' END AS simple_case_null,
       CASE WHEN 1 > 2 THEN 'yes' END                           AS no_else;`,
        note: 'A simple CASE compares with `=`, and `NULL = NULL` is not true, so it does **not** match. A CASE with no ELSE and no true branch returns NULL.' },
      { label: 'COALESCE, GREATEST, LEAST', sql: `SELECT id, coupon, promo,
       COALESCE(coupon, promo, 0) AS discount,
       GREATEST(coupon, promo)    AS best_offer,
       LEAST(total, 100)          AS capped_total
FROM orders ORDER BY id;`,
        note: 'COALESCE returns the first non-NULL argument. GREATEST and LEAST **ignore NULLs**, so Ann\'s best offer is 5.00, and they return NULL only when every argument is NULL. For the same reason Cy\'s `capped_total` is 100, not NULL. If unknown must stay unknown, write `CASE WHEN total IS NOT NULL THEN LEAST(total, 100) END`.' },
      { label: 'Safe division with NULLIF', sql: `SELECT id, total, qty,
       round(total / NULLIF(qty, 0), 2)                AS per_item,
       COALESCE(round(total / NULLIF(qty, 0), 2), 0)  AS per_item_or_zero
FROM orders ORDER BY id;`,
        note: 'Eve has `qty = 0`. `NULLIF(qty, 0)` returns NULL, so the division returns NULL instead of an error. Try `SELECT total / qty FROM orders;` to see the error it prevents.' },
      { label: 'FILTER: many metrics, one pass', sql: `SELECT count(*)                                     AS orders,
       count(*)   FILTER (WHERE status = 'paid')     AS paid,
       sum(total) FILTER (WHERE status = 'paid')     AS paid_revenue,
       count(*)   FILTER (WHERE total IS NULL)       AS missing_total,
       round(100.0 * count(*) FILTER (WHERE status = 'refunded') / NULLIF(count(*), 0), 1) AS refund_pct
FROM orders;`,
        note: 'Five metrics from one scan. `sum` skips Cy\'s NULL total, so paid revenue is 170.00 from three paid orders.' },
      { label: 'Booleans as columns', sql: `SELECT id, total,
       total >= 50                  AS big_order,
       status = 'paid' AND qty > 0  AS shippable,
       (status = 'paid')::int       AS paid_flag
FROM orders ORDER BY id;

SELECT sum((status = 'paid')::int) AS paid_count,
       bool_or(total IS NULL)      AS any_missing,
       coalesce(sum(total) FILTER (WHERE status = 'cancelled'), 0) AS cancelled_revenue
FROM orders;`,
        note: 'A comparison is a value of type boolean, so it can be a column. Cy\'s `big_order` is NULL, not false. A sum over zero rows is NULL; `coalesce(..., 0)` turns it into 0.' },
      { label: 'CASE needs one result type', sql: `SELECT pg_typeof(CASE WHEN qty > 0 THEN 1 ELSE 2.5 END) AS mixed_numbers
FROM orders LIMIT 1;

SELECT id, CASE WHEN total IS NULL THEN 'n/a' ELSE total::text END AS total_label
FROM orders ORDER BY id;`,
        note: '`1` and `2.5` unify to numeric. Mixing a number with a word does not: `CASE WHEN … THEN 1 ELSE \'n/a\' END` fails, so cast the number to text first.' },
    ],
  },
  production: {
    title: 'A KPI tile query that crashed on an empty day',
    context: 'An operations dashboard shows today\'s orders, paid share and refund rate. The first version ran one query per tile and computed rates with plain division.',
    problem: 'Four queries scanned the table four times, and right after midnight there were no orders: `refunded / count(*)` divided by zero and the whole dashboard showed an error.',
    solution: 'One query with **FILTER** aggregates computes every tile in a single pass. `NULLIF(count(*), 0)` makes empty days return NULL, and `COALESCE` turns that into a display value.',
    sql: `SELECT count(*)                                            AS orders,
       coalesce(sum(total) FILTER (WHERE status = 'paid'), 0) AS paid_revenue,
       coalesce(round(100.0 * count(*) FILTER (WHERE status = 'refunded')
                      / NULLIF(count(*), 0), 1), 0)           AS refund_pct
FROM orders
WHERE status <> 'cancelled';      -- on an empty result: 0, 0, 0 instead of an error`,
    outcome: 'On the playground data the query returns 5 orders, 170.00 paid revenue and a 20.0% refund rate. With a filter that matches no rows it returns 0, 0 and 0 instead of failing, and the dashboard needs one scan instead of four.',
  },
  pitfalls: [
    { title: 'CASE branches in the wrong order',
      symptom: 'Every large order is labelled "silver"; no order is ever "gold".',
      cause: 'CASE returns the **first** true branch. If `total >= 50` comes before `total >= 100`, it catches the big orders too.',
      fix: 'Order WHEN branches from most specific to least specific, and test the edge values.' },
    { title: 'CASE x WHEN NULL never matches',
      symptom: 'Rows with a NULL status fall into ELSE even though there is a `WHEN NULL` branch.',
      cause: 'A simple CASE compares with `=`, and `NULL = NULL` is NULL, not true.',
      fix: 'Use a searched CASE: `CASE WHEN status IS NULL THEN … END`.',
      sql: `SELECT CASE WHEN NULL IS NULL THEN 'matched' END;` },
    { title: 'Division by zero in a ratio',
      symptom: '`ERROR: division by zero` from a report, often only on some days or for new customers.',
      cause: 'A denominator such as `count(*)` or `qty` can be 0. Every numeric type raises an error.',
      fix: 'Divide by `NULLIF(denominator, 0)` and wrap the result in `COALESCE` if you need a number.' },
    { title: 'A constant error inside an unused CASE branch',
      symptom: 'A query fails with division by zero even though the CASE branch with `1/0` can never be chosen.',
      cause: 'CASE skips branches at run time, but the planner simplifies constant expressions first, and `1/0` fails during planning.',
      fix: 'Do not rely on CASE to hide constant errors; compute guarded values with NULLIF instead.',
      sql: 'SELECT CASE WHEN x > 0 THEN x ELSE 1/0 END FROM (VALUES (1), (2)) AS v(x);' },
  ],
  pointers: [
    'Searched **CASE** returns the first **true** branch. NULL is not true. No ELSE means NULL.',
    '**COALESCE** picks the first non-NULL argument and stops there. **NULLIF(a, b)** turns a chosen value into NULL.',
    '`x / NULLIF(y, 0)` is the standard guard against division by zero.',
    '`count(*) FILTER (WHERE …)` computes many conditional metrics in one pass. Sums over no rows are NULL. More on FILTER: [Aggregates, FILTER and GROUPING SETS](/m3/aggregates-grouping) and [Pivots and reports](/f4/pivot-reporting).',
    'Going deeper: the Internals lesson [From SQL text to rows](/m4/query-pipeline) follows a query through parsing, rewriting and planning, the stages that run before the executor evaluates CASE row by row.',
  ],
  sources: ['functions-conditional.html', 'sql-expressions.html', 'functions-aggregate.html', 'functions-comparison.html', 'typeconv-union-case.html'],
}
