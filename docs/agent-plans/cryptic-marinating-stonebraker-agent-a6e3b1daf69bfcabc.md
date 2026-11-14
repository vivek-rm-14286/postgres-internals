# Plan: finish slice G research notes

Output file: `/Users/vivek-14286/postgres-internals/curriculum/research/G-extending-triggers-rules-logical-decoding.md`

## State when plan mode started
- All 60 pages of the slice (idx 434-474 and 584-602) have been read in full.
- The output file has 550 lines: title, a `<!--LEDGER-->` placeholder under `## Coverage ledger`, and `## Notes by topic` covering ch.36 (all 18 sections), ch.37, ch.38, ch.39, ch.40, and ch.47 sections 47.1-47.7.
- Not yet written: notes for 47.8-47.10, ch.48, ch.49, ch.50; the coverage ledger table; `## Complete inventories`; `## Lesson ideas`.

## Remaining steps (all are appends/edits to the output file only)

### 1. Append the remaining topic notes (facts already extracted from the pages)

**Synchronous replication support for logical decoding [M7, M5] (logicaldecoding-synchronous.txt)**
- Works with the same UI as streaming sync replication, but only over the streaming replication interface; clients must send `Standby status update (F)` messages.
- A logical sync replica is scoped to one database while `synchronous_standby_names` is server-wide, so it does not work properly if more than one database is actively used.
- Deadlock caveat: decoding can lock catalog tables, so a transaction holding an exclusive lock on [user] catalog tables can deadlock. Triggers: explicit `LOCK` on `pg_class`; `CLUSTER` on `pg_class`; `PREPARE TRANSACTION` after `LOCK` on `pg_class` with two-phase decoding; `PREPARE TRANSACTION` after `CLUSTER` on `pg_trigger` with two-phase decoding (only when a published table has a trigger); `TRUNCATE` on a [user] catalog table. Applies to other catalog tables too.

**Streaming of large in-progress transactions [M7] (logicaldecoding-streaming.txt)**
- Basic callbacks (`begin_cb`, `change_cb`, `commit_cb`, `message_cb`) are invoked only when the transaction commits; changes are decoded incrementally (may spill to disk) but transmitted at commit, discarded on abort, which increases apply lag for big transactions.
- Streaming callbacks: required `stream_start_cb`, `stream_stop_cb`, `stream_abort_cb`, `stream_commit_cb`, `stream_change_cb`; optional `stream_message_cb`, `stream_truncate_cb`.
- Changes go out in blocks delimited by `stream_start_cb` / `stream_stop_cb`; finish with `stream_commit_cb` or `stream_abort_cb`; with two-phase, `stream_prepare_cb` then `commit_prepared_cb` or `rollback_prepared_cb`. Include the documented example call sequence.
- Trigger: total decoded changes for all in-progress transactions exceed `logical_decoding_work_mem`; the largest top-level transaction by memory is selected and streamed. Spill to disk can still happen when the tuple is incomplete (toast insert decoded but not the main-table insert).
- Changes are still applied in commit order.

**Two-phase commit support [M7] (logicaldecoding-two-phase-commits.txt)**
- Without the extra callbacks: `PREPARE TRANSACTION` ignored, `COMMIT PREPARED` decoded as COMMIT, `ROLLBACK PREPARED` as ROLLBACK.
- Required: `begin_prepare_cb`, `prepare_cb`, `commit_prepared_cb`, `rollback_prepared_cb`, `stream_prepare_cb`; optional `filter_prepare_cb` (match on gid or look up by xid).
- With them, changes are decoded and passed at PREPARE time and `prepare_cb` is invoked.
- Cautions: decoding a prepare can block until the main transaction commits if it holds exclusive locks on [user] catalog tables; distributed 2PC built on this can deadlock for the same reason.

**Replication progress tracking / origins [M7] (replication-origins.txt)**
- Solves safe progress tracking and origin-based behaviour (loop prevention in bidirectional setups).
- An origin has a name (free-form text, used across systems, prefix with the solution name) and an ID (space-efficient, never shared across systems).
- Functions: `pg_replication_origin_create()`, `pg_replication_origin_drop()`, `pg_replication_origin_session_setup()`, `pg_replication_origin_xact_setup()` (LSN + commit timestamp per source transaction), `pg_replication_origin_progress()`, `pg_replication_origin_session_progress()`. Catalog `pg_replication_origin`; view `pg_replication_origin_status`.
- Progress persists crash-safely; the naive per-transaction row update has run-time overhead and bloat.
- Changes produced by a session set up this way are tagged with its origin; `filter_by_origin_cb` filters more efficiently than doing it in the plugin.

**Archive modules [M7] (archive-modules.txt, archive-module-init.txt, archive-module-callbacks.txt)**
- Alternative to `archive_command`, configured via `archive_library`; the server keeps WAL files until the module reports success. Example `contrib/basic_archive`. Modules may also declare GUCs and register background workers.
- `_PG_archive_module_init` returns a server-lifetime `const ArchiveModuleCallbacks *` with `startup_cb`, `check_configured_cb`, `archive_file_cb`, `shutdown_cb`; only `archive_file_cb` is required.
- `void startup_cb(ArchiveModuleState *state)` (state in `state->private_data`); `bool check_configured_cb(state)` (false => `WARNING: archive_mode enabled, yet archiving is not configured`, retried periodically; `arch_module_check_errdetail` adds a DETAIL line); `bool archive_file_cb(state, const char *file, const char *path)` (true => file may be recycled/removed; false or error => kept and retried; runs in a short-lived memory context reset between calls); `void shutdown_cb(state)` (archiver exit or `archive_library` change).

**OAuth validator modules [M6, M1] (oauth-validators.txt, oauth-validator-design.txt, oauth-validator-init.txt, oauth-validator-callbacks.txt)**
- New server-side validation of OAuth bearer tokens; the server cannot check tokens itself. A faulty validator may be worse than no authentication.
- Three responsibilities: validate the token (online via Token Introspection, one network call per attempt within `authentication_timeout`, central revocation; or offline via signing keys, checking issuer, audience, validity period, no central revocation); authorize the client (scopes covering database access for the HBA parameters); authenticate the end user (identifier returned to the server, visible as `system_user`, logged with `log_connections`).
- Coding guidelines: never log tokens; authenticate the peer and use strong transport security; log at `COMMERROR` and return normally rather than ERROR/FATAL; stay interruptible (`WaitLatchOrSocket()`, `WaitEventSetWait()`, `CHECK_FOR_INTERRUPTS()`); negative testing mandatory; document the authn ID format and whether `delegate_ident_mapping=1` is safe.
- Usermap delegation: HBA option `delegate_ident_mapping` bypasses `pg_ident.conf` mapping; the module decides authorization; authentication becomes optional (anonymous/pseudonymous access); single point of failure. Footnote: libpq's Device Authorization flow usually does not count as a trusted client.
- Loaded on demand from `oauth_validator_libraries`; `_PG_oauth_validator_module_init` returns `const OAuthValidatorCallbacks *` { `uint32 magic` (= `PG_OAUTH_VALIDATOR_MAGIC`), `startup_cb`, `shutdown_cb`, `validate_cb` }; only `validate_cb` required.
- `bool validate_cb(const ValidatorModuleState *state, const char *token, const char *role, ValidatorModuleResult *result)`; `ValidatorModuleResult { bool authorized; char *authn_id; }`. Connection proceeds only if `authorized` is true; `authn_id` palloc'd or NULL; returning false = internal error. Normally `authn_id` must exactly match the role (modifiable with a usermap); with `delegate_ident_mapping` no check is made.

### 2. Replace `<!--LEDGER-->` with the coverage table
One row per page, 60 rows, `| idx | file | one-line summary |`, in `_order.tsv` order (434-474, 584-602).

### 3. Append `## Complete inventories`
- Polymorphic pseudo-types (11, Table 36.1) with family.
- SQL type -> C type table (Table 36.2, 28 rows).
- Strategy numbers per access method (Tables 36.3-36.8) and support function numbers (Tables 36.9-36.14).
- Operator optimization clauses (6) and standard restriction/join selectivity estimators.
- Planner support request types (5).
- `CREATE AGGREGATE` parameters seen in the slice.
- Extension control-file parameters (11) with defaults; script substitutions (`MODULE_PATHNAME`, `@extschema@`, `@extschema:name@`, `@extowner@`); file naming patterns.
- PGXS variables (full list).
- Trigger timing/level/event matrix; `TriggerData` and `Trigger` fields; `TRIGGER_FIRED_*` macros.
- Event trigger events (5), covered command list, excluded shared objects, helper functions.
- Query tree parts (7); rule kinds and the three one-action rule cases.
- Output plugin callbacks (21) marked required/optional per feature; archive and OAuth callback structs.
- GUCs mentioned in the slice: `dynamic_library_path`, `shared_preload_libraries`, `extension_control_path`, `event_triggers`, `debug_print_parse`, `debug_print_rewritten`, `debug_print_plan`, `wal_level`, `max_replication_slots`, `max_wal_senders`, `max_prepared_transactions`, `hot_standby_feedback`, `sync_replication_slots`, `synchronized_standby_slots`, `primary_slot_name`, `primary_conninfo`, `synchronous_commit`, `synchronous_standby_names`, `logical_decoding_work_mem`, `archive_library`, `archive_command`, `archive_mode`, `oauth_validator_libraries`, `authentication_timeout`, `log_connections`. Note that this slice states no default values for most of them.
- Catalogs/views/functions mentioned: `pg_rewrite`, `pg_init_privs`, `pg_replication_slots`, `pg_stat_replication`, `pg_stat_replication_slots`, `pg_replication_origin`, `pg_replication_origin_status`, plus the SQL functions named in the notes.

### 4. Append `## Lesson ideas`
- Visualizers: volatility and snapshot timeline; SRF lockstep in the select list; aggregate state machine with moving-aggregate inverse and partial/combine; view expansion in the rewriter (range table substitution, then planner pull-up); the five-step update-rule rewrite of `log_shoelace`; trigger firing timeline (statement BEFORE, row BEFORE, operation, row AFTER queue, statement AFTER) including ON CONFLICT and cross-partition moves; event trigger sequence for one DDL command; extension update-path graph; logical decoding pipeline (WAL, reorder buffer, commit-order output, streaming blocks, two-phase).
- Playground SQL for PGlite (single session): SQL functions with OUT/VARIADIC/DEFAULT/polymorphic args; volatility demo; `CREATE AGGREGATE` with SQL or PL/pgSQL transition functions; `unsafe_sum` float demo; custom operator on a composite type; trigger ordering, `WHEN`, transition tables, INSTEAD OF trigger; event trigger blocking DDL in PL/pgSQL; `pg_rewrite` inspection of a view; the shoelace rule examples; `security_barrier` leak demo with the `tricky` function; materialized view with index and `REFRESH`; `pg_extension_update_paths`. Mark as not runnable in PGlite: C functions, logical decoding slots (needs `wal_level = logical`), archive and OAuth modules.
- Pitfalls with the documented fix, drawn from the notes (wrong IMMUTABLE label, column name shadowing an argument, SRF inside CASE, variadic aggregate with ORDER BY, modifying pass-by-reference input, unzeroed padding, missing COMMUTATOR, HASHES on non-equality, downgrade scripts shortening update paths, non-idempotent BEFORE triggers with ON CONFLICT, login trigger writing on a standby, rules with volatile functions, views without `security_barrier`, forgotten replication slots retaining WAL, duplicate delivery after a crash).

### 5. Verify
- Confirm 60 ledger rows, all four top-level sections present, and line count within the 600-1500 target.
- Final reply: output path, pages read, five most lesson-worthy findings.
