import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tone, type Tone } from '../../viz/kit'

/* Shared helpers for the PostGIS module. No lesson export here. */

/** Deterministic hash in [0, 1): the same input always gives the same value, so every visual is reproducible. */
export const hash = (i: number, s = 0) => {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export type P2 = [number, number]
export interface Box { x0: number; y0: number; x1: number; y1: number }
export interface Pt { id: number; x: number; y: number }

export const boxOf = (pts: { x: number; y: number }[]): Box => ({
  x0: Math.min(...pts.map((p) => p.x)), y0: Math.min(...pts.map((p) => p.y)),
  x1: Math.max(...pts.map((p) => p.x)), y1: Math.max(...pts.map((p) => p.y)),
})
export const unionBox = (bs: Box[]): Box => ({
  x0: Math.min(...bs.map((b) => b.x0)), y0: Math.min(...bs.map((b) => b.y0)),
  x1: Math.max(...bs.map((b) => b.x1)), y1: Math.max(...bs.map((b) => b.y1)),
})
export const overlaps = (a: Box, b: Box) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1
export const inBox = (p: { x: number; y: number }, b: Box) => p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1
/** Minimum distance from a point to a box (0 inside): the bound a GiST KNN scan orders its queue by. */
export const boxDist = (q: P2, b: Box) => Math.hypot(Math.max(b.x0 - q[0], 0, q[0] - b.x1), Math.max(b.y0 - q[1], 0, q[1] - b.y1))
export const dist = (q: P2, p: { x: number; y: number }) => Math.hypot(p.x - q[0], p.y - q[1])

/* ------------------------------------------------------------------------------------------------
 * A small R-tree, bulk-loaded with Sort-Tile-Recursive packing. A real GiST page holds about a hundred
 * boxes; the demo uses fanout 6 for leaves and 4 above so the structure stays readable.
 * ---------------------------------------------------------------------------------------------- */
export interface RNode { id: string; level: number; box: Box; kids: RNode[]; pts: Pt[] }

function strPack<T extends { x: number; y: number }>(items: T[], cap: number): T[][] {
  const slices = Math.ceil(Math.sqrt(items.length / cap))
  const perSlice = Math.ceil(items.length / slices)
  const byX = [...items].sort((a, b) => a.x - b.x)
  const out: T[][] = []
  for (let s = 0; s < byX.length; s += perSlice) {
    const col = byX.slice(s, s + perSlice).sort((a, b) => a.y - b.y)
    for (let i = 0; i < col.length; i += cap) out.push(col.slice(i, i + cap))
  }
  return out
}

export function buildRTree(pts: Pt[], leafCap = 6, innerCap = 4): RNode {
  let level: RNode[] = strPack(pts, leafCap).map((g, i) => ({ id: `L${i + 1}`, level: 0, box: boxOf(g), kids: [], pts: g }))
  let lv = 1
  while (level.length > 1) {
    const centred = level.map((n) => ({ n, x: (n.box.x0 + n.box.x1) / 2, y: (n.box.y0 + n.box.y1) / 2 }))
    const prefix = lv === 1 ? 'N' : 'R'
    level = strPack(centred, innerCap).map((g, i) => ({
      id: level.length <= innerCap ? 'root' : `${prefix}${i + 1}`, level: lv, box: unionBox(g.map((c) => c.n.box)), kids: g.map((c) => c.n), pts: [],
    }))
    lv++
  }
  return level[0]
}
export const allNodes = (n: RNode): RNode[] => [n, ...n.kids.flatMap(allNodes)]

/** 60 points in a 1000 m × 700 m plane: three dense neighbourhoods plus scattered points. */
export const PLANE_W = 1000, PLANE_H = 700
export const PTS60: Pt[] = Array.from({ length: 60 }, (_, k) => {
  const i = k + 1
  const centres: P2[] = [[230, 480], [640, 520], [760, 190]]
  if (i % 3 === 0) return { id: i, x: Math.round(40 + hash(i, 1) * 920), y: Math.round(40 + hash(i, 2) * 620) }
  const c = centres[i % 3 === 1 ? (i % 2) : 2]
  const a = hash(i, 3) * Math.PI * 2, r = 30 + hash(i, 4) * 150
  return { id: i, x: Math.round(Math.min(980, Math.max(20, c[0] + Math.cos(a) * r))), y: Math.round(Math.min(680, Math.max(20, c[1] + Math.sin(a) * r * 0.8))) }
})

/* ------------------------------------------------------------------------------------------------ */

export function Tile({ label, value, t, sub }: { label: string; value: ReactNode; t?: Tone; sub?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3, y: 2 }} animate={{ opacity: 1, y: 0 }}
        className="font-mono text-lg font-bold" style={t ? { color: tone.text(t) } : undefined}>{value}</motion.p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

export function Slider({ label, value, min, max, step = 1, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string
}) {
  return (
    <label className="flex w-full items-center gap-2 text-xs sm:w-auto sm:min-w-[220px] sm:flex-1">
      <span className="shrink-0 font-mono text-muted">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)} className="min-w-16 flex-1 accent-[var(--accent)]" aria-label={label} />
      <span className="w-14 shrink-0 text-right font-mono font-semibold tabular-nums">{fmt ? fmt(value) : value}</span>
    </label>
  )
}

export function Btn({ children, onClick, primary, testid, disabled }: { children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled}
      className={primary
        ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent disabled:opacity-40'
        : 'rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent disabled:opacity-40'}>
      {children}
    </button>
  )
}

export function Sql({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-lg border border-line bg-code px-3 py-2 font-mono text-[11.5px] leading-[18px] whitespace-pre scrollbar-thin">{children}</pre>
}

/** Pointer-to-SVG-user-space conversion for draggable query points. */
export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number): P2 {
  const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = clientY
  const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
  return [p.x, p.y]
}

/* ------------------------------------------------------------------------------------------------
 * Playground dataset shared by lessons 2 and 3: 20 000 invented points of interest spread over a
 * 0.8° × 0.4° area (about 55 km × 44 km) around 51.5° N. The two multiplicative hashes spread the
 * points evenly without random(), so every run is identical. Loads with its GiST index in about 1 s.
 * ---------------------------------------------------------------------------------------------- */
export const PLACES_SETUP = `
-- 20 000 invented points of interest, spread deterministically (no random())
CREATE TABLE places (
  id   int PRIMARY KEY,
  kind text NOT NULL,
  geom geometry(Point, 4326) NOT NULL
);
INSERT INTO places
SELECT i,
       (ARRAY['cafe', 'shop', 'pharmacy', 'school', 'park'])[1 + i % 5],
       ST_Point(-0.5 + ((i * 7919) % 10007) / 10007.0 * 0.8,
                51.3 + ((i * 104729) % 9973) / 9973.0 * 0.4, 4326)
FROM generate_series(1, 20000) AS i;
CREATE INDEX places_geom_gist ON places USING gist (geom);
ANALYZE places;`
