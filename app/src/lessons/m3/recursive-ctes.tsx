import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { ResultTable, Sql, Stat, type Cell, type ResultRow } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the documented recursive-query algorithm, run step by step.
 *   1. evaluate the non-recursive term -> result + working table
 *   2. while the working table is not empty: evaluate the recursive term against the working table,
 *      (UNION: drop duplicates of earlier rows), append to result, put the rows in the intermediate
 *      table, then make it the new working table.
 * The simulation reproduces exactly the rows PostgreSQL 18 returns for the playground queries.
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'tree' | 'union_all' | 'union' | 'cycle'
interface Emp { id: number; name: string; title: string; manager_id: number | null }
const EMPS: Emp[] = [
  { id: 1, name: 'Maya', title: 'CEO', manager_id: null }, { id: 2, name: 'Raj', title: 'CTO', manager_id: 1 },
  { id: 3, name: 'Lena', title: 'CFO', manager_id: 1 }, { id: 4, name: 'Omar', title: 'Eng Manager', manager_id: 2 },
  { id: 5, name: 'Ivy', title: 'SRE', manager_id: 2 }, { id: 6, name: 'Tom', title: 'Accountant', manager_id: 3 },
  { id: 7, name: 'Zoe', title: 'Developer', manager_id: 4 }, { id: 8, name: 'Kai', title: 'Developer', manager_id: 4 },
  { id: 9, name: 'Noor', title: 'Intern', manager_id: 7 },
]
const ROUTES: [string, string][] = [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D']]

interface RRow { node: string; cells: Cell[]; expand: boolean }
interface RState { iter: number; working: RRow[]; produced: RRow[]; discarded: RRow[]; result: RRow[]; done: boolean; runaway?: boolean }

const SQL: Record<Mode, string> = {
  tree: `WITH RECURSIVE sub AS (
  SELECT id, name, manager_id, 0 AS depth
  FROM employees WHERE id = 2   -- anchor
  UNION ALL            -- recursive term:
  SELECT e.id, e.name, e.manager_id, s.depth + 1
  FROM employees e
  JOIN sub s ON e.manager_id = s.id
)
SELECT * FROM sub;`,
  union_all: `WITH RECURSIVE r AS (
  SELECT 'A'::text AS node, 0 AS hops
  UNION ALL
  SELECT routes.dst, r.hops + 1
  FROM routes JOIN r ON routes.src = r.node
)
SELECT * FROM r;   -- never finishes`,
  union: `WITH RECURSIVE r AS (
  SELECT 'A'::text AS node
  UNION                -- discard duplicate rows
  SELECT routes.dst
  FROM routes JOIN r ON routes.src = r.node
)
SELECT * FROM r;`,
  cycle: `WITH RECURSIVE r AS (
  SELECT 'A'::text AS node, 0 AS hops
  UNION ALL
  SELECT routes.dst, r.hops + 1
  FROM routes JOIN r ON routes.src = r.node
) CYCLE node SET is_cycle USING path
SELECT * FROM r;`,
}

const fieldsFor = (m: Mode) => (m === 'tree' ? ['id', 'name', 'manager_id', 'depth'] : m === 'union' ? ['node'] : m === 'cycle' ? ['node', 'hops', 'is_cycle', 'path'] : ['node', 'hops'])

function run(mode: Mode): RState[] {
  const states: RState[] = []
  const pathOf = (r: RRow) => String(r.cells[3]).replace(/[{}()]/g, '').split(',')
  let working: RRow[]
  if (mode === 'tree') {
    const e = EMPS[1]
    working = [{ node: String(e.id), cells: [e.id, e.name, e.manager_id, 0], expand: true }]
  } else if (mode === 'union') working = [{ node: 'A', cells: ['A'], expand: true }]
  else if (mode === 'cycle') working = [{ node: 'A', cells: ['A', 0, 'false', '{(A)}'], expand: true }]
  else working = [{ node: 'A', cells: ['A', 0], expand: true }]
  let result = [...working]
  states.push({ iter: 0, working: [], produced: working, discarded: [], result: [...result], done: false })
  for (let iter = 1; iter <= 7; iter++) {
    const produced: RRow[] = []
    const discarded: RRow[] = []
    for (const w of working) {
      if (!w.expand) continue
      if (mode === 'tree') {
        const depth = Number(w.cells[3])
        EMPS.filter((e) => e.manager_id === Number(w.node)).forEach((e) => produced.push({ node: String(e.id), cells: [e.id, e.name, e.manager_id, depth + 1], expand: true }))
      } else {
        ROUTES.filter(([s]) => s === w.node).forEach(([, d]) => {
          if (mode === 'union') {
            const row: RRow = { node: d, cells: [d], expand: true }
            if (result.some((r) => r.node === d) || produced.some((r) => r.node === d)) discarded.push(row)
            else produced.push(row)
          } else if (mode === 'cycle') {
            const path = pathOf(w)
            const isCycle = path.includes(d)
            produced.push({ node: d, cells: [d, Number(w.cells[1]) + 1, String(isCycle), `{${[...path, d].map((p) => `(${p})`).join(',')}}`], expand: !isCycle })
          } else produced.push({ node: d, cells: [d, Number(w.cells[1]) + 1], expand: true })
        })
      }
    }
    result = [...result, ...produced]
    const runaway = mode === 'union_all' && iter === 7
    states.push({ iter, working, produced, discarded, result: [...result], done: produced.length === 0, runaway })
    if (produced.length === 0 || runaway) break
    working = produced
  }
  return states
}

function bodyFor(mode: Mode, s: RState, prev?: RState): { title: string; body: string } {
  if (s.iter === 0) return { title: 'Non-recursive term', body: `Run the anchor once. Its rows go into the **result** and into the **working table**${mode === 'tree' ? ': Raj, the CTO' : ': start at node A'}.` }
  if (s.runaway) return { title: `Iteration ${s.iter}: it never ends`, body: 'Every lap around A → B → C → A produces new rows, because `hops` makes each row unique. UNION ALL keeps them all, so the working table is never empty. In psql this runs until you cancel it or memory runs out.' }
  if (s.done) return { title: `Iteration ${s.iter}: working table empty, stop`, body: `The recursive term found no new rows${mode === 'cycle' ? ': the only candidates were marked `is_cycle`, and those are not expanded' : mode === 'union' ? ': everything it found was already in the result' : ''}. The query returns all **${s.result.length} rows** collected so far.` }
  const names = s.produced.map((r) => (mode === 'tree' ? String(r.cells[1]) : r.node)).join(', ')
  let body = `The recursive term reads only the **working table** (${prev ? prev.produced.length : 0} row${prev && prev.produced.length === 1 ? '' : 's'}) and produces ${s.produced.length}: ${names}. They are appended to the result and become the next working table.`
  if (s.discarded.length) body = `The term produces ${[...s.produced, ...s.discarded].map((r) => r.node).join(', ')}. With **UNION**, ${s.discarded.map((r) => r.node).join(', ')} duplicate${s.discarded.length === 1 ? 's' : ''} an earlier row and is discarded. ${s.produced.length ? `${names} survive.` : ''}`
  if (mode === 'cycle' && s.produced.some((r) => r.cells[2] === 'true')) body += ' A is already on its own `path`, so that row is emitted with **is_cycle = true** and not followed further.'
  return { title: `Iteration ${s.iter}`, body }
}

/* --- diagrams --------------------------------------------------------------------------------- */
const TREE_POS: Record<number, [number, number]> = { 1: [215, 24], 2: [130, 84], 3: [330, 84], 4: [80, 144], 5: [185, 144], 6: [330, 144], 7: [44, 204], 8: [128, 204], 9: [44, 264] }
const GRAPH_POS: Record<string, [number, number]> = { A: [70, 150], B: [200, 60], C: [330, 150], D: [450, 150] }

function nodeTone(key: string, s: RState): Tone {
  if (s.produced.some((r) => r.node === key && r.cells[2] === 'true')) return 'dead'
  if (s.produced.some((r) => r.node === key)) return 'new'
  if (s.working.some((r) => r.node === key)) return 'accent'
  if (s.result.some((r) => r.node === key)) return 'ok'
  return 'muted'
}

function Diagram({ mode, s }: { mode: Mode; s: RState }) {
  if (mode === 'tree') {
    return (
      <svg viewBox="0 0 400 290" className="w-full min-w-[360px]" role="img" aria-label="Org chart">
        {EMPS.filter((e) => e.manager_id).map((e) => {
          const [x1, y1] = TREE_POS[e.manager_id!], [x2, y2] = TREE_POS[e.id]
          return <line key={e.id} x1={x1} y1={y1 + 14} x2={x2} y2={y2 - 14} stroke="var(--border)" strokeWidth={1.5} />
        })}
        {EMPS.map((e) => {
          const [x, y] = TREE_POS[e.id]; const t = nodeTone(String(e.id), s)
          return (
            <motion.g key={e.id} animate={{ scale: t === 'new' ? [1, 1.08, 1] : 1 }} style={{ originX: `${x}px`, originY: `${y}px` }}>
              <rect x={x - 38} y={y - 14} width={76} height={28} rx={6} fill={toneBg(t, t === 'muted' ? 8 : 22)} stroke={tone(t)} strokeWidth={t === 'muted' ? 1 : 1.8} />
              <text x={x} y={y - 1} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{e.name}</text>
              <text x={x} y={y + 10} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-sans)">{e.title}</text>
            </motion.g>
          )
        })}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 520 244" className="w-full min-w-[420px]" role="img" aria-label="Route graph with a cycle">
      <defs><marker id="rc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" /></marker></defs>
      {ROUTES.map(([a, b]) => {
        const [x1, y1] = GRAPH_POS[a], [x2, y2] = GRAPH_POS[b]
        const back = a === 'C' && b === 'A'
        const d = back ? `M${x1 - 10},${y1 + 22} C${x1 - 60},${y1 + 80} ${x2 + 60},${y2 + 80} ${x2 + 12},${y2 + 22}` : (() => {
          const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len
          return `M${x1 + ux * 26},${y1 + uy * 26} L${x2 - ux * 28},${y2 - uy * 28}`
        })()
        return <path key={a + b} d={d} fill="none" stroke={back ? 'var(--c-dead)' : 'var(--muted)'} strokeWidth={1.6} markerEnd="url(#rc-arrow)" strokeDasharray={back ? '5 3' : undefined} />
      })}
      <text x={200} y={238} textAnchor="middle" fontSize={10.5} fill="var(--c-dead)" fontFamily="var(--font-mono)">C → A closes a cycle</text>
      {Object.entries(GRAPH_POS).map(([k, [x, y]]) => {
        const t = nodeTone(k, s)
        return (
          <motion.g key={k} animate={{ scale: t === 'new' || t === 'dead' ? [1, 1.1, 1] : 1 }} style={{ originX: `${x}px`, originY: `${y}px` }}>
            <circle cx={x} cy={y} r={24} fill={toneBg(t, t === 'muted' ? 8 : 24)} stroke={tone(t)} strokeWidth={t === 'muted' ? 1 : 2} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{k}</text>
          </motion.g>
        )
      })}
    </svg>
  )
}

const toRows = (rs: RRow[], prefix: string, t?: Tone): ResultRow[] => rs.map((r, k) => ({ key: `${prefix}${k}-${r.cells.join('|')}`, cells: r.cells, t: r.cells[2] === 'true' ? 'dead' : t }))

function RecursiveViz() {
  const [mode, setMode] = useState<Mode>('tree')
  const steps = useMemo<Step<RState>[]>(() => {
    const st = run(mode)
    return st.map((s, k) => ({ ...bodyFor(mode, s, st[k - 1]), state: s }))
  }, [mode])
  return (
    <div className="grid gap-3">
      <Segmented label="Query" value={mode} onChange={setMode} options={[['tree', 'Org chart'], ['union_all', 'Graph: UNION ALL'], ['union', 'Graph: UNION'], ['cycle', 'Graph: CYCLE clause']]} />
      <Stepper key={mode} steps={steps} interval={2600} render={(s) => (
        <div className="grid gap-3">
          <Legend items={[['accent', 'in the working table (input)'], ['new', 'produced this iteration'], ['ok', 'already in the result'], ['dead', 'is_cycle = true / discarded']]} />
          <div className="grid gap-3 md:grid-cols-[1.05fr_1fr]">
            <div className="grid content-start gap-2">
              <div className="rounded-lg border border-line bg-bg p-2"><Diagram mode={mode} s={s} /></div>
              <Sql>{SQL[mode]}</Sql>
            </div>
            <div className="grid content-start gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="iteration" value={s.iter === 0 ? 'anchor' : s.iter} />
                <Stat label="result rows" value={s.runaway ? `${s.result.length}, …` : s.result.length} t={s.runaway ? 'dead' : undefined} />
              </div>
              <ResultTable caption="working table (read by the recursive term)" fields={fieldsFor(mode)} rows={toRows(s.working, 'w', 'accent')} empty={s.iter === 0 ? '(not used by the anchor)' : '(empty)'} />
              <ResultTable caption={s.iter === 0 ? 'rows from the non-recursive term' : 'intermediate table (new rows)'} fields={fieldsFor(mode)}
                rows={[...toRows(s.produced, 'p', 'new'), ...s.discarded.map((r, k) => ({ key: `d${k}`, cells: r.cells, t: 'dead' as Tone, dim: true, note: 'duplicate: discarded by UNION' }))]} empty="(empty: recursion stops)" />
              <ResultTable caption="result so far" fields={fieldsFor(mode)} rows={toRows(s.result, 'r')} />
            </div>
          </div>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'recursive-ctes',
  module: 'm3',
  order: 5,
  title: 'Recursive CTEs',
  tldr: [
    'A `WITH RECURSIVE` query is a non-recursive term `UNION [ALL]` a recursive term, evaluated **iteratively**: each pass feeds only the previous pass\'s new rows (the **working table**) back into the recursive term until no new rows appear.',
    'It is how SQL walks trees and graphs of unknown depth (org charts, bills of materials, routes) in one statement, and the `CYCLE` and `SEARCH` clauses make loops and ordering explicit.',
  ],
  visualizer: {
    title: 'Working table, intermediate table, result',
    caption: 'Step through the algorithm one pass at a time. Start with the org chart, then switch to the graph and compare **UNION ALL** (runs forever), **UNION** and the **CYCLE** clause.',
    Component: RecursiveViz,
  },
  playground: {
    setup: `
CREATE TABLE employees (id int PRIMARY KEY, name text NOT NULL, title text NOT NULL, manager_id int REFERENCES employees);
INSERT INTO employees VALUES
  (1, 'Maya', 'CEO', NULL), (2, 'Raj', 'CTO', 1), (3, 'Lena', 'CFO', 1),
  (4, 'Omar', 'Eng Manager', 2), (5, 'Ivy', 'SRE', 2), (6, 'Tom', 'Accountant', 3),
  (7, 'Zoe', 'Developer', 4), (8, 'Kai', 'Developer', 4), (9, 'Noor', 'Intern', 7);
CREATE TABLE routes (src text NOT NULL, dst text NOT NULL);
INSERT INTO routes VALUES ('A', 'B'), ('B', 'C'), ('C', 'A'), ('C', 'D');`,
    presets: [
      { label: 'Everyone under Raj', sql: `WITH RECURSIVE sub AS (
  SELECT id, name, manager_id, 0 AS depth FROM employees WHERE id = 2
  UNION ALL            -- recursive term:
  SELECT e.id, e.name, e.manager_id, s.depth + 1
  FROM employees e JOIN sub s ON e.manager_id = s.id
)
SELECT * FROM sub;`,
        note: '6 rows in four passes: Raj (depth 0), Omar and Ivy, Zoe and Kai, then Noor. The fifth pass finds nobody and the loop stops.' },
      { label: 'Self-join: one level per join', sql: `-- a self-join reaches exactly as deep as you write joins
SELECT m.name AS manager, e.name AS direct, e2.name AS second_level
FROM employees m
JOIN employees e ON e.manager_id = m.id
LEFT JOIN employees e2 ON e2.manager_id = e.id
WHERE m.name = 'Raj';

-- recursion reaches every level; count what each pass added
WITH RECURSIVE sub AS (
  SELECT id, name, 0 AS depth FROM employees WHERE id = 2
  UNION ALL
  SELECT e.id, e.name, s.depth + 1 FROM employees e JOIN sub s ON e.manager_id = s.id
)
SELECT depth AS pass, count(*) AS rows_added, string_agg(name, ', ' ORDER BY name) AS who
FROM sub GROUP BY depth ORDER BY depth;

EXPLAIN (COSTS OFF)
WITH RECURSIVE sub AS (
  SELECT id, name FROM employees WHERE id = 2
  UNION ALL
  SELECT e.id, e.name FROM employees e JOIN sub s ON e.manager_id = s.id
)
SELECT * FROM sub;`,
        note: 'Two joins find Omar, Ivy, Zoe and Kai, and miss Noor on level 3. The recursive version adds 1, 2, 2, 1 rows per pass and stops when a pass adds nothing. In the plan, **Recursive Union** runs the recursive term against a **WorkTable Scan**: the previous pass\'s rows only.' },
      { label: 'Path to the top', sql: `WITH RECURSIVE up AS (
  SELECT id, name, manager_id, name::text AS chain FROM employees WHERE name = 'Noor'
  UNION ALL
  SELECT m.id, m.name, m.manager_id, up.chain || ' → ' || m.name
  FROM employees m JOIN up ON m.id = up.manager_id
)
SELECT chain FROM up WHERE manager_id IS NULL;`,
        note: 'Walking **upwards** is the same algorithm with the join reversed: Noor → Zoe → Omar → Raj → Maya.' },
      { label: 'SEARCH DEPTH / BREADTH FIRST', sql: `WITH RECURSIVE sub AS (
  SELECT id, name, manager_id FROM employees WHERE id = 2
  UNION ALL
  SELECT e.id, e.name, e.manager_id FROM employees e JOIN sub s ON e.manager_id = s.id
) SEARCH DEPTH FIRST BY id SET ord
SELECT repeat('  ', cardinality(ord) - 1) || name AS tree FROM sub ORDER BY ord;`,
        note: '`SEARCH DEPTH FIRST` adds an `ord` column (the path of ids) to sort by, giving an indented outline. Use `SEARCH BREADTH FIRST` to order level by level. Never rely on the natural output order.' },
      { label: 'CYCLE detection', sql: `WITH RECURSIVE r AS (
  SELECT 'A'::text AS node, 0 AS hops
  UNION ALL
  SELECT routes.dst, r.hops + 1 FROM routes JOIN r ON routes.src = r.node
) CYCLE node SET is_cycle USING path
SELECT * FROM r;`,
        note: '5 rows. The row that returns to A has `is_cycle = true` and is not expanded. Without the CYCLE clause this query never terminates.' },
      { label: 'UNION vs UNION ALL', sql: `WITH RECURSIVE r AS (
  SELECT 'A'::text AS node
  UNION
  SELECT routes.dst FROM routes JOIN r ON routes.src = r.node
)
SELECT * FROM r;

-- with an extra column the rows are never duplicates; LIMIT only for testing
WITH RECURSIVE r AS (
  SELECT 'A'::text AS node, 0 AS hops
  UNION
  SELECT routes.dst, r.hops + 1 FROM routes JOIN r ON routes.src = r.node
)
SELECT * FROM r LIMIT 8;`,
        note: 'With only `node`, UNION discards the repeat of A and stops after 4 rows. Add `hops` and no row ever repeats, so UNION no longer protects you. The LIMIT works only because the outer query stops fetching.' },
      { label: 'A calendar without gaps', sql: `WITH RECURSIVE days(d) AS (
  SELECT DATE '2026-11-01'
  UNION ALL
  SELECT d + 1 FROM days WHERE d < DATE '2026-11-07'
)
SELECT d, to_char(d, 'Dy') AS weekday FROM days;

-- the idiomatic equivalent
SELECT d::date FROM generate_series(DATE '2026-11-01', DATE '2026-11-07', interval '1 day') AS d;`,
        note: 'A counter with a stop condition in WHERE. For plain series, `generate_series` is simpler and faster.' },
    ],
  },
  production: {
    title: 'Expanding a bill of materials for a manufacturer',
    context: 'A manufacturing app stores `parts(assembly_id, component_id, quantity)`: a bike has wheels, a wheel has spokes. Purchasing needs the total of every leaf component for an order of 50 bikes.',
    problem: 'The application walked the tree with one query per level. A deep product took 9 round trips, and a data-entry error that made an assembly contain itself sent the loop spinning until the request timed out.',
    solution: 'One recursive CTE multiplies quantities down the tree, and `CYCLE` turns a bad self-reference into a flagged row instead of an infinite loop.',
    sql: `WITH RECURSIVE bom AS (
  SELECT component_id, quantity * 50 AS qty
  FROM parts WHERE assembly_id = 'bike'
  UNION ALL
  SELECT p.component_id, p.quantity * b.qty
  FROM parts p JOIN bom b ON p.assembly_id = b.component_id
) CYCLE component_id SET is_cycle USING path
SELECT component_id, sum(qty) AS total
FROM bom WHERE NOT is_cycle
GROUP BY component_id;`,
    outcome: 'One round trip whatever the depth, and a cyclic definition terminates with `is_cycle = true` rows that a check can alert on. Add an index on `parts(assembly_id)`: the recursive term joins the working table to it once per level.',
  },
  pitfalls: [
    { title: 'Infinite recursion on cyclic data',
      symptom: 'A recursive query on a graph never returns and memory or temp files keep growing.',
      cause: 'With UNION ALL, or with a column like depth or path that makes every row unique, the working table never empties.',
      fix: 'Add `CYCLE col SET is_cycle USING path`, or a depth limit in the recursive term (`WHERE depth < 20`). Do not rely on a LIMIT in the outer query: it stops working as soon as the outer query sorts or joins.' },
    { title: 'Relying on breadth-first output order',
      symptom: 'An indented tree prints in the right order in tests and scrambled in production.',
      cause: 'The algorithm happens to emit rows level by level, but that is an implementation detail, not a guarantee, and order within a level is undefined.',
      fix: 'Add `SEARCH DEPTH FIRST BY id SET ord` (or BREADTH FIRST) and `ORDER BY ord` in the outer query.' },
    { title: 'Expecting UNION to stop a loop',
      symptom: 'Switching UNION ALL to UNION did not fix the runaway query.',
      cause: 'UNION only discards rows that are **entirely** duplicates. A hops or path column makes each lap a new row.',
      fix: 'Track visited nodes explicitly with `CYCLE`, or keep the CTE\'s columns to the node key only when that is all you need.' },
    { title: 'Anchor and recursive term with columns in a different order',
      symptom: 'A recursive query returns plausible-looking but wrong rows, or never terminates.',
      cause: 'The two terms are combined like a UNION: columns match by **position**, not by name or alias. If the recursive term lists `(manager_id, id)` while the anchor lists `(id, manager_id)`, the values swap on every pass. When the types agree there is no error.',
      fix: 'Name the CTE columns once (`WITH RECURSIVE sub(id, manager_id) AS …`) and list them in the same order in both terms.',
      sql: `-- swapped: returns (2,1), (2,4), (2,5): Raj three times, nobody below him
WITH RECURSIVE sub(id, boss) AS (
  SELECT id, manager_id FROM employees WHERE id = 2
  UNION
  SELECT e.manager_id, e.id FROM employees e JOIN sub s ON e.manager_id = s.id)
SELECT * FROM sub;` },
  ],
  pointers: [
    'Shape: **non-recursive term** `UNION [ALL]` **recursive term**; only the recursive term may reference the CTE, once.',
    'Each pass reads only the **working table** (last pass\'s new rows); recursion ends when a pass produces nothing.',
    'UNION drops rows that duplicate **any earlier row**; UNION ALL keeps everything.',
    '`CYCLE col SET is_cycle USING path` stops loops; `SEARCH DEPTH|BREADTH FIRST BY col SET ord` gives a sortable order.',
    'Recursive CTEs are always materialized; data-modifying statements cannot be recursive.',
  ],
  sources: ['queries-with.html', 'sql-select.html'],
}
