import { motion, LayoutGroup } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one messy order spreadsheet decomposed 0NF → 1NF → 2NF → 3NF, then hardened with
 * constraints. Column headers carry a layoutId, so each column visibly moves into its new table.
 * Column colour = the determinant it depends on (functional dependency). The final schema is the
 * playground's setup, and every constraint shown there is exercised by a preset.
 * ---------------------------------------------------------------------------------------------- */

type Dep = 'order' | 'customer' | 'product' | 'line' | 'key'
interface Col { name: string; dep: Dep; badges?: string[]; id?: string }
interface Table { name: string; cols: Col[]; rows: string[][]; hl?: { rows: number[]; col?: string; t: Tone }; ghost?: { row: string[]; why: string } }
interface S { tables: Table[]; fds: [string, string, Tone?][]; note?: string }

const depTone: Record<Dep, Tone> = { order: 'accent', customer: 'pointer', product: 'header', line: 'new', key: 'muted' }

const C = (name: string, dep: Dep, badges?: string[], id?: string): Col => ({ name, dep, badges, id })
const SHEET_ROWS = [
  ['1001', '2026-03-02', 'ana@ex.com', 'Ana Silva', 'Lisbon', 'KB-01 Keyboard 49.00 ×2; MS-07 Mouse 19.00 ×1'],
  ['1002', '2026-03-02', 'raj@ex.com', 'Raj Mehta', 'Pune', 'MS-07 Mouse 19.00 ×3'],
  ['1003', '2026-03-05', 'ana@ex.com', 'Ana Silva', 'Lisbon', 'KB-01 Keyboard 45.00 ×1; HD-22 Headset 89.00 ×1'],
]
const LINES = [
  ['1001', '2026-03-02', 'ana@ex.com', 'Ana Silva', 'Lisbon', 'KB-01', 'Keyboard', '49.00', '2'],
  ['1001', '2026-03-02', 'ana@ex.com', 'Ana Silva', 'Lisbon', 'MS-07', 'Mouse', '19.00', '1'],
  ['1002', '2026-03-02', 'raj@ex.com', 'Raj Mehta', 'Pune', 'MS-07', 'Mouse', '19.00', '3'],
  ['1003', '2026-03-05', 'ana@ex.com', 'Ana Silva', 'Lisbon', 'KB-01', 'Keyboard', '45.00', '1'],
  ['1003', '2026-03-05', 'ana@ex.com', 'Ana Silva', 'Lisbon', 'HD-22', 'Headset', '89.00', '1'],
]
const LINE_COLS = [C('order_id', 'key'), C('order_date', 'order'), C('customer_email', 'order'), C('customer_name', 'customer'), C('customer_city', 'customer'),
  C('sku', 'key'), C('product_name', 'product'), C('unit_price', 'line'), C('qty', 'line')]
const FDS_ALL: [string, string, Tone?][] = [
  ['order_id', 'order_date, customer_email'], ['customer_email', 'customer_name, customer_city'], ['sku', 'product_name'], ['(order_id, sku)', 'qty, unit_price'],
]

const ORDERS2 = [['1001', '2026-03-02', 'ana@ex.com', 'Ana Silva', 'Lisbon'], ['1002', '2026-03-02', 'raj@ex.com', 'Raj Mehta', 'Pune'], ['1003', '2026-03-05', 'ana@ex.com', 'Ana Silva', 'Lisbon']]
const PRODUCTS = [['KB-01', 'Keyboard', '45.00'], ['MS-07', 'Mouse', '19.00'], ['HD-22', 'Headset', '89.00']]
const ITEMS = [['1001', 'KB-01', '2', '49.00'], ['1001', 'MS-07', '1', '19.00'], ['1002', 'MS-07', '3', '19.00'], ['1003', 'KB-01', '1', '45.00'], ['1003', 'HD-22', '1', '89.00']]
const CUSTOMERS = [['1', 'ana@ex.com', 'Ana Silva', 'Lisbon'], ['2', 'raj@ex.com', 'Raj Mehta', 'Pune']]
const ORDERS3 = [['1001', '1', '2026-03-02'], ['1002', '2', '2026-03-02'], ['1003', '1', '2026-03-05']]

const t2 = (badges = false): Table[] => [
  { name: 'orders', cols: [C('order_id', 'key', badges ? ['PK'] : undefined), C('order_date', 'order'), C('customer_email', 'order'), C('customer_name', 'customer'), C('customer_city', 'customer')], rows: ORDERS2 },
  { name: 'products', cols: [C('sku', 'key', undefined, 'sku-p'), C('product_name', 'product'), C('list_price', 'product', undefined, 'unit_price-p')], rows: PRODUCTS },
  { name: 'order_items', cols: [C('order_id', 'key', undefined, 'order_id-i'), C('sku', 'key'), C('qty', 'line'), C('unit_price', 'line')], rows: ITEMS },
]

const steps: Step<S>[] = [
  { title: '0NF: one spreadsheet row per order', body: 'The `items` cell packs a **list** into one value. Answering "who bought MS-07?" needs string parsing, and nothing stops a typo like `MS-7`.',
    state: { tables: [{ name: 'order_sheet', cols: [C('order_id', 'key'), C('order_date', 'order'), C('customer_email', 'order'), C('customer_name', 'customer'), C('customer_city', 'customer'), C('items', 'line')], rows: SHEET_ROWS, hl: { rows: [0, 1, 2], col: 'items', t: 'dead' } }], fds: [] } },
  { title: '1NF: one atomic value per cell', body: 'Split the list into **one row per order line**. Every cell now holds one value, and the row is identified by the composite key **(order_id, sku)**.',
    state: { tables: [{ name: 'order_lines', cols: LINE_COLS, rows: LINES }], fds: [] } },
  { title: 'Update anomaly: Ana moves to Porto', body: 'Her city is stored on **4 rows**. An UPDATE that misses one leaves the table saying she lives in two cities at once.',
    state: { tables: [{ name: 'order_lines', cols: LINE_COLS, rows: LINES.map((r, k) => (k === 0 || k === 1 ? [...r.slice(0, 4), 'Porto', ...r.slice(5)] : r)), hl: { rows: [0, 1, 3, 4], col: 'customer_city', t: 'dead' } }], fds: [] } },
  { title: 'Insert and delete anomalies', body: 'A new product **CB-03 Cable** cannot be stored until someone orders it: the key needs an `order_id`. Deleting order 1002 erases the only record that **Raj** exists.',
    state: { tables: [{ name: 'order_lines', cols: LINE_COLS, rows: LINES, hl: { rows: [2], t: 'dead' }, ghost: { row: ['NULL', '', '', '', '', 'CB-03', 'Cable', '', ''], why: 'rejected: key column order_id is NULL' } }], fds: [] } },
  { title: 'Name the functional dependencies', body: 'Colour each column by what **determines** it. `order_date` depends only on `order_id` and `product_name` only on `sku`: **partial** dependencies on half of the key. `customer_name` depends on the email, not on the order: a **transitive** one.',
    state: { tables: [{ name: 'order_lines', cols: LINE_COLS, rows: LINES }], fds: [['order_id', 'order_date, customer_email', 'accent'], ['customer_email', 'customer_name, customer_city', 'pointer'], ['sku', 'product_name', 'header'], ['(order_id, sku)', 'qty, unit_price', 'new']] } },
  { title: '2NF: remove partial dependencies', body: 'Every non-key column must depend on the **whole** key. Order facts move to `orders`, product facts to `products`. `order_items` keeps only what needs both: `qty` and the **price actually charged**.',
    state: { tables: t2(), fds: FDS_ALL, note: 'products.list_price is today\'s price; order_items.unit_price is a historical fact (order 1003 paid 45.00). They are different facts, not a duplicate.' } },
  { title: '3NF: remove the transitive dependency', body: 'In `orders`, name and city depend on the email, which depends on the order. Move customers into their own table with a surrogate **identity** key; `orders` keeps only a foreign key.',
    state: { tables: [
      { name: 'customers', cols: [C('customer_id', 'key', undefined, 'customer_id-c'), C('customer_email', 'customer'), C('customer_name', 'customer'), C('customer_city', 'customer')], rows: CUSTOMERS },
      { name: 'orders', cols: [C('order_id', 'key'), C('customer_id', 'order'), C('order_date', 'order')], rows: ORDERS3 },
      t2()[1], t2()[2]], fds: [['customer_id', 'email, name, city', 'pointer'], ['email', 'customer_id (candidate key)', 'pointer'], ['order_id', 'customer_id, order_date', 'accent'], ['sku', 'name, list_price', 'header'], ['(order_id, sku)', 'qty, unit_price', 'new']],
      note: 'Every determinant is now a key of its table, so this design is also in BCNF. Ana\'s city lives in exactly one row.' } },
  { title: 'Constraints make the design enforceable', body: 'Normal forms describe the shape; **constraints** make PostgreSQL enforce it: primary keys, `UNIQUE` email, foreign keys with explicit actions, `NOT NULL` and `CHECK`. A **virtual generated** `line_total` (the default kind in PostgreSQL 18) is computed on read.',
    state: { tables: [
      { name: 'customers', cols: [C('customer_id', 'key', ['PK', 'IDENTITY'], 'customer_id-c'), C('customer_email', 'customer', ['UNIQUE', 'NOT NULL']), C('customer_name', 'customer', ['NOT NULL']), C('customer_city', 'customer', ['NOT NULL'])], rows: CUSTOMERS },
      { name: 'orders', cols: [C('order_id', 'key', ['PK']), C('customer_id', 'order', ['FK → customers', 'RESTRICT']), C('order_date', 'order', ['NOT NULL', 'DEFAULT'])], rows: ORDERS3 },
      { name: 'products', cols: [C('sku', 'key', ['PK', 'CHECK format'], 'sku-p'), C('product_name', 'product', ['NOT NULL']), C('list_price', 'product', ['CHECK ≥ 0'], 'unit_price-p')], rows: PRODUCTS },
      { name: 'order_items', cols: [C('order_id', 'key', ['PK', 'FK CASCADE'], 'order_id-i'), C('sku', 'key', ['PK', 'FK']), C('qty', 'line', ['CHECK > 0']), C('unit_price', 'line', ['CHECK ≥ 0']), C('line_total', 'line', ['VIRTUAL'])],
        rows: ITEMS.map((r) => [...r, (Number(r[2]) * Number(r[3])).toFixed(2)]) }],
      fds: [], note: 'Deleting an order cascades to its items. Deleting a customer who still has orders is refused (RESTRICT). Try every one of these in the playground.' } },
  { title: 'PG18: a temporal key for price history', body: 'To answer "what was the list price on 5 March?", keep price periods. `PRIMARY KEY (sku, valid_during WITHOUT OVERLAPS)` forbids two prices for one product at the same moment. It is backed by a **GiST** index and fails with SQLSTATE `23P01`.',
    state: { tables: [{ name: 'product_prices', cols: [C('sku', 'key', ['PK part', 'FK'], 'sku-p'), C('valid_during', 'key', ['WITHOUT OVERLAPS']), C('price', 'product', ['CHECK ≥ 0'], 'unit_price-p')],
      rows: [['KB-01', '[2026-01-01, 2026-03-04)', '49.00'], ['KB-01', '[2026-03-04, infinity)', '45.00'], ['MS-07', '[2026-01-01, infinity)', '19.00']],
      ghost: { row: ['KB-01', '[2026-03-01, 2026-03-10)', '47.00'], why: '23P01: conflicting key value violates exclusion constraint' } }], fds: [] } },
]

function TableCard({ t }: { t: Table }) {
  return (
    <motion.div layout className="max-w-full min-w-0 rounded-lg border border-line bg-surface" transition={{ type: 'spring', stiffness: 170, damping: 24 }}>
      <motion.p layout="position" className="border-b border-line px-2 py-1 font-mono text-[12px] font-bold">{t.name}</motion.p>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="border-collapse font-mono text-[11px]">
          <thead>
            <tr>
              {t.cols.map((c) => (
                <th key={c.id ?? c.name} className="px-1.5 pt-1 text-left align-bottom">
                  <motion.div layoutId={`col-${c.id ?? c.name}`} transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                    className="rounded px-1.5 py-0.5 whitespace-nowrap" style={{ background: toneBg(depTone[c.dep], c.dep === 'key' ? 14 : 24), color: 'var(--text)', borderBottom: `2px solid ${tone(depTone[c.dep])}` }}>
                    {c.dep === 'key' ? <u>{c.name}</u> : c.name}
                  </motion.div>
                  {c.badges && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-0.5 flex flex-wrap gap-0.5">
                      {c.badges.map((b) => <span key={b} className="rounded px-1 text-[10px] font-semibold" style={{ background: toneBg(b.startsWith('FK') || b === 'RESTRICT' ? 'pointer' : b.startsWith('CHECK') || b === 'NOT NULL' ? 'new' : b === 'VIRTUAL' || b === 'DEFAULT' || b === 'IDENTITY' ? 'muted' : 'ok', 22), color: 'var(--text)' }}>{b}</span>)}
                    </motion.div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => {
              const rowHl = t.hl && t.hl.rows.includes(i) && !t.hl.col
              return (
                <motion.tr key={i} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-line" style={rowHl ? { background: toneBg(t.hl!.t, 16) } : undefined}>
                  {r.map((v, j) => {
                    const cellHl = t.hl?.col === t.cols[j]?.name && t.hl.rows.includes(i)
                    return <td key={j} className={`px-2 py-0.5 ${v.length > 24 ? 'min-w-[220px] whitespace-normal' : 'whitespace-nowrap'}`} style={cellHl ? { background: toneBg(t.hl!.t, v === 'Porto' ? 30 : 14), fontWeight: 700 } : undefined}>{v}</td>
                  })}
                </motion.tr>
              )
            })}
            {t.ghost && (
              <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="border-t border-dashed" style={{ borderColor: tone('dead'), background: toneBg('dead', 10) }}>
                {t.ghost.row.map((v, j) => <td key={j} className="px-2 py-0.5 whitespace-nowrap line-through decoration-1" style={{ color: tone.text('dead') }}>{v}</td>)}
              </motion.tr>
            )}
          </tbody>
        </table>
      </div>
      {t.ghost && <p className="px-2 py-1 font-mono text-[11px]" style={{ color: tone.text('dead') }}>{t.ghost.why}</p>}
    </motion.div>
  )
}

function NormalizeViz() {
  return (
    <Stepper steps={steps} interval={3600} render={(s) => {
      const rows = s.tables.reduce((n, t) => n + t.rows.length * t.cols.filter((c) => !c.badges?.includes('VIRTUAL')).length, 0)
      return (
        <div className="grid gap-3">
          <Legend items={[['muted', 'key column (underlined)'], ['accent', 'depends on order_id'], ['pointer', 'depends on the customer'], ['header', 'depends on sku'], ['new', 'depends on (order_id, sku)'], ['dead', 'anomaly']]} />
          <LayoutGroup>
            <motion.div layout className="flex flex-wrap items-start gap-3">
              {s.tables.map((t) => <TableCard key={t.name} t={t} />)}
            </motion.div>
          </LayoutGroup>
          <div className="flex flex-wrap items-center gap-2">
            {s.fds.map(([a, b, t]) => (
              <motion.span key={a + b} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-md border px-2 py-0.5 font-mono text-[11.5px]"
                style={{ borderColor: t ? tone(t) : 'var(--border)', background: t ? toneBg(t, 12) : 'var(--surface-2)' }}>{a} → {b}</motion.span>
            ))}
            <span className="ml-auto flex gap-1.5"><Tag t="muted">{s.tables.length} table{s.tables.length > 1 ? 's' : ''}</Tag><Tag t="muted">{rows} stored values</Tag></span>
          </div>
          {s.note && <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"><Md>{s.note}</Md></p>}
        </div>
      )
    }} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'normalization-constraints',
  module: 'm1',
  order: 6,
  title: 'Modelling data: normalization and constraints',
  tldr: [
    '**Normalization** splits data into tables so that every fact is stored exactly once, keyed by what determines it, and **constraints** make PostgreSQL enforce that shape on every write.',
    'Duplicated facts drift apart under concurrent updates, so a normalized schema with keys, foreign keys and checks turns whole classes of application bugs into immediate, well-defined errors.',
  ],
  visualizer: {
    title: 'From a messy spreadsheet to 3NF, column by column',
    caption: 'Step through the decomposition. Watch each column move to the table of the key it depends on, then see which constraints guard the result. Colours show functional dependencies.',
    Component: NormalizeViz,
  },
  playground: {
    extensions: ['btree_gist'],
    setup: `
CREATE FUNCTION try(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE d text;
BEGIN EXECUTE q; RETURN 'OK';
EXCEPTION WHEN others THEN
  GET STACKED DIAGNOSTICS d = PG_EXCEPTION_DETAIL;
  RETURN SQLSTATE || ': ' || SQLERRM || CASE WHEN d <> '' THEN ' | ' || d ELSE '' END;
END $$;

CREATE TABLE customers (
  customer_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       text NOT NULL UNIQUE,
  name        text NOT NULL,
  city        text NOT NULL
);
CREATE TABLE products (
  sku        text PRIMARY KEY CHECK (sku ~ '^[A-Z]{2}-[0-9]{2}$'),
  name       text NOT NULL,
  list_price numeric(10,2) NOT NULL CHECK (list_price >= 0)
);
CREATE TABLE orders (
  order_id    bigint PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers ON DELETE RESTRICT,
  order_date  date NOT NULL DEFAULT current_date
);
CREATE TABLE order_items (
  order_id   bigint NOT NULL REFERENCES orders ON DELETE CASCADE,
  sku        text   NOT NULL REFERENCES products,
  qty        int    NOT NULL CHECK (qty > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(12,2) GENERATED ALWAYS AS (qty * unit_price),
  PRIMARY KEY (order_id, sku)
);

INSERT INTO customers (email, name, city) VALUES ('ana@ex.com', 'Ana Silva', 'Lisbon'), ('raj@ex.com', 'Raj Mehta', 'Pune');
INSERT INTO products VALUES ('KB-01', 'Keyboard', 45.00), ('MS-07', 'Mouse', 19.00), ('HD-22', 'Headset', 89.00);
INSERT INTO orders VALUES (1001, 1, '2026-03-02'), (1002, 2, '2026-03-02'), (1003, 1, '2026-03-05');
INSERT INTO order_items (order_id, sku, qty, unit_price) VALUES
  (1001, 'KB-01', 2, 49.00), (1001, 'MS-07', 1, 19.00), (1002, 'MS-07', 3, 19.00),
  (1003, 'KB-01', 1, 45.00), (1003, 'HD-22', 1, 89.00);

-- a small CRM for the foreign key action presets
CREATE TABLE clients (
  client_id   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_name text NOT NULL
);
CREATE TABLE contacts (
  contact_id   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id    int,
  contact_name text NOT NULL,
  email        text,
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients (client_id)
);
INSERT INTO clients (client_name) VALUES ('BlueBird Inc'), ('Dolphin LLC'), ('Kestrel Ltd');
INSERT INTO contacts (client_id, contact_name, email) VALUES
  (1, 'John Doe', 'john.doe@example.com'), (1, 'Jane Doe', 'jane.doe@example.com'),
  (2, 'David Wright', 'david.wright@example.com'), (3, 'Mia Chen', 'mia.chen@example.com');`,
    presets: [
      { label: 'The 3NF schema and its constraint names', sql: `SELECT conrelid::regclass AS table_name, conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('customers'::regclass, 'products'::regclass, 'orders'::regclass, 'order_items'::regclass)
ORDER BY 1, 3, 2;

SELECT indexrelid::regclass AS index_built_by_a_constraint, indrelid::regclass AS on_table
FROM pg_index
WHERE indrelid IN ('customers'::regclass, 'products'::regclass, 'orders'::regclass, 'order_items'::regclass);`,
        note: 'Unnamed constraints get predictable names: `<table>_pkey`, `<table>_<col>_key`, `<table>_<col>_check`, `<table>_<col>_fkey`, `<table>_<col>_not_null`. `contype`: p, u, f, c, and **n** (NOT NULL is a catalog row in 18). Only PRIMARY KEY and UNIQUE built an index; the foreign keys did not.' },
      { label: 'Every constraint, fired once', sql: `SELECT label, try(stmt) AS result FROM (VALUES
  ('NOT NULL',        $$INSERT INTO customers (email, name) VALUES ('x@ex.com', 'X')$$),
  ('UNIQUE',          $$INSERT INTO customers (email, name, city) VALUES ('ana@ex.com', 'Ana Two', 'Faro')$$),
  ('CHECK',           $$INSERT INTO order_items (order_id, sku, qty, unit_price) VALUES (1002, 'KB-01', 0, 45)$$),
  ('CHECK (regex)',   $$INSERT INTO products VALUES ('MS-7', 'Mouse', 19)$$),
  ('FOREIGN KEY',     $$INSERT INTO orders VALUES (1004, 99, '2026-03-06')$$),
  ('PRIMARY KEY',     $$INSERT INTO order_items (order_id, sku, qty, unit_price) VALUES (1001, 'KB-01', 1, 49)$$),
  ('IDENTITY ALWAYS', $$INSERT INTO customers (customer_id, email, name, city) VALUES (7, 'z@ex.com', 'Z', 'Goa')$$)
) AS t(label, stmt);`,
        note: 'Each failure has its own SQLSTATE: **23502** not-null, **23505** unique, **23514** check, **23503** foreign key, **428C9** writing an ALWAYS identity column. The text after `|` is the DETAIL line, which names the offending key or row.' },
      { label: 'Foreign key actions: same data, one clause changed', sql: `-- 1. default action (NO ACTION): the delete is refused
SELECT try('DELETE FROM clients WHERE client_id = 1') AS no_action;

-- 2. an FK cannot be edited in place: drop and re-add it in one ALTER TABLE
ALTER TABLE contacts DROP CONSTRAINT fk_client,
  ADD CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients ON DELETE SET NULL;
DELETE FROM clients WHERE client_id = 1;
SELECT ctid, contact_id, client_id, contact_name FROM contacts;

-- 3. switch to CASCADE and delete another client
ALTER TABLE contacts DROP CONSTRAINT fk_client,
  ADD CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients ON DELETE CASCADE;
DELETE FROM clients WHERE client_id = 2;
SELECT ctid, contact_id, client_id, contact_name FROM contacts;

-- RESTRICT on the shop schema uses its own SQLSTATE
SELECT try('DELETE FROM customers WHERE customer_id = 2') AS restrict;`,
        note: 'NO ACTION fails with **23503** and names the still-referenced key. SET NULL keeps John and Jane with `client_id` NULL; they now sit at the **end of the heap** (new ctids), because an update writes new row versions. CASCADE deletes David with his client, and the command tag still says `DELETE 1`. RESTRICT fails with **23001**.' },
      { label: 'NULL is not a violation', sql: `CREATE TABLE promo (code text UNIQUE, pct int CHECK (pct BETWEEN 1 AND 90));
INSERT INTO promo VALUES (NULL, NULL), (NULL, NULL);
SELECT count(*) AS rows_with_nulls FROM promo;

CREATE TABLE promo_strict (code text UNIQUE NULLS NOT DISTINCT);
INSERT INTO promo_strict VALUES (NULL);
SELECT try('INSERT INTO promo_strict VALUES (NULL)') AS second_null;`,
        note: 'A CHECK passes when its expression is **NULL**, and UNIQUE treats NULLs as distinct by default. `NULLS NOT DISTINCT` makes a second NULL a duplicate.' },
      { label: 'Identity BY DEFAULT and the duplicate-key trap', sql: `CREATE TABLE color (
  color_id   int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  color_name text NOT NULL CHECK (length(color_name) >= 3)
);
INSERT INTO color (color_name) VALUES ('Red');                -- sequence hands out 1
INSERT INTO color (color_id, color_name) VALUES (2, 'Green'); -- manual id, sequence not told

SELECT try($$INSERT INTO color (color_name) VALUES ('Blue')$$) AS next_default;
SELECT try($$INSERT INTO color (color_name) VALUES ('Ox')$$)   AS failed_insert;

-- repair: move the sequence past the highest id
SELECT setval(pg_get_serial_sequence('color', 'color_id'), (SELECT max(color_id) FROM color));
INSERT INTO color (color_name) VALUES ('Blue') RETURNING *;`,
        note: 'BY DEFAULT accepts a manual id, but the sequence does not see it, so the next default 2 collides (**23505**). The failed `Ox` insert still consumed 3: sequence values are never rolled back. After `setval`, Blue gets 3.' },
      { label: 'Deferred foreign key', sql: `CREATE TABLE employees (
  id int PRIMARY KEY,
  manager_id int REFERENCES employees DEFERRABLE INITIALLY DEFERRED
);

BEGIN;
INSERT INTO employees VALUES (2, 1);   -- manager 1 does not exist yet
INSERT INTO employees VALUES (1, NULL);
COMMIT;                                -- checked here, and it holds

SELECT * FROM employees ORDER BY id;`,
        note: 'A deferred constraint is checked at **COMMIT**, so rows can arrive in any order within the transaction. Only UNIQUE, PRIMARY KEY, EXCLUDE and foreign keys can be deferrable.' },
      { label: 'PG18: virtual columns and temporal keys', sql: `SELECT order_id, sku, qty, unit_price, line_total FROM order_items ORDER BY 1, 2;
SELECT attname, attgenerated FROM pg_attribute
WHERE attrelid = 'order_items'::regclass AND attname = 'line_total';
SELECT try($$UPDATE order_items SET line_total = 0$$) AS write_generated,
       try($$CREATE INDEX ON order_items (line_total)$$) AS index_virtual;

CREATE TABLE product_prices (
  sku          text REFERENCES products,
  valid_during daterange NOT NULL,
  price        numeric(10,2) NOT NULL CHECK (price >= 0),
  PRIMARY KEY (sku, valid_during WITHOUT OVERLAPS)
);
INSERT INTO product_prices VALUES
  ('KB-01', '[2026-01-01, 2026-03-04)', 49.00),
  ('KB-01', '[2026-03-04,)', 45.00);
SELECT try($$INSERT INTO product_prices VALUES ('KB-01', '[2026-03-01, 2026-03-10)', 47.00)$$) AS overlapping_price;
SELECT price FROM product_prices WHERE sku = 'KB-01' AND valid_during @> date '2026-03-02';

-- the general form: an EXCLUDE constraint (same room AND overlapping dates is forbidden)
CREATE TABLE IF NOT EXISTS bookings (room int, during daterange,
  EXCLUDE USING gist (room WITH =, during WITH &&));
SELECT try($$INSERT INTO bookings VALUES (1, '[2026-03-01,2026-03-05)')$$) AS first_booking,
       try($$INSERT INTO bookings VALUES (1, '[2026-03-04,2026-03-06)')$$) AS double_booking;`,
        note: '`attgenerated = v`: **virtual**, the default in 18, recomputed on every read and stored nowhere, so it cannot be written (**428C9**) or indexed (**0A000**). The temporal key accepts back-to-back periods (`[)` bounds) and rejects an overlap with **23P01**, enforced by a GiST index. `WITHOUT OVERLAPS` is shorthand for an **EXCLUDE** constraint like the one on `bookings`: no two rows may be equal on `room` and overlap on `during` ([GiST](/m4/gist-spgist)).' },
      { label: 'Adding rules to live data: NOT VALID', sql: `CREATE TABLE users (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, username text NOT NULL, email text);
INSERT INTO users (username, email) VALUES
  ('alice', 'alice@example.com'), ('bob', NULL), ('charlie', 'charlie@example.com'), ('diana', NULL);

SELECT try('ALTER TABLE users ALTER COLUMN email SET NOT NULL') AS set_not_null,
       try('ALTER TABLE users ADD COLUMN country text NOT NULL') AS add_not_null_column;

-- PG18: add the rule now, check old rows later
ALTER TABLE users ADD CONSTRAINT users_email_not_null NOT NULL email NOT VALID;
SELECT try($$INSERT INTO users (username, email) VALUES ('eve', NULL)$$) AS new_row,
       try('ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null') AS validate_now;

UPDATE users SET email = username || '@example.com' WHERE email IS NULL;
ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null;
SELECT conname, contype, convalidated, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'users'::regclass ORDER BY 2, 1;

ALTER TABLE order_items ADD CONSTRAINT sane_qty CHECK (qty < 1000) NOT ENFORCED;
SELECT conname, conenforced, convalidated FROM pg_constraint WHERE conname = 'sane_qty';`,
        note: '`NOT NULL … NOT VALID` guards new rows at once (**23502**) but skips the existing NULLs; VALIDATE fails until the backfill is done. Adding a NOT NULL column without a DEFAULT fails on a populated table. A **NOT ENFORCED** check is never verified at all.' },
    ],
  },
  production: {
    title: 'Customer data that drifted across 4 million order rows',
    context: 'An e-commerce team stored `customer_email`, `customer_name` and `shipping_city` directly on every row of a wide `orders` table to "avoid joins".',
    problem: 'Customers who changed their email kept old addresses on older orders. A marketing export de-duplicated by email and found many more "customers" than accounts, and support could not tell which city was current.',
    solution: 'Normalize: create `customers` with a unique email, backfill it from the latest order per email, and add a `customer_id` column. Add its NOT NULL rule and its foreign key as `NOT VALID` first, so new orders are checked immediately while the old rows are backfilled in batches, then validate both. Index the new column yourself, because a foreign key never creates one.',
    sql: `CREATE TABLE customers (customer_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                        email text NOT NULL UNIQUE, name text NOT NULL, city text NOT NULL);
INSERT INTO customers (email, name, city)
SELECT DISTINCT ON (customer_email) customer_email, customer_name, shipping_city
FROM orders ORDER BY customer_email, created_at DESC;
ALTER TABLE orders ADD COLUMN customer_id bigint;
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_id_not_null NOT NULL customer_id NOT VALID,
  ADD CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id) REFERENCES customers NOT VALID;
-- backfill in batches of ~10k rows
UPDATE orders o SET customer_id = c.customer_id FROM customers c
WHERE c.email = o.customer_email AND o.customer_id IS NULL AND o.order_id BETWEEN 1 AND 10000;
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_id_not_null;
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;
CREATE INDEX CONCURRENTLY orders_customer_id_idx ON orders (customer_id);`,
    outcome: 'Each customer fact now lives in one row, so an email change is one UPDATE. The export count matches the account count, the orders table lost three wide text columns, and no step held a long table lock.',
  },
  pitfalls: [
    { title: 'Foreign keys without an index on the referencing side',
      symptom: 'Deleting one customer, or updating a product key, takes seconds and locks many rows.',
      cause: 'A common claim is that declaring a foreign key creates an index for it. It does not: PostgreSQL indexes only the **referenced** key (through its PRIMARY KEY or UNIQUE constraint). Each parent DELETE must scan the child table to check or cascade.',
      fix: 'Index foreign key columns that are not already the leading column of an index ([index design](/m4/index-design)). Find candidates in the catalog.',
      sql: `SELECT c.conrelid::regclass AS child, a.attname AS fk_column
FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
WHERE c.contype = 'f'
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1]);` },
    { title: 'CHECK constraints that let NULL through',
      symptom: '`CHECK (discount BETWEEN 0 AND 50)` is in place, yet reports find rows with no discount at all.',
      cause: 'A CHECK fails only when its expression is **false**. NULL makes it unknown, which passes.',
      fix: 'Add `NOT NULL` when a value is required, or write the intent explicitly: `CHECK (discount IS NOT NULL AND discount BETWEEN 0 AND 50)`.' },
    { title: 'UNIQUE on a nullable column',
      symptom: 'A unique `external_id` column holds many rows with NULL, and an import created duplicates for every record missing an id.',
      cause: 'UNIQUE treats NULLs as distinct by default, so any number of NULLs are allowed.',
      fix: 'Use `NOT NULL`, or declare `UNIQUE NULLS NOT DISTINCT` when at most one NULL is acceptable.' },
    { title: 'Duplicate key right after a data import',
      symptom: 'After loading rows with explicit ids, the application\'s next INSERT fails with `duplicate key value violates unique constraint "…_pkey"`, and the error repeats on every retry until it suddenly stops.',
      cause: 'An identity column `BY DEFAULT` (or a `serial`) accepts manual ids, but its sequence keeps counting from where it was. Each retry burns one value until the sequence passes the imported range.',
      fix: 'Move the sequence past the data after every import, or use `GENERATED ALWAYS` so manual ids need an explicit `OVERRIDING SYSTEM VALUE`.',
      sql: `SELECT setval(pg_get_serial_sequence('color', 'color_id'), (SELECT max(color_id) FROM color));` },
    { title: 'SET NOT NULL on a big table blocks it',
      symptom: '`ALTER TABLE … ALTER COLUMN email SET NOT NULL` on a large table freezes all reads and writes until it finishes, or fails at the end because a few NULLs remain.',
      cause: 'SET NOT NULL takes an ACCESS EXCLUSIVE lock and scans every row in one go. A common claim is that NOT NULL constraints are unnamed and invisible in `pg_constraint`; in 18 they are named catalog rows, which is what lets their validation happen later.',
      fix: 'Add `NOT NULL col NOT VALID` (instant, guards new rows), backfill in batches, then `VALIDATE CONSTRAINT`.',
      sql: `ALTER TABLE users ADD CONSTRAINT users_email_not_null NOT NULL email NOT VALID;
-- backfill, then:
ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null;` },
    { title: 'Treating NOT ENFORCED as a safety net',
      symptom: 'A `CHECK … NOT ENFORCED` exists, and bad rows still get in.',
      cause: 'NOT ENFORCED (new in 18, for CHECK and foreign keys) records the rule in the catalog but PostgreSQL never verifies it, on insert or later.',
      fix: 'Use it only for rules enforced elsewhere. For real protection, add the constraint `NOT VALID` and run `VALIDATE CONSTRAINT` once existing data is clean.' },
  ],
  pointers: [
    '**1NF**: one value per cell. **2NF**: no column depends on part of a composite key. **3NF**: no non-key column depends on another non-key column.',
    'Store each fact once. A historical price on an order line is a different fact from today\'s list price.',
    '**PRIMARY KEY** = UNIQUE + NOT NULL. **UNIQUE** allows many NULLs unless `NULLS NOT DISTINCT`. **CHECK** passes on NULL.',
    'Foreign keys: NO ACTION (default, deferrable), RESTRICT, CASCADE, SET NULL, SET DEFAULT. Index the referencing columns yourself.',
    'PG18: generated columns default to **VIRTUAL** (computed on read, not indexable), keys can be temporal with **WITHOUT OVERLAPS**, NOT NULL can be added **NOT VALID**, CHECK and FK can be **NOT ENFORCED**.',
  ],
  sources: ['ddl-constraints.html', 'ddl-generated-columns.html', 'ddl-identity-columns.html', 'sql-createtable.html', 'sql-altertable.html', 'errcodes-appendix.html', 'btree-gist.html'],
}
