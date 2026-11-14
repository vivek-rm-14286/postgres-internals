import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, Note, SqlLine, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a cast matrix. Every cell was produced by PostgreSQL 18: text inputs were tested with
 * pg_input_error_info(value, type) and cast with value::type; number inputs were cast from a numeric
 * or double precision source. Click any cell to see the SQL, the result or the exact error.
 * ---------------------------------------------------------------------------------------------- */

interface Cell { v?: string; e?: string; c?: string }
const TEXT_TYPES = ['integer', 'smallint', 'numeric(4,1)', 'double precision', 'boolean', 'date']
const NUM_TYPES = ['integer', 'smallint', 'numeric(4,1)', 'real']
const TEXT_ROWS: [string, Cell[]][] = [
  ["42", [{v:"42"}, {v:"42"}, {v:"42.0"}, {v:"42"}, {e:"invalid input syntax for type boolean: \"42\"",c:"22P02"}, {e:"date/time field value out of range: \"42\"",c:"22008"}]],
  [" 42 ", [{v:"42"}, {v:"42"}, {v:"42.0"}, {v:"42"}, {e:"invalid input syntax for type boolean: \" 42 \"",c:"22P02"}, {e:"date/time field value out of range: \" 42 \"",c:"22008"}]],
  ["42.5", [{e:"invalid input syntax for type integer: \"42.5\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"42.5\"",c:"22P02"}, {v:"42.5"}, {v:"42.5"}, {e:"invalid input syntax for type boolean: \"42.5\"",c:"22P02"}, {e:"invalid input syntax for type date: \"42.5\"",c:"22007"}]],
  ["4.2e1", [{e:"invalid input syntax for type integer: \"4.2e1\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"4.2e1\"",c:"22P02"}, {v:"42.0"}, {v:"42"}, {e:"invalid input syntax for type boolean: \"4.2e1\"",c:"22P02"}, {e:"invalid input syntax for type date: \"4.2e1\"",c:"22007"}]],
  ["1,234", [{e:"invalid input syntax for type integer: \"1,234\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"1,234\"",c:"22P02"}, {e:"invalid input syntax for type numeric: \"1,234\"",c:"22P02"}, {e:"invalid input syntax for type double precision: \"1,234\"",c:"22P02"}, {e:"invalid input syntax for type boolean: \"1,234\"",c:"22P02"}, {e:"date/time field value out of range: \"1,234\"",c:"22008"}]],
  ["99999", [{v:"99999"}, {e:"value \"99999\" is out of range for type smallint",c:"22003"}, {e:"numeric field overflow",c:"22003"}, {v:"99999"}, {e:"invalid input syntax for type boolean: \"99999\"",c:"22P02"}, {e:"invalid input syntax for type date: \"99999\"",c:"22007"}]],
  ["abc", [{e:"invalid input syntax for type integer: \"abc\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"abc\"",c:"22P02"}, {e:"invalid input syntax for type numeric: \"abc\"",c:"22P02"}, {e:"invalid input syntax for type double precision: \"abc\"",c:"22P02"}, {e:"invalid input syntax for type boolean: \"abc\"",c:"22P02"}, {e:"invalid input syntax for type date: \"abc\"",c:"22007"}]],
  ["", [{e:"invalid input syntax for type integer: \"\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"\"",c:"22P02"}, {e:"invalid input syntax for type numeric: \"\"",c:"22P02"}, {e:"invalid input syntax for type double precision: \"\"",c:"22P02"}, {e:"invalid input syntax for type boolean: \"\"",c:"22P02"}, {e:"invalid input syntax for type date: \"\"",c:"22007"}]],
  ["yes", [{e:"invalid input syntax for type integer: \"yes\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"yes\"",c:"22P02"}, {e:"invalid input syntax for type numeric: \"yes\"",c:"22P02"}, {e:"invalid input syntax for type double precision: \"yes\"",c:"22P02"}, {v:"true"}, {e:"invalid input syntax for type date: \"yes\"",c:"22007"}]],
  ["2026-11-14", [{e:"invalid input syntax for type integer: \"2026-11-14\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"2026-11-14\"",c:"22P02"}, {e:"invalid input syntax for type numeric: \"2026-11-14\"",c:"22P02"}, {e:"invalid input syntax for type double precision: \"2026-11-14\"",c:"22P02"}, {e:"invalid input syntax for type boolean: \"2026-11-14\"",c:"22P02"}, {v:"2026-11-14"}]],
  ["2026-02-30", [{e:"invalid input syntax for type integer: \"2026-02-30\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"2026-02-30\"",c:"22P02"}, {e:"invalid input syntax for type numeric: \"2026-02-30\"",c:"22P02"}, {e:"invalid input syntax for type double precision: \"2026-02-30\"",c:"22P02"}, {e:"invalid input syntax for type boolean: \"2026-02-30\"",c:"22P02"}, {e:"date/time field value out of range: \"2026-02-30\"",c:"22008"}]],
  ["11/14/2026", [{e:"invalid input syntax for type integer: \"11/14/2026\"",c:"22P02"}, {e:"invalid input syntax for type smallint: \"11/14/2026\"",c:"22P02"}, {e:"invalid input syntax for type numeric: \"11/14/2026\"",c:"22P02"}, {e:"invalid input syntax for type double precision: \"11/14/2026\"",c:"22P02"}, {e:"invalid input syntax for type boolean: \"11/14/2026\"",c:"22P02"}, {v:"2026-11-14"}]],
]
const NUM_ROWS: [string, 'numeric' | 'double precision', Cell[]][] = [
  ["2.5", "numeric", [{v:"3"}, {v:"3"}, {v:"2.5"}, {v:"2.5"}]],
  ["2.5", "double precision", [{v:"2"}, {v:"2"}, {v:"2.5"}, {v:"2.5"}]],
  ["-2.5", "numeric", [{v:"-3"}, {v:"-3"}, {v:"-2.5"}, {v:"-2.5"}]],
  ["-2.5", "double precision", [{v:"-2"}, {v:"-2"}, {v:"-2.5"}, {v:"-2.5"}]],
  ["3.7", "numeric", [{v:"4"}, {v:"4"}, {v:"3.7"}, {v:"3.7"}]],
  ["3.7", "double precision", [{v:"4"}, {v:"4"}, {v:"3.7"}, {v:"3.7"}]],
  ["0.15", "numeric", [{v:"0"}, {v:"0"}, {v:"0.2"}, {v:"0.15"}]],
  ["0.15", "double precision", [{v:"0"}, {v:"0"}, {v:"0.2"}, {v:"0.15"}]],
  ["123.456", "numeric", [{v:"123"}, {v:"123"}, {v:"123.5"}, {v:"123.456"}]],
  ["123.456", "double precision", [{v:"123"}, {v:"123"}, {v:"123.5"}, {v:"123.456"}]],
  ["40000", "numeric", [{v:"40000"}, {e:"smallint out of range",c:"22003"}, {e:"numeric field overflow",c:"22003"}, {v:"40000"}]],
  ["40000", "double precision", [{v:"40000"}, {e:"smallint out of range",c:"22003"}, {e:"numeric field overflow",c:"22003"}, {v:"40000"}]],
  ["1e10", "numeric", [{e:"integer out of range",c:"22003"}, {e:"smallint out of range",c:"22003"}, {e:"numeric field overflow",c:"22003"}, {v:"1e+10"}]],
  ["1e10", "double precision", [{e:"integer out of range",c:"22003"}, {e:"smallint out of range",c:"22003"}, {e:"numeric field overflow",c:"22003"}, {v:"1e+10"}]],
]

type Mode = 'text' | 'num'
type Src = 'numeric' | 'double precision'
type Kind = 'ok' | 'changed' | 'error'

const kindOf = (input: string, c: Cell): Kind => (c.e ? 'error' : c.v === input ? 'ok' : 'changed')
const kindTone: Record<Kind, Tone> = { ok: 'ok', changed: 'new', error: 'dead' }
const qt = (s: string) => `'${s}'`

const TOUR_TEXT: [string, string, string][] = [
  ['42', 'integer', 'Clean digits convert directly. This is the everyday case.'],
  [' 42 ', 'integer', 'Leading and trailing **spaces are allowed** by the integer input routine.'],
  ['42.5', 'integer', 'Text with a decimal point is **not** an integer: error `22P02`. Cast to numeric first (`\'42.5\'::numeric::integer` gives 43).'],
  ['4.2e1', 'numeric(4,1)', 'Exponent notation is fine for numeric types, and numeric(4,1) pads to one decimal: **42.0**.'],
  ['1,234', 'double precision', 'No cast accepts **thousands separators**. Use `to_number(\'1,234\', \'9G999\')` or strip the commas.'],
  ['99999', 'smallint', 'Valid digits, but too big: smallint stops at 32767, so the error is `22003` (out of range).'],
  ['', 'integer', 'An **empty string** is not NULL and not 0. It is invalid for every type here. Use `NULLIF(col, \'\')` before casting.'],
  ['yes', 'boolean', 'Booleans accept `yes/no`, `on/off`, `true/false`, `1/0` and unique prefixes like `t` or `n`.'],
  ['2026-02-30', 'date', 'Well formed, but February 30 does not exist: error `22008`. PostgreSQL never rolls it over to March.'],
  ['11/14/2026', 'date', 'A slashed date is read using **DateStyle** (MDY by default), giving 2026-11-14. Under DMY the same text is an error.'],
]
const TOUR_NUM: [string, Src, string, string][] = [
  ['2.5', 'numeric', 'integer', 'A **numeric** 2.5 rounds half **away from zero**: 3.'],
  ['2.5', 'double precision', 'integer', 'A **double precision** 2.5 rounds half **to even**: 2. Same digits, different source type, different answer.'],
  ['-2.5', 'double precision', 'integer', 'Ties to even again: -2. From numeric, -2.5 would become -3.'],
  ['0.15', 'numeric', 'numeric(4,1)', 'Casting to numeric(4,1) rounds to one decimal: 0.15 → **0.2**.'],
  ['40000', 'numeric', 'smallint', 'Outside smallint range (−32768 to 32767): an error, never a wrapped-around value.'],
  ['1e10', 'numeric', 'integer', 'Ten billion does not fit in a 4-byte integer. Use `bigint`.'],
  ['123.456', 'numeric', 'real', '`real` keeps about 6 significant digits; this value still prints as 123.456.'],
]

function Matrix({ rows, types, sel, onSel, quoted }: { rows: [string, Cell[]][]; types: string[]; sel: [number, number]; onSel: (r: number, c: number) => void; quoted: boolean }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[560px] border-separate border-spacing-1 font-mono text-[11.5px]">
        <thead>
          <tr><th className="text-left text-[10.5px] font-semibold text-muted">input ↓ · type →</th>
            {types.map((t) => <th key={t} className="px-1 text-left text-[10.5px] font-semibold text-muted">{t}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(([input, cells], r) => (
            <tr key={input + r}>
              <td className="pr-2 whitespace-pre text-ink">{quoted ? qt(input) : input}</td>
              {cells.map((c, k) => {
                const kind = kindOf(input, c), t = kindTone[kind], on = sel[0] === r && sel[1] === k
                return (
                  <td key={k}>
                    <motion.button type="button" layout onClick={() => onSel(r, k)} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: on ? 1.06 : 1 }}
                      transition={{ delay: (r * cells.length + k) * 0.006 }}
                      className="w-full truncate rounded px-1.5 py-1 text-left" title={c.e ?? c.v}
                      style={{ background: toneBg(t, on ? 34 : 14), border: `1.5px solid ${on ? tone(t) : 'transparent'}`, color: kind === 'error' ? tone('dead') : 'var(--text)' }}>
                      {c.e ? `✕ ${c.c}` : c.v}
                    </motion.button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CastMatrix() {
  const [mode, setMode] = useState<Mode>('text')
  const [src, setSrc] = useState<Src>('numeric')
  const [sel, setSel] = useState<[number, number]>([0, 0])
  const [tour, setTour] = useState(-1)

  const numRows: [string, Cell[]][] = NUM_ROWS.filter((r) => r[1] === src).map((r) => [r[0], r[2]])
  const rows = mode === 'text' ? TEXT_ROWS : numRows
  const types = mode === 'text' ? TEXT_TYPES : NUM_TYPES
  const [input, cells] = rows[Math.min(sel[0], rows.length - 1)]
  const cell = cells[sel[1]]
  const type = types[sel[1]]
  const kind = kindOf(input, cell)

  const all = rows.flatMap(([i, cs]) => cs.map((c) => kindOf(i, c)))
  const count = (k: Kind) => all.filter((x) => x === k).length

  const next = () => {
    if (mode === 'text') {
      const n = (tour + 1) % TOUR_TEXT.length
      const [i, t] = TOUR_TEXT[n]
      setTour(n); setSel([TEXT_ROWS.findIndex((r) => r[0] === i), TEXT_TYPES.indexOf(t)])
    } else {
      const n = (tour + 1) % TOUR_NUM.length
      const [i, s, t] = TOUR_NUM[n]
      setTour(n); setSrc(s)
      setSel([NUM_ROWS.filter((r) => r[1] === s).findIndex((r) => r[0] === i), NUM_TYPES.indexOf(t)])
    }
  }
  const tourNote = mode === 'text'
    ? TOUR_TEXT.find(([i, t]) => i === input && t === type)?.[2]
    : TOUR_NUM.find(([i, s, t]) => i === input && s === src && t === type)?.[3]
  const sql = mode === 'text' ? `SELECT ${qt(input)}::${type};` : `SELECT ${input.startsWith('-') ? `(${input})` : input}::${src}::${type};`
  const generic = kind === 'error'
    ? `The cast fails with SQLSTATE \`${cell.c}\`. ${cell.c === '22003' ? 'The value is valid but **out of range** for the target type.' : cell.c === '22008' ? 'A date/time field is **out of range**.' : 'The text is **not valid input** for this type.'} In a real query this error stops the whole statement.`
    : kind === 'changed' ? `The cast succeeds but the value **changes form**: \`${input}\` becomes \`${cell.v}\`.`
      : 'The cast succeeds and the value is unchanged.'

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Source" value={mode} onChange={(m) => { setMode(m); setSel([0, 0]); setTour(-1) }} options={[['text', 'From text'], ['num', 'From a number']]} />
        {mode === 'num' && <Segmented label="Source type" value={src} onChange={(s) => { setSrc(s); setTour(-1) }} options={[['numeric', 'numeric'], ['double precision', 'double precision']]} />}
        <Btn primary testid="viz-next" onClick={next}>Next interesting cell →</Btn>
      </div>
      <Panel title={mode === 'text' ? 'text value → target type' : `${src} value → target type`}>
        <Matrix quoted={mode === 'text'} rows={rows} types={types} sel={sel} onSel={(r, c) => { setSel([r, c]); setTour(-1) }} />
      </Panel>
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-2">
          <SqlLine sql={sql} result={cell.v} error={cell.e} />
          {mode === 'text' && <SqlLine sql={`SELECT pg_input_is_valid(${qt(input)}, '${type}');`} result={cell.e ? 'f' : 't'} />}
        </div>
        <div className="grid grid-cols-3 gap-2 self-start">
          <Stat k="unchanged" v={count('ok')} t={tone('ok')} />
          <Stat k="converted" v={count('changed')} t={tone('new')} />
          <Stat k="error" v={count('error')} t={tone('dead')} />
        </div>
      </div>
      <Note>{tourNote ?? generic}</Note>
      <Legend items={[['ok', 'succeeds, same text'], ['new', 'succeeds, value converted or rounded'], ['dead', 'error (SQLSTATE shown)']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'casting-and-types',
  module: 'f2',
  order: 5,
  title: 'Type conversion',
  tldr: [
    'A **cast** converts a value from one type to another, written `CAST(x AS type)` or `x::type`, and functions like `to_char`, `to_number` and `to_date` handle custom formats.',
    'Data often arrives as text from forms and files, so you need to know which conversions succeed, which round, which fail, and how to test input before it breaks a whole load.',
  ],
  visualizer: {
    title: 'The cast matrix',
    caption: 'Every cell is a real cast result. Click a cell for its SQL and error, or press **Next interesting cell** for a guided tour. Switch to **From a number** to compare numeric and double precision rounding.',
    Component: CastMatrix,
  },
  playground: {
    setup: `
-- raw rows from a CSV upload: everything is text
CREATE TABLE staging_orders (
  line      int PRIMARY KEY,
  raw_qty   text,
  raw_price text,
  raw_date  text,
  raw_paid  text
);
INSERT INTO staging_orders VALUES
  (1, '3',     '12.50',     '2026-11-14', 'yes'),
  (2, ' 2 ',   '8',         '2026-11-15', 'no'),
  (3, '1',     '$1,299.00', '2026-11-15', 'true'),
  (4, 'four',  '9.99',      '2026-11-16', '1'),
  (5, '',      '7.25',      '2026-02-30', 't'),
  (6, '40000', '0.10',      '11/16/2026', 'f'),
  (7, '2',     '5.00',      '2026-11-17', 'maybe');

CREATE TABLE orders_clean (
  line       int PRIMARY KEY,
  qty        smallint      NOT NULL,
  price      numeric(10,2) NOT NULL,
  ordered_on date          NOT NULL,
  paid       boolean       NOT NULL
);`,
    presets: [
      { label: 'Three ways to cast', sql: `SELECT CAST('42' AS integer) AS cast_syntax,
       '42'::integer          AS double_colon,
       integer '42'           AS typed_literal,
       42::text || '!'        AS number_to_text,
       pg_typeof('42'::integer) AS result_type;`,
        note: 'All three spellings do the same conversion. `::` is PostgreSQL shorthand; `CAST(… AS …)` is standard SQL.' },
      { label: 'Literals adapt, columns do not', sql: `SELECT pg_typeof('hello') AS bare_literal,
       1 = '1'    AS literal_becomes_int,
       1 + '2'    AS also_int,
       '10' < '9' AS text_compare,
       10 < 9     AS number_compare;

SELECT x FROM (VALUES ('1'), ('10'), ('2'), ('9')) AS v(x) ORDER BY x;

SELECT 42 + 4.2 AS int_widens_to_numeric, length(42::text) AS needs_explicit_cast;`,
        note: 'A quoted literal starts as type `unknown` and takes whatever type its neighbour needs. Two texts compare character by character, so `\'10\' < \'9\'` is true and text numbers sort 1, 10, 2, 9. Typed values convert on their own (an **implicit** cast) only where nothing is lost, such as integer to numeric. Integer to text is not automatic: `length(42)` fails with "function length(integer) does not exist" until you write the **explicit** cast `42::text`.' },
      { label: 'What would fail?', sql: `SELECT line,
       raw_qty,   pg_input_is_valid(raw_qty,   'smallint') AS qty_ok,
       raw_price, pg_input_is_valid(raw_price, 'numeric')  AS price_ok,
       raw_date,  pg_input_is_valid(raw_date,  'date')     AS date_ok,
       raw_paid,  pg_input_is_valid(raw_paid,  'boolean')  AS paid_ok
FROM staging_orders ORDER BY line;

SELECT s.line, s.raw_qty, e.message, e.sql_error_code
FROM staging_orders s, pg_input_error_info(s.raw_qty, 'smallint') AS e
WHERE e.message IS NOT NULL ORDER BY s.line;`,
        note: '`pg_input_is_valid` tests a value **without raising an error**. `pg_input_error_info` returns the message the cast would have raised: `four` and `\'\'` are invalid syntax, `40000` is out of range.' },
      { label: 'Rounding and truncation', sql: `SELECT 2.5::integer          AS numeric_to_int,
       2.5::float8::integer  AS float_to_int,
       (-2.5)::integer       AS negative,
       3.99::integer         AS rounds_up,
       trunc(3.99)::integer  AS truncated,
       'abcdef'::varchar(3)  AS cut_to_3,
       1234.5678::numeric(6,2) AS two_places,
       '2026-11-14 15:42:07.987'::timestamp(0) AS whole_seconds;`,
        note: 'Casting a number to integer **rounds**, it does not truncate: 3.99 becomes 4. numeric ties go away from zero (3), double ties go to even (2). An explicit cast to `varchar(3)` silently cuts the text.' },
      { label: 'to_char, to_number, to_date', sql: `SELECT to_char(1234567.891, 'FM9,999,999.00')            AS money_text,
       to_char(42, '000')                                  AS zero_padded,
       to_char(12345, '999')                               AS too_narrow,
       to_char(date '2026-11-14', 'FMDay, FMDD FMMonth YYYY') AS long_date,
       to_char(timestamptz '2026-11-14 15:42+00' AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS iso_8601;

SELECT to_number('$1,299.00', 'L9G999D99')  AS parsed_price,
       to_date('14/11/2026', 'DD/MM/YYYY')   AS parsed_date;`,
        note: '`to_char` formats numbers and dates as text; `FM` removes padding. A format too narrow prints `###`. `to_number` and `to_date` parse text that a plain cast rejects.' },
      { label: 'Validate, then load', sql: `INSERT INTO orders_clean (line, qty, price, ordered_on, paid)
SELECT line,
       trim(raw_qty)::smallint,
       CASE WHEN pg_input_is_valid(raw_price, 'numeric') THEN raw_price::numeric
            ELSE to_number(raw_price, 'L9G999D99') END,
       raw_date::date,
       raw_paid::boolean
FROM staging_orders
WHERE pg_input_is_valid(trim(raw_qty), 'smallint')
  AND pg_input_is_valid(raw_date, 'date')
  AND pg_input_is_valid(raw_paid, 'boolean');

SELECT * FROM orders_clean ORDER BY line;`,
        note: 'Only rows that pass every check are cast, so the INSERT cannot fail halfway. Lines 1, 2 and 3 load (line 3 via `to_number`). Lines 4 to 7 stay in staging for a human to fix.' },
      { label: 'DateStyle and JSON values', sql: `SET DateStyle = 'ISO, DMY';
SELECT '03/04/2026'::date AS read_as_dmy, pg_input_is_valid('11/16/2026', 'date') AS us_date_ok;
SET DateStyle = 'ISO, MDY';
SELECT '03/04/2026'::date AS read_as_mdy;

SELECT '{"qty": "3"}'::jsonb ->> 'qty'              AS json_text,
       ('{"qty": "3"}'::jsonb ->> 'qty')::int + 1   AS json_as_int,
       '{1,2,3}'::int[]                             AS array_from_text;`,
        note: 'The same `03/04/2026` is April 3 or March 4 depending on **DateStyle**: prefer ISO `YYYY-MM-DD`. `->>` always returns text, so cast it before doing arithmetic.' },
    ],
  },
  production: {
    title: 'Importing a messy CSV without losing the good rows',
    context: 'A wholesale team uploads order spreadsheets every morning. A job copies them into a text-only staging table and then into typed tables.',
    problem: 'The first version ran `INSERT … SELECT raw_qty::smallint, …`. One cell with `four` raised `invalid input syntax for type smallint` and the **whole statement** rolled back: no orders loaded until someone found the bad row.',
    solution: 'Test every value with `pg_input_is_valid` first. Load the rows that pass, and copy the rest, with the exact message from `pg_input_error_info`, into a quarantine table that the team reviews. `UNION ALL` stacks the three result sets, and `FROM staging_orders s, pg_input_error_info(…) AS e` calls the function once per staging row ([LATERAL joins](/m3/lateral)).',
    sql: `CREATE TABLE import_errors AS
SELECT s.line, 'raw_qty' AS field, s.raw_qty AS value, e.message
FROM staging_orders s, pg_input_error_info(trim(s.raw_qty), 'smallint') AS e
WHERE e.message IS NOT NULL
UNION ALL
SELECT s.line, 'raw_date', s.raw_date, e.message
FROM staging_orders s, pg_input_error_info(s.raw_date, 'date') AS e
WHERE e.message IS NOT NULL
UNION ALL
SELECT s.line, 'raw_paid', s.raw_paid, e.message
FROM staging_orders s, pg_input_error_info(s.raw_paid, 'boolean') AS e
WHERE e.message IS NOT NULL;

SELECT * FROM import_errors ORDER BY line, field;`,
    outcome: 'On the playground data 3 of 7 rows load and 5 problems in 4 rows are reported (line 5 has both an empty quantity and February 30). Before the change, one bad cell meant zero rows loaded.',
  },
  pitfalls: [
    { title: 'One bad value aborts the whole load',
      symptom: '`ERROR: invalid input syntax for type smallint: "four"` and nothing is inserted, not even the valid rows.',
      cause: 'A statement is atomic. The first failing cast raises an error and rolls back every row of that INSERT.',
      fix: 'Filter with `pg_input_is_valid(value, \'type\')` before casting, and route invalid rows to a review table.' },
    { title: 'Numbers stored as text sort wrongly',
      symptom: 'Order numbers come back as 1, 10, 2, 9, and `WHERE code > \'9\'` misses 10.',
      cause: 'Text compares character by character: `\'1\'` < `\'9\'`, so `\'10\'` sorts before `\'9\'`.',
      fix: 'Store numbers in numeric columns. As a stopgap, cast in the query: `ORDER BY code::int`.',
      sql: `SELECT x FROM (VALUES ('1'), ('10'), ('2'), ('9')) AS v(x) ORDER BY x::int;` },
    { title: 'Casting to integer rounds, and not always the same way',
      symptom: 'An "items per box" calculation is off by one, and two code paths disagree on 2.5.',
      cause: '`::integer` rounds instead of truncating. From numeric, ties go away from zero; from double precision, ties go to even.',
      fix: 'Say what you mean before casting: `trunc(x)::int`, `floor(x)::int`, `ceil(x)::int` or `round(x)::int`.' },
    { title: 'Explicit varchar casts truncate silently',
      symptom: 'Long names are cut to a few characters in an export, with no error.',
      cause: 'Inserting `\'abcdef\'` into a `varchar(3)` column is an error, but an explicit `::varchar(3)` cast quietly keeps only 3 characters.',
      fix: 'Do not cast to a shorter length to "make it fit". Check `length(x)` first, or widen the column.' },
  ],
  pointers: [
    '`CAST(x AS t)`, `x::t` and `t \'literal\'` are the same conversion. Quoted literals start as `unknown` and adapt to their context.',
    'Text → number accepts spaces but not decimal points (for integers), commas or empty strings. Out of range is an error, never a wrap.',
    'Number → integer **rounds**: ties away from zero from numeric, to even from double precision. Be explicit with `trunc`/`round`.',
    'Check input with `pg_input_is_valid` and `pg_input_error_info` before casting; use `to_char`/`to_number`/`to_date` for custom formats.',
    'Going deeper: the Internals lesson [JSON vs JSONB](/m2/json-jsonb) shows how JSON values are stored and why `->>` hands you text, [Arrays](/m2/arrays) does the same for `int[]`, and [Working with JSON](/f2/working-with-json) is the practical guide.',
  ],
  sources: ['sql-expressions.html', 'typeconv-overview.html', 'typeconv-func.html', 'functions-formatting.html', 'functions-info.html', 'datatype-character.html'],
}
