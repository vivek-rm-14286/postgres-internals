import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Msg, Stat, DAY, H, fmtD, fmtDT } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a simulated hypertable. Rows arrive every 15 minutes (devices 1-4 in turn). A chunk is
 * created the first time a row falls in a time slice that has none. Slices are aligned by dividing the
 * timeline into chunk_interval steps from the Unix epoch, as TimescaleDB does, so 7-day chunks start on a
 * Thursday (1970-01-01 was a Thursday). Chunk ids follow creation order, not time order. With a hash
 * dimension each slice is split into N chunks by hash(device_id). Native partitioning mode: partitions
 * exist only if created, and a row without one fails with the real PostgreSQL error.
 * ---------------------------------------------------------------------------------------------- */

const T0 = Date.UTC(2026, 2, 1) // Sunday 2026-03-01 00:00 UTC
const AX0 = T0 - 3 * DAY, AX1 = T0 + 7 * DAY
type Iv = '6h' | '1d' | '7d'
const IV: Record<Iv, number> = { '6h': 6 * H, '1d': DAY, '7d': 7 * DAY }
type Mode = 'tsdb' | 'native'

interface Chunk { key: string; id: number; lo: number; hi: number; part: number; rows: number; far: boolean }
interface Sim { now: number; chunks: Chunk[]; nextId: number; rejected: number; last: { kind: string; text: string } }

const part = (dev: number, parts: number) => (parts === 1 ? 0 : dev % parts)

function fresh(mode: Mode, iv: number, parts: number): Sim {
  const chunks: Chunk[] = []
  let nextId = 1
  if (mode === 'native') {
    // a cron job pre-created partitions for the first day
    for (let lo = Math.floor(T0 / iv) * iv; lo < T0 + DAY; lo += iv)
      for (let p = 0; p < parts; p++) chunks.push({ key: `${lo}:${p}`, id: nextId++, lo, hi: lo + iv, part: p, rows: 0, far: false })
  }
  const end = chunks.length ? Math.max(...chunks.map((c) => c.hi)) : T0
  return { now: T0, chunks, nextId, rejected: 0, last: { kind: 'start', text: mode === 'tsdb'
    ? 'An empty hypertable has **no chunks**. Ingest data: each row is routed to the chunk for its time slice, and a missing chunk is created on the spot.'
    : `Native partitioning: a scheduled job pre-created partitions only up to **${fmtDT(end)}**. Ingest past them and see what happens.` } }
}

function insert(s0: Sim, ts: number[], mode: Mode, iv: number, parts: number, label: string): Sim {
  const s: Sim = { ...s0, chunks: s0.chunks.map((c) => ({ ...c })) }
  const created: Chunk[] = []
  let rejected = 0
  ts.forEach((t, i) => {
    const dev = 1 + (Math.round(t / (15 * 60_000)) + i) % 4
    const lo = Math.floor(t / iv) * iv, p = part(dev, parts)
    const key = `${lo}:${p}`
    let c = s.chunks.find((x) => x.key === key)
    if (!c) {
      if (mode === 'native') { rejected++; return }
      c = { key, id: s.nextId++, lo, hi: lo + iv, part: p, rows: 0, far: lo >= AX1 }
      s.chunks.push(c); created.push(c)
    }
    c.rows++
  })
  if (rejected) {
    return { ...s0, rejected: s0.rejected + ts.length, last: { kind: 'err', text: `**ERROR: no partition of relation "conditions" found for row.** ${rejected} of ${ts.length} rows (${label}) had no partition, so the whole INSERT failed. PostgreSQL never creates partitions by itself: something must run \`ensure_chunk()\` (or pg_partman) ahead of the data.` } }
  }
  const name = (c: Chunk) => `\`_hyper_1_${c.id}_chunk\``
  if (created.length) s.last = { kind: 'new', text: `${label}: ${created.length === 1 ? 'chunk' : 'chunks'} ${created.map(name).join(', ')} created on demand for ${fmtDT(created[0].lo)} → ${fmtDT(created[0].hi)}${created.length > 1 ? ` (one per hash partition)` : ''}.${created.some((c) => c.far) ? ' A clock far in the future created a chunk a year ahead: it will sit there until `drop_chunks(newer_than => …)` removes it.' : created.some((c) => c.lo < T0) ? ' The id is higher than its neighbours: ids follow **creation order**, not time.' : ''}` }
  else s.last = { kind: 'ok', text: `${label}: every row landed in an **existing** chunk. No DDL, no heavier lock.` }
  return s
}

function HypertableViz() {
  const [mode, setMode] = useState<Mode>('tsdb')
  const [iv, setIv] = useState<Iv>('1d')
  const [parts, setParts] = useState<1 | 2>(1)
  const [sim, setSim] = useState<Sim>(() => fresh('tsdb', IV['1d'], 1))
  const [qStart, setQStart] = useState(24) // hours from T0
  const [qLen, setQLen] = useState<'6' | '24' | '72'>('24')
  const [sel, setSel] = useState<string | null>(null)
  const ivMs = IV[iv]
  const reset = (m: Mode, i: Iv, p: 1 | 2) => { setMode(m); setIv(i); setParts(p); setSim(fresh(m, IV[i], p)); setSel(null) }

  const ingest = () => {
    if (sim.now >= AX1) return
    const ts = Array.from({ length: 24 }, (_, k) => sim.now + k * 15 * 60_000)
    const s = insert(sim, ts, mode, ivMs, parts, `Ingest ${fmtDT(sim.now)} to ${fmtDT(sim.now + 6 * H)}`)
    if (s.last.kind !== 'err') s.now = sim.now + 6 * H
    setSim(s)
  }
  const late = () => setSim(insert(sim, [sim.now - 3 * DAY + 20 * 60_000], mode, ivMs, parts, `Late row at ${fmtDT(sim.now - 3 * DAY + 20 * 60_000)}`))
  const future = () => setSim(insert(sim, [sim.now + 365 * DAY], mode, ivMs, parts, `Row stamped ${fmtD(sim.now + 365 * DAY)}`))
  const ensure = () => {
    const s: Sim = { ...sim, chunks: sim.chunks.map((c) => ({ ...c })) }
    const lo = Math.floor(sim.now / ivMs) * ivMs
    let made = 0
    for (let l = lo; l < sim.now + 6 * H; l += ivMs)
      for (let p = 0; p < parts; p++) if (!s.chunks.some((c) => c.key === `${l}:${p}`)) { s.chunks.push({ key: `${l}:${p}`, id: s.nextId++, lo: l, hi: l + ivMs, part: p, rows: 0, far: false }); made++ }
    s.last = { kind: 'new', text: made ? `\`ensure_chunk()\` ran \`CREATE TABLE … PARTITION OF conditions FOR VALUES FROM ('${fmtDT(lo)}') TO (…)\`: ${made} partition${made > 1 ? 's' : ''} ready. Ingest again.` : 'The partitions for the next 6 hours already exist.' }
    setSim(s)
  }

  const q0 = T0 + qStart * H, q1 = q0 + +qLen * H
  const overlaps = (c: Chunk) => c.hi > q0 && c.lo < q1
  const scanned = sim.chunks.filter((c) => c.rows > 0 && overlaps(c))
  const withRows = sim.chunks.filter((c) => c.rows > 0)
  const chunkTone = (c: Chunk): Tone => (c.rows === 0 ? 'free' : overlaps(c) ? 'ok' : 'muted')

  const X0 = 12, X1 = 560, LANE = 40, Y0 = 30
  const x = (t: number) => X0 + ((Math.max(AX0, Math.min(AX1, t)) - AX0) / (AX1 - AX0)) * (X1 - X0)
  const svgH = Y0 + parts * LANE + 26
  const days = Array.from({ length: 11 }, (_, i) => AX0 + i * DAY)
  const selected = sim.chunks.find((c) => c.key === sel)
  const far = sim.chunks.filter((c) => c.far)

  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Engine" value={mode} onChange={(m) => reset(m, iv, parts)} options={[['tsdb', 'TimescaleDB hypertable'], ['native', 'Native partitioning']]} />
        <Segmented label="Chunk interval" value={iv} onChange={(i) => reset(mode, i, parts)} options={[['6h', '6 hours'], ['1d', '1 day'], ['7d', '7 days']]} />
        <Segmented label="Hash partitions" value={String(parts) as '1' | '2'} onChange={(p) => reset(mode, iv, +p as 1 | 2)} options={[['1', 'time only'], ['2', '+ by_hash(device_id, 2)']]} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={ingest} disabled={sim.now >= AX1}>Ingest next 6 h</Btn>
        <Btn onClick={late}>Late row (3 days old)</Btn>
        <Btn onClick={future}>Row from a bad clock (+1 year)</Btn>
        {mode === 'native' && <Btn onClick={ensure}>Run ensure_chunk()</Btn>}
        <Btn onClick={() => reset(mode, iv, parts)}>Reset</Btn>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={mode === 'tsdb' ? 'chunks' : 'partitions'} value={sim.chunks.length} />
        <Stat label="scanned by query" value={`${scanned.length} / ${withRows.length}`} t="ok" />
        <Stat label="rows stored" value={withRows.reduce((a, c) => a + c.rows, 0)} />
        <Stat label="rows rejected" value={sim.rejected} t={sim.rejected ? 'dead' : undefined} />
      </div>
      <Msg id={sim.last.text}><p style={sim.last.kind === 'err' ? { color: tone.text('dead') } : undefined}><Md>{sim.last.text}</Md></p></Msg>
      <label className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="font-mono">WHERE time &gt;= '{fmtDT(q0)}' AND time &lt; '{fmtDT(q1)}'</span>
        <input type="range" min={-72} max={168 - +qLen} step={1} value={qStart} onChange={(e) => setQStart(+e.target.value)} className="min-w-24 flex-1 accent-[var(--accent)]" aria-label="Query window start" />
        <Segmented label="Query length" value={qLen} onChange={setQLen} options={[['6', '6 h'], ['24', '1 day'], ['72', '3 days']]} />
      </label>
      <Legend items={[['ok', 'scanned (overlaps WHERE)'], ['muted', 'excluded'], ['free', 'empty partition'], ['accent', 'query window'], ['new', 'now']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox={`0 0 640 ${svgH}`} className="w-full min-w-[560px]" role="img" aria-label="Chunks on a time axis">
          {days.map((d, i) => (
            <g key={d}>
              <line x1={x(d)} x2={x(d)} y1={18} y2={Y0 + parts * LANE} stroke="var(--border)" strokeDasharray="2 3" />
              {i < 10 && <text x={x(d) + 27} y={14} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{fmtDT(d).slice(0, 6)}</text>}
            </g>
          ))}
          <motion.rect initial={false} animate={{ x: x(q0), width: Math.max(2, x(q1) - x(q0)) }} transition={{ type: 'spring', stiffness: 200, damping: 26 }}
            y={20} height={parts * LANE + 6} fill={toneBg('accent', 16)} stroke={tone('accent')} strokeDasharray="4 2" />
          {Array.from({ length: parts }, (_, p) => parts > 1 && (
            <text key={p} x={X0} y={Y0 + p * LANE - 2} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">hash {p}</text>
          ))}
          <AnimatePresence>
            {sim.chunks.filter((c) => !c.far && c.hi > AX0 && c.lo < AX1).map((c) => {
              const t = chunkTone(c), w = x(c.hi) - x(c.lo), y = Y0 + c.part * LANE + 2
              return (
                <motion.g key={c.key + mode + iv} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }} style={{ transformOrigin: `${x(c.lo) + w / 2}px ${y + 14}px`, cursor: 'pointer' }}
                  onClick={() => setSel(c.key)}>
                  <rect x={x(c.lo) + 1} y={y} width={Math.max(2, w - 2)} height={LANE - 10} rx={3} fill={toneBg(t, c.rows ? 28 : 8)} stroke={tone(t)}
                    strokeWidth={sel === c.key ? 2.4 : 1} strokeDasharray={c.rows ? undefined : '3 2'} />
                  {w > 14 && <text x={x(c.lo) + w / 2} y={y + 19} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{c.id}</text>}
                </motion.g>
              )
            })}
          </AnimatePresence>
          <motion.line initial={false} animate={{ x1: x(sim.now), x2: x(sim.now) }} y1={18} y2={Y0 + parts * LANE + 4} stroke={tone('new')} strokeWidth={2} />
          <motion.text initial={false} animate={{ x: x(sim.now) }} y={Y0 + parts * LANE + 18} textAnchor="middle" fontSize={10} fontWeight={700} fill={tone('new')} fontFamily="var(--font-mono)">now</motion.text>
          <text x={598} y={14} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">2027</text>
          <line x1={572} x2={572} y1={20} y2={Y0 + parts * LANE} stroke="var(--muted)" strokeDasharray="1 3" />
          {far.map((c) => (
            <motion.g key={c.key} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSel(c.key)} style={{ cursor: 'pointer' }}>
              <rect x={580} y={Y0 + c.part * LANE + 2} width={40} height={LANE - 10} rx={3} fill={toneBg('dead', 22)} stroke={tone('dead')} strokeWidth={sel === c.key ? 2.4 : 1} />
              <text x={600} y={Y0 + c.part * LANE + 21} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{c.id}</text>
            </motion.g>
          ))}
        </svg>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title={selected ? 'Chunk (click another to inspect)' : 'Click a chunk to inspect it'}>
          {selected ? (
            <FieldTable rows={[
              [mode === 'tsdb' ? 'chunk_name' : 'partition', mode === 'tsdb' ? `_timescaledb_internal._hyper_1_${selected.id}_chunk` : `conditions_${fmtD(selected.lo).replace(/-/g, '')}${iv === '6h' ? `_${new Date(selected.lo).getUTCHours()}` : ''}${parts > 1 ? `_h${selected.part}` : ''}`],
              ['range_start', `${fmtD(selected.lo)} ${fmtDT(selected.lo).slice(7)}+00`, 'inclusive'],
              ['range_end', `${fmtD(selected.hi)} ${fmtDT(selected.hi).slice(7)}+00`, 'exclusive'],
              ['rows', selected.rows],
              ...(parts > 1 ? [['hash partition', `${selected.part} of 2`] as [string, string]] : []),
              ['status', overlaps(selected) && selected.rows ? 'scanned' : 'excluded'],
            ]} />
          ) : <p className="text-xs text-muted"><Md>{`Chunk ranges are aligned on the epoch: with **${iv === '7d' ? '7-day' : iv === '1d' ? '1-day' : '6-hour'}** chunks the slice holding Mar 01 runs ${fmtDT(Math.floor(T0 / ivMs) * ivMs)} → ${fmtDT(Math.floor(T0 / ivMs) * ivMs + ivMs)}${iv === '7d' ? ' (a Thursday, because 1970-01-01 was one)' : ''}.`}</Md></p>}
        </Panel>
        <SizingPanel />
      </div>
    </div>
  )
}

/* Chunk sizing rule: the indexes of the chunks being written should fit in about 25% of memory. */
const CHOICES: [string, number][] = [['7 days', 7], ['3 days', 3], ['1 day', 1], ['12 hours', 0.5], ['6 hours', 0.25], ['1 hour', 1 / 24]]
function SizingPanel() {
  const [ram, setRam] = useState<'16' | '64' | '256'>('64')
  const [growth, setGrowth] = useState(2)
  const budget = +ram * 0.25
  const maxDays = budget / growth
  const pick = CHOICES.find(([, d]) => d <= maxDays) ?? CHOICES[CHOICES.length - 1]
  const perYear = Math.round(365 / pick[1])
  return (
    <Panel title="Sizing chunk_interval">
      <div className="grid gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2"><span className="text-muted">RAM</span>
          <Segmented label="RAM" value={ram} onChange={setRam} options={[['16', '16 GB'], ['64', '64 GB'], ['256', '256 GB']]} /></div>
        <label className="flex items-center gap-2"><span className="text-muted whitespace-nowrap">index growth</span>
          <input type="range" min={0.5} max={40} step={0.5} value={growth} onChange={(e) => setGrowth(+e.target.value)} className="min-w-20 flex-1 accent-[var(--accent)]" aria-label="Index growth per day" />
          <span className="font-mono tabular-nums">{growth} GB/day</span></label>
        <p><Md>{`Budget: 25% of ${ram} GB = **${budget} GB** for active chunk indexes, which allows ${maxDays >= 10 ? Math.round(maxDays) : maxDays.toFixed(1)} days. Suggested interval: **${pick[0]}**, about ${perYear.toLocaleString('en-US')} chunks a year.`}</Md></p>
        {perYear > 1000 && <p style={{ color: tone.text('dead') }}><Md>{'More than 1,000 chunks in one hypertable means more planning work. Keep less history in raw form or use a larger server.'}</Md></p>}
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'hypertables-chunks',
  module: 'e2',
  order: 2,
  title: 'Hypertables and chunks',
  tldr: [
    'A **hypertable** is a table that TimescaleDB splits by time into child tables called **chunks**, creating each chunk automatically the first time a row needs it.',
    'Chunks let queries skip every time slice outside their WHERE clause (**chunk exclusion**) and let old data leave by dropping whole chunks, without anyone managing partitions by hand.',
  ],
  visualizer: {
    title: 'Chunks appear as time advances',
    caption: 'Ingest data and watch chunks being created on demand, then add a late row and a row from a broken clock. Drag the query window to see chunk exclusion, and switch to **Native partitioning** to see what PostgreSQL does without the extension.',
    Component: HypertableViz,
  },
  playground: {
    setup: `
SET TIME ZONE 'UTC';
-- Native stand-in for a hypertable: a range-partitioned table plus a helper
-- that creates the "chunk" for a timestamp, aligned on the epoch like TimescaleDB.
CREATE TABLE conditions (
  time        timestamptz NOT NULL,
  device_id   int NOT NULL,
  temperature double precision
) PARTITION BY RANGE (time);

CREATE FUNCTION ensure_chunk(p_ts timestamptz, p_interval interval DEFAULT '1 day')
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  lo timestamptz := date_bin(p_interval, p_ts, timestamptz 'epoch');
  nm text := 'conditions_' || to_char(lo AT TIME ZONE 'UTC', 'YYYYMMDD');
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF conditions FOR VALUES FROM (%L) TO (%L)',
                 nm, lo, lo + p_interval);
  RETURN nm;
END $$;

SELECT ensure_chunk(timestamptz '2026-03-01' + make_interval(days => d)) FROM generate_series(0, 6) d;
INSERT INTO conditions
SELECT ts, 1 + (n % 4), round((20 + 5 * sin(n / 50.0))::numeric, 2)
FROM generate_series(timestamptz '2026-03-01', timestamptz '2026-03-07 23:59', interval '1 minute') WITH ORDINALITY g(ts, n);
CREATE INDEX ON conditions (time DESC);
CREATE INDEX ON conditions (device_id, time DESC);
ANALYZE conditions;

CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN 'ERROR: ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'List the chunks', sql: `SELECT c.relname AS chunk,
       pg_get_expr(c.relpartbound, c.oid) AS range,
       c.reltuples::bigint AS row_count,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
WHERE i.inhparent = 'conditions'::regclass
ORDER BY 1;`,
        note: 'Seven daily partitions of 1440 rows and 216 kB each. This is what `show_chunks()` and `timescaledb_information.chunks` report for a hypertable.' },
      { label: 'Exclusion at plan time', sql: `EXPLAIN (COSTS OFF)
SELECT avg(temperature) FROM conditions
WHERE time >= '2026-03-03' AND time < '2026-03-04';`,
        note: 'Only `conditions_20260303` appears: the planner compared the constants with each partition\'s range and dropped the other six. TimescaleDB calls this **chunk exclusion**.' },
      { label: 'Exclusion at run time', sql: `SET plan_cache_mode = force_generic_plan;
PREPARE since(timestamptz) AS SELECT count(*) FROM conditions WHERE time >= $1;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF) EXECUTE since('2026-03-06');
RESET plan_cache_mode;
DEALLOCATE since;`,
        note: 'A generic plan cannot know `$1`, so pruning happens when execution starts: **Subplans Removed: 5**, two chunks scanned with 1440 rows each. TimescaleDB\'s ChunkAppend node does the same for values such as `now()`.' },
      { label: 'No automatic chunks', sql: `SELECT try_sql($$INSERT INTO conditions VALUES ('2026-03-08 09:30', 1, 21.5)$$) AS insert_without_chunk;

SELECT ensure_chunk('2026-03-08 09:30');
INSERT INTO conditions VALUES ('2026-03-08 09:30', 1, 21.5);

SELECT tableoid::regclass AS chunk, * FROM conditions WHERE time >= '2026-03-08';`,
        note: 'Native PostgreSQL rejects the row: **no partition of relation "conditions" found for row**. After `ensure_chunk()` creates `conditions_20260308` the insert succeeds. A hypertable does that step for you, inside the INSERT.' },
      { label: 'Unique keys need the time column', sql: `SELECT try_sql('ALTER TABLE conditions ADD UNIQUE (device_id)') AS unique_on_device;
SELECT try_sql('ALTER TABLE conditions ADD UNIQUE (device_id, time)') AS unique_on_device_and_time;`,
        note: 'Uniqueness is enforced inside each partition, so every unique key must include the partition column. Hypertables have the same rule: `cannot create a unique index without the column "time"`.' },
      { label: 'Space partitioning', sql: `CREATE TABLE readings (time timestamptz NOT NULL, device_id int NOT NULL, v int)
  PARTITION BY RANGE (time);
CREATE TABLE readings_d1 PARTITION OF readings
  FOR VALUES FROM ('2026-03-01') TO ('2026-03-02') PARTITION BY HASH (device_id);
CREATE TABLE readings_d1_h0 PARTITION OF readings_d1 FOR VALUES WITH (MODULUS 2, REMAINDER 0);
CREATE TABLE readings_d1_h1 PARTITION OF readings_d1 FOR VALUES WITH (MODULUS 2, REMAINDER 1);
INSERT INTO readings
SELECT timestamptz '2026-03-01' + make_interval(mins => i), i % 10, i FROM generate_series(0, 1000) i;

SELECT tableoid::regclass AS chunk, count(*) AS row_count, array_agg(DISTINCT device_id) AS devices
FROM readings GROUP BY 1 ORDER BY 1;

EXPLAIN (COSTS OFF)
SELECT * FROM readings WHERE device_id = 3 AND time < '2026-03-01 12:00';`,
        note: 'This mirrors `add_dimension(\'readings\', by_hash(\'device_id\', 2))`: each time slice becomes two chunks. A filter on both columns prunes down to one (`readings_d1_h1`). The chunk count doubles, which is why the extra dimension is discouraged.' },
      { label: 'Latest row vs latest per device', sql: `EXPLAIN (COSTS OFF)
SELECT * FROM conditions ORDER BY time DESC LIMIT 1;

EXPLAIN (COSTS OFF)
SELECT DISTINCT ON (device_id) device_id, time, temperature
FROM conditions ORDER BY device_id, time DESC;`,
        note: 'The first plan is an **ordered Append**: chunks are read newest first and the LIMIT stops after one row. "Latest per device" needs a Merge Append over every chunk. TimescaleDB\'s SkipScan (Community edition) speeds that up.' },
    ],
  },
  production: {
    title: 'Turning a growing metrics table into a hypertable',
    context: 'An IoT platform writes 2 GB of new index data per day into a 64 GB database server. Every query asks for one device over a few hours or days.',
    problem: 'One huge table means one huge B-tree that no longer fits in memory, so inserts read cold index pages from disk. Hand-made partitions helped until a scheduled job that created them failed one weekend, and inserts stopped with "no partition found".',
    solution: 'Create a hypertable. Chunks are created by the INSERT itself. The interval follows the sizing rule: active chunk indexes within about 25% of memory, 16 GB / 2 GB per day → 7-day chunks. (A rough starting point before you can measure: tables taking 100 M+ rows a day often land on hours to one day, 1–10 M rows a day on about one day, quiet tables on a week or more. The memory rule decides.) Ingest in batches, with multi-row `INSERT` or `COPY`, not one statement per reading. Use the default `time DESC` index plus one per access path, and do not add a hash dimension on a single disk. All of this is in the **Apache 2 edition**. The CREATE TABLE form adds a columnstore policy by default since 2.23, which needs the Community edition.',
    sql: `CREATE TABLE metrics (
  time      timestamptz NOT NULL,
  device_id int NOT NULL,
  value     double precision,
  PRIMARY KEY (device_id, time)            -- must include the time column
) WITH (
  tsdb.hypertable,
  tsdb.partition_column = 'time',
  tsdb.chunk_interval   = '7 days'
);
-- older equivalent (2.13+): SELECT create_hypertable('metrics', by_range('time', INTERVAL '7 days'));
-- converting a table that already holds rows: migrate_data (default false) copies
-- every row into chunks while holding a lock, so run it in a quiet window
-- SELECT create_hypertable('metrics_old', by_range('time', INTERVAL '7 days'), migrate_data => true);

SELECT chunk_name, range_start, range_end
FROM timescaledb_information.chunks WHERE hypertable_name = 'metrics';

-- affects only chunks created from now on
SELECT set_chunk_time_interval('metrics', INTERVAL '1 day');`,
    outcome: 'Inserts touch only the newest chunk\'s indexes, which stay in memory, and a one-day query reads one or two chunks. With 7-day chunks a year of data is about 52 chunks, far below the 1,000-chunk warning level.',
  },
  pitfalls: [
    { title: 'Chunks that are far too small',
      symptom: 'Planning time grows with history, queries over a month open thousands of chunks, and you see `out of shared memory` with a hint to increase `max_locks_per_transaction`.',
      cause: 'Every chunk a query touches is planned and locked. A 1-hour interval on a slow table makes 8,760 chunks a year, each one tiny and hard to compress.',
      fix: 'Size by the memory rule, not by query granularity. `set_chunk_time_interval` changes new chunks only, so fix history with a table-swap migration, or merge adjacent small chunks in place with `CALL merge_chunks(\'chunk_a\', \'chunk_b\')`. Raise `max_locks_per_transaction` (restart needed) as a stopgap.',
      sql: `SELECT set_chunk_time_interval('metrics', INTERVAL '7 days');` },
    { title: 'Unique key without the time column',
      symptom: '`ERROR: cannot create a unique index without the column "time" (used in partitioning)`.',
      cause: 'Each chunk has its own indexes, so uniqueness can only be checked inside one chunk.',
      fix: 'Include the partition column in every PRIMARY KEY and UNIQUE constraint, for example `(device_id, time)`. Enforce global uniqueness of other ids elsewhere.' },
    { title: 'A bad clock creates future chunks',
      symptom: '`timescaledb_information.chunks` lists chunks years ahead, and "latest" queries return garbage rows.',
      cause: 'A device sent a timestamp far in the future, and the INSERT created a chunk for it as designed.',
      fix: 'Reject timestamps later than `now() + interval \'1 day\'` at ingest (in the application or a `BEFORE INSERT` trigger), and clean up with `drop_chunks(newer_than => …)`.',
      sql: `SELECT drop_chunks('metrics', newer_than => now() + INTERVAL '3 months');` },
    { title: 'Space partitioning on one disk',
      symptom: 'After `add_dimension(…, by_hash(…))`, chunk count multiplies and planning slows, with no speed-up.',
      cause: 'Hash dimensions exist to spread I/O across tablespaces on separate disks. On one volume they only multiply chunks, and every unique key must now include the hash column too.',
      fix: 'Use time-only partitioning plus a `(device_id, time DESC)` index. On a hypertable that already has data, `add_dimension` only partitions chunks created afterwards, and existing chunks keep covering the whole hash range.' },
  ],
  pointers: [
    'A hypertable is a parent table, and **chunks** are child tables in `_timescaledb_internal`. Insert and query the parent only.',
    'Chunks are created **on demand** by the INSERT. Ranges are aligned on the epoch; the default `chunk_interval` is **7 days**.',
    'Size chunks so the **indexes of active chunks fit in about 25% of memory**; more than 1,000 chunks is a warning sign.',
    '**Chunk exclusion** = partition pruning: at plan time for constants, at run time for parameters and `now()`. The native mechanism is covered in [partitioning and pruning](/m7/partitioning).',
    'Hypertables, `show_chunks`, `add_dimension` and `set_chunk_time_interval` are **Apache 2 edition**; SkipScan and `reorder_chunk` need the **Community edition**.',
  ],
  sources: ['ddl-partitioning.html', 'sql-createtable.html', 'functions-datetime.html', 'runtime-config-locks.html',
    'tigerdata.com/docs/reference/timescaledb/hypertables/create_table', 'tigerdata.com/docs/learn/hypertables/sizing-hypertable-chunks'],
}
