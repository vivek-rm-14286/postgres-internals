import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Meter, fmtBytes, numLsn } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a scripted primary → standby simulation (PGlite cannot run a standby). It follows
 * warm-standby.html and monitoring-stats.html: the walsender streams flushed WAL; the walreceiver writes,
 * flushes and the startup process replays it; the standby reports write/flush/replay positions back, and
 * the primary shows them in pg_stat_replication. synchronous_commit decides which report a COMMIT waits for.
 * Timing constants (standby fsync 4 ms, replay 2 ms, 176-byte commits) are illustrative.
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'local' | 'remote_write' | 'on' | 'remote_apply'
interface Packet { id: number; kind: 'wal' | 'ack'; t0: number; t1: number; lsn: number; ack?: [number, number, number] }
interface Commit { id: number; lsn: number; t0: number; done?: number; heard: (number | undefined)[] }
interface Ev { t: number; run: () => void }
interface Sim {
  now: number; insert: number; sent: number; lastSend: number
  sw: number; sf: number; sr: number          // standby actual write / flush / replay
  pw: number; pf: number; pr: number          // what the primary has heard
  packets: Packet[]; commits: Commit[]; events: Ev[]; nextId: number
  lag: [number, number, number]; blocked: boolean; blockedSince: number | null; canceled: number; connected: boolean
}
const BASE = 0x3000000
const COMMIT_BYTES = 176

function fresh(): Sim {
  return { now: 0, insert: 0, sent: 0, lastSend: 0, sw: 0, sf: 0, sr: 0, pw: 0, pf: 0, pr: 0, packets: [], commits: [], events: [], nextId: 1, lag: [0, 0, 0], blocked: false, blockedSince: null, canceled: 0, connected: true }
}

function useSim(latency: number, mode: Mode, bgRate: number, maxDelay: number) {
  const ref = useRef<Sim>(fresh())
  const [, force] = useState(0)
  const cfg = useRef({ latency, mode, bgRate, maxDelay })
  cfg.current = { latency, mode, bgRate, maxDelay }
  useEffect(() => {
    const DT = 50
    const step = () => {
      const s = ref.current, c = cfg.current
      s.now += 1
      s.insert += (c.bgRate * 1024 * 1024) / 1000
      // walsender: stream what is flushed; background WAL in 10 ms batches, a COMMIT right away
      const pending = s.commits.some((cm) => cm.lsn > s.sent)
      if (s.connected && s.insert > s.sent && (pending || s.now - s.lastSend >= 10)) {
        s.lastSend = s.now
        s.packets.push({ id: s.nextId++, kind: 'wal', t0: s.now, t1: s.now + c.latency, lsn: s.insert })
        s.sent = s.insert
      }
      // deliver packets
      for (const p of s.packets.filter((x) => x.t1 <= s.now)) {
        if (p.kind === 'wal') {
          const lsn = p.lsn
          const ack = () => { if (s.connected) s.packets.push({ id: s.nextId++, kind: 'ack', t0: s.now, t1: s.now + c.latency, lsn, ack: [s.sw, s.sf, s.sr] }) }
          s.sw = Math.max(s.sw, lsn); ack()
          s.events.push({ t: s.now + 4, run: () => { s.sf = Math.max(s.sf, lsn); ack() } })
          s.events.push({ t: s.now + 6, run: () => { if (!s.blocked) { s.sr = Math.max(s.sr, s.sf); ack() } } })
        } else if (p.ack) {
          s.pw = Math.max(s.pw, p.ack[0]); s.pf = Math.max(s.pf, p.ack[1]); s.pr = Math.max(s.pr, p.ack[2])
        }
      }
      s.packets = s.packets.filter((x) => x.t1 > s.now)
      const due = s.events.filter((e) => e.t <= s.now)
      s.events = s.events.filter((e) => e.t > s.now)
      due.forEach((e) => e.run())
      // replay conflict: a standby query holds replay back until max_standby_streaming_delay
      if (s.blocked) {
        if (s.sf > s.sr && s.blockedSince === null) s.blockedSince = s.now
        if (s.blockedSince !== null && s.now - s.blockedSince > c.maxDelay * 1000) {
          s.blocked = false; s.blockedSince = null; s.canceled++
          s.sr = s.sf
          if (s.connected) s.packets.push({ id: s.nextId++, kind: 'ack', t0: s.now, t1: s.now + c.latency, lsn: s.sf, ack: [s.sw, s.sf, s.sr] })
        }
      }
      // commits waiting for their level
      const reached = c.mode === 'local' ? s.insert : c.mode === 'remote_write' ? s.pw : c.mode === 'on' ? s.pf : s.pr
      for (const cm of s.commits) if (cm.done === undefined && reached >= cm.lsn) cm.done = s.now
      // lag = time from a commit until the primary heard each stage
      const last = s.commits[s.commits.length - 1]
      if (last) {
        const seen = [s.pw, s.pf, s.pr]
        s.lag = s.lag.map((_, i) => (seen[i] >= last.lsn ? (last.heard[i] ?? (last.heard[i] = s.now - last.t0)) : s.now - last.t0)) as [number, number, number]
      }
    }
    const id = setInterval(() => { for (let i = 0; i < DT; i++) step(); force((n) => n + 1) }, DT)
    return () => clearInterval(id)
  }, [])
  const commit = () => {
    const s = ref.current
    s.insert += COMMIT_BYTES
    s.commits = [...s.commits.slice(-5), { id: s.nextId++, lsn: s.insert, t0: s.now, heard: [] }]
  }
  const reset = () => { ref.current = fresh() }
  return { s: ref.current, commit, reset }
}

function Wire({ s, latency }: { s: Sim; latency: number }) {
  const X0 = 250, X1 = 590
  return (
    <svg viewBox="0 0 840 170" className="w-full min-w-[720px]" role="img" aria-label="Primary streaming WAL to a standby">
      <rect x={10} y={20} width={230} height={130} rx={10} fill={toneBg('tuple', 10)} stroke={tone('tuple')} />
      <text x={24} y={42} fontSize={13} fontWeight={700} fill="var(--text)">Primary</text>
      <text x={24} y={62} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">backends → WAL → walsender</text>
      <text x={24} y={92} fontSize={10.5} fill="var(--muted)">current LSN</text>
      <text x={24} y={110} fontSize={13} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{numLsn(BASE + Math.round(s.insert))}</text>
      <text x={24} y={136} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">sent {numLsn(BASE + Math.round(s.sent))}</text>
      <rect x={600} y={20} width={230} height={130} rx={10} fill={toneBg('pointer', 10)} stroke={tone('pointer')} strokeDasharray={s.connected ? undefined : '5 4'} />
      <text x={614} y={42} fontSize={13} fontWeight={700} fill="var(--text)">Standby (hot)</text>
      <text x={614} y={62} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">walreceiver → pg_wal → startup</text>
      <text x={614} y={92} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">write  {numLsn(BASE + Math.round(s.sw))}</text>
      <text x={614} y={110} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">flush  {numLsn(BASE + Math.round(s.sf))}</text>
      <text x={614} y={128} fontSize={10.5} fill={s.blocked ? tone('dead') : 'var(--muted)'} fontFamily="var(--font-mono)">replay {numLsn(BASE + Math.round(s.sr))}{s.blocked ? ' (paused)' : ''}</text>
      <line x1={X0} x2={X1} y1={70} y2={70} stroke="var(--border)" strokeWidth={2} strokeDasharray={s.connected ? undefined : '4 6'} />
      <line x1={X0} x2={X1} y1={110} y2={110} stroke="var(--border)" strokeWidth={2} strokeDasharray={s.connected ? undefined : '4 6'} />
      <text x={(X0 + X1) / 2} y={60} textAnchor="middle" fontSize={10} fill="var(--muted)">WAL stream →</text>
      <text x={(X0 + X1) / 2} y={130} textAnchor="middle" fontSize={10} fill="var(--muted)">← write / flush / replay reports · {latency} ms one way</text>
      {s.packets.map((p) => {
        const f = Math.min(1, (s.now - p.t0) / Math.max(1, p.t1 - p.t0))
        const x = p.kind === 'wal' ? X0 + f * (X1 - X0) : X1 - f * (X1 - X0)
        return <circle key={p.id} cx={x} cy={p.kind === 'wal' ? 70 : 110} r={p.kind === 'wal' ? 5 : 4} fill={p.kind === 'wal' ? tone('tuple') : tone('ok')} />
      })}
      {!s.connected && <text x={(X0 + X1) / 2} y={94} textAnchor="middle" fontSize={12} fontWeight={700} fill={tone('dead')}>connection lost</text>}
    </svg>
  )
}

function StreamingViz() {
  const [mode, setMode] = useState<Mode>('on')
  const [latency, setLatency] = useState(60)
  const [bg, setBg] = useState(2)
  const [maxDelay, setMaxDelay] = useState(5)
  const { s, commit, reset } = useSim(latency, mode, bg, maxDelay)
  const lagB = (v: number) => Math.max(0, s.insert - v)
  const win = Math.max(64 * 1024, lagB(s.pr) * 1.2, lagB(s.sr) * 1.2)
  const pct = (v: number) => 100 - (lagB(v) / win) * 100
  const retained = s.insert - s.pf
  const fmtMs = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`)
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="synchronous_commit" value={mode} onChange={setMode} options={[['local', 'async (local)'], ['remote_write', 'remote_write'], ['on', 'on'], ['remote_apply', 'remote_apply']]} />
        <Btn primary testid="viz-next" onClick={commit}>COMMIT a transaction</Btn>
        <Btn onClick={() => { s.connected = !s.connected }}>{s.connected ? 'Cut the network' : 'Reconnect'}</Btn>
        <Btn onClick={() => { s.blocked = !s.blocked; s.blockedSince = null }}>{s.blocked ? 'End standby query' : 'Long query on standby'}</Btn>
        <Btn onClick={reset}>Reset</Btn>
      </div>
      <div className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
        {[['one-way latency', latency, 5, 300, 5, setLatency, `${latency} ms`], ['background WAL', bg, 0, 20, 1, setBg, `${bg} MB/s`], ['max_standby_streaming_delay', maxDelay, 1, 30, 1, setMaxDelay, `${maxDelay} s`]].map(([l, v, mn, mx, st, fn, txt]) => (
          <label key={l as string} className="grid gap-0.5">
            <span className="flex justify-between font-mono text-muted"><span>{l as string}</span><b className="text-ink">{txt as string}</b></span>
            <input type="range" min={mn as number} max={mx as number} step={st as number} value={v as number} onChange={(e) => (fn as (n: number) => void)(+e.target.value)} className="accent-[var(--accent)]" />
          </label>
        ))}
      </div>
      <Legend items={[['tuple', 'WAL message'], ['ok', 'standby reply'], ['new', 'waiting COMMIT'], ['dead', 'replay paused / lost']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2"><Wire s={s} latency={latency} /></div>
      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel title="Positions, as seen from the primary">
          <div className="grid gap-1.5">
            <Meter label="sent_lsn" pct={pct(s.sent)} t="tuple" right={fmtBytes(lagB(s.sent))} />
            <Meter label="write_lsn" pct={pct(s.pw)} t="pointer" right={fmtBytes(lagB(s.pw))} />
            <Meter label="flush_lsn" pct={pct(s.pf)} t="ok" right={fmtBytes(lagB(s.pf))} />
            <Meter label="replay_lsn" pct={pct(s.pr)} t={s.blocked ? 'dead' : 'header'} right={fmtBytes(lagB(s.pr))} />
          </div>
          <p className="mt-2 text-xs text-muted"><Md>{`Bars end at the primary's current LSN; the number is lag in bytes. Slot \`restart_lsn\` follows \`flush_lsn\`: **${fmtBytes(retained)}** of WAL is retained for this standby.`}</Md></p>
        </Panel>
        <Panel title="pg_stat_replication (one row)">
          <FieldTable rows={[
            ['state', s.connected ? 'streaming' : '(no row: disconnected)'],
            ['sync_state', mode === 'local' ? 'async' : 'sync'],
            ['write_lag', fmtMs(s.lag[0])], ['flush_lag', fmtMs(s.lag[1])], ['replay_lag', fmtMs(s.lag[2])],
            ['queries canceled', String(s.canceled), 'standby conflicts'],
          ]} />
        </Panel>
      </div>
      <Panel title="Client COMMITs">
        <div className="flex flex-wrap gap-2">
          {s.commits.length === 0 && <span className="text-xs text-muted">Press COMMIT. Each transaction writes 176 bytes of WAL.</span>}
          {s.commits.map((c) => (
            <motion.span key={c.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-md border px-2 py-1 font-mono text-xs" style={{ borderColor: tone(c.done !== undefined ? 'ok' : 'new'), background: toneBg(c.done !== undefined ? 'ok' : 'new', 12) }}>
              {numLsn(BASE + Math.round(c.lsn))} · {c.done !== undefined ? `committed in ${fmtMs(c.done - c.t0)}` : `waiting ${fmtMs(s.now - c.t0)}`}
            </motion.span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted"><Md>{mode === 'local' ? 'Asynchronous: COMMIT returns after the local flush. A failover now can lose whatever has not reached the standby.' : mode === 'remote_write' ? '`remote_write`: COMMIT waits one round trip for the standby to *write* the WAL to its OS. Survives a standby PostgreSQL crash, not a standby OS crash.' : mode === 'on' ? '`on`: COMMIT waits for the standby to *flush* to disk: a round trip plus a standby fsync.' : '`remote_apply`: COMMIT waits until the standby has *replayed* it, so a read on the standby right after sees it. Pause replay and commits hang.'}</Md></p>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'streaming-replication',
  module: 'm7',
  order: 6,
  title: 'Physical streaming replication',
  tldr: [
    'A **standby** is a copy of the primary that stays in permanent recovery, receiving the primary\'s WAL over a replication connection and replaying it byte for byte.',
    'Streaming gives a second server for failover and read queries, and **synchronous replication** lets a COMMIT wait until a standby has written, flushed or replayed its WAL.',
  ],
  visualizer: {
    title: 'A primary streaming to a hot standby',
    caption: 'Press **COMMIT** and watch WAL travel out and replies come back. Change the `synchronous_commit` level, the latency, cut the network, or start a long standby query. The standby is simulated: the playground database is a single process.',
    Component: StreamingViz,
  },
  playground: {
    setup: `
CREATE TABLE orders (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, total numeric(10,2) NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO orders (total) SELECT (random() * 100)::numeric(10,2) FROM generate_series(1, 1000);`,
    presets: [
      { label: 'Replication settings', sql: `SELECT pg_is_in_recovery() AS is_standby;

SELECT name, setting FROM pg_settings
WHERE name IN ('wal_level', 'max_wal_senders', 'max_replication_slots', 'wal_keep_size',
               'max_slot_wal_keep_size', 'synchronous_standby_names', 'synchronous_commit',
               'hot_standby', 'hot_standby_feedback', 'max_standby_streaming_delay',
               'wal_receiver_status_interval')
ORDER BY name;`,
        note: '`wal_level = replica` is enough for physical standbys. `max_slot_wal_keep_size = -1` means a slot may retain unlimited WAL. The standby-side settings are listed too; they only matter on a standby.' },
      { label: 'Create a physical slot', sql: `SELECT * FROM pg_create_physical_replication_slot('standby_a', true);

SELECT slot_name, slot_type, active, restart_lsn, wal_status FROM pg_replication_slots;`,
        note: 'The second argument reserves WAL immediately. A standby would use it with `primary_slot_name = \'standby_a\'`.' },
      { label: 'Write WAL nobody consumes', sql: `INSERT INTO orders (total) SELECT (random() * 100)::numeric(10,2) FROM generate_series(1, 20000);

SELECT slot_name, active, restart_lsn,
       pg_size_pretty(pg_current_wal_lsn() - restart_lsn) AS retained_wal,
       wal_status, safe_wal_size
FROM pg_replication_slots;`,
        note: 'With no standby attached, `restart_lsn` never moves, so every byte written since is pinned in `pg_wal`. `safe_wal_size` is NULL because `max_slot_wal_keep_size` is unlimited.' },
      { label: 'What a lag query computes', sql: `-- the shape of pg_stat_replication on a real primary (one row per walsender):
SELECT column_name FROM information_schema.columns
WHERE table_name = 'pg_stat_replication' AND column_name ~ '(lsn|lag|state)$' ORDER BY ordinal_position;

-- the standard lag query, applied to a sample row
WITH r(application_name, sent_lsn, write_lsn, flush_lsn, replay_lsn) AS (
  VALUES ('standby_a', '0/3A00148'::pg_lsn, '0/3A00148'::pg_lsn, '0/3A00060'::pg_lsn, '0/39F2000'::pg_lsn))
SELECT application_name,
       sent_lsn - write_lsn   AS network_or_write_bytes,
       write_lsn - flush_lsn  AS awaiting_fsync_bytes,
       flush_lsn - replay_lsn AS replay_backlog_bytes
FROM r;`,
        note: 'Each gap points at a different bottleneck: network, standby disk, or replay (often a query conflict). `write_lag`, `flush_lag` and `replay_lag` give the same stages as time.' },
      { label: 'Recovery functions on a primary', sql: `SELECT pg_is_in_recovery()          AS in_recovery,
       pg_last_wal_receive_lsn()     AS last_received,
       pg_last_wal_replay_lsn()      AS last_replayed,
       pg_last_xact_replay_timestamp() AS last_replay_time,
       pg_current_wal_lsn()          AS current_lsn;`,
        note: 'On a primary the standby-side functions return NULL. On a standby, `now() - pg_last_xact_replay_timestamp()` is a common lag-in-time check.' },
      { label: 'Drop the slot', sql: `SELECT pg_drop_replication_slot('standby_a');
SELECT count(*) AS slots_left FROM pg_replication_slots;`,
        note: 'Dropping an unused slot releases the retained WAL at the next checkpoint. Forgotten slots are the classic cause of a full `pg_wal`.' },
    ],
  },
  production: {
    title: 'Synchronous replication without single-standby hangs',
    context: 'A payments team runs a primary and two standbys in different zones and must not lose an acknowledged payment if the primary\'s zone fails.',
    problem: 'They started with `synchronous_standby_names = \'s1\'`. During a routine restart of s1, every write transaction on the primary hung at COMMIT for the whole maintenance window, because the only synchronous standby was gone.',
    solution: 'Use a quorum: any one of two standbys must confirm. Keep `synchronous_commit = on` for payments and let bulk jobs opt out per transaction. Monitor `sync_state` and lag.',
    sql: `ALTER SYSTEM SET synchronous_standby_names = 'ANY 1 (s1, s2)';
SELECT pg_reload_conf();

-- bulk work that may lag behind
BEGIN;
SET LOCAL synchronous_commit = local;
INSERT INTO audit_archive SELECT ...;
COMMIT;

SELECT application_name, state, sync_state, write_lag, flush_lag, replay_lag
FROM pg_stat_replication;`,
    outcome: 'Either standby can now confirm a commit, so restarting one no longer blocks writes, and an acknowledged payment is still on durable storage in a second zone. Commit latency is one round trip to the nearest healthy standby plus its fsync.',
  },
  pitfalls: [
    { title: 'An inactive slot fills pg_wal',
      symptom: 'Disk usage of `pg_wal` grows for days; eventually the primary hits a full disk and PANICs.',
      cause: 'A replication slot whose standby is gone keeps `restart_lsn` in place, so no WAL after it can be recycled. `max_slot_wal_keep_size` defaults to -1 (unlimited).',
      fix: 'Alert on inactive slots and retained bytes, drop slots you no longer need, and set `max_slot_wal_keep_size` so a dead standby is invalidated instead of taking the primary down.',
      sql: `SELECT slot_name, active, pg_size_pretty(pg_current_wal_lsn() - restart_lsn) AS retained
FROM pg_replication_slots ORDER BY pg_current_wal_lsn() - restart_lsn DESC;` },
    { title: 'Standby queries cancelled with "conflict with recovery"',
      symptom: 'Reports on the standby fail with `canceling statement due to conflict with recovery`.',
      cause: 'Replay must apply a VACUUM cleanup record that removes rows a standby query still needs. Replay waits at most `max_standby_streaming_delay` (30 s), then cancels the query.',
      fix: 'Enable `hot_standby_feedback` (costs some bloat on the primary), raise `max_standby_streaming_delay` on reporting standbys, or move long reports to a dedicated delayed replica.' },
    { title: 'Both nodes think they are primary',
      symptom: 'After a failover, the old primary comes back and accepts writes; the two histories diverge.',
      cause: 'PostgreSQL does not detect failures or fence nodes. Promotion of the standby does not stop the old primary.',
      fix: 'Fence the old primary (STONITH) before promoting, and use a cluster manager. Rejoin the old primary as a standby with `pg_rewind` instead of a full re-clone.' },
  ],
  pointers: [
    '**walsender** (primary) streams WAL to the **walreceiver** (standby); the **startup process** replays it.',
    'Positions: **sent → write → flush → replay**; `pg_stat_replication` shows each LSN and the matching **lag**.',
    'Slots keep WAL (and with feedback, old rows) until the standby has it; cap with **`max_slot_wal_keep_size`**.',
    '`synchronous_standby_names` = `FIRST n (…)` or `ANY n (…)`; `synchronous_commit` picks **remote_write / on / remote_apply**.',
    'Hot standby is read-only; conflicts are resolved by **delaying replay** up to `max_standby_streaming_delay`, then cancelling.',
  ],
  sources: ['warm-standby.html', 'hot-standby.html', 'high-availability.html', 'runtime-config-replication.html', 'monitoring-stats.html', 'warm-standby-failover.html', 'app-pgrewind.html', 'functions-admin.html'],
}
