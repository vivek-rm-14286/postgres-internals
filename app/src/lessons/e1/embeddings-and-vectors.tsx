import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Bar, Tile } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: what an embedding is, and exactly how pgvector stores one.
 * Twelve words carry hand-made 8-d embeddings (dimensions with a meaning, so the idea is visible).
 * The map is a real 2-D PCA projection of those 8-d vectors, computed below. The byte strip follows
 * pgvector's on-disk structs: vector/halfvec = varlena length (4) + dim (2) + unused (2) + elements;
 * sparsevec = length (4) + dim (4) + nnz (4) + unused (4) + int32 indices + float4 values;
 * bit = length (4) + bit count (4) + ceil(n/8) bytes. Sizes match pg_column_size().
 * ---------------------------------------------------------------------------------------------- */

const DIMS = ['alive', 'tame', 'wild', 'edible', 'sweet', 'machine', 'speed', 'size']
type Kind = 'animal' | 'food' | 'vehicle'
const WORDS: { w: string; k: Kind; v: number[] }[] = [
  { w: 'cat', k: 'animal', v: [0.9, 0.8, -0.3, -0.6, 0, -0.9, 0.3, -0.5] },
  { w: 'dog', k: 'animal', v: [0.9, 0.9, -0.2, -0.6, 0, -0.9, 0.4, -0.2] },
  { w: 'wolf', k: 'animal', v: [0.9, -0.7, 0.9, -0.6, 0, -0.9, 0.6, 0.1] },
  { w: 'lion', k: 'animal', v: [0.9, -0.8, 0.9, -0.6, 0, -0.9, 0.6, 0.6] },
  { w: 'apple', k: 'food', v: [0.2, 0, 0, 0.9, 0.6, -0.8, -0.8, -0.7] },
  { w: 'cake', k: 'food', v: [-0.6, 0, 0, 0.9, 0.95, -0.8, -0.8, -0.4] },
  { w: 'honey', k: 'food', v: [-0.4, 0, 0.2, 0.8, 0.9, -0.8, -0.9, -0.8] },
  { w: 'bread', k: 'food', v: [-0.6, 0, 0, 0.95, 0.1, -0.8, -0.8, -0.3] },
  { w: 'car', k: 'vehicle', v: [-0.9, 0, 0, -0.9, 0, 0.95, 0.7, 0.3] },
  { w: 'bike', k: 'vehicle', v: [-0.9, 0, 0, -0.9, 0, 0.8, 0.3, -0.4] },
  { w: 'train', k: 'vehicle', v: [-0.9, 0, 0, -0.9, 0, 0.9, 0.8, 0.95] },
  { w: 'rocket', k: 'vehicle', v: [-0.9, 0, 0, -0.9, 0, 0.7, 1, 0.9] },
]
const KIND_TONE: Record<Kind, Tone> = { animal: 'tuple', food: 'new', vehicle: 'pointer' }

/* ---- 2-D PCA of the 8-d vectors (power iteration on the covariance matrix) ---- */
function pca2(rows: number[][]): [number, number][] {
  const n = rows.length, d = rows[0].length
  const mean = Array.from({ length: d }, (_, j) => rows.reduce((s, r) => s + r[j], 0) / n)
  const X = rows.map((r) => r.map((x, j) => x - mean[j]))
  const C = Array.from({ length: d }, (_, a) => Array.from({ length: d }, (_, b) => X.reduce((s, r) => s + r[a] * r[b], 0) / n))
  const comps: number[][] = []
  for (let c = 0; c < 2; c++) {
    let v: number[] = Array.from({ length: d }, (_, j) => (j === c ? 1 : 0.3))
    for (let it = 0; it < 200; it++) {
      let w = C.map((row) => row.reduce((s, x, j) => s + x * v[j], 0))
      for (const p of comps) { const dot = w.reduce((s, x, j) => s + x * p[j], 0); w = w.map((x, j) => x - dot * p[j]) }
      const norm = Math.hypot(...w) || 1
      v = w.map((x) => x / norm)
    }
    comps.push(v)
  }
  return X.map((r) => [r.reduce((s, x, j) => s + x * comps[0][j], 0), r.reduce((s, x, j) => s + x * comps[1][j], 0)])
}
const MAP = pca2(WORDS.map((w) => w.v))
const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0))

/** Round to the nearest IEEE half-precision value, as halfvec does. */
function f16(x: number) {
  if (x === 0) return 0
  const a = Math.abs(x), e = Math.floor(Math.log2(a))
  const step = e < -14 ? 2 ** -24 : 2 ** (e - 10)
  return Math.sign(x) * Math.round(a / step) * step
}
const show = (x: number) => String(Number(x.toPrecision(8)))
/** Shortest float4 text, as PostgreSQL prints a real. */
const show4 = (x: number) => String(Number(Math.fround(x).toPrecision(7)))

type VType = 'vector' | 'halfvec' | 'sparsevec' | 'bit'
interface Field { label: string; bytes: number; t: Tone; value: string }

function layout(v: number[], type: VType): Field[] {
  const n = v.length
  if (type === 'vector' || type === 'halfvec') {
    const eb = type === 'vector' ? 4 : 2
    return [
      { label: 'length', bytes: 4, t: 'header', value: String(eb * n + 8) },
      { label: 'dim', bytes: 2, t: 'header', value: String(n) },
      { label: 'unused', bytes: 2, t: 'muted', value: '0' },
      ...v.map((x, i) => ({ label: `x[${i}]`, bytes: eb, t: 'tuple' as Tone, value: type === 'vector' ? show4(x) : show(f16(x)) })),
    ]
  }
  if (type === 'sparsevec') {
    const nz = v.map((x, i) => [i, x] as const).filter(([, x]) => x !== 0)
    return [
      { label: 'length', bytes: 4, t: 'header', value: String(8 * nz.length + 16) },
      { label: 'dim', bytes: 4, t: 'header', value: String(n) },
      { label: 'nnz', bytes: 4, t: 'header', value: String(nz.length) },
      { label: 'unused', bytes: 4, t: 'muted', value: '0' },
      ...nz.map(([i]) => ({ label: `idx`, bytes: 4, t: 'pointer' as Tone, value: String(i + 1) })),
      ...nz.map(([, x]) => ({ label: `val`, bytes: 4, t: 'tuple' as Tone, value: show4(x) })),
    ]
  }
  const bits = v.map((x) => (x > 0 ? '1' : '0')).join('')
  return [
    { label: 'length', bytes: 4, t: 'header', value: String(Math.ceil(n / 8) + 8) },
    { label: 'bit count', bytes: 4, t: 'header', value: String(n) },
    { label: 'bits', bytes: Math.ceil(n / 8), t: 'tuple', value: bits },
  ]
}

const SIZE_DIMS = [384, 768, 1536, 3072]
function sizes(d: number) {
  return [
    { type: 'vector', bytes: 4 * d + 8, limit: 2000, t: 'tuple' as Tone, f: '4·d + 8' },
    { type: 'halfvec', bytes: 2 * d + 8, limit: 4000, t: 'pointer' as Tone, f: '2·d + 8' },
    { type: 'bit', bytes: d / 8 + 8, limit: 64000, t: 'new' as Tone, f: 'd/8 + 8' },
  ]
}

function EmbeddingViz() {
  const [sel, setSel] = useState(0)
  const [type, setType] = useState<VType>('vector')
  const [norm, setNorm] = useState(false)
  const [dims, setDims] = useState(1536)
  const word = WORDS[sel]
  const vec = useMemo(() => {
    if (!norm) return word.v
    const n = Math.hypot(...word.v)
    return word.v.map((x) => x / n)
  }, [word, norm])
  const nearest = useMemo(() => WORDS.map((w, i) => ({ i, d: dist(w.v, word.v) })).filter((x) => x.i !== sel).sort((a, b) => a.d - b.d).slice(0, 2), [sel, word])
  const fields = layout(vec, type)
  const total = fields.reduce((s, f) => s + f.bytes, 0)
  const vnorm = Math.hypot(...vec)

  // map geometry
  const W = 340, H = 250, pad = 22, padR = 64
  const xs = MAP.map((p) => p[0]), ys = MAP.map((p) => p[1])
  const sx = (x: number) => pad + ((x - Math.min(...xs)) / (Math.max(...xs) - Math.min(...xs))) * (W - pad - padR)
  const sy = (y: number) => pad + ((y - Math.min(...ys)) / (Math.max(...ys) - Math.min(...ys))) * (H - 2 * pad)

  // place each label right of its dot, else below, above or left, avoiding labels already placed
  const labels: { x: number; y: number; anchor: 'start' | 'end' }[] = []
  const boxes: [number, number, number, number][] = []
  WORDS.forEach((w, i) => {
    const cx = sx(MAP[i][0]), cy = sy(MAP[i][1]), lw = w.w.length * 6.8
    const tries: [number, number, 'start' | 'end'][] = [[cx + 9, cy + 4, 'start'], [cx + 6, cy + 16, 'start'], [cx + 6, cy - 9, 'start'], [cx - 9, cy + 4, 'end'], [cx - 6, cy + 16, 'end']]
    const box = ([x, y, an]: [number, number, 'start' | 'end']): [number, number, number, number] => [an === 'start' ? x : x - lw, y - 9, lw, 11]
    const hit = (b: [number, number, number, number]) => boxes.some((o) => b[0] < o[0] + o[2] && o[0] < b[0] + b[2] && b[1] < o[1] + o[3] && o[1] < b[1] + b[3])
    const pick = tries.find((t) => !hit(box(t))) ?? tries[0]
    boxes.push(box(pick)); labels.push({ x: pick[0], y: pick[1], anchor: pick[2] })
  })

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Storage type" value={type} onChange={setType} options={[['vector', 'vector'], ['halfvec', 'halfvec'], ['sparsevec', 'sparsevec'], ['bit', 'bit']]} />
        <button type="button" role="switch" aria-checked={norm} onClick={() => setNorm((n) => !n)}
          className="rounded-lg border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: norm ? tone('accent') : 'var(--border)', background: norm ? toneBg('accent', 14) : 'transparent' }}>
          l2_normalize {norm ? 'on' : 'off'}
        </button>
        <button type="button" data-testid="viz-next" onClick={() => setSel((s) => (s + 1) % WORDS.length)}
          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent">Next word →</button>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel title="Embedding space (2-D projection of 8-D)">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Words placed by their embeddings">
            {nearest.map(({ i }) => (
              <motion.line key={`${sel}-${i}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }}
                x1={sx(MAP[sel][0])} y1={sy(MAP[sel][1])} x2={sx(MAP[i][0])} y2={sy(MAP[i][1])} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 3" />
            ))}
            {WORDS.map((w, i) => {
              const t = KIND_TONE[w.k], on = i === sel
              return (
                <g key={w.w} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
                  <motion.circle cx={sx(MAP[i][0])} cy={sy(MAP[i][1])} initial={false} animate={{ r: on ? 8 : 5.5 }} fill={toneBg(t, on ? 70 : 40)} stroke={tone(t)} strokeWidth={on ? 2.5 : 1.2} />
                  <text x={labels[i].x} y={labels[i].y} textAnchor={labels[i].anchor} fontSize={11} fontWeight={on ? 700 : 500} fill="var(--text)" fontFamily="var(--font-mono)">{w.w}</text>
                </g>
              )
            })}
          </svg>
          <p className="mt-1 text-xs text-muted"><Md>{`Nearest to **${word.w}**: ${nearest.map((n) => `${WORDS[n.i].w} (${n.d.toFixed(2)})`).join(', ')}. Click any word.`}</Md></p>
        </Panel>

        <Panel title={`'${word.w}' as ${type}(8)`}>
          <div className="grid gap-1">
            {vec.map((x, i) => (
              <div key={i} className="grid grid-cols-[52px_1fr_64px] items-center gap-2 text-[11px]">
                <span className="font-mono text-muted">{DIMS[i]}</span>
                <div className="relative h-3 rounded bg-surface-2">
                  <div className="absolute top-0 left-1/2 h-full w-px bg-line" />
                  <motion.div className="absolute top-0 h-full rounded" initial={false}
                    animate={{ left: x < 0 ? `${50 + 50 * x}%` : '50%', width: `${Math.abs(50 * x)}%` }}
                    transition={{ type: 'spring', stiffness: 170, damping: 22 }} style={{ background: tone(x < 0 ? 'dead' : KIND_TONE[word.k]) }} />
                </div>
                <span className="text-right font-mono tabular-nums">{type === 'bit' ? (x > 0 ? '1' : '0') : type === 'halfvec' ? show(f16(x)) : show4(x)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted"><Md>{`Length (\`vector_norm\`) = **${vnorm.toFixed(3)}**${norm ? '. Normalised vectors all have length 1.' : '.'}`}</Md></p>
        </Panel>
      </div>

      <Panel title={`On-disk bytes: ${total} bytes (pg_column_size)`}>
        <div className="flex flex-wrap gap-1">
          <AnimatePresence initial={false} mode="popLayout">
            {fields.map((f, i) => (
              <motion.div key={`${type}-${i}`} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="rounded border px-1 py-0.5 font-mono text-[10.5px] leading-tight"
                style={{ minWidth: Math.max(34, f.bytes * 11), borderColor: tone(f.t), background: toneBg(f.t, 16) }}>
                <div className="text-muted">{f.label} · {f.bytes}B</div>
                <div className="font-semibold">{f.value}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <p className="mt-2 text-xs text-muted"><Md>{
          type === 'vector' ? 'Each element is a 4-byte `real`. Total = **4·d + 8**: an 8-byte header, then the floats.'
            : type === 'halfvec' ? 'Each element is rounded to a 2-byte float16 (watch the last digits change). Total = **2·d + 8**. Largest value: 65504.'
              : type === 'sparsevec' ? 'Only non-zero elements are stored, as 1-based index + value pairs. Total = **8·nnz + 16**. It pays off only when most elements are zero, as with learned sparse models: one dimension per vocabulary term, tens of thousands wide, with only the terms of one text non-zero.'
                : '`binary_quantize()` keeps one bit per dimension: 1 if the element is > 0, else 0. Total = **d/8 + 8**. It is a lossy summary, not a copy.'
        }</Md></p>
      </Panel>

      <Panel title="At real model sizes">
        <div className="mb-2"><Segmented label="Dimensions" value={String(dims)} onChange={(v) => setDims(+v)} options={SIZE_DIMS.map((d) => [String(d), `${d}-d`] as [string, string])} /></div>
        <div className="grid gap-1.5">
          {sizes(dims).map((s) => (
            <Bar key={s.type} label={s.type} value={s.bytes} max={4 * 3072 + 8} t={s.t}
              right={<span>{s.bytes.toLocaleString()} B {dims <= s.limit ? <span style={{ color: tone.text('ok') }}>✓</span> : <span style={{ color: tone.text('dead') }}>✗</span>}</span>} />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Tile label="1M rows as vector" value={`${((1e6 * (4 * dims + 8)) / 1e9).toFixed(2)} GB`} />
          <Tile label="1M rows as halfvec" value={`${((1e6 * (2 * dims + 8)) / 1e9).toFixed(2)} GB`} t="pointer" />
          <Tile label="HNSW / IVFFlat limit" value={dims <= 2000 ? 'vector ok' : 'halfvec or bit'} t={dims <= 2000 ? 'ok' : 'dead'} sub="2000 / 4000 / 64000 dims" />
        </div>
      </Panel>
      <Legend items={[['header', 'header field'], ['tuple', 'element data'], ['pointer', 'sparse index'], ['dead', 'negative value'], ['muted', 'padding']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const TRY_SQL = `
CREATE FUNCTION try_sql(stmt text) RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  EXECUTE stmt;
  RETURN 'OK';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END $fn$;`

export const lesson: Lesson = {
  slug: 'embeddings-and-vectors',
  module: 'e1',
  order: 1,
  title: 'Embeddings and the vector type',
  tldr: [
    'An **embedding** is a fixed-length list of numbers that a model produces for a piece of text or an image, and pgvector stores it in a `vector(n)` column.',
    'Similar meanings land close together in that space, so storing embeddings next to your rows turns "find related things" into a plain SQL query.',
  ],
  visualizer: {
    title: 'An embedding, from meaning to bytes',
    caption: 'Click a word (or **Next word**) to see its 8 numbers and its nearest neighbours. Switch the storage type to see the exact byte layout, then compare sizes at real model dimensions.',
    Component: EmbeddingViz,
  },
  playground: {
    extensions: ['vector'],
    setup: `${TRY_SQL}
CREATE TABLE words (
  id        int PRIMARY KEY,
  word      text NOT NULL,
  kind      text NOT NULL,
  embedding vector(8) NOT NULL   -- alive, tame, wild, edible, sweet, machine, speed, size
);
INSERT INTO words VALUES
 (1, 'cat',    'animal',  '[0.9,0.8,-0.3,-0.6,0,-0.9,0.3,-0.5]'),
 (2, 'dog',    'animal',  '[0.9,0.9,-0.2,-0.6,0,-0.9,0.4,-0.2]'),
 (3, 'wolf',   'animal',  '[0.9,-0.7,0.9,-0.6,0,-0.9,0.6,0.1]'),
 (4, 'lion',   'animal',  '[0.9,-0.8,0.9,-0.6,0,-0.9,0.6,0.6]'),
 (5, 'apple',  'food',    '[0.2,0,0,0.9,0.6,-0.8,-0.8,-0.7]'),
 (6, 'cake',   'food',    '[-0.6,0,0,0.9,0.95,-0.8,-0.8,-0.4]'),
 (7, 'honey',  'food',    '[-0.4,0,0.2,0.8,0.9,-0.8,-0.9,-0.8]'),
 (8, 'bread',  'food',    '[-0.6,0,0,0.95,0.1,-0.8,-0.8,-0.3]'),
 (9, 'car',    'vehicle', '[-0.9,0,0,-0.9,0,0.95,0.7,0.3]'),
 (10,'bike',   'vehicle', '[-0.9,0,0,-0.9,0,0.8,0.3,-0.4]'),
 (11,'train',  'vehicle', '[-0.9,0,0,-0.9,0,0.9,0.8,0.95]'),
 (12,'rocket', 'vehicle', '[-0.9,0,0,-0.9,0,0.7,1,0.9]');`,
    presets: [
      { label: 'Read vectors', sql: `SELECT extversion FROM pg_extension WHERE extname = 'vector';

SELECT word, kind, embedding,
       vector_dims(embedding) AS dims,
       round(vector_norm(embedding)::numeric, 3) AS length
FROM words ORDER BY id;`,
        note: 'The extension is called `vector` (version 0.8.7). A vector literal is a bracketed list. `vector_dims` gives the length of the list, `vector_norm` its geometric length.' },
      { label: 'Nearest words', sql: `SELECT w.word, round((w.embedding <-> c.embedding)::numeric, 3) AS distance
FROM words w, words c
WHERE c.word = 'wolf' AND w.word <> 'wolf'
ORDER BY w.embedding <-> c.embedding
LIMIT 4;`,
        note: '`<->` is the straight-line distance between two vectors. Lion and dog come first because their numbers are closest to wolf\'s. [Distance metrics](/e1/distance-and-exact-search) covers every operator.' },
      { label: 'Bytes per type', sql: `SELECT pg_column_size('[1,2,3]'::vector)  AS vector_3d,
       pg_column_size('[1,2,3]'::halfvec) AS halfvec_3d,
       pg_column_size(array_fill(0.5::real, ARRAY[1536])::vector)  AS vector_1536,
       pg_column_size(array_fill(0.5::real, ARRAY[1536])::halfvec) AS halfvec_1536,
       pg_column_size(repeat('1', 1536)::bit(1536))                AS bit_1536,
       pg_column_size('{1:0.9,3:0.5}/8'::sparsevec)                AS sparse_2nnz;`,
        note: '20 = 4·3 + 8, 14 = 2·3 + 8, 6152 = 4·1536 + 8, 3080 = 2·1536 + 8, 200 = 1536/8 + 8, and 32 = 8·2 + 16. The formulas are exact.' },
      { label: 'Errors you will meet', sql: `SELECT stmt, try_sql(stmt) AS result FROM (VALUES
  ($$SELECT '[1,2]'::vector(3)$$),
  ($$SELECT '[1,2]'::vector <-> '[1,2,3]'$$),
  ($$SELECT '[1,NaN]'::vector$$),
  ($$SELECT '[65520]'::halfvec$$),
  ($$SELECT array_fill(1, ARRAY[16001])::vector$$),
  ($$INSERT INTO words VALUES (13, 'x', 'x', '[1,2,3]')$$)
) t(stmt);`,
        note: 'The type checks the dimension count on every value, rejects NaN and infinity, and caps storage at 16 000 dimensions. halfvec overflows above 65504.' },
      { label: 'halfvec, sparsevec, bit', sql: `SELECT '[0.1,0.2,0.3333333]'::vector  AS as_vector,
       '[0.1,0.2,0.3333333]'::halfvec AS as_halfvec;

SELECT word,
       embedding::halfvec(8)       AS half,
       embedding::sparsevec(8)     AS sparse,
       binary_quantize(embedding)  AS bits
FROM words WHERE kind = 'vehicle';`,
        note: 'halfvec keeps about 3 significant digits: 0.1 becomes 0.099975586. The sparse form lists only non-zero positions (1-based). `binary_quantize` keeps only the sign of each element.' },
      { label: 'Normalise and average', sql: `SELECT word, l2_normalize(embedding) AS unit,
       round(vector_norm(l2_normalize(embedding))::numeric, 6) AS length
FROM words WHERE id <= 2;

SELECT kind, avg(embedding) AS centroid
FROM words GROUP BY kind ORDER BY kind;`,
        note: '`l2_normalize` scales a vector to length 1 without changing its direction. `avg()` works on vectors element by element, which gives the centre of each group.' },
      { label: 'Big vectors live in TOAST', sql: `DROP TABLE IF EXISTS docs;
CREATE TABLE docs (id int PRIMARY KEY, embedding vector(1536));
INSERT INTO docs
  SELECT g, array_fill(0.5::real, ARRAY[1536])::vector FROM generate_series(1, 100) g;

SELECT attstorage FROM pg_attribute
WHERE attrelid = 'docs'::regclass AND attname = 'embedding';

SELECT pg_size_pretty(pg_relation_size('docs')) AS main_heap,
       pg_size_pretty(pg_relation_size(reltoastrelid)) AS toast
FROM pg_class WHERE relname = 'docs';`,
        note: 'Storage `e` (EXTERNAL) means out-of-line and uncompressed. A 6 KB vector is above the 2 KB TOAST threshold, so the main heap holds only small pointers (one 8192-byte page for 100 rows) and the vectors sit in the 800 kB TOAST table.' },
    ],
  },
  production: {
    title: 'Sizing an embeddings column before the first insert',
    context: 'A support team wants "similar tickets" next to every new ticket. Their model returns 1536 numbers per ticket, and they expect 2 million tickets.',
    problem: 'Nobody had sized the column. Stored as `vector(1536)`, each embedding is 6152 bytes, so the vectors alone are about 12.3 GB, more than the RAM of the instance they planned.',
    solution: 'Declare the column with the exact model dimension so wrong-sized inserts fail loudly. Keep full precision in the table, and plan a half-precision index ([HNSW](/e1/hnsw), [pgvector in production](/e1/pgvector-production)). Store the model name, because vectors from different models cannot be compared.',
    sql: `CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE ticket_embeddings (
  ticket_id bigint PRIMARY KEY REFERENCES tickets,
  model     text NOT NULL DEFAULT 'embed-v3',
  embedding vector(1536) NOT NULL
);
-- raw size check: rows x (4 * dims + 8)
SELECT pg_size_pretty(2000000 * (4 * 1536 + 8)::bigint);  -- 11 GB (12.3 GB decimal)`,
    outcome: 'The arithmetic (2 M × 6152 B) settled the hardware question before launch. As `halfvec(1536)` the same data would be 2 M × 3080 B, about 6.2 GB.',
  },
  pitfalls: [
    { title: 'Dimension does not match the model',
      symptom: '`ERROR: expected 1536 dimensions, not 3072` after someone switches to a bigger embedding model.',
      cause: 'A `vector(n)` column checks the count on every insert. A new model has a different size, and its vectors are not comparable with the old ones anyway.',
      fix: 'Treat a model change as a migration: add a new column (or a `model` key), re-embed every row, build its index, then switch reads over.',
      sql: `ALTER TABLE items ADD COLUMN embedding_v2 vector(3072);` },
    { title: 'Expecting the database to make embeddings',
      symptom: 'Searching for `CREATE EMBEDDING` or a function that turns text into a vector.',
      cause: 'pgvector stores, compares and indexes vectors. It does not run models.',
      fix: 'Call the model in your application or a job, then `INSERT` (or `COPY … FORMAT BINARY` for bulk loads) the resulting numbers.' },
    { title: 'Indexing vectors wider than 2000 dimensions',
      symptom: '`ERROR: column cannot have more than 2000 dimensions for hnsw index` on a 3072-d column.',
      cause: 'An index entry must fit on one 8 KB page. 2000 × 4 bytes is the ceiling for `vector`.',
      fix: 'Index a half-precision expression (up to 4000 dims) or binary-quantized bits (up to 64 000), as shown in [pgvector in production](/e1/pgvector-production).',
      sql: `CREATE INDEX ON items USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);` },
  ],
  pointers: [
    '`CREATE EXTENSION vector;` adds `vector`, `halfvec`, `sparsevec`, distance operators and two index types.',
    '`vector(n)`: 4-byte floats, **4·n + 8** bytes, up to 16 000 dims stored and 2000 dims indexed.',
    '`halfvec(n)`: **2·n + 8** bytes, about 3 significant digits, max value 65504, indexable to 4000 dims.',
    '`sparsevec`: `{index:value,…}/dims`, 1-based, **8·nnz + 16** bytes. `bit(n)`: **n/8 + 8** bytes, from `binary_quantize()`.',
    'Large vectors are stored out of line in [TOAST](/m2/toast) without compression; random floats do not compress anyway.',
  ],
  sources: ['storage-toast.html', 'datatype-numeric.html', 'datatype-bit.html', 'sql-createextension.html', 'functions-admin.html'],
}
