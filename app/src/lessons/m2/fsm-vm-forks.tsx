import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: one table's files, free space map and visibility map through nine real statements:
 *   CREATE TABLE ev (id int, payload text) WITH (autovacuum_enabled = false);  -- base/5/16442
 *   INSERT 280 rows of 200-byte payloads (34 rows per page, 9 pages) ...
 * File sizes come from pg_relation_size(rel, fork), FSM values from pg_freespace(), VM bits from
 * pg_visibility_map(), and the FSM tree node values from fsm_page_contents() on FSM block 2,
 * all captured on PostgreSQL 18. Live/dead row counts per page follow from the ids deleted.
 * ---------------------------------------------------------------------------------------------- */

interface Pg { live: number; dead: number; fsm: number | null; v: boolean; f: boolean }
interface S { node: number; files: [string, number][]; pages: Pg[]; changed: number[] }

const P = (live: number, dead: number, fsm: number | null, v = false, f = false): Pg => ({ live, dead, fsm, v, f })
const full = (fsm: number | null, v = false, f = false) => P(34, 0, fsm, v, f)
const F = (node: number, main: number, fsm: number, vm: number): [string, number][] =>
  [[`${node}`, main], ...(fsm ? [[`${node}_fsm`, fsm] as [string, number]] : []), ...(vm ? [[`${node}_vm`, vm] as [string, number]] : [])]

const base = (fsm: (number | null)[], vf: string, live = [34, 34, 34, 34, 34, 34, 34, 34, 8], dead = [0, 0, 0, 0, 0, 0, 0, 0, 0]) =>
  fsm.map((x, i) => P(live[i], dead[i], x, vf[i * 2] === 'V', vf[i * 2 + 1] === 'F'))

const LIVE_DEL = [4, 34, 34, 34, 13, 4, 34, 34, 8]
const DEAD_DEL = [30, 0, 0, 0, 21, 30, 0, 0, 0]
const LIVE_INS = [14, 34, 34, 34, 13, 4, 34, 34, 8]

const steps: Step<S>[] = [
  { title: 'CREATE TABLE ev', body: 'A new table is one empty file named after its **relfilenode**: `base/5/16442` (database OID 5, filenode 16442). No FSM, no VM yet.',
    state: { node: 16442, files: F(16442, 0, 0, 0), pages: [], changed: [] } },
  { title: 'INSERT 280 rows', body: '34 rows fit per page, so the main fork is **9 pages (72 KB)**. Bulk extension also created a 3-page **FSM fork** (24 KB). Every VM bit is still 0: nothing has been vacuumed.',
    state: { node: 16442, files: F(16442, 73728, 24576, 0), pages: [...Array(8)].map(() => full(128)).concat(P(8, 0, 0)), changed: [0, 1, 2, 3, 4, 5, 6, 7, 8] } },
  { title: 'VACUUM', body: 'VACUUM records page 8\'s free space (**6272 bytes**) in the FSM and creates the **VM fork**, setting **all-visible** on every page: index-only scans can now skip the heap.',
    state: { node: 16442, files: F(16442, 73728, 24576, 8192), pages: base([128, 128, 128, 128, 128, 128, 128, 128, 6272], 'V-V-V-V-V-V-V-V-V-'), changed: [8] } },
  { title: 'DELETE ids 1–30 and 150–200', body: 'Pages 0, 4 and 5 lose their **all-visible** bit at once: any change clears it. The FSM still says 128 bytes free, because the dead rows still occupy the space.',
    state: { node: 16442, files: F(16442, 73728, 24576, 8192), pages: base([128, 128, 128, 128, 128, 128, 128, 128, 6272], '--V-V-V-----V-V-V-', LIVE_DEL, DEAD_DEL), changed: [0, 4, 5] } },
  { title: 'VACUUM again', body: 'Dead rows are removed and the FSM is updated: page 0 → **7072**, page 4 → **5088**, page 5 → **7072**. All pages are all-visible again.',
    state: { node: 16442, files: F(16442, 73728, 24576, 8192), pages: base([7072, 128, 128, 128, 5088, 7072, 128, 128, 6272], 'V-V-V-V-V-V-V-V-V-', [4, 34, 34, 34, 13, 4, 34, 34, 8]), changed: [0, 4, 5] } },
  { title: 'INSERT 10 rows', body: 'The inserter asks the FSM for a page with room and gets **page 0**: the new rows have ctids (0,1), (0,2), … in recycled slots. Page 0 loses its VM bit; its FSM entry stays at 7072 until the next VACUUM.',
    state: { node: 16442, files: F(16442, 73728, 24576, 8192), pages: base([7072, 128, 128, 128, 5088, 7072, 128, 128, 6272], '--V-V-V-V-V-V-V-V-', LIVE_INS), changed: [0] } },
  { title: 'VACUUM (FREEZE)', body: 'Every tuple is frozen, so every page gets **all-visible and all-frozen**. Anti-wraparound vacuums can now skip the whole table. Page 0\'s FSM value drops to 4768.',
    state: { node: 16442, files: F(16442, 73728, 24576, 8192), pages: base([4768, 128, 128, 128, 5088, 7072, 128, 128, 6272], 'VFVFVFVFVFVFVFVFVF', LIVE_INS), changed: [0, 1, 2, 3, 4, 5, 6, 7, 8] } },
  { title: "UPDATE ev SET payload = 'z' WHERE id = 100", body: 'One small change on page 2 clears **both** of its bits. The next vacuum must visit that page again, and index-only scans must check the heap for it.',
    state: { node: 16442, files: F(16442, 73728, 24576, 8192), pages: base([4768, 128, 128, 128, 5088, 7072, 128, 128, 6272], 'VFVF--VFVFVFVFVFVF', LIVE_INS, [0, 0, 1, 0, 0, 0, 0, 0, 0]).map((p, i) => (i === 2 ? { ...p, live: 34 } : p)), changed: [2] } },
  { title: 'TRUNCATE ev', body: 'TRUNCATE does not empty the old file: it creates a **new relfilenode 16447** and drops the old files at commit. The table OID is still 16442, which is why you look paths up with `pg_relation_filepath()`.',
    state: { node: 16447, files: F(16447, 0, 0, 0), pages: [], changed: [] } },
]

const ROW = 236 // 232-byte tuple + 4-byte line pointer
const kb = (b: number) => (b === 0 ? '0 B' : `${b / 1024} KB`)

function Files({ s }: { s: S }) {
  return (
    <Panel title="$PGDATA/base/5/">
      <div className="grid gap-1 font-mono text-[12px] sm:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {s.files.map(([name, size]) => (
            <motion.div key={name} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
              className="flex items-center gap-2 rounded border px-2 py-1"
              style={{ borderColor: tone(name.endsWith('_fsm') ? 'new' : name.endsWith('_vm') ? 'ok' : 'tuple'), background: toneBg(name.endsWith('_fsm') ? 'new' : name.endsWith('_vm') ? 'ok' : 'tuple', 12) }}>
              <span className="font-semibold">{name}</span>
              <span className="text-muted">{name.endsWith('_fsm') ? 'free space map' : name.endsWith('_vm') ? 'visibility map' : 'main fork'}</span>
              <motion.span key={size} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="ml-auto">{kb(size)}</motion.span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-xs text-muted"><Md>{'Each fork splits into **1 GB segments** (`16442`, `16442.1`, …) once it grows. Unlogged tables add an `_init` fork.'}</Md></p>
    </Panel>
  )
}

function Pages({ s }: { s: S }) {
  if (!s.pages.length) return <Panel title="Heap pages"><p className="text-sm text-muted">No pages: the main fork is empty.</p></Panel>
  return (
    <Panel title="Heap pages: space use, FSM value, VM bits">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {s.pages.map((p, i) => {
          const live = p.live * ROW, dead = p.dead * ROW
          const ch = s.changed.includes(i)
          return (
            <motion.div key={i} layout animate={{ scale: ch ? [1, 1.05, 1] : 1 }} transition={{ duration: 0.5 }}
              className="rounded-md border p-1.5" style={{ borderColor: ch ? 'var(--accent)' : 'var(--border)', borderWidth: ch ? 2 : 1 }}>
              <p className="font-mono text-[10px] text-muted">page {i}</p>
              <div className="mt-1 flex h-16 w-full flex-col-reverse overflow-hidden rounded-sm border border-line" style={{ background: 'var(--c-free)' }}>
                <motion.div animate={{ height: `${(live / 8168) * 100}%` }} style={{ background: toneBg('tuple', 45) }} />
                <motion.div animate={{ height: `${(dead / 8168) * 100}%` }} style={{ background: toneBg('dead', 45) }} />
              </div>
              <p className="mt-1 font-mono text-[11px]" title="pg_freespace avail"><span className="text-muted">fsm </span>{p.fsm ?? '—'}</p>
              <div className="mt-0.5 flex gap-1 font-mono text-[10px]">
                {[['V', p.v], ['F', p.f]].map(([l, on]) => (
                  <span key={l as string} title={l === 'V' ? 'all-visible' : 'all-frozen'} className="rounded px-1" style={{ background: on ? toneBg(l === 'V' ? 'ok' : 'header', 35) : 'transparent', color: on ? 'var(--text)' : 'var(--muted)', border: `1px solid ${on ? tone(l === 'V' ? 'ok' : 'header') : 'var(--border)'}`, textDecoration: on ? undefined : 'line-through' }}>{l}</span>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </Panel>
  )
}

/** The bottom of the FSM leaf page's binary max-tree, computed from the per-page categories (avail / 32). */
function FsmTree({ s }: { s: S }) {
  const [need, setNeed] = useState(4000)
  if (!s.pages.length || s.pages.every((p) => !p.fsm)) return null
  const leaves = Array.from({ length: 16 }, (_, i) => Math.floor((s.pages[i]?.fsm ?? 0) / 32))
  const levels: number[][] = [leaves]
  while (levels[0].length > 1) { const l = levels[0]; levels.unshift(Array.from({ length: l.length / 2 }, (_, i) => Math.max(l[2 * i], l[2 * i + 1]))) }
  const cat = Math.ceil(need / 32)
  // descend from the top of this subtree, taking the left child whenever it is large enough
  const path: number[] = []
  if (levels[0][0] >= cat) { let idx = 0; path.push(0); for (let d = 1; d < levels.length; d++) { idx = levels[d][idx * 2] >= cat ? idx * 2 : idx * 2 + 1; path.push(idx) } }
  const W = 660, H = 204, rowH = 40
  const x = (d: number, i: number) => ((i + 0.5) / levels[d].length) * (W - 20) + 10
  return (
    <Panel title="Inside the FSM leaf page: a binary max-tree (values are categories = free bytes / 32)">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">An INSERT needs</span>
        <input type="range" min={100} max={8000} step={100} value={need} onChange={(e) => setNeed(+e.target.value)} aria-label="Bytes needed" className="w-40 accent-[var(--accent)]" />
        <span className="font-mono">{need} B → category ≥ {cat}</span>
        <span className="text-muted">{path.length ? `→ page ${path[path.length - 1]}` : '→ no page has room: extend the table'}</span>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]" role="img" aria-label="FSM max-tree">
          {levels.slice(1).map((l, dd) => l.map((_, i) => {
            const d = dd + 1, on = path[d] === i && path[d - 1] === Math.floor(i / 2)
            return <line key={`e${d}-${i}`} x1={x(d - 1, Math.floor(i / 2))} y1={(d - 1) * rowH + 22} x2={x(d, i)} y2={d * rowH + 8} stroke={on ? 'var(--accent)' : 'var(--border)'} strokeWidth={on ? 2 : 1} />
          }))}
          {levels.map((l, d) => l.map((v, i) => {
            const on = path[d] === i, leaf = d === levels.length - 1, real = !leaf || i < s.pages.length
            return (
              <g key={`n${d}-${i}`} opacity={real ? 1 : 0.35}>
                <rect x={x(d, i) - 17} y={d * rowH + 6} width={34} height={18} rx={4} fill={on ? toneBg('accent', 30) : toneBg(leaf ? 'new' : 'muted', 14)} stroke={on ? 'var(--accent)' : tone(leaf ? 'new' : 'muted')} />
                <motion.text key={v} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} x={x(d, i)} y={d * rowH + 19} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--text)" fontFamily="var(--font-mono)">{v}</motion.text>
                {leaf && real && <text x={x(d, i)} y={d * rowH + 36} textAnchor="middle" fontSize={9.5} fill="var(--muted)" fontFamily="var(--font-mono)">p{i}</text>}
              </g>
            )
          }))}
        </svg>
      </div>
      <p className="mt-1 text-xs text-muted"><Md>{'Each parent holds the **max** of its children, so one look at the root says whether any page has room. These node values match `fsm_page_contents()` on the real FSM page (leaves for pages 0–8 sit at nodes 4095–4103). A real leaf page tracks about 4,000 heap pages; two upper FSM levels aggregate the leaf pages.'}</Md></p>
    </Panel>
  )
}

function ForksViz() {
  return (
    <Stepper steps={steps} interval={3400} render={(s) => (
      <div className="grid gap-3">
        <Legend items={[['tuple', 'live rows'], ['dead', 'dead rows'], ['free', 'free space'], ['ok', 'VM all-visible'], ['header', 'VM all-frozen'], ['new', 'FSM']]} />
        <Files s={s} />
        <Pages s={s} />
        <FsmTree s={s} />
      </div>
    )} />
  )
}

export const lesson: Lesson = {
  slug: 'fsm-vm-forks',
  module: 'm2',
  order: 8,
  title: 'Files, forks, the free space map and visibility map',
  tldr: [
    'Each table is a set of files named by its **relfilenode**, split into 1 GB segments, with up to four forks: the **main** data, the **free space map**, the **visibility map** and, for unlogged tables, an **init** fork.',
    'The FSM lets inserts find a page with room without scanning the table, and the VM lets VACUUM skip clean pages and index-only scans skip the heap.',
  ],
  visualizer: {
    title: 'One table on disk: files, free space and visibility',
    caption: 'Step through nine statements and watch the fork files, each page\'s FSM value and VM bits change. Drag the slider under the FSM tree to see how an INSERT finds a page with enough room.',
    Component: ForksViz,
  },
  playground: {
    extensions: ['pg_freespacemap', 'pg_visibility', 'pageinspect'],
    setup: `
CREATE TABLE ev (id int, payload text) WITH (autovacuum_enabled = false);
INSERT INTO ev SELECT g, repeat('x', 200) FROM generate_series(1, 280) g;
CREATE VIEW forks AS
SELECT pg_relation_filepath('ev') AS path,
       pg_relation_size('ev', 'main') AS main, pg_relation_size('ev', 'fsm') AS fsm,
       pg_relation_size('ev', 'vm') AS vm,     pg_relation_size('ev', 'init') AS init;`,
    presets: [
      { label: 'Where is the file?', sql: `SELECT current_setting('data_directory') AS pgdata,
       oid AS db_oid, datname FROM pg_database WHERE datname = current_database();
SELECT 'ev'::regclass::oid AS table_oid, pg_relation_filenode('ev') AS relfilenode, * FROM forks;`,
        note: 'The path is `base/<database OID>/<relfilenode>`. The FSM fork already exists; the VM does not, because nothing has been vacuumed.' },
      { label: 'VACUUM builds the VM', sql: `VACUUM ev;
SELECT * FROM forks;
SELECT blkno, all_visible, all_frozen FROM pg_visibility_map('ev');
SELECT * FROM pg_freespace('ev');`,
        note: 'A VM fork appears with **all_visible** set for every page. `pg_freespace` reports free bytes in steps of 32.' },
      { label: 'DELETE: VM cleared, FSM stale', sql: `DELETE FROM ev WHERE id BETWEEN 1 AND 30 OR id BETWEEN 150 AND 200;
SELECT v.blkno, v.all_visible, f.avail AS fsm_avail
FROM pg_visibility_map('ev') v JOIN pg_freespace('ev') f USING (blkno);`,
        note: 'Pages 0, 4 and 5 lose all_visible immediately. Their FSM values do not move: the dead rows still occupy the space until VACUUM.' },
      { label: 'VACUUM updates the FSM', sql: `VACUUM ev;
SELECT * FROM pg_freespace('ev');
SELECT fsm_page_contents(get_raw_page('ev', 'fsm', 2));`,
        note: 'Pages 0, 4 and 5 now show thousands of free bytes. FSM block 2 is the leaf page: nodes 4095… are the per-page categories (bytes / 32), lower node numbers are the max-tree above them.' },
      { label: 'Freeze & the all-frozen bit', sql: `VACUUM (FREEZE) ev;
SELECT * FROM pg_visibility_map_summary('ev');
UPDATE ev SET payload = 'z' WHERE id = 100;
SELECT blkno, all_visible, all_frozen FROM pg_visibility_map('ev') WHERE NOT all_frozen;`,
        note: 'After the freeze every page is all-visible and all-frozen. One UPDATE clears both bits on the page it touches.' },
      { label: 'TRUNCATE gets a new file', sql: `SELECT pg_relation_filenode('ev') AS before;
TRUNCATE ev;
SELECT pg_relation_filenode('ev') AS after, 'ev'::regclass::oid AS oid_unchanged, * FROM forks;`,
        note: 'TRUNCATE swaps in a fresh, empty relfilenode while the table OID stays the same. Never assume filenode = OID.' },
      { label: 'Unlogged: the init fork', sql: `CREATE UNLOGGED TABLE scratch (id int PRIMARY KEY);
SELECT c.relname, c.relpersistence, pg_relation_filepath(c.oid) AS path,
       pg_relation_size(c.oid, 'init') AS init_fork_bytes
FROM pg_class c WHERE c.relname IN ('scratch', 'scratch_pkey');`,
        note: 'Unlogged relations get an `_init` fork: empty for the heap, one metapage (8192 bytes) for the B-tree. After a crash it is copied over the main fork, so the table comes back empty.' },
      { label: 'Which ALTERs rewrite the file?', sql: `CREATE TABLE rw (id int, qty int, label varchar(10));
INSERT INTO rw SELECT g, g % 10, 'x' FROM generate_series(1, 1000) g;
CREATE TABLE rw_log (step int GENERATED ALWAYS AS IDENTITY, ddl text, relfilenode oid);
INSERT INTO rw_log (ddl, relfilenode) VALUES ('start', pg_relation_filenode('rw'));

ALTER TABLE rw ADD COLUMN status text NOT NULL DEFAULT 'new';
INSERT INTO rw_log (ddl, relfilenode) VALUES ('ADD COLUMN ... DEFAULT constant', pg_relation_filenode('rw'));
ALTER TABLE rw ADD COLUMN total int GENERATED ALWAYS AS (qty * 10) VIRTUAL;
INSERT INTO rw_log (ddl, relfilenode) VALUES ('ADD COLUMN ... VIRTUAL', pg_relation_filenode('rw'));
ALTER TABLE rw ALTER COLUMN label TYPE varchar(50);
INSERT INTO rw_log (ddl, relfilenode) VALUES ('varchar(10) -> varchar(50)', pg_relation_filenode('rw'));
ALTER TABLE rw DROP COLUMN status;
INSERT INTO rw_log (ddl, relfilenode) VALUES ('DROP COLUMN', pg_relation_filenode('rw'));
ALTER TABLE rw ADD COLUMN total_s int GENERATED ALWAYS AS (qty * 10) STORED;
INSERT INTO rw_log (ddl, relfilenode) VALUES ('ADD COLUMN ... STORED', pg_relation_filenode('rw'));
ALTER TABLE rw ALTER COLUMN id TYPE bigint;
INSERT INTO rw_log (ddl, relfilenode) VALUES ('int -> bigint', pg_relation_filenode('rw'));

SELECT step, ddl, relfilenode,
       relfilenode <> lag(relfilenode) OVER (ORDER BY step) AS rewritten
FROM rw_log ORDER BY step;

SELECT attnum, attname, attisdropped, attgenerated
FROM pg_attribute WHERE attrelid = 'rw'::regclass AND attnum > 0 ORDER BY attnum;`,
        note: 'A new relfilenode means the whole table was copied under an ACCESS EXCLUSIVE lock. A constant DEFAULT is kept in the catalog (`attmissingval`), a VIRTUAL column and a longer varchar change only metadata, and DROP COLUMN just marks `attisdropped`. A STORED column and a type change rewrite every row.' },
    ],
  },
  production: {
    title: 'Index-only scans that still read the heap',
    context: 'A reporting query on an append-heavy `events` table uses a covering index and shows `Index Only Scan` in its plan, yet it reads thousands of heap pages.',
    problem: '`EXPLAIN (ANALYZE, BUFFERS)` reports a high **Heap Fetches** count. Autovacuum triggers on dead tuples, and an insert-only table produces almost none, so recently filled pages never had their **all-visible** bit set. Every row on those pages needed a heap visit.',
    solution: 'Make sure vacuum runs on insert-heavy tables (PostgreSQL triggers it on inserted rows via `autovacuum_vacuum_insert_threshold` / `_scale_factor`; lower them for this table) and check the VM directly.',
    sql: `SELECT * FROM pg_visibility_map_summary('events');      -- all_visible pages vs relpages
ALTER TABLE events SET (autovacuum_vacuum_insert_scale_factor = 0.01);
VACUUM (VERBOSE) events;                                   -- sets all-visible now
EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM events WHERE created_at > now() - interval '1 day';`,
    outcome: 'After the vacuum the VM covers the table and Heap Fetches drops towards zero, so the query reads only index pages. The VM is tiny (2 bits per heap page: one 8 KB VM page covers about 255 MB of heap), so it stays cached.',
  },
  pitfalls: [
    { title: 'Assuming the filenode equals the OID',
      symptom: 'A script that copies or inspects files by `pg_class.oid` finds the wrong file, or none, after a TRUNCATE or REINDEX.',
      cause: 'TRUNCATE, REINDEX, CLUSTER, VACUUM FULL and some ALTER TABLE forms assign a new relfilenode while keeping the OID. Some catalogs have `relfilenode = 0` and use a relation map.',
      fix: 'Always ask the server: `SELECT pg_relation_filepath(\'t\');`. Never touch files in the data directory of a running server.' },
    { title: 'Expecting DELETE to free space immediately',
      symptom: 'After a large DELETE, new inserts still extend the table instead of reusing space.',
      cause: 'Deleted rows still occupy their pages until VACUUM removes them, and the FSM only learns about free space from VACUUM.',
      fix: 'Run `VACUUM` (or let autovacuum run) after large deletes. For bulk purges, partition and `DROP` / `DETACH` whole partitions.' },
    { title: 'Treating TRUNCATE as a light, MVCC-safe DELETE',
      symptom: 'A nightly `TRUNCATE` of a staging table stalls every reader of that table, or a long report running in REPEATABLE READ suddenly sees the table as empty.',
      cause: 'A common claim is that TRUNCATE is fast because it uses lighter locking. It takes an **ACCESS EXCLUSIVE** lock, which blocks even SELECT, and swaps in a new empty relfilenode instead of marking rows dead. Transactions with an older snapshot then see the new, empty file.',
      fix: 'Use TRUNCATE for tables nobody reads concurrently, with a short `lock_timeout` so it gives up instead of queueing behind long queries. For tables under live reads, `DELETE` in batches plus VACUUM, or swap partitions.',
      sql: `SET lock_timeout = '2s';
TRUNCATE ev;` },
    { title: 'Using unlogged tables for data you cannot lose',
      symptom: 'After a crash or failover, an unlogged table is suddenly empty, and it never existed on the replica.',
      cause: 'Unlogged tables skip WAL. On crash recovery the `_init` fork replaces the main fork, and nothing is replicated.',
      fix: 'Use unlogged tables only for caches and staging data you can rebuild. Convert with `ALTER TABLE … SET LOGGED` before the data matters.' },
  ],
  pointers: [
    'Path = `base/<db OID>/<relfilenode>`, plus `_fsm`, `_vm`, `_init` forks and `.1`, `.2` segments every **1 GB**. Look it up with `pg_relation_filepath()`.',
    '**FSM**: one byte per page (free space / 32), organised as max-trees so a search is a short descent. Updated mainly by **VACUUM**.',
    '**VM**: two bits per heap page, **all-visible** and **all-frozen**; set only by VACUUM, cleared by any change to the page. Indexes have no VM.',
    'All-visible pages let **index-only scans** skip the heap; all-frozen pages let anti-wraparound VACUUM skip them.',
    'TRUNCATE and VACUUM FULL write a **new relfilenode**; unlogged tables restore from the **init fork** after a crash.',
  ],
  sources: ['storage-file-layout.html', 'storage-fsm.html', 'storage-vm.html', 'storage-init.html', 'pgfreespacemap.html', 'pgvisibility.html', 'routine-vacuuming.html'],
}
