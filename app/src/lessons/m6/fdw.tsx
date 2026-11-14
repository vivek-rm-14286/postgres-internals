import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Chip, Tile, TRY_SQL } from './_shared'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a simulation of postgres_fdw's planner deciding what to ship to the remote server.
 * PGlite has no postgres_fdw or file_fdw, so this is a model of the documented rules (postgres-fdw.html,
 * fdw-planning.html): a WHERE clause is shipped only if every function/operator in it is built-in and
 * IMMUTABLE; joins ship only between tables on the same server; aggregates, ORDER BY and LIMIT ship
 * only when nothing below them must run locally. Row counts use an illustrative remote table of
 * 1,000,000 orders with the selectivities listed below.
 * ---------------------------------------------------------------------------------------------- */

interface Qual { id: string; sql: string; remote: string; ship: boolean; why: string; sel: number }
const QUALS: Qual[] = [
  { id: 'status', sql: "o.status = 'shipped'", remote: "(status = 'shipped'::text)", ship: true, why: 'built-in `texteq`, IMMUTABLE', sel: 0.25 },
  { id: 'since', sql: "o.created_at >= '2026-11-01'", remote: "(created_at >= '2026-11-01 00:00:00+00'::timestamp with time zone)", ship: true, why: 'constant compared with a built-in operator', sel: 0.1 },
  { id: 'now', sql: "o.created_at >= now() - interval '7 days'", remote: '', ship: false, why: '`now()` is STABLE, not IMMUTABLE', sel: 0.05 },
  { id: 'email', sql: "lower(o.email) LIKE '%@example.com'", remote: "((lower(email) ~~ '%@example.com'::text))", ship: true, why: '`lower` and `~~` are built-in and IMMUTABLE', sel: 0.2 },
  { id: 'udf', sql: 'risk_score(o.id) > 0.8', remote: '', ship: false, why: 'user function: not built-in and not in the server\'s `extensions` list', sel: 0.02 },
]
type Join = 'none' | 'remote' | 'local'
interface Cfg { quals: string[]; join: Join; agg: boolean; order: boolean; limit: boolean; fetch: number }

const SCENARIOS: { cfg: Cfg; text: string }[] = [
  { cfg: { quals: [], join: 'none', agg: false, order: false, limit: false, fetch: 100 }, text: 'No WHERE clause: every one of the **1,000,000** remote rows crosses the network, 100 per FETCH (`fetch_size` default).' },
  { cfg: { quals: ['status'], join: 'none', agg: false, order: false, limit: false, fetch: 100 }, text: 'A built-in IMMUTABLE comparison **ships** in the Remote SQL. Only matching rows travel.' },
  { cfg: { quals: ['status', 'now'], join: 'none', agg: false, order: false, limit: true, fetch: 100 }, text: '`now()` is **STABLE**, so that clause stays local as a **Filter**. Because a local filter remains, the **LIMIT cannot ship** either.' },
  { cfg: { quals: ['status', 'since'], join: 'none', agg: false, order: true, limit: true, fetch: 100 }, text: 'Swap `now()` for a literal timestamp computed by the app: all quals ship, so ORDER BY and LIMIT ship too and only **10 rows** travel.' },
  { cfg: { quals: ['status', 'since'], join: 'none', agg: true, order: false, limit: false, fetch: 100 }, text: 'An aggregate over fully shipped quals is **pushed down**: the remote server returns one row per group (here a single group, `shipped`).' },
  { cfg: { quals: ['status', 'udf'], join: 'local', agg: false, order: false, limit: false, fetch: 1000 }, text: 'A join to a **local** table and a user function both run here. Raising `fetch_size` to 1000 cuts round trips, not rows.' },
  { cfg: { quals: ['status'], join: 'remote', agg: false, order: false, limit: false, fetch: 100 }, text: 'Both tables live on the **same server** with the same user mapping, so the **whole join** is shipped as one remote query.' },
]

const fmt = (n: number) => Math.round(n).toLocaleString()

function plan(c: Cfg) {
  const qs = QUALS.filter((q) => c.quals.includes(q.id))
  const shipped = qs.filter((q) => q.ship)
  const local = qs.filter((q) => !q.ship)
  const allShipped = local.length === 0
  const joinPushed = c.join === 'remote'
  const nothingLocal = allShipped && c.join !== 'local'
  const aggPushed = c.agg && nothingLocal
  const orderPushed = c.order && c.join !== 'local' && !c.agg
  const limitPushed = c.limit && nothingLocal && (!c.agg || aggPushed)
  const N = 1_000_000
  const remoteRows = N * shipped.reduce((p, q) => p * q.sel, 1)
  const afterLocal = remoteRows * local.reduce((p, q) => p * q.sel, 1)
  const groups = c.quals.includes('status') ? 1 : 4
  let wire = remoteRows
  if (aggPushed) wire = groups
  else if (limitPushed) wire = Math.min(10, remoteRows)
  const toClient = c.agg ? groups : c.limit ? Math.min(10, afterLocal) : afterLocal
  const trips = Math.max(1, Math.ceil(wire / c.fetch) + (wire % c.fetch === 0 ? 1 : 0))

  const r = joinPushed ? 'r1.' : ''
  const cols = aggPushed ? `${r}status, count(*)` : joinPushed ? 'r1.id, r1.status, r1.created_at, r2.name' : 'id, status, created_at'
  const from = joinPushed ? '(public.orders r1 INNER JOIN public.customers r2 ON (((r1.customer_id = r2.id))))' : 'public.orders'
  const where = shipped.length ? ` WHERE ${shipped.map((q) => (joinPushed ? q.remote.replace(/\((status|created_at|lower\(email)/, (m) => m.replace(/(status|created_at|email)/, 'r1.$1')) : q.remote)).join(' AND ')}` : ''
  let remote = `SELECT ${cols} FROM ${from}${where}`
  if (aggPushed) remote += ' GROUP BY 1'
  if (orderPushed) remote += ` ORDER BY ${r}created_at DESC NULLS FIRST`
  if (limitPushed) remote += ' LIMIT 10::bigint'

  const lines: [number, string, Tone?][] = []
  let d = 0
  if (c.limit && !limitPushed) lines.push([d++, 'Limit'])
  if (c.agg && !aggPushed) lines.push([d++, 'HashAggregate'], [d, '  Group Key: o.status', 'muted'])
  if (c.order && !orderPushed) lines.push([d++, 'Sort'], [d, '  Sort Key: o.created_at DESC', 'muted'])
  if (c.join === 'local') {
    lines.push([d++, 'Hash Join'], [d, '  Hash Cond: (o.region_id = r.id)', 'muted'])
    lines.push([d, '->  Seq Scan on public.regions r (local table)', 'tuple'])
  }
  lines.push([d, aggPushed ? 'Foreign Scan (aggregate pushed down)' : joinPushed ? 'Foreign Scan (join pushed down)' : 'Foreign Scan on public.orders_remote o', 'pointer'])
  if (local.length) lines.push([d + 1, `Filter: ${local.map((q) => `(${q.sql})`).join(' AND ')}`, 'dead'])
  lines.push([d + 1, `Remote SQL: ${remote}`, 'ok'])

  const callbacks = ['GetForeignRelSize', 'GetForeignPaths', ...(joinPushed ? ['GetForeignJoinPaths'] : []), ...(aggPushed || limitPushed || orderPushed ? ['GetForeignUpperPaths'] : []), 'GetForeignPlan', 'BeginForeignScan', `IterateForeignScan ×${fmt(wire + 1)}`, 'EndForeignScan']
  return { shipped, local, wire, toClient, afterLocal, trips, lines, callbacks, aggPushed, limitPushed, orderPushed, joinPushed }
}

function FdwViz() {
  const [idx, setIdx] = useState(0)
  const [cfg, setCfg] = useState<Cfg>(SCENARIOS[0].cfg)
  const [custom, setCustom] = useState(false)
  const p = plan(cfg)
  const edit = (f: (c: Cfg) => Cfg) => { setCfg(f(cfg)); setCustom(true) }
  const toggleQual = (id: string) => edit((c) => ({ ...c, quals: c.quals.includes(id) ? c.quals.filter((x) => x !== id) : [...c.quals, id] }))
  const next = () => { const n = (idx + 1) % SCENARIOS.length; setIdx(n); setCfg(SCENARIOS[n].cfg); setCustom(false) }
  const dots = Math.max(1, Math.min(14, Math.round(Math.log10(p.wire + 1) * 2.2)))
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={next} data-testid="viz-next" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent">Next scenario ({idx + 1}/{SCENARIOS.length})</button>
        <span className="text-xs text-muted">or build your own query below</span>
      </div>
      <div className="min-h-[52px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p key={custom ? 'c' : idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Md>{custom ? `Custom query: **${p.shipped.length}** clause(s) shipped, **${p.local.length}** evaluated locally.` : SCENARIOS[idx].text}</Md>
          </motion.p>
        </AnimatePresence>
      </div>
      <Panel title="SELECT … FROM orders_remote o … WHERE">
        <div className="grid gap-1.5">
          {QUALS.map((q) => {
            const on = cfg.quals.includes(q.id)
            return (
              <div key={q.id} className="flex flex-wrap items-center gap-2">
                <Chip on={on} onClick={() => toggleQual(q.id)} t={q.ship ? 'ok' : 'dead'}><code className="font-mono text-[12px]">{q.sql}</code></Chip>
                <span className="text-[11.5px] text-muted"><Tag t={q.ship ? 'ok' : 'dead'}>{q.ship ? 'ships' : 'local'}</Tag> <Md>{q.why}</Md></span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Segmented label="Join" value={cfg.join} onChange={(j) => edit((c) => ({ ...c, join: j }))} options={[['none', 'no join'], ['remote', 'JOIN customers_remote'], ['local', 'JOIN local regions']]} />
          <Chip on={cfg.agg} onClick={() => edit((c) => ({ ...c, agg: !c.agg }))}>count(*) GROUP BY status</Chip>
          <Chip on={cfg.order} onClick={() => edit((c) => ({ ...c, order: !c.order }))}>ORDER BY created_at DESC</Chip>
          <Chip on={cfg.limit} onClick={() => edit((c) => ({ ...c, limit: !c.limit }))}>LIMIT 10</Chip>
          <label className="flex items-center gap-1.5 text-xs text-muted">fetch_size
            <input type="range" min={100} max={10000} step={100} value={cfg.fetch} onChange={(e) => edit((c) => ({ ...c, fetch: +e.target.value }))} className="w-24 accent-[var(--accent)]" aria-label="fetch_size" />
            <span className="w-12 font-mono text-ink">{cfg.fetch}</span>
          </label>
        </div>
      </Panel>
      <Legend items={[['ok', 'shipped in Remote SQL'], ['dead', 'evaluated locally'], ['pointer', 'Foreign Scan node'], ['tuple', 'local table']]} />
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="rounded-lg border p-3" style={{ borderColor: tone('ok'), background: toneBg('ok', 8) }}>
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">remote server · warehouse</p>
          <p className="mt-1 font-mono text-[12px]">public.orders: 1,000,000 rows</p>
          <p className="mt-1 text-xs text-muted">Runs the Remote SQL in a REPEATABLE READ transaction, with search_path = pg_catalog.</p>
        </div>
        <div className="relative flex min-h-12 min-w-[150px] flex-col items-center justify-center overflow-hidden rounded-lg border border-line bg-bg px-2">
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          {Array.from({ length: dots }, (_, i) => (
            <motion.span key={`${p.wire}-${i}`} className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full" style={{ background: tone('pointer') }}
              initial={{ left: '-4%' }} animate={{ left: '104%' }} transition={{ duration: 1.6, delay: i * 0.12, repeat: Infinity, ease: 'linear' }} />
          ))}
          <span className="relative mt-8 rounded bg-surface px-1 font-mono text-[11px]">{fmt(p.wire)} rows →</span>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: tone('accent'), background: toneBg('accent', 8) }}>
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">local PostgreSQL</p>
          <p className="mt-1 font-mono text-[12px]">{p.local.length ? `Filter keeps ${fmt(p.afterLocal)}, returns ${fmt(p.toClient)}` : `returns ${fmt(p.toClient)} rows`}</p>
          <p className="mt-1 text-xs text-muted">{cfg.join === 'local' ? 'Joins the fetched rows with the local regions table.' : 'Only reshapes what arrives.'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="rows over the wire" value={fmt(p.wire)} t={p.wire > 10000 ? 'dead' : 'ok'} />
        <Tile label="FETCH round trips" value={fmt(p.trips)} />
        <Tile label="rows to client" value={fmt(p.toClient)} />
        <Tile label="pushed down" value={[p.shipped.length && 'WHERE', p.joinPushed && 'JOIN', p.aggPushed && 'AGG', p.orderPushed && 'SORT', p.limitPushed && 'LIMIT'].filter(Boolean).join(' ') || 'nothing'} />
      </div>
      <Panel title="EXPLAIN VERBOSE (postgres_fdw)">
        <div className="overflow-x-auto font-mono text-[11.5px] leading-5 scrollbar-thin">
          {p.lines.map(([dd, text, t], i) => (
            <motion.div key={text} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre" style={{ paddingLeft: dd * 16, color: t === 'muted' ? 'var(--muted)' : t ? tone(t) : 'var(--text)' }}>
              {i > 0 && !text.startsWith(' ') && !text.startsWith('->') && !text.startsWith('Filter') && !text.startsWith('Remote') ? '->  ' : ''}{text}
            </motion.div>
          ))}
        </div>
      </Panel>
      <p className="text-xs text-muted">FDW callbacks invoked: {p.callbacks.map((c) => <code key={c} className="inline-code mr-1">{c}</code>)}</p>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'fdw',
  module: 'm6',
  order: 5,
  title: 'Foreign data wrappers',
  tldr: [
    'A **foreign data wrapper** is a C handler that lets a local table name stand in for data elsewhere, configured through a chain of SQL/MED objects: wrapper, server, user mapping and foreign table.',
    'It exists so you can query another database or a file with plain SQL, while the wrapper decides how much of each query (filters, joins, sorts, aggregates) to **push down** to the remote side instead of dragging every row across the network.',
  ],
  visualizer: {
    title: 'What does postgres_fdw ship to the remote server?',
    caption: 'Click **Next scenario** or toggle clauses yourself. Watch the Remote SQL, the local Filter and the rows on the wire change. The remote table holds 1,000,000 orders.',
    Component: FdwViz,
  },
  playground: {
    setup: `
-- This database has no FDW handler library installed, so this wrapper has none: every catalog object can be
-- created and inspected, but scanning a foreign table raises an error.
CREATE FOREIGN DATA WRAPPER demo_fdw;
CREATE SERVER warehouse FOREIGN DATA WRAPPER demo_fdw
  OPTIONS (host 'warehouse.internal', port '5432', dbname 'sales', fetch_size '1000');
CREATE USER MAPPING FOR CURRENT_USER SERVER warehouse OPTIONS (user 'reporter', password 'secret');
CREATE FOREIGN TABLE orders_remote (
  id bigint NOT NULL, customer_id int, status text, email text, created_at timestamptz,
  amount numeric(10,2) OPTIONS (column_name 'total')
) SERVER warehouse OPTIONS (schema_name 'public', table_name 'orders');
CREATE FOREIGN TABLE customers_remote (id int, name text) SERVER warehouse OPTIONS (table_name 'customers');
CREATE TABLE regions (id int PRIMARY KEY, name text);
CREATE FUNCTION risk_score(bigint) RETURNS numeric LANGUAGE sql IMMUTABLE AS 'SELECT ($1 % 100) / 100.0';
${TRY_SQL}`,
    presets: [
      { label: 'The SQL/MED chain', sql: `SELECT fdwname, fdwhandler::regproc, fdwvalidator::regproc FROM pg_foreign_data_wrapper;
SELECT srvname, srvoptions FROM pg_foreign_server;
SELECT srvname, usename, umoptions FROM pg_user_mappings;`,
        note: 'Wrapper → server → user mapping. `fdwhandler = -` (0): this wrapper has no handler. Connection details live on the server; credentials live on the **user mapping**, per local role.' },
      { label: 'Foreign tables', sql: `SELECT c.relname, c.relkind, ft.ftoptions, pg_relation_size(c.oid) AS local_bytes
FROM pg_foreign_table ft JOIN pg_class c ON c.oid = ft.ftrelid ORDER BY 1;

SELECT attname, attfdwoptions FROM pg_attribute
WHERE attrelid = 'orders_remote'::regclass AND attfdwoptions IS NOT NULL;`,
        note: '`relkind = f` and **0 local bytes**: a foreign table is only a definition. The `column_name` option maps local `amount` to remote `total`; matching is by name, not position.' },
      { label: 'Scanning needs a handler', sql: `SELECT try_sql('SELECT * FROM orders_remote') AS scan,
       try_sql('IMPORT FOREIGN SCHEMA public LIMIT TO (invoices) FROM SERVER warehouse INTO public') AS import;`,
        note: 'Planning a scan calls the handler\'s `FdwRoutine` (GetForeignRelSize, GetForeignPaths, …), and IMPORT FOREIGN SCHEMA calls `ImportForeignSchema`. Without a handler both fail.' },
      { label: 'What postgres_fdw would ship', sql: `SELECT p.proname, p.provolatile,
       p.oid < 10000 AS built_in,
       p.provolatile = 'i' AND p.oid < 10000 AS shippable
FROM pg_proc p
WHERE p.proname IN ('texteq', 'textlike', 'lower', 'now', 'random', 'risk_score')
ORDER BY shippable DESC, p.proname;`,
        note: 'postgres_fdw ships a clause only if every function in it is **built-in and IMMUTABLE** (or belongs to an extension listed in the server\'s `extensions` option). `now()` is STABLE; `risk_score` is IMMUTABLE but user-defined.' },
      { label: 'No validator, no checks', sql: `ALTER SERVER warehouse OPTIONS (ADD fetch_sizee '5000');
SELECT srvoptions FROM pg_foreign_server WHERE srvname = 'warehouse';
ALTER SERVER warehouse OPTIONS (DROP fetch_sizee);`,
        note: 'The typo `fetch_sizee` is accepted because this wrapper has **no validator** function. postgres_fdw\'s validator would reject it at ALTER time.' },
      { label: 'Tune options in place', sql: `ALTER SERVER warehouse OPTIONS (SET fetch_size '5000', ADD use_remote_estimate 'true');
ALTER FOREIGN TABLE orders_remote OPTIONS (ADD fetch_size '10000');
SELECT srvoptions FROM pg_foreign_server;
SELECT ftoptions FROM pg_foreign_table WHERE ftrelid = 'orders_remote'::regclass;`,
        note: 'Options are text key/value pairs on each object. For postgres_fdw, a table-level option overrides the server-level one.' },
    ],
  },
  production: {
    title: 'A reporting query that copied a whole remote table',
    context: 'A reporting database read `orders` from the OLTP primary through postgres_fdw. A dashboard asked for the last week of shipped orders: `WHERE status = \'shipped\' AND created_at >= now() - interval \'7 days\' ORDER BY created_at DESC LIMIT 50`.',
    problem: '`EXPLAIN VERBOSE` showed the Remote SQL carrying only `status = \'shipped\'`. Because `now()` is STABLE, the date filter ran locally, and with a local filter present the LIMIT could not be shipped either. Every shipped order ever recorded crossed the network, 100 rows per FETCH, for each dashboard refresh.',
    solution: 'Compute the cutoff in the application (or in a CTE materialised as a parameter) and pass a **literal**, so every clause is built-in and immutable and ships. Raise `fetch_size` for the remaining bulk reads, and turn on `use_remote_estimate` so the planner costs remote scans with real statistics.',
    sql: `-- before (date filter + LIMIT run locally):
--   Remote SQL: SELECT ... FROM public.orders WHERE ((status = 'shipped'::text))
-- after: the app binds the cutoff as a constant
SELECT * FROM orders_remote
WHERE status = 'shipped' AND created_at >= $1
ORDER BY created_at DESC LIMIT 50;
ALTER SERVER warehouse OPTIONS (ADD fetch_size '1000', ADD use_remote_estimate 'true');`,
    outcome: 'The Remote SQL now contains both predicates, the ORDER BY and `LIMIT 50::bigint`, so 50 rows cross the network instead of every shipped order. In the visualizer, scenario 3 against scenario 4 shows the same effect on a 1,000,000-row remote table: 250,000 rows against 10.',
  },
  pitfalls: [
    { title: 'Mutable functions block pushdown',
      symptom: 'A selective query over a foreign table is slow, and EXPLAIN VERBOSE shows a local `Filter:` above the Foreign Scan.',
      cause: 'postgres_fdw only ships clauses whose functions and operators are **built-in and IMMUTABLE**. `now()`, `current_date`, user functions and casts that depend on settings are evaluated locally.',
      fix: 'Pass constants from the application, rewrite with immutable built-ins, or list a shared extension in the server\'s `extensions` option. Always read the `Remote SQL:` line.' },
    { title: 'Type or collation mismatch with the remote column',
      symptom: 'Results differ between querying the remote table directly and through the foreign table, especially for text comparisons and sorting.',
      cause: 'Shipped clauses are evaluated by the **remote** server with its own types and collations. A foreign table column declared with a different type or collation gives "surprising semantic anomalies".',
      fix: 'Declare columns with exactly the remote types and collations, or use `IMPORT FOREIGN SCHEMA`, which copies them.' },
    { title: 'Repeatable reads in a READ COMMITTED transaction',
      symptom: 'Inside one local transaction, repeated queries against a foreign table keep returning the same data even though the remote side committed changes.',
      cause: 'postgres_fdw opens the remote transaction as **REPEATABLE READ** (SERIALIZABLE if the local one is), so every scan in the local transaction shares one remote snapshot. There is no two-phase commit across servers.',
      fix: 'Keep transactions that read foreign tables short, and do not rely on atomic commit across servers.' },
    { title: 'Tiny fetch batches over a slow link',
      symptom: 'A large foreign scan is dominated by network latency, not by either server\'s CPU.',
      cause: '`fetch_size` defaults to **100** rows per round trip, and inserts default to `batch_size` **1**.',
      fix: 'Raise them per server or per table.',
      sql: `ALTER SERVER warehouse OPTIONS (ADD fetch_size '1000', ADD batch_size '100');` },
  ],
  pointers: [
    'SQL/MED chain: **wrapper** (handler + validator) → **server** (where) → **user mapping** (who) → **foreign table** (what).',
    'The handler returns an **FdwRoutine** of callbacks: plan with GetForeignRelSize/Paths/Plan, execute with Begin/Iterate/ReScan/EndForeignScan. `file_fdw` is the simplest wrapper: a read-only foreign table over a server-side file or program output (`OPTIONS (filename \'/path/x.csv\', format \'csv\')`), parsed by the COPY code and limited to superusers and members of `pg_read_server_files` or `pg_execute_server_program`.',
    'postgres_fdw ships WHERE clauses only with **built-in, IMMUTABLE** functions and operators; joins only between tables on the **same server**.',
    'Read pushdown in `EXPLAIN VERBOSE`: the `Remote SQL:` line is what the other server actually runs.',
    'Remote transactions run at **REPEATABLE READ** or SERIALIZABLE, without two-phase commit.',
  ],
  sources: ['ddl-foreign-data.html', 'postgres-fdw.html', 'fdwhandler.html', 'fdw-callbacks.html', 'fdw-planning.html', 'file-fdw.html', 'sql-importforeignschema.html'],
}
