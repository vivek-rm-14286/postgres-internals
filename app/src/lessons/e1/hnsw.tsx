import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, ITEMS_SETUP, Slider, Tile, l2sq, rng, type P2 } from './_kit'
import { build, makePoints, query, type Graph, type QueryTrace } from './_hnsw'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1: a real HNSW built in the browser over 60 points (m = 3, ef_construction = 12,
 * three layers). The Stepper replays one query: greedy descent through the upper layers, then the
 * ef_search beam search on layer 0, then LIMIT. Change ef_search, LIMIT or the query and the trace
 * is recomputed. Recall is measured against brute force over the same points.
 * Visualizer 2: the rules that decide whether the planner can use the index at all. Plans are the
 * ones PostgreSQL 18 + pgvector 0.8.7 print for these exact query shapes.
 * ---------------------------------------------------------------------------------------------- */

const N = 60, M = 3, EFC = 12
const PTS = makePoints(N, 7)
const G: Graph = build(PTS, M, EFC, 2, 4)
const LAYERS = [2, 1, 0]

interface VState { phase: 'intro' | 'enter' | 'upper' | 'base' | 'done'; upTo: number; baseTo: number }

function makeSteps(t: QueryTrace, ef: number, k: number): Step<VState>[] {
  const steps: Step<VState>[] = [
    { title: 'One graph, three layers', body: `Every row is a node on **layer 0**. Each node is also copied to higher layers with probability 1/m, so the upper layers are sparse: ${LAYERS.map((l) => G.level.filter((x) => x >= l).length).join(' → ')} nodes here. Each node links to its nearest neighbours: up to **m** links per upper layer, **2·m** on layer 0.`, state: { phase: 'intro', upTo: -1, baseTo: -1 } },
    { title: 'Enter at the top', body: `Every search starts at the single **entry point** on the top layer (node ${G.entry}). Few nodes and long links make the first hops cover large distances.`, state: { phase: 'enter', upTo: -1, baseTo: -1 } },
  ]
  t.upper.forEach((u, i) => steps.push({
    title: `Layer ${u.layer}: greedy descent`, body: `Move to whichever neighbour is closest to the query, until no neighbour is closer: ${u.path.length - 1} hop${u.path.length === 2 ? '' : 's'} (${u.path.join(' → ')}). That node becomes the starting point one layer down.`,
    state: { phase: 'upper', upTo: i, baseTo: -1 },
  }))
  const chunks = Math.min(3, t.base.length)
  for (let c = 0; c < chunks; c++) {
    const to = Math.round(((c + 1) * t.base.length) / chunks) - 1
    steps.push({
      title: `Layer 0: beam search (${to + 1}/${t.base.length} expansions)`,
      body: c === 0
        ? `Now keep a candidate list of size **ef_search = ${ef}**. Repeatedly take the closest unexpanded candidate, measure its neighbours, and keep any that beat the worst of the ${ef}.`
        : c === chunks - 1 ? 'The search stops when the closest unexpanded candidate is farther than the worst one in the list: nothing nearer can be reached.'
          : 'The list (orange) tightens around the query as better neighbours replace worse ones.',
      state: { phase: 'base', upTo: t.upper.length - 1, baseTo: to },
    })
  }
  const got = Math.min(k, t.result.length)
  steps.push({
    title: `Return LIMIT ${k}`, body: k > ef
      ? `The scan can only hand back what is in its list: **${got} rows**, not ${k}. With iterative scans off, \`hnsw.ef_search\` caps the rows an HNSW scan returns. Raise it to at least the LIMIT.`
      : `The closest ${k} of the ${t.result.length} candidates are returned in distance order. Green rings mark the true nearest neighbours: any orange point without a ring is a miss.`,
    state: { phase: 'done', upTo: t.upper.length - 1, baseTo: t.base.length - 1 },
  })
  return steps
}

// layer panel geometry
const PW = 220, PH = 190, PAD = 10
const X = (x: number) => PAD + x * (PW - 2 * PAD)
const Y = (y: number) => PAD + y * (PH - 2 * PAD)

function LayerPanel({ layer, s, t, q, k, exact, onPick }: { layer: number; s: VState; t: QueryTrace; q: P2; k: number; exact: Set<number>; onPick?: (p: P2) => void }) {
  const nodes = PTS.map((_, i) => i).filter((i) => G.level[i] >= layer)
  const edges: [number, number][] = []
  for (const i of nodes) for (const j of G.links[i][layer]) if (i < j || !G.links[j][layer].includes(i)) edges.push([i, j])
  const upIdx = t.upper.findIndex((u) => u.layer === layer)
  const path = layer > 0 ? (upIdx >= 0 && s.upTo >= upIdx ? t.upper[upIdx].path : []) : []
  const startNode = layer === 0 ? (t.upper.length ? t.upper[t.upper.length - 1].path.slice(-1)[0] : G.entry) : null
  const expanded = new Set<number>(), found = new Set<number>()
  let W: number[] = []
  if (layer === 0 && s.baseTo >= 0) {
    t.base.slice(0, s.baseTo + 1).forEach((e) => { expanded.add(e.expanded); e.found.forEach((f) => found.add(f)) })
    W = t.base[s.baseTo].W
  }
  const Wset = new Set(W)
  const result = s.phase === 'done' && layer === 0 ? new Set(t.result.slice(0, k)) : new Set<number>()
  const active = (s.phase === 'enter' && layer === G.top) || (s.phase === 'upper' && t.upper[s.upTo]?.layer === layer) || ((s.phase === 'base' || s.phase === 'done') && layer === 0)

  const toneOf = (i: number): Tone => result.has(i) ? 'new' : Wset.has(i) ? 'new' : expanded.has(i) || path.includes(i) ? 'accent' : found.has(i) ? 'tuple' : 'muted'
  return (
    <div className="rounded-lg border bg-bg p-1" style={{ borderColor: active ? tone('accent') : 'var(--border)' }}>
      <p className="px-1 pt-0.5 font-mono text-[11px] font-semibold" style={{ color: active ? tone('accent') : 'var(--muted)' }}>layer {layer} · {nodes.length} nodes</p>
      <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full" role="img" aria-label={`HNSW layer ${layer}`}
        onClick={onPick ? (e) => {
          const el = e.currentTarget, pt = el.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
          const p = pt.matrixTransform(el.getScreenCTM()!.inverse())
          onPick([Math.min(1, Math.max(0, (p.x - PAD) / (PW - 2 * PAD))), Math.min(1, Math.max(0, (p.y - PAD) / (PH - 2 * PAD)))])
        } : undefined} style={onPick ? { cursor: 'crosshair' } : undefined}>
        {edges.map(([a, b]) => <line key={`${a}-${b}`} x1={X(PTS[a][0])} y1={Y(PTS[a][1])} x2={X(PTS[b][0])} y2={Y(PTS[b][1])} stroke="var(--muted)" strokeWidth={0.6} opacity={0.45} />)}
        {path.length > 1 && <motion.polyline key={path.join('-')} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7 }}
          points={path.map((i) => `${X(PTS[i][0])},${Y(PTS[i][1])}`).join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2.4} />}
        {layer === 0 && s.baseTo >= 0 && t.base.slice(0, s.baseTo + 1).flatMap((e) => e.found.map((f) => (
          <line key={`f${e.expanded}-${f}`} x1={X(PTS[e.expanded][0])} y1={Y(PTS[e.expanded][1])} x2={X(PTS[f][0])} y2={Y(PTS[f][1])} stroke="var(--accent)" strokeWidth={1.1} opacity={0.7} />
        )))}
        {nodes.map((i) => {
          const tt = toneOf(i)
          return (
            <g key={i}>
              {s.phase === 'done' && layer === 0 && exact.has(i) && <circle cx={X(PTS[i][0])} cy={Y(PTS[i][1])} r={7.5} fill="none" stroke="var(--c-ok)" strokeWidth={1.8} />}
              <motion.circle cx={X(PTS[i][0])} cy={Y(PTS[i][1])} initial={false}
                animate={{ r: result.has(i) ? 5 : tt === 'muted' ? 3 : 4 }} fill={tt === 'muted' ? 'var(--surface-2)' : toneBg(tt, 75)} stroke={tone(tt)} strokeWidth={1} />
            </g>
          )
        })}
        {layer === G.top && s.phase !== 'intro' && <circle cx={X(PTS[G.entry][0])} cy={Y(PTS[G.entry][1])} r={8} fill="none" stroke="var(--c-header)" strokeWidth={2} strokeDasharray="3 2" />}
        {layer === 0 && startNode !== null && (s.phase === 'base' || s.phase === 'done') && <circle cx={X(PTS[startNode][0])} cy={Y(PTS[startNode][1])} r={8} fill="none" stroke="var(--c-header)" strokeWidth={2} strokeDasharray="3 2" />}
        <g transform={`translate(${X(q[0])},${Y(q[1])})`}>
          <path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="var(--c-dead)" strokeWidth={2.4} />
        </g>
      </svg>
    </div>
  )
}

function GraphSearch() {
  const [ef, setEf] = useState(6)
  const [k, setK] = useState(5)
  const [q, setQ] = useState<P2>([0.58, 0.47])
  const [seed, setSeed] = useState(1)
  const t = useMemo(() => query(G, q, ef), [q, ef])
  const steps = useMemo(() => makeSteps(t, ef, k), [t, ef, k])
  const exactList = useMemo(() => PTS.map((p, i) => [l2sq(p, q), i] as const).sort((a, b) => a[0] - b[0]).slice(0, k).map((x) => x[1]), [q, k])
  const exact = new Set(exactList)
  const got = t.result.slice(0, k)
  const hits = got.filter((i) => exact.has(i)).length
  const newQuery = () => { const r = rng(seed * 7919); setQ([0.08 + r() * 0.84, 0.08 + r() * 0.84]); setSeed((s) => s + 1) }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Slider label="hnsw.ef_search" value={ef} min={1} max={20} onChange={setEf} />
        <Slider label="LIMIT" value={k} min={1} max={12} onChange={setK} />
        <Btn onClick={newQuery}>Random query</Btn>
      </div>
      <Stepper steps={steps} interval={2000} render={(s) => (
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LAYERS.map((l) => (
              <div key={l} className={l === 0 ? 'col-span-2 sm:col-span-1' : ''}>
                <LayerPanel layer={l} s={s} t={t} q={q} k={k} exact={exact} onPick={l === 0 ? setQ : undefined} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="rows returned" value={`${Math.min(k, t.result.length)} / ${k}`} t={k > ef ? 'dead' : 'ok'} sub={k > ef ? 'capped by ef_search' : 'LIMIT satisfied'} />
            <Tile label={`recall@${k}`} value={(hits / k).toFixed(2)} t={hits === k ? 'ok' : 'new'} sub="vs exact search" />
            <Tile label="distances computed" value={t.distCalcs} sub={`exact search: ${N}`} />
            <Tile label="build settings" value={`m=${M}`} sub={`ef_construction=${EFC}`} />
          </div>
        </div>
      )} />
      <Legend items={[['header', 'entry / start node'], ['accent', 'greedy path, expanded'], ['tuple', 'measured'], ['new', 'in the ef_search list / returned'], ['ok', 'true nearest (ring)'], ['dead', 'query ✕']]} />
      <p className="text-xs text-muted"><Md>{'Click layer 0 to move the query. Measured on the playground\'s 10 000 × 32-d table (default m = 16): recall@10 is about **0.5 at ef_search = 5** (only 5 rows come back), **0.98 at 10** and **1.0 from 20**. `LIMIT 100` returns **40 rows** at the default ef_search of 40.'}</Md></p>
    </div>
  )
}

/* ---- Visualizer 2: will the planner use the index? ---- */
type Form = 'asc' | 'desc' | 'expr'
function IndexRules() {
  const [opclass, setOpclass] = useState<'l2' | 'cos'>('l2')
  const [op, setOp] = useState<'<->' | '<=>' | '<#>'>('<->')
  const [form, setForm] = useState<Form>('asc')
  const [limit, setLimit] = useState(true)
  const opOk = (opclass === 'l2' && op === '<->') || (opclass === 'cos' && op === '<=>')
  const used = opOk && form === 'asc' && limit
  const orderBy = form === 'asc' ? `embedding ${op} $1` : form === 'desc' ? `embedding ${op} $1 DESC` : `1 - (embedding ${op} $1) DESC`
  const sortKey = form === 'expr' ? `('1'::double precision - (embedding ${op} $1)) DESC` : `(embedding ${op} $1)${form === 'desc' ? ' DESC' : ''}`
  const plan = used
    ? ['Limit', '  ->  Index Scan using items_hnsw on items', `        Order By: (embedding ${op} $1)`]
    : [...(limit ? ['Limit', '  ->  Sort'] : ['Sort']), `${limit ? '        ' : '  '}Sort Key: ${sortKey}`, `${limit ? '        ->  ' : '  ->  '}Seq Scan on items`]
  const why = !opOk ? `The index was built with \`vector_${opclass}_ops\`, which serves only \`${opclass === 'l2' ? '<->' : '<=>'}\`. Each operator needs its own index.`
    : form === 'desc' ? 'Index scans return nearest first only. `DESC` (farthest first) needs a full sort.'
      : form === 'expr' ? 'The ORDER BY is an expression *around* the operator, so it no longer matches the index. Compute the similarity in the select list instead.'
        : !limit ? 'Without `LIMIT` the planner would have to return every row in order, so it sorts the whole table.'
          : 'Raw operator, ascending, a LIMIT, and the opclass matches: the planner can walk the graph.'
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Panel title="Index">
          <Segmented label="Operator class" value={opclass} onChange={setOpclass} options={[['l2', 'vector_l2_ops'], ['cos', 'vector_cosine_ops']]} />
        </Panel>
        <Panel title="Query">
          <div className="flex flex-wrap gap-2">
            <Segmented label="Operator" value={op} onChange={setOp} options={[['<->', '<\u200C-\u200C>'], ['<=>', '<\u200C=\u200C>'], ['<#>', '<\u200C#\u200C>']]} />
            <Segmented label="ORDER BY form" value={form} onChange={setForm} options={[['asc', 'op ASC'], ['desc', 'op DESC'], ['expr', '1 - op DESC']]} />
            <Segmented label="LIMIT" value={limit ? 'y' : 'n'} onChange={(v) => setLimit(v === 'y')} options={[['y', 'LIMIT 10'], ['n', 'no LIMIT']]} />
          </div>
        </Panel>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-line bg-code px-3 py-2 font-mono text-[11.5px] leading-[18px] scrollbar-thin">{`CREATE INDEX items_hnsw ON items USING hnsw (embedding vector_${opclass}_ops);\n\nSELECT id FROM items ORDER BY ${orderBy}${limit ? ' LIMIT 10' : ''};`}</pre>
      <motion.div key={plan.join('|')} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border px-3 py-2"
        style={{ borderColor: tone(used ? 'ok' : 'dead'), background: toneBg(used ? 'ok' : 'dead', 8) }}>
        <p className="mb-1 text-sm font-semibold" style={{ color: tone(used ? 'ok' : 'dead') }}>{used ? 'Approximate: index scan' : 'Exact: sequential scan + sort'}</p>
        <pre className="overflow-x-auto font-mono text-[11.5px] leading-[18px]">{plan.join('\n')}</pre>
        <p className="mt-1 text-xs text-muted"><Md>{why}</Md></p>
      </motion.div>
      <Panel title="Rows an HNSW cosine index never returns">
        <div className="grid grid-cols-2 gap-2 font-mono text-[11.5px] sm:grid-cols-4">
          {[['1', '[0,0]', false, 'zero vector'], ['2', '[1,1]', true, ''], ['3', 'NULL', false, 'NULL'], ['4', '[1,2]', true, '']].map(([id, v, inIdx, why2]) => (
            <div key={String(id)} className="rounded border px-2 py-1" style={{ borderColor: tone(inIdx ? 'ok' : 'dead'), background: toneBg(inIdx ? 'ok' : 'dead', 10) }}>
              id {id} · {v}<br /><span className="text-muted">{inIdx ? 'indexed' : `skipped: ${why2}`}</span>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted"><Md>{'Cosine indexes normalise every vector first. A zero vector cannot be normalised, and NULLs are never indexed, so an index scan returns rows 2 and 4 only. A sequential scan returns all four (NaN and NULL sort last).'}</Md></p>
      </Panel>
    </div>
  )
}

function HnswViz() {
  const [mode, setMode] = useState<'graph' | 'rules'>('graph')
  return (
    <div className="grid gap-3">
      <Segmented label="View" value={mode} onChange={setMode} options={[['graph', 'Graph search'], ['rules', 'Will the index be used?']]} />
      {mode === 'graph' ? <GraphSearch /> : <IndexRules />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const Q1 = '(SELECT v FROM queries WHERE qid = 1)'

export const lesson: Lesson = {
  slug: 'hnsw',
  module: 'e1',
  order: 3,
  title: 'HNSW indexes',
  tldr: [
    'An **HNSW** index is a layered proximity graph: a search drops in at a sparse top layer, walks greedily toward the query, and finishes with a beam search of width `hnsw.ef_search` on the bottom layer.',
    'It visits a small fraction of the rows, so k-NN queries get much faster in exchange for **approximate** results whose recall you tune with `m`, `ef_construction` and `ef_search`.',
  ],
  visualizer: {
    title: 'Search a real HNSW graph, layer by layer',
    caption: 'Step through one query from the entry point down to layer 0. Then drag **ef_search** below **LIMIT** and watch the result count drop. The second tab shows which query shapes can use the index at all.',
    Component: HnswViz,
  },
  playground: {
    extensions: ['vector'],
    setup: ITEMS_SETUP,
    presets: [
      { label: 'Build the index', sql: `CREATE INDEX items_hnsw ON items USING hnsw (embedding vector_l2_ops);

SELECT pg_size_pretty(pg_relation_size('items'))      AS heap,
       pg_size_pretty(pg_relation_size('items_hnsw')) AS hnsw_index;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT id FROM items ORDER BY embedding <-> ${Q1} LIMIT 10;`,
        note: 'The build takes a second or two here (m = 16, ef_construction = 64). The plan is now an **Index Scan … Order By**, under a millisecond, versus about 6 ms for the exact scan. The index is larger than the table: it stores every vector plus its links.' },
      { label: 'Recall vs ef_search', sql: `SET hnsw.ef_search = 5;   SELECT 5   AS ef_search, * FROM recall;
SET hnsw.ef_search = 10;  SELECT 10  AS ef_search, * FROM recall;
SET hnsw.ef_search = 20;  SELECT 20  AS ef_search, * FROM recall;
SET hnsw.ef_search = 40;  SELECT 40  AS ef_search, * FROM recall;
SET hnsw.ef_search = 100; SELECT 100 AS ef_search, * FROM recall;
RESET hnsw.ef_search;`,
        note: 'The `recall` view runs 20 queries with `LIMIT 10` and compares each with the exact answers stored in `truth`. At ef_search 5 you get only 5 rows, so recall is at most 0.5. At 10 it is about 0.98 and from 20 up it reaches 1.0 on this clustered data. The graph is built with random levels, so the third decimal varies between builds.' },
      { label: 'ef_search caps LIMIT', sql: `SELECT count(*) AS rows_returned
FROM (SELECT id FROM items ORDER BY embedding <-> ${Q1} LIMIT 100) a;

BEGIN;
SET LOCAL hnsw.ef_search = 100;
SELECT count(*) AS rows_returned
FROM (SELECT id FROM items ORDER BY embedding <-> ${Q1} LIMIT 100) a;
COMMIT;`,
        note: '`LIMIT 100` returns only **40 rows** at the default ef_search of 40, with no error or warning. `SET LOCAL` inside a transaction raises it for one query: now all 100 rows arrive.' },
      { label: 'A thinner graph: m = 4', sql: `DROP INDEX items_hnsw;
CREATE INDEX items_hnsw ON items USING hnsw (embedding vector_l2_ops) WITH (m = 4, ef_construction = 8);
SELECT pg_size_pretty(pg_relation_size('items_hnsw')) AS size_m4;

SET hnsw.ef_search = 10;  SELECT 10  AS ef_search, * FROM recall;
SET hnsw.ef_search = 40;  SELECT 40  AS ef_search, * FROM recall;
SET hnsw.ef_search = 100; SELECT 100 AS ef_search, * FROM recall;
RESET hnsw.ef_search;

-- back to the defaults for the next presets
DROP INDEX items_hnsw;
CREATE INDEX items_hnsw ON items USING hnsw (embedding vector_l2_ops);`,
        note: 'Fewer links and a narrow build beam make a smaller, faster-to-build index, but recall drops to about 0.4–0.5 at ef_search 10 and stays near 0.6 even at 100: a larger ef_search cannot fix it. The links are fixed at build time; ef_search only widens the walk over them.' },
      { label: 'When the index is NOT used', sql: `EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY embedding <-> ${Q1} DESC LIMIT 5;
EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY 1 - (embedding <-> ${Q1}) DESC LIMIT 5;
EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY embedding <-> ${Q1};
EXPLAIN (COSTS OFF) SELECT id FROM items ORDER BY embedding <=> ${Q1} LIMIT 5;
EXPLAIN (COSTS OFF) SELECT id FROM items WHERE embedding <-> ${Q1} < 3;`,
        note: 'Five shapes, five sequential scans: DESC, an expression around the operator, no LIMIT, the wrong operator for `vector_l2_ops`, and a distance predicate in WHERE.' },
      { label: 'Zero vectors and NULLs', sql: `CREATE TABLE nz (id int, e vector(2));
INSERT INTO nz VALUES (1, '[0,0]'), (2, '[1,1]'), (3, NULL), (4, '[1,2]');
CREATE INDEX ON nz USING hnsw (e vector_cosine_ops);

BEGIN;
SET LOCAL enable_seqscan = off;   -- force the index on this tiny table
SELECT id, e <=> '[1,1]' AS dist FROM nz ORDER BY e <=> '[1,1]' LIMIT 10;
COMMIT;

SELECT id, e <=> '[1,1]' AS dist FROM nz ORDER BY e <=> '[1,1]' LIMIT 10;`,
        note: 'Through the cosine index only rows 2 and 4 come back: the zero vector cannot be normalised and NULLs are not indexed. The sequential scan returns all four, with NaN and NULL last.' },
    ],
  },
  production: {
    title: 'A RAG pipeline that silently got 40 chunks',
    context: 'A question-answering service retrieves the 50 nearest document chunks with `ORDER BY embedding <=> $1 LIMIT 50`, then re-ranks them with a cross-encoder. It ran on exact search until an HNSW index was added.',
    problem: 'After the index went in, answer quality dipped. The retrieval step was returning **40 rows**, never 50: the default `hnsw.ef_search` of 40 caps how many rows one HNSW scan can produce, and the re-ranker never saw chunks 41–50.',
    solution: 'Set ef_search above the LIMIT for this query only, and measure recall against exact search on a sample of real questions.',
    sql: `BEGIN;
SET LOCAL hnsw.ef_search = 100;           -- >= LIMIT, with headroom for recall
SELECT id, content FROM chunks ORDER BY embedding <=> $1 LIMIT 50;
COMMIT;

-- recall check on a sample, exact path forced:
BEGIN;
SET LOCAL enable_indexscan = off;
SELECT id FROM chunks ORDER BY embedding <=> $1 LIMIT 50;
COMMIT;`,
    outcome: 'Every request now gets 50 candidates. On the playground data the same fix takes `LIMIT 100` from 40 rows to 100, and recall@10 is about 0.98 at ef_search 10 versus 0.5 at ef_search 5.',
  },
  pitfalls: [
    { title: 'LIMIT larger than ef_search',
      symptom: 'Queries return fewer rows than their LIMIT, with no error.',
      cause: 'An HNSW scan returns at most `hnsw.ef_search` rows (default 40), fewer if some are dead tuples or filtered out.',
      fix: 'Keep ef_search ≥ LIMIT, per query with `SET LOCAL`, or enable iterative scans ([Filtering and hybrid search](/e1/filtering-and-hybrid)).',
      sql: `SET LOCAL hnsw.ef_search = 200;` },
    { title: 'One index, several distance functions',
      symptom: 'Cosine queries scan the whole table although an HNSW index exists.',
      cause: 'There is no default operator class. An index built with `vector_l2_ops` only serves `<->`.',
      fix: 'Create the index with the opclass that matches the operator the application uses (`vector_cosine_ops` for `<=>`, `vector_ip_ops` for `<#>`).' },
    { title: 'Slow builds on big tables',
      symptom: 'An HNSW build runs for hours and logs `NOTICE: hnsw graph no longer fits into maintenance_work_mem after … tuples`.',
      cause: 'Once the graph outgrows `maintenance_work_mem` the build continues on disk, which is much slower. The finished index is an ordinary on-disk index of 8 kB pages, not an in-memory structure: memory decides how fast it builds, and caching decides how fast it is queried.',
      fix: 'Load the data first, raise `maintenance_work_mem` for the session (keep it well below RAM), add parallel workers, and build with `CONCURRENTLY` in production. Watch progress from a second session.',
      sql: `SET maintenance_work_mem = '8GB';
SET max_parallel_maintenance_workers = 7;  -- plus the leader process
CREATE INDEX CONCURRENTLY ON items USING hnsw (embedding vector_cosine_ops);

-- from another session: phase is "initializing", then "loading tuples"
SELECT phase, round(100.0 * blocks_done / nullif(blocks_total, 0), 1) AS "%"
FROM pg_stat_progress_create_index;` },
    { title: 'Turning m and ef_construction down to save time',
      symptom: 'Recall is poor and raising ef_search barely helps.',
      cause: 'Links are fixed at build time. A sparse graph (small `m`) or a narrow build beam (small `ef_construction`) leaves good neighbours unreachable.',
      fix: 'Start from the defaults (m = 16, ef_construction = 64, which must be at least 2·m) and raise them only when measured recall is too low.' },
  ],
  pointers: [
    'Layers: every row on layer 0; each node is promoted with probability 1/m; one entry point on top.',
    'Build: `WITH (m = 16, ef_construction = 64)`; no training step, so it can be created on an empty table.',
    'Query: `hnsw.ef_search` (default 40, 1–1000) is the beam width and also the **maximum rows returned**.',
    'Index use needs `ORDER BY embedding <op> $1 LIMIT n`, ascending, with the matching opclass.',
    'Measure recall against exact search with `SET LOCAL enable_indexscan = off`.',
  ],
  sources: ['indexes-types.html', 'sql-createindex.html', 'runtime-config-resource.html', 'using-explain.html', 'indexes-opclass.html'],
}
