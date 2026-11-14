import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, tone, toneBg } from '../../viz/kit'
import { ByteGrid, type Seg } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the TOAST pipeline for four real inserts into
 *   CREATE TABLE docs (id int PRIMARY KEY, body text);   -- toast table pg_toast.pg_toast_16442
 * Sizes, chunk ids, chunk lengths and the 18 pointer bytes were captured on PostgreSQL 18 with
 * pg_column_size, pg_column_compression, pg_column_toast_chunk_id and heap_page_items.
 * TOAST_TUPLE_THRESHOLD = TOAST_TUPLE_TARGET = 2032 bytes; TOAST_MAX_CHUNK_SIZE = 1996 bytes.
 * ---------------------------------------------------------------------------------------------- */

const THRESHOLD = 2032
interface Chunk { seq: number; len: number }
interface Case {
  id: string; label: string; sql: string; raw: number
  compressed?: number; inlineLen?: number
  chunkId?: number; chunks?: Chunk[]; ptr?: string; ptrNote?: [number, number]
}
const chunks = (total: number): Chunk[] => Array.from({ length: Math.ceil(total / 1996) }, (_, i) => ({ seq: i, len: Math.min(1996, total - i * 1996) }))

const CASES: Case[] = [
  { id: 'zip', label: 'Repetitive 9 kB text', sql: "INSERT INTO docs VALUES (1, repeat('postgres ', 1000));", raw: 9000, compressed: 122, inlineLen: 150 },
  { id: 'rand', label: 'Hash-like 9.6 kB text', sql: "INSERT INTO docs VALUES (2, (SELECT string_agg(md5(g::text), '') FROM generate_series(1, 300) g));", raw: 9600,
    chunkId: 16450, chunks: chunks(9600), ptr: '01 12 84 25 00 00 80 25 00 00 42 40 00 00 3e 40 00 00', ptrNote: [9604, 9600] },
  { id: 'big', label: 'Repetitive 1.2 MB text', sql: "INSERT INTO docs VALUES (3, repeat('abc', 400000));", raw: 1200000, compressed: 13745,
    chunkId: 16451, chunks: chunks(13745), ptr: '01 12 84 4f 12 00 b1 35 00 00 43 40 00 00 3e 40 00 00', ptrNote: [1200004, 13745] },
  { id: 'ext', label: 'Same 9 kB, STORAGE EXTERNAL', sql: "ALTER TABLE docs ALTER COLUMN body SET STORAGE EXTERNAL;\nINSERT INTO docs VALUES (4, repeat('postgres ', 1000));", raw: 9000,
    chunkId: 16452, chunks: chunks(9000), ptr: '01 12 2c 23 00 00 28 23 00 00 44 40 00 00 3e 40 00 00', ptrNote: [9004, 9000] },
]

type Phase = 'wide' | 'compress' | 'inline' | 'chunk' | 'pages' | 'pointer'
interface S { phase: Phase; row: number }

function stepsFor(c: Case): Step<S>[] {
  const first: Step<S> = { title: `INSERT a ${c.raw.toLocaleString('en-US')}-byte value`, body: `The row would be about **${(c.raw + 32).toLocaleString('en-US')} bytes**, but a tuple must fit on one 8 KB page. Anything over **${THRESHOLD} bytes** (\`TOAST_TUPLE_THRESHOLD\`) wakes the toaster.`, state: { phase: 'wide', row: c.raw + 32 } }
  if (c.id === 'zip') return [first,
    { title: 'EXTENDED: try compression first', body: '`body` uses the default **EXTENDED** strategy, so pglz compresses the value: 9,000 → **122 bytes**. After the 4-byte varlena header, a second 4-byte word records the raw size (9000) and the compression method.', state: { phase: 'compress', row: 150 } },
    { title: 'Small enough: stays inline', body: 'The row is now **150 bytes**, under `toast_tuple_target` (2032), so nothing goes to the TOAST table. `pg_column_compression(body)` = `pglz`.', state: { phase: 'inline', row: 150 } }]
  if (c.id === 'rand') return [first,
    { title: 'pglz gives up', body: 'Hex digests have few repeated substrings, so pglz cannot save enough and the value is kept **uncompressed**. The row is still too wide.', state: { phase: 'compress', row: c.raw + 32 } },
    { title: 'Slice into 1996-byte chunks', body: 'The value gets a new OID, **chunk_id 16450**, and is cut into chunks of at most `TOAST_MAX_CHUNK_SIZE` = 1996 bytes: 4 full ones plus 1616 bytes.', state: { phase: 'chunk', row: c.raw + 32 } },
    { title: 'Chunks are rows in pg_toast', body: 'Each chunk is a row `(chunk_id, chunk_seq, chunk_data)` of **2032 bytes**, so exactly **4 fit on a TOAST page**. A unique index on (chunk_id, chunk_seq) finds them.', state: { phase: 'pages', row: c.raw + 32 } },
    { title: 'The row keeps an 18-byte pointer', body: 'In the main table `body` is now a **TOAST pointer**: tag, raw size, stored size, value OID and TOAST table OID. The whole row is **46 bytes**.', state: { phase: 'pointer', row: 46 } }]
  if (c.id === 'big') return [first,
    { title: 'Compress: 1.2 MB → 13,745 bytes', body: 'pglz shrinks the value 87-fold, but **13,745 bytes is still over the target**, so the compressed bytes must move out of line too.', state: { phase: 'compress', row: 13745 + 28 } },
    { title: 'Slice the compressed bytes', body: 'Out-of-line storage holds the **compressed** form: 6 chunks of 1996 bytes plus 1769, under chunk_id 16451.', state: { phase: 'chunk', row: 13773 } },
    { title: 'Seven chunks on two TOAST pages', body: 'Four chunks per page again. Reading `body` fetches all seven through the TOAST index and decompresses them.', state: { phase: 'pages', row: 13773 } },
    { title: 'Pointer: raw 1,200,004 vs stored 13,745', body: 'The pointer\'s **stored size is smaller than its raw size**, which is how PostgreSQL knows the external data is compressed. The row is again just **46 bytes**.', state: { phase: 'pointer', row: 46 } }]
  return [first,
    { title: 'EXTERNAL: no compression', body: '`SET STORAGE EXTERNAL` skips compression and goes straight to out-of-line storage. It costs space, but `substring()` can fetch **only the chunks it needs**.', state: { phase: 'compress', row: c.raw + 32 } },
    { title: 'Five uncompressed chunks', body: '9,000 bytes = 4 × 1996 + 1016, under chunk_id 16452. The same text took 122 bytes with EXTENDED.', state: { phase: 'chunk', row: c.raw + 32 } },
    { title: 'Two TOAST pages', body: 'Four chunks fill one TOAST page; the fifth starts another.', state: { phase: 'pages', row: c.raw + 32 } },
    { title: 'Pointer with raw ≈ stored', body: 'Stored size 9000 = raw size − 4: **not compressed**. `pg_column_compression(body)` returns NULL.', state: { phase: 'pointer', row: 46 } }]
}

const order: Phase[] = ['wide', 'compress', 'inline', 'chunk', 'pages', 'pointer']
const reached = (p: Phase, q: Phase) => order.indexOf(p) >= order.indexOf(q)

function Meter({ bytes }: { bytes: number }) {
  const max = 10000
  const pct = Math.min(bytes / max, 1) * 100
  const over = bytes > THRESHOLD
  return (
    <div>
      <div className="relative h-7 w-full rounded border border-line bg-surface-2">
        <motion.div className="absolute inset-y-0 left-0 rounded" animate={{ width: `${Math.max(pct, 0.8)}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{ background: toneBg(over ? 'dead' : 'ok', 40), borderRight: `2px solid ${tone(over ? 'dead' : 'ok')}` }} />
        <div className="absolute inset-y-[-4px] w-0.5" style={{ left: `${(THRESHOLD / max) * 100}%`, background: 'var(--c-header)' }} />
        <span className="absolute -top-0.5 font-mono text-[10px]" style={{ left: `calc(${(THRESHOLD / max) * 100}% + 4px)`, color: 'var(--c-header)' }}>2032</span>
        <span className="absolute right-2 top-1.5 font-mono text-[11px] font-semibold">{bytes.toLocaleString('en-US')} B{bytes > max ? ' (off scale)' : ''}</span>
      </div>
      <p className="mt-1 text-xs text-muted">Main-table row size vs TOAST_TUPLE_THRESHOLD (2032 bytes). The bar is drawn to scale up to 10 kB.</p>
    </div>
  )
}

function ptrSegs(c: Case): Seg[] {
  const h = c.ptr!.split(' ')
  const f: [string, string, number, number][] = [['hdr', 'header', 0, 1], ['tag', 'header', 1, 2], ['va_rawsize', 'tuple', 2, 6], ['va_extinfo', 'new', 6, 10], ['va_valueid', 'muted', 10, 14], ['va_toastrelid', 'muted', 14, 18]]
  return f.map(([n, t, a, b]) => ({ id: n, label: n, bytes: b - a, t: t as Seg['t'], sub: h.slice(a, b).join(' ') }))
}

function ToastView({ c, s }: { c: Case; s: S }) {
  const [sel, setSel] = useState('va_extinfo')
  const pages = c.chunks ? Array.from({ length: Math.ceil(c.chunks.length / 4) }, (_, p) => c.chunks!.slice(p * 4, p * 4 + 4)) : []
  const notes: Record<string, string> = {
    hdr: '0x01: a 1-byte varlena header whose length bits are all zero, which marks an external TOAST pointer.',
    tag: `0x12 = 18 = VARTAG_ONDISK: the pointer refers to an on-disk TOAST value (16 bytes of fields follow, 18 bytes in total).`,
    va_rawsize: `${c.ptrNote?.[0].toLocaleString('en-US')}: original size including its 4-byte header.`,
    va_extinfo: `${c.ptrNote?.[1].toLocaleString('en-US')}: bytes actually stored out of line. The top 2 bits hold the compression method (00 = pglz).`,
    va_valueid: `${c.chunkId}: the chunk_id shared by all chunks of this value.`,
    va_toastrelid: '16446: OID of pg_toast.pg_toast_16442, the TOAST table (pg_class.reltoastrelid).',
  }
  return (
    <div className="grid gap-3">
      <pre className="font-mono text-[12px] whitespace-pre-wrap text-muted">{c.sql}</pre>
      <Meter bytes={s.row} />
      <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
        <Panel title="Toaster">
          <FieldTable rows={[
            ['strategy', c.id === 'ext' ? 'EXTERNAL' : 'EXTENDED', c.id === 'ext' ? 'out-of-line, no compression' : 'compress, then out-of-line'],
            ['raw size', `${c.raw.toLocaleString('en-US')} B`],
            ['compressed', reached(s.phase, 'compress') ? (c.compressed ? `${c.compressed.toLocaleString('en-US')} B (pglz)` : c.id === 'ext' ? 'skipped' : 'no gain') : '…'],
            ['out of line', reached(s.phase, 'chunk') ? (c.chunks ? `${c.chunks.length} chunks` : 'no') : c.id === 'zip' && reached(s.phase, 'inline') ? 'no' : '…'],
          ]} />
        </Panel>
        <Panel title={c.chunks ? 'pg_toast.pg_toast_16442' : 'TOAST table'}>
          {!c.chunks || !reached(s.phase, 'chunk') ? (
            <p className="text-sm text-muted">{c.chunks ? 'Empty so far.' : 'Untouched: the compressed value fits in the main row.'}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {(reached(s.phase, 'pages') ? pages : [c.chunks]).map((pg, p) => (
                  <motion.div key={reached(s.phase, 'pages') ? `p${p}` : 'all'} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-md border p-1.5" style={{ borderColor: reached(s.phase, 'pages') ? tone('header') : 'transparent' }}>
                    {reached(s.phase, 'pages') && <p className="mb-1 font-mono text-[10px] text-muted">TOAST page {p} · 8 KB</p>}
                    <div className="grid gap-1">
                      {pg.map((ch) => (
                        <motion.div key={ch.seq} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: ch.seq * 0.06 }}
                          className="flex items-center gap-2 rounded border px-1.5 py-0.5 font-mono text-[11px]" style={{ borderColor: tone('tuple'), background: toneBg('tuple', 14) }}>
                          <span className="text-muted">{c.chunkId}</span><span>seq {ch.seq}</span>
                          <span className="ml-auto">{ch.len} B</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Panel>
      </div>
      {s.phase === 'pointer' && c.ptr && (
        <Panel className="min-w-0" title="The 18-byte on-disk TOAST pointer (from heap_page_items)">
          <div className="overflow-x-auto scrollbar-thin"><ByteGrid segs={ptrSegs(c)} perRow={18} cell={36} selected={sel} onSelect={setSel} /></div>
          <p className="mt-2 text-sm text-muted">{notes[sel]}</p>
        </Panel>
      )}
      {s.phase === 'inline' && (
        <Panel title="Inline compressed varlena">
          <p className="font-mono text-[12px]">ea 01 00 00 | 28 23 00 00 | 00 70 6f 73 74 67 72 65 73 …</p>
          <p className="mt-1 text-sm text-muted">4-byte header = 122 bytes with the "compressed inline" flag, then the raw size 9000 (0x2328), then pglz output: a control byte, then the literal text "postgres".</p>
        </Panel>
      )}
    </div>
  )
}

function ToastViz() {
  const [id, setId] = useState('rand')
  const c = CASES.find((x) => x.id === id)!
  const picker = (
    <select aria-label="Value to insert" value={id} onChange={(e) => setId(e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs">
      {CASES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
    </select>
  )
  return (
    <Stepper key={id} steps={stepsFor(c)} interval={3200} extra={picker} render={(s) => (
      <div className="grid gap-3">
        <Legend items={[['ok', 'row under the threshold'], ['dead', 'row over the threshold'], ['tuple', 'TOAST chunk row'], ['header', 'TOAST page / pointer tag'], ['muted', 'OIDs in the pointer']]} />
        <ToastView c={c} s={s} />
      </div>
    )} />
  )
}

export const lesson: Lesson = {
  slug: 'toast',
  module: 'm2',
  order: 7,
  title: 'TOAST: oversized attributes',
  tldr: [
    '**TOAST** (The Oversized-Attribute Storage Technique) compresses large variable-length values and, if they are still too big, slices them into ~2 kB chunks stored in a separate `pg_toast` table.',
    'A row must fit on one 8 KB page, so TOAST is how PostgreSQL stores values of up to 1 GB while keeping the main table narrow and fast to scan.',
  ],
  visualizer: {
    title: 'Follow a big value through the toaster',
    caption: 'Pick one of four inserts and step through compression, chunking and the 18-byte pointer that stays behind. Click the pointer bytes to decode them.',
    Component: ToastViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE docs (id int PRIMARY KEY, views int DEFAULT 0, body text);
ALTER TABLE docs SET (autovacuum_enabled = false);
INSERT INTO docs (id, body) VALUES
  (1, repeat('postgres ', 1000)),
  (2, (SELECT string_agg(md5(g::text), '') FROM generate_series(1, 300) g)),
  (3, 'a short note'),
  (4, repeat('abc', 400000));
-- helper: read the chunks of any table's TOAST relation
CREATE FUNCTION toast_chunks(rel regclass)
RETURNS TABLE (chunk_id oid, chunk_seq int, bytes int) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT chunk_id, chunk_seq, octet_length(chunk_data) FROM %s ORDER BY 1, 2',
                              (SELECT reltoastrelid::regclass FROM pg_class WHERE oid = rel));
END $$;`,
    presets: [
      { label: 'What happened to each value', sql: `SELECT id, octet_length(body)            AS raw_bytes,
       pg_column_size(body)             AS stored_bytes,
       pg_column_compression(body)      AS compression,
       pg_column_toast_chunk_id(body)   AS toast_chunk_id
FROM docs ORDER BY id;`,
        note: 'Row 1 is compressed inline (9000 → 122). Row 2 is out of line, uncompressed. Row 3 is untouched. Row 4 is compressed **and** out of line (1.2 MB → 13,745 bytes).' },
      { label: 'The TOAST table', sql: `SELECT reltoastrelid::regclass AS toast_table FROM pg_class WHERE relname = 'docs';

SELECT chunk_id, count(*) AS chunks, sum(bytes) AS bytes, max(bytes) AS max_chunk
FROM toast_chunks('docs') GROUP BY chunk_id ORDER BY chunk_id;`,
        note: 'Every TOASTed table has its own hidden `pg_toast.pg_toast_<oid>` table. Chunks are at most **1996 bytes**; row 2 needs 5 chunks, row 4 (compressed) needs 7.' },
      { label: 'Main row vs pointer', sql: `SELECT lp, lp_len, encode(substring(t_data FROM 9 FOR 18), 'hex') AS first_18_bytes_of_body
FROM heap_page_items(get_raw_page('docs', 0));`,
        note: 'Rows 2 and 4 are tiny: `body` is an 18-byte pointer starting `0112` (external, tag 18). Row 1 holds 122 compressed bytes inline.' },
      { label: 'Update without touching TOAST', sql: `SELECT pg_column_toast_chunk_id(body) AS before FROM docs WHERE id = 2;
UPDATE docs SET views = views + 1 WHERE id = 2;
SELECT pg_column_toast_chunk_id(body) AS after_views_update FROM docs WHERE id = 2;
UPDATE docs SET body = body || '!' WHERE id = 2;
SELECT pg_column_toast_chunk_id(body) AS after_body_update FROM docs WHERE id = 2;`,
        note: 'Updating another column **reuses** the same chunk_id: the new row version copies only the 18-byte pointer. Changing `body` writes a whole new TOAST value.' },
      { label: 'Where the bytes live', sql: `SELECT pg_size_pretty(pg_relation_size('docs'))           AS main_heap,
       pg_size_pretty(pg_relation_size(reltoastrelid))     AS toast_heap,
       pg_size_pretty(pg_indexes_size(reltoastrelid))      AS toast_index,
       pg_size_pretty(pg_indexes_size('docs'))             AS docs_indexes,
       pg_size_pretty(pg_table_size('docs'))               AS table_size,
       pg_size_pretty(pg_total_relation_size('docs'))      AS total
FROM pg_class WHERE oid = 'docs'::regclass;`,
        note: 'The main heap is a single 8 kB page even though it "holds" 1.2 MB of text. `pg_relation_size` counts only the main fork; `pg_table_size` adds the FSM/VM forks and the whole TOAST table, **including the TOAST table\'s own index**; `pg_total_relation_size` then adds the table\'s indexes (here `docs_pkey`).' },
      { label: 'bytea vs large objects', sql: `CREATE TABLE files (id int PRIMARY KEY, name text, data bytea, blob oid);
INSERT INTO files VALUES (1, 'tiny.bin', '\\x012345', NULL);
INSERT INTO files SELECT 2, 'random.bin', decode(string_agg(md5(g::text), ''), 'hex'), NULL FROM generate_series(1, 400) g;
UPDATE files SET blob = lo_from_bytea(0, data) WHERE id = 2;

SELECT id, name, octet_length(data) AS bytes, encode(substring(data FROM 1 FOR 3), 'hex') AS first_bytes,
       pg_column_toast_chunk_id(data) IS NOT NULL AS toasted, blob AS large_object_oid
FROM files;

SELECT loid, count(*) AS pages, max(octet_length(data)) AS max_page_bytes
FROM pg_largeobject GROUP BY loid;

SELECT encode(convert_to(blob::text, 'UTF8'), 'hex') AS oid_digits_as_bytes FROM files WHERE id = 2;`,
        note: '`bytea` is an ordinary varlena: 3 bytes stay inline, 6,400 bytes are TOASTed with the row. A **large object** lives in `pg_largeobject` as 2,048-byte pages, and the row holds only its OID. Writing that OID into a `bytea` column stores its digits (`3136…` = "16…"), not the file.' },
      { label: 'Storage strategies', sql: `CREATE TABLE s_ext  (b text); ALTER TABLE s_ext  ALTER COLUMN b SET STORAGE EXTERNAL;
CREATE TABLE s_main (b text); ALTER TABLE s_main ALTER COLUMN b SET STORAGE MAIN;
INSERT INTO s_ext  VALUES (repeat('postgres ', 1000));
INSERT INTO s_main VALUES (repeat('postgres ', 1000));

SELECT 'EXTERNAL' AS strategy, pg_column_size(b), pg_column_compression(b), pg_column_toast_chunk_id(b) FROM s_ext
UNION ALL
SELECT 'MAIN', pg_column_size(b), pg_column_compression(b), pg_column_toast_chunk_id(b) FROM s_main;`,
        note: 'EXTERNAL stores the 9000 bytes out of line uncompressed. MAIN compresses and keeps it inline, moving out of line only as a last resort.' },
      { label: 'toast_tuple_target', sql: `CREATE TABLE tt_default (a text, b text);
CREATE TABLE tt_low (a text, b text) WITH (toast_tuple_target = 256);
INSERT INTO tt_default SELECT string_agg(md5(g::text), ''), string_agg(md5((g + 100)::text), '') FROM generate_series(1, 38) g;
INSERT INTO tt_low     SELECT string_agg(md5(g::text), ''), string_agg(md5((g + 100)::text), '') FROM generate_series(1, 38) g;

SELECT 'default' AS t, pg_column_toast_chunk_id(a) IS NOT NULL AS a_out, pg_column_toast_chunk_id(b) IS NOT NULL AS b_out FROM tt_default
UNION ALL
SELECT 'target 256', pg_column_toast_chunk_id(a) IS NOT NULL, pg_column_toast_chunk_id(b) IS NOT NULL FROM tt_low;`,
        note: 'Both rows are about 2.4 kB, so the toaster runs. By default it moves one column out until the row fits 2032 bytes; with a target of 256 it keeps going and moves **both** out.' },
    ],
  },
  production: {
    title: 'Wide product descriptions slowing every listing query',
    context: 'A catalog table stores `description text` (typically 1.5 kB of HTML) next to the columns used by listing pages: name, price and stock.',
    problem: 'Descriptions just under the 2 kB threshold are never TOASTed, so each row is about 1.6 kB and only 4–5 rows fit per page. Listing queries that never read `description` still scan pages full of it.',
    solution: 'Lower `toast_tuple_target` so the description is moved out once a row passes the threshold, and, more robustly, move rarely read large columns to a side table. Measure rows per page before and after.',
    sql: `-- option 1: push wide values out more aggressively (applies to rows over ~2 kB)
ALTER TABLE products SET (toast_tuple_target = 256);
-- option 2: split the cold wide column off
CREATE TABLE product_descriptions (product_id bigint PRIMARY KEY REFERENCES products, description text);
-- check density
SELECT relpages, reltuples, reltuples / NULLIF(relpages, 0) AS rows_per_page FROM pg_class WHERE relname = 'products';`,
    outcome: 'The playground shows the target behaviour: with `toast_tuple_target = 256` a 2.4 kB row moves both columns out of line instead of one. Note that the toaster only starts at about 2 kB, so values under that threshold stay inline whatever the target; for those rows, the side-table split is what improves scan density: a row of name, price and stock is under 80 bytes, so a page holds about 100 of them instead of 4–5.',
  },
  pitfalls: [
    { title: 'Changing the strategy and expecting old rows to move',
      symptom: 'After `ALTER COLUMN … SET STORAGE EXTERNAL` or `SET COMPRESSION`, existing rows look exactly the same.',
      cause: 'Storage and compression settings apply to **newly written** values only. Existing tuples keep their format until they are rewritten.',
      fix: 'Rewrite the affected values with an UPDATE that builds a new value (`UPDATE t SET col = col || \'\'` in batches), or dump and restore the table. `VACUUM FULL`, `CLUSTER` and `pg_repack` copy existing values in their current format, so they do **not** apply the new setting.' },
    { title: 'Updating a large value in place, frequently',
      symptom: 'The TOAST table grows much faster than the main table, and autovacuum spends most of its time there.',
      cause: 'Changing a TOASTed column writes a complete new copy of the value as new chunks. The old chunks become dead rows in the TOAST table.',
      fix: 'Keep frequently changed fields out of big documents. Unchanged TOASTed columns cost nothing on UPDATE, so put the counters in their own columns.' },
    { title: 'Expecting lz4 everywhere',
      symptom: '`ALTER TABLE … SET COMPRESSION lz4` fails with `compression method lz4 not supported`.',
      cause: 'lz4 is only available when PostgreSQL is built with `--with-lz4`. The default `default_toast_compression` is pglz, and some builds (including the one in this playground) have no lz4 at all.',
      fix: 'Check `SHOW default_toast_compression;` and test `SET COMPRESSION lz4` on your build. lz4 is usually faster than pglz when available.' },
    { title: 'Storing a large object\'s OID in a bytea column',
      symptom: 'Uploaded files come back as five or six bytes such as `\\x3137323730`, and `pg_largeobject` keeps growing even after rows are deleted.',
      cause: 'Large objects are a separate store: `lo_create` / `lo_from_bytea` return an **OID**, and the data lives in `pg_largeobject`. Inserting that OID into a `bytea` column stores the ASCII digits of the number. Deleting the row does not delete the object.',
      fix: 'Pick one design. Either a `bytea` column (simple, TOASTed, up to 1 GB, deleted with the row), or an `oid` column with the large-object API plus `lo_unlink` (or the `lo_manage` trigger from the `lo` module) when the row goes away.',
      sql: `SELECT encode(convert_to(16450::oid::text, 'UTF8'), 'hex');  -- 3136343530: digits, not data` },
    { title: 'Hitting the 1 GB value limit',
      symptom: '`ERROR: invalid memory alloc request size` or `requested length too large` when building a huge text or bytea.',
      cause: 'A single varlena value is limited to **1 GB** (30 length bits), even with TOAST.',
      fix: 'Store very large objects outside the row: in object storage with a reference, or chunked across rows yourself.' },
  ],
  pointers: [
    'TOAST starts when a row exceeds **~2 kB** (2032 bytes) and works until it is under `toast_tuple_target` (default 2032).',
    'Strategies: **PLAIN** (never), **EXTENDED** (compress, then out of line; default), **EXTERNAL** (out of line, no compression), **MAIN** (compress; out of line last).',
    'Out-of-line values become **1996-byte chunks**, 4 per TOAST page, keyed by `(chunk_id, chunk_seq)`; the row keeps an **18-byte pointer**.',
    'UPDATEs that do not change a TOASTed column **reuse** its chunks. See [JSON vs JSONB](/m2/json-jsonb) for the commonest TOASTed type.',
    'Inspect with `pg_column_size`, `pg_column_compression` and `pg_column_toast_chunk_id`. Max value size is **1 GB**.',
  ],
  sources: ['storage-toast.html', 'sql-altertable.html', 'sql-createtable.html', 'runtime-config-client.html', 'functions-admin.html'],
}
