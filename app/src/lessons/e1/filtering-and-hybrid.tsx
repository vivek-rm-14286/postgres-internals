import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, ITEMS_SETUP, Slider, Tile, rng } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1, the post-filter funnel. An HNSW scan hands candidates over in distance order; the
 * WHERE clause is applied afterwards. The dot grid is a simulation of that stream (seeded): with
 * iterative scans off the scan stops after ef_search candidates; with them on it keeps going until
 * LIMIT rows pass the filter. The "measured" tile shows what the playground measures for the same
 * setting: 20 queries, LIMIT 10, recall against exact filtered search, pgvector 0.8.7.
 * Visualizer 2, Reciprocal Rank Fusion: score = Σ 1 / (k + rank). Ranks are the ones the playground's
 * `articles` query produces.
 * ---------------------------------------------------------------------------------------------- */

type Filter = 'cat' | 'anti'
type Iter = 'off' | 'strict_order' | 'relaxed_order'
const LIMIT = 10

// Measured on the playground data (avg rows returned of LIMIT 10, recall@10). HNSW build levels are
// random, so the second decimal of a rerun can differ slightly.
const MEASURED: Record<Filter, Record<Iter, Record<number, [number, number]>>> = {
  cat: { off: { 40: [3.7, 0.37], 100: [8.7, 0.87], 200: [10, 1] }, strict_order: { 40: [10, 1], 100: [10, 1], 200: [10, 1] }, relaxed_order: { 40: [10, 1], 100: [10, 1], 200: [10, 1] } },
  anti: { off: { 40: [0, 0], 100: [0, 0], 200: [0, 0] }, strict_order: { 40: [10, 0.8], 100: [10, 0.83], 200: [10, 0.87] }, relaxed_order: { 40: [10, 0.89], 100: [10, 0.9], 200: [10, 0.91] } },
}

// guided tour: the settings worth comparing, in order
const TOUR: [Filter, number, Iter][] = [['cat', 40, 'off'], ['cat', 200, 'off'], ['cat', 40, 'strict_order'], ['anti', 40, 'off'], ['anti', 200, 'off'], ['anti', 40, 'strict_order'], ['anti', 40, 'relaxed_order']]

function stream(filter: Filter, n: number) {
  const r = rng(filter === 'cat' ? 3 : 8)
  return Array.from({ length: n }, (_, i) => (filter === 'cat' ? r() < 0.1 : i < 260 ? false : r() < 0.25))
}

function FunnelViz() {
  const [filter, setFilter] = useState<Filter>('cat')
  const [ef, setEf] = useState(40)
  const [iter, setIter] = useState<Iter>('off')
  const pass = useMemo(() => stream(filter, 2000), [filter])
  const tour = () => {
    const i = TOUR.findIndex(([f, e, it]) => f === filter && e === ef && it === iter)
    const [f, e, it] = TOUR[(i + 1) % TOUR.length]
    setFilter(f); setEf(e); setIter(it)
  }
  let scanned = 0, found = 0
  if (iter === 'off') { scanned = ef; found = Math.min(LIMIT, pass.slice(0, ef).filter(Boolean).length) }
  else {
    while (found < LIMIT && scanned < pass.length) { if (pass[scanned]) found++; scanned++ }
    scanned = Math.ceil(scanned / ef) * ef // whole batches
  }
  const shownRows = Math.min(Math.ceil(scanned / 40), 9)
  const dots = pass.slice(0, shownRows * 40)
  let seen = 0
  const [rows, recall] = MEASURED[filter][iter][ef]

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Filter" value={filter} onChange={setFilter} options={[['cat', 'category = 3 (10%, unrelated to topic)'], ['anti', 'other region (25%, other clusters)']]} />
        <Btn primary testid="viz-next" onClick={tour}>Next scenario</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="hnsw.ef_search" value={String(ef)} onChange={(v) => setEf(+v)} options={[['40', 'ef_search 40'], ['100', '100'], ['200', '200']]} />
        <Segmented label="hnsw.iterative_scan" value={iter} onChange={setIter} options={[['off', 'iterative off'], ['strict_order', 'strict_order'], ['relaxed_order', 'relaxed_order']]} />
      </div>
      <Panel title={`Candidates in distance order (${scanned} scanned)`}>
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(40, minmax(0, 1fr))' }}>
          {dots.map((p, i) => {
            const inScan = i < scanned
            const kept = inScan && p && seen < LIMIT
            if (kept) seen++
            const t = !inScan ? 'muted' : kept ? 'ok' : p ? 'tuple' : 'dead'
            return (
              <motion.div key={`${filter}-${i}`} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: inScan ? 1 : 0.25, scale: 1 }}
                transition={{ delay: inScan ? Math.min(i, 360) * 0.003 : 0 }}
                className="aspect-square rounded-full" style={{ background: t === 'muted' ? 'var(--border)' : toneBg(t, t === 'dead' ? 35 : 80), border: `1px solid ${t === 'muted' ? 'var(--border)' : tone(t)}` }} />
            )
          })}
        </div>
        {scanned > shownRows * 40 && <p className="mt-1 font-mono text-[11px] text-muted">… {scanned - shownRows * 40} more candidates not drawn</p>}
        <p className="mt-2 text-xs text-muted"><Md>{iter === 'off'
          ? `One batch of **${ef}** candidates, then the scan is over. The filter keeps only ${found} of them, so the query returns **${found} rows** instead of ${LIMIT}.`
          : `The scan keeps fetching batches until ${LIMIT} rows pass the filter (or \`hnsw.max_scan_tuples\` = 20 000 is reached). ${iter === 'strict_order' ? 'Strict order returns them in exact distance order.' : 'Relaxed order may return them slightly out of order, and usually finds better ones.'}`}</Md></p>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="candidates read" value={scanned} sub={iter === 'off' ? '= ef_search' : 'batches until LIMIT'} />
        <Tile label="rows returned" value={`${found} / ${LIMIT}`} t={found === LIMIT ? 'ok' : 'dead'} />
        <Tile label="measured rows" value={rows} t={rows === LIMIT ? 'ok' : 'dead'} sub="avg of 20 queries" />
        <Tile label="measured recall@10" value={recall.toFixed(2)} t={recall >= 0.95 ? 'ok' : recall >= 0.7 ? 'new' : 'dead'} sub="vs exact filtered search" />
      </div>
      <p className="text-xs text-muted"><Md>{filter === 'cat'
        ? 'A filter unrelated to the vectors passes about 1 in 10 candidates anywhere in the stream, so a bigger batch or an iterative scan fully fixes it.'
        : 'Here the nearest rows all sit in the query\'s own region, which the filter rejects. Iterative scans restore the row count, but the walk must leave the cluster first, and recall stays below 1 at the default ef_search.'}</Md></p>
      <Legend items={[['ok', 'passes the filter, returned'], ['tuple', 'passes, beyond LIMIT'], ['dead', 'removed by the filter'], ['muted', 'never read']]} />
    </div>
  )
}

/* ---- RRF ---- */
const TITLES: Record<number, string> = {
  1: 'Reset your password', 2: 'Recover a locked account', 3: 'Password rules', 4: 'Turn on two-factor sign-in',
  5: 'Reset the router', 7: 'Forgot your username', 8: 'Cannot log in after changing email', 9: 'Change your billing date',
}
const SEMANTIC = [1, 7, 8, 2, 4] // ORDER BY embedding <=> query LIMIT 5
const KEYWORD = [1, 3, 5, 7, 9]  // ORDER BY ts_rank_cd(tsv, 'reset' | 'password') DESC LIMIT 5

function RrfViz() {
  const [k, setK] = useState(60)
  const [stage, setStage] = useState(2)
  const ids = [...new Set([...SEMANTIC, ...KEYWORD])]
  const fused = ids.map((id) => {
    const s = SEMANTIC.indexOf(id) + 1, kw = KEYWORD.indexOf(id) + 1
    const ss = s ? 1 / (k + s) : 0, ks = kw ? 1 / (k + kw) : 0
    return { id, s, kw, ss, ks, score: ss + ks }
  }).sort((a, b) => b.score - a.score || a.id - b.id)
  const max = fused[0].score
  const List = ({ title, ids: list, t }: { title: string; ids: number[]; t: 'tuple' | 'new' }) => (
    <Panel title={title}>
      <ol className="grid gap-1">
        {list.map((id, i) => (
          <motion.li key={id} layout className="flex items-center gap-2 rounded border px-2 py-1 text-xs" style={{ borderColor: tone(t), background: toneBg(t, 10) }}>
            <span className="font-mono font-bold" style={{ color: tone(t) }}>{i + 1}</span><span className="truncate">{TITLES[id]}</span>
          </motion.li>
        ))}
      </ol>
    </Panel>
  )
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Slider label="k" value={k} min={1} max={100} onChange={setK} />
        <Btn primary testid="viz-next" onClick={() => setStage((s) => (s + 1) % 3)}>{stage === 0 ? 'Fuse the lists' : stage === 1 ? 'Show scores' : 'Start over'}</Btn>
        <span className="text-xs text-muted">query: <span className="font-mono">"reset password"</span> + its embedding</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <List title="Semantic: embedding <=> q" ids={SEMANTIC} t="tuple" />
        <List title="Keyword: ts_rank_cd" ids={KEYWORD} t="new" />
        <Panel title={`Fused: Σ 1/(${k} + rank)`}>
          {stage === 0 ? <p className="text-xs text-muted"><Md>{'Each list ranks with its own scale: cosine distances and text ranks cannot be added. RRF only uses the **rank** of each row in each list.'}</Md></p> : (
            <ol className="grid gap-1">
              {fused.map((f, i) => (
                <motion.li key={f.id} layout transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="rounded border border-line px-2 py-1 text-xs">
                  <div className="flex items-center gap-2"><span className="font-mono font-bold">{i + 1}</span><span className="truncate">{TITLES[f.id]}</span></div>
                  {stage === 2 && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex h-2 flex-1 overflow-hidden rounded bg-surface-2">
                        <motion.div initial={false} animate={{ width: `${(100 * f.ss) / max}%` }} style={{ background: tone('tuple') }} />
                        <motion.div initial={false} animate={{ width: `${(100 * f.ks) / max}%` }} style={{ background: tone('new') }} />
                      </div>
                      <span className="w-14 text-right font-mono text-[10.5px] tabular-nums">{f.score.toFixed(5)}</span>
                    </div>
                  )}
                </motion.li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
      <p className="text-xs text-muted"><Md>{k <= 5
        ? `With a tiny k the top rank dominates: 1/(${k}+1) is far bigger than 1/(${k}+5), so RRF behaves like "whoever was first in either list".`
        : `With k = ${k} the scores are flat, so rows found by **both** searches win (rank 1 + 1 gives ${(2 / (k + 1)).toFixed(5)}). The semantic search finds "Recover a locked account", which shares no words with the query; the keyword search finds exact terms the embedding blurs. k = 60 is the usual default.`}</Md></p>
      <Legend items={[['tuple', 'semantic contribution'], ['new', 'keyword contribution']]} />
    </div>
  )
}

function FilterHybridViz() {
  const [mode, setMode] = useState<'filter' | 'rrf'>('filter')
  return (
    <div className="grid gap-3">
      <Segmented label="View" value={mode} onChange={setMode} options={[['filter', 'Filtered search'], ['rrf', 'Hybrid search (RRF)']]} />
      {mode === 'filter' ? <FunnelViz /> : <RrfViz />}
    </div>
  )
}



/* ------------------------------------------------------------------------------------------------ */

const recallView = (name: string, truth: string, where: string) => `
CREATE TABLE ${truth} AS
  SELECT q.qid, n.id
  FROM queries q, LATERAL (SELECT id FROM items WHERE ${where} ORDER BY embedding <-> q.v LIMIT 10) n;
CREATE VIEW ${name} AS
  SELECT round(avg(hit) / 10.0, 3) AS recall_at_10, round(avg(n), 1) AS avg_rows
  FROM queries q, LATERAL (
    SELECT count(*) AS n,
           count(*) FILTER (WHERE a.id IN (SELECT id FROM ${truth} t WHERE t.qid = q.qid)) AS hit
    FROM (SELECT id FROM items WHERE ${where} ORDER BY embedding <-> q.v LIMIT 10) a) x;`

const Q1 = '(SELECT v FROM queries WHERE qid = 1)'

export const lesson: Lesson = {
  slug: 'filtering-and-hybrid',
  module: 'e1',
  order: 5,
  title: 'Filtering and hybrid search',
  tldr: [
    'An approximate index applies `WHERE` filters **after** it finds candidates, so a filtered k-NN query can return fewer rows than its LIMIT unless you use iterative scans, a B-tree path, partial indexes or partitions.',
    '**Hybrid search** runs a vector search and a full-text search side by side and merges them with **Reciprocal Rank Fusion**, so exact keywords and fuzzy meaning both count.',
  ],
  visualizer: {
    title: 'Where filtered rows go, and how two rankings merge',
    caption: 'Pick a filter and an `ef_search`, then turn iterative scans on: watch rows returned and the measured recall. The second tab merges a semantic and a keyword ranking; drag **k** to see how RRF weighs ranks.',
    Component: FilterHybridViz,
  },
  playground: {
    extensions: ['vector'],
    setup: `${ITEMS_SETUP}
-- exact answers for two filtered searches (computed before any vector index exists)
${recallView('recall_cat', 'truth_cat', 'category = 3')}
${recallView('recall_region', 'truth_region', 'region = (q.topic + 2) % 4')}
-- a tiny help-centre corpus for hybrid search (4-d "meaning" vectors: account, security, billing, network)
CREATE TABLE articles (
  id int PRIMARY KEY, title text NOT NULL, body text NOT NULL, embedding vector(4) NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', body), 'B')) STORED
);
INSERT INTO articles VALUES
 (1, 'Reset your password', 'Open the reset link we email you and choose a new password.', '[0.92,0.30,0.02,0.05]'),
 (2, 'Recover a locked account', 'After five failed sign-ins we lock the account for an hour.', '[0.88,0.42,0.05,0.02]'),
 (3, 'Password rules', 'A strong password has at least twelve characters.', '[0.55,0.80,0.02,0.03]'),
 (4, 'Turn on two-factor sign-in', 'Add an authenticator app as a second step.', '[0.60,0.78,0.05,0.04]'),
 (5, 'Reset the router', 'Hold the button for ten seconds to restore factory settings.', '[0.05,0.10,0.02,0.99]'),
 (6, 'Update your card', 'Change the card we charge for your invoice.', '[0.10,0.05,0.98,0.05]'),
 (7, 'Forgot your username', 'We email your username and a link to reset your password.', '[0.90,0.35,0.03,0.02]'),
 (8, 'Cannot log in after changing email', 'Sign in with the new address; the old one stops working.', '[0.85,0.20,0.10,0.05]'),
 (9, 'Change your billing date', 'Support can reset the day your billing cycle starts.', '[0.05,0.05,0.95,0.20]'),
 (10,'Wi-Fi keeps dropping', 'Move the router away from walls and microwaves.', '[0.05,0.05,0.02,0.99]');
CREATE INDEX ON articles USING gin (tsv);`,
    presets: [
      { label: 'Filter after the index', sql: `CREATE INDEX items_hnsw ON items USING hnsw (embedding vector_l2_ops);

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM items WHERE category = 3
ORDER BY embedding <-> ${Q1} LIMIT 10;`,
        note: 'Look at the Index Scan node: `Filter: (category = 3)` and `Rows Removed by Filter: 39`. The scan produced its 40 candidates (ef_search) and only 1 matched, so `rows=1` for a LIMIT 10 query.' },
      { label: 'Lost rows, lost recall', sql: `SET hnsw.ef_search = 40;  SELECT 40  AS ef_search, * FROM recall_cat;
SET hnsw.ef_search = 100; SELECT 100 AS ef_search, * FROM recall_cat;
SET hnsw.ef_search = 200; SELECT 200 AS ef_search, * FROM recall_cat;
RESET hnsw.ef_search;`,
        note: 'With a 10% filter, 40 candidates leave about **4 rows** on average (recall about 0.37). A larger ef_search helps, but only because it reads more candidates for every query.' },
      { label: 'Iterative scans', sql: `SET hnsw.iterative_scan = strict_order;
SELECT 'strict_order' AS mode, * FROM recall_cat;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM items WHERE category = 3 ORDER BY embedding <-> ${Q1} LIMIT 10;

SET hnsw.iterative_scan = relaxed_order;
SELECT 'relaxed_order' AS mode, * FROM recall_cat;
RESET hnsw.iterative_scan;`,
        note: 'The index now keeps scanning until 10 rows pass: `rows=10` with well over 100 rows removed by the filter. Recall returns to 1.0, at the default ef_search of 40.' },
      { label: 'A filter against the clusters', sql: `SELECT 'off' AS iterative_scan, * FROM recall_region;
SET hnsw.iterative_scan = strict_order;  SELECT 'strict_order', * FROM recall_region;
SET hnsw.iterative_scan = relaxed_order; SELECT 'relaxed_order', * FROM recall_region;
RESET hnsw.iterative_scan;`,
        note: 'Each query asks for rows from a region its own topic is not in. Off: **0 rows**. Iterative scans return 10 rows, but recall is only about 0.8 (strict) and just under 0.9 (relaxed), varying a little between builds, because the walk starts in the wrong place.' },
      { label: 'Re-sort relaxed results', sql: `SET hnsw.iterative_scan = relaxed_order;
WITH relaxed AS MATERIALIZED (
  SELECT id, embedding <-> ${Q1} AS distance
  FROM items WHERE category = 3
  ORDER BY distance LIMIT 10
)
SELECT id, round(distance::numeric, 4) AS distance
FROM relaxed ORDER BY distance + 0;
RESET hnsw.iterative_scan;`,
        note: 'Relaxed order can be slightly out of order. Materialise the scan, then sort the 10 rows again. The `+ 0` stops PostgreSQL 17+ from assuming the CTE is already sorted.' },
      { label: 'Selective filters: go exact', sql: `UPDATE items SET category = 99 WHERE id % 1000 = 0 AND category <> 3;   -- 8 rows, under 0.1%
CREATE INDEX items_category ON items (category);
ANALYZE items;
EXPLAIN (COSTS OFF)
SELECT id FROM items WHERE category = 99 ORDER BY embedding <-> ${Q1} LIMIT 10;

-- a partial HNSW index for one hot filter value
CREATE INDEX items_hnsw_cat3 ON items USING hnsw (embedding vector_l2_ops) WHERE category = 3;
SELECT 'partial index, iterative off' AS plan, * FROM recall_cat;`,
        note: 'For a handful of matching rows the planner picks the B-tree (**Bitmap Index Scan**) and sorts them exactly: perfect recall, tiny cost. The partial HNSW index holds only category 3, so every candidate passes the filter and recall is about 1.0 without iterative scans.' },
      { label: 'Hybrid search (RRF)', sql: `WITH semantic AS (
  SELECT id, rank() OVER (ORDER BY embedding <=> '[0.95,0.30,0.05,0.03]') AS rank
  FROM articles ORDER BY embedding <=> '[0.95,0.30,0.05,0.03]' LIMIT 5
), keyword AS (
  SELECT id, rank() OVER (ORDER BY ts_rank_cd(tsv, q) DESC) AS rank
  FROM articles, websearch_to_tsquery('english', 'reset or password') q
  WHERE tsv @@ q ORDER BY ts_rank_cd(tsv, q) DESC LIMIT 5
)
SELECT coalesce(s.id, k.id) AS id, a.title,
       s.rank AS semantic_rank, k.rank AS keyword_rank,
       round(coalesce(1.0 / (60 + s.rank), 0) + coalesce(1.0 / (60 + k.rank), 0), 5) AS rrf_score
FROM semantic s
FULL OUTER JOIN keyword k ON s.id = k.id
JOIN articles a ON a.id = coalesce(s.id, k.id)
ORDER BY rrf_score DESC, id;`,
        note: 'Rows found by both searches lead (1 and 7). "Recover a locked account" comes only from the vector side, "Reset the router" only from keywords. The FULL OUTER JOIN keeps both; `coalesce(…, 0)` scores a missing side as zero.' },
      { label: 'Sparse vectors for exact codes', sql: `-- full-text search splits a product code and stems words
SELECT to_tsvector('english', 'RTX-4090 Gaming') AS tokens,
       to_tsvector('english', 'RTX-4090 Gaming') @@ plainto_tsquery('english', 'RTX 4090') AS code_matches,
       to_tsvector('english', 'organic') @@ plainto_tsquery('english', 'organization') AS stem_collision;

-- a learned sparse model gives each vocabulary term its own position and weight
-- (here 4090 = "rtx-4090", 3090 = "rtx-3090", 15 = "gaming")
CREATE TABLE parts (id int PRIMARY KEY, name text NOT NULL, terms sparsevec(30000) NOT NULL);
INSERT INTO parts VALUES
 (1, 'RTX 4090 Gaming OC', '{15:1.5,4090:3.8}/30000'),
 (2, 'RTX 3090 Gaming X', '{15:1.5,3090:3.5}/30000'),
 (3, 'Generic graphics card', '{99:1,100:1}/30000');
CREATE INDEX parts_terms ON parts USING hnsw (terms sparsevec_ip_ops);

SELECT name,
       round(((terms <#> '{15:0.5,4090:1}/30000') * -1)::numeric, 2) AS sparse_score,
       round((terms <=> '{15:0.5,4090:1}/30000')::numeric, 4) AS cosine_distance
FROM parts ORDER BY terms <#> '{15:0.5,4090:1}/30000' LIMIT 3;`,
        note: 'The parser turns `RTX-4090` into `rtx` and `-4090`, so the query "RTX 4090" misses it, while stemming makes "organization" match "organic". In the sparse vector the code is its own weighted dimension: the 4090 card scores **4.55**, the 3090 only **0.75** from the shared "gaming" term. Note the scales: an unbounded dot product next to a cosine distance between 0 and 2. `sparsevec` supports L2, inner product, cosine and L1 with HNSW only; Jaccard `<%>` exists only for `bit`.' },
    ],
  },
  production: {
    title: 'Per-tenant search in a shared embeddings table',
    context: 'A B2B knowledge-base product keeps every customer\'s document chunks in one table with a `tenant_id` column and one HNSW index. Each query filters on the tenant.',
    problem: 'Large tenants were fine, but small tenants (under 1% of rows) got 0–3 results for `LIMIT 10`: the 40 nearest candidates almost never belonged to them. Their vectors also shared one graph with everyone else\'s.',
    solution: 'Turn on iterative scans as a safety net, and give the index a per-tenant layout: list partitions for the big tenants, and a B-tree on `tenant_id` so the planner can take the exact path for tiny ones.',
    sql: `CREATE TABLE chunks (tenant_id int NOT NULL, id bigint, embedding vector(768))
  PARTITION BY LIST (tenant_id);
CREATE TABLE chunks_t42 PARTITION OF chunks FOR VALUES IN (42);
CREATE TABLE chunks_rest PARTITION OF chunks DEFAULT;
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);  -- one graph per partition
CREATE INDEX ON chunks (tenant_id);
ALTER DATABASE kb SET hnsw.iterative_scan = relaxed_order;`,
    outcome: 'Every tenant gets full result lists. In the playground the same mechanisms take a 10% filter from about 4 rows (recall 0.37) to 10 rows (recall 1.0), and a 0.1% filter is answered exactly from the B-tree.',
  },
  pitfalls: [
    { title: 'Filtered vector query returns too few rows',
      symptom: '`WHERE tenant_id = $1 ORDER BY embedding <=> $2 LIMIT 10` returns 2 rows although the tenant has thousands.',
      cause: 'The filter runs after the index scan. With ef_search 40 and a 10% filter, about 4 rows survive on average.',
      fix: 'Enable iterative scans (0.8.0+), or raise ef_search for that query.',
      sql: `SET hnsw.iterative_scan = relaxed_order;` },
    { title: 'Iterative scan over a very selective filter',
      symptom: 'A filtered query takes many milliseconds and reads tens of thousands of buffers, or returns 0 rows.',
      cause: 'The scan walks the graph until `hnsw.max_scan_tuples` (20 000) is hit, filtering almost everything out.',
      fix: 'Add a B-tree on the filter column so the planner can choose an exact scan of the few matching rows, or use a partial index or partition for that value.' },
    { title: 'Adding vector distance and text rank directly',
      symptom: 'Hybrid results are dominated by one side, and changing the text query wording flips the whole ranking.',
      cause: 'Cosine distance and `ts_rank_cd` have unrelated scales. So do a sparse dot product and a dense cosine distance: both are plain floats, but one is unbounded and the other lies between 0 and 2.',
      fix: 'Fuse by rank, not by score: Reciprocal Rank Fusion with k = 60, or re-rank the union with a cross-encoder. To trust one list more, multiply its `1/(k + rank)` term by a weight.' },
    { title: 'Ordering by the rank instead of the distance',
      symptom: 'The semantic half of a hybrid query takes milliseconds per call and `EXPLAIN` shows `Seq Scan` → `Sort` → `WindowAgg` over every row.',
      cause: 'With `ORDER BY rank LIMIT 20`, where `rank` is the `rank() OVER (…)` output, the window must number all rows before the sort can pick 20. On 10 000 rows that is 10 000 rows through the window instead of 20.',
      fix: 'Order the branch by the distance operator itself (`ORDER BY embedding <=> $1 LIMIT 20`), or take the top 20 in a subquery and number them outside. Then the index scan feeds the window and stops after 20 rows.',
      sql: `SELECT id, row_number() OVER (ORDER BY d) AS rank
FROM (SELECT id, embedding <=> $1 AS d FROM documents ORDER BY d LIMIT 20) top;` },
  ],
  pointers: [
    'Approximate indexes filter **after** the scan; with HNSW the result count is at most ef_search before filtering.',
    '`hnsw.iterative_scan = strict_order | relaxed_order` (HNSW) and `ivfflat.iterative_scan = relaxed_order` keep scanning until LIMIT is met.',
    'Selective filter: B-tree exact path. Few hot values: partial index. Many tenants: `PARTITION BY LIST`.',
    'Re-sort relaxed results with a `MATERIALIZED` CTE and `ORDER BY distance + 0`.',
    'RRF: score = Σ 1/(60 + rank) across lists, joined with `FULL OUTER JOIN`. For exact codes, a learned **sparsevec** gives each term its own weighted dimension, scored with `<#>` (HNSW indexes at most 1000 non-zeros per row).',
  ],
  sources: ['indexes-partial.html', 'ddl-partitioning.html', 'textsearch-controls.html', 'queries-with.html', 'using-explain.html'],
}
