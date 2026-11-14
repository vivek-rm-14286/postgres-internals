/* A small, faithful HNSW (Malkov & Yashunin) over 2-D points, used by the HNSW lesson visualizer.
 * Same algorithm as pgvector: random level per node with mL = 1/ln(m), greedy descent with ef = 1
 * on the upper layers, a beam search with ef_construction while inserting and ef_search while
 * querying, the neighbour-selection heuristic, at most m links per node on upper layers and 2·m on
 * layer 0. No lesson export here. */
import { l2sq, rng, gauss, type P2 } from './_kit'

export interface Graph { pts: P2[]; level: number[]; links: number[][][]; entry: number; top: number; m: number }

export function makePoints(n: number, seed: number): P2[] {
  const r = rng(seed)
  const centres: P2[] = [[0.2, 0.25], [0.75, 0.2], [0.5, 0.55], [0.18, 0.78], [0.82, 0.75]]
  const out: P2[] = []
  for (let i = 0; i < n; i++) {
    if (i % 6 === 5) { out.push([0.05 + r() * 0.9, 0.05 + r() * 0.9]); continue }
    const c = centres[i % centres.length]
    out.push([Math.min(0.97, Math.max(0.03, c[0] + gauss(r) * 0.08)), Math.min(0.97, Math.max(0.03, c[1] + gauss(r) * 0.08))])
  }
  return out
}

/** Beam search on one layer. Returns the ef closest found, plus a trace of expansions. */
export function searchLayer(g: Graph, q: P2, eps: number[], ef: number, layer: number) {
  const d = (i: number) => l2sq(g.pts[i], q)
  const visited = new Set(eps)
  let cand = [...eps]
  let W = [...eps].sort((a, b) => d(a) - d(b))
  const trace: { expanded: number; found: number[]; W: number[] }[] = []
  while (cand.length) {
    cand.sort((a, b) => d(a) - d(b))
    const c = cand.shift()!
    if (d(c) > d(W[W.length - 1])) break
    const found: number[] = []
    for (const e of g.links[c][layer] ?? []) {
      if (visited.has(e)) continue
      visited.add(e)
      if (W.length < ef || d(e) < d(W[W.length - 1])) {
        cand.push(e); W.push(e); W.sort((a, b) => d(a) - d(b)); found.push(e)
        if (W.length > ef) W = W.slice(0, ef)
      }
    }
    trace.push({ expanded: c, found, W: [...W] })
  }
  return { W, trace, visited }
}

/** Neighbour-selection heuristic: keep a candidate only if it is closer to q than to every kept one. */
function selectNeighbours(pts: P2[], q: P2, cands: number[], m: number) {
  const sorted = [...new Set(cands)].sort((a, b) => l2sq(pts[a], q) - l2sq(pts[b], q))
  const keep: number[] = []
  for (const c of sorted) {
    if (keep.length >= m) break
    if (keep.every((k) => l2sq(pts[c], q) < l2sq(pts[c], pts[k]))) keep.push(c)
  }
  for (const c of sorted) { if (keep.length >= m) break; if (!keep.includes(c)) keep.push(c) }
  return keep
}

export function build(pts: P2[], m: number, efConstruction: number, maxLevel: number, seed: number): Graph {
  const r = rng(seed)
  const mL = 1 / Math.log(m)
  const g: Graph = { pts, level: [], links: [], entry: 0, top: 0, m }
  pts.forEach((p, i) => {
    const lvl = Math.min(maxLevel, Math.floor(-Math.log(r() || 1e-9) * mL))
    g.level[i] = lvl
    g.links[i] = Array.from({ length: lvl + 1 }, () => [])
    if (i === 0) { g.entry = 0; g.top = lvl; return }
    let ep = g.entry
    for (let lc = g.top; lc > lvl; lc--) ep = searchLayer(g, p, [ep], 1, lc).W[0]
    for (let lc = Math.min(lvl, g.top); lc >= 0; lc--) {
      const { W } = searchLayer(g, p, [ep], efConstruction, lc)
      const maxLinks = lc === 0 ? 2 * m : m
      const nb = selectNeighbours(pts, p, W, m)
      g.links[i][lc] = nb
      for (const e of nb) {
        const l = g.links[e][lc]
        l.push(i)
        if (l.length > maxLinks) g.links[e][lc] = selectNeighbours(pts, pts[e], l, maxLinks)
      }
      ep = W[0]
    }
    if (lvl > g.top) { g.top = lvl; g.entry = i }
  })
  return g
}

export interface QueryTrace {
  /** Greedy hops per upper layer, top first: [layer, nodes visited in order]. */
  upper: { layer: number; path: number[] }[]
  /** Layer-0 beam search expansions. */
  base: { expanded: number; found: number[]; W: number[] }[]
  result: number[]
  distCalcs: number
}

export function query(g: Graph, q: P2, efSearch: number): QueryTrace {
  let ep = g.entry
  const upper: QueryTrace['upper'] = []
  let calcs = 1
  for (let lc = g.top; lc > 0; lc--) {
    const path = [ep]
    // greedy: move to the closest neighbour until none is closer
    for (;;) {
      let best = ep
      for (const e of g.links[ep][lc]) { calcs++; if (l2sq(g.pts[e], q) < l2sq(g.pts[best], q)) best = e }
      if (best === ep) break
      ep = best; path.push(ep)
    }
    upper.push({ layer: lc, path })
  }
  const s = searchLayer(g, q, [ep], efSearch, 0)
  calcs += s.visited.size
  return { upper, base: s.trace, result: s.W, distCalcs: calcs }
}
