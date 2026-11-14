import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Btn, Msg, Tiles } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a GIN index on `tags text[]`. Keys live in an entry tree (a B-tree over keys); each
 * key points to a posting list of heap TIDs, which becomes a separate posting tree once it is too
 * big to sit inside the entry tuple. With fastupdate on, new rows go to an unsorted pending list
 * that VACUUM (or overflowing gin_pending_list_limit) merges into the main structure in bulk.
 * Demo limits are tiny (posting list 6 TIDs, pending list 12 entries) so every transition shows.
 * ---------------------------------------------------------------------------------------------- */

const VOCAB = ['blue', 'eco', 'green', 'kids', 'new', 'red', 'sale', 'xl']
const POSTING_MAX = 8
const PENDING_LIMIT = 12
const QUERY = ['red', 'sale']

interface Doc { id: number; tags: string[] }
interface Pend { key: string; tid: number }
interface G { entries: Map<string, number[]>; pending: Pend[]; nextId: number; lastWrites: number; flushed: number; hit?: string[]; result?: number[]; scannedPending?: number; lastDoc?: Doc; fast: boolean; event: string }

function rng(seed: number) { return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) }
const R = rng(7)
const DOCS: Doc[] = Array.from({ length: 60 }, (_, i) => {
  const n = 2 + Math.floor(R() * 2)
  const tags = new Set<string>()
  while (tags.size < n) tags.add(VOCAB[R() < 0.25 ? 5 : R() < 0.2 ? 6 : Math.floor(R() * VOCAB.length)])
  return { id: i + 1, tags: [...tags].sort() }
})

const tidOf = (id: number) => `(${Math.floor((id - 1) / 8)},${((id - 1) % 8) + 1})`

function merge(entries: Map<string, number[]>, pend: Pend[]) {
  const m = new Map([...entries].map(([k, v]) => [k, [...v]]))
  for (const p of pend) { const l = m.get(p.key) ?? []; l.push(p.tid); l.sort((a, b) => a - b); m.set(p.key, l) }
  return new Map([...m].sort(([a], [b]) => a.localeCompare(b)))
}

function initial(fast: boolean): G {
  const pend = DOCS.slice(0, 10).flatMap((d) => d.tags.map((key) => ({ key, tid: d.id })))
  return { entries: merge(new Map(), pend), pending: [], nextId: 11, lastWrites: 0, flushed: 0, fast, event: 'built' }
}

function insertDoc(g: G): G {
  const d = DOCS[(g.nextId - 1) % DOCS.length]
  const id = g.nextId
  const add = d.tags.map((key) => ({ key, tid: id }))
  const base = { ...g, nextId: id + 1, lastDoc: { id, tags: d.tags }, hit: undefined, result: undefined, scannedPending: undefined }
  if (!g.fast) return { ...base, entries: merge(g.entries, add), lastWrites: add.length, event: 'direct' }
  const pending = [...g.pending, ...add]
  if (pending.length > PENDING_LIMIT) return { ...base, entries: merge(g.entries, pending), pending: [], lastWrites: pending.length, flushed: pending.length, event: 'limit' }
  return { ...base, pending, lastWrites: 1, event: 'pending' }
}

function PostingCell({ k, tids, hit }: { k: string; tids: number[]; hit: boolean }) {
  const tree = tids.length > POSTING_MAX
  return (
    <motion.div layout className="rounded-md border px-2 py-1.5" style={{ borderColor: hit ? tone('new') : tone('header'), background: toneBg(hit ? 'new' : 'header', hit ? 16 : 8) }}>
      <div className="flex items-baseline justify-between gap-2 font-mono text-[12px]">
        <span className="font-bold">{k}</span>
        <span className="text-[10px] text-muted">{tree ? 'posting tree' : 'posting list'}</span>
      </div>
      {tree ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-1 grid gap-0.5">
          <div className="mx-auto rounded border px-1.5 font-mono text-[10px]" style={{ borderColor: tone('pointer'), color: tone('pointer') }}>root</div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: Math.ceil(tids.length / POSTING_MAX) }, (_, i) => (
              <div key={i} className="rounded border px-1 font-mono text-[9.5px]" style={{ borderColor: tone('pointer') }}>
                {tids.slice(i * POSTING_MAX, (i + 1) * POSTING_MAX).length} TID{tids.slice(i * POSTING_MAX, (i + 1) * POSTING_MAX).length > 1 ? 's' : ''}
              </div>
            ))}
          </div>
          <p className="text-center font-mono text-[10px] text-muted">{tids.length} rows, separate pages</p>
        </motion.div>
      ) : (
        <div className="mt-1 flex flex-wrap gap-0.5">
          <AnimatePresence>
            {tids.map((t) => (
              <motion.span layout key={t} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded px-1 font-mono text-[10px]"
                style={{ background: toneBg('tuple', 18) }}>{tidOf(t)}</motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

function GinViz() {
  const [g, setG] = useState<G>(() => initial(true))
  const trees = [...g.entries.values()].filter((v) => v.length > POSTING_MAX).length
  const search = () => {
    const lists = QUERY.map((k) => g.entries.get(k) ?? [])
    const fromTree = lists[0].filter((t) => lists[1].includes(t))
    const pendDocs = new Map<number, Set<string>>()
    g.pending.forEach((p) => { if (!pendDocs.has(p.tid)) pendDocs.set(p.tid, new Set()); pendDocs.get(p.tid)!.add(p.key) })
    const fromPending = [...pendDocs].filter(([, ks]) => QUERY.every((k) => ks.has(k))).map(([t]) => t)
    setG({ ...g, hit: QUERY, result: [...fromTree, ...fromPending].sort((a, b) => a - b), scannedPending: g.pending.length, event: 'search' })
  }
  const vacuum = () => setG({ ...g, entries: merge(g.entries, g.pending), pending: [], lastWrites: 0, flushed: g.pending.length, hit: undefined, result: undefined, event: 'vacuum' })
  const d = g.lastDoc
  const msg = {
    built: 'CREATE INDEX extracted every tag of the first 10 rows, sorted them, and bulk-loaded the **entry tree**: one entry per distinct key, each with a sorted list of heap TIDs.',
    pending: `Row ${d && tidOf(d.id)} has ${d?.tags.length} tags. With **fastupdate** it costs one append to the **pending list** instead of ${d?.tags.length} separate entry-tree insertions. The list is unsorted.`,
    limit: `This INSERT pushed the pending list over \`gin_pending_list_limit\`, so **this backend** merged all ${g.flushed} entries into the tree before returning. That unlucky insert is the latency spike.`,
    direct: `fastupdate = off: each of the ${d?.tags.length} tags of row ${d && tidOf(d.id)} is inserted into the entry tree right now, one index insertion per key.`,
    vacuum: `VACUUM (or autovacuum, or \`gin_clean_pending_list()\`) merged ${g.flushed} pending entries in one sorted bulk pass, in the background instead of in a user's INSERT.`,
    search: `\`tags @> '{red,sale}'\`: look up both keys, **intersect** their posting lists (${g.result?.length ?? 0} rows), and also scan all ${g.scannedPending} pending entries, because new rows might only be there. Matches are then checked by the opclass's consistent function.`,
  }[g.event as 'built']
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="fastupdate" value={g.fast ? 'on' : 'off'} onChange={(v) => setG(initial(v === 'on'))} options={[['on', 'fastupdate = on (default)'], ['off', 'fastupdate = off']]} />
        <Btn primary testid="viz-next" onClick={() => setG(insertDoc(g))}>INSERT a row</Btn>
        <Btn onClick={search}>Search tags @&gt; {'{red,sale}'}</Btn>
        <Btn onClick={vacuum} disabled={!g.pending.length}>VACUUM</Btn>
      </div>
      <Tiles items={[['Distinct keys', g.entries.size], ['Pending entries', `${g.pending.length} / ${PENDING_LIMIT}`, g.pending.length > PENDING_LIMIT * 0.75 ? 'dead' : undefined], ['Posting trees', trees], ['Index writes, last INSERT', g.lastWrites, g.event === 'limit' ? 'dead' : undefined]]} />
      <Msg k={`${g.event}-${g.nextId}-${g.pending.length}`} text={msg} />
      <Legend items={[['header', 'entry (key) in the entry tree'], ['tuple', 'heap TID in a posting list'], ['pointer', 'posting tree pages'], ['new', 'pending list / matched by the search']]} />
      <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
        <Panel title="Entry tree: a B-tree over keys">
          <div className="mb-2 flex flex-wrap items-center gap-1 font-mono text-[11px]">
            <span className="text-muted">root:</span>
            {['eco', 'new', 'sale'].map((k) => <span key={k} className="rounded border px-1" style={{ borderColor: tone('header') }}>{k}</span>)}
            <span className="text-muted">→ leaf pages, keys in order</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {[...g.entries].map(([k, v]) => <PostingCell key={k} k={k} tids={v} hit={!!g.hit?.includes(k)} />)}
          </div>
          {g.result && <p className="mt-2 font-mono text-[11px]">result: {g.result.map(tidOf).join(' ') || '(none)'}</p>}
        </Panel>
        <Panel title={`Pending list (${g.fast ? 'fastupdate on' : 'disabled'})`}>
          <div className="flex min-h-[80px] flex-col gap-0.5">
            <AnimatePresence>
              {g.pending.map((p, i) => (
                <motion.div key={`${p.tid}-${p.key}`} layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ delay: i * 0.01 }}
                  className="flex justify-between rounded px-1.5 font-mono text-[11px]" style={{ background: toneBg('new', g.event === 'search' ? 28 : 14) }}>
                  <span>{p.key}</span><span className="text-muted">{tidOf(p.tid)}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {!g.pending.length && <p className="text-xs text-muted">{g.fast ? 'Empty. New rows land here first.' : 'Not used: every key goes straight into the entry tree.'}</p>}
          </div>
        </Panel>
      </div>
      <p className="text-xs text-muted">Demo limits: a posting list holds {POSTING_MAX} TIDs and the pending list {PENDING_LIMIT} entries. Real defaults: posting lists grow until the entry tuple no longer fits on a page, and <code className="inline-code">gin_pending_list_limit</code> is 4MB.</p>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE docs (id int PRIMARY KEY, tags text[], attrs jsonb);
INSERT INTO docs
SELECT g,
       ARRAY['t' || (g % 20), 'c' || (g % 7), CASE WHEN g % 100 = 0 THEN 'rare' ELSE 'common' END],
       jsonb_build_object('color', (ARRAY['red','blue','green'])[1 + g % 3], 'size', g % 5, 'sku', 'S' || g)
FROM generate_series(1, 5000) g;
CREATE INDEX docs_tags ON docs USING gin (tags);
ANALYZE docs;`

export const lesson: Lesson = {
  slug: 'gin',
  module: 'm4',
  order: 6,
  title: 'GIN: inverted indexes',
  tldr: [
    'A GIN index stores each **key** that occurs inside a composite value (array element, jsonb path, text-search lexeme) exactly once, with a sorted **posting list** of the rows that contain it.',
    'That inverted layout makes "which rows contain these elements?" fast, and the **pending list** exists because a single row insert would otherwise touch one entry per element.',
  ],
  visualizer: {
    title: 'Inside a GIN index on tags',
    caption: 'Insert rows and watch them queue in the pending list, then overflow it or VACUUM it into the entry tree. Popular keys outgrow their posting list into a posting tree. Run the search to see posting lists intersected and the pending list scanned.',
    Component: GinViz,
  },
  playground: {
    extensions: ['pageinspect', 'pg_trgm'],
    setup: SETUP,
    presets: [
      { label: 'Entries and pages', sql: `SELECT n_entries, n_entry_pages, n_data_pages, n_pending_pages, n_pending_tuples
FROM gin_metapage_info(get_raw_page('docs_tags', 0));

SELECT b AS block, (gin_page_opaque_info(get_raw_page('docs_tags', b))).flags
FROM generate_series(1, (pg_relation_size('docs_tags') / 8192 - 1)::int) b;`,
        note: '5000 rows but only **29 keys** (t0–t19, c0–c6, rare, common). `common` occurs in 4950 rows, too many for a posting list, so it has a **posting tree**: the `{data,leaf,compressed}` page.' },
      { label: 'Containment search', sql: `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM docs WHERE tags @> ARRAY['rare', 't0'];`,
        note: 'GIN finds both keys and intersects their posting lists. GIN only supports **bitmap scans**, so a Bitmap Heap Scan rechecks the rows. The index part reads **5 buffers**.' },
      { label: 'Pending list fills', sql: `INSERT INTO docs SELECT g, ARRAY['t' || (g % 20), 'new' || g] FROM generate_series(5001, 5300) g;

SELECT n_pending_pages, n_pending_tuples
FROM gin_metapage_info(get_raw_page('docs_tags', 0));

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM docs WHERE tags @> ARRAY['rare', 't0'];`,
        note: '300 new rows sit in **2 pending pages**, not in the entry tree. The same search now also reads the pending pages: index buffers go from 5 to **7**.' },
      { label: 'Flush the pending list', sql: `SELECT gin_clean_pending_list('docs_tags') AS pages_flushed;

SELECT n_pending_pages, n_pending_tuples
FROM gin_metapage_info(get_raw_page('docs_tags', 0));`,
        note: '`gin_clean_pending_list` (or VACUUM, or autovacuum\'s analyze) moves pending entries into the main structure in one bulk pass and returns the number of pages flushed.' },
      { label: 'jsonb_ops vs jsonb_path_ops', sql: `CREATE INDEX docs_attrs_ops ON docs USING gin (attrs);
CREATE INDEX docs_attrs_path ON docs USING gin (attrs jsonb_path_ops);
SELECT indexrelid::regclass AS index, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index WHERE indrelid = 'docs'::regclass AND indexrelid::regclass::text LIKE 'docs_attrs%';

EXPLAIN SELECT id FROM docs WHERE attrs @> '{"color": "red", "size": 3}';
EXPLAIN SELECT id FROM docs WHERE attrs ->> 'color' = 'red';`,
        note: '`jsonb_path_ops` hashes whole paths, so it is smaller but supports only `@>`, `@?` and `@@`. Neither GIN index helps `->> =`: that is a plain equality on an expression and needs a B-tree expression index.' },
      { label: 'Fix ->> with a B-tree', sql: `EXPLAIN SELECT id FROM docs WHERE attrs ->> 'sku' = 'S4242';
EXPLAIN SELECT id FROM docs WHERE attrs @> '{"sku": "S4242"}';

CREATE INDEX docs_sku ON docs ((attrs ->> 'sku'));
ANALYZE docs;
EXPLAIN SELECT id FROM docs WHERE attrs ->> 'sku' = 'S4242';
SELECT pg_size_pretty(pg_relation_size('docs_sku')) AS btree_on_sku,
       pg_size_pretty(pg_relation_size('docs_attrs_path')) AS gin_path_ops;`,
        note: 'Three ways to ask for one SKU. `->> =` is a Seq Scan (cost 172.50). Rewritten as containment it uses the GIN index (about 17). A **B-tree expression index** on `attrs ->> \'sku\'` serves the original query as an Index Scan (8.30), and at 128 kB it is less than half the size of the `jsonb_path_ops` index.' },
      { label: 'Substring search with trigrams', sql: `CREATE INDEX docs_sku_trgm ON docs USING gin ((attrs ->> 'sku') gin_trgm_ops);
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT id FROM docs WHERE attrs ->> 'sku' LIKE '%499%';`,
        note: 'pg_trgm splits text into 3-character keys, so a GIN index can answer `LIKE \'%…%\'`, which no B-tree can. The bitmap scan rechecks rows because trigram matches are only candidates.' },
    ],
  },
  production: {
    title: 'A product catalog with p99 insert spikes',
    context: 'A marketplace indexed `attributes jsonb` with GIN for faceted search. Sellers bulk-upload products through an API, a few hundred rows per request, all day.',
    problem: 'Most inserts were fast, but every so often one API call took seconds. Those were the inserts that pushed the **pending list** past `gin_pending_list_limit` (4MB) and had to merge it in the foreground. Searches also slowed down between autovacuum runs, because every search scanned the whole pending list.',
    solution: 'Keep fastupdate, but make cleanup happen in the background and keep the list short: run autovacuum on this table more often (lower its analyze/vacuum insert thresholds) and keep the per-index limit modest. For a one-off bulk import, drop the index and recreate it afterwards, which is much faster than incremental maintenance.',
    sql: `ALTER TABLE products SET (autovacuum_vacuum_insert_threshold = 5000,
                            autovacuum_analyze_threshold = 5000);
ALTER INDEX products_attrs_gin SET (gin_pending_list_limit = 1024);  -- kB
SELECT n_pending_pages, n_pending_tuples
FROM gin_metapage_info(get_raw_page('products_attrs_gin', 0));`,
    outcome: 'Cleanup moves from user requests into autovacuum, so the occasional multi-second insert goes away and searches read a short pending list. In the playground, 300 pending rows add 2 buffer reads to every search (5 → 7) until the list is flushed.',
  },
  pitfalls: [
    { title: 'Expecting GIN to speed up ->> equality',
      symptom: '`WHERE data->>\'email\' = $1` still does a sequential scan although the jsonb column has a GIN index.',
      cause: 'GIN opclasses for jsonb support containment and existence (`@>`, `?`, `@?`, `@@`). `->>` returns text, and equality on that expression is not a GIN operator.',
      fix: 'Either rewrite the filter as containment (`data @> \'{"email": "x"}\'`) or add a B-tree expression index.',
      sql: `CREATE INDEX ON customers ((data ->> 'email'));` },
    { title: 'Reaching for GIN on range columns',
      symptom: '`CREATE INDEX … USING gin (during)` on a `tstzrange` column fails with `data type tstzrange has no default operator class for access method "gin"`.',
      cause: 'A common claim lists range types among the things GIN indexes. PostgreSQL ships no GIN operator class for ranges. Built-in GIN covers arrays, `jsonb`, `tsvector`, and (with extensions) `hstore` and trigrams.',
      fix: 'Index ranges with GiST (`USING gist (during)`) or SP-GiST. Both support `&&`, `@>` and `<@`, and GiST also backs exclusion constraints and `WITHOUT OVERLAPS` keys.' },
    { title: 'Occasional very slow inserts',
      symptom: 'Insert latency is normally low with rare spikes of seconds on a table with a GIN index.',
      cause: 'With `fastupdate` on, the insert that overflows `gin_pending_list_limit` flushes the whole pending list itself.',
      fix: 'Make autovacuum visit the table more often, lower the per-index limit, or set `fastupdate = off` when steady latency matters more than insert throughput.' },
    { title: 'Building GIN indexes slowly',
      symptom: 'CREATE INDEX for a GIN index on a large table takes far longer than a B-tree build, or a bulk load into an indexed table crawls.',
      cause: 'GIN build time is very sensitive to `maintenance_work_mem`, and incremental inserts touch one entry per extracted key.',
      fix: 'Raise `maintenance_work_mem` for the build session. For bulk loads, drop the GIN index, load, then recreate it.',
      sql: `SET maintenance_work_mem = '1GB';
CREATE INDEX CONCURRENTLY docs_tags ON docs USING gin (tags);` },
  ],
  pointers: [
    'GIN = an **entry tree** (B-tree over keys) whose leaf entries hold a **posting list** of TIDs, or point to a **posting tree** when the list is too big.',
    'Each key is stored **once**, so repeated elements compress well. GIN supports only **bitmap scans** and never index-only scans.',
    '**fastupdate** (default on) appends new entries to an unsorted **pending list**. VACUUM, autoanalyze, `gin_clean_pending_list()` or exceeding `gin_pending_list_limit` (4MB) merges it.',
    'Every search also scans the pending list. A big list slows reads, and the insert that overflows it pays for the merge.',
    'Opclasses decide the keys: `array_ops`, `jsonb_ops` (default), `jsonb_path_ops` (smaller, `@>` only), `tsvector_ops`, `gin_trgm_ops`.',
  ],
  sources: ['gin.html', 'indexes-types.html', 'sql-createindex.html', 'datatype-json.html', 'pgtrgm.html', 'pageinspect.html'],
}
