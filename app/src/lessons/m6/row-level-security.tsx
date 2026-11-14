import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { Legend, Panel, Segmented, Tag, tone, toneBg } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Chip, TRY_SQL } from './_shared'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a live model of how PostgreSQL combines row security policies for one SELECT and one
 * INSERT: permissive policies are ORed, restrictive ones ANDed onto that, no permissive policy means
 * default deny, and owners / superusers / BYPASSRLS skip it all unless FORCE applies (ddl-rowsecurity,
 * sql-createpolicy). The visible rows for each scenario were checked against PostgreSQL 18.6 (PGlite)
 * with the playground presets, including the exact error text.
 * ---------------------------------------------------------------------------------------------- */

interface Row { id: number; tenant: number; owner: string; status: string; title: string }
const ROWS: Row[] = [
  { id: 1, tenant: 1, owner: 'ana', status: 'open', title: 'Login fails' },
  { id: 2, tenant: 1, owner: 'ben', status: 'open', title: 'Export slow' },
  { id: 3, tenant: 1, owner: 'ana', status: 'archived', title: 'Old bug' },
  { id: 4, tenant: 2, owner: 'cho', status: 'open', title: 'Billing' },
  { id: 5, tenant: 2, owner: 'dev', status: 'closed', title: 'Refund' },
  { id: 6, tenant: 2, owner: 'cho', status: 'archived', title: 'Legacy' },
]
type PolId = 'tenant' | 'own' | 'archived'
const POLS: { id: PolId; name: string; kind: 'permissive' | 'restrictive'; sql: string; test: (r: Row, s: Sess) => boolean }[] = [
  { id: 'tenant', name: 'tenant_isolation', kind: 'permissive', sql: "tenant_id = current_setting('app.tenant_id')::int", test: (r, s) => r.tenant === s.tenant },
  { id: 'own', name: 'own_rows', kind: 'permissive', sql: "owner = current_setting('app.username')", test: (r, s) => r.owner === s.user },
  { id: 'archived', name: 'hide_archived', kind: 'restrictive', sql: "status <> 'archived'", test: (r) => r.status !== 'archived' },
]
type Role = 'app' | 'owner' | 'owner_force' | 'bypass'
interface Sess { tenant: number; user: string }
interface Cfg { enabled: boolean; pols: PolId[]; role: Role; sess: Sess }

const SCEN: { cfg: Cfg; text: string }[] = [
  { cfg: { enabled: true, pols: [], role: 'app', sess: { tenant: 1, user: 'ana' } }, text: 'RLS is **enabled** but no policy exists. That is **default deny**: `app_user` sees 0 rows, with no error.' },
  { cfg: { enabled: true, pols: ['tenant'], role: 'app', sess: { tenant: 1, user: 'ana' } }, text: 'One **permissive** policy keyed on a session setting: the session for tenant 1 sees only tenant 1\'s three tickets.' },
  { cfg: { enabled: true, pols: ['tenant', 'archived'], role: 'app', sess: { tenant: 1, user: 'ana' } }, text: 'A **restrictive** policy is ANDed on top: archived tickets disappear even though tenant_isolation allows them.' },
  { cfg: { enabled: true, pols: ['tenant', 'own', 'archived'], role: 'app', sess: { tenant: 1, user: 'cho' } }, text: 'A second permissive policy is **ORed** with the first: user cho (tenant 1 session) also sees their own open ticket from tenant 2.' },
  { cfg: { enabled: true, pols: ['archived'], role: 'app', sess: { tenant: 1, user: 'ana' } }, text: 'Restrictive policies alone grant nothing: with **no permissive policy** the combined expression is false for every row.' },
  { cfg: { enabled: true, pols: ['tenant', 'archived'], role: 'owner', sess: { tenant: 1, user: 'ana' } }, text: 'The **table owner** bypasses RLS by default and sees all six rows. Superusers and BYPASSRLS roles always do.' },
  { cfg: { enabled: true, pols: ['tenant', 'archived'], role: 'owner_force', sess: { tenant: 1, user: 'ana' } }, text: '`ALTER TABLE … FORCE ROW LEVEL SECURITY` makes the policies apply to the **owner** too.' },
]

function combine(c: Cfg) {
  const bypass = !c.enabled || c.role === 'owner' || c.role === 'bypass'
  const perm = POLS.filter((p) => c.pols.includes(p.id) && p.kind === 'permissive')
  const restr = POLS.filter((p) => c.pols.includes(p.id) && p.kind === 'restrictive')
  const permExpr = perm.length ? perm.map((p) => p.name).join(' OR ') : 'false'
  const expr = bypass ? 'true (RLS bypassed)' : `(${permExpr})${restr.map((r) => ` AND ${r.name}`).join('')}`
  const visible = (r: Row) => bypass || (perm.some((p) => p.test(r, c.sess)) && restr.every((p) => p.test(r, c.sess)))
  return { bypass, perm, restr, expr, visible }
}

function RlsViz() {
  const [idx, setIdx] = useState(0)
  const [cfg, setCfg] = useState<Cfg>(SCEN[0].cfg)
  const [custom, setCustom] = useState(false)
  const k = combine(cfg)
  const edit = (f: (c: Cfg) => Cfg) => { setCfg(f(cfg)); setCustom(true) }
  const next = () => { const n = (idx + 1) % SCEN.length; setIdx(n); setCfg(SCEN[n].cfg); setCustom(false) }
  const shown = ROWS.filter(k.visible).length
  // INSERT check: WITH CHECK defaults to USING for FOR ALL policies; checked against the new row
  const newRow: Row = { id: 9, tenant: 2, owner: cfg.sess.user, status: 'open', title: 'new' }
  const insertOk = k.visible(newRow)
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={next} data-testid="viz-next" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white">Next scenario ({idx + 1}/{SCEN.length})</button>
        <Chip on={cfg.enabled} onClick={() => edit((c) => ({ ...c, enabled: !c.enabled }))}>ENABLE ROW LEVEL SECURITY</Chip>
      </div>
      <div className="min-h-[52px] rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm" aria-live="polite">
        <AnimatePresence mode="wait"><motion.p key={custom ? 'c' : idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Md>{custom ? `Custom setup: **${shown}** of ${ROWS.length} rows visible.` : SCEN[idx].text}</Md>
        </motion.p></AnimatePresence>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Panel title="policies on tickets">
          <div className="grid gap-1.5">
            {POLS.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2">
                <Chip on={cfg.pols.includes(p.id)} t={p.kind === 'permissive' ? 'ok' : 'dead'} onClick={() => edit((c) => ({ ...c, pols: c.pols.includes(p.id) ? c.pols.filter((x) => x !== p.id) : [...c.pols, p.id] }))}>
                  <span className="font-mono text-[12px]">{p.name}</span>
                </Chip>
                <Tag t={p.kind === 'permissive' ? 'ok' : 'dead'}>{p.kind}</Tag>
                <code className="font-mono text-[11px] text-muted">USING ({p.sql})</code>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="who is asking">
          <div className="grid gap-2">
            <Segmented label="Role" value={cfg.role} onChange={(r) => edit((c) => ({ ...c, role: r }))} options={[['app', 'app_user'], ['owner', 'owner'], ['owner_force', 'owner+FORCE'], ['bypass', 'BYPASSRLS']]} />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">app.tenant_id</span>
              <Segmented label="Tenant" value={String(cfg.sess.tenant)} onChange={(t) => edit((c) => ({ ...c, sess: { ...c.sess, tenant: +t } }))} options={[['1', '1'], ['2', '2']]} />
              <span className="text-muted">app.username</span>
              <Segmented label="User" value={cfg.sess.user} onChange={(u) => edit((c) => ({ ...c, sess: { ...c.sess, user: u } }))} options={[['ana', 'ana'], ['ben', 'ben'], ['cho', 'cho'], ['dev', 'dev']]} />
            </div>
          </div>
        </Panel>
      </div>
      <motion.div layout className="rounded-lg border px-3 py-2 font-mono text-[12.5px]" style={{ borderColor: tone(k.bypass ? 'new' : 'accent'), background: toneBg(k.bypass ? 'new' : 'accent', 10) }}>
        <span className="text-muted">effective filter: </span><b>{k.expr}</b>
        {!k.bypass && k.perm.length === 0 && <span className="ml-2"><Tag t="dead">default deny</Tag></span>}
      </motion.div>
      <Legend items={[['ok', 'permissive (OR)'], ['dead', 'restrictive (AND) / filtered'], ['tuple', 'visible row'], ['new', 'RLS bypassed']]} />
      <div className="overflow-x-auto rounded-lg border border-line scrollbar-thin">
        <table className="w-full min-w-[560px] border-collapse font-mono text-[12px]">
          <thead><tr className="text-left text-[11px] text-muted">
            {['id', 'tenant_id', 'owner', 'status', ...POLS.map((p) => p.name), 'visible'].map((h) => <th key={h} className="border-b border-line px-2 py-1 font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>
            {ROWS.map((r) => {
              const v = k.visible(r)
              return (
                <motion.tr key={r.id} layout animate={{ opacity: v ? 1 : 0.38 }} className="border-b border-line last:border-0" style={{ background: v ? toneBg(k.bypass ? 'new' : 'tuple', 10) : 'transparent' }}>
                  <td className="px-2 py-1">{r.id}</td><td className="px-2 py-1">{r.tenant}</td><td className="px-2 py-1">{r.owner}</td><td className="px-2 py-1">{r.status}</td>
                  {POLS.map((p) => {
                    const active = cfg.pols.includes(p.id)
                    const ok = p.test(r, cfg.sess)
                    return <td key={p.id} className="px-2 py-1">{active ? <span style={{ color: ok ? tone('ok') : tone('dead') }}>{ok ? 'true' : 'false'}</span> : <span className="text-muted">·</span>}</td>
                  })}
                  <td className="px-2 py-1">{v ? <Tag t={k.bypass ? 'new' : 'tuple'}>shown</Tag> : <Tag t="dead">filtered</Tag>}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <code className="inline-code">INSERT INTO tickets VALUES (9, 2, '{cfg.sess.user}', 'open', 'new')</code>
        <span className="text-muted">→ WITH CHECK (same as USING for FOR ALL policies):</span>
        {insertOk ? <Tag t="ok">INSERT 0 1</Tag> : <Tag t="dead">ERROR: new row violates row-level security policy for table "tickets"</Tag>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

export const lesson: Lesson = {
  slug: 'row-level-security',
  module: 'm6',
  order: 8,
  title: 'Row-level security',
  tldr: [
    '**Row-level security** attaches policies to a table, boolean expressions that PostgreSQL adds to every query so each role sees and changes only the rows the policies allow.',
    'It exists so tenant or user isolation is enforced by the database for every query and code path, instead of trusting each application query to remember its `WHERE tenant_id = …`.',
  ],
  visualizer: {
    title: 'How policies combine into one filter',
    caption: 'Click **Next scenario**, or toggle policies, switch roles and change session settings. Watch the effective filter and each row\'s verdict, plus whether an INSERT passes WITH CHECK.',
    Component: RlsViz,
  },
  playground: {
    setup: `
CREATE TABLE tickets (id int PRIMARY KEY, tenant_id int NOT NULL, owner text NOT NULL, status text NOT NULL, title text);
INSERT INTO tickets VALUES
  (1, 1, 'ana', 'open', 'Login fails'), (2, 1, 'ben', 'open', 'Export slow'), (3, 1, 'ana', 'archived', 'Old bug'),
  (4, 2, 'cho', 'open', 'Billing'), (5, 2, 'dev', 'closed', 'Refund'), (6, 2, 'cho', 'archived', 'Legacy');
CREATE ROLE app_user NOLOGIN;
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO app_user;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
${TRY_SQL}`,
    presets: [
      { label: 'Default deny', sql: `SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'tickets';

SET ROLE app_user;
SELECT current_user, count(*) AS visible_rows FROM tickets;
RESET ROLE;`,
        note: 'RLS is on and no policy exists, so `app_user` sees **0 rows** and gets no error. The playground runs as a superuser, which is why every preset switches with `SET ROLE`.' },
      { label: 'Tenant isolation', sql: `CREATE POLICY tenant_isolation ON tickets
  USING (tenant_id = current_setting('app.tenant_id')::int);

SET app.tenant_id = '1';
SET ROLE app_user;
SELECT id, tenant_id, owner, status FROM tickets ORDER BY id;
RESET ROLE;`,
        note: 'One permissive policy, keyed on a **session setting** the application sets per connection or transaction. Tenant 1 sees tickets 1, 2 and 3.' },
      { label: 'Add a restrictive policy', sql: `CREATE POLICY hide_archived ON tickets AS RESTRICTIVE USING (status <> 'archived');

SET ROLE app_user;
SELECT id, owner, status FROM tickets ORDER BY id;
EXPLAIN (COSTS OFF) SELECT * FROM tickets WHERE title LIKE 'L%';
RESET ROLE;`,
        note: 'Restrictive policies are **ANDed**: ticket 3 disappears. The plan shows the policy quals placed **before** the user\'s `title ~~ \'L%\'`, so non-leakproof user functions never see hidden rows.' },
      { label: 'Permissive policies OR', sql: `CREATE POLICY own_rows ON tickets USING (owner = current_setting('app.username'));

SET app.tenant_id = '1';
SET app.username = 'cho';
SET ROLE app_user;
SELECT id, tenant_id, owner, status FROM tickets ORDER BY id;
RESET ROLE;`,
        note: '`(tenant_isolation OR own_rows) AND hide_archived`: cho\'s open ticket 4 from tenant 2 now appears alongside tenant 1\'s open tickets.' },
      { label: 'WITH CHECK and silent filtering', sql: `SET app.tenant_id = '1';
SET app.username = 'ben';
SET ROLE app_user;
SELECT try_sql($$INSERT INTO tickets VALUES (9, 2, 'eve', 'open', 'sneaky')$$) AS insert_other_tenant;
SELECT try_sql($$UPDATE tickets SET tenant_id = 2 WHERE id = 1$$) AS move_to_other_tenant;
WITH u AS (UPDATE tickets SET title = 'hijack' WHERE id = 5 RETURNING 1) SELECT count(*) AS rows_updated FROM u;
RESET ROLE;`,
        note: 'A new row that fails the policy is an **error** (WITH CHECK, here implied by USING). An UPDATE of a row you cannot see is **silently filtered**: 0 rows, no error.' },
      { label: 'Owner bypass and FORCE', sql: `CREATE ROLE tenant_owner NOLOGIN;
ALTER TABLE tickets OWNER TO tenant_owner;

SET ROLE tenant_owner;
SELECT count(*) AS owner_sees FROM tickets;
RESET ROLE;

ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
SET app.tenant_id = '1';
SET app.username = 'nobody';
SET ROLE tenant_owner;
SELECT count(*) AS owner_sees_with_force FROM tickets;
RESET ROLE;`,
        note: 'The **owner** bypasses policies (6 rows) until `FORCE ROW LEVEL SECURITY` (2 rows). Superusers and roles with **BYPASSRLS** bypass even FORCE.' },
      { label: 'row_security = off for dumps', sql: `SET ROLE app_user;
SET row_security = off;
SELECT try_sql('SELECT count(*) FROM tickets') AS with_row_security_off;
RESET row_security;
RESET ROLE;

SELECT policyname, permissive, cmd, qual, with_check FROM pg_policies WHERE tablename = 'tickets';`,
        note: '`row_security = off` does not bypass anything: a query that policies would filter **raises an error** instead, so a backup never silently misses rows. `pg_policies` lists every policy.' },
      { label: 'Per-command policies (CRM)', sql: `CREATE TABLE crm_accounts (id int PRIMARY KEY, name text NOT NULL);
INSERT INTO crm_accounts VALUES (1, 'Wayne Enterprises'), (2, 'LexCorp'), (3, 'Queen Consolidated');
CREATE TABLE contacts (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id int NOT NULL REFERENCES crm_accounts, name text NOT NULL);
INSERT INTO contacts (account_id, name) VALUES
  (1, 'Alfred Pennyworth'), (1, 'Lucius Fox'), (2, 'Lex Luthor'), (2, 'Mercy Graves'), (3, 'Oliver Queen');
GRANT SELECT ON crm_accounts TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO app_user;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 1. The deliberate error: INSERT policies take only WITH CHECK.
SELECT try_sql($$CREATE POLICY c_ins ON contacts FOR INSERT TO app_user
  USING (account_id = 1)$$) AS insert_policy_with_using;

-- 2. The fix: one policy per command, none for DELETE.
CREATE POLICY c_sel ON contacts FOR SELECT TO app_user
  USING (account_id = NULLIF(current_setting('rls.account_id', true), '')::int);
CREATE POLICY c_ins ON contacts FOR INSERT TO app_user
  WITH CHECK (account_id = NULLIF(current_setting('rls.account_id', true), '')::int);
CREATE POLICY c_upd ON contacts FOR UPDATE TO app_user
  USING (account_id = NULLIF(current_setting('rls.account_id', true), '')::int);

-- 3. Re-run as the app, with a transaction-local tenant.
BEGIN;
SELECT set_config('rls.account_id', '2', true);
SET ROLE app_user;
SELECT a.name AS account, c.name AS contact
FROM crm_accounts a LEFT JOIN contacts c ON c.account_id = a.id ORDER BY a.id, c.id;
INSERT INTO contacts (account_id, name) VALUES (2, 'Otis') RETURNING id, account_id;
SELECT try_sql($$INSERT INTO contacts (account_id, name) VALUES (1, 'Joker')$$) AS insert_other_account;
WITH d AS (DELETE FROM contacts RETURNING 1) SELECT count(*) AS rows_deleted FROM d;
RESET ROLE;
COMMIT;

-- 4. After COMMIT the setting is gone, but not NULL.
SELECT current_setting('rls.account_id', true) = '' AS is_empty_string,
       try_sql($$SELECT current_setting('rls.account_id', true)::int$$) AS naive_cast;`,
        note: '`FOR INSERT … USING` is rejected: **only WITH CHECK expression allowed for INSERT**. With per-command policies, LexCorp\'s contacts are visible, the LEFT JOIN still lists Wayne and Queen with NULL contacts (RLS filters only `contacts`), the Joker insert fails WITH CHECK, and `DELETE` with no DELETE policy removes **0 rows** without an error. `set_config(…, true)` lasts only for the transaction; afterwards the setting reads as an **empty string**, which a bare `::int` cast turns into an error. `NULLIF(…, \'\')` makes it NULL, so the policy denies instead.' },
    ],
  },
  production: {
    title: 'Multi-tenant isolation that does not depend on every query',
    context: 'A SaaS app kept all tenants in shared tables with a `tenant_id` column. Every query was supposed to include `WHERE tenant_id = $1`.',
    problem: 'A new reporting endpoint forgot the predicate and showed one customer another customer\'s tickets. Code review could not guarantee that no other query would ever forget it.',
    solution: 'Enable RLS with a **tenant policy** keyed on a transaction-local setting. The app connects as a non-owner role without BYPASSRLS and runs `SET LOCAL app.tenant_id = …` at the start of every transaction (safe with transaction pooling). `FORCE` covers the owner too, so migrations and jobs that run as the owner must set a tenant or use a dedicated BYPASSRLS role.',
    sql: `ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tickets
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::int)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::int);
CREATE INDEX ON tickets (tenant_id);
-- per request, inside the transaction:
BEGIN;
SET LOCAL app.tenant_id = '42';
SELECT * FROM tickets;  -- only tenant 42, even without a WHERE
COMMIT;`,
    outcome: 'A query that forgets the predicate now returns only the current tenant\'s rows, and a write tagged with another tenant fails with `new row violates row-level security policy`. The policy is just a qual, so the `tenant_id` index keeps it cheap. The presets reproduce each behaviour.',
  },
  pitfalls: [
    { title: 'Testing as a superuser or the table owner',
      symptom: 'Policies "work in staging" but every row is visible in production, or the reverse.',
      cause: 'Superusers and BYPASSRLS roles **always** bypass RLS, and the table owner bypasses it unless FORCE is set. Tests that connect as the owner never exercise the policies.',
      fix: 'Run the application and its tests as a dedicated non-owner role, and use `ALTER TABLE … FORCE ROW LEVEL SECURITY` when the owner role also serves traffic.' },
    { title: 'A missing setting breaks every query',
      symptom: '`ERROR: unrecognized configuration parameter "app.tenant_id"` on connections that did not set it.',
      cause: '`current_setting(name)` errors if the parameter was never set in the session. The `missing_ok` form has its own trap: once a `SET LOCAL` or `set_config(…, true)` has ended, the parameter still exists and reads as an **empty string**, so `::int` fails with `invalid input syntax for type integer: ""`.',
      fix: 'Use `NULLIF(current_setting(\'app.tenant_id\', true), \'\')`. An unset tenant then becomes NULL, the policy evaluates to NULL, which counts as false: no rows instead of an error.',
      sql: `USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::int)` },
    { title: 'Leaks through constraints and errors',
      symptom: 'A user can probe for other tenants\' data, for example by trying INSERTs and watching for unique violations.',
      cause: '**Unique, primary key and foreign key checks bypass RLS.** Their errors reveal whether a hidden row exists. Non-leakproof functions in queries can also leak values through error messages.',
      fix: 'Include `tenant_id` in unique keys, use non-guessable ids, and do not expose raw constraint errors to end users.' },
    { title: 'Only restrictive policies',
      symptom: 'After adding a carefully written restrictive policy, the application sees nothing at all.',
      cause: 'Restrictive policies only narrow what permissive policies allow. With **no permissive policy**, nothing is allowed: default deny.',
      fix: 'Always have at least one permissive policy (even `USING (true)` for a role) and layer restrictive ones on top.' },
    { title: 'Writing an INSERT policy with USING',
      symptom: '`ERROR: only WITH CHECK expression allowed for INSERT` while creating per-command policies, or a migration that stops halfway through its policy list.',
      cause: 'USING filters rows that already exist. An INSERT has no existing row, so an INSERT policy accepts only **WITH CHECK**. The reverse also holds: a SELECT or DELETE policy takes only USING. A command with no policy at all is denied, and for DELETE that looks like success: `DELETE 0`.',
      fix: 'Write `FOR INSERT … WITH CHECK (…)`, `FOR SELECT` and `FOR DELETE … USING (…)`, and `FOR UPDATE` with both. Check the result in `pg_policies`.',
      sql: `CREATE POLICY c_ins ON contacts FOR INSERT TO app_user
  WITH CHECK (account_id = NULLIF(current_setting('rls.account_id', true), '')::int);` },
    { title: 'A session setting that outlives its request',
      symptom: 'Behind a connection pooler, a request occasionally sees another tenant\'s rows.',
      cause: 'A plain `SET app.tenant_id` lasts for the whole **session**. When the pooler hands that connection to the next request, which forgets to set its own tenant, the old value still applies. The setting is also no security boundary if clients can run arbitrary SQL: anyone can `SET` it.',
      fix: 'Set the tenant with `SET LOCAL` or `set_config(\'app.tenant_id\', $1, true)` inside each transaction, so it ends at COMMIT. Only let trusted application code issue the SET; untrusted users need their own database roles.' },
  ],
  pointers: [
    '`ENABLE ROW LEVEL SECURITY` with no policy = **default deny**. Owners bypass unless **FORCE**; superusers and **BYPASSRLS** always bypass.',
    'Filter = **(permissive OR permissive …) AND restrictive AND …**. No permissive policy means no rows.',
    '**USING** silently filters existing rows; **WITH CHECK** raises an error for new or updated rows. FOR ALL without WITH CHECK reuses USING.',
    'Policy quals run **before** user quals (except leakproof functions), so hidden rows never reach user code.',
    'Key multi-tenant policies on `NULLIF(current_setting(\'app.tenant_id\', true), \'\')` set with **SET LOCAL** per transaction. INSERT policies take only WITH CHECK.',
  ],
  sources: ['ddl-rowsecurity.html', 'sql-createpolicy.html', 'sql-altertable.html', 'runtime-config-client.html', 'sql-createview.html'],
}
