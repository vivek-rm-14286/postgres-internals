# T4 — Neon: PL/pgSQL, PostgreSQL 18 and 19 new features, Python/Java (JDBC)/C#/PHP drivers, API, misc

Source: Neon tutorial pages (neon.com/postgresql/...), rendered text in `scratchpad/ext/neon/`. Secondary source only: the
official PG 18 docs (slices A-O) stay authoritative. PG18 facts below were cross-checked against slice N
(`N-appendixes-errors-limits-glossary-release-notes.md`, release-18 notes). Every Neon page opens with the same
"Lakebase Postgres ... Neon/Databricks" marketing paragraph; it is ignored throughout.

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 15 | 18-new-features.txt | PG18 overview: AIO, skip scan, virtual generated cols default, uuidv7, OLD/NEW RETURNING, WITHOUT OVERLAPS, OAuth, MD5 deprecation, checksums default, NOT VALID, protocol 3.2; Neon runs PG18 with io_method=sync (preview). |
| 0 | 18__array-bytea-improvements.txt | array_sort, array_reverse (first dimension only), reverse(bytea), integer<->bytea casts (fixed width, big-endian, two's complement), MIN/MAX on arrays and composites. |
| 1 | 18__asynchronous-io.txt | io_method sync/worker/io_uring, io_workers (default 3), restart needed, test harness with 500k rows; written against Beta 1; contains a pg_prewarm misuse. |
| 2 | 18__autovacuum-maintenance-configuration.txt | autovacuum_worker_slots (restart) vs autovacuum_max_workers (reload), autovacuum_vacuum_max_threshold, total_*vacuum/analyze_time columns, track_cost_delay_timing, pg_signal_autovacuum_worker. |
| 3 | 18__enhanced-explain.txt | EXPLAIN ANALYZE auto-BUFFERS, "Index Searches: N", fractional rows=0.00, BUFFERS OFF; one sample output mismatched to its query. |
| 4 | 18__enhanced-returning.txt | RETURNING old./new. for INSERT/UPDATE/DELETE/MERGE, ON CONFLICT old row, `RETURNING WITH (OLD AS before, NEW AS after)`; inventory sample schema. |
| 5 | 18__logical-replication-improvements.txt | publish_generated_columns = none/stored, subscriber column must not be GENERATED, pg_stat_subscription_stats confl_* columns, streaming default parallel, ALTER SUBSCRIPTION SET (two_phase). |
| 6 | 18__not-null-as-not-valid.txt | `ADD CONSTRAINT n NOT NULL col NOT VALID`, then VALIDATE CONSTRAINT; NOT NULL in pg_constraint contype='n'; users sample with NULL emails. |
| 7 | 18__oauth-authentication.txt | pg_hba `oauth issuer= scope= validator= map= delegate_ident_mapping=1`, oauth_validator_libraries, --with-libcurl, libpq oauth_issuer/oauth_client_id; not supported on Neon. |
| 8 | 18__pg-stat-io.txt | pg_stat_io read_bytes/write_bytes/extend_bytes (op_bytes removed), object='wal', pg_stat_get_backend_io/wal(pid), pg_stat_reset_shared('io'), pg_stat_reset_backend_stats(pid). |
| 9 | 18__psql-improvements.txt | psql pipelines (\startpipeline ... \endpipeline, \syncpipeline, \getresults), \parse / \bind_named / \close_prepared, %P prompt, PIPELINE_* variables, SERVICE. |
| 10 | 18__security-improvements.txt | Wire protocol 3.2 (first since 3.0 in 7.4/2003), 256-bit cancel keys, libpq still defaults to 3.0, ssl_tls13_ciphers, pgcrypto fips_mode() and builtin_crypto_enabled on/off/fips. |
| 11 | 18__skip-scan-btree.txt | Skip scan on (region, category, sale_date) with 100k generated rows; low-cardinality leading columns; contains a skewed-random data generator. |
| 12 | 18__temporal-constraints.txt | PRIMARY KEY/UNIQUE (... WITHOUT OVERLAPS), FOREIGN KEY (..., PERIOD col), btree_gist needed for scalar parts; two example inserts in the page would actually fail. |
| 13 | 18__uuidv7-support.txt | uuidv7(), uuidv7(interval shift), uuidv4() alias, uuid_extract_timestamp/version; v4 vs v7 index comparison table. |
| 14 | 18__virtual-generated-columns.txt | VIRTUAL default vs STORED, cannot index virtual columns (expression index workaround), only stored ones replicate; e-commerce sample schema. |
| 245 | postgresql-19-new-features.txt | PG19 overview (Beta 1 2026-06-04): SQL/PGQ (since reverted), ON CONFLICT DO SELECT, FOR PORTION OF, IGNORE NULLS, pg_plan_advice, Memoize estimates, REPACK, parallel autovacuum, COPY JSON, sequence sync, EXCEPT TABLE, online checksums, breaking changes. PG19 only. |
| 233 | postgresql-19__breaking-changes.txt | PG19: jit off, lz4 TOAST default, RADIUS removed, standard_conforming_strings forced, MD5 auth warnings + SCRAM migration order, max_locks 128, MULE_INTERNAL removed, btree_gist inet opclasses, BUFFERPIN->BUFFER. |
| 234 | postgresql-19__json-copy-to.txt | PG19 COPY TO (FORMAT JSON[, FORCE_ARRAY]); comparison with row_to_json-in-COPY and json_agg workarounds (PG18-runnable). |
| 235 | postgresql-19__logical-replication-improvements.txt | PG19 FOR ALL SEQUENCES sync, FOR ALL TABLES EXCEPT (TABLE ...), effective_wal_level, COPY partitioned TO; replication lag query. |
| 236 | postgresql-19__monitoring-operations.txt | PG19 online checksums, wal_fpi_bytes, vacuum progress mode/started_by, per-process log_min_messages, psql %i/%S, WAIT FOR LSN, effective_wal_level, 64-bit MultiXactOffset. |
| 237 | postgresql-19__on-conflict-do-select.txt | PG19 ON CONFLICT DO SELECT [FOR UPDATE...] [WHERE] RETURNING; no-op DO UPDATE dead-tuple problem and DO NOTHING+CTE race (PG18-runnable); benchmark tps. |
| 238 | postgresql-19__parallel-autovacuum.txt | PG19 autovacuum_max_parallel_workers (default 0), per-table autovacuum_parallel_workers, index phases only, memory = mwm x (1+workers). |
| 239 | postgresql-19__pg-plan-advice.txt | PG19 contrib pg_plan_advice: EXPLAIN (PLAN_ADVICE), pg_plan_advice.advice GUC, hint tags, feedback (matched/not matched), limitations. |
| 240 | postgresql-19__query-improvements.txt | PG19 IGNORE NULLS / RESPECT NULLS for 5 window functions (sensor gap-fill), Memoize Estimates line; PG18 correlated-subquery workaround. |
| 241 | postgresql-19__repack-command.txt | PG19 REPACK [(CONCURRENTLY, ANALYZE, VERBOSE)] [USING INDEX]; logical-decoding based online mode, restrictions, pg_stat_progress_repack. |
| 242 | postgresql-19__schema-management.txt | PG19 pg_get_database_ddl / pg_get_role_ddl / pg_get_tablespace_ddl (option pairs), pg_dumpall -Fc/-Fd/-Ft with selective pg_restore. |
| 243 | postgresql-19__sql-pgq-graph-queries.txt | SQL/PGQ CREATE PROPERTY GRAPH / GRAPH_TABLE MATCH over social schema; REVERTED from PG19 on 2026-09-07 (earliest PG20). |
| 244 | postgresql-19__temporal-data-operations.txt | PG19 UPDATE/DELETE FOR PORTION OF: automatic row split (0/1/2 leftovers), TO NULL, RETURNING/trigger/privilege details; product_prices, salaries, bookings, policies. |
| 204 | plpgsql.txt | PL/pgSQL section index: 9-part progression (getting started, variables, messages, control, functions, exceptions, procedures, cursors, triggers). |
| 211 | plpgsql__introduction-to-postgresql-stored-procedures.txt | Why PL/pgSQL: fewer round trips, no intermediate results over the wire; drawbacks (skills, versioning/debugging, portability); default since 9.0. |
| 207 | plpgsql__dollar-quoted-string-constants.txt | '' doubling vs $$...$$ vs $tag$...$tag$; DO and CREATE FUNCTION bodies as string constants. |
| 217 | plpgsql__plpgsql-block-structure.txt | [<<label>>] DECLARE/BEGIN/END, DO anonymous blocks, nested subblocks (x=1 y=3). |
| 231 | plpgsql__plpgsql-variables.txt | Declaration syntax, = vs :=, NULL default, initializer evaluated at block entry (clock_timestamp demo), %TYPE, shadowing + label-qualified outer variable. |
| 215 | plpgsql__pl-pgsql-select-into.txt | SELECT ... INTO v1, v2 (actor count 200, actor 1 Penelope Guiness), %TYPE variables. |
| 214 | plpgsql__pl-pgsql-row-types.txt | table%ROWTYPE row variables, dot access (actor 10). |
| 229 | plpgsql__plpgsql-record-types.txt | record placeholder type, structure set on assignment, FOR rec IN query. |
| 219 | plpgsql__plpgsql-constants.txt | CONSTANT keyword, "vat is declared CONSTANT" error, constant initializer evaluated at run time. |
| 221 | plpgsql__plpgsql-errors-messages.txt | RAISE levels (default EXCEPTION), client_min_messages, USING HINT/DETAIL/ERRCODE, RAISE SQLSTATE / condition name, CONTEXT inline_code_block. |
| 212 | plpgsql__pl-pgsql-assert.txt | ASSERT cond [, msg], false/NULL -> assert_failure P0004, plpgsql.check_asserts. |
| 227 | plpgsql__plpgsql-if-else-statements.txt | IF / ELSE / ELSIF with FOUND after SELECT INTO; length classifier with a 120 boundary gap. |
| 218 | plpgsql__plpgsql-case-statement.txt | Simple vs searched CASE statement, case_not_found, statement vs expression; sum()-INTO-FOUND dead-branch bug. |
| 228 | plpgsql__plpgsql-loop-statements.txt | LOOP/EXIT WHEN, labels, nested loops (3x3 grid). |
| 216 | plpgsql__pl-pgsql-while-loop.txt | WHILE pre-test loop, counter 0..4. |
| 223 | plpgsql__plpgsql-for-loop.txt | Integer FOR (REVERSE, BY), FOR over query, FOR ... IN EXECUTE ... USING with $1. |
| 222 | plpgsql__plpgsql-exit.txt | EXIT [label] [WHEN] for inner vs outer loop, EXIT from a labeled block. |
| 213 | plpgsql__pl-pgsql-continue.txt | CONTINUE [label] [WHEN] — odd numbers 1..9. |
| 220 | plpgsql__plpgsql-cursor.txt | DECLARE/OPEN/FETCH/EXIT WHEN NOT FOUND/CLOSE; OUT params + RETURNS SETOF RECORD + RETURN NEXT. |
| 210 | plpgsql__exception.txt | EXCEPTION WHEN no_data_found/too_many_rows/SQLSTATE 'P0002'/'P0003', INTO STRICT, re-raise yields P0001. |
| 205 | plpgsql__create-function.txt | CREATE FUNCTION skeleton, get_film_count, positional/named (=> and :=)/mixed notation, named-before-positional error. |
| 225 | plpgsql__plpgsql-function-parameters.txt | IN/OUT/INOUT table, get_film_stat composite vs expanded, swap(INOUT x, INOUT y). |
| 224 | plpgsql__plpgsql-function-overloading.txt | get_rental_duration(int) vs (int,date); DEFAULT causes 42725 "is not unique" ambiguity (page miscounts functions). |
| 226 | plpgsql__plpgsql-function-returns-a-table.txt | RETURNS TABLE + RETURN QUERY (release_year::integer cast), RETURN NEXT row-by-row variant. |
| 230 | plpgsql__plpgsql-returns-setof.txt | RETURNS SETOF film; SELECT f(), (f()).col, (f()).*, SELECT * FROM f(). |
| 208 | plpgsql__drop-function.txt | DROP FUNCTION [IF EXISTS] name(args) [CASCADE|RESTRICT], non-unique name error 42725, multiple names. |
| 206 | plpgsql__create-procedure.txt | CREATE PROCEDURE (PG11), CALL, COMMIT inside procedure, accounts/transfer example; claims "no OUT mode" (outdated since PG14). |
| 209 | plpgsql__drop-procedure.txt | DROP PROCEDURE with overloads, argument lists, multiple; insert_actor body ignores params. |
| 232 | plpgsql__stored-procedure-with-inout-parameters.txt | INOUT (with DEFAULT) procedures: CALL count_film(), CALL inside DO writes back to variable, film_stat. |
| 68 | api.txt | API section index: C# (Npgsql/ADO.NET), JDBC, PHP (PDO), Python (psycopg2). |
| 246 | python.txt | Python index: psycopg2 (libpq wrapper, DB-API 2.0, type adaptation), suppliers sample DB (vendors, parts, part_drawings, vendor_parts). |
| 249 | python__connect.txt | venv + pip install psycopg2, database.ini + configparser, connect(**config); with-block does not close the connection in psycopg2. |
| 250 | python__create-tables.txt | suppliers DDL (4 tables, FKs ON UPDATE/DELETE CASCADE) executed via cursor in with-blocks. |
| 252 | python__insert.txt | INSERT ... RETURNING vendor_id with %s, fetchone, commit; executemany for 6 vendors. |
| 256 | python__update.txt | UPDATE with %s params, cur.rowcount. |
| 254 | python__query.txt | fetchone / fetchall / fetchmany + generator; parts-vendors join output. |
| 255 | python__transaction.txt | Implicit BEGIN, commit/rollback, autocommit for CREATE DATABASE/VACUUM, with conn = transaction scope; add_part FK-failure atomicity demo. |
| 251 | python__delete.txt | DELETE with params, rowcount. |
| 253 | python__python-call-postgresql-functions.txt | callproc vs SELECT * FROM fn(%s); get_parts_by_vendor RETURNS TABLE. |
| 248 | python__call-stored-procedures.txt | CALL add_new_part(%s,%s) + commit; procedure with INSERT ... RETURNING INTO. |
| 247 | python__blob.txt | BYTEA (no BLOB type), psycopg2.Binary write, read back to file. |
| 128 | jdbc.txt | JDBC index: setup, CRUD, stored functions, transactions. |
| 130 | jdbc__connecting-to-postgresql-database.txt | pgjdbc 42.7.1 jar, db.properties, DriverManager.getConnection, try-with-resources (DB.connect returns null on error). |
| 131 | jdbc__create-tables.txt | Statement.executeUpdate for CREATE TABLE products. |
| 133 | jdbc__insert.txt | PreparedStatement ?, RETURN_GENERATED_KEYS + getGeneratedKeys, addBatch/executeBatch for 9 products. |
| 134 | jdbc__query.txt | Statement vs PreparedStatement vs CallableStatement; execute/executeQuery/executeUpdate; ResultSet loop; findById. |
| 136 | jdbc__update.txt | UPDATE via PreparedStatement, affected rows. |
| 132 | jdbc__delete.txt | DELETE via PreparedStatement. |
| 135 | jdbc__transaction.txt | setAutoCommit(false), commit, rollback in catch, close in finally. |
| 129 | jdbc__call-postgresql-stored-function.txt | CallableStatement {? = call initcap(?)}; SELECT * FROM find_products(?) with p_-prefixed RETURNS TABLE columns. |
| 70 | csharp.txt | C# index: Npgsql/ADO.NET connect, CRUD, CSV import, transactions, functions, procedures. |
| 73 | csharp__csharp-connect.txt | elearning DB, role ed + GRANT ON SCHEMA public, appsettings.json, NpgsqlConnection.OpenAsync, NpgsqlDataSource (Npgsql 7+). |
| 74 | csharp__csharp-create-table.txt | courses/students/enrollments DDL with identity columns via dataSource.CreateCommand. |
| 77 | csharp__csharp-insert.txt | @named parameters, AddWithValue, DateOnly, ExecuteNonQueryAsync. |
| 78 | csharp__csharp-select.txt | ExecuteReaderAsync/ReadAsync/Get*, parameterized date filter, ExecuteScalarAsync count. |
| 80 | csharp__csharp-update.txt | UPDATE example with invalid SQL ("UPDATE email = @email FROM students"). |
| 75 | csharp__csharp-delete.txt | DELETE with @id parameter. |
| 79 | csharp__csharp-transaction.txt | invoices table, 5 courses, BeginTransactionAsync + commands bound to tx, Commit/RollbackAsync. |
| 76 | csharp__csharp-import-csv-file.txt | CsvHelper + row-by-row INSERT of 10 students (no COPY). |
| 72 | csharp__csharp-call-postgresql-function.txt | get_student_count(date,date) called with SELECT fn($1,$2). |
| 71 | csharp__csharp-call-a-stored-procedure.txt | enroll_student procedure (DOUBLE PRECISION params) called with CALL ...($1..$5). |
| 194 | php.txt | PHP index: PDO + PDO_PGSQL driver. |
| 197 | php__connect.txt | Composer PSR-4 project, database.ini + parse_ini_file, pgsql: DSN, ERRMODE_EXCEPTION, singleton Connection, SQLSTATE[08006] errors. |
| 198 | php__create-tables.txt | stocks + stock_valuations DDL via exec(); information_schema.tables listing. |
| 200 | php__insert.txt | prepare/bindValue/execute, lastInsertId('stocks_id_seq'), 4 stocks. |
| 203 | php__update.txt | UPDATE + rowCount (GOOG -> GOOGL / Alphabet Inc.). |
| 201 | php__query.txt | query()+fetch(FETCH_ASSOC), prepared findByPK + fetchObject, htmlspecialchars output. |
| 199 | php__delete.txt | delete(id) and deleteAll() with rowCount. |
| 202 | php__transaction.txt | ACID, beginTransaction/commit/rollBack; accounts/plans/account_plans with FK-failure rollback (plan 99). |
| 196 | php__call-stored-procedures.txt | Functions add(a,b) via SELECT * FROM add(:a,:b) + fetchColumn; get_accounts() RETURNS TABLE join. |
| 195 | php__blob.txt | company_files: pgsqlLOBCreate/Open/Unlink large objects stored into a BYTEA column (stores the OID digits; buggy). |

## Teaching material by topic

### PG18 overview: how Neon frames the release  [M1-M7]  (source: 18-new-features.txt)
- Angle: three buckets, "Performance" (AIO, skip scan, OR->ANY, parallel GIN builds, partition pruning), "Developer
  Experience" (uuidv7, virtual generated columns, OLD/NEW RETURNING, WITHOUT OVERLAPS), "Operations" (pg_upgrade keeps
  statistics, `--jobs`, `--swap`, EXPLAIN buffers by default, checksums default, NOT VALID NOT NULL). A good table-of-
  contents for a "What changed in 18" lesson; every claim matches the release notes in slice N.
- Release date given as September 25, 2025 (matches slice N).
- Notes worth reusing verbatim: "`uuidv4()` in this release is now an alias for `gen_random_uuid`"; "MD5 ... will still
  work"; "libpq continues to use version 3.0 by default" for wire protocol 3.2.
- Local try-out: `docker run --name pg18 -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:18`.
- Pitfall in the page: the "NOT NULL Constraints as NOT VALID" snippet actually shows the OLD workaround
  `ADD CONSTRAINT users_email_not_null CHECK (email IS NOT NULL) NOT VALID`. The real PG18 syntax is
  `ADD CONSTRAINT name NOT NULL col NOT VALID` (see the dedicated page below). Use the dedicated page's syntax in lessons.
- Pitfall: the overview's `orders` table puts `audit_info TEXT GENERATED ALWAYS AS (...) STORED` as a placeholder; not runnable.

### PG18 array and bytea functions  [M2, M3]  (source: 18__array-bytea-improvements.txt)
- Worked examples with results (all runnable on PG18 / PGlite):
  ```sql
  SELECT array_sort(ARRAY[3,1,4,1,5,9,2,6]);          -- {1,1,2,3,4,5,6,9}
  SELECT array_sort(ARRAY['zebra','apple','banana']);  -- {apple,banana,zebra}
  SELECT array_reverse(ARRAY[1,2,3,4,5]);              -- {5,4,3,2,1}
  SELECT array_reverse(ARRAY[ARRAY[1,2],ARRAY[3,4]]);  -- {{3,4},{1,2}}  (first dimension only)
  SELECT reverse('\x12345678'::bytea);                 -- \x78563412  (endianness flip)
  SELECT 1234::bytea;                                  -- \x000004d2
  SELECT (-1234)::bytea;                               -- \xfffffb2e  (two's complement)
  SELECT 123::smallint::bytea;                         -- \x007b            (2 bytes)
  SELECT 123::integer::bytea;                          -- \x0000007b        (4 bytes)
  SELECT 123::bigint::bytea;                           -- \x000000000000007b (8 bytes)
  SELECT '\x007b'::bytea::smallint;                    -- 123
  ```
- Key teaching point: the cast width depends on the TYPE, not the value (int4 is always 4 bytes, most significant byte
  first). Ties directly to M2 "fixed-width types and alignment" and to reading raw tuple bytes with pageinspect.
- MIN/MAX on arrays compares lexicographically element by element: `{1,3} < {2,1}`. Composite types compare field by field
  left to right; every field type needs `<`/`>` or it errors.
  ```sql
  CREATE TABLE sales_data (product VARCHAR(50), monthly_sales INTEGER[]);
  INSERT INTO sales_data VALUES ('Laptop',ARRAY[45,52,38]),('Mouse',ARRAY[67,71,58]),('Keyboard',ARRAY[23,28,15]);
  SELECT MIN(monthly_sales), MAX(monthly_sales) FROM sales_data;   -- {23,28,15} | {67,71,58}
  CREATE TYPE product_rating AS (average_score DECIMAL(3,2), review_count INTEGER);
  SELECT MIN(rating), MAX(rating) FROM (VALUES (ROW(4.5,120)::product_rating),(ROW(4.2,89)::product_rating),
         (ROW(4.8,156)::product_rating)) AS ratings(rating);       -- (4.20,89) | (4.80,156)
  ```
- Pitfall the page raises: MIN/MAX over arrays "cannot benefit from standard B-tree indexes" (claim is the page's; arrays
  do have a btree opclass, so treat this as unverified and test with EXPLAIN before teaching it).

### PG18 asynchronous I/O  [M1, M4, M7]  (source: 18__asynchronous-io.txt, 18-new-features.txt)
- Angle: "before: each read blocks; after: start many reads and keep working". Three io_method values explained as a
  ladder: `sync` (PG17 behaviour, posix_fadvise hints), `worker` (dedicated I/O worker processes, `io_workers` default 3),
  `io_uring` (Linux 5.1+, build with `--with-liburing`, shared ring buffer with the kernel, fewest syscalls).
- `io_method` needs a server restart; check with `SELECT name, setting, pending_restart FROM pg_settings WHERE name='io_method';`.
- Page states reads only: writes, including WAL writes, stay synchronous; supported paths are sequential scans, bitmap heap
  scans, and maintenance (VACUUM). Matches the release-note wording (seq scans, bitmap heap scans, vacuums, "other operations").
- Tuning advice from the page: start `io_workers` around half the CPU cores; raise `effective_io_concurrency` /
  `maintenance_io_concurrency` (page uses 16 then 32; PG18 default is already 16 per slice N); benefit is largest on
  network/cloud storage and cold reads, small on local NVMe or high cache-hit workloads; dataset must exceed shared_buffers.
- Monitoring: `pg_aios` view (named in the overview page); `pg_stat_activity` filtered by `backend_type` shows io workers;
  `track_io_timing = on` adds "I/O Timings" to EXPLAIN.
- PITFALLS in the page (do not copy into lessons):
  1. "Clear buffer cache for the test table: `SELECT pg_prewarm('async_io_test'::regclass, 'buffer', 'main', NULL, NULL);`"
     is backwards: pg_prewarm LOADS the relation into shared buffers. In PG18 use pg_buffercache's
     `pg_buffercache_evict_relation('async_io_test')` (new in 18, per slice N), and note the OS page cache still holds data.
  2. Written for Beta 1 ("worker method (default in Beta 1)"). In the final release `worker` is the default io_method.
  3. "Test if io_uring is supported: ALTER SYSTEM ...; SELECT pg_reload_conf();" does nothing because io_method is
     restart-only.
- Neon-specific: Neon PG18 runs with `io_method = 'sync'` during preview; its prefetch code is not yet optimized for 18.
- PGlite: single process, no I/O workers, no restart, so AIO is only showable as `SHOW io_method;` plus a visualizer.

### PG18 autovacuum controls  [M7]  (source: 18__autovacuum-maintenance-configuration.txt)
- Angle: separate "reserved capacity" from "active capacity": `autovacuum_worker_slots` (default 16, shared memory,
  restart) vs `autovacuum_max_workers` (reload, capped at slots with a warning if set higher).
  ```sql
  ALTER SYSTEM SET autovacuum_max_workers = 10; SELECT pg_reload_conf();
  ```
- The trigger formula as the motivating arithmetic: threshold = `autovacuum_vacuum_threshold` (50) +
  `autovacuum_vacuum_scale_factor` (0.2) x reltuples. 10M rows -> over 2M dead tuples before autovacuum; 100M -> 20M.
  New cap `autovacuum_vacuum_max_threshold` (default 100,000,000; the page suggests far lower, e.g. 100000) and per table:
  `ALTER TABLE user_sessions SET (autovacuum_vacuum_max_threshold = 10000);`
  Teaching hook: plot min(threshold + sf*n, max_threshold) against n — a straight line that flattens.
- New cumulative columns in `pg_stat_all_tables`: `total_vacuum_time`, `total_autovacuum_time`, `total_analyze_time`,
  `total_autoanalyze_time` (matches slice N). Query from the page:
  ```sql
  SELECT relname, total_autovacuum_time, autovacuum_count,
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname))
  FROM pg_stat_all_tables WHERE autovacuum_count > 0 ORDER BY total_autovacuum_time DESC LIMIT 10;
  ```
- `track_cost_delay_timing = on` adds `delay_time` to `pg_stat_progress_vacuum` (slice N: also progress_analyze, logs, VERBOSE).
- Predefined role `pg_signal_autovacuum_worker`: `GRANT pg_signal_autovacuum_worker TO maintenance_admin;` lets a
  non-superuser `pg_terminate_backend()` an autovacuum worker blocking DDL.
- Pitfall in the page: it finds autovacuum workers with `query LIKE '%autovacuum%'`; better `WHERE backend_type =
  'autovacuum worker'` (query text is "autovacuum: VACUUM public.t"). Also "PostgreSQL 18 is currently in beta" is stale.

### PG18 EXPLAIN: BUFFERS by default, Index Searches  [M4]  (source: 18__enhanced-explain.txt)
- Angle: "you no longer have to remember BUFFERS". Shows PG17-style output next to PG18 output for the same query.
- What to point at in PG18 output: `Buffers: shared hit=43 read=2` (also under a separate "Planning:" block — planning
  reads catalog pages), `I/O Timings: shared read=0.061` (needs track_io_timing), `Index Searches: 1` per index scan node,
  and fractional `rows=0.00` (release notes: fractional row counts).
- Interpretation vocabulary from the page: shared hit = found in shared buffers; shared read = from disk or OS cache;
  dirtied/written = modified pages.
- Opt out: `EXPLAIN (ANALYZE, BUFFERS OFF) ...`.
- Lesson-worthy sample schema: `orders(order_id, customer_id, order_date, total_amount)` + `customers(...)` + `products(...)`
  (see Reusable sample schemas).
- PITFALLS in the page: the "CPU usage statistics" sample output is an `Update on public.products` plan with a bitmap
  scan, not the GROUP BY query it claims to explain, and it shows no CPU lines. Per slice N, the CPU/WAL/average-read
  statistics are in `ANALYZE VERBOSE` / `VACUUM VERBOSE` output, while EXPLAIN gained `(WAL)` full-buffer counts — do not
  teach "EXPLAIN VERBOSE shows CPU usage". The "Nested Loop" example's output is actually a Hash Join on empty tables.
  For an "Index Searches > 1" demo use an IN-list or skip scan (see below), which really shows several descents.

### PG18 RETURNING with OLD and NEW  [M3]  (source: 18__enhanced-returning.txt, 18-new-features.txt)
- Angle: the old rule ("INSERT/UPDATE return new, DELETE returns old, MERGE whatever ran") versus now explicit `old.` /
  `new.` qualifiers in any DML. Per-operation truth table to animate:
  | op | old | new |
  |---|---|---|
  | INSERT | NULL | inserted row |
  | INSERT ... ON CONFLICT DO UPDATE | existing conflicting row | updated row |
  | UPDATE | before image | after image |
  | DELETE | deleted row | NULL (unless a rule turns it into an UPDATE) |
  | MERGE | per action taken | per action taken |
- Worked example (inventory schema below), with result from the page:
  ```sql
  ALTER TABLE inventory ADD CONSTRAINT unique_product_name UNIQUE (product_name);
  INSERT INTO inventory (product_name, category, quantity, unit_price)
  VALUES ('Laptop Computer','Electronics',25,1099.99)
  ON CONFLICT (product_name) DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity,
       unit_price = EXCLUDED.unit_price, last_updated = CURRENT_TIMESTAMP
  RETURNING old.quantity AS original_quantity, new.quantity AS updated_quantity,
            old.unit_price AS original_price, new.unit_price AS updated_price,
            new.quantity - old.quantity AS quantity_added;
  -- 50 | 75 | 999.99 | 1099.99 | 25
  UPDATE inventory SET unit_price = unit_price * 1.05 WHERE category = 'Electronics'
  RETURNING product_name, old.unit_price AS before_price, new.unit_price AS after_price,
            ROUND(new.unit_price - old.unit_price, 2) AS price_increase;
  ```
- Renaming the aliases (for tables with columns named old/new, or inside trigger functions where OLD/NEW already mean
  something): `RETURNING WITH (OLD AS before, NEW AS after) before.quantity, after.quantity`.
- Practical patterns: audit rows in one round trip (no SELECT-before-UPDATE race), "stock_status" CASE expressions on the
  delta, soft-delete with `old.status` / `new.status`, COALESCE(old.x, 0) for INSERT paths.
- Pitfall: an unqualified column in RETURNING still means the new value for INSERT/UPDATE and the old for DELETE.
- Page's "keep both row versions in memory, batch large updates" performance advice is generic, not a documented cost.
- Lesson fit: pair with an MVCC visualizer — UPDATE creates a new tuple version; `old` is literally the tuple whose
  xmax is being set, `new` the freshly inserted version (M5 tie-in).

### PG18 logical replication of generated columns, conflict stats  [M7]  (source: 18__logical-replication-improvements.txt, 18__virtual-generated-columns.txt)
- `CREATE PUBLICATION my_pub FOR TABLE products WITH (publish_generated_columns = stored);` values `none` (default) |
  `stored`. Virtual generated columns are never replicated. A publication column list overrides the option (a listed
  generated column is published).
- Subscriber side: the target column must be a regular column; if the subscriber column is also GENERATED, apply errors.
  Subscribers older than 18 do not copy generated columns during initial sync.
- `pg_stat_subscription_stats`: `apply_error_count`, `sync_error_count`, `confl_insert_exists`,
  `confl_update_origin_differs`, `confl_update_exists`, `confl_update_missing`, `confl_delete_origin_differs`,
  `confl_delete_missing`, `confl_multiple_unique_conflicts`, `stats_reset`. The `*_origin_differs` counters need
  `track_commit_timestamp = on` on the subscriber.
- Resolution options: `ALTER SUBSCRIPTION ... SKIP`, fix subscriber data, change settings.
- `CREATE SUBSCRIPTION` `streaming` default changed off -> parallel (existing subscriptions keep their setting);
  `ALTER SUBSCRIPTION my_sub SET (two_phase = true);` now allowed.
- PGlite: no replication; teach with diagrams only.

### PG18 NOT NULL ... NOT VALID and named NOT NULL constraints  [M3, M5, M7]  (source: 18__not-null-as-not-valid.txt)
- Angle: "separate adding from validating". Old way `ALTER COLUMN email SET NOT NULL` = ACCESS EXCLUSIVE + full scan
  (50M rows, ~5 min, table unavailable). New way:
  ```sql
  CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(50), email VARCHAR(100),
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
  INSERT INTO users (username, email) VALUES ('alice','alice@example.com'),('bob',NULL),
         ('charlie','charlie@example.com'),('diana',NULL);
  ALTER TABLE users ADD CONSTRAINT users_email_not_null NOT NULL email NOT VALID;  -- instant, existing NULLs stay
  INSERT INTO users (username, email) VALUES ('eve', NULL);
  -- ERROR: null value in column "email" of relation "users" violates not-null constraint
  ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null;
  -- ERROR: column "email" of relation "users" contains null values
  UPDATE users SET email = username || '@example.com' WHERE email IS NULL;
  ALTER TABLE users VALIDATE CONSTRAINT users_email_not_null;                      -- succeeds
  SELECT conname, contype, convalidated, pg_get_constraintdef(oid)
  FROM pg_constraint WHERE conrelid = 'users'::regclass AND contype = 'n';
  ```
- Production workflow: (1) add NOT VALID, (2) backfill in batches (`WHERE email IS NULL AND id BETWEEN 1 AND 10000`),
  (3) VALIDATE. Page claims VALIDATE takes SHARE UPDATE EXCLUSIVE — true for CHECK/FK validation per ALTER TABLE docs;
  confirm the lock level for NOT NULL validation against the ALTER TABLE page in the docs slice before teaching it.
- Why prefer the native form over `CHECK (email IS NOT NULL) NOT VALID`: the optimizer and tools recognize attnotnull /
  contype 'n'. NOT NULL now lives in `pg_constraint` (slice N), which is why it can be named.

### PG18 OAuth authentication  [M6]  (source: 18__oauth-authentication.txt)
- Angle: Postgres becomes an OAuth resource server — it validates bearer tokens, never issues them.
- pg_hba.conf: `host myapp all 0.0.0.0/0 oauth issuer=https://your-provider.com scope="openid profile"`; options
  `issuer` (must match exactly, no trailing slash differences), `scope`, `validator` (required with several libraries),
  `map` (pg_ident.conf), `delegate_ident_mapping=1` (validator decides the role; dangerous).
- postgresql.conf: `oauth_validator_libraries = 'your_oauth_validator'`. Build with `--with-libcurl` for client support.
- libpq/psql: `oauth_issuer`, `oauth_client_id`, `oauth_client_secret`, `oauth_scope`, `require_auth=oauth`; device
  authorization flow for CLIs; discovery via `/.well-known/openid-configuration`; HTTPS enforced.
- Page's `oauth_token=` connection parameter: not in the release-note list in slice N; treat as unverified.
- Not supported on Neon; not available in PGlite. Diagram-only lesson.

### PG18 pg_stat_io and per-backend stats  [M1, M7]  (source: 18__pg-stat-io.txt)
- Three dimensions to teach: backend_type (client backend, autovacuum worker, background writer, checkpointer, walwriter,
  ...), object (`relation`, `temp relation`, new `wal`), context (`normal`, `bulkread`, `bulkwrite`, `vacuum`, `init`).
- New in 18: `read_bytes`, `write_bytes`, `extend_bytes`; `op_bytes` removed because I/O sizes vary with
  `io_combine_limit`; WAL rows. Per-backend functions `pg_stat_get_backend_io(pid)` and `pg_stat_get_backend_wal(pid)`.
  ```sql
  SELECT backend_type, reads, hits, (hits * 100 / (reads + hits)) AS hit_percent
  FROM pg_stat_io WHERE object = 'relation' AND reads + hits > 0 ORDER BY hit_percent;
  SELECT backend_type, writes, pg_size_pretty(write_bytes) FROM pg_stat_io WHERE object='wal' AND writes > 0;
  SELECT object, context, reads, writes, pg_size_pretty(read_bytes + write_bytes)
  FROM pg_stat_get_backend_io(pg_backend_pid()) WHERE reads > 0 OR writes > 0;
  SELECT a.pid, w.wal_records, pg_size_pretty(w.wal_bytes)
  FROM pg_stat_activity a, pg_stat_get_backend_wal(a.pid) w WHERE w.wal_records > 0;
  SELECT pg_stat_reset_shared('io');  SELECT pg_stat_reset_backend_stats(12345);
  ```
- Rule of thumb from the page: relation hit ratio below 90% suggests too-small shared_buffers or large scans.
- Timing columns need `track_io_timing` / `track_wal_io_timing` (slice N: WAL timing moved from pg_stat_wal to pg_stat_io);
  `pg_test_timing` to measure the overhead.
- Pitfall: `hits * 100 / (reads + hits)` is integer division (truncates); use `round(100.0 * hits / (reads + hits), 1)`.
- PGlite: pg_stat_io exists in PG18; the per-session function is a good playground query.

### PG18 psql pipelines and prepared-statement meta-commands  [M6]  (source: 18__psql-improvements.txt)
- Angle: latency arithmetic — 10 queries at 100 ms RTT = 1 s of waiting; pipelined, about 100 ms.
- Commands: `\startpipeline`, `\endpipeline`, `\syncpipeline` (sync point), `\sendpipeline`, `\flushrequest`, `\flush`,
  `\getresults`. Prompt escape `%P` shows on/off/abort; variables `PIPELINE_SYNC_COUNT`, `PIPELINE_COMMAND_COUNT`,
  `PIPELINE_RESULT_COUNT`; `SERVICE` variable and `%s`.
- Prepared statements: `SELECT name FROM users WHERE id = $1 \parse get_user_name`, `\bind_named get_user_name 42`,
  `\close_prepared get_user_name`; inspect `pg_prepared_statements(name, statement, parameter_types)`.
- PITFALLS in the page: after `\bind_named` the statement is executed by ending the line with `\g`, not by a separate
  `EXECUTE get_user_name;` (EXECUTE is the SQL-level command for PREPARE). In pipeline mode, queries must use the extended
  protocol (e.g. `\bind ... \sendpipeline` or `\g`); plain `;`-terminated simple-protocol queries are not allowed in a
  pipeline in the psql docs — verify the exact rule in the psql docs slice before writing the lesson. The "prompt changes
  to postgres=*#" claim is the transaction-status indicator, not a pipeline indicator.
- PGlite has no psql; this is a protocol lesson (Parse/Bind/Execute/Sync message animation).

### PG18 security: protocol 3.2, cancel keys, TLS 1.3, FIPS  [M6, M1]  (source: 18__security-improvements.txt)
- Protocol 3.2: first new version since 3.0 (PostgreSQL 7.4, 2003); main payload is variable-length cancel keys up to
  256 bits (32-bit = ~4.3 billion values; 256-bit = ~1.1 x 10^77). libpq defaults to 3.0; drivers opt in with new min/max
  protocol version settings; `PQfullProtocolVersion()` reports it; no SQL command shows the protocol version.
- `ssl_tls13_ciphers = 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256'` (empty default = OpenSSL defaults);
  `ssl_ciphers` only covers TLS 1.2 and below.
- pgcrypto: `SELECT fips_mode();` and `pgcrypto.builtin_crypto_enabled` = `on` (default) | `off` | `fips`.
- PGlite: `CREATE EXTENSION pgcrypto; SELECT fips_mode();` is a runnable one-liner (expect false).

### PG18 B-tree skip scan  [M4]  (source: 18__skip-scan-btree.txt, 18-new-features.txt)
- Angle: phone book sorted by (region, category, date); without region you used to read the whole book; skip scan
  "looks up each distinct region and jumps" — effectively one descent per distinct leading value.
- Works best with low-cardinality omitted leading columns (3 regions); bad with millions of user_id values (planner then
  picks seq scan or bitmap). Planner decides automatically from statistics; keep ANALYZE fresh.
- Comparison query: same filter with `region IN ('North','South','West')` — "both should now show similar performance".
- Evidence in EXPLAIN: `Index Searches: N` on the index scan node (N about equal to number of distinct regions + 1).
- PITFALLS in the page:
  1. Data generator `CASE (random() * 3)::int WHEN 0 ... WHEN 1 ... ELSE 'West'` — the cast ROUNDS, so values are 0..3 with
     0 and 3 at half weight: North ~17%, South ~33%, West ~50%. Similar skew for category (0..4). Use
     `floor(random()*3)::int` or `(ARRAY['North','South','West'])[1 + (i % 3)]` for deterministic seeds.
  2. "Requires at least one equality condition on a later column" — the release notes (slice N) say skip scan applies
     when there are no restrictions or only non-equality restrictions on earlier columns and useful restrictions on later
     columns; the page's own main example uses an equality on category plus a range on date.
  3. Page's examples use `GROUP BY category` aggregates where planner may choose a seq scan at 100k rows; show both
     plans and use `SET enable_seqscan = off` only as a teaching aid.

### PG18 temporal constraints (WITHOUT OVERLAPS, PERIOD)  [M3, M4]  (source: 18__temporal-constraints.txt, 18-new-features.txt)
- Angle: start from range types and `&&` (overlap) / `@>` (contains), then "a primary key that means: no two rows for the
  same emp_id whose periods overlap".
  ```sql
  SELECT daterange('2025-01-01','2025-01-31') && daterange('2025-01-15','2025-02-15');  -- true
  SELECT daterange('2025-01-01','2025-01-31') && daterange('2025-02-01','2025-02-28');  -- false
  CREATE EXTENSION btree_gist;   -- GiST opclasses for the scalar part (integer, varchar)
  CREATE TABLE employees (
    emp_id INTEGER, emp_name VARCHAR(100) NOT NULL, department VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL, salary DECIMAL(10,2) NOT NULL,
    valid_period tstzrange NOT NULL DEFAULT tstzrange(now(), 'infinity', '[)'),
    PRIMARY KEY (emp_id, valid_period WITHOUT OVERLAPS));
  INSERT INTO employees VALUES
   (1,'Alice Johnson','Engineering','Software Engineer',75000, tstzrange('2024-01-01','2025-01-01','[)')),
   (1,'Alice Johnson','Engineering','Senior Software Engineer',85000, tstzrange('2025-01-01','infinity','[)')),
   (2,'Bob Wilson','Marketing','Marketing Specialist',60000, tstzrange('2024-06-01','infinity','[)'));
  -- overlapping period for emp 1 -> primary key violation:
  INSERT INTO employees VALUES (1,'Alice Johnson','Engineering','Lead Engineer',95000,
         tstzrange('2024-06-01','2025-06-01','[)'));
  CREATE TABLE project_assignments (assignment_id SERIAL PRIMARY KEY, emp_id INTEGER NOT NULL,
    project_name VARCHAR(100) NOT NULL, assignment_period tstzrange NOT NULL);
  ALTER TABLE project_assignments ADD CONSTRAINT fk_emp_temporal
    FOREIGN KEY (emp_id, PERIOD assignment_period) REFERENCES employees (emp_id, PERIOD valid_period);
  INSERT INTO project_assignments (emp_id, project_name, assignment_period)
  VALUES (1,'Legacy Project', tstzrange('2022-01-01','2022-06-01','[)'));   -- fails: Alice not employed then
  ```
- Key insight to teach: the temporal FK checks that the referenced rows' periods, combined, cover the whole referencing
  period (Alice's two adjacent rows together cover 2024-01-01..infinity, so an assignment spanning the 2025-01-01
  boundary is valid).
- Empty ranges are rejected automatically by temporal PK/UNIQUE. Constraints are backed by GiST indexes — show
  `SELECT indexname, indexdef FROM pg_indexes WHERE tablename='employees';`.
- Querying: `valid_period @> '2024-06-15'::timestamptz` (GiST-indexable) vs `upper(valid_period) > ...` (not indexable
  without an expression index).
- PITFALLS in the page: (1) the department_budgets INSERT puts two Engineering rows with the SAME 2025 daterange and
  comments "Different period, allowed" — it actually raises a unique violation and the whole multi-row INSERT fails;
  (2) the temporal-FK demo re-inserts emp 1 and 2 with periods overlapping rows inserted earlier on the same page, which
  fails against the primary key; run the FK demo on a fresh table. Its comments also mis-state the ranges.
- PG19 adds `UPDATE/DELETE ... FOR PORTION OF` on top of these (see PG19 section) — not in PG18.

### PG18 uuidv7  [M2, M4]  (source: 18__uuidv7-support.txt, 18-new-features.txt)
- Angle: random v4 keys insert "at random locations" in the B-tree -> page splits, poor cache locality; v7 puts a
  48-bit Unix-ms timestamp first so new keys append at the right edge "like a sequence".
- Layout taught by the page: 48 bits ms timestamp, 12 bits sub-millisecond fraction, 62 bits random, 6 bits version and
  variant (RFC 9562).
- Functions: `uuidv7()`, `uuidv7(INTERVAL '-1 hour')` (shifted timestamp), `uuidv4()` (= gen_random_uuid()),
  `uuid_extract_timestamp(u)` (now v1 and v7), `uuid_extract_version(u)` (7 / 4).
  ```sql
  CREATE TABLE users (id UUID PRIMARY KEY DEFAULT uuidv7(), username VARCHAR(50) UNIQUE NOT NULL,
                      email VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
  SELECT id, username, uuid_extract_timestamp(id) FROM users ORDER BY id;
  CREATE TABLE performance_test (id_v4 UUID DEFAULT uuidv4(), id_v7 UUID DEFAULT uuidv7(),
                                 data TEXT DEFAULT 'sample data');
  CREATE INDEX idx_v4 ON performance_test (id_v4);
  CREATE INDEX idx_v7 ON performance_test (id_v7);
  INSERT INTO performance_test (data) SELECT 'test record ' || i FROM generate_series(1, 100000) i;
  ```
- Patterns: multi-tenant `(tenant_id, id)` index gives per-tenant chronological order; distributed event logs ordered by id.
- When to keep bigint identity: not distributed, smallest key (8 vs 16 bytes), integer-only legacy systems.
- PITFALLS in the page: (1) it measures "page splits" with `pg_statio_user_indexes` (idx_blks_read/hit), which does not
  show splits. Better playground: compare `pg_relation_size('idx_v4')` vs `pg_relation_size('idx_v7')`, and
  `bt_page_stats` / `bt_metap` from pageinspect (v4 index ends up with more, half-full leaf pages). (2) "multiple UUIDs
  in the same millisecond may not reflect the exact order" — PG18's implementation uses the 12 sub-ms bits to keep values
  monotonic within a backend; check the uuid functions docs page for the exact guarantee. (3) "Protection against
  enumeration" is partial: v7 exposes creation time to anyone who sees the id.

### PG18 virtual generated columns  [M2, M3]  (source: 18__virtual-generated-columns.txt, 18-new-features.txt)
- Angle: CPU vs storage trade-off. VIRTUAL (the default when neither keyword given) computes on read; STORED computes on
  write and occupies heap space.
  ```sql
  ALTER TABLE products ADD COLUMN selling_price DECIMAL(10,2)
    GENERATED ALWAYS AS (base_price * (1 - discount_rate) * (1 + tax_rate));          -- virtual (default)
  ALTER TABLE products ADD COLUMN profit_amount DECIMAL(10,2)
    GENERATED ALWAYS AS (base_price - cost) VIRTUAL;
  ALTER TABLE products
    ADD COLUMN stored_volume_cm3 INTEGER GENERATED ALWAYS AS (length_cm*width_cm*height_cm) STORED,
    ADD COLUMN virtual_volume_cm3 INTEGER GENERATED ALWAYS AS (length_cm*width_cm*height_cm);
  ```
- Rules from the page: cannot index a virtual column (workaround: expression index on the same expression, or a STORED
  column); only stored generated columns can be logically replicated.
- Choose virtual: cheap expressions, frequently changing inputs, no index needed. Choose stored: indexed, expensive,
  replicated.
- PITFALLS in the page: (1) "With a small overhead for the first read, subsequent queries will benefit" — wrong, a virtual
  column is recomputed on every read; nothing is cached. (2) "table size remains unchanged" — fine for virtual columns,
  but adding a STORED generated column rewrites the table. (3) It omits PG18 restrictions on virtual columns (e.g. the
  generation expression may only use built-in functions/types); take those from the CREATE TABLE docs slice.
- Lesson: pageinspect `heap_page_items` before/after adding a virtual vs stored column — the stored one changes t_data
  length, the virtual one doesn't (M2 visual proof).

### PostgreSQL 19 material — PG19, NOT in PG18/PGlite  [M3, M4, M7]  (source: postgresql-19-new-features.txt and the 12 postgresql-19__*.txt pages)
Everything in this section is "PG19, not in PG18/PGlite". Pages describe PG19 Beta 1 (released 2026-06-04, final expected
late 2026). Use it only for "what's next" sidebars and for motivating PG18 workarounds. Several pages contain a PG18-
runnable "old way" that is the real lesson material; those are marked **PG18-runnable**.

- **SQL/PGQ (CREATE PROPERTY GRAPH, GRAPH_TABLE ... MATCH)** — REVERTED from PG19 on 2026-09-07; earliest return PG20
  (Sept 2027). Do not teach as a PG19 feature. Design idea worth a sidebar: graphs are view-like definitions over existing
  tables; the rewriter turns MATCH patterns into joins; fixed-depth only (no `+`, `*`, `{m,n}` quantifiers), so recursive
  CTEs remain the tool for transitive closure. Sample social schema (users/follows/posts/likes) is reusable in PG18 for
  join/recursive-CTE lessons (see Reusable sample schemas): friends-of-friends of Alice = (Bob, Charlie), (Charlie, Diana).
  Page also mentions `\dG` and catalogs `pg_propgraph_element/label/label_property/property` (beta only).
- **INSERT ... ON CONFLICT (col) DO SELECT [FOR UPDATE|FOR NO KEY UPDATE|FOR SHARE|FOR KEY SHARE] [WHERE ...]
  RETURNING ...** — atomic get-or-create; RETURNING mandatory; conflict target mandatory; only non-deferrable unique
  indexes as arbiters; locking variants need UPDATE privilege on at least one column; multi-row inserts return one row
  per input row. Mailing-list benchmark quoted: PL/pgSQL function 45,092 tps; DO SELECT 35,788; DO NOTHING + CTE 28,929;
  no-op DO UPDATE 9,222.
  **PG18-runnable** lesson material from this page:
  ```sql
  -- (a) no-op DO UPDATE: returns the row but writes a new tuple version on every conflict (dead tuple, WAL, maybe index)
  INSERT INTO users (email, name) VALUES ('alice@example.com','Alice Johnson')
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING *;
  -- (b) DO NOTHING + CTE fallback: no write, but a concurrency window (row committed by another session after the
  --     INSERT's snapshot may be invisible to the SELECT branch -> zero rows)
  WITH ins AS (INSERT INTO users (email, name) VALUES ('alice@example.com','Alice Johnson')
               ON CONFLICT (email) DO NOTHING RETURNING *)
  SELECT * FROM ins UNION ALL
  SELECT * FROM users WHERE email = 'alice@example.com' AND NOT EXISTS (SELECT 1 FROM ins);
  ```
  Visual: run (a) 5 times and show xmin/ctid changing each time (`SELECT ctid, xmin, * FROM users`), then (b) and show
  they stay put. M3/M5 tie-in.
- **UPDATE/DELETE ... FOR PORTION OF range_col FROM a TO b** — splits rows: 0, 1 or 2 "leftover" rows inserted with the
  old values; `TO NULL` = unbounded; RETURNING and row count cover only the targeted rows; leftovers fire INSERT
  triggers but need no INSERT privilege; works with range and multirange types (multirange: one leftover row).
  Example: product 1 at 29.99 for 2025, `UPDATE ... FOR PORTION OF valid_range FROM '2025-07-01' TO '2025-10-01' SET
  price = 34.99` -> three rows (Jan-Jun 29.99, Jul-Sep 34.99, Oct-Dec 29.99).
  **PG18-runnable** equivalent for a lesson (manual split inside one transaction, valid under WITHOUT OVERLAPS because
  the original row is shrunk first):
  ```sql
  BEGIN;
  UPDATE product_prices SET valid_range = tstzrange('2025-07-01','2025-10-01','[)'), price = 34.99
   WHERE product_id = 1 AND valid_range @> '2025-07-01'::timestamptz
  RETURNING old.valid_range AS orig, old.price AS orig_price;   -- PG18 OLD in RETURNING
  INSERT INTO product_prices (product_id, valid_range, price) VALUES
   (1, tstzrange('2025-01-01','2025-07-01','[)'), 29.99), (1, tstzrange('2025-10-01','2026-01-01','[)'), 29.99);
  COMMIT;
  ```
- **IGNORE NULLS / RESPECT NULLS** for `first_value`, `last_value`, `nth_value`, `lag`, `lead` (between call and OVER).
  **PG18-runnable** old way (correlated subquery LOCF), using the page's sensor table:
  ```sql
  SELECT s.*, (SELECT temperature FROM sensor_readings s2 WHERE s2.sensor_id = s.sensor_id AND s2.ts <= s.ts
                 AND s2.temperature IS NOT NULL ORDER BY s2.ts DESC LIMIT 1) AS last_known_temp
  FROM sensor_readings s;   -- 22.50,22.50,22.50,23.10,23.10,24.00
  ```
  Another PG18 technique worth teaching alongside: `count(temperature) OVER (ORDER BY ts)` as a group id, then
  `first_value` within the group (classic gaps-and-islands LOCF).
- **Memoize estimates in EXPLAIN**: `Estimates: capacity=6 distinct keys=5 lookups=10000 hit percent=99.95%`. The setup
  is **PG18-runnable** and shows a Memoize node already in 18 (just without the Estimates line):
  `CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT); CREATE TABLE orders (id SERIAL PRIMARY KEY, user_id INT
  REFERENCES users(id)); INSERT INTO users SELECT g, 'User '||g FROM generate_series(1,100) g; INSERT INTO orders SELECT
  g, (g % 5) + 1 FROM generate_series(1,10000) g; ANALYZE users; ANALYZE orders; EXPLAIN SELECT u.name, o.id FROM orders o
  JOIN users u ON o.user_id = u.id;` (planner may also choose a hash join; Memoize is the page's claim.) In PG18 EXPLAIN
  ANALYZE shows Memoize Hits/Misses/Evictions/Overflows and memory usage.
- **pg_plan_advice** (contrib, `LOAD 'pg_plan_advice'` or shared/session_preload_libraries; no CREATE EXTENSION):
  `EXPLAIN (COSTS OFF, PLAN_ADVICE)` prints "Generated Plan Advice: JOIN_ORDER(o c) HASH_JOIN(c) SEQ_SCAN(o c)
  NO_GATHER(o c)"; replay with `SET pg_plan_advice.advice = '...'`; tags SEQ_SCAN, INDEX_SCAN(t idx), INDEX_ONLY_SCAN,
  BITMAP_HEAP_SCAN, HASH_JOIN, MERGE_JOIN_PLAIN, NESTED_LOOP_PLAIN, NESTED_LOOP_MEMOIZE, JOIN_ORDER(a b c) /
  JOIN_ORDER({a b} c), GATHER, NO_GATHER, GATHER_MERGE, DO_NOT_SCAN; `pg_plan_advice.feedback_warnings = on`; feedback
  matched / partially matched / not matched (inapplicable, conflicting, failed). Cannot control aggregation strategy or set
  operations; matches by alias. PG18 analogue for lessons: `enable_*` planner GUCs (enable_hashjoin, enable_seqscan...)
  and PG18's "Disabled: true" marker in EXPLAIN.
- **REPACK** = VACUUM FULL + CLUSTER: `REPACK t;`, `REPACK t USING INDEX idx;`, `REPACK;`, `REPACK USING INDEX;`,
  `REPACK (CONCURRENTLY, ANALYZE, VERBOSE) t USING INDEX idx;`, `REPACK (ANALYZE) t (col1, col2);`. CONCURRENTLY = copy +
  logical decoding of concurrent changes + brief ACCESS EXCLUSIVE swap; not for tables without PK/replica identity,
  unlogged, partitioned parents, catalogs, or inside a transaction block. Progress view `pg_stat_progress_repack`. Needs
  MAINTAIN privilege; disk = table + indexes (up to 2x with sort). **PG18-runnable** analogue: `VACUUM FULL` / `CLUSTER`
  with `pg_relation_size` before/after and `pg_stat_progress_cluster`; and the "VACUUM frees space inside pages but does not
  shrink the file" demo (DELETE most rows, VACUUM, size unchanged; VACUUM FULL, size shrinks).
- **Parallel autovacuum**: `autovacuum_max_parallel_workers` (default 0 = off, reloadable) and per-table
  `autovacuum_parallel_workers` (-1 = use global, 0 = off); parallelizes only index vacuum and index cleanup phases; one
  worker per index; indexes must exceed `min_parallel_index_scan_size`; workers come from `max_parallel_workers`; memory up
  to maintenance_work_mem x (1 + workers) (page's example 256MB x 5 = 1.28 GB). PG13+ manual `VACUUM (PARALLEL 4) t` is
  the **PG18-runnable** counterpart (needs max_parallel_maintenance_workers).
- **COPY TO ... (FORMAT JSON [, FORCE_ARRAY])**: NDJSON by default, JSON array with FORCE_ARRAY; COPY TO only (no COPY
  FROM JSON); incompatible with HEADER, DELIMITER, QUOTE, ESCAPE, NULL, DEFAULT, FORCE QUOTE/NOT NULL/NULL; SQL NULL ->
  JSON null. **PG18-runnable** workarounds compared by the page: `COPY (SELECT row_to_json(t) FROM users t) TO STDOUT;`
  (streams, but text-format escaping of backslashes) and `SELECT json_agg(t) FROM users t;` (clean, but whole result in
  memory). Also PG19: `COPY partitioned_table TO ...` directly (PG18 needs `COPY (SELECT * FROM parent) TO`).
- **Logical replication**: `CREATE PUBLICATION p FOR ALL TABLES, ALL SEQUENCES;` (sequence sync, values copied not each
  nextval, gaps expected; fixes duplicate-key errors after logical-replication cutover); `FOR ALL TABLES EXCEPT (TABLE a,
  b)`, `ALTER PUBLICATION p SET ALL TABLES [EXCEPT (...)]`; read-only `effective_wal_level` flips replica <-> logical when the
  first logical slot is created / last dropped (no restart).
- **Monitoring/ops**: online `pg_enable_data_checksums(cost_delay := 10, cost_limit := 1000)` / `pg_disable_data_checksums()`,
  `data_checksums` states off -> inprogress-on -> on (and inprogress-off); `pg_stat_wal.wal_fpi_bytes` (FPI share query:
  `ROUND(wal_fpi_bytes::numeric / NULLIF(wal_bytes,0) * 100, 1)`; page's example 39.9%, "FPIs can be 30-50% of WAL");
  `pg_stat_progress_vacuum.mode` (normal/aggressive/failsafe) and `started_by` (auto/manual/wraparound);
  `log_min_messages = 'warning, autovacuum:debug1, archiver:debug5'` (14 process types); psql `%i` (primary/standby) and
  `%S` (search_path; uses PG18 search_path reporting); `WAIT FOR LSN 'x' WITH (MODE 'standby_replay'|'standby_write'|
  'standby_flush'|'primary_flush', TIMEOUT '5000', NO_THROW)` returning status success/timeout; 64-bit MultiXactOffset
  (removes the ~4 billion member-space limit; SLRU rewritten by pg_upgrade).
- **Schema tooling**: `pg_get_database_ddl('db' [, 'pretty','true','owner','false','tablespace','false'])`,
  `pg_get_role_ddl(role [, 'memberships','false'])` (never prints passwords), `pg_get_tablespace_ddl(name)` — each returns
  one executable statement per row; `pg_dumpall -Fc|-Fd|-Ft` (toc.glo, map.dat, databases/), `pg_restore --globals-only`,
  `pg_dumpall -Fd -j 4`.
- **Breaking changes in 19**: `jit` default off; `default_toast_compression` default lz4 (existing pglz data untouched;
  per-column `SET COMPRESSION` affects only new writes); RADIUS auth removed (server refuses to start with radius lines);
  `standard_conforming_strings` forced on and read-only, `escape_string_warning` removed; MD5 authentication emits
  warnings; `max_locks_per_transaction` default 64 -> 128; MULE_INTERNAL encoding removed; btree_gist `gist_inet_ops` /
  `gist_cidr_ops` made non-default (wrong results; pg_upgrade blocks); CR/LF banned in database/role/tablespace names;
  `log_lock_waits` on by default; wait event class BUFFERPIN renamed BUFFER; postgres_fdw honours local READ ONLY.
  **PG18-relevant** lesson material from this page: (1) string literals — with standard_conforming_strings on (the PG18
  default) `SELECT 'line1\nline2'` returns the backslash literally, use `E'line1\nline2'`, and `'it''s'` (doubling) is the
  standard quote escape; (2) MD5 -> SCRAM migration order: set `password_encryption = 'scram-sha-256'`, re-set every
  password (prefer psql `\password` so the plaintext never appears in logs/pg_stat_statements), only then switch pg_hba
  `md5` -> `scram-sha-256` (an md5 hba line already uses SCRAM for users whose stored hash is SCRAM); (3) the opclass-
  finder query joining `pg_index.indclass` to `pg_opclass` is a nice catalog exercise.

### PL/pgSQL course structure and sample-database dependency  [M6]  (source: plpgsql.txt, plpgsql__introduction-to-postgresql-stored-procedures.txt)
- Neon's 9-section progression is a ready-made lesson order: (1) getting started: intro, dollar quoting, block structure;
  (2) variables & constants: variables, SELECT INTO, %ROWTYPE, record, constants; (3) messages: RAISE, ASSERT;
  (4) control: IF, CASE, LOOP, WHILE, FOR, EXIT, CONTINUE; (5) functions: CREATE FUNCTION, parameter modes, overloading,
  RETURNS TABLE, RETURNS SETOF, DROP FUNCTION; (6) exceptions; (7) procedures: CREATE/DROP PROCEDURE, INOUT;
  (8) cursors; (9) trigger functions (not in this slice).
- Motivation angle: round trips. Without server-side code the app does send -> wait -> process -> compute -> send again;
  PL/pgSQL "wraps multiple statements in an object stored on the server" -> fewer round trips, no intermediate results
  shipped. Disadvantages listed: specialized skill, hard to version and debug, not portable. "Installed by default since 9.0".
- Every example relies on the DVD-rental sample database (`film`, `actor`, `rental`, `payment`, `film_actor`; 1000 films,
  200 actors; film 100 = "Brooklyn Desert", length 161, rental_rate 4.99; actor 1 = Penelope Guiness). PGlite lessons need a
  small substitute — see "film_mini" in Reusable sample schemas, which reproduces the rows the examples reference.

### Dollar quoting  [M6, M3]  (source: plpgsql__dollar-quoted-string-constants.txt)
- Progression: `'I''m a string constant'` (doubling) -> `$$I'm a string constant$$` -> tagged `$message$...$message$`.
  Tag rules as the page gives them: optional; starts with a letter or underscore; letters (case-insensitive per the page),
  digits, underscores. Note: the docs say tags ARE case-sensitive (`$TAG$` != `$tag$`) — use the docs rule.
- Killer demo: a DO body in single quotes needs every inner quote doubled: `raise notice ''The number of films: %'',
  film_count;` vs the `$$` version. Then nesting: function body `$$`, inner dynamic SQL `$q$ ... $q$`.
- The function body is just a string constant handed to the language handler — sets up the "body is not parsed until
  first call" point for later (plpgsql validates syntax at CREATE, resolves tables at run time).

### Blocks, variables, scoping  [M6]  (source: plpgsql__plpgsql-block-structure.txt, plpgsql__plpgsql-variables.txt, plpgsql__plpgsql-constants.txt)
- Block grammar: `[<<label>>] [DECLARE ...] BEGIN ... END [label];` DO executes an anonymous block (the DO statement is
  not part of the block; since 9.0). `=` and `:=` are equivalent for assignment/initialization.
- Runnable examples (no tables needed):
  ```sql
  DO $$
  <<outer>>
  DECLARE x int = 0;
  BEGIN
    x = x + 1;
    <<inner>>
    DECLARE y int = 2;
    BEGIN
      y = y + x;
      RAISE NOTICE 'x=% y=%', x, y;        -- NOTICE: x=1 y=3
    END inner;
  END outer $$;

  DO $$
  <<outer_block>>
  DECLARE counter integer := 0;
  BEGIN
    counter := counter + 1;
    DECLARE counter integer := 0;          -- shadows the outer one
    BEGIN
      counter := counter + 10;
      RAISE NOTICE 'inner %, outer %', counter, outer_block.counter;   -- inner 10, outer 1
    END;
    RAISE NOTICE 'outer %', counter;                                 -- outer 1
  END outer_block $$;
  ```
- Uninitialized variable = NULL. Initializers are evaluated each time the block is ENTERED (run time, not compile time):
  ```sql
  DO $$ DECLARE created_at time = clock_timestamp();
  BEGIN RAISE NOTICE '%', created_at; PERFORM pg_sleep(1); RAISE NOTICE '%', created_at; END $$;  -- same value twice
  ```
  Pair with `now()` vs `clock_timestamp()` (transaction start vs wall clock) — M5 tie-in.
- `%TYPE` copies a column's or variable's type (`film.title%type`, `film_title%type`) so the code survives column type
  changes.
- Constants: `vat constant numeric = 0.1;` then `vat = 0.05;` fails with `ERROR: "vat" is declared CONSTANT` (page reports
  SQL state 22005). Constant initializers are also evaluated at block entry.
- PITFALL in the page: `raise notice 'Film title id 100: %s', film_title;` — `%` is the placeholder; the trailing `s` is
  literal text, so the real output ends with "...Deserts"; the page's shown output omits it (and the title is "Brooklyn
  Desert", so "%s" printf habits produce typos).

### SELECT INTO, row types, records, FOUND  [M6]  (source: plpgsql__pl-pgsql-select-into.txt, plpgsql__pl-pgsql-row-types.txt, plpgsql__plpgsql-record-types.txt, plpgsql__plpgsql-if-else-statements.txt)
- `SELECT col1, col2 INTO v1, v2 FROM ...` (INTO may also come after the FROM: `select title from film into film_title
  where ...`). `t%ROWTYPE` holds a whole row of a table or view (`selected_actor.first_name`). `record` has no structure
  until assigned and changes shape on reassignment; reading a field of an unassigned record errors.
- `FOUND` is set by SELECT INTO (true if a row was assigned). Pattern: `IF NOT FOUND THEN RAISE NOTICE 'The film % could
  not be found', input_film_id; END IF;`
- Without STRICT, SELECT INTO silently keeps the FIRST row when the query returns several (no error) — contrast with
  `INTO STRICT` (exception page): no rows -> `no_data_found` (P0002, "query returned no rows"), more than one ->
  `too_many_rows` (P0003).
- PITFALL in the CASE page: `SELECT sum(amount) INTO total_payment FROM payment WHERE customer_id = 100; IF found THEN`
  — an aggregate without GROUP BY always returns one row (NULL sum), so FOUND is always true and the "Customer not found"
  branch is dead code; test `total_payment IS NULL` instead. Great exercise.
- PITFALL in the IF page: the length classifier uses `> 50 AND < 120` then `> 120`, so length = 120 falls into 'N/A';
  boundary-bug exercise.

### RAISE and ASSERT  [M6]  (source: plpgsql__plpgsql-errors-messages.txt, plpgsql__pl-pgsql-assert.txt)
- Levels: debug, log, notice, info, warning, exception; default level is EXCEPTION (aborts the transaction). What reaches the
  client is governed by `client_min_messages` (default notice) and the log by `log_min_messages`; in the page's demo only
  info, warning, notice reached the client. Placeholder count must match the arguments, else
  `ERROR: too many parameters specified for RAISE`.
- `RAISE EXCEPTION 'duplicate email: %', email USING HINT = 'check the email again';` -> ERROR + HINT + `CONTEXT: PL/pgSQL
  function inline_code_block line 8 at RAISE` (anonymous DO blocks are named inline_code_block). USING options on the page:
  HINT, DETAIL, ERRCODE (condition name or SQLSTATE). Also `RAISE SQLSTATE '77777';` and `RAISE invalid_regular_expression;`.
- ASSERT: `ASSERT condition [, message];` false OR NULL -> `assert_failure` (SQLSTATE P0004), default message "assertion
  failed"; `plpgsql.check_asserts = off` disables. Use for bug detection only, RAISE for reporting.
  ```sql
  DO $$ DECLARE n int; BEGIN SELECT count(*) INTO n FROM pg_class; ASSERT n > 1000000, 'too few'; END $$;
  -- ERROR: too few   CONTEXT: ... at ASSERT   (SQLSTATE P0004)
  ```

### Control flow: IF, CASE, LOOP, WHILE, FOR, EXIT, CONTINUE  [M6]  (source: plpgsql__plpgsql-if-else-statements.txt, plpgsql__plpgsql-case-statement.txt, plpgsql__plpgsql-loop-statements.txt, plpgsql__pl-pgsql-while-loop.txt, plpgsql__plpgsql-for-loop.txt, plpgsql__plpgsql-exit.txt, plpgsql__pl-pgsql-continue.txt)
- IF / IF-ELSE / IF-ELSIF-ELSE (keyword ELSIF). CASE statement vs CASE expression: the statement chooses a block to run,
  the expression yields a value. Simple CASE compares with `=`; searched CASE tests booleans top to bottom; both stop at
  the first match; a missing ELSE with no match raises `case_not_found` (unlike the CASE expression, which yields NULL).
- LOOP ... END LOOP with `EXIT [label] [WHEN cond]`; `CONTINUE [label] [WHEN cond]`; labels needed to exit an outer loop
  from an inner one; EXIT can also leave a labeled BEGIN...END block (not CONTINUE).
  ```sql
  DO $$ DECLARE i int = 0; j int = 0;
  BEGIN
    <<outer_loop>> LOOP
      i = i + 1; EXIT WHEN i > 3; j = 0;
      <<inner_loop>> LOOP
        j = j + 1;
        EXIT outer_loop WHEN j > 3;          -- change to plain EXIT to get 9 rows instead of 3
        RAISE NOTICE '(i,j): (%,%)', i, j;
      END LOOP inner_loop;
    END LOOP outer_loop;
  END $$;                                    -- (1,1) (1,2) (1,3)
  DO $$ BEGIN <<simple_block>> BEGIN EXIT simple_block; RAISE NOTICE 'unreachable!'; END;
              RAISE NOTICE 'End of block'; END $$;
  DO $$ DECLARE counter int = 0; BEGIN LOOP counter = counter + 1; EXIT WHEN counter > 10;
        CONTINUE WHEN mod(counter,2) = 0; RAISE NOTICE '%', counter; END LOOP; END $$;   -- 1 3 5 7 9
  DO $$ DECLARE counter integer := 0; BEGIN WHILE counter < 5 LOOP RAISE NOTICE 'Counter %', counter;
        counter := counter + 1; END LOOP; END $$;                                         -- 0..4 (pre-test loop)
  ```
- Integer FOR: `FOR c IN [REVERSE] a..b [BY step] LOOP` — the loop variable is implicitly declared and local to the loop;
  bounds and step evaluated once. `FOR c IN REVERSE 5..1` counts 5..1 (bounds are written high..low with REVERSE);
  `1..6 BY 2` -> 1, 3, 5.
- Query FOR: `FOR rec IN SELECT ... LOOP` (rec record). Dynamic: `FOR rec IN EXECUTE query USING rec_count LOOP` with
  `$1` placeholders in the text (`query := query || ' limit $1'`). Page's example builds ORDER BY by concatenation from a
  smallint switch — safe because the fragments are literals; contrast with concatenating user input (use format('%I')
  / USING).
- Pitfall from the FOR page: `ORDER BY release_year` on rows that all have 2006 gives arbitrary order (the page's "sort_type
  2" output is unordered) — teaching moment for deterministic ORDER BY tie-breakers.

### Exceptions  [M5, M6]  (source: plpgsql__exception.txt)
- Mechanics as taught: an error between BEGIN and EXCEPTION jumps to the handler list; handlers are searched in order
  (`WHEN cond [OR cond] THEN`, `WHEN OTHERS`); a match runs the handler then continues after END; no match propagates to
  the enclosing block, else the statement aborts. Conditions by name (`no_data_found`, `too_many_rows`) or by
  `SQLSTATE 'P0002'` / `'P0003'`.
  ```sql
  DO $$ DECLARE rec record; v_film_id int = 2000;
  BEGIN
    SELECT film_id, title INTO STRICT rec FROM film WHERE film_id = v_film_id;
  EXCEPTION WHEN no_data_found THEN RAISE EXCEPTION 'film % not found', v_film_id;   -- SQLSTATE P0001
  END $$;
  ```
  Re-raising with RAISE EXCEPTION gives P0001 (raise_exception) — the original SQLSTATE is lost unless you
  `RAISE;` (bare re-raise) or pass `USING ERRCODE = SQLSTATE`.
- Missing from the page but essential for M5 (from the PL/pgSQL docs): a block with an EXCEPTION clause runs as a
  subtransaction (savepoint) — entering it costs an XID-level subtransaction when it writes, and on error all its
  changes are rolled back while variables keep their values. Visual: savepoint stack + pg_subtrans. Pitfall: an
  EXCEPTION block inside a per-row loop creates one subtransaction per row (performance, and >64 open subxacts overflow
  the PGPROC subxid cache).

### Functions: CREATE, parameter modes, notation, overloading, sets, DROP  [M6]  (source: plpgsql__create-function.txt, plpgsql__plpgsql-function-parameters.txt, plpgsql__plpgsql-function-overloading.txt, plpgsql__plpgsql-function-returns-a-table.txt, plpgsql__plpgsql-returns-setof.txt, plpgsql__drop-function.txt)
- Skeleton: `CREATE [OR REPLACE] FUNCTION name(params) RETURNS type LANGUAGE plpgsql AS $$ DECLARE ... BEGIN ... END; $$;`
  Example `get_film_count(len_from int, len_to int)` -> `select get_film_count(40,90)` = 325 in dvdrental.
- Call notations: positional `f(40,90)`, named `f(len_from => 40, len_to => 90)` (old `:=` still accepted), mixed
  `f(40, len_to => 90)`; named-before-positional fails: `ERROR: positional argument cannot follow named argument`.
- Modes table: IN (default, acts like a constant), OUT (uninitialized variable, returned as part of the result row),
  INOUT (initialized, returned). OUT-only functions need no RETURNS clause:
  ```sql
  CREATE OR REPLACE FUNCTION swap(INOUT x int, INOUT y int) LANGUAGE plpgsql AS $$
  BEGIN SELECT x, y INTO y, x; END $$;
  SELECT * FROM swap(10, 20);       -- x=20 y=10
  SELECT swap(10, 20);              -- (20,10)  -- one composite column
  ```
  `select get_film_stat()` -> `(46,185,115.3)` vs `select * from get_film_stat()` -> three columns: the "composite vs
  expanded" distinction.
- RETURNS TABLE(film_title varchar, film_release_year int) with `RETURN QUERY SELECT title, release_year::integer ...`
  (cast needed because dvdrental's release_year is a domain `year`); row-by-row variant assigns the OUT columns then
  `RETURN NEXT;`. `RETURNS SETOF film` + `RETURN QUERY`; call styles `SELECT f(x)` (one composite column),
  `SELECT (f(x)).title`, `SELECT (f(x)).*`, `SELECT * FROM f(x)` (preferred: `(f(x)).*` may evaluate f once per column).
  Pages call the composite column "an array" — it is a row/composite value, not an array.
- Overloading: same name, different IN-argument lists; resolution picks the best candidate. With a DEFAULT on the 2nd
  parameter, `get_rental_duration(232)` becomes ambiguous -> `ERROR: function get_rental_duration(integer) is not unique`
  (SQLSTATE 42725, HINT about explicit casts). PITFALL in the page: it says there are three functions; actually
  `CREATE OR REPLACE` with signature (integer, date) REPLACED the second one (defaults are not part of the signature), so
  there are two, and the ambiguity is between f(int) and f(int, date default ...).
- DROP FUNCTION [IF EXISTS] name[(argtypes)] [CASCADE|RESTRICT]; multiple names comma-separated; name alone works only when
  unique, else `ERROR: function name "get_film_actors" is not unique` (42725, HINT: Specify the argument list). RESTRICT is
  the default; CASCADE drops dependents (operators, triggers) recursively.
- `RETURNS SETOF record` functions (get_film_actors) must be called with a column definition list:
  `SELECT * FROM get_film_actors() AS t(film_id int, title text, actor varchar)` — the page omits this.

### Procedures, transactions, INOUT  [M5, M6]  (source: plpgsql__create-procedure.txt, plpgsql__drop-procedure.txt, plpgsql__stored-procedure-with-inout-parameters.txt)
- Angle: functions cannot COMMIT/ROLLBACK; procedures (PG11+) can. `CALL proc(args);` A procedure returns no value;
  bare `RETURN;` exits early; values come back through INOUT (and, since PG14, OUT) parameters.
- Transfer example (reusable, see accounts schema): two UPDATEs then `COMMIT;` inside the procedure;
  `CALL transfer(1,2,1000);` -> Bob 9000.00, Alice 11000.00.
  PITFALLS: (1) the in-procedure COMMIT only works when CALL is executed at top level (autocommit); inside
  `BEGIN; CALL transfer(...); COMMIT;` it fails with `invalid transaction termination` — a crisp M5 demo (PGlite runs
  single statements in autocommit, so both cases are showable). (2) No balance check / no locking order: two concurrent
  opposite transfers can deadlock — use `SELECT ... FOR UPDATE` ordered by id. (3) The page says procedure parameters
  "cannot have the out mode" — outdated; OUT parameters for procedures were added in PostgreSQL 14.
- INOUT procedures: `CREATE PROCEDURE count_film(INOUT total_film int DEFAULT 0)`; `CALL count_film();` returns a one-row
  result set (total_film = 1000); from PL/pgSQL `CALL count_film(total_film);` writes back into the variable. Multiple
  INOUT with defaults: `film_stat()` -> (1000, 115272, 2.98). "Call without providing INOUT parameters" works only because
  of the DEFAULTs.
- DROP PROCEDURE mirrors DROP FUNCTION (42725 "procedure name ... is not unique"; `drop procedure insert_actor(varchar)`;
  `drop procedure delete_actor, update_actor;`). PITFALL in the page: the two-arg `insert_actor(fname, lname)` body inserts
  the literals 'John','Doe' and ignores its parameters.

### Cursors  [M6, M4]  (source: plpgsql__plpgsql-cursor.txt)
- Five-step lifecycle diagram: DECLARE -> OPEN -> FETCH (loop) -> exit when NOT FOUND -> CLOSE. FETCH directions listed:
  NEXT, PRIOR, FIRST, LAST, ALL (PRIOR/FIRST/LAST need a SCROLL cursor; PL/pgSQL FETCH retrieves one row into a target —
  ALL is for SQL-level FETCH).
  ```sql
  CREATE OR REPLACE FUNCTION fetch_film_titles_and_years(OUT p_title VARCHAR(255), OUT p_release_year INTEGER)
  RETURNS SETOF RECORD AS $$
  DECLARE film_cursor CURSOR FOR SELECT title, release_year FROM film; film_record RECORD;
  BEGIN
    OPEN film_cursor;
    LOOP
      FETCH NEXT FROM film_cursor INTO film_record;
      EXIT WHEN NOT FOUND;
      p_title = film_record.title; p_release_year = film_record.release_year;
      RETURN NEXT;
    END LOOP;
    CLOSE film_cursor;
  END $$ LANGUAGE plpgsql;
  SELECT * FROM fetch_film_titles_and_years();
  ```
- Lesson angle to add: a FOR-over-query loop already uses a cursor internally (fetches in batches), so an explicit cursor
  is only needed for interleaved fetching, SCROLL, or returning a refcursor to the client; and the planner optimizes cursor
  queries for `cursor_tuple_fraction` (default 0.1) of the rows — M4 tie-in. Output order without ORDER BY is heap order
  (the page's output starts with "Chamber Italian", i.e. physical order after updates — nice M2 tie-in: ctid order).

### Client drivers: the common lifecycle  [M6, M5]  (source: api.txt, python*.txt, jdbc*.txt, csharp*.txt, php*.txt)
- All four tracks teach the same five-step skeleton, which maps 1:1 onto the wire protocol and is the best lesson frame:
  connect (startup + auth) -> create statement/cursor -> send SQL with bound parameters (Parse/Bind/Execute) -> consume
  results (DataRow messages) -> commit/rollback + close (Terminate). Each track uses its own sample DB: Python `suppliers`
  (vendors/parts/vendor_parts/part_drawings), JDBC `sales` (products), C# `elearning` (courses/students/enrollments/
  invoices), PHP `stocks` (stocks/stock_valuations, accounts/plans/account_plans, company_files).
- Placeholder syntax per driver (worth a comparison table): psycopg2 `%s` (client-side interpolation with proper
  quoting); JDBC `?`; Npgsql `@name` or positional `$1`; PDO `:name` (or `?`). Server-side the protocol only knows `$n`.
- Shared pitfalls across every track (none of the pages mention them):
  1. One connection per call (open/close inside every helper) — each connect is a fork of a new backend + auth; use a
     pool (Npgsql's NpgsqlDataSource pools by default; HikariCP for JDBC; psycopg_pool / pgbouncer). M1/M7 tie-in.
  2. Row-by-row inserts for bulk loads (Python executemany, C# CSV import loop, PHP insertStockList) — use COPY
     (psycopg `copy_expert`/`cursor.copy`, pgjdbc `CopyManager`, Npgsql `BeginBinaryImport`, PDO `pgsqlCopyFromArray`)
     or multi-row VALUES / `unnest($1::text[])`.
  3. Money as floating point (JDBC `double price`, C# `var amount = 99.5` / `DOUBLE PRECISION` procedure params) —
     bind numeric/BigDecimal/decimal.
  4. Swallowing exceptions and returning sentinel values (-1, null, 0) hides constraint violations; check SQLSTATE
     (e.g. 23503, 23505) instead.

### Python (psycopg2)  [M6]  (source: python.txt, python__connect.txt, python__create-tables.txt, python__insert.txt, python__update.txt, python__query.txt, python__transaction.txt, python__delete.txt, python__python-call-postgresql-functions.txt, python__call-stored-procedures.txt, python__blob.txt)
- Connect: `psycopg2.connect(host=..., database=..., user=..., password=..., port=5432)` or a DSN string; config read from
  `database.ini` via configparser (keep it in .gitignore). psycopg2 is a C wrapper around libpq; DB-API 2.0; adapts list ->
  array, tuple -> record, dict -> hstore.
- Context managers: `with psycopg2.connect(...) as conn:` commits on success / rolls back on exception but does NOT close
  the connection (psycopg 3 does close it). The create-tables page wrongly says the with-block "will close the database
  connection automatically"; the connect page has the correct note.
- Transactions: the first statement implicitly opens a transaction (psycopg2 sends BEGIN); everything until
  `commit()`/`rollback()` is one transaction; `close()` / `del conn` rolls back; `conn.autocommit = True` is required for
  `CREATE DATABASE` and `VACUUM`. Pitfall to teach (M5): a long-lived connection that ran a SELECT and never committed sits
  "idle in transaction", holding back the xmin horizon and blocking VACUUM cleanup.
- Insert + RETURNING: `cur.execute("INSERT INTO vendors(vendor_name) VALUES(%s) RETURNING vendor_id;", (name,))` then
  `cur.fetchone()[0]`; one-element tuple `(value,)` gotcha. `executemany()` loops one statement per row (and discards
  RETURNING) — use `psycopg2.extras.execute_values` or COPY for volume.
- Query: `fetchone()` (tuple or None), `fetchmany(size)` (list, empty at end), `fetchall()`; generator `iter_row(cursor,
  10)` streaming pattern. Note `cur.rowcount` works for SELECT in psycopg2 because the whole result is buffered client-side
  — for big results use a named (server-side) cursor `conn.cursor(name='c')` (M6 cursor tie-in).
- UPDATE/DELETE: `cur.rowcount` = affected rows.
- Transaction example `add_part(part_name, vendor_list)`: insert part RETURNING id, then vendor_parts rows; an invalid
  vendor (99) raises `insert or update on table "vendor_parts" violates foreign key constraint
  "vendor_parts_vendor_id_fkey" DETAIL: Key (vendor_id)=(99) is not present in table "vendors".` and nothing is kept —
  atomicity demo that also works in PGlite with plain SQL.
- Functions: `cur.callproc('get_parts_by_vendor', (1,))` is equivalent to `SELECT * FROM get_parts_by_vendor(%s)`;
  result `[(1, 'SIM Tray'), (5, 'Home Button'), (6, 'LTE Modem')]`. Procedures: `cur.execute('CALL add_new_part(%s,%s)',
  ('OLED','LG'))` then commit (page has a typo `CALL sp_name);`).
- Binary: PostgreSQL has no BLOB type, use BYTEA; `psycopg2.Binary(data)`; read back `blob[2]` and write to file.
- PGlite angle: every psycopg example is plain SQL underneath, so lessons can show the Python on one side and run the
  SQL against the suppliers schema in the playground.

### Java (pgjdbc)  [M6]  (source: jdbc.txt, jdbc__connecting-to-postgresql-database.txt, jdbc__create-tables.txt, jdbc__insert.txt, jdbc__query.txt, jdbc__update.txt, jdbc__delete.txt, jdbc__transaction.txt, jdbc__call-postgresql-stored-function.txt)
- Driver jar `postgresql-42.7.1.jar`; URL `jdbc:postgresql://localhost:5432/sales`; `DriverManager.getConnection(url, user,
  password)`; config in `db.properties`; try-with-resources closes ResultSet/Statement/Connection (JDBC 4.1+).
- Statement types: `Statement` (no params), `PreparedStatement` (`?` binding), `CallableStatement` (`{ ? = call initcap(?)
  }` with `registerOutParameter(1, Types.VARCHAR)` -> "Hello Joe"). Execution: `execute()` (true if first result is a
  ResultSet), `executeQuery()`, `executeUpdate()` (affected-row count; also used for DDL).
- Generated keys: `prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)` then `getGeneratedKeys()` — pgjdbc implements
  this by appending `RETURNING *` (so plain `INSERT ... RETURNING id` with executeQuery is equivalent and explicit).
- Batching: `addBatch()` + `executeBatch()`; pgjdbc sends the batch in one network round trip but as separate INSERTs
  unless the connection property `reWriteBatchedInserts=true` rewrites them into multi-row VALUES.
- Transactions: JDBC is auto-commit by default; `setAutoCommit(false)`, `commit()`, `rollback()` in catch, close in finally.
- Stored function returning a table: `SELECT * FROM find_products(?)` with RETURNS TABLE(p_id int, p_name varchar,
  p_price decimal) — the `p_` prefixes on output columns avoid the classic PL/pgSQL clash between RETURNS TABLE column
  names (which are OUT variables) and the table's column names (`column reference "id" is ambiguous`). Worth stating
  explicitly in the PL/pgSQL lesson.
- PITFALLS in the pages: `DB.connect()` catches SQLException and returns null, so callers hit a NullPointerException
  instead of the real error; `double` for prices (and output shows 199.0); `ProductDB.findAll` never closes its ResultSet
  explicitly (closed with the statement — OK, but say so).

### C# (Npgsql)  [M6]  (source: csharp.txt, csharp__csharp-connect.txt, csharp__csharp-create-table.txt, csharp__csharp-insert.txt, csharp__csharp-select.txt, csharp__csharp-update.txt, csharp__csharp-delete.txt, csharp__csharp-transaction.txt, csharp__csharp-import-csv-file.txt, csharp__csharp-call-postgresql-function.txt, csharp__csharp-call-a-stored-procedure.txt)
- Setup: `CREATE DATABASE elearning; CREATE ROLE ed WITH LOGIN PASSWORD '...'; GRANT ALL PRIVILEGES ON SCHEMA public TO ed;`
  (the schema grant matters since PG15 revoked CREATE on public from PUBLIC — good M1 privileges tie-in). Packages
  `Npgsql`, `Microsoft.Extensions.Configuration(.Json)`; connection string
  `Server=localhost;Database=elearning;User Id=ed;Password=...;` in appsettings.json.
- `NpgsqlConnection` + `OpenAsync()` + `conn.PostgreSqlVersion`; Npgsql 7+ `NpgsqlDataSource.Create(cs)` — one thread-safe
  data source per app, pooling built in, `dataSource.CreateCommand(sql)` or `await dataSource.OpenConnectionAsync()`.
- Commands: `ExecuteNonQueryAsync()` (DDL/DML), `ExecuteReaderAsync()` + `ReadAsync()` + `GetInt32/GetString/GetDateTime`,
  `ExecuteScalarAsync()` (count). Parameters: named `@first_name` with `cmd.Parameters.AddWithValue("@first_name", v)`, or
  positional `$1,$2` with `AddWithValue(v)`; `DateOnly` maps to date.
- Transaction: `await using var tx = await conn.BeginTransactionAsync();` commands created with `new NpgsqlCommand(sql,
  conn, tx)`; `CommitAsync()` / `RollbackAsync()`. Enrollment + invoice example (student 2, course 1, 99.50, tax 0.05).
- Function: `SELECT get_student_count($1,$2)` (dates 2024-05-10..15). Procedure: `CALL enroll_student($1,$2,$3,$4,$5)`.
- PITFALLS in the pages: (1) the UPDATE example's SQL `UPDATE email = @email FROM students WHERE id= @id` is invalid —
  correct is `UPDATE students SET email = @email WHERE id = @id`; (2) the CSV import inserts row by row — for real imports
  use COPY via `conn.BeginBinaryImport("COPY students (first_name,last_name,email,registration_date) FROM STDIN (FORMAT
  BINARY)")`; (3) `catch (NpgSQLException ex)` typo; (4) the generic call page shows `SELECT fn(?,?)` (`?` is not an Npgsql
  placeholder) and refers to a non-existent `enroll_student_and_create_invoice`; (5) `enrollments` has no foreign keys
  while `invoices` does; (6) money passed as double.

### PHP (PDO_PGSQL)  [M6, M2]  (source: php.txt, php__connect.txt, php__create-tables.txt, php__insert.txt, php__update.txt, php__query.txt, php__delete.txt, php__transaction.txt, php__call-stored-procedures.txt, php__blob.txt)
- DSN `pgsql:host=%s;port=%d;dbname=%s;user=%s;password=%s`; `$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION)`;
  errors surface as `SQLSTATE[08006] [7] FATAL: password authentication failed for user "postgres"` / `database "stockss"
  does not exist`. Connection class written as a singleton (but `connect()` still creates a new PDO every call).
- `exec()` for DDL; `query()` + `fetch(PDO::FETCH_ASSOC)`; `prepare()` + `bindValue(':symbol', ...)` + `execute()`;
  `rowCount()` for UPDATE/DELETE; `fetchObject()` -> stdClass; `fetchColumn(0)` for scalar function results
  (`SELECT * FROM add(:a,:b)` -> 50).
- IDs: `$pdo->lastInsertId('stocks_id_seq')` — PDO_PGSQL needs the sequence name (it runs currval). Teaching note: prefer
  `INSERT ... RETURNING id`; serial sequence name convention is `<table>_<column>_seq`, discoverable with
  `pg_get_serial_sequence('stocks','id')`.
- Transactions: `beginTransaction()` / `commit()` / `rollBack()`; ACID listed. Demo: three accounts with plans 1..3 succeed,
  plan 99 fails with `SQLSTATE[23503]: Foreign key violation: 7 ERROR: insert or update on table "account_plans" violates
  foreign key constraint "account_plans_plan_id_fkey"` and the 4th account is rolled back. The page's generic snippet
  mixes `$pdo` and `$db` (typo).
- PITFALLS in the BLOB page (excellent M2 lesson material): it creates a LARGE OBJECT with `pgsqlLOBCreate()` (returns an
  OID), streams the file into it, and then inserts that OID into a BYTEA column. The SELECT output `\x3137323730` decodes
  to the ASCII text "17270" — the column holds the OID's digits, not the image. Two correct designs: (a) column type `oid`
  + large-object API (`pg_largeobject`, chunks of LOBLKSIZE = 2 kB, must `lo_unlink` or rows orphan the object; vacuumlo
  cleans up), or (b) BYTEA bound with `PDO::PARAM_LOB` (TOASTed inline, 1 GB limit). Also the delete() method calls
  `bindColumn` then `closeCursor()` without fetching, so `$fileData` is never set; read() leaves its transaction open.

### Verification run in PGlite (PostgreSQL 18.6, PGlite 0.5.16 from app/node_modules)  [all]
All sample schemas below loaded cleanly in one `exec`. Checked results that lessons can quote:
- `SHOW io_method` -> `sync` in PGlite. `pg_stat_io` has `read_bytes`, `write_bytes`, `extend_bytes`.
- Array/bytea examples return exactly the documented values (`{{3,4},{1,2}}`, `\x78563412`, `\xfffffb2e`, `\x007b`, 123).
- `CALL transfer(1,2,1000)` at top level -> Bob 9000.00 / Alice 11000.00; `BEGIN; CALL transfer(1,2,10); COMMIT;` ->
  `ERROR: invalid transaction termination` (SQLSTATE 2D000).
- Temporal PK overlap -> `conflicting key value violates exclusion constraint "employees_pkey"` (SQLSTATE **23P01**, an
  exclusion violation, not 23505). Temporal FK for 2022 -> 23503 on `project_assignments_emp_id_assignment_period_fkey`.
  An assignment spanning two adjacent employee rows (2024-11-01..2025-04-01) is accepted. The Neon department_budgets
  INSERT fails with 23P01 as predicted.
- ON CONFLICT ... RETURNING old.quantity/new.quantity -> 50/75, added 25. `RETURNING WITH (OLD AS before, NEW AS after)` works.
  PGlite caveat: the JS row object collapses duplicate column names (`old.quantity` and `new.quantity` both come back as
  "quantity") — always alias in playground snippets.
- NOT NULL ... NOT VALID: insert NULL -> 23502; VALIDATE with NULLs -> `column "email" of relation "users2" contains null
  values` (23502); catalog row `contype='n', convalidated=false`; the PK column also gets an auto-named
  `users2_id_not_null` NOT NULL constraint row.
- Virtual generated column: `CREATE INDEX` -> `indexes on virtual generated columns are not supported` (0A000); generation
  expression with a user function -> `generation expression uses user-defined function` (0A000).
- Skip scan: on (region, category, sale_date) with 3 regions, `WHERE category='Electronics' AND sale_date = ...` shows
  `Bitmap Index Scan on idx_sales_analytics ... Index Searches: 7` — direct evidence of skipping (one search per distinct
  region plus boundary probes).
- `uuid_extract_version(uuidv7())` = 7, `uuidv4()` = 4, `uuidv7() < uuidv7()` true in one statement.
- `convert_from('\x3137323730','UTF8')` = '17270' (PHP BLOB bug confirmed).
- `SELECT sum(..) INTO t ... WHERE false` -> FOUND is true, t NULL (CASE-page bug confirmed).
- `raise notice 'Film title id 100: %s'` prints "Brooklyn Deserts".
- Overload page scenario: only 2 `od` functions exist after the CREATE OR REPLACE with DEFAULT; `od(1)` -> 42725 "is not unique".
- `CREATE PROCEDURE p_out(OUT x int)` + `CALL p_out(NULL)` returns 42 (OUT in procedures works, PG14+).
- `$T$x$t$ $T$` returns `x$t$ ` (dollar-quote tags are case-sensitive).
- CASE without ELSE -> `case not found` (SQLSTATE 20000); ASSERT -> P0004; constant reassignment -> 22005.
- No-op upsert `DO UPDATE SET email = excluded.email` moves the row from ctid (0,1) to (0,2): a new tuple version.
- Memoize page's users/orders setup produced a Hash Join, not Memoize, in PGlite — don't promise a Memoize node.
- `pg_buffercache` is not available in the default PGlite build used by the app (needs its extension bundle loaded).

## Reusable sample schemas
All verified to load in PGlite (PG 18.6). Seeds are small; `generate_series` used where noted.

### S1 film_mini — stand-in for dvdrental in all PL/pgSQL lessons  [M6]
Reproduces the rows Neon's PL/pgSQL examples print (film 1 "Academy Dinosaur", film 100 "Brooklyn Desert" length 161 /
4.99, film 133 "Chamber Italian", actor 1 Penelope Guiness, actor 10); lengths 46..185 like dvdrental; no film of length 30
(no_data_found demo), exactly one of length 90 (change the too_many_rows demo to `title LIKE 'A%'`, 3 rows).
```sql
CREATE TABLE film (
  film_id      int PRIMARY KEY,
  title        text NOT NULL,
  release_year int NOT NULL DEFAULT 2006,
  length       smallint NOT NULL,
  rental_rate  numeric(4,2) NOT NULL DEFAULT 4.99
);
INSERT INTO film VALUES
  (1,'Academy Dinosaur',2006,86,0.99), (2,'Ace Goldfinger',2006,48,4.99),
  (3,'Adaptation Holes',2006,50,2.99), (100,'Brooklyn Desert',2006,161,4.99),
  (133,'Chamber Italian',2006,117,4.99), (200,'Curtain Videotape',2006,133,0.99);
INSERT INTO film
SELECT g, 'Film ' || g, 2006, 46 + (g * 37) % 140, (ARRAY[0.99,2.99,4.99])[1 + g % 3]
FROM generate_series(4, 99) g;
CREATE TABLE actor (actor_id int PRIMARY KEY, first_name text NOT NULL, last_name text NOT NULL);
INSERT INTO actor VALUES (1,'Penelope','Guiness'),(2,'Nick','Wahlberg'),(3,'Ed','Chase'),(10,'Christian','Gable');
CREATE TABLE film_actor (actor_id int REFERENCES actor, film_id int REFERENCES film, PRIMARY KEY (actor_id, film_id));
INSERT INTO film_actor VALUES (1,1),(10,1),(2,100),(3,100),(1,133);

```

### S2 accounts + transfer procedure  [M5, M6]  (Neon create-procedure page, plus a CHECK)
```sql
CREATE TABLE accounts (
  id      int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name    varchar(100) NOT NULL,
  balance dec(15,2) NOT NULL CHECK (balance >= 0)
);
INSERT INTO accounts (name, balance) VALUES ('Bob', 10000), ('Alice', 10000);
CREATE PROCEDURE transfer(sender int, receiver int, amount dec)
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE accounts SET balance = balance - amount WHERE id = sender;
  UPDATE accounts SET balance = balance + amount WHERE id = receiver;
  COMMIT;
END $$;

```
Use: CALL at top level vs inside BEGIN (2D000); overdraw with `CALL transfer(1,2,20000)` -> CHECK violation 23514 and
the procedure's earlier UPDATE is rolled back; two-session deadlock diagram (opposite transfers).

### S3 suppliers (Python track)  [M3, M5, M6]
```sql
CREATE TABLE vendors (vendor_id SERIAL PRIMARY KEY, vendor_name VARCHAR(255) NOT NULL);
CREATE TABLE parts (part_id SERIAL PRIMARY KEY, part_name VARCHAR(255) NOT NULL);
CREATE TABLE part_drawings (
  part_id INTEGER PRIMARY KEY REFERENCES parts ON UPDATE CASCADE ON DELETE CASCADE,
  file_extension VARCHAR(5) NOT NULL, drawing_data BYTEA NOT NULL);
CREATE TABLE vendor_parts (
  vendor_id INTEGER NOT NULL REFERENCES vendors ON UPDATE CASCADE ON DELETE CASCADE,
  part_id   INTEGER NOT NULL REFERENCES parts   ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (vendor_id, part_id));
INSERT INTO vendors (vendor_name) VALUES ('3M Co.'),('AKM Semiconductor Inc.'),('Asahi Glass Co Ltd.'),
  ('Daikin Industries Ltd.'),('Dynacast International Inc.'),('Foster Electric Co. Ltd.'),('Murata Manufacturing Co. Ltd.');
INSERT INTO parts (part_name) VALUES ('SIM Tray'),('Speaker'),('Vibrator'),('Antenna'),('Home Button'),('LTE Modem');
INSERT INTO vendor_parts VALUES (1,1),(2,1),(3,2),(4,2),(5,3),(6,3),(6,4),(7,4),(1,5),(5,5),(1,6),(5,6);
INSERT INTO part_drawings VALUES (1,'png','\x89504e470d0a1a0a'::bytea);

```
Use: join `parts`/`vendor_parts`/`vendors`; atomic add_part with vendor 99 (23503); ON DELETE CASCADE demo
(`DELETE FROM parts WHERE part_id = 2` removes its vendor_parts rows); BYTEA storage and TOAST thresholds.

### S4 elearning (C# track)  [M3, M5]
```sql
CREATE TABLE courses (id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE,
  duration INTERVAL NOT NULL, description TEXT);
CREATE TABLE students (id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL, email VARCHAR(400) NOT NULL UNIQUE, registration_date DATE NOT NULL);
CREATE TABLE enrollments (student_id INT NOT NULL REFERENCES students(id), course_id INT NOT NULL REFERENCES courses(id),
  enrolled_date DATE NOT NULL, PRIMARY KEY (student_id, course_id));
CREATE TABLE invoices (id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount DEC(19,2) NOT NULL, tax DEC(5,2) NOT NULL, invoice_date DATE NOT NULL);
INSERT INTO courses (name, duration) VALUES ('Introduction to PostgreSQL','10 hours'),
  ('Advanced PostgreSQL Performance Tuning','15 hours'),('C# Fundamentals','12 hours'),
  ('Building Web Applications with C# and ASP.NET','20 hours'),('PostgreSQL for Application Developers','18 hours');
INSERT INTO students (first_name, last_name, email, registration_date) VALUES
  ('John','Doe','john.doe@example.com','2024-05-20'),('Emma','Smith','emma.smith@example.com','2024-05-20'),
  ('Liam','Johnson','liam.johnson@example.com','2024-05-20'),('Olivia','Williams','olivia.williams@example.com','2024-05-20'),
  ('Noah','Brown','noah.brown@example.com','2024-05-15'),('Ava','Jones','ava.jones@example.com','2024-05-15'),
  ('William','Garcia','william.garcia@example.com','2024-05-15'),('Sophia','Miller','sophia.miller@example.com','2024-05-10'),
  ('James','Davis','james.davis@example.com','2024-05-10'),('Isabella','Rodriguez','isabella.rodriguez@example.com','2024-05-10'),
  ('Benjamin','Martinez','benjamin.martinez@example.com','2024-05-10');

```
Use: identity columns (`GENERATED ALWAYS` rejects explicit ids without OVERRIDING SYSTEM VALUE), interval display
(`10 hours` -> `10:00:00`), enrollment+invoice transaction, `get_student_count('2024-05-10','2024-05-15')` = 7.
(FKs added to enrollments, which the Neon page omitted.)

### S5 inventory (RETURNING old/new)  [M3]
```sql
CREATE TABLE inventory (
  product_id SERIAL PRIMARY KEY, product_name VARCHAR(100) NOT NULL UNIQUE, category VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0, unit_price DECIMAL(10,2) NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_by VARCHAR(50) DEFAULT CURRENT_USER);
INSERT INTO inventory (product_name, category, quantity, unit_price) VALUES
  ('Laptop Computer','Electronics',50,999.99),('Office Chair','Furniture',75,249.50),
  ('Wireless Mouse','Electronics',120,29.95),('Standing Desk','Furniture',30,399.00),
  ('USB Cable','Electronics',200,12.99),('Gaming Chair','Furniture',0,89.99);

```

### S6 products with virtual and stored generated columns  [M2, M3]
```sql
CREATE TABLE products (
  product_id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL, cost DECIMAL(10,2) NOT NULL, weight_kg DECIMAL(6,2),
  length_cm INTEGER, width_cm INTEGER, height_cm INTEGER,
  tax_rate DECIMAL(5,4) DEFAULT 0.0875, discount_rate DECIMAL(5,4) DEFAULT 0.00,
  selling_price DECIMAL(10,2) GENERATED ALWAYS AS (base_price * (1 - discount_rate) * (1 + tax_rate)),
  volume_cm3 INTEGER GENERATED ALWAYS AS (length_cm * width_cm * height_cm) STORED);
INSERT INTO products (name, category, base_price, cost, weight_kg, length_cm, width_cm, height_cm, tax_rate, discount_rate)
VALUES ('Laptop Pro 15','Electronics',1299.99,800.00,2.1,34,24,2,0.0875,0.05),
       ('Wireless Mouse','Electronics',49.99,15.00,0.15,12,7,4,0.0875,0.10),
       ('Desk Chair','Furniture',299.99,120.00,15.5,65,65,110,0.0625,0.00),
       ('Coffee Mug','Kitchen',12.99,3.50,0.4,10,10,12,0.0875,0.15),
       ('Book: PostgreSQL Guide','Books',39.99,8.00,0.6,23,18,3,0.00,0.00);

```
Use: `selling_price` (virtual, recomputed on read) vs `volume_cm3` (stored); try `CREATE INDEX ON products(selling_price)`
(0A000); pageinspect `heap_page_items(get_raw_page('products',0))` shows only the stored column in t_data.

### S7 temporal (WITHOUT OVERLAPS / PERIOD; PG19 FOR PORTION OF motivation)  [M3, M4]
Requires `btree_gist` (in PGlite's extension list).
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE employees (
  emp_id INTEGER, emp_name VARCHAR(100) NOT NULL, position VARCHAR(50) NOT NULL, salary DECIMAL(10,2) NOT NULL,
  valid_period tstzrange NOT NULL,
  PRIMARY KEY (emp_id, valid_period WITHOUT OVERLAPS));
INSERT INTO employees VALUES
  (1,'Alice Johnson','Software Engineer',75000, tstzrange('2024-01-01','2025-01-01','[)')),
  (1,'Alice Johnson','Senior Software Engineer',85000, tstzrange('2025-01-01','infinity','[)')),
  (2,'Bob Wilson','Marketing Specialist',60000, tstzrange('2024-06-01','2025-01-01','[)'));
CREATE TABLE project_assignments (
  assignment_id SERIAL PRIMARY KEY, emp_id INTEGER NOT NULL, project_name VARCHAR(100) NOT NULL,
  assignment_period tstzrange NOT NULL,
  FOREIGN KEY (emp_id, PERIOD assignment_period) REFERENCES employees (emp_id, PERIOD valid_period));
INSERT INTO project_assignments (emp_id, project_name, assignment_period) VALUES
  (1,'Website Redesign', tstzrange('2024-03-01','2024-06-01','[)')),
  (1,'Database Migration', tstzrange('2024-11-01','2025-04-01','[)')),
  (2,'Marketing Campaign', tstzrange('2024-08-01','2024-12-01','[)'));
CREATE TABLE product_prices (
  product_id INT NOT NULL, valid_range TSTZRANGE NOT NULL, price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (product_id, valid_range WITHOUT OVERLAPS));
INSERT INTO product_prices VALUES (1, tstzrange('2025-01-01','2026-01-01','[)'), 29.99),
  (2, tstzrange('2025-01-01','2026-01-01','[)'), 49.99);

```

### S8 sensor_readings (gap filling; PG19 IGNORE NULLS motivation)  [M3]
```sql
CREATE TABLE sensor_readings (sensor_id INT, ts TIMESTAMP, temperature DECIMAL(5,2), humidity DECIMAL(5,2));
INSERT INTO sensor_readings VALUES (1,'2025-01-01 08:00',22.5,45.0),(1,'2025-01-01 09:00',NULL,46.2),
  (1,'2025-01-01 10:00',NULL,NULL),(1,'2025-01-01 11:00',23.1,44.8),(1,'2025-01-01 12:00',NULL,45.5),
  (1,'2025-01-01 13:00',24.0,NULL);

```
PG18 last-observation-carried-forward (verified: 22.50, 22.50, 22.50, 23.10, 23.10, 24.00):
```sql
SELECT ts, temperature,
       first_value(temperature) OVER (PARTITION BY sensor_id, grp ORDER BY ts) AS locf
FROM (SELECT *, count(temperature) OVER (PARTITION BY sensor_id ORDER BY ts) AS grp FROM sensor_readings) s
ORDER BY ts;
```

### S9 social graph (joins / recursive CTE; reverted SQL/PGQ motivation)  [M3]
```sql
CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE);
CREATE TABLE follows (follower_id INT NOT NULL REFERENCES users(id), followed_id INT NOT NULL REFERENCES users(id),
  PRIMARY KEY (follower_id, followed_id));
INSERT INTO users (name, email) VALUES ('Alice','alice@example.com'),('Bob','bob@example.com'),
  ('Charlie','charlie@example.com'),('Diana','diana@example.com');
INSERT INTO follows VALUES (1,2),(1,3),(2,3),(3,4),(4,1);

```
Friends-of-friends of Alice by joins -> Charlie (via Bob), Diana (via Charlie); the cycle 1->3->4->1 makes a good
recursive-CTE CYCLE-clause exercise.

### S10 sales for skip scan  [M4]  (deterministic replacement for Neon's skewed random generator; 100k rows via generate_series)
```sql
CREATE TABLE sales (id SERIAL PRIMARY KEY, region VARCHAR(20), category VARCHAR(30), sale_date DATE, amount DECIMAL(10,2));
INSERT INTO sales (region, category, sale_date, amount)
SELECT (ARRAY['North','South','West'])[1 + i % 3],
       (ARRAY['Electronics','Clothing','Books','Home'])[1 + (i / 3) % 4],
       DATE '2025-01-01' + (i * 7) % 365,
       100 + (i * 13) % 900
FROM generate_series(1, 100000) i;
CREATE INDEX idx_sales_analytics ON sales (region, category, sale_date);
ANALYZE sales;
```
`EXPLAIN (ANALYZE) SELECT id FROM sales WHERE category='Electronics' AND sale_date='2025-06-01';` -> Bitmap Index Scan on
idx_sales_analytics with `Index Searches: 7`. Compare with `DROP INDEX` + an index on (category, sale_date) (1 search).

## Discrepancies and version notes

### Neon / vendor-specific
- Neon runs PG18 with `io_method = 'sync'` during its preview; AIO prefetch integration "coming". PGlite also reports `sync`.
- Neon PG18 does not support OAuth authentication.
- Every page carries a Lakebase/Neon/Databricks marketing box; "Postgres 18 is available on Neon [Preview]" and Docker
  try-out snippets are vendor framing only.

### Errors or stale statements in the PG18 pages (vs official PG18 docs / slice N)
- Several PG18 pages were written against Beta 1 ("currently in beta", "worker method (default in Beta 1)"); final
  defaults: `io_method = worker`, `io_workers = 3`, `effective_io_concurrency` / `maintenance_io_concurrency` = 16.
- AIO page: pg_prewarm used to "clear" the cache (it loads it); `pg_reload_conf()` used for a restart-only GUC.
- EXPLAIN page: "VERBOSE shows CPU usage" sample is a mismatched UPDATE plan; per release notes the CPU/WAL/average-read
  stats were added to `VACUUM`/`ANALYZE (VERBOSE)` and autovacuum logs, and EXPLAIN gained full WAL buffer counts. The
  real PG18 EXPLAIN additions: auto BUFFERS with ANALYZE, `Index Searches`, fractional row counts, Material/Window/CTE
  memory details, disabled-node markers.
- Overview page: shows `CHECK (email IS NOT NULL) NOT VALID` under "NOT NULL as NOT VALID" — that is the pre-18 workaround.
- NOT NULL page: lock level claimed for `VALIDATE CONSTRAINT` on a NOT NULL constraint (SHARE UPDATE EXCLUSIVE) — confirm
  in the ALTER TABLE docs slice before quoting.
- Skip-scan page: "requires at least one equality condition on a later column" is narrower than the release-note wording;
  its random generator is skewed by `::int` rounding.
- Temporal page: the department_budgets INSERT and the re-inserted employees in the FK demo would fail (verified 23P01).
  Temporal PK/UNIQUE violations are exclusion violations, SQLSTATE 23P01 (not 23505).
- uuidv7 page: measures page splits with pg_statio counters (they cannot show splits); its note about same-millisecond
  ordering understates PG18's within-backend monotonicity (verify wording in the UUID functions docs slice).
- Virtual-columns page: claims a "small overhead for the first read" then no recalculation — wrong; omits the PG18 ban on
  user-defined functions/types in virtual generation expressions (verified 0A000).
- Array page: claims MIN/MAX over arrays cannot use B-tree indexes; unverified (arrays have a btree opclass).
- psql page: uses `EXECUTE stmt` after `\bind_named` (the meta-command flow executes with `\g`).
- OAuth page: lists an `oauth_token` connection parameter not in slice N's release-note list; written against beta.
- PG19 logical-replication page says "PostgreSQL 18 added retain_dead_tuples"; that subscription option is not in slice
  N's PG18 notes — treat as PG19 or unverified, not as PG18.
- PG19 schema page mentions `pg_get_tabledef()` as long-existing — no such core function exists (core has
  `pg_get_viewdef`, `pg_get_indexdef`, `pg_get_constraintdef`, `pg_get_functiondef`, `pg_get_triggerdef`).

### Errors or stale statements in the PL/pgSQL pages
- "Parameters in stored procedures ... cannot have the out mode" — outdated since PostgreSQL 14 (verified CALL with OUT).
- Dollar-quote tags described as case-insensitive — they are case-sensitive (verified).
- Overloading page counts three functions where CREATE OR REPLACE left two (verified).
- CASE page's `IF found` after `SELECT sum() INTO` can never be false (verified).
- Variables page output omits the literal "s" after `%s` (verified "Brooklyn Deserts").
- RETURNS SETOF / composite results are described as "an array"; they are composite (row) values.
- `get_film_actors()` RETURNS SETOF record cannot be called without a column definition list (verified 42601).
- Drop-procedure page's two-argument insert_actor ignores its parameters.
- Exception page omits that EXCEPTION blocks run as subtransactions (performance and semantics; from the PL/pgSQL docs).

### Driver pages
- psycopg2 is presented as "the current version"; psycopg 3 exists and changes `with conn` semantics (closes the
  connection) and adds server-side binding, pipeline mode and `cursor.copy()`. Only the connect page mentions psycopg 3.
- C# UPDATE SQL is invalid; CSV import should use COPY; `?` placeholders are not Npgsql syntax.
- PHP BLOB page stores large-object OIDs into a BYTEA column (verified "17270").
- PG15+ requires explicit `GRANT ... ON SCHEMA public` for non-owner roles to create tables (C# page does it, without
  explaining why).

### PG19 material — PG19, not in PG18/PGlite
All of: ON CONFLICT DO SELECT; UPDATE/DELETE FOR PORTION OF; IGNORE NULLS/RESPECT NULLS; Memoize "Estimates" line;
pg_plan_advice + EXPLAIN (PLAN_ADVICE); REPACK [CONCURRENTLY] + pg_stat_progress_repack; autovacuum_max_parallel_workers /
autovacuum_parallel_workers; COPY TO (FORMAT JSON [, FORCE_ARRAY]); COPY partitioned_table TO; FOR ALL SEQUENCES; FOR ALL
TABLES EXCEPT (TABLE ...); effective_wal_level; pg_enable_data_checksums / pg_disable_data_checksums; pg_stat_wal.wal_fpi_bytes;
pg_stat_progress_vacuum.mode / started_by; per-process-type log_min_messages; psql %i and %S; WAIT FOR LSN; 64-bit
MultiXactOffset; pg_get_database_ddl / pg_get_role_ddl / pg_get_tablespace_ddl; pg_dumpall -Fc/-Fd/-Ft; breaking changes
(jit off by default, lz4 default_toast_compression, RADIUS removed, standard_conforming_strings forced on and
escape_string_warning removed, MD5 auth warnings, max_locks_per_transaction 128, MULE_INTERNAL removed, btree_gist inet/cidr
opclasses non-default, CR/LF banned in names, log_lock_waits on, BUFFERPIN -> BUFFER, postgres_fdw READ ONLY).
SQL/PGQ (CREATE PROPERTY GRAPH, GRAPH_TABLE) was in PG19 beta but REVERTED on 2026-09-07; not in PG19 final; earliest PG20.
Dates as stated by Neon: PG19 feature freeze April 2026, Beta 1 2026-06-04, final expected late 2026.

## Lesson ideas

### Visualizers
- [M4] Skip-scan animator: B-tree on (region, category, sale_date) drawn as three region subtrees; the scan descends once
  per region, jumps, and the counter ticks to the real `Index Searches: 7` from S10. Toggle to a (category, sale_date)
  index and watch it become 1 search.
- [M2] UUID v4 vs v7 insertion: leaf pages filling left-to-right (v7, right-edge appends) vs random positions with page
  splits (v4); back it with `pg_relation_size` of both indexes after 100k inserts and pageinspect `bt_page_stats`
  avg free size.
- [M3/M5] RETURNING old/new: show the UPDATE creating a new tuple version; `old` labelled on the tuple getting xmax,
  `new` on the new tuple; the no-op upsert moving ctid (0,1) -> (0,2) (verified) vs PG19's DO SELECT leaving it.
- [M3] Temporal timeline: horizontal bars per emp_id; dragging a new bar into overlap flashes 23P01; a project bar must
  be covered by the union of employee bars (temporal FK); PG19 FOR PORTION OF shown as a bar being cut into 3 pieces.
- [M7] Autovacuum trigger curve: threshold = min(50 + 0.2 x n, autovacuum_vacuum_max_threshold) plotted for n up to 1e9;
  sliders for scale factor and the PG18 cap.
- [M1] AIO ladder: sync (one read at a time, blocking), worker (requests queued to 3 io workers), io_uring (submission/
  completion rings) — latency bars for cloud vs NVMe; note PGlite runs `sync`.
- [M6] PL/pgSQL exception block = savepoint: stack diagram of subtransactions as a loop with an EXCEPTION block runs per
  row; counter of subxacts; rollback of the block's writes while variables survive.
- [M6] Driver round-trip timeline: same 10 inserts as (a) 10 autocommit statements, (b) one transaction, (c) one batch /
  pipeline, (d) COPY — with 100 ms RTT, mirroring the psql pipeline page's 1 s vs 100 ms arithmetic.
- [M2] Large object vs BYTEA: pg_largeobject 2 kB chunks + OID reference vs inline TOAST; animate the PHP bug where the OID
  digits "17270" get stored as bytes.

### PGlite playground snippets (all PG18; verified where marked)
- [M2] `SELECT 1234::bytea, (-1234)::bytea, 123::smallint::bytea, 123::bigint::bytea, reverse('\x12345678'::bytea);` (verified)
- [M2] `SELECT uuidv7(), uuid_extract_timestamp(uuidv7()), uuid_extract_version(uuidv4()), uuidv7(INTERVAL '-1 hour');`
- [M3] S5 upsert with `RETURNING old.quantity AS before, new.quantity AS after` (alias! PGlite collapses duplicate names).
- [M3] S7: overlap insert -> 23P01; FK to 2022 -> 23503; spanning assignment accepted. (verified)
- [M3] NOT NULL NOT VALID full cycle on a users table, with the pg_constraint query. (verified)
- [M4] `EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF) ...` on S10 to show auto BUFFERS, `Index Searches`, fractional rows. (verified)
- [M5] `BEGIN; CALL transfer(1,2,10); COMMIT;` -> 2D000 vs top-level CALL. (verified)
- [M6] PL/pgSQL kata set on S1: FOUND vs STRICT (no_data_found P0002 / too_many_rows P0003), CASE without ELSE (20000),
  ASSERT (P0004), CONSTANT (22005), overload ambiguity (42725), OUT procedure, labeled EXIT of outer loop. (verified)
- [M6] Gaps-and-islands LOCF on S8 (PG18) next to the PG19 IGNORE NULLS one-liner (shown as "coming in 19", not run).
- [M6] Bug hunts from the tutorials as exercises: sum()-INTO-FOUND, length-120 boundary, `%s` placeholder, insert_actor
  ignoring params, C#'s invalid UPDATE, PHP OID-in-bytea.

### Production scenarios
- [M7] "Add NOT NULL to a 50M-row table without downtime": NOT VALID -> batched backfill -> VALIDATE; compare locks.
- [M7] "Large tables bloat before autovacuum fires": set `autovacuum_vacuum_max_threshold` per table; read
  `total_autovacuum_time`; enable `track_cost_delay_timing` and read `delay_time`.
- [M5/M6] "Idempotent get-or-create under concurrency" in PG18: no-op DO UPDATE (bloat) vs DO NOTHING + CTE (race) vs
  retry loop in PL/pgSQL — then mention PG19 DO SELECT.
- [M7] "Upgrading to PG19 checklist" sidebar from the breaking-changes page (jit, lz4, RADIUS, string escapes, btree_gist
  inet opclass query, MD5 -> SCRAM ordering).
- [M6] "Why your bulk import is slow": executemany/row loop vs batch vs COPY, per driver.
- [M1] "Who is doing I/O right now": `pg_stat_get_backend_io(pg_backend_pid())` and the `pg_stat_io` WAL rows.
