# TimescaleDB (time-series on PostgreSQL)

Research date: 2026-11-14. Current release at time of writing: **TimescaleDB 2.32.0 (released 2026-11-11/12)**,
supporting **PostgreSQL 16, 17 and 18**. TimescaleDB Toolkit current release: **1.27.0** (2026-11-05).
Vendor: Timescale Inc., renamed **Tiger Data** (docs moved from `docs.timescale.com` to `docs.tigerdata.com`,
which now redirects to `https://www.tigerdata.com/docs/...`). The managed service is **Tiger Cloud** (formerly
"Timescale Cloud").

Runtime reminder for lessons: the playground is PGlite 0.5.16 = PostgreSQL 18.6. `pg_available_extensions` in PGlite
lists only `plpgsql` (verified) — TimescaleDB, pg_cron, pg_partman, tablefunc, postgres_fdw are all absent. Every
TimescaleDB concept below has a native-PostgreSQL stand-in that was run in PGlite (section 8).

---

## 1. Sources read

Primary (official Tiger Data / TimescaleDB):

| # | URL | Contributed |
|---|-----|-------------|
| P1 | https://github.com/timescale/timescaledb (README.md, raw) | Quick start, `CREATE TABLE ... WITH (tsdb.hypertable)`, `timescaledb.enable_direct_compress_insert`, `convert_to_columnstore(..., recompress := true)`, cagg + policy example, Docker image `timescale/timescaledb-ha:pg18` |
| P2 | https://github.com/timescale/timescaledb/blob/main/CHANGELOG.md (raw, all releases 2.0 → 2.32.0) | Every version/deprecation/removal date used in this file |
| P3 | https://api.github.com/repos/timescale/timescaledb/releases | Latest releases: 2.32.0 (2026-11-12), 2.31.0 (2026-10-20), 2.30.2, 2.30.1, 2.30.0 (2026-09-08), 2.29.x |
| P4 | https://github.com/timescale/timescaledb/blob/main/LICENSE | Apache-2.0 outside `tsl/`, Timescale License inside `tsl/`; separate `-tsl` shared object |
| P5 | https://github.com/timescale/timescaledb/blob/main/docs/MultiNodeDeprecation.md | Multi-node end-of-life rationale |
| P6 | https://www.tigerdata.com/docs/llms-full.txt (the complete official docs, 5.3 MB, auto-generated from the docs source; read section by section, listed below) | All core concepts and API signatures |
| P6a | …/docs/get-started/choose-your-path/timescaledb-editions | Apache 2 vs Community (TSL) feature matrix, `SHOW timescaledb.license` |
| P6b | …/docs/deploy/self-hosted/… "Supported platforms" | PostgreSQL × TimescaleDB support matrix |
| P6c | …/docs/learn/hypertables/{understand-hypertables, creating-and-configuring-hypertables, partitioning-hypertables, sizing-hypertable-chunks, hypertable-indexes, optimize-data-in-hypertables} and /docs/learn/chunks/understanding-chunks | Hypertables, chunks, sizing, indexes, ops |
| P6d | …/docs/reference/timescaledb/hypertables/{create_table, create_hypertable, add_dimension, drop_chunks, show_chunks, set_chunk_time_interval, set_integer_now_func, enable_chunk_skipping} + overview | Exact signatures/defaults/errors |
| P6e | …/docs/learn/data-lifecycle/time-buckets/{about-time-buckets, use-time-buckets}; …/reference/…/hyperfunctions/{time_bucket, time_bucket_gapfill, locf, interpolate, first, last, histogram, days_in_month, to_epoch} | time_bucket semantics, origins, gapfill |
| P6f | …/docs/learn/continuous-aggregates/{about, hierarchical-continuous-aggregates, materialized-hypertables, real-time-aggregates, time} + …/build/continuous-aggregates/{create-a-continuous-aggregate, refresh-policies} + reference (create/alter/drop materialized view, add_continuous_aggregate_policy, refresh_continuous_aggregate, add_policies family, cagg_migrate) | Caggs |
| P6g | …/docs/learn/columnar-storage/{understand-hypercore, compression-methods}; …/build/columnar-storage/setup-hypercore; reference hypercore/* (add_columnstore_policy, add_compaction_policy, ALTER TABLE, convert_to_columnstore, convert_to_rowstore, chunk_columnstore_stats, *_settings views); …/build/performance-optimization/secondary-indexes; troubleshoot-hypercore | Hypercore/columnstore |
| P6h | …/docs/learn/data-lifecycle/{data-lifecycle, data-retention/*}; reference data-retention/* | Retention |
| P6i | …/docs/reference/timescaledb/jobs-automation/{add_job, alter_job, delete_job, run_job}; informational-views/*; api tag overview | Jobs framework + information views |
| P6j | …/docs/learn/hyperfunctions/about-hyperfunctions; …/reference/toolkit | Hyperfunction & Toolkit inventory |
| P6k | …/docs/reference/timescaledb/configuration/gucs (version stamp 2.32.0) + configuration page | GUC inventory |
| P6l | …/docs/build/performance-optimization/{improve-hypertable-performance, skipscan} | Chunk skipping, SkipScan, chunk interval tuning |
| P7 | https://api.github.com/repos/timescale/timescaledb-toolkit/releases | Toolkit 1.27.0 (2026-11-05) |
| P8 | https://neon.com/docs/extensions/pg-extensions (.md, "Last updated 2026-11-04") | Neon version per PG major |

Pages from the slice (`ext2/pages/`):

| File | Kind | Contributed |
|------|------|-------------|
| `docs.timescale.com__use-timescale__latest__hypertables.txt` | primary | Hypertable intro, desc time index auto-created |
| `docs.timescale.com__use-timescale__latest__continuous-aggregates__about-continuous-aggregates.txt` | primary | JOIN support matrix by version, function support matrix, materialization/invalidation engine internals |
| `docs.timescale.com__use-timescale__latest__compression__about-compression.txt` | primary | Compression algorithms incl. AIC since 2.32.0 |
| `neon.com__docs__extensions__timescaledb.txt` | primary for Neon | "Only Apache-2 licensed features are supported. Compression is not supported."; examples of `first/last/histogram/approximate_row_count/show_chunks/chunks_detailed_size/drop_chunks`; cron for retention; scale-to-zero caveat |
| `www.freecodecamp.org__news__timescaledb-course…txt` | secondary | Course outline only (4-hour video): hypertables, columnstore ">90%" shrink, cagg "ladders" (= hierarchical caggs), hyperfunctions/gapfill, tiering to S3. No technical detail beyond that. |

Not read (bot walls, as instructed): Baeldung "TimescaleDB", Stackademic "TimescaleDB: the complete guide part 1".
Their topics are fully covered by P6.

---

## 2. Core concepts

### 2.1 What TimescaleDB is; editions and licences

- A PostgreSQL **extension** (`CREATE EXTENSION timescaledb;`) that must be in `shared_preload_libraries`
  (it has a "loader" library; several releases say "loader changes take effect after a PostgreSQL restart", e.g. 2.31.0, 2.32.0).
- Tagline (README): "a PostgreSQL extension for high-performance real-time analytics on time-series and event data".
- Two editions, chosen by GUC **`timescaledb.license`**:
  - `timescale` (default) → **TimescaleDB Community Edition**, licensed under the **Tiger Data License (TSL)**
    (file `tsl/LICENSE-TIMESCALE`). Free to self-host and modify ("right to repair"); you **cannot sell it as a service**.
  - `apache` → **TimescaleDB Apache 2 Edition**: only Apache-2.0 code paths; may be offered as a service by anyone.
  - Check: `SHOW timescaledb.license;` or `SELECT name, setting, source, sourcefile, sourceline FROM pg_settings WHERE name='timescaledb.license';`
  - Code layout (LICENSE): everything outside `tsl/` is Apache-2.0; inside `tsl/` is TSL; the build emits a separate
    shared object with `-tsl` in its name.
  - Error when an Apache-only build/mode hits a TSL feature: `functionality not supported under the current "apache" license`.
- Feature split (editions page P6a). **Apache 2 Edition has**: `CREATE TABLE … WITH (tsdb.hypertable)`, `create_hypertable`,
  `show_chunks`, `drop_chunks`, `attach/detach_tablespace(s)`, `show_tablespaces`, `set_chunk_time_interval`,
  `set_integer_now_func`, `add_dimension`, `CREATE INDEX … transaction_per_chunk`, all `hypertable_*size` / `chunks_detailed_size`,
  hyperfunctions `approximate_row_count`, `first`, `last`, `histogram`, `time_bucket`; information views
  `chunks`, `continuous_aggregates`, `dimensions`, `hypertables`, `jobs`, `job_stats`; admin `timescaledb_pre_restore`,
  `timescaledb_post_restore`, `get_telemetry_report`, `dump_meta_data`.
  **Community (TSL) only**: `split_chunk`, `reorder_chunk`, `move_chunk`, `add_reorder_policy`, **SkipScan**,
  **all of Hypercore/columnstore** (ALTER TABLE hypercore, add/remove_columnstore_policy, convert_to_columnstore/rowstore,
  *_columnstore_settings/stats), **all continuous aggregates** (CREATE/ALTER/DROP MATERIALIZED VIEW cagg,
  add/remove_continuous_aggregate_policy, refresh_continuous_aggregate), **data retention policies**
  (add/remove_retention_policy), **jobs** (`add_job`, `alter_job`, `delete_job`, `run_job`), **`time_bucket_gapfill`,
  `locf`, `interpolate`**, and Toolkit functions (percentile_agg, approx_percentile, uddsketch, tdigest, time_weight, …).
- API reference tags: `Community` = TSL only; `Early access` = in `timescaledb_experimental` schema (objects depending on
  it are **dropped on extension upgrade**); `Toolkit` = needs the separate `timescaledb_toolkit` extension on self-hosted.
- TimescaleDB Toolkit is a separate extension (Rust, `timescaledb-toolkit` repo), current 1.27.0. Tiger Cloud includes
  all hyperfunctions; self-hosted TimescaleDB includes only the subset listed under "General functions" and "Gapfilling".

### 2.2 Versions and PostgreSQL support (support matrix, P6b + changelog)

| TimescaleDB | PG18 | PG17 | PG16 | PG15 | PG14 | PG13 |
|---|---|---|---|---|---|---|
| 2.29.x – 2.32.x | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 2.23.x – 2.28.x | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 2.20.x – 2.22.x | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 2.17 – 2.19 | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 2.16.x | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| 2.13 – 2.15 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

Milestones: PG17 support 2.17.0 (2024-10-08); PG14 dropped 2.20.0 (2025-05-15); **PG18 full support 2.23.0 (2025-10-29)**;
PG15 dropped **2.29.0 (2026-07-28)** — 2.28.x is the last line supporting PG15. Docs warn not to use TimescaleDB with
PostgreSQL 17.1, 16.5, 15.9, 14.14, 13.17, 12.21 (ABI break reverted in the next minors).

Recent release highlights (changelog, for "what's new" asides):
- 2.18.0 (2025-01-23): **rename compression → columnstore/Hypercore** (deprecated old names, table in §6); Hypercore TAM introduced; SIMD vectorized group-by.
- 2.19.0: DML no longer blocked during recompression; `merge_chunks`.
- 2.20.0 (2025-05-15): **`CREATE TABLE … WITH (tsdb.hypertable)`** syntax; bloom-filter sparse indexes (up to 6x point queries); SkipScan on columnstore; UPSERT backfill 10x.
- 2.21.0: Hypercore TAM deprecated; columnstore option in `CREATE TABLE WITH`.
- 2.22.0 (2025-09-02): Hypercore TAM **removed** (upgrade blocked if in use); WAL-based cagg invalidation (tech preview).
- 2.23.0: PG18; UUIDv7 compression on by default; **`CREATE TABLE WITH` auto-creates a columnstore policy**; partition column auto-detected.
- 2.24.0 (2025-12-03): `convert_to_columnstore(..., recompress := true)` in-memory recompression (4–5x faster).
- 2.25.0 (2026-01-29): **old (partial, pre-2.7) cagg format removed**; WAL-based invalidation removed; **`time_bucket_ng` removed**; `buckets_per_batch` default 10; `rebuild_columnstore`; `ColumnarIndexScan`.
- 2.26.0: vectorized functions such as `time_bucket()` in the columnar pipeline; composite bloom filters; `ColumnarIndexScan` enabled (up to 70x for COUNT/MIN/MAX/FIRST/LAST from sparse indexes); GUC `default_chunk_time_interval`.
- 2.27.0: vectorized filters through the normal function path (30%–2x).
- 2.28.0 (2026-06-16): `first()/last()` from batch metadata; **incremental batched `refresh_continuous_aggregate()`** (`options` jsonb); `ALTER MATERIALIZED VIEW … ADD COLUMN … GENERATED ALWAYS AS (agg) STORED`; **adaptive chunking removed**; `skip_cagg_invalidation`; gapfill bounds from uncorrelated subqueries.
- 2.29.0 (2026-07-28): PG15 removed; chunk exclusion for UPDATE/DELETE locks only touched chunks; `compact_chunk()`, compaction policy; `tsdb.direct_compress` table option; `alter_job(config_merge => …)`.
- 2.30.0: `DeferredChunkAppend` (chunks expanded at execution, fast `LIMIT`).
- 2.31.0 (2026-10-20): `move_to_columnstore()` (no DML blocking); vectorized UPDATE/DELETE on columnstore (up to 6.5x); granular cagg refresh APIs; AIC preview.
- 2.32.0 (2026-11-11): **Adaptive Integer Compressor (AIC) on by default**; background scheduler runs as database owner (not superuser); many security fixes ("upgrade as soon as possible").

### 2.3 Hypertables and chunks

**Definition.** A hypertable is a PostgreSQL table that TimescaleDB automatically partitions by time (and optionally other
dimensions) into child tables called **chunks**. You always query/insert the hypertable name; chunks are created on demand
when a row arrives for a time range that has no chunk. Chunks live in schema `_timescaledb_internal`, named
`_hyper_<hypertable_id>_<chunk_id>_chunk` (prefix configurable via `tsdb.associated_table_prefix`, default `_hyper`;
schema via `tsdb.associated_schema`). Inheritance on hypertables is not supported. (Internally TimescaleDB uses
inheritance-based child tables, not PG declarative partitioning; `create_hypertable()` refuses tables already partitioned
by declarative partitioning or inheritance. GUC `enable_partitioned_hypertables` = experimental, default off.)

**New syntax (since 2.20.0; auto partition column since 2.23.0):**
```sql
CREATE TABLE conditions (
  time        TIMESTAMPTZ NOT NULL,
  location    TEXT NOT NULL,
  device      TEXT NOT NULL,
  temperature DOUBLE PRECISION NULL,
  humidity    DOUBLE PRECISION NULL
) WITH (
  tsdb.hypertable,                 -- prefix tsdb. or timescaledb. (both accepted)
  tsdb.partition_column = 'time',  -- default: first TIMESTAMP/TIMESTAMPTZ column; error if ambiguous
  tsdb.chunk_interval   = '1 day', -- default 7 days
  tsdb.segmentby        = 'device',
  tsdb.orderby          = 'time DESC'
);
```
Full option list (CREATE TABLE reference): `tsdb.hypertable` (bool, default true), `tsdb.columnstore` (bool, default true —
creates a columnstore policy with `after` = chunk interval), `tsdb.partition_column`, `tsdb.chunk_interval` (default `7 days`),
`tsdb.create_default_indexes` (default true), `tsdb.associated_schema` (default `_timescaledb_internal`),
`tsdb.associated_table_prefix` (default `_hyper`), `tsdb.orderby` (default time DESC), `tsdb.segmentby` (default: chosen
from `pg_stats`, else from existing indexes), `tsdb.sparse_index` (`bloom(col,…)`, `minmax(col)`; requires orderby),
`tsdb.direct_compress` (default false, tech preview 2.29.0), `tsdb.direct_compress_schedule_interval` (default `1 minute`).
Errors: `partition column could not be determined`, `timescaledb options requires hypertable option`,
`unrecognized parameter "<param>"`, `functionality not supported under the current "apache" license`.
Version notes: on self-hosted 2.20.0–2.22.1 you must call `add_columnstore_policy` yourself after `CREATE TABLE`;
on ≤ 2.19.3 use `create_hypertable()` + `ALTER TABLE … SET (timescaledb.enable_columnstore …)`.

**Old/functional syntax** (generalized API since 2.13; `by_range`/`by_hash` builders added in 2.13):
```sql
SELECT create_hypertable(
  relation               => 'conditions',        -- REGCLASS
  dimension              => by_range('time', INTERVAL '1 day'),
  create_default_indexes => true,                -- default TRUE
  if_not_exists          => false,               -- default FALSE (TRUE → warning instead of error)
  migrate_data           => false);              -- default FALSE; TRUE moves existing rows into chunks (locks, slow)
-- returns (hypertable_id integer, created boolean)
```
- `by_range(column_name, partition_interval, partition_func)`; interval for timestamp/date as INTERVAL or integer
  **microseconds** (`86400000000` = 1 day); integer columns take the column's own unit. `partition_func` (REGPROC,
  IMMUTABLE) lets you partition on a derived time, e.g. from jsonb or a composite type.
- `by_hash(column_name, number_partitions, partition_func)` — `number_partitions` required, 1–32767.
- Default intervals by column type: TIMESTAMP / TIMESTAMPTZ / DATE → **1 week**; SMALLINT 10000; INT 100000; BIGINT 1000000.
- Partition column types: `timestamptz` (recommended), `timestamp`, `date`, integer types, **UUIDv7** (time extracted
  from the UUID; PG18 `uuidv7()`, older PG `generate_uuidv7()` from TimescaleDB). Generated columns are rejected
  (`invalid partitioning column`). The time column is made `NOT NULL` automatically.
- `create_hypertable` errors include `cannot create a unique index without the column "<name>" (used in partitioning)`,
  `cannot have FOREIGN KEY constraints to hypertable "<name>"` (old), `…because it is part of a publication`,
  `invalid number of partitions: must be between 1 and 32767`. Current CREATE TABLE doc: "Hypertable to hypertable foreign keys
  are not allowed, all other combinations are permitted."

**Extra dimensions:** `SELECT add_dimension('conditions', by_hash('location', 4));` (the API reference still says "empty hypertable", but current source `src/dimension.c`, `ts_dimension_add_internal`, allows it on a hypertable that has chunks: existing chunks get a −inf/+inf slice for the new dimension, and only chunks created afterwards are partitioned by it; checked 2026-11-15).
Docs strongly discourage it: "Space partitioning multiplies the number of chunks, increases query planning overhead, and requires
all unique constraints to include the hash column." Hash partitioning's stated purpose is parallel I/O across multiple
tablespaces/disks; partitions = N disks × partitions per disk; RAID with one tablespace is preferred. Old form
`add_dimension('conditions', 'location', number_partitions => 4)` still appears in docs.

**Chunk interval.**
- `SELECT set_chunk_time_interval('conditions', INTERVAL '24 hours');` affects **only new chunks**; existing chunk boundaries stay.
- Chunk boundaries are aligned by dividing the timeline by the interval **from epoch 0**, so changing the interval can leave a
  short "transition" chunk.
- Global default: `SET timescaledb.default_chunk_time_interval = '1 day';` (GUC since 2.26.0; not for integer columns).
- Intervals < 1 second on timestamp types warn.
- Sizing rule (docs): set `chunk_interval` so that **the indexes of the chunks currently being ingested fit within 25% of main
  memory** (the docs equate this with `shared_buffers`). Example: 64 GB RAM, ~16 GB shared_buffers; index growth 2 GB/day → 7-day
  chunks; 10 GB/day → 1-day chunks.
- Too many chunks: planning cost grows, small chunks compress worse; symptoms needing a rebuild: >1,000 chunks in one hypertable,
  intermittent OOM on wide scans, low compression ratio. "Tens of thousands of hypertables is not recommended." Fix is a
  table-swap migration (new hypertable, swap names, backfill).
- Adaptive chunking was removed in 2.28.0. Tiger Cloud has "Automated chunk tuning" (off by default; doubles/halves per
  5-minute evaluation; never exceeds the columnstore policy's `after`).
- Integer time needs `set_integer_now_func(hypertable, integer_now_func, replace_if_exists)` for policies/caggs; function takes
  no args, returns the column's integer type; IMMUTABLE → evaluated at plan time (smaller plans); STABLE → evaluated at execution
  (runtime pruning).

**Default indexes:** a B-tree on the partition column **time DESC**; with a space dimension also `(space_col, time DESC)`.
All PG index types work (B-tree, hash, GIN, GiST, BRIN). Any `UNIQUE`/`PRIMARY KEY` **must include the partition column**
(uniqueness is enforced per chunk). `CREATE INDEX … WITH (timescaledb.transaction_per_chunk = true)` builds per chunk in
separate transactions to reduce locking.

**Chunk exclusion.** Because each chunk has a CHECK-like range constraint, the planner skips chunks outside the WHERE range
("chunk exclusion"). TimescaleDB adds its own nodes: `ChunkAppend` (ordered append + runtime exclusion; GUCs
`enable_chunk_append`, `enable_runtime_exclusion`, `enable_ordered_append`), `ConstraintAwareAppend`
(`enable_constraint_aware_append`), now()-constification (`enable_now_constify`), and since 2.30.0 `DeferredChunkAppend`
(`enable_deferred_chunk_append`, default on). 2.26.0 fixed exclusion for `IN`/`ANY` on time; 2.29.0 extends exclusion to
UPDATE/DELETE locking. **Chunk skipping** (tech preview 2.17.1) adds min/max range tracking for a *non-partition* column on
**columnstore** chunks: `SELECT enable_chunk_skipping('orders','order_id');` plus `timescaledb.enable_chunk_skipping = on`
(default off); types smallint/int/bigint/serial/bigserial/date/timestamp/timestamptz; ranges stored in catalog
`chunk_column_stats` (start inclusive, end exclusive); only for chunks compressed **after** enabling.

**show_chunks / drop_chunks** (same argument set):
```sql
SELECT show_chunks(relation => 'conditions', older_than => INTERVAL '3 months');   -- returns REGCLASS rows
SELECT show_chunks('conditions', created_before => INTERVAL '3 months');
SELECT drop_chunks('conditions', INTERVAL '3 months');                             -- returns TEXT chunk names
SELECT drop_chunks('conditions', newer_than => now() + INTERVAL '3 months');       -- clock-skew cleanup
SELECT drop_chunks('conditions', older_than => INTERVAL '3 months', newer_than => INTERVAL '4 months'); -- intersection
```
- `older_than`/`newer_than`: INTERVAL (computed as `now() - x`; error unless time column is TIMESTAMP/TIMESTAMPTZ/DATE) or an
  explicit timestamp/date/integer matching the column type.
- `created_before`/`created_after` use **chunk creation time**; cannot be combined with older_than/newer_than.
- A chunk is dropped only if its **whole range** is before `older_than` (or after `newer_than`) → surviving data can be older
  than the cutoff. Chunks cannot be dropped by hash partition. `drop_chunks` also works on continuous aggregates.
- `verbose => true` prints progress.

Other chunk API (inventory §3.1): `create_chunk`, `drop_chunk`, `move_chunk`, `reorder_chunk`, `merge_chunks`,
`merge_chunks_concurrently`, `split_chunk`, `attach_chunk`, `detach_chunk`, `chunk_rewrite_cleanup`.

### 2.4 time_bucket, gapfill, locf, interpolate

**`time_bucket(bucket_width, ts [, offset] [, origin] [, timezone])`** (since 0.0.10-beta) returns the bucket **start**.
- Like PG `date_bin`, but allows **months/years** widths (`'1 month'`, `'3 months'`; cannot mix months with days, e.g.
  `'1 month 1 day'` is invalid) and has defaults: **origin = 2000-01-03 00:00 (a Monday) for widths < 1 month;
  2000-01-01 for month/year widths; 0 for integers**. So weekly buckets start Monday (ISO). For Sunday weeks pass
  origin `'2000-01-02'` (or any Sunday).
- `ts` types: DATE, TIMESTAMP, TIMESTAMPTZ, **UUID v7** (returns timestamptz). Integer variant for SMALLINT/INT/BIGINT
  (`bucket_width` and `offset` must match the type).
- TIMESTAMPTZ buckets align to **00:00 UTC** by default; `timezone => 'Europe/Berlin'` realigns to local midnight (DST
  can make 2-hour buckets contain 1 or 3 hours).
- `offset` (INTERVAL) shifts buckets later (+) or earlier (−); as a named arg it must be quoted `"offset"` (reserved word).
- Idioms: end-of-bucket label `time_bucket('5 min', time) + '5 min'`; centered rounding
  `time_bucket('5 minutes', time, '-2.5 minutes'::INTERVAL) + '2.5 minutes'`.
- `time_bucket_ng` (experimental successor) was **removed in 2.25.0** (#8229); caggs using it could not be created since 2.15.

**`time_bucket_gapfill(bucket_width, ts, [timezone], [start], [finish])`** (since 1.2.0; **Community/TSL only**): like
time_bucket but emits rows for empty buckets (NULL aggregates). `start`/`finish` are normally **inferred from the WHERE clause**
(`time >= X AND time < Y`; "Must have upper bound for gapfill to work"). Must be a **top-level** expression (cannot be wrapped
in `round(...)` or cast; do it in an outer query). Since 2.28 bounds and `bucket_width` may come from **uncorrelated**
subqueries (works with LATERAL for per-group widths). Filter gapfilled rows in an outer CTE, **not with HAVING** (HAVING runs
before gapfilling). Cannot be used inside a continuous aggregate (use time_bucket in the cagg, gapfill when querying).
`timezone` arg since 2.9. 2.31.0 speeds it up by aggregating per chunk.
- **`locf(value [, prev] [, treat_null_as_missing])`** (since 1.1.1): carry last observation forward; `prev` is an expression
  returning a value used before the first bucket; `treat_null_as_missing => true` skips real NULLs. Aggregate goes *inside*:
  `locf(avg(value))`.
- **`interpolate(value [, prev] [, next])`** (since 1.1.1): linear interpolation; value types SMALLINT/INTEGER/BIGINT/REAL/
  DOUBLE PRECISION; `prev`/`next` return a `(time, value)` record to fill the range edges.

**Other built-in hyperfunctions (Apache):** `first(value, time)`, `last(value, time)` — ordered-selection aggregates.
In the rowstore they **do not use indexes** (sequential over the group); for "latest row" use `ORDER BY time DESC LIMIT 1`.
On the columnstore (2.28.0+) they can be answered from the `firstlast` sparse index without decompression.
`histogram(value, min, max, nbuckets)` returns an integer array of **nbuckets + 2** counts (underflow, buckets, overflow —
Neon sample shows 7 elements for 5 buckets). `approximate_row_count(relation)` from statistics.
Toolkit (also general): `days_in_month(timestamptz)`, `month_normalize(metric, timestamptz)`, `to_epoch(timestamptz)`.

### 2.5 Continuous aggregates (caggs)

**What:** an incrementally refreshed materialized view whose results are stored in a **materialization hypertable**
(`_timescaledb_internal._materialized_hypertable_<id>`). Created with standard matview syntax plus `timescaledb.continuous`:
```sql
CREATE MATERIALIZED VIEW conditions_hourly
WITH (timescaledb.continuous [, timescaledb.materialized_only = true]
      [, timescaledb.chunk_interval = '…'] [, timescaledb.create_group_indexes = true]) AS
SELECT time_bucket('1 hour', time) AS bucket, location,
       avg(temperature) AS avg_temp, max(temperature), min(temperature)
FROM conditions
GROUP BY bucket, location
[WITH [NO] DATA];       -- default WITH DATA = populate once at creation
```
Rules: `GROUP BY` must include a `time_bucket` on the hypertable's time partition column (constant width); all functions in
SELECT/GROUP BY/HAVING must be **immutable** (timezone-dependent functions are not allowed; use explicit `AT TIME ZONE 'EST'`);
one hypertable in FROM (joins allowed with ordinary tables, see below); no RLS on the hypertable; window functions only with
experimental `timescaledb.enable_cagg_window_functions = true` (must stay within the bucket); `DISTINCT` allowed inside aggregates,
not `SELECT DISTINCT ON`. Version matrix:
- ≤ 2.6: only parallelizable aggregates. 2.7: all aggregates, ORDER BY, ordered-set, hypothetical-set, DISTINCT/FILTER in aggs;
  new **finalized** format (old "partial" format deprecated 2.10, **removed 2.25** — upgrade to 2.25 is blocked if any old-format
  cagg exists; `cagg_migrate()` removed in 2.25).
- JOINs: 2.10–2.15 INNER JOIN with one PG table, single equality condition; **≥ 2.16** INNER/LEFT/LATERAL, many PG tables,
  any join conditions. Only hypertable changes are tracked (changes to the joined table are **not** reflected until a forced refresh).
- Hierarchical caggs (cagg on cagg) since **2.9.0**.

WITH options: `timescaledb.continuous` (required), `timescaledb.chunk_interval` (default **10x** the source hypertable's;
renamed from `chunk_time_interval` in 2.20, old name rejected), `timescaledb.create_group_indexes` (default TRUE, indexes
`(group_col, time_bucket)`), `timescaledb.materialized_only` (default **TRUE**).

**Real-time aggregates:** `materialized_only = false` → the view is a UNION of materialized buckets below the **watermark**
plus on-the-fly aggregation of raw rows newer than the watermark. **Default changed in 2.13: real-time is DISABLED by default**
(enabled by default before 2.13). Backfilled rows into already-materialized buckets are *not* reflected until the next refresh
("eventually consistent for historical data"). In a hierarchy, each level only sees the level immediately below; a
materialized-only level stops the recursion.
```sql
ALTER MATERIALIZED VIEW conditions_hourly SET (timescaledb.materialized_only = false);
```

**Refresh policy:**
```sql
SELECT add_continuous_aggregate_policy('conditions_hourly',
  start_offset      => INTERVAL '3 hours',   -- NULL = from MIN(time) ("open-ended")
  end_offset        => INTERVAL '1 hour',    -- NULL = to MAX(time) (not recommended)
  schedule_interval => INTERVAL '1 hour',    -- default 24 hours
  if_not_exists => false, initial_start => NULL, timezone => NULL,
  include_tiered_data => NULL,
  buckets_per_batch => 10,                   -- default 10 (since 2.25.0); 0 = one big transaction
  max_batches_per_execution => 0,            -- 0 = unlimited
  refresh_newest_first => true);             -- returns job_id
```
`start_offset` must be greater than `end_offset`. Only buckets fully inside the window are refreshed; a window ending in the current
bucket excludes it. Example latency math (docs): `schedule_interval` 1 h + `end_offset` 1 h → new data visible after up to 2 h
(unless real-time). Multiple **concurrent policies** allowed if their windows do not overlap (e.g. one for recent data, one with
`start_offset => NULL, end_offset => '1 day'` for backfill); concurrent policies on hierarchical caggs since 2.29.0.
Each batch (`bucket width × buckets_per_batch`) is its own transaction → data becomes visible progressively.

**Manual refresh:**
```sql
CALL refresh_continuous_aggregate('conditions_hourly', '2024-01-01', '2024-02-01'
  [, force => false] [, options => '{"buckets_per_batch": 5, "refresh_newest_first": true}'::jsonb]);
```
`window_start`/`window_end` may be timestamps, INTERVALs (relative to now) or integers; `NULL` = lowest/highest changed value.
Since 2.28.0 manual refresh is **incremental in batches of 10 buckets by default** (each batch a transaction); `{"buckets_per_batch": 0}`
gives the old single atomic pass. `force => true` recomputes every bucket even if unchanged (needed after `skip_cagg_invalidation`,
after changes to a JOINed table, or to backfill a newly ADDed column).

**Internals (about page):** four components — materialization hypertable, materialization engine, invalidation engine, query engine.
- Materialization runs **two transactions**: the first briefly blocks INSERT/UPDATE/DELETE, determines the range and moves the
  **invalidation threshold**; the second does the aggregation without blocking writers.
- Writes newer than the invalidation threshold need no logging (never materialized). Writes **older** than the threshold log, per
  transaction, the **min and max timestamp touched** into an invalidation log; at refresh, all whole buckets in [min,max] are
  recomputed. Hence: updating the 10:00 and 15:00 buckets in **one** transaction recomputes 10:00–15:00 (6 buckets); in **two**
  transactions only 2 buckets.
- 2.17.0+: `timescaledb.enable_merge_on_cagg_refresh = on` uses `MERGE` instead of delete+insert (less WAL; only for
  finalized caggs without columnstore; default off). 2.22 added WAL/logical-decoding-based invalidation (tech preview), removed 2.25.
  2.28.0: lighter lock while processing the invalidation log; `skip_cagg_invalidation` GUC for bulk loads. 2.31: granular
  refresh (`timescaledb.cagg_granular_refresh_*`), refresh statistics (`timescaledb.cagg_refresh_stats_level` = off|summary|verbose_log).

**ALTER MATERIALIZED VIEW** (cagg): `SET (timescaledb.materialized_only = …, timescaledb.enable_columnstore = true,
timescaledb.segmentby = 'symbol', timescaledb.orderby = …, timescaledb.compress_chunk_time_interval = …,
timescaledb.chunk_interval = …)`, `RENAME TO`, `RENAME COLUMN`, `SET SCHEMA`, `SET TABLESPACE`, `OWNER TO`, and (2.28.0+)
`ADD COLUMN max_temp double precision GENERATED ALWAYS AS (max(temperature)) STORED` (existing rows stay NULL until a forced refresh).
`continuous` and `create_group_indexes` can only be set at creation. 2.28.0: `ANALYZE`/`VACUUM` on a cagg redirect to the
materialization hypertable. Find it: `SELECT view_name, format('%I.%I', materialization_hypertable_schema, materialization_hypertable_name) FROM timescaledb_information.continuous_aggregates;`
`DROP MATERIALIZED VIEW` drops the cagg, its internal objects and its refresh policies; source data untouched.

**Hierarchical rules:** upper bucket ≥ lower bucket and an **integer multiple** of it (1 h → 6 h ok, → 90 min not);
fixed-width on top of variable-width (month/year) is not allowed (monthly on daily is allowed; monthly on weekly is not);
only on finalized caggs. Rolled-up averages are wrong (avg of avgs) — store sum+count, or use Toolkit two-step aggregates
(`percentile_agg` → `rollup()` → `mean()`; `stats_agg`).

**Experimental policy helpers** (`timescaledb_experimental`, early access 2.10.0): `add_policies(relation, if_not_exists,
refresh_start_offset, refresh_end_offset, compress_after, drop_after)` (schedule fixed at 1 hour), `alter_policies`,
`remove_policies`, `remove_all_policies`, `show_policies`; view `timescaledb_experimental.policies`.

**Query rewrites:** `timescaledb.enable_cagg_rewrites` (default false) can automatically route eligible queries to a cagg.

### 2.6 Compression / columnstore (Hypercore)

**Naming:** "native compression" (since TimescaleDB 1.5 era) was rebranded in **2.18.0** as **Hypercore**, the hybrid
row-columnar engine: **rowstore** (normal heap chunks; fast inserts/updates) + **columnstore** (compressed columnar chunks).
Compression and columnstore are the same mechanism; old function names are deprecated (table in §6). The separate
**Hypercore table access method (TAM)** experiment (2.18.0, `USING hypercore`) was deprecated in 2.21 and **removed in 2.22.0** —
do not confuse it with Hypercore the engine.

**Physical layout:** converting a chunk groups up to **1000 rows** per **batch**; each batch becomes **one row** of an internal
compressed table whose columns are compressed arrays; one batch per `segmentby` value set. Per-batch metadata (min/max of orderby
columns, optional bloom/minmax sparse indexes) lets scans skip batches without decompressing. Docs: "optimized for 1000 rows per
batch per segmentby value"; small chunks/high-cardinality segmentby → small batches → poor ratios.

**Settings:**
```sql
ALTER TABLE metrics SET (
  timescaledb.enable_columnstore,              -- old: timescaledb.compress
  timescaledb.segmentby = 'device_id',         -- old: timescaledb.compress_segmentby
  timescaledb.orderby   = 'time DESC',         -- old: timescaledb.compress_orderby
  timescaledb.sparse_index = 'bloom(uuid_col), minmax(value)', -- aliases: timescaledb.index / compress_index / compress_sparse_index
  timescaledb.compress_chunk_time_interval = '24 hours'        -- EXPERIMENTAL roll-up of adjacent chunks (irreversible); '0' disables
);
ALTER TABLE metrics RESET (timescaledb.segmentby);  -- back to auto defaults; '' disables a default
```
- Defaults are computed **per chunk** at chunk creation: segmentby chosen from `pg_stats` (cardinality/distribution) or existing
  indexes; orderby = time DESC; sparse indexes derived from existing indexes (`auto_sparse_indexes`, default on); bloom filters on by
  default for new chunks since 2.20 (chunks compressed with ≤ 2.19.3 must be recompressed to get them). 2.32.0 GUCs
  `compression_segmentby_default_function` / `compression_orderby_default_function` make defaults pluggable.
- Changing settings applies only to chunks **not yet** in the columnstore; chunks with different settings co-exist.
- Choose `segmentby` = the column you filter/group by most (e.g. device_id, symbol) with **low-to-moderate cardinality**;
  `orderby` = time (or `segmentby` columns' natural order). Docs demo: same query 29.2 ms → 1.8 ms after `orderby='time',
  segmentby='device_id'`.

**Policy & manual conversion:**
```sql
CALL add_columnstore_policy('crypto_ticks', after => INTERVAL '7d');              -- or created_before => INTERVAL '3 months' (not for caggs)
CALL add_columnstore_policy('table_with_bigint_time', BIGINT '600000');           -- integer time needs integer_now_func
CALL remove_columnstore_policy('crypto_ticks');
CALL convert_to_columnstore('_timescaledb_internal._hyper_1_2_chunk' [, if_not_columnstore => true] [, recompress => false]);
CALL convert_to_rowstore('_timescaledb_internal._hyper_1_2_chunk' [, if_columnstore => true]);
```
- `add_columnstore_policy(hypertable, after | created_before, if_not_exists, schedule_interval, initial_start, timezone)`:
  exactly one of `after`/`created_before`; default `schedule_interval` = **12 hours if chunk_interval ≥ 1 day, else
  chunk_interval / 2**; returns void (it is a procedure in current docs; older docs used `SELECT add_compression_policy`).
  Job `proc_name = 'policy_compression'`; config keys `compress_after`, `compress_created_before`, `maxchunks_to_compress`
  (default 0 = unlimited), `recompress_unordered` (default true, 2.29.0+). To change `after`/settings you must remove and re-add the
  policy (alter_job only changes schedule/config keys).
- The policy job is **single-threaded**; convert a backlog faster by calling `convert_to_columnstore` on different chunks from
  parallel sessions (each takes an exclusive lock on its chunk). Pause the policy (`alter_job(id, scheduled => false)`) while
  backfilling.
- For caggs: `ALTER MATERIALIZED VIEW … SET (timescaledb.enable_columnstore = true, timescaledb.segmentby = …)` then
  `add_columnstore_policy(cagg, after => …)`; the cagg must already have a refresh policy (one doc page; 2.27.2 removed the
  refresh-policy check — see §6). Refresh option `compress_after_refresh` (2.27.0+).
- `recompress => true` (2.24.0+) does in-memory recompression, falling back to decompress/compress.
- Other: `add_compaction_policy` (tech preview 2.29.0; default schedule 5 min, 1 min when created by direct compress;
  `max_chunks`, `max_batches`, `inactive_for`), `compact_chunk()`, `rebuild_columnstore` (2.25), `move_to_columnstore()`
  (2.31; compress rows without blocking DML), `rebuild_sparse_index()` (2.28).

**DML on compressed chunks:** INSERT, UPDATE, DELETE, UPSERT work directly; only the affected **batches** are decompressed
(rows go back to the rowstore part of the chunk, which is then a "partial" chunk recompressed by the policy). Bloom filters
skip batches for UPDATE/DELETE/UPSERT (`enable_dml_bloom_filter`). Safety valve:
`timescaledb.max_tuples_decompressed_per_dml_transaction` (default **100000**; 0 = unlimited) → `ERROR: tuple decompression
limit exceeded by operation`. Whole-batch deletes (`enable_compressed_direct_batch_delete`) avoid decompression. You do not need
`convert_to_rowstore` to modify data. Limits: RLS not supported on columnstore chunks; `ALTER COLUMN TYPE` blocked while compressed
chunks exist (2.24 allows it if none exist); triggers can be enabled/disabled on columnstore hypertables since 2.28.3.

**Direct compress (tech preview):** `SET timescaledb.enable_direct_compress_insert = on` (or `_copy`), or per table
`tsdb.direct_compress` (2.29.0). Batches compressed in memory during INSERT/COPY and written straight to the columnstore; needs
≥ 1000 rows per batch for good results (smaller batches fall back to normal inserts; ≥ 10 rows minimum); WAL records per
compressed batch; not with unique/exclusion constraints; picks segmentby automatically if none
(`enable_direct_compress_auto_segmentby`). Unsorted input hurts — follow with `convert_to_columnstore(chunk, recompress => true)`.

**Algorithms (about-compression page):** integers/dates/timestamps → since **2.32.0 the Adaptive Integer Compressor (AIC)**
(per-block cheapest of run-length, delta run-length, frame-of-reference, delta frame-of-reference, dictionary, patched FOR;
GUC `timescaledb.enable_aic_compression`, default on in 2.32; existing data keeps its encoding until rewritten); before 2.32:
delta + **delta-of-delta** + **simple-8b** + **run-length** (Simple-8b RLE variant, reverse-decodable). Floats (few repeats) →
**XOR-based (Gorilla)**. Other types → **dictionary** (falls back to no dictionary when not beneficial), indices then Simple-8b RLE.
JSONB → TimescaleDB dictionary, else PostgreSQL TOAST (pglz default; `default_toast_compression = lz4` if built with lz4).
Also bool (`enable_bool_compression`), null (`enable_null_compression`), UUIDv7 (2.22; default on 2.23 — "at least 30%" storage, ~2x
queries). Delta-of-delta on regular timestamps stores zeros: 64-bit timestamp → ~1 bit ("64x").

**Ratios (official):** "90%+ compression typical" (README); "up to 98%" (hypercore pages); demo: 194 MB → 24 MB
(`hypertable_columnstore_stats`). freeCodeCamp (secondary): "over 90%".

**Stats/settings:** `hypertable_columnstore_stats(hypertable)`, `chunk_columnstore_stats(hypertable)` (columns
`chunk_schema, chunk_name, compression_status, before_/after_compression_{table,index,toast,total}_bytes, node_name`(deprecated)),
views `timescaledb_information.hypertable_columnstore_settings` (`hypertable, segmentby, orderby, compress_interval_length, index`)
and `timescaledb_information.chunk_columnstore_settings` (`hypertable, chunk, segmentby, orderby, index`).

**Query-side features on columnstore:** vectorized (SIMD) filters/aggregation (`enable_vectorized_aggregation`), `ColumnarScan`,
`ColumnarIndexScan` (answers COUNT/MIN/MAX/FIRST/LAST from sparse indexes, up to 70x), batch sorted merge, SkipScan on compressed
chunks (`enable_compressed_skipscan`), chunkwise aggregation (`enable_chunkwise_aggregation`).

### 2.7 Data retention

Drop whole chunks rather than DELETE rows (no bloat, no VACUUM; "deletes an entire file from disk").
```sql
SELECT add_retention_policy('conditions', drop_after => INTERVAL '6 months');          -- returns job_id
SELECT add_retention_policy('conditions', drop_after => BIGINT '600000');             -- integer time (needs integer_now_func)
SELECT add_retention_policy('conditions', drop_created_before => INTERVAL '6 months'); -- by chunk creation time (not for caggs)
SELECT remove_retention_policy('conditions' [, if_exists => false]);
```
Signature: `add_retention_policy(relation, drop_after, if_not_exists, schedule_interval, initial_start, timezone, drop_created_before)`;
exactly one of `drop_after`/`drop_created_before`; **only one retention policy per hypertable**; works on hypertables and caggs;
`proc_name = 'policy_retention'`. Only chunks whose **entire** range is older than the cutoff are dropped (3 chunks: >36 h, 12–36 h,
<12 h; dropping "older than 24 h" removes only the first).

**Retention + caggs (critical):** a refresh that covers a time range whose raw data was dropped **deletes the aggregates** for those
buckets. Keep the retention interval longer than the refresh window's `start_offset` (docs example: refresh `'7 days','1 day'`,
retention 30 days — not 24 h). A cagg can have its own (longer) retention, e.g. raw 30 days, daily cagg 600 days. A refresh policy
with `start_offset => NULL` mirrors deletes into the cagg on purpose.

Self-hosted "tiering": `move_chunk` to cheaper tablespaces via a custom job. Tiger Cloud: `add_tiering_policy('conditions', INTERVAL '6 months')`
moves chunks to S3/Azure Blob as Parquet (`tier_chunk`, `untier_chunk`, `timescaledb.enable_tiered_reads`).

### 2.8 Jobs framework (background scheduler)

All policies are jobs run by TimescaleDB's background-worker scheduler (one scheduler per database plus workers;
`timescaledb.max_background_workers`, default 16, should be ≥ 1 + number of databases with the extension + concurrent jobs;
`max_worker_processes` ≥ background workers + parallel workers). Since 2.32.0 the scheduler runs as the **database owner**,
and database owners can start/stop/restart workers without superuser.

```sql
CREATE OR REPLACE PROCEDURE user_defined_action(job_id int, config jsonb) LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE 'Executing action % with config %', job_id, config; END $$;

SELECT add_job(proc => 'user_defined_action', schedule_interval => '1h',
               config => '{"threshold":100}', initial_start => NULL, scheduled => true,
               check_config => NULL, fixed_schedule => true, timezone => NULL, job_name => NULL);  -- returns job_id
SELECT alter_job(1000, schedule_interval => INTERVAL '2 hours');
SELECT alter_job(job_id, config_merge => '{"drop_after": "2 years"}')            -- 2.29.0+
  FROM timescaledb_information.jobs WHERE proc_name='policy_retention' AND hypertable_name='conditions';
SELECT alter_job(1000, next_start => 'infinity');   -- pause; next_start => now() resumes
CALL run_job(1000);                                 -- run in foreground (use SET client_min_messages TO DEBUG1)
SELECT delete_job(1000);                            -- terminates it if running
```
- `add_job`: `proc` (REGPROC, function or procedure with `(job_id int, config jsonb)`), `schedule_interval` (default 24 h),
  `fixed_schedule` (add_job default **true**: next start = last *start* + interval, aligned on `initial_start`; false: last *finish*
  + interval), `check_config` must be a function (not procedure) that raises on bad config.
- `alter_job` extra args: `max_runtime`, `max_retries`, `retry_period`, `config`, `config_merge` (2.29.0; cannot combine with
  `config`), `next_start`, `if_exists`, `check_config`, `fixed_schedule` (alter_job doc says default false), `initial_start`,
  `timezone`, `job_name`. Passing `config` replaces the whole object (policies need `hypertable_id`, else
  `ERROR: could not find hypertable_id in config for job`).
- Failure backoff: `next_start = finish_time + consecutive_failures * retry_period ± 13% jitter`, capped at 5 × schedule_interval,
  failures counted up to 20; after a crash at least 5 minutes. While running, `next_start` is set to `infinity`.
- Built-in policy procs: `policy_refresh_continuous_aggregate`, `policy_compression` (columnstore), `policy_retention`,
  `policy_reorder`, `policy_compaction` (2.29).
- Jobs are TSL/Community features (Apache edition lacks `add_job` etc.).

### 2.9 Hyperfunctions toolkit

Two layers: (1) built into `timescaledb` (time_bucket, time_bucket_gapfill/locf/interpolate (TSL), first, last, histogram,
approximate_row_count); (2) **TimescaleDB Toolkit** extension (`CREATE EXTENSION timescaledb_toolkit;`, Rust/pgrx, 1.27.0).
Toolkit design = **two-step aggregation**: an aggregate builds a partial-state "sketch" (storable in a cagg), accessors extract
values, `rollup()` merges sketches — which is what makes percentiles/stats correct across hierarchical caggs. Families (full
list in §3.6): approximate count distinct (`hyperloglog`, `approx_count_distinct`), counters & gauges (`counter_agg` handles
counter resets, `gauge_agg` stable since 1.25.0), downsampling (`lttb`, `asap_smooth`, `gp_lttb`), financial (`candlestick_agg`),
frequency (`freq_agg`, `count_min_sketch` experimental, `mcv_agg`), min/max N (`max_n`, `min_n`, `max_n_by`, `min_n_by`),
percentiles (`percentile_agg`, `uddsketch`, `tdigest`), saturating math, state tracking (`state_agg`, `compact_state_agg`
experimental, `heartbeat_agg`), statistics/regression (`stats_agg` 1-D and 2-D), time-weighted (`time_weight`), timevector and
experimental **function pipelines** (`timevector(ts, val) -> sort() -> delta() -> abs() -> sum()`). Upgrading drops objects
depending on experimental Toolkit functions.

### 2.10 Multi-node (deprecated, removed)

Distributed hypertables across access/data nodes (first released 2020, worked on since 2018). **Deprecated in 2.13
(2023-11-28), which is the last version with multi-node (PG 13, 14, 15 only); removed in 2.14.0 (2024-02-08)** (#6410
"Remove multinode public API"). Rationale (P5): ~1% of deployments used it; maintenance burden; single-node scaled to
2M inserts/s; cloud object storage tiering instead. Leftovers: `node_name` columns in size/stats functions are marked DEPRECATED.
Migration doc: `docs.timescale.com/migrate/latest/multi-node-to-timescale-service/`. For horizontal sharding of PostgreSQL today
point learners to Citus (separate topic).

### 2.11 Neon-specific notes

- Neon supports `timescaledb` with **"Only Apache-2 licensed features are supported. Compression is not supported."**
- Versions on Neon (pg-extensions page, updated 2026-11-04): **PG14 2.10.1, PG15 2.10.1, PG16 2.13.0, PG17 2.17.1, PG18 2.24.0.**
- `timescaledb` is in Neon's default `shared_preload_libraries` (`neon,pg_stat_statements,timescaledb,pg_cron,pg_partman_bgw,…`),
  so `CREATE EXTENSION IF NOT EXISTS timescaledb;` just works.
- Therefore on Neon you get: hypertables (`create_hypertable`; on PG18/2.24 also `CREATE TABLE … WITH (tsdb.hypertable)` —
  since 2.22.0 #8422 Apache edition no longer requires `columnstore=false`), `show_chunks`, `drop_chunks`, `chunks_detailed_size`,
  `add_dimension`, `set_chunk_time_interval`, `time_bucket`, `first`, `last`, `histogram`, `approximate_row_count`, information views.
  You do **not** get: columnstore/compression, continuous aggregates, retention policies, `add_job`, `time_bucket_gapfill`/`locf`/
  `interpolate`, SkipScan, `reorder_chunk`/`move_chunk`, Toolkit.
- Neon's guide schedules retention with an external **cron** (`0 1 * * * psql -c "SELECT drop_chunks(...)"`); `pg_cron` is also
  preloaded on Neon and is the natural in-database alternative. **Scale to Zero** may stop the compute so scheduled jobs don't run —
  start the compute first.
- Neon example outputs: `create_hypertable` returns `(3,public,weather_conditions,t)`; `histogram(humidity, 40, 60, 5)` returns 7 counts;
  sample dataset `weather_small` (1,000,000 rows via `\COPY`).
- Minor error in Neon page: its `drop_chunks` examples use a table `temperature_data` that the guide never creates (the guide's table is
  `weather_conditions`).

---

## 3. Complete inventories

### 3.1 Hypertable & chunk functions (reference "Hypertables and chunks")

| Function | Signature / key args | Meaning | Edition |
|---|---|---|---|
| `CREATE TABLE … WITH (tsdb.…)` | options in §2.3 | Create hypertable (2.20+) | Apache (columnstore part TSL) |
| `create_hypertable` | `(relation regclass, dimension dimension_info, create_default_indexes bool=true, if_not_exists bool=false, migrate_data bool=false) → (hypertable_id int, created bool)` | Convert table | Apache |
| `create_hypertable` (old interface) | `(relation, time_column_name, partitioning_column, number_partitions, chunk_time_interval, …)` | pre-2.13 form | Apache |
| `by_range` | `(column_name name, partition_interval anyelement, partition_func regproc)` | range dimension builder | Apache |
| `by_hash` | `(column_name name, number_partitions, partition_func regproc)` | hash dimension builder | Apache |
| `add_dimension` | `(hypertable regclass, dimension dimension_info, if_not_exists bool=false) → (dimension_id, created)` | add dimension (existing chunks keep a −inf/+inf slice; see §2) | Apache |
| `set_chunk_time_interval` | `(hypertable, chunk_time_interval, dimension_name name=NULL) → void` | new chunks only | Apache |
| `set_integer_now_func` | `(hypertable, integer_now_func regproc, replace_if_exists bool=false) → void` | "now" for integer time | Apache |
| `show_chunks` | `(relation, older_than, newer_than, created_before, created_after) → setof regclass` | list chunks | Apache |
| `drop_chunks` | `(relation, older_than, newer_than, verbose bool=false, created_before, created_after) → setof text` | drop chunks | Apache |
| `drop_chunk` | `(chunk)` | drop one chunk | — |
| `create_chunk` | manual chunk with given dimensional constraints | | — |
| `attach_chunk` / `detach_chunk` | attach a table as chunk / detach | | — |
| `merge_chunks` / `merge_chunks_concurrently` | merge chunks (concurrently = without blocking reads) | | — |
| `split_chunk` | split a chunk | | TSL |
| `move_chunk` | move chunk (and indexes) to another tablespace | | TSL |
| `reorder_chunk` / `add_reorder_policy` / `remove_reorder_policy` | CLUSTER-like reorder by index | | TSL |
| `chunk_rewrite_cleanup` | clean up aborted chunk rewrite | | — |
| `enable_chunk_skipping` / `disable_chunk_skipping` | `(hypertable, column_name, if_not_exists=false) → (column_stats_id, enabled)` | min/max range tracking | (tech preview) |
| `attach_tablespace`, `detach_tablespace`, `detach_tablespaces`, `show_tablespaces` | tablespaces for chunks | | Apache |
| `hypertable_size`, `hypertable_detailed_size`, `hypertable_index_size`, `hypertable_approximate_size`, `hypertable_approximate_detailed_size`, `chunks_detailed_size` | sizes (`chunks_detailed_size` columns: chunk_schema, chunk_name, table_bytes, index_bytes, toast_bytes, total_bytes, node_name) | | Apache |
| `CREATE INDEX … WITH (timescaledb.transaction_per_chunk)` | per-chunk index builds | | Apache |
| UUIDv7 helpers | `generate_uuidv7()` (pre-PG18), uuid_timestamp etc. ("UUIDv7 functions" page) | | — |

### 3.2 Hyperfunctions in core timescaledb

| Function | Signature | Notes |
|---|---|---|
| `time_bucket` | `(bucket_width interval, ts date/timestamp/timestamptz/uuid [, "offset" interval] [, origin] [, timezone text])`; integer form `(bucket_width int, ts int [, "offset" int])` | returns bucket start; default origins 2000-01-03 / 2000-01-01 / 0 |
| `time_bucket_gapfill` | `(bucket_width, ts [, timezone] [, start] [, finish])` | TSL; top-level only |
| `locf` | `(value anyelement [, prev expr] [, treat_null_as_missing bool])` | TSL |
| `interpolate` | `(value numeric-ish [, prev (time,value)] [, next (time,value)])` | TSL |
| `first` / `last` | `(value anyelement, time "any")` | aggregates |
| `histogram` | `(value, min, max, nbuckets)` → int[] of nbuckets+2 | aggregate |
| `approximate_row_count` | `(relation regclass)` | from stats |
| `days_in_month`, `month_normalize`, `to_epoch` | Toolkit utilities | |
| `time_bucket_ng` | removed in 2.25.0 | still listed on one overview page (see §6) |

### 3.3 Continuous aggregate API

`CREATE MATERIALIZED VIEW … WITH (timescaledb.continuous, timescaledb.chunk_interval, timescaledb.create_group_indexes,
timescaledb.materialized_only)`; `ALTER MATERIALIZED VIEW … SET (timescaledb.materialized_only, enable_columnstore, orderby,
segmentby, compress_chunk_time_interval, chunk_interval)` / RENAME / SET SCHEMA / SET TABLESPACE / OWNER TO / ADD COLUMN … GENERATED;
`DROP MATERIALIZED VIEW [IF EXISTS]`; `add_continuous_aggregate_policy(continuous_aggregate, start_offset, end_offset,
schedule_interval, if_not_exists, initial_start, timezone, include_tiered_data, buckets_per_batch, max_batches_per_execution,
refresh_newest_first) → job_id`; `remove_continuous_aggregate_policy(continuous_aggregate [, if_exists])`;
`refresh_continuous_aggregate(continuous_aggregate, window_start, window_end [, force] [, options jsonb])` (CALL);
`timescaledb_experimental.add_policies / alter_policies / remove_policies / remove_all_policies / show_policies`;
`cagg_migrate(cagg, override, drop_old)` (sunset 2.25). Refresh-policy config keys include `compress_after_refresh` (2.27+).

### 3.4 Hypercore (columnstore) API

`ALTER TABLE … SET (timescaledb.enable_columnstore, orderby, segmentby, sparse_index, compress_chunk_time_interval, direct_compress,
direct_compress_schedule_interval)`; `add_columnstore_policy(hypertable, after | created_before, if_not_exists, schedule_interval,
initial_start, timezone)`; `remove_columnstore_policy(hypertable [, if_exists])`; `add_compaction_policy(hypertable, if_not_exists,
schedule_interval='5 minutes', initial_start, timezone, max_chunks, max_batches, inactive_for) → job_id`; `remove_compaction_policy`;
`convert_to_columnstore(chunk, if_not_columnstore=true, recompress=false)`; `convert_to_rowstore(chunk, if_columnstore=true)`;
`chunk_columnstore_stats(hypertable)`; `hypertable_columnstore_stats(hypertable)`; views
`timescaledb_information.chunk_columnstore_settings`, `timescaledb_information.hypertable_columnstore_settings`;
`compact_chunk(chunk [, max_batches])`, `rebuild_columnstore`, `move_to_columnstore()`, `rebuild_sparse_index()`,
`_timescaledb_functions.estimate_uncompressed_size()` (samplerate arg 2.29), `_timescaledb_functions.decompress_batch()` (2.29).

### 3.5 Retention, jobs, information views

- Retention: `add_retention_policy(relation, drop_after, if_not_exists, schedule_interval, initial_start, timezone, drop_created_before) → job_id`;
  `remove_retention_policy(relation, if_exists)`.
- Jobs: `add_job(proc, schedule_interval, config, initial_start, scheduled, check_config, fixed_schedule, timezone, job_name) → job_id`;
  `alter_job(job_id, schedule_interval, max_runtime, max_retries, retry_period, scheduled, config, config_merge, next_start, if_exists,
  check_config, fixed_schedule, initial_start, timezone, job_name)` → record (job_id, schedule_interval, max_runtime, max_retries,
  retry_period, scheduled, config, next_start, check_config, fixed_schedule, initial_start, timezone, application_name);
  `delete_job(job_id)`; `run_job(job_id)` (procedure, use CALL).
- `timescaledb_information` views (stable public API — use these, not `_timescaledb_catalog`/`_timescaledb_internal`):
  - `hypertables`: hypertable_schema, hypertable_name, owner, num_dimensions, num_chunks, compression_enabled, tablespaces, primary_dimension, primary_dimension_type
  - `chunks`: hypertable_schema, hypertable_name, chunk_schema, chunk_name, primary_dimension, primary_dimension_type, range_start, range_end, range_start_integer, range_end_integer, is_compressed, chunk_tablespace, chunk_creation_time
  - `dimensions`: hypertable_schema, hypertable_name, dimension_number, column_name, column_type, dimension_type (Time/Space), time_interval, integer_interval, integer_now_func, num_partitions
  - `continuous_aggregates`: hypertable_schema, hypertable_name, view_schema, view_name, view_owner, materialized_only, compression_enabled, materialization_hypertable_schema, materialization_hypertable_name, view_definition
  - `jobs`: job_id, application_name, schedule_interval, max_runtime, max_retries, retry_period, proc_schema, proc_name, owner, scheduled, fixed_schedule, config, next_start, initial_start, hypertable_schema, hypertable_name, check_schema, check_name
  - `job_stats`: hypertable_schema, hypertable_name, job_id, last_run_started_at, last_successful_finish, last_run_status, job_status ('Running','Scheduled','Paused'), last_run_duration, next_start, total_runs, total_successes, total_failures
  - `job_errors` (2.12.0): job_id, proc_schema, proc_name, pid, start_time, finish_time, sqlerrcode, err_message
  - `job_history` (2.12.0): id, job_id, succeeded, proc_schema, proc_name, pid, start_time, finish_time, config, sqlerrcode, err_message (needs `timescaledb.enable_job_execution_logging` for success rows; default off)
  - `hypertable_columnstore_settings`, `chunk_columnstore_settings` (2.18.0; replace `*_compression_settings`; `compression_settings` view to be removed)
  - `timescaledb_experimental.policies`: relation_name, relation_schema, schedule_interval, proc_schema, proc_name, config, hypertable_schema, hypertable_name
- Catalog notes: `_timescaledb_catalog.chunk_constraint` dropped in 2.28.0 (temporary compat view); `bgw_job` moved to
  `_timescaledb_catalog` in 2.25; `_timescaledb_debug` schema removed 2.25.

### 3.6 Toolkit functions (by family; all need timescaledb_toolkit on self-hosted; "exp" = experimental)

- Approx count distinct: `hyperloglog()`, `approx_count_distinct()`, accessors `distinct_count()`, `stderror()`, `rollup()`.
- Counters: `counter_agg()`; accessors `corr, counter_zero_time, delta, extrapolated_delta, extrapolated_rate, first_time, first_val,
  idelta_left, idelta_right, intercept, interpolated_delta, interpolated_rate, irate_left, irate_right, last_time, last_val,
  num_changes, num_elements, num_resets, rate, slope, time_delta`; `rollup`; mutator `with_bounds`. Gauges: `gauge_agg()` (stable since 1.25.0) same
  accessors minus resets, plus `gauge_zero_time`.
- Downsampling: `asap_smooth()`, `lttb()`, `gp_lttb()` (exp).
- Financial: `candlestick_agg()`, `candlestick()`, accessors `open, open_time, high, high_time, low, low_time, close, close_time,
  volume, vwap`, `rollup`.
- Frequency: `count_min_sketch()` + `approx_count()` (exp); `freq_agg()` (exp) + `into_values, max_frequency, min_frequency, topn`,
  `mcv_agg()`, `rollup`.
- Min/max: `max_n`, `min_n` (+ `into_values`, `into_array`, `rollup`), `max_n_by`, `min_n_by` (+ `into_values`, `rollup`).
- Percentiles: `tdigest()`; `percentile_agg()` / `uddsketch()`; accessors `approx_percentile, approx_percentile_array (uddsketch),
  approx_percentile_rank, error (uddsketch), max_val/min_val (tdigest), mean, num_vals, total`, `rollup`.
- Saturating math: `saturating_add, saturating_add_pos, saturating_mul, saturating_sub, saturating_sub_pos`.
- State: `compact_state_agg()` (exp), `state_agg()` (+ `duration_in, interpolated_duration_in, interpolated_state_periods,
  interpolated_state_timeline, into_values, state_at, state_periods, state_timeline, rollup`), `heartbeat_agg()` (+ `dead_ranges,
  downtime, interpolate, interpolated_downtime, interpolated_uptime, live_ranges, num_gaps, live_at, num_live_ranges, trim_to, uptime, rollup`).
- Statistics: `stats_agg()` one-variable (`average, num_vals, kurtosis, skewness, stddev, sum, variance, rolling, rollup`) and
  two-variable (`average_y/x, corr, covariance, determination_coeff, intercept, kurtosis_y/x, num_vals, skewness_y/x, slope,
  stddev_y/x, sum_y/x, variance_y/x, x_intercept, rolling, rollup`).
- Time-weighted: `time_weight()` + `average, first_time, first_val, integral, interpolated_average, interpolated_integral, last_time,
  last_val, rollup`.
- Timevector / function pipelines (exp).

### 3.7 GUCs (namespace `timescaledb.`; version stamp 2.32.0; defaults as documented)

Core/admin: `license` (timescale|apache), `max_background_workers` (16), `restoring` (false; required for logical dump restore —
see `timescaledb_pre_restore()`/`timescaledb_post_restore()`), `telemetry_level` (basic|off), `bgw_log_level` (WARNING),
`disable_load`, `last_tuned`, `last_tuned_version`, `default_chunk_time_interval` (NULL), `max_cached_chunks_per_hypertable` (1024),
`max_open_chunks_per_insert` (1024), `enable_deprecation_warnings` (true), `enable_event_triggers` (false),
`enable_chunk_auto_publication` (false), `enable_foreign_key_propagation` (true), `enable_job_execution_logging` (false), `stats_max_chunks`.

Planner/executor: `enable_optimizations` (true), `enable_chunk_append` (true), `enable_parallel_chunk_append` (true),
`enable_ordered_append` (true), `enable_runtime_exclusion` (true), `enable_constraint_aware_append` (true),
`enable_constraint_exclusion` (true), `enable_deferred_chunk_append` (true), `enable_now_constify` (true),
`enable_qual_propagation` (true), `enable_qual_filtering` (true), `enable_chunkwise_aggregation` (true),
`enable_hypertable_expansion_for_dml` (true), `enable_skipscan` (true), `enable_skipscan_for_distinct_aggregates` (true),
`enable_multikey_skipscan` (true), `skip_scan_run_cost_multiplier` (1.0), `enable_chunk_skipping` (false),
`enable_partitioned_hypertables` (false, experimental).

Columnstore: `enable_vectorized_aggregation` (true), `enable_bulk_decompression` (true), `enable_columnarindexscan` (true),
`enable_columnarscan_metadata_only` (true), `debug_enable_columnarscan` (renamed from `enable_columnarscan` in 2.31),
`enable_columnar_scan_filter_pushdown` (true), `enable_decompression_sorted_merge` (true), `enable_compressed_skipscan` (true),
`enable_sparse_index_bloom` (true), `enable_composite_bloom_indexes` (true), `auto_sparse_indexes` (true),
`enable_aic_compression` (true in 2.32), `enable_bool_compression`, `enable_null_compression`, `enable_uuid_compression` (all true),
`compression_batch_size_limit`, `compression_segmentby_default_function`, `compression_orderby_default_function`,
`compress_truncate_behaviour` (truncate_only), `enable_delete_after_compression` (false), `enable_compression_indexscan` (false),
`enable_compression_ratio_warnings` (true), `enable_compression_wal_markers` (true), `enable_compressor_batch_limit` (false),
`enable_in_memory_recompression` (true), `enable_segmentwise_recompression` (true), `enable_exclusive_locking_recompression` (false),
`enable_dml_decompression` (true), `enable_dml_decompression_tuple_filtering` (true), `enable_dml_bloom_filter` (true),
`enable_compressed_direct_batch_delete` (true), `max_tuples_decompressed_per_dml_transaction` (100000),
`enable_direct_compress_insert` / `_copy` (false), `enable_direct_compress_*_client_sorted` (false),
`enable_direct_compress_*_sort_batches` (true), `enable_direct_compress_auto_segmentby` (true),
`direct_compress_insert_tuple_sort_limit` (30000), `direct_compress_copy_tuple_sort_limit` (100000),
`direct_compress_segmentby_batch_size_limit` (500), `direct_compress_segmentby_min_rows` (5000),
`move_to_columnstore_tuple_sort_limit` (0), `use_custom_toaster` (false), `enable_rowlevel_compression_locking` (false),
`read_legacy_bloom1_v1` (false).

Caggs: `enable_merge_on_cagg_refresh` (false), `enable_direct_compress_on_cagg_refresh` (false), `enable_cagg_rewrites` (false),
`enable_cagg_reorder_groupby` (true), `enable_cagg_sort_pushdown` (true), `enable_cagg_watermark_constify` (true),
`enable_cagg_window_functions` (false), `cagg_refresh_stats_level` (off), `skip_cagg_invalidation` (false), `cagg_rewrites_debug_info`.

Tiered (Cloud): `enable_tiered_reads` (true).

---

## 4. Beginner → advanced path (with worked examples)

Each step pairs the TimescaleDB SQL (shown, not runnable in the playground) with the runnable native analogue (§8 has the tested SQL).

1. **Why time-series is different** — append-mostly, time-filtered queries, aging data. Worked example: generate a week of
   per-minute readings with `generate_series` (§8 snippet 10) and show a plain-table `WHERE time > …` plan.
2. **Bucketing time** — `time_bucket('15 minutes', time)` ≡ `date_bin('15 minutes', time, TIMESTAMPTZ '2000-01-03')`;
   months need `date_trunc('month', …)`; show the April-24-2020 → April-13 two-week example (§8 snippets 01–08).
3. **Hypertables = automatic partitioning** — `CREATE TABLE … WITH (tsdb.hypertable, tsdb.chunk_interval='1 day')`. Native:
   `PARTITION BY RANGE (time)` + a helper that creates daily partitions; show that PG does **not** auto-create partitions
   (`no partition of relation … found for row`) — TimescaleDB's main ergonomic win (snippets 10, 17).
4. **Chunk exclusion** — `EXPLAIN` showing only one partition scanned; generic plan showing `Subplans Removed: 5` (runtime
   pruning, like ChunkAppend); `enable_partition_pruning = off` shows all (snippets 13–16).
5. **Chunk catalog** — `show_chunks` / `timescaledb_information.chunks` ≡ `pg_inherits` + `pg_get_expr(relpartbound)` /
   `pg_partition_tree` (snippets 11, 12, 109).
6. **Retention** — `drop_chunks('conditions', INTERVAL '3 months')` / `add_retention_policy` ≡ `DETACH PARTITION` + `DROP TABLE`
   loop (snippet 26); contrast with `DELETE` + VACUUM.
7. **Indexes & last point** — default `(time DESC)` index; `DISTINCT ON (device_id) … ORDER BY device_id, time DESC`; `first/last`
   ≡ `(array_agg(v ORDER BY time DESC))[1]` (snippets 21, 22, 101). Mention SkipScan (TSL) vs PG's Merge Append over all partitions.
8. **BRIN for append-only time columns** — 24 kB BRIN vs 4.4 MB B-tree on 200k rows; lossy bitmap heap scan (snippets 60–63).
9. **Gapfilling** — `time_bucket_gapfill` + `locf` + `interpolate` ≡ `generate_series` LEFT JOIN + window tricks (snippets 32–36).
   Note PG18 has no `IGNORE NULLS` (verified syntax error).
10. **Rollups: materialized views** — `CREATE MATERIALIZED VIEW … WITH NO DATA`, refresh, `CONCURRENTLY` needs a unique index,
    staleness after insert (snippets 40–45).
11. **Continuous aggregates** — incremental refresh with an invalidation log (statement trigger with transition table logs
    min/max time), watermark, real-time UNION view, backfill invalidation, `refresh(window)` (snippets 50–54).
12. **Hierarchical caggs & correct rollups** — daily from hourly using sum/count (snippet 55) vs avg-of-avgs; Toolkit `rollup()`.
13. **Columnstore** — conceptual: arrays per (segmentby, ≤1000-row batch) with min/max metadata; ~7x smaller even without codecs
    (snippet 70: 1568 kB → 216 kB); batch skipping (snippet 71); delta-of-delta of regular timestamps = 0 (snippet 72).
14. **Jobs & policies** — `add_job` signature `(job_id int, config jsonb)` ≡ a procedure you `CALL` (snippet 90); in production use
    pg_cron (Neon) or TimescaleDB's scheduler.
15. **Advanced** — space partitioning ≡ sub-partition `BY HASH` (snippets 80–81), DEFAULT partition catch-all (82), attach a
    pre-loaded table (107), MERGE-based refresh (106), DST-aware buckets (104–105), editions/licensing, Neon limits, multi-node history.

---

## 5. Production patterns (numbers from primary sources)

- **Chunk interval**: default 7 days; size so active chunks' indexes fit in ~25% of memory (64 GB host: 2 GB/day index → 7 d; 10 GB/day → 1 d).
  Watch for >1,000 chunks per hypertable. Chunk creation takes a heavier lock than a plain insert; concurrent creators block each other.
- **`max_locks_per_transaction`**: queries lock every chunk touched (≈ chunks, or 2× with indexes); docs: set to about
  `2 × max chunks per hypertable / max_connections`; requires restart. Symptom `out of shared memory … increase max_locks_per_transaction`.
- **Background workers**: `timescaledb.max_background_workers` default 16 (≥ 1 + #databases + concurrent jobs); `max_worker_processes` ≥
  that + `max_parallel_workers`. Tune with `timescaledb-tune`.
- **Columnstore**: segmentby on the most-filtered, low-cardinality column; orderby time; 1000-row batches; policy `after` ≈ chunk
  interval (default); limit backlog conversion with `maxchunks_to_compress` (e.g. 10) to avoid OOM; parallel manual conversion;
  `temp_file_limit`/`maintenance_work_mem` for big chunks. Expect 90–98% reduction (demo 194 MB → 24 MB).
- **DML on columnstore**: fine for occasional updates/backfill; large updates hit `max_tuples_decompressed_per_dml_transaction` (100k).
  For big backfills: pause policy → backfill → `convert_to_columnstore` → resume.
- **Caggs**: exclude the hot bucket (`end_offset` ≥ 1 bucket); real-time on only if you need fresh data (off by default since 2.13);
  `buckets_per_batch` default 10 keeps transactions/WAL small; avoid touching wide time ranges in a single transaction (invalidation
  range = min..max per transaction); keep retention longer than refresh `start_offset`; use concurrent policies for backfill windows.
- **Retention**: `drop_chunks`/policy instead of DELETE; retention on caggs separately for long-term downsampled history.
- **Ingest**: multi-row INSERT / COPY (binary fastest); TimescaleDB batches rows by chunk; direct compress (tech preview) for ≥1000-row
  sorted batches.
- **Upgrades**: connect with `psql -X` when running `ALTER EXTENSION timescaledb UPDATE` (prevents `.psqlrc` loading the old version);
  since 2.29.0 it can run inside a transaction block. Experimental-schema objects are dropped on upgrade. Old-format caggs block 2.25+;
  Hypercore TAM blocks 2.22+. Logical dump/restore needs `timescaledb_pre_restore()` / `timescaledb_post_restore()` (`timescaledb.restoring`).
- **pgaudit**: since 2.31.0 put `pgaudit` **after** `timescaledb` in `shared_preload_libraries`.

---

## 6. Pitfalls (symptom / cause / fix)

| Symptom | Cause | Fix |
|---|---|---|
| `cannot create a unique index without the column "time" (used in partitioning)` (PG equivalent: `unique constraint on partitioned table must include all partitioning columns`, verified) | uniqueness enforced per chunk/partition | include the time column in every PK/UNIQUE |
| `partition column could not be determined` | `CREATE TABLE … WITH (tsdb.hypertable)` but no timestamp column, or >1 candidate (2.23+) | set `tsdb.partition_column` |
| `functionality not supported under the current "apache" license` | TSL feature on Apache edition (e.g. Neon) | Community edition / Tiger Cloud, or native alternative |
| Old data still present after `drop_chunks(…, INTERVAL '30 days')` | chunk dropped only if its whole range is older | expected; choose smaller chunks or accept granularity |
| Cagg suddenly lost history | retention dropped raw chunks inside the refresh window → refresh deleted aggregates | retention interval > refresh `start_offset`; separate cagg retention |
| Cagg shows nothing for the last hour | `end_offset` excludes hot bucket; real-time off by default (2.13+) | `materialized_only = false` or shorter `end_offset` |
| Backfilled rows not in cagg (even real-time) | real-time only covers data newer than watermark | wait for policy or `refresh_continuous_aggregate` |
| Refresh recomputes huge ranges | one transaction modified rows far apart (min..max invalidation) | split backfills by bucket/transaction |
| Changes to a joined dimension table not reflected | only hypertable changes are tracked | `refresh_continuous_aggregate(…, force => true)` |
| `ERROR: tuple decompression limit exceeded by operation` | big UPDATE/DELETE/UPSERT on columnstore | raise/disable `max_tuples_decompressed_per_dml_transaction`, or convert_to_rowstore first |
| Poor compression ratio | high-cardinality `segmentby`, tiny chunks, unsorted direct-compress input | lower-cardinality segmentby, larger chunks, recompress |
| OOM after enabling columnstore on big table | policy converts whole backlog | `alter_job(… config || '{"maxchunks_to_compress": 10}')` |
| `ERROR: temporary file size exceeds temp_file_limit` while compressing | large chunk | raise `temp_file_limit`, `maintenance_work_mem` |
| `ERROR: could not find hypertable_id in config for job` | `alter_job(config => …)` replaced whole config | use `config_merge` (2.29+) or `config || '{…}'` |
| `out of shared memory … max_locks_per_transaction` | many chunks locked per query | raise `max_locks_per_transaction` (restart) |
| gapfill errors / no extra rows | missing upper bound in WHERE, or `time_bucket_gapfill` nested in a function/cast | add `time < X`; cast in outer query |
| gapfill filter removes wrong rows | used `HAVING` (applies before gapfill) | filter in an outer CTE |
| `first()`/`last()` slow on rowstore | not index-assisted | `ORDER BY time DESC LIMIT 1` or DISTINCT ON + index |
| timezone surprises in buckets | timestamptz buckets align to UTC by default | `time_bucket(…, timezone => 'Europe/Berlin')` |
| integer bucket wrong for negatives (native emulation) | `v - v % w` truncates toward zero (verified: -7 → 0) | `floor(v::numeric / w) * w` (→ -500) |
| `date_bin` error `timestamps cannot be binned into intervals containing months or years` (verified) | PG `date_bin` lacks month support | `date_trunc('month', …)` or month arithmetic |
| Old tutorials fail (`compress_chunk`, `add_compression_policy`, `timescaledb.compress`) | renamed 2.18.0 (still work, deprecated) | use columnstore names |
| `time_bucket_ng` not found | removed in 2.25.0 | `time_bucket` (supports months, timezone, origin) |
| Upgrade blocked | old-format caggs (2.25+) or Hypercore TAM tables (2.22+) | migrate on ≤2.24 / convert TAM to heap first |
| Space-partitioned hypertable slow to plan | chunk multiplication | avoid `add_dimension` hash unless multi-disk I/O |
| Scheduled job never ran on Neon | Scale to Zero suspended compute; Apache edition has no `add_job` | keep compute awake / pg_cron / external cron |

---

## 7. Contradictions & version notes

- **Columnstore policy default schedule**: CREATE TABLE reference says the auto-created policy has "a default schedule interval of
  1 day"; `add_columnstore_policy` reference says default is **12 hours when chunk_time_interval ≥ 1 day, otherwise chunk_time_interval/2**.
  Both are primary; the auto-created policy likely uses its own value — treat "1 day (auto policy) vs 12 h (manual policy default)" as
  unverified; do not state a single number without the qualifier.
- **`time_bucket_ng`**: still listed on the "Time series utilities overview" docs page, but the changelog says it was **removed in
  2.25.0** (#8229). Changelog wins.
- **`fixed_schedule` default**: `add_job` doc: default **TRUE**; `alter_job` argument table: default `false`. The alter_job value is
  "not changed unless passed"; add_job's TRUE is the creation default.
- **Cagg columnstore prerequisite**: setup-hypercore page says the cagg "must already have a refresh policy before you add a columnstore
  policy"; changelog 2.27.2 #9895 "Remove refresh policy check when adding columnstore policy". Changelog wins for ≥ 2.27.2.
- **Chunk-sizing rule wording**: sizing page "indexes of chunks currently being ingested fit within 25% of main memory (`shared_buffers`)";
  data-lifecycle page "Aim for each chunk to be about 25% of available memory". The index-based wording (repeated on the performance page)
  is the precise one.
- **Default chunk interval wording**: "7 days" (CREATE TABLE) = "1 week" (by_range table); same thing.
- **`tsdb.` vs `timescaledb.` prefixes**: both accepted in `CREATE TABLE WITH` (docs use both); ALTER TABLE examples use `timescaledb.`.
- **Supported PG wording**: support-matrix prose says "The latest versions support PostgreSQL 15 and higher" while the table (and 2.29.0
  changelog) shows 2.29+ = **PG16–18 only**. Table/changelog win.
- **Real-time aggregates default**: enabled by default before 2.13, disabled since 2.13 (many blogs/tutorials predate this).
- **Renames in 2.18.0** (deprecated → replacement): `decompress_chunk` → `convert_to_rowstore`; `compress_chunk` → `convert_to_columnstore`;
  `add_compression_policy` → `add_columnstore_policy`; `remove_compression_policy` → `remove_columnstore_policy`;
  `hypertable_compression_stats` → `hypertable_columnstore_stats`; `chunk_compression_stats` → `chunk_columnstore_stats`;
  views `hypertable_compression_settings`/`chunk_compression_settings`/`compression_settings` → `*_columnstore_settings`;
  parameters `timescaledb.compress` → `timescaledb.enable_columnstore`, `compress_segmentby` → `segmentby`, `compress_orderby` → `orderby`.
  "They will be removed with the next major release."
- Cagg option `timescaledb.chunk_time_interval` renamed `timescaledb.chunk_interval` in 2.20 — old name **rejected**, not aliased.
- Removed features timeline: multi-node (2.14), PG14 (2.20), Hypercore TAM (2.22), old cagg format + `cagg_migrate` + WAL invalidation +
  `time_bucket_ng` (2.25), adaptive chunking (2.28), PG15 (2.29).
- **Licence history**: TimescaleDB always split Apache-2 core and TSL ("Timescale License", now called "Tiger Data License"). Docs call the
  TSL build "Community Edition" (not to be confused with "open source"). Cloud providers (incl. Neon, and historically AWS/Azure managed PG)
  can only ship the Apache edition.
- **Neon page vs extension table**: Neon's guide says "Compression is not supported"; true for all Neon versions (Apache-only). Neon PG18
  ships 2.24.0, i.e. ~8 minor versions behind 2.32.0; PG14/15 ship 2.10.1 (pre-`by_range` API — use the old `create_hypertable('t','time')` form there).
- **Brand renames**: Timescale → Tiger Data; Timescale Cloud → Tiger Cloud; docs.timescale.com → docs.tigerdata.com → tigerdata.com/docs;
  "Timescale License" → "Tiger Data License (TSL)".
- freeCodeCamp (secondary) matches the docs (">90%" compression, cagg ladders, data tiering) — no conflicts.

---

## 8. Lesson & visualizer ideas, and runnable PGlite SQL

All snippets below were run in PGlite 0.5.16 / PostgreSQL 18.6 via
`node run.mjs <file>.sql` (harness: `@electric-sql/pglite`, `SET TimeZone='UTC'` first). Outputs shown are actual.
Snippets run in order and share state. Anything not run is marked **UNTESTED**.

### 8.1 Visualizer ideas

1. **Chunk timeline**: horizontal time axis with chunk rectangles (daily); inserting a row lights the target chunk, or shows a
   "creating chunk" animation (TimescaleDB) vs the PG error `no partition of relation … found for row` (native). Slider for
   `chunk_interval` showing chunk count vs planning cost and the "indexes fit in 25% RAM" gauge.
2. **Chunk exclusion**: draw the WHERE range over the timeline; grey out pruned chunks; show plan-time vs runtime pruning
   (`Subplans Removed: N`).
3. **time_bucket origin explorer**: pick width/origin/offset/timezone, show bucket boundaries; highlight Monday 2000-01-03 origin,
   month buckets (date_bin error), DST day with 23/25 hours (generate_series with tz).
4. **Gapfill/locf/interpolate**: bar chart of buckets with NULL gaps; toggle NULL / LOCF / linear interpolation.
5. **Cagg engine**: raw hypertable → invalidation log (min/max per transaction) → materialization hypertable; watermark line; real-time
   UNION region above watermark; animate "one transaction touching 10:00 and 15:00 invalidates 6 buckets, two transactions invalidate 2".
6. **Retention vs refresh window**: two sliders (retention drop_after, refresh start/end offsets) with a warning when retention overlaps
   the refresh window (aggregates get deleted).
7. **Columnstore converter**: 6 rows of (time, symbol, price) collapse into one row of arrays per symbol; then show delta, delta-of-delta,
   simple-8b/RLE bit counts; batch min/max skipping (grey out batches outside a filter).
8. **Edition matrix**: toggle Apache vs Community vs Neon and see which features light up.

### 8.2 Tested SQL — bucketing (t1.sql)

```sql
-- 01 time_bucket('15 minutes', ts) ≡ date_bin with TimescaleDB's default origin
SELECT ts, date_bin('15 minutes', ts, TIMESTAMPTZ '2000-01-03 00:00:00+00') AS bucket
FROM (VALUES (TIMESTAMPTZ '2024-03-01 10:07:00+00'), (TIMESTAMPTZ '2024-03-01 10:22:59+00')) v(ts);
-- 10:07 -> 10:00, 10:22:59 -> 10:15

-- 02 docs example: April 24 2020, 2-week buckets -> April 13; 1-week bucket of 2021-01-05 -> Monday 2021-01-04
SELECT date_bin('14 days', TIMESTAMPTZ '2020-04-24 12:00+00', TIMESTAMPTZ '2000-01-03 00:00+00') AS two_week_bucket,
       date_bin('7 days',  TIMESTAMPTZ '2021-01-05 00:00+00', TIMESTAMPTZ '2000-01-03 00:00+00') AS week_bucket;
-- 2020-04-13 | 2021-01-04

-- 03 months are not supported by date_bin
SELECT date_bin('1 month', TIMESTAMPTZ '2024-03-15', TIMESTAMPTZ '2000-01-01');
-- ERROR: timestamps cannot be binned into intervals containing months or years

-- 04 date_bin has no default origin
SELECT date_bin('1 hour', TIMESTAMPTZ '2024-03-15 10:30+00');
-- ERROR: function date_bin(unknown, timestamp with time zone) does not exist

-- 05 month and 3-month buckets (time_bucket('3 months', t) with origin 2000-01-01)
SELECT date_trunc('month', TIMESTAMPTZ '2024-03-15 10:30+00') AS one_month,
       make_timestamptz(2000,1,1,0,0,0,'UTC')
         + make_interval(months => (((extract(year from t)::int-2000)*12 + extract(month from t)::int-1) / 3) * 3) AS three_month
FROM (SELECT TIMESTAMPTZ '2024-05-15 10:30+00' t) s;
-- 2024-03-01 00:00Z | 2024-04-01 00:00Z

-- 06 time_bucket('1 day', ts, 'Europe/Berlin') ≡ date_trunc with time zone (PG 12+)
SELECT date_trunc('day', TIMESTAMPTZ '2024-03-15 23:30+00', 'Europe/Berlin') AS berlin_day;
-- 2024-03-15 23:00Z  (= 2024-03-16 00:00 Berlin)

-- 07 offset ≡ shift the origin
SELECT date_bin('5 hours', TIMESTAMPTZ '2024-03-01 03:00+00', TIMESTAMPTZ '2000-01-03 00:00+00' + INTERVAL '1 hour') AS shifted;
-- 2024-03-01 00:00Z

-- 08 integer buckets: use floor, not modulo
SELECT v, v - (v % 500) AS bucket_nonneg, floor(v::numeric/500)*500 AS bucket_floor FROM (VALUES (1234),(-7)) t(v);
-- 1234 | 1000 | 1000
--   -7 |    0 | -500   <- modulo is wrong for negatives
```
Also verified (t4.sql): `date_bin(…)` is IMMUTABLE for both timestamp types; `date_trunc(text, timestamptz)` is **STABLE**
(depends on TimeZone) while `date_trunc(text, timestamptz, text)` is IMMUTABLE — relevant to "cagg functions must be immutable".
```sql
SELECT date_bin('1 day', TIMESTAMPTZ '2024-03-15 23:30+00', TIMESTAMPTZ '2000-01-03 00:00+00') utc_day,
       (date_bin('1 day', TIMESTAMPTZ '2024-03-15 23:30+00' AT TIME ZONE 'Europe/Berlin', TIMESTAMP '2000-01-03')) AT TIME ZONE 'Europe/Berlin' berlin_day;
-- 2024-03-15 00:00Z | 2024-03-15 23:00Z
SELECT g FROM generate_series(TIMESTAMPTZ '2024-03-30 00:00 Europe/Berlin', TIMESTAMPTZ '2024-04-01 00:00 Europe/Berlin',
                              INTERVAL '1 day', 'Europe/Berlin') g;   -- PG16+ tz-aware generate_series
-- 2024-03-29 23:00Z, 2024-03-30 23:00Z, 2024-03-31 22:00Z   (DST switch on 31 March)
```

### 8.3 Tested SQL — "hypertable" via declarative partitioning (t1.sql)

```sql
-- 10 partitioned table + chunk-creating helper (TimescaleDB creates chunks automatically; PG does not)
CREATE TABLE conditions (
  time timestamptz NOT NULL,
  device_id int NOT NULL,
  temperature double precision
) PARTITION BY RANGE (time);
CREATE OR REPLACE FUNCTION ensure_chunk(p_table text, p_ts timestamptz, p_interval interval DEFAULT '1 day')
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  lo timestamptz := date_bin(p_interval, p_ts, TIMESTAMPTZ '2000-01-03 00:00+00');
  hi timestamptz := lo + p_interval;
  nm text := format('%s_%s', p_table, to_char(lo AT TIME ZONE 'UTC', 'YYYYMMDD'));
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)', nm, p_table, lo, hi);
  RETURN nm;
END $$;
SELECT ensure_chunk('conditions', TIMESTAMPTZ '2024-03-01' + make_interval(days => d)) FROM generate_series(0,6) d;
INSERT INTO conditions
SELECT ts, (n % 4) + 1, 20 + 5*sin(n/50.0)
FROM generate_series(TIMESTAMPTZ '2024-03-01', TIMESTAMPTZ '2024-03-07 23:59', INTERVAL '1 minute') WITH ORDINALITY g(ts, n);
CREATE INDEX ON conditions (time DESC);            -- TimescaleDB's default index
CREATE INDEX ON conditions (device_id, time DESC);
ANALYZE conditions;
SELECT count(*) FROM conditions;                   -- 10080

-- 11 show_chunks() equivalent
SELECT c.relname AS chunk, pg_get_expr(c.relpartbound, c.oid) AS bound, pg_size_pretty(pg_total_relation_size(c.oid)) AS size
FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
WHERE i.inhparent = 'conditions'::regclass ORDER BY 1;
-- conditions_20240301 | FOR VALUES FROM ('2024-03-01 00:00:00+00') TO ('2024-03-02 00:00:00+00') | 216 kB   (7 rows)

-- 12
SELECT relid, parentrelid, isleaf, level FROM pg_partition_tree('conditions') ORDER BY relid::text LIMIT 4;

-- 13 chunk exclusion at plan time
EXPLAIN (COSTS OFF) SELECT avg(temperature) FROM conditions WHERE time >= '2024-03-03' AND time < '2024-03-04';
-- Aggregate
--   ->  Seq Scan on conditions_20240303 conditions
--         Filter: (("time" >= '2024-03-03 …') AND ("time" < '2024-03-04 …'))

-- 14/15 runtime exclusion (like ChunkAppend's runtime exclusion)
SET plan_cache_mode = force_generic_plan;
PREPARE q(timestamptz) AS SELECT count(*) FROM conditions WHERE time >= $1;
EXPLAIN (COSTS OFF) EXECUTE q('2024-03-06');
-- Aggregate -> Append
--        Subplans Removed: 5
--        ->  Index Only Scan using conditions_20240306_time_idx on conditions_20240306 conditions_1
--        ->  Index Only Scan using conditions_20240307_time_idx on conditions_20240307 conditions_2
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF) EXECUTE q('2024-03-06');   -- same, with actual rows=1440 per chunk
RESET plan_cache_mode; DEALLOCATE q;

-- 16 turn pruning off → all 7 partitions appear
SET enable_partition_pruning = off;
EXPLAIN (COSTS OFF) SELECT count(*) FROM conditions WHERE time >= '2024-03-06';
RESET enable_partition_pruning;

-- 17 no automatic chunk creation in native PG
INSERT INTO conditions VALUES ('2024-04-01', 1, 1.0);
-- ERROR: no partition of relation "conditions" found for row

-- 18/19 unique constraints must include the partition key (same rule as hypertables)
ALTER TABLE conditions ADD CONSTRAINT uq_dev UNIQUE (device_id);
-- ERROR: unique constraint on partitioned table must include all partitioning columns
ALTER TABLE conditions ADD CONSTRAINT uq_dev_time UNIQUE (device_id, time);   -- ok

-- 20 time_bucket-style aggregation
SELECT date_bin('6 hours', time, TIMESTAMPTZ '2000-01-03') AS bucket, device_id, round(avg(temperature)::numeric,3) avg_t, count(*)
FROM conditions WHERE time < '2024-03-01 12:00' GROUP BY 1,2 ORDER BY 1,2;
-- 2024-03-01 00:00Z | 1 | 20.294 | 90  … (8 rows)

-- 21 first(value,time) / last(value,time)
SELECT device_id,
  (array_agg(temperature ORDER BY time ASC))[1]  AS first_temp,
  (array_agg(temperature ORDER BY time DESC))[1] AS last_temp
FROM conditions GROUP BY device_id ORDER BY 1;

-- 22 last point per device: Merge Append over ALL partitions (TimescaleDB would use SkipScan, TSL)
EXPLAIN (COSTS OFF) SELECT DISTINCT ON (device_id) device_id, time, temperature FROM conditions ORDER BY device_id, time DESC;
-- Unique -> Merge Append (Sort Key: device_id, time DESC) -> 7 × Index Scan using …_device_id_time_idx

-- 24 histogram via width_bucket (0 = underflow, nbuckets+1 = overflow — same slots as TimescaleDB histogram())
SELECT width_bucket(temperature, 15, 25, 5) AS bucket, count(*) FROM conditions GROUP BY 1 ORDER BY 1;
-- 1|2966  2|1417  3|1299  4|1430  5|2968

-- 25 approximate_row_count equivalent
SELECT sum(c.reltuples)::bigint AS approx FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid WHERE i.inhparent='conditions'::regclass;
-- 10080

-- 26 drop_chunks('conditions', older_than => '2024-03-03') equivalent: whole partitions whose upper bound <= cutoff
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT c.oid::regclass AS part FROM pg_inherits i JOIN pg_class c ON c.oid=i.inhrelid
           WHERE i.inhparent='conditions'::regclass
             AND (regexp_match(pg_get_expr(c.relpartbound,c.oid), 'TO \(''([^'']+)''\)'))[1]::timestamptz <= '2024-03-03'
  LOOP EXECUTE format('ALTER TABLE conditions DETACH PARTITION %s', r.part); EXECUTE format('DROP TABLE %s', r.part); END LOOP;
END $$;
SELECT count(*), min(time) FROM conditions;      -- 7200 | 2024-03-03 00:00Z
```

### 8.4 Tested SQL — gapfill, locf, interpolate, histogram array (t2.sql)

```sql
-- 30 sparse data
CREATE TABLE metrics (time timestamptz NOT NULL, device_id int NOT NULL, value double precision);
INSERT INTO metrics VALUES
 ('2024-01-01 00:10+00',1,10),('2024-01-01 00:40+00',1,12),
 ('2024-01-01 02:15+00',1,20),
 ('2024-01-01 05:05+00',1,50),
 ('2024-01-01 01:30+00',2,7);

-- 31 histogram(value, 0, 50, 5) equivalent with nbuckets+2 slots
SELECT d.device_id, array_agg(coalesce(h.cnt,0) ORDER BY b.b) AS histogram
FROM (SELECT DISTINCT device_id FROM metrics) d
CROSS JOIN generate_series(0, 6) b(b)
LEFT JOIN (SELECT device_id, width_bucket(value, 0, 50, 5) wb, count(*) cnt FROM metrics GROUP BY 1,2) h
  ON h.device_id = d.device_id AND h.wb = b.b
GROUP BY 1 ORDER BY 1;
-- 1 | [0,0,2,1,0,0,1]      (50 lands in the overflow slot: width_bucket upper bound is exclusive)
-- 2 | [0,1,0,0,0,0,0]

-- 32 time_bucket_gapfill('1 hour', time) ≡ generate_series LEFT JOIN
SELECT g.bucket, avg(m.value) AS avg_value
FROM generate_series(TIMESTAMPTZ '2024-01-01 00:00+00', TIMESTAMPTZ '2024-01-01 05:00+00', INTERVAL '1 hour') g(bucket)
LEFT JOIN metrics m ON m.device_id = 1 AND m.time >= g.bucket AND m.time < g.bucket + INTERVAL '1 hour'
GROUP BY g.bucket ORDER BY g.bucket;
-- 00:00 11 | 01:00 NULL | 02:00 20 | 03:00 NULL | 04:00 NULL | 05:00 50

-- 33 IGNORE NULLS is NOT available in PG 18
SELECT last_value(v) IGNORE NULLS OVER (ORDER BY i) FROM (VALUES (1,1),(2,NULL)) t(i,v);
-- ERROR: syntax error at or near "NULLS"

-- 34 locf(avg(value)) via the count() grouping trick
WITH filled AS (
  SELECT g.bucket, avg(m.value) AS v
  FROM generate_series(TIMESTAMPTZ '2024-01-01 00:00+00', TIMESTAMPTZ '2024-01-01 05:00+00', INTERVAL '1 hour') g(bucket)
  LEFT JOIN metrics m ON m.device_id = 1 AND m.time >= g.bucket AND m.time < g.bucket + INTERVAL '1 hour'
  GROUP BY g.bucket
), grp AS (
  SELECT bucket, v, count(v) OVER (ORDER BY bucket) AS grp FROM filled
)
SELECT bucket, v, first_value(v) OVER (PARTITION BY grp ORDER BY bucket) AS locf
FROM grp ORDER BY bucket;
-- 11,11 | NULL,11 | 20,20 | NULL,20 | NULL,20 | 50,50

-- 35 interpolate(avg(value)) via previous/next non-null
WITH filled AS (
  SELECT g.bucket, avg(m.value) AS v
  FROM generate_series(TIMESTAMPTZ '2024-01-01 00:00+00', TIMESTAMPTZ '2024-01-01 05:00+00', INTERVAL '1 hour') g(bucket)
  LEFT JOIN metrics m ON m.device_id = 1 AND m.time >= g.bucket AND m.time < g.bucket + INTERVAL '1 hour'
  GROUP BY g.bucket
), marks AS (
  SELECT bucket, v, count(v) OVER (ORDER BY bucket) AS gp, count(v) OVER (ORDER BY bucket DESC) AS gn FROM filled
), pn AS (
  SELECT bucket, v,
    first_value(v)      OVER (PARTITION BY gp ORDER BY bucket)      AS pv,
    first_value(bucket) OVER (PARTITION BY gp ORDER BY bucket)      AS pt,
    first_value(v)      OVER (PARTITION BY gn ORDER BY bucket DESC) AS nv,
    first_value(bucket) OVER (PARTITION BY gn ORDER BY bucket DESC) AS nt
  FROM marks
)
SELECT bucket, v,
  CASE WHEN v IS NOT NULL THEN v
       WHEN pv IS NULL OR nv IS NULL THEN NULL
       ELSE pv + (nv - pv) * extract(epoch FROM bucket - pt) / extract(epoch FROM nt - pt) END AS interpolated
FROM pn ORDER BY bucket;
-- 11 | 15.5 | 20 | 30 | 40 | 50

-- 36 per-device gapfill (GROUP BY bucket, device_id)
SELECT d.device_id, g.bucket, count(m.*) AS n
FROM (SELECT DISTINCT device_id FROM metrics) d
CROSS JOIN generate_series(TIMESTAMPTZ '2024-01-01 00:00+00', TIMESTAMPTZ '2024-01-01 02:00+00', INTERVAL '1 hour') g(bucket)
LEFT JOIN metrics m ON m.device_id = d.device_id AND m.time >= g.bucket AND m.time < g.bucket + INTERVAL '1 hour'
GROUP BY 1,2 ORDER BY 1,2;
-- 1|00:00|2  1|01:00|0  1|02:00|1  2|00:00|0  2|01:00|1  2|02:00|0
```

### 8.5 Tested SQL — materialized views and a continuous-aggregate emulation (t3.sql; runs after 8.4's setup)

```sql
-- 40 plain matview = non-incremental cagg
CREATE MATERIALIZED VIEW metrics_hourly AS
SELECT date_bin('1 hour', time, TIMESTAMPTZ '2000-01-03') AS bucket, device_id, avg(value) avg_v, count(*) n
FROM metrics GROUP BY 1,2 WITH NO DATA;
SELECT * FROM metrics_hourly;
-- ERROR: materialized view "metrics_hourly" has not been populated   (TimescaleDB caggs WITH NO DATA just return no rows)
REFRESH MATERIALIZED VIEW metrics_hourly;            -- full recompute every time
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_hourly;
-- ERROR: cannot refresh materialized view "public.metrics_hourly" concurrently   (needs a unique index)
CREATE UNIQUE INDEX ON metrics_hourly (bucket, device_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_hourly;   -- ok
INSERT INTO metrics VALUES ('2024-01-01 05:30+00',1,60);
SELECT bucket, device_id, avg_v, n FROM metrics_hourly WHERE bucket = '2024-01-01 05:00+00';
-- still 50 | 1  → stale until next refresh

-- 50 incremental cagg emulation: materialization table + invalidation log + watermark
CREATE TABLE cagg_hourly (bucket timestamptz, device_id int, sum_v double precision, n bigint, PRIMARY KEY (bucket, device_id));
CREATE TABLE cagg_invalidations (lo timestamptz, hi timestamptz);
CREATE TABLE cagg_watermark (wm timestamptz);
INSERT INTO cagg_watermark VALUES ('-infinity');
CREATE FUNCTION log_invalidation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- like TimescaleDB: log min/max time touched (here per statement, TimescaleDB per transaction)
  INSERT INTO cagg_invalidations SELECT min(time), max(time) FROM new_rows HAVING count(*) > 0;
  RETURN NULL;
END $$;
CREATE TRIGGER metrics_inval AFTER INSERT ON metrics REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION log_invalidation();
CREATE PROCEDURE refresh_cagg(p_start timestamptz, p_end timestamptz) LANGUAGE plpgsql AS $$
DECLARE v_lo timestamptz; v_hi timestamptz;
BEGIN
  -- only complete buckets inside the window
  v_lo := date_bin('1 hour', p_start + INTERVAL '1 hour' - INTERVAL '1 microsecond', TIMESTAMPTZ '2000-01-03');
  v_hi := date_bin('1 hour', p_end, TIMESTAMPTZ '2000-01-03');
  DELETE FROM cagg_hourly c USING (
     SELECT DISTINCT date_bin('1 hour', gs, TIMESTAMPTZ '2000-01-03') b
     FROM cagg_invalidations i, generate_series(date_bin('1 hour', i.lo, TIMESTAMPTZ '2000-01-03'), i.hi, INTERVAL '1 hour') gs) x
  WHERE c.bucket = x.b AND c.bucket >= v_lo AND c.bucket < v_hi;
  INSERT INTO cagg_hourly
  SELECT date_bin('1 hour', time, TIMESTAMPTZ '2000-01-03'), device_id, sum(value), count(*)
  FROM metrics WHERE time >= v_lo AND time < v_hi
  GROUP BY 1,2
  ON CONFLICT (bucket, device_id) DO UPDATE SET sum_v = EXCLUDED.sum_v, n = EXCLUDED.n;
  DELETE FROM cagg_invalidations; -- simplified: consume all logged ranges
  UPDATE cagg_watermark SET wm = greatest(wm, v_hi);
END $$;
CALL refresh_cagg('2024-01-01 00:00+00', '2024-01-01 05:00+00');
SELECT bucket, device_id, sum_v/n AS avg_v, n FROM cagg_hourly ORDER BY 1,2;
-- 00:00|1|11|2   01:00|2|7|1   02:00|1|20|1      (05:00 bucket excluded: outside the window, like end_offset)
SELECT wm FROM cagg_watermark;                       -- 2024-01-01 05:00Z

-- 52 real-time aggregate (materialized_only = false) ≡ UNION ALL below/above watermark
CREATE VIEW metrics_hourly_rt AS
SELECT bucket, device_id, sum_v/n AS avg_v, n FROM cagg_hourly WHERE bucket < (SELECT wm FROM cagg_watermark)
UNION ALL
SELECT date_bin('1 hour', time, TIMESTAMPTZ '2000-01-03'), device_id, avg(value), count(*)
FROM metrics WHERE time >= (SELECT wm FROM cagg_watermark) GROUP BY 1,2;
SELECT * FROM metrics_hourly_rt ORDER BY 1,2;
-- … plus 05:00|1|55|2 computed live from raw rows (50 and 60)

-- 53 backfill into a materialized bucket: logged, but NOT visible via the real-time view until refresh
INSERT INTO metrics VALUES ('2024-01-01 00:50+00',1,100);
SELECT (SELECT count(*) FROM cagg_invalidations) AS pending_invalidations,
       (SELECT avg_v FROM metrics_hourly_rt WHERE bucket='2024-01-01 00:00+00' AND device_id=1) AS rt_value_before_refresh;
-- 1 | 11
CALL refresh_cagg('2024-01-01 00:00+00', '2024-01-01 05:00+00');
SELECT bucket, device_id, sum_v/n AS avg_v, n FROM cagg_hourly WHERE bucket='2024-01-01 00:00+00';
-- 00:00 | 1 | 40.666… | 3

-- 55 hierarchical rollup: store sum+count, never average averages
SELECT date_trunc('day', bucket) AS day, device_id, sum(sum_v)/sum(n) AS correct_avg, avg(sum_v/n) AS avg_of_avgs
FROM cagg_hourly GROUP BY 1,2 ORDER BY 1,2;
-- device 1: correct_avg 35.5 vs avg_of_avgs 30.33
```
MERGE refresh (t4.sql, tested; PG17+ `WHEN NOT MATCHED BY SOURCE`):
```sql
CREATE TABLE s (bucket timestamptz PRIMARY KEY, n bigint);
MERGE INTO s USING (SELECT date_trunc('day', time) b, count(*) n FROM c GROUP BY 1) src ON s.bucket = src.b
WHEN MATCHED AND s.n <> src.n THEN UPDATE SET n = src.n
WHEN NOT MATCHED THEN INSERT VALUES (src.b, src.n)
WHEN NOT MATCHED BY SOURCE THEN DELETE;      -- 3 rows of 1440
```

### 8.6 Tested SQL — BRIN, columnar emulation, TOAST (t2.sql)

```sql
-- 60-63 BRIN on an append-only time column
CREATE TABLE big (time timestamptz NOT NULL, v int);
INSERT INTO big SELECT TIMESTAMPTZ '2024-01-01' + make_interval(secs => i), i FROM generate_series(1, 200000) i;
CREATE INDEX big_brin ON big USING brin (time) WITH (pages_per_range = 32);
ANALYZE big;
SELECT pg_size_pretty(pg_relation_size('big')) heap, pg_size_pretty(pg_relation_size('big_brin')) brin;   -- 8656 kB | 24 kB
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF)
SELECT count(*) FROM big WHERE time >= '2024-01-02' AND time < '2024-01-02 01:00';
-- Bitmap Heap Scan on big (actual rows=3600) Rows Removed by Index Recheck: 8240, Heap Blocks: lossy=64
--   -> Bitmap Index Scan on big_brin (actual rows=640)
CREATE INDEX big_btree ON big (time);
SELECT pg_size_pretty(pg_relation_size('big_btree')) btree;          -- 4408 kB
SELECT attname, correlation FROM pg_stats WHERE tablename='big' AND attname='time';   -- time | 1

-- 70 columnstore idea: one row per (segmentby, batch of ≤1000 rows) holding arrays + min/max metadata
CREATE TABLE ticks (time timestamptz, symbol text, price double precision);
INSERT INTO ticks SELECT TIMESTAMPTZ '2024-01-01' + make_interval(secs => i), (ARRAY['BTC','ETH','SOL'])[1 + i % 3], 100 + (i % 50)
FROM generate_series(1, 30000) i;
CREATE TABLE ticks_compressed AS
SELECT symbol, (rn - 1) / 1000 AS batch,
       min(time) AS min_time, max(time) AS max_time, count(*) AS n,
       array_agg(time ORDER BY time) AS times, array_agg(price ORDER BY time) AS prices
FROM (SELECT *, row_number() OVER (PARTITION BY symbol ORDER BY time) rn FROM ticks) s
GROUP BY symbol, (rn - 1) / 1000;
SELECT pg_size_pretty(pg_total_relation_size('ticks')) row_store,
       pg_size_pretty(pg_total_relation_size('ticks_compressed')) array_store,
       (SELECT count(*) FROM ticks_compressed) batches;
-- 1568 kB | 216 kB | 30     (arrays + TOAST pglz only; real codecs do much better)

-- 71 batch skipping by min/max metadata, then "decompress" with unnest
SELECT symbol, t, p FROM ticks_compressed c, unnest(c.times, c.prices) u(t, p)
WHERE c.symbol = 'ETH' AND c.max_time >= '2024-01-01 03:00' AND c.min_time <= '2024-01-01 03:00:10'
  AND t BETWEEN '2024-01-01 03:00' AND '2024-01-01 03:00:10' ORDER BY t;
-- 4 rows (03:00:01, :04, :07, :10)

-- 72 delta and delta-of-delta of a regular time column
SELECT time, extract(epoch FROM time - lag(time) OVER w) AS delta,
       extract(epoch FROM time - lag(time) OVER w) - extract(epoch FROM lag(time) OVER w - lag(time, 2) OVER w) AS delta_of_delta
FROM ticks WHERE symbol='BTC' WINDOW w AS (ORDER BY time) ORDER BY time LIMIT 5;
-- NULL,NULL | 3,NULL | 3,0 | 3,0 | 3,0

-- 73/74 TOAST compression in PGlite
SHOW default_toast_compression;                 -- pglz
SET default_toast_compression = 'lz4';          -- ERROR: invalid value for parameter "default_toast_compression": "lz4"  (PGlite built without lz4)
```

### 8.7 Tested SQL — space partitioning, default partition, attach, jobs (t2.sql, t4.sql)

```sql
-- 80/81 by_hash dimension ≡ sub-partition BY HASH
CREATE TABLE readings (time timestamptz NOT NULL, device_id int NOT NULL, v int) PARTITION BY RANGE (time);
CREATE TABLE readings_d1 PARTITION OF readings FOR VALUES FROM ('2024-01-01') TO ('2024-01-02') PARTITION BY HASH (device_id);
CREATE TABLE readings_d1_h0 PARTITION OF readings_d1 FOR VALUES WITH (MODULUS 2, REMAINDER 0);
CREATE TABLE readings_d1_h1 PARTITION OF readings_d1 FOR VALUES WITH (MODULUS 2, REMAINDER 1);
INSERT INTO readings SELECT TIMESTAMPTZ '2024-01-01' + make_interval(mins => i), i % 10, i FROM generate_series(0, 1000) i;
SELECT tableoid::regclass, count(*) FROM readings GROUP BY 1 ORDER BY 1;     -- readings_d1_h0 | 301, readings_d1_h1 | 700
EXPLAIN (COSTS OFF) SELECT * FROM readings WHERE device_id = 3 AND time < '2024-01-01 12:00';
-- Seq Scan on readings_d1_h1 readings   (both range and hash pruning)

-- 82 DEFAULT partition catches rows with no chunk (TimescaleDB would create a chunk instead)
CREATE TABLE readings_default PARTITION OF readings DEFAULT;
INSERT INTO readings VALUES ('2030-01-01', 1, 1);
SELECT tableoid::regclass, count(*) FROM readings WHERE time > '2029-01-01' GROUP BY 1;   -- readings_default | 1

-- 107 attach_chunk ≡ ATTACH PARTITION of a pre-loaded table (CHECK constraint avoids a validation scan)
CREATE TABLE c_4 (LIKE c INCLUDING ALL);
INSERT INTO c_4 SELECT TIMESTAMPTZ '2024-03-04' + make_interval(mins => i), 0, i FROM generate_series(0, 10) i;
ALTER TABLE c_4 ADD CONSTRAINT c_4_rng CHECK (time >= '2024-03-04' AND time < '2024-03-05');
ALTER TABLE c ATTACH PARTITION c_4 FOR VALUES FROM ('2024-03-04') TO ('2024-03-05');
-- c_1 1440 | c_2 1440 | c_3 1440 | c_4 11

-- 108 DETACH PARTITION … CONCURRENTLY works in PGlite as a standalone statement (tested; ok)
ALTER TABLE c DETACH PARTITION c_1 CONCURRENTLY;

-- 109 chunks_detailed_size equivalent
SELECT p.relid, pg_size_pretty(pg_relation_size(p.relid)) tbl, pg_size_pretty(pg_indexes_size(p.relid)) idx,
       pg_size_pretty(pg_total_relation_size(p.relid)) total
FROM pg_partition_tree('c') p WHERE p.isleaf ORDER BY 1;

-- 101 ordered append for last point: Limit -> Append of per-partition index scans in time order (no Sort)
EXPLAIN (COSTS OFF) SELECT * FROM c ORDER BY time DESC LIMIT 1;
-- Limit -> Append -> Index Scan using c_3_time_idx on c_3 -> … c_2 -> … c_1

-- 90 add_job-style procedure, invoked manually (no scheduler in PGlite)
CREATE PROCEDURE retention_job(job_id int, config jsonb) LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  DELETE FROM metrics WHERE time < (config->>'older_than')::timestamptz;
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'job % deleted % rows', job_id, n;
END $$;
CALL retention_job(1000, '{"older_than": "2024-01-01 01:00+00"}');
```
Tested negative result: `SET enable_partitionwise_aggregate = on` with `GROUP BY date_bin(...)` on the 3-partition table still
produced a single HashAggregate over Append (planner chose not to split for this small data/non-partition-key grouping); do **not**
promise a partial-aggregate-per-partition plan in a lesson without a bigger dataset (**UNTESTED** at scale).
PGlite extension check: `SELECT name FROM pg_available_extensions` → only `plpgsql` (pg_cron, pg_partman, timescaledb, postgres_fdw,
tablefunc absent).

### 8.8 TimescaleDB SQL for lessons (display only — UNTESTED, cannot run in PGlite)

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
SHOW timescaledb.license;
CREATE TABLE sensor_data (time TIMESTAMPTZ NOT NULL, sensor_id TEXT NOT NULL, temperature DOUBLE PRECISION)
  WITH (tsdb.hypertable, tsdb.chunk_interval = '1 day', tsdb.segmentby = 'sensor_id', tsdb.orderby = 'time DESC');
SELECT * FROM timescaledb_information.chunks WHERE hypertable_name = 'sensor_data';
SELECT time_bucket('1 hour', time) AS hour, sensor_id, avg(temperature) FROM sensor_data GROUP BY 1,2;
SELECT time_bucket_gapfill('1 hour', time) AS hour, locf(avg(temperature)), interpolate(avg(temperature))
  FROM sensor_data WHERE time >= now() - INTERVAL '1 day' AND time < now() GROUP BY hour ORDER BY hour;
CREATE MATERIALIZED VIEW sensor_hourly WITH (timescaledb.continuous) AS
  SELECT time_bucket('1 hour', time) AS hour, sensor_id, avg(temperature) avg_t, count(*) n FROM sensor_data GROUP BY 1,2;
SELECT add_continuous_aggregate_policy('sensor_hourly', start_offset => INTERVAL '3 hours', end_offset => INTERVAL '1 hour', schedule_interval => INTERVAL '1 hour');
ALTER MATERIALIZED VIEW sensor_hourly SET (timescaledb.materialized_only = false);
CALL add_columnstore_policy('sensor_data', after => INTERVAL '7 days');   -- already auto-created by CREATE TABLE WITH (2.23+)
SELECT pg_size_pretty(before_compression_total_bytes), pg_size_pretty(after_compression_total_bytes) FROM hypertable_columnstore_stats('sensor_data');
SELECT add_retention_policy('sensor_data', drop_after => INTERVAL '12 months');
SELECT job_id, proc_name, schedule_interval, config FROM timescaledb_information.jobs;
SELECT * FROM timescaledb_information.job_stats;
```

### 8.9 Native-PostgreSQL equivalence table (for the "simulate it" sidebar)

| TimescaleDB | Native PG demonstrable in PGlite | Gap the lesson should state |
|---|---|---|
| hypertable / chunks | `PARTITION BY RANGE (time)` + helper creating partitions; DEFAULT partition | no automatic chunk creation; you manage partitions (pg_partman does this on real servers, not in PGlite) |
| chunk exclusion / ChunkAppend | plan-time + runtime partition pruning (`Subplans Removed`) | TimescaleDB also constifies `now()` and has DeferredChunkAppend for thousands of chunks |
| `show_chunks`, `chunks_detailed_size`, `timescaledb_information.chunks` | `pg_inherits`, `pg_partition_tree`, `pg_get_expr(relpartbound)`, size functions | — |
| `drop_chunks`, retention policy | `DETACH PARTITION [CONCURRENTLY]` + `DROP TABLE` | scheduling (pg_cron) |
| `add_dimension(by_hash)` | sub-partitioning `PARTITION BY HASH` | — |
| `attach_chunk`/`detach_chunk` | `ATTACH/DETACH PARTITION` | — |
| `time_bucket` | `date_bin` (needs origin, no months), `date_trunc` (+ tz arg) | month/year widths, default origin, timezone arg in one function |
| `time_bucket_gapfill` / `locf` / `interpolate` | `generate_series` LEFT JOIN + window functions | verbose; no IGNORE NULLS in PG18 |
| `first`/`last` | `(array_agg(v ORDER BY t))[1]`, `DISTINCT ON` | — |
| `histogram` | `width_bucket` + `array_agg` | — |
| `approximate_row_count` | `pg_class.reltuples` sum | — |
| continuous aggregate | matview (full refresh, `CONCURRENTLY` w/ unique index) or summary table + statement trigger invalidation log + refresh procedure + watermark | TimescaleDB does this transparently, batched, policy-driven |
| real-time aggregate | view = materialized UNION ALL raw-above-watermark | — |
| hierarchical cagg | summary-of-summary using sum/count | — |
| columnstore / compression | arrays per segment/batch + min/max metadata; TOAST pglz; BRIN for cheap time indexing | no columnar executor, no codecs (delta-of-delta, Gorilla, AIC) |
| SkipScan | (PG 18 has B-tree skip scan for multicolumn indexes — see research B/M files; DISTINCT ON over Merge Append shown) | TimescaleDB's SkipScan is for DISTINCT on rowstore and columnstore |
| jobs / policies | procedures with `(job_id int, config jsonb)` + manual CALL | no scheduler in PGlite (pg_cron on Neon) |

---

## Hyperfunctions (Toolkit)

Verified 2026-11-14 against the Toolkit repository and the Tiger Data docs. Sources:
- R1 https://github.com/timescale/timescaledb-toolkit (README.md, NOTICE, LICENSE)
- R2 https://github.com/timescale/timescaledb-toolkit/blob/main/CHANGELOG.md and https://api.github.com/repos/timescale/timescaledb-toolkit/releases
- R3 https://github.com/timescale/timescaledb-toolkit/tree/main/docs (README.md tag notes, time_weighted_average.md, counter_agg.md, percentile_approximation.md, uddsketch.md, tdigest.md, stats_agg.md, two-step_aggregation.md)
- R4 https://github.com/timescale/timescaledb-toolkit/blob/main/crates/udd-sketch/src/lib.rs (UddSketch algorithm)
- R5 https://www.tigerdata.com/docs/llms-full.txt: sections "About TimescaleDB hyperfunctions", "Install, update, and uninstall TimescaleDB Toolkit", "TimescaleDB Toolkit API reference", and the per-function reference pages under /docs/reference/toolkit/…
- R6 https://neon.com/docs/extensions/pg-extensions (no `timescaledb_toolkit` entry; only `timescaledb`)

### Identity, version, licence, availability
- Extension name **`timescaledb_toolkit`** (`CREATE EXTENSION IF NOT EXISTS timescaledb_toolkit;`). Rust + pgrx 0.18.1. (R1)
- Current release **1.27.0** (GitHub tag `1.27.0+p2`, published 2026-11-05): bug fixes only (statssummary equality operators, sparse
  hyperloglog rollup, counter_agg reset counted for an ignored same-timestamp point, input validation). Previous: 1.26.0 (2026-09-01),
  1.25.0 (2026-08-18, **gauge_agg stabilized** #859), 1.24.0 (2026-07-27, last release with PG15), 1.23.0 (2026-06-02). (R2)
- PostgreSQL support: README lists build targets PG 15–18, but 1.24.0 notes "expect 1.25.0 not to be installable in PostgreSQL 15", so
  1.25+ = **PG 16, 17, 18**. PG18 support added in 1.22.0 (2025-10-24). (R1, R2)
- Since **1.23.0** the control file is `trusted = true`: a role with CREATE on the database can create it without superuser. (R2, R5)
- Licence: **Timescale License (TSL)**, now called the Tiger Data License (NOTICE: "licensed under the Timescale License";
  LICENSE points to `timescaledb/tsl/LICENSE-TIMESCALE`). Docs tag: "Toolkit functions are available under TimescaleDB Community
  Edition". (R1, R5)
- Availability: pre-installed on **Tiger Cloud** ("Tiger Cloud includes all hyperfunctions by default"); in the
  `timescale/timescaledb-ha` Docker image and the Kubernetes deployment; packages `timescaledb-toolkit-postgresql-18` (apt), yum, brew;
  or from source. **Not on Neon** (Neon ships `timescaledb` Apache-only; no Toolkit in its extension list). (R1, R5, R6)
- Toolkit works on plain PostgreSQL tables too: "designed to work with TimescaleDB and plain PostgreSQL data". (R1)
- Update: `ALTER EXTENSION timescaledb_toolkit UPDATE;` (R5)

### Stability model
- Stable / Deprecated / **Experimental**. Experimental APIs live only in schema **`toolkit_experimental`**; "extension-update will drop
  database objects that depend on experimental features", called out as important for managed services that automate upgrades. (R3 tag notes)
- Real breaking examples (R2): 1.12.0 introduced `toolkit_experimental.candlestick_agg` replacing `toolkit_experimental.ohlc` ("will be
  removed in the next release"); 1.14.0 stabilized candlestick, **renamed `state_agg` → `compact_state_agg` and `timeline_agg` →
  `state_agg`**, swapped the first two arguments of `duration_in`/`interpolated_duration_in`/`state_periods`, removed the `next` parameter
  from interpolated state functions.
- Still experimental (R5 tables): `compact_state_agg`, `freq_agg`, `count_min_sketch`/`approx_count`, `gp_lttb`, `time_bucket_range`,
  timevector pipeline elements (`sort`, `unnest`, `map`, …). `lttb`, `asap_smooth`, `hyperloglog` are stable in R5 although R3's
  docs/README still tags them experimental (stale). `gauge_agg`: only the docs overview table still marks it experimental; its own reference page says "Since 1.25.0", the changelog says stabilized in 1.25.0, and the source puts it in the public schema →
  changelog wins for ≥ 1.25.0.

### Two-step aggregation
- Aggregate → intermediate summary type (TimeWeightSummary, Candlestick, UddSketch, TDigest, CounterSummary, StatsSummary1D/2D,
  HeartbeatAgg) → accessor computes the final value. `rollup(summary)` merges summaries; this is what makes them storable in continuous
  aggregates and re-aggregable into larger buckets. Several accessors can read one summary. (R5 counters overview)

### time_weight
- `time_weight(method TEXT, ts TIMESTAMPTZ, value DOUBLE PRECISION) RETURNS TimeWeightSummary`; method `'linear'` or `'LOCF'`, any case.
- Accessors: `average`, `integral(tws [, unit default 'second'])`, `interpolated_average(tws, start, duration [, prev] [, next])`,
  `interpolated_integral`, `first_time`, `first_val`, `last_time`, `last_val`; `rollup`.
- `average` = integral / elapsed time between first and last point; **one point → NULL** (unlike `avg`). Doc example: 10,20,10,20,15 at
  1-minute spacing → LOCF average 15 (the last point has no weight).
- `interpolated_average`: prev/next summaries (from `LAG`/`LEAD`) interpolate the value at the bucket bounds; next NULL with LOCF →
  last value carried to `start + duration`.
- Not parallel-safe (order-dependent; marked parallel unsafe in 1.23.0; 1.26.0 removed combine/serialize/deserialize). `rollup` of
  overlapping summaries errors; summaries from different series must not be combined. (R3, R2)

### candlestick_agg / candlestick
- `candlestick_agg(ts, price, volume) RETURNS Candlestick` from ticks; `candlestick(ts, open, high, low, close, volume)` from
  pre-aggregated bars. Accessors `open, open_time, high, high_time, low, low_time, close, close_time, volume, vwap`; `rollup`. Since 1.14.0.
- `vwap` = Σ(price·volume)/Σvolume; for bars built by `candlestick()` uses the typical price (high+low+close)/3. NULL volume in any row →
  `volume()`/`vwap()` NULL. Ties on the latest timestamp: which close wins depends on input order. (R5)

### Percentiles
- `percentile_agg(value)` = `uddsketch(200, 0.001, value)`; `uddsketch(size, max_error, value)`; `tdigest(size, value)`.
- Accessors: `approx_percentile(p, sketch)`, `approx_percentile_rank(value, sketch)`, `approx_percentile_array` (uddsketch, stable 1.16),
  `error` (uddsketch), `mean`, `num_vals`, `total` (1.21), `min_val`/`max_val` (tdigest); `rollup`.
- UddSketch (R4): γ = (1+α)/(1−α); bucket key = ⌈log_γ x⌉; estimate of bucket i = γ^(i−1)·(1+α); quantile walks buckets until the
  `floor(n·q)+1`-th value. Over `size` buckets → compaction: γ ← γ², α ← 2α/(1+α²) (error roughly doubles). Merging adds bucket counts, so
  rollup is exact with respect to the sketch: order-independent. TDigest estimates depend on input order and batching.
- rollup inputs must share `size` and `max_error`; "a mismatch is not always detected". (R5)
- Exact `percentile_cont` needs the whole sorted set and has no partial form, so it cannot be combined across buckets. (R3)

### counter_agg
- `counter_agg(ts, value [, bounds TSTZRANGE]) RETURNS CounterSummary`. Any decrease is a **reset**: true value after a decrease =
  previous value + current value. Summary keeps first, second, penultimate and last points, sum of values at resets, num changes/resets,
  regression state, optional bounds. (R3)
- `delta` = last − first after accounting for resets; `rate` = delta / observed time; `extrapolated_delta`/`extrapolated_rate(summary,
  'prometheus')` need bounds (`counter_agg(..., bounds)` or `with_bounds`), extrapolate to the bounds like Prometheus `rate`;
  `interpolated_delta/interpolated_rate(summary, start, duration, prev, next)` (stable 1.14); `num_resets`, `num_changes`,
  `idelta_left/right`, `irate_left/right`, `slope`, `intercept`, `corr`, `counter_zero_time`, `time_delta`; `rollup`. (R5)
- Summing per-bucket `delta`s misses the increase between buckets; `rollup` (or `interpolated_delta`) restores it.

### stats_agg, heartbeat_agg, others
- `stats_agg(value)` → StatsSummary1D (`average, sum, num_vals, stddev, variance, skewness, kurtosis`, `rolling`, `rollup`); BIGINT
  overload since 1.23.0 (±2^53). `stats_agg(y, x)` → StatsSummary2D (regression: `slope, intercept, corr, covariance,
  determination_coeff, x_intercept`, …).
- `heartbeat_agg(heartbeat, agg_start, agg_duration, heartbeat_liveness)` → `uptime, downtime, live_ranges, dead_ranges, live_at,
  num_gaps, interpolated_uptime, …`; stabilized 1.15; equality operators 1.24 (needed by cagg refresh).
- Also stable: `state_agg`, `hyperloglog`/`approx_count_distinct`, `min_n/max_n(_by)`, `mcv_agg`, `asap_smooth`, `lttb`, `gauge_agg` (1.25).

### Native PostgreSQL 18 equivalents (verified in PGlite 0.5.16 / PG 18.6; lesson e2/hyperfunctions)
- Irregular series 20,22,21,35,34,22,23,24 at 08:00/15/25/32/33/34/50/58: `avg` 25.125; LOCF integral 1272 value·min, LOCF average
  **21.931**; linear **23.043** (via `lead()`). 30-min buckets: average 20.8 / 23.269; interpolated 20.833 / 23.167.
- OHLC per minute via `(array_agg(price ORDER BY ts))[1]`, min, max, sum; VWAP 99.8767 and 101.2786; 2-minute rollup open 100, high
  102.3, low 99.2, close 101.8, volume 85, VWAP 100.5694 (vs plain avg price 100.8625).
- 620 latencies over 3 hours (400 / 20 incident / 200): hourly p95 58, 838.65, 78; **avg of hourly p95 324.88 vs true p95 77.05**;
  log-bucket sketch (α = 0.05) merged by summing counts: p95 77.663, p99 574.815 (true p99 560.93).
- Counter 100,160,230,15,40,110,30,70: last − first = −30, max − min = 215, reset-aware delta **310**, 2 resets, rate 0.0891/s;
  per-30-min deltas 145 + 140 = 285 (the 25 across the boundary is lost).
