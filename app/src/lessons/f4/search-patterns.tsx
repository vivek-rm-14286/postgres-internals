import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, Caption, NO_LIG } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer.
 *  1. Trigram explorer: the same extraction rules as pg_trgm (lower-case, split on non-alphanumerics,
 *     pad each word with two spaces in front and one behind) and the same similarity = shared / union.
 *     Results match similarity() on PostgreSQL 18 to float precision.
 *  2. Which index serves which predicate: each cell is a measured EXPLAIN (ANALYZE, BUFFERS) on the
 *     playground's 20 000 products with only that one index present (sequential scan = 323 buffers).
 * ---------------------------------------------------------------------------------------------- */

function trigrams(s: string): string[] {
  const set = new Set<string>()
  for (const w of s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
    const p = `  ${w} `
    for (let i = 0; i + 3 <= p.length; i++) set.add(p.slice(i, i + 3))
  }
  return [...set]
}
function similarity(a: string, b: string) {
  const A = trigrams(a), B = new Set(trigrams(b))
  const shared = A.filter((t) => B.has(t)).length
  return { shared, sim: shared / (A.length + B.size - shared) }
}

const CANDIDATES = ['cordless drill', 'corded drill', 'cordless screwdriver', 'hammer drill', 'impact driver', 'drill press', 'jigsaw', 'Makita', 'Milwaukee', 'angle grinder']
const EXAMPLES = ['cordles dril', 'impact drivr', 'jigsw', 'mikita']
const THRESHOLD = 0.3

type Cell = { ok: boolean; plan: string; buf: number | null; note?: string }
const IDX = ['B-tree (en_US)', 'B-tree text_pattern_ops', 'GIN gin_trgm_ops', 'GiST gist_trgm_ops'] as const
const PREDS: { sql: string; cells: Cell[] }[] = [
  { sql: "name = 'Makita cordless drill 18V #1'", cells: [
    { ok: true, plan: 'Index Scan', buf: 4 }, { ok: true, plan: 'Index Scan', buf: 4 }, { ok: true, plan: 'Bitmap Index Scan', buf: 86 }, { ok: true, plan: 'Index Scan', buf: 201 }] },
  { sql: "name LIKE 'Makita cordless%'", cells: [
    { ok: false, plan: 'Seq Scan', buf: 323, note: 'en_US collation order is not character order, so a prefix is not a range' }, { ok: true, plan: 'Bitmap Index Scan', buf: 317 }, { ok: true, plan: 'Bitmap Index Scan', buf: 366 }, { ok: true, plan: 'Bitmap Index Scan', buf: 687 }] },
  { sql: "name >= 'Ryobi' AND name < 'Ryobj'", cells: [
    { ok: true, plan: 'Bitmap Index Scan', buf: 342 }, { ok: false, plan: 'Seq Scan', buf: 323, note: 'pattern_ops does not support <, >' }, { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: false, plan: 'Seq Scan', buf: 323 }] },
  { sql: "name LIKE '%impact driver%'", cells: [
    { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: true, plan: 'Bitmap Index Scan', buf: 91 }, { ok: true, plan: 'Bitmap Index Scan', buf: 305 }] },
  { sql: "name ILIKE '%IMPACT DRIVER%'", cells: [
    { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: true, plan: 'Bitmap Index Scan', buf: 91 }, { ok: true, plan: 'Bitmap Index Scan', buf: 305 }] },
  { sql: "name ~ 'j[iy]gsaw'", cells: [
    { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: true, plan: 'Bitmap Index Scan', buf: 66 }, { ok: true, plan: 'Bitmap Index Scan', buf: 472 }] },
  { sql: "name % 'makita cordles impact drivr'", cells: [
    { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: false, plan: 'Seq Scan', buf: 323 }, { ok: true, plan: 'Seq Scan chosen', buf: 323, note: 'supported, but 761 of 20 000 rows match, so the planner preferred a Seq Scan' }, { ok: true, plan: 'Bitmap Index Scan', buf: 628 }] },
  { sql: "ORDER BY name <-> 'makita …' LIMIT 5", cells: [
    { ok: false, plan: 'Seq Scan + Sort', buf: 323 }, { ok: false, plan: 'Seq Scan + Sort', buf: 323 }, { ok: false, plan: 'Seq Scan + Sort', buf: 323, note: 'GIN cannot return rows in distance order' }, { ok: true, plan: 'Index Scan (KNN)', buf: 428, note: 'rows come out nearest first; the scan stops after 5' }] },
]

function TrigramExplorer({ q }: { q: string }) {
  const qt = useMemo(() => trigrams(q), [q])
  const ranked = useMemo(() => CANDIDATES.map((c) => ({ c, ...similarity(q, c) })).sort((a, b) => b.sim - a.sim), [q])
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-1">
        <AnimatePresence initial={false}>
          {qt.map((t) => (
            <motion.span key={t} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="rounded px-1.5 py-0.5 font-mono text-[11.5px] whitespace-pre" style={{ background: toneBg('pointer', 20), color: tone('pointer') }}>"{t}"</motion.span>
          ))}
        </AnimatePresence>
        {qt.length === 0 && <span className="text-xs text-muted">no trigrams: an index cannot help this pattern</span>}
      </div>
      <div className="grid gap-1">
        {ranked.map(({ c, shared, sim }) => {
          const hit = sim > THRESHOLD
          const t: Tone = hit ? 'ok' : 'muted'
          return (
            <motion.div key={c} layout transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="grid grid-cols-[minmax(0,9.5rem)_1fr_3.2rem] items-center gap-2 text-[12px] sm:grid-cols-[11rem_1fr_3.5rem]">
              <span className="truncate font-mono">{c}</span>
              <div className="relative h-3.5 rounded-sm bg-surface-2">
                <motion.div initial={false} animate={{ width: `${sim * 100}%` }} className="h-full rounded-sm" style={{ background: toneBg(t, hit ? 65 : 35) }} />
                <div className="absolute top-[-3px] bottom-[-3px] w-px" style={{ left: `${THRESHOLD * 100}%`, background: tone('dead') }} />
                <span className="absolute top-0 right-1 font-mono text-[10px] leading-[14px] text-muted">{shared} shared</span>
              </div>
              <span className="text-right font-mono tabular-nums" style={{ color: hit ? tone('ok') : 'var(--muted)' }}>{sim.toFixed(3)}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function IndexMatrix() {
  const [sel, setSel] = useState<[number, number]>([3, 2])
  const cell = PREDS[sel[0]].cells[sel[1]]
  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
        <table className="w-full min-w-[560px] border-collapse text-[11.5px]" style={NO_LIG}>
          <thead><tr className="border-b border-line text-left text-muted">
            <th className="px-2 py-1 font-semibold">predicate</th>
            {IDX.map((h) => <th key={h} className="px-1.5 py-1 text-center font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>
            {PREDS.map((p, r) => (
              <tr key={p.sql} className="border-b border-line last:border-0">
                <td className="px-2 py-1 font-mono whitespace-nowrap">{p.sql}</td>
                {p.cells.map((c, k) => {
                  const active = sel[0] === r && sel[1] === k
                  const t: Tone = c.ok ? (c.plan.includes('chosen') ? 'header' : 'ok') : 'dead'
                  return (
                    <td key={k} className="p-0.5 text-center">
                      <button type="button" onClick={() => setSel([r, k])} aria-label={`${p.sql} with ${IDX[k]}`}
                        className="w-full rounded px-1 py-0.5 font-mono tabular-nums"
                        style={{ background: toneBg(t, active ? 36 : 16), color: tone(t), outline: active ? `1.5px solid ${tone(t)}` : undefined }}>
                        {c.ok ? '✓' : '✗'} {c.buf}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Caption k={`${sel[0]}-${sel[1]}`} text={`\`WHERE ${PREDS[sel[0]].sql}\` with only a **${IDX[sel[1]]}** index: **${cell.plan}**, ${cell.buf} shared buffers (a full Seq Scan is 323).${cell.note ? ` ${cell.note.charAt(0).toUpperCase()}${cell.note.slice(1)}.` : ''}`} />
    </div>
  )
}

function SearchViz() {
  const [q, setQ] = useState(EXAMPLES[0])
  const nextEx = () => setQ((cur) => EXAMPLES[(EXAMPLES.indexOf(cur) + 1) % EXAMPLES.length])
  return (
    <div className="grid gap-3">
      <Panel title="1 · Trigrams and similarity (pg_trgm rules)">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search text" spellCheck={false}
            className="w-52 rounded-lg border border-line bg-bg px-2.5 py-1.5 font-mono text-sm outline-none focus:border-accent" />
          <Btn primary testid="viz-next" onClick={nextEx}>Next typo</Btn>
          <span className="text-xs text-muted">red line = <code className="inline-code">pg_trgm.similarity_threshold</code> 0.3</span>
        </div>
        <TrigramExplorer q={q} />
      </Panel>
      <Panel title="2 · Which index serves which predicate (click a cell; numbers are shared buffers)">
        <IndexMatrix />
      </Panel>
      <Legend items={[['pointer', 'query trigram'], ['ok', 'match / index used'], ['header', 'supported, not chosen'], ['dead', 'index cannot help']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'search-patterns',
  module: 'f4',
  order: 6,
  title: 'Searching text',
  tldr: [
    'Text search in PostgreSQL comes in three shapes: **prefix** matching (`LIKE \'abc%\'`, a B-tree range), **substring and typo** matching (trigrams from `pg_trgm`, GIN or GiST), and **word** matching (full-text search with `tsvector` and `tsquery`).',
    'Each needs a different index, and the wrong pairing silently falls back to reading the whole table, so choosing the pattern first and the index second is the whole game.',
  ],
  visualizer: {
    title: 'Trigrams, similarity, and which index serves which query',
    caption: 'Type a misspelled product name (or press **Next typo**) to see its trigrams and the similarity of each candidate. Then click cells in the matrix: every number is a measured buffer count with only that index present.',
    Component: SearchViz,
  },
  playground: {
    extensions: ['pg_trgm'],
    setup: `
CREATE TABLE products (
  id int PRIMARY KEY,
  name text COLLATE "en_US" NOT NULL,
  description text NOT NULL);
INSERT INTO products
SELECT g,
  (ARRAY['Bosch','Makita','DeWalt','Ryobi','Stanley','Festool','Milwaukee','Einhell'])[1 + g % 8] || ' ' ||
  (ARRAY['cordless','compact','heavy-duty','brushless','corded','mini','pro','classic'])[1 + (g / 8) % 8] || ' ' ||
  (ARRAY['drill','hammer drill','impact driver','angle grinder','jigsaw','circular saw','sander','router',
         'screwdriver','multitool','planer','nail gun'])[1 + (g / 64) % 12] || ' ' ||
  (ARRAY['18V','12V','230V','kit','set','XR','plus','2.0'])[1 + (g / 768) % 8] || ' #' || g,
  'Model ' || g || ': a ' || (ARRAY['lightweight','powerful','quiet','robust'])[1 + g % 4] || ' tool for ' ||
  (ARRAY['wood','metal','masonry','drywall','tiles'])[1 + g % 5] || ' with ' ||
  (ARRAY['two batteries','a carrying case','an LED light','variable speed','a quick-change chuck'])[1 + g % 5]
FROM generate_series(1, 20000) g;
-- an ordinary index on the en_US column
CREATE INDEX products_name ON products (name);
ANALYZE products;`,
    presets: [
      { label: '1. Prefix search and the collation trap', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id, name FROM products WHERE name LIKE 'Makita cordless%';

CREATE INDEX products_name_pattern ON products (name text_pattern_ops);

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id, name FROM products WHERE name LIKE 'Makita cordless%';`,
        note: 'The column uses the **en_US** collation, whose sort order is not plain character order, so the ordinary B-tree cannot turn a prefix into a range: Seq Scan. The `text_pattern_ops` index compares character by character, and the plan shows `Index Cond: (name ~>=~ … AND name ~<~ …)`.' },
      { label: '2. Substring search with trigrams', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM products WHERE name LIKE '%impact driver%';

CREATE INDEX products_name_trgm ON products USING gin (name gin_trgm_ops);

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM products WHERE name LIKE '%impact driver%';`,
        note: 'No B-tree can serve a leading `%`. The **GIN trigram** index looks up the trigrams of `impact driver` and intersects their posting lists: the scan drops from 323 to about 91 buffers, and the gap widens with selective terms.' },
      { label: '3. ILIKE and regex reuse it', sql: `EXPLAIN (COSTS OFF)
SELECT id FROM products WHERE name ILIKE '%IMPACT DRIVER%';

EXPLAIN (COSTS OFF)
SELECT id FROM products WHERE name ~ 'j[iy]gsaw';

SELECT count(*) AS hits FROM products WHERE name LIKE '%#1234%';
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id FROM products WHERE name LIKE '%#1234%';`,
        note: 'The same index serves `ILIKE` and POSIX regexes (trigrams are extracted from the pattern). A selective substring like `#1234` (11 rows) costs about 16 buffers instead of 323.' },
      { label: '4. Typos: similarity and "did you mean"', sql: `-- a dictionary of the words that occur in product names
CREATE TABLE words AS
SELECT word FROM ts_stat('SELECT to_tsvector(''simple'', name) FROM products');
CREATE INDEX words_trgm ON words USING gist (word gist_trgm_ops);

SELECT word, round(similarity(word, 'drivr')::numeric, 3) AS sim
FROM words WHERE word % 'drivr'
ORDER BY word <-> 'drivr' LIMIT 5;

SELECT show_trgm('drivr') AS trigrams;`,
        note: '`%` keeps words above `pg_trgm.similarity_threshold` (0.3); `<->` (1 − similarity) orders them nearest first. Ordering by distance with an index needs **GiST**: GIN cannot return rows in distance order.' },
      { label: '5. Patterns an index cannot help', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM products WHERE name ILIKE '%xr%';

-- three characters give the index one trigram to look up
EXPLAIN (COSTS OFF)
SELECT count(*) FROM products WHERE name ILIKE '%gun%';`,
        note: 'Inside `%xr%` the two letters never form a complete trigram, so the index has nothing selective to look up and the planner reads the table (about 320 buffers). With three letters (`gun`) the trigram index is usable again. Ask for at least three characters in search boxes.' },
      { label: '6. Full-text search with ranking', sql: `ALTER TABLE products ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || description)) STORED;
CREATE INDEX products_fts ON products USING gin (fts);

SELECT id, name, round(ts_rank(fts, q)::numeric, 3) AS rank
FROM products, websearch_to_tsquery('english', 'cordless drill masonry -hammer') q
WHERE fts @@ q
ORDER BY rank DESC, id LIMIT 5;

EXPLAIN (COSTS OFF)
SELECT id FROM products WHERE fts @@ websearch_to_tsquery('english', 'cordless drill masonry -hammer');`,
        note: 'Full-text search matches **words** after stemming, so `drills` would match `drill`. `websearch_to_tsquery` accepts search-box syntax (`-hammer` excludes). The GIN index on the stored `tsvector` serves `@@`.' },
    ],
  },
  production: {
    title: 'A product search box that read the whole catalogue',
    context: 'A hardware shop searches 2 M products with `WHERE name ILIKE \'%\' || $1 || \'%\'`. It worked in development on a few thousand rows.',
    problem: 'In production every keystroke of the type-ahead ran a full sequential scan. An ordinary B-tree on `name` was never used, because leading wildcards cannot use a B-tree. Users also got nothing back for small typos such as "drivr".',
    solution: 'Split the box into the patterns it really needs: a **GIN trigram** index for substring matching, a small word dictionary with a **GiST trigram** index for "did you mean", and full-text search with a stored `tsvector` for multi-word queries. Require at least three characters before searching.',
    sql: `CREATE INDEX CONCURRENTLY products_name_trgm ON products USING gin (name gin_trgm_ops);

-- type-ahead
SELECT id, name FROM products
WHERE name ILIKE '%' || $1 || '%'
ORDER BY similarity(name, $1) DESC
LIMIT 10;

-- "did you mean"
SELECT word FROM words WHERE word % $1 ORDER BY word <-> $1 LIMIT 3;`,
    outcome: 'Substring searches stop scanning the table: on the playground a selective substring drops from 323 buffers to about 16, and the saving scales with the catalogue. Typos now return suggestions instead of an empty page.',
  },
  pitfalls: [
    { title: 'LIKE prefix ignores the B-tree',
      symptom: '`WHERE name LIKE \'abc%\'` does a Seq Scan although `name` is indexed.',
      cause: 'In a non-C collation, sort order is not character order, so the planner cannot turn a prefix into an index range.',
      fix: 'Add `CREATE INDEX … (name text_pattern_ops)` for pattern queries (keep the ordinary index for `<`, `>` and ORDER BY), or declare the column `COLLATE "C"` if linguistic sorting is not needed.' },
    { title: 'GIN where you need distance order',
      symptom: '`ORDER BY name <-> $1 LIMIT 10` sorts the whole table.',
      cause: 'GIN can find matching rows but cannot return them nearest first. Only GiST supports ordering by `<->`.',
      fix: 'Use `gist_trgm_ops` for nearest-neighbour queries, or filter with `%` on a GIN index and sort the (small) result.' },
    { title: 'Very short search terms',
      symptom: 'Searches for one or two letters are as slow as without an index.',
      cause: 'A pattern with no complete trigram gives the index nothing to look up, so the scan degenerates to reading everything.',
      fix: 'Require a minimum of three characters, or use a prefix search on a `text_pattern_ops` B-tree for very short input.' },
    { title: 'Using LIKE for word search',
      symptom: '`%drill%` also matches "drilling" and "screwdriller", and "drills" misses "drill".',
      cause: 'LIKE and trigrams match characters, not words. They know nothing about stemming or stop words.',
      fix: 'Use full-text search for natural-language queries: `to_tsvector(\'english\', …) @@ websearch_to_tsquery(…)`, ranked with `ts_rank`.' },
  ],
  pointers: [
    '**Prefix**: B-tree, with `text_pattern_ops` unless the column collation is C.',
    '**Substring, ILIKE, regex**: `gin_trgm_ops`. Patterns need at least one full trigram to be selective.',
    '**Typos**: `similarity()`, `%` (threshold 0.3) and `<->`. Distance ordering needs **GiST**.',
    '**Words**: a stored `tsvector` with a GIN index, `@@ websearch_to_tsquery`, ranked by `ts_rank`.',
    'Going deeper: [Full-text search](/m6/full-text-search) covers parsers, dictionaries and ranking.',
  ],
  sources: ['functions-matching.html', 'indexes-opclass.html', 'indexes-collations.html', 'pgtrgm.html', 'textsearch-controls.html', 'textsearch-tables.html', 'textsearch-indexes.html', 'ddl-generated-columns.html'],
}
