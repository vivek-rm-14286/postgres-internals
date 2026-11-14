import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Md } from '../../lesson/Md'
import { Btn, Code, Packet, Slider, Stat, Tabs, TRY_SQL, bytes } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * 1 Localization: one global query decomposed, localized onto fragments, reduced and pushed down.
 *   Row counts at each step are computed from the same generator as the playground data.
 * 2 Semijoin calculator: bytes shipped for ship-whole, semijoin and a bit-array (Bloom) filter.
 * 3 Join strategies over N nodes: co-located, broadcast, repartition; plus partial aggregation.
 * ---------------------------------------------------------------------------------------------- */

/* the playground data, regenerated: customers 1..3000, orders 1..12000 */
const REG = ['EU', 'US', 'APAC'] as const
const regionOf = (id: number) => REG[id % 3]
const ORDERS = Array.from({ length: 12000 }, (_, i) => { const g = i + 1; const c = 1 + ((g * 7) % 3000); return { c, total: 5 + ((g * 13) % 300), region: regionOf(c) } })
const COUNTS = (() => {
  const euOrders = ORDERS.filter((o) => o.region === 'EU')
  const euBig = euOrders.filter((o) => o.total > 100)
  const groups = new Set(euBig.map((o) => o.c)).size
  return { cust: 3000, orders: 12000, custEU: 1000, ordEU: euOrders.length, ordEUbig: euBig.length, groups }
})()

interface LNode { label: string; t: Tone; kids?: LNode[]; site?: string; dim?: boolean }
interface LState { tree: LNode; shipped: number; shippedLabel: string; sql?: string }
const frag = (n: string, site: string, dim = false): LNode => ({ label: n, t: n.startsWith('C') ? 'tuple' : 'pointer', site, dim })
const U = (kids: LNode[]): LNode => ({ label: '∪', t: 'muted', kids })

const LSTEPS: Step<LState>[] = [
  { title: 'The global query', body: 'The application names only global relations. Customers are fragmented by region; orders follow their customer (derived fragmentation). Each region is a site.',
    state: { tree: { label: 'SQL', t: 'accent' }, shipped: 0, shippedLabel: 'nothing planned yet',
      sql: `SELECT c.name, sum(o.total)
FROM customers c
  JOIN orders o ON o.customer_id = c.id
WHERE c.region = 'EU' AND o.total > 100
  AND (c.region = 'EU' OR o.total > 500)
GROUP BY c.name;` } },
  { title: 'Decompose: normalize, analyze, simplify, rewrite', body: 'The predicate becomes a conjunction; the query graph is connected (customers–orders), so it is meaningful. Idempotency removes the redundant `(region = EU OR …)`. The result is an algebra tree on global relations.',
    state: { tree: { label: 'γ name; sum(total)', t: 'accent', kids: [{ label: 'σ region=EU ∧ total>100', t: 'header', kids: [{ label: '⋈ customer_id = id', t: 'new', kids: [{ label: 'customers', t: 'tuple' }, { label: 'orders', t: 'pointer' }] }] }] },
      shipped: 0, shippedLabel: 'no distribution used yet' } },
  { title: 'Localize: substitute the fragments', body: 'Each global relation is replaced by its **localization program**: the union of its horizontal fragments. Executed as is, every fragment ships to one place.',
    state: { tree: { label: 'γ name; sum(total)', t: 'accent', kids: [{ label: 'σ region=EU ∧ total>100', t: 'header', kids: [{ label: '⋈', t: 'new', kids: [U([frag('C_EU', 'EU'), frag('C_US', 'US'), frag('C_APAC', 'APAC')]), U([frag('O_EU', 'EU'), frag('O_US', 'US'), frag('O_APAC', 'APAC')])] }] }] },
      shipped: COUNTS.cust + COUNTS.orders, shippedLabel: 'all customers + all orders' } },
  { title: 'Reduce: drop fragments that contradict the selection', body: '`region = EU` contradicts the defining predicates of C_US and C_APAC, so they cannot contribute. The planner removes them without reading them.',
    state: { tree: { label: 'γ name; sum(total)', t: 'accent', kids: [{ label: 'σ total>100', t: 'header', kids: [{ label: '⋈', t: 'new', kids: [U([frag('C_EU', 'EU'), frag('C_US', 'US', true), frag('C_APAC', 'APAC', true)]), U([frag('O_EU', 'EU'), frag('O_US', 'US'), frag('O_APAC', 'APAC')])] }] }] },
      shipped: COUNTS.custEU + COUNTS.orders, shippedLabel: 'EU customers + all orders' } },
  { title: 'Reduce the join: only matching fragment pairs', body: 'Distribute the join over the union: C_EU ⋈ O_US and C_EU ⋈ O_APAC are empty, because the foreign key places every order with its customer. One co-located pair is left.',
    state: { tree: { label: 'γ name; sum(total)', t: 'accent', kids: [{ label: 'σ total>100', t: 'header', kids: [{ label: '⋈ at site EU', t: 'new', kids: [frag('C_EU', 'EU'), frag('O_EU', 'EU')] }] }] },
      shipped: COUNTS.custEU + COUNTS.ordEU, shippedLabel: 'EU customers + EU orders' } },
  { title: 'Push down the filter and the aggregate', body: 'The selection runs at the site that stores O_EU, and so does the GROUP BY: only finished groups cross the network.',
    state: { tree: { label: 'gather results', t: 'ok', kids: [{ label: 'γ name; sum at site EU', t: 'accent', site: 'EU', kids: [{ label: '⋈', t: 'new', kids: [frag('C_EU', 'EU'), { label: 'σ total>100', t: 'header', kids: [frag('O_EU', 'EU')] }] }] }] },
      shipped: COUNTS.groups, shippedLabel: 'one row per EU customer with a large order' } },
]

function Tree({ n, depth = 0 }: { n: LNode; depth?: number }) {
  return (
    <motion.div layout className="flex flex-col items-center gap-1">
      <motion.span layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: n.dim ? 0.3 : 1, scale: 1 }}
        className="rounded-md border px-2 py-0.5 font-mono text-[11px] whitespace-nowrap"
        style={{ borderColor: tone(n.t), background: toneBg(n.t, n.dim ? 4 : 16), textDecoration: n.dim ? 'line-through' : 'none' }}>
        {n.label}{n.site && !n.kids ? <span className="ml-1 text-muted">@{n.site}</span> : null}
      </motion.span>
      {n.kids && (
        <div className="flex items-start gap-2 border-t border-line pt-1">
          {n.kids.map((k, i) => <Tree key={`${depth}-${i}-${k.label}`} n={k} depth={depth + 1} />)}
        </div>
      )}
    </motion.div>
  )
}

function Localization() {
  const naive = COUNTS.cust + COUNTS.orders
  return (
    <Stepper steps={LSTEPS} interval={3200} render={(s) => (
      <div className="grid gap-3 [&>*]:min-w-0">
        {s.sql ? <Code>{s.sql}</Code> : (
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-3 scrollbar-thin"><div className="mx-auto w-max"><Tree n={s.tree} /></div></div>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr]">
          <Stat label="rows shipped" value={s.shipped ? s.shipped.toLocaleString() : '—'} t={s.shipped && s.shipped < 2000 ? 'ok' : s.shipped ? 'dead' : undefined} sub={s.shippedLabel} />
          <div className="min-w-0 rounded-lg border border-line bg-surface-2 px-3 py-2">
            <p className="text-[11px] tracking-wide text-muted uppercase">vs shipping every fragment</p>
            <div className="mt-1 h-3 rounded bg-surface"><motion.div className="h-3 rounded" style={{ background: tone(s.shipped < 2000 ? 'ok' : 'dead') }} animate={{ width: `${(s.shipped / naive) * 100}%` }} /></div>
            <p className="mt-1 font-mono text-[11px] text-muted">{s.shipped ? `${((s.shipped / naive) * 100).toFixed(1)}% of ${naive.toLocaleString()} rows` : ''}</p>
          </div>
        </div>
        <Legend items={[['tuple', 'customer fragment'], ['pointer', 'order fragment'], ['header', 'selection'], ['new', 'join'], ['accent', 'aggregate']]} />
      </div>
    )} />
  )
}

/* ---- semijoin calculator ---- */

function Semijoin() {
  const [rRows, setRRows] = useState(12000)
  const [rW, setRW] = useState(41)
  const [sKeys, setSKeys] = useState(428)
  const [kW, setKW] = useState(4)
  const [match, setMatch] = useState(14.3)
  const [bpk, setBpk] = useState(8)
  const ship = rRows * rW
  const semi = sKeys * kW + (match / 100) * rRows * rW
  const kHash = Math.max(1, Math.round(bpk * Math.LN2))
  const fp = Math.pow(1 - Math.exp(-kHash / bpk), kHash)
  const bloom = (sKeys * bpk) / 8 + ((match / 100) + (1 - match / 100) * fp) * rRows * rW
  const best = Math.min(ship, semi, bloom)
  const bars: [string, number, string][] = [
    ['ship R whole', ship, `${rRows.toLocaleString()} rows × ${rW} B`],
    ['semijoin', semi, `π_A(S) ${bytes(sKeys * kW)} + R ⋉ S ${bytes((match / 100) * rRows * rW)}`],
    ['bit-array filter', bloom, `${bytes((sKeys * bpk) / 8)} filter, ${(fp * 100).toFixed(2)}% false positives`],
  ]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <p className="text-sm text-muted"><Md>{'R (orders) lives on site 1, S (gold customers) on site 2, and the join runs on site 2. A **semijoin** ships S\'s join keys to site 1 first, so only matching R rows travel. It pays when **size(π_A S) + size(R ⋉ S) < size(R)**.'}</Md></p>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => { setRRows(12000); setRW(41); setSKeys(428); setKW(4); setMatch(14.3) }}>Playground numbers</Btn>
        <Btn onClick={() => { setRRows(12000); setRW(41); setSKeys(2900); setKW(4); setMatch(96.7) }}>Almost everything matches</Btn>
        <Btn testid="viz-next" onClick={() => { setRRows(1000000); setRW(400); setSKeys(5000); setKW(8); setMatch(0.5) }}>Wide rows, rare matches</Btn>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 [&>*]:min-w-0">
        <Slider label="rows in R" value={rRows} min={1000} max={1000000} step={1000} onChange={setRRows} show={rRows.toLocaleString()} />
        <Slider label="bytes per R row" value={rW} min={8} max={2000} onChange={setRW} show={`${rW} B`} />
        <Slider label="distinct join keys in S" value={sKeys} min={10} max={200000} step={10} onChange={setSKeys} show={sKeys.toLocaleString()} />
        <Slider label="bytes per join key" value={kW} min={4} max={64} onChange={setKW} show={`${kW} B`} />
        <Slider label="R rows that match (%)" value={match} min={0.1} max={100} step={0.1} onChange={setMatch} show={`${match.toFixed(1)}%`} />
        <Slider label="filter bits per key" value={bpk} min={1} max={24} onChange={setBpk} show={`${bpk} bits, k=${kHash}`} />
      </div>
      <div className="grid gap-1.5">
        {bars.map(([l, v, d]) => (
          <div key={l} className="grid grid-cols-[110px_1fr] items-center gap-2 text-xs sm:grid-cols-[130px_1fr_90px]">
            <span className="font-semibold">{l}</span>
            <div className="h-4 rounded bg-surface-2"><motion.div className="h-4 rounded" style={{ background: tone(v === best ? 'ok' : 'muted') }} animate={{ width: `${Math.max(1, (v / Math.max(ship, semi, bloom)) * 100)}%` }} /></div>
            <span className="col-span-2 font-mono sm:col-span-1 sm:text-right">{bytes(v)}</span>
            <span className="col-span-2 text-[11px] text-muted sm:col-span-3">{d}</span>
          </div>
        ))}
      </div>
      <p className="text-sm"><Md>{semi < ship
        ? `The semijoin saves **${bytes(ship - semi)}** (${(((ship - semi) / ship) * 100).toFixed(1)}%). It costs an extra round trip and local work, and the shipped R rows arrive without their indexes.`
        : `Here the semijoin **loses** ${bytes(semi - ship)}: almost every R row matches, so shipping the keys is pure overhead.`}</Md></p>
    </div>
  )
}

/* ---- join strategies ---- */

type Strat = 'colo' | 'bcast' | 'repart'
function Joins() {
  const [n, setN] = useState(4)
  const [big, setBig] = useState(488)
  const [small, setSmall] = useState(148)
  const [st, setSt] = useState<Strat>('bcast')
  const [groups, setGroups] = useState(3000)
  const [agg, setAgg] = useState(false)
  const kb = 1000
  const moved = st === 'colo' ? 0 : st === 'bcast' ? small * kb * (n - 1) : (big + small) * kb * (n - 1) / n
  const rowsAgg = 12000, groupRows = Math.min(groups, Math.floor(rowsAgg / n))
  const aggShip = agg ? groupRows * n : rowsAgg
  const nodes = Array.from({ length: n }, (_, i) => i)
  const W = 600, xs = nodes.map((i) => 50 + (i * (W - 100)) / Math.max(1, n - 1))
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="strategy" value={st} onChange={setSt} options={[['colo', 'co-located'], ['bcast', 'broadcast'], ['repart', 'repartition']]} />
        <Btn testid="viz-next" onClick={() => setSt(st === 'colo' ? 'bcast' : st === 'bcast' ? 'repart' : 'colo')}>Next strategy</Btn>
      </div>
      <div className="grid gap-2 sm:grid-cols-3 [&>*]:min-w-0">
        <Slider label="nodes" value={n} min={2} max={16} onChange={setN} show={String(n)} />
        <Slider label="big table (kB)" value={big} min={10} max={100000} step={10} onChange={setBig} show={`${big.toLocaleString()} kB`} />
        <Slider label="small table (kB)" value={small} min={1} max={10000} onChange={setSmall} show={`${small.toLocaleString()} kB`} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin">
        <svg viewBox={`0 0 ${W} 150`} className="w-full min-w-[460px]" role="img" aria-label="Join strategy data movement">
          {xs.map((x, i) => (
            <g key={i}>
              <rect x={x - 26} y={60} width={52} height={60} rx={6} fill={toneBg('muted', 8)} stroke="var(--border)" />
              <rect x={x - 20} y={70} width={18} height={40} rx={3} fill={toneBg('pointer', 30)} stroke={tone('pointer')} />
              <rect x={x + 2} y={90} width={18} height={20} rx={3} fill={toneBg('tuple', 30)} stroke={tone('tuple')} />
              <text x={x} y={136} textAnchor="middle" fontSize={10} fill="var(--muted)">node {i + 1}</text>
            </g>
          ))}
          {st === 'bcast' && xs.flatMap((x, i) => xs.filter((_, j) => j !== i).map((y, j) => <Packet key={`${st}${n}${i}-${j}`} x1={x + 11} y1={90} x2={y + 11} y2={90} t="tuple" r={3.5} delay={(i * 0.15) % 1.2} dur={0.8} />))}
          {st === 'repart' && xs.flatMap((x, i) => xs.filter((_, j) => j !== i).map((y, j) => <Packet key={`${st}${n}${i}-${j}`} x1={x} y1={75} x2={y} y2={75} t="new" r={3.5} delay={(i * 0.12) % 1.2} dur={0.8} />))}
          <text x={W / 2} y={30} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--text)">
            {st === 'colo' ? 'both tables split on the join key: every join pair is local' : st === 'bcast' ? 'copy the small table to every node' : 'rehash both tables on the join key'}
          </text>
        </svg>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat label="bytes moved" value={bytes(moved)} t={moved === 0 ? 'ok' : 'dead'} sub={st === 'colo' ? 'needs the same partitioning on the join key' : st === 'bcast' ? 'small × (N − 1)' : '(big + small) × (N − 1) / N'} />
        <Stat label="broadcast instead" value={bytes(small * kb * (n - 1))} />
        <Stat label="repartition instead" value={bytes((big + small) * kb * (n - 1) / n)} />
      </div>
      <Panel title="Aggregate pushdown">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="aggregate" value={agg ? 'push' : 'pull'} onChange={(v) => setAgg(v === 'push')} options={[['pull', 'ship rows, aggregate centrally'], ['push', 'partial aggregate per node']]} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 [&>*]:min-w-0">
          <Slider label="distinct groups" value={groups} min={1} max={12000} onChange={setGroups} show={groups.toLocaleString()} />
          <p className="text-xs sm:pt-4"><Md>{agg
            ? `each of ${n} nodes sends ≤ ${groupRows.toLocaleString()} partial rows → **≤ ${aggShip.toLocaleString()}** rows, then a final combine`
            : `all **${rowsAgg.toLocaleString()}** order rows travel to the coordinator`}</Md></p>
        </div>
        <p className="mt-1 text-xs text-muted"><Md>{'At most one partial row per group per node. Partial aggregation wins when groups are few; when each node holds about as many groups as rows, it saves nothing and adds a combine step.'}</Md></p>
      </Panel>
    </div>
  )
}

function DQPViz() {
  const [tab, setTab] = useState<'loc' | 'semi' | 'join'>('loc')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Tabs value={tab} onChange={setTab} options={[['loc', 'Decompose and localize'], ['semi', 'Semijoin calculator'], ['join', 'Join strategies']]} />
      {tab === 'loc' ? <Localization /> : tab === 'semi' ? <Semijoin /> : <Joins />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `${TRY_SQL}

-- one PostgreSQL, three "sites": every fragment is a partition
CREATE TABLE customers (id int NOT NULL, name text NOT NULL, region text NOT NULL, tier text NOT NULL,
                        PRIMARY KEY (id, region)) PARTITION BY LIST (region);
CREATE TABLE customers_eu   PARTITION OF customers FOR VALUES IN ('EU');
CREATE TABLE customers_us   PARTITION OF customers FOR VALUES IN ('US');
CREATE TABLE customers_apac PARTITION OF customers FOR VALUES IN ('APAC');
INSERT INTO customers SELECT g, 'customer ' || g, (ARRAY['EU', 'US', 'APAC'])[1 + g % 3],
                             CASE WHEN g % 7 = 0 THEN 'gold' ELSE 'std' END FROM generate_series(1, 3000) g;

-- orders follow their customer (derived fragmentation)
CREATE TABLE orders (id int NOT NULL, customer_id int NOT NULL, region text NOT NULL, total numeric(10,2) NOT NULL,
                     PRIMARY KEY (id, region), FOREIGN KEY (customer_id, region) REFERENCES customers (id, region))
  PARTITION BY LIST (region);
CREATE TABLE orders_eu   PARTITION OF orders FOR VALUES IN ('EU');
CREATE TABLE orders_us   PARTITION OF orders FOR VALUES IN ('US');
CREATE TABLE orders_apac PARTITION OF orders FOR VALUES IN ('APAC');
INSERT INTO orders SELECT g, c.id, c.region, 5 + (g * 13) % 300
  FROM generate_series(1, 12000) g JOIN customers c ON c.id = 1 + (g * 7) % 3000;
CREATE INDEX ON orders (customer_id);
ANALYZE;`

export const lesson: Lesson = {
  slug: 'distributed-query-processing',
  module: 'e5',
  order: 4,
  title: 'Distributed query processing',
  tldr: [
    'A distributed query is **decomposed** into relational algebra, **localized** onto the fragments that hold the data, reduced by removing fragments that cannot match, and then optimized for the bytes it sends over the network.',
    'The network is the dominant cost, so pruning, pushdown, semijoins and co-located joins exist to move fewer rows between sites.',
  ],
  visualizer: {
    title: 'From a global query to a cheap distributed plan',
    caption: 'Step through decomposition, localization and reduction while the shipped-row count falls. Then tune a semijoin until it pays, and compare co-located, broadcast and repartition joins.',
    Component: DQPViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'Localization: partition pruning', sql: `EXPLAIN (COSTS OFF)
SELECT count(*) FROM orders WHERE region = 'EU' AND total > 100;

SET enable_partition_pruning = off;
EXPLAIN (COSTS OFF)
SELECT count(*) FROM orders WHERE region = 'EU' AND total > 100;
RESET enable_partition_pruning;

SELECT count(*) AS eu_orders_over_100 FROM orders WHERE region = 'EU' AND total > 100;`,
        note: 'With pruning the plan touches only `orders_eu`: the planner proved the other fragments contradict `region = \'EU\'`. With pruning off, every fragment is scanned and filtered. That is the reduction step of localization.' },
      { label: 'Pruning at run time', sql: `PREPARE by_region(text) AS SELECT count(*) FROM orders WHERE region = $1;
SET plan_cache_mode = force_generic_plan;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF) EXECUTE by_region('US');
RESET plan_cache_mode;
DEALLOCATE by_region;`,
        note: 'A generic plan cannot know the region at planning time, so it keeps all three fragments and prunes when the executor starts: `Subplans Removed: 2`. Distributed routers do the same with parameters.' },
      { label: 'Join reduction: co-located fragment pairs', sql: `EXPLAIN (COSTS OFF)
SELECT c.region, count(*) FROM customers c JOIN orders o ON o.customer_id = c.id AND o.region = c.region GROUP BY c.region;

SET enable_partitionwise_join = on;
EXPLAIN (COSTS OFF)
SELECT c.region, count(*) FROM customers c JOIN orders o ON o.customer_id = c.id AND o.region = c.region GROUP BY c.region;
RESET enable_partitionwise_join;`,
        note: 'First the planner appends all fragments and joins once. With partitionwise join it joins `customers_eu` with `orders_eu`, and so on: the join is distributed over the union and only matching pairs remain, the plan shape of a co-located distributed join.' },
      { label: 'Aggregate pushdown', sql: `SET enable_partitionwise_aggregate = on;
EXPLAIN (COSTS OFF) SELECT region, sum(total) FROM orders GROUP BY region;
EXPLAIN (COSTS OFF) SELECT total, count(*) FROM orders GROUP BY total;
RESET enable_partitionwise_aggregate;

SELECT region, count(*) AS rows_in, sum(total) FROM orders GROUP BY region ORDER BY region;`,
        note: 'Grouping by the partition key aggregates each fragment completely on its own. Grouping by another column needs **Partial** aggregates per fragment and a **Finalize** step on top: the two-phase aggregation that distributed engines push to their workers.' },
      { label: 'Does a semijoin pay?', sql: `-- R = orders (site 1), S = gold customers (site 2), join on customer id
WITH s AS (SELECT id FROM customers WHERE tier = 'gold'),
     r AS (SELECT o.* FROM orders o)
SELECT (SELECT sum(pg_column_size(r.*)) FROM r) AS size_r_bytes,
       (SELECT count(*) FROM r) AS r_rows,
       (SELECT count(DISTINCT id) FROM s) AS distinct_keys_in_s,
       (SELECT sum(pg_column_size(id)) FROM (SELECT DISTINCT id FROM s) k) AS size_keys_bytes,
       (SELECT sum(pg_column_size(r.*)) FROM r WHERE customer_id IN (SELECT id FROM s)) AS size_r_semijoin_s_bytes,
       (SELECT count(*) FROM r WHERE customer_id IN (SELECT id FROM s)) AS matching_r_rows;

EXPLAIN (COSTS OFF)
SELECT o.* FROM orders o WHERE EXISTS (SELECT 1 FROM customers c WHERE c.id = o.customer_id AND c.tier = 'gold');`,
        note: 'Plug the numbers into size(π_A S) + size(R ⋉ S) < size(R): 1,712 + 69,621 bytes against 487,997, so the semijoin ships about 15% of the bytes. The plan shows the same operator inside one node: a **Hash Semi Join**.' },
      { label: 'A bit-array filter instead of the keys', sql: `-- 64-bit array: bit h(k) mod 64 is set for every gold customer id
WITH bits AS (SELECT DISTINCT (hashint4(id)::bigint + 4294967296) % 64 AS b FROM customers WHERE tier = 'gold'),
     passed AS (SELECT o.customer_id FROM orders o
                WHERE (hashint4(o.customer_id)::bigint + 4294967296) % 64 IN (SELECT b FROM bits))
SELECT (SELECT count(*) FROM bits) AS bits_set_of_64,
       count(*) AS orders_passing_filter,
       count(*) FILTER (WHERE customer_id IN (SELECT id FROM customers WHERE tier = 'gold')) AS true_matches,
       count(*) FILTER (WHERE customer_id NOT IN (SELECT id FROM customers WHERE tier = 'gold')) AS false_positives
FROM passed;

WITH bits AS (SELECT DISTINCT (hashint4(id)::bigint + 4294967296) % 65536 AS b FROM customers WHERE tier = 'gold')
SELECT count(*) AS orders_passing_65536_bit_filter FROM orders o
WHERE (hashint4(o.customer_id)::bigint + 4294967296) % 65536 IN (SELECT b FROM bits);`,
        note: 'With 428 keys in only 64 bits every bit is set, so all 12,000 orders pass and 10,288 are false positives. With 65,536 bits (8 kB) 1,768 pass: the 1,712 true matches plus 56 false positives. The filter over-approximates: it never drops a real match.' },
      { label: 'Broadcast vs repartition, in bytes', sql: `WITH sz AS (
  SELECT (SELECT sum(pg_column_size(o.*)) FROM orders o) AS big,
         (SELECT sum(pg_column_size(c.*)) FROM customers c) AS small, 4 AS nodes)
SELECT nodes, big AS orders_bytes, small AS customers_bytes,
       0 AS colocated_moved,
       small * (nodes - 1) AS broadcast_customers_moved,
       small * (nodes - 1) / nodes AS repartition_customers_only_moved,
       (big + small) * (nodes - 1) / nodes AS repartition_both_moved
FROM sz;`,
        note: 'Broadcasting the small table costs small × (N − 1). If the big table is already split on the join key, repartitioning only the small one is cheaper; repartitioning both is the expensive fallback. Co-location moves nothing.' },
    ],
  },
  production: {
    title: 'A dashboard query that shipped a whole table',
    context: 'An analytics service runs on a sharded PostgreSQL cluster with orders distributed by `customer_id` and a small `regions` table on the coordinator only.',
    problem: 'A dashboard joining orders to regions took 40 s. EXPLAIN showed every worker streaming all its order rows to the coordinator, because the join partner was not available on the workers.',
    solution: 'Make the small table available where the data is (a reference table, which is a fully replicated fragment), so the filter and the join run on each shard. Add the distribution key to the join so it stays co-located, and let partial aggregates run on the workers.',
    sql: `-- Citus: replicate the small table to every node
SELECT create_reference_table('regions');

-- the plan should now push the join and a partial aggregate to the workers
EXPLAIN (VERBOSE, COSTS OFF)
SELECT r.name, sum(o.total)
FROM orders o JOIN regions r ON r.code = o.region_code
WHERE o.created_at >= now() - interval '7 days'
GROUP BY r.name;`,
    outcome: 'Each worker now returns one partial row per region instead of every order. The bytes crossing the network fall from the size of a week of orders to a few rows per shard, and the dashboard renders in under a second.',
  },
  pitfalls: [
    { title: 'A filter the planner cannot use for pruning',
      symptom: 'A query on one region scans every fragment.',
      cause: 'The predicate wraps the partition key in a function or a cast (`lower(region) = \'eu\'`), so the planner cannot prove a fragment is irrelevant.',
      fix: 'Compare the partition key itself with a constant or a parameter, and check the plan for the pruned fragment list.',
      sql: `EXPLAIN (COSTS OFF) SELECT count(*) FROM orders WHERE region = 'EU';` },
    { title: 'Semijoins when almost everything matches',
      symptom: 'A "reduction" step adds latency and saves nothing.',
      cause: 'The semijoin ships the join keys plus nearly all of R. It only pays when size(π_A S) + size(R ⋉ S) < size(R), that is, when few R rows match or R rows are wide.',
      fix: 'Estimate the match fraction first. Use a bit-array (Bloom) filter when the key list itself is large.' },
    { title: 'Joining on a non-distribution column',
      symptom: 'A join between two large distributed tables is slow and the plan shows a repartition step.',
      cause: 'The tables are not split on the join key, so rows of both must be rehashed across the network: (big + small) × (N − 1) / N bytes.',
      fix: 'Distribute related tables on the same key and include it in the join, or make the small side a replicated reference table.' },
    { title: 'Aggregate pushdown with high-cardinality groups',
      symptom: 'Partial aggregation is on, yet the coordinator still receives millions of rows.',
      cause: 'When almost every group is unique, each node sends nearly one partial row per input row.',
      fix: 'Group by the distribution key so each node finishes its groups locally, or pre-aggregate on a coarser key.' },
  ],
  pointers: [
    '**Decomposition** (normalize, analyze, eliminate redundancy, rewrite) produces an algebra tree on global relations, without using distribution information.',
    '**Localization** replaces each relation by the union (horizontal) or join (vertical) of its fragments, then **reduces**: fragments contradicting a selection go, and joins shrink to matching fragment pairs. In PostgreSQL this is [partition pruning](/m7/partitioning) and partitionwise join.',
    'A **semijoin** pays iff size(π_A S) + size(R ⋉ S) < size(R). A bit-array filter shrinks the key list at the cost of false positives.',
    'Join strategies by bytes moved: **co-located** 0, **broadcast** small × (N − 1), **repartition** (big + small) × (N − 1) / N. Push filters and partial aggregates to the data. See [distributed queries in Citus](/e3/distributed-queries).',
  ],
  sources: ['ddl-partitioning.html', 'runtime-config-query.html', 'sql-explain.html', 'using-explain.html', 'sql-prepare.html', 'functions-subquery.html', 'functions-admin.html', 'postgres-fdw.html'],
}
