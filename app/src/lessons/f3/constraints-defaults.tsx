import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, Null, OutcomeBox, TableCard, TRY_FN, type Outcome } from './_ui'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: the constraint gatekeeper. A candidate row for `accounts` passes through the checks in
 * the order PostgreSQL applies them: defaults are filled (the identity value is drawn here), then
 * NOT NULL, then CHECK, then the unique indexes, then the foreign key at the end of the statement.
 * The first failing gate rejects the row with the same message and SQLSTATE the server sends.
 * ---------------------------------------------------------------------------------------------- */

type Choice3 = 'new' | 'dup' | 'null'
type PlanOpt = 'omit' | 'pro' | 'gold'
type SeatOpt = 'omit' | '5' | '0' | 'null'
interface Acc { id: number; email: string; username: string | null; plan: string; seats: number }
interface Cand { id: number; email: string | null; username: string | null; plan: string; seats: number | null }

const EMAILS = ['bo@example.com', 'cy@example.com', 'dee@example.com', 'eli@example.com', 'fay@example.com', 'gus@example.com', 'hal@example.com', 'ivy@example.com']
const NAMES = ['bo', 'cy', 'dee', 'eli', 'fay', 'gus', 'hal', 'ivy']
const PLANS = ['free', 'pro', 'team']

const GATES: { name: string; t: string; rule: string }[] = [
  { name: 'Defaults', t: 'fill in', rule: '`id` ← nextval, `plan` ← \'free\', `seats` ← 1, `created_at` ← now()' },
  { name: 'NOT NULL', t: '23502', rule: '`id`, `email`, `plan`, `seats`, `created_at` must have a value' },
  { name: 'CHECK', t: '23514', rule: '`seats_positive`: seats > 0' },
  { name: 'UNIQUE', t: '23505', rule: 'one index each: `accounts_pkey`, `…email_key`, `…username_key`' },
  { name: 'FOREIGN KEY', t: '23503', rule: '`accounts_plan_fkey`: plan must exist in `plans`' },
]

const lit = (v: string | number | null) => (v === null ? 'null' : String(v))
const pgNow = () => new Date().toISOString().replace('T', ' ').replace('Z', '+00')

function evaluate(c: Cand, rows: Acc[], nnd: boolean): { gate: number; o: Outcome } {
  const failing = `DETAIL: Failing row contains (${[c.id, c.email, c.username, c.plan, c.seats, pgNow()].map(lit).join(', ')}).`
  if (c.email === null) return { gate: 1, o: { ok: false, code: '23502', title: 'ERROR: null value in column "email" of relation "accounts" violates not-null constraint', detail: failing } }
  if (c.seats === null) return { gate: 1, o: { ok: false, code: '23502', title: 'ERROR: null value in column "seats" of relation "accounts" violates not-null constraint', detail: failing } }
  if (!(c.seats > 0)) return { gate: 2, o: { ok: false, code: '23514', title: 'ERROR: new row for relation "accounts" violates check constraint "seats_positive"', detail: failing } }
  if (rows.some((r) => r.email === c.email)) return { gate: 3, o: { ok: false, code: '23505', title: 'ERROR: duplicate key value violates unique constraint "accounts_email_key"', detail: `DETAIL: Key (email)=(${c.email}) already exists.` } }
  if (rows.some((r) => (c.username === null ? nnd && r.username === null : r.username === c.username)))
    return { gate: 3, o: { ok: false, code: '23505', title: 'ERROR: duplicate key value violates unique constraint "accounts_username_key"', detail: `DETAIL: Key (username)=(${lit(c.username)}) already exists.` } }
  if (!PLANS.includes(c.plan)) return { gate: 4, o: { ok: false, code: '23503', title: 'ERROR: insert or update on table "accounts" violates foreign key constraint "accounts_plan_fkey"', detail: `DETAIL: Key (plan)=(${c.plan}) is not present in table "plans".` } }
  return { gate: 5, o: { ok: true, title: 'INSERT 0 1', detail: `Row stored with **id ${c.id}**.${c.username === null ? ' A NULL username never collides with another NULL unless the constraint says `NULLS NOT DISTINCT`.' : ''}` } }
}

const SCENARIOS: { label: string; e: Choice3; u: Choice3; p: PlanOpt; s: SeatOpt }[] = [
  { label: 'Valid signup', e: 'new', u: 'new', p: 'omit', s: 'omit' },
  { label: 'No email', e: 'null', u: 'new', p: 'omit', s: 'omit' },
  { label: 'Zero seats', e: 'new', u: 'new', p: 'pro', s: '0' },
  { label: 'Email taken', e: 'dup', u: 'new', p: 'omit', s: 'omit' },
  { label: 'Unknown plan', e: 'new', u: 'new', p: 'gold', s: '5' },
  { label: 'NULL username', e: 'new', u: 'null', p: 'omit', s: 'omit' },
]

function GatekeeperViz() {
  const [rows, setRows] = useState<Acc[]>([{ id: 1, email: 'ana@example.com', username: 'ana', plan: 'free', seats: 1 }])
  const [nextId, setNextId] = useState(2)
  const [e, setE] = useState<Choice3>('new')
  const [u, setU] = useState<Choice3>('new')
  const [p, setP] = useState<PlanOpt>('omit')
  const [s, setS] = useState<SeatOpt>('omit')
  const [nnd, setNnd] = useState(false)
  const [run, setRun] = useState<{ cand: Cand; stop: number; o: Outcome; n: number } | null>(null)
  const [at, setAt] = useState(-1)

  const freshEmail = EMAILS.find((x) => !rows.some((r) => r.email === x)) ?? 'zed@example.com'
  const freshName = NAMES.find((x) => !rows.some((r) => r.username === x)) ?? 'zed'
  const emailVal = e === 'new' ? freshEmail : e === 'dup' ? 'ana@example.com' : null
  const nameVal = u === 'new' ? freshName : u === 'dup' ? 'ana' : null

  const cols = ['email', 'username', ...(p !== 'omit' ? ['plan'] : []), ...(s !== 'omit' ? ['seats'] : [])]
  const q = (v: string | null) => (v === null ? 'NULL' : `'${v}'`)
  const vals = [q(emailVal), q(nameVal), ...(p !== 'omit' ? [q(p)] : []), ...(s !== 'omit' ? [s === 'null' ? 'NULL' : s] : [])]
  const sql = `INSERT INTO accounts (${cols.join(', ')}) VALUES (${vals.join(', ')});`

  const insert = () => {
    const cand: Cand = { id: nextId, email: emailVal, username: nameVal, plan: p === 'omit' ? 'free' : p, seats: s === 'omit' ? 1 : s === 'null' ? null : Number(s) }
    const res = evaluate(cand, rows, nnd)
    setNextId(nextId + 1) // nextval() runs while defaults are filled, so even a rejected row uses up an id
    setRun({ cand, stop: res.gate, o: res.o, n: (run?.n ?? 0) + 1 })
    setAt(0)
  }
  const last = run ? Math.min(run.stop, GATES.length - 1) : -1
  useEffect(() => {
    if (!run || at < 0 || at > last) return
    const t = setTimeout(() => {
      if (at === last && run.o.ok) setRows((rs) => [...rs, { id: run.cand.id, email: run.cand.email!, username: run.cand.username, plan: run.cand.plan, seats: run.cand.seats! }])
      setAt(at + 1)
    }, 420)
    return () => clearTimeout(t)
  }, [run, at, last])

  const done = run !== null && at > last
  const gateTone = (i: number): Tone => {
    if (!run || at < 0) return 'muted'
    if (i === at && at <= last) return 'accent'
    if (i < at) return !run.o.ok && i === run.stop ? 'dead' : 'ok'
    return 'muted'
  }
  const pick = (sc: (typeof SCENARIOS)[number]) => { setE(sc.e); setU(sc.u); setP(sc.p); setS(sc.s); setRun(null); setAt(-1) }
  const reset = () => { setRows([{ id: 1, email: 'ana@example.com', username: 'ana', plan: 'free', seats: 1 }]); setNextId(2); setRun(null); setAt(-1) }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-1.5">
        {SCENARIOS.map((sc) => <Btn key={sc.label} onClick={() => pick(sc)} active={sc.e === e && sc.u === u && sc.p === p && sc.s === s}>{sc.label}</Btn>)}
      </div>
      <div className="grid gap-2 rounded-lg border border-line bg-surface-2 p-3 text-xs sm:grid-cols-2">
        <Field label="email"><Segmented label="email" value={e} onChange={setE} options={[['new', freshEmail], ['dup', 'ana@example.com'], ['null', 'NULL']]} /></Field>
        <Field label="username"><Segmented label="username" value={u} onChange={setU} options={[['new', freshName], ['dup', 'ana'], ['null', 'NULL']]} /></Field>
        <Field label="plan"><Segmented label="plan" value={p} onChange={setP} options={[['omit', 'omit'], ['pro', "'pro'"], ['gold', "'gold'"]]} /></Field>
        <Field label="seats"><Segmented label="seats" value={s} onChange={setS} options={[['omit', 'omit'], ['5', '5'], ['0', '0'], ['null', 'NULL']]} /></Field>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={nnd} onChange={(ev) => setNnd(ev.target.checked)} className="accent-[var(--accent)]" />
          <span className="font-mono text-[12px]">UNIQUE NULLS NOT DISTINCT (username)</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn primary testid="viz-next" onClick={insert}>Run INSERT</Btn>
        <Btn onClick={reset}>Reset table</Btn>
        <span className="font-mono text-xs text-muted">next identity value: <b className="text-ink">{nextId}</b></span>
      </div>
      <p className="font-mono text-[12px] break-words" style={{ color: tone('accent') }}>{sql}</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {GATES.map((g, i) => {
          const t = gateTone(i)
          return (
            <motion.div key={g.name} layout animate={{ scale: i === at ? 1.03 : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="relative flex flex-col gap-1 rounded-lg border-2 p-2 sm:min-h-[112px]"
              style={{ borderColor: tone(t), background: toneBg(t, t === 'muted' ? 6 : 14) }}>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[12px] font-bold"><span className="mr-1 font-mono text-muted">{i + 1}</span>{g.name}</span>
                <span className="font-mono text-[10.5px] text-muted">{g.t}</span>
              </div>
              <p className="text-[11.5px] leading-snug text-muted"><Md>{g.rule}</Md></p>
              {run && i === Math.min(at, last) && (
                <motion.div layoutId="row-token" className="mt-auto self-start rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold"
                  style={{ background: toneBg(t, 30), color: tone(t === 'muted' ? 'accent' : t) }}>
                  row id {run.cand.id}{done && !run.o.ok && i === run.stop ? ' ✗ rejected' : done && run.o.ok ? ' ✓ stored' : ''}
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
      <Legend items={[['accent', 'checking now'], ['ok', 'passed'], ['dead', 'rejected here'], ['muted', 'not reached']]} />
      <OutcomeBox o={done ? run!.o : null} k={run?.n ?? 0} />
      <TableCard name="accounts" note={`${rows.length} row${rows.length === 1 ? '' : 's'} · ids skip where an INSERT failed`} cols={['id', 'email', 'username', 'plan', 'seats']} keyCols={[0]} fkCols={[3]}
        hl={run && done && run.o.ok ? { [String(run.cand.id)]: 'new' } : undefined}
        rows={rows.map((r) => ({ key: String(r.id), cells: [r.id, r.email, r.username ?? <Null />, r.plan, r.seats] }))} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1"><span className="font-mono text-[11px] font-semibold text-muted">{label}</span><div className="overflow-x-auto scrollbar-thin">{children}</div></div>
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'constraints-defaults',
  module: 'f3',
  order: 2,
  title: 'Constraints and defaults',
  tldr: [
    '**Constraints** are rules attached to a table (`NOT NULL`, `UNIQUE`, `CHECK`, foreign keys) that PostgreSQL checks on every insert and update, and **defaults** fill in columns you leave out.',
    'They keep bad data out at the single place every application has to pass through, so one buggy client or a hand-typed query cannot corrupt the table.',
  ],
  visualizer: {
    title: 'The constraint gatekeeper',
    caption: 'Pick a scenario or build a row, then press **Run INSERT** and watch which gate stops it. Notice the identity counter moves even when the row is rejected.',
    Component: GatekeeperViz,
  },
  playground: {
    setup: `${TRY_FN}

CREATE TABLE plans (
  code          text PRIMARY KEY,
  monthly_price numeric(8,2) NOT NULL CHECK (monthly_price >= 0)
);
INSERT INTO plans VALUES ('free', 0), ('pro', 12), ('team', 40);

CREATE TABLE accounts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      text NOT NULL,
  username   text,
  plan       text NOT NULL DEFAULT 'free' REFERENCES plans (code),
  seats      int  NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT accounts_email_key    UNIQUE (email),
  CONSTRAINT accounts_username_key UNIQUE (username),
  CONSTRAINT seats_positive        CHECK (seats > 0)
);
INSERT INTO accounts (email, username) VALUES ('ana@example.com', 'ana');`,
    presets: [
      { label: 'Defaults fill the gaps', sql: `INSERT INTO accounts (email) VALUES ('bo@example.com')
RETURNING id, email, username, plan, seats, created_at;`,
        note: 'Only `email` was given. `plan` became **free**, `seats` became **1**, `created_at` got the current time, and `username` is NULL because it has no default.' },
      { label: 'One rejection per gate', sql: `SELECT try($$INSERT INTO accounts (email) VALUES (NULL)$$)                  AS not_null,
       try($$INSERT INTO accounts (email, seats) VALUES ('cy@example.com', 0)$$) AS check_seats,
       try($$INSERT INTO accounts (email) VALUES ('ana@example.com')$$)       AS unique_email,
       try($$INSERT INTO accounts (email, plan) VALUES ('cy@example.com', 'gold')$$) AS foreign_key;`,
        note: 'Each column shows a different SQLSTATE: **23502**, **23514**, **23505**, **23503**. The constraint name in each message tells you exactly which rule fired.' },
      { label: 'Failed inserts still use ids', sql: `INSERT INTO accounts (email) VALUES ('cy@example.com') RETURNING id;`,
        note: 'The four failed attempts each drew a value from the identity sequence. Expect **id 7**, not 3. Gaps are normal and harmless.' },
      { label: 'NULLs and UNIQUE', sql: `SELECT try($$INSERT INTO accounts (email) VALUES ('dee@example.com')$$) AS first_null_username,
       try($$INSERT INTO accounts (email) VALUES ('eli@example.com')$$) AS second_null_username;

CREATE TABLE badges (owner text UNIQUE NULLS NOT DISTINCT);
INSERT INTO badges VALUES (NULL);
SELECT try($$INSERT INTO badges VALUES (NULL)$$) AS with_nulls_not_distinct;`,
        note: 'A plain `UNIQUE` column accepts many NULLs, because NULL is never equal to NULL. `NULLS NOT DISTINCT` treats them as equal and rejects the second one.' },
      { label: 'CHECK lets NULL through', sql: `CREATE TABLE discounts (pct int CONSTRAINT pct_range CHECK (pct BETWEEN 0 AND 100));
INSERT INTO discounts VALUES (NULL), (15);
SELECT try($$INSERT INTO discounts VALUES (120)$$) AS too_big;
SELECT * FROM discounts;`,
        note: 'A CHECK passes when its expression is **true or NULL**. NULL BETWEEN 0 AND 100 is NULL, so the NULL row is stored. Add `NOT NULL` if the value is required.' },
      { label: 'Enum, domain, exclusion', sql: `CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'closed');
CREATE DOMAIN email_address AS text CHECK (VALUE ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$');
CREATE TABLE room_bookings (
  room   text NOT NULL,
  during tstzrange NOT NULL,
  EXCLUDE USING gist (during WITH &&)
);
INSERT INTO room_bookings VALUES ('A', '[2026-03-02 09:00, 2026-03-02 10:00)');

SELECT try($$SELECT 'done'::ticket_status$$)    AS enum_value,
       try($$SELECT 'nope'::email_address$$)    AS domain_value,
       try($$INSERT INTO room_bookings VALUES ('A', '[2026-03-02 09:30, 2026-03-02 11:00)')$$) AS overlap;`,
        note: 'An enum rejects unknown labels (**22P02**). A domain is a reusable type with its own CHECK (**23514**). An exclusion constraint rejects overlapping time ranges (**23P01**).' },
      { label: 'See every constraint', sql: `SELECT conname,
       CASE contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK'
                    WHEN 'f' THEN 'FOREIGN KEY' WHEN 'n' THEN 'NOT NULL' END AS kind,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'accounts'::regclass
ORDER BY kind, conname;`,
        note: 'In PostgreSQL 18, `NOT NULL` constraints are catalog entries with names too, such as `accounts_email_not_null`.' },
    ],
  },
  production: {
    title: 'Negative balances from a race-prone app check',
    context: 'A payments team stored wallet balances and checked `balance >= amount` in application code before running `UPDATE wallets SET balance = balance - amount`.',
    problem: 'Two withdrawals arriving at the same moment both read the old balance, both passed the app check, and both subtracted. Some wallets went negative, and nothing in the database noticed.',
    solution: 'Move the rule into the table. A `CHECK` runs on the new row inside the same statement that changes it, so concurrent updates cannot slip past it. Add it without a long lock using `NOT VALID`, fix old rows, then validate.',
    sql: `ALTER TABLE wallets
  ADD CONSTRAINT balance_non_negative CHECK (balance >= 0) NOT VALID;

-- repair existing bad rows, then prove every row passes:
ALTER TABLE wallets VALIDATE CONSTRAINT balance_non_negative;

-- the second of two racing withdrawals now fails cleanly:
-- ERROR: new row for relation "wallets" violates check constraint "balance_non_negative"  (SQLSTATE 23514)`,
    outcome: 'Overdrafts became impossible regardless of which service wrote the update. The app now catches SQLSTATE 23514 and shows "insufficient funds" instead of silently corrupting data.',
  },
  pitfalls: [
    { title: 'Expecting UNIQUE to stop duplicate NULLs',
      symptom: 'Several rows share `username = NULL` even though the column is `UNIQUE`.',
      cause: 'By default NULLs are distinct from each other, so any number of them is allowed.',
      fix: 'Declare `UNIQUE NULLS NOT DISTINCT` if only one NULL is allowed, or make the column `NOT NULL`.',
      sql: 'ALTER TABLE accounts ADD CONSTRAINT one_null_username UNIQUE NULLS NOT DISTINCT (username);' },
    { title: 'A CHECK that NULL slips past',
      symptom: 'Rows with a NULL value appear even though `CHECK (pct BETWEEN 0 AND 100)` exists.',
      cause: 'A CHECK fails only when its expression is false. NULL comparisons give NULL, and NULL counts as passing.',
      fix: 'Pair the CHECK with `NOT NULL`, or write the NULL case into the expression explicitly.' },
    { title: 'Unnamed constraints make errors cryptic',
      symptom: 'Logs say `violates check constraint "accounts_check1"` and nobody knows which rule that was.',
      cause: 'Without a name, PostgreSQL generates one from the table name and a counter.',
      fix: 'Name every CHECK and UNIQUE with `CONSTRAINT <name>` so errors explain themselves and the app can map them to messages.' },
    { title: 'An enum you cannot shrink',
      symptom: 'A status is retired, but there is no `ALTER TYPE … DROP VALUE` to remove it.',
      cause: 'Enum labels can be added and renamed, never removed, and existing labels cannot be reordered.',
      fix: 'Use an enum only for small, stable sets. For lists that change, use a lookup table with a foreign key, or a `CHECK (status IN (…))` you can replace.' },
  ],
  pointers: [
    'Order of checks on INSERT: **defaults** fill missing columns, then **NOT NULL**, **CHECK**, **UNIQUE**, and finally the **foreign key**.',
    'SQLSTATEs to know: **23502** not null, **23514** check, **23505** unique, **23503** foreign key, **23P01** exclusion.',
    '`CHECK` passes on NULL. Plain `UNIQUE` allows many NULLs unless you add `NULLS NOT DISTINCT`.',
    'Fixed set of values: **enum** (compact, cannot drop labels), **lookup table + FK** (flexible, can carry extra columns) or **CHECK … IN** (simple). A **domain** packages a type with its rules for reuse.',
    '**Going deeper:** [Modelling data: normalization and constraints](/m1/normalization-constraints) covers deferrable, temporal and not-enforced constraints.',
  ],
  sources: ['ddl-constraints.html', 'ddl-default.html', 'sql-createtable.html', 'sql-createdomain.html', 'datatype-enum.html', 'errcodes-appendix.html', 'catalog-pg-constraint.html'],
}
