import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, ITEMS_SETUP, Tile } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: drag a query point over 20 two-dimensional vectors and rank them by each pgvector
 * operator. Every number is computed exactly as pgvector does: <-> sqrt of summed squares,
 * <#> NEGATIVE dot product, <=> 1 - cosine similarity, <+> summed absolute differences.
 * The dashed outline is the "k-th best" boundary: a circle for L2, a diamond for L1, a cone from
 * the origin for cosine, and a straight line for inner product.
 * The same 20 points are the playground's `pts` table.
 * ---------------------------------------------------------------------------------------------- */

const PTS: [number, number][] = [
  [0.25, 0.17], [0.5, 0.38], [0.8, 0.55], [0.95, 0.7], [0.42, 0.22],
  [-0.3, 0.25], [-0.6, 0.5], [-0.85, 0.62], [-0.45, 0.48],
  [-0.2, -0.5], [-0.3, -0.85], [-0.12, -0.3], [-0.4, -0.65],
  [0.7, -0.2], [0.3, -0.6], [0.1, 0.6], [0.9, 0.1], [-0.9, -0.1], [0.55, -0.75], [0.05, 0.05],
]
const K = 5
type Metric = 'l2' | 'ip' | 'cos' | 'l1'
const OPS: Record<Metric, { op: string; name: string; opclass: string }> = {
  l2: { op: '<->', name: 'L2 (Euclidean)', opclass: 'vector_l2_ops' },
  ip: { op: '<#>', name: 'negative inner product', opclass: 'vector_ip_ops' },
  cos: { op: '<=>', name: 'cosine distance', opclass: 'vector_cosine_ops' },
  l1: { op: '<+>', name: 'L1 (taxicab)', opclass: 'vector_l1_ops' },
}

function distance(m: Metric, a: [number, number], q: [number, number]) {
  const dot = a[0] * q[0] + a[1] * q[1]
  if (m === 'l2') return Math.hypot(a[0] - q[0], a[1] - q[1])
  if (m === 'l1') return Math.abs(a[0] - q[0]) + Math.abs(a[1] - q[1])
  if (m === 'ip') return -dot
  const na = Math.hypot(...a), nq = Math.hypot(...q)
  return na === 0 || nq === 0 ? NaN : 1 - dot / (na * nq)
}

// SVG geometry: data space [-1.15, 1.15]² mapped to a 340 × 340 box
const S = 340, R = 1.15
const px = (x: number) => ((x + R) / (2 * R)) * S
const py = (y: number) => ((R - y) / (2 * R)) * S
const ux = (sx: number) => (sx / S) * 2 * R - R
const uy = (sy: number) => R - (sy / S) * 2 * R

function Boundary({ m, q, v }: { m: Metric; q: [number, number]; v: number }) {
  const common = { fill: toneBg('accent', 8), stroke: 'var(--accent)', strokeWidth: 1.5, strokeDasharray: '5 4' }
  if (!Number.isFinite(v)) return null
  if (m === 'l2') return <motion.circle initial={false} animate={{ cx: px(q[0]), cy: py(q[1]), r: (v / (2 * R)) * S }} {...common} />
  if (m === 'l1') {
    const pts = [[q[0] + v, q[1]], [q[0], q[1] + v], [q[0] - v, q[1]], [q[0], q[1] - v]].map(([x, y]) => `${px(x)},${py(y)}`).join(' ')
    return <polygon points={pts} {...common} />
  }
  const nq = Math.hypot(...q)
  if (nq < 1e-6) return null
  const dir: [number, number] = [q[0] / nq, q[1] / nq]
  if (m === 'cos') {
    const th = Math.acos(Math.max(-1, Math.min(1, 1 - v)))
    const rot = (a: number): [number, number] => [dir[0] * Math.cos(a) - dir[1] * Math.sin(a), dir[0] * Math.sin(a) + dir[1] * Math.cos(a)]
    const L = 3
    const a = rot(th), b = rot(-th)
    const pts = th >= Math.PI - 1e-3 ? '' : `${px(0)},${py(0)} ${px(a[0] * L)},${py(a[1] * L)} ${px(b[0] * L)},${py(b[1] * L)}`
    return pts ? <polygon points={pts} {...common} /> : null
  }
  // inner product: boundary is the line x·q = -v, perpendicular to q
  const off = -v / nq
  const c: [number, number] = [dir[0] * off, dir[1] * off]
  const perp: [number, number] = [-dir[1], dir[0]]
  const L = 3
  return <line x1={px(c[0] + perp[0] * L)} y1={py(c[1] + perp[1] * L)} x2={px(c[0] - perp[0] * L)} y2={py(c[1] - perp[1] * L)} stroke="var(--accent)" strokeWidth={1.8} strokeDasharray="5 4" />
}

function DistanceViz() {
  const [m, setM] = useState<Metric>('l2')
  const [q, setQ] = useState<[number, number]>([0.45, 0.3])
  const [scan, setScan] = useState(PTS.length) // rows compared so far by the exact scan
  const [playing, setPlaying] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef(false)

  useEffect(() => {
    if (!playing) return
    if (scan >= PTS.length) { setPlaying(false); return }
    const t = setTimeout(() => setScan((s) => s + 1), 260)
    return () => clearTimeout(t)
  }, [playing, scan])

  const scored = useMemo(() => PTS.map((p, i) => ({ id: i + 1, p, d: distance(m, p, q) })), [m, q])
  // ORDER BY puts NaN after every number, exactly like PostgreSQL's float8 ordering
  const order = (a: { d: number; id: number }, b: { d: number; id: number }) =>
    (Number.isNaN(a.d) ? 1 : 0) - (Number.isNaN(b.d) ? 1 : 0) || a.d - b.d || a.id - b.id
  const heap = scored.slice(0, scan).sort(order).slice(0, K)
  const kth = heap.length === K ? heap[K - 1].d : NaN
  const inHeap = new Set(heap.map((h) => h.id))
  const done = scan >= PTS.length

  const toData = (e: RPointerEvent<SVGSVGElement>): [number, number] => {
    const el = svg.current!
    const pt = el.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(el.getScreenCTM()!.inverse())
    const c = (v: number) => Math.max(-1.1, Math.min(1.1, v))
    return [Math.round(c(ux(p.x)) * 100) / 100, Math.round(c(uy(p.y)) * 100) / 100]
  }
  const step = () => { setPlaying(false); setScan((s) => (s >= PTS.length ? 1 : s + 1)) }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Distance operator" value={m} onChange={setM} options={[['l2', '<\u200C-\u200C> L2'], ['ip', '<\u200C#\u200C> inner product'], ['cos', '<\u200C=\u200C> cosine'], ['l1', '<\u200C+\u200C> L1']]} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={step}>{done ? 'Scan again, row by row' : 'Compare next row'}</Btn>
        <Btn onClick={() => { if (done) setScan(0); setPlaying(true) }}>{playing ? 'Scanning…' : 'Play full scan'}</Btn>
        <Btn onClick={() => { setPlaying(false); setScan(PTS.length) }}>Finish</Btn>
        <span className="font-mono text-xs text-muted">query = [{q[0].toFixed(2)},{q[1].toFixed(2)}] · drag the ✕</span>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-lg border border-line bg-bg p-1">
          <svg ref={svg} viewBox={`0 0 ${S} ${S}`} className="w-full touch-none select-none" role="img" aria-label="Two-dimensional vectors and a draggable query"
            onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); setQ(toData(e)) }}
            onPointerMove={(e) => { if (drag.current) setQ(toData(e)) }}
            onPointerUp={() => { drag.current = false }} onPointerCancel={() => { drag.current = false }}>
            <defs><clipPath id="e1-dist-clip"><rect x={0} y={0} width={S} height={S} /></clipPath></defs>
            {[-1, -0.5, 0.5, 1].map((g) => (
              <g key={g}>
                <line x1={px(g)} x2={px(g)} y1={0} y2={S} stroke="var(--border)" strokeWidth={0.6} />
                <line y1={py(g)} y2={py(g)} x1={0} x2={S} stroke="var(--border)" strokeWidth={0.6} />
              </g>
            ))}
            <line x1={px(0)} x2={px(0)} y1={0} y2={S} stroke="var(--muted)" strokeWidth={0.8} />
            <line y1={py(0)} y2={py(0)} x1={0} x2={S} stroke="var(--muted)" strokeWidth={0.8} />
            <text x={px(0) + 4} y={py(0) + 12} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">origin</text>
            <g clipPath="url(#e1-dist-clip)"><Boundary m={m} q={q} v={kth} /></g>
            {(m === 'ip' || m === 'cos') && <line x1={px(0)} y1={py(0)} x2={px(q[0])} y2={py(q[1])} stroke="var(--c-new)" strokeWidth={1.4} />}
            {heap.map((h) => (
              <motion.line key={`l${h.id}`} initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} x1={px(q[0])} y1={py(q[1])} x2={px(h.p[0])} y2={py(h.p[1])} stroke="var(--c-ok)" strokeWidth={1.2} />
            ))}
            {scored.map((s, i) => {
              const seen = i < scan, top = inHeap.has(s.id), current = !done && i === scan - 1
              const t = top ? 'ok' : seen ? 'tuple' : 'muted'
              return (
                <g key={s.id}>
                  <motion.circle cx={px(s.p[0])} cy={py(s.p[1])} initial={false} animate={{ r: current ? 9 : top ? 7 : 5.5 }}
                    fill={toneBg(t, top ? 60 : 30)} stroke={current ? tone('new') : tone(t)} strokeWidth={current ? 2.5 : 1.2} />
                  <text x={px(s.p[0])} y={py(s.p[1]) - 9} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{s.id}</text>
                </g>
              )
            })}
            <g transform={`translate(${px(q[0])},${py(q[1])})`} style={{ cursor: 'grab' }}>
              <circle r={11} fill={toneBg('new', 25)} stroke="var(--c-new)" strokeWidth={1.5} />
              <path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="var(--c-new)" strokeWidth={2.4} />
            </g>
          </svg>
        </div>

        <div className="grid content-start gap-3">
          <Panel title={`ORDER BY embedding ${OPS[m].op} query LIMIT ${K}`}>
            <table className="w-full font-mono text-[12px]">
              <thead><tr className="text-left text-[11px] text-muted"><th className="pb-1">rank</th><th className="pb-1">id</th><th className="pb-1">vector</th><th className="pb-1 text-right">{OPS[m].op}</th></tr></thead>
              <tbody>
                {heap.map((h, r) => (
                  <motion.tr key={h.id} layout transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="border-t border-line">
                    <td className="py-0.5">{r + 1}</td>
                    <td className="py-0.5 font-semibold" style={{ color: tone('ok') }}>{h.id}</td>
                    <td className="py-0.5 text-muted">[{h.p[0]},{h.p[1]}]</td>
                    <td className="py-0.5 text-right tabular-nums">{Number.isNaN(h.d) ? 'NaN' : h.d.toFixed(4)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted"><Md>{
              m === 'l2' ? 'Straight-line distance. The circle through the 5th result holds exactly the top 5.'
                : m === 'l1' ? 'Sum of per-axis differences, so the boundary is a diamond. Rarely the right choice for text embeddings.'
                  : m === 'cos' ? 'Only the **angle** counts. Everything inside the cone from the origin wins, however near or far. `1 - (a <=> b)` is cosine similarity.'
                    : '`<#>` returns the **negative** dot product so that ascending order means most similar. Long vectors pointing the same way win, even far from the query.'
            }</Md></p>
            {m === 'cos' && Math.hypot(...q) < 0.02 && <p className="mt-1 text-xs" style={{ color: tone('dead') }}>A zero query has no direction: every cosine distance is NaN.</p>}
          </Panel>
          <div className="grid grid-cols-2 gap-2">
            <Tile label="rows compared" value={`${scan} / ${PTS.length}`} t={done ? 'ok' : 'new'} sub="exact search reads every row" />
            <Tile label="kept (top-N heap)" value={heap.length} sub={`best ${K} so far`} />
          </div>
          <Panel title="The same exact search at 10 000 × 32-d">
            <p className="font-mono text-[11.5px] leading-[18px]">Limit (rows=10)<br />{'  ->'} Sort  <span style={{ color: tone('new') }}>top-N heapsort  Memory: 17kB</span><br />{'      ->'} Seq Scan on items (rows=<span style={{ color: tone('dead') }}>10000</span>)<br /><span className="text-muted">Buffers: shared hit=224 · about 6 ms</span></p>
            <p className="mt-1 text-xs text-muted">Perfect recall, but the work grows with rows × dimensions. HNSW and IVFFlat indexes trade a little recall for skipping most rows.</p>
          </Panel>
        </div>
      </div>
      <Legend items={[['new', 'query / row being compared'], ['ok', 'current top 5'], ['tuple', 'already compared'], ['muted', 'not read yet'], ['accent', 'k-th best boundary']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const PTS_SQL = PTS.map((p, i) => `(${i + 1}, '[${p[0]},${p[1]}]')`).join(', ')

export const lesson: Lesson = {
  slug: 'distance-and-exact-search',
  module: 'e1',
  order: 2,
  title: 'Distance metrics and exact search',
  tldr: [
    'pgvector compares vectors with six distance operators: `<->` (L2), `<#>` (negative inner product), `<=>` (cosine), `<+>` (L1) for real-valued vectors, and `<~>` (Hamming) and `<%>` (Jaccard) for bits.',
    'Without an index, `ORDER BY embedding <-> $1 LIMIT k` is an **exact** search that computes every distance and keeps the best k, which is always correct but costs a full table scan.',
  ],
  visualizer: {
    title: 'Rank 20 vectors four different ways',
    caption: 'Drag the query ✕ and switch operators: the same points rank differently. **Compare next row** steps the exact scan one row at a time, keeping a top-5 heap.',
    Component: DistanceViz,
  },
  playground: {
    extensions: ['vector'],
    setup: `${ITEMS_SETUP}
-- the 20 two-dimensional points from the visualizer
CREATE TABLE pts (id int PRIMARY KEY, v vector(2));
INSERT INTO pts VALUES ${PTS_SQL};`,
    presets: [
      { label: 'Six operators', sql: `SELECT '[1,2,3]'::vector <-> '[3,1,2]' AS l2,
       '[1,2,3]'::vector <#> '[3,1,2]' AS neg_inner_product,
       '[1,2,3]'::vector <=> '[3,1,2]' AS cosine_distance,
       '[1,2,3]'::vector <+> '[3,1,2]' AS l1,
       '101'::bit(3) <~> '111' AS hamming,
       '101'::bit(3) <%> '111' AS jaccard;`,
        note: 'L2 = 2.449, the negative inner product = **−11** (the dot product is 11), cosine distance = 0.214, L1 = 4. Hamming counts differing bits (1). Jaccard = 1 − shared ones / all ones = 0.333.' },
      { label: 'Similarity and edge cases', sql: `SELECT inner_product('[1,2,3]'::vector, '[3,1,2]') AS inner_product,
       1 - ('[1,2,3]'::vector <=> '[3,1,2]')         AS cosine_similarity,
       '[1,1]'::vector <=> '[2,2]'                    AS same_direction,
       '[1,0]'::vector <=> '[-1,0]'                   AS opposite,
       '[0,0]'::vector <=> '[1,1]'                    AS zero_vector;`,
        note: 'Cosine distance runs from 0 (same direction, any length) to 2 (opposite). A zero vector has no direction, so its cosine distance is **NaN**.' },
      { label: 'Same query, four rankings', sql: `SELECT 'L2 <->' AS operator, string_agg(id::text, ', ' ORDER BY v <-> '[0.45,0.3]') AS top5
FROM (SELECT id, v FROM pts ORDER BY v <-> '[0.45,0.3]' LIMIT 5) a
UNION ALL
SELECT 'cosine <=>', string_agg(id::text, ', ' ORDER BY v <=> '[0.45,0.3]')
FROM (SELECT id, v FROM pts ORDER BY v <=> '[0.45,0.3]' LIMIT 5) a
UNION ALL
SELECT 'inner product <#>', string_agg(id::text, ', ' ORDER BY v <#> '[0.45,0.3]')
FROM (SELECT id, v FROM pts ORDER BY v <#> '[0.45,0.3]' LIMIT 5) a
UNION ALL
SELECT 'L1 <+>', string_agg(id::text, ', ' ORDER BY v <+> '[0.45,0.3]')
FROM (SELECT id, v FROM pts ORDER BY v <+> '[0.45,0.3]' LIMIT 5) a;`,
        note: 'These are the visualizer\'s points and its starting query. L2 picks the nearby points, inner product prefers the long vectors 4 and 3, and cosine ranks by angle only.' },
      { label: 'Exact k-NN plan', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id, embedding <-> (SELECT v FROM queries WHERE qid = 1) AS distance
FROM items
ORDER BY embedding <-> (SELECT v FROM queries WHERE qid = 1)
LIMIT 10;`,
        note: 'No index yet: **Seq Scan** reads all 10 000 rows, then **top-N heapsort** keeps only the best 10 in 17 kB of memory. This is exact search, with perfect recall.' },
      { label: 'Neighbours of a row', sql: `SELECT i.id, i.topic, round((i.embedding <-> s.embedding)::numeric, 4) AS distance
FROM items i, items s
WHERE s.id = 1 AND i.id <> s.id
ORDER BY i.embedding <-> s.embedding
LIMIT 5;`,
        note: '"More like this" for an existing row: join to the row, exclude it, order by distance. All five neighbours share item 1\'s topic, because the data is clustered.' },
      { label: 'Normalised: same order', sql: `WITH q AS (SELECT l2_normalize(v) AS v FROM queries WHERE qid = 1),
n AS (SELECT id, l2_normalize(embedding) AS e FROM items)
SELECT (SELECT array_agg(id) FROM (SELECT id FROM n, q ORDER BY e <-> q.v LIMIT 5) a) AS by_l2,
       (SELECT array_agg(id) FROM (SELECT id FROM n, q ORDER BY e <=> q.v LIMIT 5) a) AS by_cosine,
       (SELECT array_agg(id) FROM (SELECT id FROM n, q ORDER BY e <#> q.v LIMIT 5) a) AS by_inner_product;`,
        note: 'For unit-length vectors the three metrics give the **same ranking**. Many embedding models return normalised vectors, so inner product (the cheapest) is a safe choice for them.' },
    ],
  },
  production: {
    title: 'Picking the operator for a semantic search API',
    context: 'A documentation site stores 384-d sentence embeddings. The model card says the vectors are normalised to length 1 and recommends cosine similarity.',
    problem: 'The first version ranked with `ORDER BY 1 - (embedding <=> $1) DESC`, reading "highest similarity first". It returned correct rows, but it can never use a vector index, so every query scanned the whole table.',
    solution: 'Order by the raw operator, ascending, with a LIMIT. Because the vectors are unit length, inner product gives the same order as cosine and skips the normalisation work. Compute the similarity only in the select list.',
    sql: `SELECT id, title, 1 - (embedding <=> $1) AS similarity
FROM doc_chunks
ORDER BY embedding <#> $1   -- same order as <=> for unit vectors
LIMIT 10;
-- index to match (next lesson):
CREATE INDEX ON doc_chunks USING hnsw (embedding vector_ip_ops);`,
    outcome: 'Rankings were unchanged (the "Normalised: same order" preset shows why). The query shape is now index-friendly, which [HNSW indexes](/e1/hnsw) turn into a speed-up.',
  },
  pitfalls: [
    { title: 'Sorting by similarity instead of distance',
      symptom: 'An HNSW index exists but `EXPLAIN` shows `Seq Scan` + `Sort`.',
      cause: 'Indexes serve only `ORDER BY column <op> constant` **ascending** with a `LIMIT`. `1 - (a <=> b) DESC` is a different expression.',
      fix: 'Order by the operator itself and compute similarity in the select list.',
      sql: `SELECT id, 1 - (embedding <=> $1) AS similarity FROM items ORDER BY embedding <=> $1 LIMIT 10;` },
    { title: 'Reading <#> as a similarity',
      symptom: 'The "best" match has the most negative score, and code that keeps scores above a threshold keeps the worst rows.',
      cause: '`<#>` returns the **negative** inner product, because index scans only run in ascending order.',
      fix: 'Multiply by −1 for the real inner product, or call `inner_product(a, b)`.' },
    { title: 'Zero vectors in a cosine search',
      symptom: 'Some rows come back with distance `NaN`, sorted after every real distance.',
      cause: 'A vector of all zeros has no direction. Failed embedding calls often store one.',
      fix: 'Reject them at insert time with a check constraint.',
      sql: `ALTER TABLE items ADD CONSTRAINT nonzero CHECK (vector_norm(embedding) > 0);` },
  ],
  pointers: [
    '`<->` L2, `<#>` **negative** inner product, `<=>` cosine distance (0 to 2), `<+>` L1, `<~>` Hamming and `<%>` Jaccard on `bit`.',
    'Similarity: `1 - (a <=> b)` for cosine, `(a <#> b) * -1` for inner product.',
    'Unit-length vectors rank identically under L2, cosine and inner product; prefer `<#>` for them.',
    'Exact search = Seq Scan + top-N heapsort: perfect recall, cost linear in rows × dimensions.',
    'Use the distance your embedding model was trained for; the model card says which.',
  ],
  sources: ['queries-order.html', 'queries-limit.html', 'using-explain.html', 'functions-math.html', 'datatype-bit.html'],
}
