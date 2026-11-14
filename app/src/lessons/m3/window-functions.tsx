import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Sql } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a window-frame explorer over the 11-product table (three products tie at 700, two at 200).
 * The frame is computed exactly as PostgreSQL defines it: ROWS counts rows, RANGE compares the ORDER BY
 * value (peers move together), GROUPS counts peer groups; EXCLUDE then removes the current row and/or
 * its peers. Results were cross-checked against PostgreSQL 18 (PGlite); peers are shown in product_id
 * order, which PostgreSQL does not guarantee.
 * ---------------------------------------------------------------------------------------------- */

interface Prod { id: number; name: string; price: number; group: string }
const PRODUCTS: Prod[] = [
  { id: 1, name: 'Microsoft Lumia', price: 200, group: 'Smartphone' }, { id: 2, name: 'HTC One', price: 400, group: 'Smartphone' },
  { id: 3, name: 'Nexus', price: 500, group: 'Smartphone' }, { id: 4, name: 'iPhone', price: 900, group: 'Smartphone' },
  { id: 5, name: 'HP Elite', price: 1200, group: 'Laptop' }, { id: 6, name: 'Lenovo Thinkpad', price: 700, group: 'Laptop' },
  { id: 7, name: 'Sony VAIO', price: 700, group: 'Laptop' }, { id: 8, name: 'Dell Vostro', price: 800, group: 'Laptop' },
  { id: 9, name: 'iPad', price: 700, group: 'Tablet' }, { id: 10, name: 'Kindle Fire', price: 150, group: 'Tablet' },
  { id: 11, name: 'Samsung Galaxy Tab', price: 200, group: 'Tablet' },
]
const GROUP_ORDER = ['Smartphone', 'Laptop', 'Tablet']

type FMode = 'ROWS' | 'RANGE' | 'GROUPS'
type Bound = 'UP' | 'NP' | 'CR' | 'NF' | 'UF'
type Excl = 'none' | 'current' | 'group' | 'ties'
const BOUND_RANK: Record<Bound, number> = { UP: 0, NP: 1, CR: 2, NF: 3, UF: 4 }
interface Spec { part: boolean; mode: FMode; start: Bound; end: Bound; n: number; excl: Excl }

function boundSql(b: Bound, n: number) {
  return { UP: 'UNBOUNDED PRECEDING', NP: `${n} PRECEDING`, CR: 'CURRENT ROW', NF: `${n} FOLLOWING`, UF: 'UNBOUNDED FOLLOWING' }[b]
}
function validate(s: Spec): string | null {
  if (s.start === 'UF') return 'frame start cannot be UNBOUNDED FOLLOWING'
  if (s.end === 'UP') return 'frame end cannot be UNBOUNDED PRECEDING'
  if (s.start === 'CR' && s.end === 'NP') return 'frame starting from current row cannot have preceding rows'
  if (s.start === 'NF' && BOUND_RANK[s.end] <= BOUND_RANK.CR) return 'frame starting from following row cannot have preceding rows'
  return null
}

/** Rows in output order: partitions (if any), then price, then product_id for peers. */
function ordered(part: boolean) {
  return [...PRODUCTS].sort((a, b) => (part ? GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) : 0) || a.price - b.price || a.id - b.id)
}

/** Frame for row i, as indices into the partition: raw bounds before EXCLUDE, and the rows that remain. */
function frameOf(P: Prod[], i: number, s: Spec): { lo: number; hi: number; rows: number[] } {
  const n = P.length, v = P[i].price
  const groups: number[] = []; let g = -1
  P.forEach((p, k) => { if (k === 0 || p.price !== P[k - 1].price) g++; groups.push(g) })
  const gi = groups[i]
  const firstOfGroup = (G: number) => groups.indexOf(G)
  const lastOfGroup = (G: number) => groups.lastIndexOf(G)
  let lo = 0, hi = n - 1
  const N = s.n
  if (s.mode === 'ROWS') {
    lo = { UP: 0, NP: i - N, CR: i, NF: i + N, UF: n }[s.start]
    hi = { UP: -1, NP: i - N, CR: i, NF: i + N, UF: n - 1 }[s.end]
  } else if (s.mode === 'RANGE') {
    const firstGE = (x: number) => { const k = P.findIndex((p) => p.price >= x); return k === -1 ? n : k }
    const lastLE = (x: number) => { let k = -1; P.forEach((p, j) => { if (p.price <= x) k = j }); return k }
    lo = { UP: 0, NP: firstGE(v - N), CR: firstOfGroup(gi), NF: firstGE(v + N), UF: n }[s.start]
    hi = { UP: -1, NP: lastLE(v - N), CR: lastOfGroup(gi), NF: lastLE(v + N), UF: n - 1 }[s.end]
  } else {
    const maxG = groups[n - 1]
    const startG = (G: number) => (G < 0 ? 0 : G > maxG ? n : firstOfGroup(G))
    const endG = (G: number) => (G > maxG ? n - 1 : G < 0 ? -1 : lastOfGroup(G))
    lo = { UP: 0, NP: startG(gi - N), CR: firstOfGroup(gi), NF: startG(gi + N), UF: n }[s.start]
    hi = { UP: -1, NP: endG(gi - N), CR: lastOfGroup(gi), NF: endG(gi + N), UF: n - 1 }[s.end]
  }
  lo = Math.max(0, lo); hi = Math.min(n - 1, hi)
  const out: number[] = []
  for (let k = lo; k <= hi; k++) {
    const peer = groups[k] === gi
    if (s.excl === 'current' && k === i) continue
    if (s.excl === 'group' && peer) continue
    if (s.excl === 'ties' && peer && k !== i) continue
    out.push(k)
  }
  return { lo, hi, rows: out }
}

interface RowCalc { p: Prod; idx: number; partStart: number; part: Prod[]; frame: number[]; lo: number; hi: number; rn: number; rank: number; dense: number; sum: number | null }
function compute(s: Spec): RowCalc[] {
  const rows = ordered(s.part)
  const out: RowCalc[] = []
  const parts = s.part ? GROUP_ORDER.map((g) => rows.filter((r) => r.group === g)) : [rows]
  let offset = 0
  for (const P of parts) {
    let rank = 1, dense = 0
    P.forEach((p, i) => {
      if (i === 0 || p.price !== P[i - 1].price) { rank = i + 1; dense++ }
      const f = validate(s) ? { lo: 0, hi: -1, rows: [] } : frameOf(P, i, s)
      const frame = f.rows
      out.push({ p, idx: offset + i, partStart: offset, part: P, frame, lo: f.lo, hi: f.hi, rn: i + 1, rank, dense, sum: frame.length ? frame.reduce((a, k) => a + P[k].price, 0) : null })
    })
    offset += P.length
  }
  return out
}

const PRESETS: { label: string; spec: Omit<Spec, 'part'>; note: string }[] = [
  { label: 'Default frame', spec: { mode: 'RANGE', start: 'UP', end: 'CR', n: 1, excl: 'none' }, note: 'With ORDER BY and no frame clause you get `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`: the frame ends at the current row\'s **last peer**, so tied rows share one running total.' },
  { label: 'Running total', spec: { mode: 'ROWS', start: 'UP', end: 'CR', n: 1, excl: 'none' }, note: '`ROWS` stops at the current row itself, so tied rows get different running totals (in an order PostgreSQL does not guarantee).' },
  { label: 'Whole partition', spec: { mode: 'ROWS', start: 'UP', end: 'UF', n: 1, excl: 'none' }, note: 'The fix for `last_value`: every row sees the whole partition, so `last_value` really is the last row.' },
  { label: '±1 row', spec: { mode: 'ROWS', start: 'NP', end: 'NF', n: 1, excl: 'none' }, note: 'A three-row moving window. It counts **rows**, not days or prices: gaps in the data are invisible to it.' },
  { label: 'Price ±100', spec: { mode: 'RANGE', start: 'NP', end: 'NF', n: 100, excl: 'none' }, note: '`RANGE` with an offset compares **values**: every row priced within 100 of the current price. It needs exactly one ORDER BY column.' },
  { label: 'Neighbour groups', spec: { mode: 'GROUPS', start: 'NP', end: 'NF', n: 1, excl: 'ties' }, note: '`GROUPS` counts **peer groups**: the previous price, this price and the next. `EXCLUDE TIES` removes the other rows at this price but keeps the current one.' },
]

function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: [T, string][]; label: string }) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted">{label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="rounded-md border border-line bg-surface px-1.5 py-1 font-mono text-[12px] text-ink">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}

const ROW_H = 30

function WindowViz() {
  const [spec, setSpec] = useState<Spec>({ part: false, ...PRESETS[0].spec })
  const [cur, setCur] = useState(6) // Sony VAIO, the middle of the 700 tie
  const [note, setNote] = useState(PRESETS[0].note)
  const rows = useMemo(() => compute(spec), [spec])
  const err = validate(spec)
  const c = rows[Math.min(cur, rows.length - 1)]
  const inFrame = new Set(c.frame.map((k) => c.partStart + k))
  const peers = new Set(c.part.map((p, k) => (p.price === c.p.price ? c.partStart + k : -1)).filter((k) => k >= 0))
  const lo = c.lo <= c.hi ? c.lo + c.partStart : -1
  const hi = c.lo <= c.hi ? c.hi + c.partStart : -1
  const set = (patch: Partial<Spec>) => { setSpec((s) => ({ ...s, ...patch })); setNote('') }
  const unit = spec.mode === 'RANGE' ? 50 : 1
  const maxN = spec.mode === 'RANGE' ? 500 : 4
  const frameSql = `${spec.mode} BETWEEN ${boundSql(spec.start, spec.n)} AND ${boundSql(spec.end, spec.n)}${spec.excl === 'none' ? '' : ` EXCLUDE ${{ current: 'CURRENT ROW', group: 'GROUP', ties: 'TIES' }[spec.excl]}`}`
  const sql = `SELECT product_name, price,\n       sum(price)        OVER w,\n       first_value(product_name) OVER w,\n       last_value(product_name)  OVER w\nFROM products\nWINDOW w AS (${spec.part ? 'PARTITION BY group_id ' : ''}ORDER BY price\n             ${frameSql});`
  const names = c.frame.map((k) => c.part[k].name)

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => { setSpec((s) => ({ ...s, ...p.spec })); setNote(p.note) }}
            className="rounded-md border border-line px-2 py-1 text-xs hover:border-accent">{p.label}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line bg-surface-2 px-3 py-2">
        <Segmented label="Partition" value={spec.part ? 'y' : 'n'} onChange={(v) => { set({ part: v === 'y' }) }} options={[['n', 'no PARTITION BY'], ['y', 'PARTITION BY group']]} />
        <Segmented label="Frame mode" value={spec.mode} onChange={(m) => set({ mode: m, n: m === 'RANGE' ? 100 : 1 })} options={[['ROWS', 'ROWS'], ['RANGE', 'RANGE'], ['GROUPS', 'GROUPS']]} />
        <Select label="start" value={spec.start} onChange={(v) => set({ start: v })} options={[['UP', 'UNBOUNDED PRECEDING'], ['NP', 'n PRECEDING'], ['CR', 'CURRENT ROW'], ['NF', 'n FOLLOWING'], ['UF', 'UNBOUNDED FOLLOWING']]} />
        <Select label="end" value={spec.end} onChange={(v) => set({ end: v })} options={[['UP', 'UNBOUNDED PRECEDING'], ['NP', 'n PRECEDING'], ['CR', 'CURRENT ROW'], ['NF', 'n FOLLOWING'], ['UF', 'UNBOUNDED FOLLOWING']]} />
        <label className="inline-flex items-center gap-1.5 text-xs text-muted">n = <b className="w-9 font-mono text-ink">{spec.n}</b>
          <input type="range" min={unit === 1 ? 0 : 0} max={maxN} step={unit} value={spec.n} onChange={(e) => set({ n: +e.target.value })} className="w-24 accent-[var(--accent)]" aria-label="Frame offset" />
        </label>
        <Select label="exclude" value={spec.excl} onChange={(v) => set({ excl: v })} options={[['none', 'NO OTHERS'], ['current', 'CURRENT ROW'], ['group', 'GROUP'], ['ties', 'TIES']]} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => { setCur((k) => (k + 1) % rows.length); setNote('') }}>Next row ↓</Btn>
        <Btn onClick={() => { setCur((k) => (k - 1 + rows.length) % rows.length); setNote('') }}>Previous row ↑</Btn>
        <span className="text-xs text-muted">or click any row to make it the current row</span>
      </div>
      <div className="min-h-[44px] rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p key={`${note}-${err}-${cur}-${JSON.stringify(spec)}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {err ? <span style={{ color: 'var(--t-dead)' }} className="font-mono text-[12px]">ERROR: {err}</span>
              : <Md>{note || `Frame of **${c.p.name}** (${c.p.price}): ${names.length ? `${names.length} row${names.length > 1 ? 's' : ''}` : 'empty, so sum() is NULL'}.${spec.mode !== 'ROWS' && peers.size > 1 ? ` It has ${peers.size - 1} peer${peers.size > 2 ? 's' : ''} at the same price; ${spec.mode} treats peers alike.` : ''}`}</Md>}
          </motion.p>
        </AnimatePresence>
      </div>
      <Legend items={[['accent', 'current row'], ['ok', 'in the frame'], ['header', 'peer (same price)'], ['dead', 'removed by EXCLUDE']]} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-[1.2fr_0.6fr_0.4fr_0.4fr_0.45fr_0.7fr] gap-x-2 border-b border-line px-3 py-1.5 font-mono text-[11px] font-semibold text-muted">
              <span>product_name{spec.part ? ' / group' : ''}</span><span className="text-right">price</span><span className="text-right">row_n</span><span className="text-right">rank</span><span className="text-right">dense</span><span className="text-right">sum OVER w</span>
            </div>
            <div className="relative">
              {lo >= 0 && !err && (
                <motion.div className="pointer-events-none absolute left-0 w-1.5 rounded-r" initial={false}
                  animate={{ top: lo * ROW_H + 3, height: (hi - lo + 1) * ROW_H - 6 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} style={{ background: tone('ok') }} />
              )}
              {rows.map((r) => {
                const isCur = r.idx === c.idx
                const fr = inFrame.has(r.idx)
                const excluded = !fr && r.idx >= lo && r.idx <= hi && r.partStart === c.partStart
                const other = r.partStart !== c.partStart
                const isPeer = peers.has(r.idx) && !isCur
                const newPart = spec.part && r.idx === r.partStart && r.idx > 0
                return (
                  <motion.button type="button" layout key={r.p.id} onClick={() => { setCur(r.idx); setNote('') }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="grid w-full grid-cols-[1.2fr_0.6fr_0.4fr_0.4fr_0.45fr_0.7fr] items-center gap-x-2 px-3 text-left font-mono text-[12px]"
                    style={{
                      height: ROW_H, opacity: other ? 0.4 : 1,
                      borderTop: newPart ? '2px solid var(--border)' : '0px solid transparent',
                      background: isCur ? toneBg('accent', 22) : excluded ? toneBg('dead', 14) : fr ? toneBg('ok', 14) : 'transparent',
                      boxShadow: isCur ? `inset 0 0 0 1.5px ${tone('accent')}` : 'inset 0 0 0 0px transparent',
                    }}>
                    <span className="truncate">{isPeer && <span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: tone('header') }} />}{r.p.name}{spec.part && r.idx === r.partStart ? <span className="ml-1.5 text-[10.5px] text-muted">{r.p.group}</span> : ''}</span>
                    <span className="text-right">{r.p.price}</span>
                    <span className="text-right text-muted">{r.rn}</span>
                    <span className="text-right text-muted">{r.rank}</span>
                    <span className="text-right text-muted">{r.dense}</span>
                    <span className="text-right font-semibold">{err ? '—' : r.sum ?? <span className="text-muted italic">NULL</span>}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="grid content-start gap-2">
          <Panel title={`window functions for ${c.p.name}`}>
            <table className="w-full font-mono text-[12px]"><tbody>
              {([
                ['count(*)', err ? '—' : c.frame.length],
                ['sum(price)', err ? '—' : c.sum ?? 'NULL'],
                ['avg(price)', err || !c.frame.length ? (err ? '—' : 'NULL') : (c.sum! / c.frame.length).toFixed(2)],
                ['first_value(name)', err ? '—' : c.frame.length ? c.part[c.frame[0]].name : 'NULL'],
                ['last_value(name)', err ? '—' : c.frame.length ? c.part[c.frame[c.frame.length - 1]].name : 'NULL'],
                ['nth_value(name, 2)', err ? '—' : c.frame.length > 1 ? c.part[c.frame[1]].name : 'NULL'],
                ['rank / dense_rank', `${c.rank} / ${c.dense}`],
              ] as [string, string | number][]).map(([k, v]) => (
                <tr key={k} className="border-b border-line last:border-0"><td className="py-1 pr-2 whitespace-nowrap text-muted">{k}</td>
                  <td className="py-1 text-right font-semibold whitespace-nowrap"><motion.span key={String(v)} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }}>{v}</motion.span></td></tr>
              ))}
            </tbody></table>
            <p className="mt-2 text-xs text-muted">Ranking functions ignore the frame: they depend only on PARTITION BY and ORDER BY.</p>
          </Panel>
        </div>
        <Sql className="text-[11.5px] lg:col-span-2">{sql}</Sql>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'window-functions',
  module: 'm3',
  order: 6,
  title: 'Window functions and frames',
  tldr: [
    'A **window function** computes a value for every row from a set of related rows (its partition, and for aggregates and value functions a **frame** inside it), without collapsing rows the way GROUP BY does.',
    'It answers "compared with its neighbours" questions in one pass: rankings, running totals, moving averages, previous-row deltas and top-N per group, where a self-join or correlated subquery would be slower and harder to read.',
  ],
  visualizer: {
    title: 'The window frame explorer',
    caption: 'Click a row to make it current, then change mode, bounds, offset and EXCLUDE. Start with **Default frame** on Sony VAIO (a three-way tie at 700), then compare **Running total**.',
    Component: WindowViz,
  },
  playground: {
    setup: `
CREATE TABLE product_groups (group_id int PRIMARY KEY, group_name text NOT NULL);
CREATE TABLE products (
  product_id int PRIMARY KEY, product_name text NOT NULL,
  price numeric(11,2) NOT NULL, group_id int NOT NULL REFERENCES product_groups);
INSERT INTO product_groups VALUES (1, 'Smartphone'), (2, 'Laptop'), (3, 'Tablet');
INSERT INTO products VALUES
  (1, 'Microsoft Lumia', 200, 1), (2, 'HTC One', 400, 1), (3, 'Nexus', 500, 1), (4, 'iPhone', 900, 1),
  (5, 'HP Elite', 1200, 2), (6, 'Lenovo Thinkpad', 700, 2), (7, 'Sony VAIO', 700, 2), (8, 'Dell Vostro', 800, 2),
  (9, 'iPad', 700, 3), (10, 'Kindle Fire', 150, 3), (11, 'Samsung Galaxy Tab', 200, 3);
CREATE TABLE sales (year int, group_id int, amount numeric(10,2), PRIMARY KEY (year, group_id));
INSERT INTO sales VALUES (2018,1,1474),(2018,2,1787),(2018,3,1760),(2019,1,1915),(2019,2,1911),
  (2019,3,1118),(2020,1,1646),(2020,2,1975),(2020,3,1516);
CREATE TABLE musicians (band text NOT NULL, name text NOT NULL, earnings numeric(10,2) NOT NULL);
INSERT INTO musicians VALUES ('PPM','Paul',2.2), ('PPM','Peter',4.5), ('PPM','Mary',1.1),
  ('CSNY','Crosby',4.2), ('CSNY','Stills',6.3), ('CSNY','Nash',0.3), ('CSNY','Young',2.2);
CREATE TABLE sensor_readings (sensor_id int NOT NULL, ts timestamp NOT NULL, temperature numeric(5,2));
INSERT INTO sensor_readings VALUES (1,'2025-01-01 08:00',22.5), (1,'2025-01-01 09:00',NULL),
  (1,'2025-01-01 10:00',NULL), (1,'2025-01-01 11:00',23.1), (1,'2025-01-01 12:00',NULL), (1,'2025-01-01 13:00',24.0);`,
    presets: [
      { label: 'Rows stay, unlike GROUP BY', sql: `SELECT group_name, round(avg(price), 2) AS avg_price
FROM products JOIN product_groups USING (group_id)
GROUP BY group_name ORDER BY group_name;

SELECT product_name, group_name, price,
       round(avg(price) OVER (PARTITION BY group_name), 2) AS group_avg
FROM products JOIN product_groups USING (group_id)
ORDER BY group_name, price;`,
        note: 'GROUP BY returns 3 rows. The window version returns all 11, each with its group\'s average attached (Laptop 850, Smartphone 500, Tablet 350).' },
      { label: 'Ranking with ties', sql: `SELECT product_name, price,
       row_number() OVER w, rank() OVER w, dense_rank() OVER w,
       round((percent_rank() OVER w)::numeric, 2) AS pct_rank,
       round((cume_dist() OVER w)::numeric, 2) AS cume_dist,
       ntile(3) OVER w
FROM products JOIN product_groups USING (group_id)
WHERE group_name = 'Laptop'
WINDOW w AS (ORDER BY price);`,
        note: 'Lenovo and Sony tie at 700: row_number 1,2 (arbitrary order), rank 1,1,3,4 (gap), dense_rank 1,1,2,3 (no gap). `percent_rank` = (rank − 1) / (rows − 1), so the first row is always 0. `cume_dist` = rows up to the last peer / rows: 0.5 for both 700s. `ntile(3)` over 4 rows makes buckets of 2, 1, 1: bigger buckets come first.' },
      { label: 'The default frame trap', sql: `SELECT product_name, price,
       sum(price) OVER (ORDER BY price) AS range_default,
       sum(price) OVER (ORDER BY price ROWS UNBOUNDED PRECEDING) AS rows_running,
       last_value(product_name) OVER (ORDER BY price) AS last_default,
       last_value(product_name) OVER (ORDER BY price
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_whole
FROM products ORDER BY price, product_id;`,
        note: 'All three 700 rows show `range_default` = 3550 (peers share the frame end), while `rows_running` differs across them, in an order PostgreSQL does not guarantee. `last_default` is just the current row\'s last peer; `last_whole` is HP Elite everywhere.' },
      { label: 'Cheapest per group', sql: `SELECT group_name, product_name, price
FROM (
  SELECT g.group_name, p.product_name, p.price,
         dense_rank() OVER (PARTITION BY g.group_name ORDER BY p.price) AS r
  FROM products p JOIN product_groups g USING (group_id)
) ranked
WHERE r = 1
ORDER BY group_name, product_name;`,
        note: 'Window functions run after WHERE, so filtering on the rank needs a subquery. dense_rank keeps **both** 700s in Laptop; row_number would silently pick one.' },
      { label: 'LAG: year over year', sql: `SELECT year, group_id, amount,
       lag(amount) OVER (PARTITION BY group_id ORDER BY year) AS prev,
       amount - lag(amount) OVER (PARTITION BY group_id ORDER BY year) AS delta
FROM sales ORDER BY group_id, year;`,
        note: 'The first year of each group has no previous row, so `lag` returns NULL (pass a third argument for a default). `lag` and `lead` ignore the frame. They look at the previous **row**, not the previous year: if 2019 were missing, 2020 would be compared with 2018. And with `ORDER BY year DESC`, `lag` returns the following year.' },
      { label: 'Percent of total in one pass', sql: `SELECT band, name, earnings,
       round(100 * earnings / sum(earnings) OVER (), 1) AS pct_of_all,
       round(100 * earnings / sum(earnings) OVER (PARTITION BY band), 1) AS pct_of_band
FROM musicians ORDER BY band, earnings DESC;

-- window over grouped rows: the inner sum is the aggregate, the outer one the window
SELECT band, sum(earnings) AS band_total,
       round(100 * sum(earnings) / sum(sum(earnings)) OVER (), 1) AS pct_of_all
FROM musicians GROUP BY band ORDER BY band;`,
        note: '`sum(…) OVER ()` puts the grand total (20.8) on every row, so no CROSS JOIN to a total subquery is needed. Changing only the window to `PARTITION BY band` switches the denominator to the band total: Stills is 30.3% of all earnings but 48.5% of CSNY. The second query works because windows run **after** GROUP BY: CSNY 62.5%, PPM 37.5%.' },
      { label: 'Fill gaps: last known value', sql: `SELECT ts, temperature, grp,
       first_value(temperature) OVER (PARTITION BY sensor_id, grp ORDER BY ts) AS filled,
       lag(temperature) OVER (ORDER BY ts) AS naive_lag
FROM (
  SELECT *, count(temperature) OVER (PARTITION BY sensor_id ORDER BY ts) AS grp
  FROM sensor_readings
) s
ORDER BY ts;`,
        note: '`count(temperature)` skips NULLs, so the running count only rises on a real reading: every NULL row inherits the group of the last reading. `first_value` within that group carries 22.50 forward twice and 23.10 once. A plain `lag` is no fix: after two NULLs in a row it returns NULL.' },
      { label: 'Moving window: ROWS vs RANGE', sql: `SELECT product_name, price,
       sum(price) OVER (ORDER BY price ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS rows_1,
       sum(price) OVER (ORDER BY price RANGE BETWEEN 100 PRECEDING AND 100 FOLLOWING) AS range_100,
       sum(price) OVER (ORDER BY price GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING EXCLUDE TIES) AS groups_1
FROM products ORDER BY price, product_id;`,
        note: 'Compare with the explorer\'s presets: ROWS counts rows, RANGE compares price values, GROUPS counts distinct prices.' },
    ],
  },
  production: {
    title: 'Deduplicating a change-data feed: latest row per key',
    context: 'An analytics team receives a CDC feed into `customer_changes(customer_id, changed_at, payload)`, many rows per customer, and needs the current state of each customer every hour.',
    problem: 'The first query used a correlated subquery `WHERE changed_at = (SELECT max(changed_at) … WHERE customer_id = c.customer_id)`. It ran one subquery per row, and returned two rows when two changes shared a timestamp.',
    solution: 'Number the rows per customer with `row_number()` ordered by time and a tie-breaker, then keep number 1. One sort, one pass, exactly one row per key.',
    sql: `SELECT customer_id, changed_at, payload
FROM (
  SELECT *, row_number() OVER (
           PARTITION BY customer_id
           ORDER BY changed_at DESC, change_id DESC) AS rn
  FROM customer_changes
) x
WHERE rn = 1;`,
    outcome: 'One scan and one sort instead of one subquery per row, and a deterministic answer when timestamps tie, thanks to the `change_id` tie-breaker. An index on `(customer_id, changed_at DESC, change_id DESC)` can provide the order and skip the sort.',
  },
  pitfalls: [
    { title: 'last_value returns the current row',
      symptom: '`last_value(price) OVER (PARTITION BY g ORDER BY price)` returns each row\'s own price instead of the group maximum.',
      cause: 'With ORDER BY, the default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`: it ends at the current row\'s last peer.',
      fix: 'Add `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, or use `first_value(…)` with the ORDER BY reversed.' },
    { title: 'Running totals that jump on ties',
      symptom: 'A running balance shows the same total on two rows, then skips ahead.',
      cause: 'The default RANGE frame includes all **peers**, so rows with an equal ORDER BY value get the same sum.',
      fix: 'Use `ROWS UNBOUNDED PRECEDING` and add a unique tie-breaker to the ORDER BY (`ORDER BY booked_at, id`) so the order is deterministic.' },
    { title: 'Filtering on a window function in WHERE',
      symptom: '`ERROR: window functions are not allowed in WHERE`.',
      cause: 'Window functions are computed after WHERE, GROUP BY and HAVING, just before the final ORDER BY and LIMIT.',
      fix: 'Compute the window function in a subquery or CTE, then filter in the outer query.' },
    { title: 'A ROWS window treated as a time window',
      symptom: 'A "7-day moving average" over daily rows is wrong after days with no data.',
      cause: '`ROWS 6 PRECEDING` means six **rows**. Missing days silently stretch the window.',
      fix: 'Use `RANGE BETWEEN interval \'6 days\' PRECEDING AND CURRENT ROW` on a date column, or fill the gaps with `generate_series` first.' },
    { title: 'DISTINCT does not deduplicate a row_number()',
      symptom: '`SELECT DISTINCT price, row_number() OVER (ORDER BY price)` still returns every duplicate price.',
      cause: 'Window functions run **before** DISTINCT, and every row gets a different number, so no two output rows are equal.',
      fix: 'Deduplicate first, then number: `SELECT price, row_number() OVER (ORDER BY price) FROM (SELECT DISTINCT price FROM products) p` (8 rows instead of 11). Or use `dense_rank()`, which gives equal values the same number.' },
    { title: 'Top-N with LIMIT on a tie',
      symptom: '"Top 4 products by price" shows Lenovo on one run and Sony or iPad on the next.',
      cause: 'Three products tie at 700 for the fourth place. `ORDER BY price DESC LIMIT 4` returns some 4 rows that satisfy the order; which tied row makes the cut is not defined.',
      fix: 'Add a unique tie-breaker (`ORDER BY price DESC, product_id`), or include every tie with `FETCH FIRST 4 ROWS WITH TIES` (6 rows here) or `rank() <= 4`.' },
  ],
  pointers: [
    'Window functions run **after** WHERE/GROUP BY/HAVING and never collapse rows. For top-N per group compare [LATERAL](/m3/lateral); for runs and sessions see [gaps and islands](/f4/gaps-and-islands).',
    '**Peers** are rows equal under the window ORDER BY; rank functions give peers the same value.',
    'Default frame with ORDER BY: `RANGE UNBOUNDED PRECEDING` to the current row\'s **last peer**; without ORDER BY: the whole partition.',
    '`ROWS` counts rows, `RANGE` compares values (one ORDER BY column for offsets), `GROUPS` counts peer groups; `EXCLUDE` trims the result.',
    'Frames matter for aggregates and `first_value`/`last_value`/`nth_value`, not for `row_number`, `rank`, `lag` or `lead`.',
  ],
  sources: ['functions-window.html', 'tutorial-window.html', 'sql-expressions.html', 'sql-select.html', 'queries-table-expressions.html'],
}
