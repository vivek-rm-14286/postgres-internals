import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a live nbtree-style B+tree. Pages hold at most CAP keys. Leaves are sibling-linked
 * (right-links) and every page but the rightmost on its level carries a HIGH KEY — the upper bound
 * that lets a reader detect a concurrent split and "move right" (Lehman & Yao).
 * Split rule mirrors PostgreSQL: appending a new largest key on the rightmost leaf leaves the old page
 * fillfactor-full (90%); any other split divides the page roughly in half.
 * ---------------------------------------------------------------------------------------------- */

const CAP = 6
const RIGHTMOST_KEEP = Math.round(CAP * 0.9) // fillfactor 90 → keep 5 of 6

interface Page { id: number; level: number; keys: number[]; kids: number[]; right: number | null; high: number | null }
interface Tree { pages: Map<number, Page>; root: number; nextId: number; splits: number; lastPath: number[]; lastSplit: number[]; lastKey: number | null }

function emptyTree(): Tree {
  const pages = new Map<number, Page>()
  pages.set(1, { id: 1, level: 0, keys: [], kids: [], right: null, high: null })
  return { pages, root: 1, nextId: 2, splits: 0, lastPath: [], lastSplit: [], lastKey: null }
}

function clone(t: Tree): Tree {
  const pages = new Map<number, Page>()
  t.pages.forEach((p, k) => pages.set(k, { ...p, keys: [...p.keys], kids: [...p.kids] }))
  return { ...t, pages, lastPath: [], lastSplit: [] }
}

/** Insert key, returning a new tree. Internal pages store separator keys: kids[i] covers keys >= keys[i-1]. */
function insert(t0: Tree, key: number): Tree {
  const t = clone(t0)
  t.lastKey = key
  const path: number[] = []
  let p = t.pages.get(t.root)!
  while (p.level > 0) {
    path.push(p.id)
    let i = 0
    while (i < p.keys.length && key >= p.keys[i]) i++
    p = t.pages.get(p.kids[i])!
  }
  path.push(p.id)
  t.lastPath = [...path]
  if (p.keys.includes(key)) return t // unique index: ignore duplicates in this demo
  p.keys.push(key); p.keys.sort((a, b) => a - b)

  // split upwards while overflowing
  let level = path.length - 1
  let node = p
  while (node.keys.length > CAP) {
    t.splits++
    const isLeaf = node.level === 0
    const rightmost = node.right === null
    const appendedMax = isLeaf && rightmost && node.keys[node.keys.length - 1] === key
    const keep = appendedMax ? RIGHTMOST_KEEP : Math.ceil(node.keys.length / 2)
    const sib: Page = { id: t.nextId++, level: node.level, keys: [], kids: [], right: node.right, high: node.high }
    let sep: number
    if (isLeaf) {
      sib.keys = node.keys.splice(keep)
      sep = sib.keys[0]
    } else {
      // internal: middle key moves up, its right half of children moves to the sibling
      const mid = keep
      sep = node.keys[mid]
      sib.keys = node.keys.splice(mid + 1)
      node.keys.splice(mid)
      sib.kids = node.kids.splice(mid + 1)
    }
    node.right = sib.id
    node.high = sep // high key = lower bound of the right sibling
    t.pages.set(sib.id, sib)
    t.lastSplit.push(node.id, sib.id)

    if (level === 0) {
      const root: Page = { id: t.nextId++, level: node.level + 1, keys: [sep], kids: [node.id, sib.id], right: null, high: null }
      t.pages.set(root.id, root)
      t.root = root.id
      break
    }
    const parent = t.pages.get(path[level - 1])!
    let i = 0
    while (i < parent.keys.length && sep > parent.keys[i]) i++
    parent.keys.splice(i, 0, sep)
    parent.kids.splice(i + 1, 0, sib.id)
    node = parent
    level--
  }
  return t
}

function levels(t: Tree): Page[][] {
  const out: Page[][] = []
  let first: Page | undefined = t.pages.get(t.root)
  while (first) {
    const row: Page[] = []
    let p: Page | undefined = first
    while (p) { row.push(p); p = p.right ? t.pages.get(p.right) : undefined }
    out.push(row)
    first = first.level > 0 ? t.pages.get(first.kids[0]) : undefined
  }
  return out
}

function stats(t: Tree) {
  const leaves = [...t.pages.values()].filter((p) => p.level === 0)
  const fill = leaves.reduce((s, p) => s + p.keys.length, 0) / (leaves.length * CAP)
  return { pages: t.pages.size, leaves: leaves.length, fill, height: levels(t).length }
}

// deterministic pseudo-random so the demo is reproducible
function rng(seed: number) { return () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) }

type Mode = 'seq' | 'rand'
const KEY_W = 30, PAD = 6, PAGE_H = 34, ROW_GAP = 64

function TreeView({ t }: { t: Tree }) {
  const rows = levels(t)
  const pageW = (p: Page) => PAD * 2 + Math.max(1, p.keys.length) * KEY_W + (p.high !== null ? KEY_W + 4 : 0)
  // layout leaves left-to-right, then centre parents over their children
  const pos = new Map<number, { x: number; y: number; w: number }>()
  const leafRow = rows[rows.length - 1]
  let x = 8
  for (const p of leafRow) { const w = pageW(p); pos.set(p.id, { x, y: (rows.length - 1) * (PAGE_H + ROW_GAP) + 8, w }); x += w + 14 }
  const width = Math.max(x, 300)
  for (let r = rows.length - 2; r >= 0; r--) {
    let minX = 8
    for (const p of rows[r]) {
      const kids = p.kids.map((k) => pos.get(k)!).filter(Boolean)
      const w = pageW(p)
      const centre = kids.length ? (kids[0].x + kids[kids.length - 1].x + kids[kids.length - 1].w) / 2 : minX + w / 2
      const px = Math.max(minX, centre - w / 2)
      pos.set(p.id, { x: px, y: r * (PAGE_H + ROW_GAP) + 8, w })
      minX = px + w + 14
    }
  }
  const height = rows.length * (PAGE_H + ROW_GAP) - ROW_GAP + 24
  const hot = new Set(t.lastPath), split = new Set(t.lastSplit)
  return (
    <svg viewBox={`0 0 ${Math.max(width, 300)} ${height}`} className="w-full" style={{ minWidth: Math.min(width, 900), maxHeight: 420 }} role="img" aria-label="B-tree pages by level">
      <defs><marker id="rl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-pointer)" /></marker></defs>
      {/* downlinks */}
      {rows.slice(0, -1).flatMap((row) => row.flatMap((p) => p.kids.map((k, i) => {
        const a = pos.get(p.id)!, b = pos.get(k)!
        const sx = a.x + PAD + i * KEY_W
        return <motion.line key={`d${p.id}-${k}`} initial={false} animate={{ x1: sx, y1: a.y + PAGE_H, x2: b.x + b.w / 2, y2: b.y }} stroke="var(--muted)" strokeWidth={1} opacity={0.6} />
      })))}
      {/* right-links */}
      {rows.flatMap((row) => row.slice(0, -1).map((p, i) => {
        const a = pos.get(p.id)!, b = pos.get(row[i + 1].id)!
        return <motion.line key={`r${p.id}`} initial={false} animate={{ x1: a.x + a.w, y1: a.y + PAGE_H / 2, x2: b.x - 2, y2: b.y + PAGE_H / 2 }} stroke="var(--c-pointer)" strokeWidth={1.4} markerEnd="url(#rl)" />
      }))}
      {/* pages */}
      {rows.flat().map((p) => {
        const a = pos.get(p.id)!
        const t1 = split.has(p.id) ? 'new' : hot.has(p.id) ? 'accent' : p.level === 0 ? 'muted' : 'header'
        return (
          <motion.g key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1, x: a.x, y: a.y }} transition={{ type: 'spring', stiffness: 170, damping: 24 }}>
            <rect width={a.w} height={PAGE_H} rx={5} fill={toneBg(t1, 18)} stroke={tone(t1)} strokeWidth={split.has(p.id) || hot.has(p.id) ? 2 : 1} />
            <text x={4} y={-4} fontSize={9} fill="var(--muted)" fontFamily="var(--font-mono)">blk {p.id}</text>
            {p.high !== null && (
              <g>
                <rect x={a.w - PAD - KEY_W} y={5} width={KEY_W + 2} height={PAGE_H - 10} rx={3} fill={toneBg('pointer', 30)} />
                <text x={a.w - PAD - KEY_W / 2 + 1} y={PAGE_H / 2 + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--c-pointer)" fontFamily="var(--font-mono)">{p.high}</text>
                <text x={a.w - PAD - KEY_W / 2 + 1} y={-4} textAnchor="middle" fontSize={8.5} fill="var(--c-pointer)" fontFamily="var(--font-mono)">high</text>
              </g>
            )}
            {p.keys.map((k, i) => (
              <text key={k} x={PAD + i * KEY_W + KEY_W / 2} y={PAGE_H / 2 + 4} textAnchor="middle" fontSize={11.5}
                fontWeight={k === t.lastKey ? 800 : 500} fill={k === t.lastKey ? 'var(--c-new)' : 'var(--text)'} fontFamily="var(--font-mono)">{k}</text>
            ))}
          </motion.g>
        )
      })}
    </svg>
  )
}

function BTreeViz() {
  const [mode, setMode] = useState<Mode>('seq')
  const [tree, setTree] = useState<Tree>(emptyTree)
  const [counter, setCounter] = useState(1)
  const rand = useMemo(() => rng(42), [])
  const s = stats(tree)

  const nextKey = (m: Mode, c: number) => (m === 'seq' ? c * 10 : 10 + Math.floor(rand() * 990))
  const add = (n: number) => {
    let t = tree, c = counter
    for (let i = 0; i < n; i++) { t = insert(t, nextKey(mode, c)); c++ }
    setTree(t); setCounter(c)
  }
  const reset = (m: Mode = mode) => { setTree(emptyTree()); setCounter(1); setMode(m) }

  const split = tree.lastSplit.length > 0
  const msg = tree.lastKey === null
    ? 'A new index is just the metapage (block 0). The first insert creates the root, a single leaf page (block 1). Add keys to grow it.'
    : split
      ? `Inserting **${tree.lastKey}** overflowed a page, so it **split**: some keys moved to a new right sibling (orange), the old page got a **high key** = the sibling's first key, and a downlink went up to the parent${s.height > 1 && tree.lastSplit.length > 2 ? ', which split too' : ''}.${mode === 'seq' && tree.lastSplit.length === 2 ? ' Appending at the right edge keeps the old page **90% full** (fillfactor), so sequential keys pack densely.' : ''}`
      : `**${tree.lastKey}** descended root → leaf (blue path) by comparing with separator keys, and fitted without a split.`

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Key pattern" value={mode} onChange={(m) => reset(m)} options={[['seq', 'Sequential keys (bigint, UUIDv7)'], ['rand', 'Random keys (UUIDv4)']]} />
        <button onClick={() => add(1)} data-testid="viz-next" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent">Insert 1</button>
        <button onClick={() => add(10)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent">Insert 10</button>
        <button onClick={() => reset()} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-ink">Reset</button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[['Pages', String(s.pages)], ['Height', String(s.height)], ['Page splits', String(tree.splits)], ['Avg leaf fill', `${Math.round(s.fill * 100)}%`]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line bg-surface-2 px-3 py-2"><p className="text-[11px] tracking-wide text-muted uppercase">{k}</p>
            <motion.p key={v} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-mono text-lg font-bold" style={k === 'Avg leaf fill' ? { color: s.fill > 0.8 ? 'var(--c-ok)' : 'var(--c-new)' } : undefined}>{v}</motion.p></div>
        ))}
      </div>
      <div className="min-h-[56px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
        <AnimatePresence mode="wait"><motion.p key={`${tree.lastKey}-${tree.splits}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Md>{msg}</Md></motion.p></AnimatePresence>
      </div>
      <Legend items={[['header', 'internal page'], ['muted', 'leaf page'], ['accent', 'search path'], ['new', 'just split'], ['pointer', 'high key + right-link']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin"><TreeView t={tree} /></div>
      <p className="text-xs text-muted"><Md>{`Demo pages hold ${CAP} keys. A real 8 KB leaf holds hundreds (366 \`bigint\` keys plus a high key in the playground), so real trees are only 3 or 4 levels deep even at a billion rows.`}</Md></p>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'btree',
  module: 'm4',
  order: 4,
  title: 'B-Tree internals: splits, high keys and right-links',
  tldr: [
    "PostgreSQL's default index is a **B+tree** whose pages are sibling-linked on every level, and every page except the rightmost carries a **high key**, the upper bound of the keys it may hold.",
    'Those two additions, from **Lehman & Yao**, let readers descend without locking parents: a reader that lands on a page split behind its back notices its key exceeds the high key and simply **moves right**.',
  ],
  visualizer: {
    title: 'Grow a B-Tree, one key at a time',
    caption: 'Insert keys and watch descents and page splits. Then reset, switch to **random keys**, and compare page count and leaf fill. That gap is the UUIDv4 vs UUIDv7 story.',
    Component: BTreeViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE seq (id bigint PRIMARY KEY, n int);
INSERT INTO seq SELECT g, g FROM generate_series(1, 20000) g;
CREATE TABLE v4 (id uuid PRIMARY KEY DEFAULT uuidv4(), n int);
CREATE TABLE v7 (id uuid PRIMARY KEY DEFAULT uuidv7(), n int);
INSERT INTO v4 (n) SELECT g FROM generate_series(1, 20000) g;
INSERT INTO v7 (n) SELECT g FROM generate_series(1, 20000) g;`,
    presets: [
      { label: 'Metapage', sql: `SELECT root, level, fastroot, fastlevel, allequalimage
FROM bt_metap('seq_pkey');`,
        note: 'Block 0 is the **metapage**. `level` is the root height (0 = the root is a leaf). `allequalimage` = true means deduplication is safe.' },
      { label: 'A leaf page', sql: `SELECT blkno, type, live_items, free_size, btpo_prev, btpo_next, btpo_level
FROM bt_page_stats('seq_pkey', 1);

SELECT itemoffset, ctid, itemlen, data
FROM bt_page_items('seq_pkey', 1) LIMIT 4;`,
        note: '`btpo_prev`/`btpo_next` are the sibling links. **Item 1 is the high key**: it is the first key of the right sibling, not a row on this page.' },
      { label: 'Root & downlinks', sql: `SELECT itemoffset, ctid AS downlink, data
FROM bt_page_items('seq_pkey', (SELECT root FROM bt_metap('seq_pkey')))
LIMIT 6;`,
        note: 'On internal pages, `ctid` holds `(child block, …)`: a downlink, not a heap row. The first item has no key and covers "minus infinity".' },
      { label: 'v4 vs v7 vs bigint', sql: `SELECT t AS key_type,
       pg_relation_size(t || '_pkey') / 8192 AS index_pages,
       pg_size_pretty(pg_relation_size(t || '_pkey')) AS size
FROM unnest(ARRAY['seq', 'v7', 'v4']) AS t;`,
        note: 'Same row count. Random UUIDv4 keys split pages all over the index (about 23% more pages here). UUIDv7 and bigint append at the right edge and pack leaves to about 90%.' },
      { label: 'Leaf fill %', sql: `SELECT t AS key_type, round(avg(100 - s.free_size * 100.0 / 8148), 1) AS avg_leaf_fill_pct, count(*) AS leaf_pages
FROM unnest(ARRAY['seq', 'v7', 'v4']) AS t,
     LATERAL generate_series(1, (pg_relation_size(t || '_pkey') / 8192 - 1)::int) AS b,
     LATERAL bt_page_stats(t || '_pkey', b) AS s
WHERE s.type = 'l'
GROUP BY t ORDER BY 2 DESC;`,
        note: 'Walks every leaf with `bt_page_stats`. Expect about 90% for sequential keys and about 70% for random ones. Random fill keeps drifting lower as the index grows.' },
      { label: 'Index scan buffers', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF)
SELECT * FROM seq WHERE id = 12345;`,
        note: 'An equality lookup touches only a handful of buffers (metapage, root, leaf, heap page). `Index Searches: 1` (new in 18) counts descents of the tree.' },
      { label: 'Deduplication: posting lists', sql: `DROP TABLE IF EXISTS dup;
CREATE TABLE dup (id int, st int);
INSERT INTO dup SELECT g, g % 5 FROM generate_series(1, 20000) g;
CREATE INDEX dup_st ON dup (st);
CREATE INDEX dup_st_plain ON dup (st) WITH (deduplicate_items = off);

SELECT itemoffset, htid, array_length(tids, 1) AS tids_in_posting_list, itemlen
FROM bt_page_items('dup_st', 1) LIMIT 4;

SELECT pg_size_pretty(pg_relation_size('dup_st'))       AS deduplicated,
       pg_size_pretty(pg_relation_size('dup_st_plain')) AS plain;`,
        note: 'Only 5 distinct values in 20,000 rows. Equal keys are merged into one index tuple holding a **posting list** of heap TIDs (132 per tuple here; item 1 is the high key), so the index is 160 kB instead of 456 kB.' },
    ],
  },
  production: {
    title: 'Switching primary keys from UUIDv4 to UUIDv7',
    context: 'An orders service generated `uuid` primary keys client-side with v4 (fully random). At 300 M rows, insert latency crept up and the index outgrew RAM.',
    problem: 'Every insert landed on a **random leaf**. With the index larger than cache, most inserts first had to read a cold leaf from disk, and full leaves split down the middle, leaving pages about 65% full at scale. After every checkpoint, the first insert into each scattered leaf also wrote a full-page image of it to WAL.',
    solution: 'Generate **UUIDv7** keys, natively `uuidv7()` in PostgreSQL 18. The leading 48 bits are a millisecond timestamp, so new keys arrive in roughly ascending order and hit the rightmost leaf. Appends at the right edge fill leaves to `fillfactor` (90), and the hot leaf stays in cache.',
    sql: `ALTER TABLE orders ALTER COLUMN id SET DEFAULT uuidv7();
-- later, rebuild the bloated index online:
REINDEX INDEX CONCURRENTLY orders_pkey;
-- the timestamp is recoverable:
SELECT uuid_extract_timestamp(id) FROM orders LIMIT 1;`,
    outcome: 'UUIDv4 needs 23% more index pages than UUIDv7 at 20k rows and 39% more at 100k rows (64.7% vs 89.8% leaf fill). In production the bigger win is locality: inserts touch one hot leaf instead of thousands of cold ones, so fewer reads and less full-page-image WAL.',
  },
  pitfalls: [
    { title: 'Random keys on a large, write-heavy table',
      symptom: 'Insert throughput falls as the table grows, `shared_buffers` hit ratio drops, and WAL volume rises after each checkpoint.',
      cause: 'UUIDv4 (or hash-like) keys scatter inserts across all leaves. Each touched leaf must be read in, splits leave half-empty pages, and the first change to each page after a checkpoint writes a full-page image.',
      fix: 'Use time-ordered keys (`bigint` identity or `uuidv7()`). If a random id must be exposed externally, keep it as a secondary unique column and leave the primary key sequential.' },
    { title: 'Indexing values that are too large',
      symptom: '`ERROR: index row size … exceeds btree version 4 maximum 2704 for index …` when inserting a long text value.',
      cause: 'A B-Tree entry must fit in about **one third of a page**, so a page can always hold at least three items and split safely.',
      fix: 'Index a hash or prefix instead: `CREATE INDEX ON docs (md5(body))` for equality lookups, a trigram GIN index for search, or a `left(col, 100)` expression index.' },
    { title: 'Bloat after mass deletes',
      symptom: 'The index stays large and range scans stay slow after deleting most of the rows.',
      cause: 'VACUUM can only recycle a B-Tree page once it is **completely empty**. Sparse pages stay allocated, and the index never shrinks on its own.',
      fix: 'Run `REINDEX INDEX CONCURRENTLY idx;` (no long write lock), then check the size with `pg_relation_size`. For time-based purges, partition and drop whole partitions instead.' },
  ],
  pointers: [
    'Block 0 is the **metapage**. The **root** can move up as the tree grows. Leaf and internal pages on each level form a **doubly-linked list**.',
    'Every non-rightmost page stores a **high key**. If a reader\'s key is greater than it, the reader follows the **right-link**: that is the Lehman & Yao move-right rule.',
    'When a page is full: try **deleting dead entries**, then **deduplicate** into posting lists, and only then **split**. Splits cascade upward, and a root split adds a level.',
    'Appending new largest keys fills leaves to **fillfactor 90**; random keys split pages in half, leaving leaves only about 65–72% full.',
    'Entries max out at about **1/3 page** (2704 bytes); index a hash or prefix of big values. See [UUIDv4 vs UUIDv7](/m2/uuid-v4-v7) and [Designing indexes](/m4/index-design).',
  ],
  sources: ['btree.html', 'btree-implementation.html', 'sql-createindex.html', 'pageinspect.html', 'functions-uuid.html'],
}
