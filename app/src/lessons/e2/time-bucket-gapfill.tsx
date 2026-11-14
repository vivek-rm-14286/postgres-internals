import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Code, EditionTag, H, DAY, fmtDT } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer A: time_bucket semantics on a 72-hour axis (2026-03-28 → 2026-03-31 UTC) that crosses the
 * Europe/Berlin spring-forward switch (2026-03-29 01:00 UTC: CET +1 → CEST +2). Boundaries are
 * origin + offset + k·width; with a time zone they are computed on local wall-clock time and converted
 * back, so the local day of 29 March lasts 23 hours (checked with generate_series(..., 'Europe/Berlin')).
 * Nonexistent local times (02:00–03:00 on that day) resolve as standard time, as PostgreSQL does.
 * Visualizer B: device 1's hourly averages from the playground (11, –, 20, –, –, 50), with real
 * gapfill / locf / interpolate results (interpolate: 15.5, 30, 40).
 * ---------------------------------------------------------------------------------------------- */

const A0 = Date.UTC(2026, 2, 28), A1 = A0 + 72 * H
const DST = Date.UTC(2026, 2, 29, 1) // UTC instant of the switch
const MON = Date.UTC(2000, 0, 3), SUN = Date.UTC(2000, 0, 2)
type W = '2h' | '6h' | '1d' | '7d'
const WMS: Record<W, number> = { '2h': 2 * H, '6h': 6 * H, '1d': DAY, '7d': 7 * DAY }
const WSQL: Record<W, string> = { '2h': '2 hours', '6h': '6 hours', '1d': '1 day', '7d': '7 days' }
type Off = '0' | '1' | '-2'
type Tz = 'utc' | 'berlin'

const toLocal = (u: number) => u + (u < DST ? H : 2 * H)
const toUtc = (l: number) => { const gap0 = DST + H; return l < gap0 + H ? l - H : l - 2 * H } // local < 03:00 on the switch day → CET
function boundaries(w: W, origin: number, off: number, tz: Tz) {
  const ms = WMS[w], out: number[] = []
  const lo = tz === 'utc' ? A0 : toLocal(A0), hi = tz === 'utc' ? A1 : toLocal(A1)
  const o = origin + off
  for (let k = Math.floor((lo - o) / ms) - 1; o + k * ms <= hi + ms; k++) {
    const b = o + k * ms
    out.push(tz === 'utc' ? b : toUtc(b))
  }
  return out
}
// deterministic readings, roughly every 95 minutes
const READ = Array.from({ length: 44 }, (_, i) => ({ t: A0 + 30 * 60_000 + i * 95 * 60_000 + ((i * 37) % 40) * 60_000, v: Math.round(18 + 6 * Math.sin(i / 4) + (i % 3)) }))
  .filter((r) => r.t < A1)

function BucketViz({ step }: { step: number }) {
  const ws: W[] = ['2h', '6h', '1d', '7d']
  const [w, setW] = useState<W>('6h')
  const [org, setOrg] = useState<'mon' | 'sun'>('mon')
  const [off, setOff] = useState<Off>('0')
  const [tz, setTz] = useState<Tz>('utc')
  const [seen, setSeen] = useState(step)
  if (seen !== step) { setSeen(step); setW(ws[(ws.indexOf(w) + 1) % ws.length]) }
  const bs = boundaries(w, org === 'mon' ? MON : SUN, +off * H, tz)
  const X0 = 14, X1 = 626
  const x = (t: number) => X0 + ((Math.max(A0, Math.min(A1, t)) - A0) / (A1 - A0)) * (X1 - X0)
  const buckets = bs.slice(0, -1).map((b, i) => ({ lo: b, hi: bs[i + 1] })).filter((b) => b.hi > A0 && b.lo < A1)
  const bucketOf = (t: number) => buckets.findIndex((b) => t >= b.lo && t < b.hi)
  const stats = buckets.map((b) => { const r = READ.filter((p) => p.t >= b.lo && p.t < b.hi); return { n: r.length, avg: r.length ? r.reduce((a, p) => a + p.v, 0) / r.length : null } })
  const args = [`'${WSQL[w]}'`, 'time', off !== '0' ? `"offset" => '${off} hours'` : '', org === 'sun' ? "origin => '2000-01-02'" : '', tz === 'berlin' ? "timezone => 'Europe/Berlin'" : ''].filter(Boolean)
  const origin = `timestamptz '2000-01-0${org === 'mon' ? 3 : 2}'${off !== '0' ? ` + interval '${off} hours'` : ''}`
  const native = tz === 'utc'
    ? `date_bin('${WSQL[w]}', time, ${origin})`
    : `date_bin('${WSQL[w]}', time AT TIME ZONE 'Europe/Berlin',\n         timestamp '2000-01-0${org === 'mon' ? 3 : 2}'${off !== '0' ? ` + interval '${off} hours'` : ''})\n  AT TIME ZONE 'Europe/Berlin'`
  const lens = buckets.map((b) => (b.hi - b.lo) / H)
  const odd = tz === 'berlin' && lens.some((l) => l !== WMS[w] / H && l > 0)
  const days = Array.from({ length: 4 }, (_, i) => A0 + i * DAY)
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Bucket width" value={w} onChange={setW} options={[['2h', '2 hours'], ['6h', '6 hours'], ['1d', '1 day'], ['7d', '7 days']]} />
        <Segmented label="Origin" value={org} onChange={setOrg} options={[['mon', 'origin: Monday (default)'], ['sun', 'Sunday']]} />
        <Segmented label="Offset" value={off} onChange={setOff} options={[['0', 'offset 0'], ['1', '+1 h'], ['-2', '−2 h']]} />
        <Segmented label="Time zone" value={tz} onChange={setTz} options={[['utc', 'UTC'], ['berlin', 'Europe/Berlin']]} />
      </div>
      <Legend items={[['tuple', 'bucket A'], ['pointer', 'bucket B (alternating)'], ['new', 'bucket start'], ['dead', 'DST switch in Berlin']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 170" className="w-full min-w-[560px]" role="img" aria-label="Readings grouped into time buckets">
          {days.map((d) => (
            <g key={d}><line x1={x(d)} x2={x(d)} y1={14} y2={150} stroke="var(--border)" />
              {d < A1 - DAY / 2 && <text x={x(d) + 4} y={12} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{fmtDT(d).slice(0, 6)} 00:00 UTC</text>}</g>
          ))}
          <line x1={x(DST)} x2={x(DST)} y1={18} y2={150} stroke={tone('dead')} strokeDasharray="3 3" />
          <text x={x(DST) + 3} y={160} fontSize={9.5} fill={tone('dead')} fontFamily="var(--font-mono)">Berlin DST 01:00Z</text>
          <AnimatePresence initial={false}>
            {buckets.map((b, i) => {
              const t = i % 2 ? 'pointer' : 'tuple'
              const bx = x(b.lo), bw = Math.max(1, x(b.hi) - x(b.lo))
              return (
                <motion.g key={`${w}${org}${off}${tz}${b.lo}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <rect x={bx} y={22} width={bw} height={90} fill={toneBg(t, 14)} stroke={tone(t)} strokeOpacity={0.5} />
                  {b.lo >= A0 && <line x1={bx} x2={bx} y1={18} y2={120} stroke={tone('new')} strokeWidth={1.6} />}
                  {bw > 34 && <text x={bx + bw / 2} y={132} textAnchor="middle" fontSize={9.5} fill="var(--text)" fontFamily="var(--font-mono)">n={stats[i].n}</text>}
                  {bw > 34 && stats[i].avg !== null && <text x={bx + bw / 2} y={144} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">avg {stats[i].avg!.toFixed(1)}</text>}
                  {bw > 50 && lens[i] !== WMS[w] / H && <text x={bx + bw / 2} y={34} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={tone('dead')} fontFamily="var(--font-mono)">{lens[i]} h</text>}
                </motion.g>
              )
            })}
          </AnimatePresence>
          {READ.map((r, i) => {
            const k = bucketOf(r.t)
            return <motion.circle key={i} initial={false} animate={{ cx: x(r.t), cy: 108 - (r.v - 10) * 3.4, fill: tone(k % 2 ? 'pointer' : 'tuple') }} r={3.2} transition={{ type: 'spring', stiffness: 160, damping: 20 }} />
          })}
        </svg>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="TimescaleDB">
          <Code>{args.length > 2 ? `time_bucket(${args.slice(0, 2).join(', ')},\n            ${args.slice(2).join(',\n            ')})` : `time_bucket(${args.join(', ')})`}</Code>
          <p className="mt-2 text-xs"><EditionTag ed="apache" /></p>
        </Panel>
        <Panel title="Native PostgreSQL equivalent">
          <Code>{native}</Code>
        </Panel>
      </div>
      <p className="text-sm text-muted"><Md>{
        w === '7d' ? (org === 'mon' ? 'Weekly buckets start on **Monday** because the default origin, 2000-01-03, was a Monday. Here the boundary falls on Mon 30 Mar.' : 'With `origin => \'2000-01-02\'` (a Sunday) weeks start on **Sunday**, so the boundary moves to 29 Mar.')
          : odd ? 'Buckets are cut on **Berlin wall-clock time** and converted back to UTC. The night clocks jump from 02:00 to 03:00 has one bucket that is **shorter by an hour**.'
            : tz === 'berlin' ? 'Berlin midnight is 23:00 UTC before the switch and 22:00 UTC after it, so the boundaries shift by an hour across the dashed line.'
              : off !== '0' ? `\`offset\` slides every boundary by ${off} hour${Math.abs(+off) > 1 ? 's' : ''}. It is the same as moving the origin.`
                : '`time_bucket` returns the **start** of the bucket each row falls into. Boundaries are origin + k × width, aligned on **UTC** by default. Every reading (dot) takes the colour of its bucket.'
      }</Md></p>
    </div>
  )
}

type Fill = 'plain' | 'gap' | 'locf' | 'interp'
const HOURS = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00']
const AVG: (number | null)[] = [11, null, 20, null, null, 50]
const LOCF = [11, 11, 20, 20, 20, 50]
const INTERP = [11, 15.5, 20, 30, 40, 50]
const RAW = [{ h: 10 / 60, v: 10 }, { h: 40 / 60, v: 12 }, { h: 2.25, v: 20 }, { h: 5 + 5 / 60, v: 50 }]
const FILL_SQL: Record<Fill, string> = {
  plain: `SELECT time_bucket('1 hour', time) AS hour, avg(value)
FROM metrics
WHERE device_id = 1
GROUP BY hour ORDER BY hour;`,
  gap: `SELECT time_bucket_gapfill('1 hour', time) AS hour, avg(value)
FROM metrics
WHERE device_id = 1
  AND time >= '2026-01-05 00:00' AND time < '2026-01-05 06:00'
GROUP BY hour ORDER BY hour;`,
  locf: `SELECT time_bucket_gapfill('1 hour', time) AS hour,
       locf(avg(value))
FROM metrics
WHERE device_id = 1
  AND time >= '2026-01-05 00:00' AND time < '2026-01-05 06:00'
GROUP BY hour ORDER BY hour;`,
  interp: `SELECT time_bucket_gapfill('1 hour', time) AS hour,
       interpolate(avg(value))
FROM metrics
WHERE device_id = 1
  AND time >= '2026-01-05 00:00' AND time < '2026-01-05 06:00'
GROUP BY hour ORDER BY hour;`,
}
const FILL_NOTE: Record<Fill, string> = {
  plain: 'Plain `time_bucket` + GROUP BY returns **only buckets that have rows**: 3 rows. A chart would draw a straight line from 02:00 to 05:00 as if data existed.',
  gap: '`time_bucket_gapfill` emits **every bucket between the WHERE bounds**, with NULL where no rows exist. The upper bound in WHERE is required.',
  locf: '`locf()` (last observation carried forward) repeats the previous value: right for state-like signals such as a setpoint or a price.',
  interp: '`interpolate()` draws a straight line between neighbours: 15.5 halfway between 11 and 20, then 30 and 40 on the way to 50.',
}

function GapViz({ step }: { step: number }) {
  const fills: Fill[] = ['plain', 'gap', 'locf', 'interp']
  const [f, setF] = useState<Fill>('plain')
  const [seen, setSeen] = useState(step)
  if (seen !== step) { setSeen(step); setF(fills[(fills.indexOf(f) + 1) % fills.length]) }
  const val = (i: number) => (f === 'locf' ? LOCF[i] : f === 'interp' ? INTERP[i] : AVG[i])
  const filled = (i: number) => AVG[i] === null && (f === 'locf' || f === 'interp')
  const present = (i: number) => f !== 'plain' || AVG[i] !== null
  const X0 = 40, BW = 92, Y = (v: number) => 150 - v * 2.4
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Fill mode" value={f} onChange={setF} options={[['plain', 'time_bucket'], ['gap', 'time_bucket_gapfill'], ['locf', '+ locf'], ['interp', '+ interpolate']]} />
        {f !== 'plain' && <EditionTag ed="community" />}
      </div>
      <Legend items={[['tuple', 'average of real rows'], ['new', 'filled value'], ['muted', 'NULL bucket'], ['pointer', 'raw reading']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 190" className="w-full min-w-[520px]" role="img" aria-label="Hourly averages with gap filling">
          {[0, 20, 40, 60].map((v) => (
            <g key={v}><line x1={X0} x2={X0 + 6 * BW} y1={Y(v)} y2={Y(v)} stroke="var(--border)" strokeDasharray="2 3" />
              <text x={X0 - 6} y={Y(v) + 3} textAnchor="end" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{v}</text></g>
          ))}
          {HOURS.map((h, i) => {
            const v = val(i), show = present(i)
            const t = filled(i) ? 'new' : 'tuple'
            return (
              <g key={h}>
                <text x={X0 + i * BW + BW / 2} y={168} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{h}</text>
                <AnimatePresence>
                  {show && v !== null && (
                    <motion.rect key="bar" initial={{ height: 0, y: Y(0) }} animate={{ height: Y(0) - Y(v), y: Y(v) }} exit={{ height: 0, y: Y(0), opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 160, damping: 20 }} x={X0 + i * BW + 16} width={BW - 32} rx={3}
                      fill={toneBg(t, 30)} stroke={tone(t)} strokeDasharray={filled(i) ? '4 2' : undefined} />
                  )}
                </AnimatePresence>
                {show && v !== null && <motion.text initial={false} animate={{ y: Y(v) - 5 }} x={X0 + i * BW + BW / 2} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={tone(t)} fontFamily="var(--font-mono)">{v}</motion.text>}
                {show && v === null && <text x={X0 + i * BW + BW / 2} y={Y(0) - 6} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">NULL</text>}
                {!show && <text x={X0 + i * BW + BW / 2} y={Y(0) - 6} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">no row</text>}
              </g>
            )
          })}
          {RAW.map((r, i) => <circle key={i} cx={X0 + r.h * BW} cy={Y(r.v)} r={3.5} fill={tone('pointer')} />)}
          <line x1={X0} x2={X0 + 6 * BW} y1={Y(0)} y2={Y(0)} stroke="var(--muted)" />
          <text x={X0} y={184} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">device 1, 2026-01-05 (UTC)</text>
        </svg>
      </div>
      <div className="grid gap-3 lg:grid-cols-[3fr_2fr] [&>*]:min-w-0">
        <Panel title="TimescaleDB query"><Code>{FILL_SQL[f]}</Code></Panel>
        <Panel title="Result">
          <table className="w-full font-mono text-[12px]"><tbody>
            {HOURS.map((h, i) => present(i) && (
              <motion.tr key={h} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-line last:border-0">
                <td className="py-0.5 pr-3">{h}</td>
                <td className="py-0.5" style={{ color: filled(i) ? tone('new') : val(i) === null ? 'var(--muted)' : undefined }}>{val(i) ?? 'NULL'}</td>
              </motion.tr>
            ))}
          </tbody></table>
        </Panel>
      </div>
      <p className="text-sm text-muted"><Md>{FILL_NOTE[f]}</Md></p>
    </div>
  )
}

function Viz() {
  const [mode, setMode] = useState<'bucket' | 'gap'>('bucket')
  const [step, setStep] = useState(0)
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="View" value={mode} onChange={setMode} options={[['bucket', 'Bucketing'], ['gap', 'Gap filling']]} />
        <Btn primary testid="viz-next" onClick={() => setStep((s) => s + 1)}>{mode === 'bucket' ? 'Next width' : 'Next fill mode'}</Btn>
      </div>
      {mode === 'bucket' ? <BucketViz step={step} /> : <GapViz step={step} />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'time-bucket-gapfill',
  module: 'e2',
  order: 3,
  title: 'time_bucket and gap filling',
  tldr: [
    '`time_bucket` maps every timestamp to the start of a fixed-width bucket, and `time_bucket_gapfill` with `locf` or `interpolate` adds rows for buckets that have no data.',
    'Charts and rollups need one row per interval, while real sensors report irregularly and go silent, so bucketing and gap filling turn raw readings into a regular series.',
  ],
  visualizer: {
    title: 'Where bucket boundaries fall, and filling the holes',
    caption: 'In **Bucketing**, change width, origin, offset and time zone and watch readings regroup; pick 1 day in Berlin to see the 23-hour day. In **Gap filling**, step from plain buckets to gapfill, locf and interpolate.',
    Component: Viz,
  },
  playground: {
    setup: `
SET TIME ZONE 'UTC';
-- Sparse readings: device 1 is silent at 01:00, 03:00 and 04:00
CREATE TABLE metrics (time timestamptz NOT NULL, device_id int NOT NULL, value double precision);
INSERT INTO metrics VALUES
  ('2026-01-05 00:10+00', 1, 10), ('2026-01-05 00:40+00', 1, 12),
  ('2026-01-05 02:15+00', 1, 20), ('2026-01-05 05:05+00', 1, 50),
  ('2026-01-05 01:30+00', 2, 7);

CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN 'ERROR: ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'time_bucket = date_bin', sql: `SELECT ts,
       date_bin('15 minutes', ts, timestamptz '2000-01-03') AS bucket_15m,
       date_bin('7 days', ts, timestamptz '2000-01-03')     AS week_from_monday,
       date_bin('7 days', ts, timestamptz '2000-01-02')     AS week_from_sunday
FROM (VALUES (timestamptz '2026-11-11 10:07'), (timestamptz '2026-11-14 23:59')) v(ts);

SELECT to_char(date '2000-01-03', 'Day') AS default_origin_is_a;`,
        note: '`time_bucket(\'15 minutes\', ts)` equals `date_bin` with origin 2000-01-03, a **Monday**, so weekly buckets start on Monday 2026-11-09. A Sunday origin moves them to 2026-11-08.' },
      { label: 'Month buckets', sql: `SELECT try_sql($$SELECT date_bin('1 month', now(), timestamptz '2000-01-01')$$) AS date_bin_month;

SELECT t,
  date_trunc('month', t) AS month,
  timestamptz '2000-01-01' + make_interval(months =>
    ((extract(year FROM t)::int - 2000) * 12 + extract(month FROM t)::int - 1) / 3 * 3) AS quarter
FROM (VALUES (timestamptz '2026-05-15 10:30'), (timestamptz '2026-11-14')) v(t);`,
        note: '`date_bin` refuses months: **timestamps cannot be binned into intervals containing months or years**. `time_bucket(\'3 months\', t)` counts from origin 2000-01-01; month arithmetic reproduces it (April and October).' },
      { label: 'Time zones and DST', sql: `SELECT date_trunc('day', timestamptz '2026-03-28 23:30+00', 'Europe/Berlin') AS berlin_day,
       date_bin('1 day', timestamptz '2026-03-28 23:30+00', timestamptz '2000-01-03') AS utc_day;

SELECT d AS berlin_midnight_in_utc, lead(d) OVER (ORDER BY d) - d AS day_length
FROM generate_series(timestamptz '2026-03-28 00:00 Europe/Berlin', timestamptz '2026-03-31 00:00 Europe/Berlin',
                     interval '1 day', 'Europe/Berlin') d;`,
        note: '23:30 UTC on 28 March is already the 29th in Berlin. The day of the clock change lasts **23:00:00**. This is what `time_bucket(\'1 day\', time, timezone => \'Europe/Berlin\')` produces.' },
      { label: 'Gap filling', sql: `-- plain bucketing: silent hours are missing
SELECT date_bin('1 hour', time, timestamptz '2000-01-03') AS hour, avg(value)
FROM metrics WHERE device_id = 1 GROUP BY 1 ORDER BY 1;

-- time_bucket_gapfill equivalent: a series of buckets LEFT JOIN the data
SELECT g.hour, avg(m.value) AS avg_value, count(m.*) AS n
FROM generate_series(timestamptz '2026-01-05 00:00', timestamptz '2026-01-05 05:00', interval '1 hour') g(hour)
LEFT JOIN metrics m ON m.device_id = 1 AND m.time >= g.hour AND m.time < g.hour + interval '1 hour'
GROUP BY g.hour ORDER BY g.hour;`,
        note: 'Three rows become six: 01:00, 03:00 and 04:00 now exist with `NULL` average and `n = 0`. The series supplies the buckets that gapfill takes from the WHERE bounds.' },
      { label: 'locf', sql: `WITH filled AS (
  SELECT g.hour, avg(m.value) AS v
  FROM generate_series(timestamptz '2026-01-05 00:00', timestamptz '2026-01-05 05:00', interval '1 hour') g(hour)
  LEFT JOIN metrics m ON m.device_id = 1 AND m.time >= g.hour AND m.time < g.hour + interval '1 hour'
  GROUP BY g.hour
), grp AS (
  SELECT hour, v, count(v) OVER (ORDER BY hour) AS grp FROM filled
)
SELECT hour, v, grp, first_value(v) OVER (PARTITION BY grp ORDER BY hour) AS locf
FROM grp ORDER BY hour;`,
        note: '`count(v)` only counts non-NULL values, so each NULL joins the group of the last real value, and `first_value` copies it forward: **11, 11, 20, 20, 20, 50**.' },
      { label: 'interpolate', sql: `WITH filled AS (
  SELECT g.hour, avg(m.value) AS v
  FROM generate_series(timestamptz '2026-01-05 00:00', timestamptz '2026-01-05 05:00', interval '1 hour') g(hour)
  LEFT JOIN metrics m ON m.device_id = 1 AND m.time >= g.hour AND m.time < g.hour + interval '1 hour'
  GROUP BY g.hour
), marks AS (
  SELECT hour, v, count(v) OVER (ORDER BY hour) AS gp, count(v) OVER (ORDER BY hour DESC) AS gn FROM filled
), pn AS (
  SELECT hour, v,
    first_value(v)    OVER (PARTITION BY gp ORDER BY hour)      AS prev_v,
    first_value(hour) OVER (PARTITION BY gp ORDER BY hour)      AS prev_t,
    first_value(v)    OVER (PARTITION BY gn ORDER BY hour DESC) AS next_v,
    first_value(hour) OVER (PARTITION BY gn ORDER BY hour DESC) AS next_t
  FROM marks
)
SELECT hour, v,
  CASE WHEN v IS NOT NULL THEN v
       WHEN prev_v IS NULL OR next_v IS NULL THEN NULL
       ELSE prev_v + (next_v - prev_v) * extract(epoch FROM hour - prev_t) / extract(epoch FROM next_t - prev_t)
  END AS interpolated
FROM pn ORDER BY hour;`,
        note: 'Linear interpolation needs the previous **and** the next real value: **15.5** between 11 and 20, then **30** and **40** on the way to 50. One `interpolate()` call replaces this whole query.' },
      { label: 'first / last', sql: `SELECT device_id,
       (array_agg(value ORDER BY time))[1]      AS first_value,
       (array_agg(value ORDER BY time DESC))[1] AS last_value,
       count(*)
FROM metrics GROUP BY device_id ORDER BY 1;

SELECT try_sql($$SELECT last_value(value) IGNORE NULLS OVER (ORDER BY time) FROM metrics$$) AS ignore_nulls;`,
        note: 'These match `first(value, time)` and `last(value, time)`. The `array_agg` versions sort the whole group. PostgreSQL 18 has no `IGNORE NULLS`, which is why the locf preset needs the count() trick.' },
    ],
  },
  production: {
    title: 'A dashboard that stopped drawing false lines',
    context: 'A building-management team charts room temperature from battery sensors that report every 5 minutes, but skip reports when the value has not changed and drop out when the radio is busy.',
    problem: 'The chart grouped by `time_bucket(\'15 minutes\', time)`. Silent periods produced no rows, so the charting library drew a straight line across a two-hour outage, and "rooms out of range per hour" undercounted because missing hours were not rows at all.',
    solution: 'Use `time_bucket_gapfill` so every 15-minute bucket exists, and `locf` because a silent sensor means "unchanged". Bucket by local time so daily panels start at local midnight. `time_bucket_gapfill` and `locf` are **Community edition** features; on the Apache 2 edition use the `generate_series` pattern from the playground.',
    sql: `SELECT time_bucket_gapfill('15 minutes', time, timezone => 'Europe/Berlin') AS bucket,
       room_id,
       locf(avg(temperature)) AS temperature,
       avg(temperature) IS NULL AS was_silent
FROM room_readings
WHERE time >= now() - INTERVAL '1 day' AND time < now()   -- both bounds required
GROUP BY bucket, room_id
ORDER BY room_id, bucket;`,
    outcome: 'Every room returns one row for every 15-minute bucket in the window (96 for a full, aligned day), so charts and per-hour counts line up. The `was_silent` flag keeps filled values distinguishable from measured ones.',
  },
  pitfalls: [
    { title: 'Gapfill without an upper bound',
      symptom: 'An error that gapfill needs a start and finish, or no extra rows appear.',
      cause: '`time_bucket_gapfill` infers its range from the WHERE clause on the time column. Without both `time >= …` and `time < …` it cannot know which buckets to create.',
      fix: 'Always give both bounds in WHERE, or pass `start` and `finish` arguments explicitly.',
      sql: `WHERE time >= '2026-01-05' AND time < '2026-01-06'` },
    { title: 'Wrapping gapfill or filtering with HAVING',
      symptom: 'Errors when you write `round(time_bucket_gapfill(…))` or cast it, or filled buckets vanish from the result.',
      cause: '`time_bucket_gapfill` must be a top-level expression, and `HAVING` runs **before** gap filling.',
      fix: 'Cast or round in an outer query, and filter filled rows in an outer CTE, not with HAVING.' },
    { title: 'Buckets aligned to UTC, not local midnight',
      symptom: 'Daily totals for a European customer are off by one or two hours of data, and shift when clocks change.',
      cause: '`timestamptz` buckets align to 00:00 UTC by default.',
      fix: 'Pass the zone: `time_bucket(\'1 day\', time, timezone => \'Europe/Berlin\')`, or natively `date_trunc(\'day\', time, \'Europe/Berlin\')`. Expect a 23-hour and a 25-hour day each year.' },
    { title: 'Old code using time_bucket_ng',
      symptom: '`function time_bucket_ng(…) does not exist` after an upgrade.',
      cause: 'The experimental `time_bucket_ng` was removed in TimescaleDB 2.25.0.',
      fix: 'Use `time_bucket`, which supports months, origin, offset and time zone.' },
  ],
  pointers: [
    '`time_bucket(width, ts)` returns the bucket **start**. Default origin is **2000-01-03, a Monday** (2000-01-01 for month widths), aligned on UTC.',
    'Natively: `date_bin(width, ts, origin)` for fixed widths, `date_trunc(unit, ts, zone)` for calendar units. `date_bin` cannot do months. Filling gaps by hand is a [gaps-and-islands](/f4/gaps-and-islands) pattern.',
    '`time_bucket_gapfill` creates the missing buckets from the WHERE bounds; `locf` carries values forward; `interpolate` draws lines between them.',
    '`time_bucket`, `first`, `last` and `histogram` are **Apache 2 edition**. `time_bucket_gapfill`, `locf` and `interpolate` are **Community edition** only.',
  ],
  sources: ['functions-datetime.html', 'functions-srf.html', 'functions-window.html', 'datatype-datetime.html',
    'tigerdata.com/docs/reference/timescaledb/hyperfunctions/time_bucket', 'tigerdata.com/docs/reference/timescaledb/hyperfunctions/time_bucket_gapfill'],
}
