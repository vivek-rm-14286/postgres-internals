import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { PRODUCTS, PRODUCTS_SQL, ResultTable, Sql, Val, money, type Cell, type Product, type ResultRow } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the anatomy of a table and of a first SELECT. A nested hierarchy (cluster → database →
 * schema → table) sits above the products grid. Each step highlights what a statement reads (columns,
 * rows) and shows the exact result PostgreSQL 18 returns, including `28.800` for numeric(8,2) * 1.2 and
 * the `?column?` name of an unnamed expression. Click any cell to inspect it.
 * ---------------------------------------------------------------------------------------------- */

type Col = keyof Product
const COLS: { k: Col; type: string; nullable: boolean }[] = [
  { k: 'id', type: 'int', nullable: false }, { k: 'name', type: 'text', nullable: false },
  { k: 'category', type: 'text', nullable: false }, { k: 'price', type: 'numeric(8,2)', nullable: false },
  { k: 'stock', type: 'int', nullable: true },
]
type Level = 'cluster' | 'database' | 'schema' | 'table'

interface S {
  level: Level | null
  cols: Col[]
  /** Row ids to emphasise (the anatomy step). */
  rowHi?: number
  colHi?: Col
  sql: string
  result: { fields: string[]; rows: ResultRow[]; tag: string } | null
  trip?: boolean
}

const cellOf = (p: Product, c: Col): Cell => (c === 'price' ? money(p.price) : p[c])
const all = (cols: Col[]) => PRODUCTS.map((p) => ({ key: `r${p.id}`, cells: cols.map((c) => cellOf(p, c)) }))
const tag = (n: number) => `SELECT ${n}`

const STEPS: Step<S>[] = [
  { title: 'One server, many databases',
    body: 'A PostgreSQL server is called a **cluster**. It holds several **databases**, and each connection works inside exactly one of them.',
    state: { level: 'cluster', cols: [], sql: "-- which database am I connected to?\nSELECT current_database();", result: { fields: ['current_database'], rows: [{ key: 'db', cells: ['postgres'] }], tag: tag(1) } } },
  { title: 'Databases hold schemas, schemas hold tables',
    body: 'A **schema** is a folder for tables inside a database. New tables go into the schema named `public` unless you say otherwise.',
    state: { level: 'schema', cols: [], sql: 'SELECT current_schema();', result: { fields: ['current_schema'], rows: [{ key: 's', cells: ['public'] }], tag: tag(1) } } },
  { title: 'A table: columns and rows',
    body: 'A **table** has named **columns**, each with a **type**, and any number of **rows**. One value sits where a row meets a column: a **cell**. `NULL` means "no value".',
    state: { level: 'table', cols: [], rowHi: 3, colHi: 'price', sql: '-- the table has 5 columns and 9 rows\nTABLE products;', result: null } },
  { title: 'SELECT * : every column, every row',
    body: '`SELECT` asks for data, `FROM` names the table, and `*` means "all columns". The rows come back in no promised order.',
    state: { level: 'table', cols: COLS.map((c) => c.k), sql: 'SELECT * FROM products;', result: { fields: COLS.map((c) => c.k), rows: all(COLS.map((c) => c.k)), tag: tag(9) } } },
  { title: 'Pick only the columns you need',
    body: 'List columns by name, separated by commas. The result has exactly those columns, in the order you wrote them.',
    state: { level: 'table', cols: ['name', 'price'], sql: 'SELECT name, price FROM products;', result: { fields: ['name', 'price'], rows: all(['name', 'price']), tag: tag(9) } } },
  { title: 'Compute a new column with an expression',
    body: 'The select list can hold **expressions**. `AS` gives the computed column a name. `numeric(8,2) * 1.2` keeps three decimals: `28.800`.',
    state: { level: 'table', cols: ['name', 'price'], sql: 'SELECT name,\n       price * 1.2 AS price_with_tax\nFROM products;',
      result: { fields: ['name', 'price_with_tax'], rows: PRODUCTS.map((p) => ({ key: `r${p.id}`, cells: [p.name, (p.price * 1.2).toFixed(3)] })), tag: tag(9) } } },
  { title: 'Forget AS and the column is called ?column?',
    body: 'An expression without a name gets the placeholder name `?column?`. Always name computed columns so the client code can find them.',
    state: { level: 'table', cols: ['name', 'stock'], sql: 'SELECT name, stock * 2\nFROM products;',
      result: { fields: ['name', '?column?'], rows: PRODUCTS.map((p) => ({ key: `r${p.id}`, cells: [p.name, p.stock === null ? null : p.stock * 2] })), tag: tag(9) } } },
  { title: 'Table aliases, comments and the semicolon',
    body: '`FROM products AS p` lets you write `p.name`. `--` starts a comment that runs to the end of the line. The `;` ends the statement.',
    state: { level: 'table', cols: ['name', 'stock'], sql: '-- how many of each do we hold?\nSELECT p.name, p.stock\nFROM products AS p;',
      result: { fields: ['name', 'stock'], rows: all(['name', 'stock']), tag: tag(9) } } },
  { title: 'The round trip',
    body: 'Your **client** (psql, an app, this page) sends the SQL text to the **server**. The server checks it, plans it, runs it and streams back rows plus a tag such as `SELECT 9`.',
    state: { level: 'database', cols: ['name', 'stock'], sql: 'SELECT p.name, p.stock\nFROM products AS p;', result: { fields: ['name', 'stock'], rows: all(['name', 'stock']).slice(0, 3), tag: tag(9) }, trip: true } },
]

/* ---- hierarchy ---------------------------------------------------------------------------------- */

const LEVELS: { k: Level; label: string; name: string; t: Tone }[] = [
  { k: 'cluster', label: 'cluster', name: 'one PostgreSQL server', t: 'header' },
  { k: 'database', label: 'database', name: 'postgres', t: 'pointer' },
  { k: 'schema', label: 'schema', name: 'public', t: 'new' },
  { k: 'table', label: 'table', name: 'products', t: 'tuple' },
]

function Hierarchy({ level }: { level: Level | null }) {
  const nest = (i: number): ReactNode => {
    if (i >= LEVELS.length) return null
    const L = LEVELS[i]
    const on = level === L.k
    const extra = i === 0 ? ['template1'] : i === 1 ? ['pg_catalog'] : i === 2 ? ['other tables'] : []
    return (
      <motion.div layout className="rounded-lg border p-2" animate={{ borderColor: on ? tone(L.t) : 'var(--border)', backgroundColor: on ? toneBg(L.t, 14) : 'rgba(0,0,0,0)' }}
        style={{ borderWidth: on ? 2 : 1 }} transition={{ duration: 0.3 }}>
        <p className="mb-1.5 flex flex-wrap items-baseline gap-x-2 text-[11px]">
          <span className="font-semibold tracking-wide uppercase" style={{ color: tone(L.t) }}>{L.label}</span>
          <span className="font-mono text-ink">{L.name}</span>
        </p>
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-[9.5rem] flex-1">{i < LEVELS.length - 1 ? nest(i + 1) : <TableIcon />}</div>
          {extra.map((e) => (
            <span key={e} className="rounded border border-dashed border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">{e}</span>
          ))}
        </div>
      </motion.div>
    )
  }
  return <div aria-label="cluster, database, schema, table">{nest(0)}</div>
}

function TableIcon() {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {COLS.map((c) => <span key={c.k} className="h-3 w-5 rounded-sm" style={{ background: toneBg('tuple', 40) }} />)}
    </div>
  )
}

/* ---- products grid --------------------------------------------------------------------------- */

function Grid({ s, sel, onSel }: { s: S; sel: { id: number; c: Col } | null; onSel: (v: { id: number; c: Col }) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
      <table className="w-full border-collapse font-mono text-[12px]">
        <thead>
          <tr className="border-b border-line">
            {COLS.map((c) => {
              const read = s.cols.includes(c.k) || s.colHi === c.k
              return (
                <motion.th key={c.k} className="px-2 py-1 text-left align-bottom" animate={{ backgroundColor: read ? toneBg(s.colHi === c.k ? 'new' : 'tuple', 22) : 'rgba(0,0,0,0)' }}>
                  <span className="block font-semibold text-ink">{c.k}</span>
                  <span className="block text-[10px] font-normal text-muted">{c.type}</span>
                </motion.th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {PRODUCTS.map((p) => (
            <tr key={p.id} className="border-b border-line last:border-0">
              {COLS.map((c) => {
                const read = s.cols.includes(c.k)
                const rowOn = s.rowHi === p.id
                const colOn = s.colHi === c.k
                const isSel = sel?.id === p.id && sel.c === c.k
                const t: Tone | null = isSel ? 'accent' : rowOn && colOn ? 'new' : rowOn ? 'pointer' : colOn ? 'new' : read ? 'tuple' : null
                return (
                  <motion.td key={c.k} onClick={() => onSel({ id: p.id, c: c.k })}
                    className="cursor-pointer px-2 py-1 whitespace-nowrap"
                    animate={{ backgroundColor: t ? toneBg(t, isSel || (rowOn && colOn) ? 34 : 14) : 'rgba(0,0,0,0)', opacity: s.cols.length && !read && !rowOn ? 0.45 : 1 }}
                    transition={{ duration: 0.3 }}>
                    <Val v={cellOf(p, c.k)} />
                  </motion.td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Trip() {
  return (
    <svg viewBox="0 0 360 104" className="w-full min-w-[300px]" role="img" aria-label="client sends SQL, server returns rows">
      <rect x="2" y="18" width="104" height="56" rx="8" fill={toneBg('accent', 14)} stroke={tone('accent')} />
      <text x="54" y="42" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)">client</text>
      <text x="54" y="60" textAnchor="middle" fontSize="10" fill="var(--muted)">psql, app, page</text>
      <rect x="254" y="18" width="104" height="56" rx="8" fill={toneBg('header', 14)} stroke={tone('header')} />
      <text x="306" y="42" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)">server</text>
      <text x="306" y="60" textAnchor="middle" fontSize="10" fill="var(--muted)">parse, plan, run</text>
      <line x1="108" y1="34" x2="252" y2="34" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="108" y1="58" x2="252" y2="58" stroke="var(--border)" strokeWidth="1.5" />
      <motion.g initial={{ x: 0 }} animate={{ x: [0, 104, 104] }} transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.4, 1] }}>
        <rect x="112" y="24" width="36" height="20" rx="4" fill={tone('accent')} />
        <text x="130" y="38" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--bg)">SQL</text>
      </motion.g>
      {[0, 1, 2].map((i) => (
        <motion.g key={i} initial={{ x: 0, opacity: 0 }} animate={{ x: [0, 0, -104], opacity: [0, 1, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.5 + i * 0.08, 0.9 + i * 0.03] }}>
          <rect x="212" y="48" width="36" height="20" rx="4" fill={tone('tuple')} />
          <text x="230" y="62" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--bg)">row</text>
        </motion.g>
      ))}
      <text x="180" y="96" textAnchor="middle" fontSize="11" fill="var(--muted)">rows, then the tag: SELECT 9</text>
    </svg>
  )
}

function RelationalViz() {
  const [sel, setSel] = useState<{ id: number; c: Col } | null>(null)
  return (
    <Stepper steps={STEPS} interval={3200} render={(s) => {
      const p = sel ? PRODUCTS.find((x) => x.id === sel.id)! : null
      const col = sel ? COLS.find((c) => c.k === sel.c)! : null
      return (
        <div className="grid gap-3">
          <Legend items={[['header', 'cluster'], ['pointer', 'database / one row'], ['new', 'schema / one column'], ['tuple', 'table / columns read'], ['accent', 'cell you clicked']]} />
          <div className="grid gap-3 lg:grid-cols-[1fr_1.15fr]">
            <div className="grid content-start gap-3">
              <Hierarchy level={s.level} />
              {s.trip && <div className="rounded-lg border border-line bg-bg p-2"><Trip /></div>}
              <Sql>{s.sql}</Sql>
              {s.result && <ResultTable caption={<span>result <span className="ml-1 normal-case">{s.result.tag}</span></span>} fields={s.result.fields} rows={s.result.rows} />}
            </div>
            <div className="grid content-start gap-2">
              <Grid s={s} sel={sel} onSel={setSel} />
              <Panel title="cell inspector">
                {p && col ? (
                  <FieldTable rows={[
                    ['table', 'public.products'],
                    ['row', `id = ${p.id} (${p.name})`],
                    ['column', `${col.k}  ${col.type}${col.nullable ? '' : ' NOT NULL'}`],
                    ['value', <Val key="v" v={cellOf(p, col.k)} />],
                  ]} />
                ) : <p className="text-xs text-muted"><Md>Click any cell in the table. A cell is one **row** × one **column**.</Md></p>}
              </Panel>
            </div>
          </div>
        </div>
      )
    }} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'relational-basics',
  module: 'f1',
  order: 1,
  title: 'Tables, rows and your first query',
  tldr: [
    'A relational database keeps data in **tables** of **rows** and named, typed **columns**, and `SELECT … FROM` is how you ask it for some of that data.',
    'Every report, screen and API you will build starts as a query like this, so knowing exactly what a query reads and returns is the first skill to learn.',
  ],
  visualizer: {
    title: 'Anatomy of a table and a first SELECT',
    caption: 'Step through from the server down to one cell. Watch which columns each query reads, compare the result, and click any cell to inspect it.',
    Component: RelationalViz,
  },
  playground: {
    setup: PRODUCTS_SQL,
    presets: [
      { label: 'Everything', sql: 'SELECT * FROM products;',
        note: '9 rows, 5 columns. Two rows show **NULL** for stock: the value is unknown, not zero.' },
      { label: 'Pick columns', sql: 'SELECT name, price\nFROM products;',
        note: 'Only the two columns you listed, in that order. Swap them and run again.' },
      { label: 'Expressions and AS', sql: `SELECT name,
       price,
       price * 1.2          AS price_with_tax,
       stock * 2,
       name || ' (' || category || ')' AS label
FROM products;`,
        note: '`price * 1.2` returns `28.800`: three decimals. `stock * 2` has no alias, so its column is named `?column?`, and NULL stock stays NULL. `||` joins text.' },
      { label: 'Table alias and comments', sql: `/* A block comment
   can span lines. */
SELECT p.name, p.stock   -- the stock column
FROM products AS p;`,
        note: '`p` is a short name for `products` in this one query. Comments are ignored by the server.' },
      { label: 'Where am I?', sql: `SELECT current_database() AS database,
       current_schema()   AS schema,
       current_user       AS logged_in_as,
       version();`,
        note: 'You are in database `postgres`, schema `public`, as user `postgres`, on PostgreSQL 18.' },
      { label: 'List my tables', sql: `SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;`,
        note: 'The database describes itself with ordinary tables you can query. `stock` is the only nullable column.' },
    ],
  },
  production: {
    title: 'An export that stops breaking',
    context: 'A data analyst exports the product catalog to a spreadsheet every week with `SELECT * FROM products`. A finance script reads the file by column position.',
    problem: 'A developer adds a `supplier_id` column between `category` and `price`. The next export shifts every column one place to the right, and the finance script reads supplier ids as prices.',
    solution: 'Name the columns, give computed values clear aliases, and sort the output so the file is the same shape and order every week.',
    sql: `SELECT id,
       name,
       category,
       price,
       price * 1.2 AS price_with_tax
FROM products
ORDER BY id;`,
    outcome: 'The export keeps exactly 5 columns in a fixed order no matter how the table changes. New columns appear only when someone adds them to the query on purpose.',
  },
  pitfalls: [
    { title: 'Assuming rows come back in insert order',
      symptom: 'A list looks sorted in testing, then shows up in a different order in production after some updates.',
      cause: 'A table is an unordered set of rows. Without `ORDER BY`, PostgreSQL returns rows in whatever order is cheapest, which changes as data moves.',
      fix: 'Add `ORDER BY` whenever order matters, for example `ORDER BY id`. The next lesson covers sorting.' },
    { title: 'SELECT * in application code',
      symptom: 'An app slows down or breaks after someone adds a large or renamed column.',
      cause: '`*` expands to whatever columns exist right now, so the query silently changes when the table does, and it may fetch big columns you never use.',
      fix: 'Use `SELECT *` for exploring. In code, list the columns you need.' },
    { title: 'Double quotes around text values',
      symptom: '`ERROR: column "home" does not exist` from `SELECT name FROM products WHERE category = "home"`.',
      cause: 'Double quotes mean a **name** (a column or table). Text values use **single quotes**.',
      fix: "Write `'home'`. To put a quote inside text, double it: `'it''s'`.",
      sql: "SELECT name FROM products WHERE category = 'home';" },
    { title: 'The statement never runs',
      symptom: 'In `psql` you press Enter and the prompt changes from `postgres=#` to `postgres-#`, and nothing happens.',
      cause: 'A statement ends at the semicolon, not at the end of the line. `psql` is waiting for the rest.',
      fix: 'Type `;` and press Enter. Ending every statement with `;` also lets you put several in one script.' },
  ],
  pointers: [
    'Cluster → database → schema → table → row → column. A connection works in one database. New tables land in schema `public`.',
    '`SELECT columns FROM table;` Use `*` to explore and named columns in real code.',
    'Expressions in the select list compute new columns. Name them with `AS`, or they are called `?column?`.',
    'Rows have **no order** unless you ask for one with `ORDER BY`. `NULL` means unknown, not zero or empty.',
    '**Going deeper:** [What PostgreSQL is](/m1/what-is-postgres) follows one query from your client through the server and back.',
  ],
  sources: ['tutorial-concepts.html', 'tutorial-select.html', 'tutorial-arch.html', 'manage-ag-overview.html', 'ddl-schemas.html', 'queries-select-lists.html', 'sql-syntax-lexical.html', 'functions-info.html', 'infoschema-tables.html'],
}
