import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Tag, tone, toneBg } from '../../viz/kit'
import { T } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one psql session, from TCP connect to Terminate, at the wire-protocol level.
 * Every message below is encoded byte for byte with the protocol 3.0 framing rules (type byte + Int32
 * length that counts itself), so the lengths shown are the real ones for these exact strings.
 * The table OID / file path and the query result come from the playground setup on PostgreSQL 18.
 * ---------------------------------------------------------------------------------------------- */

const enc = new TextEncoder()
const i32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
const i16 = (n: number) => [(n >>> 8) & 255, n & 255]
const cstr = (s: string) => [...enc.encode(s), 0]
const raw = (s: string) => [...enc.encode(s)]

interface Field { label: string; bytes: number[]; value: string }
interface Msg { dir: 'F' | 'B'; type: string | null; name: string; fields: Field[]; note: string }

const f = (label: string, bytes: number[], value: string): Field => ({ label, bytes, value })
const SQL = 'SELECT city, temp_lo FROM weather WHERE temp_lo < 45;'
const NONCE = 'rOprNGfwEbeRWgbNEkqO'
const SNONCE = '%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0'
const CF = `n,,n=,r=${NONCE}`
const SF = `r=${NONCE}${SNONCE},s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096`
const CFIN = `c=biws,r=${NONCE}${SNONCE},p=dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=`
const SFIN = 'v=6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4='
const PARAMS: [string, string][] = [
  ['application_name', 'psql'], ['client_encoding', 'UTF8'], ['DateStyle', 'ISO, MDY'], ['default_transaction_read_only', 'off'],
  ['in_hot_standby', 'off'], ['integer_datetimes', 'on'], ['IntervalStyle', 'postgres'], ['is_superuser', 'off'],
  ['scram_iterations', '4096'], ['search_path', '"$user", public'], ['server_encoding', 'UTF8'], ['server_version', '18.7'],
  ['session_authorization', 'app'], ['standard_conforming_strings', 'on'], ['TimeZone', 'UTC'],
]
const WEATHER_OID = 16384
const col = (name: string, attnum: number, typoid: number, typlen: number, typmod: number) => [
  f(`field "${name}"`, [...cstr(name), ...i32(WEATHER_OID), ...i16(attnum), ...i32(typoid), ...i16(typlen & 0xffff), ...i32(typmod), ...i16(0)],
    `table ${WEATHER_OID} · col ${attnum} · type ${typoid} · len ${typlen} · typmod ${typmod} · text`),
]
const dataRow = (vals: string[]): Field[] => [f('column count', i16(vals.length), String(vals.length)),
  ...vals.map((v, k) => f(`col ${k + 1}`, [...i32(enc.encode(v).length), ...raw(v)], `len ${enc.encode(v).length} · '${v}'`))]

const MSGS: Msg[] = [
  { dir: 'F', type: null, name: 'StartupMessage', note: 'The only message without a type byte. 196608 = 3 << 16 | 0, protocol 3.0, which libpq still requests by default.',
    fields: [f('protocol', i32(196608), '196608 (3.0)'), f('user', [...cstr('user'), ...cstr('app')], 'app'), f('database', [...cstr('database'), ...cstr('postgres')], 'postgres'),
      f('application_name', [...cstr('application_name'), ...cstr('psql')], 'psql'), f('client_encoding', [...cstr('client_encoding'), ...cstr('UTF8')], 'UTF8'), f('terminator', [0], '\\0')] },
  { dir: 'B', type: 'R', name: 'AuthenticationSASL', note: 'pg_hba.conf chose scram-sha-256, so the server lists the SASL mechanisms it accepts.',
    fields: [f('auth code', i32(10), '10 = SASL'), f('mechanism', cstr('SCRAM-SHA-256'), 'SCRAM-SHA-256'), f('list end', [0], '\\0')] },
  { dir: 'F', type: 'p', name: 'SASLInitialResponse', note: 'Client nonce. The password itself never crosses the wire. (Nonce, salt and proofs are the RFC 7677 test vector.)',
    fields: [f('mechanism', cstr('SCRAM-SHA-256'), 'SCRAM-SHA-256'), f('data length', i32(CF.length), String(CF.length)), f('client-first', raw(CF), CF)] },
  { dir: 'B', type: 'R', name: 'AuthenticationSASLContinue', note: 'Server nonce, salt and iteration count (scram_iterations = 4096).',
    fields: [f('auth code', i32(11), '11 = SASL continue'), f('server-first', raw(SF), SF)] },
  { dir: 'F', type: 'p', name: 'SASLResponse', note: 'The client proves it knows the password.',
    fields: [f('client-final', raw(CFIN), CFIN)] },
  { dir: 'B', type: 'R', name: 'AuthenticationSASLFinal', note: 'The server proves it knows the stored key too: SCRAM authenticates both sides.',
    fields: [f('auth code', i32(12), '12 = SASL final'), f('server-final', raw(SFIN), SFIN)] },
  { dir: 'B', type: 'R', name: 'AuthenticationOk', note: 'Authentication is done. The backend now finishes starting up.',
    fields: [f('auth code', i32(0), '0 = OK')] },
  ...PARAMS.map(([k, v]): Msg => ({ dir: 'B', type: 'S', name: `ParameterStatus ${k}`, note: 'Reported settings. In PostgreSQL 18 search_path is reported too.',
    fields: [f('name', cstr(k), k), f('value', cstr(v), v)] })),
  { dir: 'B', type: 'K', name: 'BackendKeyData', note: 'The backend PID and a secret key. A cancel request must quote both, on a new connection.',
    fields: [f('process id', i32(4711), '4711'), f('secret key', i32(0x5ec7e7), '4 bytes in protocol 3.0 (variable length in 3.2)')] },
  { dir: 'B', type: 'Z', name: 'ReadyForQuery', note: 'Status I = idle, not in a transaction block.',
    fields: [f('status', raw('I'), "'I' idle")] },
  { dir: 'F', type: 'Q', name: 'Query', note: 'Plain text. The client does no parsing at all.',
    fields: [f('query string', cstr(SQL), SQL)] },
  { dir: 'B', type: 'T', name: 'RowDescription', note: 'Column layout: name, source table OID and column number, type OID, size, typmod, format 0 = text.',
    fields: [f('field count', i16(2), '2'), ...col('city', 1, 1043, -1, 84), ...col('temp_lo', 2, 23, 4, -1)] },
  { dir: 'B', type: 'D', name: 'DataRow', note: 'Every value travels as text: the integer 43 is the two bytes "43".', fields: dataRow(['San Francisco', '43']) },
  { dir: 'B', type: 'D', name: 'DataRow', note: 'One DataRow per result row.', fields: dataRow(['Hayward', '37']) },
  { dir: 'B', type: 'C', name: 'CommandComplete', note: 'The command tag. For SELECT it carries the row count.', fields: [f('tag', cstr('SELECT 2'), 'SELECT 2')] },
  { dir: 'B', type: 'Z', name: 'ReadyForQuery', note: 'Back to idle. A T here would mean an open transaction block, E a failed one.', fields: [f('status', raw('I'), "'I' idle")] },
  { dir: 'F', type: 'X', name: 'Terminate', note: 'No payload. The backend closes the socket and exits.', fields: [] },
]
const msgLen = (m: Msg) => 4 + m.fields.reduce((s, x) => s + x.bytes.length, 0)
const msgBytes = (m: Msg) => [...(m.type ? raw(m.type) : []), ...i32(msgLen(m)), ...m.fields.flatMap((x) => x.bytes)]
const idx = (name: string, from = 0) => MSGS.findIndex((m, k) => k >= from && m.name === name)
const AFTER_OK = idx('AuthenticationOk') + 1
const AFTER_READY = idx('ReadyForQuery') + 1
const AFTER_Q = idx('Query') + 1
const AFTER_ROWS = idx('CommandComplete')
const AFTER_DONE = idx('ReadyForQuery', AFTER_Q) + 1

type Focus = 'connect' | 'fork' | 'wire' | 'hba' | 'exec' | 'exit'
interface S { shown: number; backend: boolean; focus: Focus; pkt?: { dir: 'F' | 'B'; label: string }; stage?: number; txt?: string }

const steps: Step<S>[] = [
  { title: 'psql opens a socket to port 5432', body: 'The client connects over TCP, or over the Unix socket `/tmp/.s.PGSQL.5432` on the same host. Only the **postmaster** is listening.',
    state: { shown: 0, backend: false, focus: 'connect' } },
  { title: 'The postmaster forks a backend', body: 'As soon as the connection arrives, the postmaster **forks** a child process. From now on the client talks only to that **backend**.',
    state: { shown: 0, backend: true, focus: 'fork' } },
  { title: 'StartupMessage: who and where', body: 'User `app`, database `postgres`, protocol **3.0**. It is the only message with no type byte. A connection always names exactly one database.',
    state: { shown: 1, backend: true, focus: 'wire', pkt: { dir: 'F', label: 'startup' } } },
  { title: 'pg_hba.conf: the first matching line wins', body: 'The backend scans `pg_hba.conf` top to bottom and takes the **first** line matching connection type, database, user and address. Here that line says `scram-sha-256`.',
    state: { shown: 2, backend: true, focus: 'hba', pkt: { dir: 'B', label: 'R 10' } } },
  { title: 'SCRAM-SHA-256 handshake', body: 'Four messages prove both sides know the password without sending it. **AuthenticationOk** ends the exchange.',
    state: { shown: AFTER_OK, backend: true, focus: 'wire', pkt: { dir: 'B', label: 'R 0' } } },
  { title: 'ParameterStatus, BackendKeyData, ReadyForQuery', body: 'The backend reports 15 settings, hands over its PID and a **cancel key**, then sends **ReadyForQuery** with status `I`. The session is open.',
    state: { shown: AFTER_READY, backend: true, focus: 'wire', pkt: { dir: 'B', label: 'Z I' } } },
  { title: "Query 'Q': the SQL travels as text", body: `The whole statement goes out as one **Query** message of ${msgLen(MSGS[AFTER_Q - 1]) + 1} bytes. psql does not parse it.`,
    state: { shown: AFTER_Q, backend: true, focus: 'wire', pkt: { dir: 'F', label: 'Q' } } },
  { title: 'Parse, rewrite, plan, execute', body: 'The backend builds a parse tree, applies rewrite rules, picks the cheapest plan, then runs it. Pages of `weather` come through **shared buffers** from file `base/5/16384`.',
    state: { shown: AFTER_Q, backend: true, focus: 'exec', stage: 4 } },
  { title: 'Rows stream back as text', body: '**RowDescription** describes the columns. One **DataRow** follows per row. Even the integer travels as the text `43`.',
    state: { shown: AFTER_ROWS, backend: true, focus: 'wire', pkt: { dir: 'B', label: 'T D D' } } },
  { title: "CommandComplete 'SELECT 2', ReadyForQuery", body: 'The command tag carries the row count. **ReadyForQuery** `I` says the backend is idle and waiting for the next query.',
    state: { shown: AFTER_DONE, backend: true, focus: 'wire', pkt: { dir: 'B', label: 'C Z' } } },
  { title: 'Terminate: the backend exits', body: '`\\q` sends **Terminate**. The backend closes the socket and exits, and the postmaster reaps the child. Any open transaction would be **rolled back**.',
    state: { shown: MSGS.length, backend: false, focus: 'exit', pkt: { dir: 'F', label: 'X' } } },
]

const W = 760
const STAGES = ['parse', 'rewrite', 'plan', 'execute']

function Diagram({ s }: { s: S }) {
  const cl = { x: 14, y: 66, w: 150, h: 92 }
  const pm = { x: 296, y: 12, w: 176, h: 58 }
  const be = { x: 296, y: 120, w: 176, h: 100 }
  const sb = { x: 576, y: 12, w: 170, h: 58 }
  const dd = { x: 576, y: 120, w: 170, h: 100 }
  const exec = s.focus === 'exec'
  const wireY = be.y + 40
  const pw = Math.max(40, (s.pkt?.label.length ?? 0) * 7 + 12)
  const pktX = s.pkt?.dir === 'F' ? [cl.x + cl.w + 6, be.x - pw - 6] : [be.x - pw - 6, cl.x + cl.w + 6]
  return (
    <svg viewBox={`0 0 ${W} 232`} className="w-full min-w-[680px]" role="img" aria-label="Client, postmaster, backend, shared buffers and data directory">
      <defs>
        <marker id="m1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" /></marker>
      </defs>
      {/* client */}
      <rect x={cl.x} y={cl.y} width={cl.w} height={cl.h} rx={8} fill={toneBg('accent', 12)} stroke={tone('accent')} />
      <T x={cl.x + 12} y={cl.y + 24} size={13} w={700}>psql</T>
      <T x={cl.x + 12} y={cl.y + 42} size={10.5} fill="var(--muted)">client process (libpq)</T>
      <T x={cl.x + 12} y={cl.y + 64} size={10.5} fill="var(--muted)">user app</T>
      <T x={cl.x + 12} y={cl.y + 80} size={10.5} fill="var(--muted)">db postgres</T>
      {/* postmaster */}
      <rect x={pm.x} y={pm.y} width={pm.w} height={pm.h} rx={8} fill={toneBg('header', s.focus === 'connect' || s.focus === 'fork' ? 26 : 12)} stroke={tone('header')} strokeWidth={s.focus === 'connect' || s.focus === 'fork' ? 2 : 1} />
      <T x={pm.x + 12} y={pm.y + 24} size={13} w={700}>postmaster</T>
      <T x={pm.x + 12} y={pm.y + 42} size={10.5} fill="var(--muted)">listens on :5432, forks</T>
      {/* connect line */}
      <motion.path d={`M${cl.x + cl.w},${cl.y + 18} C${cl.x + cl.w + 70},${cl.y + 18} ${pm.x - 70},${pm.y + 30} ${pm.x},${pm.y + 30}`} fill="none"
        stroke={s.focus === 'connect' ? tone('header') : 'var(--border)'} strokeWidth={s.focus === 'connect' ? 2 : 1.2} strokeDasharray="5 4" markerEnd="url(#m1a)" />
      <T x={cl.x + cl.w + 18} y={cl.y + 8} size={10} fill="var(--muted)">connect()</T>
      {/* backend */}
      <AnimatePresence>
        {s.backend && (
          <motion.g key="be" initial={{ opacity: 0, y: -40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 170, damping: 20 }}>
            <rect x={be.x} y={be.y} width={be.w} height={be.h} rx={8} fill={toneBg('tuple', exec ? 26 : 14)} stroke={tone('tuple')} strokeWidth={exec || s.focus === 'hba' ? 2 : 1} />
            <T x={be.x + 12} y={be.y + 22} size={13} w={700}>backend</T>
            <T x={be.x + be.w - 12} y={be.y + 22} size={10.5} fill="var(--muted)" anchor="end">pid 4711</T>
            {s.focus === 'hba'
              ? <T x={be.x + 12} y={be.y + 46} size={10} fill={tone('new')}>reading pg_hba.conf…</T>
              : <T x={be.x + 12} y={be.y + 46} size={10} fill="var(--muted)">one process, one session</T>}
            {STAGES.map((st, k) => {
              const on = exec && k < (s.stage ?? 0)
              return (
                <motion.g key={st} initial={false} animate={{ opacity: exec ? 1 : 0.35 }} transition={{ delay: exec ? k * 0.25 : 0 }}>
                  <rect x={be.x + 10 + k * 40} y={be.y + 60} width={36} height={26} rx={4} fill={on ? toneBg('new', 30) : 'var(--surface)'} stroke={on ? tone('new') : 'var(--border)'} />
                  <T x={be.x + 28 + k * 40} y={be.y + 77} size={9.5} anchor="middle">{st === 'execute' ? 'exec' : st}</T>
                </motion.g>
              )
            })}
          </motion.g>
        )}
      </AnimatePresence>
      {/* fork arrow */}
      {s.backend && <motion.path d={`M${pm.x + 60},${pm.y + pm.h} L${pm.x + 60},${be.y - 2}`} stroke={s.focus === 'fork' ? tone('header') : 'var(--border)'} strokeWidth={s.focus === 'fork' ? 2 : 1.2} strokeDasharray="4 3" markerEnd="url(#m1a)" />}
      <T x={pm.x + 68} y={pm.y + pm.h + 30} size={10} fill={s.focus === 'fork' ? tone('header') : 'var(--muted)'}>fork()</T>
      {/* wire between client and backend */}
      <line x1={cl.x + cl.w} y1={wireY} x2={be.x} y2={wireY} stroke={s.focus === 'wire' || s.focus === 'hba' ? tone('accent') : 'var(--border)'} strokeWidth={1.6} />
      <T x={cl.x + cl.w + 10} y={wireY + 28} size={10} fill="var(--muted)">wire protocol</T>
      <AnimatePresence mode="wait">
        {s.pkt && (
          <motion.g key={s.pkt.label + s.pkt.dir} initial={{ x: pktX[0], opacity: 0 }} animate={{ x: pktX[1], opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.8, ease: 'easeInOut' }}>
            <rect x={0} y={wireY - 12} width={Math.max(40, s.pkt.label.length * 7 + 12)} height={24} rx={5} fill={s.pkt.dir === 'F' ? tone('accent') : tone('tuple')} />
            <T x={Math.max(40, s.pkt.label.length * 7 + 12) / 2} y={wireY + 4} size={10} w={700} fill="var(--surface)" anchor="middle">{s.pkt.label}</T>
          </motion.g>
        )}
      </AnimatePresence>
      {/* shared buffers + data dir */}
      <rect x={sb.x} y={sb.y} width={sb.w} height={sb.h} rx={8} fill={toneBg('pointer', exec ? 24 : 10)} stroke={tone('pointer')} strokeWidth={exec ? 2 : 1} />
      <T x={sb.x + 12} y={sb.y + 24} size={13} w={700}>shared buffers</T>
      <T x={sb.x + 12} y={sb.y + 42} size={10.5} fill="var(--muted)">8 kB pages, all backends</T>
      <rect x={dd.x} y={dd.y} width={dd.w} height={dd.h} rx={8} fill="var(--surface-2)" stroke="var(--border)" />
      <T x={dd.x + 12} y={dd.y + 22} size={13} w={700}>data directory</T>
      {['base/1/  template1', 'base/4/  template0', 'base/5/  postgres', `  └ ${WEATHER_OID}  weather`].map((l, k) => (
        <T key={l} x={dd.x + 12} y={dd.y + 42 + k * 15} size={10} fill={k === 3 && exec ? tone('new') : 'var(--muted)'}>{l}</T>
      ))}
      {s.backend && <motion.path d={`M${be.x + be.w},${be.y + 30} C${be.x + be.w + 50},${be.y + 30} ${sb.x - 50},${sb.y + 40} ${sb.x},${sb.y + 40}`} fill="none" stroke={exec ? tone('pointer') : 'var(--border)'} strokeWidth={exec ? 2 : 1.2} markerEnd="url(#m1a)" />}
      <motion.path d={`M${sb.x + 60},${sb.y + sb.h} L${sb.x + 60},${dd.y - 2}`} stroke={exec ? tone('pointer') : 'var(--border)'} strokeWidth={exec ? 2 : 1.2} markerEnd="url(#m1a)" markerStart="url(#m1a)" />
      <T x={sb.x + 68} y={sb.y + sb.h + 30} size={10} fill="var(--muted)">read / write pages</T>
    </svg>
  )
}

const hex = (b: number) => b.toString(16).padStart(2, '0')

function Inspector({ m }: { m: Msg }) {
  const len = msgLen(m)
  const all = msgBytes(m)
  return (
    <Panel title={`${m.dir === 'F' ? 'client → server' : 'server → client'} · ${m.name} · ${all.length} bytes on the wire`}>
      <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
        {m.type && <span className="rounded border px-1.5 py-1" style={{ borderColor: tone('header'), background: toneBg('header', 16) }}>type <b>'{m.type}'</b> <span className="text-muted">{hex(m.type.charCodeAt(0))}</span></span>}
        <span className="rounded border px-1.5 py-1" style={{ borderColor: tone('pointer'), background: toneBg('pointer', 16) }}>Int32 length <b>{len}</b> <span className="text-muted">{i32(len).map(hex).join(' ')}</span></span>
        {m.fields.map((x, k) => (
          <span key={k} className="rounded border px-1.5 py-1" style={{ borderColor: tone('tuple'), background: toneBg('tuple', 12) }} title={x.value}>
            {x.label} <span className="text-muted">({x.bytes.length} B)</span>
          </span>
        ))}
      </div>
      {m.fields.length > 0 && (
        <table className="mt-2 w-full border-collapse font-mono text-[11.5px]">
          <tbody>
            {m.fields.map((x, k) => (
              <tr key={k} className="border-b border-line last:border-0 align-top">
                <td className="py-1 pr-3 font-semibold whitespace-nowrap">{x.label}</td>
                <td className="py-1 pr-3 text-muted whitespace-nowrap">{x.bytes.slice(0, 4).map(hex).join(' ')}{x.bytes.length > 4 ? ' …' : ''}</td>
                <td className="py-1 break-all">{x.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-2 text-xs text-muted">{m.note} The length counts itself and the payload, never the type byte.</p>
    </Panel>
  )
}

function WireLog({ shown, sel, onSel }: { shown: number; sel: number; onSel: (i: number) => void }) {
  const rows = MSGS.slice(0, shown)
  // collapse the 15 ParameterStatus messages into one clickable row
  const items: { i: number; label: string; type: string; dir: 'F' | 'B'; len: number; count: number }[] = []
  rows.forEach((m, i) => {
    const prev = items[items.length - 1]
    if (m.type === 'S' && prev?.type === 'S') { prev.count++; prev.len += msgLen(m) + 1; return }
    items.push({ i, label: m.type === 'S' ? 'ParameterStatus' : m.name, type: m.type ?? '—', dir: m.dir, len: msgLen(m) + (m.type ? 1 : 0), count: 1 })
  })
  return (
    <div className="max-h-[220px] overflow-auto rounded-lg border border-line bg-bg scrollbar-thin" aria-label="Wire log">
      <table className="w-full border-collapse font-mono text-[11.5px] whitespace-nowrap">
        <thead><tr className="text-left text-muted"><th className="px-2 py-1">dir</th><th className="px-2 py-1">type</th><th className="px-2 py-1">message</th><th className="px-2 py-1 text-right">bytes</th></tr></thead>
        <tbody>
          <AnimatePresence initial={false}>
            {items.map((it) => (
              <motion.tr key={it.i} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} onClick={() => onSel(it.count > 1 && sel >= it.i && sel < it.i + it.count - 1 ? sel + 1 : it.i)}
                className="cursor-pointer border-t border-line" style={sel === it.i || (it.count > 1 && sel > it.i && sel < it.i + it.count) ? { background: toneBg('new', 16) } : undefined}>
                <td className="px-2 py-0.5" style={{ color: it.dir === 'F' ? tone('accent') : tone('tuple') }}>{it.dir === 'F' ? 'C→S' : 'S→C'}</td>
                <td className="px-2 py-0.5 font-bold">{it.type}</td>
                <td className="px-2 py-0.5">{it.label}{it.count > 1 ? ` × ${it.count} (click to cycle)` : ''}</td>
                <td className="px-2 py-0.5 text-right tabular-nums">{it.len}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {items.length === 0 && <p className="px-3 py-2 text-xs text-muted">No messages yet: a TCP connection carries nothing until the client speaks.</p>}
    </div>
  )
}

function RoundTripViz() {
  const [sel, setSel] = useState<{ step: number; i: number } | null>(null)
  return (
    <Stepper steps={steps} interval={2600} render={(s, stepIdx) => {
      const pick = sel && sel.step === stepIdx && sel.i < s.shown ? sel.i : s.shown - 1
      const total = MSGS.slice(0, s.shown).reduce((a, m) => a + msgLen(m) + (m.type ? 1 : 0), 0)
      return (
        <div className="grid gap-3">
          <Legend items={[['accent', 'client → server message'], ['tuple', 'server → client message / backend'], ['header', 'postmaster'], ['pointer', 'shared memory'], ['new', 'active now']]} />
          <Diagram s={s} />
          {s.focus === 'hba' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-line bg-bg p-2 font-mono text-[11.5px]">
              {[['local', 'all', 'postgres', '', 'peer', false], ['host', 'all', 'all', '127.0.0.1/32', 'scram-sha-256', false], ['host', 'postgres', 'app', '10.0.0.0/8', 'scram-sha-256', true], ['host', 'all', 'all', '0.0.0.0/0', 'reject', false]].map((r, k) => (
                <div key={k} className="grid grid-cols-[18px_40px_70px_60px_96px_104px_1fr] gap-2 rounded px-1" style={r[5] ? { background: toneBg('ok', 20) } : undefined}>
                  <span className="text-muted">{k + 1}</span>{r.slice(0, 5).map((c, j) => <span key={j}>{String(c)}</span>)}<span className="text-muted">{r[5] ? '← first match: used' : k < 2 ? 'no match' : 'never reached'}</span>
                </div>
              ))}
            </motion.div>
          )}
          <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
            <div className="grid gap-1">
              <WireLog shown={s.shown} sel={pick} onSel={(i) => setSel({ step: stepIdx, i })} />
              <p className="text-xs text-muted">{s.shown} message{s.shown === 1 ? '' : 's'}, <b className="text-ink">{total}</b> bytes so far. Click a row to decode it.</p>
            </div>
            {s.shown > 0 ? <Inspector m={MSGS[pick]} /> : <Panel title="Inspector"><p className="text-sm text-muted">Messages appear here once the client sends its StartupMessage.</p></Panel>}
          </div>
          <div className="flex flex-wrap gap-1.5"><Tag t="muted">protocol 3.0</Tag><Tag t="muted">simple query</Tag><Tag t="muted">text results</Tag></div>
        </div>
      )
    }} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'what-is-postgres',
  module: 'm1',
  order: 1,
  title: "What PostgreSQL is: cluster, client/server, a query's round trip",
  tldr: [
    'PostgreSQL is a **client/server** database: one server instance manages a **cluster** of databases in a single data directory, and every client connection gets its own server process.',
    'Clients send SQL as **plain text** over a small message protocol, and the server parses, plans and executes it and streams rows back, so any language with a socket can talk to it.',
  ],
  visualizer: {
    title: "A query's round trip, byte by byte",
    caption: 'Step from TCP connect to Terminate. Click any message in the wire log to decode its bytes. Every length follows protocol 3.0 framing exactly.',
    Component: RoundTripViz,
  },
  playground: {
    setup: `
CREATE TABLE weather (city varchar(80), temp_lo int, temp_hi int, prcp real, date date);
CREATE TABLE cities (name varchar(80), location point);
INSERT INTO weather VALUES
  ('San Francisco', 46, 50, 0.25, '1994-11-27'),
  ('San Francisco', 43, 57, 0.0, '1994-11-29'),
  ('Hayward', 37, 54, NULL, '1994-11-29');
INSERT INTO cities VALUES ('San Francisco', '(-194.0, 53.0)');`,
    presets: [
      { label: 'Who and where am I?', sql: `SELECT version(), current_database(), current_user, pg_backend_pid();

SELECT inet_server_addr() AS server_ip, inet_server_port() AS server_port,
       current_setting('server_version_num') AS version_num,
       date_trunc('second', now() - pg_postmaster_start_time()) AS uptime;`,
        note: 'Every session is one backend process with its own PID, connected to exactly one database as one role. `inet_server_addr()` is NULL when the session did not arrive over TCP (a Unix socket, or this in-process sandbox). Uptime counts from the postmaster start.' },
      { label: 'The query from the visualizer', sql: `SELECT city, temp_lo FROM weather WHERE temp_lo < 45;`,
        note: 'Two rows, so the command tag is `SELECT 2`. In the wire protocol each value travels as text.' },
      { label: 'What lives where', sql: `SELECT oid, datname, datistemplate, datallowconn, pg_size_pretty(pg_database_size(oid)) AS size
FROM pg_database ORDER BY oid;

SELECT spcname, pg_size_pretty(pg_tablespace_size(oid)) AS size FROM pg_tablespace;

SELECT nspname AS schema_in_this_database, pg_get_userbyid(nspowner) AS owner
FROM pg_namespace WHERE nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%' ORDER BY 1;`,
        note: 'initdb creates three databases; `template0` refuses connections. Two tablespaces exist from the start: `pg_default` for database files and `pg_global` for the cluster-wide catalogs (roles, the database list). Schemas belong to one database: this list is only `postgres`\'s.' },
      { label: 'Tables are files', sql: `SELECT relname, oid, relfilenode, pg_relation_filepath(oid::regclass) AS file
FROM pg_class WHERE relname IN ('weather', 'cities');

SELECT setting AS data_directory FROM pg_settings WHERE name = 'data_directory';`,
        note: 'Each table lives in `base/<database oid>/<relfilenode>` under the data directory. Database `postgres` has OID 5.' },
      { label: 'Describe a table without psql', sql: `-- psql's \\d is plain SQL over the catalogs; this is the portable version
SELECT column_name, data_type, character_maximum_length AS max_len, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'weather' ORDER BY ordinal_position;

SELECT c.relname,
       CASE c.relkind WHEN 'r' THEN 'table' WHEN 'i' THEN 'index' WHEN 'S' THEN 'sequence'
                      WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' ELSE c.relkind::text END AS kind,
       c.relpersistence AS persistence, am.amname AS access_method, pg_size_pretty(pg_table_size(c.oid)) AS size
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace LEFT JOIN pg_am am ON am.oid = c.relam
WHERE n.nspname = 'public' ORDER BY 1;`,
        note: 'There is no `SHOW TABLES` or `DESCRIBE`: client tools query `information_schema` and `pg_class`. `varchar(80)` reports as `character varying` with max length 80. Each small table is `heap` storage of exactly one 8 kB page; `p` = permanent.' },
      { label: 'One statement, one transaction', sql: `SELECT pg_current_xact_id() AS xid_1;
SELECT pg_current_xact_id() AS xid_2;

BEGIN;
SELECT pg_current_xact_id() AS xid_in_block;
SELECT pg_current_xact_id() AS same_xid;
COMMIT;`,
        note: 'Outside a block, every statement runs in its own transaction and gets a new xid. Inside BEGIN … COMMIT both reads share one xid.' },
      { label: 'Statement time vs wall clock', sql: `BEGIN;
SELECT now() AS tx_start, statement_timestamp() AS stmt_start;
SELECT pg_sleep(0.05);
SELECT now() = transaction_timestamp() AS now_frozen,
       statement_timestamp() > now() AS stmt_moved,
       clock_timestamp() - now() >= interval '50 ms' AS clock_moved;
COMMIT;`,
        note: '`now()` is fixed at transaction start. `statement_timestamp()` moves when a new statement arrives. `clock_timestamp()` is the real wall clock.' },
      { label: 'Connection settings', sql: `SELECT name, setting, context FROM pg_settings
WHERE name IN ('port', 'listen_addresses', 'unix_socket_directories', 'max_connections', 'authentication_timeout', 'password_encryption')
ORDER BY name;`,
        note: '`context = postmaster` means the value is fixed at server start. These decide where the postmaster listens and how many backends it may fork.' },
    ],
  },
  production: {
    title: 'The migration that ran against the wrong database',
    context: 'A team runs schema migrations from CI with a connection string built from environment variables. Staging and production share one cluster with two databases.',
    problem: 'A migration created its tables in database `postgres` instead of `app_staging`. The connection string had no database name, and libpq defaults the database to the user name: the CI job connected as `postgres`, so it landed in database `postgres`. A later run then failed with `relation does not exist` in the right database.',
    solution: 'Make every migration assert where it is before it changes anything. A connection names exactly one database, and there are no cross-database queries, so check `current_database()` and fail fast. Also set `application_name` so the session is easy to spot in `pg_stat_activity`.',
    sql: `-- first statement of every migration
DO $$
BEGIN
  IF current_database() <> 'app_staging' THEN
    RAISE EXCEPTION 'connected to %, expected app_staging', current_database();
  END IF;
END $$;
SET application_name = 'migrate-2024-06-01';`,
    outcome: 'Misrouted runs now stop on the first statement with a clear message, before any DDL. The stray objects in `postgres` were found with `\\dt` and dropped.',
  },
  pitfalls: [
    { title: 'Expecting cross-database joins',
      symptom: '`SELECT … FROM other_db.public.users` fails with `cross-database references are not implemented`.',
      cause: 'A connection is bound to one database at startup. Databases in a cluster are isolated; only roles, tablespaces and the database list are shared.',
      fix: 'Put related data in one database with several **schemas**. If two databases are truly needed, use `postgres_fdw` or `dblink`.' },
    { title: 'Leaving trust authentication after initdb',
      symptom: 'Any local OS user can connect as the superuser without a password.',
      cause: 'A fresh cluster can allow `trust` for local connections. `pg_hba.conf` uses the first matching line, so a broad `trust` line at the top wins.',
      fix: 'Initialize with `initdb -A scram-sha-256 -W`, or edit `pg_hba.conf` before the first start (on a running server, edit and reload). Check the result in `pg_hba_file_rules`.',
      sql: `SELECT rule_number, type, database, user_name, address, auth_method
FROM pg_hba_file_rules ORDER BY rule_number;` },
    { title: 'Remote clients cannot connect',
      symptom: 'From another host, `psql -h db1` fails with `Connection refused`; after one fix it fails again with `no pg_hba.conf entry for host …`.',
      cause: 'Two separate gates. `listen_addresses` (default `localhost`, restart required) decides which interfaces the postmaster binds; `pg_hba.conf` decides who may then authenticate. Opening `0.0.0.0/0` with `md5` or `trust` fixes the symptom and creates a security hole.',
      fix: 'Bind the interface you need, then add the narrowest hba line with `scram-sha-256` and reload.',
      sql: `-- postgresql.conf (restart): listen_addresses = 'localhost,10.0.0.5'
-- pg_hba.conf (reload):       hostssl app app_user 10.0.0.0/24 scram-sha-256
SELECT name, setting, context FROM pg_settings WHERE name = 'listen_addresses';` },
    { title: 'Assuming each line of a script is separate',
      symptom: 'A script sent as one string fails on its third statement, and the first two statements are gone too.',
      cause: 'Statements in a single simple-query message run as one **implicit transaction**. An error rolls back everything since the start of the string unless explicit COMMITs split it.',
      fix: 'Send statements one at a time (psql does this), or wrap intentional units in explicit `BEGIN … COMMIT` blocks.' },
    { title: 'Dropping a database you are connected to',
      symptom: '`DROP DATABASE shop` fails with `cannot drop the currently open database`, or with `is being accessed by other users`.',
      cause: 'A database cannot be dropped while any backend is connected to it, including your own.',
      fix: 'Connect to another database such as `postgres`, then run `DROP DATABASE shop WITH (FORCE);` to terminate the remaining sessions.' },
  ],
  pointers: [
    'A **cluster** is one data directory managed by one server instance. initdb creates `postgres`, `template1` and `template0`.',
    'Hierarchy: **cluster → database → schema → object**. Roles and databases are cluster-wide; a connection sees one database.',
    'One **postmaster** listens on port 5432 and forks one **backend** per connection.',
    'Every message is **type byte + Int32 length + payload**. A simple query is `Q` → `T`, `D`…, `C`, `Z`.',
    'Inside the backend a query goes **parse → rewrite → plan → execute**, reading pages through shared buffers.',
  ],
  sources: ['tutorial-arch.html', 'creating-cluster.html', 'manage-ag-overview.html', 'connect-estab.html', 'protocol-overview.html', 'protocol-flow.html', 'protocol-message-formats.html', 'query-path.html', 'storage-file-layout.html'],
}
