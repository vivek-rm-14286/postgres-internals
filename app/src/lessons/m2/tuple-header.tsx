import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: t_infomask / t_infomask2 bit inspector. Every number below (xids, infomask values,
 * ctids, t_bits) was captured from PostgreSQL 18 with pageinspect after each statement:
 *   CREATE TABLE acct (id int PRIMARY KEY, owner text, balance int, note text);
 * Bit values come from src/include/access/htup_details.h.
 * ---------------------------------------------------------------------------------------------- */

interface Bit { bit: number; name: string; short: string; t: Tone; what: string }
const IM: Bit[] = [
  { bit: 0x0001, name: 'HEAP_HASNULL', short: 'HASNULL', t: 'tuple', what: 'The row has at least one NULL, so a **null bitmap** follows the fixed header.' },
  { bit: 0x0002, name: 'HEAP_HASVARWIDTH', short: 'VARWIDTH', t: 'tuple', what: 'The row has variable-width columns (here `owner` and `note`), so attribute offsets cannot be precomputed.' },
  { bit: 0x0004, name: 'HEAP_HASEXTERNAL', short: 'EXTERNAL', t: 'tuple', what: 'At least one value is a TOAST pointer to out-of-line storage.' },
  { bit: 0x0008, name: 'HEAP_HASOID_OLD', short: 'OID_OLD', t: 'muted', what: 'Legacy: rows with an OID column. Not used by tables created since PostgreSQL 12.' },
  { bit: 0x0010, name: 'HEAP_XMAX_KEYSHR_LOCK', short: 'KEYSHR', t: 'header', what: '`t_xmax` holds a FOR KEY SHARE lock. Together with EXCL_LOCK it means FOR SHARE.' },
  { bit: 0x0020, name: 'HEAP_COMBOCID', short: 'COMBOCID', t: 'muted', what: '`t_cid` is a combo command id: the row was inserted and deleted by the same transaction.' },
  { bit: 0x0040, name: 'HEAP_XMAX_EXCL_LOCK', short: 'EXCL', t: 'header', what: '`t_xmax` holds an exclusive row lock (FOR UPDATE / FOR NO KEY UPDATE).' },
  { bit: 0x0080, name: 'HEAP_XMAX_LOCK_ONLY', short: 'LOCK_ONLY', t: 'header', what: '`t_xmax` is **only a locker**, not a deleter. The row version is still live.' },
  { bit: 0x0100, name: 'HEAP_XMIN_COMMITTED', short: 'XMIN_C', t: 'ok', what: '**Hint bit**: the inserting xid is known committed, so readers skip the commit-log lookup.' },
  { bit: 0x0200, name: 'HEAP_XMIN_INVALID', short: 'XMIN_I', t: 'dead', what: '**Hint bit**: the inserting xid aborted, so this version is invisible to everyone. Set together with XMIN_COMMITTED it means **frozen**.' },
  { bit: 0x0400, name: 'HEAP_XMAX_COMMITTED', short: 'XMAX_C', t: 'dead', what: '**Hint bit**: the deleting or updating xid committed.' },
  { bit: 0x0800, name: 'HEAP_XMAX_INVALID', short: 'XMAX_I', t: 'ok', what: '**Hint bit**: `t_xmax` is invalid or aborted. The version has not been deleted.' },
  { bit: 0x1000, name: 'HEAP_XMAX_IS_MULTI', short: 'MULTI', t: 'header', what: '`t_xmax` is a MultiXactId: several transactions lock the row (for example two FOR SHARE lockers).' },
  { bit: 0x2000, name: 'HEAP_UPDATED', short: 'UPDATED', t: 'new', what: 'This version was created by an UPDATE, not an INSERT.' },
  { bit: 0x4000, name: 'HEAP_MOVED_OFF', short: 'MOVED_OFF', t: 'muted', what: 'Legacy, from pre-9.0 VACUUM FULL.' },
  { bit: 0x8000, name: 'HEAP_MOVED_IN', short: 'MOVED_IN', t: 'muted', what: 'Legacy, from pre-9.0 VACUUM FULL.' },
]
const IM2: Bit[] = [
  { bit: 0x2000, name: 'HEAP_KEYS_UPDATED', short: 'KEYS_UPD', t: 'dead', what: 'The row was deleted, or updated in a key column, or locked FOR UPDATE. Blocks FOR KEY SHARE lockers (foreign-key checks).' },
  { bit: 0x4000, name: 'HEAP_HOT_UPDATED', short: 'HOT_UPD', t: 'new', what: 'This version was **HOT-updated**: the newer version is on the same page and has no new index entries.' },
  { bit: 0x8000, name: 'HEAP_ONLY_TUPLE', short: 'HEAP_ONLY', t: 'new', what: '**Heap-only tuple**: no index points at it. It is reached through the HOT chain from the root line pointer.' },
]

interface Tup { lp: number; unused?: boolean; xmin?: number; xmax?: number; ctid?: string; im?: number; im2?: number; bits?: string; row?: string; len?: number }
interface S { sql: string; tuples: Tup[]; focus: number }

const A = "(1,'alice',100,NULL)", A2 = "(1,'alice',120,NULL)", B = "(2,'bob',50,'vip')", C = "(3,'carol',75,'new')"
const t1 = (im: number, extra: Partial<Tup> = {}): Tup => ({ lp: 1, xmin: 754, xmax: 0, ctid: '(0,1)', im, im2: 4, bits: '11100000', row: A, len: 40, ...extra })
const t2 = (im: number): Tup => ({ lp: 2, xmin: 755, xmax: 0, ctid: '(0,2)', im, im2: 4, row: B, len: 40 })
const t3 = (im: number, im2: number, xmax = 0): Tup => ({ lp: 3, xmin: 756, xmax, ctid: '(0,3)', im, im2, bits: '11100000', row: A2, len: 40 })

const steps: Step<S>[] = [
  { title: "INSERT (1,'alice',100,NULL) — xid 754", body: 'The new version gets `t_xmin` = 754 and `t_xmax` = 0. `XMAX_INVALID` says "not deleted". `note` is NULL, so `HASNULL` is set and a **null bitmap** `11100000` follows the header.',
    state: { sql: "INSERT INTO acct VALUES (1, 'alice', 100, NULL);", focus: 1, tuples: [t1(2051)] } },
  { title: 'SELECT — the reader sets a hint bit', body: 'The first reader checks the commit log, sees 754 committed and caches that as `XMIN_COMMITTED`. A plain SELECT has just dirtied the page.',
    state: { sql: 'SELECT * FROM acct;', focus: 1, tuples: [t1(2307)] } },
  { title: "INSERT (2,'bob',…) then ROLLBACK — xid 755", body: 'An aborted insert still leaves its bytes on the page. Nothing in the header says "aborted" yet: the infomask looks like any fresh insert.',
    state: { sql: "BEGIN; INSERT INTO acct VALUES (2, 'bob', 50, 'vip'); ROLLBACK;", focus: 2, tuples: [t1(2307), t2(2050)] } },
  { title: 'SELECT — XMIN_INVALID', body: 'The next reader finds 755 aborted and sets `XMIN_INVALID`. From now on everyone skips this version without asking the commit log. VACUUM will reclaim it.',
    state: { sql: 'SELECT * FROM acct;', focus: 2, tuples: [t1(2307), t2(2562)] } },
  { title: 'UPDATE … SET balance = 120 — xid 756', body: 'The old version gets `t_xmax` = 756, `t_ctid` → (0,3) and `HOT_UPDATED`; `XMAX_INVALID` is cleared. The new version at lp 3 is flagged `UPDATED` and `HEAP_ONLY_TUPLE`.',
    state: { sql: 'UPDATE acct SET balance = 120 WHERE id = 1;', focus: 3, tuples: [t1(259, { xmax: 756, ctid: '(0,3)', im2: 16388 }), t2(2562), t3(10243, 32772)] } },
  { title: 'SELECT — more hint bits', body: 'The reader learns 756 committed: the old version gets `XMAX_COMMITTED` (dead to new snapshots), the new one gets `XMIN_COMMITTED`.',
    state: { sql: 'SELECT * FROM acct;', focus: 1, tuples: [t1(1283, { xmax: 756, ctid: '(0,3)', im2: 16388 }), t2(2562), t3(10499, 32772)] } },
  { title: 'SELECT … FOR SHARE — xid 757', body: 'Row locks are stored **in the tuple**, not in a lock table: `t_xmax` = 757 with `LOCK_ONLY` and `KEYSHR` + `EXCL` (= share lock). The row is still live.',
    state: { sql: 'BEGIN; SELECT * FROM acct WHERE id = 1 FOR SHARE; COMMIT;', focus: 3, tuples: [t1(1283, { xmax: 756, ctid: '(0,3)', im2: 16388 }), t2(2562), t3(8659, 32772, 757)] } },
  { title: 'SELECT … FOR UPDATE — xid 758', body: 'An exclusive lock: `EXCL` + `LOCK_ONLY`, and `KEYS_UPDATED` in infomask2 because FOR UPDATE also conflicts with foreign-key (FOR KEY SHARE) lockers.',
    state: { sql: 'BEGIN; SELECT * FROM acct WHERE id = 1 FOR UPDATE; COMMIT;', focus: 3, tuples: [t1(1283, { xmax: 756, ctid: '(0,3)', im2: 16388 }), t2(2562), t3(8643, 40964, 758)] } },
  { title: 'DELETE WHERE id = 1 — xid 759', body: 'A real delete: `t_xmax` = 759 with **no lock bits**. The bytes stay put; the version becomes invisible to snapshots taken after 759 commits.',
    state: { sql: 'DELETE FROM acct WHERE id = 1;', focus: 3, tuples: [t1(1283, { xmax: 756, ctid: '(0,3)', im2: 16388 }), t2(2562), t3(8451, 40964, 759)] } },
  { title: "INSERT (3,'carol',75,'new') — xid 760", body: 'No NULLs this time: no `HASNULL`, no bitmap, `t_hoff` still 24. Its 44-byte length comes from the longer text values.',
    state: { sql: "INSERT INTO acct VALUES (3, 'carol', 75, 'new');", focus: 4, tuples: [t1(1283, { xmax: 756, ctid: '(0,3)', im2: 16388 }), t2(2562), t3(8451, 40964, 759), { lp: 4, xmin: 760, xmax: 0, ctid: '(0,4)', im: 2050, im2: 4, row: C, len: 44 }] } },
  { title: 'VACUUM FREEZE', body: 'Dead versions are removed (lp 1–3 become unused). The survivor is **frozen**: `XMIN_COMMITTED` + `XMIN_INVALID` together = `HEAP_XMIN_FROZEN`, visible to everyone forever, immune to xid wraparound.',
    state: { sql: 'VACUUM FREEZE acct;', focus: 4, tuples: [{ lp: 1, unused: true }, { lp: 2, unused: true }, { lp: 3, unused: true }, { lp: 4, xmin: 760, xmax: 0, ctid: '(0,4)', im: 2818, im2: 4, row: C, len: 44 }] } },
]

function status(t: Tup): { label: string; tone: Tone } {
  if (t.unused) return { label: 'LP_UNUSED', tone: 'muted' }
  const im = t.im!
  if (im & 0x0200 && im & 0x0100) return { label: 'frozen', tone: 'ok' }
  if (im & 0x0200) return { label: 'aborted', tone: 'dead' }
  if (t.xmax && !(im & 0x0080)) return { label: im & 0x0400 ? 'dead (xmax committed)' : t.ctid !== `(0,${t.lp})` ? 'updated (xmax set)' : 'deleted (xmax set)', tone: 'dead' }
  if (t.xmax) return { label: 'live, locked', tone: 'header' }
  return { label: 'live', tone: 'tuple' }
}

function BitRow({ bits, value, prev, onPick, picked, natts }: { bits: Bit[]; value: number; prev?: number; onPick: (b: Bit) => void; picked?: string; natts?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {[...bits].reverse().map((b) => {
        const on = (value & b.bit) !== 0
        const changed = prev !== undefined && ((prev ^ value) & b.bit) !== 0
        return (
          <motion.button key={b.name} type="button" onClick={() => onPick(b)} title={`${b.name} 0x${b.bit.toString(16).padStart(4, '0')}`}
            animate={{ scale: changed ? [1, 1.12, 1] : 1 }} transition={{ duration: 0.45 }}
            className="min-w-[64px] rounded-md border px-1 py-1 text-center font-mono text-[10px] leading-tight"
            style={{ borderColor: picked === b.name ? 'var(--accent)' : on ? tone(b.t) : 'var(--border)', borderWidth: picked === b.name || changed ? 2 : 1,
              background: on ? toneBg(b.t, 26) : 'transparent', color: on ? 'var(--text)' : 'var(--muted)', opacity: on ? 1 : 0.7 }}>
            <span className="block font-semibold">{on ? 1 : 0}</span>{b.short}
          </motion.button>
        )
      })}
      {natts && (
        <div className="min-w-[96px] rounded-md border border-line px-1 py-1 text-center font-mono text-[10px] leading-tight text-muted">
          <span className="block font-semibold" style={{ color: 'var(--text)' }}>{value & 0x7ff}</span>natts (11 bits)
        </div>
      )}
    </div>
  )
}

function HeaderStrip({ t }: { t: Tup }) {
  const f: [string, number, string][] = [['t_xmin', 4, String(t.xmin)], ['t_xmax', 4, String(t.xmax)], ['t_cid', 4, '0'], ['t_ctid', 6, t.ctid!], ['mask2', 2, String(t.im2)], ['mask', 2, String(t.im)], ['hoff', 1, '24']]
  const bitmap = t.bits ? 1 : 0
  const total = 24
  let x = 0
  const W = 640, u = (W - 8) / total
  return (
    <svg viewBox={`0 0 ${W} 58`} className="w-full min-w-[560px]" role="img" aria-label="Tuple header bytes">
      {f.map(([n, b, v]) => {
        const x0 = 4 + x * u; x += b
        return (
          <g key={n}>
            <rect x={x0} y={4} width={b * u - 2} height={38} rx={4} fill={toneBg('header', 16)} stroke={tone('header')} />
            <text x={x0 + 4} y={18} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{n}</text>
            <text x={x0 + 4} y={35} fontSize={11.5} fontWeight={600} fill="var(--text)" fontFamily="var(--font-mono)">{v}</text>
          </g>
        )
      })}
      <rect x={4 + 23 * u} y={4} width={u - 2} height={38} rx={4} fill={bitmap ? toneBg('tuple', 30) : 'transparent'} stroke={bitmap ? tone('tuple') : 'var(--border)'} strokeDasharray={bitmap ? undefined : '3 3'} />
      <text x={4 + 3 * u} y={54} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-sans)">23-byte fixed header</text>
      <text x={W - 4} y={54} textAnchor="end" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-sans)">{bitmap ? `byte 23: null bitmap ${t.bits}` : 'byte 23: padding'} · data at t_hoff = 24</text>
    </svg>
  )
}

function TupleHeaderViz() {
  const [pick, setPick] = useState<Bit>(IM[8])
  const [sel, setSel] = useState<number | null>(null)
  return (
    <Stepper steps={steps} interval={3600} render={(s, i) => {
      const lp = sel && s.tuples.find((t) => t.lp === sel && !t.unused) ? sel : s.focus
      const t = s.tuples.find((x) => x.lp === lp)!
      const prevT = i > 0 ? steps[i - 1].state.tuples.find((x) => x.lp === lp && !x.unused) : undefined
      return (
        <div className="grid gap-3">
          <p className="font-mono text-[12px] text-muted">{s.sql}</p>
          <div className="flex flex-wrap gap-2">
            {s.tuples.map((x) => {
              const st = status(x)
              return (
                <motion.button key={x.lp} type="button" layout onClick={() => setSel(x.lp)} disabled={x.unused}
                  className="rounded-md border px-2 py-1 text-left font-mono text-[11px]"
                  style={{ borderColor: x.lp === lp ? 'var(--accent)' : tone(st.tone), borderWidth: x.lp === lp ? 2 : 1, background: toneBg(st.tone, 12) }}>
                  <span className="font-semibold">lp {x.lp}</span> <span className="text-muted">{st.label}</span>
                  {!x.unused && <span className="block">xmin {x.xmin} · xmax {x.xmax || 0} · ctid {x.ctid}</span>}
                  {!x.unused && <span className="block text-muted">{x.row}</span>}
                </motion.button>
              )
            })}
          </div>
          <div className="overflow-x-auto scrollbar-thin"><HeaderStrip t={t} /></div>
          <Panel title={`lp ${t.lp} · t_infomask = ${t.im} (0x${t.im!.toString(16).padStart(4, '0')})`}>
            <BitRow bits={IM} value={t.im!} prev={prevT?.im} onPick={setPick} picked={pick.name} />
          </Panel>
          <Panel title={`t_infomask2 = ${t.im2} (0x${t.im2!.toString(16).padStart(4, '0')})`}>
            <BitRow bits={IM2} value={t.im2!} prev={prevT?.im2} onPick={setPick} picked={pick.name} natts />
          </Panel>
          <Panel title={`${pick.name} · 0x${pick.bit.toString(16).padStart(4, '0')}`}>
            <p className="text-sm text-muted"><Md>{pick.what}</Md></p>
            <div className="mt-2 flex flex-wrap gap-1">{[...IM, ...IM2].filter((b) => (IM.includes(b) ? t.im! : t.im2!) & b.bit).map((b) => <Tag key={b.name} t={b.t}>{b.name}</Tag>)}</div>
          </Panel>
          <Legend items={[['ok', 'committed / not deleted hints'], ['dead', 'aborted / deleted'], ['header', 'row-lock bits'], ['new', 'update & HOT bits'], ['tuple', 'layout bits']]} />
        </div>
      )
    }} />
  )
}

export const lesson: Lesson = {
  slug: 'tuple-header',
  module: 'm2',
  order: 6,
  title: 'The heap tuple header: xmin, xmax, ctid, infomask',
  tldr: [
    'Every row version starts with a **23-byte header**: who created it (`t_xmin`), who deleted or locked it (`t_xmax`), where its newer version lives (`t_ctid`), and two flag words, `t_infomask` and `t_infomask2`.',
    'MVCC visibility, row locks, HOT chains and freezing are all decided from these few bytes, and readers cache commit status in them as **hint bits** so later readers can skip the commit log.',
  ],
  visualizer: {
    title: 'Flip the infomask bits, one statement at a time',
    caption: 'Step through eleven statements. Bits that change in a step pulse; click any bit for its meaning, or any tuple to inspect it. The values are what `heap_page_items` reports after each statement.',
    Component: TupleHeaderViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE acct (id int PRIMARY KEY, owner text, balance int, note text);
ALTER TABLE acct SET (autovacuum_enabled = false);
INSERT INTO acct VALUES (1, 'alice', 100, NULL);
CREATE VIEW hdr AS
SELECT lp, t_xmin, t_xmax, t_ctid, t_infomask, t_infomask2, t_hoff, t_bits,
       (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags AS flags
FROM heap_page_items(get_raw_page('acct', 0));`,
    presets: [
      { label: 'Fresh insert', sql: `SELECT * FROM hdr;`,
        note: '`HEAP_XMAX_INVALID` (not deleted) and `HEAP_HASNULL` with `t_bits = 11100000`: the 4th column is NULL. The view itself was created after the insert, so no reader has hinted the row yet.' },
      { label: 'Read → hint bit', sql: `SELECT * FROM acct;
SELECT lp, t_infomask, flags FROM hdr;`,
        note: 'After one SELECT, `HEAP_XMIN_COMMITTED` appears. Reading wrote to the page.' },
      { label: 'Aborted insert', sql: `BEGIN;
INSERT INTO acct VALUES (2, 'bob', 50, 'vip');
ROLLBACK;
SELECT * FROM acct;
SELECT lp, t_xmin, t_infomask, flags FROM hdr;`,
        note: 'lp 2 is still physically on the page. The SELECT stamped it `HEAP_XMIN_INVALID`, so nobody will check its xid again.' },
      { label: 'HOT update', sql: `UPDATE acct SET balance = 120 WHERE id = 1;
SELECT lp, t_xmin, t_xmax, t_ctid, flags FROM hdr;`,
        note: 'The old version points at the new one through `t_ctid` and carries `HEAP_HOT_UPDATED`. The new version is a `HEAP_ONLY_TUPLE`.' },
      { label: 'Row locks live in xmax', sql: `BEGIN;
SELECT * FROM acct WHERE id = 1 FOR UPDATE;
SELECT lp, t_xmax, flags FROM hdr WHERE t_xmax <> 0;
COMMIT;`,
        note: 'Inside the transaction, the live version has `t_xmax` = your xid plus `HEAP_XMAX_LOCK_ONLY` and `HEAP_XMAX_EXCL_LOCK`: a lock, not a delete.' },
      { label: 'Null bitmap & t_hoff', sql: `CREATE TABLE nb (a int, b text);
INSERT INTO nb VALUES (1, NULL), (1, ''), (1, 'x');
SELECT lp, lp_len, t_hoff, t_bits FROM heap_page_items(get_raw_page('nb', 0));

CREATE TABLE wide (c1 int, c2 int, c3 int, c4 int, c5 int, c6 int, c7 int, c8 int, c9 int);
INSERT INTO wide VALUES (1, NULL, 3, 4, 5, 6, 7, 8, 9), (1, 2, 3, 4, 5, 6, 7, 8, 9);
SELECT lp, t_hoff, t_bits, lp_len FROM heap_page_items(get_raw_page('wide', 0));`,
        note: 'A NULL costs **one bit** and no data bytes (28 B), while an empty string costs its 1-byte varlena header (29 B): NULL and `\'\'` are different on disk too. With 9 columns and a NULL, the bitmap needs 2 bytes: 23 + 2 = 25, MAXALIGNed to **t_hoff = 32**.' },
      { label: 'No-op updates & upserts', sql: `SELECT ctid, xmin FROM acct WHERE id = 1;
UPDATE acct SET balance = balance WHERE id = 1;
SELECT ctid, xmin FROM acct WHERE id = 1;

INSERT INTO acct VALUES (1, 'alice', 130, NULL), (3, 'carol', 75, NULL)
ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance
RETURNING id, old.balance AS old_balance, new.balance AS new_balance,
          old IS NULL AS inserted, xmax = 0 AS xmax_is_zero, ctid;`,
        note: 'An UPDATE that changes nothing still writes a **new version** with a new ctid and xmin. In the upsert, PostgreSQL 18 `RETURNING old/new` says which rows were inserted (`old` is NULL). The older `xmax = 0` trick agrees here because the updated version carries the conflict lock in its xmax, but that is an implementation detail.' },
      { label: 'Freeze', sql: `VACUUM FREEZE acct;
SELECT lp, t_xmin, t_infomask,
       (heap_tuple_infomask_flags(t_infomask, t_infomask2)).combined_flags AS combined, flags
FROM hdr;`,
        note: 'Dead versions are gone. The survivors (alice and carol) show `HEAP_XMIN_FROZEN` in `combined_flags`: XMIN_COMMITTED and XMIN_INVALID set together.' },
    ],
  },
  production: {
    title: 'A full-table read that writes gigabytes',
    context: 'A data team bulk-loads 50 M rows into a reporting table every night with `COPY`, then runs a first `SELECT count(*)` report against it.',
    problem: 'The first read after the load ran far longer than later identical reads, generated heavy write I/O and WAL on a server with checksums enabled, and the replica lagged behind. Nobody expected a SELECT to write.',
    solution: 'Every freshly loaded tuple has no hint bits, so the first reader of each row checks the commit log and sets `HEAP_XMIN_COMMITTED`, dirtying every page (and with checksums or `wal_log_hints`, logging full-page images). Run `VACUUM (FREEZE, ANALYZE)` straight after the load: it sets hints, freezes rows, fills the visibility map and gathers statistics in one controlled pass, before users arrive.',
    sql: `COPY report FROM '/data/report.csv' WITH (FORMAT csv);
VACUUM (FREEZE, ANALYZE) report;
-- or load and freeze in one step, when the table is created or truncated in the same transaction:
BEGIN;
TRUNCATE report;
COPY report FROM '/data/report.csv' WITH (FORMAT csv, FREEZE);
COMMIT;`,
    outcome: 'The playground shows the mechanism directly: one SELECT changes `t_infomask` from 2051 to 2307. Moving that write to a planned VACUUM makes first-read latency match later reads, and `COPY … FREEZE` skips the extra rewrite entirely.',
  },
  pitfalls: [
    { title: 'Assuming an UPDATE that changes nothing is free',
      symptom: 'A sync job runs `UPDATE t SET col = $1` on every row each night; values rarely change, yet the table bloats, WAL grows and autovacuum runs constantly.',
      cause: 'PostgreSQL does not compare old and new values. Every matched row gets a new version, a new ctid and a dead predecessor, and the `UPDATE n` count includes the unchanged rows.',
      fix: 'Filter out no-op rows: `UPDATE t SET col = $1 WHERE col IS DISTINCT FROM $1`. For row-by-row writes from applications, the built-in `suppress_redundant_updates_trigger()` can skip them.',
      sql: `UPDATE acct SET balance = 120
WHERE id = 1 AND balance IS DISTINCT FROM 120;` },
    { title: 'Reading t_xmax as "deleted"',
      symptom: 'A monitoring query counts rows with `xmax <> 0` as deleted and reports thousands of phantom deletes.',
      cause: '`t_xmax` is also used for **row locks** (`SELECT … FOR UPDATE / SHARE`, foreign-key checks), marked by `HEAP_XMAX_LOCK_ONLY`. Aborted deleters also leave their xid there.',
      fix: 'Never infer liveness from raw xmax. Decode the flags with `heap_tuple_infomask_flags`, or rely on MVCC and count live rows with `count(*)`. For the same reason, prefer `RETURNING old IS NULL` (PostgreSQL 18) or `merge_action()` over the `xmax = 0` trick for telling inserts from updates in an upsert.',
      sql: `SELECT lp, t_xmax, (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('acct', 0));` },
    { title: 'Many NULLable columns pushing t_hoff up',
      symptom: 'Wide tables with many optional columns take more space per row than the data suggests.',
      cause: 'A row with any NULL carries a bitmap of one bit per column. Past 8 columns it no longer fits in the padding byte, and `t_hoff` jumps from 24 to 32 (then 40 past 72 columns).',
      fix: 'Keep very wide sparse attributes in a `jsonb` column or a side table, and keep frequently NULL columns out of hot narrow tables.' },
    { title: 'Assuming row locks are cheap to hold',
      symptom: 'A job that locks millions of rows with `SELECT … FOR UPDATE` causes huge WAL volume and, with many shared lockers, `pg_multixact` growth.',
      cause: 'Row locks are written into each tuple header (`t_xmax`), so locking a row modifies its page. Multiple share-lockers need a **MultiXact** (`HEAP_XMAX_IS_MULTI`).',
      fix: 'Lock only the rows you need, in small batches, and prefer `FOR NO KEY UPDATE` when you do not change keys so foreign-key checks are not blocked.' },
  ],
  pointers: [
    'Header = `t_xmin` 4 + `t_xmax` 4 + `t_cid` 4 + `t_ctid` 6 + `t_infomask2` 2 + `t_infomask` 2 + `t_hoff` 1 = **23 bytes**, data at `t_hoff` (24 without a long null bitmap).',
    '**Hint bits** `XMIN_COMMITTED`, `XMIN_INVALID`, `XMAX_COMMITTED`, `XMAX_INVALID` cache commit-log answers; readers set them, so a SELECT can write.',
    '`t_xmax` means "deleted" only without `XMAX_LOCK_ONLY`; row locks live in the tuple itself.',
    '`t_infomask2` = attribute count (11 bits) + `HOT_UPDATED`, `HEAP_ONLY_TUPLE`, `KEYS_UPDATED`.',
    '**Frozen** = `XMIN_COMMITTED | XMIN_INVALID`: visible to all, safe from xid wraparound.',
  ],
  sources: ['storage-page-layout.html', 'pageinspect.html', 'storage-hot.html', 'explicit-locking.html', 'routine-vacuuming.html', 'sql-copy.html'],
}
