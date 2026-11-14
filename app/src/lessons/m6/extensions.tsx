import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Tile } from './_shared'

/* ------------------------------------------------------------------------------------------------
 * Visualizer A: pg_trgm trigram extraction and similarity, computed live with pg_trgm's documented
 * rules (lower-case, split on non-alphanumerics, pad each word with two spaces before and one after,
 * deduplicate). Results match show_trgm()/similarity() in PostgreSQL 18.6 (PGlite), for example
 * similarity('postgres', 'postgis') = 0.416667.
 * Visualizer B: a greedy layered search over a small HNSW-style graph (3 layers, deterministic points),
 * the way pgvector's hnsw index answers ORDER BY embedding <-> query LIMIT k.
 * ---------------------------------------------------------------------------------------------- */

function trigrams(s: string): string[] {
  const set = new Set<string>()
  for (const w of s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
    const p = `  ${w} `
    for (let i = 0; i + 3 <= p.length; i++) set.add(p.slice(i, i + 3))
  }
  return [...set].sort()
}
const show = (t: string) => `"${t}"`

const PAIRS: [string, string][] = [['postgres', 'postgis'], ['postgres', 'postgresql'], ['caterpillar', 'caterpiler'], ['word', 'two words'], ['index', 'database']]

function TrigramViz() {
  const [i, setI] = useState(0)
  const [a, setA] = useState(PAIRS[0][0])
  const [b, setB] = useState(PAIRS[0][1])
  const ta = useMemo(() => trigrams(a), [a])
  const tb = useMemo(() => trigrams(b), [b])
  const shared = ta.filter((t) => tb.includes(t))
  const union = ta.length + tb.length - shared.length
  const sim = union ? shared.length / union : 0
  const next = () => { const n = (i + 1) % PAIRS.length; setI(n); setA(PAIRS[n][0]); setB(PAIRS[n][1]) }
  const chip = (t: string, side: 'a' | 'b') => {
    const both = shared.includes(t)
    const tt: Tone = both ? 'ok' : side === 'a' ? 'tuple' : 'header'
    return <motion.span key={side + t} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
      className="rounded px-1.5 py-0.5 font-mono text-[12px] whitespace-pre" style={{ background: toneBg(tt, both ? 28 : 16), border: `1px solid ${tone(tt)}` }}>{show(t)}</motion.span>
  }
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={next} data-testid="viz-next" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">Next pair ({i + 1}/{PAIRS.length})</button>
        <input aria-label="First string" value={a} onChange={(e) => setA(e.target.value.slice(0, 40))} className="w-40 rounded-md border border-line bg-bg px-2 py-1 font-mono text-[13px]" />
        <input aria-label="Second string" value={b} onChange={(e) => setB(e.target.value.slice(0, 40))} className="w-40 rounded-md border border-line bg-bg px-2 py-1 font-mono text-[13px]" />
        <span className="text-xs text-muted">type anything</span>
      </div>
      <Legend items={[['tuple', `only in '${a}'`], ['header', `only in '${b}'`], ['ok', 'shared']]} />
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title={`show_trgm('${a}') · ${ta.length} trigrams`}>
          <div className="flex flex-wrap gap-1"><AnimatePresence>{ta.map((t) => chip(t, 'a'))}</AnimatePresence></div>
        </Panel>
        <Panel title={`show_trgm('${b}') · ${tb.length} trigrams`}>
          <div className="flex flex-wrap gap-1"><AnimatePresence>{tb.map((t) => chip(t, 'b'))}</AnimatePresence></div>
        </Panel>
      </div>
      <Panel title="similarity = shared / (|A| + |B| − shared)">
        <div className="flex h-6 w-full overflow-hidden rounded border border-line" aria-label="Trigram overlap bar">
          <motion.div animate={{ width: `${((ta.length - shared.length) / Math.max(union, 1)) * 100}%` }} style={{ background: toneBg('tuple', 45) }} />
          <motion.div animate={{ width: `${(shared.length / Math.max(union, 1)) * 100}%` }} style={{ background: tone('ok') }} />
          <motion.div animate={{ width: `${((tb.length - shared.length) / Math.max(union, 1)) * 100}%` }} style={{ background: toneBg('header', 45) }} />
        </div>
        <p className="mt-2 font-mono text-[13px]">{shared.length} / ({ta.length} + {tb.length} − {shared.length}) = {shared.length} / {union} = <b>{sim.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}</b></p>
      </Panel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="similarity()" value={sim.toFixed(4)} t={sim > 0.3 ? 'ok' : 'dead'} />
        <Tile label="a % b (threshold 0.3)" value={sim > 0.3 ? 'true' : 'false'} t={sim > 0.3 ? 'ok' : 'dead'} />
        <Tile label="a <-> b (distance)" value={(1 - sim).toFixed(4)} />
        <Tile label="GIN keys for a" value={ta.length} sub="gin_trgm_ops stores each trigram" />
      </div>
      <p className="text-xs text-muted">Every word gets two leading spaces and one trailing space, so word starts weigh more than word ends. Non-alphanumeric characters only separate words.</p>
    </div>
  )
}

/* -------------------------------------------- HNSW -------------------------------------------- */

interface P { id: number; x: number; y: number; level: number }
const PTS: P[] = (() => {
  let seed = 7
  const r = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const lv = [2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 0]
  return lv.map((level, id) => ({ id, x: 0.06 + r() * 0.88, y: 0.08 + r() * 0.84, level }))
})()
const Q = { x: 0.8, y: 0.72 }
const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2
const M = 3
function neighbors(level: number): Map<number, number[]> {
  const pts = PTS.filter((p) => p.level >= level)
  const m = new Map<number, number[]>()
  for (const p of pts) m.set(p.id, [])
  for (const p of pts) {
    const near = pts.filter((o) => o.id !== p.id).sort((a, b) => d2(a, p) - d2(b, p)).slice(0, level === 0 ? M + 1 : M)
    for (const o of near) { if (!m.get(p.id)!.includes(o.id)) m.get(p.id)!.push(o.id); if (!m.get(o.id)!.includes(p.id)) m.get(o.id)!.push(p.id) }
  }
  return m
}
const GRAPH = [0, 1, 2].map(neighbors)

interface HS { level: number; current: number; visited: number[]; path: number[]; frontier?: number[]; result?: number[]; dist: number }
function hnswSteps(ef: number): Step<HS>[] {
  const steps: Step<HS>[] = []
  let cur = 0 // entry point: a level-2 node
  const visited = new Set<number>([cur])
  const path = [cur]
  let computed = 1
  steps.push({ title: 'Start at the entry point on the top layer', body: 'The index metapage records an **entry point** on the highest layer. Upper layers hold few nodes with long edges, like an express lane.', state: { level: 2, current: cur, visited: [...visited], path: [...path], dist: computed } })
  for (let level = 2; level >= 1; level--) {
    let improved = true
    while (improved) {
      improved = false
      for (const n of GRAPH[level].get(cur) ?? []) {
        if (!visited.has(n)) { visited.add(n); computed++ }
        if (d2(PTS[n], Q) < d2(PTS[cur], Q)) { cur = n; improved = true }
      }
      if (improved) {
        path.push(cur)
        steps.push({ title: `Layer ${level}: hop to node ${cur}`, body: `Compare the query with every neighbour of the current node and move to the closest one. **Greedy**: stop when no neighbour is closer.`, state: { level, current: cur, visited: [...visited], path: [...path], dist: computed } })
      }
    }
    steps.push({ title: `Layer ${level}: local minimum, go down`, body: `No neighbour on layer ${level} is closer than node ${cur}, so the search **descends** to layer ${level - 1}, starting from the same node.`, state: { level: level - 1, current: cur, visited: [...visited], path: [...path], dist: computed } })
  }
  // layer 0: beam search with ef candidates
  let cand = [cur]
  let best = [cur]
  const seen = new Set<number>([cur])
  while (cand.length) {
    cand.sort((a, b) => d2(PTS[a], Q) - d2(PTS[b], Q))
    const c = cand.shift()!
    const worst = best.length >= ef ? d2(PTS[best[best.length - 1]], Q) : Infinity
    if (d2(PTS[c], Q) > worst) break
    for (const n of GRAPH[0].get(c) ?? []) {
      if (seen.has(n)) continue
      seen.add(n); visited.add(n); computed++
      const w = best.length >= ef ? d2(PTS[best[best.length - 1]], Q) : Infinity
      if (d2(PTS[n], Q) < w) { cand.push(n); best.push(n); best.sort((a, b) => d2(PTS[a], Q) - d2(PTS[b], Q)); best = best.slice(0, ef) }
    }
    steps.push({ title: `Layer 0: expand node ${c}`, body: `On the bottom layer the search keeps a list of the **ef = ${ef}** best candidates (\`hnsw.ef_search\`, default 40 in pgvector) and expands them until none can improve the list.`, state: { level: 0, current: c, visited: [...visited], path: [...path], frontier: [...best], dist: computed } })
  }
  const top3 = best.slice(0, 3)
  const exact = [...PTS].sort((a, b) => d2(a, Q) - d2(b, Q)).slice(0, 3).map((p) => p.id)
  const recall = top3.filter((x) => exact.includes(x)).length
  steps.push({ title: 'Return the top 3 (LIMIT 3)', body: `The index returns nodes in distance order. It computed **${computed}** distances instead of ${PTS.length} for a full scan, and found **${recall} of the 3** exact nearest neighbours. HNSW is approximate: raising ef trades speed for recall.`,
    state: { level: 0, current: top3[0], visited: [...visited], path: [...path], frontier: best, result: top3, dist: computed } })
  return steps
}

function Layer({ level, s }: { level: number; s: HS }) {
  const W = 220, H = 170, X = (v: number) => 8 + v * (W - 16), Y = (v: number) => 8 + v * (H - 16)
  const g = GRAPH[level]
  const active = s.level === level
  return (
    <div className="grid gap-1">
      <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: active ? tone('accent') : 'var(--muted)' }}>layer {level} · {g.size} nodes</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[200px] rounded-md border" style={{ borderColor: active ? tone('accent') : 'var(--border)', background: 'var(--bg)' }} role="img" aria-label={`HNSW layer ${level}`}>
        {[...g.entries()].flatMap(([a, ns]) => ns.filter((b) => b > a).map((b) => (
          <line key={`${a}-${b}`} x1={X(PTS[a].x)} y1={Y(PTS[a].y)} x2={X(PTS[b].x)} y2={Y(PTS[b].y)} stroke="var(--border)" strokeWidth={1} />
        )))}
        {active && s.path.length > 1 && s.path.slice(1).map((n, i) => {
          const a = PTS[s.path[i]], b = PTS[n]
          return g.has(a.id) && g.has(b.id) ? <motion.line key={`p${i}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1={X(a.x)} y1={Y(a.y)} x2={X(b.x)} y2={Y(b.y)} stroke={tone('accent')} strokeWidth={2.2} /> : null
        })}
        {[...g.keys()].map((id) => {
          const p = PTS[id]
          const isRes = active && s.result?.includes(id)
          const inF = active && s.frontier?.includes(id)
          const vis = s.visited.includes(id)
          const t: Tone = isRes ? 'ok' : id === s.current && active ? 'accent' : inF ? 'new' : vis ? 'header' : 'muted'
          return <motion.circle key={id} cx={X(p.x)} cy={Y(p.y)} animate={{ r: id === s.current && active ? 6 : 4 }} fill={vis || isRes ? tone(t) : 'var(--surface)'} stroke={tone(t)} strokeWidth={1.4} />
        })}
        <g>
          <line x1={X(Q.x) - 5} y1={Y(Q.y) - 5} x2={X(Q.x) + 5} y2={Y(Q.y) + 5} stroke={tone('dead')} strokeWidth={2} />
          <line x1={X(Q.x) - 5} y1={Y(Q.y) + 5} x2={X(Q.x) + 5} y2={Y(Q.y) - 5} stroke={tone('dead')} strokeWidth={2} />
          <text x={X(Q.x) + 7} y={Y(Q.y) - 6} fontSize={10} fill={tone('dead')} fontFamily="var(--font-mono)">query</text>
        </g>
      </svg>
    </div>
  )
}

function HnswViz() {
  const [ef, setEf] = useState(4)
  const steps = useMemo(() => hnswSteps(ef), [ef])
  return (
    <Stepper key={ef} steps={steps} interval={1800} extra={<Segmented label="ef_search" value={String(ef)} onChange={(v) => setEf(+v)} options={[['2', 'ef = 2'], ['4', 'ef = 4'], ['8', 'ef = 8']]} />} render={(s) => (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        <Legend items={[['dead', 'query vector'], ['accent', 'current node / path'], ['header', 'distance computed'], ['new', 'candidate list (ef)'], ['ok', 'returned']]} />
        <div className="grid gap-2 sm:grid-cols-3">{[2, 1, 0].map((l) => <Layer key={l} level={l} s={s} />)}</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile label="distances computed" value={s.dist} sub={`full scan: ${PTS.length}`} />
          <Tile label="layer" value={s.level} />
          <Tile label="defaults" value="m=16" sub="ef_construction=64, ef_search=40" />
          <Tile label="2,000 × vector(3)" value="632 kB" sub="hnsw index size" />
        </div>
      </div>
    )} />
  )
}

function ExtensionsViz() {
  const [tab, setTab] = useState<'trgm' | 'hnsw'>('trgm')
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <Segmented label="Extension" value={tab} onChange={setTab} options={[['trgm', 'pg_trgm: trigram similarity'], ['hnsw', 'pgvector: HNSW search']]} />
      {tab === 'trgm' ? <TrigramViz /> : <HnswViz />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'extensions',
  module: 'm6',
  order: 6,
  title: 'Extensions everyone runs',
  tldr: [
    'An **extension** is a versioned package of SQL objects (types, functions, operators, index classes, often backed by a C library) that `CREATE EXTENSION` installs as one unit and `DROP EXTENSION` removes as one unit.',
    'Extensions are how PostgreSQL grows new capabilities, from query statistics to fuzzy text search to vector similarity, without forking the server or waiting for a core release.',
  ],
  visualizer: {
    title: 'Inside two favourite extensions',
    caption: 'Type two strings and watch pg_trgm split them into trigrams and score their overlap. Then switch to **pgvector** and step through an HNSW search descending three graph layers.',
    Component: ExtensionsViz,
  },
  playground: {
    extensions: ['pg_trgm', 'vector', 'pg_stat_statements', 'pgcrypto', 'hstore'],
    setup: `
CREATE TABLE products (id int PRIMARY KEY, name text NOT NULL);
INSERT INTO products
SELECT g, (ARRAY['postgres','postgis','mysql','sqlite','postgresql','progress','redis','mongodb'])[1 + g % 8] || ' ' || g
FROM generate_series(1, 5000) g;
CREATE TABLE items (id int PRIMARY KEY, embedding vector(3));
INSERT INTO items SELECT g, ARRAY[sin(g), cos(g), sin(g * 0.5)]::vector FROM generate_series(1, 2000) g;
ANALYZE;`,
    presets: [
      { label: 'What is installed', sql: `SELECT extname, extversion, extrelocatable, extnamespace::regnamespace AS schema
FROM pg_extension ORDER BY 1;

SELECT name, default_version, installed_version, comment
FROM pg_available_extensions WHERE name IN ('pg_trgm', 'vector', 'pgcrypto') ORDER BY 1;`,
        note: 'Each row in `pg_extension` is one installed package and version. `plpgsql` itself is an extension, installed by default in `pg_catalog`.' },
      { label: 'Trusted, versions, members', sql: `SELECT name, version, superuser, trusted FROM pg_available_extension_versions
WHERE name IN ('pg_trgm', 'pgcrypto', 'pg_stat_statements', 'pageinspect') AND installed;

SELECT count(*) AS member_objects
FROM pg_depend
WHERE refclassid = 'pg_extension'::regclass AND deptype = 'e'
  AND refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_trgm');

SELECT pg_describe_object(classid, objid, objsubid) AS member
FROM pg_depend
WHERE refclassid = 'pg_extension'::regclass AND deptype = 'e'
  AND refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_trgm')
ORDER BY 1 LIMIT 8;`,
        note: '`trusted = t` (pg_trgm, pgcrypto) lets any role with CREATE on the database install it. pg_trgm 1.6 owns **47** member objects, tracked by `deptype = e` in `pg_depend`; that is how DROP EXTENSION finds them.' },
      { label: 'Trigrams & similarity', sql: `SELECT show_trgm('postgres') AS a, show_trgm('postgis') AS b;

SELECT similarity('postgres', 'postgis') AS sim,
       'postgres' <-> 'postgis' AS distance,
       'postgres' % 'postgis' AS similar_enough,
       word_similarity('post', 'postgres database') AS word_sim;
SHOW pg_trgm.similarity_threshold;`,
        note: '5 shared trigrams out of 12 distinct ones gives **0.416667**, above the 0.3 threshold, so `%` is true. `word_similarity` scores the best matching extent inside the second string.' },
      { label: 'Trigram index for %…% search', sql: `EXPLAIN SELECT * FROM products WHERE name ILIKE '%gres 12%';

CREATE INDEX products_name_trgm ON products USING gin (name gin_trgm_ops);

EXPLAIN SELECT * FROM products WHERE name ILIKE '%gres 12%';
SELECT * FROM products WHERE name ILIKE '%gres 12%' ORDER BY id LIMIT 5;`,
        note: 'A B-tree cannot help with an unanchored pattern; the trigram GIN index can. The plan switches from a Seq Scan to a **Bitmap Index Scan on products_name_trgm**, followed by a recheck of each candidate row.' },
      { label: 'pgvector: HNSW index', sql: `CREATE INDEX items_hnsw ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
SELECT pg_size_pretty(pg_relation_size('items_hnsw')) AS index_size;

SET hnsw.ef_search = 40;
EXPLAIN SELECT id FROM items ORDER BY embedding <=> '[0.1,0.9,0.2]' LIMIT 5;
SELECT id, round((embedding <=> '[0.1,0.9,0.2]')::numeric, 4) AS cosine_distance
FROM items ORDER BY embedding <=> '[0.1,0.9,0.2]' LIMIT 5;`,
        note: '`<=>` is cosine distance (`<->` is L2, `<#>` negative inner product). The plan is an **Index Scan … Order By**: an approximate nearest-neighbour search, not a sort of all 2000 rows.' },
      { label: 'pg_stat_statements', sql: `SELECT pg_stat_statements_reset() IS NOT NULL AS reset;
SELECT count(*) FROM products WHERE name LIKE 'postgres%';
SELECT count(*) FROM products WHERE name LIKE 'redis%';
SELECT count(*) FROM products WHERE id = 7;
SELECT pg_sleep(0.02);

SELECT calls, rows, round(total_exec_time::numeric, 3) AS total_ms, query
FROM pg_stat_statements
WHERE query ILIKE '%products%' AND query NOT ILIKE '%pg_stat_statements%'
ORDER BY calls DESC;

SELECT calls,
       round((total_exec_time / calls)::numeric, 3) AS avg_ms,
       round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 1) AS pct_of_exec_time,
       left(query, 45) AS query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;`,
        note: 'Constants are replaced by `$1`, so both LIKE queries collapse into **one** normalized entry with `calls = 2`. The ranking query puts `pg_sleep($1)` on top with almost all of the execution time, while it used no CPU at all: `total_exec_time` is wall time, waits included. On a server the module must be in `shared_preload_libraries`.' },
      { label: 'pgcrypto', sql: `SELECT encode(digest('hello', 'sha256'), 'hex') AS sha256;
SELECT fips_mode() AS fips_mode, current_setting('pgcrypto.builtin_crypto_enabled') AS builtin_crypto;

SELECT crypt('s3cret', gen_salt('bf', 8)) AS bcrypt_hash;

SELECT crypt('s3cret', h) = h AS password_ok
FROM (SELECT crypt('s3cret', gen_salt('bf', 8)) AS h) x;`,
        note: '`crypt` with a Blowfish salt produces a `$2a$08$…` hash. To check a password, hash the attempt using the stored hash as the salt and compare. New in PostgreSQL 18: `fips_mode()` reports whether OpenSSL runs in FIPS mode, and `pgcrypto.builtin_crypto_enabled` (`on`, `off` or `fips`) controls whether the built-in `gen_salt()` and `crypt()` work (`fips` disables them when OpenSSL is in FIPS mode).' },
      { label: 'hstore: key/value in one column', sql: `CREATE TABLE books (id int PRIMARY KEY, title text NOT NULL, attr hstore);
INSERT INTO books VALUES
  (1, 'PostgreSQL Internals', '"pages"=>"412", "publisher"=>"Acme", "language"=>"English"'),
  (2, 'SQL Basics', '"pages"=>"243", "language"=>"French"');

SELECT title, attr -> 'pages' AS pages, attr ? 'publisher' AS has_publisher, akeys(attr) AS keys
FROM books ORDER BY id;
SELECT title FROM books WHERE attr @> '"language"=>"English"';
SELECT (each(attr)).* FROM books WHERE id = 2;
SELECT attr || '"freeshipping"=>"yes"'::hstore AS added, delete(attr, 'pages') AS removed,
       hstore_to_jsonb(attr) AS as_jsonb
FROM books WHERE id = 2;`,
        note: '**hstore** adds a type with operators: `->` (value), `?` (has key), `@>` (contains pair), `||` (add or overwrite), plus functions such as `each` and `akeys`. Keys and values are **text only** and there is no nesting, which is why new designs mostly use jsonb. `@>`, `?`, `?&` and `?|` are GIN-indexable, just like their jsonb counterparts.' },
    ],
  },
  production: {
    title: 'Typo-tolerant product search without a search engine',
    context: 'A storefront with a few million product names ran search as `WHERE name ILIKE \'%\' || $1 || \'%\'`. Users typed partial words and misspellings.',
    problem: 'Every search was a sequential scan of the whole table, and misspellings such as "caterpiler" found nothing at all.',
    solution: 'Install **pg_trgm** (a trusted extension, so the app owner can do it) and add one GIN trigram index. Use `ILIKE` for substring search, now index-assisted, and the `%` operator with `similarity()` ordering for "did you mean" results.',
    sql: `CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY products_name_trgm ON products USING gin (name gin_trgm_ops);

-- substring search, index-assisted
SELECT * FROM products WHERE name ILIKE '%' || $1 || '%' LIMIT 20;
-- fuzzy search
SELECT name, similarity(name, $1) AS score
FROM products WHERE name % $1
ORDER BY score DESC LIMIT 10;`,
    outcome: 'In the playground the same change turns `Seq Scan on products` into `Bitmap Index Scan on products_name_trgm` for `ILIKE \'%gres 12%\'`, and `similarity(\'caterpillar\', \'caterpiler\')` scores well above the 0.3 threshold, so the misspelling now matches.',
  },
  pitfalls: [
    { title: 'pg_stat_statements created but empty',
      symptom: '`CREATE EXTENSION pg_stat_statements` succeeds, but querying the view fails with "pg_stat_statements must be loaded via shared_preload_libraries".',
      cause: 'The module needs shared memory allocated at server start. CREATE EXTENSION only creates the SQL view and functions.',
      fix: 'Add it to `shared_preload_libraries` and restart, then check that `compute_query_id` is `auto` or `on`.',
      sql: `ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- restart the server, then:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;` },
    { title: 'Trigram search on very short patterns',
      symptom: 'A trigram-indexed `ILIKE \'%ab%\'` is as slow as a sequential scan.',
      cause: 'Patterns that yield no complete trigram give the index nothing to look up, so it degenerates into a **full index scan** plus a recheck of every row.',
      fix: 'Require at least 3 characters before searching, or route very short inputs to a prefix B-tree index (`text_pattern_ops`).' },
    { title: 'Approximate vector search with filters returns too few rows',
      symptom: '`ORDER BY embedding <-> $1 LIMIT 10` with an extra `WHERE category = \'x\'` returns only 3 rows, or misses obvious matches.',
      cause: 'HNSW gathers `hnsw.ef_search` candidates (default **40**) first, then the filter removes most of them. The index is approximate by design.',
      fix: 'Raise `hnsw.ef_search` for filtered queries, use pgvector\'s iterative scans if available in your version, or partition / partially index by the filter column.' },
    { title: 'Upgrading the package but not the extension',
      symptom: 'After installing a newer extension package, new functions are missing and `pg_extension.extversion` still shows the old version.',
      cause: 'Installing files only makes new versions *available*. Each database keeps the version it installed until you run the update scripts.',
      fix: 'Run `ALTER EXTENSION name UPDATE;` in every database, and check `pg_available_extensions` for `installed_version` versus `default_version`.' },
    { title: 'Reading execution-time share as CPU',
      symptom: 'A "top queries by CPU" report built on pg_stat_statements points at a query that barely uses the processor, and tuning it changes nothing.',
      cause: '`total_exec_time` is elapsed time inside the executor, including lock waits, I/O and sleeps. A share of `sum(total_exec_time) OVER ()` is a share of **execution time**, not CPU. A cast such as `numeric(6,3)` on the average also overflows once an average passes 999.999 ms.',
      fix: 'Call the column what it is, read `mean_exec_time` next to `calls`, and compare `shared_blks_read` and `shared_blks_hit` (plus I/O timing columns when `track_io_timing` is on) to tell waiting from computing. Then EXPLAIN (ANALYZE, BUFFERS) the top entries.',
      sql: `SELECT calls, round(mean_exec_time::numeric, 2) AS mean_ms,
       round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 1) AS pct_exec_time,
       shared_blks_hit, shared_blks_read, left(query, 60) AS query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;` },
  ],
  pointers: [
    'An extension is a **control file + versioned SQL scripts** (+ shared library). Members are tracked in `pg_depend` with deptype `e`, and pg_dump emits only `CREATE EXTENSION`.',
    '**Trusted** extensions can be installed by non-superusers with CREATE on the database. Check with `pg_available_extension_versions`.',
    '**pg_stat_statements** needs `shared_preload_libraries`; it groups queries by normalized text into one row per query id, user and database.',
    '**pg_trgm**: similarity = shared trigrams / union, threshold 0.3. GIN or GiST `*_trgm_ops` indexes speed up `%`, `LIKE`, `ILIKE` and regex, even unanchored.',
    '**pgvector**: `<->` L2, `<=>` cosine, `<#>` inner product. HNSW (m=16, ef_construction=64, ef_search=40) gives approximate nearest neighbours.',
  ],
  sources: ['extend-extensions.html', 'sql-createextension.html', 'pgstatstatements.html', 'pgtrgm.html', 'pgcrypto.html', 'pageinspect.html', 'contrib.html'],
}
