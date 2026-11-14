import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer, two tabs.
 * 1. Migration planner: pick an ALTER. The lock mode is the one pg_locks shows while the statement
 *    runs inside a transaction; "rewrite" means pg_class.relfilenode changed (the table was copied
 *    into a new file). Timings are for a 100,000-row orders table.
 * 2. Lock queue: a scripted timeline of four sessions (PostgreSQL in the browser has one session),
 *    following the documented lock conflict rules and lock_timeout behaviour.
 * ---------------------------------------------------------------------------------------------- */

type LockMode = 'ACCESS EXCLUSIVE' | 'SHARE ROW EXCLUSIVE' | 'SHARE' | 'SHARE UPDATE EXCLUSIVE' | 'ROW EXCLUSIVE'
/** `long` marks a phase whose work grows with the table (a scan, a rewrite, a backfill). */
interface Phase { sql: string; lock: LockMode; work: string; long?: boolean }
interface Op {
  id: string; label: string; naive: Phase[]; safe?: Phase[]; rewrite: boolean; scan: boolean; ms: string; why: string; safeWhy?: string
}

const BLOCKS: Record<LockMode, { reads: boolean; writes: boolean }> = {
  'ACCESS EXCLUSIVE': { reads: true, writes: true },
  'SHARE ROW EXCLUSIVE': { reads: false, writes: true },
  SHARE: { reads: false, writes: true },
  'SHARE UPDATE EXCLUSIVE': { reads: false, writes: false },
  'ROW EXCLUSIVE': { reads: false, writes: false },
}

const OPS: Op[] = [
  { id: 'add', label: 'Add a column', rewrite: false, scan: false, ms: '1.5 ms',
    naive: [{ sql: 'ALTER TABLE orders ADD COLUMN note text;', lock: 'ACCESS EXCLUSIVE', work: 'catalog only' }],
    why: 'Only the table definition changes. Existing rows simply read the new column as NULL. The strongest lock is taken, but for a moment.' },
  { id: 'adddef', label: 'Add a column with a constant default', rewrite: false, scan: false, ms: '0.7 ms',
    naive: [{ sql: "ALTER TABLE orders ADD COLUMN region text NOT NULL DEFAULT 'eu';", lock: 'ACCESS EXCLUSIVE', work: 'catalog only' }],
    why: 'A constant default is stored once in the catalog and returned for old rows when they are read. No row is touched, even with `NOT NULL`.' },
  { id: 'addvol', label: 'Add a column with a volatile default', rewrite: true, scan: true, ms: '85 ms',
    naive: [{ sql: 'ALTER TABLE orders ADD COLUMN seen_at timestamptz DEFAULT clock_timestamp();', lock: 'ACCESS EXCLUSIVE', work: 'rewrites every row and every index', long: true }],
    safe: [
      { sql: 'ALTER TABLE orders ADD COLUMN seen_at timestamptz;', lock: 'ACCESS EXCLUSIVE', work: 'catalog only' },
      { sql: "ALTER TABLE orders ALTER COLUMN seen_at SET DEFAULT clock_timestamp();", lock: 'ACCESS EXCLUSIVE', work: 'catalog only; affects new rows' },
      { sql: 'UPDATE orders SET seen_at = … WHERE id BETWEEN … ;  -- in small batches', lock: 'ROW EXCLUSIVE', work: 'an ordinary UPDATE: locks only the rows in each batch', long: true },
    ],
    why: 'A volatile function must be evaluated for every existing row, so the whole table is copied while everyone waits.',
    safeWhy: 'Add the column empty, set the default for new rows, then backfill old rows in batches. Each batch is a normal UPDATE that only locks its own rows.' },
  { id: 'type', label: 'Change int to bigint', rewrite: true, scan: true, ms: '77 ms',
    naive: [{ sql: 'ALTER TABLE orders ALTER COLUMN amount TYPE bigint;', lock: 'ACCESS EXCLUSIVE', work: 'rewrites every row and every index', long: true }],
    safe: [
      { sql: 'ALTER TABLE orders ADD COLUMN amount_new bigint;', lock: 'ACCESS EXCLUSIVE', work: 'catalog only' },
      { sql: 'UPDATE orders SET amount_new = amount WHERE id BETWEEN … ;  -- batches, plus a trigger for new writes', lock: 'ROW EXCLUSIVE', work: 'an ordinary UPDATE: locks only the rows in each batch', long: true },
      { sql: 'BEGIN; ALTER TABLE orders RENAME amount TO amount_old; ALTER TABLE orders RENAME amount_new TO amount; COMMIT;', lock: 'ACCESS EXCLUSIVE', work: 'catalog only' },
    ],
    why: 'The stored bytes of every row change size, so PostgreSQL writes a complete new copy of the table and rebuilds its indexes.',
    safeWhy: 'Build the new column alongside the old one, copy data in batches, then swap names in one quick transaction.' },
  { id: 'widen', label: 'Widen varchar(50) to varchar(100)', rewrite: false, scan: false, ms: '0.2 ms',
    naive: [{ sql: 'ALTER TABLE orders ALTER COLUMN note TYPE varchar(100);', lock: 'ACCESS EXCLUSIVE', work: 'catalog only' }],
    why: 'Every existing value already fits, and the bytes on disk are the same. Changing `varchar` to `text` is just as cheap.' },
  { id: 'notnull', label: 'Make a column NOT NULL', rewrite: false, scan: true, ms: '5 ms',
    naive: [{ sql: 'ALTER TABLE orders ALTER COLUMN status SET NOT NULL;', lock: 'ACCESS EXCLUSIVE', work: 'full table scan to prove no NULLs', long: true }],
    safe: [
      { sql: 'ALTER TABLE orders ADD CONSTRAINT orders_status_not_null NOT NULL status NOT VALID;', lock: 'ACCESS EXCLUSIVE', work: 'catalog only; new rows are checked from now on' },
      { sql: 'ALTER TABLE orders VALIDATE CONSTRAINT orders_status_not_null;', lock: 'SHARE UPDATE EXCLUSIVE', work: 'full scan, but reads and writes continue', long: true },
    ],
    why: 'PostgreSQL must read every row to prove none is NULL, and it holds the strongest lock for the whole scan.',
    safeWhy: 'PostgreSQL 18 can add a not-null constraint as `NOT VALID`, then validate it under a lock that lets traffic continue.' },
  { id: 'check', label: 'Add a CHECK constraint', rewrite: false, scan: true, ms: '7 ms',
    naive: [{ sql: 'ALTER TABLE orders ADD CONSTRAINT amount_non_negative CHECK (amount >= 0);', lock: 'ACCESS EXCLUSIVE', work: 'full table scan', long: true }],
    safe: [
      { sql: 'ALTER TABLE orders ADD CONSTRAINT amount_non_negative CHECK (amount >= 0) NOT VALID;', lock: 'ACCESS EXCLUSIVE', work: 'catalog only' },
      { sql: 'ALTER TABLE orders VALIDATE CONSTRAINT amount_non_negative;', lock: 'SHARE UPDATE EXCLUSIVE', work: 'full scan, traffic continues', long: true },
    ],
    why: 'Every existing row must be tested, while the table is locked against everything.',
    safeWhy: '`NOT VALID` starts checking new and updated rows immediately. `VALIDATE` checks the old ones later without blocking anyone.' },
  { id: 'fk', label: 'Add a foreign key', rewrite: false, scan: true, ms: '23 ms',
    naive: [{ sql: 'ALTER TABLE orders ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers;', lock: 'SHARE ROW EXCLUSIVE', work: 'scans orders; locks both tables against writes', long: true }],
    safe: [
      { sql: 'ALTER TABLE orders ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers NOT VALID;', lock: 'SHARE ROW EXCLUSIVE', work: 'catalog only, a moment' },
      { sql: 'ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;', lock: 'SHARE UPDATE EXCLUSIVE', work: 'scans orders; customers gets only ROW SHARE', long: true },
    ],
    why: 'Writes to **both** `orders` and `customers` wait while every order is checked against customers.',
    safeWhy: 'Same two-step pattern: enforce for new rows at once, validate old rows without blocking writes.' },
  { id: 'index', label: 'Create an index', rewrite: false, scan: true, ms: '24 ms',
    naive: [{ sql: 'CREATE INDEX orders_status_idx ON orders (status);', lock: 'SHARE', work: 'one scan + sort; writes wait', long: true }],
    safe: [{ sql: 'CREATE INDEX CONCURRENTLY orders_status_idx ON orders (status);', lock: 'SHARE UPDATE EXCLUSIVE', work: 'two scans, slower, writes continue', long: true }],
    why: 'Reads continue, but every INSERT, UPDATE and DELETE waits until the build finishes.',
    safeWhy: '`CONCURRENTLY` lets writes continue. It takes longer, cannot run inside a transaction block, and leaves an INVALID index behind if it fails.' },
  { id: 'rename', label: 'Rename a column', rewrite: false, scan: false, ms: '0.4 ms',
    naive: [{ sql: 'ALTER TABLE orders RENAME COLUMN status TO state;', lock: 'ACCESS EXCLUSIVE', work: 'catalog only' }],
    why: 'Instant for the database, but every running application query that says `status` breaks the moment it commits. Deploy code that handles both names first.' },
  { id: 'drop', label: 'Drop a column', rewrite: false, scan: false, ms: '0.2 ms',
    naive: [{ sql: 'ALTER TABLE orders DROP COLUMN note;', lock: 'ACCESS EXCLUSIVE', work: 'catalog only; space reused later' }],
    why: 'The column is only marked as dropped; its bytes stay in old rows until they are rewritten. Remove it from application code first.' },
]

const lockTone = (l: LockMode): Tone => (l === 'ACCESS EXCLUSIVE' ? 'dead' : BLOCKS[l].writes ? 'new' : 'ok')

/** How long a plan blocks reads or writes: for the whole long phase, only a moment, or not at all. */
function blockFor(phases: Phase[], kind: 'reads' | 'writes') {
  const b = phases.filter((p) => BLOCKS[p.lock][kind])
  return b.some((p) => p.long) ? 'whole run' : b.length ? 'a moment' : 'no'
}

function Yes({ on, good }: { on: boolean; good?: boolean }) {
  const t: Tone = on ? (good ? 'ok' : 'dead') : 'ok'
  return <span className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold" style={{ background: toneBg(t, 18), color: tone(t) }}>{on ? (good ? 'allowed' : 'blocked') : 'allowed'}</span>
}

function PhaseCard({ p, i }: { p: Phase; i: number }) {
  const b = BLOCKS[p.lock], t = lockTone(p.lock)
  return (
    <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
      className="grid gap-1.5 rounded-lg border-2 p-2.5" style={{ borderColor: tone(t), background: toneBg(t, 8) }}>
      <p className="font-mono text-[12px] break-words">{p.sql}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span className="rounded px-1.5 py-0.5 font-mono text-[11px] font-bold" style={{ background: toneBg(t, 24), color: tone(t) }}>{p.lock}</span>
        <span className="text-muted">SELECT <Yes on={b.reads} /></span>
        <span className="text-muted">INSERT / UPDATE / DELETE <Yes on={b.writes} /></span>
        <span className="text-muted">{p.work}</span>
      </div>
    </motion.div>
  )
}

function Planner() {
  const [idx, setIdx] = useState(0)
  const [plan, setPlan] = useState<'naive' | 'safe'>('naive')
  const op = OPS[idx]
  const phases = plan === 'safe' && op.safe ? op.safe : op.naive
  const choose = (i: number) => { setIdx(i); setPlan('naive') }
  return (
    <div className="grid gap-3">
      <div className="hidden flex-wrap gap-1.5 sm:flex">
        {OPS.map((o, i) => <Btn key={o.id} active={i === idx} onClick={() => choose(i)}>{o.label}</Btn>)}
      </div>
      <select aria-label="Schema change" value={idx} onChange={(e) => choose(+e.target.value)}
        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm sm:hidden">
        {OPS.map((o, i) => <option key={o.id} value={i}>{o.label}</option>)}
      </select>
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => choose((idx + 1) % OPS.length)}>Next change</Btn>
        {op.safe
          ? <Segmented label="Plan" value={plan} onChange={setPlan} options={[['naive', 'One statement'], ['safe', 'Safe recipe']]} />
          : <span className="rounded px-2 py-1 text-xs font-semibold" style={{ background: toneBg('ok', 16), color: tone('ok') }}>Already safe: catalog-only change</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([['Rewrites table', plan === 'safe' && op.safe ? 'no' : op.rewrite ? 'yes' : 'no'], ['Blocks SELECT', blockFor(phases, 'reads')], ['Blocks writes', blockFor(phases, 'writes')], ['One statement, 100k rows', op.ms]] as [string, string][]).map(([k, v]) => {
          const bad = v === 'yes' || v === 'whole run' || (k.startsWith('One') && (op.rewrite || op.scan))
          const meh = v === 'a moment'
          return (
            <div key={k} className="rounded-lg border border-line bg-surface-2 px-3 py-2">
              <p className="text-[11px] tracking-wide text-muted uppercase">{k}</p>
              <motion.p key={`${op.id}${plan}${v}`} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-mono text-base font-bold" style={{ color: tone(bad ? 'dead' : meh ? 'new' : 'ok') }}>{v}</motion.p>
            </div>
          )
        })}
      </div>
      <div className="grid gap-2">{phases.map((p, i) => <PhaseCard key={`${op.id}-${plan}-${i}`} p={p} i={i} />)}</div>
      <p className="text-sm text-muted"><Md>{plan === 'safe' && op.safeWhy ? op.safeWhy : op.why}</Md></p>
      <Legend items={[['dead', 'ACCESS EXCLUSIVE: blocks everything'], ['new', 'blocks writes'], ['ok', 'reads and writes continue']]} />
    </div>
  )
}

/* ---------- lock queue timeline ---------- */

type Kind = 'run' | 'wait' | 'error'
interface Bar { from: number; to: number; kind: Kind }
interface Lane { who: string; what: string; bars: Bar[] }
interface QS { now: number; lanes: Lane[]; timeout: boolean; queue: string[]; holder: string }

const T_MAX = 36
const NO_TIMEOUT: Lane[] = [
  { who: 'A  report', what: 'SELECT … (30 s)', bars: [{ from: 0, to: 30, kind: 'run' }] },
  { who: 'M  migration', what: 'ALTER TABLE orders ADD COLUMN note text', bars: [{ from: 5, to: 30, kind: 'wait' }, { from: 30, to: 30.6, kind: 'run' }] },
  { who: 'C  app', what: 'SELECT * FROM orders WHERE id = …', bars: [{ from: 7, to: 30.6, kind: 'wait' }, { from: 30.6, to: 31.2, kind: 'run' }] },
  { who: 'D  app', what: 'INSERT INTO orders …', bars: [{ from: 10, to: 30.6, kind: 'wait' }, { from: 30.6, to: 31.4, kind: 'run' }] },
  { who: 'E  app', what: 'SELECT * FROM orders WHERE …', bars: [{ from: 16, to: 30.6, kind: 'wait' }, { from: 30.6, to: 31.2, kind: 'run' }] },
]
const WITH_TIMEOUT: Lane[] = [
  { who: 'A  report', what: 'SELECT … (30 s)', bars: [{ from: 0, to: 30, kind: 'run' }] },
  { who: 'M  migration', what: "SET lock_timeout = '2s'; ALTER TABLE …", bars: [{ from: 5, to: 7, kind: 'wait' }, { from: 7, to: 7.6, kind: 'error' }, { from: 32, to: 32.6, kind: 'run' }] },
  { who: 'C  app', what: 'SELECT * FROM orders WHERE id = …', bars: [{ from: 6.4, to: 7, kind: 'wait' }, { from: 7, to: 7.6, kind: 'run' }] },
  { who: 'D  app', what: 'INSERT INTO orders …', bars: [{ from: 10, to: 10.8, kind: 'run' }] },
  { who: 'E  app', what: 'SELECT * FROM orders WHERE …', bars: [{ from: 16, to: 16.6, kind: 'run' }] },
]

const qsteps: Step<QS>[] = [
  { title: 'A long report holds a weak lock', body: 'Session A runs a 30-second report. Every query takes at least **ACCESS SHARE** on the table it reads. Normal traffic does not conflict with it.',
    state: { now: 4, lanes: NO_TIMEOUT, timeout: false, queue: [], holder: 'A: ACCESS SHARE' } },
  { title: 'The migration has to wait', body: 'Session M runs a "harmless" `ADD COLUMN`. It needs **ACCESS EXCLUSIVE**, which conflicts with A\'s lock, so M joins the **lock queue** and waits.',
    state: { now: 6, lanes: NO_TIMEOUT, timeout: false, queue: ['M wants ACCESS EXCLUSIVE'], holder: 'A: ACCESS SHARE' } },
  { title: 'Everyone queues behind the migration', body: 'C\'s simple SELECT is compatible with A, but it must not jump ahead of M, which is already waiting. So C waits too. The table is now **unavailable**, even though nothing is running on it.',
    state: { now: 12, lanes: NO_TIMEOUT, timeout: false, queue: ['M wants ACCESS EXCLUSIVE', 'C wants ACCESS SHARE', 'D wants ROW EXCLUSIVE'], holder: 'A: ACCESS SHARE' } },
  { title: 'The pile-up grows', body: 'Every new request lands behind M. Connection pools fill up and the application starts timing out, all because of one long report and one quick ALTER.',
    state: { now: 22, lanes: NO_TIMEOUT, timeout: false, queue: ['M wants ACCESS EXCLUSIVE', 'C wants ACCESS SHARE', 'D wants ROW EXCLUSIVE', 'E wants ACCESS SHARE'], holder: 'A: ACCESS SHARE' } },
  { title: 'A finishes, the queue drains', body: 'At 30 s A commits. M gets its lock, finishes in under a millisecond, and the waiting sessions all run. The ALTER was fast. **The wait was the outage.**',
    state: { now: 32, lanes: NO_TIMEOUT, timeout: false, queue: [], holder: 'none' } },
  { title: 'Replay with lock_timeout = 2s', body: 'M sets `lock_timeout` first. After waiting 2 s it gives up: `ERROR: canceling statement due to lock timeout` (SQLSTATE **55P03**). The queue clears and C, D and E run normally.',
    state: { now: 18, lanes: WITH_TIMEOUT, timeout: true, queue: [], holder: 'A: ACCESS SHARE' } },
  { title: 'Retry when the table is quiet', body: 'The migration script simply retries. Once A is gone, M gets its lock at once. Outcome: a failed attempt or two, but **no stall** for users.',
    state: { now: 34, lanes: WITH_TIMEOUT, timeout: true, queue: [], holder: 'none' } },
]

function Timeline({ s }: { s: QS }) {
  const L = 118, W = 600, R = 10, LH = 34, top = 18
  const x = (t: number) => L + (t / T_MAX) * (W - L - R)
  const H = top + s.lanes.length * LH + 22
  const kTone = (k: Kind): Tone => (k === 'run' ? 'tuple' : k === 'wait' ? 'new' : 'dead')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label="Session timeline">
      {[0, 5, 10, 15, 20, 25, 30, 35].map((t) => (
        <g key={t}><line x1={x(t)} y1={top - 4} x2={x(t)} y2={H - 18} stroke="var(--border)" strokeDasharray="2 3" />
          <text x={x(t)} y={H - 6} fontSize={10} textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)">{t}s</text></g>
      ))}
      {s.lanes.map((ln, i) => {
        const y = top + i * LH
        return (
          <g key={ln.who}>
            <text x={4} y={y + 13} fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{ln.who}</text>
            <text x={4} y={y + 26} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{ln.what.length > 20 ? ln.what.slice(0, 19) + '…' : ln.what}</text>
            {ln.bars.filter((b) => b.from < s.now).map((b, j) => {
              const end = Math.min(b.to, s.now), w = Math.max(3, x(end) - x(b.from)), t = kTone(b.kind)
              return <motion.rect key={`${s.timeout}-${i}-${j}`} x={x(b.from)} y={y + 4} height={20} rx={3} initial={{ width: 0 }} animate={{ width: w }} transition={{ duration: 0.5 }}
                fill={toneBg(t, b.kind === 'wait' ? 30 : 55)} stroke={tone(t)} strokeWidth={1} strokeDasharray={b.kind === 'wait' ? '4 2' : undefined} />
            })}
          </g>
        )
      })}
      <motion.line initial={false} animate={{ x1: x(s.now), x2: x(s.now) }} y1={top - 8} y2={H - 18} stroke="var(--accent)" strokeWidth={2} />
      <motion.text initial={false} animate={{ x: x(s.now) }} y={top - 10} fontSize={10} textAnchor="middle" fill="var(--accent)" fontFamily="var(--font-mono)">now {s.now}s</motion.text>
    </svg>
  )
}

function renderQ(s: QS) {
  return (
    <div className="grid gap-3">
      <p className="font-mono text-[12px] text-muted">{s.timeout ? "M runs: SET lock_timeout = '2s'; ALTER TABLE orders ADD COLUMN note text;" : 'M runs: ALTER TABLE orders ADD COLUMN note text;'}</p>
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin"><Timeline s={s} /></div>
      <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2"><p className="text-[11px] tracking-wide text-muted uppercase">Lock held on orders</p><p className="font-mono text-sm font-bold">{s.holder}</p></div>
        <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
          <p className="text-[11px] tracking-wide text-muted uppercase">Lock queue (first in line on the left)</p>
          <div className="mt-1 flex min-h-[26px] flex-wrap gap-1.5">
            {s.queue.length === 0 && <span className="text-xs text-muted">empty</span>}
            {s.queue.map((q, i) => (
              <motion.span key={q} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded px-2 py-0.5 font-mono text-[11.5px]"
                style={{ background: toneBg(i === 0 ? 'dead' : 'new', 18), color: tone(i === 0 ? 'dead' : 'new') }}>{q}</motion.span>
            ))}
          </div>
        </div>
      </div>
      <Legend items={[['tuple', 'running'], ['new', 'waiting for a lock'], ['dead', 'cancelled by lock_timeout']]} />
    </div>
  )
}

function SchemaViz() {
  const [tab, setTab] = useState<'plan' | 'queue'>('plan')
  return (
    <div className="grid gap-3">
      <div><Segmented label="View" value={tab} onChange={setTab} options={[['plan', 'Migration planner'], ['queue', 'Lock queue']]} /></div>
      {tab === 'plan' ? <Planner /> : <Stepper steps={qsteps} render={renderQ} interval={3000} />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'schema-changes',
  module: 'f3',
  order: 5,
  title: 'Changing a schema safely',
  tldr: [
    'Every `ALTER TABLE` takes a **lock** on the table, and some forms also **rewrite** or **scan** every row while holding it.',
    'Knowing which changes are instant, which ones block traffic, and the two-step recipes that avoid blocking lets you change a live database without an outage.',
  ],
  visualizer: {
    title: 'What does this ALTER really do?',
    caption: 'In the planner, pick a change and compare **One statement** with the **Safe recipe**. Then open **Lock queue** to see how a quick ALTER can still stall a whole application.',
    Component: SchemaViz,
  },
  playground: {
    setup: `CREATE TABLE customers (
  id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL
);
INSERT INTO customers (name) SELECT 'customer ' || g FROM generate_series(1, 1000) g;

CREATE TABLE orders (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint,
  status      text,
  amount      int,
  note        varchar(50)
);
INSERT INTO orders (customer_id, status, amount, note)
SELECT 1 + g % 1000, 'paid', g % 500, 'ok' FROM generate_series(1, 100000) g;

CREATE VIEW my_locks AS
  SELECT c.relname AS table_name, l.mode, l.granted
  FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
  WHERE l.pid = pg_backend_pid() AND c.relname IN ('orders', 'customers');`,
    presets: [
      { label: '1. Which lock does an ALTER take?', sql: `BEGIN;
ALTER TABLE orders ADD COLUMN coupon text;
SELECT * FROM my_locks ORDER BY 1, 2;
ROLLBACK;`,
        note: 'Run inside a transaction so the lock is still held when we look. `AccessExclusiveLock` blocks every other session, even plain SELECTs, until the transaction ends.' },
      { label: '2. Rewrite or not?', sql: `SELECT pg_relation_filenode('orders') AS file_before;

ALTER TABLE orders ADD COLUMN region text NOT NULL DEFAULT 'eu';
SELECT pg_relation_filenode('orders') AS after_constant_default;

ALTER TABLE orders ADD COLUMN seen_at timestamptz DEFAULT clock_timestamp();
SELECT pg_relation_filenode('orders') AS after_volatile_default;`,
        note: 'The file number stays the same for the constant default: only the catalog changed. The volatile default gets a **new file number**, because every row was copied into a new file.' },
      { label: '3. Type changes', sql: `SELECT pg_relation_filenode('orders') AS before;
ALTER TABLE orders ALTER COLUMN note TYPE varchar(100);
SELECT pg_relation_filenode('orders') AS after_widening_varchar;
ALTER TABLE orders ALTER COLUMN amount TYPE bigint;
SELECT pg_relation_filenode('orders') AS after_int_to_bigint;`,
        note: 'Widening a `varchar` keeps the same file. `int` to `bigint` changes how every row is stored, so the table and its indexes are rewritten.' },
      { label: '4. NOT NULL without a long lock', sql: `ALTER TABLE orders ADD CONSTRAINT orders_status_not_null NOT NULL status NOT VALID;

SELECT convalidated FROM pg_constraint WHERE conname = 'orders_status_not_null';

BEGIN;
ALTER TABLE orders VALIDATE CONSTRAINT orders_status_not_null;
SELECT * FROM my_locks;
COMMIT;

SELECT convalidated FROM pg_constraint WHERE conname = 'orders_status_not_null';`,
        note: 'Step 1 is instant, and new rows with a NULL `status` are rejected from then on. Step 2 scans the table under **ShareUpdateExclusiveLock**, which lets reads and writes continue. `convalidated` goes from false to true: every old row is now proven.' },
      { label: '5. Foreign key in two steps', sql: `ALTER TABLE orders ADD CONSTRAINT orders_customer_fk
  FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;

SELECT convalidated FROM pg_constraint WHERE conname = 'orders_customer_fk';

BEGIN;
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;
SELECT * FROM my_locks ORDER BY 1, 2;
COMMIT;

SELECT convalidated FROM pg_constraint WHERE conname = 'orders_customer_fk';`,
        note: '`convalidated` goes from false to true. During validation, `orders` holds ShareUpdateExclusive and `customers` only light read locks (AccessShare, RowShare): no writes were blocked.' },
      { label: '6. Index without blocking writes', sql: `CREATE INDEX CONCURRENTLY orders_status_idx ON orders (status);

SELECT indexrelid::regclass AS index_name, indisvalid
FROM pg_index WHERE indrelid = 'orders'::regclass;`,
        note: '`CONCURRENTLY` must run on its own, outside `BEGIN … COMMIT`. If it fails it leaves an index with `indisvalid = false` that you must drop and retry.' },
      { label: '7. Guard rails for migrations', sql: `SET lock_timeout = '2s';
SET statement_timeout = '15min';

SHOW lock_timeout;
SHOW statement_timeout;`,
        note: 'Put these at the top of every migration. A migration that cannot get its lock within 2 s fails fast (SQLSTATE **55P03**) instead of queueing the whole application behind it.' },
    ],
  },
  production: {
    title: 'A one-line migration that took the API down',
    context: 'A team deployed `ALTER TABLE orders ADD COLUMN gift_message text;` during business hours. The statement itself takes a millisecond.',
    problem: 'A nightly analytics query was still reading `orders`. The ALTER waited for it, and every API request touching `orders` queued behind the waiting ALTER. For four minutes the connection pool was exhausted and the API returned errors.',
    solution: 'Make every migration fail fast instead of waiting, and retry it. Long-running reads were moved to a replica, and risky changes now use two-step recipes.',
    sql: `-- top of every migration
SET lock_timeout = '2s';
SET statement_timeout = '15min';

ALTER TABLE orders ADD COLUMN gift_message text;
-- on SQLSTATE 55P03: wait a few seconds, retry (up to N times)

-- see who is blocking whom while it runs
SELECT pid, pg_blocking_pids(pid) AS blocked_by, wait_event_type, left(query, 60)
FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;`,
    outcome: 'Later migrations sometimes needed two or three attempts, but none stalled traffic for more than the 2-second timeout.',
  },
  pitfalls: [
    { title: 'A quick ALTER behind a long transaction',
      symptom: 'A migration "hangs", and at the same time all queries on the table pile up and time out.',
      cause: 'The ALTER waits for an **ACCESS EXCLUSIVE** lock. While it waits in the queue, every later request on the table waits behind it.',
      fix: 'Always `SET lock_timeout` before DDL and retry on failure. Find blockers with `pg_blocking_pids()`.',
      sql: `SET lock_timeout = '2s';` },
    { title: 'A volatile default rewrites the table',
      symptom: 'Adding a column takes minutes on a big table and blocks everything meanwhile.',
      cause: 'Defaults such as `clock_timestamp()` or `gen_random_uuid()` must be computed per row, so the whole table is rewritten. Constant defaults are instant.',
      fix: 'Add the column without a default, `SET DEFAULT` for new rows, then backfill old rows in batches.' },
    { title: 'A failed CREATE INDEX CONCURRENTLY',
      symptom: 'Queries ignore the new index, yet writes are slower than before.',
      cause: 'If a concurrent build fails (a duplicate in a unique index, a cancel), it leaves an **INVALID** index that is still maintained on every write.',
      fix: 'Check `pg_index.indisvalid`, drop the invalid index, fix the cause and build it again.',
      sql: `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY orders_status_idx;` },
    { title: 'Renaming or dropping what running code still uses',
      symptom: 'Errors like `column "status" does not exist` right after a deploy.',
      cause: 'The database change is instant, but old application instances are still running queries with the old name.',
      fix: 'Expand, then contract: add the new column, deploy code that writes both and reads the new one, backfill, and only then drop the old column in a later release.' },
  ],
  pointers: [
    'Most `ALTER TABLE` forms take **ACCESS EXCLUSIVE**, which blocks even SELECT. The danger is how *long* it is held, and how long it *waits*.',
    'Instant (catalog only): add a nullable column, add a column with a **constant** default, widen `varchar`, drop or rename a column. Rewrites: **volatile** defaults, identity columns, most type changes.',
    'For constraints on big tables: `ADD … NOT VALID`, then `VALIDATE CONSTRAINT` (reads and writes continue). For indexes: `CREATE INDEX CONCURRENTLY`.',
    'Start every migration with `SET lock_timeout`, keep each step small, and retry on SQLSTATE 55P03.',
    '**Going deeper:** [Heavyweight locks and the conflict matrix](/m5/table-locks) explains every lock mode and which ones conflict.',
  ],
  sources: ['sql-altertable.html', 'ddl-alter.html', 'sql-createindex.html', 'explicit-locking.html', 'runtime-config-client.html', 'view-pg-locks.html', 'functions-info.html'],
}
