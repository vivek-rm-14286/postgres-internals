# G — Part V: Extending SQL (ch.36), Triggers (ch.37), Event Triggers (ch.38), Rule System (ch.39), Procedural Languages (ch.40), Logical Decoding (ch.47), Replication Progress Tracking (ch.48), Archive Modules (ch.49), OAuth Validator Modules (ch.50)

Source: PostgreSQL 18.7 docs, pages idx 434-474 and 584-602 of `_order.tsv`.

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 434 | server-programming.txt | Part V intro and chapter list (ch.36-50); read ch.36 functions first |
| 435 | extend.txt | Ch.36 TOC; what can be added: functions, aggregates, types, operators, opclasses, extensions |
| 436 | extend-how.txt | Extensibility = catalog-driven operation + dynamic loading of shared libraries |
| 437 | extend-type-system.txt | Type system: base/container/domain/pseudo types; polymorphic types table and resolution rules (simple vs common families) |
| 438 | xfunc.txt | Four kinds of functions: SQL, PL, internal, C |
| 439 | xproc.txt | Procedures vs functions: CALL, no RETURNS, transaction control, routines |
| 440 | xfunc-sql.txt | SQL functions: args, composites, OUT params, VARIADIC, defaults, table functions, SETOF/SRF semantics, RETURNS TABLE, polymorphism, collations |
| 441 | xfunc-overload.txt | Overloading rules: ambiguity, attribute-vs-function, variadic precedence, C symbol names |
| 442 | xfunc-volatility.txt | Volatility categories VOLATILE/STABLE/IMMUTABLE and their snapshot behaviour |
| 443 | xfunc-pl.txt | PL functions are provided by loadable modules |
| 444 | xfunc-internal.txt | Internal functions: statically linked C, LANGUAGE internal aliases |
| 445 | xfunc-c.txt | C functions: dynamic loading, magic block, base type formats, V1 convention, compiling, ABI policy, rows/sets, polymorphism, shmem, LWLocks, wait events, injection points, custom stats, C++ |
| 446 | xfunc-optimization.txt | Planner hints: volatility/parallel/COST/ROWS and planner support function request types |
| 447 | xaggr.txt | Aggregates: state/transition/final, moving-aggregate mode, polymorphic/variadic, ordered-set, partial aggregation, C support |
| 448 | xtypes.txt | Base types: I/O functions, shell type, CREATE TYPE, varlena layout, TOAST and expanded objects |
| 449 | xoper.txt | CREATE OPERATOR basics (prefix/infix, underlying function) |
| 450 | xoper-optimization.txt | Operator clauses COMMUTATOR, NEGATOR, RESTRICT, JOIN, HASHES, MERGES and standard estimators |
| 451 | xindex.txt | Operator classes/families: strategy and support numbers per AM, complex_abs_ops example, integer_ops family, ordering operators, lossy/STORAGE |
| 452 | extend-extensions.txt | Extensions: control file parameters, script naming, relocatability, config tables, update paths, security, pair example |
| 453 | extend-pgxs.txt | PGXS makefile variables, install prefix, VPATH builds, regression/isolation/TAP tests |
| 454 | triggers.txt | Ch.37 intro: trigger functions in PLs or C, not plain SQL |
| 455 | trigger-definition.txt | Trigger behaviour: row/statement, BEFORE/AFTER/INSTEAD OF, return values, ON CONFLICT, partitions, MERGE, generated columns, order, WHEN, transition tables |
| 456 | trigger-datachanges.txt | Visibility of data changes inside trigger functions |
| 457 | trigger-interface.txt | C trigger interface: TriggerData, Trigger struct, TRIGGER_FIRED_* macros |
| 458 | trigger-example.txt | Complete C trigger example trigf on ttest demonstrating skip-on-NULL and visibility |
| 459 | event-triggers.txt | Ch.38 intro: event triggers are per-database and capture DDL |
| 460 | event-trigger-definition.txt | Event trigger events login, ddl_command_start, ddl_command_end, sql_drop, table_rewrite; covered commands; aborted transactions; creation |
| 461 | event-trigger-interface.txt | C event trigger interface: EventTriggerData |
| 462 | event-trigger-example.txt | noddl example blocking all DDL; disabling within a transaction |
| 463 | event-trigger-table-rewrite-example.txt | table_rewrite policy example in PL/pgSQL |
| 464 | event-trigger-database-login-example.txt | login event trigger example (roles, temp table, logging, recovery check) |
| 465 | rules.txt | Ch.39 intro: query rewrite rule system vs procedures/triggers |
| 466 | querytree.txt | Query tree parts: command type, range table, result relation, target list, qualification, join tree |
| 467 | rules-views.txt | Views as _RETURN rules; expansion algorithm with shoe example; non-SELECT statements and CTID; updating views |
| 468 | rules-materializedviews.txt | Materialized views: stored query + persisted data, REFRESH, indexing, file_fdw timing example |
| 469 | rules-update.txt | Rules on INSERT/UPDATE/DELETE: ALSO/INSTEAD, qualifications, NEW/OLD substitution, step-by-step log_shoelace, view cooperation |
| 470 | rules-privileges.txt | Rule privileges checked as rule owner; security_barrier and LEAKPROOF |
| 471 | rules-status.txt | Command status returned when rules rewrite a query |
| 472 | rules-triggers.txt | Rules vs triggers: capabilities and performance comparison (computer/software) |
| 473 | xplang.txt | Ch.40 intro: handlers; four bundled PLs |
| 474 | xplang-install.txt | Installing PLs: template1, CREATE EXTENSION, manual five steps, TRUSTED, PL/Perl example, defaults |
| 584 | logicaldecoding.txt | Ch.47 intro: streaming SQL changes to consumers via slots and output plugins |
| 585 | logicaldecoding-example.txt | Examples: SQL interface with test_decoding, pg_recvlogical, two-phase decoding |
| 586 | logicaldecoding-explanation.txt | Concepts: logical decoding, replication slots, slot synchronization/failover, output plugins, exported snapshots |
| 587 | logicaldecoding-walsender.txt | Replication protocol commands for logical slots; pg_recvlogical |
| 588 | logicaldecoding-sql.txt | SQL interface pointer; sync replication only over the streaming interface |
| 589 | logicaldecoding-catalogs.txt | Views pg_replication_slots, pg_stat_replication, pg_stat_replication_slots |
| 590 | logicaldecoding-output-plugin.txt | Output plugin API: init function, callback struct, capabilities, output modes, every callback signature, output functions |
| 591 | logicaldecoding-writer.txt | Output writers: three functions needed for a new output method |
| 592 | logicaldecoding-synchronous.txt | Synchronous replication with logical decoding and catalog-lock deadlock caveats |
| 593 | logicaldecoding-streaming.txt | Streaming of large in-progress transactions: callbacks, block sequence, logical_decoding_work_mem trigger |
| 594 | logicaldecoding-two-phase-commits.txt | Two-phase commit decoding: callbacks, behaviour at PREPARE, cautions |
| 595 | replication-origins.txt | Replication origins: name/ID, progress tracking functions, loop prevention |
| 596 | archive-modules.txt | Ch.49 intro: archive_library modules vs archive_command; basic_archive |
| 597 | archive-module-init.txt | _PG_archive_module_init and ArchiveModuleCallbacks |
| 598 | archive-module-callbacks.txt | Archive callbacks: startup, check_configured, archive_file, shutdown |
| 599 | oauth-validators.txt | Ch.50 intro: OAuth bearer token validator modules |
| 600 | oauth-validator-design.txt | Validator design: validate token, authorize client, authenticate user; coding guidelines; usermap delegation |
| 601 | oauth-validator-init.txt | _PG_oauth_validator_module_init and OAuthValidatorCallbacks |
| 602 | oauth-validator-callbacks.txt | OAuth callbacks: startup, validate (ValidatorModuleResult), shutdown |

## Notes by topic

### Part V overview & how extensibility works  [M6, M1]  (source: server-programming.txt, extend.txt, extend-how.txt)
- Part V = server programming: user-defined functions, data types, triggers, etc. Docs say it is "essential to read at least the earlier sections of Chapter 36 (covering functions)" before PL chapters.
- Part V chapter list: 36 Extending SQL, 37 Triggers, 38 Event Triggers, 39 The Rule System, 40 Procedural Languages, 41 PL/pgSQL, 42 PL/Tcl, 43 PL/Perl, 44 PL/Python, 45 SPI, 46 Background Worker Processes, 47 Logical Decoding, 48 Replication Progress Tracking, 49 Archive Modules, 50 OAuth Validator Modules.
- Ch.36 lets you add: functions (36.3), aggregates (36.12), data types (36.13), operators (36.14), operator classes for indexes (36.16), packages of related objects = extensions (36.17).
- PostgreSQL is extensible because its operation is **catalog-driven**: catalogs store not only tables/columns but data types, functions, access methods, etc. Users can modify these tables, so the system can be extended without changing hardcoded source.
- Second mechanism: **dynamic loading** — user specifies an object code file (shared library) implementing a new type or function; PostgreSQL loads it as required. SQL-language code is "even more trivial to add".

### The PostgreSQL type system  [M2, M6]  (source: extend-type-system.txt)
- Four divisions: **base types, container types, domains, pseudo-types**.
- Base types: implemented below the SQL level (typically C); "abstract data types"; PostgreSQL only operates on them through user-provided functions. Enum types are a subcategory of base types creatable with pure SQL.
- Container types (3 kinds): **arrays, composites, ranges**. An array type is automatically created for each base, composite, range, and domain type. **There are no arrays of arrays**; multi-dimensional arrays are the same type as one-dimensional arrays. Composite (row) types are created whenever a table is created; `CREATE TYPE` makes stand-alone composites. Range types hold lower+upper bound of the same subtype.
- Domains: based on an underlying type, interchangeable for many purposes, but may carry constraints restricting values (`CREATE DOMAIN`).
- Pseudo-types: cannot be table columns or components of container types; usable only to declare function argument/result types (Table 8.27).
- **Polymorphic types (Table 36.1)** — two independent families of type variables:
  - Simple family: `anyelement` (any type), `anyarray` (any array), `anynonarray` (any non-array), `anyenum` (any enum), `anyrange` (any range), `anymultirange` (any multirange).
  - Common family (automatic promotion to a common type): `anycompatible`, `anycompatiblearray`, `anycompatiblenonarray`, `anycompatiblerange`, `anycompatiblemultirange`.
- Resolution happens **at parse time** of the calling query.
- Simple-family rules:
  1. All `anyelement` positions must be the same actual type in a given call; likewise all `anyarray` the same array type, all `anyrange` the same range type, all `anymultirange` the same.
  2. If both `anyarray` and `anyelement` appear, the array's element type must equal the `anyelement` type.
  3. `anynonarray` = `anyelement` + constraint "not an array"; `anyenum` = `anyelement` + "must be enum". They are NOT separate type variables: `f(anyelement, anyenum)` is equivalent to `f(anyenum, anyenum)`.
  4. `anyrange`'s subtype must equal the `anyelement` type and the `anyarray` element type; `anymultirange` must contain ranges matching `anyrange` and elements matching `anyelement`/`anyarray`.
  5. A polymorphic result requires at least one polymorphic argument. `anyarray` can be deduced from `anyelement` and vice versa, **but an `anyrange` result requires an `anyrange` argument** (multiple range types may share a subtype).
  - Examples: `equal(anyelement, anyelement)`; `subscript(anyarray, integer) returns anyelement`; `f(anyarray) returns anyenum` accepts only arrays of enums.
- Common-family rules: argument types need not be identical so long as they can be implicitly cast to one common type, selected by the same rules as `UNION` (Section 10.5). Considers actual types of `anycompatible`/`anycompatiblenonarray`, element types of `anycompatiblearray`, subtypes of `anycompatiblerange`/`anycompatiblemultirange`. Args are then auto-cast. Because a range type cannot be chosen from its subtype alone, all `anycompatiblerange`/`anycompatiblemultirange` args must have the same actual range type whose subtype equals the chosen common type (no casting of ranges); a result of those types requires such an argument.
- There is **no `anycompatibleenum`** (no implicit casts to enums, so no way to resolve a common type).
- Families are independent: `myfunc(a anyelement, b anyelement, c anycompatible, d anycompatible) RETURNS anycompatible` — a,b identical type; c,d promotable; result = common type of c,d.
- Variadic polymorphism: last parameter `VARIADIC anyarray` or `VARIADIC anycompatiblearray`; for matching it behaves as N `anynonarray` / `anycompatiblenonarray` parameters.

### Function kinds, procedures, routines  [M6]  (source: xfunc.txt, xproc.txt, xfunc-pl.txt, xfunc-internal.txt)
- Four kinds of functions: (1) query-language (SQL) functions, (2) procedural-language functions (PL/pgSQL, PL/Tcl, ...), (3) internal functions, (4) C-language functions.
- Every kind can take base and composite types as arguments, return base or composite, and return sets. Pseudo-type support varies by kind.
- Tutorial examples: `src/tutorial/funcs.sql`, `funcs.c`.
- **Procedures vs functions**:
  1. Created with `CREATE PROCEDURE`, not `CREATE FUNCTION`.
  2. No function value, hence no `RETURNS` clause; data returned through output parameters.
  3. A function is called as part of a query/DML; a procedure is called in isolation with `CALL`.
  4. A procedure can **commit or roll back transactions during execution (then automatically beginning a new transaction), so long as the invoking `CALL` is not part of an explicit transaction block**. A function cannot.
  5. Certain function attributes (e.g. strictness) do not apply to procedures.
- Functions + procedures = **routines**; `ALTER ROUTINE` / `DROP ROUTINE` work on either. **There is no `CREATE ROUTINE`.**
- Procedural languages are not built into the server; they are offered by loadable modules.
- **Internal functions**: C functions statically linked into the server. Body = C-language name (need not match SQL name; an empty body means same as SQL name, for backward compatibility). Declared with `LANGUAGE internal`. Normally all are declared at cluster initialization (initdb) but users can create aliases: `CREATE FUNCTION square_root(double precision) RETURNS double precision AS 'dsqrt' LANGUAGE internal STRICT;`. Most internal functions expect to be declared strict. Not all predefined functions are internal — some are written in SQL.

### SQL-language functions  [M6, M3]  (source: xfunc-sql.txt)
- Body = list of SQL statements separated by semicolons (trailing semicolon optional); returns result of the **last** query. Non-set case: **first row** of the last query (not well-defined without `ORDER BY`); **no rows => NULL**.
- Unless declared `RETURNS void`, the last statement must be `SELECT`, or `INSERT`/`UPDATE`/`DELETE`/`MERGE` **with `RETURNING`**.
- Allowed: SELECT, data-modifying queries, other SQL commands. **Not allowed: transaction control (`COMMIT`, `SAVEPOINT`) and some utility commands (`VACUUM`)**.
- `RETURNS void` function vs procedure: "mostly stylistic" in simple cases; procedures add transaction control and are SQL-standard, whereas returning void is a PostgreSQL extension.
- Body is a string constant; dollar quoting is most convenient; with single quotes you must double `'` and `\` (escape-string syntax).
- NOTE: this page (36.5) does not itself describe SQL-function *inlining* or the `BEGIN ATOMIC` SQL-standard body; planner-side inlining appears in 36.11 (support functions) and CREATE FUNCTION reference (other slices). Relevant here: volatility labelling and `LANGUAGE SQL` single-SELECT bodies are what the planner can inline.
- **Arguments (36.5.1)**: referenced by name or `$n`. If an argument name equals a column name in the current command, **the column name takes precedence**; override with `function_name.argument_name` (if that still collides with a qualified column name, the column wins again — use a different table alias). `$1` works whether or not named. Composite args: `argname.fieldname` / `$1.fieldname`. Arguments are **data values only, never identifiers** (`INSERT INTO $1 VALUES (42)` fails). Named-argument references added in 9.2.
- **Base types (36.5.2)**: column alias inside the body is not visible outside (result column is named after the function). If the final SELECT/RETURNING does not return exactly the declared type, PostgreSQL auto-casts **only if an implicit or assignment cast exists**; otherwise explicit cast needed.
- Example bank debit: `CREATE FUNCTION tf1 (accountno integer, debit numeric) RETURNS numeric AS $$ UPDATE bank SET balance = balance - debit WHERE accountno = tf1.accountno RETURNING balance; $$ LANGUAGE SQL;`
- **Composite types (36.5.3)**: `double_salary(emp)`; call with `emp.*` (bare `emp` works but is deprecated). `ROW(name, salary*1.1, age, cubicle)` builds an argument on the fly. Returning a composite: select-list order must **exactly** match the composite's column order (names irrelevant); each expression must be castable by implicit/assignment cast, else `ERROR: return type mismatch in function declared to return emp / DETAIL: Final statement returns text instead of point at column 4.` Alternative: `SELECT ROW('None', 1000.0, 25, '(2,2)')::emp;` (single composite column) — required form when returning a **domain over composite**.
- Calling: `SELECT new_emp();` (one composite column) vs `SELECT * FROM new_emp();` (expanded). Field extraction needs parentheses: `SELECT (new_emp()).name;` (`new_emp().name` is a syntax error) or functional notation `name(new_emp())`.
- **Output parameters (36.5.4)**: `CREATE FUNCTION sum_n_product (x int, y int, OUT sum int, OUT product int) AS 'SELECT x + y, x * y' LANGUAGE SQL;` creates an anonymous composite result; OUT names become column names. **Only input parameters define the calling signature** (drop with `DROP FUNCTION sum_n_product(int, int)`). Modes: `IN` (default), `OUT`, `INOUT`, `VARIADIC`.
- **Procedures with OUT params (36.5.5)**: in `CALL`, output parameters **must be included** in the argument list; customary to write `NULL` (`CALL tp1(17, 100.0, NULL);`); any other expression must be implicitly coercible but **is not evaluated**. From PL/pgSQL you must pass a variable.
- **VARIADIC (36.5.6)**: last parameter marked `VARIADIC`, must be an array type; all optional args same type; gathered into a one-dimensional array. A VARIADIC parameter matches **one or more** occurrences of its element type (so `mleast()` fails; `mleast(ARRAY[...])` doesn't match). Pass a prebuilt array with `VARIADIC` in the call: `SELECT mleast(VARIADIC ARRAY[10, -1, 5, 4.4]);` — this is also the only secure way to call a variadic function in a schema where untrusted users can create objects, and the only way to pass an empty array (`VARIADIC ARRAY[]::numeric[]`). Named notation works only with VARIADIC: `mleast(VARIADIC arr => ARRAY[...])`.
- **Defaults (36.5.7)**: `CREATE FUNCTION foo(a int, b int DEFAULT 2, c int DEFAULT 3)`; all parameters after one with a default must also have defaults; `=` may replace `DEFAULT`. `foo()` => `ERROR: function foo() does not exist`.
- **Table sources (36.5.8)**: any SQL function can be used in FROM; base-type result => one-column table; composite => one column per attribute. Without `SETOF` only one row comes back.
- **Set-returning functions (36.5.9)**: `RETURNS SETOF sometype`: final query executed to completion, each row returned. With OUT params write `RETURNS SETOF record` (or the single OUT param's type). Preferred invocation is `LATERAL` in FROM.
  - SRFs in the select list: for each row the SRF is invoked, an output row generated per element; empty set => no row (like inner join). "Almost exactly" the same as a LATERAL FROM item, except select-list SRFs are **always evaluated as if on the inside of a nested-loop join** with the rest of FROM (run to completion before the next FROM row).
  - Multiple SRFs in one select list behave like a single `LATERAL ROWS FROM( ... )` item: run **in lockstep**, shorter ones padded with NULLs; row count = the longest.
  - SRFs may be nested in the select list (not allowed in FROM items); each nesting level is a separate `LATERAL ROWS FROM` item: in `SELECT srf1(srf2(x), srf3(y)), srf4(srf5(z)) FROM tab;` srf2/srf3/srf5 run in lockstep per row, then srf1/srf4 in lockstep per lower row.
  - **SRFs cannot be used within conditional-evaluation constructs (CASE, COALESCE)** — parse-time error.
  - If the last command is INSERT/UPDATE/DELETE/MERGE ... RETURNING it is **always executed to completion** even if not SETOF or not all rows are fetched; extra rows silently dropped.
  - Before PG 10: multiple SRFs produced LCM-of-row-counts rows; nested SRFs and CASE behaved differently.
- **RETURNS TABLE (36.5.10)**: equivalent to OUT params + `SETOF record` (or SETOF single type); SQL-standard; explicit OUT/INOUT not allowed with it.
- **Polymorphic SQL functions (36.5.11)**: `make_array(anyelement, anyelement) RETURNS anyarray AS $$ SELECT ARRAY[$1, $2]; $$`; string literals need a cast (`'a'::text`) else `ERROR: could not determine polymorphic type because input has type unknown`; `make_array(1, 2.5)` => `function make_array(integer, numeric) does not exist`. `make_array2(anycompatible, anycompatible) RETURNS anycompatiblearray` accepts `(1, 2.5)` => `{1,2.5}` and `('a','b')` (unknowns default to text). Polymorphic args with fixed result OK; converse not: `RETURNS anyelement` with no polymorphic input => `ERROR: cannot determine result data type`. Works with OUT args (`dup(f1 anyelement, OUT f2 anyelement, OUT f3 anyarray)`) and variadics (`anyleast(VARIADIC anyarray)`, `concat_values(text, VARIADIC anyarray)`).
- **Collations (36.5.12)**: a collation is identified per call from the actual arguments (Section 23.2); if successful all collatable parameters implicitly have it. `anyleast('abc'::text, 'ABC')` => `ABC` in C locale, `abc` in many others; force with `COLLATE "C"` on an argument or inside the body (which errors for non-collatable types). If no common collation, parameters use their data type's default collation. "A limited form of polymorphism, applicable only to textual data types."

### Function overloading  [M6]  (source: xfunc-overload.txt)
- Same SQL name allowed if argument types differ; resolution by number and types of args (Chapter 10). Security precautions apply in databases with mutually distrusting users (Section 10.3).
- Avoid ambiguous families such as `test(int, real)` vs `test(smallint, double precision)` for `test(1, 1.5)`.
- A single-composite-argument function should not share a name with an attribute of that type: `attribute(table)` ≡ `table.attribute`, and **the attribute always wins**; override via schema-qualification `schema.func(table)`.
- Variadic vs non-variadic (`foo(numeric)` vs `foo(VARIADIC numeric[])`): the function **earlier in the search path** wins; in the same schema the **non-variadic** one is preferred.
- C functions: each C name in an overloaded family must be distinct from all other C names (internal or loaded), else non-portable behaviour (linker error or the internal one gets called). Use `AS 'filename', 'test_1arg'` link-symbol form.

### Function volatility categories  [M6, M4, M5]  (source: xfunc-volatility.txt)
- Three classes: `VOLATILE` (default), `STABLE`, `IMMUTABLE`. It is "a promise to the optimizer".
- **VOLATILE**: can do anything incl. modify the database; may return different results on successive calls with the same args; optimizer makes no assumptions; **re-evaluated at every row** where the value is needed.
- **STABLE**: cannot modify the database; same result for same args **for all rows within a single statement**; optimizer may collapse multiple calls to one; **safe in an index scan condition** (an index scan evaluates the comparison value once — so a VOLATILE function is not valid there).
- **IMMUTABLE**: cannot modify the database; same result for same args **forever**; optimizer may **pre-evaluate with constant arguments** (constant folding: `WHERE x = 2 + 2` -> `x = 4` because integer addition's function is IMMUTABLE).
- Label with the strictest valid category. Any function with side effects must be VOLATILE; also functions whose value can change within one query: `random()`, `currval()`, `timeofday()`.
- `current_timestamp` family is **STABLE** (values don't change within a transaction).
- STABLE vs IMMUTABLE matters little for immediately-executed queries but a lot for **saved plans**: wrongly IMMUTABLE functions may be folded to a constant at plan time and a stale value reused (prepared statements, PL/pgSQL cached plans).
- **Snapshot behaviour** (SQL and standard PLs): a VOLATILE function **sees data changes made so far by the calling SQL command** and obtains a **fresh snapshot at the start of each query it executes**; STABLE and IMMUTABLE functions use the **snapshot established at the start of the calling query**, and do not see the caller's changes. C functions can manage snapshots however they want (recommended to follow suit).
- So a SELECT-only function can safely be STABLE even on concurrently modified tables.
- Selecting from tables in an IMMUTABLE function is "generally unwise" (not enforced).
- Common error: IMMUTABLE on functions depending on a GUC such as `TimeZone` — label STABLE.
- Enforcement: STABLE and IMMUTABLE functions may contain **no SQL commands other than SELECT**; not bulletproof — they may call VOLATILE functions that modify data, but then will not see those changes (hidden from their snapshot).

### C-language functions: loading, magic block, version-1 convention  [M6, M2, M1]  (source: xfunc-c.txt)
- C functions are compiled into dynamically loadable objects (shared libraries), loaded on demand. Dynamic loading is the only thing distinguishing "C language" from "internal" functions; coding conventions are the same. Only one calling convention exists: **version 1**, marked by `PG_FUNCTION_INFO_V1(funcname);`.
- **Dynamic loading**: object file is loaded the first time one of its functions is called **in a session**. `CREATE FUNCTION` gives the object file name and the C link symbol (defaults to the SQL name). File lookup algorithm:
  1. Absolute path -> load that file.
  2. Starts with `$libdir` -> replaced by the package library directory (build-time; shown by `pg_config --pkglibdir`).
  3. No directory part -> searched in `dynamic_library_path`.
  4. Otherwise (not found / relative directory part) -> name tried as given (unreliable: depends on cwd).
  5. If all fail, the platform shared-library extension (often `.so`) is appended and the sequence retried.
- The file name is recorded **literally** in the catalog. Recommended: `$libdir`-relative or via dynamic library path. Server OS user must be able to traverse the path.
- PostgreSQL never compiles C for you.
- **Magic block**: exactly one source file must contain `PG_MODULE_MAGIC;` (after `#include "fmgr.h"`), or `PG_MODULE_MAGIC_EXT(.name = "my_module_name", .version = "1.2.3");` (name and/or version; inspect with `pg_get_loaded_modules()`; semantic versioning recommended). Detects e.g. code compiled for a different major version.
- A loaded file stays in memory for the session (subsequent calls cost only a symbol lookup); to reload after recompiling, start a fresh session. Optional `_PG_init` (no params, returns void) is called immediately after loading. **There is presently no way to unload** a library.
- **Base type internal formats** (PostgreSQL sees a base type as a "blob of memory"):
  1. pass by value, fixed-length — only **1, 2, or 4 bytes (also 8 if `sizeof(Datum)` is 8)**.
  2. pass by reference, fixed-length (any size; e.g. `typedef struct { double x, y; } Point;` = 16 bytes).
  3. pass by reference, variable-length — must begin with an opaque **4-byte length field** set with `SET_VARSIZE` (never directly); the length **includes the length field itself**; data follows immediately. `VARHDRSZ` == `sizeof(int32)`.
- C `int32` = SQL `int4`; **C `int8` is 1 byte, SQL `int8` is C `int64`**. `long` is dangerous (4 or 8 bytes).
- `typedef struct { int32 length; char data[FLEXIBLE_ARRAY_MEMBER]; } text;` — storing 40 bytes: `palloc(VARHDRSZ + 40); SET_VARSIZE(destination, VARHDRSZ + 40); memcpy(destination->data, buffer, 40);`
- Zero all padding bits (memset / `palloc0`): otherwise logically equal constants may look unequal to the planner (which sometimes compares constants bitwise) and hashing (hash indexes, hash joins) becomes hard.
- **WARNING: never modify a pass-by-reference input value** — the pointer may point directly into a disk buffer => on-disk corruption. Sole exception: aggregate transition state (36.12).
- **Table 36.2 SQL type -> C type (header)**: boolean -> `bool` (postgres.h); box -> `BOX*` (utils/geo_decls.h); bytea -> `bytea*` (postgres.h); "char" -> `char`; character -> `BpChar*` (postgres.h); cid -> `CommandId` (postgres.h); date -> `DateADT` (utils/date.h); float4 -> `float4`; float8 -> `float8`; int2 -> `int16`; int4 -> `int32`; int8 -> `int64` (all postgres.h); interval -> `Interval*` (datatype/timestamp.h); lseg -> `LSEG*`; name -> `Name` (postgres.h); numeric -> `Numeric` (utils/numeric.h); oid -> `Oid`; oidvector -> `oidvector*`; path -> `PATH*`; point -> `POINT*` (utils/geo_decls.h); regproc -> `RegProcedure`; text -> `text*`; tid -> `ItemPointer` (storage/itemptr.h); time -> `TimeADT`; time with time zone -> `TimeTzADT` (utils/date.h); timestamp -> `Timestamp`; timestamptz -> `TimestampTz` (datatype/timestamp.h); varchar -> `VarChar*`; xid -> `TransactionId` (postgres.h). Always include `postgres.h` first.
- **Version-1 convention**: `Datum funcname(PG_FUNCTION_ARGS)` + `PG_FUNCTION_INFO_V1(funcname);` in the same file (not needed for internal functions). Args via `PG_GETARG_xxx(n)` (0-based), result via `PG_RETURN_xxx(v)`; null checks with `PG_ARGISNULL(n)` (needed only if not STRICT; do not call GETARG before checking), `PG_RETURN_NULL()`.
- Calling other functions: `DirectFunctionCalln(func, ...)` (C name), `OidFunctionCalln` (OID); args/results are Datums and **may not be NULL**. Collation-sensitive functions need `DirectFunctionCall2Coll(text_starts_with, PG_GET_COLLATION(), ...)` else "could not determine which collation to use for string comparison".
- Varlena macros shown: `PG_GETARG_TEXT_PP`, `VARSIZE_ANY_EXHDR(t)` (size minus `VARHDRSZ` or `VARHDRSZ_SHORT`), `VARDATA`, `VARDATA_ANY` (source may be a short datum), `DatumGetTextPP`, `PointerGetDatum`.
- `STRICT` = system automatically returns null if any input is null (function not called).
- Variants: `PG_GETARG_xxx_COPY()` (guaranteed writable copy), `PG_GETARG_xxx_SLICE(n, offset, length)` (offset from 0, negative length = rest) — efficient for storage type `external` (`ALTER TABLE t ALTER COLUMN c SET STORAGE {plain|external|extended|main}`).
- V1 is what makes NULLs, TOASTed values, set results, trigger functions and PL call handlers possible. See `src/backend/utils/fmgr/README`.
- **Coding rules**: `pg_config --includedir-server` for headers; use `palloc`/`pfree` (palloc'd memory freed automatically at **end of each transaction**); zero structs; include `postgres.h` (brings `elog.h`, `palloc.h`) and `fmgr.h`; symbol names must not conflict with server symbols.
- **Compile/link** (PIC + shared): Linux/FreeBSD `cc -fPIC -c foo.c; cc -shared -o foo.so foo.o`; macOS `cc -c foo.c; cc -bundle -flat_namespace -undefined suppress -o foo.so foo.o`; NetBSD `gcc -fPIC` + `gcc -shared` (old non-ELF: `ld -Bshareable`); OpenBSD `gcc -fPIC` + `ld -Bshareable`; Solaris `cc -KPIC` + `cc -G` (or gcc `-fPIC` + `-G`). Omit the `.so` extension in CREATE FUNCTION for portability.
- **API/ABI stability (36.10.6)**: well-demarcated APIs = fmgr, SPI, hooks. API (compile time): no compatibility promise across major versions (`#if PG_VERSION_NUM >= 160000`); effort to avoid breaks in minor releases. ABI (run time): major versions intentionally incompatible (must recompile; `PG_MODULE_MAGIC` enforces); minor releases try to avoid breaks, using least-invasive changes (new field in padding or appended to struct end); not a guarantee, but breaks "extremely rare".
- **Composite arguments**: `HeapTupleHeader t = PG_GETARG_HEAPTUPLEHEADER(0); salary = GetAttributeByName(t, "salary", &isnull);` (also `GetAttributeByNum`); always check the null flag.
- **Returning rows** (`funcapi.h`): get a TupleDesc via `get_call_result_type(fcinfo, &resultTypeId, &resultTupleDesc)` (expect `TYPEFUNC_COMPOSITE`; also resolves polymorphic results; siblings `get_expr_result_type`, `get_func_result_type`; deprecated `RelationNameGetTupleDesc`, `TypeGetTupleDesc`). Datum path: `BlessTupleDesc` + `heap_form_tuple(tupdesc, values, isnull)`. C-string path: `TupleDescGetAttInMetadata` + `BuildTupleFromCStrings(attinmeta, values)` (NULL pointer = null). Convert with `HeapTupleGetDatum(tuple)`.
- **Returning sets**: two modes.
  - **ValuePerCall**: function called repeatedly with the same args, one row per call, NULL signals done; must keep state. Query may **not run to completion** (LIMIT) so cleanup in the last call is unsafe.
  - **Materialize**: fills and returns a tuplestore with the whole result in one call (recommended when external resources such as file descriptors are involved).
  - `FuncCallContext` fields: `uint64 call_cntr`, `uint64 max_calls` (optional), `void *user_fctx`, `AttInMetadata *attinmeta`, `MemoryContext multi_call_memory_ctx`, `TupleDesc tuple_desc`; pointer stored in `fcinfo->flinfo->fn_extra`.
  - Macros: `SRF_IS_FIRSTCALL()`, `SRF_FIRSTCALL_INIT()`, `SRF_PERCALL_SETUP()`, `SRF_RETURN_NEXT(funcctx, result)`, `SRF_RETURN_DONE(funcctx)`. The per-call memory context is transient (cleared between calls); cross-call data goes in `multi_call_memory_ctx`. Detoasted args kept across calls must be copied there.
- **Polymorphic C functions**: `get_fn_expr_rettype(FmgrInfo *flinfo)`, `get_fn_expr_argtype(flinfo, argnum)` (0-based; `InvalidOid` if unknown), `get_fn_expr_variadic`. C-only pseudo-type `"any"` (double-quoted): like anyelement but no same-type constraint and no result-type inference. `VARIADIC "any"`: one or more args of any types, **not gathered into an array**; use `PG_NARGS()`.
- **Shared memory at startup**: library must be in `shared_preload_libraries`; register `shmem_request_hook` in `_PG_init`, call `void RequestAddinShmemSpace(Size size)`; each backend gets it with `void *ShmemInitStruct(const char *name, Size size, bool *foundPtr)` under `LWLockAcquire(AddinShmemInitLock, LW_EXCLUSIVE)`. `shmem_startup_hook` is a convenient place; on Windows/`EXEC_BACKEND` every backend runs it, elsewhere only the postmaster does and backends inherit pointers. Example: `contrib/pg_stat_statements`.
- **Shared memory after startup**: `void *GetNamedDSMSegment(const char *name, size_t size, void (*init_callback)(void *ptr), bool *found)` — DSM registry; no lock needed.
- **LWLocks**: at startup `void RequestNamedLWLockTranche(const char *tranche_name, int num_lwlocks)` then `LWLockPadded *GetNamedLWLockTranche(const char *tranche_name)`. After startup: `int LWLockNewTrancheId(void)`, `void LWLockInitialize(LWLock *lock, int tranche_id)`, `void LWLockRegisterTranche(int tranche_id, const char *tranche_name)` (example `contrib/pg_prewarm/autoprewarm.c`).
- **Custom wait events**: `uint32 WaitEventExtensionNew(const char *wait_event_name)` under wait event type `Extension`; visible in `pg_stat_activity` (`wait_event_type = Extension`, e.g. `WorkerSpiMain`).
- **Injection points**: `INJECTION_POINT(name, arg);` (names lower-case, dash-separated); for critical sections `INJECTION_POINT_LOAD(name);` then `INJECTION_POINT_CACHED(name, arg);`; attach with `InjectionPointAttach(name, library, function, private_data, private_data_size)`, detach with `bool InjectionPointDetach(name)`; `IS_INJECTION_POINT_ATTACHED("...")` under `#ifdef USE_INJECTION_POINTS`; `WaitEventInjectionPointNew(name)`. Requires `--enable-injection-points` (configure) or `-Dinjection_points=true` (Meson). Attached callbacks apply to all backends until detach/restart.
- **Custom cumulative statistics**: define a `PgStat_KindInfo` (`.name`, `.fixed_amount`, `.shared_size`, `.shared_data_off`, `.shared_data_len`, `.pending_size`), register per backend with `pgstat_register_kind(kind, &kind_info)`; use `PGSTAT_KIND_EXPERIMENTAL` during development; module must be in `shared_preload_libraries`. API in `src/include/utils/pgstat_internal.h`.
- **C++**: backend-facing functions need `extern "C"` linkage; free with the matching allocator (`pfree` for `palloc`); never let exceptions propagate into C (catch-all at top of each extern C function, or `-fno-exceptions`); when calling backend functions keep only POD on the C++ stack because backend errors do a distant `longjmp()`.

### Function optimization information / planner support functions  [M4, M6]  (source: xfunc-optimization.txt)
- By default a function is a "black box" to the planner. Declarative annotations on `CREATE FUNCTION`: volatility (`IMMUTABLE`/`STABLE`/`VOLATILE`), parallel safety (`PARALLEL UNSAFE` / `PARALLEL RESTRICTED` / `PARALLEL SAFE` — required for use in parallel queries), estimated execution `COST`, estimated `ROWS` for SRFs (constants only).
- **Planner support function**: C function with SQL signature `supportfn(internal) returns internal`, attached with the `SUPPORT` clause of the target function. API in `src/include/nodes/supportnodes.h`. Request types:
  - `SupportRequestSimplify` — replace a call with a simpler parse tree at plan time (illustrative: `int4mul(n, 1)` -> `n`; also applies to operators built on the function; not actually done by core). Must be rigorously equivalent.
  - `SupportRequestSelectivity` — selectivity estimate for boolean functions in WHERE.
  - `SupportRequestCost` — non-constant cost.
  - `SupportRequestRows` — non-constant row estimate for SRFs.
  - `SupportRequestIndexCondition` — convert a boolean function call in WHERE into indexable operator clause(s); may be **lossy** (index returns a superset; the function is rechecked per row).

### User-defined aggregates  [M3, M6, M4]  (source: xaggr.txt)
- Model: a **state value** + **state transition function** (`sfunc(prev_state, input...) -> new_state`), an initial state (`initcond`), optional **final function** (`finalfunc(state) -> result`). Three types involved: argument type(s), result type, internal state type (`stype`).
- `CREATE AGGREGATE sum (complex) (sfunc = complex_add, stype = complex, initcond = '(0,0)');` — returns `(0,0)` on no non-null input.
- **Omit `initcond`** => initial state is NULL. If the state is NULL and the transition function is **strict**, PostgreSQL automatically puts the **first non-null input into the state** and starts calling the sfunc from the second non-null input (how sum/max/min return NULL on empty input, as the SQL standard expects).
- Strict sfunc also means **null inputs are skipped** (state retained). For other null handling, make the sfunc non-strict and test explicitly.
- Built-in `avg(float8)`: `sfunc = float8_accum, stype = float8[], finalfunc = float8_avg, initcond = '{0,0,0}'` — three elements because `float8_accum` tracks count, sum, **and sum of squares** (shared with other aggregates).
- `DISTINCT` and `ORDER BY` inside the aggregate call are implemented behind the scenes, not by support functions.
- **Moving-aggregate mode (36.12.1)**: for window frames with moving start; supply an **inverse transition function** (`minvfunc`) that removes the earliest row from the state. Without it the aggregate is recomputed from scratch each time the frame start moves: runtime ∝ rows × average frame length; with it ∝ rows. Separate implementation: `msfunc`, `minvfunc`, `mstype`, `minitcond` (+ `mfinalfunc`). Example: `msfunc = complex_add, minvfunc = complex_sub, mstype = complex, minitcond = '(0,0)'`.
  - The moving forward transition function **may not return NULL**. If the inverse function returns NULL it means "cannot reverse this input" => aggregate recomputed from scratch for the current frame start (lets it "punt", e.g. on removing a NaN).
  - The inverse must reconstruct state **exactly**. Counter-example `unsafe_sum(float8)` (`sfunc = float8pl, msfunc = float8pl, minvfunc = float8mi`): `unsafe_sum(x) OVER (ORDER BY n ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING)` on `(1, 1.0e20), (2, 1.0)` returns **0** as second result instead of 1 (1e20 + 1 = 1e20; minus 1e20 = 0).
- **Polymorphic aggregates (36.12.2)**: `CREATE AGGREGATE array_accum (anycompatible) (sfunc = array_append, stype = anycompatiblearray, initcond = '{}');`. A polymorphic-result aggregate ordinarily needs a polymorphic state type; with `stype = internal` use **`finalfunc_extra`**: final function receives extra dummy (always NULL) args matching the aggregate inputs so its result type can be deduced — e.g. built-in `array_agg (anynonarray)`: `sfunc = array_agg_transfn(internal, anynonarray) returns internal`, `finalfunc = array_agg_finalfn(internal, anynonarray) returns anyarray`, `finalfunc_extra`.
- **Variadic aggregates**: last arg a `VARIADIC` array; transition function must have the same array type as last arg. Pitfall: everything right of `ORDER BY` is a sort key — `myaggregate(a ORDER BY a, b, c)` (1 arg, 3 sort keys) vs `myaggregate(a, b, c ORDER BY a)`; both valid if variadic. Same reason: avoid same-named aggregates with different numbers of regular args.
- **Ordered-set aggregates (36.12.3)**: have **direct arguments** (evaluated once per aggregation) and aggregated arguments with a mandatory sort (`WITHIN GROUP (ORDER BY ...)`). Built-in `percentile_disc`: `CREATE AGGREGATE percentile_disc (float8 ORDER BY anyelement) (sfunc = ordered_set_transition, stype = internal, finalfunc = percentile_disc_final, finalfunc_extra);` used as `SELECT percentile_disc(0.5) WITHIN GROUP (ORDER BY income) FROM households;`.
  - Sorting is **the support functions' job** (state holds a "tuplesort" object; final function finishes the sort, can inject "hypothetical" rows). Generally must be written in C (state `internal`). Final function is therefore not `READ_ONLY`: declare `READ_WRITE`, or `SHAREABLE` if further final calls can reuse the sorted state.
  - Transition function gets state + aggregated inputs (not the direct args); final function gets state, direct args, and (with `finalfunc_extra`) NULLs for the aggregated inputs.
  - **Ordered-set aggregates cannot currently be used as window functions.**
- **Partial aggregation (36.12.4)**: run sfunc over subsets independently, then merge states with a **combine function** `combinefunc(state, state) -> state` — basis of **parallel aggregation**. Relative row order of the two sets is unspecified, so order-sensitive aggregates usually cannot have one. MAX/MIN: combine = same greater/lesser function; SUM: addition.
  - Combine function follows the same null/strict rules as a transition function. A non-null `initcond` is also used as the **initial state for combining**.
  - If `stype = internal`: the combine function must allocate its result in the aggregate-state memory context (when first input is NULL you cannot just return the second). Also provide **`serialfunc`** `(internal) -> bytea` and **`deserialfunc`** `(bytea, internal) -> internal` (second arg unused, always zero) so state can cross processes; without them parallel aggregation is impossible.
  - For parallel execution the **aggregate itself must be marked `PARALLEL SAFE`**; support functions' markings are not consulted.
- **C support (36.12.5)**: `AggCheckCallContext(fcinfo, NULL)` detects aggregate context => the first input is a temporary state that may be **modified in place** (e.g. `int8inc()`); second arg retrieves the aggregate state memory context (for expanded objects; see `array_append()`). Final functions modifying state must declare it in CREATE AGGREGATE. `AggGetAggref` returns the `Aggref` node (used by ordered-set aggregates; `orderedsetaggs.c`).

### User-defined base types & TOAST considerations  [M2, M6]  (source: xtypes.txt)
- Examples in `src/tutorial/complex.sql` / `complex.c`. A base type **must have input and output functions**: input takes a null-terminated C string (`cstring`) -> internal form; output is the inverse. They must be exact inverses (dump/restore; floats are the classic trap).
- `typedef struct Complex { double x; double y; } Complex;` — 16 bytes, pass-by-reference (too big for a Datum); text form `(x,y)`.
- Optional binary I/O: receive `complex_recv(internal) returns complex` (reads a `StringInfo` with `pq_getmsgfloat8`), send `complex_send(complex) returns bytea` (`pq_begintypsend`, `pq_sendfloat8`, `pq_endtypsend`). Binary I/O is faster but less portable.
- Creation sequence: (1) `CREATE TYPE complex;` (**shell type** placeholder), (2) create I/O functions `complex_in(cstring) RETURNS complex`, `complex_out(complex) RETURNS cstring`, recv/send — all `LANGUAGE C IMMUTABLE STRICT`, (3) `CREATE TYPE complex (internallength = 16, input = complex_in, output = complex_out, receive = complex_recv, send = complex_send, alignment = double);`.
- An array type is created automatically, named with a prepended underscore (`_complex`).
- Variable-length types: first four bytes are a `char[4]` field never accessed directly (customarily `vl_len_`); use `SET_VARSIZE()` / `VARSIZE()` (the length may be encoded platform-dependently; total size includes the length field).
- **TOAST-able types**: desirable for any varying-size type, even small ones (TOAST reduces header overhead too). Functions must detoast with `PG_DETOAST_DATUM` (hidden in `GETARG_DATATYPE_P` macros); in CREATE TYPE specify `internallength = variable` and a storage option other than `plain`.
- If alignment doesn't matter use `PG_DETOAST_DATUM_PACKED` (`GETARG_DATATYPE_PP`) with `VARSIZE_ANY_EXHDR` / `VARDATA_ANY`; data is then **not aligned**.
- Declaring `vl_len_` as `int32` is OK only if the struct has other >= int32-aligned fields; dangerous with potentially unaligned datums (core dumps on strict-alignment architectures).
- **Expanded in-memory representation**: flat varlena is a pointer-free blob; a type may define an expanded format (rules in `src/include/utils/expandeddatum.h`) with expand/flatten functions. `PG_DETOAST_DATUM` flattens expanded inputs, so old functions keep working. `VARATT_IS_EXPANDED_HEADER()` distinguishes formats. Pointers to expanded values are **read-write** (may modify in place; must leave sane state on failure) or **read-only** (must copy first). A function constructing a new expanded value returns a read-write pointer. Example: `src/backend/utils/adt/array_expanded.c`.

### User-defined operators & operator optimization clauses  [M4, M6]  (source: xoper.txt, xoper-optimization.txt)
- An operator is "syntactic sugar" for a function call **plus planner information**. Prefix and infix operators supported (no postfix); operators can be overloaded by operand number/types.
- `CREATE OPERATOR + (leftarg = complex, rightarg = complex, function = complex_add, commutator = +);` Omit `leftarg` for a prefix operator. Only `function` and the argument clauses are required.
- Optimization clauses (all that 18.7 understands): `COMMUTATOR`, `NEGATOR`, `RESTRICT`, `JOIN`, `HASHES`, `MERGES`. Wrong clauses => "slow queries, subtly wrong output, or other Bad Things"; omitting is always safe.
- **COMMUTATOR**: A is commutator of B if `(x A y) = (y B x)` for all x,y. `<`/`>` are each other's; `+` is its own; `-` has none. Only the name is needed (operand types swap). Critical for indexes and joins: for `tab1.x = tab2.y` with index on `tab2.y`, the planner must flip to `tab2.y = tab1.x` because index-scan machinery expects the indexed column on the left; it will not assume validity.
- **NEGATOR**: A is negator of B if both return boolean and `(x A y) = NOT (x B y)`. `<` / `>=` are a pair. An operator can never be its own negator. Unary operator pairs can be negators. Enables `NOT (x = y)` -> `x <> y`.
- **RESTRICT**: restriction selectivity estimator function (a function name) for `column OP constant`; binary boolean operators only. Standard estimators: `eqsel` (=), `neqsel` (<>), `scalarltsel` (<), `scalarlesel` (<=), `scalargtsel` (>), `scalargesel` (>=). `eqsel`/`neqsel` usable for any very-high/low-selectivity operator. Scalar ones need the type known to `convert_to_scalar()` in `src/backend/utils/adt/selfuncs.c`. `matchingsel` works for almost any binary operator if MCV/histogram stats exist; its default estimate is **twice the default of `eqsel`** (or call `generic_restriction_selectivity`). Geometric stubs: `areasel`, `positionsel`, `contsel` (`geo_selfuncs.c`).
- **JOIN**: join selectivity estimator for `table1.column1 OP table2.column2`. Standard: `eqjoinsel`, `neqjoinsel`, `scalarltjoinsel`, `scalarlejoinsel`, `scalargtjoinsel`, `scalargejoinsel`, `matchingjoinsel`, `areajoinsel`, `positionjoinsel`, `contjoinsel`.
- **HASHES**: operator may be used for **hash join**; must be an equality. Hash join assumes true only for values hashing to the same code. Must appear in a **hash index operator family** (not enforced at creation; hash join fails at run time otherwise). Hash functions must ignore pad bits (or keep them zero — recommended) and hash IEEE −0 and +0 identically. Must have a commutator in the same family. Underlying function must be **immutable or stable** (volatile => never hash-joined). If strict, the function must be **complete** (true/false, never null, for non-null inputs) or hashed `IN` may give wrong results.
- **MERGES**: operator may be used for **merge join**; must behave as equality over fully orderable types (cross-type OK, e.g. smallint vs integer). Must appear as an **equality member of a btree operator family** (flag is a hint to look for one). Needs a commutator in the same family; underlying function immutable or stable.

### Operator classes, operator families, strategies & support functions  [M4, M6]  (source: xindex.txt)
- To index a new type you must define an **operator class** for an index access method (custom AMs via `CREATE ACCESS METHOD`, ch.63). Index method routines know nothing about data types; the operator class supplies (a) the WHERE-clause **search operators** usable with the index and (b) **support functions** used internally.
- Multiple opclasses per (type, AM) are allowed (e.g. complex sorted by absolute value vs by real part); one may be `DEFAULT`. Same opclass name can exist for several AMs (`int4_ops` for btree and hash) — independent objects.
- **Strategy numbers** identify operator semantics (PostgreSQL cannot infer from operator names):
  - Table 36.3 B-tree: `<` = 1, `<=` = 2, `=` = 3, `>=` = 4, `>` = 5.
  - Table 36.4 Hash: `=` = 1.
  - Table 36.5 GiST 2-D "R-tree" (opclass-defined; the `consistent` routine interprets): strictly left of 1, does not extend to right of 2, overlaps 3, does not extend to left of 4, strictly right of 5, same 6, contains 7, contained by 8, does not extend above 9, strictly below 10, strictly above 11, does not extend below 12.
  - Table 36.6 SP-GiST point: strictly left of 1, strictly right of 5, same 6, contained by 8, strictly below 10, strictly above 11.
  - Table 36.7 GIN array: overlap 1, contains 2, is contained by 3, equal 4.
  - Table 36.8 BRIN minmax: `<` 1, `<=` 2, `=` 3, `>=` 4, `>` 5.
  - GiST, SP-GiST, GIN, BRIN have **no fixed strategy set**.
- All index **search operators must return boolean** (must appear at top level of WHERE).
- **Support function numbers**:
  - Table 36.9 B-tree: 1 compare (returns <0, 0, >0) — required; 2 sort support (optional); 3 `in_range` (test value vs base ± offset; optional); 4 `equalimage` — is deduplication safe (optional); 5 options (optional); 6 **skip support** (optional).
  - Table 36.10 Hash: 1 32-bit hash (required); 2 64-bit hash with 64-bit salt — if salt = 0, low 32 bits must equal function 1's result (optional); 3 options (optional).
  - Table 36.11 GiST (12, seven optional): 1 `consistent`, 2 `union`, 3 `compress` (opt), 4 `decompress` (opt), 5 `penalty`, 6 `picksplit`, 7 `same`, 8 `distance` (opt), 9 `fetch` (opt; index-only scans), 10 `options` (opt), 11 `sortsupport` (opt; fast index builds), 12 `translate_cmptype` (opt).
  - Table 36.12 SP-GiST (6, one optional): 1 `config`, 2 `choose`, 3 `picksplit`, 4 `inner_consistent`, 5 `leaf_consistent`, 6 `options` (opt).
  - Table 36.13 GIN (7, four optional): 1 `compare`, 2 `extractValue`, 3 `extractQuery`, 4 `consistent` (boolean; optional if 6 present), 5 `comparePartial` (opt), 6 `triConsistent` (ternary; optional if 4 present), 7 `options` (opt).
  - Table 36.14 BRIN (5 basic, one optional): 1 `opcInfo`, 2 `add_value`, 3 `consistent`, 4 `union`, 5 `options` (opt).
- **Example `complex_abs_ops`** (src/tutorial): write the btree comparison function first and derive the 5 operators as one-line wrappers (`#define Mag(c) ((c)->x*(c)->x + (c)->y*(c)->y)`).
  ```sql
  CREATE OPERATOR < (leftarg = complex, rightarg = complex, procedure = complex_abs_lt,
     commutator = > , negator = >= , restrict = scalarltsel, join = scalarltjoinsel);
  CREATE FUNCTION complex_abs_cmp(complex, complex) RETURNS integer AS 'filename' LANGUAGE C IMMUTABLE STRICT;
  CREATE OPERATOR CLASS complex_abs_ops DEFAULT FOR TYPE complex USING btree AS
      OPERATOR 1 < , OPERATOR 2 <= , OPERATOR 3 = , OPERATOR 4 >= , OPERATOR 5 > ,
      FUNCTION 1 complex_abs_cmp(complex, complex);
  ```
  Only one operator named `=` may exist for (complex, complex); C function names must be globally unique (include the type name).
- **Operator families**: group semantically compatible opclasses + "loose" cross-type operators/support functions. An opclass = the minimum needed for an index on one type (it cannot be dropped without dropping the index; loose members can). Built-in btree family `integer_ops` contains `int8_ops`, `int4_ops`, `int2_ops` each with `OPERATOR 1..5`, `FUNCTION 1 btintNcmp`, `FUNCTION 2 btintNsortsupport(internal)`, `FUNCTION 3 in_range(...)`, `FUNCTION 4 btequalimage(oid)`, `FUNCTION 6 btintNskipsupport(internal)`; cross-type ops added by `ALTER OPERATOR FAMILY integer_ops USING btree ADD OPERATOR 1 < (int8, int2), ... FUNCTION 1 btint82cmp(int8, int2), ...`. Strategy/support numbers may repeat in a family provided input types differ.
- B-tree family: all operators must sort compatibly; each operator needs a support function with the same two input types; completeness recommended. Hash family: hash functions must give the **same hash for values equal across types**, and implicit/binary-coercion casts between family types must not change the hash; one support function per type. GiST/SP-GiST/GIN have no explicit notion of cross-type operations. BRIN minmax: same as btree. (Families exist since 8.3.)
- **System dependencies on opclasses**: `ORDER BY`, `DISTINCT`, `GROUP BY` use the type's **default B-tree opclass** (its `=` defines equality for grouping; its ordering is the default sort). Fallback: default **hash** opclass (grouping only, no sorting). None => "could not identify an ordering operator". Non-default sort: `SELECT * FROM mytable ORDER BY somecol USING ~<~;`. Array comparison of a user type relies on the default btree opclass too. `RANGE offset PRECEDING/FOLLOWING` window frames need the opclass's **`in_range`** support function (several allowed for different offset types). An equality operator in a hash family is a candidate for hash joins and hash aggregation.
- **Ordering operators** (currently only GiST and SP-GiST): don't restrict rows but let the index return rows in `ORDER BY indexed_column operator constant` order (nearest-neighbour): `SELECT * FROM places ORDER BY location <-> point '(101,456)' LIMIT 10;`. Declared with a btree family for the result type: `OPERATOR 15 <-> (point, point) FOR ORDER BY float_ops`.
- **Lossy indexes / recheck**: the index may return a superset with a **recheck flag**; the core re-tests the original condition on the heap row. Supported by GiST, SP-GiST, GIN; set per opclass support function.
- **`STORAGE` option**: index stores a different type than the column (`CREATE OPERATOR CLASS polygon_ops DEFAULT FOR TYPE polygon USING gist AS ... STORAGE box;`). Supported by GiST, SP-GiST, GIN, BRIN. GiST: `compress`/`decompress` convert; SP-GiST: `compress`; GIN: STORAGE = key type (e.g. integer keys for int arrays; via `extractValue`/`extractQuery`); BRIN: STORAGE = summary value type.

### Extensions: packaging, control files, scripts, versions  [M6]  (source: extend-extensions.txt)
- An **extension** = a package of SQL objects. Minimum: one **script file** + one **control file**; plus a shared library if there is C code. Loaded with `CREATE EXTENSION`.
- Benefits: `DROP EXTENSION` removes everything (no uninstall script); **pg_dump emits just `CREATE EXTENSION`** rather than member objects (you need the extension files available on the restore target).
- You cannot drop an individual member object except by dropping the whole extension. You can modify a member (`CREATE OR REPLACE FUNCTION`), but the modified definition **is not dumped**. Prefer update scripts.
- Scripts may `GRANT`/`REVOKE`; final privileges are stored in catalog **`pg_init_privs`**; pg_dump re-emits later privilege changes. Scripts **cannot issue `CREATE POLICY` or `SECURITY LABEL`** (set after creation; those are dumped).
- Members: see ALTER EXTENSION. **Cluster-wide objects (databases, roles, tablespaces) cannot be members** (script may create them but they're untracked). A table can be a member, but its indexes are not directly members. **Schemas can belong to extensions, but an extension does not live in a schema** (unqualified name). Temporary objects created by the script are members for the session and dropped at session end (the one exception to "can't drop members").
- **Files (36.17.1)**: control file `extension.control` in `SHAREDIR/extension`; script files named `extension--version.sql` (e.g. `foo--1.0.sql`), by default in the same directory. Additional control-file locations via GUC **`extension_control_path`**. Control file format = postgresql.conf format (`name = value`, `#` comments; quote non-single-word values); ASCII only.
- **Control file parameters**:
  - `directory` (string): directory of script files; relative to the control file's directory unless absolute; default = control file's directory.
  - `default_version` (string): version installed when `CREATE EXTENSION` has no `VERSION`; if omitted, CREATE EXTENSION fails without VERSION.
  - `comment` (string): applied at creation only, not on update.
  - `encoding` (string): script encoding; default assumes database encoding.
  - `module_pathname` (string): substituted for each `MODULE_PATHNAME` in scripts (typically the shared library name).
  - `requires` (string): list of prerequisite extensions, e.g. `requires = 'foo, bar'`.
  - `no_relocate` (string): required extensions that must not be `ALTER EXTENSION ... SET SCHEMA`'d (needed when `@extschema:name@` is embedded).
  - `superuser` (boolean, default **true**): only superusers may create/update; false => only privileges needed by the script commands.
  - `trusted` (boolean, default **false**): if true (and superuser = true), anyone with **CREATE privilege on the current database** may install; the script then runs **as the bootstrap superuser**, not the caller. Should not be set for extensions granting superuser-only abilities (e.g. file system access).
  - `relocatable` (boolean, default **false**).
  - `schema` (string): only for non-relocatable extensions; forces the schema; consulted only at initial creation.
- Secondary control files `extension--version.control` (in the script directory) override the primary for that version; cannot set `directory` or `default_version`.
- Scripts may contain any SQL **except transaction control (BEGIN, COMMIT, ...) and commands that cannot run in a transaction block (VACUUM)** — they are implicitly run inside one transaction block. Lines beginning with `\echo` are ignored (used for `\echo Use "CREATE EXTENSION pair" to load this file. \quit` to guard against sourcing in psql).
- `@extowner@` is replaced by the (quoted) name of the user calling CREATE/ALTER EXTENSION (for trusted extensions to hand ownership to the caller; never give a C function to a non-superuser — privilege escalation).
- **Relocatability (36.17.2)** — three levels:
  1. Fully relocatable: `relocatable = true`; `ALTER EXTENSION SET SCHEMA` moves all members; requires all objects in one schema and no schema assumptions.
  2. Relocatable at install only: `relocatable = false`, use **`@extschema@`** in the script (replaced with the target schema, double-quoted if needed); user picks via `CREATE EXTENSION ... SCHEMA`.
  3. Not relocatable: `relocatable = false` + `schema = name`.
- Script runs with the equivalent of `SET LOCAL search_path TO @extschema@, pg_temp;` (restored afterwards). Target schema precedence: control-file `schema` (created if missing) > `SCHEMA` option (must exist) > first schema in the caller's `search_path` (must exist). Prerequisite extensions' schemas are appended to the path; `pg_temp` is always appended last for security.
- Cross-extension references: `@extschema:name@` (name must be in `requires`); if embedded in string literals (function bodies, search_path settings) add that extension to `no_relocate`.
- **Configuration tables (36.17.3)**: member tables' definitions and data are normally not dumped. `SELECT pg_catalog.pg_extension_config_dump('my_config', '');` makes pg_dump dump the **contents (not the definition)**; second arg is a WHERE filter, e.g. `'WHERE NOT standard_entry'`; empty string = everything. Works for sequences too (filter ignored); sequences of serial/bigserial columns must be **marked directly**. Calling again changes the filter; unmark only by `ALTER EXTENSION ... DROP TABLE`. Dump order follows foreign keys; circular FK dependencies are not supported (dump produced but not directly restorable).
- **Updates (36.17.4)**: update scripts `extension--old_version--target_version.sql` (e.g. `foo--1.0--1.1.sql`); `ALTER EXTENSION UPDATE [TO version]` runs them in the same environment as install scripts; new objects are auto-added, dropped ones auto-dissociated. ALTER EXTENSION **chains scripts** (1.0->1.1->2.0). PostgreSQL knows nothing about version ordering: it picks the path with the **fewest update scripts**. A version name is any string not containing `--` and without leading/trailing `-`.
  - Downgrade scripts (`foo--1.1--1.0.sql`) are allowed but may be unexpectedly chosen as part of a shorter path (downgrade + fast-path). Check with `SELECT * FROM pg_extension_update_paths('extension_name');` (columns source/target/path; path NULL if none; `--` separated).
- **Install via update scripts (36.17.5)**: since PG 10 `CREATE EXTENSION` follows update chains: with only `foo--1.0.sql`, `foo--1.0--1.1.sql`, `foo--1.1--1.2.sql`, installing 1.2 runs all three (shortest path preferred). With secondary control files every version needs one (e.g. `requires = 'bar'` only in `foo--1.0.control` is lost when updating).
- **Security (36.17.6)**: SQL and PL functions are parsed **at execution time**, so are exposed to search-path attacks. Apply SECURITY DEFINER-style hygiene to every extension function. `IN` and `CASE expr WHEN` pick operators via search path — use `OPERATOR(schema.=) ANY` and `CASE WHEN expr`. Even schema-qualified calls can be captured by a better-matching overload (`myschema.myfunc(42)` captured by hostile `myschema.myfunc(integer)` over intended `(bigint)`): match argument types exactly with casts. In scripts: DDL like CREATE FUNCTION / CREATE OPERATOR CLASS is generally safe, but vet anything with general expressions (CREATE VIEW, DEFAULT expressions); for general SQL set `search_path` to `pg_catalog, pg_temp` and qualify explicitly. Trusted extensions are "extremely exposed" (installer chooses the schema).
- **Example (36.17.7)** `pair--1.0.sql`:
  ```sql
  \echo Use "CREATE EXTENSION pair" to load this file. \quit
  CREATE TYPE pair AS ( k text, v text );
  CREATE FUNCTION pair(text, text) RETURNS pair LANGUAGE SQL AS 'SELECT ROW($1, $2)::@extschema@.pair;';
  CREATE OPERATOR ~> (LEFTARG = text, RIGHTARG = text, FUNCTION = pair);
  CREATE FUNCTION lower(pair) RETURNS pair LANGUAGE SQL
    AS 'SELECT ROW(lower($1.k), lower($1.v))::@extschema@.pair;' SET search_path = pg_temp;
  CREATE FUNCTION pair_concat(pair, pair) RETURNS pair LANGUAGE SQL
    AS 'SELECT ROW($1.k OPERATOR(pg_catalog.||) $2.k, $1.v OPERATOR(pg_catalog.||) $2.v)::@extschema@.pair;';
  ```
  `pair.control`: `comment = 'A key/value pair data type'`, `default_version = '1.0'`, `relocatable = false` (because of `@extschema@`). Makefile: `EXTENSION = pair`, `DATA = pair--1.0.sql`, then the PGXS three lines.

### PGXS extension build infrastructure  [M6]  (source: extend-pgxs.txt)
- PGXS builds simple extension modules against an installed server. Makefile always ends with:
  `PG_CONFIG = pg_config` / `PGXS := $(shell $(PG_CONFIG) --pgxs)` / `include $(PGXS)`.
- Example: `MODULES = isbn_issn`, `EXTENSION = isbn_issn`, `DATA = isbn_issn--1.0.sql`, `DOCS = README.isbn_issn`, `HEADERS_isbn_issn = isbn_issn.h`.
- Pick one of: `MODULES` (shared libs built from same-stem sources), `MODULE_big` (one shared lib from several sources; list in `OBJS`), `PROGRAM` (executable; `OBJS`).
- Other variables (full list in inventory): `EXTENSION`, `MODULEDIR`, `DATA`, `DATA_built`, `DATA_TSEARCH`, `DOCS`, `HEADERS`, `HEADERS_built`, `HEADERS_$MODULE`, `HEADERS_built_$MODULE`, `SCRIPTS`, `SCRIPTS_built`, `REGRESS`, `REGRESS_OPTS`, `ISOLATION`, `ISOLATION_OPTS`, `TAP_TESTS`, `NO_INSTALL`, `NO_INSTALLCHECK`, `EXTRA_CLEAN`, `PG_CPPFLAGS`, `PG_CFLAGS`, `PG_CXXFLAGS`, `PG_LDFLAGS`, `PG_LIBS`, `SHLIB_LINK`, `PG_CONFIG`.
- `make` then `make install`; target installation = first `pg_config` in PATH unless `PG_CONFIG` overridden.
- Custom prefix: `make install prefix=/usr/local/postgresql` -> control/SQL in `.../share`, libs in `.../lib`. If the prefix lacks `postgres`/`pgsql`, `postgresql` is appended (`/usr/local/extras/share/postgresql/extension`, `/usr/local/extras/lib/postgresql`). Then set `extension_control_path = '/usr/local/extras/share/postgresql:$system'` and `dynamic_library_path = '/usr/local/extras/lib/postgresql:$libdir'`.
- VPATH builds: `make -f /path/to/Makefile` from a build dir, or `config/prep_buildtree` + `make VPATH=...`.
- Tests: `REGRESS` scripts live in `sql/*.sql`, expected output in `expected/*.out`; run with `make installcheck` (needs running server; psql-based); diffs in `regression.diffs` (`diff -c`). `ISOLATION` specs in `specs/*.spec`, diffs in `output_iso/regression.diffs`. `TAP_TESTS` data in `tmp_check/`. Missing expected file is reported as "trouble".

### Triggers: types, timing, return values, firing order  [M6, M3, M5]  (source: triggers.txt, trigger-definition.txt)
- Trigger functions can be written in PL/pgSQL, PL/Tcl, PL/Perl, PL/Python, or C — **not in plain SQL language**.
- A trigger = spec that the database automatically executes a function when a certain operation is performed. Attachable to **tables (partitioned or not), views, and foreign tables**.
- Trigger function: declared with **no arguments, `RETURNS trigger`**; input arrives via a `TriggerData` structure. Must exist before `CREATE TRIGGER`; one function can serve many triggers. Arguments given in `CREATE TRIGGER` are passed as strings (lets a generic function, e.g. "put current user in col A and timestamp in col B", serve many tables).
- **Trigger matrix** (what can be defined where):

  | Timing | Level | Events | Allowed on |
  |---|---|---|---|
  | BEFORE / AFTER | STATEMENT | INSERT, UPDATE, DELETE, TRUNCATE | tables, foreign tables; views (INSERT/UPDATE/DELETE only, and fired only if the view also has an INSTEAD OF trigger) |
  | BEFORE / AFTER | ROW | INSERT, UPDATE, DELETE | tables and foreign tables only (not views) |
  | INSTEAD OF | ROW only | INSERT, UPDATE, DELETE | views only |
  - **TRUNCATE triggers are statement-level only.** UPDATE triggers may be restricted to specific columns mentioned in `SET` (`UPDATE OF col`).
- Per-statement triggers fire **once per statement even if zero rows are affected**.
- Timing: statement BEFORE fires before the statement does anything; statement AFTER at the very end. Row BEFORE fires immediately before each row is operated on; **row AFTER triggers fire at the end of the statement (but before any statement-level AFTER triggers)**. INSTEAD OF fires immediately as each view row is identified.
- For views without INSTEAD OF triggers the statement is rewritten onto the base table(s) and the base tables' triggers fire.
- **Constraint triggers**: an AFTER trigger defined as a constraint trigger can be **deferred to end of transaction**.
- A trigger always executes in the same transaction as the triggering statement (error in either rolls back both). It runs **as the role that queued the trigger event**, unless the function is `SECURITY DEFINER` (then as function owner).
- **`INSERT ... ON CONFLICT DO UPDATE`**: row-level BEFORE INSERT then BEFORE UPDATE triggers may both run for a row; BEFORE INSERT changes (including to `EXCLUDED` columns) are seen by BEFORE UPDATE triggers — be idempotent. Statement-level order: **BEFORE INSERT, BEFORE UPDATE, AFTER UPDATE, AFTER INSERT**; statement-level UPDATE triggers fire regardless of whether the update path was ever taken.
- **Inheritance/partitioning**: a statement on a parent fires **only the parent's statement-level triggers**, but **row-level triggers of affected children fire**.
- **Cross-partition UPDATE (row movement)** = DELETE from old partition + INSERT into new one: fires row BEFORE UPDATE and row BEFORE DELETE on the original partition, then row BEFORE INSERT on the destination; AFTER DELETE and AFTER INSERT row triggers apply, **AFTER UPDATE row triggers do not**. Statement-level: only the UPDATE triggers on the table named in the statement fire (no DELETE/INSERT statement triggers).
- **MERGE**: no separate MERGE triggers. Statement-level triggers fire for every action type **specified** in the MERGE (whether or not performed); row-level triggers fire only for rows actually inserted/updated/deleted.
- **Return values**:
  - Per-statement trigger functions should always return NULL.
  - Row-level **BEFORE**: return **NULL to skip the operation for this row** (and subsequent triggers for that row don't fire); for INSERT/UPDATE the **returned row replaces** the row to be inserted/updated; otherwise return the row passed in unchanged (NEW for INSERT/UPDATE, OLD for DELETE).
  - Row-level **INSTEAD OF**: return NULL = "did not modify anything" (row not counted); return the view row (NEW for INSERT/UPDATE, OLD for DELETE) = modification performed, **increments the affected-row count**; modifying NEW before returning changes `INSERT/UPDATE RETURNING` output.
  - Row-level **AFTER**: return value ignored.
- **Generated columns**: stored generated columns are computed **after BEFORE triggers and before AFTER triggers**. In BEFORE triggers OLD has the old generated value; NEW does not yet contain the new one (undefined in C) and changes to it are ignored/overwritten. **Virtual generated columns are never computed when triggers fire** (content undefined in C).
- **Firing order among same-event triggers on one relation: alphabetical by trigger name.** For BEFORE and INSTEAD OF, each trigger's returned row is the input to the next; NULL abandons the row and remaining triggers.
- **`WHEN` condition** (boolean): row-level can reference OLD/NEW; statement-level may also have WHEN. BEFORE: evaluated just before the function would run (≈ same as testing inside). **AFTER: evaluated right after the row change and decides whether an event is queued** — avoids queueing and re-fetching the row at end of statement (large speedup when few rows qualify). **INSTEAD OF triggers do not support WHEN.**
- Usage guidance: row BEFORE for checking/modifying the row (timestamps, consistency); row AFTER for propagating to other tables / cross-table checks (AFTER sees the final row value; BEFORE can't be sure — later BEFORE triggers may change it). With no specific reason, **BEFORE is more efficient** (no event info saved until end of statement).
- **Cascading triggers**: SQL in a trigger can fire other triggers; no limit on cascade depth; recursion is the programmer's responsibility.
- **Foreign-key referential actions** (cascading update/delete) are performed via ordinary SQL UPDATE/DELETE on the referencing table, so that table's triggers fire; a trigger that modifies/blocks these can **break referential integrity**.
- Trigger input data: event type, CREATE TRIGGER arguments, NEW (INSERT/UPDATE) and/or OLD (UPDATE/DELETE) for row-level.
- **Transition tables**: AFTER STATEMENT triggers can request transition tables exposing the sets of affected rows; **AFTER ROW triggers can also request them**. Typically appear as read-only temporary tables to SQL in the trigger function (`REFERENCING OLD TABLE AS ... NEW TABLE AS ...`).

### Trigger visibility of data changes  [M5, M6]  (source: trigger-datachanges.txt, trigger-example.txt)
- Statement-level BEFORE: **none** of the statement's changes visible. Statement-level AFTER: **all** visible.
- Row-level BEFORE: the change that fired it is not visible (hasn't happened), **but changes for rows previously processed by the same outer command are visible** — order of row visits is unpredictable, so be careful.
- Row-level INSTEAD OF: sees changes made by previous INSTEAD OF firings in the same outer command.
- Row-level AFTER: **all** changes of the outer command are complete and visible.
- These rules apply only if the (standard-PL) trigger function is **VOLATILE**; STABLE/IMMUTABLE functions never see the calling command's changes.
- Demonstration (`trigf` on `ttest(x integer)`, BEFORE and AFTER row triggers counting rows via SPI and returning NULL when x is null):
  - `INSERT INTO ttest VALUES (NULL);` -> "fired before: 0 rows"; result `INSERT 0 0`; insertion skipped and **AFTER trigger not fired**.
  - `INSERT INTO ttest VALUES (1);` -> before: 0 rows; after: 1 row.
  - `UPDATE ttest SET x = NULL WHERE x = 2;` -> before only, `UPDATE 0`.
  - `DELETE FROM ttest;` (2 rows) -> before: 2 rows; before: 1 row; after: 0 rows; after: 0 rows (BEFORE sees earlier rows' deletions; both AFTER firings see the completed statement).

### Trigger C interface  [M6]  (source: trigger-interface.txt, trigger-example.txt)
- Must use version-1 fmgr interface. `CALLED_AS_TRIGGER(fcinfo)` expands to `((fcinfo)->context != NULL && IsA((fcinfo)->context, TriggerData))`. Must not alter `TriggerData`.
- `struct TriggerData` (commands/trigger.h): `NodeTag type` (always `T_TriggerData`); `TriggerEvent tg_event`; `Relation tg_relation`; `HeapTuple tg_trigtuple`; `HeapTuple tg_newtuple`; `Trigger *tg_trigger`; `TupleTableSlot *tg_trigslot`; `TupleTableSlot *tg_newslot`; `Tuplestorestate *tg_oldtable`; `Tuplestorestate *tg_newtable`; `const Bitmapset *tg_updatedcols`.
- `tg_event` macros: `TRIGGER_FIRED_BEFORE`, `TRIGGER_FIRED_AFTER`, `TRIGGER_FIRED_INSTEAD`, `TRIGGER_FIRED_FOR_ROW`, `TRIGGER_FIRED_FOR_STATEMENT`, `TRIGGER_FIRED_BY_INSERT`, `TRIGGER_FIRED_BY_UPDATE`, `TRIGGER_FIRED_BY_DELETE`, `TRIGGER_FIRED_BY_TRUNCATE`.
- `tg_relation->rd_att` (tuple descriptor), `tg_relation->rd_rel->relname` (NameData; `SPI_getrelname()` for char*).
- `tg_trigtuple`: the row being inserted/updated/deleted — return this for INSERT/DELETE to proceed unchanged. `tg_newtuple`: new row version for UPDATE (NULL for INSERT/DELETE) — return this for UPDATE. System columns unspecified for foreign tables.
- `struct Trigger` (utils/reltrigger.h): `Oid tgoid; char *tgname; Oid tgfoid; int16 tgtype; char tgenabled; bool tgisinternal; bool tgisclone; Oid tgconstrrelid; Oid tgconstrindid; Oid tgconstraint; bool tgdeferrable; bool tginitdeferred; int16 tgnargs; int16 tgnattr; int16 *tgattr; char **tgargs; char *tgqual; char *tgoldtable; char *tgnewtable;` — only `tgname`, `tgnargs`, `tgargs` are for public use.
- `tg_oldtable`/`tg_newtable`: tuplestores for OLD TABLE / NEW TABLE transition relations (NULL if none); SPI access via `SPI_register_trigger_data`.
- `tg_updatedcols`: bitmap of columns updated by the triggering UPDATE (NULL otherwise); test with `bms_is_member(attnum - FirstLowInvalidHeapAttributeNumber, trigdata->tg_updatedcols)`.
- Must return a `HeapTuple` pointer or a NULL **pointer** (not SQL null; don't set isNull).
- Declaration: `CREATE FUNCTION trigf() RETURNS trigger AS 'filename' LANGUAGE C;` `CREATE TRIGGER tbefore BEFORE INSERT OR UPDATE OR DELETE ON ttest FOR EACH ROW EXECUTE FUNCTION trigf();`

### Event triggers  [M6]  (source: event-triggers.txt, event-trigger-definition.txt, event-trigger-interface.txt, event-trigger-example.txt, event-trigger-table-rewrite-example.txt, event-trigger-database-login-example.txt)
- Regular triggers are attached to one table and capture DML; **event triggers are global to one database and capture DDL events**. Written in a PL with event-trigger support or C, not plain SQL.
- Supported events (exactly five): **`login`, `ddl_command_start`, `ddl_command_end`, `table_rewrite`, `sql_drop`**.
- **`login`**: fires when an authenticated user logs in. A bug can prevent all logins; workaround: set GUC **`event_triggers = false`** (connection string or config file) or restart in single-user mode (event triggers disabled there). Also fires on **standby servers** — must not write on a standby (check `pg_is_in_recovery()`); avoid long-running queries; cancelling the connection in psql does not cancel the in-progress login trigger.
- **`ddl_command_start`**: just before a DDL command. Commands covered (PG 18 list — replaces the old "firing matrix" table): `CREATE`, `ALTER`, `DROP`, `COMMENT`, `GRANT`, `IMPORT FOREIGN SCHEMA`, `REINDEX`, `REFRESH MATERIALIZED VIEW`, `REVOKE`, `SECURITY LABEL`; also `SELECT INTO` (≡ CREATE TABLE AS).
  - **Not fired for shared objects**: databases, roles (definitions and memberships), tablespaces, parameter privileges, `ALTER SYSTEM`. Also not for commands targeting event triggers themselves.
  - No existence check on the affected object is made before firing.
- **`ddl_command_end`**: just after the same set of commands; before commit, catalogs already changed. Details via SRF `pg_event_trigger_ddl_commands()`.
- **`sql_drop`**: just **before `ddl_command_end`** for any operation dropping objects (some ALTER commands too). List via `pg_event_trigger_dropped_objects()`; objects are already deleted from catalogs (can't be looked up).
- **`table_rewrite`**: just before a table is rewritten by `ALTER TABLE` / `ALTER TYPE` actions. **Not triggered by `CLUSTER` or `VACUUM`**. `pg_event_trigger_table_rewrite_oid()`, `pg_event_trigger_table_rewrite_reason()`.
- **Aborted transactions**: event triggers cannot run in an aborted transaction. DDL fails => its `ddl_command_end` triggers don't run. `ddl_command_start` trigger errors => no further event triggers and the command is not executed. `ddl_command_end` trigger errors => the DDL is rolled back.
- **Firing sequence for one DDL command**: ddl_command_start -> (command executes; table_rewrite just before a rewrite) -> sql_drop (if objects dropped) -> ddl_command_end.
- Creation: function with return type **`event_trigger`** (returns no value), then `CREATE EVENT TRIGGER name ON event [WHEN ...] EXECUTE FUNCTION f();`. Multiple triggers for one event fire in **alphabetical order by name**. `WHEN` can filter on command tags (common use: restricting DDL).
- C interface: `CALLED_AS_EVENT_TRIGGER(fcinfo)` = `((fcinfo)->context != NULL && IsA((fcinfo)->context, EventTriggerData))`. `struct EventTriggerData` (commands/event_trigger.h): `NodeTag type` (`T_EventTriggerData`); `const char *event` ("login", "ddl_command_start", "ddl_command_end", "sql_drop", "table_rewrite"); `Node *parsetree` (subject to change without notice); `CommandTag tag` (e.g. "CREATE FUNCTION"; `GetCommandTagName(trigdata->tag)`). Must return a NULL pointer.
- Example `noddl`: `CREATE FUNCTION noddl() RETURNS event_trigger AS 'noddl' LANGUAGE C; CREATE EVENT TRIGGER noddl ON ddl_command_start EXECUTE FUNCTION noddl();` => `CREATE TABLE foo(id serial);` fails with `ERROR: command "CREATE TABLE" denied`. psql `\dy` lists event triggers (Name, Event, Owner, Enabled, Function, Tags). Temporarily bypass: `BEGIN; ALTER EVENT TRIGGER noddl DISABLE; CREATE TABLE foo (id serial); ALTER EVENT TRIGGER noddl ENABLE; COMMIT;`.
- Table-rewrite policy example (PL/pgSQL `no_rewrite()`): forbid rewriting `public.foo` ever; other tables only between 1am and 6am and only if `relpages <= 100`; `CREATE EVENT TRIGGER no_rewrite_allowed ON table_rewrite EXECUTE FUNCTION no_rewrite();`.
- Login example (`init_session()` `SECURITY DEFINER`): forbid login 2AM–4AM UTC (`RAISE EXCEPTION 'Login forbidden'`); return early if `pg_is_in_recovery()`; grant `day_worker` (8–20h) or `night_worker`; create temp table `session_storage`; insert into `user_login_log`; `CREATE EVENT TRIGGER init_session ON login EXECUTE FUNCTION init_session(); ALTER EVENT TRIGGER init_session ENABLE ALWAYS;`.

### Rule system overview & the query tree  [M4, M6]  (source: rules.txt, querytree.txt)
- The rule system = the **query rewrite** rule system; "totally different from stored procedures and triggers": it modifies queries and passes the modified query to the planner. Usable for query-language procedures, views, versions. References [ston90b], [ong90].
- Position in the pipeline: **between the parser and the planner**. Input: one query tree from the parser + user-defined rewrite rules (themselves query trees with extra info). Output: **zero or more query trees**. Everything it sees is representable as SQL.
- Query trees can be logged with GUCs **`debug_print_parse`**, **`debug_print_rewritten`**, **`debug_print_plan`**. Rule actions are stored as query trees in catalog **`pg_rewrite`**.
- **Parts of a query tree**:
  1. **Command type** — SELECT, INSERT, UPDATE, DELETE.
  2. **Range table** — list of relations used (FROM items for SELECT). Entries are referenced **by number, not name** (duplicate names are fine after rules' range tables are merged in).
  3. **Result relation** — index into the range table where results go. SELECT has none (SELECT INTO ≈ CREATE TABLE + INSERT ... SELECT). For INSERT/UPDATE/DELETE it is the table **(or view!)** to change.
  4. **Target list** — expressions defining the result. SELECT: expressions between SELECT and FROM (`*` is expanded by the parser; the rule system never sees it). DELETE: no normal target list; **the planner adds a special `CTID` entry** (or, if the result relation is a view, the rule system adds a **whole-row variable**). INSERT: VALUES/SELECT expressions; **the first rewrite step adds target entries for unassigned columns that have defaults**; remaining columns get constant NULL from the planner. UPDATE: only the `SET col = expr` expressions; planner adds expressions copying old values for missing columns; CTID / whole-row added as for DELETE. Each entry is a constant, a Var pointing to a range-table column, a parameter, or an expression tree.
  5. **Qualification** — boolean expression (WHERE) deciding whether the operation for the final result row is executed.
  6. **Join tree** — structure of FROM. `FROM a, b, c` is just a list (any join order); explicit JOINs (esp. outer) fix structure; ON/USING restrictions are quals attached to join-tree nodes; the top-level WHERE is stored as the qual of the top-level join-tree item — so the join tree represents both FROM and WHERE.
  7. **Others** — ORDER BY etc. (not of interest to rules).

### Views as rules; SELECT rules  [M6, M4]  (source: rules-views.txt)
- **A view is basically an empty table (no storage) with an `ON SELECT DO INSTEAD` rule conventionally named `_RETURN`.** `CREATE VIEW myview AS SELECT * FROM mytab;` ≈ `CREATE TABLE myview (...); CREATE RULE "_RETURN" AS ON SELECT TO myview DO INSTEAD SELECT * FROM mytab;` — but you can't actually write that: **tables are not allowed to have ON SELECT rules**.
- **ON SELECT rules are applied to all queries as the last step**, even for INSERT/UPDATE/DELETE commands, and they **modify the query tree in place** instead of creating a new one.
- Restriction: an ON SELECT rule has **exactly one action, an unconditional SELECT that is INSTEAD** (this is what makes rules safe for ordinary users; ON SELECT rules can only act like views). SELECT rules cannot have rule qualifications.
- CREATE VIEW creates a relation and a `pg_rewrite` entry applied whenever the relation appears in a query's range table. The rule action is a copy of the view's SELECT (with two extra range-table entries NEW and OLD, irrelevant for SELECT rules).
- Shoe-store example tables: `shoe_data(shoename, sh_avail, slcolor, slminlen, slmaxlen, slunit)`, `shoelace_data(sl_name, sl_avail, sl_color, sl_len, sl_unit)`, `unit(un_name, un_fact)`; views `shoe`, `shoelace` (adds `sl_len_cm = s.sl_len * u.un_fact`), `shoe_ready` (join of the two views, `least(rsh.sh_avail, rsl.sl_avail) AS total_avail`).
- **View expansion algorithm**:
  1. Parser turns `SELECT * FROM shoelace` into a query tree with the star expanded and a range-table entry for `shoelace`.
  2. The rewriter walks the range table; for `shoelace` it finds `_RETURN`.
  3. It **creates a subquery range-table entry containing the rule's action query tree and substitutes it for the original entry** — as if the view were written as `FROM (SELECT ...) shoelace`.
  4. The subquery's range table keeps two extra entries `shoelace old` and `shoelace new`, unused in the join tree/target list; they carry the **access-privilege check information** of the original view reference so the executor still checks the user's privileges on the view.
  5. Continue with remaining range-table entries, and **recurse** into the added subquery (but never expand old/new — infinite recursion).
- `SELECT * FROM shoe_ready WHERE total_avail >= 2;` expands to a three-level nested subquery tree joining 4 tables (`unit` twice). The **planner collapses it into a single level by "pulling up" subqueries** — an optimization the rewriter doesn't care about.
- **Non-SELECT statements (39.2.2)**: the trees for `SELECT t2.b FROM t1, t2 WHERE t1.a = t2.a;` and `UPDATE t1 SET b = t2.b FROM t2 WHERE t1.a = t2.a;` are nearly identical (same range table, target list, qual, join tree); they yield similar plans (a join). The planner completes the UPDATE target list (`SET a = t1.a, b = t2.b`) and adds **`t1.ctid`** (system column: file block number and position in block) so the executor can locate the old row: effectively `SELECT t1.a, t2.b, t1.ctid FROM t1, t2 WHERE t1.a = t2.a;`.
- MVCC tie-in stated here: old rows aren't overwritten ("this is why ROLLBACK is fast"); in an UPDATE the new row is inserted and the old row's header gets **`cmax` and `xmax` set to the current command counter and current transaction ID**; after commit vacuum can remove the dead row.
- **Power of views**: because expansion happens before planning, the planner sees all tables, their relationships, the view quals and the query quals in one tree and can choose the best plan.

### Updating a view (auto-updatable views, INSTEAD OF triggers, rules)  [M6, M3]  (source: rules-views.txt)
- Naively substituting a subquery for a view that is the **result relation** of INSERT/UPDATE/DELETE/MERGE can't work. Three mechanisms, in order of user-experienced complexity:
  1. **Automatically updatable views**: if the subquery selects from a single base relation and is "simple enough", the rewriter replaces it with the underlying base relation (details in CREATE VIEW).
  2. **INSTEAD OF triggers**: for INSERT the rewriter does nothing to the view (it stays the result relation). For UPDATE/DELETE/MERGE the view is expanded as usual to produce the "old" rows, and **another unexpanded range-table entry is added** representing the view as result relation. Since a view has no CTID, a special **wholerow** target-list entry (all view columns) is added; the executor passes it as OLD to the trigger.
  3. **INSTEAD rules** on INSERT/UPDATE/DELETE that rewrite the command onto tables (39.4). **Does not work with MERGE** (MERGE supports no rules on the target other than SELECT rules).
- **Precedence**: rules are evaluated first (rewrite precedes planning/execution) — if a view has both rules and INSTEAD OF triggers, the triggers may never be used. **Automatic rewriting is always tried last**, so rules/triggers override auto-updatable behaviour. With none of the three: error (the executor cannot update a view as such).

### Materialized views  [M6, M4]  (source: rules-materializedviews.txt)
- Use the rule system like views but **persist results in table-like form**. vs `CREATE TABLE AS`: a matview **cannot be directly updated**, and its defining query is stored exactly like a view's so data can be regenerated with `REFRESH MATERIALIZED VIEW mymatview;`.
- Catalog information is exactly the same as for a table or view; to the parser it is just a relation. When referenced in a query **data comes directly from the matview like a table; the rule is used only for populating it**.
- Trade-off: faster than base tables/views but not always current.
- Example: `CREATE MATERIALIZED VIEW sales_summary AS SELECT seller_no, invoice_date, sum(invoice_amt)::numeric(13,2) as sales_amt FROM invoice WHERE invoice_date < CURRENT_DATE GROUP BY seller_no, invoice_date; CREATE UNIQUE INDEX sales_summary_seller ON sales_summary (seller_no, invoice_date);` refreshed nightly.
- Matviews **can be indexed** (unlike `file_fdw` foreign tables). Example: `words` foreign table over `/usr/share/dict/words` (479829 rows), matview `wrd` with unique btree `wrd_word` and `CREATE INDEX wrd_trgm ON wrd USING gist (word gist_trgm_ops);`.
  - `SELECT count(*) FROM words WHERE word = 'caterpiler';` — Foreign Scan 188.273 ms vs matview **Index Only Scan** (`Heap Fetches: 0`, `Index Searches: 1`) 0.117 ms.
  - `SELECT word FROM words ORDER BY word <-> 'caterpiler' LIMIT 10;` — foreign scan + top-N heapsort 1431.679 ms vs GiST index scan with `Order By: (word <-> 'caterpiler'::text)` 198.640 ms.
  - PG 18 EXPLAIN shows fractional `rows=1.00` and `Index Searches: N` lines.

### Rules on INSERT, UPDATE, DELETE ("update rules")  [M6, M4]  (source: rules-update.txt)
- Syntax: `CREATE [ OR REPLACE ] RULE name AS ON event TO table [ WHERE condition ] DO [ ALSO | INSTEAD ] { NOTHING | command | ( command ; command ... ) }`.
- Differences from view (SELECT) rules: may have **no action**; **multiple actions**; **`INSTEAD` or `ALSO` (default ALSO)**; pseudorelations **NEW and OLD** are useful; may have **rule qualifications**; they do **not modify the tree in place** — they create zero or more new query trees and may throw away the original.
- **Caution (documented)**: triggers are usually better. Rules give surprising results with **volatile functions** (may be executed more times than expected). **Not supported at all**: `WITH` clauses in the original query, and multiple-assignment sub-SELECTs in `UPDATE ... SET` (copying them would cause multiple evaluation).
- **Application algorithm**: a rule applies when the query tree's result relation and command type match the rule's object and event. The rule system builds a list of query trees (initially empty). For a one-action rule:
  1. **No qualification (ALSO or INSTEAD)**: rule action tree + original query's qualification.
  2. **Qualification + ALSO**: rule action tree + rule qualification + original qualification.
  3. **Qualification + INSTEAD**: rule action tree + rule qual + original qual; **plus the original query tree with the negated rule qualification** added.
  - Finally, if the rule is ALSO, the unchanged original tree is added. So a one-action rule yields one or two trees.
- **Ordering**: for **ON INSERT** the original query (if not suppressed) runs **before** rule actions (actions can see inserted rows); for **ON UPDATE and ON DELETE** the original runs **after** the rule actions (actions can still see the to-be-changed rows).
- Rule-generated trees are fed back into the rewriter (more rules may apply). So actions must have a different command type or different result relation than the rule itself, else infinite loop — **recursive expansion is detected and reported as an error**.
- `pg_rewrite` actions are templates. Substitution: each **NEW** reference -> matching entry in the original query's target list if present; otherwise NEW means **the same as OLD (UPDATE)** or **NULL (INSERT)**. Each **OLD** reference -> reference to the result relation's range-table entry.
- After update rules, **view rules are applied** to the produced trees (views can't add update actions, so no second pass).
- **Step-by-step example** (`log_shoelace`):
  ```sql
  CREATE TABLE shoelace_log (sl_name text, sl_avail integer, log_who text, log_when timestamp);
  CREATE RULE log_shoelace AS ON UPDATE TO shoelace_data
      WHERE NEW.sl_avail <> OLD.sl_avail
      DO INSERT INTO shoelace_log VALUES (NEW.sl_name, NEW.sl_avail, current_user, current_timestamp);
  UPDATE shoelace_data SET sl_avail = 6 WHERE sl_name = 'sl7';
  ```
  Steps: (1) merge the original query's range table into the action; (2) add rule qual `new.sl_avail <> old.sl_avail`; (3) add original qual `shoelace_data.sl_name = 'sl7'`; (4) replace NEW refs with target-list entries (`new.sl_avail` -> `6`, `new.sl_name` -> `shoelace_data.sl_name`); (5) replace OLD refs with result-relation refs. Output list = `INSERT INTO shoelace_log ... FROM shoelace_data WHERE 6 <> shoelace_data.sl_avail AND shoelace_data.sl_name = 'sl7';` then the original UPDATE — executed in that order.
  - `UPDATE shoelace_data SET sl_color = 'green' WHERE sl_name = 'sl7';` writes no log: NEW.sl_avail becomes `shoelace_data.sl_avail`, so the qual `sl_avail <> sl_avail` is never true.
  - Multi-row: `UPDATE shoelace_data SET sl_avail = 0 WHERE sl_color = 'black';` updates 4 rows (sl1–sl4), logs 3 (sl3 already 0) with a single `INSERT ... SELECT`. Demonstrates why the original must run last.
- **Cooperation with views**:
  - Protect a view: `CREATE RULE shoe_ins_protect AS ON INSERT TO shoe DO INSTEAD NOTHING;` (same for UPDATE/DELETE) — the resulting tree list is empty; the query silently becomes nothing.
  - Make a view updatable: `shoelace_ins` (`DO INSTEAD INSERT INTO shoelace_data VALUES (NEW.sl_name, ...)`), `shoelace_upd` (`DO INSTEAD UPDATE shoelace_data SET ... WHERE sl_name = OLD.sl_name`), `shoelace_del` (`DO INSTEAD DELETE FROM shoelace_data WHERE sl_name = OLD.sl_name`).
  - To support `RETURNING` on the view the rule must include a RETURNING clause computing view rows (`RETURNING shoelace_data.*, (SELECT shoelace_data.sl_len * u.un_fact FROM unit u WHERE shoelace_data.sl_unit = u.un_name)`); it is ignored for plain INSERT. In a rule's RETURNING, OLD/NEW refer to the pseudorelations, not the result relation's old/new rows — refer to result-relation columns (`shoelace_data.sl_name`) instead.
  - Chained rewrite demo: `INSERT INTO shoelace_ok SELECT * FROM shoelace_arrive;` with rule `shoelace_ok_ins` (`DO INSTEAD UPDATE shoelace SET sl_avail = sl_avail + NEW.ok_quant WHERE sl_name = NEW.ok_name`) -> rewritten by `shoelace_upd` into UPDATE on `shoelace_data` -> `_RETURN` expands the view -> `log_shoelace` adds a logging INSERT. Final: **two queries** (INSERT into `shoelace_log`, UPDATE `shoelace_data`). Wart: `shoelace_data` appears twice in the range table, costing a redundant scan (Nested Loop over a Merge Join rather than just the Merge Join) — the planner does not eliminate it.
  - `DELETE FROM shoelace WHERE EXISTS (SELECT * FROM shoelace_can_delete WHERE sl_name = shoelace.sl_name);` — 4 nested/joined views with subquery quals are rewritten into one DELETE on the real table.

### Rules and privileges; security_barrier; LEAKPROOF  [M6, M4]  (source: rules-privileges.txt)
- Rewrite rules have no separate owner: **the relation's owner owns its rules**. Except for SELECT rules of **security invoker views**, all relations used due to rules are checked against the **rule owner's** privileges, not the invoking user's. Users need privileges only on relations named explicitly in their queries.
- Example: `phone_data(person, phone, private)` private; `CREATE VIEW phone_number AS SELECT person, CASE WHEN NOT private THEN phone END AS phone FROM phone_data; GRANT SELECT ON phone_number TO assistant;`. Access to the view is checked against the invoker; access to `phone_data` against the view owner. Checks are **rule by rule** (the assistant may re-grant via their own view; revoking from the assistant instantly breaks it). "A GRANT command means, 'I trust you'."
- **Views hide columns reliably but not rows** unless `security_barrier` is set. Insecure: `CREATE VIEW phone_number AS SELECT person, phone FROM phone_data WHERE phone NOT LIKE '412%';` — attack: `CREATE FUNCTION tricky(text, text) RETURNS bool AS $$ BEGIN RAISE NOTICE '% => %', $1, $2; RETURN true; END; $$ LANGUAGE plpgsql COST 0.0000000000000000000001; SELECT * FROM phone_number WHERE tricky(person, phone);` — the planner runs the cheap function before `NOT LIKE`, leaking every row. Built-in functions can leak too (cast functions echo inputs in error messages).
- Fix: `CREATE VIEW phone_number WITH (security_barrier) AS ...` — prevents user-chosen functions/operators from seeing rows before the view's filters. May perform **far worse**; not the default.
- **`LEAKPROOF`** functions (no side effects, reveal nothing about args; e.g. many equality operators) may be pushed down into security-barrier views. Functions that take no arguments, or none from the view, need not be leakproof. A function that can throw value-dependent errors (overflow, division by zero) is **not** leakproof.
- An **index scan cannot be chosen** on a security-barrier view (or RLS table) if the WHERE operator belongs to the index's operator family but its function isn't LEAKPROOF. psql **`\dAo+`** lists operator families with leakproof marking.
- Even security_barrier only guarantees invisible tuples aren't passed to insecure functions; **covert channels** remain (EXPLAIN, timing, statistics).
- Update rules: grant SELECT/INSERT/UPDATE/DELETE on `shoelace` but only SELECT on `shoelace_log` — the logging action still runs (owner privileges), the user can't forge or remove log entries.

### Rules and command status  [M6]  (source: rules-status.txt)
- Command status strings look like `INSERT 149592 1`.
- **No unconditional INSTEAD rule**: the original query runs and its status is returned as usual (conditional INSTEAD rules add negated quals, possibly reducing the row count).
- **Any unconditional INSTEAD rule**: the original query is not executed; the status returned is that of the **last query inserted by an INSTEAD rule (conditional or unconditional) of the same command type** as the original; if none, the original command type with **zero row count and OID**.
- Rules are applied in **alphabetical order by rule name**; give the desired status-setting INSTEAD rule the alphabetically last name.

### Rules versus triggers  [M6, M4]  (source: rules-triggers.txt)
- Rules cannot implement some constraints, especially **foreign keys**: a qualified rule rewriting to NOTHING silently discards data; to raise an error you need a trigger.
- All update-rule examples can be done with **INSTEAD OF triggers**, usually more easily.
- Performance model: **a trigger fires once per affected row; a rule modifies the query or generates one additional query**. For statements touching many rows, one extra set-based command may beat N trigger invocations; but triggers are conceptually far simpler.
- Example `computer(hostname, manufacturer)` / `software(software, hostname)` cascade delete. Trigger: `DELETE FROM software WHERE hostname = $1;` (saved plan per row). Rule: `CREATE RULE computer_del AS ON DELETE TO computer DO DELETE FROM software WHERE hostname = OLD.hostname;`
  - `DELETE FROM computer WHERE hostname = 'mypc.local.net';` -> rule's extra command plans as Nestloop of two index scans — about equal.
  - `WHERE hostname >= 'old' AND hostname < 'ole'` (2000 rows) -> Hash Join (Seq Scan on software + Hash over Index Scan on computer); `WHERE hostname ~ '^old'` -> Nestloop of index scans. The trigger does 1 index scan on computer + 2000 index scans on software through SPI.
  - `WHERE manufacturer = 'bim'` -> Nestloop using `comp_manufidx` + `soft_hostidx`.
- Summary: rules are significantly slower than triggers only when their actions produce **large, badly qualified joins** where the planner fails.

### Procedural languages: handlers & installation  [M6]  (source: xplang.txt, xplang-install.txt)
- For PL functions the server has no built-in knowledge of the source text; it passes the job to a **handler** — a C function in a shared object loaded on demand; it either implements the language or glues to an existing implementation.
- Four PLs in the standard distribution: **PL/pgSQL, PL/Tcl, PL/Perl, PL/Python**. Others externally (Appendix H); writing a new PL: ch.57.
- A PL must be installed **into each database**; languages installed in **`template1`** are copied into subsequently created databases. For bundled languages just `CREATE EXTENSION language_name`.
- Manual install, five steps (superuser):
  1. Compile/install the handler's shared object (plus any language engine library).
  2. `CREATE FUNCTION handler_function_name() RETURNS language_handler AS 'path-to-shared-object' LANGUAGE C;`
  3. Optional **inline handler** (runs `DO` anonymous code blocks): `CREATE FUNCTION inline_function_name(internal) RETURNS void AS '...' LANGUAGE C;`
  4. Optional **validator** (checks a definition without executing; called by CREATE FUNCTION): `CREATE FUNCTION validator_function_name(oid) RETURNS void AS '...' LANGUAGE C STRICT;`
  5. `CREATE [TRUSTED] LANGUAGE language_name HANDLER handler_function_name [INLINE inline_function_name] [VALIDATOR validator_function_name];`
- **TRUSTED** = the language grants no access to data the user wouldn't otherwise have (no server internals, no file system); usable by non-superusers. Trusted: **PL/pgSQL, PL/Tcl, PL/Perl**. Untrusted: **PL/TclU, PL/PerlU, PL/PythonU**.
- Example 40.1 (PL/Perl): `plperl_call_handler()`, `plperl_inline_handler(internal)`, `plperl_validator(oid)` all in `'$libdir/plperl'`; `CREATE TRUSTED LANGUAGE plperl HANDLER plperl_call_handler INLINE plperl_inline_handler VALIDATOR plperl_validator;`
- Defaults: **PL/pgSQL handler is built and the language installed in all databases**. PL/Tcl(U), PL/Perl(U), PL/PythonU handlers are built only if configured and are not installed in any database by default.

### Logical decoding: overview & SQL/protocol examples  [M7]  (source: logicaldecoding.txt, logicaldecoding-example.txt, logicaldecoding-walsender.txt, logicaldecoding-sql.txt, logicaldecoding-catalogs.txt)
- Infrastructure to **stream modifications performed via SQL to external consumers** (replication, auditing). Changes are sent in streams identified by **logical replication slots**; format decided by the **output plugin** (example plugin `test_decoding` in contrib).
- Every output plugin sees each new row from INSERT and the new row version from UPDATE; **availability of old row versions for UPDATE and DELETE depends on `REPLICA IDENTITY`**.
- Consumption: streaming replication protocol (54.4, 47.3), SQL functions (47.4), or custom output writers (47.7).
- **Prerequisites**: `wal_level = logical`, `max_replication_slots >= 1`; connect to the target database as superuser (in the example). For pg_recvlogical: replication connections allowed in client auth and `max_wal_senders` high enough. For two-phase: `max_prepared_transactions >= 1`.
- SQL walk-through (plugin `test_decoding`):
  - `SELECT * FROM pg_create_logical_replication_slot('regression_slot', 'test_decoding', false, true);` -> `(slot_name, lsn)` e.g. `regression_slot | 0/16B1970` (3rd arg `temporary` = false, 4th `twophase` = true).
  - `SELECT slot_name, plugin, slot_type, database, active, restart_lsn, confirmed_flush_lsn FROM pg_replication_slots;` -> `regression_slot | test_decoding | logical | postgres | f | 0/16A4408 | 0/16A4440`.
  - `SELECT * FROM pg_logical_slot_get_changes('regression_slot', NULL, NULL);` -> columns `(lsn, xid, data)`; args = slot, upto_lsn, upto_nchanges, then variadic plugin options.
  - **DDL isn't replicated**: after `CREATE TABLE data(id serial primary key, data text);` only `BEGIN 10297` / `COMMIT 10297` appear.
  - **get_changes consumes** (second call returns 0 rows); **`pg_logical_slot_peek_changes` does not consume** (repeatable).
  - A 2-row transaction yields: `BEGIN 10298`, `table public.data: INSERT: id[integer]:1 data[text]:'1'`, `table public.data: INSERT: id[integer]:2 data[text]:'2'`, `COMMIT 10298`.
  - Plugin options: `pg_logical_slot_peek_changes('regression_slot', NULL, NULL, 'include-timestamp', 'on')` -> `COMMIT 10299 (at 2017-05-10 12:07:21.272494-04)`.
  - `SELECT pg_drop_replication_slot('regression_slot');` — always drop unused slots.
- pg_recvlogical: `pg_recvlogical -d postgres --slot=test --create-slot` / `--start -f -` / `--drop-slot`; two-phase: `--create-slot --enable-two-phase` shows `PREPARE TRANSACTION 'test', txid 694` then later `COMMIT PREPARED 'test', txid 694`.
- Two-phase via SQL (slot created with twophase = true): after `PREPARE TRANSACTION 'test_prepared1'` get_changes returns `BEGIN 529`, the INSERT, `PREPARE TRANSACTION 'test_prepared1', txid 529`; after `COMMIT PREPARED` -> `COMMIT PREPARED 'test_prepared1', txid 529`; rollback -> `ROLLBACK PREPARED 'test_prepared2', txid 530`. (If not already decoded at prepare, the whole transaction is streamed after commit.)
- **Replication-protocol commands** (replication connection only, not SQL): `CREATE_REPLICATION_SLOT slot_name LOGICAL output_plugin`, `DROP_REPLICATION_SLOT slot_name [ WAIT ]`, `START_REPLICATION SLOT slot_name LOGICAL ...`. `pg_recvlogical` uses them.
- **Synchronous replication is supported only for slots used over the streaming replication interface**, not the SQL function interface or non-core interfaces.
- Views: **`pg_replication_slots`** (slot state; physical + logical), **`pg_stat_replication`** (streaming connections), **`pg_stat_replication_slots`** (statistics for logical slots).

### Logical decoding concepts: slots, slot sync, plugins, exported snapshots  [M7, M5]  (source: logicaldecoding-explanation.txt)
- **Logical decoding** = extracting all persistent changes to a database's tables into a coherent format interpretable without knowledge of internal state; implemented by **decoding the WAL** (storage-level changes) into an application-specific form (tuple stream, SQL statements).
- **Replication slot** (logical): a stream of changes replayable to a client **in the order they were made on the origin**; each slot streams changes from a **single database**. Slot identifier is **unique across all databases in the cluster**. Slots persist independently of connections and are **crash-safe**.
- A logical slot emits each change **just once in normal operation**, but the slot position is **persisted only at checkpoint** — after a crash it may return to an earlier LSN and resend recent changes. Clients must handle duplicates (record last LSN seen; or request start LSN over the protocol; replication origins exist for this).
- Multiple independent slots per database; normally one slot per consumer. A slot knows nothing about receivers; different receivers may use it at different times; **only one receiver may consume from a slot at a time**.
- **Logical slots on a hot standby**: set `hot_standby_feedback` on the standby (stops VACUUM removing needed catalog rows); if needed rows are removed anyway the slot is **invalidated**. Use a physical slot between primary and standby (otherwise feedback works only while connected). Existing standby logical slots are invalidated if the primary's `wal_level` drops below `logical`. Slot creation needs info about all running transactions; on a standby it waits for primary activity — speed up with `pg_log_standby_snapshot()` on the primary.
- **Caution**: slots persist across crashes and **prevent removal of required WAL and catalog rows even with no connection** — consumes storage; in extreme cases can force shutdown to prevent transaction ID wraparound. Drop unneeded slots.
- **Slot synchronization (failover slots)**: create with `failover` parameter of `pg_create_logical_replication_slot` or `failover` option of `CREATE SUBSCRIPTION`; on the standby enable **`sync_replication_slots`** (slotsync worker syncs periodically). Mandatory: physical slot between primary and standby (`primary_slot_name` on standby), `hot_standby_feedback` on, valid `dbname` in `primary_conninfo`. Recommended: list that physical slot in **`synchronized_standby_slots`** on the primary (prevents subscribers getting ahead of the standby; adds latency; primary shutdown waits for those standbys to confirm WAL up to the latest flush).
  - Manual: `pg_sync_replication_slots()` on the standby (testing/debugging; no cyclic retries).
  - The standby persists a synced slot only if the primary's slot still retains WAL and catalog rows available on the standby; else: `LOG: could not synchronize replication slot "failover_slot"` / `DETAIL: Synchronization could lead to data loss, because the remote slot needs WAL at LSN 0/3003F28 and catalog xmin 754, but the standby has LSN 0/3003F28 and catalog xmin 756.` Fix with no consumer: advance the slot on the primary via `pg_logical_slot_get_changes` / `pg_logical_slot_get_binary_changes`.
  - After failover only **persistent slots with `pg_replication_slots.synced = true`** can be used; temporary synced slots cannot. Resume: `ALTER SUBSCRIPTION ... CONNECTION` to the new primary; disable subscriptions before promotion and re-enable after (the old primary coming back could otherwise feed subscribers and cause inconsistency).
- **Output plugins** transform WAL's internal representation into the consumer's desired format.
- **Exported snapshots**: creating a slot via the replication interface (`CREATE_REPLICATION_SLOT`) **exports a snapshot** showing exactly the database state after which all changes are included in the stream. Use `SET TRANSACTION SNAPSHOT` to read that state (e.g. dump it), then apply the slot's changes — a new replica with no lost changes. Suppress with `SNAPSHOT 'nothing'`.

### Output plugin API  [M7]  (source: logicaldecoding-output-plugin.txt, logicaldecoding-writer.txt)
- Plugin = shared library named after the plugin, found on the normal library search path; must export **`_PG_output_plugin_init(struct OutputPluginCallbacks *cb)`** (`typedef void (*LogicalOutputPluginInit)`). Example: `contrib/test_decoding`.
- `OutputPluginCallbacks` fields (in order): `startup_cb, begin_cb, change_cb, truncate_cb, commit_cb, message_cb, filter_by_origin_cb, shutdown_cb, filter_prepare_cb, begin_prepare_cb, prepare_cb, commit_prepared_cb, rollback_prepared_cb, stream_start_cb, stream_stop_cb, stream_abort_cb, stream_prepare_cb, stream_commit_cb, stream_change_cb, stream_message_cb, stream_truncate_cb`.
- **Required**: `begin_cb`, `change_cb`, `commit_cb`. Optional: `startup_cb`, `truncate_cb` (TRUNCATE ignored if unset), `message_cb`, `filter_by_origin_cb`, `shutdown_cb`.
- **Streaming of in-progress transactions**: required `stream_start_cb`, `stream_stop_cb`, `stream_abort_cb`, `stream_commit_cb`, `stream_change_cb`; optional `stream_message_cb`, `stream_truncate_cb`; `stream_prepare_cb` required if two-phase is also supported.
- **Two-phase**: required `begin_prepare_cb`, `prepare_cb`, `commit_prepared_cb`, `rollback_prepared_cb`; optional `filter_prepare_cb`; `stream_prepare_cb` required if streaming is also supported.
- **Capabilities**: plugins may use most backend infrastructure (incl. type output functions). Read-only access only to relations created by initdb in `pg_catalog` or marked as **user catalog tables**: `ALTER TABLE user_catalog_table SET (user_catalog_table = true);` / `CREATE TABLE another_catalog_table(data text) WITH (user_catalog_table = true);`. Access must go through `systable_*` scan APIs (`heap_*` errors out). **Anything assigning a transaction ID is prohibited** (writing tables, DDL, `pg_current_xact_id()`).
- **Output modes**: `OutputPluginOptions.output_type` = `OUTPUT_PLUGIN_TEXTUAL_OUTPUT` (all data in server encoding) or `OUTPUT_PLUGIN_BINARY_OUTPUT`; set in the startup callback.
- **Decoding semantics**: concurrent transactions are decoded **in commit order**; only one transaction's changes appear between its begin and commit callbacks. **Rolled-back transactions are never decoded.** Successful savepoints are folded into their parent in execution order. Prepared transactions are decoded at PREPARE if the two-phase callbacks exist; if concurrently `ROLLBACK PREPARED`, decoding aborts, remaining changes are skipped and `prepare_cb` is still invoked.
- **Only transactions already safely flushed to disk are decoded** — with `synchronous_commit = off` a COMMIT may not appear in an immediately following `pg_logical_slot_get_changes()`.
- **Only changes in user tables that are not UNLOGGED and not TEMPORARY** can be extracted.
- Callback signatures:
  - `startup_cb(LogicalDecodingContext *ctx, OutputPluginOptions *options, bool is_init)` — called when a slot is created (`is_init` true) or asked to stream. `OutputPluginOptions { OutputPluginOutputType output_type; bool receive_rewrites; }` (`receive_rewrites` = also get changes from heap rewrites during DDL). Validate `ctx->output_plugin_options`; keep state in `ctx->output_plugin_private`.
  - `shutdown_cb(ctx)` — slot no longer in use (not necessarily dropped).
  - `begin_cb(ctx, ReorderBufferTXN *txn)` — start of a **committed** transaction; txn has commit timestamp and XID.
  - `commit_cb(ctx, txn, XLogRecPtr commit_lsn)`.
  - `change_cb(ctx, txn, Relation relation, ReorderBufferChange *change)` — **once per row** for INSERT/UPDATE/DELETE; may read catalogs; may error out on concurrent rollback when decoding prepared/in-progress transactions (decoding stops gracefully).
  - `truncate_cb(ctx, txn, int nrelations, Relation relations[], ReorderBufferChange *change)` — array because FK-connected tables truncate together.
  - `bool filter_by_origin_cb(ctx, RepOriginId origin_id)` — return **true to filter away**; for cascading/multidirectional replication (avoid ping-pong); more efficient than inspecting each change.
  - `message_cb(ctx, txn, XLogRecPtr message_lsn, bool transactional, const char *prefix, Size message_size, const char *message)` — logical decoding messages (`pg_logical_emit_message`); txn may be NULL for non-transactional messages without an XID; choose a unique prefix.
  - `bool filter_prepare_cb(ctx, TransactionId xid, const char *gid)` — true = skip decoding at prepare (decode as one-phase at COMMIT PREPARED); default false; must answer consistently per (xid, gid).
  - `begin_prepare_cb(ctx, txn)`; `prepare_cb(ctx, txn, XLogRecPtr prepare_lsn)`; `commit_prepared_cb(ctx, txn, XLogRecPtr commit_lsn)`; `rollback_prepared_cb(ctx, txn, XLogRecPtr prepare_end_lsn, TimestampTz prepare_time)` (gid alone is insufficient — the downstream may have its own prepared xact with the same identifier).
  - `stream_start_cb(ctx, txn)`, `stream_stop_cb(ctx, txn)`, `stream_abort_cb(ctx, txn, XLogRecPtr abort_lsn)`, `stream_prepare_cb(ctx, txn, XLogRecPtr prepare_lsn)`, `stream_commit_cb(ctx, txn, XLogRecPtr commit_lsn)`, `stream_change_cb(ctx, txn, relation, change)`, `stream_message_cb(...)`, `stream_truncate_cb(...)`.
- **Producing output**: write to the `StringInfo` `ctx->out` between `OutputPluginPrepareWrite(ctx, last_write)` and `OutputPluginWrite(ctx, last_write)`: `OutputPluginPrepareWrite(ctx, true); appendStringInfo(ctx->out, "BEGIN %u", txn->xid); OutputPluginWrite(ctx, true);`
- **Output writers** (47.7): new output methods need three functions — read WAL, prepare writing output, write the output (see `src/backend/replication/logical/logicalfuncs.c`).

### Synchronous replication support for logical decoding  [M7, M5]  (source: logicaldecoding-synchronous.txt)
- Logical decoding can build synchronous replication with the same user interface as streaming sync replication, but **only via the streaming replication interface**; clients must send `Standby status update (F)` messages like physical standbys.
- A logical synchronous replica works in the scope of **one database**, whereas `synchronous_standby_names` is **server-wide** — the technique "will not work properly if more than one database is actively used".
- **Deadlock caveat**: decoding may lock catalog tables to read them, so a transaction holding an exclusive lock on [user] catalog tables can deadlock in a synchronous setup. Ways it happens:
  1. explicit `LOCK` on `pg_class` in a transaction;
  2. `CLUSTER` on `pg_class` in a transaction;
  3. `PREPARE TRANSACTION` after `LOCK` on `pg_class`, with two-phase decoding enabled;
  4. `PREPARE TRANSACTION` after `CLUSTER` on `pg_trigger`, with two-phase decoding enabled (deadlocks only when a published table has a trigger);
  5. `TRUNCATE` on a [user] catalog table in a transaction.
  - Applies to other catalog tables too, not only those listed. Fix: never take exclusive locks on [user] catalog tables.

### Streaming of large in-progress transactions  [M7]  (source: logicaldecoding-streaming.txt)
- The basic callbacks (`begin_cb`, `change_cb`, `commit_cb`, `message_cb`) are invoked **only when the transaction commits**. Changes are decoded from WAL incrementally (and may **spill to disk** to bound memory) but are passed to the plugin at commit and discarded on abort. So a big transaction is transmitted all at once when its commit is decoded => large apply lag.
- Streaming callbacks: required `stream_start_cb`, `stream_stop_cb`, `stream_abort_cb`, `stream_commit_cb`, `stream_change_cb`; optional `stream_message_cb`, `stream_truncate_cb`; plus two-phase callbacks if streaming of two-phase commands is wanted.
- Changes and messages are streamed in **blocks demarcated by `stream_start_cb` / `stream_stop_cb`**; afterwards `stream_commit_cb` (or `stream_abort_cb`); with two-phase: `stream_prepare_cb`, then `commit_prepared_cb` or `rollback_prepared_cb`.
- Documented example sequence for one transaction:
  ```
  stream_start_cb(...);   <-- start of first block of changes
    stream_change_cb(...); stream_change_cb(...); stream_message_cb(...); stream_change_cb(...); ...
  stream_stop_cb(...);    <-- end of first block of changes
  stream_start_cb(...);   <-- start of second block of changes
    stream_change_cb(...); ... stream_message_cb(...); stream_change_cb(...);
  stream_stop_cb(...);    <-- end of second block of changes
  [a. normal commit]     stream_commit_cb(...);
  [b. two-phase commit]  stream_prepare_cb(...); commit_prepared_cb(...);
  ```
  Real sequences interleave blocks of several streamed transactions; some may abort.
- **Trigger** (same as spill-to-disk): total decoded changes **for all in-progress transactions** exceed **`logical_decoding_work_mem`**; then the **largest top-level transaction** (by memory used for decoded changes) is selected and streamed. Spilling to disk can still be needed with streaming enabled when the threshold is exceeded but a complete tuple hasn't been decoded (e.g. only the toast-table insert decoded, not the main-table insert).
- Even with streaming, **changes are applied in commit order** — same guarantees as non-streaming mode.

### Two-phase commit support for logical decoding  [M7]  (source: logicaldecoding-two-phase-commits.txt)
- With only the basic callbacks: `PREPARE TRANSACTION` is **ignored**, `COMMIT PREPARED` is decoded as a **COMMIT**, `ROLLBACK PREPARED` as a **ROLLBACK**.
- Required for two-phase: `begin_prepare_cb`, `prepare_cb`, `commit_prepared_cb`, `rollback_prepared_cb`, `stream_prepare_cb`; optional `filter_prepare_cb`.
- With them, **at `PREPARE TRANSACTION` the transaction's changes are decoded and passed to the plugin, then `prepare_cb` is invoked** (unlike basic mode, where changes are passed only at commit). Start is signalled by `begin_prepare_cb`. `ROLLBACK PREPARED` -> `rollback_prepared_cb`; `COMMIT PREPARED` -> `commit_prepared_cb`.
- `filter_prepare_cb` lets a plugin decode only some transactions in two phases (pattern match on gid, or lookup by xid).
- Cautions: (1) if the prepared transaction locked [user] catalog tables exclusively, decoding the prepare can **block until the main transaction is committed**; (2) a distributed two-phase commit solution built on this can **deadlock** in the same situation — avoid locks on catalog tables (e.g. explicit `LOCK`) in such transactions.

### Replication progress tracking (replication origins)  [M7]  (source: replication-origins.txt)
- Replication origins make it easier to build logical replication on top of logical decoding. Two problems solved: (1) safely tracking replication progress; (2) changing behaviour based on the origin of a row, e.g. preventing loops in bi-directional replication.
- An origin has just two properties: a **name** (free-form text; used to refer to the origin across systems; prefix with the replication solution's name to avoid conflicts) and an **ID** (used only for space efficiency; **never share across systems**).
- Create with `pg_replication_origin_create()`, drop with `pg_replication_origin_drop()`, see in catalog **`pg_replication_origin`**.
- Naive progress tracking (updating a table row per replayed transaction) has run-time overhead and bloat. Instead: mark the session as replaying from a remote node with `pg_replication_origin_session_setup()`; set the source transaction's **LSN and commit timestamp** per transaction with `pg_replication_origin_xact_setup()`. Progress then **persists in a crash-safe manner**.
- Progress of all origins: view **`pg_replication_origin_status`**. One origin: `pg_replication_origin_progress()` (any origin) or `pg_replication_origin_session_progress()` (origin configured in the current session).
- Loop prevention: every change and transaction generated by a session configured this way is **tagged with that session's origin** when passed to output plugin callbacks, so the plugin can e.g. ignore all but locally-originating rows. `filter_by_origin_cb` filters the stream by source — less flexible but considerably more efficient than filtering in the plugin.

### Archive modules  [M7]  (source: archive-modules.txt, archive-module-init.txt, archive-module-callbacks.txt)
- Custom modules for continuous archiving (Section 25.3). `archive_command` (shell) is simpler, but a module is "often considerably more robust and performant".
- With **`archive_library`** set, PostgreSQL submits completed WAL files to the module and **does not recycle or remove them until the module reports success**. Modules may also declare GUCs and register background workers. Working example: **`contrib/basic_archive`**.
- Loaded as a shared library named by `archive_library` (normal library search path). Must export **`_PG_archive_module_init`** returning a pointer of server lifetime (typically `static const`) to:
  ```c
  typedef struct ArchiveModuleCallbacks
  {
      ArchiveStartupCB startup_cb;
      ArchiveCheckConfiguredCB check_configured_cb;
      ArchiveFileCB archive_file_cb;
      ArchiveShutdownCB shutdown_cb;
  } ArchiveModuleCallbacks;
  typedef const ArchiveModuleCallbacks *(*ArchiveModuleInit) (void);
  ```
  **Only `archive_file_cb` is required.**
- `typedef void (*ArchiveStartupCB) (ArchiveModuleState *state);` — shortly after load; state in `state->private_data`.
- `typedef bool (*ArchiveCheckConfiguredCB) (ArchiveModuleState *state);` — is the module fully configured? If undefined, always assumed configured. Returning false stops archiving and logs `WARNING:  archive_mode enabled, yet archiving is not configured`; the server re-calls periodically. Add a DETAIL line with the `arch_module_check_errdetail` macro (format string + args, like `errdetail()`).
- `typedef bool (*ArchiveFileCB) (ArchiveModuleState *state, const char *file, const char *path);` — archive one WAL file; `file` = file name only, `path` = full path including the name. **true** => server proceeds as if archived (may recycle/remove the WAL file); **false or error** => WAL file kept and retried later. Called in a **short-lived memory context reset between invocations** (create a longer-lived context in `startup_cb` if needed).
- `typedef void (*ArchiveShutdownCB) (ArchiveModuleState *state);` — archiver process exits (e.g. after an error) or `archive_library` changes; free state.

### OAuth validator modules (new authentication plumbing)  [M6, M1]  (source: oauth-validators.txt, oauth-validator-design.txt, oauth-validator-init.txt, oauth-validator-callbacks.txt)
- Server-side validation of **OAuth bearer tokens**. Because OAuth implementations vary and validation depends on the issuer, **the server cannot check the token itself**; validator modules integrate the server with the provider. Minimum: an init function + the validate callback.
- Warnings: a misbehaving validator may let unauthorized users in; "a malfunctioning validator is potentially worse than no authentication at all" (false sense of security; may aid attacks on the rest of the OAuth ecosystem).
- **Three responsibilities**:
  1. **Validate the token** — *online* (usually OAuth Token Introspection: fewer steps, central revocation, but at least one network call per authentication attempt, all within `authentication_timeout`; provider may not offer introspection to external resource servers) or *offline* (maintain trusted signing keys, verify signature and contents: **issuer**, **audience**, **validity period**; no central revocation, so consider capping token lifetime). If validation fails, fail immediately.
  2. **Authorize the client** — check the token's **scopes** cover database access for the current HBA parameters (prevents a client obtaining a token under false pretenses; the provider prompts the user). Authorizing without explicit scopes removes the user from the loop; then access must be restricted to trusted clients (client and server controlled by the same entity — libpq's **Device Authorization flow usually does not qualify**).
  3. **Authenticate the end user** — determine a user identifier (from the provider or the token's **claims**) and return it; the server makes the final decision via HBA. Identifier is visible as **`system_user`** and logged if `log_connections` is enabled. Choose trustworthy claims (not a changeable display name).
- **Coding guidelines**: *Token confidentiality* — never write tokens or pieces of them to the server log, even invalid ones; when sending tokens over the network authenticate the peer and use strong transport security. *Logging* — log verification problems at **`COMMERROR`** and return normally instead of ERROR/FATAL (avoid leaking info to unauthenticated clients). *Interruptibility* — stay interruptible (`WaitLatchOrSocket()`, `WaitEventSetWait()`, periodic `CHECK_FOR_INTERRUPTS()`), else backends become unresponsive to auth timeouts and pg_ctl shutdown. *Testing* — negative testing is mandatory. *Documentation* — document the authn ID format (email? org ID? UUID?) for `pg_ident` maps and whether `delegate_ident_mapping=1` is safe.
- **Usermap delegation**: normally the identifier is compared to `pg_ident.conf` mappings. HBA option **`delegate_ident_mapping`** bypasses username mapping: the module itself authorizes the connection (scopes or equivalent); the identifier is still recorded but plays no part. Authentication becomes optional — **anonymous/pseudonymous login** is possible. Makes the validator a **single point of failure**.
- **Init**: modules are loaded on demand from the libraries listed in GUC **`oauth_validator_libraries`** when a login requests them. Must export **`_PG_oauth_validator_module_init`** returning a server-lifetime pointer to:
  ```c
  typedef struct OAuthValidatorCallbacks
  {
      uint32        magic;            /* must be set to PG_OAUTH_VALIDATOR_MAGIC */
      ValidatorStartupCB startup_cb;
      ValidatorShutdownCB shutdown_cb;
      ValidatorValidateCB validate_cb;
  } OAuthValidatorCallbacks;
  typedef const OAuthValidatorCallbacks *(*OAuthValidatorModuleInit) (void);
  ```
  **Only `validate_cb` is required.**
- `typedef void (*ValidatorStartupCB) (ValidatorModuleState *state);` — directly after load; `state->private_data`.
- `typedef bool (*ValidatorValidateCB) (const ValidatorModuleState *state, const char *token, const char *role, ValidatorModuleResult *result);` — `token` is syntactically well-formed only (no other validation done); `role` is the requested login role. `typedef struct ValidatorModuleResult { bool authorized; char *authn_id; } ValidatorModuleResult;`
  - Connection proceeds **only if `result->authorized` is true**. `authn_id` must be palloc'd, or NULL if the token is valid but the identity cannot be determined.
  - Return **false** = internal error (results ignored, connection fails); return **true** = token processed and a decision made.
  - Normally `authn_id` must **exactly match the role** being logged in as (modifiable with a usermap); with `delegate_ident_mapping` PostgreSQL makes **no check on `authn_id`**.
- `typedef void (*ValidatorShutdownCB) (ValidatorModuleState *state);` — backend finished validating tokens for the connection; free state.

## Complete inventories

### Polymorphic pseudo-types (Table 36.1)
| Name | Family | Accepts |
|---|---|---|
| anyelement | Simple | any data type |
| anyarray | Simple | any array type |
| anynonarray | Simple | any non-array type |
| anyenum | Simple | any enum type |
| anyrange | Simple | any range type |
| anymultirange | Simple | any multirange type |
| anycompatible | Common | any type, args promoted to a common type |
| anycompatiblearray | Common | any array type, promoted |
| anycompatiblenonarray | Common | any non-array type, promoted |
| anycompatiblerange | Common | any range type, promoted |
| anycompatiblemultirange | Common | any multirange type, promoted |

C-only: `"any"` and `VARIADIC "any"`. Other pseudo-types named in the slice: `trigger`, `event_trigger`, `language_handler`, `internal`, `cstring`, `record`, `void`.

### Function kinds, attributes and parameter modes
- Kinds: SQL-language, procedural-language, internal (`LANGUAGE internal`), C-language (`LANGUAGE C`).
- Volatility: `VOLATILE` (default), `STABLE`, `IMMUTABLE`.
- Parallel safety: `PARALLEL UNSAFE`, `PARALLEL RESTRICTED`, `PARALLEL SAFE`.
- Other attributes seen: `STRICT`, `SECURITY DEFINER`, `LEAKPROOF`, `COST`, `ROWS`, `SUPPORT`, `SET search_path = ...`.
- Parameter modes: `IN` (default), `OUT`, `INOUT`, `VARIADIC`; `RETURNS TABLE(...)`, `RETURNS SETOF`.
- Routine commands named: `CREATE FUNCTION`, `CREATE PROCEDURE`, `CALL`, `ALTER ROUTINE`, `DROP ROUTINE`, `DROP FUNCTION` (no `CREATE ROUTINE`).

### Planner support request types
`SupportRequestSimplify`, `SupportRequestSelectivity`, `SupportRequestCost`, `SupportRequestRows`, `SupportRequestIndexCondition`.

### SQL type -> C type (Table 36.2)
| SQL | C | Header |
|---|---|---|
| boolean | bool | postgres.h (maybe compiler built-in) |
| box | BOX* | utils/geo_decls.h |
| bytea | bytea* | postgres.h |
| "char" | char | (compiler built-in) |
| character | BpChar* | postgres.h |
| cid | CommandId | postgres.h |
| date | DateADT | utils/date.h |
| float4 (real) | float4 | postgres.h |
| float8 (double precision) | float8 | postgres.h |
| int2 (smallint) | int16 | postgres.h |
| int4 (integer) | int32 | postgres.h |
| int8 (bigint) | int64 | postgres.h |
| interval | Interval* | datatype/timestamp.h |
| lseg | LSEG* | utils/geo_decls.h |
| name | Name | postgres.h |
| numeric | Numeric | utils/numeric.h |
| oid | Oid | postgres.h |
| oidvector | oidvector* | postgres.h |
| path | PATH* | utils/geo_decls.h |
| point | POINT* | utils/geo_decls.h |
| regproc | RegProcedure | postgres.h |
| text | text* | postgres.h |
| tid | ItemPointer | storage/itemptr.h |
| time | TimeADT | utils/date.h |
| time with time zone | TimeTzADT | utils/date.h |
| timestamp | Timestamp | datatype/timestamp.h |
| timestamp with time zone | TimestampTz | datatype/timestamp.h |
| varchar | VarChar* | postgres.h |
| xid | TransactionId | postgres.h |

### fmgr / C API names in the slice
- Module: `PG_MODULE_MAGIC`, `PG_MODULE_MAGIC_EXT(.name, .version)`, `_PG_init`, `pg_get_loaded_modules()`.
- Calling: `PG_FUNCTION_INFO_V1`, `PG_FUNCTION_ARGS`, `PG_GETARG_xxx`, `PG_GETARG_xxx_COPY`, `PG_GETARG_xxx_SLICE`, `PG_ARGISNULL`, `PG_RETURN_xxx`, `PG_RETURN_NULL`, `PG_NARGS`, `PG_GET_COLLATION`, `DirectFunctionCalln`, `DirectFunctionCall2Coll`, `OidFunctionCalln`.
- Varlena: `VARHDRSZ`, `VARHDRSZ_SHORT`, `SET_VARSIZE`, `VARSIZE`, `VARSIZE_ANY_EXHDR`, `VARDATA`, `VARDATA_ANY`, `PG_DETOAST_DATUM`, `PG_DETOAST_DATUM_PACKED`, `VARATT_IS_EXPANDED_HEADER`.
- Rows/sets: `get_call_result_type`, `get_expr_result_type`, `get_func_result_type`, `BlessTupleDesc`, `TupleDescGetAttInMetadata`, `heap_form_tuple`, `BuildTupleFromCStrings`, `HeapTupleGetDatum`, `GetAttributeByName`, `GetAttributeByNum`, `SRF_IS_FIRSTCALL`, `SRF_FIRSTCALL_INIT`, `SRF_PERCALL_SETUP`, `SRF_RETURN_NEXT`, `SRF_RETURN_DONE`.
- Polymorphism: `get_fn_expr_rettype`, `get_fn_expr_argtype`, `get_fn_expr_variadic`.
- Shared state: `RequestAddinShmemSpace`, `ShmemInitStruct`, `AddinShmemInitLock`, `shmem_request_hook`, `shmem_startup_hook`, `GetNamedDSMSegment`, `RequestNamedLWLockTranche`, `GetNamedLWLockTranche`, `LWLockNewTrancheId`, `LWLockInitialize`, `LWLockRegisterTranche`, `WaitEventExtensionNew`, `pgstat_register_kind`, `PGSTAT_KIND_EXPERIMENTAL`.
- Injection points: `INJECTION_POINT`, `INJECTION_POINT_LOAD`, `INJECTION_POINT_CACHED`, `IS_INJECTION_POINT_ATTACHED`, `InjectionPointAttach`, `InjectionPointDetach`, `WaitEventInjectionPointNew`.
- Aggregates: `AggCheckCallContext`, `AggGetAggref`.

### CREATE AGGREGATE parameters seen
`sfunc`, `stype`, `initcond`, `finalfunc`, `finalfunc_extra`, `msfunc`, `minvfunc`, `mstype`, `minitcond`, combine function, serialization function, deserialization function, final-function modify flags `READ_ONLY` / `SHAREABLE` / `READ_WRITE`, `PARALLEL SAFE`, direct args + `ORDER BY` (ordered-set), `VARIADIC`.

### CREATE TYPE (base) parameters seen
`internallength` (number or `variable`), `input`, `output`, `receive`, `send`, `alignment`, storage option (`plain`, `external`, `extended`, `main`).

### Operator optimization clauses and estimators
- Clauses: `COMMUTATOR`, `NEGATOR`, `RESTRICT`, `JOIN`, `HASHES`, `MERGES`.
- Restriction estimators: `eqsel`, `neqsel`, `scalarltsel`, `scalarlesel`, `scalargtsel`, `scalargesel`, `matchingsel`, `areasel`, `positionsel`, `contsel`.
- Join estimators: `eqjoinsel`, `neqjoinsel`, `scalarltjoinsel`, `scalarlejoinsel`, `scalargtjoinsel`, `scalargejoinsel`, `matchingjoinsel`, `areajoinsel`, `positionjoinsel`, `contjoinsel`.

### Index strategy numbers
| AM | Strategies |
|---|---|
| B-tree | 1 `<`, 2 `<=`, 3 `=`, 4 `>=`, 5 `>` |
| Hash | 1 `=` |
| GiST (2-D R-tree example) | 1 strictly left of, 2 does not extend to right of, 3 overlaps, 4 does not extend to left of, 5 strictly right of, 6 same, 7 contains, 8 contained by, 9 does not extend above, 10 strictly below, 11 strictly above, 12 does not extend below |
| SP-GiST (point example) | 1 strictly left of, 5 strictly right of, 6 same, 8 contained by, 10 strictly below, 11 strictly above |
| GIN (array example) | 1 overlap, 2 contains, 3 is contained by, 4 equal |
| BRIN (minmax example) | 1 `<`, 2 `<=`, 3 `=`, 4 `>=`, 5 `>` |

### Index support function numbers
| AM | Support functions (number: role) |
|---|---|
| B-tree | 1 compare (required); 2 sortsupport; 3 in_range; 4 equalimage (dedup safety); 5 options; 6 skipsupport |
| Hash | 1 32-bit hash (required); 2 64-bit salted hash; 3 options |
| GiST | 1 consistent; 2 union; 3 compress (opt); 4 decompress (opt); 5 penalty; 6 picksplit; 7 same; 8 distance (opt); 9 fetch (opt); 10 options (opt); 11 sortsupport (opt); 12 translate_cmptype (opt) |
| SP-GiST | 1 config; 2 choose; 3 picksplit; 4 inner_consistent; 5 leaf_consistent; 6 options (opt) |
| GIN | 1 compare; 2 extractValue; 3 extractQuery; 4 consistent (opt if 6); 5 comparePartial (opt); 6 triConsistent (opt if 4); 7 options (opt) |
| BRIN | 1 opcInfo; 2 add_value; 3 consistent; 4 union; 5 options (opt) |

AM capabilities stated: ordering operators — GiST, SP-GiST; lossy/recheck — GiST, SP-GiST, GIN; `STORAGE` differing from column type — GiST, SP-GiST, GIN, BRIN.

### Extension control-file parameters
| Parameter | Type | Default / notes |
|---|---|---|
| directory | string | control file's directory |
| default_version | string | none (CREATE EXTENSION then needs VERSION) |
| comment | string | applied at creation only |
| encoding | string | database encoding assumed |
| module_pathname | string | no substitution if unset |
| requires | string | list of prerequisite extensions |
| no_relocate | string | list of required extensions barred from SET SCHEMA |
| superuser | boolean | true |
| trusted | boolean | false |
| relocatable | boolean | false |
| schema | string | non-relocatable only; consulted at creation only |

- File names: `extension.control`, `extension--version.control` (secondary), `extension--version.sql` (install), `extension--old--target.sql` (update). Location `SHAREDIR/extension` or `extension_control_path`.
- Script substitutions: `MODULE_PATHNAME`, `@extschema@`, `@extschema:name@`, `@extowner@`; `\echo` lines ignored.
- Commands/functions: `CREATE EXTENSION [SCHEMA] [VERSION]`, `DROP EXTENSION`, `ALTER EXTENSION ... UPDATE`, `ALTER EXTENSION ... SET SCHEMA`, `ALTER EXTENSION ... DROP TABLE`, `pg_extension_config_dump(regclass, text)`, `pg_extension_update_paths(name)`; catalog `pg_init_privs`.

### PGXS makefile variables
`MODULES`, `MODULE_big`, `PROGRAM`, `OBJS`, `EXTENSION`, `MODULEDIR`, `DATA`, `DATA_built`, `DATA_TSEARCH`, `DOCS`, `HEADERS`, `HEADERS_built`, `HEADERS_$MODULE`, `HEADERS_built_$MODULE`, `SCRIPTS`, `SCRIPTS_built`, `REGRESS`, `REGRESS_OPTS`, `ISOLATION`, `ISOLATION_OPTS`, `TAP_TESTS`, `NO_INSTALL`, `NO_INSTALLCHECK`, `EXTRA_CLEAN`, `PG_CPPFLAGS` (prepended to CPPFLAGS), `PG_CFLAGS` (appended), `PG_CXXFLAGS` (appended), `PG_LDFLAGS` (prepended), `PG_LIBS` (PROGRAM link line), `SHLIB_LINK` (MODULE_big link line), `PG_CONFIG`; make variables `prefix`, `VPATH`.

### Trigger inventory
| Timing | Level | Events | Relations | WHEN | Transition tables | Return value |
|---|---|---|---|---|---|---|
| BEFORE | STATEMENT | INSERT, UPDATE, DELETE, TRUNCATE | tables, foreign tables, views (needs INSTEAD OF trigger; no TRUNCATE) | yes | no | NULL |
| AFTER | STATEMENT | INSERT, UPDATE, DELETE, TRUNCATE | same | yes | yes | NULL |
| BEFORE | ROW | INSERT, UPDATE, DELETE | tables, foreign tables | yes | no | NULL = skip row; row = replacement (INSERT/UPDATE) |
| AFTER | ROW | INSERT, UPDATE, DELETE | tables, foreign tables | yes (decides queueing) | yes | ignored |
| INSTEAD OF | ROW | INSERT, UPDATE, DELETE | views | no | no | NULL = nothing done; row = done, counted |

- Statement firing order for one command: BEFORE STATEMENT -> per row: BEFORE ROW, operation -> AFTER ROW (queued, end of statement) -> AFTER STATEMENT. Ties: alphabetical by trigger name. Constraint triggers may defer to end of transaction.
- `TriggerData` fields: `type`, `tg_event`, `tg_relation`, `tg_trigtuple`, `tg_newtuple`, `tg_trigger`, `tg_trigslot`, `tg_newslot`, `tg_oldtable`, `tg_newtable`, `tg_updatedcols`.
- `Trigger` fields: `tgoid`, `tgname`, `tgfoid`, `tgtype`, `tgenabled`, `tgisinternal`, `tgisclone`, `tgconstrrelid`, `tgconstrindid`, `tgconstraint`, `tgdeferrable`, `tginitdeferred`, `tgnargs`, `tgnattr`, `tgattr`, `tgargs`, `tgqual`, `tgoldtable`, `tgnewtable`.
- Macros: `CALLED_AS_TRIGGER`, `TRIGGER_FIRED_BEFORE`, `TRIGGER_FIRED_AFTER`, `TRIGGER_FIRED_INSTEAD`, `TRIGGER_FIRED_FOR_ROW`, `TRIGGER_FIRED_FOR_STATEMENT`, `TRIGGER_FIRED_BY_INSERT`, `TRIGGER_FIRED_BY_UPDATE`, `TRIGGER_FIRED_BY_DELETE`, `TRIGGER_FIRED_BY_TRUNCATE`.

### Event trigger inventory
| Event | Fires | Helper functions |
|---|---|---|
| login | when an authenticated user logs in (also on standbys) | — |
| ddl_command_start | just before a covered DDL command | — |
| table_rewrite | just before ALTER TABLE / ALTER TYPE rewrites a table (not CLUSTER, VACUUM) | `pg_event_trigger_table_rewrite_oid()`, `pg_event_trigger_table_rewrite_reason()` |
| sql_drop | just before ddl_command_end, for operations dropping objects | `pg_event_trigger_dropped_objects()` |
| ddl_command_end | just after a covered DDL command | `pg_event_trigger_ddl_commands()` |

- Covered commands: CREATE, ALTER, DROP, COMMENT, GRANT, IMPORT FOREIGN SCHEMA, REINDEX, REFRESH MATERIALIZED VIEW, REVOKE, SECURITY LABEL, SELECT INTO.
- Never covered: commands on databases, roles (definitions and memberships), tablespaces, parameter privileges; ALTER SYSTEM; commands on event triggers themselves.
- Commands: `CREATE EVENT TRIGGER`, `ALTER EVENT TRIGGER ... DISABLE | ENABLE | ENABLE ALWAYS`; psql `\dy`; GUC `event_triggers`.
- `EventTriggerData` fields: `type`, `event`, `parsetree`, `tag`; macro `CALLED_AS_EVENT_TRIGGER`.

### Rule system inventory
- Query tree parts: command type, range table, result relation, target list, qualification, join tree, others.
- Rule kinds: ON SELECT (one unconditional INSTEAD SELECT action; `_RETURN`; in-place rewrite; applied last) vs ON INSERT/UPDATE/DELETE (0..n actions; ALSO default or INSTEAD; optional qualification; NEW/OLD; produce new trees).
- One-action rewrite output:

  | Rule | Trees produced |
  |---|---|
  | unqualified ALSO | action(+orig qual); original |
  | unqualified INSTEAD | action(+orig qual) |
  | qualified ALSO | action(+rule qual +orig qual); original |
  | qualified INSTEAD | action(+rule qual +orig qual); original(+NOT rule qual) |
- Execution order: INSERT — original first; UPDATE/DELETE — original last.
- View update mechanisms in precedence order: INSTEAD rules, INSTEAD OF triggers, automatic updatability.
- Unsupported with update rules: `WITH` in the original query; multi-assignment sub-SELECT in UPDATE SET; MERGE on a relation with non-SELECT rules.
- View options named: `security_barrier`, security invoker.

### Procedural languages
| Language | Trusted | Installed by default |
|---|---|---|
| PL/pgSQL | yes | yes, in all databases |
| PL/Tcl | yes | no (built if Tcl configured) |
| PL/TclU | no | no |
| PL/Perl | yes | no (built if Perl configured) |
| PL/PerlU | no | no |
| PL/PythonU | no | no (built if Python configured) |

Handler functions: call handler `() RETURNS language_handler`; inline handler `(internal) RETURNS void`; validator `(oid) RETURNS void`.

### Output plugin callbacks (21)
| Callback | Basic | Streaming | Two-phase |
|---|---|---|---|
| startup_cb | optional | | |
| begin_cb | required | | |
| change_cb | required | | |
| truncate_cb | optional | | |
| commit_cb | required | | |
| message_cb | optional | | |
| filter_by_origin_cb | optional | | |
| shutdown_cb | optional | | |
| filter_prepare_cb | | | optional |
| begin_prepare_cb | | | required |
| prepare_cb | | | required |
| commit_prepared_cb | | | required |
| rollback_prepared_cb | | | required |
| stream_start_cb | | required | |
| stream_stop_cb | | required | |
| stream_abort_cb | | required | |
| stream_prepare_cb | | required if two-phase | required if streaming |
| stream_commit_cb | | required | |
| stream_change_cb | | required | |
| stream_message_cb | | optional | |
| stream_truncate_cb | | optional | |

Module entry points across the slice: `_PG_init`, `_PG_output_plugin_init`, `_PG_archive_module_init`, `_PG_oauth_validator_module_init`.

### Logical decoding / replication SQL functions, protocol commands, views
- Functions: `pg_create_logical_replication_slot(name, plugin, temporary, twophase, [failover])`, `pg_drop_replication_slot`, `pg_logical_slot_get_changes`, `pg_logical_slot_peek_changes`, `pg_logical_slot_get_binary_changes`, `pg_log_standby_snapshot`, `pg_sync_replication_slots`, `pg_replication_origin_create`, `pg_replication_origin_drop`, `pg_replication_origin_session_setup`, `pg_replication_origin_xact_setup`, `pg_replication_origin_progress`, `pg_replication_origin_session_progress`.
- Protocol: `CREATE_REPLICATION_SLOT slot_name LOGICAL output_plugin` (option `SNAPSHOT 'nothing'`), `DROP_REPLICATION_SLOT slot_name [ WAIT ]`, `START_REPLICATION SLOT slot_name LOGICAL ...`.
- Client: `pg_recvlogical` (`--create-slot`, `--start`, `--drop-slot`, `--enable-two-phase`, `-f -`, `--slot`, `-d`).
- Views/catalogs: `pg_replication_slots` (columns shown: slot_name, plugin, slot_type, database, active, restart_lsn, confirmed_flush_lsn, synced), `pg_stat_replication`, `pg_stat_replication_slots`, `pg_replication_origin`, `pg_replication_origin_status`.
- Other catalogs in the slice: `pg_rewrite`, `pg_init_privs`, `pg_stat_activity` (wait_event_type `Extension`), `pg_class.relpages`.

### GUCs mentioned in this slice
(This slice gives no default values for these; defaults must come from the server-configuration slice.)
`dynamic_library_path`, `shared_preload_libraries`, `extension_control_path`, `event_triggers`, `debug_print_parse`, `debug_print_rewritten`, `debug_print_plan`, `TimeZone`, `search_path`, `wal_level` (must be `logical`), `max_replication_slots` (>= 1), `max_wal_senders`, `max_prepared_transactions` (>= 1 for two-phase), `hot_standby_feedback`, `sync_replication_slots`, `synchronized_standby_slots`, `primary_slot_name`, `primary_conninfo`, `synchronous_commit`, `synchronous_standby_names`, `logical_decoding_work_mem`, `archive_library`, `archive_command`, `archive_mode`, `oauth_validator_libraries`, `authentication_timeout`, `log_connections`. Table storage parameter: `user_catalog_table`. HBA option: `delegate_ident_mapping`.

## Lesson ideas

### Visualizer ideas
- **Volatility & snapshots**: timeline of one UPDATE statement calling three functions per row. VOLATILE re-evaluates per row and takes a fresh snapshot (sees rows changed so far); STABLE evaluates against the statement-start snapshot and can be collapsed to one call / used as an index condition; IMMUTABLE with constant args is folded at plan time. Second scene: a prepared statement reusing a stale folded constant from a wrongly IMMUTABLE function.
- **Polymorphic resolution**: drag actual argument types onto `f(anyelement, anyarray)` vs `f(anycompatible, anycompatible)`; show the type variable binding, the UNION-style common-type choice, and failures (`unknown` literal, `integer` vs `numeric`).
- **SRF lockstep**: `SELECT srf_a(), srf_b() FROM t` — animate the implicit `LATERAL ROWS FROM`, NULL padding to the longest, nested levels, and the parse error inside CASE.
- **Aggregate state machine**: state box updated by `sfunc` per row, `finalfunc` at the end; strict-sfunc/NULL-initcond shortcut; avg's `{count,sum,sumsq}` array. Add a sliding window frame showing recompute-from-scratch vs `minvfunc`, and the `unsafe_sum` 1e20 failure. Add parallel workers producing partial states merged by a combine function, with serialize/deserialize across processes.
- **Operator class anatomy**: an index AM as a socket with numbered strategy slots (1-5 for btree) and support slots (1 cmp, 2 sortsupport, 3 in_range, 4 equalimage, 6 skipsupport); plug in `complex_abs_ops`. Show the `integer_ops` family with loose cross-type operators.
- **Commutator flip**: planner turning `tab1.x = tab2.y` into `tab2.y = tab1.x` to use an index; NEGATOR turning `NOT (x = y)` into `x <> y`.
- **Extension version graph**: nodes = versions, edges = update scripts; highlight the shortest path chosen by CREATE/ALTER EXTENSION and the downgrade-plus-fast-path trap.
- **Trigger timeline**: statement BEFORE -> row loop (BEFORE row, generated columns computed, heap operation, AFTER event queued or skipped by WHEN) -> queued AFTER row events -> statement AFTER. Toggles: BEFORE returns NULL; ON CONFLICT DO UPDATE; cross-partition UPDATE; MERGE; deferred constraint trigger. Side panel showing what a `SELECT count(*)` inside each trigger sees (the `trigf` 0/1, 2/1/0/0 numbers).
- **Event trigger sequence**: one `ALTER TABLE` flowing through ddl_command_start, table_rewrite, sql_drop, ddl_command_end, with an error at each stage showing what is rolled back; list of commands that bypass (shared objects).
- **Rewriter in the pipeline**: parser -> rewriter -> planner -> executor, with the query tree's six parts as panels. Scene 1: `SELECT * FROM shoe_ready WHERE total_avail >= 2` expanding to three nested subqueries then pulled up by the planner into a 4-table join. Scene 2: the five substitution steps of `log_shoelace`. Scene 3: `INSERT INTO shoelace_ok SELECT ...` cascading through four rules into two final queries.
- **View update decision tree**: rules? -> INSTEAD OF triggers? -> auto-updatable? -> error; show CTID vs wholerow target-list entry.
- **security_barrier**: qual pushdown order with a cheap leaky function, with and without the barrier; LEAKPROOF functions allowed through.
- **Rule vs trigger cost**: deleting 2000 computers — 2000 SPI index scans vs one set-based join.
- **Logical decoding pipeline**: interleaved WAL records of three transactions -> reorder buffer per xid -> output in commit order, aborted one dropped. Toggles: memory limit reached (spill vs stream blocks of the largest transaction), two-phase (emit at PREPARE), crash (slot restarts from last checkpointed position, duplicates), idle slot (WAL and catalog xmin retained), failover slot sync to a standby, origin tagging and `filter_by_origin_cb` in a two-node loop.
- **Exported snapshot bootstrap**: slot creation instant = snapshot; initial copy under `SET TRANSACTION SNAPSHOT`, then stream catch-up with no gap or overlap.
- **Archive module loop**: completed WAL segment -> `check_configured_cb` -> `archive_file_cb` true/false -> recycle or retry.

### Playground SQL (PGlite, PostgreSQL 18, single session)
```sql
-- SQL functions: names vs $n, column shadowing, RETURNING
CREATE TABLE bank(accountno int PRIMARY KEY, balance numeric);
INSERT INTO bank VALUES (17, 500);
CREATE FUNCTION tf1(accountno integer, debit numeric) RETURNS numeric AS $$
  UPDATE bank SET balance = balance - debit WHERE accountno = tf1.accountno RETURNING balance;
$$ LANGUAGE SQL;
SELECT tf1(17, 100.0);

-- OUT params, defaults, variadic, polymorphism
CREATE FUNCTION sum_n_product(x int, y int, OUT sum int, OUT product int) AS 'SELECT x + y, x * y' LANGUAGE SQL;
SELECT * FROM sum_n_product(11, 42);
CREATE FUNCTION foo(a int, b int DEFAULT 2, c int DEFAULT 3) RETURNS int LANGUAGE SQL AS $$ SELECT $1 + $2 + $3 $$;
SELECT foo(10), foo(10, 20), foo(10, 20, 30);
CREATE FUNCTION mleast(VARIADIC arr numeric[]) RETURNS numeric AS $$ SELECT min($1[i]) FROM generate_subscripts($1, 1) g(i) $$ LANGUAGE SQL;
SELECT mleast(10, -1, 5, 4.4), mleast(VARIADIC ARRAY[10, -1, 5, 4.4]);
CREATE FUNCTION make_array2(anycompatible, anycompatible) RETURNS anycompatiblearray AS $$ SELECT ARRAY[$1, $2] $$ LANGUAGE SQL;
SELECT make_array2(1, 2.5), make_array2('a', 'b');

-- procedure with OUT parameter
CREATE PROCEDURE tp1(accountno integer, debit numeric, OUT new_balance numeric) AS $$
  UPDATE bank SET balance = balance - debit WHERE accountno = tp1.accountno RETURNING balance;
$$ LANGUAGE SQL;
CALL tp1(17, 100.0, NULL);

-- set-returning functions in the select list run in lockstep
SELECT generate_series(1, 3) AS a, generate_series(1, 2) AS b;

-- volatility and visibility of the calling statement's changes
CREATE TABLE vt(x int); INSERT INTO vt VALUES (1), (2), (3);
CREATE FUNCTION cnt_volatile() RETURNS bigint LANGUAGE sql VOLATILE AS 'SELECT count(*) FROM vt WHERE x > 100';
CREATE FUNCTION cnt_stable()   RETURNS bigint LANGUAGE sql STABLE   AS 'SELECT count(*) FROM vt WHERE x > 100';
UPDATE vt SET x = x + 1000 RETURNING x, cnt_volatile(), cnt_stable();
EXPLAIN SELECT * FROM vt WHERE x = 2 + 2;   -- folded to 4

-- user-defined aggregate, NULL-on-empty variant, polymorphic aggregate
CREATE AGGREGATE my_sum(int) (sfunc = int4pl, stype = int, initcond = '0');
CREATE AGGREGATE my_sum_null(int) (sfunc = int4pl, stype = int);
SELECT my_sum(x), my_sum_null(x) FROM vt WHERE false;
CREATE AGGREGATE array_accum(anycompatible) (sfunc = array_append, stype = anycompatiblearray, initcond = '{}');
SELECT array_accum(x) FROM vt;

-- moving-aggregate precision trap
CREATE AGGREGATE unsafe_sum(float8) (stype = float8, sfunc = float8pl, mstype = float8, msfunc = float8pl, minvfunc = float8mi);
SELECT unsafe_sum(x) OVER (ORDER BY n ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING)
FROM (VALUES (1, 1.0e20::float8), (2, 1.0::float8)) AS v(n, x);

-- operator on a composite type
CREATE TYPE pair AS (k text, v text);
CREATE FUNCTION pair(text, text) RETURNS pair LANGUAGE SQL AS 'SELECT ROW($1, $2)::pair';
CREATE OPERATOR ~> (LEFTARG = text, RIGHTARG = text, FUNCTION = pair);
SELECT 'a' ~> 'b';

-- operator class introspection
SELECT amopstrategy, amopopr::regoperator FROM pg_amop
WHERE amopfamily = (SELECT oid FROM pg_opfamily WHERE opfname = 'integer_ops' AND opfmethod = (SELECT oid FROM pg_am WHERE amname = 'btree'))
ORDER BY amoplefttype, amoprighttype, amopstrategy;

-- extension version paths
SELECT * FROM pg_extension_update_paths('pg_trgm');

-- triggers: order, NULL return, visibility, WHEN, transition tables
CREATE TABLE ttest(x integer);
CREATE FUNCTION trigf() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE NOTICE '% % %: % rows', TG_NAME, TG_WHEN, TG_OP, (SELECT count(*) FROM ttest);
  IF TG_WHEN = 'BEFORE' AND TG_OP <> 'DELETE' AND NEW.x IS NULL THEN RETURN NULL; END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER tbefore BEFORE INSERT OR UPDATE OR DELETE ON ttest FOR EACH ROW EXECUTE FUNCTION trigf();
CREATE TRIGGER tafter  AFTER  INSERT OR UPDATE OR DELETE ON ttest FOR EACH ROW EXECUTE FUNCTION trigf();
INSERT INTO ttest VALUES (NULL);      -- INSERT 0 0, AFTER not fired
INSERT INTO ttest VALUES (1), (2);
DELETE FROM ttest;
CREATE FUNCTION stmt_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE 'inserted % rows', (SELECT count(*) FROM newrows); RETURN NULL; END $$;
CREATE TRIGGER t_stmt AFTER INSERT ON ttest REFERENCING NEW TABLE AS newrows
  FOR EACH STATEMENT EXECUTE FUNCTION stmt_audit();
INSERT INTO ttest SELECT generate_series(1, 5);

-- event trigger blocking DDL (PL/pgSQL version of noddl)
CREATE FUNCTION noddl() RETURNS event_trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'command % denied', tg_tag; END $$;
CREATE EVENT TRIGGER noddl ON ddl_command_start EXECUTE FUNCTION noddl();
CREATE TABLE blocked(id int);          -- fails
DROP EVENT TRIGGER noddl;              -- event triggers don't guard themselves

-- a view is a rule
CREATE TABLE unit(un_name text, un_fact real);
CREATE TABLE shoelace_data(sl_name text, sl_avail integer, sl_color text, sl_len real, sl_unit text);
CREATE VIEW shoelace AS SELECT s.sl_name, s.sl_avail, s.sl_color, s.sl_len, s.sl_unit, s.sl_len * u.un_fact AS sl_len_cm
  FROM shoelace_data s, unit u WHERE s.sl_unit = u.un_name;
SELECT rulename, ev_type, is_instead FROM pg_rewrite WHERE ev_class = 'shoelace'::regclass;
EXPLAIN SELECT * FROM shoelace WHERE sl_avail > 2;

-- update rule with logging
CREATE TABLE shoelace_log(sl_name text, sl_avail integer, log_who text, log_when timestamp);
CREATE RULE log_shoelace AS ON UPDATE TO shoelace_data WHERE NEW.sl_avail <> OLD.sl_avail
  DO INSERT INTO shoelace_log VALUES (NEW.sl_name, NEW.sl_avail, current_user, current_timestamp);
INSERT INTO unit VALUES ('cm', 1.0);
INSERT INTO shoelace_data VALUES ('sl7', 7, 'brown', 60, 'cm');
UPDATE shoelace_data SET sl_avail = 6 WHERE sl_name = 'sl7';
UPDATE shoelace_data SET sl_color = 'green' WHERE sl_name = 'sl7';   -- no log row
SELECT * FROM shoelace_log;

-- security_barrier leak
CREATE TABLE phone_data(person text, phone text);
INSERT INTO phone_data VALUES ('a', '412-1'), ('b', '555-2');
CREATE VIEW phone_number AS SELECT person, phone FROM phone_data WHERE phone NOT LIKE '412%';
CREATE FUNCTION tricky(text, text) RETURNS bool AS $$
BEGIN RAISE NOTICE '% => %', $1, $2; RETURN true; END $$ LANGUAGE plpgsql COST 0.0000000000000000000001;
SELECT * FROM phone_number WHERE tricky(person, phone);              -- leaks the 412 row
CREATE OR REPLACE VIEW phone_number WITH (security_barrier) AS SELECT person, phone FROM phone_data WHERE phone NOT LIKE '412%';
SELECT * FROM phone_number WHERE tricky(person, phone);

-- materialized view with index
CREATE MATERIALIZED VIEW sl_summary AS SELECT sl_color, sum(sl_avail) AS total FROM shoelace_data GROUP BY sl_color;
CREATE UNIQUE INDEX ON sl_summary(sl_color);
REFRESH MATERIALIZED VIEW sl_summary;
```
- Not runnable in PGlite (explain with diagrams instead): C-language functions and custom base types, `LANGUAGE internal` aliases may work (`dsqrt`) but untested, logical decoding slots (`wal_level = logical`, replication connections), login event triggers in a meaningful way, archive modules, OAuth validators, PL/Perl/Tcl/Python installation.
- Snippets above are written from the documented behaviour and were not executed; verify each in PGlite before publishing.

### Pitfalls the docs warn about (with the documented fix)
- Labeling a function IMMUTABLE when it depends on a GUC (`TimeZone`) or table contents: stale constants in cached plans. Fix: label STABLE; use the strictest category that is actually valid.
- Expecting a STABLE/IMMUTABLE function (or trigger function) to see the calling command's changes. Fix: VOLATILE.
- Argument name equal to a column name: the column wins. Fix: qualify as `function_name.argument_name` or rename.
- Using an argument as an identifier in an SQL function (`INSERT INTO $1`). Not possible; use dynamic SQL in a PL.
- Composite-returning SQL function with columns in the wrong order or needing explicit casts. Fix: match order exactly; cast, or return `ROW(...)::type`.
- `SELECT new_emp().name`: syntax error. Fix: `(new_emp()).name`.
- SRF inside CASE/COALESCE: parse error. Fix: move the condition into a custom SRF or use LATERAL.
- A function whose last statement is DML with RETURNING runs to completion even if rows are discarded.
- Calling variadic or defaulted functions in schemas writable by untrusted users. Fix: explicit `VARIADIC` call, secure `search_path`.
- Overloads that are ambiguous (`test(int, real)` vs `test(smallint, double precision)`), or a function named like a composite attribute (attribute wins). Fix: avoid; schema-qualify.
- Variadic aggregates with `ORDER BY`: argument vs sort-key confusion. Fix: avoid same-named aggregates with different argument counts.
- Inverse transition functions that cannot reconstruct state exactly (float sums). Fix: don't provide `minvfunc`, or return NULL to force recompute.
- Combine function returning its second input when the first is NULL with `stype = internal`: wrong memory context. Fix: copy into the aggregate context.
- C: modifying a pass-by-reference input (may point into a disk buffer); leaving padding uninitialized; setting the varlena length directly; cleanup in the last ValuePerCall call; keeping detoasted args across SRF calls; duplicate C symbol names; C++ exceptions crossing into C. Fixes as noted in the C section (copy, `palloc0`, `SET_VARSIZE`, Materialize mode, `multi_call_memory_ctx`, unique names, catch-all blocks).
- Text I/O functions that aren't exact inverses break dump/restore.
- Wrong operator clauses give wrong results: HASHES/MERGES on non-equality, missing commutator in the same family, strict hash operator returning NULL for non-null inputs, volatile underlying function. Fix: omit clauses you're unsure about.
- No default btree (or hash) opclass: "could not identify an ordering operator" for ORDER BY/DISTINCT/GROUP BY. Fix: create the opclass.
- Editing an extension member in place: change is not dumped. Fix: update script. Sourcing an extension script in psql creates loose objects: guard with `\echo ... \quit`.
- Downgrade scripts creating a shorter, destructive update path. Fix: inspect `pg_extension_update_paths`.
- Extension functions exposed to search-path attacks; trusted extensions installed into attacker-chosen schemas. Fix: `SET search_path`, `OPERATOR(schema.=)`, exact argument types, `pg_catalog, pg_temp` during scripts.
- Marking only the parent table as a config table: serial sequences are not dumped. Fix: mark the sequence too.
- BEFORE trigger forgetting to return NEW/OLD (silently skips rows); non-idempotent BEFORE INSERT/UPDATE triggers with ON CONFLICT; recursive cascading triggers; triggers that block FK referential actions and break integrity.
- Accessing generated columns in BEFORE triggers (stored: not yet computed; virtual: never computed).
- Expecting AFTER UPDATE row triggers on cross-partition moves, or child statement triggers on parent statements.
- Login event trigger bug locks everyone out. Fix: `event_triggers = false` or single-user mode. Writing in a login trigger on a standby makes it inaccessible. Fix: check `pg_is_in_recovery()`.
- Rules with volatile functions (multiple evaluation), with `WITH` queries, or used as constraints (data silently discarded). Fix: triggers.
- `DO INSTEAD NOTHING` hides writes without error; command status may show zero rows. Fix: name the status-setting INSTEAD rule alphabetically last, or use triggers.
- Views filtering rows are not a security boundary without `security_barrier`; even then covert channels (EXPLAIN, timing) remain; non-LEAKPROOF operators disable index scans there.
- Unused replication slots retain WAL and catalog rows, up to wraparound shutdown. Fix: drop them.
- Duplicate changes after a crash (slot position persisted at checkpoint). Fix: track last LSN / replication origins.
- `synchronous_commit = off`: a just-committed transaction may not be decodable yet.
- Unlogged and temporary tables, DDL, and rolled-back transactions never appear in the stream; old row images depend on REPLICA IDENTITY.
- Exclusive locks on catalog tables with synchronous logical replication or two-phase decoding: deadlock. Fix: don't lock catalogs.
- Failover: standby slot not `synced` cannot be used; old primary may keep feeding subscribers. Fix: configure physical slot, `hot_standby_feedback`, `sync_replication_slots`, `synchronized_standby_slots`; disable subscriptions before promotion.
- Archive callback returning true before the file is durably stored lets the server recycle the WAL.
- OAuth validators: logging tokens, raising ERROR/FATAL during authentication, blocking uninterruptibly, skipping audience/issuer/expiry checks, enabling `delegate_ident_mapping` without scope checks.
