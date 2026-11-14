import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, PLACES_SETUP, PLANE_H, PLANE_W, PTS60, Slider, Tile, buildRTree, dist, inBox, overlaps, svgPoint, type Box, type P2, type RNode } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a GiST index over 60 points, drawn as the nested bounding boxes it stores. Drag the
 * query point and run ST_DWithin phase by phase: expand the query to a box, descend through the boxes
 * that overlap it (&&), collect candidates, then recheck the exact distance. The cast mode shows
 * what happens when the indexed column is wrapped in ::geography: no index matches, so every row is read.
 * ---------------------------------------------------------------------------------------------- */

const SC = 0.5
const VW = PLANE_W * SC, VH = PLANE_H * SC
type Mode = 'idx' | 'bbox' | 'cast'
const TREE = buildRTree(PTS60)

const PHASES: Record<Mode, { title: string; body: string }[]> = {
  idx: [
    { title: 'Expand the query', body: '`ST_DWithin(geom, q, r)` first adds an index condition: `geom && ST_Expand(q, r)`. The circle becomes its **bounding box**.' },
    { title: 'Test the upper boxes', body: 'The scan starts at the root page and keeps only child boxes that **overlap** the query box. Whole regions are skipped here.' },
    { title: 'Test the leaf boxes', body: 'Inside the surviving regions, each leaf page box is tested the same way. Only overlapping leaves are read.' },
    { title: 'Candidates from the index', body: 'Every point whose box overlaps the query box is a **candidate**. The index knows only boxes, so some candidates lie outside the circle.' },
    { title: 'Recheck the exact distance', body: 'The heap rows are fetched and the real distance test runs. Corners of the box fail: **Rows Removed by Filter**.' },
  ],
  bbox: [
    { title: 'Bounding box only', body: '`geom && ST_Expand(q, r)` alone compares **boxes**. It is fast and index-assisted, but it answers a box question.' },
    { title: 'Test the upper boxes', body: 'The same descent: only root children that overlap the query box are followed.' },
    { title: 'Test the leaf boxes', body: 'Overlapping leaf pages are read.' },
    { title: 'Candidates are the answer', body: 'Every candidate is returned. Points in the corners of the box are **false positives** for a radius search.' },
    { title: 'No exact step', body: 'Use `&&` alone only when a box is what you mean, such as the visible area of a map. For a radius, use `ST_DWithin`.' },
  ],
  cast: [
    { title: 'The cast hides the column', body: '`ST_DWithin(geom::geography, q::geography, r)` filters on an **expression**. The GiST index is on `geom`, so it cannot answer it.' },
    { title: 'Seq Scan: read every row', body: 'The planner falls back to a **Seq Scan**. Every row is read and cast to geography.' },
    { title: 'Exact test on every row', body: 'The spheroid distance runs for every point. The result is correct, but the work grows with the table.' },
    { title: 'Fix 1: index the expression', body: '`CREATE INDEX ON places USING gist ((geom::geography))` gives the planner an index that matches the expression.' },
    { title: 'Fix 2: store the right type', body: 'Or store a `geography` column, or a projected SRID in metres, and index that column directly.' },
  ],
}

function NodeRect({ n, state }: { n: RNode; state: 'hit' | 'miss' | 'idle' | 'hidden' }) {
  const t: Tone = n.level === 0 ? 'tuple' : 'header'
  const pad = n.level * 7 + 3
  const b = n.box
  return (
    <motion.rect initial={false}
      animate={{ x: b.x0 * SC - pad, y: b.y0 * SC - pad, width: (b.x1 - b.x0) * SC + 2 * pad, height: (b.y1 - b.y0) * SC + 2 * pad,
        opacity: state === 'hidden' ? 0 : state === 'miss' ? 0.25 : 1 }}
      transition={{ duration: 0.35 }} rx={4}
      fill={state === 'hit' ? toneBg(t, 14) : 'transparent'} stroke={tone(t)} strokeWidth={state === 'hit' ? 1.8 : 1}
      strokeDasharray={n.level === 0 ? undefined : '5 3'} />
  )
}

function IndexViz() {
  const [mode, setMode] = useState<Mode>('idx')
  const [q, setQ] = useState<P2>([800, 190])
  const [r, setR] = useState(110)
  const [phase, setPhase] = useState(4)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef(false)

  const sim = useMemo(() => {
    const qb: Box = { x0: q[0] - r, y0: q[1] - r, x1: q[0] + r, y1: q[1] + r }
    const inner = TREE.kids
    const innerHit = new Set(inner.filter((n) => overlaps(n.box, qb)).map((n) => n.id))
    const leaves = inner.flatMap((n) => n.kids)
    const leafHit = new Set(inner.filter((n) => innerHit.has(n.id)).flatMap((n) => n.kids).filter((l) => overlaps(l.box, qb)).map((l) => l.id))
    const cands = new Set(leaves.filter((l) => leafHit.has(l.id)).flatMap((l) => l.pts).filter((p) => inBox(p, qb)).map((p) => p.id))
    const matches = new Set(PTS60.filter((p) => dist(q, p) <= r).map((p) => p.id))
    return { qb, inner, leaves, innerHit, leafHit, cands, matches, pages: 1 + innerHit.size + leafHit.size }
  }, [q, r])

  const indexed = mode !== 'cast'
  const ph = Math.min(phase, 4)
  const info = PHASES[mode][ph]
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const [x, y] = svgPoint(svg.current!, e.clientX, e.clientY)
    setQ([Math.round(Math.max(0, Math.min(PLANE_W, x / SC))), Math.round(Math.max(0, Math.min(PLANE_H, y / SC)))])
  }

  const nodeState = (n: RNode): 'hit' | 'miss' | 'idle' | 'hidden' => {
    if (!indexed) return 'miss'
    if (n.level === 1) return ph >= 1 ? (sim.innerHit.has(n.id) ? 'hit' : 'miss') : 'idle'
    if (ph < 2) return 'idle'
    return sim.leafHit.has(n.id) ? 'hit' : 'miss'
  }
  const ptTone = (id: number): { t: Tone; big: boolean } => {
    if (!indexed) {
      if (ph === 0) return { t: 'muted', big: false }
      if (ph === 1) return { t: 'tuple', big: false }
      return sim.matches.has(id) ? { t: 'ok', big: true } : { t: 'dead', big: false }
    }
    if (ph < 3) return { t: 'muted', big: false }
    if (!sim.cands.has(id)) return { t: 'muted', big: false }
    if (ph === 3 || mode === 'bbox') return { t: mode === 'bbox' && !sim.matches.has(id) && ph >= 3 ? 'dead' : 'new', big: true }
    return sim.matches.has(id) ? { t: 'ok', big: true } : { t: 'dead', big: false }
  }

  const m = sim.matches.size, c = sim.cands.size
  const rowsRead = indexed ? (ph >= 3 ? c : 0) : (ph >= 1 ? PTS60.length : 0)
  const removed = indexed ? (mode === 'idx' && ph >= 4 ? c - m : 0) : (ph >= 2 ? PTS60.length - m : 0)
  const plan = mode === 'cast'
    ? `Seq Scan on places  (rows=${m})\n  Filter: st_dwithin((geom)::geography, q, ${r})\n  Rows Removed by Filter: ${PTS60.length - m}`
    : mode === 'idx'
      ? `Bitmap Heap Scan on places  (rows=${m})\n  Filter: st_dwithin(geom, q, ${r})\n  Rows Removed by Filter: ${c - m}\n  ->  Bitmap Index Scan on places_geom_gist  (rows=${c})\n        Index Cond: (geom && st_expand(q, ${r}))\n        Buffers: ${sim.pages} index pages`
      : `Bitmap Heap Scan on places  (rows=${c})\n  Recheck Cond: (geom && st_expand(q, ${r}))\n  ->  Bitmap Index Scan on places_geom_gist  (rows=${c})\n        Index Cond: (geom && st_expand(q, ${r}))`

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Query" value={mode} onChange={(v) => { setMode(v); setPhase(0) }}
          options={[['idx', 'ST_DWithin(geom, …)'], ['bbox', 'geom && box'], ['cast', 'geom::geography']]} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setPhase((p) => (p >= 4 ? 0 : p + 1))}>{ph >= 4 ? 'Start over' : 'Next phase'}</Btn>
        <span className="font-mono text-xs text-muted">phase {ph + 1}/5 · drag the ✕</span>
        <Slider label="radius r" value={r} min={40} max={240} step={10} onChange={setR} fmt={(v) => `${v} m`} />
      </div>
      <div className="min-h-[60px] rounded-lg border border-line bg-surface-2 px-4 py-2.5" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div key={`${mode}${ph}`} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <p className="text-sm font-semibold">{info.title}</p>
            <p className="mt-0.5 text-sm text-muted"><Md>{info.body}</Md></p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-line bg-bg p-1">
          <svg ref={svg} viewBox={`-8 -8 ${VW + 16} ${VH + 16}`} className="w-full min-w-[320px] touch-none select-none" role="img" aria-label="Points, index bounding boxes and the query"
            onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
            onPointerMove={(e) => { if (drag.current) move(e) }} onPointerUp={() => { drag.current = false }} onPointerCancel={() => { drag.current = false }}>
            {TREE.kids.map((n) => <NodeRect key={n.id} n={n} state={nodeState(n)} />)}
            {sim.leaves.map((n) => <NodeRect key={n.id} n={n} state={nodeState(n)} />)}
            {TREE.kids.map((n) => (
              <text key={`t${n.id}`} x={n.box.x0 * SC - 8} y={n.box.y0 * SC - 11} fontSize={12} fill="var(--c-header)" fontFamily="var(--font-mono)" opacity={indexed ? 1 : 0.4}>{n.id}</text>
            ))}
            {indexed && (
              <motion.rect initial={false} animate={{ x: sim.qb.x0 * SC, y: sim.qb.y0 * SC, width: 2 * r * SC, height: 2 * r * SC }} transition={{ duration: 0.15 }}
                fill="none" stroke="var(--c-new)" strokeWidth={1.6} strokeDasharray="4 3" />
            )}
            {mode !== 'bbox' && (
              <motion.circle initial={false} animate={{ cx: q[0] * SC, cy: q[1] * SC, r: r * SC }} transition={{ duration: 0.15 }}
                fill={toneBg('ok', 10)} stroke="var(--c-ok)" strokeWidth={1.6} />
            )}
            {PTS60.map((p) => {
              const s = ptTone(p.id)
              return <motion.circle key={p.id} cx={p.x * SC} cy={p.y * SC} initial={false} animate={{ r: s.big ? 4.6 : 3.2 }}
                fill={toneBg(s.t, s.big ? 70 : 40)} stroke={tone(s.t)} strokeWidth={1} />
            })}
            <g transform={`translate(${q[0] * SC},${q[1] * SC})`} style={{ cursor: 'grab' }}>
              <circle r={8} fill={toneBg('accent', 25)} stroke="var(--accent)" strokeWidth={1.5} />
              <path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="var(--accent)" strokeWidth={2.2} />
            </g>
            <text x={VW} y={VH + 6} textAnchor="end" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">1000 m × 700 m, projected SRID</text>
          </svg>
        </div>
        <div className="grid content-start gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Tile label="index pages read" value={indexed ? (ph >= 2 ? sim.pages : ph === 1 ? 1 + sim.innerHit.size : 1) : 0} t="header" sub={`of ${1 + TREE.kids.length + sim.leaves.length} in the tree`} />
            <Tile label="rows read" value={rowsRead} t={indexed ? 'new' : 'dead'} sub={`of ${PTS60.length} in the table`} />
            <Tile label="removed by filter" value={removed} t="dead" sub={mode === 'bbox' ? 'no recheck: corners kept' : mode === 'cast' ? 'every row tested' : 'box hit, circle miss'} />
            <Tile label="result rows" value={ph < (mode === 'idx' ? 4 : mode === 'bbox' ? 3 : 2) ? '–' : mode === 'bbox' ? c : m} t={mode === 'bbox' && c > m ? 'dead' : 'ok'} sub={mode === 'bbox' ? `${c - m} false positives` : 'exact answer'} />
          </div>
          <Panel title="Plan shape">
            <pre className="overflow-x-auto font-mono text-[10.5px] leading-[16px] whitespace-pre scrollbar-thin">{plan}</pre>
          </Panel>
        </div>
      </div>
      <Legend items={[['header', 'upper index page box'], ['tuple', 'leaf page box'], ['new', 'query box / candidate'], ['ok', 'exact match'], ['dead', 'filtered out / false positive']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const Q = `ST_Point(-0.1276, 51.5072, 4326)`

export const lesson: Lesson = {
  slug: 'spatial-indexes',
  module: 'e4',
  order: 2,
  title: 'Spatial indexes',
  tldr: [
    'A PostGIS **GiST** index is an R-tree of **bounding boxes**: each page stores boxes, and each box covers everything beneath it.',
    'It lets a query skip whole regions with the cheap `&&` box test and run the exact, expensive geometry test only on the few rows that survive.',
  ],
  visualizer: {
    title: 'Two-step filtering through a GiST tree',
    caption: 'Drag the ✕, set the radius, and step the phases. Then switch to **geom::geography** to see the same query lose its index.',
    Component: IndexViz,
  },
  playground: {
    extensions: ['postgis'],
    setup: PLACES_SETUP,
    presets: [
      { label: 'Box overlap: &&', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM places
WHERE geom && ST_MakeEnvelope(-0.14, 51.50, -0.12, 51.52, 4326);`,
        note: '`&&` is answered by the GiST index alone: **Bitmap Index Scan**, about 5 index buffers. The long hex string is the query box in WKB.' },
      { label: 'ST_DWithin, indexed', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM places
WHERE ST_DWithin(geom, ${Q}, 0.005);`,
        note: 'Read the **Index Cond**: `geom && st_expand(…, 0.005)`. Two-step filtering in one plan. The radius is **0.005 degrees**, because the column is geometry in 4326.' },
      { label: 'The geography cast trap', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM places
WHERE ST_DWithin(geom::geography, ${Q}::geography, 500);`,
        note: 'Metres at last, but the plan is a **Seq Scan** over the whole table: **19 995** rows removed by the filter. The index is on `geom`, not on `geom::geography`.' },
      { label: 'Fix: expression index', sql: `CREATE INDEX IF NOT EXISTS places_geog_gist ON places USING gist ((geom::geography));

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM places
WHERE ST_DWithin(geom::geography, ${Q}::geography, 500);`,
        note: 'Same query, now a **Bitmap Index Scan** on `places_geog_gist` with `_st_expand` on geography. A few index pages, 8 heap blocks, and only 3 rows removed.' },
      { label: 'ST_Distance is never indexed', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT count(*) FROM places
WHERE ST_Distance(geom::geography, ${Q}::geography) < 500;`,
        note: 'Same 5 rows, but **Seq Scan** even with the geography index: `ST_Distance` has no index support. Write radius filters with `ST_DWithin`.' },
      { label: 'GiST vs SP-GiST vs BRIN', sql: `CREATE INDEX IF NOT EXISTS places_geom_spgist ON places USING spgist (geom);
CREATE INDEX IF NOT EXISTS places_geom_brin ON places USING brin (geom) WITH (pages_per_range = 4);

SELECT c.relname AS index, am.amname AS method, pg_size_pretty(pg_relation_size(c.oid)) AS size
FROM pg_class c JOIN pg_am am ON am.oid = c.relam
WHERE c.relname LIKE 'places_geom%'
ORDER BY pg_relation_size(c.oid) DESC;`,
        note: 'GiST 864 kB, SP-GiST 968 kB, BRIN **24 kB**. BRIN is tiny because it stores one box per range of 4 pages. Whether it helps depends on row order (next preset).' },
      { label: 'BRIN needs sorted rows', sql: `CREATE INDEX IF NOT EXISTS places_geom_brin ON places USING brin (geom) WITH (pages_per_range = 4);
DROP TABLE IF EXISTS places_sorted;
CREATE TABLE places_sorted AS SELECT * FROM places ORDER BY geom;
CREATE INDEX ON places_sorted USING brin (geom) WITH (pages_per_range = 4);
ANALYZE places_sorted;
-- hide the GiST and SP-GiST indexes for a moment so the planner must use BRIN
BEGIN;
DROP INDEX IF EXISTS places_geom_gist, places_geom_spgist;
SET LOCAL enable_seqscan = off;
EXPLAIN (ANALYZE, COSTS OFF)
SELECT count(*) FROM places WHERE geom && ST_MakeEnvelope(-0.14, 51.50, -0.12, 51.52, 4326);
EXPLAIN (ANALYZE, COSTS OFF)
SELECT count(*) FROM places_sorted WHERE geom && ST_MakeEnvelope(-0.14, 51.50, -0.12, 51.52, 4326);
ROLLBACK;`,
        note: 'On `places` the rows are scattered, so every range box covers the whole area: **lossy=171**, all pages. `ORDER BY geom` lays rows out along a space-filling curve, and BRIN then reads only about **16** pages.' },
    ],
  },
  production: {
    title: 'A store finder that slowed down as it grew',
    context: 'A retail team stores 2 million store and pickup points as `geometry(Point, 4326)` with a GiST index. The "stores within 2 km" endpoint used `ST_DWithin(geom::geography, $1::geography, 2000)` to get metres.',
    problem: 'Latency grew in step with the table. `EXPLAIN` showed a **Seq Scan** with almost every row removed by the filter. The cast to geography made the filter an expression that the GiST index on `geom` cannot serve.',
    solution: 'Add an expression index on the cast, so the planner finds an index for the exact expression. Long term, migrate to a `geography` column (or a projected SRID in metres) and index that.',
    sql: `CREATE INDEX CONCURRENTLY stores_geog_gist ON stores USING gist ((geom::geography));
-- or, long term:
ALTER TABLE stores ADD COLUMN geog geography(Point, 4326);
UPDATE stores SET geog = geom::geography;
CREATE INDEX CONCURRENTLY ON stores USING gist (geog);`,
    outcome: 'In the playground the same pattern goes from a Seq Scan that discards 19 995 of 20 000 rows to a Bitmap Index Scan that reads a few index pages and 8 heap blocks. The gap grows with the table: the seq scan is linear, the index descent is logarithmic.',
  },
  pitfalls: [
    { title: 'Wrapping the indexed column in a cast or function',
      symptom: '`EXPLAIN` shows `Seq Scan` and a huge `Rows Removed by Filter` even though a GiST index exists.',
      cause: 'An index matches only the exact indexed expression. `geom::geography`, `ST_Transform(geom, 3857)` or `ST_Buffer(geom, …)` on the column side are different expressions.',
      fix: 'Put the transformation on the **constant** side, or create an expression index that matches.',
      sql: `CREATE INDEX ON places USING gist (ST_Transform(geom, 27700));
SELECT * FROM places WHERE ST_DWithin(ST_Transform(geom, 27700), ST_Transform($1, 27700), 500);` },
    { title: 'Filtering with ST_Distance',
      symptom: '`WHERE ST_Distance(a, b) < 500` is slow and gets slower as the table grows.',
      cause: '`ST_Distance` has no index support. It runs for every row.',
      fix: 'Use `ST_DWithin(a, b, 500)`. It adds `&&` against the expanded box, so the index cuts the candidates first.' },
    { title: 'Using && when you mean "inside"',
      symptom: 'A map query returns features that are near the area but not in it, especially long diagonal lines.',
      cause: '`&&` compares **bounding boxes** only. A diagonal road has a box much bigger than the road.',
      fix: 'Use `ST_Intersects` for the exact answer. It does the `&&` index step for you and then the exact test.' },
    { title: 'BRIN on unsorted or frequently updated data',
      symptom: 'A BRIN index exists, but `EXPLAIN` shows `Heap Blocks: lossy=` equal to the whole table.',
      cause: 'Each BRIN range stores one box covering its rows. If rows are scattered, every box covers everything.',
      fix: 'Use BRIN only for append-mostly data written in spatial order (or rewritten with `ORDER BY geom`). Use GiST otherwise.' },
  ],
  pointers: [
    'Indexes store **boxes**; queries run in two steps: box filter (index) then exact test (recheck).',
    'Index-aware: `&&`, `~`, `@`, `ST_Intersects`, `ST_Contains`, `ST_Within`, `ST_Covers`, `ST_DWithin` and friends. Not `ST_Distance`.',
    'Casting the column (`geom::geography`) needs a matching **expression index** or the plan becomes a Seq Scan.',
    'GiST is the default; SP-GiST suits points; BRIN is tiny but needs spatially sorted rows. Compare [GiST and SP-GiST](/m4/gist-spgist) and [BRIN](/m4/brin) internals.',
    'Read the plan for `Index Cond` and `Rows Removed by Filter`, as in [EXPLAIN ANALYZE](/m4/explain-analyze).',
  ],
  sources: ['using_postgis_dbmanagement.html', 'using_postgis_query.html', 'ST_DWithin.html', 'geometry_overlaps.html', 'performance_tips.html'],
}
