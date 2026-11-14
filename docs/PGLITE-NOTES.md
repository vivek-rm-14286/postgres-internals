# PGlite: what the in-browser PostgreSQL can and cannot do

Measured with `@electric-sql/pglite` 0.5.16 (PostgreSQL 18.6, wasm32) in Node and Chromium, November 2026.

## Works

- **Introspection extensions:** `pageinspect`, `pg_visibility`, `pg_freespacemap`, `pg_buffercache`, `pg_walinspect`,
  `pg_stat_statements`, `amcheck`.
- **Search and indexing:** `pg_trgm`, `btree_gin`, `btree_gist`, `bloom`.
- **Data types and utilities:** `hstore`, `ltree`, `citext`, `pgcrypto`, `tablefunc`, `pg_surgery`, `tsm_system_rows`,
  `uuid-ossp`, `cube`, `earthdistance`, `fuzzystrmatch`, `intarray`, `isn`, `lo`, `seg`, `unaccent`, `dict_int`,
  `dict_xsyn`, `auto_explain`, `tcn`, `moddatetime`.
- **pgvector** 0.8.7 (`@electric-sql/pglite-pgvector`): HNSW, IVFFlat, halfvec, sparsevec, bit, iterative scans.
- **PostGIS** 3.6.2 (`@electric-sql/pglite-postgis`, peer `pglite@0.5.16`): GEOS 3.14, PROJ 9.7, 8,500
  `spatial_ref_sys` rows, GiST KNN. It is a 19 MB download and boot takes about 4 s.
- `EXPLAIN (ANALYZE, BUFFERS)` with the PG18 output (`Index Searches`, two-decimal row counts), `uuidv7()`, virtual
  generated columns, `RETURNING old/new`, temporal keys (`WITHOUT OVERLAPS`, needs `btree_gist`), `NOT NULL … NOT VALID`.
- `pg_locks` for your own transaction, `pg_current_snapshot()`, `pg_visible_in_snapshot()`, `FOR UPDATE SKIP LOCKED`
  and advisory locks.
- `CREATE PUBLICATION` with row filters and column lists, physical replication slots, `pg_logical_emit_message`,
  `pg_backup_start/stop`, `pg_switch_wal`.
- **NOTICE / INFO messages** (VACUUM VERBOSE, RAISE): use the `onNotice` exec option.
- **Server settings at startup:** `PGlite.create({ postgresqlconf: ['max_prepared_transactions = 10', …] })` enables
  2PC (`PREPARE TRANSACTION`, `pg_prepared_xacts`) and `track_commit_timestamp`.

## Does not work (simulate it instead)

- **One backend only.** There are no concurrent sessions, so lock waits, deadlocks and SSI conflicts must be simulated.
- **A lock wait can never time out.** `lock_timeout` does not fire, and the tab freezes. Probe locked rows only with
  `NOWAIT` or `SKIP LOCKED`, and always resolve prepared transactions within the same preset.
- **A running statement cannot be interrupted.** `statement_timeout` does not fire either, and on the main thread no
  timer runs while a query does. An endless recursive query freezes the tab; only a Web Worker could be terminated.
- **No parallel query** (`max_parallel_workers = 0`), **no JIT**, **no lz4** (TOAST and WAL compression use pglz only),
  `io_method = sync`.
- **No streaming or logical replication.** `CREATE SUBSCRIPTION` fails (no libpqwalreceiver) and `test_decoding` is not
  shipped. Reading a pgoutput slot misbehaves, so avoid logical decoding.
- **No `postgres_fdw`, `dblink` or `file_fdw`.** Catalog objects (wrapper, server, user mapping) can still be created.
- **ICU collations** ignore `-u-` keywords (`und-u-ks-level2` stays case-sensitive). The older form
  `'und@colStrength=secondary'` works.
- **Cumulative statistics** update only after `SELECT pg_stat_force_next_flush();`.
- `RESET SESSION AUTHORIZATION` does not restore the original user: use `SET SESSION AUTHORIZATION postgres`.
- `pg_get_wal_records_info` reads only flushed WAL: read up to `pg_current_wal_lsn()`.
- **Multi-statement strings** run as one implicit transaction, so VACUUM and `CREATE INDEX CONCURRENTLY` fail. The site
  splits scripts into statements like psql (`app/src/playground/split.ts`).
- `PREPARE TRANSACTION` is disabled by default (`max_prepared_transactions = 0`); enable it with `postgresqlconf`.
