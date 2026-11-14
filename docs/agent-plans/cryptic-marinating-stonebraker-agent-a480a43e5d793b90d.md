# Plan: finish slice F (Part IV Client Interfaces, idx 301-433)

## Context
Task: read every page of slice F in the rendered PostgreSQL 18.7 docs and distil it into
`/Users/vivek-14286/postgres-internals/curriculum/research/F-client-interfaces.md`, following
`/Users/vivek-14286/postgres-internals/curriculum/research/_BRIEF.md` (ledger, notes by topic,
complete inventories, lesson ideas; roughly 600-1500 lines).

Plan mode was switched on part-way through, so work stopped before the output file was created.

## State when plan mode began

Source dir: `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/pgdocs/`

| Range | Pages | Status |
|---|---|---|
| 301-339 (Part IV intro, all of ch.32 libpq, ch.33 Large Objects, ECPG 34.1-34.7) | 39 | Read in full; notes saved |
| 340-366 (ECPG 34.8-34.17 incl. the 17 embedded SQL command pages, Informix/Oracle modes, internals) | 27 | Read in full; notes NOT yet saved (only in the interrupted session's context) |
| 367-433 (ch.35 Information Schema, 35.1-35.66) | 67 | Not read |

Saved note fragments (already in the brief's "Notes by topic" format, tagged with modules):
`/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/F/n01.md` through `n08.md`

- n01: connection functions, connection strings/URIs, multi-host, every connection parameter keyword
- n02: status functions, PQexec family, result accessors, escaping, async processing
- n03: pipeline mode, single-row/chunked mode, cancel, fast-path, LISTEN/NOTIFY, COPY
- n04: control functions, misc, notice processing, event system, env vars, .pgpass, service file, LDAP
- n05: SSL (incl. Table 32.1/32.2), OAuth, threading, building
- n06: example programs, large objects (concepts, client API, server functions)
- n07: ECPG concept/connections/commands, host variables + Table 34.1, indicators, dynamic SQL
- n08: pgtypes library, descriptor areas (named + SQLDA structs)

The final output file does not exist yet.

## Remaining steps

1. Re-read idx 340-366 and write notes n09 (compact but complete, per the brief's ECPG guidance):
   WHENEVER conditions/actions, `sqlca` struct, full SQLCODE -> SQLSTATE table, preprocessor
   directives (INCLUDE search order, DEFINE/UNDEF, ifdef nesting limit 127), build commands,
   `ECPGdebug`/`ECPGget_PGconn`/`ECPGtransactionStatus`/`ECPGstatus`, LO via libpq, C++ caveats,
   one-line synopsis for each of the 17 embedded SQL commands, Informix mode (structs, function
   list, error constants -1200..-1264), Oracle mode (3 behaviours), `ECPGdo` argument layout.
2. Read idx 367-433 in order, in full, and write notes n10+:
   schema/search-path rules, the 5 information_schema data types, and for each of the 64 views
   its purpose, key columns, and visibility rule (owner / privilege / enabled-role filters),
   plus documented PostgreSQL deviations (columns that are always null, features not applicable).
3. Assemble `F-client-interfaces.md`:
   - `# F — Part IV Client Interfaces`
   - `## Coverage ledger`: one row per page, 301-433 (133 rows)
   - `## Notes by topic`: n01..n10+ concatenated
   - `## Complete inventories`: all libpq connection keywords with default and env var; all
     `PG*` env vars; `ExecStatusType`, `ConnStatusType`, `PGTransactionStatusType`,
     `PGpipelineStatus`, `PGPing` values; `PG_DIAG_*` fields; libpq function index by section;
     sslmode table; `target_session_attrs` modes; LO client + server functions; ECPG commands,
     SQLCODEs, type map; every information_schema view with purpose
   - `## Lesson ideas`: visualizers (connection state machine, multi-host/target_session_attrs/
     load balancing, sslmode ladder, pipeline queue with error/sync, single-row mode, COPY state
     flow, LO chunks/sparse storage), PGlite playground SQL (information_schema queries,
     `lo_from_bytea`/`lo_put`/`lo_get`, LISTEN/NOTIFY, PREPARE/EXECUTE), documented pitfalls
     with fixes
4. Verify: `wc -l` within the 600-1500 line target; ledger has exactly 133 rows matching
   `_order.tsv` idx 301-433; spot-check a few defaults against the source text.
5. Report back: output path, pages read, five most lesson-worthy findings.

## Note for whoever resumes
Shell output is capped at about 30 KB per call, so read large pages in byte ranges
(`head -c` / `tail -c +N`) and strip blank lines with `grep -v '^$'`. In zsh, do not use
`echo =====` as a separator (it is parsed as command expansion and fails).
