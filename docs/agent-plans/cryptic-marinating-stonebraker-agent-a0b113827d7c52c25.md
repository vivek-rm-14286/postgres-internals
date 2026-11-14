# Plan: finish research slice H (PL/pgSQL, PL/Tcl, PL/Perl, PL/Python, SPI, bgworker)

## State when plan mode began
- All 109 pages (idx 475-583) were read in full.
- Output file `/Users/vivek-14286/postgres-internals/curriculum/research/H-plpgsql-pls-spi-bgworker.md` exists, 906 lines, containing: title, `## Notes by topic` (all six chapters), `## Complete inventories`, `## Lesson ideas`.
- NOT yet done: the `## Coverage ledger` section. The file still has the placeholder line `<!--LEDGER-->` directly under the title where the ledger must go.

## Remaining steps (3 small edits to the output file)
1. Replace the line `<!--LEDGER-->` with the "Coverage ledger" block below (verbatim).
2. Fix one count: in the inventory heading `### SPI functions (all 53 documented entry points, one-line purpose)` change `53` to `56` (the table lists 56 function names).
3. Check the file: `grep -c '^| 4[7-9][0-9]\|^| 5[0-8][0-9]'` should give 109 ledger rows; no `<!--LEDGER-->` left.

Nothing else is outstanding. The Playground SQL was written from the docs and never executed (no local Postgres); that is already stated in the file.

## Coverage ledger block to insert

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
