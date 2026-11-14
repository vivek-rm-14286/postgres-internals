import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson } from '../../lesson/types'
import { FieldTable, Legend, Panel, Segmented, tone, toneBg, type Tone } from '../../viz/kit'
import { Md } from '../../lesson/Md'
import { Btn, TRY_SQL, hashint4, sliceOf } from './_ui'
import { ADS_SCHEMA } from './_schema'

/* ------------------------------------------------------------------------------------------------
 * Visualizer: a Citus-style shard map. 32 hash shards per table split the int32 token space into equal
 * slices; placements go round-robin over the workers. The token is PostgreSQL's real hashint4(), ported
 * in _ui.tsx and checked against PGlite. Colocated tables share slice boundaries AND placements.
 * ---------------------------------------------------------------------------------------------- */

const SHARDS = 32
const SLICE = 4294967296 / SHARDS // 134,217,728 tokens per shard
const BASE = { companies: 102008, campaigns: 102040, ads: 102072, countries: 102104 }
const WT: Tone[] = ['tuple', 'pointer', 'header', 'new']
type Mode = 'row' | 'reference' | 'schema'
const TENANTS = ['acme', 'globex', 'initech', 'umbrella', 'hooli', 'stark', 'wayne', 'wonka', 'tyrell', 'cyberdyne']

function TokenStrip({ workers, token, shard }: { workers: number; token: number; shard: number }) {
  const W = 620, X0 = 10
  const x = X0 + ((token + 2147483648) / 4294967296) * W
  return (
    <svg viewBox="0 0 640 74" className="w-full min-w-[480px]" role="img" aria-label="int32 hash token space split into 32 shards">
      {Array.from({ length: SHARDS }, (_, i) => (
        <rect key={i} x={X0 + (i * W) / SHARDS} y={14} width={W / SHARDS - 1} height={26} rx={2}
          fill={toneBg(WT[i % workers], i === shard ? 70 : 22)} stroke={i === shard ? tone(WT[i % workers]) : 'none'} strokeWidth={2} />
      ))}
      <motion.g initial={false} animate={{ x }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
        <path d="M0,10 L-6,0 L6,0 Z" fill="var(--text)" />
        <line x1={0} x2={0} y1={10} y2={44} stroke="var(--text)" strokeWidth={1.5} />
      </motion.g>
      <text x={X0} y={58} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">-2147483648</text>
      <text x={X0 + W / 2} y={58} fontSize={10} textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)">0</text>
      <text x={X0 + W} y={58} fontSize={10} textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">2147483647</text>
      <text x={X0 + W / 2} y={71} fontSize={10} textAnchor="middle" fill="var(--muted)">32 slices of 134,217,728 hash tokens, one per shard</text>
    </svg>
  )
}

function ShardChip({ id, t, hot, ghost }: { id: string; t: Tone; hot?: boolean; ghost?: boolean }) {
  return (
    <motion.span layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: ghost ? 0.35 : 1, scale: hot ? 1.08 : 1 }}
      className="rounded border px-1 py-0.5 font-mono text-[10px] leading-none"
      style={{ borderColor: hot ? tone(t) : 'var(--border)', background: hot ? toneBg(t, 30) : 'transparent', color: hot ? 'var(--text)' : 'var(--muted)', fontWeight: hot ? 700 : 400 }}>
      {id}
    </motion.span>
  )
}

function ShardMapViz() {
  const [workers, setWorkers] = useState(3)
  const [mode, setMode] = useState<Mode>('row')
  const [coloc, setColoc] = useState<'default' | 'none'>('default')
  const [key, setKey] = useState(7)
  const [tenant, setTenant] = useState(0)
  const token = hashint4(key)
  const shard = sliceOf(token, SHARDS)
  const home = shard % workers
  // with colocate_with => 'none' the ads table is its own colocation group. Round-robin creation puts shard i on the same
  // worker anyway; the view shows the state after the rebalancer has moved one group's shards independently.
  const adsWorker = coloc === 'default' ? home : (shard + 1) % workers
  const min = -2147483648 + shard * SLICE, max = min + SLICE - 1
  const schemaHome = (i: number) => i % workers
  const next = () => { if (mode === 'schema') setTenant((t) => (t + 1) % TENANTS.length); else setKey((k) => k + 1) }

  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="sharding model" value={mode} onChange={setMode} options={[['row', 'Distributed table'], ['reference', 'Reference table'], ['schema', 'Schema-based']]} />
        <Segmented label="workers" value={String(workers) as '2' | '3' | '4'} onChange={(v) => setWorkers(+v)} options={[['2', '2 workers'], ['3', '3'], ['4', '4']]} />
        {mode === 'row' && <Segmented label="colocate_with for ads" value={coloc} onChange={setColoc} options={[['default', "ads colocated"], ['none', "colocate_with => 'none'"]]} />}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {mode === 'schema'
          ? <span className="text-muted">tenant schema <b className="font-mono text-ink">{TENANTS[tenant]}</b></span>
          : <label className="flex items-center gap-2 text-muted">company_id
            <input type="number" value={key} onChange={(e) => setKey(Math.max(-2147483648, Math.min(2147483647, Math.trunc(+e.target.value || 0))))}
              className="w-24 rounded-md border border-line bg-surface px-2 py-1 font-mono text-ink" /></label>}
        <Btn primary testid="viz-next" onClick={next}>{mode === 'schema' ? 'Next tenant' : 'Route next key'}</Btn>
      </div>

      {mode !== 'schema' && (
        <div className="overflow-x-auto rounded-lg border border-line bg-bg p-1 scrollbar-thin">
          <TokenStrip workers={workers} token={mode === 'reference' ? -2147483648 : token} shard={mode === 'reference' ? -1 : shard} />
        </div>
      )}

      {mode === 'row' && (
        <div className="grid gap-1 rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-[12px]">
          <span><span className="text-muted">hashint4({key}) =</span> <b>{token}</b></span>
          <span><span className="text-muted">shard index = floor((token + 2³¹) / 134217728) =</span> <b>{shard}</b></span>
          <span><span className="text-muted">shard =</span> <b>campaigns_{BASE.campaigns + shard}</b> <span className="text-muted">on</span> <b style={{ color: tone.text(WT[home]) }}>worker {home + 1}</b></span>
        </div>
      )}

      <Legend items={[...Array.from({ length: workers }, (_, i) => [WT[i], `worker ${i + 1}`] as [Tone, string]), ['dead', 'join crosses the network']]} />

      <div className={`grid gap-2 ${workers === 2 ? 'sm:grid-cols-2' : workers === 3 ? 'sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {Array.from({ length: workers }, (_, w) => {
          const mine = Array.from({ length: SHARDS }, (_, i) => i).filter((i) => i % workers === w)
          const adsMine = Array.from({ length: SHARDS }, (_, i) => i).filter((i) => (coloc === 'default' ? i : i + 1) % workers === w)
          return (
            <motion.div key={w} layout className="min-w-0 rounded-lg border p-2" style={{ borderColor: tone(WT[w]), background: toneBg(WT[w], 6) }}>
              <p className="mb-1 text-xs font-bold" style={{ color: tone.text(WT[w]) }}>worker {w + 1}</p>
              {mode === 'schema' ? (
                <div className="flex flex-wrap gap-1">
                  {TENANTS.map((t, i) => schemaHome(i) === w && <ShardChip key={t} id={`${t}.*`} t={WT[w]} hot={i === tenant} />)}
                </div>
              ) : mode === 'reference' ? (
                <div className="grid gap-1">
                  <p className="text-[10px] text-muted uppercase">countries (reference)</p>
                  <div className="flex flex-wrap gap-1"><ShardChip id={`countries_${BASE.countries}`} t={WT[w]} hot /></div>
                  <p className="text-[11px] text-muted">full copy · joins locally with any shard here</p>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  {(['companies', 'campaigns'] as const).map((tb) => (
                    <div key={tb}>
                      <p className="text-[10px] text-muted uppercase">{tb}</p>
                      <div className="flex flex-wrap gap-0.5">{mine.map((i) => <ShardChip key={i} id={String(BASE[tb] + i)} t={WT[w]} hot={i === shard} />)}</div>
                    </div>
                  ))}
                  <div>
                    <p className="text-[10px] text-muted uppercase">ads {coloc === 'none' && '(own group, after a rebalance)'}</p>
                    <div className="flex flex-wrap gap-0.5">{adsMine.map((i) => <ShardChip key={i} id={String(BASE.ads + i)} t={coloc === 'none' && i === shard && adsWorker !== home ? 'dead' : WT[w]} hot={i === shard} />)}</div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2 [&>*]:min-w-0">
        {mode === 'row' && <>
          <Panel title="pg_dist_shard + pg_dist_placement">
            <FieldTable rows={[['logicalrelid', 'campaigns'], ['shardid', String(BASE.campaigns + shard)], ['shardminvalue', String(min)], ['shardmaxvalue', String(max)], ['placement', `worker ${home + 1}`, 'pg_dist_placement → pg_dist_node']]} />
          </Panel>
          <Panel title="What the join needs">
            <p className="text-sm"><Md>{coloc === 'default'
              ? `companies **${BASE.companies + shard}**, campaigns **${BASE.campaigns + shard}** and ads **${BASE.ads + shard}** cover the same token range on the same worker. A join or foreign key on \`company_id\` runs **inside worker ${home + 1}**.`
              : adsWorker === home
                ? `With \`colocate_with => 'none'\` the ads shard sits on worker ${home + 1} too (round-robin placed it there), but nothing guarantees it: the rebalancer moves each colocation group on its own. Citus will not push the join down.`
                : `Here a rebalance has moved ads **${BASE.ads + shard}** to **worker ${adsWorker + 1}**, while campaigns **${BASE.campaigns + shard}** stayed on worker ${home + 1}. A join on \`company_id\` must move rows between workers, and foreign keys between the tables are not allowed.`}</Md></p>
          </Panel>
        </>}
        {mode === 'reference' && <>
          <Panel title="create_reference_table('countries')">
            <p className="text-sm"><Md>{`One shard, **${BASE.countries}**, with a copy on every worker. Any shard can join it locally. A write must change ${workers} copies, so it commits with **two-phase commit**.`}</Md></p>
          </Panel>
          <Panel title="Use it for">
            <p className="text-sm"><Md>{'Small tables that many distributed tables join: countries, plans, currencies. Tables without a tenant column. Tables that need a unique constraint on a column that is not the distribution column.'}</Md></p>
          </Panel>
        </>}
        {mode === 'schema' && <>
          <Panel title="citus_schema_distribute('acme')">
            <p className="text-sm"><Md>{`Schema-based sharding (Citus 12+): each distributed schema is one colocation group that lives on one node. Tables inside have **no shard key**. \`${TENANTS[tenant]}.*\` lives on **worker ${schemaHome(tenant) + 1}**; \`SET search_path = ${TENANTS[tenant]}\` routes there.`}</Md></p>
          </Panel>
          <Panel title="Row-based or schema-based">
            <FieldTable rows={[['schema-based', 'about 1–10k tenants', 'no key changes; no cross-schema FKs'], ['row-based', 'about 1–1M+ tenants', 'tenant column in every table and key']]} />
          </Panel>
        </>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------------------------------ */

const SETUP = `${TRY_SQL}

-- Stand-in for Citus metadata: 32 equal int32 hash ranges, placed round-robin on 2 workers
CREATE TABLE pg_dist_shard_sim AS
SELECT 102040 + i AS shardid,
       (-2147483648 + i::bigint * 134217728)           AS shardminvalue,
       (-2147483648 + (i::bigint + 1) * 134217728 - 1) AS shardmaxvalue,
       'worker' || (i % 2 + 1)                         AS node
FROM generate_series(0, 31) i;

${ADS_SCHEMA}`

export const lesson: Lesson = {
  slug: 'sharding-citus',
  module: 'e3',
  order: 2,
  title: 'Sharding with Citus',
  tldr: [
    '**Citus** is a PostgreSQL extension that hash-splits each distributed table by a **distribution column** into shards, ordinary tables spread over worker nodes, and routes or parallelizes queries from a coordinator.',
    'It exists to scale one database past one machine while keeping PostgreSQL itself, as long as the data model is built around a shard key such as the tenant id.',
  ],
  visualizer: {
    title: 'A shard map: from a key to a worker',
    caption: 'Type a company_id or press Route next key. Change the worker count, break colocation for ads, or switch to reference and schema-based sharding.',
    Component: ShardMapViz,
  },
  playground: {
    setup: SETUP,
    presets: [
      { label: 'The shard map', sql: `SELECT shardid, shardminvalue::text, shardmaxvalue::text, node
FROM pg_dist_shard_sim ORDER BY shardid LIMIT 6;

SELECT node, count(*) AS shards FROM pg_dist_shard_sim GROUP BY node ORDER BY node;`,
        note: 'This table models Citus\'s `pg_dist_shard` on one node: 32 ranges of 134,217,728 hash tokens each, placed round-robin. Citus itself is not installed here.' },
      { label: 'Route a key to its shard', sql: `CREATE FUNCTION shard_for(company int) RETURNS TABLE (token int, shardid int, node text)
LANGUAGE sql STABLE AS $$
  SELECT hashint4(company), s.shardid, s.node
  FROM pg_dist_shard_sim s WHERE hashint4(company) BETWEEN s.shardminvalue AND s.shardmaxvalue
$$;

SELECT g AS company_id, r.* FROM generate_series(1, 8) g, shard_for(g) r;`,
        note: 'Hash the key, find the range that contains the token, read the node. Company 7 hashes to -978793473, which falls in shard 102048 on worker1: the same numbers the visualizer shows with 2 workers.' },
      { label: 'Colocation: one company, one shard index', sql: `SELECT c.id AS company_id,
       c.tableoid::regclass AS companies_part,
       (SELECT DISTINCT tableoid::regclass FROM campaigns WHERE company_id = c.id) AS campaigns_part,
       (SELECT DISTINCT tableoid::regclass FROM ads WHERE company_id = c.id) AS ads_part
FROM companies c WHERE c.id <= 6 ORDER BY 1;`,
        note: 'All three tables are split by the same key with the same modulus, so a company\'s rows always land in partitions with the same suffix. Citus colocation makes the same promise across machines.' },
      { label: 'Unique keys must include the shard key', sql: `SELECT try_sql($$CREATE TABLE users_bad (company_id int, email text UNIQUE) PARTITION BY HASH (company_id)$$) AS unique_email;
SELECT try_sql($$CREATE TABLE users_ok (company_id int, email text, UNIQUE (company_id, email)) PARTITION BY HASH (company_id)$$) AS unique_per_company;`,
        note: 'No single part can check uniqueness across all parts, so the key column is required. Citus applies the same rule to distributed tables: unique per tenant is easy, globally unique is not.' },
      { label: 'Foreign keys inside a colocation group', sql: `SELECT conrelid::regclass AS table_name, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE contype = 'f' AND conparentid = 0
  AND conrelid IN ('campaigns'::regclass, 'ads'::regclass);

SELECT try_sql('INSERT INTO ads VALUES (7, 999999, 123456, 0)') AS ad_for_missing_campaign;`,
        note: 'The foreign key includes `company_id`, so the parent row is always in the matching part. In Citus this is the only way a distributed table may reference another one.' },
      { label: 'Schema per tenant', sql: `CREATE SCHEMA tenant_acme;
CREATE TABLE tenant_acme.campaigns (id int PRIMARY KEY, name text, budget numeric(10,2));
INSERT INTO tenant_acme.campaigns VALUES (1, 'spring sale', 500), (2, 'retargeting', 250);

SET search_path = tenant_acme, public;
SELECT current_schemas(false) AS path, count(*) AS acme_campaigns FROM campaigns;
RESET search_path;`,
        note: 'Same table name, no tenant column: `search_path` chooses the tenant. Schema-based sharding in Citus distributes whole schemas like this one, each to one node.' },
    ],
  },
  production: {
    title: 'Sharding a multi-tenant ad platform by company',
    context: 'An ad platform keeps companies, campaigns and ads in one PostgreSQL. A few hundred companies, a few billion ads, and the largest table no longer fits the cache of the biggest server it can buy.',
    problem: 'Primary keys are plain `id` columns, so nothing in the schema says which rows belong together. Distributing as is would make every join a cross-node join and every unique key unenforceable.',
    solution: 'Add `company_id` to every table and make it lead every primary and foreign key. Distribute the root table first, colocate the others with it, and turn small shared tables into reference tables. Then every tenant query carries the key and becomes a single-shard query.',
    sql: `-- on the Citus coordinator
ALTER TABLE ads DROP CONSTRAINT ads_pkey, ADD PRIMARY KEY (company_id, id);

SELECT create_distributed_table('companies', 'id');
SELECT create_distributed_table('campaigns', 'company_id', colocate_with => 'companies');
SELECT create_distributed_table('ads',       'company_id', colocate_with => 'companies');
SELECT create_reference_table('countries');
SELECT truncate_local_data_after_distributing_table('ads');  -- drop the coordinator's leftover copy

SELECT get_shard_id_for_distribution_column('campaigns', 7);  -- which shard holds company 7
SELECT table_name, citus_table_type, distribution_column, colocation_id, shard_count FROM citus_tables;`,
    outcome: 'Each company\'s companies, campaigns and ads shards sit on the same worker, so dashboard queries filtered by `company_id` touch one shard, and foreign keys keep working. Adding a worker and rebalancing adds capacity without touching application queries.',
  },
  pitfalls: [
    { title: 'A unique key without the distribution column',
      symptom: '`create_distributed_table` fails on a table with `UNIQUE (email)`, or a team drops the constraint to get past it and later finds duplicate emails.',
      cause: 'Citus does not check uniqueness across workers. A primary key or unique constraint must include the distribution column so that one shard can enforce it.',
      fix: 'Make uniqueness per tenant: `UNIQUE (company_id, email)`. If a value must be unique across all tenants, keep it in a reference table or a separate lookup table.',
      sql: `ALTER TABLE users DROP CONSTRAINT users_email_key,
  ADD CONSTRAINT users_company_email_key UNIQUE (company_id, email);` },
    { title: 'Distributing the child before the parent',
      symptom: '`create_distributed_table` on the referencing table fails with a foreign key error, because the table it points at is still an ordinary local table.',
      cause: 'The foreign key target was still a local table when the referencing table was distributed.',
      fix: 'Distribute in dependency order: the referenced table first, then the tables that point at it, with `colocate_with`. Foreign keys from a reference table to a distributed table are never allowed.' },
    { title: 'A distribution column with few values',
      symptom: 'One worker is at 100% CPU and holds most of the data while the others idle.',
      cause: 'The column has few distinct values (a country, a status) or one value dominates (one huge tenant). Hashing cannot spread what is not there.',
      fix: 'Pick a high-cardinality key that matches how queries filter, usually the tenant id. Move one very large tenant to its own shard with `isolate_tenant_to_new_shard`.',
      sql: `SELECT isolate_tenant_to_new_shard('companies', 42, cascade_option => 'CASCADE');` },
    { title: 'The coordinator keeps a local copy',
      symptom: 'After `create_distributed_table` the coordinator\'s disk usage does not drop, although the data now lives on the workers.',
      cause: 'Distributing copies existing rows into the shards and leaves the original local data on the coordinator.',
      fix: 'Run `truncate_local_data_after_distributing_table(\'table\')` once the copy is verified.' },
  ],
  pointers: [
    'A distributed table is split by `hashint4`-style hashing of the **distribution column** into `citus.shard_count` (default **32**) shards, each an ordinary table named `<table>_<shardid>` on a worker.',
    '`pg_dist_shard` stores each shard\'s token range, `pg_dist_placement` its node. The coordinator routes a query that pins the key to one shard.',
    '**Colocated** tables share ranges and placements, so joins and foreign keys on the key stay local. **Reference** tables are copied to every worker and written with 2PC.',
    'Primary keys and unique constraints must **include the distribution column**, the same rule as for [partitioned tables](/m7/partitioning). Foreign keys work between colocated tables on the key, or to reference tables.',
    'Schema-based sharding (Citus 12+) distributes whole schemas, each kept entirely on one node, for apps with up to thousands of tenants and no tenant column. The theory of splitting tables: [fragmentation, allocation and replication](/e5/fragmentation-replication).',
  ],
  sources: ['ddl-partitioning.html', 'ddl-constraints.html', 'functions-info.html', 'ddl-schemas.html'],
}
