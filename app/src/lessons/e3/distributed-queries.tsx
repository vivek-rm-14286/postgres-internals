import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Code, Packet } from './_ui'
import { ADS_SCHEMA } from './_schema'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: how a Citus coordinator executes five kinds of query over four shard groups.
 * Row counts and partial aggregates are the real numbers of the playground data set
 * (ads per shard 1000 / 1300 / 700 / 1000; sum(clicks) 42900 / 55250 / 29750 / 42300).
 * EXPLAIN text follows the shape Citus prints: Custom Scan (Citus Adaptive), Task Count, Tasks Shown.
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'router' | 'agg' | 'coloc' | 'repart' | 'rebalance'
type Traffic = 'out' | 'back' | 'shuffle' | 'move' | null
interface QS {
  workers: 2 | 3
  place: number[]          // shard group -> worker index
  active: number[]         // groups taking part
  traffic: Traffic
  labels?: Record<number, string>
  coord: string
  result?: string
  error?: boolean
  moving?: number
}

const ROWS = [1000, 1300, 700, 1000]
const SUMS = [42900, 55250, 29750, 42300]
const COMPANIES = [10, 13, 7, 10]
const P2 = [0, 1, 0, 1]
const P3 = [0, 1, 0, 2]
const ALL = [0, 1, 2, 3]

const SCRIPTS: Record<Mode, { sql: string; explain: string; steps: Step<QS>[] }> = {
  router: {
    sql: 'SELECT * FROM ads WHERE company_id = 7;',
    explain: `Custom Scan (Citus Adaptive)
  Task Count: 1
  Tasks Shown: All
  ->  Task
        Node: host=worker2 port=5432 dbname=app
        ->  Bitmap Heap Scan on ads_s3 ads
              Recheck Cond: (company_id = 7)
              ->  Bitmap Index Scan on ads_s3_pkey
                    Index Cond: (company_id = 7)`,
    steps: [
      { title: 'The query pins the distribution column', body: 'The filter `company_id = 7` names one value of the **distribution column**. The coordinator hashes 7 and looks up the one shard whose range holds the token: shard group 3.',
        state: { workers: 2, place: P2, active: [3], traffic: null, coord: 'hash(7) → shard group 3 → worker 2' } },
      { title: 'Route the whole query to one worker', body: 'The **router** (fast path) planner rewrites the table name to the shard name and sends the full statement to worker 2. No other worker is contacted.',
        state: { workers: 2, place: P2, active: [3], traffic: 'out', coord: 'one task: ads → ads_s3' } },
      { title: 'The worker plans and runs it', body: 'Worker 2 is ordinary PostgreSQL. It plans the query against `ads_s3` with its own indexes and statistics: an index scan finds the **100** rows of company 7.',
        state: { workers: 2, place: P2, active: [3], traffic: 'back', labels: { 3: '100 rows' }, coord: 'stream rows back' } },
      { title: 'One round trip, full SQL', body: 'Rows pass straight through. Any SQL works on a single shard, including joins, CTEs and `FOR UPDATE`, and the transaction stays local to one node.',
        state: { workers: 2, place: P2, active: [3], traffic: null, labels: { 3: '100 rows' }, coord: 'Task Count: 1', result: '100 rows' } },
    ],
  },
  agg: {
    sql: 'SELECT avg(clicks) FROM ads;',
    explain: `Aggregate
  ->  Custom Scan (Citus Adaptive)
        Task Count: 4
        Tasks Shown: One of 4
        ->  Task
              Node: host=worker1 port=5432 dbname=app
              ->  Aggregate
                    ->  Seq Scan on ads_s0 ads`,
    steps: [
      { title: 'No key: every shard is needed', body: 'There is no filter on `company_id`, so all four shard groups hold candidate rows. The query becomes a **multi-shard** query with one **task** per shard.',
        state: { workers: 2, place: P2, active: ALL, traffic: null, coord: 'avg(clicks) over 4 shards' } },
      { title: 'Split the aggregate in two', body: 'An average cannot be averaged again. The coordinator asks each shard for `sum(clicks)` and `count(clicks)` instead, which can be combined exactly.',
        state: { workers: 2, place: P2, active: ALL, traffic: 'out', coord: 'worker part: sum(clicks), count(clicks)' } },
      { title: 'Four partial results come back', body: 'The tasks run **in parallel**, two per worker, each over its own shard. Each returns a single row, however many rows it scanned.',
        state: { workers: 2, place: P2, active: ALL, traffic: 'back', labels: Object.fromEntries(ALL.map((g) => [g, `${SUMS[g]} / ${ROWS[g]}`])), coord: 'merge partials' } },
      { title: 'The coordinator finishes the job', body: '(42900 + 55250 + 29750 + 42300) / (1000 + 1300 + 700 + 1000) = 170200 / 4000 = **42.55**, the same as a single-node `avg`.',
        state: { workers: 2, place: P2, active: ALL, traffic: null, labels: Object.fromEntries(ALL.map((g) => [g, `${SUMS[g]} / ${ROWS[g]}`])), coord: 'sum(sums) / sum(counts)', result: 'avg = 42.55' } },
    ],
  },
  coloc: {
    sql: `SELECT c.company_id, count(*)
FROM campaigns c JOIN ads a
  ON a.company_id = c.company_id AND a.campaign_id = c.id
GROUP BY c.company_id;`,
    explain: `Custom Scan (Citus Adaptive)
  Task Count: 4
  Tasks Shown: One of 4
  ->  Task
        Node: host=worker1 port=5432 dbname=app
        ->  HashAggregate
              Group Key: c.company_id
              ->  Hash Join
                    Hash Cond: ((a.company_id = c.company_id) AND (a.campaign_id = c.id))
                    ->  Seq Scan on ads_s0 a
                    ->  Hash
                          ->  Seq Scan on campaigns_s0 c`,
    steps: [
      { title: 'Join on the distribution column', body: 'Both tables are distributed by `company_id` and **colocated**: campaigns shard *n* and ads shard *n* cover the same hash range on the same worker.',
        state: { workers: 2, place: P2, active: ALL, traffic: null, coord: 'join key = distribution column' } },
      { title: 'Push the whole join down', body: 'Matching rows can only meet inside the same shard group, so the join and the `GROUP BY company_id` are sent down as one task per group.',
        state: { workers: 2, place: P2, active: ALL, traffic: 'out', coord: '4 tasks: join + group locally' } },
      { title: 'Each worker joins locally', body: 'No row crosses the network for the join. Each task returns one row per company in its shard: **10, 13, 7 and 10** rows.',
        state: { workers: 2, place: P2, active: ALL, traffic: 'back', labels: Object.fromEntries(ALL.map((g) => [g, `${COMPANIES[g]} groups`])), coord: 'concatenate' } },
      { title: 'Concatenate and done', body: 'Groups never span shards, so the coordinator only appends the results: **40** rows. This is why tenant-keyed schemas scale so well.',
        state: { workers: 2, place: P2, active: ALL, traffic: null, labels: Object.fromEntries(ALL.map((g) => [g, `${COMPANIES[g]} groups`])), coord: 'append', result: '40 rows' } },
    ],
  },
  repart: {
    sql: `SELECT count(*)
FROM campaigns c JOIN ads a ON a.campaign_id = c.id;`,
    explain: `Aggregate
  ->  Custom Scan (Citus Adaptive)
        Task Count: 4
        Tasks Shown: None, not supported for re-partition queries
        ->  MapMergeJob
              Map Task Count: 4
              Merge Task Count: 4
        ->  MapMergeJob
              Map Task Count: 4
              Merge Task Count: 4`,
    steps: [
      { title: 'The join ignores the shard key', body: 'The condition `a.campaign_id = c.id` does not include `company_id`. A campaign\'s ads could be in any shard, so a local join per shard would miss matches.',
        state: { workers: 2, place: P2, active: ALL, traffic: null, coord: 'join key ≠ distribution column', error: true } },
      { title: 'Refused by default', body: 'With `citus.enable_repartition_joins = off` (the default) Citus refuses the query and says it needs repartitioning. That is a feature: it stops an expensive plan from slipping into production.',
        state: { workers: 2, place: P2, active: [], traffic: null, coord: 'ERROR: join requires repartitioning', error: true } },
      { title: 'Repartition: re-hash and shuffle', body: 'With the setting on, neither side is split by its join column, so **both** tables are re-hashed by the join key (one `MapMergeJob` each) and each bucket is sent to the worker that will join it. Rows now cross the network in **all directions**.',
        state: { workers: 2, place: P2, active: ALL, traffic: 'shuffle', coord: 'map: re-hash by campaign_id', labels: Object.fromEntries(ALL.map((g) => [g, `${ROWS[g]} ads out`])) } },
      { title: 'Join the buckets, merge the counts', body: 'Each worker joins the buckets it received and the coordinator sums the counts: **4000** matches. Correct, but the shuffle costs far more than a colocated join.',
        state: { workers: 2, place: P2, active: ALL, traffic: 'back', coord: 'merge: sum(count)', result: 'count = 4000' } },
    ],
  },
  rebalance: {
    sql: `SELECT citus_add_node('worker3', 5432);
SELECT * FROM get_rebalance_table_shards_plan();
SELECT citus_rebalance_start();`,
    explain: ` table_name | shardid | shard_size | sourcename | sourceport | targetname | targetport
------------+---------+------------+------------+------------+------------+-----------
 companies  |  102011 |      16384 | worker2    |       5432 | worker3    |       5432
 campaigns  |  102043 |      57344 | worker2    |       5432 | worker3    |       5432
 ads        |  102075 |     229376 | worker2    |       5432 | worker3    |       5432`,
    steps: [
      { title: 'Add an empty worker', body: '`citus_add_node` registers worker 3. It holds **no shards** yet, so it does no work: new nodes are not filled automatically.',
        state: { workers: 3, place: P2, active: [], traffic: null, coord: 'worker 3 joined: 0 shards' } },
      { title: 'Plan the moves', body: '`get_rebalance_table_shards_plan()` shows what would move. Colocated shards move **together** as a group, so joins stay local after the move.',
        state: { workers: 3, place: P2, active: [3], traffic: null, coord: 'plan: move group 3 → worker 3', moving: 3 } },
      { title: 'Copy while writes continue', body: '`citus_rebalance_start()` runs in the background. By default it copies the shard and streams later changes with **logical replication**, so writes continue. A table without a primary key or replica identity makes the move fail unless you choose `block_writes` or `force_logical`.',
        state: { workers: 3, place: P2, active: [3], traffic: 'move', coord: 'copying ads_s3 + logical catch-up', moving: 3 } },
      { title: 'Switch the placement', body: 'A short lock, a final catch-up, then `pg_dist_placement` points at worker 3 and the old copy is dropped. Queries for companies in group 3 now route to worker 3.',
        state: { workers: 3, place: P3, active: [3], traffic: null, coord: 'placement updated: group 3 on worker 3', result: '2 / 1 / 1 groups' } },
    ],
  },
}

const wx = (workers: number) => (workers === 3 ? [105, 535, 320] : [150, 490])
const coordX = 320, coordY = 52

function gpos(s: QS, g: number) {
  const w = s.place[g]
  const k = s.place.slice(0, g).filter((x) => x === w).length
  return { x: wx(s.workers)[w], y: 196 + k * 46 }
}

function Scene({ s, i }: { s: QS; i: number }) {
  const shuffle: [number, number][] = s.traffic === 'shuffle' ? ALL.flatMap((a) => ALL.filter((b) => s.place[a] !== s.place[b]).map((b) => [a, b] as [number, number])) : []
  return (
    <svg viewBox="0 0 640 284" className="w-full min-w-[520px]" role="img" aria-label="Coordinator and workers executing a distributed query">
      <rect x={coordX - 150} y={coordY - 34} width={300} height={68} rx={10} fill={toneBg(s.error ? 'dead' : 'header', 14)} stroke={tone(s.error ? 'dead' : 'header')} />
      <text x={coordX} y={coordY - 12} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">coordinator</text>
      <motion.text key={s.coord} initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={coordX} y={coordY + 6} textAnchor="middle" fontSize={10.5} fill={s.error ? tone('dead') : 'var(--muted)'} fontFamily="var(--font-mono)">{s.coord}</motion.text>
      {s.result && <motion.text initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} x={coordX} y={coordY + 24} textAnchor="middle" fontSize={12} fontWeight={700} fill={tone('ok')} fontFamily="var(--font-mono)">{s.result}</motion.text>}
      {Array.from({ length: s.workers }, (_, w) => (
        <motion.g key={w} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.rect initial={false} animate={{ x: wx(s.workers)[w] - 88 }} y={152} width={176} height={124} rx={10} fill="var(--surface)" stroke="var(--border)" strokeDasharray={w === 2 ? '5 4' : undefined} />
          <motion.text initial={false} animate={{ x: wx(s.workers)[w] - 78 }} y={170} fontSize={11} fontWeight={700} fill="var(--text)">worker {w + 1}</motion.text>
          <motion.line initial={false} animate={{ x2: wx(s.workers)[w] }} x1={coordX} y1={coordY + 34} y2={152} stroke="var(--border)" strokeWidth={1.5} />
        </motion.g>
      ))}
      {ALL.map((g) => {
        const p = gpos(s, g)
        const on = s.active.includes(g)
        const t: Tone = s.moving === g ? 'new' : on ? 'tuple' : 'muted'
        return (
          <motion.g key={g} initial={false} animate={{ x: p.x - 78, y: p.y - 18 }} transition={{ type: 'spring', stiffness: 90, damping: 16 }}>
            <rect width={156} height={38} rx={6} fill={toneBg(t, on ? 18 : 6)} stroke={tone(t)} strokeWidth={on ? 1.6 : 1} />
            <text x={8} y={15} fontSize={10.5} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">group {g}</text>
            <text x={8} y={30} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">campaigns_s{g} · ads_s{g}</text>
            {s.labels?.[g] && <text x={148} y={15} textAnchor="end" fontSize={10} fontWeight={700} fill={tone('ok')} fontFamily="var(--font-mono)">{s.labels[g]}</text>}
          </motion.g>
        )
      })}
      {(s.traffic === 'out' || s.traffic === 'back') && s.active.map((g) => {
        const p = gpos(s, g)
        return s.traffic === 'out'
          ? <Packet key={`${i}-${g}`} x1={coordX} y1={coordY + 34} x2={p.x} y2={p.y - 18} delay={g * 0.08} t="new" />
          : <Packet key={`${i}-${g}`} x1={p.x} y1={p.y - 18} x2={coordX} y2={coordY + 34} delay={g * 0.08} t="ok" />
      })}
      {shuffle.map(([a, b], k) => {
        const p = gpos(s, a), q = gpos(s, b)
        return <Packet key={`${i}-sh-${k}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} delay={k * 0.12} t="dead" r={5} dur={0.8} />
      })}
      {s.traffic === 'move' && s.moving !== undefined && [0, 1, 2].map((k) => {
        const p = gpos(s, s.moving!)
        return <Packet key={`${i}-mv-${k}`} x1={p.x} y1={p.y} x2={320} y2={196} delay={k * 0.35} t="new" r={5} dur={0.9} />
      })}
    </svg>
  )
}

const MODES: [Mode, string][] = [['router', 'Router'], ['agg', 'Fan-out aggregate'], ['coloc', 'Colocated join'], ['repart', 'Repartition join'], ['rebalance', 'Rebalance']]

function QueryViz() {
  const [mode, setMode] = useState<Mode>('router')
  const sc = SCRIPTS[mode]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="overflow-x-auto scrollbar-thin"><Segmented label="query" value={mode} onChange={setMode} options={MODES} /></div>
      <Stepper key={mode} steps={sc.steps} interval={2800} render={(s, i) => (
        <div className="grid gap-3 [&>*]:min-w-0">
          <Legend items={[['header', 'coordinator'], ['tuple', 'shard group in use'], ['new', 'task / data moving'], ['ok', 'result'], ['dead', 'repartition shuffle']]} />
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin"><Scene s={s} i={i} /></div>
          <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
            <Panel title="Query"><Code>{sc.sql}</Code></Panel>
            <Panel title={mode === 'rebalance' ? 'get_rebalance_table_shards_plan()' : 'EXPLAIN on the coordinator'}><Code>{sc.explain}</Code></Panel>
          </div>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'distributed-queries',
  module: 'e3',
  order: 3,
  title: 'Distributed query execution',
  tldr: [
    'A sharded query is planned twice: the **coordinator** decides which shards it needs and splits the work into **tasks**, and each worker plans and runs its task as an ordinary PostgreSQL query.',
    'How the query uses the distribution column decides its cost, from one round trip to one worker up to a full shuffle of rows between all workers.',
  ],
  visualizer: {
    title: 'Five queries on four shard groups',
    caption: 'Pick a query type and step through it. Tasks fly out, partial results fly back with the real numbers of the playground data.',
    Component: QueryViz,
  },
  playground: {
    setup: ADS_SCHEMA,
    presets: [
      { label: 'Router: the key prunes to one shard', sql: `EXPLAIN (COSTS OFF) SELECT * FROM ads WHERE company_id = 7;
SELECT tableoid::regclass AS shard, count(*) FROM ads WHERE company_id = 7 GROUP BY 1;`,
        note: 'Partition pruning plays the role of the Citus router: only `ads_s3` is scanned, and company 7 has 100 ads there. This is a single-node model of the idea, not Citus.' },
      { label: 'Fan-out: no key, every shard', sql: `EXPLAIN (COSTS OFF) SELECT count(*) FROM ads WHERE clicks > 50;`,
        note: 'An `Append` over all four parts: the single-node shape of a multi-shard query with **Task Count: 4**.' },
      { label: 'Aggregates in two phases', sql: `SET enable_partitionwise_aggregate = on;
EXPLAIN (COSTS OFF) SELECT avg(clicks) FROM ads;

SELECT tableoid::regclass AS shard, sum(clicks) AS part_sum, count(clicks) AS part_count
FROM ads GROUP BY 1 ORDER BY 1;

SELECT sum(s) / sum(n) AS avg_from_partials, (SELECT avg(clicks) FROM ads) AS direct
FROM (SELECT sum(clicks) s, count(clicks) n FROM ads GROUP BY tableoid) p;`,
        note: '`Partial Aggregate` per part and one `Finalize Aggregate` on top: the same split Citus makes between workers and coordinator. Both averages are 42.55.' },
      { label: 'Colocated join, pushed down', sql: `SET enable_partitionwise_join = on;
EXPLAIN (COSTS OFF)
SELECT c.company_id, count(*)
FROM campaigns c JOIN ads a ON a.company_id = c.company_id AND a.campaign_id = c.id
GROUP BY c.company_id;`,
        note: 'Each `ads_sN` joins only `campaigns_sN`, and the grouping happens inside each pair. A colocated distributed join runs exactly like this, one pair per worker.' },
      { label: 'Join without the key', sql: `EXPLAIN (COSTS OFF)
SELECT count(*) FROM campaigns c JOIN ads a ON a.campaign_id = c.id;

EXPLAIN (COSTS OFF)
SELECT count(*) FROM ads a JOIN campaigns c ON c.id = a.campaign_id WHERE a.company_id = 7;`,
        note: 'Without `company_id` in the join, any part may match any part: one big join over two `Append`s. Even with a filter on `ads`, every `campaigns` part is scanned. In Citus the first query needs a repartition join.' },
      { label: 'Move a shard', sql: `BEGIN;
ALTER TABLE ads DETACH PARTITION ads_s3;
ALTER TABLE ads_s3 RENAME TO ads_s3_old;
CREATE TABLE ads_s3 (LIKE ads_s3_old INCLUDING ALL);
INSERT INTO ads_s3 SELECT * FROM ads_s3_old;
ALTER TABLE ads ATTACH PARTITION ads_s3 FOR VALUES WITH (MODULUS 4, REMAINDER 3);
DROP TABLE ads_s3_old;
COMMIT;

SELECT tableoid::regclass AS shard, count(*) FROM ads GROUP BY 1 ORDER BY 1;`,
        note: 'Copy, swap the new copy in, drop the old one, all in one transaction: the table never loses a row. A Citus shard move does the same across machines, with logical replication so that writes can continue.' },
      { label: 'Split a hot shard', sql: `ALTER TABLE ads DETACH PARTITION ads_s1;
CREATE TABLE ads_s1a PARTITION OF ads FOR VALUES WITH (MODULUS 8, REMAINDER 1);
CREATE TABLE ads_s1b PARTITION OF ads FOR VALUES WITH (MODULUS 8, REMAINDER 5);
INSERT INTO ads SELECT * FROM ads_s1;
DROP TABLE ads_s1;

SELECT tableoid::regclass AS shard, count(*), array_agg(DISTINCT company_id ORDER BY company_id) AS companies
FROM ads GROUP BY 1 ORDER BY 1;`,
        note: 'The largest part (1300 rows) becomes two parts of 900 and 400 by doubling the modulus for that slice. Splitting the hash range is how a sharded system relieves a hot shard.' },
    ],
  },
  production: {
    title: 'A dashboard query that touched every shard',
    context: 'A multi-tenant analytics product runs on Citus with 32 shards per table. One dashboard tile became slow for every customer at once.',
    problem: 'The tile joined `ads` to `campaigns` on `campaign_id` only and filtered by `company_id` on one side. Citus could not prove that both sides were on one shard, so with repartition joins enabled for reporting it re-shuffled rows between all workers on each request.',
    solution: 'Log multi-shard queries in staging to find such statements, then add the tenant key to every join and filter so the query becomes a router query.',
    sql: `-- staging: make every multi-shard query visible
SET citus.multi_task_query_log_level = 'error';

-- before: not on the key, needs a repartition join across all workers
EXPLAIN SELECT c.name, sum(a.clicks)
FROM ads a JOIN campaigns c ON c.id = a.campaign_id
WHERE a.company_id = 7 GROUP BY c.name;

-- after: one shard (Task Count: 1, Tasks Shown: All)
EXPLAIN SELECT c.name, sum(a.clicks)
FROM ads a JOIN campaigns c ON c.company_id = a.company_id AND c.id = a.campaign_id
WHERE a.company_id = 7 GROUP BY c.name;`,
    outcome: 'The tile now sends one task to one worker instead of shuffling rows between all of them, so its latency no longer grows with the number of shards, and the workers stop running work that returns nothing.',
  },
  pitfalls: [
    { title: 'Joins that need repartitioning',
      symptom: 'A query that worked on single-node PostgreSQL fails on Citus with an error that the join requires repartitioning.',
      cause: 'The join does not use the distribution column of colocated tables, and `citus.enable_repartition_joins` is off by default.',
      fix: 'Add the distribution column to the join, make the small side a reference table, or, for rare analytics only, enable repartition joins for that session.',
      sql: `SET citus.enable_repartition_joins = on;  -- per session, for an ad-hoc report` },
    { title: 'Connection storms on the workers',
      symptom: 'Workers hit `max_connections` during a burst of multi-shard queries.',
      cause: 'The adaptive executor opens up to `citus.max_adaptive_executor_pool_size` (default 16) connections per worker per session to run tasks in parallel.',
      fix: 'Pool clients in front of the coordinator, keep `citus.max_shared_pool_size` below the workers\' `max_connections`, and lower the per-session pool size for many small queries.',
      sql: `ALTER SYSTEM SET citus.max_adaptive_executor_pool_size = 4;
SELECT pg_reload_conf();` },
    { title: 'A CTE that pulls everything to the coordinator',
      symptom: 'A query fails with an error about the maximum intermediate result size, or uses gigabytes of temp space on the coordinator.',
      cause: 'A subquery or CTE that cannot be pushed down is run first and its result is sent to the workers (push-pull). Results are capped by `citus.max_intermediate_result_size` (default 1 GB).',
      fix: 'Filter and aggregate inside the CTE so that it returns a few rows, or rewrite it so that it joins on the distribution column and can be pushed down.' },
    { title: 'Rebalancing a table without a replica identity',
      symptom: 'A rebalance stops with `cannot use logical replication to transfer shards of the relation … since it doesn\'t have a REPLICA IDENTITY or PRIMARY KEY`, or writes to that table block or fail during the move.',
      cause: 'Online moves stream changes with logical replication, which needs a primary key or replica identity. With the default `auto` mode such a table makes the move fail with an error; `block_writes` copies it while blocking writes, and `force_logical` makes concurrent updates and deletes fail.',
      fix: 'Give every distributed table a primary key before rebalancing. Preview with `get_rebalance_table_shards_plan()` and watch `citus_rebalance_status()`.',
      sql: `SELECT * FROM get_rebalance_table_shards_plan();
SELECT citus_rebalance_start();
SELECT * FROM citus_rebalance_status();` },
  ],
  pointers: [
    '**Router** query: the filter pins the distribution column, so one task goes to one worker and any SQL works, much like [partition pruning](/m7/partitioning) on one node.',
    '**Multi-shard** query: one task per shard in parallel, merged on the coordinator. Aggregates split into worker parts and a final step (avg → sum + count).',
    'Joins on the distribution column of **colocated** tables push down; other joins need a **repartition** shuffle, which is off by default.',
    'EXPLAIN shows `Custom Scan (Citus Adaptive)` with `Task Count` and one sample task plan from a worker.',
    'Rebalancing moves whole colocated shard groups, online through logical replication when tables have a replica identity. The general theory: [distributed query processing](/e5/distributed-query-processing).',
  ],
  sources: ['ddl-partitioning.html', 'runtime-config-query.html', 'sql-altertable.html', 'using-explain.html'],
}
