# Distributed PostgreSQL

Scope: architectures for running PostgreSQL across machines (shared/disaggregated storage, streaming replicas, HA clusters,
sharding extensions, distributed SQL, multi-master active-active, FDW-based sharding), distributed transactions and clocks,
what behaves differently from single-node PostgreSQL, and what the in-browser PGlite 0.5.16 (PostgreSQL 18.6) playground can
really demonstrate. All PGlite SQL in this file was run on 2026-11-14 with `@electric-sql/pglite` 0.5.16 under Node 26, unless
marked UNTESTED.

Conventions: **[P]** = primary source (official docs/README), **[S]** = secondary (vendor marketing, blog, forum).
**UNVERIFIED** = from prior knowledge, not confirmed in a source read for this file. Verify those before a lesson states them as fact.

---

## Sources read

### Pages in the slice (all read in full)
| # | URL | Contributed | Type |
|---|---|---|---|
| 13 | https://www.yugabyte.com/key-concepts/postgresql/ | "PostgreSQL is not a distributed database"; history (POSTGRES 1986, 4.2 June 1994, Postgres95, renamed 1996). Marketing framing of "SQL API compatible" systems. | S (vendor) |
| 14 | https://www.crunchydata.com/blog/an-overview-of-distributed-postgresql-architectures (Marco Slot, 8 Jan 2024) | Best single taxonomy: network-attached block storage, read replicas, DBMS-optimized cloud storage, active-active, transparent sharding, distributed KV + SQL. Pros/cons and numeric guidelines (>100k reads/s, >100GB working set, ~20µs→~1000µs disk latency, ~1M→~10k IOPS, 20 ms txn = 50 txn/s per session). Author is a Citus architect. | S (expert blog) |
| 15 | https://www.pgedge.com/solutions/what-is-distributed-postgres | pgEdge product list: Spock multi-master logical replication, LOLOR (large objects), Snowflake sequences, PG 16–18 packages, PostgreSQL licence claim. Marketing. | S (vendor) |
| 16 | https://www.enterprisedb.com/distributed-postgresql-always-on-database-availability | EDB PGD architecture vocabulary: node groups, multiple masters, write leader, async mesh replication, logical standbys ("physical standbys not supported"), consensus-based connection routing, DDL replication. Marketing. | S (vendor) |
| 17 | https://www.instaclustr.com/education/postgresql/postgresql-cluster-hands-on-guide-setup-optimization-and-monitoring/ | Meanings of "cluster"; Patroni/CloudNativePG/PgBouncer/HAProxy roles. Contains several outdated or wrong settings (see Contradictions). | S (vendor tutorial) |
| 18 | https://dev.to/aurelmegn/setting-up-distributed-database-architecture-with-postgresql-261 | Old-style (PG 9.5) FDW sharding with table inheritance + CHECK + routing triggers + `postgres_fdw`. Useful as a "before declarative partitioning" contrast; has errors. | S (blog) |
| 21 | https://www.geeksforgeeks.org/dbms/distributed-database-system/ | Textbook taxonomy: homogeneous/heterogeneous, client-server, peer-to-peer, cloud; replication vs fragmentation (horizontal/vertical); concurrency control. Generic, partly oversimplified. | S (education) |
| 22 | https://news.ycombinator.com/item?id=38914764 | Discussion of #14. Opinion/experience only: Yugabyte staff dispute "distributed KV" framing and benchmark; Aurora 6-copy / 4-of-6 quorum (confirmed by AWS below); Neon as open-source Aurora-like; Oracle RAC as shared-storage "active-active". | S (forum, opinion) |
| 23 | https://www.yugabyte.com/blog/postgresql-vs-distributed-sql-behavior-differences/ (14 Aug 2023, YugabyteDB 2.17.3) | Latency of multi-shard RPCs, catalog cache on new connections (use pooling), default isolation then = Snapshot → 40001 retries. Partly superseded (see version notes). | S (vendor blog) |
| 20 | medium.com (distributed Postgres architectures) | NOT READ: bot wall ("Just a moment..."). Skipped as instructed. | — |

### Primary sources fetched for this file
| URL | Contributed | Type |
|---|---|---|
| https://learn.microsoft.com/en-us/postgresql/citus/reference-ddl?view=citus-14 | Citus DDL: `create_distributed_table`, reference tables (2PC on writes), schema-based sharding (12.0), colocation (`colocate_with`), FK/unique rules, DDL propagation, `citus.create_object_propagation`, 13.1/13.3 any-node DDL. | P |
| https://learn.microsoft.com/en-us/postgresql/citus/api-guc?view=citus-14 | Citus GUCs with defaults (shard_count 32, max_adaptive_executor_pool_size 16, distributed_deadlock_detection_factor 2, multi_shard_commit_protocol 2pc, ...). | P |
| https://learn.microsoft.com/en-us/postgresql/citus/api-udf?view=citus-14 | Citus UDFs: argument lists and defaults; rebalancer (`citus_rebalance_start`, by_disk_size default), `citus_move_shard_placement`, `isolate_tenant_to_new_shard`, `citus_drain_node`, `get_shard_id_for_distribution_column`. | P |
| https://learn.microsoft.com/en-us/postgresql/citus/reference-processing?view=citus-14 | Citus query pipeline: distributed planner/executor, MX mode (Citus 11+), delayed fast path (13.2), push-pull recursive planning, verbatim EXPLAIN. | P |
| https://docs.citusdata.com/en/stable/get_started/concepts.html | Coordinator/workers, distribution column, reference/local tables, shards `<table>_<shardid>`, placements, `pg_dist_shard`/`pg_dist_placement`/`pg_dist_node`, schema vs row sharding tenant counts. | P |
| https://docs.citusdata.com/en/stable/develop/reference_processing.html | Same content, older site. | P |
| https://docs.citusdata.com/en/stable/develop/reference_workarounds.html | Citus SQL limitations (correlated subqueries, recursive CTEs, grouping sets, FOR UPDATE single-shard only, sequences < BIGINT, etc.). | P |
| https://docs.citusdata.com/en/stable/develop/reference_ddl.html | Headings only; confirmed no sequence text there. | P |
| https://docs.yugabyte.com/preview/architecture/ | YQL/DocDB, YB-TServer/YB-Master, Raft per tablet, leader per tablet. | P |
| https://docs.yugabyte.com/preview/architecture/docdb-sharding/sharding/ | Hash vs range sharding, 2-byte hash space 0x0000–0xFFFF, ≤64K tablets. | P |
| https://docs.yugabyte.com/preview/api/ysql/the-sql-language/statements/ddl_create_table/ | `PRIMARY KEY ((a,b) HASH, c DESC)`, first column hashed by default, `SPLIT INTO n TABLETS`, `SPLIT AT VALUES`, `COLOCATION`, `ybrowid`. | P |
| https://docs.yugabyte.com/preview/explore/transactions/isolation-levels/ | YSQL isolation mapping, `yb_enable_read_committed_isolation`, v2025.2 default change. | P |
| https://docs.yugabyte.com/preview/architecture/transactions/distributed-txns/ | Provisional records (IntentsDB), transaction status tablet, commit = status flip, ~2 s leader re-election. | P |
| https://docs.yugabyte.com/preview/architecture/transactions/transactions-overview/ | Hybrid logical clock = (physical, logical). | P |
| https://docs.yugabyte.com/stable/reference/configuration/postgresql-compatibility/ | Enhanced PostgreSQL Compatibility Mode flags and versions. | P |
| WebSearch on docs.yugabyte.com (PG15 base) | v2025.1.0.0 (23 Jul 2025) = first stable release on PG 15 (earlier: PG 11.2). | P (search summary of docs) |
| https://docs.pgedge.com/spock_ext/ , /conflicts , /configuring , /limitations | Spock v5.0.14: PG 15–19, GUCs and defaults, conflict resolution values, delta-apply, limitations. | P |
| https://www.enterprisedb.com/docs/pgd/latest/ | PGD 6.5 overview (built on BDR, commit scopes, subscriber-only nodes). | P |
| https://www.enterprisedb.com/docs/pgd/latest/reference/sequences/ | PGD sequence kinds (distributed default, snowflakeid, galloc, timeshard, local), limits. | P |
| https://www.enterprisedb.com/docs/pgd/latest/reference/tables-views-functions/conflicts/ | PGD conflict types and default resolvers; 6.0 conflict logging off by default. | P |
| https://www.enterprisedb.com/docs/pgd/latest/commit-scopes/ and /commit-scope-rules/ | Commit scope kinds and rule grammar; GROUP COMMIT legacy → QUORUM COMMIT. | P |
| https://patroni.readthedocs.io/en/latest/ , /yaml_configuration.html , /dynamic_configuration.html , /rest_api.html | Patroni: PG 9.3–18, DCS options, `ttl 30 / loop_wait 10 / retry_timeout 10`, `loop_wait + 2*retry_timeout <= ttl`, REST health endpoints. | P |
| https://neon.com/docs/introduction/architecture-overview | Neon compute / safekeepers (Paxos quorum) / pageserver / object storage. | P |
| https://aws.amazon.com/blogs/database/introducing-the-aurora-storage-engine/ | Aurora: 10 GB protection groups, 6 copies in 3 AZs, write quorum 4/6, 64 TB, 15 replicas. | P (vendor engineering blog) |
| Local: curriculum/research/E-*.md, I-*.md, O-*.md, D-*.md, G-*.md, C-*.md | PostgreSQL 18 docs distilled: replication solutions matrix (Table 26.1), synchronous_commit levels, sync standby syntax, logical replication model/conflicts/restrictions, 2PC, postgres_fdw transaction semantics. | P |

Unreadable: 1 page (Medium, bot wall). Not found (404): Citus `reference-limitations` on learn.microsoft.com (used docs.citusdata.com workarounds page instead); a PGD `types_of_conflict` URL (used the reference page instead).

---

## Core concepts

### 1. What "distributed PostgreSQL" means (and does not)
- PostgreSQL itself is a single-node RDBMS: one server process tree, one data directory, one WAL stream. It ships
  **replication** (physical streaming, logical publish/subscribe) and **foreign data wrappers**, but no built-in sharding,
  no distributed transaction manager, no automatic failover. [P: PG docs §26 "PostgreSQL does not offer this" (synchronous multimaster)]
- Every "distributed PostgreSQL" is one of (or a combination of) three mechanisms (Crunchy [S]):
  - **Replication**: copies of the same data on different machines.
  - **Distribution** (partitioning/sharding): different parts of the data on different machines.
  - **Decentralization**: different DBMS activities on different machines (e.g. storage vs compute).
- The word "cluster" is overloaded (Instaclustr [S], PG docs [P]): (1) PostgreSQL "database cluster" = all databases served
  by one server instance from one `PGDATA`; (2) an HA cluster of a primary + standbys; (3) the SQL `CLUSTER` command (physical
  reorder by an index, takes ACCESS EXCLUSIVE). Lessons must say which one.

### 2. Why latency dominates (the one idea to teach first)
- PostgreSQL's protocol is synchronous and interactive: the client waits for each statement's answer before the next.
  Any network round trip inside a transaction multiplies. Crunchy [S]: if transactions average **20 ms**, one session can do
  only **50 transactions/s**; throughput then needs many sessions, but `max_connections` is usually hundreds to low thousands,
  and locks held across round trips cut concurrency further.
- Single-node baseline (Crunchy [S]): local NVMe >1M IOPS, disk latency tens of µs. Network-attached block storage: often
  <10K IOPS and >1 ms writes ("~20µs → ~1000µs", "~1M → ~10k IOPS", "~2 orders of magnitude").
- HN anecdote [S]: ~1 ms per simple query is normal; "single node Postgres (with a beefy machine) can definitely manage in the
  100k transactions per second" (Craig Kerstiens, opinion).
- Consequence for every distributed design: keep transactions on **one shard / one node** whenever possible ("router" queries in
  Citus; "single-shard fast path" in YugabyteDB), batch statements (COPY, multi-row INSERT, stored procedures), and pool connections.

### 3. Taxonomy of architectures
Note: these are orthogonal; real systems stack them (e.g. sharded + replicas + network storage). (Crunchy [S])

| # | Architecture | Examples | Writes accepted on | Consistency seen by clients | Main failure mode | Main cost |
|---|---|---|---|---|---|---|
| A | Network-attached block storage | EBS, Azure disks under RDS etc. | one primary | same as single node | VM dies → respawn + reattach + crash recovery | ~1 ms disk latency, low IOPS |
| B | Shared/disaggregated DBMS-optimized storage | Aurora, AlloyDB, Neon | one primary (compute) | same as single node for the primary; replicas lag | storage quorum loss; compute restart | higher write latency (multi-AZ quorum), cost; not upstream PG |
| C | Physical streaming replicas (hot standby) + HA manager | built-in + Patroni/etcd, CloudNativePG | one primary | primary: full; replicas: stale, no read-your-writes, no monotonic reads | failover loses un-replicated commits if async; split-brain if no fencing | async lag or sync latency |
| D | Logical replication (one-way) | built-in pub/sub, pglogical | publisher (subscriber may also write → conflicts) | eventual on subscriber | apply stops on conflict | no DDL/sequence replication |
| E | Multi-master active-active (async logical) | EDB PGD (BDR), pgEdge Spock, Bucardo | every node | eventual; conflicts resolved after commit (often last-update-wins) | lost updates, divergence, uniqueness violations across nodes | application must be conflict-aware |
| F | Transparent sharding extension | Citus | coordinator (or any node in MX mode) | per-shard snapshot; cross-shard writes atomic via 2PC | worker down → its shards unavailable unless replicated (HA per node) | higher latency; data model must include shard key |
| G | Distributed SQL (KV/LSM store + Raft + PG-derived SQL layer) | YugabyteDB, CockroachDB, Spanner (PG interface) | any node (leader per tablet) | strong (Raft) + Snapshot/Serializable/RC; HLC timestamps | majority loss of a tablet's replicas → that tablet unavailable | many internal RPCs; joins/FK checks cross nodes; "not actually PostgreSQL" |
| H | FDW-based sharding (DIY) | postgres_fdw foreign tables as partitions | the node owning the shard (via coordinator) | no cross-server atomicity (no 2PC in postgres_fdw); remote snapshot = REPEATABLE READ | partial commits; no global unique/FK | manual routing, DDL, rebalancing |
| I | Shared-disk failover / RAC-style | NAS + cold standby; Oracle RAC (not PG) | one (PG) | single copy | disk array failure kills both | special hardware |

Per-architecture details:

**A. Network-attached block storage** (Crunchy [S]). Block device API over the network; service replicates each write to 2–3
storage nodes. Pros: durability, VM can be replaced and disk reattached, snapshots for backups/replicas, resizable. Cons: latency,
IOPS, crash recovery on restart, cost. Guideline: usually worth it, "but PostgreSQL can be much faster".

**B. DBMS-optimized cloud storage** (Crunchy [S], AWS [P], Neon [P]).
- Idea: the primary writes only WAL; the storage layer replays WAL into pages (removes background page writes from the primary).
- Aurora [P, AWS blog]: volume made of **10 GB protection groups**, each on **6 storage nodes across 3 AZs**; a write is durable
  after **4 of 6** acknowledge; recovery needs 3 nodes caught up to the same LSN; volume limit stated as **64 TB** (in that post; later
  raised, UNVERIFIED current limit); up to **15** replicas sharing the volume. HN [S] adds commit waits show as `IO:XactSync`.
- Neon [P]: **compute** (stateless Postgres) streams WAL to **safekeepers** (commit when a quorum acknowledges, **Paxos**);
  **pageserver** materializes page versions and serves "page at LSN" reads; **object storage** holds history; branching is
  copy-on-write metadata. HN [S]: Neon is open source ("open-source Aurora"), contradicting Crunchy's "not OSS" con.
- Cons (Crunchy [S]): write latency high by default (multi-AZ), read misses go to storage, price; "PostgreSQL is not designed for it".

**C. Streaming replicas + HA** (PG docs [P], Patroni [P], Crunchy [S]).
- Physical replication ships WAL; standbys are read-only (hot standby). PG's replication-solutions table: WAL shipping =
  "primary failure will never lose data: with sync on"; "no waiting for multiple servers: with sync off".
- Read scaling: linear for reads, offloads primary. Hazards: **no read-your-writes** (async), **no monotonic reads** when load
  balancing across replicas, each replica caches the same working set (poor cache usage). Crunchy guideline: consider replicas at
  **>100k reads/s** or CPU-bound reads; avoid for dependent read-after-write.
- PG has no built-in automatic failover ("Because native PostgreSQL does not provide automated failover out of the box", Instaclustr [S];
  PG docs describe manual `pg_ctl promote` / `pg_promote()` and STONITH [P]). Patroni adds leader election via a DCS.

**D/E. Logical replication and multi-master** — see concept 7 and 8.

**F. Transparent sharding (Citus)** — see concept 5.

**G. Distributed SQL (YugabyteDB)** — see concept 6. Crunchy [S] calls it "distributed key-value store with SQL"; Yugabyte staff
on HN [S] object (DocDB is an LSM document store with column-level versioning; colocated tables give local joins). Treat the label
as contested; describe mechanics instead.

**H. FDW-based sharding** — see concept 9.

### 4. CAP, PACELC and the consistency vocabulary
(Theory background; UNVERIFIED wording, standard literature: Brewer 2000 / Gilbert & Lynch 2002 for CAP; Abadi 2012 for PACELC.)
- **CAP**: during a network **P**artition a replicated system must choose **C**onsistency (refuse some requests) or
  **A**vailability (answer, possibly stale/divergent).
  - Raft/Paxos systems (YugabyteDB tablets, Patroni's DCS, Neon safekeepers, Aurora quorum) are **CP**: the minority side stops.
  - Async multi-master (PGD/Spock default) is **AP**: every site keeps writing; conflicts resolved later.
  - HN [S] point worth teaching: Oracle RAC-style shared storage "isn't distributed data", so CAP framing barely applies
    (and NavinF's reply: if it keeps serving with one node it's not CAP-consistent across a partition).
- **PACELC**: if **P**artition then A vs C, **E**lse (normal operation) **L**atency vs **C**onsistency. This is the everyday trade-off:
  synchronous replication / quorum commit buys consistency with a round trip on every commit.
  - PostgreSQL exposes this knob directly: `synchronous_commit` (`off`, `local`, `remote_write`, `on`, `remote_apply`) and
    `synchronous_standby_names` (`FIRST n (...)`, `ANY n (...)`). [P]
- Client-visible guarantees to name in lessons (Crunchy [S]): read-your-writes, monotonic reads, linear history per row
  (active-active lacks it: "updates might conflict after commit"), snapshot isolation scope (Citus: per shard).
- **RPO/RTO**: HN [S] (Yugabyte staff): shared-nothing DBs typically RPO=0 with RTO in seconds; PG can get RPO=0 with
  synchronous replication to ≥2 standbys (with one sync standby the primary stalls if it dies) plus Patroni. Opinion, but consistent with PG docs.

### 5. Citus (sharding extension) [P unless noted]
Docs version: Citus 14 docs on learn.microsoft.com (updated 2026-06); version notes for 11.0, 12.0, 13.1, 13.2, 13.3 below.

**Nodes and metadata**
- One **coordinator**, N **workers**. Coordinator keeps metadata and routes or parallelizes each query.
- **MX mode** (Citus 11+): clients may connect to any worker; metadata is synced to all nodes (`citus.metadata_sync_mode`
  `transactional` default | `nontransactional`). Enabled by default on managed Citus.
- Metadata tables: `pg_dist_node` (nodes, health), `pg_dist_shard` (one row per shard: `shardid`, `shardminvalue`,
  `shardmaxvalue` hash range), `pg_dist_placement` (shard → node), `pg_dist_partition` (table → distribution method/colocation),
  `pg_dist_colocation` (colocation groups), `pg_dist_rebalance_strategy`.
- Views/functions: `citus_tables`, `citus_shards`, `citus_stat_statements`, `citus_stat_tenants`, `citus_stat_counters` (off by default).

**Table types**
1. **Distributed** (hash, by a **distribution column**): rows hashed into `citus.shard_count` shards (default **32**).
   Each shard is a regular PG table on a worker named `<table>_<shardid>`, e.g. `github_events_102027`. Shards are hidden from
   catalog listings except for clients matching `citus.show_shards_for_app_name_prefixes` (default `''`).
2. **Reference**: one shard replicated to every worker; writes use **two-phase commit** for strong consistency. For small, widely joined
   tables (e.g. `states`), tables without a tenant column, or tables needing multi-column unique constraints.
3. **Local** (plain coordinator table). "Citus managed local tables" are added to metadata with
   `citus_add_local_table_to_metadata` or automatically when an FK between a reference and local table is created
   (`citus.enable_local_reference_table_foreign_keys`, default on; coordinator must be registered via `citus_add_node`).
4. **Schema-based sharding** (Citus 12.0+): each distributed schema is one colocation group and lives on one node; tables in it have
   no shard key. `SELECT citus_schema_distribute('s')` or `SET citus.enable_schema_based_sharding TO ON; CREATE SCHEMA ...`.
   Docs' guidance: schema-based ~1–10k tenants, no cross-schema FKs; row-based ~1–1M+ tenants with parallel cross-tenant queries.

**Hashing and shard ranges**
- `create_distributed_table` hashes the distribution column value with PostgreSQL's hash function for the type; each shard owns a
  slice of the int32 hash token space (`shardminvalue..shardmaxvalue`). With 32 shards each slice is 2^32/32 = 134,217,728 tokens,
  first shard starting at -2147483648. (Slice arithmetic UNVERIFIED in a page read here; the concepts page only says "hash range".)
- `get_shard_id_for_distribution_column('my_table', 4)` → shard id (example output `540007`).

**Colocation**
- Default `colocate_with => 'default'`: tables with same distribution column **type** and **shard count** are implicitly colocated
  (same token ranges on the same nodes). `'none'` starts a new group; a table name joins that table's group.
- Colocated tables join and enforce FKs locally on each node. Unrelated tables accidentally colocated move together during
  rebalancing ("cascade"); break with `update_distributed_table_colocation`.

**Constraints (the big behavioral difference)**
- "Citus doesn't cross-reference uniqueness constraints or referential integrity between worker nodes."
- PRIMARY KEY and UNIQUE **must include the distribution column**; otherwise an error.
- FKs allowed: local↔local, reference↔reference, reference↔local (default on), distributed→reference, and between colocated
  distributed tables **when the key includes the distribution column**. Not allowed: reference → distributed.
  No `ON DELETE/UPDATE CASCADE` from reference to local.
- NOT NULL and CHECK fine anywhere; `NOT VALID` + `VALIDATE CONSTRAINT` supported for CHECK and FKs.
- Distribute the FK **target** first, else `ERROR: cannot create foreign key constraint / DETAIL: Referenced table must be a distributed table or a reference table.`

**DDL**
- Most DDL auto-propagates from the coordinator (`citus.enable_ddl_propagation` default true). Altering the distribution column's
  type is refused: `ERROR:  cannot execute ALTER TABLE command involving partition column`.
- `CREATE INDEX CONCURRENTLY` supported (avoids write lock).
- Citus 11.0 changed object propagation to prioritize schema consistency; mixing a parallel distributed operation and later object
  creation in one transaction errors (`cannot run type command because there was a parallel operation on a distributed table in the transaction`).
  Workarounds: `citus.create_object_propagation = deferred` or `citus.multi_shard_modify_mode = sequential`.
- 13.1: GRANT/REVOKE on columns, ALTER DATABASE, role DDL propagated (some from any node). 13.3: CREATE/DROP/ALTER SCHEMA, VIEW,
  MATERIALIZED VIEW from any node; TABLE/INDEX/TRIGGER DDL from any node for distributed-schema tables.

**Query planning and execution**
- Single-shard queries (filter on distribution column, or single-row modifications): the planner finds the shard and rewrites the
  query to the shard table ("router"/"fast path"). Citus 13.2 **delayed fast path planning** (`citus.enable_local_fast_path_query_optimization`,
  default on): in MX mode, if the shard is local, reuse a cached plan, skipping deparse/parse/plan (SELECT/UPDATE, no volatile functions,
  not reference tables).
- Multi-shard SELECT: plan transformed into commutative/associative form; split into a coordinator query and worker fragments,
  one task per shard; results merged on the receiving node (good for aggregates that shrink data).
- Subqueries/CTEs that cannot be pushed down: **recursive planning / push-pull**: run subplan, ship intermediate result to workers
  (`read_intermediate_result`), continue. Limit `citus.max_intermediate_result_size` (default 1 GB, -1 unlimited).
- Non-colocated joins: **repartition joins** disabled by default (`citus.enable_repartition_joins` = false).
- Executor = **adaptive executor**, visible as `Custom Scan (Citus Adaptive)` with `Task Count: 32`, `Tasks Shown: One of 32`.
- Connection GUCs: `citus.max_adaptive_executor_pool_size` 16 (per session per worker), `citus.max_shared_pool_size` (default =
  coordinator's `max_connections`, -1 disables), `citus.local_shared_pool_size` (half of `max_connections`),
  `citus.max_cached_conns_per_worker` 1, `citus.executor_slow_start_interval` 10 ms, `citus.force_max_query_parallelization` false.

**Distributed transactions in Citus**
- Reference-table writes: 2PC (docs). COPY into hash-distributed tables: `citus.multi_shard_commit_protocol` = `2pc` (default) or `1pc`;
  with 2pc "increase max_prepared_transactions on all the workers, typically to the same value as max_connections".
- Distributed deadlock detection: checks after `deadlock_timeout × citus.distributed_deadlock_detection_factor` (default **2**; -1 disables).
- Multi-shard modifications in general also commit with 2PC, with a recovery daemon using a `pg_dist_transaction` log and
  `recover_prepared_transactions()` — UNVERIFIED (not in pages read).
- Isolation concession (Crunchy [S], by a Citus architect): "snapshot isolation only at shard level" — a multi-shard read can see
  one shard before and another after a concurrent multi-shard commit.

**Rebalancer and data movement**
- `citus_rebalance_start(threshold, drain_only, rebalance_strategy, parallel_transfer_colocated_shards false, parallel_transfer_reference_tables false)`
  runs as a background job; monitor `citus_rebalance_status()`, stop `citus_rebalance_stop()`, wait `citus_rebalance_wait()`;
  preview `get_rebalance_table_shards_plan()`. Default strategy **by_disk_size** (`citus.rebalancer_by_disk_size_base_cost` 100MB per
  shard group); `by_shard_count` assumes equal shards/nodes. `threshold` 0.0–1.0 (e.g. 0.1 = ±10% of average utilization).
- Shard moves: `citus_move_shard_placement(shard_id, source_node_name, source_node_port, target_node_name, target_node_port, shard_transfer_mode)`.
  `shard_transfer_mode`: `auto` (logical replication if replica identity exists, else blocking COPY), `force_logical`
  (concurrent UPDATE/DELETE on tables without replica identity fail), `block_writes`. Cluster default GUC `citus.shard_transfer_mode`.
  All modes in Community edition since 11.0.
- `citus_drain_node(nodename, nodeport, shard_transfer_mode, rebalance_strategy)` before removing a node.
- `isolate_tenant_to_new_shard(table_name, tenant_id, cascade_option)` puts one tenant in its own shard (Community since 11.0).
- Background parallelism: `citus.max_background_task_executors_per_node` default 1 (1–128). Citus 13.2: per-shard advisory locks,
  parallel colocated moves.
- `citus_create_restore_point(name)`: blocks writes briefly and creates a consistent named restore point on all nodes.

**SQL limitations** (docs.citusdata.com workarounds page)
- Correlated subqueries only when correlated on the distribution column. Recursive CTEs, GROUPING SETS, `SELECT ... FOR UPDATE`,
  TABLESAMPLE: single-shard queries only. Outer joins between distributed tables only on the distribution column.
- Direct joins distributed↔local not supported in some forms (`citus.local_table_join_policy`: `auto` default, `never`,
  `prefer-local`, `prefer-distributed`). Rules not supported; subqueries in INSERT not supported (use INSERT…SELECT);
  multi-level partitioned tables cannot be distributed; VOLATILE functions not allowed in UPDATE on distributed tables.
- **Sequences smaller than BIGINT** "may result in inserts on worker nodes failing" (MX): use `bigint`/`bigserial` or route via the
  coordinator. (Mechanism: in MX each node generates from its own range of the bigint space, UNVERIFIED detail.)
- Schema-based: no FKs across distributed schemas; cannot create a distributed schema and its tables in one statement.

### 6. YugabyteDB (distributed SQL) [P unless noted]
- Layers: **YQL** query layer (YSQL = PostgreSQL-compatible, reuses PostgreSQL's query layer code; YCQL = Cassandra-like) over
  **DocDB**, a document store built on **RocksDB**. **YB-TServer** hosts tablets and serves queries; **YB-Master** is catalog manager
  and orchestrator.
- PostgreSQL base: YSQL forked from PG **11.2**; **v2025.1.0.0 (23 Jul 2025)** is the first stable release rebased on **PG 15**;
  upgrade from v2024.2.3.0+ is online with mixed PG11/PG15 nodes. (docs search summary)
- **Tablets** = shards. Each tablet replicated with **Raft**; one **leader** per tablet handles consistent reads/writes; followers can
  be elected. Leader failover "~2s" (distributed-txns page). Replication factor default 3: UNVERIFIED.
- **Sharding**:
  - Hash: 2-byte space **0x0000–0xFFFF**; at most 64K tablets per table. `PRIMARY KEY (customer_id HASH)`,
    `PRIMARY KEY ((a, b) HASH, c DESC)`. **By default only the first PK column is hashed**, other PK columns ascending.
  - Range: `PRIMARY KEY (order_id ASC, product_id)`; good range scans, risk of hot spots; splits dynamically as data grows.
  - Pre-split: `CREATE TABLE tracking (id int PRIMARY KEY) SPLIT INTO 10 TABLETS;` (hash) and `SPLIT AT VALUES ((100), (200), (200, 5))`
    (range; 4 tablets). Default presplit = `ysql_num_shards_per_tserver × num_of_tserver`.
  - Tables without a PK get hidden `ybrowid` as PK, hash-sharded.
  - Colocation: in a colocated database all tables share one tablet by default; `COLOCATION = false` opts a large table out.
    Yugabyte blog [S]: colocate small tables to reduce network trips.
  - `yb_use_hash_splitting_by_default` (EPCM; default false) switches default to ascending/range.
- **Transactions**:
  - Every write is a transaction; single-shard (single-tablet) writes are one Raft-replicated batch (fast path, latency close to PG per
    Yugabyte blog [S]).
  - Distributed transactions write **provisional records** (intents) into **IntentsDB** on each participant tablet; they act as locks and
    are invisible to readers. Commit = flipping the record in the **transaction status tablet** (in-memory, Raft WAL-backed) to
    committed at the status tablet's current **hybrid time**; that commit hybrid timestamp becomes the MVCC timestamp; intents then
    become regular records. Coordinator heartbeats; if they stop, intents expire and the txn aborts.
  - **Hybrid logical clock** = (physical `CLOCK_REALTIME`, logical counter); physical part dominates comparison. Conflict handling
    depends on max cluster clock skew. (`max_clock_skew_usec` default 500 ms and "read restart" errors: UNVERIFIED.)
- **Isolation** (YSQL):
  | Requested | YugabyteDB level |
  |---|---|
  | READ UNCOMMITTED | Read Committed |
  | READ COMMITTED | Read Committed **only if** `yb_enable_read_committed_isolation=true`; otherwise Snapshot |
  | REPEATABLE READ | Snapshot (no phantoms in YSQL) |
  | SERIALIZABLE | Serializable (provisional records for reads too; detects read-write conflicts) |
  - Before v2025.2 (and on manual deployments) the flag is false, so the PG default READ COMMITTED behaves as Snapshot →
    applications must retry serialization failures. From **v2025.2**, RC is enabled by default for new universes via yugabyted, YBA, Aeon.
  - Wait-on-conflict (`enable_wait_queues`) true since **v2024.1** (GA); before that, fail-on-conflict with random priorities.
- **Enhanced PostgreSQL Compatibility Mode (EPCM)** v2024.1+: `yb_enable_read_committed_isolation`, `enable_wait_queues`,
  `yb_enable_cbo` (cost-based optimizer; GA 2025.1), `yb_enable_batchednl` (batched nested loop), `yb_enable_bitmapscan`,
  `pg_client_use_shared_memory`, `yb_enable_parallel_append`, `yb_parallel_range_rows` 10000. Pre-2025.2: `yugabyted start --enable_pg_parity_early_access`.
- Behaviors that differ from PG (Yugabyte blog [S], v2.17.3, 2023): multi-shard queries pay RPCs; new connections fetch catalog
  from YB-Master (slower connect; use a pooler: Hikari, PgBouncer, Odyssey, PgCat); schema changes force catalog refresh;
  no VACUUM-style bloat (HN [S], Yugabyte staff: MVCC without vacuum, "true" index-only scans).

### 7. PostgreSQL native replication (building blocks) [P: PG 18 docs via local research E/I]
- **Physical streaming**: standby replays WAL; read-only hot standby; whole server only; standby settings
  `max_connections`, `max_prepared_transactions`, `max_locks_per_transaction`, `max_wal_senders`, `max_worker_processes` must be ≥ primary.
  Serializable not available on hot standby. Query conflicts (`max_standby_streaming_delay`, `hot_standby_feedback`).
- **Synchronous replication**: `synchronous_standby_names = 'FIRST 2 (s1, s2, s3)'` (priority) or `'ANY 2 (s1, s2, s3)'` (quorum);
  `synchronous_commit` levels `off | local | remote_write | on (default) | remote_apply`; `remote_apply` gives causal consistency for
  reads on sync standbys. Commit waits ≥ one network RTT. Read-only txns, rollbacks, subtransaction commits never wait;
  `PREPARE TRANSACTION` and `COMMIT PREPARED` always wait.
- **Logical replication**: `CREATE PUBLICATION` (tables, `FOR ALL TABLES`, `FOR TABLES IN SCHEMA`, row filter `WHERE (...)`,
  column list, `publish = 'insert, update, delete, truncate'`, `publish_via_partition_root`) / `CREATE SUBSCRIPTION ... CONNECTION ... PUBLICATION ...`
  (options incl. `copy_data`, `streaming`, `two_phase`, `disable_on_error`, `origin = none|any`, `failover`, `password_required`).
  - **Replica identity** required to publish UPDATE/DELETE (default PK; `USING INDEX`; `FULL`). Without it the **publisher**
    errors on UPDATE/DELETE (tested below).
  - Not replicated: DDL/schema, **sequence state**, large objects, views/matviews/foreign tables.
  - Conflicts (PG 18 list, logged + counted in `pg_stat_subscription_stats` `confl_*`): `insert_exists`, `update_origin_differs`,
    `update_exists`, `update_missing`, `delete_origin_differs`, `delete_missing`, `multiple_unique_conflicts`. *_origin_differs
    detection needs `track_commit_timestamp = on` on the subscriber. Resolution is manual: fix data, `ALTER SUBSCRIPTION ... SKIP (lsn = ...)`,
    or `pg_replication_origin_advance()`.
  - `origin = none` (PG 16+) lets two nodes subscribe to each other without loops → native bidirectional replication **without
    conflict resolution** (DIY multi-master; only safe if write sets are disjoint).
  - Logical slot failover (PG 17+): subscription `failover = true`, standby `sync_replication_slots`, primary `synchronized_standby_slots`.
- **Two-phase commit (2PC)**: `PREPARE TRANSACTION 'gid'` (GID ≤ 200 bytes) → `COMMIT PREPARED 'gid'` / `ROLLBACK PREPARED 'gid'`;
  `max_prepared_transactions` default **0** = disabled; if used, set ≥ `max_connections`. Prepared txns survive restart (`pg_twophase`),
  hold locks and hold back xmin (VACUUM/wraparound risk); view `pg_prepared_xacts`. `COMMIT PREPARED` cannot run in a transaction
  block; cannot PREPARE a txn that touched temp tables or exported a snapshot. PG docs: intended for external transaction managers (X/Open XA).
- **postgres_fdw transaction semantics**: remote txn opened on first use; remote isolation = SERIALIZABLE if local is SERIALIZABLE,
  else **REPEATABLE READ**; commit/abort follows the local txn; **"Two-phase commit of the remote transaction is not supported"**
  (no atomic commit across servers). Options `parallel_commit`, `parallel_abort` (default false), `async_capable` (default false),
  `fetch_size` 100, `batch_size` 1, `use_remote_estimate` false, `fdw_startup_cost` 100, `fdw_tuple_cost` 0.2, `keep_connections` on.

### 8. Multi-master / active-active: PGD and pgEdge Spock
**Common model**: every node writable; changes committed locally then replicated asynchronously over logical replication in a mesh;
conflicts are detected on apply and resolved by rule (default: newest commit timestamp wins). Crunchy [S] counter example: two nodes
both read counter=4 and write 5; after replication both agree on 5 although two increments happened (lost update).
Crunchy guideline: "Consider only for very simple workloads (e.g. queues) and only if you really need the benefits."

**EDB Postgres Distributed (PGD)** [P] — docs version 6.5.0
- Built on BDR (Bi-Directional Replication) and logical replication; runs on PostgreSQL, EDB Postgres Extended, EDB Postgres Advanced Server.
- EDB [S]: node groups, mesh topology, write leader (most writes routed to one node per group through a consensus-chosen endpoint
  to avoid conflicts), logical standbys (physical standbys not supported), DDL replicated by default, rolling major upgrades.
- **Commit scopes** (per-transaction durability): grammar `commit_scope_group [ confirmation_level ] commit_scope_kind`; groups
  `ANY n (...)`, `ALL (...)`, `MAJORITY (...)` (+ `NOT` forms, `ORIGIN GROUP`); confirmation levels `received`, `replicated`, `durable`,
  `visible` (default); kinds `SYNCHRONOUS COMMIT`, `QUORUM COMMIT` (all participants commit or roll back together, preventing conflicts),
  `CAMO` (commit at most once; app checks before retry), `LAG CONTROL`; `GROUP COMMIT` is legacy → use `QUORUM COMMIT`.
  Example: `MAJORITY ORIGIN GROUP QUORUM COMMIT ABORT ON (timeout = 6s)`; `MAJORITY (Region_A) SYNCHRONOUS COMMIT AND ANY 1 (Region_A) LAG CONTROL (MAX_LAG_SIZE = '50MB')`.
- **Conflicts and default resolvers**: `insert_exists` update_if_newer; `update_differing` update_if_newer; `update_origin_change`
  update_if_newer; `update_missing` insert_or_skip; `update_recently_deleted` skip; `update_pkey_exists` update_if_newer;
  `multiple_unique_conflicts` update_if_newer; `delete_recently_updated` skip; `delete_missing` skip; `target_column_missing`
  ignore_if_null; `source_column_missing` use_default_value; `target_table_missing` skip_if_recently_dropped; `apply_error_ddl` error.
  Resolvers: error, skip, skip_if_recently_dropped, skip_transaction, update_if_newer, update, insert_or_skip, insert_or_error, ignore,
  ignore_if_null, use_default_value. **Since 6.0 conflicts are not logged to `bdr.conflict_history` by default**; enable with
  `bdr.alter_node_set_log_config(...)`.
- **Global sequences** (`bdr.default_sequence_kind`): `distributed` (default: snowflakeid for int8, galloc for int4/int2), `snowflakeid`
  (time + node id + counter; 4096 values/ms/node; epoch 2016-10-07; wraps negative 2086), `galloc` (chunks: smallint 1,000; integer
  1,000,000; bigint 1,000,000,000; next chunk needs **majority consensus** → can stall without quorum), `timeshard` (legacy), `local`.
  Convert: `SELECT bdr.alter_sequence_set_kind('public.int8_seq'::regclass, 'galloc', 1);`
- Licence: proprietary EDB product (UNVERIFIED wording; not stated on pages read).

**pgEdge Spock** [P] — Spock v5.0.14, PostgreSQL 15, 16, 17, 18, 19; derived from pgLogical.
- Required `postgresql.conf` (each node): `wal_level = 'logical'`, `track_commit_timestamp = on`, `shared_preload_libraries = 'spock'`,
  `max_replication_slots`, `max_wal_senders`, `max_worker_processes` (docs example 10 each).
- `spock.conflict_resolution`: `error` | `apply_remote` | `keep_local` | `last_update_wins` (needs track_commit_timestamp).
  INSERT-RowExists: by default turned into UPDATE of all columns and recorded in `spock.resolutions`; DELETE-RowMissing recorded, not an exception.
- `spock.save_resolutions` (false; postmaster), `spock.exception_behaviour` (`transdiscard` default | `discard` | `sub_disable`),
  `spock.exception_logging` (`all` default | `discard` | `none`; to `spock.exception_log`), `spock.conflict_log_level` (LOG),
  `spock.check_all_uc_indexes` (off; experimental), `spock.batch_inserts` (on), `spock.deny_all_ddl` (false),
  `spock.enable_ddl_replication`, `spock.include_ddl_repset`, `spock.allow_ddl_from_functions`.
- **Delta-apply columns** (conflict avoidance for counters/balances): column options `log_old_value=true, delta_apply_function=spock.delta_apply`;
  the replicated value is the delta, so concurrent increments both apply. Column must be NOT NULL.
- Limitations: superuser needed; UNLOGGED/TEMP not replicated; UPDATE/DELETE need PK or valid replica identity (REPLICA IDENTITY FULL alone
  insufficient); conflict resolution checks **one unique index at a time**; **FKs are not enforced during replication**; DDL needs writes
  stopped on all nodes; `CREATE DATABASE` not replicated; legacy sequences replicated periodically → use **Snowflake sequences**;
  large objects need LOLOR; same encoding on all nodes; don't mix Spock with native logical subscriptions in the same DB (16-bit node id
  overlaps replication origin ids); new partitions need `spock.repset_add_partition()`.
- pgEdge marketing [S]: PostgreSQL licence, "Fully Postgres – Not 'Postgres Compatible'", selective replication by table/partition/value
  range for data residency, zero-downtime major upgrades.

### 9. FDW-based sharding (native, DIY)
- Since PG 11, a foreign table can be a **partition** of a partitioned table; partition pruning then routes queries to the
  owning server; inserts route to foreign partitions if the FDW supports it (postgres_fdw does). [P, partitioning docs; insert routing
  version UNVERIFIED here]
- What you get: one logical table, plan-time pruning, `Foreign Scan` with remote SQL (`EXPLAIN VERBOSE`), pushdown of immutable built-in
  quals, joins pushed only within the same foreign server.
- What you don't get: atomic commit across servers (no 2PC), global unique indexes (PG refuses unique index on a partitioned table with
  foreign partitions; tested), cross-server FKs, automatic DDL, rebalancing, consistent snapshot across servers (each remote txn is its
  own REPEATABLE READ snapshot taken at first use).
- The dev.to article [S] shows the pre-PG10 way: table **inheritance** + `CHECK (location='paris')` + a BEFORE INSERT routing trigger
  + `postgres_fdw` foreign child tables + constraint exclusion. Declarative partitioning replaces all of that.

### 10. HA tooling (Patroni, etcd, HAProxy, PgBouncer)
- **Patroni** [P]: "a template for high availability (HA) PostgreSQL solutions using Python"; supports PostgreSQL 9.3 to 18.
  - DCS: `etcd` (v2 protocol), `etcd3` (v3; keys not shared with v2), `consul`, `zookeeper`, `exhibitor`, `kubernetes`, `raft` (deprecated).
  - Leader lock in the DCS with TTL; only the lock holder runs as primary (fencing against split-brain).
  - Dynamic config defaults: `ttl` **30** (min 20), `loop_wait` **10** (min 1), `retry_timeout` **10** (min 3); rule
    **`loop_wait + 2 * retry_timeout <= ttl`**; `maximum_lag_on_syncnode` -1; `synchronous_mode` off/on/quorum;
    `synchronous_node_count` 1; `failsafe_mode` false; `postgresql.use_pg_rewind` false; `postgresql.use_slots` true (PG ≥ 9.4);
    `primary_start_timeout` 300 s; `member_slots_ttl` 30 min. `bootstrap.dcs` only applies at first initialization; later use
    `patronictl edit-config` or the REST API.
  - REST API health endpoints for load balancers (HAProxy `option httpchk`): `GET /` `/primary` `/read-write` (200 only on the leader-lock
    primary), `/leader`, `/standby-leader`, `/replica` (running replica without `noloadbalance` tag; `?lag=16MB`, `?tag=value`), `/read-only`,
    `/synchronous` `/sync`, `/quorum`, `/asynchronous` `/async`, `/health`, `/liveness` (503 if last loop older than ttl / 2*ttl), `/readiness`
    (`?lag=` default maximum_lag_on_failover, `?mode=apply|write`). Kubernetes probe example uses port **8008**.
- **etcd/Consul/ZooKeeper**: consensus stores (Raft/ZAB) holding the leader key; their quorum (e.g. 3 or 5 members) decides who may be primary.
- **HAProxy**: TCP proxy that health-checks Patroni's REST endpoints to send writes to `/primary` and reads to `/replica`.
- **PgBouncer / pgcat / Odyssey**: connection poolers; important because each PG connection is a process and distributed systems add per-connection
  cost (Yugabyte catalog fetch; Citus per-shard connections). Instaclustr [S] lists PgBouncer/HAProxy as routing to the active primary
  (PgBouncer itself does not detect failover; UNVERIFIED nuance).
- **CloudNativePG**: Kubernetes operator for PG HA (Instaclustr [S]).

### 11. Clocks and distributed transaction protocols
- **2PC** (generic): coordinator asks every participant to PREPARE (durably promise to commit), then COMMIT PREPARED all. Blocking
  protocol: if the coordinator dies after prepare, participants hold locks until it (or a recovery process) decides. PostgreSQL provides the
  participant side; Citus is a coordinator using it; postgres_fdw does not use it.
- **Commit via a status record** (YugabyteDB): writes go as intents; one atomic flip in a status tablet commits; avoids a separate prepare
  round per participant at commit time, but still needs Raft rounds.
- **Timestamps/clocks**: PG uses transaction IDs and snapshots (xmin/xmax/xip lists), not wall clocks, for visibility; `now()` is the
  transaction start time, `clock_timestamp()` advances. Multi-master conflict resolution uses **commit timestamps**
  (`track_commit_timestamp`, `pg_xact_commit_timestamp(xid)`), so clock skew between nodes decides "last" in last-update-wins.
- Spanner uses TrueTime (bounded uncertainty, commit-wait); CockroachDB/YugabyteDB use HLC "without the requirement of synchronized clocks, at
  the cost of significantly higher latency" (Crunchy [S]). TrueTime details UNVERIFIED here.

### 12. What behaves differently from single-node PostgreSQL (checklist)
| Area | Single-node PG | Citus | YugabyteDB | Async multi-master (PGD/Spock) | Physical replicas | FDW sharding |
|---|---|---|---|---|---|---|
| Sequences | one sequence, gaps possible, cache per backend | must be bigint for MX inserts on workers | per-node caches → big gaps / non-monotonic (UNVERIFIED default cache) | must use global sequences (PGD distributed/snowflakeid/galloc; pgEdge Snowflake) or offset/increment | read-only on standby; sequence state not in logical replication | each server has its own; need interleaving or UUID |
| UNIQUE / PK | enforced globally | only if includes distribution column (reference tables: any) | global (index is distributed) | enforced per node; cross-node duplicates become conflicts (insert_exists) | enforced on primary | per server only |
| Foreign keys | enforced | colocated + include dist column, or → reference | enforced globally (extra RPCs) | Spock: not enforced during apply | n/a | not across servers |
| Isolation default | READ COMMITTED | per shard; cross-shard not a single snapshot | Snapshot unless RC flag (v2025.2+ new universes: RC) | each node local; no global isolation | replicas stale | remote REPEATABLE READ |
| DDL | transactional, instant | propagated (some from any node), distribution column type immutable | catalog refresh; some ALTERs limited (UNVERIFIED) | replicated by default (PGD) / needs write freeze (Spock) | replicated via WAL | manual per server |
| Latency | µs–ms | +1 hop per shard; multi-shard fan-out | Raft round trip per write; RPCs per multi-shard read | local writes fast | sync commit adds RTT | per foreign scan round trips; fetch_size 100 |
| Atomic multi-node commit | n/a | 2PC | status tablet | none (async) | n/a | **none** |
| Lost updates | prevented by row locks | prevented within shard | prevented | possible (counter example) | n/a | possible across servers |

---

## Complete inventories

### A. Citus UDFs (Citus 14 docs) [P]
| Function | Arguments (defaults) | Meaning |
|---|---|---|
| `create_distributed_table` | `table_name, distribution_column, colocate_with => 'default'|'none'|'<table>', shard_count` (1–64000; with shard_count, colocate_with must be none) | hash-distribute; creates `citus.shard_count` shards; copies existing rows (leaves local copy) |
| `truncate_local_data_after_distributing_table` | `table_name` | remove leftover coordinator rows |
| `undistribute_table` | `table_name, cascade_via_foreign_keys` | back to a local table |
| `alter_distributed_table` | `table_name, distribution_column, shard_count, colocate_with, cascade_to_colocated` | change dist column / shard count / colocation |
| `create_reference_table` | `table_name` | one shard replicated to all workers; 2PC on writes |
| `citus_add_local_table_to_metadata` | `table_name, cascade_via_foreign_keys` | local table usable from any node |
| `remove_local_tables_from_metadata` | — | cleanup |
| `update_distributed_table_colocation` | `table_name, colocate_with` | break/change colocation |
| `create_distributed_function` | (function, distribution arg, colocate_with) | delegate procedure calls to the worker holding the shard |
| `citus_schema_distribute` / `citus_schema_undistribute` / `citus_schema_move` | `schema` (+ target node, shard_transfer_mode) | schema-based sharding |
| `alter_table_set_access_method`, `alter_columnar_table_set` | columnar: chunk_row_count 10000, stripe_row_count 150000, compression zstd suggested | columnar storage |
| `create_time_partitions`, `drop_old_time_partitions`, `alter_old_partitions_set_access_method` | start_from default now() | time partition helpers |
| `citus_add_node` | `nodename, nodeport, groupid -1, noderole 'primary', nodecluster 'default'` | register worker |
| `citus_update_node`, `citus_set_node_property`, `citus_add_inactive_node`, `citus_activate_node`, `citus_disable_node`, `citus_add_secondary_node`, `citus_remove_node`, `citus_get_active_worker_nodes`, `citus_check_cluster_node_health`, `citus_set_coordinator_host(host, port, node_role 'primary', node_cluster 'default')` | | node management |
| `citus_backend_gpid` | | global process id |
| `get_shard_id_for_distribution_column` | `table_name, distribution_value` | which shard holds a value |
| `column_to_column_name`, `master_get_table_metadata` | | metadata helpers |
| `citus_relation_size`, `citus_table_size`, `citus_total_relation_size` | | sizes across shards |
| `citus_stat_statements_reset`, `citus_stat_counters`, `citus_stat_counters_reset` | | stats |
| `citus_move_shard_placement` | `shard_id, source_node_name, source_node_port, target_node_name, target_node_port, shard_transfer_mode 'auto'` | move shard + colocated shards |
| `citus_rebalance_start` | `threshold, drain_only, rebalance_strategy, parallel_transfer_colocated_shards false, parallel_transfer_reference_tables false` | background rebalance job |
| `citus_rebalance_status`, `citus_rebalance_stop`, `citus_rebalance_wait`, `rebalance_table_shards`, `get_rebalance_table_shards_plan`, `get_rebalance_progress` | | rebalancer control |
| `citus_add_rebalance_strategy`, `citus_set_default_rebalance_strategy('by_disk_size')` | default_threshold, minimum_threshold 0 | strategies |
| `citus_remote_connection_stats` | | connections per node |
| `citus_drain_node` | `nodename, nodeport, shard_transfer_mode, rebalance_strategy` | empty a node |
| `citus_add_clone_node`, `citus_remove_clone_node`, `get_snapshot_based_node_split_plan`, `citus_promote_clone_and_rebalance` | | clone-based scale-out (new in 13.x/14; details not read) |
| `isolate_tenant_to_new_shard` | `table_name, tenant_id, cascade_option` → shard_id | tenant isolation |
| `citus_create_restore_point` | `name` | cluster-consistent restore point |

### B. Citus GUCs (defaults) [P]
| GUC | Default | Meaning |
|---|---|---|
| `citus.shard_count` | 32 | shards for new hash tables |
| `citus.multi_shard_commit_protocol` | 2pc | COPY commit protocol (`1pc` alternative) |
| `citus.distributed_deadlock_detection_factor` | 2 | × deadlock_timeout; -1 off |
| `citus.log_distributed_deadlock_detection` | false | |
| `citus.node_connection_timeout` | 30 s | 10 ms–1 h |
| `citus.node_conninfo` | (sslmode require since 8.1) | libpq params for inter-node connections |
| `citus.local_hostname` | localhost | self-connections |
| `citus.max_worker_nodes_tracked` | 2048 | |
| `citus.use_secondary_nodes` | never | `always` reads from secondaries |
| `citus.enable_version_checks` | true | |
| `citus.show_shards_for_app_name_prefixes` | '' | |
| `citus.max_background_task_executors_per_node` | 1 | 1–128 |
| `citus.rebalancer_by_disk_size_base_cost` | 100MB | |
| `citus.shard_transfer_mode` | auto | auto / force_logical / block_writes |
| `citus.stat_statements_purge_interval` | 10 s | |
| `citus.stat_statements_max` | 50000 | 1000–10M, 140 B/row |
| `citus.stat_statements_track` | none | all / none |
| `citus.stat_tenants_untracked_sample_rate` | 1.0 | |
| `citus.enable_stat_counters` | false | |
| `citus.replicate_reference_tables_on_activate` | on | |
| `citus.metadata_sync_mode` | transactional | / nontransactional |
| `citus.enable_local_fast_path_query_optimization` | true | 13.2 delayed fast path |
| `citus.enable_recurring_outer_join_pushdown` | true | 13.2 |
| `citus.local_table_join_policy` | auto | never / prefer-local / prefer-distributed |
| `citus.limit_clause_row_fetch_count` | -1 | |
| `citus.count_distinct_error_rate` | 0.0 | hll approximation (0.005 suggested) |
| `citus.task_assignment_policy` | greedy | round-robin / first-replica (reference tables) |
| `citus.enable_non_colocated_router_query_pushdown` | off | |
| `citus.binary_worker_copy_format` | true on PG 14+ | |
| `citus.max_intermediate_result_size` | 1 GB | -1 unlimited |
| `citus.enable_ddl_propagation` | true | |
| `citus.enable_local_reference_table_foreign_keys` | on | |
| `citus.enable_change_data_capture` | off | rewrites shard names in pgoutput/wal2json |
| `citus.enable_schema_based_sharding` | off (implied) | |
| `citus.create_object_propagation` | (immediate; `deferred` = pre-11 behaviour) | default value name UNVERIFIED |
| `citus.all_modifications_commutative` | false (implied) | |
| `citus.multi_task_query_log_level` | off | debug/log/notice/warning/error |
| `citus.propagate_set_commands` | none | local |
| `citus.enable_repartition_joins` | false | |
| `citus.enable_repartitioned_insert_select` | true (implied) | |
| `citus.enable_binary_protocol` | true | |
| `citus.max_shared_pool_size` | = max_connections | -1 off |
| `citus.local_shared_pool_size` | max_connections/2 | |
| `citus.max_adaptive_executor_pool_size` | 16 | |
| `citus.executor_slow_start_interval` | 10 ms | |
| `citus.max_cached_conns_per_worker` | 1 | |
| `citus.force_max_query_parallelization` | false | |
| `citus.explain_all_tasks` | false (implied) | |
| `citus.explain_analyze_sort_method` | execution-time | / taskId |
| `citus.multi_shard_modify_mode` | (parallel) | `sequential` disables per-node parallelism; default name UNVERIFIED |

### C. Citus catalog objects [P]
`pg_dist_node`, `pg_dist_shard` (shardid, shardminvalue, shardmaxvalue), `pg_dist_placement`, `pg_dist_partition`,
`pg_dist_colocation`, `pg_dist_rebalance_strategy`; views `citus_tables`, `citus_shards`, `citus_stat_statements`,
`citus_stat_tenants`, `citus_stat_counters`, `citus_dist_stat_activity`/`citus_lock_waits` (names UNVERIFIED in pages read).

### D. YugabyteDB names [P]
- Processes: YB-TServer, YB-Master. Storage: DocDB (RocksDB), RegularDB, IntentsDB, transaction status tablet.
- DDL: `HASH`, `ASC`/`DESC` in PK, `SPLIT INTO n TABLETS`, `SPLIT AT VALUES (...)`, `COLOCATION = true|false`, `TABLESPACE` placement, `ybrowid`.
- Flags: `yb_enable_read_committed_isolation`, `enable_wait_queues`, `yb_enable_cbo`, `yb_enable_batchednl`, `yb_use_hash_splitting_by_default`,
  `yb_enable_bitmapscan`, `pg_client_use_shared_memory`, `yb_enable_parallel_append`, `yb_parallel_range_rows`, `ysql_num_shards_per_tserver`,
  `ysql_pg_conf_csv`, `ysql_enable_read_request_caching`, `ysql_catalog_preload_additional_tables` (last two from 2023 blog, "not yet recommended for production").
- Tools: yugabyted, YugabyteDB Anywhere (YBA), YugabyteDB Aeon, yb_stats, ysqlsh.

### E. PGD names [P]
`bdr.default_sequence_kind` (distributed | snowflakeid | galloc | timeshard | local), `bdr.alter_sequence_set_kind(regclass, kind, start)`,
`bdr.galloc_chunk_info()`, `bdr.sequence_alloc`, `bdr.conflict_history`, `bdr.alter_node_set_log_config(...)`; commit scope grammar above;
conflict types/resolvers above. (`bdr.create_commit_scope`, `bdr.commit_scope` GUC: names UNVERIFIED in pages read.)

### F. Spock names [P]
GUCs listed in concept 8; tables `spock.resolutions`, `spock.exception_log`; functions named in docs: `spock.repset_add_partition()`,
`spock.repset_remove_partition()`, `spock.sub_alter_skiplsn()`, `spock.replicate_ddl`, `sync_sequence`, `spock.delta_apply`.
(`spock.node_create`, `spock.sub_create`, `spock.repset_create`, `spock.repset_add_table` exist per docs nav "Using Spock Functions"; signatures UNVERIFIED.)

### G. PostgreSQL 18 building blocks [P]
- SQL: `PREPARE TRANSACTION`, `COMMIT PREPARED`, `ROLLBACK PREPARED`; `CREATE/ALTER/DROP PUBLICATION`; `CREATE/ALTER/DROP SUBSCRIPTION`
  (`ENABLE`, `DISABLE`, `REFRESH PUBLICATION`, `SKIP (lsn = ...)`); `CREATE FOREIGN DATA WRAPPER`, `CREATE SERVER`, `CREATE USER MAPPING`,
  `CREATE FOREIGN TABLE [PARTITION OF]`, `IMPORT FOREIGN SCHEMA`; `PARTITION BY HASH/LIST/RANGE`, `FOR VALUES WITH (MODULUS m, REMAINDER r)`,
  `ATTACH/DETACH PARTITION [CONCURRENTLY]`; `ALTER TABLE ... REPLICA IDENTITY {DEFAULT|USING INDEX|FULL|NOTHING}`.
- GUCs: `wal_level` (replica default; logical for decoding), `max_wal_senders` 10, `max_replication_slots` 10, `max_prepared_transactions` 0,
  `track_commit_timestamp` off, `synchronous_commit` on, `synchronous_standby_names` '', `hot_standby` on, `hot_standby_feedback`,
  `max_standby_streaming_delay`, `max_slot_wal_keep_size`, `idle_replication_slot_timeout` 0 (PG 18), `sync_replication_slots` off,
  `synchronized_standby_slots`, `max_logical_replication_workers` 4, `enable_partitionwise_join` off, `enable_partitionwise_aggregate` off,
  `enable_partition_pruning` on. (Values as observed in PGlite = PG defaults except `max_worker_processes` = 0 in PGlite.)
- Functions: `pg_create_physical_replication_slot(name, immediately_reserve)`, `pg_create_logical_replication_slot(name, plugin)`,
  `pg_drop_replication_slot`, `pg_logical_slot_get_changes/peek_changes/peek_binary_changes`, `pg_replication_origin_advance`,
  `pg_current_wal_lsn()`, `pg_walfile_name()`, `pg_lsn` arithmetic, `pg_promote()`, `pg_is_in_recovery()`,
  `pg_xact_commit_timestamp(xid)`, `pg_last_committed_xact()`, `pg_current_xact_id()`, `pg_current_snapshot()`, `pg_xact_status(xid8)`,
  `satisfies_hash_partition(regclass, modulus, remainder, value...)`, `hashint4`, `hashint8`, `hashtext`, `hashint4extended(v, seed)`.
- Views/catalogs: `pg_stat_replication`, `pg_stat_wal_receiver`, `pg_replication_slots` (`failover`, `synced`, `invalidation_reason`,
  `wal_status`, `safe_wal_size`), `pg_publication`, `pg_publication_rel` (`prqual`, `prattrs`), `pg_publication_tables` (`attnames`, `rowfilter`),
  `pg_subscription`, `pg_subscription_rel`, `pg_stat_subscription`, `pg_stat_subscription_stats` (`confl_*`), `pg_replication_origin(_status)`,
  `pg_prepared_xacts`, `pg_foreign_data_wrapper`, `pg_foreign_server`, `pg_user_mappings`, `pg_foreign_table`, `pg_partitioned_table`,
  `pg_class.relpartbound`, `pg_stat_database_conflicts`.
- contrib: `postgres_fdw` (options listed in concept 7), `dblink`, `file_fdw`, `pg_walinspect`, `test_decoding`.

### H. Patroni [P]
Settings and endpoints in concept 10; CLI `patronictl` (list, switchover, failover, edit-config — subcommand list partially UNVERIFIED).

---

## Beginner → advanced path

Each step lists the idea, then a worked example. "PGlite:" marks examples runnable in the playground (tested unless marked).

1. **Why distribute at all? The single node is fast.** Latency math: 20 ms/txn → 50 txn/s per session; local disk µs vs network ms.
   Worked example: a slider "round trips per transaction × RTT" showing max txn/s per session and with `max_connections = 100`.
   (Pure JS; no SQL.)

2. **Replication vs distribution vs decentralization.** Three icons; map every product onto them (table in concept 3).
   Worked example: classify "Aurora", "read replicas", "Citus", "PGD", "YugabyteDB" interactively.

3. **WAL is the replication stream.** A physical standby replays exactly what the primary wrote.
   PGlite: create a table, insert, then `pg_get_wal_records_info(...)` shows `Heap INSERT`, `Btree INSERT_LEAF`, `Transaction COMMIT` (snippet S7).

4. **Synchronous vs asynchronous commit; CAP and PACELC.** `synchronous_commit` levels, `FIRST n` vs `ANY n`.
   PGlite: `SET synchronous_commit = remote_apply; SHOW synchronous_commit;` returns `remote_apply` (tested; no standby and empty
   `synchronous_standby_names`, so nothing waits). Pair with an animation of commit acknowledgements.

5. **Replicas and their anomalies.** Read-your-writes and monotonic reads violated by lag. Worked example: two-PGlite simulation
   (primary + "replica" fed after a delay) shows the empty shopping cart (Crunchy's example).

6. **HA: failover, fencing, consensus.** Patroni leader key with TTL; `loop_wait + 2*retry_timeout <= ttl` (10 + 2×10 = 30);
   split-brain and STONITH; HAProxy checks `/primary` and `/replica`. Worked example: state machine animation; no SQL.
   PGlite: physical replication slots are creatable (`pg_create_physical_replication_slot('standby1', true)`, snippet S6).

7. **Logical replication: publications, replica identity, what is not replicated.**
   PGlite: create publications with row filters/column lists; see the replica-identity errors on UPDATE/DELETE (snippet S5).
   CREATE SUBSCRIPTION cannot run in PGlite (libpqwalreceiver missing) — show it as a diagram.

8. **Partitioning as "sharding on one machine".** Hash partitions = shards; pruning = router queries; partitionwise join = colocated join;
   unique must include the partition key = Citus's rule.
   PGlite: snippets S1–S3.

9. **Sharding across machines: Citus model.** Distribution column, shard ids, placements, reference tables, colocation, router vs multi-shard,
   adaptive executor EXPLAIN. PGlite cannot run Citus; simulate `pg_dist_shard` as a table of int32 ranges and route with `hashint4`
   (snippet S4), and show the verbatim Citus EXPLAIN as static text.

10. **FDW-based sharding.** Foreign tables as partitions; what you lose (2PC, global unique).
    PGlite: catalog objects with a handler-less wrapper + `file_fdw` as a real foreign partition with `Foreign Scan` and pruning (snippet S8).

11. **Distributed transactions: 2PC.** PREPARE / COMMIT PREPARED, locks held by a prepared txn with no backend (`pid` NULL in `pg_locks`),
    blocking-coordinator failure.
    PGlite: disabled by default (`max_prepared_transactions = 0`, error 55000); enable with `PGlite.create({ postgresqlconf: ['max_prepared_transactions = 10'] })`
    and run snippet S9. A JS "coordinator" over two PGlite instances can run the full protocol.

12. **Multi-master and conflicts.** Lost-update counter; last-update-wins via commit timestamps; PG 18's seven conflict types; PGD resolvers;
    Spock delta-apply; global sequences.
    PGlite: two instances with `track_commit_timestamp = on`, compare `pg_xact_commit_timestamp(xmin)` (snippet S10); sequence strategies (snippet S11).

13. **Distributed SQL (YugabyteDB).** Tablets, Raft per tablet, hash vs range PK, intents + status tablet, HLC, isolation mapping, retries.
    Worked example: animation of a cross-tablet transaction: intents written → status tablet flips → intents become regular records.

14. **Choosing an architecture.** Crunchy's guidelines: replicas at >100k reads/s; sharding for multi-tenant or >100GB working set or
    compute-heavy queries; active-active only for very simple workloads; "Just use PostgreSQL" for most. Decision-tree exercise.

---

## Production patterns

- **Default first**: one big PostgreSQL + one or two physical standbys + Patroni (or managed HA) covers most OLTP. Crunchy [S]:
  network-attached storage's durability usually outweighs its performance cost. HN [S]: managed 4 TB RAM instances exist (opinion).
- **Read replicas**: use when >100k reads/s or read CPU bottleneck (Crunchy [S]). Route only staleness-tolerant reads; for causal reads use
  `synchronous_commit = remote_apply` with a sync standby [P], or route a user's reads to the primary for a short window after a write.
- **Zero data loss**: synchronous replication to **≥2** standbys with quorum (`ANY 1 (s1, s2)` or `FIRST 1 (s1, s2)`), because with a single sync
  standby a standby outage blocks commits (HN [S]; PG docs describe waiting until a standby confirms [P]). Use per-transaction
  `synchronous_commit` to make only important transactions synchronous (PG docs example: 10% important vs 90% chat).
- **Patroni timing**: defaults ttl 30 / loop_wait 10 / retry_timeout 10; keep `loop_wait + 2*retry_timeout <= ttl`. Run the DCS with 3 or 5 members
  (odd quorum; UNVERIFIED as a Patroni doc statement). HAProxy health checks on `/primary` and `/replica?lag=...`.
- **Citus sizing**: `citus.shard_count` default 32; choose shard count up front (changing needs `alter_distributed_table`); for multi-tenant apps add
  `tenant_id` to every table and every PK/FK; colocate related tables explicitly (`colocate_with`); make small shared tables reference tables;
  load with `COPY` not row-by-row INSERT (Crunchy [S]); use `citus.multi_task_query_log_level = 'error'` in dev to find queries missing the tenant
  filter. With 2PC: set `max_prepared_transactions` on workers ≈ `max_connections`. Connection budgeting: `max_shared_pool_size` defaults to the
  coordinator's `max_connections`; raise workers' `max_connections` above the coordinator's because repartition joins ignore the pool limit.
- **Rebalancing**: preview with `get_rebalance_table_shards_plan()`, run `citus_rebalance_start()` (non-blocking with logical replication when tables have
  replica identity), raise `citus.max_background_task_executors_per_node` and `max_worker_processes` for parallel moves (13.2).
- **YugabyteDB**: keep hot transactions single-tablet (filter by full hash key); colocate small tables; use RANGE sharding for range-scan tables; pre-split
  with `SPLIT INTO`; enable Read Committed + wait queues for PG-like behavior (defaults since v2025.2 / v2024.1); always implement retry on 40001;
  use connection pooling.
- **Multi-master**: route writes for a given row/tenant to one "write leader" (PGD) to avoid conflicts; use delta-apply (Spock) or CRDT-like columns
  for counters; global sequences (snowflakeid/galloc/Snowflake) or UUIDs; enable `track_commit_timestamp`; keep clocks synced (NTP) because
  last-update-wins compares commit timestamps; freeze writes for DDL (Spock).
- **Logical replication hygiene**: every published table needs a PK or replica identity; watch `pg_replication_slots` (`wal_status`,
  `safe_wal_size`) and set `max_slot_wal_keep_size` / PG 18 `idle_replication_slot_timeout` so a dead subscriber cannot fill the disk; sync
  sequences before switching over to a subscriber.
- **FDW sharding**: set `fetch_size`/`batch_size` (defaults 100 / 1), `use_remote_estimate` or `ANALYZE` foreign tables, `async_capable` for parallel
  Append across servers (one connection per server per user mapping), `parallel_commit`; accept that commits are not atomic across servers.

---

## Pitfalls (symptom / cause / fix)

| Symptom | Cause | Fix |
|---|---|---|
| Item just added doesn't show on next page | read routed to async replica (no read-your-writes) | read from primary after writes, `remote_apply`, or session stickiness |
| Data seems to go back in time between requests | load-balanced reads across replicas with different lag (no monotonic reads) | sticky replica per session; LSN-based routing |
| Primary commits hang | only sync standby is down (`synchronous_standby_names` with 1 standby) | quorum `ANY 1 (s1, s2)`, or temporarily clear the setting |
| Two primaries after network blip | failover without fencing (split-brain) | DCS leader lock (Patroni), STONITH, `pg_rewind` old primary |
| Disk fills on primary | inactive replication slot retaining WAL | drop slot; `max_slot_wal_keep_size`; PG 18 `idle_replication_slot_timeout` |
| `ERROR: cannot update table "t" because it does not have a replica identity and publishes updates` | table in a publication without PK | add PK or `REPLICA IDENTITY USING INDEX/FULL` |
| `Column used in the publication WHERE expression is not part of the replica identity` | row filter on non-identity column with UPDATE/DELETE published | include column in replica identity or publish only inserts |
| Subscriber apply stopped, log `conflict=insert_exists` | local row with same key on subscriber | fix data or `ALTER SUBSCRIPTION ... SKIP (lsn = ...)` |
| After failover to subscriber, inserts fail with duplicate keys | sequences not replicated logically | `setval` sequences before switchover |
| Counter lost increments in active-active | concurrent updates on two nodes, last-update-wins | single write leader for that row, delta-apply columns, or avoid multi-master |
| Duplicate "unique" emails across nodes | uniqueness enforced only per node (multi-master) or per shard (Citus without dist column) | include shard key in unique; reference table; route to one node |
| Citus: `ERROR: cannot create foreign key constraint ... Referenced table must be a distributed table or a reference table.` | distributed child before parent | distribute FK target first or drop/re-add FKs |
| Citus: `cannot execute ALTER TABLE command involving partition column` | changing distribution column type | `alter_distributed_table` to change dist column, alter, change back |
| Citus: `cannot run type command because there was a parallel operation on a distributed table in the transaction` | 11.0 object propagation | create objects before parallel ops; `citus.create_object_propagation = deferred` or `multi_shard_modify_mode = sequential` |
| Citus query slow, fans out to all 32 shards | missing distribution column filter | add tenant filter; `multi_task_query_log_level` to find them |
| Citus MX insert fails on worker | sequence/serial smaller than bigint | use bigint/bigserial or insert via coordinator |
| Citus coordinator rows "invisible" after distributing | local data left on coordinator | `truncate_local_data_after_distributing_table` |
| YugabyteDB app gets 40001 serialization errors that never happened on PG | READ COMMITTED mapped to Snapshot (flag off; pre-2025.2 / manual deploy) | enable `yb_enable_read_committed_isolation`; add retries |
| YugabyteDB first query per connection slow | catalog fetched from YB-Master on connect | connection pooling |
| Partial commit across servers with postgres_fdw | no 2PC in postgres_fdw | app-level saga/outbox, or a coordinator with PREPARE TRANSACTION on each server |
| Same query sees different remote data than expected under READ COMMITTED | postgres_fdw remote txn is REPEATABLE READ | start a new local transaction per logical read |
| VACUUM can't clean; wraparound warnings | orphaned prepared transactions hold xmin | `SELECT * FROM pg_prepared_xacts` and COMMIT/ROLLBACK PREPARED |
| **PGlite playground freezes** | statement waits on a lock held by a prepared transaction; single backend; `lock_timeout` does not fire in PGlite (tested: 300ms setting ignored, hung >60 s) | in lessons use `NOWAIT` / `SKIP LOCKED` when touching rows of a prepared txn; never block |
| PGlite: `prepared transactions are disabled` (55000) | `max_prepared_transactions = 0` default | create instance with `postgresqlconf: ['max_prepared_transactions = 10']` |
| PGlite: `logical decoding requires "wal_level" >= "logical"` | PGlite default `wal_level = replica` | `postgresqlconf: ['wal_level = logical']` (slot creation then works; decoding output not reliable, see below) |

---

## Contradictions & version notes

- **Crunchy (2024) "DBMS-optimized storage ... not OSS"** vs HN/Neon: Neon is open source (HN [S]; Neon licence UNVERIFIED here). Say "Aurora/AlloyDB are
  proprietary; Neon's storage is open source".
- **Crunchy "distributed key-value store with SQL"** vs Yugabyte staff on HN: label is contested; YugabyteDB docs call DocDB "a document store ... built on
  top of RocksDB" [P]. Crunchy's "No local joins in current implementations" is contradicted by YugabyteDB colocated tables [P] (though colocation gives up
  scale-out for those tables).
- **Benchmarks**: HN commenters say the GigaOm/Microsoft benchmark compared Citus without HA to RF=3 systems. Do not cite performance comparisons from either side.
- **Yugabyte blog (Aug 2023, v2.17.3)** says default isolation is Snapshot and wait queues are a goal. Current docs [P]: wait-on-conflict default **true since
  v2024.1**; Read Committed enabled by default for **new universes from v2025.2** (via yugabyted/YBA/Aeon); manual deployments still need the flag.
- **YSQL PG base**: PG 11.2 up to v2024.2; **PG 15 from v2025.1.0.0 (2025-07-23)**. Older material saying "PostgreSQL 11 compatible" is outdated.
- **PGD**: `GROUP COMMIT` is legacy → `QUORUM COMMIT`. **PGD 6.0** stopped logging conflicts to `bdr.conflict_history` by default. Docs metadata shows
  version 6.5.0. Some older PGD/BDR docs list different default resolvers (search summary noted v6.1/v3.7 wording differences); use the 6.5 table above.
- **EDB marketing** "EDB PGD is the only solution that can facilitate online major version upgrades": vendor claim; pgEdge claims the same, and native logical
  replication can be used for low-downtime major upgrades [P: logical replication supports replicating between different major versions].
- **Spock**: `first_update_wins` is not a documented `spock.conflict_resolution` value in v5 docs (values: error, apply_remote, keep_local, last_update_wins).
- **Instaclustr tutorial errors** (verify against PG 18 docs):
  - `wal_keep_segments` was removed in PG 13 (replaced by `wal_keep_size`). (UNVERIFIED version number from memory; the replacement name is standard.)
  - `recovery.conf` / `standby_mode` were removed in PG 12 (use `standby.signal` + `primary_conninfo` in postgresql.conf). The article itself says "on PostgreSQL 11 or earlier".
  - Copying the data directory with `rsync` from a running primary is not a valid base backup; use `pg_basebackup` (or pg_backup_start/stop). [P docs require a base backup]
  - `stats_collector = on` is not a PostgreSQL setting; `stats_temp_directory` was removed in PG 15 (cumulative statistics moved to shared memory). Statistics are on by default (`track_counts`).
  - "Use a CTE to improve performance" of a simple filter+aggregate: since PG 12 non-recursive side-effect-free CTEs are inlined; no benefit.
  - Archive example `FOR VALUES FROM ('2022-01-01') TO ('2022-12-31')` excludes 2022-12-31 (upper bound exclusive) [P].
  - `quorum-based failover` tip conflates sync quorum with leader election; Patroni uses a DCS lock.
- **dev.to article**: PG 9.5-era inheritance + trigger sharding; the second EXPLAIN shows `Foreign Scan on booksample_paris` although Paris is local (copy-paste
  error); `endtut` typo in the trigger body; the routing triggers and inheritance are obsolete since declarative partitioning (PG 10) and foreign partitions (PG 11).
- **GeeksforGeeks**: "Fragmentation ... doesn't create copies of data, consistency is not a problem" ignores cross-fragment transactions and constraints;
  "reduced operating cost" is not generally true. Treat as introductory only.
- **Citus licensing/editions**: shard transfer modes and `isolate_tenant_to_new_shard` in Community edition since 11.0; `citus_stat_statements` GUCs in Community since 11.0 [P].
  Citus is AGPL-3.0 (UNVERIFIED here).
- **Citus docs moved**: current docs are on learn.microsoft.com (Citus 12–14 monikers, updated 2026); docs.citusdata.com pages are older copies.
- **Patroni** supports PostgreSQL 9.3 to 18 [P]. `etcd` (v2 API) vs `etcd3`: keys not shared; switching needs migration.
- **PostgreSQL**: logical replication conflict types/`pg_stat_subscription_stats` confl_* columns are new in PG 18 (UNVERIFIED version; research file E lists them for PG 18);
  `idle_replication_slot_timeout` is PG 18; logical slot failover (`failover`, `sync_replication_slots`) PG 17; `origin = none` PG 16 (UNVERIFIED versions from memory).

---

## Lesson & visualizer ideas, and runnable PGlite SQL

### What PGlite 0.5.16 can and cannot do (tested)
| Feature | Default PGlite | With `postgresqlconf` | Notes |
|---|---|---|---|
| Version | `PostgreSQL 18.6 (PGlite 0.5.16) on wasm32-unknown-emscripten ... 32-bit` | — | `server_version_num` 180006 |
| Declarative partitioning (hash/list/range), pruning, partitionwise join/agg, attach/detach | yes | — | best Citus analogue |
| `satisfies_hash_partition`, `hashint4`, `hashint8`, `hashtext`, `hashint4extended` | yes | — | bigint results: cast to text in JS (`Do not know how to serialize a BigInt` otherwise) |
| FDW catalog objects (FDW without handler, SERVER, USER MAPPING, FOREIGN TABLE, foreign partition) | yes | — | querying them: `foreign-data wrapper "x" has no handler` (55000) |
| `postgres_fdw`, `dblink` | **not shipped** | — | contrib list has `file_fdw` but not these |
| `file_fdw` | yes (`extensions: { file_fdw }`) | — | `COPY ... TO '/tmp/x.csv'` works inside PGlite's virtual FS |
| Unique index on partitioned table with foreign partitions | error `cannot create unique index on partitioned table ... contains partitions that are foreign tables` | — | teaches "no global unique" |
| `CREATE PUBLICATION` (all forms, row filter, column list, via root, tables in schema) | yes, with WARNING `"wal_level" is insufficient to publish logical changes` | no warning | catalogs `pg_publication`, `pg_publication_rel`, `pg_publication_tables` |
| Replica identity enforcement on UPDATE/DELETE | yes | — | works at wal_level replica |
| `CREATE SUBSCRIPTION` (even `connect = false`) | **fails**: `could not load library ".../libpqwalreceiver.so"` (58P01) | same | |
| Physical replication slots | yes (`pg_create_physical_replication_slot`) | — | `wal_status` `reserved` when immediately reserved |
| Logical slots | `logical decoding requires "wal_level" >= "logical"` | `pgoutput` slot creatable; `test_decoding` not shipped (`could not access file "test_decoding"`) | `pg_logical_slot_peek_binary_changes` returned **0 rows** and printed internal notices `resource was not closed: snapshot reference ...`, `snapshot ... still active`; once led to `ERRORDATA_STACK_SIZE exceeded`. **Do not use logical decoding in lessons.** |
| `pg_stat_replication`, `pg_stat_subscription_stats` | exist, empty | — | |
| 2PC | `prepared transactions are disabled` / HINT `Set "max_prepared_transactions" to a nonzero value.` (55000) | **works** with `max_prepared_transactions = 10` | prepared rows invisible until COMMIT PREPARED; lock shows `pid` NULL |
| `track_commit_timestamp` | off → `could not get commit timestamp data` (55000) | **works** with `track_commit_timestamp = on` | `pg_xact_commit_timestamp(xmin)`, `pg_last_committed_xact()` |
| `pg_walinspect` | yes (`extensions: { pg_walinspect }`) | — | shows WAL a standby would replay |
| `lock_timeout` | set but **does not fire** (hang) | — | use NOWAIT |
| Multiple PGlite instances in one page/process | yes | yes | simulate nodes, coordinator, replication in JS |
| `max_worker_processes` | 0 | — | no background workers (no logical replication workers, no parallel query) |

Enabling non-default settings (tested in Node; same API in browser):
```js
const db = await PGlite.create({
  postgresqlconf: ['max_prepared_transactions = 10', 'wal_level = logical', 'track_commit_timestamp = on'],
});
```
(`startParams` with `-c` was tried and did not produce a working instance in the test; do not use.)

### Visualizer ideas
1. **Latency budget calculator**: round trips × RTT → per-session TPS, × max_connections → ceiling. Presets: same rack 0.1 ms, cross-AZ 1 ms,
   cross-region 70 ms (illustrative numbers, label as such).
2. **Architecture map**: the taxonomy table as a clickable diagram; each node shows where writes go, where data lives, and the failure animation
   (kill a node → what stops).
3. **Hash ring / token ranges**: 32 Citus shard ranges over int32 with `hashint4(tenant_id)` landing points (snippet S4); drag workers to see placements;
   "rebalance" moves colocated shard groups together.
4. **Router vs multi-shard**: run the same query with and without `tenant_id = ?` on the partitioned `events` table; highlight pruned partitions
   (snippet S2); side panel shows the equivalent Citus EXPLAIN (verbatim static text from the docs).
5. **Colocated join**: partitionwise join plan (snippet S3) next to a non-colocated join that becomes Append × Append.
6. **2PC timeline**: coordinator + two PGlite participants; buttons "prepare", "crash coordinator", "commit prepared"; show `pg_prepared_xacts` and the
   orphaned lock (snippet S9). Must use NOWAIT for any probe of locked rows.
7. **Replica lag theater**: primary PGlite + replica PGlite fed by a JS "WAL shipper" (replay INSERT statements after a delay); toggle
   `synchronous_commit` modes to show which acknowledgement the client waits for.
8. **Multi-master conflict lab**: two PGlite nodes with `track_commit_timestamp = on`; both update the same key; JS applies PG 18 conflict types
   and resolvers (last-update-wins, keep_local, apply_remote, error, delta-apply) and shows the lost-update counter (snippet S10).
9. **Sequences across nodes**: interleaved `INCREMENT 3` sequences, galloc-style chunks, snowflake bit layout decoder (snippet S11).
10. **YugabyteDB transaction animation**: intents on two tablets → status tablet flip at hybrid time → visibility; isolation mapping table toggled by
    the `yb_enable_read_committed_isolation` flag. (No SQL.)
11. **Patroni state machine**: leader key TTL countdown with `loop_wait`/`retry_timeout` sliders validating `loop_wait + 2*retry_timeout <= ttl`;
    HAProxy routing by REST endpoint status codes.
12. **FDW sharding**: list-partitioned table with a local partition and a `file_fdw` foreign partition; EXPLAIN shows `Foreign Scan` + `Foreign File`
    and pruning (snippet S8); try to create a unique index → error.

### Runnable PGlite SQL (all tested on PGlite 0.5.16 / PG 18.6 unless marked)

**S1. Hash "shards" and where rows land** (default instance)
```sql
create table events (tenant_id int not null, id bigint not null, payload text,
  primary key (tenant_id, id)) partition by hash (tenant_id);
create table events_s0 partition of events for values with (modulus 4, remainder 0);
create table events_s1 partition of events for values with (modulus 4, remainder 1);
create table events_s2 partition of events for values with (modulus 4, remainder 2);
create table events_s3 partition of events for values with (modulus 4, remainder 3);
insert into events select (g % 20) + 1, g, 'p' || g from generate_series(1, 1000) g;
select tableoid::regclass as shard, count(*), min(tenant_id), max(tenant_id)
from events group by 1 order by 1;
-- result: events_s0 250 | events_s1 350 | events_s2 150 | events_s3 250  (skew with only 20 tenants)
select t, satisfies_hash_partition('events'::regclass, 4, 0, t) r0,
          satisfies_hash_partition('events'::regclass, 4, 1, t) r1
from generate_series(1,5) t;   -- 1 -> r0, 3 and 5 -> r1
```
Teaching point: with few tenants, hash distribution is uneven (350 vs 150 rows); Citus's default 32 shards and rebalancer by disk size exist for this.

**S2. Router query vs fan-out** (after S1)
```sql
explain (costs off) select * from events where tenant_id = 7;
--  Bitmap Heap Scan on events_s3 events
--    Recheck Cond: (tenant_id = 7)
--    ->  Bitmap Index Scan on events_s3_pkey
explain (costs off) select * from events where id = 7;
--  Append -> Seq Scan on events_s0 ... events_s1 ... events_s2 ... events_s3 (Filter: (id = 7))
```

**S3. Unique must include the shard key; colocated (partitionwise) join**
```sql
create table bad (tenant_id int, email text unique) partition by hash (tenant_id);
-- ERROR: unique constraint on partitioned table must include all partitioning columns
-- DETAIL: UNIQUE constraint on table "bad" lacks column "tenant_id" which is part of the partition key.  (0A000)
create table bad2 (tenant_id int, email text, unique (tenant_id, email)) partition by hash (tenant_id);  -- ok

create table users_p (tenant_id int not null, uid int not null, name text, primary key (tenant_id, uid)) partition by hash (tenant_id);
create table users_p0 partition of users_p for values with (modulus 4, remainder 0);
create table users_p1 partition of users_p for values with (modulus 4, remainder 1);
create table users_p2 partition of users_p for values with (modulus 4, remainder 2);
create table users_p3 partition of users_p for values with (modulus 4, remainder 3);
insert into users_p select t, 1, 'u' || t from generate_series(1, 20) t;
analyze events; analyze users_p;
set enable_partitionwise_join = on; set enable_partitionwise_aggregate = on;
explain (costs off)
select u.name, count(*) from events e join users_p u on u.tenant_id = e.tenant_id group by u.name;
-- Finalize HashAggregate -> Append -> 4 x (Partial HashAggregate -> Hash Join (events_sN e, users_pN u))
explain (costs off) select count(*) from events e join users_p u on u.uid = e.id;
-- Aggregate -> Nested Loop -> Append(users_p0..3) x Memoize -> Append(index only scans on events_s0..3): not colocated
-- FK including the shard key works between identically partitioned tables (tested: violation reports
-- 'Key (tenant, parent_id)=(2, 10) is not present in table "fk_parent"').
```

**S4. Citus-style token ranges with hashint4** (illustrative; Citus range arithmetic UNVERIFIED)
```sql
select t, hashint4(t) as token,
       ((hashint4(t)::bigint + 2147483648) / 134217728) as shard_index_of_32
from generate_series(1,8) t;
-- 1 -> -1905060026 -> 1 ; 2 -> 1134484726 -> 24 ; 3 -> -28094569 -> 15 ; 4 -> -1011077333 -> 8 ; ... 8 -> -2047600124 -> 0
select hashint8(42::bigint)::text, hashtext('acme'), hashint4extended(42, 0)::text, hashint4(42);
-- 1509752520 | -1850687378 | 8010225493015854792 | 1509752520
-- simulated pg_dist_shard: 32 equal int32 slices, alternating between two workers (tested)
create table pg_dist_shard_sim as
select 102008 + i as shardid,
       (-2147483648 + i::bigint * 134217728) as shardminvalue,
       (-2147483648 + (i::bigint + 1) * 134217728 - 1) as shardmaxvalue,
       'worker' || (i % 2 + 1) as node
from generate_series(0, 31) i;
-- NOTE: writing `i * 134217728` without the ::bigint cast fails: ERROR: integer out of range (22003)
select shardid, shardminvalue::text, shardmaxvalue::text, node from pg_dist_shard_sim
where shardid in (102008, 102009, 102039) order by 1;
-- 102008 | -2147483648 | -2013265921 | worker1
-- 102009 | -2013265920 | -1879048193 | worker2
-- 102039 |  2013265920 |  2147483647 | worker2
select t, s.shardid, s.node from generate_series(1,4) t
join pg_dist_shard_sim s on hashint4(t) between s.shardminvalue and s.shardmaxvalue order by t;
-- 1 -> 102009 worker2 ; 2 -> 102032 worker1 ; 3 -> 102023 worker2 ; 4 -> 102016 worker1
```
Note: PostgreSQL hash partitioning does not use these raw tokens (it uses the extended hash with a seed and combines columns), so S1 and S4 assign
different "shards" to the same value. Say so in the lesson.

**S5. Logical replication catalogs and replica identity** (default instance)
```sql
create table nopk (a int, b text);
create publication pub_nopk for table nopk;
-- WARNING: "wal_level" is insufficient to publish logical changes
insert into nopk values (1, 'x');          -- ok
update nopk set b = 'y';
-- ERROR: cannot update table "nopk" because it does not have a replica identity and publishes updates
-- HINT: To enable updating the table, set REPLICA IDENTITY using ALTER TABLE.  (55000)
delete from nopk;   -- ERROR: cannot delete from table "nopk" because it does not have a replica identity and publishes deletes
alter table nopk replica identity full;
update nopk set b = 'y';                   -- ok

create table logs (id bigint primary key, region text not null, msg text, secret text);
create publication pub_eu for table logs (id, region, msg) where (region = 'eu')
  with (publish = 'insert, update, delete');
update logs set region = 'us';
-- ERROR: cannot update table "logs"  DETAIL: Column used in the publication WHERE expression is not part of the replica identity. (42P10)
select pubname, tablename, attnames, rowfilter from pg_publication_tables where pubname = 'pub_eu';
-- pub_eu | logs | {id,region,msg} | (region = 'eu'::text)
select prrelid::regclass, prqual is not null as has_filter, prattrs from pg_publication_rel;
create table m (tenant int, id int, primary key (tenant, id)) partition by list (tenant);
create table m1 partition of m for values in (1);
create publication pub_root for table m with (publish_via_partition_root = true);
create publication pub_schema for tables in schema public;
select pubname, puballtables, pubviaroot from pg_publication order by 1;
-- Do NOT include CREATE SUBSCRIPTION: fails with could not load library "/pglite/lib/postgresql/libpqwalreceiver.so"
```

**S6. Replication slots and WAL positions**
```sql
select pg_create_physical_replication_slot('standby1', true);   -- (standby1,0/16EF920)
select slot_name, restart_lsn is not null as reserved, wal_status, failover, synced, invalidation_reason
from pg_replication_slots;                                     -- standby1 | true | reserved | false | false | null
select pg_walfile_name(pg_current_wal_lsn()), pg_current_wal_lsn() - '0/0'::pg_lsn as bytes;
select pg_drop_replication_slot('standby1');
select pg_create_logical_replication_slot('s1', 'pgoutput');
-- ERROR: logical decoding requires "wal_level" >= "logical"  (default instance)
```

**S7. The WAL a standby would replay** (instance created with `extensions: { pg_walinspect }`)
```sql
create extension pg_walinspect;
create table walt(x int);
insert into walt values (1);
select resource_manager, record_type, count(*)
from pg_get_wal_records_info(pg_current_wal_lsn() - 3000, pg_current_wal_lsn())
group by 1, 2 order by 1, 2;
-- Btree INSERT_LEAF 19 | Heap INSERT 1 | Heap INSERT+INIT 1 | Heap2 MULTI_INSERT 3 | Transaction COMMIT 1  (counts vary)
```
(Both the bare form above and `(select pg_current_wal_lsn() - 3000)` were tested.)

**S8. FDW-based sharding** (instance with `extensions: { file_fdw }`)
```sql
create foreign data wrapper fake_pg_fdw;                 -- no handler: catalog-only "postgres_fdw" stand-in
create server worker1 foreign data wrapper fake_pg_fdw options (host '10.0.0.11', port '5432', dbname 'app');
create user mapping for current_user server worker1 options (user 'app', password 'secret');
create foreign table remote_orders (id bigint, tenant int, amt numeric)
  server worker1 options (schema_name 'public', table_name 'orders');
select * from remote_orders;   -- ERROR: foreign-data wrapper "fake_pg_fdw" has no handler (55000)
select srvname, srvoptions, fdwname from pg_foreign_server s join pg_foreign_data_wrapper w on w.oid = s.srvfdw;
select umuser::regrole, srvname, umoptions from pg_user_mappings;   -- note: password visible to the owner
select ftrelid::regclass, ftoptions from pg_foreign_table;

create table orders_g (tenant int not null, id bigint not null, amt numeric) partition by list (tenant);
create table orders_local partition of orders_g for values in (1, 2);
create foreign table orders_w1 partition of orders_g for values in (3, 4) server worker1;
insert into orders_g values (1, 1, 10);   -- ok (local)
insert into orders_g values (3, 2, 10);   -- ERROR: foreign-data wrapper "fake_pg_fdw" has no handler
create unique index on orders_g (tenant, id);
-- ERROR: cannot create unique index on partitioned table "orders_g"
-- DETAIL: Table "orders_g" contains partitions that are foreign tables. (42809)

create extension file_fdw;
copy (select 5 as tenant, g::bigint as id, (g*1.5)::numeric as amt from generate_series(1,3) g)
  to '/tmp/shard5.csv' with (format csv);
create server files foreign data wrapper file_fdw;
create foreign table orders_w2 partition of orders_g for values in (5, 6)
  server files options (filename '/tmp/shard5.csv', format 'csv');
select * from orders_g where tenant = 5;          -- 3 rows from the "remote" shard
explain (costs off) select * from orders_g where tenant in (1, 5);
-- Append -> Seq Scan on orders_local orders_g_1 (Filter ...) -> Foreign Scan on orders_w2 orders_g_2 (Foreign File: /tmp/shard5.csv)
explain (costs off) select * from orders_g where tenant = 5;
-- Foreign Scan on orders_w2 orders_g   Filter: (tenant = 5)   Foreign File: /tmp/shard5.csv
```

**S9. Two-phase commit** (instance with `postgresqlconf: ['max_prepared_transactions = 10']`)
```sql
-- default instance first:
-- begin; insert ...; prepare transaction 'g1';
-- ERROR: prepared transactions are disabled  HINT: Set "max_prepared_transactions" to a nonzero value. (55000)
create table acct(id int primary key, bal int not null check (bal >= 0));
insert into acct values (1, 100), (2, 0);
begin; update acct set bal = bal - 30 where id = 1; prepare transaction 'xfer-42-node1';
select gid, transaction::text, prepared is not null from pg_prepared_xacts;   -- xfer-42-node1 | 754 | true
select * from acct order by id;            -- still 100 / 0: prepared work is invisible
select locktype, mode, granted, pid from pg_locks where locktype = 'transactionid';
-- transactionid | ExclusiveLock | true | NULL   (held by no backend)
select * from acct where id = 1 for update nowait;
-- ERROR: could not obtain lock on row in relation "acct" (55P03)   <- use NOWAIT; a plain UPDATE of id 1 hangs PGlite
update acct set bal = bal + 1 where id = 2;  -- unrelated row: fine
select pg_xact_status(transaction::text::xid8) from pg_prepared_xacts;   -- in progress
commit prepared 'xfer-42-node1';
select * from acct order by id;            -- 70 / 1
begin; create temp table tt(x int); prepare transaction 'tmp';
-- ERROR: cannot PREPARE a transaction that has operated on temporary objects
-- COMMIT PREPARED inside BEGIN: ERROR: COMMIT PREPARED cannot run inside a transaction block
```
JS coordinator over two instances (pattern; the single-instance parts above were tested, the loop is UNTESTED as a whole):
```js
const nodes = [await PGlite.create({postgresqlconf:['max_prepared_transactions = 4']}),
               await PGlite.create({postgresqlconf:['max_prepared_transactions = 4']})];
const gid = 'tx-' + Date.now();
try {
  await nodes[0].exec(`begin; update acct set bal = bal - 30 where id = 1; prepare transaction '${gid}'`);
  await nodes[1].exec(`begin; update acct set bal = bal + 30 where id = 2; prepare transaction '${gid}'`);
  for (const n of nodes) await n.exec(`commit prepared '${gid}'`);      // phase 2
} catch (e) {
  for (const n of nodes) await n.exec(`rollback prepared '${gid}'`).catch(() => {});
}
```

**S10. Commit timestamps and last-update-wins across two nodes** (two instances with `postgresqlconf: ['track_commit_timestamp = on']`; tested in Node)
```sql
-- on each node:
create table kv(k int primary key, v text, updated_at timestamptz default clock_timestamp());
-- node A: insert into kv values (1, 'from-a');   node B: insert into kv values (1, 'from-b');
select k, v, pg_xact_commit_timestamp(xmin) as cts from kv;   -- compare cts in JS; later wins
select (pg_last_committed_xact()).timestamp is not null;     -- true
-- default instance: pg_xact_commit_timestamp(...) -> ERROR: could not get commit timestamp data
--   HINT: Make sure the configuration parameter "track_commit_timestamp" is set. (55000)
```
Caveat seen in test: both rows had identical millisecond timestamps in JS (`Date` has ms resolution); compare as text/microseconds or add a node-id tiebreaker.

**S11. Sequences across nodes**
```sql
create sequence node1_ids start 1 increment 3;
create sequence node2_ids start 2 increment 3;
create sequence node3_ids start 3 increment 3;
select nextval('node1_ids') a, nextval('node2_ids') b, nextval('node3_ids') c
union all select nextval('node1_ids'), nextval('node2_ids'), nextval('node3_ids');   -- 1,2,3 / 4,5,6

-- snowflake-style: 41 bits ms since an epoch | 10 bits node | 12 bits counter (Twitter layout; PGD/pgEdge layouts differ)
create sequence snow_ctr;
create function snowflake(node int) returns bigint language sql as $$
  select ((floor(extract(epoch from clock_timestamp()) * 1000)::bigint - 1288834974657) << 22)
       | ((node::bigint & 1023) << 12)
       | (nextval('snow_ctr') & 4095)
$$;
select snowflake(1)::text, snowflake(2)::text;   -- e.g. 2121526381002100737, 2121526381002104834
select (snowflake(7) >> 12) & 1023;              -- 7

create sequence cached_seq cache 100;
select seqcache, seqincrement, seqstart from pg_sequence where seqrelid = 'cached_seq'::regclass;   -- 100 | 1 | 1
```

**S12. Shard move and shard split analogues** (after S1)
```sql
alter table events detach partition events_s3;          -- "shard offline": count 1000 -> 750
alter table events attach partition events_s3 for values with (modulus 4, remainder 3);   -- back to 1000
-- split remainder 1 of modulus 4 into remainders 1 and 5 of modulus 8
alter table events detach partition events_s1;
create table events_s1a partition of events for values with (modulus 8, remainder 1);
create table events_s1b partition of events for values with (modulus 8, remainder 5);
insert into events select * from events_s1;
drop table events_s1;
select tableoid::regclass, count(*) from events group by 1 order by 1;   -- s1a 150, s1b 200
select relname, pg_get_expr(relpartbound, oid) from pg_class
where relispartition and relkind = 'r' and relname like 'events%' order by 1;
```
(Without `relkind = 'r'` the query also lists the `_pkey` index partitions with NULL bounds; the filtered form was tested.)

**S13. Isolation and clocks**
```sql
begin isolation level repeatable read;
select current_setting('transaction_isolation'), pg_current_snapshot();   -- repeatable read | 769:769:
commit;
begin;
select now() = statement_timestamp() as same_in_first_stmt, clock_timestamp() >= now() as clock_ahead;   -- true | true
commit;
```
PGlite has one backend, so concurrent-transaction anomalies (lost update, serialization failure) need two PGlite instances acting as nodes,
not two sessions on one database. True MVCC concurrency on one database cannot be shown in PGlite.

### Test harness
Scripts used: scratchpad `xdist/run.mjs` (runs `---`-separated SQL files with notices), `conf.mjs`/`conf2.mjs` (postgresqlconf, 2PC,
logical decoding, two nodes), `lockt.mjs` (lock_timeout hang, NOWAIT).
