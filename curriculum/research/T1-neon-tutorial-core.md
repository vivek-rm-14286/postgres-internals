# T1 — Neon PostgreSQL Tutorial (core SQL tutorial series)

Source: neon.com/postgresql/tutorial/* (the former postgresqltutorial.com series, rehosted by Neon). Every page carries
a boilerplate "INFO" paragraph advertising Lakebase/Neon/Databricks — vendor marketing, ignored. Nearly all examples
run against the **dvdrental** sample database (film, actor, customer, payment, rental, inventory, address, city,
country, staff, store, category, film_category, film_actor, language). Many pages instead build tiny ad-hoc tables
(employees/managers, contacts, products, etc.), which are captured below because they are perfect PGlite seeds.

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 304 | tutorial.txt | Index/TOC of the series: 17 sections (querying, filtering, joins, grouping, set ops, grouping sets, subquery, CTE, DML, transactions, import/export, tables, constraints, data types, conditional exprs, psql, recipes) + pointers to advanced (PL/pgSQL, triggers, views, indexes, admin). Useful as a ready-made beginner syllabus ordering. |
| 305 | tutorial__add-column.txt | ALTER TABLE ADD COLUMN (single/multiple); column always appended at end; NOT NULL on populated table fails -> add nullable, backfill, SET NOT NULL. |
| 306 | tutorial__alias.txt | Table aliases (AS optional); needed to disambiguate in joins and mandatory for self-joins (film f1/f2 same length). |
| 307 | tutorial__all.txt | `expr op ALL(subquery)` semantics (> ALL = greater than max, etc.); empty subquery -> TRUE; employees/managers seed. |
| 308 | tutorial__alter-table.txt | Tour of ALTER TABLE actions on a `links` table: add/drop/rename column, SET DEFAULT, ADD CHECK, ADD CONSTRAINT UNIQUE, RENAME TO. Shows auto-named `links_target_check`. |
| 309 | tutorial__and.txt | Three-valued logic for AND with full truth table; boolean literal spellings; film length>180 AND rental_rate<1 (10 rows). |
| 310 | tutorial__any.txt | `expr op ANY(subquery)`; SOME synonym; empty set -> FALSE; also works with arrays; walk-through of how = ANY evaluates. |
| 311 | tutorial__array.txt | Array columns (`TEXT[]`), ARRAY[] constructor vs '{...}' literal, 1-based subscripts, update element/whole array, `= ANY(arr)` search, unnest(). |
| 312 | tutorial__between.txt | BETWEEN inclusive both ends, NOT BETWEEN = `< low OR > high`; payment_id 17503..17505; date range on timestamp column (pitfall: upper bound is midnight). |
| 313 | tutorial__boolean.txt | BOOLEAN (1 byte, alias BOOL), accepted literals, `WHERE available` / `NOT available`, SET DEFAULT FALSE; stock_availability seed. |
| 314 | tutorial__bytea-data-type.txt | BYTEA binary strings, max 1GB, store big files externally; `'\x012345'` hex input/output. |
| 315 | tutorial__case.txt | Searched vs simple CASE; first-true-wins, no ELSE -> NULL; length buckets; SUM(CASE...) pivot counts by rental_rate and rating. |
| 316 | tutorial__cast.txt | CAST(x AS t) vs `x::t` (PG-specific); 14 examples incl. errors ('10C', type "double"), 9.99::int=10 (rounds), interval display, array<->text, regex-guarded cast in CASE. |
| 317 | tutorial__change-column-type.txt | ALTER COLUMN [SET DATA] TYPE, multiple columns, USING expr; VARCHAR->INT error with HINT `USING asset_no::integer`; assets seed. |
| 318 | tutorial__char-varchar-text.txt | CHAR(n)/VARCHAR(n)/TEXT; length errors; trailing-space truncation exception; explicit cast truncates; no perf difference; CHAR = CHAR(1). |
| 319 | tutorial__check-constraint.txt | CHECK as column/table constraint, default name `{table}_{column}_check`, ADD/DROP CONSTRAINT, function-based CHECK (LENGTH(TRIM())). |
| 320 | tutorial__coalesce.txt | COALESCE first non-null, short-circuits; NVL/IFNULL equivalents; items(price, discount NULL) net_price fix; CASE equivalent. |
| 321 | tutorial__column-alias.txt | Column alias (AS optional), `?column?` default header for expressions, `||` concat, double-quoted aliases with spaces. |
| 322 | tutorial__compare-two-tables-in-postgresql.txt | Diff two tables (foo/bar) with EXCEPT both ways + UNION, or FULL OUTER JOIN USING (id,name) WHERE either side IS NULL; COUNT of differences. |
| 323 | tutorial__composite-types.txt | CREATE TYPE ... AS (fields); every table gets a row type; ROW(...) constructor; insert into subfields `address.city`; read `(address).city`, `(address).*`; UPDATE SET address.country (no parens). |
| 324 | tutorial__copy-table.txt | CREATE TABLE new AS TABLE old [WITH NO DATA]; partial copy via AS SELECT ... WHERE; indexes/constraints/NOT NULL/defaults are NOT copied; re-add PK/UNIQUE. |
| 325 | tutorial__correlated-subquery.txt | Correlated subquery re-evaluated per outer row; films longer than the average of their rating. |
| 326 | tutorial__create-table.txt | CREATE TABLE [IF NOT EXISTS] syntax, column vs table constraints overview, accounts table in dvdrental, psql \c and \d, auto-named indexes. |
| 327 | tutorial__create-table-as.txt | CTAS incl. TEMP/UNLOGGED/IF NOT EXISTS/column-name list; action_film and film_rating(rating, film_count); preferred over SELECT INTO. |
| 328 | tutorial__cross-join.txt | CROSS JOIN = Cartesian product n*m; equivalent `FROM t1, t2` and `INNER JOIN ... ON true`; T1(label)/T2(score) seed -> 6 rows; scheduling/inventory use cases. |
| 329 | tutorial__cte.txt | WITH name (cols) AS (...); action films; CTE joined to staff (Mike 8040 / Jon 8004 rentals); multiple CTEs summary (2.98, 185, 46, 599, 61312.04). |
| 330 | tutorial__cube.txt | CUBE(c1..cn) = all 2^n grouping sets; equivalence to GROUPING SETS; partial cube `GROUP BY brand, CUBE(segment)` on sales table. |
| 331 | tutorial__data-types.txt | Survey of types (boolean, character, numeric, temporal, array, JSON/JSONB, UUID, geometric, network). Contains factual errors (see Discrepancies). |
| 332 | tutorial__date.txt | DATE (4 bytes, 4713 BC..5874897 AD, ISO yyyy-mm-dd), DEFAULT CURRENT_DATE, NOW()::date, TO_CHAR formats, date subtraction, AGE() 1- and 2-arg, EXTRACT. |
| 333 | tutorial__default-value.txt | DEFAULT literal/expression, DEFAULT keyword in VALUES, SET/DROP DEFAULT; products price DEFAULT 0, logs CURRENT_TIMESTAMP, settings JSONB DEFAULT '{}'. |
| 334 | tutorial__delete.txt | DELETE ... WHERE, command tag `DELETE n`, RETURNING *, delete all rows; todos (10 rows) seed. |
| 335 | tutorial__delete-cascade.txt | FK ON DELETE CASCADE; departments/employees seed; deleting Engineering removes its 2 employees. |
| 336 | tutorial__delete-join.txt | No DELETE JOIN; use `DELETE ... USING` (non-standard) or `WHERE col IN (subquery)`; member/denylist seed. |
| 337 | tutorial__distinct-on.txt | DISTINCT ON (expr) keeps first row per group according to ORDER BY; leftmost ORDER BY must match; student_scores top score per student. |
| 338 | tutorial__double-precision-type.txt | DOUBLE PRECISION = float8 = float, IEEE 754, ~15 digits, range 1E-307..1E+308; 0.1+0.1+0.1 = 0.30000000000000004; 1E-400 out of range. |
| 339 | tutorial__drop-column.txt | DROP COLUMN [IF EXISTS] [CASCADE]; dropping removes indexes/constraints on it; view dependency error + HINT; multiple drops; zero-column tables allowed; books/publishers/categories seed. |
| 340 | tutorial__drop-table.txt | DROP TABLE [IF EXISTS] t1, t2 [CASCADE/RESTRICT default]; NOTICE vs ERROR; FK dependency error `pages_author_id_fkey`; owner privileges required. |
| 341 | tutorial__enum.txt | CREATE TYPE ... AS ENUM, declaration order = sort order, comparisons, case-sensitive invalid input error, ALTER TYPE ADD VALUE [BEFORE/AFTER], RENAME VALUE, enum_range/first/last, enum vs lookup-table FK trade-off. |
| 342 | tutorial__except.txt | EXCEPT returns distinct left rows not in right; column count/type rules; ORDER BY after last query; top_rated_films / most_popular_films seed. |
| 343 | tutorial__exists.txt | EXISTS true iff >=1 row (content irrelevant, `SELECT 1` convention, a NULL row counts); NOT EXISTS; correlated customer/payment amount > 11 (8 customers). |
| 344 | tutorial__explain.txt | EXPLAIN options (ANALYZE, VERBOSE, COSTS, BUFFERS, TIMING, SUMMARY, FORMAT); wrap DML EXPLAIN ANALYZE in BEGIN/ROLLBACK; plan outputs were images (not captured). |
| 345 | tutorial__export-postgresql-table-to-csv-file.txt | COPY table/columns TO file CSV HEADER (server-side file, server OS user), psql \copy (client-side, no superuser). |
| 346 | tutorial__fetch.txt | SQL:2008 `OFFSET n ROWS FETCH {FIRST|NEXT} n {ROW|ROWS} ONLY` ≡ LIMIT/OFFSET; defaults (offset 0, count 1); order of clauses free in PG. |
| 347 | tutorial__foreign-key.txt | FK syntax, referencing/referenced, actions SET NULL / SET DEFAULT / RESTRICT / NO ACTION (default) / CASCADE demonstrated on customers/contacts; error 23503; replace FK to add CASCADE. |
| 348 | tutorial__full-outer-join.txt | FULL [OUTER] JOIN step-by-step algorithm; departments(5)/employees(6, one NULL dept) seed; 7 rows; find unmatched each side with IS NULL. |
| 349 | tutorial__generate_series.txt | generate_series(int/numeric, step) and (timestamp[tz], interval[, timezone]); DST demo America/New_York; random ints; 100 fake employees; calendar `dates` table with generated columns (contains a PG14+ numeric EXTRACT bug). |
| 350 | tutorial__generated-columns.txt | GENERATED ALWAYS AS (expr) STORED; restrictions (immutable, no other generated cols, no default/identity, not partition key); full_name and net_price examples. Says "only STORED implemented" — outdated for PG18 (VIRTUAL). |
| 351 | tutorial__group-by.txt | GROUP BY evaluation order; GROUP BY as DISTINCT; SUM per customer (top 148 = 211.55); join + group by full_name; COUNT per staff (7292/7304); two-column groups; group by payment_date::date. |
| 352 | tutorial__grouping-sets.txt | sales(brand, segment, quantity) seed; four separate GROUP BYs + UNION ALL with NULL padding vs GROUPING SETS (single scan); GROUPING() bit and HAVING GROUPING(brand)=0. |
| 353 | tutorial__having.txt | HAVING filters groups; evaluated before SELECT so aliases can't be used; customers > 200 spend (148, 526); stores > 300 customers (store 1: 326 vs 273). |
| 354 | tutorial__how-to-delete-duplicate-rows-in-postgresql.txt | basket fruits seed; find dupes GROUP BY HAVING COUNT>1; delete via self DELETE USING (a.id<b.id keeps highest), ROW_NUMBER() subquery, or copy-distinct-and-swap table. |
| 355 | tutorial__hstore.txt | CREATE EXTENSION hstore; books(attr hstore) seed; `->`, `||` add/update key, delete(), `?`, `@>`, `?&`/`?|`, akeys/skeys/avals/svals, hstore_to_json, each(). |
| 356 | tutorial__identity-column.txt | GENERATED {ALWAYS|BY DEFAULT} AS IDENTITY (PG10+, SQL standard); OVERRIDING SYSTEM VALUE; sequence options START/INCREMENT; ADD GENERATED on NOT NULL column; SET GENERATED / RESTART; DROP IDENTITY. |
| 357 | tutorial__import-csv-file-into-posgresql-table.txt | COPY persons(cols) FROM 'file' DELIMITER ',' CSV HEADER (server-side, superuser); TRUNCATE ... RESTART IDENTITY; pgAdmin import (click-path, skipped). |
| 358 | tutorial__in.txt | IN list ≡ chain of OR =; NOT IN ≡ chain of AND <>; numbers/strings/dates (cast payment_date::date); claims IN faster than ORs. |
| 359 | tutorial__inner-join.txt | INNER JOIN mechanics (compare each pair), aliases, USING; customer⋈payment and 3-way customer⋈payment⋈staff. |
| 360 | tutorial__insert.txt | INSERT tag `INSERT oid count`; RETURNING * / col / AS alias; escaping `O''Reilly`; date literal; "last inserted id" via RETURNING id; links seed. |
| 361 | tutorial__insert-multiple-rows.txt | Multi-row VALUES: fewer round trips, atomic; RETURNING * / id; contacts seed (ids 1..8). |
| 362 | tutorial__integer.txt | SMALLINT 2B / INTEGER 4B / BIGINT 8B ranges; no unsigned; CHECK (pages > 0), population >= 0. |
| 363 | tutorial__intersect.txt | INTERSECT rules, ORDER BY at end; popular ∩ top-rated = Godfather, Dark Knight. |
| 364 | tutorial__interval.txt | interval: 16 bytes, months/days/microseconds internally, ±178M years, precision 0..6; verbose & ISO 8601 inputs; four IntervalStyle outputs; arithmetic; TO_CHAR; EXTRACT; justify_*; event table SUM(duration). |
| 365 | tutorial__is-null.txt | NULL = missing/not applicable; `null = null` is NULL; IS [NOT] NULL; psql `\pset null`; address2 mixes NULL and '' (bad practice). |
| 366 | tutorial__isnull.txt | No ISNULL() in PG; use COALESCE(expr, replacement) or CASE WHEN expr IS NULL. |
| 367 | tutorial__joins.txt | Visual overview of joins with teams(4)/players(5, two NULL team_id) seed: inner 3, left 5, left-anti 2, right 5, right-anti 2, full 7, full-anti 4. |
| 368 | tutorial__json.txt | JSON object/array basics; JSON vs JSONB table (some claims wrong); products.properties JSONB; `->` vs `->>`; filter `->> 'color' IN (...)`; array index `phones ->> 0`. |
| 369 | tutorial__left-join.txt | LEFT [OUTER] JOIN mechanics; film ⋈ inventory; films not in inventory via `WHERE i.inventory_id IS NULL` (Alice Fantasia, Apollo Teen, ...). |
| 370 | tutorial__like.txt | LIKE % and _; no wildcard ≈ '='; '%er%', '_her%'; NOT LIKE; ILIKE; ~~ ~~* !~~ !~~* operators; ESCAPE '$'. |
| 371 | tutorial__limit.txt | LIMIT n [OFFSET m]; LIMIT 0 empty, LIMIT NULL = no limit; OFFSET applied before LIMIT; top-N with ORDER BY rental_rate DESC (ties!). |
| 372 | tutorial__merge.txt | MERGE INTO target USING source ON ... WHEN [NOT] MATCHED [AND cond] THEN UPDATE/DELETE/INSERT; PG17 RETURNING merge_action(); products/product_updates seed; FAQ (PG15 intro, PG17 views, privileges, atomicity). |
| 373 | tutorial__natural-join.txt | NATURAL [INNER/LEFT/RIGHT] JOIN = USING(all common columns); categories/products seed; city NATURAL JOIN country returns 0 rows because of shared last_update. |
| 374 | tutorial__not-null-constraint.txt | NULL semantics; NOT NULL column constraint; SET NOT NULL after backfill (production_orders); NOT NULL ≡ CHECK (col IS NOT NULL); "username or email required" CHECK. |
| 375 | tutorial__nullif.txt | NULLIF(a,b); COALESCE(NULLIF(excerpt,''), LEFT(body,40)); division-by-zero guard with NULLIF(denominator, 0); posts and members seeds. |
| 376 | tutorial__numeric.txt | NUMERIC(p,s)/DECIMAL/DEC; negative scale (PG15+); rounding on scale overflow, error on precision overflow; NaN/±Infinity; NaN = NaN and sorts above all numbers. |
| 377 | tutorial__or.txt | OR truth table with NULL (T∨N=T, F∨N=N); rental_rate = 0.99 OR 2.99. |
| 378 | tutorial__order-by.txt | ORDER BY ASC/DESC, multiple keys, expressions, alias usable (evaluated after SELECT); NULLS FIRST/LAST defaults (ASC -> NULLS LAST, DESC -> NULLS FIRST); sort_demo seed. |
| 379 | tutorial__primary-key.txt | PK = NOT NULL + UNIQUE, creates unique btree index, default name `<table>_pkey`; single/composite PK; ADD PRIMARY KEY; add SERIAL PK column to populated vendors; DROP CONSTRAINT vendors_pkey keeps column. |
| 380 | tutorial__random-range.txt | random() in [0,1); `floor(random()*(high-low+1)+low)::int`; PL/pgSQL random_between(low, high) STRICT function; with generate_series. |
| 381 | tutorial__real-data-type.txt | REAL = float4, 4 bytes, ±3.40282347E38, ~6 digits; weathers seed; AVG shows 5.360000038146973 float noise. |
| 382 | tutorial__recursive-query.txt | WITH RECURSIVE anchor UNION [ALL] recursive term; R0..Rn iteration semantics; employees org chart (20 rows); subordinates of id 2 (10 rows), iteration-by-iteration result sets shown. |
| 383 | tutorial__rename-column.txt | RENAME [COLUMN] a TO b; no IF EXISTS for the column; one column per clause; dependent view definitions auto-updated (\d+ customer_data). |
| 384 | tutorial__rename-table.txt | ALTER TABLE [IF EXISTS] t RENAME TO n; sequence/index names unchanged (vendors_id_seq, vendors_pkey); FKs and views follow the rename (OID-based). |
| 385 | tutorial__right-join.txt | RIGHT [OUTER] JOIN mechanics; inventory RIGHT JOIN film; films with no inventory via IS NULL. |
| 386 | tutorial__rollup.txt | ROLLUP(c1,c2,c3) = hierarchical n+1 grouping sets vs CUBE's 2^n; order matters; partial rollup; rentals per year/month/day ROLLUP of EXTRACTs. Outputs were images. |
| 387 | tutorial__select.txt | SELECT list / FROM basics, FROM before SELECT, keywords case-insensitive, `;` terminator, SELECT * anti-pattern in apps, expressions & `?column?`, SELECT without FROM (NOW()). |
| 388 | tutorial__select-distinct.txt | DISTINCT on one/multiple columns/`*`; NULLs treated as duplicates; colors(bcolor, fcolor) seed; distinct rental rates 0.99/2.99/4.99. |
| 389 | tutorial__select-into.txt | SELECT ... INTO [TEMP] [TABLE] new_table; film_r (rating R, rental_duration 5), TEMP short_film (<60 min); prefer CTAS, conflicts with PL/pgSQL INTO. |
| 390 | tutorial__self-join.txt | Self-join on employee(manager_id FK to itself, ON DELETE CASCADE) 8-row org chart; INNER (7 rows, top boss missing) vs LEFT (8 rows); film pairs of same length with f1.film_id > f2.film_id. |
| 391 | tutorial__sequences.txt | CREATE SEQUENCE full option list with defaults (AS bigint, INCREMENT 1, MIN/MAX, START, CACHE 1, NO CYCLE, OWNED BY); nextval; descending cycle 3,2,1; OWNED BY drop semantics; list via pg_class relkind 'S'; DROP SEQUENCE. |
| 392 | tutorial__serial.txt | SERIAL = sequence + DEFAULT nextval + NOT NULL + OWNED BY; SMALLSERIAL/SERIAL/BIGSERIAL ranges; no implicit index/PK; DEFAULT keyword; pg_get_serial_sequence + currval; RETURNING id; gaps on rollback. |
| 393 | tutorial__server-and-database-objects.txt | Conceptual tour: server service (instance/port/data dir), databases, tables (inheritance), schemas, tablespaces (pg_default, pg_global), views, functions, operators, casts, sequences, extensions (9.1+). |
| 394 | tutorial__subquery.txt | Scalar subquery (country_id of United States = 103 -> US cities) and IN-subquery (Action films); "subquery executed first". |
| 395 | tutorial__temporary-table.txt | CREATE TEMP[ORARY] TABLE; session-private, dropped at session end; shadows permanent table of same name (pg_temp_N schema first in search_path); access permanent via public.customers; \dt+ Persistence column. |
| 396 | tutorial__time.txt | TIME(p) 8 bytes 00:00:00..24:00:00, input formats; TIMETZ 12 bytes (discouraged); CURRENT_TIME(p), LOCALTIME(p), AT TIME ZONE 'UTC-7' (POSIX sign trap), EXTRACT, time - time = interval, time + interval. |
| 397 | tutorial__timestamp.txt | timestamp vs timestamptz (both 8 bytes, typlen from pg_type; tz stored as UTC, no zone saved); SET timezone demo LA -> NY; NOW/CURRENT_TIMESTAMP/CURRENT_TIME/TIMEOFDAY; timezone(zone, ts); updated_at BEFORE UPDATE trigger. |
| 398 | tutorial__transaction.txt | ACID definitions; implicit per-statement transaction; BEGIN [WORK|TRANSACTION], COMMIT, ROLLBACK; uncommitted insert invisible to other sessions; accounts(balance CHECK >= 0) bank-transfer seed. |
| 399 | tutorial__truncate-table.txt | TRUNCATE one/many tables; FK blocks it (HINT ... TRUNCATE ... CASCADE); CASCADE notice; RESTART vs CONTINUE IDENTITY (default); no ON DELETE triggers (TRUNCATE triggers instead); transaction-safe; "why faster" list (partly wrong). |
| 400 | tutorial__union.txt | UNION (dedupe) vs UNION ALL; column rules; final ORDER BY only (ORDER BY in first query errors); film tables: 6 vs 8 rows. |
| 401 | tutorial__unique-constraint.txt | UNIQUE column/table constraint auto-creates unique index (`person_email_key`); multi-column UNIQUE; CREATE UNIQUE INDEX CONCURRENTLY + ADD CONSTRAINT ... UNIQUE USING INDEX; check pg_stat_activity for idle-in-transaction blockers. |
| 402 | tutorial__update.txt | UPDATE ... SET ... WHERE; tag `UPDATE count` counts rows even if unchanged; RETURNING; price * 1.05 over courses seed (row order changes after updates). |
| 403 | tutorial__update-join.txt | UPDATE ... FROM other_table WHERE join-cond; product_segment (discount) / product (20 rows) net_price computation; syntax line `SET table1.c1` is invalid in PG. |
| 404 | tutorial__upsert.txt | INSERT ... ON CONFLICT (target) DO NOTHING / DO UPDATE SET col = EXCLUDED.col; inventory seed; tag `INSERT 0 1` both for update and insert paths. |
| 405 | tutorial__user-defined-data-types.txt | CREATE DOMAIN contact_name AS VARCHAR NOT NULL CHECK (value !~ '\s'); error `contact_name_check`; \dD; pg_type typtype 'd' query; CREATE TYPE film_summary + SQL function returning it; \dT. |
| 406 | tutorial__uuid.txt | UUID 128-bit (RFC 4122), gen_random_uuid() v4 built-in, uuid DEFAULT gen_random_uuid() PK; uuid-ossp uuid_generate_v4() for old versions. No v7 mention. |
| 407 | tutorial__vs-mysql.txt | Feature comparison table PostgreSQL 16 vs MySQL 8 (license, storage engines, TRUNCATE, identity, unsigned, boolean, MVs, FULL JOIN, partial indexes, partitioning, process-per-connection). Several inaccuracies. |
| 408 | tutorial__where.txt | WHERE after FROM, before SELECT/ORDER BY (aliases not usable); operator table; customer examples (Jamie, Rice, Rodriguez OR Adam, IN Ann/Anne/Annie, LIKE 'Ann%', LENGTH BETWEEN 3 AND 5, <> Motley). |
| 409 | tutorial__xml-data-type.txt | XML type, XMLPARSE(DOCUMENT ...), xpath() returns xml[], `[1]::text::integer`, filter by xpath, btree expression index on `xpath(...)::text[]` + 1000 generated rows + EXPLAIN ANALYZE showing Bitmap Index Scan. |

## Teaching material by topic

### Three-valued logic: AND / OR / NOT with NULL  [M3]  (source: tutorial__and.txt, tutorial__or.txt)
- Angle: "a boolean has three values: true, false, null" stated up front, then one tiny `SELECT x AND y AS result;` per
  cell of the truth table. Very playground-friendly: each row of the table is a one-liner learners can run.
- AND truth table (order of operands irrelevant): T∧T=T, T∧F=F, T∧N=N, F∧F=F, F∧N=F, N∧N=N.
  ```sql
  SELECT true AND null  AS r;   -- null
  SELECT false AND null AS r;   -- f   (false dominates)
  SELECT null AND null  AS r;   -- null
  ```
- Boolean input spellings accepted: true/'t'/'true'/'y'/'yes'/'1' and false/'f'/'false'/'n'/'no'/'0'. psql prints t/f.
- dvdrental: `SELECT title, length, rental_rate FROM film WHERE length > 180 AND rental_rate < 1;` -> 10 rows
  (Catch Amistad 183, Haunting Pianist 181, ... Young Language 183, all 0.99).

### Quantified comparisons: ANY / SOME / ALL  [M3]  (source: tutorial__any.txt, tutorial__all.txt, tutorial__array.txt)
- Angle: reduce each form to min/max: `> ALL` = greater than the biggest; `< ALL` = smaller than the smallest;
  `> ANY` = greater than the smallest; `< ANY` = less than the biggest; `= ANY` ≡ IN; `<> ALL` ≡ NOT IN.
- Edge cases worth a quiz: **empty subquery -> ALL is TRUE, ANY is FALSE** (vacuous truth). SOME is a synonym of ANY.
  Subquery must return exactly one column. ANY also accepts an array: `'x' = ANY(phones)`.
- Worked example (employees/managers seed, see Reusable schemas; ALL page uses Bob=75000, ANY page uses Bob=45000):
  - `salary > ALL(SELECT salary FROM managers)` -> Bob Williams 75000 only (max manager = 60000).
  - `salary < ALL(...)` -> 8 rows, everyone below 55000 (min manager).
  - `salary = ANY(...)` -> Charlie Davis 55000.
  - `salary > ANY(...)` -> Jack 56000, Liam 59000 (greater than min 55000).
  - `salary < ANY(...)` -> all 12 rows (all < 60000).
- Pitfall (not in tutorial, add it): `x <> ALL(subq)` / NOT IN returns NULL (no rows) if the subquery yields a NULL.

### Arrays  [M2, M3]  (source: tutorial__array.txt)
- Every type has a companion array type; user-defined types get one automatically. Declaration `phones TEXT[]`; `[][]`
  for 2-D (Postgres does not enforce declared dimensions — note from docs, the tutorial doesn't mention it).
- Two literal syntaxes: `ARRAY['(408)-589-5846','(408)-589-5555']` vs `'{"(408)-589-5841"}'` (single quotes around the
  array, double quotes around text elements).
- 1-based subscripts: `phones[1]`; filter `WHERE phones[2] = '...'`; update element `SET phones[2] = '...'`, or whole array.
- Search regardless of position: `WHERE '(408)-589-5555' = ANY (phones)`; expand: `SELECT name, unnest(phones) FROM contacts`
  (4 rows from 3 contacts after the update — good visual of "one row fans out into N").
- Lesson link: arrays are a good bridge to GIN indexes in M4 (`@>` containment), not covered on this page.

### ALTER TABLE family: ADD / DROP / RENAME / DEFAULT / constraints  [M1, M2]  (source: tutorial__alter-table.txt, tutorial__add-column.txt)
- Angle: one `links(link_id serial, title, url)` table mutated step by step: ADD COLUMN active boolean -> DROP it -> RENAME
  title TO link_title -> ADD target VARCHAR(10) -> `ALTER COLUMN target SET DEFAULT '_blank'` -> `ADD CHECK (target IN
  ('_self','_blank','_parent','_top'))` -> `ADD CONSTRAINT unique_url UNIQUE (url)` -> `RENAME TO urls`.
- Auto-generated constraint name shown in the error: `new row for relation "links" violates check constraint
  "links_target_check"` — teaches the `<table>_<column>_check` naming convention.
- New columns are always appended at the end; there is no `AFTER col` / position option (unlike MySQL).
- Multiple ADD COLUMN clauses in one statement (comma separated) — one table rewrite/lock instead of several.
- Pitfall: `ALTER TABLE customers ADD COLUMN contact_name VARCHAR(255) NOT NULL;` on a populated table ->
  `ERROR: column "contact_name" of relation "customers" contains null values`. Tutorial's fix: add nullable, UPDATE to
  backfill, then `ALTER COLUMN contact_name SET NOT NULL`. Missing alternative worth teaching: `ADD COLUMN ... NOT NULL
  DEFAULT 'x'` works in one step, and since PG11 a non-volatile default is stored in the catalog (attmissingval) with
  no table rewrite — great M2 internals hook.
- psql `\d customers` output (Column | Type | Collation | Nullable | Default, with `nextval('customers_id_seq'::regclass)`)
  is used everywhere; in PGlite, emulate with a query on information_schema.columns / pg_attribute.

### Table aliases  [M3]  (source: tutorial__alias.txt)
- `film AS f` or `film f`; required when the same column name exists in several joined tables; mandatory for self-join:
  ```sql
  SELECT f1.title, f2.title, f1.length
  FROM film f1 INNER JOIN film f2 ON f1.film_id <> f2.film_id AND f1.length = f2.length;
  ```
  Note this produces each pair twice (A,B) and (B,A); use `f1.film_id < f2.film_id` to dedupe — good exercise.

### Range filter: BETWEEN  [M3]  (source: tutorial__between.txt)
- Inclusive on both ends: `v BETWEEN lo AND hi` ≡ `v >= lo AND v <= hi`; `NOT BETWEEN` ≡ `v < lo OR v > hi`.
- dvdrental: `payment_id BETWEEN 17503 AND 17505` -> (17503, 7.99), (17504, 1.99), (17505, 7.99).
- Date-range example: `payment_date BETWEEN '2007-02-15' AND '2007-02-20' AND amount > 10` -> 7 rows, all 10.99,
  latest 2007-02-19 09:18. **Pitfall worth teaching (the tutorial silently has it):** payment_date is a timestamp, so
  '2007-02-20' means 2007-02-20 00:00:00 and the whole of Feb 20 is excluded. Teach the half-open form
  `payment_date >= '2007-02-15' AND payment_date < '2007-02-21'`.

### BOOLEAN type  [M2]  (source: tutorial__boolean.txt)
- One byte on disk (typlen 1). BOOL alias. Literals (quotes required except true/false): 't','true','y','yes','1' /
  'f','false','n','no','0'; leading/trailing whitespace ignored.
  ```sql
  CREATE TABLE stock_availability (product_id INT PRIMARY KEY, available BOOLEAN NOT NULL);
  INSERT INTO stock_availability VALUES (100,TRUE),(200,FALSE),(300,'t'),(400,'1'),(500,'y'),(600,'yes'),(700,'no'),(800,'0');
  SELECT * FROM stock_availability WHERE available = 'yes';  -- 100,300,400,500,600
  SELECT * FROM stock_availability WHERE available;          -- same
  SELECT * FROM stock_availability WHERE NOT available;      -- 200,700,800
  ALTER TABLE stock_availability ALTER COLUMN available SET DEFAULT FALSE;
  INSERT INTO stock_availability (product_id) VALUES (900);  -- available = f
  ```
- Pitfall to add: `WHERE NOT available` skips NULLs; `IS NOT TRUE` includes them.

### BYTEA  [M2]  (source: tutorial__bytea-data-type.txt)
- "binary array"; max 1GB per value; inefficient for large blobs — store multi-MB files externally and keep a path.
- `CREATE TABLE binary_data(id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, data BYTEA); INSERT INTO binary_data(data)
  VALUES ('\x012345');` -> displays `\x012345` (hex is the default bytea_output). M2 hook: show octet_length = 3 and that
  values > ~2KB get TOASTed.

### CASE expressions  [M3]  (source: tutorial__case.txt)
- Angle: "CASE is the IF/ELSE of SQL, and because it is an *expression* it can go anywhere an expression can" (SELECT,
  WHERE, GROUP BY, HAVING). Evaluation top-to-bottom, stops at first true; no ELSE -> NULL.
- Searched form on film.length: `CASE WHEN length > 0 AND length <= 50 THEN 'Short' WHEN length > 50 AND length <= 120
  THEN 'Medium' WHEN length > 120 THEN 'Long' END duration` (Academy Dinosaur 86 Medium, Ace Goldfinger 48 Short,
  Adaptation Holes 50 Short, African Egg 130 Long). Teaching improvement: because first-match wins, the lower bounds are
  redundant (`WHEN length <= 50 ... WHEN length <= 120 ...`).
- Conditional aggregation / pivot: `SUM(CASE WHEN rental_rate = 0.99 THEN 1 ELSE 0 END) AS "Economy"` ... -> Economy
  341, Mass 323 (rate 2.99), Premium 336 (4.99) = 1000 films. Rating pivot: G 178, PG 194, PG-13 223, R 195, NC-17 210.
  Modern equivalent to teach alongside: `count(*) FILTER (WHERE rating = 'G')`.
- Simple form `CASE rating WHEN 'G' THEN 'General Audiences' ... END` (equality only). Note in dvdrental `rating` is
  the enum type `mpaa_rating`, so the literals are coerced to the enum.
- Text inconsistency: prose says Mass = 1.99 but SQL uses 2.99 (dvdrental rental rates are 0.99/2.99/4.99).

### Type casts: CAST() and ::  [M2, M3]  (source: tutorial__cast.txt)
- `CAST(v AS t)` is standard SQL; `v::t` is PostgreSQL-specific. Both raise an error if the conversion fails.
- Quick-fire examples (all runnable):
  ```sql
  SELECT CAST('100' AS INTEGER);              -- 100 (column header int4)
  SELECT CAST('10C' AS INTEGER);              -- ERROR: invalid input syntax for type integer: "10C"
  SELECT CAST('2015-01-01' AS DATE), CAST('01-OCT-2015' AS DATE);   -- 2015-01-01, 2015-10-01
  SELECT CAST('10.2' AS DOUBLE);              -- ERROR: type "double" does not exist -> use DOUBLE PRECISION (float8)
  SELECT CAST('true' AS BOOLEAN), CAST('F' AS BOOLEAN);              -- t, f
  SELECT '15 minute'::interval, '2 week'::interval, '3 month'::interval;  -- 00:15:00, 14 days, 3 mons
  SELECT CAST(9.99 AS INTEGER);               -- 10  (rounds, does not truncate!)
  SELECT CAST(ARRAY[1,2,3] AS TEXT), '{1,2,3}'::INTEGER[];
  SELECT CAST('{"name": "John"}' AS JSONB);
  ```
- Pattern: guard a cast with a regex inside CASE to avoid errors on dirty data:
  `CASE WHEN rating ~ E'^\\d+$' THEN CAST(rating AS INTEGER) ELSE 0 END` (ratings table mixing 'A','B','C','1','2','3').
  In PG16+ a cleaner alternative exists: `pg_input_is_valid(rating, 'integer')` (from official docs; not in tutorial).
- Pitfall: the column header of an unaliased cast is the type's internal name (int4, float8, bool) — useful hint that
  INTEGER is int4 internally (M2 type catalog link).

### Changing a column's type  [M2]  (source: tutorial__change-column-type.txt)
- `ALTER TABLE t ALTER COLUMN c [SET DATA] TYPE new_type [USING expr]`, comma-separate several ALTER COLUMN clauses.
- Implicit-cast failure gives a precise hint:
  ```sql
  ALTER TABLE assets ALTER COLUMN asset_no TYPE INT;
  -- ERROR: column "asset_no" cannot be cast automatically to type integer
  -- HINT:  You might need to specify "USING asset_no::integer".
  ALTER TABLE assets ALTER COLUMN asset_no TYPE INT USING asset_no::integer;
  ```
- Internals hook (not in tutorial): most type changes rewrite the table under ACCESS EXCLUSIVE lock; TEXT->VARCHAR(255)
  needs a scan to verify lengths, while increasing a varchar limit or varchar->text is metadata-only. Visualize via
  pg_relation_filenode() changing after a rewrite.

### Character types  [M2]  (source: tutorial__char-varchar-text.txt)
- CHAR(n) fixed-length blank-padded; VARCHAR(n) limit; TEXT / VARCHAR without n unlimited; CHAR without n = CHAR(1).
- Too long -> `ERROR: value too long for type character(1)` / `character varying(10)`. Exceptions: if the excess
  characters are all spaces they are silently truncated; an explicit cast `'abcdef'::varchar(3)` truncates silently.
- "No performance difference among the three"; use TEXT/VARCHAR and VARCHAR(n) only when you want the length check.
  (Docs add: CHAR(n) is usually the slowest because of padding.)
- Seed: `character_tests(id serial, x CHAR(1), y VARCHAR(10), z TEXT)` with three INSERTs demonstrating each error.

### CHECK constraints  [M1, M6]  (source: tutorial__check-constraint.txt)
- Column form `salary numeric CHECK(salary > 0)`, table form `CONSTRAINT name CHECK(cond)`; default name
  `{table}_{column}_check` (e.g. employees_salary_check).
- Multi-column: `ALTER TABLE employees ADD CONSTRAINT joined_date_check CHECK (joined_date > birth_date);`
- Function-based: `CHECK (LENGTH(TRIM(first_name)) >= 3)`.
- Failing-row DETAIL shows the serial id was consumed by each failed insert (ids 1 and 2 in the first two errors, 4
  later) — a lovely accidental demo that sequences are non-transactional (see Sequences).
- Pitfall to add: CHECK passes when the expression is NULL (`salary` NULL satisfies `salary > 0`); pair with NOT NULL.

### NULL substitution: COALESCE  [M3]  (source: tutorial__coalesce.txt, tutorial__isnull.txt)
- Returns first non-null argument, evaluates left to right and stops (short-circuit). Equivalent to MySQL IFNULL,
  Oracle NVL, SQL Server ISNULL (PostgreSQL has no ISNULL function).
- Worked example: items(A 1000/10, B 1500/20, C 800/5, D 500/NULL). `price - discount` -> D is NULL (NULL propagates
  through arithmetic); `price - COALESCE(discount, 0)` -> 990, 1480, 795, 500. CASE equivalent has same performance.
- Pattern: `COALESCE(excerpt, LEFT(content, 150))` fallback for display.

### Column aliases and the `?column?` header  [M3]  (source: tutorial__column-alias.txt)
- `SELECT first_name || ' ' || last_name FROM customer;` -> header `?column?`; fix with `AS full_name`; aliases with
  spaces need double quotes `"full name"`. AS optional (but recommend keeping it: `SELECT a b` vs typo `SELECT a, b`).
- Teaching hook (pairs with logical query order lesson): aliases are usable in ORDER BY but not in WHERE/GROUP BY-
  HAVING expressions — see the ORDER BY page notes.

### Comparing two tables / data diffs  [M3]  (source: tutorial__compare-two-tables-in-postgresql.txt)
- Seed: `foo(id INT PK, name VARCHAR(50))`, `bar` same; both (1,'a'),(2,'b'); then `UPDATE bar SET name='c' WHERE id=2`.
- EXCEPT each direction with a literal label column, glued with UNION:
  ```sql
  SELECT id, name, 'not in bar' AS note FROM foo EXCEPT SELECT id, name, 'not in bar' FROM bar
  UNION
  SELECT id, name, 'not in foo' AS note FROM bar EXCEPT SELECT id, name, 'not in foo' FROM foo;
  -- (2,c,not in foo), (2,b,not in bar)
  ```
  Pitfall (unstated): set operators UNION/EXCEPT have equal precedence and associate left-to-right, so this parses as
  `((A EXCEPT B) UNION C) EXCEPT D`. It only works because the label literals differ. Teach with parentheses.
- Outer-join version: `SELECT id, name FROM foo FULL OUTER JOIN bar USING (id, name) WHERE foo.id IS NULL OR bar.id IS
  NULL;` -> (2,b), (2,c). `SELECT COUNT(*) ...` -> 2. Note `USING (id, name)` makes the merged id/name columns
  coalesced, while `foo.id` / `bar.id` still refer to each side.
- Pitfall: neither approach handles NULLs in compared columns the same way: EXCEPT treats NULLs as equal (set
  semantics, "not distinct"), the join treats NULL = NULL as no match.

### Composite (row) types  [M2, M6]  (source: tutorial__composite-types.txt)
- `CREATE TYPE address_type AS (street text, city text, state text, zip_code integer, country text);` used as a column.
- Every CREATE TABLE implicitly creates a same-named composite type (pg_type row with typrelid) — M2 catalog hook.
- Constructors: `ROW('123 St','Houston','TX',77001,'USA')`, ROW optional for >1 field; NULL field: `(v1,,v3)` in a
  literal or explicit NULL.
- Write a subfield on INSERT: `INSERT INTO contacts (name, address.street, address.city, address.state,
  address.zip_code) VALUES ('Jane Doe','4000 N. 1st Street','San Jose','CA',95134);` (country stays NULL).
- Read: `(address).city` — parentheses are required so the parser doesn't treat `address` as a table name;
  `(address).*` expands to columns. Output text form `("123 St",Houston,TX,77001,USA)` (quotes only where needed).
- Update: `UPDATE contacts SET address.country = 'USA' WHERE id = 2` — **no** parentheses allowed after SET.

### Copying tables: CREATE TABLE AS / LIKE  [M1, M3]  (source: tutorial__copy-table.txt, tutorial__create-table-as.txt, tutorial__select-into.txt)
- `CREATE TABLE contact_backup AS TABLE contacts;` (`TABLE x` is shorthand for `SELECT * FROM x`), `... WITH NO DATA`
  for structure only, `AS SELECT * FROM t WHERE cond` for a subset.
- What is lost: PK, UNIQUE, NOT NULL, defaults, indexes — `\d contact_backup` shows all columns nullable, no Default.
  Re-add: `ALTER TABLE contact_backup ADD PRIMARY KEY(id); ALTER TABLE contact_backup ADD UNIQUE(email);` -> index names
  `contact_backup_pkey`, `contact_backup_email_key` (naming convention `{table}_{column}_key` for UNIQUE).
  Better alternative to teach (not in tutorial): `CREATE TABLE t2 (LIKE t1 INCLUDING ALL);` then `INSERT ... SELECT`.
- CTAS variants: `CREATE TEMP TABLE ... AS`, `CREATE UNLOGGED TABLE ... AS` (no WAL — M7 hook), `CREATE TABLE IF NOT
  EXISTS ... AS`, explicit column names `CREATE TABLE film_rating (rating, film_count) AS SELECT rating, COUNT(film_id)
  FROM film GROUP BY rating;` — recommended whenever the select list has expressions (otherwise column named `count`).
- `CREATE TABLE action_film AS SELECT film_id, title, release_year, length, rating FROM film INNER JOIN film_category
  USING (film_id) WHERE category_id = 1;`
- CTAS preferred over SELECT INTO (which means something else in PL/pgSQL; CTAS is a superset).

### Correlated subqueries  [M3, M4]  (source: tutorial__correlated-subquery.txt, tutorial__exists.txt)
- Definition: subquery referencing outer columns; conceptually re-evaluated once per outer row — "may lead to
  performance issues". Example:
  ```sql
  SELECT film_id, title, length, rating FROM film f
  WHERE length > (SELECT AVG(length) FROM film WHERE rating = f.rating);
  -- Chamber Italian 117 NC-17, Affair Prejudice 117 G, African Egg 130 G, Agent Truman 169 PG, ...
  ```
- M4 lesson: show EXPLAIN — this appears as a `SubPlan` executed per row (loops=1000 in EXPLAIN ANALYZE); rewrite as
  a window function `avg(length) OVER (PARTITION BY rating)` in a subquery or a join to a grouped derived table and
  compare. Planner can't decorrelate scalar aggregate subqueries; it does turn EXISTS/IN into semi-joins.

### CREATE TABLE and constraint overview  [M1]  (source: tutorial__create-table.txt)
- `CREATE TABLE [IF NOT EXISTS]` — existing table -> NOTICE instead of ERROR. Default schema `public`.
- Five constraint kinds: NOT NULL, UNIQUE, PRIMARY KEY (one per table), CHECK, FOREIGN KEY (many per table); all but
  NOT NULL can also be written as table constraints spanning multiple columns.
- accounts example (good seed):
  ```sql
  CREATE TABLE accounts (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    last_login TIMESTAMP
  );
  ```
  `\d accounts` shows `nextval('accounts_user_id_seq'::regclass)` default, type `timestamp without time zone`, and three
  btree indexes: accounts_pkey, accounts_email_key, accounts_username_key — visual "constraints create indexes".

### CROSS JOIN  [M3]  (source: tutorial__cross-join.txt)
- n x m rows; no join predicate; equivalents: `FROM t1, t2` and `t1 INNER JOIN t2 ON true`.
- Seed `T1(label CHAR(1) PK)` = A,B; `T2(score INT PK)` = 1,2,3 -> 6 rows (A1,B1,A2,B2,A3,B3 — output order is not
  guaranteed without ORDER BY).
- Uses: employees x shifts schedule; products x warehouses availability grid (then LEFT JOIN actual stock).
- 1,000 x 1,000 = 1,000,000 rows warning; animation idea: grid fill.

### Common Table Expressions (non-recursive)  [M3, M4]  (source: tutorial__cte.txt)
- `WITH cte_name (col, ...) AS (query) SELECT ... FROM cte_name;` column list optional. Multiple CTEs comma-separated.
- Examples (dvdrental):
  - Action films via film ⋈ film_category ⋈ category `USING(...)` WHERE c.name = 'Action' (Amadeus Holy 113, American
    Circus 129, Antitrust Tomatoes 168, Ark Ridgemont 68, ...).
  - `WITH cte_rental AS (SELECT staff_id, COUNT(rental_id) rental_count FROM rental GROUP BY staff_id) SELECT
    s.staff_id, first_name, last_name, rental_count FROM staff s INNER JOIN cte_rental USING (staff_id);` -> Mike Hillyer
    8040, Jon Stephens 8004 (total rentals 16044).
  - Two CTEs (film_stats, customer_stats) read through scalar subqueries -> 2.98, 185, 46, 599, 61312.04.
- The page does not cover MATERIALIZED / NOT MATERIALIZED or the PG12 inlining change — the M3/M4 lesson must add that
  from the official docs (a CTE referenced once and side-effect-free is inlined).

### GROUPING SETS / CUBE / ROLLUP  [M3]  (source: tutorial__grouping-sets.txt, tutorial__cube.txt, tutorial__rollup.txt)
- CUBE(c1,c2,c3) ≡ GROUPING SETS of all 2^n subsets incl. (). Partial cube: `GROUP BY c1, CUBE(c1, c2)` (tutorial's
  syntax example; the runnable example is `GROUP BY brand, CUBE(segment)` -> per-brand rows + per-brand subtotal).
- Runs on the `sales(brand, segment, quantity)` seed from the GROUPING SETS page (see Reusable schemas). Output for
  CUBE not reproduced on the page (image).

### DATE type and date functions  [M2, M3]  (source: tutorial__date.txt)
- 4 bytes; range 4713 BC .. 5874897 AD; ISO `yyyy-mm-dd` for input/output (default DateStyle).
- `posting_date DATE NOT NULL DEFAULT CURRENT_DATE`.
- Current date: `NOW()` (timestamptz, e.g. `2024-02-01 08:48:09.599933+07`), `NOW()::date`, `CURRENT_DATE`.
- `TO_CHAR(CURRENT_DATE, 'dd/mm/yyyy')` -> 01/02/2024; `TO_CHAR(CURRENT_DATE, 'Mon dd, yyyy')` -> Feb 01, 2024.
- `now() - hire_date` -> interval like `6970 days 08:51:20.82` (timestamptz minus date => interval with time part).
  Contrast with `CURRENT_DATE - hire_date` -> plain integer days (date - date = integer). Nice gotcha quiz.
- `AGE(birth_date)` (vs current_date at midnight) -> `44 years 1 mon`; `age('2015-01-01', birth_date)` -> `35 years`,
  `36 years 10 mons 24 days`. `EXTRACT(YEAR|MONTH|DAY FROM birth_date)`.
- Seed: employees(Shannon Freeman 1980-01-01/2005-01-01, Sheila Wells 1978-02-05/2003-01-01, Ethel Webb
  1975-01-01/2001-01-01). Ages in outputs are relative to 2024-02-01 — in lessons pin the "now" with literal dates.

### DEFAULT values  [M1, M2]  (source: tutorial__default-value.txt, tutorial__boolean.txt, tutorial__alter-table.txt)
- No DEFAULT => NULL. Default can be literal or expression (evaluated at insert time).
- Use the DEFAULT keyword explicitly: `INSERT INTO products(name, price) VALUES ('Smartphone', DEFAULT)`.
- `ALTER COLUMN c SET DEFAULT v` / `DROP DEFAULT` (affects future inserts only; existing rows untouched — say so).
- Examples: `price DECIMAL(19,2) NOT NULL DEFAULT 0` -> 0.00; `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
  `configuration JSONB DEFAULT '{}'`.
- Pitfall to add: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` silently drops the zone (timestamptz -> timestamp cast in
  session TimeZone); prefer timestamptz. Also CURRENT_TIMESTAMP is the *transaction* start time — all rows inserted
  in one transaction get the same value (link to M5 transactions; clock_timestamp() differs).

### DELETE, RETURNING, DELETE USING, ON DELETE CASCADE  [M3, M5]  (source: tutorial__delete.txt, tutorial__delete-join.txt, tutorial__delete-cascade.txt)
- Command tag `DELETE n` (0 if nothing matched — not an error). `RETURNING *` or columns returns deleted rows.
- todos seed walk: delete id=1 -> `DELETE 1`; id=100 -> `DELETE 0`; id=2 RETURNING *; `WHERE completed = true` deletes
  3,5,7,9 (`DELETE 4`); bare `DELETE FROM todos` -> `DELETE 4` (rows 4,6,8,10 remained).
- "DELETE removes data, not structure" (vs ALTER TABLE / DROP / TRUNCATE).
- DELETE JOIN emulation:
  ```sql
  DELETE FROM member USING denylist WHERE member.phone = denylist.phone;  -- DELETE 2, Lily Bush remains
  DELETE FROM member WHERE phone IN (SELECT phone FROM denylist);         -- portable form
  ```
  USING is non-standard (also `EXISTS` form). M4 hook: both become a hash semi-join / join in EXPLAIN.
- ON DELETE CASCADE: departments(Engineering, Sales), employees(John Doe 1, Jane Smith 1, Michael Johnson 2) —
  `DELETE FROM departments WHERE id = 1;` leaves only Michael Johnson. The output tag is `DELETE 1` even though 3 rows
  vanished (cascaded deletes are done by RI triggers and aren't counted) — worth highlighting.
- Internals hook (M5/M7): DELETE does not remove tuples, it sets xmax; show with pageinspect / `xmax` system column
  before VACUUM.

### DISTINCT ON (top-1 per group)  [M3]  (source: tutorial__distinct-on.txt)
- PostgreSQL extension. Keeps the first row of each group of equal DISTINCT ON expressions, where "first" is defined
  by ORDER BY; DISTINCT ON expressions must match the leftmost ORDER BY expressions (else ERROR: SELECT DISTINCT ON
  expressions must match initial ORDER BY expressions). Without ORDER BY the pick is unpredictable.
  ```sql
  CREATE TABLE student_scores (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL, subject VARCHAR(50) NOT NULL,
                               score INTEGER NOT NULL);
  INSERT INTO student_scores (name, subject, score) VALUES
    ('Alice','Math',90),('Bob','Math',85),('Alice','Physics',92),('Bob','Physics',88),
    ('Charlie','Math',95),('Charlie','Physics',90);
  SELECT DISTINCT ON (name) name, subject, score FROM student_scores ORDER BY name, score DESC;
  -- Alice Physics 92 | Bob Physics 88 | Charlie Math 95
  ```
- Compare with `row_number() OVER (PARTITION BY name ORDER BY score DESC) = 1` (portable) — M3 window lesson; ties are
  broken arbitrarily unless ORDER BY adds a tiebreaker.

### Floating point: DOUBLE PRECISION / REAL  [M2]  (source: tutorial__double-precision-type.txt, tutorial__real-data-type.txt)
- DOUBLE PRECISION = float8 = float; IEEE 754; range ~1E-307..1E+308, at least 15 significant digits. "Inexact":
  ```sql
  CREATE TABLE t(c double precision); INSERT INTO t VALUES (0.1),(0.1),(0.1);
  SELECT SUM(c) FROM t;            -- 0.30000000000000004
  INSERT INTO t VALUES (1E-400);   -- ERROR: "0.000...001" is out of range for type double precision
  ```
  The 0.1 demo is the best single motivator for NUMERIC (contrast `SELECT 0.1::numeric*3`).
- temperatures seed (Lab Room 1 23.5, Server Room 1 21.8, Server Room 2 24.3; AVG = 23.2).
- Use for scientific measurements; NUMERIC for money/exact.

### DROP COLUMN / DROP TABLE and dependency tracking  [M1, M6]  (source: tutorial__drop-column.txt, tutorial__drop-table.txt)
- Dropping a column also drops indexes and constraints involving it (books.category_id FK vanished from `\d books`).
- Dependent view blocks it:
  ```
  ERROR:  cannot drop table books column publisher_id because other objects depend on it
  DETAIL:  view book_info depends on table books column publisher_id
  HINT:  Use DROP ... CASCADE to drop the dependent objects too.
  -- with CASCADE: NOTICE:  drop cascades to view book_info
  ```
- `DROP COLUMN IF EXISTS` -> NOTICE instead of ERROR; several DROP COLUMN clauses per statement; a table may end up with
  zero columns (PostgreSQL allows it; standard SQL doesn't).
- DROP TABLE: RESTRICT is default; FK from pages blocks dropping authors (`constraint pages_author_id_fkey on table pages
  depends on table authors`); CASCADE drops only the *constraint*, not the pages table. `DROP TABLE tvshows, animes;`.
  Requires superuser, schema owner or table owner.
- Internals hook (M2): DROP COLUMN is instant — the column is only marked `attisdropped` in pg_attribute; the bytes stay
  in old tuples until rewritten. Playground: `SELECT attname, attisdropped FROM pg_attribute WHERE attrelid =
  'books'::regclass AND attnum > 0;` shows `........pg.dropped.7........`. Dependencies live in pg_depend.

### ENUM types  [M2, M6]  (source: tutorial__enum.txt)
- `CREATE TYPE priority AS ENUM('low','medium','high');` values are case-sensitive; sort order = declaration order;
  all comparison ops and min/max work.
  ```sql
  CREATE TABLE requests(id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, title VARCHAR(255) NOT NULL,
                        priority PRIORITY NOT NULL, request_date DATE NOT NULL);
  INSERT INTO requests(title, priority, request_date) VALUES
    ('Create an enum tutorial in PostgreSQL','high','2019-01-01'),
    ('Review the enum tutorial','medium','2019-01-01'),
    ('Publish the PostgreSQL enum tutorial','low','2019-01-01');
  SELECT * FROM requests ORDER BY priority;              -- low, medium, high (not alphabetical!)
  SELECT * FROM requests WHERE priority > 'low';         -- medium, high
  SELECT * FROM requests WHERE priority = 'HIGH';        -- ERROR: invalid input value for enum priority: "HIGH"
  ALTER TYPE priority ADD VALUE 'urgent';                -- [IF NOT EXISTS] [BEFORE|AFTER 'x']; default at end
  SELECT enum_range(null::priority);                     -- {low,medium,high,urgent}
  SELECT enum_first(NULL::priority), enum_last(NULL::priority);  -- low | urgent
  ALTER TYPE priority RENAME VALUE 'urgent' TO 'very high';      -- {low,medium,high,"very high"}
  ```
- Enum vs lookup table + FK: enum = no join, simpler SQL; but schema change to alter values, can't remove a value,
  not portable. Use for small fixed sets (RGB colors). dvdrental's `film.rating` is the enum `mpaa_rating`.
- Internals hook: enum values are 4 bytes on disk (OID into pg_enum, sorted by enumsortorder float) — explains
  BEFORE/AFTER insertion without renumbering. Caveat from docs: a value added by ADD VALUE can't be used in the same
  transaction before commit.

### Set operations: UNION / INTERSECT / EXCEPT  [M3]  (source: tutorial__except.txt, tutorial__union.txt, tutorial__intersect.txt)
- Rules: same number of columns in same order, compatible types; one ORDER BY at the very end applies to the combined
  result. EXCEPT/UNION/INTERSECT remove duplicates; ALL variants keep them.
- Seed (shared by the three pages): top_rated_films & most_popular_films (see Reusable schemas). Results:
  - `top EXCEPT popular` -> The Shawshank Redemption 1994, 12 Angry Men 1957.
  - `top INTERSECT popular` -> The Godfather 1972, The Dark Knight 2008.
  - `top UNION popular` -> 6 rows; `UNION ALL` -> 8 rows (duplicates kept).
- Visualization: Venn diagram with the actual 6 titles placed in regions.

### EXISTS / NOT EXISTS  [M3, M4]  (source: tutorial__exists.txt)
- True iff the subquery returns at least one row; row contents don't matter, hence `SELECT 1` convention.
  `EXISTS (SELECT NULL)` is TRUE (a row containing NULL is still a row) — all 599 customers returned.
- `SELECT EXISTS(SELECT 1 FROM payment WHERE amount = 0);` -> t.
- Correlated: customers with some payment > 11 -> 8 rows (Karen Jackson, Kent Arsenault, Nicholas Barfield, Rosemary
  Schmidt, Tanya Gilbert, Terrance Roush, Vanessa Sims, Victoria Gibson). NOT EXISTS gives the complement (591).
- M4 tie-in: planner turns these into Semi Join / Anti Join nodes; NOT EXISTS is the NULL-safe alternative to NOT IN.

### EXPLAIN basics  [M4]  (source: tutorial__explain.txt)
- Syntax `EXPLAIN [(option [, ...])] stmt`; options ANALYZE, VERBOSE (default off), COSTS (default on), BUFFERS (page
  says "only with ANALYZE", default off — NB: since PG13 BUFFERS works without ANALYZE for planning buffers, and in
  **PG18 BUFFERS is on by default with ANALYZE**), TIMING (default on, needs ANALYZE), SUMMARY, FORMAT
  TEXT|XML|JSON|YAML. Booleans TRUE/ON/1, FALSE/OFF/0; omitted = ON.
- "Most important info: startup cost before first row and total cost."
- Safety pattern: EXPLAIN ANALYZE actually executes DML -> `BEGIN; EXPLAIN ANALYZE DELETE ...; ROLLBACK;`.
- Example ladder (outputs were screenshots, regenerate in PGlite): `EXPLAIN SELECT * FROM film;` (Seq Scan) ->
  `... WHERE film_id = 100` (Index Scan using film_pkey) -> `EXPLAIN (COSTS FALSE) ...` -> `SELECT COUNT(*) FROM film`
  (Aggregate over Seq Scan) -> 3-way join film/film_category/category ORDER BY title (Hash Joins + Sort) -> same with
  ANALYZE. This ladder is a ready-made first M4 lesson.

### COPY import/export  [M6, M7]  (source: tutorial__import-csv-file-into-posgresql-table.txt, tutorial__export-postgresql-table-to-csv-file.txt)
- Export: `COPY persons TO 'C:\temp\persons_db.csv' DELIMITER ',' CSV HEADER;` -> `COPY 2`; column subset
  `COPY persons(first_name,last_name,email) TO ...`; omit HEADER for no header.
- Server-side COPY reads/writes files on the *server* as the server OS user (needs superuser or
  pg_read_server_files / pg_write_server_files roles); psql `\copy (SELECT * FROM persons) to 'file' with csv` streams
  through the client — no special privileges.
- PGlite: no server filesystem; use `COPY ... TO STDOUT` / `FROM STDIN` equivalents or PGlite's `/dev/blob` support.

### LIMIT / OFFSET / FETCH  [M3, M4]  (source: tutorial__fetch.txt, tutorial__limit.txt)
- `OFFSET n {ROW|ROWS} FETCH {FIRST|NEXT} [count] {ROW|ROWS} ONLY` — SQL:2008; count defaults to 1; ROW≡ROWS,
  FIRST≡NEXT; PG accepts OFFSET and FETCH in either order. Functionally equal to LIMIT/OFFSET (LIMIT non-standard).
- film ORDER BY title: FETCH FIRST ROW ONLY -> 1 Academy Dinosaur; FIRST 5 -> ids 1..5; OFFSET 5 ROWS FETCH FIRST 5 ROW
  ONLY -> 6 Agent Truman, 7 Airplane Sierra, 8 Airport Pollock, 9 Alabama Devil, 10 Aladdin Calendar.
- Always pair with ORDER BY. (Add: FETCH ... WITH TIES, and OFFSET cost grows linearly — keyset pagination lesson in M4.)

### Foreign keys and referential actions  [M1, M5]  (source: tutorial__foreign-key.txt, tutorial__delete-cascade.txt)
- Syntax: `[CONSTRAINT fk_name] FOREIGN KEY (cols) REFERENCES parent(cols) [ON DELETE action] [ON UPDATE action]`;
  referenced columns must be PK or UNIQUE. Actions: SET NULL, SET DEFAULT, RESTRICT, NO ACTION (default), CASCADE.
- One seed, rebuilt three times — excellent "same data, change one clause" comparison:
  ```sql
  CREATE TABLE customers(customer_id INT GENERATED ALWAYS AS IDENTITY, customer_name VARCHAR(255) NOT NULL,
                         PRIMARY KEY(customer_id));
  CREATE TABLE contacts(contact_id INT GENERATED ALWAYS AS IDENTITY, customer_id INT,
     contact_name VARCHAR(255) NOT NULL, phone VARCHAR(15), email VARCHAR(100), PRIMARY KEY(contact_id),
     CONSTRAINT fk_customer FOREIGN KEY(customer_id) REFERENCES customers(customer_id) /* ON DELETE ... */);
  INSERT INTO customers(customer_name) VALUES ('BlueBird Inc'),('Dolphin LLC');
  INSERT INTO contacts(customer_id, contact_name, phone, email) VALUES
    (1,'John Doe','(408)-111-1234','john.doe@example.com'),
    (1,'Jane Doe','(408)-111-1235','jane.doe@example.com'),
    (2,'David Wright','(408)-222-1234','david.wright@example.com');
  DELETE FROM customers WHERE customer_id = 1;
  ```
  - NO ACTION: `ERROR: update or delete on table "customers" violates foreign key constraint "fk_customer" on table
    "contacts"` / `DETAIL: Key (customer_id)=(1) is still referenced from table "contacts".` SQLSTATE 23503.
  - SET NULL: John/Jane keep rows with customer_id NULL; note output order 3,1,2 — updated rows moved to the end of
    the heap (new tuple versions!) — a perfect accidental MVCC demonstration for M5.
  - CASCADE: only David Wright remains. "CASCADE is the most commonly used option."
- RESTRICT vs NO ACTION: differ only for DEFERRABLE constraints (NO ACTION check can be deferred to commit; RESTRICT
  cannot).
- Changing an FK's action = DROP CONSTRAINT then ADD CONSTRAINT ... ON DELETE CASCADE (do both in one ALTER TABLE /
  transaction). Production tip to add: `ADD CONSTRAINT ... NOT VALID` then `VALIDATE CONSTRAINT` to avoid a long
  lock; and index the child FK column (PostgreSQL does not create it automatically) or cascades/parent deletes scan
  the child table.

### FULL OUTER JOIN  [M3]  (source: tutorial__full-outer-join.txt, tutorial__joins.txt)
- Explained as a 4-step algorithm: start empty -> add matching pairs -> add unmatched left rows padded with NULLs ->
  add unmatched right rows padded with NULLs. Great to animate literally.
- Seed departments (Sales, Marketing, HR, IT, Production) / employees (Bette Nicholson 1, Christian Gable 1, Joe Swank 2,
  Fred Costner 3, Sandra Kilmer 4, Julia Mcqueen NULL). FULL JOIN -> 7 rows incl. (Julia Mcqueen, NULL) and
  (NULL, Production). `WHERE employee_name IS NULL` -> Production; `WHERE department_name IS NULL` -> Julia Mcqueen.
- Pitfall: filter the NULL-padded side on a NOT NULL column (key) rather than a nullable data column.

### generate_series and synthetic data  [M3, M4]  (source: tutorial__generate_series.txt, tutorial__random-range.txt)
- `generate_series(start, stop[, step])` for int/bigint/numeric (stop inclusive): `generate_series(1,10,2)` -> 1,3,5,7,9.
- Timestamps: `generate_series(start, stop, step interval[, timezone text])` -> 24 hourly rows for 2024-03-29.
  DST demo (timezone arg is PG16+):
  ```sql
  SET TIME ZONE 'UTC';
  SELECT * FROM generate_series('2024-11-02 00:00 -04:00'::timestamptz, '2024-11-05 00:00 -05:00'::timestamptz,
                                '1 day'::interval, 'America/New_York');
  -- 2024-11-02 04:00+00, 2024-11-03 04:00+00, 2024-11-04 05:00+00, 2024-11-05 05:00+00  (DST ends Nov 3)
  ```
- Random integers in [low, high]: `floor(random() * (high - low + 1) + low)`; e.g. 5 values in 100..200.
  (PG17+ has `random(min, max)` for int/bigint/numeric — simpler; from official docs, not this page.)
- Bulk fake rows (great for M4 playgrounds, 100 rows):
  ```sql
  CREATE TABLE employees(id INT GENERATED ALWAYS AS IDENTITY, name VARCHAR(100) NOT NULL,
                         age INT NOT NULL DEFAULT 0 CHECK (age >= 18 AND age <= 65));
  INSERT INTO employees(name, age)
  SELECT 'employee ' || n, floor(random() * (65 - 18 + 1) + 18) FROM generate_series(1,100) n;
  ```
  Note the column DEFAULT 0 contradicts its own CHECK (age >= 18) — any insert relying on the default fails. Cute
  exercise: "why does INSERT INTO employees(name) VALUES ('x') fail?"
- Calendar/date-dimension table with STORED generated columns (month, month_name, quarter, quarter_name, year) filled
  by `INSERT INTO dates(date) SELECT * FROM generate_series('2024-01-01'::date, '2024-12-31'::date, '1 day');`
  (366 rows — 2024 is a leap year). **Bug to flag:** since PG14 `EXTRACT` returns numeric, so
  `(EXTRACT(month FROM date) - 1) / 3 + 1` is a fractional numeric (March -> 1.666...), which rounds to 2 when stored in
  INT and fails the `= 2` comparisons in quarter_name (March would be quarter 2 / 'Q4'). Fix: `EXTRACT(quarter FROM
  date)` or cast `EXTRACT(month FROM date)::int` before dividing. Superb "integer vs numeric division" pitfall lesson.

### Generated columns  [M2]  (source: tutorial__generated-columns.txt, tutorial__generate_series.txt)
- `col type GENERATED ALWAYS AS (expr) STORED`; also via `ALTER TABLE ... ADD COLUMN ... GENERATED ALWAYS AS (...) STORED`.
- Rules: immutable functions only, no subqueries, current row only (no CURRENT_TIMESTAMP); can't reference another
  generated column or system columns except tableoid; no DEFAULT or identity; not part of partition key.
- Analogy: virtual = view, stored = materialized view that refreshes itself.
- Examples:
  ```sql
  CREATE TABLE contacts(id SERIAL PRIMARY KEY, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(101) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED, email VARCHAR(300) UNIQUE);
  CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, list_price DECIMAL(10,2) NOT NULL,
    tax DECIMAL(5,2) DEFAULT 0, discount DECIMAL(5,2) DEFAULT 0,
    net_price DECIMAL(10,2) GENERATED ALWAYS AS ((list_price + (list_price * tax / 100)) - (list_price * discount / 100)) STORED);
  INSERT INTO products (name, list_price, tax, discount) VALUES ('A',100,10,5),('B',50,8,0),('C',120,12.5,10);
  -- net_price 105.00, 54.00, 123.00
  ```
- **PG18 discrepancy:** page says "PostgreSQL currently implements only stored generated columns". PostgreSQL 18 adds
  VIRTUAL generated columns and makes VIRTUAL the default when neither keyword is given. M2 lesson: compare tuple
  size (pageinspect) of a STORED vs VIRTUAL column. Check PGlite build is PG18 for VIRTUAL support.

### GROUP BY and logical clause order  [M3]  (source: tutorial__group-by.txt, tutorial__having.txt)
- Stated evaluation order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT. Visualize as a
  pipeline animation; it explains why aliases fail in WHERE/HAVING but work in ORDER BY.
- GROUP BY without aggregates behaves like DISTINCT (customer_id list).
- dvdrental results: `SUM(amount)` by customer -> 1: 114.70, 2: 123.74, 3: 130.76 ...; ordered DESC -> 148 211.55,
  526 208.58, 178 194.61, 137 191.62, 144 189.60 (Eleanor Hunt, Karl Seal, Marion Snyder, Rhonda Kennedy, Clara Shaw).
  `COUNT(payment_id)` by staff -> 1: 7292, 2: 7304 (14596 payments). Group by (staff_id, customer_id). By day:
  `payment_date::date` -> 2007-05-14 514.18, 2007-04-30 5723.89, ...
- Note: `GROUP BY full_name` works because PG allows an output-column alias in GROUP BY (an extension) — but grouping by
  a *name* merges two different customers with the same name; group by customer_id and select the name (allowed when
  grouping by the PK — functional dependency).
- HAVING: aliases not allowed (`HAVING amount > 200` fails; must repeat `SUM(amount)`). `HAVING SUM(amount) > 200` ->
  148, 526. Customers per store: 1 -> 326, 2 -> 273; `HAVING COUNT(customer_id) > 300` -> store 1.
- WHERE filters rows before grouping, HAVING filters groups after; push row predicates into WHERE for speed (M4).

### GROUPING SETS in depth  [M3, M4]  (source: tutorial__grouping-sets.txt, tutorial__rollup.txt, tutorial__cube.txt)
- Progression that makes it click: four separate queries (by brand+segment, by brand, by segment, grand total) ->
  glued with UNION ALL and NULL placeholders (9 rows; scans the table 4 times) -> one `GROUPING SETS ((brand, segment),
  (brand), (segment), ())` (same 9 rows, one pass) -> shorthand ROLLUP/CUBE.
- Results: (ABC,Premium,100) (ABC,Basic,200) (XYZ,Premium,100) (XYZ,Basic,300) (ABC,-,300) (XYZ,-,400) (-,Basic,500)
  (-,Premium,200) (-,-,700).
- `GROUPING(col)` returns 0 if col is part of the current grouping set, 1 if it was rolled up — distinguishes "subtotal
  NULL" from "real NULL data". `HAVING GROUPING(brand) = 0` keeps brand subtotals.
- M4: EXPLAIN shows `MixedAggregate` / `GroupAggregate` with multiple sort groups — show single scan.

### Deleting duplicate rows  [M3, M5]  (source: tutorial__how-to-delete-duplicate-rows-in-postgresql.txt)
- Seed `basket(id SERIAL PK, fruit)` = apple, apple, orange, orange, orange, banana (ids 1..6).
- Find: `SELECT fruit, COUNT(fruit) FROM basket GROUP BY fruit HAVING COUNT(fruit) > 1;` -> apple 2, orange 3.
- Self-join delete (keeps highest id): `DELETE FROM basket a USING basket b WHERE a.id < b.id AND a.fruit = b.fruit;`
  -> 2 apple, 5 orange, 6 banana. Flip to `a.id > b.id` to keep lowest (1, 3, 6). Note it's O(n²) pairs per group.
- Window version (keeps lowest):
  ```sql
  DELETE FROM basket WHERE id IN (
    SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY fruit ORDER BY id) AS row_num FROM basket) t
    WHERE t.row_num > 1);
  ```
  Multi-column template: `PARTITION BY column_1, column_2`.
- "Immediate" (intermediate) table: `CREATE TABLE basket_temp (LIKE basket); INSERT INTO basket_temp(fruit, id) SELECT
  DISTINCT ON (fruit) fruit, id FROM basket; DROP TABLE basket; ALTER TABLE basket_temp RENAME TO basket;`
  Pitfalls (not mentioned): DISTINCT ON without ORDER BY keeps an arbitrary id; `LIKE` without INCLUDING ALL loses
  the PK/default; DROP TABLE basket also drops the owned sequence basket_id_seq. For tables without a key, use `ctid`
  (`DELETE ... WHERE a.ctid < b.ctid`) — great M2 bridge to physical tuple ids.

### hstore (key/value)  [M2, M6]  (source: tutorial__hstore.txt)
- Extension (`CREATE EXTENSION hstore;`, available in PGlite); keys and values are text only. Use for
  semi-structured attributes rarely queried. Literal: `'"paperback" => "243", "publisher" => "postgresqltutorial.com",
  "language" => "English", "ISBN-13" => "978-1449370000", "weight" => "11.2 ounces"'`.
- Operators/functions: `attr -> 'ISBN-13'` (value), `attr || '"freeshipping"=>"yes"'::hstore` (add or overwrite key),
  `delete(attr, 'freeshipping')` (also `attr - 'key'`), `attr ? 'publisher'` (has key), `attr @> '"weight"=>"11.2
  ounces"'::hstore` (contains pair), `attr ?& ARRAY['language','weight']` (all keys), `?|` (any key),
  `akeys/avals` (arrays), `skeys/svals` (sets), `hstore_to_json(attr)`, `(each(attr)).*` (key/value rows).
- M4 hook: `@>`, `?`, `?&`, `?|` are GIN/GiST indexable (gin_hstore_ops). Compare to JSONB which largely supersedes it.

### Identity columns vs SERIAL vs sequences  [M1, M2]  (source: tutorial__identity-column.txt, tutorial__serial.txt, tutorial__sequences.txt)
- `col {SMALLINT|INT|BIGINT} GENERATED {ALWAYS | BY DEFAULT} AS IDENTITY [(sequence options)]` — PG10+, SQL-standard
  replacement for SERIAL; uses an internal sequence; a table may have several identity columns.
- ALWAYS rejects user values:
  ```
  INSERT INTO color (color_id, color_name) VALUES (2, 'Green');
  ERROR:  cannot insert into column "color_id"
  DETAIL:  Column "color_id" is an identity column defined as GENERATED ALWAYS.
  HINT:  Use OVERRIDING SYSTEM VALUE to override.
  ```
  Fix: `INSERT INTO color (color_id, color_name) OVERRIDING SYSTEM VALUE VALUES (2, 'Green');` or use BY DEFAULT.
- Pitfall to add: with BY DEFAULT, inserting explicit 2 then letting the sequence generate later yields a duplicate 2
  (sequence doesn't know) — the classic "duplicate key after manual insert/import" bug; fix with
  `ALTER TABLE ... ALTER COLUMN ... RESTART WITH (max+1)` or `setval`. (The color table here has no PK, so it would
  silently allow duplicates.)
- Options: `GENERATED BY DEFAULT AS IDENTITY (START WITH 10 INCREMENT BY 10)` -> Orange 10, Purple 20.
- Convert an existing column: `ALTER TABLE shape ALTER COLUMN shape_id ADD GENERATED ALWAYS AS IDENTITY;` requires NOT
  NULL else `ERROR: column "shape_id" of relation "shape" must be declared NOT NULL before identity can be added`
  (SQLSTATE 55000). Modify: `SET GENERATED BY DEFAULT`, `SET <seq option>`, `RESTART [WITH n]`. Remove:
  `DROP IDENTITY [IF EXISTS]`.

### IN / NOT IN  [M3, M4]  (source: tutorial__in.txt)
- `v IN (a, b, c)` ≡ `v = a OR v = b OR v = c`; `v NOT IN (...)` ≡ `v <> a AND v <> b AND ...`. Lists may be literals
  or a subquery.
- dvdrental: `film_id IN (1,2,3)` -> Academy Dinosaur, Ace Goldfinger, Adaptation Holes. `last_name IN ('Allen',
  'Chase','Davis')` -> 8 actors (Meryl/Cuba/Kim Allen, Jon/Ed Chase, Susan/Jennifer/Susan Davis — two different actors
  named Susan Davis: good DISTINCT/PK lesson). Dates: `payment_date::date IN ('2007-02-15','2007-02-16')`.
- Claim "IN executes much faster than ORs": internally a literal IN list becomes `= ANY('{...}')` (ScalarArrayOpExpr),
  usable by a single index scan. M4: compare EXPLAIN of both forms. (PG18 can also rewrite simple OR chains on the same
  column into `= ANY` — verify against PG18 release notes before stating.)
- Pitfall the tutorial omits: by the AND-expansion, `x NOT IN (1, NULL)` is never TRUE (x <> NULL is NULL) -> returns
  zero rows. Likewise for NOT IN (subquery containing NULL). Teach NOT EXISTS instead.
- Pitfall: casting the column (`payment_date::date IN ...`) prevents use of a plain index on payment_date; rewrite as a
  range or create an expression index.

### INNER JOIN  [M3, M4]  (source: tutorial__inner-join.txt, tutorial__joins.txt)
- Explained as a nested loop: for each row of table1 compare with every row of table2; on equality emit combined row.
  This mental model = Nested Loop join; M4 then reveals Hash Join and Merge Join as faster equivalents.
- Three spellings: fully qualified, aliases, `USING (customer_id)` (merged single output column).
- `customer INNER JOIN payment USING(customer_id) INNER JOIN staff USING(staff_id) ORDER BY payment_date` -> first rows
  416 Jeffery Pinson / Jon Stephens 2.99 2007-02-14 21:21:59 ...
- Caveat with USING chains: `staff` also has columns like `last_update`, `first_name`, etc. — USING only merges the
  named column, but unqualified `first_name` would be ambiguous between customer and staff; the example qualifies them.

### INSERT, RETURNING, multi-row VALUES  [M3]  (source: tutorial__insert.txt, tutorial__insert-multiple-rows.txt)
- Command tag `INSERT oid count` — oid is always 0 now (tables WITH OIDS removed in PG12), e.g. `INSERT 0 1`.
- Omitted nullable columns get their default (NULL if none); omitted NOT NULL column without default -> error.
- Quotes: `'O''Reilly Media'` (double the single quote); dates 'YYYY-MM-DD'. Dollar quoting `$$O'Reilly$$` is an
  alternative worth showing.
- Get generated id: `INSERT ... RETURNING id;` (instead of MySQL LAST_INSERT_ID / currval). `RETURNING expr AS name`.
- Multi-row: one statement, one round trip, atomic (all or nothing). contacts example: three rows -> `INSERT 0 3`;
  RETURNING * -> ids 4,5; RETURNING id -> 6,7,8.
- PG18 note: RETURNING can now reference `old` / `new` (`RETURNING old.*, new.*`) for INSERT/UPDATE/DELETE/MERGE —
  newer than this tutorial.

### Integer types  [M2]  (source: tutorial__integer.txt, tutorial__data-types.txt)
- SMALLINT 2 bytes −32,768..32,767; INTEGER (INT, int4) 4 bytes −2,147,483,648..2,147,483,647; BIGINT 8 bytes
  −9,223,372,036,854,775,808..9,223,372,036,854,775,807. No unsigned types (unlike MySQL). Out of range -> error.
- Examples with CHECK: `pages SMALLINT NOT NULL CHECK (pages > 0)`, `population INT NOT NULL CHECK (population >= 0)`.
- Tutorial says BIGINT "decreases performance; have a good reason". Counter-view for production: use BIGINT for
  surrogate keys of growing tables (int4 sequence exhaustion at 2.1 billion is a common outage). Also M2 alignment:
  int8 needs 8-byte alignment, so column order affects padding — a nice pageinspect lesson.

### INTERVAL  [M2]  (source: tutorial__interval.txt, tutorial__cast.txt)
- 16 bytes; stored as three fields: months (int32), days (int32), microseconds (int64) — explains why '1 month' and
  '30 days' are different values and why justify_* exist. Range ±178,000,000 years; optional fractional-second
  precision p = 0..6. `@` prefix optional.
- Input: verbose `'1 year 2 months 3 days'`, `'2 weeks ago'`, `'3 hours 20 minutes'`; ISO 8601 designators
  `P6Y5M4DT3H2M1S` (M = months before T, minutes after); ISO alternative `P0006-05-04T03:02:01`.
- Output styles (`SET intervalstyle = ...`) for 6y5m4d 3:02:01:
  `sql_standard` `+6-5 +4 +3:02:01`; `postgres` (default) `6 years 5 mons 4 days 03:02:01`; `postgres_verbose`
  `@ 6 years 5 mons 4 days 3 hours 2 mins 1 sec`; `iso_8601` `P6Y5M4DT3H2M1S`.
- Arithmetic: `INTERVAL '2h 50m' + INTERVAL '10m'` = 03:00:00; `600 * INTERVAL '1 minute'` = 10:00:00;
  `now() - INTERVAL '1 year 3 hours 20 minutes'`. `TO_CHAR(INTERVAL '17h 20m 05s', 'HH24:MI:SS')` = 17:20:05.
  `EXTRACT(MINUTE FROM INTERVAL '5 hours 21 minutes')` = 21.
- `justify_days('30 days')` = 1 mon; `justify_hours('24 hours')` = 1 day; `justify_interval('1 year -1 hour')` =
  11 mons 29 days 23:00:00.
- event table: ('pgConf','1 hour 30 minutes'), ('pgDAY','2 days 5 hours'); `WHERE duration > INTERVAL '1 day'` ->
  pgDAY; `SUM(duration)` = 2 days 06:30:00. (Page's outputs `PT1H30M`, `P2DT5H` were captured with
  intervalstyle=iso_8601 left on from the previous step — note for learners.)

### NULL handling: IS NULL, NULLIF, COALESCE, "ISNULL"  [M2, M3]  (source: tutorial__is-null.txt, tutorial__isnull.txt, tutorial__nullif.txt, tutorial__coalesce.txt)
- NULL = "missing or not applicable", not a value; any comparison with NULL yields NULL; `SELECT null = null AS
  result;` -> null. Use `IS NULL` / `IS NOT NULL` (and `IS DISTINCT FROM` for null-safe equality — not covered here).
- psql shows NULL as empty string; `\pset null null` to see it. Neon pages render NULL as `null` throughout.
- dvdrental `address.address2`: 4 rows IS NULL (47 MySakila Drive, 28 MySQL Boulevard, 23 Workhaven Lane, 1411
  Lillydale Drive — the store/staff addresses) while 599 others contain '' (empty string) — "bad practice of storing
  empty strings and NULL in the same column". Fix: `UPDATE address SET address2 = NULL WHERE address2 = '';` or
  `NULLIF(address2, '')`.
- M2 hook: NULLs cost nothing in the tuple data area — they are a bit in the null bitmap (t_bits) of the
  HeapTupleHeader, while '' is a 1-byte varlena header. Visualize with pageinspect `heap_page_items`.

### Join family overview (teams/players)  [M3, M4]  (source: tutorial__joins.txt, tutorial__left-join.txt, tutorial__right-join.txt)
- Best compact seed in the series (4 teams, 5 players, 2 players without a team, 2 teams without players):
  every join type gives a different, small, memorable row count — inner 3, left 5 (Bears, Sharks padded), left anti-
  join 2 (`WHERE players.id IS NULL`), right 5 (Liam, Mia padded), right anti-join 2 (`WHERE teams.id IS NULL`), full 7,
  full "anti" 4 (`WHERE teams.id IS NULL OR players.id IS NULL`). Plus cross join would be 20.
- `JOIN` alone = INNER JOIN; LEFT JOIN = LEFT OUTER JOIN; RIGHT likewise.
- Venn-diagram explanation used throughout (fine for intro, but note Venn diagrams mislead for 1:N duplicates — show
  Lions appearing twice).
- dvdrental LEFT JOIN: film ⋈ inventory; `WHERE i.inventory_id IS NULL` -> films never stocked (Alice Fantasia 14,
  Apollo Teen 33, Argonauts Town 36, Ark Ridgemont 38, Arsenic Independence 41, ... 42 films in total in dvdrental).
  M4: planner shows this as Hash Right Anti Join (or Hash Anti Join).
- Pitfall to add: putting a right-table filter in WHERE turns a LEFT JOIN into an inner join; put it in ON instead.

### JSON / JSONB  [M2, M6]  (source: tutorial__json.txt, tutorial__default-value.txt, tutorial__cast.txt)
- JSON = verbatim text (re-parsed each access, keeps whitespace, key order, duplicate keys); JSONB = decomposed binary
  (parse once, keys sorted/deduplicated, last duplicate wins, indexable). Recommendation: use JSONB unless you need
  exact text/key order.
- products seed: `properties JSONB` with `'{"color": "white", "size": ["S","M","L","XL"]}'` — output re-orders keys
  to `{"size": [...], "color": "white"}` (JSONB sorts keys by length then bytes) — a vivid JSONB-normalization demo.
- `properties -> 'color'` returns jsonb `"white"` (with quotes); `->>` returns text `white`. Filter
  `WHERE properties ->> 'color' IN ('black','white')`. Arrays: `phones ->> 0` (0-based, unlike SQL arrays which are
  1-based — great contrast with the Array lesson).
- Corrections to the comparison table: plain JSON has no GIN/"full-text" indexing (only expression indexes); JSONB has
  GIN (jsonb_ops, jsonb_path_ops). JSON *keeps* all duplicate keys (processing functions use the last); JSONB keeps only
  the last value — it does not reject duplicates.

### LIKE / ILIKE / pattern matching  [M3, M4]  (source: tutorial__like.txt, tutorial__cast.txt)
- `%` = zero or more chars, `_` = exactly one. No wildcard -> behaves like `=`. `NOT LIKE`. `ILIKE` case-insensitive
  (PG extension). Operator forms: `~~` LIKE, `~~*` ILIKE, `!~~` NOT LIKE, `!~~*` NOT ILIKE.
- dvdrental: `first_name LIKE 'Jen%'` -> Jennifer Davis, Jennie Terry, Jenny Castro; `'_her%'` -> Cheryl Murphy, Sherri
  Rhodes, Sherry Marshall, Theresa Watson; `ILIKE 'BAR%'` -> Barbara Jones, Barry Lovelace (LIKE 'BAR%' -> 0 rows);
  `~~ 'Dar%'` -> Darlene, Darrell, Darren, Darryl, Daryl.
- ESCAPE: `WHERE message LIKE '%10$%%' ESCAPE '$'` matches literal "10%". (Default escape char is backslash.)
- M4 hook: `LIKE 'Jen%'` can use a btree only with text_pattern_ops or C collation; `'%er%'` needs pg_trgm GIN/GiST
  (available in PGlite). Great index-choice lesson.
- Regex (`~`) appears in the CAST page: `rating ~ E'^\\d+$'`.

### LIMIT / OFFSET  [M3, M4]  (source: tutorial__limit.txt)
- `LIMIT n` (0 -> empty, NULL -> no limit), `OFFSET m` skips first; OFFSET applied before LIMIT; always ORDER BY.
- `ORDER BY film_id LIMIT 4 OFFSET 3` -> ids 4..7. Top-N: `ORDER BY rental_rate DESC LIMIT 10` -> ten 4.99 films in an
  arbitrary order (Ali Forever, Amelie Hellfighters, Airplane Sierra, ...). **Pitfall the page illustrates without
  saying:** 336 films tie at 4.99, so which ten you get is nondeterministic; add a tiebreaker (`, film_id`) or use
  `FETCH FIRST 10 ROWS WITH TIES`.
- M4: top-N heapsort ("Sort Method: top-N heapsort") vs full sort; Limit node stops early.

### MERGE  [M3, M5]  (source: tutorial__merge.txt, tutorial__upsert.txt)
- Vocabulary first (target table, source table, match condition), then a single statement doing all three actions.
  Seed (good for an M3 DML lesson; 3 + 4 rows):
  ```sql
  CREATE TABLE products (product_id SERIAL PRIMARY KEY, name TEXT UNIQUE, price DECIMAL(10,2), stock INTEGER,
                         status TEXT, last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
  INSERT INTO products (name, price, stock, status) VALUES
    ('Laptop', 999.99, 50, 'active'), ('Keyboard', 79.99, 100, 'active'), ('Mouse', 29.99, 200, 'active');
  CREATE TABLE product_updates (name TEXT, price DECIMAL(10,2), stock INTEGER, status TEXT);
  INSERT INTO product_updates VALUES
    ('Laptop', 1099.99, 75, 'active'), ('Monitor', 299.99, 30, 'active'),
    ('Keyboard', NULL, 0, 'discontinued'), ('Headphones', 89.99, 50, 'active');
  MERGE INTO products p USING product_updates u ON p.name = u.name
  WHEN MATCHED AND u.status = 'discontinued' THEN DELETE
  WHEN MATCHED AND u.status = 'active' THEN
    UPDATE SET price = COALESCE(u.price, p.price), stock = u.stock, status = u.status, last_updated = CURRENT_TIMESTAMP
  WHEN NOT MATCHED AND u.status = 'active' THEN
    INSERT (name, price, stock, status) VALUES (u.name, u.price, u.stock, u.status)
  RETURNING merge_action() AS action, p.*;
  -- UPDATE 1 Laptop 1099.99 75 | INSERT 4 Monitor | DELETE 2 Keyboard (old values shown) | INSERT 5 Headphones
  -- products afterwards: 1 Laptop, 3 Mouse (untouched: not in source), 4 Monitor, 5 Headphones
  ```
- WHEN clauses are evaluated in order; first whose condition holds wins. Advanced version precomputes an
  `action_type` in a source subquery with CASE (DELETE / OUT_OF_STOCK / status) and returns `u.action_type` too.
- Version facts: MERGE PG15; RETURNING + merge_action() PG17; MERGE on updatable views PG17; also PG17 added
  `WHEN NOT MATCHED BY SOURCE` (handles target rows absent from source, e.g. Mouse) — not shown on page.
  PG18 adds `old`/`new` in RETURNING (the page's "return both old and new values" claim really needs PG18).
- Pitfalls listed: ambiguous matches (a target row matched by >1 source row -> ERROR "MERGE command cannot affect row a
  second time"), NULL handling in ON (use IS NOT DISTINCT FROM), unhandled cases silently do nothing.
- FAQ concurrency claim is oversimplified: MERGE takes row locks but under READ COMMITTED a concurrent insert of the
  same key can still raise a unique violation; INSERT ... ON CONFLICT is the race-free upsert. Teach this contrast in M5.
- Required privileges: SELECT on source; INSERT/UPDATE/DELETE on target per action used. Atomic.

### NATURAL JOIN (and why to avoid it)  [M3]  (source: tutorial__natural-join.txt)
- NATURAL [INNER|LEFT|RIGHT] JOIN = USING (all same-named columns); default INNER. Output puts common column first,
  once.
- Seed categories (Smartphone, Laptop, Tablet, VR) / products (iPhone, Samsung Galaxy -> 1; HP Elite, Lenovo Thinkpad
  -> 2; iPad, Kindle Fire -> 3). `products NATURAL JOIN categories` -> 6 rows; `categories NATURAL LEFT JOIN products`
  -> 7 rows (VR with NULLs).
- Killer pitfall demo: `SELECT * FROM city NATURAL JOIN country;` -> **0 rows** because both tables also share
  `last_update` (timestamps never equal). A schema change (adding a same-named column) silently changes query semantics.

### NOT NULL constraints  [M1, M2]  (source: tutorial__not-null-constraint.txt, tutorial__add-column.txt)
- No NULL/NOT NULL spec -> nullable. Constraints on a column can appear in any order; PG may check in any order.
- Add to existing populated column: backfill first, then `ALTER COLUMN qty SET NOT NULL` (multiple columns comma-
  separated). Violation: `ERROR: null value in column "qty" violates not-null constraint` + `DETAIL: Failing row
  contains (...)`. (Modern message: `null value in column "qty" of relation "production_orders" violates not-null
  constraint`.)
- NOT NULL ≡ `CHECK (col IS NOT NULL)`; CHECK enables "at least one of" rules:
  ```sql
  CREATE TABLE users (id serial PRIMARY KEY, username VARCHAR(50), password VARCHAR(50), email VARCHAR(50),
    CONSTRAINT username_email_notnull CHECK (NOT ((username IS NULL OR username = '') AND (email IS NULL OR email = ''))));
  INSERT INTO users (username, email) VALUES ('user1', NULL), (NULL, 'user2@example.com'), ('user2','user2@example.com'), ('user3','');  -- ok
  INSERT INTO users (username, email) VALUES (NULL, NULL);  -- violates username_email_notnull
  ```
  (Alternative: `CHECK (num_nonnulls(NULLIF(username,''), NULLIF(email,'')) >= 1)`.)
- Internals hook: SET NOT NULL scans the whole table under ACCESS EXCLUSIVE; trick is a `CHECK (col IS NOT NULL) NOT
  VALID` + VALIDATE first. PG18 change: NOT NULL constraints are now real catalog constraints in pg_constraint (named,
  can be NOT VALID / inherited explicitly) — verify details against PG18 docs slice.

### NULLIF  [M3]  (source: tutorial__nullif.txt)
- `NULLIF(a, b)` = NULL if a = b else a. `NULLIF(1,1)` -> null, `NULLIF(1,0)` -> 1, `NULLIF('A','B')` -> A.
- Pattern 1, normalize '' to NULL before COALESCE: `COALESCE(NULLIF(excerpt, ''), LEFT(body, 40))` (posts seed:
  excerpt 'test post excerpt 1', '', NULL).
- Pattern 2, avoid division by zero: `SUM(CASE WHEN gender = 1 THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN gender = 2 THEN
  1 ELSE 0 END), 0) * 100` -> 200 with 2 male/1 female; after deleting the female member, NULL instead of `ERROR:
  division by zero`.
- Unstated pitfall: this is integer division (2/1 = 2, but 1/2 = 0) — cast to numeric (`::numeric`) for a real ratio.

### NUMERIC  [M2]  (source: tutorial__numeric.txt, tutorial__double-precision-type.txt)
- `NUMERIC(precision, scale)`; NUMERIC = DECIMAL = DEC. Up to 131,072 digits before the point and 16,383 after
  (unconstrained). Storage is variable (depends on digits). Slower than int/float — use only when exactness matters.
- Scale overflow rounds (half away from zero): `NUMERIC(5,2)` stores 500.215 -> 500.22, 500.214 -> 500.21. Precision
  overflow errors: `ERROR: numeric field overflow` / `DETAIL: A field with precision 5, scale 2 must round to an
  absolute value less than 10^3.`
- Negative scale (PG15+): `NUMERIC(5,-2)` rounds to hundreds, up to 7 integer digits. `NUMERIC(5)` ≡ `NUMERIC(5,0)`.
- Special values 'Infinity', '-Infinity' (PG14+ for numeric), 'NaN' (quoted). In PG, NaN = NaN is true and NaN sorts
  above every number (so btree can index it): `ORDER BY price DESC` puts Phone NaN first.
- Correction: page says omitted precision/scale "default to 131072 and 16383" — actually an unconstrained NUMERIC has
  no fixed scale (stores values exactly as given); the max declarable precision is 1000.

### ORDER BY and NULL ordering  [M3, M4]  (source: tutorial__order-by.txt)
- Default ASC; multiple keys (`first_name ASC, last_name DESC` — two Kellys sorted by last name desc); expressions
  (`LENGTH(first_name) len ... ORDER BY len DESC`); alias allowed because ORDER BY is evaluated after SELECT.
- NULLs: ASC => NULLS LAST by default, DESC => NULLS FIRST by default ("NULL is larger than everything").
  `CREATE TABLE sort_demo(num INT); INSERT INTO sort_demo VALUES (1),(2),(3),(null);` then try `ORDER BY num`,
  `num NULLS FIRST`, `num DESC`, `num DESC NULLS LAST`.
- M4 hook: a btree index can satisfy ORDER BY only if the NULLS ordering matches (or the index is scanned backward):
  `CREATE INDEX ... (num DESC NULLS LAST)`.

### PRIMARY KEY  [M1, M4]  (source: tutorial__primary-key.txt, tutorial__create-table.txt)
- "PK = NOT NULL + UNIQUE"; at most one per table; creates a unique btree index named `<table>_pkey` by default;
  composite PK via table constraint `PRIMARY KEY (order_id, item_no)`; name it with `CONSTRAINT name PRIMARY KEY(...)`.
- `ALTER TABLE products ADD PRIMARY KEY (product_id);` (fails if duplicates/NULLs exist).
- Retro-fit surrogate key on populated table: `ALTER TABLE vendors ADD COLUMN vendor_id SERIAL PRIMARY KEY;` fills
  existing rows 1..4 in physical order (Microsoft, IBM, Apple, Samsung) — because a volatile default (nextval) forces
  a table rewrite evaluating it per row. Modern equivalent: `ADD COLUMN vendor_id INT GENERATED ALWAYS AS IDENTITY
  PRIMARY KEY`.
- `ALTER TABLE vendors DROP CONSTRAINT vendors_pkey;` removes constraint+index but keeps column and data.
- Note: `order_items.item_no SERIAL` inside a composite PK — item_no is globally increasing, not per-order.

### Random numbers  [M3]  (source: tutorial__random-range.txt, tutorial__generate_series.txt)
- `random()` returns double in [0, 1). Range [low, high] integer: `floor(random() * (high - low + 1) + low)::int`.
  `random() * 10 + 1` is in [1, 11) (the page calls it "between 1 and 11").
- Wrapped as a function:
  ```sql
  CREATE OR REPLACE FUNCTION random_between(low INT, high INT) RETURNS INT AS $$
  BEGIN
    RETURN floor(random() * (high - low + 1) + low);
  END; $$ LANGUAGE plpgsql STRICT;
  SELECT random_between(1, 100) FROM generate_series(1, 5);
  ```
  (Should be declared VOLATILE — the default — so it is re-evaluated per row; good M6 volatility teaching point.)
- PG17+: `random(min, max)` built in. For reproducible playgrounds use `setseed(0.5)` first.

### REAL (float4)  [M2]  (source: tutorial__real-data-type.txt)
- 4 bytes, range about ±3.40282347E38, ~6 decimal digits. Use when range matters more than precision or to save space.
- weathers seed (10 hourly New York readings, 2024-04-19): `AVG(wind_speed_mps)` -> 5.360000038146973,
  `AVG(temperature_celsius)` -> 15.639999961853027 — float4 values widened to float8 inside avg() expose the binary
  approximation. Pair with the DOUBLE 0.1 demo and NUMERIC exactness.
- Filter uses `DATE(recorded_at) = '2024-04-19'` (function on column -> not sargable; prefer a range).

### Recursive CTEs  [M3, M4]  (source: tutorial__recursive-query.txt, tutorial__cte.txt)
- Structure: anchor member UNION [ALL] recursive member referencing the CTE. Execution: R0 = anchor; R(i+1) = recursive
  member applied to R(i) (only the previous iteration's rows — the "working table"); stop when empty; result = union of
  all Ri. The page prints R0, R1, R2 separately — ideal frames for an animation.
- Org-chart seed (20 employees, see Reusable schemas). Subordinates of Megan Berry (id 2):
  ```sql
  WITH RECURSIVE subordinates AS (
    SELECT employee_id, manager_id, full_name FROM employees WHERE employee_id = 2
    UNION
    SELECT e.employee_id, e.manager_id, e.full_name
    FROM employees e INNER JOIN subordinates s ON s.employee_id = e.manager_id)
  SELECT * FROM subordinates;
  -- R0: 2 Megan Berry; R1: 6,7,8,9; R2: 16,17 (under 7), 18,19,20 (under 8); R3: empty -> 10 rows
  ```
- Teaching additions: UNION (vs UNION ALL) discards duplicate rows, which also protects against cycles in simple cases;
  add a `depth` column (`0` in anchor, `s.depth + 1`) and a path array for indentation; PG14+ `SEARCH DEPTH FIRST BY`
  and `CYCLE ... SET is_cycle USING path` clauses. M4: plan node is `Recursive Union` with `WorkTable Scan`.

### Renaming columns and tables (dependency by OID)  [M1, M6]  (source: tutorial__rename-column.txt, tutorial__rename-table.txt, tutorial__alter-table.txt)
- `ALTER TABLE t RENAME [COLUMN] a TO b;` — one rename per statement; no IF EXISTS for the column (table-level
  `ALTER TABLE IF EXISTS` exists). `ALTER TABLE [IF EXISTS] t RENAME TO n;` one table per statement.
- Dependent objects follow automatically: view `customer_data` definition shows `g.group_name AS customer_group` after
  renaming the column, and `JOIN groups g` after renaming the table; the FK now prints `REFERENCES groups(id) ON UPDATE
  CASCADE ON DELETE CASCADE`. Insight to teach: views and constraints store OIDs/attnums (parsed query trees in
  pg_rewrite), not names — so renames are free and safe, but app SQL strings are not updated.
- Gotcha shown: after `vendors` -> `suppliers`, the sequence is still `vendors_id_seq` and the index still
  `vendors_pkey` — rename them separately if naming conventions matter (`ALTER SEQUENCE ... RENAME TO`, `ALTER INDEX
  ... RENAME TO`).

### RIGHT JOIN  [M3]  (source: tutorial__right-join.txt, tutorial__joins.txt)
- Mirror of LEFT JOIN; `inventory i RIGHT JOIN film f USING(film_id) WHERE i.inventory_id IS NULL` lists the same
  never-stocked films as the LEFT JOIN page. Tip: most teams rewrite RIGHT JOINs as LEFT JOINs for readability; the
  planner treats them identically (can even flip sides — "Hash Right Join").

### ROLLUP  [M3]  (source: tutorial__rollup.txt)
- ROLLUP(c1,c2,c3) -> (c1,c2,c3),(c1,c2),(c1),() — assumes hierarchy c1 > c2 > c3 (n+1 sets vs CUBE's 2^n). Column order
  changes results (`ROLLUP(brand, segment)` vs `ROLLUP(segment, brand)`). Partial: `GROUP BY segment, ROLLUP(brand)`.
- dvdrental time hierarchy:
  ```sql
  SELECT EXTRACT(YEAR FROM rental_date) y, EXTRACT(MONTH FROM rental_date) m, EXTRACT(DAY FROM rental_date) d,
         COUNT(rental_id)
  FROM rental GROUP BY ROLLUP (EXTRACT(YEAR FROM rental_date), EXTRACT(MONTH FROM rental_date), EXTRACT(DAY FROM rental_date));
  ```
  Expected sales seed result for ROLLUP(brand, segment): ABC Basic 200, ABC Premium 100, ABC NULL 300, XYZ Basic 300,
  XYZ Premium 100, XYZ NULL 400, NULL NULL 700 (7 rows).

### SELECT fundamentals  [M3]  (source: tutorial__select.txt, tutorial__column-alias.txt)
- Clause tour; FROM evaluated before SELECT; FROM optional (`SELECT NOW();`); keywords case-insensitive; semicolon
  terminates/separates statements.
- `SELECT * FROM customer` partial output begins with customer 524 Jared Ely, *before* 1 Mary Smith — heap order, not
  id order (row 524 was updated in dvdrental so its new version sits elsewhere). Great M2/M5 hook: "tables are unordered
  heaps; UPDATE writes a new tuple".
- SELECT * in application code: transfers unneeded data, increases network traffic; reserve for ad-hoc queries.
  (Also: breaks index-only scans, and column-order changes break apps.)

### SELECT DISTINCT  [M3, M4]  (source: tutorial__select-distinct.txt, tutorial__distinct-on.txt)
- DISTINCT over the combination of all selected columns; `SELECT DISTINCT *` too. NULLs are treated as duplicates of
  each other (unlike `=`) — one NULL kept.
  ```sql
  CREATE TABLE colors(id SERIAL PRIMARY KEY, bcolor VARCHAR, fcolor VARCHAR);
  INSERT INTO colors (bcolor, fcolor) VALUES ('red','red'),('red','red'),('red',NULL),(NULL,'red'),(NULL,NULL),
    ('green','green'),('blue','blue'),('blue','blue');
  SELECT DISTINCT bcolor FROM colors ORDER BY bcolor;            -- blue, green, red, NULL (4)
  SELECT DISTINCT bcolor, fcolor FROM colors ORDER BY 1, 2;     -- 6 rows
  ```
- dvdrental: `SELECT DISTINCT rental_rate FROM film ORDER BY rental_rate;` -> 0.99, 2.99, 4.99.
- M4: implemented as HashAggregate or Sort + Unique — show both via EXPLAIN (toggle enable_hashagg).

### SELECT INTO (table-creating form)  [M3]  (source: tutorial__select-into.txt)
- `SELECT film_id, title, rental_rate INTO TABLE film_r FROM film WHERE rating = 'R' AND rental_duration = 5 ORDER BY
  title;` and `... INTO TEMP TABLE short_film FROM film WHERE length < 60` (Jet Neighbors 59, Interview Liaisons 59, ...).
- Returns no rows to client; in PL/pgSQL `SELECT ... INTO var` means variable assignment -> prefer CREATE TABLE AS.

### Self-join and hierarchical data  [M3]  (source: tutorial__self-join.txt, tutorial__alias.txt)
- employee table with self-referencing FK `manager_id REFERENCES employee(employee_id) ON DELETE CASCADE` (deleting a
  manager deletes the whole subtree — mention as a teaching hazard).
- `employee e INNER JOIN employee m ON m.employee_id = e.manager_id` -> 7 pairs (Windy Hays, the top manager, missing);
  `LEFT JOIN` -> 8 rows incl. (Windy Hays, NULL).
- Pairs of films with equal length without mirror duplicates: `ON f1.film_id > f2.film_id AND f1.length = f2.length`
  (compare with the alias page that used `<>` and got each pair twice).
- Self-join only reaches one level; recursive CTE (see above) generalizes to N levels — natural lesson sequence.

### Sequences  [M1, M2, M5]  (source: tutorial__sequences.txt, tutorial__serial.txt, tutorial__check-constraint.txt)
- `CREATE SEQUENCE [IF NOT EXISTS] name [AS {SMALLINT|INT|BIGINT}] [INCREMENT [BY] n] [MINVALUE m | NO MINVALUE]
  [MAXVALUE m | NO MAXVALUE] [START [WITH] s] [CACHE c] [[NO] CYCLE] [OWNED BY table.col | NONE]`.
  Defaults: AS bigint; INCREMENT 1; ascending min 1 / max = type max; descending max -1 / min = type min; START = min
  (asc) or max (desc); CACHE 1; NO CYCLE (error at limit). Name must be unique among relations in the schema (sequences
  are relations: pg_class relkind 'S').
- `CREATE SEQUENCE mysequence INCREMENT 5 START 100;` -> nextval 100, 105. Cycling countdown: `CREATE SEQUENCE three
  INCREMENT -1 MINVALUE 1 MAXVALUE 3 START 3 CYCLE;` -> 3,2,1,3,2,1...
- OWNED BY: `CREATE SEQUENCE order_item_id START 10 INCREMENT 10 MINVALUE 10 OWNED BY order_details.item_id;` then
  `nextval('order_item_id')` inside VALUES -> 10, 20, 30; `DROP TABLE order_details` drops the sequence too.
- List: `SELECT relname FROM pg_class WHERE relkind = 'S';`. Drop: `DROP SEQUENCE [IF EXISTS] a, b [CASCADE|RESTRICT]`.
- **Non-transactional**: nextval is never rolled back (gaps after ROLLBACK or failed INSERT — the CHECK page's failed inserts consumed ids 1 and 2).
  Concurrent sessions always get distinct values. M5 visualizer: two sessions, one rolls back, gap appears. M2: a
  sequence is a one-row relation; CACHE n preallocates per session (more gaps on disconnect). WAL logs sequences 32
  values ahead (SEQ_LOG_VALS), so a crash can skip values — M7 link.

### SERIAL pseudo-type  [M1, M2]  (source: tutorial__serial.txt, tutorial__add-column.txt)
- `id SERIAL` ≡ `CREATE SEQUENCE t_id_seq; CREATE TABLE t (id integer NOT NULL DEFAULT nextval('t_id_seq'));
  ALTER SEQUENCE t_id_seq OWNED BY t.id;`. No index / PK implied — add PRIMARY KEY explicitly.
- SMALLSERIAL 2 bytes 1..32,767; SERIAL 4 bytes 1..2,147,483,647; BIGSERIAL 8 bytes 1..9,223,372,036,854,775,807.
- Insert with omitted column or `VALUES (DEFAULT, 'Apple')`. `SELECT currval(pg_get_serial_sequence('fruits','id'));`
  (currval is session-local, errors if nextval not yet called in the session). Prefer `RETURNING id`.
- Page inconsistency: inserts Orange then Apple but shows 1 Apple, 2 Orange — expected 1 Orange, 2 Apple.
- Teach SERIAL as legacy; identity columns are the modern standard (ownership/permissions of the sequence are handled
  automatically, and `GENERATED ALWAYS` prevents accidental manual ids).

### Server and database objects (mental model)  [M1]  (source: tutorial__server-and-database-objects.txt, tutorial.txt)
- Hierarchy: server instance (service; multiple instances per host on different ports/data dirs) -> databases -> schemas
  -> tables/views/functions/sequences/indexes. Table inheritance mentioned as a PG-specific feature. Tablespaces =
  physical locations; defaults `pg_default` (user data) and `pg_global` (shared system catalogs). Operators and casts
  are user-definable objects backed by functions. Extensions (since 9.1) package types/functions/operators/index
  methods.
- Good skeleton for the M1 "what lives where" diagram; deepen with pg_database / pg_namespace / pg_class / pg_tablespace
  and the on-disk `base/<dboid>/<relfilenode>` path.

### Subqueries  [M3, M4]  (source: tutorial__subquery.txt, tutorial__correlated-subquery.txt, tutorial__any.txt, tutorial__exists.txt)
- Angle: "run two queries by hand, then nest the first into the second". Scalar: `country_id = (SELECT country_id FROM
  country WHERE country = 'United States')` (= 103) -> Akron, Arlington, Augusta-Richmond County, Aurora, Bellevue, ...
  Multi-row: `film_id IN (SELECT film_id FROM film_category INNER JOIN category USING(category_id) WHERE name =
  'Action')` -> 19 Amadeus Holy, 21 American Circus, 29 Antitrust Tomatoes, 38 Ark Ridgemont, 56 Barefoot Manchurian...
- "Subquery is executed first" is true for uncorrelated subqueries (InitPlan, computed once); M4 shows InitPlan vs
  SubPlan vs semi-join pull-up.
- Pitfall: a scalar subquery returning >1 row -> `ERROR: more than one row returned by a subquery used as an expression`.

### Temporary tables  [M1, M5, M7]  (source: tutorial__temporary-table.txt, tutorial__create-table-as.txt)
- `CREATE TEMP[ORARY] TABLE mytemp(id INT);` visible only to the creating session; dropped at session end. Second
  session: `ERROR: relation "mytemp" does not exist`.
- Name shadowing: a temp `customers` hides permanent `customers` (pg_temp_N is searched first) — `\dt+` shows schema
  `pg_temp_3`, Persistence `temporary`; reach the real table via `public.customers`. DROP TABLE has no TEMP keyword.
- Page says "you cannot specify the schema" — you can write `CREATE TABLE pg_temp.x (...)`; you just can't put a temp
  table in a regular schema. "Transaction scope" use needs `ON COMMIT DROP` / `ON COMMIT DELETE ROWS` (not shown).
- Internals hook: temp tables are not WAL-logged, live in backend-local buffers (`temp_buffers`), and autovacuum cannot
  see them (ANALYZE them manually). `mytemp` shows 8192 bytes = one page.

### TIME and TIMETZ  [M2]  (source: tutorial__time.txt)
- `TIME(p)` p = 0..6 (page says 1..6), 8 bytes, range 00:00:00 .. 24:00:00; formats `HH:MI`, `HH:MI:SS`, `HHMISS`,
  with fractions `04:05:06.777777`. TIME WITH TIME ZONE: 12 bytes, 00:00:00+1459 .. 24:00:00-1459; discouraged ("time
  zone has little meaning without a date").
- shifts seed: Morning 08-12, Afternoon 13-17, Night 18-22.
- `CURRENT_TIME` (timetz) / `CURRENT_TIME(5)`; `LOCALTIME` / `LOCALTIME(0)`; `time '10:00' - time '02:00'` = 08:00:00
  (interval); `LOCALTIME + interval '2 hours'` wraps around midnight (03:16 in example).
- **Pitfall visible in the output:** `SELECT LOCALTIME AT TIME ZONE 'UTC-7'` prints `+07` — POSIX-style zone strings
  have inverted signs ('UTC-7' means 7 hours *east* of Greenwich). Use named zones or `INTERVAL '-07:00'`.
- `EXTRACT(HOUR|MINUTE|SECOND|MILLISECONDS FROM LOCALTIME)`.

### TIMESTAMP vs TIMESTAMPTZ  [M2]  (source: tutorial__timestamp.txt, tutorial__default-value.txt, tutorial__date.txt)
- Both 8 bytes — proven with `SELECT typname, typlen FROM pg_type WHERE typname ~ '^timestamp';` (catalog query as a
  teaching device!). timestamptz is stored as UTC with **no zone stored**; converted to the session TimeZone on output.
- Demo:
  ```sql
  CREATE TABLE timestamp_demo (ts TIMESTAMP, tstz TIMESTAMPTZ);
  SET timezone = 'America/Los_Angeles';
  INSERT INTO timestamp_demo VALUES ('2016-06-22 19:10:25-07', '2016-06-22 19:10:25-07');
  SELECT ts, tstz FROM timestamp_demo;   -- 2016-06-22 19:10:25 | 2016-06-22 19:10:25-07
  SET timezone = 'America/New_York';
  SELECT ts, tstz FROM timestamp_demo;   -- 2016-06-22 19:10:25 | 2016-06-22 22:10:25-04
  ```
  Note the `-07` in the `ts` literal is silently ignored for timestamp-without-tz. Recommendation: use timestamptz.
- Functions: `NOW()` = `CURRENT_TIMESTAMP` (transaction start, timestamptz), `CURRENT_TIME`, `TIMEOFDAY()` (text, wall
  clock — changes within a transaction). `timezone('America/Los_Angeles', '2016-06-01 00:00'::timestamptz)` ->
  2016-05-31 21:00:00 (≡ `AT TIME ZONE`, returns timestamp without tz).
- updated_at pattern (PG has no MySQL `ON UPDATE CURRENT_TIMESTAMP`):
  ```sql
  CREATE TABLE department (id SERIAL PRIMARY KEY, name VARCHAR NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
  CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = current_timestamp; RETURN NEW; END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER department_updated_at_trigger BEFORE UPDATE ON department
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ```
  Great first-trigger example for M6.

### Transactions (intro)  [M5]  (source: tutorial__transaction.txt, tutorial__explain.txt)
- ACID one-liners; bank-transfer framing. Every statement runs in an implicit transaction (autocommit) unless BEGIN
  (`BEGIN`, `BEGIN WORK`, `BEGIN TRANSACTION`) ... `COMMIT` / `ROLLBACK` (WORK/TRANSACTION noise words).
- Seed: `accounts(id INT GENERATED BY DEFAULT AS IDENTITY, name VARCHAR(100) NOT NULL, balance DEC(15,2) NOT NULL
  CHECK(balance >= 0), PRIMARY KEY(id))` with Bob 10000, Alice 10000.
- Two-session demo: uncommitted INSERT visible in own session, invisible in another (no dirty reads under READ
  COMMITTED); visible after COMMIT; ROLLBACK of `balance - 1000` leaves 10000. PGlite is single-session, so the
  lesson needs a simulated second session (or the visualizer shows xmin/xmax snapshots).
- Missing pieces to add from docs: the transfer itself in one transaction (two UPDATEs), CHECK failing mid-transaction
  aborts it ("current transaction is aborted, commands ignored until end of transaction block"), SAVEPOINT.

### TRUNCATE  [M5, M7]  (source: tutorial__truncate-table.txt, tutorial__import-csv-file-into-posgresql-table.txt)
- `TRUNCATE TABLE a, b;` Referenced by FK -> error (`DETAIL: Table "order_items" references "orders".` `HINT: Truncate
  table "order_items" at the same time, or use TRUNCATE ... CASCADE.`); `TRUNCATE TABLE orders CASCADE;` ->
  `NOTICE: truncate cascades to table "order_items"`. RESTRICT default.
- `RESTART IDENTITY` resets owned sequences; default `CONTINUE IDENTITY`. Does not fire ON DELETE triggers; fires
  BEFORE/AFTER TRUNCATE (statement-level) triggers. Transaction-safe (can ROLLBACK).
- orders/order_items seed (3 orders, 5 items, FK ON DELETE CASCADE ON UPDATE CASCADE, composite PK) — useful.
- Corrections for the "why faster" list: TRUNCATE takes an **ACCESS EXCLUSIVE** lock (the *strongest* lock; blocks even
  SELECT) — not "lower-level locking"; "undo and redo" is Oracle vocabulary. Accurate PG story: TRUNCATE swaps in a new
  empty relfilenode (visible via `pg_relation_filenode()` before/after), the old file is unlinked at commit, no per-row
  xmax, no dead tuples, no VACUUM needed. It is not MVCC-safe: concurrent REPEATABLE READ transactions with an older
  snapshot see the table as empty. Great M2/M5/M7 lesson.

### UNIQUE constraints  [M1, M4, M5]  (source: tutorial__unique-constraint.txt, tutorial__copy-table.txt, tutorial__create-table.txt)
- Column (`email VARCHAR(50) UNIQUE`) or table form (`UNIQUE(email)`, `UNIQUE (c2, c3)` for combinations).
  Auto-created unique btree index named `<table>_<col>_key`. Error:
  `ERROR: duplicate key value violates unique constraint "person_email_key"` / `DETAIL: Key (email)=(john.doe@example.com)
  already exists.`
- Online pattern: `CREATE UNIQUE INDEX CONCURRENTLY equipment_equip_id ON equipment (equip_id);` then `ALTER TABLE
  equipment ADD CONSTRAINT unique_equip_id UNIQUE USING INDEX equipment_equip_id;` (index is renamed to the constraint
  name). ALTER TABLE still needs a brief exclusive lock and waits behind open transactions — check `pg_stat_activity`
  for `state = 'idle in transaction'`. (CONCURRENTLY can't run inside a transaction block — PGlite caveat.)
- Missing from page (add): multiple NULLs are allowed in a UNIQUE column (NULLs distinct); PG15+ `UNIQUE NULLS NOT
  DISTINCT` changes that.

### UPDATE and UPDATE ... FROM  [M3, M5]  (source: tutorial__update.txt, tutorial__update-join.txt, tutorial__array.txt, tutorial__composite-types.txt)
- `UPDATE t SET c1 = v1, c2 = v2 WHERE cond [RETURNING ...]`; no WHERE = all rows. Tag `UPDATE n` counts matched rows
  including ones whose values didn't change (PG still writes new tuple versions for them!).
- courses seed walk: set published_date of 3; update 2 RETURNING *; `price = price * 1.05` for all (`UPDATE 5`) ->
  314.99, 816.89, 1049.98, 577.49, 367.49. **The final SELECT returns rows in order 1,4,5,3,2** — exactly the order of
  the newest tuple versions in the heap (3 and 2 had been updated before, so their versions came later in the scan).
  Use this as the M5 "UPDATE = DELETE + INSERT of a new version" reveal with `ctid`.
- UPDATE join: `UPDATE product p SET net_price = price - price * discount FROM product_segment s WHERE p.segment_id =
  s.id;` (discounts 0.05 / 0.06 / 0.1). Pitfalls: (1) the page's syntax template `SET table1.c1 = ...` is invalid — PG
  forbids qualifying the target column (it would parse as a composite field); (2) if the FROM join yields several rows
  per target row, one arbitrary row is used; (3) forgetting the join condition updates every row with an arbitrary
  match (cross join).

### Upsert: INSERT ... ON CONFLICT  [M3, M5]  (source: tutorial__upsert.txt, tutorial__merge.txt)
- `INSERT ... ON CONFLICT (conflict_target) DO NOTHING | DO UPDATE SET col = EXCLUDED.col, ...`; `EXCLUDED` is the row
  proposed for insertion. Target must match a unique index/constraint (or `ON CONSTRAINT name`).
  ```sql
  CREATE TABLE inventory(id INT PRIMARY KEY, name VARCHAR(255) NOT NULL, price DECIMAL(10,2) NOT NULL, quantity INT NOT NULL);
  INSERT INTO inventory VALUES (1,'A',15.99,100),(2,'B',25.49,50),(3,'C',19.95,75);
  INSERT INTO inventory (id, name, price, quantity) VALUES (1,'A',16.99,120)
    ON CONFLICT(id) DO UPDATE SET price = EXCLUDED.price, quantity = EXCLUDED.quantity;   -- INSERT 0 1 (updated)
  INSERT INTO inventory (id, name, price, quantity) VALUES (4,'D',29.99,20)
    ON CONFLICT(id) DO UPDATE SET price = EXCLUDED.price, quantity = EXCLUDED.quantity;   -- INSERT 0 1 (inserted)
  ```
  Both paths report `INSERT 0 1`; to tell them apart use `RETURNING (xmax = 0) AS inserted` (classic trick) or, in
  PG18, `RETURNING old.*, new.*` (old is NULL for inserts).
- Page claims "MERGE is equivalent to UPSERT" — not for concurrency: ON CONFLICT is atomic against concurrent inserts
  (speculative insertion), MERGE is not. Additional options to add: `DO UPDATE ... WHERE`, multi-row VALUES with
  duplicates in the same statement -> "ON CONFLICT DO UPDATE command cannot affect row a second time".

### Domains and user-defined types  [M2, M6]  (source: tutorial__user-defined-data-types.txt, tutorial__composite-types.txt, tutorial__enum.txt)
- `CREATE DOMAIN contact_name AS VARCHAR NOT NULL CHECK (value !~ '\s');` reuse in many columns; violation:
  `ERROR: value for domain contact_name violates check constraint "contact_name_check"` ('Jame V' has a space).
  ALTER DOMAIN / DROP DOMAIN; psql `\dD`; catalog: `SELECT typname FROM pg_type JOIN pg_namespace ON pg_namespace.oid =
  pg_type.typnamespace WHERE typtype = 'd' AND nspname = 'public';` (typtype codes: b base, c composite, d domain, e
  enum, p pseudo, r range, m multirange — from docs).
- Composite return type:
  ```sql
  CREATE TYPE film_summary AS (film_id INT, title VARCHAR, release_year SMALLINT);
  CREATE OR REPLACE FUNCTION get_film_summary (f_id INT) RETURNS film_summary AS $$
    SELECT film_id, title, release_year FROM film WHERE film_id = f_id;
  $$ LANGUAGE SQL;
  SELECT * FROM get_film_summary(40);
  ```
  (dvdrental: release_year is the domain `year`, so this relies on an implicit cast.) `\dT` lists contact_name,
  film_summary, mpaa_rating.

### UUID  [M2, M4]  (source: tutorial__uuid.txt, tutorial__data-types.txt)
- 128-bit; text form 32 hex digits in 8-4-4-4-12 groups; better global uniqueness than SERIAL; hides sequential ids
  in URLs.
- `gen_random_uuid()` built in (core since PG13) returns v4. `contact_id uuid DEFAULT gen_random_uuid()` PK.
  `uuid-ossp` extension (`uuid_generate_v4()`) only needed on old versions (it's a contrib module, not third-party).
- **PG18 additions not on page:** `uuidv7()` (time-ordered, index-friendly) and `uuidv4()` alias; also
  `uuid_extract_timestamp()`/`uuid_extract_version()` (PG17). RFC 4122 is superseded by RFC 9562. M4 lesson: insert
  100k v4 vs v7 keys and compare btree page splits / index size (pageinspect bt_metap, pgstattuple-like stats).

### WHERE clause  [M3]  (source: tutorial__where.txt)
- Condition is three-valued; only rows where it is TRUE pass (FALSE and NULL/unknown are filtered).
- Evaluated after FROM, before SELECT/ORDER BY -> SELECT aliases are not visible in WHERE.
- Operator table: = > < >= <= <> (≡ !=) AND OR IN BETWEEN LIKE IS NULL NOT.
- customer examples: `first_name = 'Jamie'` -> Rice, Waugh; `AND last_name = 'Rice'`; `last_name = 'Rodriguez' OR
  first_name = 'Adam'` -> Laura Rodriguez, Adam Gooch; `IN ('Ann','Anne','Annie')`; `LIKE 'Ann%'` -> Anna, Ann, Anne,
  Annie, Annette; `LIKE 'A%' AND LENGTH(first_name) BETWEEN 3 AND 5`; `LIKE 'Bra%' AND last_name <> 'Motley'` -> Brandy
  Graves, Brandon Huey, Brad Mccurdy.

### XML type  [M2, M4, M6]  (source: tutorial__xml-data-type.txt)
- `info XML`; insert with `XMLPARSE(DOCUMENT '<?xml version="1.0" encoding="UTF-8"?><person>...</person>')` (validates
  well-formedness). `xpath('/person/name/text()', info)` returns `xml[]` -> `{"John Doe"}`; scalar text via
  `(xpath(...))[1]::text`; integer needs `::text::integer` (no direct xml->int cast).
- Expression index: `CREATE INDEX person_name ON person USING BTREE (cast(xpath('/person/name', info) as text[]));`
  then 1000 generated rows via a PL/pgSQL function using generate_series, and `EXPLAIN ANALYZE ... WHERE
  cast(xpath('/person/name', info) as text[]) = '{<name>Jane Doe</name>}'` -> Bitmap Heap Scan + Bitmap Index Scan on
  person_name. Lesson: the WHERE expression must match the indexed expression exactly. (The shown plan returns rows=0
  even though Jane Doe exists — the indexed text includes the exact serialized element; whitespace/format differences
  matter. Good debugging exercise.) PGlite: XML support depends on libxml in the build — verify.

## Reusable sample schemas

All scripts below were executed successfully in **PGlite 0.5.16 (PostgreSQL 18.6, wasm32)** from the project's
`app/node_modules`, and the spot-check queries listed after each produced the stated results.

### A. dvdrental — what the series actually uses, and what to recreate
Tables the tutorial queries (with the facts its outputs reveal):
| table | used for | facts visible in tutorial outputs |
|---|---|---|
| film | nearly every SELECT/WHERE/ORDER/LIMIT/CASE/subquery page | 1000 rows; film_id 1 Academy Dinosaur; rental_rate ∈ {0.99 (341), 2.99 (323), 4.99 (336)}; length 46..185; rating enum `mpaa_rating` (G 178, PG 194, PG-13 223, R 195, NC-17 210); release_year 2006 (domain `year`); avg rental_rate 2.98 |
| customer | aliases, WHERE, LIKE, ORDER BY, EXISTS, HAVING | 599 rows; store 1: 326, store 2: 273; heap order starts with 524 Jared Ely; columns incl. activebool + active int |
| payment | BETWEEN, IN, GROUP BY, HAVING, joins, EXISTS | 14,596 rows (staff 1: 7292, staff 2: 7304); total 61312.04; dates 2007-02-14 .. 2007-05-14; top customer 148 Eleanor Hunt 211.55, 526 Karl Seal 208.58; some amount = 0; 8 customers paid > 11 |
| rental | CTE with staff, ROLLUP by y/m/d | 16,044 rows (Mike Hillyer 8040, Jon Stephens 8004) |
| staff | 3-way join, CTE | 2 rows: Mike Hillyer, Jon Stephens |
| inventory | LEFT/RIGHT JOIN anti-join | some films have no inventory (Alice Fantasia 14, Apollo Teen 33, Argonauts Town 36, Ark Ridgemont 38, Arsenic Independence 41, ...) |
| film_category, category | CTE (Action films), CTAS action_film, IN-subquery, EXPLAIN 3-way join | category_id 1 = Action |
| actor | IN with strings | duplicate names: two "Susan Davis" |
| address | IS NULL | address2 NULL for 4 store/staff addresses, '' for the rest |
| city, country | subquery (United States = 103), NATURAL JOIN pitfall | both carry `last_update` -> NATURAL JOIN returns 0 rows |
| store, film_actor, language | mentioned in diagrams / implied by FKs | — |

Recommendation: do **not** ship the full dvdrental (≈45k rows, 15 tables) in PGlite lessons by default. Use the mini
version below (≈195 rows, same table/column names and types, including the `year` domain, `mpaa_rating` enum and the
`special_features text[]` column) so lesson SQL copied from the tutorial runs unchanged; results differ in magnitude but
keep the same *shape* (ties at 4.99, a film with no inventory, a customer with no rentals, NULL vs '' in address2, two
stores/two staff, unreturned rentals, a 0.00 payment, payments > 11, NATURAL JOIN returning 0 rows). For M4 lessons that
need realistic cardinalities, generate bulk rows with generate_series into the same tables (e.g. 20k payments).

```sql
-- mini_dvdrental (fits M3 querying lessons; M4 EXPLAIN basics; M5 join/update demos)
CREATE DOMAIN year AS integer CHECK (VALUE >= 1901 AND VALUE <= 2155);
CREATE TYPE mpaa_rating AS ENUM ('G', 'PG', 'PG-13', 'R', 'NC-17');
CREATE TABLE language (language_id serial PRIMARY KEY, name char(20) NOT NULL, last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE category (category_id serial PRIMARY KEY, name varchar(25) NOT NULL, last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE actor (actor_id serial PRIMARY KEY, first_name varchar(45) NOT NULL, last_name varchar(45) NOT NULL,
                    last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE film (
  film_id serial PRIMARY KEY, title varchar(255) NOT NULL, description text, release_year year,
  language_id smallint NOT NULL REFERENCES language, rental_duration smallint NOT NULL DEFAULT 3,
  rental_rate numeric(4,2) NOT NULL DEFAULT 4.99, length smallint, replacement_cost numeric(5,2) NOT NULL DEFAULT 19.99,
  rating mpaa_rating DEFAULT 'G', last_update timestamp NOT NULL DEFAULT now(), special_features text[]);
CREATE TABLE film_category (film_id smallint NOT NULL REFERENCES film, category_id smallint NOT NULL REFERENCES category,
  last_update timestamp NOT NULL DEFAULT now(), PRIMARY KEY (film_id, category_id));
CREATE TABLE film_actor (actor_id smallint NOT NULL REFERENCES actor, film_id smallint NOT NULL REFERENCES film,
  last_update timestamp NOT NULL DEFAULT now(), PRIMARY KEY (actor_id, film_id));
CREATE TABLE country (country_id serial PRIMARY KEY, country varchar(50) NOT NULL, last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE city (city_id serial PRIMARY KEY, city varchar(50) NOT NULL, country_id smallint NOT NULL REFERENCES country,
  last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE address (address_id serial PRIMARY KEY, address varchar(50) NOT NULL, address2 varchar(50),
  district varchar(20) NOT NULL, city_id smallint NOT NULL REFERENCES city, postal_code varchar(10), phone varchar(20) NOT NULL,
  last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE store (store_id serial PRIMARY KEY, manager_staff_id smallint NOT NULL, address_id smallint NOT NULL REFERENCES address,
  last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE staff (staff_id serial PRIMARY KEY, first_name varchar(45) NOT NULL, last_name varchar(45) NOT NULL,
  address_id smallint NOT NULL REFERENCES address, email varchar(50), store_id smallint NOT NULL REFERENCES store,
  active boolean NOT NULL DEFAULT true, username varchar(16) NOT NULL, last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE customer (customer_id serial PRIMARY KEY, store_id smallint NOT NULL REFERENCES store,
  first_name varchar(45) NOT NULL, last_name varchar(45) NOT NULL, email varchar(50),
  address_id smallint NOT NULL REFERENCES address, activebool boolean NOT NULL DEFAULT true,
  create_date date NOT NULL DEFAULT '2006-02-14', last_update timestamp DEFAULT now(), active integer);
CREATE TABLE inventory (inventory_id serial PRIMARY KEY, film_id smallint NOT NULL REFERENCES film,
  store_id smallint NOT NULL REFERENCES store, last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE rental (rental_id serial PRIMARY KEY, rental_date timestamp NOT NULL,
  inventory_id integer NOT NULL REFERENCES inventory, customer_id smallint NOT NULL REFERENCES customer,
  return_date timestamp, staff_id smallint NOT NULL REFERENCES staff, last_update timestamp NOT NULL DEFAULT now());
CREATE TABLE payment (payment_id serial PRIMARY KEY, customer_id smallint NOT NULL REFERENCES customer,
  staff_id smallint NOT NULL REFERENCES staff, rental_id integer NOT NULL REFERENCES rental,
  amount numeric(5,2) NOT NULL, payment_date timestamp NOT NULL);

INSERT INTO language (name) VALUES ('English');
INSERT INTO category (name) VALUES ('Action'), ('Comedy'), ('Drama'), ('Horror'), ('Family');
INSERT INTO country (country) VALUES ('United States'), ('Canada'), ('Australia');
INSERT INTO city (city, country_id) VALUES ('Akron',1),('Arlington',1),('Aurora',1),('Lethbridge',2),('Woodridge',3);
INSERT INTO address (address, address2, district, city_id, postal_code, phone) VALUES
  ('47 MySakila Drive', NULL, 'Alberta', 4, NULL, '-'), ('28 MySQL Boulevard', NULL, 'QLD', 5, NULL, '-'),
  ('23 Workhaven Lane', NULL, 'Alberta', 4, NULL, '14033335568'), ('1411 Lillydale Drive', NULL, 'QLD', 5, NULL, '6172235589'),
  ('1913 Hanoi Way', '', 'Ohio', 1, '35200', '28303384290'), ('1121 Loja Avenue', '', 'Texas', 2, '17886', '838635286649'),
  ('692 Joliet Street', '', 'Illinois', 3, '83579', '448477190408'), ('1566 Inegl Manor', '', 'Ohio', 1, '53561', '705814003527'),
  ('53 Idfu Parkway', '', 'Texas', 2, '42399', '10655648674'), ('1795 Santiago Way', '', 'Illinois', 3, '18743', '860452626434');
INSERT INTO store (manager_staff_id, address_id) VALUES (1, 1), (2, 2);
INSERT INTO staff (first_name, last_name, address_id, email, store_id, username) VALUES
  ('Mike', 'Hillyer', 3, 'mike.hillyer@sakilastaff.com', 1, 'Mike'),
  ('Jon', 'Stephens', 4, 'jon.stephens@sakilastaff.com', 2, 'Jon');
ALTER TABLE store ADD FOREIGN KEY (manager_staff_id) REFERENCES staff;
INSERT INTO film (title, release_year, language_id, rental_duration, rental_rate, length, rating, special_features) VALUES
  ('Academy Dinosaur',   2006, 1, 6, 0.99,  86, 'PG',    '{Deleted Scenes,Behind the Scenes}'),
  ('Ace Goldfinger',     2006, 1, 3, 4.99,  48, 'G',     '{Trailers,Deleted Scenes}'),
  ('Adaptation Holes',   2006, 1, 7, 2.99,  50, 'NC-17', '{Trailers,Deleted Scenes}'),
  ('Affair Prejudice',   2006, 1, 5, 2.99, 117, 'G',     '{Commentaries,Behind the Scenes}'),
  ('African Egg',        2006, 1, 6, 2.99, 130, 'G',     '{Deleted Scenes}'),
  ('Agent Truman',       2006, 1, 3, 2.99, 169, 'PG',    '{Deleted Scenes}'),
  ('Airplane Sierra',    2006, 1, 6, 4.99,  62, 'PG-13', '{Trailers,Deleted Scenes}'),
  ('Airport Pollock',    2006, 1, 6, 4.99,  54, 'R',     '{Trailers}'),
  ('Alabama Devil',      2006, 1, 3, 2.99, 114, 'PG-13', '{Trailers,Deleted Scenes}'),
  ('Aladdin Calendar',   2006, 1, 6, 4.99,  63, 'NC-17', '{Trailers,Deleted Scenes}'),
  ('Alice Fantasia',     2006, 1, 6, 0.99,  94, 'NC-17', '{Trailers,Deleted Scenes}'),
  ('Ali Forever',        2006, 1, 4, 4.99, 150, 'PG',    '{Deleted Scenes,Behind the Scenes}'),
  ('Amadeus Holy',       2006, 1, 6, 0.99, 113, 'PG',    '{Commentaries,Deleted Scenes}'),
  ('American Circus',    2006, 1, 3, 4.99, 129, 'R',     '{Commentaries,Behind the Scenes}'),
  ('Antitrust Tomatoes', 2006, 1, 5, 2.99, 168, 'NC-17', '{Trailers,Commentaries}'),
  ('Ark Ridgemont',      2006, 1, 6, 0.99,  68, 'NC-17', '{Trailers,Commentaries}'),
  ('Chamber Italian',    2006, 1, 7, 4.99, 117, 'NC-17', '{Trailers}'),
  ('Grosse Wonderful',   2006, 1, 5, 4.99,  49, 'R',     '{Behind the Scenes}'),
  ('Catch Amistad',      2006, 1, 7, 0.99, 183, 'G',     '{Trailers}'),
  ('Young Language',     2006, 1, 6, 0.99, 183, 'G',     '{Trailers,Behind the Scenes}');
INSERT INTO film_category (film_id, category_id)
  SELECT film_id, CASE WHEN title IN ('Amadeus Holy','American Circus','Antitrust Tomatoes','Ark Ridgemont') THEN 1
                       ELSE 2 + film_id % 4 END
  FROM film;
INSERT INTO actor (first_name, last_name) VALUES
  ('Penelope','Guiness'),('Nick','Wahlberg'),('Ed','Chase'),('Jennifer','Davis'),('Bette','Nicholson'),
  ('Susan','Davis'),('Susan','Davis'),('Cuba','Allen'),('Kim','Allen'),('Jon','Chase');
INSERT INTO film_actor (actor_id, film_id)
  SELECT a, f FROM generate_series(1,10) a, generate_series(1,20) f WHERE (a * 7 + f * 3) % 10 = 0;
INSERT INTO customer (store_id, first_name, last_name, email, address_id, active) VALUES
  (1,'Mary','Smith','mary.smith@sakilacustomer.org',5,1), (1,'Patricia','Johnson','patricia.johnson@sakilacustomer.org',6,1),
  (1,'Linda','Williams','linda.williams@sakilacustomer.org',7,1), (2,'Barbara','Jones','barbara.jones@sakilacustomer.org',8,1),
  (1,'Jennifer','Davis','jennifer.davis@sakilacustomer.org',9,1), (2,'Jamie','Rice','jamie.rice@sakilacustomer.org',10,1),
  (1,'Jamie','Waugh','jamie.waugh@sakilacustomer.org',5,1), (2,'Eleanor','Hunt','eleanor.hunt@sakilacustomer.org',6,1),
  (1,'Karl','Seal','karl.seal@sakilacustomer.org',7,1), (2,'Adam','Gooch','adam.gooch@sakilacustomer.org',8,1),
  (1,'Ann','Evans','ann.evans@sakilacustomer.org',9,1), (2,'Jared','Ely','jared.ely@sakilacustomer.org',10,0);
-- one copy of every film except 'Alice Fantasia' (id 11), alternating stores -> 19 rows
INSERT INTO inventory (film_id, store_id)
  SELECT f, 1 + f % 2 FROM generate_series(1,20) f WHERE f <> 11;
-- 35 rentals Feb 14 .. May 2007; customer 12 (Jared Ely) never rents; last 3 not yet returned
INSERT INTO rental (rental_date, inventory_id, customer_id, return_date, staff_id)
  SELECT ts, 1 + (g * 7) % 19, 1 + (g * 5) % 11,
         CASE WHEN g > 32 THEN NULL ELSE ts + ((g % 7) + 1) * interval '1 day' END, 1 + g % 2
  FROM (SELECT g, timestamp '2007-02-14 21:00' + (g - 1) * interval '2 days 14 hours 17 minutes' AS ts
        FROM generate_series(1,35) g) x;
INSERT INTO payment (customer_id, staff_id, rental_id, amount, payment_date)
  SELECT r.customer_id, r.staff_id, r.rental_id,
         CASE WHEN r.rental_id = 20 THEN 0.00 WHEN r.rental_id % 13 = 0 THEN 11.99 ELSE f.rental_rate + (r.rental_id % 3) END,
         r.rental_date + interval '15 minutes'
  FROM rental r JOIN inventory i USING (inventory_id) JOIN film f USING (film_id);
-- dvdrental's city/country rows carry different last_update stamps: this is what makes NATURAL JOIN return 0 rows
UPDATE country SET last_update = '2006-02-15 09:44:00';
UPDATE city    SET last_update = '2006-02-15 09:45:25';
ANALYZE;
```
Row counts: language 1, category 5, country 3, city 5, address 10, store 2, staff 2, film 20, film_category 20, actor 10,
film_actor 20, customer 12, inventory 19, rental 35, payment 35 (= 199). Verified in PGlite: films without inventory ->
Alice Fantasia; customers without rentals -> Jared Ely; `address2 IS NULL` -> 4; rental_rate groups 0.99:6, 2.99:6,
4.99:8; payments by staff 17/18; `EXISTS(... amount = 0)` -> t; customers with a payment > 11 -> Adam Gooch, Ann Evans;
unreturned rentals 3; `city NATURAL JOIN country` -> 0 rows; actor last names duplicated (Chase 2, Allen 2, Davis 3);
correlated "longer than rating average" -> 9 films.

### B. Small standalone seeds (one per lesson; all copied from the tutorial unless noted)
```sql
-- S1 employees/managers: ANY/ALL/SOME quiz [M3]  (ALL page values; ANY page uses Bob = 45000)
CREATE TABLE employees (id SERIAL PRIMARY KEY, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL,
                        salary DECIMAL(10,2) NOT NULL);
CREATE TABLE managers (id SERIAL PRIMARY KEY, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL,
                       salary DECIMAL(10,2) NOT NULL);
INSERT INTO employees (first_name, last_name, salary) VALUES
 ('Bob','Williams',75000),('Charlie','Davis',55000),('David','Jones',50000),('Emma','Brown',48000),
 ('Frank','Miller',52000),('Grace','Wilson',49000),('Harry','Taylor',53000),('Ivy','Moore',47000),
 ('Jack','Anderson',56000),('Kate','Hill',44000),('Liam','Clark',59000),('Mia','Parker',42000);
INSERT INTO managers (first_name, last_name, salary) VALUES ('John','Doe',60000),('Jane','Smith',55000),('Alice','Johnson',58000);
-- verified: > ALL -> Bob only; < ALL -> 8 rows

-- S2 teams/players: every join type [M3, M4]
CREATE TABLE teams (id INT PRIMARY KEY, team VARCHAR(100) NOT NULL, city VARCHAR(100) NOT NULL);
CREATE TABLE players (id INT PRIMARY KEY, team_id INT REFERENCES teams (id), player VARCHAR(100) NOT NULL,
                      role VARCHAR(100) NOT NULL);
INSERT INTO teams VALUES (1,'Lions','Rome'),(2,'Owls','Oslo'),(3,'Bears','Bern'),(4,'Sharks','Lima');
INSERT INTO players VALUES (1,1,'Ava','Guard'),(2,1,'Noah','Wing'),(3,2,'Emma','Back'),(4,NULL,'Liam','Guard'),
                           (5,NULL,'Mia','Wing');
-- verified: inner 3, full 7 (left 5, right 5, anti-joins 2/2, full-anti 4, cross 20)

-- S3 set operations [M3]
CREATE TABLE top_rated_films (title VARCHAR NOT NULL, release_year SMALLINT);
CREATE TABLE most_popular_films (title VARCHAR NOT NULL, release_year SMALLINT);
INSERT INTO top_rated_films VALUES ('The Shawshank Redemption',1994),('The Godfather',1972),('The Dark Knight',2008),
                                   ('12 Angry Men',1957);
INSERT INTO most_popular_films VALUES ('An American Pickle',2020),('The Godfather',1972),('The Dark Knight',2008),
                                      ('Greyhound',2020);
-- verified: EXCEPT -> Shawshank, 12 Angry Men

-- S4 sales: GROUPING SETS / ROLLUP / CUBE [M3]
CREATE TABLE sales (brand VARCHAR NOT NULL, segment VARCHAR NOT NULL, quantity INT NOT NULL, PRIMARY KEY (brand, segment));
INSERT INTO sales VALUES ('ABC','Premium',100),('ABC','Basic',200),('XYZ','Premium',100),('XYZ','Basic',300);
-- verified ROLLUP(brand, segment): ABC/Basic 200, ABC/Premium 100, ABC/- 300, XYZ/Basic 300, XYZ/Premium 100, XYZ/- 400, -/- 700

-- S5 org chart: recursive CTE (table renamed org to avoid clashing with S1) [M3]
CREATE TABLE org (employee_id SERIAL PRIMARY KEY, full_name VARCHAR NOT NULL, manager_id INT);
INSERT INTO org (employee_id, full_name, manager_id) VALUES
 (1,'Michael North',NULL),(2,'Megan Berry',1),(3,'Sarah Berry',1),(4,'Zoe Black',1),(5,'Tim James',1),
 (6,'Bella Tucker',2),(7,'Ryan Metcalfe',2),(8,'Max Mills',2),(9,'Benjamin Glover',2),(10,'Carolyn Henderson',3),
 (11,'Nicola Kelly',3),(12,'Alexandra Climo',3),(13,'Dominic King',3),(14,'Leonard Gray',4),(15,'Eric Rampling',4),
 (16,'Piers Paige',7),(17,'Ryan Henderson',7),(18,'Frank Tucker',8),(19,'Nathan Ferguson',8),(20,'Kevin Rampling',8);
-- verified: subordinates of 2 incl. self = 10 rows

-- S6 FK referential actions [M1, M5] (change ON DELETE and re-run; SET NULL shown)
CREATE TABLE customers (customer_id INT GENERATED ALWAYS AS IDENTITY, customer_name VARCHAR(255) NOT NULL,
                        PRIMARY KEY (customer_id));
CREATE TABLE contacts (contact_id INT GENERATED ALWAYS AS IDENTITY, customer_id INT, contact_name VARCHAR(255) NOT NULL,
  phone VARCHAR(15), email VARCHAR(100), PRIMARY KEY (contact_id),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE SET NULL);
INSERT INTO customers (customer_name) VALUES ('BlueBird Inc'),('Dolphin LLC');
INSERT INTO contacts (customer_id, contact_name, phone, email) VALUES
 (1,'John Doe','(408)-111-1234','john.doe@example.com'),(1,'Jane Doe','(408)-111-1235','jane.doe@example.com'),
 (2,'David Wright','(408)-222-1234','david.wright@example.com');
-- verified: after DELETE customer 1, SELECT * FROM contacts returns order 3, 1, 2 (updated tuples moved to heap end)

-- S7 MERGE (see the MERGE topic for the statement) [M3]
CREATE TABLE products (product_id SERIAL PRIMARY KEY, name TEXT UNIQUE, price DECIMAL(10,2), stock INTEGER, status TEXT,
                       last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO products (name, price, stock, status) VALUES ('Laptop',999.99,50,'active'),('Keyboard',79.99,100,'active'),
                                                       ('Mouse',29.99,200,'active');
CREATE TABLE product_updates (name TEXT, price DECIMAL(10,2), stock INTEGER, status TEXT);
INSERT INTO product_updates VALUES ('Laptop',1099.99,75,'active'),('Monitor',299.99,30,'active'),
                                   ('Keyboard',NULL,0,'discontinued'),('Headphones',89.99,50,'active');
-- verified: RETURNING merge_action() -> UPDATE Laptop, INSERT Monitor, DELETE Keyboard, INSERT Headphones

-- S8 duplicates [M3, M2 ctid]
CREATE TABLE basket (id SERIAL PRIMARY KEY, fruit VARCHAR(50) NOT NULL);
INSERT INTO basket (fruit) VALUES ('apple'),('apple'),('orange'),('orange'),('orange'),('banana');

-- S9 NULL zoo: DISTINCT / ORDER BY NULLS / COALESCE [M3]
CREATE TABLE colors (id SERIAL PRIMARY KEY, bcolor VARCHAR, fcolor VARCHAR);
INSERT INTO colors (bcolor, fcolor) VALUES ('red','red'),('red','red'),('red',NULL),(NULL,'red'),(NULL,NULL),
                                           ('green','green'),('blue','blue'),('blue','blue');
CREATE TABLE items (id SERIAL PRIMARY KEY, product VARCHAR(100) NOT NULL, price NUMERIC NOT NULL, discount NUMERIC);
INSERT INTO items (product, price, discount) VALUES ('A',1000,10),('B',1500,20),('C',800,5),('D',500,NULL);
-- verified: price - discount for D is NULL; price - COALESCE(discount,0) = 500

-- S10 enum [M2]
CREATE TYPE priority AS ENUM ('low','medium','high');
CREATE TABLE requests (id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, title VARCHAR(255) NOT NULL,
                       priority PRIORITY NOT NULL, request_date DATE NOT NULL);
INSERT INTO requests (title, priority, request_date) VALUES
 ('Create an enum tutorial in PostgreSQL','high','2019-01-01'),('Review the enum tutorial','medium','2019-01-01'),
 ('Publish the PostgreSQL enum tutorial','low','2019-01-01');

-- S11 upsert + transactions [M3, M5]
CREATE TABLE inventory_s (id INT PRIMARY KEY, name VARCHAR(255) NOT NULL, price DECIMAL(10,2) NOT NULL, quantity INT NOT NULL);
INSERT INTO inventory_s VALUES (1,'A',15.99,100),(2,'B',25.49,50),(3,'C',19.95,75);   -- tutorial name: inventory
CREATE TABLE accounts (id INT GENERATED BY DEFAULT AS IDENTITY, name VARCHAR(100) NOT NULL,
                       balance DEC(15,2) NOT NULL CHECK (balance >= 0), PRIMARY KEY (id));
INSERT INTO accounts (name, balance) VALUES ('Bob',10000),('Alice',10000);
-- verified: ON CONFLICT DO UPDATE ... RETURNING (xmax = 0) AS inserted -> false for id 1, true for id 4

-- S12 DISTINCT ON + calendar with the numeric-division bug side by side [M2, M3]
CREATE TABLE student_scores (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL, subject VARCHAR(50) NOT NULL, score INTEGER NOT NULL);
INSERT INTO student_scores (name, subject, score) VALUES ('Alice','Math',90),('Bob','Math',85),('Alice','Physics',92),
  ('Bob','Physics',88),('Charlie','Math',95),('Charlie','Physics',90);
CREATE TABLE dates (date DATE PRIMARY KEY,
  month INT GENERATED ALWAYS AS (EXTRACT(month FROM date)) STORED,
  quarter INT GENERATED ALWAYS AS (EXTRACT(quarter FROM date)) STORED,
  quarter_buggy INT GENERATED ALWAYS AS ((EXTRACT(month FROM date) - 1) / 3 + 1) STORED,  -- tutorial formula
  year INT GENERATED ALWAYS AS (EXTRACT(year FROM date)) STORED);
INSERT INTO dates (date) SELECT d::date FROM generate_series('2024-01-01'::date, '2024-12-31'::date, '1 month') d;
-- verified on PG18: quarter_buggy differs for Mar (2), Jun (3), Sep (4), Dec (5!)
```
Other seeds worth lifting verbatim from the topic notes: courses (UPDATE heap-order demo), product_segment/product
(UPDATE ... FROM, 20 rows), member/denylist (DELETE USING), departments/employees (FULL JOIN; ON DELETE CASCADE),
categories/products (NATURAL JOIN), todos (DELETE), stock_availability (BOOLEAN), contacts with TEXT[] phones (arrays),
books with hstore attr, products with JSONB properties, address_type composite, persons (COPY), weathers (REAL),
temperatures/t (DOUBLE), timestamp_demo, department + updated_at trigger, event (INTERVAL), shifts (TIME), person (XML).

## Discrepancies and version notes

Factual errors / outdated statements in the tutorial (official PG18 docs win):
- **Generated columns** (generated-columns): "PostgreSQL currently implements only stored generated columns" — false for
  PG18: VIRTUAL generated columns exist and are the **default** when no keyword is given. Verified in PGlite 18.6:
  `c int GENERATED ALWAYS AS (a*3)` gets `attgenerated = 'v'`.
- **EXTRACT returns numeric since PG14**, not double precision (interval page says double). Consequence: the calendar
  table on the generate_series page computes wrong quarters (`(EXTRACT(month)-1)/3+1` -> 1.67 -> INT 2 for March; 5 for
  December). Verified in PGlite.
- **Data types survey** (data-types): "real or float8 is a 4-byte floating-point number" — real is float4 (4 bytes),
  float8 is double precision (8 bytes); "float(n) ... up to a maximum of 8 bytes" is loose (float(1..24) -> real,
  float(25..53) -> double); omits BIGINT from integers; "converts ... space to null" for booleans is wrong; UUID cites
  RFC 4122 (superseded by RFC 9562).
- **NUMERIC**: "If you omit precision and scale, they default to 131072 and 16383" — an unconstrained numeric has no
  fixed precision/scale; max declarable precision is 1000.
- **TRUNCATE** "lower-level locking ... less prone to conflicts": wrong — TRUNCATE takes ACCESS EXCLUSIVE. "undo/redo"
  is Oracle terminology. TRUNCATE is also not MVCC-safe for older snapshots.
- **JSON vs JSONB table**: JSON has no GIN/"full-text" index support; JSON keeps duplicate keys verbatim; JSONB
  accepts duplicates and keeps the last (doesn't reject).
- **UPDATE join** syntax template `SET table1.c1 = new_value` is invalid in PostgreSQL (target columns can't be
  table-qualified).
- **MERGE**: "return both old and new values" is PG18 (`RETURNING old.*, new.*`), not PG17. `WHEN NOT MATCHED BY
  SOURCE` (PG17) not mentioned. Concurrency FAQ overstates MERGE's safety vs INSERT ... ON CONFLICT.
- **Upsert page**: "MERGE is equivalent to UPSERT" — not under concurrency.
- **EXPLAIN page**: BUFFERS "only with ANALYZE, default false" — since PG13 usable without ANALYZE (planning buffers),
  and in **PG18 BUFFERS is enabled by default with EXPLAIN ANALYZE**. Plan outputs on that page were images (missing).
- **CASE page**: prose says Mass = 1.99, query uses 2.99.
- **Serial page**: inserts Orange then Apple but shows id 1 Apple, 2 Orange. Calls sequences "not transaction-safe"
  (they are deliberately non-transactional; concurrency-safe).
- **Temporary table page**: "cannot specify the schema" (you can use `pg_temp.`), "visible only to that transaction"
  (needs ON COMMIT DROP; temp tables are session-scoped).
- **TIME page**: precision range stated 1..6 (it is 0..6). Its `AT TIME ZONE 'UTC-7'` output `+07` shows the POSIX sign
  inversion without explaining it.
- **IN page**: "IN executes much faster than ORs" — overstated; IN-lists become `= ANY(array)` (one ScalarArrayOp, index
  friendly). In PGlite 18.6 a seq-scan filter keeps `(film_id = 1) OR (film_id = 2) OR ...` as ORs; PG18's OR-to-ANY
  rewrite applies to index-scan paths — check the M4 docs slice before claiming specifics.
- **Interval page**: style names written "sql standard / postgresverbose" — actual values `sql_standard`,
  `postgres_verbose`; event-table outputs were captured with `intervalstyle = iso_8601` still set.
- **ADD COLUMN NOT NULL**: tutorial never mentions `ADD COLUMN ... NOT NULL DEFAULT x` (one step; PG11+ no rewrite for
  non-volatile defaults).
- **NOT NULL error text**: tutorial shows the old message; modern servers say `null value in column "qty" of relation
  "production_orders" violates not-null constraint`. PG18 also stores NOT NULL constraints in pg_constraint (named,
  NOT VALID possible) — confirm against the PG18 docs slice.
- **UUID page**: no mention of PG18 `uuidv7()` / `uuidv4()` (verified `uuidv7()` works in PGlite 18.6); calls uuid-ossp
  "third-party" (it is a contrib module).
- **Random page**: `random() * 10 + 1` is [1, 11), not "between 1 and 11"; PG17 added `random(min, max)`.
- **Import CSV page**: "you need superuser access" — members of `pg_read_server_files` (import) /
  `pg_write_server_files` (export) also can.
- **vs-MySQL page** (PG16 vs MySQL 8, partly marketing): PostgreSQL partitioning listed as only RANGE, LIST (HASH since
  PG11); "Bitmap indexes: Yes" (PG has bitmap *scans*, not bitmap indexes; bloom is an extension); license "MIT-style"
  (it is the PostgreSQL License, BSD/MIT-like); "covering indexes since 9.2" (index-only scans 9.2, INCLUDE since 11);
  MySQL's lack of FULL OUTER JOIN and "connection = OS process" (PG) vs thread (MySQL) are correct and worth reusing in
  M1 (process-per-connection -> need for pooling).
- **XML index example** returns rows=0 for a person that exists in the table (formatting of serialized element) — use
  as debugging exercise, not as a correct demo.
- **dvdrental-specific**: `film.rating` is enum `mpaa_rating`, `film.release_year` is domain `year`, `film.fulltext`
  tsvector, `customer.active` int alongside `activebool`. None of the official docs use this schema.

Vendor-specific / skipped:
- Every page's INFO paragraph (Lakebase/Neon/Databricks marketing) ignored. Neon-specific features: none in this slice.
- pgAdmin click-path for CSV import (import-csv page) and psql `\c dvdrental` connection steps skipped.
- MERGE page targets "PostgreSQL 17" features; nothing PG19 in this slice.

## Lesson ideas

M1 Foundations
- "What lives where" map from the server-objects page: instance -> databases -> schemas -> relations; click a node to
  see its catalog row (pg_database, pg_namespace, pg_class relkind r/i/S/v) and its file path. Include temp schema
  pg_temp_N and the two default tablespaces.
- Constraint naming explorer: create accounts / person / links and show the generated names `accounts_pkey`,
  `accounts_email_key`, `links_target_check`, `pages_author_id_fkey` side by side with pg_constraint rows.
- Dependency graph (pg_depend) animation for DROP COLUMN / DROP TABLE CASCADE / RENAME: books -> book_info view; renaming
  propagates because views store OIDs.

M2 Storage & types
- Heap-order reveal: run the courses UPDATE sequence and plot ctid per row — SELECT returns 1,4,5,3,2 with ctids
  (0,8)..(0,12) (verified). Same with contacts after ON DELETE SET NULL (order 3,1,2) and customer 524 first in dvdrental.
- Float vs numeric lab: `SUM` of three 0.1 doubles = 0.30000000000000004 vs numeric 0.3; REAL avg 5.360000038146973;
  NUMERIC(5,2) rounding 500.215 -> 500.22 and overflow error; NaN sorting first in DESC.
- Integer-vs-numeric division trap: the calendar quarter bug (seed S12) + NULLIF ratio 2/1 vs 1/2.
- Type size table from pg_type (`typlen`) as in the timestamp page: bool 1, int2 2, int4 4, int8 8, float4 4, float8 8,
  date 4, time 8, timetz 12, timestamp(tz) 8, interval 16, uuid 16, varlena -1. Animate tuple layout with padding.
- STORED vs VIRTUAL generated columns (PG18): pageinspect `heap_page_items` shows the stored column bytes only for STORED.
- DROP COLUMN leaves `........pg.dropped.N........` in pg_attribute; ADD COLUMN DEFAULT uses attmissingval.
- NULL bitmap vs empty string: address2 NULL vs '' in tuple bytes.

M3 Querying & DML
- Logical clause-order pipeline (FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> DISTINCT -> ORDER BY -> LIMIT) with
  "alias available?" badges; quiz on HAVING alias error vs ORDER BY alias ok vs GROUP BY output-name extension.
- Three-valued logic truth-table playground (AND/OR/NOT with NULL), then NOT IN (1, NULL) -> NULL (verified) and
  EXISTS (SELECT NULL) -> true.
- Join family on teams/players: one dataset, toggle INNER/LEFT/RIGHT/FULL/anti/CROSS and watch row counts 3/5/5/7/2/20;
  animate the tutorial's 4-step FULL JOIN algorithm.
- Recursive CTE stepper using the 20-person org chart: show R0 (1 row), R1 (4), R2 (5), R3 (empty) as the tutorial
  prints them; add depth/path columns and a cycle.
- GROUPING SETS progression: 4 queries -> UNION ALL with NULL padding -> GROUPING SETS -> ROLLUP/CUBE; GROUPING() bits.
- MERGE visualizer: source rows flowing into WHEN branches with merge_action() labels; then show "cannot affect row a
  second time" by duplicating a source row.
- Upsert: show the `(xmax = 0) AS inserted` trick and PG18 `RETURNING old.*, new.*`.
- Dedup lab with basket: self-join DELETE USING vs ROW_NUMBER vs ctid-based delete.

M4 Planner & indexes
- EXPLAIN ladder from the EXPLAIN page on mini_dvdrental: Seq Scan -> Index Scan (film_pkey) -> Aggregate -> 3-way Hash
  Join -> EXPLAIN ANALYZE (PG18 BUFFERS on by default).
- Correlated subquery (SubPlan, loops = N) vs window rewrite `avg(length) OVER (PARTITION BY rating)`.
- IN-list vs OR chain plans; NOT IN vs NOT EXISTS (hashed SubPlan vs Anti Join).
- LIKE 'Jen%' vs '%er%': btree text_pattern_ops vs pg_trgm GIN; ILIKE.
- Top-N with ties: `ORDER BY rental_rate DESC LIMIT 10` nondeterminism, top-N heapsort, `FETCH FIRST ... WITH TIES`.
- XML/JSON expression indexes: query must repeat the indexed expression exactly.
- UUID v4 vs v7 index growth (uuidv7 available in PGlite 18.6).

M5 Concurrency
- Sequence gaps: CHECK-violation inserts consume ids (the CHECK page's failed inserts used ids 1 and 2); ROLLBACK leaves gaps — two-session
  timeline animation.
- Transaction page bank transfer with accounts(balance CHECK >= 0): failed second UPDATE aborts the block; uncommitted
  row invisible to session B.
- MERGE vs ON CONFLICT race (simulated two sessions): unique violation vs speculative insertion.
- TRUNCATE lock level (ACCESS EXCLUSIVE) vs DELETE (ROW EXCLUSIVE) in pg_locks.

M6 Programmability
- First trigger: department.updated_at BEFORE UPDATE trigger (exact code in TIMESTAMP topic).
- Domain `contact_name` + composite `film_summary` returning SQL function; enum ALTER TYPE ADD VALUE / RENAME VALUE.
- hstore vs JSONB operator cheat-sheet playground on the same books/products data.

M7 Ops
- COPY TO/FROM and `\copy` contrast (server vs client file), privileges (pg_read_server_files).
- TRUNCATE swaps relfilenode (`pg_relation_filenode` before/after) and resets identity with RESTART IDENTITY; DELETE
  leaves dead tuples needing VACUUM.
- UNLOGGED CTAS and TEMP tables: no WAL (show pg_current_wal_lsn delta with pg_walinspect, available in PGlite).
- Online constraint pattern: CREATE UNIQUE INDEX CONCURRENTLY + ADD CONSTRAINT USING INDEX; FK NOT VALID + VALIDATE;
  check `idle in transaction` sessions in pg_stat_activity.
