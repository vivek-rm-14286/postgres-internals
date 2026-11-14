import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { fmtBytes } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one checkpoint cycle, the full page images that follow it, a torn page and replay.
 * Record sizes were captured with pg_walinspect on PostgreSQL 18 (table sensors, fillfactor 80,
 * 2000 rows, VACUUMed, then CHECKPOINT): pg_control_checkpoint() gave redo 0/17B38D0 and
 * checkpoint 0/17B3928; UPDATE id=10 wrote 14,830 B (heap image 6,560 B + VM image 8,192 B),
 * id=11 on the same page 77 B, id=500 on block 5 6,633 B. With wal_compression = pglz: 4,346 / 77 / 4,176 B.
 * ---------------------------------------------------------------------------------------------- */

type Comp = 'off' | 'pglz'
type Buf = 'clean' | 'dirty' | 'imaged' | 'lost'
type Disk = 'old' | 'ok' | 'torn' | 'fixed'
interface W { k: 'old' | 'redo' | 'ckpt' | 'upd'; label: string; sub: string; bytes: number; fpi: number; lsn: string }
interface S { wal: W[]; buf: Buf[]; disk: Disk[]; ctrl: [string, string]; replay?: number; crashed?: boolean }

const SIZES: Record<Comp, { a: [number, number]; c: [number, number] }> = {
  off: { a: [14830, 14752], c: [6633, 6560] },
  pglz: { a: [4346, 4266], c: [4176, 4101] },
}
const BLOCKS = 9 // heap blocks 0..7 + the VM page

function build(comp: Comp): Step<S>[] {
  const z = SIZES[comp]
  const old: W = { k: 'old', label: 'earlier WAL', sub: 'initial load', bytes: 0, fpi: 0, lsn: '…' }
  const redo: W = { k: 'redo', label: 'REDO', sub: '30 B', bytes: 30, fpi: 0, lsn: '0/17B38D0' }
  const ckpt: W = { k: 'ckpt', label: 'CKPT', sub: '114 B', bytes: 114, fpi: 0, lsn: '0/17B3928' }
  const u1: W = { k: 'upd', label: 'id=10', sub: `${z.a[0].toLocaleString('en-US')} B`, bytes: z.a[0], fpi: z.a[1], lsn: '0/17B59A8' }
  const u2: W = { k: 'upd', label: 'id=11', sub: '77 B', bytes: 77, fpi: 0, lsn: '0/17BEF88' }
  const u3: W = { k: 'upd', label: 'id=500', sub: `${z.c[0].toLocaleString('en-US')} B`, bytes: z.c[0], fpi: z.c[1], lsn: '0/17BF000' }
  const dirty = Array<Buf>(BLOCKS).fill('dirty')
  const clean = Array<Buf>(BLOCKS).fill('clean')
  const set = <T,>(a: T[], i: number, v: T) => a.map((x, j) => (j === i ? v : x))
  const okDisk = Array<Disk>(BLOCKS).fill('ok')
  const prev: [string, string] = ['0/16EF920', '0/16EF920']
  const now: [string, string] = ['0/17B3928', '0/17B38D0']
  const b1 = set(set(clean, 0, 'imaged'), 8, 'imaged')
  const b3 = set(b1, 5, 'imaged')
  return [
    { title: 'Before: dirty pages in memory, WAL safely on disk', body: 'Changes so far live as **dirty buffers** in shared memory. The data file holds older page versions. That is fine: the WAL already describes every change.',
      state: { wal: [old], buf: dirty, disk: Array<Disk>(BLOCKS).fill('old'), ctrl: prev } },
    { title: 'CHECKPOINT starts by logging its redo point', body: 'The checkpointer writes `XLOG CHECKPOINT_REDO` at **0/17B38D0**. After a crash, replay will start here, so only changes from this LSN on must be redone.',
      state: { wal: [old, redo], buf: dirty, disk: Array<Disk>(BLOCKS).fill('old'), ctrl: prev } },
    { title: 'Flush every dirty buffer, spread over time', body: 'Writes are paced to end at `checkpoint_completion_target` (0.9) of the interval: 4.5 minutes of a 5-minute `checkpoint_timeout`. A manual `CHECKPOINT` runs at full speed.',
      state: { wal: [old, redo], buf: clean, disk: okDisk, ctrl: prev } },
    { title: 'Write the checkpoint record, then pg_control', body: '`CHECKPOINT_ONLINE` at **0/17B3928** says `redo 0/17B38D0`. `pg_control` now points at it, and segments before the redo segment can be recycled.',
      state: { wal: [old, redo, ckpt], buf: clean, disk: okDisk, ctrl: now } },
    { title: 'First change to block 0 after the checkpoint', body: comp === 'off'
      ? '`UPDATE … WHERE id = 10` logs a `HOT_UPDATE` carrying a **full page image** of block 0 (6,560 B; the free-space hole is skipped) plus one of the VM page (8,192 B): **14,830 bytes** to change one numeric value.'
      : 'With `wal_compression = pglz` the same UPDATE logs **4,346 bytes**: pglz saved 2,417 B on the heap image and nearly all of the mostly-empty VM page.',
      state: { wal: [old, redo, ckpt, u1], buf: b1, disk: okDisk, ctrl: now } },
    { title: 'Same page again: no image needed', body: '`UPDATE … WHERE id = 11` hits block 0 again. Its image is already in WAL since the redo point, so the record is just **77 bytes**.',
      state: { wal: [old, redo, ckpt, u1, u2], buf: b1, disk: okDisk, ctrl: now } },
    { title: 'A different page pays again', body: comp === 'off'
      ? '`id = 500` lives on block 5: another image, **6,633 bytes**. The VM page was imaged already. Right after every checkpoint, WAL volume jumps like this.'
      : '`id = 500` on block 5 costs **4,176 bytes** compressed. Compression trades CPU for less WAL, which also means less to archive and replicate.',
      state: { wal: [old, redo, ckpt, u1, u2, u3], buf: b3, disk: okDisk, ctrl: now } },
    { title: 'Crash while block 0 is being written', body: 'An 8 kB page is **16 sectors of 512 B**. Power fails mid-write: block 0 on disk is half new, half old. That is a **torn page**, and a row-level record cannot repair it.',
      state: { wal: [old, redo, ckpt, u1, u2, u3], buf: Array<Buf>(BLOCKS).fill('lost'), disk: set(okDisk, 0, 'torn'), ctrl: now, crashed: true } },
    { title: 'Recovery: pg_control → checkpoint → redo point', body: 'Startup reads `pg_control`, finds the checkpoint record, and starts replay at **0/17B38D0**. The first record for block 0 carries its full image, so the torn page is simply overwritten.',
      state: { wal: [old, redo, ckpt, u1, u2, u3], buf: Array<Buf>(BLOCKS).fill('lost'), disk: set(okDisk, 0, 'fixed'), ctrl: now, crashed: true, replay: 3 } },
    { title: 'Replay to the end of WAL, then open', body: 'Later records apply on top of the restored image (77 B for id=11, then block 5). Every page changed since the checkpoint is now consistent and the server accepts connections.',
      state: { wal: [old, redo, ckpt, u1, u2, u3], buf: set(set(set(clean, 0, 'dirty'), 5, 'dirty'), 8, 'dirty'), disk: set(okDisk, 0, 'fixed'), ctrl: now, replay: 5 } },
  ]
}

const bufTone: Record<Buf, Tone> = { clean: 'ok', dirty: 'new', imaged: 'header', lost: 'muted' }
const diskTone: Record<Disk, Tone> = { old: 'muted', ok: 'ok', torn: 'dead', fixed: 'pointer' }
const W0 = 840

function wWidth(w: W) {
  if (w.k === 'old') return 120
  if (w.k !== 'upd') return 52
  return Math.max(66, Math.min(250, w.bytes / 55))
}

function Diagram({ s }: { s: S }) {
  let x = 14
  const xs = s.wal.map((w) => { const a = x; x += wWidth(w) + 6; return a })
  const bx = (i: number) => 70 + i * 62
  return (
    <svg viewBox={`0 0 ${W0} 330`} className="w-full min-w-[720px]" role="img" aria-label="WAL, shared buffers and the data file through a checkpoint and a crash">
      <text x={14} y={16} fontSize={11} fontWeight={700} fill="var(--muted)">WAL (pg_wal/)</text>
      {s.wal.map((w, i) => {
        const t: Tone = w.k === 'old' ? 'muted' : w.k === 'redo' ? 'accent' : w.k === 'ckpt' ? 'header' : 'tuple'
        const wid = wWidth(w)
        const fpiW = w.fpi ? (w.fpi / w.bytes) * wid : 0
        const replaying = s.replay !== undefined && i >= 1 && i <= s.replay
        return (
          <motion.g key={w.label + w.lsn} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <rect x={xs[i]} y={26} width={wid} height={46} rx={5} fill={toneBg(t, 20)} stroke={tone(t)} strokeWidth={replaying ? 2.4 : 1} />
            {fpiW > 0 && <rect x={xs[i] + 2} y={28} width={fpiW - 4} height={42} rx={4} fill={toneBg('header', 30)} />}
            <text x={xs[i] + 6} y={44} fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{w.label}</text>
            <text x={xs[i] + 6} y={60} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">{w.sub}</text>
            {w.k !== 'old' && <text x={xs[i]} y={86} fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">{w.lsn}</text>}
          </motion.g>
        )
      })}
      {s.replay !== undefined && (
        <motion.path initial={false} animate={{ d: `M${xs[1] + 26},98 L${xs[s.replay] + wWidth(s.wal[s.replay]) / 2},98` }} stroke={tone('accent')} strokeWidth={2.5} markerEnd="url(#rp)" fill="none" />
      )}
      <defs><marker id="rp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" /></marker></defs>
      {s.replay !== undefined && <text x={xs[1]} y={114} fontSize={10.5} fill={tone('accent')} fontFamily="var(--font-mono)">replay from redo 0/17B38D0 →</text>}

      <text x={14} y={146} fontSize={11} fontWeight={700} fill="var(--muted)">shared_buffers</text>
      {Array.from({ length: BLOCKS }, (_, i) => {
        const st = s.buf[i], t = bufTone[st]
        return (
          <g key={`b${i}`}>
            <motion.rect x={bx(i)} y={156} width={54} height={40} rx={5} initial={false} animate={{ fill: toneBg(t, st === 'lost' ? 6 : 22), stroke: tone(t) }} />
            <text x={bx(i) + 27} y={174} textAnchor="middle" fontSize={11} fontWeight={700} fill={st === 'lost' ? 'var(--muted)' : 'var(--text)'} fontFamily="var(--font-mono)">{i === 8 ? 'vm 0' : `blk ${i}`}</text>
            <text x={bx(i) + 27} y={189} textAnchor="middle" fontSize={9.5} fill="var(--muted)">{st === 'imaged' ? 'imaged' : st === 'lost' ? 'gone' : st}</text>
          </g>
        )
      })}
      {s.crashed && <text x={130} y={146} fontSize={11} fontWeight={700} fill={tone('dead')}>memory lost</text>}

      <text x={14} y={226} fontSize={11} fontWeight={700} fill="var(--muted)">data file</text>
      {Array.from({ length: BLOCKS }, (_, i) => {
        const st = s.disk[i], t = diskTone[st]
        return (
          <g key={`d${i}`}>
            <motion.rect x={bx(i)} y={236} width={54} height={40} rx={5} initial={false} animate={{ fill: toneBg(t, 20), stroke: tone(t) }} />
            {st === 'torn' && <path d={`M${bx(i) + 4},256 l8,-5 l8,9 l8,-9 l8,9 l8,-9 l8,5`} stroke={tone('dead')} strokeWidth={2} fill="none" />}
            <text x={bx(i) + 27} y={254} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)" fontFamily="var(--font-mono)">{st === 'torn' ? '' : i === 8 ? 'vm 0' : `blk ${i}`}</text>
            <text x={bx(i) + 27} y={270} textAnchor="middle" fontSize={9.5} fill="var(--muted)">{st === 'old' ? 'stale' : st === 'torn' ? 'torn!' : st === 'fixed' ? 'from FPI' : 'current'}</text>
          </g>
        )
      })}
      <g>
        <rect x={650} y={150} width={176} height={126} rx={8} fill="var(--surface-2)" stroke="var(--border)" />
        <text x={662} y={170} fontSize={11} fontWeight={700} fill="var(--text)">global/pg_control</text>
        <text x={662} y={194} fontSize={10} fill="var(--muted)">latest checkpoint</text>
        <motion.text key={'c' + s.ctrl[0]} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} x={662} y={210} fontSize={12} fontWeight={700} fill={tone('header')} fontFamily="var(--font-mono)">{s.ctrl[0]}</motion.text>
        <text x={662} y={234} fontSize={10} fill="var(--muted)">redo point</text>
        <motion.text key={'r' + s.ctrl[1]} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} x={662} y={250} fontSize={12} fontWeight={700} fill={tone('accent')} fontFamily="var(--font-mono)">{s.ctrl[1]}</motion.text>
        <text x={662} y={268} fontSize={9.5} fill="var(--muted)">read first at startup</text>
      </g>
      <text x={14} y={312} fontSize={10} fill="var(--muted)">WAL boxes are not to scale (record widths ∝ bytes, capped). Shaded part of an UPDATE box = full page image bytes.</text>
    </svg>
  )
}

function CheckpointViz() {
  const [comp, setComp] = useState<Comp>('off')
  const steps = build(comp)
  return (
    <Stepper steps={steps} interval={3200}
      extra={<Segmented label="wal_compression" value={comp} onChange={setComp} options={[['off', 'wal_compression off'], ['pglz', 'pglz']]} />}
      render={(s) => {
        const since = s.wal.filter((w) => w.k === 'upd')
        const total = since.reduce((a, w) => a + w.bytes, 0), fpi = since.reduce((a, w) => a + w.fpi, 0)
        return (
          <div className="grid gap-3">
            <Legend items={[['accent', 'redo point'], ['header', 'checkpoint / full page image'], ['tuple', 'UPDATE record'], ['new', 'dirty buffer'], ['ok', 'clean / current'], ['dead', 'torn page']]} />
            <Diagram s={s} />
            <div className="grid grid-cols-3 gap-2">
              {[['WAL written by the UPDATEs', fmtBytes(total)], ['of which page images', total ? `${Math.round((fpi / total) * 100)}%` : '—'], ['UPDATEs since checkpoint', String(since.length)]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-surface-2 px-3 py-2"><p className="text-[11px] tracking-wide text-muted uppercase">{k}</p>
                  <motion.p key={v} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="font-mono text-lg font-bold">{v}</motion.p></div>
              ))}
            </div>
          </div>
        )
      }} />
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'checkpoints-fpw',
  module: 'm7',
  order: 2,
  title: 'Checkpoints and full page writes',
  tldr: [
    'A **checkpoint** flushes every dirty page to the data files and records a **redo point** in `pg_control`, so crash recovery only has to replay WAL written after it.',
    'Because a page write can be torn by a power failure, the first change to each page after a checkpoint logs a **full page image**, which makes recovery safe and makes WAL volume spike after every checkpoint.',
  ],
  visualizer: {
    title: 'One checkpoint cycle, then a crash',
    caption: 'Step through a checkpoint, three UPDATEs, a torn page and replay. Flip `wal_compression` to see the image sizes shrink.',
    Component: CheckpointViz,
  },
  playground: {
    extensions: ['pg_walinspect'],
    setup: `
CREATE TABLE sensors (id int PRIMARY KEY, reading numeric NOT NULL, note text) WITH (fillfactor = 80);
INSERT INTO sensors SELECT g, 20.0, md5(g::text) FROM generate_series(1, 2000) g;
VACUUM sensors;`,
    presets: [
      { label: 'pg_control and the knobs', sql: `SELECT checkpoint_lsn, redo_lsn, redo_wal_file, timeline_id, full_page_writes
FROM pg_control_checkpoint();

SELECT name, setting, unit FROM pg_settings
WHERE name IN ('checkpoint_timeout', 'max_wal_size', 'min_wal_size', 'checkpoint_completion_target',
               'checkpoint_warning', 'full_page_writes', 'wal_compression', 'data_checksums')
ORDER BY name;`,
        note: 'Defaults: a checkpoint every 300 s or before 1 GB of WAL, writes spread over 90% of the interval. `redo_lsn` is where crash recovery would start right now.' },
      { label: 'CHECKPOINT and its records', sql: `CHECKPOINT;

SELECT checkpoint_lsn, redo_lsn, checkpoint_lsn - redo_lsn AS bytes_apart FROM pg_control_checkpoint();

SELECT r.start_lsn, r.resource_manager, r.record_type, r.record_length, left(r.description, 60) AS description
FROM pg_control_checkpoint() c, pg_get_wal_records_info(c.redo_lsn, pg_current_wal_lsn()) r;`,
        note: '`CHECKPOINT_REDO` marks the redo point, `RUNNING_XACTS` snapshots open transactions for standbys, and `CHECKPOINT_ONLINE` names the redo LSN in its description.' },
      { label: 'First change after a checkpoint', sql: `CHECKPOINT;
SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);

UPDATE sensors SET reading = 21.5 WHERE id = 10;

SELECT resource_manager, record_type, record_length, fpi_length, block_ref
FROM pg_get_wal_records_info(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn());`,
        note: 'The `HOT_UPDATE` is about 14.8 kB: `(FPW)` images of heap block 0 (8192 minus the free-space hole) and of the visibility-map page, whose all-visible bit the UPDATE cleared.' },
      { label: 'Same page, next change', sql: `-- the previous preset again: a checkpoint, then a first change that images block 0
VACUUM sensors;
CHECKPOINT;
UPDATE sensors SET reading = 21.5 WHERE id = 10;

SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);

UPDATE sensors SET reading = 21.6 WHERE id = 11;
UPDATE sensors SET reading = 21.7 WHERE id = 500;

SELECT resource_manager, record_type, record_length, fpi_length, block_ref
FROM pg_get_wal_records_info(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn());`,
        note: 'id 11 is on block 0, already imaged since the checkpoint: about 77 bytes. id 500 is on block 5: a new image of about 6.6 kB. The small `PRUNE_ON_ACCESS` record is page cleanup done on the way.' },
      { label: 'Compress the page images', sql: `SET wal_compression = pglz;
CHECKPOINT;
SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);

UPDATE sensors SET reading = 22.5 WHERE id = 10;

SELECT record_type, record_length, fpi_length, block_ref
FROM pg_get_wal_records_info(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn());
RESET wal_compression;`,
        note: '`block_ref` now reports `compression saved: … method: pglz`. Here the image rides in an `FPI_FOR_HINT` record: reading the page set hint bits first, and with data checksums on that change is imaged too. `lz4` and `zstd` work only on servers built with those libraries; this one has pglz only.' },
      { label: 'A whole-table UPDATE, twice', sql: `CHECKPOINT;
SELECT set_config('lab.a', pg_current_wal_insert_lsn()::text, false);
UPDATE sensors SET reading = reading + 1;
SELECT set_config('lab.b', pg_current_wal_insert_lsn()::text, false);
UPDATE sensors SET reading = reading + 1;

SELECT pg_size_pretty(current_setting('lab.b')::pg_lsn - current_setting('lab.a')::pg_lsn) AS first_pass_after_checkpoint,
       pg_size_pretty(pg_current_wal_insert_lsn() - current_setting('lab.b')::pg_lsn)    AS second_pass,
       pg_relation_size('sensors') / 8192                                                AS heap_pages;`,
        note: 'The same statement writes far more WAL the first time after a checkpoint, because every page it touches is imaged once. Longer checkpoint intervals mean fewer images per hour.' },
    ],
  },
  production: {
    title: 'Taming WAL spikes on a write-heavy IoT database',
    context: 'An IoT platform updates the latest reading of 2 million devices continuously. The primary ships WAL to two standbys and to an archive bucket.',
    problem: 'WAL generation, network to replicas and archive cost all spiked right after each checkpoint. The server log showed `checkpoints are occurring too frequently` because `max_wal_size` (1 GB) was reached in under the 30 s `checkpoint_warning` window, so almost every update after a checkpoint paid for a full page image.',
    solution: 'Space checkpoints out so each hot page is imaged less often, keep the writes spread, and compress what remains. Then watch the counters to confirm checkpoints are timed, not requested.',
    sql: `ALTER SYSTEM SET max_wal_size = '16GB';
ALTER SYSTEM SET checkpoint_timeout = '15min';
ALTER SYSTEM SET wal_compression = 'lz4';
SELECT pg_reload_conf();

-- afterwards: most checkpoints should be timed, not requested
SELECT num_timed, num_requested FROM pg_stat_checkpointer;
SELECT wal_fpi, wal_bytes FROM pg_stat_wal;`,
    outcome: 'With one checkpoint per 15 minutes instead of one every few seconds, each hot page is imaged at most four times an hour. The FPI share of WAL (`wal_fpi` vs `wal_records`) dropped sharply, and so did replication and archive volume. The cost is longer crash recovery: up to one 15-minute cycle of WAL to replay, which the team measured and accepted.',
  },
  pitfalls: [
    { title: 'Checkpoints driven by max_wal_size',
      symptom: 'The log repeats `checkpoints are occurring too frequently (N seconds apart)` and `pg_stat_checkpointer.num_requested` grows faster than `num_timed`.',
      cause: '`max_wal_size` is too small for the write rate, so checkpoints are forced early. Each one flushes all dirty pages and restarts the full-page-image cycle.',
      fix: 'Raise `max_wal_size` until checkpoints are mostly timed. It is a soft limit, so leave disk headroom.',
      sql: `SELECT num_timed, num_requested, write_time, sync_time FROM pg_stat_checkpointer;` },
    { title: 'Turning off full_page_writes on ordinary storage',
      symptom: 'After a power failure, recovery completes but some pages are silently corrupt, or the server cannot start.',
      cause: 'Without page images, a torn 8 kB write cannot be repaired from row-level WAL. A battery-backed cache alone does not guarantee atomic 8 kB writes.',
      fix: 'Keep `full_page_writes = on` unless the storage guarantees atomic page writes (for example ZFS). Reduce the cost with longer checkpoint intervals and `wal_compression` instead.' },
    { title: 'checkpoint_completion_target = 1.0',
      symptom: 'Checkpoints regularly overrun into the next one and I/O latency gets bursty.',
      cause: 'A checkpoint also does work besides buffer writes. Targeting 100% of the interval leaves no slack, so the next checkpoint starts late.',
      fix: 'Keep the default 0.9. Spread writes further by lengthening `checkpoint_timeout`, not by raising the target.' },
  ],
  pointers: [
    'Checkpoint = **redo record → flush all dirty pages → checkpoint record → pg_control**.',
    'Triggered by **`checkpoint_timeout`** (5 min) or **`max_wal_size`** (1 GB, soft), writes spread by `checkpoint_completion_target` 0.9.',
    'The **first change to a page after a checkpoint logs its full image**; later changes to that page log only the delta.',
    'Recovery: read **pg_control**, jump to the checkpoint, **replay from the redo point** to the end of WAL.',
    'Fewer checkpoints = less WAL but longer recovery; **`wal_compression`** shrinks the images.',
  ],
  sources: ['wal-configuration.html', 'wal-reliability.html', 'wal-internals.html', 'runtime-config-wal.html', 'sql-checkpoint.html', 'pgwalinspect.html', 'functions-info.html'],
}
