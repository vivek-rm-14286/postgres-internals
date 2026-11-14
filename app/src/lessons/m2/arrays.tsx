import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, Tag, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, ByteGrid, Note, type Seg } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer A: the on-disk ArrayType layout (src/include/utils/array.h), little-endian:
 *   vl_len_ (4) | ndim (4) | dataoffset (4, 0 = no null bitmap) | elemtype (4)
 *   dims[ndim] (4 each) | lbound[ndim] (4 each) | [null bitmap, then MAXALIGN] | elements
 * Every size below equals pg_column_size() on PostgreSQL 18, and the text[] bytes match a
 * heap_page_items() dump of a real row.
 * Visualizer B: GIN on text[]: each element becomes a key with a posting list of row ids.
 * ---------------------------------------------------------------------------------------------- */

const le32 = (n: number) => [0, 8, 16, 24].map((s) => ((n >>> s) & 0xff).toString(16).padStart(2, '0')).join(' ')
const le64 = (n: number) => `${le32(n)} 00 00 00 00`
const asciiHex = (s: string) => [...s].map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')

interface Sample { id: string; literal: string; elem: 'int4' | 'int8' | 'text'; oid: number; dims: number[]; vals: (string | null)[]; measured: number; inRow: number }
const SAMPLES: Sample[] = [
  { id: 'a', literal: "'{1,2,3}'::int4[]", elem: 'int4', oid: 23, dims: [3], vals: ['1', '2', '3'], measured: 36, inRow: 33 },
  { id: 'b', literal: "'{1,NULL,3}'::int4[]", elem: 'int4', oid: 23, dims: [3], vals: ['1', null, '3'], measured: 40, inRow: 37 },
  { id: 'c', literal: "'{{1,2},{3,4}}'::int4[]", elem: 'int4', oid: 23, dims: [2, 2], vals: ['1', '2', '3', '4'], measured: 48, inRow: 45 },
  { id: 'd', literal: "'{1,2,3}'::int8[]", elem: 'int8', oid: 20, dims: [3], vals: ['1', '2', '3'], measured: 48, inRow: 45 },
  { id: 'e', literal: "'{red,blue}'::text[]", elem: 'text', oid: 25, dims: [2], vals: ['red', 'blue'], measured: 40, inRow: 37 },
]

function arrayLayout(s: Sample) {
  const segs: Seg[] = []
  const hasNull = s.vals.some((v) => v === null)
  const n = s.vals.length
  let off = 16 + 8 * s.dims.length
  const bitmapBytes = hasNull ? Math.ceil(n / 8) : 0
  const dataStart = hasNull ? Math.ceil((off + bitmapBytes) / 8) * 8 : off
  // total size
  let size = dataStart
  const elems: { v: string; len: number; pad: number }[] = []
  for (const v of s.vals) {
    if (v === null) continue
    const len = s.elem === 'int4' ? 4 : s.elem === 'int8' ? 8 : 4 + v.length
    const al = s.elem === 'int8' ? 8 : 4
    const end = size + len
    const padded = Math.ceil(end / al) * al
    elems.push({ v, len, pad: padded - end })
    size = padded
  }
  segs.push({ id: 'vl', label: 'vl_len_', bytes: 4, t: 'header', sub: le32(size << 2) })
  segs.push({ id: 'ndim', label: 'ndim', bytes: 4, t: 'header', sub: le32(s.dims.length) })
  segs.push({ id: 'doff', label: 'dataoffset', bytes: 4, t: 'header', sub: le32(hasNull ? dataStart : 0) })
  segs.push({ id: 'etype', label: 'elemtype', bytes: 4, t: 'header', sub: le32(s.oid) })
  s.dims.forEach((d, i) => segs.push({ id: `dim${i}`, label: `dims[${i}]`, bytes: 4, t: 'header', sub: le32(d) }))
  s.dims.forEach((_, i) => segs.push({ id: `lb${i}`, label: `lbound[${i}]`, bytes: 4, t: 'header', sub: le32(1) }))
  if (hasNull) {
    const bits = s.vals.reduce((b, v, i) => (v === null ? b : b | (1 << i)), 0)
    segs.push({ id: 'nb', label: 'null bitmap', bytes: bitmapBytes, t: 'pointer', sub: bits.toString(2).padStart(n, '0') })
    if (dataStart > off + bitmapBytes) segs.push({ id: 'nbpad', label: 'pad', bytes: dataStart - off - bitmapBytes, t: 'dead', pad: true })
  }
  off = dataStart
  elems.forEach((e, i) => {
    const sub = s.elem === 'int4' ? le32(+e.v) : s.elem === 'int8' ? le64(+e.v) : `${le32(e.len << 2)} ${asciiHex(e.v)}`
    segs.push({ id: `el${i}`, label: s.elem === 'text' ? `'${e.v}'` : e.v, bytes: e.len, t: s.elem === 'text' ? 'new' : 'tuple', sub })
    if (e.pad) segs.push({ id: `elpad${i}`, label: 'pad', bytes: e.pad, t: 'dead', pad: true })
  })
  return { segs, size, dataStart, hasNull }
}

const FIELD_NOTES: Record<string, string> = {
  vl: 'Varlena length word: total bytes, shifted left 2 (the low bits are TOAST flags). Inside a heap row a value this small gets a **1-byte header** instead.',
  ndim: 'Number of dimensions. `\'{}\'` has `ndim = 0` and is just these 16 header bytes.',
  doff: '**0 means "no null bitmap"**. Otherwise it is the byte offset where element data starts.',
  etype: 'OID of the element type (23 = int4, 20 = int8, 25 = text), so the array is self-describing.',
  nb: 'One bit per element, **1 = present**. NULL elements take no data bytes at all.',
}

function BytesMode() {
  const [i, setI] = useState(0)
  const [sel, setSel] = useState('doff')
  const s = SAMPLES[i]
  const L = arrayLayout(s)
  const seg = L.segs.find((x) => x.id === sel)
  const note = seg && (FIELD_NOTES[seg.id] ?? (seg.id.startsWith('dim') ? 'Length of this dimension.' : seg.id.startsWith('lb') ? 'Lower bound of this dimension. Default **1**: PostgreSQL arrays are 1-based, but `\'[0:2]={7,8,9}\'` stores 0 here.' : seg.pad ? 'Alignment padding: each element starts at a multiple of its `typalign`.' : `Element data. ${s.elem === 'text' ? 'Inside arrays, text elements keep a full **4-byte** varlena header and 4-byte alignment.' : `A plain ${s.elem}, aligned to ${s.elem === 'int8' ? 8 : 4} bytes.`}`))
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setI((i + 1) % SAMPLES.length)}>Next value</Btn>
        {SAMPLES.map((x, k) => <Btn key={x.id} active={k === i} onClick={() => setI(k)}><span className="font-mono">{x.literal}</span></Btn>)}
      </div>
      <Note k={s.id}><Md>{`\`pg_column_size(${s.literal})\` = **${s.measured} bytes** (in a row: **${s.inRow}**, with a 1-byte header). ${L.hasNull ? 'The NULL costs one bitmap bit, then padding to 8 bytes.' : `Header ${16 + 8 * s.dims.length} bytes, data ${s.measured - 16 - 8 * s.dims.length} bytes.`}`}</Md></Note>
      <Legend items={[['header', 'header, dims, lower bounds'], ['pointer', 'null bitmap'], ['tuple', 'fixed-width elements'], ['new', 'varlena elements'], ['dead', 'padding']]} />
      <div className="overflow-x-auto scrollbar-thin"><ByteGrid segs={L.segs} cell={64} selected={sel} onSelect={setSel} /></div>
      <Panel title={seg ? `${seg.label} · ${seg.bytes} bytes` : 'Inspector'}>
        {seg ? (<>
          <p className="font-mono text-xs">{seg.sub}</p>
          <p className="mt-1 text-sm text-muted"><Md>{note ?? ''}</Md></p>
        </>) : <p className="text-sm text-muted">Click a block.</p>}
      </Panel>
    </div>
  )
}

/* ---- GIN mode ---------------------------------------------------------------------------------- */

const ROWS: [number, string[]][] = [[1, ['red', 'blue']], [2, ['blue', 'green']], [3, ['red', 'green', 'blue']], [4, ['green']], [5, ['red']]]
const KEYS = ['blue', 'green', 'red']
const posting = (k: string) => ROWS.filter(([, t]) => t.includes(k)).map(([id]) => id)

interface GinState { query: string; keys: string[]; result: number[] | null; index: boolean; scan?: boolean; op?: 'and' | 'or' }
const ginSteps: Step<GinState>[] = [
  { title: 'Five rows with tag arrays', body: 'A GIN index on `tags` splits every array into its **elements**. Each distinct element becomes one key in a B-tree of keys.', state: { query: '', keys: [], result: null, index: false } },
  { title: 'Keys and posting lists', body: 'Each key points to a sorted **posting list** of row TIDs that contain it. `red` appears in rows 1, 3 and 5.', state: { query: '', keys: [], result: null, index: true } },
  { title: "WHERE tags @> '{red,blue}'", body: 'Containment needs **every** query element. GIN looks up `red` and `blue`, then **intersects** their posting lists.', state: { query: "tags @> '{red,blue}'", keys: ['red', 'blue'], result: [1, 3], op: 'and', index: true } },
  { title: "WHERE tags && '{green,red}'", body: 'Overlap needs **any** element, so the posting lists are **unioned**: every row has green or red.', state: { query: "tags && '{green,red}'", keys: ['green', 'red'], result: [1, 2, 3, 4, 5], op: 'or', index: true } },
  { title: "WHERE 'green' = ANY (tags)", body: '`= ANY` is not a GIN operator, so the planner **cannot use the index** and scans every row. Rewrite it as `tags @> \'{green}\'`.', state: { query: "'green' = ANY (tags)", keys: [], result: [2, 3, 4], scan: true, index: true } },
]

function GinView({ s }: { s: GinState }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Panel title="Heap rows">
        <div className="grid gap-1">
          {ROWS.map(([id, tags]) => {
            const hit = s.result?.includes(id)
            return (
              <motion.div key={id} layout animate={{ opacity: s.result && !hit ? 0.4 : 1 }} className="flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-[12px]"
                style={{ borderColor: hit ? tone('ok') : 'var(--border)', background: hit ? toneBg('ok', 14) : undefined }}>
                <span className="w-10 text-muted">(0,{id})</span>
                {tags.map((t) => <Tag key={t} t={s.keys.includes(t) ? 'accent' : 'muted'}>{t}</Tag>)}
                {s.scan && <span className="ml-auto text-[10px] text-muted">checked</span>}
              </motion.div>
            )
          })}
        </div>
      </Panel>
      <Panel title={s.scan ? 'GIN index (unused)' : 'GIN index: key → posting list'}>
        <div className="grid gap-1.5" style={{ opacity: s.scan ? 0.35 : 1 }}>
          {(s.index ? KEYS : []).map((k) => {
            const on = s.keys.includes(k)
            return (
              <motion.div key={k} layout initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 rounded-md border px-2 py-1 font-mono text-[12px]"
                style={{ borderColor: on ? tone('accent') : 'var(--border)', background: on ? toneBg('accent', 14) : undefined }}>
                <span className="w-12 font-semibold">{k}</span><span className="text-muted">→</span>
                {posting(k).map((id) => <span key={id} className="rounded bg-surface-2 px-1">(0,{id})</span>)}
              </motion.div>
            )
          })}
          {!s.index && <p className="text-sm text-muted">CREATE INDEX … USING gin (tags) extracts the keys.</p>}
        </div>
        {s.query && (
          <div className="mt-3 rounded-md border border-line bg-surface-2 px-2 py-1.5 font-mono text-[12px]">
            <p className="text-muted">{s.query}</p>
            <p className="mt-0.5">{s.scan ? 'Seq Scan, filter on every row' : `${s.keys.join(s.op === 'and' ? ' ∩ ' : ' ∪ ')} = {${s.result?.map((r) => `(0,${r})`).join(', ')}}`}</p>
          </div>
        )}
      </Panel>
    </div>
  )
}

function ArraysViz() {
  const [mode, setMode] = useState<'bytes' | 'gin'>('bytes')
  const toggle = <Segmented label="Mode" value={mode} onChange={setMode} options={[['bytes', 'Bytes on disk'], ['gin', 'GIN lookup']]} />
  if (mode === 'bytes') return <div className="grid gap-3"><div>{toggle}</div><BytesMode /></div>
  return <Stepper steps={ginSteps} interval={3000} extra={toggle} render={(s) => (
    <div className="grid gap-3"><Legend items={[['accent', 'keys used by the query'], ['ok', 'matching rows'], ['muted', 'other elements']]} /><GinView s={s} /></div>
  )} />
}

export const lesson: Lesson = {
  slug: 'arrays',
  module: 'm2',
  order: 2,
  title: 'Arrays',
  tldr: [
    'A PostgreSQL array is one **varlena value** holding a small header (dimensions, lower bounds, element type, optional null bitmap) followed by the aligned elements.',
    'Arrays let you keep a short list inside a row and search it with **GIN**-indexable operators like `@>` and `&&`, without a separate join table.',
  ],
  visualizer: {
    title: 'An array, byte by byte, and a GIN lookup',
    caption: 'In **Bytes on disk**, step through five arrays and click each field to see its little-endian bytes. Switch to **GIN lookup** to see how `@>`, `&&` and `= ANY` use, or fail to use, the index.',
    Component: ArraysViz,
  },
  playground: {
    setup: `
CREATE TABLE posts (id int PRIMARY KEY, title text, tags text[]);
INSERT INTO posts
SELECT g, 'post ' || g,
       ARRAY['tag' || (g % 50), 'tag' || ((g * 7) % 50), CASE WHEN g % 3 = 0 THEN 'featured' ELSE 'regular' END]
FROM generate_series(1, 20000) g;
CREATE INDEX posts_tags_gin ON posts USING gin (tags);
ANALYZE posts;
CREATE TABLE weather_data (station text, temps text);
INSERT INTO weather_data VALUES
  ('Station North', '-1,-4,-14,-15,-16,-15,-12,-9,-3,0,1,2'),
  ('Station West',  '2,4,5,6,9,10,15,16,13,12,10,9,5,3,1'),
  ('Station East',  '5,3,2,4,5,6,9,10,15,16,13,12,10,9,5,4,2,1'),
  ('Station South', '12,18,22,25,29,30,33,31,30,29,28,25,24,23,14');`,
    presets: [
      { label: 'Array sizes', sql: `SELECT pg_column_size('{1,2,3}'::int4[])        AS three_ints,
       pg_column_size('{1,NULL,3}'::int4[])     AS with_null,
       pg_column_size('{{1,2},{3,4}}'::int4[])  AS two_d,
       pg_column_size('{}'::int4[])             AS empty,
       pg_column_size('{1,2,3}'::int8[])        AS three_bigints;`,
        note: 'The 16-byte header plus 8 bytes per dimension, then the data: 36, 40, 48, 16 and 48 bytes, the numbers in the visualizer.' },
      { label: 'Dimensions & bounds', sql: `SELECT array_dims('{{1,2},{3,4}}'::int[])   AS dims,
       cardinality('{{1,2},{3,4}}'::int[])  AS elements,
       ('{7,8,9}'::int[])[0]                AS index_0_is_null,
       ('[0:2]={7,8,9}'::int[])[1]          AS custom_lower_bound,
       ARRAY[1, 2] || 3                     AS appended,
       array_append(ARRAY[1, 2], NULL)      AS append_null;`,
        note: 'Arrays are **1-based** and out-of-range reads return NULL instead of an error. A custom lower bound is stored in the header.' },
      { label: 'Operators', sql: `SELECT '{1,2,3}'::int[] @> '{3,1}'  AS contains,
       '{1,2}'::int[] <@ '{1,2,3}'   AS contained,
       '{1,2}'::int[] && '{2,9}'     AS overlaps,
       2 = ANY ('{1,2,3}'::int[])    AS any_match;`,
        note: '`@>` ignores order and duplicates. `&&` is true when any element is shared.' },
      { label: 'GIN: @> vs = ANY', sql: `EXPLAIN (COSTS OFF) SELECT count(*) FROM posts WHERE tags @> '{tag7}';

EXPLAIN (COSTS OFF) SELECT count(*) FROM posts WHERE 'tag7' = ANY (tags);`,
        note: 'The containment query uses a **Bitmap Index Scan** on the GIN index. The `= ANY` form asks for the same rows but can only run as a **Seq Scan**.' },
      { label: 'unnest & array_agg', sql: `SELECT tag, count(*) AS posts
FROM posts, unnest(tags) AS tag
GROUP BY tag ORDER BY posts DESC LIMIT 5;

SELECT id, array_agg(t ORDER BY n DESC) AS reversed
FROM posts, unnest(tags) WITH ORDINALITY AS u(t, n)
WHERE id = 3 GROUP BY id;`,
        note: '`unnest` turns an array into rows; `WITH ORDINALITY` adds each element\'s position. `array_agg` folds rows back into an array.' },
      { label: 'Strings to arrays: spot the bug', sql: `SELECT station, cardinality(string_to_array(temps, ',')) AS readings,
       pg_typeof(string_to_array(temps, ',')) AS type
FROM weather_data;

-- hottest and coldest reading per station, first attempt
SELECT station, max(t) AS max_temp, min(t) AS min_temp
FROM weather_data, unnest(string_to_array(temps, ',')) AS t
GROUP BY station ORDER BY station;

-- fixed: cast the array before aggregating
SELECT station, max(t) AS max_temp, min(t) AS min_temp
FROM weather_data, unnest(string_to_array(temps, ',')::int[]) AS t
GROUP BY station ORDER BY station;`,
        note: 'The first result looks plausible and is wrong: `string_to_array` returns `text[]`, so `max` compares strings and `\'9\'` beats `\'16\'`. Station North reports a minimum of -1 instead of **-16**. South happens to be right because all its readings have two digits. Casting to `int[]` fixes the rest.' },
      { label: 'Sort, reverse, compare', sql: `SELECT array_sort(ARRAY[3, 1, 4, 1, 5, 9, 2, 6])::text AS sorted,
       array_reverse(ARRAY[1, 2, 3])::text             AS reversed,
       array_reverse(ARRAY[[1, 2], [3, 4]])::text      AS reverse_2d,
       ARRAY[1, 3] < ARRAY[2, 1]                       AS compared_elementwise;

SELECT min(m)::text AS min_array, max(m)::text AS max_array
FROM (VALUES (ARRAY[45, 52, 38]), (ARRAY[67, 71, 58]), (ARRAY[23, 28, 15])) AS v(m);`,
        note: '`array_sort` and `array_reverse` are new in PostgreSQL 18; `array_reverse` flips only the first dimension. Arrays compare **element by element**, left to right, like strings: `{1,3} < {2,1}`, so `min` and `max` pick whole arrays by their first element.' },
      { label: 'The normalized alternative', sql: `CREATE TABLE post_tags AS SELECT id AS post_id, tag FROM posts, unnest(tags) AS tag;
CREATE INDEX ON post_tags (tag, post_id);
ANALYZE post_tags;

SELECT pg_size_pretty(pg_total_relation_size('posts'))     AS posts_with_array_and_gin,
       pg_size_pretty(pg_total_relation_size('post_tags')) AS join_table_with_btree;

-- posts tagged both tag7 AND featured, in each model
SELECT count(*) AS array_model FROM posts WHERE tags @> ARRAY['tag7', 'featured'];
SELECT count(*) AS join_table_model
FROM (SELECT post_id FROM post_tags WHERE tag IN ('tag7', 'featured')
      GROUP BY post_id HAVING count(DISTINCT tag) = 2) s;`,
        note: 'Both models find the same 266 posts. The array needs one GIN lookup; the join table needs `GROUP BY … HAVING count = 2` (one scan, better than one self-join per tag). The join table is larger here but gives foreign keys, per-tag columns and cheap single-tag updates.' },
    ],
  },
  production: {
    title: 'Tag filtering on a content platform',
    context: 'A publishing team stores article tags as `text[]` and filters a listing page with `WHERE $1 = ANY (tags)`. The table holds 5 M articles.',
    problem: 'The team added a GIN index on `tags`, but the listing query still did a sequential scan and took seconds. `= ANY` is not an operator in the GIN `array_ops` class, so the index was never considered.',
    solution: 'Rewrite the predicate as containment, which the GIN index supports, and check the plan.',
    sql: `CREATE INDEX articles_tags_gin ON articles USING gin (tags);

-- before: Seq Scan
SELECT id FROM articles WHERE 'postgres' = ANY (tags);
-- after: Bitmap Index Scan on articles_tags_gin
SELECT id FROM articles WHERE tags @> ARRAY['postgres'];`,
    outcome: 'The plan switched from a Seq Scan to a Bitmap Index Scan, which the playground reproduces on 20k rows. The cost of a GIN lookup grows with the number of matching rows, not with table size, so rare tags become near-instant.',
  },
  pitfalls: [
    { title: 'Writing = ANY against a GIN index',
      symptom: 'A GIN index on an array column exists, but `EXPLAIN` shows a Seq Scan.',
      cause: 'GIN `array_ops` supports `@>`, `<@`, `&&` and `=`. `value = ANY (col)` is a scalar comparison and cannot use it.',
      fix: 'Write `col @> ARRAY[value]` for "contains this element", or `col && ARRAY[a, b]` for "contains any of".',
      sql: `EXPLAIN SELECT * FROM posts WHERE tags @> '{tag7}';` },
    { title: 'Updating one element rewrites the whole array',
      symptom: 'Appending to a large array in a hot row causes heavy WAL volume, table bloat and lock waits.',
      cause: 'An array is a single value. Any change writes a new row version containing the whole array (and new TOAST chunks if it is large).',
      fix: 'Keep arrays short and mostly read-only. Move growing lists such as event logs or followers into a child table.' },
    { title: 'Concatenating NULL behaves differently from array_append',
      symptom: '`tags || NULL` silently leaves the array unchanged, while `array_append(tags, NULL)` adds a NULL element.',
      cause: 'An untyped NULL next to `||` resolves to a NULL array, and concatenating a NULL array is a no-op.',
      fix: 'Use `array_append` / `array_prepend` when adding single elements, and add `CHECK (array_position(tags, NULL) IS NULL)` if NULL elements are not allowed.' },
    { title: 'Treating arrays as sets',
      symptom: 'Duplicates accumulate (`{a,a,b}`), and uniqueness or referential checks are written by hand in triggers.',
      cause: 'Arrays are ordered lists. Searching an array for specific elements is often a sign that the list belongs in a separate table.',
      fix: 'Use a join table when you need foreign keys, per-element data or uniqueness. Keep arrays for small ordered values such as tags or coordinates.' },
    { title: 'Aggregating split strings as text',
      symptom: 'A report built from comma-separated values says the hottest reading was 9 when the data contains 16, and the coldest was -1 instead of -16.',
      cause: '`string_to_array` and `unnest` return `text`. `max`, `min` and `ORDER BY` then compare strings character by character, so `\'9\'` > `\'16\'`. Nothing errors: the result just looks plausible.',
      fix: 'Cast at the source: `string_to_array(col, \',\')::int[]` or `unnest(...)::int`. Better, store numbers as `int[]` (or rows) so the type is enforced on write.',
      sql: `SELECT max(t) FROM unnest(string_to_array('2,9,16', ',')) AS t;         -- '9'
SELECT max(t) FROM unnest(string_to_array('2,9,16', ',')::int[]) AS t;  -- 16` },
  ],
  pointers: [
    'Header: **vl_len, ndim, dataoffset, elemtype** (16 bytes), then 8 bytes per dimension, then an optional null bitmap and the aligned elements.',
    '`dataoffset = 0` means no NULLs. NULL elements cost **one bit**, no data bytes.',
    'Arrays are **1-based**, out-of-range reads return NULL, and declared sizes like `int[3]` are not enforced.',
    'GIN `array_ops` indexes `@>`, `<@`, `&&` and `=`. Rewrite `x = ANY(col)` as `col @> ARRAY[x]`.',
    'Any change rewrites the whole array, so keep growing lists in a child table.',
  ],
  sources: ['arrays.html', 'functions-array.html', 'gin-builtin-opclasses.html', 'storage-toast.html', 'datatype.html'],
}
