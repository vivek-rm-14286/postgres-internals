import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { TupleVersions, type TVersion } from './_timeline'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one transfer transaction with a savepoint, step by step. Every xid, vxid, ctid, cmin
 * and lock below was captured from a PostgreSQL 18.6 (PGlite) run of exactly these statements.
 * ---------------------------------------------------------------------------------------------- */

type ClogSt = 'in progress' | 'committed' | 'aborted' | 'orphaned'
interface AcidState {
  sql: string
  vxid: string | null
  xid: string | null
  subxid: string | null
  cid: string
  clog: [string, ClogSt][]
  locks: [string, string, string, boolean][] // locktype, object, mode, fastpath
  versions: TVersion[]
}

const clogBits: Record<ClogSt, string> = { 'in progress': '00', committed: '01', aborted: '10', orphaned: '00' }
const clogTone: Record<ClogSt, Tone> = { 'in progress': 'new', committed: 'ok', aborted: 'dead', orphaned: 'dead' }

const A1: TVersion = { id: 'a1', ctid: '(0,1)', label: "alice 100", xmin: '754', xmax: '0', status: 'live' }
const B1: TVersion = { id: 'b1', ctid: '(0,2)', label: "bob 50", xmin: '754', xmax: '0', status: 'live' }
const V = 'virtualxid', X = 'transactionid', R = 'relation'

const base: Step<AcidState>[] = [
  { title: 'Two committed rows', body: 'Both rows were inserted by xid **754**, which the commit log (`pg_xact`) records as committed. No transaction is open.',
    state: { sql: '-- autocommit', vxid: null, xid: null, subxid: null, cid: '—', clog: [['754', 'committed']], locks: [], versions: [A1, B1] } },
  { title: 'BEGIN; SELECT … : a virtual xid only', body: 'Every transaction gets a **virtual xid** (`0/7` = procNumber/localXID) and locks it. A real xid is not assigned yet: `pg_current_xact_id_if_assigned()` returns NULL. Read-only transactions never consume one.',
    state: { sql: 'BEGIN;\nSELECT * FROM acct;', vxid: '0/7', xid: null, subxid: null, cid: '0', clog: [['754', 'committed']], locks: [[V, '0/7', 'ExclusiveLock', true], [R, 'acct', 'AccessShareLock', true]], versions: [A1, B1] } },
  { title: 'First write assigns xid 755', body: 'The first UPDATE takes a real **xid 755** from the global counter. The old version gets `xmax = 755`, a new one is written at **(0,3)** with `xmin = 755`. The backend now holds an ExclusiveLock on its own xid, so others can wait for it.',
    state: { sql: "UPDATE acct SET balance = balance - 10\n WHERE id = 1;", vxid: '0/7', xid: '755', subxid: null, cid: '0 → 1', clog: [['754', 'committed'], ['755', 'in progress']],
      locks: [[V, '0/7', 'ExclusiveLock', true], [X, '755', 'ExclusiveLock', false], [R, 'acct', 'RowExclusiveLock', true], [R, 'acct_pkey', 'RowExclusiveLock', true]],
      versions: [{ ...A1, xmax: '755', status: 'dead', note: 'deleted by 755 (in progress)' }, B1, { id: 'a2', ctid: '(0,3)', label: 'alice 90', xmin: '755', xmax: '0', status: 'new', note: 'cmin 0' }] } },
  { title: 'SAVEPOINT s1', body: 'A savepoint opens a **subtransaction**. It costs nothing yet: a subtransaction only gets its own xid (a **subxid**) when it writes.',
    state: { sql: 'SAVEPOINT s1;', vxid: '0/7', xid: '755', subxid: null, cid: '1', clog: [['754', 'committed'], ['755', 'in progress']],
      locks: [[V, '0/7', 'ExclusiveLock', true], [X, '755', 'ExclusiveLock', false], [R, 'acct', 'RowExclusiveLock', true], [R, 'acct_pkey', 'RowExclusiveLock', true]],
      versions: [{ ...A1, xmax: '755', status: 'dead', note: 'deleted by 755 (in progress)' }, B1, { id: 'a2', ctid: '(0,3)', label: 'alice 90', xmin: '755', xmax: '0', status: 'new', note: 'cmin 0' }] } },
  { title: 'Write inside the savepoint: subxid 756', body: 'Bob\'s new version is stamped with the **subxid 756**, not 755. Its `cmin` is **1**: the second command of the transaction. `pg_subtrans` records 756 → parent 755, and a second `transactionid` lock appears.',
    state: { sql: "UPDATE acct SET balance = balance + 10\n WHERE id = 2;", vxid: '0/7', xid: '755', subxid: '756', cid: '1 → 2', clog: [['754', 'committed'], ['755', 'in progress'], ['756', 'in progress']],
      locks: [[V, '0/7', 'ExclusiveLock', true], [X, '755', 'ExclusiveLock', false], [X, '756', 'ExclusiveLock', false], [R, 'acct', 'RowExclusiveLock', true], [R, 'acct_pkey', 'RowExclusiveLock', true]],
      versions: [{ ...A1, xmax: '755', status: 'dead', note: 'deleted by 755' }, { ...B1, xmax: '756', status: 'dead', note: 'deleted by 756 (in progress)' }, { id: 'a2', ctid: '(0,3)', label: 'alice 90', xmin: '755', xmax: '0', status: 'new', note: 'cmin 0' }, { id: 'b2', ctid: '(0,4)', label: 'bob 60', xmin: '756', xmax: '0', status: 'new', note: 'cmin 1' }] } },
  { title: 'ROLLBACK TO s1: only 756 aborts', body: 'The commit log marks **756 aborted**, and its lock is released. Nothing on the page is undone: bob\'s old version still says `xmax = 756`, but an aborted xmax is ignored, so **bob 50** is visible again. The version at (0,4) is now dead.',
    state: { sql: 'ROLLBACK TO s1;', vxid: '0/7', xid: '755', subxid: null, cid: '2', clog: [['754', 'committed'], ['755', 'in progress'], ['756', 'aborted']],
      locks: [[V, '0/7', 'ExclusiveLock', true], [X, '755', 'ExclusiveLock', false], [R, 'acct', 'RowExclusiveLock', true], [R, 'acct_pkey', 'RowExclusiveLock', true]],
      versions: [{ ...A1, xmax: '755', status: 'dead', note: 'deleted by 755' }, { ...B1, xmax: '756', status: 'live', note: 'xmax aborted → still live' }, { id: 'a2', ctid: '(0,3)', label: 'alice 90', xmin: '755', xmax: '0', status: 'new', note: 'cmin 0' }, { id: 'b2', ctid: '(0,4)', label: 'bob 60', xmin: '756', xmax: '0', status: 'dead', note: 'xmin aborted → never visible' }] } },
]

const commitStep: Step<AcidState> = { title: 'COMMIT: one 2-bit flip makes it durable', body: '**Atomicity** is one status change: 755 becomes **committed** in `pg_xact` (after the commit WAL record is flushed). Every row stamped 755 becomes visible to new snapshots at once. All locks are released.',
  state: { sql: 'COMMIT;', vxid: null, xid: null, subxid: null, cid: '—', clog: [['754', 'committed'], ['755', 'committed'], ['756', 'aborted']], locks: [],
    versions: [{ ...A1, xmax: '755', status: 'dead', note: 'dead: deleter committed' }, { ...B1, xmax: '756', status: 'live' }, { id: 'a2', ctid: '(0,3)', label: 'alice 90', xmin: '755', xmax: '0', status: 'live' }, { id: 'b2', ctid: '(0,4)', label: 'bob 60', xmin: '756', xmax: '0', status: 'dead', note: 'garbage for VACUUM' }] } }
const crashStep: Step<AcidState> = { title: 'Crash before COMMIT', body: 'No commit record reached the WAL, so 755 is never marked committed: its bits stay `00`. After restart no backend owns 755, so readers treat it as **aborted**: alice is 100 again, with no undo work at all.',
  state: { sql: '-- power loss', vxid: null, xid: null, subxid: null, cid: '—', clog: [['754', 'committed'], ['755', 'orphaned'], ['756', 'aborted']], locks: [],
    versions: [{ ...A1, xmax: '755', status: 'live', note: 'xmax aborted → live' }, { ...B1, xmax: '756', status: 'live' }, { id: 'a2', ctid: '(0,3)', label: 'alice 90', xmin: '755', xmax: '0', status: 'dead', note: 'xmin aborted' }, { id: 'b2', ctid: '(0,4)', label: 'bob 60', xmin: '756', xmax: '0', status: 'dead' }] } }
const dupRow: TVersion = { id: 'c1', ctid: '(0,5)', label: 'bob 60 (dup)', xmin: '757', xmax: '0', status: 'dead', note: 'xmin 757 aborted' }
const errorSteps: Step<AcidState>[] = [
  { title: 'An error aborts the whole transaction', body: 'The heap insert runs first, under a fresh **subxid 757** (savepoint s1 is still open), and then the primary key check fails with **23505**. 757 is marked aborted. From now on every statement fails with `25P02 current transaction is aborted`, while 755 keeps its locks.',
    state: { sql: "INSERT INTO acct VALUES (2, 'bob', 60);\n-- ERROR 23505: duplicate key", vxid: '0/7', xid: '755', subxid: null, cid: '2', clog: [['754', 'committed'], ['755', 'in progress'], ['756', 'aborted'], ['757', 'aborted']],
      locks: [[V, '0/7', 'ExclusiveLock', true], [X, '755', 'ExclusiveLock', false], [R, 'acct', 'RowExclusiveLock', true], [R, 'acct_pkey', 'RowExclusiveLock', true]],
      versions: [{ ...A1, xmax: '755', status: 'dead', note: 'deleted by 755' }, { ...B1, xmax: '756', status: 'live', note: 'xmax aborted → still live' }, { id: 'a2', ctid: '(0,3)', label: 'alice 90', xmin: '755', xmax: '0', status: 'new', note: 'cmin 0' }, { id: 'b2', ctid: '(0,4)', label: 'bob 60', xmin: '756', xmax: '0', status: 'dead', note: 'xmin aborted' }, dupRow] } },
  { title: 'COMMIT answers ROLLBACK', body: 'An aborted transaction cannot commit. The server rolls it back and replies with the tag **ROLLBACK**: 755 is marked aborted and alice is 100 again. Running `ROLLBACK TO s1` before COMMIT would have kept the first UPDATE.',
    state: { sql: 'COMMIT;\n-- server replies: ROLLBACK', vxid: null, xid: null, subxid: null, cid: '—', clog: [['754', 'committed'], ['755', 'aborted'], ['756', 'aborted'], ['757', 'aborted']], locks: [],
      versions: [{ ...A1, xmax: '755', status: 'live', note: 'xmax aborted → live' }, { ...B1, xmax: '756', status: 'live' }, { id: 'a2', ctid: '(0,3)', label: 'alice 90', xmin: '755', xmax: '0', status: 'dead', note: 'xmin aborted' }, { id: 'b2', ctid: '(0,4)', label: 'bob 60', xmin: '756', xmax: '0', status: 'dead' }, dupRow] } },
]

function ClogStrip({ clog }: { clog: AcidState['clog'] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {clog.map(([x, st]) => (
        <motion.div key={x} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="min-w-[92px] rounded-md border px-2 py-1 font-mono text-[11.5px]" style={{ borderColor: tone(clogTone[st]), background: toneBg(clogTone[st], 16) }}>
          <div className="font-semibold">xid {x}</div>
          <motion.div key={st} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} className="text-[11px]" style={{ color: tone(clogTone[st]) }}>{clogBits[st]} {st === 'orphaned' ? 'never committed = aborted' : st}</motion.div>
        </motion.div>
      ))}
    </div>
  )
}

function AcidViz() {
  const [end, setEnd] = useState<'commit' | 'crash' | 'error'>('commit')
  const steps = end === 'error' ? [...base, ...errorSteps] : [...base, end === 'commit' ? commitStep : crashStep]
  return (
    <Stepper steps={steps} interval={3200}
      extra={<Segmented label="Ending" value={end} onChange={setEnd} options={[['commit', 'COMMIT'], ['crash', 'Crash first'], ['error', 'Error, then COMMIT']]} />}
      render={(s) => (
        <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
          <Legend items={[['tuple', 'live version'], ['new', 'written by the open transaction'], ['dead', 'dead or invisible'], ['ok', 'committed'], ['header', 'xid']]} />
          <div className="grid gap-3 md:grid-cols-2">
            <Panel title="Statement">
              <pre className="rounded-md bg-surface-2 px-2 py-1.5 font-mono text-[12px] whitespace-pre-wrap">{s.sql}</pre>
              <div className="mt-2">
                <FieldTable rows={[
                  ['virtualxid', s.vxid ?? '—', 'always assigned'],
                  ['xid', s.xid ? <Tag t="header">{s.xid}</Tag> : 'NULL', 'assigned at first write'],
                  ['subxid', s.subxid ? <Tag t="header">{s.subxid}</Tag> : '—', 'child of 755 in pg_subtrans'],
                  ['command id', s.cid, 'cmin / cmax counter'],
                ]} />
              </div>
            </Panel>
            <Panel title="pg_xact (commit log): 2 bits per xid">
              <ClogStrip clog={s.clog} />
              <p className="mt-3 mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">pg_locks for this backend</p>
              {s.locks.length === 0 ? <p className="text-xs text-muted">none</p> : (
                <table className="w-full font-mono text-[11.5px]"><tbody>
                  {s.locks.map(([lt, obj, mode, fp]) => (
                    <motion.tr key={lt + obj} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-line last:border-0">
                      <td className="py-0.5 pr-2">{lt}</td><td className="py-0.5 pr-2">{obj}</td><td className="py-0.5 pr-2">{mode}</td>
                      <td className="py-0.5 text-muted">{fp ? 'fastpath' : 'main table'}</td>
                    </motion.tr>
                  ))}
                </tbody></table>
              )}
            </Panel>
          </div>
          <TupleVersions versions={s.versions} />
        </div>
      )} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'acid-transactions',
  module: 'm5',
  order: 1,
  title: 'ACID and transactions',
  tldr: [
    'A **transaction** groups statements so they commit or vanish together, and PostgreSQL implements that by stamping every row version with an **xid** and recording one 2-bit status per xid in the commit log.',
    'Because rollback and crash recovery only have to flip or ignore that status, an abort is instant and PostgreSQL needs **no undo log**.',
  ],
  visualizer: {
    title: 'A transfer with a savepoint, xid by xid',
    caption: 'Step through BEGIN, two UPDATEs, a SAVEPOINT and a ROLLBACK TO. Switch the ending to compare a clean COMMIT, a crash, and an error followed by COMMIT.',
    Component: AcidViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE acct (id int PRIMARY KEY, owner text, balance numeric NOT NULL CHECK (balance >= 0));
ALTER TABLE acct SET (autovacuum_enabled = false);
INSERT INTO acct VALUES (1, 'alice', 100), (2, 'bob', 50);
CREATE SEQUENCE invoice_no;
CREATE TABLE invoice (no int PRIMARY KEY DEFAULT nextval('invoice_no'), amount numeric NOT NULL CHECK (amount > 0));
CREATE TABLE ledger (id int PRIMARY KEY, n int NOT NULL DEFAULT 0);
INSERT INTO ledger SELECT g FROM generate_series(1, 500) g;
-- a procedure that commits its own work
CREATE PROCEDURE transfer(sender int, receiver int, amount numeric) LANGUAGE plpgsql AS $$
BEGIN
  UPDATE acct SET balance = balance - amount WHERE id = sender;
  UPDATE acct SET balance = balance + amount WHERE id = receiver;
  COMMIT;
END $$;
-- runs SQL and returns the error instead of raising it
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'Virtual vs real xid', sql: `BEGIN;
SELECT pg_current_xact_id_if_assigned() AS xid,
       (SELECT virtualxid FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = 'virtualxid') AS vxid;
UPDATE acct SET balance = balance - 10 WHERE id = 1;
SELECT pg_current_xact_id_if_assigned() AS xid_after_write;
SELECT locktype, virtualxid, transactionid, mode, fastpath
FROM pg_locks WHERE pid = pg_backend_pid() AND locktype IN ('virtualxid', 'transactionid');
COMMIT;`,
        note: 'Before the UPDATE the xid is **NULL**: only a virtual xid exists. After it, a `transactionid` lock on the new xid appears, held in the main lock table (`fastpath = false`).' },
      { label: 'Savepoint = subtransaction', sql: `BEGIN;
UPDATE acct SET balance = balance + 10 WHERE id = 1;
SAVEPOINT s1;
UPDATE acct SET balance = balance + 10 WHERE id = 2;
SELECT transactionid FROM pg_locks
WHERE pid = pg_backend_pid() AND locktype = 'transactionid';
SELECT ctid, xmin, xmax, cmin, cmax, * FROM acct ORDER BY id;
ROLLBACK TO s1;
SELECT ctid, xmin, xmax, * FROM acct ORDER BY id;
COMMIT;`,
        note: 'Two `transactionid` locks: the top xid and a **subxid** one higher. Bob\'s new version has `cmin = 1`. After `ROLLBACK TO`, bob\'s surviving row shows `xmax` = the aborted subxid, which readers ignore.' },
      { label: 'Transfer: all or nothing', sql: `CALL transfer(1, 2, 30);
SELECT * FROM acct ORDER BY id;

-- a negative amount: the debit succeeds, the credit breaks the CHECK
SELECT try_sql('CALL transfer(1, 2, -500)') AS negative_amount;
SELECT * FROM acct ORDER BY id;

-- the same CALL inside an open transaction block
BEGIN;
SELECT try_sql('CALL transfer(2, 1, 5)') AS call_inside_block;
ROLLBACK;`,
        note: 'The first CALL commits inside the procedure: alice **70**, bob **80**. The negative transfer fails on the credit (**23514**) and alice\'s debit vanishes with it. Inside a transaction block the procedure may not COMMIT, so CALL fails with **2D000** `invalid transaction termination`.' },
      { label: 'Transactional DDL', sql: `SELECT try_sql($m$
  ALTER TABLE acct ADD COLUMN email text;
  ALTER TABLE acct ADD COLUMN phone text;
  ALTER TABLE acct ADD COLUMN postal_code text NOT NULL
$m$) AS migration;

SELECT count(*) AS new_columns
FROM pg_attribute
WHERE attrelid = 'acct'::regclass AND attname IN ('email', 'phone', 'postal_code');`,
        note: 'The third ALTER fails (**23502**: existing rows have no postal code), and the first two columns are rolled back with it: `new_columns = 0`. Schema changes are ordinary transactional writes to the catalogs.' },
      { label: 'Read the commit log', sql: `SELECT lp, t_ctid, t_xmin, t_xmax,
       pg_xact_status(t_xmin::text::xid8) AS xmin_status,
       CASE WHEN t_xmax::text <> '0' THEN pg_xact_status(t_xmax::text::xid8) END AS xmax_status
FROM heap_page_items(get_raw_page('acct', 0));`,
        note: 'Every version ever written is still on the page. `pg_xact_status` reads `pg_xact`: versions whose xmin is **aborted** are invisible forever, and an aborted xmax deletes nothing.' },
      { label: 'Sequences ignore ROLLBACK', sql: `BEGIN;
SELECT nextval('invoice_no') AS a, nextval('invoice_no') AS b;
ROLLBACK;

SELECT try_sql('INSERT INTO invoice (amount) VALUES (-1)') AS failed_insert;
INSERT INTO invoice (amount) VALUES (10) RETURNING no;`,
        note: 'The rollback did not give back 1 and 2, and the failed INSERT used up **3** before its CHECK fired, so the first real invoice is number **4**. Sequences are non-transactional by design, which is what lets concurrent sessions take values without waiting.' },
      { label: 'Cost of subtransactions', sql: `SELECT pg_current_xact_id() AS before;
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM ledger LOOP
    BEGIN
      UPDATE ledger SET n = n + 1 WHERE id = r.id;
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;
END $$;
SELECT pg_current_xact_id() AS after_loop;
UPDATE ledger SET n = n + 1;
SELECT pg_current_xact_id() AS after_set_based;`,
        note: 'Each `BEGIN … EXCEPTION` block is a subtransaction, and each one that writes burns a **subxid**: the 500-row loop advances the counter by about 500. The set-based UPDATE uses one xid.' },
      { label: 'Implicit transactions & 2PC', sql: `SELECT pg_current_xact_id_if_assigned() AS read_only;
SELECT txid_current() AS stmt_1;
SELECT txid_current() AS stmt_2;
SHOW max_prepared_transactions;
SELECT gid, transaction, prepared FROM pg_prepared_xacts;`,
        note: 'A plain read gets no xid (**NULL**). `txid_current()` forces one, and outside BEGIN each statement is its own transaction, so the two values differ by one. `max_prepared_transactions = 0` disables `PREPARE TRANSACTION`; production 2PC needs it raised.' },
    ],
  },
  production: {
    title: 'A nightly job that burned half a million xids',
    context: 'A billing job applies late fees row by row in a PL/pgSQL loop. Each row update sits in its own `BEGIN … EXCEPTION` block so a bad row is logged and skipped.',
    problem: 'Every exception block is a **subtransaction**, and every one that writes gets its own subxid. One run over 500 k accounts assigns about 500 k subxids inside one top-level transaction. Past **64 cached subxids** per backend, other sessions\' visibility checks must consult `pg_subtrans`, and the xid counter races toward the freeze thresholds.',
    solution: 'Validate first, then write in one set-based statement. Move the bad-row filter into the WHERE clause, and use a separate rejects table for rows that fail validation. Keep exception blocks for genuinely unexpected errors, outside the per-row loop.',
    sql: `-- validate up front, write once
INSERT INTO fee_rejects (account_id, reason)
SELECT id, 'no billing address' FROM accounts WHERE billing_address IS NULL;

UPDATE accounts SET balance = balance - fee
WHERE due_date < current_date AND billing_address IS NOT NULL;`,
    outcome: 'On 500 rows the per-row exception loop advances the xid counter by **502**, the set-based UPDATE by **1**. The subxid cache can no longer overflow, and xid consumption drops by the row count.',
  },
  pitfalls: [
    { title: 'Idle in transaction',
      symptom: '`pg_stat_activity` shows sessions in state `idle in transaction` for minutes; table bloat grows and DDL queues behind them.',
      cause: 'An open transaction keeps its locks until it ends and holds back the xmin horizon, so VACUUM cannot remove rows that died after it started. Drivers with autocommit off send BEGIN before the first statement, so one SELECT on a pooled connection that never commits is enough.',
      fix: 'Commit or roll back after every unit of work (reads included), and set a server-side guard.',
      sql: `ALTER ROLE app SET idle_in_transaction_session_timeout = '30s';` },
    { title: 'Subtransaction overflow',
      symptom: 'Throughput collapses under concurrency and wait events show `SubtransSLRU` / `SubtransBuffer` when one transaction uses many savepoints or exception blocks.',
      cause: 'Only 64 subxids per backend are cached in shared memory. Beyond that, every snapshot check for that transaction\'s rows has to look in `pg_subtrans`.',
      fix: 'Avoid per-row savepoints (ORM "nested transactions", PL/pgSQL EXCEPTION inside loops). Batch the work set-based, or commit in smaller transactions.' },
    { title: 'Carrying on after an error',
      symptom: 'Every statement after a failed one returns `ERROR: current transaction is aborted, commands ignored until end of transaction block` (25P02), and the final COMMIT replies `ROLLBACK`. Rows written before the error are gone.',
      cause: 'Any error puts the whole transaction block into the aborted state. Nothing more can run in it, and COMMIT on an aborted transaction performs a rollback. A common belief is that COMMIT saves the statements that succeeded; it never does.',
      fix: 'Check every statement result and ROLLBACK on error, then retry the unit of work. To survive an expected failure inside one transaction, set a SAVEPOINT before it and `ROLLBACK TO` it on error.',
      sql: `BEGIN;
INSERT INTO orders VALUES (1, 'ok');
SAVEPOINT before_risky;
INSERT INTO orders VALUES (1, 'dup');     -- fails
ROLLBACK TO before_risky;                -- transaction usable again
COMMIT;                                  -- keeps the first INSERT` },
    { title: 'A procedure that COMMITs, called inside BEGIN',
      symptom: '`CALL transfer(…)` works from psql but fails from the application with `ERROR: invalid transaction termination` (2D000).',
      cause: 'A procedure may only COMMIT or ROLLBACK when CALL runs in its own transaction. The driver or framework wrapped the CALL in BEGIN … COMMIT, or a function sits between the caller and the procedure.',
      fix: 'Run such procedures in autocommit mode, as a top-level CALL. If the caller must own the transaction, remove COMMIT from the procedure and let the caller commit.' },
    { title: 'Expecting ROLLBACK to undo everything',
      symptom: 'Invoice numbers have gaps after rollbacks, failed INSERTs and upserts, and a session-level advisory lock is still held after a rollback.',
      cause: 'Sequence increments and session-level advisory locks are deliberately non-transactional. An INSERT draws its default value before constraints are checked, so a failed or conflicting INSERT still consumes a number.',
      fix: 'Never use a sequence as a gap-free counter. Use `pg_advisory_xact_lock` when the lock should end with the transaction.' },
    { title: 'Forgotten prepared transactions',
      symptom: 'After a coordinator crash, locks are held forever and `age(datfrozenxid)` keeps rising even with no sessions connected.',
      cause: 'A `PREPARE TRANSACTION` survives restarts and keeps its locks and its xid until someone runs `COMMIT PREPARED` or `ROLLBACK PREPARED`.',
      fix: 'Leave `max_prepared_transactions = 0` unless you run a transaction manager, and alert on old rows in `pg_prepared_xacts`.',
      sql: `SELECT gid, prepared, age(transaction) FROM pg_prepared_xacts ORDER BY prepared;` },
  ],
  pointers: [
    'Every transaction has a **virtual xid**. A real **xid** (32-bit, wraps; `xid8` adds the epoch) is assigned only at the first write.',
    'Commit and abort are a **2-bit status** per xid in `pg_xact`. Rows are never undone: aborted xmins are invisible and aborted xmaxes are ignored.',
    '**SAVEPOINT** and PL/pgSQL **EXCEPTION** blocks are subtransactions with their own **subxids**. Only 64 are cached per backend.',
    'Locks are held to **transaction end**, except those taken after a savepoint that is rolled back to.',
    '**2PC**: `PREPARE TRANSACTION` → `COMMIT PREPARED` / `ROLLBACK PREPARED`; inspect `pg_prepared_xacts`.',
  ],
  sources: ['tutorial-transactions.html', 'transaction-id.html', 'subxacts.html', 'two-phase.html', 'xact-locking.html', 'functions-info.html', 'sql-prepare-transaction.html', 'ddl-system-columns.html'],
}
