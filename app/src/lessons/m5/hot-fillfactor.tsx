import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* ------------------------------------------------------------------------------------------------
 * Part 1: items(id PK, sku indexed, qty). Every offset, xid, ctid, flag and index entry is from a real
 * PostgreSQL 18.6 run with pageinspect (heap_page_items + bt_page_items on both indexes).
 * Part 2: fillfactor explorer with numbers measured on 10,000-row tables in PGlite.
 * ---------------------------------------------------------------------------------------------- */

interface Lp { lp: number; flag: 0 | 1 | 2; off: number; row?: string; xmin?: number; xmax?: number; ctid?: string; hot?: boolean; only?: boolean; st: 'live' | 'new' | 'dead' | 'none' }
interface IdxE { key: string; ctid: string; st: 'live' | 'new' }
interface HotState { lps: Lp[]; pk: IdxE[]; sku: IdxE[]; upd: number; hotUpd: number; path?: number[] }

const L = (lp: number, off: number, row: string, xmin: number, extra: Partial<Lp> = {}): Lp => ({ lp, flag: 1, off, row, xmin, xmax: 0, ctid: `(0,${lp})`, st: 'live', ...extra })
const pk0: IdxE[] = [{ key: '1', ctid: '(0,1)', st: 'live' }, { key: '2', ctid: '(0,2)', st: 'live' }, { key: '3', ctid: '(0,3)', st: 'live' }]
const sku0: IdxE[] = [{ key: 'A-100', ctid: '(0,1)', st: 'live' }, { key: 'B-200', ctid: '(0,2)', st: 'live' }, { key: 'C-300', ctid: '(0,3)', st: 'live' }]
const ins = [L(1, 8152, '1,A-100,5', 756), L(2, 8112, '2,B-200,7', 756), L(3, 8072, '3,C-300,9', 756)]
const hot1 = [L(1, 8152, '1,A-100,5', 756, { xmax: 757, ctid: '(0,4)', hot: true, st: 'dead' }), ins[1], ins[2], L(4, 8032, '1,A-100,6', 757, { only: true, st: 'new' })]
const hot2 = [hot1[0], ins[1], ins[2], L(4, 8032, '1,A-100,6', 757, { xmax: 758, ctid: '(0,5)', hot: true, only: true, st: 'dead' }), L(5, 7992, '1,A-100,7', 758, { only: true, st: 'new' })]
const cold = [hot2[0], L(2, 8112, '2,B-200,7', 756, { xmax: 759, ctid: '(0,6)', st: 'dead' }), ins[2], hot2[3], { ...hot2[4], st: 'live' as const }, L(6, 7952, '2,B-201,7', 759, { st: 'new' })]

const steps: Step<HotState>[] = [
  { title: 'Three rows, two indexes', body: 'Each row has one entry in `items_pkey` and one in `items_sku_idx`, pointing at its ctid. Tuples are 40 bytes and are placed from the end of the page: 8152, 8112, 8072.',
    state: { lps: ins, pk: pk0, sku: sku0, upd: 0, hotUpd: 0 } },
  { title: 'UPDATE qty = 6 WHERE id = 1 → HOT', body: '`qty` is in no index and the page has room, so this is a **heap-only** update. The old tuple gets `HEAP_HOT_UPDATED` and `t_ctid → (0,4)`. The new one is flagged `HEAP_ONLY_TUPLE`. **No index entry is written.**',
    state: { lps: hot1, pk: pk0, sku: sku0, upd: 1, hotUpd: 1 } },
  { title: 'UPDATE qty = 7 → the HOT chain grows', body: 'Same again: (0,4) now points to (0,5). The chain is `lp 1 → 4 → 5`, all on one page, and the indexes still only know about **(0,1)**.',
    state: { lps: hot2, pk: pk0, sku: sku0, upd: 2, hotUpd: 2 } },
  { title: "UPDATE sku = 'B-201' WHERE id = 2 → not HOT", body: '`sku` is indexed, so HOT is impossible. The new version (0,6) needs an entry in **every** index: even `items_pkey` gets a second key **2**, though `id` did not change.',
    state: { lps: cold, pk: [pk0[0], pk0[1], { key: '2', ctid: '(0,6)', st: 'new' }, pk0[2]], sku: [sku0[0], sku0[1], { key: 'B-201', ctid: '(0,6)', st: 'new' }, sku0[2]], upd: 3, hotUpd: 2 } },
  { title: 'Index scan id = 1 follows the chain', body: 'The pkey entry still says (0,1). The scan lands on lp 1, sees `HEAP_HOT_UPDATED`, and walks `t_ctid` to (0,4) and (0,5), checking visibility of each version, all inside the same page.',
    state: { lps: cold.map((l) => ({ ...l, st: l.st === 'new' ? 'live' : l.st })), pk: [pk0[0], pk0[1], { key: '2', ctid: '(0,6)', st: 'live' }, pk0[2]], sku: [sku0[0], sku0[1], { key: 'B-201', ctid: '(0,6)', st: 'live' }, sku0[2]], upd: 3, hotUpd: 2, path: [1, 4, 5] } },
  { title: 'VACUUM: redirect, free, compact', body: 'lp 1 becomes **LP_REDIRECT → 5**, so the index entry for (0,1) stays valid. The HOT member lp 4 is freed without touching any index. lp 2 is freed only after its **index entries** are deleted. Survivors slide to 8152, 8112, 8072.',
    state: { lps: [{ lp: 1, flag: 2, off: 5, st: 'none' }, { lp: 2, flag: 0, off: 0, st: 'none' }, L(3, 8152, '3,C-300,9', 756), { lp: 4, flag: 0, off: 0, st: 'none' }, L(5, 8112, '1,A-100,7', 758, { only: true }), L(6, 8072, '2,B-201,7', 759)],
      pk: [pk0[0], { key: '2', ctid: '(0,6)', st: 'live' }, pk0[2]], sku: [sku0[0], { key: 'B-201', ctid: '(0,6)', st: 'live' }, sku0[2]], upd: 3, hotUpd: 2 } },
]

const lpTone = (l: Lp): Tone => (l.flag === 2 ? 'header' : l.flag === 0 ? 'muted' : l.st === 'dead' ? 'dead' : l.st === 'new' ? 'new' : 'tuple')
const W = 800, LPW = 122, LPG = 8, LPY = 146, TY = 210, TH = 80
const lpX = (lp: number) => 16 + (lp - 1) * (LPW + LPG)
const EW = 76, EG = 6

function IndexBox({ x, name, entries }: { x: number; name: string; entries: IdxE[] }) {
  return (
    <g>
      <text x={x} y={16} fontSize={11} fontWeight={700} fill="var(--muted)" fontFamily="var(--font-mono)">{name} (leaf)</text>
      {entries.map((e, i) => (
        <motion.g key={`${e.key}${e.ctid}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
          <motion.rect animate={{ x: x + i * (EW + EG) }} y={24} width={EW} height={38} rx={5} fill={toneBg(e.st === 'new' ? 'new' : 'pointer', 18)} stroke={tone(e.st === 'new' ? 'new' : 'pointer')} strokeWidth={e.st === 'new' ? 2 : 1} />
          <motion.text animate={{ x: x + i * (EW + EG) + EW / 2 }} y={40} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{e.key}</motion.text>
          <motion.text animate={{ x: x + i * (EW + EG) + EW / 2 }} y={55} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">→ {e.ctid}</motion.text>
        </motion.g>
      ))}
    </g>
  )
}

function HotPage({ s }: { s: HotState }) {
  const target = (c: string) => Number(c.match(/,(\d+)\)/)![1])
  const idxArrows = (entries: IdxE[], x0: number, t: Tone) => entries.map((e, i) => {
    const sx = x0 + i * (EW + EG) + EW / 2, ex = lpX(target(e.ctid)) + LPW / 2
    return <motion.path key={`${x0}${e.key}${e.ctid}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1, d: `M${sx},62 C${sx},${LPY - 40} ${ex},${LPY - 50} ${ex},${LPY - 2}` }} transition={{ duration: 0.5 }}
      fill="none" stroke={tone(e.st === 'new' ? 'new' : t)} strokeWidth={1.3} opacity={0.75} markerEnd="url(#hotarrow)" />
  })
  const onPath = new Set(s.path ?? [])
  return (
    <svg viewBox={`0 0 ${W} 326`} className="w-full min-w-[720px]" role="img" aria-label="Heap page with two B-tree indexes">
      <defs>
        <marker id="hotarrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-pointer)" /></marker>
        <marker id="hotarrow-d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-dead)" /></marker>
        <marker id="hotarrow-h" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--c-header)" /></marker>
      </defs>
      <IndexBox x={16} name="items_pkey" entries={s.pk} />
      <IndexBox x={W / 2 + 20} name="items_sku_idx" entries={s.sku} />
      {idxArrows(s.pk, 16, 'pointer')}
      {idxArrows(s.sku, W / 2 + 20, 'pointer')}
      <text x={16} y={LPY - 8} fontSize={10.5} fill="var(--muted)" fontFamily="var(--font-mono)">heap page 0: line pointers</text>
      {s.lps.map((l) => {
        const t = lpTone(l), x = lpX(l.lp)
        return (
          <g key={l.lp}>
            <motion.rect initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={x} y={LPY} width={LPW} height={34} rx={5} fill={toneBg(l.flag === 1 ? 'pointer' : t, 16)} stroke={tone(onPath.has(l.lp) ? 'accent' : l.flag === 1 ? 'pointer' : t)} strokeWidth={onPath.has(l.lp) ? 2.5 : 1} />
            <text x={x + 6} y={LPY + 14} fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">lp {l.lp}</text>
            <text x={x + 6} y={LPY + 28} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{l.flag === 1 ? `NORMAL @ ${l.off}` : l.flag === 2 ? `REDIRECT → ${l.off}` : 'UNUSED'}</text>
            {l.flag === 1 && (
              <motion.g initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <line x1={x + LPW / 2} y1={LPY + 34} x2={x + LPW / 2} y2={TY} stroke="var(--c-pointer)" strokeWidth={1} opacity={0.6} />
                <rect x={x} y={TY} width={LPW} height={TH} rx={6} fill={toneBg(t, 18)} stroke={tone(onPath.has(l.lp) ? 'accent' : t)} strokeWidth={onPath.has(l.lp) ? 2.5 : 1} />
                <text x={x + 6} y={TY + 15} fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">({l.row})</text>
                <text x={x + 6} y={TY + 30} fontSize={9.5} fill={l.xmax ? 'var(--c-dead)' : 'var(--muted)'} fontFamily="var(--font-mono)">xmin {l.xmin}  xmax {l.xmax || 0}</text>
                <text x={x + 6} y={TY + 44} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">t_ctid {l.ctid}</text>
                {l.hot && <text x={x + 6} y={TY + 58} fontSize={9.5} fontWeight={700} fill="var(--c-header)" fontFamily="var(--font-mono)">HEAP_HOT_UPDATED</text>}
                {l.only && <text x={x + 6} y={l.hot ? TY + 71 : TY + 58} fontSize={9.5} fontWeight={700} fill="var(--c-header)" fontFamily="var(--font-mono)">HEAP_ONLY_TUPLE</text>}
              </motion.g>
            )}
          </g>
        )
      })}
      {/* t_ctid chain arrows */}
      {s.lps.filter((l) => l.flag === 1 && l.ctid !== `(0,${l.lp})`).map((l) => {
        const x1 = lpX(l.lp) + LPW - 18, x2 = lpX(target(l.ctid!)) + 18
        return <motion.path key={`c${l.lp}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} d={`M${x1},${TY + TH} C${x1},${TY + TH + 26} ${x2},${TY + TH + 26} ${x2},${TY + TH + 2}`}
          fill="none" stroke={tone(l.hot ? 'header' : 'dead')} strokeWidth={1.5} strokeDasharray="4 3" markerEnd={`url(#hotarrow-${l.hot ? 'h' : 'd'})`} />
      })}
      {/* redirect arrows */}
      {s.lps.filter((l) => l.flag === 2).map((l) => {
        const x1 = lpX(l.lp) + LPW / 2, x2 = lpX(l.off) + LPW / 2
        return <motion.path key={`r${l.lp}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} d={`M${x1},${LPY + 34} C${x1},${LPY + 56} ${x2},${LPY + 56} ${x2},${LPY + 36}`} fill="none" stroke="var(--c-header)" strokeWidth={1.8} markerEnd="url(#hotarrow-h)" />
      })}
    </svg>
  )
}

function Stat({ k, v, t }: { k: string; v: string; t?: Tone }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{k}</p>
      <motion.p key={v} initial={{ opacity: 0.3, y: -3 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-lg font-bold" style={t ? { color: tone(t) } : undefined}>{v}</motion.p>
    </div>
  )
}

/* ---------------- fillfactor explorer (measured) ---------------- */
type FF = '100' | '90' | '80' | '70' | '50'
type Wl = 'some' | 'all'
interface FFRow { before: number; heap: number; pk: number; sku: number; hot: number[]; rpp: number }
// 10,000 rows: id int PK, sku text indexed, qty int, note = 40 x's. Indexes start at pk 30 / sku 64 pages.
// 'some' = UPDATE … SET qty = qty + 1 WHERE id % 5 = k, three rounds (2,000 rows each). hot = cumulative HOT % after each round.
// 'all' = one UPDATE of every row.
const FFDATA: Record<Wl, Record<FF, FFRow>> = {
  some: {
    100: { before: 114, heap: 138, pk: 57, sku: 67, hot: [0, 49, 65], rpp: 88 },
    90: { before: 127, heap: 140, pk: 30, sku: 64, hot: [57, 78, 84], rpp: 79 },
    80: { before: 143, heap: 143, pk: 30, sku: 64, hot: [100, 100, 100], rpp: 70 },
    70: { before: 162, heap: 162, pk: 30, sku: 64, hot: [100, 100, 100], rpp: 62 },
    50: { before: 228, heap: 228, pk: 30, sku: 64, hot: [100, 100, 100], rpp: 44 },
  },
  all: {
    100: { before: 114, heap: 228, pk: 57, sku: 71, hot: [0], rpp: 88 },
    90: { before: 127, heap: 239, pk: 57, sku: 71, hot: [11], rpp: 79 },
    80: { before: 143, heap: 249, pk: 57, sku: 71, hot: [26], rpp: 70 },
    70: { before: 162, heap: 255, pk: 57, sku: 71, hot: [42], rpp: 62 },
    50: { before: 228, heap: 228, pk: 30, sku: 64, hot: [100], rpp: 44 },
  },
}

function FillfactorExplorer() {
  const [ff, setFf] = useState<FF>('100')
  const [wl, setWl] = useState<Wl>('some')
  const d = FFDATA[wl][ff]
  const maxPages = 260
  const bar = (label: string, before: number, after: number, t: Tone) => (
    <div className="grid grid-cols-[92px_1fr_88px] items-center gap-2 text-xs">
      <span className="font-mono text-muted">{label}</span>
      <div className="relative h-5 rounded bg-surface-2">
        <motion.div className="absolute inset-y-0 left-0 rounded" style={{ background: toneBg(t, 30), border: `1px solid ${tone(t)}` }} initial={false} animate={{ width: `${(after / maxPages) * 100}%` }} transition={{ type: 'spring', stiffness: 140, damping: 20 }} />
        <motion.div className="absolute inset-y-0 w-0.5" style={{ background: 'var(--text)' }} initial={false} animate={{ left: `${(before / maxPages) * 100}%` }} />
      </div>
      <span className="font-mono tabular-nums">{before} → <b style={{ color: after > before ? tone('dead') : tone('ok') }}>{after}</b></span>
    </div>
  )
  const idxBefore = { pk: 30, sku: 64 }
  return (
    <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="fillfactor" value={ff} onChange={setFf} options={[['100', 'ff 100'], ['90', 'ff 90'], ['80', 'ff 80'], ['70', 'ff 70'], ['50', 'ff 50']]} />
        <Segmented label="Workload" value={wl} onChange={setWl} options={[['some', '3 × update 20% of rows'], ['all', 'update every row once']]} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat k="rows per page" v={String(d.rpp)} />
        <Stat k="HOT updates" v={`${d.hot[d.hot.length - 1]}%`} t={d.hot[d.hot.length - 1] === 100 ? 'ok' : d.hot[d.hot.length - 1] > 50 ? 'new' : 'dead'} />
        <Stat k="pkey pages" v={`${idxBefore.pk} → ${d.pk}`} t={d.pk > idxBefore.pk ? 'dead' : 'ok'} />
        <Stat k="heap pages" v={`${d.before} → ${d.heap}`} />
      </div>
      <div className="grid gap-1.5 rounded-lg border border-line bg-bg p-3">
        {bar('heap', d.before, d.heap, 'tuple')}
        {bar('items_pkey', idxBefore.pk, d.pk, 'pointer')}
        {bar('sku_idx', idxBefore.sku, d.sku, 'pointer')}
        {wl === 'some' && (
          <div className="mt-1 grid grid-cols-[92px_1fr] items-center gap-2 text-xs">
            <span className="font-mono text-muted">HOT % by round</span>
            <div className="flex gap-1">
              {d.hot.map((h, i) => (
                <div key={i} className="relative h-5 flex-1 rounded bg-surface-2">
                  <motion.div className="absolute inset-y-0 left-0 rounded" style={{ background: toneBg('ok', 40) }} initial={false} animate={{ width: `${h}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px]">r{i + 1}: {h}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted"><Md>{wl === 'some'
        ? '10,000 rows, cumulative HOT share after each round. At **ff 100** the first round finds no room: every update goes to a new page and adds entries to both indexes, and `items_pkey` almost doubles from splits. Later rounds partly recover because pruning and the new pages leave space. From **ff 80** every update is HOT.'
        : 'A full-table UPDATE needs room for a second copy of every row on its own page, so only **ff 50** keeps it 100% HOT. Big batch rewrites are better handled by batching, or by accepting one non-HOT pass followed by VACUUM.'}</Md></p>
    </div>
  )
}

function HotViz() {
  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <Stepper steps={steps} interval={3400} render={(s) => (
        <div className="grid min-w-0 gap-3 [&>*]:min-w-0">
          <Legend items={[['pointer', 'index entry / line pointer'], ['tuple', 'live tuple'], ['new', 'written this step'], ['dead', 'old version'], ['header', 'HOT chain / redirect'], ['accent', 'index scan path']]} />
          <div className="grid grid-cols-3 gap-2">
            <Stat k="n_tup_upd" v={String(s.upd)} />
            <Stat k="n_tup_hot_upd" v={String(s.hotUpd)} t="ok" />
            <Stat k="index entries" v={String(s.pk.length + s.sku.length)} t={s.pk.length > 3 ? 'dead' : undefined} />
          </div>
          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-line bg-bg p-2"><HotPage s={s} /></div>
        </div>
      )} />
      <div className="grid min-w-0 gap-2 border-t border-line pt-4 [&>*]:min-w-0">
        <p className="text-sm font-semibold">Fillfactor explorer</p>
        <FillfactorExplorer />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'hot-fillfactor',
  module: 'm5',
  order: 3,
  title: 'HOT updates and fillfactor',
  tldr: [
    'A **heap-only tuple (HOT)** update writes the new row version on the same page and chains to it from the old one, so no index entry is added when no indexed column changed.',
    'It exists because every non-HOT update must insert into **every index** on the table, and leaving free space with **fillfactor** is how you make HOT the common case.',
  ],
  visualizer: {
    title: 'HOT chains vs index churn',
    caption: 'Step through two HOT updates, a non-HOT update, an index scan and VACUUM. Then pick a fillfactor and a workload to see the HOT rate and index growth it produces.',
    Component: HotViz,
  },
  playground: {
    extensions: ['pageinspect'],
    setup: `
CREATE TABLE items (id int PRIMARY KEY, sku text, qty int);
CREATE INDEX items_sku_idx ON items (sku);
ALTER TABLE items SET (autovacuum_enabled = false);
INSERT INTO items VALUES (1, 'A-100', 5), (2, 'B-200', 7), (3, 'C-300', 9);
CREATE TABLE users (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, email text UNIQUE NOT NULL, name text);
ALTER TABLE users SET (autovacuum_enabled = false);
INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice'), ('bob@example.com', 'Bob');`,
    presets: [
      { label: 'HOT update', sql: `UPDATE items SET qty = 6 WHERE id = 1;

SELECT lp, lp_off, t_xmin, t_xmax, t_ctid,
       (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('items', 0));

SELECT itemoffset, ctid FROM bt_page_items('items_pkey', 1);`,
        note: 'lp 1 gets `HEAP_HOT_UPDATED` and `t_ctid = (0,4)`; lp 4 is `HEAP_ONLY_TUPLE`. The pkey index still has exactly three entries, all pointing at the original ctids.' },
      { label: 'Chain a second HOT update', sql: `UPDATE items SET qty = 7 WHERE id = 1;

SELECT lp, t_xmin, t_xmax, t_ctid,
       (heap_tuple_infomask_flags(t_infomask, t_infomask2)).raw_flags
FROM heap_page_items(get_raw_page('items', 0));`,
        note: 'The chain is now lp 1 → 4 → 5. An index scan for id = 1 enters at lp 1 and walks the chain inside the page.' },
      { label: 'Non-HOT: change an indexed column', sql: `UPDATE items SET sku = 'B-201' WHERE id = 2;

SELECT 'pkey' AS idx, itemoffset, ctid FROM bt_page_items('items_pkey', 1)
UNION ALL
SELECT 'sku', itemoffset, ctid FROM bt_page_items('items_sku_idx', 1);

SELECT pg_stat_force_next_flush();
SELECT n_tup_upd, n_tup_hot_upd, n_tup_newpage_upd
FROM pg_stat_user_tables WHERE relname = 'items';`,
        note: 'Both indexes gain an entry pointing at (0,6), even `items_pkey` whose key did not change. The counters show 3 updates, 2 of them HOT.' },
      { label: 'VACUUM: redirects', sql: `VACUUM items;

SELECT lp, lp_off, lp_flags, t_ctid FROM heap_page_items(get_raw_page('items', 0));
SELECT itemoffset, ctid FROM bt_page_items('items_pkey', 1);`,
        note: '`lp_flags = 2` is a **redirect**: lp 1 now points to lp 5 (its `lp_off` holds the target). lp 2 and lp 4 are unused (0). The pkey entry for (0,2) is gone.' },
      { label: 'fillfactor 100 vs 80', sql: `CREATE TABLE ff100 (id int PRIMARY KEY, sku text, qty int, note text) WITH (fillfactor = 100, autovacuum_enabled = false);
CREATE TABLE ff80  (LIKE ff100 INCLUDING INDEXES) WITH (fillfactor = 80, autovacuum_enabled = false);
INSERT INTO ff100 SELECT g, 'SKU-' || g, 0, repeat('x', 40) FROM generate_series(1, 10000) g;
INSERT INTO ff80 SELECT * FROM ff100;
UPDATE ff100 SET qty = qty + 1 WHERE id % 5 = 1;
UPDATE ff80  SET qty = qty + 1 WHERE id % 5 = 1;
SELECT pg_stat_force_next_flush();

SELECT relname, n_tup_upd, n_tup_hot_upd,
       pg_relation_size(relid) / 8192 AS heap_pages,
       pg_relation_size(relname || '_pkey') / 8192 AS pkey_pages
FROM pg_stat_user_tables WHERE relname IN ('ff100', 'ff80') ORDER BY 1;`,
        note: 'Same 2,000 updates. **ff80** does all of them HOT and the primary key stays the same size. **ff100** does none HOT and its primary key index nearly doubles from page splits.' },
      { label: 'An index on the hot column', sql: `CREATE INDEX ON ff80 (qty);
UPDATE ff80 SET qty = qty + 1 WHERE id % 5 = 2;
SELECT pg_stat_force_next_flush();

SELECT n_tup_upd, n_tup_hot_upd FROM pg_stat_user_tables WHERE relname = 'ff80';`,
        note: 'Free space no longer helps: `qty` is now indexed, so `n_tup_hot_upd` does not move. A BRIN index would not block HOT, because BRIN is a *summarizing* index.' },
      { label: 'No-op updates are real writes', sql: `UPDATE users SET name = name WHERE id = 1
RETURNING old.ctid AS old_version, new.ctid AS new_version;

-- the guard: skip rows that would not change
UPDATE users SET name = 'Alice'
WHERE id = 1 AND name IS DISTINCT FROM 'Alice';

SELECT pg_stat_force_next_flush();
SELECT n_tup_upd, n_tup_hot_upd, n_dead_tup
FROM pg_stat_user_tables WHERE relname = 'users';`,
        note: 'The first UPDATE changes no value but still moves alice from **(0,1)** to **(0,3)** and leaves a dead version. It is HOT, since no indexed value changed, yet it still costs a tuple, WAL and later VACUUM work. The guarded UPDATE reports **UPDATE 0** and writes nothing.' },
      { label: 'Upsert: DO UPDATE vs DO NOTHING', sql: `INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice')
ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
RETURNING ctid, xmin, id;

INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice')
ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
RETURNING ctid, xmin, id;

INSERT INTO users (email, name) VALUES ('alice@example.com', 'Alice')
ON CONFLICT (email) DO NOTHING
RETURNING ctid, xmin, id;

SELECT pg_stat_force_next_flush();
SELECT n_tup_upd, n_tup_hot_upd, n_dead_tup
FROM pg_stat_user_tables WHERE relname = 'users';
SELECT last_value FROM users_id_seq;`,
        note: 'A "no-op" `DO UPDATE` exists only to make RETURNING produce the row, and each run writes a new version: the ctid and xmin move every time. `DO NOTHING` writes nothing and returns no row. All three attempts still drew an identity value, so the sequence moved from 2 to **5**.' },
    ],
  },
  production: {
    title: 'An index on last_seen_at killed HOT on a sessions table',
    context: 'A web app updates `sessions.last_seen_at` on every request. Someone added an index on `last_seen_at` to speed up an hourly cleanup job.',
    problem: 'Every request now changes an indexed column, so **no update is HOT**. Each one inserts into all four indexes, and the table and indexes bloat between vacuums. WAL volume and checkpoint I/O rise with them.',
    solution: 'Drop the index (the cleanup job can scan, or use a BRIN index, which does not block HOT). Lower `fillfactor` so updated rows find room on their own page. Watch the HOT ratio.',
    sql: `DROP INDEX CONCURRENTLY sessions_last_seen_at_idx;
CREATE INDEX CONCURRENTLY ON sessions USING brin (last_seen_at);
ALTER TABLE sessions SET (fillfactor = 80);  -- applies to pages written from now on
SELECT n_tup_upd, n_tup_hot_upd,
       round(100.0 * n_tup_hot_upd / nullif(n_tup_upd, 0), 1) AS hot_pct
FROM pg_stat_user_tables WHERE relname = 'sessions';`,
    outcome: 'On a 10,000-row table updating 20% of rows, fillfactor 100 gave **0% HOT** in the first round and grew the primary key from 30 to 57 pages; fillfactor 80 gave **100% HOT** with zero index growth, at the cost of 25% more heap pages up front.',
  },
  pitfalls: [
    { title: 'Indexing a frequently updated column',
      symptom: '`n_tup_hot_upd` is near zero and indexes keep growing although the row count is flat.',
      cause: 'Changing any column referenced by any non-summarizing index (including expression and partial-index predicates) rules out HOT.',
      fix: 'Keep volatile columns out of B-tree indexes, or use BRIN. Check the ratio per table.',
      sql: `SELECT relname, n_tup_upd, n_tup_hot_upd, n_tup_newpage_upd
FROM pg_stat_user_tables ORDER BY n_tup_upd DESC LIMIT 10;` },
    { title: 'Expecting ALTER TABLE … SET (fillfactor) to fix existing pages',
      symptom: 'After lowering fillfactor, the HOT ratio does not improve.',
      cause: 'Fillfactor is only honoured when new rows are inserted into pages. Existing full pages stay full.',
      fix: 'Rewrite the table once (`VACUUM FULL` or `pg_repack` during a maintenance window), or let churn redistribute rows over time.' },
    { title: 'Believing an unchanged UPDATE is free',
      symptom: 'A sync job that "only touches changed rows" generates as much WAL and as many dead tuples as a full rewrite, and `n_tup_upd` climbs on rows whose values never change.',
      cause: 'A common belief is that setting a column to its current value costs nothing. Every matched row gets a complete new version (the command tag `UPDATE n` counts them too), and a no-op `ON CONFLICT DO UPDATE` used for get-or-create does the same on every call. A one-key `jsonb_set` likewise writes the whole row, and the whole TOAST value when the document is large.',
      fix: 'Filter out unchanged rows with `IS DISTINCT FROM`, or add the built-in `suppress_redundant_updates_trigger()` as a BEFORE UPDATE trigger. For get-or-create, use `ON CONFLICT DO NOTHING` and read the existing row separately.',
      sql: `UPDATE products p SET price = s.price
FROM staging s
WHERE p.id = s.id AND p.price IS DISTINCT FROM s.price;` },
    { title: 'Pruning blocked by old snapshots',
      symptom: 'HOT updates still lead to page growth, and HOT chains get long.',
      cause: 'Pruning can only remove versions that no snapshot can see. A long-running transaction keeps every intermediate version alive.',
      fix: 'Remove long transactions (see `backend_xmin` in `pg_stat_activity`), then pruning and HOT reuse resume on their own.' },
  ],
  pointers: [
    'HOT needs both: **no indexed column changed** (BRIN excepted) and **room on the same page**.',
    'A HOT update adds **no index entries**; index scans follow the `t_ctid` chain within the page.',
    'Pruning turns the chain root into an **LP_REDIRECT** and frees intermediate versions, even during normal reads.',
    'Tables default to **fillfactor 100**; 70–90 leaves room for HOT on update-heavy tables.',
    'Monitor `n_tup_hot_upd` and `n_tup_newpage_upd` in `pg_stat_user_tables`.',
  ],
  sources: ['storage-hot.html', 'storage-page-layout.html', 'sql-createtable.html', 'monitoring-stats.html', 'pageinspect.html', 'brin.html'],
}
