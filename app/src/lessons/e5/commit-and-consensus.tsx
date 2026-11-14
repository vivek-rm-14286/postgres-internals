import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper, type Step } from '../../viz/Stepper'
import { Md } from '../../lesson/Md'
import { Arrows, Btn, Packet, Stat, Tabs, TRY_SQL } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * 1 Commit protocols: 2PC and 3PC with a failure injected at a chosen point (including a partition).
 * 2 Paxos: two proposers, five acceptors that can be taken down; phase 1/2 computed by the rules.
 * 3 Timestamp ordering: basic TO, TO + Thomas write rule, and optimistic validation on fixed schedules.
 * 4 Global deadlock: two workers whose local wait-for graphs are acyclic; the union has a cycle.
 * 5 Leases and fencing tokens: a paused lock holder writes after its lease expired.
 * ---------------------------------------------------------------------------------------------- */

/* ---- 1. commit protocols ---- */

type PS = 'init' | 'uncertain' | 'precommit' | 'committed' | 'aborted' | 'blocked' | 'down'
type CS = 'collecting' | 'waiting' | 'precommit' | 'committed' | 'aborted' | 'down'
interface CmState { c: CS; p: PS[]; msgs: [number, number, string, Tone][]; cut?: boolean; verdict?: [string, Tone] }
const PT: Record<PS, Tone> = { init: 'muted', uncertain: 'new', precommit: 'header', committed: 'ok', aborted: 'dead', blocked: 'dead', down: 'muted' }
const CT: Record<CS, Tone> = { collecting: 'new', waiting: 'new', precommit: 'header', committed: 'ok', aborted: 'dead', down: 'muted' }
const all3 = (p: PS): PS[] => [p, p, p]
const toAll = (label: string, t: Tone, from = 0): [number, number, string, Tone][] => [1, 2, 3].map((k) => [from, k, label, t])
const fromAll = (label: string, t: Tone): [number, number, string, Tone][] => [1, 2, 3].map((k) => [k, 0, label, t])

const COMMIT: Record<string, { label: string; proto: '2pc' | '3pc'; steps: Step<CmState>[] }> = {
  '2pc-ok': { label: '2PC · no failure', proto: '2pc', steps: [
    { title: 'Phase 1: prepare', body: 'The coordinator asks every participant whether it can commit.', state: { c: 'collecting', p: all3('init'), msgs: toAll('PREPARE', 'new') } },
    { title: 'Everyone votes yes', body: 'A yes vote is a promise: the participant has made its work durable and may no longer abort on its own. It is now **uncertain**.', state: { c: 'waiting', p: all3('uncertain'), msgs: fromAll('YES', 'ok') } },
    { title: 'Phase 2: commit', body: 'The coordinator logs the decision and sends COMMIT. Two round trips in total.', state: { c: 'committed', p: all3('committed'), msgs: toAll('COMMIT', 'ok'), verdict: ['committed everywhere', 'ok'] } },
  ] },
  '2pc-coord': { label: '2PC · coordinator dies after votes', proto: '2pc', steps: [
    { title: 'Phase 1: prepare', body: 'Same start: PREPARE goes to all three participants.', state: { c: 'collecting', p: all3('init'), msgs: toAll('PREPARE', 'new') } },
    { title: 'Everyone votes yes', body: 'All three are uncertain: they promised to commit if told to.', state: { c: 'waiting', p: all3('uncertain'), msgs: fromAll('YES', 'ok') } },
    { title: 'The coordinator crashes', body: 'It may already have decided commit, or abort after a timeout. Nobody else knows which.', state: { c: 'down', p: all3('uncertain'), msgs: [] } },
    { title: 'Participants ask each other', body: 'Each one only knows "I voted yes". No participant saw a decision, so none may commit (the coordinator might have aborted) and none may abort (it might have committed).', state: { c: 'down', p: all3('uncertain'), msgs: [[1, 2, 'decision?', 'pointer'], [2, 3, 'decision?', 'pointer'], [3, 1, 'decision?', 'pointer']] } },
    { title: 'Blocked until the coordinator returns', body: 'They hold their locks for as long as the coordinator is down. This is the **blocking window** of 2PC.', state: { c: 'down', p: all3('blocked'), msgs: [], verdict: ['blocked: consistent but unavailable', 'dead'] } },
  ] },
  '2pc-part': { label: '2PC · partition after votes', proto: '2pc', steps: [
    { title: 'Votes are in', body: 'All three voted yes and are uncertain.', state: { c: 'waiting', p: all3('uncertain'), msgs: fromAll('YES', 'ok') } },
    { title: 'The network splits', body: 'The coordinator and P1 are cut off from P2 and P3. The coordinator decides commit and tells P1.', state: { c: 'committed', p: ['committed', 'uncertain', 'uncertain'], msgs: [[0, 1, 'COMMIT', 'ok']], cut: true } },
    { title: 'The far side waits', body: 'P2 and P3 cannot reach anyone who knows the decision. They block, but they never guess, so atomicity holds.', state: { c: 'committed', p: ['committed', 'blocked', 'blocked'], msgs: [], cut: true, verdict: ['blocked until the partition heals', 'dead'] } },
    { title: 'The partition heals', body: 'P2 and P3 learn COMMIT and finish. 2PC is safe under partitions; it is just not available during them.', state: { c: 'committed', p: all3('committed'), msgs: [[0, 2, 'COMMIT', 'ok'], [0, 3, 'COMMIT', 'ok']], verdict: ['committed everywhere, late', 'ok'] } },
  ] },
  '3pc-ok': { label: '3PC · no failure', proto: '3pc', steps: [
    { title: 'Phase 1: can you commit?', body: 'Like 2PC, the coordinator collects votes.', state: { c: 'collecting', p: all3('init'), msgs: toAll('CAN-COMMIT', 'new') } },
    { title: 'Everyone votes yes', body: 'All three are uncertain.', state: { c: 'waiting', p: all3('uncertain'), msgs: fromAll('YES', 'ok') } },
    { title: 'Phase 2: pre-commit', body: 'New buffer state: **pre-commit** means "everyone voted yes". It is committable, yet nobody has committed. Participants acknowledge.', state: { c: 'precommit', p: all3('precommit'), msgs: toAll('PRE-COMMIT', 'header') } },
    { title: 'Phase 3: commit', body: 'Only after all acks does anyone commit. Three round trips: one more than 2PC on every transaction.', state: { c: 'committed', p: all3('committed'), msgs: toAll('DO-COMMIT', 'ok'), verdict: ['committed everywhere', 'ok'] } },
  ] },
  '3pc-coord': { label: '3PC · coordinator dies after votes', proto: '3pc', steps: [
    { title: 'Everyone votes yes', body: 'All three are uncertain.', state: { c: 'waiting', p: all3('uncertain'), msgs: fromAll('YES', 'ok') } },
    { title: 'The coordinator crashes', body: 'It crashes before sending any PRE-COMMIT.', state: { c: 'down', p: all3('uncertain'), msgs: [] } },
    { title: 'A backup polls the survivors', body: 'P1 takes over and asks for states. Nobody is in pre-commit.', state: { c: 'down', p: all3('uncertain'), msgs: [[1, 2, 'state?', 'pointer'], [1, 3, 'state?', 'pointer']] } },
    { title: 'Safe to abort', body: 'Nobody can have committed, because commit requires everyone to be in pre-commit first. The backup aborts **without waiting** for the coordinator.', state: { c: 'down', p: all3('aborted'), msgs: [[1, 2, 'ABORT', 'dead'], [1, 3, 'ABORT', 'dead']], verdict: ['aborted everywhere: not blocked', 'ok'] } },
  ] },
  '3pc-pre': { label: '3PC · coordinator dies during pre-commit', proto: '3pc', steps: [
    { title: 'Votes are in', body: 'All three are uncertain.', state: { c: 'waiting', p: all3('uncertain'), msgs: fromAll('YES', 'ok') } },
    { title: 'PRE-COMMIT reaches only P1', body: 'Then the coordinator crashes.', state: { c: 'down', p: ['precommit', 'uncertain', 'uncertain'], msgs: [[0, 1, 'PRE-COMMIT', 'header']] } },
    { title: 'Backup polls', body: 'P2 becomes the backup. P1 reports pre-commit: so everyone voted yes.', state: { c: 'down', p: ['precommit', 'uncertain', 'uncertain'], msgs: [[2, 1, 'state?', 'pointer'], [2, 3, 'state?', 'pointer']] } },
    { title: 'Move everyone forward', body: 'The backup brings all survivors to pre-commit, then commits. Again **no blocking**.', state: { c: 'down', p: all3('committed'), msgs: [[2, 1, 'DO-COMMIT', 'ok'], [2, 3, 'DO-COMMIT', 'ok']], verdict: ['committed everywhere: not blocked', 'ok'] } },
  ] },
  '3pc-part': { label: '3PC · partition during pre-commit', proto: '3pc', steps: [
    { title: 'Votes are in', body: 'All three are uncertain.', state: { c: 'waiting', p: all3('uncertain'), msgs: fromAll('YES', 'ok') } },
    { title: 'PRE-COMMIT reaches P1, then the network splits', body: 'The coordinator and P1 are on one side, P2 and P3 on the other. Messages in flight are lost.', state: { c: 'precommit', p: ['precommit', 'uncertain', 'uncertain'], msgs: [[0, 1, 'PRE-COMMIT', 'header']], cut: true } },
    { title: 'Each side runs the termination rule', body: 'P1\'s side sees pre-commit and commits. P2 and P3 see a dead coordinator and nobody in pre-commit, exactly the crash case, so they abort.', state: { c: 'committed', p: ['committed', 'aborted', 'aborted'], msgs: [[0, 1, 'DO-COMMIT', 'ok'], [2, 3, 'ABORT', 'dead']], cut: true } },
    { title: 'Atomicity is broken', body: 'A timeout cannot tell a crashed site from an unreachable one. With lost messages, **no commit protocol** can be both non-blocking and correct under partitions.', state: { c: 'committed', p: ['committed', 'aborted', 'aborted'], msgs: [], cut: true, verdict: ['P1 committed, P2 and P3 aborted', 'dead'] } },
  ] },
}

function CommitDiagram({ s, i }: { s: CmState; i: number }) {
  const pos = [[320, 44], [110, 196], [320, 196], [530, 196]]
  const names = ['coordinator', 'P1', 'P2', 'P3']
  const states: string[] = [s.c, ...s.p]
  return (
    <svg viewBox="0 0 640 250" className="w-full min-w-[500px]" role="img" aria-label="Commit protocol diagram">
      <Arrows tones={['new', 'ok', 'dead', 'header', 'pointer']} />
      {[1, 2, 3].map((k) => <line key={k} x1={pos[0][0]} y1={pos[0][1] + 22} x2={pos[k][0]} y2={pos[k][1] - 22} stroke="var(--border)" strokeWidth={1.5} />)}
      <line x1={110} y1={196} x2={530} y2={196} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 4" />
      {s.cut && <motion.line initial={{ opacity: 0 }} animate={{ opacity: 1 }} x1={215} y1={8} x2={215} y2={244} stroke={tone('dead')} strokeWidth={3} strokeDasharray="7 5" />}
      {s.cut && <text x={222} y={22} fontSize={10.5} fill={tone('dead')} fontWeight={700}>partition</text>}
      {s.msgs.map(([f, t, label, tn], k) => {
        const [x1, y1] = pos[f], [x2, y2] = pos[t]
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
        return (
          <g key={`${i}-${k}`}>
            <Packet x1={x1} y1={y1} x2={x2} y2={y2} t={tn} delay={k * 0.12} />
            <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} x={mx + (f === 0 || t === 0 ? 0 : 0)} y={my - 6 + (f !== 0 && t !== 0 ? 22 : 0)}
              textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill={tone(tn)} fontWeight={700}>{label}</motion.text>
          </g>
        )
      })}
      {pos.map(([x, y], k) => {
        const st = states[k]
        const t = k === 0 ? CT[st as CS] : PT[st as PS]
        const down = st === 'down'
        return (
          <g key={k}>
            <motion.rect layout x={x - 62} y={y - 22} width={124} height={44} rx={9} fill={toneBg(t, down ? 6 : 20)} stroke={tone(down ? 'dead' : t)} strokeWidth={1.8} strokeDasharray={down ? '5 4' : undefined} />
            <text x={x} y={y - 4} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--text)">{names[k]}</text>
            <motion.text key={st} initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={x} y={y + 13} textAnchor="middle" fontSize={10.5} fontFamily="var(--font-mono)" fill={tone(down ? 'dead' : t)}>{down ? 'crashed' : st}</motion.text>
          </g>
        )
      })}
    </svg>
  )
}

function CommitSim() {
  const [proto, setProto] = useState<'2pc' | '3pc'>('2pc')
  const keys = Object.keys(COMMIT).filter((k) => COMMIT[k].proto === proto)
  const [sc, setSc] = useState('2pc-coord')
  const cur = COMMIT[sc].proto === proto ? sc : keys[0]
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="protocol" value={proto} onChange={(p) => { setProto(p); setSc(p === '2pc' ? '2pc-coord' : '3pc-part') }} options={[['2pc', 'Two-phase'], ['3pc', 'Three-phase']]} />
      </div>
      <Tabs value={cur} onChange={setSc} options={keys.map((k) => [k, COMMIT[k].label.split(' · ')[1]] as [string, string])} />
      <Stepper key={cur} steps={COMMIT[cur].steps} interval={2800} render={(s, i) => (
        <div className="grid gap-2 [&>*]:min-w-0">
          <Legend items={[['new', 'voting / uncertain'], ['header', 'pre-commit'], ['ok', 'commit'], ['dead', 'abort / blocked'], ['pointer', 'termination protocol']]} />
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin"><CommitDiagram s={s} i={i} /></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="round trips to commit" value={proto === '2pc' ? 2 : 3} />
            <Stat label="blocking on coordinator crash" value={proto === '2pc' ? 'yes' : 'no'} t={proto === '2pc' ? 'dead' : 'ok'} />
            <Stat label="safe under partition" value={proto === '2pc' ? 'yes (blocks)' : 'no'} t={proto === '2pc' ? 'ok' : 'dead'} />
          </div>
          {s.verdict && <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: tone(s.verdict[1]), background: toneBg(s.verdict[1], 12) }}>{s.verdict[0]}</motion.p>}
        </div>
      )} />
    </div>
  )
}

/* ---- 2. Paxos ---- */

interface Acc { up: boolean; promised: number; acc: [number, string] | null }
interface Prop { name: 'A' | 'B'; own: string; n: number; phase: 'idle' | 'prepared' | 'rejected'; value: string | null }
const fresh = (): { acc: Acc[]; props: [Prop, Prop]; log: string[] } => ({
  acc: Array.from({ length: 5 }, () => ({ up: true, promised: 0, acc: null })),
  props: [{ name: 'A', own: 'x', n: -1, phase: 'idle', value: null }, { name: 'B', own: 'y', n: 0, phase: 'idle', value: null }],
  log: [],
})
function chosen(acc: Acc[]): [number, string] | null {
  const by = new Map<string, number>()
  for (const a of acc) if (a.acc) by.set(`${a.acc[0]}|${a.acc[1]}`, (by.get(`${a.acc[0]}|${a.acc[1]}`) ?? 0) + 1)
  for (const [k, c] of by) if (c >= 3) { const [n, v] = k.split('|'); return [+n, v] }
  return null
}

function PaxosSim() {
  const [st, setSt] = useState(fresh)
  const [first, setFirst] = useState<[number, string] | null>(null)
  const ch = chosen(st.acc)
  const record = (next: typeof st) => { const c = chosen(next.acc); if (c && !first) setFirst(c); setSt(next) }
  const prepare = (pi: 0 | 1, s = st) => {
    const p = { ...s.props[pi] }
    p.n = p.n + 2
    const acc = s.acc.map((a) => ({ ...a }))
    const replies: (Acc['acc'])[] = []
    let promises = 0
    acc.forEach((a) => { if (a.up && p.n > a.promised) { a.promised = p.n; promises++; replies.push(a.acc) } })
    const prior = replies.filter(Boolean).sort((a, b) => b![0] - a![0])[0]
    p.phase = promises >= 3 ? 'prepared' : 'rejected'
    p.value = promises >= 3 ? (prior ? prior[1] : p.own) : null
    const props = [...s.props] as [Prop, Prop]; props[pi] = p
    const msg = `${p.name}: prepare(${p.n}) → ${promises} promise${promises === 1 ? '' : 's'}` + (promises >= 3 ? (prior ? `; must propose "${prior[1]}" (accepted at ${prior[0]})` : `; free to propose "${p.own}"`) : '; no majority')
    return { acc, props, log: [msg, ...s.log].slice(0, 8) }
  }
  const accept = (pi: 0 | 1, s = st) => {
    const p = { ...s.props[pi] }
    if (p.phase !== 'prepared' || !p.value) return s
    const acc = s.acc.map((a) => ({ ...a }))
    let ok = 0
    acc.forEach((a) => { if (a.up && p.n >= a.promised) { a.promised = p.n; a.acc = [p.n, p.value!]; ok++ } })
    p.phase = 'idle'
    const props = [...s.props] as [Prop, Prop]; props[pi] = p
    const msg = `${p.name}: accept(${p.n}, "${p.value}") → ${ok} accepted` + (ok >= 3 ? ' → chosen' : ok === 0 ? ' (all ignored: promised a higher number)' : '')
    return { acc, props, log: [msg, ...s.log].slice(0, 8) }
  }
  const duel = () => {
    let s = fresh()
    s = prepare(0, s); s = prepare(1, s); s = accept(0, s); s = prepare(0, s); s = accept(1, s); s = prepare(1, s); s = accept(0, s)
    setFirst(null); setSt({ ...s, log: ['duel: every accept arrives after a higher prepare', ...s.log].slice(0, 8) })
  }
  const toggle = (k: number) => setSt((s) => ({ ...s, acc: s.acc.map((a, j) => (j === k ? { ...a, up: !a.up } : a)), log: [`acceptor ${k + 1} ${s.acc[k].up ? 'down' : 'up'}`, ...s.log].slice(0, 8) }))
  const reset = () => { setSt(fresh()); setFirst(null) }
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap gap-2">
        {st.props.map((p, pi) => (
          <div key={p.name} className="flex flex-wrap items-center gap-1.5 rounded-lg border p-1.5" style={{ borderColor: tone(pi === 0 ? 'tuple' : 'pointer') }}>
            <span className="px-1 text-xs font-bold">proposer {p.name}</span>
            <Btn primary={pi === 0} testid={pi === 0 ? 'viz-next' : undefined} onClick={() => record(prepare(pi as 0 | 1))}>prepare({p.n + 2})</Btn>
            <Btn onClick={() => record(accept(pi as 0 | 1))} disabled={p.phase !== 'prepared'}>accept{p.phase === 'prepared' ? `(${p.n}, "${p.value}")` : ''}</Btn>
          </div>
        ))}
        <Btn onClick={duel}>Run a duel</Btn>
        <Btn onClick={reset}>Reset</Btn>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {st.acc.map((a, k) => (
          <motion.button key={k} type="button" layout onClick={() => toggle(k)} title="Click to take this acceptor down or up"
            className="min-w-0 rounded-lg border p-1.5 text-left" style={{ borderColor: a.up ? tone(a.acc ? 'ok' : 'header') : tone('dead'), background: a.up ? toneBg(a.acc ? 'ok' : 'header', 12) : toneBg('dead', 8), borderStyle: a.up ? 'solid' : 'dashed' }}>
            <p className="text-[11px] font-bold">#{k + 1}<span className="hidden sm:inline"> acceptor</span></p>
            <p className="truncate font-mono text-[10.5px] text-muted">{a.up ? 'up' : 'down'}</p>
            <motion.p key={a.promised} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="truncate font-mono text-[11px]"><span className="hidden sm:inline">promised </span><span className="sm:hidden">p </span>{a.promised || '—'}</motion.p>
            <p className="truncate font-mono text-[11px]"><span className="hidden sm:inline">acc </span>{a.acc ? `(${a.acc[0]},${a.acc[1]})` : '—'}</p>
          </motion.button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr] [&>*]:min-w-0">
        <Panel title="Messages">
          <div className="grid gap-1">
            <AnimatePresence initial={false}>
              {st.log.length === 0 && <p className="text-xs text-muted">A uses odd numbers, B even ones. Prepare, then accept. Take acceptors down to see a majority fail.</p>}
              {st.log.map((l, k) => <motion.p key={`${st.log.length}-${k}-${l}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: k === 0 ? 1 : 0.6, x: 0 }} className="font-mono text-[11px]">{l}</motion.p>)}
            </AnimatePresence>
          </div>
        </Panel>
        <Panel title="Chosen value">
          <motion.p key={ch ? ch.join() : 'none'} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="font-mono text-lg font-bold" style={{ color: ch ? tone('ok') : tone('muted') }}>{ch ? `"${ch[1]}" (proposal ${ch[0]})` : 'none yet'}</motion.p>
          <p className="mt-1 text-xs text-muted"><Md>{first && ch && first[1] !== ch[1] ? 'Safety violated.' : first
            ? `Once a majority accepted **"${first[1]}"**, every later majority of promises contains an acceptor that has accepted it (possibly under a higher number), so every later proposal carries the same value.`
            : 'A value is **chosen** when 3 of 5 acceptors accept the same proposal. Any two majorities share at least one acceptor.'}</Md></p>
        </Panel>
      </div>
      <Panel title="Paxos and Raft">
        <ul className="grid gap-1 text-xs">
          <li><Md>{'**Paxos** agrees on one value per instance; a stable leader (Multi-Paxos) skips phase 1 and pays only phase 2 per command. Rival proposers can duel forever, so liveness needs one distinguished proposer elected with timeouts or randomness.'}</Md></li>
          <li><Md>{'**Raft** is leader-first: a **term** plays the role of the proposal number, a candidate needs a majority of votes, and a voter refuses a candidate whose log is less up to date. Randomized election timeouts (for example 150 to 300 ms) break duels.'}</Md></li>
        </ul>
      </Panel>
    </div>
  )
}

/* ---- 3. timestamp ordering ---- */

type Op = { t: 1 | 2 | 3; k: 'r' | 'w' | 'c'; x?: 'x' | 'y' }
const SCHED: Record<string, { label: string; ops: Op[]; note: string }> = {
  lw: { label: 'late write, no read', note: 'T1 (ts 1) writes x after T2 (ts 2) already wrote it, and nobody read x in between.',
    ops: [{ t: 1, k: 'r', x: 'y' }, { t: 2, k: 'w', x: 'x' }, { t: 2, k: 'c' }, { t: 1, k: 'w', x: 'x' }, { t: 1, k: 'c' }] },
  wr: { label: 'late write after a read', note: 'T2 (ts 2) read x, then T1 (ts 1) tries to write it. T2 should have seen T1\'s value.',
    ops: [{ t: 2, k: 'r', x: 'x' }, { t: 1, k: 'w', x: 'x' }, { t: 1, k: 'c' }, { t: 2, k: 'c' }] },
  lr: { label: 'late read', note: 'T1 (ts 1) reads x after T2 (ts 2) wrote it: the value T1 should see is gone.',
    ops: [{ t: 1, k: 'r', x: 'y' }, { t: 2, k: 'w', x: 'x' }, { t: 2, k: 'c' }, { t: 1, k: 'r', x: 'x' }, { t: 1, k: 'c' }] },
  mix: { label: 'three transactions', note: 'A longer interleaving over x and y with three timestamps.',
    ops: [{ t: 1, k: 'r', x: 'x' }, { t: 2, k: 'w', x: 'x' }, { t: 3, k: 'w', x: 'y' }, { t: 3, k: 'c' }, { t: 2, k: 'w', x: 'y' }, { t: 2, k: 'c' }, { t: 1, k: 'w', x: 'y' }, { t: 1, k: 'c' }] },
}
type Mode = 'basic' | 'twr' | 'occ'
interface OpRes { op: Op; verdict: 'ok' | 'reject' | 'ignored' | 'skipped' | 'commit' | 'abort'; why: string }

function runTO(ops: Op[], mode: Mode, upto: number) {
  const R: Record<string, number> = { x: 0, y: 0 }, W: Record<string, number> = { x: 0, y: 0 }
  const aborted = new Set<number>()
  const out: OpRes[] = []
  // optimistic bookkeeping
  const start: Record<number, number> = {}, rs: Record<number, Set<string>> = {}, ws: Record<number, Set<string>> = {}
  const committed: { t: number; at: number; ws: Set<string> }[] = []
  ops.slice(0, upto).forEach((op, i) => {
    if (aborted.has(op.t)) { out.push({ op, verdict: 'skipped', why: `T${op.t} already aborted` }); return }
    if (start[op.t] === undefined) start[op.t] = i
    rs[op.t] ??= new Set(); ws[op.t] ??= new Set()
    const ts = op.t
    if (mode === 'occ') {
      if (op.k === 'r') { rs[ts].add(op.x!); out.push({ op, verdict: 'ok', why: `read into T${ts}'s read set` }) }
      else if (op.k === 'w') { ws[ts].add(op.x!); out.push({ op, verdict: 'ok', why: 'buffered in a private workspace' }) }
      else {
        const clash = committed.find((c) => c.at > start[ts] && [...c.ws].some((x) => rs[ts].has(x)))
        if (clash) { aborted.add(ts); out.push({ op, verdict: 'abort', why: `validation fails: T${clash.t} committed a write to ${[...clash.ws].filter((x) => rs[ts].has(x)).join(',')} after T${ts} read it` }) }
        else { committed.push({ t: ts, at: i, ws: ws[ts] }); out.push({ op, verdict: 'commit', why: 'validation passes; writes installed' }) }
      }
      return
    }
    if (op.k === 'c') { out.push({ op, verdict: 'commit', why: 'commit' }); return }
    const x = op.x!
    if (op.k === 'r') {
      if (ts < W[x]) { aborted.add(ts); out.push({ op, verdict: 'reject', why: `ts ${ts} < W-ts(${x}) = ${W[x]}: abort T${ts}, restart with a new timestamp` }); return }
      R[x] = Math.max(R[x], ts); out.push({ op, verdict: 'ok', why: `R-ts(${x}) = ${R[x]}` }); return
    }
    if (ts < R[x]) { aborted.add(ts); out.push({ op, verdict: 'reject', why: `ts ${ts} < R-ts(${x}) = ${R[x]}: a later reader missed it, abort T${ts}` }); return }
    if (ts < W[x]) {
      if (mode === 'twr') { out.push({ op, verdict: 'ignored', why: `ts ${ts} < W-ts(${x}) = ${W[x]}: obsolete write, skip it (Thomas write rule)` }); return }
      aborted.add(ts); out.push({ op, verdict: 'reject', why: `ts ${ts} < W-ts(${x}) = ${W[x]}: abort T${ts}, restart with a new timestamp` }); return
    }
    W[x] = ts; out.push({ op, verdict: 'ok', why: `W-ts(${x}) = ${W[x]}` })
  })
  return { out, R, W, aborted }
}
const VT: Record<OpRes['verdict'], Tone> = { ok: 'ok', commit: 'ok', reject: 'dead', abort: 'dead', ignored: 'header', skipped: 'muted' }
const opText = (o: Op) => (o.k === 'c' ? `c${o.t}` : `${o.k}${o.t}(${o.x})`)

function TOSim() {
  const [sc, setSc] = useState<keyof typeof SCHED>('lw')
  const [mode, setMode] = useState<Mode>('basic')
  const [i, setI] = useState(0)
  const ops = SCHED[sc].ops
  const res = useMemo(() => runTO(ops, mode, i), [ops, mode, i])
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="scheduler" value={mode} onChange={(m) => { setMode(m); setI(0) }} options={[['basic', 'basic TO'], ['twr', 'TO + Thomas rule'], ['occ', 'optimistic']]} />
        <Btn primary testid="viz-next" onClick={() => setI((x) => Math.min(ops.length, x + 1))} disabled={i >= ops.length}>Next operation</Btn>
        <Btn onClick={() => setI(0)}>Restart</Btn>
      </div>
      <Tabs value={sc} onChange={(v) => { setSc(v); setI(0) }} options={(Object.keys(SCHED) as (keyof typeof SCHED)[]).map((k) => [k, SCHED[k].label])} />
      <p className="text-sm text-muted">{SCHED[sc].note} Timestamps: T1 = 1, T2 = 2, T3 = 3.</p>
      <div className="flex flex-wrap gap-1 font-mono text-xs">
        {ops.map((o, k) => <span key={k} className="rounded border px-1.5 py-0.5" style={{ borderColor: k < i ? tone(VT[res.out[k].verdict]) : 'var(--border)', background: k < i ? toneBg(VT[res.out[k].verdict], 14) : 'transparent', opacity: k < i ? 1 : 0.55 }}>{opText(o)}</span>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px] [&>*]:min-w-0">
        <Panel title="Scheduler decisions">
          {res.out.length === 0 ? <p className="text-xs text-muted">Press Next operation.</p> : (
            <div className="grid gap-1">
              {res.out.map((r, k) => (
                <motion.div key={`${mode}-${k}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-[52px_64px_1fr] items-baseline gap-2 text-[11.5px]">
                  <span className="font-mono font-bold">{opText(r.op)}</span>
                  <span className="font-mono font-bold" style={{ color: tone(VT[r.verdict]) }}>{r.verdict}</span>
                  <span className="text-muted">{r.why}</span>
                </motion.div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title={mode === 'occ' ? 'Optimistic' : 'Per-item timestamps'}>
          {mode === 'occ' ? <p className="text-xs text-muted"><Md>{'Reads and writes never wait. At commit, a transaction is **validated** against transactions that committed after it started: if one of them wrote something it read, it aborts.'}</Md></p> : (
            <table className="w-full font-mono text-xs">
              <thead><tr className="text-muted"><th className="text-left">item</th><th>R-ts</th><th>W-ts</th></tr></thead>
              <tbody>{(['x', 'y'] as const).map((x) => (
                <tr key={x} className="border-t border-line"><td className="py-1 font-bold">{x}</td>
                  <td className="text-center"><motion.span key={res.R[x]} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="inline-block">{res.R[x]}</motion.span></td>
                  <td className="text-center"><motion.span key={res.W[x]} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="inline-block">{res.W[x]}</motion.span></td></tr>
              ))}</tbody>
            </table>
          )}
          <p className="mt-2 text-xs">aborted: <b className="font-mono" style={{ color: tone(res.aborted.size ? 'dead' : 'ok') }}>{res.aborted.size ? [...res.aborted].map((t) => `T${t}`).join(', ') : 'none'}</b></p>
        </Panel>
      </div>
      <Legend items={[['ok', 'executed / committed'], ['header', 'ignored (Thomas rule)'], ['dead', 'rejected: abort'], ['muted', 'skipped']]} />
    </div>
  )
}

/* ---- 4. global deadlock ---- */

interface DL { a: [string, string][]; b: [string, string][]; global: [string, string][] | null; locks: string; found?: string; victim?: string; alive: string[] }
const DLS: Record<'real' | 'phantom', Step<DL>[]> = {
  real: [
    { title: 'Two distributed transactions start', body: 'D1 (started first) updates key 1 on worker A. D2 updates key 2 on worker B. Each holds a row lock on one worker.', state: { a: [], b: [], global: null, locks: 'A: key 1 → D1 · B: key 2 → D2', alive: ['D1', 'D2'] } },
    { title: 'D1 wants key 2 on worker B', body: 'Worker B records a local wait: **D1 → D2**.', state: { a: [], b: [['D1', 'D2']], global: null, locks: 'A: key 1 → D1 · B: key 2 → D2', alive: ['D1', 'D2'] } },
    { title: 'D2 wants key 1 on worker A', body: 'Worker A records **D2 → D1**. Both transactions now wait forever.', state: { a: [['D2', 'D1']], b: [['D1', 'D2']], global: null, locks: 'A: key 1 → D1 · B: key 2 → D2', alive: ['D1', 'D2'] } },
    { title: 'Local detectors see nothing', body: 'After `deadlock_timeout` each worker checks its own wait-for graph. A has one edge, B has one edge: **no cycle on either node**.', state: { a: [['D2', 'D1']], b: [['D1', 'D2']], global: null, locks: 'no local deadlock', alive: ['D1', 'D2'] } },
    { title: 'The global detector unions the graphs', body: 'After 2 × `deadlock_timeout` (the Citus default factor), the coordinator collects wait edges from every worker and maps local backends to distributed transaction ids.', state: { a: [['D2', 'D1']], b: [['D1', 'D2']], global: [['D1', 'D2'], ['D2', 'D1']], locks: 'collecting edges', found: 'cycle D1 → D2 → D1', alive: ['D1', 'D2'] } },
    { title: 'Cancel the youngest', body: 'D2 started later, so it is the victim: less work is lost. Its locks go away and D1 proceeds.', state: { a: [], b: [], global: [], locks: 'A: key 1 → D1 · B: key 2 → D1', found: 'cycle D1 → D2 → D1', victim: 'D2', alive: ['D1'] } },
  ],
  phantom: [
    { title: 'Same two waits', body: 'D1 waits for D2 on worker B; D2 waits for D1 on worker A.', state: { a: [['D2', 'D1']], b: [['D1', 'D2']], global: null, locks: 'A: key 1 → D1 · B: key 2 → D2', alive: ['D1', 'D2'] } },
    { title: 'Edges are collected', body: 'The detector receives both edges and starts its search.', state: { a: [['D2', 'D1']], b: [['D1', 'D2']], global: [['D1', 'D2'], ['D2', 'D1']], locks: 'collecting edges', alive: ['D1', 'D2'] } },
    { title: 'Meanwhile D2 aborts for another reason', body: 'Its client hit a statement timeout. The real deadlock is already gone, but the collected graph is a past snapshot.', state: { a: [], b: [], global: [['D1', 'D2'], ['D2', 'D1']], locks: 'D2 gone; D1 runs', alive: ['D1'] } },
    { title: 'A phantom deadlock', body: 'The detector still sees a cycle. Cancelling a transaction now would be an **unnecessary restart**. A careful detector re-checks that every transaction on the cycle is still alive and still waiting before choosing a victim.', state: { a: [], b: [], global: [['D1', 'D2'], ['D2', 'D1']], locks: 'D1 runs', found: 'stale cycle: re-check before cancelling', alive: ['D1'] } },
  ],
}

function WaitGraph({ edges, x, label, alive }: { edges: [string, string][]; x: number; label: string; alive: string[] }) {
  const P: Record<string, [number, number]> = { D1: [x - 50, 120], D2: [x + 50, 120] }
  return (
    <g>
      <rect x={x - 95} y={40} width={190} height={130} rx={10} fill={toneBg('muted', 6)} stroke="var(--border)" />
      <text x={x} y={60} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--text)">{label}</text>
      {edges.map(([f, t], k) => {
        const [x1, y1] = P[f], [x2, y2] = P[t]
        const dy = f === 'D1' ? -14 : 14
        return <motion.path key={`${f}${t}${k}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} d={`M${x1 + (x2 > x1 ? 18 : -18)},${y1 + dy / 2} Q${(x1 + x2) / 2},${y1 + dy * 2.2} ${x2 + (x2 > x1 ? -20 : 20)},${y2 + dy / 2}`}
          fill="none" stroke={tone('dead')} strokeWidth={2} markerEnd="url(#e5-arrow-dead)" />
      })}
      {Object.entries(P).map(([n, [cx, cy]]) => (
        <g key={n} opacity={alive.includes(n) ? 1 : 0.35}>
          <circle cx={cx} cy={cy} r={17} fill={toneBg(n === 'D1' ? 'tuple' : 'pointer', 24)} stroke={tone(n === 'D1' ? 'tuple' : 'pointer')} strokeWidth={1.5} />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">{n}</text>
        </g>
      ))}
    </g>
  )
}

function Deadlock() {
  const [sc, setSc] = useState<'real' | 'phantom'>('real')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Segmented label="scenario" value={sc} onChange={setSc} options={[['real', 'Distributed deadlock'], ['phantom', 'Phantom deadlock']]} />
      <Stepper key={sc} steps={DLS[sc]} interval={2800} render={(s) => (
        <div className="grid gap-2 [&>*]:min-w-0">
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin">
            <svg viewBox="0 0 640 190" className="w-full min-w-[520px]" role="img" aria-label="Wait-for graphs">
              <Arrows tones={['dead']} />
              <WaitGraph edges={s.a} x={110} label="worker A (local)" alive={s.alive} />
              <WaitGraph edges={s.b} x={320} label="worker B (local)" alive={s.alive} />
              {s.global ? <WaitGraph edges={s.global} x={530} label="global detector" alive={s.alive} /> : (
                <g><rect x={435} y={40} width={190} height={130} rx={10} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
                  <text x={530} y={110} textAnchor="middle" fontSize={11} fill="var(--muted)">not yet collected</text></g>)}
            </svg>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded border border-line px-2 py-0.5 font-mono">{s.locks}</span>
            {s.found && <span className="rounded border px-2 py-0.5 font-mono" style={{ borderColor: tone('dead'), color: tone('dead') }}>{s.found}</span>}
            {s.victim && <span className="rounded border px-2 py-0.5 font-mono" style={{ borderColor: tone('ok'), color: tone('ok') }}>victim: {s.victim} (youngest)</span>}
          </div>
        </div>
      )} />
    </div>
  )
}

/* ---- 5. leases and fencing tokens ---- */

interface LF { t: number; holder: string; c1: string; c2: string; store: string; maxTok: number; bad?: boolean }
const lf = (fence: boolean): Step<LF>[] => [
  { title: 'Client 1 gets the lock', body: 'The lock service grants a **lease** for 10 s with **fencing token 33**: a number that grows on every grant.', state: { t: 0, holder: 'client 1 (token 33, until t=10)', c1: 'holds lock', c2: 'idle', store: 'file v1', maxTok: 0 } },
  { title: 'Client 1 pauses', body: 'A long GC pause freezes client 1 for 15 s. It cannot notice that time passes.', state: { t: 2, holder: 'client 1 (token 33, until t=10)', c1: 'paused', c2: 'idle', store: 'file v1', maxTok: 0 } },
  { title: 'The lease expires', body: 'At t = 10 the service considers client 1 gone and grants the lock to client 2 with **token 34**.', state: { t: 10, holder: 'client 2 (token 34, until t=20)', c1: 'paused (thinks it holds the lock)', c2: 'holds lock', store: 'file v1', maxTok: 0 } },
  { title: 'Client 2 writes', body: 'The storage accepts the write with token 34 and remembers 34 as the highest token seen.', state: { t: 12, holder: 'client 2 (token 34, until t=20)', c1: 'paused', c2: 'write(v2, token 34) ok', store: 'file v2 (by client 2)', maxTok: fence ? 34 : 0 } },
  fence
    ? { title: 'Client 1 wakes and writes: rejected', body: 'Its write carries token 33 < 34, so the storage **rejects** it. Client 1 learns it lost the lock; client 2\'s data is safe.', state: { t: 17, holder: 'client 2 (token 34, until t=20)', c1: 'write(v1\', token 33) rejected', c2: 'holds lock', store: 'file v2 (by client 2)', maxTok: 34 } }
    : { title: 'Client 1 wakes and writes: accepted', body: 'Without fencing the storage cannot tell a stale holder from the current one. Client 1 overwrites client 2: **two holders wrote, data is corrupted**.', state: { t: 17, holder: 'client 2 (token 34, until t=20)', c1: 'write(v1\') ok', c2: 'holds lock', store: 'file v1\' (stale write won)', maxTok: 0, bad: true } },
]

function Fencing() {
  const [fence, setFence] = useState(true)
  const steps = useMemo(() => lf(fence), [fence])
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Segmented label="fencing" value={fence ? 'on' : 'off'} onChange={(v) => setFence(v === 'on')} options={[['on', 'Storage checks tokens'], ['off', 'No fencing']]} />
      <Stepper key={String(fence)} steps={steps} interval={2600} render={(s) => (
        <div className="grid gap-2 [&>*]:min-w-0">
          <div className="relative h-7 rounded-lg border border-line bg-surface-2">
            <div className="absolute top-0 left-0 h-full rounded-l-lg" style={{ width: '50%', background: toneBg('tuple', 18) }} />
            <div className="absolute top-0 h-full" style={{ left: '50%', width: '50%', background: toneBg('pointer', 18) }} />
            <motion.div className="absolute top-0 h-full w-0.5" style={{ background: tone('dead') }} animate={{ left: `${(s.t / 20) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            <span className="absolute top-1 left-2 font-mono text-[10.5px]">lease 33: t 0-10</span>
            <span className="absolute top-1 right-2 font-mono text-[10.5px]">lease 34: t 10-20</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[['lock service', s.holder, 'accent'], ['storage', `${s.store}${fence ? ` · max token ${s.maxTok || '—'}` : ''}`, s.bad ? 'dead' : 'ok'], ['client 1', s.c1, 'tuple'], ['client 2', s.c2, 'pointer']].map(([n, v, t]) => (
              <div key={n} className="min-w-0 rounded-lg border px-2 py-1.5" style={{ borderColor: tone(t as Tone), background: toneBg(t as Tone, 8) }}>
                <p className="text-[11px] font-bold">{n}</p>
                <motion.p key={v} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-xs">{v}</motion.p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted"><Md>{'A lease alone is safe only if pauses, network delays and clock drift stay small compared to its length. A **fencing token** removes that timing assumption at the resource itself.'}</Md></p>
        </div>
      )} />
    </div>
  )
}

function ConsensusViz() {
  const [tab, setTab] = useState<'commit' | 'paxos' | 'to' | 'dl' | 'fence'>('commit')
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <Tabs value={tab} onChange={setTab} options={[['commit', '2PC vs 3PC'], ['paxos', 'Paxos'], ['to', 'Timestamp ordering'], ['dl', 'Global deadlock'], ['fence', 'Leases and fencing']]} />
      {tab === 'commit' ? <CommitSim /> : tab === 'paxos' ? <PaxosSim /> : tab === 'to' ? <TOSim /> : tab === 'dl' ? <Deadlock /> : <Fencing />}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `${TRY_SQL}

-- two participants of a distributed transaction
CREATE SCHEMA node1;
CREATE SCHEMA node2;
CREATE TABLE node1.stock (sku text PRIMARY KEY, qty int NOT NULL CHECK (qty >= 0));
CREATE TABLE node2.stock (sku text PRIMARY KEY, qty int NOT NULL CHECK (qty >= 0));
INSERT INTO node1.stock VALUES ('A1', 10), ('B2', 4);
INSERT INTO node2.stock VALUES ('A1', 0), ('B2', 7);
CREATE TABLE coord_log (gid text PRIMARY KEY, decision text NOT NULL CHECK (decision IN ('commit', 'abort')));

-- Paxos acceptors: what each one durably remembers
CREATE TABLE acceptor (id int PRIMARY KEY, up boolean NOT NULL DEFAULT true, promised int NOT NULL DEFAULT 0,
                       acc_n int, acc_v text);
INSERT INTO acceptor (id) SELECT generate_series(1, 5);

-- phase 1: promise not to accept anything numbered below n; report the highest accepted proposal
CREATE FUNCTION prepare(n int) RETURNS TABLE (promises bigint, prior_n int, prior_v text) LANGUAGE sql AS $$
  WITH p AS (UPDATE acceptor SET promised = n WHERE up AND promised < n RETURNING acc_n, acc_v)
  SELECT count(*), (array_agg(acc_n ORDER BY acc_n DESC NULLS LAST))[1], (array_agg(acc_v ORDER BY acc_n DESC NULLS LAST))[1] FROM p $$;
-- phase 2: accept (n, v) unless a higher prepare was answered
CREATE FUNCTION accept(n int, v text) RETURNS bigint LANGUAGE sql AS $$
  WITH a AS (UPDATE acceptor SET promised = n, acc_n = n, acc_v = v WHERE up AND promised <= n RETURNING 1)
  SELECT count(*) FROM a $$;
CREATE VIEW chosen AS
  SELECT acc_n, acc_v, count(*) AS acceptors FROM acceptor WHERE acc_n IS NOT NULL GROUP BY acc_n, acc_v HAVING count(*) >= 3;`

export const lesson: Lesson = {
  slug: 'commit-and-consensus',
  module: 'e5',
  order: 3,
  title: 'Distributed transactions and consensus',
  tldr: [
    'Nodes that must agree, on a commit decision, a lock holder or the order of writes, use **atomic commit** (2PC, 3PC), **consensus** (Paxos, Raft), **timestamp or optimistic concurrency control**, and **global deadlock detection**.',
    'Each one buys correctness with a different weakness: 2PC blocks, 3PC breaks under partitions, consensus needs a majority, and leases need fencing tokens.',
  ],
  visualizer: {
    title: 'Agreement under failure',
    caption: 'Crash the coordinator or split the network in 2PC and 3PC. Duel two Paxos proposers, run schedules through three concurrency controls, union two wait-for graphs, and pause a lock holder.',
    Component: ConsensusViz,
  },
  playground: {
    config: ['max_prepared_transactions = 10'],
    setup: SETUP,
    presets: [
      { label: '2PC: the uncertain participant', sql: `BEGIN;
UPDATE node1.stock SET qty = qty - 3 WHERE sku = 'A1';
PREPARE TRANSACTION 'move-7:n1';
BEGIN;
UPDATE node2.stock SET qty = qty + 3 WHERE sku = 'A1';
PREPARE TRANSACTION 'move-7:n2';

-- both voted yes; the decision is not logged yet: this is the blocking window
SELECT gid, prepared IS NOT NULL AS durable FROM pg_prepared_xacts ORDER BY gid;
SELECT try_sql($$SELECT * FROM node1.stock WHERE sku = 'A1' FOR UPDATE NOWAIT$$) AS can_anyone_touch_A1;
SELECT count(*) FILTER (WHERE pid IS NULL) AS locks_without_a_session FROM pg_locks;

-- the coordinator decides, logs, and finishes phase 2
INSERT INTO coord_log VALUES ('move-7', 'commit');
COMMIT PREPARED 'move-7:n1';
COMMIT PREPARED 'move-7:n2';
SELECT 'node1' AS node, qty FROM node1.stock WHERE sku = 'A1' UNION ALL SELECT 'node2', qty FROM node2.stock WHERE sku = 'A1';`,
        note: 'Between PREPARE and the decision, each prepared transaction keeps its locks although no session owns it any more (`pid` is NULL in `pg_locks`), and NOWAIT reports the locked row instead of waiting. A participant alone cannot tell commit from abort: that is the window in which 2PC blocks.' },
      { label: '3PC termination rule as a query', sql: `-- what may a backup coordinator decide from the survivors' states?
WITH cases(scenario, states) AS (VALUES
  ('coordinator died after votes',           ARRAY['uncertain', 'uncertain', 'uncertain']),
  ('pre-commit reached P1 only',             ARRAY['precommit', 'uncertain', 'uncertain']),
  ('one participant already committed',      ARRAY['committed', 'precommit', 'precommit']),
  ('one participant voted no',               ARRAY['aborted', 'uncertain', 'uncertain']),
  ('partition: only P2 and P3 are reachable',ARRAY['uncertain', 'uncertain']))
SELECT scenario, states,
       CASE WHEN 'committed' = ANY (states) THEN 'commit'
            WHEN 'aborted'   = ANY (states) THEN 'abort'
            WHEN 'precommit' = ANY (states) THEN 'commit (all voted yes)'
            ELSE 'abort (nobody can have committed)' END AS three_phase,
       CASE WHEN 'committed' = ANY (states) THEN 'commit'
            WHEN 'aborted'   = ANY (states) THEN 'abort'
            ELSE 'block: wait for the coordinator' END AS two_phase
FROM cases;`,
        note: '3PC does not block on crashes: an uncertain group may abort because commit always passes through pre-commit first. The last row is the trap: if P1 sat in pre-commit on the other side of a partition, it would commit while this group aborts. 2PC blocks instead.' },
      { label: 'Paxos with five acceptors', sql: `UPDATE acceptor SET promised = 0, acc_n = NULL, acc_v = NULL, up = true;
-- proposer A (odd numbers) wants "x"
SELECT * FROM prepare(1);
-- only two acceptors receive A's accept before a crash
UPDATE acceptor SET up = (id <= 2);
SELECT accept(1, 'x') AS accepted;
SELECT * FROM chosen;

-- proposer B (even numbers) wants "y"; everyone is back
UPDATE acceptor SET up = true;
SELECT * FROM prepare(2);
SELECT accept(2, 'x') AS accepted;
SELECT * FROM chosen;
SELECT id, promised, acc_n, acc_v FROM acceptor ORDER BY id;`,
        note: 'A reached only 2 of 5 acceptors, so nothing was chosen. B\'s prepare(2) collects 5 promises, and the reply reports `(1, x)`: B must propose "x", not its own "y". After `accept(2, \'x\')` the view shows x chosen by 5 acceptors.' },
      { label: 'Duelling proposers', sql: `UPDATE acceptor SET promised = 0, acc_n = NULL, acc_v = NULL, up = true;
SELECT 'A prepare 1' AS step, promises FROM prepare(1)
UNION ALL SELECT 'B prepare 2', promises FROM prepare(2)
UNION ALL SELECT 'A accept 1', accept(1, 'x')
UNION ALL SELECT 'A prepare 3', promises FROM prepare(3)
UNION ALL SELECT 'B accept 2', accept(2, 'y')
UNION ALL SELECT 'B prepare 4', promises FROM prepare(4)
UNION ALL SELECT 'A accept 3', accept(3, 'x');
SELECT count(*) AS chosen_values FROM chosen;`,
        note: 'Every prepare wins all 5 promises, and every accept that follows arrives after a higher prepare, so it is accepted by 0 acceptors. Nothing is ever chosen. Safety holds; progress needs a single leader.' },
      { label: 'Lock service and fencing tokens', sql: `-- advisory locks: a lock service inside PostgreSQL
SELECT pg_try_advisory_lock(4242) AS got_lock;
SELECT locktype, objid, mode, granted FROM pg_locks WHERE locktype = 'advisory';
SELECT pg_advisory_unlock(4242) AS released;

-- fencing: every grant gets a larger token; the resource rejects older ones
CREATE SEQUENCE lock_token START 33;
CREATE TABLE report (id int PRIMARY KEY, body text, token bigint NOT NULL);
INSERT INTO report VALUES (1, 'v1', 0);
CREATE FUNCTION fenced_write(tok bigint, b text) RETURNS text LANGUAGE sql AS $$
  WITH w AS (UPDATE report SET body = b, token = tok WHERE id = 1 AND token < tok RETURNING 1)
  SELECT CASE WHEN EXISTS (SELECT 1 FROM w) THEN 'accepted' ELSE 'rejected: stale token' END $$;

SELECT nextval('lock_token') AS client1_token;   -- 33, then client 1 pauses
SELECT nextval('lock_token') AS client2_token;   -- 34, after the lease expired
SELECT fenced_write(34, 'v2 by client 2') AS client2_write;
SELECT fenced_write(33, 'v1-prime by client 1') AS client1_late_write;
SELECT * FROM report;`,
        note: 'The token is a monotonic number issued with each grant. The resource keeps the highest token it has seen, so the paused holder\'s late write with 33 is refused and client 2\'s data stays.' },
      { label: 'Timestamp ordering with the Thomas write rule', sql: `CREATE TABLE item (name text PRIMARY KEY, r_ts int NOT NULL DEFAULT 0, w_ts int NOT NULL DEFAULT 0);
INSERT INTO item VALUES ('x'), ('y');
CREATE FUNCTION to_op(kind text, x text, ts int, thomas boolean) RETURNS text LANGUAGE plpgsql AS $$
DECLARE r int; w int;
BEGIN
  SELECT r_ts, w_ts INTO r, w FROM item WHERE name = x;
  IF kind = 'r' THEN
    IF ts < w THEN RETURN 'reject: abort T' || ts; END IF;
    UPDATE item SET r_ts = greatest(r_ts, ts) WHERE name = x; RETURN 'ok';
  END IF;
  IF ts < r THEN RETURN 'reject: abort T' || ts; END IF;
  IF ts < w THEN RETURN CASE WHEN thomas THEN 'ignored (obsolete write)' ELSE 'reject: abort T' || ts END; END IF;
  UPDATE item SET w_ts = ts WHERE name = x; RETURN 'ok';
END $$;

SELECT 'w2(x)' AS op, to_op('w', 'x', 2, false) AS basic_to
UNION ALL SELECT 'w1(x) basic', to_op('w', 'x', 1, false)
UNION ALL SELECT 'w1(x) thomas', to_op('w', 'x', 1, true)
UNION ALL SELECT 'r3(y)', to_op('r', 'y', 3, true)
UNION ALL SELECT 'w2(y) thomas', to_op('w', 'y', 2, true)
UNION ALL SELECT 'r1(x)', to_op('r', 'x', 1, true);
SELECT * FROM item ORDER BY name;`,
        note: 'A late write that only conflicts with a newer write can be skipped under the Thomas rule. A late write after a newer read (`w2(y)` after `r3(y)`) and a late read (`r1(x)`) must still abort.' },
      { label: 'A global wait-for graph', sql: `-- wait edges reported by each worker: waiter -> holder
CREATE TABLE wait_edges (node text, waiter text, holder text);
INSERT INTO wait_edges VALUES ('worker A', 'D2', 'D1'), ('worker B', 'D1', 'D2'), ('worker B', 'D3', 'D1');
CREATE TABLE dist_xact (id text PRIMARY KEY, started timestamptz NOT NULL);
INSERT INTO dist_xact VALUES ('D1', '2026-11-14 10:00:00'), ('D2', '2026-11-14 10:00:05'), ('D3', '2026-11-14 10:00:09');

-- each node alone: no cycle
WITH RECURSIVE p(node, start, cur, path) AS (
  SELECT node, waiter, holder, ARRAY[waiter, holder] FROM wait_edges
  UNION ALL
  SELECT p.node, p.start, e.holder, p.path || e.holder FROM p JOIN wait_edges e ON e.node = p.node AND e.waiter = p.cur
  WHERE NOT e.holder = ANY (p.path[2:]))
SELECT node, count(*) FILTER (WHERE cur = start) AS local_cycles FROM p GROUP BY node ORDER BY node;

-- union of all nodes: a cycle; cancel its youngest member
WITH RECURSIVE p(start, cur, path) AS (
  SELECT waiter, holder, ARRAY[waiter, holder] FROM wait_edges
  UNION ALL
  SELECT p.start, e.holder, p.path || e.holder FROM p JOIN wait_edges e ON e.waiter = p.cur WHERE NOT e.holder = ANY (p.path[2:]))
SELECT path AS cycle,
       (SELECT id FROM dist_xact WHERE id = ANY (path) ORDER BY started DESC LIMIT 1) AS victim
FROM p WHERE cur = start ORDER BY path LIMIT 1;
SHOW deadlock_timeout;`,
        note: 'Neither worker has a cycle on its own. The union contains D1 → D2 → D1, and the youngest member, D2, is the victim. D3 waits too but is not on the cycle, so it simply waits for D1.' },
    ],
  },
  production: {
    title: 'Stuck shards after a coordinator crash',
    context: 'An inventory service moves stock between warehouses stored on different shards. Its Citus cluster uses 2PC for every multi-shard write.',
    problem: 'A coordinator node was killed during a deploy while 40 transfers sat between PREPARE and COMMIT PREPARED. On the workers those rows stayed locked, and every order for those SKUs waited. Some engineers wanted "three-phase commit" to stop this from happening.',
    solution: '3PC would trade blocking for split-brain risk under partitions. Instead the team made the coordinator\'s decision durable and recoverable: Citus writes a row to `pg_dist_transaction` for every transaction it prepares on a worker (a present row means commit), and its maintenance daemon runs recovery every minute by default, committing or rolling back what is left. They also bounded waits so blocked orders fail fast, and kept distributed deadlock detection on.',
    sql: `-- on the coordinator after restart: resolve in-doubt transactions now
SELECT recover_prepared_transactions();

-- on each worker: anything still prepared?
SELECT gid, prepared, now() - prepared AS age FROM pg_prepared_xacts ORDER BY prepared;

-- fail fast instead of piling up behind a prepared row
ALTER ROLE inventory_app SET lock_timeout = '2s';
-- distributed deadlock checks run after 2 x deadlock_timeout (the default factor)
SHOW citus.distributed_deadlock_detection_factor;`,
    outcome: 'After a crash, in-doubt transfers resolve as soon as the coordinator is back, and callers see a timeout error within 2 s instead of hanging. The blocking window shrank to the coordinator\'s restart time.',
  },
  pitfalls: [
    { title: 'Reaching for three-phase commit',
      symptom: 'A design adds a pre-commit round to avoid 2PC blocking, and a later network split leaves some nodes committed and others aborted.',
      cause: '3PC is non-blocking only if every failure is a crash that can be detected reliably. When messages are lost in a partition, no commit protocol can be both non-blocking and correct.',
      fix: 'Keep 2PC and make the coordinator highly available instead: log the decision durably, replicate it with consensus, and run recovery on start-up.' },
    { title: 'Treating a lease as a lock',
      symptom: 'Two workers both believe they own a job; one overwrites the other\'s output after a long pause.',
      cause: 'A lease expires on the lock service\'s clock. A paused or slow holder keeps acting after expiry, and nothing at the resource stops it.',
      fix: 'Issue a monotonically increasing fencing token with every grant and have the resource reject writes with a token lower than the highest it has seen.',
      sql: `UPDATE report SET body = $1, token = $2 WHERE id = $3 AND token < $2;  -- 0 rows = stale holder` },
    { title: 'Local deadlock detection in a cluster',
      symptom: 'Two multi-shard transactions hang forever although every node\'s `deadlock_timeout` fired.',
      cause: 'Each node sees only its own wait-for edges. A cycle that spans nodes is invisible to every local detector.',
      fix: 'Run a global detector that unions wait edges (Citus does, after `distributed_deadlock_detection_factor` × `deadlock_timeout`), and set `lock_timeout` as a backstop.' },
    { title: 'Livelock from duelling proposers',
      symptom: 'A homegrown consensus layer makes no progress under load: proposals keep restarting with higher numbers.',
      cause: 'Paxos is safe with rival proposers but has no liveness guarantee: each prepare can invalidate the other\'s accept forever.',
      fix: 'Elect one distinguished proposer with randomized timeouts, as Raft does, and let others forward to it. Prefer a proven implementation (etcd, a Raft library) over writing one.' },
  ],
  pointers: [
    '**2PC** blocks when the coordinator dies after the votes: an uncertain participant can neither commit nor abort. **3PC** adds a committable pre-commit state, which removes blocking for crashes but breaks atomicity under partitions.',
    '**Paxos**: prepare(n) → promises plus the highest accepted proposal; accept(n, v) where v is that proposal\'s value if any. A majority makes a value chosen; a single leader makes progress. **Raft** builds the same guarantee around terms and one leader.',
    '**Basic TO** aborts any operation that arrives after a conflicting one with a larger timestamp; the **Thomas write rule** skips obsolete writes instead. **Optimistic** schedulers validate at commit.',
    'A distributed deadlock is a cycle in the **union** of local wait-for graphs; detectors typically cancel the youngest transaction on it and must avoid phantom cycles. Leases need **fencing tokens**.',
    'PostgreSQL pieces: [two-phase commit and HLC](/e3/distributed-transactions), [Raft in distributed SQL](/e3/distributed-sql-multimaster), [local deadlocks](/m5/lwlocks-deadlocks), [row locks and SKIP LOCKED](/m5/row-locks-skip-locked).',
  ],
  sources: ['sql-prepare-transaction.html', 'sql-commit-prepared.html', 'view-pg-prepared-xacts.html', 'view-pg-locks.html', 'explicit-locking.html', 'functions-admin.html', 'runtime-config-locks.html', 'queries-with.html', 'sql-createsequence.html', 'plpgsql.html'],
}
