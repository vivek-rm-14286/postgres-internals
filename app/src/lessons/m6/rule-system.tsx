import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { MiniTable } from './_shared'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the rewriter applying the docs' log_shoelace rule (rules-update.html) in its five
 * documented steps, for three UPDATE statements. Final query texts, the EXPLAIN filter
 * `(6 <> sl_avail)` and the logged rows were checked against PostgreSQL 18.6 (PGlite) with the
 * playground schema below (the docs' shoelace data).
 * ---------------------------------------------------------------------------------------------- */

type Scn = 'avail' | 'color' | 'multi'
const SCN: Record<Scn, { sql: string; set: string; setVal: string; where: string; newAvail: string; newName: string; final: string; logged: string[]; updated: string[] }> = {
  avail: { sql: "UPDATE shoelace_data SET sl_avail = 6 WHERE sl_name = 'sl7'", set: 'sl_avail', setVal: '6', where: "shoelace_data.sl_name = 'sl7'", newAvail: '6', newName: 'shoelace_data.sl_name',
    final: '6 <> shoelace_data.sl_avail', logged: ['sl7'], updated: ['sl7'] },
  color: { sql: "UPDATE shoelace_data SET sl_color = 'green' WHERE sl_name = 'sl7'", set: 'sl_color', setVal: "'green'", where: "shoelace_data.sl_name = 'sl7'", newAvail: 'shoelace_data.sl_avail', newName: 'shoelace_data.sl_name',
    final: 'shoelace_data.sl_avail <> shoelace_data.sl_avail', logged: [], updated: ['sl7'] },
  multi: { sql: "UPDATE shoelace_data SET sl_avail = 0 WHERE sl_color = 'black'", set: 'sl_avail', setVal: '0', where: "shoelace_data.sl_color = 'black'", newAvail: '0', newName: 'shoelace_data.sl_name',
    final: '0 <> shoelace_data.sl_avail', logged: ['sl1', 'sl2', 'sl4'], updated: ['sl1', 'sl2', 'sl3', 'sl4'] },
}
const DATA: [string, number, string][] = [['sl1', 5, 'black'], ['sl2', 6, 'black'], ['sl3', 0, 'black'], ['sl4', 8, 'black'], ['sl5', 4, 'brown'], ['sl6', 0, 'brown'], ['sl7', 7, 'brown'], ['sl8', 1, 'brown']]

/** A piece of query text; `t` marks the part that changed in this step. */
type Seg = { s: string; t?: Tone }
interface S { phase: number; rtable: Seg[]; values: Seg[]; qual: Seg[]; out?: boolean; exec?: boolean }

function steps(k: Scn): Step<S>[] {
  const c = SCN[k]
  const vals0: Seg[] = [{ s: 'new.sl_name, new.sl_avail, current_user, current_timestamp' }]
  const rt1: Seg[] = [{ s: 'shoelace_data new, shoelace_data old' }, { s: ', shoelace_data shoelace_data', t: 'new' }]
  const q2: Seg[] = [{ s: 'new.sl_avail <> old.sl_avail', t: 'new' }]
  const q3: Seg[] = [{ s: 'new.sl_avail <> old.sl_avail' }, { s: ` AND ${c.where}`, t: 'new' }]
  const vals4: Seg[] = [{ s: c.newName, t: 'new' }, { s: ', ' }, { s: c.newAvail, t: 'new' }, { s: ', current_user, current_timestamp' }]
  const q4: Seg[] = [{ s: c.newAvail, t: 'new' }, { s: ' <> old.sl_avail' }, { s: ` AND ${c.where}` }]
  const q5: Seg[] = [{ s: c.newAvail }, { s: ' <> ' }, { s: 'shoelace_data.sl_avail', t: 'pointer' }, { s: ` AND ${c.where}` }]
  const rt5: Seg[] = [{ s: 'shoelace_data', t: 'pointer' }]
  const plain = (x: Seg[]): Seg[] => x.map((g) => (g.t === 'new' ? { s: g.s } : g))
  const newBody = k === 'color'
    ? '`sl_avail` is **not in the target list**, so `new.sl_avail` means the *unchanged* value `shoelace_data.sl_avail`. `new.sl_name` likewise becomes `shoelace_data.sl_name`.'
    : `\`new.sl_avail\` is in the target list, so it becomes the constant **${c.setVal}**. \`new.sl_name\` is not assigned, so it becomes \`shoelace_data.sl_name\` (an UPDATE's NEW defaults to OLD).`
  return [
    { title: 'The original query tree', body: `\`${c.sql}\`. Command type UPDATE, result relation \`shoelace_data\`, target list \`${c.set} = ${c.setVal}\`, qual \`${c.where.replace('shoelace_data.', '')}\`.`,
      state: { phase: 0, rtable: [], values: [], qual: [] } },
    { title: 'A rule matches: log_shoelace', body: 'The result relation and command type match an **ON UPDATE** rule. It is **ALSO** (not INSTEAD) and qualified, so the rewriter will produce the action tree **plus** the original tree. The action is a template stored in `pg_rewrite`.',
      state: { phase: 1, rtable: [{ s: 'shoelace_data new, shoelace_data old' }], values: vals0, qual: [] } },
    { title: 'Step 1: merge the range tables', body: "The original query's range table is appended to the rule action's. Now the action can refer to the very rows the UPDATE is about to change.",
      state: { phase: 2, rtable: rt1, values: vals0, qual: [] } },
    { title: "Step 2: add the rule's qualification", body: 'The rule\'s `WHERE new.sl_avail <> old.sl_avail` becomes the action\'s qual.',
      state: { phase: 3, rtable: rt1, values: vals0, qual: q2 } },
    { title: "Step 3: add the original query's qualification", body: `The original \`WHERE\` is ANDed in, so the action only looks at rows the UPDATE will touch.`,
      state: { phase: 4, rtable: rt1, values: vals0, qual: q3 } },
    { title: 'Step 4: replace NEW', body: newBody,
      state: { phase: 5, rtable: rt1, values: vals4, qual: q4 } },
    { title: 'Step 5: replace OLD', body: '`old.*` references point at the **result relation**, `shoelace_data`. The unused `old` and `new` entries drop out of the join tree.',
      state: { phase: 6, rtable: rt5, values: plain(vals4), qual: q5 } },
    { title: 'Output: two query trees, action first', body: 'For **ON UPDATE** and **ON DELETE** rules the actions run **before** the original query, so they still see the old row values. (For ON INSERT the original runs first.)',
      state: { phase: 7, rtable: rt5, values: plain(vals4), qual: q5, out: true } },
    { title: 'Execute', body: k === 'color' ? 'The qual compares `sl_avail` with itself, so it is never true: **no log row** for a colour-only change. One row is updated.'
      : k === 'multi' ? 'One `INSERT … SELECT` logs **3 rows** (sl3 already had 0, so its qual is false), then the UPDATE changes **4 rows**. Had the UPDATE run first, every qual would read `0 <> 0` and nothing would be logged.'
      : 'The INSERT logs **sl7 → 6**, then the UPDATE runs. EXPLAIN shows the substituted qual as `Filter: (6 <> sl_avail)` on the log insert.',
      state: { phase: 8, rtable: rt5, values: plain(vals4), qual: q5, out: true, exec: true } },
  ]
}

const Segs = ({ segs }: { segs: Seg[] }) => (
  <>{segs.map((g, i) => (
    <motion.span key={i + g.s} initial={g.t ? { opacity: 0 } : false} animate={{ opacity: 1 }} className="rounded px-0.5"
      style={g.t ? { background: toneBg(g.t, 22), color: tone(g.t) } : undefined}>{g.s}</motion.span>
  ))}</>
)

function RuleViz() {
  const [k, setK] = useState<Scn>('avail')
  const st = useMemo(() => steps(k), [k])
  const c = SCN[k]
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <Segmented label="Statement" value={k} onChange={setK} options={[['avail', 'SET sl_avail = 6'], ['color', "SET sl_color = 'green'"], ['multi', 'multi-row sl_avail = 0']]} />
      <Stepper key={k} steps={st} interval={2800} render={(s) => (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <Legend items={[['header', 'original query tree'], ['tuple', 'rule action tree'], ['new', 'changed this step'], ['pointer', 'now the result relation'], ['ok', 'logged row']]} />
          <div className="grid gap-3 md:grid-cols-2">
            <Panel title="original query tree">
              <motion.div layout className="rounded-md border p-2 font-mono text-[12px]" style={{ borderColor: tone('header'), background: toneBg('header', 10) }}>
                <FieldTable rows={[['command', 'UPDATE'], ['result rel', 'shoelace_data'], ['targetList', `${c.set} = ${c.setVal}`], ['qual', c.where]]} />
              </motion.div>
              {s.phase >= 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 font-mono text-[11.5px] text-muted">
                  pg_rewrite: <b className="text-ink">log_shoelace</b> · ev_type 2 (UPDATE) · is_instead f · qual new.sl_avail &lt;&gt; old.sl_avail
                </motion.div>
              )}
            </Panel>
            <Panel title="rule action tree">
              <AnimatePresence mode="wait">
                {s.phase === 0 ? (
                  <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-muted">No rule applied yet.</motion.p>
                ) : (
                  <motion.div key="act" layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid gap-1 rounded-md border p-2 font-mono text-[12px] leading-5" style={{ borderColor: tone('tuple'), background: toneBg('tuple', 10) }}>
                    <div><span className="text-muted">INSERT INTO</span> shoelace_log</div>
                    <div><span className="text-muted">VALUES</span> (<Segs segs={s.values} />)</div>
                    <div><span className="text-muted">FROM</span> <Segs segs={s.rtable} /></div>
                    {s.qual.length > 0 && <div><span className="text-muted">WHERE</span> <Segs segs={s.qual} /></div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </Panel>
          </div>
          {s.out && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border px-2 py-1.5 font-mono text-[12px]" style={{ borderColor: tone('tuple') }}><Tag t="tuple">1st</Tag> INSERT INTO shoelace_log … WHERE {c.final} AND {c.where}</div>
              <div className="rounded-md border px-2 py-1.5 font-mono text-[12px]" style={{ borderColor: tone('header') }}><Tag t="header">2nd</Tag> {c.sql}</div>
            </motion.div>
          )}
          <Panel title="shoelace_data">
            <MiniTable head={['sl_name', 'sl_avail', 'sl_color', 'outcome']}
              tones={DATA.map(([n]) => (s.exec && c.logged.includes(n) ? 'ok' : s.exec && c.updated.includes(n) ? 'header' : undefined))}
              rows={DATA.map(([n, a, col]) => [n, s.exec && c.updated.includes(n) && c.set === 'sl_avail' ? `${a} → ${c.setVal}` : String(a), s.exec && c.updated.includes(n) && c.set === 'sl_color' ? `${col} → green` : col,
                s.exec ? (c.logged.includes(n) ? 'updated + logged' : c.updated.includes(n) ? 'updated, not logged' : '') : ''])} />
          </Panel>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'rule-system',
  module: 'm6',
  order: 4,
  title: 'The rule system',
  tldr: [
    'The **rule system** is a query rewriter between the parser and the planner that turns one query tree into zero or more trees, using rules stored in `pg_rewrite`: it is how views work and how `CREATE RULE` adds or replaces commands.',
    'It exists to transform whole statements at once, which is powerful for views but surprising for data changes, so nearly all custom write logic today belongs in triggers instead.',
  ],
  visualizer: {
    title: 'Rewriting an UPDATE with log_shoelace, step by step',
    caption: 'Follow the rewriter through its five steps for the `log_shoelace` rule. Switch statements to see a colour-only update log nothing and a multi-row update log 3 of 4 rows.',
    Component: RuleViz,
  },
  playground: {
    setup: `
CREATE TABLE shoelace_data (sl_name text PRIMARY KEY, sl_avail integer, sl_color text, sl_len real, sl_unit text);
CREATE TABLE unit (un_name text PRIMARY KEY, un_fact real);
INSERT INTO unit VALUES ('cm', 1.0), ('m', 100.0), ('inch', 2.54);
INSERT INTO shoelace_data VALUES
  ('sl1', 5, 'black', 80.0, 'cm'), ('sl2', 6, 'black', 100.0, 'cm'), ('sl3', 0, 'black', 35.0, 'inch'),
  ('sl4', 8, 'black', 40.0, 'inch'), ('sl5', 4, 'brown', 1.0, 'm'), ('sl6', 0, 'brown', 0.9, 'm'),
  ('sl7', 7, 'brown', 60, 'cm'), ('sl8', 1, 'brown', 40, 'inch');
CREATE VIEW shoelace AS
  SELECT s.sl_name, s.sl_avail, s.sl_color, s.sl_len, s.sl_unit, s.sl_len * u.un_fact AS sl_len_cm
  FROM shoelace_data s, unit u WHERE s.sl_unit = u.un_name;
CREATE TABLE shoelace_log (sl_name text, sl_avail integer, log_who text, log_when timestamp);
CREATE RULE log_shoelace AS ON UPDATE TO shoelace_data
  WHERE NEW.sl_avail <> OLD.sl_avail
  DO INSERT INTO shoelace_log VALUES (NEW.sl_name, NEW.sl_avail, current_user, current_timestamp);`,
    presets: [
      { label: 'Rules in pg_rewrite', sql: `SELECT ev_class::regclass AS relation, rulename, ev_type, is_instead
FROM pg_rewrite
WHERE ev_class IN ('shoelace_data'::regclass, 'shoelace'::regclass);

SELECT pg_get_ruledef(oid, true) FROM pg_rewrite WHERE rulename = 'log_shoelace';`,
        note: 'The view `shoelace` has its `_RETURN` rule (ev_type 1 = SELECT, INSTEAD). `log_shoelace` is ev_type 2 = UPDATE and `is_instead = f`: an ALSO rule.' },
      { label: 'One UPDATE, two plans', sql: `EXPLAIN (COSTS OFF)
UPDATE shoelace_data SET sl_avail = 6 WHERE sl_name = 'sl7';`,
        note: 'EXPLAIN prints **two plans**: first the rule\'s INSERT, with the substituted qual `Filter: (6 <> sl_avail)`, then the original UPDATE.' },
      { label: 'Log a change', sql: `UPDATE shoelace_data SET sl_avail = 6 WHERE sl_name = 'sl7';
SELECT sl_name, sl_avail, log_who FROM shoelace_log;`,
        note: 'One log row, written by the extra INSERT that the rewriter generated.' },
      { label: 'Colour change: no log', sql: `UPDATE shoelace_data SET sl_color = 'green' WHERE sl_name = 'sl7';
SELECT count(*) AS log_rows FROM shoelace_log;`,
        note: 'Still one log row. `NEW.sl_avail` was not assigned, so it was replaced by `shoelace_data.sl_avail` and the qual compared the column with itself.' },
      { label: 'Multi-row: 4 updated, 3 logged', sql: `UPDATE shoelace_data SET sl_avail = 0 WHERE sl_color = 'black';
SELECT sl_name, sl_avail FROM shoelace_log ORDER BY sl_name;`,
        note: 'sl1, sl2 and sl4 are logged with one INSERT … SELECT; sl3 already had 0. The action ran **before** the UPDATE, so it still saw the old values.' },
      { label: 'Volatile functions run twice', sql: `CREATE TABLE events (id serial, v int);
CREATE TABLE events_copy (id int, v int);
CREATE RULE copy_ev AS ON INSERT TO events DO ALSO INSERT INTO events_copy VALUES (NEW.id, NEW.v);

INSERT INTO events (v) VALUES (10), (20);
SELECT 'events' AS t, * FROM events UNION ALL SELECT 'copy', * FROM events_copy;`,
        note: 'The copies have ids 3 and 4, not 1 and 2. `NEW.id` was replaced by the column default `nextval(…)`, which the rule action evaluated **again**. A trigger would see the real values.' },
      { label: 'DO INSTEAD NOTHING', sql: `CREATE RULE shoelace_del_protect AS ON DELETE TO shoelace DO INSTEAD NOTHING;

DELETE FROM shoelace WHERE sl_name = 'sl1';
SELECT count(*) AS still_there FROM shoelace WHERE sl_name = 'sl1';`,
        note: 'The rewriter returned **zero** query trees: the DELETE silently became nothing (`DELETE 0`), with no error. That silence is why rules make poor constraints.' },
    ],
  },
  production: {
    title: 'Retiring an audit rule that logged the wrong ids',
    context: 'A legacy schema mirrored every insert into `orders` to `orders_archive` with `CREATE RULE … ON INSERT … DO ALSO INSERT INTO orders_archive VALUES (NEW.id, …)`. The `id` column was a serial.',
    problem: 'Archive rows had ids that did not match any order: every insert consumed two sequence values and the archive got the second one. Bulk loads with `COPY` were not archived at all, because COPY does not invoke the rule system.',
    solution: 'Drop the rule and use an **AFTER INSERT trigger**. A trigger receives the row after defaults are evaluated, so it sees the real `id`, and triggers fire for COPY too. For bulk inserts, a statement trigger with a `NEW TABLE` transition table archives the whole batch in one statement.',
    sql: `DROP RULE copy_orders ON orders;
CREATE FUNCTION archive_orders() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO orders_archive SELECT * FROM new_rows;
  RETURN NULL;
END $$;
CREATE TRIGGER archive_orders AFTER INSERT ON orders
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION archive_orders();`,
    outcome: 'Archive ids match the source again, sequences advance once per row, and COPY loads are archived. The "Volatile functions run twice" preset reproduces the original bug: ids 1 and 2 in the table, 3 and 4 in the copy.',
  },
  pitfalls: [
    { title: 'Volatile expressions evaluated more than once',
      symptom: 'Rows copied by a rule have different serial ids, timestamps or random values than the originals.',
      cause: 'A rule rewrites the statement: each `NEW.col` is replaced by the **expression** from the original target list (or the column default), and the action evaluates it again.',
      fix: 'Use a trigger, which sees the final row values. Rules give surprising results with volatile functions, because each action re-evaluates the NEW expressions.' },
    { title: 'INSTEAD NOTHING hides failures',
      symptom: 'An application believes it deleted or updated rows, but nothing changed and no error was raised.',
      cause: 'An unconditional `DO INSTEAD NOTHING` produces zero query trees, and the command reports zero rows. A qualified INSTEAD rule silently discards rows that match its qual.',
      fix: 'To block writes, revoke privileges or use a BEFORE trigger that raises an exception, so callers see an error.' },
    { title: 'Rules and features they do not cover',
      symptom: '`ERROR: WITH cannot be used in a query that is rewritten by rules into multiple queries`, or COPY into the table skips the rule\'s side effects.',
      cause: 'Rules work on query trees. Statements with `WITH` clauses and multiple-assignment sub-SELECTs are not supported, MERGE does not use non-SELECT rules, and COPY bypasses rules entirely.',
      fix: 'Move the logic to triggers, which run for INSERT, UPDATE, DELETE, MERGE actions and COPY.' },
  ],
  pointers: [
    'The rewriter runs **between parser and planner** and returns **zero or more** query trees. Views are `_RETURN` rules.',
    'A rule action is a template: **NEW** becomes the original target-list expression (or OLD for unassigned UPDATE columns, NULL for INSERT), **OLD** becomes the result relation.',
    '**ALSO** keeps the original query; **INSTEAD** replaces it; a qualified INSTEAD also adds the original with the negated qual.',
    'For **ON UPDATE/DELETE** the actions run **before** the original; for **ON INSERT** after it.',
    'Prefer **triggers** for data changes: rules re-evaluate volatile expressions, cannot raise errors, and skip COPY.',
  ],
  sources: ['rules.html', 'querytree.html', 'rules-views.html', 'rules-update.html', 'rules-status.html', 'rules-triggers.html'],
}
