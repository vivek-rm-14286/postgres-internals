import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { ResultTable, Sql, type Cell } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: eight statements against inventory(id identity, sku PK, qty CHECK >= 0).
 * Every xid, ctid, RETURNING row and sequence value was captured from a real PostgreSQL 18 (PGlite)
 * run with pageinspect. xids 761 and 762 went to creating and filling the `delivery` table.
 * ---------------------------------------------------------------------------------------------- */

type VStatus = 'live' | 'new' | 'dead' | 'deleted'
interface Version { lp: number; id: number; sku: string; qty: number; xmin: number; xmax: number; lockOnly?: boolean; status: VStatus }
interface DmlState {
  sql: string
  tag: string
  versions: Version[]
  ret?: { fields: string[]; rows: Cell[][] }
  /** ids handed out by nextval so far, and which of them never reached a live row */
  issued: number
  burned: number[]
  error?: string
}

const S0: Version[] = [
  { lp: 1, id: 1, sku: 'apple', qty: 10, xmin: 756, xmax: 0, status: 'new' },
  { lp: 2, id: 2, sku: 'pear', qty: 5, xmin: 756, xmax: 0, status: 'new' },
]
const age = (vs: Version[]): Version[] => vs.map((v) => ({ ...v, status: v.status === 'new' ? 'live' : v.status === 'deleted' ? 'dead' : v.status }))

const s1 = S0
const s2: Version[] = [{ ...s1[0], xmax: 757, status: 'deleted' }, { ...s1[1], status: 'live' }, { lp: 3, id: 1, sku: 'apple', qty: 7, xmin: 757, xmax: 0, status: 'new' }]
const s3: Version[] = [...age(s2).slice(0, 1), { ...age(s2)[1], xmax: 758, status: 'deleted' }, age(s2)[2], { lp: 4, id: 2, sku: 'pear', qty: 7, xmin: 758, xmax: 758, lockOnly: true, status: 'new' }]
const s4: Version[] = [...age(s3), { lp: 5, id: 4, sku: 'fig', qty: 7, xmin: 759, xmax: 0, status: 'new' }]
const s5: Version[] = [...age(s4).slice(0, 4), { ...age(s4)[4], xmax: 760, status: 'deleted' }]
const a5 = age(s5)
const s6: Version[] = [a5[0], a5[1], { ...a5[2], xmax: 763, status: 'deleted' }, { ...a5[3], xmax: 763, lockOnly: false, status: 'deleted' }, a5[4],
  { lp: 6, id: 1, sku: 'apple', qty: 11, xmin: 763, xmax: 0, status: 'new' }, { lp: 7, id: 5, sku: 'kiwi', qty: 9, xmin: 763, xmax: 0, status: 'new' }]
const s7 = age(s6)

const steps: Step<DmlState>[] = [
  { title: 'An empty table and its identity sequence', body: '`id` is `GENERATED ALWAYS AS IDENTITY`, backed by a sequence. `sku` is the primary key, so it has a **unique index**. Nothing is stored yet.',
    state: { sql: `CREATE TABLE inventory (\n  id  int GENERATED ALWAYS AS IDENTITY,\n  sku text PRIMARY KEY,\n  qty int NOT NULL CHECK (qty >= 0));`, tag: 'CREATE TABLE', versions: [], issued: 0, burned: [] } },
  { title: 'INSERT two rows (xid 756)', body: 'Each row becomes one **tuple** with `xmin` = 756 and `xmax` = 0. `xmin` is the id of the transaction (**xid**) that created the version, `xmax` the one that deleted it (0 = nobody), and `ctid` is its address: (page, slot). The slot number is the line pointer, `lp`. Both rows share one xid because one statement is one transaction. `RETURNING` hands back the generated ids, so no second query is needed.',
    state: { sql: `INSERT INTO inventory (sku, qty)\nVALUES ('apple', 10), ('pear', 5)\nRETURNING id, sku, qty, xmin, ctid;`, tag: 'INSERT 0 2', versions: s1, issued: 2, burned: [],
      ret: { fields: ['id', 'sku', 'qty', 'xmin', 'ctid'], rows: [[1, 'apple', 10, 756, '(0,1)'], [2, 'pear', 5, 756, '(0,2)']] } } },
  { title: 'UPDATE never overwrites (xid 757)', body: 'The old apple version keeps its bytes and gets `xmax` = 757. A **new version** at `(0,3)` carries qty 7. PostgreSQL 18 lets `RETURNING` read both: `old.qty` = 10 and `new.qty` = 7.',
    state: { sql: `UPDATE inventory SET qty = qty - 3\nWHERE sku = 'apple'\nRETURNING old.qty AS old_qty, new.qty AS new_qty, ctid;`, tag: 'UPDATE 1', versions: s2, issued: 2, burned: [],
      ret: { fields: ['old_qty', 'new_qty', 'ctid'], rows: [[10, 7, '(0,3)']] } } },
  { title: 'Upsert: ON CONFLICT DO UPDATE (xid 758)', body: 'The proposed row is built first, so `nextval` hands out **id 3** before the unique index on `sku` reports a conflict. The arbiter path then updates pear instead. Id 3 is **burned**. `old.*` is non-NULL here because a row was updated.',
    state: { sql: `INSERT INTO inventory (sku, qty)\nVALUES ('pear', 2)\nON CONFLICT (sku) DO UPDATE\n  SET qty = inventory.qty + EXCLUDED.qty\nRETURNING old.id AS old_id, old.qty AS old_qty,\n          new.qty AS new_qty, ctid;`, tag: 'INSERT 0 1', versions: s3, issued: 3, burned: [3],
      ret: { fields: ['old_id', 'old_qty', 'new_qty', 'ctid'], rows: [[2, 5, 7, '(0,4)']] } } },
  { title: 'No conflict, plain insert (xid 759)', body: '`fig` is new, so `DO NOTHING` never fires and the row is inserted with the next id, **4**. Note the new pear version at lp 4 shows `xmax` = 758 too: it is a **lock-only** xmax (`HEAP_XMAX_LOCK_ONLY`), not a deletion.',
    state: { sql: `INSERT INTO inventory (sku, qty)\nVALUES ('fig', 7)\nON CONFLICT (sku) DO NOTHING\nRETURNING id, sku, ctid;`, tag: 'INSERT 0 1', versions: s4, issued: 4, burned: [3],
      ret: { fields: ['id', 'sku', 'ctid'], rows: [[4, 'fig', '(0,5)']] } } },
  { title: 'DELETE only stamps xmax (xid 760)', body: 'The fig tuple stays on the page with `xmax` = 760. For DELETE, unqualified RETURNING columns mean **old** values, and every `new.` column is NULL.',
    state: { sql: `DELETE FROM inventory WHERE sku = 'fig'\nRETURNING old.*, new.sku AS new_sku;`, tag: 'DELETE 1', versions: s5, issued: 4, burned: [3],
      ret: { fields: ['id', 'sku', 'qty', 'new_sku'], rows: [[4, 'fig', 7, null]] } } },
  { title: 'MERGE: three actions, one xid (763)', body: 'The source joins the target. Each candidate row gets **one status**, and the first true `WHEN` wins: apple is UPDATEd, kiwi is INSERTed (id 5), pear (7 − 7 = 0) is DELETEd. `merge_action()` reports which branch ran.',
    state: { sql: `MERGE INTO inventory i\nUSING delivery d ON i.sku = d.sku\nWHEN MATCHED AND i.qty + d.qty <= 0 THEN DELETE\nWHEN MATCHED THEN UPDATE SET qty = i.qty + d.qty\nWHEN NOT MATCHED AND d.qty > 0 THEN\n  INSERT (sku, qty) VALUES (d.sku, d.qty)\nRETURNING merge_action(), d.sku,\n          old.qty AS old_qty, new.qty AS new_qty;`, tag: 'MERGE 3', versions: s6, issued: 5, burned: [3],
      ret: { fields: ['merge_action', 'sku', 'old_qty', 'new_qty'], rows: [['UPDATE', 'apple', 7, 11], ['INSERT', 'kiwi', null, 9], ['DELETE', 'pear', 7, null]] } } },
  { title: 'A failed INSERT still burns an id', body: 'The CHECK constraint rejects the row, the statement rolls back and **no tuple is written**. But `nextval` already ran, and sequence advances are never undone: id **6** is gone. Live ids are now 1 and 5.',
    state: { sql: `INSERT INTO inventory (sku, qty)\nVALUES ('plum', -1);`, tag: 'ERROR', versions: s7, issued: 6, burned: [3, 6],
      error: 'new row for relation "inventory" violates check constraint "inventory_qty_check"' } },
]

const vTone = (v: Version): Tone => (v.status === 'new' ? 'new' : v.status === 'deleted' ? 'dead' : v.status === 'dead' ? 'dead' : 'tuple')

function VersionCard({ v, selected, onClick }: { v: Version; selected: boolean; onClick: () => void }) {
  const t = vTone(v)
  const gone = v.status === 'dead'
  return (
    <motion.button type="button" layout onClick={onClick} initial={{ opacity: 0, y: -8 }} animate={{ opacity: gone ? 0.55 : 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="w-full rounded-lg border px-2.5 py-1.5 text-left font-mono text-[12px]"
      style={{ borderColor: tone(t), background: toneBg(t, v.status === 'live' ? 10 : 16), outline: selected ? `2px solid ${tone(t)}` : 'none', outlineOffset: 1 }}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">lp {v.lp} <span className="text-muted">ctid (0,{v.lp})</span></span>
        <span className="text-[11px] text-muted">{v.status === 'new' ? 'written now' : v.status === 'deleted' ? 'xmax set now' : v.status === 'dead' ? 'dead version' : 'live'}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3">
        <span className={gone ? 'line-through' : ''}>({v.id}, '{v.sku}', {v.qty})</span>
        <span className="text-[11px]">xmin <b>{v.xmin}</b></span>
        <span className="text-[11px]" style={{ color: v.xmax && !v.lockOnly ? 'var(--t-dead)' : 'var(--muted)' }}>xmax <b>{v.xmax || '0'}</b>{v.lockOnly ? ' (lock only)' : ''}</span>
      </div>
    </motion.button>
  )
}

function SeqStrip({ issued, burned, versions }: { issued: number; burned: number[]; versions: Version[] }) {
  const live = new Set(versions.filter((v) => v.status === 'live' || v.status === 'new').map((v) => v.id))
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {Array.from({ length: 6 }, (_, k) => k + 1).map((id) => {
        const state = id > issued ? 'unused' : burned.includes(id) ? 'burned' : live.has(id) ? 'live' : 'deleted'
        const t: Tone = state === 'live' ? 'ok' : state === 'burned' ? 'dead' : state === 'deleted' ? 'muted' : 'muted'
        return (
          <motion.div key={id} layout className="flex min-w-0 flex-col items-center rounded-md border px-1 py-1 font-mono text-[11px]"
            style={{ borderColor: state === 'unused' ? 'var(--border)' : tone(t), background: state === 'unused' ? 'transparent' : toneBg(t, 14), opacity: state === 'unused' ? 0.5 : 1 }}>
            <span className="text-sm font-bold">{id}</span>
            <span className="text-muted">{state}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

function Inspector({ v }: { v?: Version }) {
  if (!v) return <Panel title="Inspector"><p className="text-sm text-muted">Click a row version.</p></Panel>
  const meaning = v.lockOnly ? 'row lock taken by the upsert, carried onto the new version; the tuple is live'
    : v.xmax ? `deleted or replaced by xid ${v.xmax}; invisible to snapshots that see ${v.xmax} as committed` : 'no deleter: visible to every snapshot that sees its xmin'
  return (
    <Panel title={`Version at ctid (0,${v.lp}): (${v.id}, '${v.sku}', ${v.qty})`}>
      <FieldTable rows={[
        ['t_xmin', String(v.xmin), 'transaction that wrote this version'],
        ['t_xmax', String(v.xmax), meaning],
      ]} />
    </Panel>
  )
}

function DmlViz() {
  const [sel, setSel] = useState<number | null>(null)
  return (
    <Stepper steps={steps} interval={3400} render={(s, i) => {
      const focus = s.versions.find((v) => v.status === 'new' || v.status === 'deleted')
      const selected = s.versions.find((v) => v.lp === sel) ?? focus
      return (
        <div className="grid gap-3">
          <Legend items={[['tuple', 'live version'], ['new', 'written by this statement'], ['dead', 'xmax set (dead once committed)'], ['ok', 'id in use'], ['muted', 'id deleted / unused']]} />
          <div className="grid gap-3 md:grid-cols-[1fr_1.05fr]">
            <div className="grid content-start gap-2">
              <Sql>{s.sql}</Sql>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">command tag
                <AnimatePresence mode="wait"><motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Tag t={s.error ? 'dead' : 'pointer'}>{s.tag}</Tag></motion.span></AnimatePresence>
              </div>
              {s.error && <p className="rounded-lg border px-3 py-2 font-mono text-[12px]" style={{ borderColor: tone('dead'), background: toneBg('dead', 10) }}>ERROR: {s.error}</p>}
              {s.ret && <ResultTable caption="RETURNING" fields={s.ret.fields} rows={s.ret.rows.map((r, k) => ({ key: `${i}-${k}`, cells: r }))} />}
              <Panel title="identity sequence: ids handed out by nextval">
                <SeqStrip issued={s.issued} burned={s.burned} versions={s.versions} />
              </Panel>
            </div>
            <div className="grid content-start gap-2">
              <Panel title={`heap page 0 — ${s.versions.length} tuple${s.versions.length === 1 ? '' : 's'}, ${s.versions.filter((v) => v.status === 'live' || v.status === 'new').length} live`}>
                <div className="grid gap-1.5">
                  {s.versions.length === 0 && <p className="text-sm text-muted">Empty page.</p>}
                  {s.versions.map((v) => <VersionCard key={v.lp} v={v} selected={selected?.lp === v.lp} onClick={() => setSel(v.lp)} />)}
                </div>
              </Panel>
              <Inspector v={selected} />
            </div>
          </div>
        </div>
      )
    }} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'dml-lifecycle',
  module: 'm3',
  order: 1,
  title: 'INSERT, UPDATE, DELETE, MERGE: what really happens',
  tldr: [
    'Every write in PostgreSQL appends or stamps **row versions**: INSERT adds a tuple, DELETE sets its `xmax`, and UPDATE does both, while `RETURNING` hands the affected rows (old and new, in 18) straight back.',
    'Knowing this explains real behaviour you will meet: why updates bloat tables, why an upsert burns sequence values, and why MERGE and `ON CONFLICT` are not interchangeable.',
  ],
  visualizer: {
    title: 'Eight statements, one heap page',
    caption: 'Step through real statements and watch row versions, the RETURNING output and the identity sequence. Click a version to inspect its `xmin`/`xmax`. Note the xids: one statement, one transaction, even when MERGE does three different things.',
    Component: DmlViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE inventory (
  id  int GENERATED ALWAYS AS IDENTITY,
  sku text PRIMARY KEY,
  qty int NOT NULL CHECK (qty >= 0)
);
ALTER TABLE inventory SET (autovacuum_enabled = false);
INSERT INTO inventory (sku, qty) VALUES ('apple', 10), ('pear', 5);
CREATE TABLE delivery (sku text, qty int);
INSERT INTO delivery VALUES ('apple', 4), ('kiwi', 9), ('pear', -7);
CREATE TABLE recalls (sku text);
INSERT INTO recalls VALUES ('kiwi');
CREATE TABLE inventory_archive (LIKE inventory, archived_at timestamptz DEFAULT now());
-- runs a statement and returns its error instead of failing, so presets can show errors
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'UPDATE makes a new version', sql: `UPDATE inventory SET qty = qty - 3 WHERE sku = 'apple';

SELECT lp, t_xmin AS xmin, t_xmax AS xmax, t_ctid
FROM heap_page_items(get_raw_page('inventory', 0));`,
        note: 'Three tuples for two rows. The old apple (lp 1) has `xmax` set and `t_ctid` pointing at its replacement, lp 3.' },
      { label: 'RETURNING old and new', sql: `UPDATE inventory SET qty = qty + 1
RETURNING sku, old.qty AS before, new.qty AS after, new.qty - old.qty AS delta;

-- a no-op UPDATE still writes a new version; rename old/new if they clash
UPDATE inventory SET qty = qty WHERE sku = 'apple'
RETURNING WITH (OLD AS o, NEW AS n)
  o.ctid AS old_ctid, n.ctid AS new_ctid, o.qty AS o_qty, n.qty AS n_qty;

DELETE FROM inventory WHERE sku = 'pear'
RETURNING old.*, new.sku AS new_sku;`,
        note: 'For UPDATE both sides are filled. `SET qty = qty` changes nothing, yet the row moves to a new ctid: every UPDATE writes a version. `WITH (OLD AS o, NEW AS n)` renames the qualifiers, which you need inside trigger functions. For DELETE `new.*` is NULL. Always alias `old.x` and `new.x`: two output columns both named `qty` collide in most clients.' },
      { label: 'Upsert and the sequence gap', sql: `INSERT INTO inventory (sku, qty) VALUES ('apple', 2), ('fig', 7)
ON CONFLICT (sku) DO UPDATE SET qty = inventory.qty + EXCLUDED.qty
RETURNING id, sku, old.qty AS old_qty, new.qty AS new_qty,
          (old.id IS NOT NULL) AS was_update,
          (xmax = 0) AS inserted_pre18;

SELECT id, sku, qty FROM inventory ORDER BY id;
SELECT last_value FROM inventory_id_seq;`,
        note: 'apple is updated (old values present), fig is inserted. The sequence advanced for both proposed rows, so fig gets a higher id than you might expect: one value was burned on apple. Both paths report `INSERT 0 n`; `old.id IS NOT NULL` tells them apart. Before 18 the usual trick was `xmax = 0`: an inserted row has no xmax, an updated one carries the upsert\'s lock.' },
      { label: 'MERGE + merge_action()', sql: `MERGE INTO inventory i
USING delivery d ON i.sku = d.sku
WHEN MATCHED AND i.qty + d.qty <= 0 THEN DELETE
WHEN MATCHED THEN UPDATE SET qty = i.qty + d.qty
WHEN NOT MATCHED AND d.qty > 0 THEN INSERT (sku, qty) VALUES (d.sku, d.qty)
RETURNING merge_action() AS action, d.sku, old.qty AS old_qty, new.qty AS new_qty;`,
        note: 'One row per action taken. Rows that match no WHEN clause are silently skipped. After the earlier presets pear is already gone, so it shows up as NOT MATCHED and is skipped (its delta is negative).' },
      { label: 'Cardinality violations', sql: `-- the same key twice in one upsert
SELECT try_sql($q$
  INSERT INTO inventory (sku, qty) VALUES ('kiwi', 1), ('kiwi', 2)
  ON CONFLICT (sku) DO UPDATE SET qty = EXCLUDED.qty $q$) AS upsert;

-- one target row matching two source rows
SELECT try_sql($q$
  MERGE INTO inventory i
  USING (VALUES ('apple', 1), ('apple', 2)) AS d(sku, qty) ON i.sku = d.sku
  WHEN MATCHED THEN UPDATE SET qty = i.qty + d.qty $q$) AS merge;`,
        note: 'Both fail with SQLSTATE `21000`. DO UPDATE and MERGE refuse to change one row twice in a statement. `UPDATE … FROM` would silently apply just one match.' },
      { label: 'One transaction, one xid, one clock', sql: `BEGIN;
SELECT pg_current_xact_id_if_assigned() AS xid_before_any_write;
INSERT INTO inventory (sku, qty) VALUES ('lime', 3), ('plum', 4)
RETURNING id, sku, xmin, now() AS tx_clock;
SELECT pg_current_xact_id() AS xid, now() AS tx_clock_again, clock_timestamp() AS wall_clock;
ROLLBACK;

SELECT count(*) FILTER (WHERE sku IN ('lime', 'plum')) AS rows_kept,
       (SELECT last_value FROM inventory_id_seq) AS seq_last_value
FROM inventory;

SELECT try_sql($q$ INSERT INTO inventory (sku, qty) VALUES ('plum', -1) $q$) AS check_failure;
SELECT last_value FROM inventory_id_seq;`,
        note: 'A read-only transaction has **no xid** (NULL) until its first write. Both rows share one `xmin`. `now()` is frozen at transaction start, so it repeats exactly in the second statement; only `clock_timestamp()` keeps moving. After ROLLBACK the rows are gone but the ids are not given back, and the failed CHECK insert burns one more.' },
      { label: 'UPDATE … FROM and DELETE … USING', sql: `-- join another table into an UPDATE (FROM) or a DELETE (USING)
UPDATE inventory i SET qty = i.qty + d.qty
FROM delivery d
WHERE d.sku = i.sku AND d.qty > 0
RETURNING i.sku, old.qty AS before, new.qty AS after;

-- the SET target cannot be table-qualified
SELECT try_sql($q$ UPDATE inventory i SET i.qty = 0 FROM delivery d WHERE d.sku = i.sku $q$) AS qualified_set;

DELETE FROM inventory i
USING recalls r
WHERE r.sku = i.sku
RETURNING old.sku, old.qty;`,
        note: 'FROM and USING are the same idea: extra tables joined into the write. `SET i.qty = …` fails (`42703`) because a qualified name after SET means a field of a composite column; write `SET qty = …`. Rows with no match in the joined table are not touched. Forgetting the join condition would pair every target row with every source row.' },
      { label: 'Move rows with a CTE', sql: `WITH moved AS (
  DELETE FROM inventory WHERE qty < 12 RETURNING id, sku, qty
)
INSERT INTO inventory_archive (id, sku, qty)
SELECT id, sku, qty FROM moved
RETURNING *;`,
        note: 'DELETE and INSERT run in **one statement and one transaction**. The archive only ever receives what RETURNING passed along.' },
    ],
  },
  production: {
    title: 'Idempotent stock ingestion for a warehouse feed',
    context: 'A warehouse system receives a CSV of stock deltas every five minutes. It loads them into a staging table with `COPY`, then applies them to `inventory(sku PK, qty)`.',
    problem: 'The first version ran SELECT, then INSERT or UPDATE, row by row. Two overlapping runs both saw "no row" for a new SKU and one failed with a unique violation. Feeds with the same SKU twice also crashed an `ON CONFLICT DO UPDATE` rewrite with `ON CONFLICT DO UPDATE command cannot affect row a second time`.',
    solution: 'Aggregate the staging rows per SKU first, so each key appears once, then apply them with one atomic upsert. Use RETURNING to write an audit row with the before and after quantities in the same statement.',
    sql: `WITH batch AS (
  SELECT sku, sum(qty) AS qty FROM staging_delivery GROUP BY sku
), applied AS (
  INSERT INTO inventory AS i (sku, qty)
  SELECT sku, qty FROM batch
  ON CONFLICT (sku) DO UPDATE SET qty = i.qty + EXCLUDED.qty
  RETURNING i.sku, old.qty AS before, new.qty AS after
)
INSERT INTO stock_audit (sku, before, after, at)
SELECT sku, before, after, now() FROM applied;`,
    outcome: 'One statement per batch, no read-then-write race (ON CONFLICT guarantees an atomic insert-or-update), and a complete audit trail. Expect gaps in `inventory.id`: every conflicting row still consumed a sequence value. That is harmless for a surrogate key.',
  },
  pitfalls: [
    { title: 'Expecting gapless ids from a sequence',
      symptom: 'Invoice numbers jump from 1041 to 1043 and auditors ask where 1042 went.',
      cause: '`nextval` is never rolled back. Aborted transactions, failed constraint checks, upserts that hit a conflict and crashes all consume values.',
      fix: 'Use identity/sequence values only as surrogate keys. If you need a gapless business number, allocate it from a counter row updated inside the same transaction (`UPDATE counters SET n = n + 1 … RETURNING n`), and accept that this serializes writers.' },
    { title: 'UPDATE … FROM silently picks one match',
      symptom: 'A price sync from a feed with duplicate SKUs leaves random prices: re-running it gives different results.',
      cause: 'When a target row joins to several FROM rows, UPDATE applies **one** of them, and which one is not predictable. No error is raised.',
      fix: 'Deduplicate the source first (`DISTINCT ON (sku) … ORDER BY sku, updated_at DESC`), or use MERGE, which raises a cardinality violation instead of guessing.' },
    { title: 'One huge UPDATE bloats the table',
      symptom: 'After `UPDATE events SET processed = true` on 50 M rows, the table doubles in size and replicas lag for an hour.',
      cause: 'Every updated row writes a **new version**, and the old ones stay until VACUUM. One statement also holds its row locks to the end.',
      fix: 'Batch it: a CTE selects `ctid`s with `ORDER BY … FOR UPDATE LIMIT 5000`, the UPDATE joins on `ctid`, and the loop repeats with VACUUM between batches.',
      sql: `WITH batch AS (
  SELECT ctid FROM events WHERE NOT processed
  ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 5000)
UPDATE events e SET processed = true
FROM batch WHERE e.ctid = batch.ctid;` },
    { title: 'UPDATE or DELETE without WHERE',
      symptom: 'A one-row fix reports `UPDATE 4` (or `UPDATE 50000`) and every row now has the same value.',
      cause: 'Without WHERE the statement applies to every row. The command tag is the only warning, and with autocommit the change is already committed when you read it.',
      fix: 'Run ad-hoc fixes inside `BEGIN`, check the tag (and `RETURNING`), then COMMIT or ROLLBACK. Write the WHERE clause first.',
      sql: `BEGIN;
UPDATE regions SET population = 1.002 WHERE name = 'Americas';  -- expect UPDATE 1
-- tag says UPDATE 1? COMMIT;  anything else? ROLLBACK;` },
    { title: 'Get-or-create with a no-op DO UPDATE',
      symptom: 'A "find or insert" endpoint makes a hot table bloat, although almost every call finds an existing row.',
      cause: '`ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id` returns the row, but every call writes a **new row version** (new ctid, a dead tuple, WAL, maybe index entries). Both forms of ON CONFLICT also burn a sequence value per call.',
      fix: 'Use `DO NOTHING RETURNING id` and fall back to a SELECT when nothing came back. Under concurrency the fallback SELECT can miss a row committed after the statement\'s snapshot, so retry once. `DO NOTHING` still consumes one sequence value per call (the default is computed before the conflict check), so on a hot path SELECT first and INSERT only on a miss, or use a `bigint` key.',
      sql: `WITH ins AS (
  INSERT INTO users (email) VALUES ($1)
  ON CONFLICT (email) DO NOTHING RETURNING id)
SELECT id FROM ins
UNION ALL
SELECT id FROM users WHERE email = $1 AND NOT EXISTS (SELECT 1 FROM ins);` },
    { title: 'Treating MERGE as a concurrency-safe upsert',
      symptom: 'Two sessions MERGE the same new key at once and one fails with a unique violation.',
      cause: 'A common claim is that MERGE and upsert are equivalent. They are not under concurrency. MERGE follows the normal isolation rules: both sessions see NOT MATCHED and both INSERT. Only `INSERT … ON CONFLICT` re-checks the arbiter index and switches to UPDATE.',
      fix: 'Use `INSERT … ON CONFLICT DO UPDATE` for concurrent upserts. Use MERGE for batch synchronisation, where you need DELETE or `NOT MATCHED BY SOURCE`.' },
  ],
  pointers: [
    'INSERT writes a tuple, DELETE sets its **xmax**, UPDATE does both: the old version stays until VACUUM ([snapshots and visibility](/m5/snapshots-visibility)).',
    '`RETURNING` works on all four commands; PostgreSQL 18 adds `old.*` and `new.*` (old is NULL for INSERT, new is NULL for DELETE).',
    '`ON CONFLICT (cols)` infers its **arbiter** unique index; `EXCLUDED` is the proposed row; DO UPDATE never touches one row twice.',
    'MERGE gives each candidate row one status and runs the **first** matching WHEN clause; `merge_action()` tells you which.',
    'Sequences are **not gapless**: upserts, failed inserts and rollbacks all burn values. For bulk loads, `COPY` moves many rows in one command and one transaction, far faster than row-by-row INSERTs; it has no `ON CONFLICT`, so load a staging table and [upsert](/f4/upsert-dedup) from there.',
  ],
  sources: ['dml-insert.html', 'dml-update.html', 'dml-delete.html', 'dml-returning.html', 'sql-insert.html', 'sql-update.html', 'sql-merge.html', 'functions-merge-support.html', 'functions-sequence.html', 'sql-copy.html'],
}
