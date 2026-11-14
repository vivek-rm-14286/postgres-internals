import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, Msg, Slider, Tiles } from './_kit'
import { GRID } from './_costgrid'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the planner's three scan paths for `WHERE col < X` on a 100000-row, 935-page table.
 * Every cost on the chart is a real Total Cost from EXPLAIN (FORMAT JSON) on PGlite, captured for
 * 10 random_page_cost values × 19 selectivities × 2 columns × 2 effective_cache_size settings, with
 * each plan forced by enable_* flags. Nothing is interpolated except the chart lines between points.
 * ---------------------------------------------------------------------------------------------- */

type Col = 'seq_k' | 'rnd_k'
type Ecs = '4GB' | '256kB'
type Plan = 'seq' | 'idx' | 'bmp'
const PLAN: Record<Plan, { name: string; t: Tone }> = {
  seq: { name: 'Seq Scan', t: 'tuple' },
  idx: { name: 'Index Scan', t: 'ok' },
  bmp: { name: 'Bitmap Heap Scan', t: 'new' },
}
const PAGES = 935, ROWS = 100000

const W = 640, H = 300, L = 58, R = 12, T = 14, B = 40
const lx = (s: number) => L + ((Math.log10(s) + 4) / 4) * (W - L - R)
function lyFactory(max: number) {
  const top = Math.ceil(Math.log10(max) + 0.05)
  return { top, f: (c: number) => T + (1 - Math.log10(Math.max(c, 1)) / top) * (H - T - B) }
}

function Chart({ col, ecs, ri, si }: { col: Col; ecs: Ecs; ri: number; si: number }) {
  const g = GRID.cost[ecs][col]
  const max = Math.max(...(['seq', 'idx', 'bmp'] as Plan[]).map((p) => Math.max(...g[p][ri])))
  const { top, f: ly } = lyFactory(max)
  const path = (p: Plan) => GRID.sel.map((s, i) => `${i ? 'L' : 'M'}${lx(s).toFixed(1)},${ly(g[p][ri][i]).toFixed(1)}`).join(' ')
  const best = (i: number): Plan => (['seq', 'idx', 'bmp'] as Plan[]).reduce((a, b) => (g[b][ri][i] < g[a][ri][i] ? b : a))
  // crossover: first selectivity where seq scan becomes the cheapest
  const cross = GRID.sel.findIndex((_, i) => best(i) === 'seq')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Estimated cost of each scan path against selectivity">
      {/* winner band along the x axis */}
      {GRID.sel.map((s, i) => {
        const x0 = i === 0 ? L : (lx(GRID.sel[i - 1]) + lx(s)) / 2
        const x1 = i === GRID.sel.length - 1 ? W - R : (lx(s) + lx(GRID.sel[i + 1])) / 2
        return <motion.rect key={i} x={x0} y={H - B + 6} width={x1 - x0} height={7} initial={false} animate={{ fill: tone(PLAN[best(i)].t) }} opacity={0.7} />
      })}
      {Array.from({ length: top + 1 }, (_, k) => (
        <g key={k}>
          <line x1={L} x2={W - R} y1={ly(10 ** k)} y2={ly(10 ** k)} stroke="var(--border)" strokeDasharray={k ? '3 4' : undefined} />
          <text x={L - 6} y={ly(10 ** k) + 3.5} textAnchor="end" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{k >= 3 ? `${10 ** (k - 3)}k` : 10 ** k}</text>
        </g>
      ))}
      {[0.0001, 0.001, 0.01, 0.1, 1].map((s) => (
        <text key={s} x={lx(s)} y={H - 12} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{s >= 0.01 ? `${s * 100}%` : `${+(s * 100).toFixed(2)}%`}</text>
      ))}
      <text x={W - R} y={H - 1} textAnchor="end" fontSize={10} fill="var(--muted)">fraction of rows matching (log scale)</text>
      <text x={12} y={T + 4} fontSize={10} fill="var(--muted)" transform={`rotate(-90 12 ${T + 4})`} textAnchor="end">total cost (log)</text>
      {cross > 0 && (
        <g>
          <line x1={lx(GRID.sel[cross])} x2={lx(GRID.sel[cross])} y1={T} y2={H - B} stroke="var(--c-tuple)" strokeDasharray="2 3" />
          <text x={lx(GRID.sel[cross]) - 4} y={T + 10} textAnchor="end" fontSize={10} fill="var(--c-tuple)" fontFamily="var(--font-mono)">seq scan wins from here</text>
        </g>
      )}
      {(['seq', 'bmp', 'idx'] as Plan[]).map((p) => (
        <motion.path key={p} initial={false} animate={{ d: path(p) }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          fill="none" stroke={tone(PLAN[p].t)} strokeWidth={best(si) === p ? 3 : 1.6} />
      ))}
      <line x1={lx(GRID.sel[si])} x2={lx(GRID.sel[si])} y1={T} y2={H - B} stroke="var(--text)" strokeOpacity={0.35} />
      {(['seq', 'bmp', 'idx'] as Plan[]).map((p) => (
        <motion.circle key={p} r={best(si) === p ? 6 : 4} initial={false} animate={{ cx: lx(GRID.sel[si]), cy: ly(g[p][ri][si]) }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }} fill={tone(PLAN[p].t)} stroke="var(--surface)" strokeWidth={1.5} />
      ))}
    </svg>
  )
}

function CostViz() {
  const [col, setCol] = useState<Col>('seq_k')
  const [ecs, setEcs] = useState<Ecs>('4GB')
  const [ri, setRi] = useState(6) // random_page_cost = 4
  const [si, setSi] = useState(6) // 1%
  const g = GRID.cost[ecs][col]
  const c = { seq: g.seq[ri][si], idx: g.idx[ri][si], bmp: g.bmp[ri][si] }
  const best = (Object.keys(c) as Plan[]).reduce((a, b) => (c[b] < c[a] ? b : a))
  const rows = GRID.rows[col][si]
  const rpc = GRID.rpc[ri]
  const msg = best === 'seq'
    ? `At ${rows.toLocaleString()} rows the planner reads the whole table: **935 sequential page reads** beat ${col === 'seq_k' ? 'index-ordered' : 'scattered'} heap fetches priced at \`random_page_cost\` = ${rpc}.`
    : best === 'idx'
      ? col === 'seq_k'
        ? `\`seq_k\` has **correlation 1.0**: matching rows sit on adjacent pages, so the index scan's heap reads are costed as nearly sequential. It wins even at ${(GRID.sel[si] * 100).toFixed(2)}% of the table.`
        : `Only ${rows} rows match, so a few **random page fetches** (${rpc} each) are cheaper than scanning ${PAGES} pages.`
      : `\`rnd_k\` is scattered (**correlation ≈ 0**). A bitmap scan collects all ${rows.toLocaleString()} TIDs first, then reads each heap page **once, in physical order**, instead of once per row.`
  const ecsNote = ecs === '256kB' && col === 'rnd_k' && GRID.sel[si] >= 0.01
    ? ' With a cache far smaller than the table, the plain index scan is costed as re-reading pages per row, and its curve explodes.' : ''
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Column" value={col} onChange={setCol} options={[['seq_k', 'seq_k: correlated (1.0)'], ['rnd_k', 'rnd_k: scattered (≈0)']]} />
        <Segmented label="effective_cache_size" value={ecs} onChange={setEcs} options={[['4GB', 'cache 4GB (table fits)'], ['256kB', 'cache 256kB (table is 29× bigger)']]} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Slider label="WHERE col <" value={si} min={0} max={GRID.sel.length - 1} onChange={setSi} show={`${rows.toLocaleString()} rows`} />
        <Slider label="random_page_cost" value={ri} min={0} max={GRID.rpc.length - 1} onChange={setRi} show={rpc.toFixed(2)} />
        <Btn primary testid="viz-next" onClick={() => setSi((x) => (x + 1) % GRID.sel.length)}>Widen predicate</Btn>
      </div>
      <Tiles items={[['Chosen plan', PLAN[best].name, PLAN[best].t], ['Seq Scan', c.seq.toFixed(1)], ['Index Scan', c.idx.toFixed(1)], ['Bitmap Heap Scan', c.bmp.toFixed(1)]]} />
      <Legend items={[['tuple', 'Seq Scan'], ['ok', 'Index Scan'], ['new', 'Bitmap Heap Scan']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin"><Chart col={col} ecs={ecs} ri={ri} si={si} /></div>
      <Msg k={`${best}-${col}-${ecs}-${si > 8}`} text={msg + ecsNote} />
      <Panel title="Seq Scan cost, term by term (it never depends on the predicate's selectivity)">
        <div className="grid gap-1 font-mono text-[12px]">
          {[[`${PAGES} pages × seq_page_cost 1.0`, PAGES, 'header'], [`${ROWS.toLocaleString()} rows × cpu_tuple_cost 0.01`, 1000, 'tuple'], [`${ROWS.toLocaleString()} rows × cpu_operator_cost 0.0025 (one < per row)`, 250, 'new']].map(([k, v, t]) => (
            <div key={k as string} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="flex items-center gap-2"><motion.span initial={{ width: 0 }} animate={{ width: `${((v as number) / 2185) * 160}px` }} className="inline-block h-3 rounded-sm" style={{ background: toneBg(t as Tone, 60) }} />{k}</div>
              <span className="tabular-nums">{(v as number).toFixed(2)}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_auto] border-t border-line pt-1 font-semibold"><span>Total cost (EXPLAIN: cost=0.00..2185.00)</span><span>2185.00</span></div>
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE orders (id int, seq_k int, rnd_k int, note text);
INSERT INTO orders
SELECT g, g, (g * 7919) % 100000, md5(g::text) FROM generate_series(0, 99999) g;
CREATE INDEX orders_seq ON orders (seq_k);
CREATE INDEX orders_rnd ON orders (rnd_k);
VACUUM ANALYZE orders;`

export const lesson: Lesson = {
  slug: 'cost-model',
  module: 'm4',
  order: 2,
  title: 'The cost model',
  tldr: [
    'The planner prices every candidate plan in abstract **cost units**, where reading one page sequentially costs `seq_page_cost` = 1.0 and every random page, row, index entry and operator call has its own relative price.',
    'Comparing those totals is how PostgreSQL decides between a sequential scan, an index scan and a bitmap scan, so the constants (and the statistics they multiply) decide which plan you get.',
  ],
  visualizer: {
    title: 'Where the sequential scan starts to win',
    caption: 'Drag the predicate wider and watch three real cost curves cross. Then make the column scattered, shrink the cache, and lower `random_page_cost` to see each factor move the crossover.',
    Component: CostViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'Seq scan formula', sql: `SELECT relpages, reltuples FROM pg_class WHERE relname = 'orders';

EXPLAIN SELECT * FROM orders;
EXPLAIN SELECT * FROM orders WHERE note = 'x';`,
        note: '935 pages × 1.0 + 100000 rows × 0.01 = **1935**. Adding one filter adds 100000 × `cpu_operator_cost` 0.0025 = 250, giving **2185**.' },
      { label: 'Cost constants', sql: `SELECT name, setting, short_desc FROM pg_settings
WHERE name IN ('seq_page_cost', 'random_page_cost', 'cpu_tuple_cost', 'cpu_index_tuple_cost',
               'cpu_operator_cost', 'effective_cache_size', 'parallel_setup_cost', 'parallel_tuple_cost')
ORDER BY name;`,
        note: 'Defaults: random 4.0, tuple 0.01, index tuple 0.005, operator 0.0025. `effective_cache_size` is a hint for costing only: it allocates nothing.' },
      { label: 'Correlation matters', sql: `SELECT attname, correlation FROM pg_stats
WHERE tablename = 'orders' AND attname IN ('seq_k', 'rnd_k');

EXPLAIN SELECT * FROM orders WHERE seq_k < 5000;
EXPLAIN SELECT * FROM orders WHERE rnd_k < 5000;`,
        note: 'Same 5% of rows. The correlated column gets a cheap Index Scan (about 193). The scattered one gets a Bitmap Heap Scan (about 1090), because those rows are spread over almost every page.' },
      { label: 'Scattered rows, every page', sql: `EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT * FROM orders WHERE rnd_k < 2000;`,
        note: '`Heap Blocks: exact=934`: only 2% of the rows, but they live on 934 of the 935 pages. That is why the bitmap scan is nearly as expensive as a full scan.' },
      { label: 'Tiny table, index ignored', sql: `CREATE TABLE actor (id int PRIMARY KEY, first_name text NOT NULL);
INSERT INTO actor SELECT g, 'Name' || g FROM generate_series(1, 200) g;
CREATE INDEX actor_first_name ON actor (first_name);
ANALYZE actor;
SELECT relpages, reltuples FROM pg_class WHERE relname = 'actor';
EXPLAIN SELECT * FROM actor WHERE first_name = 'Name42';

SET enable_seqscan = off;
EXPLAIN SELECT * FROM actor WHERE first_name = 'Name42';
RESET enable_seqscan;

INSERT INTO actor SELECT g, 'Name' || g FROM generate_series(201, 20000) g;
ANALYZE actor;
EXPLAIN SELECT * FROM actor WHERE first_name = 'Name42';
DROP TABLE actor;`,
        note: '200 rows fit in **2 pages**. Reading both and testing 200 rows costs 2 + 2 + 0.5 = **4.50**. The index path costs 8.16, because it reads index pages and then a random heap page. At 20000 rows the same query switches to the Index Scan (8.30). An unused index on a tiny table is the planner working correctly.' },
      { label: 'Startup cost and LIMIT', sql: `EXPLAIN SELECT * FROM orders ORDER BY note;
EXPLAIN SELECT * FROM orders ORDER BY seq_k LIMIT 5;`,
        note: 'A Sort has a large **startup cost**: it must read everything before returning a row. The index scan under LIMIT starts at 0.29 and the Limit node charges only a fraction of the total.' },
      { label: 'SSD pricing', sql: `SET random_page_cost = 1.1;
EXPLAIN SELECT * FROM orders WHERE rnd_k < 3000;
RESET random_page_cost;
EXPLAIN SELECT * FROM orders WHERE rnd_k < 3000;`,
        note: 'At 1.1 the random heap fetches look almost as cheap as sequential ones, so the plan cost drops and index plans win over a wider range.' },
      { label: 'enable_* only discourages', sql: `SET enable_seqscan = off;
EXPLAIN SELECT * FROM orders WHERE note = 'x';
RESET enable_seqscan;`,
        note: 'There is no index on `note`, so a seq scan is the only path and it is still used. PostgreSQL 18 marks it `Disabled: true`.' },
    ],
  },
  production: {
    title: 'Moving a reporting database to NVMe without telling the planner',
    context: 'An analytics team migrated a 400 GB database to NVMe storage with a much larger RAM cache. Configuration was copied from the old spinning-disk server, including `random_page_cost = 4` and `effective_cache_size = 4GB`.',
    problem: 'Dashboards filtering on scattered columns kept choosing full sequential scans of large tables, even when the filter matched well under 1% of rows. The planner was still pricing every random read at four sequential reads and assumed almost nothing was cached.',
    solution: 'Tell the planner what the hardware now is, then verify plan by plan. Lower `random_page_cost` to about 1.1 (random reads on flash cost about the same as sequential ones), and set `effective_cache_size` to roughly shared_buffers plus the OS page cache. Both can be set per database or per tablespace, so test on one first.',
    sql: `ALTER DATABASE analytics SET random_page_cost = 1.1;
ALTER DATABASE analytics SET effective_cache_size = '48GB';
-- or only for the tablespace on flash:
ALTER TABLESPACE fast_nvme SET (random_page_cost = 1.1);`,
    outcome: 'On the playground table, at 1.1 the 1% scattered-column bitmap plan drops from cost 999 to 661, plain index scans win at 40–50% of the table, and the seq scan wins only from 70% instead of 50%. On a large table the same shift turns many seq scans into index plans. Check the slow queries with `EXPLAIN (ANALYZE, BUFFERS)` before and after.',
  },
  pitfalls: [
    { title: 'Testing plans with enable_seqscan = off',
      symptom: 'An index plan looks great in a session with `enable_seqscan = off`, but production keeps choosing the seq scan.',
      cause: 'The `enable_*` flags do not forbid a node. They add a huge penalty, so the comparison is no longer the one the planner makes. A plan you forced is not evidence that it is cheaper.',
      fix: 'Use the flag only to see the alternative\'s cost. Then fix the inputs: statistics (`ANALYZE`, a higher statistics target) or cost constants. Compare `EXPLAIN (ANALYZE, BUFFERS)` runs, not costs alone.' },
    { title: 'Comparing cost numbers across queries',
      symptom: 'A team ranks queries by EXPLAIN cost and is surprised when the "cheapest" one is the slowest in production.',
      cause: 'Costs are arbitrary units built on estimates. They are only meaningful for choosing between plans for **the same query**. Wrong row estimates make them wrong in any case.',
      fix: 'Rank queries by measured time and buffers (`pg_stat_statements`, `EXPLAIN ANALYZE`). Use costs to understand why one plan beat another.' },
    { title: 'Leaving random_page_cost at the spinning-disk default',
      symptom: 'On SSD or a fully cached database, selective queries on scattered columns still get sequential scans or bitmap scans when an index scan would be faster.',
      cause: 'The default 4.0 assumes random reads are expensive and that about 90% of them hit cache. On flash, a random read costs about the same as a sequential one.',
      fix: 'Set `random_page_cost` close to `seq_page_cost` (1.1 is common for SSD) and size `effective_cache_size` honestly. Change one setting at a time and re-check key plans.',
      sql: `ALTER SYSTEM SET random_page_cost = 1.1;
SELECT pg_reload_conf();` },
  ],
  pointers: [
    'Unit: one sequential page = `seq_page_cost` **1.0**. Defaults: random page **4.0**, row **0.01**, index entry **0.005**, operator **0.0025**.',
    'Seq scan = **pages × seq_page_cost + rows × cpu_tuple_cost**, plus `cpu_operator_cost` per qual per row. It does not depend on selectivity.',
    'Index scans cost heap fetches between "sequential" and "random" depending on **correlation**. Bitmap scans read each heap page once, in physical order.',
    'Every plan shows **startup..total** cost. LIMIT and EXISTS favour low startup cost.',
    '`enable_*` flags only discourage a node (`Disabled: true`). `effective_cache_size` is a costing hint, not an allocation.',
  ],
  sources: ['runtime-config-query.html', 'using-explain.html', 'index-cost-estimation.html', 'sql-explain.html', 'view-pg-stats.html'],
}
