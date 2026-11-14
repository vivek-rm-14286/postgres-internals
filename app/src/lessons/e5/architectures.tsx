import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Code, Packet, Tabs, TRY_SQL } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1: who shares what (shared-memory, shared-disk, shared-nothing, federated), with an
 *               "add a node" action that shows what the new node must coordinate with.
 * Visualizer 2: the transparency ladder: the SQL an application must write at each level.
 * Visualizer 3: one customer record in each data-model family, with what each operation costs.
 * ---------------------------------------------------------------------------------------------- */

type ArchId = 'mem' | 'disk' | 'nothing' | 'fed'
interface ArchDef {
  name: string
  shared: string
  addNode: string
  rows: [string, string][]
}

const ARCH: Record<ArchId, ArchDef> = {
  mem: {
    name: 'Shared-memory',
    shared: 'All CPUs read and write **one memory** and **one set of disks** through one interconnect.',
    addNode: 'A new CPU joins the same memory bus. Every CPU now competes for that bus and its caches must stay coherent, so each added CPU buys less than the last.',
    rows: [['shares', 'memory + disks'], ['talks through', 'shared memory, locks, latches'], ['scales by', 'a bigger machine'], ['bottleneck', 'memory bus, cache coherence'], ['failure unit', 'the whole machine'], ['example', 'one PostgreSQL server: backends share shared_buffers']],
  },
  disk: {
    name: 'Shared-disk',
    shared: 'Each node has **its own memory** but all nodes read and write **the same disks**.',
    addNode: 'The new node mounts the same storage. Before it may change a page, it must learn whether another node caches that page: a **global lock and cache-coherence** protocol grows with the node count.',
    rows: [['shares', 'disks (storage network)'], ['talks through', 'distributed lock manager, page transfers'], ['scales by', 'more compute nodes over one store'], ['bottleneck', 'lock traffic on hot pages; the storage tier'], ['failure unit', 'a node (storage survives)'], ['example', 'Oracle RAC (many writers); Aurora-style shared storage (one writer, many readers)']],
  },
  nothing: {
    name: 'Shared-nothing',
    shared: 'Each node owns **its memory and its disks**. Nodes cooperate only by **sending messages**.',
    addNode: 'The new node shares nothing, so nothing has to stay coherent. Instead, part of the data must **move** to it (rebalancing), and queries that span nodes now ship rows over the network.',
    rows: [['shares', 'nothing but the network'], ['talks through', 'messages: RPC, 2PC, consensus'], ['scales by', 'adding commodity nodes'], ['topology', 'coordinator + workers (Citus) or peer-to-peer (Cassandra)'], ['bottleneck', 'cross-node queries and transactions'], ['failure unit', 'one node and the data it owns (unless replicated)'], ['example', 'Citus, Cassandra, CockroachDB, YugabyteDB']],
  },
  fed: {
    name: 'Federated (multidatabase)',
    shared: 'Independent, **autonomous** databases, possibly different products, each publishing an **export schema**. A mediator layer offers one view over them.',
    addNode: 'Adding a source means writing a wrapper and mapping its export schema. The source keeps its own design, its own transactions and its own owner: the federation cannot force it to change.',
    rows: [['shares', 'nothing; each source is autonomous'], ['talks through', 'wrappers that translate queries'], ['scales by', 'adding sources, not capacity'], ['bottleneck', 'the mediator; what each source can evaluate'], ['failure unit', 'one source (its data is simply missing)'], ['example', 'PostgreSQL foreign data wrappers (postgres_fdw, file_fdw)']],
  },
}
const ORDER: ArchId[] = ['mem', 'disk', 'nothing', 'fed']

function ArchDiagram({ a, n }: { a: ArchId; n: number }) {
  const W = 640, H = 300
  const xs = Array.from({ length: n }, (_, i) => 70 + (i * (W - 140)) / Math.max(1, n - 1))
  const box = (x: number, y: number, w: number, label: string, t: Tone, key: string, sub?: string) => (
    <motion.g key={key} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
      <rect x={x - w / 2} y={y} width={w} height={34} rx={7} fill={toneBg(t, 18)} stroke={tone(t)} strokeWidth={1.5} />
      <text x={x} y={y + (sub ? 15 : 21)} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--text)">{label}</text>
      {sub && <text x={x} y={y + 28} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fill="var(--muted)">{sub}</text>}
    </motion.g>
  )
  const span = (y: number, label: string, t: Tone, sub?: string) => (
    <motion.g key={`span-${label}-${n}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <rect x={30} y={y} width={W - 60} height={36} rx={8} fill={toneBg(t, 22)} stroke={tone(t)} strokeWidth={2} />
      <text x={W / 2} y={y + (sub ? 16 : 23)} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{label}</text>
      {sub && <text x={W / 2} y={y + 30} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fill="var(--muted)">{sub}</text>}
    </motion.g>
  )
  const products = ['PostgreSQL', 'MySQL', 'CSV files', 'PostgreSQL', 'REST API']
  const bw = Math.min(110, (W - 80) / n - 14)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label={`${ARCH[a].name} architecture`}>
      {a === 'fed' && span(10, 'mediator: global view over export schemas', 'accent', 'CREATE SERVER … / CREATE FOREIGN TABLE …')}
      {xs.map((x, i) => (
        <g key={`n${i}`}>
          {a === 'fed' && <line x1={x} y1={46} x2={x} y2={78} stroke={tone('accent')} strokeWidth={1.5} strokeDasharray="4 3" />}
          {box(x, 80, bw, a === 'fed' ? `source ${i + 1}` : `node ${i + 1}`, 'tuple', `cpu${i}`, a === 'fed' ? products[i] : 'CPU')}
          {(a === 'disk' || a === 'nothing') && box(x, 140, bw, 'memory', 'pointer', `mem${i}`, 'own cache')}
          {(a === 'nothing' || a === 'fed') && box(x, a === 'fed' ? 140 : 200, bw, a === 'fed' ? 'export schema' : 'disk', a === 'fed' ? 'new' : 'header', `disk${i}`, a === 'fed' ? 'what it shares' : 'own data')}
          {a === 'fed' && box(x, 200, bw, 'local data', 'header', `ld${i}`, 'autonomous')}
          {a === 'mem' && <line x1={x} y1={114} x2={x} y2={150} stroke="var(--border)" strokeWidth={2} />}
          {a === 'mem' && <line x1={x} y1={186} x2={x} y2={226} stroke="var(--border)" strokeWidth={2} />}
          {a === 'disk' && <line x1={x} y1={174} x2={x} y2={226} stroke="var(--border)" strokeWidth={2} />}
        </g>
      ))}
      {a === 'mem' && span(150, 'one shared memory', 'pointer', 'buffer pool, lock table, caches kept coherent by hardware')}
      {(a === 'mem' || a === 'disk') && span(226, a === 'mem' ? 'one set of disks' : 'shared storage', 'header', a === 'disk' ? 'every node reads and writes every page' : undefined)}
      {a === 'disk' && xs.slice(1).map((x, i) => (
        <g key={`dlm${i}`}>
          <line x1={xs[i] + bw / 2} y1={157} x2={x - bw / 2} y2={157} stroke={tone('dead')} strokeWidth={1.5} strokeDasharray="3 3" />
          <Packet key={`p${n}-${i}`} x1={xs[i] + bw / 2} y1={157} x2={x - bw / 2} y2={157} t="dead" delay={0.2 + i * 0.15} r={4} />
        </g>
      ))}
      {a === 'disk' && <text x={W / 2} y={135} textAnchor="middle" fontSize={10} fill={tone('dead')}>global locks + cache coherence</text>}
      {a === 'nothing' && (
        <g>
          <line x1={xs[0]} y1={262} x2={xs[n - 1]} y2={262} stroke={tone('accent')} strokeWidth={2} />
          {xs.map((x, i) => <line key={i} x1={x} y1={234} x2={x} y2={262} stroke={tone('accent')} strokeWidth={1.5} />)}
          <text x={W / 2} y={282} textAnchor="middle" fontSize={10.5} fill={tone('accent')}>network: the only shared resource</text>
          {n > 3 && <Packet key={`move${n}`} x1={xs[n - 2]} y1={262} x2={xs[n - 1]} y2={262} t="new" r={6} dur={0.9} />}
        </g>
      )}
    </svg>
  )
}

function WhoShares() {
  const [a, setA] = useState<ArchId>('nothing')
  const [n, setN] = useState(3)
  const d = ARCH[a]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="architecture" value={a} onChange={(v) => { setA(v); setN(3) }} options={ORDER.map((k) => [k, ARCH[k].name.split(' ')[0]] as [ArchId, string])} />
        <Btn primary onClick={() => setN((x) => (x >= 5 ? 3 : x + 1))}>{n >= 5 ? 'Back to 3 nodes' : 'Add a node'}</Btn>
        <Btn testid="viz-next" onClick={() => { setA(ORDER[(ORDER.indexOf(a) + 1) % ORDER.length]); setN(3) }}>Next architecture</Btn>
      </div>
      <Legend items={[['tuple', 'compute'], ['pointer', 'memory'], ['header', 'disk / data'], ['new', 'export schema'], ['dead', 'coordination traffic'], ['accent', 'network / mediator']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin"><ArchDiagram a={a} n={n} /></div>
      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Panel title={d.name}>
          <p className="text-sm"><Md>{d.shared}</Md></p>
          <AnimatePresence mode="wait">
            <motion.p key={`${a}${n}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm" style={{ color: n > 3 ? 'var(--text)' : 'var(--muted)' }}>
              {n > 3 ? <Md>{`**Node ${n} joined.** ${d.addNode}`}</Md> : 'Press Add a node to see what a new node must coordinate with.'}
            </motion.p>
          </AnimatePresence>
        </Panel>
        <Panel title="Properties"><FieldTable rows={d.rows} /></Panel>
      </div>
    </div>
  )
}

/* ---- transparency ladder ---- */

interface Level { name: string; knows: string[]; sql: string; note: string }
const LEVELS: Level[] = [
  { name: 'none', knows: ['host of each site', 'which fragment holds the row', 'which copy to read', 'what to do when a site is down'],
    sql: `-- customer 42 lives in the EU fragment; its primary copy is on eu-1
-- psql "host=eu-1.db.internal dbname=shop"   (on failure: eu-2.db.internal)
SELECT id, total FROM orders_eu WHERE customer_id = 42 AND status = 'open';`,
    note: 'Every rule of the distribution is compiled into the application. Moving a fragment means a code change.' },
  { name: 'location', knows: ['which fragment holds the row', 'which copy to read', 'what to do when a site is down'],
    sql: `-- one connection to the distributed DBMS; site names are gone
SELECT id, total FROM orders_eu_copy1 WHERE customer_id = 42 AND status = 'open';`,
    note: '**Location (network) transparency**: names no longer contain sites. The system maps each name to wherever it lives.' },
  { name: 'replication', knows: ['which fragment holds the row', 'what to do when a site is down'],
    sql: `SELECT id, total FROM orders_eu WHERE customer_id = 42 AND status = 'open';`,
    note: '**Replication transparency**: one name per fragment. The system picks a copy for reads and updates every copy on writes.' },
  { name: 'fragmentation', knows: ['what to do when a site is down'],
    sql: `SELECT id, total FROM orders WHERE customer_id = 42 AND status = 'open';`,
    note: '**Fragmentation transparency**: the query names the global relation. Localization turns it into a query on the right fragment.' },
  { name: 'full', knows: [],
    sql: `SELECT id, total FROM orders WHERE customer_id = 42 AND status = 'open';
-- a site failure is retried or failed over inside the system`,
    note: '**Failure transparency** on top: atomic commit and failover hide crashes. Full transparency is easiest for users and hardest to build.' },
]
const ALL_KNOWS = LEVELS[0].knows

function Ladder() {
  const [i, setI] = useState(0)
  const l = LEVELS[i]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="transparency" value={String(i)} onChange={(v) => setI(+v)} options={LEVELS.map((x, k) => [String(k), x.name] as [string, string])} />
        <Btn testid="viz-next" primary onClick={() => setI((x) => (x + 1) % LEVELS.length)}>{i === LEVELS.length - 1 ? 'Start over' : 'More transparency'}</Btn>
      </div>
      <p className="text-sm text-muted">Question: <b className="text-ink">customer 42's open orders</b>. Orders are split by region; the EU fragment has two copies, on eu-1 and eu-2.</p>
      <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}><Code>{l.sql}</Code></motion.div>
      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Panel title="The application must know">
          <ul className="grid gap-1">
            {ALL_KNOWS.map((k) => {
              const on = l.knows.includes(k)
              return (
                <motion.li key={k} layout className="flex items-center gap-2 rounded border px-2 py-1 text-xs"
                  style={{ borderColor: on ? tone('dead') : 'var(--border)', background: on ? toneBg('dead', 10) : 'transparent', opacity: on ? 1 : 0.5 }}>
                  <span className="font-mono font-bold" style={{ color: on ? tone('dead') : tone('ok') }}>{on ? '✗' : '✓'}</span>
                  <span className={on ? '' : 'line-through'}>{k}</span>
                </motion.li>
              )
            })}
          </ul>
        </Panel>
        <Panel title={`level: ${l.name}`}><p className="text-sm"><Md>{l.note}</Md></p></Panel>
      </div>
    </div>
  )
}

/* ---- data model families ---- */

type Fam = 'rel' | 'kv' | 'doc' | 'wide' | 'graph' | 'dsql'
interface FamDef { name: string; shape: string; unit: string; ops: [string, string, Tone][]; who: string }
const FAMS: Record<Fam, FamDef> = {
  rel: { name: 'relational (one node)', unit: 'a table; any row, any join',
    shape: `customers(id=42, name='Ana', city='Lyon')
orders(id=7,  customer_id=42, total=30.00)
orders(id=9,  customer_id=42, total=12.50)`,
    ops: [['get by key', 'index lookup', 'ok'], ['query by other column', 'index or scan', 'ok'], ['join', 'native', 'ok'], ['multi-row transaction', 'ACID, local', 'ok']],
    who: 'PostgreSQL on one server' },
  kv: { name: 'key-value', unit: 'one key; the partition key routes it to a node',
    shape: `"customer#42"        -> {name:"Ana", city:"Lyon"}
"customer#42#order#7" -> {total:30.00}
"customer#42#order#9" -> {total:12.50}`,
    ops: [['get by key', 'one partition, one hop', 'ok'], ['query by other column', 'needs a secondary index', 'new'], ['join', 'none: denormalize', 'dead'], ['multi-key transaction', 'some systems only', 'new']],
    who: 'DynamoDB (key-value and document models, no JOIN)' },
  doc: { name: 'document', unit: 'one document; related data is embedded',
    shape: `{ _id: 42, name: "Ana", city: "Lyon",
  orders: [ { id: 7, total: 30.00 },
            { id: 9, total: 12.50 } ] }`,
    ops: [['get by key', 'whole aggregate in one read', 'ok'], ['query by other field', 'secondary index on a path', 'ok'], ['join', 'avoided by embedding', 'new'], ['document size', 'bounded (16 MiB in MongoDB)', 'new']],
    who: 'MongoDB (BSON documents)' },
  wide: { name: 'wide-column', unit: 'a partition: rows sorted by a clustering key',
    shape: `partition key: customer_id = 42
  clustering key order_id=7 | total=30.00 | city=Lyon
  clustering key order_id=9 | total=12.50 | city=Lyon`,
    ops: [['get a partition', 'one node set, sorted slice', 'ok'], ['query by other column', 'design another table', 'dead'], ['join', 'none: one table per query', 'dead'], ['consistency', 'tunable per query, often eventual', 'new']],
    who: 'Cassandra (partitioned wide-column store)' },
  graph: { name: 'graph', unit: 'nodes and relationships; traversal follows stored edges',
    shape: `(:Customer {id:42, name:"Ana"})-[:PLACED]->(:Order {id:7,  total:30.00})
(:Customer {id:42})-[:PLACED]->(:Order {id:9,  total:12.50})
(:Customer {id:42})-[:LIVES_IN]->(:City {name:"Lyon"})`,
    ops: [['neighbours of a node', 'follow stored relationships', 'ok'], ['multi-hop paths', 'native traversal', 'ok'], ['bulk aggregates', 'scan of many nodes', 'new'], ['partitioning', 'hard: edges cross partitions', 'dead']],
    who: 'Neo4j (property graph)' },
  dsql: { name: 'distributed SQL', unit: 'a shard (range or hash of a key), replicated by consensus',
    shape: `CREATE TABLE orders (customer_id int, id int, total numeric,
                     PRIMARY KEY (customer_id, id));
-- rows of customer 42 land in one shard; other customers elsewhere`,
    ops: [['get by key', 'one shard', 'ok'], ['query by other column', 'global secondary index', 'ok'], ['join', 'native; cross-shard ships rows', 'new'], ['multi-shard transaction', 'ACID via 2PC + consensus', 'new']],
    who: 'CockroachDB, YugabyteDB: one Raft group per shard. Citus also shards a SQL database, but without a consensus protocol: a coordinator and workers, 2PC across shards, and ordinary streaming replication for the copies.' },
}
const FAM_ORDER: Fam[] = ['rel', 'kv', 'doc', 'wide', 'graph', 'dsql']

function Families() {
  const [f, setF] = useState<Fam>('kv')
  const d = FAMS[f]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={f} onChange={setF} options={FAM_ORDER.map((k) => [k, FAMS[k].name] as [Fam, string])} />
        <Btn testid="viz-next" onClick={() => setF(FAM_ORDER[(FAM_ORDER.indexOf(f) + 1) % FAM_ORDER.length])}>Next family</Btn>
      </div>
      <p className="text-sm text-muted">The same data each time: customer 42 (Ana, Lyon) and her two orders.</p>
      <motion.div key={f} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}><Code>{d.shape}</Code></motion.div>
      <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Unit of distribution"><p className="text-sm">{d.unit}</p><p className="mt-2 text-xs text-muted">{d.who}</p></Panel>
        <Panel title="What operations cost">
          <div className="grid gap-1">
            {d.ops.map(([op, how, t]) => (
              <motion.div key={f + op} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-baseline justify-between gap-x-2 rounded border px-2 py-1 text-xs"
                style={{ borderColor: tone(t), background: toneBg(t, 10) }}>
                <span className="font-semibold">{op}</span><span className="font-mono">{how}</span>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>
      <Legend items={[['ok', 'cheap / native'], ['new', 'possible, with care'], ['dead', 'not supported or expensive']]} />
    </div>
  )
}

function ArchViz() {
  const [tab, setTab] = useState<'share' | 'transp' | 'fam'>('share')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Tabs value={tab} onChange={setTab} options={[['share', 'Who shares what'], ['transp', 'Transparency ladder'], ['fam', 'Data model families']]} />
      {tab === 'share' ? <WhoShares /> : tab === 'transp' ? <Ladder /> : <Families />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `${TRY_SQL}

-- Two schemas stand in for two sites of one company database
CREATE SCHEMA eu;
CREATE SCHEMA us;
CREATE TABLE eu.orders (id int PRIMARY KEY, customer_id int NOT NULL, region text NOT NULL DEFAULT 'EU' CHECK (region = 'EU'),
                        status text NOT NULL, total numeric(10,2) NOT NULL);
CREATE TABLE us.orders (id int PRIMARY KEY, customer_id int NOT NULL, region text NOT NULL DEFAULT 'US' CHECK (region = 'US'),
                        status text NOT NULL, total numeric(10,2) NOT NULL);
INSERT INTO eu.orders (id, customer_id, status, total)
  SELECT g, 1 + g % 50, (ARRAY['open', 'shipped', 'shipped', 'paid'])[1 + g % 4], 5 + (g * 37) % 200 FROM generate_series(1, 400) g WHERE g % 2 = 0;
INSERT INTO us.orders (id, customer_id, status, total)
  SELECT g, 51 + g % 50, (ARRAY['open', 'shipped', 'shipped', 'paid'])[1 + g % 4], 5 + (g * 41) % 200 FROM generate_series(1, 400) g WHERE g % 2 = 1;

-- the EU product catalogue is replicated: two identical copies
CREATE TABLE eu.products_copy1 (sku text PRIMARY KEY, name text NOT NULL, price numeric(10,2) NOT NULL);
INSERT INTO eu.products_copy1 VALUES ('A1', 'kettle', 39.00), ('B2', 'toaster', 25.50), ('C3', 'blender', 79.90);
CREATE TABLE eu.products_copy2 (LIKE eu.products_copy1 INCLUDING ALL);
INSERT INTO eu.products_copy2 SELECT * FROM eu.products_copy1;
ANALYZE;`

export const lesson: Lesson = {
  slug: 'architectures',
  module: 'e5',
  order: 1,
  title: 'Architectures and classification',
  tldr: [
    'A **distributed database** is a set of logically related databases spread over a network, and its architecture is defined by what the nodes share: memory, disks, or nothing at all.',
    'The classification predicts where a system will hit its limit, and the **transparencies** it provides decide how much of the distribution your application has to know about.',
  ],
  visualizer: {
    title: 'What nodes share, what applications see',
    caption: 'Switch architectures and add nodes to see what must stay coordinated. Then climb the transparency ladder, and compare one record across data-model families.',
    Component: ArchViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'Federation: wrapper, server, mapping, table', sql: `-- the four catalog objects of a federated (multidatabase) layer
CREATE FOREIGN DATA WRAPPER legacy_wrapper;
CREATE SERVER billing_db FOREIGN DATA WRAPPER legacy_wrapper OPTIONS (host 'billing.db.internal', dbname 'billing');
CREATE USER MAPPING FOR CURRENT_USER SERVER billing_db OPTIONS (user 'reporter');
CREATE FOREIGN TABLE invoices (id int, customer_id int, amount numeric) SERVER billing_db OPTIONS (table_name 'invoices');

SELECT w.fdwname AS wrapper, w.fdwhandler::regproc AS handler, s.srvname AS server, s.srvoptions AS server_options
FROM pg_foreign_data_wrapper w JOIN pg_foreign_server s ON s.srvfdw = w.oid;
SELECT foreign_table_name, foreign_server_name FROM information_schema.foreign_tables;
SELECT srvname, umoptions FROM pg_user_mappings;`,
        note: 'The wrapper names the code that talks to a source, the server says where the source is, the user mapping says who to log in as, and the foreign table is the export schema seen locally. `handler` is `-` because this wrapper has no code behind it yet.' },
      { label: 'A wrapper without a handler', sql: `-- the same catalog objects as the previous preset, created here if they are missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_foreign_data_wrapper WHERE fdwname = 'legacy_wrapper') THEN
    CREATE FOREIGN DATA WRAPPER legacy_wrapper;
  END IF;
END $$;
CREATE SERVER IF NOT EXISTS billing_db FOREIGN DATA WRAPPER legacy_wrapper OPTIONS (host 'billing.db.internal', dbname 'billing');
CREATE FOREIGN TABLE IF NOT EXISTS invoices (id int, customer_id int, amount numeric) SERVER billing_db OPTIONS (table_name 'invoices');

SELECT try_sql('SELECT count(*) FROM invoices') AS scan_foreign_table;
SELECT ftrelid::regclass AS foreign_table, ftoptions FROM pg_foreign_table;`,
        note: 'A foreign table is only metadata. Reading it needs a **handler**: the C functions that plan and fetch remote rows. `postgres_fdw` and `file_fdw` ship one; this catalog-only wrapper does not, so the scan errors out.' },
      { label: 'Fragmentation transparency with a view', sql: `-- one global name over two fragments
CREATE OR REPLACE VIEW orders AS
  SELECT * FROM eu.orders
  UNION ALL
  SELECT * FROM us.orders;

SELECT region, count(*) AS rows, sum(total) AS revenue FROM orders GROUP BY region ORDER BY region;
EXPLAIN (VERBOSE, COSTS OFF) SELECT id, total FROM orders WHERE customer_id = 42 AND status = 'open';`,
        note: 'The query names only `orders`. The plan shows the system replacing it by both fragments (an Append over `eu.orders` and `us.orders`): that substitution is exactly what fragmentation transparency hides.' },
      { label: 'Localization: a predicate that rules out a fragment', sql: `CREATE OR REPLACE VIEW orders AS
  SELECT * FROM eu.orders
  UNION ALL
  SELECT * FROM us.orders;

EXPLAIN (VERBOSE, COSTS OFF) SELECT id, total FROM orders WHERE region = 'EU' AND status = 'open';

SELECT count(*) AS eu_open FROM orders WHERE region = 'EU' AND status = 'open';`,
        note: 'Each fragment carries a CHECK constraint on `region`. The planner proves the US fragment cannot contain `region = \'EU\'` rows and drops that branch: the plan is a single `Seq Scan on eu.orders`, and the US site is never asked. This is **data localization** at its simplest.' },
      { label: 'Replication transparency', sql: `-- the application asks for "products"; a setting decides which copy serves it
CREATE OR REPLACE VIEW products AS
  SELECT * FROM eu.products_copy1 WHERE current_setting('app.replica', true) IS DISTINCT FROM 'copy2'
  UNION ALL
  SELECT * FROM eu.products_copy2 WHERE current_setting('app.replica', true) = 'copy2';

SELECT 'default' AS served_by, count(*), sum(price) FROM products;
SET app.replica = 'copy2';
SELECT 'copy2' AS served_by, count(*), sum(price) FROM products;
RESET app.replica;`,
        note: 'The same query returns the same answer from either copy. Routing a read to a replica, without the query changing, is what replication transparency means.' },
      { label: 'Data model families inside PostgreSQL', sql: `-- key-value
CREATE TABLE kv (k text PRIMARY KEY, v jsonb NOT NULL);
INSERT INTO kv VALUES ('customer#42', '{"name": "Ana", "city": "Lyon"}'), ('customer#42#order#7', '{"total": 30.00}');
SELECT v->>'name' AS name FROM kv WHERE k = 'customer#42';

-- document: the aggregate is embedded
CREATE TABLE docs (id int PRIMARY KEY, body jsonb NOT NULL);
INSERT INTO docs VALUES (42, '{"name": "Ana", "orders": [{"id": 7, "total": 30.00}, {"id": 9, "total": 12.50}]}');
SELECT jsonb_array_length(body->'orders') AS orders, (SELECT sum((o->>'total')::numeric) FROM jsonb_array_elements(body->'orders') o) AS spent FROM docs;

-- wide-column: partition key + clustering key
CREATE TABLE wide (customer_id int, order_id int, total numeric, PRIMARY KEY (customer_id, order_id));
INSERT INTO wide VALUES (42, 7, 30.00), (42, 9, 12.50), (43, 1, 8.00);
SELECT * FROM wide WHERE customer_id = 42 ORDER BY order_id;

-- graph: edges plus a recursive traversal
CREATE TABLE edges (src text, rel text, dst text);
INSERT INTO edges VALUES ('customer:42', 'PLACED', 'order:7'), ('customer:42', 'PLACED', 'order:9'), ('order:7', 'CONTAINS', 'sku:A1'), ('order:9', 'CONTAINS', 'sku:B2');
WITH RECURSIVE walk(node, depth) AS (
  SELECT 'customer:42', 0
  UNION ALL
  SELECT e.dst, w.depth + 1 FROM walk w JOIN edges e ON e.src = w.node WHERE w.depth < 3)
SELECT depth, node FROM walk ORDER BY depth, node;`,
        note: 'Four shapes of the same data. Each family optimises one access path: lookup by key, read one aggregate, slice one partition in order, follow edges. A distributed system picks its **partition key** from that shape.' },
    ],
  },
  production: {
    title: 'Choosing an architecture for a growing order system',
    context: 'A retail platform runs one PostgreSQL server. Orders grow 8x a year, and two acquired companies bring their own billing databases, one on MySQL.',
    problem: 'The team proposed three different "distributed" projects at once: a bigger server, a shared-storage cluster and a sharded cluster, plus direct connections from the app to the acquired billing databases. Nobody could say which problem each one solved.',
    solution: 'Classify first. Write throughput on one server is a shared-memory limit, so the order tables move to a shared-nothing cluster sharded by `customer_id`. The acquired billing systems stay autonomous and are federated through foreign data wrappers for reporting, with no cross-system transactions. The application gets fragmentation transparency from the sharded cluster and keeps one connection string.',
    sql: `-- federated reporting over an autonomous source; postgres_fdw reaches PostgreSQL servers only,
-- so reports read a PostgreSQL mirror of the MySQL billing data
CREATE EXTENSION postgres_fdw;
CREATE SERVER billing_pg_mirror FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'billing-mirror.internal', dbname 'billing', fdw_tuple_cost '0.5');
CREATE USER MAPPING FOR reporting SERVER billing_pg_mirror OPTIONS (user 'ro', password_required 'true');
IMPORT FOREIGN SCHEMA public LIMIT TO (invoices) FROM SERVER billing_pg_mirror INTO billing;

-- sharded order tables (Citus)
SELECT create_distributed_table('orders', 'customer_id');`,
    outcome: 'Each workload got the architecture its bottleneck called for. Order writes scale by adding nodes, reporting reads the acquired systems without owning them, and the application code did not change shape.',
  },
  pitfalls: [
    { title: 'Expecting a federation to behave like one database',
      symptom: 'A report joins a local table with a foreign table and sometimes sees a half-applied change from the remote system, or runs for minutes.',
      cause: 'Federated sources are autonomous. Each keeps its own transactions and snapshots, and a join the wrapper cannot push down pulls whole remote tables over the network.',
      fix: 'Treat foreign tables as read models. Check with `EXPLAIN VERBOSE` which clauses become remote SQL, and never rely on atomic commits across sources.',
      sql: `EXPLAIN (VERBOSE, COSTS OFF)
SELECT * FROM billing.invoices i JOIN orders o ON o.id = i.order_id WHERE i.amount > 100;` },
    { title: 'Shared-disk is not shared-nothing',
      symptom: 'Adding compute nodes to a shared-storage cluster raised throughput for reads but not for a write-heavy hot table.',
      cause: 'Every node writes the same pages, so hot pages bounce between nodes through the global lock and cache protocol. Adding nodes adds coordination, not write capacity for that data.',
      fix: 'For write scaling, split the data so each node owns a part (shared-nothing). Keep shared storage for availability and read scaling.' },
    { title: 'Picking a family by the first query',
      symptom: 'A key-value or wide-column design fits the launch feature, then every new report needs a new table or a full export.',
      cause: 'These families optimise one access path chosen up front. Queries on other attributes, joins or multi-key transactions are expensive or absent.',
      fix: 'List the access paths and transaction boundaries first. If joins and multi-row transactions matter, choose a relational or distributed SQL system and pick the partition key from the most common transaction.' },
  ],
  pointers: [
    'Architecture = what nodes share: **shared-memory** (memory + disks), **shared-disk** (disks), **shared-nothing** (only the network). Federated systems join **autonomous** databases through export schemas.',
    'Classify any system along **distribution**, **heterogeneity** and **autonomy**. A federation is high on all three, a distributed SQL cluster is tightly integrated and homogeneous. **Client-server** systems give one site (a coordinator) the global catalog and query planning (Citus); **peer-to-peer** systems let every node accept any query (Cassandra, CockroachDB). **Homogeneous** means the same DBMS on every site; **heterogeneous** means different products behind wrappers.',
    'Transparencies, weakest to strongest: **location** (no site names), **replication** (no copy names), **fragmentation** (only global names), then **failure** transparency through atomic commit and failover.',
    'NoSQL families trade query flexibility for a fast access path: key-value, document, wide-column, graph. Distributed SQL keeps SQL and ACID on shared-nothing; see [why distribute](/e3/why-distribute) and [foreign data wrappers](/m6/fdw).',
    'Next: how the data is split and placed, in [Fragmentation, allocation and replication](/e5/fragmentation-replication). For one concrete coordinator-and-workers system, see [Sharding with Citus](/e3/sharding-citus).',
  ],
  sources: ['postgres-fdw.html', 'sql-createforeigndatawrapper.html', 'sql-createserver.html', 'sql-createusermapping.html', 'sql-createforeigntable.html', 'ddl-partitioning.html', 'ddl-constraints.html', 'queries-with.html', 'datatype-json.html'],
}
