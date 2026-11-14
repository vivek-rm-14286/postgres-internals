import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Stat, fmtBytes, fmtNum } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the autovacuum trigger formulas from routine-vacuuming.html (PostgreSQL 18), a 24-hour
 * simulation of dead tuples under a steady update rate, and the cost-based throttle arithmetic.
 *   vacuum threshold  = min(autovacuum_vacuum_max_threshold, threshold + scale_factor × reltuples)
 *   insert threshold  = insert_threshold + insert_scale_factor × reltuples × (1 − relallfrozen/relpages)
 *   analyze threshold = analyze_threshold + analyze_scale_factor × reltuples
 * ---------------------------------------------------------------------------------------------- */

interface Cfg { reltuples: number; thr: number; sf: number; max: number; ithr: number; isf: number; frozen: number; athr: number; asf: number }
const DEFAULTS: Omit<Cfg, 'reltuples' | 'frozen'> = { thr: 50, sf: 0.2, max: 100_000_000, ithr: 1000, isf: 0.2, athr: 50, asf: 0.1 }
const PRESETS: Record<string, { label: string; cfg: Cfg; rate: number }> = {
  small: { label: '50 k-row lookup table', cfg: { ...DEFAULTS, reltuples: 50_000, frozen: 0.6 }, rate: 200 },
  big: { label: '200 M-row orders, defaults', cfg: { ...DEFAULTS, reltuples: 200_000_000, frozen: 0.7 }, rate: 40_000 },
  tuned: { label: '200 M-row orders, scale 0.01', cfg: { ...DEFAULTS, sf: 0.01, reltuples: 200_000_000, frozen: 0.7 }, rate: 40_000 },
  huge: { label: '2 B-row ledger (PG 18 cap)', cfg: { ...DEFAULTS, reltuples: 2_000_000_000, frozen: 0.9 }, rate: 150_000 },
}

const thresholds = (c: Cfg) => {
  const raw = c.thr + c.sf * c.reltuples
  return {
    raw, vac: c.max >= 0 ? Math.min(c.max, raw) : raw, capped: c.max >= 0 && raw > c.max,
    ins: c.ithr + c.isf * c.reltuples * (1 - c.frozen),
    ana: c.athr + c.asf * c.reltuples,
  }
}

/** Dead tuples over 24 h: grow at `rate` per minute; the launcher checks once per naptime (1 min);
 *  a run lasts `dur` minutes and removes what was dead when it started. */
function simulate(trigger: number, rate: number, dur: number) {
  const pts: [number, number][] = []
  let dead = 0, runUntil = -1, removeAt = 0, runs = 0, peak = 0
  const starts: number[] = []
  for (let m = 0; m <= 1440; m++) {
    dead += rate
    if (runUntil >= 0 && m >= runUntil) { dead = Math.max(0, dead - removeAt); runUntil = -1 }
    if (runUntil < 0 && dead > trigger) { runUntil = m + Math.max(1, dur); removeAt = dead; runs++; starts.push(m) }
    peak = Math.max(peak, dead)
    pts.push([m, dead])
  }
  return { pts, runs, peak, starts }
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <label className="grid grid-cols-[minmax(0,150px)_minmax(60px,1fr)_auto] items-center gap-2 text-xs">
      <span className="truncate font-mono text-muted" title={label}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="accent-[var(--accent)]" />
      <span className="text-right font-mono font-semibold tabular-nums">{fmt(value)}</span>
    </label>
  )
}

function Chart({ sim, trigger }: { sim: ReturnType<typeof simulate>; trigger: number }) {
  const W = 820, H = 200, L = 56, B = 26
  const ymax = Math.max(trigger * 1.25, sim.peak * 1.05, 1)
  const x = (m: number) => L + (m / 1440) * (W - L - 10)
  const y = (v: number) => H - B - (v / ymax) * (H - B - 12)
  const d = sim.pts.filter((_, i) => i % 2 === 0 || i === sim.pts.length - 1).map(([m, v], i) => `${i ? 'L' : 'M'}${x(m).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[640px]" role="img" aria-label="Dead tuples over 24 hours">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={L} x2={W - 10} y1={y(ymax * f)} y2={y(ymax * f)} stroke="var(--border)" />
          <text x={L - 6} y={y(ymax * f) + 4} textAnchor="end" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{fmtNum(ymax * f)}</text>
        </g>
      ))}
      {[0, 6, 12, 18, 24].map((h) => <text key={h} x={x(h * 60)} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{h}h</text>)}
      <motion.line initial={false} animate={{ y1: y(trigger), y2: y(trigger) }} x1={L} x2={W - 10} stroke={tone('new')} strokeDasharray="6 4" strokeWidth={1.6} />
      <motion.path initial={false} animate={{ d }} transition={{ duration: 0.5 }} fill="none" stroke={tone('dead')} strokeWidth={1.8} />
      {sim.starts.slice(0, 60).map((m) => <circle key={m} cx={x(m)} cy={H - B} r={2.5} fill={tone('ok')} />)}
    </svg>
  )
}

function Throttle() {
  const [limit, setLimit] = useState(200)
  const [delay, setDelay] = useState(2)
  const [workers, setWorkers] = useState(3)
  const per = limit / workers
  const mb = (cost: number) => ((per / cost) * (1000 / delay) * 8192) / 1024 / 1024
  return (
    <div className="grid gap-2">
      <Slider label="cost_limit" value={limit} min={100} max={2000} step={100} onChange={setLimit} fmt={(v) => String(v)} />
      <Slider label="cost_delay (ms)" value={delay} min={1} max={20} step={1} onChange={setDelay} fmt={(v) => `${v} ms`} />
      <Slider label="busy workers" value={workers} min={1} max={6} step={1} onChange={setWorkers} fmt={(v) => String(v)} />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="pages in cache (cost 1)" value={`${fmtBytes(mb(1) * 1048576)}/s`} sub="per worker" />
        <Stat label="read from disk (cost 2)" value={`${fmtBytes(mb(2) * 1048576)}/s`} sub="per worker" />
        <Stat label="read + dirtied (cost 22)" value={`${fmtBytes(mb(22) * 1048576)}/s`} t="dead" sub="per worker" />
      </div>
      <p className="text-xs text-muted"><Md>{`The limit is **shared**: with ${workers} busy workers each gets ${per.toFixed(0)} cost units per ${delay} ms nap. Adding workers does not add I/O budget; raising \`autovacuum_vacuum_cost_limit\` does.`}</Md></p>
    </div>
  )
}

function AutovacuumViz() {
  const [key, setKey] = useState<keyof typeof PRESETS>('big')
  const [cfg, setCfg] = useState<Cfg>(PRESETS.big.cfg)
  const [rate, setRate] = useState(PRESETS.big.rate)
  const [tab, setTab] = useState<'trigger' | 'throttle'>('trigger')
  const t = thresholds(cfg)
  const pages = cfg.reltuples / 100
  const dur = Math.round(pages / 5000 / 60) // read + dirty mix ≈ 5,000 pages/s at defaults with one worker
  const sim = useMemo(() => simulate(t.vac, rate, dur), [t.vac, rate, dur])
  const load = (k: keyof typeof PRESETS) => { setKey(k); setCfg(PRESETS[k].cfg); setRate(PRESETS[k].rate) }
  const set = (p: Partial<Cfg>) => setCfg((c) => ({ ...c, ...p }))
  const keys = Object.keys(PRESETS) as (keyof typeof PRESETS)[]
  const next = () => load(keys[(keys.indexOf(key) + 1) % keys.length])
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="View" value={tab} onChange={setTab} options={[['trigger', 'When does it run?'], ['throttle', 'How fast can it go?']]} />
        {tab === 'trigger' && <>
          <select value={key} onChange={(e) => load(e.target.value as keyof typeof PRESETS)} className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs" aria-label="Scenario">
            {keys.map((k) => <option key={k} value={k}>{PRESETS[k].label}</option>)}
          </select>
          <Btn primary testid="viz-next" onClick={next}>Next scenario</Btn>
        </>}
      </div>
      {tab === 'throttle' ? <Throttle /> : <>
        <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
          <Panel title="Table and settings">
            <div className="grid gap-1.5">
              <Slider label="reltuples" value={Math.log10(cfg.reltuples)} min={3} max={10} step={0.05} onChange={(v) => set({ reltuples: Math.round(10 ** v) })} fmt={() => fmtNum(cfg.reltuples)} />
              <Slider label="vacuum_threshold" value={cfg.thr} min={0} max={10000} step={50} onChange={(v) => set({ thr: v })} fmt={(v) => String(v)} />
              <Slider label="vacuum_scale_factor" value={cfg.sf} min={0} max={0.5} step={0.005} onChange={(v) => set({ sf: v })} fmt={(v) => v.toFixed(3)} />
              <Slider label="vacuum_max_threshold" value={cfg.max < 0 ? 9 : Math.log10(cfg.max)} min={5} max={9} step={0.1} onChange={(v) => set({ max: v >= 9 ? -1 : Math.round(10 ** v) })} fmt={() => (cfg.max < 0 ? '-1 (off)' : fmtNum(cfg.max))} />
              <Slider label="pages all-frozen" value={cfg.frozen} min={0} max={1} step={0.05} onChange={(v) => set({ frozen: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
              <Slider label="dead rows / minute" value={Math.log10(rate)} min={1} max={6} step={0.05} onChange={(v) => setRate(Math.round(10 ** v))} fmt={() => fmtNum(rate)} />
            </div>
          </Panel>
          <div className="grid content-start gap-2">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="vacuum after" value={fmtNum(t.vac)} t="new" sub={t.capped ? `capped (raw ${fmtNum(t.raw)})` : 'dead rows'} />
              <Stat label="insert vacuum after" value={fmtNum(t.ins)} sub="inserted rows" />
              <Stat label="analyze after" value={fmtNum(t.ana)} sub="changed rows" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="runs per day" value={sim.runs} t={sim.runs === 0 ? 'dead' : 'ok'} />
              <Stat label="peak dead rows" value={fmtNum(sim.peak)} t="dead" sub={`${((sim.peak / cfg.reltuples) * 100).toFixed(1)}% of table`} />
              <Stat label="one run lasts" value={`~${Math.max(1, dur)} min`} sub="at default throttling" />
            </div>
            <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: tone(t.capped ? 'header' : 'muted'), background: toneBg(t.capped ? 'header' : 'muted', 8) }}>
              <Md>{`\`min(${fmtNum(cfg.max < 0 ? Infinity : cfg.max)}, ${cfg.thr} + ${cfg.sf} × ${fmtNum(cfg.reltuples)})\` = **${fmtNum(t.vac)}**${t.capped ? '. PostgreSQL 18\'s `autovacuum_vacuum_max_threshold` caps it, so huge tables no longer wait for 20% of their rows to die.' : '.'}`}</Md>
            </div>
          </div>
        </div>
        <Legend items={[['dead', 'n_dead_tup'], ['new', `vacuum trigger: ${fmtNum(t.vac)} dead rows (${((t.vac / Math.max(cfg.reltuples, 1)) * 100).toFixed(1)}% of the table)`], ['ok', 'autovacuum run starts']]} />
        <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2"><Chart sim={sim} trigger={t.vac} /></div>
        <p className="text-xs text-muted"><Md>{'Simulation assumptions: a steady update rate, the launcher checks every `autovacuum_naptime` (1 min), a run removes the rows that were dead when it started and scans about 5,000 pages/s at default throttling, 100 rows per page.'}</Md></p>
      </>}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const AV_VIEW = `
CREATE FUNCTION av_opt(opts text[], name text) RETURNS float LANGUAGE sql STABLE AS $$
  SELECT coalesce((SELECT option_value FROM pg_options_to_table(opts) WHERE option_name = name),
                  current_setting(name))::float $$;

CREATE VIEW av_status AS
SELECT c.relname,
       greatest(c.reltuples, 0)::bigint AS reltuples,
       s.n_dead_tup,
       CASE WHEN o.vmax < 0 THEN o.vthr + o.vsf * greatest(c.reltuples, 0)
            ELSE least(o.vmax, o.vthr + o.vsf * greatest(c.reltuples, 0)) END::bigint AS vacuum_trigger,
       s.n_ins_since_vacuum,
       (o.ithr + o.isf * greatest(c.reltuples, 0)
          * (1 - CASE WHEN c.relpages > 0 THEN c.relallfrozen::float / c.relpages ELSE 0 END))::bigint AS insert_trigger,
       s.n_mod_since_analyze,
       (o.athr + o.asf * greatest(c.reltuples, 0))::bigint AS analyze_trigger
FROM pg_class c
JOIN pg_stat_user_tables s ON s.relid = c.oid
CROSS JOIN LATERAL (SELECT
  av_opt(c.reloptions, 'autovacuum_vacuum_threshold')           AS vthr,
  av_opt(c.reloptions, 'autovacuum_vacuum_scale_factor')        AS vsf,
  av_opt(c.reloptions, 'autovacuum_vacuum_max_threshold')       AS vmax,
  av_opt(c.reloptions, 'autovacuum_vacuum_insert_threshold')    AS ithr,
  av_opt(c.reloptions, 'autovacuum_vacuum_insert_scale_factor') AS isf,
  av_opt(c.reloptions, 'autovacuum_analyze_threshold')          AS athr,
  av_opt(c.reloptions, 'autovacuum_analyze_scale_factor')       AS asf) o;`

export const lesson: Lesson = {
  slug: 'autovacuum-tuning',
  module: 'm7',
  order: 4,
  title: 'Tuning autovacuum',
  tldr: [
    '**Autovacuum** is a launcher plus a few worker processes that vacuum and analyze each table once its counts of dead, inserted or changed rows cross a threshold computed from the table size.',
    'The defaults suit small tables, so big or hot tables need per-table thresholds and a larger I/O budget, or dead rows pile up faster than the throttled workers can remove them.',
  ],
  visualizer: {
    title: 'When autovacuum fires, and how fast it can work',
    caption: 'Pick a scenario or drag the sliders: the trigger formulas update, and a 24-hour simulation shows dead rows and runs. Switch to **How fast can it go?** for the cost-based throttle.',
    Component: AutovacuumViz,
  },
  playground: {
    setup: `
CREATE TABLE sessions (id int PRIMARY KEY, user_id int NOT NULL, last_seen timestamptz NOT NULL, data text);
INSERT INTO sessions SELECT g, g % 5000, timestamptz '2026-11-01' + g * interval '1 second', md5(g::text)
FROM generate_series(1, 20000) g;
ANALYZE sessions;
${AV_VIEW}`,
    presets: [
      { label: 'The global knobs', sql: `SELECT name, setting, unit FROM pg_settings
WHERE name LIKE 'autovacuum%' OR name IN ('vacuum_cost_limit', 'vacuum_cost_page_miss',
      'vacuum_cost_page_dirty', 'vacuum_cost_page_hit', 'track_counts', 'track_cost_delay_timing')
ORDER BY name;`,
        note: 'New in 18: `autovacuum_vacuum_max_threshold` (100 M), and `autovacuum_worker_slots` (16) next to `autovacuum_max_workers` (3). Slots reserve shared memory and need a restart; `max_workers` is reloadable up to the slot count. `autovacuum_vacuum_cost_limit = -1` means "use `vacuum_cost_limit`" (200).' },
      { label: 'When will this table be vacuumed?', sql: `SELECT pg_stat_force_next_flush();
SELECT * FROM av_status WHERE relname = 'sessions';`,
        note: 'With 20,000 rows the dead-row trigger is 50 + 0.2 × 20,000 = **4,050**. The `av_status` view in the setup applies the trigger formulas, including per-table overrides.' },
      { label: 'Churn rows past the trigger', sql: `UPDATE sessions SET last_seen = last_seen + interval '1 hour' WHERE id <= 3000;
SELECT pg_stat_force_next_flush();
SELECT relname, n_dead_tup, vacuum_trigger, n_dead_tup > vacuum_trigger AS vacuum_due FROM av_status WHERE relname = 'sessions';

UPDATE sessions SET last_seen = last_seen + interval '1 hour' WHERE id BETWEEN 3001 AND 5000;
SELECT pg_stat_force_next_flush();
SELECT relname, n_dead_tup, vacuum_trigger, n_dead_tup > vacuum_trigger AS vacuum_due FROM av_status WHERE relname = 'sessions';`,
        note: '3,000 dead rows: not yet. 5,000: due. On a server the launcher would start a worker within `autovacuum_naptime` (1 min). This playground runs no autovacuum, so nothing happens by itself here.' },
      { label: 'Per-table override', sql: `ALTER TABLE sessions SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_vacuum_threshold = 1000);
SELECT relname, reloptions FROM pg_class WHERE relname = 'sessions';
SELECT pg_stat_force_next_flush();
SELECT relname, reltuples, n_dead_tup, vacuum_trigger FROM av_status WHERE relname = 'sessions';`,
        note: 'Now 1000 + 0.01 × 20,000 = **1,200**. Storage parameters beat the global settings for this table only.' },
      { label: 'Insert-only tables and freezing', sql: `CREATE TABLE clicks (id bigint, at timestamptz, url text);
INSERT INTO clicks SELECT g, now(), 'https://example.com/' || g FROM generate_series(1, 30000) g;
SELECT pg_stat_force_next_flush();
VACUUM (FREEZE) clicks;
INSERT INTO clicks SELECT g, now(), 'https://example.com/' || g FROM generate_series(30001, 35000) g;

SELECT pg_stat_force_next_flush();
SELECT c.relpages, c.relallfrozen, a.n_ins_since_vacuum, a.insert_trigger
FROM av_status a JOIN pg_class c ON c.relname = a.relname WHERE a.relname = 'clicks';`,
        note: 'The insert trigger scales with the **unfrozen** share of the table. After VACUUM FREEZE every page is all-frozen, so the trigger falls to the base **1,000** instead of 1000 + 0.2 × 30,000 = 7,000. (`relpages` and `relallfrozen` refresh only at the next VACUUM or ANALYZE.)' },
      { label: 'Throttle arithmetic', sql: `SELECT current_setting('autovacuum_vacuum_cost_delay') AS delay,
       current_setting('vacuum_cost_limit')::int AS cost_limit,
       round(current_setting('vacuum_cost_limit')::int / current_setting('vacuum_cost_page_miss')::numeric
             / 0.002 * 8192 / 1048576, 1) AS max_mb_per_s_reading,
       round(current_setting('vacuum_cost_limit')::int
             / (current_setting('vacuum_cost_page_miss')::numeric + current_setting('vacuum_cost_page_dirty')::int)
             / 0.002 * 8192 / 1048576, 1) AS max_mb_per_s_read_and_dirty;`,
        note: 'At defaults one worker can read about 390 MB/s from disk but only about 35 MB/s when it also dirties every page. That budget is shared by all running workers.' },
      { label: 'Health check and 18\'s timing columns', sql: `VACUUM (ANALYZE) sessions;
SELECT pg_stat_force_next_flush();
SELECT relname, n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_vacuum IS NOT NULL AS vacuumed, last_autovacuum, vacuum_count,
       total_vacuum_time AS vacuum_ms, total_analyze_time AS analyze_ms, total_autovacuum_time AS autovacuum_ms
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;

ALTER TABLE sessions SET (autovacuum_vacuum_max_threshold = 500);
SELECT relname, reltuples, vacuum_trigger FROM av_status WHERE relname = 'sessions';`,
        note: 'The dead-row share uses `NULLIF` so an empty table does not divide by zero. The `total_*_time` columns (milliseconds, new in 18) show where vacuum time goes; `autovacuum_ms` stays 0 here because nothing runs automatically. A per-table `autovacuum_vacuum_max_threshold = 500` caps the trigger at **500** dead rows.' },
    ],
  },
  production: {
    title: 'A 200 M-row orders table that bloated between vacuums',
    context: 'An e-commerce team runs a 200 M-row `orders` table. Each order is updated several times during fulfilment, about 40,000 updates a minute at peak.',
    problem: 'With the default scale factor, autovacuum waited for 50 + 0.2 × 200 M = **40 M** dead rows. That took about 17 hours of updates to reach, so heap and indexes carried up to 20% dead rows between runs, and every run had 40 M index entries to remove. Queries slowed as scans read through dead rows.',
    solution: 'Set per-table thresholds so the table is vacuumed after about 2 M dead rows, give autovacuum a bigger I/O budget, and monitor dead rows against the trigger.',
    sql: `ALTER TABLE orders SET (
  autovacuum_vacuum_scale_factor = 0.01,     -- 1% instead of 20%
  autovacuum_vacuum_threshold    = 10000,
  autovacuum_analyze_scale_factor = 0.005
);
ALTER SYSTEM SET autovacuum_vacuum_cost_limit = 2000;   -- 10x the default budget
SELECT pg_reload_conf();

SELECT relname, n_dead_tup, last_autovacuum, autovacuum_count, total_autovacuum_time
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;

-- where do runs wait? (18) adds delay_time to the progress view
ALTER SYSTEM SET track_cost_delay_timing = on;`,
    outcome: 'The trigger drops from 40 M to about 2 M dead rows: roughly one run every 50 minutes at peak instead of one every 17 hours, and each run has 20× less to clean. Dead rows stay near 1% of the table.',
  },
  pitfalls: [
    { title: 'Big tables wait for 20% of their rows to die',
      symptom: 'A large table shows millions of `n_dead_tup` and `last_autovacuum` days ago, while small tables are vacuumed constantly.',
      cause: 'The trigger is `50 + 0.2 × reltuples`. PostgreSQL 18 caps it at `autovacuum_vacuum_max_threshold` (100 M), which still allows huge backlogs.',
      fix: 'Lower `autovacuum_vacuum_scale_factor` per table (0.01 to 0.05 for big, hot tables), or lower `autovacuum_vacuum_max_threshold`.',
      sql: `ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.01);` },
    { title: 'Autovacuum keeps getting cancelled',
      symptom: 'The log shows `canceling autovacuum task` again and again and the table is never fully vacuumed.',
      cause: 'Autovacuum yields to any conflicting lock request, such as frequent `ALTER TABLE`, `LOCK`, or manual ANALYZE on the same table. Only anti-wraparound runs refuse to yield.',
      fix: 'Stop the frequent conflicting command, or run a manual `VACUUM` in a quiet window. Check `pg_stat_user_tables.autovacuum_count` to confirm runs complete.' },
    { title: 'Adding workers does not make vacuum faster',
      symptom: 'After raising `autovacuum_max_workers` from 3 to 10, each table takes longer to vacuum.',
      cause: 'The cost limit is shared: total I/O stays at `autovacuum_vacuum_cost_limit` per `autovacuum_vacuum_cost_delay`, split among busy workers.',
      fix: 'Raise `autovacuum_vacuum_cost_limit` (or lower the delay) together with the worker count, within what the disks can sustain.' },
    { title: 'Partitioned parents are never auto-analyzed',
      symptom: 'Queries on a partitioned table get poor plans even though every partition has fresh statistics.',
      cause: 'Autovacuum processes partitions, but a partitioned table stores no rows, so it never triggers ANALYZE on the parent.',
      fix: 'Run `ANALYZE parent_table` after large loads and on a schedule.' },
    { title: 'Hunting autovacuum workers by query text',
      symptom: 'A script meant to cancel the autovacuum that blocks a migration kills the wrong session, or finds nothing, and the migration keeps waiting.',
      cause: 'Matching `query LIKE \'%autovacuum%\'` also matches the monitoring query itself. A worker\'s `query` reads `autovacuum: VACUUM public.orders`, and only `backend_type` identifies it reliably. Signalling it needs superuser unless the role has `pg_signal_autovacuum_worker` (new in 18).',
      fix: 'Filter on `backend_type`, grant the predefined role to the migration user, and remember that an anti-wraparound run will simply restart.',
      sql: `SELECT pid, query, now() - xact_start AS running_for
FROM pg_stat_activity WHERE backend_type = 'autovacuum worker';
GRANT pg_signal_autovacuum_worker TO migrator;` },
  ],
  pointers: [
    'Vacuum when dead rows > **min(max_threshold, 50 + 0.2 × reltuples)**; max_threshold (100 M) is **new in 18**.',
    'Insert-only tables: **1000 + 0.2 × reltuples × unfrozen share**; analyze: **50 + 0.1 × reltuples**.',
    'Override per table with **storage parameters** (`ALTER TABLE … SET (autovacuum_…)`).',
    'Throttle: **cost_limit 200** per **2 ms** delay, page hit 1 / miss 2 / dirty 20, **shared by all workers**.',
    'Watch **`pg_stat_user_tables`**: `n_dead_tup`, `n_ins_since_vacuum`, `last_autovacuum`, `autovacuum_count`.',
  ],
  sources: ['routine-vacuuming.html', 'runtime-config-vacuum.html', 'sql-createtable.html', 'monitoring-stats.html'],
}
