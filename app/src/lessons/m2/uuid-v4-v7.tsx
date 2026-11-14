import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Note, Stats } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1: a UUID bit-field explorer. UUIDs are generated in the browser with the same layout
 * PostgreSQL 18 uses (RFC 9562):
 *   v7: unix_ts_ms (48) | ver=7 (4) | rand_a = sub-millisecond fraction (12) | var=10 (2) | rand_b (62)
 *   v4: random (48)      | ver=4 (4) | random (12)                           | var=10 (2) | random (62)
 * Like PostgreSQL, the v7 generator bumps the sub-ms field when the clock has not advanced, so values
 * from one generator are strictly increasing (in PGlite the rand_a field reads 000, 001, 002, ...).
 * Visualizer 2: a leaf-level locality simulation. Pages hold 20 keys; a split of the rightmost page
 * by an appended maximum keeps it 90% full (fillfactor), any other split halves the page, as in nbtree.
 * ---------------------------------------------------------------------------------------------- */

const rnd = (n: number) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return a }
let lastMs = 0, lastFrac = 0

function makeV7(): Uint8Array {
  const now = performance.timeOrigin + performance.now()
  let ms = Math.floor(now), frac = Math.floor((now - ms) * 4096)
  if (ms < lastMs || (ms === lastMs && frac <= lastFrac)) { ms = lastMs; frac = lastFrac + 1; if (frac > 4095) { ms += 1; frac = 0 } }
  lastMs = ms; lastFrac = frac
  const b = rnd(16)
  for (let i = 0; i < 6; i++) b[i] = Math.floor(ms / 2 ** (8 * (5 - i))) & 0xff
  b[6] = 0x70 | (frac >> 8); b[7] = frac & 0xff
  b[8] = 0x80 | (b[8] & 0x3f)
  return b
}
function makeV4(): Uint8Array { const b = rnd(16); b[6] = 0x40 | (b[6] & 0x0f); b[8] = 0x80 | (b[8] & 0x3f); return b }
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
const fmt = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`

interface Field { name: string; bits: number; t: Tone; note: string }
const FIELDS: Record<'v7' | 'v4', Field[]> = {
  v7: [
    { name: 'unix_ts_ms', bits: 48, t: 'new', note: 'Milliseconds since 1970-01-01 UTC, big-endian. This is what makes v7 sort by creation time. 48 bits last until about the year 10889.' },
    { name: 'ver', bits: 4, t: 'header', note: 'Version nibble = 7. `uuid_extract_version()` reads it.' },
    { name: 'rand_a', bits: 12, t: 'pointer', note: 'PostgreSQL fills this with a **sub-millisecond timestamp fraction**, and bumps it if the clock has not moved, so values from one session keep increasing.' },
    { name: 'var', bits: 2, t: 'header', note: 'Variant bits `10`: an RFC 9562 UUID.' },
    { name: 'rand_b', bits: 62, t: 'tuple', note: '62 random bits make collisions between generators practically impossible.' },
  ],
  v4: [
    { name: 'random', bits: 48, t: 'tuple', note: 'Random. Two consecutive v4 values are no closer to each other than any other pair.' },
    { name: 'ver', bits: 4, t: 'header', note: 'Version nibble = 4.' },
    { name: 'random', bits: 12, t: 'tuple', note: 'Random.' },
    { name: 'var', bits: 2, t: 'header', note: 'Variant bits `10`.' },
    { name: 'random', bits: 62, t: 'tuple', note: '122 random bits in total. Nothing encodes time, so `uuid_extract_timestamp()` returns NULL.' },
  ],
}

/** Which field each hex digit (nibble) belongs to; the variant shares nibble 16 with rand_b. */
function nibbleTone(kind: 'v7' | 'v4', i: number): Tone {
  if (i === 12 || i === 16) return 'header'
  if (kind === 'v4') return 'tuple'
  return i < 12 ? 'new' : i < 16 ? 'pointer' : 'tuple'
}

function BitExplorer() {
  const [kind, setKind] = useState<'v7' | 'v4'>('v7')
  const [hist, setHist] = useState<{ h: string; kind: 'v7' | 'v4' }[]>(() => [{ h: hex(makeV7()), kind: 'v7' }])
  const [field, setField] = useState(0)
  const cur = hist[0]
  const gen = (k = kind) => setHist((h) => [{ h: hex(k === 'v7' ? makeV7() : makeV4()), kind: k }, ...h].slice(0, 6))
  const ms = cur.kind === 'v7' ? parseInt(cur.h.slice(0, 12), 16) : null
  const frac = cur.kind === 'v7' ? parseInt(cur.h.slice(13, 16), 16) : null
  const f = FIELDS[cur.kind]
  let bit = 0
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="UUID version" value={kind} onChange={(k) => { setKind(k); gen(k); setField(0) }} options={[['v7', 'uuidv7()'], ['v4', 'uuidv4()']]} />
        <Btn primary testid="viz-next" onClick={() => gen()}>Generate</Btn>
        <Btn onClick={() => { for (let i = 0; i < 5; i++) gen() }}>Generate 5 quickly</Btn>
      </div>
      <Panel title="128 bits = 16 bytes = 32 hex digits">
        <div className="flex flex-wrap items-center gap-0.5 font-mono text-[15px] font-semibold">
          {[...cur.h].map((c, i) => (
            <span key={`${cur.h}-${i}`} className="contents">
              {(i === 8 || i === 12 || i === 16 || i === 20) && <span className="px-0.5 text-muted">-</span>}
              <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.012 }}
                className="rounded px-[3px] py-0.5" style={{ background: toneBg(nibbleTone(cur.kind, i), 22), color: 'var(--text)' }}>{c}</motion.span>
            </span>
          ))}
        </div>
        <svg viewBox="0 0 640 44" className="mt-3 w-full min-w-[520px]" role="img" aria-label="Bit fields">
          {f.map((x, i) => {
            const x0 = 4 + (bit / 128) * 632, w = (x.bits / 128) * 632; bit += x.bits
            return (
              <g key={i} onClick={() => setField(i)} style={{ cursor: 'pointer' }}>
                <rect x={x0} y={4} width={w - 2} height={24} rx={4} fill={toneBg(x.t, field === i ? 36 : 18)} stroke={tone(x.t)} strokeWidth={field === i ? 2 : 1} />
                {w > 34 && <text x={x0 + w / 2} y={20} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--text)" fontFamily="var(--font-mono)">{x.name}</text>}
                <text x={x0 + w / 2} y={40} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{x.bits}</text>
              </g>
            )
          })}
        </svg>
        <p className="mt-1 text-sm text-muted"><Md>{`**${f[field].name}** (${f[field].bits} bits): ${f[field].note}`}</Md></p>
      </Panel>
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Decoded">
          <FieldTable rows={[
            ['uuid_extract_version', cur.kind === 'v7' ? '7' : '4'],
            ['first 48 bits', ms !== null ? `0x${cur.h.slice(0, 12)} = ${ms}` : 'random (no timestamp)'],
            ['uuid_extract_timestamp', ms !== null ? new Date(ms).toISOString().replace('T', ' ').replace('Z', '+00') : 'NULL'],
            ['rand_a (sub-ms)', frac !== null ? `${frac}/4096 ≈ ${Math.round((frac / 4096) * 1000)} µs` : 'random'],
          ]} />
        </Panel>
        <Panel title="Most recent first">
          <div className="grid gap-1 font-mono text-[12px]">
            {hist.map((x, i) => {
              const older = hist[i + 1]
              const sorted = older ? x.h > older.h : null
              return (
                <motion.div key={x.h} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                  <span className="truncate">{fmt(x.h)}</span>
                  {sorted !== null && <span className="ml-auto shrink-0 text-[11px]" style={{ color: sorted ? tone('ok') : tone('dead') }}>{sorted ? '> previous' : '< previous'}</span>}
                </motion.div>
              )
            })}
          </div>
        </Panel>
      </div>
    </div>
  )
}

/* ---- leaf locality simulation ----------------------------------------------------------------- */

const CAP = 20
/** `ids` gives every leaf a stable id, so `touched` still names the right page after later splits shift the array. */
interface Sim { leaves: number[][]; ids: number[]; nextId: number; touched: number[]; n: number; splits: number; seq: number }
const emptySim = (): Sim => ({ leaves: [[]], ids: [0], nextId: 1, touched: [], n: 0, splits: 0, seq: 0 })

function simInsert(s: Sim, key: number): Sim {
  const leaves = s.leaves.map((l) => [...l])
  let i = leaves.findIndex((_, j) => j === leaves.length - 1 || key < leaves[j + 1][0])
  if (i < 0) i = 0
  const leaf = leaves[i]
  const ids = [...s.ids]
  const hitId = ids[i]
  let nextId = s.nextId
  leaf.push(key); leaf.sort((a, b) => a - b)
  let splits = s.splits
  if (leaf.length > CAP) {
    splits++
    const appended = i === leaves.length - 1 && leaf[leaf.length - 1] === key
    const keep = appended ? Math.round(CAP * 0.9) : Math.ceil(leaf.length / 2)
    leaves.splice(i + 1, 0, leaf.splice(keep))
    ids.splice(i + 1, 0, nextId++)
  }
  return { leaves, ids, nextId, touched: [...s.touched, hitId].slice(-40), n: s.n + 1, splits, seq: s.seq + 1 }
}

function LocalitySim() {
  const [mode, setMode] = useState<'v7' | 'v4'>('v4')
  const [sim, setSim] = useState<Sim>(emptySim)
  const seed = useRef(7)
  const rand = () => ((seed.current = (seed.current * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  const add = (k: number) => { let s = sim; for (let j = 0; j < k; j++) s = simInsert(s, mode === 'v7' ? s.seq + 1 : rand()); setSim(s) }
  const fill = sim.n ? sim.n / (sim.leaves.length * CAP) : 0
  const distinct = new Set(sim.touched.slice(-10)).size
  const heat = useMemo(() => { const m = new Map<number, number>(); sim.touched.forEach((i, k) => m.set(i, k)); return m }, [sim.touched])
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Key type" value={mode} onChange={(m) => { setMode(m); setSim(emptySim()) }} options={[['v4', 'UUIDv4 keys'], ['v7', 'UUIDv7 keys']]} />
        <Btn onClick={() => add(40)}>Insert 40</Btn>
        <Btn onClick={() => add(200)}>Insert 200</Btn>
        <Btn onClick={() => setSim(emptySim())}>Reset</Btn>
      </div>
      <Stats items={[['Keys', String(sim.n)], ['Leaf pages', String(sim.leaves.length)], ['Avg leaf fill', `${Math.round(fill * 100)}%`, fill > 0.8 ? 'ok' : sim.n ? 'dead' : undefined], ['Leaves hit by last 10 inserts', String(distinct), distinct > 2 ? 'dead' : 'ok']]} />
      <div className="flex flex-wrap gap-1" aria-label="Leaf pages">
        {sim.leaves.map((l, i) => {
          const age = heat.get(sim.ids[i])
          const hot = age !== undefined ? 0.25 + 0.75 * ((age + 1) / sim.touched.length) : 0
          return (
            <motion.div key={sim.ids[i]} layout title={`leaf ${i}: ${l.length}/${CAP} keys`} className="relative h-10 w-5 overflow-hidden rounded-sm border"
              style={{ borderColor: hot ? tone('new') : 'var(--border)', background: hot ? toneBg('new', Math.round(hot * 40)) : undefined }}>
              <motion.div className="absolute inset-x-0 bottom-0" animate={{ height: `${(l.length / CAP) * 100}%` }} style={{ background: toneBg('tuple', 45) }} />
            </motion.div>
          )
        })}
      </div>
      <Note k={`${mode}-${sim.n > 0}`}><Md>{sim.n === 0
        ? 'Insert keys and watch which leaf pages get written (orange = touched recently, bar height = fill).'
        : mode === 'v7'
          ? 'Every v7 key is larger than the last, so every insert lands on the **rightmost leaf**. One hot page stays in cache, and splits leave pages **90% full**.'
          : 'v4 keys land on **random leaves** all over the index. On a big index most of those pages are not in cache, and mid-page splits leave pages only about two-thirds full.'}</Md></Note>
      <Legend items={[['tuple', 'keys in the leaf'], ['new', 'written by a recent insert']]} />
    </div>
  )
}

function UuidViz() {
  const [view, setView] = useState<'bits' | 'sim'>('bits')
  return (
    <div className="grid gap-3">
      <div><Segmented label="View" value={view} onChange={setView} options={[['bits', 'Bit layout'], ['sim', 'Index locality']]} /></div>
      {view === 'bits' ? <BitExplorer /> : <LocalitySim />}
    </div>
  )
}

export const lesson: Lesson = {
  slug: 'uuid-v4-v7',
  module: 'm2',
  order: 4,
  title: 'UUIDv4 vs UUIDv7',
  tldr: [
    'A `uuid` is a 16-byte value: **UUIDv4** is 122 random bits, while **UUIDv7** starts with a 48-bit millisecond timestamp, so new values sort after older ones.',
    'Random keys scatter inserts across a B-tree, while time-ordered keys append at its right edge, so PostgreSQL 18 added a native `uuidv7()` that keeps the global uniqueness of UUIDs with the index locality of a sequence.',
  ],
  visualizer: {
    title: 'Inside a UUID, and what it does to an index',
    caption: 'Generate UUIDs and click each bit field to see what it encodes. Then switch to **Index locality** and insert v4 vs v7 keys to see which leaf pages every insert has to touch.',
    Component: UuidViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE k_bigint (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, n int);
CREATE TABLE k_v7 (id uuid PRIMARY KEY DEFAULT uuidv7(), n int);
CREATE TABLE k_v4 (id uuid PRIMARY KEY DEFAULT uuidv4(), n int);
INSERT INTO k_bigint (n) SELECT g FROM generate_series(1, 50000) g;
INSERT INTO k_v7 (n) SELECT g FROM generate_series(1, 50000) g;
INSERT INTO k_v4 (n) SELECT g FROM generate_series(1, 50000) g;`,
    presets: [
      { label: 'Generate & decode', sql: `SELECT u, uuid_extract_version(u) AS version, uuid_extract_timestamp(u) AS ts
FROM (VALUES (uuidv7()), (uuidv4()), (gen_random_uuid())) AS t(u);`,
        note: '`gen_random_uuid()` is the same as `uuidv4()`. Only v7 (and v1) carry a timestamp; for v4 it is NULL.' },
      { label: 'v7 is ordered', sql: `SELECT n, uuidv7() AS id FROM generate_series(1, 5) n;

SELECT count(*) AS out_of_order_neighbours
FROM (SELECT id < lag(id) OVER (ORDER BY n) AS backwards FROM k_v7) s
WHERE backwards;`,
        note: 'Within one millisecond the 3rd group counts up (`7000`, `7001`, …): the sub-millisecond field keeps values increasing. Zero of 50,000 neighbours are out of order.' },
      { label: 'Storage size & input forms', sql: `SELECT pg_column_size(uuidv7())          AS uuid_bytes,
       pg_column_size(uuidv7()::text)    AS as_text_bytes,
       pg_column_size(1::bigint)         AS bigint_bytes;

SELECT '{A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11}'::uuid AS braces_upper_case,
       'a0eebc999c0b4ef8bb6d6bb9bd380a11'::uuid       AS no_hyphens,
       pg_input_is_valid('a0eebc99-9c0b', 'uuid')     AS truncated_is_valid;`,
        note: 'Native `uuid` is 16 bytes; the same value as `text` is 40. Input is forgiving (upper case, braces, no hyphens) and output is always the canonical lower-case form, so there is no reason to store UUIDs as text.' },
      { label: 'Index size: bigint vs v7 vs v4', sql: `SELECT t AS key_type,
       pg_relation_size(t || '_pkey') / 8192 AS index_pages,
       pg_size_pretty(pg_relation_size(t || '_pkey')) AS index_size
FROM unnest(ARRAY['k_bigint', 'k_v7', 'k_v4']) AS t;`,
        note: 'Same 50,000 rows. v7 is larger than bigint only because keys are 16 bytes instead of 8. v4 is about **40% larger again** than v7, purely from half-empty pages.' },
      { label: 'Leaf fill', sql: `SELECT t AS key_type, round(avg(100 - s.free_size * 100.0 / 8148), 1) AS avg_leaf_fill_pct
FROM unnest(ARRAY['k_bigint', 'k_v7', 'k_v4']) AS t,
     LATERAL generate_series(1, (pg_relation_size(t || '_pkey') / 8192 - 1)::int) AS b,
     LATERAL bt_page_stats(t || '_pkey', b) AS s
WHERE s.type = 'l'
GROUP BY t ORDER BY 2 DESC;`,
        note: 'About 90% for bigint and v7 (right-edge appends respect fillfactor 90) versus about 63% for v4 (the exact figure varies a little per run, since the keys are random).' },
      { label: 'WAL after a checkpoint', sql: `CREATE TEMP TABLE mark (l pg_lsn);
CREATE TEMP TABLE wal (key_type text, wal_bytes numeric);

CHECKPOINT;
INSERT INTO mark VALUES (pg_current_wal_lsn());
INSERT INTO k_v7 (n) SELECT g FROM generate_series(1, 2000) g;
INSERT INTO wal SELECT 'v7', pg_current_wal_lsn() - l FROM mark;

CHECKPOINT;
UPDATE mark SET l = pg_current_wal_lsn();
INSERT INTO k_v4 (n) SELECT g FROM generate_series(1, 2000) g;
INSERT INTO wal SELECT 'v4', pg_current_wal_lsn() - l FROM mark;

SELECT key_type, pg_size_pretty(wal_bytes) AS wal_for_2000_inserts FROM wal;`,
        note: 'The first change to a page after a checkpoint writes a **full-page image** into WAL. 2,000 v7 keys touch a handful of right-edge leaves; 2,000 v4 keys touch hundreds of different leaves. Expect roughly **4 to 5 times more WAL** for v4 (about 1.7 MB against 0.3 to 0.4 MB; keys are random, so it varies).' },
      { label: 'Shifted timestamps', sql: `SELECT uuid_extract_timestamp(uuidv7(interval '-1 day')) AS yesterday,
       uuid_extract_timestamp(uuidv7())                   AS now,
       uuidv7(interval '-1 day') < uuidv7()               AS sorts_before;`,
        note: '`uuidv7(shift)` moves the embedded timestamp, which is useful for backfilling historical rows. Note that it reveals when a row was created.' },
    ],
  },
  production: {
    title: 'Moving an orders table from UUIDv4 to UUIDv7 keys',
    context: 'A commerce service generates `uuid` primary keys with `gen_random_uuid()` so that clients can create ids offline. The orders table grows by several million rows a day.',
    problem: 'As the primary-key index outgrew memory, insert latency rose. Each random key landed on a different leaf page, most of which had to be read from disk, and mid-page splits left leaves about two-thirds full.',
    solution: 'Switch the default to `uuidv7()` (native in PostgreSQL 18; clients can generate v7 too). Existing v4 keys stay valid because both are the same `uuid` type. New keys append at the right edge of the index. Rebuild the index online later to compact the old part.',
    sql: `ALTER TABLE orders ALTER COLUMN id SET DEFAULT uuidv7();
REINDEX INDEX CONCURRENTLY orders_pkey;   -- later, to repack old v4 pages
-- creation time is recoverable from the key:
SELECT uuid_extract_timestamp(id) FROM orders ORDER BY id DESC LIMIT 1;`,
    outcome: 'On 50,000 rows in the playground, the v4 index has about 275 pages at about 63% leaf fill (it varies slightly per run), the v7 index 194 pages at 90%. At production scale the larger win is that inserts touch one hot leaf instead of thousands of cold ones.',
  },
  pitfalls: [
    { title: 'Storing UUIDs as text',
      symptom: 'Indexes are 2–3 times larger than expected, and comparisons are slow and collation-dependent.',
      cause: 'The 36-character text form takes 37–40 bytes per value; the native type takes 16 and compares as raw bytes.',
      fix: 'Use the `uuid` type. It accepts upper case, braces and missing hyphens on input and always prints the standard form.',
      sql: `ALTER TABLE t ALTER COLUMN id TYPE uuid USING id::uuid;` },
    { title: 'Leaking creation time through UUIDv7',
      symptom: 'Public URLs like `/orders/01a1d827-…` reveal when each order was placed and roughly how many are created per day.',
      cause: 'The first 48 bits of a v7 UUID are a readable millisecond timestamp. `uuid_extract_timestamp()` decodes it.',
      fix: 'Keep v7 as the internal primary key, and expose a separate random v4 (or another opaque token) where the creation time must stay private.' },
    { title: 'Assuming v7 values are globally ordered',
      symptom: 'Rows inserted by different servers or clients appear slightly out of order when sorted by id.',
      cause: 'Ordering is only as good as the clocks. PostgreSQL guarantees increasing values within one session, but separate generators with clock skew interleave.',
      fix: 'Use a `timestamptz` column (or a sequence) when you need exact ordering. Treat v7 order as "roughly by creation time", which is all an index needs.' },
    { title: 'Benchmarking v4 vs v7 with buffer statistics',
      symptom: 'A comparison based on `pg_statio_user_indexes` (`idx_blks_read`, `idx_blks_hit`) shows little difference, and the team concludes the key type does not matter.',
      cause: 'Those counters measure buffer reads, not page splits or fill. On a small test that fits in memory every page is a hit for both key types. A common claim is that these views show page splits; they do not.',
      fix: 'Compare what the key type actually changes: index size (`pg_relation_size`), leaf fill (`bt_page_stats`), and WAL volume per insert after a checkpoint (`pg_current_wal_lsn()` before and after).',
      sql: `SELECT pg_size_pretty(pg_relation_size('k_v4_pkey')) AS v4,
       pg_size_pretty(pg_relation_size('k_v7_pkey')) AS v7;` },
  ],
  pointers: [
    '`uuid` is **16 bytes**, compared byte by byte. Store it as `uuid`, never as text.',
    '`gen_random_uuid()` = `uuidv4()` (random); `uuidv7([shift])` puts a **48-bit Unix-ms timestamp** first.',
    'Decode with `uuid_extract_version()` and `uuid_extract_timestamp()` (v1 and v7 only).',
    'Random keys scatter writes (more dirty pages, more full-page images in WAL) and leave B-tree leaves about **2/3 full**; v7 keys append at the right edge and fill leaves to **90%**.',
    'v7 still takes **twice the space of bigint** per key: choose UUIDs for distributed id generation, not by default. See [B-Tree internals](/m4/btree) and [Checkpoints and full page writes](/m7/checkpoints-fpw).',
  ],
  sources: ['datatype-uuid.html', 'functions-uuid.html', 'btree-implementation.html', 'pageinspect.html', 'sql-createtable.html'],
}
