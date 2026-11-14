import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Bar, Btn, Msg, Slider, Tiles } from './_kit'
import { ZONE } from './_statsdata'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the selectivity formulas of docs ch.69, applied live to a real pg_stats row
 * (trips.zone, statistics target 10). The "PostgreSQL estimate" shown is the planner's own
 * Plan Rows for that exact constant, captured from EXPLAIN on PGlite; the formula is computed here
 * and matches it.
 * ---------------------------------------------------------------------------------------------- */

const N = 20000
const sumMcf = ZONE.mcf.reduce((a, b) => a + b, 0)
const histFrac = 1 - sumMcf // null_frac = 0
const NB = ZONE.hb.length - 1

function histLess(v: number) {
  const hb = ZONE.hb
  if (v <= hb[0]) return { sel: 0, bucket: -1, part: 0 }
  if (v > hb[NB]) return { sel: 1, bucket: NB, part: 1 }
  let i = 0
  while (v > hb[i + 1]) i++
  const part = (v - hb[i]) / (hb[i + 1] - hb[i])
  return { sel: (i + part) / NB, bucket: i, part }
}

type Mode = 'eq' | 'lt' | 'ext'
const W = 640

function McvChart({ mode, v }: { mode: Mode; v: number }) {
  const bw = (W - 20) / ZONE.mcv.length
  return (
    <svg viewBox={`0 0 ${W} 132`} className="w-full min-w-[560px]" role="img" aria-label="Most common values and their frequencies">
      {ZONE.mcv.map((m, i) => {
        const hit = mode === 'eq' ? m === v : m < v
        const h = (ZONE.mcf[i] / 0.23) * 86
        return (
          <g key={m}>
            <motion.rect x={10 + i * bw + 6} width={bw - 12} initial={false} animate={{ y: 100 - Math.max(h, 2), height: Math.max(h, 2) }}
              rx={3} fill={hit ? tone('new') : toneBg('header', 45)} stroke={hit ? tone('new') : tone('header')} />
            <text x={10 + i * bw + bw / 2} y={114} textAnchor="middle" fontSize={11} fontWeight={hit ? 700 : 500} fill="var(--text)" fontFamily="var(--font-mono)">{m}</text>
            <text x={10 + i * bw + bw / 2} y={127} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{ZONE.mcf[i]}</text>
            {h > 18 && <text x={10 + i * bw + bw / 2} y={100 - h + 13} textAnchor="middle" fontSize={10} fontWeight={700} fill={hit ? 'var(--surface)' : 'var(--text)'} fontFamily="var(--font-mono)">{Math.round(ZONE.mcf[i] * 100)}%</text>}
          </g>
        )
      })}
    </svg>
  )
}

function HistChart({ mode, v }: { mode: Mode; v: number }) {
  const x = (z: number) => 10 + ((z - 1) / 499) * (W - 20)
  const perValue = (0.1 * histFrac * N) / 49.9 // rows per value a bucket of average width implies
  const h = histLess(v)
  return (
    <svg viewBox={`0 0 ${W} 150`} className="w-full min-w-[560px]" role="img" aria-label="Equal-frequency histogram of the non-MCV values">
      {/* actual per-value counts of non-MCV values (faint) */}
      {ZONE.cnt.map((c, z) => (z >= 1 && z <= 500 && !ZONE.mcv.includes(z) && c > 0
        ? <line key={z} x1={x(z)} x2={x(z)} y1={100} y2={100 - Math.min(92, (c / perValue) * 56)} stroke="var(--muted)" strokeOpacity={0.45} /> : null))}
      {ZONE.hb.slice(0, -1).map((lo, i) => {
        const hi = ZONE.hb[i + 1]
        const height = Math.min(92, 56 * (0.1 / ((hi - lo) / 499)))
        const full = mode === 'lt' && i < h.bucket
        const partial = mode === 'lt' && i === h.bucket
        return (
          <g key={lo}>
            <rect x={x(lo)} y={100 - height} width={x(hi) - x(lo)} height={height} fill={toneBg('tuple', 14)} stroke={tone('tuple')} strokeWidth={0.8} />
            {(full || partial) && (
              <motion.rect x={x(lo)} y={100 - height} initial={false} animate={{ width: (x(hi) - x(lo)) * (full ? 1 : h.part) }} height={height} fill={toneBg('new', 55)} />
            )}
            <text x={x(lo)} y={116} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{lo}</text>
          </g>
        )
      })}
      <text x={x(500)} y={116} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">500</text>
      <text x={10} y={136} fontSize={10} fill="var(--muted)">{`10 buckets between 11 histogram_bounds, each holding 10% of the ${(histFrac * 100).toFixed(1)}% of rows that are not MCVs`}</text>
      <motion.g initial={false} animate={{ x: x(v) }} transition={{ type: 'spring', stiffness: 200, damping: 24 }}>
        <line x1={0} x2={0} y1={8} y2={104} stroke="var(--c-new)" strokeWidth={2} />
        <rect x={-22} y={0} width={44} height={15} rx={4} fill="var(--c-new)" />
        <text x={0} y={11} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--surface)" fontFamily="var(--font-mono)">{v}</text>
      </motion.g>
    </svg>
  )
}

const EXAMPLES: [Mode, number][] = [['eq', 7], ['eq', 99], ['lt', 60], ['lt', 300], ['ext', 0]]

function StatsViz() {
  const [mode, setMode] = useState<Mode>('eq')
  const [v, setV] = useState(7)
  const [ex, setEx] = useState(0)
  const [ext, setExt] = useState(false)
  const next = () => { const n = (ex + 1) % EXAMPLES.length; setEx(n); setMode(EXAMPLES[n][0]); if (EXAMPLES[n][0] !== 'ext') setV(EXAMPLES[n][1]) }

  const mi = ZONE.mcv.indexOf(v)
  const actual = mode === 'eq' ? ZONE.cnt[v] : ZONE.cnt.slice(0, v).reduce((a, b) => a + b, 0)
  const pg = mode === 'eq' ? ZONE.zeq[v] : ZONE.zlt[v]
  const h = histLess(v)
  const mcvBelow = ZONE.mcf.filter((_, i) => ZONE.mcv[i] < v).reduce((a, b) => a + b, 0)
  // `<` is strict: scalarineqsel takes the share of rows equal to v (one non-MCV value) back out of the histogram
  // fraction, and in the first bucket adds back the part of it that lies above v. Matches the planner to within a row.
  const eqNon = 1 / (ZONE.nDistinct - ZONE.mcv.length)
  const hAdj = h.bucket < 0 ? 0 : Math.max(0, h.sel - eqNon + (h.bucket === 0 ? eqNon * (1 - h.part) : 0))
  const sel = mode === 'eq' ? (mi >= 0 ? ZONE.mcf[mi] : histFrac / (ZONE.nDistinct - ZONE.mcv.length)) : mcvBelow + hAdj * histFrac

  const formula: [string, string, string?][] = mode === 'eq'
    ? mi >= 0
      ? [['rule', `${v} is MCV #${mi + 1}`, 'use its frequency directly'], ['selectivity', `most_common_freqs[${mi + 1}] = ${ZONE.mcf[mi]}`], ['rows', `${N} × ${ZONE.mcf[mi]} = ${Math.round(N * sel)}`]]
      : [['rule', `${v} is not in the MCV list`, 'spread the rest evenly'], ['selectivity', `(1 − ${sumMcf.toFixed(5)}) / (${ZONE.nDistinct} − ${ZONE.mcv.length}) = ${sel.toFixed(6)}`, '(1 − Σ freqs − null_frac) / (n_distinct − #MCVs)'], ['rows', `${N} × ${sel.toFixed(6)} = ${Math.round(N * sel)}`]]
    : [['MCV part', `Σ freqs of MCVs < ${v} = ${mcvBelow.toFixed(5)}`, 'exact for the MCVs'],
      ['histogram part', h.bucket < 0 ? '0' : `(${h.bucket} + (${v} − ${ZONE.hb[h.bucket]}) / (${ZONE.hb[h.bucket + 1]} − ${ZONE.hb[h.bucket]})) / ${NB} = ${h.sel.toFixed(4)}`, 'linear inside the bucket'],
      ['strict <', `${h.sel.toFixed(4)} − ${(h.sel - hAdj).toFixed(4)} = ${hAdj.toFixed(4)}`, 'rows equal to v do not match: take out 1 / (n_distinct − #MCVs)'],
      ['selectivity', `${mcvBelow.toFixed(5)} + ${hAdj.toFixed(4)} × ${histFrac.toFixed(5)} = ${sel.toFixed(5)}`, 'histogram covers only non-MCV rows'],
      ['rows', `${N} × ${sel.toFixed(5)} = ${Math.round(N * sel)}`]]

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Predicate" value={mode} onChange={setMode} options={[['eq', 'zone = v (MCV)'], ['lt', 'zone < v (histogram)'], ['ext', 'zip AND city (extended stats)']]} />
        <Btn primary testid="viz-next" onClick={next}>Next example</Btn>
      </div>
      {mode !== 'ext' ? (
        <>
          <Slider label="v" value={v} min={2} max={500} onChange={setV} show={v} />
          <Tiles items={[['Formula', Math.round(N * sel).toLocaleString()], ['PostgreSQL estimate', pg.toLocaleString(), 'ok'], ['Actual rows', actual.toLocaleString()], ['Off by', actual ? `${(Math.max(pg, actual) / Math.max(1, Math.min(pg, actual))).toFixed(2)}×` : '—']]} />
          <Legend items={[['header', 'MCV (most_common_vals)'], ['tuple', 'histogram bucket'], ['new', 'counted for this predicate'], ['muted', 'actual rows per value']]} />
          <div className="grid gap-2">
            <Panel title={`most_common_vals: ${(sumMcf * 100).toFixed(1)}% of rows`}><div className="overflow-x-auto scrollbar-thin"><McvChart mode={mode} v={v} /></div></Panel>
            <Panel title="histogram_bounds (non-MCV rows)"><div className="overflow-x-auto scrollbar-thin"><HistChart mode={mode} v={v} /></div></Panel>
          </div>
          <Panel title={mode === 'eq' ? 'eqsel: equality selectivity' : 'scalarltsel: range selectivity'}><FieldTable rows={formula} /></Panel>
          <Msg k={`${mode}-${mi >= 0}-${h.bucket}`} text={mode === 'eq'
            ? mi >= 0 ? `An exact hit: the MCV list stores **${v}** with its frequency, so the estimate equals the truth.` : `Every non-MCV value is assumed equally common. For ${v} that gives **${pg}** rows against **${actual}** actual. Uniform guesses are only as good as the data is uniform.`
            : `MCVs below ${v} are counted exactly. The histogram then adds its share, assuming values are spread **linearly inside each bucket**. MCVs are excluded from the histogram, so it is scaled by ${histFrac.toFixed(3)}.`} />
        </>
      ) : <ExtStats on={ext} toggle={() => setExt((x) => !x)} />}
    </div>
  )
}

function ExtStats({ on, toggle }: { on: boolean; toggle: () => void }) {
  const rows: { q: string; before: number; after: number; actual: number; note: string }[] = [
    { q: 'WHERE zip = 42 AND city = 4', before: 5, after: 100, actual: 100, note: 'zip alone: 100 rows (1/200). city alone: 1000 rows (1/20). Independence multiplies: 20000 × 0.005 × 0.05 = **5**.' },
    { q: 'GROUP BY city, zip', before: 2000, after: 200, actual: 200, note: 'Without stats, groups are estimated from the per-column counts, capped at a tenth of the rows (**2000**). The `ndistinct` statistic knows there are 200 combinations.' },
    { q: 'WHERE zip = 42 AND city = 9', before: 5, after: 100, actual: 0, note: 'Dependencies assume the values are **compatible**. zip 42 belongs to city 4, so the true answer is 0, yet with the statistics the estimate jumps to **100**.' },
  ]
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={toggle}>{on ? 'DROP STATISTICS' : 'CREATE STATISTICS (dependencies, ndistinct) ON city, zip; ANALYZE'}</Btn>
        {on && <span className="font-mono text-xs text-muted">pg_stats_ext: dependencies {'{"4 => 5": 1.000000}'} · n_distinct {'{"4, 5": 200}'}</span>}
      </div>
      {rows.map((r) => {
        const est = on ? r.after : r.before
        const max = Math.max(r.before, r.after, r.actual, 1) * 1.1
        return (
          <Panel key={r.q} title={r.q}>
            <div className="grid gap-1.5">
              <Bar label="estimated" value={est} max={max} t={Math.abs(est - r.actual) <= r.actual * 0.1 && r.actual ? 'ok' : 'dead'} win note={est.toLocaleString()} />
              <Bar label="actual" value={r.actual} max={max} t="tuple" note={r.actual.toLocaleString()} />
              <p className="text-xs text-muted"><Md>{r.note}</Md></p>
            </div>
          </Panel>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE trips (id int, zone int NOT NULL, fare int NOT NULL, zip int NOT NULL, city int NOT NULL);
INSERT INTO trips SELECT g,
  CASE WHEN g % 100 < 22 THEN 7 WHEN g % 100 < 34 THEN 3 WHEN g % 100 < 42 THEN 12
       WHEN g % 100 < 47 THEN 40 ELSE 1 + abs(hashint4(g)) % 500 END,
  abs(hashint4(g + 1)) % 5000,
  g % 200,
  (g % 200) / 10
FROM generate_series(1, 20000) g;
ALTER TABLE trips ALTER COLUMN zone SET STATISTICS 10;
ANALYZE trips;`

export const lesson: Lesson = {
  slug: 'statistics',
  module: 'm4',
  order: 3,
  title: 'Planner statistics',
  tldr: [
    '`ANALYZE` samples each table and stores per-column **statistics** (null fraction, distinct count, most common values, an equal-frequency histogram and physical correlation) that the planner turns into row-count estimates.',
    'Every cost in a plan is multiplied by those estimates, so knowing how `eqsel` and `scalarltsel` read `pg_stats` (and where their independence assumption breaks) explains most bad plans.',
  ],
  visualizer: {
    title: 'Estimate rows from a real pg_stats row',
    caption: 'Drag the constant and watch the MCV list and histogram produce the estimate, matched against PostgreSQL\'s own number and the true count. The third mode shows correlated columns and extended statistics.',
    Component: StatsViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'Before the first ANALYZE', sql: `CREATE TABLE people (id int GENERATED BY DEFAULT AS IDENTITY,
                     first_name varchar(50) NOT NULL, last_name varchar(50) NOT NULL);
INSERT INTO people (first_name, last_name)
SELECT (ARRAY['Lou','Ann','Bob','Cid','Dee','Eve','Gus','Ida'])[1 + g % 8],
       (ARRAY['Adams','Baker','Clark','Davis','Evans','Ford','Gray','Hill','Irwin','Jones'])[1 + (g / 8) % 10] || (g % 50)
FROM generate_series(1, 10000) g;
SELECT relpages, reltuples FROM pg_class WHERE relname = 'people';
EXPLAIN SELECT * FROM people WHERE last_name = 'Adams1';

ANALYZE people;
EXPLAIN SELECT * FROM people WHERE last_name = 'Adams1';
SELECT count(*) FROM people WHERE last_name = 'Adams1';
DROP TABLE people;`,
        note: 'Never analyzed: `reltuples = -1`, and the plan guesses **rows=8 width=240**. The width comes from the declared `varchar(50)` sizes, and the row count from a default selectivity. After ANALYZE: rows=25, width=15, and the real count is 25.' },
      { label: 'Read pg_stats', sql: `SELECT attname, null_frac, n_distinct, most_common_vals, most_common_freqs, histogram_bounds, correlation
FROM pg_stats WHERE tablename = 'trips' AND attname IN ('zone', 'id');`,
        note: '`zone` (target 10): 10 MCVs covering 48.5% of rows and 11 histogram bounds. `id`: `n_distinct = -1` means "unique", and the histogram has 101 bounds at the default target of 100.' },
      { label: 'Under the hood: pg_statistic', sql: `SELECT a.attname, s.stanullfrac, s.stadistinct, s.stawidth,
       s.stakind1, s.stakind2, s.stakind3,
       s.stanumbers1[1:3] AS first_freqs
FROM pg_statistic s
JOIN pg_attribute a ON a.attrelid = s.starelid AND a.attnum = s.staattnum
WHERE s.starelid = 'trips'::regclass
ORDER BY a.attnum;`,
        note: '`pg_stats` is a readable view over this catalog. Each column has five slots; `stakind` says what a slot holds: **1** = most common values (frequencies in `stanumbers`), **2** = histogram bounds, **3** = correlation. A unique column has no MCV slot, so it starts with the histogram.' },
      { label: 'Equality: MCV vs not', sql: `EXPLAIN SELECT * FROM trips WHERE zone = 7;
EXPLAIN SELECT * FROM trips WHERE zone = 99;
SELECT zone, count(*) FROM trips WHERE zone IN (7, 99) GROUP BY zone;`,
        note: 'zone 7 is an MCV with frequency 0.2214, so the estimate is 4428. zone 99 is not, so it gets (1 − 0.48515) / 490 × 20000 = **21** rows.' },
      { label: 'Range: MCV + histogram', sql: `EXPLAIN SELECT * FROM trips WHERE zone < 60;
SELECT count(*) FROM trips WHERE zone < 60;`,
        note: 'MCVs 7, 3, 12 and 40 contribute 0.4753 exactly. The histogram adds one full bucket plus 9/54 of bucket 51–105, times the non-MCV share 0.515, minus the 21 rows estimated to equal 60 (they do not satisfy `<`). Estimate **10686**, actual 10706.' },
      { label: 'Independence assumption', sql: `EXPLAIN SELECT * FROM trips WHERE zip = 42 AND city = 4;
SELECT count(*) FROM trips WHERE zip = 42 AND city = 4;
EXPLAIN SELECT city, zip, count(*) FROM trips GROUP BY city, zip;`,
        note: 'zip determines city, but the planner multiplies their selectivities: **5** rows estimated vs 100 real, and 2000 groups vs 200.' },
      { label: 'Extended statistics', sql: `DROP STATISTICS IF EXISTS trips_city_zip, trips_city_zip_mcv;
CREATE STATISTICS trips_city_zip (dependencies, ndistinct) ON city, zip FROM trips;
ANALYZE trips;
SELECT statistics_name, dependencies, n_distinct FROM pg_stats_ext WHERE tablename = 'trips';
EXPLAIN SELECT * FROM trips WHERE zip = 42 AND city = 4;
EXPLAIN SELECT city, zip, count(*) FROM trips GROUP BY city, zip;

-- an impossible pair: zip 42 belongs to city 4, not 9
EXPLAIN SELECT * FROM trips WHERE zip = 42 AND city = 9;
CREATE STATISTICS trips_city_zip_mcv (mcv) ON city, zip FROM trips;
ANALYZE trips;
EXPLAIN SELECT * FROM trips WHERE zip = 42 AND city = 9;`,
        note: '`{"4 => 5": 1.000000}`: column 4 (zip) fully determines column 5 (city). Estimates become 100 rows and 200 groups. CREATE STATISTICS collects nothing until ANALYZE runs. A dependency assumes the values are compatible, so the impossible pair is also estimated at 100 rows (actual 0). The `mcv` kind stores real value combinations and brings it back down to 5.' },
      { label: 'Statistics target', sql: `ALTER TABLE trips ALTER COLUMN zone SET STATISTICS 100;
ANALYZE trips;
SELECT array_length(most_common_vals, 1) AS mcvs, array_length(histogram_bounds, 1) AS bounds
FROM pg_stats WHERE tablename = 'trips' AND attname = 'zone';
EXPLAIN SELECT * FROM trips WHERE zone = 99;`,
        note: 'With target 100 the MCV list grows to 100 entries and the histogram gets more bounds, so more values get exact frequencies instead of the uniform guess.' },
    ],
  },
  production: {
    title: 'A nested loop over 50,000 "one row" matches',
    context: 'A logistics app filtered shipments with `WHERE carrier_id = $1 AND service_code = $2`. Each service code belongs to exactly one carrier, so the two columns are perfectly correlated.',
    problem: 'The planner multiplied the two selectivities and estimated a handful of rows. It chose a nested loop that probed another large table once per row. The real count was tens of thousands, and the query ran for seconds.',
    solution: 'Teach the planner about the correlation with extended statistics, then re-analyze. Use `dependencies` for equality filters and `ndistinct` for GROUP BY on the pair. Check `pg_stats_ext` to confirm the dependency degree is close to 1.',
    sql: `CREATE STATISTICS shipments_carrier_service (dependencies, ndistinct)
  ON carrier_id, service_code FROM shipments;
ANALYZE shipments;
SELECT dependencies, n_distinct FROM pg_stats_ext
WHERE statistics_name = 'shipments_carrier_service';`,
    outcome: 'In the playground\'s version of the same shape, the estimate goes from 5 rows to 100 (actual 100) and GROUP BY from 2000 groups to 200 (actual 200). With correct estimates the planner switches to a hash join on the real workload.',
  },
  pitfalls: [
    { title: 'No statistics after a bulk load',
      symptom: 'Right after loading or creating a table, queries get absurd estimates and plans until autovacuum catches up.',
      cause: 'Statistics are only collected by `ANALYZE` (manual, autovacuum, or VACUUM ANALYZE). A fresh table has none, and the planner falls back to fixed default selectivities.',
      fix: 'Run `ANALYZE` as the last step of every bulk load or migration, and after creating an **expression index** (its expression gets its own statistics). After a major upgrade, PostgreSQL 18\'s `pg_upgrade` carries per-column statistics over, but not extended statistics: run `vacuumdb --all --analyze-in-stages --missing-stats-only` to fill in the rest.',
      sql: `ANALYZE trips;` },
    { title: 'Correlated columns',
      symptom: 'Estimated rows are orders of magnitude below actual rows for filters on two related columns (city and zip, tenant and account).',
      cause: 'The planner assumes predicates are **independent** and multiplies their selectivities.',
      fix: 'Create extended statistics (`dependencies`, `ndistinct` or `mcv`) on the column group, then ANALYZE. Use `mcv` when value combinations matter or when filters are not plain equality.' },
    { title: 'n_distinct badly estimated from the sample',
      symptom: 'GROUP BY or join estimates are far off on a large table with a skewed column, even right after ANALYZE.',
      cause: 'ANALYZE reads a sample of 300 × statistics target rows. Distinct counts are hard to extrapolate from a sample.',
      fix: 'Raise the target for that column, or pin the value: `ALTER TABLE t ALTER COLUMN c SET (n_distinct = -0.05)` (negative means a fraction of rows), then ANALYZE.' },
  ],
  pointers: [
    '`pg_stats`: **null_frac**, **n_distinct** (positive count, negative fraction, −1 unique), **most_common_vals/freqs**, **histogram_bounds**, **correlation**.',
    '`=` on an MCV uses its frequency. Otherwise **(1 − Σ mcv freqs − null_frac) / (n_distinct − #MCVs)**.',
    '`<` sums matching MCV freqs exactly, then adds histogram buckets (linear inside a bucket) scaled by the non-MCV fraction.',
    'ANDed predicates are **multiplied**. Correlated columns need `CREATE STATISTICS` (dependencies, ndistinct, mcv) plus ANALYZE.',
    '`default_statistics_target` = **100** caps MCVs and histogram buckets. ANALYZE samples 300 × the largest target rows. See [Reading EXPLAIN (ANALYZE, BUFFERS)](/m4/explain-analyze) to spot a misestimate.',
  ],
  sources: ['planner-stats.html', 'planner-stats-details.html', 'row-estimation-examples.html', 'multivariate-statistics-examples.html', 'view-pg-stats.html', 'sql-analyze.html', 'sql-createstatistics.html'],
}
