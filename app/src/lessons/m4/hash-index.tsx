import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, tone, toneBg } from '../../viz/kit'
import { Btn, Msg, Tiles } from './_kit'
import { HASH } from './_hashcodes'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a linear-hashing index exactly as PostgreSQL's hash AM maps keys:
 *   bucket = hash & highmask; if bucket > maxbucket then bucket = hash & lowmask
 * and splits ONE bucket (new = maxbucket + 1, old = new & lowmask) whenever
 *   ntuples > ffactor * (maxbucket + 1).
 * Hash codes are real hashint4() values from PostgreSQL. The demo starts with 4 buckets, 4 tuples per
 * page and ffactor 3 so splits are visible; a real int4 index starts with 8 buckets and ffactor 307.
 * ---------------------------------------------------------------------------------------------- */

const CAP = 4
const FFACTOR = 3

interface Tup { key: number; h: number }
interface HState { maxbucket: number; highmask: number; lowmask: number; buckets: Tup[][][]; ntuples: number; splits: number; last?: { key: number; h: number; b: number; raw: number; folded: boolean }; split?: { old: number; nw: number; moved: number }; probe?: number }

const hex = (h: number) => h.toString(16).padStart(8, '0')
const bin = (n: number, bits: number) => n.toString(2).padStart(bits, '0')
const bitsOf = (mask: number) => Math.max(1, Math.round(Math.log2(mask + 1)))

function init(): HState {
  return { maxbucket: 3, highmask: 7, lowmask: 3, buckets: [[[]], [[]], [[]], [[]]], ntuples: 0, splits: 0 }
}

const bucketOf = (s: { maxbucket: number; highmask: number; lowmask: number }, h: number) => {
  const raw = (h & s.highmask) >>> 0
  return raw > s.maxbucket ? { b: (h & s.lowmask) >>> 0, raw, folded: true } : { b: raw, raw, folded: false }
}

/** Put tuples into pages of CAP, each page sorted by hash code (PostgreSQL keeps entries sorted within a page). */
function paginate(ts: Tup[]): Tup[][] {
  const pages: Tup[][] = []
  for (let i = 0; i < ts.length; i += CAP) pages.push(ts.slice(i, i + CAP).sort((a, b) => a.h - b.h))
  return pages.length ? pages : [[]]
}

function insert(s0: HState, key: number): HState {
  const s: HState = { ...s0, buckets: s0.buckets.map((pages) => pages.map((p) => [...p])), split: undefined, probe: undefined }
  const h = HASH[(key - 1) % HASH.length]
  const { b, raw, folded } = bucketOf(s, h)
  const chain = s.buckets[b]
  let page = chain.find((p) => p.length < CAP)
  if (!page) { page = []; chain.push(page) } // new overflow page at the end of the chain
  page.push({ key, h }); page.sort((x, y) => x.h - y.h)
  s.ntuples++
  s.last = { key, h, b, raw, folded }
  if (s.ntuples > FFACTOR * (s.maxbucket + 1)) {
    const nw = s.maxbucket + 1
    const old = nw & s.lowmask
    if (nw > s.highmask) { s.lowmask = s.highmask; s.highmask = nw | s.lowmask }
    s.maxbucket = nw
    const all = s.buckets[old].flat()
    const move = all.filter((t) => ((t.h & s.highmask) >>> 0) === nw)
    const stay = all.filter((t) => ((t.h & s.highmask) >>> 0) !== nw)
    s.buckets[old] = paginate(stay)
    s.buckets[nw] = paginate(move)
    s.splits++
    s.split = { old, nw, moved: move.length }
  }
  return s
}

function BucketView({ s }: { s: HState }) {
  const hb = bitsOf(s.highmask)
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {s.buckets.map((chain, b) => {
        const isNew = s.split?.nw === b, isOld = s.split?.old === b
        const probe = s.probe === b
        return (
          <motion.div layout key={b} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex min-w-[124px] flex-col gap-1">
            <div className="rounded px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold"
              style={{ background: toneBg(isNew ? 'new' : isOld ? 'header' : probe ? 'ok' : 'muted', 22), color: 'var(--text)' }}>
              bucket {b} <span className="font-normal text-muted">…{bin(b, hb)}</span>
            </div>
            {chain.map((p, pi) => (
              <motion.div layout key={pi} className="rounded-md border p-1"
                style={{ borderColor: pi ? tone('dead') : tone(probe ? 'ok' : 'tuple'), background: pi ? toneBg('dead', 10) : toneBg('tuple', 8), borderStyle: pi ? 'dashed' : 'solid' }}>
                <p className="mb-0.5 font-mono text-[9.5px] text-muted">{pi ? `overflow ${pi}` : 'primary'}</p>
                <AnimatePresence>
                  {p.map((t) => (
                    <motion.div layout key={`${t.key}-${p.indexOf(t)}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-between gap-1 rounded px-1 font-mono text-[10.5px]"
                      style={{ background: t.key === s.last?.key && t.h === s.last?.h ? toneBg('new', 30) : 'transparent' }}>
                      <span className="font-semibold">{t.key}</span><span className="text-muted">{hex(t.h)}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {Array.from({ length: CAP - p.length }, (_, i) => <div key={`e${i}`} className="h-[15px] rounded border border-dashed border-line/60" />)}
              </motion.div>
            ))}
          </motion.div>
        )
      })}
    </div>
  )
}

function HashViz() {
  const [s, setS] = useState<HState>(init)
  const [nextKey, setNextKey] = useState(1)
  const add = (n: number) => { let t = s, k = nextKey; for (let i = 0; i < n; i++) { t = insert(t, k); k++ } setS(t); setNextKey(k) }
  const dup = () => { let t = s; for (let i = 0; i < 3; i++) t = insert(t, 42); setS(t) }
  const probe = () => { const h = HASH[41]; setS({ ...s, probe: bucketOf(s, h).b, split: undefined, last: undefined }) }
  const overflow = s.buckets.reduce((a, c) => a + c.length - 1, 0)
  const hb = bitsOf(s.highmask)
  const L = s.last
  const msg = s.probe !== undefined
    ? `\`WHERE k = 42\`: hash 42 → ${hex(HASH[41])}, mask → **bucket ${s.probe}**. The scan reads that bucket's ${s.buckets[s.probe].length} page(s) and nothing else, then rechecks the heap row because only the hash is stored.`
    : s.split
      ? `ntuples ${s.ntuples} > ffactor ${FFACTOR} × ${s.maxbucket} buckets, so **one bucket split**: new bucket ${s.split.nw} = maxbucket + 1, and its partner is ${s.split.nw} & lowmask = **bucket ${s.split.old}**. ${s.split.moved} of its tuples now have bit pattern …${bin(s.split.nw, hb)} and moved. Every other bucket was untouched.`
      : L
        ? `key ${L.key}: hashint4 = ${hex(L.h)}. hash & highmask (${bin(s.highmask, hb)}) = ${L.raw}${L.folded ? `, which is above maxbucket ${s.maxbucket}, so fold with lowmask (${bin(s.lowmask, hb - 1)}) → **bucket ${L.b}**` : ` → **bucket ${L.b}**`}.`
        : 'An empty hash index: a metapage plus 4 primary bucket pages in this demo (8 for a real int4 index). Insert keys and watch where their hash codes send them.'
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => add(1)}>Insert key {nextKey}</Btn>
        <Btn onClick={() => add(8)}>Insert 8</Btn>
        <Btn onClick={dup}>Insert key 42 three times</Btn>
        <Btn onClick={probe}>Look up 42</Btn>
        <button type="button" onClick={() => { setS(init()); setNextKey(1) }} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-ink">Reset</button>
      </div>
      <Tiles items={[['Tuples', s.ntuples], ['Buckets', s.maxbucket + 1], ['Overflow pages', overflow, overflow ? 'dead' : undefined], ['Bucket splits', s.splits]]} />
      <div className="grid gap-3 md:grid-cols-[230px_1fr]">
        <Panel title="Metapage (block 0)">
          <FieldTable rows={[
            ['ntuples', s.ntuples], ['ffactor', `${FFACTOR} (real int4: 307)`], ['maxbucket', s.maxbucket],
            ['highmask', <span key="h" className="font-mono">{bin(s.highmask, hb)}</span>], ['lowmask', <span key="l" className="font-mono">{bin(s.lowmask, hb)}</span>],
            ['split when', `ntuples > ${FFACTOR * (s.maxbucket + 1)}`],
          ]} />
        </Panel>
        <Msg k={`${s.ntuples}-${s.probe}-${s.splits}`} text={msg} />
      </div>
      <Legend items={[['tuple', 'primary bucket page'], ['dead', 'overflow page'], ['new', 'just inserted / new bucket'], ['header', 'bucket that was split']]} />
      <div className="min-w-0 rounded-lg border border-line bg-bg p-2"><BucketView s={s} /></div>
      <p className="text-xs text-muted">Each entry shows the key and its stored 4-byte hash in hex. Entries inside a page are sorted by hash code. Hash codes are real <code className="inline-code">hashint4()</code> values.</p>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE h (k int);
CREATE INDEX h_idx ON h USING hash (k);
CREATE TABLE links (url text);
INSERT INTO links SELECT 'https://example.com/products/category/item/' || md5(g::text) || '/details?ref=' || g
FROM generate_series(1, 20000) g;
CREATE INDEX links_hash ON links USING hash (url);
CREATE INDEX links_btree ON links (url);
ANALYZE links;`

export const lesson: Lesson = {
  slug: 'hash-index',
  module: 'm4',
  order: 5,
  title: 'Hash indexes',
  tldr: [
    'A hash index stores only a **4-byte hash code** per row, grouped into **buckets** that a lookup reaches directly from the metapage, without descending a tree.',
    'That makes it compact for long keys and cheap for pure equality lookups, at the price of no ranges, no ordering, no uniqueness and no multicolumn support.',
  ],
  visualizer: {
    title: 'Linear hashing, one bucket split at a time',
    caption: 'Insert keys and follow each hash code through the masks into a bucket. Watch exactly one bucket split when the fill factor is exceeded, then insert a duplicate key until it grows an overflow chain.',
    Component: HashViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: SETUP,
    presets: [
      { label: 'Empty metapage', sql: `SELECT ntuples, ffactor, maxbucket, highmask, lowmask
FROM hash_metapage_info(get_raw_page('h_idx', 0));

SELECT pg_relation_size('h_idx') / 8192 AS pages;`,
        note: 'An empty int4 hash index already has **8 buckets** (`maxbucket` 7, `highmask` 15, `lowmask` 7), 10 pages counting the metapage and bitmap page. `ffactor` 307 is the target tuples per bucket.' },
      { label: 'One bucket split', sql: `INSERT INTO h SELECT g FROM generate_series(1, 2456) g;
SELECT ntuples, maxbucket FROM hash_metapage_info(get_raw_page('h_idx', 0));
INSERT INTO h VALUES (2457);
SELECT ntuples, maxbucket FROM hash_metapage_info(get_raw_page('h_idx', 0));`,
        note: '2456 = 307 × 8 tuples fit. Row 2457 crosses the threshold, so `maxbucket` goes 7 → 8: exactly **one** bucket split.' },
      { label: 'Page types', sql: `SELECT b AS block, hash_page_type(get_raw_page('h_idx', b)) AS type
FROM generate_series(0, (pg_relation_size('h_idx') / 8192 - 1)::int) b;`,
        note: 'Block 0 is the **metapage**, then primary **bucket** pages, a **bitmap** page that tracks free overflow pages, and more buckets added in batches as the index grows.' },
      { label: 'Only the hash is stored', sql: `SELECT itemoffset, ctid, data AS hash_code, to_hex(data) AS hex
FROM hash_page_items(get_raw_page('h_idx', 1)) LIMIT 5;

SELECT to_hex(hashint4(1)) AS hash_of_1;`,
        note: 'Each item is a heap `ctid` plus a 32-bit hash code, sorted by hash within the page. The key itself is not stored, so every match is rechecked against the heap.' },
      { label: 'Duplicates → overflow', sql: `INSERT INTO h SELECT 42 FROM generate_series(1, 800);
SELECT b AS block, hash_page_type(get_raw_page('h_idx', b)) AS type
FROM generate_series(0, (pg_relation_size('h_idx') / 8192 - 1)::int) b
WHERE hash_page_type(get_raw_page('h_idx', b)) = 'overflow';
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF) SELECT * FROM h WHERE k = 42;`,
        note: '800 copies of one key all land in one bucket. Its primary page overflows into a chain of 2 overflow pages, and the Bitmap Index Scan reads all 3 pages of that bucket.' },
      { label: 'Long keys: hash vs B-tree', sql: `SELECT pg_size_pretty(pg_relation_size('links_hash')) AS hash_size,
       pg_size_pretty(pg_relation_size('links_btree')) AS btree_size;

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT * FROM links WHERE url = 'https://example.com/products/category/item/' || md5('77') || '/details?ref=77';`,
        note: 'For ~90-byte URLs the hash index is smaller than the B-tree (about 2.0 MB vs 2.4 MB) and a lookup reads about 3 buffers. For a 16-byte uuid the opposite happens: hash 1040 kB vs B-tree 632 kB at 20000 rows.' },
    ],
  },
  production: {
    title: 'Deduplicating long URLs in a crawler',
    context: 'A crawler stores every fetched URL (often 200+ characters) and checks "seen before?" with `WHERE url = $1` millions of times a day. Nothing ever queries URL ranges or sorts by URL.',
    problem: 'A B-tree on `url` stored every full string, so the index was nearly as large as the table and lookups touched more pages than necessary. Very long URLs also risked the B-tree entry limit of about a third of a page.',
    solution: 'Replace the B-tree with a hash index. It stores 4 bytes per row no matter how long the URL is, and an equality lookup goes straight to one bucket. Keep a B-tree only if something needs uniqueness, because hash indexes cannot enforce it.',
    sql: `CREATE INDEX CONCURRENTLY urls_url_hash ON urls USING hash (url);
DROP INDEX CONCURRENTLY urls_url_btree;
EXPLAIN (ANALYZE, BUFFERS) SELECT 1 FROM urls WHERE url = $1;`,
    outcome: 'In the playground, 20000 URLs of about 90 bytes give a 2.0 MB hash index against 2.4 MB for the B-tree, and a lookup reads 3 buffers. The gap grows with key length, because hash entries never get wider.',
  },
  pitfalls: [
    { title: 'Many duplicates in one key',
      symptom: 'Lookups on a few popular values are slow, and the index has many `overflow` pages.',
      cause: 'All rows with the same value hash to the **same bucket**. When its primary page fills, overflow pages are chained on, and every scan of that bucket reads the whole chain.',
      fix: 'Use hash indexes for unique or nearly unique columns. Exclude the hot values with a partial index (`WHERE status <> \'done\'`), or use a B-tree, which deduplicates.' },
    { title: 'Expecting it to shrink or to be smaller',
      symptom: 'After deleting most rows the hash index stays the same size, and for small keys like uuid it is larger than the B-tree.',
      cause: 'Bucket pages are allocated in batches and are **never released**. Freed overflow pages are reused, never returned to the OS. Small keys gain nothing from storing a hash instead.',
      fix: 'Rebuild with `REINDEX INDEX CONCURRENTLY`. Measure with `pg_relation_size` before choosing hash over B-tree for short keys.' },
    { title: 'Using it for anything but =',
      symptom: 'A hash index exists but `ORDER BY`, `<`, `BETWEEN`, `IN` with ranges or a unique constraint still need a B-tree.',
      cause: 'A hash index supports only the `=` operator, single columns, and no uniqueness checking. Hash order says nothing about value order.',
      fix: 'Keep hash indexes for equality-only access paths. Everything else needs a B-tree.' },
  ],
  pointers: [
    'Stores a **4-byte hash** per row, sorted by hash within each page. Every match is **lossy** and rechecked against the heap.',
    'bucket = **hash & highmask**, folded with **lowmask** if above `maxbucket`. The masks live in the metapage, cached by each backend.',
    'Growth is **linear hashing**: when `ntuples > ffactor × buckets`, exactly one bucket splits, in the foreground.',
    'Page kinds: **metapage**, **bucket**, **overflow** (chained duplicates), **bitmap** (free overflow pages).',
    '`=` only, single column, no UNIQUE, never shrinks without REINDEX. Best for long, nearly unique keys.',
  ],
  sources: ['hash-index.html', 'indexes-types.html', 'sql-createindex.html', 'pageinspect.html'],
}
