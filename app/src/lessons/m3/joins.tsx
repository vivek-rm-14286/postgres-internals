import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { ResultTable, Sql, Stat, type Cell, type ResultRow } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a join matcher. For each row of the left table the ON condition is evaluated against
 * every right row with SQL three-valued logic, matched pairs are emitted, and outer joins add
 * NULL-extended rows. A WHERE filter runs afterwards, on the joined rows. The final counts match the
 * playground (teams × players) exactly.
 * ---------------------------------------------------------------------------------------------- */

interface Team { id: number; name: string }
interface Player { id: number; name: string; team_id: number | null; active: boolean }
const TEAMS: Team[] = [{ id: 1, name: 'Lions' }, { id: 2, name: 'Tigers' }, { id: 3, name: 'Bears' }, { id: 4, name: 'Wolves' }]
const PLAYERS: Player[] = [
  { id: 1, name: 'Ana', team_id: 1, active: true }, { id: 2, name: 'Ben', team_id: 1, active: false },
  { id: 3, name: 'Cy', team_id: 2, active: true }, { id: 4, name: 'Dee', team_id: null, active: true },
  { id: 5, name: 'Eli', team_id: null, active: false },
]

type Mode = 'inner' | 'left' | 'right' | 'full' | 'cross' | 'semi' | 'anti'
type Filter = 'none' | 'on' | 'where'
const and3 = (a: boolean | null, b: boolean | null): boolean | null => (a === false || b === false ? false : a === null || b === null ? null : true)

function cond(mode: Mode, filter: Filter, t: Team, p: Player): boolean | null {
  if (mode === 'cross') return true
  const eq = p.team_id === null ? null : p.team_id === t.id
  return filter === 'on' ? and3(eq, p.active) : eq
}

interface JState {
  phase: 'intro' | 'row' | 'right' | 'where' | 'done'
  cur: number | null
  evals: (boolean | null)[]
  rows: ResultRow[]
  matched: Set<number>
}

const semiLike = (m: Mode) => m === 'semi' || m === 'anti'
const fieldsFor = (m: Mode) => (semiLike(m) ? ['t.id', 't.name'] : ['t.id', 'team', 'player', 'team_id', 'active'])
const pairCells = (t: Team | null, p: Player | null): Cell[] => [t?.id ?? null, t?.name ?? null, p?.name ?? null, p ? p.team_id : null, p ? String(p.active) : null]

function sqlFor(m: Mode, f: Filter) {
  const extra = f === 'on' ? ' AND p.active' : ''
  if (m === 'semi' || m === 'anti')
    return `SELECT t.id, t.name FROM teams t\nWHERE ${m === 'anti' ? 'NOT ' : ''}EXISTS (\n  SELECT 1 FROM players p\n  WHERE p.team_id = t.id${extra});`
  if (m === 'cross') return `SELECT * FROM teams t\nCROSS JOIN players p${f === 'where' ? '\nWHERE p.active' : ''};`
  const kw = { inner: 'JOIN', left: 'LEFT JOIN', right: 'RIGHT JOIN', full: 'FULL JOIN' }[m]
  return `SELECT * FROM teams t\n${kw} players p\n  ON p.team_id = t.id${extra}${f === 'where' ? '\nWHERE p.active' : ''};`
}

function buildSteps(mode: Mode, filter: Filter): Step<JState>[] {
  const f: Filter = semiLike(mode) && filter === 'where' ? 'none' : mode === 'cross' && filter === 'on' ? 'none' : filter
  const steps: Step<JState>[] = []
  const rows: ResultRow[] = []
  const matched = new Set<number>()
  const condText = mode === 'cross' ? 'no condition: every pair' : `\`p.team_id = t.id${f === 'on' ? ' AND p.active' : ''}\``
  steps.push({ title: 'Two inputs, one condition', body: `Left: **teams** (4 rows). Right: **players** (5 rows, two with \`team_id\` NULL). The ${semiLike(mode) ? 'subquery' : 'join'} tests ${condText} for each pair.`,
    state: { phase: 'intro', cur: null, evals: [], rows: [], matched: new Set() } })
  TEAMS.forEach((t, ti) => {
    const evals = PLAYERS.map((p) => cond(mode, f, t, p))
    const hits = PLAYERS.filter((_, k) => evals[k] === true)
    hits.forEach((p) => matched.add(p.id))
    let body: string
    if (mode === 'semi') {
      if (hits.length) rows.push({ key: `t${t.id}`, cells: [t.id, t.name], t: 'tuple' })
      body = hits.length ? `**${t.name}** has ${hits.length} match${hits.length > 1 ? 'es' : ''}, but a **semi-join** emits the left row **once** and stops looking.` : `No player satisfies the condition, so EXISTS is false and **${t.name}** is not returned.`
    } else if (mode === 'anti') {
      if (!hits.length) rows.push({ key: `t${t.id}`, cells: [t.id, t.name], t: 'new' })
      body = hits.length ? `**${t.name}** has a match, so NOT EXISTS is false: dropped.` : `No match at all, so the **anti-join** keeps **${t.name}**.`
    } else {
      hits.forEach((p) => rows.push({ key: `t${t.id}p${p.id}`, cells: pairCells(t, p), t: 'tuple' }))
      const outer = (mode === 'left' || mode === 'full') && hits.length === 0
      if (outer) rows.push({ key: `t${t.id}pN`, cells: pairCells(t, null), t: 'new' })
      const nulls = evals.filter((e) => e === null).length
      body = hits.length
        ? `**${t.name}** matches ${hits.map((p) => p.name).join(' and ')}: ${hits.length} output row${hits.length > 1 ? 's' : ''}.${nulls && mode !== 'cross' ? ` \`NULL = ${t.id}\` is **NULL, not true**, so Dee and Eli never match.` : ''}`
        : outer ? `Nothing matches **${t.name}**. A ${mode.toUpperCase()} join still emits it once, **NULL-extended** on the right.` : `Nothing matches **${t.name}**, and ${mode === 'right' ? 'a RIGHT' : 'an INNER'} join drops unmatched **left** rows.`
      const blocked = f === 'on' ? PLAYERS.filter((p) => p.team_id === t.id && !p.active) : []
      if (blocked.length) body += ` ${blocked.map((p) => p.name).join(', ')} fails \`p.active\` inside ON, so it simply does not match.`
    }
    steps.push({ title: `Left row ${ti + 1}: ${t.name} (id ${t.id})`, body, state: { phase: 'row', cur: ti, evals, rows: [...rows], matched: new Set(matched) } })
  })
  if (mode === 'right' || mode === 'full') {
    const un = PLAYERS.filter((p) => !matched.has(p.id))
    un.forEach((p) => rows.push({ key: `tNp${p.id}`, cells: pairCells(null, p), t: 'new' }))
    steps.push({ title: 'Unmatched right rows', body: `After the scan, every player that never matched (${un.map((p) => p.name).join(', ')}) is emitted once with **NULLs for the team columns**.`,
      state: { phase: 'right', cur: null, evals: [], rows: [...rows], matched: new Set(matched) } })
  }
  if (f === 'where') {
    const kept = rows.map((r) => ({ ...r, dim: r.cells[4] !== 'true', note: r.cells[4] === null ? 'p.active is NULL: not true' : undefined }))
    const removed = kept.filter((r) => r.dim).length
    steps.push({ title: 'WHERE p.active runs after the join', body: `The filter sees the **joined** rows.${rows.some((r) => r.cells[4] === null) ? ' NULL-extended rows have `p.active` = NULL, which is not true, so they go too:' : ''} ${removed} of ${rows.length} rows removed.${mode === 'left' ? ' The LEFT JOIN has quietly become an inner join.' : ''}`,
      state: { phase: 'where', cur: null, evals: [], rows: kept, matched: new Set(matched) } })
    const final = rows.filter((r) => r.cells[4] === 'true')
    steps.push({ title: `Result: ${final.length} rows`, body: f === 'where' && mode === 'left' ? 'Compare with the **ON** filter: there the condition decides *matching*, so Bears and Wolves survive as NULL-extended rows (4 rows, not 2).' : 'Rows that failed the WHERE test are gone.',
      state: { phase: 'done', cur: null, evals: [], rows: final, matched: new Set(matched) } })
  } else {
    steps.push({ title: `Result: ${rows.length} rows`, body: resultNote(mode, f, rows.length), state: { phase: 'done', cur: null, evals: [], rows: [...rows], matched: new Set(matched) } })
  }
  return steps
}

function resultNote(mode: Mode, f: Filter, n: number) {
  switch (mode) {
    case 'inner': return `Only matching pairs survive. ${f === 'on' ? 'For an inner join, a filter in ON or in WHERE gives the same rows.' : 'Lions appears twice: joining to a one-to-many child **multiplies** parent rows.'}`
    case 'left': return f === 'on' ? '`AND p.active` sat in **ON**, so it only decided which players match. Every team still appears: 4 rows.' : `Every team appears at least once: ${n} rows.`
    case 'right': return 'The mirror image of LEFT: every player appears at least once.'
    case 'full': return 'Inner pairs, plus unmatched rows from **both** sides. Filter `WHERE t.id IS NULL OR p.id IS NULL` to diff two tables.'
    case 'cross': return 'No condition: every team paired with every player, 4 × 5 = **20** rows.'
    case 'semi': return '`EXISTS` never duplicates the left row, unlike a JOIN. In EXPLAIN it appears as a **Semi Join** node.'
    case 'anti': return '`NOT EXISTS` keeps rows with no match. In EXPLAIN it appears as an **Anti Join** node.'
  }
}

const X_L = 12, X_R = 300, BW = 132, BH = 34
const yL = (i: number) => 26 + i * 54
const yR = (i: number) => 14 + i * 46

function Matcher({ s, mode }: { s: JState; mode: Mode }) {
  const t = s.cur === null ? null : TEAMS[s.cur]
  return (
    <svg viewBox="0 0 520 250" className="w-full min-w-[460px]" role="img" aria-label="Join matcher between teams and players">
      <text x={X_L} y={12} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-sans)">teams (left)</text>
      {t && PLAYERS.map((p, k) => {
        const e = s.evals[k]
        const col = e === true ? tone('ok') : e === null ? tone('header') : tone('dead')
        return (
          <motion.path key={`${s.cur}-${p.id}`} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: e === true ? 1 : 0.55 }} transition={{ duration: 0.45, delay: k * 0.06 }}
            d={`M${X_L + BW},${yL(s.cur!) + BH / 2} C${X_L + BW + 70},${yL(s.cur!) + BH / 2} ${X_R - 70},${yR(k) + BH / 2} ${X_R},${yR(k) + BH / 2}`}
            fill="none" stroke={col} strokeWidth={e === true ? 2.2 : 1.2} strokeDasharray={e === true ? undefined : '4 3'} />
        )
      })}
      {TEAMS.map((tm, i) => {
        const active = s.cur === i
        const tt: Tone = active ? 'accent' : 'muted'
        return (
          <g key={tm.id}>
            <motion.rect x={X_L} y={yL(i)} width={BW} height={BH} rx={6} animate={{ strokeWidth: active ? 2.4 : 1 }} fill={toneBg(tt, active ? 22 : 12)} stroke={tone(tt)} />
            <text x={X_L + 10} y={yL(i) + 21} fontSize={12} fontWeight={600} fill="var(--text)" fontFamily="var(--font-mono)">{tm.id} · {tm.name}</text>
          </g>
        )
      })}
      {PLAYERS.map((p, k) => {
        const e = t ? s.evals[k] : undefined
        const unmatched = (s.phase === 'right' || s.phase === 'done' || s.phase === 'where') && (mode === 'right' || mode === 'full') && !s.matched.has(p.id)
        const tt: Tone = unmatched ? 'new' : 'pointer'
        return (
          <g key={p.id}>
            <rect x={X_R} y={yR(k)} width={BW} height={BH} rx={6} fill={toneBg(tt, 12)} stroke={tone(tt)} />
            <text x={X_R + 8} y={yR(k) + 14} fontSize={11.5} fontWeight={600} fill="var(--text)" fontFamily="var(--font-mono)">{p.name}</text>
            <text x={X_R + 8} y={yR(k) + 27} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">team_id {p.team_id ?? 'NULL'} · {p.active ? 'active' : 'inactive'}</text>
            {e !== undefined && (
              <motion.g key={`b${s.cur}-${p.id}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + k * 0.06 }}>
                <rect x={X_R + BW + 8} y={yR(k) + 8} width={60} height={18} rx={4} fill={toneBg(e === true ? 'ok' : e === null ? 'header' : 'dead', 22)} />
                <text x={X_R + BW + 38} y={yR(k) + 21} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={tone(e === true ? 'ok' : e === null ? 'header' : 'dead')} fontFamily="var(--font-mono)">{e === null ? 'NULL' : String(e)}</text>
              </motion.g>
            )}
          </g>
        )
      })}
      <text x={X_R} y={248} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-sans)">players (right) · badge = join condition result</text>
    </svg>
  )
}

function JoinViz() {
  const [mode, setMode] = useState<Mode>('left')
  const [filter, setFilter] = useState<Filter>('none')
  const steps = useMemo(() => buildSteps(mode, filter), [mode, filter])
  const f: Filter = semiLike(mode) && filter === 'where' ? 'none' : mode === 'cross' && filter === 'on' ? 'none' : filter
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Join type" value={mode} onChange={setMode} options={[['inner', 'INNER'], ['left', 'LEFT'], ['right', 'RIGHT'], ['full', 'FULL'], ['cross', 'CROSS'], ['semi', 'EXISTS'], ['anti', 'NOT EXISTS']]} />
        <Segmented label="Extra filter" value={filter} onChange={setFilter} options={[['none', 'no filter'], ['on', 'AND p.active in ON'], ['where', 'WHERE p.active']]} />
      </div>
      {f !== filter && <p className="text-xs text-muted">{mode === 'cross' ? 'CROSS JOIN has no ON clause, so the ON filter is ignored here.' : 'In an EXISTS subquery the outer WHERE cannot see `p`, so this filter does not apply.'}</p>}
      <Stepper key={`${mode}-${filter}`} steps={steps} interval={2600} render={(s) => (
        <div className="grid gap-3">
          <Legend items={[['ok', 'condition true: match'], ['dead', 'false'], ['header', 'NULL (unknown): no match'], ['new', 'NULL-extended / unmatched'], ['accent', 'current left row']]} />
          <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
            <div className="grid content-start gap-2">
              <div className="rounded-lg border border-line bg-bg p-2"><Matcher s={s} mode={mode} /></div>
              <Sql>{sqlFor(mode, f)}</Sql>
            </div>
            <div className="grid content-start gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="rows so far" value={s.rows.filter((r) => !r.dim).length} />
                <Stat label="NULL-extended" value={s.rows.filter((r) => r.t === 'new' && !semiLike(mode)).length} t="new" />
              </div>
              <ResultTable caption="output" fields={fieldsFor(mode)} rows={s.rows} />
            </div>
          </div>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'joins',
  module: 'm3',
  order: 2,
  title: 'Joins, visualized',
  tldr: [
    'A join pairs rows from two inputs wherever the **join condition is true**, and outer joins then add back the unmatched rows **NULL-extended**, while semi- and anti-joins only ask whether a match exists.',
    'Joins are how a normalized schema is read back, and the exact rules (NULL never equals NULL, ON filters before the join and WHERE after it) decide whether a report is right or silently wrong.',
  ],
  visualizer: {
    title: 'The join matcher',
    caption: 'Pick a join type and a filter placement, then step through each left row. Badges show the ON condition in three-valued logic. Compare **LEFT + ON filter** (4 rows) with **LEFT + WHERE filter** (2 rows).',
    Component: JoinViz,
  },
  playground: {
    setup: `
CREATE TABLE teams (id int PRIMARY KEY, name text NOT NULL);
CREATE TABLE players (
  id int PRIMARY KEY, name text NOT NULL,
  team_id int REFERENCES teams, active boolean NOT NULL,
  mentor_id int REFERENCES players);
INSERT INTO teams VALUES (1, 'Lions'), (2, 'Tigers'), (3, 'Bears'), (4, 'Wolves');
INSERT INTO players VALUES
  (1, 'Ana', 1, true, NULL), (2, 'Ben', 1, false, 1), (3, 'Cy', 2, true, 1),
  (4, 'Dee', NULL, true, 3), (5, 'Eli', NULL, false, NULL);
CREATE TABLE goals (player_id int REFERENCES players, scored_on date);
INSERT INTO goals VALUES (1, '2026-10-01'), (1, '2026-10-08'), (1, '2026-10-15'), (3, '2026-10-08');
CREATE TABLE squad_2025 (id int PRIMARY KEY, name text NOT NULL, position text);
CREATE TABLE squad_2026 (LIKE squad_2025 INCLUDING ALL);
INSERT INTO squad_2025 VALUES (1, 'Ana', 'guard'), (2, 'Ben', 'wing'), (3, 'Cy', 'back'), (4, 'Dee', NULL);
INSERT INTO squad_2026 VALUES (1, 'Ana', 'guard'), (2, 'Ben', 'back'), (4, 'Dee', NULL), (5, 'Fay', 'wing');`,
    presets: [
      { label: 'Row counts per join type', sql: `SELECT 'inner' AS join_type, count(*) FROM teams t JOIN players p ON p.team_id = t.id
UNION ALL SELECT 'left',  count(*) FROM teams t LEFT JOIN  players p ON p.team_id = t.id
UNION ALL SELECT 'right', count(*) FROM teams t RIGHT JOIN players p ON p.team_id = t.id
UNION ALL SELECT 'full',  count(*) FROM teams t FULL JOIN  players p ON p.team_id = t.id
UNION ALL SELECT 'cross', count(*) FROM teams t CROSS JOIN players p;`,
        note: '3, 5, 5, 7, 20: the same numbers the visualizer ends on. Dee and Eli (team_id NULL) never match, because `NULL = 1` is NULL, not true.' },
      { label: 'ON vs WHERE', sql: `SELECT t.name, p.name AS player
FROM teams t LEFT JOIN players p ON p.team_id = t.id AND p.active
ORDER BY t.id;

SELECT t.name, p.name AS player
FROM teams t LEFT JOIN players p ON p.team_id = t.id
WHERE p.active
ORDER BY t.id;`,
        note: 'First query: 4 rows, Bears and Wolves kept with NULL players. Second: 2 rows. A WHERE test on the nullable side throws away the NULL-extended rows.' },
      { label: 'Anti-join: find orphans', sql: `-- teams with no players, two equivalent spellings
SELECT t.name FROM teams t
LEFT JOIN players p ON p.team_id = t.id
WHERE p.id IS NULL ORDER BY t.id;

SELECT t.name FROM teams t
WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.team_id = t.id) ORDER BY t.id;

EXPLAIN (COSTS OFF)
SELECT t.name FROM teams t
WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.team_id = t.id);`,
        note: 'Both return Bears and Wolves, and the second plans as a **Hash Right Anti Join** (an anti-join that hashes the left side). Test a NOT NULL column (`p.id`) for IS NULL, never a nullable one.' },
      { label: 'USING vs NATURAL', sql: `-- ON keeps both copies of the join column
SELECT * FROM goals g JOIN (SELECT id AS player_id, name FROM players) p
  ON p.player_id = g.player_id LIMIT 2;

-- USING merges them into one output column
SELECT * FROM goals JOIN (SELECT id AS player_id, name FROM players) p
  USING (player_id) LIMIT 2;

-- teams and players share the column names id AND name
SELECT count(*) AS natural_rows FROM teams NATURAL JOIN players;`,
        note: '`USING (player_id)` prints the join column once. `NATURAL JOIN` joins on **every** same-named column: here `id = id AND name = name`, which never holds, so 0 rows. A column added later can change any NATURAL join silently.' },
      { label: 'Self-join: mentors and teammates', sql: `SELECT p.name AS player, m.name AS mentor
FROM players p
LEFT JOIN players m ON m.id = p.mentor_id
ORDER BY p.id;

-- teammates: <> lists every pair twice, < lists it once
SELECT a.name AS a, b.name AS b FROM players a
JOIN players b ON b.team_id = a.team_id AND a.id <> b.id;

SELECT a.name AS a, b.name AS b FROM players a
JOIN players b ON b.team_id = a.team_id AND a.id < b.id;`,
        note: 'The same table appears twice under two **aliases**. LEFT keeps Ana and Eli, who have no mentor. For pairs, `a.id <> b.id` returns (Ana, Ben) and (Ben, Ana); `a.id < b.id` keeps one of each.' },
      { label: 'Fan-out double counting', sql: `-- WRONG: joining two child tables multiplies rows
SELECT t.name, count(p.id) AS players, count(g.player_id) AS goals
FROM teams t
LEFT JOIN players p ON p.team_id = t.id
LEFT JOIN goals g ON g.player_id = p.id
GROUP BY t.name ORDER BY t.name;

-- RIGHT: aggregate each child before joining
SELECT t.name,
       (SELECT count(*) FROM players p WHERE p.team_id = t.id) AS players,
       (SELECT count(*) FROM goals g JOIN players p ON p.id = g.player_id WHERE p.team_id = t.id) AS goals
FROM teams t ORDER BY t.name;`,
        note: 'The first query says Lions have 4 players: Ana is counted once per goal. The second gives 2 players and 3 goals.' },
      { label: 'Diff two tables: EXCEPT vs FULL JOIN', sql: `-- rows present on one side only (parentheses matter, see pitfalls)
(SELECT 'only in 2025' AS side, * FROM squad_2025
 EXCEPT SELECT 'only in 2025', * FROM squad_2026)
UNION ALL
(SELECT 'only in 2026', * FROM squad_2026
 EXCEPT SELECT 'only in 2026', * FROM squad_2025)
ORDER BY id, side;

-- FULL JOIN on the key says what kind of change it is
SELECT coalesce(a.id, b.id) AS id, a.position AS was, b.position AS now,
       CASE WHEN a.id IS NULL THEN 'added'
            WHEN b.id IS NULL THEN 'removed' ELSE 'changed' END AS change
FROM squad_2025 a FULL JOIN squad_2026 b ON b.id = a.id
WHERE a.id IS NULL OR b.id IS NULL
   OR (a.name, a.position) IS DISTINCT FROM (b.name, b.position)
ORDER BY 1;

-- joining on every column: NULL never matches, so Dee looks changed
SELECT id, name, position
FROM squad_2025 FULL JOIN squad_2026 USING (id, name, position)
WHERE squad_2025.id IS NULL OR squad_2026.id IS NULL ORDER BY id;`,
        note: 'EXCEPT compares whole rows and treats NULLs as **equal**: 4 rows (Ben\'s old and new version, Cy, Fay), and Dee (position NULL in both years) is not reported. The keyed FULL JOIN returns 3 rows: Ben changed, Cy removed, Fay added. Joining on all columns reports Dee twice, because `NULL = NULL` is not true. Only `IS DISTINCT FROM` compares NULLs the way EXCEPT does.' },
    ],
  },
  production: {
    title: 'A churn report that lost every quiet customer',
    context: 'A subscription team reports customers and their orders this month: `customers LEFT JOIN orders`, so customers with no orders should show 0.',
    problem: 'Someone added `WHERE o.created_at >= date_trunc(\'month\', now())` to restrict the month. The report dropped from 12,400 customers to 8,100. The 4,300 missing customers were exactly the ones with no orders, the at-risk group the report existed to find.',
    solution: 'Move the restriction on the nullable side into the ON clause, so it decides which orders match instead of filtering joined rows. Count a column from the right side, so unmatched customers count 0.',
    sql: `SELECT c.id, c.name, count(o.id) AS orders_this_month
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id
 AND o.created_at >= date_trunc('month', now())
GROUP BY c.id, c.name;`,
    outcome: 'Every customer appears again, with 0 for the quiet ones. The rule to remember: a WHERE predicate that is not true for NULL turns a LEFT JOIN into an inner join.',
  },
  pitfalls: [
    { title: 'Filtering the nullable side in WHERE',
      symptom: 'A LEFT JOIN returns exactly the same rows as an inner join.',
      cause: 'WHERE runs after the join. NULL-extended rows have NULL in every right-side column, and `NULL = x` or `NULL > x` is not true, so they are removed.',
      fix: 'Put right-side restrictions in the `ON` clause. Keep `WHERE` for left-side filters and for deliberate `IS NULL` anti-join tests.' },
    { title: 'NATURAL JOIN after a schema change',
      symptom: 'A report that worked for years suddenly returns zero rows after a migration added `updated_at` to two tables.',
      cause: '`NATURAL` joins on **all** same-named columns, so the new column became part of the join condition.',
      fix: 'Write `USING (col)` or an explicit `ON`. Both survive unrelated column additions.' },
    { title: 'Fan-out inflates aggregates',
      symptom: 'Revenue per customer is 3× too high after joining orders and support tickets in one query.',
      cause: 'Joining one parent to two independent child tables produces every combination of child rows (m × n per parent).',
      fix: 'Aggregate each child in a subquery or LATERAL first, then join the totals. Or use `count(DISTINCT …)` when that is truly what you mean.' },
    { title: 'Expecting NULL keys to match',
      symptom: 'Rows with a NULL `region` vanish from a join that compares `a.region = b.region`.',
      cause: 'NULL compared with anything, NULL included, is NULL. Join conditions keep only true pairs.',
      fix: 'Use `a.region IS NOT DISTINCT FROM b.region` if NULLs should pair up, knowing that it is not hash- or merge-joinable: the planner falls back to a nested loop, which is slow on large inputs.' },
    { title: 'Set operators without parentheses',
      symptom: 'A "differences in both directions" query built from EXCEPT and UNION misses or keeps the wrong rows.',
      cause: '`UNION` and `EXCEPT` have the **same precedence** and group left to right (`INTERSECT` binds tighter). `A EXCEPT B UNION C EXCEPT D` means `((A EXCEPT B) UNION C) EXCEPT D`.',
      fix: 'Parenthesize each side: `(A EXCEPT B) UNION ALL (C EXCEPT D)`. Use UNION ALL when the two halves cannot overlap.',
      sql: `SELECT 'x' UNION SELECT 'y' EXCEPT SELECT 'x';    -- y
SELECT 'x' UNION (SELECT 'y' EXCEPT SELECT 'x');  -- x, y` },
    { title: 'A self-join that lists every pair twice',
      symptom: 'A "duplicate customers" report shows (A, B) and (B, A), and its count is double the real number.',
      cause: '`ON a.id <> b.id` is true in both directions, so each unordered pair appears twice.',
      fix: 'Use `ON a.id < b.id` to keep each pair once (and never pair a row with itself).' },
  ],
  pointers: [
    'INNER keeps pairs where ON is **true**; LEFT/RIGHT/FULL add unmatched rows **NULL-extended**; CROSS is N × M.',
    'ON decides *matching*; WHERE filters *after* the join. They differ only for outer joins.',
    '`NULL = NULL` is NULL, so NULL keys never join. Use `IS NOT DISTINCT FROM` deliberately.',
    '`EXISTS` / `NOT EXISTS` are **semi- and anti-joins**: they never duplicate the left row.',
    'Prefer `USING` or `ON` over `NATURAL`; the join algorithms (nested loop, hash, merge) are in [Reading EXPLAIN (ANALYZE, BUFFERS)](/m4/explain-analyze).',
  ],
  sources: ['queries-table-expressions.html', 'tutorial-join.html', 'sql-select.html', 'functions-subquery.html', 'functions-comparison.html'],
}
