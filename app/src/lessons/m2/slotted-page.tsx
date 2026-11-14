import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, Tag, tone, toneBg, type Tone } from '../../viz/kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: an 8 KB heap page through INSERT → UPDATE (HOT) → DELETE → VACUUM → INSERT.
 * Every number below (offsets, lengths, flags, pd_lower/pd_upper) was captured from a real
 * PostgreSQL 18 run with pageinspect, so the picture matches what the playground shows.
 * ---------------------------------------------------------------------------------------------- */

type LpFlag = 0 | 1 | 2 | 3
const LP_NAMES = ['LP_UNUSED', 'LP_NORMAL', 'LP_REDIRECT', 'LP_DEAD'] as const

interface Item {
  lp: number
  flag: LpFlag
  off: number
  len: number
  row?: string
  xmin?: number
  xmax?: number
  ctid?: string
  infomask: string[]
  /** visual status for colouring */
  status: 'live' | 'new' | 'dead' | 'none'
}
interface PageState { lower: number; upper: number; prune: number; items: Item[]; focus?: number }

const VAR = 'HEAP_HASVARWIDTH'
const steps: Step<PageState>[] = [
  { title: 'An empty 8 KB page', body: 'The header takes the first **24 bytes**. `pd_lower` = 24 and `pd_upper` = 8192, so all 8168 remaining bytes are free. A table has no special space, so `pd_special` = 8192.',
    state: { lower: 24, upper: 8192, prune: 0, items: [] } },
  { title: "INSERT (1, 'alice') — xid 753", body: 'A 4-byte **line pointer** is appended at `pd_lower` (24→28). The 34-byte tuple is placed at the *end* of free space, rounded up to 8-byte alignment: `pd_upper` 8192→8152.',
    state: { lower: 28, upper: 8152, prune: 0, focus: 1, items: [
      { lp: 1, flag: 1, off: 8152, len: 34, row: "(1,'alice')", xmin: 753, xmax: 0, ctid: '(0,1)', infomask: [VAR, 'HEAP_XMAX_INVALID'], status: 'new' }] } },
  { title: "INSERT (2,'bob'), (3,'carol') — xid 754", body: 'Line pointers grow **forward**, tuples grow **backward**, and they meet in the middle. The page is full when `pd_lower` would cross `pd_upper`.',
    state: { lower: 36, upper: 8080, prune: 0, focus: 3, items: [
      { lp: 1, flag: 1, off: 8152, len: 34, row: "(1,'alice')", xmin: 753, xmax: 0, ctid: '(0,1)', infomask: [VAR, 'HEAP_XMAX_INVALID'], status: 'live' },
      { lp: 2, flag: 1, off: 8120, len: 32, row: "(2,'bob')", xmin: 754, xmax: 0, ctid: '(0,2)', infomask: [VAR, 'HEAP_XMAX_INVALID'], status: 'new' },
      { lp: 3, flag: 1, off: 8080, len: 34, row: "(3,'carol')", xmin: 754, xmax: 0, ctid: '(0,3)', infomask: [VAR, 'HEAP_XMAX_INVALID'], status: 'new' }] } },
  { title: 'SELECT * — reading writes hint bits', body: 'The first reader checks the commit log, learns 753 and 754 committed, and caches that as **`HEAP_XMIN_COMMITTED`** in `t_infomask`. Nothing else changes, but the page is now dirty.',
    state: { lower: 36, upper: 8080, prune: 0, focus: 2, items: [
      { lp: 1, flag: 1, off: 8152, len: 34, row: "(1,'alice')", xmin: 753, xmax: 0, ctid: '(0,1)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID'], status: 'live' },
      { lp: 2, flag: 1, off: 8120, len: 32, row: "(2,'bob')", xmin: 754, xmax: 0, ctid: '(0,2)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID'], status: 'live' },
      { lp: 3, flag: 1, off: 8080, len: 34, row: "(3,'carol')", xmin: 754, xmax: 0, ctid: '(0,3)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID'], status: 'live' }] } },
  { title: "UPDATE … SET owner='bobby' WHERE id=2 — xid 755", body: 'An UPDATE never overwrites. It writes a **new version** at lp 4, stamps the old one with `t_xmax` = 755 and points its `t_ctid` at **(0,4)**. No indexed column changed and the page had room, so this is a **HOT** update.',
    state: { lower: 40, upper: 8040, prune: 755, focus: 4, items: [
      { lp: 1, flag: 1, off: 8152, len: 34, row: "(1,'alice')", xmin: 753, xmax: 0, ctid: '(0,1)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID'], status: 'live' },
      { lp: 2, flag: 1, off: 8120, len: 32, row: "(2,'bob')", xmin: 754, xmax: 755, ctid: '(0,4)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_HOT_UPDATED'], status: 'dead' },
      { lp: 3, flag: 1, off: 8080, len: 34, row: "(3,'carol')", xmin: 754, xmax: 0, ctid: '(0,3)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID'], status: 'live' },
      { lp: 4, flag: 1, off: 8040, len: 34, row: "(2,'bobby')", xmin: 755, xmax: 0, ctid: '(0,4)', infomask: [VAR, 'HEAP_XMAX_INVALID', 'HEAP_UPDATED', 'HEAP_ONLY_TUPLE'], status: 'new' }] } },
  { title: 'DELETE WHERE id=3 — xid 756', body: 'DELETE only sets `t_xmax` = 756. The bytes stay exactly where they were. `pd_prune_xid` remembers the oldest un-pruned xmax (755) as a hint that cleanup could pay off.',
    state: { lower: 40, upper: 8040, prune: 755, focus: 3, items: [
      { lp: 1, flag: 1, off: 8152, len: 34, row: "(1,'alice')", xmin: 753, xmax: 0, ctid: '(0,1)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID'], status: 'live' },
      { lp: 2, flag: 1, off: 8120, len: 32, row: "(2,'bob')", xmin: 754, xmax: 755, ctid: '(0,4)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_HOT_UPDATED'], status: 'dead' },
      { lp: 3, flag: 1, off: 8080, len: 34, row: "(3,'carol')", xmin: 754, xmax: 756, ctid: '(0,3)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_KEYS_UPDATED'], status: 'dead' },
      { lp: 4, flag: 1, off: 8040, len: 34, row: "(2,'bobby')", xmin: 755, xmax: 0, ctid: '(0,4)', infomask: [VAR, 'HEAP_XMAX_INVALID', 'HEAP_UPDATED', 'HEAP_ONLY_TUPLE'], status: 'live' }] } },
  { title: 'VACUUM — prune, redirect, compact', body: 'No snapshot can see the old versions any more. lp 2 becomes **`LP_REDIRECT` → 4** so the index entry for id=2 still works. lp 3 becomes **`LP_UNUSED`**. Survivors are slid to the end of the page: lp 4 moves 8040→8112, but its **ctid (0,4) does not change**.',
    state: { lower: 40, upper: 8112, prune: 0, focus: 2, items: [
      { lp: 1, flag: 1, off: 8152, len: 34, row: "(1,'alice')", xmin: 753, xmax: 0, ctid: '(0,1)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID'], status: 'live' },
      { lp: 2, flag: 2, off: 4, len: 0, infomask: [], status: 'none' },
      { lp: 3, flag: 0, off: 0, len: 0, infomask: [], status: 'none' },
      { lp: 4, flag: 1, off: 8112, len: 34, row: "(2,'bobby')", xmin: 755, xmax: 0, ctid: '(0,4)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID', 'HEAP_UPDATED', 'HEAP_ONLY_TUPLE'], status: 'live' }] } },
  { title: "INSERT (4,'dave') — xid 757 reuses slot 3", body: 'The unused line pointer is recycled, so the new row gets ctid **(0,3)**, the address carol had. `pd_lower` stays at 40. This is why a ctid is a *physical* address, never a stable row id.',
    state: { lower: 40, upper: 8072, prune: 0, focus: 3, items: [
      { lp: 1, flag: 1, off: 8152, len: 34, row: "(1,'alice')", xmin: 753, xmax: 0, ctid: '(0,1)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID'], status: 'live' },
      { lp: 2, flag: 2, off: 4, len: 0, infomask: [], status: 'none' },
      { lp: 3, flag: 1, off: 8072, len: 33, row: "(4,'dave')", xmin: 757, xmax: 0, ctid: '(0,3)', infomask: [VAR, 'HEAP_XMAX_INVALID'], status: 'new' },
      { lp: 4, flag: 1, off: 8112, len: 34, row: "(2,'bobby')", xmin: 755, xmax: 0, ctid: '(0,4)', infomask: [VAR, 'HEAP_XMIN_COMMITTED', 'HEAP_XMAX_INVALID', 'HEAP_UPDATED', 'HEAP_ONLY_TUPLE'], status: 'live' }] } },
]

const statusTone = (s: Item['status']): Tone => (s === 'new' ? 'new' : s === 'dead' ? 'dead' : 'tuple')
const lpTone = (i: Item): Tone => (i.flag === 1 ? 'pointer' : i.flag === 2 ? 'header' : i.flag === 3 ? 'dead' : 'muted')

// Schematic geometry (SVG user units)
const W = 680
const HEADER_FIELDS: [string, number][] = [['pd_lsn', 8], ['pd_checksum', 2], ['pd_flags', 2], ['pd_lower', 2], ['pd_upper', 2], ['pd_special', 2], ['pd_pagesize_version', 2], ['pd_prune_xid', 4]]
const LP_Y = 74, LP_W = 120, LP_H = 40, LP_GAP = 8
const TUP_Y = 268, TUP_W = 156, TUP_H = 58, TUP_GAP = 10
const lpX = (lp: number) => 12 + (lp - 1) * (LP_W + LP_GAP)

function PageViz({ s, selected, onSelect }: { s: PageState; selected: number; onSelect: (lp: number) => void }) {
  const tuples = s.items.filter((i) => i.flag === 1).sort((a, b) => b.off - a.off) // highest offset = rightmost
  const tupX = (idx: number) => W - 12 - (idx + 1) * TUP_W - idx * TUP_GAP
  const posOf = new Map(tuples.map((t, idx) => [t.lp, tupX(idx)]))
  const headerVals: Record<string, string> = { pd_lsn: '0/…', pd_checksum: '0', pd_flags: '0', pd_lower: String(s.lower), pd_upper: String(s.upper), pd_special: '8192', pd_pagesize_version: '8192|4', pd_prune_xid: String(s.prune) }
  let hx = 12
  const scale = (W - 24) / 24
  return (
    <svg viewBox={`0 0 ${W} 340`} className="w-full min-w-[640px]" role="img" aria-label="Schematic of an 8 KB heap page">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-pointer)" /></marker>
        <marker id="arrow-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-header)" /></marker>
      </defs>
      {/* page outline */}
      <rect x={4} y={4} width={W - 8} height={332} rx={8} fill="none" stroke="var(--border)" />
      {/* header: 24 bytes, field widths proportional to byte size */}
      {HEADER_FIELDS.map(([name, bytes]) => {
        const x = hx; const w = bytes * scale; hx += w
        const changed = name === 'pd_lower' || name === 'pd_upper' || name === 'pd_prune_xid'
        return (
          <g key={name}>
            <rect x={x} y={14} width={w - 2} height={44} rx={4} fill={toneBg('header', 18)} stroke={tone('header')} />
            <text x={x + 5} y={30} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{name === 'pd_pagesize_version' ? 'size|ver' : name.replace('pd_', '')}</text>
            <motion.text key={headerVals[name]} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} x={x + 5} y={48} fontSize={12} fontWeight={600} fill={changed ? 'var(--text)' : 'var(--muted)'} fontFamily="var(--font-mono)">{headerVals[name]}</motion.text>
          </g>
        )
      })}
      {/* line pointer array */}
      {s.items.map((it) => (
        <motion.g key={`lp${it.lp}`} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} onClick={() => onSelect(it.lp)} style={{ cursor: 'pointer' }}>
          <rect x={lpX(it.lp)} y={LP_Y} width={LP_W} height={LP_H} rx={5} fill={toneBg(lpTone(it), 20)} stroke={tone(lpTone(it))} strokeWidth={selected === it.lp ? 2.5 : 1} />
          <text x={lpX(it.lp) + 6} y={LP_Y + 15} fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">lp {it.lp}</text>
          <text x={lpX(it.lp) + 6} y={LP_Y + 31} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">
            {it.flag === 1 ? `off ${it.off} · len ${it.len}` : it.flag === 2 ? `→ lp ${it.off}` : LP_NAMES[it.flag]}
          </text>
        </motion.g>
      ))}
      {/* pd_lower / pd_upper markers + free space */}
      <rect x={12} y={128} width={W - 24} height={122} rx={6} fill="var(--c-free)" stroke="var(--border)" strokeDasharray="4 4" />
      <text x={18} y={144} fontSize={10} fill="var(--c-pointer)" fontFamily="var(--font-mono)">↑ pd_lower = {s.lower} (line pointers grow →)</text>
      <text x={W - 18} y={242} textAnchor="end" fontSize={10} fill="var(--c-tuple)" fontFamily="var(--font-mono)">(← tuples grow) pd_upper = {s.upper} ↓</text>
      {/* tuples, right-aligned by offset */}
      {tuples.map((t) => {
        const x = posOf.get(t.lp)!
        const tt = statusTone(t.status)
        return (
          <motion.g key={`t${t.lp}-${t.row}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1, x: 0 }} onClick={() => onSelect(t.lp)} style={{ cursor: 'pointer' }}>
            <motion.rect animate={{ x }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} y={TUP_Y} width={TUP_W} height={TUP_H} rx={6}
              fill={toneBg(tt, 18)} stroke={tone(tt)} strokeWidth={selected === t.lp ? 2.5 : 1} />
            <motion.text animate={{ x: x + 7 }} y={TUP_Y + 16} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">lp {t.lp} @ {t.off}</motion.text>
            <motion.text animate={{ x: x + 7 }} y={TUP_Y + 33} fontSize={12} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{t.row}</motion.text>
            <motion.text animate={{ x: x + 7 }} y={TUP_Y + 49} fontSize={10} fill={t.xmax ? 'var(--c-dead)' : 'var(--muted)'} fontFamily="var(--font-mono)">xmin {t.xmin} · xmax {t.xmax || '—'}</motion.text>
          </motion.g>
        )
      })}
      {/* pointer arrows lp -> tuple */}
      {s.items.filter((i) => i.flag === 1).map((it) => {
        const x1 = lpX(it.lp) + LP_W / 2, y1 = LP_Y + LP_H
        const x2 = posOf.get(it.lp)! + TUP_W / 2, y2 = TUP_Y
        return <motion.path key={`a${it.lp}`} initial={false} animate={{ d: `M${x1},${y1} C${x1},${y1 + 90} ${x2},${y2 - 90} ${x2},${y2 - 2}` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }}
          fill="none" stroke="var(--c-pointer)" strokeWidth={1.4} markerEnd="url(#arrow)" opacity={0.85} />
      })}
      {/* redirect arrows lp -> lp */}
      {s.items.filter((i) => i.flag === 2).map((it) => {
        const x1 = lpX(it.lp) + LP_W / 2, x2 = lpX(it.off) + LP_W / 2
        return <path key={`r${it.lp}`} d={`M${x1},${LP_Y} C${x1},${LP_Y - 14} ${x2},${LP_Y - 14} ${x2},${LP_Y - 1}`} fill="none" stroke="var(--c-header)" strokeWidth={1.6} markerEnd="url(#arrow-r)" />
      })}
      {/* ctid chain arrow for updated tuples (old version -> new version) */}
      {tuples.filter((t) => t.ctid && t.ctid !== `(0,${t.lp})`).map((t) => {
        const target = Number(t.ctid!.match(/,(\d+)\)/)![1])
        const x1 = posOf.get(t.lp)!, x2 = posOf.get(target)
        if (x2 === undefined) return null
        return <path key={`c${t.lp}`} d={`M${x1 + 30},${TUP_Y + TUP_H} C${x1 + 30},${TUP_Y + TUP_H + 18} ${x2 + TUP_W - 30},${TUP_Y + TUP_H + 18} ${x2 + TUP_W - 30},${TUP_Y + TUP_H + 1}`}
          fill="none" stroke="var(--c-dead)" strokeWidth={1.4} strokeDasharray="4 3" markerEnd="url(#arrow)" />
      })}
      {/* free-space label painted last, on a pill, so pointer arrows never hide it */}
      <rect x={W / 2 - 78} y={166} width={156} height={46} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <text x={W / 2} y={184} textAnchor="middle" fontSize={11} fill="var(--muted)" fontFamily="var(--font-sans)">free space = upper − lower</text>
      <motion.text key={s.upper - s.lower} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} x={W / 2} y={203} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">
        {s.upper - s.lower} bytes
      </motion.text>
    </svg>
  )
}

/** To-scale strip of all 8192 bytes: shows how little of the page a few rows actually use. */
function ByteStrip({ s }: { s: PageState }) {
  const px = (b: number) => (b / 8192) * 100
  return (
    <div className="mt-3">
      <div className="relative h-5 w-full overflow-hidden rounded border border-line" style={{ background: 'var(--c-free)' }} role="img" aria-label="Page drawn to scale">
        <div className="absolute inset-y-0 left-0" style={{ width: `${px(24)}%`, background: tone('header') }} />
        <div className="absolute inset-y-0" style={{ left: `${px(24)}%`, width: `${px(s.lower - 24)}%`, background: tone('pointer') }} />
        {s.items.filter((i) => i.flag === 1).map((i) => (
          <div key={i.lp} className="absolute inset-y-0" style={{ left: `${px(i.off)}%`, width: `${Math.max(px(i.len), 0.25)}%`, background: tone(statusTone(i.status)) }} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">Drawn to scale: header + line pointers + tuples use <b className="text-ink">{24 + (s.lower - 24) + (8192 - s.upper)}</b> of 8192 bytes.</p>
    </div>
  )
}

function Inspector({ item }: { item?: Item }) {
  if (!item) return <Panel title="Inspector"><p className="text-sm text-muted">Click a line pointer or a tuple.</p></Panel>
  if (item.flag !== 1) {
    return (
      <Panel title={`Line pointer ${item.lp}`}>
        <FieldTable rows={[['lp_flags', `${item.flag} (${LP_NAMES[item.flag]})`], ['lp_off', String(item.off), item.flag === 2 ? 'for a redirect: the target line pointer' : ''], ['lp_len', '0']]} />
        <p className="mt-2 text-xs text-muted">{item.flag === 2 ? 'No tuple storage. Index scans that land here hop to the surviving HOT version.' : 'Free for reuse by the next INSERT on this page.'}</p>
      </Panel>
    )
  }
  return (
    <Panel title={`Tuple at lp ${item.lp} — HeapTupleHeaderData (23 bytes)`}>
      <FieldTable rows={[
        ['t_xmin', String(item.xmin), 'inserting xid'],
        ['t_xmax', item.xmax ? String(item.xmax) : '0', item.xmax ? 'deleting / updating xid' : 'not deleted'],
        ['t_cid', '0', 'command id within the xact'],
        ['t_ctid', item.ctid!, item.ctid === `(0,${item.lp})` ? 'points at itself: newest version' : 'points at the newer version'],
        ['t_infomask2', item.infomask.some((f) => f.includes('HOT') || f.includes('ONLY') || f.includes('KEYS')) ? '2 + flags' : '2', 'attribute count (2) + HOT bits'],
        ['t_hoff', '24', 'data starts here (MAXALIGN of 23)'],
      ]} />
      <div className="mt-2 flex flex-wrap gap-1">{item.infomask.map((f) => <Tag key={f} t={f.includes('XMAX_INVALID') || f.includes('COMMITTED') ? 'ok' : f.includes('HOT') || f.includes('ONLY') ? 'header' : f.includes('KEYS') ? 'dead' : 'muted'}>{f}</Tag>)}</div>
      <p className="mt-2 text-xs text-muted">Row data: <code className="inline-code">{item.row}</code> = <code className="inline-code">int4</code> (4 bytes) + short varlena text (1-byte header + chars).</p>
    </Panel>
  )
}

function SlottedPageViz() {
  const [sel, setSel] = useState<number | null>(null)
  return (
    <Stepper steps={steps} interval={3200} render={(s) => {
      const selected = sel ?? s.focus ?? 0
      return (
        <div className="grid gap-3">
          <Legend items={[['header', 'PageHeaderData'], ['pointer', 'ItemIdData (line pointer)'], ['tuple', 'live tuple'], ['new', 'written this step'], ['dead', 'xmax set (dead once committed)']]} />
          <PageViz s={s} selected={selected} onSelect={setSel} />
          <ByteStrip s={s} />
          <Inspector item={s.items.find((i) => i.lp === selected)} />
        </div>
      )
    }} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'slotted-page',
  module: 'm2',
  order: 5,
  title: 'The 8 KB slotted page',
  tldr: [
    'Every table and index is an array of fixed **8 KB pages**, each with a 24-byte header, an array of 4-byte **line pointers** growing forward, and tuples growing backward from the end.',
    'The indirection through line pointers lets PostgreSQL move, prune and compact tuples inside a page without changing their address, the **ctid** `(block, item)` that indexes point to.',
  ],
  visualizer: {
    title: 'Inside a heap page, byte by byte',
    caption: 'Step through eight operations. Click any line pointer or tuple to inspect its header fields and byte offsets.',
    Component: SlottedPageViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE accounts (id int PRIMARY KEY, owner text);
ALTER TABLE accounts SET (autovacuum_enabled = false);
INSERT INTO accounts VALUES (1, 'alice');
INSERT INTO accounts VALUES (2, 'bob'), (3, 'carol');`,
    presets: [
      { label: 'ctid & system columns', sql: `SELECT ctid, xmin, xmax, * FROM accounts;`,
        note: 'Every row has hidden system columns. `ctid` is (block, line pointer).' },
      { label: 'Page header', sql: `SELECT lower, upper, special, pagesize, version, prune_xid
FROM page_header(get_raw_page('accounts', 0));`,
        note: '`upper - lower` is the free space. `special` = 8192 because heap pages have no special space.' },
      { label: 'Line pointers & tuples', sql: `SELECT lp, lp_off, lp_flags, lp_len, t_xmin, t_xmax, t_ctid, t_hoff,
       (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('accounts', 0));`,
        note: 'Offsets decrease as rows are added: tuples are allocated from the end of the page.' },
      { label: 'UPDATE → new version', sql: `UPDATE accounts SET owner = 'bobby' WHERE id = 2;

SELECT lp, lp_off, t_xmin, t_xmax, t_ctid,
       (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('accounts', 0));`,
        note: 'lp 2 keeps its bytes but gets `t_xmax` and `t_ctid = (0,4)`. lp 4 is the new version, flagged `HEAP_ONLY_TUPLE`.' },
      { label: 'DELETE + VACUUM', sql: `DELETE FROM accounts WHERE id = 3;
VACUUM accounts;

SELECT lp, lp_off, lp_flags, lp_len, t_ctid
FROM heap_page_items(get_raw_page('accounts', 0));`,
        note: 'Run after the UPDATE preset. lp 2 becomes `lp_flags = 2` (redirect to lp 4), lp 3 becomes 0 (unused), and the survivors are compacted.' },
      { label: 'Fill a page', sql: `CREATE TABLE fill AS SELECT g AS id, md5(g::text) AS v FROM generate_series(1, 1000) g;

SELECT (ctid::text::point)[0]::int AS block, count(*) AS rows_on_page
FROM fill GROUP BY 1 ORDER BY 1 LIMIT 5;

SELECT pg_relation_size('fill') AS bytes, pg_relation_size('fill') / 8192 AS pages;`,
        note: 'Each 61-byte row needs 64 bytes plus a 4-byte line pointer, so about **120 rows fit per page**. Files grow in whole pages, so even a one-row table takes 8192 bytes. The file here is 16 pages although only 9 hold rows: a bulk load extends the file several pages at a time.' },
      { label: 'Heap order is not id order', sql: `CREATE TABLE courses (id int PRIMARY KEY, name text, price numeric(7,2));
INSERT INTO courses VALUES (1, 'SQL', 299.99), (2, 'Go', 777.99), (3, 'Rust', 999.99), (4, 'Vue', 549.99), (5, 'K8s', 349.99);
UPDATE courses SET price = 749.99 WHERE id = 3;
UPDATE courses SET price = 779.99 WHERE id = 2;

SELECT ctid, * FROM courses;

UPDATE courses SET price = price * 1.05;
SELECT ctid, * FROM courses;`,
        note: 'No ORDER BY, so rows come back in **physical order**: 1, 4, 5, 3, 2. Each UPDATE wrote a new version at the next free slot, so 3 and 2 moved behind the others. Updating every row moves all five again, to (0,8)–(0,12), even though nothing was deleted.' },
      { label: 'ctid inside one statement', sql: `CREATE TABLE basket (fruit text);
INSERT INTO basket VALUES ('apple'), ('apple'), ('orange'), ('orange'), ('orange'), ('banana');

DELETE FROM basket a USING basket b
WHERE a.fruit = b.fruit AND a.ctid > b.ctid
RETURNING a.ctid, a.fruit;

SELECT ctid, fruit FROM basket;`,
        note: 'A table with no key can still be de-duplicated: within one statement every row version has a distinct, stable ctid. Keeping the lowest ctid per fruit leaves (0,1), (0,3) and (0,6). Outside a single statement, ctid is not a safe identifier.' },
    ],
  },
  production: {
    title: 'Sizing a 500 M-row events table before it ships',
    context: 'A team plans an `events(id bigint, user_id bigint, kind smallint, created_at timestamptz)` table and wants a disk and cache estimate.',
    problem: 'A spreadsheet based on "8 + 8 + 2 + 8 = 26 bytes a row" predicted 13 GB. The real table was **2.3× larger**, and the hot set no longer fit in `shared_buffers`.',
    solution: 'Do the page arithmetic. Each row costs a 23-byte header rounded up to `t_hoff` = 24, plus aligned data. The `smallint` placed before the `timestamptz` adds 6 padding bytes, so the data takes 32 bytes, the whole row is MAXALIGNed to 56, and each row also needs a 4-byte line pointer. That gives `(8192 - 24) / (56 + 4)` ≈ **136 rows per page**. Confirm on a 100k-row sample with `pg_relation_size` and `pageinspect` before committing to hardware.',
    sql: `-- measure, don't guess
CREATE TABLE events_sample AS
SELECT g::bigint AS id, (g % 50000)::bigint AS user_id, (g % 7)::smallint AS kind, now() AS created_at
FROM generate_series(1, 100000) g;
SELECT pg_relation_size('events_sample') / 100000.0 AS bytes_per_row,
       100000 / (pg_relation_size('events_sample') / 8192) AS rows_per_page;`,
    outcome: 'The measured ~60 bytes per row predicts about **30 GB** for 500 M rows, against the spreadsheet\'s 13 GB. The team sized storage and memory from the measured number. Reordering columns would not help here: with the `smallint` last the row is 50 bytes, which still rounds up to 56. Per-row overhead (header + line pointer + alignment) is a fixed cost to budget for, not a rounding error.',
  },
  pitfalls: [
    { title: 'Expecting rows back in insertion or id order',
      symptom: 'A report or export without ORDER BY comes back in a different order after an UPDATE, a VACUUM or an upgrade, and pagination skips or repeats rows.',
      cause: 'A heap is unordered. A sequential scan returns tuples in physical (block, line pointer) order, and every UPDATE writes the new version wherever there is room. Synchronized scans can even start mid-table.',
      fix: 'Write `ORDER BY` whenever order matters, with a unique tiebreaker such as the primary key. Never rely on the order of a plain `SELECT *`.',
      sql: `SELECT ctid, id FROM courses;          -- physical order
SELECT ctid, id FROM courses ORDER BY id;  -- the order you meant` },
    { title: 'Using ctid as a row identifier',
      symptom: 'An application caches `ctid` values to re-find rows and later updates the **wrong row**, or finds nothing.',
      cause: 'A ctid is a *physical* address. Any UPDATE writes a new version with a new ctid, and VACUUM recycles freed slots, so a later INSERT can take an old address. VACUUM FULL and CLUSTER rewrite every address.',
      fix: 'Always identify rows by a primary key. Use ctid only inside one statement, for example de-duplicating with `DELETE … WHERE ctid NOT IN (…)`.' },
    { title: 'Expecting DELETE to shrink the file',
      symptom: 'After deleting 80% of a table, `pg_relation_size` is unchanged and sequential scans are just as slow.',
      cause: 'DELETE only stamps `t_xmax`. VACUUM later reclaims the space *inside* pages for reuse, but only truncates empty pages at the very end of the file.',
      fix: 'Plain `VACUUM` makes the space reusable. To return it to the OS, rebuild the table: `VACUUM FULL` takes an ACCESS EXCLUSIVE lock; `pg_repack` can do it online. Or partition the table and drop whole partitions instead of deleting rows.' },
    { title: 'Assuming the block size can be tuned',
      symptom: 'Someone looks for a `block_size` setting to try 16 KB or 32 KB pages on a running cluster.',
      cause: '`block_size` is a read-only preset fixed when the server binaries are compiled. Every page in the cluster uses that one size.',
      fix: 'Keep the default 8 KB. A different size means rebuilding PostgreSQL and reloading the data, so tune `fillfactor`, row width and TOAST instead.',
      sql: `SHOW block_size;  -- 8192, read-only` },
  ],
  pointers: [
    'A page is **24-byte header → line pointers (4 B each, growing up) → free space → tuples (growing down) → special space**.',
    'Free space is exactly **`pd_upper - pd_lower`**. The page is full when they would meet.',
    'A **ctid `(block, lp)`** names a line pointer, not a byte offset, so tuples can move inside the page without breaking index entries.',
    'Each tuple carries a **23-byte header** (`t_xmin`, `t_xmax`, `t_cid`, `t_ctid`, `t_infomask2`, `t_infomask`, `t_hoff`), padded to 24 before the row data.',
    'Line pointer states: **NORMAL**, **REDIRECT** (HOT chain root), **DEAD** (waiting for index cleanup), **UNUSED** (free for reuse). See [HOT updates and fillfactor](/m5/hot-fillfactor) and [VACUUM vs VACUUM FULL](/m7/vacuum).',
  ],
  sources: ['storage-page-layout.html', 'storage-hot.html', 'pageinspect.html', 'ddl-system-columns.html'],
}
