import { useMemo, useState, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, ITEMS_SETUP, Slider, Tile, gauss, l2sq, rng, type P2 } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: IVFFlat in 2-D. k-means (k-means++ seeding, Lloyd iterations) picks `lists`
 * centroids from a training sample; every row is stored in the list of its nearest centroid,
 * which partitions the plane into Voronoi cells (drawn exactly by half-plane clipping).
 * A query scans only the `probes` lists whose centroids are nearest to it. Recall is measured
 * against brute force on the same 360 points; the curve averages 80 random queries.
 * "Trained too early" builds the centroids from the first two clusters only, as when an index is
 * created before most of the data is loaded, then files every later row into those stale lists.
 * ---------------------------------------------------------------------------------------------- */

const K = 5
const CENTRES: P2[] = [[0.2, 0.22], [0.32, 0.7], [0.72, 0.25], [0.8, 0.72], [0.52, 0.48], [0.12, 0.5]]
const PTS: { p: P2; c: number }[] = (() => {
  const r = rng(11), out: { p: P2; c: number }[] = []
  for (let i = 0; i < 360; i++) {
    const c = i % CENTRES.length
    out.push({ c, p: [Math.min(0.98, Math.max(0.02, CENTRES[c][0] + gauss(r) * 0.085)), Math.min(0.98, Math.max(0.02, CENTRES[c][1] + gauss(r) * 0.085))] })
  }
  return out
})()

function kmeans(pts: P2[], k: number, seed: number): P2[] {
  const r = rng(seed)
  const cs: P2[] = [pts[Math.floor(r() * pts.length)]]
  while (cs.length < k) {
    const d = pts.map((p) => Math.min(...cs.map((c) => l2sq(p, c))))
    let x = r() * d.reduce((a, b) => a + b, 0), i = 0
    while (x > d[i] && i < d.length - 1) { x -= d[i]; i++ }
    cs.push(pts[i])
  }
  for (let it = 0; it < 20; it++) {
    const sum = cs.map(() => [0, 0, 0])
    for (const p of pts) { const j = nearest(cs, p); sum[j][0] += p[0]; sum[j][1] += p[1]; sum[j][2]++ }
    sum.forEach((s, j) => { if (s[2]) cs[j] = [s[0] / s[2], s[1] / s[2]] })
  }
  return cs
}
const nearest = (cs: P2[], p: P2) => { let b = 0; for (let j = 1; j < cs.length; j++) if (l2sq(cs[j], p) < l2sq(cs[b], p)) b = j; return b }

/** Voronoi cell of centroid i inside the unit square: clip the square by every bisector half-plane. */
function cell(cs: P2[], i: number): P2[] {
  let poly: P2[] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let j = 0; j < cs.length; j++) {
    if (j === i) continue
    const a: P2 = [2 * (cs[j][0] - cs[i][0]), 2 * (cs[j][1] - cs[i][1])]
    const b = cs[j][0] ** 2 + cs[j][1] ** 2 - cs[i][0] ** 2 - cs[i][1] ** 2
    const inside = (p: P2) => a[0] * p[0] + a[1] * p[1] <= b
    const out: P2[] = []
    for (let k = 0; k < poly.length; k++) {
      const P = poly[k], Q = poly[(k + 1) % poly.length]
      const pin = inside(P), qin = inside(Q)
      if (pin) out.push(P)
      if (pin !== qin) {
        const t = (b - a[0] * P[0] - a[1] * P[1]) / (a[0] * (Q[0] - P[0]) + a[1] * (Q[1] - P[1]))
        out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])])
      }
    }
    poly = out
    if (!poly.length) break
  }
  return poly
}

function search(cs: P2[], assign: number[], q: P2, probes: number) {
  const order = cs.map((c, j) => [l2sq(c, q), j] as const).sort((a, b) => a[0] - b[0]).slice(0, probes).map((x) => x[1])
  const probed = new Set(order)
  const scanned = PTS.map((_, i) => i).filter((i) => probed.has(assign[i]))
  const approx = scanned.sort((a, b) => l2sq(PTS[a].p, q) - l2sq(PTS[b].p, q)).slice(0, K)
  const exact = PTS.map((_, i) => i).sort((a, b) => l2sq(PTS[a].p, q) - l2sq(PTS[b].p, q)).slice(0, K)
  const hit = approx.filter((i) => exact.includes(i)).length
  return { probed, order, scanned: scanned.length, approx, exact, recall: hit / K }
}

const S = 340
const X = (x: number) => x * S, Y = (y: number) => y * S

function IvfViz() {
  const [lists, setLists] = useState(8)
  const [probes, setProbes] = useState(1)
  const [train, setTrain] = useState<'all' | 'early'>('all')
  const [q, setQ] = useState<P2>([0.42, 0.6])
  const p = Math.min(probes, lists)

  const { cs, assign, cells } = useMemo(() => {
    const sample = train === 'all' ? PTS.map((x) => x.p) : PTS.filter((x) => x.c < 2).map((x) => x.p)
    const cs = kmeans(sample, lists, 3)
    return { cs, assign: PTS.map((x) => nearest(cs, x.p)), cells: cs.map((_, i) => cell(cs, i)) }
  }, [lists, train])
  const res = useMemo(() => search(cs, assign, q, p), [cs, assign, q, p])
  const curve = useMemo(() => {
    const r = rng(5), qs: P2[] = Array.from({ length: 80 }, () => [r(), r()])
    return Array.from({ length: lists }, (_, i) => {
      let rec = 0, sc = 0
      for (const qq of qs) { const s = search(cs, assign, qq, i + 1); rec += s.recall; sc += s.scanned }
      return { probes: i + 1, recall: rec / qs.length, scanned: sc / qs.length / PTS.length }
    })
  }, [cs, assign, lists])
  const sizes = cs.map((_, j) => assign.filter((a) => a === j).length)
  const approxSet = new Set(res.approx)

  const pick = (e: MouseEvent<SVGSVGElement>) => {
    const el = e.currentTarget, pt = el.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const v = pt.matrixTransform(el.getScreenCTM()!.inverse())
    setQ([Math.min(0.99, Math.max(0.01, v.x / S)), Math.min(0.99, Math.max(0.01, v.y / S))])
  }

  // recall curve chart
  const CW = 300, CH = 120, cx = (i: number) => 28 + (i / Math.max(1, lists - 1)) * (CW - 40), cy = (v: number) => 10 + (1 - v) * (CH - 34)

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Slider label="lists" value={lists} min={2} max={16} onChange={(v) => { setLists(v); setProbes((x) => Math.min(x, v)) }} />
        <Slider label="ivfflat.probes" value={p} min={1} max={lists} onChange={setProbes} />
        <Segmented label="Centroids trained on" value={train} onChange={setTrain} options={[['all', 'Built after loading'], ['early', 'Built too early']]} />
        <Btn primary testid="viz-next" onClick={() => setProbes((x) => (Math.min(x, lists) >= lists ? 1 : Math.min(x, lists) + 1))}>Probe one more list</Btn>
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-line bg-bg p-1">
          <svg viewBox={`0 0 ${S} ${S}`} className="w-full cursor-crosshair" onClick={pick} role="img" aria-label="IVFFlat Voronoi cells">
            {cells.map((poly, j) => {
              const on = res.probed.has(j)
              return <motion.polygon key={`${lists}-${train}-${j}`} points={poly.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} initial={false}
                animate={{ fill: on ? toneBg('accent', 16) : 'rgba(0,0,0,0)' }} stroke="var(--muted)" strokeWidth={1} strokeOpacity={0.7} />
            })}
            {PTS.map((x, i) => {
              const scanned = res.probed.has(assign[i])
              const t = approxSet.has(i) ? 'new' : scanned ? 'tuple' : 'muted'
              return <circle key={i} cx={X(x.p[0])} cy={Y(x.p[1])} r={approxSet.has(i) ? 4 : 2.4} fill={t === 'muted' ? 'var(--muted)' : tone(t)} opacity={t === 'muted' ? 0.35 : 0.9} />
            })}
            {res.exact.filter((i) => !approxSet.has(i)).map((i) => <circle key={`m${i}`} cx={X(PTS[i].p[0])} cy={Y(PTS[i].p[1])} r={6} fill="none" stroke="var(--c-dead)" strokeWidth={2} />)}
            {res.exact.filter((i) => approxSet.has(i)).map((i) => <circle key={`h${i}`} cx={X(PTS[i].p[0])} cy={Y(PTS[i].p[1])} r={6} fill="none" stroke="var(--c-ok)" strokeWidth={1.6} />)}
            {cs.map((c, j) => (
              <g key={`c${j}`}>
                <motion.rect initial={false} animate={{ x: X(c[0]) - 4.5, y: Y(c[1]) - 4.5 }} width={9} height={9} transform={`rotate(45 ${X(c[0])} ${Y(c[1])})`} fill={tone('header')} stroke="var(--bg)" strokeWidth={1} />
                {res.order.includes(j) && <text x={X(c[0]) + 7} y={Y(c[1]) - 6} fontSize={10} fontWeight={700} fill="var(--c-header)" fontFamily="var(--font-mono)">#{res.order.indexOf(j) + 1}</text>}
              </g>
            ))}
            <g transform={`translate(${X(q[0])},${Y(q[1])})`}><circle r={9} fill={toneBg('new', 25)} stroke="var(--c-new)" strokeWidth={1.5} /><path d="M-4,-4 L4,4 M4,-4 L-4,4" stroke="var(--c-new)" strokeWidth={2.2} /></g>
          </svg>
        </div>
        <div className="grid content-start gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Tile label={`recall@${K}`} value={res.recall.toFixed(2)} t={res.recall === 1 ? 'ok' : res.recall >= 0.6 ? 'new' : 'dead'} sub="this query vs exact" />
            <Tile label="rows scanned" value={`${res.scanned} / ${PTS.length}`} sub={`${Math.round((100 * res.scanned) / PTS.length)}% of the table`} />
          </div>
          <Panel title="Average over 80 random queries">
            <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" role="img" aria-label="Recall versus probes">
              {[0, 0.5, 1].map((v) => <g key={v}><line x1={28} x2={CW - 12} y1={cy(v)} y2={cy(v)} stroke="var(--border)" /><text x={24} y={cy(v) + 3} textAnchor="end" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{v}</text></g>)}
              <polyline points={curve.map((c, i) => `${cx(i)},${cy(c.scanned)}`).join(' ')} fill="none" stroke="var(--c-tuple)" strokeWidth={1.5} strokeDasharray="4 3" />
              <polyline points={curve.map((c, i) => `${cx(i)},${cy(c.recall)}`).join(' ')} fill="none" stroke="var(--c-ok)" strokeWidth={2} />
              {curve.map((c, i) => <circle key={i} cx={cx(i)} cy={cy(c.recall)} r={i + 1 === p ? 5 : 2.5} fill={i + 1 === p ? 'var(--c-new)' : 'var(--c-ok)'} />)}
              <text x={(CW + 16) / 2} y={CH - 4} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">probes 1 → {lists}</text>
            </svg>
            <p className="text-xs text-muted"><span style={{ color: tone('ok') }}>━ recall@{K}</span> · <span style={{ color: tone('tuple') }}>┅ fraction of rows scanned</span> · at probes = {p}: {curve[p - 1].recall.toFixed(2)} recall, {Math.round(100 * curve[p - 1].scanned)}% scanned</p>
          </Panel>
          <Panel title="List sizes">
            <div className="flex h-10 items-end gap-0.5">
              {sizes.map((n, j) => <motion.div key={j} className="flex-1 rounded-t" initial={false} animate={{ height: `${(100 * n) / Math.max(...sizes)}%` }} style={{ background: res.probed.has(j) ? tone('accent') : toneBg('muted', 40) }} title={`list ${j}: ${n} rows`} />)}
            </div>
            <p className="mt-1 text-xs text-muted"><Md>{train === 'early'
              ? 'The centroids only know the first two clusters. Every later row is filed into the nearest stale list, so a few lists hold almost everything and probing them is close to a full scan, or misses neighbours across a boundary.'
              : 'Balanced lists: each probe scans about rows ÷ lists rows. Neighbours just across a cell boundary (red rings) are missed until that cell is probed too.'}</Md></p>
          </Panel>
        </div>
      </div>
      <Legend items={[['header', 'centroid (#n = probe order)'], ['accent', 'probed cell'], ['tuple', 'scanned row'], ['new', 'returned'], ['ok', 'true neighbour found'], ['dead', 'true neighbour missed']]} />
      <p className="text-xs text-muted"><Md>{'Click the map to move the query. On the playground\'s 10 000 × 32-d table with `lists = 100`, recall@10 is **0.6–0.7 at probes = 1**, about 0.97 at 3 and 1.0 at 10; at `probes = lists` the planner stops using the index.'}</Md></p>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const Q1 = '(SELECT v FROM queries WHERE qid = 1)'

export const lesson: Lesson = {
  slug: 'ivfflat',
  module: 'e1',
  order: 4,
  title: 'IVFFlat indexes',
  tldr: [
    'An **IVFFlat** index runs k-means on the existing rows to find `lists` centroids, files every vector under its nearest centroid, and at query time scans only the `ivfflat.probes` closest lists.',
    'It builds far faster and smaller than HNSW, but its centroids are frozen at build time, so it needs data before it is created and periodic rebuilds as the data drifts.',
  ],
  visualizer: {
    title: 'Voronoi cells, probes and recall',
    caption: 'Click to move the query and raise **probes** one list at a time: recall climbs as more cells are scanned. Then switch to **Built too early** to see what stale centroids do.',
    Component: IvfViz,
  },
  playground: {
    extensions: ['vector'],
    setup: ITEMS_SETUP,
    presets: [
      { label: 'Build with 100 lists', sql: `CREATE INDEX items_ivf ON items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

SELECT pg_size_pretty(pg_relation_size('items_ivf')) AS ivfflat_size;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM items ORDER BY embedding <-> ${Q1} LIMIT 10;`,
        note: 'The build is roughly five to ten times faster than HNSW on the same table, and the index is about the size of the table. With the default `ivfflat.probes = 1` the scan touches about 15 buffers instead of the 224 of a sequential scan.' },
      { label: 'Recall vs probes', sql: `SET ivfflat.probes = 1;  SELECT 1  AS probes, * FROM recall;
SET ivfflat.probes = 2;  SELECT 2  AS probes, * FROM recall;
SET ivfflat.probes = 3;  SELECT 3  AS probes, * FROM recall;
SET ivfflat.probes = 10; SELECT 10 AS probes, * FROM recall;
RESET ivfflat.probes;`,
        note: 'probes = 1 misses neighbours that sit in an adjacent list (recall 0.6–0.7; k-means starts from a random sample, so it varies by build). Three probes bring it near 0.98. A starting point is **probes ≈ √lists** (10 here).' },
      { label: 'Cost of more probes', sql: `SET ivfflat.probes = 1;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id FROM items ORDER BY embedding <-> ${Q1} LIMIT 10;
SET ivfflat.probes = 10;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT id FROM items ORDER BY embedding <-> ${Q1} LIMIT 10;
RESET ivfflat.probes;`,
        note: 'Each probe reads one more list. Compare `Buffers: shared hit` between the two plans: about 15 at probes = 1 and about 40 at probes = 10. Every probed list adds its rows to the distance computations, so the work grows with probes.' },
      { label: 'probes = lists', sql: `SET ivfflat.probes = 100;
EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY embedding <-> ${Q1} LIMIT 10;
SET ivfflat.probes = 50;
EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY embedding <-> ${Q1} LIMIT 10;
RESET ivfflat.probes;`,
        note: 'Probing every list would read the whole index, so the planner prefers an exact **Seq Scan + Sort**. At 50 probes it still uses the index.' },
      { label: 'Built too early', sql: `CREATE TABLE early (id int PRIMARY KEY, embedding vector(32));
-- the index is created while only 4 of 40 topics exist
INSERT INTO early SELECT id, embedding FROM items WHERE topic < 4;
CREATE INDEX early_ivf ON early USING ivfflat (embedding vector_l2_ops) WITH (lists = 10);
-- then the rest of the data arrives
INSERT INTO early SELECT id, embedding FROM items WHERE topic >= 4;
ANALYZE early;

SELECT 'stale centroids' AS state, round(avg(hit) / 10.0, 3) AS recall_at_10
FROM queries q, LATERAL (SELECT count(*) FILTER (WHERE id IN (SELECT id FROM truth t WHERE t.qid = q.qid)) AS hit
  FROM (SELECT id FROM early ORDER BY embedding <-> q.v LIMIT 10) a) x;

REINDEX INDEX early_ivf;

SELECT 'after REINDEX' AS state, round(avg(hit) / 10.0, 3) AS recall_at_10
FROM queries q, LATERAL (SELECT count(*) FILTER (WHERE id IN (SELECT id FROM truth t WHERE t.qid = q.qid)) AS hit
  FROM (SELECT id FROM early ORDER BY embedding <-> q.v LIMIT 10) a) x;`,
        note: 'Centroids trained on 4 topics cannot separate the other 36, so recall drops to about 0.6–0.7. `REINDEX` re-runs k-means on all rows and recall returns to about 0.99–1.0 (k-means starts from a random sample, so the exact figures vary by build).' },
      { label: 'Empty table warning', sql: `CREATE TABLE fresh (id int, embedding vector(32));
CREATE INDEX ON fresh USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

DO $$ BEGIN
  CREATE INDEX ON fresh USING ivfflat (embedding vector_l1_ops);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'L1 index: %', SQLERRM;
END $$;
DO $$ BEGIN
  SET ivfflat.iterative_scan = strict_order;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'strict order: %', SQLERRM;
END $$;

SELECT amname, count(*) AS opclasses FROM pg_opclass c JOIN pg_am a ON a.oid = c.opcmethod
WHERE amname IN ('hnsw', 'ivfflat') GROUP BY amname;`,
        note: 'Watch the messages: `ivfflat index created with little data`. It still builds, but its lists are meaningless. IVFFlat also rejects L1 and strict-order iterative scans. IVFFlat has 7 operator classes (L2, inner product, cosine for vector and halfvec, Hamming for bit); HNSW has 14.' },
    ],
  },
  production: {
    title: 'An IVFFlat index created by the first migration',
    context: 'A product-search team added `CREATE INDEX … USING ivfflat … WITH (lists = 1000)` to the migration that created the table, before any data was loaded. A year later the table held 3 million products.',
    problem: 'Recall was poor and some queries returned fewer rows than their LIMIT. The centroids had been computed from an empty table, so millions of rows were filed under arbitrary lists, and a single probe often hit a nearly empty one.',
    solution: 'Drop the index from the migration. Build it after the bulk load, size it with the rule of thumb (rows/1000 up to 1M rows, √rows above), set probes to about √lists, and schedule a rebuild when the data distribution changes.',
    sql: `-- 3M rows: lists ≈ sqrt(3 000 000) ≈ 1732
SET maintenance_work_mem = '4GB';
CREATE INDEX CONCURRENTLY products_ivf ON products
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 1732);
ALTER DATABASE shop SET ivfflat.probes = 42;   -- ≈ sqrt(1732)
-- later, after large imports:
REINDEX INDEX CONCURRENTLY products_ivf;`,
    outcome: 'The playground reproduces the effect at small scale: an index trained on 4 of 40 topics gives recall@10 of about 0.6–0.7; after `REINDEX` it is about 0.99–1.0.',
  },
  pitfalls: [
    { title: 'Creating the index on an empty table',
      symptom: '`NOTICE: ivfflat index created with little data` at migration time, poor recall later.',
      cause: 'IVFFlat has a training step: centroids come from rows that exist at build time.',
      fix: 'Load data first, then build. If the table starts empty, use HNSW (no training step) or rebuild IVFFlat once data exists.' },
    { title: 'probes left at 1',
      symptom: 'Recall is noticeably worse than with exact search, especially for queries near cluster borders.',
      cause: 'The default `ivfflat.probes` is 1: only the single nearest list is scanned.',
      fix: 'Start at probes ≈ √lists and measure. Set it per query with `SET LOCAL`, or per database.',
      sql: `ALTER DATABASE app SET ivfflat.probes = 10;` },
    { title: 'Expecting IVFFlat to track new data',
      symptom: 'Recall slowly degrades as the catalogue grows or shifts to new topics.',
      cause: 'Centroids never move after the build. New rows are filed into the nearest existing list, even if it is a poor fit.',
      fix: 'Rebuild after big changes with `REINDEX INDEX CONCURRENTLY`, or prefer HNSW, whose graph is updated on every insert.' },
  ],
  pointers: [
    'Build: k-means picks `lists` centroids (default 100); each row goes to its nearest list.',
    'Sizing: lists ≈ rows/1000 up to 1M rows, √rows above; probes ≈ √lists to start.',
    '`ivfflat.probes` (default 1) trades speed for recall; probes = lists makes the planner fall back to exact search.',
    'Versus HNSW: faster, smaller build; worse speed/recall trade-off; needs data first; goes stale.',
    'IVFFlat supports L2, inner product, cosine and Hamming, for `vector`, `halfvec` and `bit` (no `sparsevec`, no L1).',
  ],
  sources: ['indexes-types.html', 'sql-createindex.html', 'sql-reindex.html', 'runtime-config-resource.html', 'using-explain.html'],
}
