import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Bar, Btn, PlanText, Tiles } from './_kit'
import { QUIZ_DATA } from './_idxquiz'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: an index-design quiz. Each question is a real query on the playground table; each
 * answer is a candidate index. Picking one reveals the actual plan, buffers and index size that
 * PostgreSQL 18.6 produced for that index alone (captured from PGlite), compared with the others.
 * ---------------------------------------------------------------------------------------------- */

type Key = 'a' | 'b' | 'c'
interface Q { id: keyof typeof QUIZ_DATA; topic: string; sql: string; best: Key; why: Record<Key, string> }

const QS: Q[] = [
  { id: 'order', topic: 'Column order', best: 'b',
    sql: `SELECT id FROM events WHERE user_id = 42 AND created_at >= '2026-02-01';`,
    why: {
      a: 'The **range** column comes first, so the scan starts at February and walks every later entry, checking `user_id` on each: 49 buffers.',
      b: '**Equality first, range last.** All entries for user 42 are adjacent and already sorted by time, so the scan reads exactly the matching slice: 5 buffers.',
      c: 'Finds user 42\'s 20 rows, but then visits all 20 heap rows to test the date, and throws 18 away (`Rows Removed by Filter`).',
    } },
  { id: 'skip', topic: 'Skip scan (PostgreSQL 18)', best: 'b',
    sql: `SELECT id FROM events WHERE user_id = 42;  -- no condition on tenant_id`,
    why: {
      a: 'New in 18: a **skip scan** treats the missing leading column as "every tenant_id" and descends once per value: `Index Searches: 21`. It works because `tenant_id` has only 20 distinct values, but costs 65 buffers.',
      b: 'Leading column matches the filter: one descent, 22 buffers. The best choice if this query is frequent.',
      c: 'An index on `tenant_id` cannot answer a filter on `user_id` at all, so the planner falls back to a sequential scan of all 1031 pages.',
    } },
  { id: 'partial', topic: 'Partial index', best: 'b',
    sql: `SELECT id FROM events WHERE status = 'pending' ORDER BY created_at LIMIT 10;`,
    why: {
      a: 'Finds all 500 pending rows, fetches every one, then sorts them to keep 10: 503 buffers.',
      b: 'Holds **only the 500 pending rows**, already in `created_at` order: read the first 10 entries and stop. 12 buffers, and the index is **32 kB** instead of 2.2 MB.',
      c: 'Walks the full time-ordered index and discards 1990 non-pending rows before finding 10: workable but 2.2 MB and slower as the ratio worsens.',
    } },
  { id: 'expr', topic: 'Expression index', best: 'b',
    sql: `SELECT id FROM events WHERE lower(email) = 'user42@example.com';`,
    why: {
      a: 'An index on `email` stores the original values. `lower(email)` is a different expression, so it cannot be used: sequential scan.',
      b: 'The index stores `lower(email)`, which matches the WHERE clause exactly: 22 buffers. Run ANALYZE afterwards so the expression gets statistics.',
      c: '`text_pattern_ops` helps `LIKE \'abc%\'` in non-C locales, not a function of the column. Still a sequential scan.',
    } },
  { id: 'cover', topic: 'Covering index (INCLUDE)', best: 'b',
    sql: `SELECT sum(amount) FROM events WHERE user_id BETWEEN 100 AND 300;`,
    why: {
      a: '4020 matching rows are spread over 988 heap pages, and each one must be read to get `amount`: 994 buffers.',
      b: '`amount` is stored in the leaf entries, so an **Index Only Scan** answers from the index alone (`Heap Fetches: 0` after VACUUM): 15 buffers. Note the size: INCLUDE indexes are **never deduplicated**.',
      c: 'Also index-only, but `user_id` is the second column, so the range cannot narrow the scan: it reads the whole index, 97 buffers.',
    } },
]

function QuizViz() {
  const [qi, setQi] = useState(0)
  const [pick, setPick] = useState<Key | null>(null)
  const [score, setScore] = useState<Record<number, boolean>>({})
  const q = QS[qi], d = QUIZ_DATA[q.id]
  const choose = (k: Key) => { setPick(k); setScore((s) => (qi in s ? s : { ...s, [qi]: k === q.best })) }
  const go = (n: number) => { setQi(n); setPick(null) }
  const maxBuf = Math.max(d.none.buffers, d.a.buffers, d.b.buffers, d.c.buffers)
  const toneFor = (k: Key): Tone => (k === q.best ? 'ok' : 'dead')
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {QS.map((x, i) => (
          <button key={x.id} type="button" onClick={() => go(i)} className="rounded-md border px-2 py-1 text-xs"
            style={{ borderColor: i === qi ? tone('accent') : 'var(--border)', background: i in score ? toneBg(score[i] ? 'ok' : 'dead', 16) : 'transparent' }}>
            {i + 1}. {x.topic}
          </button>
        ))}
        <Btn primary testid="viz-next" onClick={() => (pick ? go((qi + 1) % QS.length) : choose(q.best))}>{pick ? 'Next question' : 'Reveal answer'}</Btn>
      </div>
      <Tiles items={[['Question', `${qi + 1} / ${QS.length}`], ['Score', `${Object.values(score).filter(Boolean).length} / ${Object.keys(score).length}`, 'ok'], ['Seq scan buffers', d.none.buffers], ['Table', '100k rows']]} />
      <Panel title={`${q.topic}: which single index serves this query best?`}>
        <pre className="mb-2 overflow-x-auto rounded-md border border-line bg-code p-2 font-mono text-[12px]">{q.sql}</pre>
        <div className="grid gap-2 sm:grid-cols-3">
          {(['a', 'b', 'c'] as Key[]).map((k) => {
            const c = d[k], chosen = pick === k, show = pick !== null
            const t: Tone = show ? toneFor(k) : 'header'
            return (
              <motion.button key={k} type="button" onClick={() => choose(k)} whileHover={{ y: -2 }} animate={{ scale: chosen ? 1.02 : 1 }}
                className="rounded-lg border p-2 text-left" style={{ borderColor: show && (chosen || k === q.best) ? tone(t) : 'var(--border)', background: show && (chosen || k === q.best) ? toneBg(t, 14) : 'var(--surface)' }}>
                <p className="font-mono text-[12px] font-semibold">CREATE INDEX ON events {c.def}</p>
                {show && <p className="mt-1 font-mono text-[11px] text-muted">{c.buffers} buffers · {(c.size / 1024).toFixed(0)} kB</p>}
              </motion.button>
            )
          })}
        </div>
      </Panel>
      <AnimatePresence mode="wait">
        {pick && (
          <motion.div key={`${qi}-${pick}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
            <div className="rounded-lg border px-4 py-2.5 text-sm" style={{ borderColor: tone(toneFor(pick)), background: toneBg(toneFor(pick), 10) }}>
              <p className="font-semibold" style={{ color: tone(toneFor(pick)) }}>{pick === q.best ? 'Best choice.' : 'Not the best.'}</p>
              <p className="mt-0.5"><Md>{q.why[pick]}</Md></p>
              {pick !== q.best && <p className="mt-1 text-muted"><Md>{`Best: \`${d[q.best].def}\`. ${q.why[q.best]}`}</Md></p>}
            </div>
            <Legend items={[['ok', 'best index'], ['dead', 'other candidates'], ['muted', 'no index (seq scan)']]} />
            <Panel title="Shared buffers touched by the query (lower is better)">
              <div className="grid gap-1.5">
                {(['a', 'b', 'c'] as Key[]).map((k) => <Bar key={k} label={d[k].def} value={d[k].buffers} max={maxBuf} t={toneFor(k)} win={k === q.best} note={`${d[k].buffers}`} />)}
                <Bar label="no index" value={d.none.buffers} max={maxBuf} t="muted" note={`${d.none.buffers}`} />
              </div>
            </Panel>
            <Panel title={`EXPLAIN (ANALYZE, BUFFERS) with ${d[pick].def}`}><PlanText text={d[pick].plan} /></Panel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE events (
  id int PRIMARY KEY, tenant_id int NOT NULL, user_id int NOT NULL, status text NOT NULL,
  email text NOT NULL, amount int NOT NULL, created_at timestamptz NOT NULL);
INSERT INTO events
SELECT g, g % 20, (g * 7919) % 5000,
       CASE WHEN g % 200 = 0 THEN 'pending' ELSE 'done' END,
       'User' || ((g * 7919) % 5000) || '@Example.com', g % 1000,
       timestamptz '2026-01-01' + g * interval '30 seconds'
FROM generate_series(1, 100000) g;
VACUUM ANALYZE events;`

export const lesson: Lesson = {
  slug: 'index-design',
  module: 'm4',
  order: 9,
  title: 'Designing indexes: multicolumn, partial, expression, covering',
  tldr: [
    'A good index matches how one important query filters and sorts: **equality columns first and the range column last**, a **predicate** for the rows you actually query, the **same expression** the WHERE clause uses, and **INCLUDE** columns so the heap is never read.',
    'Each extra index slows every write and can block HOT updates, so the goal is the smallest set of indexes that turns your hot queries into short, ordered index reads.',
  ],
  visualizer: {
    title: 'Pick the index: five real queries',
    caption: 'For each query, choose one of three candidate indexes. The answer shows the real plan, buffers and index size PostgreSQL 18 produced for that index alone.',
    Component: QuizViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'Equality first, range last', sql: `CREATE INDEX ev_user_time ON events (user_id, created_at);
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM events WHERE user_id = 42 AND created_at >= '2026-02-01';
DROP INDEX ev_user_time;`,
        note: 'Both conditions appear in `Index Cond`, and the scan reads only user 42\'s February entries: about 5 buffers.' },
      { label: 'Skip scan (18)', sql: `CREATE TABLE sales (id serial PRIMARY KEY, region text, category text, sale_date date, amount numeric(10,2));
INSERT INTO sales (region, category, sale_date, amount)
SELECT (ARRAY['North','South','West'])[1 + i % 3],
       (ARRAY['Electronics','Clothing','Books','Home'])[1 + (i / 3) % 4],
       DATE '2025-01-01' + (i * 7) % 365, 100 + (i * 13) % 900
FROM generate_series(1, 100000) i;
CREATE INDEX sales_rcd ON sales (region, category, sale_date);
ANALYZE sales;

-- 1. no condition on the leading column "region"
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM sales WHERE category = 'Electronics' AND sale_date = '2025-06-01';

-- 2. the same query with the three regions spelled out
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM sales WHERE region IN ('North','South','West')
  AND category = 'Electronics' AND sale_date = '2025-06-01';

-- 3. an index that leads with the filtered columns
CREATE INDEX sales_cd ON sales (category, sale_date);
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM sales WHERE category = 'Electronics' AND sale_date = '2025-06-01';
DROP TABLE sales;`,
        note: 'Run 1 uses `(region, category, sale_date)` without any condition on `region`. That is a **skip scan**, new in PostgreSQL 18, and it shows `Index Searches: 7`. Run 2 names the three regions and needs only 3 searches. Run 3, with an index that leads with the filtered columns, needs 1. Skip scan rescues an index whose leading column has few distinct values. It does not replace the right column order.' },
      { label: 'Partial index', sql: `CREATE INDEX ev_pending ON events (created_at) WHERE status = 'pending';
SELECT pg_size_pretty(pg_relation_size('ev_pending')) AS size;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM events WHERE status = 'pending' ORDER BY created_at LIMIT 10;
EXPLAIN SELECT id FROM events WHERE status = 'done' ORDER BY created_at LIMIT 10;`,
        note: '32 kB, ordered, and only pending rows. The planner uses it only when the query\'s WHERE **implies** the predicate: the `status = \'done\'` query cannot use it.' },
      { label: 'Expression index', sql: `EXPLAIN SELECT id FROM events WHERE lower(email) = 'user42@example.com';
CREATE INDEX ev_email_lower ON events (lower(email));
ANALYZE events;
EXPLAIN SELECT id FROM events WHERE lower(email) = 'user42@example.com';`,
        note: 'Before: Seq Scan with a `lower()` Filter. After creating the index and running ANALYZE (which collects statistics for the expression), the row estimate is right and the index is used.' },
      { label: 'A cast hides the index', sql: `CREATE INDEX ev_user ON events (user_id);
EXPLAIN SELECT * FROM events WHERE user_id = 42;
EXPLAIN SELECT * FROM events WHERE user_id = 42::bigint;
EXPLAIN SELECT * FROM events WHERE user_id = 42.0;
EXPLAIN SELECT * FROM events WHERE user_id::text = '42';
DROP INDEX ev_user;`,
        note: '`int = bigint` still uses the index, because both types belong to the same B-tree operator family. `42.0` is `numeric`, so PostgreSQL casts the **column**: `Filter: ((user_id)::numeric = 42.0)` and a Seq Scan costing 2531 instead of 76. Casting the column to text does the same thing. Match the literal to the column type.' },
      { label: 'INCLUDE and heap fetches', sql: `CREATE INDEX ev_user_amount ON events (user_id) INCLUDE (amount);
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT sum(amount) FROM events WHERE user_id BETWEEN 100 AND 300;
UPDATE events SET amount = amount + 1 WHERE id % 50 = 0;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT sum(amount) FROM events WHERE user_id BETWEEN 100 AND 300;
VACUUM events;`,
        note: 'First run: `Heap Fetches: 0`, 15 buffers. The UPDATE clears the all-visible bits of the pages it touched, so the second run visits the heap: **4120 heap fetches**, more than the 4020 rows, because the non-HOT update left old index entries pointing at dead versions. VACUUM fixes both.' },
      { label: 'NULLS NOT DISTINCT', sql: `CREATE TABLE invites (team int, email text);
CREATE UNIQUE INDEX invites_default ON invites (team, email);
INSERT INTO invites VALUES (1, NULL), (1, NULL);
SELECT count(*) AS rows_with_null_email FROM invites;
DELETE FROM invites;
CREATE UNIQUE INDEX invites_strict ON invites (team, email) NULLS NOT DISTINCT;
INSERT INTO invites VALUES (1, NULL);`,
        note: 'By default NULLs are distinct, so two `(1, NULL)` rows are allowed. With `NULLS NOT DISTINCT` a second `(1, NULL)` would violate the index. Try inserting it again.' },
      { label: 'Unused indexes', sql: `SELECT pg_stat_force_next_flush();
SELECT relname AS table, indexrelname AS index, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes ORDER BY idx_scan, pg_relation_size(indexrelid) DESC;

SELECT relname, seq_scan, idx_scan, n_live_tup,
       round(100.0 * idx_scan / NULLIF(seq_scan + coalesce(idx_scan, 0), 0), 1) AS pct_index_scans
FROM pg_stat_user_tables ORDER BY n_live_tup DESC;`,
        note: 'Statistics are flushed lazily; the first call forces it. `idx_scan = 0` over a long period means the index costs write time and space without serving reads. Check replicas too before dropping it. The second query is the usual "index usage %" check. It needs `NULLIF` against division by zero, and `coalesce` because `idx_scan` is NULL for a table with no indexes. Only trust it on large tables: seq scans on tiny tables are correct.' },
    ],
  },
  production: {
    title: 'A job queue that slowed down as it grew',
    context: 'A background-job table kept every job ever run: about 40 million rows, of which a few thousand are `queued` at any moment. Workers poll with `WHERE state = \'queued\' ORDER BY run_at LIMIT 10 FOR UPDATE SKIP LOCKED`.',
    problem: 'The only index was on `state`. Each poll found all queued rows, fetched them from the heap and sorted them to keep ten. A full index on `run_at` alone would have walked millions of finished jobs before finding queued ones.',
    solution: 'Index exactly the rows the workers want, in the order they want them. A partial index on `run_at WHERE state = \'queued\'` stays tiny because finished jobs leave it, and it returns the next ten jobs without a sort. Build it without blocking writes, and drop the old index once the new one is used.',
    sql: `CREATE INDEX CONCURRENTLY jobs_queued_run_at ON jobs (run_at) WHERE state = 'queued';
-- if the build fails it leaves an INVALID index: drop it and retry
SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
DROP INDEX CONCURRENTLY jobs_state_idx;`,
    outcome: 'In the playground\'s smaller version (500 pending of 100000 rows) the same change cuts the poll from 503 buffers with a sort to 12 buffers without one, using a 32 kB index instead of 700 kB.',
  },
  pitfalls: [
    { title: 'Range column first in a composite index',
      symptom: 'A two-column index is used, but the query still reads many index pages and gets slower as data accumulates.',
      cause: 'Only equality on leading columns plus a range on the **first** non-equality column limits the scanned part of a B-tree. Columns after the range are filtered entry by entry.',
      fix: 'Order key columns as: equality columns, then at most one range or ORDER BY column. Verify with buffers in `EXPLAIN (ANALYZE, BUFFERS)`.' },
    { title: 'Partial index never chosen with parameters',
      symptom: 'A partial index `WHERE status = \'pending\'` works in psql but not from the application.',
      cause: 'Predicate matching happens at **plan time**. With a generic prepared plan, `status = $1` cannot be proven to imply the predicate.',
      fix: 'Write the predicate as a literal in the query (`WHERE status = \'pending\'`), or use custom plans (`plan_cache_mode = force_custom_plan`).' },
    { title: 'CREATE INDEX on a busy table',
      symptom: 'Writes stall for minutes while an index builds. Or a `CREATE INDEX CONCURRENTLY` fails halfway and leaves an index marked INVALID that slows writes but is never used.',
      cause: 'Plain CREATE INDEX takes a SHARE lock that blocks INSERT, UPDATE and DELETE. CONCURRENTLY avoids that with two table scans, but any error leaves the half-built index behind. A common claim has this backwards: a failed **plain** CREATE INDEX rolls back completely, and only the CONCURRENTLY forms leave an INVALID index. CONCURRENTLY is also not lock-free: it holds SHARE UPDATE EXCLUSIVE, which blocks other DDL and VACUUM on the table.',
      fix: 'Use `CREATE INDEX CONCURRENTLY` outside a transaction block. On failure, `DROP INDEX CONCURRENTLY` the invalid index or `REINDEX INDEX CONCURRENTLY` it.',
      sql: `SELECT indexrelid::regclass, indisvalid FROM pg_index WHERE NOT indisvalid;` },
    { title: 'Indexes that block HOT updates',
      symptom: 'After adding an index on a frequently updated column, update throughput drops and every index bloats.',
      cause: 'An UPDATE can be **HOT** (no index changes) only if no indexed column changes. Indexing a hot column, even as an INCLUDE column, turns every update into new entries in every index.',
      fix: 'Avoid indexing columns that change constantly (counters, `updated_at`) unless a key query needs them. Watch `n_tup_hot_upd` in `pg_stat_user_tables`.' },
    { title: 'Assuming foreign keys are indexed',
      symptom: 'Deleting one parent row, or joining child to parent, is slow. EXPLAIN ANALYZE of the DELETE shows the time inside `Trigger for constraint …_fkey`.',
      cause: 'A common claim is that PostgreSQL indexes foreign keys automatically. It does not. Only PRIMARY KEY, UNIQUE and EXCLUDE constraints create indexes. Without an index on the **referencing** column, every parent DELETE or key UPDATE scans the child table.',
      fix: 'Index the referencing columns of every foreign key that sees parent deletes or joins. This catalog query lists foreign keys whose first column leads no index.',
      sql: `SELECT c.conrelid::regclass AS child_table, c.conname, a.attname
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
WHERE c.contype = 'f'
  AND NOT EXISTS (SELECT 1 FROM pg_index i
                  WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1]);` },
    { title: 'Expression index on a cast that is not immutable',
      symptom: '`ERROR: functions in index expression must be marked IMMUTABLE` when indexing `((doc->>\'ts\')::timestamptz)` or `lower(col)` through a custom function.',
      cause: 'An index expression must give the same result forever. Text-to-`timestamptz` and text-to-`date` casts depend on the `DateStyle` and `TimeZone` settings, so they are only STABLE.',
      fix: 'Store the value in a real `timestamptz` column written by the application or a trigger (a generated column has the same immutability rule), or store an immutable form such as epoch seconds and index `((doc->>\'ts\')::float8)`. Then write the query with exactly the same expression.' },
  ],
  pointers: [
    'B-tree rule: **equality on leading columns + one range** on the next column bound the scan. PostgreSQL 18 **skip scan** helps when a leading column has few distinct values.',
    '**Partial** indexes need the query to imply the predicate at plan time. Great for queues, soft deletes and rare states.',
    '**Expression** indexes match only the identical expression. Run ANALYZE after creating one.',
    '**INCLUDE** columns enable index-only scans (needs all-visible pages, i.e. VACUUM). INCLUDE indexes are never deduplicated.',
    'Unique indexes treat NULLs as distinct unless `NULLS NOT DISTINCT`. Build with `CREATE INDEX CONCURRENTLY` and check for INVALID leftovers.',
  ],
  sources: ['indexes-multicolumn.html', 'indexes-partial.html', 'indexes-expressional.html', 'indexes-index-only-scans.html', 'indexes-unique.html', 'sql-createindex.html', 'monitoring-stats.html'],
}
