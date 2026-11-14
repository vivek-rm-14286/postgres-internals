import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Graph, LockList, ScenarioStepper, type GEdge, type LockRow, type TEvent, type TLane, type TStep } from './_timeline'

/* ------------------------------------------------------------------------------------------------
 * Part 1: the docs' two-account deadlock (Section 13.3.4), simulated on a millisecond timeline.
 * After deadlock_timeout (1 s default) the waiting backend runs the deadlock check, walks the
 * waits-for graph, finds the cycle and aborts itself with 40P01. Toggle "consistent lock order".
 * Part 2: the lock hierarchy, with wait events from a real pg_wait_events query.
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'deadlock' | 'ordered'
interface X { locks: LockRow[]; edges: GEdge[]; cycle?: boolean }

const lanes: TLane[] = [{ id: 'A', name: 'Session A · pid 4710', note: 'xid 960' }, { id: 'B', name: 'Session B · pid 4711', note: 'xid 961' }]
const xA: LockRow = { lane: 'A', locktype: 'transactionid', target: '960', mode: 'ExclusiveLock', granted: true }
const xB: LockRow = { lane: 'B', locktype: 'transactionid', target: '961', mode: 'ExclusiveLock', granted: true }
const bWaits: LockRow = { lane: 'B', locktype: 'transactionid', target: '960', mode: 'ShareLock', granted: false }
const aWaits: LockRow = { lane: 'A', locktype: 'transactionid', target: '961', mode: 'ShareLock', granted: false }
const eBA: GEdge = { from: 'B', to: 'A', label: 'row 11111' }
const eAB: GEdge = { from: 'A', to: 'B', label: 'row 22222' }

const evDead: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: 'BEGIN;\nUPDATE accounts SET balance = balance + 100\n WHERE acctnum = 11111;', out: 'row 11111 locked by 960' },
  { lane: 'B', at: 1, kind: 'sql', sql: 'BEGIN;\nUPDATE accounts SET balance = balance + 100\n WHERE acctnum = 22222;', out: 'row 22222 locked by 961' },
  { lane: 'B', at: 2, kind: 'sql', sql: 'UPDATE accounts SET balance = balance - 100\n WHERE acctnum = 11111;' },
  { lane: 'B', at: 3, until: 6, kind: 'wait', out: 'waits for **ShareLock on transaction 960** · deadlock_timeout timer starts' },
  { lane: 'A', at: 4, kind: 'sql', sql: 'UPDATE accounts SET balance = balance - 100\n WHERE acctnum = 22222;' },
  { lane: 'A', at: 5, until: 7, kind: 'wait', out: 'waits for **ShareLock on transaction 961** · its own timer starts' },
  { lane: 'B', at: 6, kind: 'err', out: 'B\'s timer fires first → deadlock check finds B → A → B · **ERROR: deadlock detected (40P01)** · Process 4711 waits for ShareLock on transaction 960; blocked by process 4710. Process 4710 waits for ShareLock on transaction 961; blocked by process 4711.' },
  { lane: 'A', at: 7, kind: 'grant', out: 'B\'s locks are gone · A\'s UPDATE completes' },
  { lane: 'A', at: 8, kind: 'ok', sql: 'COMMIT;', out: 'B must retry its whole transaction' },
]
const stDead: TStep<X>[] = [
  { tick: 0, title: 'A locks row 11111', body: 'The UPDATE locks the row (in the tuple) and A holds an ExclusiveLock on its own xid, **960**, which is what others wait on.', badges: { A: { xid: '960' } }, x: { locks: [xA], edges: [] } },
  { tick: 1, title: 'B locks row 22222', body: 'B does the same on the other row with xid **961**. No conflict yet.', badges: { A: { xid: '960' }, B: { xid: '961' } }, x: { locks: [xA, xB], edges: [] } },
  { tick: 2, title: 'B wants row 11111', body: 'Row 11111 carries `xmax = 960`, a live transaction. B must wait for 960 to finish.', badges: { A: { xid: '960' }, B: { xid: '961' } }, x: { locks: [xA, xB], edges: [] } },
  { tick: 3, title: 'B sleeps on 960', body: 'B requests **ShareLock on transaction 960** and goes to sleep. It does not check for deadlocks now: it arms a **deadlock_timeout** timer (1 s).', badges: { A: { xid: '960' }, B: { xid: '961', extra: 'waiting', extraTone: 'dead' } }, x: { locks: [xA, xB, bWaits], edges: [eBA] } },
  { tick: 4, title: 'A wants row 22222', body: 'Row 22222 carries `xmax = 961`. A must wait for B.', badges: { A: { xid: '960' }, B: { xid: '961', extra: 'waiting', extraTone: 'dead' } }, x: { locks: [xA, xB, bWaits], edges: [eBA] } },
  { tick: 5, title: 'A sleeps on 961: a cycle', body: 'Now **A waits for B and B waits for A**. Neither can ever wake up on its own. Nothing notices yet: both just sleep, timers running.', badges: { A: { xid: '960', extra: 'waiting', extraTone: 'dead' }, B: { xid: '961', extra: 'waiting', extraTone: 'dead' } }, x: { locks: [xA, xB, bWaits, aWaits], edges: [eBA, eAB], cycle: true } },
  { tick: 6, title: 'deadlock_timeout expires for B', body: 'B has waited 1 s. It runs the **deadlock detector**: walk the waits-for graph from B, find the path back to B, and abort **itself** with **40P01**. Which victim gets chosen is not something to rely on.', badges: { A: { xid: '960', extra: 'waiting', extraTone: 'dead' }, B: { extra: '40P01', extraTone: 'dead' } }, x: { locks: [xA, aWaits], edges: [eBA, eAB], cycle: true } },
  { tick: 7, title: 'A wakes up', body: 'B\'s abort released its xid lock and its row lock on 22222, so A\'s UPDATE goes ahead. A paid about **1 s** of waiting.', badges: { A: { xid: '960' } }, x: { locks: [xA], edges: [] } },
  { tick: 8, title: 'A commits; B retries', body: 'A deadlock costs one transaction and `deadlock_timeout` of latency. The real fix is to remove the cycle: switch to *consistent lock order*.', x: { locks: [], edges: [] } },
]

const evOrd: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: 'BEGIN;\nUPDATE … + 100 WHERE acctnum = 11111;', out: 'lowest account first' },
  { lane: 'B', at: 1, kind: 'sql', sql: 'BEGIN;\nUPDATE … - 100 WHERE acctnum = 11111;', out: 'B also starts with the lowest account' },
  { lane: 'B', at: 2, until: 4, kind: 'wait', out: 'waits for 960, holding **nothing** A needs' },
  { lane: 'A', at: 2, kind: 'sql', sql: 'UPDATE … - 100 WHERE acctnum = 22222;', out: 'no conflict' },
  { lane: 'A', at: 3, kind: 'ok', sql: 'COMMIT;' },
  { lane: 'B', at: 4, kind: 'grant', out: 'granted · UPDATE 1 (on the new row version)' },
  { lane: 'B', at: 5, kind: 'ok', sql: 'UPDATE … + 100 WHERE acctnum = 22222;\nCOMMIT;', out: 'no deadlock possible' },
]
const stOrd: TStep<X>[] = [
  { tick: 0, title: 'A locks 11111 first', body: 'Rule: every transaction locks accounts in **ascending acctnum** order.', badges: { A: { xid: '960' } }, x: { locks: [xA], edges: [] } },
  { tick: 1, title: 'B also starts at 11111', body: 'B needs the same two rows, so by the rule it also asks for 11111 first.', badges: { A: { xid: '960' }, B: { xid: '961' } }, x: { locks: [xA, xB], edges: [] } },
  { tick: 2, title: 'B waits, A continues', body: 'B waits for A, but B holds nothing A needs, so the waits-for graph cannot close into a cycle.', badges: { A: { xid: '960' }, B: { xid: '961', extra: 'waiting', extraTone: 'dead' } }, x: { locks: [xA, xB, bWaits], edges: [eBA] } },
  { tick: 3, title: 'A commits', body: 'A finishes both rows and commits, releasing everything.', badges: { B: { xid: '961', extra: 'waiting', extraTone: 'dead' } }, x: { locks: [xB, bWaits], edges: [eBA] } },
  { tick: 4, title: 'B proceeds', body: 'B is granted and updates the newest version of 11111 (Read Committed re-check).', badges: { B: { xid: '961' } }, x: { locks: [xB], edges: [] } },
  { tick: 5, title: 'No deadlock, no retry', body: 'Same work, same rows, no 40P01 and no 1 s stall: just ordinary queueing. In SQL, lock all rows up front with `ORDER BY acctnum FOR UPDATE`.', x: { locks: [], edges: [] } },
]

function DeadlockTimeline() {
  const [mode, setMode] = useState<Mode>('deadlock')
  const labels = mode === 'deadlock' ? ['0 ms', '10 ms', '20 ms', '20 ms', '30 ms', '30 ms', '1020 ms', '1020 ms', '1025 ms'] : ['0 ms', '10 ms', '20 ms', '25 ms', '25 ms', '30 ms']
  return (
    <ScenarioStepper key={mode} lanes={lanes} events={mode === 'deadlock' ? evDead : evOrd} steps={mode === 'deadlock' ? stDead : stOrd} tickLabels={labels}
      extra={<Segmented label="Lock order" value={mode} onChange={setMode} options={[['deadlock', 'opposite order'], ['ordered', 'consistent order']]} />}
      panel={(s) => (
        <div className="grid gap-3 lg:grid-cols-2">
          <Graph title="waits-for graph" nodes={[{ id: 'A', label: 'A', sub: 'xid 960' }, { id: 'B', label: 'B', sub: 'xid 961' }]} edges={s.x.edges} highlight={s.x.cycle}
            caption={s.x.cycle ? 'A cycle: every member waits for another member. Only an abort can break it.' : 'X → Y: X is waiting for a lock Y holds.'} />
          <LockList title="pg_locks: xid locks held and awaited" rows={s.x.locks} />
        </div>
      )} />
  )
}

/* ---------------- lock hierarchy ---------------- */
interface Tier { id: string; name: string; t: Tone; protects: string; duration: string; waits: string; modes: string; deadlock: string; error: string; visible: string; events: [string, string, string][] }
const TIERS: Tier[] = [
  { id: 'spin', name: 'Spinlock', t: 'dead', protects: 'A few fields in shared memory (a buffer header, a counter).', duration: 'A handful of instructions.', waits: 'Busy-loops on an atomic test-and-set, then sleeps with growing back-off.',
    modes: 'Exclusive only.', deadlock: 'None. Code must never take another lock while holding one.', error: 'Not released automatically; holders cannot raise errors.', visible: 'Only as `Timeout / SpinDelay` when badly contended.',
    events: [['Timeout', 'SpinDelay', 'Waiting while acquiring a contended spinlock']] },
  { id: 'lw', name: 'LWLock', t: 'new', protects: 'Shared data structures: buffer contents, buffer mapping partitions, WAL insertion slots, the lock manager\'s own tables.', duration: 'Microseconds: a page read, a WAL record copy.', waits: 'Sleeps on a semaphore in a wait queue.',
    modes: 'Shared or exclusive.', deadlock: 'None. Avoided by coding rules (fixed acquisition order).', error: 'Released automatically on ERROR.', visible: '`wait_event_type = LWLock` in `pg_stat_activity`; not in `pg_locks`.',
    events: [['LWLock', 'BufferContent', 'Waiting to access a data page in memory'], ['LWLock', 'BufferMapping', 'Waiting to associate a data block with a buffer in the buffer pool'], ['LWLock', 'WALInsert', 'Waiting to insert WAL data into a memory buffer'], ['LWLock', 'LockManager', 'Waiting to read or update information about "heavyweight" locks'], ['LWLock', 'ProcArray', 'Waiting to access the shared per-process data structures (typically, to get a snapshot or report a session\'s transaction ID)']] },
  { id: 'hw', name: 'Heavyweight lock', t: 'pointer', protects: 'SQL-visible objects: tables, xids, tuples (while waiting), advisory keys, relation extension.', duration: 'Usually until transaction end.', waits: 'Queues in the shared lock table; sleeps until granted.',
    modes: '8 table modes with a conflict matrix (plus 4 row modes stored in tuples).', deadlock: 'Yes: after `deadlock_timeout`, the waiter checks the waits-for graph.', error: 'Released at transaction end or rollback to savepoint.', visible: '`pg_locks`, `pg_blocking_pids()`, `wait_event_type = Lock`.',
    events: [['Lock', 'relation', 'Waiting to acquire a lock on a relation'], ['Lock', 'transactionid', 'Waiting for a transaction to finish'], ['Lock', 'tuple', 'Waiting to acquire a lock on a tuple'], ['Lock', 'advisory', 'Waiting to acquire an advisory user lock']] },
]

function Hierarchy() {
  const [sel, setSel] = useState('lw')
  const t = TIERS.find((x) => x.id === sel)!
  return (
    <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-stretch gap-2">
        {TIERS.map((x, i) => (
          <motion.button key={x.id} layout onClick={() => setSel(x.id)} whileHover={{ y: -2 }}
            className="flex min-w-[150px] flex-1 flex-col rounded-lg border p-3 text-left"
            style={{ borderColor: tone(x.t), background: toneBg(x.t, sel === x.id ? 22 : 8), borderWidth: sel === x.id ? 2 : 1 }}>
            <span className="text-[11px] tracking-wide text-muted uppercase">level {i + 1}</span>
            <span className="font-semibold">{x.name}</span>
            <span className="mt-1 text-xs text-muted">{x.duration}</span>
          </motion.button>
        ))}
      </div>
      <p className="text-xs text-muted"><Md>{'Each level is built on the one below: the heavyweight lock table is itself protected by LWLocks (`LockManager`), and LWLocks are built on atomic operations.'}</Md></p>
      <AnimatePresence mode="wait">
        <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-3 text-sm">
            {([['Protects', t.protects], ['How it waits', t.waits], ['Modes', t.modes], ['Deadlock detection', t.deadlock], ['On error', t.error], ['Where you see it', t.visible]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[130px_1fr] gap-2 border-b border-line py-1 last:border-0">
                <span className="text-xs font-semibold text-muted">{k}</span><span className="text-[13px]"><Md>{v}</Md></span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">pg_wait_events (from a real query)</p>
            <div className="grid gap-1.5">
              {t.events.map(([ty, name, d]) => (
                <div key={name} className="text-[12.5px]"><Tag t={t.t}>{ty}</Tag> <code className="font-mono font-semibold">{name}</code><p className="text-xs text-muted">{d}</p></div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function DeadlockViz() {
  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <DeadlockTimeline />
      <div className="grid min-w-0 gap-2 border-t border-line pt-4 [&>*]:min-w-0">
        <p className="text-sm font-semibold">The lock hierarchy</p>
        <Hierarchy />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'lwlocks-deadlocks',
  module: 'm5',
  order: 7,
  title: 'LWLocks, spinlocks and deadlock detection',
  tldr: [
    'PostgreSQL stacks three kinds of locks: **spinlocks** for a few instructions, **LWLocks** for shared-memory structures, and **heavyweight locks** for SQL objects, and only the last kind is checked for deadlocks.',
    'Deadlock detection is deferred until a waiter has slept for **deadlock_timeout**, because walking the waits-for graph is expensive and real deadlocks are rare.',
  ],
  visualizer: {
    title: 'Two transfers, one deadlock',
    caption: 'Step through the classic two-account deadlock on a millisecond clock and watch the waits-for graph close. Switch to consistent lock order to see it disappear. Below, explore the lock hierarchy.',
    Component: DeadlockViz,
  },
  playground: {
    setup: `
CREATE TABLE accounts (acctnum int PRIMARY KEY, balance numeric NOT NULL);
INSERT INTO accounts VALUES (11111, 500), (22222, 500), (33333, 500);`,
    presets: [
      { label: 'Deadlock settings', sql: `SHOW deadlock_timeout;
SHOW log_lock_waits;
SHOW lock_timeout;
SELECT datname, deadlocks FROM pg_stat_database WHERE datname = current_database();`,
        note: '`deadlock_timeout` = **1s**: a waiter sleeps that long before checking for a cycle. `pg_stat_database.deadlocks` counts every 40P01 in this database.' },
      { label: 'Wait event families', sql: `SELECT type, count(*) AS events
FROM pg_wait_events GROUP BY type ORDER BY events DESC;`,
        note: 'Every wait a backend can report is listed. **LWLock** (84 names in 18) and **Lock** (12 heavyweight lock types) are the two lock families; `SpinDelay` hides under **Timeout**.' },
      { label: 'The LWLocks you will meet', sql: `SELECT name, description FROM pg_wait_events
WHERE type = 'LWLock'
  AND name IN ('BufferContent', 'BufferMapping', 'WALInsert', 'WALWrite', 'LockManager', 'ProcArray', 'XactSLRU', 'SubtransSLRU', 'MultiXactMemberSLRU');`,
        note: 'Hot LWLocks map to subsystems: buffer pages, WAL, the lock manager, snapshots (`ProcArray`), and the SLRU caches for commit status, subtransactions and MultiXacts.' },
      { label: 'Heavyweight lock types', sql: `SELECT name, description FROM pg_wait_events WHERE type = 'Lock' ORDER BY name;`,
        note: 'These are the `locktype` values of `pg_locks`. Row-lock waits show up as **transactionid** (waiting for the holder to finish) and **tuple** (queuing behind other waiters).' },
      { label: 'Lock in a consistent order', sql: `BEGIN;
SELECT acctnum, balance FROM accounts
WHERE acctnum IN (22222, 11111)
ORDER BY acctnum
FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE acctnum = 22222;
UPDATE accounts SET balance = balance + 100 WHERE acctnum = 11111;
COMMIT;
SELECT * FROM accounts ORDER BY acctnum;`,
        note: 'Locking both rows up front in **acctnum order** means every transfer acquires its row locks in the same sequence, so no waits-for cycle can form, whatever order the UPDATEs run in.' },
      { label: 'A transfer procedure that cannot deadlock', sql: `CREATE OR REPLACE PROCEDURE transfer(sender int, receiver int, amount numeric)
LANGUAGE plpgsql AS $$
BEGIN
  -- lock both rows in key order, whichever way the money flows
  PERFORM 1 FROM accounts WHERE acctnum IN (sender, receiver)
  ORDER BY acctnum FOR UPDATE;
  UPDATE accounts SET balance = balance - amount WHERE acctnum = sender;
  UPDATE accounts SET balance = balance + amount WHERE acctnum = receiver;
  COMMIT;
END $$;

CALL transfer(22222, 11111, 50);
CALL transfer(11111, 22222, 20);
SELECT * FROM accounts ORDER BY acctnum;`,
        note: 'Without the `PERFORM … FOR UPDATE`, two opposite transfers running at once lock their sender first and deadlock. With it, both lock 11111 before 22222, so the second simply waits. Balances end at **630** and **370**.' },
      { label: 'Tune detection for a session', sql: `BEGIN;
SET LOCAL deadlock_timeout = '200ms';
SET LOCAL lock_timeout = '5s';
SHOW deadlock_timeout;
SELECT pid, wait_event_type, wait_event, pg_blocking_pids(pid) AS blocked_by
FROM pg_stat_activity WHERE pid = pg_backend_pid();
COMMIT;`,
        note: 'Superusers can lower `deadlock_timeout` (fewer ms lost per real deadlock, more needless checks). The `pg_stat_activity` query is the one to run when sessions hang: look for `Lock` waits and their blockers.' },
    ],
  },
  production: {
    title: 'Deadlocks between concurrent transfers',
    context: 'A wallet service moves money with two UPDATEs: debit the sender, then credit the receiver. Two users often pay each other at the same moment.',
    problem: 'Transfer X locks Alice then Bob; transfer Y locks Bob then Alice. Under load the logs fill with `ERROR: deadlock detected`, each one costing a retry and about **1 s** (`deadlock_timeout`) of latency for the surviving transaction.',
    solution: 'Acquire the row locks in a canonical order: lock both accounts in ascending id order before updating either. Keep a retry on 40P01 for other paths.',
    sql: `BEGIN;
SELECT id FROM wallets WHERE id IN ($1, $2) ORDER BY id FOR UPDATE;
UPDATE wallets SET balance = balance - $3 WHERE id = $1;
UPDATE wallets SET balance = balance + $3 WHERE id = $2;
COMMIT;`,
    outcome: 'With one lock order a waits-for cycle between transfers is impossible, so this path produces zero 40P01 errors; conflicting transfers now simply queue for a few milliseconds instead of stalling 1 s and retrying. Track `pg_stat_database.deadlocks` to confirm.',
  },
  pitfalls: [
    { title: 'Opposite lock order in different code paths',
      symptom: 'Sporadic `40P01 deadlock detected` errors, often in pairs of the same two statements.',
      cause: 'Two transactions lock the same rows or tables in opposite orders. Also common: UPDATE … WHERE id IN (…) without a stable order, or foreign-key checks interleaved with parent updates.',
      fix: 'Sort keys before locking, take the strongest lock first, and retry on 40P01. The DETAIL line names both processes and lock targets.' },
    { title: 'Raising deadlock_timeout to "fix" deadlocks',
      symptom: 'Fewer deadlock errors in logs, but more latency spikes.',
      cause: 'The timeout only delays **detection**. A real deadlock still ends in an abort, just later.',
      fix: 'Leave it around 1 s (ideally above typical transaction time) and fix the lock order. Use `log_lock_waits = on` to log any wait longer than `deadlock_timeout`.' },
    { title: 'Treating LWLock waits as blocking',
      symptom: 'Many sessions show `wait_event_type = LWLock` (for example `BufferMapping` or `WALInsert`), but `pg_locks` shows nothing waiting.',
      cause: 'LWLocks are short internal locks, not visible in `pg_locks`. Heavy LWLock waiting means **contention on a shared structure**, not one blocking session.',
      fix: 'Treat it as a capacity problem: reduce connections (pooling), add RAM for `shared_buffers`, batch WAL-heavy writes, or reduce subtransaction / MultiXact churn depending on the lock name.' },
  ],
  pointers: [
    'Hierarchy: **spinlock** (instructions) → **LWLock** (shared memory structures, shared/exclusive) → **heavyweight lock** (SQL objects, 8 modes).',
    'Only heavyweight locks have **deadlock detection**; LWLocks avoid deadlock by coding rules.',
    'A waiter checks for deadlock after **deadlock_timeout** (default 1 s); a cycle aborts one transaction with **40P01**.',
    'Prevent deadlocks with a **consistent lock order** (`ORDER BY id FOR UPDATE`) and retry the rare remainder.',
    'Diagnose with `pg_stat_activity.wait_event_type` (`Lock` vs `LWLock`) and `pg_blocking_pids()`.',
  ],
  sources: ['explicit-locking.html', 'runtime-config-locks.html', 'monitoring-stats.html', 'view-pg-locks.html', 'view-pg-wait-events.html', 'runtime-config-logging.html', 'errcodes-appendix.html'],
}
