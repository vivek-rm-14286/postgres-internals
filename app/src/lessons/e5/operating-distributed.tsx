import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Md } from '../../lesson/Md'
import { Btn, Slider, Stat, Tabs, TRY_SQL, erfc, rng } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * 1 Failure detection: a seeded heartbeat stream; phi-accrual suspicion vs a fixed timeout.
 * 2 Partitions and split brain: 5 nodes, two splits, majority quorum on/off, heal and catch up.
 * 3 Node-to-node authentication: a first-match pg_hba.conf evaluator over typical cluster connections.
 * 4 Data residency: where an EU user's row and replicas live, and what reads and writes cost.
 * ---------------------------------------------------------------------------------------------- */

/* ---- 1. phi accrual ---- */

const HORIZON = 6000, CRASH = 4800, HICCUP_AT = 2800
function heartbeats(sigma: number, hiccup: number) {
  const r = rng(20261114)
  const gauss = () => { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
  const out: number[] = [0]
  let t = 0, hic = false
  while (true) {
    let gap = Math.max(20, 100 + sigma * gauss())
    if (!hic && t + gap >= HICCUP_AT) { gap += hiccup; hic = true }
    t += gap
    if (t > CRASH) break
    out.push(Math.round(t))
  }
  return out
}
function phiAt(arr: number[], tau: number, win = 100) {
  let k = arr.length - 1
  while (k > 0 && arr[k] > tau) k--
  const last = arr[k]
  const gaps: number[] = []
  for (let i = Math.max(1, k - win + 1); i <= k; i++) gaps.push(arr[i] - arr[i - 1])
  if (gaps.length < 2) return { phi: 0, delta: tau - last, mu: 100, sd: 10 }
  const mu = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const sd = Math.max(1, Math.sqrt(gaps.reduce((a, b) => a + (b - mu) ** 2, 0) / gaps.length))
  const delta = tau - last
  const p = 0.5 * erfc((delta - mu) / (sd * Math.SQRT2))
  return { phi: Math.min(30, -Math.log10(Math.max(p, 1e-30))), delta, mu, sd }
}

function PhiDetector() {
  const [sigma, setSigma] = useState(15)
  const [hiccup, setHiccup] = useState(250)
  const [Phi, setPhi] = useState(8)
  const [timeout, setTimeoutMs] = useState(200)
  const [cur, setCur] = useState(HORIZON)
  const arr = useMemo(() => heartbeats(sigma, hiccup), [sigma, hiccup])
  const series = useMemo(() => Array.from({ length: HORIZON / 10 + 1 }, (_, i) => ({ t: i * 10, ...phiAt(arr, i * 10) })), [arr])
  const lastBeat = arr[arr.length - 1]
  const ep = (pred: (s: typeof series[number]) => boolean, until: number) => {
    let n = 0, on = false
    for (const s of series) { if (s.t > until) break; const p = pred(s); if (p && !on) n++; on = p }
    return n
  }
  const falsePhi = ep((s) => s.phi >= Phi, lastBeat)
  const falseTo = ep((s) => s.delta > timeout, lastBeat)
  const detPhi = series.find((s) => s.t > lastBeat && s.phi >= Phi)
  const detTo = series.find((s) => s.t > lastBeat && s.delta > timeout)
  const W = 600, H = 170, X = (t: number) => (t / HORIZON) * W, Y = (p: number) => H - 14 - (Math.min(p, 20) / 20) * (H - 24)
  const shown = series.filter((s) => s.t <= cur)
  const path = shown.map((s, i) => `${i ? 'L' : 'M'}${X(s.t).toFixed(1)},${Y(s.phi).toFixed(1)}`).join(' ')
  const now = phiAt(arr, Math.min(cur, HORIZON))
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => setCur((c) => (c >= HORIZON ? 500 : Math.min(HORIZON, c + 500)))}>{cur >= HORIZON ? 'Replay from 0.5 s' : 'Advance 500 ms'}</Btn>
        <Btn onClick={() => setCur(HORIZON)}>Show all</Btn>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 [&>*]:min-w-0">
        <Slider label="heartbeat jitter σ (ms), every ~100 ms" value={sigma} min={2} max={60} onChange={setSigma} show={`${sigma} ms`} />
        <Slider label={`network hiccup at ${HICCUP_AT / 1000} s`} value={hiccup} min={0} max={600} step={10} onChange={setHiccup} show={`+${hiccup} ms`} />
        <Slider label="phi threshold Φ" value={Phi} min={1} max={16} onChange={setPhi} show={String(Phi)} />
        <Slider label="fixed timeout" value={timeout} min={120} max={800} step={10} onChange={setTimeoutMs} show={`${timeout} ms`} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin">
        <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full min-w-[480px]" role="img" aria-label="Phi over time">
          <line x1={0} x2={W} y1={Y(Phi)} y2={Y(Phi)} stroke={tone('dead')} strokeDasharray="5 4" />
          <text x={4} y={Y(Phi) - 4} fontSize={10} fill={tone('dead')}>Φ = {Phi}</text>
          <line x1={X(CRASH)} x2={X(CRASH)} y1={4} y2={H - 10} stroke={tone('muted')} strokeDasharray="2 3" />
          <text x={X(CRASH) + 4} y={14} fontSize={10} fill="var(--muted)">node crashes</text>
          <line x1={X(HICCUP_AT)} x2={X(HICCUP_AT)} y1={4} y2={H - 10} stroke={tone('muted')} strokeDasharray="2 3" />
          <text x={X(HICCUP_AT) + 4} y={26} fontSize={10} fill="var(--muted)">hiccup</text>
          {series.filter((s) => s.t <= cur && s.delta > timeout).map((s) => <rect key={s.t} x={X(s.t)} y={H - 12} width={W / 600 + 0.2} height={6} fill={toneBg('header', 70)} />)}
          {arr.filter((t) => t <= cur).map((t) => <line key={t} x1={X(t)} x2={X(t)} y1={H - 4} y2={H + 6} stroke={tone('ok')} strokeWidth={1} />)}
          <motion.path d={path} fill="none" stroke={tone('accent')} strokeWidth={1.8} />
          <text x={W - 4} y={H + 17} textAnchor="end" fontSize={9.5} fill="var(--muted)">{HORIZON / 1000} s</text>
          <text x={4} y={H + 17} fontSize={9.5} fill="var(--muted)">heartbeats (green ticks) · timeout exceeded (bar)</text>
        </svg>
      </div>
      <Legend items={[['accent', 'φ (suspicion)'], ['dead', 'φ threshold'], ['header', 'gap > fixed timeout'], ['ok', 'heartbeat']]} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label={`φ at ${(Math.min(cur, HORIZON) / 1000).toFixed(1)} s`} value={now.phi >= 30 ? '≥ 30' : now.phi.toFixed(2)} sub={`gap ${Math.round(now.delta)} ms; μ ${now.mu.toFixed(0)}, σ ${now.sd.toFixed(1)}`} />
        <Stat label="false suspicions" value={`φ ${falsePhi} · t/o ${falseTo}`} t={falsePhi + falseTo ? 'dead' : 'ok'} sub="before the crash" />
        <Stat label="φ detects crash" value={detPhi ? `+${detPhi.t - lastBeat} ms` : 'never'} sub="after the last heartbeat" />
        <Stat label="timeout detects" value={detTo ? `+${detTo.t - lastBeat} ms` : 'never'} sub="after the last heartbeat" />
      </div>
      <p className="text-xs text-muted"><Md>{'**φ = −log10(P(the next heartbeat is still coming))**, from the mean and spread of recent inter-arrival times. Φ = 1 means about a 10% chance the suspicion is wrong, Φ = 2 about 1%, Φ = 8 about 10⁻⁸. Raise the jitter: φ adapts, a fixed timeout starts firing falsely.'}</Md></p>
    </div>
  )
}

/* ---- 2. partitions and split brain ---- */

interface NodeS { id: number; side: 0 | 1; role: 'leader' | 'follower' | 'candidate' | 'stale leader'; term: number; log: number; unc: number }
interface SB { nodes: NodeS[]; cut: boolean; ok: [number, number]; rej: [number, number]; replay?: number; discard?: number; conflict?: number }
function sbSteps(split: 'min' | 'maj', quorum: boolean): Step<SB>[] {
  const sideA = split === 'min' ? [1, 2] : [1, 2, 3]
  const side = (id: number): 0 | 1 => (sideA.includes(id) ? 0 : 1)
  const base = (): NodeS[] => [1, 2, 3, 4, 5].map((id) => ({ id, side: side(id), role: id === 1 ? 'leader' : 'follower', term: 1, log: 10, unc: 0 }))
  const aN = sideA.length, bN = 5 - aN
  const W = 6
  const s0 = base()
  const elect = base().map((n) => {
    if (split === 'min') {
      if (n.side === 1) return { ...n, role: n.id === 3 ? 'leader' : 'follower', term: 2 } as NodeS
      return quorum ? { ...n, role: n.id === 1 ? 'stale leader' : 'follower' } as NodeS : n
    }
    if (n.side === 1) return quorum ? { ...n, role: 'candidate', term: 3 } as NodeS : { ...n, role: n.id === 4 ? 'leader' : 'follower', term: 2 } as NodeS
    return n
  })
  const majSide: 0 | 1 = aN >= 3 ? 0 : 1
  const writes = elect.map((n) => {
    const onMaj = n.side === majSide
    if (quorum) return onMaj ? { ...n, log: n.log + W } : split === 'min' ? { ...n, unc: W } : n
    return { ...n, log: n.log + W }
  })
  const ok: [number, number] = quorum ? (majSide === 0 ? [W, 0] : [0, W]) : [W, W]
  const rej: [number, number] = quorum ? (majSide === 0 ? [0, W] : [W, 0]) : [0, 0]
  const minN = majSide === 0 ? bN : aN
  const healed = writes.map((n) => {
    const leaderId = split === 'min' ? 3 : 1
    const term = split === 'min' ? 2 : quorum ? 4 : 2
    if (quorum) return { ...n, role: n.id === leaderId ? 'leader' : 'follower', term, log: 10 + W, unc: 0 } as NodeS
    return { ...n }
  })
  const steps: Step<SB>[] = [
    { title: 'Healthy cluster', body: 'Five nodes, node 1 leads term 1, every log holds 10 committed entries.', state: { nodes: s0, cut: false, ok: [0, 0], rej: [0, 0] } },
    { title: 'The network splits', body: `Nodes ${sideA.join(', ')} can no longer reach nodes ${[1, 2, 3, 4, 5].filter((i) => !sideA.includes(i)).join(', ')}. From either side, the other side looks crashed.`, state: { nodes: s0, cut: true, ok: [0, 0], rej: [0, 0] } },
    { title: quorum ? 'Only a majority may lead' : 'Each side picks a leader', body: quorum
      ? (split === 'min' ? 'The 3-node side elects node 3 in term 2. Node 1 still believes it leads term 1, but cannot reach 3 of 5 nodes.' : 'Nodes 4 and 5 time out and start elections, but 2 votes of 5 never win. Node 1 keeps leading the majority.')
      : (split === 'min' ? 'Without a quorum rule, node 1 keeps leading its side and node 3 is elected on the other: **two leaders**.' : 'Without a quorum rule, nodes 4 and 5 elect node 4: **two leaders**.'),
      state: { nodes: elect, cut: true, ok: [0, 0], rej: [0, 0] } },
    { title: `Clients send ${W} writes to each side`, body: quorum
      ? `The majority side commits all ${W}. The minority side cannot gather 3 acknowledgements, so its writes stay uncommitted or are refused: clients see errors, not false success.`
      : `Both leaders commit ${W} writes and tell their clients "OK". The two histories now diverge: this is **split brain**.`,
      state: { nodes: writes, cut: true, ok, rej } },
    { title: 'The partition heals', body: quorum
      ? (split === 'min' ? `Node 1 sees term 2 and steps down. Its ${W} uncommitted entries on nodes 1 and 2 are discarded and replaced by the leader's; each catches up ${W} entries.` : `Nodes 4 and 5 return with term 3, which forces one new election; only a node with the full log can win it (here node 1 again, in term 4). Nodes 4 and 5 then replay the ${W} entries they missed. Nothing was lost because nothing was committed without a majority.`)
      : `Both sides hold ${W} acknowledged writes the other never saw. Some must be merged by rules or thrown away: acknowledged data is lost.`,
      state: { nodes: healed, cut: false, ok, rej, replay: quorum ? minN * W : 0, discard: quorum && split === 'min' ? 2 * W : 0, conflict: quorum ? 0 : 2 * W } },
  ]
  return steps
}
const ROLE_T: Record<NodeS['role'], Tone> = { leader: 'ok', follower: 'pointer', candidate: 'new', 'stale leader': 'dead' }

function SplitBrain() {
  const [split, setSplit] = useState<'min' | 'maj'>('min')
  const [quorum, setQuorum] = useState(true)
  const steps = useMemo(() => sbSteps(split, quorum), [split, quorum])
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap gap-2">
        <Segmented label="split" value={split} onChange={setSplit} options={[['min', 'leader on the small side'], ['maj', 'leader on the big side']]} />
        <Segmented label="rule" value={quorum ? 'q' : 'n'} onChange={(v) => setQuorum(v === 'q')} options={[['q', 'majority quorum'], ['n', 'no quorum']]} />
      </div>
      <Stepper key={`${split}${quorum}`} steps={steps} interval={2800} render={(s) => (
        <div className="grid gap-2 [&>*]:min-w-0">
          <div className="grid grid-cols-5 gap-1.5">
            {s.nodes.map((n) => (
              <motion.div key={n.id} layout className="min-w-0 rounded-lg border p-1.5" style={{ borderColor: tone(ROLE_T[n.role]), background: toneBg(ROLE_T[n.role], 12), marginTop: s.cut && n.side === 1 ? 14 : 0 }}>
                <p className="text-[11px] font-bold">node {n.id}</p>
                <p className="truncate font-mono text-[10.5px]" style={{ color: tone(ROLE_T[n.role]) }}>{n.role}</p>
                <p className="font-mono text-[10.5px]">term {n.term}</p>
                <p className="font-mono text-[10.5px]">log {n.log}{n.unc ? `+${n.unc}?` : ''}</p>
              </motion.div>
            ))}
          </div>
          {s.cut && <p className="text-xs font-semibold" style={{ color: tone('dead') }}>partition: side A = nodes {s.nodes.filter((n) => n.side === 0).map((n) => n.id).join(', ')} · side B = nodes {s.nodes.filter((n) => n.side === 1).map((n) => n.id).join(', ')}</p>}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="acknowledged A / B" value={`${s.ok[0]} / ${s.ok[1]}`} t={s.ok[0] && s.ok[1] ? 'dead' : 'ok'} />
            <Stat label="refused A / B" value={`${s.rej[0]} / ${s.rej[1]}`} />
            <Stat label="entries replayed" value={s.replay ?? '—'} />
            <Stat label={s.conflict ? 'conflicting acks' : 'entries discarded'} value={s.conflict ? s.conflict : s.discard ?? '—'} t={s.conflict ? 'dead' : undefined} sub={s.discard ? 'never acknowledged' : undefined} />
          </div>
          <Legend items={[['ok', 'leader'], ['pointer', 'follower'], ['new', 'candidate'], ['dead', 'stale leader']]} />
        </div>
      )} />
    </div>
  )
}

/* ---- 3. pg_hba evaluator ---- */

interface Rule { id: number; type: 'hostssl' | 'hostnossl' | 'host'; db: string; user: string; addr: string; method: 'cert' | 'scram-sha-256' | 'reject' }
interface Conn { name: string; ip: string; ssl: boolean; db: string; user: string; cert: boolean }
const RULES0: Rule[] = [
  { id: 1, type: 'hostssl', db: 'replication', user: 'replicator', addr: '10.0.0.0/24', method: 'cert' },
  { id: 2, type: 'hostssl', db: 'all', user: 'citus', addr: '10.0.0.0/24', method: 'cert' },
  { id: 3, type: 'hostnossl', db: 'all', user: 'all', addr: '0.0.0.0/0', method: 'reject' },
  { id: 4, type: 'hostssl', db: 'shop', user: 'app', addr: '10.0.1.0/24', method: 'scram-sha-256' },
  { id: 5, type: 'host', db: 'all', user: 'all', addr: '0.0.0.0/0', method: 'reject' },
]
const CONNS: Conn[] = [
  { name: 'worker → worker (TLS + cert)', ip: '10.0.0.12', ssl: true, db: 'shop', user: 'citus', cert: true },
  { name: 'worker → worker (no TLS)', ip: '10.0.0.12', ssl: false, db: 'shop', user: 'citus', cert: false },
  { name: 'standby streaming WAL', ip: '10.0.0.21', ssl: true, db: 'replication', user: 'replicator', cert: true },
  { name: 'app server (TLS + password)', ip: '10.0.1.40', ssl: true, db: 'shop', user: 'app', cert: false },
  { name: 'app user from the internet', ip: '203.0.113.9', ssl: true, db: 'shop', user: 'app', cert: false },
  { name: 'citus user without a cert', ip: '10.0.0.30', ssl: true, db: 'shop', user: 'citus', cert: false },
]
const ip2n = (ip: string) => ip.split('.').reduce((a, b) => a * 256 + +b, 0)
const inCidr = (ip: string, cidr: string) => { const [net, bits] = cidr.split('/'); const m = +bits === 0 ? 0 : 2 ** 32 - 2 ** (32 - +bits); return (ip2n(ip) & m) >>> 0 === (ip2n(net) & m) >>> 0 }
function evalHba(rules: Rule[], c: Conn): { rule?: Rule; ok: boolean; why: string } {
  for (const r of rules) {
    if (r.type === 'hostssl' && !c.ssl) continue
    if (r.type === 'hostnossl' && c.ssl) continue
    if (r.db === 'replication' ? c.db !== 'replication' : r.db !== 'all' && r.db !== c.db) continue
    if (c.db === 'replication' && r.db !== 'replication') continue
    if (r.user !== 'all' && r.user !== c.user) continue
    if (!inCidr(c.ip, r.addr)) continue
    if (r.method === 'reject') return { rule: r, ok: false, why: 'rejected by this rule' }
    if (r.method === 'cert') return { rule: r, ok: c.cert, why: c.cert ? 'trusted client certificate, CN = user' : 'no valid client certificate; later lines are not tried' }
    return { rule: r, ok: true, why: 'SCRAM password exchange over TLS' }
  }
  return { ok: false, why: 'no rule matched: denied' }
}

function Hba() {
  const [rules, setRules] = useState(RULES0)
  const [sel, setSel] = useState(0)
  const up = (i: number) => setRules((r) => { if (i === 0) return r; const n = [...r]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n })
  const res = CONNS.map((c) => evalHba(rules, c))
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <p className="text-sm text-muted"><Md>{'`pg_hba.conf` is read top to bottom. The **first** line that matches connection type, database, user and address decides, and if its authentication fails **no later line is tried**. Move a line up to see what changes.'}</Md></p>
      <div className="overflow-x-auto rounded-lg border border-line scrollbar-thin">
        <table className="w-full min-w-[480px] font-mono text-[11px]">
          <thead><tr className="text-left text-muted"><th className="px-1">#</th><th>type</th><th>database</th><th>user</th><th>address</th><th>method</th><th /></tr></thead>
          <tbody>{rules.map((r, i) => {
            const hit = res[sel].rule?.id === r.id
            return (
              <motion.tr key={r.id} layout className="border-t border-line" style={{ background: hit ? toneBg(res[sel].ok ? 'ok' : 'dead', 16) : undefined }}>
                <td className="px-1">{i + 1}</td><td>{r.type}</td><td>{r.db}</td><td>{r.user}</td><td>{r.addr}</td>
                <td>{r.method}</td>
                <td className="py-0.5 pr-1 text-right"><button type="button" onClick={() => up(i)} disabled={i === 0} className="rounded border border-line px-1.5 disabled:opacity-30" aria-label={`Move rule ${r.id} up`}>↑</button></td>
              </motion.tr>
            )
          })}</tbody>
        </table>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {CONNS.map((c, i) => (
          <button key={c.name} type="button" onClick={() => setSel(i)}
            className="min-w-0 rounded-lg border px-2 py-1.5 text-left" style={{ borderColor: tone(res[i].ok ? 'ok' : 'dead'), background: toneBg(res[i].ok ? 'ok' : 'dead', sel === i ? 20 : 6) }}>
            <p className="truncate text-xs font-semibold">{c.name}</p>
            <p className="truncate font-mono text-[10.5px] text-muted">{c.ip} · {c.ssl ? 'TLS' : 'plain'} · db {c.db} · user {c.user}{c.cert ? ' · cert' : ''}</p>
            <p className="font-mono text-[10.5px]" style={{ color: tone(res[i].ok ? 'ok' : 'dead') }}>{res[i].rule ? `line ${rules.indexOf(res[i].rule!) + 1}: ` : ''}{res[i].ok ? 'allowed' : 'denied'} · {res[i].why}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn testid="viz-next" onClick={() => setSel((s) => (s + 1) % CONNS.length)}>Next connection</Btn>
        <Btn onClick={() => setRules(RULES0)}>Reset order</Btn>
      </div>
    </div>
  )
}

/* ---- 4. data residency ---- */

type Geo = 'hash' | 'geo' | 'global'
function Residency() {
  const [g, setG] = useState<Geo>('hash')
  const [euUs, setEuUs] = useState(90)
  const [euAp, setEuAp] = useState(160)
  const [usAp, setUsAp] = useState(120)
  const [intra, setIntra] = useState(2)
  const rtt = (a: number, b: number) => (a === b ? intra : [[0, euUs, euAp], [euUs, 0, usAp], [euAp, usAp, 0]][a][b])
  const R = ['EU', 'US', 'APAC']
  // client and user both in EU (region 0); 3 replicas
  const read = g === 'hash' ? (rtt(0, 0) + rtt(0, 1) + rtt(0, 2)) / 3 : intra
  const write = g === 'hash'
    ? [0, 1, 2].reduce((a, L) => a + rtt(0, L) + Math.min(...[0, 1, 2].filter((x) => x !== L).map((x) => rtt(L, x))), 0) / 3
    : g === 'geo' ? intra + intra : intra + Math.max(rtt(0, 1), rtt(0, 2))
  const copies = g === 'hash' ? [1, 1, 1] : g === 'geo' ? [3, 0, 0] : [1, 1, 1]
  const outside = copies[1] + copies[2]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="placement" value={g} onChange={setG} options={[['hash', 'hash-sharded worldwide'], ['geo', 'geo-partitioned'], ['global', 'replicated everywhere']]} />
        <Btn testid="viz-next" onClick={() => setG(g === 'hash' ? 'geo' : g === 'geo' ? 'global' : 'hash')}>Next placement</Btn>
      </div>
      <p className="text-sm text-muted">An EU customer's row, three replicas, a client in the EU. Set the round trips between regions:</p>
      <div className="grid gap-2 sm:grid-cols-4 [&>*]:min-w-0">
        <Slider label="EU ↔ US" value={euUs} min={20} max={300} onChange={setEuUs} show={`${euUs} ms`} />
        <Slider label="EU ↔ APAC" value={euAp} min={20} max={300} onChange={setEuAp} show={`${euAp} ms`} />
        <Slider label="US ↔ APAC" value={usAp} min={20} max={300} onChange={setUsAp} show={`${usAp} ms`} />
        <Slider label="inside a region" value={intra} min={1} max={10} onChange={setIntra} show={`${intra} ms`} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {R.map((r, i) => (
          <div key={r} className="min-w-0 rounded-lg border p-2" style={{ borderColor: tone(i === 0 ? 'tuple' : 'muted'), background: toneBg(i === 0 ? 'tuple' : 'muted', 6) }}>
            <p className="text-xs font-bold">{r}</p>
            <div className="mt-1 flex min-h-6 flex-wrap gap-1">
              {Array.from({ length: copies[i] }, (_, k) => (
                <motion.span key={`${g}${k}`} layout initial={{ scale: 0 }} animate={{ scale: 1 }} className="rounded border px-1.5 py-0.5 font-mono text-[10.5px]"
                  style={{ borderColor: tone(i === 0 ? 'ok' : 'dead'), background: 'var(--surface)' }}>replica</motion.span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat label="read latency" value={`${read.toFixed(0)} ms`} sub={g === 'hash' ? 'expected: the leader is in any region' : 'served inside the EU'} />
        <Stat label="write latency" value={`${write.toFixed(0)} ms`} sub={g === 'hash' ? 'to the leader + its nearest follower' : g === 'geo' ? 'leader and quorum in the EU' : 'must reach every region'} />
        <Stat label="copies outside the EU" value={`${outside} of 3`} t={outside ? 'dead' : 'ok'} sub={outside ? 'violates an EU-only residency rule' : 'EU-only residency holds'} />
      </div>
      <p className="text-xs text-muted"><Md>{'**Geo-partitioning** = list partitioning on a region column, plus a placement rule per partition (a YugabyteDB tablespace, a CockroachDB `REGIONAL BY ROW` table). **Replicated everywhere** suits small read-mostly reference data.'}</Md></p>
    </div>
  )
}

function OpsViz() {
  const [tab, setTab] = useState<'phi' | 'split' | 'hba' | 'geo'>('phi')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Tabs value={tab} onChange={setTab} options={[['phi', 'Failure detection'], ['split', 'Split brain'], ['hba', 'Node authentication'], ['geo', 'Data residency']]} />
      {tab === 'phi' ? <PhiDetector /> : tab === 'split' ? <SplitBrain /> : tab === 'hba' ? <Hba /> : <Residency />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `${TRY_SQL}

-- 600 heartbeats from one peer: ~100 ms apart with jitter, one 300 ms hiccup, then silence (a crash)
SELECT setseed(0.42);
CREATE TABLE heartbeat AS
  SELECT seq, round(sum(gap) OVER (ORDER BY seq))::int AS arrived_ms
  FROM (SELECT seq, greatest(20, random_normal(100, 15)) + CASE WHEN seq = 300 THEN 300 ELSE 0 END AS gap
        FROM generate_series(1, 600) seq) g;
ALTER TABLE heartbeat ADD PRIMARY KEY (seq);

-- phi for a silence of gap_ms, given the mean and spread of the previous 100 inter-arrival times
CREATE FUNCTION phi(gap_ms float8, mu float8, sd float8) RETURNS float8 LANGUAGE sql IMMUTABLE AS $$
  SELECT -log(greatest(0.5 * erfc((gap_ms - mu) / (sd * sqrt(2))), 1e-300)) $$;

-- a cluster's routing table: 8 hash-range shards on 2 nodes
CREATE TABLE shard (shard_id int PRIMARY KEY, min_hash bigint NOT NULL, max_hash bigint NOT NULL, node text NOT NULL);
INSERT INTO shard SELECT s, -2147483648 + s::bigint * 536870912, -2147483648 + (s + 1)::bigint * 536870912 - 1, 'node-' || (1 + s % 2)
FROM generate_series(0, 7) s;
CREATE TABLE account (id int PRIMARY KEY, home_region text NOT NULL);
INSERT INTO account SELECT g, (ARRAY['EU', 'US', 'APAC'])[1 + g % 3] FROM generate_series(1, 9000) g;`

export const lesson: Lesson = {
  slug: 'operating-distributed',
  module: 'e5',
  order: 5,
  title: 'Operating distributed databases',
  tldr: [
    'Running a distributed database means detecting failures without false alarms, surviving network partitions without two leaders, catching nodes up, routing and rebalancing data, securing node-to-node traffic, and keeping data in the regions where it may live.',
    'Each of these is a place where a cluster can lose acknowledged data or availability, so each has a mechanism: accrual failure detectors, majority quorums with terms, log-position catch-up, routing tables, mutual TLS and geo-partitioning.',
  ],
  visualizer: {
    title: 'Keeping a cluster healthy',
    caption: 'Tune heartbeat jitter and compare phi with a fixed timeout. Split five nodes with and without a quorum, reorder pg_hba.conf lines, and move an EU user\'s replicas between regions.',
    Component: OpsViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'Heartbeat statistics and phi', sql: `WITH gaps AS (SELECT seq, arrived_ms - lag(arrived_ms) OVER (ORDER BY seq) AS gap FROM heartbeat),
     w AS (SELECT avg(gap) AS mu, stddev_pop(gap) AS sd FROM gaps WHERE seq BETWEEN 200 AND 299)
SELECT round(mu::numeric, 1) AS mean_ms, round(sd::numeric, 1) AS sd_ms,
       g AS silence_ms, round(phi(g, mu, sd)::numeric, 2) AS phi,
       round((100 * power(10, -phi(g, mu, sd)))::numeric, 6) AS pct_chance_heartbeat_still_comes
FROM w, unnest(ARRAY[100, 130, 160, 200, 300, 500]) g;`,
        note: 'A silence near the mean gives a low φ. Each extra standard deviation of silence pushes φ up steeply, and φ is a direct probability: φ = 8 means a 10⁻⁸ chance that a heartbeat is still coming.' },
      { label: 'Fixed timeout vs phi on real history', sql: `WITH gaps AS (SELECT seq, arrived_ms - lag(arrived_ms) OVER (ORDER BY seq) AS gap FROM heartbeat),
     win AS (SELECT seq, gap,
                    avg(gap) OVER (ORDER BY seq ROWS BETWEEN 100 PRECEDING AND 1 PRECEDING) AS mu,
                    stddev_pop(gap) OVER (ORDER BY seq ROWS BETWEEN 100 PRECEDING AND 1 PRECEDING) AS sd
             FROM gaps)
SELECT count(*) FILTER (WHERE gap > 150) AS timeout_150ms_false_alarms,
       count(*) FILTER (WHERE gap > 200) AS timeout_200ms_false_alarms,
       count(*) FILTER (WHERE phi(gap, mu, sd) >= 8) AS phi_8_false_alarms,
       max(gap) AS longest_gap_ms, max(seq) AS heartbeats
FROM win WHERE seq > 101;

-- after the crash: how long until each detector fires?
WITH w AS (SELECT avg(gap) AS mu, stddev_pop(gap) AS sd FROM
             (SELECT arrived_ms - lag(arrived_ms) OVER (ORDER BY seq) AS gap, seq FROM heartbeat) g WHERE seq > 500)
SELECT (SELECT min(s) FROM generate_series(1, 2000) s WHERE phi(s, mu, sd) >= 8) AS phi_8_fires_after_ms,
       200 AS timeout_200_fires_after_ms
FROM w;`,
        note: 'Every gap here was followed by a heartbeat, so every alarm is false. The 300 ms hiccup trips both fixed timeouts; φ = 8 trips too, because the hiccup is far outside normal jitter. After the crash, φ = 8 fires after 192 ms of silence, a point set by the measured mean and spread: double the jitter and it moves out with it, while a fixed timeout stays where it was.' },
      { label: 'Terms fence a stale leader', sql: `CREATE TABLE cluster_term (id int PRIMARY KEY CHECK (id = 1), term int NOT NULL);
INSERT INTO cluster_term VALUES (1, 1);
CREATE TABLE ledger (seq serial PRIMARY KEY, term int NOT NULL, entry text NOT NULL);
CREATE FUNCTION leader_write(my_term int, e text) RETURNS text LANGUAGE sql AS $$
  WITH ok AS (SELECT 1 FROM cluster_term WHERE term = my_term),
       ins AS (INSERT INTO ledger (term, entry) SELECT my_term, e FROM ok RETURNING seq)
  SELECT CASE WHEN EXISTS (SELECT 1 FROM ins) THEN 'committed' ELSE 'refused: term ' || my_term || ' is over' END $$;

SELECT leader_write(1, 'order 1') AS old_leader_before_split;
-- the majority side elects a new leader: term 2
UPDATE cluster_term SET term = 2;
SELECT leader_write(2, 'order 2') AS new_leader;
SELECT leader_write(1, 'order 3') AS old_leader_after_split;
SELECT * FROM ledger ORDER BY seq;

-- the quorum rule: a side may elect a leader only with a strict majority
SELECT side, nodes, nodes > 5 / 2.0 AS may_elect FROM (VALUES ('A', 2), ('B', 3)) v(side, nodes);`,
        note: 'The term is the cluster\'s fencing token. Once term 2 exists, writes stamped with term 1 are refused, so a leader that was cut off cannot add history after the split. Only the 3-node side may elect a leader at all.' },
      { label: 'Catch-up is measured in log bytes', sql: `CREATE TABLE replica_progress (replica text PRIMARY KEY, replayed_lsn pg_lsn NOT NULL);
INSERT INTO replica_progress VALUES ('replica-a', pg_current_wal_lsn()), ('replica-b', pg_current_wal_lsn());

-- replica-b disconnects; the primary keeps writing
INSERT INTO account SELECT g, 'EU' FROM generate_series(9001, 14000) g;
UPDATE replica_progress SET replayed_lsn = pg_current_wal_lsn() WHERE replica = 'replica-a';

SELECT replica, replayed_lsn, pg_current_wal_lsn() AS primary_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replayed_lsn)) AS behind
FROM replica_progress ORDER BY replica;`,
        note: 'A rejoining node does not need a full copy, only the log after the last position it applied. The distance is a byte count (`pg_wal_lsn_diff`); if the primary has already recycled that WAL, the node must be rebuilt from a fresh copy.' },
      { label: 'Routing table and rebalancing', sql: `CREATE FUNCTION route(id int) RETURNS text LANGUAGE sql STABLE AS $$
  SELECT node FROM shard WHERE hashint4(id) BETWEEN min_hash AND max_hash $$;
SELECT route(id) AS node, count(*) AS accounts FROM account GROUP BY 1 ORDER BY 1;

-- add node-3: move whole shards, never re-split them
CREATE TABLE before AS SELECT id, route(id) AS node FROM account;
UPDATE shard SET node = 'node-3' WHERE shard_id IN (0, 3, 6);
SELECT route(a.id) AS node, count(*) AS accounts,
       count(*) FILTER (WHERE route(a.id) <> b.node) AS moved_here
FROM account a JOIN before b USING (id) GROUP BY 1 ORDER BY 1;
SELECT shard_id, node FROM shard ORDER BY shard_id;`,
        note: 'The router maps hash ranges to nodes, so rebalancing is a metadata change plus copying the moved shards. Moving 3 of 8 shards moves the keys in those shards and nothing else: node-3 receives 3,310 of the 9,000 accounts (36.8%), close to the 3/8 of the hash space it took over.' },
      { label: 'TLS and authentication settings', sql: `SELECT name, setting, short_desc FROM pg_settings
WHERE name IN ('ssl', 'ssl_min_protocol_version', 'ssl_max_protocol_version', 'password_encryption', 'authentication_timeout')
ORDER BY name;

SELECT rule_number, type, database, user_name, address, auth_method, options, error FROM pg_hba_file_rules ORDER BY rule_number;
SELECT pid, ssl, version FROM pg_stat_ssl WHERE pid = pg_backend_pid();`,
        note: '`pg_hba_file_rules` lists the rules in the order they are tried. A cluster replaces `host` lines for its peers with `hostssl` lines that demand `cert` (or `clientcert=verify-full`), raises `ssl_min_protocol_version` if TLS 1.2 is not enough, and uses `scram-sha-256` for passwords.' },
      { label: 'Geo-partitioning and a residency check', sql: `CREATE TABLE profile (id int NOT NULL, home_region text NOT NULL, email text NOT NULL, PRIMARY KEY (id, home_region))
  PARTITION BY LIST (home_region);
CREATE TABLE profile_eu   PARTITION OF profile FOR VALUES IN ('EU');
CREATE TABLE profile_us   PARTITION OF profile FOR VALUES IN ('US');
CREATE TABLE profile_apac PARTITION OF profile FOR VALUES IN ('APAC');
INSERT INTO profile SELECT id, home_region, 'u' || id || '@example.com' FROM account;

-- where each partition is allowed to live (in YugabyteDB: a tablespace with replica_placement)
CREATE TABLE placement (partition regclass PRIMARY KEY, site_region text NOT NULL);
INSERT INTO placement VALUES ('profile_eu', 'EU'), ('profile_us', 'US'), ('profile_apac', 'APAC');

SELECT p.tableoid::regclass AS partition, pl.site_region, count(*) AS rows,
       count(*) FILTER (WHERE p.home_region <> pl.site_region) AS residency_violations
FROM profile p JOIN placement pl ON pl.partition = p.tableoid GROUP BY 1, 2 ORDER BY 1;
EXPLAIN (COSTS OFF) SELECT email FROM profile WHERE home_region = 'EU' AND id = 42;`,
        note: 'Every row sits in the partition for its home region, so no EU row is stored outside the EU site (0 violations). An EU query names the region and is routed to one partition only.' },
    ],
  },
  production: {
    title: 'False failovers from a fixed timeout',
    context: 'A three-region cluster used a 1-second heartbeat timeout between nodes. Cross-region links showed rare latency spikes during backups.',
    problem: 'Twice a week a spike crossed the timeout, the node in the slow region was declared dead, a leader election ran, and clients saw a burst of errors although no machine had failed.',
    solution: 'Replace the binary timeout with an accrual detector whose threshold reflects the measured jitter per link, and keep a quorum rule so a slow minority cannot elect a leader. Encrypt and authenticate all node-to-node traffic at the same time, because the change touched every peer connection.',
    sql: `# cassandra.yaml: phi accrual detector (default threshold 8)
phi_convict_threshold: 10
server_encryption_options:
  internode_encryption: all

# postgresql.conf / pg_hba.conf for PostgreSQL peers
ssl = on
ssl_min_protocol_version = 'TLSv1.3'
hostssl all       citus      10.0.0.0/24  cert
hostssl replication replicator 10.0.0.0/24 cert
hostnossl all     all        0.0.0.0/0    reject`,
    outcome: 'Spikes on the backup link no longer convicted healthy nodes, while a real crash is still detected within a couple of seconds. Every peer connection now requires TLS and a client certificate.',
  },
  pitfalls: [
    { title: 'Even-sized clusters and two-way splits',
      symptom: 'After a network split of a 4-node cluster, neither half accepts writes, or both do.',
      cause: 'A majority needs more than half the nodes. A 2 + 2 split has no majority; without a quorum rule both halves elect leaders (split brain).',
      fix: 'Run an odd number of voters (3, 5) across failure domains, or add a witness/arbiter in a third location. Never disable the quorum check to "stay available".' },
    { title: 'Timeouts tuned on a quiet day',
      symptom: 'Healthy nodes are marked down during load spikes, garbage collection or backups, causing needless failovers.',
      cause: 'A fixed timeout ignores how variable a link is. It is either too short for bad moments or too long to notice real crashes.',
      fix: 'Use an accrual detector (phi) over measured inter-arrival times, and set the threshold for the false-suspicion rate you accept.' },
    { title: 'Plain-text peer connections inside the "private" network',
      symptom: 'An audit finds replication and shard traffic readable on the wire, and any host in the subnet can log in as the cluster user.',
      cause: '`host` lines match unencrypted connections, and `trust` or password-only rules do not prove which machine is connecting.',
      fix: 'Use `hostssl` lines with `cert` authentication for peers, `sslmode=verify-full` on the client side, and a `hostnossl … reject` line before any broader rule.',
      sql: `SELECT rule_number, type, database, user_name, address, auth_method FROM pg_hba_file_rules ORDER BY rule_number;` },
    { title: 'Residency by convention',
      symptom: 'EU personal data turns up in a US backup or replica.',
      cause: 'Hash sharding spreads every row and its replicas wherever the hash and the replica placement put them, regardless of the customer\'s region.',
      fix: 'Partition by a region column and pin each partition\'s replicas and backups to its region (a YugabyteDB tablespace, CockroachDB `REGIONAL BY ROW`), then check placement with a query.' },
  ],
  pointers: [
    'Failure detectors trade speed for false alarms. **φ = −log10(P(next heartbeat still coming))** adapts to the measured jitter; Cassandra convicts at φ = 8 by default.',
    'A partition looks like a crash from both sides. A **majority quorum** plus **terms** as fencing tokens keeps one leader; without them you get split brain and lost acknowledged writes. See [HA clusters](/e3/ha-clusters).',
    'A returning node replays the log from its last applied position; if that log is gone it must be rebuilt. Routing tables map hash ranges to nodes, so rebalancing moves whole ranges ([sharding](/e3/sharding-citus)).',
    'Node-to-node security: `hostssl` + `cert` (or `clientcert=verify-full`), `sslmode=verify-full`, `ssl_min_protocol_version` (default TLSv1.2), `scram-sha-256` for passwords.',
    'Data residency is a placement rule: list-partition by region and pin each partition\'s replicas to that region; replicate only small reference data everywhere.',
  ],
  sources: ['auth-pg-hba-conf.html', 'auth-cert.html', 'view-pg-hba-file-rules.html', 'runtime-config-connection.html', 'libpq-ssl.html', 'ssl-tcp.html', 'monitoring-stats.html', 'functions-admin.html', 'functions-math.html', 'ddl-partitioning.html', 'warm-standby.html'],
}
