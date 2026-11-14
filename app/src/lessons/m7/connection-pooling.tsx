import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: four application clients share two PostgreSQL server connections through a pooler such
 * as PgBouncer (third-party software; PGlite has a single backend, so this is a scripted simulation).
 * Pooling modes as PgBouncer defines them: session (server held until the client disconnects),
 * transaction (held for one transaction), statement (held for one statement; multi-statement
 * transactions are refused). The PostgreSQL side (session state, advisory locks, LISTEN) follows the docs.
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'session' | 'transaction' | 'statement'
interface Srv { name: string; client?: string; state: string[] }
interface Cli { name: string; status: 'idle' | 'active' | 'waiting' | 'error'; on?: string }
interface S { servers: Srv[]; clients: Cli[]; log?: { who: string; sql: string; res: string; t: Tone } }

const C0: Cli[] = ['A', 'B', 'C', 'D'].map((n) => ({ name: n, status: 'idle' }))
const srv = (a: string[] = [], b: string[] = [], ca?: string, cb?: string): Srv[] => [{ name: 'S1', client: ca, state: a }, { name: 'S2', client: cb, state: b }]
const cli = (over: Record<string, Partial<Cli>>): Cli[] => C0.map((c) => ({ ...c, ...over[c.name] }))

function steps(mode: Mode): Step<S>[] {
  if (mode === 'transaction') return [
    { title: 'Transaction pooling: a server per transaction', body: 'Four clients, `default_pool_size = 2`. A server connection is lent for **one transaction** and returned. Two PostgreSQL backends serve all four clients.',
      state: { servers: srv(), clients: C0 } },
    { title: "A: SET search_path = tenant_a", body: 'Runs on **S1**, then S1 goes back to the pool. The setting stays on S1, not with client A.',
      state: { servers: srv(['search_path=tenant_a']), clients: cli({ A: { status: 'active', on: 'S1' } }), log: { who: 'A', sql: 'SET search_path = tenant_a', res: 'SET', t: 'ok' } } },
    { title: 'A: PREPARE get_user AS SELECT …', body: 'The next transaction happens to get **S2**. The prepared statement now lives on S2.',
      state: { servers: srv(['search_path=tenant_a'], ['prepared get_user']), clients: cli({ A: { status: 'active', on: 'S2' } }), log: { who: 'A', sql: 'PREPARE get_user(int) AS SELECT …', res: 'PREPARE', t: 'ok' } } },
    { title: 'B: SELECT pg_advisory_lock(42)', body: 'B gets **S1**. A session-level advisory lock belongs to the *backend*, so S1 now holds lock 42 after B\'s statement ends.',
      state: { servers: srv(['search_path=tenant_a', 'advisory lock 42'], ['prepared get_user']), clients: cli({ B: { status: 'active', on: 'S1' } }), log: { who: 'B', sql: 'SELECT pg_advisory_lock(42)', res: 'lock granted', t: 'ok' } } },
    { title: 'A: EXECUTE get_user(1)', body: 'A lands on **S1**, which never saw the PREPARE: `ERROR: prepared statement "get_user" does not exist`. (PgBouncer 1.21+ can track *protocol-level* prepared statements; SQL `PREPARE` is never tracked.)',
      state: { servers: srv(['search_path=tenant_a', 'advisory lock 42'], ['prepared get_user']), clients: cli({ A: { status: 'error', on: 'S1' } }), log: { who: 'A', sql: 'EXECUTE get_user(1)', res: 'ERROR: prepared statement "get_user" does not exist', t: 'dead' } } },
    { title: 'C: BEGIN; UPDATE …; UPDATE …; COMMIT', body: 'A real transaction keeps **S2** from BEGIN to COMMIT, so multi-statement transactions work fine.',
      state: { servers: srv(['search_path=tenant_a', 'advisory lock 42'], ['prepared get_user'], undefined, 'C'), clients: cli({ C: { status: 'active', on: 'S2' } }), log: { who: 'C', sql: 'BEGIN; UPDATE …; UPDATE …; COMMIT', res: 'COMMIT', t: 'ok' } } },
    { title: 'D: SELECT * FROM accounts', body: 'D gets **S1**, which still has A\'s `search_path`. The unqualified name resolves to `tenant_a.accounts`: **D reads another tenant\'s data**.',
      state: { servers: srv(['search_path=tenant_a', 'advisory lock 42'], ['prepared get_user']), clients: cli({ D: { status: 'error', on: 'S1' } }), log: { who: 'D', sql: 'SELECT * FROM accounts', res: 'rows from tenant_a.accounts (wrong tenant)', t: 'dead' } } },
    { title: 'B: SELECT pg_advisory_unlock(42)', body: 'B gets **S2**, which does not hold the lock: it returns `false` with a WARNING. Lock 42 stays held by S1 for as long as that server connection lives.',
      state: { servers: srv(['search_path=tenant_a', 'advisory lock 42'], ['prepared get_user']), clients: cli({ B: { status: 'error', on: 'S2' } }), log: { who: 'B', sql: 'SELECT pg_advisory_unlock(42)', res: 'false · WARNING: you don\'t own a lock of type ExclusiveLock', t: 'dead' } } },
    { title: 'The rule: keep state inside the transaction', body: 'Use `SET LOCAL`, `pg_advisory_xact_lock`, protocol-level prepared statements (with pooler support) and schema-qualified names. `LISTEN` and session temp tables need session pooling.',
      state: { servers: srv(['search_path=tenant_a', 'advisory lock 42'], ['prepared get_user']), clients: C0 } },
  ]
  if (mode === 'session') return [
    { title: 'Session pooling: a server per client connection', body: 'A client keeps its server until it **disconnects**. Session state is safe, but two servers can serve only two connected clients at a time.',
      state: { servers: srv(), clients: C0 } },
    { title: "A connects: SET, PREPARE, EXECUTE", body: 'A is pinned to **S1** for its whole session, so its `SET` and `PREPARE` are always there when it needs them.',
      state: { servers: srv(['search_path=tenant_a', 'prepared get_user'], [], 'A'), clients: cli({ A: { status: 'active', on: 'S1' } }), log: { who: 'A', sql: 'SET …; PREPARE …; EXECUTE get_user(1)', res: 'ok', t: 'ok' } } },
    { title: 'B connects: pg_advisory_lock(42) … unlock', body: 'B is pinned to **S2**. Lock and unlock run on the same backend, as the application expects.',
      state: { servers: srv(['search_path=tenant_a', 'prepared get_user'], ['advisory lock 42'], 'A', 'B'), clients: cli({ A: { status: 'idle', on: 'S1' }, B: { status: 'active', on: 'S2' } }), log: { who: 'B', sql: 'SELECT pg_advisory_lock(42)', res: 'lock granted', t: 'ok' } } },
    { title: 'C and D connect: no server left', body: 'Both servers are pinned to clients that are **idle**, so C and D wait in the pooler queue. This is the cost of session pooling.',
      state: { servers: srv(['search_path=tenant_a', 'prepared get_user'], ['advisory lock 42'], 'A', 'B'), clients: cli({ A: { on: 'S1' }, B: { on: 'S2' }, C: { status: 'waiting' }, D: { status: 'waiting' } }), log: { who: 'C', sql: 'BEGIN; UPDATE …', res: 'waiting for a server connection', t: 'new' } } },
    { title: 'A disconnects: reset, then hand S1 to C', body: 'The pooler runs `server_reset_query` (by default `DISCARD ALL`) on S1, wiping A\'s settings and prepared statements, then gives S1 to C.',
      state: { servers: srv([], ['advisory lock 42'], 'C', 'B'), clients: cli({ B: { on: 'S2' }, C: { status: 'active', on: 'S1' }, D: { status: 'waiting' } }), log: { who: 'C', sql: 'BEGIN; UPDATE …; COMMIT', res: 'COMMIT', t: 'ok' } } },
    { title: 'Correct, but no multiplexing', body: 'Session pooling saves the **connection setup** cost (a fork and authentication per connection) but not backends: N connected clients still need N servers.',
      state: { servers: srv([], ['advisory lock 42'], 'C', 'B'), clients: cli({ B: { on: 'S2' }, C: { on: 'S1' }, D: { status: 'waiting' } }) } },
  ]
  return [
    { title: 'Statement pooling: a server per statement', body: 'The server goes back to the pool after **every statement**. Only autocommit statements make sense here.',
      state: { servers: srv(), clients: C0 } },
    { title: 'A: SELECT balance FROM accounts WHERE id = 7', body: 'Single autocommit statements multiplex perfectly: this is what statement mode is for.',
      state: { servers: srv(), clients: cli({ A: { status: 'active', on: 'S1' } }), log: { who: 'A', sql: 'SELECT balance FROM accounts WHERE id = 7', res: '1 row', t: 'ok' } } },
    { title: 'C: BEGIN; UPDATE …; UPDATE …; COMMIT', body: 'Refused: a multi-statement transaction would need the same server for several statements. PgBouncer reports that transaction blocks are not allowed in statement mode.',
      state: { servers: srv(), clients: cli({ C: { status: 'error' } }), log: { who: 'C', sql: 'BEGIN', res: 'ERROR: transaction blocks not allowed in statement pooling mode', t: 'dead' } } },
    { title: 'B: SELECT pg_advisory_lock(42)', body: 'Session-level state still leaks exactly as in transaction mode: the lock stays on S2 after the statement.',
      state: { servers: srv([], ['advisory lock 42']), clients: cli({ B: { status: 'active', on: 'S2' } }), log: { who: 'B', sql: 'SELECT pg_advisory_lock(42)', res: 'lock granted (and leaked)', t: 'new' } } },
    { title: 'Use it for simple read paths only', body: 'Statement mode fits key-value style autocommit lookups. Anything with BEGIN, session settings or locks needs transaction or session mode.',
      state: { servers: srv([], ['advisory lock 42']), clients: C0 } },
  ]
}

const stTone: Record<Cli['status'], Tone> = { idle: 'muted', active: 'ok', waiting: 'new', error: 'dead' }

function PoolViz() {
  const [mode, setMode] = useState<Mode>('transaction')
  return (
    <Stepper key={mode} steps={steps(mode)} interval={3400}
      extra={<Segmented label="pool_mode" value={mode} onChange={setMode} options={[['session', 'session'], ['transaction', 'transaction'], ['statement', 'statement']]} />}
      render={(s) => (
        <div className="grid gap-3 [&>*]:min-w-0">
          <Legend items={[['ok', 'running / fine'], ['new', 'waiting / leaked'], ['dead', 'broken'], ['header', 'session state on a server']]} />
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="grid grid-cols-2 gap-2">
              {s.clients.map((c) => (
                <motion.div key={c.name} layout className="rounded-lg border p-2" style={{ borderColor: tone(stTone[c.status]), background: toneBg(stTone[c.status], c.status === 'idle' ? 6 : 16) }}>
                  <p className="text-sm font-bold">client {c.name}</p>
                  <p className="font-mono text-[11px] text-muted">{c.status}{c.on ? ` → ${c.on}` : ''}</p>
                </motion.div>
              ))}
            </div>
            <div className="rounded-lg border border-dashed border-line px-3 py-6 text-center">
              <p className="text-xs font-bold">PgBouncer</p>
              <p className="font-mono text-[11px] text-muted">pool_mode = {mode}</p>
              <p className="font-mono text-[11px] text-muted">default_pool_size = 2</p>
            </div>
            <div className="grid gap-2">
              {s.servers.map((v) => {
                const user = s.clients.find((c) => c.on === v.name && c.status !== 'idle')
                return (
                <motion.div key={v.name} layout className="rounded-lg border p-2" animate={{ borderWidth: user ? 2.5 : 1 }}
                  style={{ borderColor: tone(user ? stTone[user.status] : 'tuple'), background: toneBg('tuple', 8) }}>
                  <p className="text-sm font-bold">{v.name} <span className="font-mono text-[11px] font-normal text-muted">postgres backend{user ? ` · running ${user.name}'s statement` : v.client ? ` · held by ${v.client}` : ' · in pool'}</span></p>
                  <div className="mt-1 flex min-h-6 flex-wrap gap-1">
                    <AnimatePresence>
                      {v.state.map((x) => (
                        <motion.span key={x} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className="rounded px-1.5 py-0.5 font-mono text-[10.5px]" style={{ background: toneBg('header', 20), color: tone('header') }}>{x}</motion.span>
                      ))}
                    </AnimatePresence>
                    {v.state.length === 0 && <span className="text-[11px] text-muted">clean</span>}
                  </div>
                </motion.div>
              )})}
            </div>
          </div>
          <div className="min-h-[52px] rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs">
            {s.log ? <>
              <p><b>{s.log.who}</b> › {s.log.sql}</p>
              <p style={{ color: tone(s.log.t) }}>{s.log.res}</p>
            </> : <p className="text-muted">no statement yet</p>}
          </div>
          <p className="text-xs text-muted"><Md>{'The pooler is a separate program in front of PostgreSQL. What it can break is PostgreSQL session state: settings, prepared statements, advisory locks and LISTEN belong to a backend, and the playground below lets you inspect each one.'}</Md></p>
        </div>
      )} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

const INVENTORY = `SELECT current_setting('search_path') AS search_path,
       (SELECT count(*) FROM pg_prepared_statements) AS prepared,
       (SELECT count(*) FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()) AS advisory_locks,
       (SELECT count(*) FROM pg_listening_channels()) AS listening,
       (SELECT count(*) FROM pg_class WHERE relpersistence = 't') AS temp_tables;`

export const lesson: Lesson = {
  slug: 'connection-pooling',
  module: 'm7',
  order: 10,
  title: 'Connection pooling',
  tldr: [
    'Every PostgreSQL connection is a separate backend process with its own memory and session state, so thousands of mostly idle connections waste RAM and slots up to `max_connections`.',
    'A **pooler** such as PgBouncer lets many clients share a few server connections, and its pooling mode decides which session features, such as `SET`, prepared statements, advisory locks and `LISTEN`, still behave correctly.',
  ],
  visualizer: {
    title: 'Four clients, two server connections',
    caption: 'Step through the same client script in **transaction**, **session** and **statement** mode and watch where session state lands and what breaks.',
    Component: PoolViz,
  },
  playground: {
    setup: `
CREATE SCHEMA tenant_a;
CREATE SCHEMA tenant_b;
CREATE TABLE tenant_a.accounts (id int PRIMARY KEY, owner text);
CREATE TABLE tenant_b.accounts (id int PRIMARY KEY, owner text);
INSERT INTO tenant_a.accounts VALUES (1, 'alice@a');
INSERT INTO tenant_b.accounts VALUES (1, 'bob@b');
-- run a statement and return its error text instead of failing
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN 'ERROR: ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'Session state a pooler can leak', sql: `SET search_path = tenant_a, public;
PREPARE get_owner(int) AS SELECT owner FROM accounts WHERE id = $1;
SELECT pg_advisory_lock(42);
LISTEN jobs;
CREATE TEMP TABLE scratch (x int);

${INVENTORY}
EXECUTE get_owner(1);`,
        note: 'All five live in **this backend**, not in the client. Under transaction pooling the next client on this server connection would inherit them, including the tenant_a search_path.' },
      { label: 'DISCARD ALL wipes it', sql: `DISCARD ALL;

${INVENTORY}`,
        note: '`DISCARD ALL` resets settings to their defaults, drops prepared statements and temp tables, releases session advisory locks and stops listening: every count is back to 0. Session-mode poolers run it between clients.' },
      { label: 'Transaction-scoped alternatives', sql: `BEGIN;
SET LOCAL search_path = tenant_b, public;
SELECT pg_advisory_xact_lock(42);
SELECT owner FROM accounts WHERE id = 1;
${INVENTORY}
COMMIT;

${INVENTORY}`,
        note: '`SET LOCAL` and `pg_advisory_xact_lock` end with the transaction, so nothing survives COMMIT. This is what is safe under transaction pooling.' },
      { label: 'Per-request context: set_config(…, true)', sql: `SELECT current_setting('app.tenant', true) AS before_any_set;

BEGIN;
SELECT set_config('app.tenant', 'tenant_b', true) AS set_for_this_transaction;
SELECT current_setting('app.tenant', true) AS inside_transaction;
COMMIT;

SELECT current_setting('app.tenant', true) AS after_commit,
       current_setting('app.tenant', true) IS NULL AS is_null;
SELECT try_sql($$SELECT current_setting('app.never_set')$$) AS without_missing_ok;`,
        note: 'The third argument `true` makes the value transaction-local, like `SET LOCAL`, so a tenant id used by row-level security policies cannot leak to the next client on the connection. Afterwards the value is an **empty string**, not NULL. Without `missing_ok = true`, reading a name that was never set raises an error.' },
      { label: 'What one connection costs', sql: `SELECT pg_size_pretty(sum(total_bytes)) AS this_backend_memory, count(*) AS memory_contexts
FROM pg_backend_memory_contexts;

SELECT name, setting FROM pg_settings
WHERE name IN ('max_connections', 'superuser_reserved_connections', 'reserved_connections', 'work_mem')
ORDER BY name;
SELECT pid, backend_type, state FROM pg_stat_activity;`,
        note: 'Even this idle backend holds about 2 MB in memory contexts (caches, plans), before any query runs, and each query can add `work_mem` per sort or hash node. The playground has one standalone backend; a server forks one process per connection.' },
      { label: 'Timeouts that protect a pool', sql: `SELECT name, setting, unit FROM pg_settings
WHERE name IN ('idle_in_transaction_session_timeout', 'idle_session_timeout', 'transaction_timeout',
               'statement_timeout', 'lock_timeout')
ORDER BY name;

SET idle_in_transaction_session_timeout = '30s';
SHOW idle_in_transaction_session_timeout;`,
        note: 'All are off (0) by default. `idle_in_transaction_session_timeout` kills sessions that sit in an open transaction holding locks and an old snapshot; `idle_session_timeout` is dangerous behind a pooler, which keeps idle server connections on purpose.' },
      { label: 'Idle in transaction holds an XID', sql: `BEGIN;
UPDATE tenant_a.accounts SET owner = owner WHERE id = 1;
SELECT pid, state, backend_xid, backend_xmin, xact_start IS NOT NULL AS in_xact
FROM pg_stat_activity WHERE pid = pg_backend_pid();
COMMIT;`,
        note: 'While a transaction stays open its `backend_xid` and snapshot hold back VACUUM cluster-wide. A pooled client that forgets COMMIT pins a server connection and the cleanup horizon.' },
      { label: 'Find the sessions that hog the pool', sql: `SELECT pid, usename, application_name, state,
       now() - xact_start  AS xact_open_for,
       now() - state_change AS in_state_for,
       left(query, 40)     AS last_query
FROM pg_stat_activity
WHERE backend_type = 'client backend' OR backend_type = 'standalone backend'
ORDER BY xact_start NULLS LAST;

SELECT pg_get_function_arguments('pg_terminate_backend'::regproc) AS terminate_signature;`,
        note: 'On a server, sort `idle in transaction` sessions by `xact_open_for` to find the ones holding connections and snapshots. `pg_terminate_backend(pid)` returns true once the signal is **sent**; with a `timeout` in ms it returns true only if the backend actually exited.' },
    ],
  },
  production: {
    title: 'From 4,000 connections to 60',
    context: 'A Kubernetes deployment runs 200 pods, each with a client-side pool of 20 connections, against one primary: 4,000 connections, almost all idle.',
    problem: 'The server needed `max_connections = 5000`; each backend kept its own caches and memory even when idle, connection storms during deploys forked hundreds of processes at once, and snapshot work grows with the number of backends.',
    solution: 'Put PgBouncer in transaction mode in front of the primary with a small server pool, shrink the per-pod pools, and remove session state from the application: `SET LOCAL` instead of `SET`, transaction-level advisory locks, schema-qualified names, protocol-level prepared statements with `max_prepared_statements` enabled.',
    sql: `; pgbouncer.ini
[databases]
app = host=10.0.0.5 dbname=app
[pgbouncer]
pool_mode = transaction
default_pool_size = 60
max_client_conn = 5000
max_prepared_statements = 200

-- server side
ALTER SYSTEM SET max_connections = 200;
ALTER ROLE app SET idle_in_transaction_session_timeout = '30s';`,
    outcome: 'The primary serves the same traffic with about 60 busy backends instead of 4,000 mostly idle ones, deploys no longer cause fork storms, and memory goes to `shared_buffers` and `work_mem` instead of idle processes. A sensible pool size is a small multiple of CPU cores, measured under load.',
  },
  pitfalls: [
    { title: 'Session SET under transaction pooling',
      symptom: 'Requests intermittently see another tenant\'s data, the wrong time zone, or a stray `statement_timeout`.',
      cause: 'A plain `SET` sticks to the server connection, which the pooler hands to the next client.',
      fix: 'Use `SET LOCAL` inside a transaction, or pass settings per role/database (`ALTER ROLE … SET`). Schema-qualify names instead of relying on `search_path`.',
      sql: `BEGIN; SET LOCAL search_path = tenant_b; SELECT …; COMMIT;` },
    { title: 'Session advisory locks that never unlock',
      symptom: 'A job scheduler using `pg_advisory_lock` stops running jobs; `pg_locks` shows advisory locks held by idle connections.',
      cause: 'Lock and unlock ran on different server connections, so the unlock returned false and the lock stayed with the first backend.',
      fix: 'Use `pg_advisory_xact_lock` (released at COMMIT) or route lock holders through a session-mode pool.' },
    { title: 'Prepared statements "do not exist"',
      symptom: '`ERROR: prepared statement "S_1" does not exist` after enabling transaction pooling.',
      cause: 'The driver prepared on one server connection and executed on another.',
      fix: 'Enable the pooler\'s prepared-statement support (PgBouncer 1.21+ `max_prepared_statements`) for protocol-level statements, or disable server-side prepares in the driver. SQL-level `PREPARE` is never safe in transaction mode.' },
    { title: 'A new connection for every query',
      symptom: 'Latency is dominated by connection setup, CPU shows constant process creation, and with `log_connections` on the log records one new connection per request.',
      cause: 'Helper functions open and close their own connection on every call. Each one is a fork of a new backend plus authentication and cache warm-up, often several milliseconds before the first query runs.',
      fix: 'Create one pool per application process (the driver\'s built-in pool or a pool library) and borrow from it per request; add a server-side pooler when many processes connect.' },
    { title: 'Drivers that leave transactions open',
      symptom: '`pg_stat_activity` shows many `idle in transaction` sessions whose last query is a plain SELECT, and VACUUM stops removing dead rows.',
      cause: 'With autocommit off, many drivers send BEGIN before the first statement. A read-only request that never commits keeps its transaction, snapshot and server connection open.',
      fix: 'Use autocommit for read paths, always end transactions (commit or rollback in a `finally`), and set `idle_in_transaction_session_timeout` as a backstop.',
      sql: `ALTER ROLE app SET idle_in_transaction_session_timeout = '30s';` },
  ],
  pointers: [
    'One connection = **one backend process** with private memory; `max_connections` (100) sizes shared memory and slots.',
    '**Session** mode: safe but no multiplexing. **Transaction** mode: multiplexes, breaks session state. **Statement** mode: autocommit only.',
    'Session state lives in the backend: **SET, PREPARE, session advisory locks, LISTEN, temp tables**; `DISCARD ALL` resets it.',
    'Transaction-safe forms: **`SET LOCAL`**, **`pg_advisory_xact_lock`**, schema-qualified names.',
    'Guard the pool with **`idle_in_transaction_session_timeout`**; avoid `idle_session_timeout` behind a pooler.',
  ],
  sources: ['runtime-config-connection.html', 'runtime-config-client.html', 'sql-discard.html', 'sql-prepare.html', 'sql-set.html', 'explicit-locking.html', 'functions-admin.html', 'sql-listen.html', 'monitoring-stats.html'],
}
