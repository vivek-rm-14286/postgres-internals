import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, EditionTag, Msg, Stat, DAY, H, fmtDT, type Edition } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the life of daily chunks under three policies run by the job scheduler.
 *  - columnstore policy: chunks whose whole range is older than `after` are converted;
 *  - retention policy: chunks whose whole range is older than `drop_after` are dropped (so surviving
 *    data can be up to drop_after + 1 chunk old: 7 days 12 h in the playground run);
 *  - cagg refresh policy: a window [now - start_offset, now - 1 h]. A refresh over raw data that
 *    retention already dropped deletes those aggregates, which happens whenever start_offset > drop_after.
 *  - optional Tiger Cloud tiering (Parquet on object storage) after 5 days.
 * Job schedules: retention 1 day (add_retention_policy default), refresh 1 h (as configured),
 * columnstore 12 h (the add_columnstore_policy default for chunk intervals of 1 day or more).
 * ---------------------------------------------------------------------------------------------- */

const D0 = Date.UTC(2026, 10, 1) // first chunk
const NOW0 = Date.UTC(2026, 10, 14, 12)
const NDAYS = 25
type St = 'row' | 'col' | 'tier' | 'dropped'
const stTone: Record<St, Tone> = { row: 'tuple', col: 'ok', tier: 'header', dropped: 'dead' }

function LifecycleViz() {
  const [now, setNow] = useState(NOW0)
  const [drop, setDrop] = useState<'3' | '7' | '14'>('7')
  const [after, setAfter] = useState<'1' | '3'>('1')
  const [start, setStart] = useState<'1' | '7'>('1')
  const [tier, setTier] = useState(false)
  const [runs, setRuns] = useState(0)
  const dropMs = +drop * DAY, afterMs = +after * DAY, startMs = +start * DAY
  const cutoff = now - dropMs
  const lastDay = Math.floor((now - D0) / DAY)
  const chunks = Array.from({ length: lastDay + 1 }, (_, d) => {
    const lo = D0 + d * DAY, hi = lo + DAY
    const st: St = hi <= cutoff ? 'dropped' : tier && +drop > 5 && hi <= now - 5 * DAY ? 'tier' : hi <= now - afterMs ? 'col' : 'row'
    const caggLost = st === 'dropped' && startMs > dropMs
    return { d, lo, hi, st, caggLost }
  })
  const alive = chunks.filter((c) => c.st !== 'dropped')
  const oldest = alive.length ? (now - alive[0].lo) / DAY : 0
  const lost = chunks.filter((c) => c.caggLost).length
  const unsafe = startMs > dropMs

  const X0 = 78, CW = (632 - X0) / NDAYS
  const x = (t: number) => X0 + ((t - D0) / DAY) * CW
  const advance = () => { if (now < D0 + (NDAYS - 1) * DAY) { setNow(now + DAY); setRuns(runs + 1) } }

  const jobs: { id: number; proc: string; sched: string; ed: Edition; per: number; on: boolean }[] = [
    { id: 1000, proc: 'policy_compression', sched: '12:00:00', ed: 'community', per: 2, on: true },
    { id: 1001, proc: 'policy_retention', sched: '1 day', ed: 'community', per: 1, on: true },
    { id: 1002, proc: 'policy_refresh_continuous_aggregate', sched: '01:00:00', ed: 'community', per: 24, on: true },
    { id: 1003, proc: '(tiered-storage policy)', sched: '1 day', ed: 'cloud', per: 1, on: tier },
  ]
  const msg = unsafe
    ? `**Danger:** the refresh window reaches back ${start} days but raw data is dropped after ${drop}. Every refresh that covers a dropped range finds no rows there and **deletes those aggregates** (${lost} day${lost === 1 ? '' : 's'} lost so far).`
    : `Retention drops a chunk only when its **whole range** is older than ${drop} days, so the oldest surviving row is **${oldest.toFixed(1)} days** old. The continuous aggregate keeps every day, because its refresh window (${start} day${start === '1' ? '' : 's'}) never reaches dropped data.`
  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={advance} disabled={now >= D0 + (NDAYS - 1) * DAY}>Advance 1 day</Btn>
        <Btn onClick={() => { setNow(NOW0); setRuns(0) }}>Reset time</Btn>
        <Btn active={tier} onClick={() => setTier(!tier)}>Tiger Cloud tiering after 5 days</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">retention drop_after</span>
        <Segmented label="drop_after" value={drop} onChange={setDrop} options={[['3', '3 days'], ['7', '7 days'], ['14', '14 days']]} />
        <span className="text-muted">columnstore after</span>
        <Segmented label="columnstore after" value={after} onChange={setAfter} options={[['1', '1 day'], ['3', '3 days']]} />
        <span className="text-muted">cagg start_offset</span>
        <Segmented label="start_offset" value={start} onChange={setStart} options={[['1', '1 day'], ['7', '7 days']]} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="chunks on disk" value={alive.filter((c) => c.st !== 'tier').length} />
        <Stat label="columnstore / rowstore" value={`${alive.filter((c) => c.st === 'col').length} / ${alive.filter((c) => c.st === 'row').length}`} t="ok" />
        <Stat label="oldest raw row" value={`${oldest.toFixed(1)} d`} />
        <Stat label="cagg days deleted" value={lost} t={lost ? 'dead' : 'ok'} />
      </div>
      <Msg id={msg}><p style={unsafe ? { color: tone('dead') } : undefined}><Md>{msg}</Md></p></Msg>
      <Legend items={[['tuple', 'rowstore chunk'], ['ok', 'columnstore chunk'], ['header', 'tiered (object storage)'], ['dead', 'dropped / aggregates lost'], ['accent', 'refresh window'], ['new', 'now']]} />
      <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2 scrollbar-thin">
        <svg viewBox="0 0 640 178" className="w-full min-w-[580px]" role="img" aria-label="Chunk lifecycle timeline">
          <text x={4} y={52} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">raw chunks</text>
          <text x={4} y={104} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">daily cagg</text>
          {Array.from({ length: NDAYS }, (_, d) => d % 3 === 0 && (
            <text key={d} x={x(D0 + d * DAY) + CW / 2} y={14} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{fmtDT(D0 + d * DAY).slice(4, 6)}</text>
          ))}
          <text x={X0} y={26} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">Nov 2026</text>
          {chunks.map((c) => (
            <g key={c.d}>
              <motion.rect initial={{ opacity: 0, y: 30 }} animate={{ opacity: c.st === 'dropped' ? 0.35 : 1, y: c.st === 'tier' ? 50 : 36, fill: toneBg(stTone[c.st], 30), stroke: tone(stTone[c.st]) }}
                transition={{ type: 'spring', stiffness: 160, damping: 20 }} x={x(c.lo) + 1} width={CW - 2} height={c.st === 'tier' ? 14 : 28} rx={2}
                strokeDasharray={c.st === 'dropped' ? '3 2' : undefined} />
              <motion.rect initial={false} animate={{ fill: c.caggLost ? toneBg('dead', 30) : toneBg('tuple', 18), stroke: c.caggLost ? tone('dead') : tone('tuple') }}
                x={x(c.lo) + 1} y={90} width={CW - 2} height={20} rx={2} />
            </g>
          ))}
          <motion.g initial={false} animate={{ x: x(Math.max(D0, now - startMs)) }}>
            <motion.path initial={false} animate={{ d: `M 0 116 V 122 H ${(Math.min(startMs, now - D0) - H) / DAY * CW} V 116` }} fill="none" stroke={tone('accent')} strokeWidth={1.8} />
            <text x={2} y={134} fontSize={9.5} fill={tone('accent')} fontFamily="var(--font-mono)">refresh window</text>
          </motion.g>
          {[[cutoff, 'drop_after', 'dead', 150], [now - afterMs, 'after', 'ok', 162]].map(([t, l, tn, y]) => (
            <motion.g key={l as string} initial={false} animate={{ x: x(t as number) }}>
              <line x1={0} x2={0} y1={30} y2={(y as number) - 10} stroke={tone(tn as Tone)} strokeDasharray="3 2" />
              <text x={0} y={y as number} textAnchor="middle" fontSize={9.5} fill={tone(tn as Tone)} fontFamily="var(--font-mono)">{l as string}</text>
            </motion.g>
          ))}
          <motion.g initial={false} animate={{ x: x(now) }}>
            <line x1={0} x2={0} y1={28} y2={164} stroke={tone('new')} strokeWidth={2} />
            <text x={0} y={175} textAnchor="middle" fontSize={10} fontWeight={700} fill={tone('new')} fontFamily="var(--font-mono)">now {fmtDT(now).slice(4)}</text>
          </motion.g>
        </svg>
      </div>
      <Panel title="timescaledb_information.jobs (simulated)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] font-mono text-[11.5px]">
            <thead><tr className="text-left text-muted"><th className="pr-3 font-normal">job_id</th><th className="pr-3 font-normal">proc_name</th><th className="pr-3 font-normal">schedule_interval</th><th className="pr-3 font-normal">runs</th><th className="font-normal">edition</th></tr></thead>
            <tbody>
              {jobs.filter((j) => j.on).map((j) => (
                <motion.tr key={j.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-line">
                  <td className="py-1 pr-3">{j.id}</td><td className="pr-3">{j.proc}</td><td className="pr-3">{j.sched}</td>
                  <td className="pr-3 tabular-nums">+{runs * j.per}</td><td><EditionTag ed={j.ed} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted"><Md>{'`drop_chunks()` itself is in the Apache 2 edition. Without the scheduler (Apache edition, Neon), call it from pg_cron or an external cron.'}</Md></p>
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'retention-jobs',
  module: 'e2',
  order: 6,
  title: 'Retention, tiering and jobs',
  tldr: [
    '**Retention** in TimescaleDB drops whole chunks once their entire time range is older than a cutoff, and a built-in **job scheduler** runs that and every other policy on a schedule.',
    'Dropping a chunk removes files instantly with no dead tuples or vacuum work, and policies turn the chunk lifecycle (rowstore, columnstore, tiered, dropped) into configuration instead of cron scripts.',
  ],
  visualizer: {
    title: 'The life of a chunk',
    caption: 'Advance day by day and watch chunks move from rowstore to columnstore and finally get dropped. Change `drop_after` and the continuous aggregate\'s `start_offset` until retention starts deleting aggregates, and try Tiger Cloud tiering.',
    Component: LifecycleViz,
  },
  playground: {
    setup: `
SET TIME ZONE 'UTC';
-- ten daily "chunks", one row per minute up to 2026-11-14 11:59
CREATE TABLE conditions (time timestamptz NOT NULL, device_id int NOT NULL, temperature double precision)
  PARTITION BY RANGE (time);
DO $$ BEGIN
  FOR d IN 0..9 LOOP
    EXECUTE format('CREATE TABLE %I PARTITION OF conditions FOR VALUES FROM (%L) TO (%L)',
      'conditions_' || to_char(date '2026-11-05' + d, 'YYYYMMDD'), date '2026-11-05' + d, date '2026-11-05' + d + 1);
  END LOOP;
END $$;
INSERT INTO conditions
SELECT ts, 1 + (n % 4), round((20 + 5 * sin(n / 50.0))::numeric, 2)
FROM generate_series(timestamptz '2026-11-05', timestamptz '2026-11-14 11:59', interval '1 minute') WITH ORDINALITY g(ts, n);
CREATE INDEX ON conditions (time DESC);
ANALYZE conditions;

-- like timescaledb_information.chunks
CREATE FUNCTION chunks() RETURNS TABLE (chunk regclass, range_start timestamptz, range_end timestamptz, row_count bigint)
LANGUAGE sql AS $$
  SELECT c.oid::regclass, b[1]::timestamptz, b[2]::timestamptz, c.reltuples::bigint
  FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid,
       LATERAL regexp_match(pg_get_expr(c.relpartbound, c.oid), 'FROM \\(''([^'']+)''\\) TO \\(''([^'']+)''\\)') b
  WHERE i.inhparent = 'conditions'::regclass ORDER BY 2 $$;
CREATE TABLE wal_mark (lsn pg_lsn);
CREATE TABLE job_runs (job_id int, ran_at timestamptz, cutoff timestamptz, chunks_dropped int, wal_bytes numeric);`,
    presets: [
      { label: 'The chunks', sql: `SELECT * FROM chunks();
SELECT count(*) AS row_count, min(time), max(time) FROM conditions;`,
        note: 'Ten daily chunks of 1440 rows; the newest is half full (720). This is the table the retention job will trim.' },
      { label: 'Retention with DELETE', sql: `BEGIN;
INSERT INTO wal_mark SELECT pg_current_wal_insert_lsn();
DELETE FROM conditions WHERE time < '2026-11-06';
SELECT pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_insert_lsn(), (SELECT lsn FROM wal_mark))) AS wal_for_delete,
       (SELECT n_tup_del FROM pg_stat_xact_user_tables WHERE relname = 'conditions_20261105') AS rows_marked_dead;
ROLLBACK;`,
        note: 'Deleting one day writes **about 79 kB of WAL** for 1440 rows and leaves 1440 dead tuples for VACUUM. Rolled back, so the data is still there.' },
      { label: 'A retention job', sql: `-- a job procedure has the signature add_job() expects: (job_id int, config jsonb)
CREATE PROCEDURE drop_old_chunks(job_id int, config jsonb) LANGUAGE plpgsql AS $$
DECLARE
  r record; n int := 0; lsn0 pg_lsn := pg_current_wal_insert_lsn();
  cutoff timestamptz := (config->>'now')::timestamptz - (config->>'drop_after')::interval;
BEGIN
  FOR r IN SELECT * FROM chunks() WHERE range_end <= cutoff LOOP   -- whole chunk older than cutoff
    EXECUTE format('ALTER TABLE conditions DETACH PARTITION %s', r.chunk);
    EXECUTE format('DROP TABLE %s', r.chunk);
    n := n + 1;
  END LOOP;
  INSERT INTO job_runs VALUES (job_id, (config->>'now')::timestamptz, cutoff, n,
                               pg_wal_lsn_diff(pg_current_wal_insert_lsn(), lsn0));
END $$;

CALL drop_old_chunks(1000, '{"now": "2026-11-14 12:00+00", "drop_after": "7 days"}');
SELECT * FROM job_runs;
SELECT min(time) AS oldest_row, timestamptz '2026-11-14 12:00' - min(time) AS age FROM conditions;`,
        note: 'The cutoff is Nov 7 12:00, so the Nov 5 and Nov 6 chunks go, using a few kB of WAL for two whole days. Nov 7 stays because part of it is newer than the cutoff: the oldest row is **7 days 12:00** old.' },
      { label: 'A tiny job scheduler', sql: `CREATE TABLE jobs (job_id int PRIMARY KEY, proc_name text, schedule_interval interval, config jsonb,
                   next_start timestamptz, total_runs int DEFAULT 0, total_failures int DEFAULT 0, last_error text);
INSERT INTO jobs VALUES (1001, 'drop_old_chunks', '1 day', '{"drop_after": "5 days"}', '2026-11-14 12:00+00');

CREATE PROCEDURE run_due_jobs(p_now timestamptz) LANGUAGE plpgsql AS $$
DECLARE j record;
BEGIN
  FOR j IN SELECT * FROM jobs WHERE next_start <= p_now ORDER BY next_start LOOP
    BEGIN
      EXECUTE format('CALL %I($1, $2)', j.proc_name) USING j.job_id, j.config || jsonb_build_object('now', p_now);
      -- fixed schedule: next start = previous start + interval
      UPDATE jobs SET total_runs = total_runs + 1, next_start = j.next_start + j.schedule_interval, last_error = NULL
      WHERE job_id = j.job_id;
    EXCEPTION WHEN OTHERS THEN
      -- back off: failures x retry_period (5 minutes here), capped at 5 x schedule_interval
      UPDATE jobs SET total_runs = total_runs + 1, total_failures = total_failures + 1, last_error = SQLERRM,
             next_start = p_now + least((total_failures + 1) * interval '5 minutes', 5 * j.schedule_interval)
      WHERE job_id = j.job_id;
    END;
  END LOOP;
END $$;

CALL run_due_jobs('2026-11-14 12:00+00');
SELECT job_id, proc_name, schedule_interval, config, next_start, total_runs FROM jobs;
SELECT * FROM job_runs ORDER BY ran_at, job_id;`,
        note: 'This mimics TimescaleDB\'s scheduler and `timescaledb_information.jobs`: job 1001 ran, dropped Nov 7 and Nov 8 (cutoff Nov 9 12:00), and its **next_start** moved one day ahead.' },
      { label: 'A failing job backs off', sql: `UPDATE jobs SET config = '{"drop_after": "five days"}', next_start = '2026-11-15 12:00+00';
CALL run_due_jobs('2026-11-15 12:00+00');
CALL run_due_jobs('2026-11-15 12:05+00');
SELECT job_id, next_start, total_runs, total_failures, last_error FROM jobs;`,
        note: 'A bad config fails twice. Each failure pushes `next_start` further out (12:05, then 12:15), the pattern TimescaleDB uses: consecutive failures × `retry_period`, capped at 5 × the schedule, plus jitter.' },
    ],
  },
  production: {
    title: 'A 13-month lifecycle for fleet telemetry',
    context: 'A logistics company keeps GPS and engine telemetry in a hypertable with 1-day chunks. Ops needs raw data for 30 days, finance needs daily summaries for 13 months, and disk is the main cost.',
    problem: 'A nightly `DELETE … WHERE time < now() - interval \'30 days\'` ran for hours, generated gigabytes of WAL and left the table bloated. When someone added a retention policy, a continuous aggregate with a long refresh window silently lost its history.',
    solution: 'Policies, each one a background job: the columnstore after 1 day, raw retention after 30 days, a daily aggregate with a 3-day refresh window and its own 13-month retention. All four policies and `add_job` are **Community edition** features; on the Apache 2 edition call `drop_chunks` from pg_cron. Tiering to object storage (`add_tiering_policy`) exists only on Tiger Cloud.',
    sql: `CALL add_columnstore_policy('telemetry', after => INTERVAL '1 day');
SELECT add_retention_policy('telemetry', drop_after => INTERVAL '30 days');

SELECT add_continuous_aggregate_policy('telemetry_daily',
  start_offset => INTERVAL '3 days', end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');                 -- start_offset < drop_after
SELECT add_retention_policy('telemetry_daily', drop_after => INTERVAL '13 months');

-- inspect and tune the jobs
SELECT job_id, proc_name, schedule_interval, next_start FROM timescaledb_information.jobs;
SELECT job_id, last_run_status, total_failures FROM timescaledb_information.job_stats;
SELECT alter_job(job_id, config_merge => '{"drop_after": "45 days"}')   -- 2.29+
FROM timescaledb_information.jobs WHERE proc_name = 'policy_retention' AND hypertable_name = 'telemetry';

-- Apache 2 edition alternative (for example on Neon):
-- SELECT cron.schedule('0 1 * * *', $$SELECT drop_chunks('telemetry', INTERVAL '30 days')$$);`,
    outcome: 'Retention removes one chunk file per day instead of deleting millions of rows: dropping two daily chunks in the playground takes a few kB of WAL, while deleting one day row by row takes about 79 kB per 1,440 rows. The daily aggregate keeps 13 months of history after the raw data is gone.',
  },
  pitfalls: [
    { title: 'Retention shorter than the refresh window',
      symptom: 'Old days disappear from a continuous aggregate soon after a retention policy is added.',
      cause: 'A refresh covering a range whose raw chunks were dropped recomputes those buckets from no rows, and **deletes** them.',
      fix: 'Keep `drop_after` on the hypertable longer than the aggregate policy\'s `start_offset`, and give the aggregate its own, longer retention.',
      sql: `SELECT add_retention_policy('telemetry', drop_after => INTERVAL '30 days');
SELECT add_continuous_aggregate_policy('telemetry_daily', start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour', schedule_interval => INTERVAL '1 hour');` },
    { title: 'Data older than the cutoff is still there',
      symptom: 'After `drop_chunks(\'t\', INTERVAL \'30 days\')` some rows are 36 days old.',
      cause: 'Only chunks whose **entire range** is older than the cutoff are dropped. A 7-day chunk that straddles the cutoff stays.',
      fix: 'This is by design. Use a smaller chunk interval if the policy must be tighter, or filter in queries.' },
    { title: 'Replacing a job config by accident',
      symptom: '`ERROR: could not find hypertable_id in config for job` after `alter_job`.',
      cause: '`alter_job(…, config => …)` replaces the **whole** config object, including the `hypertable_id` the policy needs.',
      fix: 'Merge instead of replace: `config_merge` (2.29+) or `config || \'{…}\'`.',
      sql: `SELECT alter_job(1001, config_merge => '{"drop_after": "45 days"}');` },
    { title: 'Jobs that never run',
      symptom: '`job_stats` shows no recent runs, or `add_job` does not exist.',
      cause: 'Too few background workers (`timescaledb.max_background_workers`, default 16, must cover one scheduler per database plus concurrent jobs), the Apache edition (no `add_job`), or a serverless compute that was suspended.',
      fix: 'Raise `timescaledb.max_background_workers` and `max_worker_processes` (restart needed), check `SHOW timescaledb.license`, and on Neon use pg_cron while the compute is awake.' },
  ],
  pointers: [
    '`drop_chunks` / `add_retention_policy` drop a chunk only when its **whole range** is older than the cutoff. One retention policy per hypertable.',
    'Every policy is a **job**: see `timescaledb_information.jobs` and `job_stats`; change it with `alter_job`, run it with `CALL run_job(id)`.',
    'Keep raw retention **longer than** any continuous aggregate\'s `start_offset`, and retain the aggregate separately.',
    'Multi-node was removed in 2.14. Tiering to object storage is Tiger Cloud only; for sharding PostgreSQL see [Citus](/e3/sharding-citus).',
    '`drop_chunks` is **Apache 2 edition**; retention policies, `add_job` and the scheduler are **Community edition**.',
  ],
  sources: ['ddl-partitioning.html', 'sql-droptable.html', 'functions-admin.html', 'plpgsql-control-structures.html', 'bgworker.html',
    'tigerdata.com/docs/reference/timescaledb/data-retention/add_retention_policy', 'tigerdata.com/docs/reference/timescaledb/jobs-automation/add_job'],
}
