import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Note, PRODUCTS, PRODUCTS_SQL, Sql, Stat, Tri, Val, money, type Product } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a live filter-and-sort lab over the module's products table. Each WHERE condition is
 * evaluated per row with SQL three-valued logic (true / false / NULL); only rows that evaluate to TRUE
 * survive. Then ORDER BY (with PostgreSQL's default NULL placement: last for ASC, first for DESC),
 * LIMIT and FETCH FIRST … WITH TIES are applied. Every result matches PostgreSQL 18 on the same data.
 * ---------------------------------------------------------------------------------------------- */

type B3 = boolean | null
const and3 = (a: B3, b: B3): B3 => (a === false || b === false ? false : a === null || b === null ? null : true)
const or3 = (a: B3, b: B3): B3 => (a === true || b === true ? true : a === null || b === null ? null : false)
const not3 = (a: B3): B3 => (a === null ? null : !a)
const cmp = (v: number | null, f: (x: number) => boolean): B3 => (v === null ? null : f(v))

interface Cond { id: string; sql: string; f: (p: Product) => B3; say: string }
const CONDS: Cond[] = [
  { id: 'none', sql: '', f: () => true, say: 'No `WHERE`: every row is kept.' },
  { id: 'lt', sql: 'price < 20', f: (p) => p.price < 20, say: 'A plain comparison. Five rows are cheaper than 20.00.' },
  { id: 'prec', sql: "category = 'kitchen' OR category = 'home' AND price > 20", f: (p) => or3(p.category === 'kitchen', and3(p.category === 'home', p.price > 20)),
    say: '**AND binds tighter than OR**, so this reads "kitchen, or (home and over 20)". All kitchen items pass, even the cheap ones.' },
  { id: 'paren', sql: "(category = 'kitchen' OR category = 'home') AND price > 20", f: (p) => and3(or3(p.category === 'kitchen', p.category === 'home'), p.price > 20),
    say: 'Parentheses say what you meant: kitchen or home, and in both cases over 20. Three rows, not five.' },
  { id: 'in', sql: "category IN ('home', 'office')", f: (p) => p.category === 'home' || p.category === 'office', say: '`IN (…)` is shorthand for `= a OR = b`.' },
  { id: 'between', sql: 'price BETWEEN 15 AND 45', f: (p) => p.price >= 15 && p.price <= 45, say: '`BETWEEN` includes **both ends**: 15.00 and 45.00 are in.' },
  { id: 'like', sql: "name LIKE 'Desk%'", f: (p) => p.name.startsWith('Desk'), say: '`%` matches any run of characters (even none). `_` matches exactly one. `LIKE` is case-sensitive.' },
  { id: 'ilike', sql: "name ILIKE '%POT%'", f: (p) => p.name.toLowerCase().includes('pot'), say: '`ILIKE` ignores case, so `%POT%` finds Teapot and Plant pot.' },
  { id: 'stocklt', sql: 'stock < 10', f: (p) => cmp(p.stock, (s) => s < 10), say: 'Teapot and Pen set have **NULL** stock. `NULL < 10` is NULL, not true, so they are dropped silently.' },
  { id: 'eqnull', sql: 'stock = NULL', f: () => null, say: 'Comparing with NULL is always NULL, never true. **Zero rows**, and no error to warn you.' },
  { id: 'isnull', sql: 'stock IS NULL', f: (p) => p.stock === null, say: '`IS NULL` is how you find missing values. It is always true or false, never NULL.' },
  { id: 'lowfix', sql: 'stock < 10 OR stock IS NULL', f: (p) => or3(cmp(p.stock, (s) => s < 10), p.stock === null), say: 'Low stock **or** unknown stock: now the uncounted items show up too.' },
  { id: 'not', sql: 'NOT (stock > 10)', f: (p) => not3(cmp(p.stock, (s) => s > 10)), say: '`NOT` flips true and false, but `NOT NULL` is still NULL. The two unknown stocks stay out whether you ask for `stock > 10` or its opposite.' },
  { id: 'notin', sql: 'stock NOT IN (0, NULL)', f: (p) => and3(cmp(p.stock, (s) => s !== 0), null), say: '`NOT IN (0, NULL)` means `<> 0 AND <> NULL`. The second part is always NULL, so **no row** can ever be true.' },
]

type SortCol = 'none' | 'price' | 'stock' | 'name'
type Dir = 'asc' | 'desc'
type Nulls = 'default' | 'first' | 'last'

function sortRows(rows: Product[], col: SortCol, dir: Dir, nulls: Nulls) {
  if (col === 'none') return rows
  const nullsFirst = nulls === 'default' ? dir === 'desc' : nulls === 'first'
  return [...rows].sort((a, b) => {
    const x = a[col], y = b[col]
    if (x === null || y === null) {
      if (x === y) return 0
      return (x === null) === nullsFirst ? -1 : 1
    }
    const c = typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)
    return dir === 'asc' ? c : -c
  })
}

function FilterSortViz() {
  const [ci, setCi] = useState(1)
  const [col, setCol] = useState<SortCol>('price')
  const [dir, setDir] = useState<Dir>('asc')
  const [nulls, setNulls] = useState<Nulls>('default')
  const [limit, setLimit] = useState(0)
  const [ties, setTies] = useState(false)
  const [op, setOp] = useState<'AND' | 'OR' | 'NOT'>('AND')

  const cond = CONDS[ci]
  const evals = new Map(PRODUCTS.map((p) => [p.id, cond.f(p)]))
  const kept = sortRows(PRODUCTS.filter((p) => evals.get(p.id) === true), col, dir, nulls)
  const dropped = PRODUCTS.filter((p) => evals.get(p.id) !== true)
  // LIMIT / WITH TIES
  let shown = kept.length
  if (limit > 0 && limit < kept.length) {
    shown = limit
    if (ties && col !== 'none') {
      const last = kept[limit - 1][col]
      while (shown < kept.length && kept[shown][col] === last) shown++
    }
  }
  const order = [...kept, ...dropped]
  const sortSql = col === 'none' ? '' : `ORDER BY ${col}${dir === 'desc' ? ' DESC' : ''}${nulls === 'default' ? '' : ` NULLS ${nulls.toUpperCase()}`}`
  const limSql = limit > 0 ? (ties && col !== 'none' ? `FETCH FIRST ${limit} ROWS WITH TIES` : `LIMIT ${limit}`) : ''
  const sql = ['SELECT id, name, category, price, stock', 'FROM products', cond.sql && `WHERE ${cond.sql}`, sortSql, limSql].filter(Boolean).join('\n') + ';'
  const tieNote = limit > 0 && col !== 'none' && limit < kept.length
    ? ties ? `WITH TIES kept ${shown - limit} extra row${shown - limit === 1 ? '' : 's'} that tie the last value.` : (kept[limit - 1][col] === kept[limit]?.[col] ? ' Row ' + limit + ' ties with the next one; which one you get is not guaranteed. Add a tiebreaker such as `id`, or WITH TIES.' : '')
    : limit > 0 && col === 'none' ? ' LIMIT without ORDER BY returns *some* rows, not the first ones.' + (ties ? ' `WITH TIES` needs an `ORDER BY`: PostgreSQL rejects it otherwise, so it is left out here.' : '') : ''

  const nullCount = [...evals.values()].filter((v) => v === null).length
  const T: Record<typeof op, [string, B3[][]]> = {
    AND: ['a AND b', [[true, false, null], [false, false, false], [null, false, null]]],
    OR: ['a OR b', [[true, true, true], [true, false, null], [true, null, null]]],
    NOT: ['NOT a', [[false], [true], [null]]],
  }
  const vals: B3[] = [true, false, null]

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-muted">WHERE</span>
        {CONDS.map((c, i) => <Btn key={c.id} active={i === ci} onClick={() => setCi(i)}>{c.sql || '(none)'}</Btn>)}
        <Btn primary testid="viz-next" onClick={() => setCi((i) => (i + 1) % CONDS.length)}>Next condition</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="ORDER BY column" value={col} onChange={setCol} options={[['none', 'no ORDER BY'], ['price', 'price'], ['stock', 'stock'], ['name', 'name']]} />
        <Segmented label="direction" value={dir} onChange={setDir} options={[['asc', 'ASC'], ['desc', 'DESC']]} />
        <Segmented label="NULL placement" value={nulls} onChange={setNulls} options={[['default', 'NULLS default'], ['first', 'FIRST'], ['last', 'LAST']]} />
        <label className="flex items-center gap-2 text-xs text-muted">LIMIT
          <input type="range" min={0} max={9} value={limit} onChange={(e) => setLimit(+e.target.value)} className="w-24 accent-[var(--accent)]" aria-label="LIMIT" />
          <span className="w-10 font-mono text-ink">{limit || 'none'}</span>
        </label>
        <label className={`flex items-center gap-1 text-xs text-muted ${limit === 0 ? 'opacity-40' : ''}`}><input type="checkbox" checked={ties} disabled={limit === 0} onChange={(e) => setTies(e.target.checked)} className="accent-[var(--accent)]" />WITH TIES</label>
      </div>
      <Note k={`${ci}-${col}-${dir}-${nulls}-${limit}-${ties}`} t={kept.length === 0 ? 'dead' : undefined}><Md>{cond.say + (tieNote ? ' ' + tieNote : '')}</Md></Note>
      <Legend items={[['ok', 'WHERE is true: kept'], ['dead', 'false: dropped'], ['header', 'NULL: also dropped'], ['muted', 'cut by LIMIT']]} />
      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="grid content-start gap-2">
          <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
            <div className="grid min-w-[290px] grid-cols-[1.4rem_1fr_3.6rem_2.8rem_3.4rem] sm:grid-cols-[2rem_6.5rem_4.5rem_4rem_3.5rem_1fr] gap-x-2 border-b border-line px-2 py-1 font-mono text-[11px] font-semibold text-muted">
              <span>id</span><span>name</span><span className="hidden sm:block">category</span><span className="text-right">price</span><span className="text-right">stock</span><span className="text-right">WHERE →</span>
            </div>
            {order.map((p, idx) => {
              const v = evals.get(p.id)!
              const keptRow = v === true
              const cut = keptRow && idx >= shown
              const t: Tone = !keptRow ? (v === null ? 'header' : 'dead') : cut ? 'muted' : 'ok'
              return (
                <motion.div key={p.id} layout transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  className="grid min-w-[290px] grid-cols-[1.4rem_1fr_3.6rem_2.8rem_3.4rem] sm:grid-cols-[2rem_6.5rem_4.5rem_4rem_3.5rem_1fr] items-center gap-x-2 border-b border-line px-2 py-1 font-mono text-[12px] last:border-0"
                  animate={{ opacity: keptRow && !cut ? 1 : 0.42 }}
                  style={{ background: toneBg(t, keptRow && !cut ? 12 : 6), boxShadow: `inset 3px 0 0 ${tone(t)}` }}>
                  <span>{p.id}</span><span className={`truncate ${keptRow ? '' : 'line-through'}`}>{p.name}</span><span className="hidden sm:block">{p.category}</span>
                  <span className="text-right" style={col === 'price' ? { fontWeight: 700 } : undefined}>{money(p.price)}</span>
                  <span className="text-right" style={col === 'stock' ? { fontWeight: 700 } : undefined}><Val v={p.stock} /></span>
                  <span className="text-right">{cut ? <span className="text-[10.5px] text-muted">LIMIT</span> : <Tri v={v} />}</span>
                </motion.div>
              )
            })}
          </div>
          <Sql>{sql}</Sql>
        </div>
        <div className="grid content-start gap-2">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="returned" value={Math.min(shown, kept.length)} t="ok" />
            <Stat label="false" value={PRODUCTS.length - kept.length - nullCount} t="dead" />
            <Stat label="NULL" value={nullCount} t="header" />
          </div>
          <Panel title="three-valued logic">
            <div className="mb-2"><Segmented label="operator" value={op} onChange={setOp} options={[['AND', 'AND'], ['OR', 'OR'], ['NOT', 'NOT']]} /></div>
            <table className="w-full border-collapse font-mono text-[11px]">
              <thead>
                <tr className="text-muted">
                  <th className="py-1 pr-1 text-left font-semibold">{T[op][0]}</th>
                  {op === 'NOT' ? <th className="py-1" /> : vals.map((b) => <th key={String(b)} className="py-1"><span className="text-muted">b=</span><Tri v={b} /></th>)}
                </tr>
              </thead>
              <tbody>
                {vals.map((a, r) => (
                  <tr key={String(a)}>
                    <td className="py-1 pr-1"><span className="text-muted">a=</span><Tri v={a} /></td>
                    {T[op][1][r].map((res, k) => (
                      <td key={k} className="py-1 text-center">
                        <motion.span key={op + r + k} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: (r * 3 + k) * 0.03 }} className="inline-block"><Tri v={res} /></motion.span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11.5px] text-muted"><Md>NULL means **unknown**. `false AND unknown` is false, `true OR unknown` is true; anything else involving unknown stays unknown. WHERE keeps only **true**.</Md></p>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'filter-and-sort',
  module: 'f1',
  order: 3,
  title: 'Filtering and sorting',
  tldr: [
    '`WHERE` keeps only the rows whose condition is **true**, `ORDER BY` sorts them, and `LIMIT` keeps the first few.',
    'Those three clauses turn "the whole table" into "the ten rows this screen needs", and the rules around `NULL`, operator precedence and ties decide whether you get the rows you meant.',
  ],
  visualizer: {
    title: 'Filter lab: true, false and NULL',
    caption: 'Pick a WHERE condition and see each row\'s verdict. Then sort, move NULLs, and drag LIMIT. The table on the right shows how NULL combines with AND, OR and NOT.',
    Component: FilterSortViz,
  },
  playground: {
    setup: PRODUCTS_SQL,
    presets: [
      { label: 'Compare', sql: `SELECT name, price FROM products WHERE price < 20;
SELECT name, category FROM products WHERE category <> 'office';`,
        note: '`<>` (or `!=`) means "not equal". Text comparisons are exact and case-sensitive: `category = \'Office\'` would match nothing.' },
      { label: 'AND / OR precedence', sql: `SELECT name, category, price FROM products
WHERE category = 'kitchen' OR category = 'home' AND price > 20;

SELECT name, category, price FROM products
WHERE (category = 'kitchen' OR category = 'home') AND price > 20;`,
        note: 'Five rows, then three. Without parentheses AND is applied first, so cheap kitchen items sneak in.' },
      { label: 'IN, BETWEEN, LIKE', sql: `SELECT name FROM products WHERE category IN ('home', 'office');
SELECT name, price FROM products WHERE price BETWEEN 15 AND 45;
SELECT name FROM products WHERE name LIKE 'Desk%';
SELECT name FROM products WHERE name ILIKE '%POT%';
SELECT name FROM products WHERE name LIKE '_e%';`,
        note: '`BETWEEN` includes both ends: five rows, from 15.00 up to 45.00. `_` matches one character: names whose second letter is `e`.' },
      { label: 'NULL traps', sql: `SELECT name, stock FROM products WHERE stock < 10;
SELECT name, stock FROM products WHERE stock = NULL;
SELECT name, stock FROM products WHERE stock IS NULL;
SELECT name, stock FROM products WHERE stock < 10 OR stock IS NULL;
SELECT NULL = NULL AS null_eq_null, NULL AND false AS and_false, NULL OR true AS or_true;`,
        note: '`stock < 10` misses the two unknowns; `= NULL` finds nothing; `IS NULL` finds them. `NULL = NULL` is itself NULL.' },
      { label: 'Sort, NULLs first or last', sql: `SELECT name, stock FROM products ORDER BY stock;
SELECT name, stock FROM products ORDER BY stock DESC;
SELECT name, stock FROM products ORDER BY stock DESC NULLS LAST;
SELECT name, category, price FROM products ORDER BY category, price DESC;`,
        note: 'NULLs sort as if larger than any value: last when ascending, first when descending, unless you say `NULLS FIRST/LAST`. The last query sorts by category, then by price within each category.' },
      { label: 'LIMIT, OFFSET, WITH TIES', sql: `SELECT name, price FROM products ORDER BY price LIMIT 3;
SELECT name, price FROM products ORDER BY price LIMIT 3 OFFSET 3;
SELECT name, price FROM products ORDER BY price FETCH FIRST 3 ROWS WITH TIES;
SELECT name, price FROM products ORDER BY price, id LIMIT 3;`,
        note: 'Pen set and Plant pot tie at 15.00. `LIMIT 3` picks one of them; `WITH TIES` returns both (4 rows); adding `id` as a tiebreaker makes `LIMIT 3` repeatable. `OFFSET 3` skips the first three.' },
      { label: 'DISTINCT', sql: `SELECT DISTINCT category FROM products ORDER BY category;
SELECT DISTINCT stock IS NULL AS unknown_stock FROM products;`,
        note: '`DISTINCT` removes duplicate result rows. Three categories out of nine rows.' },
    ],
  },
  production: {
    title: 'A low-stock alert that missed items',
    context: 'A shop runs a nightly job that emails the buyer a list of products to reorder: `WHERE stock < 10`.',
    problem: 'New products are created with `stock` NULL until the first stock count. They never appeared in the alert, because `NULL < 10` is not true, and some sold out before anyone noticed they had never been counted.',
    solution: 'Say what to do with unknowns explicitly, and sort so the most urgent rows come first, NULLs included.',
    sql: `SELECT id, name, stock
FROM products
WHERE stock < 10 OR stock IS NULL
ORDER BY stock NULLS FIRST, name;`,
    outcome: 'On the sample data the alert grows from 3 rows to 5: Teapot and Pen set, which have never been counted, now come first. The rows are in the same order every night.',
  },
  pitfalls: [
    { title: 'col = NULL finds nothing',
      symptom: '`WHERE deleted_at = NULL` returns zero rows although many rows have no `deleted_at`.',
      cause: 'Any comparison with NULL gives NULL (unknown), and WHERE keeps only true.',
      fix: 'Use `IS NULL` / `IS NOT NULL`. To compare two columns that may both be NULL, use `a IS NOT DISTINCT FROM b`.' },
    { title: 'OR without parentheses',
      symptom: 'A filter for "kitchen or home items over 20" returns cheap kitchen items.',
      cause: '`AND` binds tighter than `OR`: `a OR b AND c` means `a OR (b AND c)`.',
      fix: 'Put parentheses around every OR group: `(a OR b) AND c`.' },
    { title: 'NOT IN with a NULL in the list',
      symptom: '`SELECT * FROM customers c WHERE c.id NOT IN (SELECT customer_id FROM orders)` suddenly returns no rows at all.',
      cause: 'If the list holds a NULL, `x NOT IN (…)` is never true: it means `x <> a AND x <> NULL`, and the last part is unknown.',
      fix: 'Use `NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)`, or filter NULLs out of the list. See [Subqueries](/m3/subqueries).',
      sql: 'SELECT 5 NOT IN (1, 2) AS no_null, 5 NOT IN (1, NULL) AS with_null;' },
    { title: 'LIMIT without a full ORDER BY',
      symptom: 'Page 2 of a list repeats an item from page 1, or an item is never shown.',
      cause: 'Without ORDER BY, or with ties in the sort key, the database may return tied rows in any order, and each query can choose differently.',
      fix: 'Always sort by a unique tiebreaker last: `ORDER BY price, id LIMIT 20 OFFSET 20`. For deep paging see [Pagination: OFFSET vs keyset](/f4/pagination).' },
  ],
  pointers: [
    '`WHERE` keeps rows whose condition is **true**. False and NULL (unknown) are both dropped.',
    'Precedence: `NOT`, then `AND`, then `OR`. When mixing AND and OR, use parentheses.',
    '`IN (…)`, `BETWEEN a AND b` (inclusive), `LIKE` (`%` any, `_` one; case-sensitive), `ILIKE` (any case), `IS [NOT] NULL`.',
    '`ORDER BY a, b DESC`; NULLs are last ascending and first descending unless `NULLS FIRST/LAST`. Use a unique tiebreaker before `LIMIT`.',
    '**Going deeper:** [Designing indexes](/m4/index-design) shows how an index can answer a WHERE and ORDER BY without reading the whole table.',
  ],
  sources: ['queries-table-expressions.html', 'functions-comparison.html', 'functions-logical.html', 'functions-matching.html', 'sql-syntax-lexical.html', 'queries-order.html', 'queries-limit.html', 'queries-select-lists.html', 'sql-select.html', 'functions-subquery.html'],
}
