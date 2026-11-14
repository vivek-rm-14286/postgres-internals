import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: logical decoding + pgoutput, as documented in logicaldecoding-output-plugin.html and
 * logical-replication-row-filter.html. WAL records of four interleaved transactions are decoded into a
 * reorder buffer per xid; nothing leaves until COMMIT; aborted transactions are discarded; then the
 * publication's row filter (region = 'EU') and column list (id, region, status) are applied, and UPDATEs
 * are transformed by Table 29.1 (old/new match → UPDATE, INSERT, DELETE or nothing).
 * ---------------------------------------------------------------------------------------------- */

interface Row { id: number; region: string; status: string; total: number }
interface Change { xid: number; op: 'INSERT' | 'UPDATE'; row: Row; old?: Row; label: string }
interface WalRec { xid: number; kind: 'change' | 'COMMIT' | 'ABORT'; change?: Change }
interface Out { key: string; xid: number; text: string; t: Tone }
interface S { cursor: number; buffers: Record<number, Change[]>; out: Out[]; sub: Row[]; done: number[]; aborted: number[] }

const r = (id: number, region: string, status: string, total: number): Row => ({ id, region, status, total })
const WAL: WalRec[] = [
  { xid: 801, kind: 'change', change: { xid: 801, op: 'INSERT', row: r(1, 'EU', 'new', 40), label: "INSERT (1,'EU','new',40)" } },
  { xid: 802, kind: 'change', change: { xid: 802, op: 'INSERT', row: r(2, 'US', 'new', 75), label: "INSERT (2,'US','new',75)" } },
  { xid: 801, kind: 'change', change: { xid: 801, op: 'UPDATE', old: r(1, 'EU', 'new', 40), row: r(1, 'EU', 'paid', 40), label: "UPDATE id=1 status='paid'" } },
  { xid: 803, kind: 'change', change: { xid: 803, op: 'INSERT', row: r(3, 'EU', 'new', 12), label: "INSERT (3,'EU','new',12)" } },
  { xid: 802, kind: 'COMMIT' },
  { xid: 803, kind: 'ABORT' },
  { xid: 801, kind: 'change', change: { xid: 801, op: 'UPDATE', old: r(1, 'EU', 'paid', 40), row: r(1, 'US', 'paid', 40), label: "UPDATE id=1 region='US'" } },
  { xid: 801, kind: 'COMMIT' },
  { xid: 804, kind: 'change', change: { xid: 804, op: 'UPDATE', old: r(2, 'US', 'new', 75), row: r(2, 'EU', 'new', 75), label: "UPDATE id=2 region='EU'" } },
  { xid: 804, kind: 'COMMIT' },
]
const match = (x?: Row) => !!x && x.region === 'EU'
const cols = (x: Row) => `(${x.id},'${x.region}','${x.status}')`

/** pgoutput's publication filter for one change: returns the message to send, or null. */
function publish(c: Change): { op: string; row?: Row; why: string } | null {
  if (c.op === 'INSERT') return match(c.row) ? { op: 'INSERT', row: c.row, why: 'new row matches' } : null
  const o = match(c.old), n = match(c.row)
  if (o && n) return { op: 'UPDATE', row: c.row, why: 'old ✓ new ✓' }
  if (!o && n) return { op: 'INSERT', row: c.row, why: 'old ✗ new ✓ → INSERT' }
  if (o && !n) return { op: 'DELETE', row: c.old, why: 'old ✓ new ✗ → DELETE' }
  return null
}

function build(): Step<S>[] {
  const steps: Step<S>[] = []
  let s: S = { cursor: -1, buffers: {}, out: [], sub: [], done: [], aborted: [] }
  steps.push({ title: 'Publisher WAL, ready to decode', body: 'Four transactions interleave in the WAL. The walsender of a **logical slot** reads it in LSN order and decodes each record into a row change. The table\'s replica identity is a unique index on (id, region), so old rows carry the region the filter needs.', state: s })
  WAL.forEach((w, i) => {
    const buffers = { ...s.buffers }
    let out = s.out, sub = s.sub, done = s.done, aborted = s.aborted
    let title = '', body = ''
    if (w.kind === 'change') {
      buffers[w.xid] = [...(buffers[w.xid] ?? []), w.change!]
      title = `xid ${w.xid}: ${w.change!.label}`
      body = 'Decoded and parked in the **reorder buffer** under its xid. Nothing is sent yet: the transaction might still abort.'
    } else if (w.kind === 'ABORT') {
      delete buffers[w.xid]; aborted = [...aborted, w.xid]
      title = `xid ${w.xid}: ABORT`
      body = 'The buffered change is thrown away. **Rolled-back transactions are never decoded** to the plugin, so the subscriber never hears of row 3.'
    } else {
      const changes = buffers[w.xid] ?? []
      delete buffers[w.xid]; done = [...done, w.xid]
      const msgs = changes.map((c) => ({ c, p: publish(c) }))
      const sent = msgs.filter((m) => m.p)
      if (sent.length) {
        out = [...out, { key: `b${w.xid}`, xid: w.xid, text: `BEGIN ${w.xid}`, t: 'muted' },
          ...sent.map((m, j) => ({ key: `m${w.xid}-${j}`, xid: w.xid, text: `${m.p!.op} ${cols(m.p!.row!)}  · ${m.p!.why}`, t: (m.p!.op === 'DELETE' ? 'dead' : m.p!.op === 'INSERT' ? 'ok' : 'accent') as Tone })),
          { key: `c${w.xid}`, xid: w.xid, text: `COMMIT ${w.xid}`, t: 'muted' }]
        for (const m of sent) {
          const row = m.p!.row!
          if (m.p!.op === 'INSERT') sub = [...sub.filter((x) => x.id !== row.id), row]
          if (m.p!.op === 'UPDATE') sub = sub.map((x) => (x.id === row.id ? row : x))
          if (m.p!.op === 'DELETE') sub = sub.filter((x) => x.id !== row.id)
        }
      }
      title = `xid ${w.xid}: COMMIT → decode and filter`
      body = w.xid === 802 ? 'xid 802 committed **first**, so it is emitted first. Its only change is a US row: the row filter drops it, and pgoutput skips the now-empty transaction entirely.'
        : w.xid === 801 ? 'Now xid 801\'s three changes go out in order. The status UPDATE matches before and after, so it stays an UPDATE. The region change makes the old row match but not the new one, so it is **sent as a DELETE**.'
        : 'Row 2 did not match before (US) but matches now (EU), so the UPDATE is **sent as an INSERT**. The subscriber ends up with exactly the EU rows, and only the published columns.'
    }
    s = { cursor: i, buffers, out, sub, done, aborted }
    steps.push({ title, body, state: s })
  })
  return steps
}
const STEPS = build()
const xidTone: Record<number, Tone> = { 801: 'tuple', 802: 'header', 803: 'dead', 804: 'new' }

function LogicalViz() {
  return (
    <div className="grid gap-5">
      <Stepper steps={STEPS} interval={3200} render={(s) => (
        <div className="grid gap-3">
          <Legend items={[['tuple', 'xid 801'], ['header', 'xid 802'], ['dead', 'xid 803 (aborts)'], ['new', 'xid 804'], ['ok', 'sent as INSERT'], ['accent', 'sent as UPDATE'], ['dead', 'sent as DELETE']]} />
          <div className="grid gap-3 md:grid-cols-3">
            <Panel title="1 · Publisher WAL (LSN order)">
              <ol className="grid gap-1">
                {WAL.map((w, i) => (
                  <li key={i} className="rounded border px-2 py-1 font-mono text-[11.5px]"
                    style={{ borderColor: i === s.cursor ? tone('accent') : 'var(--border)', background: i <= s.cursor ? toneBg(xidTone[w.xid], 12) : 'transparent', opacity: i <= s.cursor ? 1 : 0.55 }}>
                    <span style={{ color: tone.text(xidTone[w.xid]) }}>{w.xid}</span> {w.kind === 'change' ? w.change!.label : w.kind}
                  </li>
                ))}
              </ol>
            </Panel>
            <Panel title="2 · Reorder buffer (per xid)">
              <div className="grid min-h-24 gap-2">
                <AnimatePresence>
                  {Object.entries(s.buffers).map(([xid, changes]) => (
                    <motion.div key={xid} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="rounded-md border p-2" style={{ borderColor: tone(xidTone[+xid]), background: toneBg(xidTone[+xid], 10) }}>
                      <p className="font-mono text-[11px] font-bold">xid {xid}</p>
                      {changes.map((c, j) => <p key={j} className="font-mono text-[11px] text-muted">{c.label}</p>)}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {Object.keys(s.buffers).length === 0 && <p className="text-xs text-muted">empty</p>}
                {s.aborted.length > 0 && <p className="text-xs" style={{ color: tone.text('dead') }}>discarded on abort: xid {s.aborted.join(', ')}</p>}
              </div>
            </Panel>
            <Panel title="3 · pgoutput → subscriber">
              <p className="mb-1 font-mono text-[10.5px] text-muted">pub_eu: orders (id, region, status) WHERE region = 'EU' · replica identity: unique index (id, region)</p>
              <div className="grid gap-1">
                <AnimatePresence>
                  {s.out.map((o) => (
                    <motion.p key={o.key} layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="rounded px-1.5 py-0.5 font-mono text-[11px]" style={{ background: toneBg(o.t, 16) }}>{o.text}</motion.p>
                  ))}
                </AnimatePresence>
                {s.out.length === 0 && <p className="text-xs text-muted">nothing sent yet</p>}
              </div>
              <p className="mt-3 text-[11px] font-semibold tracking-wide text-muted uppercase">subscriber orders</p>
              <table className="mt-1 w-full font-mono text-[11.5px]">
                <thead><tr className="text-left text-muted"><th>id</th><th>region</th><th>status</th></tr></thead>
                <tbody>
                  {s.sub.map((x) => <motion.tr key={x.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}><td>{x.id}</td><td>{x.region}</td><td>{x.status}</td></motion.tr>)}
                  {s.sub.length === 0 && <tr><td colSpan={3} className="text-muted">(no rows)</td></tr>}
                </tbody>
              </table>
            </Panel>
          </div>
        </div>
      )} />
      <div className="border-t border-line pt-4"><FilterTable /></div>
    </div>
  )
}

function FilterTable() {
  const [oldR, setOld] = useState<'EU' | 'US'>('EU')
  const [newR, setNew] = useState<'EU' | 'US'>('US')
  const p = publish({ xid: 0, op: 'UPDATE', old: r(7, oldR, 'new', 1), row: r(7, newR, 'new', 1), label: '' })
  const res = p ? p.op : 'nothing sent'
  const t: Tone = !p ? 'muted' : p.op === 'DELETE' ? 'dead' : p.op === 'INSERT' ? 'ok' : 'accent'
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold">How an UPDATE crosses a row filter</p>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted">old row region</span><Segmented label="old region" value={oldR} onChange={setOld} options={[['EU', 'EU'], ['US', 'US']]} />
        <span className="text-muted">new row region</span><Segmented label="new region" value={newR} onChange={setNew} options={[['EU', 'EU'], ['US', 'US']]} />
        <motion.span key={res} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-md px-3 py-1 font-mono text-sm font-bold" style={{ background: toneBg(t, 20), color: tone.text(t) }}>→ {res}</motion.span>
      </div>
      <p className="text-xs text-muted"><Md>{'The filter is evaluated on the old and the new row. Evaluating the old row needs its values, which is why a filter on UPDATE/DELETE may only use **replica identity** columns.'}</Md></p>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'logical-replication',
  module: 'm7',
  order: 7,
  title: 'Logical replication',
  tldr: [
    '**Logical replication** decodes the WAL back into row-level INSERT, UPDATE and DELETE messages and streams them, per table, from a **publication** to a **subscription** on another server.',
    'Unlike physical streaming it can replicate a subset of tables, rows and columns, across major versions and platforms, into a database that stays writable.',
  ],
  visualizer: {
    title: 'From WAL records to filtered row changes',
    caption: 'Step through four interleaved transactions: decoding, the reorder buffer, commit order, an abort, and a publication with a row filter and column list. Then flip old and new values below.',
    Component: LogicalViz,
  },
  playground: {
    extensions: ['pg_walinspect'],
    setup: `
CREATE TABLE orders (id int PRIMARY KEY, region text NOT NULL, status text NOT NULL, total numeric(10,2), card_last4 text);
CREATE TABLE products (sku text PRIMARY KEY, name text, price numeric(10,2), price_with_vat numeric GENERATED ALWAYS AS (price * 1.2) STORED);
CREATE TABLE clicks (at timestamptz, url text);
INSERT INTO orders VALUES (1, 'EU', 'new', 40, '4242'), (2, 'US', 'new', 75, '1881');
INSERT INTO clicks VALUES (now(), '/home');
-- run a statement and return its error text instead of failing
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE msg text; det text;
BEGIN
  EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT, det = PG_EXCEPTION_DETAIL;
  RETURN 'ERROR: ' || msg || coalesce(' | ' || nullif(det, ''), '');
END $$;`,
    presets: [
      { label: 'Publication with a row filter and column list', sql: `CREATE PUBLICATION pub_eu
  FOR TABLE orders (id, region, status) WHERE (region = 'EU')
  WITH (publish = 'insert');

SELECT pubname, tablename, attnames, rowfilter FROM pg_publication_tables;
SELECT pubname, pubinsert, pubupdate, pubdelete, pubtruncate FROM pg_publication;`,
        note: 'An INSERT-only publication may filter on any column. `total` and `card_last4` are not in the column list, so they never leave the publisher (but a column list is not a security boundary).' },
      { label: 'Replica identity', sql: `SELECT relname, relreplident,
       CASE relreplident WHEN 'd' THEN 'default: primary key, if any' WHEN 'f' THEN 'full row'
                         WHEN 'n' THEN 'nothing' WHEN 'i' THEN 'index' END AS meaning
FROM pg_class WHERE relname IN ('orders', 'products', 'clicks');`,
        note: 'UPDATE and DELETE messages identify the old row by its replica identity. `clicks` has no primary key, so its default identity is empty.' },
      { label: 'Publishing UPDATEs needs an identity', sql: `CREATE PUBLICATION pub_clicks FOR TABLE clicks;
SELECT try_sql($$UPDATE clicks SET url = '/start'$$) AS update_without_identity;

ALTER TABLE clicks REPLICA IDENTITY FULL;
SELECT try_sql($$UPDATE clicks SET url = '/start'$$) AS update_with_full_identity;`,
        note: 'The error is raised **on the publisher**, even with no subscriber attached. `FULL` fixes it, at the cost of logging whole old rows and slow row lookups on the subscriber.' },
      { label: 'Row filters must use identity columns', sql: `CREATE PUBLICATION pub_eu_all FOR TABLE orders WHERE (region = 'EU');
SELECT try_sql($$UPDATE orders SET status = 'paid' WHERE id = 1$$) AS filter_on_non_identity;

DROP PUBLICATION pub_eu_all;
CREATE PUBLICATION pub_big FOR TABLE orders WHERE (id > 1000);
SELECT try_sql($$UPDATE orders SET status = 'paid' WHERE id = 1$$) AS filter_on_primary_key;`,
        note: 'A publication that sends UPDATEs must evaluate the filter on the old row, so it may only reference replica identity columns. Filtering on the primary key works.' },
      { label: 'Generated columns (new in 18)', sql: `ALTER TABLE products ADD COLUMN label text GENERATED ALWAYS AS (upper(name)) VIRTUAL;

CREATE PUBLICATION pub_products FOR TABLE products WITH (publish_generated_columns = stored);
CREATE PUBLICATION pub_prices FOR TABLE products (sku, price_with_vat);
SELECT try_sql('CREATE PUBLICATION pub_labels FOR TABLE products (sku, label)') AS virtual_in_column_list;

SELECT p.pubname, p.pubgencols, t.attnames
FROM pg_publication p JOIN pg_publication_tables t USING (pubname)
WHERE t.tablename = 'products' ORDER BY 1;`,
        note: 'With `publish_generated_columns = stored` the stored `price_with_vat` is sent; the **virtual** `label` never is, because it has no stored value. Listing a stored generated column in a column list publishes it even with the default `none`. On the subscriber the target column must be an ordinary column.' },
      { label: 'DDL is not replicated', sql: `DROP PUBLICATION IF EXISTS pub_all_cols, pub_some_cols;
CREATE PUBLICATION pub_all_cols FOR TABLE orders WITH (publish = 'insert');
CREATE PUBLICATION pub_some_cols FOR TABLE orders (id, region) WITH (publish = 'insert');

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon text;
SELECT pubname, attnames FROM pg_publication_tables
WHERE pubname IN ('pub_all_cols', 'pub_some_cols') ORDER BY pubname;`,
        note: 'The new column joins publications without a column list automatically: `pub_all_cols` gains `coupon`, `pub_some_cols` does not. The ALTER itself is not sent: the subscriber must add `coupon` first, or apply errors start.' },
      { label: 'The WAL is the source', sql: `SELECT current_setting('wal_level') AS wal_level;
SELECT set_config('lab.start', pg_current_wal_insert_lsn()::text, false);
SELECT pg_logical_emit_message(true, 'billing', 'invoice batch 42 closed');
SELECT resource_manager, record_type, description
FROM pg_get_wal_records_info(current_setting('lab.start')::pg_lsn, pg_current_wal_lsn());`,
        note: 'Logical decoding reads the same WAL as everything else; `pg_logical_emit_message` writes a record decoders pass through. `test_decoding` is the contrib output plugin that prints decoded changes as text through `pg_logical_slot_get_changes()`. Creating a logical slot needs `wal_level = logical`, which this playground runs without (it reports `replica`).' },
    ],
  },
  production: {
    title: 'Upgrading a major version with near-zero downtime',
    context: 'A marketplace runs PostgreSQL 16 with a 2 TB database and wants to move to 18. `pg_upgrade --link` would need a maintenance window it cannot get.',
    problem: 'Physical replication cannot cross major versions, and a dump and restore of 2 TB takes many hours of read-only time.',
    solution: 'Stand up an 18 cluster, copy the schema, and replicate logically. After the initial sync and catch-up, freeze writes for a minute, sync sequences (they are not replicated), and switch the application.',
    sql: `-- on the 16 publisher (wal_level = logical)
CREATE PUBLICATION upgrade_pub FOR ALL TABLES;

-- on the 18 subscriber, after: pg_dump --schema-only | psql
CREATE SUBSCRIPTION upgrade_sub
  CONNECTION 'host=old-primary dbname=shop user=replicator'
  PUBLICATION upgrade_pub;   -- in 18, streaming = parallel is the default

-- watch progress: every table should reach state 'r' (ready)
SELECT srrelid::regclass, srsubstate FROM pg_subscription_rel;

-- at cutover, for each sequence on the subscriber
SELECT setval('orders_id_seq', (SELECT max(id) FROM orders));`,
    outcome: 'The write freeze lasts as long as the final catch-up and the sequence sync, typically seconds to minutes instead of hours. Tables without a primary key were given one (or `REPLICA IDENTITY FULL`) beforehand, because their UPDATEs would otherwise fail on the publisher.',
  },
  pitfalls: [
    { title: 'UPDATE fails: "does not have a replica identity"',
      symptom: 'After adding a table to a publication, application UPDATEs and DELETEs on it fail on the **publisher**.',
      cause: 'The table has no primary key, so its default replica identity is empty, and a publication that publishes UPDATE/DELETE needs one.',
      fix: 'Add a primary key, or `REPLICA IDENTITY USING INDEX` on a unique non-null index, or as a last resort `REPLICA IDENTITY FULL`.',
      sql: `ALTER TABLE clicks ADD COLUMN id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY;` },
    { title: 'Replication stops on a conflict',
      symptom: 'The subscriber log repeats `conflict detected on relation ...: conflict=insert_exists` and lag grows.',
      cause: 'Incoming changes apply like normal DML. A row written locally on the subscriber violates a unique constraint, so the apply worker errors and retries forever.',
      fix: 'Fix the local data, or skip the remote transaction with `ALTER SUBSCRIPTION ... SKIP (lsn = ...)` using the finish LSN from the log (with the default `streaming = parallel` it can be missing; set streaming to `on` and let the error repeat). Skipping drops the whole transaction. In 18, per-type conflict counters show what keeps happening; the `*_origin_differs` ones need `track_commit_timestamp = on` on the subscriber.',
      sql: `SELECT subname, apply_error_count, sync_error_count, confl_insert_exists,
       confl_update_missing, confl_delete_missing, confl_multiple_unique_conflicts
FROM pg_stat_subscription_stats;` },
    { title: 'A dropped subscription leaves its slot behind',
      symptom: 'The publisher\'s `pg_wal` keeps growing after a subscriber was decommissioned.',
      cause: 'If the publisher was unreachable during `DROP SUBSCRIPTION`, or the slot was disassociated, the logical slot stays and retains WAL and catalog rows.',
      fix: 'Check `pg_replication_slots` on the publisher and drop orphaned slots; cap retention with `max_slot_wal_keep_size`.',
      sql: `SELECT slot_name, plugin, active, pg_size_pretty(pg_current_wal_lsn() - restart_lsn)
FROM pg_replication_slots WHERE slot_type = 'logical';` },
    { title: 'Logical slots vanish at failover',
      symptom: 'After promoting a physical standby of the publisher, every subscriber fails with `replication slot "..." does not exist`.',
      cause: 'A logical slot lives only on the server where it was created. Slots are not part of the WAL stream, so a standby has none unless they are synchronised to it.',
      fix: 'Create the subscription `WITH (failover = true)`. On the standby set `sync_replication_slots = on`, `hot_standby_feedback = on`, a `primary_slot_name`, and a `dbname` in `primary_conninfo`. On the primary list that physical slot in `synchronized_standby_slots`, so subscribers never get ahead of the standby.',
      sql: `ALTER SUBSCRIPTION upgrade_sub SET (failover = true);   -- while the subscription is disabled
-- on the standby: which slots are being kept in sync?
SELECT slot_name, failover, synced FROM pg_replication_slots WHERE slot_type = 'logical';` },
    { title: 'Sequences and DDL silently drift',
      symptom: 'After failing over to the subscriber, inserts fail with duplicate keys, or apply breaks after a schema change.',
      cause: 'Logical replication does not replicate DDL or sequence state.',
      fix: 'Apply schema changes to the subscriber first (additive changes), and run `setval` for every sequence before a switchover.' },
    { title: 'Publishing a generated column into a generated column',
      symptom: 'After enabling `publish_generated_columns = stored`, the subscriber\'s apply worker errors on every change to the table.',
      cause: 'The publisher now sends a value for `price_with_vat`, but on the subscriber that column is also `GENERATED`, and a generated column cannot accept a supplied value.',
      fix: 'Either leave the option at `none` and let the subscriber compute the column itself, or make the subscriber column an ordinary column. Virtual generated columns are never published.' },
  ],
  pointers: [
    '**Publication** (what to send) on the publisher, **subscription** (where from) on the subscriber, one logical **slot** per subscription.',
    'Decoding is in **commit order**; rolled-back transactions are **never sent**.',
    '**Replica identity** (default: primary key) identifies old rows; without one, published UPDATE/DELETE fail on the publisher.',
    '**Row filters** turn UPDATEs into INSERT/DELETE when rows cross the filter; **column lists** limit columns but are not security.',
    'Not replicated: **DDL, sequences, large objects**. Initial data is copied by table-sync workers, then changes stream. Active-active setups build on this: [multi-master](/e3/distributed-sql-multimaster).',
  ],
  sources: ['logical-replication.html', 'logical-replication-publication.html', 'logical-replication-row-filter.html', 'logical-replication-col-lists.html', 'logical-replication-gencols.html', 'logical-replication-conflicts.html', 'logical-replication-restrictions.html', 'logical-replication-architecture.html', 'logicaldecoding-explanation.html', 'logicaldecoding-output-plugin.html', 'sql-createpublication.html'],
}
