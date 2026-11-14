import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { PRODUCTS, PRODUCTS_SQL, Sql, Stat, money } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the safe-change routine (preview SELECT → BEGIN → UPDATE/DELETE … RETURNING → check →
 * COMMIT or ROLLBACK), in three scenarios: a correct price change, the forgotten WHERE caught by ROLLBACK
 * (and the same mistake under autocommit), and DELETE vs TRUNCATE. Values are what PostgreSQL 18 returns
 * for round(price * 1.10, 2). PGlite has a single session, so "everyone else" is a faithful simulation of
 * what a second connection would see under the default READ COMMITTED level.
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'update' | 'oops' | 'delete'
type Tx = 'idle' | 'open' | 'committed' | 'rolled back' | 'autocommit'

interface R { id: number; name: string; category: string; price: number; next?: number; gone?: 'pending' | 'done' }
interface S {
  rows: R[]
  hi: number[]
  /** Ids whose values just sprang back (ROLLBACK). */
  restored?: number[]
  tx: Tx
  sql: string
  tag: string
  /** Rows a second connection would see changed right now. */
  othersSeeNew: boolean
  alarm?: string
}

const raise = (p: number) => Math.round(p * 110) / 100
const base = (): R[] => PRODUCTS.map((p) => ({ id: p.id, name: p.name, category: p.category, price: p.price }))
const KITCHEN = PRODUCTS.filter((p) => p.category === 'kitchen').map((p) => p.id)
const ALL = PRODUCTS.map((p) => p.id)
const withNext = (ids: number[]) => base().map((r) => (ids.includes(r.id) ? { ...r, next: raise(r.price) } : r))
const committed = (ids: number[]) => base().map((r) => (ids.includes(r.id) ? { ...r, price: raise(r.price) } : r))

const UPD = `UPDATE products
SET price = round(price * 1.10, 2)
WHERE category = 'kitchen'
RETURNING id, name, price;`
const UPD_OOPS = `UPDATE products
SET price = round(price * 1.10, 2)
-- WHERE category = 'kitchen'   (forgotten)
RETURNING id, name, price;`

const SCENARIOS: Record<Mode, Step<S>[]> = {
  update: [
    { title: 'Preview with SELECT', body: 'Write the WHERE first, inside a harmless `SELECT`. The rows it returns are exactly the rows an UPDATE with the same WHERE will change: **3 rows**.',
      state: { rows: base(), hi: KITCHEN, tx: 'idle', tag: 'SELECT 3', othersSeeNew: false, sql: "SELECT id, name, price\nFROM products\nWHERE category = 'kitchen';" } },
    { title: 'BEGIN a transaction', body: '`BEGIN` opens a **transaction**: nothing you change becomes permanent, or visible to anyone else, until you say `COMMIT`.',
      state: { rows: base(), hi: KITCHEN, tx: 'open', tag: 'BEGIN', othersSeeNew: false, sql: 'BEGIN;' } },
    { title: 'UPDATE … RETURNING', body: 'The UPDATE changes the 3 kitchen prices. `SET price = price * 1.10` reads the **old** value of each row. `RETURNING` shows the new values right away.',
      state: { rows: withNext(KITCHEN), hi: KITCHEN, tx: 'open', tag: 'UPDATE 3', othersSeeNew: false, sql: UPD } },
    { title: 'Check before you commit', body: 'The tag says `UPDATE 3`, the preview said 3. The new prices look right. Other connections still see the **old** prices.',
      state: { rows: withNext(KITCHEN), hi: KITCHEN, tx: 'open', tag: 'UPDATE 3', othersSeeNew: false, sql: "SELECT name, price\nFROM products\nWHERE category = 'kitchen';" } },
    { title: 'COMMIT: make it permanent', body: '`COMMIT` makes all changes in the transaction permanent at once. From now on every connection sees the new prices.',
      state: { rows: committed(KITCHEN), hi: KITCHEN, tx: 'committed', tag: 'COMMIT', othersSeeNew: true, sql: 'COMMIT;' } },
  ],
  oops: [
    { title: 'BEGIN first', body: 'Same task, same safety net: open a transaction before changing anything.',
      state: { rows: base(), hi: [], tx: 'open', tag: 'BEGIN', othersSeeNew: false, sql: 'BEGIN;' } },
    { title: 'The WHERE is missing', body: 'Without `WHERE`, UPDATE changes **every row** in the table. Nothing warns you. The tag reads `UPDATE 9`.',
      state: { rows: withNext(ALL), hi: ALL, tx: 'open', tag: 'UPDATE 9', othersSeeNew: false, sql: UPD_OOPS, alarm: 'UPDATE 9, but only 3 kitchen products should change.' } },
    { title: 'The check catches it', body: 'You expected 3 rows and got 9. Because the transaction is still open, no one else has seen the wrong prices.',
      state: { rows: withNext(ALL), hi: ALL, tx: 'open', tag: 'UPDATE 9', othersSeeNew: false, sql: "-- compare the tags:\n--   preview SELECT   → SELECT 3\n--   this UPDATE      → UPDATE 9\n-- RETURNING listed every product.", alarm: 'Expected 3, got 9. Do not commit.' } },
    { title: 'ROLLBACK: undo everything', body: '`ROLLBACK` throws away every change since `BEGIN`. All 9 prices spring back. The table is exactly as it was.',
      state: { rows: base(), hi: [], restored: ALL, tx: 'rolled back', tag: 'ROLLBACK', othersSeeNew: false, sql: 'ROLLBACK;' } },
    { title: 'Without BEGIN there is no undo', body: 'Outside a transaction block each statement **commits on its own** (autocommit). The same mistake is permanent the moment it finishes. Only a reverse UPDATE or a backup can fix it.',
      state: { rows: committed(ALL), hi: ALL, tx: 'autocommit', tag: 'UPDATE 9', othersSeeNew: true, sql: UPD_OOPS, alarm: 'Committed instantly. ROLLBACK now says: there is no transaction in progress.' } },
  ],
  delete: [
    { title: 'Preview what DELETE will remove', body: 'Find the rows first: products with zero stock. One row, Chef knife.',
      state: { rows: base(), hi: [3], tx: 'idle', tag: 'SELECT 1', othersSeeNew: false, sql: 'SELECT id, name\nFROM products\nWHERE stock = 0;' } },
    { title: 'BEGIN; DELETE … RETURNING', body: '`DELETE` removes the rows that match WHERE and `RETURNING` lists them. The row is gone for you, but still visible to others until COMMIT.',
      state: { rows: base().map((r) => (r.id === 3 ? { ...r, gone: 'pending' } : r)), hi: [3], tx: 'open', tag: 'DELETE 1', othersSeeNew: false, sql: 'BEGIN;\nDELETE FROM products\nWHERE stock = 0\nRETURNING id, name;' } },
    { title: 'COMMIT', body: 'Now the row is gone for everyone. Without WHERE, `DELETE FROM products;` would have removed all 9.',
      state: { rows: base().filter((r) => r.id !== 3), hi: [], tx: 'committed', tag: 'COMMIT', othersSeeNew: true, sql: 'COMMIT;' } },
    { title: 'TRUNCATE empties the whole table', body: '`TRUNCATE` removes **all** rows at once without scanning them, and frees the space immediately. It locks the table against all other use and runs no `ON DELETE` triggers.',
      state: { rows: base().filter((r) => r.id !== 3).map((r) => ({ ...r, gone: 'pending' })), hi: [], tx: 'open', tag: 'TRUNCATE TABLE', othersSeeNew: false, sql: 'BEGIN;\nTRUNCATE products;' } },
    { title: 'TRUNCATE can be rolled back too', body: 'Inside a transaction, `ROLLBACK` brings all 8 rows back. Outside one, TRUNCATE is final the moment it finishes.',
      state: { rows: base().filter((r) => r.id !== 3), hi: [], restored: ALL, tx: 'rolled back', tag: 'ROLLBACK', othersSeeNew: false, sql: 'ROLLBACK;' } },
  ],
}

const TX_TONE: Record<Tx, Tone> = { idle: 'muted', open: 'new', committed: 'ok', 'rolled back': 'pointer', autocommit: 'dead' }

function TxBadge({ tx }: { tx: Tx }) {
  const label = tx === 'idle' ? 'no transaction' : tx === 'open' ? 'in transaction: changes are private' : tx === 'committed' ? 'committed' : tx === 'rolled back' ? 'rolled back' : 'autocommit: already committed'
  return (
    <motion.span key={tx} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11.5px] font-semibold"
      style={{ borderColor: tone(TX_TONE[tx]), background: toneBg(TX_TONE[tx], 14), color: tx === 'idle' ? 'var(--muted)' : 'var(--text)' }}>
      <span className="size-2 rounded-full" style={{ background: tone(TX_TONE[tx]) }} />{label}
    </motion.span>
  )
}

function Rows({ s }: { s: S }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
      <div className="grid min-w-[330px] grid-cols-[2rem_1fr_4.5rem_7.5rem] gap-x-2 border-b border-line px-2 py-1 font-mono text-[11px] font-semibold text-muted">
        <span>id</span><span>name</span><span>category</span><span className="text-right">price</span>
      </div>
      <AnimatePresence initial={false}>
        {s.rows.map((r) => {
          const pending = r.next !== undefined
          const rest = s.restored?.includes(r.id)
          const t: Tone | null = r.gone ? 'dead' : pending ? 'new' : s.tx === 'committed' && s.hi.includes(r.id) ? 'ok'
            : s.tx === 'autocommit' && s.hi.includes(r.id) ? 'dead' : rest ? 'pointer' : s.hi.includes(r.id) ? 'tuple' : null
          return (
            <motion.div key={r.id} layout exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 26 }}
              className="grid min-w-[330px] grid-cols-[2rem_1fr_4.5rem_7.5rem] items-center gap-x-2 border-b border-line px-2 py-1 font-mono text-[12px] last:border-0"
              animate={{ opacity: r.gone ? 0.45 : 1 }}
              style={{ background: t ? toneBg(t, 12) : 'transparent', boxShadow: t ? `inset 3px 0 0 ${tone(t)}` : undefined }}>
              <span>{r.id}</span>
              <span className={r.gone ? 'line-through' : ''}>{r.name}</span>
              <span className="text-muted">{r.category}</span>
              <span className="text-right">
                {pending ? (
                  <><span className="text-muted line-through">{money(r.price)}</span>{' '}
                    <motion.b initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ color: tone('new') }}>{money(r.next!)}</motion.b></>
                ) : (
                  <motion.span key={`${r.price}-${rest}`} initial={rest ? { y: -8, opacity: 0 } : false} animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 14 }} style={{ fontWeight: t === 'ok' || t === 'dead' ? 700 : 400 }}>{money(r.price)}</motion.span>
                )}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
      {s.rows.length === 0 && <p className="px-2 py-2 font-mono text-[12px] text-muted italic">(0 rows)</p>}
    </div>
  )
}

function Others({ s, mode }: { s: S; mode: Mode }) {
  const changed = mode === 'delete'
    ? (s.tx === 'open' ? 'every row as last committed' : `${s.rows.filter((r) => !r.gone).length} rows`)
    : s.othersSeeNew ? 'the new prices' : 'the old prices'
  return (
    <Panel title="what every other connection sees">
      <p className="text-[12.5px]">
        <motion.span key={changed} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold" style={{ color: tone(s.othersSeeNew ? 'ok' : 'muted') }}>{changed}</motion.span>
        {s.tx === 'open' && <span className="text-muted">: your uncommitted changes are invisible to them.</span>}
        {s.tx === 'committed' && <span className="text-muted">: the commit published everything at once.</span>}
        {s.tx === 'rolled back' && <span className="text-muted">: they never saw the change.</span>}
        {s.tx === 'autocommit' && <span className="text-muted">: the mistake is already live.</span>}
      </p>
    </Panel>
  )
}

function SafeChangeViz() {
  const [mode, setMode] = useState<Mode>('update')
  const steps = useMemo(() => SCENARIOS[mode], [mode])
  return (
    <div className="grid gap-3">
      <Segmented label="scenario" value={mode} onChange={setMode} options={[['update', 'Safe UPDATE'], ['oops', 'Forgotten WHERE'], ['delete', 'DELETE and TRUNCATE']]} />
      <Stepper key={mode} steps={steps} interval={3200} render={(s) => (
        <div className="grid gap-3">
          <Legend items={[['tuple', 'matched by WHERE'], ['new', 'changed, not committed'], ['ok', 'committed'], ['dead', 'deleted, or a permanent mistake'], ['pointer', 'restored by ROLLBACK']]} />
          <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid content-start gap-2">
              <TxBadge tx={s.tx} />
              <Sql>{s.sql}</Sql>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="command tag" value={s.tag} t={s.alarm ? 'dead' : undefined} />
                <Stat label="rows in table" value={s.rows.filter((r) => !r.gone).length} />
              </div>
              <AnimatePresence>
                {s.alarm && (
                  <motion.p key={s.alarm} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="rounded-lg border px-3 py-2 text-[12.5px] font-semibold" style={{ borderColor: tone('dead'), background: toneBg('dead', 12), color: tone('dead') }}>{s.alarm}</motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="grid content-start gap-2">
              <Rows s={s} />
              <Others s={s} mode={mode} />
            </div>
          </div>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'change-data-safely',
  module: 'f1',
  order: 5,
  title: 'Updating and deleting safely',
  tldr: [
    '`UPDATE` changes and `DELETE` removes every row its `WHERE` matches, and a transaction (`BEGIN` … `COMMIT` or `ROLLBACK`) lets you look at the result before it becomes permanent.',
    'A single missing `WHERE` changes the whole table with no warning, so a habit of preview, transaction, check and only then commit is the cheapest insurance you will ever buy.',
  ],
  visualizer: {
    title: 'The safe-change routine',
    caption: 'Pick a scenario and step through it. Compare the safe UPDATE with the forgotten WHERE, and watch ROLLBACK put every value back.',
    Component: SafeChangeViz,
  },
  playground: {
    setup: `${PRODUCTS_SQL}
-- A tiny helper so the error presets show the message instead of stopping.
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: '1. Preview', sql: `SELECT id, name, price, round(price * 1.10, 2) AS new_price
FROM products
WHERE category = 'kitchen';`,
        note: 'Three rows, and the prices they would get. Nothing has changed yet.' },
      { label: '2. Try it, then ROLLBACK', sql: `BEGIN;

UPDATE products
SET price = round(price * 1.10, 2)
WHERE category = 'kitchen'
RETURNING id, name, price;

ROLLBACK;

SELECT name, price FROM products WHERE category = 'kitchen';`,
        note: 'RETURNING shows 10.45, 49.50 and 19.80. After ROLLBACK the last query shows the original 9.50, 45.00 and 18.00 again.' },
      { label: '3. Do it, then COMMIT', sql: `BEGIN;

UPDATE products
SET price = round(price * 1.10, 2)
WHERE category = 'kitchen'
RETURNING id, name, price;

COMMIT;

SELECT name, price FROM products ORDER BY id;`,
        note: 'Same UPDATE, now committed: the three kitchen prices stay raised. Every other row is untouched.' },
      { label: '4. The forgotten WHERE', sql: `BEGIN;

UPDATE products
SET price = 0
RETURNING id, name, price;

SELECT count(*) AS free_products FROM products WHERE price = 0;

ROLLBACK;

SELECT count(*) AS free_products FROM products WHERE price = 0;`,
        note: '`UPDATE` with no WHERE hits all **9** rows. Inside the transaction 9 products cost 0; after ROLLBACK, 0 do.' },
      { label: '5. DELETE … RETURNING', sql: `SELECT id, name FROM products WHERE stock = 0;

BEGIN;
DELETE FROM products
WHERE stock = 0
RETURNING id, name;
COMMIT;

SELECT count(*) AS products_left FROM products;`,
        note: 'Preview finds Chef knife; DELETE removes exactly that row and lists it. 8 products remain.' },
      { label: '6. An error aborts the transaction', sql: `BEGIN;
UPDATE products SET stock = stock + 1 WHERE id = 1;
SELECT try_sql('SELECT 1 / 0') AS failed_statement;
SELECT try_sql('SELECT 1') AS after_error;
ROLLBACK;`,
        note: 'Here the helper catches the error, so the transaction survives. In psql, after a real error every later statement fails with **25P02** ("current transaction is aborted") until you run ROLLBACK.' },
      { label: '7. TRUNCATE inside a transaction', sql: `BEGIN;
TRUNCATE products;
SELECT count(*) AS during FROM products;
ROLLBACK;

SELECT count(*) AS after_rollback FROM products;`,
        note: 'TRUNCATE empties the table in one step (0 rows), and ROLLBACK brings every row back. Outside a transaction it would be final.' },
    ],
  },
  production: {
    title: 'Fixing a mispriced category in production',
    context: 'A support engineer learns that every kitchen product was imported 10% too cheap and must fix the prices on the live database while customers are shopping.',
    problem: 'A plain `UPDATE` typed into a console commits the moment it finishes. A typo in the WHERE, or no WHERE at all, would reprice the whole store instantly and customers would see it.',
    solution: 'Preview the rows, change them inside a transaction, compare the row count with the preview, and only then commit. Setting a short lock timeout makes the change give up, instead of queueing, if another transaction is holding locks on those rows.',
    sql: `SELECT count(*) FROM products WHERE category = 'kitchen';  -- 3

BEGIN;
SET LOCAL lock_timeout = '2s';
UPDATE products
SET price = round(price * 1.10, 2)
WHERE category = 'kitchen'
RETURNING id, name, price;                                   -- UPDATE 3
-- the count matches the preview: commit. Anything else: ROLLBACK;
COMMIT;`,
    outcome: 'The change is checked before anyone sees it: 3 rows previewed, 3 rows updated, then one commit makes all 3 visible together. A mistake costs one `ROLLBACK`, not a restore from backup.',
  },
  pitfalls: [
    { title: 'UPDATE or DELETE without WHERE',
      symptom: 'The tag says `UPDATE 48213` when you meant to change one row.',
      cause: 'WHERE is optional. Without it the statement applies to every row, and in autocommit mode it is committed immediately.',
      fix: 'Write the WHERE first and test it in a SELECT. Run changes inside `BEGIN` and compare the tag with the preview before `COMMIT`. In psql, `\\set AUTOCOMMIT off` makes psql issue `BEGIN` for you, so nothing is saved until you `COMMIT`.' },
    { title: 'A transaction left open',
      symptom: 'Other sessions hang when they try to change the rows you changed, and your changes are not visible to anyone.',
      cause: 'After `BEGIN`, changes stay private and the changed rows stay locked until `COMMIT` or `ROLLBACK`. Closing a tool window may not end the transaction.',
      fix: 'Always finish with COMMIT or ROLLBACK. Set `idle_in_transaction_session_timeout` so a forgotten session is ended automatically.',
      sql: "SET idle_in_transaction_session_timeout = '5min';" },
    { title: 'current transaction is aborted',
      symptom: '`ERROR: current transaction is aborted, commands ignored until end of transaction block` on every statement.',
      cause: 'Any error inside a transaction marks it failed. PostgreSQL refuses all further work in it so you cannot commit half a change.',
      fix: 'Run `ROLLBACK;` and start again. (A `SAVEPOINT` lets you undo just part of a transaction.)' },
    { title: 'TRUNCATE where DELETE was needed',
      symptom: 'An app freezes while a cleanup job runs, or an audit trigger never fired.',
      cause: '`TRUNCATE` takes the strongest table lock (even reads wait), runs no `ON DELETE` triggers, and cannot take a WHERE.',
      fix: 'Use `DELETE … WHERE` to remove some rows or when triggers must run. Use `TRUNCATE` (with `RESTART IDENTITY` to reset ids) only to empty a table nobody is using.' },
  ],
  pointers: [
    '`UPDATE t SET col = expr WHERE …` and `DELETE FROM t WHERE …`. No WHERE means **every row**.',
    'Preview with a `SELECT` using the same WHERE. The number of rows it returns is the number the change will touch.',
    '`BEGIN` → change → check the tag and `RETURNING` → `COMMIT` or `ROLLBACK`. Outside BEGIN, each statement commits by itself.',
    '`TRUNCATE` empties a table fast and frees space at once, but locks it completely and skips DELETE triggers.',
    '**Going deeper:** [ACID and transactions](/m5/acid-transactions) explains how COMMIT and ROLLBACK work; [INSERT, UPDATE, DELETE, MERGE](/m3/dml-lifecycle) shows what UPDATE does to the stored rows.',
  ],
  sources: ['dml-update.html', 'dml-delete.html', 'dml-returning.html', 'sql-update.html', 'sql-delete.html', 'tutorial-transactions.html', 'sql-begin.html', 'sql-commit.html', 'sql-rollback.html', 'sql-truncate.html', 'runtime-config-client.html', 'app-psql.html'],
}
