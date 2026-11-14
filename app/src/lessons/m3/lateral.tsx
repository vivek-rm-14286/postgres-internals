import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { ResultTable, Sql, type ResultRow } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: LATERAL as a for-each loop. For every outer row (accounts) the subquery is re-run with
 * a.id bound to that row's value, and its rows are joined to it. CROSS JOIN LATERAL drops an outer row
 * whose subquery returns nothing; LEFT JOIN LATERAL … ON true keeps it, NULL-extended. The error text,
 * the 5/6 row counts and the loops=4 plan were captured on PostgreSQL 18 (PGlite).
 * ---------------------------------------------------------------------------------------------- */

const ACCOUNTS = [{ id: 1, name: 'Acme' }, { id: 2, name: 'Globex' }, { id: 3, name: 'Initech' }, { id: 4, name: 'Umbrella' }]
const PURCHASES = [
  { id: 1, account_id: 1, item: 'laptop', total: 1200, created_at: '2026-10-02' }, { id: 2, account_id: 1, item: 'mouse', total: 25, created_at: '2026-10-20' },
  { id: 3, account_id: 1, item: 'monitor', total: 310, created_at: '2026-11-03' }, { id: 4, account_id: 2, item: 'desk', total: 540, created_at: '2026-09-14' },
  { id: 5, account_id: 2, item: 'chair', total: 220, created_at: '2026-11-01' }, { id: 6, account_id: 3, item: 'cables', total: 18, created_at: '2026-08-30' },
]
type Join = 'cross' | 'left' | 'none'
interface LState { cur: number | null; out: ResultRow[]; err?: boolean }

const sqlFor = (j: Join, n: number) => `SELECT a.name, p.item, p.created_at
FROM accounts a
${j === 'left' ? 'LEFT JOIN LATERAL' : j === 'cross' ? 'CROSS JOIN LATERAL' : 'JOIN'} (
  SELECT item, created_at FROM purchases
  WHERE account_id = a.id  -- outer ref
  ORDER BY created_at DESC LIMIT ${n}
) p${j === 'cross' ? '' : ' ON true'};`

function buildSteps(j: Join, n: number): Step<LState>[] {
  if (j === 'none') return [
    { title: 'Without LATERAL the subquery cannot see a', body: 'A plain subquery in FROM is planned **independently** of the other FROM items, so `a.id` is not in scope. PostgreSQL refuses the query before running anything.', state: { cur: null, out: [], err: true } },
    { title: 'One keyword fixes it', body: 'Write `JOIN LATERAL` (or `CROSS JOIN LATERAL`). Now the subquery may reference columns of FROM items **to its left**, and it is evaluated once per outer row. Switch the mode above to watch it run.', state: { cur: null, out: [], err: true } },
  ]
  const out: ResultRow[] = []
  const steps: Step<LState>[] = [{ title: 'An outer loop and an inner query', body: `For each **account** (the outer rows), run the subquery with \`a.id\` set to that row's id, then join its rows to the account. Here: the **${n} most recent** purchase${n > 1 ? 's' : ''} per account.`, state: { cur: null, out: [] } }]
  ACCOUNTS.forEach((a, i) => {
    const sub = PURCHASES.filter((p) => p.account_id === a.id).sort((x, y) => y.created_at.localeCompare(x.created_at)).slice(0, n)
    sub.forEach((p) => out.push({ key: `${a.id}-${p.id}`, cells: [a.name, p.item, p.created_at], t: 'tuple' }))
    let body = `Bind \`a.id = ${a.id}\`. The subquery finds ${PURCHASES.filter((p) => p.account_id === a.id).length} purchase${PURCHASES.filter((p) => p.account_id === a.id).length === 1 ? '' : 's'}, sorts them newest first and keeps ${sub.length}: ${sub.map((p) => p.item).join(', ')}.`
    if (!sub.length) {
      if (j === 'left') { out.push({ key: `${a.id}-N`, cells: [a.name, null, null], t: 'new' }); body = `Bind \`a.id = ${a.id}\`. The subquery returns **no rows**. \`LEFT JOIN LATERAL … ON true\` keeps ${a.name} anyway, NULL-extended.` }
      else body = `Bind \`a.id = ${a.id}\`. The subquery returns **no rows**, so \`CROSS JOIN LATERAL\` emits nothing for ${a.name}: it **disappears** from the result.`
    }
    steps.push({ title: `Outer row ${i + 1}: ${a.name}`, body, state: { cur: i, out: [...out] } })
  })
  steps.push({ title: `Result: ${out.length} rows`, body: `The subquery ran **4 times**, once per account: in EXPLAIN its nodes show \`loops=4\`. ${j === 'cross' ? 'Switch to LEFT JOIN LATERAL to keep Umbrella.' : 'Switch to CROSS JOIN LATERAL and Umbrella is gone.'}`, state: { cur: null, out: [...out] } })
  return steps
}

function LateralViz() {
  const [j, setJ] = useState<Join>('cross')
  const [n, setN] = useState(2)
  const steps = useMemo(() => buildSteps(j, n), [j, n])
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Join form" value={j} onChange={setJ} options={[['none', 'plain JOIN (no LATERAL)'], ['cross', 'CROSS JOIN LATERAL'], ['left', 'LEFT JOIN LATERAL … ON true']]} />
        <Segmented label="LIMIT" value={String(n) as '1' | '2' | '3'} onChange={(v) => setN(+v)} options={[['1', 'LIMIT 1'], ['2', 'LIMIT 2'], ['3', 'LIMIT 3']]} />
      </div>
      <Stepper key={`${j}-${n}`} steps={steps} interval={2600} render={(s) => {
        const a = s.cur === null ? null : ACCOUNTS[s.cur]
        const mine = a ? PURCHASES.filter((p) => p.account_id === a.id).sort((x, y) => y.created_at.localeCompare(x.created_at)) : []
        const kept = new Set(mine.slice(0, n).map((p) => p.id))
        const rank = new Map(mine.map((p, k) => [p.id, k + 1]))
        return (
          <div className="grid gap-3">
            <Legend items={[['accent', 'current outer row / a.id'], ['ok', 'returned by the subquery'], ['header', 'matches a.id, cut by LIMIT'], ['new', 'NULL-extended (LEFT)']]} />
            <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
              <Panel title="accounts a (outer)">
                <div className="grid gap-1.5">
                  {ACCOUNTS.map((ac, i) => (
                    <motion.div key={ac.id} animate={{ x: s.cur === i ? 6 : 0 }} className="rounded-md border px-2.5 py-1.5 font-mono text-[12px]"
                      style={{ borderColor: s.cur === i ? tone('accent') : 'var(--border)', background: s.cur === i ? toneBg('accent', 20) : 'transparent', borderWidth: s.cur === i ? 2 : 1 }}>
                      a.id = {ac.id} · {ac.name}
                    </motion.div>
                  ))}
                </div>
              </Panel>
              <Panel title={a ? `subquery run #${(s.cur ?? 0) + 1}: WHERE account_id = ${a.id}` : 'purchases (scanned by the subquery)'}>
                <div className="grid gap-1">
                  {PURCHASES.map((p) => {
                    const match = a && p.account_id === a.id
                    const ok = match && kept.has(p.id)
                    const t = ok ? 'ok' : match ? 'header' : 'muted'
                    return (
                      <motion.div key={p.id} layout animate={{ opacity: a && !match ? 0.35 : 1 }}
                        className="grid grid-cols-[2.2rem_1fr_4rem_6rem_3.5rem] items-center gap-2 rounded px-2 py-1 font-mono text-[12px]"
                        style={{ background: match ? toneBg(t, 16) : 'transparent', boxShadow: match ? `inset 3px 0 0 ${tone(t)}` : 'inset 0 0 0 transparent' }}>
                        <span className="text-muted">#{p.id}</span><span>{p.item}</span><span className="text-muted">acct {p.account_id}</span><span>{p.created_at}</span>
                        <span className="text-right text-[11px]" style={{ color: tone.text(t) }}>{match ? (ok ? `keep ${rank.get(p.id)}` : 'cut') : ''}</span>
                      </motion.div>
                    )
                  })}
                </div>
                {a && mine.length === 0 && <p className="mt-2 text-xs" style={{ color: 'var(--t-new)' }}>No purchase has account_id = {a.id}: the subquery returns 0 rows.</p>}
              </Panel>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
              {s.err ? (
                <div className="rounded-lg border px-3 py-2 font-mono text-[12px]" style={{ borderColor: tone('dead'), background: toneBg('dead', 10) }}>
                  <p>ERROR: invalid reference to FROM-clause entry for table "a"</p>
                  <p className="mt-1 text-muted">HINT: To reference that table, you must mark this subquery with LATERAL.</p>
                </div>
              ) : <ResultTable caption="output" fields={['name', 'item', 'created_at']} rows={s.out} />}
              <Sql>{sqlFor(j, n)}</Sql>
            </div>
          </div>
        )
      }} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'lateral',
  module: 'm3',
  order: 7,
  title: 'LATERAL joins',
  tldr: [
    'A `LATERAL` subquery in FROM may reference columns of the FROM items to its left, so it is evaluated **once per outer row**, like the body of a for-each loop.',
    'It exists for questions a plain join cannot express, such as "the latest N rows for each parent" or "expand this row\'s array", and with the right index it is often the fastest top-N-per-group plan.',
  ],
  visualizer: {
    title: 'LATERAL as a for-each loop',
    caption: 'Step through the outer rows and watch the subquery re-run with each `a.id`. Compare **CROSS JOIN LATERAL** (5 rows) with **LEFT JOIN LATERAL … ON true** (6 rows), and try the plain JOIN to see the error.',
    Component: LateralViz,
  },
  playground: {
    setup: `
CREATE TABLE accounts (id int PRIMARY KEY, name text NOT NULL, tags text[] NOT NULL DEFAULT '{}');
CREATE TABLE purchases (
  id int PRIMARY KEY, account_id int NOT NULL REFERENCES accounts,
  item text NOT NULL, total numeric(8,2) NOT NULL, created_at date NOT NULL);
INSERT INTO accounts VALUES
  (1, 'Acme', '{b2b,priority}'), (2, 'Globex', '{b2b}'), (3, 'Initech', '{}'), (4, 'Umbrella', '{trial,eu}');
INSERT INTO purchases VALUES
  (1, 1, 'laptop', 1200, '2026-10-02'), (2, 1, 'mouse', 25, '2026-10-20'), (3, 1, 'monitor', 310, '2026-11-03'),
  (4, 2, 'desk', 540, '2026-09-14'), (5, 2, 'chair', 220, '2026-11-01'), (6, 3, 'cables', 18, '2026-08-30');
CREATE TABLE weather_data (station text PRIMARY KEY, temps text NOT NULL);
INSERT INTO weather_data VALUES
  ('Station North', '-1,-4,-14,-15,-16,-15,-12,-9,-3,0,1,2'),
  ('Station West',  '2,4,5,6,9,10,15,16,13,12,10,9,5,3,1'),
  ('Station South', '12,18,22,25,29,30,33,31,30,29,28,25,24,23,14');
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'Without LATERAL: an error', sql: `SELECT try_sql($q$
  SELECT a.name, p.item
  FROM accounts a
  JOIN (SELECT * FROM purchases WHERE account_id = a.id) p ON true
$q$) AS result;`,
        note: '`42P01: invalid reference to FROM-clause entry for table "a"`. A plain FROM subquery cannot see its neighbours.' },
      { label: 'Latest 2 per account', sql: `SELECT a.name, p.item, p.created_at
FROM accounts a
CROSS JOIN LATERAL (
  SELECT item, created_at FROM purchases
  WHERE account_id = a.id
  ORDER BY created_at DESC LIMIT 2
) p
ORDER BY a.id, p.created_at DESC;`,
        note: '5 rows. Umbrella has no purchases, so CROSS JOIN LATERAL drops it.' },
      { label: 'Keep empty parents', sql: `SELECT a.name, p.item, p.created_at
FROM accounts a
LEFT JOIN LATERAL (
  SELECT item, created_at FROM purchases
  WHERE account_id = a.id
  ORDER BY created_at DESC LIMIT 2
) p ON true
ORDER BY a.id, p.created_at DESC;`,
        note: '6 rows: Umbrella appears with NULLs. `ON true` is required syntax for LEFT JOIN; the real condition lives inside the subquery.' },
      { label: 'loops=4 and the index', sql: `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, BUFFERS OFF)
SELECT a.name, p.item FROM accounts a
LEFT JOIN LATERAL (SELECT * FROM purchases WHERE account_id = a.id
                   ORDER BY created_at DESC LIMIT 2) p ON true;

CREATE INDEX purchases_recent ON purchases (account_id, created_at DESC);
SET enable_seqscan = off;   -- the table is tiny; force the plan you would get at scale
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, BUFFERS OFF)
SELECT a.name, p.item FROM accounts a
LEFT JOIN LATERAL (SELECT * FROM purchases WHERE account_id = a.id
                   ORDER BY created_at DESC LIMIT 2) p ON true;
RESET enable_seqscan;`,
        note: 'A **Nested Loop** whose inner side shows `loops=4`. With the index the inner side is an Index Scan that reads at most 2 entries per account, no sort.' },
      { label: 'Functions are implicitly lateral', sql: `SELECT a.name, t.tag, t.n
FROM accounts a, unnest(a.tags) WITH ORDINALITY AS t(tag, n)
ORDER BY a.id, t.n;

SELECT a.name, t.tag
FROM accounts a LEFT JOIN LATERAL unnest(a.tags) AS t(tag) ON true
ORDER BY a.id;`,
        note: 'A set-returning function in FROM may always reference earlier items, with or without the keyword. `WITH ORDINALITY` adds a bigint position column. Initech has no tags: dropped by the comma form, kept by LEFT JOIN.' },
      { label: 'Split a CSV column (and the text trap)', sql: `-- hourly readings stored as one comma-separated string per station
SELECT w.station, max(t) AS max_reading, min(t) AS min_reading
FROM weather_data w, unnest(string_to_array(w.temps, ',')) AS t
GROUP BY w.station ORDER BY 1;

-- cast before comparing
SELECT w.station, max(t) AS max_temp, min(t) AS min_temp, count(*) AS readings
FROM weather_data w, unnest(string_to_array(w.temps, ',')::int[]) AS t
GROUP BY w.station ORDER BY 1;

-- the hottest hour per station: ordinality + LATERAL top-1
SELECT w.station, h.hour, h.temp
FROM weather_data w
CROSS JOIN LATERAL (
  SELECT hour, temp
  FROM unnest(string_to_array(w.temps, ',')::int[]) WITH ORDINALITY AS u(temp, hour)
  ORDER BY temp DESC LIMIT 1
) h ORDER BY 1;`,
        note: '`string_to_array` returns `text[]`, so the first query compares **strings**: North\'s minimum is \'-1\' (true value −16) and West\'s maximum is \'9\' (true 16). Casting to `int[]` fixes it. The last query numbers each reading with `WITH ORDINALITY` and keeps the top one per station: hour 8 at West (16°), hour 7 at South (33°).' },
      { label: 'LATERAL vs a window function', sql: `SELECT name, item, created_at
FROM (
  SELECT a.name, p.item, p.created_at,
         row_number() OVER (PARTITION BY a.id ORDER BY p.created_at DESC) AS rn
  FROM accounts a JOIN purchases p ON p.account_id = a.id
) x
WHERE rn <= 2
ORDER BY name, created_at DESC;`,
        note: 'Same 5 rows. The window version numbers **every** purchase and then filters; LATERAL + LIMIT with an index reads only the rows it returns. With few parents and many children per parent, LATERAL wins.' },
    ],
  },
  production: {
    title: 'An activity feed: latest 3 events per followed user',
    context: 'A social app shows each user the 3 newest posts from every account they follow. `posts` has 400 M rows; a typical user follows 200 accounts.',
    problem: 'The original query ranked all posts of all followed accounts with `row_number() OVER (PARTITION BY author_id ORDER BY created_at DESC)` and then filtered `rn <= 3`. For a user following prolific accounts it sorted hundreds of thousands of rows to return 600.',
    solution: 'Drive the query from the follow list and fetch each author\'s newest 3 with LATERAL, backed by an index whose order matches the subquery.',
    sql: `CREATE INDEX posts_author_recent ON posts (author_id, created_at DESC);

SELECT f.author_id, p.id, p.created_at
FROM follows f
CROSS JOIN LATERAL (
  SELECT id, created_at FROM posts
  WHERE author_id = f.author_id
  ORDER BY created_at DESC LIMIT 3
) p
WHERE f.follower_id = $1;`,
    outcome: 'The plan becomes a Nested Loop with an Index Scan inside, `loops` = number of followed accounts, and at most 3 index entries read per loop: about 600 rows touched instead of every post of those authors.',
  },
  pitfalls: [
    { title: 'CROSS JOIN LATERAL silently drops parents',
      symptom: 'Accounts with no purchases are missing from a "latest purchase per account" report.',
      cause: 'With comma or CROSS JOIN LATERAL, an outer row whose subquery returns zero rows produces no output, just like an inner join.',
      fix: 'Use `LEFT JOIN LATERAL (…) p ON true` to keep every outer row, NULL-extended.' },
    { title: 'LATERAL without a supporting index',
      symptom: 'A LATERAL top-N query is slower than the window-function version.',
      cause: 'The subquery runs once per outer row. Without an index matching `WHERE … ORDER BY`, each run scans and sorts the inner table.',
      fix: 'Create an index on `(correlation_column, sort_column DESC)` so each loop is a short index scan, and check `loops=` in EXPLAIN ANALYZE.' },
    { title: 'Referencing the right side from a RIGHT/FULL join',
      symptom: '`ERROR: invalid reference to FROM-clause entry` even though LATERAL is written.',
      cause: 'A LATERAL item may only reference items that are INNER or LEFT joined to it. In `X RIGHT JOIN LATERAL Y`, Y cannot reference X.',
      fix: 'Rewrite with the LATERAL item on the right side of an inner or LEFT join.' },
    { title: 'Max-then-join-back for "latest per group"',
      symptom: 'A "latest purchase per account" query built as `GROUP BY account_id` + `max(created_at)`, joined back on both columns, returns two rows for some accounts.',
      cause: 'The join back matches every row with that timestamp, so a tie on `created_at` returns all tied rows. It also reads the table twice. A common claim is that this GROUP BY form always beats LATERAL at scale; with an index on `(account_id, created_at DESC)` the LATERAL plan reads one index entry per account.',
      fix: 'Use LATERAL with `ORDER BY created_at DESC, id DESC LIMIT 1`, or `DISTINCT ON (account_id) … ORDER BY account_id, created_at DESC, id DESC`. Both return exactly one row per key, with a deterministic tie-breaker.' },
  ],
  pointers: [
    '`LATERAL` lets a FROM subquery reference columns of FROM items **to its left**; it runs once per outer row.',
    'Set-returning functions in FROM are **implicitly lateral**; the keyword is optional there.',
    'CROSS JOIN / comma LATERAL drops rows with an empty result; `LEFT JOIN LATERAL … ON true` keeps them.',
    'Top-N per group: LATERAL + `ORDER BY … LIMIT n` + index on `(key, sort DESC)` → Nested Loop with Index Scan (the [window-function](/m3/window-functions) form ranks every row first).',
    '`WITH ORDINALITY` numbers the rows of a function in FROM (bigint, from 1). A spatial use of LATERAL: [nearest neighbour per row](/e4/nearest-neighbour).',
  ],
  sources: ['queries-table-expressions.html', 'sql-select.html', 'functions-srf.html', 'using-explain.html'],
}
