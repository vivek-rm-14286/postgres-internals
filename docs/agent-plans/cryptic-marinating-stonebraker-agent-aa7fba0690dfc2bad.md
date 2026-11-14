# Plan: finish slice K (Part VI Reference: client + server applications)

## Status when plan mode started

- All 37 pages of the slice (idx 788-824) have been read in full from
  `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/pgdocs/`
  (blank-stripped working copies are in `.../scratchpad/K/`).
- Output file `/Users/vivek-14286/postgres-internals/curriculum/research/K-client-server-apps.md`
  exists, 501 lines. It currently holds the title, a "work in progress" line, and a complete
  `## Notes by topic` section covering every program in the slice.
- Still missing from the output file (required by `_BRIEF.md`):
  1. `## Coverage ledger` (one row per page, 37 rows)
  2. `## Complete inventories`
  3. `## Lesson ideas`
  4. Section order fix: the brief wants ledger first, then notes, inventories, lesson ideas.
     The "work in progress" line must be removed.

No other files were changed. Nothing outside the output file and the scratchpad was touched.

## Remaining steps (all are edits to the one output file)

### 1. Coverage ledger (insert directly under the H1, replacing the "work in progress" line)
Table `| idx | file | one-line summary |`, 37 rows in `_order.tsv` order:
788 reference-client, 789 app-clusterdb, 790 app-createdb, 791 app-createuser, 792 app-dropdb,
793 app-dropuser, 794 app-ecpg, 795 app-pgamcheck, 796 app-pgbasebackup, 797 pgbench,
798 app-pgcombinebackup, 799 app-pgconfig, 800 app-pgdump, 801 app-pg-dumpall, 802 app-pg-isready,
803 app-pgreceivewal, 804 app-pgrecvlogical, 805 app-pgrestore, 806 app-pgverifybackup, 807 app-psql,
808 app-reindexdb, 809 app-vacuumdb, 810 reference-server, 811 app-initdb, 812 pgarchivecleanup,
813 app-pgchecksums, 814 app-pgcontroldata, 815 app-pgcreatesubscriber, 816 app-pg-ctl,
817 app-pgresetwal, 818 app-pgrewind, 819 pgtestfsync, 820 pgtesttiming, 821 pgupgrade,
822 pgwaldump, 823 app-pgwalsummary, 824 app-postgres.

### 2. Complete inventories (append after the notes)
- **Program inventory**: one row per program (35 programs: 21 client, 14 server) with
  kind (client/server), what it wraps or talks to (SQL command, replication protocol, offline data
  directory), whether the server must be running or stopped, and module tags.
- **psql meta-commands**: every command from the page, one line each. Groups: general/buffer
  (`\a \C \cd \copyright \e \ef \ev \echo \qecho \warn \g \gx \gdesc \gexec \gset \h \i \ir \o \p \q \r
  \s \w \watch \! \? \;`), connection (`\c \conninfo \encoding \password`), variables/env
  (`\set \unset \prompt \getenv \setenv`), conditionals (`\if \elif \else \endif`), formatting
  (`\pset \f \H \t \T \x \timing \errverbose`), COPY and large objects (`\copy \lo_export \lo_import
  \lo_list \lo_unlink`), extended protocol and pipeline (`\bind \bind_named \parse \close_prepared
  \startpipeline \sendpipeline \syncpipeline \endpipeline \flushrequest \flush \getresults`),
  restricted mode (`\restrict \unrestrict`), crosstab (`\crosstabview`), source (`\sf \sv`), and the
  full `\d` family (`\d \da \dA \dAc \dAf \dAo \dAp \db \dc \dconfig \dC \dd \dD \ddp \dE \di \dm \ds
  \dt \dv \des \det \deu \dew \df \dF \dFd \dFp \dFt \dg \dl \dL \dn \do \dO \dp \dP \drds \drg \dRp
  \dRs \dT \du \dx \dX \dy \l \z`) with allowed modifiers.
- **psql `\pset` options** with defaults: border, columns, csv_fieldsep, expanded, fieldsep,
  fieldsep_zero, footer, format (aligned, asciidoc, csv, html, latex, latex-longtable, troff-ms,
  unaligned, wrapped), linestyle (ascii, old-ascii, unicode), null, numericlocale, pager,
  pager_min_lines, recordsep, recordsep_zero, tableattr, title, tuples_only,
  unicode_border_linestyle, unicode_column_linestyle, unicode_header_linestyle, xheader_width.
- **psql special variables** with defaults: AUTOCOMMIT, COMP_KEYWORD_CASE, DBNAME, ECHO,
  ECHO_HIDDEN, ENCODING, ERROR, FETCH_COUNT, HIDE_TABLEAM, HIDE_TOAST_COMPRESSION, HISTCONTROL,
  HISTFILE, HISTSIZE, HOST, IGNOREEOF, LASTOID, LAST_ERROR_MESSAGE, LAST_ERROR_SQLSTATE,
  ON_ERROR_ROLLBACK, ON_ERROR_STOP, PIPELINE_COMMAND_COUNT, PIPELINE_RESULT_COUNT,
  PIPELINE_SYNC_COUNT, PORT, PROMPT1/2/3, QUIET, ROW_COUNT, SERVER_VERSION_NAME,
  SERVER_VERSION_NUM, SERVICE, SHELL_ERROR, SHELL_EXIT_CODE, SHOW_ALL_RESULTS, SHOW_CONTEXT,
  SINGLELINE, SINGLESTEP, SQLSTATE, USER, VERBOSITY, VERSION, VERSION_NAME, VERSION_NUM,
  WATCH_INTERVAL.
- **Exit-status table** for psql, pg_isready, pgbench, pg_ctl status, pg_checksums,
  pg_receivewal/pg_recvlogical.
- **Shutdown modes vs signals** (pg_ctl -m smart/fast/immediate ↔ SIGTERM/SIGINT/SIGQUIT).
- **Dump format capability matrix** (plain/custom/directory/tar × compression, parallel dump,
  parallel restore, reorder, restore tool).
- **File-copy modes** shared by pg_upgrade and pg_combinebackup (copy, link, clone,
  copy-file-range, swap) with platform limits.
- **pgbench** built-in scripts, init steps, automatic variables, meta-commands, functions, operators
  (already in the notes; list them compactly here).
- **Environment variables** per tool, and **default numbers** (ports 5432 / 50432, timeouts,
  WAL segment size 16 MB, pg_ctl 60 s, pg_isready 3 s, status interval 10 s, `\watch` 2 s,
  HISTSIZE 500, pgbench defaults).
- **pg_resetwal safe-value formulas** (pg_xact × 0x100000, multixact offsets × 0x10000,
  members × 0xCC80).

### 3. Lesson ideas (append last)
- Visualizer ideas tied to the notes: pg_dump parallel-dump lock protocol (ACCESS SHARE + NOWAIT);
  pg_rewind block-level resync on a forked timeline; pg_createsubscriber's 11 steps;
  pg_basebackup stream vs fetch WAL; incremental backup chain + pg_combinebackup;
  pg_verifybackup's four stages; shutdown modes; pg_upgrade transfer modes; psql prompt `%x`
  transaction-state indicator; pgbench Poisson rate schedule and schedule lag; pg_receivewal
  start-point algorithm; pg_resetwal SLRU-file arithmetic.
- Playground SQL for PGlite only where it genuinely maps (no shell tools run in PGlite): the SQL
  each wrapper emits (CREATE DATABASE/ROLE, VACUUM options, REINDEX), amcheck functions behind
  pg_amcheck (`bt_index_check`, `bt_index_parent_check`, `verify_heapam`), pg_walinspect as the
  SQL analogue of pg_waldump, `pg_control_*()` as the analogue of pg_controldata, the pgbench
  TPC-B-like schema and transaction by hand, `pg_export_snapshot()` for the pg_dump --snapshot
  idea. Each snippet will be marked as an analogue, since none of these binaries exist in PGlite.
- Documented pitfalls with fixes (dump/restore executes source superuser code; pg_receivewal as
  sync standby under remote_apply; `-X fetch` vs wal_keep_size; link-mode revert rules; pg_resetwal
  as last resort; checksum state across replicas; `--analyze-in-stages` on a database that already
  has stats; `-c` single-transaction semantics; tab completion after BEGIN; `trust` default auth).

### 4. Final check and hand-back
- Confirm section order and that the file is within the brief's 600-1500 line target
  (expected roughly 800-900 lines).
- Hand back: output path, pages read (37), five most lesson-worthy findings.

## Verification
- `grep -c '^| 7\|^| 8' <output>` style count to confirm 37 ledger rows.
- Spot-check five inventory entries against the source pages (e.g. `\dconfig` default behaviour,
  pg_ctl default mode `fast`, initdb checksums default on, pg_isready exit codes, `--wal-segsize`
  bounds).
