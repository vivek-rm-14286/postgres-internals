import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Btn, Msg, Tiles } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the same 40 points indexed two ways.
 *  - GiST (R-tree over points): balanced; each node stores the bounding box ("union") of its
 *    children; insertion follows the least area enlargement ("penalty"); overflow is split with a
 *    quadratic "picksplit". Boxes may overlap.
 *  - SP-GiST (quad_point_ops): unbalanced; each inner tuple has a centre point (its prefix) and
 *    exactly four quadrant nodes. Regions never overlap.
 * K-nearest-neighbour search is the same best-first algorithm on both: a priority queue ordered by
 * a lower-bound distance (box or quadrant) or the exact distance (point), as GiST's `distance`
 * support function provides. Demo pages hold 4 entries.
 * ---------------------------------------------------------------------------------------------- */

interface Pt { id: number; x: number; y: number }
interface Box { x0: number; y0: number; x1: number; y1: number }
interface GNode { id: string; box: Box; kids: GNode[]; pts: Pt[]; leaf: boolean; center?: Pt }

const M = 4
function rng(seed: number) { return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) }
const r = rng(11)
// clustered "shops": three dense districts plus scattered points
const PTS: Pt[] = Array.from({ length: 40 }, (_, i) => {
  const c = [[24, 28], [70, 34], [46, 74]][i % 3]
  const spread = i % 5 === 4 ? 46 : 13
  const clamp = (v: number) => Math.max(3, Math.min(97, v))
  return { id: i + 1, x: Math.round(clamp(c[0] + (r() - 0.5) * 2 * spread)), y: Math.round(clamp(c[1] + (r() - 0.5) * 2 * spread)) }
})

const area = (b: Box) => (b.x1 - b.x0) * (b.y1 - b.y0)
const union = (a: Box, b: Box): Box => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) })
const ptBox = (p: Pt): Box => ({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
const boxOf = (n: GNode) => (n.leaf ? n.pts.map(ptBox) : n.kids.map((k) => k.box)).reduce(union)
const minDist = (b: Box, q: Pt) => Math.hypot(Math.max(b.x0 - q.x, 0, q.x - b.x1), Math.max(b.y0 - q.y, 0, q.y - b.y1))

/* ---- GiST: Guttman R-tree with quadratic split ---- */
let gid = 0
function quadSplit<T>(items: T[], bx: (t: T) => Box): [T[], T[]] {
  let best = [0, 1], worst = -Infinity
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const d = area(union(bx(items[i]), bx(items[j]))) - area(bx(items[i])) - area(bx(items[j]))
    if (d > worst) { worst = d; best = [i, j] }
  }
  const A = [items[best[0]]], B = [items[best[1]]]
  let ba = bx(A[0]), bb = bx(B[0])
  items.forEach((it, i) => {
    if (i === best[0] || i === best[1]) return
    const ea = area(union(ba, bx(it))) - area(ba), eb = area(union(bb, bx(it))) - area(bb)
    if ((ea < eb && A.length < items.length - 2) || B.length >= items.length - 2) { A.push(it); ba = union(ba, bx(it)) } else { B.push(it); bb = union(bb, bx(it)) }
  })
  return [A, B]
}
function gistInsert(n: GNode, p: Pt): GNode[] {
  if (n.leaf) {
    n.pts.push(p)
    if (n.pts.length <= M) { n.box = boxOf(n); return [n] }
    const [a, b] = quadSplit(n.pts, ptBox)
    return [a, b].map((pts) => { const k: GNode = { id: `g${gid++}`, leaf: true, pts, kids: [], box: ptBox(pts[0]) }; k.box = boxOf(k); return k })
  }
  // penalty: least area enlargement, ties broken by smaller area
  const pick = n.kids.reduce((bst, k) => {
    const e = area(union(k.box, ptBox(p))) - area(k.box), be = area(union(bst.box, ptBox(p))) - area(bst.box)
    return e < be || (e === be && area(k.box) < area(bst.box)) ? k : bst
  })
  const res = gistInsert(pick, p)
  n.kids.splice(n.kids.indexOf(pick), 1, ...res)
  if (n.kids.length <= M) { n.box = boxOf(n); return [n] }
  const [a, b] = quadSplit(n.kids, (k) => k.box)
  return [a, b].map((kids) => { const k: GNode = { id: `g${gid++}`, leaf: false, pts: [], kids, box: kids[0].box }; k.box = boxOf(k); return k })
}
function buildGist(pts: Pt[]): GNode {
  gid = 0
  let root: GNode = { id: `g${gid++}`, leaf: true, pts: [], kids: [], box: ptBox(pts[0]) }
  for (const p of pts) {
    const res = gistInsert(root, p)
    if (res.length > 1) { root = { id: `g${gid++}`, leaf: false, pts: [], kids: res, box: res[0].box }; root.box = boxOf(root) }
  }
  return root
}

/* ---- SP-GiST: point quad-tree, centre = median of the points being split ---- */
let sid = 0
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
function quadOf(c: Pt, p: Pt) { return (p.x >= c.x ? 1 : 0) + (p.y >= c.y ? 2 : 0) }
function splitQuad(n: GNode) {
  const c = { id: 0, x: median(n.pts.map((p) => p.x)), y: median(n.pts.map((p) => p.y)) }
  n.center = c
  const b = n.box
  const boxes: Box[] = [{ x0: b.x0, y0: b.y0, x1: c.x, y1: c.y }, { x0: c.x, y0: b.y0, x1: b.x1, y1: c.y }, { x0: b.x0, y0: c.y, x1: c.x, y1: b.y1 }, { x0: c.x, y0: c.y, x1: b.x1, y1: b.y1 }]
  n.kids = boxes.map((bx) => ({ id: `s${sid++}`, leaf: true, pts: [], kids: [], box: bx }))
  for (const p of n.pts) n.kids[quadOf(c, p)].pts.push(p)
  n.pts = []; n.leaf = false
  n.kids.forEach((k) => { if (k.pts.length > M && new Set(k.pts.map((p) => `${p.x},${p.y}`)).size > 1) splitQuad(k) })
}
function spInsert(n: GNode, p: Pt) {
  if (!n.leaf) return spInsert(n.kids[quadOf(n.center!, p)], p)
  n.pts.push(p)
  if (n.pts.length > M) splitQuad(n)
}
function buildSp(pts: Pt[]): GNode {
  sid = 0
  const root: GNode = { id: `s${sid++}`, leaf: true, pts: [], kids: [], box: { x0: 0, y0: 0, x1: 100, y1: 100 } }
  pts.forEach((p) => spInsert(root, p))
  return root
}

function walk(n: GNode, depth = 0, out: { n: GNode; depth: number }[] = []) {
  out.push({ n, depth }); n.kids.forEach((k) => walk(k, depth + 1, out)); return out
}

/* ---- best-first KNN ---- */
type QItem = { kind: 'node'; n: GNode; d: number } | { kind: 'pt'; p: Pt; d: number }
interface KStep { queue: QItem[]; popped?: QItem; results: Pt[]; visited: Set<string>; checked: number }
function knn(root: GNode, q: Pt, k: number, mode: 'gist' | 'sp'): KStep[] {
  const steps: KStep[] = []
  const lb = (n: GNode) => minDist(mode === 'gist' ? n.box : n.box, q)
  let queue: QItem[] = [{ kind: 'node', n: root, d: lb(root) }]
  const results: Pt[] = [], visited = new Set<string>()
  let checked = 0
  steps.push({ queue: [...queue], results: [], visited: new Set(), checked })
  while (queue.length && results.length < k && steps.length < 60) {
    queue.sort((a, b) => a.d - b.d)
    const top = queue.shift()!
    if (top.kind === 'pt') results.push(top.p)
    else {
      visited.add(top.n.id)
      if (top.n.leaf) { top.n.pts.forEach((p) => queue.push({ kind: 'pt', p, d: Math.hypot(p.x - q.x, p.y - q.y) })); checked += top.n.pts.length }
      else top.n.kids.forEach((c) => { if (c.leaf && !c.pts.length) return; queue.push({ kind: 'node', n: c, d: lb(c) }) })
    }
    queue.sort((a, b) => a.d - b.d)
    steps.push({ queue: [...queue], popped: top, results: [...results], visited: new Set(visited), checked })
  }
  return steps
}

const S = 4.2 // px per unit
function Plot({ root, mode, q, step, onPick }: { root: GNode; mode: 'gist' | 'sp'; q: Pt; step: KStep; onPick: (p: Pt) => void }) {
  const nodes = walk(root)
  const maxDepth = Math.max(...nodes.map((x) => x.depth))
  const queued = new Set(step.queue.filter((i) => i.kind === 'node').map((i) => (i as { n: GNode }).n.id))
  const popped = step.popped?.kind === 'node' ? step.popped.n.id : null
  const res = new Set(step.results.map((p) => p.id))
  const radius = step.results.length ? Math.hypot(step.results[step.results.length - 1].x - q.x, step.results[step.results.length - 1].y - q.y) : 0
  return (
    <svg viewBox={`-6 -6 ${100 * S + 12} ${100 * S + 12}`} className="w-full min-w-[360px] max-w-[460px] cursor-crosshair" role="img" aria-label="Points and index regions; click to move the query point"
      onClick={(e) => {
        const svg = e.currentTarget, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
        const m = pt.matrixTransform(svg.getScreenCTM()!.inverse())
        onPick({ id: 0, x: Math.round(Math.max(0, Math.min(100, m.x / S))), y: Math.round(Math.max(0, Math.min(100, m.y / S))) })
      }}>
      <rect x={0} y={0} width={100 * S} height={100 * S} fill="var(--surface)" stroke="var(--border)" />
      {nodes.filter(({ n }) => n !== root || mode === 'gist').map(({ n, depth }) => {
        const vis = step.visited.has(n.id), isPop = popped === n.id, inQ = queued.has(n.id)
        const t = isPop ? 'new' : vis ? 'muted' : inQ ? 'pointer' : n.leaf ? 'tuple' : 'header'
        if (mode === 'sp' && !n.leaf) return null
        return (
          <motion.rect key={n.id} initial={false} animate={{ x: n.box.x0 * S - (mode === 'gist' ? (maxDepth - depth) * 2.5 : 0), y: n.box.y0 * S - (mode === 'gist' ? (maxDepth - depth) * 2.5 : 0),
            width: Math.max(4, (n.box.x1 - n.box.x0) * S + (mode === 'gist' ? (maxDepth - depth) * 5 : 0)), height: Math.max(4, (n.box.y1 - n.box.y0) * S + (mode === 'gist' ? (maxDepth - depth) * 5 : 0)) }}
            rx={mode === 'gist' ? 4 : 0} fill={toneBg(t, isPop ? 26 : vis ? 12 : mode === 'sp' ? 4 : 6)} stroke={tone(t)} strokeWidth={isPop ? 2.4 : n.leaf ? 1 : 1.6} strokeDasharray={n.leaf ? undefined : '5 3'} />
        )
      })}
      {mode === 'sp' && nodes.filter(({ n }) => !n.leaf).map(({ n }) => (
        <g key={`c${n.id}`}>
          <line x1={n.box.x0 * S} x2={n.box.x1 * S} y1={n.center!.y * S} y2={n.center!.y * S} stroke={tone(step.visited.has(n.id) ? 'new' : 'header')} strokeWidth={step.visited.has(n.id) ? 2 : 1.2} />
          <line x1={n.center!.x * S} x2={n.center!.x * S} y1={n.box.y0 * S} y2={n.box.y1 * S} stroke={tone(step.visited.has(n.id) ? 'new' : 'header')} strokeWidth={step.visited.has(n.id) ? 2 : 1.2} />
          <circle cx={n.center!.x * S} cy={n.center!.y * S} r={3} fill={tone('header')} />
        </g>
      ))}
      {radius > 0 && <motion.circle initial={false} animate={{ r: radius * S }} cx={q.x * S} cy={q.y * S} fill="none" stroke="var(--c-new)" strokeDasharray="4 3" />}
      {PTS.map((p) => (
        <circle key={p.id} cx={p.x * S} cy={p.y * S} r={res.has(p.id) ? 6 : 3.6} fill={res.has(p.id) ? tone('ok') : tone('tuple')} stroke="var(--surface)" strokeWidth={1} />
      ))}
      <motion.g initial={false} animate={{ x: q.x * S, y: q.y * S }}>
        <path d="M-8,0 L8,0 M0,-8 L0,8" stroke="var(--c-dead)" strokeWidth={2.4} />
        <text x={9} y={-7} fontSize={11} fontWeight={700} fill="var(--c-dead)" fontFamily="var(--font-mono)">Q</text>
      </motion.g>
    </svg>
  )
}

function QueueList({ step }: { step: KStep }) {
  return (
    <div className="grid gap-1">
      {step.queue.slice(0, 9).map((it, i) => (
        <motion.div layout key={it.kind === 'pt' ? `p${it.p.id}` : `n${it.n.id}`} className="flex justify-between rounded px-2 py-0.5 font-mono text-[11px]"
          style={{ background: toneBg(it.kind === 'pt' ? 'tuple' : 'pointer', i === 0 ? 30 : 12) }}>
          <span>{it.kind === 'pt' ? `point #${it.p.id}` : `${it.n.leaf ? 'leaf' : 'inner'} node`}</span>
          <span className="tabular-nums">{it.d.toFixed(2)}</span>
        </motion.div>
      ))}
      {step.queue.length > 9 && <p className="text-[11px] text-muted">… {step.queue.length - 9} more</p>}
    </div>
  )
}

function GistViz() {
  const [mode, setMode] = useState<'gist' | 'sp'>('gist')
  const [q, setQ] = useState<Pt>({ id: 0, x: 52, y: 50 })
  const [i, setI] = useState(0)
  const gist = useMemo(() => buildGist(PTS), [])
  const sp = useMemo(() => buildSp(PTS), [])
  const root = mode === 'gist' ? gist : sp
  const steps = useMemo(() => knn(root, q, 3, mode), [root, q, mode])
  const step = steps[Math.min(i, steps.length - 1)]
  const nodes = walk(root)
  const depthOf = (n: GNode): number => (n.leaf ? 1 : 1 + Math.max(...n.kids.map(depthOf)))
  const done = step.results.length >= 3
  const pop = step.popped
  const msg = i === 0
    ? mode === 'gist'
      ? '`ORDER BY loc <-> Q LIMIT 3` starts with the root in a **priority queue**. Each GiST entry is a bounding box: the union of everything below it. Boxes can overlap.'
      : 'SP-GiST splits space at a **centre point** into four quadrants, again and again where points are dense. Regions never overlap, and the tree is not balanced.'
    : done
      ? `Done after ${i} steps: 3 neighbours found while visiting ${step.visited.size} of ${nodes.length} index nodes and computing ${step.checked} point distances. Everything still queued is provably farther away.`
      : pop?.kind === 'pt'
        ? `The closest queue entry is a **point** (exact distance ${pop.d.toFixed(2)}). No box or quadrant left in the queue can contain anything closer, so it is returned as result #${step.results.length}.`
        : `Pop the entry with the smallest **lower-bound distance** (${pop?.d.toFixed(2)}): the shortest distance from Q to its ${mode === 'gist' ? 'box' : 'quadrant'}. Its children go into the queue with their own distances.`
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Index" value={mode} onChange={(m) => { setMode(m); setI(0) }} options={[['gist', 'GiST: R-tree of boxes'], ['sp', 'SP-GiST: quad-tree']]} />
        <Btn primary testid="viz-next" onClick={() => setI((x) => Math.min(steps.length - 1, x + 1))} disabled={i >= steps.length - 1}>Next KNN step</Btn>
        <Btn onClick={() => setI(0)}>Restart search</Btn>
        <span className="text-xs text-muted">Click the plot to move Q.</span>
      </div>
      <Tiles items={[['Tree height', depthOf(root)], ['Index nodes', nodes.length], ['Nodes visited', step.visited.size, 'new'], ['Point distances computed', `${step.checked} / ${PTS.length}`]]} />
      <Msg k={`${mode}-${i}-${q.x}-${q.y}`} text={msg} />
      <Legend items={[['header', 'inner node / centre split'], ['tuple', 'leaf page / point'], ['pointer', 'in the queue'], ['new', 'popped now'], ['muted', 'already visited'], ['ok', 'result']]} />
      <div className="grid gap-3 md:grid-cols-[minmax(0,460px)_1fr]">
        <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
          <Plot root={root} mode={mode} q={q} step={step} onPick={(p) => { setQ(p); setI(0) }} />
        </div>
        <div className="grid content-start gap-3">
          <Panel title="Priority queue (distance to Q)"><QueueList step={step} /></Panel>
          <Panel title="Results">
            <ol className="grid gap-0.5 font-mono text-[11.5px]">
              {step.results.map((p, k) => <li key={p.id}>{k + 1}. point #{p.id} ({p.x}, {p.y}) · {Math.hypot(p.x - q.x, p.y - q.y).toFixed(2)}</li>)}
              {!step.results.length && <li className="text-muted">none yet</li>}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE shops (id int PRIMARY KEY, name text, loc point);
INSERT INTO shops
SELECT g, 'shop ' || g,
       point((abs(hashint4(g)) % 10000) / 100.0, (abs(hashint4(g + 777777)) % 10000) / 100.0)
FROM generate_series(1, 50000) g;
CREATE INDEX shops_gist ON shops USING gist (loc);
ANALYZE shops;`

export const lesson: Lesson = {
  slug: 'gist-spgist',
  module: 'm4',
  order: 7,
  title: 'GiST and SP-GiST',
  tldr: [
    '**GiST** is a balanced tree whose entries are predicates such as bounding boxes, and **SP-GiST** is an unbalanced tree that splits space into non-overlapping parts such as quadrants, k-d halves or string prefixes.',
    'Both are frameworks where an operator class supplies the geometry, so one access method can serve overlap, containment, range, nearest-neighbour `<->` and exclusion-constraint queries that a B-tree cannot express.',
  ],
  visualizer: {
    title: 'Nearest-neighbour search, box by box',
    caption: 'Step a 3-nearest-neighbour search through a GiST R-tree, then through an SP-GiST quad-tree over the same points. Click anywhere to move the query point and compare how many nodes each visits.',
    Component: GistViz,
  },
  playground: {
    extensions: ['btree_gist'],
    setup: SETUP,
    presets: [
      { label: 'KNN with GiST', sql: `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id, loc <-> point '(50,50)' AS dist
FROM shops ORDER BY loc <-> point '(50,50)' LIMIT 5;`,
        note: '`Order By: (loc <-> …)` inside the Index Scan: the index returns rows nearest-first, so 5 neighbours out of 50000 cost about **8 buffers**, with no sort.' },
      { label: 'Box containment', sql: `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT count(*) FROM shops WHERE loc <@ box '((40,40),(45,45))';`,
        note: 'The `consistent` function prunes every subtree whose bounding box cannot intersect the query box. The bitmap scan reads only a handful of index pages.' },
      { label: 'SP-GiST quad-tree', sql: `CREATE INDEX shops_spg ON shops USING spgist (loc);
DROP INDEX shops_gist;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM shops ORDER BY loc <-> point '(50,50)' LIMIT 5;
SELECT pg_size_pretty(pg_relation_size('shops_spg')) AS spgist_size;`,
        note: '`quad_point_ops` is the default SP-GiST opclass for `point`. Same KNN plan shape; here it reads about 14 buffers, and the index is smaller (about 2.3 MB vs 3.3 MB for GiST).' },
      { label: 'Exclusion constraint', sql: `CREATE TABLE bookings (
  room int,
  during tstzrange,
  EXCLUDE USING gist (room WITH =, during WITH &&)
);
INSERT INTO bookings VALUES (101, '[2026-03-01 10:00, 2026-03-01 11:00)');
INSERT INTO bookings VALUES (102, '[2026-03-01 10:30, 2026-03-01 12:00)');
INSERT INTO bookings VALUES (101, '[2026-03-01 11:00, 2026-03-01 12:00)');
SELECT * FROM bookings ORDER BY room, during;`,
        note: 'No two rows may have equal `room` **and** overlapping `during`. `btree_gist` supplies GiST support for `=` on int. Back-to-back bookings are fine because `[)` ranges do not overlap. Try inserting 101 at 10:30 to see the conflict error.' },
      { label: 'Temporal primary key (18)', sql: `CREATE TABLE prices (
  product_id int NOT NULL,
  valid tstzrange NOT NULL,
  price numeric(10,2) NOT NULL,
  PRIMARY KEY (product_id, valid WITHOUT OVERLAPS)
);
INSERT INTO prices VALUES
  (1, tstzrange('2025-01-01', '2025-07-01'), 29.99),
  (1, tstzrange('2025-07-01', NULL), 34.99),
  (2, tstzrange('2025-01-01', NULL), 49.99);
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'prices';
SELECT price FROM prices WHERE product_id = 1 AND valid @> timestamptz '2025-08-15';`,
        note: 'PostgreSQL 18 `WITHOUT OVERLAPS` turns the primary key into "no two rows for the same product whose periods overlap". The backing index is a **GiST** index (`USING gist (product_id, valid)`), the same machinery as an exclusion constraint. Try `INSERT INTO prices VALUES (1, tstzrange(\'2025-06-01\', \'2025-09-01\'), 31);`: it fails with SQLSTATE **23P01**, an exclusion violation, not 23505.' },
      { label: 'Operator classes', sql: `SELECT am.amname, opc.opcname, opc.opcdefault
FROM pg_opclass opc JOIN pg_am am ON am.oid = opc.opcmethod
WHERE opc.opcintype = 'point'::regtype
ORDER BY 1, 2;`,
        note: 'For `point`: GiST `point_ops`, SP-GiST `quad_point_ops` (default) and `kd_point_ops`. Choosing an opclass chooses the tree shape.' },
    ],
  },
  production: {
    title: 'Double-booked meeting rooms',
    context: 'A workplace app stores room reservations as `(room_id, starts_at, ends_at)`. It checked for overlaps in application code before inserting.',
    problem: 'Two users clicking "book" at the same moment both passed the check, because neither saw the other\'s uncommitted row. The result was a few double bookings every week and support tickets to fix them by hand.',
    solution: 'Move the rule into the database with an **exclusion constraint**. A GiST index on `(room_id, tstzrange)` lets PostgreSQL find any conflicting row atomically at insert time, including rows from concurrent uncommitted transactions (the second inserter waits, then fails).',
    sql: `CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE reservations
  ADD COLUMN during tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED,
  ADD CONSTRAINT no_double_booking EXCLUDE USING gist (room_id WITH =, during WITH &&);`,
    outcome: 'Overlapping inserts now fail with SQLSTATE `23P01` (exclusion_violation), which the app turns into a "slot just taken" message. The same index also speeds up "what is booked in this room this week" queries.',
  },
  pitfalls: [
    { title: 'Ordering by distance without the index operator',
      symptom: '`ORDER BY ST_Distance(…)` or `ORDER BY point_distance(a, b) LIMIT 10` sorts the whole table.',
      cause: 'Only an **ordering operator** of the opclass (`<->`) can be pushed into a GiST or SP-GiST scan. A function call is just an expression to evaluate per row.',
      fix: 'Write `ORDER BY loc <-> $1 LIMIT k` so EXPLAIN shows `Order By:` inside the index scan.' },
    { title: 'Missing btree_gist for mixed exclusion constraints',
      symptom: '`EXCLUDE USING gist (room WITH =, during WITH &&)` fails with "data type integer has no default operator class for access method \"gist\"".',
      cause: 'Core GiST has no opclass for scalar equality on int, text or uuid.',
      fix: '`CREATE EXTENSION btree_gist;` then create the constraint.' },
    { title: 'Catching 23505 for a temporal or exclusion key',
      symptom: 'Application code that turns duplicate keys into a friendly "already booked" message lets overlap errors through as 500s after a table moves to `WITHOUT OVERLAPS` or an EXCLUDE constraint.',
      cause: 'These constraints are enforced by a GiST index with exclusion semantics. A conflict raises `exclusion_violation`, SQLSTATE **23P01**, not `unique_violation` (23505), even when it is declared as a PRIMARY KEY.',
      fix: 'Handle both codes. In PL/pgSQL, catch `exclusion_violation` alongside `unique_violation`. Temporal keys also reject empty ranges, so validate input ranges before inserting.' },
    { title: 'Assuming GiST behaves like a B-tree',
      symptom: 'A GiST index on a column with few distinct values or heavy overlap is slow even for selective queries.',
      cause: 'GiST boxes can **overlap**, so a search may descend several subtrees. Index quality depends on the opclass\'s `penalty` and `picksplit`, and large unsorted builds can produce poorer trees.',
      fix: 'For point data that is partitioned naturally, try SP-GiST (no overlap). Compare buffers with `EXPLAIN (ANALYZE, BUFFERS)` and rebuild with REINDEX after heavy churn.' },
  ],
  pointers: [
    '**GiST**: balanced, entries are predicates (e.g. bounding boxes). Support functions: `consistent`, `union`, `penalty`, `picksplit`, `same`, plus optional `distance` for KNN.',
    '**SP-GiST**: unbalanced space partitioning (quad-tree, k-d tree, radix tree). Regions never overlap. `quad_point_ops` is the default for point.',
    'KNN: `ORDER BY col <-> value LIMIT k` walks the tree best-first with lower-bound distances, so it never sorts the table.',
    'Exclusion constraints (`EXCLUDE USING gist (… WITH &&)`) generalise UNIQUE to "no two rows overlap". `btree_gist` adds `=` for scalars.',
    'Both are lossy per opclass: `Recheck Cond` and `Rows Removed by Index Recheck` show rows re-tested against the heap.',
  ],
  sources: ['gist.html', 'spgist.html', 'indexes-types.html', 'ddl-constraints.html', 'btree-gist.html', 'sql-createindex.html'],
}
