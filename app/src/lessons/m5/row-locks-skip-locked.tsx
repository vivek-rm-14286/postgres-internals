import { useState } from 'react'
import type { Lesson } from '../../lesson/types'
import { Segmented } from '../../viz/kit'
import { LockList, ScenarioStepper, TupleVersions, type LockRow, type TEvent, type TLane, type TStep, type TVersion } from './_timeline'
import { LockMatrix, ROW_CONFLICTS, ROW_MODES } from './_matrix'

/* ------------------------------------------------------------------------------------------------
 * Three queue workers claim jobs with SELECT … FOR UPDATE [SKIP LOCKED] LIMIT 1, simulated.
 * Row locks live in the tuple (t_xmax + HEAP_XMAX_LOCK_ONLY, as captured with pageinspect);
 * they only show up in pg_locks while somebody is waiting for them (tuple + transactionid locks).
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'skip' | 'wait'
interface X { jobs: TVersion[]; locks: LockRow[] }

const lanes: TLane[] = [
  { id: 'A', name: 'Worker A', note: 'READ COMMITTED' },
  { id: 'B', name: 'Worker B', note: 'READ COMMITTED' },
  { id: 'C', name: 'Worker C', note: 'READ COMMITTED' },
]
const claim = (skip: boolean) => `BEGIN;\nSELECT id FROM jobs\n WHERE status = 'queued'\n ORDER BY id LIMIT 1\n FOR UPDATE${skip ? ' SKIP LOCKED' : ''};`
type JS = [string, string, TVersion['status'], string?] // status text, xmax, tone status, note
function jobs(...rows: JS[]): TVersion[] {
  return rows.map(([st, xmax, s, note], i) => ({ id: `j${i + 1}`, label: `job ${i + 1} · ${st}`, xmin: i < 5 ? '940' : '?', xmax, status: s, note }))
}
const Q: JS = ['queued', '0', 'live']
const lockedBy = (x: string): JS => ['queued', x, 'locked', `locked by ${x} (lock-only xmax)`]
const doneBy = (x: string): JS => ['done', '0', 'new', `new version by ${x}`]

const evSkip: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: claim(true), out: '→ **job 1** · xmax of job 1 = 950' },
  { lane: 'B', at: 1, kind: 'sql', sql: claim(true), out: 'job 1 locked → skipped · → **job 2**' },
  { lane: 'C', at: 2, kind: 'sql', sql: claim(true), out: 'jobs 1, 2 skipped · → **job 3**' },
  { lane: 'A', at: 3, kind: 'ok', sql: "UPDATE jobs SET status = 'done'\n WHERE id = 1;\nCOMMIT;", out: 'row lock released at commit' },
  { lane: 'A', at: 4, kind: 'sql', sql: claim(true), out: 'jobs 2, 3 skipped · → **job 4** (xid 953)' },
  { lane: 'B', at: 4, kind: 'ok', sql: "UPDATE … WHERE id = 2;\nCOMMIT;" },
  { lane: 'C', at: 5, kind: 'ok', sql: "UPDATE … WHERE id = 3;\nCOMMIT;" },
  { lane: 'B', at: 5, kind: 'sql', sql: claim(true), out: 'job 4 skipped · → **job 5** (xid 954)' },
]
const stSkip: TStep<X>[] = [
  { tick: 0, title: 'A claims job 1', body: '`FOR UPDATE` writes A\'s xid into job 1\'s `t_xmax` with the **lock-only** flag. No new row version, and nothing new in `pg_locks` except a ROW SHARE table lock.', badges: { A: { xid: '950' } }, x: { jobs: jobs(lockedBy('950'), Q, Q, Q, Q), locks: [] } },
  { tick: 1, title: 'B skips the locked row', body: 'B\'s scan meets job 1, sees the row lock cannot be taken at once, and **skips** it instead of waiting. It locks job 2.', badges: { A: { xid: '950' }, B: { xid: '951' } }, x: { jobs: jobs(lockedBy('950'), lockedBy('951'), Q, Q, Q), locks: [] } },
  { tick: 2, title: 'C skips two', body: 'Three workers, three different jobs, zero waiting. This is what SKIP LOCKED is for: queue-like tables with many consumers.', badges: { A: { xid: '950' }, B: { xid: '951' }, C: { xid: '952' } }, x: { jobs: jobs(lockedBy('950'), lockedBy('951'), lockedBy('952'), Q, Q), locks: [] } },
  { tick: 3, title: 'A finishes job 1', body: 'The UPDATE makes a new version marked done, and COMMIT releases the row lock.', badges: { B: { xid: '951' }, C: { xid: '952' } }, x: { jobs: jobs(doneBy('950'), lockedBy('951'), lockedBy('952'), Q, Q), locks: [] } },
  { tick: 4, title: 'A claims again, B finishes', body: 'A\'s next claim skips the jobs still held by B and C and takes job 4.', badges: { A: { xid: '953' }, C: { xid: '952' } }, x: { jobs: jobs(doneBy('950'), doneBy('951'), lockedBy('952'), lockedBy('953'), Q), locks: [] } },
  { tick: 5, title: 'Steady state', body: 'Each worker always holds a different job. A job a crashed worker held is unlocked when its transaction aborts, so it is picked up again automatically.', badges: { A: { xid: '953' }, B: { xid: '954' } }, x: { jobs: jobs(doneBy('950'), doneBy('951'), doneBy('952'), lockedBy('953'), lockedBy('954')), locks: [] } },
]

const evWait: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: claim(false), out: '→ **job 1**' },
  { lane: 'B', at: 1, kind: 'sql', sql: claim(false), out: 'job 1 is locked by 950' },
  { lane: 'B', at: 2, until: 4, kind: 'wait', out: 'holds the **tuple** lock, waits for **ShareLock on transaction 950**' },
  { lane: 'C', at: 2, kind: 'sql', sql: claim(false), out: 'job 1 is locked too' },
  { lane: 'C', at: 3, until: 6, kind: 'wait', out: 'queues for the **tuple** lock behind B · later finds job 2 held by B and waits again' },
  { lane: 'A', at: 3, kind: 'ok', sql: "UPDATE … WHERE id = 1;\nCOMMIT;" },
  { lane: 'B', at: 4, kind: 'grant', out: 'job 1 re-checked: now *done*, no match · scan moves on · → **job 2**' },
  { lane: 'B', at: 5, kind: 'ok', sql: "UPDATE … WHERE id = 2;\nCOMMIT;" },
  { lane: 'C', at: 6, kind: 'grant', out: 'jobs 1, 2 done · → **job 3** · it waited through two other jobs' },
]
const stWait: TStep<X>[] = [
  { tick: 0, title: 'A claims job 1', body: 'Same start: job 1\'s `t_xmax` = 950, lock-only.', badges: { A: { xid: '950' } }, x: { jobs: jobs(lockedBy('950'), Q, Q, Q, Q), locks: [] } },
  { tick: 1, title: 'B wants job 1 too', body: 'Without SKIP LOCKED every worker\'s `ORDER BY id LIMIT 1` lands on the **same first row**.', badges: { A: { xid: '950' }, B: { xid: '951' } }, x: { jobs: jobs(lockedBy('950'), Q, Q, Q, Q), locks: [] } },
  { tick: 2, title: 'B blocks, and now it shows in pg_locks', body: 'A waiter takes a heavyweight **tuple** lock (so waiters queue fairly) and then waits on the holder\'s **xid**. Row locks appear in `pg_locks` only like this, while someone waits.', badges: { A: { xid: '950' }, B: { xid: '951', extra: 'waiting', extraTone: 'dead' } },
    x: { jobs: jobs(lockedBy('950'), Q, Q, Q, Q), locks: [{ lane: 'B', locktype: 'tuple', target: 'jobs (0,1)', mode: 'AccessExclusiveLock', granted: true }, { lane: 'B', locktype: 'transactionid', target: '950', mode: 'ShareLock', granted: false }] } },
  { tick: 3, title: 'C queues behind B', body: 'C waits for the tuple lock B holds. Meanwhile A finishes and commits.', badges: { B: { xid: '951', extra: 'waiting', extraTone: 'dead' }, C: { xid: '952', extra: 'waiting', extraTone: 'dead' } },
    x: { jobs: jobs(doneBy('950'), Q, Q, Q, Q), locks: [{ lane: 'B', locktype: 'tuple', target: 'jobs (0,1)', mode: 'AccessExclusiveLock', granted: true }, { lane: 'B', locktype: 'transactionid', target: '950', mode: 'ShareLock', granted: false }, { lane: 'C', locktype: 'tuple', target: 'jobs (0,1)', mode: 'AccessExclusiveLock', granted: false }] } },
  { tick: 4, title: 'B re-checks and moves on', body: 'In Read Committed, B re-evaluates `status = \'queued\'` on the new version: it fails, so B continues the scan and locks job 2. B lost time for nothing.', badges: { B: { xid: '951' }, C: { xid: '952', extra: 'waiting', extraTone: 'dead' } },
    x: { jobs: jobs(doneBy('950'), lockedBy('951'), Q, Q, Q), locks: [{ lane: 'C', locktype: 'transactionid', target: '951', mode: 'ShareLock', granted: false }] } },
  { tick: 5, title: 'B finishes job 2', body: 'C, still waiting, had moved on to job 2, which B held. One worker at a time makes progress.', badges: { C: { xid: '952', extra: 'waiting', extraTone: 'dead' } },
    x: { jobs: jobs(doneBy('950'), doneBy('951'), Q, Q, Q), locks: [{ lane: 'C', locktype: 'transactionid', target: '951', mode: 'ShareLock', granted: false }] } },
  { tick: 6, title: 'C gets job 3, finally', body: 'Plain `FOR UPDATE` serialises the workers: adding workers adds waiting, not throughput. Switch to **SKIP LOCKED** to compare.', badges: { C: { xid: '952' } },
    x: { jobs: jobs(doneBy('950'), doneBy('951'), lockedBy('952'), Q, Q), locks: [] } },
]

function QueueViz() {
  const [mode, setMode] = useState<Mode>('skip')
  return (
    <ScenarioStepper key={mode} lanes={lanes} events={mode === 'skip' ? evSkip : evWait} steps={mode === 'skip' ? stSkip : stWait}
      extra={<Segmented label="Locking clause" value={mode} onChange={setMode} options={[['skip', 'FOR UPDATE SKIP LOCKED'], ['wait', 'FOR UPDATE']]} />}
      panel={(s) => (
        <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
          <TupleVersions title="jobs: the newest version of each row" versions={s.x.jobs} />
          <LockList title="pg_locks: row-lock waits only" rows={s.x.locks} />
        </div>
      )} />
  )
}

function RowLocksViz() {
  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <QueueViz />
      <div className="grid min-w-0 gap-2 border-t border-line pt-4 [&>*]:min-w-0">
        <p className="text-sm font-semibold">Row-level lock conflict matrix</p>
        <LockMatrix modes={ROW_MODES} conflicts={ROW_CONFLICTS} kind="row" initial={[0, 2]} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'row-locks-skip-locked',
  module: 'm5',
  order: 6,
  title: 'Row locks, SKIP LOCKED and advisory locks',
  tldr: [
    'Row locks (`FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, `FOR KEY SHARE`) are written into the tuple itself, in `t_xmax`, so PostgreSQL can lock any number of rows without memory limits.',
    'On top of them, **NOWAIT** and **SKIP LOCKED** let a worker refuse to wait, which turns a plain table into a concurrent job queue, while **advisory locks** lock ideas that are not rows at all.',
  ],
  visualizer: {
    title: 'Three queue workers, two locking clauses',
    caption: 'Step through three workers claiming jobs with SKIP LOCKED, then switch to plain FOR UPDATE and watch them line up. Below, test any pair of row-lock modes.',
    Component: RowLocksViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE jobs (id int PRIMARY KEY, payload text NOT NULL, status text NOT NULL DEFAULT 'queued');
INSERT INTO jobs (id, payload) SELECT g, 'email #' || g FROM generate_series(1, 5) g;
CREATE TABLE customers (id int PRIMARY KEY, name text);
CREATE TABLE orders (id int PRIMARY KEY, customer_id int REFERENCES customers);
INSERT INTO customers VALUES (1, 'acme'), (2, 'globex');
-- a running total kept by a trigger
CREATE TABLE job_stats (id int PRIMARY KEY, queued int NOT NULL);
INSERT INTO job_stats VALUES (1, 5);
CREATE FUNCTION count_job() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN UPDATE job_stats SET queued = queued + 1 WHERE id = 1; RETURN NEW; END $$;
CREATE TRIGGER jobs_count AFTER INSERT ON jobs FOR EACH ROW EXECUTE FUNCTION count_job();`,
    presets: [
      { label: 'Claim a job', sql: `BEGIN;
SELECT id, payload FROM jobs
WHERE status = 'queued' ORDER BY id LIMIT 1
FOR UPDATE SKIP LOCKED;
SELECT ctid, xmin, xmax, id, status FROM jobs ORDER BY id;
SELECT locktype, relation::regclass, mode FROM pg_locks
WHERE pid = pg_backend_pid() AND locktype = 'relation';
COMMIT;`,
        note: 'Only job 1 gets `xmax` = our xid. `pg_locks` shows a **RowShareLock** on the table and nothing per row: the row lock lives in the tuple.' },
      { label: 'Lock bits in the tuple', sql: `BEGIN;
SELECT id FROM jobs WHERE id = 1 FOR UPDATE;
SELECT id FROM jobs WHERE id = 2 FOR KEY SHARE;
SELECT lp, t_xmax, (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('jobs', 0)) WHERE lp <= 2;
COMMIT;`,
        note: 'Both rows carry our xid in `t_xmax`, with `HEAP_XMAX_LOCK_ONLY` (a lock, not a delete). The strength is in the flags: `HEAP_XMAX_EXCL_LOCK` vs `HEAP_XMAX_KEYSHR_LOCK`.' },
      { label: 'Claim and start in one statement', sql: `UPDATE jobs SET status = 'running'
WHERE id = (
  SELECT id FROM jobs WHERE status = 'queued'
  ORDER BY id LIMIT 1
  FOR UPDATE SKIP LOCKED)
RETURNING id, payload, status;`,
        note: 'The production pattern: the subquery picks and locks one unclaimed row, the UPDATE marks it, all in one round trip. Run it repeatedly: ids 1, 2, 3 …' },
      { label: 'MultiXact: two lockers', sql: `BEGIN;
SELECT id FROM jobs WHERE id = 5 FOR KEY SHARE;
SAVEPOINT s;
SELECT id FROM jobs WHERE id = 5 FOR SHARE;
SELECT xmax FROM jobs WHERE id = 5;
SELECT * FROM pg_get_multixact_members((SELECT xmax FROM jobs WHERE id = 5));
COMMIT;`,
        note: '`t_xmax` has room for one xid. With two lockers (here our xid and the savepoint\'s subxid) it holds a **MultiXact id** instead, whose members are listed in `pg_multixact`.' },
      { label: 'Foreign keys take KEY SHARE', sql: `BEGIN;
INSERT INTO orders VALUES (1, 1);
SELECT lp, t_xmax, (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('customers', 0));
COMMIT;`,
        note: 'Inserting a child row locks the **referenced** customer `FOR KEY SHARE`. That blocks deleting the customer or changing its key, but not an ordinary UPDATE of its name.' },
      { label: 'A hot counter row', sql: `BEGIN;
INSERT INTO jobs (id, payload) VALUES (6, 'email #6');
SELECT pg_current_xact_id() AS me;
SELECT ctid, xmin, xmax, queued FROM job_stats;
COMMIT;`,
        note: 'The trigger updated the single `job_stats` row, so its current version carries **our xid** as `xmin`, and the old one has it as `xmax`. Until COMMIT, any other session inserting a job must update the same row and waits on our xid: all inserts into `jobs` now run one at a time.' },
      { label: 'Advisory locks', sql: `SELECT pg_advisory_lock(42);
SELECT pg_advisory_lock(42);
SELECT locktype, objid, mode, granted FROM pg_locks WHERE locktype = 'advisory';
SELECT pg_advisory_unlock(42) AS first, pg_advisory_unlock(42) AS second;
BEGIN;
SELECT pg_advisory_xact_lock(7);
SELECT pg_try_advisory_lock(hashtext('nightly-report')) AS got_it;
ROLLBACK;
SELECT locktype, objid, mode FROM pg_locks WHERE locktype = 'advisory';
SELECT pg_advisory_unlock_all();`,
        note: 'Session locks stack (two locks need two unlocks) and **ignore ROLLBACK**: after it, the xact lock 7 is gone but the session lock from `pg_try_advisory_lock` is still held.' },
    ],
  },
  production: {
    title: 'A job queue that stopped scaling at one worker',
    context: 'An email service stores outgoing messages in a `jobs` table. Workers poll with `SELECT … WHERE status = \'queued\' ORDER BY id LIMIT 1 FOR UPDATE`.',
    problem: 'Every worker\'s query targets the same oldest row. All but one block on its row lock, then re-check, then block on the next row. Adding workers added lock waits, not throughput, and `pg_stat_activity` showed most workers in `Lock: transactionid`.',
    solution: 'Claim with `FOR UPDATE SKIP LOCKED` in the same statement that marks the job, and keep the claiming transaction short. Index the queue predicate so the scan does not walk finished jobs.',
    sql: `CREATE INDEX jobs_queued_idx ON jobs (id) WHERE status = 'queued';

UPDATE jobs SET status = 'running', started_at = now()
WHERE id = (SELECT id FROM jobs WHERE status = 'queued'
            ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
RETURNING id, payload;`,
    outcome: 'Each worker claims a different row without waiting, so throughput grows with the number of workers until the database itself is the bottleneck. The order of processing becomes approximate, which a queue can accept.',
  },
  pitfalls: [
    { title: 'SKIP LOCKED for general reads',
      symptom: 'A report occasionally shows wrong totals with no error.',
      cause: 'SKIP LOCKED silently drops locked rows from the result. It gives an **inconsistent view** by design.',
      fix: 'Use it only for queue-style claiming. Ordinary reads need no row locks at all under MVCC.' },
    { title: 'LIMIT and locking functions',
      symptom: '`pg_locks` shows many more advisory locks than the query returned.',
      cause: 'In `SELECT pg_advisory_lock(id) FROM t WHERE … LIMIT 100`, the LIMIT is not guaranteed to apply before the function runs.',
      fix: 'Apply the LIMIT in a subquery, then lock in the outer query.',
      sql: `SELECT pg_advisory_lock(q.id) FROM (SELECT id FROM foo WHERE id > 12345 LIMIT 100) q;` },
    { title: 'Session advisory locks behind a pooler',
      symptom: 'A "singleton" job runs twice, or a lock is never released.',
      cause: 'Session-level advisory locks belong to the server connection. A transaction-mode pooler hands that connection to other clients.',
      fix: 'Behind transaction pooling use `pg_advisory_xact_lock`, which ends with the transaction.' },
    { title: 'A trigger-maintained counter row',
      symptom: 'Inserts into a busy table stop scaling with more clients, and `pg_stat_activity` shows them waiting on `Lock: transactionid` behind each other.',
      cause: 'An AFTER INSERT trigger keeps a running total by updating one summary row. That row lock is held until each inserting transaction commits, so every insert queues behind the previous one. A BEFORE trigger that reads the count and inserts the summary row when missing is worse: two sessions both see none and both insert.',
      fix: 'Compute the total on read, or spread the counter over several rows (`id = pid % 16`) and sum them, or append deltas and fold them in periodically. Create the summary row once with `INSERT … ON CONFLICT DO NOTHING`.' },
    { title: 'MultiXact growth from FK-heavy workloads',
      symptom: '`pg_multixact` grows and anti-wraparound vacuums for multixacts appear.',
      cause: 'Many concurrent child inserts lock the same parent row `FOR KEY SHARE`, so its `t_xmax` becomes a MultiXact each time the locker set changes.',
      fix: 'Monitor `mxid_age(datminmxid)`, keep autovacuum healthy, and avoid hot parent rows when you can.' },
  ],
  pointers: [
    'Four row modes: **FOR UPDATE** > **FOR NO KEY UPDATE** > **FOR SHARE** > **FOR KEY SHARE**. A plain UPDATE takes NO KEY UPDATE unless it changes a key.',
    'Row locks are stored in **`t_xmax` + infomask** (a **MultiXact** when shared); they appear in `pg_locks` only while someone waits.',
    '**NOWAIT** errors at once (55P03); **SKIP LOCKED** silently skips. Both still take the ROW SHARE table lock normally.',
    'Job queue: `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING …`.',
    'Advisory locks: **session** level (survive rollback, stack) vs **transaction** level (`pg_advisory_xact_lock`).',
  ],
  sources: ['explicit-locking.html', 'sql-select.html', 'functions-admin.html', 'xact-locking.html', 'view-pg-locks.html', 'pgrowlocks.html'],
}
