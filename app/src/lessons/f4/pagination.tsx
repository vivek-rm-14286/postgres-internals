import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg } from '../../viz/kit'
import { Btn, Caption, ResultTable, Stat, type ResultRow } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one B-tree index on (created_at DESC, id DESC) over 100 000 events, drawn as a strip of
 * 100 cells (1 000 entries each). OFFSET walks the strip from the start and throws rows away; keyset
 * descends the tree straight to the last key it saw. Buffer counts are from EXPLAIN (ANALYZE, BUFFERS)
 * on the playground schema, page size 10.
 * ---------------------------------------------------------------------------------------------- */

const PAGES = [1, 10, 100, 1000, 5000, 10000] as const
type Page = (typeof PAGES)[number]
const OFFSET_BUF: Record<Page, number> = { 1: 4, 10: 5, 100: 15, 1000: 125, 5000: 612, 10000: 1210 }
const KEYSET_BUF = 4
const TOTAL = 100_000
const fmt = (n: number) => n.toLocaleString('en-US')

type Mode = 'offset' | 'keyset'
const W = 600, STRIP_Y = 92, STRIP_H = 26

function IndexStrip({ mode, page }: { mode: Mode; page: Page }) {
  const offset = (page - 1) * 10
  const x = 10 + (offset / TOTAL) * (W - 20)
  const leafX = mode === 'offset' ? 10 : x
  // tiny tree: root, a level of internal pages, the leaf strip
  const internals = [0, 1, 2, 3, 4].map((i) => 10 + (i + 0.5) * ((W - 20) / 5))
  const hitInternal = internals.reduce((best, cx) => (Math.abs(cx - leafX) < Math.abs(best - leafX) ? cx : best), internals[0])
  return (
    <svg viewBox={`0 0 ${W} 162`} className="w-full min-w-[420px]" role="img" aria-label="Index strip with the rows each strategy reads">
      {/* tree */}
      <rect x={W / 2 - 30} y={6} width={60} height={20} rx={4} fill={toneBg('header', 18)} stroke={tone('header')} />
      <text x={W / 2} y={20} textAnchor="middle" fontSize={10.5} fontFamily="var(--font-mono)" fill="var(--text)">root</text>
      {internals.map((cx) => (
        <g key={cx}>
          <line x1={W / 2} y1={26} x2={cx} y2={44} stroke="var(--muted)" strokeWidth={1} opacity={0.5} />
          <rect x={cx - 22} y={44} width={44} height={18} rx={4} fill={toneBg('header', cx === hitInternal ? 30 : 10)} stroke={tone('header')} strokeWidth={cx === hitInternal ? 1.8 : 1} />
        </g>
      ))}
      {/* descent path */}
      <motion.path initial={false} animate={{ d: `M ${W / 2} 26 L ${hitInternal} 44 M ${hitInternal} 62 L ${leafX} ${STRIP_Y}` }}
        stroke={tone('accent')} strokeWidth={2.4} fill="none" transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      {/* leaf strip: 100 cells */}
      {Array.from({ length: 100 }, (_, i) => (
        <rect key={i} x={10 + i * ((W - 20) / 100)} y={STRIP_Y} width={(W - 20) / 100 - 0.6} height={STRIP_H} fill={toneBg('muted', 14)} />
      ))}
      {/* rows read and discarded (OFFSET only) */}
      <motion.rect initial={false} x={10} y={STRIP_Y} height={STRIP_H}
        animate={{ width: mode === 'offset' ? Math.max(0, x - 10) : 0 }} transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        fill={toneBg('dead', 45)} stroke={tone('dead')} strokeWidth={mode === 'offset' && offset > 0 ? 1 : 0} />
      {/* the 10 rows returned */}
      <motion.rect initial={false} y={STRIP_Y - 4} width={4} height={STRIP_H + 8} rx={1}
        animate={{ x: x - 1 }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} fill={tone('new')} />
      <text x={10} y={STRIP_Y + STRIP_H + 18} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">newest</text>
      <text x={W - 10} y={STRIP_Y + STRIP_H + 18} textAnchor="end" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">oldest (row 100 000)</text>
      <motion.text initial={false} animate={{ x: Math.min(Math.max(x, 70), W - 70) }} y={STRIP_Y + STRIP_H + 32} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={tone('new')} fontFamily="var(--font-mono)">
        page {fmt(page)}
      </motion.text>
    </svg>
  )
}

function BufferBars({ page }: { page: Page }) {
  const max = OFFSET_BUF[10000]
  return (
    <div className="grid gap-1">
      {PAGES.map((p) => (
        <div key={p} className={`grid grid-cols-[84px_1fr] items-center gap-2 rounded px-1 ${p === page ? 'bg-surface-2' : ''}`}>
          <span className={`font-mono text-[11px] ${p === page ? 'font-bold' : 'text-muted'}`}>page {fmt(p)}</span>
          <div className="grid gap-0.5">
            <div className="flex items-center gap-1.5">
              <motion.div initial={false} animate={{ width: `${Math.max(0.6, (OFFSET_BUF[p] / max) * 82)}%` }} className="h-2.5 rounded-sm" style={{ background: toneBg('dead', 55) }} />
              <span className="font-mono text-[10.5px] tabular-nums" style={{ color: tone.text('dead') }}>{fmt(OFFSET_BUF[p])}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 rounded-sm" style={{ width: `${(KEYSET_BUF / max) * 82}%`, minWidth: 3, background: toneBg('ok', 70) }} />
              <span className="font-mono text-[10.5px] tabular-nums" style={{ color: tone.text('ok') }}>{KEYSET_BUF}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* Page drift: page size 4 for space. Events e97..e100 exist; then e101 arrives between two page loads. */
function DriftDemo() {
  const [arrived, setArrived] = useState(false)
  const all = arrived ? [101, 100, 99, 98, 97, 96, 95, 94, 93] : [100, 99, 98, 97, 96, 95, 94, 93]
  const page1 = [100, 99, 98, 97]
  const offsetPage2 = all.slice(4, 8)
  const keysetPage2 = all.filter((n) => n < 97).slice(0, 4)
  const row = (n: number, dup: boolean): ResultRow => ({ key: `e${n}`, cells: [`e${n}`, dup ? 'seen on page 1' : ''], t: dup ? 'dead' : undefined })
  return (
    <Panel title="Page drift: a new row arrives between two page loads">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Btn onClick={() => setArrived((a) => !a)}>{arrived ? 'Undo the new event' : 'A new event e101 arrives'}</Btn>
        <span className="text-xs text-muted">page size 4, newest first</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ResultTable compact caption="page 1 (already shown)" fields={['event', '']} rows={page1.map((n) => row(n, false))} />
        <ResultTable compact caption="page 2 · OFFSET 4" fields={['event', '']} rows={offsetPage2.map((n) => row(n, page1.includes(n)))} />
        <ResultTable compact caption="page 2 · after e97" fields={['event', '']} rows={keysetPage2.map((n) => row(n, false))} />
      </div>
      <p className="mt-2 text-xs text-muted">{arrived
        ? 'OFFSET counts positions, and every position just shifted by one, so e97 is served twice. The keyset cursor names a row, not a position, so it continues at e96.'
        : 'Both strategies agree while nothing changes. Add a row and load page 2 again.'}</p>
    </Panel>
  )
}

function PaginationViz() {
  const [mode, setMode] = useState<Mode>('offset')
  const [pi, setPi] = useState(0)
  const page = PAGES[pi]
  const offset = (page - 1) * 10
  const read = mode === 'offset' ? offset + 10 : 10
  const bufs = mode === 'offset' ? OFFSET_BUF[page] : KEYSET_BUF
  const text = mode === 'offset'
    ? page === 1
      ? '`LIMIT 10 OFFSET 0`: descend to the newest entry, read 10 rows, stop. Page 1 is cheap with either strategy.'
      : `\`LIMIT 10 OFFSET ${fmt(offset)}\`: the scan starts at the newest entry and **produces ${fmt(offset)} rows only to throw them away** (red), then returns 10. Cost grows linearly with the page number.`
    : `\`WHERE (created_at, id) < ($last_ts, $last_id)\`: one **index descent** straight to the last row the client saw, then read 10 rows. Page ${fmt(page)} costs the same ${KEYSET_BUF} buffers as page 1.`
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Strategy" value={mode} onChange={setMode} options={[['offset', 'OFFSET'], ['keyset', 'Keyset (seek)']]} />
        <Btn primary testid="viz-next" onClick={() => setPi((i) => (i + 1) % PAGES.length)}>{pi === PAGES.length - 1 ? 'Back to page 1' : 'Go deeper'}</Btn>
        <div className="flex flex-wrap gap-1">
          {PAGES.map((p, i) => (
            <button key={p} type="button" onClick={() => setPi(i)} className={`rounded-md px-2 py-1 font-mono text-[11px] ${i === pi ? 'bg-accent text-on-accent' : 'border border-line text-muted hover:text-ink'}`}>{fmt(p)}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Rows read" value={fmt(read)} t={mode === 'offset' && offset > 0 ? 'dead' : 'ok'} />
        <Stat label="Rows returned" value="10" />
        <Stat label="Shared buffers" value={fmt(bufs)} t={mode === 'offset' && bufs > 20 ? 'dead' : 'ok'} />
        <Stat label="Thrown away" value={fmt(mode === 'offset' ? offset : 0)} t={mode === 'offset' && offset > 0 ? 'dead' : 'muted'} />
      </div>
      <Caption k={`${mode}-${page}`} text={text} />
      <Legend items={[['header', 'B-tree pages'], ['accent', 'descent'], ['dead', 'read, then discarded'], ['new', 'the 10 rows returned']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin"><IndexStrip mode={mode} page={page} /></div>
      <Panel title="Shared buffers per request (red OFFSET, green keyset)"><BufferBars page={page} /></Panel>
      <DriftDemo />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'pagination',
  module: 'f4',
  order: 1,
  title: 'Pagination: OFFSET vs keyset',
  tldr: [
    '**Keyset pagination** fetches the next page with `WHERE (created_at, id) < ($last_ts, $last_id) ORDER BY created_at DESC, id DESC LIMIT n`, so it seeks to where the previous page ended instead of counting rows from the start.',
    '`OFFSET n` must produce and discard n rows on every request, so deep pages get linearly slower and shift when rows are inserted, while a keyset page costs the same at page 10 000 as at page 1.',
  ],
  visualizer: {
    title: 'Skipping rows vs seeking to a key',
    caption: 'Press **Go deeper** to jump from page 1 to page 10 000, then switch to **Keyset** and compare rows read and buffers. Below, add a row between two page loads and watch OFFSET serve a duplicate.',
    Component: PaginationViz,
  },
  playground: {
    setup: `
CREATE TABLE events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL,
  user_id int NOT NULL,
  title text NOT NULL);
-- 100 000 events, three per minute, so created_at alone is NOT unique
INSERT INTO events (created_at, user_id, title)
SELECT timestamptz '2026-01-01 00:00+00' + (g / 3) * interval '1 minute', g % 500, 'event #' || g
FROM generate_series(1, 100000) g;
CREATE INDEX events_created_id ON events (created_at DESC, id DESC);
VACUUM ANALYZE events;`,
    presets: [
      { label: 'OFFSET: page 1 vs page 5 000', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id, created_at, title FROM events
ORDER BY created_at DESC, id DESC
LIMIT 10 OFFSET 0;

EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id, created_at, title FROM events
ORDER BY created_at DESC, id DESC
LIMIT 10 OFFSET 49990;`,
        note: 'Both use the index in order. Page 1 touches about 4 buffers. Page 5 000 shows the Index Scan with **actual rows=50000** under a Limit that returns 10: every skipped row was fetched, about 600 buffers.' },
      { label: 'Keyset: seek to the last row seen', sql: `-- the last row of page 4 999 was (2026-01-12 13:50:00+00, id 50011)
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT id, created_at, title FROM events
WHERE (created_at, id) < ('2026-01-12 13:50:00+00', 50011)
ORDER BY created_at DESC, id DESC
LIMIT 10;

SELECT id, created_at, title FROM events
WHERE (created_at, id) < ('2026-01-12 13:50:00+00', 50011)
ORDER BY created_at DESC, id DESC
LIMIT 10;`,
        note: 'The row comparison becomes an **Index Cond**: one descent, 10 rows, about 4 buffers. Same rows as OFFSET 49990, at roughly 1/150 of the work.' },
      { label: 'Why the tiebreaker matters', sql: `-- three events share each timestamp; compare three "next page" filters
SELECT 'row comparison' AS filter, count(*) AS rows_after_cursor
FROM events WHERE (created_at, id) < ('2026-01-12 13:50:00+00', 50011)
UNION ALL
SELECT 'created_at only', count(*)
FROM events WHERE created_at < '2026-01-12 13:50:00+00'
UNION ALL
SELECT 'created_at AND id', count(*)
FROM events WHERE created_at < '2026-01-12 13:50:00+00' AND id < 50011;

SELECT id, created_at FROM events
WHERE created_at = '2026-01-12 13:50:00+00' ORDER BY id DESC;`,
        note: 'The row comparison keeps **50 010** rows. `created_at` alone silently drops id 50010, which shares the cursor\'s timestamp, and the AND version drops it too (and, with other data, many more). Always end the sort key with a unique column, and compare with a row constructor, not with a hand-written AND.' },
      { label: 'Previous page (seek backwards)', sql: `-- page before the cursor row (2026-01-12 13:50:00+00, 50011): flip the comparison and the order, then flip back
EXPLAIN (COSTS OFF)
SELECT * FROM (
  SELECT id, created_at, title FROM events
  WHERE (created_at, id) > ('2026-01-12 13:50:00+00', 50011)
  ORDER BY created_at, id
  LIMIT 10) p
ORDER BY created_at DESC, id DESC;

SELECT * FROM (
  SELECT id, created_at, title FROM events
  WHERE (created_at, id) > ('2026-01-12 13:50:00+00', 50011)
  ORDER BY created_at, id
  LIMIT 10) p
ORDER BY created_at DESC, id DESC;`,
        note: 'The inner query walks the same index **backward** (`Index Scan Backward`), so one index serves both directions. The outer sort only reorders 10 rows.' },
      { label: 'Page drift with OFFSET', sql: `CREATE TEMP TABLE page1 AS
SELECT id FROM events ORDER BY created_at DESC, id DESC LIMIT 10;

-- a new event arrives before the user clicks "next"
INSERT INTO events (created_at, user_id, title) VALUES ('2026-02-01 00:00+00', 1, 'late arrival');

SELECT e.id, e.title, e.id IN (SELECT id FROM page1) AS already_seen
FROM events e ORDER BY created_at DESC, id DESC LIMIT 10 OFFSET 10;

DELETE FROM events WHERE title = 'late arrival';
DROP TABLE page1;`,
        note: 'The first row of page 2 has `already_seen = true`: the insert pushed every row one position down. With deletes the opposite happens and a row is skipped. Keyset pages cannot drift.' },
      { label: 'Totals: exact vs estimate', sql: `EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, TIMING OFF)
SELECT count(*) FROM events;

SELECT reltuples::bigint AS estimated_rows FROM pg_class WHERE relname = 'events';

-- "is there a next page?" without counting: ask for one extra row
SELECT
  (SELECT count(*) > 10 FROM (SELECT 1 FROM events
     WHERE (created_at, id) < ('2026-01-12 13:50:00+00', 50011)
     ORDER BY created_at DESC, id DESC LIMIT 11) s) AS has_next_mid,
  (SELECT count(*) > 10 FROM (SELECT 1 FROM events
     WHERE (created_at, id) < ('2026-01-01 00:03:00+00', 11)
     ORDER BY created_at DESC, id DESC LIMIT 11) s) AS has_next_last_page;`,
        note: 'An exact `count(*)` reads the whole table or index on every request. `reltuples` is free and maintained by VACUUM and ANALYZE. Fetching `LIMIT n + 1` answers "has next" exactly: true in the middle of the feed, false on the last page (only ids 1 to 10 remain).' },
      { label: 'Cursor (inside one transaction)', sql: `BEGIN;
DECLARE feed CURSOR FOR
  SELECT id, created_at, title FROM events ORDER BY created_at DESC, id DESC;
FETCH 5 FROM feed;
FETCH 5 FROM feed;
CLOSE feed;
COMMIT;`,
        note: 'A cursor keeps its position on the server, so the second FETCH continues where the first stopped. Unless declared `WITH HOLD`, it lives only inside the transaction: good for exports and batch jobs, not for stateless web pages.' },
    ],
  },
  production: {
    title: 'An activity feed API that timed out on deep pages',
    context: 'A collaboration app serves `GET /feed?page=N` with `ORDER BY created_at DESC LIMIT 50 OFFSET (N-1)*50` over a 40 M row events table. Most users read page 1. Crawlers and export scripts walk to the end.',
    problem: 'Each deep page re-reads every row before it, so walking the feed is quadratic: a client fetching all 800 000 pages makes the server produce about 50 × 800 000² / 2 ≈ 16 trillion rows to deliver 40 million. Users also report duplicated and missing items, because new events shift OFFSET positions while they scroll.',
    solution: 'Replace the page number with an opaque **cursor** holding the last `(created_at, id)`. Make the sort key unique by adding `id`. Back it with one index in the same column order. Return `next_cursor` from the API and fetch `LIMIT 51` to know whether there is a next page.',
    sql: `CREATE INDEX CONCURRENTLY events_created_id ON events (created_at DESC, id DESC);

-- first page
SELECT id, created_at, title FROM events
ORDER BY created_at DESC, id DESC LIMIT 51;

-- next page: cursor = last row of the previous response
SELECT id, created_at, title FROM events
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC LIMIT 51;`,
    outcome: 'Every page costs one index descent plus 51 rows, whatever its depth. On the playground table page 10 000 drops from 1 210 shared buffers to 4, and duplicated or skipped items disappear because the cursor names a row rather than a position.',
  },
  pitfalls: [
    { title: 'A sort key that is not unique',
      symptom: 'Rows appear twice or never when paging, even with keyset pagination.',
      cause: 'Rows that tie on the sort key have no defined order. With `WHERE created_at < $last`, every row sharing the last timestamp is skipped.',
      fix: 'Append a unique column (the primary key) to both the ORDER BY and the cursor, and index the same columns in the same order.',
      sql: `WHERE (created_at, id) < ($last_ts, $last_id)
ORDER BY created_at DESC, id DESC` },
    { title: 'Hand-expanding the row comparison',
      symptom: 'Pages silently lose rows after the first one.',
      cause: '`a < $1 AND b < $2` is not the same as `(a, b) < ($1, $2)`. The row form compares left to right and stops at the first unequal pair, so it is `a < $1 OR (a = $1 AND b < $2)`.',
      fix: 'Use the row constructor. It is also what lets the planner use the multicolumn index as a single range.' },
    { title: 'Mixed sort directions',
      symptom: '`ORDER BY score DESC, id ASC` cannot be expressed as one row comparison, and the query falls back to a sort.',
      cause: 'A row comparison applies one operator to every column. A mixed-direction order needs `<` on one column and `>` on another.',
      fix: 'Pick one direction for all keyset columns when you can. Otherwise write the expanded `OR` form and index `(score DESC, id ASC)` to match.' },
    { title: 'An exact total on every request',
      symptom: 'The first page is slow even though it returns only 50 rows.',
      cause: '`SELECT count(*)` has to visit every row (or every index entry) on each request.',
      fix: 'Show "more results" with `LIMIT n + 1`, or an estimate from `pg_class.reltuples` or `EXPLAIN`. Compute exact totals asynchronously if the product really needs them.' },
  ],
  pointers: [
    '`OFFSET n` still **computes and discards** n rows. The cost grows with page depth.',
    'Keyset = **unique sort key** + **row comparison** `(a, b) < ($1, $2)` + an **index in the same order**.',
    'Offsets drift when rows are inserted or deleted between requests. A keyset cursor names a row and cannot drift.',
    'Use `LIMIT n + 1` for "has next page", and `reltuples` for an approximate total.',
    '**Going deeper:** [Index design](/m4/index-design) covers multicolumn order and why the index must match the ORDER BY.',
  ],
  sources: ['queries-limit.html', 'sql-select.html', 'functions-comparisons.html', 'indexes-multicolumn.html', 'indexes-ordering.html', 'sql-declare.html', 'sql-fetch.html', 'using-explain.html', 'planner-stats.html', 'functions-aggregate.html'],
}
