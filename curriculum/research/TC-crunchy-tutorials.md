# TC — Crunchy Data developer tutorials (interactive playground series)

Source: 33 pages under `ext/crunchy/` (slice_C.tsv). Crunchy's playground runs Postgres in the browser (stated as
"Postgres 18" on the partitioning page), loads a seed dataset per tutorial, then walks the learner through a fixed
exercise sequence. Their flow (load data -> baseline query -> change -> re-measure -> inspect catalog) maps 1:1 onto
our PGlite playgrounds. Seed datasets are NOT shipped in the page text; where a tutorial depends on a pre-loaded
table, this file reconstructs a small compatible seed under "Reusable sample schemas".

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 0 | tutorials.txt | Index of all 32 playground tutorials with one-line blurbs; sets the "practical over academic" philosophy. |
| 1 | playground__basics-of-jsonb.txt | JSONB literals, jsonb_to_recordset, to_jsonb(row), -> vs ->>, JSONPath, `||` merge update, B-tree expression index vs GIN jsonb_path_ops + @@, "nothing is schema-less", JSON_TABLE (PG17+). |
| 2 | playground__basics-of-postgis.txt | PostGIS on NYC census data: ST_AsText, ST_Area, ST_Length, SRID 26918, ST_Intersects, ST_Contains spatial join, ST_Distance, ST_DWithin. (PostGIS not in PGlite; compact.) |
| 3 | playground__btree-indexes.txt | Weather events table: Seq Scan -> Bitmap Index Scan after CREATE INDEX; multicolumn index; PG18 skip scan note; INCLUDE covering index; pg_indexes. |
| 4 | playground__casting-data-types.txt | CAST vs ::, pg_typeof, 'unknown' literals, implicit casts ('12'+10 ok, '12.1'+10 fails), boolean input spellings, DateStyle MDY/DMY trap, date<->timestamp, interval math, last-day-of-month, cast that defeats an index. Page text truncated at the end. |
| 5 | playground__ctes-and-window-functions.txt | US births 2000-2014: build `births` via make_date, weekly roll-up with date_trunc, lag() inside a CTE, two-level CTE to find largest week-over-week change. |
| 6 | playground__custom-data-types-domains.txt | CHECKs in a table vs reusable DOMAINs (date_of_birth, valid_email), \dD, ALTER DOMAIN DROP/ADD CONSTRAINT, NOT VALID + VALIDATE CONSTRAINT. |
| 7 | playground__custom-data-types-user-defined.txt | CREATE TYPE 4 forms; composite physical_package + SQL function categorize_package; ENUM package_cat, ADD VALUE, cannot remove values; custom RANGE over interval, @> vs &&. |
| 8 | playground__high-level-performance-analytics.txt | Cache hit ratio (pg_statio_user_tables), % index usage (pg_stat_user_tables), index hit rate, the classic estimated-bloat query, last_vacuum/last_autovacuum. |
| 9 | playground__joins-in-postgres.txt | HR schema (departments, employees, dependents, locations): INNER, LEFT, RIGHT OUTER joins and self join for manager hierarchy, with sample outputs. |
| 10 | playground__lateral-join.txt | accounts/purchases: correlated subquery error -> LATERAL fix, implicit comma LATERAL, GROUP BY + MAX alternative, LATERAL jsonb_array_elements, LATERAL unnest(regexp_split_to_array) on CSV tags. |
| 11 | playground__learn-sql.txt | `regions` table: SELECT/FROM/WHERE/IN/AND/ORDER BY/LIMIT, ALTER TABLE ADD COLUMN, COMMENT ON COLUMN, UPDATE without WHERE ("UPDATE 4" oops), SUM, INSERT. |
| 12 | playground__materialized-views.txt | Ecommerce products/orders/product_orders: CREATE MATERIALIZED VIEW recent_product_sales, index it, join it, REFRESH, REFRESH CONCURRENTLY needs unique index. |
| 13 | playground__partitioning.txt | IoT thermostat: PARTITION BY RANGE(thetime), DEFAULT partition, 12 daily partitions, INSERT routing, DETACH ... CONCURRENTLY, rotate in new day, PG19 MERGE/SPLIT PARTITIONS (reference only). |
| 14 | playground__percentage-calculations.txt | 7 musicians in 2 bands: percent of total via CROSS JOIN vs sum() OVER (), percent of band via PARTITION BY, per-band share via subquery + window. |
| 15 | playground__postgres-constraints-tutorial.txt | Room reservations: FK add/drop, UNIQUE, UNIQUE NULLS NOT DISTINCT (PG15+), ON DELETE CASCADE, SET NOT NULL, three CHECKs on times, exclusion constraint using box/point + GiST, catalog query listing all constraints. |
| 16 | playground__postgres-date-functions.txt | orders table: interval filters, CASE buckets, date_trunc day/week/month/quarter, date_bin (PG14+), LAG month-over-month % change in CTE, to_char formats ('FMMonth YYYY', '"Q"Q-YYYY'), ROLLUP and CUBE. |
| 17 | playground__postgres-tutorial-create-tables.txt | guests/rooms/reservations built from scratch: column types, UNIQUE, identity PK (prefer BIGINT, prefer over SERIAL), \dt, \d+, duplicate-key error, RENAME COLUMN typo fix, FK, 3-table join. |
| 18 | playground__postgres-users-and-roles.txt | simon + accounting.invoices: LOGIN role, SET ROLE, permission denied for schema, GRANT CONNECT/USAGE/SELECT, REVOKE, NOLOGIN group role, ON ALL TABLES snapshot vs ALTER DEFAULT PRIVILEGES, pg_read_all_data etc., PG17 MAINTAIN/pg_maintain, connection URL. |
| 19 | playground__postgres-window-functions-for-data-analysis.txt | Ecommerce orders: running total, FIRST_VALUE/LAST_VALUE per customer, date_trunc CTE + RANK, LAG day-over-day, 7-row rolling AVG, NTILE(4) quartiles, with sample outputs. |
| 20 | playground__postgresql-for-kids.txt | Insect dataset for kids: \d, LIMIT, ILIKE, UPDATE a bug name, INSERT a fake bug, quoting "Order", joins on order tables, COUNT, SUM. |
| 21 | playground__psql-basics.txt | psql help (\? \h \l), \! shell, \d family, pager on/off, query buffer and \r, \timing, an UPDATE, \q. |
| 22 | playground__psql-echo-commands.txt | \set ECHO_HIDDEN on (-E) reveals catalog SQL behind \dt+ and \di; \set ECHO queries (-e); \set. |
| 23 | playground__query-performance-analytics.txt | pg_stat_statements setup, top queries by total_exec_time, avg, share-of-time window, shared_blks_dirtied, seq_scan - idx_scan "missing index" heuristic. |
| 24 | playground__row-level-security.txt | CRM contacts: GRANTs, ENABLE RLS = default deny, fixed-value policy, role-per-tenant policy, session-variable policy via current_setting, write checks on INSERT/UPDATE, per-command policies (DELETE 0). |
| 25 | playground__sql-tricks-for-crud.txt | customers/invoices/items: multi-row VALUES, data-modifying CTE with RETURNING, bulk generate with generate_series/arrays, JOIN USING, UPDATE ... FROM, PG18 RETURNING OLD/NEW, DELETE ... USING. |
| 26 | playground__strings-to-arrays.txt | weather_data CSV temps: string_to_array, cardinality, unnest in SELECT, max/min per station (text comparison bug), array_to_string. |
| 27 | playground__summaries-with-aggregate-filters-and-windows.txt | 10k-row random sales table: subquery vs 3-CTE vs CASE vs FILTER for percentages; FILTER with stddev and GROUP BY. |
| 28 | playground__tags-and-postgres-arrays.txt | Cats and tags: junction table with N self-joins vs int[] + GIN @> vs text[] + GIN; sizes (2424KB / 1040KB / 1224KB) and timings; caveats (no FK into arrays). |
| 29 | playground__transactions.txt | BEGIN/COMMIT/ROLLBACK with RETURNING, sequence gaps, COMMIT of aborted txn reports ROLLBACK, all-or-nothing multi-insert, transactional DDL, SAVEPOINT, txid_current(). |
| 30 | playground__using-filter-for-aggregation.txt | invoices (cents int, daterange period, status): monthly billed/uncollected/collected via 3 CTEs, CASE, FILTER. |
| 31 | playground__working-with-money-in-postgres.txt | money vs float vs integer cents vs numeric; float4 0.0001 x3 imprecision; products with currency CHECK; ROUND/CEIL/FLOOR, median via ROW_NUMBER, ::money and lc_monetary. |
| 32 | playground__working-with-time-in-postgres.txt | now(), AT TIME ZONE, epoch, to_char, train_schedule intervals and avg delay, OVERLAPS, tstzmultirange @> now(), B-tree vs BRIN on time, date_trunc roll-up. |

## Teaching material by topic

General pedagogical pattern (all Crunchy playgrounds): (1) a sentence of "why you care", (2) a pre-loaded realistic
dataset, (3) a baseline query the learner runs, (4) a deliberate failure or slow plan, (5) the fix, (6) re-run and
compare, (7) a catalog query to "see what you've got". Errors are used as teaching moments (operator does not exist,
invalid reference to FROM-clause entry, duplicate key, check violation). Each step is one copy-pasteable statement.

### SQL first steps: clauses as building blocks  [M1, M3]  (source: playground__learn-sql.txt)
- Angle: "SQL is just a statement with clauses appended." Start from `SELECT 1;` then `SELECT 'two';`, then add one
  clause at a time (FROM, WHERE, ORDER BY, LIMIT), each re-using the previous query. Explicitly says clause order is
  fixed. Breaks long statements "along the clauses" onto separate lines.
- Exercise sequence on table `regions(region_id, region_name)` (4 rows: Americas, Europe, Asia, Middle East and Africa):
  1. `SELECT regions.* FROM regions;` then `SELECT regions.region_name FROM regions;`
  2. `WHERE regions.region_id = 1`, then `< 2`, `> 2`, `>= 2`, `region_name IN ('Asia','Americas')`
  3. Combine with AND; add `ORDER BY regions.region_name` / `DESC`; add `LIMIT 1`.
  4. `ALTER TABLE regions ADD COLUMN region_population FLOAT DEFAULT NULL;`
     `COMMENT ON COLUMN regions.region_population IS 'population in billions';`
  5. `UPDATE ... SET region_population = 1.002 WHERE region_name = 'Americas';`
  6. Deliberate mistake: run the UPDATE without WHERE -> psql prints `UPDATE 4` ("we updated 4 ROWS! Uh oh"), then
     repair with four targeted UPDATEs (Americas 1.002, Middle East and Africa 0.493, Asia 4.561, Europe 0.7464).
  7. `SELECT sum(region_population) FROM regions [WHERE region_name IN (...)]`.
  8. `INSERT INTO regions (region_name, region_population) VALUES ('Australia', 0.02569);`
- Pitfall: UPDATE/DELETE without WHERE touches every row; the command tag row count is your alarm bell. (Good hook
  for a later "wrap it in BEGIN ... ROLLBACK" lesson.)

### Creating tables, identity keys, FKs  [M1, M2]  (source: playground__postgres-tutorial-create-tables.txt)
- Angle: tables as a filing cabinet with folders (rows). "Golden rule: pick the right datatype" - no TEXT for dates,
  no TEXT for prices (use NUMERIC).
- Exercise sequence (room reservation system, built from nothing):
  1. `CREATE TABLE guests ();` (empty table is legal) -> `DROP TABLE guests;`
  2. `CREATE TABLE guests (name TEXT, email TEXT UNIQUE);` -> drop again.
  3. Final: `CREATE TABLE guests (guest_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name TEXT, email TEXT UNIQUE);`
  4. `\dt`, `\d+ guests`
  5. Insert Simon/Bob/Patrick; re-insert Simon ->
     `ERROR: duplicate key value violates unique constraint "guests_email_key"` / `DETAIL: Key (email)=(simon@email.com) already exists.`
     (shows the auto-generated constraint name pattern `<table>_<col>_key`).
  6. `CREATE TABLE rooms (room_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, rom_number INT UNIQUE);` - a
     deliberate typo, fixed with `ALTER TABLE rooms RENAME COLUMN rom_number TO room_number;` (teaches ALTER vs drop).
  7. Rooms 101..501; reservations(guest_id BIGINT REFERENCES guests, room_id BIGINT REFERENCES rooms, start_time
     TIMESTAMP, end_time TIMESTAMP, event_title TEXT); four reservations; 3-way INNER JOIN filtered by email.
- Tips: identity is SQL standard, uses a sequence under the hood; GENERATED ALWAYS blocks accidental manual key inserts;
  prefer it over SERIAL. Prefer BIGINT for identity: INT tops out ~2.1 billion; on 64-bit layouts alignment padding
  often makes INT's saving zero (good M2 tie-in: demonstrate with pg_column_size / pageinspect tuple widths).

### Constraints: FK, UNIQUE, CASCADE, NOT NULL, CHECK, EXCLUDE  [M1, M2, M4]  (source: playground__postgres-constraints-tutorial.txt)
- Angle: constraints are the database catching what application code forgot. Same reservations schema as the
  create-tables tutorial (users, rooms, reservations), created with NO constraints first, then hardened step by step.
- Exercise sequence:
  1. `users(id BIGINT IDENTITY PK, name, email)`, `rooms(id BIGINT IDENTITY PK, number text)`,
     `reservations(user_id int references users(id), room_id int references rooms(id), start_time timestamp,
     end_time timestamp, event_title text)`.
  2. Drop the auto-named FKs `reservations_user_id_fkey` / `reservations_room_id_fkey`; re-add via
     `ALTER TABLE ... ADD CONSTRAINT reservations_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id);`
  3. `ALTER TABLE ONLY public.rooms ADD CONSTRAINT room_number_unique UNIQUE (number);`
  4. `ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE NULLS NOT DISTINCT (email);` (PG15+; default treats
     NULLs as distinct so many NULLs allowed).
  5. Replace user FK with `... REFERENCES public.users(id) ON DELETE CASCADE;` - GDPR deletion use case. Without
     cascade, deleting a referenced user errors until child rows are gone.
  6. `ALTER TABLE public.reservations ALTER COLUMN start_time SET NOT NULL;` (and end_time).
  7. CHECKs: `start_before_end CHECK (start_time < end_time)`;
     `daytime_check CHECK (start_time::time >= '08:00:00' AND end_time::time <= '17:00:00')`;
     `interval_check CHECK (end_time - start_time >= interval '30 minutes')`.
  8. Exclusion via geometry trick: `EXCLUDE USING GIST (box(point(extract(epoch from start_time), room_id),
     point(extract(epoch from end_time) - 0.5, room_id + 0.5)) WITH &&)` - each reservation becomes a rectangle in
     (time, room) space; overlapping rectangles are rejected. The 0.5 shrink keeps back-to-back bookings and adjacent
     rooms from "touching". The constraint creates its GiST index automatically.
  9. Catalog query: pg_constraint (+ pg_get_constraintdef) UNION information_schema.columns is_nullable='NO'.
- Analogy worth reusing: "a box that is either filled in or not" for exclusion constraints.
- Pitfalls: you cannot edit an FK/CHECK in place - drop and re-add (they do this). FK column `int` referencing a
  `bigint` PK works but is a type mismatch (fix: same type both sides).
- Modern rewrite for our lessons (PG18, needs btree_gist which PGlite has):
  ```sql
  CREATE EXTENSION IF NOT EXISTS btree_gist;
  ALTER TABLE reservations ADD CONSTRAINT no_double_booking
    EXCLUDE USING gist (room_id WITH =, tsrange(start_time, end_time) WITH &&);
  ```
  `[)` default bounds make back-to-back bookings legal with no 0.5 fudge. See Discrepancies for PG18 temporal keys.

### Data types and casting  [M2, M3, M4]  (source: playground__casting-data-types.txt)
- Angle: SQL is strongly typed; the frustrating errors `operator does not exist: integer ~~ unknown` and
  `function repeat(integer, unknown) does not exist` are type errors. pg_typeof() is the flashlight.
- Exercise sequence:
  1. "Some may work, some may not": `cast('1' as integer)` ok; `cast('10000000000' as integer)` -> out of range;
     `as bigint` ok; `cast('abc' as integer)` -> invalid input syntax; `cast('1' as text)`; `cast('true' as boolean)`.
  2. `select pg_typeof(1);` -> integer; `select pg_typeof('abc'), pg_typeof(cast('abc' as text));` -> unknown, text.
  3. Implicit casts: `select '12'+10;` -> 22 (unknown literal resolved to integer); `select '12.1'+10;` -> error
     (invalid input syntax for type integer); fix `'12.1'+cast(10 as numeric)` -> 22.1. Advice: avoid implicit casts.
  4. Boolean inputs via a VALUES CTE: `('tRUe'),('F'),('on'),('of'),('ye'),(NULL)` -> `test::boolean`. Claimed
     accepted prefixes: t/tr/tru/true, y/ye/yes, on; f/fa/fal/fals/false, n/no, of/off; case-insensitive. Integer 0 ->
     false, nonzero -> true. NULL casts to NULL; the string 'null' is not NULL.
  5. Build `births_cast(id BIGINT IDENTITY, day date, births int)` from `US_births_20002014_SSA` via
     `make_date(year, month, date_of_month)`.
  6. `where day = cast('2001-06-10' as date)` == `'2001-06-10'::date` == `'2001-06-10'` (implicit). `::` may need
     escaping in some client languages -> use CAST().
  7. DateStyle trap: `show datestyle;` -> `ISO, MDY`; `'06/10/2001'` = June 10. `set datestyle to 'ISO, DMY';` ->
     same literal now means 6 October. Lesson: always use ISO `YYYY-MM-DD`.
  8. timestamp->date drops time; date->timestamp adds 00:00:00:
     `select current_timestamp, current_timestamp::date, current_date, localtimestamp, localtimestamp::date;`
     `select current_date::timestamp, current_date::timestamptz;`
  9. Intervals: `current_timestamp + '90 days 10 minutes 10 seconds'::interval`; `current_date + ...` starts at 00:00.
  10. Last day of month: `(date_trunc('month', current_date + '1 month'::interval) - '1 day'::interval)::date`.
  11. Index vs cast: `create index on births_cast (births);` then
      `explain select count(*) from births_cast where births = 7674;` (bitmap index scan) vs
      `... where births = 7674::numeric;` (seq scan - the int column is cast to numeric, index unusable).
      Fixes: change the column type, or an expression index on the conversion (text cut off here).
- Great M4 demo: cross-type comparison silently disables an index.

### JSONB basics, operators, JSONPath, indexing  [M2, M3, M4]  (source: playground__basics-of-jsonb.txt)
- Angle: JSONB = binary, slower to write, faster to query; JSON = exact text copy. "Nothing is ever schema-less" -
  the only question is which layer enforces the structure (DB for tables, app for JSON).
- Exercise sequence (pre-loaded `employees` table with `systems_access jsonb` = `{"crm": <epoch float>, "helpdesk":
  <epoch>, "admin_panel": null}` and an addresses jsonb array):
  1. Literals: `'{"name":"batman","superpower":"fighting skills"}'::jsonb`, top-level array `'["batman","superman"]'`,
     array of objects.
  2. `SELECT * FROM jsonb_to_recordset('[{"name":"batman"},{"name":"superman"}]'::jsonb) AS x(name TEXT);`
  3. Row -> JSON: `SELECT to_jsonb(employees) FROM employees LIMIT 5;`; column subset via subquery alias
     `to_jsonb(truncated_employees) FROM (SELECT first_name, last_name FROM employees LIMIT 10) AS truncated_employees`.
  4. Operators: `->'name'`; `('[...]'::jsonb)[0]->>'name'` (PG14+ subscripting); `('["batman","superman"]'::jsonb)->>0`.
  5. JSONPath: `jsonb_path_query(doc, '$.name')`, `'$[0].name'`, and on an array `'$.name'` (lax mode auto-unwraps
     arrays -> returns both names).
  6. `ALTER TABLE employees ADD COLUMN my_new_json_column JSONB DEFAULT NULL;` and an INSERT with a JSON literal.
  7. `systems_access->'crm'` vs `->>'helpdesk'`; `pg_typeof` shows jsonb vs text.
  8. Deliberate error: `WHERE systems_access->>'crm' > EXTRACT('epoch' FROM now() - '7 day'::interval)` ->
     `ERROR: operator does not exist: text > numeric`. Fix: `(systems_access->>'crm')::float > ...`. Then
     `(systems_access->>'crm') IS NULL` finds never-accessed (JSON null and missing key both give SQL NULL via ->>).
  9. Update whole doc vs merge: `systems_access = systems_access || jsonb_build_object('admin_panel', extract(epoch from now()))`
     - `||` right side wins on key conflict. Note: Postgres still rewrites the whole value (new tuple version).
  10. B-tree expression index: `CREATE INDEX employees_systems_access_crm ON employees USING BTREE (((systems_access->>'crm')::float));`
      EXPLAIN with `> extract('epoch' FROM now() - '3 day'::interval)` shows Index Cond; run `ANALYZE employees;` if not.
      Widen to 10 days -> planner reverts to Seq Scan (statistics/selectivity lesson on tiny tables).
  11. GIN: `CREATE INDEX employees_systems_access ON employees USING GIN ((systems_access) jsonb_path_ops);`
      query: `WHERE systems_access @@ ('$.helpdesk > ' || extract('epoch' FROM now() - '3 day'::interval)::text)::jsonpath;`
      `WHERE systems_access->>'helpdesk' = '1'` does NOT use the GIN index (operator not in opclass).
  12. JSON_TABLE (PG17+) with `'$[*]' COLUMNS (name text PATH '$.name', city text PATH '$.city')`.
- Why epoch floats, not dates, in the JSON: casting text to date/timestamp is not IMMUTABLE so it cannot be used in an
  index expression (true - the cast depends on DateStyle/TimeZone). Excellent pitfall to reuse.
- Design discussion: nested `{"home": {...}}` vs array of addresses - keyed-by-type objects are harder to index
  because the key is data.
- Pitfall list: ->> returns text, cast before comparing; text comparison of numbers gives wrong order; GIN only helps
  operators in its opclass (jsonb_path_ops: @>, @?, @@); small tables make the planner ignore indexes.

### B-Tree indexes  [M4]  (source: playground__btree-indexes.txt)
- Angle: "No yardwork required!" An index means the database "already knows where to look". Every step is an
  EXPLAIN (ANALYZE, BUFFERS) before/after pair - the learner sees the plan shape change, not just the time.
- Dataset: `weather` (~1200 rows of NOAA storm events: event_id, event_type, damage_crops (text!), begin_date_time,
  location...). 11 rows are 'Winter Storm'.
- Exercise sequence and expected plans:
  1. Baseline: `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM weather WHERE event_type = 'Winter Storm';` ->
     `Seq Scan on weather (cost=0.00..103.75 rows=2 width=2210) (actual ... rows=11 loops=1)`,
     `Filter: ((event_type)::text = 'Winter Storm'::text)`, `Rows Removed by Filter: 1189`.
  2. `CREATE INDEX idx_weather_type ON weather(event_type);` -> re-run -> `Bitmap Heap Scan` with `Recheck Cond`,
     `Heap Blocks: exact=6`, child `Bitmap Index Scan on idx_weather_type`, `Index Cond`.
  3. `DROP INDEX idx_weather_type;` then two-predicate query `event_type = 'Winter Storm' AND damage_crops > '0'`
     -> Seq Scan, Filter with both predicates.
  4. `CREATE INDEX idx_storm_crop ON weather(event_type, damage_crops);` -> Bitmap Index Scan with both conditions in
     Index Cond.
  5. Column order matters; PG18 skip scan helps when the leading column is omitted (equality on later keys), but lead
     with the most-filtered column.
  6. Covering: `CREATE INDEX idx_storm_crop_covering ON weather (event_type, damage_crops) INCLUDE (event_id, begin_date_time);`
     keep INCLUDE short (wider index, slower writes). The tutorial says to add an "IO" EXPLAIN option on PG18+ -
     PG18 has no such option (see Discrepancies); in PG18 BUFFERS is included automatically with ANALYZE.
     Index-only scan also needs the VM all-visible bits -> run VACUUM first, else "Heap Fetches" stays high.
  7. `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'weather';`
- Note: damage_crops is text, so `> '0'` is a string comparison (`'10K' > '0'` lexically) - a hidden casting pitfall
  worth calling out if we reuse this dataset.
- Why Bitmap Heap Scan and not Index Scan: 11 matching rows over 6 heap pages - bitmap batches page visits. Good hook
  for a visualizer of bitmap -> sorted page fetch.

### Multicolumn/expression index after casting  [M4]
- See casting step 11 and JSONB step 10: the index must match the expression and the type exactly.

### CTEs + window functions on US births  [M3]  (source: playground__ctes-and-window-functions.txt)
- Dataset: `US_births_20002014_SSA(year, month, date_of_month, day_of_week, births)` (public SSA data, 5479 days).
- Exercise sequence:
  1. `CREATE TABLE births (id BIGINT GENERATED ALWAYS AS IDENTITY, day date, births int);`
     `INSERT INTO births (day, births) SELECT make_date(year, month, date_of_month), births FROM US_births_20002014_SSA;`
  2. Weekly roll-up: `SELECT date_trunc('week', day) week, sum(births) births FROM births GROUP BY 1 ORDER BY week DESC;`
  3. CTE `weekly_births` + `lag(births, 1) OVER (ORDER BY week DESC) prev_births`.
  4. Second CTE layer `weekly_with_prev`, then
     `WHERE prev_births IS NOT NULL AND week >= '2000-01-01' ORDER BY abs(births - prev_births) DESC LIMIT 1;`
- Angle: CTE = name the pieces; window = compare a row with its neighbour without collapsing rows. Note: with ORDER BY
  week DESC, lag() returns the *following* calendar week - a subtle direction gotcha worth a quiz question.
- Note: the sample output shows weeks in scrambled order despite ORDER BY week DESC (doc artifact). date_trunc('week')
  on a date returns timestamptz (Monday 00:00 in session TimeZone).

### Domains  [M2, M1]  (source: playground__custom-data-types-domains.txt)
- Angle: push validation into the DB so it survives app rewrites and direct DB access; domains are CHECKs you define
  once and reuse, so changing "what a zipcode is" happens in one place.
- Exercise sequence:
  1. `create table person_using_checks (id bigint generated always as identity primary key, firstname text not null,
     lastname text not null, birth_date date, email text not null, check (birth_date > '1930-01-01'::date),
     check (email ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'));`
  2. Insert John Doe 1970 (ok), George Washington 1732 (check violation), Starman with email 'unknown' (violation).
  3. `create domain date_of_birth as date check (value > '1930-01-01'::date);`
     `create domain valid_email as text not null check (value ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');`
     (`~*` = case-insensitive regex). `\dD` lists domains.
  4. `person_using_domains` uses the domains as column types; same 3 inserts -> errors now name the domain constraint
     (`value for domain date_of_birth violates check constraint "date_of_birth_check"`).
  5. Requirement change to "born after 1980": `alter domain date_of_birth drop constraint date_of_birth_check;`,
     `\dD date_of_birth`; `alter domain date_of_birth add check (value > '1980-01-01'::date);` fails (John is 1970);
     `... add check (...) not valid;` succeeds; `alter domain date_of_birth validate constraint date_of_birth_check;`
     fails again - but it does not tell you which rows; find them with a WHERE yourself.
- Pitfall: NOT VALID only skips checking existing rows; new rows are checked immediately.

### User-defined types: composite, enum, range  [M2, M6]  (source: playground__custom-data-types-user-defined.txt)
- Four forms of CREATE TYPE: composite, enum, range, base (C-level, superuser only, "could confuse or even crash the
  server" - not covered).
- Exercise sequence (parcel delivery story):
  1. `create type physical_package as (height numeric, width numeric, weight numeric);`
     `create table packages (id bigint generated always as identity primary key, properties physical_package);`
     insert 6 rows with `'(10.3,4.0,0.5)'::physical_package` row literals.
  2. Field access needs parentheses: `select id, (properties).weight from packages;` (else parser thinks properties is
     a table).
  3. SQL function `categorize_package(p physical_package) returns text`: box if height>10 or width>13 or weight>18,
     else letter. Use in SELECT list, GROUP BY 1, and WHERE.
  4. `create type package_cat as enum ('box','letter');` drop and recreate the function returning package_cat (cast
     'box'::package_cat).
  5. `alter type package_cat add value 'postcard';` - values cannot be removed; workaround: rename old type, create
     new, ALTER TABLE ... ALTER COLUMN ... TYPE new, drop old. `\dT+ package_cat` shows Elements.
  6. `packages_with_category` NOT NULL composite + enum; inserting `'stuff'::package_cat` fails.
  7. `create type delay as range (subtype = interval);` table `packages_with_delay(..., acceptable_delay delay not null)`
     values like `'[3 hours,3 days]'`, `'[3 days, 1 month]'`.
  8. `acceptable_delay @> '[1 day,2 day]'::delay` (contains) vs `&& '[6 days,1 month]'` (overlaps) - "compare those
     two results carefully".
- Advice: enum for short stable lists (>10 values -> lookup table + FK); composites shine as function params/returns;
  custom ranges rarely needed.
- Expected: categorize results - (10.3,4,0.5) box, (5,3,0.2) letter, (100,200,400) box, (4,10,50) box, (12,10,100)
  box, (3.5,5,3.5) letter.

### High-level performance analysis (cache hit, index usage, bloat, vacuum)  [M4, M7, M1]  (source: playground__high-level-performance-analytics.txt)
- Angle: three numbers a dev should know - cache hit ratio, index usage %, bloat. Analogy: 100 hits + 2 misses ->
  100/102 = 98%.
- Queries:
  ```sql
  SELECT sum(heap_blks_read) AS heap_read, sum(heap_blks_hit) AS heap_hit,
         sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS ratio
  FROM pg_statio_user_tables;                        -- target ~99%
  SELECT relname, 100 * idx_scan / (seq_scan + idx_scan) percent_of_times_index_used, n_live_tup rows_in_table
  FROM pg_stat_user_tables WHERE seq_scan + idx_scan > 0 ORDER BY n_live_tup DESC;   -- want 99%+ on >10k-row tables
  SELECT sum(idx_blks_read) AS idx_read, sum(idx_blks_hit) AS idx_hit,
         (sum(idx_blks_hit) - sum(idx_blks_read)) / sum(idx_blks_hit) AS ratio
  FROM pg_statio_user_indexes;
  SELECT relname, last_vacuum, last_autovacuum FROM pg_stat_user_tables;
  ```
- Plus the classic "estimated bloat" query (pg_stats avg_width/null_frac, block_size, hdr 23, ma 4, otta = expected
  pages; outputs tbloat, wastedbytes, ibloat, wastedibytes).
- Tips: CREATE INDEX CONCURRENTLY avoids blocking writes; maintenance_work_mem default 64MB, raise for big index
  builds; VACUUM makes space reusable but does not shrink files.
- Pitfalls: in PGlite "hits" are against shared_buffers of a single in-browser instance, so ratios will be ~100% and
  boring; better to show pg_buffercache directly. idx hit formula is non-standard (see Discrepancies). Ratio queries
  divide by zero on a fresh DB (no reads yet) - wrap with NULLIF.

### Joins (inner, outer, self)  [M3]  (source: playground__joins-in-postgres.txt)
- Angle: tables are sets; a join finds information in one set that matches another; NULL fills the side with no match.
- HR dataset: locations(location_id, street_address, postal_code, city, state_province, country_id),
  departments(department_id, department_name, location_id), employees(employee_id, first_name, last_name, start_date,
  job_title, salary, manager_id -> employees, department_id), dependents(dependent_id, first_name, last_name,
  employee_id). 8 employees with joke names (John Smith President, Pointy HairedBoss CTO, Dilbertzoni DeScrewed, Vanda
  Socialist, Howard TheDuck, Luke Fett, John SkipWork, Lea Palpatine).
- Sequence: INNER employees-departments; add LEFT OUTER dependents (John Smith has 2 -> appears twice; Howard has none ->
  NULL dependent); RIGHT OUTER departments-locations (Lehi, Utah office has no department -> NULL department_name);
  self join `employees e LEFT OUTER JOIN employees m ON e.manager_id = m.employee_id` with
  `format('%s %s', m.first_name, m.last_name)` (president has no manager -> LEFT join needed).
- Pitfall surfaced by the data: joining a 1-to-many child multiplies parent rows (John Smith x2).
- Gotcha: `format('%s %s', NULL, NULL)` returns ' ' (a space), not NULL - unlike `||`, which yields NULL.

### LATERAL  [M3, M4]  (source: playground__lateral-join.txt)
- Angle: start with the error you'd naturally hit:
  `ERROR: invalid reference to FROM-clause entry for table "accounts"` / `HINT: There is an entry for table "accounts",
  but it cannot be referenced from this part of the query.` Then add one word, LATERAL, and it works.
- Sequence (accounts(id, name, addresses jsonb array), purchases(id, account_id, name, created_at, tags text CSV)):
  1. Failing `INNER JOIN (SELECT * FROM purchases WHERE account_id = accounts.id ORDER BY created_at DESC LIMIT 1) AS last_purchase ON true`.
  2. Same with `INNER JOIN LATERAL (...) ON true` - latest purchase per account (top-1-per-group).
  3. Implicit form: `FROM accounts, LATERAL (...) AS last_purchase`.
  4. Alternative: CTE with `GROUP BY account_id, MAX(created_at)` joined back on (account_id, created_at).
  5. `FROM accounts, LATERAL jsonb_array_elements(accounts.addresses) AS address_elements WHERE address_elements.value->>'state' = 'California'`.
  6. `JOIN LATERAL unnest(REGEXP_SPLIT_TO_ARRAY(purchases.tags, E',')) AS unnested_tags(tag) ON true WHERE tag = 'electronics'`;
     count per tag with GROUP BY.
- Mental model: LATERAL runs the subquery once per outer row (a for-each loop / nested loop).
- Pitfalls: they claim GROUP BY is faster at scale - true without an index, but with an index on
  (account_id, created_at DESC) LATERAL + LIMIT 1 is often the fastest top-N-per-group plan (nested loop + index scan,
  reads 1 row per account). The GROUP BY/MAX join-back returns duplicates if two purchases tie on created_at. Use
  `LEFT JOIN LATERAL ... ON true` to keep accounts with no purchases (INNER drops them). Set-returning functions in
  FROM are implicitly LATERAL; the keyword is optional there.

### Materialized views  [M6]  (source: playground__materialized-views.txt)
- Angle: a saved query stored as a table; pros (precomputed speed, simpler queries), cons (static until refreshed,
  extra disk). Ideal when you need summaries and not real-time data (counter-example: banking).
- Dataset: products(sku, name, price, sale_price,...), orders(order_id, status,...), product_orders(order_id, sku, qty).
- Sequence:
  1. Peek at each table with LIMIT 10.
  2. `CREATE MATERIALIZED VIEW recent_product_sales AS SELECT p.sku, SUM(po.qty) AS total_quantity FROM products p
     JOIN product_orders po ON p.sku = po.sku JOIN orders o ON po.order_id = o.order_id WHERE o.status = 'Shipped'
     GROUP BY p.sku ORDER BY 2 DESC;`
  3. `CREATE INDEX sku_qty ON recent_product_sales(total_quantity);`
  4. Query it, `LIMIT 10`, LEFT JOIN products with COALESCE(total_quantity, 0).
  5. `REFRESH MATERIALIZED VIEW recent_product_sales;` (blocks concurrent SELECTs: ACCESS EXCLUSIVE).
  6. `CREATE UNIQUE INDEX recent_product_sales_sku_uidx ON recent_product_sales (sku);`
     `REFRESH MATERIALIZED VIEW CONCURRENTLY recent_product_sales;`
- Pitfalls: "top 10 via `SELECT sku FROM mv LIMIT 10`" relies on the ORDER BY inside the view definition - physical
  order is not guaranteed after refresh/updates; always ORDER BY in the outer query. CONCURRENTLY requires a unique
  index on plain columns covering all rows, and cannot run on a never-populated (WITH NO DATA) view. Add a
  demonstration: insert a new shipped order, query MV (stale), refresh, query again.

### Partitioning (range, default, detach, rotate)  [M7, M4]  (source: playground__partitioning.txt)
- Angle: partition for lifecycle management first (cheap drop/detach of old data), treat query speed as a bonus when
  filters hit the partition key. Types: range (time/integers), list (location/tenant), hash (only when no natural
  pattern), composite.
- Dataset: `thermostat(thetime timestamptz, sensor_id int, current_temperature numeric(3,1), thermostat_status text)`
  for 2022-07-23 .. 2022-08-03 (IoT readings).
- Sequence:
  1. `SELECT * FROM thermostat LIMIT 10;`
  2. `CREATE TABLE iot_thermostat (thetime timestamptz, sensor_id int, current_temperature numeric(3,1), thermostat_status text) PARTITION BY RANGE (thetime);`
  3. `CREATE INDEX ON iot_thermostat(thetime);` (propagates to every partition)
  4. `CREATE TABLE iot_thermostat_default PARTITION OF iot_thermostat DEFAULT;` (safety net; keep empty)
  5. 12 daily partitions `iot_thermostatMMDDYYYY ... FOR VALUES FROM ('2022-07-23 00:00:000') TO ('2022-07-24 00:00:000')`
     (upper bound exclusive). Note the typo `iot_thermosta07312022` in the source.
  6. `INSERT INTO iot_thermostat SELECT * FROM thermostat;` - tuple routing puts rows in the right child.
  7. `SELECT * FROM iot_thermostat07242022 LIMIT 10;`
  8. `ALTER TABLE iot_thermostat DETACH PARTITION iot_thermostat07232022 CONCURRENTLY;` -> standalone table to archive/drop.
  9. `CREATE TABLE iot_thermostat08042022 PARTITION OF iot_thermostat FOR VALUES FROM ('2022-08-04 00:00:000') TO ('2022-08-05 00:00:000');`
  10. Automate with cron or pg_partman. PG19 MERGE PARTITIONS / SPLIT PARTITION shown "for reference only".
- Notes: PG17+ identity columns on partitioned parents; unique/PK on parent must include partition key.
- BUG in the tutorial flow: step 4 creates a DEFAULT partition, and the docs say DETACH ... CONCURRENTLY "cannot be
  run in a transaction block and is not allowed if the partitioned table contains a default partition" - so step 8
  errors as written. Our lesson: either skip the default partition, or detach without CONCURRENTLY. Also, if the
  default partition holds rows that belong to a newly created range, CREATE ... PARTITION OF fails (default is scanned).
- Lesson additions: `EXPLAIN SELECT ... WHERE thetime >= '2022-07-25' AND thetime < '2022-07-26'` to show pruning
  (only one partition in plan); `SELECT tableoid::regclass, count(*) FROM iot_thermostat GROUP BY 1;` to show routing.

### Percentages in one pass with window aggregates  [M3]  (source: playground__percentage-calculations.txt)
- Angle: "olden days" CROSS JOIN to a total subquery vs `sum() OVER ()`; then change only the denominator's window
  (`OVER (PARTITION BY band)`) to switch from share-of-total to share-of-band.
- Seed (complete, reusable - see schemas): 7 musicians, bands PPM and CSNY.
- Queries:
  - `round(100 * earnings / sum(earnings) OVER (), 1) AS percent` (share of all 20.8).
  - `round(100 * earnings / sum(earnings) OVER (PARTITION BY band), 1)` (share within band).
  - Per-band share of total: aggregate in a subquery, then `sum(earnings) OVER ()` outside - "window inside an
    aggregate is not allowed", but EXPLAIN still shows a single scan of the base table.
- Expected (share of total, total=20.8): Nash 1.4, Mary 5.3, Paul 10.6, Young 10.6, Crosby 20.2, Peter 21.6,
  Stills 30.3. Band totals: PPM 7.8 (37.5%), CSNY 13.0 (62.5%). Within band: Paul 28.2, Peter 57.7, Mary 14.1;
  Crosby 32.3, Stills 48.5, Nash 2.3, Young 16.9.
- Note: `SELECT sum(...) OVER () ... GROUP BY band` IS legal in one query (window over grouped rows:
  `sum(sum(earnings)) OVER ()`); the subquery is a readability choice. Nice "aha" extension.

### Date roll-ups: interval, date_trunc, date_bin, to_char, ROLLUP, CUBE  [M3]  (source: playground__postgres-date-functions.txt)
- Dataset: `orders(order_id, order_date timestamptz, total_amount numeric, category text)` - categories Books,
  Clothing, Computers, Electronics; ~5432 rows spanning 2021-10 .. 2024-10 (sample outputs are inconsistent across
  sections - generated relative to now()).
- Sequence:
  1. `WHERE order_date >= NOW() - INTERVAL '90 days'` and the `'90 days'::interval` spelling.
  2. CASE buckets '30-60 days ago' / '60-90 days ago' with BETWEEN; GROUP BY date_range.
  3. `date_trunc('month', order_date)` + COUNT/SUM, then day, week (Mondays), quarter (Jan 1/Apr 1/Jul 1/Oct 1).
  4. `date_bin('15 minutes', order_date, TIMESTAMPTZ '2024-01-01')` for fixed-width buckets (PG14+).
  5. CTE monthly_sales (last 6 months) -> LAG month-over-month change and percentage change.
  6. `to_char(date_trunc('month', order_date), 'FMMonth YYYY')` -> 'August 2024'; `TO_CHAR(NOW()::DATE, 'Mon dd, yyyy')`;
     `'"Q"Q-YYYY'` -> 'Q3-2024'.
  7. `GROUP BY ROLLUP (date_trunc('month', order_date), category)` -> per month+category, month subtotal row with NULL
     category; `CUBE` adds per-category totals across all months and a grand total.
- Pitfalls: BETWEEN is inclusive on both ends, so an order exactly 60 days ago lands in both buckets' predicates (CASE
  picks the first). Repeating LAG(...) four times - define a WINDOW clause or compute lag once in a CTE. ROLLUP/CUBE
  subtotal NULLs are indistinguishable from real NULL categories -> use GROUPING(category). "CTE lets PostgreSQL
  calculate once and reuse" is only true for MATERIALIZED CTEs; since PG12 a single-reference CTE is inlined.
  ORDER BY inside a CTE is pointless for the outer result. FM prefix suppresses padding of month names.

### Roles, privileges, group roles, default privileges  [M1, M6]  (source: playground__postgres-users-and-roles.txt)
- Angle: a role is either a person or a group (think job description: accountant, sales). Roles are cluster-global,
  not per-database. "Postgres used to have groups and users, now it is roles within roles." Principle of least privilege.
- Exercise sequence:
  1. `\du`
  2. `CREATE DATABASE finance; CREATE SCHEMA accounting; CREATE TABLE accounting.invoices(invoice_id BIGINT GENERATED
     ALWAYS AS IDENTITY PRIMARY KEY, invoice_date DATE, amount NUMERIC);` + 3 rows (2024-03-15 250.50, 2024-01-20
     110.99, 2024-03-29 1000).
  3. `CREATE ROLE simon WITH PASSWORD '...' LOGIN;` -> `SET ROLE simon;` -> `SELECT * FROM accounting.invoices;` ->
     `ERROR: permission denied for schema accounting` (the schema USAGE gate comes before the table gate).
  4. `SET ROLE postgres;` `GRANT CONNECT ON DATABASE finance TO simon; GRANT USAGE ON SCHEMA accounting TO simon;
     GRANT SELECT ON accounting.invoices TO simon;` then `GRANT INSERT, UPDATE, DELETE ...`; back to simon -> works.
  5. REVOKE mirror: replace GRANT/TO with REVOKE/FROM.
  6. Group: `CREATE ROLE accounting_ro NOLOGIN;` + CONNECT, USAGE, `GRANT SELECT ON ALL TABLES IN SCHEMA accounting
     TO accounting_ro;` `GRANT accounting_ro TO simon;` `\du` shows membership.
  7. Create `accounting.customers` afterwards -> simon gets `permission denied for table customers` because ON ALL
     TABLES is a one-time snapshot. Re-run the grant, then
     `ALTER DEFAULT PRIVILEGES IN SCHEMA accounting GRANT SELECT ON TABLES TO accounting_ro;` for future tables.
  8. Predefined roles: pg_read_all_data, pg_write_all_data, pg_monitor; `GRANT pg_read_all_data TO accounting_ro;`
     PG17 MAINTAIN privilege + pg_maintain role (VACUUM, ANALYZE, REINDEX, REFRESH MATERIALIZED VIEW, etc.).
  9. Connection string anatomy: postgres://user:password@host:5432/dbname.
- Pitfalls: the tutorial never connects to `finance` (`\c finance`) so the schema lands in the current DB; the
  CONNECT grant is then irrelevant to the demo. ALTER DEFAULT PRIVILEGES only applies to objects created later BY
  the role that ran it (or FOR ROLE x) - a common surprise. Role names are folded to lower case unless quoted.
- PGlite: SET ROLE works (we are superuser); CREATE DATABASE is not useful in PGlite (single db) - drop that step.

### Row Level Security (multi-tenant CRM)  [M6, M1]  (source: playground__row-level-security.txt)
- Angle: RLS "appends a WHERE clause" to every query: `SELECT * FROM contacts` becomes `... WHERE foo = 'bar'`, and
  INSERTs are forced to carry the policy values. Two scenarios: one DB login per user, then app with session variable.
- Dataset: CRM - accounts(id, name...), contacts(id, name, email, account_id, created_at, updated_at), opportunities,
  users, team.
- Exercise sequence:
  1. `CREATE ROLE appuser LOGIN; \x`, `SET ROLE appuser;` -> `SELECT * FROM contacts;` permission denied.
  2. `SET ROLE postgres; GRANT SELECT ON TABLE contacts TO appuser; SET ROLE appuser;` then
     `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO appuser;` (+ ALL SEQUENCES) -> appuser sees every row.
  3. `ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;` -> appuser sees 0 rows (default deny, no policy).
  4. `CREATE POLICY appuser_contacts_policy ON contacts FOR ALL TO appuser USING (account_id = 1);` -> sees account 1.
     `accounts LEFT JOIN contacts ... WHERE accounts.id = 2` returns the account row with NULL contacts (RLS filters
     only the protected table; accounts has no RLS).
  5. Role-per-tenant: `CREATE ROLE account_2; CREATE POLICY ... TO account_2 USING (account_id = 2);` grants,
     `GRANT account_2 TO appuser;` `SET ROLE account_2;` query; `SET ROLE appuser;`.
  6. Session variable policy: `USING (account_id = NULLIF(current_setting('rls.account_id', false), '')::integer)`;
     `SET rls.account_id = 1; SELECT * FROM contacts;` then `= 2`.
  7. FOR ALL also checks writes: INSERT with account_id 2 under rls.account_id=2 succeeds (RETURNING id, account_id);
     INSERT 'Joker' with account_id 1 -> `new row violates row-level security policy for table "contacts"`; UPDATE
     SET account_id = 1 fails the same way.
  8. Per-command policies for SELECT, UPDATE, INSERT but not DELETE -> `DELETE FROM contacts;` returns `DELETE 0`
     (no error - rows are simply invisible to DELETE).
- Pitfalls (several are bugs in the tutorial text):
  - `CREATE POLICY ... FOR INSERT ... USING (...)` is rejected: INSERT policies accept only WITH CHECK
    (`only WITH CHECK expression allowed for INSERT`). Correct: `FOR INSERT TO appuser WITH CHECK (...)`.
  - For FOR ALL / FOR UPDATE with only USING, the USING expression is also used as the WITH CHECK for new rows - that
    is why step 7 errors. Spell out WITH CHECK explicitly in lessons.
  - `current_setting('rls.account_id', false)` raises `unrecognized configuration parameter` if never set in the
    session; use `current_setting('rls.account_id', true)` (missing_ok) so an unset tenant yields NULL -> 0 rows.
  - Superusers, BYPASSRLS roles and the table OWNER bypass RLS (owner unless `ALTER TABLE ... FORCE ROW LEVEL SECURITY`).
    The playground works only because appuser is not the owner.
  - The session variable is not a security boundary if the client can run `SET rls.account_id = ...` itself; it is
    for app-mediated access. With connection pooling use `SET LOCAL` / `set_config('rls.account_id', '2', true)`
    inside the transaction so the value cannot leak to the next borrower.
  - Index the tenant column (account_id); policies are ordinary predicates and benefit from indexes. Functions in
    policies should be LEAKPROOF-aware (security barrier semantics).

### Transactions, transactional DDL, SAVEPOINT  [M5, M7, M3]  (source: playground__transactions.txt)
- Angle: transactions are not only for banks. Signup flow without transactions = hand-written undo at every step;
  with them = BEGIN ... COMMIT and "either they all work or they all fail".
- Exercise sequence (HR employees/dependents schema):
  1. `BEGIN; INSERT INTO employees (...) VALUES ('Elizabeth','Christensen', current_date, 1, 'Master of the Highwire', 2, 2) RETURNING employee_id; COMMIT;` then SELECT finds her.
  2. Same with ROLLBACK for 'Chris Winslett' - RETURNING still showed an id, but the row is gone. Re-run: ids keep
     increasing - sequences are non-transactional so concurrent transactions never collide (gaps are normal).
  3. `BEGIN; INSERT INTO employees (first_name, last_name) VALUES ('Tom','Jones') ...; COMMIT;` -> NOT NULL violation;
     COMMIT on an aborted transaction reports `ROLLBACK`.
  4. Multi-statement: employee + two dependents found via `(SELECT employee_id FROM employees WHERE first_name =
     'Chris' AND last_name = 'Winslett')`. Run it twice -> second run fails ("more than one row returned by a subquery
     used as an expression") and the duplicate employee is rolled back too.
  5. Bob Young with a NULL dependent first_name -> whole transaction rolled back; Bob not present.
  6. Scoping: uncommitted changes invisible to other connections.
  7. Transactional DDL: `BEGIN; ALTER TABLE employees ADD COLUMN middle_name VARCHAR(50) DEFAULT NULL; COMMIT;` `\d employees`.
     Then 5 ADD COLUMNs where the last is `postal_code VARCHAR(50) NOT NULL` (no default, table not empty) -> error ->
     none of the 5 columns exist. "Migration either all succeeded or no change."
  8. SAVEPOINT: insert Bob; `SAVEPOINT saved_employee;` two dependents (second fails); `ROLLBACK TO SAVEPOINT saved_employee; COMMIT;` -> Bob exists, no dependents.
  9. `SELECT txid_current();` - every statement runs in a transaction (autocommit); run again -> +1.
- Teaching improvements for our version:
  - Replace the lookup-subquery with a data-modifying CTE: `WITH e AS (INSERT INTO employees ... RETURNING employee_id)
    INSERT INTO dependents (first_name, last_name, employee_id) SELECT v.f, 'kid', e.employee_id FROM e, (VALUES ('oldest'),('youngest')) v(f);`
  - `txid_current()` assigns (consumes) an XID even for a read-only statement; PG13+ prefer `pg_current_xact_id()`,
    and `pg_current_xact_id_if_assigned()` to show that a read-only transaction has no XID until it writes - a perfect
    M5 hook for "virtual xid vs real xid".
  - After an error inside BEGIN, every statement fails with `current transaction is aborted, commands ignored until
    end of transaction block` until ROLLBACK (or ROLLBACK TO SAVEPOINT). PGlite exposes this exactly.
  - Show xmin of the inserted row (`SELECT xmin, * FROM employees WHERE ...`) = txid of the inserting transaction.
- Overstatement: "transactional DDL is unique in the database world" - several other systems have it; keep the claim
  as "Postgres has fully transactional DDL (almost all commands; exceptions like CREATE INDEX CONCURRENTLY, VACUUM,
  CREATE DATABASE cannot run inside a transaction block)".

### Multi-table CRUD in one statement  [M3]  (source: playground__sql-tricks-for-crud.txt)
- Angle: "do more things right inside the database"; most CRUD tutorials are one-table-at-a-time and unrealistic.
- Exercise sequence:
  1. `DROP TABLE customers, invoices, items;` (errors on a fresh DB - use `DROP TABLE IF EXISTS`), then
     customers(customer_id BIGINT IDENTITY PK, name TEXT NOT NULL UNIQUE), invoices(invoice_id BIGINT IDENTITY PK,
     customer_id BIGINT REFERENCES customers), items(item_id BIGINT IDENTITY PK, invoice_id BIGINT REFERENCES invoices,
     name TEXT NOT NULL).
  2. `INSERT INTO customers (name) VALUES ('Ben');` then multi-row `VALUES ('Peter'), ('Paul'), ('Mary')` - column/type
     resolution and transaction overhead shared over rows.
  3. UPDATE Ben -> Jen, DELETE Jen.
  4. Data-modifying CTE: `WITH new_invoice AS (INSERT INTO invoices (customer_id) SELECT customer_id FROM customers
     WHERE name = 'Mary' RETURNING invoice_id) INSERT INTO items (name, invoice_id) SELECT n.name, new_invoice.invoice_id
     FROM new_invoice CROSS JOIN (VALUES ('Purple Automobile'), ('Yellow Automobile')) AS n(name);`
  5. Bulk populate: 3 invoices per customer via `CROSS JOIN generate_series(1,3) RETURNING invoice_id`, then 3 items
     per invoice: `format('%s %s', c, (ARRAY['Train','Plane','Automobile'])[i.invoice_id % 3 + 1])` over
     `unnest(ARRAY['Red','Blue','Green']) AS c CROSS JOIN i`.
  6. Read with `JOIN invoices USING (customer_id) JOIN items USING (invoice_id) WHERE customers.name = 'Paul'`;
     `SELECT DISTINCT customers.name, split_part(items.name, ' ', 2) AS vehicle ...` -> Paul Automobile, Peter Plane,
     Mary Train (deterministic only on a fresh DB where invoice ids start at 2.. after step 4 used id 1).
  7. UPDATE ... FROM: `UPDATE items SET name = replace(items.name, 'Blue', 'Purple') FROM customers, invoices WHERE
     customers.customer_id = invoices.customer_id AND invoices.invoice_id = items.invoice_id AND customers.name =
     'Mary' AND items.name ~ '^Blue';`
  8. PG18 `RETURNING OLD.name AS before_name, NEW.name AS after_name` on a Purple -> Violet update.
  9. DELETE ... USING: `DELETE FROM items USING invoices, customers WHERE ... customers.name = 'Peter' AND items.name ~ 'Red';`
     (UPDATE uses FROM, DELETE uses USING - same idea).
- Pitfall: `items.name ~ 'Red'` is unanchored (matches 'Bored...'); anchor with `^Red`. UPDATE ... FROM where a
  target row joins to several FROM rows updates it once with an arbitrary match.
- Note: USING in SELECT merges join columns, so `SELECT *` shows customer_id once.

### Strings to arrays  [M2, M3]  (source: playground__strings-to-arrays.txt)
- Seed (complete): weather_data(station text, temps text) with 4 stations and CSV temperature strings.
- Sequence: `string_to_array(temps, ',')` -> text[]; `cardinality(...)` -> 12, 15, 18, 15; `unnest(...)` in SELECT
  list (set-returning function duplicates the other columns); CTE + `max(temps), min(temps)` GROUP BY station;
  `array_to_string(string_to_array(temps, ','), '|')`.
- BIG PITFALL the tutorial did not notice: unnest of a text[] gives TEXT, so max/min are lexicographic. Its own
  published output is wrong-as-numbers: Station North max '2' min '-1' (true numeric: 2 and -16), West max '9' min
  '1' (true 16 and 1), East '9'/'1' (true 16/1), South '33'/'12' (true 33/12). Fix:
  `string_to_array(temps, ',')::int[]` or `unnest(...)::int`. A perfect "spot the bug" exercise.
- Also: the prose calls it `split_to_array`; the real function is `string_to_array`. Prefer LATERAL/FROM-clause unnest
  (`FROM weather_data, unnest(string_to_array(temps, ',')::int[]) AS t(temp)`) and `WITH ORDINALITY` for the hour index.

### Aggregate FILTER and one-pass summaries  [M3, M4]  (sources: playground__summaries-with-aggregate-filters-and-windows.txt, playground__using-filter-for-aggregation.txt)
- Angle: show three ways to get the same report - CTE per condition (N scans, joins), CASE inside SUM, and
  `agg(...) FILTER (WHERE ...)` - then pick the readable one. FILTER works with any aggregate (stddev, array_agg,
  count), which the CASE trick can't always emulate (count(CASE...) works, but e.g. array_agg would collect NULLs).
- Summaries tutorial seed: `CREATE TABLE sales AS SELECT a, b, CASE WHEN random() < 0.4 THEN 'bird' ELSE 'bee' END AS c,
  10 * random() AS value FROM generate_series(1,100) a, generate_series(1,100) b;` (10,000 rows).
  Sequence: subquery-for-total bee_pct; 3-CTE version (3 scans); CASE version; FILTER version
  `100.0 * sum(value) FILTER (WHERE c = 'bee') / sum(value) AS bee_pct, 100.0 * sum(value) FILTER (WHERE a > 90) / sum(value) AS a90_pct`;
  stddev with FILTER; FILTER + `GROUP BY b / 100` ("fish in your data lake": wide MV + aggregate filters).
  Expected: bee_pct ~60, a90_pct ~10.
- Invoices tutorial: invoices(id bigint, account_id int, net_total_in_cents int, invoice_period daterange, status
  text 'paid'|'invoiced', created_at, updated_at); monthly report billed/uncollected/collected via
  `lower(invoice_period)`. CTE version with LEFT JOINs + COALESCE; CASE version; FILTER version.
- Pitfalls: the CASE and FILTER versions drop the COALESCE, so a month with no 'invoiced' rows shows NULL instead of 0
  (the CTE version prints 0) - wrap with COALESCE(..., 0). `/ 100.0` vs `/ 100.00` changes the result scale.
  Storing cents as integer is a deliberate choice (no fractional cents). Sample invoice_period `[2022-02-01,2022-02-28)`
  excludes Feb 28 - should be `[2022-02-01,2022-03-01)`; good range-bounds teaching point. `b / 100` is integer
  division (groups 0 and 1 only). random() makes results non-reproducible: `SELECT setseed(0.42);` first.
- Claim to correct: "aggregate filtering, a feature unique to PostgreSQL and SQLite" - FILTER is SQL-standard
  (SQL:2003); few engines implement it. Also "aggregate functions are also window functions, so they accept the
  same controls" conflates two features: FILTER applies to aggregates in both plain and window use.

### Tags: junction table vs int[] vs text[] with GIN  [M2, M4]  (source: playground__tags-and-postgres-arrays.txt)
- Angle: same question ("cats that are red AND brown AND aloof") answered on three models; measure size and time.
  Relational = N self-joins per tag (gets ugly); int[] + GIN = `@>` containment; text[] + GIN = simplest.
- Seed: cats(cat_id BIGINT IDENTITY PK, cat_name text) generated as the cross product of 8 honorifics x 6 first x
  6 middle x 6 last names x generate_series(1,5) ORDER BY random() (= 8,640 cats, not the "1.7M" in the prose);
  tags with 11 names (soft, cuddly, brown, red, scratches, hisses, friendly, aloof, hungry, birder, mouser);
  cat_tags(cat_id int, tag_id int, unique(cat_id, tag_id)) where each cat gets each tag with p=0.25 (~23.8k rows);
  `CREATE INDEX cat_tags_x ON cat_tags (tag_id);`
- Sequence and reported numbers: total size relational 2424KB; `\timing`; tags of cat 444 (<1ms); count brown; two-tag
  double self-join (>1s in browser); three-tag triple self-join (>2s). int[] model: cats_array(cat_id, cat_name,
  cat_tags integer[]) populated via `array_agg(tag_id) ... GROUP BY cat_id, cat_name` -> 1040KB; `CREATE INDEX
  cats_array_x ON cats_array USING GIN (cat_tags);` tags of cat 779 via `CROSS JOIN unnest(cat_tags) AS tag_id JOIN
  tags USING (tag_id)`; three tags via `WITH tags AS MATERIALIZED (SELECT array_agg(tag_id) AS tag_ids FROM tags WHERE
  tag_name IN ('red','brown','aloof')) SELECT count(*) FROM cats_array CROSS JOIN tags WHERE cat_tags @> tags.tag_ids;`
  (~200ms, "7x faster"). text[] model: 1224KB; `WHERE cat_tags @> ARRAY['red','brown','aloof']` (~120ms).
- Caveats listed: text[] has no global tag list (scan all cats); int[] cannot have an FK to tags (trigger needed);
  unnesting for relational queries gets crufty. intarray extension largely redundant now.
- Pitfalls the tutorial missed:
  - `INSERT INTO cats_array SELECT cat_id, ...` into a `GENERATED ALWAYS AS IDENTITY` column fails
    (`cannot insert a non-DEFAULT value into column "cat_id"`) - needs `OVERRIDING SYSTEM VALUE` (or BY DEFAULT).
  - The inner JOIN drops cats with zero tags (~0.75^11 = 4% of cats) from the array tables - counts still match for
    tag queries but row counts differ.
  - The relational multi-tag query is better written as `SELECT cat_id FROM cat_tags WHERE tag_id IN (...) GROUP BY
    cat_id HAVING count(*) = 3` (one scan) - the self-join version is a strawman. Worth showing all three plans.
  - The CTE named `tags` shadows the table name `tags` in the outer query (legal, confusing).
  - Timings are browser-dependent; compare EXPLAIN (ANALYZE, BUFFERS) shared hit counts instead.

### Money  [M2]  (source: playground__working-with-money-in-postgres.txt)
- Angle: compare four candidate types - money (locale-bound via lc_monetary, no fractional cents; handy only for
  output formatting by casting), float (imprecise), integer cents (fast, 4/8 bytes, needs a multiplier: 100 for
  cents, 10^9 for BTC-ish), numeric (exact, the usual best choice).
- Float demo: `select 0.0001::float4;` `select 0.0001::float4 + 0.0001::float4;` `select 0.0001::float4 + 0.0001::float4 + 0.0001::float4;` (verified in PGlite 18.6: third gives 0.00029999999, not 0.0003).
- Seed: `products(sku BIGINT IDENTITY PK, name VARCHAR(255), price NUMERIC(7,5), currency TEXT CHECK (currency IN ('USD','EUR','GBP')))`
  - store the ISO 4217 currency code next to the amount; exchange rates in another table.
- Functions: `ROUND(AVG(price), 2)`, `CEIL(SUM(price))`, `FLOOR(SUM(price))`, median via ROW_NUMBER + COUNT(*) OVER ()
  picking `r IN (total_count / 2, (total_count + 1) / 2)`, `CEIL(SUM(price))::money`, `show lc_monetary;`.
- Pitfalls/corrections:
  - NUMERIC(7,5) caps prices at 99.99999 - a $100 product errors with numeric field overflow. Use e.g. NUMERIC(12,2)
    or unconstrained numeric.
  - "No built-in median" - `percentile_cont(0.5) WITHIN GROUP (ORDER BY price)` is built in (ordered-set aggregate);
    percentile_disc for an actual value. Their median query with an odd count picks the same row twice (fine) but
    returns FLOOR of it, which is not a median.
  - "numeric takes 10 bytes per column row" is wrong: numeric is variable-length (short varlena header + 2 bytes per
    group of 4 decimal digits, plus weight/sign). Verified in PGlite 18.6: `pg_column_size(0::numeric)` = 6,
    `123.45` = 10, `1234567.89` = 12 bytes.
  - int max 2147483647, bigint max 9223372036854775807 (correct).

### Working with time  [M2, M3, M4]  (source: playground__working-with-time-in-postgres.txt)
- Angle: "timestamptz is your bff"; store UTC instants, render in user zone; ISO 8601 (1789-07-14 17:30:00) vs
  US/French date orders (Bastille Day).
- Sequence:
  1. `SELECT now();` -> `2023-04-28 18:23:58.5603+00`; `SELECT now() AT TIME ZONE 'America/Chicago';`;
     `select * from pg_timezone_names;`
  2. `SELECT EXTRACT (EPOCH FROM now());`
  3. `SELECT TO_CHAR(NOW(), 'DY, Mon dd, yyyy HH24:MI:SS OF');`
  4. Dataset `train_schedule(trip_id, track_number, train_number, scheduled_departure, scheduled_arrival,
     actual_departure, actual_arrival)` all timestamptz, ~10 days from 2023-04-29.
  5. min/max(actual_arrival) and their difference (interval ~10 days).
  6. `avg(actual_arrival - scheduled_arrival)` (avg of interval), then only deltas `> INTERVAL '10 minutes'`.
  7. `WHERE (actual_departure, actual_arrival) OVERLAPS (now(), now() - INTERVAL '2 hours')`.
  8. `fares(peak_id int, peak_name text, peak_times tstzmultirange, fare_change numeric)` with multirange literals
     `'{[2023-12-24 00:00, 2023-12-27 00:00],[2023-12-31 00:00, 2024-01-02 00:00]}'`; `WHERE peak_times @> now()`.
  9. `CREATE INDEX btree_actual_departure ON train_schedule (actual_departure);` and
     `CREATE INDEX brin_sequential ON train_schedule USING BRIN (actual_departure);` (BRIN for append-ordered data).
  10. `date_trunc('day', actual_departure)` count per day.
- Corrections: epoch is seconds since 1970-01-01 00:00 UTC (prose says "July 1st, 1970"). The type name is
  `TIMESTAMP WITH TIME ZONE` (prose: "WITH TIMEZONE"). timestamptz does NOT store a zone - it stores a UTC instant and
  converts on input/output using the TimeZone setting (prose implies the zone is kept). `now() AT TIME ZONE 'X'`
  returns timestamp WITHOUT time zone. OVERLAPS accepts endpoints in either order (the example passes them reversed).
  The source multirange literal has stray trailing colons (`00:00:`); verified that PG18.6/PGlite still parses it, but clean it up for readability. tstzmultirange is PG14+.
  `now()` is the transaction start time (constant within a transaction) - use clock_timestamp() for wall time.

### psql basics, pager, echo of hidden queries  [M1, M6]  (sources: playground__psql-basics.txt, playground__psql-echo-commands.txt)
- psql basics sequence: `\?`, `\h`, `\h create database`, `\l`, `\! ls -la`, `\d+ weather`, `\dn \dv \du \df \dp`,
  pager (`\pset pager 0` / `1`), multi-line query buffer and `\r` reset, `\timing`, an UPDATE
  (`UPDATE weather SET magnitude = 40 WHERE episode_id = 57676;`), `\q`.
- Echo sequence: `\set ECHO_HIDDEN on` (= `psql -E`) then `\dt+` prints the catalog query psql ran (pg_class joined to
  pg_namespace and pg_am, relkind CASE map r/v/m/i/S/s/t/f/p/I, relpersistence p/t/u, pg_table_size,
  obj_description, `pg_table_is_visible(c.oid)`); result: weather 856 kB heap permanent. `CREATE INDEX idx_weather_type
  ON weather(event_type); \di` echoes the pg_index join (indexrelid/indrelid). `\set ECHO queries` (= `-e`) echoes
  your own SQL; `SELECT event_type, COUNT(*) ... LIMIT 1` -> `Hail | 412`. `\set` lists all variables.
- Angle that clicks: "psql meta-commands are just SQL over the catalogs - make psql show you its homework." Directly
  reusable as a catalog-exploration lesson in our UI even without psql: we can display the equivalent SQL next to a
  "describe table" button.
- PGlite note: no psql backslash commands natively (unless we ship a meta-command shim); `\! ls` is impossible.

### SQL for kids (insects)  [M1, M3]  (source: playground__postgresql-for-kids.txt)
- Angle: databases are grids; psql talks to Postgres about itself, SQL talks about the data. Never look at all data
  if you don't know its size -> LIMIT. Pager keys explained (space, q).
- Dataset: insect_names(common_name, scientific_name, "Order", family, genus, species, author, notes,
  taxonomy_last_updated), order_descriptions("Order", examples, type_of_mouth_parts, metamorphosis...),
  order_species_counts("Order", extant_species_described).
- Sequence: `\d`, `\d+ insect_names`, `LIMIT 10/2`, single column, `ILIKE '%worm%'`, find a bug named after you
  (`'%franklin%'`), UPDATE 'Franklin bumble bee' -> 'Lizzie bumble bee' by scientific_name 'Bombus franklini Frison',
  INSERT a fake 'pizza bug' (note psql continuation prompts `postgres(#`, `postgres-#` and the forgotten semicolon),
  `\dt`, join order_species_counts to order_descriptions on "Order" for butterflies (Lepidoptera), join to
  insect_names for butterfly mouth parts/metamorphosis, `COUNT(*)`, `SUM(extant_species_described)`, SUM with OR of
  two ILIKEs (dragonflies or butterflies).
- Teaching nugget: why `"Order"` needs double quotes - ORDER is a reserved word, and the quoted mixed-case
  identifier is case-sensitive. Good for our beginner track's "identifiers and quoting" sidebar.

### Query performance analytics with pg_stat_statements  [M4, M6, M7]  (source: playground__query-performance-analytics.txt)
- Setup: `shared_preload_libraries = 'pg_stat_statements'` + `CREATE EXTENSION pg_stat_statements;` (docs: also needs
  compute_query_id auto/on - default auto handles it). `\x on` for wide rows.
- Queries in order:
  1. `SELECT * FROM pg_stat_statements;`
  2. Top 5 by total_exec_time joined to pg_database on dbid.
  3. Round total_exec_time, `avg_time = total_exec_time / calls`, share of total via
     `100 * s.total_exec_time / sum(s.total_exec_time::numeric) OVER ()` ("percentage_cpu"), `substring(query,1,50)`.
  4. `SELECT (sum(total_exec_time) / sum(calls))::numeric(6,3) AS avg_execution_time FROM pg_stat_statements;`
  5. Top writers to shared buffers: `ORDER BY shared_blks_dirtied DESC`.
  6. Missing-index heuristic on pg_stat_user_tables: `seq_scan - idx_scan AS too_much_seq`, CASE 'Missing Index?',
     pg_relation_size(relid). Sample: dependents 41 seq / 0 idx -> Missing Index?; employees -3469 OK.
- Tips: then EXPLAIN ANALYZE the worst offenders; indexes cost writes - don't index every column; pg_stat_activity
  next.
- Pitfalls: "percentage_cpu" is really share of execution time (includes I/O waits), not CPU. `numeric(6,3)` overflows
  once the average exceeds 999.999 ms. seq_scan - idx_scan ignores table size - a 1-page table with many seq scans is
  fine (the planner prefers seq scans on tiny tables); weight by pg_relation_size or n_live_tup. idx_scan is NULL for
  a table with no indexes (view sums over its indexes), making too_much_seq NULL -> wrap in COALESCE.
- PGlite: pg_stat_statements is in our extension list; whether it can be preloaded in PGlite must be verified (it
  requires shared_preload_libraries). Plan B: pg_stat_user_tables counters, which work in-process.

### PostGIS basics (compact; not runnable in PGlite)  [M6]  (source: playground__basics-of-postgis.txt)
- NYC 2020 census bundle (same as postgis.net workshop): nyc_subway_stations, nyc_neighborhoods, nyc_streets with
  geom in SRID 26918 (UTM zone 18N, metres).
- Sequence: ST_AsText(geom) of 10 stations; ST_Area West Village (m^2); ST_Length 'Columbus Cir'; sum length by
  street type; SRID explanation via spatial_ref_sys; Broad St = POINT(583571.9 4506714.3); ST_Intersects with
  ST_GeomFromText('POINT(583571 4506714)', 26918) to find neighborhood/borough; spatial join ON ST_Contains;
  ST_Distance between two streets; ST_DWithin(geom, point, 10) for streets within 10 m.
- Reuse for us: only as a "what extensions add" sidebar. The exclusion-constraint box trick (constraints tutorial) and
  built-in geometric types (point, box, `&&`) give a PostGIS-free taste of GiST in PGlite.

### Window functions for data analysis  [M3]  (source: playground__postgres-window-functions-for-data-analysis.txt)
- Angle: "SQL makes sense on one row or aggregating many - but what about comparing rows you already calculated?"
  OVER creates the window ("annoyingly the word window appears nowhere"). WHERE removes rows; windows compute across
  the rows that remain without removing any. Frame = "which rows am I looking at", e.g.
  `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`. Running total is "the current row plus the rows before" - a diagram of
  growing frames is the suggested visual.
- Dataset: ecommerce orders(order_id, customer_id, order_date timestamp, total_amount) - 10 customers, orders from
  2024-08-21 onward (order 21 = 349.98, 22 = 899.98, 23 = 34.98, 24 = 89.99, 25 = 149.99, 26 = 64.98, 27 = 249.98).
- Exercise sequence with expected output:
  1. Running total `SUM(total_amount) OVER (ORDER BY order_date)` -> 349.98, 1249.96, 1284.94, 1374.93, 1524.92, 1589.90, 1839.88.
  2. `FIRST_VALUE(order_date) OVER (PARTITION BY customer_id ORDER BY order_date)` and `LAST_VALUE(...)` same window.
  3. CTE DailySales (`date_trunc('day', order_date)`, SUM) + `RANK() OVER (ORDER BY daily_total_sales DESC)`.
  4. `LAG(daily_total_sales) OVER (ORDER BY sales_date)` and the difference (first row NULL); LEAD looks forward.
  5. `AVG(daily_total_sales) OVER (ORDER BY sales_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` -> 349.98, 624.98,
     428.31, 343.73, 304.98, 264.98, 262.84, 231.41 (8th row: first row drops out of the frame), ...
  6. `NTILE(4) OVER (ORDER BY daily_total_sales DESC)` quartiles (1 = top quarter).
- Pitfalls (to teach explicitly; the tutorial shows them without explaining):
  - LAST_VALUE with the default frame (`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`) returns the current row,
    not the partition's last row. The sample happens to look right only because it lists each customer's latest order.
    Fix: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, or `FIRST_VALUE(...) OVER (... ORDER BY order_date DESC)`.
  - Running total with default RANGE frame lumps peer rows (equal order_date) into the same total; use ROWS for a
    strict row-by-row running sum.
  - ROWS 6 PRECEDING is "7 rows", not "7 days" when days are missing; use
    `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW` (PG11+) for calendar windows. The first 6 rows average
    fewer than 7 values.
  - RANK leaves gaps after ties; DENSE_RANK doesn't; ROW_NUMBER breaks ties arbitrarily.
  - Repeated identical OVER clauses -> name it once with `WINDOW w AS (...)`.

## Reusable sample schemas

All scripts below were executed together, in this order, on PGlite 0.5.16 = "PostgreSQL 18.6 ... wasm32" (the same
engine as our app) with the btree_gist extension loaded, and every listed check passed. Crunchy's own seed files are
not in the page text, so these are compatible reconstructions: same table/column names as the tutorials so the
tutorial SQL runs unchanged (except where noted), and small enough for in-browser use. `setseed()` makes random data
reproducible. Name clashes between tutorials are resolved by renaming (orders_mv, crm_accounts).
Fit by lesson:
- S1 regions -> M1/M3 "SQL clauses" (learn-sql). S2 HR -> M3 joins, self join, M5 transactions (employees has NOT NULL
  start_date/salary so the 'Tom Jones' insert fails as in the tutorial; dependents.first_name NOT NULL).
- S3 weather (1200 rows, 12 'Winter Storm', ~744 kB so it spans ~93 heap pages; damage_crops is numeric here to avoid
  the tutorial's text-comparison trap) -> M4 B-tree, bitmap scan, multicolumn, INCLUDE, psql-echo.
- S4 births (5479 days, synthetic seasonal + weekend dip) -> M3 CTE/window (lag week-over-week), M4 casting/index.
- S5 musicians -> M3 window aggregates / percentages. S6 weather_data -> M2/M3 arrays, the text-vs-int max/min bug.
- S7 accounts/purchases (+ index on (account_id, created_at DESC), and an account with no purchases) -> M3/M4 LATERAL
  top-1-per-group, jsonb_array_elements, CSV tags.
- S8 products/orders_mv/product_orders -> M6 materialized views (rename `orders` to `orders_mv` in the MV SQL).
- S9 thermostat (864 rows, 2022-07-23..2022-08-03 hourly x 3 sensors) -> M7 partitioning lab.
- S10 orders (180 rows, timestamps relative to now() so "last 90 days" queries always return data) -> M3 date
  roll-ups, ROLLUP/CUBE, window functions.
- S11 invoices (cents + daterange, 7 months x 12 accounts) -> M3 FILTER vs CASE vs CTE.
- S12 sales (10k rows) -> M3/M4 one-pass aggregates; expected bee_pct ~60.3, a90_pct ~9.7 with setseed(0.5).
- S13 cats/tags/cat_tags/cats_array (100 cats, 11 tags, p=0.25, GIN on bigint[]) -> M2/M4 tags modelling; note
  OVERRIDING SYSTEM VALUE and LEFT JOIN so tagless cats keep `'{}'`.
- S14 crm_accounts/contacts -> M6 RLS (rename `accounts` to `crm_accounts` in the tutorial joins).
- S15 train_schedule (80 trips) -> M2/M3 time, intervals, OVERLAPS, BRIN vs B-tree. Avg arrival delay ~9m52s.
- S16 users/rooms/reservations fully constrained incl. `EXCLUDE USING gist (room_id WITH =, tsrange(start_time,
  end_time) WITH &&)`; a back-to-back booking (08:30-09:00 after 08:00-08:30) is accepted, an overlapping one is
  rejected with `conflicting key value violates exclusion constraint "no_double_booking"`.

```sql
-- S1 regions
CREATE TABLE regions (region_id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, region_name text NOT NULL);
INSERT INTO regions (region_name) VALUES ('Europe'), ('Americas'), ('Asia'), ('Middle East and Africa');

-- S2 HR schema
CREATE TABLE locations (
  location_id int PRIMARY KEY, street_address text, postal_code text, city text, state_province text, country_id char(2));
INSERT INTO locations VALUES
  (1, '1 Main St', '62401', 'Effingham', 'Indiana', 'US'),
  (2, '8 Baker St', 'NW1', 'London', 'London', 'UK'),
  (3, '5 Marienplatz', '80331', 'Munich', 'Bavaria', 'DE'),
  (4, '9 Tech Way', '84043', 'Lehi', 'Utah', 'US');
CREATE TABLE departments (
  department_id int PRIMARY KEY, department_name text NOT NULL, location_id int REFERENCES locations);
INSERT INTO departments VALUES (1,'Management',1),(2,'IT',2),(3,'Human Resources',3),(4,'Sales',1);
CREATE TABLE employees (
  employee_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  first_name text NOT NULL, last_name text NOT NULL,
  start_date date NOT NULL, job_title text, salary numeric(10,2) NOT NULL,
  manager_id bigint REFERENCES employees, department_id int REFERENCES departments);
INSERT INTO employees (employee_id, first_name, last_name, start_date, job_title, salary, manager_id, department_id) VALUES
  (1,'John','Smith','2015-01-05','President',250000,NULL,1),
  (2,'Pointy','HairedBoss','2016-03-01','CTO',180000,1,2),
  (3,'Dilbertzoni','DeScrewed','2018-06-11','Software Engineer',120000,2,2),
  (4,'Vanda','Socialist','2017-02-20','VP Equity Diversity Inclusion',150000,1,3),
  (5,'Howard','TheDuck','2016-09-12','VP Sales',160000,1,4),
  (6,'Luke','Fett','2020-01-06','Sales Guy',70000,5,4),
  (7,'John','SkipWork','2021-04-19','HR Henchman',60000,4,3),
  (8,'Lea','Palpatine','2019-08-26','UI Designer',95000,2,2);
SELECT setval(pg_get_serial_sequence('employees','employee_id'), 8);
CREATE TABLE dependents (
  dependent_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name text NOT NULL, last_name text NOT NULL,
  employee_id bigint NOT NULL REFERENCES employees ON DELETE CASCADE);
INSERT INTO dependents (first_name, last_name, employee_id) VALUES
  ('Spoiled','Smith',1),('DoNothin','Smith',1),('Rafael','HairedBoss',2),('Beta','HairedBoss',2),('Wanda','DeScrewed',3);

-- S3 weather
SELECT setseed(0.42);
CREATE TABLE weather (
  event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  episode_id int, event_type text NOT NULL, state text,
  damage_crops numeric(12,2) NOT NULL DEFAULT 0, magnitude numeric,
  begin_date_time timestamptz, event_narrative text);
INSERT INTO weather (episode_id, event_type, state, damage_crops, magnitude, begin_date_time, event_narrative)
SELECT 57000 + g,
       CASE WHEN g % 100 = 0 THEN 'Winter Storm'
            ELSE (ARRAY['Hail','Hail','Hail','Thunderstorm Wind','Thunderstorm Wind','Flash Flood','Tornado','Heavy Rain','Drought','High Wind'])[1 + g % 10] END,
       (ARRAY['TEXAS','KANSAS','HAWAII','IOWA','OHIO','MAINE'])[1 + g % 6],
       CASE WHEN g % 7 = 0 THEN round((random() * 50000)::numeric, 2) ELSE 0 END,
       round((random() * 80)::numeric, 1),
       timestamptz '2022-01-01' + g * interval '7 hours',
       repeat('Narrative text for the storm event. ', 15)
FROM generate_series(1, 1200) g;
ANALYZE weather;

-- S4 births
CREATE TABLE births (id bigint GENERATED ALWAYS AS IDENTITY, day date NOT NULL, births int NOT NULL);
INSERT INTO births (day, births)
SELECT d::date,
       (11000 + 1500 * sin(extract(doy FROM d) / 58.0)
              - CASE WHEN extract(isodow FROM d) IN (6, 7) THEN 3000 ELSE 0 END
              + random() * 400)::int
FROM generate_series(date '2000-01-01', date '2014-12-31', interval '1 day') d;

-- S5 musicians
CREATE TABLE musicians (band text, name text, earnings numeric(10,2));
INSERT INTO musicians VALUES
  ('PPM','Paul',2.2),('PPM','Peter',4.5),('PPM','Mary',1.1),
  ('CSNY','Crosby',4.2),('CSNY','Stills',6.3),('CSNY','Nash',0.3),('CSNY','Young',2.2);

-- S6 weather_data
CREATE TABLE weather_data (station text, temps text);
INSERT INTO weather_data VALUES
  ('Station North','-1,-4,-14,-15,-16,-15,-12,-9,-3,0,1,2'),
  ('Station West','2,4,5,6,9,10,15,16,13,12,10,9,5,3,1'),
  ('Station East','5,3,2,4,5,6,9,10,15,16,13,12,10,9,5,4,2,1'),
  ('Station South','12,18,22,25,29,30,33,31,30,29,28,25,24,23,14');

-- S7 accounts / purchases (LATERAL)
CREATE TABLE accounts (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL, addresses jsonb NOT NULL DEFAULT '[]');
INSERT INTO accounts (name, addresses) VALUES
  ('Wayne Enterprises', '[{"type":"hq","city":"Gotham","state":"New Jersey"},{"type":"lab","city":"Palo Alto","state":"California"}]'),
  ('Stark Industries',  '[{"type":"hq","city":"Malibu","state":"California"}]'),
  ('Daily Planet',      '[{"type":"hq","city":"Metropolis","state":"New York"}]'),
  ('Acme Corp',         '[{"type":"hq","city":"Phoenix","state":"Arizona"},{"type":"warehouse","city":"Fresno","state":"California"}]'),
  ('No Purchases LLC',  '[]');
CREATE TABLE purchases (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id bigint NOT NULL REFERENCES accounts, name text NOT NULL,
  created_at timestamptz NOT NULL, tags text);
INSERT INTO purchases (account_id, name, created_at, tags)
SELECT 1 + g % 4,
       (ARRAY['Laptop','Headphones','Desk','Monitor','Novel','Coffee Maker'])[1 + g % 6],
       timestamptz '2024-01-01' + g * interval '29 hours',
       (ARRAY['electronics,office','electronics,audio','furniture,office','electronics','books,gift','kitchen,gift'])[1 + g % 6]
FROM generate_series(1, 40) g;
CREATE INDEX purchases_account_created_idx ON purchases (account_id, created_at DESC);

-- S8 ecommerce for materialized views
CREATE TABLE products (sku text PRIMARY KEY, name text NOT NULL, price numeric(10,2) NOT NULL, sale_price numeric(10,2));
INSERT INTO products VALUES
  ('SKU-1','Red Kettle',39.99,NULL),('SKU-2','Blue Mug',9.99,7.99),('SKU-3','Green Teapot',24.50,NULL),
  ('SKU-4','French Press',34.00,29.00),('SKU-5','Grinder',89.00,NULL),('SKU-6','Scale',45.00,NULL);
CREATE TABLE orders_mv (order_id int PRIMARY KEY, status text NOT NULL CHECK (status IN ('Pending','Shipped','Cancelled')), ordered_at timestamptz NOT NULL);
INSERT INTO orders_mv SELECT g, (ARRAY['Shipped','Shipped','Shipped','Pending','Cancelled'])[1 + g % 5], timestamptz '2024-09-01' + g * interval '5 hours' FROM generate_series(1, 60) g;
CREATE TABLE product_orders (order_id int REFERENCES orders_mv, sku text REFERENCES products, qty int NOT NULL CHECK (qty > 0), PRIMARY KEY (order_id, sku));
INSERT INTO product_orders SELECT g, 'SKU-' || (1 + g % 5), 1 + g % 3 FROM generate_series(1, 60) g;
INSERT INTO product_orders SELECT g, 'SKU-6', 1 FROM generate_series(1, 60, 4) g;

-- S9 thermostat (partitioning)
SELECT setseed(0.7);
CREATE TABLE thermostat (thetime timestamptz, sensor_id int, current_temperature numeric(3,1), thermostat_status text);
INSERT INTO thermostat
SELECT t, s, round((20 + 4 * random())::numeric, 1), CASE WHEN random() < 0.3 THEN 'heating' ELSE 'idle' END
FROM generate_series(timestamptz '2022-07-23 00:00+00', timestamptz '2022-08-03 23:00+00', interval '1 hour') t,
     generate_series(1, 3) s;

-- S10 orders (date roll-ups + windows), relative to now()
SELECT setseed(0.1);
CREATE TABLE orders (
  order_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id int NOT NULL, order_date timestamptz NOT NULL,
  total_amount numeric(10,2) NOT NULL, category text NOT NULL, status text NOT NULL DEFAULT 'Shipped');
INSERT INTO orders (customer_id, order_date, total_amount, category)
SELECT 1 + g % 10,
       date_trunc('hour', now()) - g * interval '17 hours',
       round((10 + random() * 490)::numeric, 2),
       (ARRAY['Books','Clothing','Computers','Electronics','Electronics'])[1 + g % 5]
FROM generate_series(1, 180) g;

-- S11 invoices with cents + daterange (FILTER)
SELECT setseed(0.3);
CREATE TABLE invoices (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, account_id int,
  net_total_in_cents int NOT NULL, invoice_period daterange NOT NULL, status text NOT NULL);
INSERT INTO invoices (account_id, net_total_in_cents, invoice_period, status)
SELECT a, (50 + random() * 1000)::int,
       daterange(m::date, (m + interval '1 month')::date),
       CASE WHEN m >= date '2023-01-01' AND random() < 0.6 THEN 'invoiced'
            WHEN random() < 0.08 THEN 'invoiced' ELSE 'paid' END
FROM generate_series(date '2022-08-01', date '2023-02-01', interval '1 month') m,
     generate_series(1, 12) a;

-- S12 sales 10k (aggregate FILTER)
SELECT setseed(0.5);
CREATE TABLE sales AS
SELECT a, b, CASE WHEN random() < 0.4 THEN 'bird' ELSE 'bee' END AS c, 10 * random() AS value
FROM generate_series(1,100) a, generate_series(1,100) b;

-- S13 cats and tags (small)
SELECT setseed(0.9);
CREATE TABLE cats (cat_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, cat_name text NOT NULL);
CREATE TABLE tags (tag_id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, tag_name text NOT NULL UNIQUE);
CREATE TABLE cat_tags (cat_id bigint NOT NULL REFERENCES cats, tag_id bigint NOT NULL REFERENCES tags, PRIMARY KEY (cat_id, tag_id));
INSERT INTO cats (cat_name)
SELECT initcap(concat_ws(' ', h, f, l))
FROM unnest(ARRAY['mr','ms','doctor','frau']) h,
     unnest(ARRAY['flopsy','mopsey','whisper','tigger','softly']) f,
     unnest(ARRAY['smithe-higgens','maclarter','ipswich','glumfort','pigeod']) l;
INSERT INTO tags (tag_name) VALUES ('soft'),('cuddly'),('brown'),('red'),('scratches'),('hisses'),('friendly'),('aloof'),('hungry'),('birder'),('mouser');
INSERT INTO cat_tags SELECT cat_id, tag_id FROM cats, tags WHERE random() < 0.25;
CREATE TABLE cats_array (cat_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, cat_name text NOT NULL, cat_tags bigint[] NOT NULL DEFAULT '{}');
INSERT INTO cats_array (cat_id, cat_name, cat_tags) OVERRIDING SYSTEM VALUE
SELECT c.cat_id, c.cat_name, coalesce(array_agg(ct.tag_id ORDER BY ct.tag_id) FILTER (WHERE ct.tag_id IS NOT NULL), '{}')
FROM cats c LEFT JOIN cat_tags ct USING (cat_id) GROUP BY c.cat_id, c.cat_name;
CREATE INDEX cats_array_gin ON cats_array USING gin (cat_tags);

-- S14 RLS CRM
CREATE TABLE crm_accounts (id int PRIMARY KEY, name text NOT NULL);
INSERT INTO crm_accounts VALUES (1,'Wayne Enterprises'),(2,'LexCorp'),(3,'Queen Consolidated');
CREATE TABLE contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id int NOT NULL REFERENCES crm_accounts, name text NOT NULL, email text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO contacts (account_id, name, email) VALUES
  (1,'Alfred Pennyworth','alfred@wayne.example'),(1,'Lucius Fox','lucius@wayne.example'),(1,'Selina Kyle','selina@wayne.example'),
  (2,'Lex Luthor','lex@lexcorp.example'),(2,'Mercy Graves','mercy@lexcorp.example'),
  (3,'Oliver Queen','oliver@queen.example'),(3,'Felicity Smoak','felicity@queen.example');
CREATE INDEX contacts_account_id_idx ON contacts (account_id);

-- S15 train schedule
SELECT setseed(0.2);
CREATE TABLE train_schedule (
  trip_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY, track_number int, train_number int,
  scheduled_departure timestamptz, scheduled_arrival timestamptz,
  actual_departure timestamptz, actual_arrival timestamptz);
INSERT INTO train_schedule (track_number, train_number, scheduled_departure, scheduled_arrival, actual_departure, actual_arrival)
SELECT 1 + g % 3, 100 + (g * 37) % 900, dep, dep + dur,
       dep + (random() * 8)::int * interval '1 minute',
       dep + dur + (random() * 25 - 3)::int * interval '1 minute'
FROM (SELECT g, timestamptz '2023-04-29 06:00+00' + g * interval '3 hours 7 minutes' AS dep,
             (20 + (g * 13) % 70) * interval '1 minute' AS dur
      FROM generate_series(0, 79) g) s;

-- S16 reservations (constraints)
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE users (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL, email text UNIQUE);
CREATE TABLE rooms (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, number text NOT NULL UNIQUE);
CREATE TABLE reservations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users ON DELETE CASCADE,
  room_id bigint NOT NULL REFERENCES rooms,
  start_time timestamp NOT NULL, end_time timestamp NOT NULL, event_title text,
  CONSTRAINT start_before_end CHECK (start_time < end_time),
  CONSTRAINT daytime_check CHECK (start_time::time >= '08:00' AND end_time::time <= '17:00'),
  CONSTRAINT interval_check CHECK (end_time - start_time >= interval '30 minutes'),
  CONSTRAINT no_double_booking EXCLUDE USING gist (room_id WITH =, tsrange(start_time, end_time) WITH &&));
INSERT INTO users (name, email) VALUES ('Simon','simon@email.com'),('Bob','bob@email.com'),('Patrick','patrick@email.com');
INSERT INTO rooms (number) VALUES ('101'),('201'),('301'),('401'),('501');
INSERT INTO reservations (user_id, room_id, start_time, end_time, event_title) VALUES
  (1,1,'2024-04-12 08:00','2024-04-12 08:30','CPK scrum'),
  (2,2,'2024-04-12 08:00','2024-04-12 09:00','CPA Roadmap'),
  (1,3,'2024-04-12 10:00','2024-04-12 12:00','Creating Tables Tutorial'),
  (3,4,'2024-04-13 10:00','2024-04-13 11:00','Intriguing Incidents Meeting'),
  (2,1,'2024-04-12 08:30','2024-04-12 09:00','Back-to-back is fine');
```

Verified expected results on these seeds (PGlite 18.6):
- Musicians share of total: Nash 1.4, Mary 5.3, Paul 10.6, Young 10.6, Crosby 20.2, Peter 21.6, Stills 30.3; within
  band: Nash 2.3, Young 16.9, Crosby 32.3, Stills 48.5, Mary 14.1, Paul 28.2, Peter 57.7; per band CSNY 62.5, PPM 37.5
  (single query: `sum(sum(earnings)) OVER ()` with GROUP BY band).
- weather_data text max/min: East '9'/'1', North '2'/'-1', South '33'/'12', West '9'/'1'; with `::int`: East 16/1,
  North 2/-16, South 33/12, West 16/1.
- Weather plan before index: `Seq Scan on weather (cost=0.00..108.00 rows=12 width=589)`; after
  `CREATE INDEX idx_weather_type`: `Bitmap Heap Scan ... Recheck Cond` over `Bitmap Index Scan on idx_weather_type`.
- LATERAL latest purchase: accounts 1-4 get a row, account 5 ('No Purchases LLC') gets NULLs with LEFT JOIN LATERAL.
- HR RIGHT JOIN: Lehi has NULL department_name. Self join: John Smith's manager prints `' '` from format().
- pg_constraint on reservations lists contype 'n' rows such as `reservations_end_time_not_null` (PG18 behaviour).

## Discrepancies and version notes

Verified against PG18 docs in pgdocs/ and/or by running in PGlite 18.6:
- Partitioning tutorial creates a DEFAULT partition and later runs `DETACH PARTITION ... CONCURRENTLY`. Docs
  (sql-altertable): "CONCURRENTLY cannot be run in a transaction block and is not allowed if the partitioned table
  contains a default partition." PGlite error: `cannot detach partitions concurrently when a default partition exists`.
- `MERGE PARTITIONS` / `SPLIT PARTITION`: PG19, not in PG18/PGlite (the tutorial itself says reference only).
- "Add IO to EXPLAIN on Postgres 18+" (btree and high-level-performance pages): there is no IO option in PG18 EXPLAIN
  (options: ANALYZE, VERBOSE, COSTS, SETTINGS, GENERIC_PLAN, BUFFERS, SERIALIZE, WAL, TIMING, SUMMARY, MEMORY, FORMAT).
  PGlite: `unrecognized EXPLAIN option "io"`. In PG18, BUFFERS is included automatically with ANALYZE.
- RLS: `CREATE POLICY ... FOR INSERT ... USING (...)` -> `only WITH CHECK expression allowed for INSERT` (docs: "An
  INSERT policy cannot have a USING expression"). The tutorial's final per-command step fails as written.
- RLS: `current_setting('rls.account_id', false)` errors with `unrecognized configuration parameter "rls.account_id"`
  when unset; `current_setting(..., true)` returns NULL (docs: missing_ok).
- Constraints tutorial: "not null constraints are not named and will not appear in pg_constraint" - outdated for
  PG18: NOT NULL is stored in pg_constraint (contype 'n'), can be named, and ALTER TABLE can mark NOT NULL NOT VALID.
- Constraints tutorial: "no way to add a cascade after the fact via ALTER TABLE" - you drop and re-add the FK (as
  the tutorial itself does). PG18 adds NOT ENFORCED for CHECK and FK constraints and temporal constraints:
  `WITHOUT OVERLAPS` on PRIMARY KEY/UNIQUE and `PERIOD` on foreign keys - a native replacement for the box/point
  exclusion trick (PG18 release notes).
- B-tree skip scan (PG18) - correct as stated. Covering INCLUDE indexes (PG11+). UNIQUE NULLS NOT DISTINCT (PG15+).
  date_bin (PG14+). JSON_TABLE (PG17+). jsonb subscripting `[0]` (PG14+). tstzmultirange (PG14+). identity columns on
  partitioned parents (PG17+, per tutorial). MAINTAIN privilege / pg_maintain (PG17+). RETURNING OLD/NEW (PG18).
- Tags tutorial: `INSERT INTO cats_array SELECT cat_id, ...` into a GENERATED ALWAYS identity column errors
  (`cannot insert a non-DEFAULT value into column "cat_id"`); needs OVERRIDING SYSTEM VALUE. Also the generator yields
  8*6*6*6*5 = 8,640 cats and 11 tags, not "1.7M cats", "ten tags" and "4.7M relationships" (sizes 2424KB etc. match
  the small number).
- Strings-to-arrays: max/min over unnested text are lexicographic; the tutorial's published results (North max 2 /
  min -1, West max 9) are wrong as numbers. Confirmed in PGlite.
- Money: NUMERIC(7,5) overflows at 100 (`numeric field overflow`, confirmed). numeric is variable-length (6/10/12
  bytes measured), not "10 bytes". percentile_cont/percentile_disc are built-in medians. float4 triple-add prints
  0.00029999999 in PG18.6.
- Time: epoch is from 1970-01-01 00:00 UTC (not "July 1st"). timestamptz stores an instant, not a zone; the type is
  spelled TIMESTAMP WITH TIME ZONE. `now() AT TIME ZONE 'America/Chicago'` returns timestamp without time zone.
- Transactions: `txid_current()` is the legacy API; PG13+ `pg_current_xact_id()` (xid8). Verified: a bare
  `SELECT pg_current_xact_id_if_assigned();` returns NULL (no XID until something needs one). "Transactional DDL is
  unique in the database world" is overstated; some commands (CREATE INDEX CONCURRENTLY, VACUUM, CREATE DATABASE,
  DETACH ... CONCURRENTLY) cannot run in a transaction block.
- Date functions: "using date_trunc in a CTE lets PostgreSQL calculate once and reuse" - since PG12 a non-recursive,
  side-effect-free CTE referenced once is inlined; only `AS MATERIALIZED` forces compute-once.
  `date_trunc('week', <date>)` returns timestamptz (verified), in the session TimeZone.
- LATERAL: "behaves as a recursive loop" - it is a per-outer-row (nested-loop style) evaluation, not recursion. The
  claim that GROUP BY beats LATERAL at scale ignores the (account_id, created_at DESC) index case.
- Aggregate FILTER: "unique to PostgreSQL and SQLite" - it is standard SQL (SQL:2003), though few engines have it.
- High-level performance: index hit ratio formula `(sum(idx_blks_hit) - sum(idx_blks_read)) / sum(idx_blks_hit)` is
  not the usual hit/(hit+read). The bloat query hard-codes 23-byte tuple header and MAXALIGN 4 unless mingw (64-bit
  builds use MAXALIGN 8); treat as an estimate. maintenance_work_mem default 64MB - matches PG18 docs.
- Query performance: "percentage_cpu" is share of total execution time, not CPU. pg_stat_statements requires
  shared_preload_libraries and query ids (compute_query_id auto/on).
- Joins: prose says "the Effingham, Indiana office has no department... closed" but the shown output has Lehi, Utah
  as the unmatched location (data is right, text is wrong). Department named both "IT" and "Information Technology".
- Roles: `CREATE DATABASE finance; CREATE SCHEMA accounting;` without `\c finance` creates the schema in the
  current database. CREATE DATABASE is not meaningful in PGlite (single database).
- Casting page text is cut off mid-sentence at the functional-index fix.
- Vendor-specific / out of scope: Crunchy Bridge for Analytics (data lakes), pg_partman, cron scheduling,
  hyperloglog, QGIS/PostGIS web tools, connection string visual; playground's "you are a superuser" assumption.
- PGlite constraints relevant to porting: no psql meta-commands (\d, \dt+, \x, \timing, \set ECHO_HIDDEN, \!)
  unless we implement a shim; single connection, so "other sessions can't see uncommitted data" must be simulated
  (two PGlite instances do not share data; consider a scripted two-session visual instead); PostGIS unavailable;
  pg_stat_statements preload must be verified; buffer-cache ratios are trivially ~100% in-browser.

## Lesson ideas

Exercise-flow template (copy Crunchy's rhythm for every playground): seed -> baseline query -> "predict" prompt ->
change (DDL/index/policy) -> re-run -> diff panel (plan/rows/error) -> catalog peek -> "break it" challenge.

- [M4] B-tree lab on S3: split-screen EXPLAIN before/after; animate Seq Scan reading all ~93 pages vs Bitmap Index
  Scan producing a page bitmap then fetching 12 rows from few pages. Then widen the predicate (`event_type IN (...)`
  more common types) and let the learner watch the planner flip back to Seq Scan (cost crossover slider).
  Add the casting trap: `WHERE births = 7674::numeric` loses the index (S4).
- [M4] Multicolumn + skip scan (PG18): index (event_type, state); query only `state = 'HAWAII'` and show whether PG18
  uses skip scan; visualize the B-tree jumping between leading-key groups. INCLUDE + VACUUM to get "Heap Fetches: 0".
- [M2/M4] JSONB lab: -> vs ->> type badge (pg_typeof); the `text > numeric` error as a guided failure; expression
  B-tree index on `((systems_access->>'crm')::float)`; GIN jsonb_path_ops with `@@`/`@>` vs a non-indexable `->> =`.
  Quiz: why must the index expression be IMMUTABLE (text->timestamp cast isn't).
- [M2/M4] Tags modelling race on S13: same question on junction table (self-join and GROUP BY/HAVING variants),
  bigint[] + GIN `@>`, text[] + GIN; show pg_total_relation_size and EXPLAIN buffers side by side instead of wall time.
- [M3] Window frame visualizer (S10/S5): highlight the frame rows for each output row; toggle ROWS vs RANGE vs
  RANGE '6 days' and default-frame LAST_VALUE bug; PARTITION BY coloring for percentages.
- [M3] LATERAL as a for-each loop (S7): animate one outer row at a time feeding the subquery; contrast INNER vs LEFT
  LATERAL (account 5 vanishes/appears); then EXPLAIN shows Nested Loop + Index Scan Backward using the composite index.
- [M3] "Spot the bug" cards drawn from the tutorials: text max/min (S6), BETWEEN double-inclusive buckets, NULL vs 0
  in FILTER without COALESCE, LAST_VALUE default frame, UPDATE without WHERE (`UPDATE 4`), format() of NULLs.
- [M3] Multi-table CRUD (S2/CRUD tables): data-modifying CTE inserting parent + children with RETURNING; UPDATE ...
  FROM and DELETE ... USING; PG18 `RETURNING OLD.*, NEW.*` diff view.
- [M5] Transactions lab (S2): timeline of BEGIN -> statements -> error -> "current transaction is aborted" ->
  ROLLBACK TO SAVEPOINT -> COMMIT. Show xmin of inserted rows, sequence values consumed by rolled-back inserts
  (gaps), and `pg_current_xact_id_if_assigned()` NULL until first write. Transactional DDL: 5 ADD COLUMNs where the
  5th fails -> \d before/after.
- [M5] Two-session simulation for visibility (needed because PGlite is single-connection): scripted panes A and B
  showing that B doesn't see A's uncommitted row, driven by snapshot/xmin data rather than a real second backend.
- [M6] RLS lab (S14): toggle ENABLE RLS (default deny -> 0 rows), add USING policy, show the effective rewritten
  query ("appends a WHERE"), WITH CHECK failure on INSERT/UPDATE, per-command policies (DELETE 0), owner bypass vs
  FORCE ROW LEVEL SECURITY, session variable via `set_config('rls.account_id','2', true)` inside a transaction.
- [M1/M6] Roles lab: permission-check ladder visual (database CONNECT -> schema USAGE -> table SELECT), the
  "ON ALL TABLES is a snapshot" surprise with a new table, ALTER DEFAULT PRIVILEGES, group role membership graph,
  predefined roles (pg_read_all_data, pg_maintain).
- [M6] Materialized view staleness (S8): query MV, insert a new shipped order, MV unchanged, REFRESH, changed;
  REFRESH CONCURRENTLY fails without unique index, succeeds after. Show MV is a real heap relation (relkind 'm',
  pg_relation_size).
- [M7] Partition lab (S9): create parent + daily partitions, INSERT routes rows (`tableoid::regclass` counts),
  EXPLAIN shows pruning to one partition, DETACH (non-concurrent) and drop for retention, reproduce the
  CONCURRENTLY-with-DEFAULT error as a challenge, and the "default partition holds rows for a new range" failure.
- [M2] Types gallery: domains (date_of_birth/valid_email with NOT VALID + VALIDATE), composite (physical_package with
  `(properties).weight`), enum (ADD VALUE, no DROP VALUE), custom range over interval (`@>` vs `&&` side-by-side
  results), money/float/int/numeric comparison with pg_column_size and the float4 0.0001 drift.
- [M2] Time: timestamptz storage vs display - change `SET TimeZone` and watch the same stored value render
  differently; DateStyle MDY vs DMY flipping '06/10/2001'; tstzmultirange `@>` now().
- [M4/M7] Stats panel: pg_stat_user_tables seq_scan/idx_scan counters increment live as the learner runs queries,
  with the "missing index" heuristic and its weaknesses (tiny tables). pg_buffercache instead of hit ratios.
- [M1] Catalog x-ray: a "describe table" button that shows the catalog SQL (adapted from psql ECHO_HIDDEN output for
  \dt+ and \di: pg_class relkind map r/v/m/i/S/s/t/f/p/I, relpersistence p/t/u, pg_am, pg_index) and runs it.
