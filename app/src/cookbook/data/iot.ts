import type { Dataset, Exercise } from '../types'

export const dataset: Dataset = {
  id: 'iot',
  title: 'Sensor readings',
  description: 'Five sensors on one site that should report every 10 minutes from 1 March 2025 00:00 to 4 March 11:50 UTC: about 1,900 readings with an outage, short gaps, a sensor that went silent, one that never reported, NULL values and a few duplicated rows.',
  setup: `
CREATE TABLE sensors (id int PRIMARY KEY, name text NOT NULL UNIQUE, kind text NOT NULL, tz text NOT NULL);
CREATE TABLE readings (sensor_id int NOT NULL REFERENCES sensors(id), ts timestamptz NOT NULL, value numeric(5,2));
INSERT INTO sensors VALUES
 (1,'greenhouse-a','temperature','Europe/Berlin'),(2,'greenhouse-b','temperature','Europe/Berlin'),
 (3,'cellar','temperature','Europe/Berlin'),(4,'attic','humidity','Europe/Berlin'),(5,'garage','temperature','Europe/Berlin');
-- n = 1, 2, 3 … numbers the 10-minute slots; m = minutes since the start. Values follow a daily curve plus a fixed wobble.
INSERT INTO readings (sensor_id, ts, value)
SELECT s, ts,
  CASE
    WHEN s = 1 AND (n % 97 = 0 OR n = 75) THEN NULL
    WHEN s = 1 THEN 22 + 5 * sin(2 * pi() * (m - 360) / 1440) + ((n * 37) % 7 - 3) / 10.0
    WHEN s = 2 THEN 20 + 3 * sin(2 * pi() * (m - 420) / 1440) + ((n * 13) % 5 - 2) / 10.0
    WHEN s = 3 THEN 12 + 0.6 * sin(2 * pi() * (m - 600) / 1440) + ((n * 11) % 3 - 1) / 10.0
    ELSE 60 + 12 * cos(2 * pi() * (m - 240) / 1440) + ((n * 7) % 9 - 4) / 10.0
  END
FROM generate_series(1, 4) AS s,
     generate_series(timestamptz '2025-03-01 00:00+00', timestamptz '2025-03-04 11:50+00', interval '10 minutes') WITH ORDINALITY AS g(ts, n),
     LATERAL (SELECT (n - 1) * 10 AS m) AS mm
WHERE NOT (s = 2 AND ts >= '2025-03-02 03:00+00' AND ts < '2025-03-02 06:00+00')
  AND NOT (s = 3 AND (ts = '2025-03-01 20:10+00' OR ts BETWEEN '2025-03-03 12:00+00' AND '2025-03-03 12:30+00'))
  AND NOT (s = 4 AND ts >= '2025-03-03 18:00+00')
ORDER BY ts, s;
-- a flaky uplink delivered three messages twice
INSERT INTO readings SELECT * FROM readings
WHERE sensor_id = 2 AND ts IN ('2025-03-01 08:00+00', '2025-03-01 08:10+00', '2025-03-02 12:00+00');
CREATE INDEX ON readings (sensor_id, ts);`,
  tables: [
    { name: 'sensors', columns: "id int PK, name text UNIQUE, kind 'temperature'|'humidity', tz text" },
    { name: 'readings', columns: 'sensor_id int → sensors, ts timestamptz, value numeric(5,2) NULL; no primary key (duplicates exist)' },
  ],
}

export const exercises: Exercise[] = [
  // ── beginner ──────────────────────────────────────────────────────────────
  {
    id: 'iot-counts', dataset: 'iot', level: 'beginner', topic: 'NULL handling',
    title: 'Rows versus values',
    task: 'For each sensor that has readings, return `sensor_id`, `readings` (number of rows) and `with_value` (number of rows whose `value` is not NULL).',
    hint: '`count(*)` and `count(column)` are not the same thing.',
    solution: `SELECT sensor_id, count(*) AS readings, count(value) AS with_value FROM readings GROUP BY sensor_id;`,
    explanation: '`count(*)` counts rows; `count(value)` counts only non-NULL values. Every aggregate except `count(*)` skips NULLs, which is why greenhouse-a’s average is not dragged down by its missing readings.',
  },
  {
    id: 'iot-extremes', dataset: 'iot', level: 'beginner', topic: 'aggregates',
    title: 'Lowest and highest value per sensor',
    task: 'Return `sensor_id`, `min_value` and `max_value` for every sensor that has readings.',
    solution: `SELECT sensor_id, min(value) AS min_value, max(value) AS max_value FROM readings GROUP BY sensor_id;`,
    explanation: '`min` and `max` ignore NULLs, so a sensor with gaps still gets real numbers. The garage sensor has no rows, so it forms no group.',
  },
  {
    id: 'iot-half-open', dataset: 'iot', level: 'beginner', topic: 'filtering',
    title: 'Readings in a 12-hour window',
    task: 'Return one column `n`: the number of readings from sensor 3 with `ts` from 2025-03-03 06:00 UTC (inclusive) up to 18:00 UTC (exclusive).',
    solution: `SELECT count(*) AS n FROM readings
WHERE sensor_id = 3 AND ts >= '2025-03-03 06:00+00' AND ts < '2025-03-03 18:00+00';`,
    explanation: 'A half-open interval `>= start AND < end` counts each 10-minute slot once; `BETWEEN` includes both ends and would also count the 18:00 reading. Writing the offset (`+00`) in the literal pins the instant regardless of the session time zone.',
  },
  {
    id: 'iot-latest-five', dataset: 'iot', level: 'beginner', topic: 'sorting',
    title: 'The five most recent readings',
    task: 'Return `ts` and `value` of the five most recent readings of sensor 2, newest first.',
    solution: `SELECT ts, value FROM readings WHERE sensor_id = 2 ORDER BY ts DESC LIMIT 5;`,
    explanation: '`ORDER BY ts DESC LIMIT 5` walks the `(sensor_id, ts)` index backwards and stops after five rows, so it stays fast however large the table grows.',
    ordered: true,
  },
  {
    id: 'iot-null-times', dataset: 'iot', level: 'beginner', topic: 'NULL handling',
    title: 'When did greenhouse-a fail to measure?',
    task: 'Return the `ts` of every sensor-1 reading whose `value` is NULL, in time order.',
    solution: `SELECT ts FROM readings WHERE sensor_id = 1 AND value IS NULL ORDER BY ts;`,
    explanation: 'A row that exists with a NULL value is different from a missing row: here the sensor reported, but without a measurement. `IS NULL` finds the first kind; finding the second needs a gap analysis.',
    ordered: true,
  },

  // ── intermediate ─────────────────────────────────────────────────────────
  {
    id: 'iot-hourly', dataset: 'iot', level: 'intermediate', topic: 'dates & time zones',
    title: 'Hourly averages',
    task: 'For sensor 1 on 1 March 2025 (UTC), return `hour` (the start of each hour, a `timestamptz`) and `avg_value` rounded to 2 decimals, in time order.',
    solution: `SELECT date_trunc('hour', ts) AS hour, round(avg(value), 2) AS avg_value
FROM readings
WHERE sensor_id = 1 AND ts >= '2025-03-01 00:00+00' AND ts < '2025-03-02 00:00+00'
GROUP BY hour ORDER BY hour;`,
    explanation: '`date_trunc(\'hour\', ts)` maps every reading to the start of its hour, so grouping by it buckets the data. On a `timestamptz` it truncates in the session time zone (UTC here). `avg` skips the NULL readings rather than counting them as zero.',
    ordered: true,
  },
  {
    id: 'iot-six-hour-buckets', dataset: 'iot', level: 'intermediate', topic: 'dates & time zones',
    title: 'Six-hour buckets reveal an outage',
    task: 'For sensor 2 on 2 March 2025 (UTC), return `bucket` (start of each 6-hour bucket: 00:00, 06:00, 12:00, 18:00 UTC) and `readings` (rows in it), in time order.',
    hint: '`date_trunc` only knows whole units; `date_bin` takes any stride.',
    solution: `SELECT date_bin('6 hours', ts, timestamptz '2025-03-01 00:00+00') AS bucket, count(*) AS readings
FROM readings
WHERE sensor_id = 2 AND ts >= '2025-03-02 00:00+00' AND ts < '2025-03-03 00:00+00'
GROUP BY bucket ORDER BY bucket;`,
    explanation: '`date_bin(stride, ts, origin)` snaps each timestamp to the start of its bucket counted from `origin`. A full bucket holds 36 readings; the first one is short because of the three-hour outage, and the duplicated noon message makes another one long.',
    ordered: true,
  },
  {
    id: 'iot-local-days', dataset: 'iot', level: 'intermediate', topic: 'dates & time zones',
    title: 'Daily figures on the site’s calendar',
    task: 'For sensor 1, group readings by **local calendar day** in the sensor’s time zone (`sensors.tz`). Return `day` (a `date`), `readings` (rows) and `avg_value` rounded to 2 decimals.',
    solution: `SELECT (r.ts AT TIME ZONE s.tz)::date AS day, count(*) AS readings, round(avg(r.value), 2) AS avg_value
FROM readings r JOIN sensors s ON s.id = r.sensor_id
WHERE r.sensor_id = 1
GROUP BY day;`,
    explanation: 'Berlin is one hour ahead of UTC in March, so its day starts at 23:00 UTC the evening before. `ts::date` uses the session zone (UTC) and puts six readings per day on the wrong date; `ts AT TIME ZONE tz` gives local wall-clock time first.',
  },
  {
    id: 'iot-silent', dataset: 'iot', level: 'intermediate', topic: 'anti-joins',
    title: 'Sensors that have gone quiet',
    task: 'Return the `name` of every sensor with **no** reading at or after 2025-03-04 00:00 UTC, including sensors that never reported at all.',
    solution: `SELECT s.name FROM sensors s
WHERE NOT EXISTS (SELECT 1 FROM readings r WHERE r.sensor_id = s.id AND r.ts >= '2025-03-04 00:00+00');`,
    explanation: 'Phrase it as "there is no recent reading" and the never-seen garage sensor qualifies naturally. Joining readings and testing `max(ts) < …` per sensor misses it, because a sensor with no rows has no group.',
  },
  {
    id: 'iot-classify', dataset: 'iot', level: 'intermediate', topic: 'CASE',
    title: 'Cold, normal, hot, or missing',
    task: 'Classify every sensor-1 reading as `cold` (below 18), `normal` (18 to 25 inclusive), `hot` (above 25) or `missing` (NULL value). Return `class` and `readings` (count per class).',
    hint: 'What does a CASE with `ELSE \'hot\'` do with NULL?',
    solution: `SELECT CASE WHEN value IS NULL THEN 'missing'
            WHEN value < 18 THEN 'cold'
            WHEN value <= 25 THEN 'normal'
            ELSE 'hot' END AS class,
       count(*) AS readings
FROM readings WHERE sensor_id = 1
GROUP BY class;`,
    explanation: '`CASE` takes the first branch whose condition is true. Every comparison with NULL is NULL, not false, so NULL values fall through to `ELSE`: without an explicit `IS NULL` branch they are counted as hot.',
  },

  // ── advanced ─────────────────────────────────────────────────────────────
  {
    id: 'iot-gaps', dataset: 'iot', level: 'advanced', topic: 'gaps & islands',
    title: 'Find the gaps',
    task: 'For every sensor, find places where the next reading arrives **more than 10 minutes** after the previous one. Return `sensor_id`, `gap_from` (last reading before the gap), `gap_to` (first reading after) and `missing` = number of 10-minute slots skipped (an integer).',
    solution: `SELECT sensor_id, ts AS gap_from, next_ts AS gap_to,
       (extract(epoch FROM next_ts - ts) / 600)::int - 1 AS missing
FROM (
  SELECT sensor_id, ts, lead(ts) OVER (PARTITION BY sensor_id ORDER BY ts) AS next_ts FROM readings
) t
WHERE next_ts - ts > interval '10 minutes';`,
    explanation: '`lead(ts)` pairs every reading with the next one of the same sensor, which turns "find the gaps" into a simple filter on the difference. Duplicated rows produce a zero difference and are harmless here. A sensor that stopped for good (the attic) has no next row and so no gap: spotting that needs a comparison with "now".',
  },
  {
    id: 'iot-islands', dataset: 'iot', level: 'advanced', topic: 'gaps & islands',
    title: 'Hot spells',
    task: 'For sensor 1, find every run of consecutive readings with `value > 25` (a NULL reading breaks a run). Return `run_start`, `run_end` (first and last `ts` of the run) and `readings` in the run.',
    hint: 'Number all readings, number the hot ones, and subtract: the difference is constant within a run.',
    solution: `SELECT min(ts) AS run_start, max(ts) AS run_end, count(*) AS readings
FROM (
  SELECT ts, value,
         row_number() OVER (ORDER BY ts)
       - row_number() OVER (PARTITION BY value > 25 ORDER BY ts) AS grp
  FROM readings WHERE sensor_id = 1
) t
WHERE value > 25
GROUP BY grp;`,
    explanation: 'Within a run of hot readings both row numbers grow by one per row, so their difference stays constant and identifies the island; any reading in between bumps the overall number only. NULL values land in their own partition (`value > 25` is NULL), so they break a run like a cool reading does: the first day’s spell is split in two by a missing measurement.',
  },
  {
    id: 'iot-moving-avg', dataset: 'iot', level: 'advanced', topic: 'window functions',
    title: 'Six-reading moving average',
    task: 'For sensor 1 between 2025-03-01 00:00 and 01:50 UTC inclusive, return `ts`, `value` and `moving_avg`: the average of this reading and the 5 before it (fewer at the start), rounded to 2 decimals. Order by `ts`.',
    solution: `SELECT ts, value,
       round(avg(value) OVER (ORDER BY ts ROWS BETWEEN 5 PRECEDING AND CURRENT ROW), 2) AS moving_avg
FROM readings
WHERE sensor_id = 1 AND ts BETWEEN '2025-03-01 00:00+00' AND '2025-03-01 01:50+00'
ORDER BY ts;`,
    explanation: 'With `ORDER BY` but no frame clause, a window aggregate defaults to `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, a running average over everything so far. `ROWS BETWEEN 5 PRECEDING AND CURRENT ROW` slides a fixed six-row window instead.',
    ordered: true,
  },
  {
    id: 'iot-time-frame', dataset: 'iot', level: 'advanced', topic: 'window functions',
    title: 'Average over the last hour, not the last six rows',
    task: 'For sensor 2 readings from 2025-03-02 06:30 to 07:30 UTC inclusive, return `ts`, `value` and `avg_1h`: the average of **all** sensor-2 readings with timestamps in `[ts − 1 hour, ts]`, rounded to 2 decimals. Order by `ts`.',
    hint: 'Two traps: the frame unit, and where you filter.',
    solution: `SELECT ts, value, avg_1h FROM (
  SELECT ts, value,
         round(avg(value) OVER (ORDER BY ts RANGE BETWEEN interval '1 hour' PRECEDING AND CURRENT ROW), 2) AS avg_1h
  FROM readings WHERE sensor_id = 2
) t
WHERE ts BETWEEN '2025-03-02 06:30+00' AND '2025-03-02 07:30+00'
ORDER BY ts;`,
    explanation: 'A `RANGE` frame with an interval offset is defined by time, so at 06:30, just after the 03:00–06:00 outage, it holds only the readings since 06:00; `ROWS 6 PRECEDING` would reach back to readings from before the outage. And because window functions run after `WHERE`, the window must be computed in a subquery over the whole series and filtered outside, or the frame could never see earlier rows.',
    ordered: true,
  },
  {
    id: 'iot-fill-slots', dataset: 'iot', level: 'advanced', topic: 'generate_series',
    title: 'Show the missing slots',
    task: 'For sensor 3, list every 10-minute slot from 2025-03-03 11:30 to 13:00 UTC inclusive: `slot` (timestamptz) and `value` (NULL where no reading exists). Order by `slot`.',
    solution: `SELECT g.slot, r.value
FROM generate_series(timestamptz '2025-03-03 11:30+00', timestamptz '2025-03-03 13:00+00', interval '10 minutes') AS g(slot)
LEFT JOIN readings r ON r.sensor_id = 3 AND r.ts = g.slot
ORDER BY g.slot;`,
    explanation: 'You cannot select rows that do not exist, so generate the expected timeline and outer-join the data onto it. Putting `r.sensor_id = 3` in `WHERE` instead of `ON` would turn the outer join back into an inner one and drop the empty slots.',
    ordered: true,
  },
  {
    id: 'iot-first-last', dataset: 'iot', level: 'advanced', topic: 'window functions',
    title: 'First and last value of each day',
    task: 'For every sensor and UTC day with readings, return `sensor_id`, `day` (a `date`), `first_value` (the value of the earliest reading that day) and `last_value` (the value of the latest).',
    hint: '`last_value()` with the default frame is a famous trap.',
    solution: `SELECT DISTINCT sensor_id, ts::date AS day,
       first_value(value) OVER w AS first_value,
       last_value(value)  OVER w AS last_value
FROM readings
WINDOW w AS (PARTITION BY sensor_id, ts::date ORDER BY ts ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING);`,
    explanation: 'With the default frame (`… AND CURRENT ROW`), `last_value()` returns the current row’s value, so even after `DISTINCT` you get well over a thousand rows instead of one per sensor and day. Extending the frame to `UNBOUNDED FOLLOWING` lets it see the whole day. Two `DISTINCT ON` queries joined together, or `array_agg(value ORDER BY ts)`, also work.',
  },

  // ── expert ───────────────────────────────────────────────────────────────
  {
    id: 'iot-dedupe', dataset: 'iot', level: 'expert', topic: 'data changes',
    title: 'Remove duplicates, then forbid them',
    task: 'Delete duplicate readings so that each `(sensor_id, ts)` appears once (the duplicates are exact copies), then add a **primary key** on `(sensor_id, ts)`. The check returns `total_rows`, `distinct_keys` and `pk_columns` (the primary key columns as text).',
    hint: 'Exact duplicates are told apart by their physical row id, `ctid`.',
    solution: `DELETE FROM readings a USING readings b
WHERE a.sensor_id = b.sensor_id AND a.ts = b.ts AND a.ctid > b.ctid;
ALTER TABLE readings ADD PRIMARY KEY (sensor_id, ts);`,
    explanation: 'Two identical rows cannot be told apart by any column, but each has a distinct `ctid`; joining the table to itself and deleting the copy with the higher `ctid` keeps exactly one. The primary key would fail to build while duplicates exist, and afterwards it stops new ones arriving (an `INSERT … ON CONFLICT DO NOTHING` then ignores repeats).',
    check: `SELECT count(*) AS total_rows, count(DISTINCT (sensor_id, ts)) AS distinct_keys,
       (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'readings'::regclass AND contype = 'p') AS pk_columns
FROM readings;`,
  },
  {
    id: 'iot-interpolate', dataset: 'iot', level: 'expert', topic: 'LATERAL',
    title: 'Fill a gap by linear interpolation',
    task: 'Sensor 3 missed the slots 2025-03-03 12:00 to 12:30 UTC. For each of those four slots return `slot` and `value`: the straight-line interpolation in time between the nearest reading before and the nearest reading after the slot, rounded to 2 decimals. Order by `slot`.',
    hint: 'One `LATERAL … ORDER BY ts DESC LIMIT 1` for the previous reading and one for the next.',
    solution: `SELECT g.slot,
       round(p.value + (n.value - p.value)
             * extract(epoch FROM g.slot - p.ts) / extract(epoch FROM n.ts - p.ts), 2) AS value
FROM generate_series(timestamptz '2025-03-03 12:00+00', timestamptz '2025-03-03 12:30+00', interval '10 minutes') AS g(slot)
CROSS JOIN LATERAL (SELECT ts, value FROM readings WHERE sensor_id = 3 AND ts < g.slot ORDER BY ts DESC LIMIT 1) p
CROSS JOIN LATERAL (SELECT ts, value FROM readings WHERE sensor_id = 3 AND ts > g.slot ORDER BY ts LIMIT 1) n
ORDER BY g.slot;`,
    explanation: 'Each `LATERAL` subquery runs per generated slot and finds its nearest neighbour on one side through the index. The fraction of the way along is a ratio of epoch seconds; `extract(epoch …)` returns numeric, so no integer division sneaks in. Averaging the two neighbours gives the same value for every slot, which is not what was asked.',
    ordered: true,
  },
]
