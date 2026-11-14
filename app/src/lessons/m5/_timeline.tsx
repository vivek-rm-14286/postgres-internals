import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Md } from '../../lesson/Md'
import { Legend, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { Stepper } from '../../viz/Stepper'

/* ------------------------------------------------------------------------------------------------
 * SessionTimeline: a scripted two- or three-session timeline. PGlite runs one backend, so every
 * concurrency scenario in this module is simulated from the documented behaviour (Chapter 13).
 * Time flows down. Each lane is one session. A scenario is a list of events placed on integer ticks;
 * the Stepper reveals ticks one by one. A 'wait' event spans ticks until it is granted.
 * ---------------------------------------------------------------------------------------------- */

export type LaneId = 'A' | 'B' | 'C'
export interface TLane { id: LaneId; name: string; note?: string }
export type EvKind = 'sql' | 'wait' | 'grant' | 'ok' | 'err' | 'info'
export interface TEvent {
  lane: LaneId
  at: number
  /** for 'wait': first tick at which the wait is over (exclusive). Undefined = still waiting at the end. */
  until?: number
  kind: EvKind
  /** statement text (monospace) */
  sql?: string
  /** result or explanation line (inline markup) */
  out?: string
}

const kindTone: Record<EvKind, Tone> = { sql: 'tuple', wait: 'dead', grant: 'new', ok: 'ok', err: 'dead', info: 'muted' }

export interface LaneBadges { snap?: string; xid?: string; extra?: string; extraTone?: Tone }

export function Timeline({ lanes, events, tick, badges, tickLabels }: {
  lanes: TLane[]; events: TEvent[]; tick: number; badges?: Partial<Record<LaneId, LaneBadges>>; tickLabels?: string[]
}) {
  const col = new Map(lanes.map((l, i) => [l.id, i + 2]))
  const rows = tick + 1
  const minW = 66 + lanes.length * 230
  return (
    <div className="overflow-x-auto scrollbar-thin" data-testid="timeline">
      <div className="grid gap-x-2 gap-y-1.5" style={{ gridTemplateColumns: `58px repeat(${lanes.length}, minmax(210px, 1fr))`, minWidth: minW }}>
        {/* lane headers */}
        <div />
        {lanes.map((l) => {
          const b = badges?.[l.id]
          return (
            <div key={l.id} className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">{l.name}</span>
                {l.note && <span className="text-[11px] text-muted">{l.note}</span>}
              </div>
              <div className="mt-1 flex min-h-[22px] flex-wrap gap-1">
                <AnimatePresence>
                  {b?.xid && <motion.span key={`x${b.xid}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Tag t="header">xid {b.xid}</Tag></motion.span>}
                  {b?.snap && <motion.span key={`s${b.snap}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Tag t="pointer">snap {b.snap}</Tag></motion.span>}
                  {b?.extra && <motion.span key={`e${b.extra}`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Tag t={b.extraTone ?? 'accent'}>{b.extra}</Tag></motion.span>}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
        {/* tick gutter */}
        {Array.from({ length: rows }, (_, r) => (
          <div key={`t${r}`} className="flex items-start justify-end pt-2 pr-1 font-mono text-[10.5px] whitespace-nowrap text-muted tabular-nums" style={{ gridColumn: 1, gridRow: r + 2 }}>
            {tickLabels?.[r] ?? `t${r}`}
          </div>
        ))}
        {/* events */}
        {events.filter((e) => e.at <= tick).map((e, i) => {
          const isWait = e.kind === 'wait'
          const open = isWait && (e.until === undefined || e.until > tick)
          const end = isWait ? Math.min(e.until ?? tick + 1, tick + 1) : e.at + 1
          const span = Math.max(1, end - e.at)
          const t = kindTone[e.kind]
          const current = e.at === tick || open
          return (
            <motion.div key={`${e.lane}-${e.at}-${i}`} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="relative min-h-[40px] rounded-md border px-2 py-1.5 text-[12px] leading-snug"
              style={{
                gridColumn: col.get(e.lane), gridRow: `${e.at + 2} / span ${span}`,
                borderColor: tone(t), borderStyle: isWait ? 'dashed' : 'solid', borderWidth: current ? 2 : 1,
                background: isWait
                  ? `repeating-linear-gradient(135deg, ${toneBg('dead', 14)} 0 8px, transparent 8px 16px)`
                  : toneBg(t, e.kind === 'info' ? 8 : 14),
              }}>
              {isWait && open && (
                <motion.span className="absolute top-1.5 right-1.5 size-2 rounded-full" style={{ background: tone('dead') }}
                  animate={{ opacity: [1, 0.25, 1] }} transition={{ repeat: Infinity, duration: 1.1 }} />
              )}
              {e.sql && <code className="block font-mono font-semibold whitespace-pre-wrap text-ink">{e.sql}</code>}
              {e.out && <p className={`${e.sql ? 'mt-0.5' : ''} text-[11.5px]`} style={{ color: e.kind === 'err' ? tone('dead') : e.kind === 'ok' ? tone('ok') : 'var(--muted)' }}><Md>{e.out}</Md></p>}
              {isWait && <p className="mt-0.5 text-[10.5px] font-semibold tracking-wide uppercase" style={{ color: tone.text('dead') }}>{open ? 'blocked' : 'wait ended'}</p>}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------------------------- */
/** One Stepper step of a scripted scenario: which tick is revealed, the lane badges, and extra panel data. */
export interface TStep<X = undefined> { title: string; body: string; tick: number; badges?: Partial<Record<LaneId, LaneBadges>>; x: X }

export const TIMELINE_LEGEND: [Tone, string][] = [['tuple', 'statement'], ['dead', 'blocked wait / error'], ['new', 'lock granted, resumes'], ['ok', 'success / commit'], ['header', 'xid'], ['pointer', 'snapshot']]

export function ScenarioStepper<X>({ lanes, events, steps, tickLabels, panel, extra, interval = 3000 }: {
  lanes: TLane[]; events: TEvent[]; steps: TStep<X>[]; tickLabels?: string[]
  panel?: (s: TStep<X>) => ReactNode; extra?: ReactNode; interval?: number
}) {
  return (
    <Stepper steps={steps.map((s) => ({ title: s.title, body: s.body, state: s }))} interval={interval} extra={extra}
      render={(s) => (
        <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
          <Legend items={TIMELINE_LEGEND} />
          <Timeline lanes={lanes} events={events} tick={s.tick} badges={s.badges} tickLabels={tickLabels} />
          {panel?.(s)}
        </div>
      )} />
  )
}

/* --------------------------------------------------------------------------------------------- */
/** Row versions with xmin/xmax. `sees` marks which sessions' snapshots can see each version. */
export interface TVersion {
  id: string
  label: string
  xmin: string
  xmax?: string
  ctid?: string
  status: 'live' | 'new' | 'dead' | 'locked' | 'gone'
  note?: string
  sees?: Partial<Record<LaneId, boolean>>
}
const vTone: Record<TVersion['status'], Tone> = { live: 'tuple', new: 'new', dead: 'dead', locked: 'pointer', gone: 'muted' }
const vLabel: Record<TVersion['status'], string> = { live: 'live version', new: 'new or uncommitted version', dead: 'dead / superseded version', locked: 'xmax set by an open transaction', gone: 'removed' }

export function TupleVersions({ title = 'Heap tuple versions', versions, lanes: lanesIn }: { title?: string; versions: TVersion[]; lanes?: LaneId[] }) {
  const lanes = lanesIn?.filter((l) => versions.some((v) => v.sees?.[l] !== undefined))
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">{title}</p>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[460px] border-collapse font-mono text-[12px]">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              {versions.some((v) => v.ctid) && <th className="py-1 pr-2 font-normal">ctid</th>}
              <th className="py-1 pr-2 font-normal">row</th>
              <th className="py-1 pr-2 font-normal">xmin</th>
              <th className="py-1 pr-2 font-normal">xmax</th>
              {lanes?.map((l) => <th key={l} className="py-1 pr-2 font-normal">{l} sees?</th>)}
              <th className="py-1 font-normal" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {versions.map((v) => {
                const t = vTone[v.status]
                return (
                  <motion.tr key={v.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: v.status === 'gone' ? 0.45 : 1, x: 0 }} exit={{ opacity: 0 }}
                    className="border-b border-line last:border-0">
                    {versions.some((x) => x.ctid) && <td className="py-1 pr-2 text-muted">{v.ctid}</td>}
                    <td className="py-1 pr-2">
                      <span className="rounded px-1.5 py-0.5" style={{ background: toneBg(t, 20), color: 'var(--text)', borderLeft: `3px solid ${tone(t)}` }}>{v.label}</span>
                    </td>
                    <td className="py-1 pr-2">{v.xmin}</td>
                    <td className="py-1 pr-2" style={{ color: v.xmax && v.xmax !== '0' ? tone(v.status === 'locked' ? 'pointer' : 'dead') : 'var(--muted)' }}>{v.xmax || '0'}</td>
                    {lanes?.map((l) => (
                      <td key={l} className="py-1 pr-2">
                        {v.sees?.[l] === undefined ? <span className="text-muted">·</span>
                          : v.sees[l] ? <span style={{ color: tone.text('ok') }}>yes</span> : <span style={{ color: tone.text('dead') }}>no</span>}
                      </td>
                    ))}
                    <td className="py-1 font-sans text-[11.5px] text-muted">{v.note && <Md>{v.note}</Md>}</td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <div className="mt-2"><Legend items={(Object.keys(vTone) as TVersion['status'][]).filter((k) => versions.some((v) => v.status === k)).map((k) => [vTone[k], vLabel[k]] as [Tone, string])} /></div>
    </div>
  )
}

/* --------------------------------------------------------------------------------------------- */
/** Small directed graph between sessions: waits-for edges, or SSI rw-antidependencies. */
export interface GEdge { from: LaneId; to: LaneId; label: string; t?: Tone; dashed?: boolean }
export function Graph({ title, nodes, edges, highlight, caption }: {
  title: string; nodes: { id: LaneId; label: string; sub?: string; t?: Tone }[]; edges: GEdge[]; highlight?: boolean; caption?: ReactNode
}) {
  const W = 420, H = 190
  const pos: Record<string, { x: number; y: number }> = nodes.length === 2
    ? { [nodes[0].id]: { x: 100, y: 95 }, [nodes[1].id]: { x: 320, y: 95 } }
    : { [nodes[0].id]: { x: 80, y: 140 }, [nodes[1].id]: { x: 210, y: 44 }, [nodes[2].id]: { x: 340, y: 140 } }
  const R = 34
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px]" style={{ maxHeight: 220 }} role="img" aria-label={title}>
        <defs>
          {(['dead', 'pointer', 'muted', 'accent'] as Tone[]).map((t) => (
            <marker key={t} id={`m5arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={tone(t)} /></marker>
          ))}
        </defs>
        <AnimatePresence>
          {edges.map((e) => {
            const a = pos[e.from], b = pos[e.to]
            const reverse = edges.some((o) => o.from === e.to && o.to === e.from)
            const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy)
            const ux = dx / len, uy = dy / len
            const bend = reverse ? 42 : 0
            const sx = a.x + ux * R, sy = a.y + uy * R, ex = b.x - ux * (R + 3), ey = b.y - uy * (R + 3)
            const mx = (sx + ex) / 2 - uy * bend, my = (sy + ey) / 2 + ux * bend
            const t = e.t ?? (highlight ? 'dead' : 'pointer')
            return (
              <motion.g key={`${e.from}${e.to}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.path d={`M${sx},${sy} Q${mx},${my} ${ex},${ey}`} fill="none" stroke={tone(t)} strokeWidth={highlight ? 2.6 : 1.8}
                  strokeDasharray={e.dashed ? '6 4' : undefined} markerEnd={`url(#m5arrow-${t})`}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
                <rect x={mx - 62} y={my - 10} width={124} height={19} rx={5} fill="var(--surface)" stroke={tone(t)} strokeWidth={0.8} />
                <text x={mx} y={my + 4} textAnchor="middle" fontSize={10.5} fill="var(--text)" fontFamily="var(--font-mono)">{e.label}</text>
              </motion.g>
            )
          })}
        </AnimatePresence>
        {nodes.map((n) => {
          const p = pos[n.id]; const t = n.t ?? 'header'
          return (
            <g key={n.id}>
              <motion.circle cx={p.x} cy={p.y} r={R} fill={toneBg(t, 22)} stroke={tone(t)} initial={false} animate={{ strokeWidth: highlight ? 3.2 : 1.6 }} />
              <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--text)" fontFamily="var(--font-sans)">{n.label}</text>
              {n.sub && <text x={p.x} y={p.y + 14} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{n.sub}</text>}
            </g>
          )
        })}
      </svg>
      {caption && <div className="mt-1 text-xs text-muted">{caption}</div>}
    </div>
  )
}

/** Compact list of locks (held or awaited) per session. */
export interface LockRow { lane: LaneId; locktype: string; target: string; mode: string; granted: boolean }
export function LockList({ title = 'pg_locks (simulated, all sessions)', rows }: { title?: string; rows: LockRow[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted uppercase">{title}</p>
      {rows.length === 0 ? <p className="text-xs text-muted">No locks.</p> : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[330px] border-collapse font-mono text-[11.5px]">
            <thead><tr className="text-left text-[11px] text-muted"><th className="py-1 pr-2 font-normal">sess.</th><th className="py-1 pr-2 font-normal">locktype</th><th className="py-1 pr-2 font-normal">object</th><th className="py-1 pr-2 font-normal">mode</th><th className="py-1 font-normal">granted</th></tr></thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((r) => (
                  <motion.tr key={`${r.lane}${r.locktype}${r.target}${r.mode}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-line last:border-0">
                    <td className="py-1 pr-2 font-semibold">{r.lane}</td>
                    <td className="py-1 pr-2">{r.locktype}</td>
                    <td className="py-1 pr-2">{r.target}</td>
                    <td className="py-1 pr-2">{r.mode}</td>
                    <td className="py-1"><Tag t={r.granted ? 'ok' : 'dead'}>{r.granted ? 'true' : 'false'}</Tag></td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
