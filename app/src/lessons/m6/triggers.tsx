import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Chip, TRY_SQL } from './_shared'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the firing order of every trigger for one UPDATE statement on a 3-row table.
 * The event sequence is generated from the toggles by a small model of the executor:
 *   BEFORE STATEMENT → per row: BEFORE ROW triggers in name order (NULL skips the row) → heap update →
 *   AFTER ROW WHEN check (queue or not) → end of statement: drain AFTER ROW queue → AFTER STATEMENT
 *   with transition tables.
 * With the default toggles the sequence matches, line for line, the trigger_log captured from
 * PostgreSQL 18.6 (PGlite) for `UPDATE inventory SET qty = qty - 5` (see the first preset).
 * ---------------------------------------------------------------------------------------------- */

type Stmt = 'minus5' | 'noop' | 'none'
interface Row { sku: string; qty: number }
const ROWS: Row[] = [{ sku: 'A-1', qty: 10 }, { sku: 'B-2', qty: 3 }, { sku: 'C-3', qty: 7 }]

type Lane = 'stmt' | 'before' | 'heap' | 'queue' | 'after'
interface Ev { lane: Lane; trg: string; text: string; t: Tone }
interface RowState { sku: string; old: number; neu: number; status: 'pending' | 'updated' | 'skipped'; touched: boolean }
interface S { ev: Ev[]; rows: RowState[]; queue: string[]; drained: string[]; trans?: { old: Row[]; neu: Row[] } }

function simulate(stmt: Stmt, guard: boolean, when: boolean, renamed: boolean): Step<S>[] {
  const touchName = renamed ? 'z_touch' : 'b_touch'
  const before = [touchName, ...(guard ? ['c_guard'] : [])].sort()
  const rows: RowState[] = ROWS.map((r) => ({ sku: r.sku, old: r.qty, neu: r.qty, status: 'pending', touched: false }))
  const targets = stmt === 'none' ? [] : rows
  const ev: Ev[] = []
  const queue: string[] = []
  const drained: string[] = []
  const steps: Step<S>[] = []
  const snap = (title: string, body: string, trans?: S['trans']) =>
    steps.push({ title, body, state: { ev: [...ev], rows: rows.map((r) => ({ ...r })), queue: [...queue], drained: [...drained], trans } })

  const sql = stmt === 'minus5' ? 'UPDATE inventory SET qty = qty - 5' : stmt === 'noop' ? 'UPDATE inventory SET qty = qty' : 'UPDATE inventory SET qty = 1 WHERE false'
  ev.push({ lane: 'stmt', trg: 'a_before_stmt', text: 'BEFORE STATEMENT', t: 'header' })
  snap('BEFORE STATEMENT: a_before_stmt', `\`${sql}\` starts. Statement-level BEFORE triggers fire **once, before any row is touched**, and see none of the statement's changes.`)

  for (const r of targets) {
    r.neu = stmt === 'minus5' ? r.old - 5 : r.old
    let skipped = false
    for (const name of before) {
      if (name.endsWith('touch')) {
        r.touched = true
        ev.push({ lane: 'before', trg: name, text: `${r.sku}: NEW.updated_at := now()`, t: 'tuple' })
        snap(`BEFORE ROW ${name} on ${r.sku}`, `Row ${r.sku} is about to change (qty ${r.old} → ${r.neu}). \`${name}\` edits **NEW** and returns it, so the edited row is what the next trigger receives.`)
      } else if (r.neu < 0) {
        skipped = true
        r.status = 'skipped'
        r.touched = false
        ev.push({ lane: 'before', trg: name, text: `${r.sku}: qty ${r.neu} < 0 → RETURN NULL`, t: 'dead' })
        snap(`BEFORE ROW ${name} on ${r.sku}: skipped`, `Returning **NULL** from a BEFORE ROW trigger silently skips this row. ${before.indexOf(name) < before.length - 1 ? 'The remaining BEFORE triggers for it never run. ' : ''}Any edits earlier triggers made to NEW are thrown away, and no AFTER event is queued.`)
        break
      } else {
        ev.push({ lane: 'before', trg: name, text: `${r.sku}: ok → RETURN NEW`, t: 'muted' })
        snap(`BEFORE ROW ${name} on ${r.sku}`, `\`${name}\` checks the row and returns NEW unchanged. Same-event triggers always fire in **alphabetical order** of their names.`)
      }
    }
    if (skipped) continue
    r.status = 'updated'
    const changed = r.old !== r.neu
    const queued = !when || changed
    ev.push({ lane: 'heap', trg: 'heap', text: `${r.sku}: new version written`, t: 'new' })
    if (queued) queue.push(r.sku)
    ev.push({ lane: 'queue', trg: 'd_audit', text: queued ? `${r.sku}: event queued` : `${r.sku}: WHEN false, not queued`, t: queued ? 'pointer' : 'muted' })
    snap(`Row ${r.sku} updated, AFTER event ${queued ? 'queued' : 'not queued'}`, when
      ? `The new row version is written. **d_audit**'s \`WHEN (OLD.qty IS DISTINCT FROM NEW.qty)\` is evaluated *right now*: ${changed ? 'true, so an event joins the AFTER queue' : 'false, so nothing is queued and the row is never re-fetched'}.`
      : `The new row version is written. Without a WHEN clause, every updated row queues an AFTER ROW event, even if nothing actually changed.`)
  }

  for (const sku of [...queue]) {
    queue.shift()
    drained.push(sku)
    const r = rows.find((x) => x.sku === sku)!
    ev.push({ lane: 'after', trg: 'd_audit', text: `${sku}: audit ${r.old}→${r.neu}`, t: 'pointer' })
    snap(`AFTER ROW d_audit for ${sku}`, `Queued AFTER ROW events run **at the end of the statement**, in queue order. They see the final state of every row the statement changed.`)
  }

  const upd = rows.filter((r) => r.status === 'updated')
  const trans = { old: upd.map((r) => ({ sku: r.sku, qty: r.old })), neu: upd.map((r) => ({ sku: r.sku, qty: r.neu })) }
  const delta = upd.reduce((s, r) => s + r.neu - r.old, 0)
  ev.push({ lane: 'stmt', trg: 'e_summary', text: `old_rows=${upd.length} new_rows=${upd.length} delta=${delta}`, t: 'header' })
  snap('AFTER STATEMENT: e_summary with transition tables', `Last of all, the statement trigger reads **old_rows** and **new_rows**: ${upd.length} row${upd.length === 1 ? '' : 's'} each${stmt === 'none' ? '. It fires even though **zero rows** matched' : `, total qty change ${delta}`}. One set-based call instead of one call per row.`, trans)
  return steps
}

const LANES: [Lane, string][] = [['stmt', 'statement'], ['before', 'BEFORE ROW'], ['heap', 'heap'], ['queue', 'AFTER queue'], ['after', 'AFTER ROW']]

function Timeline({ s, total }: { s: S; total: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
      <div className="grid min-w-[620px] gap-1" style={{ gridTemplateColumns: `92px repeat(${Math.max(total, 1)}, minmax(0, 1fr))` }}>
        {LANES.map(([lane, label]) => (
          <div key={lane} className="contents">
            <div className="flex items-center text-[10.5px] font-semibold tracking-wide text-muted uppercase">{label}</div>
            {Array.from({ length: total }, (_, i) => s.ev[i]).map((e, i) => (
              <div key={i} className="h-7">
                {e && e.lane === lane && (
                  <motion.div layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    title={`${e.trg}: ${e.text}`}
                    className="grid h-full place-items-center rounded font-mono text-[10px] font-bold"
                    style={{ background: toneBg(e.t, i === s.ev.length - 1 ? 40 : 20), border: `1px solid ${tone(e.t)}`, color: 'var(--text)' }}>
                    {i + 1}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function TriggersViz() {
  const [stmt, setStmt] = useState<Stmt>('minus5')
  const [guard, setGuard] = useState(true)
  const [when, setWhen] = useState(true)
  const [renamed, setRenamed] = useState(false)
  const steps = useMemo(() => simulate(stmt, guard, when, renamed), [stmt, guard, when, renamed])
  const key = `${stmt}${guard}${when}${renamed}`
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Statement" value={stmt} onChange={setStmt} options={[['minus5', 'qty = qty - 5'], ['noop', 'qty = qty (no-op)'], ['none', 'WHERE false']]} />
        <Chip on={guard} onClick={() => setGuard(!guard)} t="dead">c_guard rejects qty &lt; 0</Chip>
        <Chip on={when} onClick={() => setWhen(!when)} t="pointer">d_audit has WHEN</Chip>
        <Chip on={renamed} onClick={() => setRenamed(!renamed)} t="tuple">rename b_touch → z_touch</Chip>
      </div>
      <Stepper key={key} steps={steps} interval={2000} render={(s) => (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <Legend items={[['header', 'statement trigger'], ['tuple', 'BEFORE edits NEW'], ['muted', 'BEFORE returns NEW'], ['dead', 'RETURN NULL: row skipped'], ['new', 'row written'], ['pointer', 'AFTER event']]} />
          <Timeline s={s} total={steps[steps.length - 1].state.ev.length} />
          <div className="grid max-h-56 gap-0.5 overflow-y-auto rounded-lg border border-line bg-bg px-2 py-1.5 font-mono text-[11.5px] scrollbar-thin">
            {s.ev.filter((e) => e.lane !== 'heap' && e.lane !== 'queue').map((e, i, arr) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2" style={{ fontWeight: i === arr.length - 1 ? 700 : 400 }}>
                <span className="w-5 text-right text-muted">{i + 1}</span><span className="w-28 shrink-0" style={{ color: tone(e.t === 'muted' ? 'ok' : e.t) }}>{e.trg}</span><span>{e.text}</span>
              </motion.div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
            <Panel title="inventory rows">
              <div className="grid gap-1.5">
                {s.rows.map((r) => {
                  const t: Tone = r.status === 'skipped' ? 'dead' : r.status === 'updated' ? 'new' : 'muted'
                  return (
                    <motion.div key={r.sku} layout className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 font-mono text-[12px]" style={{ borderColor: tone(t), background: toneBg(t, 12) }}>
                      <span><b>{r.sku}</b> qty {r.old}{r.status !== 'pending' || r.neu !== r.old ? ` → ${r.status === 'skipped' ? r.old : r.neu}` : ''}</span>
                      <span className="flex gap-1">{r.touched && r.status !== 'skipped' && <Tag t="tuple">updated_at set</Tag>}<Tag t={t}>{r.status}</Tag></span>
                    </motion.div>
                  )
                })}
              </div>
            </Panel>
            <Panel title="AFTER ROW event queue → fired">
              <div className="flex min-h-8 flex-wrap items-center gap-1.5">
                <AnimatePresence>
                  {s.queue.map((q) => <motion.span key={`q${q}`} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}><Tag t="pointer">d_audit({q})</Tag></motion.span>)}
                </AnimatePresence>
                {s.queue.length === 0 && <span className="text-xs text-muted">queue empty</span>}
              </div>
              <p className="mt-2 text-xs text-muted">Fired: {s.drained.length ? s.drained.map((d) => `d_audit(${d})`).join(', ') : 'none yet'}</p>
              {s.trans && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11.5px]">
                  <div><p className="text-[10.5px] font-semibold text-muted uppercase">old_rows</p>{s.trans.old.map((r) => <div key={r.sku}>{r.sku} {r.qty}</div>)}{!s.trans.old.length && <div className="text-muted">(empty)</div>}</div>
                  <div><p className="text-[10.5px] font-semibold text-muted uppercase">new_rows</p>{s.trans.neu.map((r) => <div key={r.sku}>{r.sku} {r.qty}</div>)}{!s.trans.neu.length && <div className="text-muted">(empty)</div>}</div>
                </motion.div>
              )}
            </Panel>
          </div>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const FUNCS = `
CREATE TABLE inventory (sku text PRIMARY KEY, qty int NOT NULL, updated_at timestamptz);
INSERT INTO inventory VALUES ('A-1', 10, NULL), ('B-2', 3, NULL), ('C-3', 7, NULL);
CREATE TABLE trigger_log (n serial, trg text, lvl text, detail text);

CREATE FUNCTION log_stmt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO trigger_log (trg, lvl, detail) VALUES (TG_NAME, TG_WHEN || ' ' || TG_LEVEL, TG_OP);
  RETURN NULL;
END $$;

CREATE FUNCTION touch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  INSERT INTO trigger_log (trg, lvl, detail)
  VALUES (TG_NAME, TG_WHEN || ' ' || TG_LEVEL, NEW.sku || ' qty ' || OLD.qty || '->' || NEW.qty);
  RETURN NEW;
END $$;

CREATE FUNCTION guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.qty < 0 THEN
    INSERT INTO trigger_log (trg, lvl, detail) VALUES (TG_NAME, TG_WHEN || ' ' || TG_LEVEL, NEW.sku || ' skipped (RETURN NULL)');
    RETURN NULL;
  END IF;
  INSERT INTO trigger_log (trg, lvl, detail) VALUES (TG_NAME, TG_WHEN || ' ' || TG_LEVEL, NEW.sku || ' ok');
  RETURN NEW;
END $$;

CREATE FUNCTION audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO trigger_log (trg, lvl, detail) VALUES (TG_NAME, TG_WHEN || ' ' || TG_LEVEL, NEW.sku || ' ' || OLD.qty || '->' || NEW.qty);
  RETURN NULL;
END $$;

CREATE FUNCTION summary() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO trigger_log (trg, lvl, detail)
  SELECT TG_NAME, TG_WHEN || ' ' || TG_LEVEL,
         'old_rows=' || (SELECT count(*) FROM old_rows) || ' new_rows=' || (SELECT count(*) FROM new_rows)
         || ' delta=' || coalesce((SELECT sum(qty) FROM new_rows) - (SELECT sum(qty) FROM old_rows), 0);
  RETURN NULL;
END $$;

CREATE TRIGGER a_before_stmt BEFORE UPDATE ON inventory FOR EACH STATEMENT EXECUTE FUNCTION log_stmt();
CREATE TRIGGER b_touch BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION touch();
CREATE TRIGGER c_guard BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION guard();
CREATE TRIGGER d_audit AFTER UPDATE ON inventory FOR EACH ROW
  WHEN (OLD.qty IS DISTINCT FROM NEW.qty) EXECUTE FUNCTION audit();
CREATE TRIGGER e_summary AFTER UPDATE ON inventory
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION summary();`

export const lesson: Lesson = {
  slug: 'triggers',
  module: 'm6',
  order: 2,
  title: 'Triggers',
  tldr: [
    'A **trigger** binds a function returning `trigger` to INSERT, UPDATE, DELETE or TRUNCATE on a table or view, firing BEFORE, AFTER or INSTEAD OF the change, once per row or once per statement.',
    'Triggers let the database itself enforce rules, stamp columns, write audit trails and maintain derived data, so every client gets the same behaviour no matter which code path issued the write.',
  ],
  visualizer: {
    title: 'Every trigger for one UPDATE, in firing order',
    caption: 'Step through one UPDATE on three rows. Flip the toggles to skip a row, drop the WHEN clause, rename a trigger or change the statement, and watch the order change. With the default toggles the steps match, line for line, the `trigger_log` the first preset writes.',
    Component: TriggersViz,
  },
  playground: {
    setup: FUNCS + TRY_SQL,
    presets: [
      { label: 'Firing order log', sql: `UPDATE inventory SET qty = qty - 5;

SELECT n, trg, lvl, detail FROM trigger_log ORDER BY n;
SELECT sku, qty, updated_at IS NOT NULL AS touched FROM inventory ORDER BY sku;`,
        note: 'Ten log lines: statement BEFORE, then b_touch and c_guard per row (alphabetical), the two queued `d_audit` events at the end, and finally `e_summary` with `old_rows=2 new_rows=2 delta=-10`. B-2 was skipped, so it keeps qty 3 and no `updated_at`.' },
      { label: 'No-op and zero-row updates', sql: `TRUNCATE trigger_log;
UPDATE inventory SET qty = qty WHERE sku = 'A-1';
UPDATE inventory SET qty = 1 WHERE false;

SELECT n, trg, lvl, detail FROM trigger_log ORDER BY n;`,
        note: 'The no-op update runs both BEFORE ROW triggers but `d_audit` never fires: its **WHEN** is false, so nothing was queued. The `WHERE false` update still fires both **statement** triggers, with empty transition tables.' },
      { label: 'Trigger calls in EXPLAIN', sql: `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
UPDATE inventory SET qty = qty + 1;`,
        note: 'EXPLAIN ANALYZE ends with one `Trigger …: calls=N` line per trigger. Row triggers show calls=3; statement triggers show calls=1.' },
      { label: 'Catalog: pg_trigger', sql: `SELECT tgname, tgtype, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'inventory'::regclass
ORDER BY tgname;`,
        note: '`tgtype` is a bitmask: 1 = ROW, 2 = BEFORE, 16 = UPDATE. So 19 = BEFORE UPDATE FOR EACH ROW, 17 = AFTER ROW, 18 = BEFORE STATEMENT, 16 = AFTER STATEMENT.' },
      { label: 'INSTEAD OF on a join view', sql: `CREATE TABLE stock_moves (id serial PRIMARY KEY, sku text REFERENCES inventory, delta int, at timestamptz DEFAULT now());
CREATE VIEW sku_moves AS
  SELECT m.id, m.sku, m.delta, i.qty AS qty_now FROM stock_moves m JOIN inventory i USING (sku);

-- Version 1: does the work, then returns NULL.
CREATE FUNCTION sku_moves_ins() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO stock_moves (sku, delta) VALUES (NEW.sku, NEW.delta) RETURNING id INTO NEW.id;
  UPDATE inventory SET qty = qty + NEW.delta WHERE sku = NEW.sku;
  RETURN NULL;
END $$;
CREATE TRIGGER sku_moves_ins INSTEAD OF INSERT ON sku_moves FOR EACH ROW EXECUTE FUNCTION sku_moves_ins();
INSERT INTO sku_moves (sku, delta) VALUES ('C-3', 20) RETURNING id, sku, delta;

-- Version 2: same work, returns NEW.
CREATE OR REPLACE FUNCTION sku_moves_ins() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO stock_moves (sku, delta) VALUES (NEW.sku, NEW.delta) RETURNING id INTO NEW.id;
  UPDATE inventory SET qty = qty + NEW.delta WHERE sku = NEW.sku;
  RETURN NEW;
END $$;
INSERT INTO sku_moves (sku, delta) VALUES ('A-1', -1) RETURNING id, sku, delta;
SELECT * FROM sku_moves ORDER BY id;`,
        note: 'A join view is not auto-updatable, so the **INSTEAD OF** row trigger decides what an INSERT means. Version 1 does the work but returns NULL: the insert reports **0 rows** and `RETURNING` comes back empty. Version 2 returns NEW (with the new id filled in), so the row counts and `RETURNING` shows it. Both moves landed in the view, and the UPDATE inside also fired every inventory trigger.' },
      { label: 'Gatekeeper: soft delete, no TRUNCATE', sql: `CREATE TABLE products (id int PRIMARY KEY, name text NOT NULL, active boolean NOT NULL DEFAULT true);
INSERT INTO products VALUES (1, 'Kettle', true), (2, 'Mug', true), (3, 'Teapot', true);

CREATE FUNCTION soft_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE products SET active = false WHERE id = OLD.id;
  RETURN NULL;              -- skip the real DELETE for this row
END $$;
CREATE TRIGGER soft_delete BEFORE DELETE ON products FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE FUNCTION no_truncate() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'TRUNCATE on % is not allowed', TG_TABLE_NAME; END $$;
CREATE TRIGGER no_truncate BEFORE TRUNCATE ON products FOR EACH STATEMENT EXECUTE FUNCTION no_truncate();

DELETE FROM products WHERE id = 1 RETURNING *;
SELECT * FROM products ORDER BY id;
SELECT try_sql('TRUNCATE products') AS truncate_attempt;
SELECT try_sql('CREATE TRIGGER t2 AFTER TRUNCATE ON products FOR EACH ROW EXECUTE FUNCTION no_truncate()') AS row_level_truncate;`,
        note: 'A BEFORE ROW trigger is a **gatekeeper**: raise to abort, edit NEW to transform, or return NULL to skip. Here the DELETE returns **no rows** and Kettle stays, marked inactive. TRUNCATE never visits rows, so it fires no DELETE triggers; only a **statement-level** TRUNCATE trigger (BEFORE or AFTER) can stop it.' },
      { label: 'Catalog peek: hidden FK triggers', sql: `SELECT c.relname AS on_table, t.tgname, t.tgfoid::regproc AS function, t.tgisinternal, t.tgenabled
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname IN ('inventory', 'stock_moves', 'products')
ORDER BY t.tgisinternal, c.relname, t.tgname;

SELECT event_object_table, trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'products';`,
        note: 'The `stock_moves.sku` foreign key is enforced by four internal **RI_ConstraintTrigger** rows (`tgisinternal = true`), two on each table. `ALTER TABLE … DISABLE TRIGGER ALL` switches those off too; `DISABLE TRIGGER USER` leaves them on. `information_schema.triggers` has one row per event and does not list TRUNCATE triggers at all.' },
      { label: 'Event trigger on DDL', sql: `CREATE TABLE ddl_log (at timestamptz DEFAULT now(), tag text, object text);
CREATE FUNCTION log_ddl() RETURNS event_trigger LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
    INSERT INTO ddl_log (tag, object) VALUES (r.command_tag, r.object_identity);
  END LOOP;
END $$;
CREATE EVENT TRIGGER log_ddl ON ddl_command_end EXECUTE FUNCTION log_ddl();

CREATE TABLE scratch (id int);
ALTER TABLE scratch ADD COLUMN note text;
CREATE INDEX ON scratch (id);
SELECT tag, object FROM ddl_log;`,
        note: 'Event triggers are per database and fire on **DDL**, not DML. `ddl_command_end` sees the finished command through `pg_event_trigger_ddl_commands()`.' },
    ],
  },
  production: {
    title: 'Auditing a bulk price update without one call per row',
    context: 'A catalogue team logged every price change through an `AFTER UPDATE … FOR EACH ROW` trigger that inserted one audit row per product.',
    problem: 'A nightly job updated millions of prices in one statement. The row trigger queued one AFTER event per row in memory, then ran its INSERT once per row, one function call and one plan execution each. The job time grew far beyond the UPDATE itself.',
    solution: 'Replace the row trigger with a **statement-level AFTER trigger with transition tables**. It runs once and writes the whole audit set with one `INSERT … SELECT` joining `old_rows` to `new_rows`. Keep a `WHEN`-style filter in that join so unchanged prices produce no audit rows.',
    sql: `CREATE FUNCTION audit_prices() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO price_audit (product_id, old_price, new_price, changed_at)
  SELECT n.id, o.price, n.price, now()
  FROM old_rows o JOIN new_rows n USING (id)
  WHERE o.price IS DISTINCT FROM n.price;
  RETURN NULL;
END $$;
CREATE TRIGGER audit_prices AFTER UPDATE ON products
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION audit_prices();`,
    outcome: 'On 100,000 rows the bare UPDATE took 386 ms, with the row trigger 937 ms, with the statement trigger 527 ms, writing the same 100,000 audit rows. EXPLAIN ANALYZE shows why: `Trigger audit_prices: calls=1` instead of `calls=100000`. Single-row updates from the app are still audited by the same trigger.',
  },
  pitfalls: [
    { title: 'An AFTER trigger that updates its own table',
      symptom: '`ERROR: stack depth limit exceeded`, or a statement that never finishes, after adding a trigger that "fixes up" a column.',
      cause: 'The trigger\'s UPDATE fires the same trigger again. PostgreSQL puts **no limit on cascade depth**: recursion is the trigger author\'s problem.',
      fix: 'Change the row in a **BEFORE** trigger by editing NEW (no extra UPDATE at all). If you must cascade, guard with `pg_trigger_depth()` or a WHEN clause that becomes false after the first pass.',
      sql: `CREATE TRIGGER fixup BEFORE UPDATE ON inventory FOR EACH ROW
  WHEN (pg_trigger_depth() = 0) EXECUTE FUNCTION touch();` },
    { title: 'A BEFORE trigger that forgets to return NEW',
      symptom: 'Inserts report `INSERT 0 0` and rows silently vanish, with no error anywhere.',
      cause: 'A row-level BEFORE trigger that falls off the end, or returns NULL, **skips the operation** for that row. In PL/pgSQL a missing RETURN is an error, but an early `RETURN NULL` in a branch is not.',
      fix: 'Return NEW for INSERT/UPDATE and OLD for DELETE on every path. Reserve `RETURN NULL` for rows you really mean to drop, and log when you do.' },
    { title: 'Relying on creation order',
      symptom: 'After a migration recreates triggers, a validation trigger starts running before the trigger that normalises data, and valid rows are rejected.',
      cause: 'Triggers for the same event on the same table fire in **alphabetical order by name**, not creation order (the SQL standard says creation order).',
      fix: 'Encode the order in the names, for example `10_normalize`, `20_validate`, `90_audit`.' },
    { title: 'Row triggers on bulk loads',
      symptom: 'A `COPY` or `INSERT … SELECT` of millions of rows runs many times slower than expected.',
      cause: 'Each row fires the function. AFTER ROW events are also held in memory until the end of the statement, and without WHEN each one re-fetches its row.',
      fix: 'Use statement triggers with transition tables, add `WHEN` to AFTER ROW triggers, or disable non-essential triggers for the load with `ALTER TABLE … DISABLE TRIGGER name` or `DISABLE TRIGGER USER`. `DISABLE TRIGGER ALL` also switches off the internal foreign-key triggers, so rows that break the FK load silently.' },
    { title: 'An INSTEAD OF trigger that returns NULL',
      symptom: 'Inserting through a join view works (the base tables change), but the client sees `INSERT 0 0`, `RETURNING` is empty, and an ORM reports that the save failed.',
      cause: 'For an INSTEAD OF row trigger, the return value says whether the row was processed. NULL means "nothing happened", so the command tag counts zero rows and RETURNING has nothing to return.',
      fix: 'Return NEW for INSERT and UPDATE (fill generated keys into NEW first) and OLD for DELETE. Also match the full key in UPDATE and DELETE branches, or one view row changes several base rows.',
      sql: `INSERT INTO stock_moves (sku, delta) VALUES (NEW.sku, NEW.delta)
  RETURNING id INTO NEW.id;
RETURN NEW;` },
    { title: 'A per-row trigger that maintains a summary row',
      symptom: 'A customer\'s second order fails with `duplicate key value violates unique constraint "customer_stats_pkey"`. A "check, then insert or update" version instead creates duplicates or drifts under concurrent inserts.',
      cause: 'An AFTER INSERT trigger that blindly INSERTs one summary row per parent works only for the first child. A read-then-write version (`SELECT count(*)`, then INSERT or UPDATE) races, because two transactions can both see zero rows.',
      fix: 'Make the write a single upsert, and gate repeat work with WHEN so re-running the same UPDATE does not double-count. Every writer then serialises on that one summary row, so keep the trigger short.',
      sql: `INSERT INTO customer_stats (customer_id, total_spent)
VALUES (NEW.customer_id, NEW.total)
ON CONFLICT (customer_id)
DO UPDATE SET total_spent = customer_stats.total_spent + EXCLUDED.total_spent;` },
  ],
  pointers: [
    'Order for one statement: **BEFORE STATEMENT → per row (BEFORE ROW in name order → write → queue AFTER) → AFTER ROW queue → AFTER STATEMENT**.',
    'BEFORE ROW can **edit NEW** or **return NULL to skip** the row. AFTER return values are ignored.',
    'Statement triggers fire **once per SQL statement** (not per transaction), **even when zero rows match**. The default granularity is FOR EACH STATEMENT.',
    'AFTER-trigger **WHEN** runs at write time and decides whether an event is queued at all: free filtering for bulk statements.',
    '**Transition tables** (`REFERENCING OLD TABLE … NEW TABLE …`) give AFTER triggers the whole changed set for set-based work.',
  ],
  sources: ['triggers.html', 'trigger-definition.html', 'trigger-datachanges.html', 'sql-createtrigger.html', 'plpgsql-trigger.html', 'event-triggers.html'],
}
