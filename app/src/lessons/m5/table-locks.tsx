import { useState } from 'react'
import type { Lesson } from '../../lesson/types'
import { Segmented } from '../../viz/kit'
import { Graph, LockList, ScenarioStepper, type GEdge, type LockRow, type TEvent, type TLane, type TStep } from './_timeline'
import { LockMatrix, TABLE_CONFLICTS, TABLE_MODES } from './_matrix'

/* ------------------------------------------------------------------------------------------------
 * Part 1: Table 13.2 as a clickable matrix.
 * Part 2: the classic migration outage, simulated: A holds ACCESS SHARE (idle in transaction),
 * B's ALTER TABLE queues for ACCESS EXCLUSIVE, and C's plain SELECT queues *behind B*.
 * Toggle lock_timeout to see B give up and the queue drain. Times are illustrative.
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'none' | 'timeout'
interface X { locks: LockRow[]; edges: GEdge[] }

const lanes: TLane[] = [
  { id: 'A', name: 'A · report', note: 'idle in transaction' },
  { id: 'B', name: 'B · migration', note: 'ALTER TABLE' },
  { id: 'C', name: 'C · app query', note: 'plain SELECT' },
]
const aHold: LockRow = { lane: 'A', locktype: 'relation', target: 'orders', mode: 'AccessShareLock', granted: true }
const bWait: LockRow = { lane: 'B', locktype: 'relation', target: 'orders', mode: 'AccessExclusiveLock', granted: false }
const bHold: LockRow = { ...bWait, granted: true }
const cWait: LockRow = { lane: 'C', locktype: 'relation', target: 'orders', mode: 'AccessShareLock', granted: false }
const cHold: LockRow = { ...cWait, granted: true }
const eBA: GEdge = { from: 'B', to: 'A', label: 'AccX vs AccS held' }
const eCB: GEdge = { from: 'C', to: 'B', label: 'AccS vs AccX queued' }

const evNone: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: 'BEGIN;\nSELECT count(*) FROM orders;', out: 'AccessShareLock granted · then the client goes quiet' },
  { lane: 'B', at: 1, kind: 'sql', sql: 'ALTER TABLE orders\n  ADD COLUMN note text;', out: 'needs **AccessExclusiveLock**' },
  { lane: 'B', at: 2, until: 5, kind: 'wait', out: 'conflicts with A\'s AccessShareLock → joins the lock queue' },
  { lane: 'C', at: 3, kind: 'sql', sql: 'SELECT * FROM orders\n WHERE id = 7;', out: 'needs AccessShareLock: compatible with A …' },
  { lane: 'C', at: 4, until: 6, kind: 'wait', out: '… but conflicts with **B\'s queued request**, so it lines up behind B · `pg_blocking_pids` = {B}' },
  { lane: 'A', at: 5, kind: 'ok', sql: 'COMMIT;', out: 'releases AccessShareLock' },
  { lane: 'B', at: 5, kind: 'grant', out: 'AccessExclusiveLock granted · ALTER runs in milliseconds · COMMIT' },
  { lane: 'C', at: 6, kind: 'grant', out: 'finally runs: one row after **~88 s** of waiting' },
]
const evTimeout: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: 'BEGIN;\nSELECT count(*) FROM orders;', out: 'AccessShareLock granted · then the client goes quiet' },
  { lane: 'B', at: 1, kind: 'sql', sql: "SET lock_timeout = '2s';\nALTER TABLE orders\n  ADD COLUMN note text;", out: 'needs **AccessExclusiveLock**' },
  { lane: 'B', at: 2, until: 4, kind: 'wait', out: 'queued behind A, with a 2 s budget' },
  { lane: 'C', at: 3, kind: 'sql', sql: 'SELECT * FROM orders\n WHERE id = 7;', out: 'needs AccessShareLock' },
  { lane: 'B', at: 4, kind: 'err', out: 'ERROR: canceling statement due to lock timeout · **55P03** · request leaves the queue' },
  { lane: 'C', at: 4, until: 5, kind: 'wait', out: 'briefly queued behind B' },
  { lane: 'C', at: 5, kind: 'grant', out: 'B is gone: compatible with A · runs at once' },
  { lane: 'B', at: 6, kind: 'ok', sql: '-- retry loop, later\nALTER TABLE orders\n  ADD COLUMN note text;', out: 'succeeds in a quiet moment · nobody stalled more than 2 s' },
]

const stNone: TStep<X>[] = [
  { tick: 0, title: 'A reads and goes idle', body: 'A plain SELECT takes **ACCESS SHARE**, and like every table lock it is held until the transaction ends, here: whenever the client commits.', x: { locks: [aHold], edges: [] } },
  { tick: 1, title: 'B runs ALTER TABLE', body: '`ADD COLUMN` needs **ACCESS EXCLUSIVE**, the one mode that conflicts with ACCESS SHARE.', x: { locks: [aHold], edges: [] } },
  { tick: 2, title: 'B waits for A', body: 'B joins the lock queue for `orders`. Waiting for a lock is normal; the migration itself would take milliseconds.', badges: { B: { extra: 'waiting', extraTone: 'dead' } }, x: { locks: [aHold, bWait], edges: [eBA] } },
  { tick: 3, title: 'C arrives with a trivial SELECT', body: 'C only needs ACCESS SHARE, which is compatible with A\'s lock.', badges: { B: { extra: 'waiting', extraTone: 'dead' } }, x: { locks: [aHold, bWait], edges: [eBA] } },
  { tick: 4, title: 'C queues behind B', body: 'A new request that conflicts with a **waiting** request queues behind it. Granting C first could starve B forever, so C waits. Every query on `orders` now piles up: an outage.', badges: { B: { extra: 'waiting', extraTone: 'dead' }, C: { extra: 'waiting', extraTone: 'dead' } }, x: { locks: [aHold, bWait, cWait], edges: [eBA, eCB] } },
  { tick: 5, title: 'A finally commits', body: 'A\'s lock goes away. B is first in the queue, gets ACCESS EXCLUSIVE, alters the catalog and commits.', badges: { C: { extra: 'waiting', extraTone: 'dead' } }, x: { locks: [bHold, cWait], edges: [eCB] } },
  { tick: 6, title: 'The queue drains', body: 'C runs at last. Its delay had nothing to do with its own work: it was the length of A\'s idle transaction.', x: { locks: [cHold], edges: [] } },
]
const stTimeout: TStep<X>[] = [
  { tick: 0, title: 'A reads and goes idle', body: 'Same start: A holds **ACCESS SHARE** until it commits.', x: { locks: [aHold], edges: [] } },
  { tick: 1, title: 'B sets lock_timeout first', body: '`lock_timeout` caps how long **each lock acquisition** may wait. 0 (the default) means forever.', x: { locks: [aHold], edges: [] } },
  { tick: 2, title: 'B waits, on a budget', body: 'B is queued exactly as before.', badges: { B: { extra: 'waiting ≤ 2 s', extraTone: 'dead' } }, x: { locks: [aHold, bWait], edges: [eBA] } },
  { tick: 3, title: 'C arrives', body: 'C would queue behind B again …', badges: { B: { extra: 'waiting ≤ 2 s', extraTone: 'dead' } }, x: { locks: [aHold, bWait], edges: [eBA] } },
  { tick: 4, title: 'B gives up after 2 s', body: 'B fails with **55P03** and its request leaves the queue. The worst stall anyone saw is bounded by the timeout.', badges: { B: { extra: '55P03', extraTone: 'dead' }, C: { extra: 'waiting', extraTone: 'dead' } }, x: { locks: [aHold, cWait], edges: [] } },
  { tick: 5, title: 'C runs immediately', body: 'With B gone, C is only compatible-with-A, so it is granted at once.', x: { locks: [aHold, cHold], edges: [] } },
  { tick: 6, title: 'Retry the migration', body: 'The deploy script retries the ALTER with backoff and succeeds once no long transaction holds the table.', x: { locks: [bHold], edges: [] } },
]

function QueueTimeline() {
  const [mode, setMode] = useState<Mode>('none')
  const ev = mode === 'none' ? evNone : evTimeout
  const st = mode === 'none' ? stNone : stTimeout
  const labels = mode === 'none' ? ['0 s', '1 s', '1 s', '2 s', '2 s', '90 s', '90 s'] : ['0 s', '1 s', '1 s', '2 s', '3 s', '3 s', '95 s']
  return (
    <ScenarioStepper key={mode} lanes={lanes} events={ev} steps={st} tickLabels={labels}
      extra={<Segmented label="Migration setting" value={mode} onChange={setMode} options={[['none', 'lock_timeout = 0'], ['timeout', "lock_timeout = '2s'"]]} />}
      panel={(s) => (
        <div className="grid gap-3 lg:grid-cols-2">
          <LockList rows={s.x.locks} />
          <Graph title="waits-for (pg_blocking_pids)" nodes={[{ id: 'A', label: 'A', sub: 'report' }, { id: 'B', label: 'B', sub: 'migration' }, { id: 'C', label: 'C', sub: 'app' }]} edges={s.x.edges}
            caption="An arrow X → Y means X is waiting for Y. C waits for B, not for A, even though only A holds a lock." />
        </div>
      )} />
  )
}

function TableLocksViz() {
  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <QueueTimeline />
      <div className="grid min-w-0 gap-2 border-t border-line pt-4 [&>*]:min-w-0">
        <p className="text-sm font-semibold">Table-level lock conflict matrix</p>
        <LockMatrix modes={TABLE_MODES} conflicts={TABLE_CONFLICTS} kind="table" initial={[0, 7]} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'table-locks',
  module: 'm5',
  order: 5,
  title: 'Heavyweight locks and the conflict matrix',
  tldr: [
    'PostgreSQL has **eight table lock modes** that commands take automatically, and two transactions can hold locks on the same table only if their modes do not conflict.',
    'The modes exist so reads, writes, VACUUM and schema changes can each run alongside exactly the operations that are safe, and the **lock queue** decides who waits when they are not.',
  ],
  visualizer: {
    title: 'A migration stalls the whole table',
    caption: 'Step through the lock queue, then switch the migration to `lock_timeout = 2s` and replay it. Below, click cells or two modes in the matrix to test any pair.',
    Component: TableLocksViz,
  },
  playground: {
    setup: `
CREATE TABLE orders (id int PRIMARY KEY, customer_id int NOT NULL, status text NOT NULL DEFAULT 'new');
INSERT INTO orders SELECT g, g % 100, 'new' FROM generate_series(1, 1000) g;
CREATE INDEX orders_customer_idx ON orders (customer_id);
-- runs SQL and returns the error instead of raising it
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'Locks a SELECT holds', sql: `BEGIN;
SELECT count(*) FROM orders WHERE customer_id = 7;
SELECT relation::regclass, mode, granted, fastpath
FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = 'relation';
COMMIT;`,
        note: '**AccessShareLock** on the table and on every index the plan may use, all taken through the **fast path** (`fastpath = true`): weak locks skip the shared lock table.' },
      { label: 'Locks an UPDATE holds', sql: `BEGIN;
UPDATE orders SET status = 'paid' WHERE id = 7;
SELECT locktype, relation::regclass, transactionid, mode, fastpath
FROM pg_locks WHERE pid = pg_backend_pid() ORDER BY locktype;
COMMIT;`,
        note: '**RowExclusiveLock** on the table and its indexes, plus an ExclusiveLock on the new xid. The row lock itself is not in `pg_locks`: it lives in the tuple.' },
      { label: 'ALTER TABLE lock levels', sql: `BEGIN;
ALTER TABLE orders ADD COLUMN note text;
SELECT 'ADD COLUMN' AS cmd, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid();
ROLLBACK;
BEGIN;
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 500;
SELECT 'SET STATISTICS' AS cmd, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid();
ROLLBACK;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS status_ok;
BEGIN;
ALTER TABLE orders ADD CONSTRAINT status_ok CHECK (status <> '') NOT VALID;
SELECT 'ADD CHECK NOT VALID' AS cmd, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid();
COMMIT;
BEGIN;
ALTER TABLE orders VALIDATE CONSTRAINT status_ok;
SELECT 'VALIDATE CONSTRAINT' AS cmd, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid();
COMMIT;
BEGIN;
CREATE INDEX orders_status_idx ON orders (status);
SELECT 'CREATE INDEX' AS cmd, mode FROM pg_locks WHERE relation = 'orders'::regclass AND pid = pg_backend_pid();
ROLLBACK;`,
        note: 'ADD COLUMN and ADD CONSTRAINT … NOT VALID take **AccessExclusive** but finish instantly. VALIDATE CONSTRAINT scans the table under the much weaker **ShareUpdateExclusive**, so writes continue. CREATE INDEX takes **Share**, which blocks writes.' },
      { label: 'PG18: NOT NULL in two steps', sql: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_email_nn;
UPDATE orders SET email = 'c' || customer_id || '@example.com' WHERE id <= 600;

BEGIN;
ALTER TABLE orders ADD CONSTRAINT orders_email_nn NOT NULL email NOT VALID;
SELECT 'ADD NOT NULL NOT VALID' AS step, mode FROM pg_locks
WHERE relation = 'orders'::regclass AND pid = pg_backend_pid();
COMMIT;

SELECT try_sql($$INSERT INTO orders (id, customer_id) VALUES (5001, 1)$$) AS new_row_without_email;
SELECT try_sql('ALTER TABLE orders VALIDATE CONSTRAINT orders_email_nn') AS validate_too_early;

UPDATE orders SET email = 'c' || customer_id || '@example.com' WHERE email IS NULL;
BEGIN;
ALTER TABLE orders VALIDATE CONSTRAINT orders_email_nn;
SELECT 'VALIDATE' AS step, mode FROM pg_locks
WHERE relation = 'orders'::regclass AND pid = pg_backend_pid();
COMMIT;
SELECT conname, contype, convalidated FROM pg_constraint WHERE conname = 'orders_email_nn';`,
        note: 'The NOT VALID constraint is added under AccessExclusive but without a scan, and it rejects new NULLs at once (**23502**). VALIDATE fails while 400 old rows are NULL. After the backfill it scans the table under **ShareUpdateExclusive**, so writes keep flowing, and `convalidated` turns true.' },
      { label: 'TRUNCATE vs DELETE', sql: `BEGIN;
DELETE FROM orders WHERE id > 900;
SELECT 'DELETE' AS cmd, mode FROM pg_locks
WHERE pid = pg_backend_pid() AND relation = 'orders'::regclass;
ROLLBACK;

BEGIN;
SELECT pg_relation_filenode('orders') AS file_before;
TRUNCATE orders;
SELECT pg_relation_filenode('orders') AS file_after;
SELECT 'TRUNCATE' AS cmd, mode FROM pg_locks
WHERE pid = pg_backend_pid() AND relation = 'orders'::regclass;
ROLLBACK;

SELECT count(*) AS rows_after_rollback FROM orders;`,
        note: 'DELETE takes **RowExclusive** and stamps `xmax` on each row, so readers and other writers carry on. TRUNCATE takes **AccessExclusive**, which blocks even SELECT, and points the table at a brand-new empty file. It is still transactional: after ROLLBACK the old file and all 1,000 rows are back. (The extra ShareLock row comes from rebuilding the table\'s indexes inside TRUNCATE.)' },
      { label: 'A transaction never blocks itself', sql: `BEGIN;
LOCK TABLE orders IN SHARE MODE;
LOCK TABLE orders IN ACCESS EXCLUSIVE MODE;
SELECT mode, granted, fastpath FROM pg_locks
WHERE relation = 'orders'::regclass AND pid = pg_backend_pid();
COMMIT;`,
        note: 'Share and AccessExclusive conflict, but **not with yourself**: both are granted. Strong modes always go to the main lock table (`fastpath = false`).' },
      { label: 'Timeouts and NOWAIT', sql: `SET lock_timeout = '2s';
SHOW lock_timeout;
BEGIN;
LOCK TABLE orders IN ACCESS EXCLUSIVE MODE NOWAIT;
SELECT pg_blocking_pids(pg_backend_pid()) AS blocked_by;
COMMIT;
RESET lock_timeout;`,
        note: 'With another session holding a lock, `NOWAIT` would fail at once and `lock_timeout` after 2 s, both with **55P03**. Alone, the lock is granted and nobody blocks us (`{}`).' },
      { label: 'Who is blocking whom', sql: `SELECT pid, state, wait_event_type, wait_event,
       pg_blocking_pids(pid) AS blocked_by,
       now() - xact_start AS xact_age, left(query, 40) AS query
FROM pg_stat_activity
WHERE backend_type = 'client backend' OR pid = pg_backend_pid()
ORDER BY xact_start NULLS LAST;

-- stop sessions idle in a transaction for over 10 minutes
SELECT pid, pg_terminate_backend(pid, 5000) AS gone
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND now() - state_change > interval '10 minutes';
SHOW max_locks_per_transaction;`,
        note: 'A waiting session has `wait_event_type = Lock` and a non-empty `blocked_by`; the oldest transaction is usually the root. `pg_cancel_backend` stops the running query, `pg_terminate_backend` ends the session and rolls back its transaction. With a timeout (ms) terminate returns true only once the process has exited. The lock table is sized by `max_locks_per_transaction` (objects, not rows).' },
    ],
  },
  production: {
    title: 'A one-line migration that took the API down',
    context: 'A deploy runs `ALTER TABLE orders ADD COLUMN note text` at midday. The statement is metadata-only and normally finishes in milliseconds.',
    problem: 'An analyst\'s session had run a SELECT on `orders` and stayed **idle in transaction**. The ALTER queued for ACCESS EXCLUSIVE behind it, and every API query on `orders` queued behind the ALTER. Connection pools filled and the API timed out, though no query was doing any work.',
    solution: 'Run DDL with a short `lock_timeout` in a retry loop, so the migration gives up instead of becoming the head of a queue. Cap idle transactions so the blocker cannot exist for long.',
    sql: `-- in the migration
SET lock_timeout = '2s';
ALTER TABLE orders ADD COLUMN note text;   -- on 55P03: sleep, retry (bounded)

-- on the server
ALTER ROLE analyst SET idle_in_transaction_session_timeout = '1min';`,
    outcome: 'The worst stall an API query can see from the migration drops from "as long as the oldest open transaction" to the 2-second timeout, and the migration still lands on a later retry.',
  },
  pitfalls: [
    { title: 'Assuming a waiting DDL is harmless',
      symptom: 'A blocked `ALTER TABLE` or `TRUNCATE` is followed by a pile-up of ordinary SELECTs on that table.',
      cause: 'Lock requests queue in order: a request that conflicts with a *waiting* ACCESS EXCLUSIVE request waits behind it, even if it is compatible with every granted lock.',
      fix: 'Always set `lock_timeout` for DDL, and check for long transactions first.',
      sql: `SELECT pid, now() - xact_start AS xact_age, state, left(query, 60)
FROM pg_stat_activity WHERE xact_start IS NOT NULL ORDER BY xact_start LIMIT 5;` },
    { title: 'CREATE INDEX blocks writes',
      symptom: 'INSERTs and UPDATEs stall for the whole duration of an index build.',
      cause: 'Plain `CREATE INDEX` takes **SHARE**, which conflicts with ROW EXCLUSIVE.',
      fix: 'Use `CREATE INDEX CONCURRENTLY`. It is not lock-free: it takes SHARE UPDATE EXCLUSIVE (blocking other DDL and VACUUM), waits for every existing transaction that could modify or use the new index, and cannot run inside a transaction block. A failed concurrent build leaves an INVALID index you must drop; a failed plain CREATE INDEX rolls back completely. For a new unique constraint, build `CREATE UNIQUE INDEX CONCURRENTLY` first, then `ADD CONSTRAINT … UNIQUE USING INDEX`.' },
    { title: 'Assuming TRUNCATE needs only a light lock',
      symptom: 'A nightly `TRUNCATE staging` hangs behind a long report, and every query on that table piles up behind it.',
      cause: 'A common claim is that TRUNCATE is fast because it uses lighter locking than DELETE. It takes **ACCESS EXCLUSIVE**, the strongest mode. It is fast because it swaps in a new empty file instead of marking each row, and so leaves no dead tuples to vacuum.',
      fix: 'Run TRUNCATE with a short `lock_timeout` and retry. When readers must never block, DELETE in batches instead, or rotate partitions (DETACH, then DROP).' },
    { title: 'SET NOT NULL on a big table',
      symptom: '`ALTER TABLE … ALTER COLUMN email SET NOT NULL` blocks all reads and writes on the table for minutes.',
      cause: 'SET NOT NULL scans every row to prove there are no NULLs, while holding ACCESS EXCLUSIVE for the whole scan.',
      fix: 'In PostgreSQL 18, add the constraint as `NOT NULL … NOT VALID` (instant), backfill in batches, then `VALIDATE CONSTRAINT`, which scans under SHARE UPDATE EXCLUSIVE while writes continue. Before 18: add `CHECK (email IS NOT NULL) NOT VALID`, `VALIDATE CONSTRAINT` it, then `SET NOT NULL` (which skips its scan because the valid CHECK proves it), then drop the CHECK.',
      sql: `ALTER TABLE users ADD CONSTRAINT users_email_nn NOT NULL email NOT VALID;
-- backfill in batches, then:
ALTER TABLE users VALIDATE CONSTRAINT users_email_nn;` },
    { title: 'Running out of lock table space',
      symptom: '`ERROR: out of shared memory`, `HINT: You might need to increase max_locks_per_transaction`, on queries over many partitions.',
      cause: 'Every table and index touched is one lock-table entry, held to transaction end. Thousands of partitions in one transaction can exhaust the shared lock table.',
      fix: 'Raise `max_locks_per_transaction` (server restart), and make sure partition pruning removes partitions at plan time.' },
  ],
  pointers: [
    'Eight modes from **ACCESS SHARE** (SELECT) to **ACCESS EXCLUSIVE** (DROP, TRUNCATE, most ALTER TABLE). Only ACCESS EXCLUSIVE blocks a plain SELECT.',
    'Locks are held to **transaction end**; a transaction never conflicts with its own locks.',
    'Waiters queue in order: a strong waiting request blocks newcomers too. Use `lock_timeout` for DDL.',
    'Find blockers with `pg_blocking_pids(pid)` and `pg_locks.granted = false`.',
    'Weak locks (ACCESS SHARE, ROW SHARE, ROW EXCLUSIVE) use the per-backend **fast path** when nothing conflicts.',
  ],
  sources: ['explicit-locking.html', 'sql-lock.html', 'sql-altertable.html', 'view-pg-locks.html', 'runtime-config-client.html', 'runtime-config-locks.html', 'functions-info.html'],
}
