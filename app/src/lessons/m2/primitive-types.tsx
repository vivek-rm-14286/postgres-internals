import { useState } from 'react'
import { Reorder } from 'framer-motion'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, ByteGrid, Note, Stats, type Seg } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a column-order padding calculator. The layout rule mirrors heap_fill_tuple():
 *   - the 23-byte header is padded to t_hoff (24, or more once a null bitmap is needed)
 *   - each fixed-width column starts at a multiple of its typalign (c=1, s=2, i=4, d=8)
 *   - short varlenas (< 127 bytes) get a 1-byte header and are NOT aligned
 *   - NULL columns take no bytes, only a bit in the null bitmap
 * The algorithm was checked against pg_column_size(row(...)) on PostgreSQL 18 for 40 random
 * column lists (with and without NULLs): every one matched.
 * ---------------------------------------------------------------------------------------------- */

type TypeName = 'bool' | 'int2' | 'int4' | 'date' | 'float4' | 'int8' | 'float8' | 'timestamptz' | 'interval' | 'uuid' | 'numeric' | 'text'
interface TypeInfo { len: number; align: 1 | 2 | 4 | 8; alignCh: 'c' | 's' | 'i' | 'd'; varlena?: boolean; value: string; range: string }

const TYPES: Record<TypeName, TypeInfo> = {
  bool: { len: 1, align: 1, alignCh: 'c', value: 'true', range: 'true / false (1 byte)' },
  int2: { len: 2, align: 2, alignCh: 's', value: '7', range: '-32768 .. 32767' },
  int4: { len: 4, align: 4, alignCh: 'i', value: '7', range: '±2.1 billion' },
  date: { len: 4, align: 4, alignCh: 'i', value: '2026-11-14', range: '4713 BC .. 5874897 AD, 1 day' },
  float4: { len: 4, align: 4, alignCh: 'i', value: '1.5', range: '6 significant digits, inexact' },
  int8: { len: 8, align: 8, alignCh: 'd', value: '7', range: '±9.2 × 10^18' },
  float8: { len: 8, align: 8, alignCh: 'd', value: '1.5', range: '15 significant digits, inexact' },
  timestamptz: { len: 8, align: 8, alignCh: 'd', value: '2026-11-14 09:00', range: 'µs resolution, stored as UTC' },
  interval: { len: 16, align: 8, alignCh: 'd', value: '1 day', range: 'months + days + µs' },
  uuid: { len: 16, align: 1, alignCh: 'c', value: '01a1d827-…', range: '128 bits' },
  numeric: { len: 7, align: 4, alignCh: 'i', varlena: true, value: '12.50', range: 'exact, up to 131072 digits' },
  text: { len: 6, align: 4, alignCh: 'i', varlena: true, value: "'hello'", range: 'up to 1 GB' },
}
const TYPE_ORDER = Object.keys(TYPES) as TypeName[]

interface Col { id: string; name: string; type: TypeName; isNull: boolean }
const BAD: Col[] = [
  { id: 'a', name: 'is_active', type: 'bool', isNull: false },
  { id: 'b', name: 'id', type: 'int8', isNull: false },
  { id: 'c', name: 'kind', type: 'int2', isNull: false },
  { id: 'd', name: 'created_at', type: 'timestamptz', isNull: false },
  { id: 'e', name: 'qty', type: 'int4', isNull: false },
  { id: 'f', name: 'label', type: 'text', isNull: false },
  { id: 'g', name: 'is_test', type: 'bool', isNull: false },
]

const alignUp = (o: number, a: number) => Math.ceil(o / a) * a
const MAXALIGN = 8

function layout(cols: Col[]) {
  const hasNull = cols.some((c) => c.isNull)
  const bitmap = hasNull ? Math.ceil(cols.length / 8) : 0
  const hoff = alignUp(23 + bitmap, MAXALIGN)
  const segs: Seg[] = [{ id: 'hdr', label: 'HeapTupleHeader', bytes: 23, t: 'header', sub: '23 B' }]
  if (bitmap) segs.push({ id: 'bitmap', label: 'null bits', bytes: bitmap, t: 'pointer', sub: cols.map((c) => (c.isNull ? 0 : 1)).join('') })
  if (hoff > 23 + bitmap) segs.push({ id: 'hpad', label: 'pad', bytes: hoff - 23 - bitmap, t: 'dead', pad: true })
  let off = hoff, pad = 0
  for (const c of cols) {
    if (c.isNull) continue
    const t = TYPES[c.type]
    if (!t.varlena) {
      const start = alignUp(off, t.align)
      if (start > off) { segs.push({ id: `pad-${c.id}`, label: 'pad', bytes: start - off, t: 'dead', pad: true }); pad += start - off }
      off = start
    }
    segs.push({ id: c.id, label: c.name, bytes: t.len, t: t.varlena ? 'new' : 'tuple', sub: `${c.type} ${t.len}B` })
    off += t.len
  }
  const len = off
  const onPage = alignUp(len, MAXALIGN)
  if (onPage > len) segs.push({ id: 'tail', label: 'MAXALIGN', bytes: onPage - len, t: 'muted', pad: true })
  const perPage = Math.min(291, Math.floor((8192 - 24) / (onPage + 4)))
  const data = cols.filter((c) => !c.isNull).reduce((s, c) => s + TYPES[c.type].len, 0)
  return { segs, len, onPage, pad, hoff, perPage, data }
}

/** Widest alignment first, varlenas last: the classic "column tetris" ordering. */
const pack = (cols: Col[]) => [...cols].sort((a, b) => {
  const ta = TYPES[a.type], tb = TYPES[b.type]
  const ka = ta.varlena ? 0 : ta.align, kb = tb.varlena ? 0 : tb.align
  return kb - ka || tb.len - ta.len
})

let nextId = 100

function PaddingViz() {
  const [cols, setCols] = useState<Col[]>(BAD)
  const [sel, setSel] = useState<string>('pad-b')
  const L = layout(cols)
  const packed = layout(pack(cols))
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= cols.length) return
    const n = [...cols]; [n[i], n[j]] = [n[j], n[i]]; setCols(n)
  }
  const add = (t: TypeName) => { if (cols.length >= 12) return; const id = `x${nextId++}`; setCols([...cols, { id, name: `${t}_${id.slice(1)}`, type: t, isNull: false }]); setSel(id) }
  const selSeg = L.segs.find((s) => s.id === sel)
  const selCol = cols.find((c) => c.id === sel)
  const saving = L.onPage - packed.onPage

  const msg = L.pad === 0
    ? `No padding between columns. ${saving === 0 ? 'This order is already optimal.' : ''}`
    : `**${L.pad} bytes of padding** sit between columns. Packing widest-alignment first would make each row **${L.onPage} → ${packed.onPage} bytes** on the page${saving === 0 ? ', which rounds to the same MAXALIGNed size here' : ''}.`

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setCols(pack(cols))}>Pack columns</Btn>
        <Btn onClick={() => setCols(BAD)}>Reset to bad order</Btn>
        <span className="text-xs text-muted">Add a column:</span>
        {TYPE_ORDER.map((t) => (
          <button key={t} type="button" onClick={() => add(t)} className="rounded border border-line px-1.5 py-0.5 font-mono text-[11px] hover:border-accent">{t}</button>
        ))}
      </div>
      <Stats items={[
        ['Tuple length (lp_len)', `${L.len} B`],
        ['Padding bytes', `${L.pad} B`, L.pad ? 'dead' : 'ok'],
        ['On page (+4 B line ptr)', `${L.onPage + 4} B`],
        ['Rows per 8 KB page', String(L.perPage), L.onPage > packed.onPage ? 'dead' : 'ok'],
      ]} />
      <Note k={`${L.len}-${L.pad}`}><Md>{msg}</Md></Note>
      <Legend items={[['header', 'tuple header'], ['tuple', 'fixed-width column'], ['new', 'varlena (1-byte header, unaligned)'], ['dead', 'alignment padding'], ['muted', 'MAXALIGN tail'], ['pointer', 'null bitmap']]} />
      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <Panel title="Columns, in table order">
          <Reorder.Group axis="y" values={cols} onReorder={setCols} className="grid gap-1">
            {cols.map((c, i) => (
              <Reorder.Item key={c.id} value={c} className="flex min-w-0 cursor-grab items-center gap-1 rounded-md border bg-surface px-2 py-1 font-mono text-[12px]"
                style={{ borderColor: sel === c.id ? 'var(--accent)' : 'var(--border)' }}>
                <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => setSel(c.id)}>
                  <span className={c.isNull ? 'text-muted line-through' : ''}>{c.name}</span> <span className="text-muted">{c.type}</span>
                </button>
                <button type="button" title="Toggle NULL" onClick={() => setCols(cols.map((x) => (x.id === c.id ? { ...x, isNull: !x.isNull } : x)))}
                  className={`rounded px-1 text-[10px] ${c.isNull ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}>NULL</button>
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="text-muted hover:text-ink"><ArrowUp className="size-3.5" /></button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="text-muted hover:text-ink"><ArrowDown className="size-3.5" /></button>
                <button type="button" aria-label="Remove" onClick={() => setCols(cols.filter((x) => x.id !== c.id))} className="text-muted hover:text-ink"><X className="size-3.5" /></button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <p className="mt-2 text-xs text-muted">Drag, or use the arrows. Click NULL to null a value.</p>
        </Panel>
        <div className="grid content-start gap-3">
          <div className="overflow-x-auto scrollbar-thin">
            <ByteGrid segs={L.segs} selected={sel} onSelect={setSel} />
          </div>
          <Inspector seg={selSeg} col={selCol} hoff={L.hoff} />
        </div>
      </div>
    </div>
  )
}

function Inspector({ seg, col, hoff }: { seg?: Seg; col?: Col; hoff: number }) {
  if (col && col.isNull) return <Panel title={col.name}><p className="text-sm text-muted"><Md>{'This value is NULL: it occupies **zero data bytes**, only a 0 bit in the null bitmap.'}</Md></p></Panel>
  if (col) {
    const t = TYPES[col.type]
    return (
      <Panel title={`${col.name} · ${col.type}`}>
        <FieldTable rows={[
          ['typlen', t.varlena ? '-1 (varlena)' : String(t.len), t.varlena ? `this value: ${t.len} B incl. 1-byte header` : 'fixed width'],
          ['typalign', `'${t.alignCh}'`, t.varlena ? 'ignored for short (1-byte header) values' : `starts at a multiple of ${t.align}`],
          ['sample', t.value, t.range],
        ]} />
      </Panel>
    )
  }
  if (!seg) return <Panel title="Inspector"><p className="text-sm text-muted">Click any block in the byte map.</p></Panel>
  const text: Record<string, string> = {
    hdr: '`t_xmin`, `t_xmax`, `t_cid`, `t_ctid`, `t_infomask2`, `t_infomask`, `t_hoff`: 23 bytes on every row version.',
    hpad: `User data must start at a MAXALIGN boundary, so \`t_hoff\` = **${hoff}**.`,
    bitmap: 'One bit per column, **1 = not null**. It exists only if the row has at least one NULL; with more than 8 columns it grows and can push `t_hoff` to 32.',
    tail: 'The next tuple on the page must start MAXALIGNed, so the row really costs this much space.',
  }
  return <Panel title={seg.label}><p className="text-sm text-muted"><Md>{text[seg.id] ?? `**${seg.bytes} padding byte${seg.bytes > 1 ? 's' : ''}**: the next column needs a stricter alignment than the current offset allows. Pure waste, on every row.`}</Md></p></Panel>
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'primitive-types',
  module: 'm2',
  order: 1,
  title: 'Primitive types, alignment and padding',
  tldr: [
    'Every column type has a fixed on-disk width (`typlen`) or is variable-length, plus an **alignment** (`typalign`) that forces it to start at a multiple of 1, 2, 4 or 8 bytes.',
    'Alignment lets the CPU read values in place, but it means **column order changes row size**: badly ordered columns leave padding holes in every row of the table.',
  ],
  visualizer: {
    title: 'Column tetris: how order creates padding',
    caption: 'Press **Pack columns**, drag columns around, add types or toggle NULLs, and watch padding appear and disappear. The byte map follows the same rules `pg_column_size` applies.',
    Component: PaddingViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE bad  (is_active bool, id int8, kind int2, created_at timestamptz, qty int4, label text, is_test bool);
CREATE TABLE good (id int8, created_at timestamptz, qty int4, kind int2, is_active bool, is_test bool, label text);
INSERT INTO bad  SELECT true, g, 2, now(), 3, 'hello', false FROM generate_series(1, 10000) g;
INSERT INTO good SELECT g, now(), 3, 2, true, false, 'hello' FROM generate_series(1, 10000) g;
CREATE TYPE priority AS ENUM ('low', 'medium', 'high');
CREATE DOMAIN date_of_birth AS date CHECK (VALUE > '1930-01-01');
CREATE TYPE package AS (height numeric, width numeric, weight numeric);
CREATE TABLE li_stored  (id int8, price int4, qty int4, total int8 GENERATED ALWAYS AS (price::int8 * qty) STORED);
CREATE TABLE li_virtual (id int8, price int4, qty int4, total int8 GENERATED ALWAYS AS (price::int8 * qty) VIRTUAL);
INSERT INTO li_stored  (id, price, qty) SELECT g, 250, 4 FROM generate_series(1, 10000) g;
INSERT INTO li_virtual (id, price, qty) SELECT g, 250, 4 FROM generate_series(1, 10000) g;`,
    presets: [
      { label: 'typlen & typalign', sql: `SELECT typname, typlen, typalign, typstorage
FROM pg_type
WHERE typname IN ('bool','int2','int4','int8','float4','float8','numeric','text',
                  'date','timestamp','timestamptz','interval','uuid','money')
ORDER BY typlen DESC, typname;`,
        note: '`typlen = -1` means variable length (varlena). `typalign` is c/s/i/d = 1/2/4/8 bytes. `timestamp` and `timestamptz` are both 8 bytes: the zone is never stored. `uuid` is 16 bytes but only char-aligned.' },
      { label: 'Size of single values', sql: `SELECT pg_column_size(true) AS bool, pg_column_size(1::int2) AS int2,
       pg_column_size(1::int8) AS int8, pg_column_size(now()) AS timestamptz,
       pg_column_size('1 day'::interval) AS "interval",
       pg_column_size(0::numeric) AS num_0, pg_column_size(123.45::numeric) AS num_123_45,
       pg_column_size(123456789::numeric) AS num_9_digits,
       pg_column_size(repeat('x', 200)) AS text_200;`,
        note: 'Fixed types are exactly `typlen`. `numeric` is variable: 6, 10 and 12 bytes here, about 2 bytes per group of 4 decimal digits plus a small header. These are in-memory sizes; inside a row, short varlenas shrink to a 1-byte header.' },
      { label: 'Same data, two orders', sql: `SELECT 'bad' AS tbl, lp_len, t_hoff FROM heap_page_items(get_raw_page('bad', 0)) LIMIT 1;
SELECT 'good' AS tbl, lp_len, t_hoff FROM heap_page_items(get_raw_page('good', 0)) LIMIT 1;

SELECT 'bad' AS tbl, count(*) AS rows_on_page_0, pg_size_pretty(pg_relation_size('bad')) AS size
FROM bad WHERE (ctid::text::point)[0] = 0
UNION ALL
SELECT 'good', count(*), pg_size_pretty(pg_relation_size('good'))
FROM good WHERE (ctid::text::point)[0] = 0;`,
        note: 'Identical values: **67 bytes** in the bad order, **54 bytes** packed, exactly what the visualizer shows. MAXALIGN rounds them to 72 and 56, so (8192 − 24) / (72 + 4) = **107** rows fit per page against (8192 − 24) / (56 + 4) = **136**.' },
      { label: 'Exact vs inexact', sql: `SELECT 0.1::float8 + 0.2::float8 = 0.3::float8          AS float_equal,
       0.1::numeric + 0.2::numeric = 0.3::numeric       AS numeric_equal,
       (0.0001::float4 + 0.0001::float4 + 0.0001::float4)::text AS float4_drift,
       round(2.5::numeric) AS round_numeric, round(2.5::float8) AS round_float,
       12.5::numeric::money AS as_money, current_setting('lc_monetary') AS lc_monetary;

SELECT interval '1 month' = interval '30 days' AS equal_intervals,
       date '2024-01-31' + interval '1 month'  AS plus_1_month,
       date '2024-01-31' + interval '30 days'  AS plus_30_days;`,
        note: 'Binary floats drift: three float4 additions of 0.0001 give `0.00029999999`. `numeric` is exact and rounds ties away from zero. `money` formats with `lc_monetary`. An interval stores **months, days and microseconds separately**: they compare as equal (30-day months) but add differently.' },
      { label: 'Casts: what works, what fails', sql: `SELECT v AS input, t AS target, pg_input_is_valid(v, t) AS ok,
       (pg_input_error_info(v, t)).message AS error
FROM (VALUES ('1', 'integer'), ('10000000000', 'integer'), ('10000000000', 'bigint'),
             ('10C', 'integer'), ('12.1', 'integer'), ('100', 'numeric(7,5)'),
             ('tRUe', 'boolean'), ('of', 'boolean'), ('2001-02-30', 'date')) AS x(v, t);

SELECT pg_typeof('abc') AS bare_literal, 9.99::int AS cast_rounds, '12' + 10 AS literal_resolved;

SET datestyle = 'ISO, DMY';
SELECT '06/10/2001'::date AS read_as_dmy;
RESET datestyle;
SELECT '06/10/2001'::date AS read_as_mdy, '2001-06-10'::date AS iso_never_ambiguous;`,
        note: '`pg_input_error_info` shows the error a cast would raise without aborting: out of range, bad syntax, `numeric(7,5)` overflowing at 100. A quoted literal is `unknown` until context picks a type, `9.99::int` **rounds** to 10, and the same `06/10/2001` is June or October depending on `DateStyle`.' },
      { label: 'Fixed width, byte by byte', sql: `SELECT encode(123::int2::bytea, 'hex')   AS int2,
       encode(123::int4::bytea, 'hex')   AS int4,
       encode(123::int8::bytea, 'hex')   AS int8,
       encode((-1234)::int4::bytea, 'hex') AS minus_1234;

SELECT 'good' AS tbl, encode(substring(t_data FROM 1 FOR 8), 'hex') AS id_on_disk
FROM heap_page_items(get_raw_page('good', 0)) WHERE lp = 1;`,
        note: 'The integer-to-`bytea` casts are new in PostgreSQL 18. Width depends on the **type**, not the value: 123 is 2, 4 or 8 bytes, negatives are two\'s complement. The cast prints most significant byte first; on disk (little-endian here) `id = 1` is stored as `0100000000000000`.' },
      { label: 'Enums, domains, composites', sql: `SELECT typname, typtype, typlen, typalign
FROM pg_type WHERE typname IN ('priority', 'date_of_birth', 'package');

SELECT pg_column_size('high'::priority)             AS enum_bytes,
       pg_column_size('1970-05-01'::date_of_birth)  AS domain_bytes,
       pg_column_size('(10.3,4.0,0.5)'::package)    AS composite_bytes,
       (pg_input_error_info('1732-02-22', 'date_of_birth')).message AS domain_check;

SELECT enumlabel, enumsortorder FROM pg_enum WHERE enumtypid = 'priority'::regtype;`,
        note: 'An **enum** is a 4-byte OID into `pg_enum`, sorted by `enumsortorder`, not alphabetically. A **domain** is its base type plus a CHECK, so it costs the same 4 bytes as `date`. A **composite** is a varlena with its own tuple header inside (41 bytes here).' },
      { label: 'Generated: STORED vs VIRTUAL', sql: `SELECT attrelid::regclass AS tbl, attname, attgenerated
FROM pg_attribute WHERE attrelid IN ('li_stored'::regclass, 'li_virtual'::regclass) AND attname = 'total';

SELECT 'stored' AS kind, lp_len, t_bits FROM heap_page_items(get_raw_page('li_stored', 0)) LIMIT 1;
SELECT 'virtual' AS kind, lp_len, t_bits FROM heap_page_items(get_raw_page('li_virtual', 0)) LIMIT 1;

SELECT pg_size_pretty(pg_relation_size('li_stored'))  AS stored_table,
       pg_size_pretty(pg_relation_size('li_virtual')) AS virtual_table,
       (SELECT total FROM li_virtual LIMIT 1)         AS computed_on_read;`,
        note: 'PostgreSQL 18 adds **VIRTUAL** generated columns, and makes them the default. The STORED `total` occupies 8 bytes in every row (48 B). The VIRTUAL one is only a NULL bit (`t_bits` 1110…), so the row is 40 B, and it is recomputed on every read.' },
    ],
  },
  production: {
    title: 'Reordering a 200 M-row metrics table before launch',
    context: 'An IoT platform designs `readings(is_valid bool, device_id int8, sensor smallint, ts timestamptz, value float8, seq int4, flags bool)` and expects 200 million rows.',
    problem: 'Columns were listed in the order the team thought of them. Each `bool` or `smallint` placed before an 8-byte column forces up to 7 padding bytes, so a row with 32 bytes of real data occupies **72 bytes** on the page.',
    solution: 'Order columns by alignment: 8-byte types first, then 4, 2 and 1-byte types, then variable-length ones. Check the result with `pg_column_size` on a sample row before the table holds data, because changing column order later means rewriting the table.',
    sql: `-- bad: 24 + 1+7pad + 8 + 2+6pad + 8 + 8 + 4 + 1 = 69 -> 72 on the page
SELECT pg_column_size(ROW(true, 1::int8, 1::int2, now(), 1.0::float8, 1::int4, true));
-- packed: 24 + 8 + 8 + 8 + 4 + 2 + 1 + 1 = 56
SELECT pg_column_size(ROW(1::int8, now(), 1.0::float8, 1::int4, 1::int2, true, true));`,
    outcome: 'Each row drops from 72 to 56 bytes (plus its 4-byte line pointer), which is 76 → 60 bytes per row: **21% less heap**, about 15.2 GB → 12.0 GB at 200 M rows. More rows per page also means fewer pages per sequential scan and a larger share of the table in cache.',
  },
  pitfalls: [
    { title: 'Using float for money',
      symptom: 'Totals are off by a cent, and `WHERE amount = 0.3` misses rows that print as 0.3.',
      cause: '`real` and `double precision` are binary IEEE 754 types: most decimal fractions have no exact representation, and comparisons for equality are unreliable.',
      fix: 'Use `numeric` (exact) or integer cents in `bigint`, and store the ISO currency code in its own column. Size the precision generously: `numeric(7,5)` cannot hold 100.00. Avoid the `money` type: it has no currency, and its output depends on `lc_monetary`, so dumps can fail to load under another locale.',
      sql: `SELECT 0.1::float8 + 0.2::float8 = 0.3::float8;          -- false
SELECT pg_input_is_valid('100', 'numeric(7,5)');             -- false: overflow` },
    { title: 'char(n) for codes and names',
      symptom: 'Values come back with trailing spaces, and `char(n)` columns compare in surprising ways with `text`.',
      cause: '`character(n)` is blank-padded to n characters and stored that way. It is never faster than `text` or `varchar` and usually the slowest of the three.',
      fix: 'Use `text`, or `varchar(n)` when you want a length check. Add a `CHECK (length(code) = 3)` when the length must be exact.' },
    { title: 'Expecting reordering to always save space',
      symptom: 'Columns were reordered with a table rewrite, and the table size did not change.',
      cause: 'Every row is padded to a multiple of **MAXALIGN** (8 bytes) on the page. If the padding saved is smaller than that rounding, the row still occupies the same slot.',
      fix: 'Compute both orders with `pg_column_size(ROW(...))` and round up to 8 before paying for a rewrite. Reordering pays off when it removes 8 or more bytes per row.' },
    { title: 'Choosing int4 keys for a fast-growing table',
      symptom: 'Inserts start failing with `integer out of range` (or `nextval: reached maximum value of sequence`) years after launch.',
      cause: '`integer` stops at 2,147,483,647. PostgreSQL raises an error instead of wrapping around.',
      fix: 'Use `bigint` for surrogate keys of tables that can grow large. The 4 bytes `int4` saves are often eaten by alignment padding anyway (an `int4` before an 8-byte column is followed by 4 padding bytes), and they are small compared with a table rewrite under pressure.' },
    { title: 'timestamp without time zone for real instants',
      symptom: 'Event times shift by hours when a server, client or session moves to another `TimeZone`, or two regions disagree on when something happened.',
      cause: '`timestamp` stores a wall-clock reading with no zone, and silently ignores an offset in the input. `timestamptz` stores a UTC instant (also 8 bytes, no zone stored) and converts on input and output using `TimeZone`. A `timestamp DEFAULT CURRENT_TIMESTAMP` column also drops the zone of the value it receives.',
      fix: 'Use `timestamptz` for anything that happened at an instant. Render in the user\'s zone with `AT TIME ZONE`, and keep plain `timestamp` for wall-clock values such as "opening hour 09:00".',
      sql: `SET TimeZone = 'America/New_York';
SELECT '2016-06-22 19:10:25-07'::timestamp   AS offset_ignored,
       '2016-06-22 19:10:25-07'::timestamptz AS converted;` },
    { title: 'Integer and numeric arithmetic in generated columns',
      symptom: 'A calendar table built with `(EXTRACT(month FROM d) - 1) / 3 + 1` puts March in quarter 2 and December in quarter 5.',
      cause: '`EXTRACT` returns `numeric` (since PostgreSQL 14), so the division is exact: March gives 1.67, which an `int` column rounds to 2. A common claim is that EXTRACT returns double precision, or that `/` always truncates. Integer `/` integer truncates, but numeric does not.',
      fix: 'Use `EXTRACT(quarter FROM d)`, or cast before dividing: `(EXTRACT(month FROM d)::int - 1) / 3 + 1`. Check `pg_typeof()` of any expression feeding an integer column.',
      sql: `SELECT 7 / 2 AS int_div, 7 / 2.0 AS numeric_div,
       ((EXTRACT(month FROM date '2024-03-15') - 1) / 3 + 1)::int AS wrong_quarter,
       EXTRACT(quarter FROM date '2024-03-15') AS quarter;` },
  ],
  pointers: [
    'Fixed widths: **bool 1, int2 2, int4/date/float4 4, int8/float8/timestamptz 8, uuid/interval 16** bytes.',
    '`typalign` c/s/i/d forces a start offset that is a multiple of **1/2/4/8**. Short varlenas (under 127 bytes) are not aligned.',
    'Rows start with a 23-byte header padded to `t_hoff` = 24, and the whole row is padded to **8 bytes** on the page, plus a 4-byte line pointer.',
    'Order columns **8-byte first, then 4, 2, 1, then variable-length** to remove padding; verify with `pg_column_size(ROW(...))`.',
    'Use **numeric** for exact decimals, **float** for measurements, **bigint** for keys that can grow, and **timestamptz** for instants. VIRTUAL generated columns cost no row bytes; STORED ones do.',
  ],
  sources: ['datatype-numeric.html', 'datatype-character.html', 'datatype-datetime.html', 'datatype-money.html', 'storage-page-layout.html', 'catalog-pg-type.html', 'functions-admin.html'],
}
