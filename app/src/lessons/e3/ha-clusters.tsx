import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Md } from '../../lesson/Md'
import { Slider } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a Patroni cluster (pg1..pg3) with an etcd leader key and HAProxy health checks.
 * Timings are computed from the sliders: ttl / loop_wait / retry_timeout (Patroni defaults 30/10/10),
 * HAProxy "inter 3s fall 3 rise 2" (Patroni's sample haproxy.cfg). Promotion is an assumed 2 s, a modelled value.
 * Patroni 3.2+ lowers loop_wait / retry_timeout itself when the rule is broken; the unsafe case shows what the rule prevents.
 * Partition case: the isolated leader demotes itself at worst after loop_wait + 2*retry_timeout;
 * the key expires after ttl. If the first is later than the second, two primaries can overlap.
 * ---------------------------------------------------------------------------------------------- */

type Role = 'primary' | 'replica' | 'down' | 'read-only' | 'promoting'
interface HS { t: number; roles: Role[]; holder: number | null; ttlLeft: number; route: number | null; isolated?: number; lost?: string; split?: boolean; gap?: boolean; tl: number }
type Sc = 'crash' | 'partition' | 'switch'
const INTER = 3, FALL = 3, RISE = 2, PROMOTE = 2

function build(sc: Sc, ttl: number, loop: number, retry: number, sync: boolean): Step<HS>[] {
  const ok = (r: Role[], extra: Partial<HS> = {}): HS => ({ t: 0, roles: r, holder: 0, ttlLeft: ttl, route: 0, tl: 1, ...extra })
  if (sc === 'crash') {
    const down = FALL * INTER
    return [
      { title: 'Healthy cluster', body: `pg1 holds the **leader key** in etcd and renews it every \`loop_wait\` = ${loop} s, each time resetting its TTL to ${ttl} s. HAProxy asks every node \`GET /primary\`: only pg1 answers 200.`,
        state: ok(['primary', 'replica', 'replica']) },
      { title: 't = 0 s: pg1 crashes', body: 'The machine is gone, and so is its Patroni. Nobody renews the key, but it stays valid until its TTL runs out. Writes start failing at once.',
        state: ok(['down', 'replica', 'replica'], { t: 0, route: 0 }) },
      { title: `t = ${down} s: HAProxy marks pg1 down`, body: `Three failed checks, ${INTER} s apart (\`inter 3s fall 3\`), take pg1 out of the pool. Now there is no backend for writes at all.`,
        state: ok(['down', 'replica', 'replica'], { t: down, ttlLeft: Math.max(0, ttl - down), route: null }) },
      { title: `t = ${ttl} s: the leader key expires`, body: `In this model pg1 renewed the key just before it crashed, so it lives a full TTL. The replicas are watching it. Each checks the others over the REST API; **pg2** has the newest WAL position, within \`maximum_lag_on_failover\`, and creates the key atomically. pg3 loses the race.`,
        state: ok(['down', 'promoting', 'replica'], { t: ttl, holder: 1, ttlLeft: ttl, route: null }) },
      { title: `t = ${ttl + PROMOTE} s: pg2 is promoted`, body: 'Patroni promotes pg2, which starts **timeline 2**, and re-points pg3 at it. pg2 now answers 200 on `/primary`. The 2 s for promotion is an assumption of this model; the real time depends on how much WAL is left to replay.',
        state: ok(['down', 'primary', 'replica'], { t: ttl + PROMOTE, holder: 1, ttlLeft: ttl, route: null, tl: 2 }) },
      { title: `t = ${ttl + PROMOTE + RISE * INTER} s: traffic flows again`, body: `Two good checks (\`rise 2\`) and HAProxy sends writes to pg2. Outage: about **${ttl + PROMOTE + RISE * INTER} s**. ${sync ? 'With `synchronous_mode` on, every acknowledged commit was already on pg2: **nothing lost**.' : 'Replication was asynchronous: commits pg1 acknowledged but had not streamed to pg2 are **lost**.'}`,
        state: ok(['down', 'primary', 'replica'], { t: ttl + PROMOTE + RISE * INTER, holder: 1, route: 1, tl: 2, lost: sync ? '0 commits lost' : 'unreplicated tail lost' }) },
      { title: 'pg1 comes back as a replica', body: 'Its Patroni sees that pg2 holds the key, so pg1 must not start as primary. If its WAL diverged, `pg_rewind` (with `use_pg_rewind`) rewinds it, then it follows pg2 on timeline 2.',
        state: ok(['replica', 'primary', 'replica'], { t: ttl + PROMOTE + RISE * INTER + 30, holder: 1, route: 1, tl: 2, lost: sync ? '0 commits lost' : 'unreplicated tail lost' }) },
    ]
  }
  if (sc === 'partition') {
    const demote = loop + 2 * retry
    const promoted = ttl + PROMOTE
    const split = demote > ttl
    const cut: Step<HS> = { title: 't = 0 s: pg1 is cut off from etcd', body: 'A network fault isolates pg1 from etcd and the other members. PostgreSQL on pg1 is fine and HAProxy can still reach it, so clients keep writing to pg1.',
      state: ok(['primary', 'replica', 'replica'], { isolated: 0 }) }
    const fail: Step<HS> = { title: `t = ${loop} s: renewal fails`, body: `On its next loop pg1's Patroni cannot update the key. It keeps retrying etcd for up to \`retry_timeout\` = ${retry} s.`,
      state: ok(['primary', 'replica', 'replica'], { t: loop, ttlLeft: Math.max(0, ttl - loop), isolated: 0 }) }
    if (!split) return [cut, fail,
      { title: `t ≤ ${demote} s: pg1 demotes itself`, body: `It cannot prove it is still leader, so Patroni restarts PostgreSQL **read-only** at the latest after \`loop_wait + 2 × retry_timeout\` = ${demote} s. This self-fencing is what prevents two primaries. \`/primary\` now returns 503.`,
        state: ok(['read-only', 'replica', 'replica'], { t: demote, ttlLeft: Math.max(0, ttl - demote), isolated: 0, route: null }) },
      { title: `t = ${ttl} s: key expires, pg2 takes over`, body: `pg2 wins the election and is promoted. Because ${loop} + 2 × ${retry} = ${demote} ≤ ttl ${ttl}, pg1 was already read-only: there is **never more than one primary**.`,
        state: ok(['read-only', 'promoting', 'replica'], { t: ttl, holder: 1, ttlLeft: ttl, isolated: 0, route: null }) },
      { title: `t = ${promoted + RISE * INTER} s: writes go to pg2`, body: 'HAProxy routes to pg2. When the network heals, pg1 rejoins as a replica, rewound if needed.',
        state: ok(['read-only', 'primary', 'replica'], { t: promoted + RISE * INTER, holder: 1, route: 1, tl: 2, isolated: 0, lost: '0 split-brain writes' }) },
    ]
    // Unsafe: the key expires first (t = ttl), then pg2 finishes promoting (ttl + PROMOTE) and pg1 demotes (demote), in whichever order the numbers give.
    const expire: Step<HS> = { title: `t = ${ttl} s: the key expires, pg1 is still primary`, body: `**The rule is broken**: ${loop} + 2 × ${retry} = ${demote} > ttl ${ttl}. (Patroni 3.2 and later refuse such values: they lower \`loop_wait\`, or \`retry_timeout\`, and log a warning. This step shows what that protects against.) The key expired, so pg2 takes it and starts promoting, but pg1 has not given up yet and keeps accepting writes from clients that still reach it.`,
      state: ok(['primary', 'promoting', 'replica'], { t: ttl, holder: 1, ttlLeft: ttl, isolated: 0, route: 0, split: true }) }
    const head = loop < ttl ? [cut, fail, expire] : [cut, expire] // with loop_wait >= ttl the key is gone before pg1 even tries to renew it
    const overlap = demote - promoted
    if (overlap > 0) return [...head,
      { title: `t = ${promoted} s: pg2 is promoted, pg1 is still primary`, body: `Promotion took the assumed ${PROMOTE} s. Now **two primaries** accept writes: pg2 on timeline 2, and pg1 for every client that still reaches it.`,
        state: ok(['primary', 'primary', 'replica'], { t: promoted, holder: 1, ttlLeft: ttl, isolated: 0, route: 0, tl: 2, split: true }) },
      { title: `t = ${demote} s: pg1 finally demotes`, body: `For ${demote - ttl} s two nodes believed they were the leader, and for ${overlap} s of that both accepted writes. Rows written to pg1 in that window exist only on pg1, and someone must reconcile them by hand before pg1 is rewound.`,
        state: ok(['read-only', 'primary', 'replica'], { t: demote, holder: 1, ttlLeft: ttl, isolated: 0, route: 1, tl: 2, split: true, lost: 'divergent writes on pg1' }) },
    ]
    return [...head,
      { title: `t = ${demote} s: pg1 finally demotes`, body: `For ${demote - ttl} s two nodes believed they were the leader. pg2 was still promoting (an assumed ${PROMOTE} s), so this time the two did not accept writes at the same moment. Only the length of a promotion stood between this cluster and two primaries.`,
        state: ok(['read-only', 'promoting', 'replica'], { t: demote, holder: 1, ttlLeft: ttl, isolated: 0, route: null, split: true, lost: 'pg1 was primary without the key' }) },
      { title: `t = ${promoted + RISE * INTER} s: writes go to pg2`, body: 'pg2 finished promoting to timeline 2 and HAProxy routes to it. When the network heals, pg1 rejoins as a replica, rewound if needed. Fix the timings before the next network fault.',
        state: ok(['read-only', 'primary', 'replica'], { t: promoted + RISE * INTER, holder: 1, route: 1, tl: 2, isolated: 0, lost: 'pg1 was primary without the key' }) },
    ]
  }
  return [
    { title: 'patronictl switchover --candidate pg2', body: 'A planned change, for example before patching pg1. Patroni checks that pg2 is healthy and caught up.',
      state: ok(['primary', 'replica', 'replica']) },
    { title: 'pg1 shuts down cleanly', body: 'pg1 stops taking writes and shuts down with a checkpoint, and Patroni waits until pg2 has received all of its WAL.',
      state: ok(['read-only', 'replica', 'replica'], { t: 2, route: null }) },
    { title: 'Hand over the key', body: 'pg1 releases the leader key itself, so nobody waits for a TTL. pg2 takes the key and is promoted to timeline 2.',
      state: ok(['read-only', 'promoting', 'replica'], { t: 4, holder: 1, route: null }) },
    { title: `t = ${4 + PROMOTE + RISE * INTER} s: traffic on pg2`, body: `HAProxy sees pg2 answer 200 twice and routes to it: a few seconds of write unavailability, **no data loss**, no TTL wait.`,
      state: ok(['read-only', 'primary', 'replica'], { t: 4 + PROMOTE + RISE * INTER, holder: 1, route: 1, tl: 2, lost: '0 commits lost' }) },
    { title: 'pg1 follows pg2', body: 'pg1 restarts as a replica of pg2. A clean shutdown left nothing to rewind. Run switchovers regularly: they test the failover path too.',
      state: ok(['replica', 'primary', 'replica'], { t: 40, holder: 1, route: 1, tl: 2, lost: '0 commits lost' }) },
  ]
}

const RT: Record<Role, Tone> = { primary: 'tuple', replica: 'pointer', down: 'dead', 'read-only': 'new', promoting: 'header' }
const NXS = [110, 320, 530]

function Scene({ s, ttl, i }: { s: HS; ttl: number; i: number }) {
  const codes = s.roles.map((r) => (r === 'primary' ? 200 : r === 'down' ? '—' : 503))
  return (
    <svg viewBox="0 0 640 270" className="w-full min-w-[520px]" role="img" aria-label="Patroni cluster with etcd and HAProxy">
      {/* etcd */}
      <rect x={20} y={14} width={250} height={74} rx={10} fill={toneBg('header', 12)} stroke={tone('header')} />
      <text x={32} y={34} fontSize={12} fontWeight={700} fill="var(--text)">etcd (3 members)</text>
      <text x={32} y={52} fontSize={10.5} fill="var(--text)" fontFamily="var(--font-mono)">/service/pg/leader = {s.holder === null ? '(none)' : `pg${s.holder + 1}`}</text>
      <rect x={32} y={62} width={226} height={12} rx={6} fill="var(--surface-2)" stroke="var(--border)" />
      <motion.rect x={32} y={62} height={12} rx={6} initial={false} animate={{ width: (226 * s.ttlLeft) / ttl }} transition={{ duration: 0.6 }}
        fill={tone(s.ttlLeft < ttl / 3 ? 'dead' : 'header')} />
      <text x={258} y={84} textAnchor="end" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">TTL left {s.ttlLeft} s</text>
      {/* haproxy */}
      <rect x={370} y={14} width={250} height={74} rx={10} fill="var(--surface)" stroke="var(--border)" />
      <text x={382} y={34} fontSize={12} fontWeight={700} fill="var(--text)">HAProxy :5000 (writes)</text>
      <text x={382} y={52} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">option httpchk GET /primary</text>
      <motion.text key={`${s.route}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={382} y={72} fontSize={11} fontWeight={700}
        fill={tone(s.route === null ? 'dead' : s.split ? 'dead' : 'ok')} fontFamily="var(--font-mono)">→ {s.route === null ? 'no backend: writes fail' : `pg${s.route + 1}`}</motion.text>
      <text x={320} y={112} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily="var(--font-mono)">t = {s.t} s · timeline {s.tl}</text>
      {s.roles.map((r, n) => {
        const t = RT[r]
        const x = NXS[n]
        return (
          <g key={n}>
            {s.route === n && <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1={495} y1={88} x2={x} y2={150} stroke={tone(s.split ? 'dead' : 'ok')} strokeWidth={2.5} />}
            {s.holder === n && <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1={145} y1={88} x2={x} y2={150} stroke={tone('header')} strokeWidth={1.5} strokeDasharray="5 4" />}
            <motion.rect initial={false} animate={{ fill: toneBg(t, 18), stroke: tone(t) }} x={x - 90} y={150} width={180} height={78} rx={10} strokeWidth={1.6}
              strokeDasharray={r === 'down' ? '5 4' : undefined} />
            <text x={x} y={172} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--text)">pg{n + 1}</text>
            <motion.text key={r} initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={x} y={190} textAnchor="middle" fontSize={11} fill={tone(t)} fontFamily="var(--font-mono)">{r}</motion.text>
            <text x={x} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">GET /primary → {codes[n]}</text>
            {s.isolated === n && <text x={x} y={222} textAnchor="middle" fontSize={10} fontWeight={700} fill={tone('dead')}>no etcd access</text>}
          </g>
        )
      })}
      {s.isolated !== undefined && <line x1={NXS[s.isolated] + 100} x2={NXS[s.isolated] + 100} y1={120} y2={240} stroke={tone('dead')} strokeWidth={2} strokeDasharray="3 4" />}
      {s.lost && <text x={320} y={256} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={tone(s.lost.startsWith('0') ? 'ok' : 'dead')}>{s.lost}</text>}
      {s.split && !s.lost && <text x={320} y={256} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={tone('dead')}>two nodes may accept writes</text>}
    </svg>
  )
}

function HaViz() {
  const [sc, setSc] = useState<Sc>('crash')
  const [ttl, setTtl] = useState(30)
  const [loop, setLoop] = useState(10)
  const [retry, setRetry] = useState(10)
  const [sync, setSync] = useState(false)
  const rule = loop + 2 * retry <= ttl
  const steps = build(sc, ttl, loop, retry, sync)
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap gap-2">
        <Segmented label="scenario" value={sc} onChange={setSc} options={[['crash', 'Primary crashes'], ['partition', 'Primary cut off'], ['switch', 'Planned switchover']]} />
        {sc === 'crash' && <Segmented label="synchronous_mode" value={sync ? 'on' : 'off'} onChange={(v) => setSync(v === 'on')} options={[['off', 'async'], ['on', 'synchronous_mode']]} />}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="ttl" value={ttl} min={20} max={60} onChange={setTtl} show={`${ttl} s`} />
        <Slider label="loop_wait" value={loop} min={1} max={30} onChange={setLoop} show={`${loop} s`} />
        <Slider label="retry_timeout" value={retry} min={3} max={30} onChange={setRetry} show={`${retry} s`} />
      </div>
      <p className="font-mono text-xs" style={{ color: tone.text(rule ? 'ok' : 'dead') }}>
        loop_wait + 2 × retry_timeout = {loop + 2 * retry} {rule ? '≤' : '>'} ttl {ttl} · {rule ? 'safe: the old leader demotes before the key can expire' : 'unsafe (Patroni 3.2+ would adjust it): try "Primary cut off"'}
      </p>
      <Stepper key={sc} steps={steps} interval={3000} render={(s, i) => (
        <div className="grid gap-3 [&>*]:min-w-0">
          <Legend items={[['tuple', 'primary'], ['pointer', 'replica'], ['header', 'leader key / promoting'], ['new', 'read-only (demoted)'], ['dead', 'down / no route']]} />
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin"><Scene s={s} ttl={ttl} i={i} /></div>
        </div>
      )} />
      <Panel title="Patroni REST endpoints HAProxy can check">
        <p className="text-xs text-muted"><Md>{'`/primary` (or `/read-write`): 200 only on the node that holds the leader key. `/replica`: 200 on a running replica, `?lag=16MB` to exclude laggards. `/sync` and `/async` by replication mode. `/health`, `/liveness`, `/readiness` for orchestrators.'}</Md></p>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'ha-clusters',
  module: 'e3',
  order: 6,
  title: 'High-availability clusters in practice',
  tldr: [
    'An HA cluster is a primary with standbys plus a manager such as **Patroni** that holds a **leader key** in a consensus store (etcd, Consul, ZooKeeper), promotes a standby when the leader stops renewing it, and lets a proxy route clients to whoever holds the key.',
    'PostgreSQL ships replication and `pg_promote()` but no failure detection or fencing, and getting those wrong means either long outages or two primaries.',
  ],
  visualizer: {
    title: 'A Patroni failover, second by second',
    caption: 'Step through a crash, a network cut and a planned switchover. Move the ttl, loop_wait and retry_timeout sliders to see the timings change and the split-brain rule break.',
    Component: HaViz,
  },
  playground: {
    setup: `
CREATE TABLE orders (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, total numeric(10,2) NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO orders (total) SELECT round((random() * 200)::numeric, 2) FROM generate_series(1, 500);
-- Patroni timing settings to compare (ttl, loop_wait, retry_timeout)
CREATE TABLE dcs_configs (name text PRIMARY KEY, ttl int, loop_wait int, retry_timeout int);
INSERT INTO dcs_configs VALUES ('defaults', 30, 10, 10), ('fast', 20, 5, 7), ('wrong', 20, 10, 10), ('slow network', 60, 10, 25);`,
    presets: [
      { label: 'Am I the primary?', sql: `SELECT pg_is_in_recovery() AS is_standby,
       pg_current_wal_lsn() AS current_lsn,
       pg_walfile_name(pg_current_wal_lsn()) AS wal_file,
       (SELECT timeline_id FROM pg_control_checkpoint()) AS timeline;`,
        note: 'This is the first question every health check asks. A promoted standby starts a new **timeline**, visible in the first 8 hex digits of the WAL file name. This single node is a primary on timeline 1.' },
      { label: 'One slot per member', sql: `SELECT pg_create_physical_replication_slot('pg2', true);
SELECT pg_create_physical_replication_slot('pg3', true);
SELECT slot_name, slot_type, active, restart_lsn, wal_status FROM pg_replication_slots ORDER BY 1;`,
        note: 'With `use_slots` (the default) Patroni keeps a physical slot for each other member, so the primary retains the WAL a lagging replica still needs. Here no replica is connected, so both slots are inactive.' },
      { label: 'How far behind is a replica?', sql: `-- make sure both slots exist (does nothing if you already created them)
SELECT pg_create_physical_replication_slot(s, true) FROM unnest(ARRAY['pg2', 'pg3']) s
WHERE NOT EXISTS (SELECT 1 FROM pg_replication_slots WHERE slot_name = s);

SELECT slot_name,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots;

INSERT INTO orders (total) SELECT 10 FROM generate_series(1, 5000);

SELECT slot_name,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots;
SELECT pg_drop_replication_slot('pg2'), pg_drop_replication_slot('pg3');`,
        note: 'Lag is a WAL distance in bytes. Patroni compares it with `maximum_lag_on_failover` before letting a replica take over, and HAProxy can exclude laggards with `/replica?lag=…`. The inactive slots keep growing until dropped.' },
      { label: 'Synchronous commit, per transaction', sql: `SELECT name, setting, context FROM pg_settings
WHERE name IN ('synchronous_commit', 'synchronous_standby_names', 'max_wal_senders', 'hot_standby', 'wal_log_hints')
ORDER BY name;

BEGIN;
SET LOCAL synchronous_commit = remote_apply;
INSERT INTO orders (total) VALUES (999.99);
SHOW synchronous_commit;
COMMIT;`,
        note: '`synchronous_standby_names` has context `sighup`: Patroni writes it into the configuration when `synchronous_mode` is on. Each transaction can still choose how long to wait. With no standbys listed, nothing waits here.' },
      { label: 'Check the timing rule', sql: `SELECT name, ttl, loop_wait, retry_timeout,
       loop_wait + 2 * retry_timeout AS worst_demote_s,
       loop_wait + 2 * retry_timeout <= ttl AS rule_ok,
       ttl + 2 + 2 * 3 AS approx_failover_s
FROM dcs_configs ORDER BY ttl;`,
        note: 'Patroni requires `loop_wait + 2 * retry_timeout <= ttl`; since 3.2 it lowers `loop_wait` (or `retry_timeout`) with a warning when the values break it. The "wrong" row breaks it: the old leader could still be primary when the key expires. The failover estimate adds an assumed 2 s promotion and two 3 s HAProxy checks to the TTL.' },
    ],
  },
  production: {
    title: 'A three-node Patroni cluster with zero data loss',
    context: 'An order service needs automatic failover within a minute and must never lose an acknowledged order.',
    problem: 'Its first setup had one asynchronous standby and a script that promoted it when pings failed. A network blip produced two primaries, and a real crash lost the last seconds of orders.',
    solution: 'Run three PostgreSQL nodes under Patroni with a three-member etcd, `synchronous_mode` on, slots per member, `pg_rewind` for returning nodes, and HAProxy checking `/primary` for writes and `/replica?lag=…` for reads.',
    sql: `-- patroni.yml (bootstrap.dcs, applied at first initialization; later: patronictl edit-config)
--   ttl: 30
--   loop_wait: 10
--   retry_timeout: 10
--   maximum_lag_on_failover: 1048576   # bytes; also the default
--   synchronous_mode: true
--   postgresql: { use_pg_rewind: true, use_slots: true }
-- haproxy.cfg (example values, as in Patroni's sample config)
--   listen primary
--     bind *:5000
--     option httpchk GET /primary
--     http-check expect status 200
--     default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
--     server pg1 10.0.0.11:5432 check port 8008
--     server pg2 10.0.0.12:5432 check port 8008
--     server pg3 10.0.0.13:5432 check port 8008

-- on the primary: who is synchronous, and how far behind is everyone?
SELECT application_name, state, sync_state,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)) AS replay_lag
FROM pg_stat_replication;`,
    outcome: 'A crash now costs well under a minute of write unavailability with the default timings (about 40 s in the worst case modelled above) and no acknowledged order is lost, because a commit returns only after a synchronous standby has it. The isolated old primary demotes itself before anyone else is promoted.',
  },
  pitfalls: [
    { title: 'Split-brain from a home-made failover script',
      symptom: 'After a network blip, two nodes both accept writes, and their data diverges.',
      cause: 'The script promoted a standby because it could not reach the primary, but the primary was alive and still serving clients. Nothing fenced it.',
      fix: 'Use a manager with a leader lock in a consensus store (Patroni + etcd), so a node that cannot renew the lock demotes itself. Add a watchdog for the case where Patroni itself hangs, and never promote by hand while the old primary may be alive.' },
    { title: 'Timings that break the fencing rule',
      symptom: 'Failover tests pass, but under real network trouble the old leader keeps writing after a new one is promoted.',
      cause: 'With `loop_wait + 2 * retry_timeout > ttl` the leader key can expire before the isolated leader gives up and demotes. Patroni before 3.2 accepted such values silently; 3.2 and later adjust them and log a warning, which is easy to miss.',
      fix: 'Keep `loop_wait + 2 * retry_timeout <= ttl`. Change the values with `patronictl edit-config`; `bootstrap.dcs` only applies when the cluster is first created.' },
    { title: 'Synchronous mode with a single standby',
      symptom: 'Writes hang whenever the one synchronous standby restarts.',
      cause: 'With `synchronous_mode_strict: true` (or a hand-set `synchronous_standby_names`) a commit always waits for a synchronous standby; with exactly one candidate there is nobody else to confirm. Plain `synchronous_mode: true` instead falls back to asynchronous commits while no standby is available, and Patroni will not fail over to a standby that was not synchronous.',
      fix: 'Run at least two replicas so another can become synchronous, or use quorum commit (`synchronous_mode: quorum`, `ANY n (...)`) so one standby can be down.' },
    { title: 'An old primary that cannot rejoin',
      symptom: 'After failover the old primary refuses to start as a replica because its timeline forked.',
      cause: 'It wrote WAL after the fork point that the new primary never received.',
      fix: 'Enable `use_pg_rewind` (it needs `wal_log_hints = on` or data checksums), or rebuild the node from a fresh base backup. See [streaming replication](/m7/streaming-replication) for timelines and standbys.' },
  ],
  pointers: [
    'Patroni keeps a **leader key** with a TTL in a DCS (etcd, Consul, ZooKeeper, Kubernetes). Only the key holder runs as primary; a holder that cannot renew it **demotes itself**.',
    'Defaults `ttl` 30 / `loop_wait` 10 / `retry_timeout` 10, and the rule **`loop_wait + 2 * retry_timeout <= ttl`**. A crash costs roughly the TTL plus promotion plus proxy checks.',
    'HAProxy routes by HTTP checks against Patroni\'s REST API: `/primary` for writes, `/replica?lag=` for reads. A pooler such as [PgBouncer](/m7/connection-pooling) sits behind it or beside it.',
    '`synchronous_mode` makes failover lose nothing acknowledged; asynchronous failover can lose the unreplicated tail.',
    'Switchover is the planned, lossless version: rehearse it regularly. A returning old primary needs `pg_rewind` or a rebuild. Failure detection and split brain in general: [operating distributed databases](/e5/operating-distributed).',
  ],
  sources: ['high-availability.html', 'warm-standby.html', 'warm-standby-failover.html', 'runtime-config-replication.html', 'functions-admin.html', 'app-pgrewind.html', 'view-pg-replication-slots.html'],
}
