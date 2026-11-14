/**
 * A small, faithful model of PostgreSQL range semantics (bound comparison, canonical form of discrete
 * ranges, the range operators, and multirange union / difference), used by the ranges visualizer.
 * It mirrors rangetypes.c: lower/upper bounds compare by value, then by inclusivity.
 * Checked against PostgreSQL 18 on thousands of random int4range and numrange pairs.
 */

export type Kind = 'int' | 'num'
/** A null value is an infinite (unbounded) side. */
export interface Rng { empty: boolean; lo: number | null; hi: number | null; loInc: boolean; hiInc: boolean }
interface Bound { v: number | null; inc: boolean; lower: boolean }

export const EMPTY: Rng = { empty: true, lo: null, hi: null, loInc: false, hiInc: false }

/** Build a range like the constructor would: canonicalize discrete ranges to [), detect empty ranges. */
export function mk(kind: Kind, lo: number | null, hi: number | null, loInc: boolean, hiInc: boolean): Rng {
  if (lo === null) loInc = false
  if (hi === null) hiInc = false
  if (kind === 'int') {
    if (lo !== null && !loInc) { lo += 1; loInc = true }
    if (hi !== null && hiInc) { hi += 1; hiInc = false }
    if (lo !== null && hi !== null && lo >= hi) return EMPTY
  } else if (lo !== null && hi !== null && lo === hi && !(loInc && hiInc)) return EMPTY
  return { empty: false, lo, hi, loInc, hiInc }
}

const L = (r: Rng): Bound => ({ v: r.lo, inc: r.loInc, lower: true })
const U = (r: Rng): Bound => ({ v: r.hi, inc: r.hiInc, lower: false })

/** range_cmp_bounds */
function cmpB(b1: Bound, b2: Bound): number {
  if (b1.v === null && b2.v === null) return b1.lower === b2.lower ? 0 : b1.lower ? -1 : 1
  if (b1.v === null) return b1.lower ? -1 : 1
  if (b2.v === null) return b2.lower ? 1 : -1
  const r = Math.sign(b1.v - b2.v)
  if (r !== 0) return r
  if (!b1.inc && !b2.inc) return b1.lower === b2.lower ? 0 : b1.lower ? 1 : -1
  if (!b1.inc) return b1.lower ? 1 : -1
  if (!b2.inc) return b2.lower ? -1 : 1
  return 0
}

/** Upper bound of one range directly followed by the lower bound of another, with no gap and no overlap. */
function boundsAdjacent(kind: Kind, up: Bound, lo: Bound): boolean {
  if (up.v === null || lo.v === null) return false
  if (up.v === lo.v) return up.inc !== lo.inc
  if (kind === 'int' && up.v < lo.v) return mk('int', up.v, lo.v, !up.inc, !lo.inc).empty
  return false
}

export const overlaps = (a: Rng, b: Rng) => !a.empty && !b.empty &&
  ((cmpB(L(a), L(b)) >= 0 && cmpB(L(a), U(b)) <= 0) || (cmpB(L(b), L(a)) >= 0 && cmpB(L(b), U(a)) <= 0))
export const contains = (a: Rng, b: Rng) => b.empty || (!a.empty && cmpB(L(a), L(b)) <= 0 && cmpB(U(a), U(b)) >= 0)
export const before = (a: Rng, b: Rng) => !a.empty && !b.empty && cmpB(U(a), L(b)) < 0
export const after = (a: Rng, b: Rng) => !a.empty && !b.empty && cmpB(L(a), U(b)) > 0
export const overLeft = (a: Rng, b: Rng) => !a.empty && !b.empty && cmpB(U(a), U(b)) <= 0
export const overRight = (a: Rng, b: Rng) => !a.empty && !b.empty && cmpB(L(a), L(b)) >= 0
export const adjacent = (k: Kind, a: Rng, b: Rng) => !a.empty && !b.empty && (boundsAdjacent(k, U(a), L(b)) || boundsAdjacent(k, U(b), L(a)))
export const containsElem = (a: Rng, x: number) => !a.empty && cmpB(L(a), { v: x, inc: true, lower: true }) <= 0 && cmpB(U(a), { v: x, inc: true, lower: false }) >= 0

const fromBounds = (k: Kind, lo: Bound, hi: Bound) => mk(k, lo.v, hi.v, lo.inc, hi.inc)
const minB = (a: Bound, b: Bound) => (cmpB(a, b) <= 0 ? a : b)
const maxB = (a: Bound, b: Bound) => (cmpB(a, b) >= 0 ? a : b)

/** a + b; null means "result of range union would not be contiguous". */
export function union(k: Kind, a: Rng, b: Rng): Rng | null {
  if (a.empty) return b
  if (b.empty) return a
  if (!overlaps(a, b) && !adjacent(k, a, b)) return null
  return fromBounds(k, minB(L(a), L(b)), maxB(U(a), U(b)))
}

export function intersect(k: Kind, a: Rng, b: Rng): Rng {
  if (a.empty || b.empty || !overlaps(a, b)) return EMPTY
  return fromBounds(k, maxB(L(a), L(b)), minB(U(a), U(b)))
}

const flip = (b: Bound): Bound => ({ v: b.v, inc: !b.inc, lower: !b.lower })

/** a - b; null means "result of range difference would not be contiguous". */
export function minus(k: Kind, a: Rng, b: Rng): Rng | null {
  if (a.empty || b.empty) return a
  const l1l2 = cmpB(L(a), L(b)), l1u2 = cmpB(L(a), U(b)), u1l2 = cmpB(U(a), L(b)), u1u2 = cmpB(U(a), U(b))
  if (l1l2 < 0 && u1u2 > 0) return null
  if (l1u2 > 0 || u1l2 < 0) return a
  if (l1l2 >= 0 && u1u2 <= 0) return EMPTY
  if (l1l2 <= 0 && u1l2 >= 0 && u1u2 <= 0) return fromBounds(k, L(a), flip(L(b)))
  if (l1l2 >= 0 && u1u2 >= 0 && l1u2 <= 0) return fromBounds(k, flip(U(b)), U(a))
  return a
}

/** Sort and merge: the canonical form of a multirange. */
export function normalize(k: Kind, rs: Rng[]): Rng[] {
  const s = rs.filter((r) => !r.empty).sort((x, y) => cmpB(L(x), L(y)) || cmpB(U(x), U(y)))
  const out: Rng[] = []
  for (const r of s) {
    const last = out[out.length - 1]
    if (last && (overlaps(last, r) || adjacent(k, last, r))) out[out.length - 1] = union(k, last, r)!
    else out.push(r)
  }
  return out
}

/** Multirange difference a - b. */
export function mrMinus(k: Kind, a: Rng[], b: Rng[]): Rng[] {
  let cur = normalize(k, a)
  for (const r of normalize(k, b)) {
    const next: Rng[] = []
    for (const x of cur) {
      const d = minus(k, x, r)
      if (d === null) { // r sits strictly inside x: two pieces
        next.push(fromBounds(k, L(x), flip(L(r))), fromBounds(k, flip(U(r)), U(x)))
      } else if (!d.empty) next.push(d)
    }
    cur = normalize(k, next)
  }
  return cur
}

const num = (v: number) => String(v)
export function fmt(r: Rng): string {
  if (r.empty) return 'empty'
  return `${r.loInc ? '[' : '('}${r.lo === null ? '' : num(r.lo)},${r.hi === null ? '' : num(r.hi)}${r.hiInc ? ']' : ')'}`
}
export const fmtMr = (rs: Rng[]) => `{${rs.map(fmt).join(',')}}`
