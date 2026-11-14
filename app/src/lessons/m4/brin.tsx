import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Bar, Btn, Msg, Slider, Tiles } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a heap of 64 blocks (10 rows each in the demo) and its BRIN index: one summary tuple
 * per block range of `pages_per_range` blocks. A query reads every block of every range whose
 * summary is consistent with the predicate (a lossy bitmap) and rechecks each row.
 * minmax keeps one [min, max] per range; minmax-multi keeps several intervals (values_per_range),
 * so one outlier no longer widens the whole range. Blocks appended after the last summarization
 * have no summary and must always be read.
 * ---------------------------------------------------------------------------------------------- */

const BASE_BLOCKS = 64, ROWS = 10, WINDOW = 25
type Data = 'append' | 'outliers' | 'shuffled'
type Opc = 'minmax' | 'multi'

function rng(seed: number) { return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) }

function makeHeap(data: Data, blocks: number): number[][] {
  const vals = Array.from({ length: blocks * ROWS }, (_, i) => i)
  if (data === 'shuffled') {
    const r = rng(5)
    const base = vals.slice(0, BASE_BLOCKS * ROWS)
    for (let i = base.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [base[i], base[j]] = [base[j], base[i]] }
    vals.splice(0, base.length, ...base)
  }
  const heap = Array.from({ length: blocks }, (_, b) => vals.slice(b * ROWS, (b + 1) * ROWS))
  if (data === 'outliers') { heap[5][3] = 610; heap[22][7] = 15; heap[41][2] = 590; heap[50][5] = 120 }
  return heap
}

type Summary = { iv: [number, number][] } | null
function summarize(vals: number[], opc: Opc): Summary {
  const s = [...vals].sort((a, b) => a - b)
  if (opc === 'minmax') return { iv: [[s[0], s[s.length - 1]]] }
  // minmax-multi: split at the 2 largest gaps → up to 3 intervals
  const gaps = s.slice(1).map((v, i) => [v - s[i], i] as const).sort((a, b) => b[0] - a[0]).slice(0, 2).map(([, i]) => i).sort((a, b) => a - b)
  const iv: [number, number][] = []
  let start = 0
  for (const g of gaps) { iv.push([s[start], s[g]]); start = g + 1 }
  iv.push([s[start], s[s.length - 1]])
  return { iv }
}
const hits = (sm: Summary, lo: number, hi: number) => sm === null || sm.iv.some(([a, b]) => a <= hi && b >= lo)

function BrinViz() {
  const [data, setData] = useState<Data>('append')
  const [opc, setOpc] = useState<Opc>('minmax')
  const [ppr, setPpr] = useState(8)
  const [lo, setLo] = useState(300)
  const [extra, setExtra] = useState(0) // appended blocks
  const [summarizedUpTo, setSumm] = useState(BASE_BLOCKS)
  const blocks = BASE_BLOCKS + extra
  const heap = useMemo(() => makeHeap(data, blocks), [data, blocks])
  const hi = lo + WINDOW - 1
  const ranges = useMemo(() => {
    const out: { start: number; end: number; sm: Summary }[] = []
    for (let s = 0; s < blocks; s += ppr) {
      const end = Math.min(blocks, s + ppr)
      // ranges existing at the last summarization keep (and widen) a summary; later ranges have none
      out.push({ start: s, end, sm: s < summarizedUpTo ? summarize(heap.slice(s, end).flat(), opc) : null })
    }
    return out
  }, [heap, ppr, opc, blocks, summarizedUpTo])
  const readRanges = ranges.filter((r) => hits(r.sm, lo, hi))
  const readBlocks = new Set(readRanges.flatMap((r) => Array.from({ length: r.end - r.start }, (_, i) => r.start + i)))
  const matchBlocks = new Set(heap.flatMap((b, i) => (b.some((v) => v >= lo && v <= hi) ? [i] : [])))
  const matches = heap.flat().filter((v) => v >= lo && v <= hi).length
  const rechecked = readBlocks.size * ROWS
  const msg = data === 'shuffled'
    ? `Shuffled rows give **every range** a summary close to [0, ${BASE_BLOCKS * ROWS - 1}], so every range is consistent with any query. BRIN cannot skip anything: the planner picks a seq scan.`
    : ranges.some((r) => r.sm === null)
      ? `Blocks ${summarizedUpTo}–${blocks - 1} were appended after the last summarization. Their range has **no summary**, so it is always read. VACUUM or \`brin_summarize_new_values()\` fixes that.`
      : data === 'outliers' && opc === 'minmax'
        ? 'A single far-off value stretches its range\'s **min..max** across the whole domain, so that range is read for almost every query. Switch to **minmax-multi** to keep it narrow.'
        : `Rows arrive in value order, so each range covers a narrow band. Only ${readRanges.length} of ${ranges.length} ranges overlap the query: ${readBlocks.size} of ${blocks} blocks read, all others skipped.`
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Data" value={data} onChange={(d) => { setData(d); setExtra(0); setSumm(BASE_BLOCKS) }} options={[['append', 'append-only (correlated)'], ['outliers', 'with outliers'], ['shuffled', 'shuffled']]} />
        <Segmented label="Operator class" value={opc} onChange={setOpc} options={[['minmax', 'minmax'], ['multi', 'minmax-multi']]} />
        <Segmented label="pages_per_range" value={String(ppr)} onChange={(v) => setPpr(+v)} options={[['4', 'ppr 4'], ['8', 'ppr 8'], ['16', 'ppr 16']]} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Slider label="WHERE ts BETWEEN" value={lo} min={0} max={BASE_BLOCKS * ROWS - WINDOW} onChange={setLo} show={`${lo}..${hi}`} />
        <Btn primary testid="viz-next" onClick={() => setLo((x) => (x + 60) % (BASE_BLOCKS * ROWS - WINDOW))}>Slide query</Btn>
        <Btn onClick={() => setExtra((x) => Math.min(16, x + 4))} disabled={extra >= 16 || data === 'shuffled'}>INSERT 4 blocks</Btn>
        <Btn onClick={() => setSumm(blocks)} disabled={summarizedUpTo >= blocks}>VACUUM (summarize)</Btn>
      </div>
      <Tiles items={[['BRIN entries', ranges.length], ['Blocks read (lossy)', `${readBlocks.size} / ${blocks}`, readBlocks.size > blocks * 0.5 ? 'dead' : 'ok'], ['Blocks with matches', matchBlocks.size], ['Rows rechecked → kept', `${rechecked} → ${matches}`]]} />
      <Msg k={`${data}-${opc}-${ppr}-${extra}-${summarizedUpTo}-${readRanges.length}`} text={msg} />
      <Legend items={[['header', 'range summary (index tuple)'], ['new', 'range consistent with query: read'], ['ok', 'block holding matching rows'], ['muted', 'skipped'], ['dead', 'unsummarized range']]} />
      <div className="grid gap-1.5 rounded-lg border border-line bg-bg p-2">
        {ranges.map((r) => {
          const read = hits(r.sm, lo, hi)
          return (
            <motion.div layout key={`${r.start}-${ppr}`} className="grid grid-cols-[minmax(130px,190px)_1fr] items-center gap-2">
              <div className="rounded border px-1.5 py-0.5 font-mono text-[10.5px]" style={{ borderColor: tone(r.sm ? (read ? 'new' : 'header') : 'dead'), background: toneBg(r.sm ? (read ? 'new' : 'header') : 'dead', read ? 18 : 8) }}>
                <span className="text-muted">blk {r.start}–{r.end - 1}: </span>
                {r.sm ? r.sm.iv.map(([a, b]) => (a === b ? `${a}` : `${a}..${b}`)).join(' ∪ ') : 'not summarized'}
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: r.end - r.start }, (_, i) => {
                  const b = r.start + i
                  const m = matchBlocks.has(b)
                  return (
                    <motion.div key={b} title={`block ${b}: ${Math.min(...heap[b])}..${Math.max(...heap[b])}`} initial={false}
                      animate={{ backgroundColor: m && read ? tone('ok') : read ? toneBg('new', 45) : toneBg('muted', 14), scale: m && read ? 1.08 : 1 }}
                      className="h-5 min-w-[8px] max-w-[44px] flex-1 rounded-[3px] sm:h-6" />
                  )
                })}
              </div>
            </motion.div>
          )
        })}
      </div>
      <Panel title="200000 rows, 1082 heap pages, one hour out of 23 days">
        <div className="grid gap-1.5">
          <Bar label="B-tree size" value={4408} max={4408} t="tuple" note="4408 kB" />
          <Bar label="BRIN size" value={24} max={4408} t="ok" win note="24 kB" />
          <Bar label="append-only: read" value={21} max={1088} t="ok" win note="21 buffers" />
          <Bar label="shuffled: read" value={1088} max={1088} t="dead" note="1088 (seq scan)" />
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE readings (ts timestamptz NOT NULL, device int NOT NULL, val real NOT NULL);
INSERT INTO readings
SELECT timestamptz '2026-01-01' + g * interval '10 seconds', g % 50, (g % 1000) / 10.0
FROM generate_series(1, 200000) g;
CREATE TABLE shuffled AS SELECT * FROM readings ORDER BY hashint4(device * 7 + extract(epoch FROM ts)::int);
CREATE INDEX readings_brin ON readings USING brin (ts) WITH (pages_per_range = 16);
CREATE INDEX shuffled_brin ON shuffled USING brin (ts) WITH (pages_per_range = 16);
VACUUM ANALYZE readings;
VACUUM ANALYZE shuffled;`

export const lesson: Lesson = {
  slug: 'brin',
  module: 'm4',
  order: 8,
  title: 'BRIN for huge append-only tables',
  tldr: [
    'A BRIN index stores one tiny **summary** (such as the min and max value) per **block range** of consecutive heap pages, so it stays a few kilobytes even for a table of gigabytes.',
    'When a column follows the physical row order, as timestamps do in an append-only log, those summaries let a scan skip almost every block for the cost of reading a handful of index pages.',
  ],
  visualizer: {
    title: 'Block ranges, summaries and what a query must read',
    caption: 'Slide the query window and watch which ranges are consistent with it. Then add outliers, shuffle the rows, change `pages_per_range`, append unsummarized blocks, and compare minmax with minmax-multi.',
    Component: BrinViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: SETUP,
    presets: [
      { label: 'Tiny index', sql: `CREATE INDEX readings_btree ON readings (ts);
SELECT relname, relpages, pg_size_pretty(pg_relation_size(oid)) AS size
FROM pg_class WHERE relname IN ('readings', 'readings_brin', 'readings_btree');
SELECT tablename, correlation FROM pg_stats WHERE attname = 'ts';
DROP INDEX readings_btree;`,
        note: '1082 heap pages need only **68** range summaries (16 pages each): 24 kB of BRIN against about 4.4 MB of B-tree. `correlation` is 1 for `readings` and close to 0 for `shuffled`.' },
      { label: 'Read the summaries', sql: `SELECT itemoffset, blknum, value
FROM brin_page_items(get_raw_page('readings_brin', 2), 'readings_brin') LIMIT 4;

SELECT itemoffset, blknum, value
FROM brin_page_items(get_raw_page('shuffled_brin', 2), 'shuffled_brin') LIMIT 4;`,
        note: 'Each tuple covers 16 blocks starting at `blknum`. In `readings` each summary spans about 8 hours. In `shuffled` every summary spans the whole 23 days, so it can never exclude anything.' },
      { label: 'Lossy bitmap scan', sql: `EXPLAIN (ANALYZE, TIMING OFF)
SELECT count(*) FROM readings
WHERE ts >= '2026-01-10' AND ts < '2026-01-10 01:00';`,
        note: '`Heap Blocks: lossy=16`: one matching range, all 16 of its pages read. `Rows Removed by Index Recheck: 2600` are the rows on those pages outside the hour. About 21 buffers in total.' },
      { label: 'Uncorrelated: useless', sql: `EXPLAIN (ANALYZE, TIMING OFF)
SELECT count(*) FROM shuffled
WHERE ts >= '2026-01-10' AND ts < '2026-01-10 01:00';`,
        note: 'Same query, same index type, shuffled rows: every range matches, so the planner does a **Seq Scan** of all 1088 pages.' },
      { label: 'New rows: unsummarized', sql: `INSERT INTO readings
SELECT timestamptz '2026-03-01' + g * interval '10 seconds', g % 50, 0 FROM generate_series(1, 20000) g;
SELECT count(*) AS summaries FROM brin_page_items(get_raw_page('readings_brin', 2), 'readings_brin');
SELECT brin_summarize_new_values('readings_brin') AS ranges_summarized;
SELECT count(*) AS summaries FROM brin_page_items(get_raw_page('readings_brin', 2), 'readings_brin');`,
        note: 'Pages appended after the index was built have no summary until VACUUM, `autosummarize`, or `brin_summarize_new_values()` processes them. Until then every scan must read them. Here 68 summaries become **75**.' },
      { label: 'minmax-multi and bloom', sql: `CREATE INDEX readings_val_multi ON readings USING brin (val float4_minmax_multi_ops (values_per_range = 16));
CREATE INDEX readings_dev_bloom ON readings USING brin (device int4_bloom_ops (false_positive_rate = 0.01));
SELECT indexrelid::regclass AS index, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index WHERE indrelid = 'readings'::regclass;`,
        note: '**minmax-multi** stores several intervals per range (good with outliers). **bloom** stores a Bloom filter for equality on values that are not ordered. Both are still lossy.' },
    ],
  },
  production: {
    title: 'Indexing a 2-billion-row sensor table without doubling its size',
    context: 'An IoT platform appends about 3,000 readings per second to `readings(ts, device_id, value)`. Almost every query asks for a time window: the last hour, yesterday, one week last March.',
    problem: 'A B-tree on `ts` was larger than a fifth of the table, every insert had to update it, and it no longer fit in memory. Dropping it made window queries scan the whole table.',
    solution: 'Rows arrive in time order, so `ts` is almost perfectly correlated with physical position. Replace the B-tree with a BRIN index and turn on `autosummarize` so each filled range is summarized by autovacuum soon after it fills.',
    sql: `CREATE INDEX CONCURRENTLY readings_ts_brin ON readings USING brin (ts)
  WITH (pages_per_range = 32, autosummarize = on);
DROP INDEX CONCURRENTLY readings_ts_btree;`,
    outcome: 'In the playground the BRIN index is 24 kB against 4.4 MB for a B-tree on the same 200000 rows (about 180× smaller), and a one-hour query reads 21 buffers instead of 1088. Inserts barely touch the index, because a range\'s summary changes only when a new value widens it.',
  },
  pitfalls: [
    { title: 'BRIN on a column that does not follow physical order',
      symptom: 'The BRIN index exists, but EXPLAIN shows a seq scan or a bitmap scan reading nearly every block.',
      cause: 'If values are scattered across the table, every range\'s min..max covers almost the full domain. Updates make this worse over time, because moved rows land wherever there is space.',
      fix: 'Check `correlation` in `pg_stats` (close to ±1 is good). Use BRIN only for append-mostly data, or physically order the table first (`CLUSTER` with a B-tree, then switch).',
      sql: `SELECT attname, correlation FROM pg_stats WHERE tablename = 'readings';` },
    { title: 'Freshly inserted ranges are never skipped',
      symptom: 'Queries for the most recent data read more and more blocks until the next VACUUM.',
      cause: 'New pages beyond the last summarized range have no summary. `autosummarize` is **off** by default, so they wait for VACUUM.',
      fix: 'Create the index `WITH (autosummarize = on)` or call `brin_summarize_new_values()` from your loader.' },
    { title: 'Outliers and backfills widen ranges',
      symptom: 'After a backfill of old data or a few bad timestamps, BRIN scans read many more blocks than before.',
      cause: 'A **minmax** summary only ever widens. One far-off value makes its whole range match almost every query.',
      fix: 'Use `minmax-multi` opclasses, or `brin_desummarize_range()` plus re-summarize after fixing the data.' },
  ],
  pointers: [
    'One index tuple per **block range** (`pages_per_range`, default **128** pages). Index size ≈ table pages / pages_per_range.',
    'BRIN scans are always **bitmap** and always **lossy**: every page of a matching range is read and every row rechecked.',
    'Useful only when values follow **physical order** (`pg_stats.correlation` near ±1): append-only logs, time series, IoT.',
    'Opclass kinds: **minmax**, **minmax-multi** (outliers), **inclusion** (ranges, boxes, inet), **bloom** (equality).',
    'New ranges stay unsummarized until VACUUM, `autosummarize = on` (default off) or `brin_summarize_new_values()`. BRIN pairs well with [Declarative partitioning](/m7/partitioning) by time.',
  ],
  sources: ['brin.html', 'sql-createindex.html', 'indexes-types.html', 'functions-admin.html', 'pageinspect.html'],
}
