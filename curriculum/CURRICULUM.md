# Curriculum map — Postgres, Visualized

Three tracks plus a Cookbook. Facts follow PostgreSQL 18 (and, for the ecosystem, the current pgvector, TimescaleDB and Citus releases).

- **Fundamentals**: F1 Getting started, F2 Working with data, F3 Designing a database, F4 Querying & DML (module id `m3`), F5 Practical SQL patterns (module id `f4`)
- **Internals**: I1–I6 (module ids `m1`, `m2`, `m4`, `m5`, `m6`, `m7`)
- **Ecosystem**: E1 pgvector, E2 TimescaleDB, E3 Distributed PostgreSQL
- **Cookbook**: graded exercises (beginner → expert) on shared datasets, `app/src/cookbook/data/*.ts`


## F1 — Getting Started with SQL  (`f1`, track: fundamentals, beginner)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | relational-basics | Tables, rows and your first query | what a relational database is, tables/rows/columns, a cluster → database → schema → table, `SELECT … FROM`, column lists vs `*`, aliases, expressions in the select list, comments, semicolons, how a client sends SQL |
| 2 | create-and-insert | Creating tables and inserting rows | `CREATE TABLE` with common types (int/bigint, text, numeric, boolean, date, timestamptz), `PRIMARY KEY`, `NOT NULL`, `DEFAULT`, identity columns, `INSERT` single/multi-row, `INSERT … SELECT`, `RETURNING`, `DROP TABLE`, quoting identifiers vs strings |
| 3 | filter-and-sort | Filtering and sorting | `WHERE` with `= <> < >`, `AND/OR/NOT` precedence, `IN`, `BETWEEN`, `LIKE/ILIKE` and wildcards, `IS NULL`, three-valued logic, `ORDER BY` (multiple keys, `DESC`, `NULLS FIRST/LAST`), `LIMIT/OFFSET`, `FETCH FIRST … WITH TIES`, `DISTINCT` |
| 4 | aggregate-basics | Counting, summing and grouping | `count(*)` vs `count(col)`, `sum/avg/min/max`, `GROUP BY` rules (every non-aggregated column), `HAVING` vs `WHERE`, grouping by expressions, `round()` for presentation, order of evaluation (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT) |
| 5 | change-data-safely | Updating and deleting safely | `UPDATE … SET … WHERE`, `DELETE … WHERE`, previewing with `SELECT` first, `RETURNING`, transactions (`BEGIN`/`COMMIT`/`ROLLBACK`) as a safety net, `TRUNCATE` vs `DELETE`, the missing-WHERE accident and how to guard against it |

## F2 — Working with Data  (`f2`, track: fundamentals, beginner → intermediate)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | text-functions | Text and strings | `||` and `concat`/`concat_ws`, `length` vs `octet_length`, `lower/upper/initcap`, `trim`, `substring`, `position`, `split_part`, `replace`, `format()`, regular expressions (`~`, `regexp_replace`, `regexp_matches`), collations and case-insensitive matching (`ILIKE`, `citext`, nondeterministic collations) |
| 2 | numbers-and-math | Numbers and arithmetic | integer vs numeric vs float, integer division and casting, `round/trunc/ceil/floor`, `%` and `mod`, `numeric` precision and scale, `generate_series`, `random()` caveats, money handling, overflow errors |
| 3 | dates-and-times | Dates, times and time zones | `date`, `timestamp` vs `timestamptz`, `interval`, `now()` vs `clock_timestamp()`, `date_trunc`, `extract`, `date_bin`, `AT TIME ZONE`, `TimeZone` setting, interval arithmetic and month-end behaviour, `age()`, series of days, half-open ranges `[start, end)` |
| 4 | conditional-logic | Conditional logic | `CASE` (simple and searched), `COALESCE`, `NULLIF`, `GREATEST/LEAST`, conditional aggregates with `FILTER`, boolean expressions in the select list, avoiding division by zero |
| 5 | casting-and-types | Type conversion | `CAST` and `::`, implicit vs explicit casts, `to_char`/`to_number`/`to_date`, parsing user input safely (`pg_input_is_valid`), text ↔ numeric/date pitfalls, arrays and JSON at a glance (links to I2) |

| 6 | working-with-json | Working with JSON | building JSON from rows (`jsonb_build_object`, `jsonb_agg`, `jsonb_object_agg`, `to_jsonb`, `row_to_json`), SQL/JSON constructors (`JSON_OBJECT`, `JSON_ARRAY`, `JSON_OBJECTAGG`, `JSON_ARRAYAGG`), querying (`->`/`->>`/`#>>`, containment, existence, jsonpath, `JSON_EXISTS`/`JSON_VALUE`/`JSON_QUERY`, `JSON_TABLE`), shredding (`jsonb_to_recordset`, `jsonb_array_elements`), updating (`jsonb_set`, `jsonb_insert`, `||`, `-`, `#-`), validation (`IS JSON`, CHECK constraints, `jsonb_typeof`), and an index decision guide (GIN `jsonb_ops` vs `jsonb_path_ops` vs B-tree expression) plus when to promote a key to a column; links to I2 JSON vs JSONB and I3 GIN |
| 7 | ranges-and-special-types | Ranges and other special types | range types (`int4range`, `numrange`, `daterange`, `tstzrange`, bounds `[)`, empty and infinite ranges, operators `@>` `<@` `&&` `-|-` `<<` `>>`, `range_agg`, multiranges, `lower`/`upper`), exclusion constraints and `WITHOUT OVERLAPS` at a glance, GiST/SP-GiST indexes for ranges; network types (`inet`, `cidr`, `macaddr`, containment `<<=`, `>>=`, `inet_ops`); geometric types (`point`, `box`, `circle`, `polygon`, distance `<->`); composite types (row values, `(t).field`), plus `xml` briefly |

## F3 — Designing a Database  (`f3`, track: fundamentals, beginner → intermediate)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | keys-and-relationships | Keys and relationships | primary keys (natural vs surrogate, identity vs uuid), foreign keys, one-to-one / one-to-many / many-to-many with a junction table, ER diagrams, `ON DELETE` actions, self-references |
| 2 | constraints-defaults | Constraints and defaults | `NOT NULL`, `UNIQUE` (and NULLs, `NULLS NOT DISTINCT`), `CHECK`, `DEFAULT`, `EXCLUDE` at a glance, naming constraints, enums vs lookup tables vs CHECK, domains |
| 3 | indexes-101 | Indexes for beginners | what an index is (book index analogy), when the planner uses one, `CREATE INDEX`, multicolumn order, `EXPLAIN` basics (Seq Scan vs Index Scan), cost of indexes on writes, finding missing indexes (links to I3) |
| 4 | views-and-sequences | Views, sequences and identity | views as saved queries, updatable views, materialized views at a glance, sequences, `serial` vs identity, `nextval` gaps, `RETURNING` the generated id |
| 5 | schema-changes | Changing a schema safely | `ALTER TABLE` add/drop/rename columns, type changes and rewrites, adding NOT NULL / FK / CHECK on big tables (`NOT VALID` + `VALIDATE`), `CREATE INDEX CONCURRENTLY`, lock timeouts, migration practice |

## F5 — Practical SQL Patterns  (`f4`, track: fundamentals, intermediate → expert)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | pagination | Pagination: OFFSET vs keyset | why `OFFSET` gets slower, keyset/seek pagination with row comparisons `(a, b) > ($1, $2)`, stable ordering, cursors, counting totals cheaply |
| 2 | upsert-dedup | Upserts and de-duplication | `INSERT … ON CONFLICT DO UPDATE/NOTHING`, `MERGE`, finding and deleting duplicates (`row_number`, `ctid`), preventing them with unique indexes |
| 3 | pivot-reporting | Pivots and reports | conditional aggregation (`FILTER`), `crosstab` (tablefunc), `GROUPING SETS`/`ROLLUP` subtotals, percent of total, period-over-period with `lag`, date spines with `generate_series` |
| 4 | gaps-and-islands | Gaps and islands | consecutive runs (row_number difference trick), sessionization with `lag` + running sum, missing values in sequences, overlapping ranges (range types, `&&`, `range_agg`) |
| 5 | hierarchies | Trees and graphs | adjacency lists + recursive CTEs, path materialization, `ltree`, closure tables, cycle detection, nested sets trade-offs |
| 6 | search-patterns | Searching text | `LIKE` prefix vs infix and indexes (`text_pattern_ops`), trigram search (`pg_trgm`, similarity, GIN/GiST), full-text search basics, combining with ranking |
| 7 | queues-and-locking | Job queues and concurrency patterns | `FOR UPDATE SKIP LOCKED` workers, advisory locks, optimistic concurrency with version columns, idempotency keys, LISTEN/NOTIFY |
| 8 | performance-checklist | A query performance checklist | reading EXPLAIN ANALYZE quickly, N+1 queries, sargable predicates, functions on columns, implicit casts, `pg_stat_statements` top queries, batching, connection usage |

## E1 — Vector Search with pgvector  (`e1`, track: ecosystem)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | embeddings-and-vectors | Embeddings and the vector type | what an embedding is, dimensions, `vector(n)`, storage size, inserting/reading vectors, `halfvec`/`sparsevec`/`bit` at a glance, normalization |
| 2 | distance-and-exact-search | Distance metrics and exact search | `<->` L2, `<#>` negative inner product, `<=>` cosine, `<+>` L1, `<~>` Hamming, `<%>` Jaccard; when to use which; exact k-NN with `ORDER BY … LIMIT` and its cost |
| 3 | hnsw | HNSW indexes | layered proximity graph, greedy search, `m`, `ef_construction`, `hnsw.ef_search`, build memory & time, recall vs speed, opclasses per type and metric |
| 4 | ivfflat | IVFFlat indexes | k-means lists, `lists` sizing, `ivfflat.probes`, build after data load, recall vs speed, HNSW vs IVFFlat trade-offs |
| 5 | filtering-and-hybrid | Filtering and hybrid search | post-filtering and lost recall, iterative index scans (`hnsw.iterative_scan`, `max_scan_tuples`), partial indexes and partitioning per tenant, hybrid search with full-text + Reciprocal Rank Fusion |
| 6 | pgvector-production | pgvector in production | quantization (halfvec, binary + re-ranking), sizing memory and disk, `maintenance_work_mem` and parallel builds, monitoring recall, RAG schema design, when to use a dedicated vector database |

## E2 — Time-Series with TimescaleDB  (`e2`, track: ecosystem)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | time-series-basics | Time-series data on PostgreSQL | what makes time-series different (append-mostly, time-range queries, retention), plain PostgreSQL approaches (BRIN, declarative partitioning, `date_bin`), what TimescaleDB adds, licensing editions |
| 2 | hypertables-chunks | Hypertables and chunks | `create_hypertable` / `CREATE TABLE … WITH (tsdb.hypertable…)`, chunk time interval sizing, chunk exclusion, space partitioning, `show_chunks`, native-partitioning equivalent you can run here |
| 3 | time-bucket-gapfill | time_bucket and gap filling | `time_bucket` (origin, offset, time zones), `time_bucket_gapfill`, `locf`, `interpolate`, `first`/`last`; native equivalents with `date_bin` and `generate_series` |
| 4 | continuous-aggregates | Continuous aggregates | materialized vs real-time aggregates, refresh policies and windows, invalidation, hierarchical aggregates; compared with materialized views |
| 5 | compression-columnstore | Compression and the columnstore | row → columnar chunks (Hypercore), `segmentby` / `orderby`, compression policies, typical ratios, querying and modifying compressed data |
| 6 | retention-jobs | Retention, tiering and jobs | `drop_chunks` and retention policies, the jobs framework (`add_job`, `timescaledb_information.jobs`), tiered storage, multi-node (removed) and current scale-out options, production sizing |

## E3 — Distributed PostgreSQL  (`e3`, track: ecosystem)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | why-distribute | Why and how to distribute PostgreSQL | scale up vs out, the architecture taxonomy (read replicas, shared-storage like Aurora/Neon, sharding extensions, distributed SQL, multi-master), what each buys and costs, CAP/PACELC in plain words |
| 2 | sharding-citus | Sharding with Citus | coordinator and workers, distribution column choice, hash shards and `citus.shard_count`, colocation, reference tables, schema-based sharding, what changes for keys and constraints |
| 3 | distributed-queries | Distributed query execution | router vs multi-shard queries, pushdown, repartition joins, aggregates in two phases, distributed `EXPLAIN`, rebalancing shards |
| 4 | distributed-transactions | Distributed transactions and consistency | 2PC and its failure modes, clocks and timestamps (hybrid logical clocks), isolation differences (Read Committed vs snapshot vs serializable in distributed SQL), sequences, unique constraints and foreign keys across nodes |
| 5 | distributed-sql-multimaster | Distributed SQL and multi-master | YugabyteDB-style (Raft, tablets, DocDB) vs PostgreSQL-compatible behaviour differences; active-active logical replication (pgEdge/Spock, EDB PGD), conflict detection and resolution, when multi-master is worth it |
| 6 | ha-clusters | High-availability clusters in practice | Patroni + etcd/Consul, leader election and fencing, HAProxy/PgBouncer routing, synchronous standbys, failover/switchover, split-brain, monitoring a cluster |


## E4 — Spatial Data with PostGIS  (`e4`, track: ecosystem; PostGIS 3.6 runs live in the playground)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | spatial-basics | Geometry, geography and coordinate systems | what PostGIS adds, `geometry` vs `geography`, SRIDs and `spatial_ref_sys`, EPSG:4326 vs 3857 vs local projections, longitude-first coordinate order, WKT/WKB/GeoJSON, `ST_MakePoint`/`ST_SetSRID`/`ST_Transform`, typmods `geometry(Point, 4326)`, measuring distance/area/length correctly |
| 2 | spatial-indexes | Spatial indexes | GiST R-tree over bounding boxes, the `&&` operator, index-aware functions (`ST_Intersects`, `ST_DWithin`, `ST_Contains`), two-step filtering (bbox then exact), casting geometry to geography defeating the index, functional geography indexes, SP-GiST and BRIN for points, `EXPLAIN` of spatial plans |
| 3 | nearest-neighbour | Nearest-neighbour search | KNN with `ORDER BY geom <-> point LIMIT k`, `<->` vs `<#>`, geography KNN, nearest-per-row with `LATERAL`, combining `ST_DWithin` radius with ordering, distance units per type |
| 4 | spatial-queries | Everyday spatial queries | point-in-polygon joins, intersections and overlays, buffers, area and length, `ST_Union`/`ST_Collect`, clustering (`ST_ClusterDBSCAN`, `ST_ClusterKMeans`), simplification for maps, GeoJSON output for web maps, validity (`ST_IsValid`, `ST_MakeValid`) |

## I1 — Foundations & Process Architecture  (`m1`, track: internals)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | what-is-postgres | What PostgreSQL is: cluster, client/server, a query's round trip | client/server model, a cluster = one data directory + one postmaster, databases inside it, libpq connection, simple query protocol, psql basics |
| 2 | process-model | The postmaster and one process per connection | postmaster, fork per connection, backend lifecycle, `pg_stat_activity`, `max_connections`, startup/auth, shutdown modes & signals, crash restart |
| 3 | shared-memory | Shared memory: buffers, WAL buffers and the commit log | `shared_buffers` buffer pool, buffer descriptors/pins/usage count, clock-sweep eviction, `wal_buffers`, CLOG/`pg_xact` & SLRU caches, `pg_buffercache`, local memory (`work_mem`, `maintenance_work_mem`, `temp_buffers`) |
| 4 | background-processes | The background crew | background writer, checkpointer, WAL writer, autovacuum launcher/workers, stats (cumulative statistics in shared memory), archiver, logical replication launcher, I/O workers (`io_method`, PG18 AIO), `pg_stat_activity.backend_type` |
| 5 | databases-schemas-roles | Databases, schemas, search_path and roles | templates, `CREATE DATABASE`, schemas & `search_path` (pg_catalog implicit, `public` CREATE revoked since 15), roles/attributes/membership (INHERIT/SET/ADMIN), predefined roles, privileges & GRANT, pg_hba.conf first-match |
| 6 | normalization-constraints | Modelling data: normalization and constraints | 1NF→3NF/BCNF with a worked schema, keys, PRIMARY KEY/UNIQUE/FK (actions, deferrable)/CHECK/NOT NULL/EXCLUDE, generated columns (virtual default in 18), identity columns, NOT ENFORCED, temporal keys `WITHOUT OVERLAPS` |

## I2 — Storage & Page Layout Internals  (`m2`, track: internals)
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

## F4 — Querying & Data Manipulation  (`m3`, track: fundamentals)
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

## I3 — Query Planner, Optimizer & Indexing Internals  (`m4`, track: internals)
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

## I4 — Concurrency, MVCC & Locking Internals  (`m5`, track: internals)
| # | slug | title | scope |
|---|------|-------|-------|
| 1 | acid-transactions | ACID and transactions | atomicity via CLOG, BEGIN/COMMIT/ROLLBACK, savepoints & subtransactions, virtual vs real xids (`pg_current_xact_id_if_assigned`), command ids, two-phase commit, implicit transactions |
| 2 | snapshots-visibility | Snapshots and tuple visibility | snapshot `xmin:xmax:xip`, `pg_current_snapshot`, `pg_visible_in_snapshot`, visibility rules for xmin/xmax, hint bits, read committed vs repeatable read snapshot timing, `xid8` |
| 3 | hot-fillfactor | HOT updates and fillfactor | HOT conditions (no indexed column changed, room on same page), HOT chains & redirects, pruning, `fillfactor`, `n_tup_hot_upd`, index bloat from non-HOT updates |
| 4 | isolation-levels | Isolation levels: RC, RR, Serializable (SSI) | anomalies table, Read Committed re-check rule (EvalPlanQual), RR serialization failures 40001, SSI with SIRead predicate locks, rw-conflicts, retry loops, read-only deferrable |
| 5 | table-locks | Heavyweight locks and the conflict matrix | 8 table lock modes + full conflict matrix, which commands take which, lock queue & lock_timeout, `pg_locks`, `pg_blocking_pids`, ALTER TABLE lock levels, fast-path locks |
| 6 | row-locks-skip-locked | Row locks, SKIP LOCKED and advisory locks | FOR UPDATE / NO KEY UPDATE / SHARE / KEY SHARE + conflict matrix, row locks stored in tuples (xmax, MultiXact), NOWAIT, SKIP LOCKED job queues, advisory locks (session vs xact) |
| 7 | lwlocks-deadlocks | LWLocks, spinlocks and deadlock detection | lock hierarchy (spinlock → LWLock → heavyweight), wait events (`LWLock`, `Lock`), `deadlock_timeout` & the waits-for graph, 40P01, lock ordering fixes |

## I5 — Advanced Programmability & Extensions  (`m6`, track: internals)
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

## I6 — WAL, Replication, Vacuum & High Availability  (`m7`, track: internals)
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
