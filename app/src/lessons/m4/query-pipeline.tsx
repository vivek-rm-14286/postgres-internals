import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Bar, Btn, Msg } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one real query travels parser → analyzer → rewriter → planner → executor.
 * OIDs, operator names, path costs and row counts were captured from PGlite (PostgreSQL 18.6)
 * running exactly the playground setup below. ANALYZE samples randomly, so the playground's last
 * digits can differ slightly.
 * ---------------------------------------------------------------------------------------------- */

const SQL = `SELECT c.name, b.amount
FROM big_orders b JOIN customers c ON c.id = b.customer_id
WHERE c.region = 'north';`

const STAGES = ['Parser', 'Analyzer', 'Rewriter', 'Planner', 'Executor'] as const

interface TNode { label: string; sub?: string; t: Tone; kids?: TNode[] }

const rawTree: TNode = { label: 'SelectStmt', t: 'header', kids: [
  { label: 'targetList', t: 'muted', kids: [{ label: 'ColumnRef', sub: 'c.name', t: 'muted' }, { label: 'ColumnRef', sub: 'b.amount', t: 'muted' }] },
  { label: 'fromClause: JoinExpr', t: 'muted', kids: [
    { label: 'RangeVar', sub: '"big_orders" AS b', t: 'muted' }, { label: 'RangeVar', sub: '"customers" AS c', t: 'muted' },
    { label: 'A_Expr "="', sub: 'c.id, b.customer_id', t: 'muted' }] },
  { label: 'whereClause: A_Expr "="', sub: "c.region, A_Const 'north'", t: 'muted' },
] }

const queryTree: TNode = { label: 'Query (CMD_SELECT)', t: 'header', kids: [
  { label: 'rtable', t: 'pointer', kids: [
    { label: 'RTE 1: big_orders', sub: 'oid 16407, relkind v (view)', t: 'new' },
    { label: 'RTE 2: customers', sub: 'oid 16384, relkind r', t: 'pointer' }] },
  { label: 'targetList', t: 'tuple', kids: [{ label: 'Var', sub: 'rte 2, attno 3 (name) : text', t: 'tuple' }, { label: 'Var', sub: 'rte 1, attno 3 (amount) : numeric', t: 'tuple' }] },
  { label: 'jointree quals', t: 'tuple', kids: [
    { label: 'OpExpr = (oid 96, int4eq)', sub: 'Var 2.1 = Var 1.2', t: 'tuple' },
    { label: 'OpExpr = (oid 98, texteq)', sub: "Var 2.2 = Const 'north'::text", t: 'tuple' }] },
] }

const rewrittenTree: TNode = { label: 'Query (CMD_SELECT)', t: 'header', kids: [
  { label: 'rtable', t: 'pointer', kids: [
    { label: 'RTE 1: subquery (from rule _RETURN)', sub: 'view body pasted in', t: 'new', kids: [
      { label: 'RTE: orders', sub: 'oid 16394, relkind r', t: 'pointer' },
      { label: 'qual: OpExpr > (oid 1756, numeric_gt)', sub: "amount > 900", t: 'tuple' }] },
    { label: 'RTE 2: customers', sub: 'oid 16384', t: 'pointer' }] },
  { label: 'targetList, quals', sub: 'unchanged', t: 'muted' },
] }

function Tree({ n, depth = 0 }: { n: TNode; depth?: number }) {
  return (
    <motion.div layout initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: depth * 0.04 }}
      className={depth ? 'border-l border-line pl-3' : ''}>
      <div className="my-1 inline-flex flex-wrap items-baseline gap-x-2 rounded-md border px-2 py-0.5 font-mono text-[12px]"
        style={{ borderColor: tone(n.t), background: toneBg(n.t, 14) }}>
        <span className="font-semibold">{n.label}</span>{n.sub && <span className="text-muted">{n.sub}</span>}
      </div>
      {n.kids?.map((k, i) => <Tree key={k.label + i} n={k} depth={depth + 1} />)}
    </motion.div>
  )
}

type TokKind = 'kw' | 'id' | 'op' | 'lit'
const tokens: [string, TokKind][] = [['SELECT', 'kw'], ['c', 'id'], ['.', 'op'], ['name', 'id'], [',', 'op'], ['b', 'id'], ['.', 'op'], ['amount', 'id'], ['FROM', 'kw'], ['big_orders', 'id'], ['b', 'id'], ['JOIN', 'kw'], ['customers', 'id'], ['c', 'id'], ['ON', 'kw'], ['c', 'id'], ['.', 'op'], ['id', 'id'], ['=', 'op'], ['b', 'id'], ['.', 'op'], ['customer_id', 'id'], ['WHERE', 'kw'], ['c', 'id'], ['.', 'op'], ['region', 'id'], ['=', 'op'], ["'north'", 'lit'], [';', 'op']]
const tokTone: Record<TokKind, Tone> = { kw: 'header', id: 'tuple', op: 'muted', lit: 'new' }

/* ---------- executor: demand-pull plan tree ---------- */
interface ExecState { hj: string; outer: string; hash: string; inner: string; active: ('outer' | 'hash' | 'inner' | 'hj')[]; calls: ('outer' | 'hash' | 'inner')[] }

const NODES = {
  hj: { x: 300, y: 14, w: 230, label: 'Hash Join', sub: 'Hash Cond: orders.customer_id = c.id' },
  outer: { x: 40, y: 150, w: 250, label: 'Seq Scan on orders', sub: "Filter: amount > 900" },
  hash: { x: 360, y: 118, w: 200, label: 'Hash', sub: 'Buckets 2048 · 57kB' },
  inner: { x: 340, y: 222, w: 240, label: 'Seq Scan on customers c', sub: "Filter: region = 'north'" },
} as const
type NodeKey = keyof typeof NODES
const EDGES: [NodeKey, NodeKey][] = [['outer', 'hj'], ['hash', 'hj'], ['inner', 'hash']]

function ExecTree({ s }: { s: ExecState }) {
  const center = (k: NodeKey) => ({ x: NODES[k].x + NODES[k].w / 2, top: NODES[k].y, bottom: NODES[k].y + 58 })
  return (
    <svg viewBox="0 0 640 290" className="w-full min-w-[600px]" role="img" aria-label="Executor plan tree pulling rows">
      <defs><marker id="qp-up" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-pointer)" /></marker></defs>
      {EDGES.map(([c, p]) => {
        const a = center(c), b = center(p)
        const live = s.active.includes(c)
        return (
          <g key={c}>
            <line x1={a.x} y1={a.top} x2={b.x} y2={b.bottom + 2} stroke={live ? 'var(--c-pointer)' : 'var(--border)'} strokeWidth={live ? 2 : 1.2} markerEnd="url(#qp-up)" />
            {s.calls.includes(c as 'outer') && <text x={(a.x + b.x) / 2 + 8} y={(a.top + b.bottom) / 2} fontSize={10} fill="var(--c-new)" fontFamily="var(--font-mono)">next()?</text>}
            {live && [0, 1, 2].map((i) => (
              <motion.circle key={i} r={4} fill="var(--c-tuple)" initial={{ cx: a.x, cy: a.top, opacity: 0 }}
                animate={{ cx: [a.x, b.x], cy: [a.top, b.bottom + 4], opacity: [0, 1, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.37, ease: 'easeInOut' }} />
            ))}
          </g>
        )
      })}
      {(Object.keys(NODES) as NodeKey[]).map((k) => {
        const n = NODES[k]
        const on = s.active.includes(k as 'hj') || (k === 'hj' && s.active.includes('outer'))
        return (
          <g key={k}>
            <rect x={n.x} y={n.y} width={n.w} height={58} rx={7} fill={toneBg(on ? 'new' : 'header', on ? 16 : 10)} stroke={on ? tone('new') : tone('header')} strokeWidth={on ? 2 : 1} />
            <text x={n.x + 8} y={n.y + 17} fontSize={12} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{n.label}</text>
            <text x={n.x + 8} y={n.y + 32} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{n.sub}</text>
            <motion.text key={s[k]} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} x={n.x + 8} y={n.y + 49} fontSize={10.5} fontWeight={600} fill="var(--c-tuple)" fontFamily="var(--font-mono)">{s[k]}</motion.text>
          </g>
        )
      })}
    </svg>
  )
}

/* ---------- step states ---------- */
type View = 'text' | 'tokens' | 'raw' | 'query' | 'rewritten' | 'paths' | 'joins' | 'exec'
interface PState { stage: number; view: View; exec?: ExecState }

const steps: Step<PState>[] = [
  { title: 'Plain text arrives', body: 'The client sends the query as a **string**. Nothing is parsed on the client side. The backend owns every step from here on.', state: { stage: 0, view: 'text' } },
  { title: 'Lexer: characters become tokens', body: 'The flex lexer (`scan.l`) cuts the text into **keywords**, **identifiers**, **operators** and **literals**. `big_orders` is just a name so far.', state: { stage: 0, view: 'tokens' } },
  { title: 'Grammar: the raw parse tree', body: 'The bison grammar (`gram.y`) builds a **raw parse tree** from syntax rules alone. It does **no catalog lookups**: a typo in a column name is not detected yet.', state: { stage: 0, view: 'raw' } },
  { title: 'Parse analysis: the query tree', body: 'Inside a transaction, names are resolved against the catalogs: relations get OIDs, columns become typed **Vars**, `=` becomes a concrete operator (`texteq`). `big_orders` turns out to be a **view**.', state: { stage: 1, view: 'query' } },
  { title: 'Rewriter: the view is expanded', body: 'The view is stored as a `_RETURN` **rule**. The rewriter pastes its body in as a subquery, like a macro. Input and output are both query trees.', state: { stage: 2, view: 'rewritten' } },
  { title: 'Planner: one path per way to scan', body: 'The subquery is pulled up into a flat join. For each relation the planner builds scan **paths** and costs them. A sequential scan path always exists.', state: { stage: 3, view: 'paths' } },
  { title: 'Planner: join search', body: 'For two relations it costs every join method in both directions and keeps the cheapest. Real costs from this query: **hash join 2022**, merge join 2788, nested loop 3528.', state: { stage: 3, view: 'joins' } },
  { title: 'Executor: Hash pulls its whole input', body: 'Execution is **demand-pull**: the top node asks its children for one row at a time. First, Hash Join needs its hash table, so **Hash** drains the customers scan: 5000 rows read, 1250 kept.',
    state: { stage: 4, view: 'exec', exec: { hj: 'waiting for hash table', outer: '—', hash: 'building: 1250 rows', inner: '5000 read · 1250 out', active: ['inner'], calls: ['hash', 'inner'] } } },
  { title: 'Executor: probe one outer row at a time', body: 'Now Hash Join calls `next()` on the orders scan. Each returned row probes the hash table. A match is **emitted upward immediately**, before the scan finishes.',
    state: { stage: 4, view: 'exec', exec: { hj: 'probing: 1 row out', outer: 'returning row 1 …', hash: 'ready: 1250 rows', inner: 'done (NULL)', active: ['outer'], calls: ['outer'] } } },
  { title: 'Executor: NULL means done', body: 'When the orders scan returns **NULL**, the join is finished. Totals from EXPLAIN ANALYZE: 100000 orders read, **9700** passed the filter, **2425** rows joined.',
    state: { stage: 4, view: 'exec', exec: { hj: 'done: 2425 rows', outer: '100000 read · 9700 out', hash: '1250 rows', inner: 'done (NULL)', active: [], calls: [] } } },
]

function StageBar({ stage }: { stage: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STAGES.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div className="relative rounded-md border px-2.5 py-1 text-xs font-semibold"
            style={{ borderColor: i === stage ? tone('new') : 'var(--border)', color: i <= stage ? 'var(--text)' : 'var(--muted)', background: i < stage ? toneBg('ok', 12) : 'transparent' }}>
            {i === stage && <motion.span layoutId="qp-stage" className="absolute inset-0 rounded-md" style={{ background: toneBg('new', 22) }} transition={{ type: 'spring', stiffness: 260, damping: 26 }} />}
            <span className="relative">{s}</span>
          </div>
          {i < STAGES.length - 1 && <span className="text-muted">→</span>}
        </div>
      ))}
    </div>
  )
}

function StageView({ s }: { s: PState }): ReactNode {
  switch (s.view) {
    case 'text': return <pre className="rounded-lg border border-line bg-code p-3 font-mono text-[12.5px]">{SQL}</pre>
    case 'tokens': return (
      <div className="flex flex-wrap gap-1.5">
        {tokens.map(([t, k], i) => (
          <motion.span key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
            className="rounded px-1.5 py-0.5 font-mono text-[12px]" style={{ background: toneBg(tokTone[k], 18), color: tone.text(tokTone[k]) }}>{t}</motion.span>
        ))}
      </div>
    )
    case 'raw': return <Tree n={rawTree} />
    case 'query': return <Tree n={queryTree} />
    case 'rewritten': return <Tree n={rewrittenTree} />
    case 'paths': return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel title="orders (100000 rows, 637 pages)">
          <div className="grid gap-1.5">
            <Bar label="Seq Scan" value={1887} max={2000} t="ok" win note="0.00..1887.00" />
            <p className="text-xs text-muted"><Md>{'`amount > 900` has no index, so the seq scan is the only path. Estimated **9694** of 100000 rows pass.'}</Md></p>
          </div>
        </Panel>
        <Panel title="customers (5000 rows, 32 pages)">
          <div className="grid gap-1.5">
            <Bar label="Seq Scan" value={94.5} max={200} t="ok" win note="0.00..94.50" />
            <Bar label="Index Scan pkey" value={186.78} max={200} t="tuple" note="0.28..186.78" />
            <p className="text-xs text-muted"><Md>{'The index path is costlier but returns rows **sorted by id**, so it is kept for a possible merge join.'}</Md></p>
          </div>
        </Panel>
      </div>
    )
    case 'joins': return (
      <Panel title="join paths for {orders, customers} (estimated rows 2423)">
        <div className="grid gap-2">
          <Bar label="Hash Join" value={2022.47} max={3600} t="ok" win note="2022.47" />
          <Bar label="Merge Join" value={2787.77} max={3600} t="tuple" note="2787.77" />
          <Bar label="Nested Loop" value={3528.49} max={3600} t="tuple" note="3528.49" />
          <p className="text-xs text-muted"><Md>{'Merge join must sort 9648 orders rows first. The nested loop does one memoized index probe per order. Fewer than `geqo_threshold` (12) relations means this search is near-exhaustive.'}</Md></p>
        </div>
      </Panel>
    )
    case 'exec': return <ExecTree s={s.exec!} />
  }
}

function Pipeline() {
  return (
    <Stepper steps={steps} interval={3400} render={(s) => (
      <div className="grid gap-3">
        <StageBar stage={s.stage} />
        <Legend items={[['header', 'statement / plan node'], ['pointer', 'catalog object (OID)'], ['tuple', 'typed expression'], ['new', 'changed or running in this step']]} />
        <div className="min-h-[230px] rounded-lg border border-line bg-bg p-3">
          <AnimatePresence mode="wait">
            <motion.div key={s.view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <StageView s={s} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )} />
  )
}

/* ---------- plan cache: custom vs generic, from pg_prepared_statements ---------- */
const STMTS = [
  { name: 'by_cust(int)', sql: 'SELECT * FROM orders WHERE customer_id = $1', custom: 74.07, generic: 74.07, plan: 'Bitmap Heap Scan (20 rows)', switchAt: 6,
    why: 'Every customer has about 20 orders, so the generic plan (cost 74.07, with `$1`) is as cheap as the custom ones. From execution 6 PostgreSQL stops replanning: `generic_plans` starts counting.' },
  { name: "by_status('pending')", sql: 'SELECT count(*) FROM orders WHERE status = $1', custom: 124.92, generic: 1587.93, plan: 'Index Only Scan (1010 rows)', switchAt: 0,
    why: "`status` is skewed: 1% pending, 99% shipped. The generic plan must assume 1/n_distinct = 50000 rows (cost 1587.93), far above the custom average (124.92), so PostgreSQL **keeps replanning** with the real value." },
]

function PlanCache() {
  const [n, setN] = useState(0)
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setN((x) => Math.min(8, x + 1))} disabled={n >= 8}>EXECUTE both</Btn>
        <Btn onClick={() => setN(0)}>DEALLOCATE ALL</Btn>
        <span className="font-mono text-xs text-muted">executions: {n}</span>
      </div>
      {STMTS.map((st) => {
        const gen = st.switchAt ? Math.max(0, n - st.switchAt + 1) : 0
        return (
          <Panel key={st.name} title={`PREPARE ${st.name}`}>
            <p className="mb-2 font-mono text-[11.5px] text-muted">{st.sql}</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 8 }, (_, i) => {
                const done = i < n
                const generic = st.switchAt > 0 && i + 1 >= st.switchAt
                const t: Tone = !done ? 'muted' : generic ? 'ok' : 'new'
                return (
                  <motion.div key={i} layout animate={{ opacity: done ? 1 : 0.35, scale: done && i === n - 1 ? [1, 1.08, 1] : 1 }}
                    className="w-[76px] rounded-md border px-1.5 py-1 text-center font-mono text-[10.5px]" style={{ borderColor: tone(t), background: toneBg(t, done ? 16 : 6) }}>
                    <div className="font-semibold">#{i + 1}</div>
                    <div>{done ? (generic ? 'generic' : 'custom') : '·'}</div>
                    <div className="text-muted">{done ? (generic ? st.generic : st.custom) : ''}</div>
                  </motion.div>
                )
              })}
            </div>
            <div className="mt-2 grid gap-1.5">
              <Bar label="avg custom cost" value={st.custom} max={1700} t="new" note={st.custom.toFixed(2)} />
              <Bar label="generic cost" value={st.generic} max={1700} t={st.switchAt ? 'ok' : 'dead'} note={st.generic.toFixed(2)} win={st.switchAt > 0 && n >= 5} />
            </div>
            <p className="mt-2 font-mono text-[11px]">pg_prepared_statements: generic_plans = <b>{gen}</b>, custom_plans = <b>{Math.min(n, st.switchAt ? st.switchAt - 1 : n)}</b></p>
            {n >= 5 && <p className="mt-1 text-xs text-muted"><Md>{st.why}</Md></p>}
          </Panel>
        )
      })}
      <Msg k={n < 5 ? 0 : 1} text={n < 5 ? 'PREPARE ran parse, analysis and rewrite **once**. Each EXECUTE plans with the actual parameter: these are **custom plans**. After 5 of them PostgreSQL builds a generic plan and compares costs.' : 'Execution 6 is the decision point (`plan_cache_mode = auto`). Use `force_custom_plan` or `force_generic_plan` to override it.'} />
    </div>
  )
}

function PipelineViz() {
  const [mode, setMode] = useState<'pipe' | 'cache'>('pipe')
  return (
    <div className="grid gap-3">
      <Segmented label="Mode" value={mode} onChange={setMode} options={[['pipe', 'One query, five stages'], ['cache', 'Prepared statements: plan cache']]} />
      {mode === 'pipe' ? <Pipeline /> : <PlanCache />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `
CREATE TABLE customers (id int PRIMARY KEY, region text NOT NULL, name text NOT NULL);
INSERT INTO customers SELECT g, (ARRAY['north','south','east','west'])[1 + g % 4], 'cust ' || g
FROM generate_series(1, 5000) g;
CREATE TABLE orders (id int PRIMARY KEY, customer_id int NOT NULL, status text NOT NULL, amount numeric(10,2) NOT NULL);
INSERT INTO orders SELECT g, 1 + (g * 7) % 5000,
       CASE WHEN g % 100 = 0 THEN 'pending' ELSE 'shipped' END, (g % 997) + 0.99
FROM generate_series(1, 100000) g;
CREATE INDEX orders_customer ON orders (customer_id);
CREATE INDEX orders_status ON orders (status);
CREATE VIEW big_orders AS SELECT id, customer_id, amount FROM orders WHERE amount > 900;
ANALYZE customers;
ANALYZE orders;`

export const lesson: Lesson = {
  slug: 'query-pipeline',
  module: 'm4',
  order: 1,
  title: 'From SQL text to rows: parse, analyze, rewrite, plan, execute',
  tldr: [
    'Every statement passes through five stages: a **parser** that knows only grammar, **analysis** that resolves names against the catalogs, a **rewriter** that expands views and rules, a **planner** that costs alternative paths, and an **executor** that pulls rows up a plan tree.',
    'Splitting the work this way lets PostgreSQL parse transaction commands without a transaction, reuse analyzed statements through **PREPARE**, and pick among many equivalent plans by estimated cost.',
  ],
  visualizer: {
    title: 'Follow one query through the backend',
    caption: 'Step through a join against a view, from characters to tokens, trees, costed paths and finally rows pulled up the plan. Switch modes to watch the plan cache decide between custom and generic plans.',
    Component: PipelineViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'The view is a rule', sql: `SELECT rulename, ev_type FROM pg_rewrite WHERE ev_class = 'big_orders'::regclass;

SELECT pg_get_viewdef('big_orders');`,
        note: 'A view is stored as a `_RETURN` rule (`ev_type` 1 = SELECT). The rewriter pastes this definition into every query that names the view.' },
      { label: 'The view disappears', sql: `EXPLAIN VERBOSE
SELECT c.name, b.amount
FROM big_orders b JOIN customers c ON c.id = b.customer_id
WHERE c.region = 'north';`,
        note: 'The plan scans `public.orders` directly with the view\'s `amount > 900` filter. After rewriting and subquery pull-up, `big_orders` no longer exists.' },
      { label: 'Three join paths', sql: `SET enable_hashjoin = off;
EXPLAIN SELECT c.name, b.amount FROM big_orders b JOIN customers c ON c.id = b.customer_id WHERE c.region = 'north';
SET enable_mergejoin = off;
EXPLAIN SELECT c.name, b.amount FROM big_orders b JOIN customers c ON c.id = b.customer_id WHERE c.region = 'north';
RESET enable_hashjoin;
RESET enable_mergejoin;`,
        note: 'Disabling the winner reveals the runner-up paths the planner costed: merge join (about 2788), then nested loop with Memoize (about 3528). The hash join (about 2022) won.' },
      { label: 'Demand-pull counts', sql: `EXPLAIN (ANALYZE, TIMING OFF)
SELECT c.name, b.amount
FROM big_orders b JOIN customers c ON c.id = b.customer_id
WHERE c.region = 'north';`,
        note: 'Each node reports the rows it handed to its parent: customers 1250 (3750 removed), orders 9700 (90300 removed), join 2425.' },
      { label: 'Subqueries become joins', sql: `EXPLAIN SELECT count(*) FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'pending');

EXPLAIN SELECT count(*) FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id AND o.status = 'pending');

EXPLAIN SELECT count(*) FROM customers c
WHERE c.id NOT IN (SELECT o.customer_id FROM orders o WHERE o.status = 'pending');`,
        note: 'The planner rewrites EXISTS into a join: here a Hash Join over the de-duplicated customer ids. NOT EXISTS becomes a **Hash Right Anti Join** estimated at 3974 rows. NOT IN cannot become an anti join, because one NULL in the subquery would make every row unknown. It stays a `hashed SubPlan` filter, with a blind 2500-row guess.' },
      { label: 'CTE: inlined or materialized', sql: `EXPLAIN WITH p AS (SELECT * FROM orders WHERE status = 'pending')
SELECT * FROM p WHERE customer_id = 42;

EXPLAIN WITH p AS MATERIALIZED (SELECT * FROM orders WHERE status = 'pending')
SELECT * FROM p WHERE customer_id = 42;`,
        note: 'A plain CTE used once is **inlined**: the outer filter joins it, and a BitmapAnd of two indexes finds 1 row (cost about 21). `MATERIALIZED` computes all 1,000 pending rows first (the estimate is close to that), then filters a `CTE Scan` (cost about 135).' },
      { label: 'PostgreSQL 18 rewrites', sql: `EXPLAIN (COSTS OFF)
SELECT a.* FROM orders a JOIN orders b ON a.id = b.id WHERE b.amount > 900;

EXPLAIN (COSTS OFF)
SELECT * FROM orders WHERE id = 1 OR id = 2 OR id = 3;`,
        note: 'Two planner transformations new in PostgreSQL 18. A join of a table to itself on its unique key is removed, leaving one scan (`enable_self_join_elimination`). An OR list on one column becomes a single `= ANY` index condition.' },
      { label: 'Custom → generic', sql: `PREPARE by_cust(int) AS SELECT * FROM orders WHERE customer_id = $1;
EXECUTE by_cust(1);
EXECUTE by_cust(2);
EXECUTE by_cust(3);
EXECUTE by_cust(4);
EXECUTE by_cust(5);
EXECUTE by_cust(6);
SELECT name, generic_plans, custom_plans FROM pg_prepared_statements;
EXPLAIN EXECUTE by_cust(42);`,
        note: 'Five custom plans, then the generic plan wins: `generic_plans = 1`. EXPLAIN shows `customer_id = $1`, a plan built without knowing the value.' },
      { label: 'Skew keeps it custom', sql: `PREPARE by_status(text) AS SELECT count(*) FROM orders WHERE status = $1;
EXECUTE by_status('pending');
EXECUTE by_status('pending');
EXECUTE by_status('pending');
EXECUTE by_status('pending');
EXECUTE by_status('pending');
EXECUTE by_status('pending');
SELECT name, generic_plans, custom_plans FROM pg_prepared_statements WHERE name = 'by_status';
EXPLAIN (GENERIC_PLAN) SELECT count(*) FROM orders WHERE status = $1;`,
        note: 'The generic plan assumes 50000 matching rows and costs far more than the custom plans, so `generic_plans` stays 0.' },
    ],
  },
  production: {
    title: 'A prepared statement that turned slow on the sixth call',
    context: 'A ticketing service used a driver that prepares every query. The hot query was `SELECT … FROM tickets WHERE tenant_id = $1 AND state = $2 ORDER BY created_at LIMIT 50`. One tenant owned most of the rows.',
    problem: 'Latency for small tenants jumped after a connection had served a few requests. The first five executions got custom plans. Then the cached **generic plan** won the cost comparison, and it was tuned for an average tenant, so it walked the big tenant\'s part of the index for everyone.',
    solution: 'Confirm with `EXPLAIN EXECUTE` and `pg_prepared_statements.generic_plans`. Then force replanning for the role that runs this query, or send that one query unprepared. Planning costs well under a millisecond here, which is much cheaper than a bad plan.',
    sql: `SELECT name, generic_plans, custom_plans FROM pg_prepared_statements;
ALTER ROLE ticket_api SET plan_cache_mode = force_custom_plan;
-- or per session / transaction:
SET plan_cache_mode = force_custom_plan;`,
    outcome: 'Every execution is planned with the real tenant id, so small tenants get an index scan on their own rows again. The cost is one planning pass per call, which `EXPLAIN (ANALYZE)` reports as Planning Time (about 0.1 to 0.9 ms in the playground).',
  },
  pitfalls: [
    { title: 'Generic plans on skewed parameters',
      symptom: 'A prepared query is fast for its first five calls on a connection, then slow for some parameter values only.',
      cause: 'With `plan_cache_mode = auto`, the sixth execution may switch to a **generic plan** whose estimates use average selectivity instead of the actual value.',
      fix: 'Check `generic_plans` in `pg_prepared_statements` and compare `EXPLAIN EXECUTE` with `EXPLAIN (GENERIC_PLAN)`. Set `plan_cache_mode = force_custom_plan` for that workload.',
      sql: `SET plan_cache_mode = force_custom_plan;` },
    { title: 'Expecting a view to be cached',
      symptom: 'A view over an expensive aggregate is as slow as the query itself, every time.',
      cause: 'A view is a rewrite **rule**: its definition is pasted into each query. Nothing is stored or reused.',
      fix: 'Use a **materialized view** (refreshed explicitly) or a summary table when you need the result stored.' },
    { title: 'Big joins switch to GEQO',
      symptom: 'A report joining a dozen tables gets different, sometimes much worse plans after unrelated changes.',
      cause: 'At `geqo_threshold` (12) FROM items the planner stops near-exhaustive search and uses the **genetic optimizer**, which samples join orders randomly. With explicit `JOIN` syntax the earlier limit is `join_collapse_limit` = 8 (and `from_collapse_limit` = 8 for subqueries): beyond 8 items the planner stops reordering and follows the order you wrote, so GEQO is reached mainly by comma-separated FROM lists or when those limits are raised to 12 or more.',
      fix: 'Reduce the join count (pre-aggregate, split the query), or write joins in a good order and set `join_collapse_limit = 1` for that query. `geqo_seed` makes the choice repeatable.' },
    { title: 'Using a CTE as an optimization fence, or as a cache',
      symptom: 'A query was split into a WITH clause "so it is computed once", yet the plan shows the CTE merged into the outer query. Or a CTE that used to isolate an expensive step now changes the plan.',
      cause: 'A common claim is that a CTE is always evaluated once and its result reused. Since PostgreSQL 12, a non-recursive, side-effect-free CTE that is referenced **once** is inlined like a subquery. Only a CTE referenced twice, a recursive or data-modifying CTE, or one marked `MATERIALIZED` is computed separately.',
      fix: 'Write `AS MATERIALIZED` when you really want compute-once or a fence, and `AS NOT MATERIALIZED` to allow inlining of a CTE that is referenced several times. Check the plan for a `CTE Scan` node.' },
    { title: 'NOT IN over a nullable subquery',
      symptom: '`WHERE id NOT IN (SELECT ref FROM t)` suddenly returns no rows at all, or runs far slower than the equivalent NOT EXISTS.',
      cause: 'If the subquery yields one NULL, `x NOT IN (…)` is never true. Because of that rule the planner cannot turn NOT IN into an anti join, so it uses a hashed SubPlan, or a plain SubPlan rescanned per row when the result does not fit in `work_mem`.',
      fix: 'Write `NOT EXISTS (SELECT 1 FROM t WHERE t.ref = x.id)`. It is NULL-safe and becomes an Anti Join.' },
  ],
  pointers: [
    'Stages: **parser** (grammar only, no catalogs) → **analysis** (names, types, operators) → **rewriter** (views, rules) → **planner** (paths, costs) → **executor**.',
    'The rewriter turns query trees into query trees. A view is a `_RETURN` rule expanded like a macro, then usually flattened into the outer query.',
    'The planner costs **paths** for each relation, then join pairs, keeping the cheapest. From `geqo_threshold` = 12 FROM items upward it switches to GEQO. See [The cost model](/m4/cost-model) and [Planner statistics](/m4/statistics).',
    'The executor is **demand-pull**: each node returns one row per call, or NULL when done. Hash and Sort must drain their input first.',
    '**PREPARE** caches the analyzed tree. Five custom plans, then a generic plan if its cost is not much higher (`plan_cache_mode`).',
  ],
  sources: ['query-path.html', 'parser-stage.html', 'rule-system.html', 'planner-optimizer.html', 'executor.html', 'sql-prepare.html', 'runtime-config-query.html', 'geqo.html'],
}
