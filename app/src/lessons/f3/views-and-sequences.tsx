import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, OutcomeBox, TableCard, TRY_FN, type Outcome } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer, two labs.
 * 1. Sequences: every nextval() hands out a ticket that is never taken back, so rollbacks and failed
 *    inserts leave gaps. Compare `serial` (a plain default you can bypass) with GENERATED ALWAYS.
 * 2. Views: a view is a saved query, a live window onto its table. Writes through it land in the
 *    table; WITH CHECK OPTION refuses rows the window could not show. A materialized view is a
 *    stored copy that goes stale until REFRESH.
 * Error texts and SQLSTATEs are the ones PostgreSQL 18 returns for the same statements.
 * ---------------------------------------------------------------------------------------------- */

type IdMode = 'identity' | 'serial'
interface Ticket { n: number; state: 'used' | 'lost' | 'manual' }
interface ORow { id: number; item: string; qty: number }

const ITEMS = ['coffee', 'bagel', 'tea', 'muffin', 'juice', 'scone', 'water', 'cookie', 'soup', 'salad']

function SequenceLab() {
  const [mode, setMode] = useState<IdMode>('identity')
  const [last, setLast] = useState(0)
  const [rows, setRows] = useState<ORow[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ghost, setGhost] = useState<ORow | null>(null)
  const [out, setOut] = useState<{ o: Outcome; sql: string; n: number } | null>(null)
  const say = (o: Outcome, sql: string) => setOut({ o, sql, n: (out?.n ?? 0) + 1 })
  const item = () => ITEMS[(rows.length + tickets.length) % ITEMS.length]
  const reset = (m: IdMode = mode) => { setMode(m); setLast(0); setRows([]); setTickets([]); setGhost(null); setOut(null) }
  const pk = 'orders_pkey'

  /** nextval(): the counter moves first, whatever happens to the row afterwards. */
  const draw = (fate: 'used' | 'lost') => { const n = last + 1; setLast(n); setTickets((t) => [...t, { n, state: fate }]); return n }

  const insert = () => {
    const name = item(), n = last + 1
    if (rows.some((r) => r.id === n)) {
      draw('lost')
      return say({ ok: false, code: '23505', title: `ERROR: duplicate key value violates unique constraint "${pk}"`, detail: `DETAIL: Key (id)=(${n}) already exists. The sequence handed out **${n}**, but a manual insert already took it. Run the INSERT again: the next value is free.` }, `INSERT INTO orders (item, qty) VALUES ('${name}', 1) RETURNING id;`)
    }
    draw('used'); setRows((r) => [...r, { id: n, item: name, qty: 1 }])
    say({ ok: true, title: `INSERT 0 1  →  id = ${n}`, detail: '`RETURNING id` hands the generated value straight back to the application.' }, `INSERT INTO orders (item, qty) VALUES ('${name}', 1) RETURNING id;`)
  }
  const rollback = () => {
    const name = item(), n = draw('lost')
    setGhost({ id: n, item: name, qty: 1 }); setTimeout(() => setGhost(null), 1100)
    say({ ok: true, title: `ROLLBACK  (id ${n} is gone for good)`, detail: 'The row disappears, but **nextval is never rolled back**. Other sessions may already have taken later numbers, so handing it back is impossible.' }, `BEGIN; INSERT INTO orders (item, qty) VALUES ('${name}', 1); ROLLBACK;`)
  }
  const failed = () => {
    const name = item(), n = draw('lost')
    say({ ok: false, code: '23514', title: 'ERROR: new row for relation "orders" violates check constraint "orders_qty_check"', detail: `DETAIL: Failing row contains (${n}, ${name}, 0). The id was drawn while defaults were filled in, before the CHECK ran.` }, `INSERT INTO orders (item, qty) VALUES ('${name}', 0);`)
  }
  const manual = () => {
    const n = last + 1, sql = `INSERT INTO orders (id, item, qty) VALUES (${n}, 'manual', 1);`
    if (mode === 'identity') return say({ ok: false, code: '428C9', title: 'ERROR: cannot insert a non-DEFAULT value into column "id"', detail: 'DETAIL: Column "id" is an identity column defined as GENERATED ALWAYS. HINT: Use `OVERRIDING SYSTEM VALUE` to override.' }, sql)
    if (rows.some((r) => r.id === n)) return say({ ok: false, code: '23505', title: `ERROR: duplicate key value violates unique constraint "${pk}"`, detail: `DETAIL: Key (id)=(${n}) already exists.` }, sql)
    setRows((r) => [...r, { id: n, item: 'manual', qty: 1 }].sort((a, b) => a.id - b.id))
    setTickets((t) => [...t, { n, state: 'manual' }])
    say({ ok: true, title: 'INSERT 0 1', detail: `Accepted: \`serial\` is only a default, so an explicit id skips the sequence. But the sequence still says its next value is **${n}**. Now press **INSERT**.` }, sql)
  }

  const tTone = (s: Ticket['state']): Tone => (s === 'used' ? 'ok' : s === 'lost' ? 'dead' : 'new')
  const ddl = mode === 'identity'
    ? 'id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY'
    : "id serial PRIMARY KEY   -- = integer NOT NULL DEFAULT nextval('orders_id_seq')"
  const gaps = tickets.filter((t) => t.state === 'lost').length

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Id column" value={mode} onChange={(m) => reset(m)} options={[['identity', 'GENERATED ALWAYS AS IDENTITY'], ['serial', 'serial (legacy)']]} />
      </div>
      <p className="font-mono text-[12px] break-words text-muted">CREATE TABLE orders ({ddl}, item text, qty int CHECK (qty &gt; 0));</p>
      <div className="flex flex-wrap gap-2">
        <Btn primary testid="viz-next" onClick={insert}>INSERT</Btn>
        <Btn onClick={rollback}>INSERT, then ROLLBACK</Btn>
        <Btn onClick={failed}>INSERT qty = 0 (fails)</Btn>
        <Btn onClick={manual}>INSERT with id = {last + 1}</Btn>
        <Btn onClick={() => reset()}>Reset</Btn>
      </div>
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3" style={{ borderColor: tone('header'), background: toneBg('header', 10) }}>
          <span className="font-mono text-[11px] text-muted">orders_id_seq</span>
          <span className="text-[11px] text-muted">last value handed out</span>
          <motion.span key={last} initial={{ scale: 1.4, color: tone.text('new') }} animate={{ scale: 1, color: tone.text('header') }} className="font-mono text-3xl font-bold">{last || '—'}</motion.span>
          <span className="text-center text-[11px] text-muted">next nextval() → {last + 1}</span>
        </div>
        <div className="grid content-start gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Numbers handed out</p>
          <div className="flex min-h-[34px] flex-wrap gap-1.5">
            <AnimatePresence>
              {tickets.map((t, i) => (
                <motion.span key={`${t.n}-${i}`} layout initial={{ opacity: 0, y: -10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="rounded-md border px-2 py-0.5 font-mono text-[12px] font-semibold" style={{ borderColor: tone(tTone(t.state)), background: toneBg(tTone(t.state), 16), color: tone.text(tTone(t.state)) }}>
                  {t.n}{t.state === 'lost' ? ' ✗' : t.state === 'manual' ? ' ✎' : ''}
                </motion.span>
              ))}
            </AnimatePresence>
            {tickets.length === 0 && <span className="text-xs text-muted">Press INSERT to draw the first value.</span>}
          </div>
          <Legend items={[['ok', 'used by a stored row'], ['dead', 'lost: rollback or failed insert'], ['new', 'typed by hand, sequence bypassed']]} />
          <p className="text-xs text-muted">{gaps ? `${gaps} gap${gaps > 1 ? 's' : ''} so far. Gaps are normal; never rely on ids being consecutive.` : 'No gaps yet.'}</p>
        </div>
      </div>
      {out && <p className="font-mono text-[12px] break-words" style={{ color: tone.text('accent') }}>{out.sql}</p>}
      <OutcomeBox o={out?.o ?? null} k={out?.n ?? 0} />
      <TableCard name="orders" cols={['id', 'item', 'qty']} keyCols={[0]}
        hl={ghost ? { [`g${ghost.id}`]: 'dead' } : rows.length ? { [String(rows[rows.length - 1].id)]: 'new' } : undefined}
        rows={[...rows.map((r) => ({ key: String(r.id), cells: [r.id, r.item, r.qty] })), ...(ghost ? [{ key: `g${ghost.id}`, cells: [ghost.id, ghost.item, ghost.qty] }] : [])]} />
    </div>
  )
}

/* ---------- views ---------- */

interface Prod { id: number; name: string; price: number }
const START: Prod[] = [{ id: 1, name: 'Mug', price: 9.5 }, { id: 2, name: 'Lamp', price: 34 }, { id: 3, name: 'Desk', price: 210 }, { id: 4, name: 'Pen', price: 2.2 }]
const inView = (p: Prod) => p.price < 50
const money = (n: number) => n.toFixed(2)

function ViewLab() {
  const [rows, setRows] = useState<Prod[]>(START)
  const [snap, setSnap] = useState<Prod[]>(START.filter(inView))
  const [check, setCheck] = useState(false)
  const [nextId, setNextId] = useState(5)
  const [touched, setTouched] = useState<number | null>(null)
  const [out, setOut] = useState<{ o: Outcome; sql: string; n: number } | null>(null)
  const say = (o: Outcome, sql: string) => setOut({ o, sql, n: (out?.n ?? 0) + 1 })
  const reset = () => { setRows(START); setSnap(START.filter(inView)); setNextId(5); setTouched(null); setOut(null) }
  const fresh = rows.filter(inView)
  const stale = JSON.stringify(fresh) !== JSON.stringify(snap)

  const viewUpdate = (name: string, price: number) => {
    const sql = `UPDATE budget_products SET price = ${price} WHERE name = '${name}';`
    const p = rows.find((r) => r.name === name)
    if (!p || !inView(p)) return say({ ok: true, title: 'UPDATE 0', detail: `**${name}** is not visible through the view, so the view's WHERE clause hides it from the UPDATE.` }, sql)
    const np = { ...p, price }
    if (check && !inView(np)) return say({ ok: false, code: '44000', title: 'ERROR: new row violates check option for view "budget_products"', detail: `DETAIL: Failing row contains (${p.id}, ${p.name}, ${money(price)}).` }, sql)
    setRows(rows.map((r) => (r.id === p.id ? np : r))); setTouched(p.id)
    say({ ok: true, title: 'UPDATE 1', detail: inView(np) ? 'The change went straight into `products`. The view stores nothing; it shows the table as it is now.' : `The row was updated in \`products\`, and at ${money(price)} it **left the view**. Turn on WITH CHECK OPTION to forbid that.` }, sql)
  }
  const viewInsert = () => {
    const sql = "INSERT INTO budget_products (name, price) VALUES ('Sofa', 900);"
    if (check) { setNextId(nextId + 1); return say({ ok: false, code: '44000', title: 'ERROR: new row violates check option for view "budget_products"', detail: `DETAIL: Failing row contains (${nextId}, Sofa, 900.00).` }, sql) }
    setRows([...rows, { id: nextId, name: 'Sofa', price: 900 }]); setTouched(nextId); setNextId(nextId + 1)
    say({ ok: true, title: 'INSERT 0 1', detail: 'The row landed in `products`, but it is **invisible through the view** that inserted it. That surprise is what WITH CHECK OPTION prevents.' }, sql)
  }
  const baseUpdate = () => {
    const sql = "UPDATE products SET price = 45 WHERE name = 'Desk';"
    setRows(rows.map((r) => (r.name === 'Desk' ? { ...r, price: 45 } : r))); setTouched(3)
    say({ ok: true, title: 'UPDATE 1', detail: 'Changed in the table directly. The view shows Desk at once. The **materialized** copy does not, until it is refreshed.' }, sql)
  }
  const aggUpdate = () => say({ ok: false, code: '55000', title: 'ERROR: cannot update view "product_stats"', detail: 'DETAIL: Views that return aggregate functions are not automatically updatable. A count has no single row to change.' }, 'UPDATE product_stats SET n = 0;  -- product_stats = SELECT count(*) AS n ...')
  const refresh = () => { setSnap(fresh); say({ ok: true, title: 'REFRESH MATERIALIZED VIEW', detail: 'The stored copy was rebuilt by re-running its query.' }, 'REFRESH MATERIALIZED VIEW budget_snapshot;') }

  const hl = (list: Prod[], vis: (p: Prod) => boolean) => Object.fromEntries(list.map((p) => [String(p.id), (p.id === touched ? 'new' : vis(p) ? 'tuple' : undefined) as Tone])
    .filter(([, t]) => t)) as Record<string, Tone>
  const card = (p: Prod) => ({ key: String(p.id), cells: [p.id, p.name, money(p.price)] })

  return (
    <div className="grid gap-3">
      <p className="font-mono text-[12px] break-words text-muted">CREATE VIEW budget_products AS SELECT id, name, price FROM products WHERE price &lt; 50{check ? ' WITH CHECK OPTION' : ''};</p>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={check} onChange={(e) => { setCheck(e.target.checked); setOut(null) }} className="accent-[var(--accent)]" />
        <span className="font-mono">WITH CHECK OPTION</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => viewUpdate('Mug', 12)}>View: Mug → 12.00</Btn>
        <Btn onClick={() => viewUpdate('Lamp', 75)}>View: Lamp → 75.00</Btn>
        <Btn onClick={viewInsert}>View: INSERT Sofa 900</Btn>
        <Btn onClick={baseUpdate}>Table: Desk → 45.00</Btn>
        <Btn onClick={aggUpdate}>Update a count(*) view</Btn>
        <Btn onClick={refresh}>REFRESH snapshot</Btn>
        <Btn onClick={reset}>Reset</Btn>
      </div>
      {out && <p className="font-mono text-[12px] break-words" style={{ color: tone.text('accent') }}>{out.sql}</p>}
      <OutcomeBox o={out?.o ?? null} k={out?.n ?? 0} />
      <div className="grid gap-2 md:grid-cols-3">
        <TableCard name="products" note="the table" cols={['id', 'name', 'price']} keyCols={[0]} hl={hl(rows, inView)} rows={rows.map(card)} />
        <TableCard name="budget_products" note="view (live)" cols={['id', 'name', 'price']} hl={hl(fresh, () => true)} rows={fresh.map(card)} />
        <div className="grid content-start gap-1">
          <TableCard name="budget_snapshot" note="materialized view" cols={['id', 'name', 'price']} rows={snap.map(card)} />
          <AnimatePresence>{stale && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded px-2 py-1 text-[12px] font-semibold" style={{ background: toneBg('dead', 14), color: tone.text('dead') }}>
              Stale: the table changed since the last refresh.
            </motion.p>)}
          </AnimatePresence>
        </div>
      </div>
      <Legend items={[['tuple', 'row the view can see'], ['new', 'row just written'], ['dead', 'stale copy']]} />
    </div>
  )
}

function ViewsSequencesViz() {
  const [tab, setTab] = useState<'seq' | 'view'>('seq')
  return (
    <div className="grid gap-3">
      <div><Segmented label="Lab" value={tab} onChange={setTab} options={[['seq', 'Sequences & identity'], ['view', 'Views']]} /></div>
      <p className="text-sm text-muted"><Md>{tab === 'seq'
        ? 'A **sequence** is a counter object. `nextval()` returns its next number and is never undone. An **identity column** and the older `serial` both fill `id` from one.'
        : 'A **view** is a saved `SELECT` with a name. Reading it runs the query; writing to a simple view writes to the table underneath. A **materialized view** stores the result instead.'}</Md></p>
      {tab === 'seq' ? <SequenceLab /> : <ViewLab />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'views-and-sequences',
  module: 'f3',
  order: 4,
  title: 'Views, sequences and identity',
  tldr: [
    'A **view** is a named, saved query you can select from like a table, and a **sequence** is a counter that hands out unique numbers for id columns.',
    'Views give every query the same well-tested definition of things like "active products", and sequences let many sessions get unique ids at once without coordinating.',
  ],
  visualizer: {
    title: 'Tickets from a counter, windows onto a table',
    caption: 'In the sequence lab, try a rollback and a failed insert and watch the gaps, then switch to `serial` and type an id by hand. In the view lab, write through the view with and without **WITH CHECK OPTION**.',
    Component: ViewsSequencesViz,
  },
  playground: {
    setup: `${TRY_FN}

CREATE TABLE products (
  id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name   text NOT NULL,
  price  numeric(10,2) NOT NULL CHECK (price > 0),
  active boolean NOT NULL DEFAULT true
);
INSERT INTO products (name, price) VALUES ('Mug', 9.50), ('Lamp', 34.00), ('Desk', 210.00), ('Pen', 2.20);

CREATE TABLE legacy_orders (
  id   serial PRIMARY KEY,
  item text NOT NULL
);`,
    presets: [
      { label: '1. Identity: RETURNING the new id', sql: `INSERT INTO products (name, price) VALUES ('Chair', 80.00)
RETURNING id, name;

SELECT pg_get_serial_sequence('products', 'id') AS sequence_name;
SELECT last_value FROM products_id_seq;`,
        note: 'The new row gets the next id (**5** on a fresh database). `RETURNING` gives it back without a second query. The identity column is filled from a sequence named `products_id_seq`.' },
      { label: '2. Gaps: rollbacks and failures', sql: `BEGIN;
INSERT INTO products (name, price) VALUES ('Shelf', 55.00) RETURNING id;
ROLLBACK;

SELECT try($$INSERT INTO products (name, price) VALUES ('Free gift', 0)$$) AS failed_insert;

INSERT INTO products (name, price) VALUES ('Rug', 40.00) RETURNING id;`,
        note: 'The rolled-back insert used one id and the failed one used the next, so Rug lands **two above** Shelf (6, 7, then 8 if you ran preset 1 first). Sequence values are never handed back.' },
      { label: '3. serial vs GENERATED ALWAYS', sql: `SELECT try($$INSERT INTO products (id, name, price) VALUES (100, 'Manual', 1)$$) AS identity_always;

INSERT INTO legacy_orders (id, item) VALUES (1, 'typed by hand');
SELECT try($$INSERT INTO legacy_orders (item) VALUES ('from the sequence')$$) AS serial_collision;
INSERT INTO legacy_orders (item) VALUES ('second try') RETURNING id;`,
        note: 'Identity ALWAYS refuses a hand-typed id (**428C9**). `serial` accepts it, then the sequence later hands out the same 1 and collides (**23505**). The retry gets 2.' },
      { label: '4. A view is a saved query', sql: `CREATE OR REPLACE VIEW budget_products AS
  SELECT id, name, price FROM products WHERE price < 50 AND active;

SELECT * FROM budget_products ORDER BY price;

UPDATE budget_products SET price = 12.00 WHERE name = 'Mug';
SELECT name, price FROM products WHERE name = 'Mug';`,
        note: 'The view has no data of its own. The UPDATE through it changed the row in `products`, because a view over one table with plain columns is **automatically updatable**.' },
      { label: '5. WITH CHECK OPTION', sql: `CREATE OR REPLACE VIEW budget_products AS
  SELECT id, name, price FROM products WHERE price < 50 AND active;

INSERT INTO budget_products (name, price) VALUES ('Sofa', 900.00);
SELECT count(*) AS sofa_visible_in_view FROM budget_products WHERE name = 'Sofa';

CREATE OR REPLACE VIEW budget_products_checked AS
  SELECT id, name, price FROM products WHERE price < 50 AND active
  WITH CHECK OPTION;
SELECT try($$INSERT INTO budget_products_checked (name, price) VALUES ('Sofa 2', 900.00)$$) AS checked;`,
        note: 'The first Sofa was stored in `products` but the view cannot show it (count 0). The checked view refuses it with **44000**.' },
      { label: '6. Not every view is updatable', sql: `CREATE OR REPLACE VIEW product_stats AS
  SELECT count(*) AS n, round(avg(price), 2) AS avg_price FROM products;

SELECT * FROM product_stats;
SELECT try($$UPDATE product_stats SET n = 0$$) AS update_attempt;`,
        note: 'Aggregates, `DISTINCT`, `GROUP BY`, joins and `LIMIT` make a view read-only (**55000**). It is still perfectly good for reading.' },
      { label: '7. Materialized view: a stored copy', sql: `CREATE MATERIALIZED VIEW price_report AS
  SELECT count(*) AS products, max(price) AS top_price FROM products;

INSERT INTO products (name, price) VALUES ('Piano', 3000.00);
SELECT * FROM price_report;   -- still the old numbers

REFRESH MATERIALIZED VIEW price_report;
SELECT * FROM price_report;   -- now includes the piano`,
        note: 'A materialized view saves the result when created. It stays the same until `REFRESH MATERIALIZED VIEW` re-runs the query.' },
    ],
  },
  production: {
    title: 'An integer id column about to run out',
    context: 'An events table was created years ago with `id serial PRIMARY KEY`. `serial` is a 4-byte `integer`, which tops out at 2,147,483,647.',
    problem: 'At 2.1 billion rows the sequence would reach the limit, and every insert would fail with `nextval: reached maximum value of sequence` (SQLSTATE 2200H). Gaps from rollbacks and retries made it arrive sooner than the row count suggested.',
    solution: 'Watch how close each sequence is to its limit, and plan the change to `bigint` well ahead. New tables use `bigint GENERATED ALWAYS AS IDENTITY` so this never comes up.',
    sql: `-- how much of its range has each sequence used?
SELECT schemaname, sequencename, data_type, last_value,
       round(100.0 * last_value / max_value, 2) AS pct_used
FROM pg_sequences ORDER BY pct_used DESC NULLS LAST;

-- new tables:
CREATE TABLE events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ...
);`,
    outcome: 'A daily check on `pct_used` gives months of warning instead of an outage. A `bigint` identity allows about 9.2 quintillion values, far more than any table will need.',
  },
  pitfalls: [
    { title: 'Expecting ids without gaps',
      symptom: 'Invoice numbers jump from 1041 to 1043 and an auditor asks where 1042 went.',
      cause: 'A sequence value is used up by `nextval()` even if the transaction rolls back or the insert fails. This is what makes sequences fast and safe for many sessions at once.',
      fix: 'Never use a sequence id as a "no gaps" business number. If the law requires gapless numbers, keep a counter row and update it under a lock inside the same transaction, accepting that inserts queue up behind it.' },
    { title: 'Manual ids with serial',
      symptom: 'After a data import, new inserts fail with `duplicate key value violates unique constraint`.',
      cause: 'The import wrote explicit ids, which bypass the sequence. The sequence still starts at its old value and later hands out ids that already exist.',
      fix: 'After loading rows with explicit ids, move the sequence past the largest one. Prefer identity `ALWAYS`, which refuses manual ids unless you write `OVERRIDING SYSTEM VALUE`.',
      sql: `SELECT setval(pg_get_serial_sequence('legacy_orders', 'id'), (SELECT max(id) FROM legacy_orders));` },
    { title: '`SELECT *` in a view does not pick up new columns',
      symptom: 'A column added to the table never shows up in the view.',
      cause: 'The `*` is expanded into a fixed list of columns when the view is created.',
      fix: 'List columns explicitly, and recreate the view (`CREATE OR REPLACE VIEW`) when you want a new column in it.' },
    { title: 'Reading stale numbers from a materialized view',
      symptom: 'A dashboard backed by a materialized view shows yesterday\'s totals.',
      cause: 'A materialized view is only updated when someone runs `REFRESH MATERIALIZED VIEW`.',
      fix: 'Refresh on a schedule that matches how fresh the data must be. Add a unique index so you can use `REFRESH MATERIALIZED VIEW CONCURRENTLY`, which does not block readers.' },
  ],
  pointers: [
    'New tables: `id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY`. `serial` is the older shorthand and lets manual ids collide with the sequence, and so does `GENERATED BY DEFAULT AS IDENTITY`.',
    '`nextval()` is **never rolled back**, so ids have gaps. Use `INSERT … RETURNING id` to get the new id in one round trip.',
    'A **view** stores a query, not data. Simple single-table views are **updatable**; add `WITH CHECK OPTION` to reject rows the view could not show.',
    'A **materialized view** stores the result and needs `REFRESH MATERIALIZED VIEW` to catch up.',
    '**Going deeper:** [Views and materialized views](/m6/views-matviews) shows how the rewriter turns a view into its query.',
  ],
  sources: ['sql-createview.html', 'sql-creatematerializedview.html', 'sql-refreshmaterializedview.html', 'sql-createsequence.html', 'functions-sequence.html', 'ddl-identity-columns.html', 'datatype-numeric.html', 'dml-returning.html'],
}
