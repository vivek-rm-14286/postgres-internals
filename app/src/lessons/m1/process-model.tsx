import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, T } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a live instance. The postmaster forks one backend per connection, keeps the auxiliary
 * processes alive, enforces max_connections / superuser_reserved_connections, restarts everything
 * after a backend crash, and implements the three shutdown modes. Log lines use the server's wording.
 * ---------------------------------------------------------------------------------------------- */

const MAXC = 6
const SU_RES = 1
type BState = 'starting' | 'idle' | 'active' | 'idle in transaction' | 'dying'
interface Backend { pid: number; user: 'app' | 'postgres'; state: BState; query: string; slot: number; tx: boolean }
interface Aux { pid: number; name: string; type: string }
type Phase = 'running' | 'smart' | 'down' | 'recovering'
interface Inst { phase: Phase; backends: Backend[]; aux: Aux[]; next: number; log: { id: number; t: Tone; text: string }[]; crashed: boolean; needsRecovery: boolean; startup: boolean; afterCrash: boolean }

const AUX_DEF: [string, string][] = [
  ['checkpointer', 'checkpointer'], ['bgwriter', 'background writer'], ['walwriter', 'walwriter'], ['autovacuum', 'autovacuum launcher'],
  ['logical rep.', 'logical replication launcher'], ['io worker 0', 'io worker'], ['io worker 1', 'io worker'], ['io worker 2', 'io worker'],
]
const PM_PID = 1000
const freshAux = (start: number): Aux[] => AUX_DEF.map(([name, type], k) => ({ pid: start + k, name, type }))
const initial = (): Inst => ({ phase: 'running', backends: [], aux: freshAux(1001), next: 1010, log: [{ id: 0, t: 'ok', text: 'LOG:  database system is ready to accept connections' }], crashed: false, needsRecovery: false, startup: false, afterCrash: false })
const QUERIES = ['SELECT * FROM orders WHERE id = 42', 'UPDATE stock SET qty = qty - 1 WHERE sku = $1', 'SELECT count(*) FROM events', 'INSERT INTO audit VALUES ($1, now())']

function ProcessViz() {
  const [s, setS] = useState<Inst>(initial)
  const [sel, setSel] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const logId = useRef(1)
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (ms: number, fn: (x: Inst) => Inst) => { timers.current.push(window.setTimeout(() => setS(fn), ms)) }
  const addLog = (x: Inst, t: Tone, ...lines: string[]): Inst => ({ ...x, log: [...x.log, ...lines.map((text) => ({ id: logId.current++, t, text }))].slice(-7) })

  const used = s.backends.length
  const selected = s.backends.find((b) => b.pid === sel) ?? s.backends[s.backends.length - 1]

  const connect = (user: 'app' | 'postgres') => setS((x) => {
    if (x.phase === 'down') return addLog(x, 'dead', 'psql: error: connection to server on socket "/tmp/.s.PGSQL.5432" failed: No such file or directory')
    if (x.phase === 'recovering') return addLog(x, 'dead', x.afterCrash ? 'FATAL:  the database system is in recovery mode' : 'FATAL:  the database system is starting up')
    if (x.phase === 'smart') return addLog(x, 'dead', 'FATAL:  the database system is shutting down')
    const n = x.backends.length
    if (n >= MAXC) return addLog(x, 'dead', 'FATAL:  sorry, too many clients already')
    if (user === 'app' && n >= MAXC - SU_RES) return addLog(x, 'dead', 'FATAL:  remaining connection slots are reserved for roles with the SUPERUSER attribute')
    const taken = new Set(x.backends.map((b) => b.slot))
    const slot = [...Array(MAXC).keys()].find((k) => !taken.has(k))!
    const pid = x.next
    later(700, (y) => ({ ...y, backends: y.backends.map((b) => (b.pid === pid && b.state === 'starting' ? { ...b, state: 'idle' } : b)) }))
    setSel(pid)
    return addLog({ ...x, next: x.next + 1, backends: [...x.backends, { pid, user, state: 'starting', query: '', slot, tx: false }] }, 'muted',
      `fork() → backend ${pid}: authenticating ${user}`)
  })

  const run = () => {
    if (!selected || selected.state === 'starting') return
    const pid = selected.pid
    const q = QUERIES[pid % QUERIES.length]
    setS((x) => ({ ...x, backends: x.backends.map((b) => (b.pid === pid ? { ...b, state: 'active', query: q } : b)) }))
    later(1600, (y) => ({ ...y, backends: y.backends.map((b) => (b.pid === pid && b.state === 'active' ? { ...b, state: b.tx ? 'idle in transaction' : 'idle' } : b)) }))
  }
  const begin = () => {
    if (!selected || selected.state === 'starting') return
    const pid = selected.pid
    setS((x) => ({ ...x, backends: x.backends.map((b) => (b.pid === pid ? { ...b, state: 'idle in transaction', tx: true, query: 'UPDATE accounts SET … WHERE id = 7' } : b)) }))
  }
  const removeBackend = (pid: number, msg: string, t: Tone = 'muted') => {
    setS((x) => addLog({ ...x, backends: x.backends.map((b) => (b.pid === pid ? { ...b, state: 'dying' } : b)) }, t, msg))
    later(450, (y) => {
      const z = { ...y, backends: y.backends.filter((b) => b.pid !== pid) }
      if (z.phase === 'smart' && z.backends.length === 0) return finishShutdown(z, true)
      return z
    })
  }
  const disconnect = () => { if (selected) removeBackend(selected.pid, `backend ${selected.pid} exited after Terminate (exit code 0)${selected.tx ? '; open transaction rolled back' : ''}`) }

  const finishShutdown = (x: Inst, clean: boolean): Inst => {
    const y = clean
      ? addLog(x, 'header', 'LOG:  shutting down', 'LOG:  checkpoint starting: shutdown immediate', 'LOG:  database system is shut down')
      : addLog(x, 'dead', 'LOG:  received immediate shutdown request', 'LOG:  database system is shut down')
    return { ...y, phase: 'down', aux: [], backends: [], needsRecovery: !clean }
  }
  const crash = () => {
    if (!selected || s.phase !== 'running') return
    const pid = selected.pid
    setS((x) => addLog({ ...x, crashed: true, backends: x.backends.map((b) => ({ ...b, state: 'dying' })) }, 'dead',
      `LOG:  server process (PID ${pid}) was terminated by signal 9: Killed`, 'LOG:  terminating any other active server processes'))
    later(900, (y) => addLog({ ...y, backends: [], aux: [], crashed: false, phase: 'recovering', startup: true, afterCrash: true }, 'new',
      'LOG:  all server processes terminated; reinitializing', 'LOG:  database system was not properly shut down; automatic recovery in progress'))
    later(2300, (y) => addLog({ ...y, phase: 'running', startup: false, aux: freshAux(y.next), next: y.next + 9 }, 'ok',
      'LOG:  redo done', 'LOG:  database system is ready to accept connections'))
  }
  const shutdown = (mode: 'smart' | 'fast' | 'immediate') => {
    if (s.phase !== 'running' && !(s.phase === 'smart' && mode !== 'smart')) return
    if (mode === 'smart') {
      setS((x) => {
        const y = addLog({ ...x, phase: 'smart' }, 'header', 'LOG:  received smart shutdown request')
        return y.backends.length === 0 ? finishShutdown(y, true) : y
      })
    } else if (mode === 'fast') {
      setS((x) => addLog({ ...x, phase: 'smart', backends: x.backends.map((b) => ({ ...b, state: 'dying' })) }, 'header',
        'LOG:  received fast shutdown request (SIGINT)', 'LOG:  aborting any active transactions',
        ...x.backends.map((b) => `FATAL:  terminating connection due to administrator command (PID ${b.pid})`)))
      later(700, (y) => finishShutdown({ ...y, backends: [] }, true))
    } else {
      setS((x) => ({ ...x, crashed: true, backends: x.backends.map((b) => ({ ...b, state: 'dying' })) }))
      later(600, (y) => finishShutdown({ ...y, crashed: false }, false))
    }
  }
  const start = () => {
    if (s.phase !== 'down') return
    if (s.needsRecovery) {
      setS((x) => addLog({ ...x, phase: 'recovering', startup: true, needsRecovery: false, afterCrash: false }, 'new', 'LOG:  database system was interrupted; last known up at …', 'LOG:  redo starts at 0/1A2B3C8'))
      later(1600, (y) => addLog({ ...y, phase: 'running', startup: false, aux: freshAux(y.next), next: y.next + 9 }, 'ok', 'LOG:  redo done', 'LOG:  database system is ready to accept connections'))
    } else {
      setS((x) => addLog({ ...x, phase: 'running', aux: freshAux(x.next), next: x.next + 9 }, 'ok', 'LOG:  database system is ready to accept connections'))
    }
  }

  const W = 800
  const pm = { x: W / 2 - 90, y: 8, w: 180, h: 46 }
  const auxW = 90, auxY = 92
  const auxX = (k: number) => 12 + k * (auxW + 8)
  const slotW = 118, beY = 214
  const slotX = (k: number) => 16 + k * (slotW + 12)
  const stTone = (b: Backend): Tone => (b.state === 'dying' ? 'dead' : b.state === 'active' ? 'new' : b.state === 'idle in transaction' ? 'dead' : b.state === 'starting' ? 'muted' : 'tuple')
  const pmTone: Tone = s.phase === 'down' ? 'muted' : s.phase === 'recovering' ? 'new' : s.crashed ? 'dead' : 'header'

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => connect('app')}>Connect app client</Btn>
        <Btn onClick={() => connect('postgres')}>Connect superuser</Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn onClick={run} disabled={!selected}>Run query</Btn>
        <Btn onClick={begin} disabled={!selected}>BEGIN, then wait</Btn>
        <Btn onClick={disconnect} disabled={!selected}>Disconnect</Btn>
        <Btn onClick={crash} disabled={!selected || s.phase !== 'running'} t="dead">kill -9 backend</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">pg_ctl stop -m</span>
        <Btn onClick={() => shutdown('smart')} disabled={s.phase !== 'running'}>smart</Btn>
        <Btn onClick={() => shutdown('fast')} disabled={s.phase === 'down' || s.phase === 'recovering'}>fast</Btn>
        <Btn onClick={() => shutdown('immediate')} disabled={s.phase === 'down' || s.phase === 'recovering'}>immediate</Btn>
        <Btn onClick={start} disabled={s.phase !== 'down'} t="ok">pg_ctl start</Btn>
        <span className="ml-auto font-mono text-xs text-muted">max_connections = {MAXC} · superuser_reserved_connections = {SU_RES} · used {used}/{MAXC}</span>
      </div>
      <Legend items={[['header', 'postmaster'], ['pointer', 'auxiliary process'], ['tuple', 'backend: idle'], ['new', 'active / recovering'], ['dead', 'idle in transaction / killed']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox={`0 0 ${W} 330`} className="w-full min-w-[720px]" role="img" aria-label="Process tree of a PostgreSQL instance">
          {/* shared memory band */}
          <rect x={8} y={156} width={W - 16} height={30} rx={6} fill={toneBg('pointer', s.phase === 'down' ? 4 : 12)} stroke="var(--border)" strokeDasharray={s.phase === 'down' ? '4 4' : undefined} />
          <T x={W / 2} y={175} size={11} anchor="middle" fill="var(--muted)">{s.phase === 'down' ? 'shared memory released' : s.phase === 'recovering' ? 'shared memory re-initialized · startup process replays WAL' : 'shared memory: shared_buffers · WAL buffers · lock table · proc array · stats'}</T>
          {/* postmaster */}
          <motion.g animate={{ opacity: s.phase === 'down' ? 0.45 : 1 }}>
            <rect x={pm.x} y={pm.y} width={pm.w} height={pm.h} rx={8} fill={toneBg(pmTone, 22)} stroke={tone(pmTone)} strokeWidth={2} />
            <T x={pm.x + 12} y={pm.y + 20} size={13} w={700}>postmaster</T>
            <T x={pm.x + 12} y={pm.y + 36} size={10} fill="var(--muted)">{s.phase === 'down' ? 'not running' : `pid ${PM_PID} · :5432 · ${s.phase === 'smart' ? 'shutting down' : s.phase}`}</T>
          </motion.g>
          {/* startup process during recovery */}
          <AnimatePresence>
            {s.startup && (
              <motion.g key="startup" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <line x1={pm.x + pm.w} y1={pm.y + 23} x2={pm.x + pm.w + 50} y2={pm.y + 23} stroke={tone('new')} />
                <rect x={pm.x + pm.w + 50} y={pm.y + 6} width={150} height={34} rx={6} fill={toneBg('new', 22)} stroke={tone('new')} />
                <T x={pm.x + pm.w + 60} y={pm.y + 22} size={11} w={700}>startup</T>
                <T x={pm.x + pm.w + 60} y={pm.y + 34} size={9.5} fill="var(--muted)">replaying WAL</T>
              </motion.g>
            )}
          </AnimatePresence>
          {/* aux processes */}
          <AnimatePresence>
            {s.aux.map((a, k) => (
              <motion.g key={a.pid} initial={{ opacity: 0, x: pm.x + 40 - auxX(k), y: -60, scale: 0.6 }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.3 } }} transition={{ type: 'spring', stiffness: 150, damping: 20, delay: k * 0.05 }}>
                <line x1={auxX(k) + auxW / 2} y1={auxY} x2={pm.x + pm.w / 2} y2={pm.y + pm.h} stroke="var(--border)" />
                <rect x={auxX(k)} y={auxY} width={auxW} height={40} rx={6} fill={toneBg(s.crashed ? 'dead' : 'pointer', 16)} stroke={tone(s.crashed ? 'dead' : 'pointer')} />
                <T x={auxX(k) + 6} y={auxY + 16} size={9.5} w={700}>{a.name}</T>
                <T x={auxX(k) + 6} y={auxY + 31} size={9.5} fill="var(--muted)">pid {a.pid}</T>
              </motion.g>
            ))}
          </AnimatePresence>
          {/* connection slots */}
          {[...Array(MAXC).keys()].map((k) => (
            <g key={`slot${k}`}>
              <rect x={slotX(k)} y={beY} width={slotW} height={56} rx={7} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
              <T x={slotX(k) + slotW / 2} y={beY + 74} size={9.5} anchor="middle" fill={k >= MAXC - SU_RES ? tone('header') : 'var(--muted)'}>{k >= MAXC - SU_RES ? 'reserved: superuser' : `slot ${k + 1}`}</T>
            </g>
          ))}
          {/* backends */}
          <AnimatePresence>
            {s.backends.map((b) => {
              const x = slotX(b.slot)
              const t = stTone(b)
              const isSel = selected?.pid === b.pid
              return (
                <motion.g key={b.pid} onClick={() => setSel(b.pid)} style={{ cursor: 'pointer' }}
                  initial={{ opacity: 0, x: pm.x + pm.w / 2 - x - slotW / 2, y: pm.y - beY, scale: 0.4 }} animate={{ opacity: b.state === 'dying' ? 0.5 : 1, x: 0, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.3 } }} transition={{ type: 'spring', stiffness: 140, damping: 18 }}>
                  <line x1={x + slotW / 2} y1={beY} x2={pm.x + pm.w / 2} y2={pm.y + pm.h} stroke={tone(t)} strokeWidth={1.2} opacity={0.7} />
                  <rect x={x} y={beY} width={slotW} height={56} rx={7} fill={toneBg(t, 20)} stroke={tone(t)} strokeWidth={isSel ? 2.6 : 1.2} />
                  <T x={x + 8} y={beY + 17} size={11} w={700}>backend {b.pid}</T>
                  <T x={x + 8} y={beY + 32} size={9.5} fill="var(--muted)">{b.user === 'postgres' ? 'postgres (superuser)' : 'app'}</T>
                  <T x={x + 8} y={beY + 47} size={9.5} fill={tone(t)} w={600}>{b.state === 'dying' ? 'exiting' : b.state}</T>
                  {/* client */}
                  <line x1={x + slotW / 2} y1={beY + 56} x2={x + slotW / 2} y2={beY + 92} stroke={tone('accent')} strokeDasharray="3 3" />
                  <rect x={x + 22} y={beY + 92} width={slotW - 44} height={22} rx={5} fill={toneBg('accent', 14)} stroke={tone('accent')} />
                  <T x={x + slotW / 2} y={beY + 107} size={9.5} anchor="middle">client</T>
                </motion.g>
              )
            })}
          </AnimatePresence>
        </svg>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <div className="overflow-x-auto rounded-lg border border-line scrollbar-thin">
          <p className="border-b border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-muted">SELECT pid, backend_type, usename, state, query FROM pg_stat_activity;</p>
          <table className="w-full border-collapse font-mono text-[11px]">
            <tbody>
              {s.backends.filter((b) => b.state !== 'dying').map((b) => (
                <tr key={b.pid} className="border-b border-line" style={selected?.pid === b.pid ? { background: toneBg('new', 14) } : undefined} onClick={() => setSel(b.pid)}>
                  <td className="px-2 py-0.5">{b.pid}</td><td className="px-2">client backend</td><td className="px-2">{b.user}</td>
                  <td className="px-2" style={{ color: tone(stTone(b)) }}>{b.state === 'starting' ? 'starting' : b.state}</td>
                  <td className="max-w-[220px] truncate px-2 text-muted">{b.query}</td>
                </tr>
              ))}
              {s.aux.map((a) => (
                <tr key={a.pid} className="border-b border-line text-muted last:border-0">
                  <td className="px-2 py-0.5">{a.pid}</td><td className="px-2">{a.type}</td><td className="px-2">{a.type.startsWith('logical') ? 'postgres' : ''}</td><td className="px-2" /><td className="px-2" />
                </tr>
              ))}
              {s.phase === 'down' && <tr><td className="px-2 py-1 text-muted" colSpan={5}>server is not running: no rows</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-line bg-bg p-2 font-mono text-[11px] leading-snug" aria-live="polite">
          <p className="mb-1 text-muted">server log</p>
          <AnimatePresence initial={false}>
            {s.log.map((l) => (
              <motion.p key={l.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} style={{ color: l.t === 'muted' ? 'var(--muted)' : tone(l.t) }}>{l.text}</motion.p>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <p className="text-xs text-muted">Click a backend to select it. Demo limits are tiny; the real defaults are <code className="inline-code">max_connections = 100</code> and <code className="inline-code">superuser_reserved_connections = 3</code>. Log lines use the server&apos;s own message wording.</p>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'process-model',
  module: 'm1',
  order: 2,
  title: 'The postmaster and one process per connection',
  tldr: [
    'The **postmaster** is the first process of an instance: it starts the auxiliary processes, and it **forks one backend process for every client connection**.',
    'Separate processes isolate sessions from each other, so a crashed backend cannot corrupt another one silently, and the postmaster can reset shared memory and restart cleanly.',
  ],
  visualizer: {
    title: 'A live instance: fork, connect, crash, shut down',
    caption: 'Connect clients until the slots run out, leave one idle in a transaction, then **kill -9** a backend and watch the postmaster restart everything. Try the three shutdown modes.',
    Component: ProcessViz,
  },
  playground: {
    setup: `
CREATE TABLE accounts (id int PRIMARY KEY, balance numeric NOT NULL);
INSERT INTO accounts SELECT g, 100 FROM generate_series(1, 1000) g;`,
    presets: [
      { label: 'My backend in pg_stat_activity', sql: `SELECT pid, backend_type, datname, usename, application_name, state, backend_start
FROM pg_stat_activity;`,
        note: 'This sandbox runs the whole server inside one process, so you see a single **standalone backend**. A normal server lists one row per client backend and per auxiliary process here.' },
      { label: 'Label your session, then find slow ones', sql: `SET application_name = 'billing-worker-3';

SELECT pid, usename, application_name, state, clock_timestamp() - query_start AS running_for, left(query, 60) AS query
FROM pg_stat_activity
WHERE state <> 'idle' AND backend_type IN ('client backend', 'standalone backend')
ORDER BY running_for DESC;`,
        note: 'The second query is the long-running query finder: every non-idle backend, oldest first. Set `application_name` in every service so its rows say which pod they belong to. Here the only active backend is this one, running the finder itself.' },
      { label: 'Every backend type', sql: `SELECT DISTINCT backend_type FROM pg_stat_io ORDER BY 1;`,
        note: '`pg_stat_io` keeps a row for each kind of server process: client backends, background writer, checkpointer, walwriter, autovacuum, the PG18 **io worker**, and more.' },
      { label: 'Idle in transaction', sql: `BEGIN;
UPDATE accounts SET balance = balance - 10 WHERE id = 1;

SELECT pid, state, xact_start IS NOT NULL AS in_xact, backend_xid
FROM pg_stat_activity WHERE pid = pg_backend_pid();

SELECT locktype, relation::regclass, mode, granted
FROM pg_locks WHERE pid = pg_backend_pid() AND locktype IN ('relation', 'transactionid');
COMMIT;`,
        note: 'Between statements the session is **idle in transaction**: it holds an xid and a `RowExclusiveLock` on `accounts` until COMMIT. Any other session that wants this row waits for it.' },
      { label: 'What a backend costs', sql: `SELECT count(*) AS contexts, pg_size_pretty(sum(total_bytes)) AS private_memory
FROM pg_backend_memory_contexts;

SELECT name, pg_size_pretty(total_bytes) AS size
FROM pg_backend_memory_contexts ORDER BY total_bytes DESC LIMIT 5;`,
        note: 'Each backend owns private memory contexts (catalog caches, plans, sort space). Multiply by the connection count to see why thousands of connections hurt.' },
      { label: 'Which settings need a restart', sql: `SELECT name, setting, context
FROM pg_settings
WHERE name IN ('max_connections', 'superuser_reserved_connections', 'reserved_connections',
               'authentication_timeout', 'idle_in_transaction_session_timeout', 'restart_after_crash', 'statement_timeout')
ORDER BY context, name;`,
        note: '`postmaster` context = set at server start only. `max_connections` sizes shared memory, so changing it needs a restart. `user` settings can be changed per session.' },
      { label: 'Cancel vs terminate', sql: `SELECT proname, pg_get_function_arguments(oid) AS arguments, pg_get_function_result(oid) AS returns
FROM pg_proc WHERE proname IN ('pg_cancel_backend', 'pg_terminate_backend');

-- a PID that is not a backend: a WARNING and false, never an error
SELECT pg_cancel_backend(999999) AS cancelled, pg_terminate_backend(999999, 500) AS terminated;`,
        note: 'Cancel stops the current query and keeps the session. Terminate sends SIGTERM and ends the backend. Without a timeout, `true` only means the signal was **sent**; with `timeout` (ms) it means the process actually exited.' },
      { label: 'Wait events catalog', sql: `SELECT type, count(*) FROM pg_wait_events GROUP BY type ORDER BY 2 DESC;

SELECT name, description FROM pg_wait_events
WHERE name IN ('ClientRead', 'BgwriterMain', 'CheckpointerMain', 'WalWriterMain');`,
        note: 'An idle backend waits on `ClientRead`: it is blocked reading the socket for the next Query message. Each auxiliary process has its own main-loop wait event.' },
    ],
  },
  production: {
    title: 'Too many clients during an autoscaling event',
    context: 'An API runs on 40 pods. Each pod keeps a client-side pool of 20 connections, so the fleet can open 800 backends against a server with `max_connections = 500`.',
    problem: 'During a traffic spike the autoscaler added pods. New pods failed health checks with `FATAL: sorry, too many clients already`. Most existing backends were **idle**, and a few were **idle in transaction**, holding locks.',
    solution: 'Count backends by state and owner first. Then cap the pool per pod, put a transaction-mode pooler in front of the database, and add server-side timeouts so abandoned transactions cannot pin locks and slots.',
    sql: `SELECT application_name, state, count(*)
FROM pg_stat_activity WHERE backend_type = 'client backend'
GROUP BY 1, 2 ORDER BY 3 DESC;

ALTER ROLE api SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE api CONNECTION LIMIT 300;`,
    outcome: 'With 40 pods sharing a pooler of, say, 120 server connections, the fleet can no longer exceed `max_connections`; abandoned transactions end after 30 seconds, and the superuser reserve stays free for on-call access during incidents.',
  },
  pitfalls: [
    { title: 'Raising max_connections into the thousands',
      symptom: 'After setting `max_connections = 5000` the server needs more shared memory and semaphores, and throughput falls as connections rise.',
      cause: 'Every allowed connection reserves shared-memory slots and a semaphore at startup, and every live backend is a full OS process with private caches. Thousands of mostly idle processes cost RAM and lock contention.',
      fix: 'Keep `max_connections` in the low hundreds and use a connection pooler. Size pools to the number of CPU cores and disks, not to the number of app threads.' },
    { title: 'Sessions left idle in transaction',
      symptom: '`pg_stat_activity` shows backends `idle in transaction` for minutes. Other writes queue behind their locks and VACUUM cannot clean up.',
      cause: 'The client ran `BEGIN` and some statements, then stopped without `COMMIT`: a request handler crashed, or someone left a psql session open.',
      fix: 'Set `idle_in_transaction_session_timeout` per role, and find offenders by `xact_start` age.',
      sql: `SELECT pid, usename, application_name, now() - xact_start AS open_for, query
FROM pg_stat_activity WHERE state = 'idle in transaction' ORDER BY xact_start;` },
    { title: 'Using kill -9 on a backend',
      symptom: 'Killing one stuck backend disconnects **every** client, and the server runs crash recovery.',
      cause: 'A process that dies without cleanup may have left shared memory inconsistent. The postmaster therefore terminates all other backends, reinitializes shared memory and replays WAL (`restart_after_crash`).',
      fix: 'Use `pg_cancel_backend(pid)` to stop the current query, or `pg_terminate_backend(pid)` to end the session cleanly. Never SIGKILL the postmaster itself.' },
    { title: 'pg_terminate_backend returned true, but the session is still there',
      symptom: 'A cleanup script terminates the sessions blocking a migration, gets `true` for each, runs `ALTER TABLE` at once, and still waits on a lock.',
      cause: 'A common reading is that `true` means the backend is gone. Without a timeout it only means the SIGTERM was delivered; the backend exits at its next interrupt check and must roll back its transaction first.',
      fix: 'Pass a timeout so the call waits for the exit, and check the result before the DDL.',
      sql: `SELECT pid, pg_terminate_backend(pid, 5000) AS exited
FROM pg_stat_activity
WHERE datname = current_database() AND state = 'idle in transaction' AND pid <> pg_backend_pid();` },
    { title: 'The Linux OOM killer picks PostgreSQL',
      symptom: 'The kernel log shows `Out of Memory: Killed process … (postgres)`, followed by a crash restart or a dead server.',
      cause: 'Memory overcommit lets the kernel kill a backend, which triggers a restart, or the postmaster itself, which stops the whole instance.',
      fix: 'Lower `work_mem` and `max_connections`, consider `vm.overcommit_memory = 2`, and protect the postmaster with `oom_score_adj = -1000` while `PG_OOM_ADJUST_FILE` resets children to 0.' },
  ],
  pointers: [
    '**Postmaster** = first process. It forks a **backend** per connection and supervises the **auxiliary** processes.',
    '`max_connections` (default 100) is fixed at start; `superuser_reserved_connections` (3) keeps slots for emergencies.',
    '`pg_stat_activity.state`: **active**, **idle**, **idle in transaction**. The last one holds locks and blocks cleanup.',
    'One backend crash makes the postmaster **terminate everyone and run crash recovery**.',
    'Shutdown modes: **smart** (SIGTERM, wait), **fast** (SIGINT, abort transactions), **immediate** (SIGQUIT, recovery on next start). `pg_ctl restart` = fast stop + start.',
  ],
  sources: ['connect-estab.html', 'glossary.html', 'server-start.html', 'server-shutdown.html', 'kernel-resources.html', 'runtime-config-connection.html', 'runtime-config-error-handling.html', 'monitoring-stats.html', 'view-pg-backend-memory-contexts.html', 'functions-admin.html'],
}
