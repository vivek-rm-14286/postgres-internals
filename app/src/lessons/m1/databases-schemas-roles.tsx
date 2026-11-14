import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, T } from './_kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer, three modes:
 *  1. search_path resolver: implicit pg_temp (relations only) and pg_catalog, "$user" expansion,
 *     schemas that do not exist or lack USAGE silently skipped (verified with current_schemas() on PG18),
 *     first match wins, creation target = first usable listed schema.
 *  2. pg_hba.conf: rules scanned top to bottom, first full match decides, no fall-through.
 *  3. Role membership: the joe / admin / wheel / island example from the docs (INHERIT and SET options).
 * ---------------------------------------------------------------------------------------------- */

type Mode = 'path' | 'hba' | 'roles'

/* ---------- 1. search_path ---------- */
type Role = 'alice' | 'bob' | 'postgres'
type Kind = 'table' | 'view' | 'function'
interface Schema { name: string; owner: string; usage: Role[]; create: Role[]; objs: [string, Kind][]; implicit?: boolean }
const SCHEMAS: Schema[] = [
  { name: 'pg_temp_3', owner: 'session', usage: ['alice', 'bob', 'postgres'], create: ['alice', 'bob', 'postgres'], objs: [['orders', 'table']], implicit: true },
  { name: 'pg_catalog', owner: 'postgres', usage: ['alice', 'bob', 'postgres'], create: ['postgres'], objs: [['pg_class', 'table'], ['now()', 'function'], ['lower()', 'function']], implicit: true },
  { name: 'alice', owner: 'alice', usage: ['alice', 'postgres'], create: ['alice', 'postgres'], objs: [['report', 'table']] },
  { name: 'sales', owner: 'postgres', usage: ['bob', 'postgres'], create: ['postgres'], objs: [['orders', 'table'], ['report', 'view']] },
  { name: 'public', owner: 'pg_database_owner', usage: ['alice', 'bob', 'postgres'], create: ['postgres'], objs: [['orders', 'table'], ['audit', 'table'], ['now()', 'function']] },
]
const PATHS: [string, string[]][] = [
  ['"$user", public', ['$user', 'public']],
  ['sales, public', ['sales', 'public']],
  ['public, pg_catalog', ['public', 'pg_catalog']],
  ["'' (empty)", []],
]
const NAMES = ['orders', 'report', 'now()', 'audit', 'pg_class']
interface Visit { schema: string; why: string; t: Tone; hit?: boolean; implicit?: boolean }

function resolve(role: Role, path: string[], name: string, temp: boolean) {
  const isFunc = name.endsWith('()')
  const listed = path.map((p) => (p === '$user' ? role : p))
  const order: { s: string; implicit: boolean }[] = []
  if (temp && !isFunc) order.push({ s: 'pg_temp_3', implicit: true })
  if (!listed.includes('pg_catalog')) order.push({ s: 'pg_catalog', implicit: true })
  listed.forEach((s) => order.push({ s, implicit: false }))
  const visits: Visit[] = []
  let found: string | null = null
  let foundKind: Kind | null = null
  for (const { s, implicit } of order) {
    const raw = path[listed.indexOf(s)]
    const sc = SCHEMAS.find((x) => x.name === s)
    const label = raw === '$user' ? `"$user" → ${s}` : s
    if (found) { visits.push({ schema: label, why: 'not searched', t: 'muted', implicit }); continue }
    if (!sc) { visits.push({ schema: label, why: 'schema does not exist: skipped', t: 'muted', implicit }); continue }
    if (!sc.usage.includes(role) && role !== 'postgres') { visits.push({ schema: label, why: 'no USAGE privilege: skipped silently', t: 'dead', implicit }); continue }
    const o = sc.objs.find(([n]) => n === name)
    if (o) { found = s; foundKind = o[1]; visits.push({ schema: label, why: `found ${o[1]} ${s}.${name}`, t: 'ok', hit: true, implicit }) }
    else visits.push({ schema: label, why: `no ${isFunc ? 'function' : 'relation'} named ${name}`, t: 'header', implicit })
  }
  // creation target: first listed schema that exists and is usable
  const target = listed.find((s) => { const sc = SCHEMAS.find((x) => x.name === s); return sc && (sc.usage.includes(role) || role === 'postgres') && s !== 'pg_catalog' }) ?? null
  const canCreate = target ? role === 'postgres' || SCHEMAS.find((x) => x.name === target)!.create.includes(role) : false
  return { visits, found, foundKind, target, canCreate, isFunc }
}

function PathMode() {
  const [role, setRole] = useState<Role>('alice')
  const [pi, setPi] = useState(0)
  const [ni, setNi] = useState(0)
  const [temp, setTemp] = useState(false)
  const path = PATHS[pi][1]
  const name = NAMES[ni]
  const r = resolve(role, path, name, temp)
  const key = `${role}-${pi}-${ni}-${temp}`
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Current role" value={role} onChange={setRole} options={[['alice', 'alice'], ['bob', 'bob (sales_team)'], ['postgres', 'postgres (superuser)']]} />
        <Btn primary testid="viz-next" onClick={() => setNi((n) => (n + 1) % NAMES.length)}>Resolve next name</Btn>
        <Btn onClick={() => setPi((n) => (n + 1) % PATHS.length)}>Next search_path</Btn>
        <Btn onClick={() => setTemp((t) => !t)} t={temp ? 'new' : undefined}>{temp ? 'DROP TEMP TABLE orders' : 'CREATE TEMP TABLE orders'}</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
        <span className="rounded border border-line bg-bg px-2 py-1">SET search_path = {PATHS[pi][0]};</span>
        <span className="rounded border border-line bg-bg px-2 py-1">SELECT … FROM <b style={{ color: tone('accent') }}>{name}</b></span>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {SCHEMAS.map((sc) => {
          const v = r.visits.find((x) => x.schema.endsWith(sc.name))
          const order = r.visits.findIndex((x) => x.schema.endsWith(sc.name))
          const t: Tone = v ? v.t : 'muted'
          return (
            <motion.div key={sc.name} layout className="rounded-lg border p-2" style={{ borderColor: v ? tone(t) : 'var(--border)', background: v ? toneBg(t, v.hit ? 20 : 8) : 'transparent', opacity: v ? 1 : 0.45 }}>
              <div className="flex items-center justify-between font-mono text-[12px] font-bold">
                <span>{sc.name}</span>
                {order >= 0 && <motion.span key={key} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: order * 0.25 }} className="rounded-full px-1.5 text-[11px] text-white" style={{ background: tone(t) }}>{order + 1}</motion.span>}
              </div>
              <p className="text-[11px] text-muted">owner {sc.owner}{sc.implicit ? ' · implicit' : ''}</p>
              <ul className="mt-1 space-y-0.5 font-mono text-[11.5px]">
                {sc.objs.filter(([n]) => sc.name !== 'pg_temp_3' || temp || n !== 'orders').map(([n, k]) => (
                  <li key={n} className="flex justify-between rounded px-1" style={r.found === sc.name && n === name ? { background: toneBg('ok', 35) } : undefined}>
                    <span>{n}</span><span className="text-muted">{k}</span>
                  </li>
                ))}
                {sc.name === 'pg_temp_3' && !temp && <li className="text-muted">(no temp tables)</li>}
              </ul>
              <p className="mt-1 text-[11px]" style={{ color: sc.usage.includes(role) || role === 'postgres' ? tone('ok') : tone('dead') }}>{sc.usage.includes(role) || role === 'postgres' ? 'USAGE ✓' : 'no USAGE'}{sc.create.includes(role) || role === 'postgres' ? ' · CREATE ✓' : ''}</p>
            </motion.div>
          )
        })}
      </div>
      <div className="rounded-lg border border-line bg-surface-2 p-3">
        <ol className="space-y-1 font-mono text-[12px]">
          <AnimatePresence mode="popLayout">
            {r.visits.map((v, k) => (
              <motion.li key={`${key}-${k}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.25 }} className="flex gap-2">
                <span className="w-5 text-right text-muted">{k + 1}.</span>
                <span className="w-40 shrink-0 font-semibold">{v.schema}{v.implicit ? ' *' : ''}</span>
                <span style={{ color: v.t === 'muted' ? 'var(--muted)' : tone(v.t) }}>{v.why}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        <motion.p key={`res-${key}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: r.visits.length * 0.25 }} className="mt-2 text-sm">
          <Md>{r.found
            ? `Resolves to **${r.found}.${name}**. Only now are privileges on the object itself checked${r.foundKind === 'function' ? ' (EXECUTE)' : ' (for example SELECT)'}.`
            : `**ERROR:** ${r.isFunc ? `function ${name.replace('()', '')}() does not exist` : `relation "${name}" does not exist`}, even though the name may exist in a schema that was skipped.`}</Md>
        </motion.p>
        <p className="mt-1 text-xs text-muted"><Md>{`* searched implicitly. \`current_schema()\` = **${r.target ?? 'NULL'}**: \`CREATE TABLE t\` would ${r.target ? (r.canCreate ? `go to \`${r.target}.t\`` : `fail with *permission denied for schema ${r.target}* (no CREATE privilege)`) : 'fail with *no schema has been selected to create in*'}.`}</Md></p>
      </div>
    </div>
  )
}

/* ---------- 2. pg_hba.conf ---------- */
interface Rule { type: string; db: string; user: string; addr: string; method: string }
const RULES: Rule[] = [
  { type: 'local', db: 'all', user: 'postgres', addr: '', method: 'peer' },
  { type: 'local', db: 'all', user: 'all', addr: '', method: 'scram-sha-256' },
  { type: 'host', db: 'shop', user: 'app', addr: '10.0.0.0/8', method: 'scram-sha-256' },
  { type: 'hostssl', db: 'all', user: '+analysts', addr: '10.0.0.0/8', method: 'scram-sha-256' },
  { type: 'host', db: 'all', user: 'all', addr: '10.0.0.0/8', method: 'reject' },
  { type: 'host', db: 'all', user: 'all', addr: '0.0.0.0/0', method: 'trust' },
]
interface Attempt { label: string; conn: 'local' | 'tcp'; ssl: boolean; ip: string; db: string; user: string; member?: string; badPw?: boolean }
const ATTEMPTS: Attempt[] = [
  { label: 'psql -U postgres (Unix socket)', conn: 'local', ssl: false, ip: '', db: 'shop', user: 'postgres' },
  { label: 'app from 10.0.4.17 → shop', conn: 'tcp', ssl: false, ip: '10.0.4.17', db: 'shop', user: 'app' },
  { label: 'app, wrong password', conn: 'tcp', ssl: false, ip: '10.0.4.17', db: 'shop', user: 'app', badPw: true },
  { label: 'dana (analysts) over SSL → sales', conn: 'tcp', ssl: true, ip: '10.0.9.2', db: 'sales', user: 'dana', member: 'analysts' },
  { label: 'dana without SSL → sales', conn: 'tcp', ssl: false, ip: '10.0.9.2', db: 'sales', user: 'dana', member: 'analysts' },
  { label: 'app from 203.0.113.5 → shop', conn: 'tcp', ssl: false, ip: '203.0.113.5', db: 'shop', user: 'app' },
]
const inNet = (ip: string, cidr: string) => {
  if (cidr === '0.0.0.0/0') return true
  const [net, bits] = cidr.split('/')
  const toN = (s: string) => s.split('.').reduce((a, b) => a * 256 + +b, 0)
  const mask = 2 ** 32 - 2 ** (32 - +bits)
  return (toN(ip) & mask) >>> 0 === (toN(net) & mask) >>> 0
}
function check(r: Rule, a: Attempt): [boolean, boolean, boolean, boolean] {
  const typeOk = a.conn === 'local' ? r.type === 'local' : r.type === 'host' || (r.type === 'hostssl' && a.ssl) || (r.type === 'hostnossl' && !a.ssl)
  const dbOk = r.db === 'all' || r.db === a.db
  const userOk = r.user === 'all' || r.user === a.user || (r.user.startsWith('+') && a.member === r.user.slice(1))
  const addrOk = a.conn === 'local' ? true : inNet(a.ip, r.addr)
  return [typeOk, dbOk, userOk, addrOk]
}

function HbaMode() {
  const [ai, setAi] = useState(0)
  const [trustLast, setTrustLast] = useState(false)
  const rules = trustLast ? RULES : RULES.slice(0, 5)
  const a = ATTEMPTS[ai]
  const results = rules.map((r) => check(r, a))
  const hit = results.findIndex((c) => c.every(Boolean))
  const rule = hit >= 0 ? rules[hit] : null
  const enc = a.ssl ? 'SSL encryption' : 'no encryption'
  const outcome = !rule
    ? `FATAL:  no pg_hba.conf entry for host "${a.ip || '[local]'}", user "${a.user}", database "${a.db}", ${enc}`
    : rule.method === 'reject'
      ? `FATAL:  pg_hba.conf rejects connection for host "${a.ip}", user "${a.user}", database "${a.db}", ${enc}`
      : a.badPw
        ? `FATAL:  password authentication failed for user "${a.user}"`
        : rule.method === 'trust' ? 'connected without a password (trust)' : `authenticated with ${rule.method}: connected`
  const good = rule && rule.method !== 'reject' && !a.badPw
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setAi((n) => (n + 1) % ATTEMPTS.length)}>Next connection attempt</Btn>
        <Btn onClick={() => setTrustLast((t) => !t)} t={trustLast ? 'dead' : undefined}>{trustLast ? 'Remove line 6 (trust)' : 'Append a catch-all trust line'}</Btn>
      </div>
      <div className="flex flex-wrap gap-1.5 font-mono text-[12px]">
        <Tag t="accent">{a.conn === 'local' ? 'local socket' : `TCP ${a.ip}`}</Tag><Tag t="accent">{a.ssl ? 'SSL' : 'no SSL'}</Tag><Tag t="accent">db {a.db}</Tag><Tag t="accent">user {a.user}{a.member ? ` ∈ ${a.member}` : ''}</Tag>{a.badPw && <Tag t="dead">wrong password</Tag>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-bg scrollbar-thin">
        <table className="w-full min-w-[560px] border-collapse font-mono text-[12px]">
          <thead><tr className="text-left text-muted"><th className="px-2 py-1">#</th><th className="px-2">type</th><th className="px-2">database</th><th className="px-2">user</th><th className="px-2">address</th><th className="px-2">method</th><th className="px-2">verdict</th></tr></thead>
          <tbody>
            {rules.map((r, k) => {
              const c = results[k]
              const scanned = hit < 0 || k <= hit
              const isHit = k === hit
              const cell = (ok: boolean, v: string) => <td className="px-2 py-1" style={{ color: !scanned ? 'var(--muted)' : ok ? tone('ok') : tone('dead') }}>{v || '—'}</td>
              return (
                <motion.tr key={`${ai}-${k}-${trustLast}`} initial={{ opacity: 0.2 }} animate={{ opacity: scanned ? 1 : 0.4 }} transition={{ delay: k * 0.22 }}
                  className="border-t border-line" style={isHit ? { background: toneBg(r.method === 'reject' ? 'dead' : 'ok', 18) } : undefined}>
                  <td className="px-2 py-1 text-muted">{k + 1}</td>
                  {cell(c[0], r.type)}{cell(c[1], r.db)}{cell(c[2], r.user)}{cell(c[3], r.addr)}
                  <td className="px-2 py-1 font-semibold">{r.method}</td>
                  <td className="px-2 py-1 text-[11px]">{isHit ? <b>first match: used</b> : scanned ? <span className="text-muted">no match</span> : <span className="text-muted">never read</span>}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <motion.p key={`${ai}-${trustLast}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.max(hit, rules.length - 1) * 0.22 + 0.3 }}
        className="rounded-lg border px-3 py-2 font-mono text-[12px]" style={{ borderColor: tone(good ? 'ok' : 'dead'), background: toneBg(good ? 'ok' : 'dead', 12) }}>
        {outcome}
      </motion.p>
      <p className="text-xs text-muted"><Md>{a.badPw ? 'A failed password on the matching line ends the attempt. Later lines are **never** tried, even a `trust` line.' : trustLast ? 'Line 6 only matters for clients that no earlier line matched. Putting a broad `trust` line anywhere is a hole.' : 'Green cells match, red cells do not. The first line where all four match decides the method. No line at all means rejection.'}</Md></p>
    </div>
  )
}

/* ---------- 3. role membership ---------- */
type RName = 'joe' | 'admin' | 'wheel' | 'island'
const NODES: Record<RName, { x: number; y: number; priv: string }> = {
  joe: { x: 16, y: 95, priv: 'SELECT on notes' },
  admin: { x: 320, y: 22, priv: 'UPDATE on payroll' },
  wheel: { x: 614, y: 22, priv: 'TRUNCATE on logs' },
  island: { x: 320, y: 168, priv: 'SELECT on islands' },
}
const EDGES: [RName, RName, boolean, boolean][] = [ // member → role, INHERIT, SET
  ['joe', 'admin', true, true], ['admin', 'wheel', false, true], ['joe', 'island', true, false],
]
const effective = (cur: RName): RName[] => {
  const out = new Set<RName>([cur])
  let grew = true
  while (grew) { grew = false; for (const [m, r, inh] of EDGES) if (inh && out.has(m) && !out.has(r)) { out.add(r); grew = true } }
  return [...out]
}
const canSet = (target: RName): boolean => {
  if (target === 'joe') return true
  const ok = new Set<RName>(['joe'])
  let grew = true
  while (grew) { grew = false; for (const [m, r, , set] of EDGES) if (set && ok.has(m) && !ok.has(r)) { ok.add(r); grew = true } }
  return ok.has(target)
}
const ORDER: RName[] = ['joe', 'admin', 'wheel', 'island']

function RolesMode() {
  const [k, setK] = useState(0)
  const target = ORDER[k]
  const allowed = canSet(target)
  const cur: RName = allowed ? target : 'joe'
  const eff = effective(cur)
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setK((n) => (n + 1) % ORDER.length)}>Next SET ROLE</Btn>
        <span className="font-mono text-[12px]">session_user = joe · <b>{target === 'joe' ? 'RESET ROLE' : `SET ROLE ${target}`}</b></span>
        {!allowed && <Tag t="dead">ERROR: permission denied to set role &quot;{target}&quot;</Tag>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 780 232" className="w-full min-w-[600px]" role="img" aria-label="Role membership graph">
          <defs><marker id="rm" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" /></marker></defs>
          {EDGES.map(([m, r, inh, set]) => {
            const a = NODES[m], b = NODES[r]
            const live = inh && eff.includes(m) && eff.includes(r)
            return (
              <g key={`${m}-${r}`}>
                <motion.line x1={a.x + 150} y1={a.y + 23} x2={b.x - 2} y2={b.y + 23} stroke={live ? tone('ok') : 'var(--muted)'} strokeWidth={live ? 2.4 : 1.2} strokeDasharray={inh ? undefined : '5 4'} markerEnd="url(#rm)" initial={false} animate={{ opacity: 1 }} />
                <rect x={(a.x + 150 + b.x) / 2 - 56} y={(a.y + b.y) / 2 + 14} width={112} height={18} rx={4} fill="var(--surface)" stroke="var(--border)" />
                <T x={(a.x + 150 + b.x) / 2} y={(a.y + b.y) / 2 + 27} size={9.5} anchor="middle" fill={inh ? tone('ok') : tone('dead')}>{`INHERIT ${inh ? '✓' : '✗'}  ·  SET ${set ? '✓' : '✗'}`}</T>
              </g>
            )
          })}
          {ORDER.map((n) => {
            const p = NODES[n]
            const active = eff.includes(n)
            const isCur = n === cur
            const t: Tone = isCur ? 'accent' : active ? 'ok' : 'muted'
            return (
              <motion.g key={n} initial={false} animate={{ opacity: active ? 1 : 0.55 }}>
                <rect x={p.x} y={p.y} width={150} height={46} rx={8} fill={toneBg(t, active ? 22 : 8)} stroke={tone(t)} strokeWidth={isCur ? 2.6 : 1.2} />
                <T x={p.x + 10} y={p.y + 18} size={12} w={700}>{n}{n === 'joe' ? ' (LOGIN)' : ''}</T>
                <T x={p.x + 10} y={p.y + 35} size={10} fill="var(--muted)">{p.priv}</T>
              </motion.g>
            )
          })}
        </svg>
      </div>
      <p className="text-sm"><Md>{`Privileges in effect as **${cur}**: ${eff.map((e) => `\`${NODES[e].priv}\``).join(', ')}.`}</Md></p>
      <p className="text-xs text-muted"><Md>{!allowed
        ? '`island` was granted `WITH SET FALSE`: joe *inherits* its privileges but may never become it.'
        : cur === 'joe'
          ? 'joe inherits **admin** and **island**. The chain stops at **wheel** because admin\'s grant has `INHERIT FALSE`.'
          : cur === 'wheel'
            ? 'SET ROLE may jump along any chain of `SET TRUE` grants (joe → admin → wheel). Afterwards only wheel\'s privileges apply.'
            : 'After SET ROLE admin only admin\'s own privileges, plus what admin inherits, apply. Attributes like LOGIN, CREATEDB and CREATEROLE are never inherited.'}</Md></p>
    </div>
  )
}

function NamespaceViz() {
  const [mode, setMode] = useState<Mode>('path')
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Mode" value={mode} onChange={setMode} options={[['path', 'search_path resolver'], ['hba', 'pg_hba.conf first match'], ['roles', 'role membership']]} />
      </div>
      <Legend items={[['ok', 'match / privilege in effect'], ['header', 'searched, not found'], ['dead', 'skipped or rejected'], ['muted', 'not reached'], ['accent', 'current input / role']]} />
      {mode === 'path' ? <PathMode /> : mode === 'hba' ? <HbaMode /> : <RolesMode />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'databases-schemas-roles',
  module: 'm1',
  order: 5,
  title: 'Databases, schemas, search_path and roles',
  tldr: [
    'A cluster holds isolated **databases**, each database holds **schemas** that act as namespaces, and **roles** are cluster-wide identities whose privileges and memberships decide what a session may touch.',
    'These layers let many applications and teams share one server safely, with `search_path` choosing which schema an unqualified name means and `pg_hba.conf` deciding who may connect at all.',
  ],
  visualizer: {
    title: 'Name resolution, authentication and membership',
    caption: 'Resolve names as different roles and search paths, and create a temp table to shadow one. Switch modes to replay connection attempts against `pg_hba.conf`, and to walk the joe / admin / wheel / island membership chain.',
    Component: NamespaceViz,
  },
  playground: {
    setup: `
CREATE FUNCTION public.try(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE d text;
BEGIN EXECUTE q; RETURN 'OK';
EXCEPTION WHEN others THEN
  GET STACKED DIAGNOSTICS d = PG_EXCEPTION_DETAIL;
  RETURN SQLSTATE || ': ' || SQLERRM || CASE WHEN d <> '' THEN ' | ' || replace(d, E'\\n', '; ') ELSE '' END;
END $$;
CREATE ROLE alice LOGIN;
CREATE ROLE bob LOGIN;
CREATE ROLE sales_team NOLOGIN;
GRANT sales_team TO bob;
CREATE SCHEMA sales;
GRANT USAGE ON SCHEMA sales TO sales_team;
CREATE SCHEMA alice AUTHORIZATION alice;
CREATE TABLE public.orders (id int, note text);
INSERT INTO public.orders VALUES (1, 'public copy'), (2, 'public copy');
CREATE TABLE sales.orders (id int, amount numeric);
INSERT INTO sales.orders SELECT g, g * 10 FROM generate_series(1, 5) g;
GRANT SELECT ON public.orders TO PUBLIC;
GRANT SELECT ON sales.orders TO sales_team;
CREATE ROLE joe LOGIN;
CREATE ROLE admin;
CREATE ROLE wheel;
CREATE ROLE island;
GRANT admin TO joe WITH INHERIT TRUE;
GRANT wheel TO admin WITH INHERIT FALSE;
GRANT island TO joe WITH INHERIT TRUE, SET FALSE;
-- an accounting schema for the privilege presets
CREATE ROLE simon LOGIN;
CREATE SCHEMA accounting;
CREATE TABLE accounting.invoices (
  invoice_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_date date NOT NULL,
  amount       numeric(10,2) NOT NULL
);
CREATE TABLE accounting.legacy_invoices (invoice_id serial PRIMARY KEY, amount numeric(10,2) NOT NULL);
INSERT INTO accounting.invoices (invoice_date, amount) VALUES ('2024-03-15', 250.50), ('2024-01-20', 110.99), ('2024-03-29', 1000);
SET search_path = "$user", public;`,
    presets: [
      { label: 'Databases, templates, per-database settings', sql: `CREATE DATABASE shop TEMPLATE template1;
ALTER DATABASE shop SET work_mem = '64MB';

SELECT datname, datistemplate, datallowconn, datconnlimit, pg_get_userbyid(datdba) AS owner
FROM pg_database ORDER BY oid;

SELECT d.datname, s.setconfig AS session_defaults
FROM pg_db_role_setting s JOIN pg_database d ON d.oid = s.setdatabase;

DROP DATABASE shop;`,
        note: '`CREATE DATABASE` is a file-level copy of `template1` unless told otherwise; `template0` stays pristine and refuses connections. `ALTER DATABASE … SET` stores a default that every **new** session in `shop` picks up. A connection cannot see into `shop` from here.' },
      { label: 'search_path as alice', sql: `SET ROLE alice;
SELECT current_user, current_schemas(true) AS effective_path, current_schema() AS creates_in;

SELECT public.try('CREATE TABLE notes (id int)') AS create_unqualified,
       public.try('CREATE TABLE public.notes2 (id int)') AS create_in_public;
RESET ROLE;

SELECT relnamespace::regnamespace AS schema, relname FROM pg_class WHERE relname LIKE 'notes%';`,
        note: '`"$user"` expands to `alice`, which exists, so new tables land there. Since PostgreSQL 15, ordinary roles have **no CREATE on public**: SQLSTATE 42501.' },
      { label: 'Same name, different table, then a temp table', sql: `SET search_path = sales, public;

SET ROLE alice;
SELECT current_schemas(false) AS alice_path;
SELECT n.nspname AS resolved_schema, count(*) FROM orders o
JOIN pg_class c ON c.oid = o.tableoid JOIN pg_namespace n ON n.oid = c.relnamespace GROUP BY 1;
RESET ROLE;

SET ROLE bob;
SELECT current_schemas(false) AS bob_path;
SELECT n.nspname AS resolved_schema, count(*) FROM orders o
JOIN pg_class c ON c.oid = o.tableoid JOIN pg_namespace n ON n.oid = c.relnamespace GROUP BY 1;
RESET ROLE;

-- a temp table beats every schema on the path
CREATE TEMP TABLE orders (id int);
SELECT current_schemas(true) AS effective_path,
       (SELECT count(*) FROM orders) AS rows_seen, (SELECT count(*) FROM sales.orders) AS rows_in_sales;
DROP TABLE pg_temp.orders;`,
        note: 'alice has no USAGE on `sales`, so it is **silently dropped** from her path and `orders` means `public.orders` (2 rows). bob inherits USAGE from `sales_team` and gets `sales.orders` (5 rows). The temp schema is searched first for relations, so `orders` then hits the empty temp table.' },
      { label: 'The permission ladder: schema, table, sequence', sql: `SET ROLE simon;
SELECT public.try('SELECT count(*) FROM accounting.invoices') AS step_1;
RESET ROLE;
GRANT USAGE ON SCHEMA accounting TO simon;

SET ROLE simon;
SELECT public.try('SELECT count(*) FROM accounting.invoices') AS step_2;
RESET ROLE;
GRANT SELECT, INSERT ON accounting.invoices, accounting.legacy_invoices TO simon;

SET ROLE simon;
SELECT public.try($$INSERT INTO accounting.invoices (invoice_date, amount) VALUES ('2024-04-01', 75)$$) AS identity_table,
       public.try($$INSERT INTO accounting.legacy_invoices (amount) VALUES (75)$$) AS serial_table;
RESET ROLE;

SELECT relname, relkind, relacl FROM pg_class
WHERE relnamespace = 'accounting'::regnamespace AND relkind IN ('r', 'S') ORDER BY 1;`,
        note: 'Each gate is checked in order: **USAGE** on the schema, then the table privilege. The identity insert works, but the `serial` table also needs **USAGE on its sequence** (42501). In `relacl`, `simon=ar/postgres` reads: simon may a(ppend = INSERT) and r(ead = SELECT), granted by postgres.' },
      { label: 'Grants are snapshots; default privileges are not', sql: `CREATE ROLE accounting_ro NOLOGIN;
GRANT USAGE ON SCHEMA accounting TO accounting_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA accounting TO accounting_ro;
GRANT accounting_ro TO simon;

CREATE TABLE accounting.customers (id int, name text);   -- created after the GRANT
ALTER DEFAULT PRIVILEGES IN SCHEMA accounting GRANT SELECT ON TABLES TO accounting_ro;
CREATE TABLE accounting.payments (id int);               -- created after ALTER DEFAULT

SET ROLE simon;
SELECT public.try('SELECT * FROM accounting.customers') AS customers,
       public.try('SELECT * FROM accounting.payments') AS payments;
RESET ROLE;

SELECT pg_get_userbyid(defaclrole) AS for_objects_created_by, defaclnamespace::regnamespace AS in_schema, defaclacl
FROM pg_default_acl;

GRANT pg_read_all_data TO simon;
SET ROLE simon;
SELECT public.try('SELECT * FROM accounting.customers') AS with_pg_read_all_data;
RESET ROLE;
REVOKE pg_read_all_data FROM simon;`,
        note: '`ON ALL TABLES` grants on the tables that exist **now**; `customers` was missed. Default privileges apply to tables created later, but only by the role in `for_objects_created_by`. The predefined `pg_read_all_data` covers every table and schema at once.' },
      { label: 'INHERIT vs SET (joe, admin, wheel, island)', sql: `SELECT r.rolname AS granted_role, m.rolname AS member, a.inherit_option, a.set_option, a.admin_option
FROM pg_auth_members a JOIN pg_roles r ON r.oid = a.roleid JOIN pg_roles m ON m.oid = a.member
WHERE m.rolname IN ('joe', 'admin') ORDER BY 2, 1;

-- act as if joe had logged in (allowed because the login role is a superuser)
SET SESSION AUTHORIZATION joe;
SELECT pg_has_role('joe', 'admin', 'USAGE') AS uses_admin, pg_has_role('joe', 'wheel', 'USAGE') AS uses_wheel,
       pg_has_role('joe', 'island', 'USAGE') AS uses_island;
SELECT public.try('SET ROLE wheel') AS set_wheel;
SELECT session_user, current_user AS now_acting_as;
SELECT public.try('SET ROLE island') AS set_island;
RESET ROLE;
SET SESSION AUTHORIZATION postgres;
SELECT session_user, current_user;`,
        note: 'joe **inherits** admin and island but not wheel (admin→wheel has INHERIT FALSE). joe may **SET ROLE wheel** through the chain, but never island (SET FALSE). `session_user` stays joe while `current_user` changes.' },
      { label: 'Drop a role that owns things', sql: `CREATE ROLE dana LOGIN;
GRANT USAGE, CREATE ON SCHEMA accounting TO dana;
GRANT SELECT ON accounting.invoices TO dana;
SET ROLE dana;
CREATE TABLE accounting.dana_scratch (id int);
RESET ROLE;

SELECT public.try('DROP ROLE dana') AS first_try;

REASSIGN OWNED BY dana TO postgres;   -- her table now belongs to postgres
DROP OWNED BY dana;                   -- and her grants are revoked
DROP ROLE dana;

SELECT tablename, tableowner FROM pg_tables WHERE tablename = 'dana_scratch';`,
        note: 'The first DROP fails with **2BP01** and the DETAIL lists every dependency: privileges on the schema and table, and the owned table. Both cleanup commands only act on the **current database**, so in production repeat them in each database.' },
      { label: 'Who may connect: pg_hba.conf', sql: `SELECT rule_number, type, database, user_name, address, auth_method, error
FROM pg_hba_file_rules ORDER BY rule_number;

SELECT nspname, pg_get_userbyid(nspowner) AS owner, nspacl FROM pg_namespace
WHERE nspname IN ('public', 'sales', 'alice', 'accounting');`,
        note: 'This sandbox runs with a permissive `trust` file. In production this view is how you test edits before a reload. Schema ACLs: `=U/pg_database_owner` means PUBLIC has USAGE on `public`, but no `C`.' },
    ],
  },
  production: {
    title: 'A read-only reporting role that stays read-only',
    context: 'An analytics team needs to query a shared production database. Today they log in as the application role, which can write everything.',
    problem: 'One mistaken `UPDATE` from a notebook changed live data. The application role also owns the tables, so per-table GRANTs drifted every time a migration created a new table.',
    solution: 'Create a NOLOGIN group with `pg_read_all_data`, give each analyst a LOGIN role that inherits it, pin their search_path, and route them through a dedicated `pg_hba.conf` line that requires SSL.',
    sql: `CREATE ROLE analysts NOLOGIN;
GRANT pg_read_all_data TO analysts;
CREATE ROLE dana LOGIN PASSWORD 'change-me' IN ROLE analysts;
ALTER ROLE dana SET search_path = sales, public;
ALTER ROLE dana SET default_transaction_read_only = on;
-- pg_hba.conf, above any broader host line:
-- hostssl  all  +analysts  10.0.0.0/8  scram-sha-256`,
    outcome: 'New tables are readable without any GRANT, writes fail with SQLSTATE 25006 (read-only transaction) or 42501, and the reload-time `pg_hba_file_rules` check showed the `+analysts` line matched before the catch-all reject.',
  },
  pitfalls: [
    { title: 'CREATE on public in an upgraded database',
      symptom: 'Any role can create tables and functions in `public`, so one user can plant a function that captures another user\'s unqualified calls.',
      cause: 'Databases created before PostgreSQL 15 keep the old default: PUBLIC has CREATE on schema `public`. Upgrades do not change it.',
      fix: 'Revoke it, and give each application its own schema.',
      sql: `REVOKE CREATE ON SCHEMA public FROM PUBLIC;` },
    { title: 'search_path in SECURITY DEFINER functions',
      symptom: 'A privileged function runs a different `lower()` or table than intended when called by an untrusted user.',
      cause: 'The function resolves unqualified names with the caller\'s `search_path`, which the caller controls. Any schema in that path with CREATE for others can shadow names.',
      fix: 'Pin the path on the function and schema-qualify names: `ALTER FUNCTION f() SET search_path = pg_catalog, app;`.' },
    { title: 'pg_hba.conf lines in the wrong order',
      symptom: 'A new `hostssl … scram-sha-256` line has no effect, or a broad line lets clients in without a password.',
      cause: 'Lines are tested top to bottom and the **first** match wins, with no fall-through on failure. A broad line above a narrow one hides it. A common belief is that hba edits need a server restart; a reload re-reads the file, and a restart just adds downtime.',
      fix: 'Put narrow, strong lines first and broad `reject` lines last. Check `pg_hba_file_rules.error`, then `SELECT pg_reload_conf()`.' },
    { title: 'New tables are invisible to the read-only role',
      symptom: 'Reporting worked for months, then every query on a table added by last week\'s migration fails with `permission denied for table …`.',
      cause: '`GRANT SELECT ON ALL TABLES IN SCHEMA` is a one-time snapshot of the tables that exist when it runs. `ALTER DEFAULT PRIVILEGES` covers future tables, but only those created by the role it names (by default, the role that ran it).',
      fix: 'Set default privileges **for the role that runs migrations**, or grant the predefined `pg_read_all_data`.',
      sql: `ALTER DEFAULT PRIVILEGES FOR ROLE migrator IN SCHEMA app
  GRANT SELECT ON TABLES TO reporting;` },
    { title: 'Passwords that leak or use MD5',
      symptom: 'A plaintext password shows up in `~/.psql_history`, or in the server log after a failed statement; or PostgreSQL 18 prints a deprecation warning while a deploy script sets an MD5 password.',
      cause: '`ALTER ROLE … PASSWORD \'…\'` ships the literal password in the SQL text. MD5 password authentication is deprecated and slated for removal; `password_encryption` defaults to `scram-sha-256`.',
      fix: 'Use psql `\\password dana`, which hashes on the client and sends only the SCRAM verifier. Re-set old MD5 passwords so they are stored as SCRAM, and use `scram-sha-256` in `pg_hba.conf`.' },
    { title: 'DROP ROLE fails: role owns objects',
      symptom: '`ERROR: role "dana" cannot be dropped because some objects depend on it`, with a DETAIL such as `privileges for schema accounting; owner of table …`.',
      cause: 'Roles are cluster-wide, but owned objects and grants live in each database. `REASSIGN OWNED` and `DROP OWNED` only see the database you are connected to.',
      fix: 'In **every** database, run `REASSIGN OWNED BY dana TO app_owner;` then `DROP OWNED BY dana;`. Then `DROP ROLE dana;`. A non-superuser needs CREATEROLE **and** ADMIN OPTION on the role to drop it.' },
  ],
  pointers: [
    'Cluster → **databases** (isolated, one per connection) → **schemas** (namespaces) → objects. **Roles** are cluster-wide.',
    '`CREATE DATABASE` is a file copy of **template1** (no other session may be connected to the source); use **template0** for a new encoding or locale.',
    '`search_path` default `"$user", public`. `pg_temp` (relations only) and `pg_catalog` are searched implicitly first; schemas without USAGE are **silently skipped**.',
    'Since 15, PUBLIC has **no CREATE on public**. Membership has **INHERIT**, **SET** and **ADMIN** options; LOGIN, SUPERUSER, CREATEDB, CREATEROLE are never inherited.',
    '`pg_hba.conf`: **first matching line wins**, no fall-through, no match = rejected; a reload applies edits. Gates for a query: CONNECT on the database, **USAGE** on the schema, then the object privilege.',
  ],
  sources: ['manage-ag-templatedbs.html', 'manage-ag-createdb.html', 'ddl-schemas.html', 'ddl-priv.html', 'runtime-config-client.html', 'database-roles.html', 'role-membership.html', 'predefined-roles.html', 'auth-pg-hba-conf.html', 'view-pg-hba-file-rules.html'],
}
