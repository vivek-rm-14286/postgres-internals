import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { lsnNum, walFile } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the WAL as a byte tape. Every record (LSN, length, resource manager, description) was
 * captured with pg_walinspect from a real PostgreSQL 18 run of exactly the statements in the steps,
 * together with pg_current_wal_insert_lsn() / pg_current_wal_flush_lsn() after each statement.
 * ---------------------------------------------------------------------------------------------- */

interface Rec { lsn: string; end: string; xid: number; rm: 'Heap' | 'Btree' | 'Transaction'; type: string; len: number; desc: string; short: string }
const RECS: Rec[] = [
  { lsn: '0/1769C60', end: '0/1769CB0', xid: 755, rm: 'Heap', type: 'INSERT', len: 79, desc: 'off: 51, flags: 0x01', short: 'INS' },
  { lsn: '0/1769CB0', end: '0/1769CF0', xid: 755, rm: 'Btree', type: 'INSERT_LEAF', len: 64, desc: 'off: 51', short: 'LEAF' },
  { lsn: '0/1769CF0', end: '0/1769D18', xid: 755, rm: 'Transaction', type: 'COMMIT', len: 34, desc: 'commit timestamp', short: 'CMT' },
  { lsn: '0/1769D18', end: '0/1769D60', xid: 756, rm: 'Heap', type: 'HOT_UPDATE', len: 71, desc: 'old_xmax: 756, old_off: 51, new_off: 52', short: 'HOT' },
  { lsn: '0/1769D60', end: '0/1769D88', xid: 756, rm: 'Transaction', type: 'COMMIT', len: 34, desc: 'commit timestamp', short: 'CMT' },
  { lsn: '0/1769D88', end: '0/1769DC0', xid: 757, rm: 'Heap', type: 'DELETE', len: 54, desc: 'xmax: 757, off: 50, infobits: [KEYS_UPDATED]', short: 'DEL' },
  { lsn: '0/1769DC0', end: '0/1769DE8', xid: 757, rm: 'Transaction', type: 'COMMIT', len: 34, desc: 'commit timestamp', short: 'CMT' },
  { lsn: '0/1769DE8', end: '0/1769E30', xid: 758, rm: 'Heap', type: 'INSERT', len: 67, desc: 'off: 53, flags: 0x00', short: 'INS' },
  { lsn: '0/1769E30', end: '0/1769E70', xid: 758, rm: 'Btree', type: 'INSERT_LEAF', len: 64, desc: 'off: 52', short: 'LEAF' },
  { lsn: '0/1769E70', end: '0/1769E98', xid: 758, rm: 'Transaction', type: 'ABORT', len: 34, desc: 'abort timestamp', short: 'ABRT' },
  { lsn: '0/1769E98', end: '0/1769EE0', xid: 759, rm: 'Heap', type: 'INSERT', len: 71, desc: 'off: 54, flags: 0x00', short: 'INS' },
  { lsn: '0/1769EE0', end: '0/1769F20', xid: 759, rm: 'Btree', type: 'INSERT_LEAF', len: 64, desc: 'off: 53', short: 'LEAF' },
  { lsn: '0/1769F20', end: '0/1769F48', xid: 759, rm: 'Transaction', type: 'COMMIT', len: 34, desc: 'asynchronous commit', short: 'CMT' },
  { lsn: '0/1769F48', end: '0/1769F90', xid: 760, rm: 'Heap', type: 'INSERT', len: 71, desc: 'off: 55, flags: 0x00', short: 'INS' },
  { lsn: '0/1769F90', end: '0/1769FD0', xid: 760, rm: 'Btree', type: 'INSERT_LEAF', len: 64, desc: 'off: 54', short: 'LEAF' },
  { lsn: '0/1769FD0', end: '0/1769FF8', xid: 760, rm: 'Transaction', type: 'COMMIT', len: 34, desc: 'commit timestamp', short: 'CMT' },
]

interface S { upto: number; insert: string; flush: string; client: string }
const steps: Step<S>[] = [
  { title: 'The WAL is one long, append-only byte stream', body: 'Every position in it is an **LSN**. Here the stream is at `0/1769C60`, which lives in segment file `000000010000000000000001` at byte 7,773,280.',
    state: { upto: 0, insert: '0/1769C60', flush: '0/1769C60', client: 'idle' } },
  { title: "INSERT INTO accounts VALUES (51, 'alice', 500)", body: 'The backend appends records to the **WAL buffers** in shared memory: a `Heap INSERT` (79 B) for the row and a `Btree INSERT_LEAF` (64 B) for the primary key. Nothing is on disk yet.',
    state: { upto: 2, insert: '0/1769CF0', flush: '0/1769C60', client: 'waiting' } },
  { title: '… autocommit: COMMIT of xid 755', body: 'A 34-byte `COMMIT` record is appended, then **XLogFlush** writes and fsyncs the WAL up to its end. Only now does the client see COMMIT. The heap page itself is still just dirty in memory.',
    state: { upto: 3, insert: '0/1769D18', flush: '0/1769D18', client: 'COMMIT' } },
  { title: 'UPDATE accounts SET balance = balance - 50 WHERE id = 51', body: 'One `HOT_UPDATE` record (71 B) says "old version at offset 51, new at 52". No index record, because no indexed column changed.',
    state: { upto: 5, insert: '0/1769D88', flush: '0/1769D88', client: 'COMMIT' } },
  { title: 'DELETE FROM accounts WHERE id = 50', body: 'A delete logs only the new `xmax` and the offset: **54 bytes**. WAL describes changes, never whole rows twice.',
    state: { upto: 7, insert: '0/1769DE8', flush: '0/1769DE8', client: 'COMMIT' } },
  { title: "BEGIN; INSERT (52, 'bob'); ROLLBACK", body: 'Aborted work still writes WAL, plus an `ABORT` record. An abort does not wait for a flush, so the **flush pointer stays behind** the insert pointer.',
    state: { upto: 10, insert: '0/1769E98', flush: '0/1769DE8', client: 'ROLLBACK' } },
  { title: "SET synchronous_commit = off; INSERT (53, 'carol')", body: 'The client gets COMMIT **before** the flush: 352 bytes are acknowledged but not durable. A crash now loses carol, cleanly, as if she had aborted. On a full server the WAL writer flushes within 3 × `wal_writer_delay` (600 ms).',
    state: { upto: 13, insert: '0/1769F48', flush: '0/1769DE8', client: 'COMMIT (not yet durable)' } },
  { title: "INSERT (54, 'dave') with synchronous_commit = on", body: 'This commit flushes everything before it, carol included. **One fsync, several commits**: that is group commit in miniature.',
    state: { upto: 16, insert: '0/1769FF8', flush: '0/1769FF8', client: 'COMMIT' } },
]

const BASE = lsnNum('0/1769C60')
const SPAN = lsnNum('0/1769FF8') - BASE
const W = 840, X0 = 14, TW = W - 28
const xOf = (lsn: string) => X0 + ((lsnNum(lsn) - BASE) / SPAN) * TW
const recTone = (r: Rec): Tone => (r.rm === 'Heap' ? 'tuple' : r.rm === 'Btree' ? 'pointer' : r.type === 'ABORT' ? 'dead' : 'ok')

function Tape({ s, sel, onSel }: { s: S; sel: number; onSel: (i: number) => void }) {
  const ins = xOf(s.insert), fl = xOf(s.flush)
  return (
    <svg viewBox={`0 0 ${W} 190`} className="w-full min-w-[720px]" role="img" aria-label="WAL records laid out by LSN">
      <text x={X0} y={16} fontSize={11} fill="var(--muted)" fontFamily="var(--font-mono)">0/1769C60</text>
      <text x={W - 14} y={16} fontSize={11} textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">0/1769FF8 (+920 bytes)</text>
      <rect x={X0} y={40} width={TW} height={56} rx={6} fill="var(--c-free)" stroke="var(--border)" strokeDasharray="4 4" />
      {/* unflushed region */}
      <motion.rect initial={false} animate={{ x: fl, width: Math.max(0, ins - fl) }} y={34} height={68} rx={6}
        fill={toneBg('new', 12)} stroke={tone('new')} strokeDasharray="5 3" transition={{ type: 'spring', stiffness: 160, damping: 24 }} />
      {RECS.slice(0, s.upto).map((r, i) => {
        const x = xOf(r.lsn), w = xOf(r.end) - x - 2, t = recTone(r)
        return (
          <motion.g key={r.lsn} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.04 * (i % 3) }}
            onClick={() => onSel(i)} style={{ cursor: 'pointer' }}>
            <rect x={x + 1} y={44} width={w} height={48} rx={4} fill={toneBg(t, 26)} stroke={tone(t)} strokeWidth={sel === i ? 2.6 : 1} />
            <text x={x + 1 + w / 2} y={64} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{r.short}</text>
            <text x={x + 1 + w / 2} y={80} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{r.len}B</text>
          </motion.g>
        )
      })}
      {/* transaction brackets */}
      {[755, 756, 757, 758, 759, 760].map((x) => {
        const rs = RECS.slice(0, s.upto).filter((r) => r.xid === x)
        if (!rs.length) return null
        const a = xOf(rs[0].lsn) + 2, b = xOf(rs[rs.length - 1].end) - 2
        return (
          <motion.g key={x} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <path d={`M${a},104 L${a},110 L${b},110 L${b},104`} fill="none" stroke="var(--muted)" />
            <text x={(a + b) / 2} y={123} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">xid {x}</text>
          </motion.g>
        )
      })}
      {/* pointers */}
      <motion.g initial={false} animate={{ x: fl }} transition={{ type: 'spring', stiffness: 160, damping: 24 }}>
        <line x1={0} x2={0} y1={28} y2={150} stroke={tone('ok')} strokeWidth={2} />
        <text x={4} y={146} fontSize={10.5} fontWeight={600} fill={tone('ok')} fontFamily="var(--font-mono)">flush {s.flush}</text>
      </motion.g>
      <motion.g initial={false} animate={{ x: ins }} transition={{ type: 'spring', stiffness: 160, damping: 24 }}>
        <line x1={0} x2={0} y1={28} y2={176} stroke={tone('accent')} strokeWidth={2} strokeDasharray="3 2" />
        <text x={ins > W - 170 ? -4 : 4} y={172} textAnchor={ins > W - 170 ? 'end' : 'start'} fontSize={10.5} fontWeight={600} fill={tone('accent')} fontFamily="var(--font-mono)">insert {s.insert}</text>
      </motion.g>
    </svg>
  )
}

function Inspector({ r }: { r?: Rec }) {
  if (!r) return <Panel title="Record inspector"><p className="text-sm text-muted">Click a record on the tape.</p></Panel>
  const f = walFile(r.lsn)
  return (
    <Panel title={`${r.rm} / ${r.type}`}>
      <FieldTable rows={[
        ['start_lsn', r.lsn, 'byte position in the WAL stream'],
        ['end_lsn', r.end, `${lsnNum(r.end) - lsnNum(r.lsn)} bytes later (record + MAXALIGN padding)`],
        ['xid', String(r.xid), 'transaction that wrote it'],
        ['record_length', `${r.len} B`, 'header (24 B) + block refs + data'],
        ['description', r.desc],
        ['segment file', f.name, `timeline 1 · segment ${f.seg}`],
        ['file offset', f.offset.toLocaleString('en-US'), 'LSN mod 16 MB'],
      ]} />
    </Panel>
  )
}

type Level = 'off' | 'local' | 'remote_write' | 'on' | 'remote_apply'
const STATIONS = ['WAL buffers', 'primary disk', 'standby OS', 'standby disk', 'standby replayed']
const RELEASE: Record<Level, number> = { off: 0, local: 1, remote_write: 2, on: 3, remote_apply: 4 }
const SURVIVES: Record<Level, [boolean, boolean, boolean, boolean]> = {
  off: [false, false, false, false], local: [true, false, false, false], remote_write: [true, true, false, false],
  on: [true, true, true, false], remote_apply: [true, true, true, true],
}

function CommitLadder() {
  const [lvl, setLvl] = useState<Level>('on')
  const at = RELEASE[lvl]
  const sx = (i: number) => 60 + i * 180
  const sv = SURVIVES[lvl]
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted">synchronous_commit =</span>
        <Segmented label="synchronous_commit" value={lvl} onChange={setLvl}
          options={[['off', 'off'], ['local', 'local'], ['remote_write', 'remote_write'], ['on', 'on'], ['remote_apply', 'remote_apply']]} />
      </div>
      <svg viewBox="0 0 840 120" className="w-full min-w-[720px]" role="img" aria-label="Where COMMIT returns for each synchronous_commit level">
        <line x1={sx(0)} x2={sx(4)} y1={50} y2={50} stroke="var(--border)" strokeWidth={3} />
        <motion.line x1={sx(0)} y1={50} y2={50} initial={false} animate={{ x2: sx(at) }} stroke={tone('accent')} strokeWidth={3} />
        {STATIONS.map((n, i) => (
          <g key={n}>
            <circle cx={sx(i)} cy={50} r={13} fill={i <= at ? toneBg('accent', 30) : 'var(--surface)'} stroke={i <= at ? tone('accent') : 'var(--border)'} strokeWidth={2} />
            <text x={sx(i)} y={54} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{i + 1}</text>
            <text x={sx(i)} y={86} textAnchor="middle" fontSize={11} fill="var(--text)">{n}</text>
            {i >= 2 && <text x={sx(i)} y={102} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{['', '', 'write_lag', 'flush_lag', 'replay_lag'][i]}</text>}
          </g>
        ))}
        <motion.g initial={false} animate={{ x: sx(at) }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
          <rect x={-46} y={4} width={92} height={22} rx={11} fill={tone('ok')} />
          <text x={0} y={19} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--surface)">COMMIT returns</text>
        </motion.g>
      </svg>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {['survives primary crash', 'survives standby PG crash', 'survives standby OS crash', 'standby reads see it'].map((k, i) => (
          <div key={k} className="rounded-md border px-2 py-1.5" style={{ borderColor: tone(sv[i] ? 'ok' : 'dead'), background: toneBg(sv[i] ? 'ok' : 'dead', 10) }}>
            <span className="font-semibold" style={{ color: tone(sv[i] ? 'ok' : 'dead') }}>{sv[i] ? 'yes' : 'no'}</span> <span className="text-muted">{k}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted"><Md>{'With an empty `synchronous_standby_names` only **on** and **off** differ: `local`, `remote_write` and `remote_apply` all behave like `on`.'}</Md></p>
    </div>
  )
}

function WalViz() {
  const [sel, setSel] = useState<number | null>(null)
  return (
    <div className="grid gap-5">
      <Stepper steps={steps} interval={3000} render={(s) => {
        const focus = sel !== null && sel < s.upto ? sel : s.upto - 1
        return (
          <div className="grid gap-3">
            <Legend items={[['tuple', 'Heap record'], ['pointer', 'Btree record'], ['ok', 'COMMIT'], ['dead', 'ABORT'], ['new', 'in WAL buffers, not yet flushed']]} />
            <Tape s={s} sel={focus} onSel={setSel} />
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="rounded-md border border-line bg-surface-2 px-2 py-1">client sees: <b className="font-mono">{s.client}</b></span>
              <span className="rounded-md border border-line bg-surface-2 px-2 py-1">not yet durable: <b className="font-mono">{lsnNum(s.insert) - lsnNum(s.flush)} B</b></span>
            </div>
            <Inspector r={RECS[focus]} />
          </div>
        )
      }} />
      <div className="border-t border-line pt-4">
        <p className="mb-2 text-sm font-semibold">Where does COMMIT return?</p>
        <CommitLadder />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'wal-lsn',
  module: 'm7',
  order: 1,
  title: 'Write-ahead logging and LSNs',
  tldr: [
    'The **write-ahead log** is an append-only stream of change records, and every byte in it has an address called a **Log Sequence Number** (LSN).',
    'A change may reach a data file only after its WAL record is safely on disk, so a commit needs just one sequential WAL flush and a crash can always be repaired by replaying the log.',
  ],
  visualizer: {
    title: 'Watch statements turn into WAL records',
    caption: 'Step through eight statements and watch the insert and flush pointers move. Click any record to decode its LSN into a segment file and offset. Then pick a `synchronous_commit` level below.',
    Component: WalViz,
  },
  playground: {
    extensions: ['pg_walinspect'],
    setup: `
CREATE TABLE accounts (
  id int GENERATED BY DEFAULT AS IDENTITY (START WITH 51) PRIMARY KEY,
  owner text NOT NULL,
  balance int NOT NULL
) WITH (fillfactor = 90);
INSERT INTO accounts (id, owner, balance) SELECT g, 'user_' || g, 100 FROM generate_series(1, 50) g;
VACUUM accounts;`,
    presets: [
      { label: 'Where is the WAL now?', sql: `SELECT pg_current_wal_lsn()                                 AS lsn,
       pg_walfile_name(pg_current_wal_lsn())                AS segment_file,
       (pg_walfile_name_offset(pg_current_wal_lsn())).file_offset AS offset_in_file,
       pg_current_wal_lsn() - '0/0'                         AS bytes_since_initdb,
       current_setting('wal_level')                         AS wal_level,
       current_setting('wal_segment_size')                  AS segment_size;`,
        note: 'An LSN is a byte offset. The file name is timeline (8 hex digits) + segment number, and the offset is the LSN modulo 16 MB.' },
      { label: 'One INSERT, record by record', sql: `-- remember the insert position without writing any WAL
SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);

INSERT INTO accounts (owner, balance) VALUES ('alice', 500);

SELECT start_lsn, end_lsn, xid, resource_manager, record_type, record_length, description
FROM pg_get_wal_records_info(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn());`,
        note: '`Heap INSERT`, `Btree INSERT_LEAF` for the primary key and a 34-byte `Transaction COMMIT`. The first `Sequence LOG` appears because the identity sequence logs 32 values ahead. `end_lsn - start_lsn` is the length rounded up to 8 bytes.' },
      { label: 'ROLLBACK, UPDATE and DELETE', sql: `SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);

BEGIN;
INSERT INTO accounts (owner, balance) VALUES ('bob', 10);
ROLLBACK;
UPDATE accounts SET balance = balance - 50 WHERE id = 51;
DELETE FROM accounts WHERE id = 50;

SELECT start_lsn, xid, resource_manager, record_type, record_length, description
FROM pg_get_wal_records_info(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn());`,
        note: 'The rolled-back INSERT is still in the WAL, followed by an `ABORT` record. The UPDATE is a single `HOT_UPDATE` with no index record. DELETE is just 54 bytes.' },
      { label: 'LSN arithmetic', sql: `SELECT '0/1769D18'::pg_lsn - '0/1769C60'::pg_lsn     AS bytes_between,
       '0/1769C60'::pg_lsn + 16777216                     AS one_segment_later,
       pg_walfile_name('0/1769C60')                       AS file_a,
       pg_walfile_name('0/1769C60'::pg_lsn + 16777216)   AS file_b,
       '0/9'::pg_lsn < '0/10'::pg_lsn                     AS lsn_compare,
       '0/9' < '0/10'                                     AS text_compare;`,
        note: 'Subtracting LSNs gives bytes. Adding 16 MB moves exactly one segment file. Compare LSNs as `pg_lsn`, never as text: as text, `0/9` sorts after `0/10`.' },
      { label: 'Async commit: the loss window', sql: `SET synchronous_commit = off;
INSERT INTO accounts (owner, balance) VALUES ('carol', 70);
SELECT pg_current_wal_insert_lsn() AS inserted,
       pg_current_wal_flush_lsn()  AS flushed,
       pg_current_wal_insert_lsn() - pg_current_wal_flush_lsn() AS bytes_not_durable;

RESET synchronous_commit;
INSERT INTO accounts (owner, balance) VALUES ('dave', 80);
SELECT pg_current_wal_insert_lsn() - pg_current_wal_flush_lsn() AS bytes_not_durable_now;`,
        note: 'With `off`, COMMIT returns while its record is still only in WAL buffers. The next synchronous commit flushes everything. This single-process playground has no WAL writer, so the gap stays open until then; a server with a WAL writer closes it within about 600 ms.' },
      { label: 'WAL volume by resource manager', sql: `SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);

INSERT INTO accounts (owner, balance)
SELECT 'bulk_' || g, 1 FROM generate_series(1, 2000) g;

SELECT "resource_manager/record_type" AS rmgr, count, record_size, fpi_size, combined_size
FROM pg_get_wal_stats(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn(), true)
WHERE count > 0
ORDER BY combined_size DESC;`,
        note: 'About one Heap and one Btree record per row, a `Sequence LOG` every 32 ids, but a **single COMMIT** for the whole statement. The flush cost is paid once per transaction, not once per row.' },
      { label: 'Sequences log 32 values ahead', sql: `CREATE SEQUENCE order_no;
SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);

SELECT max(nextval('order_no')) AS handed_out FROM generate_series(1, 100);

SELECT count(*) AS sequence_records
FROM pg_get_wal_records_info(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn())
WHERE resource_manager = 'Sequence';
SELECT last_value, log_cnt FROM order_no;`,
        note: '100 `nextval` calls wrote only **4** `Sequence LOG` records (at 1, 33, 65 and 97). Each record reserves the next 32 values, and `log_cnt` counts how many are left. After a crash the sequence restarts after the last reserved value, so up to 32 numbers are skipped.' },
      { label: 'What skips the WAL: UNLOGGED and TEMP', sql: `CREATE TABLE t_logged (id int, v text);
CREATE UNLOGGED TABLE t_unlogged (id int, v text);
CREATE TEMP TABLE t_temp (id int, v text);

SELECT set_config('lab.a', pg_current_wal_insert_lsn()::text, false);
INSERT INTO t_logged SELECT g, md5(g::text) FROM generate_series(1, 1000) g;
SELECT set_config('lab.b', pg_current_wal_insert_lsn()::text, false);
INSERT INTO t_unlogged SELECT g, md5(g::text) FROM generate_series(1, 1000) g;
SELECT set_config('lab.c', pg_current_wal_insert_lsn()::text, false);
INSERT INTO t_temp SELECT g, md5(g::text) FROM generate_series(1, 1000) g;

SELECT current_setting('lab.b')::pg_lsn - current_setting('lab.a')::pg_lsn AS logged_bytes,
       current_setting('lab.c')::pg_lsn - current_setting('lab.b')::pg_lsn AS unlogged_bytes,
       pg_current_wal_insert_lsn() - current_setting('lab.c')::pg_lsn       AS temp_bytes;
SELECT relname, relpersistence FROM pg_class WHERE relname LIKE 't\\_%' ORDER BY 1;`,
        note: 'The same 1,000 rows cost about **96 kB** of WAL in a normal table and **40 bytes** (just the COMMIT record) in an unlogged or temp table. `relpersistence` is `p`, `u` or `t`. No WAL also means no crash safety and no replication.' },
    ],
  },
  production: {
    title: 'Ingesting telemetry without fsync-bound commits',
    context: 'An IoT platform writes one small row per device reading, each in its own transaction, from 40 application threads. Billing rows go through the same database.',
    problem: 'Write throughput flattened as threads were added. `pg_stat_io` showed WAL `fsyncs` climbing in step with commits: every reading waited for its own WAL flush, so the commit rate was bounded by flush latency, not CPU.',
    solution: 'Make durability a per-transaction choice. Telemetry transactions run `SET LOCAL synchronous_commit = off`, so COMMIT returns as soon as the record is in WAL buffers. Billing transactions keep the default `on`. Both share one WAL, so a billing commit also flushes any telemetry before it. Do not touch `fsync`.',
    sql: `-- telemetry writer
BEGIN;
SET LOCAL synchronous_commit = off;
INSERT INTO readings (device_id, ts, value) VALUES ($1, now(), $2);
COMMIT;

-- billing writer keeps the default
BEGIN;
INSERT INTO invoices (account_id, amount) VALUES ($1, $2);
COMMIT;  -- waits for the WAL flush`,
    outcome: 'Telemetry commits stop waiting on flushes, so throughput is limited by CPU and WAL insertion instead. The risk is bounded: after a crash at most about 3 × `wal_writer_delay` (600 ms by default) of telemetry is missing, and the database is never corrupted. Billing durability is unchanged.',
  },
  pitfalls: [
    { title: 'Turning off fsync to "speed up commits"',
      symptom: 'After a power cut the server will not start, or indexes and tables disagree. Data is corrupted, not merely missing.',
      cause: '`fsync = off` removes every write barrier, so data pages can hit disk before their WAL and WAL order is lost. Async commit only skips the wait; the WAL rule still holds.',
      fix: 'Leave `fsync = on`. Use `synchronous_commit = off` per transaction (or per role) where losing the last fraction of a second is acceptable.',
      sql: `ALTER ROLE telemetry_writer SET synchronous_commit = off;  -- safe
-- never in production: fsync = off` },
    { title: 'Comparing LSNs as text',
      symptom: 'A lag monitor reports that a replica is "ahead" of the primary, or alerts flap when the low half of the LSN gains a digit.',
      cause: 'LSNs are two hex numbers. As text, `0/9` sorts after `0/10` and `0/FFFFFFFF` after `1/0`.',
      fix: 'Cast to `pg_lsn` and subtract to get bytes, or use `pg_wal_lsn_diff()`.',
      sql: `SELECT pg_current_wal_lsn() - '0/1769C60'::pg_lsn AS bytes_since;` },
    { title: 'Expecting remote_apply without a synchronous standby',
      symptom: 'An application sets `synchronous_commit = remote_apply` for read-your-writes on a replica, yet reads on the replica still miss fresh rows.',
      cause: 'With `synchronous_standby_names` empty, `remote_write`, `remote_apply` and `local` all behave like `on`: the primary waits only for its own flush.',
      fix: 'Name the standby in `synchronous_standby_names` (it must be streaming), or route read-your-writes queries to the primary.' },
    { title: 'UNLOGGED tables for data you cannot rebuild',
      symptom: 'After a crash or a failover, a staging table is empty, and on the replicas it was never readable at all.',
      cause: 'An unlogged table writes no WAL for its rows. Crash recovery cannot replay it, so it is reset to empty, and streaming replicas never receive it.',
      fix: 'Use UNLOGGED only for data you can regenerate (caches, bulk-load staging). Make it durable with `ALTER TABLE … SET LOGGED`, which rewrites it through the WAL.',
      sql: `ALTER TABLE t_unlogged SET LOGGED;` },
    { title: 'Expecting gapless sequence numbers',
      symptom: 'Invoice numbers jump from 1041 to 1073 after a server restart, or skip a value after a failed insert.',
      cause: 'A sequence logs 32 values ahead, so recovery resumes after the last reserved value. `nextval` is also never rolled back.',
      fix: 'Treat sequence values as unique, not consecutive. If gapless numbering is a legal requirement, keep a counter row updated inside the same transaction and accept that it serializes writers.' },
  ],
  pointers: [
    '**WAL rule**: the WAL record must be flushed before the data page it describes may be written.',
    'An **LSN** is a byte position; `lsn_a - lsn_b` is bytes; segment files are **16 MB**, named timeline + segment number.',
    'COMMIT costs **one sequential flush**, and concurrent commits share it (**group commit**).',
    '`synchronous_commit` is **per transaction**: `off` risks losing recent commits after a crash, never corruption.',
    'Inspect real records with **`pg_walinspect`**: `pg_get_wal_records_info` and `pg_get_wal_stats`.',
  ],
  sources: ['wal-intro.html', 'wal-internals.html', 'wal-async-commit.html', 'wal-configuration.html', 'runtime-config-wal.html', 'pgwalinspect.html', 'datatype-pg-lsn.html', 'functions-admin.html'],
}
