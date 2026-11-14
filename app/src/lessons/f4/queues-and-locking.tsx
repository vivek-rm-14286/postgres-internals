import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Segmented, Tag, tone, type Tone } from '../../viz/kit'
import { NO_LIG, ResultTable, type ResultRow } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: simulated sessions (one lane per worker) on a scripted timeline, faithful to the
 * documented behaviour of FOR UPDATE SKIP LOCKED, ON CONFLICT DO NOTHING, row-count checks and
 * advisory locks. The playground runs the same statements in one session.
 * ---------------------------------------------------------------------------------------------- */

interface Lane { name: string; sql?: string; result?: string; t?: Tone; state?: string }
interface Snap { clock: string; lanes: Lane[]; caption: string; rows: ResultRow[]; fields: string[] }

const J = (id: number, status: string, lease: string, attempts: number, t?: Tone): ResultRow => ({ key: `j${id}`, cells: [id, status, lease, attempts], t })
const JF = ['id', 'status', 'locked_until', 'attempts']
const CLAIM = `UPDATE jobs SET status = 'running', attempts = attempts + 1,
       locked_until = now() + interval '30 seconds'
WHERE id = (SELECT id FROM jobs
            WHERE status = 'ready' OR (status = 'running' AND locked_until < now())
            ORDER BY id LIMIT 1
            FOR UPDATE SKIP LOCKED)
RETURNING id;`

const leaseSteps: Step<Snap>[] = [
  { title: 'Four jobs, three workers', body: 'A job is a row. Workers **claim** a row, **commit** at once, and keep only a **lease** (`locked_until`). No transaction stays open while the job runs.',
    state: { clock: '12:00:00', caption: 'jobs', fields: JF, rows: [J(1, 'ready', '', 0), J(2, 'ready', '', 0), J(3, 'ready', '', 0), J(4, 'ready', '', 0)],
      lanes: [{ name: 'W1', state: 'idle' }, { name: 'W2', state: 'idle' }, { name: 'W3', state: 'idle' }] } },
  { title: 'W1 and W2 claim at the same instant', body: 'Both subqueries see job 1 first. W1 locks it; W2 finds it locked and, with **SKIP LOCKED**, moves on to job 2 instead of waiting. No two workers ever get the same row.',
    state: { clock: '12:00:00', caption: 'jobs', fields: JF, rows: [J(1, 'running', '12:00:30', 1, 'tuple'), J(2, 'running', '12:00:30', 1, 'pointer'), J(3, 'ready', '', 0), J(4, 'ready', '', 0)],
      lanes: [{ name: 'W1', sql: CLAIM, result: 'id = 1 · COMMIT', t: 'tuple', state: 'claimed 1' }, { name: 'W2', sql: CLAIM, result: 'skips 1 (locked) → id = 2 · COMMIT', t: 'pointer', state: 'claimed 2' }, { name: 'W3', state: 'idle' }] } },
  { title: 'W3 claims job 3', body: 'Each claim is one short statement. Locks are released at COMMIT, so the next claimer only skips rows whose claim is still in flight.',
    state: { clock: '12:00:01', caption: 'jobs', fields: JF, rows: [J(1, 'running', '12:00:30', 1, 'tuple'), J(2, 'running', '12:00:30', 1, 'pointer'), J(3, 'running', '12:00:31', 1, 'header'), J(4, 'ready', '', 0)],
      lanes: [{ name: 'W1', state: 'working on 1' }, { name: 'W2', state: 'working on 2' }, { name: 'W3', sql: CLAIM, result: 'id = 3 · COMMIT', t: 'header', state: 'claimed 3' }] } },
  { title: 'W2 charges the card, then crashes', body: 'W2 wrote the payment with **idempotency key** `job-2`, then its process died before marking the job done. Job 2 is stuck in `running`, but nothing is locked: the lease will simply expire.',
    state: { clock: '12:00:08', caption: 'jobs', fields: JF, rows: [J(1, 'running', '12:00:30', 1, 'tuple'), J(2, 'running', '12:00:30', 1, 'dead'), J(3, 'running', '12:00:31', 1, 'header'), J(4, 'ready', '', 0)],
      lanes: [{ name: 'W1', state: 'working on 1' }, { name: 'W2', sql: "INSERT INTO payments (idempotency_key, amount)\nVALUES ('job-2', 49.00) ON CONFLICT DO NOTHING;", result: 'INSERT 0 1 · then the process dies', t: 'dead', state: 'crashed' }, { name: 'W3', state: 'working on 3' }] } },
  { title: 'W1 and W3 finish', body: 'Marking a job done is a plain UPDATE by id. Finished workers immediately claim again: W1 gets job 4.',
    state: { clock: '12:00:12', caption: 'jobs', fields: JF, rows: [J(1, 'done', '', 1, 'ok'), J(2, 'running', '12:00:30', 1, 'dead'), J(3, 'done', '', 1, 'ok'), J(4, 'running', '12:00:42', 1, 'tuple')],
      lanes: [{ name: 'W1', sql: "UPDATE jobs SET status = 'done' WHERE id = 1;\n-- then claim again", result: 'claimed 4', t: 'tuple', state: 'working on 4' }, { name: 'W2', state: 'down' }, { name: 'W3', sql: "UPDATE jobs SET status = 'done' WHERE id = 3;", result: 'UPDATE 1', t: 'ok', state: 'idle' }] } },
  { title: '12:00:31: the lease on job 2 has expired', body: "W3's claim query also accepts `running` rows whose `locked_until` is in the past, so job 2 is picked up again with `attempts = 2`.",
    state: { clock: '12:00:31', caption: 'jobs', fields: JF, rows: [J(1, 'done', '', 1), J(2, 'running', '12:01:01', 2, 'header'), J(3, 'done', '', 1), J(4, 'running', '12:00:42', 1, 'tuple')],
      lanes: [{ name: 'W1', state: 'working on 4' }, { name: 'W2', state: 'down' }, { name: 'W3', sql: CLAIM, result: 'id = 2 (expired lease) · COMMIT', t: 'header', state: 'claimed 2' }] } },
  { title: 'The retry cannot charge twice', body: "W3 re-runs job 2 from the start. Its payment insert hits the unique `idempotency_key` and **DO NOTHING** returns no row, so W3 knows the charge already happened and only marks the job done.",
    state: { clock: '12:00:32', caption: 'jobs', fields: JF, rows: [J(1, 'done', '', 1), J(2, 'done', '', 2, 'ok'), J(3, 'done', '', 1), J(4, 'running', '12:00:42', 1, 'tuple')],
      lanes: [{ name: 'W1', state: 'working on 4' }, { name: 'W2', state: 'down' }, { name: 'W3', sql: "INSERT INTO payments (idempotency_key, amount)\nVALUES ('job-2', 49.00) ON CONFLICT DO NOTHING\nRETURNING id;", result: 'INSERT 0 0 · no row → already charged', t: 'ok', state: 'done 2' }] } },
]

const A = (bal: number, ver: number, t?: Tone): ResultRow => ({ key: 'acc', cells: [42, bal, ver], t })
const AF = ['id', 'balance', 'version']
const optimisticSteps: Step<Snap>[] = [
  { title: 'Two editors open the same record', body: 'Both read `balance = 100, version = 7` and keep the version with the form. No lock is held while the user thinks.',
    state: { clock: 't0', caption: 'accounts', fields: AF, rows: [A(100, 7)], lanes: [{ name: 'A', sql: 'SELECT balance, version FROM accounts WHERE id = 42;', result: '100, v7', t: 'tuple' }, { name: 'B', sql: 'SELECT balance, version FROM accounts WHERE id = 42;', result: '100, v7', t: 'pointer' }] } },
  { title: 'A saves first', body: 'The UPDATE requires the version A read. It matches, so one row changes and the version moves to 8.',
    state: { clock: 't1', caption: 'accounts', fields: AF, rows: [A(80, 8, 'tuple')], lanes: [{ name: 'A', sql: 'UPDATE accounts SET balance = 80, version = version + 1\nWHERE id = 42 AND version = 7;', result: 'UPDATE 1', t: 'ok' }, { name: 'B', state: 'still editing' }] } },
  { title: 'B saves with a stale version', body: "B's WHERE asks for version 7, which no longer exists: **UPDATE 0**. Nothing was overwritten. Without the version check, B would silently erase A's change (a **lost update**).",
    state: { clock: 't2', caption: 'accounts', fields: AF, rows: [A(80, 8)], lanes: [{ name: 'A', state: 'done' }, { name: 'B', sql: 'UPDATE accounts SET balance = 130, version = version + 1\nWHERE id = 42 AND version = 7;', result: 'UPDATE 0 → conflict', t: 'dead' }] } },
  { title: 'B re-reads and retries', body: 'The application sees 0 rows, reloads (80, v8), re-applies its change (+30) and saves with version 8. The final balance includes both edits.',
    state: { clock: 't3', caption: 'accounts', fields: AF, rows: [A(110, 9, 'pointer')], lanes: [{ name: 'A', state: 'done' }, { name: 'B', sql: 'UPDATE accounts SET balance = 110, version = version + 1\nWHERE id = 42 AND version = 8;', result: 'UPDATE 1', t: 'ok' }] } },
]

const L = (holder: string, t?: Tone): ResultRow => ({ key: 'lk', cells: ['advisory', 42, holder], t })
const LF = ['locktype', 'objid', 'held by']
const advisorySteps: Step<Snap>[] = [
  { title: 'Two app servers run the same cron', body: 'Every instance schedules "rebuild the search index" at 03:00. Only one should run it. There is no row to lock: the job is an idea, not a record.',
    state: { clock: '03:00:00', caption: 'pg_locks', fields: LF, rows: [], lanes: [{ name: 'app-1', state: 'cron fires' }, { name: 'app-2', state: 'cron fires' }] } },
  { title: 'app-1 takes advisory lock 42', body: '`pg_try_advisory_lock(42)` returns **true** immediately. The key 42 means whatever the application decides; here, "the nightly rebuild".',
    state: { clock: '03:00:00', caption: 'pg_locks', fields: LF, rows: [L('app-1', 'tuple')], lanes: [{ name: 'app-1', sql: 'SELECT pg_try_advisory_lock(42);', result: 'true → run the job', t: 'ok' }, { name: 'app-2', state: 'cron fires' }] } },
  { title: 'app-2 tries and gets false', body: 'The `try` variant never waits. app-2 sees **false** and skips the run. The plain `pg_advisory_lock(42)` would block until app-1 released it.',
    state: { clock: '03:00:00', caption: 'pg_locks', fields: LF, rows: [L('app-1', 'tuple')], lanes: [{ name: 'app-1', state: 'rebuilding' }, { name: 'app-2', sql: 'SELECT pg_try_advisory_lock(42);', result: 'false → skip', t: 'dead' }] } },
  { title: 'Release, or let the session end', body: 'A **session-level** lock lasts until `pg_advisory_unlock(42)` or disconnect, even if a transaction rolls back. If app-1 crashes, its connection closes and the lock disappears.',
    state: { clock: '03:04:10', caption: 'pg_locks', fields: LF, rows: [], lanes: [{ name: 'app-1', sql: 'SELECT pg_advisory_unlock(42);', result: 'true', t: 'ok' }, { name: 'app-2', state: 'idle' }] } },
]

function LanesView({ s }: { s: Snap }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 text-xs text-muted"><Tag t="accent">{s.clock}</Tag> simulated sessions, one lane each</div>
      <div className={`grid gap-2 ${s.lanes.length === 3 ? 'md:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {s.lanes.map((l) => (
          <motion.div key={l.name} layout className="rounded-lg border bg-surface p-2" style={{ borderColor: l.t ? tone(l.t) : 'var(--line)' }}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold">{l.name}</span>
              {l.state && <span className="text-[11px] text-muted">{l.state}</span>}
            </div>
            {l.sql
              ? <motion.pre key={l.sql} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={NO_LIG} className="rounded bg-surface-2 p-1.5 font-mono text-[10.5px] leading-snug break-words whitespace-pre-wrap">{l.sql}</motion.pre>
              : <div className="rounded border border-dashed border-line p-2 text-center text-[11px] text-muted">no statement</div>}
            {l.result && <p className="mt-1 font-mono text-[11px] font-semibold" style={{ color: l.t ? tone(l.t) : undefined }}>→ {l.result}</p>}
          </motion.div>
        ))}
      </div>
      <ResultTable caption={s.caption} fields={s.fields} rows={s.rows} empty="(no advisory locks held)" />
    </div>
  )
}

type Mode = 'lease' | 'optimistic' | 'advisory'
function QueueViz() {
  const [mode, setMode] = useState<Mode>('lease')
  const steps = mode === 'lease' ? leaseSteps : mode === 'optimistic' ? optimisticSteps : advisorySteps
  const extra = <Segmented label="Pattern" value={mode} onChange={setMode} options={[['lease', 'Job queue'], ['optimistic', 'Optimistic update'], ['advisory', 'Singleton job']]} />
  return (
    <div className="grid gap-3">
      <Stepper key={mode} steps={steps} interval={2800} render={(s) => <LanesView s={s} />} extra={extra} />
      <Legend items={mode === 'lease'
        ? [['tuple', 'W1'], ['pointer', 'W2'], ['header', 'W3'], ['dead', 'crashed / stuck'], ['ok', 'done']]
        : [['ok', 'succeeded'], ['dead', 'conflict or refused'], ['tuple', 'first session'], ['pointer', 'second session']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'queues-and-locking',
  module: 'f4',
  order: 7,
  title: 'Job queues and concurrency patterns',
  tldr: [
    'A **job queue** in PostgreSQL is a table plus one claim statement, `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED LIMIT 1)`, that lets many workers take different rows without waiting for each other.',
    'Around it sit the patterns that make concurrent writes safe: **leases** for crashed workers, **idempotency keys** for retries, **version columns** against lost updates, and **advisory locks** for work that has no row.',
  ],
  visualizer: {
    title: 'Workers, leases and conflicts on a timeline',
    caption: 'Step through three workers claiming jobs with SKIP LOCKED, one crashing mid-job, and the retry that cannot double-charge. Switch to **Optimistic update** and **Singleton job** for the other two patterns.',
    Component: QueueViz,
  },
  playground: {
    setup: `
CREATE TABLE jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'running', 'done', 'failed')),
  attempts int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO jobs (kind, payload, status)
SELECT 'charge', jsonb_build_object('order', g, 'amount', 10 + g % 90),
       CASE WHEN g <= 49900 THEN 'done' ELSE 'ready' END
FROM generate_series(1, 50000) g;
-- only the 100 open jobs are indexed
CREATE INDEX jobs_open ON jobs (id) WHERE status IN ('ready', 'running');
CREATE TABLE payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idempotency_key text NOT NULL UNIQUE,
  amount numeric(10,2) NOT NULL);
CREATE TABLE accounts (id int PRIMARY KEY, balance numeric NOT NULL, version int NOT NULL DEFAULT 1);
INSERT INTO accounts VALUES (42, 100, 7);
ANALYZE;`,
    presets: [
      { label: '1. Claim one job', sql: `UPDATE jobs SET status = 'running', attempts = attempts + 1,
       locked_until = now() + interval '30 seconds'
WHERE id = (SELECT id FROM jobs
            WHERE status = 'ready'
               OR (status = 'running' AND locked_until < now())
            ORDER BY id
            LIMIT 1
            FOR UPDATE SKIP LOCKED)
RETURNING id, kind, payload, attempts;`,
        note: 'The subquery picks and row-locks the oldest open job; the UPDATE turns it into a lease and the statement commits on its own. A second worker running the same statement at the same moment would skip this row and get the next one.' },
      { label: '2. What the claim costs', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id FROM jobs
WHERE status = 'ready' OR (status = 'running' AND locked_until < now())
ORDER BY id LIMIT 1
FOR UPDATE SKIP LOCKED;`,
        note: 'The plan uses the small **partial index** `jobs_open`, which contains only the 100 open jobs, not the 49 900 finished ones. A **LockRows** node sits above the scan: that is where locked rows are skipped.' },
      { label: '3. Claim a batch', sql: `WITH batch AS (
  SELECT id FROM jobs
  WHERE status = 'ready'
  ORDER BY id LIMIT 10
  FOR UPDATE SKIP LOCKED)
UPDATE jobs j SET status = 'running', attempts = attempts + 1,
       locked_until = now() + interval '5 minutes'
FROM batch WHERE j.id = batch.id
RETURNING j.id;`,
        note: 'Ten jobs per round trip. The locking clause goes **inside** the CTE: a `FOR UPDATE` on the outer query does not reach into WITH queries.' },
      { label: '4. Idempotent side effects', sql: `INSERT INTO payments (idempotency_key, amount)
VALUES ('job-49901', 11.00) ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;

-- the retry of the same job
INSERT INTO payments (idempotency_key, amount)
VALUES ('job-49901', 11.00) ON CONFLICT (idempotency_key) DO NOTHING
RETURNING id;

SELECT count(*) AS payments FROM payments;`,
        note: 'The first insert returns an id, the retry returns **no row**: the unique key turned a double charge into a no-op the worker can detect. One payment exists.' },
      { label: '5. Optimistic concurrency', sql: `-- both sessions read version 7; A saves first
UPDATE accounts SET balance = 80, version = version + 1 WHERE id = 42 AND version = 7;
-- B saves with the version it read
UPDATE accounts SET balance = 130, version = version + 1 WHERE id = 42 AND version = 7;
-- B reloads and retries
SELECT balance, version FROM accounts WHERE id = 42;
UPDATE accounts SET balance = balance + 30, version = version + 1 WHERE id = 42 AND version = 8
RETURNING balance, version;`,
        note: 'Watch the command tags: `UPDATE 1`, then **`UPDATE 0`** for the stale version. The application must check the row count and retry. The final row is 110, version 9.' },
      { label: '6. Advisory locks', sql: `SELECT pg_try_advisory_lock(42) AS first_try,
       pg_try_advisory_lock(42) AS same_session_again;

SELECT locktype, objid, mode, granted FROM pg_locks WHERE locktype = 'advisory';

SELECT pg_advisory_unlock(42) AS u1, pg_advisory_unlock(42) AS u2;
SELECT count(*) AS still_held FROM pg_locks WHERE locktype = 'advisory';

-- transaction-scoped: released automatically at COMMIT
BEGIN;
SELECT pg_try_advisory_xact_lock(7) AS got_it;
COMMIT;`,
        note: 'The same session can take a lock it already holds; session locks **stack**, so two unlocks are needed. Another session would get `false`. The `xact` variant needs no unlock at all.' },
      { label: '7. Wake workers with NOTIFY', sql: `LISTEN jobs_ready;

BEGIN;
INSERT INTO jobs (kind, payload) VALUES ('charge', '{"order": 50001}');
SELECT pg_notify('jobs_ready', currval('jobs_id_seq')::text);
COMMIT;

UNLISTEN jobs_ready;
SELECT count(*) AS open_jobs FROM jobs WHERE status IN ('ready', 'running');`,
        note: 'A notification is delivered only when its transaction **commits**, so a worker can never be woken for a job it cannot see yet. Workers still poll occasionally: notifications are not stored for sessions that were not listening.' },
    ],
  },
  production: {
    title: 'An email queue that stalled under load',
    context: 'A SaaS app sends transactional email from a `jobs` table. Each worker ran `BEGIN; SELECT … FOR UPDATE LIMIT 1;`, sent the email, then marked the row done and committed.',
    problem: 'With 20 workers, all of them queued on the same first row: `FOR UPDATE` waits for the lock holder, so throughput was one email at a time. Every worker held a transaction open for the whole SMTP call, which also held back VACUUM, and a worker killed mid-send left an email that was sent twice after restart.',
    solution: 'Claim with **SKIP LOCKED** and commit immediately, recording a lease instead of holding a lock. Index only the open jobs. Make the side effect idempotent with a unique key, and wake idle workers with NOTIFY.',
    sql: `CREATE INDEX jobs_open ON jobs (id) WHERE status IN ('ready', 'running');

UPDATE jobs SET status = 'running', attempts = attempts + 1,
       locked_until = now() + interval '2 minutes'
WHERE id = (SELECT id FROM jobs
            WHERE status = 'ready' OR (status = 'running' AND locked_until < now())
            ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED)
RETURNING id, payload;

INSERT INTO sent_emails (idempotency_key) VALUES ('job-' || $1)
ON CONFLICT DO NOTHING RETURNING id;   -- no row: already sent`,
    outcome: 'Workers no longer wait for each other, so throughput scales with the number of workers until the mail provider is the limit. No transaction outlives one short statement, and a crashed worker\'s job is retried after its lease expires without a duplicate email.',
  },
  pitfalls: [
    { title: 'Holding the lock for the whole job',
      symptom: 'Long-running transactions in `pg_stat_activity`, growing dead tuples, and workers stuck behind each other.',
      cause: 'A row lock lives until the transaction ends. Keeping the claim transaction open while the job runs blocks VACUUM cleanup and, without SKIP LOCKED, serializes workers.',
      fix: 'Claim and commit in one statement, store a lease (`locked_until`), and finish the job with a separate short UPDATE.' },
    { title: 'Jobs that are never retried',
      symptom: 'Rows stuck in `running` forever after a deploy or a crash.',
      cause: 'Nothing returns a claimed row to the queue when its worker dies.',
      fix: 'Let the claim query also take `running` rows whose lease has expired, count `attempts`, and move rows over a limit to `failed` for inspection. Make the lease longer than the slowest job (or extend it with a heartbeat UPDATE), and finish with `WHERE id = $1 AND attempts = $2` so a worker that lost its lease changes nothing.' },
    { title: 'Retries that repeat side effects',
      symptom: 'Customers charged twice or emailed twice after a worker restart.',
      cause: 'At-least-once delivery means a job can run again after its side effect succeeded but before it was marked done.',
      fix: 'Give every side effect an **idempotency key** with a unique index and `ON CONFLICT DO NOTHING RETURNING`. No row back means "already done".' },
    { title: 'Ignoring the row count of an optimistic update',
      symptom: 'Users\' edits vanish with no error.',
      cause: '`UPDATE … WHERE version = $v` that matches nothing is not an error. It reports `UPDATE 0`.',
      fix: 'Check the affected row count in the application. On 0, reload, re-apply the change and retry, or show a conflict to the user.' },
    { title: 'Advisory locks and LISTEN behind a pooler',
      symptom: 'A singleton job runs twice, an unlock returns false with a warning, or workers never receive notifications.',
      cause: 'Session-level advisory locks and `LISTEN` belong to one server connection. A pooler in transaction mode hands each transaction a different one, so the lock is taken on one connection and released on another.',
      fix: 'Use `pg_advisory_xact_lock` inside a single transaction, and give listeners a direct session connection. See [Connection pooling](/m7/connection-pooling).' },
  ],
  pointers: [
    'Claim: `UPDATE … WHERE id = (SELECT id … ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING …`, then commit.',
    'Index only open jobs with a **partial index**, use a **lease** for crashes and an **idempotency key** for retries.',
    'Optimistic concurrency: `WHERE version = $read_version`; `UPDATE 0` means someone else won.',
    'Advisory locks lock an idea: `pg_try_advisory_lock(key)` for singleton jobs; session locks stack, `xact` locks free themselves at commit.',
    '**Going deeper:** [Row locks, SKIP LOCKED and advisory locks](/m5/row-locks-skip-locked) shows how row locks are stored and which modes conflict.',
  ],
  sources: ['sql-select.html', 'explicit-locking.html', 'functions-admin.html', 'sql-notify.html', 'sql-listen.html', 'sql-insert.html', 'indexes-partial.html', 'dml-update.html', 'queries-with.html'],
}
