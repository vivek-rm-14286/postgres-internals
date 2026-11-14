import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, Note, SqlLine, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a string workbench. The input and the output are drawn as character tiles, each with
 * its UTF-8 byte count, so length (characters) and octet_length (bytes) can be seen side by side.
 * The JavaScript implementations below were checked against PostgreSQL 18 for every sample string.
 * ---------------------------------------------------------------------------------------------- */

const SAMPLES = ['  ann LEE  ', 'Ann.Lee@Example.COM', 'naïve café 😀', 'Phone: 555-123-4567']
const enc = new TextEncoder()
const bytesOf = (c: string) => enc.encode(c).length
const isWord = (c: string) => /[\p{L}\p{N}]/u.test(c)

const q = (s: string) => `'${s.replace(/'/g, "''")}'`

type Mark = 'match' | 'removed' | 'dim' | undefined
interface Result { out: string | number; inMarks: Mark[]; outChanged?: boolean[]; note: string }

const sameLen = (s: string, o: string) => {
  const a = Array.from(s), b = Array.from(o)
  return b.map((c, i) => c !== a[i])
}

const FUNCS: { id: string; label: string; sql: (s: string) => string; run: (s: string) => Result }[] = [
  { id: 'upper', label: 'upper', sql: (s) => `upper(${q(s)})`,
    run: (s) => { const o = s.toUpperCase(); return { out: o, inMarks: [], outChanged: sameLen(s, o), note: '**upper** changes letters to capitals. Digits, spaces and symbols pass through. Accented letters change too: `é` → `É`.' } } },
  { id: 'lower', label: 'lower', sql: (s) => `lower(${q(s)})`,
    run: (s) => { const o = s.toLowerCase(); return { out: o, inMarks: [], outChanged: sameLen(s, o), note: '**lower** is the usual way to normalise text before comparing it: `lower(email) = lower($1)`.' } } },
  { id: 'initcap', label: 'initcap', sql: (s) => `initcap(${q(s)})`,
    run: (s) => { let prev = false, o = ''; for (const c of s) { o += prev ? c.toLowerCase() : c.toUpperCase(); prev = isWord(c) } return { out: o, inMarks: [], outChanged: sameLen(s, o), note: '**initcap** capitalises the first letter of each word and lowercases the rest. A word is any run of letters and digits, so `o\'neil` becomes `O\'Neil`.' } } },
  { id: 'trim', label: 'trim', sql: (s) => `trim(${q(s)})`,
    run: (s) => { const a = Array.from(s); let i = 0, j = a.length; while (i < j && a[i] === ' ') i++; while (j > i && a[j - 1] === ' ') j--; return { out: a.slice(i, j).join(''), inMarks: a.map((_, k) => (k < i || k >= j ? 'removed' : undefined)), note: '**trim** removes spaces from both ends (red). Spaces in the middle stay. `ltrim` and `rtrim` do one side; `trim(both \'x\' from s)` removes other characters.' } } },
  { id: 'substring', label: 'substring 1..4', sql: (s) => `substring(${q(s)} from 1 for 4)`,
    run: (s) => { const a = Array.from(s); return { out: a.slice(0, 4).join(''), inMarks: a.map((_, k) => (k < 4 ? 'match' : 'dim')), note: 'Positions start at **1**, not 0. `from 1 for 4` takes characters 1 to 4. It counts characters, so a 4-byte emoji is still one position.' } } },
  { id: 'position', label: "position('@')", sql: (s) => `position('@' in ${q(s)})`,
    run: (s) => { const a = Array.from(s); const i = a.indexOf('@'); return { out: i + 1, inMarks: a.map((_, k) => (k === i ? 'match' : undefined)), note: i < 0 ? 'No `@` here, so **position** returns **0**, not NULL. Test `position(...) > 0` before slicing with it.' : `**position** returns the 1-based character index of the first match: **${i + 1}**.` } } },
  { id: 'split', label: "split_part('@', 2)", sql: (s) => `split_part(${q(s)}, '@', 2)`,
    run: (s) => { const a = Array.from(s); const at = a.indexOf('@'); const out = s.split('@')[1] ?? ''; return { out, inMarks: a.map((_, k) => (at < 0 ? 'dim' : k === at ? 'removed' : k > at ? 'match' : 'dim')), note: at < 0 ? 'No delimiter, so there is no field 2: **split_part** returns an **empty string** (not NULL).' : '**split_part** cuts at each `@` and returns field 2: the email domain. Use `-1` for the last field.' } } },
  { id: 'replace', label: "replace(' ', '_')", sql: (s) => `replace(${q(s)}, ' ', '_')`,
    run: (s) => { const a = Array.from(s); const o = s.split(' ').join('_'); return { out: o, inMarks: a.map((c) => (c === ' ' ? 'removed' : undefined)), outChanged: Array.from(o).map((c) => c === '_'), note: '**replace** swaps every occurrence of a fixed string. No patterns, no flags: it is exact and case-sensitive.' } } },
  { id: 'squash', label: 'regexp_replace \\s+', sql: (s) => `regexp_replace(${q(s)}, '\\s+', ' ', 'g')`,
    run: (s) => { const a = Array.from(s); const marks: Mark[] = a.map((c, k) => (/\s/.test(c) && ((k > 0 && /\s/.test(a[k - 1])) || false) ? 'removed' : /\s/.test(c) ? 'match' : undefined)); return { out: s.replace(/\s+/g, ' '), inMarks: marks, note: 'The regular expression `\\s+` matches each **run** of whitespace. The `g` flag replaces every run, not just the first, with a single space.' } } },
  { id: 'digits', label: 'regexp_replace \\D', sql: (s) => `regexp_replace(${q(s)}, '\\D', '', 'g')`,
    run: (s) => { const a = Array.from(s); return { out: s.replace(/\D/gu, ''), inMarks: a.map((c) => (/\d/.test(c) ? 'match' : 'removed')), note: '`\\D` means "not a digit". Replacing every match with `\'\'` keeps only digits: a common way to clean phone numbers.' } } },
  { id: 'reverse', label: 'reverse', sql: (s) => `reverse(${q(s)})`,
    run: (s) => ({ out: Array.from(s).reverse().join(''), inMarks: [], note: '**reverse** flips characters, not bytes, so multi-byte characters survive intact.' }) },
  { id: 'length', label: 'length vs octet_length', sql: (s) => `length(${q(s)}), octet_length(${q(s)})`,
    run: (s) => ({ out: `${Array.from(s).length} | ${enc.encode(s).length}`, inMarks: Array.from(s).map((c) => (bytesOf(c) > 1 ? 'match' : undefined)), note: '**length** counts characters. **octet_length** counts bytes. In UTF-8, plain ASCII is 1 byte, `é` is 2 and an emoji is 4 (highlighted).' }) },
]
const markTone: Record<Exclude<Mark, undefined>, Tone> = { match: 'pointer', removed: 'dead', dim: 'muted' }

function Tiles({ text, marks, changed, prefix }: { text: string; marks?: Mark[]; changed?: boolean[]; prefix: string }) {
  const chars = Array.from(text)
  if (!chars.length) return <p className="py-3 font-mono text-sm text-muted">'' (empty string)</p>
  return (
    <div className="flex flex-wrap gap-1">
      <AnimatePresence initial={false} mode="popLayout">
        {chars.map((c, i) => {
          const m = marks?.[i]
          const t: Tone = m ? markTone[m] : changed?.[i] ? 'new' : 'tuple'
          const b = bytesOf(c)
          return (
            <motion.div key={`${prefix}-${i}-${c}`} layout initial={{ opacity: 0, y: -6, scale: 0.9 }} animate={{ opacity: m === 'dim' ? 0.45 : 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24, delay: Math.min(i, 24) * 0.012 }}
              className="flex w-8 flex-col items-center rounded-md border py-1" style={{ borderColor: tone(t), background: toneBg(t, m === 'removed' ? 22 : 14) }}>
              <span className={`font-mono text-[15px] leading-5 ${m === 'removed' ? 'line-through' : ''}`} style={{ color: c === ' ' ? 'var(--muted)' : 'var(--text)' }}>{c === ' ' ? '␣' : c}</span>
              <span className="font-mono text-[10px] leading-3" style={{ color: b > 1 ? tone('header') : 'var(--muted)', fontWeight: b > 1 ? 700 : 400 }}>{b}B</span>
              <span className="font-mono text-[9.5px] leading-3 text-muted">{i + 1}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function StringWorkbench() {
  const [s, setS] = useState(SAMPLES[0])
  const [fi, setFi] = useState(0)
  const f = FUNCS[fi]
  const r = f.run(s)
  const outText = typeof r.out === 'string' ? r.out : null
  const chars = Array.from(s).length, bytes = enc.encode(s).length
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">Input:</span>
        {SAMPLES.map((x) => <Btn key={x} active={x === s} onClick={() => setS(x)}><span className="font-mono">{x.replace(/ /g, '␣')}</span></Btn>)}
        <input value={s} maxLength={32} onChange={(e) => setS(e.target.value)} aria-label="Type your own string"
          className="min-w-0 flex-1 basis-40 rounded-lg border border-line bg-bg px-2 py-1.5 font-mono text-xs text-ink outline-none focus:border-accent" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {FUNCS.map((x, i) => <Btn key={x.id} active={i === fi} onClick={() => setFi(i)}><span className="font-mono">{x.label}</span></Btn>)}
        <Btn primary testid="viz-next" onClick={() => setFi((i) => (i + 1) % FUNCS.length)}>Next function →</Btn>
      </div>
      <SqlLine sql={`SELECT ${f.sql(s)};`} result={outText ?? String(r.out)} />
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Input characters">
          <Tiles text={s} marks={r.inMarks} prefix="in" />
        </Panel>
        <Panel title={outText !== null ? 'Output characters' : 'Output'}>
          {outText !== null ? <Tiles text={outText} changed={r.outChanged} prefix={`out-${f.id}`} />
            : <motion.p key={String(r.out)} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-2 font-mono text-3xl font-bold" style={{ color: tone.text('pointer') }}>{r.out}</motion.p>}
        </Panel>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat k="length(input)" v={chars} />
        <Stat k="octet_length(input)" v={bytes} t={bytes > chars ? tone('header') : undefined} />
        <Stat k="length(output)" v={outText !== null ? Array.from(outText).length : '–'} />
        <Stat k="octet_length(output)" v={outText !== null ? enc.encode(outText).length : '–'} />
      </div>
      <Note>{r.note}</Note>
      <Legend items={[['tuple', 'character (with its UTF-8 bytes and position)'], ['pointer', 'selected / matched'], ['dead', 'removed'], ['new', 'changed in output'], ['header', 'multi-byte character']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'text-functions',
  module: 'f2',
  order: 1,
  title: 'Text and strings',
  tldr: [
    'PostgreSQL ships dozens of **string functions** that join, measure, change case, trim, slice, search and rewrite text, plus **regular expressions** for patterns.',
    'Real data arrives messy, with stray spaces, mixed case and odd formats, so you clean and compare it in SQL instead of shipping every row to application code.',
  ],
  visualizer: {
    title: 'String workbench: every character and its bytes',
    caption: 'Pick an input (or type your own) and step through the functions. Watch which characters are kept, removed or changed, and compare **length** with **octet_length**.',
    Component: StringWorkbench,
  },
  playground: {
    extensions: ['citext'],
    setup: `
CREATE TABLE customers (
  id         int PRIMARY KEY,
  first_name text,
  last_name  text,
  email      text,
  phone      text,
  city       text
);
INSERT INTO customers VALUES
  (1, '  ann ', 'LEE',    'Ann.Lee@Example.COM',    '(555) 123-4567',  'new york'),
  (2, 'Bob',    NULL,     'bob@example.com',        '555.987.6543',    'LONDON'),
  (3, 'josé',   'García', 'jose@ejemplo.es',        '+34 600 111 222', 'sevilla'),
  (4, 'Chen',   'Wei',    'CHEN.WEI@example.com ',  NULL,              'são paulo'),
  (5, 'dee',    'o''neil','dee@sample.org',         '555 000 1111',    'new york'),
  (6, 'ann',    'lee',    'ann.lee@example.com',    '5551234567',      'New York');`,
    presets: [
      { label: 'Joining strings', sql: `SELECT id,
       first_name || ' ' || last_name      AS with_pipes,
       concat(first_name, ' ', last_name)  AS with_concat,
       concat_ws(' ', first_name, last_name) AS with_ws
FROM customers ORDER BY id;`,
        note: 'Bob has no last name. With `||` one NULL makes the whole result NULL. `concat` and `concat_ws` skip NULLs, and `concat_ws` puts the separator only between real values.' },
      { label: 'Characters vs bytes', sql: `SELECT city,
       length(city)       AS characters,
       octet_length(city) AS bytes
FROM customers ORDER BY id;

SELECT length('naïve café 😀') AS characters, octet_length('naïve café 😀') AS bytes;`,
        note: '`são paulo` is 9 characters but 10 bytes, because `ã` takes 2 bytes in UTF-8. The emoji string is 12 characters and 17 bytes.' },
      { label: 'Clean up names', sql: `SELECT id,
       '[' || first_name || ']'          AS raw_first,
       initcap(trim(first_name))         AS first_clean,
       initcap(last_name)                AS last_clean,
       initcap(city)                     AS city_clean
FROM customers ORDER BY id;`,
        note: 'The brackets show the stray spaces around `ann`. `trim` removes them and `initcap` fixes the case: `LEE` → `Lee`, `o\'neil` → `O\'Neil`, `são paulo` → `São Paulo`.' },
      { label: 'Slice and search', sql: `SELECT email,
       position('@' IN email)          AS at_pos,
       split_part(email, '@', 1)       AS local_part,
       split_part(email, '@', 2)       AS domain,
       substring(email FROM 1 FOR 3)   AS first3,
       split_part(email, '.', -1)      AS tld
FROM customers ORDER BY id;`,
        note: 'Positions start at 1. `split_part` with `-1` takes the last field. Row 4 has a trailing space, so its `tld` is `com ` (with a space): dirty data shows up as soon as you slice it.' },
      { label: 'Regular expressions', sql: `SELECT id, phone,
       regexp_replace(phone, '\\D', '', 'g')   AS digits_only,
       phone ~ '^\\(?555'                     AS starts_555,
       regexp_match(email, '^([^@]+)@(.+)$')  AS parts
FROM customers ORDER BY id;

SELECT id, regexp_matches(phone, '\\d{4}', 'g') AS four_digit_groups
FROM customers ORDER BY id;`,
        note: '`\\D` = any non-digit. The second query returns rows only for customers whose phone contains a 4-digit group: `regexp_matches` silently **drops** rows with no match (ids 3 and 4 vanish).' },
      { label: 'format() for messages and SQL', sql: `SELECT format('%s %s <%s>', initcap(trim(first_name)), coalesce(initcap(last_name), '?'), lower(trim(email))) AS label
FROM customers ORDER BY id;

SELECT format('SELECT * FROM %I WHERE city = %L', 'Customer List', city) AS safe_sql
FROM customers WHERE id = 5;`,
        note: '`%s` inserts a value, `%I` quotes an identifier only when needed (`"Customer List"`), `%L` quotes a literal safely. This is how dynamic SQL avoids injection.' },
      { label: 'Case-insensitive matching', sql: `SELECT count(*) AS exact_matches FROM customers
WHERE email = 'ann.lee@example.com';

SELECT id, email FROM customers
WHERE lower(trim(email)) = 'ann.lee@example.com';

SELECT id, email FROM customers WHERE email ILIKE 'ann.%';

SELECT 'Ann.Lee@Example.COM'::citext = 'ann.lee@example.com' AS citext_equal;

-- 'und@colStrength=secondary' is the ICU keyword spelling of the BCP 47 locale
-- 'und-u-ks-level2': compare letters, ignore case.
CREATE COLLATION IF NOT EXISTS case_insensitive
  (provider = icu, locale = 'und@colStrength=secondary', deterministic = false);
SELECT 'Ann' = 'ANN' COLLATE case_insensitive    AS collation_equal,
       'Ann' LIKE 'an%' COLLATE case_insensitive AS like_too,
       'Ann' = 'ANN'                              AS default_equal,
       casefold('Ann.LEE')                        AS folded;`,
        note: 'Plain `=` finds 1 row; normalising with `lower(trim(...))` finds both Ann rows. `ILIKE`, the `citext` type and a **nondeterministic collation** are three more ways to ignore case. On PostgreSQL 18 `LIKE` works with such a collation, and `casefold()` is the Unicode-aware alternative to `lower()` for comparisons.' },
    ],
  },
  production: {
    title: 'Duplicate sign-ups that differ only by case',
    context: 'A newsletter service stores whatever email the sign-up form sends. Mobile keyboards capitalise the first letter and some users paste a trailing space.',
    problem: '`Ann.Lee@Example.COM` and `ann.lee@example.com` are different strings, so the `UNIQUE (email)` constraint lets both in. Users get two copies of every mail, and unsubscribe only removes one.',
    solution: 'Find the duplicates by grouping on a normalised value. Merge them, store the normalised form, and enforce uniqueness on `lower(email)` with an **expression index** so the database rejects new case-variants. (An index is a lookup structure the database maintains; see [Indexes for beginners](/f3/indexes-101).)',
    sql: `-- 1. find duplicates
SELECT lower(trim(email)) AS normalised, count(*), array_agg(id ORDER BY id) AS ids
FROM customers
GROUP BY 1                 -- 1 = the first output column
HAVING count(*) > 1;

-- 2. keep the oldest row of each group (after moving its history over);
--    USING joins the table to itself: delete a where an older twin b exists
DELETE FROM customers a USING customers b
WHERE lower(trim(a.email)) = lower(trim(b.email)) AND a.id > b.id;

-- 3. store one canonical form
UPDATE customers SET email = lower(trim(email));

-- 4. make case-variants impossible
CREATE UNIQUE INDEX customers_email_lower_key ON customers (lower(email));
INSERT INTO customers (id, email) VALUES (7, 'ANN.LEE@example.com');  -- ERROR: duplicate key`,
    outcome: 'In the playground data, step 1 finds one duplicate group (ids 1 and 6) and step 2 removes id 6. After the index exists, inserting `ANN.LEE@example.com` fails with a unique violation, and lookups written as `WHERE lower(email) = lower($1)` can use the index.',
  },
  pitfalls: [
    { title: 'One NULL blanks the whole label',
      symptom: 'A report shows empty names for some customers even though the first name is filled in.',
      cause: '`||` returns NULL if any piece is NULL. One missing `last_name` makes `first_name || \' \' || last_name` NULL.',
      fix: 'Use `concat_ws(\' \', first_name, last_name)` or wrap the nullable pieces in `coalesce(col, \'\')`.',
      sql: `SELECT concat_ws(' ', first_name, last_name) FROM customers;` },
    { title: 'Counting characters when the limit is in bytes',
      symptom: 'A value that passed a 255-character check is rejected by a downstream system with a 255-byte limit.',
      cause: '`length` and `varchar(n)` count **characters**. Accented letters take 2 bytes and emoji take 4 in UTF-8.',
      fix: 'Check `octet_length` when the limit is in bytes, for example `CHECK (octet_length(bio) <= 255)`.' },
    { title: 'regexp_matches silently drops rows',
      symptom: 'Adding a regex column to a SELECT makes some rows disappear from the result.',
      cause: '`regexp_matches` is a set-returning function: it returns zero rows when there is no match, which removes the row.',
      fix: 'Use `regexp_match` (one result or NULL) when you want the first match, or, without the `g` flag, wrap it: `(SELECT regexp_matches(col, pat))`.' },
    { title: 'Case-insensitive search that scans the whole table',
      symptom: '`WHERE lower(email) = $1` is slow on a big table even though `email` has an index.',
      cause: 'An index on `email` stores the original values. It cannot answer a question about `lower(email)`.',
      fix: 'Create an expression index on exactly the expression you filter by, or use the `citext` type.',
      sql: `CREATE INDEX ON customers (lower(email));` },
  ],
  pointers: [
    '`||` returns NULL if any piece is NULL. `concat` and `concat_ws` skip NULLs.',
    '**length** counts characters and **octet_length** counts bytes. String positions start at **1**.',
    '`~` matches a regex anywhere in the string. `LIKE` must match the whole string. Add `g` to `regexp_replace` to replace every match.',
    'For case-insensitive equality, normalise with `lower()`, use `ILIKE`, the `citext` type or a nondeterministic collation. Back it with a matching index.',
    'Going deeper: the Internals lesson [Designing indexes](/m4/index-design) shows how an expression index on `lower(email)` serves these lookups.',
  ],
  sources: ['functions-string.html', 'functions-matching.html', 'collation.html', 'citext.html', 'indexes-expressional.html'],
}
