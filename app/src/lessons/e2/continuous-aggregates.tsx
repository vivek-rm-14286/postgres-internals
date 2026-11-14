import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Code, EditionTag, Msg, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a simulated continuous aggregate over hourly buckets 00:00–11:00, following the documented
 * engine: a materialization hypertable holds finished buckets below the watermark; writes older than the
 * invalidation threshold log [min, max] time per transaction; a refresh recomputes only new buckets in
 * its window plus logged ranges that overlap the window, clips the log, and moves the watermark. The
 * policy is start_offset 3 h, end_offset 1 h, schedule_interval 1 h, and runs after every simulated hour,
 * so a reading becomes materialized at most 2 hours after its bucket starts. Real-time aggregation
 * (materialized_only = false) is off by default since 2.13.
 * ---------------------------------------------------------------------------------------------- */

const NB = 12
interface Row { h: number; v: number }
interface Agg { sum: number; n: number }
interface Inv { lo: number; hi: number }
interface S { now: number; rows: Row[]; mat: (Agg | null)[]; wm: number; inv: Inv[]; last: string; recomputed: number[]; rt: boolean }

const START = 3, END = 1
const val = (h: number, k: number) => Math.round((20 + h * 0.6 + [0.2, -0.4, 0.5, -0.1][k % 4]) * 10) / 10
function ingestHour(rows: Row[], h: number) { for (let k = 0; k < 4; k++) rows.push({ h: h + (k * 15 + 5) / 60, v: val(h, k) }) }
const agg = (rows: Row[], b: number): Agg | null => { const r = rows.filter((x) => Math.floor(x.h) === b); return r.length ? { sum: r.reduce((a, x) => a + x.v, 0), n: r.length } : null }

/** refresh window [lo, hi) in whole buckets */
function refresh(s: S, lo: number, hi: number, label: string): S {
  const work: number[] = []
  for (let b = lo; b < hi; b++) if (b >= s.wm || s.inv.some((i) => b + 1 > i.lo && b <= i.hi)) work.push(b)
  const mat = s.mat.slice()
  work.forEach((b) => { mat[b] = agg(s.rows, b) })
  // clip invalidation ranges to what lies outside the window
  const inv: Inv[] = []
  s.inv.forEach((i) => {
    if (i.hi < lo || i.lo >= hi) { inv.push(i); return }
    if (i.lo < lo) inv.push({ lo: i.lo, hi: lo - 1e-6 })
    if (i.hi >= hi) inv.push({ lo: hi, hi: i.hi })
  })
  const wm = Math.max(s.wm, hi)
  const names = work.map((b) => `${String(b).padStart(2, '0')}:00`)
  return { ...s, mat, inv, wm, recomputed: work, last: `${label}: window **${String(lo).padStart(2, '0')}:00 → ${String(hi).padStart(2, '0')}:00**. Recomputed ${work.length ? `${work.length} bucket${work.length > 1 ? 's' : ''} (${names.join(', ')})` : 'nothing: no new buckets, no invalidations in the window'}. Watermark → ${String(wm).padStart(2, '0')}:00.` }
}

function initial(): S {
  const rows: Row[] = []
  for (let h = 0; h < 6; h++) ingestHour(rows, h)
  const s: S = { now: 6, rows, mat: Array(NB).fill(null), wm: 0, inv: [], last: '', recomputed: [], rt: false }
  const r = refresh(s, 0, 5, 'Initial refresh')
  return { ...r, recomputed: [], last: 'It is **06:00**. Buckets 00:00–04:00 are materialized. 05:00 is complete but `end_offset => 1 hour` keeps it out of the refresh window, and real-time aggregation is off, so the cagg does not show it yet.' }
}

function write(s: S, hs: number[][], label: string): S {
  const rows = s.rows.slice()
  const inv = s.inv.slice()
  hs.forEach((txn) => {
    txn.forEach((h) => rows.push({ h, v: 100 }))
    const lo = Math.min(...txn), hi = Math.max(...txn)
    if (lo < s.wm) inv.push({ lo, hi }) // only writes behind the invalidation threshold are logged
  })
  return { ...s, rows, inv, recomputed: [], last: label }
}

function CaggViz() {
  const [s, setS] = useState<S>(initial)
  const advance = () => {
    if (s.now >= NB) return
    const rows = s.rows.slice(); ingestHour(rows, s.now)
    const n: S = { ...s, rows, now: s.now + 1 }
    setS(refresh(n, Math.max(0, n.now - START), n.now - END, `**${String(n.now).padStart(2, '0')}:00**, 4 new rows ingested, then the hourly policy ran`))
  }
  const backfill = () => setS(write(s, [[1 + 20 / 60]], 'A late reading for **01:20** (value 100) arrived. 01:00 is below the invalidation threshold, so its time range was written to the **invalidation log**. The cagg still shows the old average.'))
  const oneTxn = () => setS(write(s, [[1 + 25 / 60, 4 + 25 / 60]], 'Two late rows (01:25 and 04:25) in **one transaction**. The log keeps only the min and max time per transaction, so the range covers **01:25 → 04:25**: every bucket in between will be recomputed.'))
  const twoTxn = () => setS(write(s, [[1 + 25 / 60], [4 + 25 / 60]], 'The same two rows in **two transactions**: two small log entries, so only the 01:00 and 04:00 buckets will be recomputed.'))
  const manual = () => setS(refresh(s, 0, s.now - END, 'Manual `CALL refresh_continuous_aggregate(\'metrics_hourly\', NULL, now() - INTERVAL \'1 hour\')`'))
  const policyLo = Math.max(0, s.now - START), policyHi = s.now - END

  const X0 = 74, CW = (632 - X0) / NB
  const cx = (b: number) => X0 + b * CW
  const raw = Array.from({ length: NB }, (_, b) => agg(s.rows, b))
  const result = (b: number): { v: number | null; src: 'mat' | 'rt' | 'none' } => {
    if (b < s.wm) return s.mat[b] ? { v: s.mat[b]!.sum / s.mat[b]!.n, src: 'mat' } : { v: null, src: 'none' }
    if (s.rt && raw[b]) return { v: raw[b]!.sum / raw[b]!.n, src: 'rt' }
    return { v: null, src: 'none' }
  }
  const stale = (b: number) => b < s.wm && s.mat[b] && raw[b] && Math.abs(s.mat[b]!.sum / s.mat[b]!.n - raw[b]!.sum / raw[b]!.n) > 1e-9
  const srcTone: Record<'mat' | 'rt' | 'none', Tone> = { mat: 'tuple', rt: 'header', none: 'muted' }
  const staleCount = Array.from({ length: NB }, (_, b) => b).filter((b) => stale(b)).length
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={advance} disabled={s.now >= NB}>Advance 1 h</Btn>
        <Btn onClick={backfill}>Backfill 01:20</Btn>
        <Btn onClick={oneTxn}>2 late rows, 1 transaction</Btn>
        <Btn onClick={twoTxn}>2 late rows, 2 transactions</Btn>
        <Btn onClick={manual}>Manual refresh</Btn>
        <Segmented label="Real-time aggregation" value={s.rt ? 'on' : 'off'} onChange={(v) => setS({ ...s, rt: v === 'on', recomputed: [], last: v === 'on' ? '`materialized_only = false`: the view is now a UNION of materialized buckets below the watermark and a live aggregate of raw rows above it.' : '`materialized_only = true` (the default since 2.13): the view returns only materialized buckets.' })}
          options={[['off', 'materialized only'], ['on', 'real-time']]} />
        <Btn onClick={() => setS(initial())}>Reset</Btn>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="now" value={`${String(s.now).padStart(2, '0')}:00`} t="new" />
        <Stat label="watermark" value={`${String(s.wm).padStart(2, '0')}:00`} t="pointer" />
        <Stat label="invalidation log" value={`${s.inv.length} range${s.inv.length === 1 ? '' : 's'}`} t={s.inv.length ? 'dead' : undefined} />
        <Stat label="stale buckets" value={staleCount} t={staleCount ? 'dead' : 'ok'} />
      </div>
      <Msg id={s.last + s.now + s.rt}><Md>{s.last}</Md></Msg>
      <Legend items={[['tuple', 'materialized'], ['header', 'computed live (real-time)'], ['dead', 'stale or invalidated'], ['ok', 'just recomputed'], ['pointer', 'watermark'], ['new', 'now']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 262" className="w-full min-w-[580px]" role="img" aria-label="Raw hypertable, invalidation log, materialized buckets and query result">
          {[['raw rows', 58], ['inval. log', 104], ['materialized', 136], ['policy window', 168], ['SELECT cagg', 214]].map(([l, y]) => (
            <text key={l} x={4} y={+y} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{l}</text>
          ))}
          {Array.from({ length: NB }, (_, b) => (
            <text key={b} x={cx(b) + CW / 2} y={12} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{String(b).padStart(2, '0')}:00</text>
          ))}
          {raw.map((a, b) => a && (
            <g key={b}>
              <motion.rect initial={{ height: 0, y: 84 }} animate={{ height: Math.min(60, a.n * 11), y: 84 - Math.min(60, a.n * 11) }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                x={cx(b) + 6} width={CW - 12} rx={2} fill={toneBg('muted', 22)} stroke="var(--muted)" />
              <text x={cx(b) + CW / 2} y={92 - 0} textAnchor="middle" fontSize={9.5} fill="var(--text)" fontFamily="var(--font-mono)">{(a.sum / a.n).toFixed(1)}</text>
            </g>
          ))}
          {s.rows.filter((r) => r.v === 100).map((r, i) => (
            <motion.circle key={i} initial={{ r: 0 }} animate={{ r: 3.5 }} cx={cx(0) + r.h * CW} cy={24} fill={tone('dead')} />
          ))}
          <AnimatePresence>
            {s.inv.map((i, k) => (
              <motion.g key={`${i.lo}-${i.hi}-${k}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <rect x={cx(0) + i.lo * CW - 2} y={98 + (k % 2) * 6} width={Math.max(4, (i.hi - i.lo) * CW + 4)} height={5} rx={2} fill={tone('dead')} />
              </motion.g>
            ))}
          </AnimatePresence>
          {s.mat.map((m, b) => {
            const re = s.recomputed.includes(b), st = stale(b)
            const t: Tone = re ? 'ok' : st ? 'dead' : 'tuple'
            return m && b < s.wm && (
              <motion.g key={b} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.rect initial={false} animate={{ fill: toneBg(t, 26), stroke: tone(t) }} x={cx(b) + 3} y={122} width={CW - 6} height={24} rx={3} strokeWidth={re ? 2 : 1} />
                <text x={cx(b) + CW / 2} y={138} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--text)" fontFamily="var(--font-mono)">{(m.sum / m.n).toFixed(1)}</text>
              </motion.g>
            )
          })}
          <motion.g initial={false} animate={{ x: cx(policyLo) }} transition={{ type: 'spring', stiffness: 160, damping: 22 }}>
            <motion.path initial={false} animate={{ d: `M 2 158 V 164 H ${(policyHi - policyLo) * CW - 2} V 158` }} fill="none" stroke={tone('accent')} strokeWidth={1.6} />
            <text x={((policyHi - policyLo) * CW) / 2} y={176} textAnchor="middle" fontSize={9.5} fill={tone('accent')} fontFamily="var(--font-mono)">now−3h → now−1h</text>
          </motion.g>
          {Array.from({ length: NB }, (_, b) => {
            const r = result(b)
            return (
              <g key={b}>
                <motion.rect initial={false} animate={{ fill: r.src === 'none' ? 'transparent' : toneBg(srcTone[r.src], 24), stroke: r.src === 'none' ? 'var(--border)' : tone(srcTone[r.src]) }}
                  x={cx(b) + 3} y={196} width={CW - 6} height={28} rx={3} strokeDasharray={r.src === 'none' ? '3 2' : undefined} />
                <text x={cx(b) + CW / 2} y={214} textAnchor="middle" fontSize={10} fontWeight={600} fill={r.src === 'none' ? 'var(--muted)' : 'var(--text)'} fontFamily="var(--font-mono)">{r.v === null ? '–' : r.v.toFixed(1)}</text>
              </g>
            )
          })}
          <motion.line initial={false} animate={{ x1: cx(s.wm), x2: cx(s.wm) }} y1={16} y2={232} stroke={tone('pointer')} strokeWidth={2} />
          <motion.text initial={false} animate={{ x: cx(s.wm) }} y={246} textAnchor="middle" fontSize={10} fontWeight={700} fill={tone('pointer')} fontFamily="var(--font-mono)">watermark</motion.text>
          {s.now < NB + 1 && <>
            <motion.line initial={false} animate={{ x1: cx(s.now), x2: cx(s.now) }} y1={16} y2={232} stroke={tone('new')} strokeWidth={2} strokeDasharray="4 3" />
            <motion.text initial={false} animate={{ x: Math.min(cx(s.now), 620) }} y={258} textAnchor="middle" fontSize={10} fontWeight={700} fill={tone('new')} fontFamily="var(--font-mono)">now</motion.text>
          </>}
        </svg>
      </div>
      <Panel title="The continuous aggregate being simulated">
        <Code>{`CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS            -- materialized_only = true by default (2.13+)
SELECT time_bucket('1 hour', time) AS bucket, device_id,
       avg(value) AS avg_value, count(*) AS n
FROM metrics
GROUP BY bucket, device_id;

SELECT add_continuous_aggregate_policy('metrics_hourly',
  start_offset      => INTERVAL '3 hours',
  end_offset        => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');`}</Code>
        <p className="mt-2"><EditionTag ed="community" /></p>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

/* The engine is created by the setup AND rebuilt by the example that teaches it, so every later example runs on
 * a fresh database. */
const RT_VIEW = `CREATE OR REPLACE VIEW metrics_hourly_rt AS
SELECT bucket, device_id, sum_v / n AS avg_v, n FROM cagg_hourly
WHERE bucket < (SELECT wm FROM cagg_watermark)
UNION ALL
SELECT date_bin('1 hour', time, timestamptz '2000-01-03'), device_id, avg(value), count(*)
FROM metrics WHERE time >= (SELECT wm FROM cagg_watermark)
GROUP BY 1, 2;`
const FIRST_REFRESH = `CALL refresh_cagg('2026-01-05 00:00+00', '2026-01-05 05:00+00');`
const ENGINE_DDL = `CREATE TABLE cagg_hourly (bucket timestamptz, device_id int, sum_v double precision, n bigint,
                          PRIMARY KEY (bucket, device_id));
CREATE TABLE cagg_invalidations (lo timestamptz, hi timestamptz);
CREATE TABLE cagg_watermark (wm timestamptz);
INSERT INTO cagg_watermark VALUES ('-infinity');
CREATE TABLE cagg_refresh_log (refresh_no int GENERATED ALWAYS AS IDENTITY,
                               buckets_recomputed int, watermark timestamptz);

-- invalidation log: min/max time per statement, only for writes behind the watermark
CREATE OR REPLACE FUNCTION log_invalidation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO cagg_invalidations
  SELECT min(time), max(time) FROM new_rows
  HAVING count(*) > 0 AND min(time) < (SELECT wm FROM cagg_watermark);
  RETURN NULL;
END $$;
CREATE OR REPLACE TRIGGER metrics_inval AFTER INSERT ON metrics REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION log_invalidation();

-- refresh: recompute new buckets and invalidated buckets inside the window
CREATE OR REPLACE PROCEDURE refresh_cagg(p_start timestamptz, p_end timestamptz) LANGUAGE plpgsql AS $$
DECLARE w_lo timestamptz; w_hi timestamptz; old_wm timestamptz; work timestamptz[];
BEGIN
  w_lo := date_bin('1 hour', p_start + interval '1 hour' - interval '1 microsecond', timestamptz '2000-01-03');
  w_hi := date_bin('1 hour', p_end, timestamptz '2000-01-03');   -- whole buckets only
  SELECT wm INTO old_wm FROM cagg_watermark;
  SELECT coalesce(array_agg(b), '{}') INTO work
  FROM generate_series(w_lo, w_hi - interval '1 hour', interval '1 hour') b
  WHERE b >= old_wm
     OR EXISTS (SELECT 1 FROM cagg_invalidations i WHERE b + interval '1 hour' > i.lo AND b <= i.hi);
  DELETE FROM cagg_hourly WHERE bucket = ANY (work);
  INSERT INTO cagg_hourly
  SELECT date_bin('1 hour', time, timestamptz '2000-01-03'), device_id, sum(value), count(*)
  FROM metrics WHERE date_bin('1 hour', time, timestamptz '2000-01-03') = ANY (work)
  GROUP BY 1, 2;
  DELETE FROM cagg_invalidations WHERE lo >= w_lo AND hi < w_hi;
  UPDATE cagg_watermark SET wm = greatest(wm, w_hi);
  INSERT INTO cagg_refresh_log (buckets_recomputed, watermark) VALUES (cardinality(work), greatest(old_wm, w_hi));
END $$;

-- real-time view: stored buckets below the watermark, live rows above it (next example)
${RT_VIEW}`
const SETUP_ENGINE = `-- start clean (the lesson setup already built one copy of this engine)
DROP TABLE IF EXISTS cagg_hourly, cagg_invalidations, cagg_watermark, cagg_refresh_log CASCADE;

${ENGINE_DDL}

${FIRST_REFRESH}
SELECT bucket, device_id, sum_v / n AS avg_v, n FROM cagg_hourly ORDER BY 1, 2;
SELECT * FROM cagg_refresh_log;`

export const lesson: Lesson = {
  slug: 'continuous-aggregates',
  module: 'e2',
  order: 4,
  title: 'Continuous aggregates',
  tldr: [
    'A **continuous aggregate** is a materialized view over a hypertable that TimescaleDB refreshes incrementally, recomputing only new time buckets and buckets whose raw data changed.',
    'Dashboards ask the same rollup questions every few seconds, and recomputing them from billions of raw rows is too slow, while a plain materialized view must be rebuilt in full on every refresh.',
  ],
  visualizer: {
    title: 'Watermark, invalidation log and refresh window',
    caption: 'Advance time and watch the hourly policy materialize buckets behind the watermark. Backfill late rows to fill the invalidation log, compare one transaction with two, and switch on **real-time** to see buckets above the watermark computed live.',
    Component: CaggViz,
  },
  playground: {
    setup: `
SET TIME ZONE 'UTC';
CREATE TABLE metrics (time timestamptz NOT NULL, device_id int NOT NULL, value double precision);
INSERT INTO metrics VALUES
  ('2026-01-05 00:10+00', 1, 10), ('2026-01-05 00:40+00', 1, 12),
  ('2026-01-05 02:15+00', 1, 20), ('2026-01-05 05:05+00', 1, 50),
  ('2026-01-05 01:30+00', 2, 7);

CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN 'ERROR: ' || SQLERRM;
END $$;

-- the hand-built incremental engine that "Build an incremental engine" walks through
${ENGINE_DDL}
${FIRST_REFRESH}`,
    presets: [
      { label: 'A plain materialized view', sql: `DROP MATERIALIZED VIEW IF EXISTS metrics_hourly;
CREATE MATERIALIZED VIEW metrics_hourly AS
SELECT date_bin('1 hour', time, timestamptz '2000-01-03') AS bucket, device_id,
       avg(value) AS avg_v, count(*) AS n
FROM metrics GROUP BY 1, 2
WITH NO DATA;

SELECT try_sql('SELECT * FROM metrics_hourly') AS before_refresh;
REFRESH MATERIALIZED VIEW metrics_hourly;
SELECT * FROM metrics_hourly ORDER BY bucket, device_id;`,
        note: 'An unpopulated matview raises **has not been populated**. `REFRESH` recomputes the entire query every time, however little changed.' },
      { label: 'Concurrent refresh and staleness', sql: `-- the matview from the previous example (created here if you skipped it)
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_hourly AS
SELECT date_bin('1 hour', time, timestamptz '2000-01-03') AS bucket, device_id,
       avg(value) AS avg_v, count(*) AS n
FROM metrics GROUP BY 1, 2;

SELECT try_sql('REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_hourly') AS concurrently_without_index;
CREATE UNIQUE INDEX IF NOT EXISTS metrics_hourly_key ON metrics_hourly (bucket, device_id);
DELETE FROM metrics WHERE time = '2026-01-05 05:30+00';   -- so a second run starts from the same rows
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_hourly;

INSERT INTO metrics VALUES ('2026-01-05 05:30+00', 1, 60);
SELECT bucket, device_id, avg_v, n FROM metrics_hourly WHERE bucket = '2026-01-05 05:00+00';`,
        note: '`CONCURRENTLY` needs a unique index and still recomputes everything. The new 05:30 reading is invisible: the matview still says **50, n = 1** until the next full refresh.' },
      { label: 'Build an incremental engine', sql: SETUP_ENGINE,
        note: 'A summary table (the **materialization hypertable**), an invalidation log fed by a statement trigger, a refresh that handles whole buckets only, and the real-time view used next. The first lines drop the copy the lesson already loaded, so you can read and rerun the whole engine. The window ends at 05:00, so 5 buckets are computed and the **watermark** moves to 05:00.' },
      { label: 'Real-time view', sql: `${RT_VIEW}

-- a new reading above the watermark (skipped if an earlier example already added it)
INSERT INTO metrics SELECT '2026-01-05 05:30+00', 1, 60
WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE time = '2026-01-05 05:30+00');

SELECT * FROM metrics_hourly_rt ORDER BY 1, 2;`,
        note: 'This is `materialized_only = false`: stored buckets below the watermark, plus raw rows above it aggregated on the fly. The 05:00 bucket, which no refresh has stored, appears with **55, n = 2** (50 and the new 60).' },
      { label: 'Backfill below the watermark', sql: `INSERT INTO metrics VALUES ('2026-01-05 00:50+00', 1, 100);
SELECT * FROM cagg_invalidations;
SELECT avg_v, n FROM metrics_hourly_rt WHERE bucket = '2026-01-05 00:00+00' AND device_id = 1;

CALL refresh_cagg('2026-01-05 00:00+00', '2026-01-05 05:00+00');
SELECT avg_v, n FROM metrics_hourly_rt WHERE bucket = '2026-01-05 00:00+00' AND device_id = 1;
SELECT * FROM cagg_refresh_log;`,
        note: 'The late row is logged as **00:50 → 00:50**, but even the real-time view still shows **11** until a refresh. Refresh number 2 recomputes **1 bucket**, and the average becomes 40.67 (10, 12, 100).' },
      { label: 'One transaction vs two', sql: `-- one statement touching 01:20 and 04:20: one log range
INSERT INTO metrics VALUES ('2026-01-05 01:20+00', 2, 9), ('2026-01-05 04:20+00', 2, 9);
CALL refresh_cagg('2026-01-05 00:00+00', '2026-01-05 05:00+00');

-- the same change as two statements: two small ranges
INSERT INTO metrics VALUES ('2026-01-05 01:25+00', 2, 9);
INSERT INTO metrics VALUES ('2026-01-05 04:25+00', 2, 9);
CALL refresh_cagg('2026-01-05 00:00+00', '2026-01-05 05:00+00');

SELECT * FROM cagg_refresh_log;`,
        note: 'Only min and max are logged, so one write spanning 01:20 to 04:20 recomputes **4 buckets**, while two separate writes recompute **2**. TimescaleDB logs per transaction, so batch backfills by bucket.' },
      { label: 'Rolling up without avg of avgs', sql: `SELECT date_trunc('day', bucket) AS day, device_id,
       sum(sum_v) / sum(n) AS correct_avg,
       avg(sum_v / n)      AS avg_of_avgs
FROM cagg_hourly GROUP BY 1, 2 ORDER BY 1, 2;`,
        note: 'A daily rollup of the hourly table (a **hierarchical** aggregate) must combine sums and counts. On the starting data device 1 is **14** (42 / 3 readings), while averaging the hourly averages gives a wrong 15.5; after the backfill example the same columns read 35.5 and 30.33.' },
    ],
  },
  production: {
    title: 'Hourly dashboards over a year of per-second data',
    context: 'An energy-monitoring service stores one reading per second for 20,000 meters, 1.7 billion rows per day, and its dashboards show hourly and daily usage per meter.',
    problem: 'The dashboard query aggregated raw rows on every page load, and a plain materialized view took longer to refresh than the interval between refreshes. Late readings arrive from meters that were offline for hours.',
    solution: 'An hourly continuous aggregate with a refresh policy that leaves the current hour out, real-time aggregation for the dashboard, and a daily aggregate on top of the hourly one storing sums and counts. Late batches are written per bucket so the invalidation ranges stay small. Continuous aggregates and their policies are **Community edition** features; on the Apache 2 edition (Neon included) use the trigger-and-summary-table pattern from the playground.',
    sql: `CREATE MATERIALIZED VIEW usage_hourly
WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
SELECT time_bucket('1 hour', time) AS bucket, meter_id,
       sum(kwh) AS kwh, count(*) AS n
FROM readings
GROUP BY bucket, meter_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('usage_hourly',
  start_offset      => INTERVAL '3 days',    -- late meters catch up within 3 days
  end_offset        => INTERVAL '1 hour',    -- never materialize the open hour
  schedule_interval => INTERVAL '1 hour');

-- hierarchical: daily on top of hourly (24 h is a whole multiple of 1 h)
CREATE MATERIALIZED VIEW usage_daily WITH (timescaledb.continuous) AS
SELECT time_bucket('1 day', bucket) AS day, meter_id, sum(kwh) AS kwh, sum(n) AS n
FROM usage_hourly GROUP BY day, meter_id;

-- one-off repair of a range older than the policy window
CALL refresh_continuous_aggregate('usage_hourly', '2026-10-01', '2026-10-08');`,
    outcome: 'A daily dashboard for one meter reads 24 hourly rows instead of 86,400 raw rows, 3,600 times fewer. The policy refreshes each window in batches of 10 buckets (the default since 2.25), so each transaction stays small.',
  },
  pitfalls: [
    { title: 'The last hour is missing',
      symptom: 'The aggregate shows nothing for the most recent hour or two, so the dashboard looks delayed.',
      cause: '`end_offset` keeps the open bucket out of the refresh window, and real-time aggregation has been **off by default since 2.13**. A refresh only stores whole buckets that end before `now − end_offset`, so with 1-hour buckets, a 1-hour end_offset and a 1-hour schedule a reading can wait up to 3 hours (bucket width + end_offset + one schedule interval).',
      fix: 'Enable real-time aggregation if readers need fresh data, or shorten `end_offset` and `schedule_interval`.',
      sql: `ALTER MATERIALIZED VIEW usage_hourly SET (timescaledb.materialized_only = false);` },
    { title: 'Backfill never appears',
      symptom: 'Rows inserted for last month are in the hypertable but not in the aggregate, even with real-time on.',
      cause: 'Real-time only covers data above the watermark. Changes below it are logged and wait for a refresh whose window covers them, and the policy window (`start_offset`) does not reach back a month.',
      fix: 'Run a manual refresh for that range, or add a second policy with a non-overlapping window for old data.',
      sql: `CALL refresh_continuous_aggregate('usage_hourly', '2026-10-01', '2026-11-01');` },
    { title: 'Retention deletes aggregated history',
      symptom: 'After adding a retention policy, old buckets vanish from the continuous aggregate too.',
      cause: 'A refresh that covers a range whose raw chunks were dropped recomputes those buckets from nothing, which **deletes** them.',
      fix: 'Keep the retention interval longer than the refresh policy\'s `start_offset`, and give the aggregate its own, longer retention policy.' },
    { title: 'Averages of averages in a hierarchy',
      symptom: 'A daily aggregate built on an hourly one disagrees with the same query run on raw data.',
      cause: 'Hours have different row counts, so the mean of hourly means weighs them all equally.',
      fix: 'Store `sum` and `count` in the lower level and divide in the upper one, or use Toolkit aggregates that support `rollup()` (`stats_agg`, `percentile_agg`).' },
  ],
  pointers: [
    'A cagg stores finished buckets in a **materialization hypertable**. The **watermark** marks where materialized data ends.',
    'Writes behind the invalidation threshold log **min and max time per transaction**. A refresh recomputes only new and invalidated whole buckets in its window.',
    'Policy = `start_offset` / `end_offset` / `schedule_interval`. Leave the open bucket out, and expect data to lag by up to bucket width + end_offset + schedule_interval.',
    '**Real-time** (`materialized_only = false`) unions live raw data above the watermark. It has been off by default since 2.13.',
    'Continuous aggregates are **Community edition** only. Natively: a summary table, a [trigger](/m6/triggers)-fed invalidation log, a refresh procedure and a UNION view; a plain [materialized view](/m6/views-matviews) recomputes everything.',
  ],
  sources: ['rules-materializedviews.html', 'sql-creatematerializedview.html', 'sql-refreshmaterializedview.html', 'plpgsql-trigger.html', 'sql-createtrigger.html',
    'tigerdata.com/docs/learn/continuous-aggregates/about-continuous-aggregates', 'tigerdata.com/docs/reference/timescaledb/continuous-aggregates/add_continuous_aggregate_policy'],
}
