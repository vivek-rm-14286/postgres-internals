# H — Part V ch.41 PL/pgSQL, ch.42 PL/Tcl, ch.43 PL/Perl, ch.44 PL/Python, ch.45 SPI, ch.46 Background Worker Processes

Source: PostgreSQL 18 docs, `_order.tsv` idx 475-583 (109 pages). All pages read in full.

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 475 | plpgsql.txt | Chapter 41 table of contents |
| 476 | plpgsql-overview.txt | Design goals, round-trip savings, supported argument/result types |
| 477 | plpgsql-structure.txt | Block grammar, labels, subblock scoping, hidden outer block, BEGIN/END is not a transaction |
| 478 | plpgsql-declarations.txt | Variable syntax, parameters/aliases, OUT params, $0, %TYPE, %ROWTYPE, RECORD, collation |
| 479 | plpgsql-expressions.txt | Expressions run as prepared SELECTs with variables as parameters |
| 480 | plpgsql-statements.txt | Assignment, SQL commands, PERFORM, INTO [STRICT], EXECUTE/USING, GET DIAGNOSTICS, FOUND, NULL |
| 481 | plpgsql-control-structures.txt | RETURN family, CALL, IF/CASE, loops, FOREACH, EXCEPTION blocks, stacked diagnostics, PG_CONTEXT |
| 482 | plpgsql-cursors.txt | refcursor declaration, three OPEN forms, FETCH/MOVE/CLOSE, WHERE CURRENT OF, returning cursors, cursor FOR |
| 483 | plpgsql-transactions.txt | COMMIT/ROLLBACK in procedures and DO, AND CHAIN, call-stack rule, no savepoints, holdable cursor loops |
| 484 | plpgsql-errors-and-messages.txt | RAISE forms, levels, USING options, re-raise, default P0001, ASSERT and plpgsql.check_asserts |
| 485 | plpgsql-trigger.txt | NEW/OLD/TG_* variables, return-value rules, five worked trigger examples, transition tables, event triggers |
| 486 | plpgsql-implementation.txt | Variable substitution, variable_conflict, lazy compilation, plan caching, cache granularity, 'now' gotcha |
| 487 | plpgsql-development-tips.txt | Dev workflow, quote-doubling chart, extra_warnings/extra_errors checks |
| 488 | plpgsql-porting.txt | Oracle PL/SQL differences, four porting examples, implicit rollback, instr functions |
| 489 | pltcl.txt | Chapter 42 table of contents |
| 490 | pltcl-overview.txt | Trusted pltcl vs untrusted pltclu, restrictions, installation |
| 491 | pltcl-functions.txt | Arguments as $1..$n, argisnull, return_null, composite as arrays/lists, return_next |
| 492 | pltcl-data.txt | Values cross the boundary in text form |
| 493 | pltcl-global.txt | One interpreter per SQL role, shared PL/TclU interpreter, GD array |
| 494 | pltcl-dbaccess.txt | spi_exec, spi_prepare, spi_execp, subtransaction, quote, elog |
| 495 | pltcl-trigger.txt | $TG_* variables, $NEW/$OLD, OK/SKIP/row-list return values |
| 496 | pltcl-event-trigger.txt | $TG_event and $TG_tag |
| 497 | pltcl-error-handling.txt | catch, per-command subtransactions, errorCode fields |
| 498 | pltcl-subtransactions.txt | Explicit subtransaction command and the funds-transfer example |
| 499 | pltcl-transactions.txt | commit / rollback commands in top-level procedures and DO |
| 500 | pltcl-config.txt | pltcl.start_proc and pltclu.start_proc |
| 501 | pltcl-procnames.txt | Internal Tcl procedure naming; functions cannot call each other directly |
| 502 | plperl.txt | Chapter 43 table of contents, installation, template1 tip |
| 503 | plperl-funcs.txt | Sub wrapping, @_, undef/NULL, bool transform, arrays, hashes, return_next, use strict |
| 504 | plperl-data.txt | Text-form values; transforms as the remedy |
| 505 | plperl-builtins.txt | spi_* functions, spi_commit/spi_rollback, elog, quoting and encoding helpers |
| 506 | plperl-global.txt | %_SHARED and per-role interpreters |
| 507 | plperl-trusted.txt | Trusted restrictions, Opcode warning, plperlu, interpreter build flags |
| 508 | plperl-triggers.txt | $_TD fields and SKIP/MODIFY return values |
| 509 | plperl-event-triggers.txt | $_TD->{event} and $_TD->{tag} |
| 510 | plperl-under-the-hood.txt | plperl.on_init, on_plperl_init, on_plperlu_init, use_strict; limitations |
| 511 | plpython.txt | Chapter 44 table of contents; plpython3u is untrusted only |
| 512 | plpython-funcs.txt | Body becomes a Python function; args as globals; parameter reassignment gotcha |
| 513 | plpython-data.txt | Type mapping both ways, None, lists, composite results, set-returning forms |
| 514 | plpython-sharing.txt | SD (per-function) and GD (session) dictionaries |
| 515 | plpython-do.txt | DO blocks in plpython3u |
| 516 | plpython-trigger.txt | TD dictionary keys and OK/SKIP/MODIFY return values |
| 517 | plpython-database.txt | plpy.execute, prepare, cursor, result object methods, SPIError classes |
| 518 | plpython-subtransaction.txt | plpy.subtransaction() context manager |
| 519 | plpython-transactions.txt | plpy.commit() / plpy.rollback() |
| 520 | plpython-util.txt | plpy message functions, keyword arguments, quoting functions |
| 521 | plpython-python23.txt | Python 3 only |
| 522 | plpython-envar.txt | PYTHON* environment variables honored |
| 523 | spi.txt | Chapter 45 contents, SPI purpose, error model, executor/spi.h |
| 524 | spi-interface.txt | List of interface functions |
| 525 | spi-spi-connect.txt | SPI_connect / SPI_connect_ext, SPI_OPT_NONATOMIC |
| 526 | spi-spi-finish.txt | SPI_finish and its return codes |
| 527 | spi-spi-execute.txt | SPI_execute: count, read_only snapshot rules, SPITupleTable, result codes |
| 528 | spi-spi-exec.txt | SPI_exec = SPI_execute read-write |
| 529 | spi-spi-execute-extended.txt | SPIExecuteOptions fields, DestReceiver streaming |
| 530 | spi-spi-execute-with-args.txt | One-shot execution with parameter arrays, nulls array format |
| 531 | spi-spi-prepare.txt | SPI_prepare, generic vs custom plan rule, invalidation on DDL and search_path |
| 532 | spi-spi-prepare-cursor.txt | Cursor options bitmask (deprecated function) |
| 533 | spi-spi-prepare-extended.txt | SPIPrepareOptions fields |
| 534 | spi-spi-prepare-params.txt | Parser-hook variant (deprecated) |
| 535 | spi-spi-getargcount.txt | Argument count of a prepared statement |
| 536 | spi-spi-getargtypeid.txt | Argument type OID, zero-based index |
| 537 | spi-spi-is-cursor-plan.txt | Whether a statement can back a cursor |
| 538 | spi-spi-execute-plan.txt | Execute a prepared statement; SPI_ERROR_PARAM |
| 539 | spi-spi-execute-plan-extended.txt | Options-struct variant with resource owner |
| 540 | spi-spi-execute-plan-with-paramlist.txt | ParamListInfo variant (deprecated) |
| 541 | spi-spi-execp.txt | SPI_execp = SPI_execute_plan read-write |
| 542 | spi-spi-cursor-open.txt | Open a portal on a prepared statement; portal lifetime |
| 543 | spi-spi-cursor-open-with-args.txt | Open a cursor from a query string and arrays (deprecated) |
| 544 | spi-spi-cursor-open-with-paramlist.txt | Open a cursor with ParamListInfo |
| 545 | spi-spi-cursor-parse-open.txt | Open a cursor from a query string with SPIParseOpenOptions |
| 546 | spi-spi-cursor-find.txt | Find a portal by name |
| 547 | spi-spi-cursor-fetch.txt | Fetch forward/backward |
| 548 | spi-spi-cursor-move.txt | Move forward/backward |
| 549 | spi-spi-scroll-cursor-fetch.txt | Fetch with FetchDirection |
| 550 | spi-spi-scroll-cursor-move.txt | Move with FetchDirection |
| 551 | spi-spi-cursor-close.txt | Close a cursor |
| 552 | spi-spi-keepplan.txt | Keep a statement past SPI_finish without copying |
| 553 | spi-spi-saveplan.txt | Copy a statement to permanent storage |
| 554 | spi-spi-register-relation.txt | Register an ephemeral named relation |
| 555 | spi-spi-unregister-relation.txt | Unregister an ephemeral named relation |
| 556 | spi-spi-register-trigger-data.txt | Register a trigger's transition tables |
| 557 | spi-interface-support.txt | List of support functions; usable unconnected |
| 558 | spi-spi-fname.txt | Column name from number |
| 559 | spi-spi-fnumber.txt | Column number from name; negative for system columns |
| 560 | spi-spi-getvalue.txt | Column value as string |
| 561 | spi-spi-getbinval.txt | Column value as Datum |
| 562 | spi-spi-gettype.txt | Column type name |
| 563 | spi-spi-gettypeid.txt | Column type OID |
| 564 | spi-spi-getrelname.txt | Relation name |
| 565 | spi-spi-getnspname.txt | Relation schema name |
| 566 | spi-spi-result-code-string.txt | Result code as string |
| 567 | spi-memory.txt | SPI memory contexts; upper executor context |
| 568 | spi-spi-palloc.txt | Allocate in the upper executor context |
| 569 | spi-realloc.txt | SPI_repalloc, now same as repalloc |
| 570 | spi-spi-pfree.txt | SPI_pfree, now same as pfree |
| 571 | spi-spi-copytuple.txt | Copy a row for trigger results |
| 572 | spi-spi-returntuple.txt | Copy a row as a composite Datum |
| 573 | spi-spi-modifytuple.txt | Build a row with selected columns replaced |
| 574 | spi-spi-freetuple.txt | SPI_freetuple, now same as heap_freetuple |
| 575 | spi-spi-freetupletable.txt | Free an SPITupleTable |
| 576 | spi-spi-freeplan.txt | Free a prepared statement |
| 577 | spi-transaction.txt | Why transaction control needs dedicated functions |
| 578 | spi-spi-commit.txt | SPI_commit / SPI_commit_and_chain |
| 579 | spi-spi-rollback.txt | SPI_rollback / SPI_rollback_and_chain |
| 580 | spi-spi-start-transaction.txt | Obsolete no-op |
| 581 | spi-visibility.txt | Data-change visibility rules; read-only vs read-write by volatility |
| 582 | spi-examples.txt | execq C example and session showing count and visibility behaviour |
| 583 | bgworker.txt | BackgroundWorker struct, flags, start times, restart, connection, handle API, limits |

## Notes by topic

### PL/pgSQL overview and design  [M6]  (source: plpgsql.txt, plpgsql-overview.txt)
- PL/pgSQL = loadable procedural language. Design goals: create functions, procedures, triggers; add control structures to SQL; perform complex computations; inherit all user-defined types/functions/procedures/operators; can be defined trusted; easy to use.
- Installed by default since PostgreSQL 9.0, but is still a loadable module (security-conscious admins can remove it).
- PL/pgSQL functions usable anywhere built-in functions are (e.g. to define operators, in index expressions).
- Advantages vs. client-side SQL: (1) extra client/server round trips eliminated; (2) intermediate results not marshaled/transferred; (3) multiple rounds of query parsing avoided.
- Supported argument/result types: any scalar or array type; any named composite type; `record` as argument (any composite) or result (columns determined by the calling query's column-definition list); `VARIADIC`; polymorphic types (anyelement, anycompatible family); `SETOF`/`RETURNS TABLE` (rows emitted with `RETURN NEXT` / `RETURN QUERY`); `void`; OUT parameters instead of explicit RETURNS.

### Block structure  [M6]  (source: plpgsql-structure.txt)
- Function body is just a string literal to CREATE FUNCTION; use dollar quoting, otherwise single quotes and backslashes in the body must be doubled.
- Block grammar:
  ```
  [ <<label>> ]
  [ DECLARE
      declarations ]
  BEGIN
      statements
  END [ label ];
  ```
- Every declaration and statement ends with `;`. A nested block needs `;` after END; the final END of the function body does not.
- Classic mistake: `BEGIN;` (semicolon right after BEGIN) is a syntax error.
- Label only needed for EXIT targeting the block or for qualifying variable names (`label.var`). Label after END must match.
- Keywords case-insensitive; identifiers folded to lower case unless double-quoted (same as SQL).
- Comments: `--` to end of line; `/* ... */` block comments, which nest.
- Subblocks: variables declared in a subblock mask same-named outer variables; outer one reachable as `outerlabel.var`.
- Hidden outer block: surrounds every function body, declares the parameters plus special variables such as `FOUND`; it is labeled with the function's name, so parameters can be written `funcname.param`.
- PL/pgSQL `BEGIN/END` only group statements; they do NOT start/end a transaction. But a block with an `EXCEPTION` clause effectively forms a subtransaction that can be rolled back without affecting the outer transaction.

### Declarations  [M6]  (source: plpgsql-declarations.txt)
- All variables must be declared in a DECLARE section, except: integer FOR loop variable (auto-declared `integer`) and cursor FOR loop variable (auto-declared `record`).
- Syntax: `name [ CONSTANT ] type [ COLLATE collation_name ] [ NOT NULL ] [ { DEFAULT | := | = } expression ];`
- No DEFAULT => initialized to SQL NULL. `CONSTANT` => cannot be assigned after initialization. `NOT NULL` => assigning NULL is a run-time error, and a non-null default MUST be given. `=` allowed in place of `:=`.
- Default expression is evaluated every time the block is ENTERED (not once per function call, not at compile time): `ts timestamp := now()` gives time of the current call.
- Later declarations in the same block may reference earlier ones (`y integer := x + 1;`).
- Parameters: named `$1`, `$2`, ...; preferred alias = name in CREATE FUNCTION; alternative `name ALIAS FOR $n;`. Not perfectly equivalent: a named parameter can be qualified as `funcname.param`; an ALIAS declared in DECLARE cannot (unless the inner block is labeled).
- OUT parameters: get `$n` names too, start NULL, final value returned. `RETURNS` clause redundant (if given with multiple OUT params it must be `RETURNS record`). Call omits OUT params: `SELECT sales_tax(100.00);`.
- Procedures with OUT params: from plain SQL all parameters must be specified, write `NULL` for OUT (`CALL sum_n_product(2, 4, NULL, NULL);`); from PL/pgSQL write a variable to receive the output.
- `RETURNS TABLE(col type, ...)` is exactly equivalent to OUT params + `RETURNS SETOF sometype`.
- Polymorphic return type => special parameter `$0` is created, typed as the actual return type, initialized NULL, modifiable, aliasable (`result ALIAS FOR $0;`). Not created when polymorphic OUT parameters are used instead.
- `anycompatible` family gives automatic promotion to a common type: `add_three_values(1, 2, 4.7)` works (integers promoted to numeric); `anyelement` would require manual casts.
- `newname ALIAS FOR oldname;` works for any variable (main practical use: renaming `NEW`/`OLD` in triggers, e.g. `prior ALIAS FOR old;`).
- `%TYPE`: `name table.column%TYPE` or `name variable%TYPE`. Array decoration allowed after it: `users.user_id%TYPE[]` or `%TYPE ARRAY[4]` (dimension/size ignored — all arrays of an element type are one type). Valuable in polymorphic functions.
- Row types: `name table_name%ROWTYPE;` or `name composite_type_name;` (every table has a same-named composite type, so %ROWTYPE is optional but more portable). Fields via `rowvar.field`. %ROWTYPE can also take array decoration. Composite parameters: `$1.user_id`.
- `name RECORD;` — no predefined structure; takes the row structure of whatever is assigned by SELECT/FOR; structure can change on each assignment; accessing a field before first assignment is a run-time error. RECORD is not a true data type, only a placeholder. (A function "returning record" has its structure fixed when the calling query is parsed; a record variable can change on the fly.)
- Collation: if the collatable parameters yield a common collation for the call, all collatable parameters AND all collatable local variables implicitly take it. Otherwise variables use their type's default collation. Per-variable override: `local_a text COLLATE "en_US";`. Explicit `COLLATE` in an expression overrides everything.

### Expressions  [M6, M4]  (source: plpgsql-expressions.txt)
- Every PL/pgSQL expression is evaluated by the main SQL executor as `SELECT expression`. Variable names are replaced by query parameters, so the plan is prepared once and reused.
- `IF x < y THEN` (x, y integer) is equivalent to `PREPARE statement_name(integer, integer) AS SELECT $1 < $2;` then EXECUTE on each evaluation.
- Because it is a SELECT, an expression may carry SELECT clauses except a top-level UNION/INTERSECT/EXCEPT: `IF count(*) > 0 FROM my_table THEN ...` is legal.
- The SELECT must produce a single column and at most one row; zero rows => result NULL.

### Basic statements: assignment, SQL, PERFORM, INTO  [M6, M3]  (source: plpgsql-statements.txt)
- Anything not recognized as a PL/pgSQL statement is presumed to be an SQL command and sent to the main engine.
- Assignment: `variable { := | = } expression;` Target: simple variable (optionally block-qualified), field of row/record, array element or slice (`my_array[1:3] := array[1,2,3];`, `complex_array[n].realpart = 12.3;`).
- Type mismatch on assignment: coerced as by an assignment cast; if no assignment cast exists, the interpreter converts textually (source type's output function then target type's input function) — may raise a run-time error from the input function.
- SQL commands that return no rows: just write them (`CREATE TABLE ...; INSERT ...;`).
- Commands returning rows (SELECT, INSERT/UPDATE/DELETE/MERGE ... RETURNING): either add `INTO` (at most one row / first row) or use as source of a FOR loop.
- "Optimizable" commands = SELECT, INSERT, UPDATE, DELETE, MERGE and certain utility commands that incorporate one (EXPLAIN, CREATE TABLE ... AS SELECT). In these, variable names become query parameters and the plan may be cached.
- Non-optimizable (utility) commands cannot take parameters => variable substitution does not work; build a string and `EXECUTE` it. EXECUTE is also required to vary anything other than a data value (e.g. a table name).
- `PERFORM query;` — evaluate and discard. Write the SELECT with `PERFORM` replacing the keyword `SELECT`. For WITH queries: `PERFORM (WITH ... SELECT ...)` in parentheses (then only one row allowed). Sets `FOUND` true if >= 1 row. A bare `SELECT` without INTO is rejected as an error.
- Single-row result:
  ```
  SELECT select_expressions INTO [STRICT] target FROM ...;
  INSERT ... RETURNING expressions INTO [STRICT] target;
  UPDATE ... RETURNING expressions INTO [STRICT] target;
  DELETE ... RETURNING expressions INTO [STRICT] target;
  MERGE ... RETURNING expressions INTO [STRICT] target;
  ```
  target = record variable, row variable, or comma-separated list of simple variables and record/row fields. Also works for row-returning utility commands such as EXPLAIN.
- PL/pgSQL `SELECT ... INTO` is NOT SQL's `SELECT INTO` (which creates a table). To create a table from a query inside PL/pgSQL use `CREATE TABLE ... AS SELECT`.
- Row variable / variable list: result columns must match exactly in number and types, else run-time error. Record variable reconfigures itself.
- INTO may appear almost anywhere; convention: just before or just after the select list, or at the end for other commands.
- Without STRICT: target = first row (not well-defined without ORDER BY) or NULLs if no rows; extra rows discarded; check `FOUND`.
- With STRICT: exactly one row required, else `NO_DATA_FOUND` (no rows) or `TOO_MANY_ROWS` (>1). Successful STRICT always sets FOUND true. STRICT matches Oracle PL/SQL SELECT INTO behavior.
- INSERT/UPDATE/DELETE/MERGE ... RETURNING INTO: error on more than one returned row EVEN WITHOUT STRICT (no ORDER BY to pick a row).
- `print_strict_params`: when a STRICT failure occurs, DETAIL lists the parameters passed. Enable globally with GUC `plpgsql.print_strict_params` (affects only subsequent function compilations) or per function with `#print_strict_params on` as first line of the body. Sample: `ERROR: query returned no rows / DETAIL: parameters: username = 'nosuchuser' / CONTEXT: PL/pgSQL function get_userid(text) line 6 at SQL statement`.

### Dynamic SQL: EXECUTE  [M6, M4]  (source: plpgsql-statements.txt)
- `EXECUTE command-string [ INTO [STRICT] target ] [ USING expression [, ... ] ];`
- No variable substitution in the command string. No plan caching: the command is planned every time it runs.
- INTO: first row assigned, NULLs if none, results discarded if no INTO; STRICT => error unless exactly one row.
- `USING` supplies `$1, $2, ...` parameter values: no text conversion overhead, far less SQL-injection-prone. Parameters only for data values, and only in optimizable commands (SELECT/INSERT/UPDATE/DELETE/MERGE and commands containing them); in utility statements even data values must be inserted textually.
- Identifiers must be inserted textually: `quote_ident(tabname)` or `format('... %I ...', tabname)`.
- `EXECUTE` with constant string + USING is functionally the same as a static statement, except EXECUTE re-plans each time with a plan specific to current parameter values — useful to positively avoid a generic plan when the best plan depends strongly on parameter values.
- `SELECT INTO` is not supported inside the EXECUTE string; use `EXECUTE '...' INTO target`.
- PL/pgSQL EXECUTE is unrelated to the SQL `EXECUTE` (prepared statement) command; the latter cannot be used directly in PL/pgSQL.
- Quoting rules (Example 41.1): `quote_ident` for identifiers; `quote_literal` for values, but it is STRICT (NULL in => NULL out => whole command string becomes NULL => EXECUTE error); use `quote_nullable` (returns the string `NULL` for null input) when values may be null. `format`: `%I` = quote_ident, `%L` = quote_nullable. Best form: `EXECUTE format('UPDATE tbl SET %I = $1 WHERE key = $2', colname) USING newvalue, keyvalue;` (native types, more efficient).
- `'WHERE key = ' || quote_nullable(keyvalue)` never matches when keyvalue is NULL; use `IS NOT DISTINCT FROM` (docs: currently handled much less efficiently than `=`).
- Never wrap unknown text in `$$...$$` inside a dynamic string — breaks if the value contains `$$`.
- Adjacent string literals separated by a newline are implicitly concatenated (used in the format examples).

### Result status: GET DIAGNOSTICS and FOUND  [M6]  (source: plpgsql-statements.txt)
- `GET [ CURRENT ] DIAGNOSTICS variable { = | := } item [ , ... ];` (CURRENT is a noise word.) Items (Table 41.1):
  | Name | Type | Description |
  |---|---|---|
  | ROW_COUNT | bigint | number of rows processed by the most recent SQL command |
  | PG_CONTEXT | text | line(s) of text describing the current call stack |
  | PG_ROUTINE_OID | oid | OID of the current function |
- `FOUND` (boolean): starts false in each function call; local to each function. Set by:
  - `SELECT INTO`: true if a row is assigned.
  - `PERFORM`: true if it produces (and discards) one or more rows.
  - `UPDATE`, `INSERT`, `DELETE`, `MERGE`: true if at least one row affected.
  - `FETCH`: true if it returns a row.
  - `MOVE`: true if it successfully repositions the cursor.
  - `FOR` / `FOREACH`: true if iterated one or more times; set when the loop EXITS (not modified by the loop statement during iteration, though body statements may change it).
  - `RETURN QUERY` / `RETURN QUERY EXECUTE`: true if the query returns at least one row.
- `EXECUTE` changes GET DIAGNOSTICS output (ROW_COUNT) but does NOT change FOUND.
- `NULL;` = do-nothing statement. Unlike Oracle, empty statement lists are allowed, so `WHEN division_by_zero THEN` with nothing after it is legal.

### Control structures: RETURN family  [M6]  (source: plpgsql-control-structures.txt)
- `RETURN expression;` — ends a non-set function. Scalar result auto-cast to return type like assignment; a composite result must deliver exactly the requested column set (may need explicit casts: `RETURN (1, 2, 'three'::text);`).
- With OUT parameters: bare `RETURN;`. `void`: bare `RETURN;` to exit early.
- Reaching the end of the top-level block without RETURN is a run-time error, EXCEPT for functions with OUT parameters and functions returning void (automatic RETURN).
- Set-returning: `RETURN NEXT expression;`, `RETURN QUERY query;`, `RETURN QUERY EXECUTE command-string [ USING expression [, ... ] ];`. They append rows and continue execution; freely intermixable; final bare `RETURN;` (or fall off the end) exits.
- With OUT params in a SRF: bare `RETURN NEXT;` saves current OUT values as a row; declare `RETURNS SETOF record` (multiple OUT) or `SETOF sometype` (one OUT).
- Implementation caveat: RETURN NEXT/RETURN QUERY store the ENTIRE result set before the function returns (tuplestore); spills to disk beyond `work_mem`. Large result sets => poor performance; function does not return until all rows are generated.
- Procedures: no return value; may end without RETURN; bare `RETURN;` to exit early; OUT parameter final values are returned to the caller.
- `CALL proc(...)` from PL/pgSQL (function, procedure, DO): each OUT/INOUT parameter must correspond to a variable, which receives the result. The variable can be a simple variable or a field of a composite variable; currently NOT an array element. Example: `CALL triple(myvar);` with `INOUT x int` turns 5 into 15.

### Control structures: conditionals  [M6]  (source: plpgsql-control-structures.txt)
- IF forms: `IF ... THEN ... END IF`; `IF ... THEN ... ELSE ... END IF`; `IF ... THEN ... ELSIF ... THEN ... ELSE ... END IF`. `ELSIF` may also be spelled `ELSEIF`. A NULL condition is treated as not true (goes to ELSE).
- Simple CASE: `CASE search-expression WHEN expression [, expression ...] THEN statements ... [ ELSE statements ] END CASE;` — search-expression evaluated once, compared by equality; subsequent WHENs not evaluated after a match.
- Searched CASE: `CASE WHEN boolean-expression THEN statements ... [ ELSE statements ] END CASE;`
- Both CASE forms: no match and no ELSE => `CASE_NOT_FOUND` exception (the difference from IF-THEN-ELSIF, which does nothing).

### Control structures: loops  [M6]  (source: plpgsql-control-structures.txt)
- `[ <<label>> ] LOOP statements END LOOP [ label ];` — unconditional; ends via EXIT or RETURN.
- `EXIT [ label ] [ WHEN boolean-expression ];` — no label: innermost loop. With label: the named loop OR block. An unlabeled EXIT never matches a BEGIN block (changed in 8.4); `EXIT ablock;` leaves a labeled BEGIN block.
- `CONTINUE [ label ] [ WHEN boolean-expression ];` — next iteration of the innermost / labeled loop.
- `[ <<label>> ] WHILE boolean-expression LOOP statements END LOOP [ label ];` — tested before each entry.
- Integer FOR: `[ <<label>> ] FOR name IN [ REVERSE ] expression .. expression [ BY expression ] LOOP ... END LOOP [ label ];`
  - `name` auto-declared integer, exists only inside the loop, hides any existing same-named variable.
  - Bounds and BY evaluated ONCE on loop entry; default step 1; REVERSE subtracts the step. `FOR i IN REVERSE 10..1 BY 2` => 10,8,6,4,2.
  - Lower > upper (or less, with REVERSE) => body not executed, no error.
  - With a label the loop variable can be qualified `label.i`.
- Query FOR: `[ <<label>> ] FOR target IN query LOOP ... END LOOP [ label ];` target = record var, row var, or scalar list. Query may be SELECT, INSERT/UPDATE/DELETE/MERGE ... RETURNING, or utility such as EXPLAIN. If ended by EXIT, the last assigned row remains accessible afterwards. Variables substituted, plan cached. FOR loops use a cursor internally (no memory blow-up on big results).
- `FOR target IN EXECUTE text_expression [ USING expression [, ... ] ] LOOP ...` — string evaluated and re-planned on each entry to the loop.
- `[ <<label>> ] FOREACH target [ SLICE number ] IN ARRAY expression LOOP ... END LOOP [ label ];`
  - Without SLICE (or `SLICE 0`): iterates individual elements in storage order regardless of dimensionality. Target may be a list of variables for arrays of composites.
  - Positive SLICE: must be an integer constant not larger than the array's number of dimensions; target must be an array; receives successive slices of that many dimensions. `FOREACH x SLICE 1 IN ARRAY ARRAY[[1,2,3],[4,5,6],...]` => `{1,2,3}`, `{4,5,6}`, ...

### Error trapping (EXCEPTION blocks) and subtransaction cost  [M6, M5]  (source: plpgsql-control-structures.txt, plpgsql-structure.txt)
- Default: any error aborts the function AND the surrounding transaction.
- Syntax:
  ```
  [ <<label>> ] [ DECLARE declarations ]
  BEGIN
      statements
  EXCEPTION
      WHEN condition [ OR condition ... ] THEN handler_statements
      [ WHEN condition [ OR condition ... ] THEN handler_statements ... ]
  END;
  ```
- Semantics as steps: (1) run statements; (2) on error, abandon remaining statements; (3) search WHEN list for first matching condition; (4) if matched, run handler then continue after END; (5) if not matched, error propagates to an enclosing EXCEPTION block or aborts the function.
- Conditions: any name from Appendix A (case-insensitive); a category name matches all errors in the category; `OTHERS` matches every error EXCEPT `QUERY_CANCELED` and `ASSERT_FAILURE` (those can be trapped by name, "often unwise"); or `WHEN SQLSTATE '22012'` (= `division_by_zero`).
- An error raised inside a handler is not caught by the same EXCEPTION clause; it propagates outward.
- On catch: local PL/pgSQL variables keep the values they had when the error occurred, but ALL changes to persistent database state made within the block are rolled back. Docs example: INSERT 'Tom Jones' before block; inside block UPDATE to 'Joe', `x := x + 1; y := x / 0;` => handler returns incremented x, UPDATE rolled back, INSERT kept => table has Tom Jones.
- Cost (Tip): "A block containing an EXCEPTION clause is significantly more expensive to enter and exit than a block without one. Therefore, don't use EXCEPTION without need." Reason given in 41.2: such a block effectively forms a subtransaction.
- Example 41.2 `merge_db` (UPDATE; if not FOUND, INSERT inside BEGIN...EXCEPTION WHEN unique_violation; LOOP to retry). Docs recommend `INSERT ... ON CONFLICT DO UPDATE` instead. Caveats: assumes unique_violation came from this INSERT (not a trigger's INSERT); may misbehave with more than one unique index (retries regardless of which index failed).
- Inside a handler: special variables `SQLSTATE` (error code) and `SQLERRM` (message); undefined outside handlers.
- `GET STACKED DIAGNOSTICS variable { = | := } item [ , ... ];` (handler only). Items (Table 41.2), all type text; empty string if the exception did not set the item:
  | Name | Description |
  |---|---|
  | RETURNED_SQLSTATE | SQLSTATE error code of the exception |
  | COLUMN_NAME | name of the column related to exception |
  | CONSTRAINT_NAME | name of the constraint related to exception |
  | PG_DATATYPE_NAME | name of the data type related to exception |
  | MESSAGE_TEXT | text of the exception's primary message |
  | TABLE_NAME | name of the table related to exception |
  | SCHEMA_NAME | name of the schema related to exception |
  | PG_EXCEPTION_DETAIL | text of the exception's detail message, if any |
  | PG_EXCEPTION_HINT | text of the exception's hint message, if any |
  | PG_EXCEPTION_CONTEXT | line(s) of text describing the call stack at the time of the exception |
- Execution location: `GET DIAGNOSTICS stack = PG_CONTEXT;` — first line = current function and the GET DIAGNOSTICS statement; following lines = callers. Sample: `PL/pgSQL function inner_func() line 5 at GET DIAGNOSTICS` / `PL/pgSQL function outer_func() line 3 at RETURN`. `PG_EXCEPTION_CONTEXT` gives the same kind of trace for where the error was detected.

### Cursors  [M6, M3]  (source: plpgsql-cursors.txt)
- Purpose: read results a few rows at a time (FOR loops already use a cursor internally); return a cursor reference to the caller to deliver large row sets efficiently.
- All cursor variables are of type `refcursor`. Declaration: `name [ [ NO ] SCROLL ] CURSOR [ ( arguments ) ] FOR query;` (`IS` accepted instead of `FOR` for Oracle compatibility). arguments = comma-separated `name datatype` pairs.
  - `curs1 refcursor;` (unbound) / `curs2 CURSOR FOR SELECT * FROM tenk1;` (bound) / `curs3 CURSOR (key integer) FOR SELECT * FROM tenk1 WHERE unique1 = key;` (bound, parameterized).
- SCROLL => backward fetch allowed; NO SCROLL => backward fetches rejected; neither => query-dependent. SCROLL cannot be used with FOR UPDATE/SHARE queries; prefer NO SCROLL with volatile functions (SCROLL assumes re-reading the output is consistent).
- Opening creates a server-internal **portal** holding the query's execution state. Portal name must be unique within the session. PL/pgSQL assigns a unique name by default; if the cursor variable already holds a non-null string, that string is the portal name.
- Three OPEN forms:
  1. `OPEN unbound_cursorvar [ [ NO ] SCROLL ] FOR query;` — must not be open already; query must return rows (SELECT, EXPLAIN...); variables substituted with their values AT OPEN time (later changes have no effect); plan cached.
  2. `OPEN unbound_cursorvar [ [ NO ] SCROLL ] FOR EXECUTE query_string [ USING expression [, ... ] ];` — no substitution, re-planned.
  3. `OPEN bound_cursorvar [ ( [ argument_name { := | => } ] argument_value [, ...] ) ];` — args iff declared; positional, named, or mixed notation; plan always considered cacheable; SCROLL/NO SCROLL cannot be given here. A bound cursor's query can also reference PL/pgSQL variables, but only variables declared BEFORE the cursor; value taken at OPEN.
- A refcursor value is simply the string name of the portal; it can be returned, passed, assigned without disturbing the portal. All portals are implicitly closed at transaction end.
- `FETCH [ direction { FROM | IN } ] cursor INTO target;` — one row; no row => target NULLs, FOUND false, cursor positioned after last / before first. direction: NEXT (default), PRIOR, FIRST, LAST, ABSOLUTE count, RELATIVE count, FORWARD, BACKWARD (no multi-row variants). count may be any integer expression (SQL FETCH allows only a constant). Backward moves likely fail without SCROLL.
- `MOVE [ direction { FROM | IN } ] cursor;` — reposition only; all SQL FETCH directions allowed including multi-row ones (positions on the last such row); sets FOUND. A bare count with no keyword is deprecated (ambiguous).
- `UPDATE table SET ... WHERE CURRENT OF cursor;` / `DELETE FROM table WHERE CURRENT OF cursor;` — cursor query restrictions (no grouping), best with FOR UPDATE.
- `CLOSE cursor;` — releases the portal before transaction end / frees the variable to be reopened.
- Returning cursors: assign a string to the refcursor before OPEN to choose the portal name, or leave it NULL for an auto-generated name such as `<unnamed cursor 1>` (must be double-quoted to FETCH: `FETCH ALL IN "<unnamed cursor 1>";`). Caller must be inside a transaction block. Functions may `RETURNS SETOF refcursor` to return several cursors.
- Version note: before PostgreSQL 16, bound cursor variables were initialized to their own names (so portal name = variable name); changed to NULL because of conflicts between similarly-named cursors in different functions.
- Cursor FOR loop: `[ <<label>> ] FOR recordvar IN bound_cursorvar [ ( [ argument_name { := | => } ] argument_value [, ...] ) ] LOOP ... END LOOP [ label ];` — cursor must be bound and not already open; auto open/close; recordvar auto-declared `record`, loop-local.

### Transaction management in procedures / DO  [M6, M5]  (source: plpgsql-transactions.txt)
- `COMMIT` and `ROLLBACK` are allowed in procedures invoked by `CALL` and in `DO` blocks. A new transaction starts automatically afterwards; there is no separate START TRANSACTION in PL/pgSQL.
- New transaction gets DEFAULT characteristics (e.g. isolation level). `COMMIT AND CHAIN` / `ROLLBACK AND CHAIN` start the next transaction with the same characteristics as the previous one.
- Allowed only when the call stack from the top level consists solely of CALL / DO with no other intervening command: `CALL proc1() -> CALL proc2() -> CALL proc3()` OK for proc2 and proc3; `CALL proc1() -> SELECT func2() -> CALL proc3()` => proc3 cannot do transaction control (the SELECT intervenes).
- PL/pgSQL does NOT support `SAVEPOINT` / `ROLLBACK TO SAVEPOINT` / `RELEASE SAVEPOINT`. Use blocks with EXCEPTION handlers instead. A block with exception handlers forms a subtransaction => a transaction cannot be ended (COMMIT/ROLLBACK) inside such a block.
- Cursor loops: `FOR r IN SELECT ... LOOP ...; COMMIT; END LOOP;` — the loop's cursor is automatically converted to a HOLDABLE cursor at the first COMMIT or ROLLBACK, i.e. the query is fully evaluated at that point instead of row by row. Cursor still removed after the loop. Consequence: table/row locks taken by the cursor's query are no longer held after the first COMMIT/ROLLBACK.
- Transaction commands are NOT allowed in cursor loops driven by non-read-only commands (e.g. `UPDATE ... RETURNING`).
- Docs example `transaction_test1`: loop i in 0..9, INSERT then COMMIT when `i % 2 = 0` else ROLLBACK => only even values persist.

### RAISE and ASSERT  [M6]  (source: plpgsql-errors-and-messages.txt)
- Five forms:
  ```
  RAISE [ level ] 'format' [, expression [, ... ]] [ USING option { = | := } expression [, ... ] ];
  RAISE [ level ] condition_name [ USING option { = | := } expression [, ... ] ];
  RAISE [ level ] SQLSTATE 'sqlstate' [ USING option { = | := } expression [, ... ] ];
  RAISE [ level ] USING option { = | := } expression [, ... ];
  RAISE ;
  ```
- Levels: `DEBUG`, `LOG`, `INFO`, `NOTICE`, `WARNING`, `EXCEPTION` (default). Only EXCEPTION raises an error (normally aborts the current transaction). Delivery to client/log controlled by `client_min_messages` / `log_min_messages`.
- Format must be a simple string literal (not an expression). `%` = next argument's string form; `%%` = literal percent. Placeholder/argument count mismatch is an error at function COMPILE time.
- USING options: `MESSAGE` (not with form 1), `DETAIL`, `HINT`, `ERRCODE` (condition name or 5-char SQLSTATE; not with forms 2/3), `COLUMN`, `CONSTRAINT`, `DATATYPE`, `TABLE`, `SCHEMA` (names of related objects).
- Equivalent: `RAISE 'Duplicate user ID: %', user_id USING ERRCODE = 'unique_violation';` = `... USING ERRCODE = '23505';` = `RAISE unique_violation USING MESSAGE = 'Duplicate user ID: ' || user_id;`.
- Bare `RAISE;` only inside an EXCEPTION clause: re-throws the error currently being handled. (Before 9.1 it re-threw from the block containing the active handler.)
- Defaults: RAISE EXCEPTION without condition/SQLSTATE => `raise_exception` (`P0001`). No message => condition name or SQLSTATE used as message text.
- Custom SQLSTATE: any five digits and/or upper-case ASCII letters other than `00000`. Avoid codes ending in three zeroes (category codes; can only be trapped by trapping the whole category).
- `ASSERT condition [ , message ];` — false or NULL => `ASSERT_FAILURE` exception with default text "assertion failed" (or message). Message expression not evaluated when the assertion succeeds. An error while evaluating the condition is reported as a normal error. Controlled by GUC `plpgsql.check_asserts` (boolean, default `on`); when off ASSERT does nothing. For program bugs only, not ordinary error conditions. `OTHERS` does not catch ASSERT_FAILURE.

### Trigger functions: data-change triggers  [M6]  (source: plpgsql-trigger.txt)
- Declared with NO arguments and `RETURNS trigger` — even if CREATE TRIGGER passes arguments (those arrive in `TG_ARGV`).
- Special variables created in the top-level block:
  | Variable | Type | Meaning |
  |---|---|---|
  | NEW | record | new row for INSERT/UPDATE in row-level triggers; NULL in statement-level triggers and for DELETE |
  | OLD | record | old row for UPDATE/DELETE in row-level triggers; NULL in statement-level triggers and for INSERT |
  | TG_NAME | name | name of the trigger which fired |
  | TG_WHEN | text | `BEFORE`, `AFTER`, or `INSTEAD OF` |
  | TG_LEVEL | text | `ROW` or `STATEMENT` |
  | TG_OP | text | `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` |
  | TG_RELID | oid (references pg_class.oid) | OID of the table that caused the invocation |
  | TG_RELNAME | name | table name — DEPRECATED, use TG_TABLE_NAME |
  | TG_TABLE_NAME | name | table that caused the invocation |
  | TG_TABLE_SCHEMA | name | schema of that table |
  | TG_NARGS | integer | number of arguments given in CREATE TRIGGER |
  | TG_ARGV | text[] | arguments from CREATE TRIGGER; index counts from 0; invalid index (<0 or >= tg_nargs) yields NULL |
- Return value rules: must return NULL or a record/row with exactly the table's structure.
  - Row-level BEFORE: return NULL => skip the rest of the operation for this row (subsequent triggers not fired, the INSERT/UPDATE/DELETE does not happen for that row). Non-null => operation proceeds with THAT row value; returning something different from NEW alters the row to be inserted/updated. Modify fields of NEW and return it, or build a whole new row.
  - BEFORE DELETE: returned value has no direct effect but must be non-null to let the delete proceed; NEW is NULL in DELETE triggers, so the idiom is `RETURN OLD;`.
  - INSTEAD OF (always row-level, only on views): return NULL => trigger did not perform the update; rest of operation for this row skipped (subsequent triggers not fired, row NOT counted in rows-affected). Otherwise return non-null: NEW for INSERT/UPDATE (may be modified to support INSERT/UPDATE RETURNING; also affects the row passed to subsequent triggers and to the `EXCLUDED` alias in INSERT ... ON CONFLICT DO UPDATE), OLD for DELETE.
  - Row-level AFTER and statement-level BEFORE/AFTER: return value always ignored (may as well be NULL); can still abort the whole operation by raising an error.
- Transition tables: AFTER triggers can use `REFERENCING OLD TABLE AS old_table NEW TABLE AS new_table`; the function reads those names as if they were read-only temp tables. A separate CREATE TRIGGER is needed per event kind because REFERENCING clauses differ (INSERT: NEW TABLE only; UPDATE: both; DELETE: OLD TABLE only); one function can serve all (or use three functions to avoid TG_OP tests). Statement-level + transition tables can be significantly faster than row triggers when many rows change.
- Docs examples (all reusable for lessons):
  - 41.3 `emp_stamp` BEFORE INSERT OR UPDATE FOR EACH ROW: validates `NEW.empname`/`NEW.salary`, stamps `NEW.last_date := current_timestamp; NEW.last_user := current_user; RETURN NEW;`.
  - 41.4 `process_emp_audit` AFTER INSERT OR UPDATE OR DELETE FOR EACH ROW: `INSERT INTO emp_audit SELECT 'D', now(), current_user, OLD.*;` etc.; `RETURN NULL`.
  - 41.5 `update_emp_view` INSTEAD OF INSERT OR UPDATE OR DELETE on a view: performs the DML on the base table, `IF NOT FOUND THEN RETURN NULL; END IF;`, audits, returns NEW/OLD.
  - 41.6 `maint_sales_summary_bytime`: AFTER row trigger maintaining a summary table via delta computation + UPDATE-then-INSERT retry loop with `EXCEPTION WHEN UNIQUE_VIOLATION`.
  - 41.7 the audit example rewritten with three statement-level triggers and transition tables.

### Trigger functions: event triggers  [M6]  (source: plpgsql-trigger.txt)
- Declared with no arguments and `RETURNS event_trigger`.
- Special variables: `TG_EVENT` (text) — event the trigger is fired for; `TG_TAG` (text) — command tag for which the trigger is fired.
- Example 41.8: `CREATE FUNCTION snitch() RETURNS event_trigger AS $$ BEGIN RAISE NOTICE 'snitch: % %', tg_event, tg_tag; END; $$ LANGUAGE plpgsql; CREATE EVENT TRIGGER snitch ON ddl_command_start EXECUTE FUNCTION snitch();`

### Under the hood: variable substitution  [M6, M4]  (source: plpgsql-implementation.txt)
- Variable references in SQL statements/expressions are replaced by query parameters, only where a parameter is syntactically permissible. `INSERT INTO foo (foo) VALUES (foo(foo));` — 1st foo = table, 2nd = column, 3rd = function name, only the LAST can be a variable.
- Substitution can only insert data values; it cannot change which database objects are referenced.
- Ambiguity variable vs. column (e.g. `INSERT INTO dest (col) SELECT foo + bar FROM src;`): by default PL/pgSQL raises an ERROR. Fixes: (a) rename (convention `v_something`); (b) qualify: `src.foo` for column, `blocklabel.foo` for variable, `funcname.param` for parameters/FOUND; (c) GUC `plpgsql.variable_conflict` = `error` (default) | `use_variable` (pre-9.0 behavior) | `use_column` (Oracle-compatible). Superuser-only; affects only subsequent compilations, not statements already compiled in the session. (d) per-function `#variable_conflict error|use_variable|use_column` at the start of the function text (overrides the GUC).
- UPDATE SET targets are syntactically columns, so `SET comment = comment` needs no qualification on the left side.
- No substitution inside EXECUTE strings. Substitution works only in SELECT, INSERT, UPDATE, DELETE, MERGE and commands containing one (EXPLAIN, CREATE TABLE ... AS SELECT).

### Under the hood: compilation and plan caching  [M6, M4]  (source: plpgsql-implementation.txt)
- Step 1: first call of a function in a session => interpreter parses the source text into an internal binary instruction tree. The tree translates the PL/pgSQL statement structure, but embedded SQL expressions/commands are NOT translated yet.
- Step 2: when each expression/SQL command is first executed, it is parsed and analyzed into a prepared statement via `SPI_prepare`. Later visits reuse it. Rarely-visited code paths never pay analysis cost; downside: errors in a statement are not detected until execution reaches it (only trivial syntax errors are caught in the initial parsing pass).
- Step 3: the SPI manager may cache the execution plan. Without a cached plan, a fresh (custom) plan is built on each visit using current variable values. If the statement has no parameters or is executed many times, SPI considers a generic plan independent of parameter values and caches it — typically only when the plan is not very sensitive to the variable values. (Same machinery as PREPARE.)
- Consequences: (1) static SQL must reference the same tables/columns every execution; a parameter cannot be a table/column name — use EXECUTE (cost: new parse analysis + new plan every execution). (2) Record variable field types must not change between calls, since each expression is analyzed with the type present when first reached — EXECUTE as workaround.
- Cache granularity: a trigger function has a separate statement cache per (function, table) combination; a polymorphic function has a separate cache per combination of actual argument types.
- Time-sensitive literal gotcha: `INSERT INTO logtable VALUES (logtxt, 'now');` — parser knows the target column is timestamp, so `'now'` is converted to a timestamp CONSTANT at analysis time and reused for every call in the session (wrong). With `curtime timestamp; curtime := 'now';` the literal is text and is cast on each execution through `textout` + `timestamp_in` (works but inefficient). Use `now()` / `current_timestamp`.

### Development tips, quoting, extra checks  [M6]  (source: plpgsql-development-tips.txt)
- Workflow: `CREATE OR REPLACE FUNCTION` in a file, reload with psql `\i filename.sql`. GUI tools such as pgAdmin also mentioned.
- Without dollar quoting, quote-count chart: 1 quote = begin/end body; 2 = string literal inside body (`''Blah''`); 4 = a single quote inside a string constant in the body; 6 = a quote adjacent to the end of that constant; 10 = two quotes inside a string constant adjacent to its end (function-generating-function case). With dollar quoting, use distinct tags per nesting level (`$PROC$`, `$$`, `$Q$`).
- Additional checks: GUCs `plpgsql.extra_warnings` and `plpgsql.extra_errors`; each a comma-separated list of checks, `none`, or `all`; default `none`. Emitted at function compilation (a function that got a WARNING runs afterwards without further messages). Setting to `all` encouraged in dev/test.
  - `shadowed_variables`: a declaration shadows a previously defined variable. (`WARNING: variable "f1" shadows a previously defined variable`.)
  - `strict_multi_assignment`: number of INTO target variables differs from number of source columns (normally missing values become NULL and extra ones are ignored). (`WARNING: number of source and target fields in assignment does not match`, DETAIL `strict_multi_assignment check of extra_warnings is active.`, HINT `Make sure the query returns the exact list of columns.`)
  - `too_many_rows`: a query with INTO returns more than one row.

### Porting from Oracle PL/SQL  [M6]  (source: plpgsql-porting.txt)
- Main differences:
  1. Ambiguous name (column vs. variable): PL/SQL takes the column; PL/pgSQL errors by default. `plpgsql.variable_conflict = use_column` mimics Oracle.
  2. Function body is a string literal: dollar-quote or escape quotes.
  3. Type names: `varchar2` -> `varchar` or `text`; `number` -> `numeric` (or a more apt numeric type).
  4. No packages: use schemas to group functions.
  5. No package-level variables: keep per-session state in temporary tables.
  6. Integer FOR with REVERSE: PL/SQL counts down from the SECOND number to the first; PL/pgSQL counts down from the FIRST to the second => swap bounds when porting.
  7. FOR loops over queries (non-cursor): target variable(s) must be declared (PL/SQL declares implicitly); advantage: values remain accessible after the loop.
  8. Notational differences for cursor variables.
- Syntax mapping: prototype `RETURN type` -> `RETURNS type`; `IS` -> `AS`; add `LANGUAGE plpgsql`; trailing `/` replaced by closing the string literal; `show errors` not needed; `EXECUTE IMMEDIATE` -> `EXECUTE`; `raise_application_error(-20000, '...')` -> `RAISE EXCEPTION '...'`; `dup_val_on_index` -> `unique_violation`; `CURSOR c IS SELECT` -> `c CURSOR IS SELECT` (in DECLARE); Oracle procedure with OUT params can become a function with OUT params called `SELECT * FROM cs_parse_url(...)`.
- No user-declared exception names in PL/pgSQL; throw user-chosen SQLSTATE values instead. Built-in set of condition names is much larger (Appendix A).
- Implicit rollback after exceptions: a caught exception rolls back all DB changes since the block's BEGIN — equivalent to Oracle's `SAVEPOINT s1; ... EXCEPTION WHEN ... THEN ROLLBACK TO s1;`. When porting that Oracle idiom just drop the SAVEPOINT / ROLLBACK TO.
- EXECUTE: must use `quote_literal`/`quote_ident`; `EXECUTE 'SELECT * FROM $1';` will not work reliably.
- Generating a function from a function (Example 41.10): build the body separately and pass it through `quote_literal(func_body)`; dollar quoting is unsafe there because interpolated data might contain dollar signs.
- Optimization modifiers: volatility and strictness, e.g. `LANGUAGE plpgsql STRICT IMMUTABLE`.
- Appendix: Oracle-compatible `instr(string1, string2 [, n [, m]])` in three overloads — search from nth char for mth occurrence; negative n searches backwards from abs(n)th char from the end; defaults n=1, m=1; returns 0 if not found; `occur_index <= 0` raises `USING ERRCODE = '22003'`.

### PL/Tcl  [M6]  (source: pltcl.txt, pltcl-overview.txt, pltcl-functions.txt, pltcl-data.txt, pltcl-global.txt, pltcl-dbaccess.txt, pltcl-trigger.txt, pltcl-event-trigger.txt, pltcl-error-handling.txt, pltcl-subtransactions.txt, pltcl-transactions.txt, pltcl-config.txt, pltcl-procnames.txt)
- Two variants: `pltcl` (trusted, safe Tcl interpreter; only SPI access commands and `elog`; no server internals / OS access) and `pltclu` (untrusted, full Tcl; superuser-only creation). Install: `CREATE EXTENSION pltcl` / `CREATE EXTENSION pltclu`. Restriction: Tcl functions cannot be used to create I/O functions for new data types.
- Function body = Tcl script. Arguments arrive as variables `$1 ... $n`; result via `return`; return value ignored in procedures. `CREATE FUNCTION tcl_max(integer, integer) RETURNS integer AS $$ if {$1 > $2} {return $1}; return $2 $$ LANGUAGE pltcl STRICT;`
- NULLs: in a non-strict function a NULL argument becomes an empty string; test with `argisnull n`; return SQL NULL with `return_null`.
- Composite arguments: Tcl arrays indexed by attribute name (`$1(salary)`); NULL attributes do not appear in the array. Composite results / OUT params / procedure INOUT results: return a list of column name/value pairs (`return [list squared [expr {$1 * $1}] cubed ...]`); omitted columns = NULL; unexpected column names = error. Tip: `return [array get 1]`.
- Set-returning: call `return_next value` (scalar) or `return_next [list col val ...]` (composite) once per row.
- Data values: arguments are the text form of the inputs (as SELECT would display); `return`/`return_next` accept any string valid as input for the result type / column.
- Global data: one Tcl interpreter PER SQL ROLE for PL/Tcl (security); functions share Tcl globals iff executed by the same role (to share across roles: same owner + SECURITY DEFINER). All PL/TclU functions in a session share ONE interpreter (distinct from the PL/Tcl ones). Per-function private persistent array: `GD` (via upvar; global name = function's internal name).
- Database access commands:
  - `spi_exec ?-count n? ?-array name? command ?loop-body?` — returns number of rows processed (0 for utility). SELECT column values land in Tcl variables named after the columns, or in array `name` (plus element `.tupno` = zero-based row number unless a column has that name). Without loop-body only the first row is stored; with loop-body the script runs once per row (`continue`/`break` work). NULL column => variable is unset. `-count 0` = no limit.
  - `spi_prepare query typelist` — plan saved for the life of the session; `$1 ... $n` placeholders (backslash-escape `\$1` inside double-quoted Tcl strings); returns a query ID.
  - `spi_execp ?-count n? ?-array name? ?-nulls string? queryid ?value-list? ?loop-body?` — `-nulls` is a string of spaces and `n` characters, same length as value-list.
  - `subtransaction command` — runs the Tcl script in an SQL subtransaction; rolled back entirely if the script errors.
  - `quote string` — doubles single quotes and backslashes.
  - `elog level msg` — levels `DEBUG`, `LOG`, `INFO`, `NOTICE`, `WARNING`, `ERROR`, `FATAL` (FATAL aborts the transaction and shuts down the session).
- Trigger variables: `$TG_name`, `$TG_relid`, `$TG_table_name`, `$TG_table_schema`, `$TG_relatts` (Tcl list of column names prefixed with an empty element so `lsearch` gives 1-based attribute numbers; dropped columns appear as empty elements), `$TG_when` (BEFORE/AFTER/INSTEAD OF), `$TG_level` (ROW/STATEMENT), `$TG_op` (INSERT/UPDATE/DELETE/TRUNCATE), `$NEW`, `$OLD` (associative arrays by column name; NULL columns absent; not set for statement-level triggers), `$args` (also `$1 ... $n`).
- Trigger return: `OK` (proceed), `SKIP` (silently suppress the operation for this row), or a list of column name/value pairs = modified row (unmentioned columns become NULL). Modified row meaningful only for row-level BEFORE INSERT/UPDATE and INSTEAD OF INSERT/UPDATE; in BEFORE/INSTEAD OF DELETE it acts like OK; ignored for other trigger types.
- Event triggers: `$TG_event`, `$TG_tag`; return value ignored.
- Error handling: Tcl `error`/`elog ERROR` => SQL error if uncaught; SQL errors inside `spi_exec`, `spi_prepare`, `spi_execp` become Tcl errors catchable with `catch`. EACH of those commands runs its SQL in its own subtransaction, rolled back on error. `$::errorCode` list: `POSTGRES`, PostgreSQL version number, then name/value pairs; always `SQLSTATE`, `condition`, `message`; possibly `detail`, `hint`, `context`, `schema`, `table`, `column`, `datatype`, `constraint`, `statement`, `cursor_position`, `filename`, `lineno`, `funcname`.
- Explicit subtransactions: because each spi_exec is a separate subtransaction, catching an error after the first of two UPDATEs leaves the first committed (docs' funds-transfer example). Wrap both in `subtransaction { ... }` inside `catch`. `subtransaction` does not trap errors; it rolls back on ANY Tcl error inside (not only DB errors); non-error exits (e.g. `return`) do not roll back.
- Transaction management: `commit` and `rollback` commands, only in a procedure or DO block called from the top level; cannot run SQL COMMIT/ROLLBACK through `spi_exec`; new transaction starts automatically; transactions cannot be ended while an explicit subtransaction is active.
- GUCs: `pltcl.start_proc` (string) — name (optionally schema-qualified) of a parameterless `pltcl` function, not SECURITY DEFINER, run whenever a new Tcl interpreter is created (first PL/Tcl call in a session or first call by a new role); failure aborts the calling function and that interpreter is not reused; superuser-only; changes don't affect existing interpreters. `pltclu.start_proc` (string) — same for PL/TclU.
- Tcl procedure names: internal name includes argument type names, plus the function OID when needed for uniqueness. A PL/Tcl function cannot call another one directly in Tcl; go through SQL (`spi_exec`).

### PL/Perl  [M6]  (source: plperl.txt, plperl-funcs.txt, plperl-data.txt, plperl-builtins.txt, plperl-global.txt, plperl-trusted.txt, plperl-triggers.txt, plperl-event-triggers.txt, plperl-under-the-hood.txt)
- Install: `CREATE EXTENSION plperl` (trusted) / `plperlu` (untrusted). Tip: a language installed in `template1` is inherited by all subsequently created databases.
- Body is wrapped in a Perl subroutine, called in SCALAR context (cannot return a list; return references for arrays/records/sets). Arguments in `@_`; result via `return` or last expression. Return value ignored in procedures. DO blocks supported (`DO $$ ... $$ LANGUAGE plperl;`).
- Named nested subroutines are dangerous (function body is already a sub; see perldiag "Variable "%s" will not stay shared"); use anonymous subs via coderef.
- Encoding: arguments converted from database encoding to UTF-8 and back on return.
- NULL <-> `undef`. Non-reference arguments are strings in PostgreSQL external text form. bytea: `decode_bytea` / `encode_bytea`.
- Boolean gotcha: bool arrives as text `'t'`/`'f'` and Perl treats `'f'` as TRUE. Fix: `CREATE EXTENSION bool_plperl;` (or `bool_plperlu`) and `TRANSFORM FOR TYPE bool` on the function => Perl sees 1 or empty; also applies to SPI query args/results inside the function.
- Arrays: returned as Perl array references (`return [['a"b','c,d'],['e\\f','g']];`); passed in as blessed `PostgreSQL::InServer::ARRAY` objects usable as array reference or string (compat with pre-9.1). Multidimensional = nested array refs.
- Composite: passed as hash references keyed by attribute name; returned as hash ref (missing columns = NULL). Procedure INOUT results likewise (`return {a => $a * 3, b => $b * 3};`).
- Sets: `return_next(...)` per row then `return` or (better) `return undef`; or for small sets return a reference to an array of scalars / array refs / hash refs.
- `use strict`: `plperl.use_strict` GUC (affects subsequent compilations only) or `use strict;` at the top of the body. `feature` pragma available with Perl >= 5.10.0.
- Database access functions:
  - `spi_exec_query(query [, limit])` — whole row set in memory: `$rv->{rows}[$i]->{col}`, `$rv->{processed}`, `$rv->{status}` (e.g. `SPI_OK_INSERT`). limit 0/omitted = no limit.
  - `spi_query(command)`, `spi_fetchrow(cursor)`, `spi_cursor_close(cursor)` — row-at-a-time; cursor freed automatically when `spi_fetchrow` returns undef; otherwise must call `spi_cursor_close` or memory leaks.
  - `spi_prepare(command, argument types)`, `spi_query_prepared(plan, arguments)`, `spi_exec_prepared(plan [, attributes], arguments)` (attributes hash ref; only `limit` supported), `spi_freeplan(plan)`. Use single-quoted Perl strings so `$1` is not interpolated.
  - `spi_commit()`, `spi_rollback()` — only in a procedure or DO block called from the top level; SQL COMMIT/ROLLBACK cannot be run via `spi_exec_query`.
- Utility functions: `elog(level, msg)` (levels DEBUG, LOG, INFO, NOTICE, WARNING, ERROR; ERROR ~ Perl `die`), `quote_literal(string)` (undef in => undef out), `quote_nullable(string)`, `quote_ident(string)`, `decode_bytea(string)`, `encode_bytea(string)`, `encode_array_literal(array [, delimiter])` (default delimiter `", "`), `encode_typed_literal(value, typename)`, `encode_array_constructor(array)`, `looks_like_number(string)` (Inf/Infinity count as numbers; undef => undef), `is_array_ref(argument)`.
- Global data: `%_SHARED` hash persists for the session (can hold code refs). One Perl interpreter per SQL role for PL/Perl (separate `%_SHARED` each); all PL/PerlU functions in a session share one interpreter; no communication between PL/Perl and PL/PerlU. Multiple interpreters per process require Perl built with `usemultiplicity` or `useithreads`; otherwise a session can run only PL/PerlU, or PL/Perl functions all called by the same role.
- Trusted restrictions: file handle operations, `require`, `use` (external modules) disabled; violations caught by the validator at CREATE FUNCTION time. WARNING: trusted PL/Perl relies on the Perl `Opcode` module, which Perl documents as not effective for this use case; if that is unacceptable, `REVOKE USAGE ON LANGUAGE plperl FROM PUBLIC`.
- Triggers: `$_TD` hash ref — `$_TD->{new}{foo}`, `$_TD->{old}{foo}`, `{name}`, `{event}` (INSERT, UPDATE, DELETE, TRUNCATE, UNKNOWN), `{when}` (BEFORE, AFTER, INSTEAD OF, UNKNOWN), `{level}` (ROW, STATEMENT, UNKNOWN), `{relid}`, `{table_name}`, `{relname}` (deprecated), `{table_schema}`, `{argc}`, `@{$_TD->{args}}` (absent if argc is 0). Row-level return: `return;` (execute), `"SKIP"` (don't execute), `"MODIFY"` (NEW row was modified by the function).
- Event triggers: `$_TD->{event}`, `$_TD->{tag}`; return value ignored.
- GUCs: `plperl.on_init` (string; Perl code run when an interpreter is first initialized, before specialization; SPI unavailable; postgresql.conf or server command line only; runs in the postmaster if plperl is in `shared_preload_libraries` — saves module load time only for the first interpreter of a session, and no savings on Windows); `plperl.on_plperl_init`, `plperl.on_plperlu_init` (string; run when an interpreter is specialized; on_plperl_init runs after lock-down so only trusted ops; superuser-only); `plperl.use_strict` (boolean).
- Limitations: PL/Perl functions cannot call each other directly; SPI not fully implemented; `spi_exec_query` and returning a big array from an SRF load everything into memory (use `spi_query`/`spi_fetchrow` and `return_next`); at normal session end only `END` blocks run (file handles not flushed, objects not destroyed).

### PL/Python  [M6]  (source: plpython.txt, plpython-funcs.txt, plpython-data.txt, plpython-sharing.txt, plpython-do.txt, plpython-trigger.txt, plpython-database.txt, plpython-subtransaction.txt, plpython-transactions.txt, plpython-util.txt, plpython-python23.txt, plpython-envar.txt)
- Only available untrusted: language `plpython3u` (`CREATE EXTENSION plpython3u`); superuser-only function creation. Python 3 only (older releases had `plpythonu`, `plpython2u`).
- Body is turned into a Python function named like `__plpython_procedure_pymax_23456` (23456 = function OID). Arguments are in list `args` and, if named, as GLOBAL variables. Consequence: `x = x.strip()` fails (assignment makes x local); needs `global x` — docs advise treating parameters as read-only. Result via `return` or `yield`. In a procedure the result must be `None`, otherwise error.
- Type mapping in: boolean -> `bool`; smallint/int/bigint/oid -> `int`; real/double -> `float`; numeric -> `Decimal`; bytea -> `bytes`; everything else (including strings) -> `str`.
- Type mapping out: boolean return = Python truthiness (so `'f'` is TRUE); bytea via `bytes`; all others via `str()` (floats via `repr()`) fed to the type's input function. Mismatches between declared type and Python object are not flagged.
- NULL <-> `None`. Arrays <-> lists (multidimensional = nested lists with equal-sized inner lists; tuples accepted but always treated as one-dimensional). Gotcha: returning the string `"hello"` for `varchar[]` yields `{h,e,l,l,o}`.
- Composite args = mappings (NULL attribute => None). Composite results: sequence (tuple/list, positional, exact length), mapping (extra keys ignored, missing keys are errors), or object with attributes. In an array of composites each composite must be a tuple, not a list. OUT params and procedure INOUT returned the same way.
- SRFs: return a sequence (tuple, list, set), an iterator (`__iter__`/`__next__`), or use a generator (`yield`).
- Sharing data: `SD` = per-function private dict persisting across calls; `GD` = session-global dict visible to all Python functions.
- Trigger dict `TD`: `TD["event"]` (INSERT, UPDATE, DELETE, TRUNCATE), `TD["when"]` (BEFORE, AFTER, INSTEAD OF), `TD["level"]` (ROW, STATEMENT), `TD["new"]`, `TD["old"]`, `TD["name"]`, `TD["table_name"]`, `TD["table_schema"]`, `TD["relid"]`, `TD["args"]` (`[0]..[n-1]`). For BEFORE/INSTEAD OF ROW triggers return `None` or `"OK"` (unmodified), `"SKIP"` (abort the event), or `"MODIFY"` (INSERT/UPDATE: new row was modified); otherwise ignored.
- `plpy` module (auto-imported):
  - `plpy.execute(query [, limit])` — result object indexable `rv[i]["col"]`, `len(rv)`; methods `nrows()` (rows processed), `status()` (the SPI_execute() return value), `colnames()`, `coltypes()`, `coltypmods()` (raise for commands with no result set), `__str__()`. Reads the whole result into memory.
  - `plpy.prepare(query [, argtypes])` then `plpy.execute(plan [, arguments [, limit]])` or `plan.execute(...)`. Prepared plans are automatically saved; keep them in `SD`/`GD` for reuse across calls.
  - `plpy.cursor(query)` / `plpy.cursor(plan [, arguments])` / `plan.cursor(...)` — `fetch(n)` returns a result object of at most n rows (empty when exhausted); also iterable, yielding one dict per row; `close()`. Not DB-API cursors.
  - Errors: `plpy.SPIError` subclasses in `plpy.spiexceptions`, named in CamelCase from condition names (`division_by_zero` -> `DivisionByZero`, `unique_violation` -> `UniqueViolation`, `fdw_error` -> `FdwError`); attribute `sqlstate`.
  - `plpy.subtransaction()` — context manager (`with plpy.subtransaction():`); does not trap errors, only makes the enclosed operations atomic; rolled back on any exception exit.
  - `plpy.commit()`, `plpy.rollback()` — only in top-level procedures / DO blocks; cannot end a transaction while an explicit subtransaction is active.
  - Messages: `plpy.debug`, `plpy.log`, `plpy.info`, `plpy.notice`, `plpy.warning`, `plpy.error`, `plpy.fatal` `(msg, **kwargs)`; `error`/`fatal` raise Python exceptions (`plpy.Error`, `plpy.Fatal`). Keyword-only args: `detail`, `hint`, `sqlstate`, `schema_name`, `table_name`, `column_name`, `datatype_name`, `constraint_name`.
  - Quoting: `plpy.quote_literal(string)`, `plpy.quote_nullable(string)`, `plpy.quote_ident(string)`.
- Environment variables honored (set in the server's environment): PYTHONHOME, PYTHONPATH, PYTHONY2K, PYTHONOPTIMIZE, PYTHONDEBUG, PYTHONVERBOSE, PYTHONCASEOK, PYTHONDONTWRITEBYTECODE, PYTHONIOENCODING, PYTHONUSERBASE, PYTHONHASHSEED.

### SPI: overview, connect/finish, error model  [M6, M4]  (source: spi.txt, spi-interface.txt, spi-spi-connect.txt, spi-spi-finish.txt)
- Server Programming Interface = set of C interface functions giving user-defined C functions access to the parser, planner, and executor, plus some memory management. Most PL database-access facilities are built on SPI. Header: `executor/spi.h`.
- Error model: if a command invoked via SPI fails, control does NOT return to the C function; the transaction or subtransaction in which it runs is rolled back. The documented error-return conventions apply only to errors detected inside the SPI functions themselves. To regain control after an error, wrap SPI calls in your own subtransaction.
- Convention: nonnegative result on success (return value or global `SPI_result`); negative result or NULL on error.
- `int SPI_connect(void)` / `int SPI_connect_ext(int options)` — returns `SPI_OK_CONNECT`; all failures reported via ereport/elog (before v10 some returned `SPI_ERROR_CONNECT`). `SPI_connect()` = `SPI_connect_ext(0)`. Option `SPI_OPT_NONATOMIC`: connection is nonatomic, meaning `SPI_commit`/`SPI_rollback` are allowed (otherwise they error immediately).
- `int SPI_finish(void)` — returns `SPI_OK_FINISH` or `SPI_ERROR_UNCONNECTED`. Not needed if the transaction is aborted via `elog(ERROR)` (SPI cleans itself up).

### SPI: executing commands  [M6, M5]  (source: spi-spi-execute.txt, spi-spi-exec.txt, spi-spi-execute-extended.txt, spi-spi-execute-with-args.txt)
- `int SPI_execute(const char * command, bool read_only, long count)`.
  - `count` = 0: all rows; > 0: stop after count rows are RETRIEVED (like LIMIT). Only effective when the command returns rows: `INSERT INTO foo SELECT * FROM bar` with count 5 inserts everything; with `RETURNING *` at most 5 rows are inserted.
  - Multiple commands per string allowed; result of the last one returned; count applies to each separately; not applied to hidden commands generated by rules.
  - `read_only = false`: increments the command counter and computes a new snapshot before each command (snapshot does not actually change in SERIALIZABLE / REPEATABLE READ; in READ COMMITTED each command sees newly committed work of other sessions).
  - `read_only = true`: neither snapshot nor command counter updated; only plain SELECT allowed; uses the snapshot of the surrounding query; faster; enables genuinely STABLE functions. Mixing read-only and read-write commands in one function is unwise (read-only queries would not see the function's own updates).
  - Results: global `uint64 SPI_processed` and global `SPITupleTable *SPI_tuptable` (set when return is `SPI_OK_SELECT`, `SPI_OK_INSERT_RETURNING`, `SPI_OK_DELETE_RETURNING`, `SPI_OK_UPDATE_RETURNING`, `SPI_OK_MERGE_RETURNING`, and for row-returning utilities like EXPLAIN). COPY / CREATE TABLE AS: `SPI_tuptable` NULL but `SPI_processed` set. Save both globals into locals if needed across later SPI calls.
  - ```
    typedef struct SPITupleTable
    {
        /* Public members */
        TupleDesc   tupdesc;        /* tuple descriptor */
        HeapTuple  *vals;           /* array of tuples */
        uint64      numvals;        /* number of valid tuples */
        /* Private members, not intended for external callers */
        uint64      alloced;        /* allocated length of vals array */
        MemoryContext tuptabcxt;    /* memory context of result table */
        slist_node  next;           /* link for internal bookkeeping */
        SubTransactionId subid;     /* subxact in which tuptable was created */
    } SPITupleTable;
    ```
  - `SPI_finish` frees all SPITupleTables of the current C function; `SPI_freetuptable` frees one early.
- `int SPI_exec(const char * command, long count)` = SPI_execute with read_only false.
- `int SPI_execute_extended(const char *command, const SPIExecuteOptions * options)` — `$n` parameters from `options->params`; always a one-shot plan (mark params `PARAM_FLAG_CONST`). Zero the whole struct first. Fields: `ParamListInfo params`; `bool read_only`; `bool allow_nonatomic` (non-atomic execution of CALL and DO; ignored unless `SPI_OPT_NONATOMIC` was passed to SPI_connect_ext); `bool must_return_tuples`; `uint64 tcount`; `DestReceiver * dest` (tuples streamed to it instead of accumulating; then `SPI_processed` = 0 and `SPI_tuptable` = NULL); `ResourceOwner owner` (ignored here).
- `int SPI_execute_with_args(const char *command, int nargs, Oid *argtypes, Datum *values, const char *nulls, bool read_only, long count)` — plan always customized to the given values; preferred for one-time execution; avoids quoting/SQL injection. `nulls`: array of `' '` (non-null) / `'n'` (null), not NUL-terminated; NULL pointer = no nulls.

### SPI: prepared statements and plan caching  [M4, M6]  (source: spi-spi-prepare.txt, spi-spi-prepare-cursor.txt, spi-spi-prepare-extended.txt, spi-spi-prepare-params.txt, spi-spi-getargcount.txt, spi-spi-getargtypeid.txt, spi-spi-is-cursor-plan.txt, spi-spi-execute-plan.txt, spi-spi-execute-plan-extended.txt, spi-spi-execute-plan-with-paramlist.txt, spi-spi-execp.txt, spi-spi-keepplan.txt, spi-spi-saveplan.txt)
- `SPIPlanPtr SPI_prepare(const char * command, int nargs, Oid * argtypes)` — returns an opaque prepared statement encapsulating parse analysis (name is historical: it no longer necessarily contains a plan). Valid only for the current invocation (freed by SPI_finish) unless saved with `SPI_keepplan`/`SPI_saveplan`. On error returns NULL and sets `SPI_result` (`SPI_ERROR_ARGUMENT` if command NULL, nargs < 0, or nargs > 0 with argtypes NULL).
- Generic vs. custom plan algorithm (the rule PL/pgSQL inherits):
  1. No parameters: a generic plan is created at first `SPI_execute_plan` and used for all subsequent executions.
  2. With parameters: the first few executions generate custom plans specific to the supplied values.
  3. After enough uses, a generic plan is built; if it is not too much more expensive than the custom plans, it is used from then on instead of re-planning each time.
  4. Override with `CURSOR_OPT_GENERIC_PLAN` or `CURSOR_OPT_CUSTOM_PLAN` in cursor options.
- Invalidation: re-analysis and re-planning are forced whenever database objects used in the statement undergo definitional (DDL) changes since the previous use; if `search_path` changes between uses the statement is re-parsed with the new search_path (since 9.3).
- `SPIPlanPtr SPI_prepare_cursor(const char * command, int nargs, Oid * argtypes, int cursorOptions)` — deprecated in favor of SPI_prepare_extended. Useful bits: `CURSOR_OPT_SCROLL`, `CURSOR_OPT_NO_SCROLL`, `CURSOR_OPT_FAST_PLAN`, `CURSOR_OPT_GENERIC_PLAN`, `CURSOR_OPT_CUSTOM_PLAN`; `CURSOR_OPT_HOLD` is ignored.
- `SPIPlanPtr SPI_prepare_extended(const char * command, const SPIPrepareOptions * options)` — fields: `ParserSetupHook parserSetup`, `void * parserSetupArg`, `RawParseMode parseMode` (`RAW_PARSE_DEFAULT` = 0), `int cursorOptions`.
- `SPIPlanPtr SPI_prepare_params(const char * command, ParserSetupHook parserSetup, void * parserSetupArg, int cursorOptions)` — deprecated in favor of SPI_prepare_extended.
- `int SPI_getargcount(SPIPlanPtr plan)` (-1 and `SPI_ERROR_ARGUMENT` if invalid); `Oid SPI_getargtypeid(SPIPlanPtr plan, int argIndex)` (zero-based; `InvalidOid` on error); `bool SPI_is_cursor_plan(SPIPlanPtr plan)` (true iff single command that returns tuples: SELECT without INTO, UPDATE only with RETURNING).
- `int SPI_execute_plan(SPIPlanPtr plan, Datum * values, const char * nulls, bool read_only, long count)` — extra errors `SPI_ERROR_ARGUMENT` (plan NULL/invalid or count < 0), `SPI_ERROR_PARAM` (values NULL but plan has parameters).
- `int SPI_execute_plan_extended(SPIPlanPtr plan, const SPIExecuteOptions * options)` — same options struct as SPI_execute_extended; here `owner` = resource owner holding a reference count on the plan during execution (NULL => `CurrentResourceOwner`; ignored for non-saved plans).
- `int SPI_execute_plan_with_paramlist(SPIPlanPtr plan, ParamListInfo params, bool read_only, long count)` — deprecated in favor of SPI_execute_plan_extended.
- `int SPI_execp(SPIPlanPtr plan, Datum * values, const char * nulls, long count)` = SPI_execute_plan with read_only false.
- `int SPI_keepplan(SPIPlanPtr plan)` — relocates the statement to permanent storage by pointer adjustment (no copy); survives SPI_finish and transaction end; reuse across invocations within the session; returns 0 or `SPI_ERROR_ARGUMENT`.
- `SPIPlanPtr SPI_saveplan(SPIPlanPtr plan)` — copies instead (original not freed); SPI_keepplan preferred. Errors: `SPI_ERROR_ARGUMENT`, `SPI_ERROR_UNCONNECTED`.

### SPI: cursors (portals)  [M6]  (source: spi-spi-cursor-open.txt, spi-spi-cursor-open-with-args.txt, spi-spi-cursor-open-with-paramlist.txt, spi-spi-cursor-parse-open.txt, spi-spi-cursor-find.txt, spi-spi-cursor-fetch.txt, spi-spi-cursor-move.txt, spi-spi-scroll-cursor-fetch.txt, spi-spi-scroll-cursor-move.txt, spi-spi-cursor-close.txt)
- `Portal SPI_cursor_open(const char * name, SPIPlanPtr plan, Datum * values, const char * nulls, bool read_only)` — a cursor is internally a portal. Benefits: (1) rows retrieved a few at a time; (2) the portal can outlive the C function (to end of transaction) — returning its name returns a row set. name NULL = system-chosen. Parameter data is copied into the portal. No error return convention (errors via elog). Exception: if ephemeral named relations / transition tables are registered on the SPI connection, all cursors are closed automatically when the function exits.
- `Portal SPI_cursor_open_with_args(const char *name, const char *command, int nargs, Oid *argtypes, Datum *values, const char *nulls, bool read_only, int cursorOptions)` — deprecated in favor of SPI_cursor_parse_open.
- `Portal SPI_cursor_open_with_paramlist(const char *name, SPIPlanPtr plan, ParamListInfo params, bool read_only)`.
- `Portal SPI_cursor_parse_open(const char *name, const char *command, const SPIParseOpenOptions * options)` — one-shot plan; options fields: `ParamListInfo params`, `int cursorOptions`, `bool read_only`.
- `Portal SPI_cursor_find(const char * name)` — NULL if not found; may return a portal without cursor-like properties.
- `void SPI_cursor_fetch(Portal portal, bool forward, long count)`; `void SPI_cursor_move(Portal portal, bool forward, long count)` — backward may fail without `CURSOR_OPT_SCROLL`.
- `void SPI_scroll_cursor_fetch(Portal portal, FetchDirection direction, long count)`; `void SPI_scroll_cursor_move(Portal portal, FetchDirection direction, long count)` — direction: `FETCH_FORWARD`, `FETCH_BACKWARD`, `FETCH_ABSOLUTE`, `FETCH_RELATIVE`. Move sets `SPI_tuptable` to NULL.
- `void SPI_cursor_close(Portal portal)` — all cursors close automatically at transaction end.

### SPI: ephemeral named relations / transition tables  [M6]  (source: spi-spi-register-relation.txt, spi-spi-unregister-relation.txt, spi-spi-register-trigger-data.txt)
- `int SPI_register_relation(EphemeralNamedRelation enr)` — makes an ENR visible by name to queries planned/executed through the current SPI connection. Returns `SPI_OK_REL_REGISTER`; errors `SPI_ERROR_ARGUMENT`, `SPI_ERROR_UNCONNECTED`, `SPI_ERROR_REL_DUPLICATE`.
- `int SPI_unregister_relation(const char * name)` — `SPI_OK_REL_UNREGISTER`; errors `SPI_ERROR_ARGUMENT`, `SPI_ERROR_UNCONNECTED`, `SPI_ERROR_REL_NOT_FOUND`.
- `int SPI_register_trigger_data(TriggerData *tdata)` — registers the transition tables captured by an AFTER trigger defined with `REFERENCING OLD/NEW TABLE AS ...`; called by a PL trigger handler after connecting (this is how PL/pgSQL sees `old_table`/`new_table`). tdata = `fcinfo->context`. Returns `SPI_OK_TD_REGISTER`; errors `SPI_ERROR_ARGUMENT`, `SPI_ERROR_UNCONNECTED`, `SPI_ERROR_REL_DUPLICATE`.

### SPI: interface support functions  [M6]  (source: spi-interface-support.txt, spi-spi-fname.txt, spi-spi-fnumber.txt, spi-spi-getvalue.txt, spi-spi-getbinval.txt, spi-spi-gettype.txt, spi-spi-gettypeid.txt, spi-spi-getrelname.txt, spi-spi-getnspname.txt, spi-spi-result-code-string.txt)
- All usable from connected and unconnected C functions. Column numbers count from 1.
- `char * SPI_fname(TupleDesc rowdesc, int colnumber)` — copy of column name; NULL + `SPI_ERROR_NOATTRIBUTE` if out of range.
- `int SPI_fnumber(TupleDesc rowdesc, const char * colname)` — system columns (e.g. `ctid`) return negative numbers; test for exact equality with `SPI_ERROR_NOATTRIBUTE`, not `<= 0`.
- `char * SPI_getvalue(HeapTuple row, TupleDesc rowdesc, int colnumber)` — palloc'd string; NULL if column null, out of range (`SPI_ERROR_NOATTRIBUTE`), or no output function (`SPI_ERROR_NOOUTFUNC`).
- `Datum SPI_getbinval(HeapTuple row, TupleDesc rowdesc, int colnumber, bool * isnull)` — no new allocation; pass-by-reference result points into the row.
- `char * SPI_gettype(TupleDesc rowdesc, int colnumber)`; `Oid SPI_gettypeid(TupleDesc rowdesc, int colnumber)`; `char * SPI_getrelname(Relation rel)`; `char * SPI_getnspname(Relation rel)`; `const char * SPI_result_code_string(int code)`.

### SPI: memory management  [M6, M1]  (source: spi-memory.txt, spi-spi-palloc.txt, spi-realloc.txt, spi-spi-pfree.txt, spi-spi-copytuple.txt, spi-spi-returntuple.txt, spi-spi-modifytuple.txt, spi-spi-freetuple.txt, spi-spi-freetupletable.txt, spi-spi-freeplan.txt)
- Memory contexts: destroying a context frees everything allocated in it; `palloc` allocates in the current context.
- `SPI_connect` creates a new private memory context and makes it current; `SPI_finish` restores the previous context ("upper executor context") and destroys the private one. Hence a return value of a pass-by-reference type must NOT be palloc'd while connected — use `SPI_palloc` (allocates in the upper executor context).
- `void * SPI_palloc(Size size)` (errors if not connected); `void * SPI_repalloc(void * pointer, Size size)` (now identical to repalloc); `void SPI_pfree(void * pointer)` (now identical to pfree).
- `HeapTuple SPI_copytuple(HeapTuple row)` — copy in upper executor context; used to return a modified row from a TRIGGER. `HeapTupleHeader SPI_returntuple(HeapTuple row, TupleDesc rowdesc)` — for functions returning COMPOSITE types (convert with `PointerGetDatum`). Both return NULL + `SPI_ERROR_UNCONNECTED` if not connected.
- `HeapTuple SPI_modifytuple(Relation rel, HeapTuple row, int ncols, int * colnum, Datum * values, const char * nulls)` — new row with selected columns replaced; input unmodified; `rel` only supplies the row descriptor ("a misfeature"). Errors: `SPI_ERROR_ARGUMENT`, `SPI_ERROR_NOATTRIBUTE`, `SPI_ERROR_UNCONNECTED`.
- `void SPI_freetuple(HeapTuple row)` (now identical to heap_freetuple); `void SPI_freetuptable(SPITupleTable * tuptable)` (NULL = no-op; guard against double free since 9.3; row sets created inside an aborted subtransaction are freed automatically); `int SPI_freeplan(SPIPlanPtr plan)`.

### SPI: transaction management and visibility  [M5, M6]  (source: spi-transaction.txt, spi-spi-commit.txt, spi-spi-rollback.txt, spi-spi-start-transaction.txt, spi-visibility.txt, spi-examples.txt)
- COMMIT/ROLLBACK cannot be run via SPI_execute (`SPI_ERROR_TRANSACTION` covers BEGIN, COMMIT, ROLLBACK, SAVEPOINT, PREPARE TRANSACTION, COMMIT PREPARED, ROLLBACK PREPARED and variants). Dedicated functions exist, intended mainly for PL implementations supporting procedures invoked by CALL. A transaction boundary in the middle of a function inside a complex SQL expression "will probably result in obscure internal errors or crashes".
- `void SPI_commit(void)` / `void SPI_commit_and_chain(void)` — commit, then a new transaction starts automatically (default characteristics / same characteristics). On commit failure the transaction is rolled back, a new one started, then the error is thrown. Require a nonatomic connection (`SPI_OPT_NONATOMIC`).
- `void SPI_rollback(void)` / `void SPI_rollback_and_chain(void)` — likewise.
- `void SPI_start_transaction(void)` — obsolete no-op.
- Visibility rules:
  1. During execution of an SQL command, its own data changes are invisible to itself (`INSERT INTO a SELECT * FROM a;` — inserted rows invisible to the SELECT part).
  2. Changes made by command C are visible to all commands started after C, whether started inside C (during its execution) or after it.
  3. SPI commands inside a function called by an SQL command follow rule 1 if run read-only (cannot see the calling command's changes) and rule 2 if run read-write (see all changes so far).
  4. All standard PLs choose the mode from volatility: STABLE and IMMUTABLE functions run their commands read-only; VOLATILE functions read-write.
- Example `execq(text, integer) RETURNS int8` (C, `SPI_connect(); ret = SPI_exec(command, cnt); proc = SPI_processed; ... SPI_finish();`): `INSERT INTO a SELECT execq('SELECT * FROM a', 0) * x FROM a;` with rows 1,2 inserts 2 (2 rows * 1) and 6 (3 rows * 2) — the second call sees the row inserted by the first because execq is volatile/read-write.

### Background worker processes  [M1, M6]  (source: bgworker.txt)
- User-supplied C code running in separate processes that are started, stopped and monitored by `postgres` (the postmaster); attached to shared memory; may connect to databases internally and run multiple transactions serially like a regular backend; may also link libpq and act as a client.
- Warning: written in C => unrestricted access to data; considerable robustness and security risks; only carefully audited modules.
- Registration:
  - Static: module listed in `shared_preload_libraries` calls `RegisterBackgroundWorker(BackgroundWorker *worker)` from `_PG_init()` (only callable within the postmaster process).
  - Dynamic: `RegisterDynamicBackgroundWorker(BackgroundWorker *worker, BackgroundWorkerHandle **handle)` from a regular backend or another background worker, after the system is up.
- Struct:
  ```
  typedef void (*bgworker_main_type)(Datum main_arg);
  typedef struct BackgroundWorker
  {
      char        bgw_name[BGW_MAXLEN];
      char        bgw_type[BGW_MAXLEN];
      int         bgw_flags;
      BgWorkerStartTime bgw_start_time;
      int         bgw_restart_time;       /* in seconds, or BGW_NEVER_RESTART */
      char        bgw_library_name[MAXPGPATH];
      char        bgw_function_name[BGW_MAXLEN];
      Datum       bgw_main_arg;
      char        bgw_extra[BGW_EXTRALEN];
      pid_t       bgw_notify_pid;
  } BackgroundWorker;
  ```
- Fields:
  - `bgw_name`, `bgw_type`: strings for log messages / process listings; `bgw_type` identical for all workers of one kind (grouping); `bgw_name` may carry per-process detail.
  - `bgw_flags` (bitmask): `BGWORKER_SHMEM_ACCESS` — shared memory access, REQUIRED; `BGWORKER_BACKEND_DATABASE_CONNECTION` — ability to establish a database connection and run transactions/queries (requires BGWORKER_SHMEM_ACCESS, else start-up fails).
  - `bgw_start_time`: `BgWorkerStart_PostmasterStart` (as soon as postgres finished its own initialization; NOT eligible for database connections), `BgWorkerStart_ConsistentState` (once a consistent state is reached in a hot standby; can connect and run read-only queries), `BgWorkerStart_RecoveryFinished` (once the system entered normal read-write state). The last two are equivalent on a server that is not a hot standby. Only governs when to start; workers are not stopped when the state changes.
  - `bgw_restart_time`: seconds to wait before restarting after a crash; any positive value, or `BGW_NEVER_RESTART`.
  - `bgw_library_name`: library containing the entry point (dynamically loaded by the worker); must be `"postgres"` for a function in core code.
  - `bgw_function_name`: entry-point function; in a loadable library it must be marked `PGDLLEXPORT` and not static.
  - `bgw_main_arg`: Datum passed to the main function `void main(Datum)`. Global `MyBgworkerEntry` points to a copy of the registered struct. On Windows / `EXEC_BACKEND` builds / dynamic workers it is unsafe to pass a Datum by reference — pass an int32 used as an index into a shared-memory array.
  - `bgw_extra`: extra bytes reachable via `MyBgworkerEntry` (not passed as an argument).
  - `bgw_notify_pid`: PID of a backend to which the postmaster sends `SIGUSR1` when the worker starts or exits; 0 for workers registered at postmaster startup or when the registrant will not wait; otherwise `MyProcPid`.
- Connecting: `BackgroundWorkerInitializeConnection(char *dbname, char *username, uint32 flags)` or `BackgroundWorkerInitializeConnectionByOid(Oid dboid, Oid useroid, uint32 flags)`; then SPI can be used. dbname NULL / dboid InvalidOid => not connected to any particular database, but shared catalogs accessible. username NULL / useroid InvalidOid => runs as the bootstrap superuser created during initdb. Flags: `BGWORKER_BYPASS_ALLOWCONN` (connect to databases that disallow user connections), `BGWORKER_BYPASS_ROLELOGINCHECK` (bypass the login check for the role). Only one of the two functions may be called, only once; cannot switch databases.
- Signals are initially BLOCKED on entry to the main function; unblock with `BackgroundWorkerUnblockSignals` (after installing handlers); block with `BackgroundWorkerBlockSignals`.
- Lifecycle rules:
  1. If `bgw_restart_time` is `BGW_NEVER_RESTART`, or the worker exits with exit code 0, or is terminated by `TerminateBackgroundWorker` => automatically unregistered by the postmaster on exit.
  2. Otherwise it is restarted after `bgw_restart_time` seconds, or immediately if the postmaster reinitializes the cluster due to a backend failure.
  3. Workers that only need to pause should sleep interruptibly with `WaitLatch()` including `WL_POSTMASTER_DEATH`, and check the return code to exit promptly if postgres itself has died.
- Dynamic worker handle API: `GetBackgroundWorkerPid(BackgroundWorkerHandle *, pid_t *)` returns `BGWH_NOT_YET_STARTED`, `BGWH_STOPPED` (started but no longer running), or `BGWH_STARTED` (PID returned). `TerminateBackgroundWorker(BackgroundWorkerHandle *)` makes the postmaster send `SIGTERM` and unregister the worker once it is not running. `WaitForBackgroundWorkerStartup(BackgroundWorkerHandle *handle, pid_t *)` (needs `bgw_notify_pid = MyProcPid`) blocks until the postmaster has attempted the start: `BGWH_STARTED`, `BGWH_STOPPED`, or `BGWH_POSTMASTER_DIED`. `WaitForBackgroundWorkerShutdown(BackgroundWorkerHandle *handle)` returns `BGWH_STOPPED` or `BGWH_POSTMASTER_DIED`.
- Notifications: workers can send NOTIFY via SPI or `Async_Notify()` (delivered at transaction commit); they should NOT `LISTEN` (no infrastructure to consume notifications).
- Example module: `src/test/modules/worker_spi`.
- Limit: number of registered background workers is capped by GUC `max_worker_processes`.

## Complete inventories

### PL/pgSQL statement types (every statement the chapter defines)
| Statement | Purpose |
|---|---|
| `[<<label>>] [DECLARE ...] BEGIN ... [EXCEPTION ...] END [label];` | block / subblock; with EXCEPTION = subtransaction |
| `var := expr;` / `var = expr;` | assignment |
| bare SQL command | executed by the main engine (variables become parameters in optimizable commands) |
| `PERFORM query;` | run a SELECT and discard the result |
| `SELECT/INSERT/UPDATE/DELETE/MERGE ... INTO [STRICT] target` | single-row result capture |
| `EXECUTE string [INTO [STRICT] target] [USING ...];` | dynamic SQL, re-planned each time |
| `GET [CURRENT] DIAGNOSTICS var = item [, ...];` | ROW_COUNT, PG_CONTEXT, PG_ROUTINE_OID |
| `GET STACKED DIAGNOSTICS var = item [, ...];` | error details inside a handler |
| `NULL;` | no-op |
| `RETURN [expr];` | return from function / procedure |
| `RETURN NEXT [expr];` | append a row to a SETOF result |
| `RETURN QUERY query;` / `RETURN QUERY EXECUTE string [USING ...];` | append a query's rows |
| `CALL proc(...);` | call a procedure (OUT/INOUT args must be variables) |
| `IF ... THEN ... [ELSIF ... THEN ...] [ELSE ...] END IF;` | conditional (ELSEIF also accepted) |
| `CASE expr WHEN v [, v] THEN ... [ELSE ...] END CASE;` | simple CASE |
| `CASE WHEN cond THEN ... [ELSE ...] END CASE;` | searched CASE |
| `[<<label>>] LOOP ... END LOOP [label];` | unconditional loop |
| `EXIT [label] [WHEN cond];` | leave loop or labeled block |
| `CONTINUE [label] [WHEN cond];` | next iteration |
| `WHILE cond LOOP ... END LOOP;` | pre-tested loop |
| `FOR i IN [REVERSE] a .. b [BY s] LOOP ... END LOOP;` | integer loop |
| `FOR target IN query LOOP ... END LOOP;` | loop over query rows |
| `FOR target IN EXECUTE string [USING ...] LOOP ... END LOOP;` | loop over dynamic query rows |
| `FOR rec IN bound_cursor [(args)] LOOP ... END LOOP;` | loop over a bound cursor |
| `FOREACH target [SLICE n] IN ARRAY expr LOOP ... END LOOP;` | loop over array elements/slices |
| `OPEN cur [[NO] SCROLL] FOR query;` | open unbound cursor |
| `OPEN cur [[NO] SCROLL] FOR EXECUTE string [USING ...];` | open unbound cursor on dynamic query |
| `OPEN bound_cur [(args)];` | open bound cursor |
| `FETCH [direction {FROM|IN}] cur INTO target;` | fetch one row |
| `MOVE [direction {FROM|IN}] cur;` | reposition |
| `UPDATE/DELETE ... WHERE CURRENT OF cur;` | positioned update/delete |
| `CLOSE cur;` | close cursor |
| `COMMIT [AND CHAIN];` / `ROLLBACK [AND CHAIN];` | transaction control (procedures / DO only) |
| `RAISE [level] ...;` | messages and errors (5 forms) |
| `ASSERT cond [, message];` | debugging assertion |

### PL/pgSQL declaration forms
- `name [CONSTANT] type [COLLATE c] [NOT NULL] [{DEFAULT | := | =} expr];`
- `name ALIAS FOR $n;` / `newname ALIAS FOR oldname;`
- `name table.column%TYPE;` / `name variable%TYPE;` (optionally `[]` / `ARRAY[n]`)
- `name table_name%ROWTYPE;` / `name composite_type_name;`
- `name RECORD;`
- `name refcursor;`
- `name [[NO] SCROLL] CURSOR [(arg type, ...)] {FOR | IS} query;`

### PL/pgSQL special variables
- All functions: `FOUND` (boolean), `$1..$n`, `$0` (polymorphic return only).
- Exception handlers: `SQLSTATE`, `SQLERRM`.
- Data-change triggers: `NEW`, `OLD`, `TG_NAME`, `TG_WHEN`, `TG_LEVEL`, `TG_OP`, `TG_RELID`, `TG_RELNAME` (deprecated), `TG_TABLE_NAME`, `TG_TABLE_SCHEMA`, `TG_NARGS`, `TG_ARGV`.
- Event triggers: `TG_EVENT`, `TG_TAG`.

### PL/pgSQL diagnostics items
- GET DIAGNOSTICS: `ROW_COUNT` (bigint), `PG_CONTEXT` (text), `PG_ROUTINE_OID` (oid).
- GET STACKED DIAGNOSTICS (all text): `RETURNED_SQLSTATE`, `COLUMN_NAME`, `CONSTRAINT_NAME`, `PG_DATATYPE_NAME`, `MESSAGE_TEXT`, `TABLE_NAME`, `SCHEMA_NAME`, `PG_EXCEPTION_DETAIL`, `PG_EXCEPTION_HINT`, `PG_EXCEPTION_CONTEXT`.

### RAISE levels and USING options
- Levels: `DEBUG`, `LOG`, `INFO`, `NOTICE`, `WARNING`, `EXCEPTION` (default).
- USING options: `MESSAGE`, `DETAIL`, `HINT`, `ERRCODE`, `COLUMN`, `CONSTRAINT`, `DATATYPE`, `TABLE`, `SCHEMA`.

### Condition names mentioned in this slice (with SQLSTATE where given)
- `division_by_zero` (22012), `unique_violation` (23505), `raise_exception` (P0001), `NO_DATA_FOUND`, `TOO_MANY_ROWS`, `CASE_NOT_FOUND`, `ASSERT_FAILURE`, `QUERY_CANCELED`, `OTHERS` (pseudo-condition), `undefined_table`, `fdw_error`; `22003` used by the instr example (name not given in this slice).

### PL/pgSQL compiler directives (first lines of the function body)
- `#variable_conflict error | use_variable | use_column`
- `#print_strict_params on` (off implied)

### GUCs defined/mentioned in this slice
| GUC | Type / values | Default | Notes |
|---|---|---|---|
| `plpgsql.variable_conflict` | `error`, `use_variable`, `use_column` | `error` | superuser-only; affects subsequent compilations |
| `plpgsql.print_strict_params` | boolean | (not stated in this slice; off implied) | adds parameter values to DETAIL of STRICT failures; subsequent compilations only |
| `plpgsql.check_asserts` | boolean | `on` | off => ASSERT does nothing |
| `plpgsql.extra_warnings` | list of checks, `none`, `all` | `none` | checks: `shadowed_variables`, `strict_multi_assignment`, `too_many_rows` |
| `plpgsql.extra_errors` | list of checks, `none`, `all` | `none` | same checks, raised as ERROR |
| `pltcl.start_proc` | string | empty | superuser-only; parameterless pltcl function run per new interpreter |
| `pltclu.start_proc` | string | empty | same for PL/TclU |
| `plperl.on_init` | string | (not stated) | postgresql.conf / command line only |
| `plperl.on_plperl_init` | string | (not stated) | superuser-only |
| `plperl.on_plperlu_init` | string | (not stated) | superuser-only |
| `plperl.use_strict` | boolean | (not stated) | subsequent compilations only |
| `work_mem` | (defined elsewhere) | — | threshold at which RETURN NEXT/RETURN QUERY result sets spill to disk |
| `client_min_messages`, `log_min_messages` | (defined elsewhere) | — | route RAISE / elog / plpy messages |
| `max_worker_processes` | (defined elsewhere) | — | caps registered background workers |
| `shared_preload_libraries` | (defined elsewhere) | — | static bgworker registration; plperl preloading |

### Procedural languages in this slice
| Language name | Extension | Trusted? | Interpreter isolation |
|---|---|---|---|
| `plpgsql` | installed by default (since 9.0) | trusted | n/a |
| `pltcl` | `CREATE EXTENSION pltcl` | trusted (safe Tcl) | one interpreter per SQL role |
| `pltclu` | `CREATE EXTENSION pltclu` | untrusted | one per session |
| `plperl` | `CREATE EXTENSION plperl` | trusted (Opcode-based; see warning) | one interpreter per SQL role |
| `plperlu` | `CREATE EXTENSION plperlu` | untrusted | one per session |
| `plpython3u` | `CREATE EXTENSION plpython3u` | untrusted only | per-function execution environment; `GD` shared |
- Related extensions named: `bool_plperl`, `bool_plperlu` (bool transforms).

### Trigger context: cross-language map
| Info | PL/pgSQL | PL/Tcl | PL/Perl | PL/Python |
|---|---|---|---|---|
| new row | `NEW` | `$NEW(col)` | `$_TD->{new}{col}` | `TD["new"]` |
| old row | `OLD` | `$OLD(col)` | `$_TD->{old}{col}` | `TD["old"]` |
| trigger name | `TG_NAME` | `$TG_name` | `$_TD->{name}` | `TD["name"]` |
| timing | `TG_WHEN` | `$TG_when` | `$_TD->{when}` | `TD["when"]` |
| level | `TG_LEVEL` | `$TG_level` | `$_TD->{level}` | `TD["level"]` |
| operation | `TG_OP` | `$TG_op` | `$_TD->{event}` | `TD["event"]` |
| table OID | `TG_RELID` | `$TG_relid` | `$_TD->{relid}` | `TD["relid"]` |
| table name | `TG_TABLE_NAME` | `$TG_table_name` | `$_TD->{table_name}` | `TD["table_name"]` |
| schema | `TG_TABLE_SCHEMA` | `$TG_table_schema` | `$_TD->{table_schema}` | `TD["table_schema"]` |
| arg count | `TG_NARGS` | (length of `$args`) | `$_TD->{argc}` | (len of `TD["args"]`) |
| args | `TG_ARGV[0..]` | `$args`, `$1..$n` | `@{$_TD->{args}}` | `TD["args"]` |
| column list | — | `$TG_relatts` | — | — |
| proceed | `RETURN NEW` / `RETURN OLD` | `OK` | `return;` | `None` / `"OK"` |
| skip row | `RETURN NULL` | `SKIP` | `"SKIP"` | `"SKIP"` |
| modified row | return changed `NEW` | return name/value list | `"MODIFY"` | `"MODIFY"` |
| event trigger | `TG_EVENT`, `TG_TAG` | `$TG_event`, `$TG_tag` | `$_TD->{event}`, `$_TD->{tag}` | (not documented in this slice) |

### PL/Tcl commands
`argisnull`, `return_null`, `return_next`, `spi_exec`, `spi_prepare`, `spi_execp`, `subtransaction`, `quote`, `elog`, `commit`, `rollback`.

### PL/Perl built-ins
`spi_exec_query`, `spi_query`, `spi_fetchrow`, `spi_cursor_close`, `spi_prepare`, `spi_query_prepared`, `spi_exec_prepared`, `spi_freeplan`, `spi_commit`, `spi_rollback`, `return_next`, `elog`, `quote_literal`, `quote_nullable`, `quote_ident`, `decode_bytea`, `encode_bytea`, `encode_array_literal`, `encode_typed_literal`, `encode_array_constructor`, `looks_like_number`, `is_array_ref`. Globals: `%_SHARED`, `$_TD`.

### PL/Python `plpy` API
`plpy.execute`, `plpy.prepare`, `plan.execute`, `plpy.cursor`, `plan.cursor`, cursor `.fetch(n)` / `.close()` / iteration, result `.nrows()`, `.status()`, `.colnames()`, `.coltypes()`, `.coltypmods()`, `.__str__()`, `plpy.subtransaction()`, `plpy.commit()`, `plpy.rollback()`, `plpy.debug/log/info/notice/warning/error/fatal`, `plpy.Error`, `plpy.Fatal`, `plpy.SPIError`, `plpy.spiexceptions.*`, `plpy.quote_literal`, `plpy.quote_nullable`, `plpy.quote_ident`. Globals: `args`, `SD`, `GD`, `TD`.

### SPI functions (all 56 documented entry points, one-line purpose)
| Function | Purpose |
|---|---|
| `SPI_connect`, `SPI_connect_ext` | connect a C function to the SPI manager (ext: option flags, `SPI_OPT_NONATOMIC`) |
| `SPI_finish` | disconnect; frees the SPI memory context and tuple tables |
| `SPI_execute` | execute a command string (read_only flag, row count) |
| `SPI_exec` | SPI_execute with read_only = false |
| `SPI_execute_extended` | execute with out-of-line params + options struct (DestReceiver etc.) |
| `SPI_execute_with_args` | execute with out-of-line params given as arrays |
| `SPI_prepare` | prepare a statement without executing |
| `SPI_prepare_cursor` | same plus cursor options (deprecated) |
| `SPI_prepare_extended` | same with options struct (parser hook, parse mode, cursor options) |
| `SPI_prepare_params` | same with parser hook (deprecated) |
| `SPI_getargcount` | number of arguments a prepared statement needs |
| `SPI_getargtypeid` | type OID of the nth argument (zero-based) |
| `SPI_is_cursor_plan` | whether the statement can be used with SPI_cursor_open |
| `SPI_execute_plan` | execute a prepared statement |
| `SPI_execute_plan_extended` | same with options struct |
| `SPI_execute_plan_with_paramlist` | same with ParamListInfo (deprecated) |
| `SPI_execp` | SPI_execute_plan with read_only = false |
| `SPI_cursor_open` | open a cursor (portal) on a prepared statement |
| `SPI_cursor_open_with_args` | open a cursor from query string + arrays (deprecated) |
| `SPI_cursor_open_with_paramlist` | open a cursor with ParamListInfo |
| `SPI_cursor_parse_open` | open a cursor from query string + options struct |
| `SPI_cursor_find` | find an existing portal by name |
| `SPI_cursor_fetch` | fetch rows forward/backward |
| `SPI_cursor_move` | skip rows forward/backward |
| `SPI_scroll_cursor_fetch` | fetch with full FETCH directions |
| `SPI_scroll_cursor_move` | move with full MOVE directions |
| `SPI_cursor_close` | close a cursor |
| `SPI_keepplan` | keep a prepared statement beyond SPI_finish (no copy) |
| `SPI_saveplan` | copy a prepared statement to permanent storage |
| `SPI_register_relation` | register an ephemeral named relation |
| `SPI_unregister_relation` | remove an ephemeral named relation |
| `SPI_register_trigger_data` | register a trigger's transition tables |
| `SPI_fname` | column name for a column number |
| `SPI_fnumber` | column number for a column name |
| `SPI_getvalue` | string value of a column |
| `SPI_getbinval` | Datum value of a column |
| `SPI_gettype` | type name of a column |
| `SPI_gettypeid` | type OID of a column |
| `SPI_getrelname` | relation name |
| `SPI_getnspname` | relation's schema name |
| `SPI_result_code_string` | result code as string |
| `SPI_palloc` | allocate in the upper executor context |
| `SPI_repalloc` | reallocate (same as repalloc) |
| `SPI_pfree` | free (same as pfree) |
| `SPI_copytuple` | copy a row to the upper executor context (trigger results) |
| `SPI_returntuple` | copy a row as a composite Datum (function results) |
| `SPI_modifytuple` | build a row by replacing selected columns |
| `SPI_freetuple` | free a row (same as heap_freetuple) |
| `SPI_freetuptable` | free an SPITupleTable |
| `SPI_freeplan` | free a prepared statement |
| `SPI_commit`, `SPI_commit_and_chain` | commit the current transaction (nonatomic connections only) |
| `SPI_rollback`, `SPI_rollback_and_chain` | roll back the current transaction (nonatomic connections only) |
| `SPI_start_transaction` | obsolete no-op |

### SPI result codes named in this slice
- Success: `SPI_OK_CONNECT`, `SPI_OK_FINISH`, `SPI_OK_SELECT`, `SPI_OK_SELINTO`, `SPI_OK_INSERT`, `SPI_OK_DELETE`, `SPI_OK_UPDATE`, `SPI_OK_MERGE`, `SPI_OK_INSERT_RETURNING`, `SPI_OK_DELETE_RETURNING`, `SPI_OK_UPDATE_RETURNING`, `SPI_OK_MERGE_RETURNING`, `SPI_OK_UTILITY`, `SPI_OK_REWRITTEN`, `SPI_OK_REL_REGISTER`, `SPI_OK_REL_UNREGISTER`, `SPI_OK_TD_REGISTER`.
- Errors: `SPI_ERROR_CONNECT` (pre-v10 only), `SPI_ERROR_ARGUMENT`, `SPI_ERROR_COPY` (COPY TO stdout / COPY FROM stdin attempted), `SPI_ERROR_TRANSACTION`, `SPI_ERROR_OPUNKNOWN`, `SPI_ERROR_UNCONNECTED`, `SPI_ERROR_PARAM`, `SPI_ERROR_NOATTRIBUTE`, `SPI_ERROR_NOOUTFUNC`, `SPI_ERROR_REL_DUPLICATE`, `SPI_ERROR_REL_NOT_FOUND`.
- Globals: `SPI_processed`, `SPI_tuptable`, `SPI_result`.
- Other constants: `SPI_OPT_NONATOMIC`; `PARAM_FLAG_CONST`; `CURSOR_OPT_SCROLL`, `CURSOR_OPT_NO_SCROLL`, `CURSOR_OPT_FAST_PLAN`, `CURSOR_OPT_GENERIC_PLAN`, `CURSOR_OPT_CUSTOM_PLAN`, `CURSOR_OPT_HOLD` (ignored); `RAW_PARSE_DEFAULT`; `FETCH_FORWARD`, `FETCH_BACKWARD`, `FETCH_ABSOLUTE`, `FETCH_RELATIVE`.

### Background worker API
- Functions: `RegisterBackgroundWorker`, `RegisterDynamicBackgroundWorker`, `BackgroundWorkerInitializeConnection`, `BackgroundWorkerInitializeConnectionByOid`, `BackgroundWorkerUnblockSignals`, `BackgroundWorkerBlockSignals`, `GetBackgroundWorkerPid`, `TerminateBackgroundWorker`, `WaitForBackgroundWorkerStartup`, `WaitForBackgroundWorkerShutdown`, `WaitLatch` (with `WL_POSTMASTER_DEATH`), `Async_Notify`.
- Flags: `BGWORKER_SHMEM_ACCESS`, `BGWORKER_BACKEND_DATABASE_CONNECTION`; connection flags `BGWORKER_BYPASS_ALLOWCONN`, `BGWORKER_BYPASS_ROLELOGINCHECK`.
- Start times: `BgWorkerStart_PostmasterStart`, `BgWorkerStart_ConsistentState`, `BgWorkerStart_RecoveryFinished`.
- Status codes: `BGWH_NOT_YET_STARTED`, `BGWH_STARTED`, `BGWH_STOPPED`, `BGWH_POSTMASTER_DIED`.
- Constants: `BGW_MAXLEN`, `BGW_EXTRALEN`, `MAXPGPATH`, `BGW_NEVER_RESTART` (numeric values not given in the docs). Globals: `MyBgworkerEntry`, `MyProcPid`.

## Lesson ideas

### Visualizer ideas
- **Block scope explorer**: nested boxes for the hidden outer block (labeled with the function name, holding parameters + FOUND), the body block, and subblocks. Step through the docs' `quantity` example (30 -> 50, inner 80, `outerblock.quantity` = 50) highlighting which declaration each name resolves to; toggle a label to show qualification.
- **Expression = prepared SELECT**: animate `IF x < y THEN` turning into `PREPARE stmt(integer, integer) AS SELECT $1 < $2`, with variables flowing in as parameter values on each loop iteration.
- **Lazy compilation timeline**: states = (1) source text, (2) instruction tree built on first call in session, (3) each SQL statement parsed/analyzed via `SPI_prepare` on first visit, (4) custom plans for the first executions, (5) generic plan adopted if not much more expensive. Show an unvisited branch staying "unparsed" and an error surfacing only when reached. Side panel: separate caches per (trigger function, table) and per polymorphic argument-type combination.
- **Static SQL vs EXECUTE**: side-by-side lanes; static lane reuses a cached plan, EXECUTE lane re-parses and re-plans each call; show where `USING` values and `format('%I')` identifiers enter.
- **EXCEPTION block as subtransaction**: animate the Tom/Joe Jones example — INSERT outside the block survives, UPDATE inside is rolled back when `x / 0` fires, while local variable `x` keeps its incremented value. Add a cost meter comparing a loop with and without an EXCEPTION block.
- **Trigger return-value decision tree**: inputs TG_WHEN x TG_LEVEL x TG_OP; outputs what NEW/OLD contain (NULL where documented) and what RETURN NULL / NEW / OLD does (skip row, alter row, ignored, INSTEAD OF "not counted in rows affected").
- **Row trigger vs transition tables**: N row-trigger firings vs one statement trigger reading `new_table`/`old_table`.
- **Procedure transaction control**: call-stack diagram showing `CALL -> CALL -> CALL` (allowed) vs `CALL -> SELECT func -> CALL` (COMMIT rejected); the docs loop committing even i and rolling back odd i; cursor FOR loop converting to a holdable cursor at first COMMIT (whole result materialized, locks released).
- **FOUND state machine**: table of statements that set FOUND; emphasize EXECUTE not touching it and FOR loops setting it only on exit.
- **Cursor/portal lifecycle**: refcursor variable (NULL) -> OPEN creates portal `<unnamed cursor 1>` -> FETCH/MOVE position marker over a row strip (before first / after last states) -> CLOSE or transaction end.
- **SPI snapshot modes**: read-only (reuse calling query's snapshot, no command counter bump) vs read-write (command counter increment + new snapshot per command), tied to STABLE/IMMUTABLE vs VOLATILE; replay the `execq` example where the second call sees 3 rows.
- **SPI memory contexts**: SPI_connect pushes a private context; `palloc` there is destroyed at SPI_finish; `SPI_palloc`/`SPI_copytuple`/`SPI_returntuple` allocate in the upper executor context and survive.
- **Background worker lifecycle** (M1 process architecture): postmaster box spawning workers at `BgWorkerStart_PostmasterStart` / `ConsistentState` / `RecoveryFinished`; state machine `BGWH_NOT_YET_STARTED -> BGWH_STARTED -> BGWH_STOPPED`; restart timer `bgw_restart_time` vs unregister on exit code 0 / `BGW_NEVER_RESTART` / `TerminateBackgroundWorker` (SIGTERM); SIGUSR1 to `bgw_notify_pid`; signals blocked until `BackgroundWorkerUnblockSignals`.
- **PL interpreter isolation**: one Tcl/Perl interpreter per SQL role for trusted PLs vs a single shared interpreter for the untrusted variants.

### Playground SQL (PL/pgSQL only; PGlite ships plpgsql. Written from the docs, not executed here)
```sql
-- 1. Scope + labels
DO $$
<<outerblock>>
DECLARE quantity integer := 30;
BEGIN
  quantity := 50;
  DECLARE quantity integer := 80;
  BEGIN
    RAISE NOTICE 'inner % outer %', quantity, outerblock.quantity;
  END;
END $$;

-- 2. FOUND, ROW_COUNT, STRICT
CREATE TABLE emp(empname text PRIMARY KEY, salary int);
INSERT INTO emp VALUES ('ann', 10), ('bob', 20);
DO $$
DECLARE r emp%ROWTYPE; n bigint;
BEGIN
  SELECT * INTO r FROM emp WHERE empname = 'zed';
  RAISE NOTICE 'found=% r=%', FOUND, r;
  UPDATE emp SET salary = salary + 1;
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'rows=%', n;
  BEGIN
    SELECT * INTO STRICT r FROM emp;
  EXCEPTION WHEN TOO_MANY_ROWS THEN RAISE NOTICE 'too many rows';
  END;
END $$;

-- 3. EXCEPTION block rolls back DB changes but keeps variables
CREATE TABLE mytab(firstname text, lastname text);
DO $$
DECLARE x int := 1; y int;
BEGIN
  INSERT INTO mytab VALUES ('Tom', 'Jones');
  BEGIN
    UPDATE mytab SET firstname = 'Joe' WHERE lastname = 'Jones';
    x := x + 1;
    y := x / 0;
  EXCEPTION WHEN division_by_zero THEN
    RAISE NOTICE 'caught, x=% sqlstate=% msg=%', x, SQLSTATE, SQLERRM;
  END;
END $$;
SELECT * FROM mytab;   -- Tom Jones

-- 4. GET STACKED DIAGNOSTICS
DO $$
DECLARE c text; t text;
BEGIN
  INSERT INTO emp VALUES ('ann', 1);
EXCEPTION WHEN unique_violation THEN
  GET STACKED DIAGNOSTICS c = CONSTRAINT_NAME, t = TABLE_NAME;
  RAISE NOTICE 'constraint=% table=%', c, t;
END $$;

-- 5. Dynamic SQL with format + USING
DO $$
DECLARE c bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %I WHERE salary > $1', 'emp') INTO c USING 10;
  RAISE NOTICE 'count=%', c;
END $$;

-- 6. Loops: REVERSE/BY, FOREACH SLICE
DO $$
DECLARE x int[];
BEGIN
  FOR i IN REVERSE 10..1 BY 2 LOOP RAISE NOTICE 'i=%', i; END LOOP;
  FOREACH x SLICE 1 IN ARRAY ARRAY[[1,2,3],[4,5,6]] LOOP RAISE NOTICE 'row=%', x; END LOOP;
END $$;

-- 7. Set-returning function
CREATE FUNCTION squares(n int) RETURNS TABLE(i int, sq int) LANGUAGE plpgsql AS $$
BEGIN
  FOR i IN 1..n LOOP sq := i * i; RETURN NEXT; END LOOP;
END $$;
SELECT * FROM squares(5);

-- 8. Trigger with TG_* variables (docs Example 41.4 shape)
CREATE TABLE emp_audit(operation char(1), stamp timestamp, userid text, empname text, salary int);
CREATE FUNCTION process_emp_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE NOTICE '% % % on %.%', TG_NAME, TG_WHEN, TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME;
  IF TG_OP = 'DELETE' THEN
    INSERT INTO emp_audit SELECT 'D', now(), current_user, OLD.*;
  ELSE
    INSERT INTO emp_audit SELECT left(TG_OP, 1), now(), current_user, NEW.*;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER emp_audit AFTER INSERT OR UPDATE OR DELETE ON emp
  FOR EACH ROW EXECUTE FUNCTION process_emp_audit();
UPDATE emp SET salary = 99 WHERE empname = 'ann';
SELECT * FROM emp_audit;

-- 9. BEFORE trigger: RETURN NULL skips the row
CREATE FUNCTION skip_negative() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.salary < 0 THEN RETURN NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_skip BEFORE INSERT ON emp FOR EACH ROW EXECUTE FUNCTION skip_negative();
INSERT INTO emp VALUES ('neg', -1);   -- INSERT 0 0

-- 10. Procedure with transaction control (docs example)
CREATE TABLE test1(a int);
CREATE PROCEDURE transaction_test1() LANGUAGE plpgsql AS $$
BEGIN
  FOR i IN 0..9 LOOP
    INSERT INTO test1 (a) VALUES (i);
    IF i % 2 = 0 THEN COMMIT; ELSE ROLLBACK; END IF;
  END LOOP;
END $$;
CALL transaction_test1();
SELECT * FROM test1;   -- 0,2,4,6,8

-- 11. Call stack
CREATE FUNCTION inner_func() RETURNS int LANGUAGE plpgsql AS $$
DECLARE stack text;
BEGIN
  GET DIAGNOSTICS stack = PG_CONTEXT;
  RAISE NOTICE E'--- Call Stack ---\n%', stack;
  RETURN 1;
END $$;
CREATE FUNCTION outer_func() RETURNS int LANGUAGE plpgsql AS $$ BEGIN RETURN inner_func(); END $$;
SELECT outer_func();

-- 12. Extra checks
SET plpgsql.extra_warnings TO 'shadowed_variables';
CREATE FUNCTION foo(f1 int) RETURNS int LANGUAGE plpgsql AS $$
DECLARE f1 int; BEGIN RETURN f1; END $$;   -- WARNING: variable "f1" shadows a previously defined variable

-- 13. Cursor returned to caller (needs a transaction block)
CREATE FUNCTION reffunc2() RETURNS refcursor LANGUAGE plpgsql AS $$
DECLARE ref refcursor;
BEGIN OPEN ref FOR SELECT * FROM emp; RETURN ref; END $$;
BEGIN; SELECT reffunc2(); FETCH ALL IN "<unnamed cursor 1>"; COMMIT;
```
- Not runnable in PGlite: PL/Tcl, PL/Perl, PL/Python (not in the listed extension set), SPI C code, background workers (C modules + `shared_preload_libraries`). Teach these with read-only code panels/diagrams.
- Note for snippet 10: procedure transaction control requires the CALL to be issued outside an explicit transaction block at the top level; the playground must send it as its own statement.

### Pitfalls the docs explicitly warn about (with the documented fix)
- `BEGIN;` with a semicolon => syntax error. Fix: no semicolon after BEGIN.
- Confusing PL/pgSQL BEGIN/END with transaction control. They only group statements; use COMMIT/ROLLBACK in procedures.
- Bare `SELECT` without INTO is rejected. Fix: `PERFORM`, or add INTO.
- `SELECT ... INTO` in PL/pgSQL assigns variables, it does not create a table. Fix: `CREATE TABLE ... AS SELECT`.
- INTO without STRICT silently takes the "first" row / NULLs. Fix: `INTO STRICT`, check FOUND, add ORDER BY, or enable `too_many_rows` / `strict_multi_assignment` checks.
- `quote_literal(NULL)` returns NULL and nulls the whole dynamic command. Fix: `quote_nullable`, `format('%L')`, or better `USING`.
- `key = NULL` never matches in dynamic SQL. Fix: `IS NOT DISTINCT FROM` (less efficient).
- Dollar-quoting unknown text inside dynamic SQL breaks if the text contains the delimiter. Fix: quote_literal / quote_nullable / quote_ident.
- Parameters cannot be used for table/column names or in utility commands. Fix: build the string with `format('%I')` and EXECUTE.
- Variable/column name ambiguity raises an error by default. Fix: rename (`v_` prefix), qualify with table / block label / function name, or `#variable_conflict`.
- EXCEPTION blocks are significantly more expensive to enter/exit (subtransaction). Fix: don't use EXCEPTION without need; prefer `INSERT ... ON CONFLICT DO UPDATE` over the update/insert retry loop.
- `WHEN OTHERS` does not catch QUERY_CANCELED and ASSERT_FAILURE (trapping them by name is "often unwise").
- COMMIT/ROLLBACK cannot be used inside a block with an EXCEPTION clause, nor when a non-CALL/DO command intervenes in the call stack, nor in cursor loops driven by non-read-only commands.
- COMMIT inside a cursor FOR loop makes the cursor holdable: fully evaluated at first COMMIT and its locks released.
- RETURN NEXT / RETURN QUERY materialize the whole result set before returning (spill to disk past work_mem). Fix: raise work_mem, or return a refcursor for very large sets.
- `'now'` literal assigned directly into a timestamp column inside a cached statement is frozen at first analysis for the session. Fix: `now()` / `current_timestamp`.
- Record variable field types must not change between calls (cached expression types). Fix: EXECUTE.
- Errors in rarely-executed branches surface only at run time (lazy analysis). Fix: test all paths; use extra_warnings/extra_errors = 'all' in dev.
- SCROLL with FOR UPDATE/SHARE is not allowed; use NO SCROLL with volatile functions.
- `MOVE count` with a bare count is deprecated/ambiguous. Fix: use a direction keyword.
- CASE without ELSE and no match raises CASE_NOT_FOUND. Fix: add ELSE.
- Custom SQLSTATEs ending in three zeroes are category codes. Fix: avoid them.
- ASSERT is for bugs, not ordinary errors. Fix: RAISE.
- Trigger: BEFORE DELETE must return non-null (return OLD); returning NEW in a DELETE trigger returns NULL and skips the delete. `TG_RELNAME` is deprecated: use `TG_TABLE_NAME`.
- The merge_db retry loop assumes the unique_violation came from its own INSERT and can loop wrongly with multiple unique indexes. Fix: ON CONFLICT, or inspect the error with GET STACKED DIAGNOSTICS.
- Oracle porting: REVERSE loop bounds are swapped; packages -> schemas; package variables -> temp tables; drop explicit SAVEPOINT/ROLLBACK TO around handlers.
- PL/Perl: `'f'` is true in Perl. Fix: `bool_plperl` transform. Trusted PL/Perl relies on Opcode, which Perl says is not effective here. Fix (if unacceptable): `REVOKE USAGE ON LANGUAGE plperl FROM PUBLIC`. Unclosed `spi_query` cursors leak memory: call `spi_cursor_close`.
- PL/Python: returning `'f'` for boolean is true; returning a string for an array type splits it into characters; reassigning a parameter needs `global`; `plpy.execute` loads the full result (use `plpy.cursor`).
- PL/Tcl / PL/Python: catching an SPI error after a partially successful sequence leaves earlier statements committed. Fix: explicit `subtransaction { }` / `with plpy.subtransaction():`.
- SPI: a failing SQL command does not return control to C (transaction/subtransaction aborts); palloc'd return values vanish at SPI_finish (use SPI_palloc); don't mix read-only and read-write execution in one function; test `SPI_fnumber` against `SPI_ERROR_NOATTRIBUTE` exactly; save `SPI_processed`/`SPI_tuptable` before the next SPI call.
- Background workers: must set BGWORKER_SHMEM_ACCESS; don't pass by-reference Datums in `bgw_main_arg` for dynamic workers / EXEC_BACKEND; unblock signals yourself; use WaitLatch with WL_POSTMASTER_DEATH rather than exiting; don't LISTEN; only one connection-initialization call, no switching databases.
