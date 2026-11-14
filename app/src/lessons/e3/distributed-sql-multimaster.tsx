import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Md } from '../../lesson/Md'
import { Btn, Packet, Slider, TRY_SQL, hashint4 } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1: three nodes, three tablets, Raft per tablet (YugabyteDB model): a write commits on a
 * majority; failing a node re-elects leaders of the tablets it led; with one node left nothing commits.
 * Visualizer 2: async multi-master conflict lab: two nodes change the same row, then the resolution
 * rule (Spock: error / apply_remote / keep_local / last_update_wins, plus delta-apply) decides the result.
 * Visualizer 3: YSQL isolation mapping, toggled by yb_enable_read_committed_isolation.
 * ---------------------------------------------------------------------------------------------- */

interface Tablet { term: number; leader: number; idx: number[] }
interface Cluster { up: boolean[]; tablets: Tablet[] }
const RANGES = ['0x0000–0x5554', '0x5555–0xAAA9', '0xAAAA–0xFFFF']
const NX = [110, 320, 530]

const fresh = (): Cluster => ({ up: [true, true, true], tablets: [0, 1, 2].map((t) => ({ term: 1, leader: t, idx: [5, 5, 5] })) })
const upCount = (c: Cluster) => c.up.filter(Boolean).length
function elect(c: Cluster, t: Tablet) {
  if (upCount(c) < 2) { t.leader = -1; return }
  const cands = [0, 1, 2].filter((n) => c.up[n]).sort((a, b) => t.idx[b] - t.idx[a] || a - b)
  t.leader = cands[0]; t.term += 1
}

function RaftViz() {
  const [c, setC] = useState<Cluster>(fresh)
  const [key, setKey] = useState(7)
  const [flow, setFlow] = useState<{ id: number; tab: number; ok: boolean; msg: string; leader: number } | null>(null)
  const hash16 = hashint4(key) & 0xffff
  const tab = Math.min(2, Math.floor(hash16 / 0x5555))
  const write = () => {
    const n = structuredClone(c)
    const t = n.tablets[tab]
    if (upCount(n) < 2 || t.leader < 0 || !n.up[t.leader]) {
      setFlow({ id: Date.now(), tab, ok: false, leader: -1, msg: `Tablet ${tab + 1} has no leader: only ${upCount(n)} of 3 replicas are up, and Raft needs a majority. The write is refused.` })
    } else {
      t.idx[t.leader] += 1
      ;[0, 1, 2].forEach((x) => { if (n.up[x]) t.idx[x] = t.idx[t.leader] })
      setFlow({ id: Date.now(), tab, ok: true, leader: t.leader, msg: `In this model key ${key} hashes to 0x${hash16.toString(16).padStart(4, '0')}, tablet ${tab + 1}. Leader on node ${t.leader + 1} appended entry ${t.idx[t.leader]} (term ${t.term}); a majority stored it, so it is committed.` })
    }
    setC(n); setKey((k) => k + 1)
  }
  const toggle = (x: number) => {
    const n = structuredClone(c)
    n.up[x] = !n.up[x]
    const ledBy = n.tablets.filter((t) => t.leader === x || t.leader < 0)
    // a leader that can no longer reach a majority steps down, whichever node it is on
    if (!n.up[x]) n.tablets.forEach((t) => { if (upCount(n) < 2 || t.leader === x) elect(n, t) })
    else n.tablets.forEach((t) => { if (t.leader < 0) elect(n, t); if (t.leader >= 0) t.idx[x] = t.idx[t.leader] })
    setC(n)
    setFlow({ id: Date.now(), tab: -1, ok: n.up[x], leader: -1, msg: !n.up[x]
      ? (upCount(n) >= 2 ? `Node ${x + 1} is down. ${ledBy.length ? `Tablets it led elected new leaders in a higher term (about 3 s with default heartbeat settings).` : 'It led no tablet, so only its follower copies are missing.'} 2 of 3 is still a majority.` : 'Only one node is up: no tablet has a majority, so every write stops. The minority side gives up availability to stay consistent.')
      : `Node ${x + 1} is back. It catches up from each tablet leader's log before serving as a follower.` })
  }
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-2 text-muted">primary key
          <input type="number" value={key} onChange={(e) => setKey(Math.trunc(+e.target.value || 0))} className="w-20 rounded-md border border-line bg-surface px-2 py-1 font-mono text-ink" /></label>
        <Btn primary testid="viz-next" onClick={write}>Write the row</Btn>
        {[0, 1, 2].map((x) => <Btn key={x} active={!c.up[x]} onClick={() => toggle(x)}>{c.up[x] ? `Fail node ${x + 1}` : `Recover node ${x + 1}`}</Btn>)}
        <Btn onClick={() => { setC(fresh()); setFlow(null) }}>Reset</Btn>
      </div>
      <Legend items={[['header', 'tablet leader'], ['pointer', 'follower'], ['new', 'Raft append'], ['ok', 'ack / committed'], ['dead', 'down or no majority']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin">
        <svg viewBox="0 0 640 260" className="w-full min-w-[520px]" role="img" aria-label="Three nodes holding three Raft-replicated tablets">
          {NX.map((x, n) => (
            <g key={n} opacity={c.up[n] ? 1 : 0.5}>
              <rect x={x - 95} y={12} width={190} height={236} rx={10} fill="var(--surface)" stroke={c.up[n] ? 'var(--border)' : tone('dead')} strokeDasharray={c.up[n] ? undefined : '5 4'} />
              <text x={x - 83} y={32} fontSize={12} fontWeight={700} fill="var(--text)">node {n + 1}</text>
              <text x={x + 83} y={32} textAnchor="end" fontSize={10} fill={c.up[n] ? 'var(--muted)' : tone('dead')}>{c.up[n] ? 'YB-TServer' : 'down'}</text>
            </g>
          ))}
          {c.tablets.map((t, ti) => NX.map((x, n) => {
            const lead = t.leader === n
            const tt: Tone = !c.up[n] || t.leader < 0 ? 'dead' : lead ? 'header' : 'pointer'
            const y = 46 + ti * 66
            const hot = flow && flow.tab === ti
            return (
              <motion.g key={`${ti}-${n}`} initial={false} animate={{ opacity: c.up[n] ? 1 : 0.45 }}>
                <rect x={x - 85} y={y} width={170} height={56} rx={7} fill={toneBg(tt, lead ? 22 : 10)} stroke={tone(tt)} strokeWidth={hot ? 2.2 : 1.2} />
                <text x={x - 77} y={y + 17} fontSize={11} fontWeight={700} fill="var(--text)">tablet {ti + 1} {lead ? '· leader' : ''}</text>
                <text x={x - 77} y={y + 32} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{RANGES[ti]}</text>
                <motion.text key={`${t.idx[n]}-${t.term}`} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} x={x - 77} y={y + 47} fontSize={10} fill="var(--text)" fontFamily="var(--font-mono)">term {t.term} · log {t.idx[n]}</motion.text>
              </motion.g>
            )
          }))}
          {flow?.ok && flow.tab >= 0 && [0, 1, 2].filter((n) => n !== flow.leader && c.up[n]).map((n, k) => {
            const y = 46 + flow.tab * 66 + 28
            return <g key={`${flow.id}-${n}`}>
              <Packet x1={NX[flow.leader]} y1={y} x2={NX[n]} y2={y} t="new" delay={k * 0.1} />
              <Packet x1={NX[n]} y1={y + 8} x2={NX[flow.leader]} y2={y + 8} t="ok" delay={0.7 + k * 0.1} />
            </g>
          })}
        </svg>
      </div>
      <div className="min-h-[44px] rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
        <motion.p key={flow?.id ?? 0} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Md>{flow?.msg ?? 'Write a row: its primary key is hashed into a 16-bit space (0x0000–0xFFFF) split into tablets. Then fail nodes one at a time.'}</Md></motion.p>
      </div>
    </div>
  )
}

/* ---- multi-master conflict lab ---- */

type Res = 'last_update_wins' | 'keep_local' | 'apply_remote' | 'error' | 'delta'
interface CS { a: number; b: number; aNote?: string; bNote?: string; wire: 'none' | 'out' | 'stuck'; verdict?: string; vt?: Tone }

function conflictSteps(op: 'set' | 'inc', res: Res, skew: number): Step<CS>[] {
  const aNew = 150, bNew = 120
  const tsA = 0, tsB = 3 + skew // B commits 3 ms after A in real time; its clock is off by `skew`
  const fmtTs = (ms: number) => `12:00:00.${String(100 + ms).padStart(3, '0')}`
  const later = tsB > tsA ? 'B' : 'A'
  let fa = aNew, fb = bNew, verdict = '', vt: Tone = 'ok'
  if (res === 'last_update_wins') {
    fa = fb = later === 'B' ? bNew : aNew
    verdict = `Both nodes keep node ${later}'s row (commit ${later === 'B' ? fmtTs(tsB) : fmtTs(tsA)}). They agree${op === 'inc' ? `, but one increment is **lost**: 170 was expected` : ''}.`
    vt = op === 'inc' ? 'dead' : 'ok'
    if (skew < -3) verdict += ' B really wrote last, yet its slow clock made A win.'
  } else if (res === 'keep_local') { verdict = 'Each node keeps its own row: the nodes have **diverged** and will stay different until someone repairs them.'; vt = 'dead' }
  else if (res === 'apply_remote') { fa = bNew; fb = aNew; verdict = 'Each node takes the incoming row: the values swap and the nodes **diverge**.'; vt = 'dead' }
  else if (res === 'error') { verdict = 'Apply stops with an error on both nodes. Replication is halted until an operator fixes or skips the change.'; vt = 'dead' }
  else { fa = fb = 100 + (aNew - 100) + (bNew - 100); verdict = op === 'inc' ? 'Each node applies the other\'s **difference** (+50, +20): both end at 170 and no increment is lost.' : 'Delta-apply adds differences: right for counters, wrong for this overwrite, where 170 is a value nobody wrote.'; vt = op === 'inc' ? 'ok' : 'new' }
  const what = op === 'inc' ? ['balance + 50', 'balance + 20'] : ['balance = 150', 'balance = 120']
  return [
    { title: 'Same row on two writable nodes', body: 'Account 1 has balance 100 on node A and node B. Both nodes accept writes and replicate to each other asynchronously.', state: { a: 100, b: 100, wire: 'none' } },
    { title: 'Concurrent local commits', body: `A runs \`${what[0]}\` and commits at ${fmtTs(tsA)} by its clock. 3 ms later B runs \`${what[1]}\` and commits at ${fmtTs(tsB)} by its own clock. Neither has seen the other's change.`,
      state: { a: aNew, b: bNew, aNote: `commit ${fmtTs(tsA)}`, bNote: `commit ${fmtTs(tsB)}`, wire: 'none' } },
    { title: 'The changes cross', body: 'Each node receives the other\'s new row, plus its old values. Both rows exist locally with a different value and origin: an update/update conflict (PostgreSQL 18 calls it **update_origin_differs**).',
      state: { a: aNew, b: bNew, aNote: 'incoming: 120 from B', bNote: 'incoming: 150 from A', wire: 'out' } },
    { title: `Resolve with ${res === 'delta' ? 'delta-apply' : res}`, body: verdict, state: { a: fa, b: fb, wire: res === 'error' ? 'stuck' : 'none', verdict, vt } },
  ]
}

function ConflictLab() {
  const [op, setOp] = useState<'set' | 'inc'>('inc')
  const [res, setRes] = useState<Res>('last_update_wins')
  const [skew, setSkew] = useState(0)
  const steps = conflictSteps(op, res, skew)
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap gap-2">
        <Segmented label="operation" value={op} onChange={setOp} options={[['inc', 'Both increment'], ['set', 'Both overwrite']]} />
        <div className="overflow-x-auto scrollbar-thin"><Segmented label="conflict resolution" value={res} onChange={setRes} options={[['last_update_wins', 'last_update_wins'], ['keep_local', 'keep_local'], ['apply_remote', 'apply_remote'], ['error', 'error'], ['delta', 'delta-apply']]} /></div>
      </div>
      <Slider label="node B's clock offset" value={skew} min={-10} max={10} onChange={setSkew} show={`${skew > 0 ? '+' : ''}${skew} ms`} />
      <Stepper steps={steps} interval={2600} render={(s, i) => (
        <div className="grid gap-3 [&>*]:min-w-0">
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin">
            <svg viewBox="0 0 640 170" className="w-full min-w-[480px]" role="img" aria-label="Two writable nodes exchanging conflicting changes">
              {([['A', 150, s.a, s.aNote], ['B', 490, s.b, s.bNote]] as const).map(([n, x, v, note]) => {
                const t: Tone = s.verdict ? (s.a === s.b ? 'ok' : 'dead') : 'tuple'
                return (
                  <g key={n}>
                    <rect x={x - 110} y={30} width={220} height={110} rx={10} fill={toneBg(t, 12)} stroke={tone(t)} strokeWidth={1.5} />
                    <text x={x} y={52} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">node {n}</text>
                    <text x={x} y={72} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">accounts id = 1</text>
                    <motion.text key={`${n}-${v}-${i}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} x={x} y={104} textAnchor="middle" fontSize={24} fontWeight={800} fill="var(--text)" fontFamily="var(--font-mono)">{v}</motion.text>
                    {note && <text x={x} y={128} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{note}</text>}
                  </g>
                )
              })}
              <line x1={262} x2={378} y1={70} y2={70} stroke="var(--border)" strokeWidth={2} />
              <line x1={262} x2={378} y1={100} y2={100} stroke="var(--border)" strokeWidth={2} />
              {s.wire === 'out' && <><Packet key={`ab${i}`} x1={262} y1={70} x2={378} y2={70} t="new" dur={0.9} /><Packet key={`ba${i}`} x1={378} y1={100} x2={262} y2={100} t="new" dur={0.9} /></>}
              {s.wire === 'stuck' && <text x={320} y={90} textAnchor="middle" fontSize={11} fontWeight={700} fill={tone('dead')}>apply stopped</text>}
              <text x={320} y={160} textAnchor="middle" fontSize={10.5} fill="var(--muted)">expected if no update were lost: {op === 'inc' ? '170' : 'one of 150 or 120, the same on both'}</text>
            </svg>
          </div>
          {s.verdict && <Panel title="Result"><p className="text-sm" style={{ color: tone.text(s.vt ?? 'ok') }}><Md>{s.a === s.b ? `Converged at ${s.a}.` : `Diverged: A = ${s.a}, B = ${s.b}.`}</Md></p></Panel>}
        </div>
      )} />
    </div>
  )
}

function YsqlIsolation() {
  const [rc, setRc] = useState(false)
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Segmented label="yb_enable_read_committed_isolation" value={rc ? 'on' : 'off'} onChange={(v) => setRc(v === 'on')}
        options={[['off', 'yb_enable_read_committed_isolation = false'], ['on', '= true']]} />
      <Panel title="What you ask for → what YSQL runs">
        <FieldTable rows={[
          ['READ UNCOMMITTED', <motion.b key={`ru-${rc}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: tone.text(rc ? 'ok' : 'dead') }}>{rc ? 'Read Committed' : 'Snapshot'}</motion.b>, 'treated like READ COMMITTED'],
          ['READ COMMITTED', <motion.b key={String(rc)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: tone.text(rc ? 'ok' : 'dead') }}>{rc ? 'Read Committed' : 'Snapshot'}</motion.b>, rc ? 'statement snapshot, like PostgreSQL' : 'conflicts abort with 40001: retry'],
          ['REPEATABLE READ', 'Snapshot', 'no phantoms'],
          ['SERIALIZABLE', 'Serializable', 'reads also write provisional records'],
        ]} />
      </Panel>
      <p className="text-xs text-muted"><Md>{'Read Committed is the default for **new universes from v2025.2**; older or manual deployments must set the flag. Wait-on-conflict (`enable_wait_queues`) is on by default since v2024.1. YSQL is rebased on **PostgreSQL 15** from v2025.1.'}</Md></p>
    </div>
  )
}

function DsqlViz() {
  const [tab, setTab] = useState<'raft' | 'mm' | 'iso'>('raft')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Segmented label="view" value={tab} onChange={setTab} options={[['raft', 'Raft tablets'], ['mm', 'Multi-master conflict'], ['iso', 'YSQL isolation']]} />
      {tab === 'raft' ? <RaftViz /> : tab === 'mm' ? <ConflictLab /> : <YsqlIsolation />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `${TRY_SQL}

-- Two schemas stand in for two writable nodes of an active-active pair
CREATE SCHEMA node_a;
CREATE SCHEMA node_b;
CREATE TABLE node_a.accounts (id int PRIMARY KEY, owner text NOT NULL, balance int NOT NULL);
CREATE TABLE node_b.accounts (id int PRIMARY KEY, owner text NOT NULL, balance int NOT NULL);
INSERT INTO node_a.accounts VALUES (1, 'ana', 100), (2, 'bo', 40);
INSERT INTO node_b.accounts VALUES (1, 'ana', 100), (2, 'bo', 40);

-- what each node would send to the other: old and new value plus the local transaction id
CREATE TABLE change_log (seq bigint GENERATED ALWAYS AS IDENTITY, origin text, id int, old_balance int, new_balance int, xid xid8);
CREATE FUNCTION log_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO change_log (origin, id, old_balance, new_balance, xid)
  VALUES (TG_TABLE_SCHEMA, NEW.id, OLD.balance, NEW.balance, pg_current_xact_id());
  RETURN NEW;
END $$;
CREATE TRIGGER log_a AFTER UPDATE ON node_a.accounts FOR EACH ROW EXECUTE FUNCTION log_change();
CREATE TRIGGER log_b AFTER UPDATE ON node_b.accounts FOR EACH ROW EXECUTE FUNCTION log_change();`

export const lesson: Lesson = {
  slug: 'distributed-sql-multimaster',
  module: 'e3',
  order: 5,
  title: 'Distributed SQL and multi-master',
  tldr: [
    '**Distributed SQL** systems such as YugabyteDB put a PostgreSQL-derived query layer on top of a sharded store where every shard (a **tablet**) is replicated with **Raft**, while **multi-master** systems such as EDB PGD and pgEdge Spock let every PostgreSQL node accept writes and replicate them to the others asynchronously.',
    'Both remove the single primary, but the first pays with a consensus round trip on every write and the second with **conflicts** that must be resolved after commit.',
  ],
  visualizer: {
    title: 'Raft tablets and a multi-master conflict',
    caption: 'Write rows and fail nodes to watch tablet leaders move. Then make two nodes change the same row and pick a conflict resolution rule and a clock offset.',
    Component: DsqlViz,
  },
  playground: {
    config: ['track_commit_timestamp = on'],
    setup: SETUP,
    presets: [
      { label: 'Both nodes change the same row', sql: `UPDATE node_a.accounts SET balance = balance + 50 WHERE id = 1;
UPDATE node_b.accounts SET balance = balance + 20 WHERE id = 1;

SELECT origin, id, old_balance, new_balance, xid::text,
       pg_xact_commit_timestamp(xid::text::xid)::text AS committed_at
FROM change_log ORDER BY seq;`,
        note: 'Each node read 100 and committed its own change. The log shows what each would replicate: old value, new value and a commit timestamp (`track_commit_timestamp = on`). This models two nodes with two schemas on one server.' },
      { label: 'Last update wins', sql: `SELECT DISTINCT ON (id) id, origin AS winner, new_balance AS converged_balance,
       pg_xact_commit_timestamp(xid::text::xid)::text AS winning_commit,
       100 + 50 + 20 AS expected_if_nothing_lost
FROM change_log
ORDER BY id, pg_xact_commit_timestamp(xid::text::xid) DESC, origin DESC;`,
        note: 'The later commit timestamp wins on both nodes, so they agree on 120, and the +50 from node A is gone. That is the **lost update** of last-update-wins. The tie-breaker on origin covers equal timestamps.' },
      { label: 'Delta-apply: replicate the difference', sql: `SET session_replication_role = replica;  -- apply mode: ordinary triggers do not fire
UPDATE node_a.accounts a SET balance = a.balance + (l.new_balance - l.old_balance)
FROM change_log l WHERE l.origin = 'node_b' AND l.id = a.id;
UPDATE node_b.accounts b SET balance = b.balance + (l.new_balance - l.old_balance)
FROM change_log l WHERE l.origin = 'node_a' AND l.id = b.id;
RESET session_replication_role;

SELECT 'node_a' AS node, * FROM node_a.accounts WHERE id = 1
UNION ALL SELECT 'node_b', * FROM node_b.accounts WHERE id = 1;`,
        note: 'Each node adds the other\'s difference instead of copying its value: both reach 170. `session_replication_role = replica` is how an apply worker keeps triggers from logging the replicated change again.' },
      { label: 'Different columns, same row', sql: `UPDATE node_a.accounts SET owner = 'bo k.' WHERE id = 2;   -- node A renames
UPDATE node_b.accounts SET balance = 55 WHERE id = 2;       -- node B changes the balance

WITH newest AS (
  SELECT origin FROM change_log WHERE id = 2
  ORDER BY pg_xact_commit_timestamp(xid::text::xid) DESC, origin DESC LIMIT 1
)
SELECT 'row level: newest row wins' AS resolution, r.owner, r.balance
FROM newest n, LATERAL (
  SELECT owner, balance FROM node_a.accounts WHERE id = 2 AND n.origin = 'node_a'
  UNION ALL
  SELECT owner, balance FROM node_b.accounts WHERE id = 2 AND n.origin = 'node_b') r
UNION ALL
SELECT 'column level: newest value per column', a.owner, b.balance
FROM node_a.accounts a JOIN node_b.accounts b USING (id) WHERE id = 2;`,
        note: 'The two nodes touched **different** columns, yet a row-level rule keeps one whole row: the later balance survives and the rename is lost (`bo`, 55). Tracking a change time per column merges both edits (`bo k.`, 55). EDB PGD resolves per row by default and can switch a table to column-level detection, which needs `REPLICA IDENTITY FULL`.' },
      { label: 'A unique key on two nodes', sql: `CREATE TABLE node_a.users (id bigint PRIMARY KEY, email text UNIQUE);
CREATE TABLE node_b.users (id bigint PRIMARY KEY, email text UNIQUE);
INSERT INTO node_a.users VALUES (1001, 'sam@example.com');
INSERT INTO node_b.users VALUES (2001, 'sam@example.com');

SELECT a.email, a.id AS id_on_a, b.id AS id_on_b
FROM node_a.users a JOIN node_b.users b USING (email);

SELECT column_name FROM information_schema.columns
WHERE table_name = 'pg_stat_subscription_stats' AND column_name LIKE 'confl%' ORDER BY ordinal_position;`,
        note: 'Both inserts succeed locally. When A\'s row arrives at B, the email already exists with another id. PostgreSQL 18 counts such cases per subscription as `confl_insert_exists`, `confl_update_origin_differs` and five more.' },
      { label: 'Replication needs a row identity', sql: `CREATE TABLE node_a.events (at timestamptz, kind text);
INSERT INTO node_a.events VALUES (now(), 'login');
CREATE PUBLICATION mm_pub FOR TABLE node_a.accounts, node_a.events;

SELECT try_sql($$UPDATE node_a.events SET kind = 'logout'$$) AS update_without_key;
SELECT try_sql($$UPDATE node_a.accounts SET owner = 'ana b.' WHERE id = 1$$) AS update_with_key;`,
        note: 'A table without a primary key cannot publish UPDATE or DELETE, so the error comes from the publishing node itself. Multi-master tools need a primary key on every replicated table to match rows at all.' },
      { label: 'Hash ranges into tablets', sql: `CREATE TABLE orders_yb AS SELECT g AS id FROM generate_series(1, 3000) g;

SELECT CASE WHEN h < 21845 THEN 'tablet 1 (0x0000-0x5554)'
            WHEN h < 43690 THEN 'tablet 2 (0x5555-0xAAA9)'
            ELSE 'tablet 3 (0xAAAA-0xFFFF)' END AS tablet,
       count(*) AS rows
FROM (SELECT hashint4(id) & 65535 AS h FROM orders_yb) s
GROUP BY 1 ORDER BY 1;`,
        note: 'YugabyteDB hashes the first primary key column into 0x0000–0xFFFF and gives each tablet one slice, as `SPLIT INTO 3 TABLETS` would. This uses PostgreSQL\'s own hash as a stand-in, so the counts show the idea, not YugabyteDB\'s exact placement.' },
    ],
  },
  production: {
    title: 'Two regions, one wallet table',
    context: 'A consumer app runs in two regions and wants local writes in both, so it evaluates active-active PostgreSQL with Spock.',
    problem: 'A test with last-update-wins lost balance top-ups whenever a user\'s phone and a scheduled job changed the same wallet in different regions within a second, exactly the counter case.',
    solution: 'Home each user to one region for writes so most rows have one writer. Turn the remaining counters into delta-apply columns, enable commit timestamps, use globally unique ids, and keep NTP tight because "last" is decided by clocks. Tables that need strict invariants stay single-writer.',
    sql: `-- postgresql.conf on every node
--   wal_level = logical
--   track_commit_timestamp = on
--   shared_preload_libraries = 'spock'
--   spock.save_resolutions = on        -- log every resolution to spock.resolutions
ALTER SYSTEM SET spock.conflict_resolution = 'last_update_wins';

-- counters replicate their difference, not their value (column must be NOT NULL)
ALTER TABLE wallets ALTER COLUMN balance
  SET (log_old_value = true, delta_apply_function = spock.delta_apply);

-- find conflicts that were resolved automatically
SELECT * FROM spock.resolutions LIMIT 20;`,
    outcome: 'Concurrent top-ups now add up on both nodes, and the few remaining overwrite conflicts are visible in the resolutions log instead of silently lost.',
  },
  pitfalls: [
    { title: 'Last-update-wins on counters',
      symptom: 'Balances or stock counts drift below what the transactions add up to, with no error anywhere.',
      cause: 'Two nodes read the same value and each wrote its own result. Resolving by commit timestamp keeps one row and discards the other change.',
      fix: 'Write each counter on one node only, or use delta-apply columns (Spock), conflict-free replicated data types (EDB PGD ships counters such as `bdr.crdt_pncounter` and `bdr.crdt_delta_counter`), or an append-only ledger summed on read.',
      sql: `-- EDB PGD: a counter column that merges concurrent increments
ALTER TABLE wallets REPLICA IDENTITY FULL;
SELECT bdr.alter_table_conflict_detection('wallets', 'column_modify_timestamp', 'cts');
ALTER TABLE wallets ADD COLUMN top_ups bdr.crdt_delta_counter NOT NULL DEFAULT 0;` },
    { title: 'Clock skew deciding the winner',
      symptom: 'An older change overwrites a newer one after a conflict.',
      cause: 'Last-update-wins compares commit timestamps from different machines. A node whose clock runs behind loses even when it wrote last.',
      fix: 'Keep clocks synchronized tightly, monitor skew, and do not rely on last-update-wins for data where order matters.' },
    { title: 'Foreign keys and uniqueness during apply',
      symptom: 'Child rows reference parents that do not exist on another node, or the same email shows up twice across nodes.',
      cause: 'Each node checks constraints only against its own rows when it commits. Spock does not enforce foreign keys while applying remote changes, and unique conflicts are resolved by rule.',
      fix: 'Route writes for one entity to one node, use global id generators (snowflake-style sequences or UUIDs), and audit cross-node uniqueness regularly.' },
    { title: 'Treating distributed SQL as plain PostgreSQL',
      symptom: 'After moving to YugabyteDB, simple single-row workloads are fine but joins and new connections are slow, and some transactions fail with `40001`.',
      cause: 'Multi-tablet queries need RPCs between nodes, a new connection loads the catalog over the network, and isolation may run as Snapshot when Read Committed is not enabled.',
      fix: 'Keep hot transactions on one tablet (filter by the full hash key), colocate small tables, use a connection pooler, enable Read Committed and wait queues, and retry `40001`.',
      sql: `CREATE TABLE orders (customer_id int, order_id int, total numeric,
  PRIMARY KEY ((customer_id) HASH, order_id ASC)) SPLIT INTO 12 TABLETS;` },
  ],
  pointers: [
    'YugabyteDB: YSQL reuses PostgreSQL\'s query layer over **DocDB**; tables split into **tablets**, each a **Raft** group with one leader. A write commits on a majority; a lost leader is replaced within seconds (about 3 s with default heartbeat settings).',
    'Hash sharding uses a 16-bit space **0x0000–0xFFFF**, and by default only the first primary key column is hashed. Range sharding (`ASC`/`DESC`) suits range scans but risks hot spots.',
    'Multi-master (PGD, Spock) commits locally and replicates later, so conflicts are detected on apply, for example (in PostgreSQL 18 terms) insert_exists, update_origin_differs, delete_missing. Stock PostgreSQL can replicate both ways with two subscriptions created `WITH (origin = none)` so changes do not loop back; it detects and logs conflicts (18) but does not resolve them, which is what PGD and Spock add.',
    'Resolution rules (`last_update_wins`, `keep_local`, `apply_remote`, `error`) trade correctness for availability; delta-apply fixes counters; global sequences fix ids. See [logical replication](/m7/logical-replication) for the building block.',
    'Use multi-master only for simple, partitionable write patterns; use distributed SQL when you need strong consistency across regions and can pay the write latency. Paxos, Raft and their failure cases: [distributed transactions and consensus](/e5/commit-and-consensus).',
  ],
  sources: ['logical-replication-conflicts.html', 'logical-replication-publication.html', 'runtime-config-replication.html', 'runtime-config-client.html', 'functions-info.html', 'transaction-iso.html'],
}
