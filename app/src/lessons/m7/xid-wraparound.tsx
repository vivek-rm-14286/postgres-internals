import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Stat, fmtNum } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the circular 32-bit XID space. A table's oldest unfrozen XID (relfrozenxid) sits at the
 * top; the current XID moves clockwise as transactions are consumed. Everything up to 2^31 behind the
 * current XID is "the past"; the other half is "the future". Thresholds are the PostgreSQL 18 defaults
 * (runtime-config-vacuum.html) and the wrap limits from routine-vacuuming.html:
 * wrap limit = 2^31 - 1, warnings start 40 M before it, new XIDs are refused 3 M before it.
 * ---------------------------------------------------------------------------------------------- */

const WRAP = 2 ** 31 - 1
const T = {
  minAge: 50e6, tableAge: 150e6, maxAge: 200e6, failsafe: 1.6e9, warn: WRAP - 40e6, stop: WRAP - 3e6,
}
interface Stage { at: number; label: string; t: Tone; text: string }
const STAGES: Stage[] = [
  { at: 0, label: 'normal', t: 'ok', text: 'Plain VACUUMs freeze rows older than `vacuum_freeze_min_age` (50 M) on the pages they visit, but may skip all-visible pages.' },
  { at: T.tableAge, label: 'aggressive VACUUM', t: 'accent', text: 'Past `vacuum_freeze_table_age` (150 M) any VACUUM becomes **aggressive**: it reads every page not already all-frozen so it can advance `relfrozenxid`.' },
  { at: T.maxAge, label: 'anti-wraparound autovacuum', t: 'new', text: 'Past `autovacuum_freeze_max_age` (200 M) autovacuum is **forced**, even with `autovacuum = off`, and it does not yield to conflicting locks. Its query ends with `(to prevent wraparound)`.' },
  { at: T.failsafe, label: 'failsafe', t: 'header', text: 'Past `vacuum_failsafe_age` (1.6 B) VACUUM drops cost-based delay, skips index vacuuming and may use all of shared buffers, to finish freezing as fast as possible.' },
  { at: T.warn, label: 'WARNING', t: 'dead', text: 'Every new XID logs **WARNING: database "app" must be vacuumed within N transactions**, with a HINT to run a database-wide VACUUM.' },
  { at: T.stop, label: 'refuses XIDs', t: 'dead', text: '**ERROR: database is not accepting commands that assign new transaction IDs to avoid wraparound data loss.** Read-only queries and VACUUM still work.' },
]
const stageOf = (age: number) => [...STAGES].reverse().find((s) => age >= s.at)!

const R = 120, C = 150
const pt = (frac: number, r = R) => { const a = frac * 2 * Math.PI - Math.PI / 2; return [C + r * Math.cos(a), C + r * Math.sin(a)] as const }
const arc = (f0: number, f1: number, r = R) => {
  const [x0, y0] = pt(f0, r), [x1, y1] = pt(f1, r)
  const large = f1 - f0 > 0.5 ? 1 : 0
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`
}

function Ring({ age, frozen, noFreeze }: { age: number; frozen: boolean; noFreeze: boolean }) {
  const f = age / 2 ** 32 // fraction of the circle from relfrozenxid (top) to the current XID
  const past = f - 0.5
  const [cx, cy] = pt(f, R)
  const invisible = noFreeze && age > WRAP
  const marks: [number, string, Tone][] = [[T.failsafe, 'failsafe 1.6 B', 'header'], [T.warn, 'warn', 'dead']]
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px]" role="img" aria-label="Circular 32-bit transaction ID space">
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--border)" strokeWidth={22} />
      {/* the future: the half ahead of the current XID */}
      <motion.path initial={false} animate={{ d: arc(f, f + 0.4999) }} fill="none" stroke={toneBg('muted', 30)} strokeWidth={22} />
      {/* the past: the half behind */}
      <motion.path initial={false} animate={{ d: arc(past, f) }} fill="none" stroke={toneBg('ok', 40)} strokeWidth={22} />
      {/* age arc from relfrozenxid to current */}
      <motion.path initial={false} animate={{ d: arc(0, Math.max(f, 0.0005), R - 22) }} fill="none" stroke={tone(stageOf(age).t)} strokeWidth={6} strokeLinecap="round" />
      {marks.map(([a, l, t]) => { const [x, y] = pt(a / 2 ** 32, R + 18); const [x1, y1] = pt(a / 2 ** 32, R - 12); const [x2, y2] = pt(a / 2 ** 32, R + 11)
        return <g key={l}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tone(t)} strokeWidth={2} /><text x={x} y={y + 3} textAnchor="middle" fontSize={9.5} fill={tone(t)} fontFamily="var(--font-mono)">{l}</text></g> })}
      {/* relfrozenxid marker + the old row */}
      <circle cx={C} cy={C - R} r={5} fill={tone('header')} />
      <text x={C - 10} y={C - R - 16} textAnchor="end" fontSize={10} fill="var(--text)" fontFamily="var(--font-mono)">relfrozenxid</text>
      <motion.circle initial={false} animate={frozen ? { cx: C, cy: C - 18, r: 9 } : { cx: C, cy: C - R + 22, r: 7 }}
        fill={invisible ? tone('dead') : frozen ? tone('pointer') : tone('tuple')} stroke="var(--surface)" strokeWidth={2} />
      <text x={C} y={frozen ? C + 4 : C - R + 46} textAnchor="middle" fontSize={10} fill="var(--muted)">{frozen ? 'row frozen: older than every XID' : invisible ? 'old row now "in the future"' : 'old row (xmin = relfrozenxid)'}</text>
      {/* current XID */}
      <motion.g initial={false} animate={{ x: cx - C, y: cy - (C - R) }} transition={{ type: 'spring', stiffness: 90, damping: 18 }}>
        <circle cx={C} cy={C - R} r={8} fill={tone('accent')} stroke="var(--surface)" strokeWidth={2} />
      </motion.g>
      <text x={C} y={C + 34} textAnchor="middle" fontSize={11} fill="var(--muted)">age(relfrozenxid)</text>
      <text x={C} y={C + 54} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{fmtNum(age)}</text>
    </svg>
  )
}

function XidViz() {
  const [age, setAge] = useState(20e6)
  const [frozen, setFrozen] = useState(false)
  const [mode, setMode] = useState<'pg' | 'none'>('pg')
  const [skipped, setSkipped] = useState(false) // a plain VACUUM that could not advance relfrozenxid
  const st = stageOf(age)
  const noFreeze = mode === 'none'
  const nextStage = () => {
    const nxt = STAGES.find((s) => s.at > age)
    setFrozen(false); setSkipped(false)
    setAge(nxt ? nxt.at + 1e6 : 20e6)
    if (noFreeze && !nxt) setAge(WRAP + 5e7)
  }
  const vacuum = (aggr: boolean) => {
    if (noFreeze) return
    setSkipped(false)
    if (aggr) { setAge(0); setFrozen(true) } // FREEZE uses a freeze age of 0: relfrozenxid advances to about now
    else if (age >= T.tableAge) { setAge(T.minAge); setFrozen(true) } // aggressive: relfrozenxid advances to about now − vacuum_freeze_min_age
    else setSkipped(true) // not aggressive: all-visible pages are skipped, so relfrozenxid may stay where it is
  }
  const left = Math.max(0, WRAP - age)
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Model" value={mode} onChange={(m) => { setMode(m); setFrozen(false); setSkipped(false); setAge(20e6) }} options={[['pg', 'PostgreSQL (freezes)'], ['none', 'What if nothing froze?']]} />
        <Btn primary testid="viz-next" onClick={nextStage}>Advance to next threshold</Btn>
        <Btn onClick={() => vacuum(false)} disabled={noFreeze}>VACUUM</Btn>
        <Btn onClick={() => vacuum(true)} disabled={noFreeze}>VACUUM (FREEZE)</Btn>
      </div>
      <label className="grid grid-cols-[190px_1fr] items-center gap-2 text-xs">
        <span className="font-mono text-muted">XIDs since relfrozenxid</span>
        <input type="range" min={0} max={2.3e9} step={1e6} value={age} onChange={(e) => { setAge(+e.target.value); setFrozen(false); setSkipped(false) }} className="accent-[var(--accent)]" aria-label="age of relfrozenxid" />
      </label>
      <div className="grid items-center gap-4 sm:grid-cols-[300px_1fr]">
        <div className="mx-auto w-full max-w-[300px]"><Ring age={age} frozen={frozen} noFreeze={noFreeze} /></div>
        <div className="grid min-w-0 content-start gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="server state" value={<span className="text-sm">{noFreeze ? (age > WRAP ? 'data loss' : 'row visible') : st.label}</span>} t={noFreeze ? (age > WRAP ? 'dead' : 'ok') : st.t} />
            <Stat label="XIDs until wraparound" value={fmtNum(left)} t={left < 40e6 ? 'dead' : undefined} />
          </div>
          <motion.div key={noFreeze && age > WRAP ? 'loss' : skipped ? 'skipped' : frozen ? `frozen-${age}` : st.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: tone(noFreeze && age > WRAP ? 'dead' : st.t), background: toneBg(noFreeze && age > WRAP ? 'dead' : st.t, 10) }}>
            <Md>{noFreeze && age > WRAP
              ? 'The row\'s xmin is now more than 2^31 behind, which modulo-2^32 arithmetic reads as **2^31 ahead**: the committed row appears to come from the future and **vanishes from every query**. Freezing exists to make this impossible.'
              : noFreeze ? 'In this imaginary server nothing freezes and nothing warns. The old row stays visible only while its xmin is less than 2^31 behind the current XID. Keep advancing.'
              : skipped ? 'Plain VACUUM below `vacuum_freeze_table_age` (150 M) is not aggressive: it skips all-visible pages, so `relfrozenxid` may not move and the age stays where it is. Advance past 150 M, or run **VACUUM (FREEZE)**.'
              : frozen && age === 0 ? '`VACUUM (FREEZE)` froze every row it could, as if `vacuum_freeze_min_age` were 0, and moved `relfrozenxid` up to the current XID, so `age(relfrozenxid)` dropped to about 0. The frozen row now counts as older than every XID, forever.'
              : frozen && age < T.tableAge ? 'An aggressive VACUUM froze the old rows and moved `relfrozenxid` up to the oldest XID still unfrozen, so `age(relfrozenxid)` dropped to about `vacuum_freeze_min_age`. The frozen row now counts as older than every XID, forever.' : st.text}</Md>
          </motion.div>
          <Panel title="Thresholds on age(relfrozenxid)">
            <div className="grid gap-1 font-mono text-xs">
              {STAGES.slice(1).map((s) => (
                <div key={s.label} className="flex justify-between gap-2" style={{ color: age >= s.at ? tone(s.t) : 'var(--muted)' }}>
                  <span>{s.label}</span><span>{s.at.toLocaleString('en-US')}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <Legend items={[['ok', 'the past: visible XIDs (2^31)'], ['muted', 'the future (2^31)'], ['accent', 'current XID'], ['header', 'relfrozenxid'], ['pointer', 'frozen row']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'xid-wraparound',
  module: 'm7',
  order: 5,
  title: 'XID wraparound, freezing and MultiXacts',
  tldr: [
    'Transaction IDs are 32-bit counters compared modulo 2^32, so any row whose `xmin` falls more than about 2 billion transactions behind would suddenly look like it came from the future.',
    'VACUUM prevents that by **freezing** old rows, marking them older than every XID, and PostgreSQL escalates from aggressive vacuums to forced autovacuums to refusing new XIDs as a table approaches the limit.',
  ],
  visualizer: {
    title: 'The XID circle',
    caption: 'Advance through each threshold and watch what the server does. Run VACUUM to freeze and pull `relfrozenxid` forward, then switch to **What if nothing froze?** and push past 2^31.',
    Component: XidViz,
  },
  playground: {
    extensions: ['pageinspect', 'pg_visibility'],
    setup: `
CREATE TABLE ledger (id int PRIMARY KEY, account int NOT NULL, amount int NOT NULL);
INSERT INTO ledger SELECT g, g % 100, g FROM generate_series(1, 5000) g;
CREATE PROCEDURE burn_xids(n int) LANGUAGE plpgsql AS $$
BEGIN
  FOR i IN 1..n LOOP PERFORM pg_current_xact_id(); COMMIT; END LOOP;  -- one XID per loop
END $$;`,
    presets: [
      { label: 'How old is everything?', sql: `SELECT pg_current_xact_id() AS current_xid8;

SELECT c.oid::regclass AS table_name,
       greatest(age(c.relfrozenxid), age(t.relfrozenxid)) AS xid_age,
       mxid_age(c.relminmxid) AS mxid_age
FROM pg_class c LEFT JOIN pg_class t ON c.reltoastrelid = t.oid
WHERE c.relkind IN ('r', 'm') AND c.relnamespace = 'public'::regnamespace;

SELECT datname, age(datfrozenxid) FROM pg_database;`,
        note: 'The three ages to monitor: per table, including its TOAST table, and per database. `pg_current_xact_id()` returns a 64-bit `xid8` (epoch + xid); the on-disk xmin is the low 32 bits.' },
      { label: 'Which statements use an XID?', sql: `BEGIN;
SELECT pg_current_xact_id_if_assigned() AS after_begin;
SELECT count(*) FROM ledger;
SELECT pg_current_xact_id_if_assigned() AS after_select;
UPDATE ledger SET amount = amount WHERE id = 4999;
SELECT pg_current_xact_id_if_assigned() AS after_update;
COMMIT;

SELECT txid_current() AS probe_1;
SELECT txid_current() AS probe_2;`,
        note: 'A transaction gets an XID only when it first **writes**: reads alone leave it NULL, so read traffic never ages the cluster. `txid_current()` and `pg_current_xact_id()` force one, so each probe call burns an XID (they differ by 1).' },
      { label: 'Burn 100,000 XIDs', sql: `CALL burn_xids(100000);

SELECT relname, relfrozenxid, age(relfrozenxid) FROM pg_class WHERE relname = 'ledger';
SELECT 2147483647 - 40000000 - age(datfrozenxid) AS xids_until_warning,
       2147483647 - 3000000 - age(datfrozenxid)  AS xids_until_stop
FROM pg_database WHERE datname = current_database();`,
        note: 'Each loop commits once, so each consumes one XID. `relfrozenxid` stays put and its age grows. Busy servers burn this many in seconds to minutes.' },
      { label: 'Not frozen yet', sql: `SELECT lp, t_xmin, (heap_tuple_infomask_flags(t_infomask, t_infomask2)).combined_flags AS combined,
       (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags AS raw
FROM heap_page_items(get_raw_page('ledger', 0)) LIMIT 3;
SELECT * FROM pg_visibility_map_summary('ledger');`,
        note: 'Rows still carry their original xmin and no `HEAP_XMIN_FROZEN` flag. No page is all-frozen.' },
      { label: 'VACUUM (FREEZE)', sql: `VACUUM (FREEZE) ledger;

SELECT relname, relfrozenxid, age(relfrozenxid) FROM pg_class WHERE relname = 'ledger';
SELECT lp, t_xmin, (heap_tuple_infomask_flags(t_infomask, t_infomask2)).combined_flags AS combined
FROM heap_page_items(get_raw_page('ledger', 0)) LIMIT 3;
SELECT * FROM pg_visibility_map_summary('ledger');`,
        note: '`relfrozenxid` jumps forward and its age drops to almost 0. Each tuple shows `HEAP_XMIN_FROZEN`, yet `t_xmin` keeps its original value: freezing sets flag bits, it no longer overwrites xmin.' },
      { label: 'The freeze settings', sql: `SELECT name, to_char(setting::bigint, 'FM9,999,999,999') AS value
FROM pg_settings
WHERE name IN ('vacuum_freeze_min_age', 'vacuum_freeze_table_age', 'autovacuum_freeze_max_age',
               'vacuum_failsafe_age', 'vacuum_multixact_freeze_min_age',
               'vacuum_multixact_freeze_table_age', 'autovacuum_multixact_freeze_max_age')
ORDER BY setting::bigint;`,
        note: '50 M, 150 M, 200 M and 1.6 B for XIDs; multixacts have their own limits (5 M, 150 M, 400 M).' },
      { label: 'Make a MultiXact', sql: `BEGIN;
SELECT * FROM ledger WHERE id = 1 FOR SHARE;      -- a row lock by the transaction
SAVEPOINT s;
UPDATE ledger SET amount = 0 WHERE id = 1;        -- an update by its subtransaction
COMMIT;

SELECT lp, t_xmax, (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('ledger', 0)) WHERE lp = 1;
SELECT * FROM pg_get_multixact_members(
  (SELECT t_xmax FROM heap_page_items(get_raw_page('ledger', 0)) WHERE lp = 1)::text::xid);`,
        note: 'Two lockers on one row do not fit in `xmax`, so `xmax` holds a **MultiXact ID** (`HEAP_XMAX_IS_MULTI`) and its members live in `pg_multixact`. MultiXact IDs wrap around too.' },
    ],
  },
  production: {
    title: 'A forgotten replication slot and the wraparound countdown',
    context: 'A logistics company runs about 3,000 write transactions per second on its primary. Months ago a team created a logical replication slot for a CDC pilot and abandoned it.',
    problem: 'Monitoring showed `age(datfrozenxid)` climbing past 1 billion although autovacuum ran constantly. The slot\'s `catalog_xmin` stopped VACUUM from freezing the system catalogs, and `datfrozenxid` is the minimum over every table, catalogs included. At 3,000 XIDs/s, about 1.1 billion remaining XIDs is roughly 4 days until the 40 M warning zone.',
    solution: 'Follow the recovery order: find what holds the horizon back (prepared transactions, long sessions, slots), remove it, then plain VACUUM the oldest tables. No single-user mode, no VACUUM FULL, no FREEZE.',
    sql: `SELECT gid, age(transaction) FROM pg_prepared_xacts ORDER BY 2 DESC;
SELECT pid, age(backend_xid), age(backend_xmin), state FROM pg_stat_activity ORDER BY 3 DESC NULLS LAST;
SELECT slot_name, age(xmin), age(catalog_xmin), active FROM pg_replication_slots;

SELECT pg_drop_replication_slot('cdc_pilot');

SELECT c.oid::regclass, age(c.relfrozenxid) FROM pg_class c
WHERE c.relkind IN ('r','m') ORDER BY 2 DESC LIMIT 10;   -- the oldest tables here are pg_catalog ones
VACUUM (VERBOSE);  -- database-wide, as superuser`,
    outcome: 'Once the slot was dropped, the next aggressive vacuums advanced `relfrozenxid`, and `age(datfrozenxid)` fell back to around the 200 M `autovacuum_freeze_max_age` range. An alert on `age(datfrozenxid) > 500 M` and on inactive slots now catches this weeks earlier.',
  },
  pitfalls: [
    { title: 'Panicking into single-user mode',
      symptom: 'The server refuses new XIDs with "database is not accepting commands that assign new transaction IDs".',
      cause: 'A common belief is that you must stop the server and vacuum in single-user mode. In PostgreSQL 18 that is neither necessary nor desirable, and single-user mode disables the wraparound safeguards.',
      fix: 'Stay online. Clear prepared transactions, long transactions and stale slots, then run a plain database-wide `VACUUM` as superuser. Do not use VACUUM FULL (it needs an XID) or VACUUM FREEZE (more work than needed).' },
    { title: 'An idle-in-transaction session blocks freezing',
      symptom: '`age(datfrozenxid)` keeps growing even though aggressive autovacuums finish.',
      cause: 'VACUUM cannot freeze past the oldest snapshot still running anywhere in the cluster. One forgotten `BEGIN` in a pooled connection holds it back.',
      fix: 'Set `idle_in_transaction_session_timeout` and alert on old `backend_xmin`.',
      sql: `SELECT pid, now() - xact_start AS open_for, age(backend_xmin)
FROM pg_stat_activity WHERE backend_xmin IS NOT NULL ORDER BY 3 DESC;` },
    { title: 'Insert-only tables surprise you with a huge vacuum',
      symptom: 'An append-only table that never had dead rows suddenly gets a long, unstoppable `(to prevent wraparound)` autovacuum that reads every page.',
      cause: 'Without dead rows, normal vacuums skipped its all-visible pages, so nothing was frozen until `autovacuum_freeze_max_age` forced a full aggressive scan.',
      fix: 'Let insert-triggered autovacuum freeze as you go (keep `autovacuum_vacuum_insert_threshold` enabled, consider a lower per-table `autovacuum_freeze_min_age`), or run `VACUUM (FREEZE)` after bulk loads.' },
    { title: 'A health check that burns XIDs',
      symptom: '`age(datfrozenxid)` grows quickly on a database that is mostly read, and the XID rate tracks the monitoring interval.',
      cause: 'A probe such as `SELECT txid_current()` assigns a new XID on every call, even though it writes nothing. Thousands of probes per minute from load balancers add up to millions of XIDs a day.',
      fix: 'Probe with `SELECT 1`, or read the current value without assigning one: `pg_current_snapshot()` or `pg_current_xact_id_if_assigned()`.',
      sql: `SELECT pg_snapshot_xmax(pg_current_snapshot()) AS next_xid;  -- assigns nothing` },
  ],
  pointers: [
    'XIDs are **32-bit, compared modulo 2^32**: 2 billion in the past, 2 billion in the future.',
    '**Freezing** marks a row older than every XID; `relfrozenxid` / `datfrozenxid` track the oldest unfrozen XID.',
    'Ladder: **150 M** aggressive · **200 M** forced autovacuum · **1.6 B** failsafe · **40 M before wrap** warnings · **3 M before wrap** no new XIDs.',
    'Recovery: end [prepared](/e3/distributed-transactions)/long transactions, drop stale slots, plain **VACUUM** as superuser; never single-user mode, FULL or FREEZE.',
    '**MultiXacts** (several lockers in one `xmax`) age and wrap the same way: watch `mxid_age(relminmxid)`.',
  ],
  sources: ['routine-vacuuming.html', 'runtime-config-vacuum.html', 'transaction-id.html', 'pageinspect.html', 'pgvisibility.html', 'functions-info.html'],
}
