import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Sql, Tri } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the NOT IN / NULL trap. Each outer row is tested against the subquery's values with SQL
 * three-valued logic. NOT IN expands to a chain of <> joined by AND, so a single NULL makes "no match"
 * come out NULL instead of true. NOT EXISTS asks a different question (does any row satisfy =?), which
 * is always true or false. Plan shapes were captured with EXPLAIN on PostgreSQL 18 (PGlite).
 * ---------------------------------------------------------------------------------------------- */

type Op = 'not_in' | 'not_exists' | 'in' | 'exists'
type B = boolean | null
const CUSTOMERS = [{ id: 1, name: 'Ava' }, { id: 2, name: 'Ben' }, { id: 3, name: 'Cleo' }, { id: 4, name: 'Dev' }]
const eq = (a: number, b: number | null): B => (b === null ? null : a === b)
const not = (a: B): B => (a === null ? null : !a)
const andAll = (xs: B[]): B => (xs.includes(false) ? false : xs.includes(null) ? null : true)
const orAll = (xs: B[]): B => (xs.includes(true) ? true : xs.includes(null) ? null : false)

const PLAN: Record<Op, string> = {
  not_in: `Seq Scan on customers c
  Filter: (NOT (ANY (id = (hashed SubPlan 1).col1)))
  SubPlan 1
    ->  Seq Scan on refunds`,
  not_exists: `Hash Anti Join
  Hash Cond: (c.id = r.customer_id)
  ->  Seq Scan on customers c
  ->  Hash
        ->  Seq Scan on refunds r`,
  in: `Hash Semi Join
  Hash Cond: (c.id = refunds.customer_id)
  ->  Seq Scan on customers c
  ->  Hash
        ->  Seq Scan on refunds`,
  exists: `Hash Semi Join
  Hash Cond: (c.id = r.customer_id)
  ->  Seq Scan on customers c
  ->  Hash
        ->  Seq Scan on refunds r`,
}
const SQL: Record<Op, string> = {
  not_in: 'SELECT * FROM customers c\nWHERE c.id NOT IN (SELECT customer_id FROM refunds);',
  not_exists: 'SELECT * FROM customers c\nWHERE NOT EXISTS (\n  SELECT 1 FROM refunds r WHERE r.customer_id = c.id);',
  in: 'SELECT * FROM customers c\nWHERE c.id IN (SELECT customer_id FROM refunds);',
  exists: 'SELECT * FROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM refunds r WHERE r.customer_id = c.id);',
}

interface Term { text: string; v: B }
interface SState { cur: number | null; terms: Term[]; combine: string; result: B | undefined; decided: (B | undefined)[] }

function evaluate(op: Op, id: number, vals: (number | null)[]): { terms: Term[]; combine: string; result: B } {
  if (op === 'not_in') {
    const terms = vals.map((v) => ({ text: `${id} <> ${v ?? 'NULL'}`, v: not(eq(id, v)) }))
    return { terms, combine: 'AND', result: andAll(terms.map((t) => t.v)) }
  }
  if (op === 'in') {
    const terms = vals.map((v) => ({ text: `${id} = ${v ?? 'NULL'}`, v: eq(id, v) }))
    return { terms, combine: 'OR', result: orAll(terms.map((t) => t.v)) }
  }
  // EXISTS: the correlated subquery returns the refund rows where r.customer_id = c.id is TRUE
  const terms = vals.map((v) => ({ text: `${v ?? 'NULL'} = ${id}`, v: eq(id, v) }))
  const any = terms.some((t) => t.v === true)
  return { terms, combine: 'rows', result: op === 'exists' ? any : !any }
}

function buildSteps(op: Op, withNull: boolean): Step<SState>[] {
  const vals: (number | null)[] = withNull ? [2, 4, null] : [2, 4]
  const decided: (B | undefined)[] = CUSTOMERS.map(() => undefined)
  const steps: Step<SState>[] = [{
    title: 'Outer rows meet the subquery',
    body: `The subquery returns \`customer_id\` from refunds: **{${vals.map((v) => v ?? 'NULL').join(', ')}}**.${withNull ? ' One refund has no customer, so the list holds a **NULL**.' : ''} WHERE keeps a row only if its test is **true**.`,
    state: { cur: null, terms: [], combine: '', result: undefined, decided: [...decided] },
  }]
  CUSTOMERS.forEach((c, i) => {
    const e = evaluate(op, c.id, vals)
    decided[i] = e.result
    let body: string
    if (op === 'not_in' || op === 'in') {
      const kw = op === 'not_in' ? '`NOT IN` is `<> ALL`: every comparison joined with **AND**' : '`IN` is `= ANY`: comparisons joined with **OR**'
      const why = e.result === null ? ` A comparison with NULL is unknown, so the whole test is **NULL** and **${c.name} is dropped**${op === 'not_in' ? ', even though no refund belongs to them' : ''}.` : e.result ? ` Result **true**: ${c.name} is kept.` : ` Result **false**: ${c.name} is dropped.`
      body = `${kw}.${why}`
    } else {
      const hits = e.terms.filter((t) => t.v === true).length
      body = `The correlated subquery re-runs with \`c.id = ${c.id}\` and returns **${hits} row${hits === 1 ? '' : 's'}** (a NULL comparison returns no row). ${op === 'exists' ? 'EXISTS' : 'NOT EXISTS'} is **${String(e.result)}**: ${c.name} is ${e.result ? 'kept' : 'dropped'}. It is never NULL.`
    }
    steps.push({ title: `${c.name} (id ${c.id})`, body, state: { cur: i, ...e, decided: [...decided] } })
  })
  const kept = CUSTOMERS.filter((_, i) => decided[i] === true).map((c) => c.name)
  const finalBody = op === 'not_in' && withNull
    ? '**Zero rows.** One NULL poisons every "no match". Over 2,000 customers, `NOT IN` returns 0 rows while `NOT EXISTS` returns 1,713.'
    : `${kept.length} row${kept.length === 1 ? '' : 's'}: ${kept.join(', ') || 'none'}.${op === 'not_exists' ? ' The NULL refund is irrelevant: it never equals anyone.' : op === 'not_in' ? ' Without the NULL, NOT IN and NOT EXISTS agree.' : ' IN and EXISTS agree whether or not the list holds a NULL, because WHERE treats NULL like false.'}`
  steps.push({ title: 'Result', body: finalBody, state: { cur: null, terms: [], combine: '', result: undefined, decided: [...decided] } })
  return steps
}

function SubqueryViz() {
  const [op, setOp] = useState<Op>('not_in')
  const [withNull, setWithNull] = useState(true)
  const steps = useMemo(() => buildSteps(op, withNull), [op, withNull])
  const vals = withNull ? [2, 4, null] : [2, 4]
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Operator" value={op} onChange={setOp} options={[['not_in', 'NOT IN'], ['not_exists', 'NOT EXISTS'], ['in', 'IN'], ['exists', 'EXISTS']]} />
        <Segmented label="NULL in subquery" value={withNull ? 'y' : 'n'} onChange={(v) => setWithNull(v === 'y')} options={[['y', 'refunds has a NULL'], ['n', 'no NULL']]} />
      </div>
      <Stepper key={`${op}-${withNull}`} steps={steps} interval={2600} render={(s) => (
        <div className="grid gap-3">
          <Legend items={[['ok', 'true: row kept'], ['dead', 'false: dropped'], ['header', 'NULL: dropped (not true)']]} />
          <div className="grid gap-3 md:grid-cols-[0.9fr_1.4fr]">
            <Panel title="customers (outer query)">
              <div className="grid gap-1.5">
                {CUSTOMERS.map((c, i) => {
                  const d = s.decided[i]
                  const t = d === undefined ? 'muted' : d === null ? 'header' : d ? 'ok' : 'dead'
                  return (
                    <motion.div key={c.id} layout animate={{ scale: s.cur === i ? 1.03 : 1 }}
                      className="flex items-center justify-between rounded-md border px-2.5 py-1.5 font-mono text-[12px]"
                      style={{ borderColor: s.cur === i ? 'var(--accent)' : tone(t), background: toneBg(t, d === undefined ? 6 : 16), borderWidth: s.cur === i ? 2 : 1 }}>
                      <span>{c.id} · {c.name}</span>
                      {d !== undefined ? <Tri v={d} /> : <span className="text-[11px] text-muted">pending</span>}
                    </motion.div>
                  )
                })}
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted">subquery values: {'{'}{vals.map((v, k) => <span key={k} style={{ color: v === null ? 'var(--c-header)' : undefined, fontWeight: v === null ? 700 : 400 }}>{k ? ', ' : ''}{v ?? 'NULL'}</span>)}{'}'}</p>
            </Panel>
            <div className="grid content-start gap-2">
              <Panel title={s.cur === null ? 'evaluation' : `evaluating ${CUSTOMERS[s.cur].name}`}>
                <AnimatePresence mode="wait">
                  <motion.div key={`${s.cur}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[92px]">
                    {s.cur === null ? <p className="text-sm text-muted">{s.decided.every((d) => d === undefined) ? 'Step to evaluate each customer.' : `${s.decided.filter((d) => d === true).length} of 4 customers pass the WHERE test.`}</p> : (
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[12px]">
                          {s.terms.map((t, k) => (
                            <motion.span key={k} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: k * 0.15 }} className="inline-flex items-center gap-1.5">
                              {k > 0 && s.combine !== 'rows' && <b className="text-muted">{s.combine}</b>}
                              <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5">{t.text}</span>
                              <span className="text-muted">→</span><Tri v={t.v} />
                            </motion.span>
                          ))}
                        </div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 * s.terms.length + 0.1 }} className="flex items-center gap-2 text-sm">
                          <span className="text-muted">{s.combine === 'rows' ? `rows returned: ${s.terms.filter((t) => t.v === true).length} →` : 'whole test →'}</span><Tri v={s.result ?? null} />
                          <span className="text-muted">{s.result === true ? 'kept' : 'dropped'}</span>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Panel>
              <Sql>{SQL[op]}</Sql>
              <Panel title="plan shape (EXPLAIN)">
                <pre className="overflow-x-auto font-mono text-[11.5px] leading-snug whitespace-pre scrollbar-thin">{PLAN[op]}</pre>
                <p className="mt-1.5 text-xs text-muted"><Md>{op === 'not_in' ? 'NOT IN **cannot become an anti-join**, because its NULL semantics differ. It stays a filter with a hashed SubPlan (or a per-row SubPlan when the list is too big for `work_mem`).' : op === 'not_exists' ? 'NOT EXISTS is pulled up into an **anti-join** the planner can reorder and hash.' : 'IN and EXISTS both become a **semi-join**: emit each outer row at most once.'}</Md></p>
              </Panel>
            </div>
          </div>
        </div>
      )} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'subqueries',
  module: 'm3',
  order: 3,
  title: 'Subqueries: scalar, IN, EXISTS, ANY/ALL',
  tldr: [
    'A subquery is a query nested inside another: a **scalar** subquery yields one value, while `IN`, `EXISTS`, `ANY` and `ALL` turn a whole row set into a true, false or NULL test.',
    'They let you ask "is there a matching row?" directly, and the planner rewrites most of them into semi- and anti-joins, except `NOT IN`, whose NULL rules make it both slower and a classic source of empty results.',
  ],
  visualizer: {
    title: 'NOT IN vs NOT EXISTS, one row at a time',
    caption: 'Pick an operator and step through the customers. Each comparison is shown in three-valued logic. Start with **NOT IN** and the NULL present, then flip to **NOT EXISTS**.',
    Component: SubqueryViz,
  },
  playground: {
    setup: `
CREATE TABLE customers (id int PRIMARY KEY, name text NOT NULL, country text NOT NULL);
INSERT INTO customers VALUES (1, 'Ava', 'NL'), (2, 'Ben', 'DE'), (3, 'Cleo', 'NL'), (4, 'Dev', 'IN');
INSERT INTO customers SELECT g, 'cust' || g, (ARRAY['NL','DE','IN','US'])[1 + g % 4] FROM generate_series(5, 2000) g;
CREATE TABLE refunds (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, customer_id int, amount numeric(8,2) NOT NULL);
INSERT INTO refunds (customer_id, amount) VALUES (2, 15.00), (4, 9.50), (NULL, 20.00);
INSERT INTO refunds (customer_id, amount) SELECT g, 5 + g % 40 FROM generate_series(10, 2000, 7) g;
ANALYZE customers; ANALYZE refunds;
CREATE TABLE staff (id int PRIMARY KEY, name text NOT NULL, salary int NOT NULL);
INSERT INTO staff VALUES (1, 'Bob', 75000), (2, 'Charlie', 55000), (3, 'David', 50000), (4, 'Emma', 48000),
  (5, 'Frank', 52000), (6, 'Grace', 49000), (7, 'Harry', 53000), (8, 'Ivy', 47000),
  (9, 'Jack', 56000), (10, 'Kate', 44000), (11, 'Liam', 59000), (12, 'Mia', 42000);
CREATE TABLE managers (id int PRIMARY KEY, name text NOT NULL, salary int NOT NULL);
INSERT INTO managers VALUES (1, 'John', 60000), (2, 'Jane', 55000), (3, 'Alice', 58000);
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: 'The NOT IN trap', sql: `SELECT count(*) AS not_in FROM customers c
WHERE c.id NOT IN (SELECT customer_id FROM refunds);

SELECT count(*) AS not_exists FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM refunds r WHERE r.customer_id = c.id);

SELECT count(*) AS not_in_fixed FROM customers c
WHERE c.id NOT IN (SELECT customer_id FROM refunds WHERE customer_id IS NOT NULL);`,
        note: '0 vs 1,713. One refund row with a NULL `customer_id` makes every NOT IN test NULL. Filtering the NULLs out, or using NOT EXISTS, gives the right answer.' },
      { label: 'Three-valued truth table', sql: `SELECT 1 IN (2, NULL)         AS in_null,
       2 IN (2, NULL)         AS in_hit,
       1 NOT IN (2, NULL)     AS not_in_null,
       2 NOT IN (2, NULL)     AS not_in_hit,
       NULL IN (SELECT 1 WHERE false)     AS null_in_empty,
       5 > ALL (SELECT 1 WHERE false)     AS all_empty,
       5 > ANY (SELECT 1 WHERE false)     AS any_empty,
       EXISTS (SELECT NULL)               AS exists_null_row;`,
        note: 'NULL when nothing matches and a NULL is present; true or false when a match decides it. Against an empty set, IN and ANY are false and ALL is true, even for a NULL left side. EXISTS is true for a row of NULLs.' },
      { label: 'Plans: semi, anti, SubPlan', sql: `EXPLAIN (COSTS OFF) SELECT * FROM customers c WHERE c.id IN (SELECT customer_id FROM refunds);
EXPLAIN (COSTS OFF) SELECT * FROM customers c WHERE NOT EXISTS (SELECT 1 FROM refunds r WHERE r.customer_id = c.id);
EXPLAIN (COSTS OFF) SELECT * FROM customers c WHERE c.id NOT IN (SELECT customer_id FROM refunds);`,
        note: 'IN becomes a **Semi Join**, NOT EXISTS an **Anti Join**. NOT IN stays a Filter with a hashed SubPlan, which the planner cannot reorder.' },
      { label: 'Scalar subqueries', sql: `-- correlated scalar subquery: one value per outer row
SELECT c.name,
       (SELECT sum(amount) FROM refunds r WHERE r.customer_id = c.id) AS refunded
FROM customers c WHERE c.id <= 4 ORDER BY c.id;

-- more than one row is a runtime error; zero rows is NULL
SELECT try_sql('SELECT (SELECT customer_id FROM refunds WHERE amount > 10)') AS too_many,
       (SELECT customer_id FROM refunds WHERE amount > 1000) AS zero_rows;`,
        note: 'Ava gets NULL (no rows, not 0). A scalar subquery that returns 2+ rows fails with SQLSTATE `21000` only when it runs, so it can pass tests on small data.' },
      { label: 'ANY / ALL with arrays', sql: `SELECT name FROM customers WHERE country = ANY (ARRAY['NL', 'IN']) AND id <= 4;

SELECT max(amount) AS biggest,
       (SELECT count(*) FROM refunds WHERE amount >= ALL (SELECT amount FROM refunds)) AS rows_at_max
FROM refunds;`,
        note: '`= ANY(array)` is the parameter-friendly form of IN: one bind parameter instead of a list. `>= ALL` finds the rows that are at least every value.' },
      { label: 'ANY / ALL are min / max in disguise', sql: `SELECT min(salary) AS lowest_manager, max(salary) AS highest_manager FROM managers;

SELECT '> ALL' AS test, string_agg(name, ', ' ORDER BY salary DESC) AS staff
FROM staff WHERE salary > ALL (SELECT salary FROM managers)
UNION ALL
SELECT '> ANY', string_agg(name, ', ' ORDER BY salary DESC)
FROM staff WHERE salary > ANY (SELECT salary FROM managers)
UNION ALL
SELECT '= ANY', string_agg(name, ', ')
FROM staff WHERE salary = ANY (SELECT salary FROM managers)
UNION ALL
SELECT '< ALL', count(*)::text FROM staff WHERE salary < ALL (SELECT salary FROM managers)
UNION ALL
SELECT '< ANY', count(*)::text FROM staff WHERE salary < ANY (SELECT salary FROM managers);`,
        note: 'Managers earn 55,000 to 60,000. `> ALL` means above the **highest** (only Bob). `> ANY` means above the **lowest** (Bob, Liam, Jack). `= ANY` is IN (Charlie). `< ALL` is below the lowest (8 people), `< ANY` below the highest (11). `SOME` is a synonym for ANY.' },
      { label: 'Correlated subquery vs window', sql: `-- refunds above their customer's country average: a SubPlan per row
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, BUFFERS OFF, SUMMARY OFF)
SELECT r.id, r.amount FROM refunds r JOIN customers c ON c.id = r.customer_id
WHERE r.amount > (SELECT avg(r2.amount) FROM refunds r2
                  JOIN customers c2 ON c2.id = r2.customer_id
                  WHERE c2.country = c.country);

-- the same answer from one pass
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, BUFFERS OFF, SUMMARY OFF)
SELECT id, amount FROM (
  SELECT r.id, r.amount, avg(r.amount) OVER (PARTITION BY c.country) AS country_avg
  FROM refunds r JOIN customers c ON c.id = r.customer_id) x
WHERE amount > country_avg;`,
        note: 'The first plan shows `SubPlan 1` with `loops=287`, one per joined refund: the inner join and average run again for every row. The window version joins once, sorts once and computes every country average in one **WindowAgg**. Both return the same 143 rows.' },
      { label: 'Subquery in FROM', sql: `SELECT country, round(avg(total), 2) AS avg_refunded
FROM (SELECT c.country, sum(r.amount) AS total
      FROM customers c JOIN refunds r ON r.customer_id = c.id
      GROUP BY c.id, c.country) AS per_customer
GROUP BY country ORDER BY country;`,
        note: 'A derived table: aggregate per customer first, then average per country. The planner may flatten simple FROM subqueries into the outer query.' },
    ],
  },
  production: {
    title: 'A suppression list that suppressed everyone',
    context: 'A marketing job emails customers who are **not** on an unsubscribe list: `WHERE id NOT IN (SELECT customer_id FROM unsubscribes)`.',
    problem: 'One day the campaign sent zero emails. A new import path had written a single unsubscribe row with `customer_id` NULL (the address could not be linked). From then on every `NOT IN` test was NULL, and the query returned nothing. No error and no warning.',
    solution: 'Rewrite as NOT EXISTS, which only asks whether an equal row exists, and constrain the column so the bad row cannot be written again.',
    sql: `SELECT c.id, c.email
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM unsubscribes u WHERE u.customer_id = c.id);

ALTER TABLE unsubscribes ALTER COLUMN customer_id SET NOT NULL;`,
    outcome: 'Correct results whatever the list contains. The plan changes from a filter with a hashed SubPlan to a Hash Anti Join, which the planner can reorder and which does not degrade to a per-row SubPlan when the list outgrows `work_mem`. With 2,000 customers and one NULL row in the list, the old query returns 0 rows and the new one 1,713.',
  },
  pitfalls: [
    { title: 'NOT IN with a nullable column',
      symptom: 'An exclusion query suddenly returns zero rows, with no error.',
      cause: '`x NOT IN (…)` is `x <> v1 AND x <> v2 AND …`. If any value is NULL and nothing equals x, the result is NULL, and WHERE drops the row.',
      fix: 'Use `NOT EXISTS`, or add `WHERE col IS NOT NULL` inside the subquery, and declare the column NOT NULL if NULL has no meaning.' },
    { title: 'Scalar subquery returning several rows',
      symptom: '`ERROR: more than one row returned by a subquery used as an expression` in production, never in tests.',
      cause: 'A scalar subquery must return at most one row. The check happens at run time, so it only fails once the data has duplicates.',
      fix: 'Make the subquery provably single-row (aggregate, `LIMIT 1` with an `ORDER BY`, or a unique key in the WHERE), or turn it into a join or LATERAL.' },
    { title: 'Correlated subquery in the select list on a big table',
      symptom: 'A report with `(SELECT sum(…) WHERE r.customer_id = c.id)` per row runs for minutes.',
      cause: 'A common belief is that a subquery runs once, before the outer query. That holds only for an uncorrelated one (an **InitPlan**). A correlated scalar subquery is a **SubPlan** that runs once per outer row, and the planner does not turn it into a join.',
      fix: 'Aggregate once and join (`LEFT JOIN (SELECT customer_id, sum(amount) … GROUP BY 1)`), use a window function (`avg(x) OVER (PARTITION BY key)`), or index the correlation column. Check `loops=` in EXPLAIN ANALYZE.' },
    { title: 'Side effects inside EXISTS',
      symptom: 'A `nextval()` or logging function inside an EXISTS subquery runs a different number of times than expected.',
      cause: 'EXISTS stops at the **first** row, and the planner may turn it into a join. How often the inner expressions run is not defined.',
      fix: 'Keep subqueries side-effect free. Do writes in data-modifying CTEs or separate statements.' },
  ],
  pointers: [
    '`EXISTS` is true if at least one row comes back and is **never NULL**; the select list inside it does not matter.',
    '`IN` = `= ANY`, `NOT IN` = `<> ALL`. With a NULL in the list and no match, both give **NULL**.',
    'Empty subquery: `IN`/`ANY` → false, `NOT IN`/`ALL` → true.',
    'A scalar subquery with 0 rows is NULL; with 2+ rows it is an **error**.',
    'IN/EXISTS plan as [semi-joins](/m3/joins), NOT EXISTS as an **anti-join**; NOT IN stays a SubPlan filter.',
  ],
  sources: ['functions-subquery.html', 'functions-comparisons.html', 'queries-table-expressions.html', 'sql-expressions.html', 'using-explain.html'],
}
