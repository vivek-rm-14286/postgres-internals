import { useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, Note, SqlLine } from './_ui'
import * as R from './_range'
import * as N from './_net'

/* ------------------------------------------------------------------------------------------------
 * Visualizer, three views:
 *   1. Two ranges: drag the bounds of A and B, flip brackets, and read every range operator. The
 *      operator logic in _range.ts mirrors PostgreSQL's and was checked against PostgreSQL 18.
 *   2. Bookings: an exclusion constraint on (room_id WITH =, during WITH &&), with free time from
 *      tstzmultirange(day) - range_agg(during). Error text matches PostgreSQL's.
 *   3. Networks: a cidr containment tree; pick an address to see >>= matches and the longest prefix.
 * ---------------------------------------------------------------------------------------------- */

type View = 'ops' | 'book' | 'net'

/* ---------- 1. Two ranges ---------- */

interface In { lo: number; hi: number; loInc: boolean; hiInc: boolean; loInf: boolean; hiInf: boolean }
type Op = 'union' | 'inter' | 'minus' | 'mrUnion' | 'mrMinus'
const MAXV = 20
const X0 = 40, STEP = 28
const xOf = (v: number) => X0 + v * STEP

const toR = (k: R.Kind, a: In) => R.mk(k, a.loInf ? null : a.lo, a.hiInf ? null : a.hi, a.loInc, a.hiInc)
const lit = (a: In) => `${a.loInf ? '(' : a.loInc ? '[' : '('}${a.loInf ? '' : a.lo},${a.hiInf ? '' : a.hi}${a.hiInf ? ')' : a.hiInc ? ']' : ')'}`
const inp = (lo: number, hi: number, b = '[)', inf = ''): In => ({ lo, hi, loInc: b[0] === '[', hiInc: b[1] === ']', loInf: inf.includes('l'), hiInf: inf.includes('h') })

const OP_LABEL: Record<Op, string> = { union: 'A + B', inter: 'A * B', minus: 'A - B', mrUnion: 'multirange A + B', mrMinus: 'multirange A - B' }
const TOUR: { k: R.Kind; a: In; b: In; op: Op; note: string }[] = [
  { k: 'int', a: inp(2, 8), b: inp(5, 12), op: 'inter', note: '**Overlap**: both contain 5, 6 and 7, so `A && B` is true. The intersection `A * B` is `[5,8)`.' },
  { k: 'int', a: inp(2, 6), b: inp(6, 10), op: 'union', note: '**Half-open** ranges `[)` that touch share no point: `&&` is false and `-|-` (adjacent) is true. Their union is one range, `[2,10)`.' },
  { k: 'num', a: inp(2, 6, '[]'), b: inp(6, 10, '[]'), op: 'inter', note: 'With **closed** upper bounds both ranges contain 6, so they overlap at that single point: `A * B` is `[6,6]`. Two meetings booked as `[9:00,10:00]` and `[10:00,11:00]` would collide.' },
  { k: 'int', a: inp(2, 5, '[]'), b: inp(1, 6, '()'), op: 'union', note: 'A **discrete** range is stored in canonical `[)` form. `[2,5]` and `(1,6)` both become `[2,6)`, so `A = B` is true.' },
  { k: 'int', a: inp(2, 5), b: inp(8, 12), op: 'union', note: 'A gap: `A + B` cannot be one range, so PostgreSQL raises an error. A **multirange** holds both pieces: `{[2,5),[8,12)}`.' },
  { k: 'int', a: inp(2, 14), b: inp(6, 9), op: 'minus', note: 'B sits inside A (`A @> B`). `A - B` would leave a hole, which is an error for a range; the multirange difference gives `{[2,6),[9,14)}`.' },
  { k: 'num', a: inp(0, 6, '()', 'l'), b: inp(4, 20, '[)', 'h'), op: 'inter', note: 'An omitted bound means **unbounded**: `(,6)` is everything below 6 and `[4,)` everything from 4 up. The intersection is `[4,6)`.' },
  { k: 'int', a: inp(3, 12), b: inp(7, 7), op: 'inter', note: '`[7,7)` is **empty**. Every range contains the empty range, but nothing overlaps it, and empty sorts before every other range.' },
]

function Bracket({ x, y, ch, t }: { x: number; y: number; ch: string; t: Tone }) {
  return <text x={x} y={y + 6} textAnchor="middle" fontSize={20} fontWeight={700} fill={tone(t)} className="font-mono">{ch}</text>
}

function RangeBar({ r, y, t, label, id }: { r: R.Rng; y: number; t: Tone; label: string; id: string }) {
  if (r.empty) return <text x={X0} y={y + 4} fontSize={12} fill="var(--muted)" className="font-mono">{label}: empty</text>
  const x1 = r.lo === null ? 10 : xOf(r.lo), x2 = r.hi === null ? 630 : xOf(r.hi)
  return (
    <g>
      <motion.rect layoutId={id} initial={false} animate={{ x: x1, width: Math.max(2, x2 - x1) }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        y={y - 8} height={16} rx={4} fill={toneBg(t, 26)} stroke={tone(t)} strokeWidth={1.5} strokeDasharray={r.lo === null || r.hi === null ? '0' : undefined} />
      {r.lo === null ? <text x={6} y={y + 5} fontSize={14} fill={tone(t)}>◀</text> : <Bracket x={x1} y={y} ch={r.loInc ? '[' : '('} t={t} />}
      {r.hi === null ? <text x={622} y={y + 5} fontSize={14} fill={tone(t)}>▶</text> : <Bracket x={x2} y={y} ch={r.hiInc ? ']' : ')'} t={t} />}
    </g>
  )
}

function OpsView() {
  const [k, setK] = useState<R.Kind>('int')
  const [a, setA] = useState<In>(TOUR[0].a)
  const [b, setB] = useState<In>(TOUR[0].b)
  const [op, setOp] = useState<Op>('inter')
  const [tour, setTour] = useState(0)
  const [drag, setDrag] = useState<null | ['a' | 'b', 'lo' | 'hi']>(null)
  const svg = useRef<SVGSVGElement>(null)

  const ra = toR(k, a), rb = toR(k, b)
  const ty = k === 'int' ? 'int4range' : 'numrange', mty = k === 'int' ? 'int4multirange' : 'nummultirange'
  let res: R.Rng[] | null = null, err: string | null = null
  if (op === 'union') { const u = R.union(k, ra, rb); if (u) res = [u]; else err = 'result of range union would not be contiguous' }
  else if (op === 'inter') res = [R.intersect(k, ra, rb)]
  else if (op === 'minus') { const m = R.minus(k, ra, rb); if (m) res = [m]; else err = 'result of range difference would not be contiguous' }
  else if (op === 'mrUnion') res = R.normalize(k, [ra, rb])
  else res = R.mrMinus(k, [ra], [rb])
  const resText = res ? (op.startsWith('mr') ? R.fmtMr(res) : R.fmt(res[0])) : undefined
  const sqlA = `'${lit(a)}'::${ty}`, sqlB = `'${lit(b)}'::${ty}`
  const sql = op.startsWith('mr') ? `SELECT ${sqlA}::${mty} ${op === 'mrUnion' ? '+' : '-'} ${sqlB}::${mty};` : `SELECT ${sqlA} ${op === 'union' ? '+' : op === 'inter' ? '*' : '-'} ${sqlB};`

  const ops: [string, boolean][] = [
    ['A && B', R.overlaps(ra, rb)], ['A @> B', R.contains(ra, rb)], ['A <@ B', R.contains(rb, ra)], ['A -|- B', R.adjacent(k, ra, rb)],
    ['A << B', R.before(ra, rb)], ['A >> B', R.after(ra, rb)], ['A &< B', R.overLeft(ra, rb)], ['A &> B', R.overRight(ra, rb)], ['A = B', R.fmt(ra) === R.fmt(rb)],
  ]

  const valueAt = (clientX: number) => {
    const el = svg.current
    if (!el) return 0
    const box = el.getBoundingClientRect()
    const ux = ((clientX - box.left) / box.width) * 640
    return Math.max(0, Math.min(MAXV, Math.round((ux - X0) / STEP)))
  }
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drag) return
    const v = valueAt(e.clientX)
    const [w, end] = drag
    const set = w === 'a' ? setA : setB
    set((cur) => end === 'lo' ? { ...cur, lo: Math.min(v, cur.hi) } : { ...cur, hi: Math.max(v, cur.lo) })
  }
  const handle = (w: 'a' | 'b', end: 'lo' | 'hi', r: In, y: number, t: Tone) => {
    if ((end === 'lo' && r.loInf) || (end === 'hi' && r.hiInf)) return null
    const v = end === 'lo' ? r.lo : r.hi
    return (
      <motion.circle key={w + end} initial={false} animate={{ cx: xOf(v) }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} cy={y + 17} r={7}
        fill={tone(t)} stroke="var(--surface)" strokeWidth={2} style={{ cursor: 'ew-resize' }}
        onPointerDown={(e) => { (e.target as SVGElement).ownerSVGElement?.setPointerCapture(e.pointerId); setDrag([w, end]) }} />
    )
  }
  const dots = (r: R.Rng, y: number, t: Tone) => k !== 'int' || r.empty ? null
    : Array.from({ length: MAXV + 1 }, (_, v) => v).filter((v) => R.containsElem(r, v)).map((v) => <circle key={v} cx={xOf(v)} cy={y} r={2.6} fill={tone(t)} />)

  const next = () => {
    const n = (tour + 1) % TOUR.length, s = TOUR[n]
    setTour(n); setK(s.k); setA(s.a); setB(s.b); setOp(s.op)
  }
  const tourNow = TOUR[tour]
  const onTour = tourNow.k === k && lit(tourNow.a) === lit(a) && lit(tourNow.b) === lit(b)
  const generic = `A = \`${R.fmt(ra)}\`, B = \`${R.fmt(rb)}\`${k === 'int' && (lit(a) !== R.fmt(ra) || lit(b) !== R.fmt(rb)) ? ' (int4range stores the canonical `[)` form)' : ''}. Drag the dots, flip the brackets, or press **Next case**.`

  const boundCtl = (w: 'A' | 'B', r: In, set: (f: (x: In) => In) => void) => (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-mono font-semibold" style={{ color: tone(w === 'A' ? 'tuple' : 'pointer') }}>{w}</span>
      <Segmented label={`${w} lower bound`} value={r.loInf ? 'inf' : r.loInc ? 'inc' : 'exc'} onChange={(v) => set((x) => ({ ...x, loInf: v === 'inf', loInc: v === 'inc' }))} options={[['inc', '['], ['exc', '('], ['inf', 'no lower']]} />
      <Segmented label={`${w} upper bound`} value={r.hiInf ? 'inf' : r.hiInc ? 'inc' : 'exc'} onChange={(v) => set((x) => ({ ...x, hiInf: v === 'inf', hiInc: v === 'inc' }))} options={[['exc', ')'], ['inc', ']'], ['inf', 'no upper']]} />
    </div>
  )

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Range type" value={k} onChange={setK} options={[['int', 'int4range (discrete)'], ['num', 'numrange (continuous)']]} />
        <Btn primary testid="viz-next" onClick={next}>Next case →</Btn>
      </div>
      <div className="grid gap-1.5 sm:grid-cols-2">{boundCtl('A', a, setA)}{boundCtl('B', b, setB)}</div>
      <div className="overflow-x-auto scrollbar-thin">
        <svg ref={svg} viewBox="0 0 640 220" className="w-full min-w-[520px] select-none" style={{ touchAction: 'none' }}
          onPointerMove={onMove} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
          {Array.from({ length: MAXV + 1 }, (_, v) => (
            <g key={v}>
              <line x1={xOf(v)} x2={xOf(v)} y1={18} y2={200} stroke="var(--line)" strokeWidth={v % 5 === 0 ? 1 : 0.5} />
              <text x={xOf(v)} y={214} fontSize={10.5} textAnchor="middle" fill="var(--muted)" className="font-mono">{v}</text>
            </g>
          ))}
          <text x={4} y={44} fontSize={12} fontWeight={700} fill={tone('tuple')}>A</text>
          <text x={4} y={104} fontSize={12} fontWeight={700} fill={tone('pointer')}>B</text>
          <RangeBar r={R.mk('num', a.loInf ? null : a.lo, a.hiInf ? null : a.hi, a.loInc, a.hiInc)} y={40} t="tuple" label="A" id="ra" />
          {dots(ra, 40, 'tuple')}
          {handle('a', 'lo', a, 40, 'tuple')}{handle('a', 'hi', a, 40, 'tuple')}
          <RangeBar r={R.mk('num', b.loInf ? null : b.lo, b.hiInf ? null : b.hi, b.loInc, b.hiInc)} y={100} t="pointer" label="B" id="rb" />
          {dots(rb, 100, 'pointer')}
          {handle('b', 'lo', b, 100, 'pointer')}{handle('b', 'hi', b, 100, 'pointer')}
          <text x={4} y={158} fontSize={11} fontWeight={700} fill={tone(err ? 'dead' : 'ok')}>{OP_LABEL[op].replace('multirange ', 'mr ')}</text>
          {err
            ? <text x={xOf(2)} y={170} fontSize={12} fill={tone('dead')} className="font-mono">ERROR: {err}</text>
            : res!.length === 0
              ? <text x={xOf(2)} y={170} fontSize={12} fill="var(--muted)" className="font-mono">{op.startsWith('mr') ? '{}  (empty multirange)' : 'empty'}</text>
              : res!.map((r, i) => <g key={i}><RangeBar r={r} y={166} t="ok" label="result" id={`res${i}`} />{dots(r, 166, 'ok')}</g>)}
        </svg>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-2">
          <Segmented label="Operation" value={op} onChange={setOp} options={[['union', '+'], ['inter', '*'], ['minus', '-'], ['mrUnion', 'multi +'], ['mrMinus', 'multi -']]} />
          <SqlLine sql={sql} result={resText} error={err ?? undefined} />
        </div>
        <div className="grid grid-cols-3 gap-1.5 self-start">
          {ops.map(([l, v]) => (
            <motion.div key={l} layout className="rounded-md border px-2 py-1 font-mono text-[11.5px]"
              animate={{ backgroundColor: toneBg(v ? 'ok' : 'muted', v ? 22 : 8) }} style={{ borderColor: v ? tone('ok') : 'var(--line)' }}>
              <span className="text-muted">{l}</span> <span className="font-semibold" style={{ color: v ? tone('ok') : 'var(--muted)' }}>{v ? 'true' : 'false'}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <Note>{onTour ? tourNow.note : generic}</Note>
      <Legend items={[['tuple', 'range A'], ['pointer', 'range B'], ['ok', 'result / true'], ['dead', 'error']]} />
    </div>
  )
}

/* ---------- 2. Bookings with an exclusion constraint ---------- */

interface Booking { room: number; guest: string; lo: number; hi: number; hiInc?: boolean; added?: boolean }
const ROOMS: [number, string][] = [[1, 'Lisbon'], [2, 'Oslo']]
const BASE: Booking[] = [
  { room: 1, guest: 'standup', lo: 540, hi: 600 }, { room: 1, guest: 'design', lo: 600, hi: 690 }, { room: 1, guest: 'review', lo: 840, hi: 900 },
  { room: 2, guest: 'workshop', lo: 570, hi: 720 }, { room: 2, guest: 'interview', lo: 780, hi: 840 },
]
const DAY0 = 480, DAY1 = 1080
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const ts = (m: number) => `"2026-11-16 ${hm(m)}:00+00"`
const tsr = (b: Booking) => `[${ts(b.lo)},${ts(b.hi)}${b.hiInc ? ']' : ')'}`
const bx = (m: number) => 60 + ((m - DAY0) / (DAY1 - DAY0)) * 560
const asR = (b: Booking) => R.mk('num', b.lo, b.hi, true, !!b.hiInc)
const SCEN: { c: Booking; note: string }[] = [
  { c: { room: 1, guest: 'lunch', lo: 690, hi: 750 }, note: '`[11:30,12:30)` starts exactly where `design` ends. Half-open ranges that touch do not overlap, so the insert **succeeds**.' },
  { c: { room: 1, guest: 'sync', lo: 870, hi: 930 }, note: '`[14:30,15:30)` overlaps `review` in Lisbon. The exclusion constraint finds a row with the same `room_id` **and** an overlapping `during`, and rejects the insert.' },
  { c: { room: 2, guest: 'retro', lo: 870, hi: 930 }, note: 'The same time in **Oslo** is fine: the constraint only compares rows whose `room_id` is equal (`room_id WITH =`).' },
  { c: { room: 1, guest: 'early', lo: 480, hi: 540, hiInc: true }, note: '`[08:00,09:00]` has a **closed** upper bound, so it includes 09:00, the first instant of `standup`. One shared instant is an overlap: rejected.' },
]

function BookView() {
  const [rows, setRows] = useState<Booking[]>(BASE)
  const [cand, setCand] = useState<Booking>(SCEN[0].c)
  const [msg, setMsg] = useState<{ ok: boolean; text: string; detail?: string } | null>(null)
  const [scen, setScen] = useState(-1)

  const tryBook = (c: Booking, current: Booking[]) => {
    const clash = current.filter((b) => b.room === c.room && R.overlaps(asR(b), asR(c))).sort((x, y) => x.lo - y.lo)[0]
    if (clash) {
      setMsg({ ok: false, text: 'conflicting key value violates exclusion constraint "bookings_room_id_during_excl"',
        detail: `Key (room_id, during)=(${c.room}, ${tsr(c)}) conflicts with existing key (room_id, during)=(${clash.room}, ${tsr(clash)}).` })
      return current
    }
    setMsg({ ok: true, text: 'INSERT 0 1' })
    return [...current, { ...c, added: true }]
  }
  const next = () => {
    const n = scen + 1
    if (n >= SCEN.length) { setRows(BASE); setScen(-1); setCand(SCEN[0].c); setMsg(null); return }
    setScen(n); setCand(SCEN[n].c); setRows((cur) => tryBook(SCEN[n].c, cur))
  }
  const bump = (f: 'lo' | 'hi', d: number) => setCand((c) => {
    const v = Math.max(DAY0, Math.min(DAY1, c[f] + d))
    return f === 'lo' ? { ...c, lo: Math.min(v, c.hi - 30) } : { ...c, hi: Math.max(v, c.lo + 30) }
  })

  const free = (room: number) => R.mrMinus('num', [R.mk('num', DAY0, DAY1, true, false)], rows.filter((b) => b.room === room).map(asR))
  const note = scen >= 0 && JSON.stringify(SCEN[scen].c) === JSON.stringify(cand) ? SCEN[scen].note
    : 'Pick a room and a time, then **Insert**. The constraint `EXCLUDE USING gist (room_id WITH =, during WITH &&)` rejects any row that matches an existing one on both.'

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={next}>{scen + 1 >= SCEN.length ? 'Reset bookings' : 'Try next booking →'}</Btn>
        <Segmented label="Room" value={String(cand.room)} onChange={(v) => setCand((c) => ({ ...c, room: Number(v) }))} options={[['1', 'Lisbon'], ['2', 'Oslo']]} />
        <span className="inline-flex items-center gap-1 text-xs"><Btn onClick={() => bump('lo', -30)}>−</Btn><span className="font-mono">{hm(cand.lo)}</span><Btn onClick={() => bump('lo', 30)}>+</Btn></span>
        <span className="inline-flex items-center gap-1 text-xs"><Btn onClick={() => bump('hi', -30)}>−</Btn><span className="font-mono">{hm(cand.hi)}</span><Btn onClick={() => bump('hi', 30)}>+</Btn></span>
        <Segmented label="Upper bound" value={cand.hiInc ? ']' : ')'} onChange={(v) => setCand((c) => ({ ...c, hiInc: v === ']' }))} options={[[')', ')'], [']', ']']]} />
        <Btn onClick={() => { setScen(-1); setRows((cur) => tryBook({ ...cand, guest: 'new' }, cur)) }}>Insert</Btn>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <svg viewBox="0 0 640 196" className="w-full min-w-[520px]">
          {Array.from({ length: 11 }, (_, i) => DAY0 + i * 60).map((m) => (
            <g key={m}>
              <line x1={bx(m)} x2={bx(m)} y1={14} y2={170} stroke="var(--line)" strokeWidth={0.8} />
              <text x={bx(m)} y={186} fontSize={10.5} textAnchor="middle" fill="var(--muted)" className="font-mono">{hm(m)}</text>
            </g>
          ))}
          {ROOMS.map(([id, name], ri) => {
            const y = 30 + ri * 72
            return (
              <g key={id}>
                <text x={4} y={y + 18} fontSize={11.5} fontWeight={700} fill="var(--text)">{name}</text>
                <text x={4} y={y + 31} fontSize={10} fill="var(--muted)" className="font-mono">room {id}</text>
                {free(id).map((f, i) => <rect key={`f${i}-${f.lo}`} x={bx(f.lo!)} y={y + 40} width={bx(f.hi!) - bx(f.lo!)} height={8} rx={2} fill={toneBg('free', 100)} stroke={tone('ok')} strokeWidth={0.8} strokeDasharray="3 2" />)}
                <AnimatePresence>
                  {rows.filter((b) => b.room === id).map((b) => (
                    <motion.g key={b.guest + b.lo} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <rect x={bx(b.lo) + 1} y={y + 4} width={bx(b.hi) - bx(b.lo) - 2} height={30} rx={5} fill={toneBg(b.added ? 'new' : 'tuple', 26)} stroke={tone(b.added ? 'new' : 'tuple')} strokeWidth={1.3} />
                      <text x={bx(b.lo) + 6} y={y + 23} fontSize={10.5} fill="var(--text)" className="font-mono">{b.guest}</text>
                    </motion.g>
                  ))}
                </AnimatePresence>
                {cand.room === id && (
                  <motion.rect initial={false} animate={{ x: bx(cand.lo), width: bx(cand.hi) - bx(cand.lo) }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                    y={y + 1} height={36} rx={6} fill="none" stroke={tone('accent')} strokeWidth={2} strokeDasharray="5 3" />
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="grid gap-2">
        <SqlLine sql={`INSERT INTO bookings (room_id, guest, during) VALUES (${cand.room}, '${cand.guest}', '[2026-11-16 ${hm(cand.lo)}, 2026-11-16 ${hm(cand.hi)}${cand.hiInc ? ']' : ')'}');`}
          result={msg?.ok ? msg.text : undefined} error={msg && !msg.ok ? `${msg.text}\nDETAIL:  ${msg.detail}` : undefined} />
        <div className="flex flex-wrap gap-2 text-xs">
          {ROOMS.map(([id, name]) => <span key={id}><span className="text-muted">{name} free: </span><Tag t="ok">{free(id).map((f) => `[${hm(f.lo!)},${hm(f.hi!)})`).join(' ')}</Tag></span>)}
        </div>
      </div>
      <Note>{note}</Note>
      <Legend items={[['tuple', 'existing booking'], ['new', 'booking you added'], ['accent', 'candidate'], ['ok', 'free time: day minus range_agg(during)']]} />
    </div>
  )
}

/* ---------- 3. Network containment ---------- */

const SUBNETS: [string, string][] = [
  ['0.0.0.0/0', 'internet'], ['10.0.0.0/8', 'corp'], ['10.1.0.0/16', 'office-pune'], ['10.1.2.0/24', 'pune-wifi'],
  ['10.1.2.128/25', 'pune-guests'], ['10.1.3.0/24', 'pune-lab'], ['10.2.0.0/16', 'office-leeds'], ['192.168.0.0/16', 'vpn'], ['192.168.1.0/24', 'vpn-admins'],
]
const NETS = SUBNETS.map(([s, site]) => ({ s, site, n: N.parseNet(s) }))
const depthOf = (i: number) => NETS.filter((o, j) => j !== i && N.strictlyContains(o.n, NETS[i].n)).length
const IPS = ['10.1.2.200', '10.1.2.5', '10.1.3.7', '10.2.40.1', '10.9.9.9', '192.168.1.20', '172.16.0.1']
const IP_NOTE: Record<string, string> = {
  '10.1.2.200': 'Five networks contain this address. The **longest prefix** (largest `masklen`) is the most specific: `10.1.2.128/25`, the guest Wi-Fi.',
  '10.1.2.5': 'Same /24 as before, but below .128, so the /25 guest network no longer matches. The best match is `pune-wifi`.',
  '10.1.3.7': '`>>=` means "contains or equals". The lab /24 is the most specific network here.',
  '10.2.40.1': 'Inside `10.2.0.0/16`: the Leeds office, then corp, then the default route.',
  '10.9.9.9': 'Inside 10/8 but in no /16 we know: the best match is `corp`.',
  '192.168.1.20': 'A second branch of the tree: `vpn-admins` inside `vpn`.',
  '172.16.0.1': 'Only `0.0.0.0/0` matches: it contains every IPv4 address, like a default route.',
}

function NetView() {
  const [ip, setIp] = useState('10.1.2.200')
  const [text, setText] = useState('10.1.2.200')
  const [sel, setSel] = useState(4)
  const ipn = N.parseIp(ip)!
  const hits = NETS.map((x) => N.containsIp(x.n, ipn))
  const best = hits.reduce((bi, h, i) => (h && (bi < 0 || NETS[i].n.len > NETS[bi].n.len) ? i : bi), -1)
  const sn = NETS[sel].n
  const k = IPS.indexOf(ip)
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={() => { const n = IPS[(k + 1) % IPS.length]; setIp(n); setText(n) }}>Next address →</Btn>
        {IPS.map((x) => <Btn key={x} active={x === ip} onClick={() => { setIp(x); setText(x) }}><span className="font-mono">{x}</span></Btn>)}
        <input value={text} onChange={(e) => { setText(e.target.value); if (N.parseIp(e.target.value) !== null) setIp(e.target.value.trim()) }} aria-label="IPv4 address"
          className="w-32 rounded-lg border bg-bg px-2 py-1 font-mono text-xs" style={{ borderColor: N.parseIp(text) === null ? tone('dead') : 'var(--line)' }} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="subnets (click one)">
          <div className="grid gap-1">
            {NETS.map((x, i) => (
              <motion.button key={x.s} type="button" layout onClick={() => setSel(i)}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-left font-mono text-[12px]"
                animate={{ backgroundColor: i === best ? toneBg('ok', 30) : hits[i] ? toneBg('new', 16) : 'rgba(0,0,0,0)' }}
                style={{ marginLeft: depthOf(i) * 16, borderColor: i === sel ? tone('accent') : i === best ? tone('ok') : hits[i] ? tone('new') : 'var(--line)' }}>
                <span>{x.s}</span>
                <span className="font-sans text-[11px] text-muted">{x.site}{i === best ? ' · best match' : ''}</span>
              </motion.button>
            ))}
          </div>
        </Panel>
        <div className="grid gap-2 self-start">
          <SqlLine sql={`SELECT net, site FROM subnets WHERE net >>= inet '${ip}' ORDER BY masklen(net) DESC LIMIT 1;`} result={best >= 0 ? `${NETS[best].s} | ${NETS[best].site}` : '(0 rows)'} />
          <Panel title={`functions on cidr '${NETS[sel].s}'`}>
            <table className="w-full font-mono text-[11.5px]">
              <tbody>
                {([['network(net)', N.cidrText(sn)], ['broadcast(net)', `${N.ipStr(N.broadcast(sn))}/${sn.len}`], ['netmask(net)', N.ipStr(N.netmask(sn))], ['masklen(net)', String(sn.len)], ['addresses', N.size(sn).toLocaleString('en-US')], [`net >>= '${ip}'`, String(N.containsIp(sn, ipn))]] as [string, string][]).map(([f, v]) => (
                  <tr key={f} className="border-b border-line last:border-0"><td className="py-0.5 pr-2 text-muted">{f}</td><td className="py-0.5 break-all">{v}</td></tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
      <Note>{IP_NOTE[ip] ?? `${hits.filter(Boolean).length} networks contain ${ip}; the most specific is ${best >= 0 ? NETS[best].s : 'none'}.`}</Note>
      <Legend items={[['new', 'contains the address (>>=)'], ['ok', 'longest prefix match'], ['accent', 'selected network']]} />
    </div>
  )
}

function RangesViz() {
  const [view, setView] = useState<View>('ops')
  return (
    <div className="grid gap-3">
      <Segmented label="View" value={view} onChange={setView} options={[['ops', 'Two ranges'], ['book', 'Bookings'], ['net', 'IP networks']]} />
      {view === 'ops' ? <OpsView /> : view === 'book' ? <BookView /> : <NetView />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'ranges-and-special-types',
  module: 'f2',
  order: 7,
  title: 'Ranges and other special types',
  tldr: [
    'A **range** stores an interval such as a booking time or a quantity band as one value with two bounds, and PostgreSQL also ships types for IP networks, geometry and your own composite records.',
    'These types let the database answer questions like "do these overlap?" or "which subnet holds this address?" with one operator and an index, and refuse bad data such as double bookings outright.',
  ],
  visualizer: {
    title: 'Ranges, bookings and networks',
    caption: '**Two ranges**: drag the dots, flip the brackets and pick an operation; **Next case** walks the key cases. **Bookings**: try inserts against an exclusion constraint. **IP networks**: pick an address and see which subnets contain it.',
    Component: RangesViz,
  },
  playground: {
    extensions: ['btree_gist'],
    setup: `
SET TimeZone = 'UTC';
-- meeting rooms: no two bookings of one room may overlap
CREATE TABLE rooms (id int PRIMARY KEY, name text NOT NULL);
INSERT INTO rooms VALUES (1, 'Lisbon'), (2, 'Oslo');
CREATE TABLE bookings (
  id      int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id int NOT NULL REFERENCES rooms,
  guest   text NOT NULL,
  during  tstzrange NOT NULL,
  EXCLUDE USING gist (room_id WITH =, during WITH &&)
);
INSERT INTO bookings (room_id, guest, during) VALUES
  (1, 'standup',   '[2026-11-16 09:00, 2026-11-16 10:00)'),
  (1, 'design',    '[2026-11-16 10:00, 2026-11-16 11:30)'),
  (1, 'review',    '[2026-11-16 14:00, 2026-11-16 15:00)'),
  (2, 'workshop',  '[2026-11-16 09:30, 2026-11-16 12:00)'),
  (2, 'interview', '[2026-11-16 13:00, 2026-11-16 14:00)');

-- volume pricing: quantity bands
CREATE TABLE price_bands (qty int4range PRIMARY KEY, unit_price numeric NOT NULL);
INSERT INTO price_bands VALUES ('[1,10)', 4.00), ('[10,100)', 3.20), ('[100,)', 2.50);

-- networks and a log of client addresses
CREATE TABLE subnets (net cidr PRIMARY KEY, site text NOT NULL);
INSERT INTO subnets VALUES ('0.0.0.0/0', 'internet'), ('10.0.0.0/8', 'corp'), ('10.1.0.0/16', 'office-pune'),
  ('10.1.2.0/24', 'pune-wifi'), ('10.1.2.128/25', 'pune-guests'), ('10.1.3.0/24', 'pune-lab'),
  ('10.2.0.0/16', 'office-leeds'), ('192.168.0.0/16', 'vpn'), ('192.168.1.0/24', 'vpn-admins');
CREATE TABLE access_log (id int PRIMARY KEY, client inet NOT NULL);
INSERT INTO access_log
SELECT g, ('10.' || g % 3 || '.' || (g / 3) % 256 || '.' || (g * 37) % 256)::inet
FROM generate_series(1, 20000) g;

-- shops on a 100 x 100 map
CREATE TABLE stores (id int PRIMARY KEY, name text NOT NULL, loc point NOT NULL);
INSERT INTO stores
SELECT g, 'store ' || g, point((g * 37) % 997 / 10.0, (g * 91) % 991 / 10.0)
FROM generate_series(1, 5000) g;
ANALYZE;`,
    presets: [
      { label: 'Range basics: bounds and canonical form', sql: `SELECT int4range(1, 10)            AS default_bounds,
       int4range(1, 10, '[]')        AS closed_input,
       '(1,10]'::int4range           AS open_lower_input,
       numrange(1, 10, '[]')         AS continuous,
       '[3,3)'::int4range            AS empty_range,
       '[2026-11-16,)'::daterange    AS open_ended,
       daterange('2026-11-01', '2026-11-30', '[]') AS november;

SELECT r, lower(r), upper(r), lower_inc(r), upper_inc(r), lower_inf(r), upper_inf(r), isempty(r)
FROM (VALUES ('[1,10)'::int4range), ('[1,10]'), ('(,5)'), ('[4,4)')) AS v(r);

SELECT r, upper(r), upper_inf(r)
FROM (VALUES ('[2026-11-16,)'::daterange), ('[2026-11-16,infinity)')) AS v(r);`,
        note: '`[` and `]` include a bound, `(` and `)` exclude it; the default is `[)`. Discrete ranges (int4range, int8range, daterange) are stored in canonical `[)` form, so `[1,10]` reads back as `[1,11)`. An omitted bound is **unbounded** (`upper_inf` true), which is not the same as the value `infinity`.' },
      { label: 'Range operators and lookups', sql: `SELECT '[1,10)'::int4range @> 5                   AS contains_element,
       '[1,10)'::int4range @> '[2,4)'::int4range     AS contains_range,
       '[2,4)'::int4range <@ '[1,10)'::int4range     AS contained_by,
       '[1,5)'::int4range && '[5,9)'::int4range      AS overlap,
       '[1,5)'::int4range -|- '[5,9)'::int4range     AS adjacent,
       '[1,5)'::int4range << '[5,9)'::int4range      AS strictly_left,
       '[1,5)'::int4range + '[5,9)'::int4range       AS "union",
       '[1,8)'::int4range * '[5,12)'::int4range      AS intersection,
       '[1,8)'::int4range - '[5,12)'::int4range      AS difference;

SELECT q AS quantity, unit_price
FROM generate_series(0, 150, 50) AS q
LEFT JOIN price_bands ON qty @> q;`,
        note: '`@>` tests containment, `&&` overlap, `-|-` adjacency, `<<` "entirely left of". Half-open `[1,5)` and `[5,9)` do not overlap but are adjacent, so their union is one range. A quantity of 0 falls in no band; 150 falls in the unbounded `[100,)`.' },
      { label: 'Multiranges and free time', sql: `SELECT room_id, range_agg(during) AS busy
FROM bookings GROUP BY room_id ORDER BY room_id;

SELECT room_id,
       unnest(tstzmultirange(tstzrange('2026-11-16 08:00', '2026-11-16 18:00')) - range_agg(during)) AS free_slot
FROM bookings GROUP BY room_id ORDER BY 1, 2;

SELECT '{[1,3), [2,6), [8,9)}'::int4multirange    AS normalized,
       '{[1,10)}'::int4multirange - '{[3,5)}'      AS split_in_two,
       range_merge('{[1,3), [8,9)}'::int4multirange) AS covering_range;`,
        note: 'A **multirange** is a sorted set of non-overlapping ranges. `range_agg` merges touching bookings, so Lisbon\'s 09:00 and 10:00 meetings become one busy block. Subtracting it from the working day gives the free slots, even when the result has holes.' },
      { label: 'No double bookings', sql: `INSERT INTO bookings (room_id, guest, during) VALUES
  (1, 'lunch', '[2026-11-16 11:30, 2026-11-16 12:30)'),
  (2, 'retro', '[2026-11-16 14:30, 2026-11-16 15:30)');

DO $$
BEGIN
  INSERT INTO bookings (room_id, guest, during) VALUES (1, 'sync', '[2026-11-16 14:30, 2026-11-16 15:30)');
EXCEPTION WHEN exclusion_violation THEN
  RAISE NOTICE '%', SQLERRM;
END $$;

-- PostgreSQL 18: the same rule as a temporal primary key
CREATE TABLE room_slots (
  room_id int,
  during  tstzrange,
  PRIMARY KEY (room_id, during WITHOUT OVERLAPS)
);

SET enable_seqscan = off;
EXPLAIN (COSTS OFF) SELECT * FROM bookings WHERE during && tstzrange('2026-11-16 09:45', '2026-11-16 10:15');
RESET enable_seqscan;`,
        note: 'The two touching or other-room bookings are accepted; `sync` overlaps `review` in room 1 and the exclusion constraint rejects it (see the notice, SQLSTATE 23P01). `WITHOUT OVERLAPS` builds the same kind of GiST-backed rule into a primary key. The constraint\'s GiST index also serves `&&` searches.' },
      { label: 'Network types: inet and cidr', sql: `SELECT '192.168.1.5/24'::inet         AS inet_keeps_host,
       '192.168.1.0/24'::cidr         AS cidr_is_a_network,
       host('192.168.1.5/24'::inet)    AS host,
       network('192.168.1.5/24'::inet) AS network,
       broadcast('192.168.1.0/24'::cidr) AS broadcast,
       netmask('192.168.1.0/24'::cidr) AS netmask,
       inet '10.1.2.3' + 1             AS next_address,
       '08:00:2b:01:02:03'::macaddr    AS mac;

SELECT net, site FROM subnets WHERE net >>= inet '10.1.2.200' ORDER BY masklen(net) DESC;

CREATE INDEX access_log_client ON access_log USING gist (client inet_ops);
EXPLAIN (ANALYZE, COSTS OFF) SELECT count(*) FROM access_log WHERE client << cidr '10.1.2.0/24';

SELECT '10.1.2.30' < '10.1.2.4' AS compared_as_text, inet '10.1.2.30' < inet '10.1.2.4' AS compared_as_inet;`,
        note: '**inet** holds a host address with an optional netmask; **cidr** holds a network and rejects host bits (`\'192.168.1.5/24\'::cidr` is an error). `>>=` is "contains or equals", and sorting by `masklen` finds the longest prefix. A GiST index with `inet_ops` serves `<<` and `>>=`. Text comparison gets the order of addresses wrong.' },
      { label: 'Geometric types and nearest neighbours', sql: `SELECT point '(0,0)' <-> point '(3,4)'                AS distance,
       area(box '((0,0),(4,3))')                         AS box_area,
       center(box '((0,0),(4,3))')                       AS box_center,
       circle '<(0,0),5>' @> point '(3,4)'               AS circle_contains,
       polygon '((0,0),(4,0),(4,3))' @> point '(3,1)'   AS in_triangle,
       box '((0,0),(2,2))' && box '((1,1),(3,3))'        AS boxes_overlap,
       (point '(3,4)')[0]                               AS x,
       point '(1,1)' ~= point '(1,1)'                    AS same_point;

CREATE INDEX stores_loc ON stores USING gist (loc);
SELECT id, loc, round((loc <-> point '(50,50)')::numeric, 2) AS dist
FROM stores ORDER BY loc <-> point '(50,50)' LIMIT 3;
EXPLAIN (COSTS OFF) SELECT id FROM stores ORDER BY loc <-> point '(50,50)' LIMIT 3;
SELECT count(*) AS within_5 FROM stores WHERE loc <@ circle '<(50,50),5>';`,
        note: '`<->` is distance. A GiST index on a `point` column answers `ORDER BY loc <-> p LIMIT n` as an **index scan** that walks outward from p, without computing every distance. Points have no `=` operator; use `~=` ("same as").' },
      { label: 'Composite types and xml', sql: `CREATE TYPE money_amount AS (amount numeric(12,2), currency char(3));
CREATE TABLE invoices (id int PRIMARY KEY, total money_amount NOT NULL);
INSERT INTO invoices VALUES (1, ROW(120.00, 'EUR')), (2, '(75.5,USD)'), (3, (NULL, 'GBP'));

SELECT id, total, (total).amount, (total).currency FROM invoices ORDER BY id;
UPDATE invoices SET total.amount = 80 WHERE id = 2 RETURNING total;

SELECT ROW(1, NULL) = ROW(1, NULL)                 AS equal_with_null,
       ROW(1, NULL) IS NOT DISTINCT FROM ROW(1, NULL) AS not_distinct,
       ROW(2026, 3) < ROW(2026, 11)                AS compares_left_to_right;

SELECT xpath('/order/item/@sku', x)        AS skus,
       xml_is_well_formed('<order>')        AS broken_is_well_formed
FROM (SELECT xml '<order id="7"><item sku="mug" qty="2"/><item sku="tea" qty="1"/></order>' AS x) s;
SELECT t.* FROM XMLTABLE('/order/item'
  PASSING xml '<order id="7"><item sku="mug" qty="2"/><item sku="tea" qty="1"/></order>'
  COLUMNS sku text PATH '@sku', qty int PATH '@qty') AS t;`,
        note: 'A **composite type** groups fields into one value. Read a field with `(column).field`: the parentheses stop PostgreSQL from reading `total` as a table name. In `SET`, write `total.amount` without them. Row comparison goes field by field, and NULL makes `=` unknown. `xml` values are checked for well-formedness; `xpath` and `XMLTABLE` pull data out.' },
    ],
  },
  production: {
    title: 'Making double bookings impossible',
    context: 'A workplace app books meeting rooms. Before inserting, the service ran `SELECT … WHERE room_id = $1 AND start_at < $3 AND end_at > $2` and inserted only if nothing came back.',
    problem: 'Two people booking the same slot at the same moment both saw "free" and both inserted: a classic race between check and insert. Separate start and end columns also invited off-by-one bugs with `<=` against `<`.',
    solution: 'Store the slot as one `tstzrange` with half-open bounds, and let an **exclusion constraint** check overlap on every insert and update. It needs `btree_gist` so that the plain `room_id` column can join the GiST index. On PostgreSQL 18 the same rule can be a temporal primary key.',
    sql: `CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (room_id WITH =, during WITH &&);

-- or, on PostgreSQL 18:
-- PRIMARY KEY (room_id, during WITHOUT OVERLAPS)

-- the app now just inserts, and maps SQLSTATE 23P01 to "slot taken"
INSERT INTO bookings (room_id, guest, during)
VALUES (1, 'sync', '[2026-11-16 14:30, 2026-11-16 15:30)');`,
    outcome: 'The check and the insert become one atomic step inside the database, so no interleaving of sessions can produce an overlap. In the playground the conflicting `sync` booking is rejected with SQLSTATE 23P01 while touching bookings are accepted.',
  },
  pitfalls: [
    { title: 'Closed upper bounds make back-to-back bookings collide',
      symptom: 'A 10:00 meeting cannot be booked right after a 9:00–10:00 one: "conflicting key value violates exclusion constraint".',
      cause: 'With `[09:00,10:00]` both ranges contain the instant 10:00, and one shared point is an overlap. On continuous types such as `tstzrange` nothing rounds the bound for you.',
      fix: 'Use half-open `[)` bounds everywhere (the constructor default). Back-to-back ranges are then adjacent (`-|-`), not overlapping.',
      sql: `SELECT tstzrange('2026-11-16 09:00', '2026-11-16 10:00', '[]') && tstzrange('2026-11-16 10:00', '2026-11-16 11:00') AS closed,
       tstzrange('2026-11-16 09:00', '2026-11-16 10:00') && tstzrange('2026-11-16 10:00', '2026-11-16 11:00')       AS half_open;` },
    { title: 'Exclusion constraint on an integer column fails to create',
      symptom: '`ERROR: data type integer has no default operator class for access method "gist"` when adding `EXCLUDE USING gist (room_id WITH =, during WITH &&)` or `WITHOUT OVERLAPS`.',
      cause: 'GiST has range operator classes built in, but not equality for plain scalars like `integer` or `text`.',
      fix: 'Run `CREATE EXTENSION btree_gist;` first. It adds GiST operator classes for the scalar types.' },
    { title: 'Range union or difference raises an error',
      symptom: '`ERROR: result of range union would not be contiguous` (or `range difference`) in a report that combines periods.',
      cause: 'A single range cannot have a gap. `[1,5) + [8,12)` and `[2,14) - [6,9)` would both need two pieces.',
      fix: 'Work with multiranges: `range_agg(r)` to merge many ranges, `multirange - multirange` for differences, and `unnest()` to list the pieces.',
      sql: `SELECT '{[2,14)}'::int4multirange - '{[6,9)}'::int4multirange;` },
    { title: 'IP addresses stored as text',
      symptom: 'Address lists sort as 10.1.2.30 before 10.1.2.4, and "all clients in 10.1.2.0/24" needs fragile `LIKE \'10.1.2.%\'` patterns.',
      cause: 'Text compares character by character and knows nothing about netmasks.',
      fix: 'Store addresses in `inet` and networks in `cidr`. Filter with `<<=` / `>>=`, sort natively, and index with `USING gist (col inet_ops)`.' },
  ],
  pointers: [
    'Range bounds: `[` / `]` include, `(` / `)` exclude, default `[)`. Discrete ranges are stored canonically as `[)`. An omitted bound is unbounded; `empty` contains no points.',
    'Operators: `@>` contains, `<@` contained by, `&&` overlaps, `-|-` adjacent, `<<` / `>>` strictly left / right, `+` `*` `-` union, intersection, difference.',
    'Multiranges (`range_agg`, `unnest`) hold sets of ranges with gaps. `EXCLUDE USING gist (k WITH =, r WITH &&)` or `PRIMARY KEY (k, r WITHOUT OVERLAPS)` forbids overlaps; scalar columns need `btree_gist`.',
    '`inet` = host plus netmask, `cidr` = network; use `>>=` and `masklen` for longest-prefix lookups. Geometric types measure with `<->`; composite fields read as `(col).field`.',
    'Going deeper: [GiST and SP-GiST](/m4/gist-spgist) shows how the index behind ranges, exclusion constraints, `inet_ops` and nearest-neighbour search is organised.',
  ],
  sources: ['rangetypes.html', 'functions-range.html', 'ddl-constraints.html', 'sql-createtable.html', 'datatype-net-types.html', 'functions-net.html', 'datatype-geometric.html', 'functions-geometry.html', 'rowtypes.html', 'datatype-xml.html', 'functions-xml.html', 'btree-gist.html'],
}
