import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, Caption, ResultTable, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one 13-node org chart stored three ways. Click a node to fetch its subtree.
 *  adjacency: a recursive CTE, one iteration per level (the working table is drawn per step)
 *  ltree:     one materialized path per row, one index range on `path <@ 'ceo.cto'`
 *  closure:   one row per (ancestor, descendant) pair, one index lookup on ancestor
 * The tiles under the tree are the playground's measurements for a 341-node subtree of a 5 461-node tree.
 * ---------------------------------------------------------------------------------------------- */

interface N { id: number; parent: number | null; label: string }
const NODES: N[] = [
  { id: 1, parent: null, label: 'ceo' },
  { id: 2, parent: 1, label: 'cto' }, { id: 3, parent: 1, label: 'cfo' }, { id: 4, parent: 1, label: 'coo' },
  { id: 5, parent: 2, label: 'eng' }, { id: 6, parent: 2, label: 'data' }, { id: 7, parent: 3, label: 'acct' }, { id: 8, parent: 4, label: 'ops' },
  { id: 9, parent: 5, label: 'web' }, { id: 10, parent: 5, label: 'mobile' }, { id: 11, parent: 5, label: 'infra' }, { id: 12, parent: 6, label: 'ml' }, { id: 13, parent: 8, label: 'support' },
]
const byId = (id: number) => NODES.find((n) => n.id === id)!
const kids = (id: number) => NODES.filter((n) => n.parent === id)
const pathOf = (id: number): string => { const n = byId(id); return n.parent ? `${pathOf(n.parent)}.${n.label}` : n.label }
const depthOf = (id: number): number => (byId(id).parent ? depthOf(byId(id).parent!) + 1 : 0)
const subtree = (id: number): number[] => [id, ...kids(id).flatMap((k) => subtree(k.id))]
const ancestors = (id: number): number[] => (byId(id).parent ? [byId(id).parent!, ...ancestors(byId(id).parent!)] : [])

// layout: leaves left to right, parents centred over children
const POS = new Map<number, { x: number; y: number }>()
{
  let leaf = 0
  const place = (id: number) => {
    const ks = kids(id)
    if (!ks.length) { POS.set(id, { x: 46 + leaf++ * 109, y: 20 + depthOf(id) * 62 }); return }
    ks.forEach((k) => place(k.id))
    const xs = ks.map((k) => POS.get(k.id)!.x)
    POS.set(id, { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: 20 + depthOf(id) * 62 })
  }
  place(1)
}

type Model = 'adjacency' | 'ltree' | 'closure'
const LEVEL_TONES: Tone[] = ['accent', 'new', 'ok', 'tuple']

function Tree({ model, root, iter, onPick }: { model: Model; root: number; iter: number; onPick: (id: number) => void }) {
  const sub = new Set(subtree(root))
  const rel = (id: number) => depthOf(id) - depthOf(root)
  const lit = (id: number) => sub.has(id) && (model !== 'adjacency' || rel(id) <= iter)
  return (
    <svg viewBox="0 0 640 230" className="w-full min-w-[520px]" role="img" aria-label="Org chart">
      {NODES.filter((n) => n.parent).map((n) => {
        const a = POS.get(n.parent!)!, b = POS.get(n.id)!
        const on = lit(n.id) && n.id !== root
        return <motion.line key={n.id} x1={a.x} y1={a.y + 12} x2={b.x} y2={b.y - 12} initial={false} animate={{ stroke: on ? tone('accent') : 'var(--line)', strokeWidth: on ? 2 : 1 }} />
      })}
      {NODES.map((n) => {
        const p = POS.get(n.id)!
        const on = lit(n.id)
        const t: Tone = on ? (model === 'adjacency' ? LEVEL_TONES[rel(n.id) % 4] : 'accent') : 'muted'
        return (
          <g key={n.id} onClick={() => onPick(n.id)} style={{ cursor: 'pointer' }} role="button" aria-label={`Fetch the subtree of ${n.label}`}>
            <motion.rect x={p.x - 34} y={p.y - 12} width={68} height={24} rx={6} initial={false}
              animate={{ fill: toneBg(t, on ? 30 : 8) }} stroke={n.id === root ? tone('dead') : tone(t)} strokeWidth={n.id === root ? 2.2 : 1} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--text)">{n.label}</text>
            {model === 'adjacency' && on && <text x={p.x + 30} y={p.y - 14} textAnchor="end" fontSize={9.5} fontFamily="var(--font-mono)" fill={tone(t)}>it {rel(n.id)}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function HierViz() {
  const [model, setModel] = useState<Model>('adjacency')
  const [root, setRoot] = useState(2)
  const [iter, setIter] = useState(0)
  const sub = subtree(root)
  const maxRel = Math.max(...sub.map((id) => depthOf(id) - depthOf(root)))
  const pick = (id: number) => { setRoot(id); setIter(0) }
  const next = () => {
    if (model === 'adjacency') setIter((i) => (i > maxRel ? 0 : i + 1))
    else { const order = [2, 5, 4, 1, 6]; pick(order[(order.indexOf(root) + 1) % order.length]) }
  }
  const working = NODES.filter((n) => sub.includes(n.id) && depthOf(n.id) - depthOf(root) === iter)
  const done = iter > maxRel

  let text: string
  if (model === 'adjacency') {
    text = iter === 0
      ? `Iteration 0 (non-recursive term): \`SELECT … WHERE id = ${root}\` puts **${byId(root).label}** into the working table.`
      : done
        ? `The working table came back **empty**, so recursion stops. ${maxRel + 1} iterations, one index probe per row of each working table, to collect ${sub.length} rows.`
        : `Iteration ${iter}: join the working table to \`staff\` on \`parent_id\`. Found **${working.map((w) => w.label).join(', ')}**: they become the next working table.`
  } else if (model === 'ltree') {
    text = `\`WHERE path <@ '${pathOf(root)}'\`: every descendant's path starts with the root's path, so one **GiST index** scan returns all ${sub.length} rows. No recursion.`
  } else {
    text = `\`WHERE ancestor = ${root}\`: the closure table already stores every (ancestor, descendant) pair, so one **B-tree lookup** returns ${sub.length} rows with their depth.`
  }

  const rows = model === 'adjacency'
    ? NODES.map((n) => ({ key: `a${n.id}`, cells: [n.id, n.parent, n.label], t: sub.includes(n.id) && depthOf(n.id) - depthOf(root) === iter ? LEVEL_TONES[iter % 4] : undefined, dim: !sub.includes(n.id) }))
    : model === 'ltree'
      ? NODES.map((n) => ({ key: `l${n.id}`, cells: [n.id, pathOf(n.id)], t: sub.includes(n.id) ? ('accent' as Tone) : undefined, dim: !sub.includes(n.id) }))
      : sub.map((d) => ({ key: `c${d}`, cells: [root, d, byId(d).label, depthOf(d) - depthOf(root)], t: 'accent' as Tone }))
  const closureTotal = NODES.reduce((s, n) => s + depthOf(n.id) + 1, 0)

  // moving the selected subtree under a different top-level manager
  const target = ancestors(root).includes(4) || root === 4 || root === 1 ? 3 : 4
  const oldAnc = ancestors(root).length, newAnc = ancestors(target).length + 1
  const moveCost = { adjacency: 1, ltree: sub.length, closure: oldAnc * sub.length + newAnc * sub.length }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Storage model" value={model} onChange={(m) => { setModel(m); setIter(0) }} options={[['adjacency', 'Adjacency list'], ['ltree', 'ltree path'], ['closure', 'Closure table']]} />
        <Btn primary testid="viz-next" onClick={next}>{model === 'adjacency' ? (done ? 'Restart' : 'Next iteration') : 'Next subtree'}</Btn>
        <span className="text-xs text-muted">or click any node</span>
      </div>
      <Caption k={`${model}-${root}-${iter}`} text={text} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin"><Tree model={model} root={root} iter={iter} onPick={pick} /></div>
      <Legend items={model === 'adjacency'
        ? [['dead', 'subtree root'], ['accent', 'iteration 0'], ['new', 'iteration 1'], ['ok', 'iteration 2'], ['tuple', 'iteration 3']]
        : [['dead', 'subtree root'], ['accent', 'returned by one index scan'], ['muted', 'not in the subtree']]} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1fr]">
        <ResultTable compact caption={model === 'adjacency' ? 'staff (id, parent_id): the working table is coloured' : model === 'ltree' ? 'staff_path (id, path)' : `staff_closure WHERE ancestor = ${root} (${sub.length} of ${closureTotal} rows)`}
          fields={model === 'adjacency' ? ['id', 'parent_id', 'name'] : model === 'ltree' ? ['id', 'path'] : ['ancestor', 'descendant', 'name', 'depth']} rows={rows} />
        <Panel title={root === 1 ? 'Moving a subtree' : `Move ${byId(root).label} under ${byId(target).label}: rows written`}>
          {root === 1 ? <p className="text-xs text-muted">The root has no parent to change. Pick another node to compare the cost of moving its subtree.</p> : <div className="grid gap-1.5 text-xs">
            {(['adjacency', 'ltree', 'closure'] as Model[]).map((m) => (
              <div key={m} className="flex items-center gap-2">
                <span className="w-20 font-mono text-muted">{m}</span>
                <motion.div initial={false} animate={{ width: `${Math.min(100, (moveCost[m] / 40) * 100)}%` }} className="h-3 rounded-sm" style={{ background: toneBg(m === model ? 'accent' : 'muted', 55), minWidth: 4 }} />
                <span className="font-mono tabular-nums">{moveCost[m]}</span>
              </div>
            ))}
            <p className="mt-1 text-muted">Adjacency: update one <code className="inline-code">parent_id</code>. ltree: rewrite every path in the subtree. Closure: delete the {oldAnc} old ancestors × {sub.length} rows, insert {newAnc} new ancestors × {sub.length}.</p>
          </div>}
        </Panel>
      </div>
      <Panel title="Measured: subtree of 341 nodes in a 5 461-node tree (playground)">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Stat label="Adjacency + recursive CTE" value="772 buffers" sub="5 iterations, 341 index searches" t={model === 'adjacency' ? 'accent' : undefined} />
          <Stat label="ltree + GiST" value="16 buffers" sub="1 bitmap index scan" t={model === 'ltree' ? 'accent' : undefined} />
          <Stat label="Closure table" value="10 buffers" sub="1 index scan; 36 409 rows stored" t={model === 'closure' ? 'accent' : undefined} />
        </div>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'hierarchies',
  module: 'f4',
  order: 5,
  title: 'Trees and graphs',
  tldr: [
    'A tree can be stored as an **adjacency list** (each row points to its parent), a **materialized path** (`ltree`: each row stores its whole path) or a **closure table** (one row per ancestor and descendant pair).',
    'They trade read cost against write cost: the adjacency list is trivial to change but needs a recursive query that takes one step per level, while paths and closure rows answer "the whole subtree" with one index scan and must be rewritten when a subtree moves.',
  ],
  visualizer: {
    title: 'One org chart, three storage models',
    caption: 'Click any node to fetch its subtree. In **Adjacency list** press Next iteration to watch the recursive CTE descend one level at a time. Switch models to compare one index scan, and the rows each model must rewrite to move the subtree.',
    Component: HierViz,
  },
  playground: {
    extensions: ['ltree'],
    setup: `
-- a 4-ary org tree, 7 levels, 5 461 people
CREATE TABLE staff (id int PRIMARY KEY, parent_id int REFERENCES staff, name text NOT NULL);
INSERT INTO staff
SELECT g, CASE WHEN g = 1 THEN NULL ELSE (g - 2) / 4 + 1 END, 'n' || g
FROM generate_series(1, 5461) g;
CREATE INDEX staff_parent ON staff (parent_id);
-- materialized paths (ltree)
CREATE TABLE staff_path AS
WITH RECURSIVE t AS (
  SELECT id, text2ltree('n1') AS path FROM staff WHERE id = 1
  UNION ALL
  SELECT s.id, t.path || ('n' || s.id) FROM staff s JOIN t ON s.parent_id = t.id)
SELECT * FROM t;
ALTER TABLE staff_path ADD PRIMARY KEY (id);
CREATE INDEX staff_path_gist ON staff_path USING gist (path);
-- closure table: every (ancestor, descendant) pair, including (x, x)
CREATE TABLE staff_closure AS
WITH RECURSIVE c AS (
  SELECT id AS ancestor, id AS descendant, 0 AS depth FROM staff
  UNION ALL
  SELECT c.ancestor, s.id, c.depth + 1 FROM c JOIN staff s ON s.parent_id = c.descendant)
SELECT * FROM c;
ALTER TABLE staff_closure ADD PRIMARY KEY (ancestor, descendant);
CREATE INDEX ON staff_closure (descendant);
ANALYZE;`,
    presets: [
      { label: '1. Subtree with a recursive CTE', sql: `WITH RECURSIVE sub AS (
  SELECT id, parent_id, name, 0 AS depth FROM staff WHERE id = 6
  UNION ALL
  SELECT s.id, s.parent_id, s.name, sub.depth + 1
  FROM staff s JOIN sub ON s.parent_id = sub.id)
SEARCH DEPTH FIRST BY id SET ord
SELECT repeat('  ', depth) || name AS tree, depth
FROM sub ORDER BY ord LIMIT 12;

WITH RECURSIVE sub AS (
  SELECT id, 0 AS depth FROM staff WHERE id = 6
  UNION ALL
  SELECT s.id, sub.depth + 1 FROM staff s JOIN sub ON s.parent_id = sub.id)
SELECT depth, count(*) FROM sub GROUP BY depth ORDER BY depth;`,
        note: '`SEARCH DEPTH FIRST` adds an ordering column so the output reads like an outline. The second query shows the levels: 1, 4, 16, 64, 256 = 341 people under n6.' },
      { label: '2. What the recursion costs', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
WITH RECURSIVE sub AS (
  SELECT id FROM staff WHERE id = 6
  UNION ALL
  SELECT s.id FROM staff s JOIN sub ON s.parent_id = sub.id)
SELECT count(*) FROM sub;`,
        note: 'A **Recursive Union** over a **WorkTable Scan**: the join runs `loops=5` (one per level) and probes `staff_parent` once per row, `Index Searches: 341`, about 770 buffers in total. Without the `parent_id` index every level would be a full scan.' },
      { label: '3. Subtree with ltree', sql: `SELECT path FROM staff_path WHERE id = 6;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM staff_path WHERE path <@ 'n1.n2.n6';

SELECT path, nlevel(path) AS level
FROM staff_path WHERE path <@ 'n1.n2.n6' ORDER BY path LIMIT 6;`,
        note: '`<@` means "is a descendant of (or equal to)". One **Bitmap Index Scan** on the GiST index returns all 341 rows for about 16 buffers. ltree comparison sorts in tree order, so `ORDER BY path` is depth-first.' },
      { label: '4. Ancestors and patterns (ltree)', sql: `-- the chain of command above n1000
SELECT p.path
FROM staff_path p, staff_path me
WHERE me.id = 1000 AND p.path @> me.path
ORDER BY nlevel(p.path);

-- direct reports only: exactly one label below n6
SELECT path FROM staff_path WHERE path ~ '*.n6.*{1}';

-- how deep is the tree, and how many people per level?
SELECT nlevel(path) AS level, count(*) FROM staff_path GROUP BY 1 ORDER BY 1;`,
        note: '`@>` finds ancestors, `~` matches an **lquery** pattern (`*{1}` = exactly one more label). Seven levels from 1 person to 4 096.' },
      { label: '5. Closure table reads', sql: `SELECT count(*) AS pairs, count(DISTINCT descendant) AS people FROM staff_closure;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM staff_closure WHERE ancestor = 6;

-- ancestors of n1000, nearest first
SELECT ancestor, depth FROM staff_closure WHERE descendant = 1000 ORDER BY depth;`,
        note: '36 409 pairs for 5 461 people: about 6.7 rows per person, growing with depth. Both directions are one B-tree lookup (about 10 buffers), and `depth` comes for free.' },
      { label: '6. Graphs: stop cycles with CYCLE', sql: `CREATE TEMP TABLE links (src text, dst text);
INSERT INTO links VALUES ('a','b'), ('b','c'), ('c','a'), ('c','d');

WITH RECURSIVE walk AS (
  SELECT src, dst, 1 AS hops FROM links WHERE src = 'a'
  UNION ALL
  SELECT l.src, l.dst, w.hops + 1 FROM links l JOIN walk w ON l.src = w.dst)
CYCLE dst SET is_cycle USING path
SELECT dst, hops, is_cycle, path FROM walk ORDER BY hops;`,
        note: '`a → b → c → a` is a loop. The **CYCLE** clause tracks visited `dst` values in `path` and marks the row that revisits one with `is_cycle = true`, so recursion stops instead of running forever.' },
      { label: '7. Move a subtree in each model', sql: `-- move n6 (341 people) from n2 to n3
UPDATE staff SET parent_id = 3 WHERE id = 6;

UPDATE staff_path
SET path = 'n1.n3' || subpath(path, nlevel('n1.n2'))
WHERE path <@ 'n1.n2.n6';

DELETE FROM staff_closure
WHERE descendant IN (SELECT descendant FROM staff_closure WHERE ancestor = 6)
  AND ancestor IN (SELECT ancestor FROM staff_closure WHERE descendant = 6 AND ancestor <> 6);
INSERT INTO staff_closure (ancestor, descendant, depth)
SELECT a.ancestor, d.descendant, a.depth + d.depth + 1
FROM staff_closure a, staff_closure d
WHERE a.descendant = 3 AND d.ancestor = 6;

SELECT path FROM staff_path WHERE id = 6;`,
        note: 'Watch the row counts: `UPDATE 1` for the adjacency list, `UPDATE 341` for paths, and `DELETE 682` plus `INSERT 682` (2 ancestors × 341) for the closure table.' },
    ],
  },
  production: {
    title: 'A product catalogue with deep category trees',
    context: 'An e-commerce site stores 40 000 categories as `parent_id` rows. Every listing page needs "all products in this category and its subcategories" and a breadcrumb.',
    problem: 'Each request ran a recursive CTE to collect descendant categories, then joined products. Top-level pages walked thousands of categories level by level, and the breadcrumb needed a second recursive query, together the slowest queries on the site.',
    solution: 'Keep `parent_id` as the source of truth (cheap to edit) and add a materialized **ltree path** maintained by a trigger, indexed with GiST. Subtree and breadcrumb queries become single index scans. Category moves are rare and rewrite one subtree in a transaction.',
    sql: `ALTER TABLE categories ADD COLUMN path ltree;
CREATE INDEX categories_path_gist ON categories USING gist (path);

-- everything under "Home > Garden"
SELECT p.* FROM products p
JOIN categories c ON c.id = p.category_id
WHERE c.path <@ 'home.garden';

-- breadcrumb for one category
SELECT name FROM categories
WHERE path @> (SELECT path FROM categories WHERE id = $1)
ORDER BY nlevel(path);`,
    outcome: 'On the playground tree the subtree read drops from about 770 buffers and 341 index probes to about 16 buffers in one scan. The cost moves to writes: a move rewrites every path in the moved subtree, which is acceptable for data that changes a few times a day.',
  },
  pitfalls: [
    { title: 'No index on parent_id',
      symptom: 'Recursive queries get slower with table size, not with subtree size.',
      cause: 'Each iteration joins the working table to the whole table on `parent_id`. Without an index every level is a full scan.',
      fix: '`CREATE INDEX ON staff (parent_id);` Foreign keys do not create this index for you.' },
    { title: 'Cycles in graph data',
      symptom: 'A recursive query never finishes, or fails when it runs out of memory or disk.',
      cause: 'A recursive CTE stops only when an iteration returns no rows. A loop in the data keeps producing rows forever, and `UNION` only helps if whole rows repeat.',
      fix: 'Add `CYCLE id SET is_cycle USING path`, or carry an array of visited ids and stop on `id = ANY(path)`. Add a depth limit as a safety net.' },
    { title: 'Paths and closure rows drift from the truth',
      symptom: 'A node appears under two parents, or a subtree query misses nodes after a move.',
      cause: 'Paths and closure tables are derived data. A move that updates `parent_id` but not the derived rows leaves them inconsistent.',
      fix: 'Change the parent and the derived rows in **one transaction**, ideally inside a trigger or a single function, and add a periodic consistency check.' },
    { title: 'ltree label rules',
      symptom: '`ERROR: ltree syntax error` when building paths from names.',
      cause: 'Labels may contain only letters, digits, underscores and hyphens, and each label is limited to 1 000 characters.',
      fix: 'Build paths from ids or slugs (`n42`, `garden_tools`), never from free-text names.' },
  ],
  pointers: [
    '**Adjacency list**: one `parent_id` column, cheap writes, a recursive CTE per read (index `parent_id`).',
    '**ltree**: `path <@ x` = subtree, `path @> x` = ancestors, GiST index, rewrite the subtree on a move.',
    '**Closure table**: every ancestor/descendant pair with depth, B-tree lookups both ways, the most rows and the costliest moves. **Nested sets** (a left and a right number per row, subtree = `lft BETWEEN x AND y`) read as fast, but one insert renumbers about half the table.',
    'For graphs with loops use the **CYCLE** clause, and `SEARCH DEPTH FIRST` for outline order.',
    '**Going deeper:** [Recursive CTEs](/m3/recursive-ctes) shows the working table and termination rules step by step.',
  ],
  sources: ['queries-with.html', 'ltree.html', 'indexes-types.html', 'gist.html', 'sql-select.html'],
}
