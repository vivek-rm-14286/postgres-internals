import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Code, Tile } from './_shared'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one call of a PL/pgSQL function whose inner block has an EXCEPTION clause.
 * The xids (top 758, subtransaction 759) and the surviving rows were captured from PostgreSQL 18.6
 * (PGlite) by running the playground's demo() function; the loop timings come from the "Cost of
 * EXCEPTION blocks" preset in the same engine.
 * ---------------------------------------------------------------------------------------------- */

const CODE_WITH = [
  'CREATE FUNCTION demo() RETURNS void LANGUAGE plpgsql AS $$',
  'DECLARE x int := 1; y int;',
  'BEGIN',
  "  INSERT INTO audit (note) VALUES ('before block');",
  '  BEGIN',
  "    UPDATE accounts SET owner = 'Joe' WHERE id = 1;",
  '    x := x + 1;',
  '    y := x / 0;',
  '  EXCEPTION WHEN division_by_zero THEN',
  "    RAISE NOTICE 'caught: % (x = %)', SQLERRM, x;",
  '  END;',
  "  INSERT INTO audit (note) VALUES ('after block');",
  'END $$;',
]
const CODE_WITHOUT = CODE_WITH.filter((_, i) => i !== 8 && i !== 9)

type Status = 'live' | 'pending' | 'aborted' | 'dead'
interface Ver { tbl: 'audit' | 'accounts'; row: string; xmin: number; xmax?: number; status: Status }
interface Tx { xid: number | null; label: string; state: 'active' | 'aborted' | 'committed' }
interface S { line: number; tx: Tx[]; vers: Ver[]; x: number; y: string; msg?: { t: Tone; text: string }; prepared: number }

const alice = (xmax?: number, status: Status = 'live'): Ver => ({ tbl: 'accounts', row: "(1,'alice',100)", xmin: 754, xmax, status })

function build(withExc: boolean): Step<S>[] {
  const L = (n: number) => (withExc ? n : n > 9 ? n - 2 : n)
  const top = (xid: number | null, state: Tx['state'] = 'active'): Tx => ({ xid, label: 'top-level', state })
  const before: Ver = { tbl: 'audit', row: "(1,'before block')", xmin: 758, status: 'pending' }
  const joe: Ver = { tbl: 'accounts', row: "(1,'Joe',100)", xmin: 759, status: 'pending' }
  const common: Step<S>[] = [
    { title: 'SELECT demo(): compile on first call', body: 'The first call in a session parses the body into an **instruction tree**. No SQL inside it is planned yet. The statement has only a virtual transaction id: a real xid is assigned at the first write.',
      state: { line: 2, tx: [top(null)], vers: [alice()], x: 1, y: 'NULL', prepared: 0 } },
    { title: 'First write: xid 758 is assigned', body: 'The INSERT is prepared through **SPI** the first time it runs (later calls reuse it). Writing a row forces a real transaction id: **758**, stamped as the row\'s `xmin`.',
      state: { line: 3, tx: [top(758)], vers: [alice(), before], x: 1, y: 'NULL', prepared: 1 } },
    { title: withExc ? 'Enter a block with EXCEPTION: subtransaction' : 'Enter a plain inner block', body: withExc ? 'Because this block has an **EXCEPTION** clause, entering it starts a **subtransaction**, the same machinery as `SAVEPOINT`. That is what makes the block expensive.' : 'Without an EXCEPTION clause the inner BEGIN … END is only a scope for statements. No subtransaction, no extra cost.',
      state: { line: 4, tx: withExc ? [top(758), { xid: null, label: 'subxact', state: 'active' }] : [top(758)], vers: [alice(), before], x: 1, y: 'NULL', prepared: 1 } },
    { title: withExc ? 'UPDATE inside the block gets subxid 759' : 'UPDATE runs under xid 758', body: withExc ? 'The subtransaction writes, so it gets its own xid **759**. The old version of row 1 gets `xmax = 759`; the new version (`Joe`) gets `xmin = 759`.' : 'The UPDATE writes a new version with `xmin = 758` and stamps the old one `xmax = 758`.',
      state: { line: 5, tx: withExc ? [top(758), { xid: 759, label: 'subxact', state: 'active' }] : [top(758)], vers: [alice(withExc ? 759 : 758), before, withExc ? joe : { ...joe, xmin: 758 }], x: 1, y: 'NULL', prepared: 2 } },
    { title: 'x := x + 1 (a local variable)', body: 'Assignments change **PL/pgSQL variables in memory**. They are not database state and are never rolled back.',
      state: { line: 6, tx: withExc ? [top(758), { xid: 759, label: 'subxact', state: 'active' }] : [top(758)], vers: [alice(withExc ? 759 : 758), before, withExc ? joe : { ...joe, xmin: 758 }], x: 2, y: 'NULL', prepared: 2 } },
    { title: 'y := x / 0 raises SQLSTATE 22012', body: 'The error abandons the rest of the block. PostgreSQL now looks for a handler in the nearest enclosing block with an EXCEPTION clause.',
      state: { line: 7, tx: withExc ? [top(758), { xid: 759, label: 'subxact', state: 'active' }] : [top(758)], vers: [alice(withExc ? 759 : 758), before, withExc ? joe : { ...joe, xmin: 758 }], x: 2, y: 'NULL', prepared: 2, msg: { t: 'dead', text: 'ERROR 22012: division by zero' } } },
  ]
  if (!withExc) {
    return [...common, { title: 'No handler: the whole transaction aborts', body: 'Nothing catches the error, so it leaves the function and **aborts the transaction**. Xid 758 is marked aborted: the `before block` row and the UPDATE both disappear.',
      state: { line: 7, tx: [top(758, 'aborted')], vers: [alice(758), { ...before, status: 'aborted' }, { ...joe, xmin: 758, status: 'aborted' }], x: 2, y: 'NULL', prepared: 2, msg: { t: 'dead', text: 'ERROR 22012: division by zero · transaction aborted' } } }]
  }
  return [
    ...common,
    { title: 'Roll back the subtransaction', body: '`division_by_zero` matches. First the subtransaction is **rolled back**: xid 759 is marked aborted, so `Joe` is dead and `alice` is visible again. Local variable **x keeps 2**.',
      state: { line: 8, tx: [top(758), { xid: 759, label: 'subxact', state: 'aborted' }], vers: [alice(759), before, { ...joe, status: 'aborted' }], x: 2, y: 'NULL', prepared: 2, msg: { t: 'new', text: 'handler matched: division_by_zero' } } },
    { title: 'Run the handler', body: 'Inside the handler, **SQLSTATE** and **SQLERRM** describe the error. The function continues after the block\'s END as if nothing failed.',
      state: { line: 9, tx: [top(758)], vers: [alice(759), before, { ...joe, status: 'aborted' }], x: 2, y: 'NULL', prepared: 2, msg: { t: 'ok', text: 'NOTICE: caught: division by zero (x = 2)' } } },
    { title: 'Back in the outer block: xid 758 again', body: 'The next INSERT runs in the top-level transaction, so its row also has `xmin = 758`.',
      state: { line: L(11), tx: [top(758)], vers: [alice(759), before, { ...joe, status: 'aborted' }, { tbl: 'audit', row: "(2,'after block')", xmin: 758, status: 'pending' }], x: 2, y: 'NULL', prepared: 3 } },
    { title: 'COMMIT', body: '758 commits. Both audit rows survive; the UPDATE does not. In the playground, `SELECT xmin, * FROM audit` shows **758, 758**, and the accounts row is still alice.',
      state: { line: L(12), tx: [top(758, 'committed')], vers: [alice(759), { ...before, status: 'live' }, { ...joe, status: 'aborted' }, { tbl: 'audit', row: "(2,'after block')", xmin: 758, status: 'live' }], x: 2, y: 'NULL', prepared: 3 } },
  ]
}

const vTone = (s: Status): Tone => (s === 'live' ? 'ok' : s === 'pending' ? 'new' : 'dead')

function PlpgsqlViz() {
  const [mode, setMode] = useState<'with' | 'without'>('with')
  const steps = useMemo(() => build(mode === 'with'), [mode])
  const code = mode === 'with' ? CODE_WITH : CODE_WITHOUT
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Inner block" value={mode} onChange={setMode} options={[['with', 'With EXCEPTION clause'], ['without', 'Without EXCEPTION clause']]} />
      </div>
      <Stepper key={mode} steps={steps} interval={2600} render={(s) => (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <Legend items={[['accent', 'current line'], ['header', 'transaction'], ['new', 'written, not committed'], ['ok', 'visible row'], ['dead', 'aborted / error']]} />
          <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
            <Code lines={code} active={[s.line]} marks={mode === 'with' ? { 4: { t: 'header', label: 'subxact' }, 8: { t: 'header', label: 'handler' } } : {}} />
            <div className="grid content-start gap-3">
              <Panel title="transaction stack">
                <div className="flex flex-wrap items-center gap-2">
                  <AnimatePresence>
                    {s.tx.map((t) => {
                      const tt: Tone = t.state === 'aborted' ? 'dead' : t.state === 'committed' ? 'ok' : 'header'
                      return (
                        <motion.div key={t.label} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                          className="rounded-md border px-2 py-1 font-mono text-[12px]" style={{ borderColor: tone(tt), background: toneBg(tt, 14) }}>
                          {t.label} · xid <b>{t.xid ?? 'none yet'}</b> <span className="text-muted">({t.state})</span>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </Panel>
              <Panel title="local variables">
                <div className="flex gap-4 font-mono text-[13px]">
                  <span>x = <motion.b key={s.x} initial={{ color: tone.text('new') }} animate={{ color: 'var(--text)' }}>{s.x}</motion.b></span>
                  <span>y = {s.y}</span>
                  <span className="text-muted">prepared stmts: {s.prepared}</span>
                </div>
              </Panel>
              <AnimatePresence mode="wait">
                {s.msg && <motion.div key={s.msg.text} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-md border px-2 py-1.5 font-mono text-[12px]" style={{ borderColor: tone(s.msg.t), background: toneBg(s.msg.t, 14) }}>{s.msg.text}</motion.div>}
              </AnimatePresence>
            </div>
          </div>
          <Panel title="row versions on disk">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {s.vers.map((v) => (
                <motion.div key={v.tbl + v.row} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 font-mono text-[12px]" style={{ borderColor: tone(vTone(v.status)), background: toneBg(vTone(v.status), 12) }}>
                  <span><span className="text-muted">{v.tbl}</span> {v.row}</span>
                  <span className="text-[11px]">xmin {v.xmin}{v.xmax ? ` · xmax ${v.xmax}` : ''} <Tag t={vTone(v.status)}>{v.status}</Tag></span>
                </motion.div>
              ))}
            </div>
          </Panel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="200k loop, plain" value="31 ms" />
            <Tile label="200k loop, EXCEPTION" value="157 ms" t="dead" sub="about 5× slower" />
            <Tile label="1k plain inserts" value="1 xmin" sub="shared top-level xid" />
            <Tile label="1k guarded inserts" value="1000 xmins" t="new" sub="one subxid per block" />
          </div>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'plpgsql',
  module: 'm6',
  order: 3,
  title: 'PL/pgSQL functions and procedures',
  tldr: [
    '**PL/pgSQL** is the built-in procedural language: blocks of variables, loops and conditionals around embedded SQL, compiled on first call and run inside the server next to the data.',
    'It exists so logic that needs many dependent queries runs without a network round trip per statement, and so triggers, checks and batch jobs can live in the database itself.',
  ],
  visualizer: {
    title: 'An EXCEPTION block is a subtransaction',
    caption: 'Step through one call and watch xids, row versions and variables. Switch to **Without EXCEPTION clause** to see the same error abort everything.',
    Component: PlpgsqlViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE accounts (id int PRIMARY KEY, owner text NOT NULL, balance numeric(12,2) NOT NULL CHECK (balance >= 0));
INSERT INTO accounts VALUES (1, 'alice', 100), (2, 'bob', 50);
CREATE TABLE audit (id serial PRIMARY KEY, note text);

CREATE FUNCTION demo() RETURNS TABLE (step text, val text) LANGUAGE plpgsql AS $$
DECLARE x int := 1; y int;
BEGIN
  INSERT INTO audit (note) VALUES ('before block');
  step := 'top-level xid'; val := pg_current_xact_id()::text; RETURN NEXT;
  BEGIN
    UPDATE accounts SET owner = 'Joe' WHERE id = 1;
    x := x + 1;
    y := x / 0;
  EXCEPTION WHEN division_by_zero THEN
    step := 'caught'; val := SQLSTATE || ' ' || SQLERRM || ', x = ' || x; RETURN NEXT;
  END;
  INSERT INTO audit (note) VALUES ('after block');
  RETURN;
END $$;

-- Runs one statement and reports the error instead of failing. OTHERS does not catch
-- assert_failure (or query_canceled), so that condition needs its own branch.
CREATE FUNCTION try_sql(stmt text) RETURNS text LANGUAGE plpgsql AS $fn$
BEGIN
  EXECUTE stmt;
  RETURN 'OK';
EXCEPTION
  WHEN assert_failure THEN RETURN 'ASSERT ' || SQLSTATE || ': ' || SQLERRM;
  WHEN OTHERS THEN RETURN 'ERROR ' || SQLSTATE || ': ' || SQLERRM;
END $fn$;`,
    presets: [
      { label: 'Run demo()', sql: `SELECT * FROM demo();

SELECT xmin, * FROM audit ORDER BY id;
SELECT xmin, * FROM accounts ORDER BY id;

-- the aborted 'Joe' version is still on the page:
SELECT lp, t_xmin, t_xmax, t_ctid FROM heap_page_items(get_raw_page('accounts', 0));`,
        note: 'The function reports its xid and the caught error (x = 2: variables keep their values). Both audit rows have that same xmin, and account 1 is still alice. `pageinspect` shows the rolled-back `Joe` version at lp 3 with the **subtransaction\'s own xid** (top xid + 1) as `t_xmin`.' },
      { label: 'Error kata: INTO, FOUND, CASE, ASSERT', sql: `SELECT
  try_sql($q$DO $$ DECLARE r accounts; BEGIN SELECT * INTO STRICT r FROM accounts WHERE id = 99; END $$$q$) AS strict_no_row,
  try_sql($q$DO $$ DECLARE r accounts; BEGIN SELECT * INTO STRICT r FROM accounts WHERE balance > 0; END $$$q$) AS strict_two_rows,
  try_sql($q$DO $$ DECLARE r accounts; BEGIN SELECT * INTO r FROM accounts ORDER BY id; RAISE EXCEPTION 'kept %', r.owner; END $$$q$) AS plain_into;

SELECT
  try_sql($q$DO $$ DECLARE t numeric; BEGIN
    SELECT sum(balance) INTO t FROM accounts WHERE id = 99;
    IF FOUND THEN RAISE EXCEPTION 'FOUND = true, total = %', t; END IF; END $$$q$) AS sum_into_found,
  try_sql($q$DO $$ DECLARE x int := 3; BEGIN CASE x WHEN 1 THEN NULL; WHEN 2 THEN NULL; END CASE; END $$$q$) AS case_no_else,
  try_sql($q$DO $$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM accounts; ASSERT n > 10, 'only ' || n || ' accounts'; END $$$q$) AS assert_false,
  try_sql($q$DO $$ DECLARE vat constant numeric := 0.1; BEGIN vat := 0.05; END $$$q$) AS assign_constant;

SELECT
  try_sql($q$DO $$ DECLARE t text := 'Brooklyn Desert'; BEGIN RAISE EXCEPTION 'title: %s', t; END $$$q$) AS percent_s,
  try_sql($q$DO $$ BEGIN RAISE NOTICE 'a % b %', 1; END $$$q$) AS too_few_args,
  try_sql($q$DO $$ BEGIN PERFORM 1/0; EXCEPTION WHEN division_by_zero THEN RAISE EXCEPTION 'wrapped: %', SQLERRM; END $$$q$) AS reraise_new,
  try_sql($q$DO $$ BEGIN PERFORM 1/0; EXCEPTION WHEN division_by_zero THEN RAISE; END $$$q$) AS reraise_bare;`,
        note: '`INTO STRICT` raises **P0002** for no row and **P0003** for two; plain `INTO` silently keeps the first row. `SELECT sum(…) INTO` always returns one row, so **FOUND is true** even with no match and total NULL. A CASE statement with no match and no ELSE raises **20000**. ASSERT raises **P0004**, which `WHEN OTHERS` does not catch. RAISE uses a bare `%`, so `%s` prints "Brooklyn Desert**s**". A new RAISE EXCEPTION in a handler reports **P0001**; a bare `RAISE;` keeps the original **22012**.' },
      { label: 'Cost of EXCEPTION blocks', sql: `CREATE FUNCTION bench(n int, with_handler boolean) RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE t0 timestamptz := clock_timestamp(); x int := 0;
BEGIN
  FOR i IN 1..n LOOP
    IF with_handler THEN
      BEGIN x := x + 1; EXCEPTION WHEN OTHERS THEN NULL; END;
    ELSE
      x := x + 1;
    END IF;
  END LOOP;
  RETURN round(extract(epoch FROM clock_timestamp() - t0) * 1000, 1);
END $$;

SELECT bench(200000, false) AS plain_ms, bench(200000, true) AS exception_block_ms;`,
        note: 'Same loop, same work. Entering and leaving a block with an EXCEPTION clause costs a subtransaction every iteration, several times slower even when no error ever happens.' },
      { label: 'One subxid per block', sql: `TRUNCATE audit;
DO $$ BEGIN
  FOR i IN 1..1000 LOOP INSERT INTO audit (note) VALUES ('plain'); END LOOP;
  FOR i IN 1..1000 LOOP
    BEGIN INSERT INTO audit (note) VALUES ('guarded'); EXCEPTION WHEN unique_violation THEN NULL; END;
  END LOOP;
END $$;

SELECT note, count(*) AS rows, count(DISTINCT xmin::text) AS distinct_xmins
FROM audit GROUP BY note;`,
        note: 'Plain inserts share the transaction\'s one xid. Each guarded insert ran in its own subtransaction, so 1000 rows carry **1000 different xmins**. Each one also consumed a transaction id.' },
      { label: 'Procedure with COMMIT', sql: `CREATE PROCEDURE batch_insert() LANGUAGE plpgsql AS $$
BEGIN
  FOR i IN 0..9 LOOP
    INSERT INTO audit (note) VALUES ('batch ' || i);
    IF i % 2 = 0 THEN COMMIT; ELSE ROLLBACK; END IF;
  END LOOP;
END $$;

CALL batch_insert();

SELECT xmin, note FROM audit WHERE note LIKE 'batch%' ORDER BY id;

-- The same CALL issued from inside a function (here via try_sql, under a SELECT):
SELECT try_sql('CALL batch_insert()') AS call_inside_select;`,
        note: 'A **procedure** called with CALL can end transactions. Only the even batches survive, each with its own xmin, because every COMMIT starts a new transaction. Called from inside a SELECT, or inside an explicit `BEGIN … COMMIT` block, the first COMMIT fails with **2D000 invalid transaction termination**.' },
      { label: 'Overloads, defaults, OUT and INOUT', sql: `CREATE FUNCTION balance_of(p_id int) RETURNS numeric LANGUAGE sql
  AS $$ SELECT balance FROM accounts WHERE id = p_id $$;
CREATE FUNCTION balance_of(p_id int, p_min numeric DEFAULT 0) RETURNS numeric LANGUAGE sql
  AS $$ SELECT balance FROM accounts WHERE id = p_id AND balance >= p_min $$;

SELECT try_sql('SELECT balance_of(1)') AS one_arg,
       balance_of(1, 80) AS positional,
       balance_of(p_id => 2, p_min => 10) AS named;
SELECT oid::regprocedure AS signature FROM pg_proc WHERE proname = 'balance_of';

CREATE FUNCTION swap(INOUT a int, INOUT b int) LANGUAGE plpgsql AS $$ BEGIN SELECT a, b INTO b, a; END $$;
SELECT swap(10, 20) AS one_composite_column;
SELECT * FROM swap(10, 20);

CREATE PROCEDURE total_balance(OUT total numeric) LANGUAGE plpgsql
  AS $$ BEGIN SELECT sum(balance) INTO total FROM accounts; END $$;
CALL total_balance(NULL);

SELECT $T$ x $t$ y $T$ AS tags_are_case_sensitive;`,
        note: 'Overloads are chosen by their **IN argument types**; defaults are not part of the signature. `balance_of(1)` matches both functions, so it fails with **42725 is not unique**. `SELECT swap(…)` returns one **composite** value `(20,10)`; `SELECT * FROM swap(…)` expands it into columns. Procedures accept **OUT** parameters (since PostgreSQL 14); pass NULL for them in CALL. `$t$` does not close a `$T$` string.' },
      { label: 'Dynamic SQL done safely', sql: `CREATE FUNCTION count_rows(tbl regclass, min_id int) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s WHERE id >= $1', tbl) INTO n USING min_id;
  RETURN n;
END $$;

SELECT count_rows('accounts', 2) AS accounts_from_2,
       format('SELECT * FROM %I WHERE owner = %L', 'my table', 'O''Brien') AS quoted;

-- A set-returning function: each RETURN QUERY appends rows to the result.
CREATE OR REPLACE FUNCTION rich_or(min_balance numeric, also_id int) RETURNS SETOF accounts LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT * FROM accounts WHERE balance >= min_balance;
  RETURN QUERY EXECUTE format('SELECT * FROM %I WHERE id = $1', 'accounts') USING also_id;
END $$;
SELECT * FROM rich_or(80, 2);`,
        note: '`regclass` validates the table name, `%I` quotes identifiers, `%L` quotes literals, and `USING` passes values as parameters. EXECUTE is re-planned on every call. `RETURN QUERY` (static or `EXECUTE`) and `RETURN NEXT` append rows to the result: alice from the first query, bob from the second. The whole set is collected before the function returns, so very large results are better served by a plain SQL function or a cursor.' },
      { label: 'STABLE now() vs VOLATILE clock', sql: `SELECT g, to_char(now(), 'HH24:MI:SS.MS') AS now_stable,
       to_char(clock_timestamp(), 'HH24:MI:SS.MS') AS clock_volatile,
       pg_sleep(0.005) AS pause
FROM generate_series(1, 3) g;

SELECT proname, provolatile FROM pg_proc
WHERE proname IN ('now', 'clock_timestamp', 'lower', 'random') ORDER BY 1;`,
        note: '`now()` is **STABLE**: one value for the whole statement (in fact the whole transaction). `clock_timestamp()` is **VOLATILE** and changes per row (the 5 ms `pg_sleep` makes the gap visible). `provolatile` is `i`, `s` or `v`.' },
    ],
  },
  production: {
    title: 'An upsert loop that burned through transaction ids',
    context: 'A sync worker copied rows from a partner feed with a PL/pgSQL function modelled on the classic retry loop: try UPDATE, and if no row was found, INSERT inside `BEGIN … EXCEPTION WHEN unique_violation`.',
    problem: 'Each call opened a subtransaction and, because it wrote, consumed its own transaction id. Batches of thousands of rows in one transaction overflowed the per-backend subtransaction cache (64 entries), so other sessions taking snapshots had to look subtransactions up in `pg_subtrans`. Xid consumption also brought anti-wraparound vacuums forward.',
    solution: 'Replace the loop with a single `INSERT … ON CONFLICT DO UPDATE`, which is atomic without any subtransaction, and keep EXCEPTION blocks for genuinely exceptional errors at the edge of a batch.',
    sql: `-- before: one subtransaction per row
-- BEGIN INSERT ...; EXCEPTION WHEN unique_violation THEN UPDATE ...; END;
-- after:
INSERT INTO accounts (id, owner, balance)
SELECT id, owner, balance FROM incoming
ON CONFLICT (id) DO UPDATE SET owner = EXCLUDED.owner, balance = EXCLUDED.balance;`,
    outcome: 'The batch now uses one xid instead of one per row (the "One subxid per block" preset shows 1000 xmins for 1000 guarded inserts versus 1 for plain ones), no subtransaction cache overflow, and one set-based statement instead of a per-row loop.',
  },
  pitfalls: [
    { title: 'EXCEPTION blocks inside hot loops',
      symptom: 'A function is several times slower than expected, xid age climbs fast, and monitoring shows backends with overflowed subtransaction caches.',
      cause: 'Every entry into a block with an EXCEPTION clause starts a subtransaction. Such a block is significantly more expensive to enter and exit than one without, even when no error is ever raised. Each one that writes also consumes an xid. The mechanics are in [ACID and transactions](/m5/acid-transactions).',
      fix: 'Put the EXCEPTION clause around the whole loop, not inside it, or avoid it: `ON CONFLICT`, `IF NOT FOUND`, and constraint checks before the write usually remove the need.' },
    { title: 'SQL injection through EXECUTE',
      symptom: 'A dynamic report function lets a caller drop tables by passing `orders; DROP TABLE users` as a table name.',
      cause: 'Concatenating strings into `EXECUTE` makes the input part of the SQL text. PL/pgSQL variables are only substituted as parameters in **static** SQL, never inside EXECUTE strings.',
      fix: 'Take identifiers as `regclass`, quote with `format(\'%I\')` and `%L`, and pass values with `EXECUTE … USING`.',
      sql: `EXECUTE format('SELECT count(*) FROM %I WHERE owner = $1', tbl) INTO n USING who;` },
    { title: 'A variable with the same name as a column',
      symptom: '`ERROR: column reference "owner" is ambiguous` the first time the function runs, not when it is created.',
      cause: 'Variables are substituted into SQL as parameters. When a name could be both, PL/pgSQL raises an error by default (`plpgsql.variable_conflict = error`). SQL inside a function is only analysed when first executed.',
      fix: 'Prefix variables (`v_owner`, `p_id`) or qualify (`accounts.owner`, `fn_name.param`). Turn on `plpgsql.extra_warnings = all` in development.' },
    { title: 'Marking a function IMMUTABLE when it is not',
      symptom: 'An expression index or a cached plan returns stale results after a lookup table or setting changes.',
      cause: 'IMMUTABLE promises the same result for the same arguments forever. The planner may pre-evaluate it at plan time, and indexes store its results. A function that reads tables or `now()` breaks that promise.',
      fix: 'Use **STABLE** for functions that read the database or settings within one statement, **VOLATILE** (the default) for anything with side effects or changing results.' },
    { title: 'Testing FOUND after an aggregate',
      symptom: 'A "customer not found" branch never runs. Unknown ids return a NULL total instead of the error the function was written to raise.',
      cause: '`SELECT sum(amount) INTO total … WHERE customer_id = p_id` always produces exactly **one row**, even when no row matches, so FOUND is always true. The same applies to `count(*)`, `max()` and every other aggregate without GROUP BY. Plain `INTO` is also silent about extra rows: it keeps the first one.',
      fix: 'Test the value (`IF total IS NULL`), or check existence first with a non-aggregate query. Use `INTO STRICT` when exactly one row must exist: it raises `no_data_found` (P0002) or `too_many_rows` (P0003).',
      sql: `SELECT sum(amount) INTO total FROM payment WHERE customer_id = p_id;
IF total IS NULL THEN
  RAISE EXCEPTION 'customer % not found', p_id USING ERRCODE = 'no_data_found';
END IF;` },
    { title: 'Re-raising an error under a new code',
      symptom: 'The application retries on serialization failures (40001) and handles unique violations (23505), but after a refactor every database error arrives as **P0001** and the retry logic never fires.',
      cause: 'A handler that does `RAISE EXCEPTION \'failed: %\', SQLERRM` raises a **new** error with the default condition `raise_exception` (P0001). The original SQLSTATE is lost.',
      fix: 'Use a bare `RAISE;` to re-throw the caught error unchanged, or keep the code explicitly with `USING ERRCODE = SQLSTATE`. Add context with `DETAIL` or `HINT` instead of rewriting the message.',
      sql: `EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'transfer % failed: %', p_id, SQLERRM
    USING ERRCODE = SQLSTATE, HINT = 'see the original error code';` },
  ],
  pointers: [
    'Block = `[DECLARE] BEGIN … [EXCEPTION WHEN … THEN …] END`. An EXCEPTION clause turns the block into a **subtransaction**.',
    'On a caught error, **database changes in the block roll back** but **local variables keep their values**.',
    'Code is compiled on first call; each SQL statement is **prepared on first execution** and may get a cached generic plan. `EXECUTE` re-plans every time.',
    '**Procedures** (`CALL`) can `COMMIT`/`ROLLBACK`; functions cannot. Neither can end a transaction inside an EXCEPTION block.',
    'Volatility: **IMMUTABLE** (pure), **STABLE** (fixed within a statement), **VOLATILE** (default, re-evaluated every call).',
  ],
  sources: ['plpgsql-structure.html', 'plpgsql-control-structures.html', 'plpgsql-statements.html', 'plpgsql-transactions.html', 'plpgsql-implementation.html', 'xfunc-volatility.html'],
}
