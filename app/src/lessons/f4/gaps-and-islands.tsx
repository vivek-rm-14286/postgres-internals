import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Btn, Caption, Sql, Stat } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer, three modes.
 *  Islands:  the row_number difference trick on one user's March login days (stepper).
 *  Sessions: lag() gap > timeout starts a new session; a running sum numbers them (live slider).
 *  Ranges:   overlapping bookings merge with range_agg into a multirange (toggle bookings on/off).
 * Every value is computed the way the SQL computes it; the playground runs the same queries.
 * ---------------------------------------------------------------------------------------------- */

const DAYS = [1, 2, 3, 5, 6, 9, 10, 11, 12, 15]
const ISL_TONES: Tone[] = ['tuple', 'pointer', 'header', 'new']
const anchor = (d: number, rn: number) => d - rn
const anchors = [...new Set(DAYS.map((d, i) => anchor(d, i + 1)))]
const toneOf = (a: number) => ISL_TONES[anchors.indexOf(a) % ISL_TONES.length]
const mar = (d: number) => `03-${String(d).padStart(2, '0')}`
const feb = (d: number) => (d <= 0 ? `02-${28 + d}` : mar(d))

type IPhase = 'raw' | 'rn' | 'diff' | 'group' | 'agg'
const islandSteps: Step<IPhase>[] = [
  { title: 'Ten login days, some consecutive', body: 'A **streak** (island) is a run of consecutive days. A **gap** is the space between runs. Which runs are there, and how long is each?', state: 'raw' },
  { title: 'Number the rows in date order', body: '`row_number() OVER (PARTITION BY user_id ORDER BY day)` counts 1, 2, 3… without holes, while the days themselves have holes.', state: 'rn' },
  { title: 'Subtract: day − row_number', body: 'Inside a run both sides grow by 1 per row, so the difference stays **constant**. Every gap makes the day jump more than the counter, so the difference changes.', state: 'diff' },
  { title: 'The difference is the island id', body: 'Rows sharing the same anchor date belong to the same streak. The anchor itself is meaningless; only equality matters.', state: 'group' },
  { title: 'GROUP BY the anchor', body: '`min(day)`, `max(day)` and `count(*)` per anchor give each streak. Four islands: 3, 2, 4 and 1 days long.', state: 'agg' },
]

function IslandsView({ p }: { p: IPhase }) {
  const shown = p !== 'raw'
  const cols = DAYS.map((d, i) => ({ d, rn: i + 1, a: anchor(d, i + 1) }))
  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 96" className="w-full min-w-[480px]" role="img" aria-label="Calendar strip for March 1 to 16">
          {Array.from({ length: 16 }, (_, k) => {
            const d = k + 1, i = DAYS.indexOf(d), on = i >= 0
            const t: Tone | undefined = on && (p === 'group' || p === 'agg') ? toneOf(anchor(d, i + 1)) : undefined
            return (
              <g key={d} transform={`translate(${8 + k * 39},8)`}>
                <motion.rect width={35} height={34} rx={5} initial={false}
                  animate={{ fill: on ? (t ? toneBg(t, 35) : toneBg('accent', 18)) : 'transparent' }}
                  stroke={on ? (t ? tone(t) : tone('accent')) : 'var(--line)'} strokeDasharray={on ? undefined : '3 3'} />
                <text x={17.5} y={22} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill={on ? 'var(--text)' : 'var(--muted)'}>{d}</text>
                {on && shown && <motion.text initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} x={17.5} y={58} textAnchor="middle" fontSize={10.5} fontFamily="var(--font-mono)" fill="var(--muted)">rn {i + 1}</motion.text>}
                {on && (p === 'diff' || p === 'group' || p === 'agg') && (
                  <motion.text initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} x={17.5} y={78} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily="var(--font-mono)" fill={t ? tone(t) : 'var(--text)'}>{feb(anchor(d, i + 1))}</motion.text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      {(p === 'diff' || p === 'group') && (
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          {cols.map((c) => <span key={c.d} className="rounded border border-line px-1.5 py-0.5">{mar(c.d)} − {c.rn} = <b style={{ color: p === 'group' ? tone(toneOf(c.a)) : undefined }}>{feb(c.a)}</b></span>)}
        </div>
      )}
      {p === 'agg' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {anchors.map((a) => {
            const ds = cols.filter((c) => c.a === a).map((c) => c.d)
            return (
              <motion.div key={a} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg border px-2 py-1.5 font-mono text-[11.5px]" style={{ borderColor: tone(toneOf(a)), background: toneBg(toneOf(a), 14) }}>
                <div>{mar(ds[0])} → {mar(ds[ds.length - 1])}</div>
                <div className="font-bold">{ds.length} day{ds.length > 1 ? 's' : ''}</div>
              </motion.div>
            )
          })}
        </div>
      )}
      <Sql>{p === 'agg' || p === 'group' ? `SELECT min(day) AS first_day, max(day) AS last_day, count(*) AS days
FROM (SELECT day, day - (row_number() OVER (ORDER BY day))::int AS grp
      FROM logins WHERE user_id = 7) s
GROUP BY grp ORDER BY first_day;` : `SELECT day,
       row_number() OVER (ORDER BY day) AS rn,
       day - (row_number() OVER (ORDER BY day))::int AS grp
FROM logins WHERE user_id = 7;`}</Sql>
    </div>
  )
}

/* ---------------- sessions ---------------- */
const CLICKS = [0, 3, 7, 12, 50, 52, 58, 95, 140, 143, 147, 151, 200, 204]
const hhmm = (m: number) => `${String(9 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function SessionsView() {
  const [timeout, setTimeoutMin] = useState(30)
  const rows = useMemo(() => {
    let sid = 0
    return CLICKS.map((m, i) => {
      const gap = i === 0 ? null : m - CLICKS[i - 1]
      const isNew = gap === null || gap > timeout
      if (isNew) sid++
      return { m, gap, isNew, sid }
    })
  }, [timeout])
  const sessions = rows[rows.length - 1].sid
  const W = 640, X = (m: number) => 14 + (m / 210) * (W - 28)
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-muted">timeout
          <input type="range" min={3} max={60} value={timeout} onChange={(e) => setTimeoutMin(+e.target.value)} className="w-40 accent-[var(--accent)]" aria-label="Session timeout in minutes" />
          <span className="font-mono text-ink">{timeout} min</span>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Clicks" value={CLICKS.length} />
        <Stat label="Sessions" value={sessions} t="accent" />
        <Stat label="Avg clicks / session" value={(CLICKS.length / sessions).toFixed(1)} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox={`0 0 ${W} 92`} className="w-full min-w-[480px]" role="img" aria-label="Click timeline split into sessions">
          <line x1={14} x2={W - 14} y1={40} y2={40} stroke="var(--line)" />
          {Array.from(new Set(rows.map((r) => r.sid))).map((sid) => {
            const rs = rows.filter((r) => r.sid === sid)
            const t = ISL_TONES[(sid - 1) % ISL_TONES.length]
            return <motion.rect key={`s${sid}-${timeout}`} initial={{ opacity: 0 }} animate={{ opacity: 1, x: X(rs[0].m) - 7, width: X(rs[rs.length - 1].m) - X(rs[0].m) + 14 }} y={26} height={28} rx={8} fill={toneBg(t, 30)} stroke={tone(t)} />
          })}
          {rows.map((r) => <circle key={r.m} cx={X(r.m)} cy={40} r={4.5} fill={r.isNew ? tone('dead') : 'var(--text)'} />)}
          {rows.filter((r) => r.isNew).filter((r, k, arr) => k === 0 || r.m - arr[k - 1].m >= 14).map((r) => (
            <text key={`t${r.m}`} x={X(r.m)} y={72} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fill="var(--muted)">{hhmm(r.m)}</text>
          ))}
          {rows.filter((r) => r.isNew).map((r) => <text key={`n${r.m}`} x={X(r.m)} y={18} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily="var(--font-mono)" fill={tone('dead')}>s{r.sid}</text>)}
        </svg>
      </div>
      <div className="flex flex-wrap gap-1 font-mono text-[10.5px]">
        {rows.map((r) => (
          <span key={r.m} className="rounded border px-1.5 py-0.5" style={{ borderColor: r.isNew ? tone('dead') : 'var(--line)' }}>
            {hhmm(r.m)} gap {r.gap === null ? 'NULL' : r.gap} → {r.isNew ? 1 : 0}
          </span>
        ))}
      </div>
      <Caption k={String(sessions)} text={`A click starts a new session when \`lag(ts)\` is NULL or more than **${timeout} minutes** ago (flag = 1). A running \`sum(flag) OVER (ORDER BY ts)\` turns the flags into session numbers 1 to ${sessions}.`} />
      <Sql>{`SELECT ts, sum(is_new) OVER (PARTITION BY user_id ORDER BY ts) AS session_id
FROM (SELECT user_id, ts,
             CASE WHEN ts - lag(ts) OVER (PARTITION BY user_id ORDER BY ts)
                       <= interval '${timeout} minutes' THEN 0 ELSE 1 END AS is_new
      FROM clicks) s;`}</Sql>
    </div>
  )
}

/* ---------------- ranges ---------------- */
const BOOKINGS: [number, number][] = [[9, 10], [9.5, 11], [11, 12], [13, 14], [13.25, 13.75], [15.5, 16.5]]
const hm = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`

function RangesView() {
  const [on, setOn] = useState(BOOKINGS.map(() => true))
  const active = BOOKINGS.filter((_, i) => on[i]).sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [s, e] of active) {
    const last = merged[merged.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }
  const W = 640, X = (h: number) => 14 + ((h - 8.5) / 8.5) * (W - 28)
  const text = merged.length === 0 ? '{}' : `{${merged.map(([s, e]) => `[${hm(s)},${hm(e)})`).join(', ')}}`
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-1.5">
        {BOOKINGS.map(([s, e], i) => (
          <button key={i} type="button" onClick={() => setOn((o) => o.map((v, j) => (j === i ? !v : v)))}
            className="rounded-md border px-2 py-1 font-mono text-[11px]" style={{ borderColor: on[i] ? tone('tuple') : 'var(--line)', background: on[i] ? toneBg('tuple', 16) : undefined, color: on[i] ? undefined : 'var(--muted)' }}>
            [{hm(s)},{hm(e)})
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox={`0 0 ${W} 150`} className="w-full min-w-[480px]" role="img" aria-label="Bookings and their union">
          {[9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => (
            <g key={h}><line x1={X(h)} x2={X(h)} y1={8} y2={134} stroke="var(--line)" /><text x={X(h)} y={146} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--muted)">{h}:00</text></g>
          ))}
          {BOOKINGS.map(([s, e], i) => (
            <motion.rect key={i} initial={false} animate={{ opacity: on[i] ? 1 : 0.15 }} x={X(s)} width={X(e) - X(s)} y={10 + (i % 3) * 22} height={16} rx={3} fill={toneBg('tuple', 35)} stroke={tone('tuple')} />
          ))}
          <text x={14} y={92} fontSize={10} fontFamily="var(--font-mono)" fill="var(--muted)">range_agg</text>
          {merged.map(([s, e]) => (
            <motion.rect key={`${s}-${e}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} x={X(s)} width={X(e) - X(s)} y={98} height={22} rx={4} fill={toneBg('ok', 40)} stroke={tone('ok')} />
          ))}
        </svg>
      </div>
      <Caption k={text} text={`Room A: \`range_agg(during)\` = \`${text}\`. Overlapping **and adjacent** ranges (11:00 meets 11:00) fuse into one, so ${active.length} bookings collapse to ${merged.length} busy block${merged.length === 1 ? '' : 's'}. The gaps between blocks are the free slots.`} />
    </div>
  )
}

function GapsViz() {
  const [mode, setMode] = useState<'islands' | 'sessions' | 'ranges'>('islands')
  const sel = <Segmented label="Pattern" value={mode} onChange={setMode} options={[['islands', 'Streaks'], ['sessions', 'Sessions'], ['ranges', 'Merge ranges']]} />
  return (
    <div className="grid gap-3">
      {mode === 'islands'
        ? <Stepper steps={islandSteps} render={(p) => <IslandsView p={p} />} extra={sel} />
        : (
          <>
            <div className="flex flex-wrap items-center gap-2">{sel}<Btn primary testid="viz-next" onClick={() => setMode(mode === 'sessions' ? 'ranges' : 'islands')}>Next pattern</Btn></div>
            {mode === 'sessions' ? <SessionsView /> : <RangesView />}
          </>
        )}
      <Legend items={mode === 'ranges' ? [['tuple', 'booking'], ['ok', 'merged busy block']] : mode === 'sessions' ? [['dead', 'click that starts a session'], ['tuple', 'session 1'], ['pointer', 'session 2']] : [['accent', 'active day'], ['tuple', 'island 1'], ['pointer', 'island 2'], ['header', 'island 3'], ['new', 'island 4']]} />
      {mode === 'islands' && <Panel title="Also in this lesson"><p className="text-xs text-muted">Switch to <b>Sessions</b> to split clicks by an inactivity timeout, or <b>Merge ranges</b> to fuse overlapping bookings.</p></Panel>}
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'gaps-and-islands',
  module: 'f4',
  order: 4,
  title: 'Gaps and islands',
  tldr: [
    '**Gaps and islands** problems ask for runs of consecutive values (streaks, sessions, busy periods) and the holes between them, and window functions solve them in one pass.',
    'The tricks are `value − row_number()` (constant inside a run), `lag()` plus a running `sum` (a new group starts at every large gap), and `range_agg` for overlapping intervals.',
  ],
  visualizer: {
    title: 'Streaks, sessions and merged ranges',
    caption: 'Step through the **row_number difference** trick on one user\'s login days. Then drag the session timeout and watch sessions split and merge, and toggle bookings to see `range_agg` fuse them.',
    Component: GapsViz,
  },
  playground: {
    extensions: ['btree_gist'],
    setup: `
SET TimeZone = 'UTC';
-- one row per user per active day
CREATE TABLE logins (user_id int, day date, PRIMARY KEY (user_id, day));
INSERT INTO logins VALUES
  (7, '2026-03-01'), (7, '2026-03-02'), (7, '2026-03-03'), (7, '2026-03-05'), (7, '2026-03-06'),
  (7, '2026-03-09'), (7, '2026-03-10'), (7, '2026-03-11'), (7, '2026-03-12'), (7, '2026-03-15');
INSERT INTO logins
SELECT u, date '2026-01-01' + d
FROM generate_series(1, 300) u, generate_series(0, 89) d
WHERE u <> 7 AND abs(hashint4(u * 1000 + d)) % 10 < 7
ON CONFLICT DO NOTHING;
-- page clicks for sessionization
CREATE TABLE clicks (user_id int, ts timestamptz);
INSERT INTO clicks
SELECT 1, timestamptz '2026-03-02 09:00+00' + m * interval '1 minute'
FROM unnest(ARRAY[0, 3, 7, 12, 50, 52, 58, 95, 140, 143, 147, 151, 200, 204]) m;
-- 50 more users, 100 clicks each, in bursts of 8 clicks with a long pause after each burst
INSERT INTO clicks
SELECT u, timestamptz '2026-03-03 08:00+00' + (k * 4 + (k / 8) * 45 + u) * interval '1 minute'
FROM generate_series(2, 51) u, generate_series(0, 99) k;
-- room bookings
CREATE TABLE bookings (id int PRIMARY KEY, room text, during tstzrange);
INSERT INTO bookings VALUES
  (1, 'A', '[2026-03-02 09:00+00, 2026-03-02 10:00+00)'),
  (2, 'A', '[2026-03-02 09:30+00, 2026-03-02 11:00+00)'),
  (3, 'A', '[2026-03-02 11:00+00, 2026-03-02 12:00+00)'),
  (4, 'A', '[2026-03-02 13:00+00, 2026-03-02 14:00+00)'),
  (5, 'A', '[2026-03-02 13:15+00, 2026-03-02 13:45+00)'),
  (6, 'A', '[2026-03-02 15:30+00, 2026-03-02 16:30+00)');
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;`,
    presets: [
      { label: '1. Streaks: day − row_number', sql: `SELECT day,
       row_number() OVER (ORDER BY day) AS rn,
       day - (row_number() OVER (ORDER BY day))::int AS grp
FROM logins WHERE user_id = 7 ORDER BY day;

SELECT min(day) AS first_day, max(day) AS last_day, count(*) AS days
FROM (SELECT day, day - (row_number() OVER (ORDER BY day))::int AS grp
      FROM logins WHERE user_id = 7) s
GROUP BY grp ORDER BY first_day;`,
        note: '`grp` stays constant inside a run. Four streaks come out: 3, 2, 4 and 1 days, exactly the visualizer\'s islands. `date − integer` is a date, so the anchor is a date too.' },
      { label: '2. Longest streak per user', sql: `WITH runs AS (
  SELECT user_id, min(day) AS first_day, count(*) AS days
  FROM (SELECT user_id, day,
               day - (row_number() OVER (PARTITION BY user_id ORDER BY day))::int AS grp
        FROM logins) s
  GROUP BY user_id, grp)
SELECT DISTINCT ON (user_id) user_id, first_day, days AS longest_streak
FROM runs
ORDER BY user_id, days DESC, first_day
LIMIT 8;`,
        note: '`PARTITION BY user_id` restarts the numbering per user. `DISTINCT ON` keeps the longest run per user. One sort and one window pass over all 18 872 login rows; streak lengths vary from user to user.' },
      { label: '3. Gaps: the days in between', sql: `SELECT day + 1 AS gap_start, next_day - 1 AS gap_end, next_day - day - 1 AS missing_days
FROM (SELECT day, lead(day) OVER (ORDER BY day) AS next_day
      FROM logins WHERE user_id = 7) s
WHERE next_day > day + 1;

-- or list every missing value against a series
SELECT d::date AS missing
FROM generate_series(date '2026-03-01', date '2026-03-15', interval '1 day') d
EXCEPT SELECT day FROM logins WHERE user_id = 7
ORDER BY 1;`,
        note: '`lead()` pairs each day with the next one, so a gap is any step larger than 1: 03-04, 03-07..08 and 03-13..14. The `EXCEPT` form lists the five missing days one by one.' },
      { label: '4. Sessionize clicks (30 min)', sql: `SELECT ts, gap, is_new,
       sum(is_new) OVER (ORDER BY ts) AS session_id
FROM (SELECT ts, ts - lag(ts) OVER (ORDER BY ts) AS gap,
             CASE WHEN ts - lag(ts) OVER (ORDER BY ts) <= interval '30 minutes' THEN 0 ELSE 1 END AS is_new
      FROM clicks WHERE user_id = 1 AND ts < '2026-03-03') s
ORDER BY ts;`,
        note: 'The first click has a NULL gap, so the CASE falls through to 1. Five sessions, the same as the visualizer at 30 minutes. Try 10 or 60 minutes and compare with the slider.' },
      { label: '5. Sessions per user, all users', sql: `WITH flagged AS (
  SELECT user_id, ts,
         CASE WHEN ts - lag(ts) OVER w <= interval '30 minutes' THEN 0 ELSE 1 END AS is_new
  FROM clicks WINDOW w AS (PARTITION BY user_id ORDER BY ts)),
numbered AS (
  SELECT user_id, ts, sum(is_new) OVER (PARTITION BY user_id ORDER BY ts) AS session_id
  FROM flagged)
SELECT count(DISTINCT (user_id, session_id)) AS sessions,
       round(avg(clicks), 1) AS avg_clicks,
       max(len) AS longest_session
FROM (SELECT user_id, session_id, count(*) AS clicks, max(ts) - min(ts) AS len
      FROM numbered GROUP BY 1, 2) s;`,
        note: 'The same two-step pattern over 5 014 clicks: flag with `lag`, number with a running `sum`, then aggregate per (user, session). Result: 655 sessions of 7.7 clicks on average, the longest 28 minutes. A named `WINDOW` keeps the two window calls consistent.' },
      { label: '6. Merge overlapping bookings', sql: `SELECT room, range_agg(during) AS busy
FROM bookings GROUP BY room ORDER BY room;

-- which pairs overlap?
SELECT a.id, b.id, a.during * b.during AS overlap
FROM bookings a JOIN bookings b
  ON a.room = b.room AND a.id < b.id AND a.during && b.during;`,
        note: 'Room A collapses to three busy blocks, as in the visualizer: 09:00 to 12:00 (booking 3 is only adjacent, yet merges), 13:00 to 14:00 and 15:30 to 16:30. The `&&` self-join finds the two overlapping pairs, `*` gives the overlap.' },
      { label: '7. Forbid overlaps with EXCLUDE', sql: `DELETE FROM bookings WHERE id IN (2, 5);
ALTER TABLE bookings ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (room WITH =, during WITH &&);

SELECT try_sql($$INSERT INTO bookings VALUES (7, 'A', '[2026-03-02 09:45+00, 2026-03-02 10:15+00)')$$) AS overlapping,
       try_sql($$INSERT INTO bookings VALUES (8, 'A', '[2026-03-02 12:00+00, 2026-03-02 13:00+00)')$$) AS adjacent;`,
        note: 'With the overlaps removed, an **exclusion constraint** rejects any new booking that overlaps one in the same room (`23P01`). The adjacent slot is fine, because `[)` ranges that touch do not overlap. `btree_gist` provides `=` for the GiST index.' },
    ],
  },
  production: {
    title: 'Streak badges and session analytics for a learning app',
    context: 'A language-learning app awards badges for daily streaks and reports average session length. The first version ran a loop in application code over each user\'s activity, fetched row by row.',
    problem: 'The nightly job pulled 60 M activity rows over the network and took hours. A second job counted sessions with a fixed 30-minute window per hour bucket, which split sessions that crossed the hour and disagreed with the product definition.',
    solution: 'Compute both inside the database with window functions: the `day − row_number()` trick for streaks, and `lag` plus a running `sum` for sessions with a true inactivity timeout. Only the per-user results leave the database.',
    sql: `-- streaks that ended yesterday (users not yet active today)
SELECT user_id, count(*) AS streak_days
FROM (SELECT user_id, day,
             day - (row_number() OVER (PARTITION BY user_id ORDER BY day))::int AS grp
      FROM daily_activity) s
GROUP BY user_id, grp
HAVING max(day) = current_date - 1;`,
    outcome: 'Both jobs become one sort and one window pass per table, and only one row per user is transferred. Sessions now match the product rule exactly, because a session boundary is defined by the gap between events, not by the clock.',
  },
  pitfalls: [
    { title: 'Duplicate values break the difference trick',
      symptom: 'A streak is split, or a run appears shorter than it is.',
      cause: 'If a day appears twice, `row_number()` advances twice while the day does not, so the difference changes in the middle of a run.',
      fix: 'De-duplicate first (`SELECT DISTINCT user_id, day`), or use `dense_rank()` instead of `row_number()`.' },
    { title: 'Timestamps instead of days',
      symptom: 'Every login becomes its own island.',
      cause: 'The trick needs a step of exactly 1 between consecutive values. Timestamps are never exactly one unit apart.',
      fix: 'Reduce to the unit first: `ts::date` (or `date_trunc` in the user\'s time zone) and de-duplicate. For irregular events use the `lag` + running-sum pattern with a threshold.' },
    { title: 'Forgetting PARTITION BY',
      symptom: 'Sessions or streaks run across users.',
      cause: '`lag` and `row_number` without `PARTITION BY user_id` treat the whole table as one sequence.',
      fix: 'Partition every window by the entity, and order by the time column plus a tiebreaker. A named `WINDOW w AS (…)` keeps them identical.' },
    { title: 'Merging ranges in application code',
      symptom: 'Calendars show double bookings, or free-slot searches are slow and buggy at boundaries.',
      cause: 'Hand-written interval merging gets inclusive and exclusive bounds wrong, and cannot prevent concurrent overlaps.',
      fix: 'Store `tstzrange` with `[)` bounds, merge with `range_agg`, and enforce "no overlap" with `EXCLUDE USING gist (room WITH =, during WITH &&)`.' },
  ],
  pointers: [
    'Streaks: `value − row_number() OVER (ORDER BY value)` is constant inside a run. GROUP BY it.',
    'Sessions: flag rows where `lag()` is NULL or too far back, then a running `sum(flag)` numbers the groups.',
    'Gaps: `lead(value)` minus value > 1, or a `generate_series` EXCEPT the values present.',
    'Intervals: `range_agg` fuses overlapping and adjacent ranges, and `EXCLUDE … WITH &&` forbids overlaps.',
    'Going deeper: [Window functions and frames](/m3/window-functions) explains partitions, ordering and the running-sum frame.',
  ],
  sources: ['functions-window.html', 'tutorial-window.html', 'functions-datetime.html', 'functions-srf.html', 'queries-union.html', 'rangetypes.html', 'functions-range.html', 'functions-aggregate.html', 'btree-gist.html', 'sql-createtable.html'],
}
