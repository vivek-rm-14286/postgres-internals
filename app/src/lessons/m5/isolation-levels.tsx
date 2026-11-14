import { useState } from 'react'
import type { Lesson } from '../../lesson/types'
import { Segmented } from '../../viz/kit'
import { Graph, LockList, ScenarioStepper, TupleVersions, type GEdge, type LockRow, type TEvent, type TLane, type TStep, type TVersion } from './_timeline'

/* ------------------------------------------------------------------------------------------------
 * Three scripted two-session scenarios, each a documented example from Chapter 13.2:
 *  rc  — Read Committed re-check: the website hits 9/10 DELETE that deletes nothing.
 *  rr  — Repeatable Read: a concurrent update after our snapshot → 40001 "concurrent update".
 *  ssi — Serializable: the mytab class sums (write skew), caught via SIRead locks and rw-conflicts.
 * PGlite has one backend, so the timeline is simulated; the SIRead lock shapes are from a real run.
 * ---------------------------------------------------------------------------------------------- */

type Sc = 'rc' | 'rr' | 'ssi'
interface X { vers: TVersion[]; locks?: LockRow[]; edges?: GEdge[]; cycle?: boolean }

/* ---- Read Committed: hits 9 / 10 ---- */
const rcLanes: TLane[] = [{ id: 'A', name: 'Session A', note: 'READ COMMITTED' }, { id: 'B', name: 'Session B', note: 'READ COMMITTED' }]
const rcEvents: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: 'BEGIN;\nUPDATE website\n  SET hits = hits + 1;', out: 'xid **901** · UPDATE 2 (9→10, 10→11)' },
  { lane: 'B', at: 1, kind: 'sql', sql: 'DELETE FROM website\n WHERE hits = 10;', out: 'snapshot sees hits 9 and 10' },
  { lane: 'B', at: 2, until: 4, kind: 'wait', out: 'row (2, 10) matches but has `xmax = 901` in progress → waits for **ShareLock on transaction 901**' },
  { lane: 'A', at: 3, kind: 'ok', sql: 'COMMIT;', out: '901 committed' },
  { lane: 'B', at: 4, kind: 'grant', out: 'wakes up · re-reads the **newest** version (2, **11**) · re-checks `hits = 10` → false' },
  { lane: 'B', at: 5, kind: 'ok', out: '**DELETE 0**' },
]
const w1: TVersion = { id: 'r1a', label: 'id 1, hits 9', xmin: '850', xmax: '0', status: 'live' }
const w2: TVersion = { id: 'r2a', label: 'id 2, hits 10', xmin: '850', xmax: '0', status: 'live' }
const rcAfterA: TVersion[] = [
  { ...w1, xmax: '901', status: 'dead', sees: { B: true }, note: 'B: 9 ≠ 10, skipped' },
  { id: 'r1b', label: 'id 1, hits 10', xmin: '901', xmax: '0', status: 'new', sees: { B: false }, note: 'invisible to B: 901 not committed at B\'s start' },
  { ...w2, xmax: '901', status: 'locked', sees: { B: true }, note: 'B: matches, but 901 is updating it' },
  { id: 'r2b', label: 'id 2, hits 11', xmin: '901', xmax: '0', status: 'new', sees: { B: false } },
]
const rcSteps: TStep<X>[] = [
  { tick: 0, title: 'A adds 1 to every row', body: 'A (xid 901) rewrites both rows: 9 → **10** and 10 → **11**, not yet committed. Each old version now carries `xmax = 901`.', badges: { A: { xid: '901' } },
    x: { vers: [{ ...w1, xmax: '901', status: 'dead' }, { id: 'r1b', label: 'id 1, hits 10', xmin: '901', xmax: '0', status: 'new' }, { ...w2, xmax: '901', status: 'dead' }, { id: 'r2b', label: 'id 2, hits 11', xmin: '901', xmax: '0', status: 'new' }] } },
  { tick: 1, title: 'B starts its DELETE', body: 'B\'s statement snapshot does not include 901, so B sees the **old** values 9 and 10. The row with 9 does not match and is skipped for good.', badges: { A: { xid: '901' }, B: { snap: '901:901:' } }, x: { vers: rcAfterA } },
  { tick: 2, title: 'B blocks on the row with hits = 10', body: 'That row matches, but its `xmax` is 901, still running. B cannot delete a row another transaction is updating, so it waits on **901\'s xid lock**.', badges: { A: { xid: '901' }, B: { snap: '901:901:', extra: 'waiting on 901', extraTone: 'dead' } }, x: { vers: rcAfterA } },
  { tick: 3, title: 'A commits', body: '901 is committed. The row B was waiting for now has a newer committed version.', badges: { B: { snap: '901:901:', extra: 'waiting on 901', extraTone: 'dead' } },
    x: { vers: [{ ...w1, xmax: '901', status: 'dead', sees: { B: true } }, { id: 'r1b', label: 'id 1, hits 10', xmin: '901', xmax: '0', status: 'live', sees: { B: false } }, { ...w2, xmax: '901', status: 'dead', sees: { B: true } }, { id: 'r2b', label: 'id 2, hits 11', xmin: '901', xmax: '0', status: 'live', sees: { B: false } }] } },
  { tick: 4, title: 'Re-check on the updated row (EvalPlanQual)', body: 'Read Committed does not give up: it follows the update chain to the **newest version** and re-evaluates the WHERE clause on it. hits is now 11, so the row no longer qualifies.', badges: { B: { snap: '901:901:' } },
    x: { vers: [{ ...w1, xmax: '901', status: 'dead' }, { id: 'r1b', label: 'id 1, hits 10', xmin: '901', xmax: '0', status: 'live', note: 'never examined by B' }, { ...w2, xmax: '901', status: 'dead' }, { id: 'r2b', label: 'id 2, hits 11', xmin: '901', xmax: '0', status: 'live', note: 're-checked: 11 ≠ 10' }] } },
  { tick: 5, title: 'DELETE 0', body: 'A row with hits = 10 existed **before and after** A\'s update, yet nothing was deleted. Each row was judged at a different moment: that is Read Committed\'s partial consistency.',
    x: { vers: [{ ...w1, xmax: '901', status: 'dead' }, { id: 'r1b', label: 'id 1, hits 10', xmin: '901', xmax: '0', status: 'live', note: 'survives' }, { ...w2, xmax: '901', status: 'dead' }, { id: 'r2b', label: 'id 2, hits 11', xmin: '901', xmax: '0', status: 'live' }] } },
]

/* ---- Repeatable Read: 40001 on concurrent update ---- */
const rrLanes: TLane[] = [{ id: 'A', name: 'Session A', note: 'REPEATABLE READ' }, { id: 'B', name: 'Session B', note: 'READ COMMITTED' }]
const rrEvents: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: 'BEGIN ISOLATION LEVEL\n  REPEATABLE READ;\nSELECT balance FROM acct\n WHERE id = 1;', out: '→ **100** · transaction snapshot taken' },
  { lane: 'B', at: 1, kind: 'sql', sql: 'BEGIN;\nUPDATE acct SET balance =\n  balance - 30 WHERE id = 1;', out: 'xid **902** · UPDATE 1' },
  { lane: 'A', at: 2, kind: 'sql', sql: 'UPDATE acct SET balance =\n  balance + 50 WHERE id = 1;' },
  { lane: 'A', at: 3, until: 5, kind: 'wait', out: 'row is being updated by 902 → waits for it' },
  { lane: 'B', at: 4, kind: 'ok', sql: 'COMMIT;', out: '902 committed · balance 70' },
  { lane: 'A', at: 5, kind: 'err', out: 'ERROR: could not serialize access due to concurrent update · **SQLSTATE 40001**' },
  { lane: 'A', at: 6, kind: 'sql', sql: 'ROLLBACK;  -- retry:\nBEGIN ISOLATION LEVEL\n  REPEATABLE READ;\nSELECT balance … → 70\nUPDATE … + 50;\nCOMMIT;', out: 'new snapshot includes 902 · balance **120**' },
]
const a1: TVersion = { id: 'b1', label: 'id 1, balance 100', xmin: '880', xmax: '0', status: 'live' }
const rrSteps: TStep<X>[] = [
  { tick: 0, title: 'A reads 100 under Repeatable Read', body: 'The first statement fixes A\'s **transaction snapshot**. Every later statement in A, including UPDATEs, finds rows through it.', badges: { A: { snap: '902:902:' } }, x: { vers: [{ ...a1, sees: { A: true } }] } },
  { tick: 1, title: 'B updates the same row (xid 902)', body: 'B subtracts 30. The row now has a new version 70 and the old one carries `xmax = 902`.', badges: { A: { snap: '902:902:' }, B: { xid: '902' } },
    x: { vers: [{ ...a1, xmax: '902', status: 'locked', sees: { A: true } }, { id: 'b2', label: 'id 1, balance 70', xmin: '902', xmax: '0', status: 'new', sees: { A: false } }] } },
  { tick: 2, title: 'A tries to add 50', body: 'A finds the version it can see (100), but `xmax = 902` says someone else is changing it.', badges: { A: { snap: '902:902:' }, B: { xid: '902' } },
    x: { vers: [{ ...a1, xmax: '902', status: 'locked', sees: { A: true } }, { id: 'b2', label: 'id 1, balance 70', xmin: '902', xmax: '0', status: 'new', sees: { A: false } }] } },
  { tick: 3, title: 'A waits for 902', body: 'Like Read Committed, A waits to learn whether 902 commits or rolls back. If it rolled back, A would simply proceed.', badges: { A: { snap: '902:902:', extra: 'waiting on 902', extraTone: 'dead' }, B: { xid: '902' } },
    x: { vers: [{ ...a1, xmax: '902', status: 'locked', sees: { A: true } }, { id: 'b2', label: 'id 1, balance 70', xmin: '902', xmax: '0', status: 'new', sees: { A: false } }] } },
  { tick: 4, title: 'B commits', body: '902 committed, so a newer version (70) exists that A\'s snapshot cannot see.', badges: { A: { snap: '902:902:', extra: 'waiting on 902', extraTone: 'dead' } },
    x: { vers: [{ ...a1, xmax: '902', status: 'dead', sees: { A: true } }, { id: 'b2', label: 'id 1, balance 70', xmin: '902', xmax: '0', status: 'live', sees: { A: false } }] } },
  { tick: 5, title: 'A fails with 40001', body: 'Read Committed would re-check and update 70. Repeatable Read **must not** act on a row changed after its snapshot, so it raises a **serialization failure**. A lost update is prevented.', badges: { A: { extra: '40001', extraTone: 'dead' } },
    x: { vers: [{ ...a1, xmax: '902', status: 'dead' }, { id: 'b2', label: 'id 1, balance 70', xmin: '902', xmax: '0', status: 'live' }] } },
  { tick: 6, title: 'Retry the whole transaction', body: 'The application rolls back and **reruns the entire transaction**. The new snapshot includes 902, so A reads 70 and writes **120**. Only writers ever need a retry.', badges: { A: { snap: '903:903:', xid: '903' } },
    x: { vers: [{ ...a1, xmax: '902', status: 'dead' }, { id: 'b2', label: 'id 1, balance 70', xmin: '902', xmax: '903', status: 'dead' }, { id: 'b3', label: 'id 1, balance 120', xmin: '903', xmax: '0', status: 'live' }] } },
]

/* ---- Serializable: write skew on mytab ---- */
const ssiLanes: TLane[] = [{ id: 'A', name: 'Session A', note: 'SERIALIZABLE' }, { id: 'B', name: 'Session B', note: 'SERIALIZABLE' }]
const ssiEvents: TEvent[] = [
  { lane: 'A', at: 0, kind: 'sql', sql: 'BEGIN ISOLATION LEVEL SERIALIZABLE;\nSELECT sum(value) FROM mytab\n WHERE class = 1;', out: '→ **30** · SIReadLock on what it read' },
  { lane: 'B', at: 1, kind: 'sql', sql: 'BEGIN ISOLATION LEVEL SERIALIZABLE;\nSELECT sum(value) FROM mytab\n WHERE class = 2;', out: '→ **300** · SIReadLock on what it read' },
  { lane: 'A', at: 2, kind: 'sql', sql: 'INSERT INTO mytab VALUES (2, 30);', out: 'writes into B\'s read set → rw-conflict **B → A** (no blocking)' },
  { lane: 'B', at: 3, kind: 'sql', sql: 'INSERT INTO mytab VALUES (1, 300);', out: 'writes into A\'s read set → rw-conflict **A → B**' },
  { lane: 'A', at: 4, kind: 'ok', sql: 'COMMIT;', out: 'first committer wins' },
  { lane: 'B', at: 5, kind: 'err', sql: 'COMMIT;', out: 'ERROR: could not serialize access due to read/write dependencies among transactions · **40001**' },
  { lane: 'B', at: 6, kind: 'ok', sql: '-- retry: sum(class 2) → 330\nINSERT … VALUES (1, 330);\nCOMMIT;', out: 'consistent with "A ran first"' },
]
const m = (id: string, label: string, xmin = '870', status: TVersion['status'] = 'live'): TVersion => ({ id, label, xmin, xmax: '0', status })
const base4 = [m('m1', 'class 1, value 10'), m('m2', 'class 1, value 20'), m('m3', 'class 2, value 100'), m('m4', 'class 2, value 200')]
const siA: LockRow = { lane: 'A', locktype: 'relation', target: 'mytab', mode: 'SIReadLock', granted: true }
const siB: LockRow = { lane: 'B', locktype: 'relation', target: 'mytab', mode: 'SIReadLock', granted: true }
const ssiSteps: TStep<X>[] = [
  { tick: 0, title: 'A sums class 1', body: 'A reads 30. Its sequential scan records a **relation-level SIReadLock** on mytab: a note of what A read, not a lock that blocks anyone.', badges: { A: { snap: '905:905:' } }, x: { vers: base4, locks: [siA], edges: [] } },
  { tick: 1, title: 'B sums class 2', body: 'B reads 300 and records its own SIReadLock. Both are ordinary snapshot reads that never wait.', badges: { A: { snap: '905:905:' }, B: { snap: '905:905:' } }, x: { vers: base4, locks: [siA, siB], edges: [] } },
  { tick: 2, title: 'A inserts (2, 30)', body: 'The new row falls in what **B read**. The SSI manager records an **rw-antidependency B → A**: in any serial order, B must come before A.', badges: { A: { snap: '905:905:', xid: '905' }, B: { snap: '905:905:' } },
    x: { vers: [...base4, m('m5', 'class 2, value 30', '905', 'new')], locks: [siA, siB, { lane: 'A', locktype: 'relation', target: 'mytab', mode: 'RowExclusiveLock', granted: true }], edges: [{ from: 'B', to: 'A', label: 'B read, A wrote', dashed: true }] } },
  { tick: 3, title: 'B inserts (1, 300)', body: 'This row falls in what **A read**: a second edge **A → B**. Two edges that form a cycle mean no serial order fits, a **dangerous structure**.', badges: { A: { snap: '905:905:', xid: '905' }, B: { snap: '905:905:', xid: '906' } },
    x: { vers: [...base4, m('m5', 'class 2, value 30', '905', 'new'), m('m6', 'class 1, value 300', '906', 'new')], locks: [siA, siB, { lane: 'A', locktype: 'relation', target: 'mytab', mode: 'RowExclusiveLock', granted: true }, { lane: 'B', locktype: 'relation', target: 'mytab', mode: 'RowExclusiveLock', granted: true }],
      edges: [{ from: 'B', to: 'A', label: 'B read, A wrote', dashed: true }, { from: 'A', to: 'B', label: 'A read, B wrote', dashed: true }], cycle: true } },
  { tick: 4, title: 'A commits', body: 'A commits. Its SIReadLock **outlives the commit**, because B, which overlapped A, is still running.', badges: { B: { snap: '905:905:', xid: '906' } },
    x: { vers: [...base4, m('m5', 'class 2, value 30', '905'), m('m6', 'class 1, value 300', '906', 'new')], locks: [siA, siB, { lane: 'B', locktype: 'relation', target: 'mytab', mode: 'RowExclusiveLock', granted: true }],
      edges: [{ from: 'B', to: 'A', label: 'B read, A wrote', dashed: true }, { from: 'A', to: 'B', label: 'A read, B wrote', dashed: true }], cycle: true } },
  { tick: 5, title: 'B is rolled back with 40001', body: 'If A ran first, B should have summed 330; if B ran first, A should have summed 330. Neither happened, so PostgreSQL aborts B. Under **Repeatable Read** both would have committed: classic **write skew**.', badges: { B: { extra: '40001', extraTone: 'dead' } },
    x: { vers: [...base4, m('m5', 'class 2, value 30', '905'), { ...m('m6', 'class 1, value 300', '906'), status: 'dead', note: 'aborted' }], locks: [], edges: [{ from: 'B', to: 'A', label: 'B read, A wrote', dashed: true }, { from: 'A', to: 'B', label: 'A read, B wrote', dashed: true }], cycle: true } },
  { tick: 6, title: 'B retries and gets 330', body: 'The retried B sees A\'s row, sums **330** and inserts it. The result is exactly "A, then B": serializable.',
    x: { vers: [...base4, m('m5', 'class 2, value 30', '905'), { ...m('m6', 'class 1, value 300', '906'), status: 'dead', note: 'aborted' }, m('m7', 'class 1, value 330', '907', 'new')], locks: [], edges: [] } },
]

function IsolationViz() {
  const [sc, setSc] = useState<Sc>('rc')
  const extra = <Segmented label="Scenario" value={sc} onChange={setSc} options={[['rc', 'RC re-check'], ['rr', 'RR 40001'], ['ssi', 'SSI write skew']]} />
  if (sc === 'rc') return <ScenarioStepper key="rc" lanes={rcLanes} events={rcEvents} steps={rcSteps} extra={extra} panel={(s) => <TupleVersions title="website: row versions (B sees? = B's statement snapshot)" versions={s.x.vers} lanes={['B']} />} />
  if (sc === 'rr') return <ScenarioStepper key="rr" lanes={rrLanes} events={rrEvents} steps={rrSteps} extra={extra} panel={(s) => <TupleVersions title="acct: row versions (A sees? = A's transaction snapshot)" versions={s.x.vers} lanes={['A']} />} />
  return (
    <ScenarioStepper key="ssi" lanes={ssiLanes} events={ssiEvents} steps={ssiSteps} extra={extra} panel={(s) => (
      <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
        <div className="grid gap-3 lg:grid-cols-2">
          <Graph title="rw-antidependencies (SSI conflict graph)" nodes={[{ id: 'A', label: 'A', sub: 'xid 905' }, { id: 'B', label: 'B', sub: 'xid 906' }]} edges={s.x.edges ?? []} highlight={s.x.cycle}
            caption={s.x.cycle ? 'A cycle of rw-conflicts: no serial order exists, so one transaction must fail.' : 'Edges appear when a write lands on data another serializable transaction read.'} />
          <LockList title="pg_locks: SIRead and write locks" rows={s.x.locks ?? []} />
        </div>
        <TupleVersions title="mytab: row versions" versions={s.x.vers} />
      </div>
    )} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'isolation-levels',
  module: 'm5',
  order: 4,
  title: 'Isolation levels: RC, RR, Serializable (SSI)',
  tldr: [
    'PostgreSQL offers **Read Committed** (a snapshot per statement, re-checking rows changed by others), **Repeatable Read** (one snapshot per transaction) and **Serializable** (Repeatable Read plus conflict tracking with SIRead locks).',
    'Each step up removes a class of anomalies at the cost of **serialization failures** (SQLSTATE `40001`) that the application must answer by retrying the whole transaction.',
  ],
  visualizer: {
    title: 'Three classic races, replayed',
    caption: 'Pick a scenario and step through it. Watch wait bars, snapshots and row versions; in the SSI case, watch the rw-conflict edges close into a cycle.',
    Component: IsolationViz,
  },
  playground: {
    setup: `
CREATE TABLE website (id int PRIMARY KEY, hits int NOT NULL);
INSERT INTO website VALUES (1, 9), (2, 10);
CREATE TABLE mytab (class int, value int);
CREATE INDEX mytab_class_idx ON mytab (class);
INSERT INTO mytab VALUES (1, 10), (1, 20), (2, 100), (2, 200);
ANALYZE mytab;`,
    presets: [
      { label: 'Levels you can ask for', sql: `SHOW default_transaction_isolation;
BEGIN ISOLATION LEVEL READ UNCOMMITTED;
SHOW transaction_isolation;
COMMIT;`,
        note: 'You may request READ UNCOMMITTED, and it is reported back, but PostgreSQL runs it as **Read Committed**: dirty reads are never possible. The full picture: non-repeatable reads and phantoms are possible in Read Committed only; serialization anomalies (write skew) are possible in Read Committed and Repeatable Read, never in Serializable.' },
      { label: 'Hits example, run serially', sql: `BEGIN;
UPDATE website SET hits = hits + 1;
SELECT ctid, xmin, xmax, * FROM website ORDER BY id;
COMMIT;
DELETE FROM website WHERE hits = 10 RETURNING *;
SELECT * FROM website ORDER BY id;`,
        note: 'Run one after the other, the DELETE removes **id 1** (now 10). Run concurrently (the visualizer), the same two statements delete nothing. That gap is the RC anomaly.' },
      { label: 'Race-free upsert', sql: `-- start from a known state
DELETE FROM website WHERE id = 3;
UPDATE website SET hits = 11 WHERE id = 2;

INSERT INTO website VALUES (2, 1), (3, 1)
ON CONFLICT (id) DO UPDATE SET hits = website.hits + 1
RETURNING id, old.hits AS old_hits, new.hits AS new_hits,
          old.id IS NULL AS inserted,
          (xmax = 0) AS inserted_pre18;`,
        note: 'id 2 existed and took the UPDATE path (11 → 12), id 3 was inserted. Under Read Committed, a session that meets an uncommitted insert of the same key **waits** for it, then updates the committed row: it never fails with 23505 on the conflict key. `old IS NULL` (PG18) and the older `xmax = 0` trick both tell the two paths apart.' },
      { label: 'SIRead locks: seq scan', sql: `BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT sum(value) FROM mytab WHERE class = 1;
SELECT locktype, relation::regclass, page, tuple, mode
FROM pg_locks WHERE pid = pg_backend_pid() AND mode = 'SIReadLock';
COMMIT;`,
        note: 'The tiny table is read by a sequential scan, so the predicate lock covers the **whole relation**: any insert into mytab by another serializable transaction conflicts.' },
      { label: 'SIRead locks: index scan', sql: `BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL enable_seqscan = off;
EXPLAIN (COSTS OFF) SELECT sum(value) FROM mytab WHERE class = 1;
SELECT sum(value) FROM mytab WHERE class = 1;
SELECT locktype, relation::regclass, page, tuple, mode
FROM pg_locks WHERE pid = pg_backend_pid() AND mode = 'SIReadLock';
COMMIT;`,
        note: 'With an index scan the locks are fine-grained: two **tuple** locks on the heap and one **page** lock on `mytab_class_idx`. Fewer false conflicts, fewer needless 40001s.' },
      { label: 'READ ONLY DEFERRABLE', sql: `BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE;
SELECT sum(value) FROM mytab;
SELECT count(*) FILTER (WHERE mode = 'SIReadLock') AS siread_locks
FROM pg_locks WHERE pid = pg_backend_pid();
COMMIT;`,
        note: 'A deferrable read-only transaction waits (if needed) for a **safe snapshot**, then reads with **no SIRead locks** and can never fail with 40001. Ideal for long reports.' },
    ],
  },
  production: {
    title: 'On-call scheduling that let everyone go off call',
    context: 'A rota app enforces "at least one doctor on call per shift" in application code: count on-call doctors, and if the count is above 1, let this one go off call.',
    problem: 'Two doctors press "go off call" at the same moment. Under Read Committed or Repeatable Read both transactions count **2**, both update their own row, and both commit. Neither update touched a row the other wrote, so no lock ever conflicted: **write skew**, and the shift has nobody.',
    solution: 'Run the check-and-update as **SERIALIZABLE** and wrap it in a retry loop on SQLSTATE `40001`. SSI sees that each transaction read what the other wrote and aborts one. The retry then counts 1 and refuses.',
    sql: `-- application-side retry, pseudocode around plain SQL
-- loop up to 5 times:
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT count(*) FROM on_call WHERE shift_id = 42 AND active;
UPDATE on_call SET active = false WHERE shift_id = 42 AND doctor_id = 7;  -- only if count > 1
COMMIT;
-- on SQLSTATE 40001 (or 40P01): ROLLBACK, sleep with jitter, retry from BEGIN`,
    outcome: 'The invariant holds under any interleaving, with no explicit locks. Retries are rare (only on true overlap); the tradeoff is the SSI bookkeeping overhead and a retry path that every writer must implement.',
  },
  pitfalls: [
    { title: 'Retrying only the failed statement',
      symptom: 'After catching 40001 the app re-sends the last UPDATE and gets `current transaction is aborted, commands ignored until end of transaction block`.',
      cause: 'A serialization failure aborts the **whole** transaction. Its reads were made under the old snapshot and are no longer trustworthy.',
      fix: 'ROLLBACK and rerun the entire transaction from BEGIN, re-reading everything, with a bounded number of attempts.' },
    { title: 'Assuming Repeatable Read prevents write skew',
      symptom: 'Business rules that span several rows ("total ≤ limit", "one on call") are violated under load, with no errors raised.',
      cause: 'Repeatable Read is snapshot isolation: it stops lost updates on the **same** row, not anomalies across different rows.',
      fix: 'Use SERIALIZABLE for such transactions, or take explicit locks (`SELECT … FOR UPDATE` on the rows the rule depends on).' },
    { title: 'Treating MERGE as an upsert',
      symptom: 'Under concurrent load, a MERGE with `WHEN NOT MATCHED THEN INSERT` fails now and then with `23505 duplicate key value violates unique constraint`.',
      cause: 'A common claim is that MERGE is equivalent to an upsert. Under Read Committed, if another session inserts the same key after MERGE decided "not matched", MERGE does not re-check its MATCHED branches: the INSERT simply hits the unique index. `INSERT … ON CONFLICT` is built for that race.',
      fix: 'Use `INSERT … ON CONFLICT DO UPDATE` for single-table upserts. Keep MERGE for multi-action synchronisation, and retry it on 23505.' },
    { title: 'Get-or-create that returns nothing',
      symptom: 'A rare request gets zero rows back from a "get or create" query, although the row clearly exists afterwards.',
      cause: 'The query is `WITH ins AS (INSERT … ON CONFLICT DO NOTHING RETURNING *) SELECT * FROM ins UNION ALL SELECT … WHERE NOT EXISTS (SELECT 1 FROM ins)`. When another session inserted the key and committed after this statement took its snapshot, the INSERT sees the conflict and does nothing, and the SELECT cannot see the new row, because every part of a statement shares one snapshot.',
      fix: 'When the statement returns no row, run the SELECT again as a new statement (it gets a fresh snapshot in Read Committed), or loop in PL/pgSQL until one of the two paths returns the row.' },
    { title: 'Serializable with sequential scans',
      symptom: 'Many 40001 errors between transactions that touch unrelated rows.',
      cause: 'A sequential scan takes a **relation-level** SIRead lock, so any write to the table conflicts. Lock promotion under memory pressure has the same effect.',
      fix: 'Index the predicates serializable transactions filter on, keep them short, mark read-only ones `READ ONLY`, and raise `max_pred_locks_per_transaction` (pool size) or `max_pred_locks_per_relation` / `max_pred_locks_per_page` (promotion thresholds) if promotion is frequent.' },
  ],
  pointers: [
    'PostgreSQL has three real levels; **READ UNCOMMITTED = READ COMMITTED**, and its Repeatable Read also blocks phantoms.',
    '**Read Committed**: snapshot per statement; a blocked UPDATE/DELETE re-checks its WHERE on the newest row version.',
    '**Repeatable Read**: changing a row updated after your snapshot raises `40001` *could not serialize access due to concurrent update*.',
    '**Serializable** (SSI): SIRead locks never block; a cycle of rw-conflicts aborts one transaction with `40001`.',
    'Always retry the **whole transaction** on 40001 (and 40P01, see [deadlock detection](/m5/lwlocks-deadlocks)). Read-only transactions under RR never need to.',
  ],
  sources: ['transaction-iso.html', 'mvcc-serialization-failure-handling.html', 'sql-set-transaction.html', 'view-pg-locks.html', 'runtime-config-locks.html', 'applevel-consistency.html'],
}
