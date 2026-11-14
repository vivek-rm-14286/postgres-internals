import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Slider, boxOf, hash, inBox, type Box, type P2, type Pt } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer A: a point-in-polygon join, zones JOIN orders ON ST_Contains(zone, order), one zone at a
 * time: the index returns the orders whose point lies in the zone's bounding box (Index Cond: geom @ zone),
 * then the exact test (ray casting) keeps the ones really inside. Visualizer B: DBSCAN, the algorithm
 * behind ST_ClusterDBSCAN(geom, eps, minpoints), one decision per step.
 * ---------------------------------------------------------------------------------------------- */

const W = 500, H = 350
const HR = 66 // hexagon circumradius
const SQ3 = Math.sqrt(3)
const HEX_CENTRES: P2[] = [[250, 175], [250, 175 - SQ3 * HR], [250, 175 + SQ3 * HR], [250 - 1.5 * HR, 175 - (SQ3 / 2) * HR],
  [250 + 1.5 * HR, 175 - (SQ3 / 2) * HR], [250 - 1.5 * HR, 175 + (SQ3 / 2) * HR], [250 + 1.5 * HR, 175 + (SQ3 / 2) * HR]]
const ZONES = HEX_CENTRES.map(([cx, cy], i) => {
  const ring: P2[] = Array.from({ length: 6 }, (_, k) => [cx + HR * Math.cos((k * Math.PI) / 3), cy + HR * Math.sin((k * Math.PI) / 3)])
  return { id: i + 1, name: `Z${i + 1}`, ring, box: boxOf(ring.map(([x, y]) => ({ x, y }))) as Box }
})
/** Ray casting: count how many ring edges a ray to the right crosses. Odd means inside. */
function inside(p: { x: number; y: number }, ring: P2[]) {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
const ORDERS: Pt[] = Array.from({ length: 46 }, (_, k) => {
  const i = k + 1
  // denser near the centre zone, a few outside every zone
  const a = hash(i, 5) * Math.PI * 2, r = Math.sqrt(hash(i, 6)) * 230
  return { id: i, x: Math.round(250 + Math.cos(a) * r), y: Math.round(175 + Math.sin(a) * r * 0.78) }
})
const ringPath = (ring: P2[]) => ring.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + 'Z'

interface PipState { z: number; phase: 'intro' | 'box' | 'exact' | 'done'; counts: number[] }
function pipSteps(): Step<PipState>[] {
  const steps: Step<PipState>[] = [{ title: 'Seven zones, 46 orders', body: '`SELECT z.name, count(*) FROM zones z JOIN orders o ON ST_Contains(z.geom, o.geom) GROUP BY z.name`. The planner loops over the zones and probes the orders index once per zone.', state: { z: -1, phase: 'intro', counts: ZONES.map(() => 0) } }]
  const counts = ZONES.map(() => 0)
  ZONES.forEach((z, zi) => {
    const cand = ORDERS.filter((p) => inBox(p, z.box))
    const hit = cand.filter((p) => inside(p, z.ring))
    steps.push({ title: `${z.name}: index probe`, body: `The index returns orders inside the zone's **bounding box** (\`Index Cond: geom @ z.geom\`): **${cand.length}** candidates.`, state: { z: zi, phase: 'box', counts: [...counts] } })
    counts[zi] = hit.length
    steps.push({ title: `${z.name}: exact test`, body: `\`ST_Contains\` runs on each candidate. **${hit.length}** ${hit.length === 1 ? 'is' : 'are'} inside; ${cand.length - hit.length} ${cand.length - hit.length === 1 ? 'sits' : 'sit'} in the box corners and ${cand.length - hit.length === 1 ? 'is' : 'are'} removed by the filter.`, state: { z: zi, phase: 'exact', counts: [...counts] } })
  })
  const outside = ORDERS.filter((p) => !ZONES.some((z) => inside(p, z.ring))).length
  steps.push({ title: 'GROUP BY: orders per zone', body: `Each order is counted in the zone that contains it. **${outside}** orders lie outside every zone and drop out of the inner join.`, state: { z: -1, phase: 'done', counts } })
  return steps
}

function PipView({ s }: { s: PipState }) {
  const z = s.z >= 0 ? ZONES[s.z] : null
  const max = Math.max(...s.counts, 1)
  const ptTone = (p: Pt): Tone => {
    if (s.phase === 'done') { const zi = ZONES.findIndex((zz) => inside(p, zz.ring)); return zi < 0 ? 'muted' : 'ok' }
    if (!z || !inBox(p, z.box)) {
      const earlier = ZONES.slice(0, Math.max(0, s.z)).some((zz) => inside(p, zz.ring))
      return earlier ? 'tuple' : 'muted'
    }
    if (s.phase === 'box') return 'new'
    return inside(p, z.ring) ? 'ok' : 'dead'
  }
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="rounded-lg border border-line bg-bg p-1">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px]" role="img" aria-label="Hexagonal zones and order points">
          {ZONES.map((zz, i) => (
            <g key={zz.id}>
              <path d={ringPath(zz.ring)} fill={i === s.z ? toneBg('header', 18) : toneBg('header', 5)} stroke="var(--c-header)" strokeWidth={i === s.z ? 2 : 1} />
              <text x={HEX_CENTRES[i][0]} y={HEX_CENTRES[i][1] + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--c-header)" opacity={0.8}>{zz.name}</text>
            </g>
          ))}
          {z && <motion.rect initial={{ opacity: 0 }} animate={{ opacity: 1, x: z.box.x0, y: z.box.y0, width: z.box.x1 - z.box.x0, height: z.box.y1 - z.box.y0 }}
            fill="none" stroke="var(--c-new)" strokeWidth={1.6} strokeDasharray="5 3" />}
          {ORDERS.map((p) => {
            const t = ptTone(p)
            return <motion.circle key={p.id} cx={p.x} cy={p.y} initial={false} animate={{ r: t === 'new' || t === 'ok' ? 4.6 : 3.4 }} fill={toneBg(t, 60)} stroke={tone(t)} strokeWidth={1} />
          })}
        </svg>
      </div>
      <Panel title="count(*) per zone">
        <div className="grid gap-1">
          {ZONES.map((zz, i) => (
            <div key={zz.id} className="grid grid-cols-[28px_1fr_24px] items-center gap-2 text-xs">
              <span className="font-mono text-muted">{zz.name}</span>
              <div className="h-3.5 overflow-hidden rounded bg-surface-2">
                <motion.div className="h-full rounded" initial={false} animate={{ width: `${(100 * s.counts[i]) / max}%` }} style={{ background: toneBg('ok', 55), borderRight: s.counts[i] ? `2px solid ${tone('ok')}` : undefined }} />
              </div>
              <span className="text-right font-mono font-semibold tabular-nums">{s.counts[i]}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ---- DBSCAN ---------------------------------------------------------------------------------- */
const CL: P2[] = [[120, 110], [330, 90], [300, 250]]
const DPTS: Pt[] = Array.from({ length: 44 }, (_, k) => {
  const i = k + 1
  if (i % 6 === 0) return { id: i, x: Math.round(30 + hash(i, 7) * 440), y: Math.round(25 + hash(i, 8) * 300) }
  const c = CL[i % 3], a = hash(i, 9) * Math.PI * 2, r = Math.sqrt(hash(i, 10)) * (i % 3 === 2 ? 70 : 50)
  return { id: i, x: Math.round(c[0] + Math.cos(a) * r), y: Math.round(c[1] + Math.sin(a) * r * 0.8) }
})
type Lbl = { c: number | null; core: boolean } | undefined
interface DbState { labels: Lbl[]; focus: number; eps: number; nb: number[] }
function dbscanSteps(eps: number, minpts: number): Step<DbState>[] {
  const n = DPTS.length
  const nbrs = (i: number) => DPTS.map((_, j) => j).filter((j) => Math.hypot(DPTS[i].x - DPTS[j].x, DPTS[i].y - DPTS[j].y) <= eps)
  const labels: Lbl[] = Array(n).fill(undefined)
  const steps: Step<DbState>[] = [{ title: 'Start: nothing labelled', body: `\`ST_ClusterDBSCAN(geom, eps => ${eps}, minpoints => ${minpts}) OVER ()\`. Visit the points in order and count the neighbours within **eps**, including the point itself.`, state: { labels: [...labels], focus: -1, eps, nb: [] } }]
  let C = -1
  for (let i = 0; i < n; i++) {
    if (labels[i] !== undefined) continue
    const N = nbrs(i)
    if (N.length < minpts) {
      labels[i] = { c: null, core: false }
      steps.push({ title: `#${DPTS[i].id}: noise for now`, body: `Only **${N.length}** point${N.length === 1 ? '' : 's'} within eps (needs ${minpts}). Marked noise (NULL); a later cluster may still claim it as a border point.`, state: { labels: [...labels], focus: i, eps, nb: N } })
      continue
    }
    C++
    labels[i] = { c: C, core: true }
    steps.push({ title: `#${DPTS[i].id}: core, starts cluster ${C}`, body: `**${N.length}** points within eps, at least ${minpts}: a **core** point. Cluster ${C} grows from here through its neighbours.`, state: { labels: [...labels], focus: i, eps, nb: N } })
    const seeds = N.filter((j) => j !== i)
    for (let s = 0; s < seeds.length; s++) {
      const j = seeds[s]
      if (labels[j]?.c === null) { labels[j] = { c: C, core: false }; continue }
      if (labels[j] !== undefined) continue
      const Nj = nbrs(j)
      const core = Nj.length >= minpts
      labels[j] = { c: C, core }
      if (core) for (const x of Nj) if (!seeds.includes(x) && x !== i) seeds.push(x)
    }
    const members = labels.filter((l) => l?.c === C)
    const borders = members.filter((l) => !l!.core).length
    steps.push({ title: `Cluster ${C} expanded`, body: `Neighbours of core points join, and core neighbours pass it on. Cluster ${C} now has **${members.length}** points; ${borders} of them are **border** points (fewer than ${minpts} neighbours), which do not spread it further.`, state: { labels: [...labels], focus: i, eps, nb: [] } })
  }
  const noise = labels.filter((l) => l?.c === null).length
  steps.push({ title: `Done: ${C + 1} clusters, ${noise} noise`, body: 'Cluster ids are 0, 1, 2… and noise comes back as **NULL**. Change eps or minpoints and run again.', state: { labels: [...labels], focus: -1, eps, nb: [] } })
  return steps
}
const CTONES: Tone[] = ['ok', 'pointer', 'new', 'header', 'accent']

function DbView({ s }: { s: DbState }) {
  const f = s.focus >= 0 ? DPTS[s.focus] : null
  return (
    <div className="mx-auto w-full max-w-[640px] rounded-lg border border-line bg-bg p-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px]" role="img" aria-label="DBSCAN cluster assignment">
        {f && <motion.circle initial={{ r: 0 }} animate={{ r: s.eps }} cx={f.x} cy={f.y} fill={toneBg('accent', 10)} stroke="var(--accent)" strokeWidth={1.4} strokeDasharray="4 3" />}
        {DPTS.map((p, i) => {
          const l = s.labels[i]
          const t: Tone = l === undefined ? 'muted' : l.c === null ? 'dead' : CTONES[l.c % CTONES.length]
          const core = l?.core
          return (
            <motion.circle key={p.id} cx={p.x} cy={p.y} initial={false} animate={{ r: i === s.focus ? 6.5 : core ? 5 : 3.8 }}
              fill={l === undefined ? 'transparent' : toneBg(t, core ? 75 : 25)} stroke={tone(t)} strokeWidth={i === s.focus ? 2.4 : 1.2}
              strokeDasharray={l?.c === null ? '2 2' : undefined} />
          )
        })}
        {f && <text x={f.x + 9} y={f.y - 8} fontSize={10.5} fontWeight={700} fill="var(--accent)" fontFamily="var(--font-mono)">#{f.id}</text>}
      </svg>
    </div>
  )
}

function DbscanPanel() {
  const [eps, setEps] = useState(42)
  const [mp, setMp] = useState(4)
  const steps = useMemo(() => dbscanSteps(eps, mp), [eps, mp])
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Slider label="eps" value={eps} min={20} max={80} step={2} onChange={setEps} fmt={(v) => `${v} m`} />
        <Slider label="minpoints" value={mp} min={2} max={7} onChange={setMp} />
      </div>
      <Stepper steps={steps} interval={900} render={(s) => <DbView s={s} />} />
      <Legend items={[['ok', 'cluster 0'], ['pointer', 'cluster 1'], ['new', 'cluster 2'], ['header', 'cluster 3'], ['dead', 'noise (NULL)'], ['muted', 'not visited yet'], ['accent', 'eps circle']]} />
      <p className="text-xs text-muted">Large solid dots are core points; small pale dots in a cluster colour are border points; dashed red dots are noise.</p>
    </div>
  )
}

function QueriesViz() {
  const [mode, setMode] = useState<'pip' | 'db'>('pip')
  const steps = useMemo(pipSteps, [])
  return (
    <div className="grid gap-3">
      <Segmented label="Query" value={mode} onChange={setMode} options={[['pip', 'Point-in-polygon join'], ['db', 'ST_ClusterDBSCAN']]} />
      {mode === 'pip'
        ? <div className="grid gap-3">
            <Stepper steps={steps} interval={1300} render={(s) => <PipView s={s} />} />
            <Legend items={[['new', 'box candidate'], ['ok', 'inside: counted'], ['dead', 'box corner: filtered'], ['tuple', 'counted in an earlier zone'], ['muted', 'not tested yet']]} />
          </div>
        : <DbscanPanel />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'spatial-queries',
  module: 'e4',
  order: 4,
  title: 'Everyday spatial queries',
  tldr: [
    'Most map features are built from a handful of spatial operations: point-in-polygon joins, buffers, unions, clusters and GeoJSON output.',
    'Running them inside PostgreSQL keeps the data, its indexes and its validity rules in one place, so the answers stay correct and fast as the data grows.',
  ],
  visualizer: {
    title: 'A point-in-polygon join and a DBSCAN run, step by step',
    caption: 'Step the join zone by zone: box candidates first, then the exact test. Switch to **ST_ClusterDBSCAN**, set eps and minpoints, and watch core, border and noise points appear.',
    Component: QueriesViz,
  },
  playground: {
    extensions: ['postgis'],
    setup: `
-- All geometry here is in EPSG:27700 (British National Grid), so units are metres.
-- 33 invented delivery zones: a hexagon grid with 1.5 km edges
CREATE TABLE zones AS
SELECT row_number() OVER (ORDER BY h.i, h.j)::int AS id,
       'Z' || lpad((row_number() OVER (ORDER BY h.i, h.j))::text, 2, '0') AS name,
       h.geom::geometry(Polygon, 27700) AS geom
FROM ST_HexagonGrid(1500, ST_MakeEnvelope(524000, 175000, 536000, 186000, 27700)) AS h;
ALTER TABLE zones ADD PRIMARY KEY (id);

-- 5000 invented orders: 80% around four hubs, 20% spread evenly
CREATE TABLE orders (id int PRIMARY KEY, geom geometry(Point, 27700) NOT NULL);
INSERT INTO orders
SELECT i,
       CASE WHEN i % 5 = 0
            THEN ST_Point(524000 + (i * 7919 % 12000), 175000 + (i * 104729 % 11000), 27700)
            ELSE ST_Point(h.x[1 + i % 4] + ((i * 7919 % 2001) - 1000) * (0.4 + (i % 7) / 10.0),
                          h.y[1 + i % 4] + ((i * 6131 % 2001) - 1000) * (0.4 + (i % 7) / 10.0), 27700)
       END
FROM generate_series(1, 5000) AS i,
     (SELECT ARRAY[528500, 533500, 527000, 525500] AS x,
             ARRAY[183500, 180500, 177000, 181000] AS y) AS h;

-- one invented road
CREATE TABLE route (id int PRIMARY KEY, name text, geom geometry(LineString, 27700));
INSERT INTO route VALUES (1, 'Ring road',
  'SRID=27700;LINESTRING(524500 176000, 528000 179500, 531000 180000, 535500 185500)');

CREATE INDEX ON orders USING gist (geom);
CREATE INDEX ON zones USING gist (geom);
ANALYZE;`,
    presets: [
      { label: 'Orders per zone', sql: `SELECT z.name, count(o.id) AS orders
FROM zones z
JOIN orders o ON ST_Contains(z.geom, o.geom)
GROUP BY z.name
ORDER BY orders DESC
LIMIT 5;

EXPLAIN (ANALYZE, COSTS OFF)
SELECT z.name, count(*) FROM zones z
JOIN orders o ON ST_Contains(z.geom, o.geom)
GROUP BY z.name;`,
        note: 'Z25, Z15 and Z07 hold the hubs (about 1 000 orders each). The plan loops over 33 zones and probes the orders index with `Index Cond: (geom @ z.geom)`, then `Filter: st_contains`: **Rows Removed by Filter: 44** per zone on average.' },
      { label: 'Contains vs covers', sql: `WITH v AS (SELECT ST_PointN(ST_ExteriorRing(geom), 2) AS p FROM zones WHERE id = 15)
SELECT ST_AsText(p) AS shared_corner,
       (SELECT count(*) FROM zones z WHERE ST_Contains(z.geom, v.p))   AS contains,
       (SELECT count(*) FROM zones z WHERE ST_Covers(z.geom, v.p))     AS covers,
       (SELECT count(*) FROM zones z WHERE ST_Intersects(z.geom, v.p)) AS intersects
FROM v;`,
        note: 'A point exactly on a corner where three hexagons meet: `ST_Contains` says **0** zones (a polygon does not contain its own boundary), `ST_Covers` and `ST_Intersects` say **3**. Pick the one that matches your counting rule.' },
      { label: 'Buffer, length, area', sql: `SELECT r.name,
       round(ST_Length(r.geom)) AS length_m,
       round((ST_Area(ST_Buffer(r.geom, 300)) / 1e6)::numeric, 2) AS corridor_km2,
       (SELECT count(*) FROM orders o WHERE ST_DWithin(o.geom, r.geom, 300)) AS orders_within_300m,
       (SELECT count(*) FROM zones z WHERE ST_Intersects(z.geom, r.geom))  AS zones_crossed
FROM route r;`,
        note: 'The road is **15 097 m** long; its 300 m corridor covers 9.34 km². To count orders near it, `ST_DWithin` (index-aware) beats testing against a buffer polygon.' },
      { label: 'Overlay: road length per zone', sql: `SELECT z.name,
       round(ST_Length(ST_Intersection(z.geom, r.geom))) AS metres_in_zone
FROM zones z
JOIN route r ON ST_Intersects(z.geom, r.geom)
ORDER BY metres_in_zone DESC;`,
        note: '`ST_Intersects` picks the zone–road pairs (through the index); `ST_Intersection` cuts the line at each zone border and returns the piece inside. The 9 pieces run from 2 753 m in Z26 to 140 m in Z25 and add up to the 15 097 m of the road.' },
      { label: 'ST_Union vs ST_Collect', sql: `-- Z15 and the six zones around it
SELECT string_agg(name, ', ' ORDER BY name)  AS zones,
       sum(ST_NPoints(geom))               AS input_vertices,
       ST_GeometryType(ST_Union(geom))      AS union_type,
       ST_NPoints(ST_Union(geom))           AS union_vertices,
       round((ST_Area(ST_Union(geom)) / 1e6)::numeric, 2) AS union_km2,
       ST_GeometryType(ST_Collect(geom))    AS collect_type,
       ST_NumGeometries(ST_Collect(geom))   AS collect_parts
FROM zones
WHERE ST_Intersects(geom, (SELECT geom FROM zones WHERE name = 'Z15'));`,
        note: '`ST_Union` **dissolves** the shared edges: 7 hexagons (49 vertices) become one Polygon of 19 vertices and 40.92 km² (7 × 5.85). `ST_Collect` only bundles them into a 7-part collection: much cheaper, but the inner edges stay.' },
      { label: 'Clusters: DBSCAN and k-means', sql: `SELECT cid, count(*) AS orders,
       round((ST_Area(ST_ConvexHull(ST_Collect(geom))) / 1e6)::numeric, 2) AS hull_km2
FROM (SELECT ST_ClusterDBSCAN(geom, eps => 100, minpoints => 10) OVER () AS cid, geom FROM orders) s
GROUP BY cid ORDER BY cid NULLS FIRST;

SELECT k, count(*) AS orders, ST_AsText(ST_SnapToGrid(ST_Centroid(ST_Collect(geom)), 1)) AS centre
FROM (SELECT ST_ClusterKMeans(geom, 4) OVER () AS k, geom FROM orders) s
GROUP BY k ORDER BY k;`,
        note: 'DBSCAN finds the **4 hubs** (about 800 orders each), one small extra cluster, and **1 745** noise orders with a NULL id. k-means returns exactly k clusters (more only if you pass `max_radius`), so every order is forced into one of 4.' },
      { label: 'GeoJSON for a web map', sql: `SELECT json_build_object(
         'type', 'FeatureCollection',
         'features', json_agg(ST_AsGeoJSON(t.*, id_column => 'id', maxdecimaldigits => 6)::json))
FROM (SELECT z.id, z.name, count(o.id) AS orders, ST_Transform(z.geom, 4326) AS geom
      FROM zones z LEFT JOIN orders o ON ST_Contains(z.geom, o.geom)
      WHERE z.id <= 2 GROUP BY z.id) t;

SELECT length(ST_AsGeoJSON(ST_Transform(ST_Union(geom), 4326)))                       AS full_chars,
       length(ST_AsGeoJSON(ST_Transform(ST_Simplify(ST_Union(geom), 500), 4326), 6)) AS simplified_chars
FROM zones;`,
        note: 'GeoJSON coordinates must be **longitude/latitude (4326)**, so transform first. Six decimals is about 0.1 m. Simplifying the outline by 500 m and trimming decimals cuts the payload from 1 285 to 752 characters.' },
      { label: 'Validity', sql: `SELECT ST_IsValid(g)                AS valid,
       ST_IsValidReason(g)          AS reason,
       ST_Area(g)                   AS area_as_drawn,
       ST_AsText(ST_MakeValid(g))   AS repaired,
       ST_Area(ST_MakeValid(g))     AS area_repaired
FROM (SELECT 'POLYGON((0 0, 2 2, 2 0, 0 2, 0 0))'::geometry AS g) s;

SELECT count(*) FILTER (WHERE NOT ST_IsValid(geom)) AS invalid_zones FROM zones;`,
        note: 'A "bow-tie" ring crosses itself at (1 1). Its signed areas cancel, so `ST_Area` says **0**. `ST_MakeValid` splits it into two triangles with area **2**. PostGIS does not validate on insert.' },
    ],
  },
  production: {
    title: 'A delivery-zone dashboard',
    context: 'A grocery delivery team shows orders per zone on a live web map. Zones are hand-drawn polygons; orders arrive as GPS points in longitude/latitude.',
    problem: 'Counts were wrong in two ways. Orders on a shared zone border were counted twice, because the query used `ST_Intersects`. A few hand-drawn zones were self-intersecting, and their `ST_Area` and contains tests silently gave nonsense.',
    solution: 'Repair zones once with `ST_MakeValid` and add a check constraint so bad shapes are rejected. A repaired polygon can become a MultiPolygon (a bow-tie becomes two triangles), so the column type is widened in the same statement. Count with `ST_Contains`, or assign each border order to exactly one zone. Serve the map as one GeoJSON FeatureCollection in 4326, simplified for the zoom level.',
    sql: `ALTER TABLE zones ALTER COLUMN geom TYPE geometry(MultiPolygon, 27700)
  USING ST_Multi(ST_CollectionExtract(ST_MakeValid(geom), 3));
ALTER TABLE zones ADD CONSTRAINT zones_valid CHECK (ST_IsValid(geom));

SELECT json_build_object('type', 'FeatureCollection', 'features', json_agg(ST_AsGeoJSON(t.*)::json))
FROM (SELECT z.id, z.name, count(o.id) AS orders,
             ST_Transform(ST_SimplifyPreserveTopology(z.geom, 20), 4326) AS geom
      FROM zones z LEFT JOIN orders o ON ST_Contains(z.geom, o.geom)
      GROUP BY z.id) t;`,
    outcome: 'Every order is counted at most once, the constraint blocks new invalid zones, and the map loads one compact JSON document. In the playground the 33-zone join runs in about 10 ms through the orders index.',
  },
  pitfalls: [
    { title: 'Double counting on shared borders',
      symptom: 'The per-zone counts add up to more than the number of orders.',
      cause: '`ST_Intersects` and `ST_Covers` include the boundary, so a point on a shared edge matches **both** zones.',
      fix: 'Use `ST_Contains` (excludes the boundary) and decide what to do with exact-boundary points, or pick one zone per point with `DISTINCT ON`.' },
    { title: 'Invalid polygons in, nonsense out',
      symptom: 'A zone reports area 0, or a point clearly inside it is "not contained".',
      cause: 'PostGIS does not check validity on insert. Self-intersecting rings make area and predicates unreliable.',
      fix: 'Repair once, then enforce. A repaired polygon can become a MultiPolygon, so the column type must allow it.',
      sql: `ALTER TABLE zones ALTER COLUMN geom TYPE geometry(MultiPolygon, 27700)
  USING ST_Multi(ST_CollectionExtract(ST_MakeValid(geom), 3));
ALTER TABLE zones ADD CONSTRAINT zones_valid CHECK (ST_IsValid(geom));` },
    { title: 'Simplify breaking shapes',
      symptom: 'After `ST_Simplify` some polygons vanish, overlap their neighbours, or fail `ST_IsValid`.',
      cause: 'Douglas-Peucker removes vertices without checking topology. Small shapes collapse and neighbours stop sharing edges.',
      fix: 'Use `ST_SimplifyPreserveTopology` for validity, or `ST_CoverageSimplify` to keep shared edges between neighbours. Simplify in a metric SRID with a tolerance in metres.' },
    { title: 'Buffering to find what is near',
      symptom: '`WHERE ST_Intersects(geom, ST_Buffer($1, 500))` is slow, and the "circle" is really a 32-sided polygon, so points near the rim are misjudged.',
      cause: 'Building a buffer is costly, and its 32-segment circle is only an approximation.',
      fix: 'Use `ST_DWithin(geom, $1, 500)`. It is exact and index-aware.' },
  ],
  pointers: [
    'Point-in-polygon join: `JOIN … ON ST_Contains(zone, point)`. The index probe uses the zone box, then the exact test filters.',
    '`ST_Contains` excludes the boundary; `ST_Covers` and `ST_Intersects` include it.',
    '`ST_Union` dissolves into one shape; `ST_Collect` only bundles. `ST_ClusterDBSCAN` returns NULL for noise; `ST_ClusterKMeans` makes exactly k clusters unless given `max_radius`. Both are window functions: see [Window functions and frames](/m3/window-functions).',
    'GeoJSON output is longitude/latitude: `ST_AsGeoJSON(ST_Transform(geom, 4326), 6)`. `json_agg` and `json_build_object` are covered in [Working with JSON](/f2/working-with-json).',
    'Check `ST_IsValid` on load and enforce it with a constraint. Start again from [Spatial indexes](/e4/spatial-indexes) when a query is slow.',
  ],
  sources: ['using_postgis_query.html', 'ST_Contains.html', 'ST_Buffer.html', 'ST_ClusterDBSCAN.html', 'ST_ClusterKMeans.html', 'ST_AsGeoJSON.html', 'ST_Simplify.html', 'using_postgis_dbmanagement.html'],
}
