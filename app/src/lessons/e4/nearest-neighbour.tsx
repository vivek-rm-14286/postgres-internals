import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, PLACES_SETUP, PLANE_H, PLANE_W, PTS60, Slider, Tile, allNodes, boxDist, buildRTree, dist, svgPoint, type P2, type Pt, type RNode } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: how a GiST index returns rows in distance order for ORDER BY geom <-> q LIMIT k.
 * The scan keeps one priority queue of pages and rows, ordered by distance: a page's key is the
 * distance to its bounding box (a lower bound for anything inside), a row's key is its exact distance.
 * Pop the closest entry: a page is opened and its entries pushed; a row is returned. Because no box
 * can hide anything closer than its own distance, the rows come out already sorted.
 * ---------------------------------------------------------------------------------------------- */

const SC = 0.5
const VW = PLANE_W * SC, VH = PLANE_H * SC
const TREE = buildRTree(PTS60)
const NODES = allNodes(TREE)

type Entry = { kind: 'node'; n: RNode; d: number } | { kind: 'pt'; p: Pt; d: number }
interface Snap { queue: Entry[]; out: { p: Pt; d: number }[]; opened: Set<string>; popped?: Entry; computed: number; note: string }

const label = (e: Entry) => (e.kind === 'node' ? (e.n.level === 0 ? `leaf ${e.n.id}` : e.n.id === 'root' ? 'root' : `page ${e.n.id}`) : `row #${e.p.id}`)

function knn(q: P2, k: number): Snap[] {
  const snaps: Snap[] = []
  let queue: Entry[] = [{ kind: 'node', n: TREE, d: boxDist(q, TREE.box) }]
  const out: { p: Pt; d: number }[] = []
  const opened = new Set<string>()
  let computed = 1
  const sort = (a: Entry, b: Entry) => a.d - b.d || (a.kind === 'node' ? -1 : 1)
  snaps.push({ queue: [...queue], out: [], opened: new Set(), computed, note: 'The queue starts with the **root page**, keyed by the distance from the query to its box.' })
  while (queue.length && out.length < k) {
    const e = queue.shift()!
    if (e.kind === 'node') {
      opened.add(e.n.id)
      const add: Entry[] = e.n.level === 0
        ? e.n.pts.map((p) => ({ kind: 'pt' as const, p, d: dist(q, p) }))
        : e.n.kids.map((c) => ({ kind: 'node' as const, n: c, d: boxDist(q, c.box) }))
      computed += add.length
      queue = [...queue, ...add].sort(sort)
      snaps.push({ queue: [...queue], out: [...out], opened: new Set(opened), popped: e, computed,
        note: `Pop **${label(e)}** (${e.d.toFixed(0)} m). Open it and push its ${add.length} ${e.n.level === 0 ? 'rows with their **exact** distances' : 'child boxes with their **box** distances'}.` })
    } else {
      out.push({ p: e.p, d: e.d })
      snaps.push({ queue: [...queue], out: [...out], opened: new Set(opened), popped: e, computed,
        note: `Pop **row #${e.p.id}** (${e.d.toFixed(0)} m): nothing left in the queue can be closer, so it is result **${out.length}**.${out.length === k ? ` LIMIT ${k} reached: the scan stops.` : ''}` })
    }
  }
  return snaps
}

function KnnViz() {
  const [q, setQ] = useState<P2>([520, 360])
  const [k, setK] = useState(5)
  const [i, setI] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef(false)
  const snaps = useMemo(() => knn(q, k), [q, k])
  const s = snaps[Math.min(i, snaps.length - 1)]
  const last = snaps.length - 1
  const done = i >= last
  const queued = new Map(s.queue.map((e) => [e.kind === 'node' ? e.n.id : `p${e.p.id}`, e]))
  const rank = new Map(s.out.map((o, r) => [o.p.id, r + 1]))
  const frontier = s.popped?.d ?? 0

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x, y] = svgPoint(svg.current!, e.clientX, e.clientY)
    setQ([Math.round(Math.max(0, Math.min(PLANE_W, x / SC))), Math.round(Math.max(0, Math.min(PLANE_H, y / SC)))]); setI(0)
  }
  const nodeTone = (n: RNode): { t: Tone; w: number; dash?: string; op: number } => {
    if (s.popped?.kind === 'node' && s.popped.n.id === n.id) return { t: 'new', w: 2.2, op: 1 }
    if (s.opened.has(n.id)) return { t: n.level === 0 ? 'tuple' : 'header', w: 1.6, op: 1 }
    if (queued.has(n.id)) return { t: 'pointer', w: 1.3, dash: '4 3', op: 1 }
    return { t: 'muted', w: 0.8, op: 0.35 }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setI((n) => (n >= last ? 0 : n + 1))}>{done ? 'Start over' : 'Pop next entry'}</Btn>
        <Btn onClick={() => setI(last)}>Run to LIMIT</Btn>
        <span className="font-mono text-xs text-muted">step {i + 1}/{snaps.length} · drag the ✕</span>
        <Slider label="LIMIT k" value={k} min={1} max={8} onChange={(v) => { setK(v); setI(0) }} />
      </div>
      <div className="min-h-[56px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
        <AnimatePresence mode="wait"><motion.p key={`${i}-${q.join()}-${k}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Md>{s.note}</Md></motion.p></AnimatePresence>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-line bg-bg p-1">
          <svg ref={svg} viewBox={`-8 -8 ${VW + 16} ${VH + 16}`} className="w-full min-w-[320px] touch-none select-none" role="img" aria-label="Index boxes, queue and nearest rows"
            onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
            onPointerMove={(e) => { if (drag.current) move(e) }} onPointerUp={() => { drag.current = false }} onPointerCancel={() => { drag.current = false }}>
            {NODES.filter((n) => n.id !== 'root').map((n) => {
              const st = nodeTone(n), pad = n.level * 7 + 3
              return <motion.rect key={n.id} x={n.box.x0 * SC - pad} y={n.box.y0 * SC - pad} width={(n.box.x1 - n.box.x0) * SC + 2 * pad} height={(n.box.y1 - n.box.y0) * SC + 2 * pad} rx={4}
                initial={false} animate={{ opacity: st.op, strokeWidth: st.w }} fill={st.op === 1 ? toneBg(st.t, 10) : 'transparent'} stroke={tone(st.t)} strokeDasharray={st.dash ?? (n.level ? '5 3' : undefined)} />
            })}
            {NODES.filter((n) => n.id !== 'root' && (n.level === 1 || s.opened.has(n.id) || queued.has(n.id))).map((n) => {
              const pad = n.level * 7 + 3
              return <text key={`t${n.id}`} x={n.box.x0 * SC - pad + 2} y={n.box.y0 * SC - pad - 3} fontSize={11} fill={n.level ? 'var(--c-header)' : 'var(--c-tuple)'} fontFamily="var(--font-mono)">{n.id}</text>
            })}
            {frontier > 0 && <motion.circle initial={false} animate={{ r: frontier * SC }} cx={q[0] * SC} cy={q[1] * SC} fill="none" stroke="var(--c-new)" strokeWidth={1.3} strokeDasharray="3 3" />}
            {s.out.map((o) => <line key={`l${o.p.id}`} x1={q[0] * SC} y1={q[1] * SC} x2={o.p.x * SC} y2={o.p.y * SC} stroke="var(--c-ok)" strokeWidth={1.1} opacity={0.7} />)}
            {PTS60.map((p) => {
              const r = rank.get(p.id), inQ = queued.has(`p${p.id}`)
              const t: Tone = r ? 'ok' : inQ ? 'pointer' : 'muted'
              return (
                <g key={p.id}>
                  <motion.circle cx={p.x * SC} cy={p.y * SC} initial={false} animate={{ r: r ? 5.5 : inQ ? 4 : 3 }} fill={toneBg(t, r ? 70 : 40)} stroke={tone(t)} strokeWidth={1} />
                  {r && <text x={p.x * SC + 7} y={p.y * SC - 5} fontSize={12} fontWeight={700} fill="var(--c-ok)" fontFamily="var(--font-mono)">{r}</text>}
                </g>
              )
            })}
            <g transform={`translate(${q[0] * SC},${q[1] * SC})`} style={{ cursor: 'grab' }}>
              <circle r={8} fill={toneBg('new', 25)} stroke="var(--c-new)" strokeWidth={1.5} />
              <path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="var(--c-new)" strokeWidth={2.2} />
            </g>
          </svg>
        </div>
        <div className="grid content-start gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Tile label="distances computed" value={s.computed} t="new" sub="boxes + rows, index KNN" />
            <Tile label="Seq Scan + sort" value={PTS60.length} t="dead" sub="one per row, every time" />
          </div>
          <Panel title="Priority queue (closest first)">
            <ul className="grid gap-0.5 font-mono text-[11.5px]">
              <AnimatePresence initial={false}>
                {s.queue.slice(0, 7).map((e) => (
                  <motion.li layout key={e.kind === 'node' ? e.n.id : `p${e.p.id}`} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                    className="flex justify-between rounded px-1.5 py-0.5" style={{ background: toneBg(e.kind === 'node' ? 'header' : 'pointer', 12) }}>
                    <span>{label(e)}</span><span className="tabular-nums text-muted">{e.d.toFixed(0)} m {e.kind === 'node' ? '(box)' : ''}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {s.queue.length > 7 && <li className="px-1.5 text-muted">… {s.queue.length - 7} more</li>}
            </ul>
          </Panel>
          <Panel title={`Result rows (LIMIT ${k})`}>
            <p className="font-mono text-[12px]">{s.out.length ? s.out.map((o, r) => `${r + 1}. #${o.p.id} ${o.d.toFixed(0)} m`).join('   ') : 'none yet'}</p>
          </Panel>
        </div>
      </div>
      <Legend items={[['new', 'query / just popped / frontier'], ['pointer', 'waiting in the queue'], ['header', 'opened upper page'], ['tuple', 'opened leaf page'], ['ok', 'returned, in order']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const Q = `ST_Point(-0.1276, 51.5072, 4326)`

export const lesson: Lesson = {
  slug: 'nearest-neighbour',
  module: 'e4',
  order: 3,
  title: 'Nearest-neighbour search',
  tldr: [
    '`ORDER BY geom <-> point LIMIT k` asks for the k nearest rows, and a GiST index answers it directly by returning rows in distance order.',
    'It exists because "the closest five" has no radius to filter on, and sorting every row by distance gets slower as the table grows.',
  ],
  visualizer: {
    title: 'Best-first search through the index',
    caption: 'Pop entries off the priority queue and watch pages open and rows come out in order. Drag the ✕ or change **LIMIT k**, then compare the work with a full sort.',
    Component: KnnViz,
  },
  playground: {
    extensions: ['postgis'],
    setup: `${PLACES_SETUP}
-- 50 invented couriers spread over the same area
CREATE TABLE riders (id int PRIMARY KEY, geom geometry(Point, 4326) NOT NULL);
INSERT INTO riders
SELECT i, ST_Point(-0.45 + (i * 37 % 100) / 100.0 * 0.7, 51.33 + (i * 61 % 100) / 100.0 * 0.34, 4326)
FROM generate_series(1, 50) AS i;
ANALYZE riders;`,
    presets: [
      { label: 'KNN plan', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM places
ORDER BY geom <-> ${Q}
LIMIT 5;`,
        note: '**Index Scan** with `Order By: (geom <-> …)`. No Sort node: the index hands rows over already in distance order, after about 10 buffers.' },
      { label: 'Degrees can mis-rank', sql: `SELECT id, kind,
       round((geom <-> ${Q})::numeric, 5) AS degrees,
       round(ST_Distance(geom::geography, ${Q}::geography)::numeric, 1) AS metres
FROM places
ORDER BY geom <-> ${Q}
LIMIT 6;

SELECT id, round(ST_Distance(geom::geography, ${Q}::geography)::numeric, 1) AS metres
FROM places
ORDER BY geom::geography <-> ${Q}::geography
LIMIT 6;`,
        note: 'The first five agree, but the 6th differs: ordering in **degrees** picks #9976 at 652 m, while the true 6th nearest is #11179 at **524 m**. At 51.5° N a degree east is shorter than a degree north.' },
      { label: 'Geography KNN', sql: `EXPLAIN (COSTS OFF)
SELECT id FROM places ORDER BY geom::geography <-> ${Q}::geography LIMIT 5;

CREATE INDEX IF NOT EXISTS places_geog_gist ON places USING gist ((geom::geography));

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM places ORDER BY geom::geography <-> ${Q}::geography LIMIT 5;`,
        note: 'Without a geography index the plan is **Seq Scan + Sort**. With the expression index it becomes an ordered Index Scan. Geography `<->` measures on a sphere, in metres.' },
      { label: 'KNN with a filter', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM places
WHERE kind = 'pharmacy'
ORDER BY geom <-> ${Q}
LIMIT 3;`,
        note: 'The index walks outward in distance order and the filter throws away non-pharmacies: **Rows Removed by Filter: 11**. A rare kind would mean walking much further.' },
      { label: 'Nearest per row: LATERAL', sql: `SELECT r.id AS rider, p.id AS pharmacy,
       round(ST_Distance(r.geom::geography, p.geom::geography)) AS metres
FROM riders r
CROSS JOIN LATERAL (
  SELECT id, geom FROM places
  WHERE kind = 'pharmacy'
  ORDER BY places.geom <-> r.geom
  LIMIT 1) p
ORDER BY r.id LIMIT 5;

EXPLAIN (ANALYZE, COSTS OFF)
SELECT r.id, p.id FROM riders r
CROSS JOIN LATERAL (SELECT id FROM places WHERE kind = 'pharmacy' ORDER BY places.geom <-> r.geom LIMIT 1) p;`,
        note: 'For each rider, `r.geom` is a constant inside the subquery, so every probe is an index KNN scan: **Index Searches: 50**, one per rider.' },
      { label: 'Trap: join without LATERAL', sql: `EXPLAIN (COSTS OFF)
SELECT p.id FROM places p, riders r
WHERE r.id = 1
ORDER BY p.geom <-> r.geom
LIMIT 3;

-- the fix: the rider's point becomes one value, computed first
EXPLAIN (COSTS OFF)
SELECT p.id FROM places p
ORDER BY p.geom <-> (SELECT geom FROM riders WHERE id = 1)
LIMIT 3;`,
        note: 'In the first plan the distance is between two **columns**, so no index can order it: Seq Scan on `places`, then Sort. The second plan uses a scalar subquery: it runs once (`InitPlan`), and `places` is read by an **Index Scan** with `Order By`. LATERAL (previous preset) does the same for many riders.' },
      { label: 'Radius and order', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM places
WHERE ST_DWithin(geom, ${Q}, 0.01)
ORDER BY geom <-> ${Q}
LIMIT 5;

SELECT 'LINESTRING(0 0, 10 10)'::geometry <-> 'POINT(10 0)'::geometry AS exact_distance,
       'LINESTRING(0 0, 10 10)'::geometry <#> 'POINT(10 0)'::geometry AS box_distance;`,
        note: 'With a radius the planner filters through the index and **top-N sorts** the 14 survivors. `<#>` is box distance: 0 for a point inside a diagonal line\'s box, even though the line is 7.07 away.' },
    ],
  },
  production: {
    title: 'Assigning the nearest courier',
    context: 'A food delivery platform assigns each new order to the nearest free courier. Courier positions are `geometry(Point, 4326)` with a GiST index, updated every few seconds.',
    problem: 'The first version joined orders to couriers and sorted by `ST_Distance` with a 5 km `ST_DWithin` cap. On busy evenings every order computed distances to hundreds of couriers, and quiet suburbs found nobody inside 5 km.',
    solution: 'Use a LATERAL KNN probe per order. Order by `<->` so the index walks outward until it finds one free courier, with no fixed radius. Re-rank the few candidates in metres for the final pick.',
    sql: `SELECT o.id, c.id AS courier, ST_Distance(o.geom::geography, c.geom::geography) AS m
FROM new_orders o
CROSS JOIN LATERAL (
  SELECT id, geom FROM couriers
  WHERE status = 'free'
  ORDER BY couriers.geom <-> o.geom
  LIMIT 3) c
ORDER BY o.id, m;`,
    outcome: 'Each order costs one short index descent instead of a scan. In the playground, 50 riders find their nearest pharmacy with 50 index probes in a few milliseconds. Taking 3 by degrees and re-ranking in metres removes most of the degree mis-ranking; order by geography when the nearest must be exact.',
  },
  pitfalls: [
    { title: '<-> between two columns',
      symptom: 'A nearest-neighbour join is a Seq Scan plus Sort, and gets slower with every row.',
      cause: 'The index orders by distance to **one fixed point**. `a.geom <-> b.geom` with both sides from the join has no fixed point.',
      fix: 'Use `CROSS JOIN LATERAL (… ORDER BY t.geom <-> outer.geom LIMIT k)`. Inside the subquery the outer value is a constant.' },
    { title: 'Nearest in degrees',
      symptom: 'The "nearest" store is sometimes the second or third nearest, mostly in east–west directions.',
      cause: 'In SRID 4326, `<->` measures degrees. Away from the equator a degree of longitude is shorter than a degree of latitude.',
      fix: 'Order by geography (`geom::geography <-> $1::geography` with a matching index), use a projected SRID, or fetch a few extra rows and re-rank by `ST_Distance` on geography.' },
    { title: 'Ordering by ST_Distance',
      symptom: '`ORDER BY ST_Distance(geom, $1) LIMIT 5` returns correct rows but reads the whole table.',
      cause: '`ST_Distance` is a plain function. Only distance **operators** such as `<->` and `<#>` can drive an ordered index scan, and the index must be **GiST**: SP-GiST and BRIN indexes on a geometry column cannot order by distance.',
      fix: 'Order by `geom <-> $1`; select `ST_Distance` in the column list for display.' },
    { title: 'A selective filter on top of KNN',
      symptom: 'A KNN query with `WHERE kind = \'rare\'` is fast for common kinds and slow for rare ones.',
      cause: 'The index returns rows in distance order and the filter rejects them one by one. A rare kind means walking far.',
      fix: 'Create a partial GiST index for each filtered value (`WHERE kind = \'rare\'`): the scan then walks only matching rows. For many values, use one GiST index on `(kind, geom)` with the `btree_gist` extension.',
      sql: `CREATE INDEX ON places USING gist (geom) WHERE kind = 'pharmacy';` },
  ],
  pointers: [
    '`ORDER BY geom <-> constant LIMIT k` is an **index-ordered scan**: rows leave the index already sorted, with no Sort node.',
    'The scan is **best-first** over a priority queue: boxes are keyed by a lower-bound distance, rows by their exact distance.',
    'geometry `<->` uses SRID units (degrees in 4326); geography `<->` gives metres on a sphere and needs a geography index.',
    '`<#>` orders by **bounding-box** distance; nearest-per-row needs **LATERAL**, explained in [LATERAL joins](/m3/lateral). The same idea for vectors is in [Distance metrics and exact search](/e1/distance-and-exact-search).',
  ],
  sources: ['geometry_distance_knn.html', 'geometry_distance_box.html', 'ST_Distance.html', 'ST_DWithin.html', 'using_postgis_query.html'],
}
