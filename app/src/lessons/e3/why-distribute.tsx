import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Arrows, Btn, Packet, Slider, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: five ways to run PostgreSQL on more than one machine, drawn on one canvas.
 * A write and a read are animated hop by hop; "fail" removes one component and re-routes the flows.
 * Mechanics follow the primary docs summarised in research/X-distributed-postgres.md:
 * streaming replicas + HA manager, Aurora-style 4-of-6 storage quorum, Citus router / multi-shard,
 * YugabyteDB Raft tablets, async multi-master (PGD / Spock).
 * ---------------------------------------------------------------------------------------------- */

type ArchId = 'replicas' | 'shared' | 'sharding' | 'dsql' | 'multi'
interface NodeDef { id: string; x: number; y: number; w?: number; label: string; sub: string; t: Tone }
type Hop = [string, string, Tone]
interface Flow { hops: Hop[][]; text: string }
interface Arch {
  name: string; nodes: NodeDef[]; links: [string, string][]; fail: string[]; failLabel: string
  failSub?: Record<string, string>
  write: Flow; read: Flow; writeF: Flow; readF: Flow
  facts: [string, string][]; cap: string; capT: Tone
}

const C: NodeDef = { id: 'c', x: 320, y: 34, w: 110, label: 'client', sub: 'app server', t: 'muted' }

const ARCH: Record<ArchId, Arch> = {
  replicas: {
    name: 'Read replicas + HA',
    nodes: [C, { id: 'p', x: 320, y: 140, label: 'primary', sub: 'reads + writes', t: 'tuple' },
      { id: 'r1', x: 140, y: 250, label: 'replica 1', sub: 'hot standby', t: 'pointer' },
      { id: 'r2', x: 500, y: 250, label: 'replica 2', sub: 'hot standby', t: 'pointer' }],
    links: [['c', 'p'], ['p', 'r1'], ['p', 'r2'], ['c', 'r1']],
    fail: ['p'], failLabel: 'Fail the primary', failSub: { r1: 'promoted primary' },
    write: { hops: [[['c', 'p', 'new']], [['p', 'c', 'ok']], [['p', 'r1', 'tuple'], ['p', 'r2', 'tuple']]],
      text: 'One primary accepts every write. With asynchronous replication the **COMMIT returns first** and the WAL reaches the replicas a moment later.' },
    read: { hops: [[['c', 'r1', 'new']], [['r1', 'c', 'ok']]],
      text: 'Reads scale out across replicas, but a replica may lag: no **read-your-writes** and no **monotonic reads** unless you route carefully.' },
    writeF: { hops: [[['c', 'r1', 'new']], [['r1', 'c', 'ok']], [['r1', 'r2', 'tuple']]],
      text: 'An HA manager (Patroni) promoted replica 1 and re-pointed replica 2. Writes resume after the failover. Commits that had not reached replica 1 are **lost** if replication was asynchronous.' },
    readF: { hops: [[['c', 'r2', 'new']], [['r2', 'c', 'ok']]], text: 'Replica 2 keeps serving reads from its own copy and now follows the new primary.' },
    facts: [['writes on', 'one primary'], ['data', 'full copy on every node'], ['consistency', 'primary: single node; replicas: stale by the lag'], ['on failure', 'failover in seconds; async loses the tail'], ['pays with', 'replication lag or sync commit latency'], ['examples', 'built-in streaming + Patroni, CloudNativePG']],
    cap: 'CP if sync, otherwise the tail can be lost', capT: 'pointer',
  },
  shared: {
    name: 'Shared storage',
    nodes: [C, { id: 'w', x: 210, y: 128, label: 'writer', sub: 'stateless compute', t: 'tuple' },
      { id: 'rd', x: 430, y: 128, label: 'reader', sub: 'stateless compute', t: 'pointer' },
      ...[0, 1, 2, 3, 4, 5].map((i) => ({ id: `s${i}`, x: 82 + i * 95, y: 256, w: 82, label: `copy ${i + 1}`, sub: `AZ ${'abc'[Math.floor(i / 2)]}`, t: 'header' as Tone }))],
    links: [['c', 'w'], ['c', 'rd'], ...[0, 1, 2, 3, 4, 5].map((i) => ['w', `s${i}`] as [string, string]), ['rd', 's3']],
    fail: ['s0', 's1'], failLabel: 'Fail AZ a',
    write: { hops: [[['c', 'w', 'new']], [0, 1, 2, 3, 4, 5].map((i) => ['w', `s${i}`, 'tuple'] as Hop), [0, 1, 2, 3].map((i) => [`s${i}`, 'w', 'ok'] as Hop), [['w', 'c', 'ok']]],
      text: 'The writer ships **only WAL** to the storage layer. A commit is durable once **4 of 6** copies across 3 zones acknowledge; storage turns WAL into pages itself.' },
    read: { hops: [[['c', 'rd', 'new']], [['rd', 's3', 'pointer']], [['s3', 'rd', 'ok']], [['rd', 'c', 'ok']]],
      text: 'A reader shares the same volume, so there is no data copy to build. A cache miss fetches the page from storage over the network.' },
    writeF: { hops: [[['c', 'w', 'new']], [2, 3, 4, 5].map((i) => ['w', `s${i}`, 'tuple'] as Hop), [2, 3, 4, 5].map((i) => [`s${i}`, 'w', 'ok'] as Hop), [['w', 'c', 'ok']]],
      text: 'A whole zone is gone, yet the 4 remaining copies still form the **4-of-6 write quorum**. The writer never noticed.' },
    readF: { hops: [[['c', 'rd', 'new']], [['rd', 's3', 'pointer']], [['s3', 'rd', 'ok']], [['rd', 'c', 'ok']]], text: 'Reads need only a few current copies, so they keep working too.' },
    facts: [['writes on', 'one writer compute'], ['data', 'one volume, 6 copies in 3 zones'], ['consistency', 'single node for the writer; readers lag slightly'], ['on failure', 'compute restarts on the same storage'], ['pays with', 'network write latency; not upstream storage'], ['examples', 'Aurora, AlloyDB, Neon']],
    cap: 'CP storage quorum', capT: 'pointer',
  },
  sharding: {
    name: 'Sharding (Citus)',
    nodes: [C, { id: 'co', x: 320, y: 140, label: 'coordinator', sub: 'metadata + routing', t: 'header' },
      { id: 'w1', x: 120, y: 250, label: 'worker 1', sub: 'shards 0, 3, 6…', t: 'tuple' },
      { id: 'w2', x: 320, y: 250, label: 'worker 2', sub: 'shards 1, 4, 7…', t: 'tuple' },
      { id: 'w3', x: 520, y: 250, label: 'worker 3', sub: 'shards 2, 5, 8…', t: 'tuple' }],
    links: [['c', 'co'], ['co', 'w1'], ['co', 'w2'], ['co', 'w3']],
    fail: ['w2'], failLabel: 'Fail worker 2',
    write: { hops: [[['c', 'co', 'new']], [['co', 'w2', 'new']], [['w2', 'co', 'ok']], [['co', 'c', 'ok']]],
      text: '`INSERT … company_id = 7`: the coordinator hashes the **distribution column**, finds the one shard and sends the statement only to worker 2. This is a **router** query.' },
    read: { hops: [[['c', 'co', 'new']], [['co', 'w1', 'pointer'], ['co', 'w2', 'pointer'], ['co', 'w3', 'pointer']], [['w1', 'co', 'ok'], ['w2', 'co', 'ok'], ['w3', 'co', 'ok']], [['co', 'c', 'ok']]],
      text: '`SELECT count(*)` without the key fans out: **one task per shard**, run in parallel on every worker, merged on the coordinator.' },
    writeF: { hops: [[['c', 'co', 'new']], [['co', 'w2', 'dead']]],
      text: 'Keys that hash to worker 2 now **fail** until its own standby is promoted. Each worker needs its own HA; keys on workers 1 and 3 still work.' },
    readF: { hops: [[['c', 'co', 'new']], [['co', 'w1', 'pointer'], ['co', 'w2', 'dead'], ['co', 'w3', 'pointer']]],
      text: 'A query that needs every shard fails too: one missing worker makes the whole fan-out fail.' },
    facts: [['writes on', 'coordinator, or any node in MX mode'], ['data', 'rows hashed into 32 shards across workers'], ['consistency', 'per shard; cross-shard writes commit with 2PC'], ['on failure', "that worker's shards are unavailable"], ['pays with', 'shard key in every table, key, query'], ['examples', 'Citus']],
    cap: 'CP per shard group', capT: 'pointer',
  },
  dsql: {
    name: 'Distributed SQL',
    nodes: [C, { id: 'n1', x: 130, y: 160, label: 'node 1', sub: 'tablet T leader', t: 'tuple' },
      { id: 'n2', x: 320, y: 262, label: 'node 2', sub: 'tablet T follower', t: 'pointer' },
      { id: 'n3', x: 510, y: 160, label: 'node 3', sub: 'tablet T follower', t: 'pointer' }],
    links: [['c', 'n3'], ['n1', 'n2'], ['n2', 'n3'], ['n1', 'n3']],
    fail: ['n1'], failLabel: 'Fail node 1 (leader)', failSub: { n2: 'tablet T leader (term +1)' },
    write: { hops: [[['c', 'n3', 'new']], [['n3', 'n1', 'new']], [['n1', 'n2', 'tuple'], ['n1', 'n3', 'tuple']], [['n2', 'n1', 'ok']], [['n1', 'n3', 'ok']], [['n3', 'c', 'ok']]],
      text: 'Any node accepts the SQL. It forwards the write to the **tablet leader**, which commits once a **Raft majority** (2 of 3) has the log entry.' },
    read: { hops: [[['c', 'n3', 'new']], [['n3', 'n1', 'pointer']], [['n1', 'n3', 'ok']], [['n3', 'c', 'ok']]],
      text: 'A consistent read also goes to the leader, so every read sees the latest committed write. The extra hop is the price.' },
    writeF: { hops: [[['c', 'n3', 'new']], [['n3', 'n2', 'new']], [['n2', 'n3', 'tuple']], [['n3', 'n2', 'ok']], [['n2', 'n3', 'ok']], [['n3', 'c', 'ok']]],
      text: 'Node 2 won the election within a few seconds (about **3 s** with default heartbeat settings). Nodes 2 and 3 are still a majority, so writes continue with nothing lost.' },
    readF: { hops: [[['c', 'n3', 'new']], [['n3', 'n2', 'pointer']], [['n2', 'n3', 'ok']], [['n3', 'c', 'ok']]], text: 'Reads follow the new leader. Losing a second node would leave no majority, and tablet T would stop.' },
    facts: [['writes on', 'any node (leader per tablet)'], ['data', 'tablets, each replicated 3 ways with Raft'], ['consistency', 'strong; snapshot or serializable, RC opt-in'], ['on failure', 'new tablet leaders in seconds, no loss'], ['pays with', 'a consensus round trip per write; RPCs per join'], ['examples', 'YugabyteDB, CockroachDB']],
    cap: 'CP (minority side stops)', capT: 'pointer',
  },
  multi: {
    name: 'Multi-master',
    nodes: [C, { id: 'a', x: 150, y: 190, label: 'node A', sub: 'region 1, writable', t: 'tuple' },
      { id: 'b', x: 490, y: 190, label: 'node B', sub: 'region 2, writable', t: 'tuple' }],
    links: [['c', 'a'], ['c', 'b'], ['a', 'b']],
    fail: ['link'], failLabel: 'Cut the link A–B',
    write: { hops: [[['c', 'a', 'new']], [['a', 'c', 'ok']], [['a', 'b', 'tuple']]],
      text: 'Node A commits **locally** and answers at once. Logical replication sends the row to B afterwards, so a concurrent write to the same row on B becomes a **conflict**.' },
    read: { hops: [[['c', 'b', 'new']], [['b', 'c', 'ok']]], text: 'Any node answers reads from its own copy, which may not have the other region\'s newest writes yet.' },
    writeF: { hops: [[['c', 'a', 'new']], [['a', 'c', 'ok']], [['a', 'b', 'dead']]],
      text: 'Both sides keep accepting writes (**available**), but they now diverge. Queued changes meet on reconnect and conflict rules pick a winner, often the latest commit timestamp.' },
    readF: { hops: [[['c', 'b', 'new']], [['b', 'c', 'ok']]], text: 'B still answers, with data that misses everything A wrote since the cut.' },
    facts: [['writes on', 'every node'], ['data', 'full copy on every node'], ['consistency', 'eventual; conflicts resolved after commit'], ['on failure', 'other nodes keep writing'], ['pays with', 'conflicts, lost updates, global sequences'], ['examples', 'EDB PGD, pgEdge Spock']],
    cap: 'AP (both sides keep writing)', capT: 'new',
  },
}

const NW = 120, NH = 44

function Diagram({ a, failed, flow }: { a: Arch; failed: boolean; flow: { id: number; f: Flow } | null }) {
  const pos = new Map(a.nodes.map((n) => [n.id, n]))
  const down = (id: string) => failed && a.fail.includes(id)
  const linkCut = failed && a.fail.includes('link')
  return (
    <svg viewBox="0 0 640 300" className="w-full min-w-[520px]" role="img" aria-label={`${a.name} architecture`}>
      <Arrows tones={['muted']} />
      {a.links.map(([x, y]) => {
        const p = pos.get(x)!, q = pos.get(y)!
        const cut = linkCut && x === 'a' && y === 'b'
        const off = down(x) || down(y)
        return <motion.line key={`${x}-${y}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} initial={false}
          animate={{ opacity: off ? 0.25 : 1 }} stroke={cut ? tone('dead') : 'var(--border)'} strokeWidth={2} strokeDasharray={cut || off ? '5 5' : undefined} />
      })}
      {linkCut && <text x={320} y={180} textAnchor="middle" fontSize={12} fontWeight={700} fill={tone('dead')}>network partition</text>}
      {a.nodes.map((n) => {
        const w = n.w ?? NW
        const isDown = down(n.id)
        const sub = failed && a.failSub?.[n.id] ? a.failSub[n.id] : isDown ? 'down' : n.sub
        const t: Tone = isDown ? 'dead' : failed && a.failSub?.[n.id] ? 'new' : n.t
        return (
          <motion.g key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: isDown ? 0.55 : 1, y: 0 }} transition={{ duration: 0.3 }}>
            <rect x={n.x - w / 2} y={n.y - NH / 2} width={w} height={NH} rx={8} fill={toneBg(t, isDown ? 8 : 16)} stroke={tone(t)}
              strokeWidth={1.5} strokeDasharray={isDown ? '5 4' : undefined} />
            <text x={n.x} y={n.y - 3} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{n.label}</text>
            <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize={10} fill={isDown ? tone('dead') : 'var(--muted)'}>{sub}</text>
          </motion.g>
        )
      })}
      {a.nodes.some((n) => n.id === 's0') && <text x={320} y={298} textAnchor="middle" fontSize={10} fill="var(--muted)">storage layer: one volume, 6 copies, write quorum 4 of 6</text>}
      {flow && flow.f.hops.map((stage, i) => stage.map(([x, y, t], j) => {
        const p = pos.get(x)!, q = pos.get(y)!
        const dead = t === 'dead'
        return <Packet key={`${flow.id}-${i}-${j}`} x1={p.x} y1={p.y} x2={dead ? (p.x + q.x) / 2 : q.x} y2={dead ? (p.y + q.y) / 2 : q.y} delay={i * 0.6} t={t} />
      }))}
    </svg>
  )
}

const RTTS = [0.1, 0.5, 1, 2, 5, 10, 30, 70, 150]

function LatencyBudget() {
  const [ri, setRi] = useState(2)
  const [trips, setTrips] = useState(4)
  const [sessions, setSessions] = useState(100)
  const rtt = RTTS[ri]
  const SERVER = 0.2 // ms of server work per statement
  const txnMs = trips * (rtt + SERVER)
  const perSession = 1000 / txnMs
  return (
    <Panel title="Latency budget: why every hop counts">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="network round trip" value={ri} min={0} max={RTTS.length - 1} onChange={setRi} show={`${rtt} ms`} />
        <Slider label="statements per transaction" value={trips} min={1} max={10} onChange={setTrips} show={String(trips)} />
        <Slider label="client sessions" value={sessions} min={1} max={500} onChange={setSessions} show={String(sessions)} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat label="one transaction" value={`${txnMs < 10 ? txnMs.toFixed(1) : Math.round(txnMs)} ms`} sub={`${trips} × (${rtt} ms + 0.2 ms work)`} />
        <Stat label="per session" value={`${perSession >= 100 ? Math.round(perSession).toLocaleString('en-US') : perSession.toFixed(1)} tx/s`} t="tuple" sub="the client waits for each answer" />
        <Stat label="all sessions" value={`${Math.round(perSession * sessions).toLocaleString('en-US')} tx/s`} t={perSession * sessions < 2000 ? 'dead' : 'ok'} sub="if nothing else limits it" />
      </div>
      <p className="mt-2 text-xs text-muted"><Md>{'The protocol is request and response, so a transaction costs **round trips × latency**. At 20 ms per transaction one session can do only 50 per second. Distribution adds hops, so keep a transaction on one node and batch statements.'}</Md></p>
    </Panel>
  )
}

function ArchitectureViz() {
  const [id, setId] = useState<ArchId>('replicas')
  const [failed, setFailed] = useState(false)
  const [flow, setFlow] = useState<{ id: number; kind: 'write' | 'read'; f: Flow } | null>(null)
  const a = ARCH[id]
  const send = (kind: 'write' | 'read') => {
    const f = kind === 'write' ? (failed ? a.writeF : a.write) : (failed ? a.readF : a.read)
    setFlow({ id: Date.now(), kind, f })
  }
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="overflow-x-auto scrollbar-thin">
        <Segmented label="architecture" value={id} onChange={(v) => { setId(v); setFailed(false); setFlow(null) }}
          options={(Object.keys(ARCH) as ArchId[]).map((k) => [k, ARCH[k].name])} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => send('write')}>Send a write</Btn>
        <Btn onClick={() => send('read')}>Send a read</Btn>
        <Btn active={failed} onClick={() => { setFailed(!failed); setFlow(null) }}>{failed ? 'Repair' : a.failLabel}</Btn>
      </div>
      <Legend items={[['new', 'request'], ['tuple', 'replicated change'], ['ok', 'acknowledgement'], ['pointer', 'read fan-out'], ['dead', 'failed hop']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin">
        <Diagram a={a} failed={failed} flow={flow} />
      </div>
      <div className="min-h-[52px] rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
        <AnimatePresence mode="wait">
          <motion.p key={flow ? flow.id : `idle-${id}-${failed}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-muted">
            {flow ? <><b className="text-ink">{flow.kind === 'write' ? 'Write: ' : 'Read: '}</b><Md>{flow.f.text}</Md></>
              : <Md>{failed ? `**${a.failLabel.replace('Fail', 'Failed:').replace('Cut', 'Cut:')}**. Send a write and a read to see what still works.` : 'Send a write and a read through this architecture, then fail a component.'}</Md>}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Panel title={a.name}><FieldTable rows={a.facts.map(([k, v]) => [k, v] as [string, string])} /></Panel>
        <Panel title="Under a network partition">
          <p className="font-mono text-sm font-bold" style={{ color: tone.text(a.capT) }}>{a.cap}</p>
          <p className="mt-1 text-xs text-muted"><Md>{'**CAP**: when the network splits, a system either refuses some requests (consistent) or keeps answering with possibly diverging data (available). **PACELC** adds the everyday case: even with no failure, waiting for other copies buys consistency with latency.'}</Md></p>
        </Panel>
      </div>
      <LatencyBudget />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'why-distribute',
  module: 'e3',
  order: 1,
  title: 'Why and how to distribute PostgreSQL',
  tldr: [
    'PostgreSQL is a **single-node** database, and every "distributed PostgreSQL" adds one of three things around it: **replication** (copies), **distribution** (parts of the data on different machines) or **decentralization** (storage and compute on different machines).',
    'Each design buys scale or availability by adding network round trips and new failure modes, so the right choice starts from what one well-tuned node cannot do.',
  ],
  visualizer: {
    title: 'Five architectures, one write, one read',
    caption: 'Pick an architecture, send a write and a read, then fail a component and send them again. The latency panel shows what each extra round trip costs.',
    Component: ArchitectureViz,
  },
  playground: {
    extensions: ['pg_walinspect'],
    setup: `
CREATE TABLE orders (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id int NOT NULL,
                     amount numeric(10,2) NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO orders (tenant_id, amount)
SELECT 1 + g % 20, round((10 + random() * 90)::numeric, 2) FROM generate_series(1, 2000) g;`,
    presets: [
      { label: 'One node, one WAL stream', sql: `SHOW server_version;
SELECT set_config('lab.before', pg_current_wal_insert_lsn()::text, false);
INSERT INTO orders (tenant_id, amount) VALUES (7, 42.00);
SELECT pg_current_wal_insert_lsn() - current_setting('lab.before')::pg_lsn AS wal_bytes_for_one_insert,
       pg_walfile_name(pg_current_wal_lsn()) AS wal_segment;
SELECT resource_manager, record_type, record_length
FROM pg_get_wal_records_info(current_setting('lab.before')::pg_lsn, pg_current_wal_insert_lsn());`,
        note: 'Every change becomes WAL records: a heap insert, a B-tree insert, a commit. A physical replica replays exactly this stream; a shared-storage system ships only this stream to its storage layer.' },
      { label: 'Commit knobs: latency vs safety', sql: `SELECT name, setting, context, short_desc
FROM pg_settings
WHERE name IN ('synchronous_commit', 'synchronous_standby_names', 'wal_level', 'max_wal_senders', 'hot_standby')
ORDER BY name;

BEGIN;
SET LOCAL synchronous_commit = remote_apply;
SHOW synchronous_commit;
COMMIT;`,
        note: '`synchronous_commit` can change per transaction. With `remote_apply` a commit waits until a synchronous standby has replayed it. Here the standby list is empty, so nothing waits. `synchronous_standby_names` needs a reload, not a `SET`.' },
      { label: 'A slot for a replica', sql: `SELECT pg_create_physical_replication_slot('replica_1', true);
SELECT slot_name, slot_type, active, restart_lsn, wal_status FROM pg_replication_slots;
SELECT pg_drop_replication_slot('replica_1');`,
        note: 'A replica that connects through a slot makes the primary keep the WAL it still needs (without a slot, only `wal_keep_size` or the archive protects it). `active = false`: no replica is connected to this single node.' },
      { label: 'Distribution on one machine', sql: `CREATE TABLE orders_sharded (LIKE orders INCLUDING DEFAULTS) PARTITION BY HASH (tenant_id);
CREATE TABLE orders_shard_0 PARTITION OF orders_sharded FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE orders_shard_1 PARTITION OF orders_sharded FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE orders_shard_2 PARTITION OF orders_sharded FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE orders_shard_3 PARTITION OF orders_sharded FOR VALUES WITH (MODULUS 4, REMAINDER 3);
INSERT INTO orders_sharded OVERRIDING SYSTEM VALUE SELECT * FROM orders;

SELECT tableoid::regclass AS shard, count(*) AS rows, count(DISTINCT tenant_id) AS tenants
FROM orders_sharded GROUP BY 1 ORDER BY 1;`,
        note: 'Hash partitions on one node model shards: each tenant lands in exactly one part. A sharding extension puts those parts on different machines. Note the uneven sizes: 20 tenants do not split evenly 4 ways.' },
      { label: 'Copies of a subset', sql: `CREATE PUBLICATION big_orders FOR TABLE orders (id, tenant_id, amount) WHERE (amount > 90);
SELECT pubname, tablename, attnames, rowfilter FROM pg_publication_tables;`,
        note: 'Logical replication publishes chosen tables, columns and rows. It is the building block of multi-master systems. The warning says this node is not configured to send logical changes; the catalog entry still shows what would be published.' },
      { label: 'Latency arithmetic', sql: `SELECT rtt_ms, trips,
       round(trips * (rtt_ms + 0.2), 1)            AS txn_ms,
       round(1000 / (trips * (rtt_ms + 0.2)))      AS tx_per_s_per_session,
       round(100 * 1000 / (trips * (rtt_ms + 0.2))) AS tx_per_s_100_sessions
FROM (VALUES (0.1), (1), (5), (70)) r(rtt_ms), (VALUES (1), (5)) t(trips)
ORDER BY rtt_ms, trips;`,
        note: 'Same numbers as the visualizer: 5 statements at 70 ms round trip allow about 3 transactions per second per session. Distance, not CPU, sets the ceiling.' },
    ],
  },
  production: {
    title: 'Choosing an architecture from measurements, not fashion',
    context: 'A B2B SaaS on one 16-core PostgreSQL server sees CPU at 70% at peak and plans a move to a "distributed database" before a big customer launch.',
    problem: 'Nobody knows whether reads, writes or one heavy tenant drive the load. A distributed design chosen blind would add round trips to every request and change uniqueness, sequences and joins for the whole application.',
    solution: 'Measure where the time goes first. If reads dominate, add replicas for read-only, staleness-tolerant traffic and an HA manager. If one tenant or the data size dominates, shard by tenant. If the requirement is "survive a region outage with no data loss", that is a consensus system or synchronous replication, and it costs latency on every commit.',
    sql: `-- what dominates: reads or writes, and which statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT left(query, 60) AS query, calls, round(total_exec_time) AS ms, rows
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

SELECT sum(tup_returned + tup_fetched) AS read_tuples,
       sum(tup_inserted + tup_updated + tup_deleted) AS written_tuples
FROM pg_stat_database;

-- one tenant per statement? (a sharding candidate)
SELECT tenant_id, count(*) FROM orders GROUP BY 1 ORDER BY 2 DESC LIMIT 5;`,
    outcome: 'Reads were most of the load, so the team added two streaming replicas behind an HA manager and moved reporting to them. Each next step is now driven by a measured bottleneck, not by the architecture of the week.',
  },
  pitfalls: [
    { title: 'Reading your own write from a replica',
      symptom: 'A user saves a setting, the page reloads from a replica, and the old value comes back.',
      cause: 'Asynchronous replicas lag. The read went to a copy that had not replayed the write yet: no **read-your-writes**. "Synchronous" does not fix it by itself: the default `synchronous_commit = on` waits until the standby has **flushed** the WAL to disk, not replayed it, so a read there can still miss the row.',
      fix: 'Send reads that follow a write to the primary for a short window, or make that transaction commit with `remote_apply` to a synchronous standby. Load-balance only staleness-tolerant reads.',
      sql: `BEGIN;
SET LOCAL synchronous_commit = remote_apply;  -- waits until sync standbys have replayed it
UPDATE user_settings SET theme = 'dark' WHERE user_id = 42;
COMMIT;` },
    { title: 'One synchronous standby blocks every commit',
      symptom: 'The only synchronous standby goes down for maintenance and every write on the primary hangs.',
      cause: 'With `synchronous_standby_names` naming one server, each commit waits for that server. If it is gone, commits wait forever.',
      fix: 'Name at least two candidates and wait for one: `ANY 1 (s1, s2)`. Then one standby may be down without stopping writes.',
      sql: `ALTER SYSTEM SET synchronous_standby_names = 'ANY 1 (s1, s2)';
SELECT pg_reload_conf();` },
    { title: 'Distributing a chatty application',
      symptom: 'After moving to a multi-node design, a page that ran 40 queries takes ten times longer although every query is fast.',
      cause: 'Each statement is now a network round trip, maybe several. Forty statements at 2 ms each is already 80 ms before any work.',
      fix: 'Cut round trips first: batch with multi-row `INSERT` or `COPY`, combine reads, move loops into a single statement or a function, and pool connections. Keep each transaction on one node or one shard.' },
    { title: 'Talking past each other about "cluster"',
      symptom: 'A runbook says "restart the cluster", and one engineer restarts one server while another restarts every node.',
      cause: 'A PostgreSQL **database cluster** is the set of databases one server serves from one data directory. An **HA cluster** is a primary with standbys. `CLUSTER` is also a SQL command that rewrites a table.',
      fix: 'Name the thing: "the instance", "the HA group", "the shard group". Write runbooks with host names, not "the cluster".' },
  ],
  pointers: [
    'Three mechanisms: **replication** (copies), **distribution** (parts), **decentralization** (storage separated from compute). Real systems stack them.',
    'A transaction costs **round trips × latency**: 20 ms per transaction caps one session at 50 transactions per second.',
    'Replicas scale reads but are stale; shared storage gives durable quorum writes with one writer; sharding splits data by a key; distributed SQL runs Raft per tablet; multi-master accepts writes everywhere and resolves conflicts later.',
    '**CAP**: under a partition choose consistency or availability. **PACELC**: otherwise choose latency or consistency, which `synchronous_commit` lets you pick per transaction.',
    'Most workloads fit one large node plus [streaming replicas](/m7/streaming-replication) and an HA manager. Distribute when a measured limit says so. The models behind these choices: [architectures and classification](/e5/architectures).',
  ],
  sources: ['high-availability.html', 'different-replication-solutions.html', 'warm-standby.html', 'warm-standby-failover.html', 'runtime-config-replication.html', 'logical-replication.html', 'ddl-partitioning.html', 'pgwalinspect.html'],
}
