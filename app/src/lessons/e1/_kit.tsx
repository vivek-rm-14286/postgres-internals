import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { tone, toneBg, type Tone } from '../../viz/kit'

/* Shared helpers for the pgvector module. No lesson export here. */

/** Deterministic PRNG (mulberry32) so every visual is reproducible. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** Standard normal from a uniform PRNG (Box-Muller). */
export const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r())

export type P2 = [number, number]
export const l2 = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1])
export const l2sq = (a: P2, b: P2) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2

/** Stat tile in the style of the reference lessons. */
export function Tile({ label, value, t, sub }: { label: string; value: ReactNode; t?: Tone; sub?: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted uppercase">{label}</p>
      <motion.p key={String(value)} initial={{ opacity: 0.3, y: 2 }} animate={{ opacity: 1, y: 0 }}
        className="font-mono text-lg font-bold" style={t ? { color: tone(t) } : undefined}>{value}</motion.p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

/** Labelled range slider. */
export function Slider({ label, value, min, max, step = 1, onChange, fmt, testid }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string; testid?: string
}) {
  return (
    <label className="flex w-full items-center gap-2 text-xs sm:w-auto sm:min-w-[220px] sm:flex-1">
      <span className="shrink-0 font-mono text-muted">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} data-testid={testid}
        onChange={(e) => onChange(+e.target.value)} className="min-w-16 flex-1 accent-[var(--accent)]" aria-label={label} />
      <span className="w-12 shrink-0 text-right font-mono font-semibold tabular-nums">{fmt ? fmt(value) : value}</span>
    </label>
  )
}

/** Primary action button (carries the smoke-test id when asked). */
export function Btn({ children, onClick, primary, testid, disabled }: { children: ReactNode; onClick: () => void; primary?: boolean; testid?: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} data-testid={testid} disabled={disabled}
      className={primary
        ? 'rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40'
        : 'rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent disabled:opacity-40'}>
      {children}
    </button>
  )
}

/** Horizontal bar with an animated width. value in [0, max]. */
export function Bar({ value, max, t = 'accent', label, right }: { value: number; max: number; t?: Tone; label: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr_auto] items-center gap-2 text-xs">
      <span className="font-mono text-muted">{label}</span>
      <div className="h-4 overflow-hidden rounded bg-surface-2">
        <motion.div className="h-full rounded" initial={false} animate={{ width: `${Math.max(0.6, (100 * value) / max)}%` }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }} style={{ background: toneBg(t, 55), borderRight: `2px solid ${tone(t)}` }} />
      </div>
      <span className="w-20 text-right font-mono font-semibold tabular-nums">{right}</span>
    </div>
  )
}

/** Monospace snippet block. */
export function Sql({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-lg border border-line bg-code px-3 py-2 font-mono text-[11.5px] leading-[18px] whitespace-pre scrollbar-thin">{children}</pre>
}

/* ------------------------------------------------------------------------------------------------
 * Playground datasets. Every generator is a single INSERT … SELECT with GROUP BY (no correlated
 * subqueries), so 10 000 × 32-d rows load in about 0.3 s. setseed() makes the data reproducible.
 * Rows are clustered around 40 random "topic" centres: uniform random vectors would make every
 * distance look alike and give misleadingly bad recall.
 * ---------------------------------------------------------------------------------------------- */

export const ITEMS_SETUP = `
SELECT setseed(0.42);
-- 40 topic centres in 32 dimensions
CREATE TABLE topics AS
  SELECT t AS topic, array_agg(random() * 2 - 1 ORDER BY j)::real[] AS center
  FROM generate_series(0, 39) t, generate_series(1, 32) j
  GROUP BY t;
-- 10 000 items: each one is its topic centre plus noise
CREATE TABLE items (
  id        int PRIMARY KEY,
  topic     int NOT NULL,
  region    int NOT NULL,
  category  int NOT NULL,
  embedding vector(32)
);
INSERT INTO items
  SELECT i, t.topic, t.topic % 4, floor(random() * 10)::int,
         array_agg(t.center[j] + random() - 0.5 ORDER BY j)::vector(32)
  FROM generate_series(1, 10000) i
  JOIN topics t ON t.topic = i % 40
  CROSS JOIN generate_series(1, 32) j
  GROUP BY i, t.topic;
-- 20 query vectors, drawn the same way
CREATE TABLE queries AS
  SELECT q AS qid, t.topic, array_agg(t.center[j] + random() - 0.5 ORDER BY j)::vector(32) AS v
  FROM generate_series(1, 20) q
  JOIN topics t ON t.topic = (q * 7) % 40
  CROSS JOIN generate_series(1, 32) j
  GROUP BY q, t.topic;
-- exact top-10 for every query, computed before any vector index exists
CREATE TABLE truth AS
  SELECT q.qid, n.id
  FROM queries q, LATERAL (SELECT id FROM items ORDER BY embedding <-> q.v LIMIT 10) n;
-- recall@10 of whatever plan the planner picks right now
CREATE VIEW recall AS
  SELECT round(avg(hit) / 10.0, 3) AS recall_at_10, round(avg(n), 1) AS avg_rows
  FROM queries q, LATERAL (
    SELECT count(*) AS n,
           count(*) FILTER (WHERE a.id IN (SELECT id FROM truth t WHERE t.qid = q.qid)) AS hit
    FROM (SELECT id FROM items ORDER BY embedding <-> q.v LIMIT 10) a) x;
ANALYZE;`
