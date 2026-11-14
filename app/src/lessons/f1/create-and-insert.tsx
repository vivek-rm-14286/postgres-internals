import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { ResultTable, Sql, Stat, Val, type Cell } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: building the `customers` table statement by statement. CREATE TABLE draws the header with
 * type and constraint chips; INSERTs animate rows in and pulse the cells a DEFAULT filled; failing
 * INSERTs shake a red ghost row with the exact PostgreSQL 18 error (23502, 428C9, 42703) and still burn
 * an identity number, which is why id 4 never appears. All values and messages match a real run.
 * ---------------------------------------------------------------------------------------------- */

const COLS: { k: keyof Cust; type: string; chips: string[] }[] = [
  { k: 'id', type: 'bigint', chips: ['IDENTITY', 'PRIMARY KEY'] },
  { k: 'email', type: 'text', chips: ['NOT NULL'] },
  { k: 'name', type: 'text', chips: ['NOT NULL'] },
  { k: 'vip', type: 'boolean', chips: ['NOT NULL', 'DEFAULT false'] },
  { k: 'joined_on', type: 'date', chips: ['NOT NULL', 'DEFAULT current_date'] },
]

interface Cust { id: number; email: string; name: string | null; vip: boolean; joined_on: string }
const TODAY = 'today'
const c = (id: number, email: string, name: string, vip = false): Cust => ({ id, email, name, vip, joined_on: TODAY })

interface S {
  created: boolean
  rows: Cust[]
  /** Row ids added by this step (animate in). */
  fresh: number[]
  /** "id:col" cells filled by a DEFAULT or by IDENTITY in this step. */
  defaults: string[]
  ghost?: { row: Cust; bad: keyof Cust | null }
  error?: { code: string; msg: string; detail?: string }
  returning?: { fields: string[]; rows: Cell[][] }
  nextId: number
  burned: number[]
  sql: string
  tag: string
}

const A = c(1, 'ana@example.com', 'Ana')
const B = c(2, 'ben@example.com', 'Ben', true)
const C = c(3, 'chloe@example.com', 'Chloe')
const E = c(5, 'eve@example.com', 'Eve')
const O = c(6, "o.brien@example.com", "Seán O'Brien")

const STEPS: Step<S>[] = [
  { title: 'CREATE TABLE: columns, types, rules',
    body: 'A table is defined once with its columns. Each column has a **type** and optional **constraints**: rules every row must obey. The table starts empty.',
    state: { created: true, rows: [], fresh: [], defaults: [], nextId: 1, burned: [], tag: 'CREATE TABLE',
      sql: `CREATE TABLE customers (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email     text    NOT NULL,
  name      text    NOT NULL,
  vip       boolean NOT NULL DEFAULT false,
  joined_on date    NOT NULL DEFAULT current_date
);` } },
  { title: 'INSERT one row, get it back with RETURNING',
    body: 'You give only `email` and `name`. **IDENTITY** numbers the row (1), and the **DEFAULT**s fill `vip` and `joined_on` (orange). `RETURNING *` hands the finished row back.',
    state: { created: true, rows: [A], fresh: [1], defaults: ['1:id', '1:vip', '1:joined_on'], nextId: 2, burned: [], tag: 'INSERT 0 1',
      sql: `INSERT INTO customers (email, name)
VALUES ('ana@example.com', 'Ana')
RETURNING *;`,
      returning: { fields: ['id', 'email', 'name', 'vip', 'joined_on'], rows: [[1, 'ana@example.com', 'Ana', false, TODAY]] } } },
  { title: 'Many rows in one statement',
    body: 'One `VALUES` list can carry several rows. The keyword `DEFAULT` asks for the default explicitly. Both rows are added together, or neither is.',
    state: { created: true, rows: [A, B, C], fresh: [2, 3], defaults: ['2:id', '3:id', '3:vip', '2:joined_on', '3:joined_on'], nextId: 4, burned: [], tag: 'INSERT 0 2',
      sql: `INSERT INTO customers (email, name, vip)
VALUES ('ben@example.com',   'Ben',   true),
       ('chloe@example.com', 'Chloe', DEFAULT)
RETURNING id, name, vip;`,
      returning: { fields: ['id', 'name', 'vip'], rows: [[2, 'Ben', true], [3, 'Chloe', false]] } } },
  { title: 'NOT NULL says no',
    body: 'No `name` was given and it has no default, so it would be NULL. The row is **rejected**. The identity number 4 was already taken, and it is not given back.',
    state: { created: true, rows: [A, B, C], fresh: [], defaults: [], nextId: 5, burned: [4], tag: 'ERROR',
      ghost: { row: { id: 4, email: 'dev@example.com', name: null, vip: false, joined_on: TODAY }, bad: 'name' },
      error: { code: '23502', msg: 'null value in column "name" of relation "customers" violates not-null constraint', detail: 'Failing row contains (4, dev@example.com, null, f, …).' },
      sql: `INSERT INTO customers (email)
VALUES ('dev@example.com');` } },
  { title: 'GENERATED ALWAYS means hands off',
    body: 'The database owns the `id` column. Supplying your own value is an error. (Use `BY DEFAULT` instead of `ALWAYS` if you need to load existing ids.)',
    state: { created: true, rows: [A, B, C], fresh: [], defaults: [], nextId: 5, burned: [4], tag: 'ERROR',
      ghost: { row: { id: 1, email: 'eve@example.com', name: 'Eve', vip: false, joined_on: TODAY }, bad: 'id' },
      error: { code: '428C9', msg: 'cannot insert a non-DEFAULT value into column "id"', detail: 'Column "id" is an identity column defined as GENERATED ALWAYS.' },
      sql: `INSERT INTO customers (id, email, name)
VALUES (1, 'eve@example.com', 'Eve');` } },
  { title: 'Double quotes are for names, not text',
    body: '`"eve@example.com"` in double quotes is read as a **column name**, which does not exist. Text values always use single quotes.',
    state: { created: true, rows: [A, B, C], fresh: [], defaults: [], nextId: 5, burned: [4], tag: 'ERROR',
      ghost: { row: { id: 5, email: '"eve@example.com"', name: 'Eve', vip: false, joined_on: TODAY }, bad: 'email' },
      error: { code: '42703', msg: 'column "eve@example.com" does not exist' },
      sql: `INSERT INTO customers (email, name)
VALUES ("eve@example.com", 'Eve');` } },
  { title: 'Fixed: Eve gets id 5, not 4',
    body: 'With single quotes the insert works. Eve gets **5**, because 4 was used up by the failed insert. Identity values are unique, not gapless.',
    state: { created: true, rows: [A, B, C, E], fresh: [5], defaults: ['5:id', '5:vip', '5:joined_on'], nextId: 6, burned: [4], tag: 'INSERT 0 1',
      sql: `INSERT INTO customers (email, name)
VALUES ('eve@example.com', 'Eve')
RETURNING id;`, returning: { fields: ['id'], rows: [[5]] } } },
  { title: 'A quote inside text: double it',
    body: "Inside a single-quoted string, write `''` for one apostrophe. `'Seán O''Brien'` stores `Seán O'Brien`.",
    state: { created: true, rows: [A, B, C, E, O], fresh: [6], defaults: ['6:id', '6:vip', '6:joined_on'], nextId: 7, burned: [4], tag: 'INSERT 0 1',
      sql: `INSERT INTO customers (email, name)
VALUES ('o.brien@example.com', 'Seán O''Brien')
RETURNING id, name;`, returning: { fields: ['id', 'name'], rows: [[6, "Seán O'Brien"]] } } },
]

function Chip({ children, t }: { children: string; t: Tone }) {
  return <span className="inline-block rounded px-1 py-px font-mono text-[9.5px] font-semibold whitespace-nowrap" style={{ background: toneBg(t, 18), color: tone(t) }}>{children}</span>
}
const chipTone = (s: string): Tone => (s.startsWith('DEFAULT') ? 'new' : s === 'IDENTITY' ? 'new' : s === 'PRIMARY KEY' ? 'header' : 'pointer')

function TableView({ s }: { s: S }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
      <table className="w-full border-collapse font-mono text-[12px]">
        <thead>
          <tr className="border-b border-line align-top">
            {COLS.map((col) => (
              <th key={col.k} className="px-2 py-1.5 text-left">
                <span className="block font-semibold text-ink">{col.k}</span>
                <span className="block text-[10px] font-normal text-muted">{col.type}</span>
                <span className="mt-1 flex flex-wrap gap-0.5">{col.chips.map((ch) => <Chip key={ch} t={chipTone(ch)}>{ch}</Chip>)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {s.rows.map((r) => {
              const fresh = s.fresh.includes(r.id)
              return (
                <motion.tr key={r.id} layout initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 24 }} className="border-b border-line last:border-0"
                  style={{ boxShadow: fresh ? `inset 3px 0 0 ${tone('ok')}` : 'inset 0 0 0 transparent' }}>
                  {COLS.map((col) => {
                    const def = s.defaults.includes(`${r.id}:${col.k}`)
                    return (
                      <motion.td key={col.k} className="px-2 py-1 whitespace-nowrap"
                        animate={{ backgroundColor: def ? toneBg('new', 22) : fresh ? toneBg('ok', 10) : 'rgba(0,0,0,0)' }} transition={{ duration: 0.4 }}>
                        {r[col.k] === TODAY ? <span className="text-muted italic">today</span> : <Val v={r[col.k] as Cell} />}
                      </motion.td>
                    )
                  })}
                </motion.tr>
              )
            })}
            {s.ghost && (
              <motion.tr key={`ghost-${s.ghost.bad}`} initial={{ opacity: 0, x: 0 }} animate={{ opacity: [0, 1, 1, 0.55], x: [0, -6, 6, -4, 4, 0] }}
                transition={{ duration: 0.7 }} exit={{ opacity: 0 }} style={{ background: toneBg('dead', 12), boxShadow: `inset 3px 0 0 ${tone('dead')}` }}>
                {COLS.map((col) => {
                  const v = s.ghost!.row[col.k]
                  const bad = s.ghost!.bad === col.k
                  return (
                    <td key={col.k} className="px-2 py-1 whitespace-nowrap line-through decoration-1" style={bad ? { color: tone('dead'), fontWeight: 700, textDecoration: 'none', outline: `1.5px solid ${tone('dead')}`, outlineOffset: -2 } : undefined}>
                      {v === TODAY ? <span className="text-muted italic">today</span> : <Val v={v as Cell} />}
                    </td>
                  )
                })}
              </motion.tr>
            )}
          </AnimatePresence>
          {s.rows.length === 0 && !s.ghost && <tr><td colSpan={COLS.length} className="px-2 py-2 text-muted italic">(0 rows)</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function IdCounter({ s }: { s: S }) {
  const used = Array.from({ length: s.nextId - 1 }, (_, i) => i + 1)
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted">identity numbers handed out:</span>
      <AnimatePresence initial={false}>
        {used.map((n) => {
          const burned = s.burned.includes(n)
          return (
            <motion.span key={n} layout initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex size-6 items-center justify-center rounded-full font-mono text-[11px] font-bold ${burned ? 'line-through' : ''}`}
              style={{ background: toneBg(burned ? 'dead' : 'ok', 22), color: tone(burned ? 'dead' : 'ok') }}
              title={burned ? 'taken by a failed insert, never reused' : 'used by a row'}>{n}</motion.span>
          )
        })}
      </AnimatePresence>
      <span className="ml-1 font-mono text-muted">next: {s.nextId}</span>
    </div>
  )
}

function CreateInsertViz() {
  return (
    <Stepper steps={STEPS} interval={3400} render={(s) => (
      <div className="grid gap-3">
        <Legend items={[['ok', 'row just inserted'], ['new', 'filled by DEFAULT or IDENTITY'], ['dead', 'rejected row'], ['pointer', 'NOT NULL rule'], ['header', 'primary key']]} />
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <Sql>{s.sql}</Sql>
          <div className="grid content-start gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="rows in table" value={s.rows.length} />
              <Stat label="command tag" value={s.tag} t={s.error ? 'dead' : 'ok'} />
            </div>
            <IdCounter s={s} />
          </div>
        </div>
        <TableView s={s} />
        <AnimatePresence mode="wait">
          {s.error ? (
            <motion.div key={s.error.code} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-lg border px-3 py-2 font-mono text-[12px]" style={{ borderColor: tone('dead'), background: toneBg('dead', 10) }}>
              <p><span className="font-bold" style={{ color: tone('dead') }}>ERROR:</span> {s.error.msg}</p>
              {s.error.detail && <p className="text-muted">DETAIL: {s.error.detail}</p>}
              <p className="mt-1"><Tag t="dead">SQLSTATE {s.error.code}</Tag></p>
            </motion.div>
          ) : s.returning ? (
            <motion.div key={`ret-${s.nextId}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ResultTable caption="RETURNING" fields={s.returning.fields}
                rows={s.returning.rows.map((r, i) => ({ key: String(i), t: 'ok', cells: r }))} />
            </motion.div>
          ) : (
            <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted">
              <Md>Nothing returned yet. `CREATE TABLE` only reports its tag.</Md>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'create-and-insert',
  module: 'f1',
  order: 2,
  title: 'Creating tables and inserting rows',
  tldr: [
    '`CREATE TABLE` defines a table once (its columns, their types and the rules each row must obey), and `INSERT` adds rows that PostgreSQL checks against those rules.',
    'Types and constraints such as `NOT NULL`, `PRIMARY KEY` and `DEFAULT` let the database itself reject bad data, so every program that writes to it gets the same protection.',
  ],
  visualizer: {
    title: 'Build a table, one statement at a time',
    caption: 'Step through CREATE TABLE and six INSERTs. Watch defaults fill in, bad rows bounce off the constraints, and the identity counter skip a number.',
    Component: CreateInsertViz,
  },
  playground: {
    setup: `-- A tiny helper so the error presets show the message instead of stopping.
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;
CREATE TABLE signups (email text, name text, source text);
INSERT INTO signups VALUES
  ('gus@example.com', 'Gus', 'ads'), ('hana@example.com', 'Hana', 'friend'), ('ivo@example.com', 'Ivo', 'ads');`,
    presets: [
      { label: 'Create the table', sql: `CREATE TABLE customers (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email     text    NOT NULL,
  name      text    NOT NULL,
  vip       boolean NOT NULL DEFAULT false,
  credit    numeric(10,2) NOT NULL DEFAULT 0,
  joined_on date    NOT NULL DEFAULT current_date,
  joined_at timestamptz NOT NULL DEFAULT now()
);

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;`,
        note: 'The second query reads the table definition back. `id` shows no default: identity columns are generated, not defaulted.' },
      { label: 'Insert one, RETURNING', sql: `INSERT INTO customers (email, name)
VALUES ('ana@example.com', 'Ana')
RETURNING id, vip, credit, joined_on;`,
        note: 'You sent two values; the row came back complete. `id` = 1, `vip` = false, `credit` = 0.00, and today\'s date.' },
      { label: 'Many rows, DEFAULT keyword', sql: `INSERT INTO customers (email, name, vip, credit)
VALUES ('ben@example.com',   'Ben',   true,    25.50),
       ('chloe@example.com', 'Chloe', DEFAULT, DEFAULT)
RETURNING id, name, vip, credit;`,
        note: 'One statement, two rows, ids 2 and 3. `DEFAULT` inside VALUES asks for the column default.' },
      { label: 'Rules that reject rows', sql: `SELECT try_sql($$ INSERT INTO customers (email) VALUES ('dev@example.com') $$) AS missing_name;
SELECT try_sql($$ INSERT INTO customers (id, email, name) VALUES (1, 'x@example.com', 'X') $$) AS own_id;
SELECT try_sql($$ INSERT INTO customers (email, name, vip) VALUES ('fay@example.com', 'Fay', 'maybe') $$) AS bad_boolean;
SELECT try_sql($$ INSERT INTO customers (email, name) VALUES ("eve@example.com", 'Eve') $$) AS double_quotes;

INSERT INTO customers (email, name) VALUES ('eve@example.com', 'Eve')
RETURNING id;`,
        note: 'Four different errors: **23502** NOT NULL, **428C9** identity, **22P02** bad input for a boolean, **42703** unknown column. Eve then gets id **5**: the first failed insert used up 4.' },
      { label: 'INSERT … SELECT', sql: `INSERT INTO customers (email, name, vip)
SELECT email, name, source = 'friend'
FROM signups
RETURNING id, name, vip;

SELECT id, name, vip, credit FROM customers ORDER BY id;`,
        note: 'Rows can come from a query instead of VALUES. `source = \'friend\'` is a true/false expression, so Hana becomes a VIP.' },
      { label: 'Quotes and names', sql: `SELECT 'it''s' AS apostrophe, 'Seán O''Brien' AS name;

CREATE TABLE "Orders" (id int);
SELECT try_sql('SELECT * FROM Orders')   AS unquoted;
SELECT try_sql('SELECT * FROM "Orders"') AS quoted;
DROP TABLE "Orders";`,
        note: 'Unquoted names are folded to lower case, so `Orders` means `orders` and is not found (**42P01**). Only `"Orders"` with quotes finds it. Stick to lower-case names.' },
      { label: 'Drop a table', sql: `CREATE TABLE scratch (n int);
INSERT INTO scratch VALUES (1), (2);
DROP TABLE scratch;
DROP TABLE IF EXISTS scratch;
SELECT try_sql('SELECT * FROM scratch') AS after_drop;`,
        note: '`DROP TABLE` removes the definition **and** all its rows at once. `IF EXISTS` turns "not found" into a notice instead of an error.' },
    ],
  },
  production: {
    title: 'Sign-up in one round trip',
    context: 'A web app inserts a customer at sign-up and then needs the new id to create a welcome coupon and a session.',
    problem: 'The first version inserted the row, then ran `SELECT max(id) FROM customers` to find it. Under load two sign-ups interleaved and one user got the other\'s id, so the coupon went to the wrong account.',
    solution: 'Let the database generate the id and send it back from the same statement with `RETURNING`. No second query, no guessing. (`$1` and `$2` are placeholders: the application sends the email and name separately from the SQL text, so user input can never change the statement.)',
    sql: `INSERT INTO customers (email, name)
VALUES ($1, $2)
RETURNING id, joined_at;`,
    outcome: 'Each sign-up costs one statement instead of two, and the id returned is always the row that statement inserted, however many sign-ups run at once.',
  },
  pitfalls: [
    { title: 'Expecting ids without gaps',
      symptom: 'Ids go 1, 2, 3, 5, and someone files a bug about the missing 4.',
      cause: 'An identity number is taken before the row is checked. A failed or rolled-back insert does not give it back.',
      fix: 'Treat ids as unique labels, not counters. If you need a gapless sequence (invoice numbers), build it separately; to count rows, use `count(*)`.' },
    { title: 'Typing ids by hand into an identity column',
      symptom: '`ERROR: cannot insert a non-DEFAULT value into column "id"` while loading old data.',
      cause: '`GENERATED ALWAYS` refuses user-supplied values.',
      fix: 'For a one-off load, write `OVERRIDING SYSTEM VALUE` after the column list, then move the counter past the highest id. Otherwise omit the column.',
      sql: `INSERT INTO customers (id, email, name) OVERRIDING SYSTEM VALUE
VALUES (100, 'old@example.com', 'Old');
SELECT setval(pg_get_serial_sequence('customers', 'id'), (SELECT max(id) FROM customers));` },
    { title: 'Money in a float column',
      symptom: 'A balance shows `0.30000000000000004` or totals drift by a cent.',
      cause: '`real` and `double precision` store binary approximations. Many decimal fractions cannot be stored exactly.',
      fix: 'Use `numeric(12,2)` (exact) for money and anything that must add up to the cent.',
      sql: 'SELECT 0.1::float8 + 0.2::float8 AS float_sum, 0.1::numeric + 0.2::numeric AS numeric_sum;' },
    { title: 'Mixed-case table names',
      symptom: '`relation "orders" does not exist`, although you can see `Orders` in a GUI tool.',
      cause: 'The table was created as `"Orders"` with quotes, which keeps the capital. Every query must then quote it the same way.',
      fix: 'Use lower-case names with underscores (`order_items`). If one exists already, rename it: `ALTER TABLE "Orders" RENAME TO orders;`.' },
  ],
  pointers: [
    '`CREATE TABLE t (col type constraints, …)`. Everyday types: `int`/`bigint`, `text`, `numeric(p,s)`, `boolean`, `date`, `timestamptz`.',
    '`PRIMARY KEY` = unique + not null. `NOT NULL` forbids missing values. `DEFAULT` fills omitted columns.',
    '`bigint GENERATED ALWAYS AS IDENTITY` numbers rows for you; numbers are unique but can have **gaps**.',
    "`'single quotes'` are values, `\"double quotes\"` are names. `RETURNING` sends the inserted row back.",
    '**Going deeper:** [Primitive types, alignment and padding](/m2/primitive-types) shows how each type is laid out in bytes on disk.',
  ],
  sources: ['ddl-basics.html', 'ddl-constraints.html', 'ddl-default.html', 'ddl-identity-columns.html', 'sql-createtable.html', 'dml-insert.html', 'dml-returning.html', 'sql-insert.html', 'sql-droptable.html', 'sql-syntax-lexical.html', 'datatype-numeric.html', 'functions-sequence.html'],
}
