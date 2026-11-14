import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Bar, Btn, Slider, Tile, gauss, rng } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1, quantization and re-ranking. All sizes and recall figures come from the playground
 * table (2 000 × 256-d clustered vectors, 20 queries, recall@10 against exact search), measured with
 * pgvector 0.8.7. The 16-number strip shows what each representation keeps of one vector.
 * Visualizer 2, a sizing calculator: raw bytes are exact (4·d + 8, 2·d + 8, d/8 + 8 per row).
 * ---------------------------------------------------------------------------------------------- */

type Strat = 'vector' | 'halfvec' | 'bit' | 'rerank'
// pg_relation_size of each HNSW index (kB) and recall@10, measured on the playground data.
const MEAS = {
  heapKB: 2320,
  index: { vector: 2680, halfvec: 1640, bit: 664 } as Record<'vector' | 'halfvec' | 'bit', number>,
  recall: { vector: 1, halfvec: 1, bit: 0.44 },
  rerank: { 20: 0.69, 40: 0.83, 100: 0.93, 200: 0.96 } as Record<number, number>,
}
const BYTES = { vector: 4 * 256 + 8, halfvec: 2 * 256 + 8, bit: 256 / 8 + 8 }
const CANDS = [20, 40, 100, 200]

const SAMPLE = (() => { const r = rng(21); return Array.from({ length: 16 }, () => Math.round(gauss(r) * 0.6 * 1e4) / 1e4) })()
function f16(x: number) {
  if (x === 0) return 0
  const a = Math.abs(x), e = Math.floor(Math.log2(a)), step = e < -14 ? 2 ** -24 : 2 ** (e - 10)
  return Math.sign(x) * Math.round(a / step) * step
}

function QuantViz() {
  const [s, setS] = useState<Strat>('vector')
  const [cands, setCands] = useState(100)
  const order: Strat[] = ['vector', 'halfvec', 'bit', 'rerank']
  const idx = s === 'rerank' ? 'bit' : s
  const recall = s === 'rerank' ? MEAS.rerank[cands] : MEAS.recall[s]
  const t: Record<Strat, Tone> = { vector: 'tuple', halfvec: 'pointer', bit: 'new', rerank: 'ok' }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Index strategy" value={s} onChange={setS} options={[['vector', 'vector'], ['halfvec', 'halfvec index'], ['bit', 'bit index'], ['rerank', 'bit + re-rank']]} />
        <Btn primary testid="viz-next" onClick={() => setS(order[(order.indexOf(s) + 1) % order.length])}>Next strategy</Btn>
      </div>
      <Panel title="What the index keeps of one vector (first 16 of 256 numbers)">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
          {SAMPLE.map((x, i) => {
            const shown = idx === 'vector' ? String(Math.fround(x)) : idx === 'halfvec' ? String(Number(f16(x).toPrecision(8))) : x > 0 ? '1' : '0'
            const tt: Tone = idx === 'bit' ? (x > 0 ? 'ok' : 'dead') : t[s]
            return (
              <motion.div key={`${idx}-${i}`} initial={{ opacity: 0, rotateX: 90 }} animate={{ opacity: 1, rotateX: 0 }} transition={{ delay: i * 0.02 }}
                className="rounded border px-1 py-0.5 text-center font-mono text-[11px]" style={{ borderColor: tone(tt), background: toneBg(tt, 12) }}>{shown}</motion.div>
            )
          })}
        </div>
        <p className="mt-1 text-xs text-muted"><Md>{idx === 'vector' ? 'Full 4-byte floats: exact distances.' : idx === 'halfvec' ? 'Rounded to float16: distances change in the 3rd or 4th digit, which almost never changes the ranking.' : 'One bit per number (sign only). Hamming distance between bit strings is a coarse guess of the real distance.'}</Md></p>
      </Panel>
      {s === 'rerank' && (
        <Panel title="Two-phase query">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded border px-2 py-1 font-mono" style={{ borderColor: tone('new') }}>HNSW on bit(256) → {cands} candidates</span>
            <span>→</span>
            <span className="rounded border px-2 py-1 font-mono" style={{ borderColor: tone('tuple') }}>exact <code>{'<->'}</code> on full vectors</span>
            <span>→</span>
            <span className="rounded border px-2 py-1 font-mono" style={{ borderColor: tone('ok') }}>top 10</span>
          </div>
          <div className="mt-2"><Segmented label="Candidates" value={String(cands)} onChange={(v) => setCands(+v)} options={CANDS.map((c) => [String(c), `${c} candidates`] as [string, string])} /></div>
          <p className="mt-1 text-xs text-muted"><Md>{`The inner LIMIT ${cands} needs \`hnsw.ef_search\` ≥ ${cands}, or the bit index returns at most 40 candidates.`}</Md></p>
        </Panel>
      )}
      <div className="grid gap-1.5">
        <Bar label="bytes/vector" value={BYTES[idx]} max={BYTES.vector} t={t[s]} right={`${BYTES[idx]} B`} />
        <Bar label="index size" value={MEAS.index[idx]} max={MEAS.index.vector} t={t[s]} right={`${MEAS.index[idx]} kB`} />
        <Bar label="recall@10" value={recall} max={1} t={recall >= 0.95 ? 'ok' : recall >= 0.7 ? 'new' : 'dead'} right={recall.toFixed(2)} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="table (heap)" value={`${MEAS.heapKB} kB`} sub="2 000 × vector(256)" />
        <Tile label="index vs vector" value={`${Math.round((100 * MEAS.index[idx]) / MEAS.index.vector)}%`} t={t[s]} />
        <Tile label="recall@10" value={recall.toFixed(2)} t={recall >= 0.95 ? 'ok' : 'new'} />
        <Tile label="re-rank cost" value={s === 'rerank' ? `${cands} rows` : 'none'} sub="exact distances" />
      </div>
      <Legend items={[['tuple', 'full precision'], ['pointer', 'half precision'], ['new', 'binary'], ['ok', 'binary + exact re-rank']]} />
    </div>
  )
}

function SizeViz() {
  const [logRows, setLogRows] = useState(6)
  const [dims, setDims] = useState(1536)
  const rows = Math.round(10 ** logRows)
  const gb = (b: number) => (rows * b) / 1e9
  const list = useMemo(() => [
    { k: 'vector', b: 4 * dims + 8, t: 'tuple' as Tone, ok: dims <= 2000 },
    { k: 'halfvec', b: 2 * dims + 8, t: 'pointer' as Tone, ok: dims <= 4000 },
    { k: 'bit', b: dims / 8 + 8, t: 'new' as Tone, ok: true },
  ], [dims])
  const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : `${Math.round(n / 1e3)}k`)
  const fmtGB = (g: number) => (g >= 10 ? `${g.toFixed(0)} GB` : g >= 1 ? `${g.toFixed(1)} GB` : `${Math.round(g * 1000)} MB`)
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Slider label="rows" value={logRows} min={5} max={8} step={0.25} onChange={setLogRows} fmt={() => fmt(rows)} />
        <Segmented label="Dimensions" value={String(dims)} onChange={(v) => setDims(+v)} options={[['384', '384'], ['768', '768'], ['1536', '1536'], ['3072', '3072']]} />
      </div>
      <div className="grid gap-1.5">
        {list.map((x) => <Bar key={x.k} label={x.k} value={gb(x.b)} max={gb(4 * dims + 8)} t={x.t} right={<span>{fmtGB(gb(x.b))} {x.ok ? '' : <span style={{ color: tone('dead') }}>no index</span>}</span>} />)}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Tile label="raw vectors" value={fmtGB(gb(4 * dims + 8))} sub={`${rows.toLocaleString()} × (4·${dims} + 8) B`} />
        <Tile label="HNSW, vector" value={`≈ ${fmtGB(gb(4 * dims + 8) * MEAS.index.vector / MEAS.heapKB)}`} sub={`×${(MEAS.index.vector / MEAS.heapKB).toFixed(2)} of the heap, measured at 256-d`} t="tuple" />
        <Tile label="maintenance_work_mem" value={`≥ ${fmtGB(gb(4 * dims + 8) * MEAS.index.vector / MEAS.heapKB)}`} sub="for a fast in-memory HNSW build" t="new" />
      </div>
      <p className="text-xs text-muted"><Md>{'The ratio is a rough guide: the graph links cost about the same per row whatever the dimension, so at high dimensions the index approaches the size of the vectors. Measure your own with `pg_relation_size`.'}</Md></p>
    </div>
  )
}

function ProdViz() {
  const [mode, setMode] = useState<'quant' | 'size'>('quant')
  return (
    <div className="grid gap-3">
      <Segmented label="View" value={mode} onChange={setMode} options={[['quant', 'Quantize and re-rank'], ['size', 'Size it']]} />
      {mode === 'quant' ? <QuantViz /> : <SizeViz />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const recallOf = (inner: string) => `SELECT round(avg(hit) / 10.0, 3) AS recall_at_10
FROM queries q, LATERAL (
  SELECT count(*) FILTER (WHERE a.id IN (SELECT id FROM truth t WHERE t.qid = q.qid)) AS hit
  FROM (${inner}) a) x`

const rerank = (n: number) => `SET hnsw.ef_search = ${Math.max(40, n)};
SELECT ${n} AS candidates, * FROM (${recallOf(`SELECT id FROM (
    SELECT id, embedding FROM docs
    ORDER BY binary_quantize(embedding)::bit(256) <~> binary_quantize(q.v) LIMIT ${n}) c
  ORDER BY embedding <-> q.v LIMIT 10`)}) r;`

export const lesson: Lesson = {
  slug: 'pgvector-production',
  module: 'e1',
  order: 6,
  title: 'pgvector in production',
  tldr: [
    'In production the questions are memory, build time and recall: keep full vectors in the table, index a smaller form (`halfvec` or binary bits), and re-rank with exact distances.',
    'Sizing `maintenance_work_mem` for builds, checking recall against exact search, and knowing when a dedicated vector database is worth it keep a pgvector deployment fast as it grows.',
  ],
  visualizer: {
    title: 'Smaller indexes, measured',
    caption: 'Step through the four index strategies and compare bytes, index size and recall, all measured on the playground table. For **bit + re-rank**, change the candidate count. The second tab sizes a real deployment.',
    Component: ProdViz,
  },
  playground: {
    extensions: ['vector'],
    setup: `SELECT setseed(0.42);
CREATE TABLE topics AS
  SELECT t AS topic, array_agg(random() * 2 - 1 ORDER BY j)::real[] AS center
  FROM generate_series(0, 39) t, generate_series(1, 256) j GROUP BY t;
-- 2 000 documents, 256-d, clustered around 40 topics
CREATE TABLE docs (id int PRIMARY KEY, topic int NOT NULL, embedding vector(256) NOT NULL);
INSERT INTO docs
  SELECT i, t.topic, array_agg(t.center[j] + (random() - 0.5) * 3 ORDER BY j)::vector(256)
  FROM generate_series(1, 2000) i JOIN topics t ON t.topic = i % 40
  CROSS JOIN generate_series(1, 256) j GROUP BY i, t.topic;
CREATE TABLE queries AS
  SELECT q AS qid, array_agg(t.center[j] + (random() - 0.5) * 3 ORDER BY j)::vector(256) AS v
  FROM generate_series(1, 20) q JOIN topics t ON t.topic = (q * 7) % 40
  CROSS JOIN generate_series(1, 256) j GROUP BY q, t.topic;
-- exact top-10 per query: the ground truth for every recall number
CREATE TABLE truth AS
  SELECT q.qid, n.id FROM queries q, LATERAL (SELECT id FROM docs ORDER BY embedding <-> q.v LIMIT 10) n;
ANALYZE;`,
    presets: [
      { label: 'Bytes per row', sql: `SELECT pg_column_size(embedding)                  AS vector_bytes,
       pg_column_size(embedding::halfvec(256))         AS halfvec_bytes,
       pg_column_size(binary_quantize(embedding))      AS bit_bytes,
       pg_size_pretty(pg_table_size('docs'))           AS table_size
FROM docs LIMIT 1;`,
        note: 'A 256-d vector takes 4·256 + 8 = **1032 bytes**, half precision 520, and the bit form 40. The vectors are small enough to stay inline in the heap.' },
      { label: 'Full-precision HNSW', sql: `CREATE INDEX docs_hnsw ON docs USING hnsw (embedding vector_l2_ops);
SELECT pg_size_pretty(pg_relation_size('docs_hnsw')) AS index_size;
${recallOf('SELECT id FROM docs ORDER BY embedding <-> q.v LIMIT 10')};`,
        note: 'The baseline: an index somewhat larger than the table, with recall 1.0 on this data.' },
      { label: 'Half-precision index', sql: `CREATE INDEX docs_half ON docs USING hnsw ((embedding::halfvec(256)) halfvec_l2_ops);
SELECT pg_size_pretty(pg_relation_size('docs_half')) AS index_size;
EXPLAIN (COSTS OFF)
SELECT id FROM docs ORDER BY embedding::halfvec(256) <-> (SELECT v FROM queries WHERE qid = 1)::halfvec(256) LIMIT 10;
DROP INDEX docs_hnsw;
${recallOf('SELECT id FROM docs ORDER BY embedding::halfvec(256) <-> q.v::halfvec(256) LIMIT 10')};`,
        note: 'The table keeps full precision; only the index is float16. The query must repeat the **same expression** (`::halfvec(256)`) or the index is ignored. Recall is unchanged at about 60% of the index size. (Building the float16 index is slower than the full-precision one in this in-browser database; build speed on a native server can differ, so measure on your own hardware.)' },
      { label: 'Binary quantization', sql: `CREATE INDEX docs_bq ON docs USING hnsw ((binary_quantize(embedding)::bit(256)) bit_hamming_ops);
SELECT pg_size_pretty(pg_relation_size('docs_bq')) AS index_size;
${recallOf('SELECT id FROM docs ORDER BY binary_quantize(embedding)::bit(256) <~> binary_quantize(q.v) LIMIT 10')};`,
        note: 'A quarter of the size, but sign bits alone are a blunt instrument: recall is below 0.5.' },
      { label: 'Re-rank the bits', sql: `${rerank(20)}
${rerank(40)}
${rerank(100)}
${rerank(200)}
RESET hnsw.ef_search;`,
        note: 'Fetch N candidates by Hamming distance, then sort them by exact `<->` on the full vectors. 100 candidates recover about 0.93, 200 about 0.96. ef_search is raised to match each inner LIMIT.' },
      { label: 'Build memory', sql: `SET maintenance_work_mem = '1MB';
CREATE INDEX docs_tight ON docs USING hnsw (embedding vector_l2_ops);
RESET maintenance_work_mem;
DROP INDEX docs_tight;
SHOW max_parallel_maintenance_workers;`,
        note: 'Watch the messages: `hnsw graph no longer fits into maintenance_work_mem after … tuples`, and compare the run time with the "Full-precision HNSW" preset: roughly three to four times slower. This in-browser server has no parallel workers (0); a real server defaults to 2.' },
      { label: 'Deletes and REINDEX', sql: `CREATE INDEX docs_hnsw ON docs USING hnsw (embedding vector_l2_ops);
DELETE FROM docs WHERE id % 2 = 0;
VACUUM docs;
SELECT pg_size_pretty(pg_relation_size('docs_hnsw')) AS after_vacuum;
REINDEX INDEX CONCURRENTLY docs_hnsw;
SELECT pg_size_pretty(pg_relation_size('docs_hnsw')) AS after_reindex;`,
        note: 'VACUUM repairs the graph and marks space reusable but does not shrink the file. `REINDEX … CONCURRENTLY` rebuilds it at about half the size without blocking writes.' },
    ],
  },
  production: {
    title: 'Fitting 20 million 1536-d chunks on one server',
    context: 'A document-search product stores 20 M chunks with 1536-d embeddings on a 128 GB server, and wants p95 latency under 50 ms with recall@10 above 0.95.',
    problem: 'Raw vectors are 20 M × 6152 B ≈ 123 GB. A full-precision HNSW index is larger again, so neither fits in RAM, builds spill out of `maintenance_work_mem`, and queries hit disk.',
    solution: 'Keep `vector(1536)` in the table for exact re-ranking, and index binary-quantized bits (20 M × 200 B ≈ 4 GB of vectors in the index). Fetch 200 candidates by Hamming distance and re-rank them exactly. Verify recall on a sample of real queries before switching.',
    sql: `CREATE INDEX CONCURRENTLY chunks_bq ON chunks
  USING hnsw ((binary_quantize(embedding)::bit(1536)) bit_hamming_ops);

BEGIN;
SET LOCAL hnsw.ef_search = 200;
SELECT id, content FROM (
  SELECT id, content, embedding FROM chunks
  ORDER BY binary_quantize(embedding)::bit(1536) <~> binary_quantize($1)
  LIMIT 200
) c
ORDER BY embedding <=> $1
LIMIT 10;
COMMIT;`,
    outcome: 'The index shrinks by roughly 30× in vector bytes (200 B instead of 6152 B per row) and fits in memory. The playground shows the recall trade on 256-d data: bits alone about 0.44, with 200-candidate re-ranking about 0.96. High-dimensional text embeddings usually quantize well; low-dimensional ones do not, so measure first.',
  },
  pitfalls: [
    { title: 'Binary quantization without re-ranking',
      symptom: 'Results after moving to a `bit` index are noticeably worse.',
      cause: 'Sign bits keep only the rough direction of each dimension. Hamming distance cannot separate close candidates.',
      fix: 'Always re-rank a larger candidate set by the full vectors, and set `hnsw.ef_search` at least as large as that candidate LIMIT.' },
    { title: 'Expression index never used',
      symptom: 'A `halfvec` or `binary_quantize` index exists, but queries still scan the table.',
      cause: 'The ORDER BY must contain exactly the indexed expression, including the cast and its dimension.',
      fix: 'Write the query with the same expression as the index.',
      sql: `ORDER BY embedding::halfvec(1536) <=> $1::halfvec(1536) LIMIT 10` },
    { title: 'HNSW vacuum taking hours',
      symptom: 'Autovacuum on a vector table runs for a very long time after a big delete.',
      cause: 'Vacuuming HNSW must repair the graph around every deleted node.',
      fix: 'Rebuild first, then vacuum. Run pgvector 0.8.4 or later, which fixed HNSW vacuum bugs.',
      sql: `REINDEX INDEX CONCURRENTLY items_embedding_idx;
VACUUM items;` },
    { title: 'Never measuring recall',
      symptom: 'Search quality slowly drifts and nobody notices until users do.',
      cause: 'Approximate indexes fail silently: they always return plausible rows.',
      fix: 'Periodically replay a sample of real queries with `SET LOCAL enable_indexscan = off` and compare the top-k overlap with the indexed results.' },
  ],
  pointers: [
    'Store `vector`, index `halfvec` (same recall, about half the size) or bits (with re-ranking).',
    'Re-rank: inner `LIMIT N` by `<~>` on bits, outer `ORDER BY` exact distance; ef_search ≥ N.',
    'Builds: load first, `maintenance_work_mem` big enough for the graph, `max_parallel_maintenance_workers`, `CREATE INDEX CONCURRENTLY`.',
    'Maintenance: `REINDEX INDEX CONCURRENTLY` then `VACUUM` after large deletes; stay on 0.8.4+.',
    'Stay in PostgreSQL while vectors share rows, filters, transactions and backups with the rest of your data; consider a dedicated engine only when one node can no longer hold the index in memory and sharding is not an option.',
  ],
  sources: ['runtime-config-resource.html', 'sql-reindex.html', 'routine-vacuuming.html', 'sql-createindex.html', 'storage-toast.html'],
}
