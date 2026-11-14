import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Md } from '../../lesson/Md'
import { Arrows, Btn, Slider, TRY_SQL } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1: two-phase commit as a sequence diagram (coordinator + two PostgreSQL participants),
 * following PREPARE TRANSACTION / COMMIT PREPARED / ROLLBACK PREPARED semantics, including the
 * blocking case where the coordinator dies after PREPARE.
 * Visualizer 2: a hybrid logical clock (physical, logical) on two nodes with clock skew.
 * Visualizer 3: what changes across nodes (sequences, unique, FKs, isolation, atomic commit).
 * ---------------------------------------------------------------------------------------------- */

type PS = 'idle' | 'active' | 'prepared' | 'committed' | 'aborted'
type CS = 'idle' | 'active' | 'deciding' | 'committed' | 'aborted' | 'down' | 'recovering'
interface Msg { from: 0 | 1 | 2; to: 0 | 1 | 2; label: string; t: Tone }
interface TS { coord: CS; parts: [PS, PS]; rows: Msg[][]; xacts: string[]; log: string; blocked?: boolean }

const LANES = [110, 330, 540]
const LANE_NAMES = ['coordinator', 'worker 1', 'worker 2']
const PT: Record<PS, Tone> = { idle: 'muted', active: 'new', prepared: 'header', committed: 'ok', aborted: 'dead' }
const CT: Record<CS, Tone> = { idle: 'muted', active: 'new', deciding: 'header', committed: 'ok', aborted: 'dead', down: 'dead', recovering: 'new' }

const begin: Msg[] = [{ from: 0, to: 1, label: 'UPDATE id=1 bal-30', t: 'new' }, { from: 0, to: 2, label: 'UPDATE id=2 bal+30', t: 'new' }]
const prep: Msg[] = [{ from: 0, to: 1, label: "PREPARE 'xfer-42:w1'", t: 'header' }, { from: 0, to: 2, label: "PREPARE 'xfer-42:w2'", t: 'header' }]
const votes: Msg[] = [{ from: 1, to: 0, label: 'prepared', t: 'ok' }, { from: 2, to: 0, label: 'prepared', t: 'ok' }]
const commitP: Msg[] = [{ from: 0, to: 1, label: "COMMIT PREPARED 'xfer-42:w1'", t: 'ok' }, { from: 0, to: 2, label: "COMMIT PREPARED 'xfer-42:w2'", t: 'ok' }]
const BOTH = ["xfer-42:w1 · worker 1", "xfer-42:w2 · worker 2"]

const SCEN: Record<'commit' | 'no' | 'crash', Step<TS>[]> = {
  commit: [
    { title: 'Do the work on both nodes', body: 'The coordinator opens a transaction on each participant and runs its part. Each worker now holds a **row lock** on the row it changed.',
      state: { coord: 'active', parts: ['active', 'active'], rows: [begin], xacts: [], log: '—' } },
    { title: 'Phase 1: PREPARE TRANSACTION', body: 'Each worker writes its transaction state to disk and promises it can commit, even after a crash. The work stays invisible and is now detached from any session.',
      state: { coord: 'active', parts: ['prepared', 'prepared'], rows: [begin, prep], xacts: BOTH, log: '—' } },
    { title: 'Both vote yes', body: 'Both replies say **prepared**. Until now either side could still abort. From here on, nobody may abort without the coordinator.',
      state: { coord: 'deciding', parts: ['prepared', 'prepared'], rows: [begin, prep, votes], xacts: BOTH, log: '—' } },
    { title: 'The commit point: log the decision', body: 'The coordinator records **commit xfer-42** durably before telling anyone. This record, not any worker, decides the outcome if something crashes later.',
      state: { coord: 'committed', parts: ['prepared', 'prepared'], rows: [begin, prep, votes], xacts: BOTH, log: 'xfer-42 = commit' } },
    { title: 'Phase 2: COMMIT PREPARED', body: 'Each worker commits its prepared transaction, releases its locks, and the rows become visible. `pg_prepared_xacts` is empty again.',
      state: { coord: 'committed', parts: ['committed', 'committed'], rows: [begin, prep, votes, commitP], xacts: [], log: 'xfer-42 = commit' } },
  ],
  no: [
    { title: 'Do the work on both nodes', body: 'Same start: each participant runs its part and holds a row lock.',
      state: { coord: 'active', parts: ['active', 'active'], rows: [begin], xacts: [], log: '—' } },
    { title: 'Worker 2 cannot prepare', body: 'A deferred constraint fails or the disk is full. A failed `PREPARE TRANSACTION` **becomes a ROLLBACK**, so worker 2 has already aborted its part.',
      state: { coord: 'active', parts: ['prepared', 'aborted'], rows: [begin, prep, [{ from: 1, to: 0, label: 'prepared', t: 'ok' }, { from: 2, to: 0, label: 'ERROR → rolled back', t: 'dead' }]], xacts: [BOTH[0]], log: '—' } },
    { title: 'Decide abort', body: 'One "no" vote is enough. The coordinator logs **abort** and tells the workers that did prepare to undo their part.',
      state: { coord: 'aborted', parts: ['aborted', 'aborted'], rows: [begin, prep, [{ from: 1, to: 0, label: 'prepared', t: 'ok' }, { from: 2, to: 0, label: 'ERROR → rolled back', t: 'dead' }], [{ from: 0, to: 1, label: "ROLLBACK PREPARED 'xfer-42:w1'", t: 'dead' }]], xacts: [], log: 'xfer-42 = abort' } },
    { title: 'All or nothing', body: 'Neither balance changed. The client gets an error and can retry the whole transfer. Atomicity held across two machines.',
      state: { coord: 'aborted', parts: ['aborted', 'aborted'], rows: [begin, prep, [{ from: 1, to: 0, label: 'prepared', t: 'ok' }, { from: 2, to: 0, label: 'ERROR → rolled back', t: 'dead' }], [{ from: 0, to: 1, label: "ROLLBACK PREPARED 'xfer-42:w1'", t: 'dead' }]], xacts: [], log: 'xfer-42 = abort' } },
  ],
  crash: [
    { title: 'Both participants are prepared', body: 'Phase 1 succeeded: both workers voted yes, and the coordinator logged **commit**.',
      state: { coord: 'committed', parts: ['prepared', 'prepared'], rows: [begin, prep, votes], xacts: BOTH, log: 'xfer-42 = commit' } },
    { title: 'The coordinator dies', body: 'It crashes before sending `COMMIT PREPARED`. The workers are now **in doubt**: they promised to commit if told, and must not decide alone.',
      state: { coord: 'down', parts: ['prepared', 'prepared'], rows: [begin, prep, votes], xacts: BOTH, log: 'xfer-42 = commit' } },
    { title: 'Locks with no owner', body: 'The prepared transactions keep their row locks, with **no backend** behind them (`pid` is NULL in `pg_locks`). Any session that updates row 1 or 2 waits, and VACUUM cannot advance past their xid.',
      state: { coord: 'down', parts: ['prepared', 'prepared'], rows: [begin, prep, votes, [{ from: 1, to: 1, label: 'UPDATE id=1 … waits', t: 'dead' }]], xacts: BOTH, log: 'xfer-42 = commit', blocked: true } },
    { title: 'Recovery reads the log', body: 'The restarted coordinator (or an operator) lists `pg_prepared_xacts` on each worker and looks each GID up in its decision log. **commit** was logged, so it finishes the job.',
      state: { coord: 'recovering', parts: ['prepared', 'prepared'], rows: [begin, prep, votes, [{ from: 0, to: 1, label: 'SELECT gid FROM pg_prepared_xacts', t: 'pointer' }, { from: 0, to: 2, label: 'SELECT gid FROM pg_prepared_xacts', t: 'pointer' }]], xacts: BOTH, log: 'xfer-42 = commit' } },
    { title: 'Phase 2, late but complete', body: '`COMMIT PREPARED` works from **any session**. Had no decision been logged, the safe rule is the reverse: `ROLLBACK PREPARED` everything.',
      state: { coord: 'committed', parts: ['committed', 'committed'], rows: [begin, prep, votes, [{ from: 0, to: 1, label: 'SELECT gid FROM pg_prepared_xacts', t: 'pointer' }, { from: 0, to: 2, label: 'SELECT gid FROM pg_prepared_xacts', t: 'pointer' }], commitP], xacts: [], log: 'xfer-42 = commit' } },
  ],
}

function Sequence({ s, i }: { s: TS; i: number }) {
  const ROW = 30, Y0 = 70
  const flat = s.rows.flatMap((r, ri) => r.map((m, mi) => ({ m, ri, y: Y0 + (ri * 2 + mi) * ROW / 1.15 })))
  const H = Math.max(260, Y0 + s.rows.length * 2 * ROW / 1.15 + 20)
  const states: (PS | CS)[] = [s.coord, ...s.parts]
  return (
    <svg viewBox={`0 0 640 ${H}`} className="w-full min-w-[540px]" role="img" aria-label="Two-phase commit sequence diagram">
      <Arrows tones={['new', 'header', 'ok', 'dead', 'pointer']} />
      {LANES.map((x, k) => {
        const st = states[k]
        const t = k === 0 ? CT[st as CS] : PT[st as PS]
        return (
          <g key={k}>
            <line x1={x} x2={x} y1={52} y2={H - 6} stroke="var(--border)" strokeWidth={2} strokeDasharray={k === 0 && s.coord === 'down' ? '4 5' : undefined} />
            <rect x={x - 70} y={8} width={140} height={40} rx={8} fill={toneBg(t, 18)} stroke={tone(t)} strokeWidth={1.5} />
            <text x={x} y={24} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--text)">{LANE_NAMES[k]}</text>
            <motion.text key={st} initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={x} y={40} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill={tone(t)}>{st}</motion.text>
          </g>
        )
      })}
      {flat.map(({ m, ri, y }, k) => {
        const x1 = LANES[m.from], x2 = LANES[m.to]
        const latest = ri === s.rows.length - 1
        const self = m.from === m.to
        const mid = (x1 + x2) / 2
        return (
          <g key={`${k}-${m.label}`} opacity={latest ? 1 : 0.55}>
            {self
              ? <motion.circle cx={x1} cy={y} r={6} fill={toneBg('dead', 40)} stroke={tone('dead')} initial={{ scale: 0 }} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} />
              : <motion.line key={`${i}-${k}`} x1={x1} y1={y} y2={y} stroke={tone(m.t)} strokeWidth={latest ? 2 : 1.4} markerEnd={`url(#e3-arrow-${m.t})`}
                  initial={latest ? { x2: x1 } : false} animate={{ x2: x2 + (x2 > x1 ? -4 : 4) }} transition={{ duration: 0.6, delay: (k % 2) * 0.15 }} />}
            <text x={self ? x1 + 12 : mid} y={y - 5} textAnchor={self ? 'start' : 'middle'} fontSize={9.5} fontFamily="var(--font-mono)" fill="var(--text)">{m.label}</text>
          </g>
        )
      })}
      {s.coord === 'down' && <text x={LANES[0]} y={H - 14} textAnchor="middle" fontSize={11} fontWeight={700} fill={tone('dead')}>crashed</text>}
    </svg>
  )
}

function TwoPC() {
  const [sc, setSc] = useState<'commit' | 'no' | 'crash'>('commit')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Segmented label="scenario" value={sc} onChange={setSc} options={[['commit', 'Both commit'], ['no', 'One votes no'], ['crash', 'Coordinator dies']]} />
      <Stepper key={sc} steps={SCEN[sc]} interval={3000} render={(s, i) => (
        <div className="grid gap-3 [&>*]:min-w-0">
          <Legend items={[['new', 'work / in progress'], ['header', 'prepare / prepared'], ['ok', 'commit'], ['dead', 'abort / blocked'], ['pointer', 'recovery query']]} />
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin"><Sequence s={s} i={i} /></div>
          <div className="grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
            <Panel title="pg_prepared_xacts (both workers)">
              {s.xacts.length === 0 ? <p className="font-mono text-xs text-muted">(0 rows)</p>
                : <div className="grid gap-1">{s.xacts.map((x) => <motion.p key={x} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded border px-2 py-1 font-mono text-xs" style={{ borderColor: tone('header'), background: toneBg('header', 12) }}>{x}</motion.p>)}</div>}
              {s.blocked && <p className="mt-2 text-xs" style={{ color: tone.text('dead') }}><Md>{'Probe locked rows only with `FOR UPDATE NOWAIT` or `SKIP LOCKED`; a plain UPDATE waits until someone resolves the GID.'}</Md></p>}
            </Panel>
            <Panel title="Coordinator decision log">
              <p className="font-mono text-sm">{s.log}</p>
              <p className="mt-1 text-xs text-muted"><Md>{'Written **before** phase 2. Without it, a restarted coordinator cannot tell "decided commit" from "never decided".'}</Md></p>
            </Panel>
          </div>
        </div>
      )} />
    </div>
  )
}

/* ---- hybrid logical clock lab ---- */

interface Hlc { l: number; c: number }
interface Ev { n: number; node: 'A' | 'B'; kind: string; pt: number; h: Hlc; cause?: number; anomaly?: boolean }
const fmt = (h: Hlc) => `(${h.l}, ${h.c})`

function HlcLab() {
  const [skew, setSkew] = useState(8)
  const [real, setReal] = useState(1000)
  const [a, setA] = useState<Hlc>({ l: 0, c: 0 })
  const [b, setB] = useState<Hlc>({ l: 0, c: 0 })
  const [evs, setEvs] = useState<Ev[]>([])
  const [inflight, setInflight] = useState<{ from: 'A' | 'B'; h: Hlc; pt: number; n: number } | null>(null)
  const pt = (node: 'A' | 'B', r: number) => (node === 'A' ? r : r - skew)
  const tick = (h: Hlc, p: number): Hlc => { const l = Math.max(h.l, p); return { l, c: l === h.l ? h.c + 1 : 0 } }
  const recv = (h: Hlc, m: Hlc, p: number): Hlc => {
    const l = Math.max(h.l, m.l, p)
    const c = l === h.l && l === m.l ? Math.max(h.c, m.c) + 1 : l === h.l ? h.c + 1 : l === m.l ? m.c + 1 : 0
    return { l, c }
  }
  const push = (e: Omit<Ev, 'n'>) => setEvs((x) => [...x.slice(-7), { ...e, n: (x[x.length - 1]?.n ?? 0) + 1 }])
  const local = (node: 'A' | 'B') => {
    const r = real + 1; setReal(r)
    const p = pt(node, r)
    const h = tick(node === 'A' ? a : b, p)
    if (node === 'A') setA(h); else setB(h)
    push({ node, kind: 'local write', pt: p, h })
  }
  const send = (from: 'A' | 'B') => {
    const r = real + 1; setReal(r)
    const p = pt(from, r)
    const h = tick(from === 'A' ? a : b, p)
    if (from === 'A') setA(h); else setB(h)
    const n = (evs[evs.length - 1]?.n ?? 0) + 1
    push({ node: from, kind: `send → ${from === 'A' ? 'B' : 'A'}`, pt: p, h })
    setInflight({ from, h, pt: p, n })
  }
  const deliver = () => {
    if (!inflight) return
    const to = inflight.from === 'A' ? 'B' : 'A'
    const r = real + 1; setReal(r)
    const p = pt(to, r)
    const h = recv(to === 'A' ? a : b, inflight.h, p)
    if (to === 'A') setA(h); else setB(h)
    push({ node: to, kind: `receive from ${inflight.from}`, pt: p, h, cause: inflight.n, anomaly: p <= inflight.pt })
    setInflight(null)
  }
  const reset = () => { setReal(1000); setA({ l: 0, c: 0 }); setB({ l: 0, c: 0 }); setEvs([]); setInflight(null) }
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Slider label="node B's clock is behind by" value={skew} min={0} max={30} onChange={(v) => { setSkew(v); reset() }} show={`${skew} ms`} />
        <Btn onClick={reset}>Reset</Btn>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => local('A')}>Write on A</Btn>
        <Btn primary onClick={() => send('A')} disabled={!!inflight}>A sends to B</Btn>
        <Btn onClick={() => send('B')} disabled={!!inflight}>B sends to A</Btn>
        <Btn onClick={deliver} disabled={!inflight} active={!!inflight}>Deliver message</Btn>
        <Btn onClick={() => local('B')}>Write on B</Btn>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(['A', 'B'] as const).map((n) => (
          <div key={n} className="rounded-lg border p-2" style={{ borderColor: tone(n === 'A' ? 'tuple' : 'pointer'), background: toneBg(n === 'A' ? 'tuple' : 'pointer', 8) }}>
            <p className="text-xs font-bold">node {n}</p>
            <p className="font-mono text-xs text-muted">physical {pt(n, real)} ms</p>
            <motion.p key={fmt(n === 'A' ? a : b)} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-mono text-base font-bold">HLC {fmt(n === 'A' ? a : b)}</motion.p>
          </div>
        ))}
      </div>
      <Panel title="Event log">
        {evs.length === 0 ? <p className="text-xs text-muted">Press A sends to B, then Deliver message. Raise the skew to make B's clock lag.</p> : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[420px] font-mono text-[11.5px]">
              <thead><tr className="text-left text-muted"><th className="pr-2">#</th><th className="pr-2">node</th><th className="pr-2">event</th><th className="pr-2">physical</th><th className="pr-2">HLC</th><th /></tr></thead>
              <tbody>{evs.map((e) => (
                <motion.tr key={e.n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-line" style={e.anomaly ? { background: toneBg('dead', 12) } : undefined}>
                  <td className="pr-2">{e.n}</td><td className="pr-2">{e.node}</td><td className="pr-2">{e.kind}</td><td className="pr-2">{e.pt}</td><td className="pr-2 font-bold">{fmt(e.h)}</td>
                  <td className="text-[11px]" style={{ color: tone.text(e.anomaly ? 'dead' : 'ok') }}>{e.cause ? (e.anomaly ? `wall clock puts it before #${e.cause}; HLC after` : `after #${e.cause}`) : ''}</td>
                </motion.tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>
      <p className="text-xs text-muted"><Md>{'A **hybrid logical clock** is (physical time, logical counter). On a receive the node takes the maximum of its own clock, its physical time and the message\'s clock, and bumps the counter on a tie. Causes always get smaller timestamps than their effects, even when wall clocks disagree.'}</Md></p>
    </div>
  )
}

/* ---- what changes across nodes ---- */

const COLS = ['one node', 'Citus', 'YugabyteDB', 'async multi-master'] as const
const MATRIX: [string, string[]][] = [
  ['atomic commit', ['one WAL commit record', '2PC for multi-shard writes', 'one flip of a transaction status record', 'none: each node commits alone']],
  ['isolation', ['Read Committed default; one snapshot', 'snapshot per shard: a multi-shard read can see one shard before and another after a concurrent commit', 'RR → Snapshot, Serializable; RC only with the flag (default for new universes from v2025.2)', 'local to each node; nothing global']],
  ['sequences', ['one sequence, gaps possible', 'use bigint; smaller sequences can fail for inserts on workers', 'per-node caches: large gaps, not monotonic across nodes', 'global sequences (snowflake, galloc) or UUIDs']],
  ['unique keys', ['enforced everywhere', 'only if the key includes the distribution column (or a reference table)', 'enforced globally, through a distributed index', 'per node; a duplicate becomes an insert_exists conflict']],
  ['foreign keys', ['enforced', 'between colocated tables on the key, or to reference tables', 'enforced, with extra round trips', 'not checked while applying remote changes (Spock)']],
]

function AcrossNodes() {
  const [cell, setCell] = useState<[number, number]>([0, 1])
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[520px] border-collapse text-xs">
          <thead><tr><th />{COLS.map((c) => <th key={c} className="px-1 py-1 text-left font-semibold text-muted">{c}</th>)}</tr></thead>
          <tbody>{MATRIX.map(([row, cells], r) => (
            <tr key={row} className="border-t border-line">
              <td className="py-1 pr-2 font-mono font-semibold whitespace-nowrap">{row}</td>
              {cells.map((_, c) => {
                const on = cell[0] === r && cell[1] === c
                const t: Tone = c === 0 ? 'ok' : c === 3 ? 'dead' : 'new'
                return <td key={c} className="p-0.5"><button type="button" onClick={() => setCell([r, c])}
                  className="h-7 w-full rounded border text-left font-mono text-[10.5px]" style={{ borderColor: on ? tone(t) : 'var(--border)', background: toneBg(t, on ? 26 : 8) }}>
                  <span className="px-1">{c === 0 ? 'baseline' : 'differs'}</span></button></td>
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <motion.div key={cell.join()} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
        <Panel title={`${MATRIX[cell[0]][0]} · ${COLS[cell[1]]}`}><p className="text-sm">{MATRIX[cell[0]][1][cell[1]]}</p></Panel>
      </motion.div>
    </div>
  )
}

function DistTxViz() {
  const [tab, setTab] = useState<'2pc' | 'hlc' | 'matrix'>('2pc')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Segmented label="view" value={tab} onChange={setTab} options={[['2pc', 'Two-phase commit'], ['hlc', 'Hybrid logical clock'], ['matrix', 'What changes across nodes']]} />
      {tab === '2pc' ? <TwoPC /> : tab === 'hlc' ? <HlcLab /> : <AcrossNodes />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `${TRY_SQL}

-- Two schemas stand in for two participant nodes of a distributed transaction
CREATE SCHEMA worker1;
CREATE SCHEMA worker2;
CREATE TABLE worker1.acct (id int PRIMARY KEY, owner text NOT NULL, bal int NOT NULL CHECK (bal >= 0));
CREATE TABLE worker2.acct (id int PRIMARY KEY, owner text NOT NULL, bal int NOT NULL CHECK (bal >= 0));
INSERT INTO worker1.acct VALUES (1, 'ana', 100), (3, 'chen', 50);
INSERT INTO worker2.acct VALUES (2, 'bo', 0), (4, 'dev', 75);

-- the coordinator's durable decision log
CREATE TABLE coord_decisions (gid text PRIMARY KEY, decision text NOT NULL CHECK (decision IN ('commit', 'abort')),
                              decided_at timestamptz NOT NULL DEFAULT clock_timestamp());`

export const lesson: Lesson = {
  slug: 'distributed-transactions',
  module: 'e3',
  order: 4,
  title: 'Distributed transactions and consistency',
  tldr: [
    'A transaction that writes on several nodes needs an **atomic commit protocol**, usually **two-phase commit** (prepare everywhere, then commit everywhere), plus a way to order events across machines whose clocks disagree.',
    'Without them a crash can commit half a transfer, and the guarantees a single node gives for free (isolation, sequences, unique keys, foreign keys) each need a new answer.',
  ],
  visualizer: {
    title: 'Two-phase commit, clocks and cross-node rules',
    caption: 'Step through three 2PC scenarios, including a coordinator crash after PREPARE. Then send messages between two skewed clocks, and click the matrix to compare systems.',
    Component: DistTxViz,
  },
  playground: {
    config: ['max_prepared_transactions = 10', 'track_commit_timestamp = on'],
    setup: SETUP,
    presets: [
      { label: 'Two-phase commit, both phases', sql: `BEGIN;
UPDATE worker1.acct SET bal = bal - 30 WHERE id = 1;
PREPARE TRANSACTION 'xfer-42:w1';

BEGIN;
UPDATE worker2.acct SET bal = bal + 30 WHERE id = 2;
PREPARE TRANSACTION 'xfer-42:w2';

SELECT gid, transaction::text AS xid, owner, prepared IS NOT NULL AS on_disk FROM pg_prepared_xacts ORDER BY gid;
SELECT 'worker1' AS node, * FROM worker1.acct WHERE id = 1 UNION ALL SELECT 'worker2', * FROM worker2.acct WHERE id = 2;

INSERT INTO coord_decisions (gid, decision) VALUES ('xfer-42', 'commit') ON CONFLICT (gid) DO NOTHING;
COMMIT PREPARED 'xfer-42:w1';
COMMIT PREPARED 'xfer-42:w2';

SELECT 'worker1' AS node, * FROM worker1.acct WHERE id = 1 UNION ALL SELECT 'worker2', * FROM worker2.acct WHERE id = 2;
SELECT count(*) AS still_prepared FROM pg_prepared_xacts;`,
        note: 'Between PREPARE and COMMIT PREPARED the balances still read 100 and 0: prepared work is invisible. After phase 2 they read 70 and 30, and nothing is left prepared.' },
      { label: 'In doubt: locks with no session', sql: `BEGIN;
UPDATE worker1.acct SET bal = bal - 10 WHERE id = 3;
PREPARE TRANSACTION 'xfer-43:w1';

SELECT locktype, relation::regclass, mode, pid FROM pg_locks WHERE pid IS NULL ORDER BY locktype;
SELECT try_sql('SELECT * FROM worker1.acct WHERE id = 3 FOR UPDATE NOWAIT') AS probe_locked_row;
SELECT id, owner FROM worker1.acct FOR UPDATE SKIP LOCKED;
SELECT backend_xmin FROM pg_stat_activity WHERE pid = pg_backend_pid();

ROLLBACK PREPARED 'xfer-43:w1';
SELECT count(*) AS still_prepared FROM pg_prepared_xacts;`,
        note: 'The prepared transaction holds its locks with `pid` NULL: no session owns them. NOWAIT reports the lock instead of waiting, SKIP LOCKED leaves row 3 out, and `backend_xmin` is held at the prepared xid. The preset resolves it at the end.' },
      { label: 'Recovery from the decision log', sql: `BEGIN;
UPDATE worker1.acct SET bal = bal - 5 WHERE id = 1;
PREPARE TRANSACTION 'xfer-44:w1';
BEGIN;
UPDATE worker2.acct SET bal = bal + 5 WHERE id = 2;
PREPARE TRANSACTION 'xfer-44:w2';
INSERT INTO coord_decisions (gid, decision) VALUES ('xfer-44', 'commit') ON CONFLICT (gid) DO NOTHING;
BEGIN;
UPDATE worker1.acct SET bal = bal - 1 WHERE id = 3;
PREPARE TRANSACTION 'xfer-45:w1';

-- the coordinator restarts: what must happen to each prepared transaction?
SELECT p.gid, coalesce(d.decision, 'abort (no decision logged)') AS action, now() - p.prepared < interval '1 minute' AS recent
FROM pg_prepared_xacts p LEFT JOIN coord_decisions d ON d.gid = split_part(p.gid, ':', 1)
ORDER BY p.gid;

COMMIT PREPARED 'xfer-44:w1';
COMMIT PREPARED 'xfer-44:w2';
ROLLBACK PREPARED 'xfer-45:w1';
SELECT count(*) AS still_prepared FROM pg_prepared_xacts;`,
        note: 'xfer-44 has a logged commit, so both halves are committed. xfer-45 never got a decision, so the safe choice is to roll it back. Any session may finish a prepared transaction.' },
      { label: 'Two nodes, two clocks', sql: `SELECT 'worker1' AS node, id, bal, xmin, pg_xact_commit_timestamp(xmin)::text AS committed_at FROM worker1.acct
UNION ALL
SELECT 'worker2', id, bal, xmin, pg_xact_commit_timestamp(xmin)::text FROM worker2.acct
ORDER BY committed_at;

SELECT * FROM pg_last_committed_xact();
SELECT current_setting('transaction_isolation') AS isolation, pg_current_snapshot() AS snapshot;`,
        note: 'One logical transfer left two local xids with two commit timestamps. Each node orders its own history; nothing on a node knows the other node\'s xids. That is why distributed systems need a shared timestamp such as an HLC.' },
      { label: 'Sequences across nodes', sql: `CREATE SEQUENCE node1_ids START 1 INCREMENT 3;
CREATE SEQUENCE node2_ids START 2 INCREMENT 3;
CREATE SEQUENCE node3_ids START 3 INCREMENT 3;
SELECT nextval('node1_ids') AS node1, nextval('node2_ids') AS node2, nextval('node3_ids') AS node3
FROM generate_series(1, 3);

-- snowflake-style id: 41 bits of milliseconds | 10 bits node | 12 bits counter
CREATE SEQUENCE snow_ctr;
CREATE FUNCTION snowflake(node int) RETURNS bigint LANGUAGE sql AS $$
  SELECT ((floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint - 1288834974657) << 22)
       | ((node::bigint & 1023) << 12) | (nextval('snow_ctr') & 4095)
$$;
SELECT snowflake(7)::text AS id, (snowflake(7) >> 12) & 1023 AS node_from_id;`,
        note: 'Interleaved increments never collide, but every node must know the scheme forever. Snowflake ids embed time and node, so they sort roughly by time without coordination.' },
      { label: 'Unique per node is not unique', sql: `CREATE TABLE worker1.users (id bigint PRIMARY KEY, email text UNIQUE);
CREATE TABLE worker2.users (id bigint PRIMARY KEY, email text UNIQUE);
INSERT INTO worker1.users VALUES (1, 'kim@example.com');
INSERT INTO worker2.users VALUES (2, 'kim@example.com');

SELECT email, count(*) AS copies FROM (SELECT email FROM worker1.users UNION ALL SELECT email FROM worker2.users) u
GROUP BY email HAVING count(*) > 1;

-- one global place that owns uniqueness (a reference or lookup table)
CREATE TABLE email_claims (email text PRIMARY KEY, node text NOT NULL);
SELECT try_sql($$INSERT INTO email_claims VALUES ('lee@example.com', 'worker1')$$) AS first_claim,
       try_sql($$INSERT INTO email_claims VALUES ('lee@example.com', 'worker2')$$) AS second_claim;`,
        note: 'Each node\'s unique index only sees its own rows, so the same email exists twice. A single table that owns the value turns the second claim into an error before anything is written.' },
    ],
  },
  production: {
    title: 'An orphaned prepared transaction that stopped VACUUM',
    context: 'A payments service moves money between accounts on different shards. Its transaction manager uses `PREPARE TRANSACTION` on each database and a decision log.',
    problem: 'A deploy killed the manager between the two phases. Weeks later table bloat grew on one shard, wraparound warnings appeared, and some account rows timed out on every update. A prepared transaction from that deploy still held its locks and its xmin.',
    solution: 'Alert on old prepared transactions, resolve each GID from the decision log, and make the manager run recovery on start-up. Keep `max_prepared_transactions` at 0 on databases that no transaction manager uses.',
    sql: `-- alert: anything prepared for more than 5 minutes
SELECT gid, prepared, now() - prepared AS age, owner, database
FROM pg_prepared_xacts WHERE prepared < now() - interval '5 minutes';

-- how far it holds back cleanup
SELECT gid, age(transaction) AS xid_age FROM pg_prepared_xacts ORDER BY xid_age DESC;

-- resolve from the decision log (from any session)
COMMIT PREPARED 'xfer-90211:w3';     -- decision = commit
ROLLBACK PREPARED 'xfer-90217:w3';   -- no decision logged`,
    outcome: 'With the orphan resolved, VACUUM caught up and the locks were released. The alert now fires within minutes, long before bloat or wraparound pressure can build.',
  },
  pitfalls: [
    { title: 'Forgotten prepared transactions',
      symptom: 'VACUUM removes nothing, `age(datfrozenxid)` climbs, and some rows are locked although no session is running.',
      cause: 'A prepared transaction survives restarts, keeps its locks and holds back the xmin horizon until someone commits or rolls it back.',
      fix: 'Monitor `pg_prepared_xacts`, resolve each GID from the transaction manager\'s log, and keep `max_prepared_transactions = 0` where nothing uses 2PC.',
      sql: `SELECT gid, prepared, age(transaction) FROM pg_prepared_xacts ORDER BY prepared;` },
    { title: 'Assuming postgres_fdw commits atomically',
      symptom: 'After a network error, one server has the order and the other does not.',
      cause: '`postgres_fdw` commits each remote transaction when the local one commits, without two-phase commit. A failure between those commits leaves partial results.',
      fix: 'Do not rely on cross-server atomicity through FDWs. Use a coordinator that runs `PREPARE TRANSACTION` on each server, or design with an outbox and idempotent retries.' },
    { title: 'Prepared transactions on a standby',
      symptom: 'After the primary raised `max_prepared_transactions`, a hot standby stops replaying: its log says `hot standby is not possible because of insufficient parameter settings` and `recovery has paused`, and lag grows until the standby is restarted with a higher value.',
      cause: 'A standby must have `max_prepared_transactions`, `max_connections` and a few other limits at least as high as the primary, because it replays the primary\'s prepared transactions.',
      fix: 'Raise the setting on standbys first, then on the primary. If you use 2PC, set it at least as high as `max_connections`.' },
    { title: 'Read Committed code on a Snapshot-only system',
      symptom: 'An application moved to a distributed SQL database gets serialization errors (SQLSTATE `40001`) that never happened on PostgreSQL.',
      cause: 'Some systems map READ COMMITTED to snapshot isolation unless a flag is set, so concurrent updates abort instead of waiting and re-reading.',
      fix: 'Enable the system\'s Read Committed mode where available (YugabyteDB: `yb_enable_read_committed_isolation`) and retry `40001` in the application in any case.' },
  ],
  pointers: [
    '2PC: **PREPARE TRANSACTION** on every participant, durably log the decision, then **COMMIT PREPARED** (or **ROLLBACK PREPARED**) everywhere. A failed PREPARE is a rollback.',
    'If the coordinator dies after PREPARE, participants are **in doubt**: they hold locks and xmin until recovery reads the log and finishes. 2PC is a blocking protocol.',
    '`max_prepared_transactions` is 0 by default, which disables 2PC. `pg_prepared_xacts` lists what is prepared, and any session can finish it.',
    'A **hybrid logical clock** (physical, logical) orders causes before effects across nodes with skewed clocks. Commit timestamps decide "latest" in multi-master systems.',
    'Across nodes, sequences, unique keys, foreign keys and [isolation](/m5/isolation-levels) all weaken unless the system adds global machinery for them. Old prepared transactions also block [wraparound protection](/m7/xid-wraparound). 3PC, Paxos commit and global deadlock detection: [distributed transactions and consensus](/e5/commit-and-consensus).',
  ],
  sources: ['sql-prepare-transaction.html', 'sql-commit-prepared.html', 'sql-rollback-prepared.html', 'view-pg-prepared-xacts.html', 'view-pg-locks.html', 'postgres-fdw.html', 'runtime-config-resource.html', 'functions-info.html', 'transaction-iso.html', 'hot-standby.html'],
}
