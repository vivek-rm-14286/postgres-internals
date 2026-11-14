import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Md } from '../../lesson/Md'
import { Btn, Slider, Stat, Tabs, TRY_SQL, hashint4 } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer 1: fragmentation builder. A 12-row relation, several fragmentation schemes, fragments
 *               that can be switched off; completeness, disjointness and reconstruction are computed live.
 * Visualizer 2: hash ring. 10,000 keys hashed with a bit-exact port of PostgreSQL's hashint4();
 *               ring with virtual nodes vs modulo-N vs fixed equal ranges; keys moved are counted.
 * Visualizer 3: replication modes as primary / replica lanes (sync, async, snapshot, active-active).
 * ---------------------------------------------------------------------------------------------- */

interface Row { id: number; name: string; region: 'EU' | 'US' | 'APAC'; tier: 'gold' | 'std'; balance: number }
const R: Row[] = [
  [1, 'Ana', 'EU', 'gold', 120], [2, 'Bo', 'US', 'std', 40], [3, 'Chen', 'APAC', 'std', 75], [4, 'Dev', 'APAC', 'gold', 300],
  [5, 'Eva', 'EU', 'std', 15], [6, 'Femi', 'US', 'gold', 980], [7, 'Gus', 'EU', 'std', 60], [8, 'Hana', 'APAC', 'std', 5],
  [9, 'Ivo', 'US', 'std', 210], [10, 'Jun', 'EU', 'gold', 455], [11, 'Kai', 'US', 'std', 33], [12, 'Lea', 'APAC', 'std', 90],
].map(([id, name, region, tier, balance]) => ({ id, name, region, tier, balance } as Row))
const COLS = ['id', 'name', 'region', 'tier', 'balance'] as const
type Col = typeof COLS[number]
interface Frag { name: string; pred: string; test: (r: Row) => boolean; cols: Col[]; group: string }
const all = () => true
const ALLC: Col[] = [...COLS]
const SCHEMES: Record<string, { label: string; frags: Frag[]; note: string }> = {
  region: { label: 'by region', note: 'Primary horizontal fragmentation by the minterms of `region`. Each row lands in exactly one fragment; the union rebuilds R.',
    frags: [
      { name: 'C_EU', pred: "region = 'EU'", test: (r) => r.region === 'EU', cols: ALLC, group: 'EU' },
      { name: 'C_US', pred: "region = 'US'", test: (r) => r.region === 'US', cols: ALLC, group: 'US' },
      { name: 'C_APAC', pred: "region = 'APAC'", test: (r) => r.region === 'APAC', cols: ALLC, group: 'APAC' }] },
  overlap: { label: 'overlapping', note: 'A fourth fragment `tier = gold` is not a minterm of the other predicates, so gold customers live in two fragments. Updates now have to change both copies.',
    frags: [
      { name: 'C_EU', pred: "region = 'EU'", test: (r) => r.region === 'EU', cols: ALLC, group: 'EU' },
      { name: 'C_US', pred: "region = 'US'", test: (r) => r.region === 'US', cols: ALLC, group: 'US' },
      { name: 'C_APAC', pred: "region = 'APAC'", test: (r) => r.region === 'APAC', cols: ALLC, group: 'APAC' },
      { name: 'C_GOLD', pred: "tier = 'gold'", test: (r) => r.tier === 'gold', cols: ALLC, group: 'GOLD' }] },
  vnokey: { label: 'vertical, no key', note: 'The billing columns were split off without `id`. Every value is still stored once, but nothing says which balance belongs to which name: the only join is a cross product.',
    frags: [
      { name: 'C_PROFILE', pred: 'all rows', test: all, cols: ['id', 'name', 'region'], group: 'all' },
      { name: 'C_BILLING', pred: 'all rows', test: all, cols: ['tier', 'balance'], group: 'all' }] },
  vkey: { label: 'vertical, with key', note: 'Each vertical fragment repeats the primary key. Non-key columns are disjoint, and a join on `id` rebuilds every row.',
    frags: [
      { name: 'C_PROFILE', pred: 'all rows', test: all, cols: ['id', 'name', 'region'], group: 'all' },
      { name: 'C_BILLING', pred: 'all rows', test: all, cols: ['id', 'tier', 'balance'], group: 'all' }] },
  hybrid: { label: 'hybrid', note: 'Horizontal first, then the EU fragment is split vertically. Reconstruction nests the operators: (EU_PROFILE ⋈ EU_BILLING) ∪ C_US ∪ C_APAC.',
    frags: [
      { name: 'EU_PROFILE', pred: "region = 'EU'", test: (r) => r.region === 'EU', cols: ['id', 'name', 'region'], group: 'EU' },
      { name: 'EU_BILLING', pred: "region = 'EU'", test: (r) => r.region === 'EU', cols: ['id', 'tier', 'balance'], group: 'EU' },
      { name: 'C_US', pred: "region = 'US'", test: (r) => r.region === 'US', cols: ALLC, group: 'US' },
      { name: 'C_APAC', pred: "region = 'APAC'", test: (r) => r.region === 'APAC', cols: ALLC, group: 'APAC' }] },
}
const FT: Tone[] = ['tuple', 'pointer', 'header', 'new']

function check(frags: Frag[], on: boolean[]) {
  const act = frags.map((f, i) => ({ f, i })).filter(({ i }) => on[i])
  // completeness: every cell of R is stored in some active fragment
  let missing = 0, dupCells = 0
  const lostRows = new Set<number>()
  for (const r of R) for (const c of COLS) {
    const n = act.filter(({ f }) => f.test(r) && f.cols.includes(c)).length
    if (n === 0) { missing++; lostRows.add(r.id) }
    if (c !== 'id' && n > 1) dupCells++
    if (c === 'id' && act.filter(({ f }) => f.test(r) && f.cols.length === COLS.length).length > 1) dupCells++
  }
  // reconstruction: per horizontal group, join vertical pieces on id; then union
  const groups = new Map<string, Frag[]>()
  for (const { f } of act) groups.set(f.group, [...(groups.get(f.group) ?? []), f])
  let joinable = true
  let crossRows = 0
  const rebuilt = new Set<string>()
  for (const [, fs] of groups) {
    if (fs.length > 1 && fs.some((f) => !f.cols.includes('id'))) {
      joinable = false
      crossRows += fs.reduce((p, f) => p * R.filter(f.test).length, 1)
      continue
    }
    const cols = new Set(fs.flatMap((f) => f.cols))
    if (cols.size < COLS.length) continue
    for (const r of R) if (fs.every((f) => f.test(r))) rebuilt.add(JSON.stringify(r))
  }
  const reconstructs = joinable && rebuilt.size === R.length && R.every((r) => rebuilt.has(JSON.stringify(r)))
  const op = [...groups.values()].map((fs) => (fs.length > 1 ? `(${fs.map((f) => f.name).join(' ⋈ ')})` : fs[0].name)).join(' ∪ ') || '∅'
  return { complete: missing === 0, missing, lostRows: lostRows.size, disjoint: dupCells === 0, dupCells, reconstructs, joinable, crossRows, op }
}

function FragBuilder() {
  const [scheme, setScheme] = useState<keyof typeof SCHEMES>('region')
  const sc = SCHEMES[scheme]
  const [on, setOn] = useState<boolean[]>(sc.frags.map(() => true))
  const pick = (k: keyof typeof SCHEMES) => { setScheme(k); setOn(SCHEMES[k].frags.map(() => true)) }
  const res = useMemo(() => check(sc.frags, on), [sc, on])
  const keys = Object.keys(SCHEMES) as (keyof typeof SCHEMES)[]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={scheme} onChange={pick} options={keys.map((k) => [k, SCHEMES[k].label] as [keyof typeof SCHEMES, string])} />
        <Btn testid="viz-next" onClick={() => pick(keys[(keys.indexOf(scheme) + 1) % keys.length])}>Next scheme</Btn>
      </div>
      <p className="text-sm text-muted"><Md>{sc.note}</Md> Click a fragment to drop it.</p>
      <div className="flex flex-wrap gap-2">
        {sc.frags.map((f, i) => (
          <button key={f.name} type="button" onClick={() => setOn((o) => o.map((x, k) => (k === i ? !x : x)))}
            className="rounded-lg border px-2 py-1 text-left font-mono text-[11px] transition"
            style={{ borderColor: tone(FT[i]), background: on[i] ? toneBg(FT[i], 18) : 'transparent', opacity: on[i] ? 1 : 0.45, textDecoration: on[i] ? 'none' : 'line-through' }}>
            <b>{f.name}</b> = {f.cols.length < COLS.length && <>π<sub>{f.cols.join(',')}</sub> </>}{f.pred !== 'all rows' && <>σ<sub>{f.pred}</sub></>}(C) · {R.filter(f.test).length} rows
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line scrollbar-thin">
        <table className="w-full min-w-[460px] border-collapse font-mono text-[11.5px]">
          <thead><tr className="text-left text-muted">{COLS.map((c) => <th key={c} className="px-2 py-1">{c}</th>)}</tr></thead>
          <tbody>{R.map((r) => (
            <tr key={r.id} className="border-t border-line">
              {COLS.map((c) => {
                const holders = sc.frags.map((f, i) => ({ f, i })).filter(({ f, i }) => on[i] && f.test(r) && f.cols.includes(c))
                const t: Tone | null = holders.length === 1 ? FT[holders[0].i] : null
                const bg = holders.length === 0 ? toneBg('dead', 22) : holders.length > 1 && c !== 'id' ? toneBg('dead', 10) : t ? toneBg(t, 14) : toneBg('accent', 10)
                return (
                  <motion.td key={c} layout className="px-2 py-0.5" animate={{ backgroundColor: bg }} transition={{ duration: 0.3 }}>
                    <span style={{ textDecoration: holders.length === 0 ? 'line-through' : 'none', color: holders.length === 0 ? tone('dead') : 'var(--text)' }}>{String(r[c])}</span>
                    {holders.length > 1 && <sup className="ml-0.5" style={{ color: c === 'id' ? tone('muted') : tone('dead') }}>×{holders.length}</sup>}
                  </motion.td>
                )
              })}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Legend items={[...sc.frags.map((f, i) => [FT[i], f.name] as [Tone, string]), ['dead', 'lost or duplicated']]} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat label="completeness" value={res.complete ? 'holds' : 'broken'} t={res.complete ? 'ok' : 'dead'} sub={res.complete ? 'every value is in some fragment' : `${res.missing} values, ${res.lostRows} rows lost`} />
        <Stat label="disjointness" value={res.disjoint ? 'holds' : 'broken'} t={res.disjoint ? 'ok' : 'dead'} sub={res.disjoint ? 'non-key values stored once' : `${res.dupCells} values stored twice`} />
        <Stat label="reconstruction" value={res.reconstructs ? 'holds' : 'broken'} t={res.reconstructs ? 'ok' : 'dead'}
          sub={!res.joinable ? `no shared key: cross product = ${res.crossRows} rows` : res.reconstructs ? 'R rebuilt exactly' : 'rows cannot be rebuilt'} />
      </div>
      <p className="font-mono text-xs text-muted">C = {res.op}</p>
    </div>
  )
}

/* ---- hash ring ---- */

const K = 10000
const KEYS = Array.from({ length: K }, (_, i) => hashint4(i + 1))
const NT: Tone[] = ['tuple', 'pointer', 'header', 'new', 'ok', 'dead', 'muted', 'accent']
const Q = 64
type Scheme = 'ring' | 'mod' | 'fixed'

function tokens(nodes: number[], v: number) {
  const t: [number, number][] = []
  for (const n of nodes) for (let i = 0; i < v; i++) t.push([hashint4(n * 1000 + i), n])
  return t.sort((a, b) => a[0] - b[0])
}
function ringOwner(t: [number, number][], h: number) {
  let lo = 0, hi = t.length
  while (lo < hi) { const m = (lo + hi) >> 1; if (t[m][0] >= h) hi = m; else lo = m + 1 }
  return t[lo < t.length ? lo : 0][1]
}
/** Fixed equal ranges (Q of them): when nodes change, move as few ranges as possible to rebalance. */
function rangesFor(nodes: number[], prev?: number[]): number[] {
  if (!prev) return Array.from({ length: Q }, (_, i) => nodes[i % nodes.length])
  const a = prev.map((n) => (nodes.includes(n) ? n : -1))
  const count = new Map(nodes.map((n) => [n, a.filter((x) => x === n).length]))
  const target = (n: number) => Math.floor(Q / nodes.length) + (nodes.indexOf(n) < Q % nodes.length ? 1 : 0)
  for (let i = 0; i < Q; i++) {
    const cur = a[i]
    if (cur !== -1 && (count.get(cur) ?? 0) <= target(cur)) continue
    const under = nodes.find((n) => (count.get(n) ?? 0) < target(n))
    if (under === undefined) continue
    if (cur !== -1) count.set(cur, (count.get(cur) ?? 0) - 1)
    a[i] = under; count.set(under, (count.get(under) ?? 0) + 1)
  }
  return a
}
const rangeOf = (h: number) => Math.floor(((h >>> 0) / 4294967296) * Q)

function owners(s: Scheme, nodes: number[], v: number, ranges: number[]) {
  if (s === 'ring') { const t = tokens(nodes, v); return KEYS.map((h) => ringOwner(t, h)) }
  if (s === 'mod') return KEYS.map((h) => nodes[(h >>> 0) % nodes.length])
  return KEYS.map((h) => ranges[rangeOf(h)])
}

function HashRing() {
  const [nodes, setNodes] = useState<number[]>([1, 2, 3, 4])
  const [prevNodes, setPrevNodes] = useState<number[] | null>(null)
  const [v, setV] = useState(16)
  const [scheme, setScheme] = useState<Scheme>('ring')
  const [ranges, setRanges] = useState<number[]>(() => rangesFor([1, 2, 3, 4]))
  const [prevRanges, setPrevRanges] = useState<number[] | null>(null)
  const change = (next: number[]) => {
    setPrevNodes(nodes); setPrevRanges(ranges)
    setRanges(rangesFor(next, ranges)); setNodes(next)
  }
  const add = () => { const free = [1, 2, 3, 4, 5, 6, 7, 8].find((n) => !nodes.includes(n)); if (free) change([...nodes, free].sort((a, b) => a - b)) }
  const remove = () => { if (nodes.length > 2) change(nodes.slice(0, -1)) }
  const cur = useMemo(() => ({ ring: owners('ring', nodes, v, ranges), mod: owners('mod', nodes, v, ranges), fixed: owners('fixed', nodes, v, ranges) }), [nodes, v, ranges])
  const moved = useMemo(() => {
    if (!prevNodes || !prevRanges) return null
    const p = { ring: owners('ring', prevNodes, v, prevRanges), mod: owners('mod', prevNodes, v, prevRanges), fixed: owners('fixed', prevNodes, v, prevRanges) }
    return (['ring', 'mod', 'fixed'] as Scheme[]).map((s) => p[s].filter((o, i) => o !== cur[s][i]).length)
  }, [prevNodes, prevRanges, cur, v])
  const load = nodes.map((n) => cur[scheme].filter((o) => o === n).length)
  const mean = K / nodes.length
  const ideal = prevNodes ? Math.round((Math.abs(nodes.length - prevNodes.length) / Math.max(nodes.length, prevNodes.length)) * K) : 0
  const t = useMemo(() => tokens(nodes, v), [nodes, v])
  const CX = 150, CY = 150, RR = 118
  const ang = (h: number) => ((h + 2147483648) / 4294967296) * 2 * Math.PI - Math.PI / 2
  const pt = (h: number, r: number) => [CX + r * Math.cos(ang(h)), CY + r * Math.sin(ang(h))]
  const arcs = scheme === 'ring'
    ? t.map(([h, n], i) => ({ from: i === 0 ? t[t.length - 1][0] - 4294967296 : t[i - 1][0], to: h, n }))
    : scheme === 'fixed'
      ? ranges.map((n, i) => ({ from: -2147483648 + (i * 4294967296) / Q, to: -2147483648 + ((i + 1) * 4294967296) / Q, n }))
      : []
  const arcPath = (a: number, b: number) => {
    const [x1, y1] = pt(a, RR), [x2, y2] = pt(b, RR)
    const large = b - a > 2147483648 ? 1 : 0
    return `M${x1},${y1} A${RR},${RR} 0 ${large} 1 ${x2},${y2}`
  }
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="placement" value={scheme} onChange={setScheme} options={[['ring', 'ring + vnodes'], ['mod', 'hash mod N'], ['fixed', `${Q} fixed ranges`]]} />
        <Btn primary testid="viz-next" onClick={add} disabled={nodes.length >= 8}>Add node</Btn>
        <Btn onClick={remove} disabled={nodes.length <= 2}>Remove node</Btn>
      </div>
      <Slider label="virtual nodes per node (ring)" value={v} min={1} max={64} onChange={(x) => { setV(x); setPrevNodes(null) }} show={String(v)} />
      <div className="grid gap-3 md:grid-cols-[300px_1fr] [&>*]:min-w-0">
        <div className="mx-auto w-full max-w-[300px]">
          <svg viewBox="0 0 300 300" className="w-full" role="img" aria-label="Hash ring">
            <circle cx={CX} cy={CY} r={RR} fill="none" stroke="var(--border)" strokeWidth={10} />
            {arcs.map((a, i) => (
              <motion.path key={`${scheme}-${i}-${a.n}`} d={arcPath(a.from, a.to)} fill="none" stroke={tone(NT[(a.n - 1) % NT.length])} strokeWidth={10}
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
            ))}
            {scheme === 'ring' && t.map(([h, n], i) => { const [x, y] = pt(h, RR + 9); return <circle key={i} cx={x} cy={y} r={2.2} fill={tone(NT[(n - 1) % NT.length])} /> })}
            {scheme === 'mod' && <text x={CX} y={CY - 6} textAnchor="middle" fontSize={12} fill="var(--muted)">owner = hash mod {nodes.length}</text>}
            <text x={CX} y={CY + (scheme === 'mod' ? 14 : 4)} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--text)">{K.toLocaleString()} keys</text>
            {scheme === 'ring' && <text x={CX} y={CY + 20} textAnchor="middle" fontSize={10} fill="var(--muted)">{t.length} tokens</text>}
          </svg>
        </div>
        <div className="grid content-start gap-3 [&>*]:min-w-0">
          <Panel title={`Keys per node · ${scheme === 'ring' ? 'ring' : scheme === 'mod' ? 'mod N' : 'fixed ranges'}`}>
            <div className="grid gap-1">
              {nodes.map((n, i) => (
                <div key={n} className="grid grid-cols-[52px_1fr_48px] items-center gap-2 font-mono text-[11px]">
                  <span>node {n}</span>
                  <div className="h-3 rounded bg-surface-2"><motion.div className="h-3 rounded" style={{ background: tone(NT[(n - 1) % NT.length]) }} animate={{ width: `${Math.min(100, (load[i] / (2.2 * mean)) * 100)}%` }} /></div>
                  <span className="text-right tabular-nums">{load[i]}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted">max / mean = {(Math.max(...load) / mean).toFixed(2)}</p>
          </Panel>
          <div className="grid grid-cols-3 gap-2">
            {(['ring', 'mod', 'fixed'] as Scheme[]).map((s, i) => (
              <Stat key={s} label={s === 'ring' ? 'ring' : s === 'mod' ? 'mod N' : 'ranges'} value={moved ? `${((moved[i] / K) * 100).toFixed(1)}%` : '—'}
                t={moved ? (moved[i] > 2 * ideal ? 'dead' : 'ok') : undefined} sub={moved ? `${moved[i]} keys moved` : 'keys moved'} />
            ))}
          </div>
          <p className="text-xs text-muted"><Md>{prevNodes
            ? `From ${prevNodes.length} to ${nodes.length} nodes, a perfectly balanced move is **${ideal} keys** (${((ideal / K) * 100).toFixed(1)}%). Modulo hashing remaps most keys; the ring moves only keys next to the changed tokens; fixed ranges move whole ranges and never re-split them.`
            : 'Keys are the integers 1 to 10,000 hashed with PostgreSQL\'s `hashint4`. Add or remove a node to count how many keys change owner under each scheme.'}</Md></p>
        </div>
      </div>
    </div>
  )
}

/* ---- replication modes ---- */

interface RS { p: string[]; r: string[]; ack: string; lost?: number; conflict?: boolean; r2?: string[] }
const RMODES: Record<'sync' | 'async' | 'snap' | 'aa', { label: string; steps: Step<RS>[] }> = {
  sync: { label: 'synchronous', steps: [
    { title: 'Client commits T1', body: 'The primary writes T1 to its log and sends it to the replica **before** answering.', state: { p: ['T1'], r: [], ack: 'waiting' } },
    { title: 'Replica confirms, client gets OK', body: 'The commit returns only after the replica has T1. Commit latency now includes one network round trip.', state: { p: ['T1'], r: ['T1'], ack: 'T1 ok' } },
    { title: 'T2 and T3 commit the same way', body: 'Every acknowledged commit exists on two machines.', state: { p: ['T1', 'T2', 'T3'], r: ['T1', 'T2', 'T3'], ack: 'T3 ok' } },
    { title: 'The primary dies', body: 'Fail over to the replica: it has every commit the client was told about. **Zero acknowledged commits lost.**', state: { p: [], r: ['T1', 'T2', 'T3'], ack: 'failover', lost: 0 } },
  ] },
  async: { label: 'asynchronous', steps: [
    { title: 'Client commits T1', body: 'The primary answers as soon as T1 is in its own log. Shipping to the replica happens afterwards.', state: { p: ['T1'], r: [], ack: 'T1 ok' } },
    { title: 'The replica catches up', body: 'A moment later the replica has T1. Commit latency never waited for it.', state: { p: ['T1'], r: ['T1'], ack: 'T1 ok' } },
    { title: 'T2 and T3 commit quickly', body: 'Both are acknowledged; the replica is still behind by **2 transactions** (the lag).', state: { p: ['T1', 'T2', 'T3'], r: ['T1'], ack: 'T3 ok' } },
    { title: 'The primary dies', body: 'Failing over to the replica loses T2 and T3, although the client was told they committed. **2 acknowledged commits lost.**', state: { p: [], r: ['T1'], ack: 'failover', lost: 2 } },
  ] },
  snap: { label: 'snapshot', steps: [
    { title: 'Copy taken at 09:00', body: 'Snapshot replication copies the whole fragment, or a query result, at one moment.', state: { p: ['T1', 'T2'], r: ['T1', 'T2'], ack: 'snapshot 09:00' } },
    { title: 'Writes continue on the source', body: 'T3 and T4 commit on the source. The copy does not change: readers see 09:00 data.', state: { p: ['T1', 'T2', 'T3', 'T4'], r: ['T1', 'T2'], ack: 'stale by 2' } },
    { title: 'Refresh at 10:00', body: 'The next refresh replaces the copy in one step. Cheap for read-mostly data that tolerates a known staleness.', state: { p: ['T1', 'T2', 'T3', 'T4'], r: ['T1', 'T2', 'T3', 'T4'], ack: 'snapshot 10:00' } },
  ] },
  aa: { label: 'active-active', steps: [
    { title: 'Both nodes accept writes', body: 'In **active-active** each copy takes writes locally and ships them to the other. In active-passive only one copy does.', state: { p: ['T1'], r: ['T1'], ack: 'T1 ok' } },
    { title: 'Concurrent updates of one row', body: 'Node A sets price = 10 while node B sets price = 12, each before seeing the other.', state: { p: ['T1', 'A: price=10'], r: ['T1', 'B: price=12'], ack: 'both ok', conflict: true } },
    { title: 'Exchange and resolve', body: 'Each node receives the other write. With **last writer wins**, both converge on the later timestamp and one acknowledged update silently disappears.', state: { p: ['T1', 'A: price=10', 'B: price=12 (wins)'], r: ['T1', 'B: price=12', 'A: price=10 (lost)'], ack: 'converged', lost: 1, conflict: true } },
  ] },
}

function Lane({ name, items, t, dead }: { name: string; items: string[]; t: Tone; dead?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border p-2" style={{ borderColor: dead ? tone('dead') : tone(t), background: toneBg(dead ? 'dead' : t, 8) }}>
      <p className="mb-1 text-xs font-bold">{name}{dead ? ' · down' : ''}</p>
      <div className="flex min-h-7 flex-wrap gap-1">
        {items.map((x) => <motion.span key={x} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded border px-1.5 py-0.5 font-mono text-[11px]" style={{ borderColor: tone(x.includes('lost') ? 'dead' : x.includes('wins') ? 'ok' : t), background: 'var(--surface)' }}>{x}</motion.span>)}
      </div>
    </div>
  )
}

function Replication() {
  const [m, setM] = useState<keyof typeof RMODES>('async')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Segmented label="mode" value={m} onChange={setM} options={(Object.keys(RMODES) as (keyof typeof RMODES)[]).map((k) => [k, RMODES[k].label])} />
      <Stepper key={m} steps={RMODES[m].steps} interval={2600} render={(s) => (
        <div className="grid gap-2 [&>*]:min-w-0">
          <div className="grid grid-cols-2 gap-2">
            <Lane name={m === 'aa' ? 'node A' : m === 'snap' ? 'source' : 'primary'} items={s.p} t="tuple" dead={s.ack === 'failover'} />
            <Lane name={m === 'aa' ? 'node B' : m === 'snap' ? 'snapshot copy' : 'replica'} items={s.r} t="pointer" />
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-line px-2 py-0.5 font-mono">client sees: {s.ack}</span>
            {s.lost !== undefined && <span className="rounded border px-2 py-0.5 font-mono" style={{ borderColor: tone(s.lost ? 'dead' : 'ok'), color: tone.text(s.lost ? 'dead' : 'ok') }}>acknowledged writes lost: {s.lost}</span>}
          </div>
        </div>
      )} />
    </div>
  )
}

function FragViz() {
  const [tab, setTab] = useState<'frag' | 'ring' | 'repl'>('frag')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Tabs value={tab} onChange={setTab} options={[['frag', 'Fragmentation rules'], ['ring', 'Consistent hashing'], ['repl', 'Replication modes']]} />
      {tab === 'frag' ? <FragBuilder /> : tab === 'ring' ? <HashRing /> : <Replication />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `${TRY_SQL}

-- customers fragmented horizontally by region (one partition per fragment)
CREATE TABLE customers (id int NOT NULL, name text NOT NULL, email text NOT NULL, region text NOT NULL,
                        tier text NOT NULL, balance numeric(10,2) NOT NULL, PRIMARY KEY (id, region)) PARTITION BY LIST (region);
CREATE TABLE customers_eu   PARTITION OF customers FOR VALUES IN ('EU');
CREATE TABLE customers_us   PARTITION OF customers FOR VALUES IN ('US');
CREATE TABLE customers_apac PARTITION OF customers FOR VALUES IN ('APAC');
INSERT INTO customers
  SELECT g, 'customer ' || g, 'c' || g || '@example.com', (ARRAY['EU', 'US', 'APAC'])[1 + g % 3],
         CASE WHEN g % 7 = 0 THEN 'gold' ELSE 'std' END, (g * 37) % 1000
  FROM generate_series(1, 3000) g;

-- orders follow their customer: derived horizontal fragmentation through the foreign key
CREATE TABLE orders (id int NOT NULL, customer_id int NOT NULL, region text NOT NULL, total numeric(10,2) NOT NULL,
                     PRIMARY KEY (id, region), FOREIGN KEY (customer_id, region) REFERENCES customers (id, region))
  PARTITION BY LIST (region);
CREATE TABLE orders_eu   PARTITION OF orders FOR VALUES IN ('EU');
CREATE TABLE orders_us   PARTITION OF orders FOR VALUES IN ('US');
CREATE TABLE orders_apac PARTITION OF orders FOR VALUES IN ('APAC');
INSERT INTO orders SELECT g, c.id, c.region, 5 + (g * 13) % 300
  FROM generate_series(1, 12000) g JOIN customers c ON c.id = 1 + (g * 7) % 3000;
ANALYZE;`

export const lesson: Lesson = {
  slug: 'fragmentation-replication',
  module: 'e5',
  order: 2,
  title: 'Fragmentation, allocation and replication',
  tldr: [
    '**Fragmentation** splits a relation into pieces by rows, by columns or both, **allocation** decides which site stores each piece, and **replication** keeps more than one copy of a piece.',
    'Three rules (completeness, reconstruction, disjointness) keep a fragmented relation equal to the original, and the placement scheme decides how much data moves when nodes come and go.',
  ],
  visualizer: {
    title: 'Fragment, place and copy',
    caption: 'Pick a fragmentation scheme and switch fragments off to break the rules. Then add nodes to a hash ring and compare keys moved, and step through four replication modes.',
    Component: FragViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'Horizontal fragments and completeness', sql: `SELECT tableoid::regclass AS fragment, count(*) AS rows, min(id) AS min_id, max(id) AS max_id
FROM customers GROUP BY 1 ORDER BY 1;

-- a row that fits no fragment is rejected: completeness is enforced
SELECT try_sql($$INSERT INTO customers VALUES (9001, 'new', 'n@example.com', 'LATAM', 'std', 0)$$) AS insert_latam;

-- a DEFAULT fragment catches everything the other predicates miss
CREATE TABLE customers_other PARTITION OF customers DEFAULT;
SELECT try_sql($$INSERT INTO customers VALUES (9001, 'new', 'n@example.com', 'LATAM', 'std', 0)$$) AS insert_latam_again;
SELECT tableoid::regclass AS fragment, count(*) FROM customers GROUP BY 1 ORDER BY 1;`,
        note: 'Each partition is a horizontal fragment defined by a predicate on `region`. With no fragment for LATAM the insert fails; the DEFAULT partition is the "none of the above" minterm that makes the set complete.' },
      { label: 'Check disjointness and reconstruction', sql: `-- the DEFAULT fragment from the previous preset, created here if it is missing
CREATE TABLE IF NOT EXISTS customers_other PARTITION OF customers DEFAULT;

-- disjointness: no key appears in two fragments
SELECT count(*) AS ids_in_two_fragments FROM (
  SELECT id FROM customers_eu UNION ALL SELECT id FROM customers_us
  UNION ALL SELECT id FROM customers_apac UNION ALL SELECT id FROM customers_other) f
GROUP BY id HAVING count(*) > 1;

-- reconstruction: the union of the fragments equals the relation, in both directions
WITH u AS (SELECT * FROM customers_eu UNION ALL SELECT * FROM customers_us
           UNION ALL SELECT * FROM customers_apac UNION ALL SELECT * FROM customers_other)
SELECT (SELECT count(*) FROM (SELECT * FROM customers EXCEPT ALL SELECT * FROM u) a) AS missing_from_union,
       (SELECT count(*) FROM (SELECT * FROM u EXCEPT ALL SELECT * FROM customers) b) AS extra_in_union;

-- an overlapping "gold" fragment breaks disjointness
CREATE TABLE customers_gold AS SELECT * FROM customers WHERE tier = 'gold';
SELECT c.tableoid::regclass AS also_in, count(*) AS gold_rows_stored_twice
FROM customers c JOIN customers_gold g USING (id, region) GROUP BY 1 ORDER BY 1;`,
        note: 'The first query returns no rows and both reconstruction counts are 0: the fragments are disjoint and their union is exactly the relation. The gold table duplicates 428 customers that already live in a region fragment.' },
      { label: 'Vertical fragmentation, with and without the key', sql: `CREATE TABLE cust_profile AS SELECT id, region, name, email FROM customers;
CREATE TABLE cust_billing AS SELECT id, region, tier, balance FROM customers;
ALTER TABLE cust_profile ADD PRIMARY KEY (id, region);
ALTER TABLE cust_billing ADD PRIMARY KEY (id, region);

-- reconstruction by join on the repeated key
CREATE VIEW cust_rebuilt AS SELECT p.id, p.name, p.email, p.region, b.tier, b.balance
  FROM cust_profile p JOIN cust_billing b USING (id, region);
SELECT (SELECT count(*) FROM (SELECT * FROM customers EXCEPT ALL SELECT * FROM cust_rebuilt) x) AS lost_rows;

-- why the key matters: without it the only join is a cross product
SELECT (SELECT count(*) FROM cust_profile) * (SELECT count(*) FROM cust_billing) AS cross_product_rows;

-- what a query on one fragment has to read
SELECT 'profile' AS fragment, avg(pg_column_size(p.*))::int AS bytes_per_row FROM cust_profile p
UNION ALL SELECT 'billing', avg(pg_column_size(b.*))::int FROM cust_billing b
UNION ALL SELECT 'whole row', avg(pg_column_size(c.*))::int FROM customers c;`,
        note: 'Both fragments repeat the primary key, so the join rebuilds every row (`lost_rows` = 0). Drop the key and 3,000 rows become 3,000 × 3,000 = 9,000,000 candidate pairs (9,006,001 if the first preset added a 3,001st customer). The last query shows how much narrower each fragment\'s rows are than the whole row.' },
      { label: 'Derived fragmentation follows the foreign key', sql: `SELECT o.tableoid::regclass AS order_fragment, count(*) AS orders FROM orders o GROUP BY 1 ORDER BY 1;

-- each order fragment is the semijoin  orders ⋉ customers_<region>
SELECT 'EU' AS region, count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM customers_eu c WHERE c.id = o.customer_id)) AS orphans
FROM orders_eu o
UNION ALL
SELECT 'US', count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM customers_us c WHERE c.id = o.customer_id)) FROM orders_us o;

-- the foreign key keeps derived fragments complete and disjoint
SELECT try_sql($$INSERT INTO orders VALUES (99999, 1, 'EU', 10)$$) AS order_for_us_customer_tagged_eu;
SELECT region FROM customers WHERE id = 1;`,
        note: 'Orders are placed by their owner\'s fragment, so every EU order has its customer in the EU fragment (0 orphans). Customer 1 is in US, so an order tagged EU violates the foreign key: integrity is what makes derived fragmentation correct.' },
      { label: 'A hash ring in SQL vs hash mod N', sql: `-- 4 nodes x 16 virtual nodes; a key belongs to the first token at or after its hash (wrapping around)
CREATE TABLE ring (token int PRIMARY KEY, node int NOT NULL);
INSERT INTO ring SELECT hashint4(n * 1000 + v), n FROM generate_series(1, 4) n, generate_series(0, 15) v;
CREATE TABLE keys AS SELECT k, hashint4(k) AS h FROM generate_series(1, 10000) k;

CREATE FUNCTION ring_owner(h int) RETURNS int LANGUAGE sql STABLE AS $$
  SELECT coalesce((SELECT node FROM ring WHERE token >= h ORDER BY token LIMIT 1),
                  (SELECT node FROM ring ORDER BY token LIMIT 1)) $$;
CREATE TABLE before AS SELECT k, ring_owner(h) AS ring_node, ((h::bigint + 4294967296) % 4294967296) % 4 AS mod_node FROM keys;

-- add node 5
INSERT INTO ring SELECT hashint4(5000 + v), 5 FROM generate_series(0, 15) v;
SELECT count(*) FILTER (WHERE ring_owner(h) <> b.ring_node) AS ring_moved,
       count(*) FILTER (WHERE ((h::bigint + 4294967296) % 4294967296) % 5 <> b.mod_node) AS mod_moved,
       10000 / 5 AS minimum_possible
FROM keys JOIN before b USING (k);
SELECT ring_owner(h) AS node, count(*) AS keys FROM keys GROUP BY 1 ORDER BY 1;`,
        note: 'The hash function and token formula match the visualizer exactly, so the counts agree: with 16 vnodes the ring moves 3,006 keys, modulo moves 7,986, and the minimum is 2,000. The per-node counts show the remaining imbalance.' },
      { label: 'Allocation: which site stores each fragment', sql: `DROP TABLE IF EXISTS allocation;
CREATE TABLE allocation (fragment regclass, site text, PRIMARY KEY (fragment, site));
INSERT INTO allocation VALUES
  ('customers_eu', 'fra-1'), ('customers_eu', 'ams-1'),
  ('customers_us', 'nyc-1'), ('customers_apac', 'sin-1');

SELECT fragment, count(*) AS copies, string_agg(site, ', ' ORDER BY site) AS sites
FROM allocation GROUP BY fragment ORDER BY fragment::text;`,
        note: 'Allocation is this table: one row per fragment and site. The EU fragment is **partially replicated** (2 copies, on 2 of the 4 sites); the other two are stored once (**partitioned** allocation). A copy on every site would be full replication.' },
      { label: 'Snapshot and partial replication', sql: `-- snapshot replication: a copy taken at one moment
CREATE MATERIALIZED VIEW eu_snapshot AS SELECT id, tier, balance FROM customers WHERE region = 'EU';
UPDATE customers SET balance = balance + 100 WHERE region = 'EU' AND id <= 30;
SELECT (SELECT sum(balance) FROM customers WHERE region = 'EU') AS live, (SELECT sum(balance) FROM eu_snapshot) AS snapshot;
REFRESH MATERIALIZED VIEW eu_snapshot;
SELECT (SELECT sum(balance) FROM customers WHERE region = 'EU') AS live, (SELECT sum(balance) FROM eu_snapshot) AS snapshot;

-- partial replication: publish only the EU rows and only some columns
CREATE PUBLICATION eu_partial FOR TABLE customers (id, region, tier, balance) WHERE (region = 'EU')
  WITH (publish_via_partition_root = true);
SELECT pubname, tablename, attnames, rowfilter FROM pg_publication_tables;`,
        note: 'The snapshot lags by exactly the 1,000 added to 10 EU balances until the refresh. The publication defines a partial, column-filtered replica: subscribers receive only EU rows and four columns.' },
    ],
  },
  production: {
    title: 'Rebalancing a cache tier without a cold start',
    context: 'A session store spreads 40 million keys over 8 nodes with `hash(key) % 8`. Traffic doubles before a sale and the team must add 4 nodes.',
    problem: 'A trial run in staging showed that switching to `% 12` moves about two thirds of all keys (a key stays only when `h mod 8 = h mod 12`). Those keys miss on their new node at once, and the database behind the cache took the full miss rate.',
    solution: 'Move to fixed hash ranges: split the hash space into 1,024 equal ranges, store the range-to-node map in a table, and let nodes take over whole ranges. Adding 4 nodes reassigns exactly the ranges they take over, a third of the space, and can be done range by range while traffic runs.',
    sql: `CREATE TABLE range_map (range_id int PRIMARY KEY, node text NOT NULL);
INSERT INTO range_map SELECT r, 'cache-' || (r % 8) FROM generate_series(0, 1023) r;

-- route a key
SELECT node FROM range_map WHERE range_id = ((hashtext('session:8f2a')::bigint + 2147483648) * 1024 / 4294967296);

-- give the new nodes a third of the ranges, a few at a time
UPDATE range_map SET node = 'cache-' || (8 + range_id % 4) WHERE range_id % 3 = 0;`,
    outcome: 'Each step moves a known number of ranges, so the miss rate during the change is bounded and predictable. The same map later absorbed a node failure by reassigning only that node\'s ranges.',
  },
  pitfalls: [
    { title: 'Overlapping fragments with no owner',
      symptom: 'Reports disagree: a "gold customers" copy shows a balance the region fragment no longer has.',
      cause: 'A fragment defined by a predicate that overlaps others breaks disjointness. Every update must now change two places, and nothing forces it to.',
      fix: 'Derive fragments from minterms of one predicate set, or treat the extra copy as a replica with a defined refresh path (a materialized view, a publication), never as a second source of truth.' },
    { title: 'Vertical split without the key',
      symptom: 'After moving wide columns to another store, nobody can join them back reliably.',
      cause: 'Reconstruction of vertical fragments is a join, and it needs the primary key in every fragment.',
      fix: 'Repeat the full primary key in each vertical fragment and declare it as the key there too.' },
    { title: 'Modulo placement on a growing cluster',
      symptom: 'Adding one node causes a burst of cache misses or a long data migration touching nearly every key.',
      cause: 'With `hash mod N`, going from N to N+1 changes the owner of about N/(N+1) of all keys. Consistent hashing and fixed ranges move only about 1/(N+1).',
      fix: 'Place keys with a ring and virtual nodes, or with many fixed ranges mapped to nodes, so growth moves the minimum.' },
    { title: 'Asynchronous replicas treated as backups of every commit',
      symptom: 'After a failover, recent orders that customers saw confirmed are missing.',
      cause: 'Asynchronous replication acknowledges a commit before the replica has it. Whatever was in flight is lost when the primary dies.',
      fix: 'Use synchronous replication for data that must survive a failover, and measure the lag you accept elsewhere.',
      sql: `ALTER SYSTEM SET synchronous_standby_names = 'ANY 1 (replica_a, replica_b)';
ALTER SYSTEM SET synchronous_commit = 'on';
SELECT pg_reload_conf();` },
  ],
  pointers: [
    'Correctness rules: **completeness** (every item in some fragment), **reconstruction** (union for horizontal, join on the key for vertical), **disjointness** (stored once; vertical fragments repeat only the key).',
    '**Derived horizontal fragmentation** places member rows with their owner: orders_i = orders ⋉ customers_i. The foreign key keeps it complete and disjoint, and makes joins on the key local.',
    'Allocation is partitioned, partially replicated or fully replicated. Replication is **synchronous** (no acknowledged loss, slower commits) or **asynchronous** (fast, loses the lag on failover); active-active adds write conflicts. In practice: [failover with HA clusters](/e3/ha-clusters) and [conflicts in multi-master](/e3/distributed-sql-multimaster); how copies agree on a commit is in [Distributed transactions and consensus](/e5/commit-and-consensus).',
    '**Consistent hashing** moves about 1/(N+1) of keys when a node joins; modulo moves about N/(N+1). **Virtual nodes** even out the load; **fixed ranges** decouple partitioning from placement, as Citus shards do in [sharding with Citus](/e3/sharding-citus).',
    'In PostgreSQL, fragments are [partitions](/m7/partitioning), and replicas come from [streaming](/m7/streaming-replication) or [logical replication](/m7/logical-replication).',
  ],
  sources: ['ddl-partitioning.html', 'sql-createtable.html', 'ddl-constraints.html', 'functions-subquery.html', 'queries-union.html', 'sql-creatematerializedview.html', 'sql-refreshmaterializedview.html', 'sql-createpublication.html', 'view-pg-publication-tables.html', 'warm-standby.html', 'runtime-config-replication.html'],
}
