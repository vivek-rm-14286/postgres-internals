import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { EditionTag, Msg, Stat, type Edition } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1: the playground's `readings` table (200,000 rows, one per second from 2026-01-01 00:00 UTC).
 * Measured on PostgreSQL 18: 1274 heap pages, 157 rows per page, BRIN with pages_per_range = 32 → 40 block
 * ranges; a 1-hour query from 2026-01-02 00:00 reads lossy=32 blocks and rechecks away 1424 rows.
 * The shuffled copy has 1280 pages and every range spans the whole time axis: lossy=1280, 196,400 removed.
 * Sizes: heap 10192 kB, B-tree on time 4408 kB, BRIN 24 kB.
 * ---------------------------------------------------------------------------------------------- */

const N = 200_000, RPP = 157, PPR = 32
type Order = 'ordered' | 'shuffled'
const PAGES: Record<Order, number> = { ordered: 1274, shuffled: 1280 }
const RANGES = 40

function rangeSpan(order: Order, r: number) {
  if (order === 'shuffled') return { lo: 0, hi: N - 1, pages: Math.min(PPR, PAGES.shuffled - r * PPR) }
  const p0 = r * PPR, p1 = Math.min(PAGES.ordered, p0 + PPR)
  return { lo: p0 * RPP, hi: Math.min(N, p1 * RPP) - 1, pages: p1 - p0 }
}

const WIDTHS: [string, string][] = [['600', '10 min'], ['3600', '1 hour'], ['21600', '6 hours']]

function BrinViz() {
  const [order, setOrder] = useState<Order>('ordered')
  const [startH, setStartH] = useState(24)
  const [width, setWidth] = useState('3600')
  const w = +width
  const qlo = startH * 3600, qhi = Math.min(N, qlo + w) // [qlo, qhi)
  const hits: boolean[] = []
  let lossy = 0, read = 0
  for (let r = 0; r < RANGES; r++) {
    const s = rangeSpan(order, r)
    const hit = s.hi >= qlo && s.lo < qhi
    hits.push(hit)
    if (hit) { lossy += s.pages; read += order === 'shuffled' ? Math.round((s.pages / PAGES.shuffled) * N) : s.hi - s.lo + 1 }
  }
  if (order === 'shuffled') read = N
  const matched = Math.max(0, qhi - qlo)
  const removed = read - matched
  const X0 = 64, X1 = 628
  const x = (sec: number) => X0 + (sec / N) * (X1 - X0)
  const rowH = 6.4, Y0 = 34
  const hours = [0, 12, 24, 36, 48]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Physical row order" value={order} onChange={setOrder} options={[['ordered', 'Inserted in time order'], ['shuffled', 'Shuffled']]} />
        <Segmented label="Query window" value={width} onChange={setWidth} options={WIDTHS} />
        <button type="button" data-testid="viz-next" onClick={() => setStartH((h) => (h + 6 > 54 ? 0 : h + 6))}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent">Move window +6 h</button>
      </div>
      <label className="flex items-center gap-3 text-xs text-muted">
        <span className="whitespace-nowrap">window start</span>
        <input type="range" min={0} max={54} step={0.25} value={startH} onChange={(e) => setStartH(+e.target.value)} className="min-w-24 flex-1 accent-[var(--accent)]" aria-label="Query window start (hours)" />
        <span className="font-mono tabular-nums">+{startH.toFixed(2)} h</span>
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="block ranges hit" value={`${hits.filter(Boolean).length} / ${RANGES}`} t={order === 'ordered' ? 'ok' : 'dead'} />
        <Stat label="Heap Blocks: lossy" value={lossy} t={order === 'ordered' ? 'ok' : 'dead'} />
        <Stat label="rows returned" value={matched.toLocaleString('en-US')} />
        <Stat label="removed by recheck" value={removed.toLocaleString('en-US')} t={removed > 50_000 ? 'dead' : undefined} />
      </div>
      <Legend items={[['tuple', 'block range (min to max time)'], ['ok', 'range overlaps the query'], ['accent', 'query window']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 316" className="w-full min-w-[560px]" role="img" aria-label="BRIN block ranges on a time axis">
          {hours.map((h) => (
            <g key={h}>
              <line x1={x(h * 3600)} x2={x(h * 3600)} y1={22} y2={Y0 + RANGES * rowH} stroke="var(--border)" strokeDasharray="2 3" />
              <text x={x(h * 3600)} y={16} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">+{h} h</text>
            </g>
          ))}
          <motion.rect initial={false} animate={{ x: x(qlo), width: Math.max(2, x(qhi) - x(qlo)) }} transition={{ type: 'spring', stiffness: 200, damping: 26 }}
            y={22} height={RANGES * rowH + 16} fill={toneBg('accent', 22)} stroke={tone('accent')} strokeWidth={1} />
          {Array.from({ length: RANGES }, (_, r) => {
            const s = rangeSpan(order, r)
            const y = Y0 + r * rowH
            return (
              <g key={r}>
                {r % 10 === 0 && <text x={X0 - 6} y={y + 5} textAnchor="end" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">range {r}</text>}
                <motion.rect initial={false} animate={{ x: x(s.lo), width: Math.max(2, x(s.hi) - x(s.lo)) }} transition={{ type: 'spring', stiffness: 140, damping: 22, delay: r * 0.006 }}
                  y={y} height={rowH - 1.6} rx={1.5} fill={hits[r] ? tone('ok') : toneBg('tuple', 45)} />
              </g>
            )
          })}
          <text x={X0} y={Y0 + RANGES * rowH + 24} fontSize={10.5} fill="var(--text)" fontFamily="var(--font-mono)">
            {order === 'ordered' ? `each range = 32 pages ≈ ${(PPR * RPP).toLocaleString('en-US')} consecutive seconds` : 'every range holds rows from the whole 55-hour span'}
          </text>
        </svg>
      </div>
      <Msg id={`${order}-${width}-${hits.filter(Boolean).length}`}>
        <Md>{order === 'ordered'
          ? `Rows arrived in time order, so each 32-page range covers a **narrow, non-overlapping** slice of time. The BRIN index keeps only a min and max per range and still narrows the scan to **${lossy} pages**. The bitmap is lossy, so every row on those pages is rechecked.`
          : 'The same rows in random physical order. Every range now holds both the oldest and newest timestamps, so **every range matches** and the "index" scan reads the whole table. BRIN only works when physical order follows the column.'}</Md>
      </Msg>
      <Panel title="Index size for the same 200,000 rows">
        <div className="grid gap-1.5">
          {([['heap (the table)', 10192, 'muted'], ['B-tree on time', 4408, 'pointer'], ['BRIN on time', 24, 'ok']] as const).map(([k, kb, t]) => (
            <div key={k} className="grid grid-cols-[110px_1fr_76px] items-center gap-2 text-xs">
              <span className="text-muted">{k}</span>
              <div className="h-3 overflow-hidden rounded-full border border-line bg-surface-2">
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.max(0.6, (kb / 10192) * 100)}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} style={{ background: tone(t) }} />
              </div>
              <span className="text-right font-mono tabular-nums">{kb.toLocaleString('en-US')} kB</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------
 * Visualizer 2: what each TimescaleDB edition contains (feature split from the editions page; Neon
 * ships the Apache edition, 2.24.0 on PostgreSQL 18).
 * ---------------------------------------------------------------------------------------------- */

type Where = 'apache' | 'community' | 'neon' | 'cloud'
const FEATURES: { f: string; ed: Edition; lesson: string }[] = [
  { f: 'Hypertables and chunks (`CREATE TABLE … WITH (tsdb.hypertable)`)', ed: 'apache', lesson: 'E2.2' },
  { f: '`show_chunks`, `drop_chunks`, `add_dimension`, size functions', ed: 'apache', lesson: 'E2.2' },
  { f: '`time_bucket`, `first`, `last`, `histogram`', ed: 'apache', lesson: 'E2.3' },
  { f: '`time_bucket_gapfill`, `locf`, `interpolate`', ed: 'community', lesson: 'E2.3' },
  { f: 'Continuous aggregates and refresh policies', ed: 'community', lesson: 'E2.4' },
  { f: 'Columnstore (compression) and its policies', ed: 'community', lesson: 'E2.5' },
  { f: 'Retention policies, `add_job` and the job scheduler', ed: 'community', lesson: 'E2.6' },
  { f: 'SkipScan, `reorder_chunk`, `move_chunk`', ed: 'community', lesson: 'E2.2' },
  { f: 'Tiering chunks to object storage', ed: 'cloud', lesson: 'E2.6' },
]
const has = (w: Where, ed: Edition) => ed === 'apache' || (ed === 'community' && (w === 'community' || w === 'cloud')) || (ed === 'cloud' && w === 'cloud')
const WHERE_NOTE: Record<Where, string> = {
  apache: '`timescaledb.license = \'apache\'`. Only Apache-2.0 code paths load, so anyone may offer it as a service.',
  community: 'The default, `timescaledb.license = \'timescale\'`, under the Tiger Data License: free to self-host and modify, but you may not sell it as a service.',
  neon: 'This managed service ships the Apache edition only. Compression and every other Community feature are unavailable.',
  cloud: 'Tiger Cloud, the managed service, runs the Community edition and adds tiered storage.',
}

function EditionViz() {
  const [w, setW] = useState<Where>('apache')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Where TimescaleDB runs" value={w} onChange={setW} options={[['apache', 'Apache 2 edition'], ['community', 'Community edition'], ['neon', 'Neon'], ['cloud', 'Tiger Cloud']]} />
      </div>
      <p className="text-sm text-muted"><Md>{WHERE_NOTE[w]}</Md></p>
      <div className="grid gap-1.5">
        {FEATURES.map((x) => {
          const on = has(w, x.ed)
          return (
            <motion.div key={x.f} layout animate={{ opacity: on ? 1 : 0.45 }} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-[13px]"
              style={{ borderColor: on ? tone('ok') : 'var(--border)', background: on ? toneBg('ok', 10) : 'transparent', borderStyle: on ? 'solid' : 'dashed' }}>
              <span className="min-w-0"><span className="mr-2 font-mono text-xs" style={{ color: on ? tone('ok') : 'var(--muted)' }}>{on ? 'yes' : 'no'}</span><Md>{x.f}</Md></span>
              <span className="flex items-center gap-2"><EditionTag ed={x.ed} /><span className="font-mono text-[11px] text-muted">{x.lesson}</span></span>
            </motion.div>
          )
        })}
      </div>
      <p className="text-xs text-muted"><Md>{'Check a running server with `SHOW timescaledb.license;`. A Community feature on the Apache edition fails with `functionality not supported under the current "apache" license`.'}</Md></p>
    </div>
  )
}

function Viz() {
  const [tab, setTab] = useState<'brin' | 'ed'>('brin')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Segmented label="View" value={tab} onChange={setTab} options={[['brin', 'Plain PostgreSQL: BRIN on time'], ['ed', 'What TimescaleDB adds']]} />
      {tab === 'brin' ? <BrinViz /> : <EditionViz />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'time-series-basics',
  module: 'e2',
  order: 1,
  title: 'Time-series data on PostgreSQL',
  tldr: [
    '**Time-series data** is a stream of timestamped measurements that arrive roughly in time order, are rarely changed, are read by time range and are deleted when they age out.',
    'Plain PostgreSQL already handles it with **BRIN indexes**, **range partitioning** and `date_bin`, and **TimescaleDB** packages those ideas as an extension that automates partitioning, rollups, compression and retention.',
  ],
  visualizer: {
    title: 'Why time order makes a 24 kB index work',
    caption: 'Drag the query window across 200,000 rows and watch which BRIN block ranges match. Switch to **Shuffled** to see the same index read the whole table, then open **What TimescaleDB adds** for the edition split.',
    Component: Viz,
  },
  playground: {
    setup: `
SET TIME ZONE 'UTC';
-- 200,000 readings, one per second, 4 sensors taking turns
CREATE TABLE readings (
  time        timestamptz NOT NULL,
  sensor_id   int NOT NULL,
  temperature double precision
);
INSERT INTO readings
SELECT timestamptz '2026-01-01' + make_interval(secs => i), 1 + i % 4, round((20 + 5 * sin(i / 3000.0))::numeric, 2)
FROM generate_series(0, 199999) i;
CREATE INDEX readings_brin ON readings USING brin (time) WITH (pages_per_range = 32);
ANALYZE readings;`,
    presets: [
      { label: 'Physical order', sql: `SELECT pg_relation_size('readings') / 8192 AS heap_pages,
       pg_size_pretty(pg_relation_size('readings')) AS heap_size,
       round(200000.0 / (pg_relation_size('readings') / 8192)) AS rows_per_page;

SELECT attname, correlation
FROM pg_stats WHERE tablename = 'readings' AND attname IN ('time', 'sensor_id');`,
        note: '`correlation` = **1** for `time`: physical order matches time order exactly, because rows were appended as they arrived. `sensor_id` is near 0.25, so BRIN would be useless on it.' },
      { label: 'BRIN: one hour', sql: `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT count(*) FROM readings
WHERE time >= '2026-01-02 00:00' AND time < '2026-01-02 01:00';`,
        note: '`Heap Blocks: lossy=32` is one block range. BRIN knows only min and max per range, so it returns whole pages and **Rows Removed by Index Recheck: 1424** are filtered out.' },
      { label: 'B-tree vs BRIN size', sql: `CREATE INDEX readings_btree ON readings (time);

SELECT indexrelid::regclass AS index, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index WHERE indrelid = 'readings'::regclass;

DROP INDEX readings_btree;`,
        note: 'The B-tree has one entry per row (**4408 kB**). BRIN has one summary per 32 pages (**24 kB**, three pages). The B-tree is dropped again so later presets use BRIN.' },
      { label: 'Bucket by hour', sql: `SELECT date_bin('1 hour', time, timestamptz '2000-01-03') AS hour,
       sensor_id, round(avg(temperature)::numeric, 2) AS avg_temp, count(*) AS n
FROM readings
WHERE time < '2026-01-01 03:00'
GROUP BY 1, 2 ORDER BY 1, 2;`,
        note: '`date_bin` is the native `time_bucket`: it maps each timestamp to the start of its bucket. Each sensor reports 900 times per hour. The origin `2000-01-03` matches the TimescaleDB default.' },
      { label: 'Shuffled: BRIN breaks', sql: `CREATE TABLE readings_shuffled AS SELECT * FROM readings ORDER BY random();
CREATE INDEX ON readings_shuffled USING brin (time) WITH (pages_per_range = 32);
ANALYZE readings_shuffled;

SELECT round(correlation::numeric, 3) AS correlation FROM pg_stats
WHERE tablename = 'readings_shuffled' AND attname = 'time';

SET enable_seqscan = off;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT count(*) FROM readings_shuffled
WHERE time >= '2026-01-02 00:00' AND time < '2026-01-02 01:00';
RESET enable_seqscan;`,
        note: 'Same rows, random physical order: correlation is near **0**. Every range matches, so the plan reads **lossy=1280** blocks (the whole table) and rechecks away 196,400 rows.' },
      { label: 'Latest reading needs a B-tree', sql: `EXPLAIN (COSTS OFF)
SELECT * FROM readings ORDER BY time DESC LIMIT 1;

CREATE INDEX readings_time_desc ON readings (time DESC);
EXPLAIN (COSTS OFF)
SELECT * FROM readings ORDER BY time DESC LIMIT 1;`,
        note: 'BRIN can filter but cannot return rows in order, so "latest row" is a full scan plus a top-N sort. A B-tree on `time DESC` (the index TimescaleDB creates by default) turns it into a one-row index scan.' },
    ],
  },
  production: {
    title: 'Keeping 30 days of 1 Hz sensor data in plain PostgreSQL',
    context: 'An IoT platform stores one reading per second from 5,000 sensors in a single table: **432 million rows a day**. Dashboards query the last few hours, and data older than 30 days is deleted every night.',
    problem: 'The B-tree on `time` grew with every row and no longer fit in memory. The nightly `DELETE` rewrote nothing on disk: it left millions of dead tuples, autovacuum ran all day, and the table never shrank.',
    solution: 'Partition by day, index time ranges with **BRIN** (rows arrive in time order) and keep a B-tree only for "latest per sensor". Retention becomes `DROP TABLE` of a whole partition. A hypertable does the same with less code: chunks are created on demand and `drop_chunks` handles retention. Both of those are in the Apache 2 edition.',
    sql: `-- native PostgreSQL
CREATE TABLE readings (time timestamptz NOT NULL, sensor_id int NOT NULL, temperature float8)
  PARTITION BY RANGE (time);
CREATE INDEX ON readings USING brin (time);
CREATE INDEX ON readings (sensor_id, time DESC);

-- TimescaleDB: CREATE TABLE … WITH needs 2.20+ (2.22+ on the Apache 2 edition);
-- everything below is in the Apache 2 edition
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE TABLE readings (time timestamptz NOT NULL, sensor_id int NOT NULL, temperature float8)
  WITH (tsdb.hypertable, tsdb.partition_column = 'time', tsdb.chunk_interval = '1 day');
SELECT drop_chunks('readings', older_than => INTERVAL '30 days');`,
    outcome: 'On 200,000 time-ordered rows, BRIN is **24 kB against 4408 kB** for the B-tree, about 180 times smaller, and still narrows a one-hour query to one 32-page range. Dropping a daily partition removes its files outright, so there are no dead tuples and no vacuum debt.',
  },
  pitfalls: [
    { title: 'BRIN on data that is not physically ordered',
      symptom: 'A BRIN index exists, yet `EXPLAIN ANALYZE` shows `Heap Blocks: lossy=` equal to nearly the whole table.',
      cause: 'BRIN stores min/max per block range. Backfills, updates and shuffled loads mix old and new timestamps into the same pages, so every range overlaps every query.',
      fix: 'Check `pg_stats.correlation` for the column (near 1 or -1 is good). Use BRIN only on append-ordered columns, partition so each partition stays ordered, or use a B-tree.',
      sql: `SELECT attname, correlation FROM pg_stats WHERE tablename = 'readings';` },
    { title: 'Retention with DELETE',
      symptom: 'Nightly deletes create WAL spikes and replication lag, autovacuum never finishes, and disk usage stays flat.',
      cause: '`DELETE` marks every row dead and logs every change. The space is reused only after VACUUM, and the file does not shrink: the freed pages are at the start of the table, and VACUUM can only give back empty pages at the end (see [VACUUM](/m7/vacuum)).',
      fix: 'Partition by time and drop whole partitions. With TimescaleDB, use `drop_chunks` (Apache 2 edition) or `add_retention_policy` (Community edition).',
      sql: `SELECT drop_chunks('readings', older_than => INTERVAL '30 days');` },
    { title: 'Expecting the full feature set on a managed service',
      symptom: '`ERROR: functionality not supported under the current "apache" license` when creating a continuous aggregate or enabling compression.',
      cause: 'Services that resell PostgreSQL may ship only the **Apache 2 edition**. Continuous aggregates, the columnstore, gap filling, policies and jobs are **Community edition** features under the Tiger Data License.',
      fix: 'Run `SHOW timescaledb.license;` before designing around a feature. Use the Community edition (self-hosted) or Tiger Cloud, or the native equivalents shown in this module.',
      sql: 'SHOW timescaledb.license;  -- apache | timescale' },
    { title: 'Monthly buckets with date_bin',
      symptom: '`ERROR: timestamps cannot be binned into intervals containing months or years`.',
      cause: '`date_bin` only accepts fixed-length strides. Months and years vary in length.',
      fix: 'Use `date_trunc(\'month\', time)` natively, or `time_bucket(\'1 month\', time)` with TimescaleDB, which supports month and year widths.' },
  ],
  pointers: [
    'Time-series = **append-mostly**, read by **time range**, deleted by **age**. Every tool in this module exploits one of those three facts.',
    '**BRIN** stores min/max per block range: tiny, and only useful when physical order follows the column (`correlation` near 1). More in [BRIN indexes](/m4/brin).',
    'Partition by time so queries **prune** to a few partitions and retention is a `DROP`, not a `DELETE`.',
    '**TimescaleDB** is an extension loaded through `shared_preload_libraries`. Version 2.32 supports PostgreSQL 16 to 18.',
    '**Apache 2 edition**: hypertables, `time_bucket`, `drop_chunks`. **Community edition**: continuous aggregates, columnstore, gap filling, policies and jobs. Some managed services offer only the Apache edition.',
  ],
  sources: ['brin.html', 'brin-intro.html', 'ddl-partitioning.html', 'functions-datetime.html', 'view-pg-stats.html', 'using-explain.html',
    'tigerdata.com/docs/get-started/choose-your-path/timescaledb-editions', 'neon.com/docs/extensions/timescaledb'],
}
