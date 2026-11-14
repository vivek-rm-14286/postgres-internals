import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { SqlLine } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one instant on five clocks. The x axis is real elapsed time (UTC). Each lane shows the
 * local wall clock of one zone, including the DST jumps. Local times are computed with the IANA
 * database in the browser and match PostgreSQL 18's output for every instant used below.
 * ---------------------------------------------------------------------------------------------- */

const ZONES: [string, string][] = [['UTC', 'UTC'], ['America/New_York', 'New York'], ['Europe/London', 'London'], ['Asia/Kolkata', 'Kolkata'], ['Asia/Tokyo', 'Tokyo']]
const H = 3600_000
const fmts: Record<string, Intl.DateTimeFormat> = {}
function parts(ms: number, tz: string) {
  const f = (fmts[tz] ??= new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'longOffset' }))
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  const off = (p.timeZoneName.replace('GMT', '') || '+00').replace(/^([+-]\d\d):00$/, '$1')
  return { date: `${p.year}-${p.month}-${p.day}`, hh: p.hour, mm: p.minute, ss: p.second, off }
}
/** timestamptz text exactly as PostgreSQL prints it in that TimeZone. */
const pgTz = (ms: number, tz: string) => { const p = parts(ms, tz); return `${p.date} ${p.hh}:${p.mm}:${p.ss}${p.off}` }
const pgTs = (ms: number, tz: string) => { const p = parts(ms, tz); return `${p.date} ${p.hh}:${p.mm}:${p.ss}` }
const utc = (s: string) => Date.parse(s)

interface Marker { at: number; t: Tone; label?: string; low?: boolean; right?: boolean }
interface S {
  from: number; to: number
  markers: Marker[]
  ghosts?: { wall: string; except?: string }  // a timestamp without zone: where each clock shows this wall time
  lane?: string
  sql: (tz: string) => string; result: (tz: string) => string
  types?: [string, string]
  usesSession?: boolean
}

const MAR = { from: utc('2026-03-07T00:00:00Z'), to: utc('2026-03-08T12:00:00Z') }
const DST = { from: utc('2026-03-07T06:00:00Z'), to: utc('2026-03-08T22:00:00Z') }
const GAP = { from: utc('2026-03-08T00:00:00Z'), to: utc('2026-03-08T14:00:00Z') }
const NOV = { from: utc('2026-11-01T00:00:00Z'), to: utc('2026-11-01T12:00:00Z') }
const I1 = utc('2026-03-07T17:00:00Z')

const steps: Step<S>[] = [
  { title: 'One instant, five clocks', body: 'A **timestamptz** is one point in real time (the vertical line). Every clock in the world reads it differently, but it is the same moment.',
    state: { ...MAR, markers: [{ at: I1, t: 'accent' }], sql: () => "SELECT timestamptz '2026-03-07 12:00 America/New_York';", result: (tz) => pgTz(I1, tz), usesSession: true } },
  { title: 'Stored once, shown in your TimeZone', body: 'PostgreSQL converts the input to UTC and stores only the instant. On output it converts to the session **TimeZone**. Switch the TimeZone above: the value stays, the text changes.',
    state: { ...MAR, markers: [{ at: I1, t: 'accent' }], lane: 'UTC', sql: (tz) => `SET TimeZone = '${tz}';  SELECT timestamptz '2026-03-07 17:00+00';`, result: (tz) => pgTz(I1, tz), usesSession: true } },
  { title: 'A timestamp has no zone', body: "`timestamp '2026-03-07 12:00'` is just wall-clock digits. It could mean **noon on any of these clocks** (hollow marks): five different instants. PostgreSQL cannot place it on the timeline.",
    state: { ...MAR, markers: [], ghosts: { wall: '2026-03-07 12:00' }, sql: () => "SELECT timestamp '2026-03-07 12:00';", result: () => '2026-03-07 12:00:00', types: ['timestamp', 'timestamp'] } },
  { title: 'AT TIME ZONE pins a timestamp', body: "`timestamp AT TIME ZONE 'Asia/Tokyo'` says *these digits are Tokyo time*. The result is a real instant, a **timestamptz**: 12:00 in Tokyo is 03:00 UTC.",
    state: { ...MAR, markers: [{ at: utc('2026-03-07T03:00:00Z'), t: 'accent' }], ghosts: { wall: '2026-03-07 12:00', except: 'Asia/Tokyo' }, lane: 'Asia/Tokyo',
      sql: () => "SELECT timestamp '2026-03-07 12:00' AT TIME ZONE 'Asia/Tokyo';", result: (tz) => pgTz(utc('2026-03-07T03:00:00Z'), tz), types: ['timestamp', 'timestamptz'], usesSession: true } },
  { title: 'AT TIME ZONE reads a wall clock', body: 'Applied to a **timestamptz**, it goes the other way: it returns the local wall-clock time in that zone as a plain **timestamp** with no offset.',
    state: { ...MAR, markers: [{ at: I1, t: 'accent' }], lane: 'Asia/Kolkata', sql: () => "SELECT timestamptz '2026-03-07 17:00+00' AT TIME ZONE 'Asia/Kolkata';", result: () => pgTs(I1, 'Asia/Kolkata'), types: ['timestamptz', 'timestamp'] } },
  { title: 'Spring forward: a missing hour', body: 'On 2026-03-08 New York clocks jump from 02:00 to 03:00. A local time of **02:30 does not exist**, so PostgreSQL reads it as 03:30 daylight time.',
    state: { ...GAP, markers: [{ at: utc('2026-03-08T07:30:00Z'), t: 'new' }], lane: 'America/New_York', sql: () => "SET TimeZone = 'America/New_York';  SELECT timestamptz '2026-03-08 02:30';", result: () => pgTz(utc('2026-03-08T07:30:00Z'), 'America/New_York') } },
  { title: "'1 day' is not '24 hours'", body: "Start at noon on 2026-03-07. **+ interval '1 day'** keeps the wall clock: noon again (only 23 h later). **+ interval '24 hours'** adds elapsed time and lands on 13:00.",
    state: { ...DST, markers: [{ at: I1, t: 'accent', label: 'start' }, { at: utc('2026-03-08T16:00:00Z'), t: 'ok', label: '+1 day' }, { at: utc('2026-03-08T17:00:00Z'), t: 'new', label: '+24 h', low: true, right: true }], lane: 'America/New_York',
      sql: () => "SELECT ts + interval '1 day', ts + interval '24 hours'  -- ts = '2026-03-07 12:00 New York'", result: () => `${pgTz(utc('2026-03-08T16:00:00Z'), 'America/New_York')} | ${pgTz(utc('2026-03-08T17:00:00Z'), 'America/New_York')}` } },
  { title: 'Fall back: an hour that happens twice', body: 'On 2026-11-01 New York repeats 01:00 to 02:00. `01:30` is **ambiguous**: PostgreSQL picks standard time (-05, solid). Write `01:30 EDT` to get the earlier one (hollow).',
    state: { ...NOV, markers: [{ at: utc('2026-11-01T06:30:00Z'), t: 'new', label: '-05 (chosen)', right: true }, { at: utc('2026-11-01T05:30:00Z'), t: 'muted', label: 'EDT', low: true }], lane: 'America/New_York',
      sql: () => "SET TimeZone = 'America/New_York';  SELECT timestamptz '2026-11-01 01:30';", result: () => pgTz(utc('2026-11-01T06:30:00Z'), 'America/New_York') } },
]

const W = 640, LABEL = 84, LANE_H = 50, TOP = 22
const xOf = (s: S, ms: number) => LABEL + ((ms - s.from) / (s.to - s.from)) * (W - LABEL - 10)

/** Instants (within the window, 15-minute grid) at which a zone's clock reads the given HH:MM. */
function wallInstants(s: S, tz: string, wall: string) {
  const out: number[] = []
  for (let t = s.from; t <= s.to; t += H / 4) { const p = parts(t, tz); if (`${p.date} ${p.hh}:${p.mm}` === wall) out.push(t) }
  return out
}

function Timeline({ s }: { s: S }) {
  const bottom = TOP + ZONES.length * LANE_H - 6
  const height = bottom + 18
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full min-w-[600px]" role="img" aria-label="Local clocks of five time zones on a shared timeline">
      <text x={LABEL} y={13} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">real time →  (ticks = local 00 / 06 / 12 / 18)</text>
      {ZONES.map(([tz, name], li) => {
        const y = TOP + li * LANE_H
        const ticks: { x: number; label: string; day?: string }[] = []
        const jumps: { x: number; from: string; to: string }[] = []
        let prevOff = parts(s.from, tz).off
        for (let t = s.from; t <= s.to; t += H / 2) {
          const p = parts(t, tz)
          if (p.mm === '00' && +p.hh % 6 === 0 && xOf(s, t) < W - 26) ticks.push({ x: xOf(s, t), label: p.hh, day: p.hh === '00' ? p.date.slice(5) : undefined })
          if (p.off !== prevOff) { jumps.push({ x: xOf(s, t), from: prevOff, to: p.off }); prevOff = p.off }
        }
        const hot = s.lane === tz
        return (
          <g key={tz}>
            <motion.rect x={2} y={y} width={W - 4} height={LANE_H - 6} rx={6} initial={false} animate={{ fill: hot ? toneBg('accent', 12) : 'var(--surface-2)' }} stroke={hot ? tone('accent') : 'var(--border)'} />
            <text x={10} y={y + 18} fontSize={12} fontWeight={700} fill="var(--text)" fontFamily="var(--font-sans)">{name}</text>
            <text x={10} y={y + 33} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">UTC{parts(s.from, tz).off}</text>
            {ticks.map((k, i) => (
              <g key={i}>
                <line x1={k.x} x2={k.x} y1={y + 4} y2={y + LANE_H - 10} stroke={k.day ? 'var(--text)' : 'var(--border)'} strokeWidth={k.day ? 1.4 : 1} opacity={k.day ? 0.6 : 1} />
                <text x={k.x + 2} y={y + LANE_H - 12} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{k.day ? `${k.day}` : k.label}</text>
              </g>
            ))}
            {jumps.map((j, i) => (
              <g key={`j${i}`}>
                <rect x={j.x - 6} y={y + 2} width={12} height={LANE_H - 10} fill={toneBg('dead', 30)} stroke={tone('dead')} strokeDasharray="3 2" />
                <text x={j.x - 9} y={y + 14} textAnchor="end" fontSize={9.5} fontWeight={700} fill={tone('dead')} fontFamily="var(--font-mono)">{j.from}→{j.to}</text>
              </g>
            ))}
            {s.ghosts && s.ghosts.except !== tz && wallInstants(s, tz, s.ghosts.wall).map((t, i) => (
              <motion.circle key={`g${i}`} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} cx={xOf(s, t)} cy={y + 20} r={6} fill="var(--surface)" stroke={tone('header')} strokeWidth={2} strokeDasharray="3 2" />
            ))}
            {s.markers.map((m, i) => {
              const p = parts(m.at, tz)
              const x = xOf(s, m.at)
              const cy = m.low ? y + 30 : y + 12
              return (
                <motion.g key={`m${i}`} initial={false} animate={{ x }} transition={{ type: 'spring', stiffness: 140, damping: 20 }}>
                  <rect x={-21} y={cy - 8} width={42} height={16} rx={4} fill={m.t === 'muted' ? 'var(--surface)' : tone(m.t)} stroke={tone(m.t)} strokeDasharray={m.t === 'muted' ? '3 2' : undefined} />
                  <text x={0} y={cy + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={m.t === 'muted' ? 'var(--text)' : 'var(--bg)'} fontFamily="var(--font-mono)">{p.hh}:{p.mm}</text>
                </motion.g>
              )
            })}
          </g>
        )
      })}
      {/* the vertical instant lines, drawn over all lanes */}
      {s.markers.map((m, i) => (
        <motion.line key={`v${i}`} initial={false} animate={{ x1: xOf(s, m.at), x2: xOf(s, m.at) }} transition={{ type: 'spring', stiffness: 140, damping: 20 }}
          y1={TOP - 4} y2={bottom} stroke={tone(m.t)} strokeWidth={1.5} strokeDasharray={m.t === 'muted' ? '4 3' : undefined} opacity={0.55} />
      ))}
      {s.markers.filter((m) => m.label).map((m, i) => (
        <motion.text key={`l${i}`} initial={false} animate={{ x: xOf(s, m.at) + (m.right ? 4 : -4) }} y={bottom + 12} textAnchor={m.right ? 'start' : 'end'} fontSize={10} fontWeight={700} fill={tone(m.t)} fontFamily="var(--font-mono)">{m.label}</motion.text>
      ))}
    </svg>
  )
}

const SESSION: [string, string][] = [['UTC', 'UTC'], ['America/New_York', 'New\u00a0York'], ['Asia/Kolkata', 'Kolkata'], ['Asia/Tokyo', 'Tokyo']]

function TimeZoneViz() {
  const [tz, setTz] = useState('UTC')
  return (
    <div className="grid gap-3">
      <Stepper steps={steps} interval={3200}
        extra={<div className="flex items-center gap-1.5"><span className="text-xs text-muted">Session TimeZone</span><Segmented label="Session TimeZone" value={tz} onChange={setTz} options={SESSION} /></div>}
        render={(s) => (
          <div className="grid gap-3">
            <div className="overflow-x-auto scrollbar-thin rounded-lg border border-line bg-bg p-1">
              <Timeline s={s} />
            </div>
            <SqlLine sql={s.sql(tz)} result={s.result(tz)} />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {s.types ? <>Type: <Tag t="header">{s.types[0]}</Tag> → <Tag t={s.types[0] === s.types[1] ? 'header' : 'new'}>{s.types[1]}</Tag></> : <>Type: <Tag t="accent">timestamptz</Tag></>}
              {s.usesSession && <span>· output shown in TimeZone <b className="text-ink">{tz}</b></span>}
            </div>
          </div>
        )} />
      <Legend items={[['accent', 'an instant (timestamptz)'], ['header', 'a timestamp without zone: could be any of these'], ['dead', 'DST offset change'], ['new', 'result of the rule shown'], ['ok', 'wall-clock arithmetic']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'dates-and-times',
  module: 'f2',
  order: 3,
  title: 'Dates, times and time zones',
  tldr: [
    'PostgreSQL has `date`, `timestamp` (wall-clock time), `timestamptz` (a real instant, stored in UTC) and `interval`, plus functions to truncate, extract, bucket and convert them.',
    'Time zones and daylight saving time make "the same time" ambiguous, so choosing **timestamptz** and **half-open ranges** keeps reports and schedules correct everywhere.',
  ],
  visualizer: {
    title: 'One instant, many clocks',
    caption: 'Step through eight scenes. The x axis is real time; each lane is a local clock with its DST jumps. Switch the **session TimeZone** to see that only the display changes.',
    Component: TimeZoneViz,
  },
  playground: {
    setup: `
SET TimeZone = 'UTC';
CREATE TABLE events (
  id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  happened_at timestamptz NOT NULL,
  kind        text NOT NULL,
  amount      numeric(8,2)            -- only for orders
);
-- 60 events, one every 97 minutes, from 2026-03-06 to 2026-03-09 (spans the US DST switch)
INSERT INTO events (happened_at, kind, amount)
SELECT timestamptz '2026-03-06 00:00+00' + g * interval '97 minutes',
       (ARRAY['view', 'cart', 'order'])[1 + g % 3],
       CASE WHEN g % 3 = 2 THEN 10 + (g % 7) * 5 END
FROM generate_series(0, 59) AS g;`,
    presets: [
      { label: 'TimeZone and now()', sql: `SHOW TimeZone;
SELECT timestamptz '2026-03-07 17:00+00' AS in_utc;

SET TimeZone = 'Asia/Kolkata';
SELECT timestamptz '2026-03-07 17:00+00' AS same_instant_in_kolkata;
SET TimeZone = 'UTC';

BEGIN;
SELECT now() AS tx_start, clock_timestamp() AS wall_clock;
SELECT pg_sleep(0.2);
SELECT now() = transaction_timestamp() AS now_is_frozen, clock_timestamp() - now() AS elapsed;
COMMIT;`,
        note: 'The same stored instant prints as `17:00:00+00` or `22:30:00+05:30`. Inside a transaction `now()` never moves; `clock_timestamp()` does (elapsed is about 0.2 s).' },
      { label: 'timestamp vs timestamptz', sql: `SELECT timestamp   '2026-03-07 12:00:00+02' AS offset_ignored,
       timestamptz '2026-03-07 12:00:00+02' AS offset_used;

SELECT pg_typeof(now()) AS now_type, pg_typeof(localtimestamp) AS local_type,
       pg_typeof(current_date) AS date_type;`,
        note: 'A `timestamp` literal **silently drops** the `+02`. The timestamptz version converts it: 12:00 at +02 is 10:00 UTC.' },
      { label: 'AT TIME ZONE', sql: `SELECT happened_at,
       happened_at AT TIME ZONE 'America/New_York'            AS ny_wall_clock,
       pg_typeof(happened_at AT TIME ZONE 'America/New_York') AS result_type
FROM events ORDER BY id LIMIT 3;

SELECT timestamp '2026-03-07 12:00' AT TIME ZONE 'Asia/Tokyo' AS tokyo_noon_as_instant;

SELECT timestamptz '2026-07-01 12:00+00' AT TIME ZONE '+05'               AS posix_plus5,
       timestamptz '2026-07-01 12:00+00' AT TIME ZONE INTERVAL '+05:00'   AS interval_plus5;`,
        note: 'timestamptz → timestamp (wall clock) and timestamp → timestamptz (an instant). Careful: the text `\'+05\'` is a POSIX zone meaning **UTC−5** (07:00); the interval form means UTC+5 (17:00).' },
      { label: 'DST arithmetic', sql: `SET TimeZone = 'America/New_York';
SELECT timestamptz '2026-03-08 02:30'                          AS gap_time,
       timestamptz '2026-03-07 12:00' + interval '1 day'        AS plus_1_day,
       timestamptz '2026-03-07 12:00' + interval '24 hours'     AS plus_24_hours,
       timestamptz '2026-11-02 00:00' - timestamptz '2026-11-01 00:00' AS fall_back_day;
SET TimeZone = 'UTC';`,
        note: '02:30 does not exist and becomes 03:30-04. `1 day` lands on 12:00 but `24 hours` on 13:00. The fall-back day lasts `1 day 01:00:00`: 25 hours.' },
      { label: 'Dates, months and age', sql: `SELECT date '2026-01-31' + interval '1 month'  AS jan31_plus_month,
       date '2024-01-31' + interval '1 month'  AS leap_year,
       date '2026-11-14' + 30                  AS in_30_days,
       date '2026-12-25' - date '2026-11-14'   AS days_to_go,
       age(date '2026-11-14', date '1990-05-20') AS age;`,
        note: 'Adding a month clamps to the last day (Feb 28, or Feb 29 in 2024). `date + integer` adds days; `date - date` is an integer number of days.' },
      { label: 'Truncate, extract, bin', sql: `SELECT happened_at,
       date_trunc('hour', happened_at)  AS hour,
       date_trunc('week', happened_at)  AS week_monday,
       extract(dow FROM happened_at)    AS dow_sun0,
       extract(isodow FROM happened_at) AS isodow_mon1,
       date_bin('15 minutes', happened_at, timestamptz '2026-01-01') AS bin15
FROM events ORDER BY id LIMIT 5;

SELECT extract(week FROM date '2027-01-01')    AS iso_week,
       extract(isoyear FROM date '2027-01-01') AS iso_year;`,
        note: '`date_trunc(\'week\')` snaps to Monday. `dow` counts Sunday as 0, `isodow` Monday as 1. 2027-01-01 belongs to ISO **week 53 of 2026**: always pair `week` with `isoyear`.' },
      { label: 'Daily report, half-open', sql: `SELECT d::date AS day, count(e.id) AS events, coalesce(sum(e.amount), 0) AS revenue
FROM generate_series(timestamptz '2026-03-06', timestamptz '2026-03-09', interval '1 day') AS d
LEFT JOIN events e ON e.happened_at >= d AND e.happened_at < d + interval '1 day'
GROUP BY d ORDER BY d;

SELECT date_trunc('day', happened_at, 'America/New_York') AS ny_day_start, count(*), sum(amount)
FROM events GROUP BY 1 ORDER BY 1;`,
        note: '`generate_series` makes one row per day and `LEFT JOIN` ([Joins, visualized](/m3/joins)) attaches that day\'s events, so a day with no events still shows 0. Each day is `[start, start + 1 day)`: every event lands in exactly one bucket. Grouped by New York days the counts shift, and the 2026-03-08 bucket starts at 05:00 UTC but the next at 04:00 UTC (a 23-hour day).' },
    ],
  },
  production: {
    title: 'A daily revenue report that is off by a day',
    context: 'An online shop stores `happened_at timestamptz`. Its finance team works in New York and reads a daily revenue report built with `happened_at::date`.',
    problem: 'The database session runs in UTC, so `::date` cuts days at midnight **UTC**, which is 19:00 or 20:00 in New York. Evening orders show up on the next day and the totals never match the till.',
    solution: 'Bucket by the business time zone explicitly with the three-argument `date_trunc`, and filter with half-open ranges built in that zone, so the result does not depend on the session TimeZone.',
    sql: `-- wrong: days in the session time zone (UTC)
SELECT happened_at::date AS day, count(*), sum(amount)
FROM events GROUP BY 1 ORDER BY 1;

-- right: New York business days
SELECT (date_trunc('day', happened_at, 'America/New_York')
          AT TIME ZONE 'America/New_York')::date AS ny_day,
       count(*), sum(amount)
FROM events GROUP BY 1 ORDER BY 1;`,
    outcome: 'On the playground data the UTC report shows 2026-03-06 with 15 events and 110.00; the New York report shows 14 events and 115.00 for that day, plus 4 events from the evening of 2026-03-05 that the UTC report had moved forward.',
  },
  pitfalls: [
    { title: 'Using timestamp for events',
      symptom: 'Rows written by servers in different regions sort in the wrong order, and an hour of data looks duplicated every November.',
      cause: '`timestamp` stores digits without a zone. Two clocks reading `01:30` may be hours apart, and the fall-back hour repeats.',
      fix: 'Store real moments as **timestamptz**. Use `timestamp` only for wall-clock values such as "store opens at 09:00 local".' },
    { title: 'BETWEEN on dates misses the last day',
      symptom: 'A monthly report written as `BETWEEN \'2026-03-01\' AND \'2026-03-31\'` is missing almost all of March 31.',
      cause: 'The date `2026-03-31` becomes the timestamp `2026-03-31 00:00`. `BETWEEN` includes that single instant, not the whole day.',
      fix: 'Use a **half-open range**: `>= start AND < next_start`. It never overlaps and never leaves a gap.',
      sql: `SELECT count(*) FILTER (WHERE happened_at BETWEEN '2026-03-06' AND '2026-03-08')     AS between_count,
       count(*) FILTER (WHERE happened_at >= '2026-03-06' AND happened_at < '2026-03-09') AS half_open
FROM events;` },
    { title: "A DEFAULT frozen at table creation",
      symptom: 'Every row has the same `created_at`: the moment the table was created.',
      cause: "`DEFAULT 'now'` or `DEFAULT timestamptz 'now'` is a constant. It is converted once, when the CREATE TABLE is parsed.",
      fix: 'Use the function: `created_at timestamptz NOT NULL DEFAULT now()`.' },
    { title: "POSIX offsets point the wrong way",
      symptom: "`AT TIME ZONE '+05'` gives a time 10 hours away from what you expected.",
      cause: "A text zone like `'+05'` follows POSIX rules, where positive means **west** of Greenwich (UTC−5). ISO 8601 uses the opposite sign.",
      fix: "Use a zone name (`'Asia/Karachi'`) or an interval (`AT TIME ZONE INTERVAL '+05:00'`)." },
  ],
  pointers: [
    '**timestamptz** stores an instant (in UTC) and displays it in the session **TimeZone**. **timestamp** is wall-clock digits only.',
    '`AT TIME ZONE` flips the type: timestamptz → timestamp (read a clock), timestamp → timestamptz (pin to a zone).',
    "`+ interval '1 day'` keeps the local time of day; `+ interval '24 hours'` adds elapsed time. They differ across DST.",
    'Filter time with **half-open ranges** `>= start AND < end`, and pass the business zone to `date_trunc`. A `tstzrange` stores such a period as one value: [Ranges and other special types](/f2/ranges-and-special-types).',
    'Going deeper: the Internals lesson [Declarative partitioning and pruning](/m7/partitioning) uses the same half-open bounds to split tables by time.',
  ],
  sources: ['datatype-datetime.html', 'functions-datetime.html', 'functions-formatting.html', 'runtime-config-client.html', 'rangetypes.html'],
}
