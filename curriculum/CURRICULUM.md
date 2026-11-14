# Curriculum map — Postgres Internals, Visualized

The scope of every lesson. Facts follow PostgreSQL 18.

Every lesson = one file `app/src/lessons/<module>/<slug>.tsx` exporting `lesson: Lesson` (see `app/src/lesson/types.ts`)
and renders the six fixed sections: TL;DR → Visualizer → Playground → Production → Pitfalls → Key pointers.

## Module 1 — Foundations & Process Architecture  (`m1`)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | what-is-postgres | What PostgreSQL is: cluster, client/server, a query's round trip | client/server model, a cluster = one data directory + one postmaster, databases inside it, libpq connection, simple query protocol, psql basics |
| 2 | process-model | The postmaster and one process per connection | postmaster, fork per connection, backend lifecycle, `pg_stat_activity`, `max_connections`, startup/auth, shutdown modes & signals, crash restart |
| 3 | shared-memory | Shared memory: buffers, WAL buffers and the commit log | `shared_buffers` buffer pool, buffer descriptors/pins/usage count, clock-sweep eviction, `wal_buffers`, CLOG/`pg_xact` & SLRU caches, `pg_buffercache`, local memory (`work_mem`, `maintenance_work_mem`, `temp_buffers`) |
| 4 | background-processes | The background crew | background writer, checkpointer, WAL writer, autovacuum launcher/workers, stats (cumulative statistics in shared memory), archiver, logical replication launcher, I/O workers (`io_method`, PG18 AIO), `pg_stat_activity.backend_type` |
| 5 | databases-schemas-roles | Databases, schemas, search_path and roles | templates, `CREATE DATABASE`, schemas & `search_path` (pg_catalog implicit, `public` CREATE revoked since 15), roles/attributes/membership (INHERIT/SET/ADMIN), predefined roles, privileges & GRANT, pg_hba.conf first-match |
| 6 | normalization-constraints | Modelling data: normalization and constraints | 1NF→3NF/BCNF with a worked schema, keys, PRIMARY KEY/UNIQUE/FK (actions, deferrable)/CHECK/NOT NULL/EXCLUDE, generated columns (virtual default in 18), identity columns, NOT ENFORCED, temporal keys `WITHOUT OVERLAPS` |

## Module 2 — Storage & Page Layout Internals  (`m2`)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | primitive-types | Primitive types, alignment and padding | integer/numeric/float/text/varchar/char/bool/date/timestamptz/interval sizes & ranges, `typlen`/`typalign`, column-order padding (`pg_column_size`), numeric vs float, money pitfalls |
| 2 | arrays | Arrays | array storage (header, dims, null bitmap), operators `@>` `&&` `ANY`, unnest, array_agg, GIN on arrays, when to normalize instead |
| 3 | json-jsonb | JSON vs JSONB | text vs decomposed binary, key ordering/dedup, operators `-> ->> #> @> ? ?| ?&`, jsonpath (lax/strict), `jsonb_ops` vs `jsonb_path_ops` GIN, SQL/JSON functions (JSON_TABLE, JSON_EXISTS…), TOAST interaction |
| 4 | uuid-v4-v7 | UUIDv4 vs UUIDv7 | 128-bit storage, `gen_random_uuid`/`uuidv4`/`uuidv7([shift])`/`uuid_extract_timestamp`/`uuid_extract_version`, bit layout, index locality (link to m4/btree), sequences/identity comparison |
| 5 | slotted-page | The 8 KB slotted page | Page header, line pointers, free space, tuples, special space; ctid stability; pruning and compaction |
| 6 | tuple-header | The heap tuple header: xmin, xmax, ctid, infomask | HeapTupleHeaderData fields, null bitmap, `t_hoff`, infomask & infomask2 flags, hint bits, cmin/cmax, update chains, `heap_tuple_infomask_flags` |
| 7 | toast | TOAST: oversized attributes | 2 kB threshold/target, `toast_tuple_target`, strategies PLAIN/EXTERNAL/EXTENDED/MAIN, pglz vs lz4, 18-byte pointer, ~2000-byte chunks, `pg_toast` schema, 1 GB value limit, `pg_column_compression`, unchanged-TOAST UPDATE optimization |
| 8 | fsm-vm-forks | Files, forks, the free space map and visibility map | data directory layout, relfilenode, 1 GB segments, forks main/fsm/vm/init, `pg_relation_filepath`, FSM tree & categories (`pg_freespacemap`), VM all-visible/all-frozen bits (`pg_visibility`), unlogged tables |

## Module 3 — Querying & Data Manipulation  (`m3`)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | dml-lifecycle | INSERT, UPDATE, DELETE, MERGE: what really happens | row versions, RETURNING with `old`/`new` (18), ON CONFLICT (arbiters, DO UPDATE, EXCLUDED), MERGE (WHEN clauses, `merge_action()`), COPY, sequence gaps, autocommit |
| 2 | joins | Joins, visualized | inner/left/right/full/cross/semi/anti, ON vs WHERE for outer joins, USING/NATURAL pitfalls, self-joins, NULL semantics, join algorithms preview (link m4) |
| 3 | subqueries | Subqueries: scalar, IN, EXISTS, ANY/ALL | correlated vs uncorrelated, semi/anti-join transformation, `NOT IN` with NULL trap, scalar subquery errors, subquery in FROM |
| 4 | ctes | CTEs: inlined vs MATERIALIZED | WITH semantics, inlining rule (referenced once, no side effects), `MATERIALIZED`/`NOT MATERIALIZED`, data-modifying CTEs (single snapshot, RETURNING), optimization fences |
| 5 | recursive-ctes | Recursive CTEs | working table / intermediate table algorithm, UNION vs UNION ALL, SEARCH DEPTH/BREADTH FIRST, CYCLE detection, graph/tree walks, generate series of dates |
| 6 | window-functions | Window functions and frames | PARTITION BY/ORDER BY, default frame (RANGE … CURRENT ROW peers), ROWS/RANGE/GROUPS, EXCLUDE, row_number/rank/dense_rank/ntile/lag/lead/first_value/last_value/nth_value, running totals, top-N per group |
| 7 | lateral | LATERAL joins | per-row subqueries, top-N per group, set-returning functions in FROM, `LEFT JOIN LATERAL … ON true`, WITH ORDINALITY, vs window functions |
| 8 | aggregates-grouping | Aggregates, FILTER and GROUPING SETS | aggregate evaluation, FILTER, ordered-set aggregates (percentile_cont, mode), GROUP BY ROLLUP/CUBE/GROUPING SETS, `grouping()`, HAVING, DISTINCT ON, count(*) vs count(col) |

## Module 4 — Query Planner, Optimizer & Indexing Internals  (`m4`)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | query-pipeline | From SQL text to rows: parse, analyze, rewrite, plan, execute | raw parse (no catalog access), analysis/transformation, rewriter (views, rules), planner paths & join search (dynamic programming, GEQO at `geqo_threshold`), executor demand-pull node tree, prepared statements & generic vs custom plans (`plan_cache_mode`) |
| 2 | cost-model | The cost model | `seq_page_cost`, `random_page_cost`, `cpu_tuple_cost`, `cpu_index_tuple_cost`, `cpu_operator_cost`, `effective_cache_size`, seq scan cost formula worked example, startup vs total cost, `enable_*` flags (discourage, not forbid) |
| 3 | statistics | Planner statistics | ANALYZE sampling, `pg_stats` (null_frac, n_distinct sign convention, MCVs, histogram, correlation), worked selectivity formulas (ch.69), `default_statistics_target`, extended statistics (dependencies, ndistinct, mcv) |
| 4 | btree | B-Tree internals | Page header, line pointers, free space, tuples, special space; ctid stability; pruning and compaction |
| 5 | hash-index | Hash indexes | buckets, overflow & bitmap pages, metapage masks, incremental bucket split, equality only, 4-byte hash, when to use |
| 6 | gin | GIN: inverted indexes | entry tree, posting lists vs posting trees, pending list & `fastupdate`/`gin_pending_list_limit`, jsonb/array/trgm opclasses, `triConsistent`, partial match, write cost |
| 7 | gist-spgist | GiST and SP-GiST | GiST balanced tree of predicates (penalty, picksplit, union, consistent), KNN `<->`, ranges & exclusion constraints, SP-GiST space partitioning (quad-tree, k-d tree, radix tree), when each wins |
| 8 | brin | BRIN for huge append-only tables | block ranges, `pages_per_range`, minmax / minmax-multi / bloom opclasses, summarization & `autosummarize`, correlation requirement, lossy bitmap scans, IoT/log tables |
| 9 | index-design | Designing indexes: multicolumn, partial, expression, covering | column order & leftmost prefix, skip scan (18), partial indexes & predicate implication, expression indexes, `INCLUDE` & index-only scans, unique & NULLS NOT DISTINCT, CREATE INDEX CONCURRENTLY |
| 10 | explain-analyze | Reading EXPLAIN (ANALYZE, BUFFERS) | node anatomy, costs vs actual, per-loop numbers, BUFFERS shared hit/read/dirtied/written (on by default with ANALYZE in 18), Index Only Scan & Heap Fetches (VM), Rows Removed by Filter, sort/hash spills (`work_mem`, `hash_mem_multiplier`, Batches, external merge), nested loop/hash/merge joins, parallel workers, JIT, `Index Searches` |

## Module 5 — Concurrency, MVCC & Locking Internals  (`m5`)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | acid-transactions | ACID and transactions | atomicity via CLOG, BEGIN/COMMIT/ROLLBACK, savepoints & subtransactions, virtual vs real xids (`pg_current_xact_id_if_assigned`), command ids, two-phase commit, implicit transactions |
| 2 | snapshots-visibility | Snapshots and tuple visibility | snapshot `xmin:xmax:xip`, `pg_current_snapshot`, `pg_visible_in_snapshot`, visibility rules for xmin/xmax, hint bits, read committed vs repeatable read snapshot timing, `xid8` |
| 3 | hot-fillfactor | HOT updates and fillfactor | HOT conditions (no indexed column changed, room on same page), HOT chains & redirects, pruning, `fillfactor`, `n_tup_hot_upd`, index bloat from non-HOT updates |
| 4 | isolation-levels | Isolation levels: RC, RR, Serializable (SSI) | anomalies table, Read Committed re-check rule (EvalPlanQual), RR serialization failures 40001, SSI with SIRead predicate locks, rw-conflicts, retry loops, read-only deferrable |
| 5 | table-locks | Heavyweight locks and the conflict matrix | 8 table lock modes + full conflict matrix, which commands take which, lock queue & lock_timeout, `pg_locks`, `pg_blocking_pids`, ALTER TABLE lock levels, fast-path locks |
| 6 | row-locks-skip-locked | Row locks, SKIP LOCKED and advisory locks | FOR UPDATE / NO KEY UPDATE / SHARE / KEY SHARE + conflict matrix, row locks stored in tuples (xmax, MultiXact), NOWAIT, SKIP LOCKED job queues, advisory locks (session vs xact) |
| 7 | lwlocks-deadlocks | LWLocks, spinlocks and deadlock detection | lock hierarchy (spinlock → LWLock → heavyweight), wait events (`LWLock`, `Lock`), `deadlock_timeout` & the waits-for graph, 40P01, lock ordering fixes |

## Module 6 — Advanced Programmability & Extensions  (`m6`)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | views-matviews | Views and materialized views | views as `_RETURN` rules, updatable views & WITH CHECK OPTION, security_invoker/barrier, materialized views, REFRESH (CONCURRENTLY needs unique index) |
| 2 | triggers | Triggers | BEFORE/AFTER/INSTEAD OF, row vs statement, firing order (alphabetical), return-value rules, transition tables, WHEN, constraint triggers, event triggers, recursion pitfalls |
| 3 | plpgsql | PL/pgSQL functions and procedures | block structure, variables, control flow, RETURN QUERY, EXCEPTION blocks = subtransactions, plan caching, dynamic SQL & `format()`, procedures with COMMIT, volatility (VOLATILE/STABLE/IMMUTABLE) & snapshot semantics |
| 4 | rule-system | The rule system | query tree, rewrite of views, ON INSERT/UPDATE/DELETE rules (ALSO/INSTEAD, qualified), rules vs triggers, why rules are rarely right |
| 5 | fdw | Foreign data wrappers | SQL/MED: wrapper/server/user mapping/foreign table, postgres_fdw pushdown & remote isolation, file_fdw (runnable in PGlite), IMPORT FOREIGN SCHEMA, FDW callbacks |
| 6 | extensions | Extensions everyone runs | CREATE EXTENSION & packaging (control file, versions), pg_stat_statements, pg_trgm (similarity, GIN/GiST), pgvector (HNSW/IVFFlat), pageinspect, pgcrypto, pg_buffercache, auto_explain |
| 7 | full-text-search | Full-text search | tsvector/tsquery, parsers & dictionaries, `to_tsvector`/`websearch_to_tsquery`, ranking, GIN vs GiST, generated tsvector columns, highlighting |
| 8 | row-level-security | Row-level security | ENABLE/FORCE RLS, permissive vs restrictive policies, USING vs WITH CHECK, BYPASSRLS, multi-tenant patterns with `current_setting`, leakage caveats |

## Module 7 — WAL, Replication, Vacuum & High Availability  (`m7`)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | wal-lsn | Write-ahead logging and LSNs | WAL rule, records & resource managers, LSN arithmetic, segment files & naming, `pg_current_wal_lsn`, `pg_walinspect`, `wal_level`, synchronous_commit levels & group commit, async commit loss window |
| 2 | checkpoints-fpw | Checkpoints and full page writes | checkpoint process, `checkpoint_timeout`/`max_wal_size`/`checkpoint_completion_target`, redo point, torn pages & full page images, `wal_compression`, crash recovery replay |
| 3 | vacuum | VACUUM vs VACUUM FULL | dead tuple removal, pruning vs vacuum, index cleanup, VM/FSM updates, truncation, VACUUM FULL/CLUSTER rewrite + ACCESS EXCLUSIVE, VACUUM options, `pg_stat_progress_vacuum` |
| 4 | autovacuum-tuning | Tuning autovacuum | trigger formulas (threshold + scale factor, PG18 max_threshold cap, insert threshold), per-table settings, cost-based throttling, workers, `pg_stat_user_tables` monitoring, long transactions blocking cleanup |
| 5 | xid-wraparound | XID wraparound, freezing and MultiXacts | 32-bit xids & modulo-2^32 comparison, freezing, `vacuum_freeze_min_age`/`table_age`, `autovacuum_freeze_max_age`, failsafe, warnings at 40M / stop at 3M, MultiXact IDs & members, `age(relfrozenxid)`, recovery procedure |
| 6 | streaming-replication | Physical streaming replication | WAL sender/receiver, standby, replication slots & retained WAL, hot standby & conflicts, synchronous replication (`synchronous_standby_names`, remote_write/on/remote_apply), lag columns, failover & pg_rewind |
| 7 | logical-replication | Logical replication | publications/subscriptions, `pgoutput`, replica identity, row filters & column lists, initial sync, conflicts & SKIP, logical decoding & slots, `test_decoding`, failover slots |
| 8 | partitioning | Declarative partitioning and pruning | range/list/hash, partition keys & bounds, default partition, plan-time / init / run-time pruning, ATTACH/DETACH CONCURRENTLY, partition-wise join/aggregate, indexes on partitioned tables, retention by DROP |
| 9 | backup-pitr | Backups and point-in-time recovery | pg_dump/pg_restore (formats, parallel), base backups, WAL archiving, PITR (`recovery_target_*`), timelines, incremental backups (17+/18), `pg_verifybackup` |
| 10 | connection-pooling | Connection pooling | per-connection process cost, PgBouncer session vs transaction vs statement modes, what breaks in transaction mode (session state, prepared statements, advisory locks, LISTEN), sizing pools, `idle_in_transaction_session_timeout` |
