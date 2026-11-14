import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { ScenarioStepper, TupleVersions, type TEvent, type TLane, type TStep, type TVersion } from './_timeline'

/* ------------------------------------------------------------------------------------------------
 * Part 1: a scripted two-session timeline (PGlite has one backend). Session A reads twice while B
 * updates and inserts. The "A sees?" column is computed with the real visibility rule against the
 * snapshot A is using at that moment, so Read Committed and Repeatable Read diverge on their own.
 * Part 2: a snapshot visibility calculator, the same rule with every input editable.
 * ---------------------------------------------------------------------------------------------- */

interface Snap { xmin: number; xmax: number; xip: number[] }
type Status = 'committed' | 'aborted' | 'running'

function parseSnap(s: string): Snap | null {
  const m = s.trim().match(/^(\d+):(\d+):([\d,\s]*)$/)
  if (!m) return null
  const xmin = +m[1], xmax = +m[2]
  const xip = m[3].split(',').map((x) => x.trim()).filter(Boolean).map(Number)
  if (xmin > xmax || xip.some((x) => x < xmin || x >= xmax)) return null
  return { xmin, xmax, xip }
}
const fmt = (s: Snap) => `${s.xmin}:${s.xmax}:${s.xip.join(',')}`

/** "Was xid finished and committed before this snapshot?" (pg_visible_in_snapshot + commit status) */
function xidVisible(x: number, s: Snap, st: (x: number) => Status) {
  if (x >= s.xmax || s.xip.includes(x)) return false
  return st(x) === 'committed'
}
function tupleVisible(xmin: number, xmax: number, s: Snap, st: (x: number) => Status) {
  return xidVisible(xmin, s, st) && !(xmax !== 0 && xidVisible(xmax, s, st))
}

/* ---------------- Part 1: timeline ---------------- */
type Iso = 'rc' | 'rr'
const lanes = (iso: Iso): TLane[] => [
  { id: 'A', name: 'Session A (reader)', note: iso === 'rc' ? 'READ COMMITTED' : 'REPEATABLE READ' },
  { id: 'B', name: 'Session B (writer)', note: 'READ COMMITTED' },
]
const events = (iso: Iso): TEvent[] => [
  { lane: 'A', at: 0, kind: 'sql', sql: iso === 'rc' ? 'BEGIN;' : 'BEGIN ISOLATION LEVEL\n  REPEATABLE READ;', out: 'no snapshot yet' },
  { lane: 'B', at: 1, kind: 'sql', sql: 'BEGIN;\nUPDATE item SET price = 12\n WHERE id = 1;', out: 'xid **811** assigned · UPDATE 1' },
  { lane: 'A', at: 2, kind: 'sql', sql: 'SELECT * FROM item;', out: '→ (1, desk, **10**)  · snapshot taken' },
  { lane: 'B', at: 3, kind: 'ok', sql: 'COMMIT;', out: '811 committed' },
  { lane: 'B', at: 4, kind: 'ok', sql: "INSERT INTO item\n VALUES (2, 'lamp', 30);", out: 'autocommit · xid **812** committed' },
  { lane: 'A', at: 5, kind: 'sql', sql: 'SELECT * FROM item;', out: iso === 'rc' ? '→ (1, desk, **12**), (2, lamp, 30)' : '→ (1, desk, **10**)  · same snapshot' },
  { lane: 'A', at: 6, kind: 'ok', sql: 'COMMIT;' },
]
const S1: Snap = { xmin: 811, xmax: 811, xip: [] }
const S2: Snap = { xmin: 813, xmax: 813, xip: [] }
interface X1 { snapA: Snap | null; status: Record<number, Status>; vers: { id: string; label: string; xmin: number; xmax: number }[] }

function rcrrSteps(iso: Iso): TStep<X1>[] {
  const v1 = { id: 'v1', label: '(1, desk, 10)', xmin: 800, xmax: 0 }
  const v1d = { ...v1, xmax: 811 }
  const v2 = { id: 'v2', label: '(1, desk, 12)', xmin: 811, xmax: 0 }
  const v3 = { id: 'v3', label: '(2, lamp, 30)', xmin: 812, xmax: 0 }
  const run: Record<number, Status> = { 800: 'committed', 811: 'running' }
  const done: Record<number, Status> = { 800: 'committed', 811: 'committed' }
  const done2: Record<number, Status> = { ...done, 812: 'committed' }
  const second = iso === 'rc' ? S2 : S1
  return [
    { tick: 0, title: 'A begins', body: iso === 'rc' ? '**BEGIN** takes no snapshot. In Read Committed every *statement* will take a fresh one.' : '**BEGIN** still takes no snapshot. Repeatable Read takes one at the **first statement** and keeps it to the end.',
      x: { snapA: null, status: { 800: 'committed' }, vers: [v1] } },
    { tick: 1, title: 'B updates the row (xid 811)', body: 'B writes a new version with `xmin = 811` and stamps the old one `xmax = 811`. Both versions sit on the page while 811 is in progress.',
      badges: { B: { xid: '811' } }, x: { snapA: null, status: run, vers: [v1d, v2] } },
    { tick: 2, title: 'A reads: snapshot 811:811:', body: 'xmin = **811**, the oldest xid still running. xmax = **811**, one past the newest *finished* xid. So 800 counts as committed and 811 counts as not finished: A reads **10**. (`xip` lists running xids only when some newer xid has already finished.)',
      badges: { A: { snap: fmt(S1) }, B: { xid: '811' } }, x: { snapA: S1, status: run, vers: [v1d, v2] } },
    { tick: 3, title: 'B commits', body: '811 flips to committed in `pg_xact`. A\'s snapshot was taken before that, and 811 ≥ its xmax, so for that snapshot 811 stays unfinished.',
      badges: { A: { snap: fmt(S1) } }, x: { snapA: S1, status: done, vers: [v1d, v2] } },
    { tick: 4, title: 'B inserts a new row (xid 812)', body: 'An autocommit INSERT runs as its own transaction, 812, and commits at once. 812 ≥ the snapshot\'s xmax, so A\'s current snapshot treats it as *future*.',
      badges: { A: { snap: fmt(S1) } }, x: { snapA: S1, status: done2, vers: [v1d, v2, v3] } },
    { tick: 5, title: iso === 'rc' ? 'A reads again: new snapshot 813:813:' : 'A reads again: same snapshot', body: iso === 'rc'
      ? 'Read Committed takes a **new snapshot per statement**. Now 811 and 812 are finished and committed, so A sees **12** and the new lamp: a *non-repeatable read* and a *phantom*.'
      : 'Repeatable Read reuses the **transaction snapshot**. 811 is still in its `xip` and 812 is still ≥ xmax, so A sees exactly what it saw before: **10**, no lamp.',
      badges: { A: { snap: fmt(second) } }, x: { snapA: second, status: done2, vers: [v1d, v2, v3] } },
    { tick: 6, title: 'A commits', body: iso === 'rc' ? 'Two statements, two snapshots. Read Committed never shows uncommitted data, but it does show data committed *during* the transaction.' : 'One snapshot for the whole transaction: a stable view, at the cost of possible serialization errors if A had tried to update row 1.',
      x: { snapA: null, status: done2, vers: [v1d, v2, v3] } },
  ]
}

function RcRrTimeline() {
  const [iso, setIso] = useState<Iso>('rc')
  const steps = useMemo(() => rcrrSteps(iso), [iso])
  return (
    <ScenarioStepper key={iso} lanes={lanes(iso)} events={events(iso)} steps={steps}
      extra={<Segmented label="Isolation of A" value={iso} onChange={setIso} options={[['rc', 'Read Committed'], ['rr', 'Repeatable Read']]} />}
      panel={(s) => {
        const st = (x: number) => s.x.status[x] ?? 'running'
        const vers: TVersion[] = s.x.vers.map((v) => {
          const deadNow = v.xmax !== 0 && st(v.xmax) === 'committed'
          const newNow = st(v.xmin) === 'running'
          return { id: v.id, label: v.label, xmin: String(v.xmin), xmax: String(v.xmax), status: deadNow ? 'dead' : newNow ? 'new' : 'live',
            sees: s.x.snapA ? { A: tupleVisible(v.xmin, v.xmax, s.x.snapA, st) } : undefined,
            note: v.xmax !== 0 ? `xmax ${v.xmax} ${st(v.xmax) === 'committed' ? 'committed' : 'in progress'}` : newNow ? 'inserter in progress' : undefined }
        })
        return <TupleVersions title={`Heap versions of item, judged by A's snapshot${s.x.snapA ? ` ${fmt(s.x.snapA)}` : ''}`} versions={vers} lanes={['A']} />
      }} />
  )
}

/* ---------------- Part 2: calculator ---------------- */
type ClickMode = 'xmin' | 'xmax' | 'status'
const PRESETS: { label: string; snap: string; xmin: number; xmax: number; aborted: number[] }[] = [
  { label: 'Old committed row', snap: '100:104:100,102', xmin: 97, xmax: 0, aborted: [] },
  { label: 'Inserter still running', snap: '100:104:100,102', xmin: 102, xmax: 0, aborted: [] },
  { label: 'Inserted after snapshot', snap: '100:104:100,102', xmin: 105, xmax: 0, aborted: [] },
  { label: 'Deleted before snapshot', snap: '100:104:100,102', xmin: 97, xmax: 101, aborted: [] },
  { label: 'Deleter still running', snap: '100:104:100,102', xmin: 97, xmax: 100, aborted: [] },
  { label: 'Aborted insert', snap: '100:104:100,102', xmin: 103, xmax: 0, aborted: [103] },
]

function Calculator() {
  const [snapText, setSnapText] = useState('100:104:100,102')
  const [txmin, setTxmin] = useState(97)
  const [txmax, setTxmax] = useState(101)
  const [aborted, setAborted] = useState<number[]>([])
  const [mode, setMode] = useState<ClickMode>('xmin')
  const snap = parseSnap(snapText)
  const s = snap ?? { xmin: 100, xmax: 104, xip: [100, 102] }
  const lo = Math.min(s.xmin, txmin, txmax || txmin) - 2
  const hi = Math.max(s.xmax, txmin, txmax) + 2
  const cells = Array.from({ length: Math.min(hi - lo + 1, 18) }, (_, i) => lo + i)
  const st = (x: number): Status => (x >= s.xmax || s.xip.includes(x) ? 'running' : aborted.includes(x) ? 'aborted' : 'committed')
  const cls = (x: number): [Tone, string] =>
    x >= s.xmax ? ['muted', 'not yet started'] : s.xip.includes(x) ? ['new', 'in progress (xip)'] : aborted.includes(x) ? ['dead', 'aborted'] : ['ok', 'committed']

  const click = (x: number) => {
    if (mode === 'xmin') setTxmin(x)
    else if (mode === 'xmax') setTxmax(x === txmax ? 0 : x)
    else if (x < s.xmax && !s.xip.includes(x)) setAborted((a) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x]))
  }

  const minOk = xidVisible(txmin, s, st)
  const maxOk = txmax !== 0 && xidVisible(txmax, s, st)
  const visible = minOk && !maxOk
  const why = (x: number, role: 'xmin' | 'xmax') => {
    if (x >= s.xmax) return `${x} ≥ snapshot xmax ${s.xmax}: it had **not started** when the snapshot was taken, so it counts as invisible.`
    if (s.xip.includes(x)) return `${x} is in **xip**: still in progress at snapshot time, so its work is invisible.`
    if (aborted.includes(x)) return `${x} finished but **aborted** (pg_xact), so its work never counts.`
    return `${x} ${x < s.xmin ? `< snapshot xmin ${s.xmin}` : 'is below xmax and not in xip'}: finished and **committed** before the snapshot${role === 'xmin' ? ', so the insert counts' : ', so the delete counts'}.`
  }

  return (
    <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted">snapshot
          <input value={snapText} onChange={(e) => setSnapText(e.target.value)} aria-label="Snapshot xmin:xmax:xip"
            className="w-44 rounded-md border bg-surface px-2 py-1 font-mono text-[12px] text-ink" style={{ borderColor: snap ? 'var(--border)' : tone('dead') }} />
        </label>
        <Segmented label="A click on the xid line sets" value={mode} onChange={setMode} options={[['xmin', 'click sets tuple xmin'], ['xmax', 'click sets xmax'], ['status', 'click toggles abort']]} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => { setSnapText(p.snap); setTxmin(p.xmin); setTxmax(p.xmax); setAborted(p.aborted) }}
            className="rounded-md border border-line px-2 py-1 text-[11px] hover:border-accent">{p.label}</button>
        ))}
      </div>
      {!snap && <p className="text-xs" style={{ color: tone('dead') }}>Write the snapshot as xmin:xmax:xip, for example 100:104:100,102 (xip values must lie in [xmin, xmax)).</p>}
      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-line bg-bg p-3">
        <div className="flex min-w-[600px] gap-1">
          {cells.map((x) => {
            const [t, label] = cls(x)
            const isMin = x === txmin, isMax = x === txmax
            return (
              <motion.button key={x} layout onClick={() => click(x)} title={`xid ${x}: ${label}`}
                className="relative flex h-16 flex-1 flex-col items-center justify-center rounded-md border font-mono text-[12px]"
                style={{ borderColor: tone(t), background: toneBg(t, isMin || isMax ? 34 : 14), outline: isMin || isMax ? `2px solid ${tone(isMin ? 'tuple' : 'dead')}` : 'none' }}>
                <span className="font-semibold">{x}</span>
                <span className="text-[9.5px] text-muted">{x === s.xmin ? 'snap xmin' : x === s.xmax ? 'snap xmax' : ''}</span>
                <AnimatePresence>
                  {(isMin || isMax) && (
                    <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute -bottom-2 rounded px-1 text-[9.5px] font-bold text-white" style={{ background: tone(isMin ? 'tuple' : 'dead') }}>
                      {isMin && isMax ? 'xmin+xmax' : isMin ? 't_xmin' : 't_xmax'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </div>
      <Legend items={[['ok', 'committed before snapshot'], ['dead', 'aborted'], ['new', 'in progress (xip)'], ['muted', '≥ xmax: future'], ['tuple', 'tuple xmin']]} />
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Panel title="The rule, applied">
          <ol className="grid gap-1.5 text-sm">
            <li><Tag t={minOk ? 'ok' : 'dead'}>1</Tag> <b>Was the insert visible?</b> <span className="text-muted"><Md>{why(txmin, 'xmin')}</Md></span></li>
            <li><Tag t={txmax === 0 ? 'ok' : maxOk ? 'dead' : 'ok'}>2</Tag> <b>Was the delete visible?</b> <span className="text-muted"><Md>{txmax === 0 ? '`t_xmax = 0`: nobody deleted or updated this version.' : why(txmax, 'xmax')}</Md></span></li>
          </ol>
          <p className="mt-2 font-mono text-[11.5px] text-muted">visible = insert visible AND NOT delete visible</p>
        </Panel>
        <AnimatePresence mode="wait">
          <motion.div key={String(visible)} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            className="flex min-w-[150px] flex-col items-center justify-center rounded-lg border-2 p-4" style={{ borderColor: tone(visible ? 'ok' : 'dead'), background: toneBg(visible ? 'ok' : 'dead', 12) }}>
            <span className="text-[11px] tracking-wide text-muted uppercase">this snapshot</span>
            <span className="text-2xl font-bold" style={{ color: tone(visible ? 'ok' : 'dead') }}>{visible ? 'sees it' : 'skips it'}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="text-xs text-muted"><Md>{"The server adds one more rule: a transaction always sees its **own** earlier changes (by command id), even though `pg_visible_in_snapshot` reports its own xid as not visible. Hint bits (`HEAP_XMIN_COMMITTED`, …) only cache the `pg_xact` answer on the tuple."}</Md></p>
    </div>
  )
}

function SnapshotViz() {
  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <RcRrTimeline />
      <div className="grid min-w-0 gap-2 border-t border-line pt-4 [&>*]:min-w-0">
        <p className="text-sm font-semibold">Snapshot visibility calculator</p>
        <Calculator />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'snapshots-visibility',
  module: 'm5',
  order: 2,
  title: 'Snapshots and tuple visibility',
  tldr: [
    'A **snapshot** is three numbers, `xmin:xmax:xip`, that classify every xid as finished, in progress, or not yet started, and a row version is visible when its inserting xid counts and its deleting xid does not.',
    'Snapshots let readers and writers work on the same rows at once without blocking, because each reader just ignores the versions its snapshot cannot see.',
  ],
  visualizer: {
    title: 'Two sessions, one row, two isolation levels',
    caption: 'Step the timeline, then flip A to Repeatable Read and replay it. Below, edit a snapshot and click xids to see the visibility rule decide.',
    Component: SnapshotViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE item (id int PRIMARY KEY, name text, price numeric);
ALTER TABLE item SET (autovacuum_enabled = false);
INSERT INTO item VALUES (1, 'desk', 10), (2, 'chair', 25);
CREATE TABLE saved (label text PRIMARY KEY, snap pg_snapshot);`,
    presets: [
      { label: 'Your snapshot', sql: `SELECT pg_current_snapshot() AS snap,
       pg_snapshot_xmin(pg_current_snapshot()) AS xmin,
       pg_snapshot_xmax(pg_current_snapshot()) AS xmax,
       pg_current_xact_id_if_assigned() AS my_xid;`,
        note: 'With only one session, nothing is in progress: `xmin = xmax` and `xip` is empty. `my_xid` is NULL because this read-only statement never needed an xid.' },
      { label: 'UPDATE writes a new version', sql: `SELECT ctid, xmin, * FROM item;

UPDATE item SET price = price WHERE id = 1
RETURNING old.ctid AS old_version, new.ctid AS new_version,
          old.price AS old_price, new.price AS new_price;

SELECT ctid, xmin, * FROM item;`,
        note: '`SET price = price` changes nothing, yet a new version is written: `old` is the version at **(0,1)** that just received an `xmax`, `new` is the one at **(0,3)**. A SELECT without ORDER BY returns heap order, so the desk now comes back after the chair.' },
      { label: 'Own xid vs own snapshot', sql: `BEGIN;
UPDATE item SET price = 11 WHERE id = 1;
SELECT pg_current_xact_id() AS me, pg_current_snapshot() AS snap,
       pg_visible_in_snapshot(pg_current_xact_id(), pg_current_snapshot()) AS me_visible;
SELECT * FROM item WHERE id = 1;
COMMIT;`,
        note: 'The function says your own xid is **not** visible (it equals xmax), yet the SELECT shows price 11. Own changes are visible through a separate rule, by command id.' },
      { label: 'Save a snapshot, then write', sql: `INSERT INTO saved VALUES ('t0', pg_current_snapshot());
UPDATE item SET price = price + 1 WHERE id = 1;
INSERT INTO item VALUES (3, 'lamp', 30);
DELETE FROM item WHERE id = 2;
SELECT label, snap FROM saved;`,
        note: 'A `pg_snapshot` is an ordinary value: we stored the snapshot from before three later transactions. The next preset judges every version against it.' },
      { label: 'Time travel with the rule', sql: `WITH s AS (SELECT snap FROM saved WHERE label = 't0'),
v AS (
  SELECT lp, t_xmin::text::xid8 AS xmin8, NULLIF(t_xmax::text, '0')::xid8 AS xmax8,
         get_byte(t_attrs[1], 0) AS id
  FROM heap_page_item_attrs(get_raw_page('item', 0), 'item'::regclass)
  WHERE lp_flags = 1)
SELECT lp, id, xmin8 AS xmin, xmax8 AS xmax,
  pg_visible_in_snapshot(xmin8, s.snap) AND pg_xact_status(xmin8) = 'committed'
  AND NOT coalesce(pg_visible_in_snapshot(xmax8, s.snap)
                   AND pg_xact_status(xmax8) = 'committed', false) AS t0_sees,
  pg_visible_in_snapshot(xmin8, pg_current_snapshot()) AND pg_xact_status(xmin8) = 'committed'
  AND NOT coalesce(pg_visible_in_snapshot(xmax8, pg_current_snapshot())
                   AND pg_xact_status(xmax8) = 'committed', false) AS now_sees
FROM v, s ORDER BY lp;`,
        note: 'The visibility rule in SQL. The **t0** snapshot still sees the old desk price and the chair; **now** sees the new desk and the lamp. Every version is still on the page until VACUUM.' },
      { label: 'Hint bits', sql: `INSERT INTO item VALUES (4, 'rug', 40);
SELECT lp, (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('item', 0)) WHERE t_ctid = (SELECT ctid FROM item WHERE id = 4);
SELECT * FROM item WHERE id = 4;
SELECT lp, (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('item', 0)) WHERE t_ctid = (SELECT ctid FROM item WHERE id = 4);`,
        note: 'Right after the INSERT the tuple has no `HEAP_XMIN_COMMITTED`. The next reader looks up `pg_xact`, then caches the answer as a **hint bit** (and dirties the page).' },
      { label: 'Repeatable Read snapshot', sql: `BEGIN ISOLATION LEVEL REPEATABLE READ;
SHOW transaction_isolation;
SELECT pg_current_snapshot() AS first_stmt;
SELECT count(*) FROM item;
SELECT pg_current_snapshot() AS later_stmt;
COMMIT;`,
        note: 'The transaction snapshot is taken at the **first statement** and reused. With concurrent writers, `later_stmt` would still equal `first_stmt` under RR, but would move under Read Committed.' },
    ],
  },
  production: {
    title: 'One forgotten transaction bloats every table',
    context: 'A reporting tool opens a REPEATABLE READ transaction, runs a query, and then leaves the connection idle in transaction while a user looks at a dashboard for hours.',
    problem: 'That transaction\'s snapshot has an old **xmin**. Every row version deleted after it might still be visible to it, so VACUUM on every table in the database must keep them. Hot tables bloat, and index scans slow down as they wade through dead versions.',
    solution: 'Find the oldest snapshot holders by `backend_xmin`, end them, and put timeouts in place so it cannot recur.',
    sql: `SELECT pid, state, xact_start, age(backend_xmin) AS xmin_age, left(query, 60)
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY age(backend_xmin) DESC LIMIT 5;

ALTER ROLE reporting SET idle_in_transaction_session_timeout = '5min';`,
    outcome: 'VACUUM can again remove versions older than the next-oldest snapshot. `n_dead_tup` in `pg_stat_user_tables` falls on the next autovacuum pass, and a recurring offender is cut off after 5 minutes.',
  },
  pitfalls: [
    { title: 'Long snapshots block cleanup everywhere',
      symptom: 'VACUUM VERBOSE reports "dead row versions cannot be removed yet" and tables keep growing.',
      cause: 'Any open snapshot pins the xmin horizon for the whole database, including one held by a replication slot, by standby feedback, or by a driver connection with autocommit off that ran one SELECT and went idle.',
      fix: 'Monitor `age(backend_xmin)` in `pg_stat_activity` and `pg_replication_slots.xmin`; set `idle_in_transaction_session_timeout` and `transaction_timeout`.' },
    { title: 'Relying on the order rows come back in',
      symptom: 'A list that always came back in insertion order suddenly shows an edited row at the end, or a paginated API skips and repeats rows.',
      cause: 'Without ORDER BY, a sequential scan returns rows in **heap order**. Every UPDATE writes a new version wherever there is free space, so editing a row (or an `ON DELETE SET NULL` rewriting child rows) moves it. The old version stays behind until VACUUM.',
      fix: 'Always add `ORDER BY` with a unique tiebreaker when order matters. Never read meaning into `ctid`: it changes on every update and after VACUUM FULL.' },
    { title: 'TRUNCATE empties the table for old snapshots',
      symptom: 'A Repeatable Read export sees an empty table, although its snapshot was taken before the table was truncated and refilled.',
      cause: 'TRUNCATE is **not MVCC-safe**: it swaps in a new empty file instead of stamping `xmax` on each row. A transaction whose snapshot predates the TRUNCATE, but which had not yet touched that table, finds no old versions to read.',
      fix: 'Use DELETE when concurrent snapshot readers must see the old rows, or touch every table the export needs at its start, so the TRUNCATE waits for its ACCESS SHARE lock to go.' },
    { title: 'Read Committed reports that do not add up',
      symptom: 'A multi-query report shows totals that disagree with its own detail rows.',
      cause: 'Each statement in Read Committed takes a **new snapshot**, so later queries see commits that earlier ones did not.',
      fix: 'Run multi-statement reports as `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY`, so every query shares one snapshot.' },
    { title: 'Comparing xid values directly',
      symptom: 'A query using `xmin` to find "rows changed after transaction X" returns garbage after a while.',
      cause: '`xid` is 32-bit and compared modulo 2^32: it has no ordering operator and wraps around. `xid8` (from `pg_current_xact_id()`) does not wrap.',
      fix: 'Compare `xid8` values, or better use a `updated_at` column or logical decoding for change tracking.' },
  ],
  pointers: [
    'Snapshot `xmin:xmax:xip`: below xmin = finished, at or above xmax = not started, xip = in progress.',
    'A version is visible if its **xmin** committed before the snapshot and its **xmax** is 0, aborted, or not yet visible.',
    '**Read Committed**: one snapshot per statement. **Repeatable Read** and Serializable: one per transaction, taken at the first statement.',
    '**Hint bits** cache commit status on the tuple, so the first reader after a write may dirty the page.',
    'Use `pg_current_snapshot()`, `pg_visible_in_snapshot()` and `pg_xact_status()` with **xid8** values.',
  ],
  sources: ['mvcc-intro.html', 'transaction-iso.html', 'functions-info.html', 'transaction-id.html', 'storage-page-layout.html', 'routine-vacuuming.html'],
}
