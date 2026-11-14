import { useMemo, useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Md } from '../../lesson/Md'
import { EditionTag, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: converting one rowstore chunk to the columnstore, as the docs describe it. Rows are grouped
 * by the segmentby column, ordered by orderby (time), cut into batches (up to 1000 rows; 4 here so it fits
 * on screen), and every batch becomes ONE row of per-column compressed arrays plus min/max metadata.
 * Scans skip batches by segment value and metadata before decompressing; DML decompresses only the
 * batches it touches into the chunk's rowstore part. Real sizes: playground (array + TOAST emulation,
 * 30,000 rows) 1568 kB → 216 kB; official demo 194 MB → 24 MB; "90%+ typical".
 * ---------------------------------------------------------------------------------------------- */

type Seg = 'device' | 'none' | 'id'
const DEV = ['A', 'B', 'C']
const TEMPS: Record<string, number[]> = { A: [21.5, 21.5, 21.6, 21.6], B: [19.0, 19.1, 19.1, 19.2], C: [23.4, 23.4, 23.5, 23.3] }
const ROWS = Array.from({ length: 12 }, (_, i) => {
  const d = DEV[i % 3]
  return { i, sec: i * 10, dev: d, temp: TEMPS[d][Math.floor(i / 3)] }
})
type R = (typeof ROWS)[number]
const ts = (sec: number) => `10:0${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
const QUERY_FROM = 60, QUERY_DEV = 'B', UPDATE_ROW = 7 // B at 10:01:10

function batchesFor(seg: Seg): { seg: string | null; rows: R[] }[] {
  if (seg === 'id') return ROWS.map((r) => ({ seg: `#${r.i + 1}`, rows: [r] }))
  if (seg === 'none') return [0, 1, 2].map((b) => ({ seg: null, rows: ROWS.slice(b * 4, b * 4 + 4) }))
  return DEV.map((d) => ({ seg: d, rows: ROWS.filter((r) => r.dev === d) }))
}
const groupsFor = (seg: Seg) => (seg === 'device' ? DEV.map((d) => ROWS.filter((r) => r.dev === d)) : seg === 'id' ? ROWS.map((r) => [r]) : [ROWS])

interface St { k: 'rows' | 'group' | 'batch' | 'arrays' | 'encode' | 'query' | 'update' }

function Cell({ id, children, t = 'tuple', w = 'w-auto', dim }: { id: string; children: React.ReactNode; t?: Tone; w?: string; dim?: boolean }) {
  return (
    <motion.span layout layoutId={id} transition={{ type: 'spring', stiffness: 190, damping: 24 }} animate={{ opacity: dim ? 0.35 : 1 }}
      className={`inline-block rounded border px-1 py-0.5 text-center font-mono text-[11px] leading-tight ${w}`}
      style={{ borderColor: tone(t), background: toneBg(t, 16) }}>{children}</motion.span>
  )
}

function RowLine({ r, hl }: { r: R; hl?: boolean }) {
  return (
    <motion.div layout className="flex gap-1" style={hl ? { outline: `2px solid ${tone('new')}`, borderRadius: 4 } : undefined}>
      <Cell id={`t${r.i}`} t="pointer">{ts(r.sec)}</Cell>
      <Cell id={`d${r.i}`} t="header">{r.dev}</Cell>
      <Cell id={`v${r.i}`} t="tuple">{r.temp.toFixed(1)}</Cell>
    </motion.div>
  )
}

function delta(rows: R[]) {
  const d = rows.slice(1).map((r, i) => r.sec - rows[i].sec)
  const dd = d.slice(1).map((x, i) => x - d[i])
  return { d, dd }
}

function render(seg: Seg, st: St) {
  const k = st.k
  if (k === 'rows' || k === 'group' || k === 'batch') {
    const groups = k === 'rows' ? [ROWS] : groupsFor(seg)
    return (
      <LayoutGroup>
        <div className="flex flex-wrap gap-3">
          {groups.map((g, gi) => (
            <motion.div layout key={gi} className="rounded-lg border border-line bg-surface p-2">
              <p className="mb-1 font-mono text-[11px] text-muted">{k === 'rows' ? 'rowstore chunk: heap tuples in arrival order' : seg === 'device' ? `segment device = ${g[0].dev}` : seg === 'id' ? `segment ${g[0].i + 1}` : 'no segmentby: one segment'}</p>
              <div className="grid gap-1">
                {g.map((r, ri) => (
                  <div key={r.i}>
                    {k === 'batch' && ri % 4 === 0 && <p className="mt-1 font-mono text-[10.5px] font-semibold" style={{ color: tone('accent') }}>batch {Math.floor(ri / 4) + 1}</p>}
                    <RowLine r={r} />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </LayoutGroup>
    )
  }
  const bs = batchesFor(seg)
  const opened = (b: { seg: string | null; rows: R[] }) => {
    if (seg === 'device' && b.seg !== QUERY_DEV) return false
    return b.rows[b.rows.length - 1].sec >= QUERY_FROM
  }
  const updated = (b: { rows: R[] }) => b.rows.some((r) => r.i === UPDATE_ROW)
  return (
    <LayoutGroup>
      <div className="grid gap-2">
        {k === 'update' && (
          <motion.div layout className="rounded-lg border p-2" style={{ borderColor: tone('new'), background: toneBg('new', 8) }}>
            <p className="mb-1 font-mono text-[11px]" style={{ color: tone('new') }}>rowstore part of the chunk (decompressed by the UPDATE)</p>
            <div className="grid gap-1">{bs.filter(updated)[0].rows.map((r) => <RowLine key={r.i} r={r.i === UPDATE_ROW ? { ...r, temp: 19.3 } : r} hl={r.i === UPDATE_ROW} />)}</div>
          </motion.div>
        )}
        <div className={`grid gap-2 ${seg === 'id' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'}`}>
          {bs.map((b, bi) => {
            if (k === 'update' && updated(b)) return null
            const dim = k === 'query' && !opened(b)
            const hot = k === 'query' && opened(b)
            const { d, dd } = delta(b.rows)
            return (
              <motion.div layout key={bi} animate={{ opacity: dim ? 0.4 : 1 }} className="min-w-0 rounded-lg border p-2"
                style={{ borderColor: hot ? tone('ok') : 'var(--border)', background: hot ? toneBg('ok', 10) : 'var(--surface)', borderStyle: dim ? 'dashed' : 'solid' }}>
                <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10.5px] text-muted">
                  <span className="font-semibold" style={{ color: tone('accent') }}>compressed row {bi + 1}</span>
                  <span>count={b.rows.length}</span>
                  <span>min_time={ts(b.rows[0].sec)}</span>
                  <span>max_time={ts(b.rows[b.rows.length - 1].sec)}</span>
                  {k === 'query' && <span className="font-semibold" style={{ color: tone(hot ? 'ok' : 'muted') }}>{hot ? 'decompressed' : seg === 'device' && b.seg !== QUERY_DEV ? `skipped: device ≠ ${QUERY_DEV}` : 'skipped: max_time < 10:01:00'}</span>}
                </div>
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-1"><span className="w-14 font-mono text-[10.5px] text-muted">device</span>
                    {b.seg !== null && seg === 'device'
                      ? <><Cell id={`d${b.rows[0].i}`} t="header">{b.seg}</Cell>{b.rows.slice(1).map((r) => <motion.span key={r.i} layoutId={`d${r.i}`} className="hidden" />)}<span className="text-[10.5px] text-muted">stored once</span></>
                      : b.rows.map((r) => <Cell key={r.i} id={`d${r.i}`} t="header">{r.dev}</Cell>)}
                  </div>
                  <div className="flex flex-wrap items-center gap-1"><span className="w-14 font-mono text-[10.5px] text-muted">time[]</span>
                    {b.rows.map((r) => <Cell key={r.i} id={`t${r.i}`} t="pointer">{ts(r.sec)}</Cell>)}
                  </div>
                  {(k === 'encode') && b.rows.length > 1 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-15 font-mono text-[10.5px]" style={{ color: tone('ok') }}>
                      first {ts(b.rows[0].sec)}, deltas [{d.join(', ')}]s{dd.length ? `, delta-of-delta [${dd.join(', ')}]` : ''}
                    </motion.p>
                  )}
                  <div className="flex flex-wrap items-center gap-1"><span className="w-14 font-mono text-[10.5px] text-muted">temp[]</span>
                    {b.rows.map((r) => <Cell key={r.i} id={`v${r.i}`} t="tuple">{r.temp.toFixed(1)}</Cell>)}
                  </div>
                  {(k === 'encode') && b.rows.length > 1 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[10.5px]" style={{ color: tone('ok') }}>
                      XOR with previous value: {b.rows.slice(1).map((r, i) => (r.temp === b.rows[i].temp ? '0 (repeat)' : '≠0')).join(', ')}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </LayoutGroup>
  )
}

function stepsFor(seg: Seg): Step<St>[] {
  const nb = batchesFor(seg).length
  const opened = seg === 'device' ? 1 : seg === 'none' ? 2 : 6
  return [
    { title: 'A rowstore chunk', body: 'An older chunk holds 12 ordinary heap rows in arrival order, every value stored in full in every row. Conversion starts when the **columnstore policy** reaches it (or on `convert_to_columnstore`).', state: { k: 'rows' } },
    { title: `Group by segmentby (${seg === 'device' ? 'device' : seg === 'none' ? 'none' : 'a unique id'})`,
      body: seg === 'device' ? 'Rows with the same `segmentby` value go together: one segment per device. The device value will be stored **once per batch**.'
        : seg === 'none' ? 'Without `segmentby` the whole chunk is one segment. Devices stay mixed, so the device column becomes an array too.'
          : 'A unique column as `segmentby` makes **one segment per row**. Nothing can be grouped.', state: { k: 'group' } },
    { title: 'Order by time, cut into batches', body: 'Inside each segment rows are sorted by `orderby` (default `time DESC`; ascending here for readability) and cut into batches of **up to 1000 rows**. This demo uses 4.', state: { k: 'batch' } },
    { title: `${nb} batches → ${nb} compressed rows`, body: `Each batch becomes **one row** of an internal table: one array per column, plus min/max of the orderby column as metadata. 12 heap rows became ${nb} row${nb > 1 ? 's' : ''}.${seg === 'id' ? ' With one row per batch the arrays hold one value each, so the result is **bigger** than the rowstore.' : ''}`, state: { k: 'arrays' } },
    { title: 'Encode each column', body: 'With delta-of-delta encoding, regular timestamps become a first value plus deltas, and the delta-of-delta is **0**, which costs about one bit. Floats are XORed with the previous value, so repeats cost almost nothing. Since 2.32 integers and timestamps default to the Adaptive Integer Compressor, which picks the cheapest encoding (run-length, frame-of-reference, dictionary) per block.', state: { k: 'encode' } },
    { title: `Query: device = 'B' AND time >= 10:01:00`, body: `The scan checks segment values and min/max metadata **before** decompressing anything. Here it opens **${opened} of ${nb}** batches${seg === 'none' ? ' and still has to filter devices after decompressing' : ''}.`, state: { k: 'query' } },
    { title: 'UPDATE one reading', body: 'DML on the columnstore decompresses only the **batches it touches** into the chunk\'s rowstore part. The chunk is now partially compressed, and the policy recompresses it later.', state: { k: 'update' } },
  ]
}

function ColumnstoreViz() {
  const [seg, setSeg] = useState<Seg>('device')
  const steps = useMemo(() => stepsFor(seg), [seg])
  const nb = batchesFor(seg).length
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="segmentby" value={seg === 'device' ? 'device' : seg === 'none' ? '(none)' : 'reading_id'} />
        <Stat label="batches" value={nb} t={seg === 'id' ? 'dead' : 'ok'} />
        <Stat label="values per batch" value={12 / nb} t={seg === 'id' ? 'dead' : undefined} />
        <Stat label="batches opened by query" value={`${seg === 'device' ? 1 : seg === 'none' ? 2 : 6} / ${nb}`} />
      </div>
      <Stepper steps={steps} render={(s) => render(seg, s)} interval={2600}
        extra={<Segmented label="segmentby" value={seg} onChange={setSeg} options={[['device', 'segmentby device'], ['none', 'none'], ['id', 'unique id']]} />} />
      <Legend items={[['pointer', 'time'], ['header', 'device (segmentby)'], ['tuple', 'temperature'], ['ok', 'decompressed / encoded'], ['new', 'rowstore part']]} />
      <Panel title="Measured sizes">
        <div className="grid gap-1 text-xs">
          <p><Md>{'Playground, 30,000 ticks as arrays per (symbol, 1000-row batch) with only TOAST compression: **1568 kB → 216 kB**, 7.3 times smaller, in 30 rows. A unique segment key: **4104 kB**, larger than the original.'}</Md></p>
          <p><Md>{'TimescaleDB with real codecs: **90%+** reduction is typical; a crypto-tick hypertable going from 194 MB to 24 MB (about 88%) is a representative result.'}</Md> <EditionTag ed="community" /></p>
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'compression-columnstore',
  module: 'e2',
  order: 5,
  title: 'Compression and the columnstore',
  tldr: [
    'The TimescaleDB **columnstore** (Hypercore, formerly called compression) rewrites older chunks so that each batch of up to 1000 rows becomes one row of compressed per-column arrays with min/max metadata.',
    'Time-series values repeat and change slowly, so storing columns together with delta and XOR encodings shrinks old data by 90% or more and lets analytical scans skip and read only the columns they need.',
  ],
  visualizer: {
    title: 'From 12 heap rows to a few compressed rows',
    caption: 'Step through the conversion of one chunk: group, order, batch, encode, then query and update it. Switch **segmentby** to see why a low-cardinality column groups well and a unique id ruins compression.',
    Component: ColumnstoreViz,
  },
  playground: {
    setup: `
SET TIME ZONE 'UTC';
-- 30,000 price ticks, one per second, three symbols taking turns
CREATE TABLE ticks (time timestamptz NOT NULL, symbol text NOT NULL, price double precision);
INSERT INTO ticks
SELECT timestamptz '2026-01-05' + make_interval(secs => i), (ARRAY['BTC','ETH','SOL'])[1 + i % 3], 100 + (i % 50)
FROM generate_series(1, 30000) i;
ANALYZE ticks;`,
    presets: [
      { label: 'The rowstore', sql: `SELECT count(*) AS row_count,
       pg_relation_size('ticks') / 8192 AS pages,
       pg_size_pretty(pg_total_relation_size('ticks')) AS size,
       round(30000.0 / (pg_relation_size('ticks') / 8192)) AS rows_per_page
FROM ticks;

SELECT pg_column_size(t.*) AS bytes_per_row FROM ticks t LIMIT 1;`,
        note: '30,000 rows in 192 pages (**1568 kB**), 156 rows per page. Each row carries its own header and repeats the symbol text.' },
      { label: 'Build columnar batches', sql: `CREATE TABLE ticks_columnar AS
SELECT symbol,                                 -- segmentby
       (rn - 1) / 1000          AS batch,      -- up to 1000 rows per batch
       count(*)                 AS n,
       min(time) AS min_time, max(time) AS max_time,   -- batch metadata
       array_agg(time  ORDER BY time) AS times,        -- orderby time
       array_agg(price ORDER BY time) AS prices
FROM (SELECT *, row_number() OVER (PARTITION BY symbol ORDER BY time) AS rn FROM ticks) s
GROUP BY symbol, (rn - 1) / 1000;

SELECT pg_size_pretty(pg_total_relation_size('ticks'))          AS rowstore,
       pg_size_pretty(pg_total_relation_size('ticks_columnar')) AS columnar,
       round(pg_total_relation_size('ticks')::numeric / pg_total_relation_size('ticks_columnar'), 1) AS ratio,
       (SELECT count(*) FROM ticks_columnar) AS batches;

SELECT symbol, batch, n, min_time, max_time,
       pg_column_size(times) AS times_bytes, pg_column_size(prices) AS prices_bytes
FROM ticks_columnar ORDER BY symbol, batch LIMIT 4;`,
        note: '30 rows replace 30,000: **1568 kB → 216 kB** (7.3x) with only TOAST\'s generic compression. 1000 prices fit in about 282 bytes because they repeat. Real columnstore codecs do far better on timestamps.' },
      { label: 'Skip batches by metadata', sql: `SELECT symbol, batch, min_time, max_time FROM ticks_columnar
WHERE symbol = 'ETH' AND max_time >= '2026-01-05 03:00' AND min_time <= '2026-01-05 03:00:10';

SELECT u.t, u.p
FROM ticks_columnar c, unnest(c.times, c.prices) AS u(t, p)
WHERE c.symbol = 'ETH'
  AND c.max_time >= '2026-01-05 03:00' AND c.min_time <= '2026-01-05 03:00:10'
  AND u.t BETWEEN '2026-01-05 03:00' AND '2026-01-05 03:00:10'
ORDER BY u.t;`,
        note: 'The segment value and min/max metadata pick **1 batch of 30** before any array is opened. `unnest` plays decompression and returns the 4 matching ticks.' },
      { label: 'Why timestamps compress', sql: `SELECT time,
       extract(epoch FROM time - lag(time) OVER w) AS delta,
       extract(epoch FROM time - lag(time) OVER w)
         - extract(epoch FROM lag(time) OVER w - lag(time, 2) OVER w) AS delta_of_delta,
       price, price - lag(price) OVER w AS price_delta
FROM ticks WHERE symbol = 'BTC'
WINDOW w AS (ORDER BY time) ORDER BY time LIMIT 6;`,
        note: 'Within one segment ticks arrive every 3 seconds, so **delta-of-delta is 0** for every row: a 64-bit timestamp shrinks to about a bit. Prices step by a constant 3, which run-length and delta encodings capture too.' },
      { label: 'Choosing segmentby', sql: `CREATE TABLE ticks_no_segment AS
SELECT (rn - 1) / 1000 AS batch, array_agg(time ORDER BY time) AS times,
       array_agg(price ORDER BY time) AS prices, array_agg(symbol ORDER BY time) AS symbols
FROM (SELECT *, row_number() OVER (ORDER BY time) AS rn FROM ticks) s GROUP BY 1;

CREATE TABLE ticks_unique_segment AS
SELECT time AS seg, array_agg(time) AS times, array_agg(price) AS prices, array_agg(symbol) AS symbols
FROM ticks GROUP BY time;

SELECT 'rowstore' AS layout, pg_size_pretty(pg_total_relation_size('ticks')) AS size, 30000 AS stored_rows
UNION ALL SELECT 'segmentby symbol', pg_size_pretty(pg_total_relation_size('ticks_columnar')), (SELECT count(*) FROM ticks_columnar)
UNION ALL SELECT 'no segmentby', pg_size_pretty(pg_total_relation_size('ticks_no_segment')), (SELECT count(*) FROM ticks_no_segment)
UNION ALL SELECT 'unique segmentby', pg_size_pretty(pg_total_relation_size('ticks_unique_segment')), (SELECT count(*) FROM ticks_unique_segment);

SELECT 'segmentby symbol' AS layout, count(*) AS batches_opened_for_eth FROM ticks_columnar WHERE symbol = 'ETH'
UNION ALL SELECT 'no segmentby', count(*) FROM ticks_no_segment;`,
        note: 'No segmentby is about as small here, but a query for ETH must open **all 30 batches** instead of 10. A unique segment key makes 30,000 one-value batches: **4104 kB**, bigger than the rowstore.' },
      { label: 'Changing one value', sql: `UPDATE ticks_columnar SET prices[500] = 0 WHERE symbol = 'ETH' AND batch = 3;

SELECT symbol, batch, n, pg_column_size(prices) AS bytes_rewritten, ctid
FROM ticks_columnar WHERE symbol = 'ETH' AND batch = 3;

SELECT n_tup_upd, n_tup_hot_upd FROM pg_stat_xact_user_tables WHERE relname = 'ticks_columnar';`,
        note: 'Changing one price writes a **new version of the whole batch row** (1000 values). TimescaleDB instead decompresses the affected batch into the rowstore part of the chunk, which is why large UPDATEs on compressed chunks are expensive.' },
    ],
  },
  production: {
    title: 'Keeping a year of market ticks on one server',
    context: 'A trading-analytics team stores every tick for about 2,000 symbols in a hypertable with 1-day chunks. Analysts query one symbol over weeks or months; only the last day still receives inserts.',
    problem: 'A year of rowstore chunks filled the disk, and month-long scans read every column of every row even though they used only time and price.',
    solution: 'Enable the columnstore with `segmentby = symbol` (filtered on, moderate cardinality) and `orderby = time DESC`, and convert chunks once they stop receiving writes. The columnstore is a **Community edition** feature: it is not in the Apache 2 edition, and Neon does not offer it. Old names from before 2.18 still work but are deprecated.',
    sql: `ALTER TABLE ticks SET (
  timescaledb.enable_columnstore,          -- before 2.18: timescaledb.compress
  timescaledb.segmentby = 'symbol',        -- before 2.18: timescaledb.compress_segmentby
  timescaledb.orderby   = 'time DESC'      -- before 2.18: timescaledb.compress_orderby
);
CALL add_columnstore_policy('ticks', after => INTERVAL '1 day');   -- was add_compression_policy

-- convert a backlog faster: one chunk per session, in parallel
CALL convert_to_columnstore('_timescaledb_internal._hyper_1_42_chunk');

SELECT pg_size_pretty(before_compression_total_bytes) AS before,
       pg_size_pretty(after_compression_total_bytes)  AS after
FROM hypertable_columnstore_stats('ticks');`,
    outcome: 'Expect a reduction of around 90% on data like this; a sample crypto-tick hypertable shrinks from 194 MB to 24 MB, about 8 times (88%). Queries on one symbol open only that symbol\'s batches and only the columns they reference. Measure your own ratio with `hypertable_columnstore_stats`.',
  },
  pitfalls: [
    { title: 'High-cardinality segmentby',
      symptom: 'Compression ratio is poor, sometimes worse than the rowstore, and `chunk_columnstore_stats` shows little gain.',
      cause: 'Every distinct segmentby value gets its own batches. With a near-unique column each batch holds a handful of rows, so there is nothing to compress.',
      fix: 'Pick the column you filter or group by most, with low-to-moderate cardinality (device, symbol). Settings apply only to chunks converted afterwards.',
      sql: `ALTER TABLE ticks SET (timescaledb.segmentby = 'symbol');` },
    { title: 'Big UPDATE on compressed chunks',
      symptom: '`ERROR: tuple decompression limit exceeded by operation`.',
      cause: 'DML decompresses the batches it touches. `timescaledb.max_tuples_decompressed_per_dml_transaction` (default 100000) stops runaway transactions.',
      fix: 'Batch the change, raise the limit for that session, or pause the policy, convert the chunk back with `convert_to_rowstore`, change it, and convert again.',
      sql: `SET timescaledb.max_tuples_decompressed_per_dml_transaction = 0;  -- 0 = unlimited, this session only` },
    { title: 'Enabling the policy on a large existing table',
      symptom: 'Memory pressure or `temporary file size exceeds temp_file_limit` right after adding the policy.',
      cause: 'The first run tries to convert the whole backlog of eligible chunks, one after another, in a single-threaded job.',
      fix: 'Limit chunks per run with the `maxchunks_to_compress` config key, and convert the backlog manually from parallel sessions.',
      sql: `SELECT alter_job(job_id, config => config || '{"maxchunks_to_compress": 10}')
FROM timescaledb_information.jobs WHERE proc_name = 'policy_compression';` },
    { title: 'Assuming one policy schedule',
      symptom: 'Chunks convert later (or earlier) than a runbook promised.',
      cause: 'There are two defaults: the policy created by `CREATE TABLE … WITH (tsdb.hypertable)` is specified with a 1-day schedule, while `add_columnstore_policy` defaults to 12 hours for chunk intervals of a day or more (half the interval otherwise).',
      fix: 'Read the real value instead of assuming it, and set it explicitly if it matters.',
      sql: `SELECT job_id, schedule_interval, config FROM timescaledb_information.jobs
WHERE proc_name = 'policy_compression';` },
  ],
  pointers: [
    'Columnstore conversion: group by **segmentby**, sort by **orderby**, cut into batches of **up to 1000 rows**, store each batch as one row of arrays with min/max metadata.',
    'Codecs: since 2.32 the **Adaptive Integer Compressor** picks run-length, frame-of-reference or dictionary per block for integers and timestamps (delta-of-delta, simple-8b and run-length before); XOR for floats; dictionaries for text.',
    'Scans skip batches by segment value and metadata, and decompress only the columns they read. DML decompresses only the batches it touches.',
    'Renamed in 2.18: `compress_chunk` → `convert_to_columnstore`, `add_compression_policy` → `add_columnstore_policy`, `timescaledb.compress` → `enable_columnstore`.',
    'The columnstore is **Community edition** only. Neon does not support compression. The playground\'s arrays rely on [TOAST](/m2/toast) compression instead.',
  ],
  sources: ['storage-toast.html', 'arrays.html', 'functions-array.html', 'sql-createtableas.html',
    'tigerdata.com/docs/learn/columnar-storage/understand-hypercore', 'tigerdata.com/docs/reference/timescaledb/hypercore/add_columnstore_policy'],
}
