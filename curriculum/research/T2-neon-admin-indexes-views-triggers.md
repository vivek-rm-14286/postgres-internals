# T2 — Neon: Administration, Getting Started, Indexes, Views, Triggers, Cheat sheet, Advanced

Secondary source (neon.com/postgresql tutorials, formerly postgresqltutorial.com). Every page opens with an identical
"Lakebase Postgres / Neon / Databricks" INFO marketing paragraph; ignored throughout. Official PG18 docs remain
source of truth; errors found in the tutorials are logged under "Discrepancies".

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 16 | administration.txt | Section index: databases, schemas, tablespaces, roles & privileges, backup/restore, admin tips. Nav only. |
| 17 | administration__alter-database.txt | ALTER DATABASE: WITH IS_TEMPLATE/CONNECTION LIMIT/ALLOW_CONNECTIONS, RENAME (not current db), OWNER TO, SET TABLESPACE, SET param; testdb2->testhrdb walkthrough. |
| 18 | administration__alter-role.txt | ALTER ROLE attribute list, who-may-change-what rules, rename (session user cannot be renamed), per-role/per-db SET defaults (calf->elephant). |
| 19 | administration__alter-schema.txt | ALTER SCHEMA RENAME TO / OWNER TO; doe->finance, john->accounting; pg_namespace query. |
| 20 | administration__alter-tablespace.txt | ALTER TABLESPACE RENAME/OWNER/SET param; superuser or owner only. |
| 21 | administration__backup-database.txt | pg_dump and pg_dumpall option tables, -F tar example, .pgpass for automation, schema/roles/tablespaces-only dumps, bat/sh cron scripts. |
| 22 | administration__change-password.txt | ALTER ROLE ... WITH PASSWORD ... VALID UNTIL; cleartext-in-log warning. |
| 23 | administration__copy-database.txt | CREATE DATABASE ... WITH TEMPLATE; "being accessed by other users" error + pg_terminate_backend; pg_dump|psql cross-server copy. |
| 24 | administration__create-database.txt | CREATE DATABASE option list with defaults (template1, CONNECTION LIMIT -1, IS_TEMPLATE semantics); \l, pg_database; pgAdmin steps (skipped). |
| 25 | administration__create-schema.txt | CREATE SCHEMA [IF NOT EXISTS], AUTHORIZATION user (schema named after user), schema with embedded CREATE TABLE/VIEW subcommands (scm.deliveries). |
| 26 | administration__create-superuser-postgresql.txt | CREATE ROLE ... SUPERUSER, ALTER ROLE ... SUPERUSER/NOSUPERUSER; superuser bypasses all checks except login; Neon note (neon_superuser). |
| 27 | administration__create-tablespace.txt | Tablespace = logical name for disk dir; pg_default/pg_global; CREATE TABLESPACE ... LOCATION; \db, \db+; database on tablespace. |
| 28 | administration__current_user.txt | CURRENT_USER (effective role, follows SET ROLE) vs SESSION_USER (login role); bob demo. |
| 29 | administration__database-indexes-table-size.txt | pg_relation_size / pg_total_relation_size / pg_database_size / pg_indexes_size / pg_tablespace_size / pg_column_size + pg_size_pretty; top-5 tables query. |
| 30 | administration__describe-table.txt | No DESCRIBE in PG: \d film (full output incl. indexes, FKs, triggers) and information_schema.columns query. |
| 31 | administration__drop-database.txt | DROP DATABASE [IF EXISTS] ... [WITH (FORCE)]; cannot drop current db; "being accessed by other users"; dropdb. |
| 32 | administration__drop-role.txt | DROP ROLE fails with dependents; REASSIGN OWNED BY -> DROP OWNED BY -> DROP ROLE, per database; alice/sales walkthrough. |
| 33 | administration__drop-schema.txt | DROP SCHEMA [IF EXISTS] a, b [CASCADE|RESTRICT] (RESTRICT default); 2BP01 dependent-objects error. |
| 34 | administration__drop-tablespace.txt | DROP TABLESPACE [IF EXISTS]; "tablespace is not empty" -> drop or move the database first. |
| 35 | administration__grant.txt | LOGIN role can do nothing until GRANTed; joe/candidates permission-denied progression; GRANT ... ON ALL TABLES IN SCHEMA. |
| 36 | administration__list-users.txt | \du, \du+, and a pg_user CASE query producing role attributes. |
| 37 | administration__password-file-pgpass.txt | .pgpass format, wildcards, first-match ordering, Windows pgpass.conf path, PGPASSFILE, chmod 600. |
| 38 | administration__pg_terminate_backend.txt | pg_terminate_backend(pid, timeout DEFAULT 0) -> boolean semantics; pg_stat_activity long-running query finder; Neon note. |
| 39 | administration__postgres-change-database-owner.txt | ALTER DATABASE ... OWNER TO; alex creates scm, ownership to steve. |
| 40 | administration__psql-commands.txt | 17 psql meta-commands (\c, \l, \dt, \d, \dn, \df, \dv, \du, \g, \s, \i, \?, \h, \timing, \e/\ef, \a/\H, \q). |
| 41 | administration__rename-database.txt | Rename: leave the db, terminate its connections (pg_stat_activity), ALTER DATABASE RENAME TO. |
| 42 | administration__reset-password.txt | Forgotten postgres password: back up pg_hba.conf, switch to trust, restart, ALTER USER ... PASSWORD, restore. |
| 43 | administration__restart-postgresql-windows.txt | Windows restart via services.msc, net stop/start postgresql-x64-16, pg_ctl -D ... restart. Ops click-path; compact. |
| 44 | administration__restart-ubuntu.txt | Ubuntu restart: systemctl / service / `sudo -u postgres pg_ctl restart -D /var/lib/postgresql/16/main`; symlink pg_ctl into PATH. Ops; compact. |
| 45 | administration__restore-database.txt | pg_restore option table; dump -F tar -> drop -> create empty -> pg_restore -d. |
| 46 | administration__revoke.txt | REVOKE priv|ALL ON TABLE t | ALL TABLES IN SCHEMA s FROM role; jim on film/actor. |
| 47 | administration__role-membership.txt | Group roles (NOLOGIN by convention), GRANT group TO role, INHERIT/NOINHERIT, REVOKE group FROM role, no circular membership; alice inherits SELECT on rental. |
| 48 | administration__roles.txt | Roles = users+groups since 8.1; pg_roles incl. predefined pg_* roles; CREATE ROLE attributes (LOGIN, SUPERUSER, CREATEDB, VALID UNTIL, CONNECTION LIMIT); \du attribute strings. |
| 49 | administration__row-level-security.txt | ENABLE ROW LEVEL SECURITY, CREATE POLICY ... TO managers USING (manager = current_user); owner/superuser/BYPASSRLS bypass; FORCE ROW LEVEL SECURITY; hr.departments demo. |
| 50 | administration__schema.txt | Schema = namespace; public schema; search_path "$user", public; current_schema(); SET search_path; USAGE/CREATE on schema; PG15 public CREATE change. |
| 51 | administration__set-role.txt | SET ROLE to a role you are a member of; current_role; "permission denied to set role"; RESET ROLE; lily/marketing. |
| 52 | administration__show-databases.txt | No SHOW DATABASES: \l, \l+, SELECT datname FROM pg_database. |
| 53 | administration__show-tables.txt | No SHOW TABLES: \dt, \dt+ (persistence, access method heap, size), \d actor, pg_catalog.pg_tables columns. |
| 54 | administration__uninstall-postgresql-ubuntu.txt | apt-get --purge remove, dpkg -l, rm -rf /var/lib|log|etc postgresql, deluser postgres. Ops; skip. |
| 55 | administration__uptime.txt | Uptime = date_trunc('second', current_timestamp - pg_postmaster_start_time()). |
| 56 | administration__version.txt | psql --version, SELECT version(), pg_settings server_version. |
| 57 | advanced.txt | Section index (PL/pgSQL, triggers, views, indexes, JSON functions, window functions). Nav only. |
| 69 | cheat-sheet.txt | One-page psql + SQL cheat sheet (roles, DB, tables, views, indexes, queries, set ops, DML, EXPLAIN/ANALYZE); several syntax errors (see Discrepancies). PDF link marketing. |
| 108 | getting-started.txt | Section index: what is PG, sample db, install Win/Linux/macOS, connect, load sample. Nav only. |
| 109 | getting-started__connect-to-postgresql-database.txt | psql -U postgres, session concept, SELECT version()/current_database()/inet_server_addr(),inet_server_port(); pgAdmin click-path (skipped). |
| 110 | getting-started__install-postgresql.txt | Windows EDB installer walkthrough (components, data dir, superuser password, port 5432, locale), add bin to PATH. Click-path; compact. Neon "free cloud" marketing. |
| 111 | getting-started__install-postgresql-linux.txt | Ubuntu: apt.postgresql.org repo, postgresql-16, listen_addresses='*', pg_hba sed edits, ufw 5432, set postgres password, curl+pg_restore dvdrental, count(*)=1000. |
| 112 | getting-started__install-postgresql-macos.txt | macOS installer + pgAdmin restore of dvdrental.tar; note: don't run restore.sql inside the tar with psql (tables but no data). Click-path; compact. |
| 113 | getting-started__load-postgresql-sample-database.txt | CREATE DATABASE dvdrental; pg_restore -U postgres -d dvdrental dvdrental.tar; \dt shows 15 tables; pgAdmin restore (skipped). |
| 114 | getting-started__sample-database.txt | dvdrental inventory: 15 tables, 1 trigger, 7 views, 8 functions, 1 domain, 13 sequences; table list with purposes. |
| 115 | getting-started__what-is-postgresql.txt | What PG is, Berkeley 1986 POSTGRES -> PostgreSQL 1996, use cases (LAPP, OLTP, PostGIS), feature highlights incl. MVCC. |
| 116 | indexes.txt | Book-index analogy; contacts(name) example; build blocks writes not reads; CONCURRENTLY; write overhead; B-tree/Hash/GIN/GiST/SP-GiST/BRIN one-liners; section index. |
| 117 | indexes__create-index.txt | CREATE INDEX [IF NOT EXISTS]; address.phone Seq Scan (cost 15.54) -> Index Scan (cost 0.28..8.29); pg_indexes; implicit PK/FK index names. |
| 118 | indexes__drop-index.txt | DROP INDEX [CONCURRENTLY] [IF EXISTS] ... [CASCADE|RESTRICT]; CONCURRENTLY limits; unused index on tiny actor table -> Seq Scan -> drop. |
| 119 | indexes__full-text-search.txt | FTS pipeline (tokenize, stop words, stemming, rank, highlight); tsvector/tsquery; @@; posts table with generated tsvector; &, |, phrase, NOT; GIN expression index. |
| 120 | indexes__index-on-expression.txt | Functional index: LOWER(last_name) Seq Scan -> CREATE INDEX ON customer(LOWER(last_name)) -> Bitmap Heap/Index Scan. |
| 121 | indexes__index-types.txt | B-tree operators (incl. anchored LIKE/~, ILIKE with non-alpha prefix), Hash (= only, USING HASH), GIN, BRIN (linear sort order), GiST, SP-GiST (non-balanced: GIS, IP routing). |
| 122 | indexes__json-index.txt | GIN on JSONB: jsonb_ops vs jsonb_path_ops, opclass operator table, field-expression GIN; customer_json built from dvdrental joins; 4 EXPLAIN ANALYZE plans. |
| 123 | indexes__list-indexes.txt | pg_indexes (schemaname, tablename, indexname, tablespace, indexdef) queries; \d customer index section. |
| 124 | indexes__multicolumn-indexes.txt | Composite index (max 32 cols; btree/gist/gin/brin), leftmost-column rule; people(last_name, first_name) 10k rows: Bitmap, Index Scan, Seq Scan plans. |
| 125 | indexes__partial-index.txt | CREATE INDEX ... WHERE predicate; customer(active) WHERE active = 0 -> Index Scan using customer_active. |
| 126 | indexes__reindex.txt | REINDEX [(VERBOSE, TABLESPACE, CONCURRENTLY)] {INDEX|TABLE|SCHEMA|DATABASE|SYSTEM}; film verbose output incl. TOAST index; REINDEX vs DROP+CREATE locking. |
| 127 | indexes__unique-index.txt | CREATE UNIQUE INDEX ... NULLS [NOT] DISTINCT; only B-tree; PK/UNIQUE auto-index names; mobile_phone and (work_phone, extension) duplicate-key errors. |
| 286 | triggers.txt | Section index for triggers (row/statement, BEFORE/AFTER per event, INSTEAD OF, TRUNCATE, enable/disable, list, event, WHEN). Nav only. |
| 287 | triggers__after-delete-trigger.txt | AFTER DELETE row trigger with OLD (read-only) archiving into employee_archives. |
| 288 | triggers__after-insert-trigger.txt | AFTER INSERT trigger with NEW: auto-create a 'free' membership for each new member. |
| 289 | triggers__after-update-trigger.txt | AFTER UPDATE OF salary audit into salary_changes; OLD/NEW, TG_NAME/TG_OP/TG_WHEN. |
| 290 | triggers__alter-trigger.txt | ALTER TRIGGER ... ON t RENAME TO; check_salary BEFORE UPDATE (RAISE, SQLSTATE P0001); CREATE OR REPLACE TRIGGER (PG14+) vs DROP+CREATE in a transaction. |
| 291 | triggers__before-delete-trigger.txt | BEFORE DELETE trigger that RAISEs to forbid deletes on products. |
| 292 | triggers__before-insert-trigger.txt | BEFORE INSERT maintaining a running total in inventory_stat (insert-or-update). |
| 293 | triggers__before-truncate-trigger.txt | Statement-level BEFORE TRUNCATE trigger blocking TRUNCATE on companies; TRUNCATE doesn't fire DELETE triggers. |
| 294 | triggers__before-update-trigger.txt | BEFORE UPDATE OF salary rejecting decreases; OLD/NEW and TG_* variables. |
| 295 | triggers__creating-first-trigger-postgresql.txt | Trigger function (no args, RETURNS TRIGGER, TriggerData), CREATE TRIGGER syntax, row vs statement (100-row DELETE), last_name audit example. |
| 296 | triggers__drop-trigger.txt | DROP TRIGGER [IF EXISTS] name ON table [CASCADE|RESTRICT]; trigger names are per-table (vs SQL standard); username_check example. |
| 297 | triggers__enable-triggers.txt | ALTER TABLE ... ENABLE TRIGGER name | ALL. |
| 298 | triggers__event-trigger.txt | Event triggers: ddl_command_start/end, table_rewrite, sql_drop; RETURNS EVENT_TRIGGER; TG_EVENT/TG_TAG audit table; regular vs event trigger comparison. |
| 299 | triggers__how-to-list-all-triggers-in-postgresql.txt | information_schema.triggers (GROUP BY because one row per event), get_triggers() wrappers, pg_trigger columns, \dS table. |
| 300 | triggers__instead-of-triggers.txt | INSTEAD OF INSERT/UPDATE/DELETE trigger on a join view employee_salaries routing writes with TG_OP; ON DELETE CASCADE cleanup. |
| 301 | triggers__introduction-postgresql-trigger.txt | What/why/when triggers; row (20x) vs statement (1x); BEFORE can skip/modify row; drawback = hidden logic; PG vs SQL-standard differences. |
| 302 | triggers__managing-postgresql-trigger.txt | ALTER TABLE ... DISABLE TRIGGER name | ALL. |
| 303 | triggers__trigger-when-condition.txt | WHEN (OLD.status <> 'completed' AND NEW.status = 'completed') on AFTER UPDATE; orders/customer_stats example. |
| 410 | views.txt | View = named stored query over base tables, rewritten at query time; matviews store data; advantages (simplify, security, logical independence); section index. |
| 411 | views__alter-view.txt | ALTER VIEW RENAME TO / SET (check_option, security_barrier, security_invoker) / RENAME COLUMN / SET SCHEMA; film_type -> film_rating -> web.film_rating. |
| 412 | views__drop-view.txt | DROP VIEW [IF EXISTS] a, b [CASCADE|RESTRICT]; film_info / horror_film dependency error and "drop cascades to view". |
| 413 | views__list-views.txt | \dv, information_schema.views, pg_matviews (ispopulated, definition). |
| 414 | views__managing-postgresql-views.txt | CREATE VIEW contact / customer_info (4-table join) / customer_usa (view on view); CREATE OR REPLACE VIEW; \d+ shows stored definition. |
| 415 | views__materialized-views.txt | CREATE MATERIALIZED VIEW ... WITH [NO] DATA; "has not been populated" error; REFRESH; CONCURRENTLY needs UNIQUE index; rental_by_category. |
| 416 | views__recursive-view.txt | CREATE RECURSIVE VIEW name(cols) = sugar for WITH RECURSIVE; employees reporting_line ("Michael North > Megan Berry > ..."). |
| 417 | views__updatable-views.txt | Auto-updatable view rules (one FROM item; no GROUP BY/HAVING/LIMIT/OFFSET/DISTINCT/WITH/set ops; no aggregates/window/SRF); cities/city_us INSERT/UPDATE/DELETE. |
| 418 | views__views-with-check-option.txt | WITH [LOCAL|CASCADED] CHECK OPTION; fte / fte_1 employees example; "new row violates check option for view" errors. |

## Teaching material by topic

### Databases as containers: CREATE / ALTER / copy  [M1]  (source: administration__create-database.txt, administration__alter-database.txt, administration__copy-database.txt)
- Angle: "a database is a container for tables, indexes, views". Every new database is a *clone* of a template
  (template1 by default) — this is the hook to teach that CREATE DATABASE is a file-level copy, and why copying a
  database with `WITH TEMPLATE` fails when someone is connected to the source.
- Option list as taught (PG18 adds STRATEGY, LOCALE_PROVIDER, ICU_LOCALE, OID, etc. — see official notes):
  ```sql
  CREATE DATABASE hr WITH ENCODING = 'UTF8' CONNECTION LIMIT = 100;
  -- defaults: OWNER = executing role, TEMPLATE = template1, LC_COLLATE/LC_CTYPE/TABLESPACE = template's,
  -- CONNECTION LIMIT = -1 (unlimited), ALLOW_CONNECTIONS false => nobody can connect,
  -- IS_TEMPLATE true => any CREATEDB role can clone it; false => only superuser or owner.
  SELECT datname FROM pg_database;          -- alternative to \l
  ```
- ALTER DATABASE five forms: `WITH option` (IS_TEMPLATE, CONNECTION LIMIT, ALLOW_CONNECTIONS), `RENAME TO`,
  `OWNER TO {role|current_user|session_user}`, `SET TABLESPACE`, `SET param = value` (per-database session default
  that overrides postgresql.conf for subsequent sessions). Demo: `ALTER DATABASE testhrdb SET escape_string_warning = off;`
- Rename rule: you cannot rename the database you are connected to — connect elsewhere first.
- Copy within a server (production tip: duplicate a DB for testing):
  ```sql
  CREATE DATABASE dvdrental_test WITH TEMPLATE dvdrental;
  -- ERROR:  source database "dvdrental" is being accessed by other users
  -- DETAIL:  There is 1 other session using the database.
  SELECT pid, usename, client_addr FROM pg_stat_activity WHERE datname = 'dvdrental';
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'dvdrental';
  ```
- Cross-server copy: big DB / slow link -> `pg_dump -f file`, ship file, `CREATE DATABASE`, `psql -d targetdb -f file`;
  small DB / fast link -> `pg_dump -C -h localhost -U postgres dvdrental | psql -h remote -U postgres dvdrental`.
- Pitfall: on PGlite there is one database; these are "read the output" lessons, not playground ones.

### Schemas  [M1]  (source: administration__create-schema.txt, administration__alter-schema.txt)
- `CREATE SCHEMA [IF NOT EXISTS] name;` needs CREATE privilege on the database.
  `CREATE SCHEMA AUTHORIZATION john;` creates a schema *named john* owned by john;
  `CREATE SCHEMA IF NOT EXISTS doe AUTHORIZATION john;` names and owner differ.
- Schema with embedded objects — subcommands have no semicolons between them (runnable on PG18/PGlite):
  ```sql
  CREATE SCHEMA scm
      CREATE TABLE deliveries(
          id SERIAL NOT NULL,
          customer_id INT NOT NULL,
          ship_date DATE NOT NULL)
      CREATE VIEW delivery_due_list AS
          SELECT id, ship_date FROM deliveries WHERE ship_date <= CURRENT_DATE;
  ```
- `ALTER SCHEMA s RENAME TO n;` (owner + CREATE on db) and `ALTER SCHEMA s OWNER TO {role|CURRENT_USER|SESSION_USER};`
- Catalog peek used: `SELECT * FROM pg_catalog.pg_namespace WHERE nspacl IS NULL AND nspname NOT LIKE 'pg_%' ORDER BY nspname;`
  (nspowner = 10 shown as "postgres" — bootstrap superuser OID 10; good M1 tidbit).

### Tablespaces  [M1, M2]  (source: administration__create-tablespace.txt, administration__alter-tablespace.txt)
- Angle: "a logical name mapped to a physical directory". Two built-ins: `pg_default` (user data) and `pg_global`
  (cluster-wide/shared catalogs). Two motivations: disk ran out on the init partition; put hot indexes/tables on SSD
  and archive data on slow disks.
- `CREATE TABLESPACE ts_primary [OWNER u] LOCATION '/abs/empty/dir';` — dir must exist, be empty, owned by the OS
  postgres user; names starting `pg_` reserved. Then use `TABLESPACE ts` in CREATE DATABASE / TABLE / INDEX.
- `\db` / `\db+` (size, privileges). `ALTER TABLESPACE t RENAME TO / OWNER TO / SET (param = value)`; superuser or owner.
- Lesson link to M2: tablespace directory -> `pg_tblspc/<oid>` symlink -> relfilenode files. Not runnable in PGlite.

### Roles, attributes, superuser, passwords  [M1]  (source: administration__alter-role.txt, administration__create-superuser-postgresql.txt, administration__change-password.txt, administration__current_user.txt)
- Attribute menu (pairs): SUPERUSER, CREATEDB, CREATEROLE, INHERIT, LOGIN, REPLICATION, BYPASSRLS, plus
  `CONNECTION LIMIT n` (-1 = unlimited), `PASSWORD 'x' | PASSWORD NULL`, `VALID UNTIL 'timestamp'`.
- Who can change what (tutorial's summary): superusers -> anything on anyone; CREATEROLE -> non-superuser,
  non-replication roles; ordinary roles -> only their own password.
- "A superuser bypasses all permission checks except the right to log in" — `CREATE ROLE spiderman SUPERUSER;`
  without LOGIN cannot connect. Good quiz question.
- Renaming the role you're logged in as: `ERROR:  session user cannot be renamed`.
- Per-role / per-role-per-db session defaults:
  ```sql
  ALTER ROLE elephant IN DATABASE dvdrental SET client_min_messages = NOTICE;
  ALTER ROLE ALL SET ...;   -- superuser only
  ```
- Password expiry: `ALTER ROLE bob VALID UNTIL 'December 31, 2050';` — \du shows "Password valid until ...".
  Omit VALID UNTIL => never expires.
- Pitfall: `ALTER ROLE ... PASSWORD 'x'` sends cleartext and can land in psql history / server log. Fix (from
  official docs): use psql `\password`, which sends a pre-hashed (SCRAM) password.
- CURRENT_USER vs SESSION_USER (runnable in PGlite if CREATE ROLE is allowed):
  ```sql
  CREATE ROLE bob WITH LOGIN PASSWORD 'SecurePass1';
  SET ROLE bob;
  SELECT current_user, session_user;   -- bob | postgres
  RESET ROLE;
  ```

### Logical backup with pg_dump / pg_dumpall  [M7]  (source: administration__backup-database.txt, administration__copy-database.txt)
- Frames logical vs physical backup; pg_dump = snapshot of one database as of dump start; pg_dumpall = whole cluster
  incl. globals (roles, tablespaces).
- Examples: `pg_dump -U postgres -d dvdrental -F tar -f d:\backup\dvdrental.tar`;
  `pg_dumpall -U postgres > all_databases.sql`; `pg_dumpall --schema-only`, `--roles-only`, `--tablespaces-only`.
- Production tips: store the backup on a different server; automate with a password file (`.pgpass` /
  `%APPDATA%\postgresql\pgpass.conf`), line format `hostname:port:database:username:password`, `*` wildcard
  (`localhost:5432:*:postgres:SecurePass1`); schedule with cron / Task Scheduler; timestamped filenames
  (`$PGDATABASE_$(date +%Y-%m-%d)_$(date +%H%M).sql`).
- Schema-only dumps for promoting DDL from test to live without moving test data.

### Measuring object sizes  [M2]  (source: administration__database-indexes-table-size.txt)
- Progression: one table's heap (`pg_relation_size`) -> heap+indexes+TOAST (`pg_total_relation_size`) -> indexes only
  (`pg_indexes_size`) -> database -> tablespace -> a single value (`pg_column_size`). Always wrap in `pg_size_pretty`.
- dvdrental figures: actor heap 16384 bytes (= 2 x 8KB pages — use it to introduce the 8KB page in M2), actor total
  72 kB, actor indexes 32 kB; db 15 MB; pg_default 48 MB.
- Top-N biggest tables query (runnable on PGlite):
  ```sql
  SELECT relname AS relation, pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
  FROM pg_class c LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE nspname NOT IN ('pg_catalog','information_schema')
    AND c.relkind <> 'i' AND nspname !~ '^pg_toast'
  ORDER BY pg_total_relation_size(c.oid) DESC LIMIT 5;
  ```
- Value-size demo — strong M2 opener:
  ```sql
  SELECT pg_column_size(5::smallint) AS smallint_size,   -- 2
         pg_column_size(5::int)      AS int_size,        -- 4
         pg_column_size(5::bigint)   AS bigint_size;     -- 8
  ```
  Extend in-lesson: `pg_column_size('abc'::text)` (4 = 1-byte short varlena header + 3), `pg_column_size(repeat('x',3000))`
  vs after insert into a table (compression/TOAST).
- Production tip: list biggest relations before capacity planning; sizes include dead tuples (link to VACUUM, M7).

### Describing tables  [M1]  (source: administration__describe-table.txt, administration__psql-commands.txt)
- Angle for MySQL migrants: "PostgreSQL has no DESCRIBE" -> `\d table` / `\d+ table`, or SQL against
  `information_schema.columns` (column_name, data_type, character_maximum_length, is_nullable, column_default).
  Note information_schema reports domains/enums as `USER-DEFINED`, arrays as `ARRAY`, and `year` (a dvdrental domain)
  as its base `integer`; varchar(255) -> data_type `character varying` + character_maximum_length 255.
- The `\d film` output is a great "anatomy of a table" visual: columns + defaults (nextval sequence, now()),
  Indexes (btree PK, gist on tsvector), FKs with ON UPDATE CASCADE ON DELETE RESTRICT, "Referenced by", Triggers
  (`tsvector_update_trigger(...)` BEFORE INSERT OR UPDATE; `last_updated()` BEFORE UPDATE).
- PGlite has no psql: the app should ship a SQL equivalent of \d built on information_schema / pg_catalog.
- psql cheat list worth a sidebar: `\c db user`, `\l`, `\dt`, `\d`, `\dn`, `\df`, `\dv`, `\du`, `\g` (re-run last
  query), `\s [file]` (history), `\i file`, `\?`, `\h ALTER TABLE`, `\timing`, `\e`, `\ef fn`, `\a`, `\H`, `\q`;
  SSL: `psql -U user -h host "dbname=db sslmode=require"`.

### Dropping things and the dependency graph  [M1]  (source: administration__drop-database.txt, administration__drop-schema.txt, administration__drop-tablespace.txt, administration__drop-role.txt)
- Common teaching thread: every DROP either refuses because something depends on it, or you opt into CASCADE/FORCE.
  This is pg_depend / pg_shdepend in action (link to official notes).
- DROP DATABASE: cannot be rolled back; removes catalog entry and data directory; owner (or superuser) only; cannot
  drop the db you're connected to; `IF EXISTS` -> `NOTICE: database "x" does not exist, skipping`;
  with other sessions -> `ERROR: database "test" is being accessed by other users / DETAIL: There is 1 other session
  using the database.`; `DROP DATABASE test WITH (FORCE);` terminates them (PG13+). `dropdb` wraps the SQL.
- DROP SCHEMA: default RESTRICT. Error text worth showing verbatim:
  ```
  ERROR:  cannot drop schema scm because other objects depend on it
  DETAIL:  table scm.deliveries depends on schema scm
  view scm.delivery_due_list depends on schema scm
  HINT:  Use DROP ... CASCADE to drop the dependent objects too.
  SQL state: 2BP01
  ```
  Multiple at once: `DROP SCHEMA IF EXISTS finance, marketing;`
- DROP TABLESPACE: `ERROR: tablespace "demo_ts" is not empty` -> drop the database using it or
  `ALTER DATABASE demodb SET TABLESPACE pg_default;` first.
- DROP ROLE recipe (repeat in EVERY database where the role owns objects or has privileges, because REASSIGN OWNED /
  DROP OWNED only see the current database):
  ```sql
  REASSIGN OWNED BY alice TO postgres;
  DROP OWNED BY alice;     -- also revokes privileges granted to alice in this db
  DROP ROLE alice;
  ```
  Error before the recipe: `ERROR: role "alice" cannot be dropped because some objects depend on it /
  DETAIL: privileges for database sales / 3 objects in database sales`.
  PGlite-runnable variant: create role, `GRANT ... TO alice`, `SET ROLE alice; CREATE TABLE ...; RESET ROLE;` then try
  DROP ROLE and watch it fail.

### GRANT basics and the "LOGIN can't do anything" moment  [M1]  (source: administration__grant.txt, administration__list-users.txt)
- Angle: a login role starts with nothing on others' objects. Progression: `SELECT` -> `permission denied for table
  candidates` -> `GRANT SELECT` -> empty result -> `INSERT` denied -> `GRANT INSERT, UPDATE, DELETE` -> works.
- Note for lesson writers: in the tutorial the INSERT works after granting INSERT only on the table because the
  column is `GENERATED ALWAYS AS IDENTITY` (identity sequence usage is implicit) — with `SERIAL` the user would also
  need `USAGE` on the sequence. Good pitfall to teach.
  ```sql
  CREATE TABLE candidates (
    candidate_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name varchar(100) NOT NULL, last_name varchar(100) NOT NULL,
    email varchar(255) NOT NULL UNIQUE, phone varchar(25) NOT NULL);
  CREATE ROLE joe LOGIN PASSWORD 'x';
  SET ROLE joe; SELECT * FROM candidates;  -- ERROR: permission denied for table candidates
  RESET ROLE; GRANT SELECT ON candidates TO joe;
  ```
- Bulk forms: `GRANT ALL ON ALL TABLES IN SCHEMA public TO joe;` / `GRANT SELECT ON ALL TABLES IN SCHEMA public TO reader;`
  Pitfall (not in tutorial; official): ON ALL TABLES affects only existing tables — use `ALTER DEFAULT PRIVILEGES` for
  future ones; read-only users also need `USAGE` on any non-public schema (PUBLIC keeps USAGE on `public`, but since
  PG15 PUBLIC no longer has CREATE on `public`).
- Listing roles via SQL: `pg_catalog.pg_user` (usename, usesuper, usecreatedb) — it shows only LOGIN roles; `pg_roles`
  shows all roles.

### Connections: pg_stat_activity and pg_terminate_backend  [M1, M7]  (source: administration__pg_terminate_backend.txt, administration__rename-database.txt, administration__copy-database.txt)
- `pg_terminate_backend(pid integer, timeout bigint DEFAULT 0) -> boolean`: without timeout returns true once the
  SIGTERM is *sent*; with timeout (ms) returns true if the process actually exited, false on timeout.
- Long-running-query finder (good monitoring snippet):
  ```sql
  SELECT pid, usename, client_addr, application_name, state, query, now() - query_start AS duration
  FROM pg_stat_activity WHERE state <> 'idle' ORDER BY duration DESC;
  ```
- Rename workflow: `\c postgres` -> inspect `pg_stat_activity WHERE datname='db'` -> warn app owners -> terminate ->
  `ALTER DATABASE db RENAME TO newdb;`.
- M1 tie-in: each row of pg_stat_activity is one backend process forked by the postmaster; terminating it kills one
  connection only. In PGlite, pg_stat_activity has a single backend — show it, explain the multi-process reality.

### Password file and authentication recovery  [M1]  (source: administration__password-file-pgpass.txt, administration__reset-password.txt)
- `.pgpass` line: `hostname:port:database:username:password`; `*` wildcard per field; **first match wins** so put
  specific lines before wildcard ones; Unix `~/.pgpass` must be `chmod 600` (else ignored); Windows
  `%APPDATA%\postgresql\pgpass.conf`; override location with `PGPASSFILE`. Used by every libpq tool (psql, pg_dump,
  pg_restore), enabling unattended backups.
- Reset forgotten postgres password: back up `pg_hba.conf`, change METHOD scram-sha-256 -> `trust` for local host
  lines (127.0.0.1/32, ::1/128), restart (or reload), `psql -U postgres`, `ALTER USER postgres WITH PASSWORD '...';`,
  restore pg_hba.conf, restart. Teaching value: shows pg_hba.conf columns TYPE / DATABASE / USER / ADDRESS / METHOD.

### Server lifecycle commands  [M1]  (source: administration__restart-postgresql-windows.txt)
- Windows service name `postgresql-x64-<version>`; `net stop/start postgresql-x64-16`;
  `pg_ctl -D "C:\Program Files\PostgreSQL\16\data" restart`. M1 note: pg_ctl talks to the postmaster via
  postmaster.pid + signals; `restart` = stop (default mode fast) + start.

### Restore with pg_restore  [M7]  (source: administration__restore-database.txt, administration__backup-database.txt)
- Round-trip lesson: `pg_dump -U postgres -d dvdrental -F tar -f dvdrental.tar` -> `DROP DATABASE dvdrental;` ->
  `CREATE DATABASE dvdrental;` (empty) -> `pg_restore -U postgres -d dvdrental dvdrental.tar` -> `\dt`.
- Useful pg_restore options: `-d` target db, `-c` clean first, `-C` create db, `-e` exit on error, `-j N` parallel
  jobs (custom/directory formats), `-n` schema / `-t` table filters, `-L listfile` (edit `pg_restore -l` output to
  cherry-pick objects), `-F` input format.
- Key distinction to teach: plain-SQL dumps (pg_dump default, all pg_dumpall output) are restored with `psql -f`;
  archive formats (custom `-Fc`, directory `-Fd`, tar `-Ft`) need pg_restore. Production: prefer `-Fc`/`-Fd` for
  selective + parallel restore.

### Group roles, membership, SET ROLE, REVOKE  [M1]  (source: administration__roles.txt, administration__role-membership.txt, administration__set-role.txt, administration__revoke.txt)
- Angle: "PostgreSQL has no users, only roles" (unified in 8.1). Login role = user; role containing roles = group.
  Roles are cluster-wide (valid in every database).
- `\du` attribute strings to recognise: `Cannot login`, `Superuser, Create role, Create DB, Replication, Bypass RLS`
  (postgres), `Create DB`, `1000 connections`, `Password valid until 2050-01-01 00:00:00+07`.
- `SELECT rolname FROM pg_roles;` lists predefined roles (PG16 output in tutorial): pg_database_owner,
  pg_read_all_data, pg_write_all_data, pg_monitor, pg_read_all_settings, pg_read_all_stats, pg_stat_scan_tables,
  pg_read_server_files, pg_write_server_files, pg_execute_server_program, pg_signal_backend, pg_checkpoint,
  pg_use_reserved_connections, pg_create_subscription. (PG18 adds pg_maintain [PG17] and
  pg_signal_autovacuum_worker [PG18] — cross-check against official slice.)
- Membership mnemonic: "group first, member second": `GRANT sales TO alice;` / `REVOKE sales FROM alice;`.
  INHERIT (default) => alice automatically uses sales' privileges; NOINHERIT => must `SET ROLE sales` to use them.
  Circular membership is rejected.
- `CREATE ROLE lily WITH LOGIN PASSWORD 'x' IN ROLE marketing;` adds membership at creation.
- SET ROLE demo (PGlite-friendly, single session as superuser):
  ```sql
  CREATE ROLE marketing;
  CREATE TABLE film (film_id int PRIMARY KEY, title text);
  GRANT SELECT ON film TO marketing;
  CREATE ROLE lily LOGIN IN ROLE marketing;
  SET ROLE lily;      SELECT current_role;          -- lily
  SET ROLE marketing; SELECT current_role;          -- marketing (lily is a member)
  SET ROLE postgres;  -- ERROR:  permission denied to set role "postgres"
  RESET ROLE;
  ```
  (Note: after SET ROLE lily, a further SET ROLE is checked against the *session* user, which is superuser in PGlite,
  so the postgres switch would actually succeed in PGlite. To reproduce the error, log in as lily — or explain.)
- REVOKE: `REVOKE SELECT ON actor FROM jim;` `REVOKE ALL ON film FROM jim;`
  `REVOKE ... ON ALL TABLES IN SCHEMA s FROM role;`

### Row-level security  [M6, M1]  (source: administration__row-level-security.txt)
- Two steps: `ALTER TABLE t ENABLE ROW LEVEL SECURITY;` then `CREATE POLICY name ON t [TO role] USING (cond);`.
  Bypassers: superusers, BYPASSRLS roles, and the table owner (unless `ALTER TABLE t FORCE ROW LEVEL SECURITY;`).
- Worked example (runnable in PGlite with SET ROLE instead of separate logins):
  ```sql
  CREATE TABLE departments(
     id serial PRIMARY KEY,
     name varchar(255) NOT NULL UNIQUE,
     manager varchar(255) NOT NULL);
  INSERT INTO departments(name, manager) VALUES ('Sales','alice'),('Marketing','bob'),('IT','jack');
  CREATE ROLE managers;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO managers;
  CREATE ROLE alice LOGIN IN ROLE managers;
  CREATE ROLE bob   LOGIN IN ROLE managers;
  CREATE ROLE jack  LOGIN IN ROLE managers;
  ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
  CREATE POLICY department_managers ON departments TO managers USING (manager = current_user);
  SET ROLE alice; SELECT * FROM departments;   -- 1 | Sales | alice
  SET ROLE bob;   SELECT * FROM departments;   -- 2 | Marketing | bob
  RESET ROLE;     SELECT * FROM departments;   -- superuser: all 3 rows
  ```
- Visualizer: a table where rows fade out per current role; show the policy predicate being ANDed into the WHERE
  clause (EXPLAIN shows the filter). Pitfall to add: RLS enabled + no policy = default-deny (zero rows) for
  non-owners; INSERT/UPDATE need WITH CHECK (USING doubles as check if omitted).

### Schemas and search_path  [M1]  (source: administration__schema.txt)
- Analogy: schema = folder/namespace inside one database; a schema belongs to exactly one database; same table name
  can exist in two schemas (`public.staff`, `sales.staff`). Use cases: logical grouping; multiple users/apps sharing
  one db without collisions.
- search_path walkthrough (runnable on PGlite):
  ```sql
  SELECT current_schema();      -- public
  SHOW search_path;             -- "$user", public
  CREATE SCHEMA sales;
  SET search_path TO sales, public;
  CREATE TABLE staff(staff_id serial PRIMARY KEY, first_name varchar(45) NOT NULL,
                     last_name varchar(45) NOT NULL, email varchar(100) NOT NULL UNIQUE);  -- lands in sales
  SELECT * FROM staff;          -- = sales.staff
  SELECT * FROM public.staff;   -- must qualify (errors if none)
  ```
  Rules taught: first match wins; no match -> error even if the name exists in a schema not on the path; first
  existing schema in the path is the "current schema" and receives unqualified CREATEs; `"$user"` = schema named
  after current user (skipped if absent). `public` is not special — it can be dropped.
- Privileges: `GRANT USAGE ON SCHEMA s TO r;` (look up objects), `GRANT CREATE ON SCHEMA s TO r;` (create in it).
  Until PG14 every user had CREATE+USAGE on public; PG15+ only USAGE (public owned by pg_database_owner).
- Visualizer: animate name resolution walking the search_path list left to right.

### Listing databases / tables / version / uptime  [M1]  (source: administration__show-databases.txt, administration__show-tables.txt, administration__uptime.txt, administration__version.txt, administration__list-users.txt)
- MySQL-migrant framing again: no SHOW DATABASES / SHOW TABLES; use catalogs:
  ```sql
  SELECT datname FROM pg_database;
  SELECT * FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema');
  -- pg_tables cols: schemaname, tablename, tableowner, tablespace, hasindexes, hasrules, hastriggers, rowsecurity
  SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) AS uptime;  -- e.g. 6 days 07:39:24
  SELECT version();
  SELECT setting FROM pg_settings WHERE name = 'server_version';   -- also: SHOW server_version; server_version_num
  ```
- `\dt+` adds Persistence (permanent/unlogged/temporary), Access method (`heap` — the table AM; nice M2 hook), Size.
  Note tiny tables show `8192 bytes` = exactly one page (category, country, language, store) — perfect M2 hook.
- `\l` shows Locale Provider (libc/icu/builtin), ICU Locale/Rules, and ACL strings like `=c/postgres` and
  `postgres=CTc/postgres` (C = CREATE, T = TEMPORARY, c = CONNECT) — decode in an ACL lesson.
- pg_postmaster_start_time() is the postmaster (M1) start; PGlite returns its own boot time.

### Cheat sheet (quick reference)  [M1, M3]  (source: cheat-sheet.txt)
- Useful as a lesson-index appendix: psql (`\c`, `\l`, `\dn`, `\df`, `\df+ fn`, `\dv`, `\dt`, `\dt+`, `\d+ t`, `\x`
  expanded output, `\du`), roles (`CREATE ROLE`, `SET ROLE`, `GRANT role_2 TO role_1`), DDL (ADD/DROP/RENAME
  COLUMN, SET/DROP DEFAULT, ADD PRIMARY KEY, DROP CONSTRAINT, RENAME TO, DROP TABLE ... CASCADE), views (OR REPLACE,
  RECURSIVE, MATERIALIZED ... WITH [NO] DATA, REFRESH ... CONCURRENTLY), indexes, SELECT clauses, joins (inner,
  left, full outer, cross, natural), set ops, DML, `EXPLAIN`, `EXPLAIN ANALYZE`, `ANALYZE t`.
- Contains several broken lines; do not copy verbatim (see Discrepancies).

### Getting started: sessions, first queries, the sample database  [M1]  (source: getting-started__*.txt)
- "Connecting grants you a session — long-lived, many requests, then disconnect" (M1 hook: one session = one backend).
  `postgres=#` prompt: `postgres` is the default database; `#` = superuser (vs `>`).
- First-query trio (all PGlite-runnable):
  ```sql
  SELECT version();
  SELECT current_database();
  SELECT inet_server_addr(), inet_server_port();   -- 127.0.0.1 | 5432 (NULL over Unix socket / in PGlite)
  ```
- Install facts worth a sidebar: default port 5432; installer asks for superuser `postgres` password; data directory
  chosen at install (`C:\Program Files\PostgreSQL\16\data`, Debian `/var/lib/postgresql/16/main`, config in
  `/etc/postgresql/16/main/`); Linux distro packages recommended for automatic patching; `postgresql-contrib`
  ships the extensions.
- Remote access recipe (Ubuntu): `listen_addresses = '*'` in postgresql.conf + a `host all all 0.0.0.0/0 ...` line
  in pg_hba.conf + restart + firewall `ufw allow 5432/tcp`. Teach the two-layer model: listen_addresses decides which
  interfaces the postmaster binds; pg_hba.conf decides who may authenticate. (Tutorial uses md5 and `trust` for
  local — see Discrepancies; recommend scram-sha-256.)
- dvdrental: 15 tables (actor, film, film_actor, category, film_category, store, inventory, rental, payment, staff,
  customer, address, city, country, language), 1 trigger (function `last_updated`, attached to many tables), 7 views,
  8 functions, 1 domain (`year`), 13 sequences; `film` has 1000 rows, `rental` 16044. It is a pg_dump tar archive:
  `CREATE DATABASE dvdrental;` then `pg_restore -U postgres -d dvdrental dvdrental.tar`. Pitfall: running the
  `restore.sql` inside the tar with psql creates tables but loads no data.
- PGlite note: dvdrental is too big to embed comfortably (~15 MB); lessons should use small hand-made schemas
  (see Reusable sample schemas) that mimic its shape (actor/film/film_actor/customer/rental/payment).
- History blurb: POSTGRES started 1986 at UC Berkeley (successor to Ingres), renamed PostgreSQL 1996; pronounced
  "post-gres-Q-L". Feature list mentions MVCC, savepoints, table inheritance, user-defined types, extensibility (types,
  index types, languages).

### Why indexes: the book-index analogy and write overhead  [M4]  (source: indexes.txt, indexes__create-index.txt)
- Analogy progression: (1) finding "John Doe" without an index = reading the whole book; (2) CREATE INDEX = building
  the book's index (takes longer for a thicker book); (3) every INSERT/UPDATE/DELETE must also update the index
  (editing the book means editing its index) => faster reads, slower writes.
- Locking during build: plain CREATE INDEX allows SELECT but blocks INSERT/UPDATE/DELETE (SHARE lock);
  `CREATE INDEX CONCURRENTLY` doesn't block writes but is slower.
- Before/after EXPLAIN demo (dvdrental address, 603 rows):
  ```
  Seq Scan on address  (cost=0.00..15.54 rows=1 width=45)
    Filter: ((phone)::text = '223664661973'::text)
  -- CREATE INDEX idx_address_phone ON address(phone);
  Index Scan using idx_address_phone on address  (cost=0.28..8.29 rows=1 width=45)
    Index Cond: ((phone)::text = '223664661973'::text)
  ```
  Teaching points: `Filter` (checked per row after fetch) vs `Index Cond` (used to descend the tree); cost 15.54 vs
  8.29; the `(phone)::text` cast shows varchar is compared as text.
- `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'address';` reveals `address_pkey`
  (`CREATE UNIQUE INDEX ... USING btree (address_id)`, auto-created by PRIMARY KEY) and `idx_fk_city_id`.
  Pitfall: the tutorial implies the FK index was "created implicitly" — PostgreSQL does NOT auto-index foreign keys;
  dvdrental's author created it explicitly. Great myth-busting moment.
- Index type one-liners (for an M4 overview card): B-tree default, sorted, equality + range; Hash: 32-bit hash
  codes, `=` only; GIN: inverted index, one entry per component (arrays, JSONB, FTS); GiST: geometric/FTS,
  nearest-neighbour; SP-GiST: space-partitioned, non-overlapping regions, hierarchical data; BRIN: page-range
  summaries for very large naturally ordered tables, tiny.

### When the planner ignores your index; DROP INDEX  [M4]  (source: indexes__drop-index.txt)
- `EXPLAIN SELECT * FROM actor WHERE first_name = 'John';` -> `Seq Scan on actor (cost=0.00..4.50 rows=1 width=25)`
  despite idx_actor_first_name: the 200-row table fits in 2 pages, so a seq scan is cheaper. Lesson: small tables
  rarely use indexes; demonstrate with PGlite by growing the table with generate_series and re-running EXPLAIN.
- `DROP INDEX [CONCURRENTLY] [IF EXISTS] name [, ...] [CASCADE | RESTRICT];` RESTRICT default. Plain DROP INDEX
  takes an ACCESS EXCLUSIVE lock on the table; CONCURRENTLY avoids blocking but: no CASCADE, not in a transaction
  block (and only one index name).
- Production tip: find unused indexes (pg_stat_user_indexes.idx_scan = 0) and drop them to cut write overhead.

### Expression (functional) indexes  [M4]  (source: indexes__index-on-expression.txt)
- Progression: index on last_name works for `last_name = 'Purdy'` (Index Scan using idx_last_name,
  cost=0.28..8.29) but not for `LOWER(last_name) = 'purdy'` (Seq Scan, cost=0.00..17.98, Filter: lower(...)).
  Fix: `CREATE INDEX idx_ic_last_name ON customer(LOWER(last_name));` -> Bitmap Heap Scan + Bitmap Index Scan
  on idx_ic_last_name with `Recheck Cond`.
- Rule: the query expression must match the index expression exactly; used in WHERE and ORDER BY. Cost: expression
  evaluated on every INSERT/UPDATE. Note `rows=3` estimate (default selectivity) — after `ANALYZE`, PG collects
  statistics on the indexed expression (link to M4 statistics lesson).
- PGlite playground:
  ```sql
  CREATE TABLE customer (customer_id serial PRIMARY KEY, first_name text, last_name text);
  INSERT INTO customer(first_name, last_name)
    SELECT 'First'||g, (ARRAY['Purdy','Smith','Jones','Brown','Lee'])[1+g%5]||g%120 FROM generate_series(1,600) g;
  CREATE INDEX idx_last_name ON customer(last_name);
  ANALYZE customer;
  EXPLAIN SELECT * FROM customer WHERE lower(last_name) = 'purdy0';   -- Seq Scan
  CREATE INDEX idx_ic_last_name ON customer(lower(last_name));
  ANALYZE customer;
  EXPLAIN SELECT * FROM customer WHERE lower(last_name) = 'purdy0';   -- Bitmap/Index Scan on idx_ic_last_name
  ```

### Full-text search basics  [M6, M4]  (source: indexes__full-text-search.txt)
- Pipeline explained as five stages: indexing (tsvector), text analysis (tokenize -> drop stop words -> stem),
  querying (tsquery + operators), ranking (`ts_rank`), highlighting (snippets; `ts_headline`).
- Lexeme demos (PGlite-runnable; default_text_search_config is usually english):
  ```sql
  SELECT to_tsvector('watches'), to_tsvector('watched'), to_tsvector('watching');  -- 'watch':1 x3
  SELECT to_tsvector('The quick brown fox jumps over the lazy dog.');
  -- 'brown':3 'dog':9 'fox':4 'jump':5 'lazy':8 'quick':2   (sorted, positions kept, stop words the/over dropped)
  SELECT to_tsquery('jumping');                                             -- 'jump'
  SELECT to_tsvector('The quick brown fox jumps over the lazy dog.') @@ to_tsquery('jumping');  -- t
  SELECT to_tsvector('The quick brown fox jumps over the lazy dog.') @@ to_tsquery('cat');      -- f
  ```
  Positions keep counting through dropped stop words ('quick':2 because 'The' was position 1).
- Stored generated tsvector column pattern:
  ```sql
  CREATE TABLE posts(
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     body TEXT,
     body_search TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', body)) STORED);
  ```
  Expected stems: 'featur', 'advanc', 'delv', 'effici', 'manipul', 'techniqu', 'databas', 'explor', 'optim',
  'strategi' — shows that stems aren't dictionary words.
  Results: `@@ to_tsquery('PostgreSQL')` -> 3 rows; `'PostgreSQL & techniques'` -> id 2; `'efficient | optimization'`
  -> ids 2,3 (because "optimizing" and "efficiency" stem to the same lexemes); phrase `'''PostgreSQL technique'''`
  -> id 2; `NOT body_search @@ to_tsquery('efficient')` -> id 1.
- Alternative: expression GIN index without a stored column:
  ```sql
  CREATE INDEX body_fts ON posts USING GIN ((to_tsvector('english', body)));
  SELECT id, body FROM posts WHERE to_tsvector('english', body) @@ to_tsquery('basic | advanced');  -- ids 1,2
  ```
  Pitfall: the WHERE expression must use the 2-argument `to_tsvector('english', ...)` to match the index; the
  1-arg form depends on default_text_search_config and is not IMMUTABLE, so cannot be indexed.
- Production trade-off for lesson: stored generated column (costs disk, simpler queries, index the column) vs
  expression index (no extra column, must repeat the expression).

### Index types and which operators each can serve  [M4]  (source: indexes__index-types.txt, indexes.txt)
- B-tree is considered for `<  <=  =  >=  >  BETWEEN  IN  IS NULL  IS NOT NULL` (tutorial omits `>`), plus
  `LIKE 'foo%'` and `~ '^foo'` when the pattern is a constant anchored at the start (requires C collation or a
  `text_pattern_ops` index in non-C locales — official caveat the tutorial skips), and `ILIKE`/`~*` only if the
  pattern starts with non-alphabetic characters.
- Hash: `CREATE INDEX idx ON t USING HASH (col);` — equality only.
- GIN: multi-valued columns (hstore, arrays, jsonb, ranges per tutorial — see Discrepancies; tsvector).
- BRIN: tiny, cheap to maintain; best on a column correlated with physical order (e.g. `created_at` of an
  append-only orders table); lets you index huge tables without partitioning.
- GiST: general balanced tree framework; geometric types and FTS. SP-GiST: non-balanced partitioned structures
  (quad-trees, k-d trees, radix tries) — GIS, multimedia, phone routing, IP routing.
- Visualizer idea: a "which index can answer this predicate?" matrix — rows = operators, columns = AMs, click to
  see the EXPLAIN.

### JSONB GIN indexes and operator classes  [M4, M2]  (source: indexes__json-index.txt)
- GIN operator-class table (as taught; matches PG18 built-ins):
  | opclass | indexable operators |
  |---|---|
  | array_ops | `&&`, `@>`, `<@`, `=` (anyarray) |
  | jsonb_ops (default) | `@>` (jsonb), `@?` / `@@` (jsonpath), `?` (text), `?|` / `?&` (text[]) |
  | jsonb_path_ops | `@>`, `@?`, `@@` only |
  | tsvector_ops | `@@` (tsvector, tsquery) |
- Progression on customer_json (599 rows): (1) no index -> `Seq Scan ... Filter: (data @> '{"first_name": "John"}')
  Rows Removed by Filter: 598`, exec 0.128 ms; (2) `USING GIN(data)` -> Bitmap Index Scan, cost 21.51, exec 0.045
  ms; (3) `USING GIN(data jsonb_path_ops)` -> cost 12.82 (smaller index: hashes of whole paths); (4)
  `data->>'first_name' = 'John'` -> Seq Scan again: GIN only helps containment/existence/jsonpath operators, not
  `->>` equality; (5) field expression index `USING GIN ((data->'first_name'))` with
  `WHERE data->'first_name' @> '"John"'` -> Bitmap scan.
- Pitfall + fix (to add): for scalar-field equality, a B-tree expression index is the right tool:
  `CREATE INDEX ON customer_json ((data->>'first_name'));` then `WHERE data->>'first_name' = 'John'`.
- PGlite-runnable seed (no dvdrental needed):
  ```sql
  CREATE TABLE customer_json(id serial PRIMARY KEY, data jsonb NOT NULL);
  INSERT INTO customer_json(data)
  SELECT jsonb_build_object(
           'first_name', (ARRAY['John','Mary','Linda','Barbara','Lou'])[1+g%5] || CASE WHEN g>5 THEN g::text ELSE '' END,
           'last_name',  'Last'||g,
           'email',      'user'||g||'@example.com',
           'phone',      (100000000 + g*7919)::text,
           'address', jsonb_build_object('city', 'City'||(g%40), 'country', (ARRAY['US','IN','DE','BR'])[1+g%4]))
  FROM generate_series(1,600) g;
  ANALYZE customer_json;
  EXPLAIN ANALYZE SELECT data->>'last_name' FROM customer_json WHERE data @> '{"first_name":"John"}';
  CREATE INDEX customer_json_index ON customer_json USING GIN (data jsonb_path_ops);
  EXPLAIN ANALYZE SELECT data->>'last_name' FROM customer_json WHERE data @> '{"first_name":"John"}';
  SELECT pg_size_pretty(pg_relation_size('customer_json_index'));  -- compare with default jsonb_ops
  ```
  (On a 600-row table the planner may still prefer Seq Scan; use `SET enable_seqscan = off` to show the index plan,
  and explain why.)

### Listing indexes  [M4]  (source: indexes__list-indexes.txt)
- `pg_indexes` view columns: schemaname, tablename, indexname, tablespace, indexdef (the reconstructed CREATE INDEX).
  ```sql
  SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
  SELECT indexname, indexdef FROM pg_indexes WHERE tablename LIKE 'c%';
  ```
- Naming conventions visible: `<table>_pkey`, `<table>_<col>_key` (UNIQUE constraint), `idx_fk_*` (dvdrental's
  explicit FK indexes). `\d customer` "Indexes:" block shows `PRIMARY KEY, btree (customer_id)`.

### Multicolumn indexes and the leftmost-prefix rule  [M4]  (source: indexes__multicolumn-indexes.txt)
- Facts: a.k.a. composite/combined/concatenated index; max 32 key columns (INDEX_MAX_KEYS, changeable in
  pg_config_manual.h at build time); multicolumn supported by B-tree, GiST, GIN, BRIN only.
- Rule: index on (c1, c2, c3) is efficient for conditions on c1; c1+c2; c1+c2+c3. Without a condition on c1 the
  planner must weigh a full-index scan vs seq scan. Put the most frequently filtered column first.
- people (10,000 rows) plans:
  ```
  -- no index:                       Seq Scan on people (cost=0.00..83.88 rows=9 width=240)
  CREATE INDEX idx_people_names ON people (last_name, first_name);
  -- last_name = 'Adams':             Bitmap Heap Scan (cost=4.42..44.07 rows=18) -> Bitmap Index Scan on idx_people_names
  -- last_name='Adams' AND first_name='Lou': Index Scan using idx_people_names (cost=0.29..8.30 rows=1)
  --     Index Cond: ((last_name = 'Adams') AND (first_name = 'Lou'))
  -- first_name = 'Lou' only:          Seq Scan (cost=0.00..186.00 rows=32)
  ```
  Interesting artefact: the first plan has width=240 / rows=9 (no stats yet: estimates from varchar(50) widths)
  and after the index build stats exist (width=17) — a good ANALYZE teaching moment.
- Visualizer: phone-book sorted by (last, first): finding "Adams" = contiguous range; finding first name "Lou" =
  scattered across the whole book. (PG18 note: B-tree *skip scan* is new in PG18 and can use the index for
  `first_name = 'Lou'` when last_name has few distinct values — the tutorial's claim is pre-PG18; see Discrepancies.)
- Playground seed:
  ```sql
  CREATE TABLE people (id int GENERATED BY DEFAULT AS IDENTITY, first_name varchar(50) NOT NULL, last_name varchar(50) NOT NULL);
  INSERT INTO people(first_name, last_name)
  SELECT (ARRAY['Lou','Ann','Bob','Cid','Dee','Eve','Gus','Ida'])[1+g%8],
         (ARRAY['Adams','Baker','Clark','Davis','Evans','Ford','Gray','Hill','Irwin','Jones'])[1+(g/8)%10] || (g%50)
  FROM generate_series(1,10000) g;
  ANALYZE people;
  ```

### Partial indexes  [M4]  (source: indexes__partial-index.txt)
- Angle: index only the rows you actually query. Benefits: smaller index, faster lookups, cheaper writes (rows not
  matching the predicate never touch the index).
- `CREATE INDEX customer_active ON customer(active) WHERE active = 0;`
  `EXPLAIN SELECT * FROM customer WHERE active = 0;` -> `Index Scan using customer_active on customer (cost=0.14..16.12 rows=15 width=70)`
  (15 inactive of 599 customers).
- Rule to add: the query's WHERE must imply the index predicate (planner proves `active = 0` => predicate);
  parameterised queries (`active = $1`) may not match with generic plans. Classic production uses:
  `WHERE deleted_at IS NULL`, `WHERE status = 'pending'` queues, partial UNIQUE (`UNIQUE ... WHERE active`).

### REINDEX and rebuild locking  [M4, M7]  (source: indexes__reindex.txt)
- Why rebuild: corruption (hardware/software bugs), invalid index after a failed build, bloat.
- Syntax as taught: `REINDEX [ (VERBOSE [bool], TABLESPACE new_ts, CONCURRENTLY [bool]) ] { INDEX | TABLE | SCHEMA | DATABASE | SYSTEM } name;`
- `REINDEX (verbose, concurrently) TABLE film;` output lists each index incl. the TOAST index:
  `INFO: index "public.film_pkey" was reindexed` ... `INFO: index "pg_toast.pg_toast_27937_index" was reindexed`
  `INFO: table "public.film" was reindexed` `DETAIL: CPU: user: 0.01 s, system: 0.01 s, elapsed: 0.37 s.`
  (M2 hook: every table with toastable columns has a pg_toast.pg_toast_<oid> table with its own index.)
- Locking comparison (good table for a lesson):
  | approach | table writes | table reads | reads via that index |
  |---|---|---|---|
  | REINDEX | blocked | allowed | blocked (ACCESS EXCLUSIVE on the index) |
  | DROP INDEX + CREATE INDEX | DROP: blocked; CREATE: blocked | DROP: blocked; CREATE: allowed (but slow without index) | n/a |
  | REINDEX CONCURRENTLY | allowed | allowed | allowed (builds new index, swaps) |
- PGlite: `REINDEX (VERBOSE) TABLE t;` runs; CONCURRENTLY works outside a transaction block.

### Unique indexes and NULLS [NOT] DISTINCT  [M4, M1]  (source: indexes__unique-index.txt)
- `CREATE UNIQUE INDEX name ON t (col [, ...]) [ NULLS [ NOT ] DISTINCT ];` default NULLS DISTINCT (many NULLs OK).
  Only B-tree supports unique. PK and UNIQUE constraints auto-create unique indexes (`employees_pkey`,
  `employees_email_key`).
- Worked example (PGlite-runnable):
  ```sql
  CREATE TABLE employees (employee_id SERIAL PRIMARY KEY, first_name VARCHAR(255) NOT NULL,
                          last_name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE);
  ALTER TABLE employees ADD mobile_phone VARCHAR(20);
  CREATE UNIQUE INDEX idx_employees_mobile_phone ON employees(mobile_phone);
  INSERT INTO employees(first_name,last_name,email,mobile_phone) VALUES ('John','Doe','john.doe@example.com','(408)-555-1234');
  INSERT INTO employees(first_name,last_name,email,mobile_phone) VALUES ('Jane','Doe','jane.doe@example.com','(408)-555-1234');
  -- ERROR:  duplicate key value violates unique constraint "idx_employees_mobile_phone"
  -- DETAIL:  Key (mobile_phone)=((408)-555-1234) already exists.
  ALTER TABLE employees ADD work_phone VARCHAR(20), ADD extension VARCHAR(5);
  CREATE UNIQUE INDEX idx_employees_workphone ON employees(work_phone, extension);
  INSERT INTO employees(first_name,last_name,work_phone,extension) VALUES ('Lily','Bush','(408)-333-1234','1212');
  INSERT INTO employees(first_name,last_name,work_phone,extension) VALUES ('Joan','Doe','(408)-333-1234','1211');
  INSERT INTO employees(first_name,last_name,work_phone,extension) VALUES ('Tommy','Stark','(408)-333-1234','1211');
  -- ERROR: ... "idx_employees_workphone"  DETAIL: Key (work_phone, extension)=((408)-333-1234, 1211) already exists.
  ```
  Extension exercise: insert two rows with NULL extension and same work_phone (succeeds), then recreate the index
  with `NULLS NOT DISTINCT` (fails). Note: the error message says "unique constraint" even for a bare unique index.
  Teaching point: unique index vs UNIQUE constraint — constraint is visible in pg_constraint, can be referenced by FKs
  and be DEFERRABLE; a bare index cannot be deferred.

### Trigger fundamentals: row triggers with OLD / NEW  [M6]  (source: triggers.txt, triggers__after-delete-trigger.txt, triggers__after-insert-trigger.txt)
- Two-step recipe used throughout: (1) `CREATE FUNCTION f() RETURNS TRIGGER ... LANGUAGE plpgsql`, (2)
  `CREATE TRIGGER name {BEFORE|AFTER} {event} ON table FOR EACH {ROW|STATEMENT} EXECUTE FUNCTION f();`
- OLD available in DELETE (and UPDATE); NEW in INSERT (and UPDATE); OLD is read-only.
- AFTER DELETE archive pattern (runnable):
  ```sql
  CREATE TABLE employees (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, salary NUMERIC(10,2) NOT NULL);
  INSERT INTO employees(name, salary) VALUES ('John Doe', 90000), ('Jane Doe', 80000) RETURNING *;
  CREATE TABLE employee_archives(id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL,
      salary NUMERIC(10,2) NOT NULL, deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
  CREATE OR REPLACE FUNCTION archive_deleted_employee() RETURNS TRIGGER AS $$
  BEGIN
      INSERT INTO employee_archives(id, name, salary) VALUES (OLD.id, OLD.name, OLD.salary);
      RETURN OLD;
  END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER after_delete_employee_trigger AFTER DELETE ON employees
      FOR EACH ROW EXECUTE FUNCTION archive_deleted_employee();
  DELETE FROM employees WHERE id = 1 RETURNING *;
  SELECT * FROM employee_archives;   -- 1 | John Doe | 90000.00 | <timestamp>
  ```
  Note: inserting explicit ids into a SERIAL column doesn't advance its sequence — future collisions possible;
  better make archive id a plain int.
- AFTER INSERT side-effect pattern: members -> memberships ('free' default):
  ```sql
  CREATE TABLE members (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE);
  CREATE TABLE memberships (id SERIAL PRIMARY KEY, member_id INT NOT NULL REFERENCES members(id),
                            membership_type VARCHAR(50) NOT NULL DEFAULT 'free');
  CREATE OR REPLACE FUNCTION create_membership_after_insert() RETURNS TRIGGER AS $$
  BEGIN INSERT INTO memberships (member_id) VALUES (NEW.id); RETURN NEW; END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER after_insert_member_trigger AFTER INSERT ON members
      FOR EACH ROW EXECUTE FUNCTION create_membership_after_insert();
  INSERT INTO members(name, email) VALUES ('John Doe', 'john.doe@example.com') RETURNING *;
  SELECT * FROM memberships;   -- 1 | 1 | free
  ```
  Why AFTER, not BEFORE: the FK `memberships.member_id -> members.id` needs the member row to exist.
- Clarification lesson writers need: for AFTER row triggers the return value is ignored (RETURN NULL is fine);
  tutorials' `RETURN NEW` / `RETURN OLD` in AFTER triggers is harmless convention.

### CREATE TRIGGER anatomy; row vs statement  [M6]  (source: triggers__creating-first-trigger-postgresql.txt, triggers__drop-trigger.txt, triggers__alter-trigger.txt, triggers__enable-triggers.txt)
- Trigger function: takes no SQL arguments, returns type `trigger`, receives context through `TriggerData`
  (in PL/pgSQL: `NEW`, `OLD`, `TG_NAME`, `TG_WHEN`, `TG_OP`, `TG_TABLE_NAME`, `TG_LEVEL`, ...). Any PL can be used.
- `CREATE TRIGGER name {BEFORE|AFTER|INSTEAD OF} {INSERT|UPDATE [OF col]|DELETE|TRUNCATE} [OR ...] ON table
  [FOR [EACH] {ROW|STATEMENT}] [WHEN (cond)] EXECUTE {FUNCTION|PROCEDURE} fn();` — default FOR EACH STATEMENT.
- Row vs statement analogy: DELETE of 100 rows fires a row trigger 100 times, a statement trigger once.
- First-trigger example (runnable):
  ```sql
  CREATE TABLE employees(id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     first_name VARCHAR(40) NOT NULL, last_name VARCHAR(40) NOT NULL);
  CREATE TABLE employee_audits(id INT GENERATED ALWAYS AS IDENTITY, employee_id INT NOT NULL,
     last_name VARCHAR(40) NOT NULL, changed_on TIMESTAMP NOT NULL);
  CREATE OR REPLACE FUNCTION log_last_name_changes() RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
     IF NEW.last_name <> OLD.last_name THEN
        INSERT INTO employee_audits(employee_id, last_name, changed_on) VALUES (OLD.id, OLD.last_name, now());
     END IF;
     RETURN NEW;
  END; $$;
  CREATE TRIGGER last_name_changes BEFORE UPDATE ON employees
     FOR EACH ROW EXECUTE FUNCTION log_last_name_changes();
  INSERT INTO employees(first_name, last_name) VALUES ('John','Doe'), ('Lily','Bush');
  UPDATE employees SET last_name = 'Brown' WHERE id = 2;
  SELECT * FROM employee_audits;   -- 1 | 2 | Bush | <now>
  ```
  Improvement to teach: use `IS DISTINCT FROM` (NULL-safe) and `AFTER UPDATE OF last_name` or a WHEN clause —
  auditing belongs in AFTER triggers so you only log changes that actually happened (a later BEFORE trigger could
  still cancel the row).
- Rename: `ALTER TRIGGER before_update_salary ON employees RENAME TO salary_before_update;` (table owner only).
- Replace: `CREATE OR REPLACE TRIGGER ...` (PG14+); before 14, `BEGIN; DROP TRIGGER IF EXISTS ...; CREATE TRIGGER ...; COMMIT;`
  — atomic thanks to transactional DDL (good M5/M6 tie-in).
- Drop: `DROP TRIGGER [IF EXISTS] name ON table [CASCADE|RESTRICT];` Trigger names are local to a table in PG (two
  tables may each have `last_updated`); SQL standard has global names and `DROP TRIGGER name`.
- Enable/disable: `ALTER TABLE t DISABLE TRIGGER name | ALL | USER;` / `ENABLE TRIGGER name | ALL;` (ALL includes
  internal FK constraint triggers — superuser only; USER excludes them). Also `ENABLE REPLICA` / `ENABLE ALWAYS`
  interact with `session_replication_role` (official).
- RAISE detail: `RAISE 'The salary increment cannot that high.';` defaults to level EXCEPTION with SQLSTATE `P0001`;
  error CONTEXT line shows `PL/pgSQL function check_salary() line 4 at RAISE`.

### BEFORE triggers: validate, transform, or veto  [M6]  (source: triggers__before-insert-trigger.txt, triggers__before-update-trigger.txt, triggers__before-delete-trigger.txt, triggers__before-truncate-trigger.txt)
- Mental model for the lesson: BEFORE row trigger is a gatekeeper — it can (a) raise to abort the statement,
  (b) modify NEW and return it (INSERT/UPDATE), (c) return NULL to silently skip this row, (d) return NEW/OLD
  unchanged to proceed.
- Veto deletes:
  ```sql
  CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL,
                         price NUMERIC(10,2) NOT NULL, status BOOLEAN NOT NULL DEFAULT true);
  INSERT INTO products (name, price, status) VALUES ('A',10.99,true),('B',20.49,false),('C',15.79,true);
  CREATE OR REPLACE FUNCTION fn_before_delete_product() RETURNS TRIGGER AS $$
  BEGIN RAISE EXCEPTION 'Deletion from the products table is not allowed.'; END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER before_delete_product_trigger BEFORE DELETE ON products
     FOR EACH ROW EXECUTE FUNCTION fn_before_delete_product();
  DELETE FROM products WHERE id = 1;
  -- ERROR:  Deletion from the products table is not allowed.
  -- CONTEXT:  PL/pgSQL function fn_before_delete_product() line 3 at RAISE
  ```
  Variation exercise: make it a soft delete — `UPDATE products SET status = false WHERE id = OLD.id; RETURN NULL;`
  (row skipped, DELETE reports `DELETE 0`).
- Business-rule check (`BEFORE UPDATE OF salary`): `IF NEW.salary < OLD.salary THEN RAISE EXCEPTION 'New salary
  cannot be less than current salary'; END IF; RETURN NEW;` — `UPDATE employees SET salary = salary * 0.9 WHERE id = 1;`
  fails. `UPDATE OF col` fires when the column appears in the SET list, even if the value is unchanged.
- Running-total maintenance (BEFORE INSERT on inventory updating inventory_stat: 100 then 300). Teaching angle:
  works single-user but has a race under concurrency (two sessions both see count = 0 and both INSERT the stat
  row) — use an AFTER trigger with `INSERT ... ON CONFLICT` / a single pre-seeded row with `UPDATE`, and note it
  serialises all inserts on that one row (M5 lock-contention tie-in).
  ```sql
  CREATE TABLE inventory(product_id INT PRIMARY KEY, quantity INT NOT NULL DEFAULT 0);
  CREATE TABLE inventory_stat(total_qty INT);
  CREATE OR REPLACE FUNCTION update_total_qty() RETURNS TRIGGER LANGUAGE plpgsql AS $$
  DECLARE p_row_count INT;
  BEGIN
     SELECT COUNT(*) FROM inventory_stat INTO p_row_count;
     IF p_row_count > 0 THEN UPDATE inventory_stat SET total_qty = total_qty + NEW.quantity;
     ELSE INSERT INTO inventory_stat(total_qty) VALUES (NEW.quantity); END IF;
     RETURN NEW;
  END; $$;
  CREATE TRIGGER inventory_before_insert BEFORE INSERT ON inventory FOR EACH ROW EXECUTE FUNCTION update_total_qty();
  INSERT INTO inventory VALUES (1, 100); INSERT INTO inventory VALUES (2, 200);
  SELECT * FROM inventory_stat;   -- 300
  ```
- TRUNCATE triggers: statement-level only (`FOR EACH STATEMENT`); TRUNCATE does not fire DELETE triggers (it
  doesn't visit rows). Block truncation:
  ```sql
  CREATE TABLE companies(id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL);
  INSERT INTO companies(name) VALUES ('Apple'),('Microsoft'),('Google');
  CREATE OR REPLACE FUNCTION before_truncate_companies() RETURNS TRIGGER AS $$
  BEGIN RAISE EXCEPTION 'Truncating the companies table is not allowed'; END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER before_truncate_companies_trigger BEFORE TRUNCATE ON companies
     FOR EACH STATEMENT EXECUTE FUNCTION before_truncate_companies();
  TRUNCATE TABLE companies;   -- ERROR:  Truncating the companies table is not allowed
  ```

### AFTER UPDATE audit log  [M6]  (source: triggers__after-update-trigger.txt)
- `AFTER UPDATE OF salary` + OLD/NEW into salary_changes:
  ```sql
  CREATE TABLE salaries(id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, salary NUMERIC NOT NULL);
  CREATE TABLE salary_changes(id SERIAL PRIMARY KEY, employee_id INT NOT NULL, old_salary NUMERIC NOT NULL,
                              new_salary NUMERIC NOT NULL, changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
  CREATE OR REPLACE FUNCTION log_salary_change() RETURNS TRIGGER AS $$
  BEGIN INSERT INTO salary_changes(employee_id, old_salary, new_salary) VALUES (NEW.id, OLD.salary, NEW.salary);
        RETURN NEW; END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER after_update_salary_trigger AFTER UPDATE OF salary ON salaries
     FOR EACH ROW EXECUTE FUNCTION log_salary_change();
  INSERT INTO salaries(name, salary) VALUES ('John Doe', 90000), ('Jane Doe', 95000);
  UPDATE salaries SET salary = salary * 1.05 WHERE id = 1;
  SELECT * FROM salary_changes;   -- 1 | 1 | 90000 | 94500.00 | <ts>
  ```
  Note `94500.00` (numeric scale from `* 1.05`) — a cute numeric-scale aside.
- Visualizer idea (M6): timeline of one UPDATE statement — BEFORE STATEMENT -> per row: BEFORE ROW (may modify NEW)
  -> heap update -> index updates -> AFTER ROW queued -> ... -> AFTER ROW events fired at end of statement -> AFTER
  STATEMENT. Show where OLD/NEW exist and where RETURN values matter.

### INSTEAD OF triggers on views  [M6]  (source: triggers__instead-of-triggers.txt)
- Angle: a join view isn't auto-updatable; an INSTEAD OF row trigger intercepts INSERT/UPDATE/DELETE on the view and
  routes them to base tables using `TG_OP`.
  ```sql
  CREATE TABLE employees (employee_id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL);
  CREATE TABLE salaries (employee_id INT, effective_date DATE NOT NULL, salary DECIMAL(10,2) NOT NULL DEFAULT 0,
     PRIMARY KEY (employee_id, effective_date),
     FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE);
  INSERT INTO employees (name) VALUES ('Alice'), ('Bob');
  INSERT INTO salaries VALUES (1,'2024-03-01',60000.00), (2,'2024-03-01',70000.00);
  CREATE VIEW employee_salaries AS
     SELECT e.employee_id, e.name, s.salary, s.effective_date
     FROM employees e JOIN salaries s ON e.employee_id = s.employee_id;
  CREATE OR REPLACE FUNCTION update_employee_salaries() RETURNS TRIGGER AS $$
  DECLARE p_employee_id INT;
  BEGIN
     IF TG_OP = 'INSERT' THEN
        INSERT INTO employees(name) VALUES (NEW.name) RETURNING employee_id INTO p_employee_id;
        INSERT INTO salaries(employee_id, effective_date, salary) VALUES (p_employee_id, NEW.effective_date, NEW.salary);
     ELSIF TG_OP = 'UPDATE' THEN
        UPDATE salaries SET salary = NEW.salary WHERE employee_id = NEW.employee_id;
     ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM employees WHERE employee_id = OLD.employee_id;
     END IF;
     RETURN NULL;
  END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER instead_of_employee_salaries INSTEAD OF INSERT OR UPDATE OR DELETE ON employee_salaries
     FOR EACH ROW EXECUTE FUNCTION update_employee_salaries();
  INSERT INTO employee_salaries (name, salary, effective_date) VALUES ('Charlie', 75000.00, '2024-03-01');
  UPDATE employee_salaries SET salary = 95000 WHERE employee_id = 3;
  DELETE FROM employee_salaries WHERE employee_id = 3;   -- cascades to salaries
  ```
- Pitfalls to teach (not in tutorial): `RETURN NULL` from an INSTEAD OF row trigger means "no row processed", so
  the command tag reads `INSERT 0 0` / `UPDATE 0` and `RETURNING` yields nothing — return `NEW` (INSERT/UPDATE) or
  `OLD` (DELETE) instead. The UPDATE branch updates every salary row of that employee regardless of
  effective_date — add `AND effective_date = OLD.effective_date`. INSTEAD OF triggers must be FOR EACH ROW and
  exist only on views.

### Event triggers (DDL auditing)  [M6]  (source: triggers__event-trigger.txt)
- Events: `ddl_command_start` (before CREATE/ALTER/DROP/GRANT/REVOKE/SECURITY LABEL/COMMENT; not for shared
  objects — databases, tablespaces, roles), `ddl_command_end`, `sql_drop` (just before ddl_command_end for
  dropped objects), `table_rewrite` (before ALTER TABLE / ALTER TYPE rewrites a table). PG17+ adds `login`.
- Function returns `event_trigger`, has no RETURN value; variables `TG_EVENT`, `TG_TAG`.
  ```sql
  CREATE TABLE audits (id SERIAL PRIMARY KEY, username VARCHAR(100) NOT NULL, event VARCHAR(50) NOT NULL,
                       command TEXT NOT NULL, executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
  CREATE OR REPLACE FUNCTION audit_command() RETURNS EVENT_TRIGGER AS $$
  BEGIN INSERT INTO audits (username, event, command) VALUES (session_user, TG_EVENT, TG_TAG); END;
  $$ LANGUAGE plpgsql;
  CREATE EVENT TRIGGER audit_ddl_commands ON ddl_command_end EXECUTE FUNCTION audit_command();
  CREATE TABLE regions(id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL);
  SELECT * FROM audits;   -- 1 | postgres | ddl_command_end | CREATE TABLE | <ts>
  ```
  Extension: inside the function `SELECT * FROM pg_event_trigger_ddl_commands()` gives object_identity per command;
  add `WHEN TAG IN ('CREATE TABLE','DROP TABLE')` filter. Requires superuser (fine in PGlite).
- Comparison table (regular vs event): table-level vs database-level; BEFORE/AFTER/INSTEAD OF DML vs the four DDL
  events; row/statement vs database scope; access to row data vs metadata; per-table change logging vs DDL audit.

### Listing triggers  [M6]  (source: triggers__how-to-list-all-triggers-in-postgresql.txt)
- `information_schema.triggers` has one row per (trigger, event) — that is why the tutorial uses GROUP BY
  (a `BEFORE INSERT OR UPDATE` trigger appears twice: event_manipulation INSERT and UPDATE).
  ```sql
  SELECT event_object_table AS table_name, trigger_name
  FROM information_schema.triggers GROUP BY table_name, trigger_name ORDER BY table_name, trigger_name;
  SELECT tgname FROM pg_trigger WHERE tgrelid = 'employees'::regclass AND NOT tgisinternal;
  ```
- pg_trigger key columns: tgname, tgrelid (table/view oid), tgfoid (function oid), tgtype (int2 bitmask:
  ROW/BEFORE/INSERT/DELETE/UPDATE/TRUNCATE/INSTEAD bits), tgenabled ('O' origin/local, 'D' disabled, 'R' replica,
  'A' always), tgisinternal (true for FK constraint triggers — `RI_ConstraintTrigger_*`).
- Wrapper-function pattern `get_triggers([p_table_name text]) RETURNS TABLE(...)` with `RETURN QUERY` — function
  overloading by arity example.
- Visualizer: decode tgtype bits interactively; show the hidden RI triggers a FOREIGN KEY creates (set
  tgisinternal filter off).

### Trigger design: when to use, WHEN clause, disabling  [M6]  (source: triggers__introduction-postgresql-trigger.txt, triggers__trigger-when-condition.txt, triggers__managing-postgresql-trigger.txt)
- Why triggers: logic that must run no matter which application writes (history tables, cross-table integrity
  like "new customer => rows in banks and credits"). Main drawback: invisible side-effects — developers must know
  the trigger exists. PG specifics vs standard: TRUNCATE triggers; statement-level triggers on views; action must
  be a function (standard allows arbitrary SQL).
- BEFORE vs AFTER one-liner: BEFORE can skip or change the current row; AFTER sees all changes final.
- WHEN clause: condition evaluated before the function is called (cheaper than IF inside the function); row
  triggers can reference OLD/NEW columns; statement triggers cannot reference columns.
  ```sql
  CREATE TABLE orders (order_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, customer_id INT NOT NULL,
                       total_amount NUMERIC NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL);
  CREATE TABLE customer_stats (customer_id INT PRIMARY KEY, total_spent NUMERIC NOT NULL DEFAULT 0);
  CREATE OR REPLACE FUNCTION insert_customer_stats() RETURNS TRIGGER AS $$
  BEGIN INSERT INTO customer_stats (customer_id) VALUES (NEW.customer_id); RETURN NULL; END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER insert_customer_stats_trigger AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION insert_customer_stats();
  CREATE OR REPLACE FUNCTION update_customer_stats() RETURNS TRIGGER AS $$
  BEGIN
     IF NEW.status = 'completed' THEN
        UPDATE customer_stats SET total_spent = total_spent + NEW.total_amount WHERE customer_id = NEW.customer_id;
     END IF;
     RETURN NULL;
  END; $$ LANGUAGE plpgsql;
  CREATE TRIGGER update_customer_stats_trigger AFTER UPDATE ON orders FOR EACH ROW
     WHEN (OLD.status <> 'completed' AND NEW.status = 'completed')
     EXECUTE FUNCTION update_customer_stats();
  INSERT INTO orders (customer_id, total_amount, status) VALUES (1, 100, 'pending'), (2, 200, 'pending');
  UPDATE orders SET status = 'completed' WHERE customer_id IN (1,2);
  SELECT * FROM customer_stats;   -- (1,100), (2,200)
  ```
  Pitfall to teach: the AFTER INSERT trigger INSERTs into customer_stats per order, so a customer's second order
  fails with a duplicate-key error on customer_stats_pkey — fix with `ON CONFLICT (customer_id) DO NOTHING`.
  Re-running the UPDATE does nothing (WHEN prevents double counting) — show by running it twice.
- Disable/enable: `ALTER TABLE employees DISABLE TRIGGER log_last_name_changes;` — note the tutorial passes the
  *function* name; it must be the *trigger* name (`last_name_changes`). `DISABLE TRIGGER ALL` also disables FK
  enforcement triggers (superuser only) — dangerous for bulk loads; prefer `DISABLE TRIGGER USER`.

### Views: definition, rewrite, and replacement rules  [M6, M4]  (source: views.txt, views__managing-postgresql-views.txt, views__alter-view.txt, views__drop-view.txt, views__list-views.txt)
- Definition: named query over base tables; the query on a view is rewritten into the defining query (rule system /
  pg_rewrite — link to M4 rewriter stage). Plain views store no data. Advantages: simplify complex joins, security
  (expose subsets / hide columns), logical data independence (refactor base tables behind a stable view).
- Examples (dvdrental shape): `contact` (customer columns), `customer_info` (customer JOIN address USING(address_id)
  JOIN city USING(city_id) JOIN country USING(country_id)), `customer_usa` (view on a view, `WHERE country =
  'United States'`).
- `\d+ contact` shows the *stored* definition re-deparsed with qualified columns (`customer.first_name`, ...,
  `JOIN address USING (address_id)`) — evidence that PG stores a parse tree, not text. Corollary: `SELECT *` in a view
  is expanded at creation; columns added to the base table later don't appear.
- `CREATE OR REPLACE VIEW` — tutorial's example appends `phone` at the end, which is allowed. Pitfall: OR REPLACE
  can only add new columns at the end; it cannot drop, reorder, rename, or change types of existing columns
  (`ERROR: cannot drop columns from view` / `cannot change name of view column`) -> use ALTER VIEW RENAME COLUMN or
  DROP + CREATE.
- ALTER VIEW actions: `RENAME TO`, `RENAME [COLUMN] a TO b`, `SET SCHEMA s`, `SET (check_option = local|cascaded,
  security_barrier = bool, security_invoker = bool)`; `\d+` footer shows `Options: check_option=local`.
- DROP VIEW: `DROP VIEW [IF EXISTS] v1, v2 [CASCADE|RESTRICT];` error with dependent view:
  `ERROR: cannot drop view film_info because other objects depend on it / DETAIL: view horror_film depends on view
  film_info / HINT: Use DROP ... CASCADE ...`; with CASCADE: `NOTICE: drop cascades to view horror_film`.
- Listing: `\dv`; `SELECT table_schema, table_name FROM information_schema.views WHERE table_schema NOT IN
  ('information_schema','pg_catalog');` (note: information_schema.views excludes matviews); `SELECT * FROM pg_matviews;`
  (schemaname, matviewname, matviewowner, tablespace, hasindexes, ispopulated, definition).
- dvdrental ships 7 views: actor_info, customer_list, film_list, nicer_but_slower_film_list, sales_by_film_category,
  sales_by_store, staff_list.

### Updatable views and WITH CHECK OPTION  [M6]  (source: views__updatable-views.txt, views__views-with-check-option.txt)
- Auto-updatable when: exactly one FROM item (table or updatable view); no top-level GROUP BY, HAVING, LIMIT,
  OFFSET/FETCH, DISTINCT, WITH, UNION/INTERSECT/EXCEPT; no aggregates, window functions, or set-returning functions
  in the select list. Columns that are expressions are read-only (error if written). PG rewrites the DML onto the
  base table.
- cities/city_us (runnable, 20 rows; see Reusable sample schemas): INSERT through view -> id 21 'San Jose';
  UPDATE city_us SET population = 1000000 WHERE name = 'New York'; DELETE FROM city_us WHERE id = 21.
- The leak WITH CHECK OPTION fixes: `INSERT INTO fte(...) VALUES ('John','Smith',1,'Contractor');` succeeds even
  though the fte view only shows FTEs — the row vanishes from the view. With `WITH CHECK OPTION`:
  `ERROR: new row violates check option for view "fte" / DETAIL: Failing row contains (12, John, Snow, 1, Contractor).`
- LOCAL vs CASCADED with stacked views (fte = employee_type='FTE'; fte_1 = fte WHERE department_id = 1):
  - fte (no check) + fte_1 `WITH LOCAL CHECK OPTION`: inserting ('Miller','Jackson',1,'Contractor') succeeds —
    only department_id = 1 is checked.
  - fte_1 `WITH CASCADED CHECK OPTION`: ('Peter','Taylor',1,'Contractor') fails with `violates check option for view
    "fte"` — the underlying view's predicate is enforced too.
  - Default when you write just `WITH CHECK OPTION` is CASCADED.
- Observation for an M3/M5 aside: failing row ids (12, 24) show sequence values are consumed by failed inserts —
  sequences are non-transactional, gaps are normal.
- Visualizer: stacked view predicates as nested filters; an inserted row "falls through" each layer; LOCAL checks
  only the top filter, CASCADED checks all.

### Materialized views  [M6, M4]  (source: views__materialized-views.txt, views__list-views.txt)
- Angle: a cache of an expensive query (data warehouses/BI); data goes stale until REFRESH.
- `CREATE MATERIALIZED VIEW [IF NOT EXISTS] v AS query WITH [NO] DATA;` — WITH NO DATA leaves it unpopulated:
  `ERROR: materialized view "rental_by_category" has not been populated / HINT: Use the REFRESH MATERIALIZED VIEW command.`
- `REFRESH MATERIALIZED VIEW v;` rebuilds (blocks readers of the matview); `REFRESH MATERIALIZED VIEW CONCURRENTLY v;`
  builds a new result, diffs against the old, applies only the differences, readers not blocked — requires a UNIQUE
  index (`CREATE UNIQUE INDEX rental_category ON rental_by_category (category);`) and an already-populated matview.
- rental_by_category result (16 dvdrental categories): Sports 4892.19, Sci-Fi 4336.01, Animation 4245.31, Drama
  4118.46, Comedy 4002.48, New 3966.38, Action 3951.84, Foreign 3934.47, Games 3922.18, Family 3830.15,
  Documentary 3749.65, Horror 3401.27, Classics 3353.38, Children 3309.39, Travel 3227.36, Music 3071.52.
- PGlite lesson: create a matview over a small sales table, insert more rows, show the matview is stale, REFRESH,
  then `SELECT relkind FROM pg_class WHERE relname = 'v'` ('m') and `pg_relation_size` to prove it has storage
  (contrast with a plain view: relkind 'v', size 0).

### Recursive views  [M3, M6]  (source: views__recursive-view.txt)
- `CREATE RECURSIVE VIEW name (cols) AS <non-recursive term> UNION ALL <recursive term referencing name>;` (PG 9.3+,
  SQL standard) is sugar for `CREATE VIEW name AS WITH RECURSIVE name(cols) AS (...) SELECT cols FROM name;`.
  Column list is mandatory.
- Org-chart example producing breadcrumb paths: anchor = `manager_id IS NULL` (Michael North); recursive step joins
  employees to the previous level and appends `' > ' || full_name`. Query `WHERE employee_id = 10` ->
  `Michael North > Sarah Berry > Carolyn Henderson`. Seed is in Reusable sample schemas.
- Visualizer: iterate the working table level by level (level 0: CEO; level 1: 4 VPs; level 2: 10; level 3: 5),
  highlighting the UNION ALL accumulation and termination when the working table is empty.

## Reusable sample schemas

### S1. Mini dvdrental (actor / film / film_actor / category / customer / rental / payment)  — M3, M4, M6
Small enough for PGlite, same names as the tutorials so their queries port directly.
```sql
CREATE TABLE category (category_id serial PRIMARY KEY, name text NOT NULL);
INSERT INTO category(name) VALUES ('Action'),('Animation'),('Comedy'),('Drama'),('Horror'),('Sports');
CREATE TABLE actor (actor_id serial PRIMARY KEY, first_name varchar(45) NOT NULL, last_name varchar(45) NOT NULL,
                    last_update timestamp NOT NULL DEFAULT now());
INSERT INTO actor(first_name, last_name)
SELECT (ARRAY['Penelope','Nick','Ed','Jennifer','Johnny','Bette','Grace','Matthew','Joe','Christian'])[1+g%10],
       (ARRAY['Guiness','Wahlberg','Chase','Davis','Lollobrigida','Nicholson','Mostel','Johansson','Swank','Gable'])[1+(g*3)%10]
FROM generate_series(1,40) g;
CREATE TABLE film (film_id serial PRIMARY KEY, title varchar(255) NOT NULL, release_year int,
                   length smallint, rental_rate numeric(4,2) NOT NULL DEFAULT 4.99,
                   rating text DEFAULT 'G', last_update timestamp NOT NULL DEFAULT now());
INSERT INTO film(title, release_year, length, rental_rate, rating)
SELECT 'Film ' || g, 2000 + g%10, 60 + (g*7)%120, (ARRAY[0.99,2.99,4.99])[1+g%3], (ARRAY['G','PG','PG-13','R','NC-17'])[1+g%5]
FROM generate_series(1,100) g;
CREATE TABLE film_category (film_id int REFERENCES film, category_id int REFERENCES category, PRIMARY KEY (film_id, category_id));
INSERT INTO film_category SELECT g, 1 + g%6 FROM generate_series(1,100) g;
CREATE TABLE film_actor (actor_id int REFERENCES actor, film_id int REFERENCES film, PRIMARY KEY (actor_id, film_id));
INSERT INTO film_actor SELECT DISTINCT 1 + (g*7)%40, 1 + g%100 FROM generate_series(1,180) g;
CREATE TABLE customer (customer_id serial PRIMARY KEY, first_name varchar(45) NOT NULL, last_name varchar(45) NOT NULL,
                       email varchar(50), active int NOT NULL DEFAULT 1, create_date date NOT NULL DEFAULT current_date);
INSERT INTO customer(first_name, last_name, email, active)
SELECT 'First'||g, (ARRAY['Purdy','Smith','Johnson','Ely','Hite'])[1+g%5]||g, 'c'||g||'@example.com',
       CASE WHEN g%40 = 0 THEN 0 ELSE 1 END
FROM generate_series(1,120) g;
CREATE TABLE rental (rental_id serial PRIMARY KEY, film_id int REFERENCES film, customer_id int REFERENCES customer,
                     rental_date timestamp NOT NULL, return_date timestamp);
INSERT INTO rental(film_id, customer_id, rental_date, return_date)
SELECT 1 + g%100, 1 + (g*13)%120, timestamp '2024-01-01' + g * interval '7 hours',
       CASE WHEN g%10 <> 0 THEN timestamp '2024-01-01' + g * interval '7 hours' + interval '3 days' END
FROM generate_series(1,180) g;
CREATE TABLE payment (payment_id serial PRIMARY KEY, rental_id int REFERENCES rental, customer_id int REFERENCES customer,
                      amount numeric(5,2) NOT NULL, payment_date timestamp NOT NULL);
INSERT INTO payment(rental_id, customer_id, amount, payment_date)
SELECT r.rental_id, r.customer_id, f.rental_rate, r.rental_date FROM rental r JOIN film f USING (film_id);
```
Uses: \d-equivalent catalog queries, size functions, partial index on `customer(active) WHERE active = 0`, expression
index on `lower(last_name)`, views (contact, customer_info), matview `rental_by_category`, `last_updated` trigger:
```sql
CREATE FUNCTION last_updated() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.last_update := now(); RETURN NEW; END; $$;
CREATE TRIGGER last_updated BEFORE UPDATE ON actor FOR EACH ROW EXECUTE FUNCTION last_updated();
CREATE TRIGGER last_updated BEFORE UPDATE ON film  FOR EACH ROW EXECUTE FUNCTION last_updated();  -- same name, different table
CREATE MATERIALIZED VIEW rental_by_category AS
  SELECT c.name AS category, sum(p.amount) AS total_sales
  FROM payment p JOIN rental r USING (rental_id) JOIN film_category fc ON fc.film_id = r.film_id
  JOIN category c USING (category_id) GROUP BY c.name ORDER BY total_sales DESC WITH NO DATA;
```
Note: (1+g*3)%10 etc. are just deterministic spreads; nothing depends on exact names.

### S2. cities (updatable views)  — M6  (verbatim from views__updatable-views.txt, 20 rows)
```sql
CREATE TABLE cities (id SERIAL PRIMARY KEY, name VARCHAR(255), population INT, country VARCHAR(50));
INSERT INTO cities (name, population, country) VALUES
 ('New York',8419600,'US'),('Los Angeles',3999759,'US'),('Chicago',2716000,'US'),('Houston',2323000,'US'),
 ('London',8982000,'UK'),('Manchester',547627,'UK'),('Birmingham',1141816,'UK'),('Glasgow',633120,'UK'),
 ('San Francisco',884363,'US'),('Seattle',744955,'US'),('Liverpool',498042,'UK'),('Leeds',789194,'UK'),
 ('Austin',978908,'US'),('Boston',694583,'US'),('Manchester',547627,'UK'),('Sheffield',584853,'UK'),
 ('Philadelphia',1584138,'US'),('Phoenix',1680992,'US'),('Bristol',463377,'UK'),('Detroit',673104,'US');
CREATE VIEW city_us AS SELECT * FROM cities WHERE country = 'US';
```
(Duplicate 'Manchester' row is in the original — handy for a UNIQUE/dedup exercise.)

### S3. employees with employee_type (WITH CHECK OPTION)  — M6  (verbatim, 10 rows)
```sql
CREATE TABLE employees (id SERIAL PRIMARY KEY, first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL,
   department_id INT, employee_type VARCHAR(20) CHECK (employee_type IN ('FTE','Contractor')));
INSERT INTO employees (first_name, last_name, department_id, employee_type) VALUES
 ('John','Doe',1,'FTE'),('Jane','Smith',2,'FTE'),('Bob','Johnson',1,'Contractor'),('Alice','Williams',3,'FTE'),
 ('Charlie','Brown',2,'Contractor'),('Eva','Jones',1,'FTE'),('Frank','Miller',3,'FTE'),('Grace','Davis',2,'Contractor'),
 ('Henry','Clark',1,'FTE'),('Ivy','Moore',3,'Contractor');
CREATE VIEW fte AS SELECT id, first_name, last_name, department_id, employee_type FROM employees WHERE employee_type = 'FTE';
CREATE VIEW fte_1 AS SELECT * FROM fte WHERE department_id = 1 WITH LOCAL CHECK OPTION;
```

### S4. Org chart for recursive views/CTEs  — M3, M6  (reconstructed from the reporting_line output, 20 rows)
```sql
CREATE TABLE org_employees (employee_id int PRIMARY KEY, full_name text NOT NULL,
                            manager_id int REFERENCES org_employees(employee_id));
INSERT INTO org_employees VALUES
 (1,'Michael North',NULL),(2,'Megan Berry',1),(3,'Sarah Berry',1),(4,'Zoe Black',1),(5,'Tim James',1),
 (6,'Bella Tucker',2),(7,'Ryan Metcalfe',2),(8,'Max Mills',2),(9,'Benjamin Glover',2),
 (10,'Carolyn Henderson',3),(11,'Nicola Kelly',3),(12,'Alexandra Climo',3),(13,'Dominic King',3),
 (14,'Leonard Gray',4),(15,'Eric Rampling',4),(16,'Piers Paige',7),(17,'Ryan Henderson',7),
 (18,'Frank Tucker',8),(19,'Nathan Ferguson',8),(20,'Kevin Rampling',8);
CREATE RECURSIVE VIEW reporting_line (employee_id, subordinates) AS
  SELECT employee_id, full_name FROM org_employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.employee_id, rl.subordinates || ' > ' || e.full_name
  FROM org_employees e JOIN reporting_line rl ON e.manager_id = rl.employee_id;
SELECT subordinates FROM reporting_line WHERE employee_id = 10;  -- Michael North > Sarah Berry > Carolyn Henderson
```
(Table renamed org_employees to avoid clashing with the many other `employees` tables in this slice.)

### S5. posts (full-text search)  — M6, M4  (verbatim 3 rows; see FTS section for the CREATE TABLE)
Extend with ~50 generated posts (`SELECT 'Post '||g, 'PostgreSQL ' || (ARRAY['index','vacuum','wal','mvcc','planner'])[1+g%5] || ' tips number ' || g FROM generate_series(1,50) g`) so a GIN index is actually chosen.

### S6. Trigger playgrounds  — M6
All verbatim & runnable (see trigger sections): employees + employee_archives (AFTER DELETE), members + memberships
(AFTER INSERT), salaries + salary_changes (AFTER UPDATE OF), products (BEFORE DELETE veto), inventory +
inventory_stat (BEFORE INSERT running total), companies (BEFORE TRUNCATE), employees + employee_audits
(last_name audit), orders + customer_stats (WHEN clause), employees + salaries + employee_salaries view (INSTEAD OF),
audits (event trigger). Tip: give each lesson its own schema (`CREATE SCHEMA trg_delete; SET search_path = trg_delete;`)
because several tutorials reuse the table name `employees` with different columns.

### S7. RLS departments  — M6/M1  (verbatim 3 rows; see Row-level security section)

### S8. people (multicolumn index, 10k rows) and customer_json (JSONB GIN, 600 rows)  — M4
Generators given in the multicolumn and JSONB sections (10k rows exceeds the 200-row guidance but is needed for the
planner to prefer the index; generated, not literal).

## Discrepancies and version notes
- alter-role.txt: rename syntax printed as `ALTER ROLE role_name TO new_name;` — missing RENAME; correct is `ALTER ROLE name RENAME TO new_name`.
- alter-database.txt: says for SET TABLESPACE "the tablespace needs to be empty and there is a connection to the database". Official: the new default tablespace must contain no objects of this database, and NO ONE (including you) may be connected to the database being moved. Also "only superusers and owners with CREATEDB can rename" — owner also needs CREATEDB; matches docs.
- backup-database.txt pg_dump table: `-n`/`-t` "multiple separated by commas" is wrong (repeat the switch, or use a pattern); `-h` listed twice (help is `-?`/`--help`); `-X, --no-owner` is wrong — no-owner is `-O`; dashes rendered as en-dash "–username" (should be `--username`). pg_dumpall syntax shown as `pg_dump [connection_option] [option]` (typo). The "-w to suppress prompt" example omits `-w`. pg_dumpall output is plain SQL only (restore with psql, not pg_restore).
- create-tablespace.txt: example says "used Unix-style slashes" but path shown is `c:\pgdata\primary` (backslashes). Also the "logistics" database example then creates a table without showing `\c logistics`.
- create-superuser.txt: NEON NOTE — managed Neon has no real superuser; provides `neon_superuser` role (vendor-specific).
- change-password.txt: example sets expiry on `bob` while narrative says `super`; cosmetic.
- drop-tablespace.txt: mixes names `demo` / `demo_ts` (CREATE DATABASE demodb TABLESPACE = demo; table TABLESPACE demo) — inconsistent; also `ALTER DATABASE demodb SET TABLESPACE = pg_default;` — official syntax is `SET TABLESPACE pg_default` (no `=`; with `=` it parses as setting a GUC named "tablespace" and fails). Directory mkdir'd is C:\pgdata\sample but LOCATION C:/pgdata/demo.
- drop-database.txt: "you need to be the database owner" — or superuser (official). WITH (FORCE) is PG13+; it fails if prepared transactions / logical replication slots / subscriptions block it (official).
- drop-role.txt: "To drop non-superuser roles you need CREATEROLE" — since PG16 you need CREATEROLE AND ADMIN OPTION on the target role.
- list-users.txt: pg_user view lists only roles with rolcanlogin; pg_roles lists all.
- rename-database.txt: sample pg_stat_activity output is from PG 9.x (has `waiting` column, removed in 9.6; now wait_event_type / wait_event, plus backend_type etc.).
- reset-password.txt: a reload (pg_ctl reload / SELECT pg_reload_conf()) is sufficient for pg_hba.conf changes; restart works but is not required. It only edits `host` lines; on Unix the `local` (socket) line may also need trust/peer.
- pg_terminate_backend.txt NEON NOTE: Neon has no superuser; you can only cancel/terminate your own connections (vendor-specific). In stock PG, members of pg_signal_backend can terminate non-superuser backends.
- psql-commands.txt: `\g` "executes the previous command" — precisely it sends the current query buffer (or re-sends the last one if buffer empty).
- restore-database.txt option table: `-t` listed twice (second "-t, --tablespace" does not exist in pg_restore; there is `--no-tablespaces`), `-v` listed twice (version is `-V`), "-t/-n separate by commas" wrong (repeat the switch), "-L: list of files" — it's a list of archive TOC entries. Says pg_restore restores dumps "created by pg_dump or pg_dumpall": pg_dumpall writes plain SQL only, restored with psql.
- role-membership.txt / set-role.txt: pre-PG16 model. In PG16+ each membership grant has INHERIT, SET and ADMIN options (`GRANT sales TO alice WITH INHERIT TRUE, SET FALSE`); the role-level INHERIT attribute only sets the default for new grants; SET ROLE requires the SET option on the membership chain.
- roles.txt: pg_roles listing is PG16 (16 rows). PG17 adds pg_maintain; PG18 adds pg_signal_autovacuum_worker. "VALID UNTIL '2050-01-01'" means valid until midnight at start of 2050-01-01 (tutorial says "end of 2049" — consistent). VALID UNTIL limits password auth only, not other auth methods (official).
- schema.txt: "Users can only access objects in the schemas that they own" is overstated — access needs USAGE on schema + object privileges; PUBLIC has USAGE on public.
- row-level-security.txt: omits default-deny when no policy exists and WITH CHECK for writes; policies are permissive by default (OR-combined) vs AS RESTRICTIVE (AND).
- cheat-sheet.txt errors: `CREATE DATABASE [IF NOT EXISTS]` (not supported in PG); `CREATE OR REPLACE view_name AS` (missing VIEW); `LIMIT ... OFFSET ... ORDER BY` (ORDER BY must precede LIMIT); `ALTER COLUMN [SET DEFAULT ...]` (missing column name); `PASSWORD password` (must be a quoted literal); `SELECT * ... GROUP BY` (invalid unless grouping by PK); `REFRESH ... CONCURRENTLY` requires a unique index on the matview.
- show-tables.txt: `\dt+` columns Persistence and Access method appear from psql 15+; databases listing shows PG16-era `\l` columns (Locale Provider, ICU Rules).
- full-text-search.txt tsquery operator list is partly wrong: phrase search in tsquery is `<->` / `<N>` (FOLLOWED BY), not double quotes (double quotes are websearch_to_tsquery syntax; to_tsquery uses single-quoted multiword which becomes a <-> phrase); prefix match is `:*` not `:`; negation in to_tsquery is `!` — `-` only exists in websearch_to_tsquery.
- create-index.txt: claims idx_fk_city_id "was created implicitly ... for the foreign key" — PostgreSQL never auto-creates indexes for FKs (only for PRIMARY KEY / UNIQUE / EXCLUDE constraints).
- drop-index.txt: "CONCURRENTLY forces the command to wait until the conflicting transaction completes" is a garbled description; official: drops without taking locks that block concurrent selects/inserts/updates/deletes on the table; also only one index name may be given with CONCURRENTLY.
- install-postgresql-linux.txt: uses `md5` and sets local peer->trust (insecure); since PG14 password_encryption defaults to scram-sha-256 and md5 is deprecated (PG18 emits warnings for MD5 passwords). Opening 0.0.0.0/0 is a production anti-pattern.
- install macOS page references "PostgreSQL 12" in pgAdmin step; versions throughout are 16.x (2024). All Neon pages have marketing INFO boxes (Lakebase/Neon/Databricks), "Run PostgreSQL in the Cloud, Free" callouts.
- what-is-postgresql.txt: "more than 20 years of development" is stale (PG95/1996 -> nearly 30; POSTGRES 1986 -> ~40).
- index-types.txt: B-tree operator list omits `>`; anchored LIKE/regex use of a B-tree requires C collation or a *_pattern_ops opclass in other locales (official). GIN "range types" claim: built-in GIN has no range opclass (ranges use GiST/SP-GiST); hstore/arrays/jsonb/tsvector yes.
- multicolumn-indexes.txt: says a query constraining only later columns forces full-index scan or seq scan. PG18 adds B-tree skip scan, which can efficiently use (last_name, first_name) for `first_name = 'Lou'` when the leading column has low cardinality. Mark as PG18 behavior change relative to the tutorial.
- partial-index.txt: syntax printed as `CREATE [IF NOT EXISTS] INDEX` — correct is `CREATE INDEX [IF NOT EXISTS] name`.
- reindex.txt: "when you create an index WITHOUT the CONCURRENTLY option, the index may become invalid if the build fails" — backwards: a failed CREATE INDEX CONCURRENTLY (or REINDEX CONCURRENTLY) leaves an INVALID index; a failed plain CREATE INDEX rolls back entirely. "CONCURRENTLY rebuilds without taking any locks" — it takes SHARE UPDATE EXCLUSIVE (blocks other DDL/VACUUM) and cannot run in a transaction block or on system catalogs. Since PG16 `REINDEX DATABASE`/`SYSTEM` name is optional, must be the current database, and REINDEX DATABASE no longer touches system catalogs.
- unique-index.txt: NULLS [NOT] DISTINCT is PG15+.
- json-index.txt: "2-3 times faster" timing on 599 rows is noise-level; on tiny tables the planner may still seq-scan. The jsonb_path_ops claim "cannot fully utilize the index because ->> isn't a path_ops operator" — true for jsonb_ops too; neither GIN opclass supports ->> equality.
- after-insert-trigger.txt: "RETURN NEW indicates that the function returns the modified row" — for AFTER triggers the return value is ignored.
- before-truncate-trigger.txt: "TRUNCATE only supports BEFORE triggers" — wrong; AFTER TRUNCATE (FOR EACH STATEMENT) is supported too. "TRUNCATE removes all rows without creating any logs" — wrong; TRUNCATE is WAL-logged and transactional (it creates new empty relfilenodes rather than deleting row by row).
- creating-first-trigger.txt: "statement-level trigger is fired for each transaction" — wrong; once per SQL statement. Uses `EXECUTE PROCEDURE` (accepted, but deprecated spelling since PG11; prefer EXECUTE FUNCTION). Omitting FOR EACH defaults to STATEMENT.
- instead-of-triggers.txt: `EXECUTE FUNCTION fn_trigger;` in the syntax skeleton lacks `()` (required). Returning NULL makes the view DML report 0 rows / empty RETURNING.
- event-trigger.txt: event list omits `login` (PG17+). Creating event triggers requires superuser. TG_TAG is the command tag.
- how-to-list-all-triggers.txt: calls pg_trigger a "system view" — it is a system catalog table; tgtype is a bitmask int2, tgenabled is char O/D/R/A, not "enabled or disabled". psql `\dS` = describe including system objects; plain `\d employees` also prints Triggers.
- enable-triggers.txt says triggers fire on "a table or view" events incl. TRUNCATE — TRUNCATE triggers exist on tables (and foreign tables per the official CREATE TRIGGER table), never on views.
- trigger-when-condition.txt: syntax skeleton `CREATE TRIGGER name ON table WHEN (...) EXECUTE FUNCTION ...` omits the mandatory timing/event (and FOR EACH ROW for OLD/NEW references). WHEN is not allowed on INSTEAD OF triggers (official). The AFTER INSERT stats trigger breaks on a customer's second order (duplicate PK).
- managing-postgresql-trigger.txt: `DISABLE TRIGGER log_last_name_changes` uses the function name; trigger in that tutorial is `last_name_changes`. DISABLE TRIGGER ALL disables internal FK triggers too (requires superuser); `USER` variant excludes them.
- materialized-views.txt: "REFRESH locks the underlying tables so you cannot read them" — wrong; plain REFRESH takes ACCESS EXCLUSIVE on the materialized view (blocking reads of the matview), base tables are only read. CONCURRENTLY applies INSERT/UPDATE/DELETE diffs (tutorial says only INSERT and UPDATE); takes EXCLUSIVE lock (blocks other refreshes/writes, not SELECTs); unique index must be on plain columns, cover all rows (no WHERE); not allowed WITH NO DATA / unpopulated.
- updatable-views.txt: "you still can update or delete rows that are not visible through the view" — wrong; UPDATE/DELETE through a view only touch rows visible through it. What CHECK OPTION prevents is INSERTs (and UPDATEs that move rows) producing rows not visible through the view.
- drop-view.txt: "owner of the view or have a DROP privilege" — PostgreSQL has no DROP privilege; must be owner (or member of the owning role) or superuser.
- views-with-check-option.txt: plain `WITH CHECK OPTION` = CASCADED (not stated). Sample ids in outputs are inconsistent (12 reused, then 24) — cosmetic.
- alter-view.txt: security_invoker view option is PG15+. ALTER VIEW SET (check_option) only valid on auto-updatable views.
- list-views.txt: \dv shows 10 views because 3 (contact, customer_info, customer_usa) were created in other tutorials; dvdrental itself ships 7.
- Version drift generally: outputs are from PostgreSQL 16.1 (Windows build "compiled by Visual C++ build 1937"),
  psql 16 `\l` layout, 2024 timestamps. Nothing in the slice is PG19 material. PG18-relevant deltas to remember when
  porting: B-tree skip scan (PG18) changes the multicolumn "leftmost column" story; predefined roles
  pg_maintain (17) and pg_signal_autovacuum_worker (18) are missing from the role list; `login` event trigger (17);
  MD5 password deprecation warnings (18); REINDEX DATABASE semantics changed in 16.
- Vendor-specific (Neon): `neon_superuser` role instead of a real superuser; on Neon you can only cancel/terminate
  your own connections; tablespaces, pg_ctl, pg_hba.conf, OS-level restart/uninstall pages do not apply to Neon or
  to PGlite. Marketing callouts (Lakebase/Databricks INFO boxes, "Run PostgreSQL in the Cloud, Free", PDF downloads)
  ignored.
- PGlite constraints affecting these lessons: single database (CREATE/DROP/RENAME DATABASE, WITH TEMPLATE, FORCE,
  pg_terminate_backend of other sessions not demonstrable), no psql meta-commands (provide SQL equivalents), no
  tablespaces on custom dirs, no pg_dump/pg_restore CLI, single session (simulate multi-user with SET ROLE; note the
  session user remains superuser so SET ROLE checks and RLS bypass differ from separate logins — RLS still applies to
  a SET ROLE'd non-owner role).

## Lesson ideas

### M1 Foundations
- "Where does my name resolve?" visualizer: animate search_path walking `"$user", public`, then `sales, public`;
  show the CREATE landing in the first existing schema; show the error when the object is only in an unlisted schema.
- Role graph explorer: nodes = roles (login vs group), edges = memberships with INHERIT flag; click a table to see
  effective privileges computed via membership; a SET ROLE button that moves the "current_user" marker while
  "session_user" stays put. Data from `pg_roles`, `pg_auth_members`, `has_table_privilege()`.
- Permission-denied ladder (playground): joe/candidates progression (SELECT denied -> GRANT -> INSERT denied ->
  GRANT) with SET ROLE in PGlite.
- Dependency graph + DROP: visualize pg_depend for scm schema (table + view) and show RESTRICT error vs CASCADE notice
  list; same for DROP ROLE (REASSIGN OWNED -> DROP OWNED -> DROP ROLE checklist widget).
- "MySQL habits translator" sidebar: SHOW DATABASES/TABLES/INDEXES, DESCRIBE -> pg_database, pg_tables,
  pg_indexes, information_schema.columns (PGlite-runnable SQL versions of \l, \dt, \d, \di, \dv, \du).
- ACL decoder: paste `postgres=CTc/postgres` or `=c/postgres` and explain each letter.
- Production scenario: "rename a database at 3 a.m." — checklist: connect elsewhere, inspect pg_stat_activity,
  notify owners, pg_terminate_backend, ALTER DATABASE RENAME (read-only simulation with canned outputs).

### M2 Storage
- pg_column_size explorer: smallint 2 / int 4 / bigint 8, text short header, numeric variable, jsonb; then
  pg_relation_size of tiny tables = 8192 bytes (one page) — the tutorials' `\dt+` sizes (8192 bytes for category,
  country, language, store) make the 8KB page tangible.
- `pg_total_relation_size = heap + indexes + TOAST (+ FSM/VM)` stacked bar for each table in S1; REINDEX output's
  `pg_toast.pg_toast_<oid>_index` line as the entry to TOAST.

### M4 Planner & indexes
- Before/after EXPLAIN stepper: Seq Scan (Filter) -> CREATE INDEX -> Index Scan (Index Cond) -> Bitmap Heap Scan
  (Recheck Cond) with cost numbers from the tutorials (15.54 vs 8.29; 17.98 vs 11.15).
- "Why didn't it use my index?" quiz: tiny table (actor, 200 rows), function on column (lower(last_name)),
  non-leading column of composite index (first_name only — with PG18 skip-scan twist), operator not supported by
  opclass (`->>` with GIN jsonb_path_ops), stale statistics (width=240 before ANALYZE).
- Phone-book composite index animation for (last_name, first_name).
- Index-AM/operator matrix (B-tree, Hash, GIN, GiST, SP-GiST, BRIN x operators) with clickable PGlite demos;
  include GIN opclass table (jsonb_ops vs jsonb_path_ops size comparison via pg_relation_size).
- Partial index size demo: index on all customers vs `WHERE active = 0` — compare pg_relation_size and plan.
- Unique index NULLS DISTINCT vs NULLS NOT DISTINCT toggle.
- Locking timeline: CREATE INDEX vs CREATE INDEX CONCURRENTLY vs REINDEX vs DROP+CREATE — which operations of a
  concurrent session block (table from the REINDEX section).

### M6 Programmability
- Trigger firing-order timeline (BEFORE STMT, BEFORE ROW per row, AFTER ROW queue, AFTER STMT) with OLD/NEW panes;
  toggles for RETURN NEW / RETURN NULL / modified NEW / RAISE to show effects (row skipped, row changed, statement
  aborted). Built on the products/employees/salaries examples.
- Trigger recipe gallery (each a PGlite card): audit log (AFTER UPDATE OF), archive on delete, auto-create child
  row, veto delete, block TRUNCATE, running total (with concurrency caveat), WHEN-gated counter, INSTEAD OF on join
  view, DDL audit event trigger.
- Exercise: fix the INSTEAD OF trigger so `INSERT ... RETURNING *` on the view returns the row (RETURN NEW) and so
  UPDATE respects effective_date.
- Views: "view = saved query" rewrite animation — the user's query on customer_usa expands into customer_info's joins
  and then into base tables (show EXPLAIN with no trace of the view).
- WITH CHECK OPTION LOCAL vs CASCADED stacked-filter visual (fte / fte_1).
- Matview staleness demo: insert into base table, matview unchanged until REFRESH; CONCURRENTLY requires unique
  index (show the error without it).
- RLS sandbox: switch role dropdown (alice/bob/jack/superuser) and watch departments rows; show policy text and
  EXPLAIN filter.
- FTS pipeline visual: raw text -> tokens -> stop words removed (positions preserved) -> stems ('featur', 'effici')
  -> tsvector; tsquery operators `&`, `|`, `!`, `<->`, `:*`.

### M7 Operations
- Backup/restore decision tree: pg_dump plain vs -Fc/-Fd/-Ft, pg_dumpall for globals, restore with psql vs
  pg_restore (-j parallel, -L selective), .pgpass for automation (first-match ordering, chmod 600).
- Uptime / version / connections mini-dashboard query set: pg_postmaster_start_time(), version(),
  server_version_num, pg_stat_activity long-running query finder.
