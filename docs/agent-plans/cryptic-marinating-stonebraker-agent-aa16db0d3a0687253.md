# Plan: finish slice C (Part II ch.9 Functions and Operators, idx 88-119)

## Context
Research slice for the PostgreSQL 18 curriculum map. Brief: `/Users/vivek-14286/postgres-internals/curriculum/research/_BRIEF.md`.
Output: `/Users/vivek-14286/postgres-internals/curriculum/research/C-functions-operators.md`.
Plan mode was switched on mid-task, so writing stopped. Reading is complete; the output file is partial.

## State when plan mode began
- All 32 pages (idx 88-119) have been read in full.
- Output file has 498 lines: title, a ledger placeholder comment, and "Notes by topic" for 9.1 through 9.27
  (functions.txt ... functions-info.txt), written before plan mode.
- Not yet written: notes for 9.28-9.31, the coverage ledger, "Complete inventories", "Lesson ideas".
- Blank-line-stripped copies of the source pages are in
  `/private/tmp/claude-778400340/-Users-vivek-14286/a2b88988-ca29-4ec2-8d8f-5d241c893686/scratchpad/C/`.

## Remaining steps
1. Append notes for 9.28 System Administration (functions-admin.txt), split by topic:
   - Configuration settings: `current_setting(name [, missing_ok])`, `set_config(name, value, is_local)` (NULL value = reset). [M7]
   - Server signaling: `pg_cancel_backend` (SIGINT), `pg_terminate_backend(pid, timeout DEFAULT 0)` (SIGTERM), `pg_reload_conf` (SIGHUP),
     `pg_rotate_logfile`, `pg_log_backend_memory_contexts` (first 100 child contexts); roles `pg_signal_backend`, `pg_signal_autovacuum_worker`. [M1]
   - Backup control + WAL/LSN: `pg_create_restore_point`, `pg_current_wal_lsn` / `_insert_lsn` / `_flush_lsn` (insert vs write vs flush),
     `pg_backup_start(label [, fast])`, `pg_backup_stop([wait_for_archive])` → (lsn, labelfile, spcmapfile), `pg_switch_wal`,
     `pg_walfile_name`, `pg_walfile_name_offset`, `pg_split_walfile_name`, `pg_wal_lsn_diff`; the LSN-from-filename example. [M7]
   - Recovery info/control: `pg_is_in_recovery`, `pg_last_wal_receive_lsn`, `pg_last_wal_replay_lsn`, `pg_last_xact_replay_timestamp`,
     `pg_get_wal_resource_managers`, `pg_is_wal_replay_paused`, `pg_get_wal_replay_pause_state`, `pg_promote(wait DEFAULT true, wait_seconds DEFAULT 60)`,
     `pg_wal_replay_pause/resume`. [M7]
   - Snapshot synchronization: `pg_export_snapshot`, `pg_log_standby_snapshot`. [M5, M7]
   - Replication management: physical/logical slot create/copy/drop, `pg_logical_slot_get|peek[_binary]_changes`, `pg_replication_slot_advance`,
     all `pg_replication_origin_*`, `pg_logical_emit_message`, `pg_sync_replication_slots` + caution. [M7]
   - Object size/location: `pg_column_size`, `pg_column_compression`, `pg_column_toast_chunk_id`, `pg_database_size`, `pg_indexes_size`,
     `pg_relation_size(rel [, fork])` (main/fsm/vm/init), `pg_size_bytes`, `pg_size_pretty`, `pg_table_size`, `pg_tablespace_size`,
     `pg_total_relation_size`; `pg_relation_filenode`, `pg_relation_filepath`, `pg_filenode_relation`. [M2]
   - Collation management; statistics manipulation (`pg_restore_relation_stats`, `pg_clear_relation_stats`, `pg_restore_attribute_stats`,
     `pg_clear_attribute_stats`); partition info (`pg_partition_tree`, `pg_partition_ancestors`, `pg_partition_root`). [M4, M7]
   - Index maintenance: `brin_summarize_new_values`, `brin_summarize_range`, `brin_desummarize_range`, `gin_clean_pending_list`. [M4]
   - Generic file access: `pg_ls_dir`, the `pg_ls_*dir` family, `pg_read_file`, `pg_read_binary_file`, `pg_stat_file`; security warning. [M1, M2]
   - Advisory locks: all 11 function families, 64-bit vs two 32-bit key spaces, session vs transaction level, stacking, shared vs exclusive. [M5]
2. Append notes for 9.29 Trigger Functions, 9.30 Event Trigger Functions (column lists, rewrite reason bitmap 1/2/4/8), 9.31 `pg_mcv_list_items`. [M6, M4]
3. Replace the ledger placeholder with a "Coverage ledger" table: one row per page, idx 88-119.
4. Append "Complete inventories": every operator/function table 9.1-9.111 by section, window functions, aggregates with Partial Mode,
   jsonpath methods and filter elements, regex flag letters, to_char patterns, EXTRACT fields, snapshot/xid functions,
   WAL/LSN + replication functions, size functions, advisory lock functions, privilege functions with allowed privilege types.
5. Append "Lesson ideas": visualizers (snapshot xmin:xmax:xip_list, window frame, lax vs strict jsonpath, insert/write/flush LSN,
   advisory lock stacking, UUIDv7 layout), PGlite playground SQL, and documented pitfalls with fixes.
6. Verify: file is in the 600-1500 line range, ledger has 32 rows, section order matches the brief.

## Verification
- `grep -c '^| 1\?[0-9][0-9] |'` on the ledger gives 32 rows; `wc -l` within range.
- Spot-check 5 facts against the stripped source pages (e.g. `pg_terminate_backend` timeout default, rewrite reason bitmap values).
