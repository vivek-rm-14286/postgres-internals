import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, Tag, tone, toneBg } from '../../viz/kit'
import { Btn, Note, SqlLine } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: three number experiments. Division and the 0.1 sums are results captured from
 * PostgreSQL 18; numeric(p,s) rounding is computed with the same rule PostgreSQL uses (round half
 * away from zero, then reject if the integer digits exceed p - s), checked against it for every case.
 * ---------------------------------------------------------------------------------------------- */

type Res = string // 'ERR …' for errors
const DIV: Record<string, { int: Res; mod: Res; num: Res; flt: Res }> = {
  '7/2': { int: '3', mod: '1', num: '3.5000000000000000', flt: '3.5' },
  '7/3': { int: '2', mod: '1', num: '2.3333333333333333', flt: '2.3333333333333335' },
  '-7/2': { int: '-3', mod: '-1', num: '-3.5000000000000000', flt: '-3.5' },
  '-7/3': { int: '-2', mod: '-1', num: '-2.3333333333333333', flt: '-2.3333333333333335' },
  '1/2': { int: '0', mod: '1', num: '0.50000000000000000000', flt: '0.5' },
  '1/3': { int: '0', mod: '1', num: '0.33333333333333333333', flt: '0.3333333333333333' },
  '10/2': { int: '5', mod: '0', num: '5.0000000000000000', flt: '5' },
  '10/3': { int: '3', mod: '1', num: '3.3333333333333333', flt: '3.3333333333333335' },
}
const AS = [7, -7, 1, 10], BS = [2, 3, 0]
const PAIRS = AS.flatMap((a) => BS.map((b) => [a, b] as const))

// sum(0.1::float8) and sum(0.1::numeric) over generate_series(1, n)
const SUMS: [string, string][] = [['0.1', '0.1'], ['0.2', '0.2'], ['0.30000000000000004', '0.3'], ['0.4', '0.4'], ['0.5', '0.5'], ['0.6', '0.6'],
  ['0.7', '0.7'], ['0.7999999999999999', '0.8'], ['0.8999999999999999', '0.9'], ['0.9999999999999999', '1.0']]

/** Round a decimal string to s places (ties away from zero) and check it fits numeric(p, s). */
function fit(v: string, p: number, s: number): { v?: string; err?: boolean } {
  const neg = v.startsWith('-'); const t = neg ? v.slice(1) : v
  const [ip, fp0 = ''] = t.split('.'); const fp = fp0.padEnd(s + 1, '0')
  let digits = BigInt((ip + fp.slice(0, s)).replace(/^0+(?=\d)/, '') || '0')
  if (Number(fp[s]) >= 5) digits += 1n
  const str = digits.toString().padStart(s + 1, '0')
  const I = str.slice(0, str.length - s).replace(/^0+(?=\d)/, ''), F = str.slice(str.length - s)
  if ((I === '0' ? 0 : I.length) > p - s) return { err: true }
  return { v: (neg && !/^0*$/.test(I + F) ? '-' : '') + I + (s ? '.' + F : '') }
}
const VALUES = ['12.345', '1234.5', '99.995', '0.125', '-12.5', '7']

/* ---------- tab 1: division ---------- */
function NumberLine({ exact, int }: { exact: number; int: number }) {
  const W = 560, Y = 44, x = (v: number) => 20 + ((v + 6) / 12) * (W - 40)
  return (
    <svg viewBox={`0 0 ${W} 78`} className="w-full min-w-[320px]" role="img" aria-label="Number line showing truncation toward zero">
      <line x1={20} x2={W - 20} y1={Y} y2={Y} stroke="var(--border)" strokeWidth={2} />
      {Array.from({ length: 13 }, (_, i) => i - 6).map((v) => (
        <g key={v}><line x1={x(v)} x2={x(v)} y1={Y - 5} y2={Y + 5} stroke={v === 0 ? 'var(--text)' : 'var(--muted)'} strokeWidth={v === 0 ? 2 : 1} />
          <text x={x(v)} y={Y + 22} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily="var(--font-mono)">{v}</text></g>
      ))}
      <motion.path initial={false} animate={{ d: `M${x(exact)},${Y - 9} C${(x(exact) + x(int)) / 2},${Y - 22} ${(x(exact) + x(int)) / 2},${Y - 22} ${x(int)},${Y - 9}` }} fill="none" stroke={tone('new')} strokeWidth={1.6} strokeDasharray="4 3" />
      <motion.circle initial={false} animate={{ cx: x(exact) }} cy={Y} r={7} fill={toneBg('tuple', 50)} stroke={tone('tuple')} strokeWidth={2} />
      <motion.rect initial={false} animate={{ x: x(int) - 6 }} y={Y - 6} width={12} height={12} rx={2} fill={tone('new')} />
      <motion.text initial={false} animate={{ x: x(exact) }} y={12} textAnchor="middle" fontSize={11} fill={tone('tuple')} fontFamily="var(--font-mono)">exact {Number(exact.toFixed(2))}</motion.text>
    </svg>
  )
}

function DivisionTab() {
  const [i, setI] = useState(0)
  const [a, b] = PAIRS[i]
  const r = b === 0 ? null : DIV[`${a}/${b}`]
  const lanes: [string, string, Res | undefined][] = [
    [`${a} / ${b}`, 'integer', r?.int], [`${a} % ${b}`, 'integer', r?.mod],
    [`${a}::numeric / ${b}`, 'numeric', r?.num], [`${a}::float8 / ${b}`, 'double precision', r?.flt],
  ]
  const pick = (na: number, nb: number) => setI(PAIRS.findIndex(([x, y]) => x === na && y === nb))
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted">a =</span>
        {AS.map((v) => <Btn key={v} active={v === a} onClick={() => pick(v, b)}><span className="font-mono">{v}</span></Btn>)}
        <span className="ml-2 text-xs text-muted">b =</span>
        {BS.map((v) => <Btn key={v} active={v === b} onClick={() => pick(a, v)}><span className="font-mono">{v}</span></Btn>)}
        <Btn primary testid="viz-next" onClick={() => setI((n) => (n + 1) % PAIRS.length)}>Next pair →</Btn>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {lanes.map(([expr, type, v], k) => (
          <motion.div key={k} layout className="rounded-lg border px-3 py-2" style={{ borderColor: v === undefined ? tone('dead') : k < 2 ? tone('new') : tone('tuple'), background: toneBg(v === undefined ? 'dead' : k < 2 ? 'new' : 'tuple', 8) }}>
            <div className="flex flex-wrap items-center justify-between gap-2"><code className="font-mono text-[13px]">SELECT {expr}</code><Tag t={k < 2 ? 'new' : 'tuple'}>{type}</Tag></div>
            <motion.p key={`${expr}${v}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 font-mono text-lg font-bold break-all" style={{ color: v === undefined ? tone('dead') : 'var(--text)' }}>
              {v === undefined ? 'ERROR: division by zero' : v}
            </motion.p>
          </motion.div>
        ))}
      </div>
      {b !== 0 && <Panel title="Integer division truncates toward zero"><NumberLine exact={a / b} int={Number(r!.int)} /></Panel>}
      <Note>{b === 0
        ? 'Dividing by zero is an **error** for every numeric type, not NULL and not infinity. The usual guard is `a / NULLIF(b, 0)`, which returns NULL instead.'
        : a < 0
          ? `Exact answer ${Number((a / b).toFixed(4))}, but integer division **truncates toward zero**, giving **${r!.int}** (not ${Math.floor(a / b)}). The remainder \`%\` takes the sign of the left operand: **${r!.mod}**.`
          : `Both operands are integers, so the result is an integer: **${r!.int}**. Make either side \`numeric\` (write \`${a}.0\` or cast) and you get the fraction back.`}</Note>
    </div>
  )
}

/* ---------- tab 2: 0.1 drift ---------- */
function DriftTab() {
  const [n, setN] = useState(3)
  const [f, num] = SUMS[n - 1]
  const expected = (n / 10).toString()
  const ok = f === expected || (n === 10 && f === '1')
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-2 text-xs text-muted">n = <span className="font-mono text-ink">{n}</span>
          <input type="range" min={1} max={10} value={n} onChange={(e) => setN(+e.target.value)} className="min-w-24 flex-1 accent-[var(--accent)]" aria-label="How many times to add 0.1" />
        </label>
        <Btn primary testid="viz-next" onClick={() => setN((x) => (x % 10) + 1)}>Add another 0.1 →</Btn>
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: n }, (_, k) => (
          <motion.span key={k} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="rounded border px-1.5 py-0.5 font-mono text-[11px]" style={{ borderColor: tone('pointer'), background: toneBg('pointer', 12) }}>0.1</motion.span>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {([['double precision', f, !ok], ['numeric', num, false]] as const).map(([t, v, bad]) => (
          <div key={t} className="rounded-lg border px-3 py-2" style={{ borderColor: bad ? tone('dead') : tone('ok'), background: toneBg(bad ? 'dead' : 'ok', 8) }}>
            <div className="flex items-center justify-between gap-2"><code className="text-[12px]">sum(0.1::{t === 'numeric' ? 'numeric' : 'float8'})</code><Tag t={bad ? 'dead' : 'ok'}>{bad ? `≠ ${expected}` : `= ${expected}`}</Tag></div>
            <p className="mt-1 font-mono text-lg font-bold break-all">
              {Array.from(v).map((c, k) => <motion.span key={`${t}${n}${k}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: k * 0.02 }} style={{ color: bad && k >= 3 ? tone('dead') : undefined }}>{c}</motion.span>)}
            </p>
          </div>
        ))}
      </div>
      <Note>{ok
        ? `At n = ${n} the binary errors happen to cancel out, so the float sum prints as ${f}. Keep adding: they come back.`
        : '`0.1` has no exact binary form. The nearest **double** is `0.1000000000000000055511151231257827…`, and each addition rounds again. **numeric** stores decimal digits, so it stays exact.'}</Note>
    </div>
  )
}

/* ---------- tab 3: numeric(p, s) ---------- */
function Stepper2({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-1 py-0.5 text-xs">
      <span className="px-1 text-muted">{label}</span>
      <button type="button" className="px-1.5 text-muted hover:text-ink disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`decrease ${label}`}>−</button>
      <span className="w-4 text-center font-mono font-bold">{value}</span>
      <button type="button" className="px-1.5 text-muted hover:text-ink disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`increase ${label}`}>+</button>
    </div>
  )
}

function PrecisionTab() {
  const [vi, setVi] = useState(0)
  const [p, setP] = useState(5)
  const [s, setS] = useState(2)
  const v = VALUES[vi]
  const r = fit(v, p, s)
  const neg = v.startsWith('-')
  const [ip, fp = ''] = (neg ? v.slice(1) : v).split('.')
  const rv = r.v ? (r.v.startsWith('-') ? r.v.slice(1) : r.v) : ''
  const [rip, rfp = ''] = rv.split('.')
  const L = Math.max(ip.length, p - s, 1), R = Math.max(fp.length, s)
  const cols = [...Array.from({ length: L }, (_, k) => -(L - k)), ...Array.from({ length: R }, (_, k) => k + 1)]
  const digitAt = (I: string, F: string, c: number) => (c < 0 ? I[I.length + c] : F[c - 1])
  const allowed = (c: number) => (c < 0 ? -c <= p - s : c <= s)
  const cell = 'flex h-8 w-7 shrink-0 items-center justify-center rounded font-mono text-[15px]'
  const row = (label: string, render: (c: number) => ReactNode, dot = true) => (
    <div className="flex items-center gap-1"><span className="w-14 shrink-0 text-[11px] text-muted">{label}</span>
      {cols.map((c, k) => <div key={k} className="flex items-center">{c === 1 && <span className="w-2 text-center font-mono font-bold">{dot ? '.' : ''}</span>}{render(c)}</div>)}
      {cols[cols.length - 1] < 1 && <span className="w-2" />}
    </div>
  )
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {VALUES.map((x, k) => <Btn key={x} active={k === vi} onClick={() => setVi(k)}><span className="font-mono">{x}</span></Btn>)}
        <Stepper2 label="precision p" value={p} min={1} max={8} onChange={(n) => { setP(n); if (s > n) setS(n) }} />
        <Stepper2 label="scale s" value={s} min={0} max={Math.min(p, 4)} onChange={setS} />
        <Btn primary testid="viz-next" onClick={() => setVi((k) => (k + 1) % VALUES.length)}>Next value →</Btn>
      </div>
      <SqlLine sql={`SELECT ${neg ? `(${v})` : v}::numeric(${p},${s});`} result={r.v} error={r.err ? 'numeric field overflow' : undefined} />
      <Panel title={`numeric(${p},${s}): ${p - s} digit${p - s === 1 ? '' : 's'} before the point, ${s} after`}>
        <div className="grid gap-1 overflow-x-auto scrollbar-thin">
          {row('slots', (c) => <div className={cell} style={{ border: `1.5px dashed ${allowed(c) ? tone('pointer') : 'var(--border)'}`, background: allowed(c) ? toneBg('pointer', 10) : 'transparent' }} />)}
          {row('input', (c) => {
            const d = digitAt(ip, fp, c)
            const over = d !== undefined && c < 0 && !allowed(c)
            const cut = d !== undefined && c > 0 && !allowed(c)
            return <motion.div layout className={cell} style={{ color: over ? tone('dead') : cut ? 'var(--muted)' : 'var(--text)', background: over ? toneBg('dead', 20) : 'transparent', textDecoration: cut ? 'line-through' : undefined }}>{d ?? ''}</motion.div>
          })}
          {row('stored', (c) => {
            const d = r.v ? digitAt(rip, rfp, c) : undefined
            const changed = d !== undefined && d !== (digitAt(ip, fp, c) ?? '0')
            return <motion.div key={`${v}${p}${s}${c}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={cell}
              style={{ fontWeight: 700, color: changed ? tone('new') : tone('ok'), background: d !== undefined ? toneBg(changed ? 'new' : 'ok', 14) : 'transparent' }}>{d ?? ''}</motion.div>
          }, !r.err && s > 0)}
        </div>
        {neg && <p className="mt-1 text-[11px] text-muted">The sign is stored separately and does not use a digit slot.</p>}
      </Panel>
      <Note>{r.err
        ? `The value needs more than **${p - s}** digit${p - s === 1 ? '' : 's'} before the decimal point (red), so PostgreSQL raises **numeric field overflow** instead of storing a wrong number. Raise p or lower s.`
        : fp.length > s
          ? `Extra decimals (struck through) are **rounded**, ties away from zero, to ${s} place${s === 1 ? '' : 's'}: **${r.v}**. Changed digits are orange.`
          : `It fits. Missing decimals are padded with zeros, so the value always shows exactly ${s} decimal place${s === 1 ? '' : 's'}.`}</Note>
    </div>
  )
}

type TabId = 'div' | 'drift' | 'prec'
function NumbersViz() {
  const [tab, setTab] = useState<TabId>('div')
  return (
    <div className="grid gap-3">
      <div><Segmented label="Experiment" value={tab} onChange={setTab} options={[['div', 'Division'], ['drift', '0.1 + 0.1 + …'], ['prec', 'numeric(p, s)']]} /></div>
      {tab === 'div' ? <DivisionTab /> : tab === 'drift' ? <DriftTab /> : <PrecisionTab />}
      <Legend items={tab === 'div' ? [['new', 'integer result'], ['tuple', 'numeric / double precision'], ['dead', 'error']]
        : tab === 'drift' ? [['ok', 'exact'], ['dead', 'binary rounding error'], ['pointer', 'one 0.1 added']]
          : [['pointer', 'digit slot allowed by (p, s)'], ['ok', 'stored digit'], ['new', 'changed by rounding'], ['dead', 'does not fit: overflow']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'numbers-and-math',
  module: 'f2',
  order: 2,
  title: 'Numbers and arithmetic',
  tldr: [
    'PostgreSQL has three families of number types: **integers** (whole numbers), **numeric** (exact decimals) and **floating point** (fast binary approximations).',
    'The type decides what arithmetic means, so `7 / 2` is 3, `0.1 + 0.2` may not equal 0.3, and picking the right type keeps money and ratios correct.',
  ],
  visualizer: {
    title: 'Three number experiments',
    caption: 'Divide integers and watch the fraction vanish, add 0.1 ten times in binary and in decimal, then squeeze values into a **numeric(p, s)** column.',
    Component: NumbersViz,
  },
  playground: {
    setup: `
CREATE TABLE line_items (
  id           int PRIMARY KEY,
  order_id     int,
  product      text,
  price        numeric(10,2),   -- exact money
  qty          int,
  weight_kg    real,            -- approximate measurement
  discount_pct int
);
INSERT INTO line_items VALUES
  (1, 100, 'coffee beans',  12.99, 3, 0.25, 10),
  (2, 100, 'grinder',       49.95, 1, 1.4,   0),
  (3, 101, 'filter papers',  3.10, 7, 0.1,  15),
  (4, 101, 'mug',            8.50, 2, 0.35,  0),
  (5, 102, 'kettle',        34.00, 1, 1.2,   5);`,
    presets: [
      { label: 'Integer division', sql: `SELECT 7 / 2 AS int_div, -7 / 2 AS neg_div, 7 % 3 AS remainder, -7 % 3 AS neg_remainder,
       7.0 / 2 AS numeric_div, 7 / 2::float8 AS float_div;

SELECT product, qty, qty / 2 AS full_pairs, qty % 2 AS leftover
FROM line_items ORDER BY id;`,
        note: '`7 / 2` is **3** and `-7 / 2` is **-3**: integer division truncates toward zero. One decimal operand (`7.0`) switches to numeric division.' },
      { label: 'What type is this?', sql: `SELECT pg_typeof(42)          AS "42",
       pg_typeof(3000000000)  AS "3000000000",
       pg_typeof(4.2)         AS "4.2",
       pg_typeof(1e3)         AS "1e3",
       pg_typeof(42 + 4.2)    AS "42 + 4.2",
       pg_typeof(42::float8 + 4.2) AS "float8 + 4.2";

SELECT pg_typeof(sum(qty)) AS sum_int, pg_typeof(avg(qty)) AS avg_int, pg_typeof(sum(price)) AS sum_numeric
FROM line_items;`,
        note: 'A whole-number literal is `integer` (or `bigint` if it is too big), and any literal with a point or exponent is `numeric`. Mixing types promotes to the "wider" one.' },
      { label: 'Float vs numeric', sql: `SELECT 0.1 + 0.2                        AS numeric_sum,
       0.1::float8 + 0.2::float8          AS float_sum,
       (0.1::float8 + 0.2::float8) = 0.3  AS float_equals;

SELECT sum(0.1::float8) AS float_sum_of_10, sum(0.1) AS numeric_sum_of_10
FROM generate_series(1, 10);

SELECT sum(weight_kg) AS real_sum, sum(weight_kg::float8) AS widened, sum(weight_kg::numeric) AS as_numeric
FROM line_items;`,
        note: 'Floats are binary, so `0.1 + 0.2` is `0.30000000000000004` and ten 0.1s make `0.9999999999999999`. A `real` keeps about 6 digits: widening its sum shows `3.3000000193715096`.' },
      { label: 'Rounding family', sql: `SELECT x, round(x) AS round, trunc(x) AS trunc, ceil(x) AS ceil, floor(x) AS floor
FROM (VALUES (2.5), (-2.5), (2.4), (-2.7)) AS v(x);

SELECT round(2.5)          AS numeric_round,
       round(2.5::float8)  AS float_round,
       round(1234.5678, 2) AS two_places,
       round(1234.5678, -2) AS hundreds;`,
        note: '`round(2.5)` on numeric is **3** (ties away from zero), but on double precision it is **2** (ties to even). `trunc` cuts toward zero; `floor` always goes down.' },
      { label: 'numeric(p, s) limits', sql: `SELECT 12.345::numeric(5,2) AS rounded, 7::numeric(5,2) AS padded, 0.125::numeric(5,2) AS tie;

SELECT * FROM pg_input_error_info('1234.5', 'numeric(5,2)');
SELECT * FROM pg_input_error_info('2147483648', 'integer');`,
        note: 'Extra decimals are rounded, but too many digits before the point is an **error** (`numeric field overflow`). Try `SELECT 2147483647 + 1;` yourself: integers never wrap around silently.' },
      { label: 'Money math', sql: `SELECT product, price * qty AS gross,
       round(price * qty * (100 - discount_pct) / 100, 2) AS net,
       price * qty * (discount_pct / 100)                 AS discount_wrong
FROM line_items ORDER BY id;

SELECT order_id, sum(qty) AS items, count(*) AS lines,
       sum(qty) / count(*)                       AS avg_truncated,
       round(sum(qty)::numeric / count(*), 2)    AS avg_exact,
       round(100.0 * sum(price * qty) / (SELECT sum(price * qty) FROM line_items), 1) AS pct_of_revenue
FROM line_items GROUP BY order_id ORDER BY order_id;`,
        note: '`discount_pct / 100` is integer division, so it is 0 for every row and `discount_wrong` is always 0.00. Multiply first or use `100.0`. Order 101 averages 4.5 items, not 4.' },
      { label: 'Random numbers', sql: `SELECT setseed(0.42);
SELECT random() AS between_0_and_1, random(1, 6) AS dice_roll;

SELECT g AS roll, random(1, 6) AS value FROM generate_series(1, 5) AS g;`,
        note: '`random()` returns a double in [0, 1). `random(1, 6)` includes both ends. After `setseed` the sequence repeats, which helps tests. It is not secure: use `gen_random_uuid()` or pgcrypto for tokens.' },
    ],
  },
  production: {
    title: 'An invoice that is off by one cent',
    context: 'A billing team prints invoices with a tax line for each item, then charges the card for the order total. Prices are already `numeric(10,2)`.',
    problem: 'The invoice shows each line rounded to cents, but the charge rounds only the final sum. With five lines at 8.25% tax the two disagree, and customers spot the difference.',
    solution: 'Decide where rounding happens and do it once per line, in `numeric`, then sum the rounded lines. Never use `float8` for money: it adds binary error on top of the rounding question.',
    sql: `SELECT sum(round(price * qty * 1.0825, 2))  AS sum_of_rounded_lines,
       round(sum(price * qty * 1.0825), 2)  AS rounded_total,
       sum(price::float8 * qty * 1.0825)    AS float_total
FROM line_items;`,
    outcome: 'On the playground data the printed lines add up to **174.96** while the rounded total is **174.95**, and the float total is `174.95365`. Charging `sum_of_rounded_lines` makes the invoice and the card charge match exactly.',
  },
  pitfalls: [
    { title: 'Ratios that are always zero',
      symptom: 'A conversion rate or percentage column shows 0 for every row, or whole numbers only.',
      cause: 'Both sides are integers (`count(*)`, `int` columns), so `/` truncates: `3 / 7` is 0.',
      fix: 'Make one side numeric before dividing: `100.0 * a / b` or `a::numeric / b`, then `round(..., 1)`.',
      sql: `SELECT 3 / 7 AS wrong, round(100.0 * 3 / 7, 1) AS pct;` },
    { title: 'Storing money in float',
      symptom: 'Totals end in `…99999999` or reports disagree by a cent with the accounting system.',
      cause: 'Binary floating point cannot represent most decimal fractions exactly, and every operation rounds again.',
      fix: 'Use `numeric(12,2)` (or integer cents) for money. Keep `real`/`double precision` for measurements where tiny errors do not matter.' },
    { title: 'Integer overflow on a growing counter',
      symptom: '`ERROR: integer out of range` from a multiplication or addition on `integer` values once the numbers grow.',
      cause: '`integer` stops at 2,147,483,647. PostgreSQL raises an error rather than wrapping around.',
      fix: 'Use `bigint` for ids and large counters. Cast before multiplying big values: `a::bigint * b`.',
      sql: `SELECT 2147483647::bigint + 1 AS fits_in_bigint;` },
    { title: 'Comparing floats with =',
      symptom: '`WHERE weight = 0.1` finds nothing even though the value was inserted as 0.1.',
      cause: 'A `real` column holds the nearest float4 to 0.1, while the literal 0.1 becomes numeric and is compared as a double: they differ in the last bits.',
      fix: 'Compare with a tolerance (`abs(weight - 0.1) < 1e-6`) or store the value as `numeric` if exact equality matters.' },
  ],
  pointers: [
    '**integer / integer** truncates toward zero. Add a decimal point or cast to get fractions.',
    '**numeric** is exact and right for money. **real**/**double precision** are fast binary approximations.',
    '`numeric(p, s)` rounds extra decimals but **errors** when the integer part is too long. Integer overflow is also an error.',
    '`round` on numeric rounds ties away from zero; on double precision it usually rounds ties to even (the exact rule depends on the platform).',
    'Going deeper: the Internals lesson [Primitive types, alignment and padding](/m2/primitive-types) shows how many bytes each number type takes on disk.',
  ],
  sources: ['datatype-numeric.html', 'functions-math.html', 'typeconv-oper.html', 'functions-aggregate.html', 'datatype-money.html'],
}
