import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the playground's events table (RANGE by month + DEFAULT, 87,840 rows) and real EXPLAIN
 * output for each query, captured on PostgreSQL 18. Pruning happens at plan time (partition missing
 * from the plan), at executor start ("Subplans Removed: N") or during execution ("(never executed)").
 * Retention numbers measured with pg_current_wal_insert_lsn(): DELETE of one month 1224 kB of WAL,
 * DROP TABLE of a partition 4824 bytes.
 * ---------------------------------------------------------------------------------------------- */

const PARTS = [
  { name: 'events_2026_08', bound: "FROM ('2026-08-01') TO ('2026-09-01')", rows: 22320 },
  { name: 'events_2026_09', bound: "FROM ('2026-09-01') TO ('2026-10-01')", rows: 21600 },
  { name: 'events_2026_10', bound: "FROM ('2026-10-01') TO ('2026-11-01')", rows: 22320 },
  { name: 'events_2026_11', bound: "FROM ('2026-11-01') TO ('2026-12-01')", rows: 21600 },
  { name: 'events_default', bound: 'DEFAULT', rows: 0 },
]
type Fate = 'scan' | 'plan' | 'init' | 'never'
interface Q { key: string; label: string; sql: string; fates: Fate[]; stage: string; why: string; plan: string[] }
const QUERIES: Q[] = [
  { key: 'const', label: 'constant range', stage: 'plan time',
    sql: "SELECT count(*) FROM events\nWHERE created_at >= '2026-10-01' AND created_at < '2026-10-08';",
    fates: ['plan', 'plan', 'scan', 'plan', 'plan'],
    why: 'The planner compares the constants with each partition\'s bounds and leaves four partitions out of the plan entirely. Even the Append node disappears.',
    plan: ['Aggregate', '  ->  Index Only Scan using events_2026_10_created_at_idx on events_2026_10 events', "        Index Cond: ((created_at >= '2026-10-01 00:00:00+00') AND (created_at < '2026-10-08 00:00:00+00'))"] },
  { key: 'nokey', label: 'filter on a non-key column', stage: 'no pruning',
    sql: "SELECT count(*) FROM events WHERE kind = 'buy';",
    fates: ['scan', 'scan', 'scan', 'scan', 'scan'],
    why: 'Pruning uses only the **partition key**. A filter on `kind` says nothing about bounds, so every partition is scanned.',
    plan: ['Aggregate', '  ->  Append', '        ->  Seq Scan on events_2026_08 events_1', "              Filter: (kind = 'buy'::text)", '        ->  Seq Scan on events_2026_09 events_2', '        ->  Seq Scan on events_2026_10 events_3', '        ->  Seq Scan on events_2026_11 events_4', '        ->  Seq Scan on events_default events_5'] },
  { key: 'param', label: 'prepared, generic plan', stage: 'executor start',
    sql: "PREPARE day_count(timestamptz) AS\n  SELECT count(*) FROM events WHERE created_at >= $1 AND created_at < $1 + interval '1 day';\nSET plan_cache_mode = force_generic_plan;\nEXPLAIN ANALYZE EXECUTE day_count('2026-09-10');",
    fates: ['init', 'scan', 'init', 'init', 'init'],
    why: 'A generic plan cannot know `$1` at plan time, so it keeps all five subplans. When execution starts the value is known and four are removed: **Subplans Removed: 4**. They were still locked.',
    plan: ['Aggregate (actual rows=1.00 loops=1)', '  ->  Append (actual rows=720.00 loops=1)', '        Subplans Removed: 4', '        ->  Index Only Scan using events_2026_09_created_at_idx on events_2026_09 events_1 (actual rows=720.00 loops=1)', '              Index Cond: ((created_at >= $1) AND (created_at < ($1 + \'1 day\'::interval)))'] },
  { key: 'sub', label: 'value from a subquery', stage: 'during execution',
    sql: "SELECT count(*) FROM events\nWHERE created_at >= (SELECT d FROM wanted)\n  AND created_at <  (SELECT d FROM wanted) + interval '1 day';",
    fates: ['never', 'never', 'scan', 'never', 'never'],
    why: 'The bound comes from an InitPlan that runs inside the query. The Append prunes once the value exists, so four subplans show **(never executed)** in EXPLAIN ANALYZE.',
    plan: ['Aggregate (actual rows=1.00 loops=1)', '  InitPlan 1  ->  Seq Scan on wanted (actual rows=1.00 loops=1)', '  ->  Append (actual rows=720.00 loops=1)', '        ->  Index Only Scan … on events_2026_08 events_1 (never executed)', '        ->  Index Only Scan … on events_2026_09 events_2 (never executed)', '        ->  Index Only Scan … on events_2026_10 events_3 (actual rows=720.00 loops=1)', '        ->  Index Only Scan … on events_2026_11 events_4 (never executed)', '        ->  Seq Scan on events_default events_5 (never executed)'] },
]
const fateTone: Record<Fate, Tone> = { scan: 'ok', plan: 'muted', init: 'header', never: 'new' }
const fateLabel: Record<Fate, string> = { scan: 'scanned', plan: 'pruned at plan time', init: 'removed at executor start', never: 'never executed' }

function route(d: string) {
  const i = PARTS.findIndex((_, j) => j < 4 && d >= `2026-${String(8 + j).padStart(2, '0')}-01` && d < (j === 3 ? '2026-12-01' : `2026-${String(9 + j).padStart(2, '0')}-01`))
  return i < 0 ? 4 : i
}
const DATES = ['2026-08-15', '2026-09-30', '2026-10-01', '2026-11-30', '2027-01-05', '2026-07-31']

function PartitionViz() {
  const [qi, setQi] = useState(0)
  const [ins, setIns] = useState<{ d: string; to: number; n: number } | null>(null)
  const [dropped, setDropped] = useState<'none' | 'delete' | 'drop'>('none')
  const q = QUERIES[qi]
  const insert = () => {
    const n = (ins?.n ?? -1) + 1
    const d = DATES[n % DATES.length]
    setIns({ d, to: route(d), n })
  }
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        {QUERIES.map((x, i) => (
          <button key={x.key} onClick={() => setQi(i)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${i === qi ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface hover:border-accent'}`}>{x.label}</button>
        ))}
        <Btn primary testid="viz-next" onClick={() => setQi((qi + 1) % QUERIES.length)}>Next query</Btn>
      </div>
      <Legend items={[['ok', 'scanned'], ['muted', 'pruned at plan time'], ['header', 'removed at executor start'], ['new', 'never executed (run-time pruning)']]} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 [&>*]:min-w-0">
        {PARTS.map((p, i) => {
          const f = q.fates[i]
          const gone = (dropped === 'drop' && i === 0)
          return (
            <motion.div key={p.name} layout className="relative rounded-lg border p-2" animate={{ opacity: gone ? 0.25 : f === 'plan' ? 0.55 : 1 }}
              style={{ borderColor: tone(fateTone[f]), background: toneBg(fateTone[f], f === 'scan' ? 18 : 10), borderStyle: f === 'plan' || gone ? 'dashed' : 'solid' }}>
              <p className="truncate font-mono text-[11.5px] font-bold">{p.name}</p>
              <p className="font-mono text-[10px] leading-tight text-muted">{p.bound === 'DEFAULT' ? <>DEFAULT<br />everything else</> : <>from {p.bound.slice(7, 17)}<br />to {p.bound.slice(25, 35)} (excl.)</>}</p>
              <p className="mt-1 font-mono text-xs">{gone ? 'dropped' : `${(i === 0 && dropped === 'delete' ? 0 : p.rows + (ins && ins.to === i ? 1 : 0)).toLocaleString('en-US')} rows`}</p>
              <p className="mt-1 text-[11px] font-semibold" style={{ color: tone.text(fateTone[f]) }}>{fateLabel[f]}</p>
              <AnimatePresence>
                {ins && ins.to === i && (
                  <motion.span key={ins.n} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                    className="absolute -top-2 right-2 rounded px-1.5 font-mono text-[10px] font-bold" style={{ background: tone('tuple'), color: 'var(--surface)' }}>+1</motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
      <div className="grid gap-3 [&>*]:min-w-0">
        <Panel title={`Query · pruning: ${q.stage}`}>
          <pre className="overflow-x-auto rounded bg-code p-2 font-mono text-[11.5px] leading-snug">{q.sql}</pre>
          <p className="mt-2 text-sm text-muted"><Md>{q.why}</Md></p>
        </Panel>
        <Panel title="EXPLAIN (trimmed)">
          <AnimatePresence mode="wait">
            <motion.pre key={q.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto rounded bg-code p-2 font-mono text-[11px] leading-snug">
              {q.plan.map((l, i) => <div key={i} style={{ color: /never executed|Subplans Removed/.test(l) ? tone(/never/.test(l) ? 'new' : 'header') : undefined }}>{l}</div>)}
            </motion.pre>
          </AnimatePresence>
        </Panel>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Tuple routing">
          <div className="flex flex-wrap items-center gap-2">
            <Btn onClick={insert}>INSERT a row</Btn>
            {ins && <span className="font-mono text-xs">created_at = '{ins.d}' → <b style={{ color: tone.text(ins.to === 4 ? 'new' : 'tuple') }}>{PARTS[ins.to].name}</b></span>}
          </div>
          <p className="mt-2 text-xs text-muted"><Md>{'Bounds are **inclusive below, exclusive above**: `2026-10-01` belongs to October. Rows outside every range land in the DEFAULT partition; without one, the INSERT fails.'}</Md></p>
        </Panel>
        <Panel title="Retention: drop a month">
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => setDropped('delete')}>DELETE … WHERE created_at &lt; '2026-09-01'</Btn>
            <Btn onClick={() => setDropped('drop')}>DROP TABLE events_2026_08</Btn>
            <Btn onClick={() => setDropped('none')} disabled={dropped === 'none'}>Reset</Btn>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Stat label="WAL written" value={dropped === 'none' ? '—' : dropped === 'delete' ? '1224 kB' : '4824 B'} t={dropped === 'delete' ? 'dead' : 'ok'} />
            <Stat label="dead rows left" value={dropped === 'none' ? '—' : dropped === 'delete' ? '22,320' : '0'} t={dropped === 'delete' ? 'dead' : 'ok'} sub={dropped === 'delete' ? 'VACUUM must clean them' : undefined} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'partitioning',
  module: 'm7',
  order: 8,
  title: 'Declarative partitioning and pruning',
  tldr: [
    'A **partitioned table** has no storage of its own: each row is routed by its partition key to one partition, an ordinary table with its own heap, indexes and statistics.',
    'Queries that constrain the key touch only the relevant partitions through **partition pruning**, and old data leaves by dropping a whole partition instead of deleting rows.',
  ],
  visualizer: {
    title: 'Which partitions does a query touch?',
    caption: 'Pick a query and see where pruning happens (plan time, executor start, or run time), next to its EXPLAIN output. Then route a few rows and compare DELETE with DROP for retention.',
    Component: PartitionViz,
  },
  playground: {
    setup: `
SET TIME ZONE 'UTC';
CREATE TABLE events (
  id bigint GENERATED ALWAYS AS IDENTITY, created_at timestamptz NOT NULL, kind text NOT NULL, payload text
) PARTITION BY RANGE (created_at);
CREATE TABLE events_2026_08 PARTITION OF events FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE events_2026_09 PARTITION OF events FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE events_2026_10 PARTITION OF events FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE events_2026_11 PARTITION OF events FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE events_default PARTITION OF events DEFAULT;
INSERT INTO events (created_at, kind, payload)
SELECT timestamptz '2026-08-01' + g * interval '2 minutes', (ARRAY['click','view','buy'])[1 + g % 3], md5(g::text)
FROM generate_series(0, 87839) g;
CREATE INDEX ON events (created_at);
ANALYZE events;
CREATE TABLE wanted (d timestamptz);
INSERT INTO wanted VALUES ('2026-10-15');
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN 'ERROR: ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'Partitions and routing', sql: `SELECT tableoid::regclass AS partition, count(*), min(created_at), max(created_at)
FROM events GROUP BY 1 ORDER BY 1;

SELECT c.relname, pg_get_expr(c.relpartbound, c.oid) AS bound
FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
WHERE i.inhparent = 'events'::regclass ORDER BY 1;

SELECT pg_relation_size('events') AS parent_bytes;`,
        note: 'The parent stores nothing (0 bytes). `tableoid` shows which partition each row was routed to.' },
      { label: 'Plan-time pruning', sql: `EXPLAIN (COSTS OFF)
SELECT count(*) FROM events WHERE created_at >= '2026-10-01' AND created_at < '2026-10-08';

SET enable_partition_pruning = off;
EXPLAIN (COSTS OFF)
SELECT count(*) FROM events WHERE created_at >= '2026-10-01' AND created_at < '2026-10-08';
RESET enable_partition_pruning;`,
        note: 'With pruning only `events_2026_10` appears. Turn it off and the plan becomes an Append over all five partitions.' },
      { label: 'Pruning at executor start', sql: `PREPARE day_count(timestamptz) AS
  SELECT count(*) FROM events WHERE created_at >= $1 AND created_at < $1 + interval '1 day';
SET plan_cache_mode = force_generic_plan;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF) EXECUTE day_count('2026-09-10');
RESET plan_cache_mode;
DEALLOCATE day_count;`,
        note: 'Look for **Subplans Removed: 4**: the generic plan kept every partition, and pruning ran when the parameter became known.' },
      { label: 'Pruning during execution', sql: `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT count(*) FROM events
WHERE created_at >= (SELECT d FROM wanted) AND created_at < (SELECT d FROM wanted) + interval '1 day';`,
        note: 'Four subplans say **(never executed)**: the value came from an InitPlan, so the Append pruned at run time.' },
      { label: 'Unique keys must include the partition key', sql: `SELECT try_sql('ALTER TABLE events ADD PRIMARY KEY (id)') AS pk_on_id_alone;

ALTER TABLE events ADD PRIMARY KEY (id, created_at);
SELECT indexrelid::regclass AS index, indrelid::regclass AS on_table
FROM pg_index WHERE indisprimary
  AND indrelid IN (SELECT inhrelid FROM pg_inherits WHERE inhparent = 'events'::regclass)
ORDER BY 1;`,
        note: 'Each partition enforces uniqueness only inside itself, so a primary key on `id` alone is rejected. With `created_at` added it works, and the parent\'s key creates one index per partition.' },
      { label: 'Partition-wise aggregate and HASH', sql: `EXPLAIN (COSTS OFF) SELECT kind, count(*) FROM events GROUP BY kind;

SET enable_partitionwise_aggregate = on;
EXPLAIN (COSTS OFF) SELECT kind, count(*) FROM events GROUP BY kind;
RESET enable_partitionwise_aggregate;

CREATE TABLE by_user (user_id int, v text) PARTITION BY HASH (user_id);
CREATE TABLE by_user_0 PARTITION OF by_user FOR VALUES WITH (MODULUS 2, REMAINDER 0);
CREATE TABLE by_user_1 PARTITION OF by_user FOR VALUES WITH (MODULUS 2, REMAINDER 1);
EXPLAIN (COSTS OFF) SELECT * FROM by_user WHERE user_id = 7;`,
        note: 'Partition-wise aggregation is off by default because it costs planning time. On, each partition is aggregated separately (`Partial HashAggregate`) and the results are combined; `enable_partitionwise_join` does the same for joins between identically partitioned tables. HASH partitions spread rows by the remainder of the key\'s hash and prune on equality only: `user_id = 7` reads one partition.' },
      { label: 'Retention: DELETE vs DROP', sql: `SELECT set_config('lab.a', pg_current_wal_insert_lsn()::text, false);
DELETE FROM events WHERE created_at < '2026-09-01';
SELECT set_config('lab.b', pg_current_wal_insert_lsn()::text, false);
DROP TABLE events_2026_09;

SELECT pg_size_pretty(current_setting('lab.b')::pg_lsn - current_setting('lab.a')::pg_lsn) AS delete_one_month_wal,
       pg_size_pretty(pg_current_wal_insert_lsn() - current_setting('lab.b')::pg_lsn) AS drop_one_month_wal;`,
        note: 'DELETE logged every row (about 1.2 MB) and left 22,320 dead rows for VACUUM. DROP removed a month in a few kB of WAL and left nothing to clean.' },
      { label: 'Add next month with ATTACH', sql: `CREATE TABLE events_2026_12 (LIKE events INCLUDING DEFAULTS);
ALTER TABLE events_2026_12 ADD CONSTRAINT dec_bounds
  CHECK (created_at >= '2026-12-01' AND created_at < '2027-01-01');
INSERT INTO events_2026_12 (id, created_at, kind) VALUES (1, '2026-12-03', 'view');
ALTER TABLE events ATTACH PARTITION events_2026_12 FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
ALTER TABLE events_2026_12 DROP CONSTRAINT dec_bounds;

SELECT tableoid::regclass, count(*) FROM events WHERE created_at >= '2026-12-01' GROUP BY 1;`,
        note: 'ATTACH takes only SHARE UPDATE EXCLUSIVE on the parent. The matching CHECK constraint lets it skip the validation scan; the DEFAULT partition is still checked for December rows.' },
      { label: 'DEFAULT partition traps', sql: `INSERT INTO events (created_at, kind) VALUES ('2027-01-15', 'view');   -- no January partition yet
SELECT tableoid::regclass AS landed_in, count(*) FROM events WHERE created_at >= '2027-01-01' GROUP BY 1;

SELECT try_sql($$CREATE TABLE events_2027_01 PARTITION OF events
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01')$$) AS create_january;

BEGIN;
CREATE TABLE events_2027_01 (LIKE events INCLUDING DEFAULTS);
WITH moved AS (
  DELETE FROM events_default WHERE created_at >= '2027-01-01' AND created_at < '2027-02-01' RETURNING *)
INSERT INTO events_2027_01 SELECT * FROM moved;
ALTER TABLE events ATTACH PARTITION events_2027_01 FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
COMMIT;

SELECT tableoid::regclass AS now_in, count(*) FROM events WHERE created_at >= '2027-01-01' GROUP BY 1;
SELECT partdefid::regclass AS default_partition FROM pg_partitioned_table WHERE partrelid = 'events'::regclass;`,
        note: 'A late row lands in the DEFAULT partition, and then creating January **fails**: the new bounds would make that row belong elsewhere. Moving the rows out and attaching in one transaction fixes it. As long as `partdefid` is set, `DETACH … CONCURRENTLY` is refused too.' },
    ],
  },
  production: {
    title: 'Monthly partitions for a 3-year event log',
    context: 'An analytics product keeps 36 months of click events, about 1.5 billion rows, and deletes the oldest month every month. Most queries look at the last 7 days.',
    problem: 'The monthly `DELETE` produced tens of GB of WAL, saturated the replica link, and left a month of dead rows that autovacuum took days to clear. Recent-data queries still walked indexes covering three years.',
    solution: 'Range-partition by `created_at` per month. Create next month\'s partition ahead of time, and retire the oldest month with `DETACH PARTITION … CONCURRENTLY` and `DROP TABLE`. Queries filter on `created_at`, so they prune to one or two partitions.',
    sql: `-- once a month, in a job
CREATE TABLE events_2027_01 PARTITION OF events
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

ALTER TABLE events DETACH PARTITION events_2024_01 CONCURRENTLY;  -- no DEFAULT partition allowed
DROP TABLE events_2024_01;

-- a typical query prunes to the newest partitions
EXPLAIN SELECT count(*) FROM events WHERE created_at >= now() - interval '7 days';`,
    outcome: 'Retention became a metadata operation of a few kB of WAL (dropping a 22,000-row month writes about 5 kB, deleting it about 1.2 MB), with no dead rows. Recent-data queries touch one month instead of 36, so their indexes are 36 times smaller and stay in cache.',
  },
  pitfalls: [
    { title: 'Queries that do not mention the partition key',
      symptom: 'A lookup by `user_id` on a partitioned table is slower than before partitioning; EXPLAIN shows an Append over every partition.',
      cause: 'Pruning uses only conditions on the partition key. Without one, every partition and every partition index is searched.',
      fix: 'Partition by the column most queries filter on, add the key to hot queries, or accept the fan-out for rare queries.' },
    { title: 'DETACH CONCURRENTLY refused',
      symptom: '`ERROR: cannot detach partitions concurrently when a default partition exists`.',
      cause: 'A popular rotation recipe adds a DEFAULT partition as a safety net and later detaches old partitions with CONCURRENTLY. The two do not mix: concurrent detach is refused while a DEFAULT partition exists, and it cannot run inside a transaction block either.',
      fix: 'Avoid a DEFAULT partition on tables you rotate (create future partitions ahead of time instead), or use a plain DETACH in a short maintenance window.',
      sql: `ALTER TABLE events DETACH PARTITION events_2026_08;  -- takes ACCESS EXCLUSIVE on the parent` },
    { title: 'Too many partitions',
      symptom: 'Planning time and backend memory grow; simple queries that cannot prune become slow to plan.',
      cause: 'Every partition a session touches loads metadata into its local memory, and planning considers each one that is not pruned.',
      fix: 'Keep partition counts in the hundreds to low thousands, choose coarser ranges, and make sure common queries prune.' },
    { title: 'A DEFAULT partition that quietly fills up',
      symptom: '`CREATE TABLE … PARTITION OF` for next month fails with `updated partition constraint for default partition would be violated by some row`, and every new partition takes longer to add.',
      cause: 'Rows with no matching range were routed to the DEFAULT partition. Adding a range scans the default for rows that would now belong to it, and refuses if any exist.',
      fix: 'Create partitions ahead of time and alert when the default holds any rows. To add a range, move its rows out of the default and ATTACH in one transaction (the last playground preset).',
      sql: `SELECT count(*) FROM events_default;  -- should stay 0` },
  ],
  pointers: [
    'RANGE / LIST / HASH; range bounds are **inclusive below, exclusive above**; the parent has **no storage**.',
    'Pruning at **plan time** (constants), **executor start** (`Subplans Removed`), and **run time** (`(never executed)`).',
    'PRIMARY KEY / UNIQUE must **include the partition key**; an index on the parent is created on every partition.',
    'Retention: **DROP / DETACH a partition**, not DELETE; ATTACH with a matching CHECK to skip validation.',
    'Autovacuum handles partitions, but **ANALYZE the parent** yourself.',
  ],
  sources: ['ddl-partitioning.html', 'sql-createtable.html', 'sql-altertable.html', 'runtime-config-query.html', 'sql-explain.html'],
}
