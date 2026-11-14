import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { FieldTable, Legend, Panel, tone, toneBg } from '../../viz/kit'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a day of continuous archiving and a point-in-time recovery, following
 * continuous-archiving.html (25.3) and runtime-config-wal.html (19.5.5-19.5.6). PGlite cannot archive or
 * restore, so the timeline is simulated. backup_label values (START WAL LOCATION 0/2000028, CHECKPOINT
 * LOCATION 0/2000080) are from pg_backup_start/pg_backup_stop in the playground.
 * ---------------------------------------------------------------------------------------------- */

interface S { at: number; archived: number; incident: boolean; restored: boolean; replayTo?: number; tl2: boolean; conf: [string, string, string?][] }
const BACKUP = 1, BACKUP_END = 1.33, INCIDENT = 14.08
const hh = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`
const seg = (n: number, tl = 1) => `${String(tl).padStart(8, '0')}0000000000000${(n + 2).toString(16).toUpperCase().padStart(3, '0')}`

function build(target: number): Step<S>[] {
  const tooEarly = target < BACKUP_END
  const afterDrop = target >= INCIDENT
  const conf = (extra: [string, string, string?][] = []): [string, string, string?][] => [
    ['wal_level', 'replica'], ['archive_mode', 'on'], ['archive_command', "'cp %p /archive/%f'"], ...extra]
  const rec: [string, string, string?][] = [
    ['restore_command', "'cp /archive/%f %p'", 'fetch each segment back'],
    ['recovery_target_time', `'… ${hh(target)}'`],
    ['recovery_target_action', "'pause'", 'default: inspect, then resume'],
    ['recovery.signal', '(empty file)', 'enter targeted recovery'],
  ]
  return [
    { title: 'Archiving is on', body: 'Every completed 16 MB segment is handed to `archive_command`. It must return 0 only once the file is safely stored, and never overwrite a different file.',
      state: { at: 0.6, archived: 0, incident: false, restored: false, tl2: false, conf: conf() } },
    { title: '01:00 · base backup', body: '`pg_basebackup` (or `pg_backup_start`) forces a checkpoint and copies the data directory **while it changes**. `backup_label` records `START WAL LOCATION: 0/2000028`: replay must start there.',
      state: { at: BACKUP_END, archived: 1, incident: false, restored: false, tl2: false, conf: conf([['backup_label', 'START WAL LOCATION: 0/2000028', 'CHECKPOINT LOCATION: 0/2000080']]) } },
    { title: 'All day: WAL keeps flowing to the archive', body: 'The copy is inconsistent on its own; the archived WAL from backup start onwards repairs it. Together they can rebuild the cluster at **any moment** since 01:20.',
      state: { at: 13.9, archived: 13, incident: false, restored: false, tl2: false, conf: conf() } },
    { title: '14:05 · DROP TABLE invoices', body: 'A migration runs against production by mistake. The drop is written to WAL like any other change, and archived with the rest.',
      state: { at: 16, archived: 15, incident: true, restored: false, tl2: false, conf: conf() } },
    { title: 'Restore the base backup, set a target', body: `Stop the server, move the data directory aside, restore the 01:00 backup, empty \`pg_wal\`, set \`restore_command\` and \`recovery_target_time\` = **${hh(target)}**, create \`recovery.signal\`, start.`,
      state: { at: 16, archived: 15, incident: true, restored: true, tl2: false, conf: rec } },
    { title: tooEarly ? 'Replay fails: target before the end of the backup' : `Replay archived WAL up to ${hh(target)}`, body: tooEarly
      ? 'A backup is only consistent from its **end** (01:20). A target inside the backup window is rejected; pick a later target or an older backup.'
      : afterDrop ? `Replay stops at ${hh(target)}, but that is **after** 14:05, so the DROP was replayed too. Move the target before the incident and recover again.`
      : `The startup process fetches each segment with \`restore_command\` and replays it, stopping at the first commit after ${hh(target)}. The 14:05 DROP is never applied.`,
      state: { at: 16, archived: 15, incident: true, restored: true, replayTo: tooEarly ? BACKUP_END : target, tl2: false, conf: rec } },
    { title: 'Promote: a new timeline begins', body: tooEarly ? 'No promotion: recovery did not reach a consistent state.' : 'After checking the data, `pg_wal_replay_resume()` (or `recovery_target_action = promote`) ends recovery. The server starts **timeline 2**: new WAL files begin `00000002…` and `00000002.history` records where it branched.',
      state: { at: 16, archived: 15, incident: true, restored: true, replayTo: tooEarly ? BACKUP_END : target, tl2: !tooEarly, conf: tooEarly ? rec : [['timeline', '2'], ['00000002.history', `1  …  before ${hh(target)}`], ['invoices', afterDrop ? 'missing (target after the DROP)' : 'present']] } },
  ]
}

const X0 = 40, X1 = 820
const xh = (h: number) => X0 + (h / 24) * (X1 - X0)

function Timeline({ s }: { s: S }) {
  return (
    <svg viewBox="0 0 840 262" className="w-full min-w-[720px]" role="img" aria-label="Timeline of a base backup, archived WAL and a point-in-time recovery">
      {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
        <g key={h}><line x1={xh(h)} x2={xh(h)} y1={30} y2={232} stroke="var(--border)" strokeDasharray="2 4" />
          <text x={xh(h)} y={252} textAnchor="middle" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{hh(h)}</text></g>
      ))}
      <text x={X0} y={20} fontSize={11} fontWeight={700} fill="var(--muted)">timeline 1</text>
      <motion.line x1={xh(0)} y1={60} y2={60} initial={false} animate={{ x2: xh(s.at) }} stroke={tone('tuple')} strokeWidth={4} strokeLinecap="round" />
      {/* base backup */}
      <rect x={xh(BACKUP)} y={44} width={xh(BACKUP_END) - xh(BACKUP)} height={32} rx={4} fill={toneBg('header', 40)} stroke={tone('header')} />
      <text x={xh(BACKUP) + 2} y={94} fontSize={10.5} fontWeight={600} fill={tone('header')}>base backup</text>
      {s.tl2 && s.replayTo !== undefined && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <path d={`M${xh(s.replayTo)},60 C${xh(s.replayTo) + 20},60 ${xh(s.replayTo) + 10},208 ${xh(s.replayTo) + 40},208 L${xh(24) - 6},208`} fill="none" stroke={tone('ok')} strokeWidth={4} />
          <text x={Math.min(xh(s.replayTo) + 44, 690)} y={200} fontSize={10.5} fontWeight={700} fill={tone('ok')}>timeline 2 · 00000002…</text>
        </motion.g>
      )}
      {/* archived segments */}
      {Array.from({ length: s.archived }, (_, i) => (
        <motion.g key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <rect x={xh(i + 1.4)} y={112} width={xh(1) - xh(0) - 4} height={18} rx={3} fill={toneBg('pointer', 24)} stroke={tone('pointer')} />
        </motion.g>
      ))}
      {s.archived > 0 && <text x={xh(1.4)} y={146} fontSize={10} fill={tone('pointer')} fontFamily="var(--font-mono)">archive: {seg(0)} … {seg(s.archived - 1)}</text>}
      {s.incident && (
        <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <line x1={xh(INCIDENT)} x2={xh(INCIDENT)} y1={36} y2={84} stroke={tone('dead')} strokeWidth={2.5} />
          <text x={xh(INCIDENT) + 4} y={40} fontSize={10.5} fontWeight={700} fill={tone('dead')}>14:05 DROP TABLE invoices</text>
        </motion.g>
      )}
      {s.restored && s.replayTo !== undefined && (
        <>
          <motion.line x1={xh(BACKUP)} y1={168} y2={168} initial={{ x2: xh(BACKUP) }} animate={{ x2: xh(s.replayTo) }} transition={{ duration: 1.1 }} stroke={tone('accent')} strokeWidth={4} strokeLinecap="round" />
          <text x={xh(BACKUP)} y={186} fontSize={10.5} fill={tone('accent')}>replay from 0/2000028 → target {hh(s.replayTo)}</text>
        </>
      )}
      {s.restored && s.replayTo === undefined && <text x={xh(BACKUP)} y={172} fontSize={10.5} fill={tone('accent')}>restored base backup (01:00), waiting to replay</text>}
    </svg>
  )
}

function PitrViz() {
  const [target, setTarget] = useState(14)
  const steps = build(target)
  return (
    <Stepper steps={steps} interval={3200}
      extra={<label className="flex items-center gap-2 text-xs"><span className="font-mono text-muted">recovery_target_time</span>
        <input type="range" min={0.5} max={20} step={0.25} value={target} onChange={(e) => setTarget(+e.target.value)} className="w-32 accent-[var(--accent)]" aria-label="Recovery target time" />
        <b className="font-mono">{hh(target)}</b></label>}
      render={(s) => (
        <div className="grid gap-3">
          <Legend items={[['tuple', 'WAL on timeline 1'], ['header', 'base backup'], ['pointer', 'archived segments'], ['dead', 'the mistake'], ['accent', 'recovery replay'], ['ok', 'timeline 2']]} />
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2"><Timeline s={s} /></div>
          <Panel title="Configuration and files at this step"><FieldTable rows={s.conf} /></Panel>
        </div>
      )} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'backup-pitr',
  module: 'm7',
  order: 9,
  title: 'Backups and point-in-time recovery',
  tldr: [
    'PostgreSQL backs up either **logically** with `pg_dump` (SQL or an archive of one database) or **physically** with a base backup of the whole cluster plus the continuous stream of archived WAL.',
    'Physical backups enable **point-in-time recovery**: restore the base backup and replay archived WAL up to any moment after it, such as one second before a destructive mistake.',
  ],
  visualizer: {
    title: 'Recover to one minute before the mistake',
    caption: 'Step through a day with a base backup, archived WAL and a bad DROP, then recovery. Drag `recovery_target_time` to before 01:20, before 14:05, or after it and step again.',
    Component: PitrViz,
  },
  playground: {
    extensions: ['pg_walinspect'],
    setup: `
CREATE TABLE invoices (id int PRIMARY KEY, customer text NOT NULL, amount numeric(10,2) NOT NULL, paid boolean NOT NULL DEFAULT false);
INSERT INTO invoices SELECT g, 'cust_' || (g % 40), (g % 300) + 0.5, g % 3 = 0 FROM generate_series(1, 2000) g;`,
    presets: [
      { label: 'What pg_dump does inside the server', sql: `BEGIN ISOLATION LEVEL REPEATABLE READ, READ ONLY;
SELECT pg_export_snapshot() AS snapshot_id;
SELECT count(*) AS invoices_in_snapshot FROM invoices;
SELECT relation::regclass, mode, granted FROM pg_locks
WHERE pid = pg_backend_pid() AND locktype = 'relation' AND relation = 'invoices'::regclass;
SELECT backend_xmin IS NOT NULL AS holds_snapshot, backend_xid FROM pg_stat_activity WHERE pid = pg_backend_pid();
COMMIT;`,
        note: 'A dump is one **REPEATABLE READ** transaction: every table is read in the same snapshot, so the output is consistent. It holds **AccessShareLock** on each table it dumps until the end, and no XID. `pg_export_snapshot()` is how `pg_dump -j` workers share that one snapshot.' },
      { label: 'Archiving settings', sql: `SELECT name, setting FROM pg_settings
WHERE name IN ('wal_level', 'archive_mode', 'archive_command', 'archive_library', 'archive_timeout', 'summarize_wal')
ORDER BY name;
SELECT archived_count, failed_count, last_archived_wal FROM pg_stat_archiver;`,
        note: 'This playground runs with archiving off. A PITR-ready server needs `wal_level` replica or higher, `archive_mode = on` and a working `archive_command` or `archive_library`.' },
      { label: 'A low-level base backup', sql: `SELECT pg_backup_start(label => 'nightly', fast => true) AS start_lsn;
-- (copy the data directory with any tool here)
SELECT lsn AS stop_lsn, labelfile FROM pg_backup_stop(wait_for_archive => false);`,
        note: '`labelfile` is the `backup_label` you must save with the copy: START WAL LOCATION and CHECKPOINT LOCATION tell recovery where to begin.' },
      { label: 'Segment files and switches', sql: `SELECT pg_current_wal_lsn() AS lsn, pg_walfile_name(pg_current_wal_lsn()) AS current_file;
SELECT pg_switch_wal() AS switched_at;
INSERT INTO invoices VALUES (9001, 'cust_x', 10, false);
SELECT pg_current_wal_lsn() AS lsn, pg_walfile_name(pg_current_wal_lsn()) AS current_file;
SELECT * FROM pg_split_walfile_name(pg_walfile_name(pg_current_wal_lsn()));
SELECT name, size FROM pg_ls_waldir() ORDER BY name;`,
        note: '`pg_switch_wal` closes the current segment so it can be archived now (what `archive_timeout` does on a timer). Every file is a full 16 MB.' },
      { label: 'A named restore point', sql: `SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);
SELECT pg_create_restore_point('before_invoice_purge') AS restore_point_lsn;
DELETE FROM invoices WHERE paid;

SELECT start_lsn, resource_manager, record_type, left(description, 50) AS description
FROM pg_get_wal_records_info(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn())
WHERE record_type IN ('RESTORE_POINT', 'COMMIT') OR start_lsn = current_setting('lab.start')::pg_lsn;`,
        note: 'A `RESTORE_POINT` record sits in the WAL before the purge. Recovery could stop exactly there with `recovery_target_name = \'before_invoice_purge\'`.' },
      { label: 'Write the recovery settings', sql: `SELECT format($f$restore_command = 'cp /mnt/archive/%%f "%%p"'
recovery_target_time = %L
recovery_target_inclusive = off
recovery_target_action = 'pause'
-- then: touch $PGDATA/recovery.signal and start the server$f$,
  now() - interval '1 minute') AS postgresql_conf_lines;

SELECT now() AS time, pg_current_wal_lsn() AS lsn, pg_current_xact_id() AS xid;`,
        note: 'Targets can be a time, a restore point name, an LSN or an XID (one at a time). `pause` lets you check the data before ending recovery.' },
      { label: 'Incremental backups need WAL summaries', sql: `SHOW summarize_wal;
SELECT * FROM pg_get_wal_summarizer_state();
SELECT count(*) AS summaries FROM pg_available_wal_summaries();`,
        note: '`pg_basebackup --incremental` (17+) copies only blocks changed since a previous backup, using summaries written by the WAL summarizer. With `summarize_wal = off` there are none.' },
    ],
  },
  production: {
    title: 'Undoing a bad migration with PITR',
    context: 'A billing service takes a nightly `pg_basebackup` at 01:00 and archives WAL to object storage. At 14:05 a migration meant for staging dropped the `invoices` table in production.',
    problem: 'A nightly `pg_dump` would restore last night\'s state and lose 13 hours of invoices. Restoring the base backup alone would do the same.',
    solution: 'Restore the 01:00 base backup on a new host, replay archived WAL to 14:04, inspect, then copy the table back to production (or promote the recovered host). The old timeline stays intact in the archive.',
    sql: `# postgresql.conf on the recovery host
restore_command = 'aws s3 cp s3://wal-archive/%f %p'
recovery_target_time = '2026-11-10 14:04:00+00'
recovery_target_action = 'pause'
# touch $PGDATA/recovery.signal ; pg_ctl start
# once paused at the target:
#   psql -c "SELECT count(*) FROM invoices"
#   pg_dump -t invoices | psql -h prod billing`,
    outcome: 'Data loss is bounded by the recovery target, one minute here, instead of 13 hours. Recovery time is dominated by replaying 13 hours of WAL; newer incremental backups (`pg_basebackup --incremental` + `pg_combinebackup`) or a more recent base backup shorten it.',
  },
  pitfalls: [
    { title: 'An archive_command that lies',
      symptom: 'Recovery stops early with `could not open file` for a segment that the archiver reported as done.',
      cause: 'The command returned 0 without storing the file (for example `cp -i` or a script that ignores errors), so PostgreSQL recycled the segment.',
      fix: 'Return 0 only after the file is durably stored, refuse to overwrite existing files, and test restores regularly. `pg_stat_archiver.failed_count` must stay flat.',
      sql: `SELECT archived_count, failed_count, last_failed_wal, last_failed_time FROM pg_stat_archiver;` },
    { title: 'Archiving silently stopped and pg_wal filled',
      symptom: 'Disk usage of `pg_wal` grows until the server PANICs with a full disk.',
      cause: 'If `archive_command` keeps failing, segments cannot be recycled. PostgreSQL keeps retrying forever.',
      fix: 'Alert on `failed_count` and on `pg_wal` size; fix the archive target. Never delete files from `pg_wal` by hand.' },
    { title: 'Treating pg_dump as the only backup',
      symptom: 'After an incident the newest recoverable state is last night\'s dump.',
      cause: '`pg_dump` is a logical snapshot of one database at one moment; it cannot be combined with WAL for PITR.',
      fix: 'Use base backups plus WAL archiving for recovery, and keep `pg_dump` for migrations, partial restores and cross-version moves. Verify base backups with `pg_verifybackup`.' },
    { title: 'pg_restore refuses the dump file',
      symptom: '`pg_restore: error: input file appears to be a text format dump. Please use psql.`',
      cause: 'Plain format (the `pg_dump` default) and all `pg_dumpall` output are SQL scripts for `psql`. Only the custom, directory and tar archives are read by `pg_restore`, which is also what enables `-j` parallel restore and `-l` / `-L` to restore selected objects.',
      fix: 'Dump with `-Fc` or `-Fd` for anything you may restore selectively. Repeat `-t` / `-n` once per object (they do not take comma lists), use `-O` (`--no-owner`) when roles differ, and dump roles and tablespaces separately with `pg_dumpall --globals-only`, because `pg_dump` never includes them.',
      sql: `pg_dump -Fd -j 4 -t invoices -t customers -f /backups/billing.dir billing
pg_dumpall --globals-only > /backups/globals.sql
psql -f /backups/globals.sql postgres
pg_restore -j 4 -O -d billing_copy /backups/billing.dir` },
    { title: 'A long pg_dump blocks a migration and VACUUM',
      symptom: 'During the nightly dump an `ALTER TABLE` hangs, every query behind it queues, and dead rows pile up across the cluster.',
      cause: 'The dump holds ACCESS SHARE on every table until it finishes, which conflicts with the ACCESS EXCLUSIVE an ALTER needs. Its snapshot also stops VACUUM from removing rows deleted after the dump began.',
      fix: 'Schedule DDL outside dump windows and set `lock_timeout` on migrations. Take large dumps from a standby, or rely on base backups and use `pg_dump` for smaller, targeted exports.' },
  ],
  pointers: [
    '**pg_dump**: one database in one snapshot; plain SQL goes to **psql**, custom/directory archives to **pg_restore** (`-j`, `-L`); roles need **pg_dumpall --globals-only**.',
    '**Base backup + archived WAL** = PITR; replay must start at the backup\'s `START WAL LOCATION`.',
    '`restore_command` + `recovery.signal` + one **recovery_target_*** (time, name, lsn, xid, immediate).',
    'Ending recovery starts a **new timeline**; `.history` files record branch points.',
    'Incremental backups (17+) need **`summarize_wal`** and are rebuilt with **`pg_combinebackup`**.',
  ],
  sources: ['backup.html', 'backup-dump.html', 'continuous-archiving.html', 'runtime-config-wal.html', 'app-pgbasebackup.html', 'app-pgdump.html', 'app-pgcombinebackup.html', 'app-pgverifybackup.html', 'functions-admin.html'],
}
