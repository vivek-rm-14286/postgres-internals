# Plan: finish Slice D research notes (PostgreSQL 18.7 docs, Part III ch.16-23)

## Context

Slice D of the docs-distillation effort covers `_order.tsv` idx 171-247 (77 pages): Installation, Server Setup and
Operation, Server Configuration (all of ch.19), Client Authentication, Database Roles, Managing Databases, Localization.
The brief (`/Users/vivek-14286/postgres-internals/curriculum/research/_BRIEF.md`) requires every page to be read in
full and distilled into one markdown file with a coverage ledger, notes by topic, complete inventories and lesson ideas.
Plan mode was activated mid-task, so writing stopped part-way. This plan records the exact state and the remaining steps.

Output file: `/Users/vivek-14286/postgres-internals/curriculum/research/D-server-setup-config-auth-roles.md`
Source pages: `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/pgdocs/`
Helper already in place: `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/dwork/add.py`
(takes a chunk file: ledger rows, a `====` line, then notes; inserts rows before the `<!--LEDGER-END-->` marker and
appends the notes).

## Current state (761 lines written)

Done and persisted in the output file (ledger rows + notes), idx 171-205, 35 pages:
- ch.16-17 installation (requirements, configure/meson options, blocksize/segsize/wal-blocksize constants, platforms)
- ch.18 server setup: initdb/cluster, starting, kernel resources (Table 18.1, semaphores, RemoveIPC, OOM, huge pages),
  shutdown modes, upgrading, spoofing, encryption, SSL, GSSAPI enc, SSH tunnels, event log
- 19.1 setting parameters, 19.2 file locations
- GUC inventory tables for 19.3 connections/auth/SSL, 19.4 resources, 19.5 WAL, 19.6 replication, 19.7 planner
  (all enable_* flags, cost constants, GEQO), 19.8 logging, 19.9 statistics, 19.10 vacuum, 19.11 client defaults

Read but notes NOT yet written, idx 206-210 and 212 (6 pages; must be re-read if context is lost):
- runtime-config-locks, runtime-config-compatible, runtime-config-error-handling, runtime-config-preset,
  runtime-config-custom, runtime-config-short

Not yet read, 36 pages:
- idx 211 runtime-config-developer (19.4K chars)
- idx 213-229 ch.20 client authentication (pg_hba.conf, user name maps, every auth method, OAuth, problems)
- idx 230-236 ch.21 roles (attributes, membership, dropping, predefined roles, function security)
- idx 237-243 ch.22 databases (templates, config, dropdb, tablespaces)
- idx 244-247 ch.23 localization (locale, collation, character sets)

## Remaining steps

1. Write chunk c5 for idx 206-212: GUC tables for 19.12 lock management (deadlock_timeout 1s,
   max_locks_per_transaction 64, max_pred_locks_per_transaction 64, max_pred_locks_per_relation -2,
   max_pred_locks_per_page 2), 19.13 compatibility, 19.14 error handling, 19.15 preset options (block_size 8192,
   segment_size, wal_segment_size 16MB, max_identifier_length 63, max_index_keys 32, max_function_args 100 ...),
   19.16 custom options, 19.17 developer options (after reading idx 211), Table 19.6 short options.
2. Read idx 213-229 in full; write chunk c6: pg_hba.conf record formats and field rules, complete auth-method
   inventory with options, pg_ident.conf maps, password/SCRAM/MD5 details, OAuth, error messages.
3. Read idx 230-236; write chunk c7: role attributes inventory, membership/inheritance (INHERIT, SET, ADMIN options),
   dropping roles procedure, complete predefined-roles inventory, function security.
4. Read idx 237-243; write chunk c8: database overview, CREATE DATABASE, template0 vs template1, per-database config,
   DROP DATABASE, tablespaces (pg_default, pg_global, symlinks in pg_tblspc).
5. Read idx 244-247; write chunk c9: locale categories, providers (libc, ICU, builtin), collation rules and
   nondeterministic collations, complete server character-set table and client/server conversions.
6. Final restructure of the output file (single Python pass):
   - move every `### INV:` section out of "Notes by topic" into a new `## Complete inventories` section;
   - add inventories for auth methods, role attributes, predefined roles, encodings;
   - add `## Lesson ideas` (visualizers, PGlite playground SQL, documented pitfalls with fixes);
   - remove the `<!--LEDGER-END-->` marker and confirm the ledger has exactly 77 rows (171-247).
7. Hand back: output path, pages read, five most lesson-worthy findings.

## Items to flag in the final notes

- `output_plugin_libraries` (default `'pgoutput, test_decoding'`) appears in the 18.7 text of 19.6.1; recorded as the
  docs state it.
- Docs inconsistency: 18.4.1 says semaphores are counted per `autovacuum_worker_slots`, while the 19.15
  `num_os_semaphores` entry says `autovacuum_max_workers`. Both wordings should be recorded, not reconciled.
- Several GUC entries give no context sentence (e.g. `wal_init_zero`, `wal_recycle`, `wal_skip_threshold`,
  `recovery_prefetch`, `file_extend_method`); the tables mark these "(not stated)" rather than guessing.

## Verification

- `grep -c '^| 1[7-9][0-9] \|^| 2[0-4][0-9] ' <output>` style check that the ledger holds 77 rows, idx 171-247 with no gaps.
- Spot-check 10 GUC defaults in the tables against the source pages (e.g. `grep -n 'The default' pgdocs/runtime-config-*.txt`).
- Confirm every GUC name heading in the ch.19 pages (`grep -hoE '^[a-zA-Z_]+ \((boolean|integer|string|enum|floating point|timestamp|pg_lsn)\) #'`)
  appears in the output file; report any missing names.
- Line count within the brief's 600-1500 target, or note the overage caused by the complete ch.19 inventory.
