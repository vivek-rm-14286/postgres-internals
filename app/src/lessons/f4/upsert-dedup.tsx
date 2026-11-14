import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Stepper, type Step } from '../../viz/Stepper'
import { Legend, Panel, Segmented, Tag, tone, toneBg, type Tone } from '../../viz/kit'
import { ResultTable, Sql, type ResultRow } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer, two modes.
 *  Upsert: a 4-row batch runs INSERT … ON CONFLICT ((lower(email))) DO UPDATE … WHERE plan changed.
 *          Each proposed row probes the unique index, then inserts, updates, or is skipped. The id each
 *          proposed row consumes, the RETURNING old/new values and the error text match PostgreSQL 18.
 *  Dedup:  messy rows → normalized key → row_number() per key → delete rn > 1 → unique index.
 * ---------------------------------------------------------------------------------------------- */

interface TRow { id: number; email: string; plan: string; t?: Tone; note?: string }
interface Incoming { email: string; plan: string; verdict?: 'insert' | 'update' | 'skip' | 'error' | 'probe' }
interface UState { table: TRow[]; batch: Incoming[]; probe?: string; returning: ResultRow[]; seq: number; error?: string; sql: string }

const BASE: TRow[] = [
  { id: 1, email: 'ana@shop.io', plan: 'free' },
  { id: 2, email: 'bo@shop.io', plan: 'pro' },
]
const UPSERT_SQL = `INSERT INTO contacts (email, plan) VALUES ($1, $2), …
ON CONFLICT ((lower(email))) DO UPDATE
  SET plan = excluded.plan
  WHERE contacts.plan IS DISTINCT FROM excluded.plan
RETURNING id, old.plan, new.plan;`
const BATCH: Incoming[] = [
  { email: 'ANA@shop.io', plan: 'pro' },
  { email: 'cy@shop.io', plan: 'free' },
  { email: 'bo@shop.io', plan: 'pro' },
]
const ret = (id: number, o: string | null, n: string | null): ResultRow => ({ key: `r${id}`, cells: [id, o, n], t: o === null ? 'new' : 'ok' })

const upsertSteps: Step<UState>[] = [
  { title: 'Before: two contacts, one unique index', body: 'A **unique expression index** on `lower(email)` is the **arbiter**: `ON CONFLICT ((lower(email)))` names it by its expression, so the planner infers it.',
    state: { table: BASE, batch: BATCH, returning: [], seq: 2, sql: UPSERT_SQL } },
  { title: "Row 1: 'ANA@shop.io' probes the index", body: 'The proposed row takes the next identity value (3) before the probe. `lower()` folds it to `ana@shop.io`, which already exists: **conflict**.',
    state: { table: BASE.map((r) => (r.id === 1 ? { ...r, t: 'accent' } : r)), batch: BATCH.map((b, i) => (i === 0 ? { ...b, verdict: 'probe' } : b)), probe: 'ana@shop.io', returning: [], seq: 3, sql: UPSERT_SQL } },
  { title: 'Conflict → DO UPDATE using excluded', body: '`excluded` is the row that was proposed. Its plan `pro` differs, so the `WHERE` passes and row 1 is updated in place. Id 3 is simply never used.',
    state: { table: [{ id: 1, email: 'ana@shop.io', plan: 'pro', t: 'ok', note: 'updated' }, BASE[1]], batch: BATCH.map((b, i) => (i === 0 ? { ...b, verdict: 'update' } : b)), returning: [ret(1, 'free', 'pro')], seq: 3, sql: UPSERT_SQL } },
  { title: "Row 2: 'cy@shop.io' has no match → INSERT", body: 'No index entry for `cy@shop.io`, so the insert goes ahead with id 4. In `RETURNING`, `old.plan` is NULL for an inserted row: that is how you tell inserts from updates in 18.',
    state: { table: [{ id: 1, email: 'ana@shop.io', plan: 'pro' }, BASE[1], { id: 4, email: 'cy@shop.io', plan: 'free', t: 'new', note: 'inserted' }], batch: BATCH.map((b, i) => (i === 0 ? { ...b, verdict: 'update' } : i === 1 ? { ...b, verdict: 'insert' } : b)), returning: [ret(1, 'free', 'pro'), ret(4, null, 'free')], seq: 4, sql: UPSERT_SQL } },
  { title: "Row 3: 'bo@shop.io' conflicts, WHERE is false", body: 'Plan is already `pro`, so the `WHERE` fails: no update, no new row version, nothing returned. The existing row is still **locked** until commit. Id 5 was consumed anyway.',
    state: { table: [{ id: 1, email: 'ana@shop.io', plan: 'pro' }, { ...BASE[1], t: 'header', note: 'locked, unchanged' }, { id: 4, email: 'cy@shop.io', plan: 'free' }], batch: BATCH.map((b, i) => ({ ...b, verdict: (['update', 'insert', 'skip'] as const)[i] })), returning: [ret(1, 'free', 'pro'), ret(4, null, 'free')], seq: 5, sql: UPSERT_SQL } },
  { title: 'Done: INSERT 0 2', body: 'The command tag counts rows inserted **or updated** (2). Each outcome is atomic even under concurrency: a parallel insert of the same email makes this row take the update path instead of failing.',
    state: { table: [{ id: 1, email: 'ana@shop.io', plan: 'pro' }, BASE[1], { id: 4, email: 'cy@shop.io', plan: 'free' }], batch: BATCH.map((b, i) => ({ ...b, verdict: (['update', 'insert', 'skip'] as const)[i] })), returning: [ret(1, 'free', 'pro'), ret(4, null, 'free')], seq: 5, sql: UPSERT_SQL } },
  { title: 'A batch that hits the same key twice', body: "`('dee@shop.io','pro'), ('DEE@shop.io','team')` both map to `dee@shop.io`. The second would update the row the first just inserted, so the whole statement fails and inserts nothing.",
    state: { table: [{ id: 1, email: 'ana@shop.io', plan: 'pro' }, BASE[1], { id: 4, email: 'cy@shop.io', plan: 'free' }], batch: [{ email: 'dee@shop.io', plan: 'pro', verdict: 'insert' }, { email: 'DEE@shop.io', plan: 'team', verdict: 'error' }], returning: [], seq: 7, error: 'ERROR 21000: ON CONFLICT DO UPDATE command cannot affect row a second time', sql: UPSERT_SQL } },
  { title: 'Fix: de-duplicate the batch first', body: '`DISTINCT ON (lower(email))` with an `ORDER BY` keeps one row per key (here the last one received). Now every key appears once and the upsert succeeds.',
    state: { table: [{ id: 1, email: 'ana@shop.io', plan: 'pro' }, BASE[1], { id: 4, email: 'cy@shop.io', plan: 'free' }, { id: 8, email: 'DEE@shop.io', plan: 'team', t: 'new', note: 'inserted' }], batch: [{ email: 'DEE@shop.io', plan: 'team', verdict: 'insert' }], returning: [ret(8, null, 'team')], seq: 8,
      sql: `INSERT INTO contacts (email, plan)
SELECT DISTINCT ON (lower(email)) email, plan
FROM batch ORDER BY lower(email), received_at DESC
ON CONFLICT ((lower(email))) DO UPDATE SET plan = excluded.plan;` } },
]

const verdictTone: Record<NonNullable<Incoming['verdict']>, Tone> = { insert: 'new', update: 'ok', skip: 'muted', error: 'dead', probe: 'accent' }

function UpsertView({ s }: { s: UState }) {
  return (
    <div className="grid gap-3">
      <Sql>{s.sql}</Sql>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.3fr]">
        <Panel title="Proposed rows (VALUES)">
          <div className="grid gap-1.5">
            {s.batch.map((b, i) => (
              <motion.div key={b.email + i} layout className="flex items-center justify-between gap-2 rounded-md border px-2 py-1 font-mono text-[12px]"
                style={{ borderColor: b.verdict ? tone(verdictTone[b.verdict]) : 'var(--line)', background: b.verdict ? toneBg(verdictTone[b.verdict], 14) : undefined }}>
                <span>{b.email} · {b.plan}</span>
                {b.verdict && b.verdict !== 'probe' && <Tag t={verdictTone[b.verdict]}>{b.verdict === 'skip' ? 'WHERE false' : b.verdict}</Tag>}
              </motion.div>
            ))}
          </div>
          {s.probe && <p className="mt-2 font-mono text-[11.5px]" style={{ color: tone.text('accent') }}>index probe: lower(email) = '{s.probe}' → found id 1</p>}
          <p className="mt-2 font-mono text-[11px] text-muted">identity sequence last_value = {s.seq}</p>
        </Panel>
        <ResultTable caption="contacts" fields={['id', 'email', 'plan', '']} rows={s.table.map((r) => ({ key: `t${r.id}`, cells: [r.id, r.email, r.plan, r.note ?? ''], t: r.t }))} />
      </div>
      {s.error
        ? <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border px-3 py-2 font-mono text-[12px]" style={{ borderColor: tone('dead'), background: toneBg('dead', 12), color: tone.text('dead') }}>{s.error}</motion.div>
        : <ResultTable caption="RETURNING id, old.plan, new.plan" fields={['id', 'old.plan', 'new.plan']} rows={s.returning} empty="(nothing returned yet)" />}
    </div>
  )
}

/* ---------------- dedup mode ---------------- */
interface DRow { id: number; email: string; updated: string; key?: string; rn?: number; gone?: boolean }
interface DState { rows: DRow[]; phase: 'raw' | 'key' | 'rank' | 'delete' | 'index'; sql: string }
const RAW: DRow[] = [
  { id: 1, email: 'ana@shop.io', updated: '01-04' },
  { id: 2, email: 'bo@shop.io', updated: '01-09' },
  { id: 3, email: ' Ana@Shop.io', updated: '02-11' },
  { id: 4, email: 'cy@shop.io', updated: '01-20' },
  { id: 5, email: 'BO@shop.io ', updated: '01-02' },
  { id: 6, email: 'ana@shop.io', updated: '03-01' },
]
const norm = (e: string) => e.trim().toLowerCase()
const keyed = RAW.map((r) => ({ ...r, key: norm(r.email) }))
const ranked = keyed.map((r) => ({ ...r, rn: keyed.filter((o) => o.key === r.key && o.updated > r.updated).length + 1 }))
const sortedRank = [...ranked].sort((a, b) => a.key!.localeCompare(b.key!) || a.rn! - b.rn!)
const dedupSteps: Step<DState>[] = [
  { title: 'Six rows, three people', body: 'Duplicates rarely match byte for byte. Case and stray spaces make `GROUP BY email` see five distinct values here.',
    state: { rows: RAW, phase: 'raw', sql: 'SELECT email, count(*) FROM contacts GROUP BY email;  -- 5 groups, wrong' } },
  { title: 'Normalize to a key', body: 'Decide what "the same person" means and compute it: `lower(btrim(email))`. Now there are three keys.',
    state: { rows: keyed, phase: 'key', sql: 'SELECT lower(btrim(email)) AS k, count(*) FROM contacts GROUP BY k HAVING count(*) > 1;' } },
  { title: 'Rank inside each key', body: '`row_number()` over `PARTITION BY` the key, ordered by the row to keep first (newest `updated_at`). The survivor gets **rn = 1**.',
    state: { rows: sortedRank, phase: 'rank', sql: `SELECT id, row_number() OVER (PARTITION BY lower(btrim(email))
                              ORDER BY updated_at DESC, id DESC) AS rn
FROM contacts;` } },
  { title: 'Delete every rn > 1', body: 'Join the ranking back on the **primary key** and delete the losers in one statement. Three rows go; one per person remains.',
    state: { rows: sortedRank.map((r) => ({ ...r, gone: r.rn! > 1 })), phase: 'delete', sql: `DELETE FROM contacts c USING (
  SELECT id, row_number() OVER (PARTITION BY lower(btrim(email))
                                ORDER BY updated_at DESC, id DESC) AS rn
  FROM contacts) d
WHERE c.id = d.id AND d.rn > 1;      -- DELETE 3` } },
  { title: 'Lock the door', body: 'Clean the survivors, then add a **unique index** on the same expression. From now on duplicates are rejected, and upserts have an arbiter.',
    state: { rows: sortedRank.filter((r) => r.rn === 1).map((r) => ({ ...r, email: r.key! })), phase: 'index', sql: `UPDATE contacts SET email = lower(btrim(email));
CREATE UNIQUE INDEX contacts_email_key ON contacts (lower(email));` } },
]

function DedupView({ s }: { s: DState }) {
  const keyTone: Record<string, Tone> = { 'ana@shop.io': 'tuple', 'bo@shop.io': 'pointer', 'cy@shop.io': 'header' }
  return (
    <div className="grid gap-3">
      <Sql>{s.sql}</Sql>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface scrollbar-thin">
        <table className="w-full border-collapse font-mono text-[12px]">
          <thead><tr className="border-b border-line text-left text-muted">
            <th className="px-2 py-1">id</th><th className="px-2 py-1">email (raw)</th><th className="px-2 py-1">updated_at</th>
            {s.phase !== 'raw' && <th className="px-2 py-1">key</th>}{(s.phase === 'rank' || s.phase === 'delete') && <th className="px-2 py-1">rn</th>}
          </tr></thead>
          <tbody>
            {s.rows.map((r) => {
              const t: Tone | undefined = r.gone ? 'dead' : r.key ? keyTone[r.key] : undefined
              return (
                <motion.tr key={r.id} layout transition={{ type: 'spring', stiffness: 200, damping: 26 }} animate={{ opacity: r.gone ? 0.5 : 1 }}
                  className="border-b border-line last:border-0" style={t ? { background: toneBg(t, 13), boxShadow: `inset 3px 0 0 ${tone(t)}` } : undefined}>
                  <td className="px-2 py-0.5">{r.id}</td>
                  <td className={`px-2 py-0.5 whitespace-pre ${r.gone ? 'line-through' : ''}`}>'{r.email}'</td>
                  <td className="px-2 py-0.5">2026-{r.updated}</td>
                  {s.phase !== 'raw' && <td className="px-2 py-0.5">{r.key}</td>}
                  {(s.phase === 'rank' || s.phase === 'delete') && <td className="px-2 py-0.5 font-bold" style={{ color: r.rn === 1 ? tone('ok') : tone('dead') }}>{r.rn}</td>}
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {s.phase === 'index' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border px-3 py-2 font-mono text-[12px]" style={{ borderColor: tone('ok'), background: toneBg('ok', 10) }}>
        INSERT INTO contacts (email) VALUES ('Ana@shop.io');<br /><span style={{ color: tone.text('dead') }}>ERROR 23505: duplicate key value violates unique constraint "contacts_email_key"</span>
      </motion.div>}
    </div>
  )
}

function UpsertViz() {
  const [mode, setMode] = useState<'upsert' | 'dedup'>('upsert')
  const extra = <Segmented label="Mode" value={mode} onChange={setMode} options={[['upsert', 'Upsert a batch'], ['dedup', 'Clean duplicates']]} />
  return (
    <div className="grid gap-3">
      {mode === 'upsert'
        ? <Stepper key="u" steps={upsertSteps} render={(s) => <UpsertView s={s} />} extra={extra} />
        : <Stepper key="d" steps={dedupSteps} render={(s) => <DedupView s={s} />} extra={extra} />}
      <Legend items={mode === 'upsert'
        ? [['accent', 'index probe'], ['ok', 'updated'], ['new', 'inserted'], ['header', 'locked, unchanged'], ['dead', 'error']]
        : [['tuple', 'key ana'], ['pointer', 'key bo'], ['header', 'key cy'], ['dead', 'deleted']]} />
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'upsert-dedup',
  module: 'f4',
  order: 2,
  title: 'Upserts and de-duplication',
  tldr: [
    'An **upsert** (`INSERT … ON CONFLICT DO UPDATE`) inserts a row or, if a unique index already holds its key, updates the existing row instead, atomically and in one statement.',
    'It needs a **unique index** to act as the arbiter, so cleaning existing duplicates (rank with `row_number()`, delete every rank above 1) and adding that index is usually the first step.',
  ],
  visualizer: {
    title: 'One batch through ON CONFLICT, and a duplicate clean-up',
    caption: 'Step through a batch: each proposed row probes the unique index, then inserts, updates or is skipped. Switch to **Clean duplicates** to rank, delete and lock the door with an index.',
    Component: UpsertViz,
  },
  playground: {
    setup: `
CREATE TABLE contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  updated_at timestamptz NOT NULL);
-- 2 000 clean contacts
INSERT INTO contacts (email, name, updated_at)
SELECT 'user' || g || '@example.com', 'User ' || g, timestamptz '2026-01-01 00:00+00' + g * interval '1 hour'
FROM generate_series(1, 2000) g;
-- 200 messy duplicates (case, spaces) that arrived later, and 40 exact copies
INSERT INTO contacts (email, name, plan, updated_at)
SELECT ' User' || g || '@Example.com', 'User ' || g, 'pro', timestamptz '2026-06-01 00:00+00' + g * interval '1 hour'
FROM generate_series(1, 2000, 10) g;
INSERT INTO contacts (email, name, updated_at)
SELECT 'user' || g || '@example.com', 'User ' || g, timestamptz '2025-12-01 00:00+00'
FROM generate_series(50, 2000, 50) g;
-- an import batch, with one key repeated
CREATE TABLE staging (email text, plan text, received_at timestamptz);
INSERT INTO staging VALUES
  ('user1@example.com', 'team', '2026-11-01 09:00+00'),
  ('new.person@example.com', 'free', '2026-11-01 09:01+00'),
  ('user2@example.com', 'free', '2026-11-01 09:02+00'),
  ('New.Person@example.com', 'pro', '2026-11-01 09:05+00');
-- helper: run a statement and report the error instead of failing
CREATE FUNCTION try_sql(q text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RETURN 'ok';
EXCEPTION WHEN OTHERS THEN RETURN SQLSTATE || ': ' || SQLERRM;
END $$;
-- helper: presets 3 and 4 in one call (does nothing when they have already run)
CREATE PROCEDURE clean_contacts() LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM contacts c USING (
    SELECT id, row_number() OVER (PARTITION BY lower(btrim(email))
                                  ORDER BY updated_at DESC, id DESC) AS rn
    FROM contacts) d
  WHERE c.id = d.id AND d.rn > 1;
  UPDATE contacts SET email = lower(btrim(email)) WHERE email <> lower(btrim(email));
  CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_key ON contacts (lower(email));
END $$;`,
    presets: [
      { label: '1. Find duplicates', sql: `SELECT count(*) AS rows,
       count(DISTINCT email) AS distinct_raw,
       count(DISTINCT lower(btrim(email))) AS distinct_people
FROM contacts;

SELECT lower(btrim(email)) AS person, count(*) AS copies, array_agg(id ORDER BY id) AS ids
FROM contacts
GROUP BY 1 HAVING count(*) > 1
ORDER BY copies DESC, person
LIMIT 5;`,
        note: '2 240 rows but only 2 000 people. Raw `DISTINCT email` sees 2 200 values because case and spaces hide 200 of the 240 duplicates; the other 40 are exact copies.' },
      { label: '2. Rank: who survives?', sql: `SELECT id, email, plan, updated_at,
       row_number() OVER (PARTITION BY lower(btrim(email))
                          ORDER BY updated_at DESC, id DESC) AS rn
FROM contacts
WHERE lower(btrim(email)) IN ('user1@example.com', 'user50@example.com', 'user51@example.com')
ORDER BY lower(btrim(email)), rn;`,
        note: 'The newest row per person gets **rn = 1**. The `id DESC` tiebreaker makes the choice deterministic when timestamps tie. Change the ORDER BY to keep the oldest or the most complete row instead.' },
      { label: '3. Delete the losers', sql: `DELETE FROM contacts c USING (
  SELECT id, row_number() OVER (PARTITION BY lower(btrim(email))
                                ORDER BY updated_at DESC, id DESC) AS rn
  FROM contacts) d
WHERE c.id = d.id AND d.rn > 1;

SELECT count(*) AS rows, count(DISTINCT lower(btrim(email))) AS people FROM contacts;

-- no primary key? ctid identifies a row version for the duration of one statement
CREATE TEMP TABLE raw_import AS SELECT * FROM (VALUES ('a'), ('a'), ('b')) v(x);
DELETE FROM raw_import r USING (
  SELECT ctid, row_number() OVER (PARTITION BY x) AS rn FROM raw_import) d
WHERE r.ctid = d.ctid AND d.rn > 1;
SELECT * FROM raw_import;`,
        note: '`DELETE 240` leaves 2 000 rows for 2 000 people. On a table with no key, `ctid` (the physical row address) does the same job inside one statement. Never store a ctid: UPDATE and VACUUM FULL change it.' },
      { label: '4. Lock the door', sql: `-- the duplicates must be gone first (preset 3 again; it deletes nothing if you already ran it)
DELETE FROM contacts c USING (
  SELECT id, row_number() OVER (PARTITION BY lower(btrim(email))
                                ORDER BY updated_at DESC, id DESC) AS rn
  FROM contacts) d
WHERE c.id = d.id AND d.rn > 1;

UPDATE contacts SET email = lower(btrim(email)) WHERE email <> lower(btrim(email));
CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_key ON contacts (lower(email));

SELECT try_sql($$INSERT INTO contacts (email, name, updated_at) VALUES ('USER7@example.com', 'x', now())$$) AS result;`,
        note: 'The unique **expression index** makes case-insensitive duplicates impossible: the insert fails with `23505 duplicate key value`. It is also the arbiter the next preset uses.' },
      { label: '5. Upsert with RETURNING old/new', sql: `CALL clean_contacts();   -- presets 3 and 4, in case you skipped them
SELECT last_value FROM contacts_id_seq;

INSERT INTO contacts AS c (email, name, plan, updated_at)
SELECT DISTINCT ON (lower(email)) email, split_part(email, '@', 1), plan, received_at
FROM staging
ORDER BY lower(email), received_at DESC
ON CONFLICT ((lower(email))) DO UPDATE
  SET plan = excluded.plan, updated_at = excluded.updated_at
  WHERE c.plan IS DISTINCT FROM excluded.plan
RETURNING c.id, c.email, old.plan AS old_plan, new.plan AS new_plan,
          old.id IS NULL AS inserted;

SELECT last_value FROM contacts_id_seq;`,
        note: 'user1 is updated (`old_plan` pro, `new_plan` team), New.Person is inserted (`inserted` = true) and user2 returns nothing because its plan did not change. The sequence advanced by 3 for 3 proposed rows, although only one was inserted.' },
      { label: '6. Same key twice in one statement', sql: `CALL clean_contacts();   -- presets 3 and 4, in case you skipped them

SELECT try_sql($$
  INSERT INTO contacts (email, name, plan, updated_at)
  SELECT email, 'x', plan, received_at FROM staging WHERE email ILIKE 'new.person%'
  ON CONFLICT ((lower(email))) DO UPDATE SET plan = excluded.plan
$$) AS without_dedup;

SELECT try_sql($$
  INSERT INTO contacts (email, name, plan, updated_at)
  SELECT DISTINCT ON (lower(email)) email, 'x', plan, received_at FROM staging
  WHERE email ILIKE 'new.person%' ORDER BY lower(email), received_at DESC
  ON CONFLICT ((lower(email))) DO UPDATE SET plan = excluded.plan
$$) AS with_dedup;`,
        note: 'Two staging rows map to one key, so the first form fails with `21000: ON CONFLICT DO UPDATE command cannot affect row a second time`. `DISTINCT ON` keeps the newest row per key and the statement succeeds.' },
      { label: '7. MERGE: sync with delete', sql: `CREATE TEMP TABLE crm_export AS
SELECT email, CASE WHEN id % 2 = 0 THEN 'team' ELSE plan END AS plan
FROM contacts WHERE id <= 6;

MERGE INTO contacts c
USING crm_export s ON lower(c.email) = lower(s.email)
WHEN MATCHED AND c.plan <> s.plan THEN UPDATE SET plan = s.plan
WHEN MATCHED THEN DO NOTHING
WHEN NOT MATCHED BY SOURCE AND c.id <= 10 THEN DELETE
RETURNING merge_action() AS action, c.id, old.plan AS old_plan, new.plan AS new_plan;`,
        note: 'MERGE runs the **first** WHEN clause that matches for each row and can also delete target rows missing from the source (`NOT MATCHED BY SOURCE`). It does not have ON CONFLICT\'s guarantee against concurrent inserts, so prefer ON CONFLICT for plain upserts.' },
    ],
  },
  production: {
    title: 'A nightly CRM import that kept creating duplicate customers',
    context: 'A B2B SaaS team imports leads from three marketing tools every night with `INSERT … SELECT FROM staging`, after checking `WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = s.email)`.',
    problem: 'Duplicates kept appearing: the check is case-sensitive, two tools send the same lead in one batch, and two import workers running in parallel both pass `NOT EXISTS` before either commits. Sales saw the same company twice, with split activity history.',
    solution: 'Pick a canonical key, merge the existing duplicates once, add a **unique expression index**, then switch the import to an upsert over a batch de-duplicated with `DISTINCT ON`. Use `RETURNING old/new` to log what changed.',
    sql: `-- one-off clean-up
DELETE FROM contacts c USING (
  SELECT id, row_number() OVER (PARTITION BY lower(btrim(email))
                                ORDER BY updated_at DESC, id DESC) AS rn
  FROM contacts) d
WHERE c.id = d.id AND d.rn > 1;
UPDATE contacts SET email = lower(btrim(email)) WHERE email <> lower(btrim(email));
CREATE UNIQUE INDEX CONCURRENTLY contacts_email_key ON contacts (lower(email));

-- nightly import
INSERT INTO contacts AS c (email, name, plan, updated_at)
SELECT DISTINCT ON (lower(btrim(email))) btrim(email), name, plan, received_at
FROM staging ORDER BY lower(btrim(email)), received_at DESC
ON CONFLICT ((lower(email))) DO UPDATE
  SET plan = excluded.plan, updated_at = excluded.updated_at
  WHERE c.updated_at < excluded.updated_at;`,
    outcome: 'The unique index makes a duplicate impossible, even with parallel workers: one worker inserts, the other takes the update path. On the playground data the clean-up removes 240 of 2 240 rows (11%), and later imports never add them back.',
  },
  pitfalls: [
    { title: 'Check-then-insert races',
      symptom: 'Occasional duplicates (or unique violations) under load, although the code checks first.',
      cause: 'Two sessions both run `SELECT … WHERE NOT EXISTS` before either commits, so both see no row and both insert. Plain MERGE has the same race.',
      fix: 'Use `INSERT … ON CONFLICT`, which turns a concurrent insert of the same key into the update (or no-op) path, backed by a unique index.' },
    { title: 'No arbiter index',
      symptom: '`ERROR: there is no unique or exclusion constraint matching the ON CONFLICT specification`.',
      cause: 'The conflict target must exactly match the columns or expression of a unique index. `ON CONFLICT (email)` does not match an index on `lower(email)`.',
      fix: 'Write the same expression: `ON CONFLICT ((lower(email)))`, or create the matching unique index. Prefer inference over `ON CONSTRAINT name`, so the index can be swapped later.' },
    { title: 'Updating rows that did not change',
      symptom: 'Upserts are slow, WAL volume is high and tables bloat although the data rarely changes.',
      cause: 'Every `DO UPDATE` writes a new row version even when the values are identical.',
      fix: 'Add a WHERE to the update so unchanged rows are skipped. They are still locked, but no new version is written.',
      sql: `ON CONFLICT (sku) DO UPDATE SET price = excluded.price
WHERE products.price IS DISTINCT FROM excluded.price` },
    { title: 'Gaps in ids after upserts',
      symptom: 'Identity values jump by hundreds after each import.',
      cause: 'Every proposed row takes a sequence value before the conflict check, and sequence values are never handed back.',
      fix: 'This is harmless: ids are identifiers, not counters. If gaps really matter, filter known keys out of the batch first, and do not use ids for numbering visible to users.' },
  ],
  pointers: [
    '`ON CONFLICT` needs a **unique index** whose columns or expression match the conflict target exactly.',
    '`excluded` is the proposed row. A `DO UPDATE … WHERE` that is false skips the update but still locks the row.',
    'A batch with the same key twice fails with **cannot affect row a second time**. De-duplicate with `DISTINCT ON` first.',
    'Clean duplicates with `row_number() OVER (PARTITION BY key ORDER BY keep_first)` and delete `rn > 1` by primary key (or `ctid` within one statement).',
    '**Going deeper:** [INSERT, UPDATE, DELETE, MERGE: what really happens](/m3/dml-lifecycle) shows the row versions each of these writes.',
  ],
  sources: ['sql-insert.html', 'sql-merge.html', 'dml-returning.html', 'ddl-system-columns.html', 'indexes-unique.html', 'indexes-expressional.html', 'functions-window.html', 'sql-select.html', 'functions-merge-support.html'],
}
