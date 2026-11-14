# Slice M — Part VII Internals: Coding Conventions, NLS, PL Handler, FDW, TABLESAMPLE, Custom Scan, GEQO, Table AM, Index AM API, Built-in Index AMs, BKI, Planner Statistics, Backup Manifest (PostgreSQL 18)

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 949 | source.txt | Ch.55 TOC: formatting, error reporting, style guide, misc conventions |
| 950 | source-format.txt | 4-col tabs, BSD braces, 80 cols, no `//`, pgindent, comment block rules |
| 951 | error-message-reporting.txt | ereport/elog API, every auxiliary routine (errcode, errmsg, errdetail*, errhint, errtable...), defaults |
| 952 | error-style-guide.txt | Primary/detail/hint split, quoting, grammar, tense (could not vs cannot), words to avoid |
| 953 | source-conventions.txt | C99 subset, macros vs inline, signal handler rules (SetLatch), function pointer call style |
| 954 | nls.txt | Ch.56 TOC |
| 955 | nls-translator.txt | PO/MO catalogs, fuzzy/c-format flags, make init-po / update-po, editing rules |
| 956 | nls-programmer.txt | gettext setup, nls.mk variables, message-writing and plural guidelines |
| 957 | plhandler.txt | PL call handler (language_handler), fn_oid/fn_extra, validator, inline handler, check_function_bodies |
| 958 | fdwhandler.txt | Ch.58 intro: FDW = callback set; SQL/MED C API not implemented |
| 959 | fdw-functions.txt | fdw_handler handler and validator (text[], catalog oid) |
| 960 | fdw-callbacks.txt | Every FdwRoutine callback: scan, join, upper, modify, direct modify, truncate, locking, explain, analyze, import, parallel, async, reparameterize |
| 961 | fdw-helpers.txt | GetForeignDataWrapper/Server/UserMapping/Table/ColumnOptions helpers and flags |
| 962 | fdw-planning.txt | fdw_private/fdw_exprs/fdw_recheck_quals/fdw_scan_tlist, parameterized paths, upper rels, ON CONFLICT limit |
| 963 | fdw-row-locking.txt | Early vs late locking, ROW_MARK_* choices, EPQ whole-row copy default |
| 964 | tablesample-method.txt | tsm_handler, TsmRoutine fields parameterTypes / repeatable_across_queries / repeatable_across_scans |
| 965 | tablesample-support-functions.txt | SampleScanGetSampleSize, Init/BeginSampleScan, NextSampleBlock, NextSampleTuple, EndSampleScan |
| 966 | custom-scan.txt | Custom scan provider overview: path -> plan -> execution |
| 967 | custom-scan-path.txt | set_rel_pathlist_hook / set_join_pathlist_hook, CustomPath struct, flags, path callbacks |
| 968 | custom-scan-plan.txt | CustomScan struct, copyObject constraint, CreateCustomScanState |
| 969 | custom-scan-execution.txt | CustomScanState and all exec callbacks incl. parallel DSM and Explain |
| 970 | geqo.txt | Ch.61 TOC and author (Martin Utesch) |
| 971 | geqo-intro.txt | Join ordering as exponential search; System R near-exhaustive planner limits |
| 972 | geqo-intro2.txt | GA vocabulary: population, fitness, chromosome, gene, recombination/mutation/selection |
| 973 | geqo-pg-intro.txt | TSP encoding ('4-1-3-2'), steady-state GA, edge recombination, geqo_seed determinism, future work |
| 974 | geqo-biblio.txt | Further reading list |
| 975 | tableam.txt | table_am_handler, TableAmRoutine, TID constraint, slots, WAL options |
| 976 | indexam.txt | Indexes are secondary; key -> TID mapping; indexes unaware of MVCC |
| 977 | index-api.txt | Full IndexAmRoutine struct and flag implications (amoptionalkey, nulls, amcaninclude, amsummarizing) |
| 978 | index-functions.txt | ambuild ... amtranslatecmptype: every AM function signature and contract |
| 979 | index-scanning.txt | Scan keys, lossy recheck, ordering, direction, mark/restore, amgetbitmap restrictions |
| 980 | index-locking.txt | Lock levels, three heap/index consistency rules, index pin race, ampredlocks |
| 981 | index-unique-checks.txt | MVCC uniqueness cases, UNIQUE_CHECK_NO/YES/PARTIAL/EXISTING |
| 982 | index-cost-estimation.txt | amcostestimate signature, outputs, generic cost formula |
| 986 | indextypes.txt | Ch.65 TOC |
| 987 | btree.txt | Opclass laws, 6 support functions, structure/page splits, bottom-up deletion, deduplication |
| 988 | gist.txt | Table 65.1 opclasses, 12 support methods, sorted/buffered builds, contrib examples |
| 989 | spgist.txt | Table 65.2 opclasses, config/choose/picksplit/consistent structs, limits, all-the-same tuples |
| 990 | gin.txt | Table 65.3 opclasses, extract/consistent methods, entry tree + posting list/tree, pending list, tips, limits |
| 991 | brin.txt | Block ranges, summarization, Table 65.4 opclasses, opclass params, Tables 65.5-65.8 |
| 992 | hash-index.txt | 4-byte hash only, buckets/overflow/bitmap/meta pages, splits, squeeze, limits |
| 1006 | bki.txt | Catalog headers, .dat files, genbki.pl, postgres.bki, bootstrap mode |
| 1007 | system-catalog-declarations.txt | CATALOG macro, CATALOG_VARLEN, forced nullability, bootstrap catalogs |
| 1008 | system-catalog-initial-data.txt | .dat format, OID ranges (1-9999, 10000-11999, 12000 pinned, 16384), BKI_LOOKUP, array types, recipes |
| 1009 | bki-format.txt | BKI token/command syntax |
| 1010 | bki-commands.txt | create / open / close / insert / declare index / declare toast / build indices |
| 1011 | bki-structure.txt | Required ordering of postgres.bki |
| 1012 | bki-example.txt | test_table example |
| 1013 | planner-stats-details.txt | Ch.69 intro |
| 1014 | row-estimation-examples.txt | tenk1 worked examples: histogram, MCV, non-MCV, combined, AND, join selectivity |
| 1015 | multivariate-statistics-examples.txt | dependencies / ndistinct / mcv extended statistics examples |
| 1016 | planner-stats-security.txt | pg_statistic access, LEAKPROOF rule, security-barrier views |
| 1017 | backup-manifest-format.txt | Manifest is UTF-8 JSON object for pg_verifybackup |
| 1018 | backup-manifest-toplevel.txt | Version, System-Identifier, Files, WAL-Ranges, Manifest-Checksum |
| 1019 | backup-manifest-files.txt | Path / Encoded-Path, Size, Last-Modified, Checksum-Algorithm, Checksum |
| 1020 | backup-manifest-wal-ranges.txt | Timeline, Start-LSN, End-LSN; multiple ranges on timeline switch |

## Notes by topic

### Source formatting rules (ch.55.1)  [M1]  (source: source.txt, source-format.txt)
- 4-column tab spacing, tabs preserved (not expanded). One logical indent level = one tab stop.
- BSD layout: curly braces of `if`/`while`/`switch` blocks on their own lines.
- Keep code readable in an 80-column window (not an absolute limit; do not break long error message strings just to fit).
- No C++ `//` comments — `pgindent` converts them to `/* ... */`.
- Multi-line comment style: `/*` newline ` * text` ... ` */`. Comment blocks starting in column 1 are preserved as-is by pgindent; indented blocks get re-flowed unless fenced with `/*----------` ... ` *----------` ` */`.
- All code is run through `pgindent` before each release; rule of thumb "make the new code look like the existing code around it". Editor settings: `src/tools/editors` (Emacs, xemacs, vim). pgindent lives in `src/tools/pgindent`. View with `more -x4` / `less -x4`.

### ereport / elog error reporting API (ch.55.2)  [M1, M6]  (source: error-message-reporting.txt)
- Two required elements for every message: severity level (DEBUG .. PANIC, defined in `src/include/utils/elog.h`) and primary message text. Optional: SQLSTATE code etc.
- `ereport(ERROR, errcode(ERRCODE_DIVISION_BY_ZERO), errmsg("division by zero"));` — `ereport` is a shell macro; only direct parameter is the severity. Older style wraps auxiliary calls in an extra parenthesis pair (required before PG 12, optional now).
- Severity >= ERROR: ereport aborts the current query and does NOT return. Below ERROR it returns normally.
- Auxiliary routines (complete list):
  - `errcode(sqlerrcode)` — SQLSTATE (macros in `src/include/utils/errcodes.h`). Default if omitted: `ERRCODE_INTERNAL_ERROR` for ERROR+, `ERRCODE_WARNING` for WARNING, `ERRCODE_SUCCESSFUL_COMPLETION` for NOTICE and below.
  - `errmsg(fmt, ...)` — primary message; sprintf codes plus `%m` (strerror of errno as of when ereport was reached; never write `strerror(errno)` in the arg list). Run through gettext before formatting.
  - `errmsg_internal` — same, not translated ("cannot happen" cases).
  - `errmsg_plural(fmt_singular, fmt_plural, unsigned long n, ...)`.
  - `errdetail`, `errdetail_internal`, `errdetail_plural`, `errdetail_log` (server log only, never client; use for security-sensitive/bulky details), `errdetail_log_plural`.
  - `errhint`, `errhint_plural`.
  - `errcontext` — used in `error_context_stack` callbacks; may be called multiple times, strings concatenated with newlines.
  - `errposition(int cursorpos)` — location in query string (lexer/parser errors only at present).
  - `errtable(Relation)`, `errtablecol(Relation, attnum)`, `errtableconstraint(Relation, conname)` (pass the heap relation, not the index; indexes count as constraints), `errdatatype(Oid)`, `errdomainconstraint(Oid, conname)` — at most ONE of these five per ereport; complete coverage only for SQLSTATE class 23 (integrity constraint violation) as of 9.3.
  - `errcode_for_file_access()` (picks SQLSTATE from saved errno; pair with `%m`), `errcode_for_socket_access()`.
  - `errhidestmt(bool)` suppress `STATEMENT:` in log; `errhidecontext(bool)` suppress `CONTEXT:`.
- `elog(level, "fmt", ...)` is exactly `ereport(level, errmsg_internal("fmt", ...))`: SQLSTATE always defaulted, never translated; use only for internal errors / debug logging.

### Error message style guide (ch.55.3)  [M1, M6]  (source: error-style-guide.txt)
- Primary: short (one line), factual, no implementation details/function names. Detail: factual extras (e.g. failed syscall + args). Hint: suggestions to fix. Example: Primary `could not create shared memory segment: %m`; Detail `Failed syscall was shmget(key=%d, size=%u, 0%o).`
- Formatting: no formatting assumptions, no trailing newline, no tabs; `\n` only as suggested paragraph break.
- Quotes: double quotes in English. Always quote file names, user-supplied identifiers, configuration variable names, anything that may contain words; do not quote things that cannot contain words (operator names). Do not re-quote output of self-quoting functions such as `format_type_be()`.
- Grammar: primary messages — no leading capital, no trailing period, never an exclamation point. Detail/hint — complete sentences, capitalised, period, two spaces between sentences. Context strings — no capital, no period, normally not full sentences.
- Lower case wording; upper case SQL commands/keywords. Active voice; telegram style when the program is the subject; never "I".
- Tense: `could not open file "%s": %m` (attempt failed, may succeed later) vs `cannot open file "%s"` (permanently impossible).
- State the type of a named object. Square brackets only for optional args in synopses or array subscripts.
- Embedding generated text: `could not open file %s: %m`. Always give a reason. Do not name the reporting routine or called functions (`BAD: open() failed: %m` -> `BETTER: could not open file %s: %m`; `BAD: pg_strtoint32: error in "z": cannot parse "z"` -> `BETTER: invalid input syntax for type integer: "z"`).
- Tricky words: avoid "unable" (use cannot/could not), "bad" (say why, e.g. "invalid format"), "illegal" (use "invalid"), "unknown" (use "unrecognized" + the value: `unrecognized node type: 42`), find vs exists (find = search algorithm failed; exists = known location missing), may/can/might (permission/ability/possibility), contractions (use "cannot"), "non-negative" (say "greater than zero" or "greater than or equal to zero").
- Spell out: avoid spec, stats, parens, auth, xact.

### Miscellaneous coding conventions (ch.55.4)  [M1]  (source: source-conventions.txt)
- C standard: C99 only. Not permitted even though C99: variable length arrays, intermingled declarations and code, `//` comments, universal character names. Later-standard / compiler features allowed only with fallback (e.g. `_Static_assert()`, `__builtin_constant_p`).
- Macros with args and `static inline` functions both OK; inline preferred when multiple-evaluation hazard (e.g. `#define Max(x, y) ((x) > (y) ? (x) : (y))`) or macro would be long. Inline functions referencing backend-only symbols must be wrapped in `#ifndef FRONTEND` (e.g. `MemoryContextSwitchTo` uses `CurrentMemoryContext`).
- Signal handlers: may only call async-signal-safe functions and touch `volatile sig_atomic_t` variables; `SetLatch()` is deemed signal safe. Typical handler: set flag (`got_SIGHUP = true;`) then `SetLatch(MyLatch);`.
- Function pointers: explicitly dereference simple variables `(*emit_log_hook) (edata);`; omit for struct members `paramInfo->paramFetch(paramInfo, paramId);`.

### Native Language Support (ch.56)  [M1]  (source: nls.txt, nls-translator.txt, nls-programmer.txt)
- Build with `--enable-nls` (checks for `libintl` and `msgfmt`). New translation / merges need `xgettext` and `msgmerge`; GNU Gettext 0.10.36 or later recommended.
- Message catalogs: one per program per language. PO (Portable Object, text, edited by translators) and MO (Machine Object, binary, generated from PO, used at run time). Names: `psql.po`, `fr.mo`.
- PO syntax: `msgid "original"` / `msgstr "translated"`; strings may continue on following lines; C escapes allowed. `# ` translator comment; `#.` extracted source comment; `#:` source location (`filename.c:1023`); `#,` flags — `fuzzy` (possibly outdated; fuzzy messages are NOT shown to end users / not installed) and `c-format` (printf template).
- A program is prepared for translation if its directory contains `nls.mk`. Files `language.po` (ISO 639-1 lowercase, e.g. `fr.po`) or `language_region.po` (ISO 3166-1 uppercase, e.g. `pt_BR.po`).
- `make init-po` creates `progname.pot` (template); copy to `language.po`; add the language code to `po/LINGUAS`. `make update-po` regenerates the pot and merges into existing PO files, output saved as `.po.new`; uncertain merges marked fuzzy.
- Editing rules: only change text after `msgstr`, comments, fuzzy flag. Untranslated/empty -> falls back to original. Keep trailing newlines/tabs; keep same format specifiers in same order, or reorder with `%2$s` / `%1$u` positional syntax (digits$ immediately after %). Factual mistake in original: report, do not translate.
- Programmer mechanics: at startup under `#ifdef ENABLE_NLS`: `setlocale(LC_ALL, ""); bindtextdomain("progname", LOCALEDIR); textdomain("progname");`. Wrap strings in `gettext()` (no-op if NLS not configured); shortcut `#define _(x) gettext(x)`; or make a central function (like `ereport()`) call gettext internally.
- `nls.mk` variables: `CATALOG_NAME` (textdomain name), `GETTEXT_FILES` (files with translatable strings; first "file" may be `+` followed by a file listing names one per line), `GETTEXT_TRIGGERS` (functions containing translatable strings; default only `gettext()`; `func:2` for 2nd arg; `func:1,2` for singular/plural). Plus `po/LINGUAS` (initially empty).
- Message-writing guidelines: never build sentences at run time (`"Files were %s.\n", flag ? "copied" : "removed"`); never hand-roll plurals (`"copied %d file%s"`), prefer `"number of copied files: %d"`, or `errmsg_plural("copied %d file", "copied %d files", n, n)`; outside ereport use `ngettext`. Translator comments: `/* translator: ... */` immediately before the string (copied into catalogs).

### Procedural language handler (ch.57)  [M6]  (source: plhandler.txt)
- Every call to a function not written in the compiled "version 1" interface (includes user PLs and SQL-language functions) goes through the language's call handler.
- Call handler: C version-1 function, registered as taking no arguments and returning pseudo-type `language_handler` (prevents direct SQL calls).
- It receives a `FunctionCallInfoBaseData *`; returns `Datum` (may set `isnull`). Difference from ordinary function: `flinfo->fn_oid` holds the OID of the actual target function, and the argument list matches the target function's declaration.
- Handler must fetch the function's `pg_proc` row; source text (the `AS` clause of CREATE FUNCTION) is in `pg_proc.prosrc` (could be source, a file path, anything).
- Caching: `flinfo->fn_extra` (initially NULL) may point at per-function info; must live at least until end of the current query — allocate in `flinfo->fn_mcxt`, or a longer-lived context to cache across queries.
- Trigger calls: no normal arguments; `FunctionCallInfoBaseData.context` points to a `TriggerData` struct (NULL in plain calls).
- Template: `src/test/modules/plsample`.
- Optional validator: takes one `oid` (the function's pg_proc OID), customarily returns `void`; called at end of CREATE FUNCTION (create or update). Must first call `CheckFunctionValidatorAccess()`. Checks arg/result type support and body syntax; errors via `ereport()` roll back the CREATE FUNCTION.
  - Must honor `check_function_bodies`: when off, skip expensive/context-sensitive checks and anything that executes code. pg_dump turns it off. Core CREATE FUNCTION only executes attached `SET` clauses when `check_function_bodies` is on, so GUC-dependent checks must be skipped when it is off. The call handler must not assume the validator fully checked the function.
- Optional inline handler: takes one `internal` parameter (pointer to `InlineCodeBlock` struct with the DO block text), customarily returns `void`; invoked for `DO`.
- Recommendation: package handler functions + `CREATE LANGUAGE` in an extension. Reference implementations in `src/pl`.

### FDW: handler, validator, overview (ch.58 intro, 58.1)  [M6]  (source: fdwhandler.txt, fdw-functions.txt)
- All operations on a foreign table go through its FDW (set of C callbacks). PostgreSQL does NOT implement the SQL-standard (SQL/MED) FDW C API. Reference FDWs in `contrib`.
- Handler function: C version-1, no arguments, returns pseudo-type `fdw_handler`; returns a palloc'd `FdwRoutine` struct of function pointers (declared in `src/include/foreign/fdwapi.h`). Callbacks are plain C functions, not SQL-visible. Scan-related callbacks are required, the rest optional.
- Validator function: two args — `text[]` of options and an `oid` of the catalog the object lives in: `AttributeRelationId`, `ForeignDataWrapperRelationId`, `ForeignServerRelationId`, `ForeignTableRelationId`, `UserMappingRelationId`. Validates options in CREATE/ALTER for the wrapper, servers, user mappings and foreign tables. Without a validator, options are not checked at create/alter time.

### FDW callback routines (ch.58.2)  [M6, M4]  (source: fdw-callbacks.txt)
Scanning (all REQUIRED):
- `void GetForeignRelSize(PlannerInfo *root, RelOptInfo *baserel, Oid foreigntableid)` — start of planning. Must update `baserel->rows` (rows after restriction quals; initial value is a constant default). May update `baserel->width` and `baserel->tuples` (initially `pg_class.reltuples`; -1 if never ANALYZEd).
- `void GetForeignPaths(root, baserel, foreigntableid)` — must add at least one `ForeignPath` via `add_path` to `baserel->pathlist` (use `create_foreignscan_path`). Can add several (e.g. one with pathkeys for pre-sorted output). Each needs cost estimates.
- `ForeignScan *GetForeignPlan(root, baserel, foreigntableid, ForeignPath *best_path, List *tlist, List *scan_clauses, Plan *outer_plan)` — end of planning; build with `make_foreignscan`. `foreigntableid` is `InvalidOid` for a join path. `outer_plan` used for `RecheckForeignScan` rechecks.
- `void BeginForeignScan(ForeignScanState *node, int eflags)` — executor startup; do not start the scan itself; `fdw_state` is NULL on entry. If `eflags & EXEC_FLAG_EXPLAIN_ONLY`: no externally visible actions.
- `TupleTableSlot *IterateForeignScan(ForeignScanState *node)` — return one row in the node's `ScanTupleSlot` (virtual tuple preferred), NULL at end. Runs in a short-lived per-call memory context (use a context made in Begin, or `es_query_cxt`). Rows must match `fdw_scan_tlist` if supplied, else the foreign table row type; unfetched columns must be NULL. Executor does not check constraints on returned rows, but the planner trusts declared constraints (wrong results possible) — raising an error on violation may be appropriate.
- `void ReScanForeignScan(node)` — restart; parameters may have changed.
- `void EndForeignScan(node)` — release resources (files, remote connections).
Foreign joins (optional):
- `void GetForeignJoinPaths(root, RelOptInfo *joinrel, outerrel, innerrel, JoinType jointype, JoinPathExtraData *extra)` — joins of 2+ foreign tables on the SAME foreign server; use `create_foreign_join_path` + `add_path`; need not produce a path. Called repeatedly per joinrel with different inner/outer combos; join clauses in `extra->restrictlist` vary. Resulting `ForeignScan` has `scanrelid = 0`; `fs_relids` set by core (since PG 16 includes outer-join rangetable indexes; new `fs_base_relids` has only base rels). FDW must fill `fdw_scan_tlist`.
Upper-rel (post-scan/join) planning (optional):
- `void GetForeignUpperPaths(root, UpperRelationKind stage, RelOptInfo *input_rel, RelOptInfo *output_rel, void *extra)` — remote aggregation, window functions, sorting, table updates; called only if ALL base relations belong to the same FDW; use `create_foreign_upper_path`. `extra` is `GroupPathExtraData *` for `UPPERREL_PARTIAL_GROUP_AGG`/`UPPERREL_GROUP_AGG`, `FinalPathExtraData *` for `UPPERREL_FINAL`.
Updating (optional):
- `void AddForeignUpdateTargets(root, Index rtindex, RangeTblEntry *target_rte, Relation target_relation)` — add junk row-identity columns via `add_row_identity_var`. Core junk names: `tableoid`, `ctid`/`ctidN`, `wholerow` (whole-row Var with vartype RECORD), `wholerowN`. NULL pointer => DELETE impossible (UPDATE may work with an unchanging PK).
- `List *PlanForeignModify(root, ModifyTable *plan, Index resultRelation, int subplan_index)` — returns private List delivered to `BeginForeignModify` (NIL if pointer NULL).
- `void BeginForeignModify(ModifyTableState *mtstate, ResultRelInfo *rinfo, List *fdw_private, int subplan_index, int eflags)` — private state in `rinfo->ri_FdwState`; honor `EXEC_FLAG_EXPLAIN_ONLY`.
- `TupleTableSlot *ExecForeignInsert(EState *estate, ResultRelInfo *rinfo, TupleTableSlot *slot, TupleTableSlot *planSlot)` — return slot with actually inserted data, or NULL if no row inserted (triggers). Returned data used only for RETURNING, view WITH CHECK OPTION, or AFTER ROW trigger; a slot must be returned on success or the row count is wrong. NULL pointer => inserts error out. Also used for tuple routing into foreign partitions and `COPY FROM`.
- `TupleTableSlot **ExecForeignBatchInsert(estate, rinfo, TupleTableSlot **slots, TupleTableSlot **planSlots, int *numSlots)` — bulk insert; number inserted returned via `*numSlots`. Not used if INSERT has RETURNING. Falls back to `ExecForeignInsert` if this or `GetForeignModifyBatchSize` is NULL.
- `int GetForeignModifyBatchSize(ResultRelInfo *rinfo)` — max tuples per batch call.
- `TupleTableSlot *ExecForeignUpdate(estate, rinfo, slot, planSlot)` — `slot` = new row matching table rowtype; `planSlot` contains only changed columns plus junk columns (do not index by table attnums).
- `TupleTableSlot *ExecForeignDelete(estate, rinfo, slot, planSlot)` — identify row via junk columns in `planSlot`.
- `void EndForeignModify(estate, rinfo)`.
- `void BeginForeignInsert(ModifyTableState *mtstate, ResultRelInfo *rinfo)` / `void EndForeignInsert(estate, rinfo)` — for tuple routing into foreign partitions and `COPY FROM` on a foreign table (under COPY, plan data in mtstate absent and `planSlot` is NULL).
- `int IsForeignRelUpdatable(Relation rel)` — bitmask using `CmdType`: `(1 << CMD_UPDATE) = 4`, `(1 << CMD_INSERT) = 8`, `(1 << CMD_DELETE) = 16`. NULL => inferred from presence of ExecForeignInsert/Update/Delete. Also feeds `information_schema` updatability.
- Direct modify (whole UPDATE/DELETE/INSERT pushed remote; only when no row-level local triggers, stored generated columns, or parent-view WITH CHECK OPTION): `bool PlanDirectModify(root, plan, resultRelation, subplan_index)` (rewrite the target subplan into a `ForeignScan` with `operation` = `CMD_UPDATE`/`CMD_INSERT`/`CMD_DELETE` and `resultRelation` set), `void BeginDirectModify(ForeignScanState *node, int eflags)`, `TupleTableSlot *IterateDirectModify(node)` (returns NULL when no RETURNING; else rows for RETURNING, storing actual data in `node->resultRelInfo->ri_projectReturning->pi_exprContext->ecxt_scantuple`; the FDW must increment the query's row count itself, and the node row count for EXPLAIN ANALYZE), `void EndDirectModify(node)`.
TRUNCATE:
- `void ExecForeignTruncate(List *rels, DropBehavior behavior, bool restart_seqs)` — `behavior` = `DROP_RESTRICT`/`DROP_CASCADE`; `restart_seqs` true = RESTART IDENTITY. `ONLY` is not passed. Called once per foreign server (all rels on the same server). NULL => TRUNCATE errors.
Row locking:
- `RowMarkType GetForeignRowMarkType(RangeTblEntry *rte, LockClauseStrength strength)` — planning, for each foreign table in UPDATE/DELETE/SELECT FOR UPDATE/SHARE that is not the UPDATE/DELETE target. NULL => always `ROW_MARK_COPY`.
- `void RefetchForeignRow(EState *estate, ExecRowMark *erm, Datum rowid, TupleTableSlot *slot, bool *updated)` — lock per `erm->markType` (`ROW_MARK_REFERENCE` = refetch without lock); set `*updated` if a newer version was fetched (return true if unsure). Lock failure => error, empty slot only if `erm->waitPolicy` is SKIP LOCKED. `rowid` currently can only be a `tid` (the ctid).
- `bool RecheckForeignScan(ForeignScanState *node, TupleTableSlot *slot)` — EPQ recheck; for non-join-pushdown FDWs set NULL and use `fdw_recheck_quals`. Join pushdown: build an alternative local join plan as the `ForeignScan` outer subplan (`GetExistingLocalJoinPath` finds an unparameterized local join path; returns NULL if none).
EXPLAIN: `void ExplainForeignScan(ForeignScanState *node, ExplainState *es)`, `void ExplainForeignModify(mtstate, rinfo, fdw_private, subplan_index, es)`, `void ExplainDirectModify(node, es)` — use `ExplainPropertyText` etc.
ANALYZE: `bool AnalyzeForeignTable(Relation relation, AcquireSampleRowsFunc *func, BlockNumber *totalpages)`; sampler signature `int AcquireSampleRowsFunc(Relation relation, int elevel, HeapTuple *rows, int targrows, double *totalrows, double *totaldeadrows)` — returns number of rows collected (random sample of up to `targrows`).
IMPORT FOREIGN SCHEMA: `List *ImportForeignSchema(ImportForeignSchemaStmt *stmt, Oid serverOid)` — returns list of C strings, each a `CREATE FOREIGN TABLE` command. `stmt->remote_schema`, `list_type` in `FDW_IMPORT_SCHEMA_ALL` / `FDW_IMPORT_SCHEMA_LIMIT_TO` / `FDW_IMPORT_SCHEMA_EXCEPT`, `table_list`, `options`; `local_schema` inserted by core; core also filters; helper `IsImportableForeignTable()`.
Parallel: `bool IsForeignScanParallelSafe(root, rel, rte)` (undefined => leader only; true does not mean the scan itself is parallel), `Size EstimateDSMForeignScan(node, ParallelContext *pcxt)` (bytes, upper bound), `void InitializeDSMForeignScan(node, pcxt, void *coordinate)`, `void ReInitializeDSMForeignScan(node, pcxt, coordinate)` (reset shared state only), `void InitializeWorkerForeignScan(node, shm_toc *toc, coordinate)`, `void ShutdownForeignScan(node)` (called just before the DSM segment is destroyed; not always called). DSM must not contain pointers; each row must be returned exactly once across processes.
Async (all required for async): `bool IsForeignPathAsyncCapable(ForeignPath *path)` (called only when the path is a direct child of an `AppendPath`), `void ForeignAsyncRequest(AsyncRequest *areq)` (store tuple in `areq->result`, set `areq->request_complete`; or set `callback_pending`; helpers `ExecAsyncRequestDone` / `ExecAsyncRequestPending`), `void ForeignAsyncConfigureWait(areq)` (add fd event to parent Append's `as_eventset`), `void ForeignAsyncNotify(areq)`.
Reparameterization: `List *ReparameterizeForeignPathByChild(root, List *fdw_private, RelOptInfo *child_rel)` — may use `reparameterize_path_by_child`, `adjust_appendrel_attrs`, `adjust_appendrel_attrs_multilevel`.

### FDW helper functions (ch.58.3)  [M6]  (source: fdw-helpers.txt)
- Header `foreign/foreign.h` (also defines the returned structs).
- `ForeignDataWrapper *GetForeignDataWrapperExtended(Oid fdwid, bits16 flags)` — flag `FDW_MISSING_OK` returns NULL instead of error. `GetForeignDataWrapper(Oid fdwid)`.
- `ForeignServer *GetForeignServerExtended(Oid serverid, bits16 flags)` — flag `FSV_MISSING_OK`. `GetForeignServer(Oid serverid)`.
- `UserMapping *GetUserMapping(Oid userid, Oid serverid)` — falls back to the PUBLIC mapping, errors if none.
- `ForeignTable *GetForeignTable(Oid relid)`.
- `List *GetForeignColumnOptions(Oid relid, AttrNumber attnum)` — list of `DefElem`, NIL if none.
- `GetForeignDataWrapperByName(const char *name, bool missing_ok)`, `GetForeignServerByName(const char *name, bool missing_ok)`.

### FDW query planning (ch.58.4)  [M6, M4]  (source: fdw-planning.txt)
- `baserel->baserestrictinfo` = WHERE restriction quals (FDW need not enforce them; executor can). `baserel->reltarget->exprs` = columns the ForeignScan must EMIT (not columns used only in quals).
- Private storage: `baserel->fdw_private` (void *, initialised NULL; carry info RelSize -> Paths -> Plan); `ForeignPath.fdw_private` (declared `List *`, best practice `nodeToString`-dumpable); `ForeignScan.fdw_exprs` (expression trees executed at run time, post-processed by planner) and `ForeignScan.fdw_private` — both must be `copyObject`-copyable. Everything should be palloc'd.
- In `GetForeignPlan`: `scan_clauses` = same clauses as `baserestrictinfo` (possibly reordered). Simple FDW: `extract_actual_clauses` and put all into the plan qual list (executor checks all). Smarter FDW removes clauses it evaluates remotely.
- Pushdown example: clause `foreign_variable = sub_expression` identified in `GetForeignPaths` (affects cost), RestrictInfo pointer in path `fdw_private`; `GetForeignPlan` removes it from `scan_clauses`, adds `sub_expression` to `fdw_exprs`; remote query uses `WHERE foreign_variable = $1`.
- Any clause removed from the plan qual list MUST go into `fdw_recheck_quals` or be rechecked by `RecheckForeignScan` — needed for correctness at READ COMMITTED (EvalPlanQual after concurrent update). `fdw_recheck_quals` is insufficient when outer joins are pushed down (fields may go NULL rather than tuple rejected).
- `fdw_scan_tlist`: NIL => returned tuples have the foreign table's row type; else a TargetEntry list of Vars/expressions; mandatory for join plans.
- Always build at least one path depending only on restriction clauses. Parameterized paths (join clause `foreign_variable = local_variable`, found in the relation's join lists): set `param_info` via `get_baserel_parampathinfo`; put the local part in `fdw_exprs`.
- Remote joins: `GetForeignJoinPaths`; join clauses arrive in `extra->restrictlist` (baserestrictinfo irrelevant).
- Remote aggregation: add path to `UPPERREL_GROUP_AGG` via `add_path` in `GetForeignUpperPaths`; competes on cost with local aggregation over a plain scan path (which must also exist or plan-time error).
- Fully remote UPDATE/DELETE or remote `SELECT FOR UPDATE`: a path inserted in `UPPERREL_FINAL` competes with the ModifyTable approach and is responsible for ALL query behaviour.
- For UPDATE/DELETE, `PlanForeignModify`/`PlanDirectModify` can reuse `baserel->fdw_private`; for INSERT there is no RelOptInfo for the target.
- Limitation: `INSERT ... ON CONFLICT` on foreign tables cannot specify a conflict target (remote unique/exclusion constraints not locally known) => `ON CONFLICT DO UPDATE` is not supported (target is mandatory there); `DO NOTHING` without target is the only form.

### FDW row locking (ch.58.5)  [M6, M5]  (source: fdw-row-locking.txt)
- Early locking: lock when row first fetched (simple, no extra round trips, may lock rows later discarded -> reduced concurrency / unexpected deadlocks). Late locking: lock only when known needed; requires re-identifying the row uniquely (ideally a specific row version, as TIDs do). Late-locking API added in PostgreSQL 9.5. By default core ignores locking for FDWs.
- READ COMMITTED rechecks (EPQ): for regular tables, non-target rows' TIDs are projected through the join and re-fetched; for foreign tables the default is to project a COPY OF THE ENTIRE ROW (`ROW_MARK_COPY`) through the join — no demands on the FDW but can slow merge/hash joins.
- UPDATE/DELETE target: recommended early locking in the ForeignScan (equivalent of `SELECT FOR UPDATE`). Detect target at plan time via `root->parse->resultRelation`, at run time via `ExecRelationIsTargetRelation()`.
- SELECT FOR UPDATE/SHARE: early locking, or late locking via `GetForeignRowMarkType` returning `ROW_MARK_EXCLUSIVE`, `ROW_MARK_NOKEYEXCLUSIVE`, `ROW_MARK_SHARE`, or `ROW_MARK_KEYSHARE` (core treats all four the same). Detect via `get_plan_rowmark` (plan) / `ExecFindRowMark` (exec); also check `strength != LCS_NONE`.
- Non-locked foreign tables in such queries: return `ROW_MARK_REFERENCE` for `LCS_NONE` to re-fetch rather than copy; `ROW_MARK_COPY` to keep default.
- See `src/include/nodes/lockoptions.h`, `plannodes.h` (`RowMarkType`, `PlanRowMark`), `execnodes.h` (`ExecRowMark`).

### Table sampling methods (ch.59)  [M3, M6]  (source: tablesample-method.txt, tablesample-support-functions.txt)
- SQL standard requires `BERNOULLI` and `SYSTEM`; custom methods are a single SQL function `method_name(internal) RETURNS tsm_handler` (name = name used in `TABLESAMPLE`; the `internal` arg is a dummy, always zero). Returns palloc'd `TsmRoutine` (`src/include/access/tsmapi.h`). Built-ins in `src/backend/access/tablesample`; add-ons in `contrib`.
- Extra `TsmRoutine` fields: `List *parameterTypes` (OID list; built-ins have a single `FLOAT4OID` = sampling percentage); `bool repeatable_across_queries` (false => `REPEATABLE` clause rejected); `bool repeatable_across_scans` (false => planner avoids plans scanning the sampled table more than once).
- Support functions:
  - `void SampleScanGetSampleSize(PlannerInfo *root, RelOptInfo *baserel, List *paramexprs, BlockNumber *pages, double *tuples)` — planning; estimate pages read and tuples selected (e.g. fraction × `baserel->pages` / `baserel->tuples`, rounded). Use `estimate_expression_value()`; must not fail on non-constant or invalid params.
  - `void InitSampleScan(SampleScanState *node, int eflags)` — optional; allocate `node->tsm_state`; `node->ss.ss_currentScanDesc` not yet set; honor `EXEC_FLAG_EXPLAIN_ONLY`.
  - `void BeginSampleScan(SampleScanState *node, Datum *params, int nparams, uint32 seed)` — before first fetch and on rescans; params are non-null; `seed` = hash of the REPEATABLE value or `random()`. May set `node->use_bulkread` (default true: buffer strategy encouraging recycling; set false if only a small fraction of pages visited) and `node->use_pagemode` (default true: visibility-check all tuples of a page in one pass; set false if few tuples per page selected).
  - `BlockNumber NextSampleBlock(SampleScanState *node, BlockNumber nblocks)` — next block or `InvalidBlockNumber`. Optional: NULL => core does a full sequential scan (may be a synchronized scan, so page order is not stable).
  - `OffsetNumber NextSampleTuple(SampleScanState *node, BlockNumber blockno, OffsetNumber maxoffset)` — next offset or `InvalidOffsetNumber`. Not told which offsets 1..maxoffset are valid; core ignores missing/invisible tuples (no bias); `node->donetuples` available. Must not assume `blockno` is the most recent NextSampleBlock result (prefetching).
  - `void EndSampleScan(SampleScanState *node)` — optional.

### Custom scan providers (ch.60)  [M4, M6]  (source: custom-scan.txt, custom-scan-path.txt, custom-scan-plan.txt, custom-scan-execution.txt)
- "Experimental facilities". Unlike an FDW, a custom scan provider can offer an alternative way to scan ANY relation (caching, hardware acceleration). Three steps: paths -> plan -> execution.
- Hook `set_rel_pathlist_hook(PlannerInfo *root, RelOptInfo *rel, Index rti, RangeTblEntry *rte)` — called after core generated all paths for the rel EXCEPT Gather / Gather Merge (so those can use partial paths added by the hook). Add `CustomPath` via `add_path` / `add_partial_path`.
- `struct CustomPath { Path path; uint32 flags; List *custom_paths; List *custom_restrictinfo; List *custom_private; const CustomPathMethods *methods; }`. Flags: `CUSTOMPATH_SUPPORT_BACKWARD_SCAN`, `CUSTOMPATH_SUPPORT_MARK_RESTORE`, `CUSTOMPATH_SUPPORT_PROJECTION` (if unset, node only asked for Vars of the scanned rel). `custom_restrictinfo` = join clauses when replacing a join, else NIL. `custom_private` should be `nodeToString`-able.
- Join hook `set_join_pathlist_hook(root, joinrel, outerrel, innerrel, jointype, JoinPathExtraData *extra)` — invoked repeatedly per joinrel; clauses in `extra->restrictlist`.
- Path callbacks: `Plan *(*PlanCustomPath)(root, rel, CustomPath *best_path, List *tlist, List *clauses, List *custom_plans)`; `List *(*ReparameterizeCustomPathByChild)(root, List *custom_private, RelOptInfo *child_rel)`.
- `struct CustomScan { Scan scan; uint32 flags; List *custom_plans; List *custom_exprs; List *custom_private; List *custom_scan_tlist; Bitmapset *custom_relids; const CustomScanMethods *methods; }`. `custom_exprs` are fixed up by `setrefs.c` and `subselect.c`. `custom_scan_tlist` NIL for base rel (rowtype tuples), mandatory for joins. `custom_relids` set by core. `scan.scanrelid` = RT index, or 0 for a join. Must be `copyObject`-able; cannot embed CustomScan in a larger struct (unlike CustomPath / CustomScanState).
- Plan callback: `Node *(*CreateCustomScanState)(CustomScan *cscan)` — allocate (usually larger) `CustomScanState`, set node tag and methods only.
- `struct CustomScanState { ScanState ss; uint32 flags; const CustomExecMethods *methods; }` (`ss.ss_currentRelation` NULL for joins).
- Exec callbacks: `BeginCustomScan(node, EState *estate, int eflags)`; `TupleTableSlot *ExecCustomScan(node)` (fill `ps_ResultTupleSlot`; NULL/empty slot at end); `EndCustomScan` (required); `ReScanCustomScan`; `MarkPosCustomScan` / `RestrPosCustomScan` (only with MARK_RESTORE flag); parallel: `EstimateDSMCustomScan`, `InitializeDSMCustomScan`, `ReInitializeDSMCustomScan`, `InitializeWorkerCustomScan`, `ShutdownCustomScan`; `ExplainCustomScan(node, List *ancestors, ExplainState *es)` (optional).

### GEQO — Genetic Query Optimizer (ch.61)  [M4]  (source: geqo.txt, geqo-intro.txt, geqo-intro2.txt, geqo-pg-intro.txt, geqo-biblio.txt)
- Author: Martin Utesch, Institute of Automatic Control, University of Mining and Technology, Freiberg, Germany (motivated by a decision-support knowledge-based system for electrical power grid maintenance whose inference engine issued large join queries).
- Problem: join is the hardest operator to optimize; number of possible plans grows exponentially with the number of joins; plus several join methods (nested loop, hash join, merge join) and index types (B-tree, hash, GiST, GIN).
- Standard planner = near-exhaustive search (System R algorithm): near-optimal join order but enormous time and memory when joins are many.
- GA vocabulary: population of individuals; fitness = degree of adaptation; chromosome = coordinates in search space (set of character strings); gene = subsection encoding one parameter (binary or integer). Operators: recombination, mutation, selection -> new generations with higher average fitness. A GA is NOT a pure random search (stochastic process, distinctly non-random result).
- Figure 61.1 (structure of a GA; image not in text render — classic loop: initialize population P(0), evaluate, then repeat: select parents P''(t), recombine, mutate, evaluate, select survivors P(t+1), until stop criterion). NOTE: figure content not present in the page text; describe generically only.
- PostgreSQL encoding: treat join ordering like the traveling salesman problem (TSP). A plan = integer string of relation IDs = join sequence. Example: left-deep tree joining 4 and 1, then 3, then 2 is encoded `'4-1-3-2'`.
- Implementation characteristics:
  1. Steady-state GA: replace the least-fit individuals, not whole-generation replacement -> fast convergence.
  2. Edge recombination crossover (keeps edge losses low for TSP).
  3. Mutation as an operator is deprecated, so no repair mechanisms are needed to produce legal TSP tours.
  - Parts adapted from D. Whitley's Genitor algorithm.
- Plan generation steps:
  1. Standard planner code generates scan plans for each individual relation.
  2. Initial population: random join sequences.
  3. For each sequence, standard planner code estimates cost: at each step all three join strategies (nested loop, merge, hash) are considered with all the pre-computed scan plans; cost = cheapest.
  4. Lower cost = more fit. Discard least fit candidates.
  5. New candidates = random portions of known low-cost sequences recombined.
  6. Repeat until a preset number of join sequences has been considered; best one seen at any time is used for the final plan.
- Determinism: each GEQO run restarts its RNG from `geqo_seed`; with `geqo_seed` and other GEQO parameters fixed (and same stats etc.) the same plan is produced. Change `geqo_seed` to explore other search paths.
- (GUCs referenced here: `geqo_seed`. Pool size and generations are computed in `src/backend/optimizer/geqo/geqo_main.c` by `gimme_pool_size` and `gimme_number_generations`. The other geqo_* GUCs/defaults — geqo, geqo_threshold, geqo_effort, geqo_pool_size, geqo_generations, geqo_selection_bias — are documented in ch.19 runtime-config-query, not in this slice.)
- Known weaknesses / future work: (a) parameter settings trade plan optimality vs computing time; (b) each candidate's fitness is computed by running join selection + costing from scratch — lots of repeated work for shared sub-sequences; caching sub-join costs would help but costs memory; (c) fundamental doubt: in TSP the cost of a partial tour is independent of the rest, which is not true for joins, so edge recombination crossover may not be the most effective procedure.
- Further reading: The Hitch-Hiker's Guide to Evolutionary Computation (comp.ai.genetic FAQ); Evolutionary Computation and its application to art and design (Craig Reynolds); [elma04]; [fong].

### Table Access Method interface (ch.62)  [M2, M6]  (source: tableam.txt)
- Each table AM = a row in `pg_am` (name + handler function); created/dropped with `CREATE ACCESS METHOD` / `DROP ACCESS METHOD`.
- Handler: one `internal` argument (dummy), returns pseudo-type `table_am_handler`.
  ```sql
  CREATE OR REPLACE FUNCTION my_tableam_handler(internal)
    RETURNS table_am_handler AS 'my_extension', 'my_tableam_handler'
    LANGUAGE C STRICT;
  CREATE ACCESS METHOD myam TYPE TABLE HANDLER my_tableam_handler;
  ```
- Returns pointer to `TableAmRoutine` (the AM's "API struct") of SERVER lifetime — typically `static const TableAmRoutine my_tableam_methods = { .type = T_TableAmRoutine, ... };` and `PG_RETURN_POINTER(&my_tableam_methods);`. Header `access/tableam.h` (`src/include/access/tableam.h` documents all callbacks; most have wrapper functions documented from the caller's point of view).
- Implementor typically needs an AM-specific tuple table slot type (`src/include/executor/tuptable.h`).
- Storage is largely unconstrained: may or may not use shared buffers; if it does, the standard page layout (Section 66.6) is sensible.
- Big constraint: to support modifications and/or indexes every tuple needs a TID = (block number, item number). Sub-parts need not mean what they mean for heap, but for bitmap scan support (optional) the block number must provide locality.
- Crash safety: use WAL (Generic WAL Records, or a Custom WAL Resource Manager) or a custom implementation.
- Transactions across AMs in one transaction: need close integration with `src/backend/access/transam/xlog.c`.
- Reference: heap in `src/backend/access/heap/heapam_handler.c`.

### Index AM interface: fundamentals (ch.63 intro, 63.1)  [M4, M2]  (source: indexam.txt, index-api.txt)
- All PostgreSQL indexes are SECONDARY indexes: physically separate from the table file; each is its own relation with a `pg_class` row. Content entirely controlled by the AM. In practice all AMs use standard-size pages via the storage manager + buffer manager; all existing AMs use the standard page layout (Section 66.6) and most use the same index tuple header format — not forced.
- An index = mapping from key values to TIDs (block number + item number) of row VERSIONS. Indexes do not know about MVCC: each tuple is an independent object with its own entry, so an UPDATE always creates all-new index entries even if key values did not change (HOT tuples are the exception; indexes don't deal with those). Dead-tuple index entries are reclaimed by vacuum when the dead tuples themselves are reclaimed.
- Each index AM = `pg_am` row (name + handler). Handler takes one dummy `internal` arg, returns pseudo-type `index_am_handler`, result is a palloc'd `IndexAmRoutine` (the "API struct").
- `IndexAmRoutine` fields, in declaration order (PG 18):
  - `NodeTag type`
  - `uint16 amstrategies` — total number of strategies (operators); 0 if the AM has no fixed set of strategy assignments
  - `uint16 amsupport` — total number of support functions
  - `uint16 amoptsprocnum` — opclass options support function number, or 0
  - `bool amcanorder` — supports ORDER BY indexed column's value
  - `bool amcanorderbyop` — supports ORDER BY result of an operator on indexed column
  - `bool amcanhash` — supports hashing using API consistent with the hash AM (new field)
  - `bool amconsistentequality` — operators within an opfamily have consistent equality semantics (new)
  - `bool amconsistentordering` — operators within an opfamily have consistent ordering semantics (new)
  - `bool amcanbackward` — backward scanning
  - `bool amcanunique` — UNIQUE indexes
  - `bool amcanmulticol` — multi-column indexes
  - `bool amoptionalkey` — (comment reads "does AM require scans to have a constraint on the first index column?") true = scans allowed with NO restriction on the first index column
  - `bool amsearcharray` — handles `ScalarArrayOpExpr` quals
  - `bool amsearchnulls` — handles IS NULL / IS NOT NULL quals
  - `bool amstorage` — index storage type can differ from column type
  - `bool amclusterable` — can be clustered on
  - `bool ampredlocks` — handles predicate locks
  - `bool amcanparallel` — parallel scan
  - `bool amcanbuildparallel` — parallel build
  - `bool amcaninclude` — INCLUDE columns
  - `bool amusemaintenanceworkmem` — uses maintenance_work_mem
  - `bool amsummarizing` — summarizes tuples, with at least all tuples in a block summarized in one summary
  - `uint8 amparallelvacuumoptions` — OR of parallel vacuum flags
  - `Oid amkeytype` — type of data stored in index, or InvalidOid if variable
  - Function pointers: `ambuild`, `ambuildempty`, `aminsert`, `aminsertcleanup` (NULL ok), `ambulkdelete`, `amvacuumcleanup`, `amcanreturn` (NULL ok), `amcostestimate`, `amgettreeheight` (NULL ok), `amoptions`, `amproperty` (NULL ok), `ambuildphasename` (NULL ok), `amvalidate`, `amadjustmembers` (NULL ok), `ambeginscan`, `amrescan`, `amgettuple` (NULL ok), `amgetbitmap` (NULL ok), `amendscan`, `ammarkpos` (NULL ok), `amrestrpos` (NULL ok); parallel scan: `amestimateparallelscan`, `aminitparallelscan`, `amparallelrescan` (all NULL ok); planning: `amtranslatestrategy`, `amtranslatecmptype` (NULL ok).
- AM also needs operator families/classes in `pg_opfamily`, `pg_opclass`, `pg_amop`, `pg_amproc`. An individual index = `pg_class` row (physical) + `pg_index` row (logical: columns + opclasses). AM is always handed precomputed key values (plain columns or expressions).
- Flag implications:
  - `amcanmulticol` + `amoptionalkey`: multi-column AMs must support scans omitting restrictions on any/all columns after the first; they may require a restriction on the first column (`amoptionalkey = false`). With `amcanmulticol = false`, `amoptionalkey` says whether full-index scans with no restriction are supported.
  - An AM with `amoptionalkey = true` MUST index nulls (planner may scan with no keys). Any multi-column AM must index nulls in columns after the first (index on `(a,b)`, query `WHERE a = 4` would be wrong if rows with null b were omitted). OK to omit rows whose FIRST column is null. `amsearchnulls` = supports IS NULL / IS NOT NULL as search conditions.
  - `amcaninclude`: stores extra non-key columns without processing; `amcanmulticol=false` + `amcaninclude=true` is sensible (one key column + included columns). Included columns must be allowed to be null regardless of `amoptionalkey`.
  - `amsummarizing`: AMs that point to block ranges rather than individual tuples (like BRIN) allow the HOT optimization to continue. Does NOT apply to attributes referenced in index predicates — updating such an attribute always disables HOT.

### Index AM functions (ch.63.2)  [M4]  (source: index-functions.txt)
- `IndexBuildResult *ambuild(Relation heapRelation, Relation indexRelation, IndexInfo *indexInfo)` — index physically created but empty; usually calls `table_index_build_scan()`; returns palloc'd stats. `amcanbuildparallel` => system tries to allocate parallel workers.
- `void ambuildempty(Relation indexRelation)` — write an empty index to the init fork (`INIT_FORKNUM`); only for UNLOGGED indexes; copied over the main fork on each server restart.
- `bool aminsert(Relation indexRelation, Datum *values, bool *isnull, ItemPointer heap_tid, Relation heapRelation, IndexUniqueCheck checkUnique, bool indexUnchanged, IndexInfo *indexInfo)`.
  - `indexUnchanged` hint: true = tuple is a duplicate of an existing index tuple — a logically unchanged successor MVCC version (UPDATE that modified no column covered by the index but still needed a new index entry, i.e. non-HOT). AM may use it to trigger bottom-up index deletion. Updating a non-key (INCLUDE) column or a column only in a partial-index predicate does not affect it. Computed cheaply with possible false positives AND false negatives — not authoritative about visibility/versioning.
  - Return value meaningful only for `UNIQUE_CHECK_PARTIAL` (true = known unique; false = maybe non-unique, schedule deferred check). Otherwise constant false recommended.
  - Partial coverage: if the tuple is not to be indexed, just return.
  - Per-statement cache: allocate in `indexInfo->ii_Context`, pointer in `indexInfo->ii_AmCache` (initially NULL).
- `void aminsertcleanup(Relation indexRelation, IndexInfo *indexInfo)` — release non-memory resources kept in `ii_AmCache` (e.g. pinned buffers).
- `IndexBulkDeleteResult *ambulkdelete(IndexVacuumInfo *info, IndexBulkDeleteResult *stats, IndexBulkDeleteCallback callback, void *callback_state)` — scan the whole index, call `callback(TID, callback_state)` -> bool to decide deletion. May be called several times per VACUUM because of limited `maintenance_work_mem`; `stats` is the previous call's result (NULL first time). May return NULL.
- `IndexBulkDeleteResult *amvacuumcleanup(IndexVacuumInfo *info, IndexBulkDeleteResult *stats)` — after zero or more ambulkdelete calls; may reclaim empty pages; stats update `pg_class` and VACUUM VERBOSE output. Also called at end of ANALYZE (`info->analyze_only`; stats NULL; return ignored; should only do post-insert cleanup, and only in an autovacuum worker).
- `bool amcanreturn(Relation indexRelation, int attno)` — index-only scan support per column (attno 1-based); should always be true for included columns. NULL pointer = no index-only scans.
- `void amcostestimate(...)` — see below.
- `int amgettreeheight(Relation rel)` — tree height, given to amcostestimate as `path->indexinfo->tree_height`; can be any integer datum; cache in `RelationData.rd_amcache` if expensive.
- `bytea *amoptions(ArrayType *reloptions, bool validate)` — parse `name=value` reloptions into a bytea copied to relcache `rd_options` (most AMs use `struct StdRdOptions`). `validate` false when loading from pg_catalog (ignore invalid silently). NULL = defaults.
- `bool amproperty(Oid index_oid, int attno, IndexAMProperty prop, const char *propname, bool *res, bool *isnull)` — overrides `pg_indexam_has_property` (oid=0, attno=0), `pg_index_has_property` (attno=0), `pg_index_column_has_property` (attno>0). Unknown name => `AMPROP_UNKNOWN`; compare custom names with `pg_strcasecmp`. Return true if decided. AMs with ordering operators should implement `AMPROP_DISTANCE_ORDERABLE` (core returns NULL otherwise); optionally `AMPROP_RETURNABLE`.
- `char *ambuildphasename(int64 phasenum)` — names for `pg_stat_progress_create_index` phases reported via `pgstat_progress_update_param`.
- `bool amvalidate(Oid opclassoid)` — validate opclass catalog entries; problems via ereport at INFO; return false if invalid.
- `void amadjustmembers(Oid opfamilyoid, Oid opclassoid, List *operators, List *functions)` — called in `CREATE OPERATOR CLASS` and `ALTER OPERATOR FAMILY ADD` (then `opclassoid` = InvalidOid); lists of `OpFamilyMember` (amapi.h). Core defaults: hard dependencies on the opclass (CREATE OPERATOR CLASS), soft on the opfamily (ALTER ... ADD). GIN, GiST, SP-GiST always make operator members soft dependencies on the opfamily; optional support functions typically soft too.
- `IndexScanDesc ambeginscan(Relation indexRelation, int nkeys, int norderbys)` — must create the struct via `RelationGetIndexScan()`; key values not yet supplied.
- `void amrescan(IndexScanDesc scan, ScanKey keys, int nkeys, ScanKey orderbys, int norderbys)` — start/restart (NULL keys = reuse); used for each new outer tuple in a nested loop.
- `bool amgettuple(IndexScanDesc scan, ScanDirection direction)` — true => TID stored in scan struct; must set `scan->xs_recheck` (true = lossy; scan conditions rechecked on the heap tuple; partial index predicate is never rechecked). Index-only: if `scan->xs_want_itup`, return data as `IndexTuple` in `scan->xs_itup` (desc `xs_itupdesc`) or `HeapTuple` in `scan->xs_hitup` (desc `xs_hitupdesc`, for data that may not fit an IndexTuple); valid until next amgettuple/amrescan/amendscan. NULL pointer if no plain scans.
- `int64 amgetbitmap(IndexScanDesc scan, TIDBitmap *tbm)` — OR all matching TIDs into the bitmap, return count (may be approximate, e.g. duplicates not detected). Can flag per-TID recheck; currently conflated with lossy bitmap storage so callers recheck both scan conditions and partial index predicate. Cannot be mixed with amgettuple in one scan. NULL pointer if no bitmap scans.
- `void amendscan(IndexScanDesc scan)` — release locks/pins/memory; do not free the scan struct.
- `void ammarkpos(scan)` / `void amrestrpos(scan)` — one remembered position per scan; only needed for ordered scans.
- Parallel scans: each participant returns a subset whose union equals the serial result; per-backend ordering must match the requested ordering (no global order). `Size amestimateparallelscan(Relation indexRelation, int nkeys, int norderbys)` (bytes of DSM in addition to `ParallelIndexScanDescData`), `void aminitparallelscan(void *target)`, `void amparallelrescan(IndexScanDesc scan)`.
- `CompareType amtranslatestrategy(StrategyNumber strategy, Oid opfamily, Oid opcintype)` / `StrategyNumber amtranslatecmptype(CompareType cmptype, Oid opfamily, Oid opcintype)` — convert between fixed `CompareType` values and AM strategy numbers, letting AMs that behave like btree or hash be used in place of them in planner/executor decisions. If absent the AM is ignored for those decisions but is otherwise functional.

### Index scanning semantics (ch.63.3)  [M4]  (source: index-scanning.txt)
- AM returns TIDs of all tuples matching the scan keys; it does NOT fetch heap tuples or test visibility.
- Scan key = `index_key operator constant` (operator from the column's opfamily). Zero or more keys, implicitly ANDed.
- Lossy / recheck: AM may return a superset; core re-applies index conditions on the heap tuple. Without recheck it must return exactly the matching set.
- Core does no semantic analysis for redundant/contradictory keys: `WHERE x > 4 AND x > 14` — btree's `amrescan` must notice the first is redundant (key preprocessing to "normalized" form).
- Ordering support, two kinds: `amcanorder` (natural ordering like btree; must use btree-compatible strategy numbers for equality and ordering operators); `amcanorderbyop` (`ORDER BY index_key operator constant`, passed to amrescan as orderbys).
- Direction: `ForwardScanDirection` / `BackwardScanDirection`. If the first call after amrescan is backward, return the LAST match first (only for `amcanorder`). Afterwards must be able to move either way from the last returned entry (unless `amcanbackward` false: all calls same direction).
- Ordered-scan AMs must support mark/restore (one position; may be restored multiple times).
- Concurrency contract: scan and mark positions stay consistent under concurrent inserts/deletes. A freshly inserted entry may or may not be returned (also on rescan/backup); a concurrent delete may or may not be reflected. But inserts/deletes must never cause the scan to miss or multiply return entries that were not themselves being inserted or deleted.
- Index-only scans: possible if the index stores original values; avoids heap I/O only when the visibility map says the page is all-visible; otherwise the heap is visited for MVCC anyway.
- `amgetbitmap` restrictions: all tuples at once; no mark/restore; unordered (no direction arg, no ordering operators); no index-only scans; no locking guarantee on returned tuples. More efficient because it avoids lock/unlock cycles inside the AM. An AM may implement only amgetbitmap or only amgettuple.

### Index locking considerations (ch.63.4)  [M5, M4]  (source: index-locking.txt)
- Core takes `AccessShareLock` on the index during an index scan and `RowExclusiveLock` when updating the index (including plain VACUUM). These do not conflict => AM does its own fine-grained locking. `ACCESS EXCLUSIVE` on the index only during index creation, destruction, or REINDEX (`SHARE UPDATE EXCLUSIVE` with CONCURRENTLY).
- Design docs: `src/backend/access/nbtree/README`, `src/backend/access/hash/README`.
- Heap/index consistency rules:
  1. A new heap entry is made BEFORE its index entries (a concurrent index scan probably misses it; fine because it is uncommitted — but see uniqueness checks).
  2. When a heap entry is to be deleted by VACUUM, all its index entries must be removed FIRST.
  3. An index scan must keep a PIN on the index page holding the item last returned by `amgettuple`, and `ambulkdelete` cannot delete entries from pages pinned by other backends.
- Why rule 3: reader sees an index entry just before VACUUM removes it, then reaches the heap after VACUUM removed the heap entry. Harmless if the slot is unused (`heap_fetch()` ignores an empty slot), but a third backend may have re-used the slot. With an MVCC snapshot the new occupant is too new to pass the snapshot test; with a non-MVCC snapshot (e.g. `SnapshotAny`) a non-matching row could be returned. Rechecking keys on every heap row is too expensive; the index page pin is a proxy for "reader still in flight"; ambulkdelete blocking on the pin stops VACUUM deleting the heap entry too early.
- Consequence: such scans are "synchronous" (fetch each heap tuple right after its index entry). "Asynchronous" scans (collect many TIDs, visit heap later) need less index locking and give better heap access patterns but are only safe with MVCC snapshots. `amgetbitmap` keeps no index pin => only safe with MVCC-compliant snapshots.
- `ampredlocks` not set: any scan with that AM in a SERIALIZABLE transaction takes a nonblocking predicate lock on the FULL index -> rw-conflict with any insert into that index by a concurrent serializable transaction (more serialization failures). Set = AM implements finer-grained predicate locking.

### Index uniqueness checks (ch.63.5)  [M5, M4]  (source: index-unique-checks.txt)
- Unique constraints are enforced by unique indexes; `amcanunique` (only b-tree at present). INCLUDE columns are not considered.
- Because of MVCC duplicate entries must be physically allowed (successive versions of one logical row). Real rule: no MVCC snapshot may include two rows with equal keys. Cases on insert into a unique index:
  1. Conflicting valid row was deleted by the CURRENT transaction -> OK (allows UPDATE without changing the key, since UPDATE deletes the old version before inserting the new).
  2. Conflicting row inserted by an as-yet-uncommitted transaction -> wait for it; rollback = no conflict; commit without deleting it again = violation (in practice: wait for the other transaction to end, then redo the visibility check in toto).
  3. Conflicting valid row deleted by an uncommitted transaction -> wait for commit/abort, repeat the test.
- Immediately before reporting a violation, recheck liveness of the row being inserted; if committed dead, no violation (can happen during `CREATE UNIQUE INDEX CONCURRENTLY`).
- The AM itself must do these tests, reaching into the heap for commit status ("ugly and non-modular" but avoids a second index probe and race conditions).
- Deferrable constraints — `aminsert`'s `checkUnique` values:
  - `UNIQUE_CHECK_NO` — not a unique index.
  - `UNIQUE_CHECK_YES` — non-deferrable; check immediately.
  - `UNIQUE_CHECK_PARTIAL` — deferrable; must allow duplicates into the index and return false for potential duplicates (false positives allowed; no waiting on other transactions); a deferred recheck is scheduled per false.
  - `UNIQUE_CHECK_EXISTING` — deferred recheck; must NOT insert a new entry; check for another live entry and that the target row is still live -> error. Recommended: verify the target row really has an existing entry (guards against non-immutable index functions). "Live" here = any tuple in the index entry's HOT chain is live.

### Index cost estimation (ch.63.6)  [M4]  (source: index-cost-estimation.txt)
- Signature: `void amcostestimate(PlannerInfo *root, IndexPath *path, double loop_count, Cost *indexStartupCost, Cost *indexTotalCost, Selectivity *indexSelectivity, double *indexCorrelation, double *indexPages)`. Must be C.
- Inputs: `root`; `path` (all fields valid except cost/selectivity); `loop_count` (repetitions, >1 for parameterized scan on the inside of a nestloop; estimates still for ONE scan, i.e. averages, but may allow for caching effects).
- Outputs: `*indexStartupCost` (cost before first row; zero for most indexes), `*indexTotalCost`, `*indexSelectivity` (fraction of parent-table rows retrieved; for lossy queries typically higher than the fraction passing the quals), `*indexCorrelation` (-1.0..1.0 between index order and table order; adjusts heap fetch cost), `*indexPages` (number of leaf pages; used to estimate number of workers for parallel index scan).
- Cost units as in `src/backend/optimizer/path/costsize.c`: sequential block fetch = `seq_page_cost`, nonsequential = `random_page_cost`, per index row = `cpu_index_tuple_cost`, plus multiples of `cpu_operator_cost` for comparison operators. Include all disk + CPU cost of scanning the index itself, NOT the cost of fetching/processing heap rows.
- Typical estimator steps:
  1. `*indexSelectivity = clauselist_selectivity(root, path->indexquals, path->indexinfo->rel->relid, JOIN_INNER, NULL);`
  2. Estimate index rows visited (often indexSelectivity × index rows; index size in pages/rows from `path->indexinfo`).
  3. Estimate index pages retrieved (maybe indexSelectivity × index pages).
  4. Generic cost: `cost_qual_eval(&index_qual_cost, path->indexquals, root); *indexStartupCost = index_qual_cost.startup; *indexTotalCost = seq_page_cost * numIndexPages + (cpu_index_tuple_cost + index_qual_cost.per_tuple) * numIndexTuples;` (assumes index pages read sequentially; does not amortize across repeated scans).
  5. Estimate correlation: from `pg_statistic` for a simple ordered single-field index; conservative default zero.
- Examples: `src/backend/utils/adt/selfuncs.c`.

### B-Tree: introduction and operator class behaviour (ch.65.1.1-65.1.2)  [M4]  (source: indextypes.txt, btree.txt)
- Standard btree (multi-way balanced tree). Any type with a well-defined linear order is indexable. Only limitation: an index entry cannot exceed approximately ONE-THIRD OF A PAGE (after TOAST compression if applicable).
- Btree opclasses/opfamilies are PostgreSQL's general representation of SORTING semantics, used far from the btree AM itself.
- An opclass provides five comparison operators: `<`, `<=`, `=`, `>=`, `>` (strategies 1-5 per Table 36.3). `<>` is NOT a member (a `<>` WHERE clause is almost never useful for an index search); the planner finds `<>` through `=`'s negator link, not `pg_amop`.
- Operator families group opclasses of types with near-identical sort semantics so the planner can reason about cross-type comparisons. Each opclass holds single-type operators + support functions; cross-type operators/functions are "loose" in the family. Recommended: complete set of cross-type operators (so transitivity deductions are representable).
- Required laws (all non-null A, B, C; across all types in a family):
  - `=` is an equivalence relation: reflexive (A = A), symmetric (A = B => B = A), transitive.
  - `<` is a strong ordering: irreflexive (A < A false), transitive.
  - Total order — trichotomy: exactly one of A < B, A = B, B < A is true.
  - Other three operators defined consistently from `=` and `<`.
- Counter-example: `float8` and `numeric` cannot share a family — numeric is converted to float8 for comparison, so distinct numerics compare equal to the same float8, breaking transitivity.
- Implicit or binary-coercion casts between family member types must not change sort ordering.
- Single-type laws are needed by the index itself; two-type sanity is needed for cross-type index searches; three-or-more-type laws are relied on by the PLANNER for optimization.

### B-Tree support functions (ch.65.1.3)  [M4]  (source: btree.txt)
One required + five optional (Table 36.9); registered in `pg_amproc`:
1. `order` (support number 1, REQUIRED): for each type combination with comparison operators; `amproclefttype`/`amprocrighttype` = left/right types. Takes two non-null values, returns `int32` `< 0`, `0`, `> 0` for A < B, A = B, A > B. Null result disallowed. Collation via `PG_GET_COLLATION()`. Examples in `src/backend/access/nbtree/nbtcompare.c`.
2. `sortsupport` (2, optional): faster comparisons for sorting; API in `src/include/utils/sortsupport.h`.
3. `in_range` (3, optional): NOT used by index operations; enables window frames `RANGE offset PRECEDING` / `RANGE offset FOLLOWING`. Signature `in_range(val type1, base type1, offset type2, sub bool, less bool) returns bool`; `amproclefttype` = type1, `amprocrighttype` = type2 (offset may be a type otherwise unsupported by the family; e.g. `time_ops` has an in_range with `interval` offset).
   - `!sub && !less`: `val >= (base + offset)`; `!sub && less`: `val <= (base + offset)`; `sub && !less`: `val >= (base - offset)`; `sub && less`: `val <= (base - offset)`.
   - Must first check offset sign: negative => `ERRCODE_INVALID_PRECEDING_OR_FOLLOWING_SIZE` (22013), "invalid preceding or following size in window function" (SQL standard requirement).
   - Should avoid errors on overflow of base ± offset (result is still determinable); care with infinity/NaN.
   - Monotonicity (fixed offset and sub; `less = true`): true for val1 => true for every val2 <= val1; false for val1 => false for every val2 >= val1; true for base1 => true for every base2 >= base1; false for base1 => false for every base2 <= base1. Inverted for `less = false`.
   - Need not handle NULLs (typically strict). Collation passed if type1 collatable.
4. `equalimage` (4, optional): "equality implies image equality"; tells core when DEDUPLICATION is safe. Signature `equalimage(opcintype oid) returns bool`. Currently called only when building/rebuilding an index. True = `order` returns 0 only when A and B are interchangeable without loss of semantic information. Not registering or returning false = cannot assume. Index is dedup-safe only if EVERY indexed column's opclass registers one and each returns true. Image equality ≈ bitwise equality, except varlena datums may differ bitwise due to inconsistent TOAST compression; formally `datum_image_eq()` always agrees with `order`. Cross-type equalimage registration is an error. Stock functions: `btequalimage()` (safe unconditionally; most opclasses) and `btvarstrequalimage()` (collatable types like text: safe with deterministic collations). Extensions should register their own.
5. `options` (5, optional): `options(relopts local_relopts *) returns void`; fills a `local_relopts` struct; accessed via `PG_HAS_OPCLASS_OPTIONS()` / `PG_GET_OPCLASS_OPTIONS()`. Currently NO B-tree opclass has one (added for uniformity).
6. `skipsupport` (6, optional; PG 18 skip scan): lets B-tree code iterate through every possible value of the opclass input type in key-space order, used by the SKIP SCAN optimization. API in `src/include/utils/skipsupport.h`. Opclasses without it can still use skip scan via a fallback strategy (possibly suboptimal for some discrete types). Usually not sensible/feasible for continuous types. Cross-type skipsupport registration is an error (next value is produced by incrementing a value copied from an index tuple; must be the skipped column's opclass input type).

### B-Tree implementation: structure, page splits (ch.65.1.4.1)  [M4, M2]  (source: btree.txt)
- Detailed internals in `src/backend/access/nbtree/README`. (NOTE: this docs page does not name "Lehman & Yao" explicitly; it documents the sibling-linked structure below. The README is the cited source for the L&Y design.)
- Multi-level tree; EACH LEVEL is usable as a DOUBLY-LINKED LIST of pages.
- A single METAPAGE at a fixed position at the start of the first segment file of the index.
- All other pages are leaf pages (lowest level; tuples point to table rows) or internal pages (tuples point to the next level down). Typically OVER 99% of all pages are leaf pages. Both use the standard page format (Section 66.6).
- Page split: when a leaf cannot fit an incoming tuple, a portion of its items moves to a new page; a new DOWNLINK to the new page must be inserted in the parent, which may itself split — splits "cascade upwards" recursively. When the root cannot fit a new downlink, a ROOT PAGE SPLIT creates a new root one level above the original root (tree grows at the top).

### B-Tree bottom-up index deletion and simple deletion (ch.65.1.4.2)  [M4, M5, M7]  (source: btree.txt)
- "Version churn": index tuples for successive versions of the same logical row. Arises in UPDATE-heavy workloads where HOT cannot apply. Changing just one column covered by ONE index forces a new index tuple in EVERY index on the table (including indexes not "logically modified"). New and old tuples coexist for a while (typically until shortly after the UPDATE commits).
- Bottom-up index deletion pass: triggered in reaction to an anticipated "version churn page split"; happens only in indexes NOT logically modified by the UPDATEs; targets suspected garbage tuples in a SINGLE LEAF PAGE using qualitative distinctions about logical rows and versions. Usually avoids the split; heuristics may fail to delete even one tuple, in which case a deduplication pass or page split resolves it.
- Contrast: "top-down" cleanup by autovacuum, triggered by quantitative table-level thresholds (Section 24.1.6).
- Simple index tuple deletion (the only kind before PostgreSQL 14): deferred, deletes tuples whose line pointer `LP_DEAD` bit is already set; also runs when a page split is anticipated. Opportunistic — depends on passing index scans having set LP_DEAD bits. Bottom-up deletion (PG 14+) specifically targets version churn from UPDATEs that do not logically modify indexed columns.
- With suitable workloads bottom-up deletion does the vast majority of garbage cleanup; an index may never grow by even one page despite constant churn. VACUUM "clean sweep" is still eventually required.
- No guarantee on age of oldest garbage tuple, unlike VACUUM. Table-level invariant: no index may retain "floating garbage" tuples that became dead before a conservative cutoff shared by the table and all its indexes — this is what makes recycling table TIDs safe (two logical rows whose lifetimes span the same VACUUM cycle can never share a TID).
- Order of attempts when a new tuple does not fit on a leaf (as documented): (1) index tuple deletion (simple deletion of LP_DEAD items / bottom-up deletion when hinted) -> (2) deduplication pass -> (3) page split.

### B-Tree deduplication (ch.65.1.4.3)  [M4, M2]  (source: btree.txt)
- Duplicate = leaf tuple whose indexed key columns all match those of at least one other leaf tuple in the same index.
- Deduplication periodically merges groups of duplicates into a single POSTING LIST TUPLE: key value(s) stored once + a SORTED ARRAY OF TIDs. Benefits: smaller index, lower query latency, higher throughput, cheaper index vacuuming.
- Works equally for "duplicates" containing NULL (NULL is just another value at the on-disk level even though NULL = NULL is not true).
- LAZY: runs when a new item cannot fit on a leaf page and only if index tuple deletion could not free enough space. Unlike GIN posting lists, B-tree posting list tuples need not expand on every duplicate insert — they are just an alternative physical representation of the page's logical contents (consistent performance for mixed read-write).
- ENABLED BY DEFAULT. Storage parameter `deduplicate_items` (set `off` per index to disable). Small fixed penalty for write-heavy workloads with few/no duplicates; never a penalty for read-only workloads. Disabling is not usually helpful.
- `CREATE INDEX` / `REINDEX`: merge each group of duplicates from the sorted input into posting list tuples before adding to the pending leaf page; posting lists packed with as many TIDs as possible; no separate dedup pass.
- Unique indexes/constraints can sometimes use deduplication: leaf pages temporarily "absorb" version-churn duplicates, augmenting bottom-up deletion — especially when a long-running transaction holds a snapshot blocking garbage collection; buys time until deletion can succeed. A special heuristic decides whether to run a dedup pass in a unique index (often skips straight to a page split).
- Safety determined at `CREATE INDEX` / `REINDEX` time. Deduplication is UNSAFE / unavailable for:
  - `text` and `varchar` with a NONDETERMINISTIC collation (case/accent differences must be preserved among equal datums).
  - `character` (aliases `char`, `bpchar`) — trailing spaces disregarded in comparison but must be preserved.
  - `numeric` — display scale must be preserved.
  - `jsonb` — its btree opclass uses numeric internally.
  - `float4` and `float8` — distinct representations of -0 and 0 that compare equal.
  - Container types (composite types, arrays, range types) — implementation restriction that may be lifted in future.
  - `INCLUDE` indexes — never, regardless of opclass or collation.

### GiST: introduction, extensibility model (ch.65.2.1, 65.2.3)  [M4, M6]  (source: gist.txt)
- GiST = Generalized Search Tree: balanced, tree-structured AM acting as a base template for arbitrary indexing schemes (B-trees, R-trees, many others). Lets a domain expert (not a database expert) build an index for a custom type. Derived from the UC Berkeley GiST Indexing Project and Marcel Kornacker's thesis "Access Methods for Next-Generation Database Systems"; maintained primarily by Teodor Sigaev and Oleg Bartunov.
- The GiST layer handles concurrency, WAL logging and tree searching; the opclass implements only the data-type semantics.
- Contrast: B-trees support only range predicates (`<`, `=`, `>`), hash only equality; GiST lets you define domain-specific questions ("find all images of horses").
- Opclass methods: FIVE REQUIRED + SEVEN OPTIONAL (12 total). Correctness depends on `same`, `consistent`, `union`; efficiency (size and speed) depends on `penalty` and `picksplit`.
  - Leaves are of the indexed type; internal nodes can be any C struct (follow varlena rules). If the internal type exists at SQL level use `STORAGE` in `CREATE OPERATOR CLASS`.
- Methods (ordinal / support-function number as documented):
  1. `consistent` (required) — SQL: `my_consistent(internal, data_type, smallint, oid, internal) RETURNS bool`. Args: `GISTENTRY *entry`, query value, `StrategyNumber strategy`, `Oid subtype`, `bool *recheck`. Question: could `indexed_column indexable_operator q` be true for ANY row represented by entry `p`? Leaf entry = test the condition; internal node = must the subtree be scanned? Must set `*recheck` (false = exact; true = candidate only, system re-evaluates the operator on the actual row) — supports lossless and lossy structures. `GIST_LEAF(entry)` tells leaf vs internal. Query type = right-hand type of the operator (may differ from indexed type); declare with the opclass's indexed type anyway.
  2. `union` (required) — `my_union(internal, internal) RETURNS storage_type`. First arg `GistEntryVector *` (`entryvec->n`, `entryvec->vector`); second arg (int pointer) can be ignored (historically result size). Builds one entry representing all given entries; must return newly palloc'd storage-type value (never the input as-is).
  3. `compress` (optional) — `my_compress(internal) RETURNS internal`; converts a data item to storage format (`entry->leafkey` true => compress; use `gistentryinit(*retval, datum, entry->rel, entry->page, entry->offset, FALSE)`). Omitted => stored unmodified.
  4. `decompress` (optional) — `my_decompress(internal) RETURNS internal`; stored form -> form usable by the other methods. Not necessarily the inverse of compress (lossy compress) nor equal to fetch. Omit if not needed.
  5. `penalty` (required) — `my_penalty(internal, internal, internal) RETURNS internal`; args `GISTENTRY *origentry`, `GISTENTRY *newentry`, `float *penalty` (result stored through third arg, historical). "Cost" of inserting the new entry under a branch; insertion follows the path of LEAST penalty. Must be non-negative (negative treated as zero). Crucial for index quality.
  6. `picksplit` (required) — `my_picksplit(internal, internal) RETURNS internal`; args `GistEntryVector *entryvec`, `GIST_SPLITVEC *v`. Decides which entries stay on the old page and which move to the new one; fills `v->spl_left`, `v->spl_nleft`, `v->spl_right`, `v->spl_nright`, `v->spl_ldatum`, `v->spl_rdatum` (unions of each side). Entries indexed from `FirstOffsetNumber` to `entryvec->n - 1`.
  7. `same` (required) — `my_same(storage_type, storage_type, internal) RETURNS internal`; stores bool through third arg; true if two index entries (storage type) are identical.
  8. `distance` (optional; required if the opclass has ORDERING operators) — `my_distance(internal, data_type, smallint, oid, internal) RETURNS float8`; same args as consistent. Leaf: distance to the entry; internal: must be the smallest distance any child could have (never greater than actual — lower bound; bounding-box distance is fine). If inexact for a leaf set `*recheck = true`: executor recomputes exact distance after heap fetch and reorders; then the ordering operator must return `float8` or `float4` and results must be comparable to it. Otherwise any finite float8 preserving relative order. Do not return ±infinity (used internally for nulls etc.).
  9. `fetch` (optional; needed for index-only scans unless `compress` is omitted) — `my_fetch(internal) RETURNS internal`; `GISTENTRY` with compressed leaf datum -> `GISTENTRY` with the original datum; must be exact. If compress is lossy for leaves: no index-only scans, must not define fetch.
  10. `options` (optional) — `my_options(internal) RETURNS void`; fills `local_relopts` using `init_local_reloptions(relopts, sizeof(MyOptionsStruct))`, `add_local_int_reloption`, `add_local_real_reloption`, `add_local_enum_reloption`, `add_local_string_reloption`; read with `PG_HAS_OPCLASS_OPTIONS()` / `PG_GET_OPCLASS_OPTIONS()` / `GET_STRING_RELOPTION`. Indexes created before the options method was added have no options (must check). Example: `gtsvector_options()` (signature length).
  11. `sortsupport` (optional) — `my_sortsupport(internal) RETURNS void`; fills `SortSupport->comparator` (compares two Datums in the format returned by `compress`), ordering that preserves locality (e.g. spatial code / Z-order). Used by CREATE INDEX and REINDEX for the SORTED build. Without it the index is built by inserting each tuple using penalty/picksplit — much slower.
  12. `translate_cmptype` (optional; the method overview paragraph calls it `stratnum`) — `my_translate_cmptype(integer) RETURNS smallint`, registered as `ALTER OPERATOR FAMILY my_opfamily USING gist ADD FUNCTION 12 ("any", "any") my_translate_cmptype(int);`. Maps a `CompareType` (`src/include/access/cmptype.h`) to the opclass's strategy number, or `InvalidStrategy`. Used for TEMPORAL index constraints (PRIMARY KEY / UNIQUE ... WITHOUT OVERLAPS): if it returns a result for `COMPARE_EQ` the opclass can be used in the non-`WITHOUT OVERLAPS` parts. GiST's `amtranslatecmptype` just calls this (GiST has no fixed strategy numbers). Provided: `gist_translate_cmptype_common` (opclasses using `RT*StrategyNumber`); btree_gist defines `gist_translate_cmptype_btree` (`BT*StrategyNumber`).
- Memory: support methods run in short-lived contexts (reset after each tuple). To cache across calls allocate in `fcinfo->flinfo->fn_mcxt` and keep pointer in `fcinfo->flinfo->fn_extra` (lives for the index operation); pfree the old value when replacing.

### GiST built-in operator classes (Table 65.1)  [M4]  (source: gist.txt)
| Opclass | Indexable operators | Ordering operators |
|---|---|---|
| `box_ops` | `<<` `&<` `&&` `&>` `>>` `~=` `@>` `<@` `&<|` `<<|` `|>>` `|&>` (box, box) | `<->` (box, point) |
| `circle_ops` | `<<` `&<` `&>` `>>` `<@` `@>` `~=` `&&` `|>>` `<<|` `&<|` `|&>` (circle, circle) | `<->` (circle, point) |
| `inet_ops` | `<<` `<<=` `>>` `>>=` `=` `<>` `<` `<=` `>` `>=` `&&` (inet, inet) | — |
| `multirange_ops` | `=` (anymultirange, anymultirange); `&&` (mr,mr),(mr,anyrange); `@>` (mr,anyelement),(mr,mr),(mr,anyrange); `<@` (mr,mr),(mr,anyrange); `<<`, `>>`, `&<`, `&>`, `-|-` each for (mr,mr) and (mr,anyrange) | — |
| `point_ops` | `|>>` `<<` `>>` `<<|` `~=` (point, point); `<@` (point, box), (point, polygon), (point, circle) | `<->` (point, point) |
| `poly_ops` | `<<` `&<` `&>` `>>` `<@` `@>` `~=` `&&` `<<|` `&<|` `|&>` `|>>` (polygon, polygon) | `<->` (polygon, point) |
| `range_ops` | `=` (anyrange, anyrange); `&&` (r,r),(r,anymultirange); `@>` (r,anyelement),(r,r),(r,anymultirange); `<@` (r,r),(r,mr); `<<`, `>>`, `&<`, `&>`, `-|-` each for (r,r) and (r,mr) | — |
| `tsquery_ops` | `<@` `@>` (tsquery, tsquery) | — |
| `tsvector_ops` | `@@` (tsvector, tsquery) | — |
- `inet_ops` is NOT the default GiST opclass for `inet`/`cidr` (historical): `CREATE INDEX ON my_table USING GIST (my_inet_column inet_ops);`

### GiST implementation: build methods; examples (ch.65.2.4-65.2.5)  [M4]  (source: gist.txt)
- Three build strategies: (1) simple — insert entries one by one (slow for large indexes: random I/O once the index exceeds cache); (2) SORTED — only if EVERY opclass used by the index provides `sortsupport`; usually best, used BY DEFAULT when available; (3) BUFFERED — defers insertion, dramatically reduces random I/O for non-ordered data; less/no benefit for well-ordered data.
- Buffered costs: calls `penalty` more often (CPU); needs temp disk space up to the size of the resulting index; may change index quality in either direction.
- If sorting is not possible, the build switches to buffering by default when the index size reaches `effective_cache_size`. Force/prevent with the `buffering` storage parameter of `CREATE INDEX` (on/off/auto per CREATE INDEX docs); turning it off may speed up builds on ordered input.
- Core GiST usage: text search (`tsvector`, `tsquery`) and R-Tree-equivalent functionality for geometric types (`src/backend/access/gist/gistproc.c`).
- Contrib modules with GiST opclasses: `btree_gist` (B-tree equivalent functionality for several data types), `cube` (multidimensional cubes), `hstore` ((key, value) pairs), `intarray` (RD-Tree for one-dimensional int4 arrays), `ltree` (tree-like structures), `pg_trgm` (text similarity using trigram matching), `seg` ("float ranges").

### SP-GiST: concepts (ch.65.3.1, 65.3.3 intro)  [M4]  (source: spgist.txt)
- SP-GiST = space-partitioned GiST. Supports partitioned search trees = NON-BALANCED structures: quad-trees, k-d trees, radix trees (tries). They repeatedly divide the search space into partitions that need not be equal in size; searches matching the partitioning rule are very fast.
- Challenge: these were designed for memory (pointer-linked nodes, low fanout, long chains); disk structures need high fanout. SP-GiST maps tree nodes to disk pages so a search touches only a few pages even when traversing many nodes. From Purdue University's SP-GiST Indexing Project; maintained by Teodor Sigaev and Oleg Bartunov.
- Core handles disk mapping, tree search, concurrency, WAL logging; opclass supplies data-type methods.
- LEAF TUPLES: usually values of the indexed type (may be lossy). Leaf tuples at the root level hold the full original value; lower-level leaf tuples may hold only a partial value (e.g. a suffix) — opclass must reconstruct the original from inner tuples traversed. INCLUDE column values are stored in leaf tuples (invisible to the opclass).
- INNER TUPLES: branching points; contain a set of one or more NODES (groups of similar leaf values). Each node has a DOWNLINK to either a lower-level inner tuple or a short list of leaf tuples that all lie on the SAME index page. A node normally has a LABEL (radix tree: next character); labels can be omitted with a fixed node set. Optional PREFIX describing all members (radix tree: common prefix; quad-tree: the central point the four quadrants are measured against — then 4 nodes).
- Core supports level (depth) counting during descent, incremental value reconstruction, and out-of-band "traverse values".
- NULLs: SP-GiST stores entries for nulls but hides them from the opclass; no null entries or null search conditions reach opclass methods (operators assumed strict).
- Methods: FIVE mandatory (`config`, `choose`, `picksplit`, `inner_consistent`, `leaf_consistent`) + TWO optional (`compress`, `options`). Mandatory ones take `(internal, internal)` = input struct pointer, output struct pointer (output zero-initialized; inputs must not be modified); four return void, `leaf_consistent` returns bool.
- Memory: short-lived context reset after each tuple (except `config`, which should avoid leaking). Index collation passed via `PG_GET_COLLATION()`.

### SP-GiST support methods and structs (ch.65.3.3)  [M4]  (source: spgist.txt)
- `config(internal, internal) RETURNS void`:
  - `spgConfigIn { Oid attType; }` (type being indexed; for polymorphic opclasses).
  - `spgConfigOut { Oid prefixType; Oid labelType; Oid leafType; bool canReturnData; bool longValuesOK; }`. `prefixType`/`labelType` = `VOIDOID` if unused. `canReturnData` = can reconstruct the original value (index-only scans). `longValuesOK` only if attType is variable-length and the opclass can segment long values by repeated suffixing. `leafType` should match `opckeytype` (zero = same as input type; leaving leafType zero is allowed; a different value is deprecated). If `attType != leafType`, `compress` is mandatory.
- `choose(internal, internal) RETURNS void` — how to insert a new value into an inner tuple:
  - `spgChooseIn { Datum datum; Datum leafDatum; int level; bool allTheSame; bool hasPrefix; Datum prefixDatum; int nNodes; Datum *nodeLabels; }` (`level` counts from zero at root; `leafDatum` = compress(datum) or datum, may change at lower levels).
  - `enum spgChooseResultType { spgMatchNode = 1, spgAddNode, spgSplitTuple }`.
  - `spgChooseOut { resultType; union { matchNode { int nodeN; int levelAdd; Datum restDatum; }; addNode { Datum nodeLabel; int nodeN; }; splitTuple { bool prefixHasPrefix; Datum prefixPrefixDatum; int prefixNNodes; Datum *prefixNodeLabels; int childNodeN; bool postfixHasPrefix; Datum postfixPrefixDatum; }; } result; }`.
  - `spgMatchNode`: descend into node `nodeN` (0-based); `levelAdd` = level increment; `restDatum` = leafDatum for the next level.
  - `spgAddNode`: add node with `nodeLabel` at position `nodeN`; choose is called again and should then return spgMatchNode.
  - `spgSplitTuple`: new value inconsistent with the prefix. Moves ALL existing nodes into a new lower-level inner tuple and replaces the existing tuple with one having a single downlink to it. New upper tuple (prefix, `prefixNNodes` nodes, labels) must be NO LARGER than the tuple it replaces. upper prefix + downlink node label + postfix prefix must mean the same as the original prefix. choose called again (may return spgAddNode, eventually spgMatchNode).
- `picksplit(internal, internal) RETURNS void` — build a new inner tuple over a set of leaf tuples:
  - `spgPickSplitIn { int nTuples; Datum *datums; int level; }`.
  - `spgPickSplitOut { bool hasPrefix; Datum prefixDatum; int nNodes; Datum *nodeLabels; int *mapTuplesToNodes; Datum *leafTupleDatums; }` (arrays palloc'd by picksplit).
  - If all leaf tuples land in one node, core overrides: creates an inner tuple with several identically-labelled nodes, leaf tuples assigned at RANDOM, marked `allTheSame`.
  - Applied to a single leaf tuple only when `longValuesOK` and the value is larger than a page: strips a prefix to make a shorter leaf datum; repeated until it fits.
- `inner_consistent(internal, internal) RETURNS void` — which nodes (branches) to follow:
  - `spgInnerConsistentIn { ScanKey scankeys; ScanKey orderbys; int nkeys; int norderbys; Datum reconstructedValue; void *traversalValue; MemoryContext traversalMemoryContext; int level; bool returnData; bool allTheSame; bool hasPrefix; Datum prefixDatum; int nNodes; Datum *nodeLabels; }`.
  - `spgInnerConsistentOut { int nNodes; int *nodeNumbers; int *levelAdds; Datum *reconstructedValues; void **traversalValues; double **distances; }`.
  - scankeys ANDed (`nkeys = 0` => everything matches); use `sk_strategy` and `sk_argument`; NULL comparison values already filtered by core. `reconstructedValue` is `(Datum) 0` at root. Ordered search: `distances` per node (lowest processed first). Traverse values must be single palloc'd chunks allocated in `traversalMemoryContext`.
- `leaf_consistent(internal, internal) RETURNS bool`:
  - `spgLeafConsistentIn { ScanKey scankeys; ScanKey orderbys; int nkeys; int norderbys; Datum reconstructedValue; void *traversalValue; int level; bool returnData; Datum leafDatum; }`.
  - `spgLeafConsistentOut { Datum leafValue; bool recheck; bool recheckDistances; double *distances; }`. Return true if the leaf matches; set `leafValue` (attType) when `returnData`; `recheck` for uncertain matches; `recheckDistances` if any distance is inexact (executor recomputes and reorders).
- Optional `Datum compress(Datum in)` — attType -> leafType; output must not contain an out-of-line TOAST pointer; applied only to stored values (query scankeys are NOT compressed).
- Optional `options(internal) RETURNS void` — `local_relopts`, as for GiST.

### SP-GiST built-in operator classes (Table 65.2)  [M4]  (source: spgist.txt)
| Opclass | Indexable operators | Ordering operators |
|---|---|---|
| `box_ops` | `<<` `&<` `&>` `>>` `<@` `@>` `~=` `&&` `<<|` `&<|` `|&>` `|>>` (box,box) | `<->` (box,point) |
| `inet_ops` | `<<` `<<=` `>>` `>>=` `=` `<>` `<` `<=` `>` `>=` `&&` (inet,inet) | — |
| `kd_point_ops` | `|>>` `<<` `>>` `<<|` `~=` (point,point); `<@` (point,box) | `<->` (point,point) |
| `poly_ops` | `<<` `&<` `&>` `>>` `<@` `@>` `~=` `&&` `<<|` `&<|` `|>>` `|&>` (polygon,polygon) | `<->` (polygon,point) |
| `quad_point_ops` | `|>>` `<<` `>>` `<<|` `~=` (point,point); `<@` (point,box) | `<->` (point,point) |
| `range_ops` | `=` `&&` `@>` `<@` `<<` `>>` `&<` `&>` `-|-` (anyrange,anyrange); `@>` (anyrange,anyelement) | — |
| `text_ops` | `=` `<` `<=` `>` `>=` `~<~` `~<=~` `~>=~` `~>~` `^@` (text,text) | — |
- `quad_point_ops` is the DEFAULT for `point`; `kd_point_ops` supports the same operators with a different structure (k-d tree) that may perform better in some applications.
- `quad_point_ops`, `kd_point_ops`, `poly_ops` support `<->` => k-nearest-neighbor (k-NN) search. (Table also lists `<->` for `box_ops`.)

### SP-GiST implementation limits and special cases (ch.65.3.4-65.3.5)  [M4, M2]  (source: spgist.txt)
- Individual leaf tuples and inner tuples must fit on a single index page (8kB by default). Long variable-length values only via radix-tree-like methods (each level's prefix fits a page; final suffix fits a page) with `longValuesOK = true`; otherwise core rejects values too large for a page.
- Opclass must keep inner tuples from outgrowing a page (limits number of child nodes and prefix size).
- A node's set of leaf tuples must all be in the SAME index page (reduces seeking, saves link space). When the set outgrows the page: split + insert an intermediate inner tuple; picksplit must divide into >1 node group, else the all-the-same fallback.
- Infinite-loop guard with `longValuesOK`: core raises an error if the leaf datum does not get smaller within TEN cycles of `choose` calls.
- Without node labels (fixed node sets, e.g. quad-tree: always exactly four nodes around the centroid): `picksplit` returns NULL `nodeLabels`, `choose` returns NULL `prefixNodeLabels` in `spgSplitTuple`; then `spgAddNode` is an error. Labels may be used for some inner tuples and omitted for others in the same index.
- "All-the-same" inner tuples: created when picksplit fails to split into at least two node categories; multiple nodes with the same label, leaf values divided at random; `allTheSame` flag set. For such tuples: `choose` returning `spgMatchNode` => core ignores `nodeN` and descends into a RANDOM node (keeps tree balanced); `spgAddNode` is an error (use `spgSplitTuple`); `inner_consistent` must return ALL or NONE of the nodes.
- Source: `src/backend/access/spgist/`, `src/backend/utils/adt/`.

### GIN: concepts and built-in opclasses (ch.65.4.1-65.4.2)  [M4]  (source: gin.txt)
- GIN = Generalized Inverted Index: for composite ITEMS (documents, arrays, jsonb) where queries search for element values (KEYS) inside them. GIN always stores and searches KEYS, never item values per se.
- Index = set of `(key, posting list)` pairs; posting list = set of row IDs (TIDs) in which the key occurs. The same TID can appear in many posting lists. Each key value is stored ONLY ONCE => very compact when keys repeat.
- "Generalized": AM code does not know the operations; opclass strategies define how keys are extracted from items and queries and how to decide whether a row containing some query keys satisfies the query. Maintained by Teodor Sigaev and Oleg Bartunov.
- Built-in GIN operator classes (Table 65.3):
  | Opclass | Indexable operators |
  |---|---|
  | `array_ops` | `&&` `@>` `<@` `=` (anyarray,anyarray) |
  | `jsonb_ops` | `@>` (jsonb,jsonb); `@?` (jsonb,jsonpath); `@@` (jsonb,jsonpath); `?` (jsonb,text); `?|` (jsonb,text[]); `?&` (jsonb,text[]) |
  | `jsonb_path_ops` | `@>` (jsonb,jsonb); `@?` (jsonb,jsonpath); `@@` (jsonb,jsonpath) |
  | `tsvector_ops` | `@@` (tsvector,tsquery) |
- `jsonb_ops` is the default for jsonb; `jsonb_path_ops` supports fewer operators but performs better for them (Section 8.14.4).
- Contrib GIN opclasses: `btree_gin` (B-tree equivalent functionality for several data types), `hstore`, `intarray` (enhanced support for int[]), `pg_trgm` (trigram similarity).

### GIN extensibility: support methods (ch.65.4.3)  [M4]  (source: gin.txt)
- Required:
  - `Datum *extractValue(Datum itemValue, int32 *nkeys, bool **nullFlags)` — palloc'd array of keys for an item; `*nullFlags` array if any key may be null; may return NULL if the item has no keys.
  - `Datum *extractQuery(Datum query, int32 *nkeys, StrategyNumber n, bool **pmatch, Pointer **extra_data, bool **nullFlags, int32 *searchMode)` — keys for the right-hand-side query value of operator strategy `n`.
    - `*searchMode` (symbols in `access/gin.h`): `GIN_SEARCH_MODE_DEFAULT` (initial; only items matching at least one returned key are candidates); `GIN_SEARCH_MODE_INCLUDE_EMPTY` (also items with no keys at all — for is-subset-of operators); `GIN_SEARCH_MODE_ALL` (all non-null items are candidates; essentially a full index scan, much slower; an operator needing it in most cases is a poor GIN candidate).
    - `*pmatch`: array of nkeys bools, true where the key needs PARTIAL match (NULL = none).
    - `*extra_data`: array of nkeys pointers passed whole to `consistent` and element-wise to `comparePartial`.
  - Match check, one or both of:
    - `bool consistent(bool check[], StrategyNumber n, Datum query, int32 nkeys, Pointer extra_data[], bool *recheck, Datum queryKeys[], bool nullFlags[])` — has no access to the item itself, only `check[i]` = "item contains the i-th query key" (for a null query key `check[i]` means the item contains a null key — IS NOT DISTINCT FROM semantics). false => heap tuple definitely does not match; true with `*recheck = false` => definitely matches; true with `*recheck = true` => maybe, heap tuple fetched and operator re-evaluated on the original item.
    - `GinTernaryValue triConsistent(GinTernaryValue check[], StrategyNumber n, Datum query, int32 nkeys, Pointer extra_data[], Datum queryKeys[], bool nullFlags[])` — values `GIN_TRUE`, `GIN_FALSE`, `GIN_MAYBE` (presence unknown). Return GIN_TRUE only if certainly matching regardless of MAYBE keys; GIN_FALSE only if certainly not; else GIN_MAYBE. With no MAYBE inputs, a GIN_MAYBE result == recheck. triConsistent alone is sufficient; providing both can help if boolean is much cheaper. Only boolean provided => optimizations that refute items before fetching all keys are DISABLED.
  - `int compare(Datum a, Datum b)` — orders KEYS (not items); null keys never passed. If omitted GIN uses the default btree opclass comparison for the key type (costs a lookup; polymorphic opclasses like `array_ops` cannot specify one function).
- Optional:
  - `int comparePartial(Datum partial_key, Datum key, StrategyNumber n, Pointer extra_data)` — `< 0`: index key does not match but continue scanning; `0`: match; `> 0`: stop, no more matches possible. Null keys never passed.
  - `void options(local_relopts *relopts)`.
- Types: items passed to `extractValue` are of the opclass input type; all keys are of the opclass `STORAGE` type; query type = right-hand type of the operator.

### GIN implementation: entry tree, posting lists/trees, pending list, partial match (ch.65.4.4)  [M4, M2]  (source: gin.txt)
- Internally a GIN index contains a B-TREE OVER KEYS (the "entry tree"). Each leaf-page tuple contains EITHER a pointer to a B-tree of heap pointers (a "POSTING TREE") OR a simple list of heap pointers (a "POSTING LIST") when the list is small enough to fit in a single index tuple together with the key value. (Figure 65.1 "GIN Internals" illustrates entry tree -> posting list / posting tree; image not in text.)
- Since PostgreSQL 9.1: null key values can be indexed; PLACEHOLDER nulls are stored for items that are null or contain no keys per `extractValue`, so searches that should find empty items can.
- Multicolumn GIN = a SINGLE B-tree over composite values `(column number, key value)`; key types can differ per column.
- Fast update technique:
  - Problem: one heap row insert/update => many index inserts (one per extracted key).
  - New tuples go into a temporary, UNSORTED list of pending entries (the PENDING LIST).
  - Pending entries are moved into the main structure (using the same bulk-insert techniques as initial index creation) when: the table is VACUUMed or autoanalyzed, `gin_clean_pending_list()` is called, or the pending list grows larger than `gin_pending_list_limit`.
  - Benefits: much faster updates even counting extra vacuum overhead; work can be done in background.
  - Costs: every search must scan the pending list in addition to the main index (large list => slow searches); the unlucky update that pushes the list over the limit pays an immediate cleanup cycle (much slower than other updates). Proper autovacuum minimizes both.
  - Disable with storage parameter `fastupdate = off` if consistent response time matters more than update speed.
- Partial match algorithm: `extractQuery` returns the LOWER BOUND key of the range and sets `pmatch` true; the key range is scanned in `compare` order calling `comparePartial` (0 = match, < 0 = non-match still within range, > 0 = past the range).

### GIN tips, tricks, limitations (ch.65.4.5-65.4.6)  [M4, M7]  (source: gin.txt)
- Create vs insert: for bulk loads drop the GIN index and recreate after loading (with `fastupdate` the penalty is smaller but for very large updates still best to drop/recreate).
- `maintenance_work_mem`: GIN build time is very sensitive to it.
- `gin_pending_list_limit`: threshold for pending-list cleanup during inserts with fastupdate. Prefer background (autovacuum) cleanup to avoid response-time fluctuations: increase the limit or make autovacuum more aggressive — but a larger limit makes a foreground cleanup, if it happens, even longer. Overridable per index via storage parameter (`gin_pending_list_limit`). (Default value is documented in ch.19, not on this page.)
- `gin_fuzzy_search_limit`: SOFT upper limit on rows returned by a GIN scan; default 0 = no limit. Non-zero => returned set is a RANDOM subset of the full result. "Soft" = actual count may differ somewhat. Recommended values in the thousands (5000 — 20000). Motivation: full-text queries with very frequent words return huge, useless result sets (the index search itself is fast; reading/sorting tuples is slow).
- Limitation: GIN assumes indexable operators are STRICT. `extractValue` is never called on a null item (placeholder entry created automatically); `extractQuery` is never called on a null query (query presumed unsatisfiable). Null KEYS inside a non-null item or query are supported.

### BRIN: concepts and maintenance (ch.65.5.1)  [M4, M7]  (source: brin.txt)
- BRIN = Block Range Index: for very large tables where a column correlates naturally with physical location (order date in an append-mostly sales table; ZIP codes grouped by city).
- Works on BLOCK RANGES ("page ranges") = groups of physically adjacent table pages; stores SUMMARY info per range.
- Query path: regular BITMAP index scans only; returns ALL tuples in ALL pages of every range whose summary is consistent with the query; executor rechecks and discards => LOSSY. Index is tiny, so scanning it adds little over a seq scan but can skip large parts of the table.
- What is stored / which queries are supported depends on the opclass (linear-order types: min & max per range; geometric: bounding box).
- Range size fixed at index creation by storage parameter `pages_per_range`. Number of index entries = relation size in pages / `pages_per_range`. Smaller value => larger index but more precise summaries and more blocks skipped. (Default value not stated on this page; CREATE INDEX docs give it.)
- Maintenance:
  1. At CREATE INDEX all existing heap pages are scanned, one summary index tuple per range, including the possibly-incomplete LAST range.
  2. Inserts into an already-summarized range UPDATE its summary with the new tuples' data.
  3. A new page beyond the last summarized range does NOT get a summary automatically — the range stays UNSUMMARIZED until a summarization run.
- Triggers for initial summarization of a range:
  - VACUUM (manual or autovacuum) on the table summarizes all existing unsummarized ranges.
  - Index storage parameter `autosummarize` (OFF by default): whenever autovacuum runs in that database, summarization occurs for all unsummarized ranges that have been filled, regardless of whether the table itself is processed by autovacuum. Mechanism: when an insertion is detected for the FIRST item of the FIRST page of the NEXT block range, a request is sent to autovacuum for a targeted summarization of the (just-filled) range, fulfilled the next time an autovacuum worker finishes running in the same database. If the request queue is full the request is dropped with `LOG:  request for BRIN range summarization for index "brin_wi_idx" page 128 was not recorded`; the range then waits for the next regular vacuum or a manual function call.
  - Functions (run with `search_path` temporarily set to `pg_catalog, pg_temp`): `brin_summarize_new_values(regclass)` — all unsummarized ranges; `brin_summarize_range(regclass, bigint)` — only the range containing the given page, if unsummarized.
- De-summarize: `brin_desummarize_range(regclass, bigint)` — useful when the summary is no longer a good representation because values changed (summaries only ever widen). See Section 9.28.8.

### BRIN operator class families, parameters, extensibility (ch.65.5.2-65.5.3)  [M4]  (source: brin.txt)
- Four opclass kinds:
  - MINMAX: stores the minimum and maximum value in the range (single contiguous interval).
  - INCLUSION: stores a value that includes all values in the range (e.g. bounding box, covering network, covering range).
  - BLOOM: builds a Bloom filter for all values in the range (equality only).
  - MINMAX-MULTI: stores multiple minimum/maximum values (several smaller intervals) => better handling of OUTLIER values.
- Opclass parameters (only bloom and minmax-multi accept any):
  - bloom `n_distinct_per_range`: estimated number of distinct non-null values per block range, sizes the Bloom filter; like `n_distinct` of ALTER TABLE. Positive = absolute count. Negative (must be >= -1) = grows linearly with the maximum possible number of tuples in the block range (about 290 rows per block). DEFAULT -0.1; minimum number of distinct non-null values is 16.
  - bloom `false_positive_rate`: desired false positive rate; must be between 0.0001 and 0.25; DEFAULT 0.01 (1%).
  - minmax-multi `values_per_range`: maximum number of values stored to summarize a range (each value is a point or an interval boundary); between 8 and 256; DEFAULT 32.
- Required opclass methods (4):
  - `BrinOpcInfo *opcInfo(Oid type_oid)` — `struct BrinOpcInfo { uint16 oi_nstored; void *oi_opaque; TypeCacheEntry *oi_typcache[FLEXIBLE_ARRAY_MEMBER]; }` (`oi_nstored` = number of columns stored in an index column of this opclass; `oi_opaque` for passing info between support functions during a scan).
  - `bool consistent(BrinDesc *bdesc, BrinValues *column, ScanKey *keys, int nkeys)` — are ALL scan keys consistent with the range's summary (multiple keys for the same attribute at once). Older backward-compatible variant: `bool consistent(BrinDesc *bdesc, BrinValues *column, ScanKey key)`.
  - `bool addValue(BrinDesc *bdesc, BrinValues *column, Datum newval, bool isnull)` — widen the summary to also represent the new value; return true if modified.
  - `bool unionTuples(BrinDesc *bdesc, BrinValues *a, BrinValues *b)` — merge two summaries into `a` (b unchanged).
- Optional: `void options(local_relopts *relopts)`.
- New opclasses for other types can reuse the stock support functions with catalog entries only (no C code). No backward-compat guarantee across major releases for fully custom opclasses.
- Table 65.5 Minmax opclass members (ALL mandatory): support fn 1 `brin_minmax_opcinfo()`, 2 `brin_minmax_add_value()`, 3 `brin_minmax_consistent()`, 4 `brin_minmax_union()`; operator strategies 1 less-than, 2 less-than-or-equal-to, 3 equal-to, 4 greater-than-or-equal-to, 5 greater-than.
- Table 65.6 Inclusion opclass members (all operators optional): support fn 1 `brin_inclusion_opcinfo()`, 2 `brin_inclusion_add_value()`, 3 `brin_inclusion_consistent()`, 4 `brin_inclusion_union()`, 11 function to merge two elements (REQUIRED; takes two args of the opclass type, returns their union, matching the STORAGE type), 12 optional "are two elements mergeable" (for network addresses of different families), 13 optional "is element contained within another" (recommended: lets BRIN shortcut when the union does not change), 14 optional "is element empty" (empty ranges). Operator strategies (dependency in parentheses): 1 left-of (4); 2 does-not-extend-to-the-right-of (5); 3 overlaps; 4 does-not-extend-to-the-left-of (1); 5 right-of (2); 6, 18 same-as-or-equal-to (7); 7, 16, 24, 25 contains-or-equal-to; 8, 26, 27 is-contained-by-or-equal-to (3); 9 does-not-extend-above (11); 10 is-below (12); 11 is-above (9); 12 does-not-extend-below (10); 20 less-than (5); 21 less-than-or-equal-to (5); 22 greater-than (1); 23 greater-than-or-equal-to (1).
- Support function numbers 1-10 are reserved for BRIN internal functions; SQL-level functions start at 11.
- Table 65.7 Bloom opclass members (ALL mandatory): support procs 1 `brin_bloom_opcinfo()`, 2 `brin_bloom_add_value()`, 3 `brin_bloom_consistent()`, 4 `brin_bloom_union()`, 5 `brin_bloom_options()`, 11 function to compute hash of an element (one arg of the opclass type); operator strategy 1 equal-to. For types with only equality + hashing.
- Table 65.8 Minmax-multi members (ALL mandatory): 1 `brin_minmax_multi_opcinfo()`, 2 `brin_minmax_multi_add_value()`, 3 `brin_minmax_multi_consistent()`, 4 `brin_minmax_multi_union()`, 5 `brin_minmax_multi_options()`, 11 function to compute DISTANCE between two values (length of a range); strategies 1-5 as minmax.
- Cross-type operators: minmax needs a full same-type operator set, extra types via extra operator sets; inclusion strategies depend on another strategy (or themselves) with the STORAGE type on the left. Examples: `float4_minmax_ops` (minmax), `box_inclusion_ops` (inclusion).

### Hash indexes (ch.65.6)  [M4, M2]  (source: hash-index.txt)
- Persistent on-disk hash indexes, FULLY CRASH RECOVERABLE (WAL-logged). Any data type can be indexed, including types without a linear ordering.
- Stores ONLY the hash value: each hash index tuple stores just the 4-BYTE hash value, not the column value => no size limit on the indexed column; can be much smaller than a B-tree for long values (UUIDs, URLs). Consequence: ALL hash index scans are LOSSY (recheck needed).
- Restrictions: single-column only; NO uniqueness checking; supports only the `=` operator (no range scans).
- Can take part in bitmap index scans and backward scans.
- Best for SELECT and UPDATE-heavy workloads with equality scans on larger tables. B-tree must descend the tree to the leaf; a hash index accesses the BUCKET PAGE (the analogue of a leaf page) directly — fewer "logical I/O"s, more pronounced when index/data exceed shared_buffers/RAM.
- Uneven distributions: when a bucket page fills, OVERFLOW PAGES are chained to that bucket; a scan of the bucket must read all its overflow pages. An unbalanced hash index can need more block accesses than a B-tree. => Most suitable for unique / nearly unique data or few rows per bucket. Possible mitigation: partial index excluding highly non-unique values.
- Deletion: like B-tree, performs SIMPLE index tuple deletion of items whose `LP_DEAD` bit is set — when an insert finds no space on a page it first tries removing dead tuples to avoid creating a new overflow page; cannot happen if the page is pinned at that time. Dead pointers are also removed by VACUUM.
- VACUUM also tries to SQUEEZE tuples onto as few overflow pages as possible (shortening the overflow chain). Emptied overflow pages are recycled for other buckets but NEVER returned to the OS. No way to shrink a hash index except `REINDEX`; no way to reduce the number of buckets.
- Growth: number of bucket pages expands as rows grow. Key-to-bucket mapping is chosen so the index expands INCREMENTALLY: adding a bucket means exactly ONE existing bucket is "split", some of its tuples moving to the new bucket per the updated mapping. Expansion happens in the FOREGROUND (slows user inserts) => may not suit tables with a rapidly increasing number of rows.
- Four page kinds:
  1. META PAGE (page zero): statically allocated control information.
  2. PRIMARY BUCKET pages.
  3. OVERFLOW pages.
  4. BITMAP pages: track overflow pages that have been freed and are available for re-use; for addressing purposes regarded as a subset of the overflow pages.
- Locating a bucket needs the bucket count, `highmask` and `lowmask` from the metapage; to avoid locking/pinning the metapage on every operation each backend keeps a CACHED COPY of the metapage in its relcache entry — correct as long as the target bucket has not been split since the last cache refresh.
- Primary bucket pages and overflow pages are allocated independently; addressing rules allow a variable number of overflow pages without ever moving primary bucket pages after creation.
- One index tuple per table row, in bucket pages (and overflow pages). Entries WITHIN one index page are kept SORTED BY HASH CODE (binary search within a page); there is NO ordering assumption across different pages of a bucket.
- Bucket split algorithm: described in `src/backend/access/hash/README`; crash safe and restartable if not completed.

### System catalog declarations & BKI (ch.68)  [M1, M2]  (source: bki.txt, system-catalog-declarations.txt, system-catalog-initial-data.txt, bki-format.txt, bki-commands.txt, bki-structure.txt, bki-example.txt)
- Physically a system catalog is no different from a user table, but backend C code knows each catalog's layout — never alter catalog structure on the fly. Structure can change between major versions.
- Headers in `src/include/catalog/` (`pg_class.h` for `pg_class`); initial data in `.dat` files there (`pg_proc.dat`). `genbki.pl` (Perl, at build time) produces `postgres.bki` (release-specific, platform-independent, installed in `share`) and a derived header per catalog (`pg_class_d.h`: OID macros, enums, for client code). A backend in BOOTSTRAP MODE (during `initdb`) reads the BKI ("Backend Interface") file.
- Declaration rules:
  - `CATALOG` macro = shorthand for `typedef struct FormData_catalogname`; each struct field = a column. BKI property macros in `genbki.h` (defaults, nullability; whole-catalog properties such as shared relation).
  - Catalog cache code maps the C struct onto tuples, so the fixed-length portion must be present: ALL variable-length and nullable fields go at the END and cannot be accessed as struct fields; wrap them in `#ifdef CATALOG_VARLEN ... #endif` (never defined). Example failure: NULL `pg_type.typrelid` would break `typetup->typrelid` and `typetup->typelem`.
  - Bootstrap marks columns NOT NULL automatically if fixed-width and not preceded by a nullable/variable-width column; override with `BKI_FORCE_NOT_NULL` / `BKI_FORCE_NULL`.
  - Frontend code must include `pg_xxx_d.h`, not `pg_xxx.h`; expose code via `#ifdef EXPOSE_TO_CLIENT_CODE ... #endif`.
  - BOOTSTRAP CATALOGS: too fundamental to be created by the normal BKI `create`; need hand-made `pg_class` and `pg_type` entries (pg_attribute entries are generated by genbki.pl). Avoid creating new ones. Minimum critical tables: `pg_class`, `pg_attribute`, `pg_proc`, `pg_type`.
- `.dat` format: Perl array of hash refs, eval'd. `[ { oid => '1', oid_symbol => 'Template1DbOid', descr => 'database\'s default template', datname => 'template1', ... datacl => '_null_' }, ]`. Keys = column names + metadata keys `oid`, `oid_symbol`, `array_type_oid`, `descr` (goes to `pg_description`/`pg_shdescription`). All values single-quoted; `_null_` = NULL; comments `#` on own lines; a literal backslash needs FOUR backslashes (Perl strips two, bootstrap scanner treats the rest as escape). OID references written symbolically. Columns with header defaults may be omitted. Formatter `reformat_dat_file.pl` / `make reformat-dat-files` (metadata fields first, 80-col lines, default-valued fields dropped); expander `Catalog::ParseData()`; `make expand-dat-files`.
- OID ranges (important):
  - 1–9999: reserved for MANUAL assignment (find free with `src/include/catalog/unused_oids`; check with `duplicate_oids`). Development patches should pick from 8000–9999, renumbered below that range after commit with `renumber_oids.pl`. OIDs are not stable until in an official release; never changed after release.
  - 10000–11999: assigned automatically by `genbki.pl`; the OID counter is set to 10000 at the start of a bootstrap run.
  - `FirstUnpinnedObjectId` = 12000: objects with OIDs below it are "PINNED" (cannot be dropped; a few exceptions hard-wired in `IsPinnedObject()`). initdb forces the counter to 12000 before creating unpinned objects (e.g. those from `information_schema.sql`).
  - 16384 and up: OIDs assigned during normal database operation. So 10000–16383 are automatically-assigned-at-genbki/initdb OIDs, NOT stable across installations.
  - Never write numeric OIDs in C; macros for pg_proc OIDs come from `src/backend/utils/Gen_fmgrtab.pl`, pg_type and pg_class (catalogs/indexes) macros are automatic; others need `oid_symbol`.
- OID reference lookup: `BKI_LOOKUP(lookuprule)` on columns of type `Oid`, `regproc`, `oidvector`, `Oid[]`; `BKI_LOOKUP(encoding)` on integer columns; `BKI_LOOKUP_OPT` allows `0` (or `-` for regproc). Names: types by exact `typname` (no aliases like `integer` for `int4`); functions by `proname` if unique else `proname(argtypename,argtypename,...)` without spaces; operators `oprname(lefttype,righttype)` (0 for a missing unary operand); opclasses/opfamilies `access_method_name/object_name`. No schema qualification (everything in `pg_catalog`). genbki.pl resolves to numeric OIDs. Also `DECLARE_FOREIGN_KEY`, `DECLARE_FOREIGN_KEY_OPT`, `DECLARE_ARRAY_FOREIGN_KEY`, `DECLARE_ARRAY_FOREIGN_KEY_OPT` for multi-column relationships (used by regression tests).
- Automatic array types: `array_type_oid => nnnn` in the scalar's pg_type entry; array type name = `_` + scalar name; other fields from `BKI_ARRAY_DEFAULT(value)` or copied; `typelem`/`typarray` cross-linked.
- Editing recipes: new column with default -> `BKI_DEFAULT(value)`; add a default -> annotate then `make reformat-dat-files`; remove column -> remove from header then reformat; change/remove a default -> `make expand-dat-files` first, then change, then reformat; bulk edits by adapting `reformat_dat_file.pl` (example: consolidating `proisagg`/`proiswindow` into `char prokind BKI_DEFAULT(f)` with 'a' / 'w').
- BKI file format: sequence of commands made of tokens (keywords, special characters, identifiers, numbers, single-quoted strings); whitespace-separated; no command separator; case sensitive; lines starting with `#` ignored.
- BKI commands (complete):
  - `create tablename tableoid [bootstrap] [shared_relation] [rowtype_oid oid] (name1 = type1 [FORCE NOT NULL | FORCE NULL ] [, name2 = type2 [...], ...])` — `bootstrap`: created only on disk, nothing entered in pg_class/pg_attribute etc.; implicitly opened for insertion. Types supported directly by `bootstrap.c`: `bool`, `bytea`, `char` (1 byte), `name`, `int2`, `int4`, `regproc`, `regclass`, `regtype`, `text`, `oid`, `tid`, `xid`, `cid`, `int2vector`, `oidvector`, `_int4`, `_text`, `_oid`, `_char`, `_aclitem`.
  - `open tablename` — open for insertion (closes any currently open table).
  - `close tablename` — name given as cross-check.
  - `insert ( [oid_value] value1 value2 ... )` — `_null_` for NULL; non-identifier/non-digit values single-quoted (quote doubled; backslash escapes allowed).
  - `declare [unique] index indexname indexoid on tablename using amname ( opclass1 name1 [, ...] )` — creates file + catalog entries, contents not initialized.
  - `declare toast toasttableoid toastindexoid on tablename`.
  - `build indices` — fill previously declared indexes.
- Required structure of `postgres.bki`: (1) `create bootstrap` a critical table, `insert` rows describing at least the critical tables, `close`; repeat for other critical tables; (2) `create` (no bootstrap) noncritical table, `open`, `insert`, `close`; repeat; (3) define indexes and toast tables; (4) `build indices`. "There are doubtless other, undocumented ordering dependencies."
- Example: `create test_table 420 (oid = oid, cola = int4, colb = text)` / `open test_table` / `insert ( 421 1 'value 1' )` / `insert ( 422 2 _null_ )` / `close test_table`.

### How the planner uses statistics: worked row-estimation examples (ch.69.1)  [M4]  (source: planner-stats-details.txt, row-estimation-examples.txt)
All examples use regression-database table `tenk1` (10000 rows); ANALYZE samples randomly so numbers shift slightly after each ANALYZE.

**1. Table cardinality** — `EXPLAIN SELECT * FROM tenk1;` -> `Seq Scan on tenk1 (cost=0.00..458.00 rows=10000 width=244)`.
- `SELECT relpages, reltuples FROM pg_class WHERE relname = 'tenk1';` -> `relpages = 358`, `reltuples = 10000` (as of last VACUUM/ANALYZE).
- Planner fetches the ACTUAL current number of pages (cheap, no scan); if different from `relpages`, `reltuples` is scaled proportionally. Here unchanged so rows = reltuples.

**2. Range condition via histogram** — `EXPLAIN SELECT * FROM tenk1 WHERE unique1 < 1000;` -> `Bitmap Heap Scan on tenk1 (cost=24.06..394.64 rows=1007 width=244)`, `Recheck Cond: (unique1 < 1000)`, `Bitmap Index Scan on tenk1_unique1 (cost=0.00..23.80 rows=1007 width=0)`.
- Selectivity function for `<` is found in `pg_operator.oprrest` = `scalarltsel`; it reads the histogram from `pg_statistic` (view `pg_stats`).
- `histogram_bounds = {0,993,1997,3050,4040,5036,5957,7057,8029,9016,9995}` (11 bounds = 10 equal-frequency buckets).
- 1000 is in bucket 2 (993–1997); assume linear distribution within a bucket:
  ```
  selectivity = (1 + (1000 - bucket[2].min)/(bucket[2].max - bucket[2].min))/num_buckets
              = (1 + (1000 - 993)/(1997 - 993))/10
              = 0.100697
  rows = rel_cardinality * selectivity = 10000 * 0.100697 = 1007 (rounding off)
  ```

**3. Equality, value IN the MCV list** — `EXPLAIN SELECT * FROM tenk1 WHERE stringu1 = 'CRAAAA';` -> `Seq Scan (cost=0.00..483.00 rows=30 width=244)`, `Filter: (stringu1 = 'CRAAAA'::name)`.
- Selectivity function for `=` is `eqsel`. Histogram is not useful for equality; MCVs are used.
- `pg_stats` for `stringu1`: `null_frac = 0`, `n_distinct = 676`, `most_common_vals = {EJAAAA,BBAAAA,CRAAAA,FCAAAA,FEAAAA,GSAAAA,JOAAAA,MCAAAA,NAAAAA,WGAAAA}`, `most_common_freqs = {0.00333333,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003}`.
- `selectivity = mcf[3] = 0.003`; `rows = 10000 * 0.003 = 30`.

**4. Equality, value NOT in the MCV list** — `WHERE stringu1 = 'xxx'` -> `rows=15`.
  ```
  selectivity = (1 - sum(mcv_freqs))/(num_distinct - num_mcv)
              = (1 - (0.00333333 + 0.003 + 0.003 + 0.003 + 0.003 + 0.003 + 0.003 + 0.003 + 0.003 + 0.003))/(676 - 10)
              = 0.0014559
  rows = 10000 * 0.0014559 = 15 (rounding off)
  ```
- Assumes the non-MCV fraction is evenly spread over the other distinct values. If there were nulls, `null_frac` would also be subtracted from the numerator.

**5. Range condition with BOTH MCV list and histogram** — `WHERE stringu1 < 'IAAAAA'` -> `Seq Scan (cost=0.00..483.00 rows=3077 width=244)`.
- Key fact: for a non-unique column the histogram does NOT include the population represented by the MCVs. (`unique1` is unique so has no MCVs — example 2 was complete for it.)
- `scalarltsel` applies the condition to each MCV and sums the frequencies of those that satisfy it (exact for the MCV part): first six MCVs qualify: `0.00333333 + 0.003*5 = 0.01833333`.
- Total MCV fraction = `0.03033333`; histogram fraction = `0.96966667` (nulls would be excluded too).
- `histogram_bounds = {AAAAAA,CQAAAA,FRAAAA,IBAAAA,KRAAAA,NFAAAA,PSAAAA,SGAAAA,VAAAAA,XLAAAA,ZZAAAA}`; `IAAAAA` falls near the end of the 3rd bucket; with "rather cheesy assumptions about the frequency of different characters" histogram selectivity = `0.298387`.
  ```
  selectivity = mcv_selectivity + histogram_selectivity * histogram_fraction
              = 0.01833333 + 0.298387 * 0.96966667
              = 0.307669
  rows = 10000 * 0.307669 = 3077 (rounding off)
  ```

**6. Multiple conditions (independence assumption)** — `WHERE unique1 < 1000 AND stringu1 = 'xxx'` -> `Bitmap Heap Scan (cost=23.80..396.91 rows=1 width=244)`, `Recheck Cond: (unique1 < 1000)`, `Filter: (stringu1 = 'xxx'::name)`, inner `Bitmap Index Scan on tenk1_unique1 (cost=0.00..23.80 rows=1007 width=0)`.
  ```
  selectivity = selectivity(unique1 < 1000) * selectivity(stringu1 = 'xxx')
              = 0.100697 * 0.0014559 = 0.0001466
  rows = 10000 * 0.0001466 = 1 (rounding off)
  ```
- The bitmap index scan's row estimate (1007) reflects ONLY the index condition — matters for the heap-fetch cost.

**7. Join selectivity** — `EXPLAIN SELECT * FROM tenk1 t1, tenk2 t2 WHERE t1.unique1 < 50 AND t1.unique2 = t2.unique2;` -> `Nested Loop (cost=4.64..456.23 rows=50 width=488)`; outer `Bitmap Heap Scan on tenk1 t1 (cost=4.64..142.17 rows=50 width=244)` with `Bitmap Index Scan on tenk1_unique1 (cost=0.00..4.63 rows=50 width=0)`; inner `Index Scan using tenk2_unique2 on tenk2 t2 (cost=0.00..6.27 rows=1 width=244)`, `Index Cond: (unique2 = t1.unique2)`.
- Restriction `unique1 < 50` (first bucket): `selectivity = (0 + (50 - 0)/(993 - 0))/10 = 0.005035`; `rows = 10000 * 0.005035 = 50`.
- Join clause selectivity function comes from `pg_operator.oprjoin` = `eqjoinsel`. Stats for `unique2` in both tables: `null_frac = 0`, `n_distinct = -1` (all unique), no MCVs.
  ```
  selectivity = (1 - null_frac1) * (1 - null_frac2) / max(num_rows1, num_rows2)
              = (1 - 0) * (1 - 0) / max(10000, 10000) = 0.0001
  rows = (outer_cardinality * inner_cardinality) * selectivity = (50 * 10000) * 0.0001 = 50
  ```
- (The divisor is scaled in the non-unique case.) With MCV lists on both sides `eqjoinsel` compares the MCV lists directly for the MCV part and uses this approach for the remainder.
- `inner_cardinality` is the unmodified size of tenk2 (10000), NOT `50 * 1` from the per-loop index scan estimate: join relation size is estimated BEFORE any particular join plan is considered; the two can diverge due to round-off.
- Code pointers: table size `src/backend/optimizer/util/plancat.c`; generic clause selectivity `src/backend/optimizer/path/clausesel.c`; operator-specific functions `src/backend/utils/adt/selfuncs.c`.

### Multivariate (extended) statistics examples (ch.69.2)  [M4]  (source: multivariate-statistics-examples.txt)
- Setup: `CREATE TABLE t (a INT, b INT); INSERT INTO t SELECT i % 100, i % 100 FROM generate_series(1, 10000) s(i); ANALYZE t;` -> `relpages = 45`, `reltuples = 10000`; 100 distinct values per column, uniform, a always equals b.
- Single column: `EXPLAIN (ANALYZE, TIMING OFF, BUFFERS OFF) SELECT * FROM t WHERE a = 1;` -> `Seq Scan on t (cost=0.00..170.00 rows=100 width=8) (actual rows=100.00 loops=1)`, `Rows Removed by Filter: 9900` (selectivity 1%, exact). (Note PG 18 output: fractional `actual rows=100.00`.)
- Two correlated columns: `WHERE a = 1 AND b = 1` -> `(cost=0.00..195.00 rows=1 width=8) (actual rows=100.00 loops=1)`: 1% × 1% = 0.01% => 1 row estimated vs 100 actual (two orders of magnitude underestimate).
- Functional dependencies: `CREATE STATISTICS stts (dependencies) ON a, b FROM t; ANALYZE t;` -> same query now `rows=100` (actual 100).
- N-distinct: `SELECT COUNT(*) FROM t GROUP BY a;` -> `HashAggregate (cost=195.00..196.00 rows=100 width=12) (actual rows=100.00 loops=1)` (accurate). `GROUP BY a, b` without extended stats -> `HashAggregate (cost=220.00..230.00 rows=1000 width=16) (actual rows=100.00 ...)` (off by 10x). After `DROP STATISTICS stts; CREATE STATISTICS stts (dependencies, ndistinct) ON a, b FROM t; ANALYZE t;` -> `HashAggregate (cost=220.00..221.00 rows=100 width=16)`.
- MCV lists: functional dependencies are cheap but GLOBAL (column-level, not value-level). Multivariate MCV stores actual value combinations; more expensive to build (ANALYZE), store and plan with.
  - `DROP STATISTICS stts; CREATE STATISTICS stts2 (mcv) ON a, b FROM t; ANALYZE t;` -> `WHERE a = 1 AND b = 1` estimates `rows=100`.
  - Inspect: `SELECT m.* FROM pg_statistic_ext join pg_statistic_ext_data on (oid = stxoid), pg_mcv_list_items(stxdmcv) m WHERE stxname = 'stts2';` -> columns `index | values | nulls | frequency | base_frequency`; 100 rows such as `0 | {0, 0} | {f,f} | 0.01 | 0.0001`. `base_frequency` = frequency computed from per-column statistics as if no multi-column stats existed (0.01 × 0.01).
  - Estimation: apply all conditions to each MCV item, sum the frequencies of matching items (`mcv_clauselist_selectivity` in `src/backend/statistics/mcv.c`).
  - Advantage 1 — knows which combinations are compatible: `WHERE a = 1 AND b = 10` -> `rows=1` (actual 0, `Rows Removed by Filter: 10000`).
  - Advantage 2 — handles more clause types than equality (functional dependencies only handle equality): `WHERE a <= 49 AND b > 49` -> `rows=1` (actual 0).

### Planner statistics and security (ch.69.3)  [M4, M6]  (source: planner-stats-security.txt)
- `pg_statistic` is readable by superusers only. Selectivity estimators may run a user-provided operator (the query's operator or a related one, e.g. `=` to compare the query constant with stored MCVs) on stored statistics values — a crafted operator could leak them (logging, writing to a table, or error messages).
- Rule for all built-in selectivity functions: to use stored statistics the current user must have `SELECT` privilege on the table or the involved columns, OR the operator (really its underlying function) must be `LEAKPROOF`. Otherwise the estimator behaves as if NO statistics are available and falls back to defaults.
- `\do+` in psql shows which operators are leakproof.
- Usually invisible (the query would fail with permission denied anyway), but matters for SECURITY-BARRIER VIEWS over tables the user cannot read: non-leakproof operators => stats not used => possibly suboptimal plan with no direct feedback (try as a more privileged user to compare plans).
- Restriction applies only where a user-defined operator would be executed on `pg_statistic` values; generic stats (null fraction, number of distinct values) are usable regardless of privileges.
- Third-party extension selectivity functions should follow the same rules.

### Backup manifest format (ch.70)  [M7]  (source: backup-manifest-format.txt, backup-manifest-toplevel.txt, backup-manifest-files.txt, backup-manifest-wal-ranges.txt)
- Generated by `pg_basebackup`, primarily for verification by `pg_verifybackup`; other tools may read it. A JSON document (always an object) encoded as UTF-8 — no exception for other server encodings (unlike json/jsonb types).
- Top-level keys:
  - `PostgreSQL-Backup-Manifest-Version` — integer; 2 beginning in PostgreSQL 17, 1 in older versions.
  - `System-Identifier` — database system identifier of the instance; present only when version is 2.
  - `Files` — list of file objects; NO entries for WAL files needed by the backup nor for the manifest itself.
  - `WAL-Ranges` — list of WAL range objects.
  - `Manifest-Checksum` — always on the LAST LINE; SHA-256 checksum of all preceding lines (fixed algorithm so clients can parse incrementally).
- File object: `Path` (relative to backup root; files in user tablespaces start with `pg_tblspc/<tablespace OID>`) OR `Encoded-Path` (hex digits, two per octet; used when the path is not legal UTF-8 or the user requests encoded paths for all files). Always: `Size` (integer, expected size), `Last-Modified` (server-reported mtime; informational only, NOT used by pg_verifybackup). With file checksums enabled: `Checksum-Algorithm` (`CRC32C`, `SHA224`, `SHA256`, `SHA384`, `SHA512`; currently the same for every file) and `Checksum` (hex, two chars per byte).
- WAL range object (always three keys): `Timeline` (integer), `Start-LSN` (LSN where replay must begin on that timeline; format two hex strings of 1–8 chars separated by a slash), `End-LSN` (earliest LSN at which replay on that timeline may end).
- Ordinarily one WAL range; multiple (one per timeline, never two for the same timeline) if the backup is taken from a standby that switches timelines during the backup because of an upstream promotion.

## Complete inventories

### Index AM capability summary (as documented in this slice)
| AM | Structure | Operators supported | Multi-col | Unique | Ordered scan | Lossy? | Notes |
|---|---|---|---|---|---|---|---|
| B-tree | balanced multi-way tree, metapage + internal + leaf, sibling-linked levels | `<` `<=` `=` `>=` `>` | yes | yes (only AM with `amcanunique`) | yes (`amcanorder`) | no | entry <= ~1/3 page; dedup; bottom-up deletion; skip scan support fn |
| Hash | meta page, bucket pages, overflow pages, bitmap pages | `=` only | no (single column) | no | no | yes, always (stores 4-byte hash only) | bitmap + backward scans; foreground splits |
| GiST | balanced tree template (R-tree, etc.) | opclass-defined (Table 65.1) | (not stated here) | no | ordering operators via `distance` (k-NN) | per-opclass via recheck | sorted / buffered builds |
| SP-GiST | non-balanced partitioned trees (quad-tree, k-d tree, radix tree) | opclass-defined (Table 65.2) | INCLUDE columns in leaf tuples | no | `<->` k-NN for point/polygon/box opclasses | per-opclass via recheck | all-the-same tuples, 10-cycle guard |
| GIN | B-tree over keys (entry tree) + posting list / posting tree; pending list | opclass-defined (Table 65.3) | yes (single tree over (column number, key)) | no | no | per-opclass via recheck / GIN_MAYBE | fastupdate, gin_pending_list_limit, gin_fuzzy_search_limit |
| BRIN | per-block-range summaries | per opclass kind | (not stated here) | no | no | yes, always (bitmap scans only) | pages_per_range, autosummarize; `amsummarizing` keeps HOT |

### Support functions per AM
- B-tree (pg_amproc numbers): 1 `order` (required), 2 `sortsupport`, 3 `in_range`, 4 `equalimage`, 5 `options`, 6 `skipsupport`.
- GiST (12): `consistent`, `union`, `compress`*, `decompress`*, `penalty`, `picksplit`, `same`, `distance`* (8th), `fetch`* (9th), `options`* (10th), `sortsupport`* (11th), `translate_cmptype`/`stratnum`* (12th; `FUNCTION 12`). (* optional; five required.)
- SP-GiST (7): `config`, `choose`, `picksplit`, `inner_consistent`, `leaf_consistent` (required); `compress`, `options` (optional).
- GIN: `extractValue`, `extractQuery`, `consistent` and/or `triConsistent` (required); `compare` (falls back to default btree opclass), `comparePartial`, `options` (optional).
- BRIN: `opcInfo` (1), `addValue` (2), `consistent` (3), `unionTuples` (4) required; `options` (5) optional; opclass-family extras at 11–14 (inclusion: 11 merge, 12 mergeable, 13 contained, 14 empty; bloom: 11 hash; minmax-multi: 11 distance).

### Built-in BRIN operator classes (Table 65.4, complete)
- minmax (`=` `<` `<=` `>` `>=`): `bit_minmax_ops`, `bpchar_minmax_ops`, `bytea_minmax_ops`, `char_minmax_ops`, `date_minmax_ops`, `float4_minmax_ops`, `float8_minmax_ops`, `inet_minmax_ops`, `int2_minmax_ops`, `int4_minmax_ops`, `int8_minmax_ops`, `interval_minmax_ops`, `macaddr_minmax_ops`, `macaddr8_minmax_ops`, `name_minmax_ops`, `numeric_minmax_ops`, `oid_minmax_ops`, `pg_lsn_minmax_ops`, `text_minmax_ops`, `tid_minmax_ops`, `timestamp_minmax_ops`, `timestamptz_minmax_ops`, `time_minmax_ops`, `timetz_minmax_ops`, `uuid_minmax_ops`, `varbit_minmax_ops`.
- minmax-multi (`=` `<` `<=` `>` `>=`): `date_minmax_multi_ops`, `float4_minmax_multi_ops`, `float8_minmax_multi_ops`, `inet_minmax_multi_ops`, `int2_minmax_multi_ops`, `int4_minmax_multi_ops`, `int8_minmax_multi_ops`, `interval_minmax_multi_ops`, `macaddr_minmax_multi_ops`, `macaddr8_minmax_multi_ops`, `numeric_minmax_multi_ops`, `oid_minmax_multi_ops`, `pg_lsn_minmax_multi_ops`, `tid_minmax_multi_ops`, `timestamp_minmax_multi_ops`, `timestamptz_minmax_multi_ops`, `time_minmax_multi_ops`, `timetz_minmax_multi_ops`, `uuid_minmax_multi_ops`.
- bloom (`=` only): `bpchar_bloom_ops`, `bytea_bloom_ops`, `char_bloom_ops`, `date_bloom_ops`, `float4_bloom_ops`, `float8_bloom_ops`, `inet_bloom_ops`, `int2_bloom_ops`, `int4_bloom_ops`, `int8_bloom_ops`, `interval_bloom_ops`, `macaddr_bloom_ops`, `macaddr8_bloom_ops`, `name_bloom_ops`, `numeric_bloom_ops`, `oid_bloom_ops`, `pg_lsn_bloom_ops`, `text_bloom_ops`, `tid_bloom_ops`, `timestamp_bloom_ops`, `timestamptz_bloom_ops`, `time_bloom_ops`, `timetz_bloom_ops`, `uuid_bloom_ops`.
- inclusion: `box_inclusion_ops` (`@>` (box,point); `<<` `&<` `&>` `>>` `<@` `@>` `~=` `&&` `<<|` `&<|` `|&>` `|>>` (box,box)); `inet_inclusion_ops` (`<<` `<<=` `>>` `>>=` `=` `&&` (inet,inet)); `range_inclusion_ops` (`=` `<` `<=` `>=` `>` `&&` `@>` `<@` `<<` `>>` `&<` `&>` `-|-` (anyrange,anyrange); `@>` (anyrange,anyelement)).
- No bloom or minmax-multi for `bit`/`varbit`; no minmax-multi for `bpchar`, `bytea`, `char`, `name`, `text`.

### GUCs and storage parameters mentioned in this slice
| Name | Kind | Default / range (as stated in this slice) | Purpose |
|---|---|---|---|
| `geqo_seed` | GUC | (default not stated here) | RNG seed restarted for each GEQO run; fixed => same plan |
| `gin_pending_list_limit` | GUC + per-index storage param | (default not stated here) | pending list size that triggers foreground cleanup |
| `gin_fuzzy_search_limit` | GUC | 0 (no limit); recommended 5000–20000 | soft cap on rows returned by GIN scan (random subset) |
| `fastupdate` | GIN storage param | enabled (can be turned off) | use pending list |
| `deduplicate_items` | B-tree storage param | on | posting-list deduplication |
| `pages_per_range` | BRIN storage param | (default not stated here) | block range size |
| `autosummarize` | BRIN storage param | off | request summarization via autovacuum when next range starts |
| `buffering` | GiST CREATE INDEX param | auto behaviour: buffered when index size reaches `effective_cache_size` (if sorted build impossible) | build method |
| `n_distinct_per_range` | BRIN bloom opclass param | -0.1 (>= -1 if negative; min 16 distinct) | Bloom filter sizing |
| `false_positive_rate` | BRIN bloom opclass param | 0.01 (0.0001–0.25) | Bloom filter sizing |
| `values_per_range` | BRIN minmax-multi opclass param | 32 (8–256) | max values kept per range |
| `maintenance_work_mem` | GUC | — | GIN build very sensitive; ambulkdelete repeat calls |
| `effective_cache_size` | GUC | — | GiST buffered-build switch threshold |
| `check_function_bodies` | GUC | — | PL validators must honor; off in pg_dump restores |
| `seq_page_cost`, `random_page_cost`, `cpu_index_tuple_cost`, `cpu_operator_cost` | GUCs | — | units for amcostestimate |

### Handler pseudo-types and API structs
| Feature | Handler signature | Returns | Struct (header) |
|---|---|---|---|
| Procedural language | `handler()` | `language_handler` | uses `FunctionCallInfoBaseData`; validator `(oid)`; inline `(internal)` -> `InlineCodeBlock` |
| Foreign data wrapper | `handler()` | `fdw_handler` | `FdwRoutine` (`foreign/fdwapi.h`); validator `(text[], oid)` |
| Table sampling method | `method(internal)` | `tsm_handler` | `TsmRoutine` (`access/tsmapi.h`) |
| Table access method | `handler(internal)` | `table_am_handler` | `TableAmRoutine` (`access/tableam.h`), server-lifetime static const |
| Index access method | `handler(internal)` | `index_am_handler` | `IndexAmRoutine` (palloc'd) |
| Custom scan | hooks `set_rel_pathlist_hook`, `set_join_pathlist_hook` | — | `CustomPath` / `CustomScan` / `CustomScanState` with `CustomPathMethods` / `CustomScanMethods` / `CustomExecMethods` |

### Selectivity estimation functions and catalogs named
- `pg_operator.oprrest` (restriction selectivity fn): `scalarltsel` for `<`, `eqsel` for `=`. `pg_operator.oprjoin` (join selectivity fn): `eqjoinsel` for `=`.
- `pg_class.relpages`, `pg_class.reltuples`; `pg_statistic` (superuser-only) / view `pg_stats` (`null_frac`, `n_distinct` (-1 = all unique), `most_common_vals`, `most_common_freqs`, `histogram_bounds`); `pg_statistic_ext`, `pg_statistic_ext_data.stxdmcv`, `pg_mcv_list_items()`.
- Extended statistics kinds: `dependencies`, `ndistinct`, `mcv`.
- BRIN functions: `brin_summarize_new_values(regclass)`, `brin_summarize_range(regclass, bigint)`, `brin_desummarize_range(regclass, bigint)`. GIN: `gin_clean_pending_list`.

## Lesson ideas

### Visualizer ideas
- **B-tree page split cascade**: animate leaf overflow -> half the items move to a new right sibling -> new downlink inserted in parent -> parent overflows -> root split creates a new root one level up. Show sibling links per level (doubly-linked list) and the metapage at block 0. Counter: "% leaf pages" (>99%).
- **"Will it fit?" decision ladder on a full leaf**: (1) simple deletion of LP_DEAD items, (2) bottom-up deletion pass when the incoming tuple is a version-churn duplicate (`indexUnchanged` hint), (3) deduplication pass merging duplicates into posting list tuples, (4) page split. Toggle `deduplicate_items` and HOT vs non-HOT updates.
- **Posting list tuple morph**: three duplicate tuples (key, TID) collapse into one (key, [sorted TIDs]); grey out when type is numeric / float / jsonb / nondeterministic-collation text / INCLUDE index (dedup unsafe list).
- **Version churn timeline**: UPDATE of a non-indexed-by-this-index column creating successor tuples in every index; long-running snapshot blocks deletion; unique index dedup "absorbs" versions.
- **Unique check state machine**: inserter finds a conflicting entry -> branch on deleter/inserter transaction state (own txn deleted / in-progress inserter -> wait / in-progress deleter -> wait / committed -> error after liveness recheck). Second mode for deferrable: `UNIQUE_CHECK_PARTIAL` -> `UNIQUE_CHECK_EXISTING`.
- **Index pin race**: reader, VACUUM, third backend re-using a line pointer; show why the pin on the index page blocks `ambulkdelete`; contrast MVCC snapshot vs SnapshotAny; bitmap scan = no pin.
- **GiST insertion**: descend choosing the least `penalty`, expand bounding boxes with `union`, overflow -> `picksplit` into left/right with `spl_ldatum`/`spl_rdatum`. Search: `consistent` prunes subtrees; k-NN via `distance` lower bounds with a priority queue. Build-mode switcher: sorted (Z-order) vs buffered vs one-by-one.
- **SP-GiST quad-tree vs k-d tree vs radix tree**: inner tuple with prefix (centroid) + 4 nodes; radix tree with node labels = next character and `spgSplitTuple` splitting a prefix; an "all-the-same" tuple with randomly assigned leaves.
- **GIN anatomy**: document -> `extractValue` keys -> entry tree leaf -> posting list that grows and converts to a posting tree; pending list filling up to `gin_pending_list_limit` then flush (foreground spike vs autovacuum). Query: `extractQuery` -> `check[]` vector -> `consistent`/`triConsistent` with GIN_MAYBE. Partial match range scan with `comparePartial` returning <0 / 0 / >0.
- **BRIN range map**: heap strip coloured by block range with min/max; query highlights ranges whose summary is consistent, executor rechecks; slider for `pages_per_range`; outlier row destroying a minmax range vs minmax-multi (`values_per_range`) vs bloom (`false_positive_rate`). Unsummarized tail range and `autosummarize` request firing on first tuple of next range; `brin_desummarize_range`.
- **Hash index**: hash -> mask with `highmask`/`lowmask` -> bucket page; overflow chain growth with duplicates; incremental split of exactly one bucket; bitmap page tracking freed overflow pages; VACUUM squeeze.
- **Selectivity calculator**: histogram bar (10 equal-frequency buckets) with a draggable constant showing `(k + (v - min)/(max - min))/num_buckets`; MCV panel adding `mcv_sel + hist_sel * hist_fraction`; "not in MCV" formula `(1 - sum(mcf))/(n_distinct - num_mcv)`; AND = multiply; join `(1 - nf1)(1 - nf2)/max(rows1, rows2)`. Use the exact tenk1 numbers above as the canned dataset.
- **Extended statistics before/after**: bars of estimated vs actual rows for `a = 1 AND b = 1` (1 -> 100), `GROUP BY a, b` (1000 -> 100), and the MCV item table with `frequency` vs `base_frequency`.
- **GEQO evolution**: join orders as integer strings ('4-1-3-2'), population sorted by cost, steady-state replacement of the worst, edge recombination crossover of two parents, best-so-far tracker, `geqo_seed` reset -> identical run.
- **FDW planning pipeline**: GetForeignRelSize -> GetForeignPaths -> GetForeignPlan -> Begin/Iterate/End; pushed-down qual moving from `scan_clauses` to remote `WHERE col = $1` with `fdw_exprs`; early vs late row locking.
- **OID map**: number line 1–9999 manual, 8000–9999 dev, 10000–11999 genbki, <12000 pinned, 12000–16383 initdb, >=16384 user objects.

### Playground SQL (PGlite / PG 18; not executed while writing these notes — verify before shipping)
```sql
-- Histogram / MCV arithmetic on a tenk1-like table
CREATE TABLE tenk AS
SELECT i AS unique1, (i * 7919) % 10000 AS unique2, i % 100 AS hundred,
       chr(65 + i % 26) || chr(65 + (i / 26) % 26) || 'AAAA' AS stringu1
FROM generate_series(0, 9999) i;
CREATE INDEX tenk_unique1 ON tenk (unique1);
ANALYZE tenk;
SELECT relpages, reltuples FROM pg_class WHERE relname = 'tenk';
SELECT null_frac, n_distinct, most_common_vals, most_common_freqs, histogram_bounds, correlation
FROM pg_stats WHERE tablename = 'tenk' AND attname IN ('unique1', 'stringu1', 'hundred');
EXPLAIN SELECT * FROM tenk WHERE unique1 < 1000;
EXPLAIN SELECT * FROM tenk WHERE unique1 < 1000 AND stringu1 = 'xxx';
SELECT oprname, oprrest, oprjoin FROM pg_operator
WHERE oprname IN ('<', '=') AND oprleft = 'int4'::regtype AND oprright = 'int4'::regtype;

-- Extended statistics (exact example from the docs)
CREATE TABLE t (a INT, b INT);
INSERT INTO t SELECT i % 100, i % 100 FROM generate_series(1, 10000) s(i);
ANALYZE t;
EXPLAIN (ANALYZE, TIMING OFF, BUFFERS OFF) SELECT * FROM t WHERE a = 1 AND b = 1;
CREATE STATISTICS stts (dependencies, ndistinct) ON a, b FROM t;
ANALYZE t;
EXPLAIN (ANALYZE, TIMING OFF, BUFFERS OFF) SELECT * FROM t WHERE a = 1 AND b = 1;
EXPLAIN (ANALYZE, TIMING OFF, BUFFERS OFF) SELECT COUNT(*) FROM t GROUP BY a, b;
DROP STATISTICS stts;
CREATE STATISTICS stts2 (mcv) ON a, b FROM t;
ANALYZE t;
SELECT m.* FROM pg_statistic_ext JOIN pg_statistic_ext_data ON (oid = stxoid),
       pg_mcv_list_items(stxdmcv) m WHERE stxname = 'stts2';
EXPLAIN (ANALYZE, TIMING OFF, BUFFERS OFF) SELECT * FROM t WHERE a <= 49 AND b > 49;

-- B-tree deduplication: posting list tuples via pageinspect
CREATE EXTENSION IF NOT EXISTS pageinspect;
CREATE TABLE dup (k int);
INSERT INTO dup SELECT i % 10 FROM generate_series(1, 5000) i;
CREATE INDEX dup_dedup ON dup (k);
CREATE INDEX dup_nodedup ON dup (k) WITH (deduplicate_items = off);
SELECT pg_relation_size('dup_dedup') AS dedup, pg_relation_size('dup_nodedup') AS nodedup;
SELECT * FROM bt_metap('dup_dedup');
SELECT itemoffset, ctid, itemlen, htid, tids[1:3] FROM bt_page_items('dup_dedup', 1) LIMIT 5;

-- AM capability flags from pg_am / property functions
SELECT amname, amhandler, amtype FROM pg_am;
SELECT a.amname, p.name, pg_indexam_has_property(a.oid, p.name)
FROM pg_am a, unnest(ARRAY['can_order','can_unique','can_multi_col','can_exclude','can_include']) p(name)
WHERE a.amtype = 'i';

-- GIN fastupdate / pending list
CREATE TABLE docs (id serial, tags int[]);
CREATE INDEX docs_gin ON docs USING gin (tags) WITH (fastupdate = on);
INSERT INTO docs (tags) SELECT ARRAY[i % 50, i % 7] FROM generate_series(1, 2000) i;
SELECT * FROM gin_metapage_info(get_raw_page('docs_gin', 0));   -- n_pending_pages / n_pending_tuples
SELECT gin_clean_pending_list('docs_gin');
EXPLAIN SELECT * FROM docs WHERE tags @> ARRAY[3];

-- BRIN ranges, summarization
CREATE TABLE ev (ts timestamptz, v int);
INSERT INTO ev SELECT now() + (i || ' sec')::interval, i FROM generate_series(1, 50000) i;
CREATE INDEX ev_brin ON ev USING brin (ts) WITH (pages_per_range = 8);
SELECT * FROM brin_page_items(get_raw_page('ev_brin', 2), 'ev_brin') LIMIT 5;
INSERT INTO ev SELECT now(), i FROM generate_series(1, 20000) i;   -- new unsummarized ranges
SELECT brin_summarize_new_values('ev_brin');
CREATE INDEX ev_bloom ON ev USING brin (v int4_bloom_ops (false_positive_rate = 0.05));
CREATE INDEX ev_mm ON ev USING brin (v int4_minmax_multi_ops (values_per_range = 16));

-- Hash index pages
CREATE TABLE h (u uuid);
INSERT INTO h SELECT gen_random_uuid() FROM generate_series(1, 5000);
CREATE INDEX h_hash ON h USING hash (u);
SELECT * FROM hash_metapage_info(get_raw_page('h_hash', 0));
SELECT hash_page_type(get_raw_page('h_hash', 1));

-- GiST k-NN and SP-GiST opclass choice
CREATE TABLE pts AS SELECT point(random() * 100, random() * 100) p FROM generate_series(1, 5000);
CREATE INDEX pts_gist ON pts USING gist (p);
CREATE INDEX pts_kd ON pts USING spgist (p kd_point_ops);
EXPLAIN SELECT * FROM pts ORDER BY p <-> point(50, 50) LIMIT 5;

-- Pinned OIDs and leakproof operators
SELECT oid, relname FROM pg_class WHERE oid < 12000 ORDER BY oid LIMIT 5;
SELECT o.oprname, p.proname, p.proleakproof FROM pg_operator o JOIN pg_proc p ON p.oid = o.oprcode
WHERE o.oprname = '=' LIMIT 10;

-- file_fdw touches the FDW callback path
CREATE EXTENSION IF NOT EXISTS file_fdw;
SELECT fdwname, fdwhandler::regproc, fdwvalidator::regproc FROM pg_foreign_data_wrapper;
```

### Pitfalls the docs explicitly warn about (with documented fix)
- B-tree entry larger than about one-third of a page cannot be indexed -> (hash index stores only a 4-byte hash and has no size restriction).
- Putting `float8` and `numeric` in one btree opfamily breaks transitivity -> keep families law-abiding; casts between member types must preserve ordering.
- Deduplication silently unavailable for numeric, float4/float8, jsonb, char(n), nondeterministic-collation text/varchar, container types, and any INCLUDE index -> expect larger indexes; nothing to tune.
- Write-heavy unique-ish data pays a small fixed dedup overhead -> `deduplicate_items = off` selectively (rarely worth it).
- Bottom-up deletion gives no age guarantee -> VACUUM is still required; long-running snapshots block cleanup.
- `indexUnchanged` is only a hint (false positives and negatives) -> AMs must not treat it as authoritative.
- Multi-column index AMs must index NULLs in non-first columns; `amoptionalkey` AMs must index all NULLs -> otherwise wrong results for unrestricted scans.
- `amgetbitmap` scans are safe only with MVCC snapshots (no index pin).
- AM without `ampredlocks` => whole-index predicate lock under SERIALIZABLE => more serialization failures.
- GIN: slow single-row inserts -> keep `fastupdate` on, or drop/recreate the index for bulk loads; large pending list slows every search and one unlucky insert pays the flush -> tune autovacuum / `gin_pending_list_limit`, or `fastupdate = off` for consistent latency.
- GIN build is very sensitive to `maintenance_work_mem` -> raise it for index creation.
- GIN operators assumed strict; `GIN_SEARCH_MODE_ALL` is a near full-index scan.
- Frequent-word full-text queries returning huge sets -> `gin_fuzzy_search_limit` (5000–20000), result is a random subset.
- GiST `inet_ops` is not the default opclass -> name it explicitly in CREATE INDEX.
- GiST build without `sortsupport` on large unordered data -> buffered build (default switch at `effective_cache_size`); turn `buffering` off for already-ordered input.
- GiST lossy `compress` => no index-only scans; do not define `fetch`. `distance` must never over-estimate; do not return infinities.
- SP-GiST values larger than a page are rejected unless the opclass sets `longValuesOK`; picksplit that cannot separate values yields all-the-same tuples.
- BRIN: new ranges stay unsummarized until VACUUM / `autosummarize` / `brin_summarize_*`; autosummarize requests can be dropped when the queue is full (LOG message) -> run the function or vacuum. Stale wide summaries after value changes -> `brin_desummarize_range` then re-summarize.
- BRIN is only useful when the column correlates with physical order; outliers ruin minmax -> minmax-multi; equality on uncorrelated values -> bloom opclass.
- Hash index: many duplicates => long overflow chains (worse than B-tree) -> use for unique/near-unique data or exclude hot values with a partial index; index never shrinks -> `REINDEX`; bucket splits run in the foreground -> poor fit for rapidly growing tables; no unique, no multi-column, no range queries.
- Planner independence assumption underestimates correlated predicates (1 vs 100 rows) and overestimates GROUP BY groups (1000 vs 100) -> `CREATE STATISTICS (dependencies | ndistinct | mcv)` + ANALYZE.
- EXPLAIN join row count is not outer rows × inner-scan rows; it is `outer × inner_total × selectivity` computed before plan choice.
- Statistics are ignored (default estimates) when the user lacks SELECT on the table/columns and the operator is not LEAKPROOF — typical with security-barrier views -> use leakproof operators or test as a privileged user.
- GEQO plans are non-deterministic across parameter changes -> fix `geqo_seed`; vary it to explore.
- FDW: clauses removed from the plan qual list must be in `fdw_recheck_quals` or handled by `RecheckForeignScan` (READ COMMITTED correctness); `ON CONFLICT DO UPDATE` (and any conflict target) unsupported on foreign tables; rows violating declared constraints can make the planner produce wrong results; early locking may over-lock, default EPQ copies whole rows through joins (slower hash/merge joins).
- FDW `Exec*` callbacks must return a slot on success or the reported row count is wrong; direct-modify must increment row counts itself.
- PL validator must honor `check_function_bodies` (off during pg_dump restore) and call `CheckFunctionValidatorAccess()` first; handler must not assume validation happened.
- Table AM: tuples need (block, item) TIDs to support indexes/modifications; bitmap scans need block-number locality.
- Catalog structs: variable-length/nullable columns must be last and behind `#ifdef CATALOG_VARLEN`; never hardcode numeric OIDs; OIDs 10000–16383 are not stable across installations.
- Error messages: never `strerror(errno)` inside ereport args (use `%m`); `elog` only for internal errors; do not assemble sentences at run time or hand-roll plurals.
- Backup manifest `Last-Modified` is informational only; manifest must be UTF-8 (non-UTF-8 paths use `Encoded-Path`).

