# Slice A — Preface, Part I Tutorial, Part II ch.4-7 (SQL Syntax, Data Definition, Data Manipulation, Queries)

Source: PostgreSQL 18.7 docs, `_order.tsv` idx 0-65 (66 pages). All pages read in full.

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 0 | index.txt | Master TOC: Preface; Parts I-VII (ch.1-69 incl. Internals ch.51+); Appendices A-O; Bibliography; Index. |
| 1 | preface.txt | What the book is; audience of each Part I-VII. |
| 2 | intro-whatis.txt | PostgreSQL = ORDBMS descended from Berkeley POSTGRES 4.2; feature list; extensibility list; liberal license. |
| 3 | history.txt | POSTGRES (1986, Stonebraker) -> Postgres95 (1994, Yu & Chen, SQL replaces PostQUEL) -> PostgreSQL (1996, version 6.0). |
| 4 | notation.txt | Synopsis conventions: [ ] optional, { | } choose one, ... repeat; `=>` SQL prompt, `$` shell prompt. |
| 5 | resources.txt | Wiki, web site, mailing lists, "Yourself!". |
| 6 | bug-reporting.txt | What is a bug, what to report (repro steps, output, expected, version, platform), where (pgsql-bugs, security@). |
| 7 | tutorial.txt | Part I intro + TOC of ch.1-3. |
| 8 | tutorial-start.txt | Ch.1 TOC only. |
| 9 | tutorial-install.txt | Install can be done by unprivileged user; PGHOST / PGPORT env vars. |
| 10 | tutorial-arch.txt | Client/server model; `postgres` supervisor forks one server process per connection. |
| 11 | tutorial-createdb.txt | `createdb` / `dropdb`, typical error messages, DB name rules (alphabetic first char, 63 bytes), -U / PGUSER. |
| 12 | tutorial-accessdb.txt | psql basics: prompts `=>` vs `=#` (superuser), `SELECT version()`, `\h`, `\?`, `\q`. |
| 13 | tutorial-sql.txt | Ch.2 TOC only. |
| 14 | tutorial-sql-intro.txt | Tutorial files in src/tutorial (basics.sql), `psql -s`, `\i`. |
| 15 | tutorial-concepts.txt | Relation = table; rows unordered; tables -> databases -> database cluster. |
| 16 | tutorial-table.txt | CREATE TABLE weather/cities; whitespace, `--` comments, case-insensitivity; standard types; DROP TABLE. |
| 17 | tutorial-populate.txt | INSERT (positional and column-list forms); COPY FROM server-side file, `\N` null marker. |
| 18 | tutorial-select.txt | SELECT list / table list / WHERE; AS; ORDER BY; DISTINCT (not ordered). |
| 19 | tutorial-join.txt | JOIN ... ON, implicit comma join, LEFT OUTER JOIN, self join, table aliases. |
| 20 | tutorial-agg.txt | Aggregates count/sum/avg/max/min, GROUP BY, HAVING vs WHERE, FILTER, subquery workaround. |
| 21 | tutorial-update.txt | UPDATE ... SET ... WHERE example. |
| 22 | tutorial-delete.txt | DELETE ... WHERE; unqualified DELETE empties table with no confirmation. |
| 23 | tutorial-advanced.txt | Ch.3 TOC only. |
| 24 | tutorial-advanced-intro.txt | Ch.3 intro; examples in advanced.sql. |
| 25 | tutorial-views.txt | CREATE VIEW as named query; views over views. |
| 26 | tutorial-fk.txt | PRIMARY KEY + REFERENCES; referential integrity error message format. |
| 27 | tutorial-transactions.txt | Atomicity, durability, isolation; BEGIN/COMMIT/ROLLBACK; implicit per-statement txn; SAVEPOINT / ROLLBACK TO / release. |
| 28 | tutorial-window.txt | Window functions: OVER, PARTITION BY, ORDER BY, default frame, evaluation order, WINDOW clause. |
| 29 | tutorial-inheritance.txt | INHERITS, ONLY; not integrated with unique/FK. |
| 30 | tutorial-conclusion.txt | Pointer onward. |
| 31 | sql.txt | Part II intro + TOC of ch.4-15 (syntax, DDL, DML, queries, types, functions, type conversion, indexes, FTS, concurrency, perf tips, parallel query). |
| 32 | sql-syntax.txt | Ch.4 TOC (4.1 Lexical, 4.2 Value Expressions, 4.3 Calling Functions). |
| 33 | sql-syntax-lexical.txt | Tokens, identifiers (NAMEDATALEN 64 -> 63 bytes), quoting/case folding, string/escape/Unicode/dollar/bit/numeric constants, operators, special chars, comments, precedence table. |
| 34 | sql-expressions.txt | All value-expression kinds: column refs, $n, subscripts, field selection, operators, function calls, aggregate expr (ORDER BY/DISTINCT/FILTER/WITHIN GROUP), window calls (frames), casts, COLLATE, scalar subquery, ARRAY[], ROW(), evaluation-order rules. |
| 35 | sql-syntax-calling-funcs.txt | Positional, named (`=>`, legacy `:=`), mixed notation; defaults; not usable for aggregates (except as window functions). |
| 36 | ddl.txt | Ch.5 TOC + scope statement. |
| 37 | ddl-basics.txt | Tables: fixed ordered columns, unordered rows, no implicit row id, column limit 250-1600, CREATE/DROP TABLE [IF EXISTS]. |
| 38 | ddl-default.txt | DEFAULT values/expressions evaluated at insert time; nextval(); SERIAL shorthand. |
| 39 | ddl-identity-columns.txt | GENERATED {ALWAYS | BY DEFAULT} AS IDENTITY; OVERRIDING SYSTEM VALUE; implicit NOT NULL but not unique; inheritance/partition behavior. |
| 40 | ddl-generated-columns.txt | GENERATED ALWAYS AS (expr) [VIRTUAL | STORED]; virtual is the default in 18; restrictions; inheritance; privileges; triggers; logical replication. |
| 41 | ddl-constraints.txt | CHECK, NOT NULL, UNIQUE (NULLS [NOT] DISTINCT), PRIMARY KEY, FOREIGN KEY (actions, MATCH FULL, column-list SET NULL), EXCLUDE. |
| 42 | ddl-system-columns.txt | tableoid, xmin, cmin, xmax, cmax, ctid; 32-bit XIDs and command IDs. |
| 43 | ddl-alter.txt | ALTER TABLE: add/drop column, add/drop constraint, SET/DROP DEFAULT, TYPE ... USING, RENAME; fast ADD COLUMN with constant default. |
| 44 | ddl-priv.txt | Ownership, GRANT/REVOKE, 15 privilege kinds, ACL abbreviations (Table 5.1), per-object summary (Table 5.2), aclitem format, default PUBLIC privileges. |
| 45 | ddl-rowsecurity.txt | RLS: ENABLE/FORCE ROW LEVEL SECURITY, CREATE POLICY USING / WITH CHECK, permissive (OR) vs restrictive (AND), BYPASSRLS, row_security GUC, race condition with sub-SELECT policies. |
| 46 | ddl-schemas.txt | Cluster > database > schema > objects; CREATE SCHEMA; public; search_path ("$user", public); pg_catalog implicit; secure usage patterns; PG15 change to public CREATE. |
| 47 | ddl-inherit.txt | Table inheritance: INHERITS, ONLY, `*`, tableoid, constraint inheritance/merging, ALTER ... [NO] INHERIT, permission/RLS semantics, caveats (indexes/FKs not inherited). |
| 48 | ddl-partitioning.txt | Declarative partitioning (RANGE/LIST/HASH), maintenance (ATTACH/DETACH [CONCURRENTLY], lock levels), limitations, inheritance-based partitioning, partition pruning (plan/init/exec), constraint exclusion, best practices. |
| 49 | ddl-foreign-data.txt | SQL/MED: foreign data wrapper -> foreign server -> user mapping -> foreign table (no local storage). |
| 50 | ddl-others.txt | List of other object kinds: views; functions/procedures/operators; types/domains; triggers/rewrite rules. |
| 51 | ddl-depend.txt | Dependency tracking, DROP ... CASCADE / RESTRICT (default), string-body functions not tracked vs BEGIN ATOMIC bodies tracked. |
| 52 | dml.txt | Ch.6 TOC + intro. |
| 53 | dml-insert.txt | INSERT forms: positional, column list, partial (left-fill extension), DEFAULT, DEFAULT VALUES, multi-row VALUES, INSERT ... SELECT; COPY tip. |
| 54 | dml-update.txt | UPDATE table SET col = expr [, ...] [WHERE]; no row ids -> use PK; zero matches not an error. |
| 55 | dml-delete.txt | DELETE FROM t [WHERE]; no WHERE deletes all rows. |
| 56 | dml-returning.txt | RETURNING for INSERT/UPDATE/DELETE/MERGE; default row per command; PG18 `old.`/`new.` qualifiers; trigger-modified rows. |
| 57 | queries.txt | Ch.7 TOC + intro. |
| 58 | queries-overview.txt | `[WITH with_queries] SELECT select_list FROM table_expression [sort_specification]`; SELECT without FROM. |
| 59 | queries-table-expressions.txt | FROM (joins, aliases, subqueries, table functions, ROWS FROM, WITH ORDINALITY, LATERAL), WHERE, GROUP BY/HAVING, GROUPING SETS/CUBE/ROLLUP, window function processing order. |
| 60 | queries-select-lists.txt | Select-list items, column labels (AS rules), DISTINCT and DISTINCT ON. |
| 61 | queries-union.txt | UNION/INTERSECT/EXCEPT [ALL], union compatibility, precedence (INTERSECT binds tighter), parenthesization with LIMIT. |
| 62 | queries-order.txt | ORDER BY ASC/DESC, NULLS FIRST/LAST defaults, output-name/number sort keys, B-tree opclass determines order. |
| 63 | queries-limit.txt | LIMIT {count|ALL} / OFFSET; need ORDER BY; planner considers LIMIT; large OFFSET inefficient. |
| 64 | queries-values.txt | VALUES lists as constant tables; default names column1..N; usable anywhere SELECT is. |
| 65 | queries-with.txt | CTEs: SELECT in WITH, WITH RECURSIVE (algorithm, SEARCH, CYCLE), MATERIALIZED / NOT MATERIALIZED, data-modifying CTEs and their snapshot semantics. |

## Notes by topic

### What PostgreSQL is, history, doc structure  [M1]  (source: index.txt, preface.txt, intro-whatis.txt, history.txt, notation.txt, resources.txt)
- PostgreSQL is an **object-relational database management system (ORDBMS)** based on POSTGRES, Version 4.2, developed at UC Berkeley Computer Science Department. Open-source descendant of the Berkeley code.
- Headline features listed: complex queries, foreign keys, triggers, updatable views, transactional integrity, multiversion concurrency control (MVCC).
- User-extensible in: data types, functions, operators, aggregate functions, index methods, procedural languages.
- License: "liberal license" — usable/modifiable/distributable by anyone free of charge for any purpose (private, commercial, academic).
- History timeline:
  1. POSTGRES project led by Prof. Michael Stonebraker; sponsored by DARPA, ARO, NSF, ESL Inc. Implementation began **1986**.
  2. First "demoware" operational 1987, shown at 1988 ACM-SIGMOD. Version 1 released June 1989; Version 2 June 1990 (redesigned rule system); Version 3 in 1991 (multiple storage managers, improved executor, rewritten rule system).
  3. Late 1992: primary data manager for Sequoia 2000. Illustra (later Informix, now IBM) commercialized it. Berkeley project officially ended with **Version 4.2**.
  4. **1994**: Andrew Yu and Jolly Chen added an SQL interpreter -> **Postgres95**. Completely ANSI C, code size trimmed 25%, 30-50% faster on Wisconsin Benchmark vs POSTGRES 4.2. PostQUEL replaced by SQL (libpq is named after PostQUEL). Subqueries not supported until PostgreSQL. New `psql` (GNU Readline) replaced the old `monitor` program. libpgtcl added. Instance-level rule system removed (rewrite rules kept). GNU make used.
  5. **1996**: renamed **PostgreSQL**; version numbering restarted at **6.0**. "Postgres" remains an official project name/nickname.
- Documentation parts: I Tutorial; II The SQL Language; III Server Administration; IV Client Interfaces; V Server Programming; VI Reference; VII Internals; Appendices A-O (A Error Codes, B Date/Time Support, C SQL Key Words, D SQL Conformance, E Release Notes, F Additional Supplied Modules and Extensions, G Additional Supplied Programs, H External Projects, I Source Code Repository, J Documentation, K PostgreSQL Limits, L Acronyms, M Glossary, N Color Support, O Obsolete or Renamed Features).
- Part III chapters 16-31, Part IV 32-35 (libpq, Large Objects, ECPG, Information Schema), Part V 36-50 (Extending SQL, Triggers, Event Triggers, Rule System, Procedural Languages, PL/pgSQL, PL/Tcl, PL/Perl, PL/Python, SPI, Background Workers, Logical Decoding, Replication Progress Tracking, Archive Modules, OAuth Validator Modules), Part VII starts at ch.51 (Overview of Internals), 52 System Catalogs, 53 System Views, 54 Frontend/Backend Protocol, 55 Coding Conventions.
- Synopsis conventions: `[ ]` optional; `{ }` with `|` = choose one alternative; `...` = preceding element can repeat; everything else (including parentheses) literal. SQL prompt `=>`, shell prompt `$`.
- "Administrator" = person in charge of installing/running the server; "user" = anyone using any part of the system.

### Bug reporting  [M1, low relevance]  (source: bug-reporting.txt)
- A bug = program terminates with fatal signal / OS error pointing to the program; wrong output; refuses valid input; accepts invalid input without notice; fails to build per instructions on supported platforms. Slowness and non-conformance to SQL (unless claimed) are not necessarily bugs.
- Report must contain: exact reproducible steps from program start (self-contained: CREATE TABLE + INSERT + query; ideally a psql script, with empty `~/.psqlrc`); output received (most verbose: psql `\set VERBOSITY verbose`, server `log_error_verbosity = verbose`); expected output; changed options/env/config; deviations from install instructions; version (`SELECT version();`, `postgres --version`, `psql --version`); platform (kernel, C library, CPU, memory).
- Terminology: a single **backend process** crash differs from a crash of the parent "postgres" process; say which. psql (client) is separate from the backend.
- Where: `pgsql-bugs@lists.postgresql.org` (or web form); security issues privately to `security@postgresql.org`; docs issues to `pgsql-docs@lists.postgresql.org`; portability on unsupported platforms to `pgsql-hackers`. Not to user lists (pgsql-sql, pgsql-general).

### Client/server architecture & getting connected  [M1]  (source: tutorial-install.txt, tutorial-arch.txt, tutorial-createdb.txt, tutorial-accessdb.txt)
- PostgreSQL can be installed by any unprivileged user; no root needed.
- Environment variables: `PGHOST` (server host), `PGPORT` (port), `PGUSER` (role name; or `-U` switch).
- **Client/server model**. A session consists of cooperating processes:
  - A **server process** that manages database files, accepts connections, performs actions on behalf of clients. The server program is called **`postgres`**.
  - The user's **client (frontend) application**: text tool, GUI, web server, maintenance tool.
- Client and server can be on different hosts, communicating over TCP/IP; files accessible on the client may not be accessible (or have a different name) on the server.
- Concurrency model: the server "**forks**" a **new process for each connection**. From then on client and the new server process communicate without intervention by the original `postgres` process. The **supervisor server process** is always running, waiting for connections; client and associated server processes come and go.
- `createdb mydb` / `dropdb mydb` (shell wrappers). Default Unix socket path shown in error: `/tmp/.s.PGSQL.5432` (default port 5432).
- Typical failures and meaning:
  - `createdb: command not found` -> not installed / PATH (try `/usr/local/pgsql/bin/createdb`).
  - `connection to server on socket "/tmp/.s.PGSQL.5432" failed: No such file or directory` -> server not started or not listening there.
  - `FATAL: role "joe" does not exist` -> no PostgreSQL role for that OS user. PostgreSQL user accounts are distinct from OS accounts.
  - `ERROR: permission denied to create database` -> role lacks the privilege to create databases.
- There is always a PostgreSQL user with the same name as the OS user that started the server, and that user always has permission to create databases.
- Database names: must have an **alphabetic first character**, limited to **63 bytes**. `createdb` with no arg creates a DB named after the current user; many tools default the DB name to the user name. `dropdb` always needs an explicit name; it physically removes all files and cannot be undone.
- Access methods: psql; GUI tools (pgAdmin, ODBC/JDBC suites); custom apps via language bindings (Part IV).
- psql prompt `mydb=>` (ordinary user) vs `mydb=#` (**superuser** — not subject to access controls). Greeting `psql (18.7)`. `SELECT version();` returns e.g. `PostgreSQL 18.7 on x86_64-pc-linux-gnu, compiled by gcc ..., 64-bit`. `SELECT current_date;` `SELECT 2 + 2;` (column named `?column?`).
- psql internal (backslash) commands are not SQL: `\h` (SQL syntax help), `\?` (internal command help), `\q` (quit), `\i file` (run file); `psql -s` = single-step mode (pauses before sending each statement).

### Relational concepts & first tables  [M1, M3]  (source: tutorial-sql-intro.txt, tutorial-concepts.txt, tutorial-table.txt, tutorial-populate.txt)
- PostgreSQL is a **relational DBMS**: manages data in **relations** (mathematical term for table). Contrast: hierarchical DB (Unix files/directories), object-oriented DB.
- Each **table** = named collection of **rows**; each row has the same set of named **columns**; each column has a **data type**. Columns have a fixed order; **SQL does not guarantee row order** in any way.
- Tables are grouped into **databases**; the collection of databases managed by a single server instance = **database cluster**.
- Tutorial sample files: source tree `src/tutorial/` (`make`, then `psql -s mydb`, `\i basics.sql`; ch.3 uses `advanced.sql`).
- Sample schema used throughout tutorial:
  ```sql
  CREATE TABLE weather (city varchar(80), temp_lo int, temp_hi int, prcp real, date date);
  CREATE TABLE cities (name varchar(80), location point);
  ```
- Lexical basics: whitespace (spaces, tabs, newlines) free-form; `--` comment to end of line; SQL is case-insensitive for key words and identifiers except double-quoted identifiers.
- Standard SQL types supported: `int`, `smallint`, `real`, `double precision`, `char(N)`, `varchar(N)`, `date`, `time`, `timestamp`, `interval`; plus general-utility and geometric types (`point` is PostgreSQL-specific). Type names are **not key words** in the syntax except where required for SQL-standard special cases (because users can define arbitrary types).
- `INSERT INTO weather VALUES ('San Francisco', 46, 50, 0.25, '1994-11-27');` — non-numeric constants in single quotes. `point` input: `'(-194.0, 53.0)'`.
- Column-list INSERT lets you reorder/omit columns (omitted -> default/NULL). Explicit column lists considered better style.
- `COPY weather FROM '/home/user/weather.txt';` — file must be on the **server (backend) machine**, since the backend reads it directly. Text format: tab-separated, `\N` = NULL. COPY is faster than INSERT but less flexible.
- `DROP TABLE tablename;`

### Tutorial querying: SELECT, joins, aggregates, UPDATE, DELETE  [M3]  (source: tutorial-select.txt, tutorial-join.txt, tutorial-agg.txt, tutorial-update.txt, tutorial-delete.txt)
- SELECT anatomy: **select list** (columns/expressions to return), **table list** (FROM), optional **qualification** (WHERE). `*` = all columns (bad style in production: adding a column changes results).
- Expressions in select list: `SELECT city, (temp_hi+temp_lo)/2 AS temp_avg, date FROM weather;` AS optional.
- WHERE takes a Boolean expression; only rows where it is **true** are returned; `AND`, `OR`, `NOT`.
- `ORDER BY city, temp_lo` — partial sort keys give unspecified order among ties.
- `SELECT DISTINCT city FROM weather;` — DISTINCT does **not** guarantee ordering in current PostgreSQL (older versions' implementation sorted as a side effect). Use `DISTINCT ... ORDER BY`.
- Join = query accessing multiple tables (or multiple instances of the same table) at once. Conceptual model: compare each pair of rows (actual execution is more efficient, invisible to user).
  - `SELECT * FROM weather JOIN cities ON city = name;` -> inner join; unmatched rows (Hayward) dropped; both join columns appear.
  - Qualify columns (`weather.city`) when names are ambiguous; good style to qualify all in joins.
  - Older implicit syntax `FROM weather, cities WHERE city = name` gives identical results; `JOIN/ON` was introduced in SQL-92.
  - `LEFT OUTER JOIN`: every left row appears at least once; unmatched right columns are NULL. Right outer and full outer joins also exist.
  - **Self join** with aliases: `FROM weather w1 JOIN weather w2 ON w1.temp_lo < w2.temp_lo AND w1.temp_hi > w2.temp_hi`.
- Aggregates: `count`, `sum`, `avg`, `max`, `min` compute one result from many rows.
  - Aggregates cannot appear in WHERE (WHERE determines which rows enter aggregation, so it is evaluated first). Use a subquery: `WHERE temp_lo = (SELECT max(temp_lo) FROM weather)`.
  - `GROUP BY city` -> one output row per group; `HAVING max(temp_lo) < 40` filters groups.
  - **WHERE vs HAVING**: WHERE selects input rows *before* grouping/aggregation (no aggregates allowed); HAVING selects group rows *after*. HAVING without aggregates is allowed but is better as WHERE (more efficient: avoids grouping rows that fail).
  - `FILTER`: per-aggregate row filter: `count(*) FILTER (WHERE temp_lo < 45)`; other aggregates in the same query still see all rows.
  - `LIKE 'S%'` pattern matching.
- `UPDATE weather SET temp_hi = temp_hi - 2, temp_lo = temp_lo - 2 WHERE date > '1994-11-28';`
- `DELETE FROM weather WHERE city = 'Hayward';` `DELETE FROM tablename;` with no qualification removes all rows — **no confirmation requested**.

### Tutorial advanced: views, FKs, transactions, savepoints  [M3, M5, M6]  (source: tutorial-views.txt, tutorial-fk.txt, tutorial-transactions.txt)
- View = named query usable like a table: `CREATE VIEW myview AS SELECT name, temp_lo, temp_hi, prcp, date, location FROM weather, cities WHERE city = name;` Views encapsulate table structure behind consistent interfaces; views on views are common.
- Referential integrity via FK:
  ```sql
  CREATE TABLE cities (name varchar(80) primary key, location point);
  CREATE TABLE weather (city varchar(80) references cities(name), temp_lo int, temp_hi int, prcp real, date date);
  ```
  Violation message: `ERROR: insert or update on table "weather" violates foreign key constraint "weather_city_fkey"` / `DETAIL: Key (city)=(Berkeley) is not present in table "cities".` (auto constraint name pattern `<table>_<col>_fkey`).
- **Transaction** = bundles multiple steps into a single all-or-nothing operation. Properties described:
  - **Atomic**: from other transactions' viewpoint it happens completely or not at all.
  - **Durable**: all updates are logged in permanent storage (on disk) *before* the transaction is reported complete.
  - **Isolated**: updates by an open transaction are invisible to others until it completes, then all become visible simultaneously.
- `BEGIN; ... COMMIT;` = **transaction block**. `ROLLBACK` cancels. Without BEGIN, **every statement runs in its own implicit transaction** (implicit BEGIN and, if successful, COMMIT). Some client libraries issue BEGIN/COMMIT automatically.
- **Savepoints**: `SAVEPOINT name;` ... `ROLLBACK TO name;` discards changes after the savepoint, keeps earlier ones. After rolling back to a savepoint it **remains defined** (can roll back to it repeatedly). Releasing or rolling back to a savepoint **automatically releases all savepoints defined after it**. Releasing frees resources.
- `ROLLBACK TO` is the **only way to regain control of a transaction block put into aborted state by an error**, short of full rollback.
- Bank example: `UPDATE accounts SET balance = balance - 100.00 WHERE name = 'Alice'; SAVEPOINT my_savepoint; UPDATE ... 'Bob'; ROLLBACK TO my_savepoint; UPDATE ... 'Wally'; COMMIT;`

### Window functions (tutorial level)  [M3]  (source: tutorial-window.txt)
- A window function computes across a set of rows related to the current row, **without collapsing rows** (unlike non-window aggregates).
- Always has an `OVER` clause directly after the function name/args — this is what syntactically distinguishes it. `PARTITION BY` divides rows into partitions; function computed across the current row's partition. `ORDER BY` inside OVER controls processing order (need not match output order).
- Example table `empsalary(depname, empno, salary, enroll_date)`; `avg(salary) OVER (PARTITION BY depname)`; `row_number() OVER (PARTITION BY depname ORDER BY salary DESC)` (ties numbered in unspecified order).
- Rows considered = the "virtual table" from FROM as filtered by WHERE, GROUP BY, HAVING. Multiple window functions with different OVERs all act on that same row collection.
- Omit PARTITION BY -> single partition containing all rows.
- **Window frame**: per-row subset of its partition. Default frame: with ORDER BY = start of partition through current row **plus following peers equal per ORDER BY**; without ORDER BY = whole partition.
  - `sum(salary) OVER ()` -> same grand total (47100) on every row.
  - `sum(salary) OVER (ORDER BY salary)` -> running sum where duplicates (4800, 4800; 5200, 5200) get the same value (25700; 41100) because peers are included.
- Allowed **only in SELECT list and ORDER BY**. Forbidden in GROUP BY, HAVING, WHERE — they logically execute after those. Window functions execute **after non-window aggregates**: an aggregate call may appear inside a window function's arguments, not vice versa.
- To filter on window results use a sub-select: `SELECT ... FROM (SELECT ..., row_number() OVER (PARTITION BY depname ORDER BY salary DESC, empno) AS pos FROM empsalary) AS ss WHERE pos < 3;`
- Named windows: `SELECT sum(salary) OVER w, avg(salary) OVER w FROM empsalary WINDOW w AS (PARTITION BY depname ORDER BY salary DESC);`

### Lexical structure  [M3, M4 (parser)]  (source: sql-syntax-lexical.txt)
- SQL input = sequence of **commands**; a command = sequence of **tokens** terminated by `;` (end of input also terminates). Token kinds: key word, identifier, quoted identifier, literal/constant, special character symbol. Comments are not tokens (equivalent to whitespace).
- **Identifiers / key words**: begin with a letter (a-z, also letters with diacritics and non-Latin letters) or underscore; subsequent chars letters, underscores, digits 0-9, or `$` (dollar not allowed by SQL standard). The standard will never define a key word containing digits or starting/ending with underscore.
- Max identifier length: system uses at most **NAMEDATALEN-1 bytes**; default **NAMEDATALEN = 64** -> **63 bytes**; longer names are **truncated** (not an error). Change via `NAMEDATALEN` in `src/include/pg_config_manual.h`.
- Key words and unquoted identifiers are case-insensitive; unquoted names are **folded to lower case** (contrary to SQL standard, which folds to upper case). `FOO`, `foo`, `"foo"` are the same; `"Foo"` and `"FOO"` differ. Advice: always quote a name or never quote it.
- **Quoted (delimited) identifier**: `"..."`; always an identifier, never a key word; any char except code zero; embed `"` by doubling; length limit still applies; case-sensitive.
- Unicode-escaped identifier: `U&"d\0061t\+000061"` (4-hex-digit `\XXXX` or 6-hex-digit `\+XXXXXX`); custom escape char via `UESCAPE '!'` (any single char except hex digit, `+`, `'`, `"`, whitespace); double the escape char for a literal. Surrogate pairs accepted and combined. If server encoding is not UTF-8, code point is converted (error if impossible). `U&` conflicts with `&` operator — use spaces.
- **Constants**: three implicitly typed kinds: strings, bit strings, numbers.
  - String: `'...'`; embed quote by doubling (`'Dianne''s horse'`). Two string constants separated only by whitespace **containing at least one newline** are concatenated (`'foo'<newline>'bar'` = `'foobar'`); on the same line it is a syntax error (SQL standard behavior).
  - Escape string: `E'...'` (PostgreSQL extension). Table 4.1 escapes: `\b` backspace, `\f` form feed, `\n` newline, `\r` carriage return, `\t` tab, `\o`/`\oo`/`\ooo` octal byte, `\xh`/`\xhh` hex byte, `\uxxxx` / `\Uxxxxxxxx` 16/32-bit Unicode. Any other char after backslash taken literally (`\\`, `\'`). You are responsible for valid byte sequences in server encoding. Code-zero char cannot be in a string constant.
  - GUC **`standard_conforming_strings`**: default **on** since 9.1 -> backslashes are literal in ordinary strings, escapes only in `E''`. If off, backslash escapes recognized in both. Related GUCs: **`escape_string_warning`**, **`backslash_quote`**.
  - Unicode string: `U&'d\0061t\+000061'` [`UESCAPE '!'`]; only works when `standard_conforming_strings` is on (else rejected with error, for SQL-injection safety).
  - **Dollar quoting**: `$$...$$` or `$tag$...$tag$`; no escapes at all inside; nest by using different tags; tag follows unquoted-identifier rules but cannot contain `$`; tags are **case sensitive**; must be separated by whitespace from a preceding keyword/identifier. Not SQL standard. Classic use: function bodies (`$function$ ... $q$[\t\r\n\v\\]$q$ ... $function$`).
  - Bit string: `B'1001'` (only 0/1); hex `X'1FF'` (4 bits per hex digit). Continuable across lines like strings; no dollar quoting.
  - Numeric forms: `digits`, `digits.[digits][e[+-]digits]`, `[digits].digits[e[+-]digits]`, `digitse[+-]digits`. Non-decimal integers: `0xhex`, `0ooct`, `0bbin` (prefix and digits case-insensitive; integers only). Underscores for grouping between digits: `1_500_000_000`, `0b10001000_00000000`, `0o_1_755`, `0xFFFF_FFFF`, `1.618_034`; not at start/end of constant or digit group (not adjacent to decimal point or exponent marker), no double underscore. A leading `+`/`-` is an **operator**, not part of the constant.
  - **Initial type of numeric constant**: no decimal point/exponent -> `integer` if fits 32 bits, else `bigint` if fits 64 bits, else `numeric`. With decimal point and/or exponent -> always `numeric`. Then coerced by type resolution.
  - Typed constants: `type 'string'`, `'string'::type`, `CAST('string' AS type)`; also `typename('string')` for some types. `type 'string'` works only for simple literal constants and **not for array types**. `CAST` is SQL standard; `type 'string'` is a generalization of standard; `::` and function-call are historical PostgreSQL.
- **Operators**: name = up to NAMEDATALEN-1 (63) chars from `+ - * / < > = ~ ! @ # % ^ & | \` ?`. Restrictions: `--` and `/*` cannot appear in an operator name; a multi-char operator cannot end in `+` or `-` unless it also contains one of `~ ! @ # % ^ & | \` ?` (so `@-` OK, `*-` not).
- **Special characters**: `$n` positional parameter; `()` grouping/precedence; `[]` array element; `,` list separator; `;` terminates command; `:` array slice (and variable prefix in Embedded SQL); `*` all fields / parameterless aggregate; `.` numeric constants and schema.table.column separator.
- **Comments**: `-- to end of line`; `/* ... */` block comments **nest** (per SQL standard, unlike C). Removed before syntax analysis, replaced by whitespace.
- **Operator precedence (Table 4.2, highest to lowest)**:

  | Operator/Element | Assoc. | Description |
  |---|---|---|
  | `.` | left | table/column name separator |
  | `::` | left | PostgreSQL-style typecast |
  | `[ ]` | left | array element selection |
  | `+ -` | right | unary plus, unary minus |
  | `COLLATE` | left | collation selection |
  | `AT` | left | AT TIME ZONE, AT LOCAL |
  | `^` | left | exponentiation |
  | `* / %` | left | multiplication, division, modulo |
  | `+ -` | left | addition, subtraction |
  | (any other operator) | left | all other native and user-defined operators |
  | `BETWEEN IN LIKE ILIKE SIMILAR` | — | range containment, set membership, string matching |
  | `< > = <= >= <>` | — | comparison operators |
  | `IS ISNULL NOTNULL` | — | IS TRUE, IS FALSE, IS NULL, IS DISTINCT FROM, etc. |
  | `NOT` | right | logical negation |
  | `AND` | left | logical conjunction |
  | `OR` | left | logical disjunction |

  - Precedence is **hard-wired into the parser**; applies to user-defined operators with the same names as built-ins. `OPERATOR(schema.op)` always has "any other operator" precedence regardless of which operator is inside. Note `^` is left-associative. Pre-9.5 rules differed (`<= >= <>` were generic operators; IS tests had higher priority).

### Value expressions  [M3, M4]  (source: sql-expressions.txt)
- Kinds: constant; column reference; positional parameter; subscripted expr; field selection; operator invocation; function call; aggregate expression; window function call; type cast; collation expression; scalar subquery; array constructor; row constructor; parenthesized expression. Plus special constructs (e.g. `IS NULL`) documented in ch.9.
- Column reference: `correlation.columnname` (correlation = table name, possibly schema-qualified, or FROM alias); qualifier optional if unique.
- Positional parameter: `$number` (SQL function bodies, prepared statements, out-of-line client parameters).
- Subscripts: `expression[subscript]`, slice `expression[lower:upper]`; subscript expressions are **rounded to nearest integer**; parenthesize the array expression unless it is a column reference or positional parameter: `(arrayfunction(a,b))[42]`, `mytable.two_d_column[17][34]`, `$1[10:42]`.
- Field selection: `expression.fieldname`; parentheses required for composite columns: `(compositecol).somefield`, `(mytable.compositecol).somefield`, `(rowfunction(a,b)).col3`; `(compositecol).*` for all fields. A qualified column reference is a special case of field selection.
- Operator invocation: `expr op expr` (binary infix), `op expr` (unary prefix) — no postfix operators; `OPERATOR(schema.operatorname)`.
- Function call: `function_name([expression [, ...]])`. Functional/attribute notation interchangeable for single composite arg: `col(table)` == `table.col` ("computed fields").
- **Aggregate expression syntax** (5 forms):
  ```
  aggregate_name (expression [ , ... ] [ order_by_clause ] ) [ FILTER ( WHERE filter_clause ) ]
  aggregate_name (ALL expression [ , ... ] [ order_by_clause ] ) [ FILTER ( WHERE filter_clause ) ]
  aggregate_name (DISTINCT expression [ , ... ] [ order_by_clause ] ) [ FILTER ( WHERE filter_clause ) ]
  aggregate_name ( * ) [ FILTER ( WHERE filter_clause ) ]
  aggregate_name ( [ expression [ , ... ] ] ) WITHIN GROUP ( order_by_clause ) [ FILTER ( WHERE filter_clause ) ]
  ```
  - ALL is default. DISTINCT: once per distinct value (or distinct set for multiple exprs). `(*)`: once per input row (only useful for `count(*)`).
  - Most aggregates **ignore null inputs** (all built-ins unless stated). `count(*)` = total rows; `count(f1)` = non-null f1; `count(distinct f1)` = distinct non-null.
  - Input order is unspecified unless `ORDER BY` inside the argument list (after all args): `array_agg(v ORDER BY v DESC)`, `string_agg(a, ',' ORDER BY a)`. Aggregate ORDER BY expressions cannot be output-column names/numbers. `string_agg(a ORDER BY a, ',')` is syntactically valid but wrong (one arg, two sort keys).
  - jsonb keeps the last matching key, so ordering matters: `jsonb_object_agg(k, v ORDER BY v)`.
  - With DISTINCT + ORDER BY, ORDER BY expressions can only reference columns in the DISTINCT list.
  - **Ordered-set aggregates** require `WITHIN GROUP (ORDER BY ...)`; args before WITHIN GROUP are **direct arguments** (evaluated once per aggregate call, not per row; may contain variables only if grouped); empty direct-arg list written `()` (PostgreSQL also accepts `(*)`). Example: `percentile_cont(0.5) WITHIN GROUP (ORDER BY income)`.
  - `FILTER (WHERE ...)`: only rows where filter is true are fed.
  - Aggregate may appear only in the **result list or HAVING** of a SELECT. In a subquery, if the aggregate's arguments (and filter) contain only outer-level variables, the aggregate **belongs to the nearest such outer level** and acts as an outer reference/constant for the subquery.
- **Window function call syntax**:
  ```
  function_name ([expression [, expression ... ]]) [ FILTER ( WHERE filter_clause ) ] OVER window_name
  function_name ([expression [, expression ... ]]) [ FILTER ( WHERE filter_clause ) ] OVER ( window_definition )
  function_name ( * ) [ FILTER ( WHERE filter_clause ) ] OVER window_name
  function_name ( * ) [ FILTER ( WHERE filter_clause ) ] OVER ( window_definition )
  ```
  window_definition:
  ```
  [ existing_window_name ]
  [ PARTITION BY expression [, ...] ]
  [ ORDER BY expression [ ASC | DESC | USING operator ] [ NULLS { FIRST | LAST } ] [, ...] ]
  [ frame_clause ]
  ```
  frame_clause:
  ```
  { RANGE | ROWS | GROUPS } frame_start [ frame_exclusion ]
  { RANGE | ROWS | GROUPS } BETWEEN frame_start AND frame_end [ frame_exclusion ]
  ```
  frame_start / frame_end: `UNBOUNDED PRECEDING` | `offset PRECEDING` | `CURRENT ROW` | `offset FOLLOWING` | `UNBOUNDED FOLLOWING`.
  frame_exclusion: `EXCLUDE CURRENT ROW` | `EXCLUDE GROUP` | `EXCLUDE TIES` | `EXCLUDE NO OTHERS`.
  - `OVER wname` is not exactly `OVER (wname ...)`: the latter copies and modifies the definition and is **rejected if the referenced window has a frame clause**.
  - PARTITION BY / ORDER BY in windows cannot use output-column names or numbers. No PARTITION BY -> one partition; no ORDER BY -> unspecified processing order.
  - If frame_end omitted it defaults to `CURRENT ROW`.
  - **Modes**: ROWS: CURRENT ROW = the current row; offset = number of rows. GROUPS: offset = number of **peer groups** (rows equal in ORDER BY); requires ORDER BY. RANGE: CURRENT ROW start = first peer, end = last peer; `offset PRECEDING/FOLLOWING` requires **exactly one ORDER BY column**; offset = max value difference; offset type matches column (numeric) or is `interval` for datetime columns (e.g. `RANGE BETWEEN '1 day' PRECEDING AND '10 days' FOLLOWING`).
  - Offsets: expression with no variables, aggregates, or window functions; non-null, non-negative.
  - `0 PRECEDING` / `0 FOLLOWING` == CURRENT ROW in ROWS and GROUPS (and normally RANGE).
  - Exclusions: CURRENT ROW excludes current row; GROUP excludes current row and its peers; TIES excludes peers but not current row; NO OTHERS = default.
  - **Default frame** = `RANGE UNBOUNDED PRECEDING` == `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. With ORDER BY: partition start through current row's last peer. Without ORDER BY: entire partition (all rows are peers).
  - Restrictions: frame_start cannot be UNBOUNDED FOLLOWING; frame_end cannot be UNBOUNDED PRECEDING; frame_end cannot appear earlier in the option list than frame_start (`RANGE BETWEEN CURRENT ROW AND offset PRECEDING` illegal). `ROWS BETWEEN 7 PRECEDING AND 8 PRECEDING` is allowed though it never selects rows.
  - FILTER only for window functions that are aggregates. Any built-in or user-defined general-purpose or statistical aggregate can be a window function; **ordered-set and hypothetical-set aggregates cannot**. Window-specific functions do not allow DISTINCT or ORDER BY in the argument list. `count(*) OVER (PARTITION BY x ORDER BY y)`.
- **Type casts**: `CAST(expression AS type)` (standard) or `expression::type` (historical). Cast on known-type expr = run-time conversion (needs a defined cast). Cast on unadorned string literal = initial type assignment (works for any type if the literal is valid input). Automatic casting only for casts marked "OK to apply implicitly" in catalogs. Function-like `typename(expression)` works only for types whose names are valid function names (`float8(x)` yes, `double precision(x)` no; `interval`, `time`, `timestamp` only if double-quoted) — discouraged. It is literally a call to the conversion function named after the output type.
- **COLLATE**: `expr COLLATE collation`; binds tighter than operators. Default: derived from columns, else database default collation. Uses: `ORDER BY a COLLATE "C"`; `WHERE a > 'foo' COLLATE "C"` (attach to an input argument; either argument works). Conflicting explicit COLLATEs on multiple args = error. `(a > 'foo') COLLATE "C"` = error (boolean is non-collatable).
- **Scalar subquery**: parenthesized SELECT returning exactly one row, one column. More than one row/column = error; **zero rows = NULL** (no error). Can reference outer variables (constants during one evaluation). `SELECT name, (SELECT max(pop) FROM cities WHERE cities.state = states.name) FROM states;`
- **Array constructor**: `ARRAY[1,2,3+4]` -> `{1,2,7}`; element type = common type by UNION/CASE rules (§10.5); cast whole constructor `ARRAY[1,2,22.7]::integer[]` -> `{1,2,23}`. Nested: `ARRAY[ARRAY[1,2],ARRAY[3,4]]` == `ARRAY[[1,2],[3,4]]` (inner ARRAY keyword optional); must be rectangular. Empty array needs a cast: `ARRAY[]::integer[]`. From subquery: `ARRAY(SELECT oid FROM pg_proc WHERE proname LIKE 'bytea%')` (parentheses; single column; array-typed column gives one higher dimension). Subscripts of ARRAY-built values start at **1**.
- **Row constructor**: `ROW(1,2.5,'this is a test')`; `ROW` keyword optional when more than one expression. `ROW(t.*, 42)` expands `t.*` (since 8.2; use `ROW(t, 42)` for nested row). Default type = anonymous `record`; cast to named composite (`::mytable`, `CAST(... AS myrowtype)`) to disambiguate overloaded functions (`ERROR: function getf1(record) is not unique`).
- **Expression evaluation rules**:
  - Order of evaluation of subexpressions is **not defined**; operands not necessarily left-to-right.
  - If the result can be determined from part of the expression, the rest might not be evaluated: `SELECT true OR somefunc();` and `SELECT somefunc() OR true;` both (probably) skip the call. Not the same as left-to-right short-circuiting.
  - Do not rely on side effects/evaluation order, especially in WHERE/HAVING (they are "extensively reprocessed" during planning; Boolean expressions may be reorganized per Boolean algebra).
  - Force order with `CASE`: `WHERE CASE WHEN x > 0 THEN y/x > 1.5 ELSE false END` (defeats optimization; better `y > 1.5*x`).
  - CASE limitations: (a) constant subexpressions are evaluated at **plan time** (IMMUTABLE functions/operators can be folded): `SELECT CASE WHEN x > 0 THEN x ELSE 1/0 END FROM tab;` likely fails with division by zero during planning. In PL/pgSQL use IF-THEN-ELSE instead. (b) CASE cannot prevent evaluation of contained **aggregates**, which are computed before other select-list/HAVING expressions: `SELECT CASE WHEN min(employees) > 0 THEN avg(expenses / employees) END FROM departments;` can fail; fix with WHERE or FILTER.

### Calling functions: positional, named, mixed notation  [M6, M3]  (source: sql-syntax-calling-funcs.txt)
- Example: `CREATE FUNCTION concat_lower_or_upper(a text, b text, uppercase boolean DEFAULT false) RETURNS text AS $$ SELECT CASE WHEN $3 THEN UPPER($1 || ' ' || $2) ELSE LOWER($1 || ' ' || $2) END; $$ LANGUAGE SQL IMMUTABLE STRICT;`
- Positional: `concat_lower_or_upper('Hello', 'World', true)`; params with defaults can be omitted only **right to left**.
- Named: `name => value` in any order: `concat_lower_or_upper(a => 'Hello', uppercase => true, b => 'World')`; any combination of defaulted params may be omitted. Legacy `:=` still supported.
- Mixed: positional first, then named: `concat_lower_or_upper('Hello', 'World', uppercase => true)`; named cannot precede positional.
- Named and mixed notation **cannot be used when calling an aggregate function** (but work when an aggregate is used as a window function).

### Table basics, defaults  [M1, M2, M3]  (source: ddl-basics.txt, ddl-default.txt)
- Table: fixed number and order of named columns; variable number of rows; **no guaranteed row order** unless sorted; **SQL assigns no unique row identifier**, so fully identical rows are possible.
- Frequently used types named: `integer`, `numeric`, `text`, `date`, `time`, `timestamp`.
- **Column limit: between 250 and 1600 depending on column types.**
- `DROP TABLE t;` errors if missing; `DROP TABLE IF EXISTS` avoids the error (not standard SQL).
- Default value: if none declared, default is **NULL**. `price numeric DEFAULT 9.99`. Default can be an **expression evaluated whenever the default is inserted** (not at table creation): `DEFAULT CURRENT_TIMESTAMP`, `DEFAULT nextval('products_product_no_seq')`. Shorthand `SERIAL` (see §8.1.4). DML can explicitly request the default (`DEFAULT` keyword).
- A constraint violation raises an error even if the value came from the default definition.

### Identity columns  [M2, M3]  (source: ddl-identity-columns.txt)
- `id bigint GENERATED ALWAYS AS IDENTITY` or `GENERATED BY DEFAULT AS IDENTITY` — generated from an **implicit sequence**; values start at 1.
- INSERT without the column (or with `DEFAULT`) uses the sequence; `DEFAULT` also usable in UPDATE.
- **ALWAYS**: a user-specified value in INSERT is accepted only with `OVERRIDING SYSTEM VALUE`. **BY DEFAULT**: user value takes precedence (like an ordinary default).
- Data type must be one supported by sequences. Sequence properties can be given at creation (CREATE TABLE) or changed (ALTER TABLE).
- Identity column is **automatically NOT NULL** but **not automatically unique** (sequence can be reset, values can be inserted manually) — add PRIMARY KEY / UNIQUE.
- Inheritance: child tables do **not** inherit identity columns/properties; a column is treated as identity iff it is identity in the table named in the statement. Partitions **do** inherit identity columns from the partitioned table, cannot have their own, and properties are consistent across the partition hierarchy.

### Generated columns (stored and virtual; PG18)  [M2, M3, M6]  (source: ddl-generated-columns.txt)
- "For columns what a view is for tables." Two kinds:
  - **STORED**: computed when written (insert/update); occupies storage like a normal column (analogous to a materialized view that is always up to date).
  - **VIRTUAL**: occupies no storage; computed when read (analogous to a view).
- Syntax: `height_in numeric GENERATED ALWAYS AS (height_cm / 2.54)` — **default kind is VIRTUAL** (PG18); write `VIRTUAL` or `STORED` to be explicit.
- Cannot be written directly: no value in INSERT/UPDATE, but keyword `DEFAULT` is allowed.
- Default vs generated: default evaluated once at insert if no value given, may not reference other columns, may use volatile functions (`random()`, current time); generated column recomputed whenever the row changes, cannot be overridden, normally references other columns, cannot use volatile functions.
- Restrictions:
  1. Expression may use only **immutable** functions; no subqueries; cannot reference anything other than the current row.
  2. Cannot reference another generated column.
  3. Cannot reference a system column, **except `tableoid`**.
  4. A **virtual** generated column cannot have a user-defined type, and its expression must not reference user-defined functions or types (built-ins only, including indirectly via operators/casts). Not a restriction for stored.
  5. Cannot have a column default or identity definition.
  6. Cannot be part of a partition key.
  7. Foreign tables can have generated columns.
- Inheritance/partitioning:
  - Parent generated => child must be generated of the **same kind** (stored/virtual); expression may differ. Parent not generated => child must not be.
  - **Stored**: expression applied on write is that of the table the row is **physically in** (unlike column defaults, where the default of the table **named in the query** applies). **Virtual**: expression of the table **named in the query** applies on read.
  - `CREATE TABLE ... INHERITS` / `PARTITION OF` without a GENERATED clause copies the parent's. `ALTER TABLE ... INHERIT` / `ATTACH PARTITION` require matching generation status but not matching expressions.
  - Multiple inheritance: if one parent column is generated, all must be; if expressions differ, child must specify explicitly.
- Privileges: maintained separately from base columns (a role can read the generated column but not base columns). For virtual columns this is fully secure only if the expression uses leakproof functions (not enforced). Function privileges are checked when the expression executes (on write for stored, read for virtual); functions run as invoker or owner per SECURITY INVOKER/DEFINER.
- Triggers: generated columns are conceptually updated **after BEFORE triggers**; base-column changes in BEFORE triggers are reflected, but generated columns **cannot be accessed in BEFORE triggers**.
- Logical replication: controlled by CREATE PUBLICATION parameter `publish_generated_columns` or by column lists; **only stored generated columns** supported.

### Constraints  [M3, M4 (indexes), M5]  (source: ddl-constraints.txt)
- **CHECK**: `price numeric CHECK (price > 0)`; named: `CONSTRAINT positive_price CHECK (price > 0)`. Column constraint vs table constraint (`CHECK (price > discounted_price)` as separate list item). PostgreSQL does not enforce that a column constraint references only its column.
  - Satisfied if expression is **true or NULL** -> does not prevent NULLs.
  - PostgreSQL **does not support CHECK constraints referencing other rows/tables**; may appear to work but can break dump/restore (rows not loaded in an order that satisfies it). Use UNIQUE, EXCLUDE, FOREIGN KEY; or a custom trigger for one-time checks (pg_dump reinstalls triggers after data).
  - CHECK conditions are **assumed immutable**; checked only on insert/update. Changing a user-defined function used in a CHECK is not noticed -> fix by dropping the constraint, changing the function, re-adding the constraint (rechecks all rows).
- **NOT NULL**: `product_no integer NOT NULL`; named `CONSTRAINT products_name_not_null NOT NULL`; table-constraint form `NOT NULL product_no` (non-standard, mainly for pg_dump). Functionally equal to `CHECK (col IS NOT NULL)` but more efficient. A column can have **at most one** explicit not-null constraint. Order of constraints doesn't matter and doesn't determine check order. `NULL` "constraint" = default behavior, non-standard. Tip: most columns should be NOT NULL.
- **UNIQUE**: column form `UNIQUE`, table form `UNIQUE (a, c)`. Automatically creates a **unique B-tree index**. Partial uniqueness -> use a unique partial index (not expressible as a constraint).
  - By default **two NULLs are not considered equal** -> duplicates with NULL in a constrained column are allowed. `UNIQUE NULLS NOT DISTINCT` changes this (column: `product_no integer UNIQUE NULLS NOT DISTINCT`; table: `UNIQUE NULLS NOT DISTINCT (product_no)`). `NULLS DISTINCT` = explicit default. Standard says implementation-defined.
- **PRIMARY KEY**: unique + not null. Creates a unique B-tree index and **forces columns NOT NULL**. At most one per table. Not required by PostgreSQL (theory says every table should have one). The PK defines the default target columns for FKs referencing the table.
- **FOREIGN KEY**: `product_no integer REFERENCES products (product_no)` or `REFERENCES products` (defaults to the referenced table's PK). Multi-column: `FOREIGN KEY (b, c) REFERENCES other_table (c1, c2)` (count and types must match). Terms: referencing table/columns vs referenced table/columns. Self-referential FK: `parent_id integer REFERENCES tree`. Many-to-many via junction table with two FKs and composite PK.
  - **ON DELETE actions**:
    - `NO ACTION` (**default**): deletion proceeds, constraint still checked -> usually error; check **can be deferred** to later in the transaction, letting other commands fix the situation.
    - `RESTRICT`: prevents deletion of a referenced row; **cannot be deferred**.
    - `CASCADE`: referencing rows deleted too.
    - `SET NULL` / `SET DEFAULT`: referencing columns set to null / defaults; must still satisfy constraints (SET DEFAULT fails if default doesn't satisfy the FK). May take a **column list** (ON DELETE only): `FOREIGN KEY (tenant_id, author_id) REFERENCES users ON DELETE SET NULL (author_id)`.
  - **ON UPDATE**: same actions (no column lists for SET NULL/SET DEFAULT); CASCADE copies updated values to referencing rows. `ON UPDATE NO ACTION` (default) lets the update proceed and checks afterwards; `ON UPDATE RESTRICT` prevents the update even if the post-update state would still satisfy the constraint (matters for values that are distinct but compare equal, e.g. case-insensitive collations).
  - NULL handling: a referencing row need not satisfy the FK if **any** referencing column is NULL (the default behavior). `MATCH FULL`: escapes only if **all** referencing columns are NULL (mix fails). Use NOT NULL to forbid escaping.
  - Referenced columns must be a primary key, a unique constraint, or columns of a **non-partial unique index** -> referenced side always indexed. **Referencing columns are NOT automatically indexed**; often a good idea, because DELETE on the referenced table / UPDATE of a referenced column requires a scan of the referencing table.
- **EXCLUDE**: `EXCLUDE USING gist (c WITH &&)` — for any two rows, at least one of the operator comparisons returns false or null. Automatically creates an index of the specified type.

### System columns  [M2, M5]  (source: ddl-system-columns.txt)
- Implicitly defined on every table; names cannot be used for user columns (quoting does not help).
  - `tableoid` — OID of the table containing the row; useful with partitioning/inheritance; join to `pg_class.oid` or cast `::regclass`.
  - `xmin` — transaction ID of the **inserting** transaction for this **row version** (each update creates a new row version of the same logical row).
  - `cmin` — command identifier (starting at zero) within the inserting transaction.
  - `xmax` — transaction ID of the **deleting** transaction, or **zero** for an undeleted row version. Can be nonzero in a visible row version: deleting transaction not yet committed, or an attempted deletion was rolled back.
  - `cmax` — command identifier within the deleting transaction, or zero.
  - `ctid` — physical location of the row version within its table. Changes on UPDATE or when moved by VACUUM FULL -> not a long-term row identifier; use a primary key.
- **Transaction IDs are 32-bit**; they can wrap around in a long-lived database (handled by maintenance, ch.24); do not depend on XID uniqueness over more than **one billion transactions**.
- **Command identifiers are 32-bit** -> hard limit of **2^32 (4 billion) SQL commands within a single transaction**; only commands that actually modify database contents consume a command ID; limit is on commands, not rows.

### ALTER TABLE  [M3, M5 (locks), M2]  (source: ddl-alter.txt)
- `ALTER TABLE products ADD COLUMN description text;` new column filled with default (NULL if none). All CREATE TABLE column options allowed, e.g. `ADD COLUMN description text CHECK (description <> '')`; default must satisfy constraints.
- **Fast ADD COLUMN**: a **constant** default does not require rewriting/updating each row; the default is returned on next access and applied when the table is rewritten. A **volatile** default (e.g. `clock_timestamp()`) requires updating every row at ALTER time. Alternative: add with no default, UPDATE, then SET DEFAULT.
- `DROP COLUMN description;` data disappears, table constraints involving the column are dropped; FK from another table referencing it is not silently dropped -> need `CASCADE`.
- Add constraints: `ADD CHECK (name <> '')`, `ADD CONSTRAINT some_name UNIQUE (product_no)`, `ADD FOREIGN KEY (product_group_id) REFERENCES product_groups`; not-null: `ALTER COLUMN product_no SET NOT NULL` (silently no-op if already present). Constraint is checked immediately against existing data.
- `DROP CONSTRAINT some_name` (need name; psql `\d tablename` shows generated names); `CASCADE` if depended upon (e.g. FK depends on unique/PK). `ALTER COLUMN product_no DROP NOT NULL` (no-op if absent).
- `ALTER COLUMN price SET DEFAULT 7.77` (affects only future inserts); `DROP DEFAULT` (= default NULL; no error if none).
- `ALTER COLUMN price TYPE numeric(10,2)` succeeds only if each value converts via an **implicit cast**; otherwise add `USING expr`. Defaults and constraints are converted too (may fail or surprise) -> best to drop constraints first and re-add.
- `RENAME COLUMN product_no TO product_number;` `RENAME TO items;`

### Privileges  [M1, M6]  (source: ddl-priv.txt)
- Every object has an **owner** (normally the creating role). Initially only owner (or superuser) can do anything. Right to modify/destroy is inherent in ownership, cannot be granted/revoked (but is inherited by members of the owning role).
- `ALTER TABLE t OWNER TO new_owner;` — superusers always; others must be current owner (or inherit) **and** able to `SET ROLE` to the new owner. All object privileges of the old owner transfer.
- `GRANT UPDATE ON accounts TO joe;` `GRANT ALL ...`; `PUBLIC` = every role. `REVOKE ALL ON accounts FROM PUBLIC;`
- `WITH GRANT OPTION` lets the recipient re-grant; revoking the grant option cascades to everyone downstream. Owner can revoke own ordinary privileges (read-only for self) but always holds all grant options implicitly.
- The 15 privileges: SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, CREATE, CONNECT, TEMPORARY, EXECUTE, USAGE, SET, ALTER SYSTEM, MAINTAIN (details in inventory below).
- **Default PUBLIC privileges**: none on tables, table columns, sequences, FDWs, foreign servers, large objects, schemas, tablespaces, configuration parameters. Granted by default: `CONNECT` and `TEMPORARY` on databases; `EXECUTE` on functions/procedures; `USAGE` on languages and data types (incl. domains). For max security REVOKE in the same transaction that creates the object. Override with `ALTER DEFAULT PRIVILEGES`.
- **aclitem format**: `grantee=privilege-abbreviation[*].../grantor`; `*` = with grant option; empty grantee = PUBLIC. Example `calvin=r*w/hobbes`.
- `\dp mytable` example output after `GRANT SELECT ON mytable TO PUBLIC; GRANT SELECT, UPDATE, INSERT ON mytable TO admin; GRANT SELECT (col1), UPDATE (col1) ON mytable TO miriam_rw;`: Access privileges `miriam=arwdDxtm/miriam`, `=r/miriam`, `admin=arw/miriam`; Column privileges `col1: miriam_rw=rw/miriam`.
- Empty "Access privileges" column = default privileges (catalog ACL entry is NULL). First GRANT/REVOKE instantiates defaults then modifies. (Doc prose example says `miriam=arwdDxt/miriam` here while the table above shows `arwdDxtm` — the current full table set includes `m` MAINTAIN.) Objects affected by ALTER DEFAULT PRIVILEGES always show explicit entries. Owner's implicit grant options are not shown with `*`. `(none)` = non-null but empty ACL (no privileges even for owner).

### Row security policies (RLS)  [M1, M6, M5]  (source: ddl-rowsecurity.txt)
- Enable: `ALTER TABLE t ENABLE ROW LEVEL SECURITY;` Then all normal access must be allowed by a policy; **no policy => default-deny** (no rows visible/modifiable). Whole-table operations (`TRUNCATE`, `REFERENCES`) are not subject to RLS.
- Table **owner** normally bypasses; `ALTER TABLE ... FORCE ROW LEVEL SECURITY` subjects the owner too. **Superusers and roles with `BYPASSRLS`** always bypass. Only the table owner can enable/disable RLS and add policies.
- Shape of CREATE POLICY as assembled from this page's examples (not a verbatim synopsis; full grammar is on the CREATE POLICY reference page): `CREATE POLICY name ON table [AS RESTRICTIVE] [FOR {ALL|SELECT|INSERT|UPDATE|DELETE}] [TO roles] [USING (expr)] [WITH CHECK (expr)]`; also `ALTER POLICY`, `DROP POLICY`. Policy names unique per table.
- `USING` controls which existing rows are visible/selectable (SELECT/UPDATE/DELETE); `WITH CHECK` controls rows being created/modified (INSERT/UPDATE). If only USING is given (for ALL), an identical WITH CHECK is implied.
- Policy expression is evaluated **for each row before any conditions/functions from the user's query** — except **leakproof** functions, which the optimizer may apply ahead of the RLS check. Rows where the expression is not true are not processed. Expressions run with the privileges of the querying user (security-definer functions can access other data).
- Multiple policies: **permissive (default) combined with OR; restrictive combined with AND**. No role / PUBLIC => applies to all users.
- Examples:
  - `CREATE POLICY account_managers ON accounts TO managers USING (manager = current_user);`
  - `CREATE POLICY user_sel_policy ON users FOR SELECT USING (true); CREATE POLICY user_mod_policy ON users USING (user_name = current_user);`
  - passwd example: `CREATE POLICY admin_all ON passwd TO admin USING (true) WITH CHECK (true); CREATE POLICY all_view ON passwd FOR SELECT USING (true); CREATE POLICY user_mod ON passwd FOR UPDATE USING (current_user = user_name) WITH CHECK (current_user = user_name AND shell IN ('/bin/bash','/bin/sh','/bin/dash','/bin/zsh','/bin/tcsh'));` plus column-level GRANTs. Observed: `update passwd set shell = '/bin/xx';` -> `ERROR: new row violates WITH CHECK OPTION for "passwd"`; updating others' rows -> `UPDATE 0` (silently filtered); `table passwd` without column privilege -> `permission denied`.
  - Restrictive: `CREATE POLICY admin_local_only ON passwd AS RESTRICTIVE TO admin USING (pg_catalog.inet_client_addr() IS NULL);` (NULL = Unix socket).
- Disabling RLS does not drop policies; they are ignored.
- **Referential integrity checks (unique, PK, FK) always bypass RLS** -> possible covert-channel leaks.
- GUC **`row_security`**: set to `off` to make any query whose results would be filtered by a policy **throw an error** (it does not itself bypass RLS) — important for backups.
- **Race condition** with policies using sub-SELECTs on other tables: in READ COMMITTED, a `SELECT ... FOR UPDATE` blocked behind a concurrent update re-fetches the updated target row, but the policy's sub-SELECT (no FOR UPDATE) still uses the statement-start snapshot -> can see data it should not. Fixes: `SELECT ... FOR SHARE` in policy sub-SELECTs (needs UPDATE privilege on the referenced table; or wrap in security definer function); take `ACCESS EXCLUSIVE` lock on the referenced table when updating it; or wait for concurrent transactions to end before relying on the new security state.

### Schemas and search_path  [M1]  (source: ddl-schemas.txt)
- Hierarchy: **database cluster** contains named **databases**; **roles and a few other object types are shared cluster-wide**; a connection accesses exactly **one database**. A database contains named **schemas**; schemas contain tables, types, functions, operators, etc. Schemas **cannot be nested**; unlike databases, schemas are not rigidly separated.
- Namespace rule: within one schema, two objects of the same type cannot share a name; **tables, sequences, indexes, views, materialized views, and foreign tables share one namespace**.
- `CREATE SCHEMA myschema;` qualified name `schema.table` (also `database.schema.table`, where database must be the current one). `DROP SCHEMA myschema;` (must be empty) / `DROP SCHEMA myschema CASCADE;`. `CREATE SCHEMA schema_name AUTHORIZATION user_name;` (schema name may be omitted -> same as user name). Names beginning with **`pg_`** are reserved.
- **public schema**: exists in every new database; unqualified creations go there by default.
- **search_path**: list of schemas searched for unqualified names; first match wins; no match -> error even if the name exists elsewhere. First schema in the path that exists = **current schema** = where new objects are created. Default: `"$user", public` (`$user` = schema named like the current user; ignored if absent). `SHOW search_path;` `SET search_path TO myschema,public;`
- Applies equally to type, function, operator names. Qualified operator: `SELECT 3 OPERATOR(pg_catalog.+) 4;`
- **Security**: adding a schema to search_path effectively trusts all users with CREATE privilege on it (they can capture unqualified names and run arbitrary SQL functions as you).
- Privileges: `USAGE` on schema to access objects in it; `CREATE` to create objects. Everyone has USAGE on `public`. **In PostgreSQL 15+, PUBLIC no longer has CREATE on schema public by default** (databases upgraded from 14 or earlier still have it; fix: `REVOKE CREATE ON SCHEMA public FROM PUBLIC;`).
- **`pg_catalog`**: system tables + all built-in types, functions, operators. Always effectively in the search path; if not named explicitly it is searched **implicitly before** the path's schemas. Can be placed explicitly at the end so user names override built-ins. Avoid table names starting with `pg_`.
- Usage patterns:
  1. **User-private schemas** (secure; default-supported in PG15+): no public CREATE anywhere; `CREATE SCHEMA alice AUTHORIZATION alice`. Secure unless an untrusted user is the database owner or has ADMIN OPTION on a relevant role.
  2. Remove public from default search path (`ALTER ROLE ALL SET search_path = "$user"`), grant CREATE on public; only qualified names reach public; calling functions in public is unsafe/unreliable.
  3. Keep default path and grant CREATE on public — **never secure**; only for single-user or mutually trusting users (default for DBs upgraded from <=14).
  - Without a secure pattern, users should set search_path to empty string (or remove non-superuser-writable schemas) at session start.
- Portability: the standard has no public schema; schema ~ user in basic-schema implementations.

### Inheritance  [M1, M7 (legacy partitioning)]  (source: tutorial-inheritance.txt, ddl-inherit.txt)
- `CREATE TABLE capitals (state char(2)) INHERITS (cities);` child has all parent columns plus its own. A table can inherit from zero or more tables.
- Query on parent includes all descendants by default; `FROM ONLY cities` excludes children; `cities*` explicitly includes (legacy). ONLY supported by SELECT, UPDATE, DELETE. Only parent's columns are produced.
- `tableoid` tells origin: `SELECT c.tableoid::regclass, c.name FROM cities c;` or join `pg_class p ON c.tableoid = p.oid` (`p.relname`).
- **INSERT and COPY do not route** to children; INSERT always goes into exactly the named table.
- **CHECK and NOT NULL constraints are inherited** (unless `NO INHERIT`); **UNIQUE, PRIMARY KEY, FOREIGN KEY are not**.
- Multiple inheritance: union of parent columns; same-named columns are **merged** (must have same data type, else error); merged column is NOT NULL if any source is; check constraints merge if same name (fail if conditions differ).
- `ALTER TABLE child INHERIT parent` (child must already have matching columns names/types and matching check constraints names/expressions) / `ALTER TABLE child NO INHERIT parent`. `CREATE TABLE new (LIKE parent INCLUDING CONSTRAINTS)` is handy.
- Parent cannot be dropped while children remain (use CASCADE). Inherited columns/check constraints cannot be dropped/altered on the child. ALTER TABLE on parent propagates column definition and check-constraint changes.
- Permissions: inherited queries check permissions **on the parent only** (UPDATE on cities allows updating capitals rows through cities, but not directly). Parent's RLS policies apply to child rows in inherited queries; child's policies apply only when the child is named directly (parents' then ignored).
- Foreign tables can be parents or children.
- Caveats: INSERT and `ALTER TABLE ... RENAME` do not recurse; maintenance commands like REINDEX work on single physical tables; VACUUM and ANALYZE default to including children (ONLY supported). **Indexes (incl. unique) and FKs apply to single tables only**: parent UNIQUE doesn't stop duplicates in child; parent's REFERENCES not propagated; another table's `REFERENCES cities(name)` cannot match capitals rows — "no good workaround".

### Table partitioning  [M7, M4, M5 (locks)]  (source: ddl-partitioning.txt)
- Benefits: (1) faster queries when hot rows are in one/few partitions — partitioning "substitutes for the upper tree levels of indexes"; (2) seq scan of one partition beats index random access when a large share of a partition is accessed; (3) bulk load/delete via add/remove partition — `DROP TABLE` or `DETACH PARTITION` far faster than bulk DELETE and **avoids VACUUM overhead**; (4) seldom-used data on cheaper storage.
- Rule of thumb: worthwhile when table size **exceeds physical memory** of the server.
- Methods:
  - **RANGE**: non-overlapping ranges; **lower bound inclusive, upper bound exclusive** (1..10 and 10..20: value 10 goes to the second).
  - **LIST**: explicit key values per partition.
  - **HASH**: modulus and remainder per partition; row goes where hash(key) mod modulus = remainder.
- Declarative: `CREATE TABLE measurement (city_id int not null, logdate date not null, peaktemp int, unitsales int) PARTITION BY RANGE (logdate);`
  - The **partitioned table is "virtual" — no storage of its own**; partitions are ordinary tables (or foreign tables) holding data per their **partition bounds**.
  - Inserts are **routed** (tuple routing) by key; **updating the partition key moves the row** to another partition if needed.
  - `CREATE TABLE measurement_y2006m02 PARTITION OF measurement FOR VALUES FROM ('2006-02-01') TO ('2006-03-01');` optionally `TABLESPACE ...`, `WITH (parallel_workers = 4)`. Overlapping bounds -> error. No matching partition on insert -> error.
  - **Sub-partitioning**: add `PARTITION BY RANGE (peaktemp)` to a partition's CREATE. System does not check that sub-partition bounds are a subset of the partition's own bounds.
  - Partition bound constraints are created automatically. Direct insert into a partition is allowed if its partition constraint is satisfied.
  - Cannot convert a regular table into a partitioned table or vice versa; can `ATTACH PARTITION` an existing regular/partitioned table and `DETACH PARTITION`.
  - `CREATE INDEX ON measurement (logdate);` creates a matching index on every partition and on future/attached partitions; index/unique constraint on the partitioned table is likewise "virtual".
  - GUC **`enable_partition_pruning`** must not be disabled (default **on**).
- Maintenance and **lock levels**:
  - `DROP TABLE measurement_y2006m02;` — requires **ACCESS EXCLUSIVE lock on the parent**.
  - `ALTER TABLE measurement DETACH PARTITION p;` — ACCESS EXCLUSIVE on parent. `... DETACH PARTITION p CONCURRENTLY;` — only **SHARE UPDATE EXCLUSIVE** on parent (with restrictions).
  - `CREATE TABLE ... PARTITION OF` — ACCESS EXCLUSIVE on parent. `ATTACH PARTITION` — only **SHARE UPDATE EXCLUSIVE** on the partitioned table.
  - ATTACH scans the table to validate the partition constraint while holding **ACCESS EXCLUSIVE on that partition**; avoid by pre-creating a matching `CHECK` constraint (`CHECK (logdate >= DATE '2008-02-01' AND logdate < DATE '2008-03-01')`), then drop it after attach. If a **DEFAULT partition** exists it is scanned (under ACCESS EXCLUSIVE on it) to verify it holds no rows belonging to the new partition, unless it has a CHECK constraint excluding the new partition's range. Recursion applies to sub-partitioned tables.
  - Recipe: `CREATE TABLE p (LIKE measurement INCLUDING DEFAULTS INCLUDING CONSTRAINTS); ALTER TABLE p ADD CONSTRAINT ... CHECK (...); \copy ...; ALTER TABLE measurement ATTACH PARTITION p FOR VALUES FROM (...) TO (...);`
  - `CREATE INDEX CONCURRENTLY` is **not possible on a partitioned table**. Workaround: `CREATE INDEX idx ON ONLY measurement (unitsales);` (created **invalid**), then `CREATE INDEX CONCURRENTLY` on each partition and `ALTER INDEX idx ATTACH PARTITION part_idx;` — parent index becomes valid automatically once all partitions are attached. Same for UNIQUE/PK: `ALTER TABLE ONLY measurement ADD UNIQUE (city_id, logdate);` then per-partition ADD UNIQUE + ALTER INDEX ATTACH PARTITION.
- Limitations:
  - UNIQUE/PRIMARY KEY on a partitioned table: partition keys must not include expressions/function calls and **constraint columns must include all partition key columns** (indexes enforce uniqueness only within their partition).
  - EXCLUDE constraint must include all partition key columns and compare them with **equality**; other columns may use any operator.
  - BEFORE ROW INSERT triggers cannot change the destination partition.
  - No mixing temporary and permanent relations in a partition tree; temp trees must be from the same session.
  - Partitions are linked via inheritance internally, but: a partition cannot have other parents; a table cannot inherit from both a partitioned and a regular table; partitions cannot have extra columns (cannot be added later either; ATTACH requires exact column match); CHECK and NOT NULL of the partitioned table are always inherited (no `NO INHERIT`), cannot be dropped on a partition if present in parent; `ONLY` for add/drop constraint works only while there are no partitions (except UNIQUE and PRIMARY KEY); `TRUNCATE ONLY` on a partitioned table always errors.
- Inheritance-based partitioning (legacy): root table with no data; children `CREATE TABLE measurement_y2006m02 (CHECK (logdate >= DATE '2006-02-01' AND logdate < DATE '2006-03-01')) INHERITS (measurement);` non-overlapping CHECKs (avoid `BETWEEN 100 AND 200` / `BETWEEN 200 AND 300` overlap); per-child indexes; route inserts via BEFORE INSERT trigger returning NULL (`INSERT INTO child VALUES (NEW.*); RETURN NULL;`) or via `CREATE RULE ... DO INSTEAD` (rule overhead is per query not per row; **COPY ignores rules** but fires triggers; rules silently let uncovered rows into the root). Requires GUC **`constraint_exclusion`** not disabled. Allows extra child columns, multiple inheritance, arbitrary division schemes.
  - Caveats: no automatic check that CHECKs are mutually exclusive; indexes/FKs per table; key-changing UPDATE fails due to CHECK; manual VACUUM/ANALYZE process all children (`ANALYZE ONLY measurement`); `INSERT ... ON CONFLICT` only considers the target relation's unique violations, not children; trigger routing much slower than built-in tuple routing.
- **Partition pruning** (declarative only):
  - Planner proves from partition bounds that a partition cannot contain matching rows and excludes it. Driven only by partition-key constraints, **not by indexes**.
  - EXPLAIN demo: with `enable_partition_pruning = off`, `Append` over Seq Scans of every partition (cost 188.76); with `on`, a single `Seq Scan on measurement_y2008m01` (cost 37.75) for `WHERE logdate >= DATE '2008-01-01'`.
  - Three times pruning can happen:
    1. **Plan time** (constants).
    2. **Executor initialization**: for parameter values known at init (e.g. PREPARE parameters). Pruned partitions do not appear in EXPLAIN/EXPLAIN ANALYZE; count shown as **"Subplans Removed"**. Partitions pruned here are **still locked** at start of execution.
    3. **During execution**: values from subqueries or parameterized nested-loop joins; re-pruned each time an execution parameter changes. Visible via `loops` in EXPLAIN ANALYZE; subplans pruned every time show **`(never executed)`**.
- **Constraint exclusion**: uses each table's CHECK constraints (not partition bounds); **plan time only**; slower than pruning; can also be used with declarative partitioning to elide more partitions. GUC `constraint_exclusion` default **`partition`** (recommended): applied only to queries likely on inheritance-partitioned tables; `on` examines CHECKs in all queries; `off`.
  - Works only when WHERE contains constants or externally supplied parameters; not non-immutable functions like `CURRENT_TIMESTAMP`. Keep constraints simple (equality for list, range tests for range; comparisons of partition column to constants with B-tree-indexable operators — only B-tree-indexable columns are allowed in the partition key). All children's constraints are examined -> OK up to "perhaps a hundred" children; not thousands.
- Best practices: partition by columns most common in WHERE; consider PK/UNIQUE requirements and data-removal patterns; too few partitions -> large indexes/poor locality; too many -> longer planning, more memory in planning and execution. Planner handles **up to a few thousand partitions** fairly well if queries prune to a small number. Each partition's metadata is loaded into the **local memory of each session** that touches it. Prefer HASH with a reasonable count over LIST per customer when cardinality may grow. Data warehouses can tolerate more partitions than OLTP. Re-partitioning is painfully slow; simulate first.

### Foreign data, other objects, dependency tracking  [M6]  (source: ddl-foreign-data.txt, ddl-others.txt, ddl-depend.txt)
- SQL/MED: **foreign data wrapper** (library talking to external source) -> **foreign server** (connection definition) -> **user mapping** (credentials per role) -> **foreign table** (structure; no storage in PostgreSQL; FDW fetches/transmits on use). Commands: CREATE FOREIGN DATA WRAPPER, CREATE SERVER, CREATE USER MAPPING, CREATE FOREIGN TABLE, IMPORT FOREIGN SCHEMA. Writing FDWs: ch.58.
- Other object kinds: views; functions, procedures, operators; data types and domains; triggers and rewrite rules (Part V).
- Dependencies: cannot drop objects others depend on. `DROP TABLE products;` -> `ERROR: cannot drop table products because other objects depend on it` / `DETAIL: constraint orders_product_no_fkey on table orders depends on table products` / `HINT: Use DROP ... CASCADE to drop the dependent objects too.` `DROP TABLE products CASCADE;` removes only the FK constraint (not the orders table). Default is **RESTRICT**. With multiple objects in one DROP, CASCADE needed only for dependencies outside the group.
- Function bodies: string-literal body -> only externally visible dependencies tracked (arg/result types), not body references (dropping a referenced table doesn't drop the function; it errors at run time). **SQL-standard body (`BEGIN ATOMIC ... END`)** is parsed at definition time and all dependencies are stored/enforced.

### INSERT / UPDATE / DELETE  [M3]  (source: dml.txt, dml-insert.txt, dml-update.txt, dml-delete.txt)
- Data is inserted **one whole row at a time** (multi-row commands allowed); partial rows impossible — unspecified columns get defaults.
- INSERT forms:
  - `INSERT INTO products VALUES (1, 'Cheese', 9.99);` (table column order)
  - `INSERT INTO products (name, price, product_no) VALUES ('Cheese', 9.99, 1);`
  - `INSERT INTO products (product_no, name) VALUES (1, 'Cheese');` — omitted columns defaulted.
  - `INSERT INTO products VALUES (1, 'Cheese');` — **PostgreSQL extension**: fills columns from the left, rest defaulted.
  - `... VALUES (1, 'Cheese', DEFAULT);` and `INSERT INTO products DEFAULT VALUES;`
  - Multi-row: `VALUES (1,'Cheese',9.99), (2,'Bread',1.99), (3,'Milk',2.99);`
  - `INSERT INTO products (product_no, name, price) SELECT product_no, name, price FROM new_products WHERE release_date = 'today';` (zero, one, or many rows).
  - Bulk: prefer `COPY` (§14.4).
- UPDATE needs: table + column, new value, which rows. `UPDATE products SET price = 10 WHERE price = 5;` zero matched rows is not an error. `UPDATE products SET price = price * 1.10;` (no WHERE -> all rows; expression may reference existing row values). Multiple assignments: `UPDATE mytable SET a = 5, b = 3, c = 1 WHERE a > 0;` `=` in SET is assignment, in WHERE comparison.
- SQL gives no row identifiers: rows are addressed by conditions; only a primary key (declared or not) reliably addresses single rows.
- `DELETE FROM products WHERE price = 10;` whole rows only; `DELETE FROM products;` deletes all rows.

### RETURNING (incl. PG18 OLD/NEW)  [M3]  (source: dml-returning.txt)
- INSERT, UPDATE, DELETE, and MERGE all accept an optional `RETURNING` clause; avoids an extra query and identifies modified rows reliably.
- Contents: same as a SELECT output list (§7.3): target-table column names or expressions; `RETURNING *` = all target-table columns in order.
- Default data per command:
  - **INSERT**: the row **as inserted** (useful for computed defaults: `INSERT INTO users (firstname, lastname) VALUES ('Joe', 'Cool') RETURNING id;` with `id serial primary key`). Also useful with `INSERT ... SELECT`.
  - **UPDATE**: the **new** content of the modified row: `UPDATE products SET price = price * 1.10 WHERE price <= 99.99 RETURNING name, price AS new_price;`
  - **DELETE**: the content of the **deleted** row: `DELETE FROM products WHERE obsoletion_date = 'today' RETURNING *;`
  - **MERGE**: content of the **source row plus** the inserted/updated/deleted target row; `RETURNING *` duplicates shared columns, so qualify: `MERGE INTO products p USING new_products n ON p.product_no = n.product_no WHEN NOT MATCHED THEN INSERT VALUES (n.product_no, n.name, n.price) WHEN MATCHED THEN UPDATE SET name = n.name, price = n.price RETURNING p.*;`
- **Explicit old/new** (available in INSERT, UPDATE, DELETE, MERGE):
  ```sql
  UPDATE products SET price = price * 1.10
    WHERE price <= 99.99
    RETURNING name, old.price AS old_price, new.price AS new_price,
              new.price - old.price AS price_change;
  ```
  - `new.price` equals unqualified `price` in an UPDATE.
  - Typically **old values are NULL for INSERT**, **new values are NULL for DELETE**. Exceptions: `INSERT ... ON CONFLICT DO UPDATE` -> old values non-NULL for conflicting rows; a DELETE turned into an UPDATE by a rewrite rule -> new values may be non-NULL.
- With triggers on the target table, RETURNING sees the row **as modified by the triggers** (inspect trigger-computed columns).

### Query overview, select lists, DISTINCT  [M3]  (source: queries.txt, queries-overview.txt, queries-select-lists.txt)
- General syntax: `[WITH with_queries] SELECT select_list FROM table_expression [sort_specification]`.
- `SELECT * FROM table1;` retrieves all rows and all **user-defined** columns. Table expression can be omitted: `SELECT 3 * 4;` `SELECT random();`
- Processing concept: the table expression builds an intermediate **virtual table** (FROM -> WHERE -> GROUP BY -> HAVING), which is passed to the select list to compute output rows.
- Select-list name space = same as WHERE, or same as HAVING when grouping is used. `tbl1.*` for all columns of one table. Each select expression is evaluated once per result row and conceptually adds a virtual column.
- Column labels: `expr AS name`. Default names: column name for simple references; function name for function calls; generic name otherwise (e.g. `?column?`). `AS` is optional except when the label matches a key word (e.g. `SELECT a from, ...` fails; use `a AS from` or `a "from"`). Recommended: always write AS or double-quote. The name given in the select list is what is passed on (overrides FROM-clause aliases).
- `SELECT DISTINCT select_list` (opposite: `ALL`, the default). Two rows are distinct if they differ in at least one column; **NULLs are considered equal** for this comparison.
- `SELECT DISTINCT ON (expression [, ...]) select_list` — keeps only the **first row** of each set with equal expressions; "first" is unpredictable unless ORDER BY guarantees a unique ordering of rows arriving at the DISTINCT filter (**DISTINCT ON processing occurs after ORDER BY sorting**). Not SQL standard.

### FROM clause: joins, aliases, subqueries, table functions, LATERAL  [M3, M4]  (source: queries-table-expressions.txt)
- `FROM table_reference [, table_reference [, ...]]`; multiple references are cross-joined (Cartesian product). Table reference = table name (possibly schema-qualified), subquery, JOIN construct, or combinations.
- Inheritance parent in FROM yields rows of all descendants unless `ONLY`; only the named table's columns are produced; trailing `*` is legacy.
- Joined table: `T1 join_type T2 [ join_condition ]`; chains/nests; without parentheses JOINs **nest left-to-right**.
- **CROSS JOIN**: `T1 CROSS JOIN T2` -> N * M rows; equivalent to `T1 INNER JOIN T2 ON TRUE` and to `FROM T1, T2`. But **JOIN binds more tightly than comma**: `FROM T1 CROSS JOIN T2 INNER JOIN T3 ON condition` != `FROM T1, T2 INNER JOIN T3 ON condition` (condition can reference T1 only in the first).
- Qualified joins:
  ```
  T1 { [INNER] | { LEFT | RIGHT | FULL } [OUTER] } JOIN T2 ON boolean_expression
  T1 { [INNER] | { LEFT | RIGHT | FULL } [OUTER] } JOIN T2 USING ( join column list )
  T1 NATURAL { [INNER] | { LEFT | RIGHT | FULL } [OUTER] } JOIN T2
  ```
  INNER is default; LEFT/RIGHT/FULL imply OUTER.
  - INNER: for each R1 of T1, a row for each T2 row satisfying the condition.
  - LEFT OUTER: inner join, then for each unmatched T1 row add a row with NULLs for T2 columns (at least one row per T1 row).
  - RIGHT OUTER: converse.
  - FULL OUTER: inner join plus unmatched rows of both sides NULL-extended.
- `ON`: any Boolean expression; pair matches if **true**. `USING (a, b)` == `ON T1.a = T2.a AND T1.b = T2.b` and **suppresses redundant columns**: output = one column per listed pair (in listed order), then remaining T1 columns, then remaining T2 columns. `NATURAL` = USING on all common column names; **if no common names, behaves like CROSS JOIN**. USING is safe against schema changes; NATURAL is risky (new common column silently joins).
- Reference data: t1(num,name) = (1,a),(2,b),(3,c); t2(num,value) = (1,xxx),(3,yyy),(5,zzz). CROSS = 9 rows; INNER ON num = 2 rows (4 columns); USING/NATURAL = 2 rows (3 columns); LEFT = 3 rows; RIGHT = 3 rows; FULL = 4 rows.
- **ON vs WHERE with outer joins**: `t1 LEFT JOIN t2 ON t1.num = t2.num AND t2.value = 'xxx'` -> 3 rows (2 NULL-extended); `... ON t1.num = t2.num WHERE t2.value = 'xxx'` -> 1 row. A restriction in ON is processed **before** the join; in WHERE **after**. Irrelevant for inner joins.
- Table alias: `FROM table_reference [AS] alias`; after aliasing, the original name is **not allowed** elsewhere in the query (`SELECT * FROM my_table AS m WHERE my_table.a > 5` is wrong). Required for self-joins. Column aliases: `FROM table_reference [AS] alias (column1 [, column2 ...])` (fewer aliases than columns -> rest keep names). An alias on a parenthesized JOIN hides inner aliases: `SELECT a.* FROM (my_table AS a JOIN your_table AS b ON ...) AS c` is invalid.
- Subqueries in FROM must be parenthesized; alias optional in PostgreSQL (standard requires one). `FROM (VALUES ('anne','smith'),('bob','jones'),('joe','blow')) AS names(first, last)`.
- **Table functions** (set-returning functions in FROM):
  ```
  function_call [WITH ORDINALITY] [[AS] table_alias [(column_alias [, ... ])]]
  ROWS FROM( function_call [, ... ] ) [WITH ORDINALITY] [[AS] table_alias [(column_alias [, ... ])]]
  UNNEST( array_expression [, ... ] ) [WITH ORDINALITY] [[AS] table_alias [(column_alias [, ... ])]]
  ```
  - `ROWS FROM(...)` returns functions' results in parallel columns; row count = largest result; shorter ones padded with NULLs.
  - `WITH ORDINALITY` adds a **bigint** column numbering rows from 1, named `ordinality` by default.
  - Multi-arg `UNNEST(a, b, ...)` behaves like ROWS FROM of separate unnests.
  - Default table name = function name (first function for ROWS FROM); default column name = function name for base-type results, attribute names for composite results.
  - Functions returning `record` need a column definition list: `function_call [AS] alias (column_definition [, ...])`, `function_call AS [alias] (column_definition [, ...])`, `ROWS FROM( ... function_call AS (column_definition [, ...]) [, ...] )`. Example: `SELECT * FROM dblink('dbname=mydb', 'SELECT proname, prosrc FROM pg_proc') AS t1(proname name, prosrc text) WHERE proname LIKE 'bytea%';`
  - `SELECT * FROM ROWS FROM (json_to_recordset('[{"a":40,"b":"foo"},{"a":"100","b":"bar"}]') AS (a INTEGER, b TEXT), generate_series(1, 3)) AS x (p, q, s) ORDER BY p;` -> (40,foo,1),(100,bar,2),(NULL,NULL,3).
- **LATERAL**: a FROM subquery preceded by `LATERAL` may reference columns of **preceding FROM items**; without it each subquery is evaluated independently. For **functions** in FROM, LATERAL is optional (arguments may always reference preceding items). Within a JOIN tree a LATERAL item can reference items on the left-hand side of a JOIN it is on the right-hand side of.
  - Evaluation: for each row (or row set from multiple items) of the FROM item(s) supplying the cross-referenced columns, the LATERAL item is evaluated with those values; resulting rows are joined as usual with the rows they were computed from. (A per-outer-row "for each" loop.)
  - Trivial: `SELECT * FROM foo, LATERAL (SELECT * FROM bar WHERE bar.id = foo.bar_id) ss;` == `SELECT * FROM foo, bar WHERE bar.id = foo.bar_id;`
  - SRF example: `FROM polygons p1, polygons p2, LATERAL vertices(p1.poly) v1, LATERAL vertices(p2.poly) v2 WHERE (v1 <-> v2) < 10 AND p1.id != p2.id` or `polygons p1 CROSS JOIN LATERAL vertices(p1.poly) v1`.
  - `LEFT JOIN LATERAL ... ON true` keeps source rows even when the lateral item yields none: `SELECT m.name FROM manufacturers m LEFT JOIN LATERAL get_product_names(m.id) pname ON true WHERE pname IS NULL;`

### WHERE, GROUP BY, HAVING, grouping sets  [M3]  (source: queries-table-expressions.txt)
- `WHERE search_condition` (boolean): row kept only if **true**; **false or null -> discarded**.
- Inner-join condition may be written in WHERE or JOIN (style); outer joins must be in FROM — ON/USING of an outer join is not equivalent to WHERE (it adds rows for unmatched inputs as well as removes).
- Subquery forms in WHERE: `c1 IN (1,2,3)`, `c1 IN (SELECT ...)`, correlated `IN (SELECT c3 FROM t2 WHERE c2 = fdt.c1 + 10)`, `BETWEEN (SELECT ...) AND 100`, `EXISTS (SELECT c1 FROM t2 WHERE c2 > fdt.c1)`. Outer column naming scope extends into inner queries.
- `GROUP BY grouping_column_reference [, ...]`: rows with equal values in all listed columns form one group row; column order irrelevant. Ungrouped columns may only appear inside aggregates. Grouping without aggregates == distinct values.
- **Functional dependency**: if grouping by a table's **primary key**, other columns of that table may be referenced ungrouped (e.g. group by `product_id` and select `p.name`, `p.price`).
- Extensions vs strict SQL: GROUP BY may reference **select-list columns** and arbitrary **value expressions**.
- `HAVING boolean_expression` filters groups; may reference grouped expressions and aggregates (aggregates need not match those in the select list).
- A query with aggregates but no GROUP BY still groups: **one group row** (or none if HAVING removes it); same if it has HAVING but no aggregates/GROUP BY.
- **GROUPING SETS**: data from FROM/WHERE is grouped separately by each set; aggregates computed per group; results combined. `SELECT brand, size, sum(sales) FROM items_sold GROUP BY GROUPING SETS ((brand), (size), ());` on (Foo,L,10),(Foo,M,20),(Bar,M,15),(Bar,L,5) -> (Foo,,30),(Bar,,20),(,L,15),(,M,35),(,,50).
  - Empty grouping set `()` = all rows into one group, **output even if no input rows**.
  - Columns not in the current grouping set are returned as **NULL**; distinguish with the grouping operations listed in Table 9.66 (the page only points there; it does not name the function).
  - `ROLLUP (e1, e2, e3, ...)` = the list and **all prefixes** including empty: `GROUPING SETS ((e1,e2,e3,...), ..., (e1,e2), (e1), ())` — hierarchical totals.
  - `CUBE (a, b, c)` = **power set**: `(a,b,c),(a,b),(a,c),(a),(b,c),(b),(c),()` (2^n sets).
  - Sublists are units: `CUBE ((a, b), (c, d))` = `(a,b,c,d),(a,b),(c,d),()`; `ROLLUP (a, (b, c), d)` = `(a,b,c,d),(a,b,c),(a),()`.
  - CUBE/ROLLUP may be used directly in GROUP BY or nested in GROUPING SETS; nested GROUPING SETS flatten.
  - Multiple grouping items in one GROUP BY -> **Cartesian product**: `GROUP BY a, CUBE (b, c), GROUPING SETS ((d), (e))` = `(a,b,c,d),(a,b,c,e),(a,b,d),(a,b,e),(a,c,d),(a,c,e),(a,d),(a,e)`.
  - Duplicates possible: `GROUP BY ROLLUP (a, b), ROLLUP (a, c)` = `(a,b,c),(a,b),(a,b),(a,c),(a),(a),(a,c),(a),()`; `GROUP BY DISTINCT ROLLUP (a, b), ROLLUP (a, c)` = `(a,b,c),(a,b),(a,c),(a),()`. Not the same as SELECT DISTINCT (output rows may still duplicate; NULL data indistinguishable from grouping NULL).
  - In GROUP BY, top-level `(a, b)` is a list of expressions, not a row constructor; use `ROW(a, b)` for a row.

### Window function processing order  [M3, M4]  (source: queries-table-expressions.txt §7.2.5)
- Window functions are evaluated **after grouping, aggregation, and HAVING**; with aggregates/GROUP BY/HAVING the rows seen are **group rows**, not original table rows.
- All window functions with **equivalent PARTITION BY and ORDER BY** are guaranteed to see the **same ordering** of input rows even if ORDER BY is not unique. No guarantee across differing specs (a sort step typically occurs between passes and does not preserve order among rows it sees as equal).
- Currently window functions always require **presorted data**, so output is ordered by one of the windows' PARTITION BY/ORDER BY — do not rely on it; use top-level ORDER BY.
- Combined logical order (a synthesis of statements in §3.5, §4.2.7, §7.2, §7.3.3, §7.5, §7.6 — not a single verbatim doc list): FROM -> WHERE -> GROUP BY -> aggregates -> HAVING -> window functions -> select list / DISTINCT -> set operations -> ORDER BY (DISTINCT ON applied after ORDER BY) -> OFFSET/LIMIT.

### Set operations  [M3]  (source: queries-union.txt)
- `query1 UNION [ALL] query2`, `query1 INTERSECT [ALL] query2`, `query1 EXCEPT [ALL] query2`.
- UNION appends (order not guaranteed) and removes duplicates like DISTINCT unless ALL. INTERSECT: rows in both; EXCEPT: rows in query1 not in query2 (difference); duplicates eliminated unless ALL.
- **Union compatible**: same number of columns, corresponding columns of compatible types (§10.5).
- Precedence: UNION and EXCEPT associate **left-to-right**; **INTERSECT binds more tightly**. `q1 UNION q2 EXCEPT q3` = `(q1 UNION q2) EXCEPT q3`; `q1 UNION q2 INTERSECT q3` = `q1 UNION (q2 INTERSECT q3)`.
- Parenthesize an individual query to give it LIMIT etc.: `SELECT a FROM b UNION SELECT x FROM y LIMIT 10` means `(SELECT a FROM b UNION SELECT x FROM y) LIMIT 10`.

### ORDER BY, LIMIT/OFFSET, VALUES  [M3, M4]  (source: queries-order.txt, queries-limit.txt, queries-values.txt)
- Without ORDER BY, row order is unspecified (depends on scan/join plan types and on-disk order).
- `ORDER BY sort_expression1 [ASC | DESC] [NULLS { FIRST | LAST }] [, ...]`. ASC default. Ordering defined by `<` (ASC) / `>` (DESC) — precisely, by the **default B-tree operator class** of the expression's data type.
- **NULLs sort as if larger than any non-null value**: `NULLS LAST` default for ASC, `NULLS FIRST` default for DESC.
- Options are per-column: `ORDER BY x, y DESC` = `x ASC, y DESC`.
- Sort key may be an output column **label or number** (`ORDER BY sum`, `ORDER BY 1`), but an output name must stand alone: `ORDER BY sum + c` is wrong. If a name matches both an output column and an input column, the **output column wins**.
- ORDER BY on UNION/INTERSECT/EXCEPT results: only output column names or numbers, no expressions.
- `[ LIMIT { count | ALL } ] [ OFFSET start ]`. `LIMIT ALL` and `LIMIT NULL` = no limit; `OFFSET 0` and `OFFSET NULL` = no offset. OFFSET rows are skipped before LIMIT counting.
- LIMIT without a unique ORDER BY returns an unpredictable subset. The **optimizer takes LIMIT into account**, so different LIMIT/OFFSET values can produce different plans and different row orders -> inconsistent paging without ORDER BY. Skipped OFFSET rows **still have to be computed** in the server -> large OFFSET inefficient.
- `VALUES ( expression [, ...] ) [, ...]` — a "constant table"; all lists same length; column types resolved like UNION (§10.5). Default column names **`column1`, `column2`, ...**; override: `SELECT * FROM (VALUES (1, 'one'), (2, 'two'), (3, 'three')) AS t (num, letter);`. Equivalent to `SELECT 1 AS column1, 'one' AS column2 UNION ALL SELECT 2, 'two' UNION ALL SELECT 3, 'three'`. Syntactically equivalent to `SELECT select_list FROM table_expression`; can appear anywhere a SELECT can (UNION, ORDER BY/LIMIT/OFFSET). Most common as INSERT source, then as subquery.

### WITH queries (CTEs)  [M3, M4]  (source: queries-with.txt)
- Each auxiliary statement in WITH can be SELECT, INSERT, UPDATE, DELETE, or MERGE; the primary statement can be SELECT, INSERT, UPDATE, DELETE, or MERGE. CTEs act like temporary tables existing for one query.
- Example: `WITH regional_sales AS (SELECT region, SUM(amount) AS total_sales FROM orders GROUP BY region), top_regions AS (SELECT region FROM regional_sales WHERE total_sales > (SELECT SUM(total_sales)/10 FROM regional_sales)) SELECT region, product, SUM(quantity) AS product_units, SUM(amount) AS product_sales FROM orders WHERE region IN (SELECT region FROM top_regions) GROUP BY region, product;`
- **WITH RECURSIVE**: form is always *non-recursive term* `UNION [ALL]` *recursive term*; only the recursive term may reference the CTE itself. `WITH RECURSIVE t(n) AS (VALUES (1) UNION ALL SELECT n+1 FROM t WHERE n < 100) SELECT sum(n) FROM t;`
- **Recursive Query Evaluation algorithm** (evaluated iteratively, not recursively):
  1. Evaluate the non-recursive term. For UNION (not UNION ALL) discard duplicate rows. Include all remaining rows in the result, and also place them in a temporary **working table**.
  2. While the working table is not empty:
     a. Evaluate the recursive term, substituting the current contents of the **working table** for the recursive self-reference. For UNION (not UNION ALL), discard duplicate rows **and rows that duplicate any previous result row**. Include all remaining rows in the result, and also place them in a temporary **intermediate table**.
     b. Replace the contents of the working table with the contents of the intermediate table, then empty the intermediate table.
  - In the 1..100 example the working table holds a single row each step; the 100th step produces no output, terminating.
- Parts explosion: `WITH RECURSIVE included_parts(sub_part, part, quantity) AS (SELECT sub_part, part, quantity FROM parts WHERE part = 'our_product' UNION ALL SELECT p.sub_part, p.part, p.quantity * pr.quantity FROM included_parts pr, parts p WHERE p.part = pr.sub_part) SELECT sub_part, SUM(quantity) as total_quantity FROM included_parts GROUP BY sub_part`.
- **Search order**: evaluation order is implementation-dependent; compute an ordering column and sort at the end.
  - Depth-first by hand: carry `path` array: `ARRAY[t.id]` then `path || t.id`, `ORDER BY path` (multi-field: `ARRAY[ROW(t.f1, t.f2)]`, `path || ROW(t.f1, t.f2)`; single field without ROW() is more efficient).
  - Breadth-first by hand: carry `depth` (`0`, `depth + 1`), `ORDER BY depth` (+ data columns for stable sort).
  - The algorithm naturally produces output in **breadth-first** order, but that is an implementation detail; order within a level is undefined.
  - Built-in: `... ) SEARCH DEPTH FIRST BY id SET ordercol SELECT * FROM search_tree ORDER BY ordercol;` and `SEARCH BREADTH FIRST BY id SET ordercol`. Internally expanded to the hand-written forms; the SET column is implicitly added to the CTE's output.
- **Cycle detection**: the recursive part must eventually return no tuples or the query loops forever. UNION (vs UNION ALL) can stop loops only when whole rows duplicate. General approach: `is_cycle` + `path` columns: non-recursive `false, ARRAY[g.id]`; recursive `g.id = ANY(path), path || g.id` with `WHERE g.id = sg.link AND NOT is_cycle`. Multi-field: `ROW(g.f1, g.f2) = ANY(path)`.
  - Built-in: `... ) CYCLE id SET is_cycle USING path SELECT * FROM search_graph;` — column list to track, name of the cycle-mark column, name of the path column; both added implicitly to output; internally rewritten to the manual form.
  - Cycle path column is computed like the depth-first ordering column; using both SEARCH DEPTH FIRST and CYCLE is redundant (just order by the path column). SEARCH BREADTH FIRST + CYCLE can be useful together.
  - Testing trick: `WITH RECURSIVE t(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM t) SELECT n FROM t LIMIT 100;` works because PostgreSQL **evaluates only as many rows of a WITH query as the parent actually fetches**. Not recommended in production; fails if the outer query sorts or joins the CTE (it then fetches everything).
- **Materialization**:
  - WITH queries are normally **evaluated only once per execution of the parent query**, even when referenced multiple times -> avoids redundant work / duplicate side effects. Downside: optimizer cannot push parent restrictions into a multiply-referenced CTE; it is evaluated as written (though evaluation may stop early if parents demand few rows).
  - **Folding (inlining)**: if the WITH query is **non-recursive and side-effect-free** (a SELECT containing no volatile functions), it can be folded into the parent. **Default: folded if referenced exactly once; not folded if referenced more than once.**
  - Override: `WITH w AS MATERIALIZED (...)` forces separate calculation; `WITH w AS NOT MATERIALIZED (...)` forces merging (risk: duplicate computation; benefit when each use needs a small part).
  - Examples: `WITH w AS (SELECT * FROM big_table) SELECT * FROM w WHERE key = 123;` is folded -> same plan as `SELECT * FROM big_table WHERE key = 123` (index usable). `WITH w AS (SELECT * FROM big_table) SELECT * FROM w AS w1 JOIN w AS w2 ON w1.key = w2.ref WHERE w2.key = 123;` is materialized (temp copy of big_table, self-joined, no index) -> much better with `AS NOT MATERIALIZED`. Counter-example where materializing is good: `WITH w AS (SELECT key, very_expensive_function(val) as f FROM some_table) SELECT * FROM w AS w1 JOIN w AS w2 ON w1.f = w2.f;`.
- **Data-modifying statements in WITH**:
  - `WITH moved_rows AS (DELETE FROM products WHERE "date" >= '2010-10-01' AND "date" < '2010-11-01' RETURNING *) INSERT INTO products_log SELECT * FROM moved_rows;` (moves rows).
  - Allowed **only in WITH clauses attached to the top-level statement** (attach to the INSERT, not to its sub-SELECT).
  - The **RETURNING output** (not the target table) forms the temporary table. Without RETURNING it forms no table and cannot be referenced, but is **executed anyway** (`WITH t AS (DELETE FROM foo) DELETE FROM bar;` empties both; reported row count covers only `bar`).
  - Recursive self-references in data-modifying statements are not allowed; work around by referencing a recursive SELECT CTE: `WITH RECURSIVE included_parts(...) AS (...) DELETE FROM parts WHERE part IN (SELECT part FROM included_parts);`
  - Executed **exactly once and always to completion**, regardless of whether the primary query reads their output (contrast SELECT CTEs: executed only as far as demanded).
  - Sub-statements execute **concurrently with each other and the main query**, in unpredictable order, all with the **same snapshot** -> they cannot see each other's effects on target tables; RETURNING is the only channel. `WITH t AS (UPDATE products SET price = price * 1.05 RETURNING *) SELECT * FROM products;` returns **original** prices; `... SELECT * FROM t;` returns updated data.
  - **Updating the same row twice in one statement is not supported**: only one modification takes place, unpredictably which; deleting a row already updated in the same statement -> only the update is performed. Avoid.
  - A target table of a data-modifying CTE must not have a conditional rule, an ALSO rule, or an INSTEAD rule expanding to multiple statements.

## Complete inventories

### GUCs / configuration parameters mentioned in this slice
| Parameter | Default stated in slice | Role |
|---|---|---|
| `standard_conforming_strings` | `on` (since PostgreSQL 9.1) | Backslashes literal in ordinary `'...'` strings; escapes only in `E'...'`. Must be on for `U&'...'` strings. |
| `escape_string_warning` | not stated here | Governs warnings about backslashes in string constants. |
| `backslash_quote` | not stated here | Governs treatment of `\'` in string constants. |
| `search_path` | `"$user", public` | Schema lookup order for unqualified names; first existing schema = creation target. |
| `row_security` | not stated here (described: set to `off` to error out instead of filtering) | When off, queries whose results would be filtered by an RLS policy raise an error. |
| `enable_partition_pruning` | `on` | Enables plan-time and execution-time partition pruning. |
| `constraint_exclusion` | `partition` (other values `on`, `off`) | Plan-time use of CHECK constraints to skip tables; `partition` = only for inheritance-partition-style queries. |
| `log_error_verbosity` | not stated here | Set to `verbose` for bug reports. |
| (compile-time) `NAMEDATALEN` | 64 (-> 63-byte identifiers) | In `src/include/pg_config_manual.h`. |
- Environment variables: `PGHOST`, `PGPORT`, `PGUSER`. psql variable: `VERBOSITY` (`\set VERBOSITY verbose`).
- Storage parameter seen: `parallel_workers` (`WITH (parallel_workers = 4)` on a partition).
- Role attribute seen: `BYPASSRLS`. Publication parameter seen: `publish_generated_columns`.

### Limits and sizes stated in this slice
| Item | Value |
|---|---|
| Identifier length | NAMEDATALEN-1 = 63 bytes (longer silently truncated) |
| Database name | alphabetic first char, max 63 bytes |
| Operator name length | up to 63 chars |
| Columns per table | 250 to 1600 depending on column types |
| Transaction ID | 32-bit; don't rely on uniqueness beyond 1 billion transactions |
| Command ID (cmin/cmax) | 32-bit; 2^32 (4 billion) commands per transaction; only data-modifying commands consume one |
| Integer literal typing | fits 32 bits -> integer; fits 64 bits -> bigint; else numeric |
| WITH ORDINALITY column | bigint, starts at 1, default name `ordinality` |
| Default port / socket shown | 5432, `/tmp/.s.PGSQL.5432` |
| Inheritance-partition children | "perhaps a hundred"; not thousands |
| Declarative partitions | "up to a few thousand" handled well if pruning leaves few |

### System columns (complete)
| Column | Meaning |
|---|---|
| `tableoid` | OID of the table containing the row |
| `xmin` | XID of inserting transaction of this row version |
| `cmin` | command id (from 0) within inserting transaction |
| `xmax` | XID of deleting transaction, or 0 |
| `cmax` | command id within deleting transaction, or 0 |
| `ctid` | physical location of the row version within its table |

### Privileges (complete; Table 5.1)
| Privilege | Abbrev | Applicable object types | Meaning |
|---|---|---|---|
| SELECT | `r` ("read") | LARGE OBJECT, SEQUENCE, TABLE (and table-like objects), table column | SELECT any/specific columns; COPY TO; needed to reference existing column values in UPDATE/DELETE/MERGE; sequences: `currval`; large objects: read. |
| INSERT | `a` ("append") | TABLE, table column | INSERT rows; column-level limits which columns may be assigned (others get defaults); COPY FROM. |
| UPDATE | `w` ("write") | LARGE OBJECT, SEQUENCE, TABLE, table column | UPDATE any/specific columns; `SELECT ... FOR UPDATE` / `FOR SHARE` need it on at least one column (plus SELECT); sequences: `nextval`, `setval`; large objects: write/truncate. |
| DELETE | `d` | TABLE | DELETE rows (nontrivial DELETE also needs SELECT). |
| TRUNCATE | `D` | TABLE | TRUNCATE. |
| REFERENCES | `x` | TABLE, table column | Create an FK referencing the table/columns. Caution: FK enforcement can call arbitrary functions (e.g. cast functions) with the table owner's privileges. |
| TRIGGER | `t` | TABLE | Create a trigger on table/view. Caution: triggers run with the privileges of users who modify the table. |
| CREATE | `C` | DATABASE, SCHEMA, TABLESPACE | DB: new schemas and publications, install trusted extensions. Schema: new objects (rename needs ownership + CREATE on schema). Tablespace: create tables, indexes, temp files; databases with it as default tablespace. Revoking does not alter existing objects. |
| CONNECT | `c` | DATABASE | Connect to the database (checked at connection startup, in addition to pg_hba.conf). |
| TEMPORARY | `T` | DATABASE | Create temporary tables. |
| EXECUTE | `X` | FUNCTION, PROCEDURE | Call function/procedure, including operators implemented on it. Only privilege for functions/procedures. |
| USAGE | `U` | DOMAIN, FOREIGN DATA WRAPPER, FOREIGN SERVER, LANGUAGE, SCHEMA, SEQUENCE, TYPE | Language: create functions in it. Schema: look up objects in it (names still visible via catalogs; existing sessions may have cached lookups). Sequence: `currval`, `nextval`. Type/domain: use in creating tables/functions/etc. (controls who can create dependencies on the type). FDW: create servers. Foreign server: create foreign tables; create/alter/drop own user mappings. |
| SET | `s` | PARAMETER | Set a configuration parameter in the session (meaningful only for parameters normally requiring superuser). |
| ALTER SYSTEM | `A` | PARAMETER | Configure a parameter via ALTER SYSTEM. |
| MAINTAIN | `m` | TABLE | VACUUM, ANALYZE, CLUSTER, REFRESH MATERIALIZED VIEW, REINDEX, LOCK TABLE, and database object statistics manipulation functions (Table 9.105) on a relation. |

### Privileges per object type (complete; Table 5.2)
| Object type | All privileges | Default PUBLIC privileges | psql command |
|---|---|---|---|
| DATABASE | `CTc` | `Tc` | `\l` |
| DOMAIN | `U` | `U` | `\dD+` |
| FUNCTION or PROCEDURE | `X` | `X` | `\df+` |
| FOREIGN DATA WRAPPER | `U` | none | `\dew+` |
| FOREIGN SERVER | `U` | none | `\des+` |
| LANGUAGE | `U` | `U` | `\dL+` |
| LARGE OBJECT | `rw` | none | `\dl+` |
| PARAMETER | `sA` | none | `\dconfig+` |
| SCHEMA | `UC` | none | `\dn+` |
| SEQUENCE | `rwU` | none | `\dp` |
| TABLE (and table-like objects) | `arwdDxtm` | none | `\dp` |
| Table column | `arwx` | none | `\dp` |
| TABLESPACE | `C` | none | `\db+` |
| TYPE | `U` | `U` | `\dT+` |

### Constraint types (complete for ch.5)
| Constraint | Syntax (column / table form) | Auto index | NULL behavior | Inherited by INHERITS children |
|---|---|---|---|---|
| CHECK | `CHECK (expr)` / `CHECK (expr)` | no | passes if true **or NULL** | yes (unless NO INHERIT) |
| NOT NULL | `NOT NULL` / `NOT NULL col` (non-standard) | no | rejects NULL | yes (unless NO INHERIT) |
| UNIQUE | `UNIQUE [NULLS [NOT] DISTINCT]` / `UNIQUE [NULLS [NOT] DISTINCT] (cols)` | unique B-tree | NULLs distinct by default | no |
| PRIMARY KEY | `PRIMARY KEY` / `PRIMARY KEY (cols)` | unique B-tree | forces NOT NULL; one per table | no |
| FOREIGN KEY | `REFERENCES t [(cols)]` / `FOREIGN KEY (cols) REFERENCES t [(cols)]` | none on referencing side | any NULL referencing column skips check (all-NULL only, with MATCH FULL) | no |
| EXCLUDE | — / `EXCLUDE USING method (col WITH op, ...)` | index of the named type | comparison false or null satisfies | (not stated) |

### Foreign key referential actions (complete)
| Action | ON DELETE | ON UPDATE | Deferrable check? |
|---|---|---|---|
| NO ACTION (default) | delete proceeds, then constraint checked (error if dangling) | update proceeds, constraint checked against post-update state | yes — check can be deferred |
| RESTRICT | prevents deleting a referenced row | prevents update even if the result would still satisfy the constraint | no |
| CASCADE | deletes referencing rows | copies new values into referencing rows | — |
| SET NULL [(cols)] | sets referencing columns (or listed subset) NULL | sets NULL (no column list allowed) | — |
| SET DEFAULT [(cols)] | sets to defaults (must satisfy FK) | sets to defaults (no column list allowed) | — |

### Partitioning methods, operations and lock levels (complete for this page)
| Method | Bound syntax seen | Semantics |
|---|---|---|
| RANGE | `FOR VALUES FROM (lo) TO (hi)` | lo inclusive, hi exclusive |
| LIST | (explicit list of key values per partition; bound syntax not shown on this page) | exact value membership |
| HASH | modulus + remainder (bound syntax not shown on this page) | hash(key) mod modulus = remainder |

| Operation | Lock stated |
|---|---|
| `DROP TABLE partition` | ACCESS EXCLUSIVE on parent |
| `ALTER TABLE parent DETACH PARTITION p` | ACCESS EXCLUSIVE on parent |
| `ALTER TABLE parent DETACH PARTITION p CONCURRENTLY` | SHARE UPDATE EXCLUSIVE on parent |
| `CREATE TABLE p PARTITION OF parent` | ACCESS EXCLUSIVE on parent |
| `ALTER TABLE parent ATTACH PARTITION p` | SHARE UPDATE EXCLUSIVE on parent; ACCESS EXCLUSIVE on p while validating (and on DEFAULT partition if it must be scanned) |

| Pruning stage | Works with | Visible in EXPLAIN as |
|---|---|---|
| Planning | constants in WHERE | partition absent from plan |
| Executor initialization | parameters known at init (e.g. PREPARE params) | "Subplans Removed: N" (partitions still locked) |
| During execution | subquery values, parameterized nested-loop params | per-subplan `loops`; `(never executed)` |
| Constraint exclusion (separate technique) | CHECK constraints, plan time only, constants/external params | table absent from plan |

### SQL commands and clauses appearing in this slice (one-line purpose)
| Command | Purpose |
|---|---|
| `CREATE TABLE` / `DROP TABLE [IF EXISTS] [CASCADE]` | Define / remove a table |
| `CREATE TABLE ... (LIKE src INCLUDING DEFAULTS INCLUDING CONSTRAINTS)` | Clone column definitions |
| `CREATE TABLE ... INHERITS (parent)` | Legacy inheritance child |
| `CREATE TABLE ... PARTITION BY {RANGE|LIST|HASH} (key)` | Partitioned table |
| `CREATE TABLE ... PARTITION OF parent FOR VALUES ...` | Create partition |
| `ALTER TABLE ... ADD/DROP COLUMN`, `ADD/DROP CONSTRAINT`, `ALTER COLUMN ... SET/DROP NOT NULL`, `SET/DROP DEFAULT`, `TYPE ... [USING]`, `RENAME COLUMN`, `RENAME TO`, `OWNER TO` | Modify table definition |
| `ALTER TABLE ... ENABLE / FORCE ROW LEVEL SECURITY` | Turn on RLS / apply to owner |
| `ALTER TABLE ... INHERIT / NO INHERIT` | Add/remove inheritance link |
| `ALTER TABLE ... ATTACH PARTITION / DETACH PARTITION [CONCURRENTLY]` | Partition maintenance |
| `ALTER INDEX ... ATTACH PARTITION` | Attach partition index to partitioned index |
| `CREATE INDEX [CONCURRENTLY] ... [ON ONLY]` | Index creation |
| `CREATE VIEW` | Named query |
| `CREATE SCHEMA [name] [AUTHORIZATION user]` / `DROP SCHEMA [CASCADE]` | Namespaces |
| `CREATE POLICY` / `ALTER POLICY` / `DROP POLICY` | Row security policies |
| `CREATE ROLE`, `ALTER ROLE ALL SET search_path = ...`, `SET ROLE` | Roles |
| `GRANT` / `REVOKE` / `ALTER DEFAULT PRIVILEGES` | Privileges |
| `CREATE FUNCTION` (string body, `BEGIN ATOMIC`), `CREATE TRIGGER`, `CREATE RULE`, `CREATE TYPE ... AS (...)`, `CREATE TYPE ... AS ENUM` | Programmability objects used in examples |
| `CREATE FOREIGN DATA WRAPPER`, `CREATE SERVER`, `CREATE USER MAPPING`, `CREATE FOREIGN TABLE`, `IMPORT FOREIGN SCHEMA` | Foreign data |
| `INSERT` (VALUES / DEFAULT VALUES / SELECT / ON CONFLICT DO UPDATE / OVERRIDING SYSTEM VALUE) | Add rows |
| `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE [ONLY]` | Modify/remove rows |
| `RETURNING` (with `old.` / `new.`) | Return modified rows |
| `COPY ... FROM` / psql `\copy` | Bulk load |
| `SELECT`, `TABLE name`, `VALUES`, `WITH [RECURSIVE]`, `SEARCH`, `CYCLE`, `[NOT] MATERIALIZED` | Queries |
| `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `ROLLBACK TO` | Transaction control |
| `SET`, `SHOW`, `EXPLAIN`, `ANALYZE [ONLY]`, `VACUUM`, `REINDEX`, `PREPARE` | Session/utility |

### Join types (complete)
| Join | Result |
|---|---|
| `CROSS JOIN` (or comma) | N*M Cartesian product |
| `[INNER] JOIN ... ON/USING` / `NATURAL JOIN` | matching pairs only |
| `LEFT [OUTER] JOIN` | inner result + unmatched left rows NULL-extended |
| `RIGHT [OUTER] JOIN` | inner result + unmatched right rows NULL-extended |
| `FULL [OUTER] JOIN` | inner result + unmatched rows of both sides |
| `LATERAL` item (with comma, CROSS JOIN, or LEFT JOIN ... ON true) | right side re-evaluated per left row |

### Window frame vocabulary (complete)
- Modes: `RANGE`, `ROWS`, `GROUPS`.
- Bounds: `UNBOUNDED PRECEDING`, `offset PRECEDING`, `CURRENT ROW`, `offset FOLLOWING`, `UNBOUNDED FOLLOWING`.
- Exclusions: `EXCLUDE CURRENT ROW`, `EXCLUDE GROUP`, `EXCLUDE TIES`, `EXCLUDE NO OTHERS`.
- Default: `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.

### String/constant syntaxes (complete)
`'...'`, `E'...'`, `U&'...' [UESCAPE 'c']`, `$tag$...$tag$`, `B'...'`, `X'...'`, decimal/exponent numerics, `0x`/`0o`/`0b` integers, underscores in digits, `type '...'`, `'...'::type`, `CAST('...' AS type)`, `typename('...')`.

### Backslash escapes in E'' strings (complete; Table 4.1)
`\b` backspace; `\f` form feed; `\n` newline; `\r` carriage return; `\t` tab; `\o`, `\oo`, `\ooo` octal byte; `\xh`, `\xhh` hex byte; `\uxxxx`, `\Uxxxxxxxx` 16-/32-bit Unicode code point.

### psql meta-commands mentioned
`\h`, `\?`, `\q`, `\i`, `\d tablename`, `\dp`, `\l`, `\dD+`, `\df+`, `\dew+`, `\des+`, `\dL+`, `\dl+`, `\dconfig+`, `\dn+`, `\db+`, `\dT+`, `\copy`, `\set VERBOSITY verbose`; option `psql -s`.

## Lesson ideas

### Visualizer ideas
1. **Process model (M1)**: animate a client connecting to the `postgres` supervisor, the fork of a dedicated backend, then direct client<->backend traffic while the supervisor returns to listening. Second and third clients produce more backends; closing a client removes its backend. (Facts: tutorial-arch.)
2. **Cluster -> database -> schema -> object tree with search_path resolver (M1)**: type an unqualified name; highlight the lookup walking implicit `pg_catalog`, then `"$user"` (greyed out if no such schema), then `public`; show "current schema" as the creation target; toggle `SET search_path` and watch resolution change; show a malicious same-named object in a writable schema capturing the lookup.
3. **Lexer/tokenizer stepper (M4 parser stage)**: feed a statement, colour tokens (key word, identifier, quoted identifier, constant, operator, special char), show case folding of unquoted identifiers to lower case, 63-byte truncation, dollar-quote nesting, and numeric literal typing (integer -> bigint -> numeric thresholds).
4. **Operator precedence tree builder**: enter an expression; render the parse tree per Table 4.2; compare `OPERATOR(pg_catalog.+)` precedence vs bare `+`.
5. **Logical query pipeline (M3)**: boxes FROM -> WHERE -> GROUP BY/aggregates -> HAVING -> window functions -> select list/DISTINCT -> ORDER BY -> OFFSET/LIMIT with row sets flowing through; clicking a clause explains why aggregates are illegal in WHERE and window functions illegal in WHERE/GROUP BY/HAVING.
6. **Join explorer**: the docs' t1/t2 tables; toggle CROSS/INNER/LEFT/RIGHT/FULL and ON vs USING vs NATURAL; show NULL-extension and USING column suppression; a second panel contrasts a predicate in `ON` vs in `WHERE` for a LEFT JOIN (3 rows vs 1 row).
7. **LATERAL loop animation**: for each left row, re-run the right subquery/SRF with that row's values and emit joined rows; switch between comma/CROSS JOIN LATERAL (drops rows with empty result) and LEFT JOIN LATERAL ... ON true (keeps them).
8. **Grouping sets lattice**: draw the lattice for ROLLUP (prefix chain) and CUBE (power set); highlight which grouping set produced each output row and where NULL placeholders come from; show Cartesian product of multiple grouping items and `GROUP BY DISTINCT` de-duplication.
9. **Window frame slider**: ordered partition of the `empsalary` data; move the current row and show the frame for ROWS / RANGE / GROUPS, each bound type, and each EXCLUDE option; demonstrate why default frame gives peers the same running sum (4800/4800 -> 25700).
10. **Recursive CTE stepper**: three panes — result, working table, intermediate table — executing the documented algorithm step by step for `t(n)` 1..100 and for a small graph with a cycle; toggle UNION vs UNION ALL; show CYCLE's `is_cycle`/`path` columns and SEARCH DEPTH/BREADTH FIRST ordering columns.
11. **CTE materialize vs inline**: same query with single reference (folded; predicate pushed to the base table scan) vs double reference (CTE Scan over a materialized copy) vs `NOT MATERIALIZED`; show EXPLAIN side by side.
12. **Data-modifying CTE snapshot**: timeline showing all sub-statements sharing one snapshot; `SELECT * FROM products` sees old prices while `SELECT * FROM t` (RETURNING) sees new ones.
13. **RETURNING old/new**: row before/after cards for INSERT (old = NULL), UPDATE (both), DELETE (new = NULL), `INSERT ... ON CONFLICT DO UPDATE` (old non-NULL on conflict), MERGE.
14. **System columns / row versions (M2/M5 teaser)**: show `xmin`, `xmax`, `cmin`, `cmax`, `ctid` on a row; run an UPDATE and watch a new row version with a new `ctid` and `xmin`; run a rolled-back DELETE and show nonzero `xmax` on a still-visible row.
15. **Foreign-key action simulator**: parent/child tables; delete or update a parent row under NO ACTION / RESTRICT / CASCADE / SET NULL / SET DEFAULT, including the column-list `SET NULL (author_id)` multi-tenant example and MATCH FULL vs default NULL handling.
16. **Partition router and pruner (M7)**: rows dropping into RANGE/LIST/HASH partitions (inclusive lower / exclusive upper bound); UPDATE of the key moving a row; then a WHERE clause greying out pruned partitions, with a mode switch for plan-time, init-time ("Subplans Removed"), and run-time ("never executed") pruning. Add ATTACH/DETACH with lock-level badges (ACCESS EXCLUSIVE vs SHARE UPDATE EXCLUSIVE).
17. **RLS filter**: table rows with a policy panel; switch `current_user`; show permissive policies OR-ed, restrictive AND-ed, default-deny when no policy, USING vs WITH CHECK (error "new row violates ..."), owner bypass vs FORCE.
18. **ACL decoder**: type/hover an aclitem like `calvin=r*w/hobbes` and decode grantee, each letter, grant option, grantor; build ACLs via GRANT/REVOKE buttons.
19. **Generated column: stored vs virtual**: write path computes and stores STORED value; read path computes VIRTUAL value; compare storage footprint and BEFORE-trigger ordering.
20. **Savepoint stack**: transaction timeline with savepoints as a stack; ROLLBACK TO pops later savepoints but keeps the target; show recovery from an aborted transaction state.

### Playground SQL (PGlite, PostgreSQL 18, single session)
```sql
-- 1. Tutorial dataset + basics
CREATE TABLE cities (name varchar(80) PRIMARY KEY, location point);
CREATE TABLE weather (city varchar(80) REFERENCES cities(name), temp_lo int, temp_hi int, prcp real, date date);
INSERT INTO cities VALUES ('San Francisco', '(-194.0, 53.0)'), ('Hayward', '(-122.0, 37.6)');
INSERT INTO weather VALUES ('San Francisco', 46, 50, 0.25, '1994-11-27'),
                           ('San Francisco', 43, 57, 0.0,  '1994-11-29');
INSERT INTO weather (date, city, temp_hi, temp_lo) VALUES ('1994-11-29', 'Hayward', 54, 37);
SELECT city, count(*) FILTER (WHERE temp_lo < 45), max(temp_lo) FROM weather GROUP BY city;
INSERT INTO weather VALUES ('Berkeley', 45, 53, 0.0, '1994-11-28');   -- FK violation
```
```sql
-- 2. Lexical quirks
SELECT 'foo'
'bar';                                   -- concatenated: foobar
SELECT E'tab\there', U&'d\0061t\+000061', $q$Dianne's horse$q$, B'1001', X'1FF';
SELECT 1_500_000_000, 0xFFFF_FFFF, 0b100101, 0o755;
SELECT pg_typeof(42), pg_typeof(4294967296), pg_typeof(9223372036854775808), pg_typeof(1.5), pg_typeof(5e2);
SELECT 3 OPERATOR(pg_catalog.+) 4;
CREATE TABLE "Foo" (a int); SELECT * FROM "Foo"; SELECT * FROM foo;   -- second fails
```
```sql
-- 3. Evaluation-order traps
SELECT CASE WHEN x > 0 THEN x ELSE 1/0 END FROM (VALUES (1)) v(x);    -- may fail at plan time
SELECT count(*) AS unfiltered, count(*) FILTER (WHERE i < 5) AS filtered FROM generate_series(1,10) AS s(i);
SELECT array_agg(v ORDER BY v DESC), array_agg(DISTINCT v ORDER BY v DESC) FROM (VALUES (1),(3),(4),(3),(2)) vals(v);
SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY v) FROM (VALUES (1),(3),(4),(3),(2)) vals(v);
```
```sql
-- 4. Joins (docs' t1/t2)
CREATE TABLE t1 (num int, name text); CREATE TABLE t2 (num int, value text);
INSERT INTO t1 VALUES (1,'a'),(2,'b'),(3,'c'); INSERT INTO t2 VALUES (1,'xxx'),(3,'yyy'),(5,'zzz');
SELECT * FROM t1 FULL JOIN t2 ON t1.num = t2.num;
SELECT * FROM t1 LEFT JOIN t2 USING (num);
SELECT * FROM t1 LEFT JOIN t2 ON t1.num = t2.num AND t2.value = 'xxx';   -- 3 rows
SELECT * FROM t1 LEFT JOIN t2 ON t1.num = t2.num WHERE t2.value = 'xxx'; -- 1 row
SELECT * FROM t1, LATERAL (SELECT * FROM t2 WHERE t2.num >= t1.num ORDER BY num LIMIT 1) ss;
SELECT * FROM t1 LEFT JOIN LATERAL generate_series(1, t1.num - 1) g ON true;
SELECT * FROM ROWS FROM (generate_series(1,3), generate_series(10,11)) WITH ORDINALITY AS x(a,b,n);
SELECT * FROM unnest(ARRAY[1,2,3], ARRAY['a','b']) WITH ORDINALITY;
```
```sql
-- 5. Grouping sets
CREATE TABLE items_sold (brand text, size text, sales int);
INSERT INTO items_sold VALUES ('Foo','L',10),('Foo','M',20),('Bar','M',15),('Bar','L',5);
SELECT brand, size, sum(sales) FROM items_sold GROUP BY GROUPING SETS ((brand), (size), ());
SELECT brand, size, sum(sales) FROM items_sold GROUP BY ROLLUP (brand, size);
SELECT brand, size, sum(sales) FROM items_sold GROUP BY CUBE (brand, size);
```
```sql
-- 6. Windows
CREATE TABLE empsalary (depname text, empno int, salary int);
INSERT INTO empsalary VALUES ('develop',11,5200),('develop',7,4200),('develop',9,4500),('develop',8,6000),
 ('develop',10,5200),('personnel',5,3500),('personnel',2,3900),('sales',3,4800),('sales',1,5000),('sales',4,4800);
SELECT salary, sum(salary) OVER (ORDER BY salary) AS range_default,
       sum(salary) OVER (ORDER BY salary ROWS UNBOUNDED PRECEDING) AS rows_mode,
       sum(salary) OVER (ORDER BY salary GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS groups_mode,
       sum(salary) OVER (ORDER BY salary RANGE BETWEEN 500 PRECEDING AND 500 FOLLOWING EXCLUDE CURRENT ROW) AS range_excl
FROM empsalary;
SELECT depname, empno, salary FROM (SELECT *, row_number() OVER (PARTITION BY depname ORDER BY salary DESC, empno) AS pos FROM empsalary) ss WHERE pos < 3;
```
```sql
-- 7. Recursive CTEs, SEARCH, CYCLE, materialization
WITH RECURSIVE t(n) AS (VALUES (1) UNION ALL SELECT n+1 FROM t WHERE n < 100) SELECT sum(n) FROM t;
WITH RECURSIVE t(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM t) SELECT n FROM t LIMIT 5;
CREATE TABLE graph (id int, link int, data text);
INSERT INTO graph VALUES (1,2,'a'),(2,3,'b'),(3,1,'c'),(4,NULL,'d');
WITH RECURSIVE sg(id, link, data, depth) AS (
  SELECT g.id, g.link, g.data, 1 FROM graph g WHERE id = 1
  UNION ALL
  SELECT g.id, g.link, g.data, sg.depth + 1 FROM graph g, sg WHERE g.id = sg.link
) CYCLE id SET is_cycle USING path
SELECT * FROM sg;
CREATE TABLE big_table AS SELECT g AS key, g % 10 AS ref FROM generate_series(1,10000) g;
CREATE INDEX ON big_table (key); ANALYZE big_table;
EXPLAIN WITH w AS (SELECT * FROM big_table) SELECT * FROM w WHERE key = 123;
EXPLAIN WITH w AS MATERIALIZED (SELECT * FROM big_table) SELECT * FROM w WHERE key = 123;
EXPLAIN WITH w AS (SELECT * FROM big_table) SELECT * FROM w w1 JOIN w w2 ON w1.key = w2.ref WHERE w2.key = 123;
EXPLAIN WITH w AS NOT MATERIALIZED (SELECT * FROM big_table) SELECT * FROM w w1 JOIN w w2 ON w1.key = w2.ref WHERE w2.key = 123;
```
```sql
-- 8. DML: RETURNING old/new, data-modifying CTE
CREATE TABLE products (product_no int PRIMARY KEY, name text, price numeric);
INSERT INTO products VALUES (1,'Cheese',9.99),(2,'Bread',1.99),(3,'Milk',2.99) RETURNING *;
UPDATE products SET price = price * 1.10 WHERE price <= 99.99
  RETURNING name, old.price AS old_price, new.price AS new_price, new.price - old.price AS price_change;
INSERT INTO products VALUES (1,'Cheddar',12) ON CONFLICT (product_no) DO UPDATE SET name = EXCLUDED.name
  RETURNING old.name AS old_name, new.name AS new_name;
DELETE FROM products WHERE product_no = 3 RETURNING old.*, new.product_no AS new_is_null;
WITH t AS (UPDATE products SET price = price * 1.05 RETURNING *) SELECT * FROM products;  -- shows ORIGINAL prices (same snapshot)
WITH t AS (UPDATE products SET price = price * 1.05 RETURNING *) SELECT * FROM t;         -- shows UPDATED prices (via RETURNING)
CREATE TABLE products_log (LIKE products);
WITH moved AS (DELETE FROM products WHERE price < 3 RETURNING *) INSERT INTO products_log SELECT * FROM moved;
```
```sql
-- 9. DDL: identity, generated (virtual default in 18), constraints, system columns
CREATE TABLE people (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  height_cm numeric CHECK (height_cm > 0),
  height_in numeric GENERATED ALWAYS AS (height_cm / 2.54),          -- virtual
  height_m  numeric GENERATED ALWAYS AS (height_cm / 100) STORED,
  email text UNIQUE NULLS NOT DISTINCT
);
INSERT INTO people (name, height_cm) VALUES ('A', 180), ('B', NULL);   -- second NULL email fails
INSERT INTO people (id, name) VALUES (99, 'C');                         -- error: GENERATED ALWAYS
INSERT INTO people (id, name, email) OVERRIDING SYSTEM VALUE VALUES (99, 'C', 'c@x');
SELECT tableoid::regclass, ctid, xmin, xmax, cmin, cmax, * FROM people;
UPDATE people SET name = 'A2' WHERE name = 'A';
SELECT ctid, xmin, xmax, name FROM people;                              -- ctid changed
CREATE TABLE circles (c circle, EXCLUDE USING gist (c WITH &&));
INSERT INTO circles VALUES ('<(0,0),1>'); INSERT INTO circles VALUES ('<(1,0),1>');  -- second fails
```
```sql
-- 10. FK actions with column-list SET NULL
CREATE TABLE tenants (tenant_id int PRIMARY KEY);
CREATE TABLE users (tenant_id int REFERENCES tenants ON DELETE CASCADE, user_id int NOT NULL, PRIMARY KEY (tenant_id, user_id));
CREATE TABLE posts (tenant_id int REFERENCES tenants ON DELETE CASCADE, post_id int NOT NULL, author_id int,
  PRIMARY KEY (tenant_id, post_id),
  FOREIGN KEY (tenant_id, author_id) REFERENCES users ON DELETE SET NULL (author_id));
INSERT INTO tenants VALUES (1); INSERT INTO users VALUES (1,10); INSERT INTO posts VALUES (1,100,10);
DELETE FROM users WHERE user_id = 10; SELECT * FROM posts;             -- author_id NULL, tenant_id kept
```
```sql
-- 11. Schemas, privileges, RLS (single session using SET ROLE)
SHOW search_path; CREATE SCHEMA myschema; CREATE TABLE myschema.mytable (a int);
SET search_path TO myschema, public; SELECT current_schema(); RESET search_path;
CREATE ROLE alice; CREATE ROLE bob;
CREATE TABLE accounts (manager text, company text, contact_email text);
INSERT INTO accounts VALUES ('alice','A Corp','a@a'),('bob','B Corp','b@b');
GRANT SELECT, INSERT, UPDATE ON accounts TO alice, bob;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
SET ROLE alice; SELECT * FROM accounts; RESET ROLE;                     -- default deny: 0 rows
CREATE POLICY account_managers ON accounts USING (manager = current_user);
SET ROLE alice; SELECT * FROM accounts; INSERT INTO accounts VALUES ('bob','X','x'); RESET ROLE;  -- insert fails WITH CHECK
SELECT relname, relacl FROM pg_class WHERE relname = 'accounts';
```
```sql
-- 12. Partitioning + pruning
CREATE TABLE measurement (city_id int NOT NULL, logdate date NOT NULL, peaktemp int, unitsales int) PARTITION BY RANGE (logdate);
CREATE TABLE measurement_y2006m02 PARTITION OF measurement FOR VALUES FROM ('2006-02-01') TO ('2006-03-01');
CREATE TABLE measurement_y2006m03 PARTITION OF measurement FOR VALUES FROM ('2006-03-01') TO ('2006-04-01');
INSERT INTO measurement VALUES (1,'2006-02-15',20,5),(1,'2006-03-01',22,7);
SELECT tableoid::regclass, * FROM measurement;
UPDATE measurement SET logdate = '2006-03-20' WHERE logdate = '2006-02-15';  -- row moves
INSERT INTO measurement VALUES (1,'2007-01-01',1,1);                          -- no partition: error
EXPLAIN SELECT count(*) FROM measurement WHERE logdate >= DATE '2006-03-01';
SET enable_partition_pruning = off;
EXPLAIN SELECT count(*) FROM measurement WHERE logdate >= DATE '2006-03-01';
RESET enable_partition_pruning;
PREPARE q(date) AS SELECT count(*) FROM measurement WHERE logdate >= $1;
SET plan_cache_mode = force_generic_plan; EXPLAIN (ANALYZE) EXECUTE q('2006-03-01');   -- look for "Subplans Removed"
ALTER TABLE measurement DETACH PARTITION measurement_y2006m02;
```
```sql
-- 13. Inheritance
CREATE TABLE cities2 (name text, population float, elevation int);
CREATE TABLE capitals (state char(2)) INHERITS (cities2);
INSERT INTO cities2 VALUES ('Las Vegas', 2.5e5, 2174); INSERT INTO capitals VALUES ('Madison', 2.6e5, 845, 'WI');
SELECT tableoid::regclass, name FROM cities2; SELECT name FROM ONLY cities2;
```
```sql
-- 14. Transactions and savepoints
BEGIN; UPDATE products SET price = 0 WHERE product_no = 1; SAVEPOINT s1;
SELECT 1/0;                    -- transaction aborted
ROLLBACK TO s1;                -- regain control
COMMIT;
```
Notes for playground authors: in snippet 8 each of the two `WITH t AS (UPDATE ...)` statements applies the 5% increase, so prices rise twice; `plan_cache_mode` in snippet 12 is not from this slice (it is a convenience to force init-time pruning) — verify in PGlite; `COPY FROM` a server file and `dblink` are not usable in PGlite.

### Pitfalls the docs explicitly warn about (with documented fix)
1. `DELETE FROM t;` / `UPDATE` without WHERE affects **all rows**, no confirmation -> always qualify.
2. `SELECT *` in production code -> results change when columns are added; list columns.
3. DISTINCT does not sort; LIMIT/OFFSET without ORDER BY gives unpredictable and plan-dependent subsets -> add a unique ORDER BY. Large OFFSET still computes skipped rows.
4. Aggregates in WHERE are illegal -> use a subquery or HAVING; put non-aggregate filters in WHERE rather than HAVING for efficiency.
5. Unquoted identifiers fold to **lower case** (non-standard) -> always quote or never quote a given name. Identifiers over 63 bytes are silently truncated.
6. Backslash escapes are not recognized in plain strings (`standard_conforming_strings = on`) -> use `E'...'`.
7. `string_agg(a ORDER BY a, ',')` is valid but wrong -> ORDER BY goes after all arguments.
8. Expression evaluation order is undefined; no guaranteed short-circuit -> use CASE to force order, but CASE does not protect against plan-time constant folding (`1/0`) nor against aggregates inside it -> use WHERE/FILTER, or IF in PL/pgSQL.
9. Function-like casts (`typename(expr)`) are inconsistent -> use CAST or `::`.
10. CHECK passes on NULL -> add NOT NULL. CHECK must not reference other rows/tables and must be immutable -> use UNIQUE/EXCLUDE/FK or a trigger; if a function used by a CHECK changes, drop and re-add the constraint.
11. UNIQUE allows multiple NULLs by default -> `NULLS NOT DISTINCT`.
12. FK referencing columns are not indexed automatically -> create an index if the referenced table sees deletes/updates. SET DEFAULT fails if the default violates the FK. Mixed NULLs bypass a multi-column FK -> MATCH FULL or NOT NULL.
13. Identity columns are not unique by themselves -> add PRIMARY KEY/UNIQUE.
14. `ctid` changes on UPDATE / VACUUM FULL -> never use it as a row identifier; use a primary key. Do not rely on XID uniqueness long-term.
15. ADD COLUMN with a **volatile** default rewrites/updates every row -> add without default, UPDATE, then SET DEFAULT.
16. ALTER COLUMN TYPE may fail converting defaults/constraints -> drop constraints first, re-add after.
17. Granting REFERENCES or TRIGGER lets the grantee cause code to run with the owner's / modifying users' privileges -> grant with great care. Revoke default PUBLIC privileges in the same transaction that creates the object.
18. A writable schema in `search_path` lets other users hijack unqualified names -> use a secure schema usage pattern (per-user schemas; no public CREATE; PG15+ default) or set an empty/safe search_path. Avoid `pg_`-prefixed table names.
19. RLS: enabled with no policy = default deny; owners bypass unless FORCE; RI checks bypass RLS (covert channels); backups can silently omit rows -> set `row_security = off` to get an error instead; policies with sub-SELECTs have a READ COMMITTED race -> `FOR SHARE` in the sub-SELECT, ACCESS EXCLUSIVE lock on the referenced table, or wait out concurrent transactions.
20. Inheritance: INSERT is not routed; unique/PK/FK constraints do not span children; permissions checked on the parent only -> prefer declarative partitioning; use ONLY when needed.
21. Partitioning: range upper bound is exclusive (avoid `BETWEEN` overlap in inheritance CHECKs); PK/UNIQUE must include all partition key columns; no `CREATE INDEX CONCURRENTLY` on a partitioned table -> `ON ONLY` + per-partition CONCURRENTLY + `ALTER INDEX ... ATTACH PARTITION`; ATTACH scans under ACCESS EXCLUSIVE -> pre-create a matching CHECK (and a CHECK on the DEFAULT partition); too many partitions inflate planning time and per-session memory; constraint exclusion fails with non-immutable expressions like `CURRENT_TIMESTAMP`; COPY ignores rules; ON CONFLICT does not see child tables in inheritance setups.
22. NATURAL JOIN silently changes meaning when schemas change -> prefer USING/ON. A WHERE filter on the nullable side of an outer join removes the NULL-extended rows -> put it in ON if that is not intended. JOIN binds tighter than comma.
23. A table alias hides the original table name for the rest of the query.
24. `SELECT a FROM b UNION SELECT x FROM y LIMIT 10` applies LIMIT to the whole union -> parenthesize. INTERSECT binds tighter than UNION/EXCEPT.
25. Output column names in ORDER BY cannot be used inside expressions (`ORDER BY sum + c` is wrong).
26. DISTINCT ON picks an unpredictable row unless ORDER BY makes the order unique.
27. Window output ordering is incidental -> add a top-level ORDER BY. `OVER (w ...)` is rejected if `w` has a frame clause.
28. Recursive CTE without termination loops forever -> UNION, CYCLE clause, or (testing only) LIMIT in the parent. Do not rely on breadth-first output order.
29. Multiply-referenced CTEs are materialized and block predicate pushdown -> `NOT MATERIALIZED`; conversely use `MATERIALIZED` to avoid recomputing expensive/volatile work.
30. Data-modifying CTEs: sub-statements share one snapshot and run in unpredictable order; modifying the same row twice in one statement is unsupported -> communicate via RETURNING only and avoid overlapping targets.
31. String-body functions are not dependency-tracked against tables they reference -> use `BEGIN ATOMIC` bodies; check `DROP` (without CASCADE) DETAIL output before cascading.
32. Named/mixed argument notation cannot be used for aggregate calls.
