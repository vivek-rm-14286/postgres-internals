# Slice E — Maintenance/VACUUM, Backup & PITR, HA & Replication, Monitoring, WAL, Logical Replication, JIT, Regression Tests, WAL for Extensions, Physical Storage, Transaction Processing

Source: PostgreSQL 18 docs, Part III ch.24-31 (idx 248-300), Part VII ch.64 (idx 983-985), ch.66 (idx 993-1000), ch.67 (idx 1001-1005).

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 248 | maintenance.txt | Ch.24 intro: backups, vacuuming, log management; check_postgres |
| 249 | routine-vacuuming.txt | VACUUM reasons, FULL vs plain, ANALYZE, VM, XID/MXID wraparound thresholds and recovery, autovacuum formulae |
| 250 | routine-reindex.txt | REINDEX: B-tree partial-page bloat, CONCURRENTLY lock level |
| 251 | logfile-maintenance.txt | Log rotation: logging_collector, rotatelogs, logrotate, syslog caveats |
| 252 | backup.txt | Ch.25 intro: SQL dump, file-system backup, continuous archiving |
| 253 | backup-dump.txt | pg_dump/pg_dumpall usage, restore options, large-DB techniques, parallel dump |
| 254 | backup-file.txt | File-system backup restrictions, frozen snapshots, rsync method |
| 255 | continuous-archiving.txt | WAL archiving, base/incremental backup, low-level API, PITR procedure, timelines, caveats |
| 256 | high-availability.txt | Ch.26 intro: HA/load-balancing terminology, sync vs async |
| 257 | different-replication-solutions.txt | Replication solution comparison and feature matrix (Table 26.1) |
| 258 | warm-standby.txt | Log-shipping/streaming standby, slots, cascading, synchronous replication, archiving on standby |
| 259 | warm-standby-failover.txt | Failover: STONITH, degenerate state, pg_rewind, promote |
| 260 | hot-standby.txt | Hot standby: allowed commands, query conflicts, admin parameters, caveats |
| 261 | monitoring.txt | Ch.27 intro: monitoring tools overview |
| 262 | monitoring-ps.txt | ps process titles and activity indicators |
| 263 | monitoring-stats.txt | Cumulative stats system: config, caching, every pg_stat/pg_statio view, wait events, functions |
| 264 | monitoring-locks.txt | pg_locks uses |
| 265 | progress-reporting.txt | Progress views for ANALYZE, CLUSTER, COPY, CREATE INDEX, VACUUM, base backup and their phases |
| 266 | dynamic-trace.txt | DTrace/SystemTap probes list and defining new probes |
| 267 | diskusage.txt | Disk usage via pg_class/relpages, TOAST/index sizes, disk-full behaviour |
| 268 | wal.txt | Ch.28 intro: reliability and WAL |
| 269 | wal-reliability.txt | Storage caches, torn pages and full page images, CRC-32C, what is checksummed |
| 270 | checksums.txt | Data checksums default on, pg_checksums, ignore_checksum_failure |
| 271 | wal-intro.txt | WAL principle: log before data, REDO, group commit benefit |
| 272 | wal-async-commit.txt | Async commit: loss not corruption, 3x wal_writer_delay window, vs fsync off and commit_delay |
| 273 | wal-configuration.txt | Checkpoints, checkpoint tuning, WAL segment recycling, restartpoints, XLogInsertRecord/XLogFlush, commit_delay, wal_sync_method |
| 274 | wal-internals.txt | LSN, 16 MB segments and 8 kB WAL pages, segment naming, pg_control and recovery start |
| 275 | logical-replication.txt | Ch.29 intro: publish/subscribe model and use cases |
| 276 | logical-replication-publication.txt | Publications, operation filtering, replica identity rules |
| 277 | logical-replication-subscription.txt | Subscriptions, column/table matching, slot management, setup and deferred-slot examples |
| 278 | logical-replication-failover.txt | Logical slot failover to standby and readiness checks |
| 279 | logical-replication-row-filter.txt | Row filter rules, restrictions, UPDATE transformations, combining filters |
| 280 | logical-replication-col-lists.txt | Column lists: rules, security caveat, multi-publication warning |
| 281 | logical-replication-gencols.txt | Generated column replication in 18 and result matrix |
| 282 | logical-replication-conflicts.txt | Seven conflict types, log format, resolution via SKIP or origin advance |
| 283 | logical-replication-restrictions.txt | Restrictions: no DDL/sequences/large objects, TRUNCATE FKs, partitions, REPLICA IDENTITY FULL types |
| 284 | logical-replication-architecture.txt | Walsender + pgoutput + apply worker architecture; initial snapshot via sync workers |
| 285 | logical-replication-monitoring.txt | pg_stat_subscription worker rows |
| 286 | logical-replication-security.txt | Replication role, publication privileges absent, subscription owner and run_as_owner |
| 287 | logical-replication-config.txt | Publisher and subscriber GUCs for logical replication |
| 288 | logical-replication-upgrade.txt | pg_upgrade of logical replication clusters (17+), prerequisites and procedures |
| 289 | logical-replication-quick-setup.txt | Minimal logical replication setup |
| 290 | jit.txt | Ch.30 intro: JIT |
| 291 | jit-reason.txt | JIT concept: expression evaluation, tuple deforming, inlining, optimization |
| 292 | jit-decision.txt | JIT cost thresholds decided at plan time; EXPLAIN JIT output |
| 293 | jit-configuration.txt | JIT configuration parameters |
| 294 | jit-extensibility.txt | Extension bitcode inlining and pluggable JIT provider callbacks |
| 295 | regress.txt | Ch.31 intro: regression tests |
| 296 | regress-run.txt | make check/installcheck/check-world, PG_TEST_EXTRA, locale and custom settings |
| 297 | regress-evaluation.txt | Interpreting benign test failures |
| 298 | regress-variant.txt | resultmap and best-match variant expected files |
| 299 | regress-tap.txt | TAP tests with prove, environment variables |
| 300 | regress-coverage.txt | Coverage builds with gcov/lcov for make and meson |
| 983 | wal-for-extensions.txt | Ch.64 intro: generic WAL vs custom resource managers |
| 984 | generic-wal.txt | Generic WAL API, rules, delta encoding |
| 985 | custom-rmgr.txt | RmgrData struct, RegisterCustomRmgr, shared_preload_libraries requirement |
| 993 | storage.txt | Ch.66 intro: physical storage |
| 994 | storage-file-layout.txt | PGDATA contents, filenodes, forks, 1 GB segments, tablespaces, temp files |
| 995 | storage-toast.txt | TOAST varlena encoding, chunking, thresholds, four strategies, in-memory pointers |
| 996 | storage-fsm.txt | FSM tree structure, one byte per page |
| 997 | storage-vm.txt | VM two bits per page (all-visible, all-frozen) |
| 998 | storage-init.txt | Init fork for unlogged relations |
| 999 | storage-page-layout.txt | Page layout, PageHeaderData, ItemIdData, HeapTupleHeaderData, row layout |
| 1000 | storage-hot.txt | HOT conditions, pruning and redirects, fillfactor |
| 1001 | transactions.txt | Ch.67 intro: transaction processing |
| 1002 | transaction-id.txt | vxid, xid assignment on first write, xid8 epoch, pg_xact, GIDs |
| 1003 | xact-locking.txt | pg_locks virtualxid/transactionid, row locks in tuples |
| 1004 | subxacts.txt | Subtransactions, subxid ordering, pg_subtrans, 64-subxid cache |
| 1005 | two-phase.txt | Two-phase commit, pg_twophase, pg_prepared_xacts |

## Notes by topic

### Ch.24 overview: routine maintenance  [M7]  (source: maintenance.txt)
- Three recurring admin duties: (1) backups (ch.25), (2) periodic vacuuming + planner statistics refresh (24.1), (3) log file management (24.3). All are "required but repetitive", automatable by cron / Windows Task Scheduler.
- `check_postgres` (external) monitors DB health; integrates with Nagios and MRTG, can run standalone.
- Docs claim: PostgreSQL is low-maintenance compared to some other DBMSs, but attention to these tasks matters.

### VACUUM basics: the four reasons  [M7, M5, M2]  (source: routine-vacuuming.txt 24.1.1-24.1.2)
- VACUUM must process each table regularly for exactly four reasons:
  1. Recover/reuse disk space occupied by updated or deleted rows.
  2. Update data statistics used by the planner.
  3. Update the visibility map (speeds index-only scans).
  4. Protect against loss of very old data due to transaction ID wraparound or multixact ID wraparound.
- Two variants: standard `VACUUM` and `VACUUM FULL`.
  - Standard VACUUM runs in parallel with production ops: SELECT/INSERT/UPDATE/DELETE continue; but table definition cannot be modified (e.g. ALTER TABLE) while being vacuumed. Lock held: SHARE UPDATE EXCLUSIVE.
  - VACUUM FULL requires ACCESS EXCLUSIVE lock; reclaims more space but much slower; writes a complete new copy of the table file with no dead space; needs extra disk space ~= table size until done.
  - "administrators should strive to use standard VACUUM and avoid VACUUM FULL".
- VACUUM generates substantial I/O; cost-based delay params (Section 19.10.2) reduce the impact.
- MVCC reason: UPDATE or DELETE does not immediately remove the old row version; it must stay while potentially visible to other transactions. Eventually it is of no interest to any transaction and must be reclaimed.
- Standard VACUUM removes dead row versions in tables and indexes and marks space available for future reuse. It does NOT return space to the OS, except the special case where one or more pages at the END of a table become entirely free AND an exclusive table lock can be easily obtained (tail truncation).
- Goal of routine vacuuming: steady-state disk usage (minimum size + space used between vacuum runs), not minimum size. Autovacuum never issues VACUUM FULL.
- Fixed-schedule vacuuming risk: an unexpected update spike bloats the table to where VACUUM FULL is needed. Autovacuum schedules dynamically. "It is unwise to disable the daemon completely unless you have an extremely predictable workload." Compromise: tune daemon to only react to unusually heavy update activity and do bulk with scheduled VACUUMs.
- Without autovacuum: database-wide VACUUM once a day at low usage + more frequent vacuums of hot tables (some installations vacuum busiest tables every few minutes). Use `vacuumdb` for multiple databases.
- Tip: when a table has massive dead rows and you need the disk back: VACUUM FULL, or CLUSTER, or a table-rewriting ALTER TABLE variant. All require ACCESS EXCLUSIVE and temporarily use extra space ~= table size (old table + indexes kept until new complete).
- Tip: for tables whose entire contents are periodically deleted use TRUNCATE instead of DELETE + VACUUM (immediate space release; disadvantage: strict MVCC semantics are violated).

### Planner statistics maintenance (ANALYZE)  [M4, M7]  (source: routine-vacuuming.txt 24.1.3)
- ANALYZE gathers stats; can run alone or as an optional step of VACUUM. Uses a statistically random sample, not every row -> fast, so analyzing the whole database is usually best.
- Autovacuum issues ANALYZE strictly as a function of number of rows inserted or updated; no knowledge of whether stats meaningfully change.
- Tuples changed in partitions and inheritance children do NOT trigger analyze on the parent. Parent that is empty/rarely changed may never be processed -> inheritance-tree stats never collected. Fix: manual ANALYZE on parent.
- Rule of thumb: think about how much min and max values of columns change (e.g. a last-update timestamp column needs frequent stats updates; a URL column's distribution changes slowly).
- Can ANALYZE specific tables and specific columns.
- Per-column detail: `ALTER TABLE ... ALTER COLUMN ... SET STATISTICS`, or database-wide `default_statistics_target`. Useful for columns heavily used in WHERE with irregular distributions.
- Function selectivity: limited info by default; creating a statistics object or an expression index using a function call causes useful stats about the function to be gathered.
- Autovacuum does NOT issue ANALYZE for foreign tables (no way to know how often). Manual schedule needed.
- Autovacuum does NOT issue ANALYZE for partitioned tables. Inheritance parents only analyzed if the parent itself is changed.

### Visibility map maintenance  [M2, M4, M7]  (source: routine-vacuuming.txt 24.1.4)
- VM tracks which pages contain only tuples known visible to all active transactions (and all future ones until the page is modified again).
- Purpose 1: vacuum can skip such pages on next run.
- Purpose 2: index-only scans. Indexes contain no tuple visibility info; a normal index scan fetches the heap tuple for each match to check visibility. An index-only scan checks the VM first; if all tuples on the page are known visible, the heap fetch is skipped. VM is "vastly smaller than the heap" so easily cached.

### XID wraparound and freezing — exact mechanics  [M7, M5]  (source: routine-vacuuming.txt 24.1.5)
- XIDs are 32 bits. After > 4 billion transactions the counter wraps to zero: past transactions appear in the future -> their output becomes invisible ("catastrophic data loss"; data is still there but unreachable).
- Rule: "vacuum every table in every database at least once every two billion transactions".
- Normal XIDs compared with modulo-2^32 arithmetic: for every normal XID there are two billion "older" and two billion "newer" XIDs; the normal XID space is circular with no endpoint. A row version appears "in the past" for the next two billion transactions; after that it would suddenly appear in the future.
- Special XIDs:
  - `FrozenTransactionId` = 2: does not follow normal comparison rules; always considered older than every normal XID.
  - `BootstrapTransactionId` = 1: rows inserted during the first phase of initdb (system catalogs); also treated as older than every normal XID.
  - (from ch.67: 0 is invalid; normal XIDs start at 3.)
- Freezing: VACUUM marks rows as frozen = inserted by a transaction that committed sufficiently far in the past that its effects are certain visible to all current and future transactions. Frozen row versions are treated as if xmin were FrozenTransactionId; valid until deleted.
- Note (history): before 9.4 freezing literally replaced xmin with FrozenTransactionId (visible in xmin). Newer versions just set a flag bit, preserving original xmin for forensics. Rows with xmin = 2 may still exist in databases pg_upgrade'd from pre-9.4.
- `vacuum_freeze_min_age`: how old an XID must be before rows bearing it are frozen. Increasing avoids useless work if rows will be modified again soon; decreasing increases number of transactions that can elapse before the table must be vacuumed again.
- VACUUM uses the VM to decide which pages to scan; normally skips pages with no dead row versions even if they hold old XIDs -> normal VACUUMs don't always freeze every old row version. Eventually an **aggressive vacuum** is needed: freezes all eligible unfrozen XID and MXID values, including those in all-visible but not all-frozen pages.
- **Eager scanning (PG18 tag UNVERIFIED)**: if a table accumulates a backlog of all-visible-but-not-all-frozen pages, a normal vacuum may choose to scan skippable pages to freeze them ("eagerly scanned pages"), decreasing the pages the next aggressive vacuum must scan. Tuned by `vacuum_max_eager_freeze_failure_rate` (increase to try freezing more all-visible pages). Most tables still require periodic aggressive vacuuming, but pages successfully eager-frozen may be skipped during the aggressive vacuum.
- `vacuum_freeze_table_age`: controls when a table is aggressively vacuumed. All all-visible-but-not-all-frozen pages are scanned if number of transactions since the last such scan > `vacuum_freeze_table_age - vacuum_freeze_min_age`. Setting `vacuum_freeze_table_age = 0` forces VACUUM to always be aggressive.
- Max time a table can go unvacuumed: two billion transactions minus the `vacuum_freeze_min_age` in effect at the last aggressive vacuum. Longer -> data loss possible.
- `autovacuum_freeze_max_age`: autovacuum is invoked on any table that might contain unfrozen rows with XIDs older than this — **even if autovacuum is disabled**.
- Consequence: a table not otherwise vacuumed gets a forced autovacuum approximately every `autovacuum_freeze_max_age - vacuum_freeze_min_age` transactions. For static tables (including insert-only), maximize the interval by raising autovacuum_freeze_max_age or lowering vacuum_freeze_min_age.
- Effective max for `vacuum_freeze_table_age` = `0.95 * autovacuum_freeze_max_age`; higher values are capped. The 0.95 leaves breathing room for a manual VACUUM before anti-wraparound autovacuum. Rule of thumb: set vacuum_freeze_table_age somewhat below autovacuum_freeze_max_age with enough gap that a scheduled VACUUM or a normal-activity autovacuum runs in that window. Too close -> anti-wraparound autovacuums even though table was recently vacuumed; lower -> more frequent aggressive vacuums.
- Sole disadvantage of raising autovacuum_freeze_max_age (and vacuum_freeze_table_age): `pg_xact` and `pg_commit_ts` take more space (must keep commit status, and timestamp if `track_commit_timestamp`, back to the autovacuum_freeze_max_age horizon).
  - Commit status = 2 bits per transaction.
  - At max autovacuum_freeze_max_age (two billion): pg_xact ~ half a gigabyte, pg_commit_ts ~ 20GB.
  - At default (200 million): pg_xact ~ 50MB, pg_commit_ts ~ 2GB.
  - Recommendation: if trivial vs. DB size, set autovacuum_freeze_max_age to its maximum.
- Disadvantage of lowering vacuum_freeze_min_age: useless freezing work if rows are modified soon after (they get a new XID).
- Tracking: `pg_class.relfrozenxid` = oldest remaining unfrozen XID at the end of the most recent VACUUM that successfully advanced relfrozenxid (typically the last aggressive VACUUM). `pg_database.datfrozenxid` = lower bound on unfrozen XIDs in that database = minimum of the per-table relfrozenxid values.
- Monitoring queries (verbatim):
  ```sql
  SELECT c.oid::regclass as table_name,
         greatest(age(c.relfrozenxid),age(t.relfrozenxid)) as age
  FROM pg_class c
  LEFT JOIN pg_class t ON c.reltoastrelid = t.oid
  WHERE c.relkind IN ('r', 'm');

  SELECT datname, age(datfrozenxid) FROM pg_database;
  ```
  `age` = number of transactions from the cutoff XID to the current transaction's XID.
- Tip: `VACUUM (VERBOSE)` prints how relfrozenxid and relminmxid advanced and number of newly frozen pages; same in server log via `log_autovacuum_min_duration`.
- relfrozenxid is advanced only when every page that might contain unfrozen XIDs is scanned. That happens when: (a) relfrozenxid is more than vacuum_freeze_table_age transactions old, (b) VACUUM's FREEZE option is used, or (c) all pages that are not already all-frozen happen to require vacuuming to remove dead row versions. After such a scan, age(relfrozenxid) should be just a little more than vacuum_freeze_min_age (plus transactions started since VACUUM began). VACUUM sets relfrozenxid to the oldest XID that remains in the table, so it may be much more recent than strictly required.
- **Warning threshold: 40 million transactions from wraparound point**:
  ```
  WARNING:  database "mydb" must be vacuumed within 39985967 transactions
  HINT:  To avoid XID assignment failures, execute a database-wide VACUUM in that database.
  ```
  Manual VACUUM should be run by a superuser, else it fails to process system catalogs, which prevents advancing datfrozenxid.
- **Hard stop: fewer than 3 million transactions left**:
  ```
  ERROR:  database is not accepting commands that assign new transaction IDs to avoid wraparound data loss in database "mydb"
  HINT:  Execute a database-wide VACUUM in that database.
  ```
  In this state: transactions already in progress can continue, but only read-only transactions can be started. Operations that modify records or truncate relations fail. VACUUM still runs normally. It is NOT necessary or desirable to stop the postmaster or enter single-user mode.
- Recovery procedure (numbered, verbatim-accurate):
  1. Resolve old prepared transactions: `pg_prepared_xacts` rows where `age(transactionid)` is large -> commit or roll back.
  2. End long-running open transactions: `pg_stat_activity` rows where `age(backend_xid)` or `age(backend_xmin)` is large -> commit/rollback or `pg_terminate_backend`.
  3. Drop old replication slots: `pg_replication_slots` where `age(xmin)` or `age(catalog_xmin)` is large (often slots for servers that no longer exist). Dropping a slot for a server that still exists may require rebuilding that replica.
  4. Execute VACUUM in the target database. Database-wide is simplest; or manual VACUUM on tables where relminxid (sic; docs' word) is oldest. Do NOT use VACUUM FULL (needs an XID so it fails; in single-user mode it consumes an XID and increases the risk). Do NOT use VACUUM FREEZE (does more than the minimum work).
  5. Once normal, ensure autovacuum is properly configured.
- Single-user mode: only reason now is to TRUNCATE or DROP unneeded tables to avoid vacuuming them; the three-million-transaction safety margin exists for that. Riskier: disables wraparound safeguards.

### Multixact wraparound  [M7, M5]  (source: routine-vacuuming.txt 24.1.5.1)
- Multixact IDs support row locking by multiple transactions. Tuple header has limited space for lock info, so when more than one transaction concurrently locks a row, the info is encoded as a "multiple transaction ID" (multixact ID). Only the multixact ID appears in the tuple's xmax; the member XID list is stored in `pg_multixact` subdirectory.
- Multixact IDs: 32-bit counter + storage -> same aging, cleanup, wraparound concerns. A separate storage area holds the member lists, with its OWN 32-bit counter (member offsets) that must also be managed.
- `pg_get_multixact_members()` lists the XIDs of a multixact.
- Whenever VACUUM scans any part of a table it replaces any multixact ID older than `vacuum_multixact_freeze_min_age` with a different value: zero, a single transaction ID, or a newer multixact ID.
- `pg_class.relminmxid` = oldest possible multixact ID still appearing in any tuple of the table. If older than `vacuum_multixact_freeze_table_age`, an aggressive vacuum is forced (only all-frozen pages skipped). `mxid_age(relminmxid)` gives the age.
- Aggressive VACUUMs, whatever the cause, are guaranteed to be able to advance relminmxid. Once all tables in all databases are advanced, old multixact storage can be removed.
- Safety: aggressive vacuum for any table whose multixact-age > `autovacuum_multixact_freeze_max_age`. Additionally, if storage occupied by multixact members exceeds about **10GB**, aggressive scans occur more often for all tables, oldest multixact-age first. Both happen even if autovacuum is nominally disabled. The members storage area can grow to about **20GB** before wraparound.
- Same warning/stop thresholds: warnings at 40 million from wraparound; refuses to generate new MXIDs when fewer than 3 million left.
- Recovery differences vs XID case:
  - Running/prepared transactions can be ignored if no chance they appear in a multixact.
  - Replication slots do NOT directly hold back multixact cleanup; dropping stale slots usually not relevant.
  - MXID info is not directly visible in pg_stat_activity etc.; looking for old XIDs is still a good way to find culprits.
  - XID exhaustion blocks all write transactions; MXID exhaustion blocks only those involving row locks that require an MXID.

### Autovacuum daemon: architecture and formulae  [M7, M1]  (source: routine-vacuuming.txt 24.1.6)
- Purpose: automate VACUUM and ANALYZE. Uses the cumulative statistics system -> requires `track_counts = true`. Enabled by default.
- Processes: persistent **autovacuum launcher** starts **autovacuum worker** processes for all databases. Launcher tries to start one worker in each database every `autovacuum_naptime` seconds -> with N databases a new worker is launched every `autovacuum_naptime/N` seconds. At most `autovacuum_max_workers` workers at once. If more databases than workers, next database is processed as soon as the first worker finishes. Each worker checks each table in its database and runs VACUUM and/or ANALYZE as needed. `log_autovacuum_min_duration` monitors activity.
- No limit on workers per database; workers try to avoid repeating work already done by others. Running workers do NOT count toward `max_connections` or `superuser_reserved_connections`.
- If several large tables become eligible at once, all workers can be tied up for a long time and other tables/databases starve.
- Trigger conditions (per table):
  1. Always vacuumed if `relfrozenxid` is more than `autovacuum_freeze_max_age` transactions old (also when per-table freeze max age storage parameter is set).
  2. Dead-tuple trigger: number of tuples obsoleted since last VACUUM exceeds
     `vacuum threshold = Minimum(vacuum max threshold, vacuum base threshold + vacuum scale factor * number of tuples)`
     where max threshold = `autovacuum_vacuum_max_threshold` (PG18 version tag UNVERIFIED), base = `autovacuum_vacuum_threshold`, scale = `autovacuum_vacuum_scale_factor`, number of tuples = `pg_class.reltuples`.
  3. Insert trigger: tuples inserted since last vacuum exceeds
     `vacuum insert threshold = vacuum base insert threshold + vacuum insert scale factor * number of tuples * percent of table not frozen`
     where base = `autovacuum_vacuum_insert_threshold`, scale = `autovacuum_vacuum_insert_scale_factor`, tuples = `pg_class.reltuples`, percent not frozen = `1 - pg_class.relallfrozen / pg_class.relpages` (`relallfrozen` column; PG18 tag UNVERIFIED). Such vacuums let pages be marked all-visible and tuples frozen. For insert-mostly tables, lowering the table's `autovacuum_freeze_min_age` may let earlier vacuums freeze.
  4. Analyze trigger: `analyze threshold = analyze base threshold + analyze scale factor * number of tuples` (`autovacuum_analyze_threshold`, `autovacuum_analyze_scale_factor`) compared to total tuples inserted, updated, or deleted since last ANALYZE.
- Obsolete/inserted tuple counts come from the cumulative statistics system: eventually-consistent counts updated by each UPDATE, DELETE, INSERT.
- If relfrozenxid is more than `vacuum_freeze_table_age` transactions old, the (auto)vacuum is aggressive.
- Partitioned tables store no tuples -> not processed by autovacuum (partitions are). Hence no auto-ANALYZE of partitioned tables -> run manual ANALYZE when first populated and when distribution changes significantly.
- Temporary tables cannot be accessed by autovacuum -> vacuum/analyze them via session SQL.
- Per-table overrides via storage parameters (CREATE/ALTER TABLE ... SET (autovacuum_...)); else global.
- Cost balancing: with multiple workers, autovacuum cost delay parameters are "balanced" among running workers so total I/O impact is the same regardless of worker count. Workers processing tables with per-table `autovacuum_vacuum_cost_delay` or `autovacuum_vacuum_cost_limit` storage params are excluded from balancing.
- Locking: autovacuum holds SHARE UPDATE EXCLUSIVE. If another process requests a conflicting lock, lock acquisition **interrupts (cancels) the autovacuum**. Exception: anti-wraparound autovacuum (query text in pg_stat_activity ends with `(to prevent wraparound)`) is NOT automatically interrupted.
- Warning: regularly running commands that take locks conflicting with SHARE UPDATE EXCLUSIVE (e.g. ANALYZE) can effectively prevent autovacuums from ever completing.

### Routine reindexing  [M4, M7]  (source: routine-reindex.txt)
- B-tree pages that become completely empty are reclaimed for reuse. But if all but a few keys on a page are deleted the page stays allocated -> usage pattern where most-but-not-all keys in each range are eventually deleted gives poor space use -> periodic REINDEX recommended.
- Bloat potential in non-B-tree indexes "has not been well researched"; monitor physical size.
- Freshly built B-tree is slightly faster: logically adjacent pages are usually physically adjacent (not applicable to non-B-tree).
- `REINDEX` requires ACCESS EXCLUSIVE by default; `REINDEX ... CONCURRENTLY` requires only SHARE UPDATE EXCLUSIVE.

### Log file maintenance  [M7, M1]  (source: logfile-maintenance.txt)
- Server log may contain sensitive info (DDL with plaintext passwords, statement source at ERROR level, parts of data rows) -> protect.
- Plain stderr redirect to a file: can only truncate by stop/restart.
- Built-in rotation: `logging_collector = true` (params in 19.8.1); can also emit CSV.
- External: `pg_ctl start | rotatelogs /var/log/pgsql_log 86400` (pg_ctl already redirects stderr to stdout).
- logrotate + logging collector: use `pg_ctl logrotate` instead of SIGHUP; server switches to a new log file or reopens the existing one depending on config.
- Note: with static log file names, reopen can fail if max open file limit reached / file table overflow; messages keep going to the old file; if logrotate compresses & deletes, messages lost. Fix: dynamic log file names + prerotate script to ignore open log files.
- syslog: `log_destination = syslog`; SIGHUP syslog daemon to rotate. Caveats: syslog unreliable with large messages (may truncate/drop); on Linux syslog flushes each message to disk (use "-" at start of file name in syslog config to disable syncing).
- None of these delete old logs: need batch job, or cyclic overwrite.
- Tools: pgBadger (log analysis), check_postgres (Nagios alerts).

### Backup: three approaches  [M7]  (source: backup.txt)
- Three fundamentally different approaches: (1) SQL dump, (2) file system level backup, (3) continuous archiving.

### SQL dump (pg_dump / pg_dumpall)  [M7]  (source: backup-dump.txt)
- `pg_dump dbname > dumpfile` — writes SQL to stdout; other formats allow parallelism and fine-grained restore.
- pg_dump is a regular client app: can run from any remote host; has no special permissions — needs read access to all tables (usually superuser for whole DB); `-n schema` / `-t table` for partial dumps. Connection: `-h host`, `-p port`, `-U`; env PGHOST, PGPORT, PGUSER.
- Advantages: output can generally be reloaded into NEWER PostgreSQL versions (file-level backups and continuous archiving are "extremely server-version-specific"); only method that works across machine architectures (e.g. 32-bit -> 64-bit).
- Dumps are internally consistent: a snapshot as of when pg_dump began. Does not block other operations except those needing an exclusive lock (most forms of ALTER TABLE).
- Restore text dump: `psql -X dbname < dumpfile`. The database is NOT created by the dump: create from template0 first (`createdb -T template0 dbname`). `-X` (`--no-psqlrc`) ensures default psql settings. Non-text dumps -> `pg_restore`.
- All roles that own objects or hold grants must exist before restore.
- psql continues after SQL errors by default. `psql -X --set ON_ERROR_STOP=on dbname < dumpfile` -> exits with status 3 on SQL error. `-1` / `--single-transaction` -> all-or-nothing restore (a minor error rolls back hours of work).
- Server-to-server pipe: `pg_dump -h host1 dbname | psql -X -h host2 dbname`.
- Important: dumps are relative to `template0`; anything added via template1 is also dumped -> create the empty target DB from template0.
- After restore run ANALYZE on each database.
- `pg_dumpall > dumpfile` — dumps every database plus cluster-wide data (roles, tablespaces). Restore: `psql -X -f dumpfile postgres` (superuser always required). Works by emitting commands to recreate roles, tablespaces, empty databases, then invoking pg_dump per database -> each DB consistent but snapshots of different DBs are NOT synchronized. `pg_dumpall --globals-only` dumps only cluster-wide data.
- Large databases:
  - Compressed: `pg_dump dbname | gzip > filename.gz`; reload `gunzip -c filename.gz | psql dbname`.
  - split: `pg_dump dbname | split -b 2G - filename`; reload `cat filename* | psql dbname`; GNU: `split -b 2G --filter='gzip > $FILE.gz'`.
  - Custom format: `pg_dump -Fc dbname > filename` (compressed if built with zlib; selective restore) -> `pg_restore -d dbname filename`.
  - Parallel dump: `pg_dump -j num -F d -f out.dir dbname` (only "directory" format). `pg_restore -j` works for "custom" or "directory" archives.

### File system level backup  [M7, M2]  (source: backup-file.txt)
- e.g. `tar -cf backup.tar /usr/local/pgsql/data`. Two restrictions:
  1. Server MUST be shut down for a usable backup (tar isn't an atomic snapshot; server buffering). Also shut down before restoring.
  2. Cannot back up/restore individual tables or databases from their files: files are unusable without commit log `pg_xact/*` (commit status of all transactions). Restoring one table + pg_xact would render all other tables useless. Only whole-cluster backup/restore works.
- Alternative: consistent ("frozen") file system snapshot of the volume, copy the whole data directory, release. Works while running; the backup looks like a crashed server -> WAL replay on start (must include WAL files). Do a CHECKPOINT before snapshot to cut recovery time.
- Multiple file systems (WAL on other disk, tablespaces): snapshots must be simultaneous; otherwise shut down briefly, or use a continuous-archiving base backup (immune to FS changes during backup).
- rsync method: rsync while running, then shut down and `rsync --checksum` (needed because rsync has only one-second mtime granularity). Minimal downtime.
- FS backup is typically larger than a SQL dump (indexes included) but may be faster.

### Continuous archiving & PITR: concept  [M7]  (source: continuous-archiving.txt intro)
- WAL lives in `pg_wal/`; records every change to data files; exists primarily for crash safety (replay since last checkpoint). Third strategy: FS-level backup + WAL file backup; restore backup then replay WAL.
- Benefits: (1) no perfectly consistent FS backup needed — inconsistency fixed by replay (so plain tar works); (2) continuous backup via archiving WAL indefinitely; (3) can stop replay at any point = point-in-time recovery to any time since the base backup; (4) feeding WAL to another machine loaded with the same base backup = warm standby.
- pg_dump/pg_dumpall are logical, cannot be part of continuous archiving.
- Whole cluster only, not a subset. Needs lots of archive storage.
- Need a continuous sequence of archived WAL files extending back at least to the START time of the backup -> set up and test archiving before the first base backup.

### WAL archiving setup  [M7]  (source: continuous-archiving.txt 25.3.1)
- WAL = abstract indefinitely long record sequence, physically divided into **WAL segment files, normally 16MB** (changeable at initdb). Numeric names reflect position. Without archiving, the system creates a few segments and "recycles" them by renaming no-longer-needed segment files to higher segment numbers; segments preceding the last checkpoint are assumed no longer of interest.
- Enable: `wal_level = replica` or higher, `archive_mode = on`, and `archive_command` (shell) or `archive_library` (C archive module, ch.49).
- `archive_command` placeholders: `%p` = path of file to archive (relative to data directory), `%f` = file name only, `%%` = literal %.
  ```
  archive_command = 'test ! -f /mnt/server/archivedir/%f && cp %p /mnt/server/archivedir/%f'  # Unix
  archive_command = 'copy "%p" "C:\\server\\archivedir\\%f"'  # Windows
  ```
  Expanded example: `test ! -f /mnt/server/archivedir/00000001000000A900000065 && cp pg_wal/00000001000000A900000065 /mnt/server/archivedir/00000001000000A900000065`.
- Runs as the server's OS user. Protect the archive (contains effectively everything in the DB).
- Must return zero exit status iff success. Zero -> PostgreSQL assumes archived and removes/recycles the file. Nonzero -> retried periodically until success.
- If the command is terminated by a signal (other than SIGTERM used in server shutdown) or the shell errors with exit status > 125 (e.g. command not found), or the archive function emits ERROR/FATAL, the archiver process aborts and is restarted by the postmaster; such failures are NOT reported in `pg_stat_archiver`.
- Must refuse to overwrite a pre-existing archive file (safety against two servers archiving to one directory). Re-archive case: after a crash before archival success was durably recorded, the server may re-archive the same file; command should return zero if the pre-existing file has identical contents and is fully persisted; nonzero if contents differ.
- GNU `cp -i` returns status zero when target exists — not the desired behavior; don't rely on it.
- If archiving fails repeatedly, `pg_wal/` fills. If the file system containing pg_wal fills, PostgreSQL does a **PANIC shutdown**; no committed transactions lost but DB offline until space is freed.
- Archive speed only needs to keep up with the average WAL generation rate. Falling behind increases data-loss window and pg_wal size.
- File names to be archived can be up to 64 characters, any combination of ASCII letters, digits, dots. Must preserve file name (%f), not necessarily the path.
- Archiving does not capture config file changes (postgresql.conf, pg_hba.conf, pg_ident.conf).
- Archive command is invoked only on completed WAL segments. `archive_timeout` forces a segment switch at least that often; early-switched files are still full length (16MB) -> very short archive_timeout bloats the archive; "a minute or so" is usually reasonable.
- `pg_switch_wal()` forces a manual segment switch.
- `wal_level = minimal`: some SQL commands skip WAL (Section 14.4.7), so WAL would be insufficient for archive recovery -> `wal_level` can only be changed at server start. `archive_command`/`archive_library` can be changed by reload. To pause archiving: set `archive_command = ''` (WAL accumulates in pg_wal).

### Base backups, incremental backups, low-level API  [M7]  (source: continuous-archiving.txt 25.3.2-25.3.4)
- Easiest: `pg_basebackup` (regular files or tar). During backup mode `full_page_writes` is effectively forced on (perf drop if you normally disable it).
- **Backup history file**: created by the base backup, stored immediately in the WAL archive area, named after the first WAL segment needed, e.g. starting WAL file `0000000100001234000055CD` -> `0000000100001234000055CD.007C9330.backup` (second part = exact position within the WAL file). Small text file: label, start/end times, WAL segments. All archived segments numerically less than that name are no longer needed for that backup.
- Interval between base backups: trade archive storage vs. replay time.
- **Incremental backup** (`pg_basebackup --incremental=<manifest of earlier backup>`):
  - Non-relation files included in entirety; relation files may be replaced by smaller incremental files with only blocks changed since the earlier backup plus metadata.
  - Prior backup may be on an earlier timeline but must not require WAL beyond where the server switched away from it.
  - Uses **WAL summaries** stored in `pg_wal/summaries` (WAL summarizer process; `summarize_wal`). Summaries must cover all LSNs from start LSN of the prior backup to start LSN of the current. Server waits for missing summaries; fails if already removed or the summarizer doesn't catch up.
  - Restore needs the incremental plus all earlier backups it depends on; use `pg_combinebackup` to produce a synthetic full backup. Restrictions when checksum status changed.
  - PostgreSQL has NO built-in mechanism to track which backups are still needed — track yourself.
  - Makes sense only for relatively large DBs where much data changes slowly.
  - Only possible if replay would begin from a later checkpoint than for the previous backup. On primary always true (each backup triggers a checkpoint). On a standby, replay begins from the most recent restartpoint -> can fail if little activity.
- **Low-level API** (multiple backups can run concurrently, including with pg_basebackup):
  1. Ensure WAL archiving is enabled and working.
  2. `SELECT pg_backup_start(label => 'label', fast => false);` (superuser or EXECUTE grant). The calling connection must be kept open until the end or the backup is automatically aborted. Backups always start at the beginning of a checkpoint; default waits for the next scheduled checkpoint (governed by `checkpoint_timeout`, `checkpoint_completion_target`); `fast => true` requests an immediate checkpoint using as much I/O as possible.
  3. Copy files with tar/cpio etc. (not pg_dump). No need to stop normal operation.
  4. Same connection: `SELECT * FROM pg_backup_stop(wait_for_archive => true);` — ends backup mode; on a primary also switches to the next WAL segment (on a standby cannot; run `pg_switch_wal` on the primary). Returns one row with three values: (1) LSN/last required segment info, (2) contents to write to file `backup_label` in the backup root, (3) contents for `tablespace_map` (unless empty). Must be written byte-for-byte (binary mode).
  5. Done once WAL segments active during the backup are archived. On a primary with archive_mode enabled and wait_for_archive true, pg_backup_stop doesn't return until the last segment is archived; on a standby `archive_mode` must be `always` for it to wait. `statement_timeout` can bound it (but backup may be invalid). `wait_for_archive => false` returns as soon as the stop-backup record is written (use with caution).
- Backing up the data directory:
  - Files changing during copy is normal. GNU tar >= 1.16 exits 1 if a file changed, 2 for other errors; >= 1.23 `--warning=no-file-changed --warning=no-file-removed`. rsync has a separate exit code for vanished source files.
  - Include all files under the cluster directory and all tablespaces (archive symlinks as links).
  - Omit: `pg_wal/` contents; `postmaster.pid`, `postmaster.opts`; often `pg_replslot/` contents (else slots become part of the backup -> indefinite WAL retention on the standby and bloat on primary with hot_standby_feedback); contents of `pg_dynshmem/`, `pg_notify/`, `pg_serial/`, `pg_snapshots/`, `pg_stat_tmp/`, `pg_subtrans/` (keep the directories); anything beginning with `pgsql_tmp`; `pg_internal.init` files (relcache data, always rebuilt).
  - `backup_label`: label string, time pg_backup_start ran, name of starting WAL file. `tablespace_map`: symlink names in `pg_tblspc/` and full path of each. Both are critical to recovery.
  - Backup while server stopped is possible (no pg_backup_start/stop).

### Recovery (PITR) procedure  [M7]  (source: continuous-archiving.txt 25.3.5)
1. Stop the server.
2. If space allows, copy the whole cluster data dir + tablespaces to a temp location; at minimum save `pg_wal` contents (may hold unarchived WAL).
3. Remove all existing files/subdirectories under the data directory and tablespace roots.
4. Restore the backup files (right ownership: database system user, not root; right permissions; verify `pg_tblspc/` symlinks). For an incremental backup: restore it and all backups it depends on to separate directories, then `pg_combinebackup` to write a synthetic full backup into the target.
5. Remove any files in `pg_wal/` (from the backup, obsolete). Recreate pg_wal (as symlink if it was).
6. Copy (not move) unarchived WAL segments saved in step 2 into `pg_wal/`.
7. Set recovery settings in `postgresql.conf` (Section 19.5.5) and create `recovery.signal` in the data directory. Optionally lock down `pg_hba.conf`.
8. Start the server. It enters recovery mode and reads archived WAL. If terminated by external error, just restart and it continues. On completion the server removes `recovery.signal` and begins normal operation.
9. Inspect; if not right go back to step 1; else restore pg_hba.conf.
- `restore_command` is the one mandatory setting: `%f` = name of desired WAL file, `%p` = path to copy it to (relative to data dir), `%%`. e.g. `restore_command = 'cp /mnt/server/archivedir/%f %p'`.
- Must return nonzero on failure; it WILL be asked for files not in the archive (not an error). If killed by a signal (other than SIGTERM) or shell error (command not found), recovery aborts and the server does not start.
- Requests include `.history` files. Base name of `%p` differs from `%f`.
- Segments not found in the archive are sought in `pg_wal/`; archive copies are preferred over pg_wal copies.
- Normal recovery ends with a "file not found" message; an error for `00000001.history` at start is also normal.
- Recovery target: by date/time, named restore point, or completion of a specific transaction ID (docs: only date/time and named restore point are "very usable"). (GUCs: recovery_target_time, recovery_target_name, recovery_target_xid, recovery_target_lsn, recovery_target = 'immediate' — defined in 19.5.5.)
- The stop point must be AFTER the end time of the base backup (end of pg_backup_stop). Cannot recover to a time while that backup was in progress.
- Corrupted WAL: recovery halts and the server won't start; re-run with a target before the corruption. External failure: restart; it resumes almost where it failed — recovery restart works like checkpointing: the server periodically forces state to disk and updates `pg_control` (restartpoints).

### Timelines  [M7]  (source: continuous-archiving.txt 25.3.6)
- Whenever an archive recovery completes, a new timeline is created to identify WAL generated after that recovery. Timeline ID is part of WAL segment file names so a new timeline does not overwrite previous timelines' WAL. In `0000000100001234000055CD` the leading `00000001` is the timeline ID in hexadecimal (log messages usually print timeline IDs in decimal).
- Each new timeline gets a **timeline history file** (which timeline it branched from and when), archived like WAL segments; small text files; keep indefinitely; you may add comments.
- Default: recover to the latest timeline found in the archive. `recovery_target_timeline` = `current` (timeline of the base backup) or a specific timeline ID. Cannot recover into timelines that branched off earlier than the base backup.

### PITR tips and caveats  [M7]  (source: continuous-archiving.txt 25.3.7-25.3.8)
- Standalone hot backup: `pg_basebackup -X ...` includes required WAL; not usable for PITR; faster but larger than pg_dump.
- Compressed archive: `archive_command = 'gzip < %p > /mnt/server/archivedir/%f.gz'`, `restore_command = 'gunzip < /mnt/server/archivedir/%f.gz > %p'`.
- Script: `archive_command = 'local_backup_script.sh "%p" "%f"'` (off-site copy, batching, integration, error reporting). Enable `logging_collector` so script stderr lands in the server log.
- Caveats:
  - CREATE DATABASE during a base backup + later modification of the template DB while backup in progress may propagate those modifications into the created DB on recovery -> don't modify template databases during a base backup.
  - CREATE TABLESPACE is WAL-logged with the literal absolute path -> replay on another machine or into a new data dir overwrites/creates at the same path. Take a new base backup after creating/dropping tablespaces.
  - Default WAL is bulky due to full-page snapshots; `full_page_writes = off` shrinks archived WAL and does not prevent PITR (but read ch.28 warnings); or increase checkpoint interval to reduce page snapshots.

### HA / replication terminology  [M7]  (source: high-availability.txt)
- High availability = second server takes over quickly when primary fails; load balancing = several computers serve the same data. Read-only servers are easy to combine; the hard part is the **synchronization problem**: a write to any server must be propagated to all.
- Terms: servers that can modify data = read/write, master or **primary**; servers that track changes = **standby** or secondary. **Warm standby** = cannot be connected to until promoted. **Hot standby** = accepts connections and serves read-only queries.
- **Synchronous** = a data-modifying transaction is not considered committed until all servers have committed it (failover loses no data; consistent results from any server). **Asynchronous** = delay between commit and propagation (possible loss on switch; slightly stale reads).
- Granularity: whole server vs per-table vs per-database. Performance trade-off: fully synchronous over a slow network "might cut performance by more than half".

### Comparison of replication solutions  [M7]  (source: different-replication-solutions.txt)
- **Shared Disk Failover**: one copy of DB on a shared disk array; standby mounts and starts as if recovering from crash; rapid failover, no data loss. Limitation: disk array failure kills both; standby must never access storage while primary runs. NFS needs full POSIX behavior.
- **File System (Block Device) Replication**: FS changes mirrored to another computer; writes must be applied in the same order. Example: DRBD.
- **Write-Ahead Log Shipping**: standby reads WAL stream; sync or async; entire database server only. File-based log shipping or streaming replication or both.
- **Logical Replication**: stream of logical data modifications constructed from WAL; per-table; a publisher can also subscribe (multi-directional). Logical decoding interface (ch.47) lets extensions do similar.
- **Trigger-Based Primary-Standby Replication**: per-table, typically async, standbys answer queries; e.g. Slony-I (async batches -> possible data loss on failover).
- **SQL-Based Replication Middleware**: program intercepts every SQL query and sends to one or all servers; read-write to all, read-only to one. Problem: `random()`, `CURRENT_TIMESTAMP`, sequences differ per server; need two-phase commit (PREPARE TRANSACTION / COMMIT PREPARED). Examples: Pgpool-II, Continuent Tungsten.
- **Asynchronous Multimaster Replication**: each server works independently, periodically communicates to identify conflicts, resolved by users or rules. Example: Bucardo.
- **Synchronous Multimaster Replication**: every server accepts writes; data transmitted to every other server before commit; heavy writes -> excessive locking and commit delays; best for mostly-read workloads. PostgreSQL does not offer this; two-phase commit can be used to build it.
- Table 26.1 feature matrix (columns: Shared Disk | File System Repl. | WAL Shipping | Logical Repl. | Trigger-Based Repl. | SQL Repl. Middleware | Async MM | Sync MM):

  | Feature | Shared Disk | FS Repl. | WAL Shipping | Logical Repl. | Trigger-Based | SQL Middleware | Async MM | Sync MM |
  |---|---|---|---|---|---|---|---|---|
  | Popular examples | NAS | DRBD | built-in streaming repl. | built-in logical repl., pglogical | Londiste, Slony | pgpool-II | Bucardo | |
  | Comm. method | shared disk | disk blocks | WAL | logical decoding | table rows | SQL | table rows | table rows and row locks |
  | No special hardware required | | yes | yes | yes | yes | yes | yes | yes |
  | Allows multiple primary servers | | | | yes | | yes | yes | yes |
  | No overhead on primary | yes | | yes | yes | | yes | | |
  | No waiting for multiple servers | yes | | with sync off | with sync off | yes | | yes | |
  | Primary failure will never lose data | yes | yes | with sync on | with sync on | | yes | | yes |
  | Replicas accept read-only queries | | | with hot standby | yes | yes | yes | yes | yes |
  | Per-table granularity | | | | yes | yes | | yes | yes |
  | No conflict resolution necessary | yes | yes | yes | | yes | yes | | yes |
- Others: **Data Partitioning** (each data set modifiable by only one server, e.g. London/Paris offices); **Multiple-Server Parallel Query Execution** (split data among servers; PL/Proxy).

### Log-shipping standby servers (warm standby)  [M7]  (source: warm-standby.txt intro, 26.2.1-26.2.4)
- Primary runs in continuous archiving mode; each standby in continuous recovery mode reading the primary's WAL. Loosely coupled; no table changes required; low overhead on primary.
- File-based log shipping transfers one WAL segment (16MB) at a time. Record-based = streaming.
- Log shipping is asynchronous (WAL shipped after commit) -> data-loss window; with file-based shipping bound it with `archive_timeout` (can be a few seconds, at bandwidth cost). Streaming gives a much smaller window.
- Restoring from an archived base backup + rollforward is disaster recovery, not HA.
- Planning: primary and standby as similar as possible. Tablespace path names pass across unmodified -> same mount paths; mount points must exist on primary and all standbys BEFORE CREATE TABLESPACE. Hardware architecture must be the same (32-bit -> 64-bit won't work). Different major versions: not possible. Different minor versions likely work but no formal support; upgrade standbys first (a newer minor release is more likely to read older WAL than vice versa).
- **Standby mode**: entered if `standby.signal` exists in the data directory at start.
- Standby WAL source loop (state machine):
  1. Restore all WAL available from the archive via `restore_command`.
  2. When that fails, try WAL in `pg_wal`.
  3. If that fails and streaming is configured, connect to primary and stream from the last valid record found.
  4. If that fails / not configured / connection later drops -> back to step 1. Loop continues until server stopped or promoted.
- Exit standby mode: `pg_ctl promote` or `pg_promote()`. Before failover, WAL immediately available in archive or pg_wal is restored, but no attempt is made to connect to the primary.
- Preparing the primary: continuous archiving to a location accessible from the standby even when primary is down (not on the primary). For streaming: a role + `pg_hba.conf` entry with database field `replication`; `max_wal_senders` large enough; `max_replication_slots` if slots used. Take a base backup.
- Setting up the standby: restore base backup; create `standby.signal`; set `restore_command`; for multiple standbys keep `recovery_target_timeline = latest` (default) so standbys follow the timeline change at failover. `restore_command` should return immediately if the file doesn't exist. `primary_conninfo` = libpq connection string (password included if needed). Configure archiving/connections/auth like the primary since it becomes one after failover. `archive_cleanup_command` + `pg_archivecleanup` trims the archive (`%r`).
  ```
  primary_conninfo = 'host=192.168.1.50 port=5432 user=foo password=foopass options=''-c wal_sender_timeout=5000'''
  restore_command = 'cp /path/to/archive/%f %p'
  archive_cleanup_command = 'pg_archivecleanup /path/to/archive %r'
  ```

### Streaming replication  [M7, M1]  (source: warm-standby.txt 26.2.5)
- Standby connects to primary, which streams WAL records as they are generated without waiting for the WAL file to fill. Asynchronous by default; delay "typically under one second". `archive_timeout` not needed.
- Without archiving, primary may recycle old WAL before the standby got it -> standby must be reinitialized from a new base backup. Avoid via `wal_keep_size` or a replication slot (or an accessible WAL archive).
- Turning a file-based standby into streaming: set `primary_conninfo`. On the primary set `listen_addresses` and pg_hba for the `replication` pseudo-database.
- `tcp_keepalives_idle`, `tcp_keepalives_interval`, `tcp_keepalives_count` help primary notice broken connections.
- Processes: **walreceiver** on standby, **walsender** on primary.
- Authentication: standby authenticates as a role with `REPLICATION` privilege or superuser; recommend dedicated role with REPLICATION and LOGIN. REPLICATION gives very high permissions (can read WAL stream = privileged info) but cannot modify data.
  ```
  # TYPE  DATABASE        USER            ADDRESS                 METHOD
  host    replication     foo             192.168.1.100/32        scram-sha-256
  ```
  Password may also be in `~/.pgpass` on standby (database field `replication`).
- Monitoring: lag = `pg_current_wal_lsn()` on primary vs `pg_last_wal_receive_lsn()` on standby. `pg_stat_replication` (one row per walsender): big gap between pg_current_wal_lsn and `sent_lsn` -> primary under heavy load; gap between `sent_lsn` and standby's pg_last_wal_receive_lsn -> network delay or loaded standby. On standby `pg_stat_wal_receiver`: big gap between `pg_last_wal_replay_lsn()` and `flushed_lsn` -> WAL received faster than replayed. WAL receiver's ps title also shows last receive location.

### Replication slots  [M7]  (source: warm-standby.txt 26.2.6)
- Purpose: automated guarantee that the primary does not remove WAL segments until received by all standbys, AND does not remove rows that could cause a recovery conflict even when the standby is disconnected.
- Alternatives: `wal_keep_size` or archive — retain more WAL than needed; slots retain only what is known to be needed. `hot_standby_feedback` alone protects rows only while the standby is connected.
- Caution: slots can retain so much WAL that `pg_wal` fills; `max_slot_wal_keep_size` limits WAL retained by slots.
- Slot names: lower-case letters, numbers, underscore. View: `pg_replication_slots`. Create/drop via replication protocol or SQL functions.
  ```sql
  SELECT * FROM pg_create_physical_replication_slot('node_a_slot');
  SELECT slot_name, slot_type, active FROM pg_replication_slots;
  ```
  Standby: `primary_slot_name = 'node_a_slot'`.

### Cascading replication  [M7]  (source: warm-standby.txt 26.2.7)
- A standby can accept replication connections and stream WAL to other standbys (relay) = **cascading standby**. Upstream = closer to primary; downstream = further. Each standby connects to exactly one upstream.
- Cascading standby sends WAL received from primary AND WAL restored from archive.
- Currently asynchronous only; synchronous replication settings have no effect on cascading.
- Hot standby feedback propagates upstream regardless of arrangement.
- If an upstream standby is promoted, downstream servers continue from it if `recovery_target_timeline = 'latest'`.
- Setup: on cascading standby set `max_wal_senders`, `hot_standby`, pg_hba; downstream `primary_conninfo` points to it.

### Synchronous replication  [M7]  (source: warm-standby.txt 26.2.8)
- Default async: committed transactions may be lost on primary crash; loss proportional to replication delay.
- Sync replication confirms all changes of a transaction were transferred to one or more synchronous standbys. Called **2-safe** replication; **group-1-safe** when `synchronous_commit = remote_write`.
- Each write-transaction commit waits until the commit record is written to WAL on disk of both primary and standby. Data lost only if both crash simultaneously. Minimum wait = network round-trip time.
- Do NOT wait: read-only transactions, rollbacks, subtransaction commits (only top-level commits wait). Long-running actions (data load, index build) wait only at the final commit. ALL two-phase commit actions wait (both prepare and commit).
- A synchronous standby can be a physical standby, a logical subscriber, or any WAL stream consumer that sends proper feedback (pg_receivewal, pg_recvlogical, third party).
- Basic config: set `synchronous_standby_names` non-empty; `synchronous_commit = on` (default). `synchronous_commit` is user-settable -> per-transaction durability control.
- Flow: commit record written to disk on primary -> WAL sent to standby -> standby replies each time a new batch of WAL is written to disk (unless `wal_receiver_status_interval = 0` on standby). With `remote_apply` standby replies when commit record is replayed.
- **synchronous_commit levels** (as documented here plus ch.28):
  - `off`: no wait even for local flush (async commit; see WAL section).
  - `local`: wait for local WAL flush only.
  - `remote_write`: wait until standby has received the commit record and written it out to its OS, not flushed. Standby could lose data on OS crash (not PostgreSQL crash). Data loss only if both primary and standby crash and primary's database is corrupted at the same time.
  - `on`: wait until standby has flushed the commit record to durable storage.
  - `remote_apply`: wait until current sync standbys report they replayed the transaction (visible to queries) -> load balancing with causal consistency.
- Named standbys must be directly connected to primary; primary knows nothing about cascaded downstreams.
- Users stop waiting if a fast shutdown is requested; but server doesn't fully shut down until all outstanding WAL is transferred to currently connected standbys.
- Multiple sync standbys:
  - `synchronous_standby_names = 'FIRST 2 (s1, s2, s3)'` — **priority-based**: wait for the requested number of standbys chosen by priority (earlier in list = higher). With s1..s4 running: s1,s2 synchronous; s3 potential (takes over if s1 or s2 fails, immediately); s4 async (not listed).
  - `synchronous_standby_names = 'ANY 2 (s1, s2, s3)'` — **quorum-based**: wait for replies from at least any 2 of the listed.
  - Sync states visible in `pg_stat_replication` (`sync_state`: async / potential / sync / quorum).
- Performance: waiting uses no resources but transaction locks stay held until confirmed -> more contention. Use per-transaction synchronous_commit (e.g. 10% important customer details sync, 90% chat messages async). Network bandwidth must exceed WAL generation rate.
- HA planning: commits may never complete if a required sync standby crashes -> name multiple potential sync standbys. New standby is in **catchup** mode until lag reaches zero the first time, then **streaming**; can become synchronous only once in streaming state (`pg_stat_replication.state`).
- If primary restarts while commits wait for acknowledgment, those transactions are marked fully committed once primary recovers. No way to be sure all standbys received all WAL at crash. Guarantee: the application will not receive explicit acknowledgment of a successful commit until WAL is known safely received by all sync standbys.
- If you can't keep enough sync standbys: reduce number in `synchronous_standby_names` (or disable) and reload.
- Re-creating a standby while transactions wait: run `pg_backup_start()`/`pg_backup_stop()` in a session with `synchronous_commit = off`, else they wait forever.

### Continuous archiving in standby  [M7]  (source: warm-standby.txt 26.2.9)
- `archive_mode = always`: standby calls archive command for every WAL segment it receives (from archive restore or streaming). Shared archive: archive command must test existence and identical contents, race-free.
- `archive_mode = on`: archiver not enabled during recovery/standby. After promotion it archives, but NOT WAL or timeline history files it did not generate. Outside recovery, `on` and `always` are identical.

### Failover  [M7]  (source: warm-standby-failover.txt)
- Standby failure: no failover; restart recovery (restartable recovery) or build a new standby.
- After failover, old primary must be told it is no longer primary: **STONITH** (Shoot The Other Node In The Head) to avoid split-brain (both think they are primary -> data loss).
- Heartbeat between two systems; optional third **witness server**.
- PostgreSQL does not provide failure detection/notification software (nor IP migration).
- After failover = **degenerate state** (single server). Recreate a standby; `pg_rewind` speeds this on large clusters.
- Regular switchover is useful (maintenance + tests failover).
- With logical slot synchronization, check synced logical slots are failover-ready before switching (29.3).
- Trigger failover: `pg_ctl promote` or `pg_promote()`. Read-only reporting standbys needn't be promoted.

### Hot standby: what users can and cannot do  [M7, M5]  (source: hot-standby.txt 26.4.1)
- Hot standby = ability to connect and run read-only queries while in archive recovery or standby mode; also the ability to move from recovery to normal operation while users keep connections.
- `hot_standby = true` (default on): accepts connections once recovery reaches a consistent state. Strictly read-only; not even temp tables can be written.
- Data is **eventually consistent** with the primary; once a transaction's commit record is replayed, its changes are visible to new snapshots.
- Allowed: SELECT, COPY TO; DECLARE, FETCH, CLOSE; SHOW, SET, RESET; BEGIN, END, ABORT, START TRANSACTION; SAVEPOINT, RELEASE, ROLLBACK TO SAVEPOINT; EXCEPTION blocks and other internal subtransactions; LOCK TABLE only explicitly in ACCESS SHARE, ROW SHARE or ROW EXCLUSIVE; PREPARE, EXECUTE, DEALLOCATE, DISCARD; LOAD; UNLISTEN.
- Hot-standby transactions are never assigned an XID and cannot write WAL. Errors for:
  - DML: INSERT, UPDATE, DELETE, MERGE, COPY FROM, TRUNCATE (even on temp tables — rows can't be read/written without an XID). No trigger can fire during recovery.
  - DDL: CREATE, DROP, ALTER, COMMENT (even temp tables — need catalog updates).
  - SELECT ... FOR SHARE | UPDATE (row locks require updating data files).
  - Rules on SELECT that generate DML.
  - LOCK requesting a mode higher than ROW EXCLUSIVE; short-form LOCK (requests ACCESS EXCLUSIVE).
  - BEGIN READ WRITE, START TRANSACTION READ WRITE, SET TRANSACTION READ WRITE, SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE, SET transaction_read_only = off.
  - PREPARE TRANSACTION, COMMIT PREPARED, ROLLBACK PREPARED (even read-only transactions write WAL in prepare phase).
  - nextval(), setval().
  - LISTEN, NOTIFY (allowed in ordinary read-only transactions; hot standby is tighter).
- `transaction_read_only` is always true and unchangeable during hot standby. After promotion sessions stay connected and can start read-write transactions.
- `SHOW in_hot_standby` (exists since v14; before that use `SHOW transaction_read_only`).

### Hot standby query conflicts  [M7, M5]  (source: hot-standby.txt 26.4.2)
- Hard conflict cases (queries may be canceled, sometimes sessions disconnected):
  1. ACCESS EXCLUSIVE locks taken on primary (explicit LOCK and DDL) vs table accesses in standby queries.
  2. Dropping a tablespace on primary vs standby queries using it for temp work files.
  3. Dropping a database on primary vs sessions connected to that DB on standby.
  4. Applying a vacuum cleanup record vs standby transactions whose snapshots can still see any of the rows to be removed.
  5. Applying a vacuum cleanup record vs queries accessing the target page on the standby, whether or not the data to be removed is visible (buffer pin conflict).
- On primary these just wait; on standby the WAL-logged action already happened so it must be applied: standby either delays WAL apply or cancels the query.
- `max_standby_archive_delay` (WAL read from archive) and `max_standby_streaming_delay` (WAL via streaming): maximum allowed delay in WAL application; conflicting queries canceled once applying newly-received WAL has taken longer than the setting. `-1` = wait forever; `0` very aggressive. (Default 30s each — UNVERIFIED, from prior knowledge, not stated on these pages.)
- The delay is measured from the time the WAL data was RECEIVED by the standby -> grace period for any one query is never more than the delay parameter and can be much less if standby is already behind.
- Cancellation usually = error; replay of DROP DATABASE terminates whole session; conflict over a lock held by an idle transaction terminates the session.
- Canceled queries may be retried immediately.
- Most common cause: **"early cleanup"** — primary removes row versions still visible to a standby transaction.
- Also: index-only scans must use an MVCC snapshot that "agrees" with the visibility map, so conflicts are required whenever VACUUM sets a page all-visible containing rows not visible to all standby queries — even VACUUM on a table with no dead rows can conflict.
- Heavily updated tables on primary quickly cancel long standby queries; a finite delay behaves like `statement_timeout`.
- Remedy: `hot_standby_feedback` — prevents VACUUM from removing recently-dead rows (no cleanup conflicts), at the cost of delayed cleanup/bloat on primary (no worse than if queries ran on primary). For frequently disconnecting standbys also raise max_standby_archive_delay / max_standby_streaming_delay.
- Views: `pg_stat_database_conflicts` (on standby), summary in `pg_stat_database`. `log_recovery_conflict_waits` logs when WAL replay waits longer than `deadlock_timeout` for conflicts.

### Hot standby administration  [M7, M1]  (source: hot-standby.txt 26.4.3-26.4.5)
- Log lines: `LOG:  entering standby mode` ... `LOG:  consistent recovery state reached` / `LOG:  database system is ready to accept read-only connections`.
- Consistency information is recorded once per checkpoint on the primary. Hot standby impossible when reading WAL written while `wal_level` was not `replica` or `logical`.
- Recovery snapshot may not be ready if a write transaction has more than **64 subtransactions** AND there are very long-lived write transactions (close them on primary).
- Shared-memory-sizing parameters must be >= primary's on the standby: `max_connections`, `max_prepared_transactions`, `max_locks_per_transaction`, `max_wal_senders`, `max_worker_processes`. Increase on standbys first; decrease on primary first. WAL tracks changes; if insufficient the hot standby logs a warning and **pauses recovery** (`WARNING:  hot standby is not possible because of insufficient parameter settings` / `DETAIL:  max_connections = 80 is a lower setting than on the primary server, where its value was 100.` / `LOG:  recovery has paused` / `DETAIL:  If recovery is unpaused, the server will shut down.`). A non-hot standby shuts down immediately.
- **Hint bits** written on primary are not WAL-logged, so the standby rewrites hints itself -> standby still does disk writes. Also temp sort files and relcache info files. dblink writes and PL side effects outside the DB still possible.
- Not accepted in recovery: DDL (e.g. CREATE INDEX); GRANT, REVOKE, REASSIGN; ANALYZE, VACUUM, CLUSTER, REINDEX. So no standby-only indexes or statistics.
- `pg_cancel_backend()` / `pg_terminate_backend()` work on user backends but not the **startup process** (which performs recovery). `pg_stat_activity` does not show recovering transactions as active; `pg_prepared_xacts` is always empty during recovery.
- `pg_locks`: shows a virtual transaction managed by the startup process that owns all AccessExclusiveLocks held by transactions being replayed. The startup process does not take other locks; they're presumed to exist.
- WAL file control functions don't work in recovery (pg_backup_start, pg_switch_wal ...).
- Loadable modules work (pg_stat_statements). Advisory locks work normally incl. deadlock detection; never WAL-logged, local to the server.
- Trigger-based replication (Slony, Londiste, Bucardo) can't run on the standby. New OIDs cannot be assigned.
- DROP TABLESPACE replay: if temp files exist in it, all active queries are canceled.
- DROP DATABASE or ALTER DATABASE ... SET TABLESPACE on primary: all users connected to that DB on standby are forcibly disconnected immediately, regardless of max_standby_streaming_delay. ALTER DATABASE ... RENAME does not disconnect.
- DROP USER/ROLE on primary doesn't disconnect that user on standby.
- Cumulative stats system is active during recovery (scans, reads recorded), but WAL replay does not increment relation/database counters (n_tup_ins etc.), nor are startup-process I/Os tracked in pg_statio_ views.
- Autovacuum is not active during recovery. Checkpointer performs **restartpoints**; bgwriter does normal block cleaning. `CHECKPOINT` command in recovery performs a restartpoint.
- Parameter scope: on primary `wal_level`; on standby `hot_standby`, `max_standby_archive_delay`, `max_standby_streaming_delay` (no effect on primary).
- Caveats: (1) transactions with > 64 subtransactions delay the start of read-only connections until the longest-running write transaction completes; (2) valid starting points for standby queries are generated at each checkpoint on primary — if standby shuts down while primary is shut down it may not re-enter hot standby until the primary starts; (3) at end of recovery AccessExclusiveLocks held by prepared transactions need twice the normal lock table entries -> consider up to 2x `max_locks_per_transaction` (ignore if max_prepared_transactions = 0); (4) **Serializable isolation level is not available in hot standby** (error).

### Monitoring: Unix tools and process titles  [M1, M7]  (source: monitoring.txt, monitoring-ps.txt)
- Tools: `ps`, `top`, `iostat`, `vmstat`, plus EXPLAIN for individual queries.
- PostgreSQL modifies its process title. Sample `ps auxww | grep ^postgres`:
  ```
  postgres  15551 ... postgres -i                              <- primary server process (postmaster)
  postgres  15554 ... postgres: background writer
  postgres  15555 ... postgres: checkpointer
  postgres  15556 ... postgres: walwriter
  postgres  15557 ... postgres: autovacuum launcher
  postgres  15582 ... postgres: joe runbug 127.0.0.1 idle
  postgres  15606 ... postgres: tgl regression [local] SELECT waiting
  postgres  15610 ... postgres: tgl regression [local] idle in transaction
  ```
- Client backend title format: `postgres: user database host activity`. Activity = `idle`, `idle in transaction`, or a command type name such as `SELECT`; `waiting` is appended if the process is waiting on a lock held by another session (use `pg_locks` to see who blocks whom).
- With `cluster_name` set: `postgres: server1: background writer`.
- `update_process_title = off`: title set only once at process launch (saves per-command overhead on some platforms).
- Solaris: use `/usr/ucb/ps` with two `w` flags.

### Cumulative statistics system: mechanics  [M7, M1]  (source: monitoring-stats.txt 27.2.1-27.2.2)
- Counts table and index accesses in disk-block and row terms; row totals per table; vacuum/analyze actions; optionally function calls and time. Dynamic "what is happening right now" reporting (pg_stat_activity) is independent of the cumulative stats system.
- Config GUCs: `track_activities` (current command), `track_cost_delay_timing` (cost-based vacuum delay; PG18 tag UNVERIFIED), `track_counts` (table/index access stats; required by autovacuum), `track_functions`, `track_io_timing` (block read/write/extend/fsync times), `track_wal_io_timing` (WAL read/write/fsync times). Settable per session with SET by superusers only.
- Stats are collected in **shared memory** (no stats collector process since PG15). Each process collects locally, then updates shared data at intervals. On clean shutdown (including physical replicas) a permanent copy is written to `pg_stat` subdirectory. On unclean start (immediate shutdown, crash, starting from a base backup, PITR) **all statistics counters are reset**.
- Staleness: each process flushes accumulated stats to shared memory just before going idle, but not more often than once per `PGSTAT_MIN_INTERVAL` ms (1 second by default) -> a query/transaction in progress does not affect displayed totals. `track_activities` info is always up-to-date.
- `stats_fetch_consistency`: default `cache` — accessed values cached until end of the current transaction (repeatable within a transaction); `snapshot` — whole snapshot at first access (minimizes skew, more memory); `none` — no caching. `pg_stat_clear_snapshot()` discards snapshot/cache.
- A transaction can see its own unflushed stats in `pg_stat_xact_all_tables`, `pg_stat_xact_sys_tables`, `pg_stat_xact_user_tables`, `pg_stat_xact_user_functions` (update continuously).
- Security: ordinary users see full info only for their own sessions (sessions of roles they are a member of); other rows have many NULL columns, though existence, user and database are visible. Superusers and members of `pg_read_all_stats` see everything.
- Cache hit ratio: pg_stat_io and pg_statio_* views. PostgreSQL I/O stats cannot distinguish disk fetches from kernel page cache hits.
- Warning: `pg_stat_reset()` also resets the counters autovacuum uses to decide when to vacuum/analyze -> may cause bloat or stale stats; run a database-wide ANALYZE after resetting.
- Full view/column inventory and wait event inventory: see "Complete inventories".

### Viewing locks  [M5, M7]  (source: monitoring-locks.txt)
- `pg_locks` shows outstanding locks in the lock manager: all locks, locks on relations in a database, on a particular relation, or held by a session; find the relation with the most ungranted locks (contention); gauge effect of contention. Details in Section 53.13; concurrency in ch.13.

### Progress reporting views  [M7, M4]  (source: progress-reporting.txt)
- Commands supporting progress reporting: ANALYZE, CLUSTER, CREATE INDEX, VACUUM, COPY, and BASE_BACKUP (replication command issued by pg_basebackup).
- **pg_stat_progress_analyze**: `pid`, `datid`, `datname`, `relid`, `phase`, `sample_blks_total`, `sample_blks_scanned`, `ext_stats_total`, `ext_stats_computed`, `child_tables_total`, `child_tables_done`, `current_child_table_relid`, `delay_time double precision` (ms slept for cost-based delay; needs `track_cost_delay_timing`; PG18 tag UNVERIFIED).
  - Phases: `initializing` -> `acquiring sample rows` -> `acquiring inherited sample rows` -> `computing statistics` -> `computing extended statistics` -> `finalizing analyze` (updating pg_class).
  - ANALYZE on a partitioned table without ONLY recursively analyzes partitions: progress first for the parent (inheritance stats), then each partition.
- **pg_stat_progress_cluster** (CLUSTER and VACUUM FULL): `pid`, `datid`, `datname`, `relid`, `command` (CLUSTER or VACUUM FULL), `phase`, `cluster_index_relid` (0 if not using an index), `heap_tuples_scanned`, `heap_tuples_written`, `heap_blks_total`, `heap_blks_scanned`, `index_rebuild_count`.
  - Phases: `initializing`, `seq scanning heap`, `index scanning heap`, `sorting tuples`, `writing new heap`, `swapping relation files`, `rebuilding index`, `performing final cleanup`.
- **pg_stat_progress_copy**: `pid`, `datid`, `datname`, `relid` (0 if copying from a SELECT), `command` (`COPY FROM` / `COPY TO`), `type` (`FILE`, `PROGRAM`, `PIPE` for STDIN/STDOUT, `CALLBACK` e.g. logical replication initial table sync), `bytes_processed`, `bytes_total` (source file size for COPY FROM; 0 if unavailable), `tuples_processed`, `tuples_excluded` (by WHERE clause), `tuples_skipped` (malformed data; only when ON_ERROR is not `stop`).
- **pg_stat_progress_create_index** (CREATE INDEX / REINDEX): `pid`, `datid`, `datname`, `relid`, `index_relid` (0 during non-concurrent CREATE INDEX), `command` (CREATE INDEX, CREATE INDEX CONCURRENTLY, REINDEX, REINDEX CONCURRENTLY), `phase`, `lockers_total`, `lockers_done`, `current_locker_pid`, `blocks_total`, `blocks_done`, `tuples_total`, `tuples_done`, `partitions_total`, `partitions_done`.
  - Phases (in order; many concurrent-only): `initializing`; `waiting for writers before build` (CIC/RIC waits for transactions with write locks that can potentially see the table); `building index` (AM-specific subphase reported in this column); `waiting for writers before validation`; `index validation: scanning index`; `index validation: sorting tuples`; `index validation: scanning table`; `waiting for old snapshots`; `waiting for readers before marking dead` (REINDEX CONCURRENTLY); `waiting for readers before dropping` (REINDEX CONCURRENTLY).
- **pg_stat_progress_vacuum** (VACUUM incl. autovacuum workers; VACUUM FULL is reported in pg_stat_progress_cluster since it rewrites the table): `pid`, `datid`, `datname`, `relid`, `phase`, `heap_blks_total` (as of scan start), `heap_blks_scanned` (VM-skipped blocks are included so it eventually equals heap_blks_total), `heap_blks_vacuumed` (blocks with no dead tuples skipped -> jumps), `index_vacuum_count` (completed index vacuum cycles), `max_dead_tuple_bytes` (dead tuple data storable before an index vacuum cycle is needed, based on maintenance_work_mem), `dead_tuple_bytes` (collected since last index vacuum cycle), `num_dead_item_ids`, `indexes_total`, `indexes_processed`, `delay_time` (includes parallel workers' sleep; reported at most once per second).
  - **VACUUM phases = the vacuum algorithm**:
    1. `initializing` — preparing to scan the heap.
    2. `scanning heap` — prune and defragment each page if required, possibly freeze.
    3. `vacuuming indexes` — at least once per vacuum if table has indexes, after heap fully scanned; multiple times if `maintenance_work_mem` (or `autovacuum_work_mem`) cannot hold the dead tuples found.
    4. `vacuuming heap` — distinct from scanning; occurs after each index-vacuum pass. If heap_blks_scanned < heap_blks_total, go back to scanning heap; else go on.
    5. `cleaning up indexes` — after heap completely scanned and all index/heap vacuuming done.
    6. `truncating heap` — return empty pages at the end of the relation to the OS.
    7. `performing final cleanup` — vacuum the free space map, update pg_class statistics, report stats to the cumulative statistics system.
- **pg_stat_progress_basebackup** (one row per WAL sender running BASE_BACKUP): `pid`, `phase`, `backup_total` (estimate before server-side compression; NULL with `--no-estimate-size`), `backup_streamed`, `tablespaces_total`, `tablespaces_streamed`.
  - Phases: `initializing`, `waiting for checkpoint to finish` (pg_backup_start), `estimating backup size`, `streaming database files`, `waiting for wal archiving to finish` (pg_backup_stop; ends here with `--wal-method=none|stream`), `transferring wal files` (`--wal-method=fetch`).

### Dynamic tracing (DTrace / SystemTap probes)  [M1, M7]  (source: dynamic-trace.txt)
- Probes are not compiled by default: configure with `--enable-dtrace`. DTrace available on Solaris, macOS, FreeBSD, NetBSD, Oracle Linux; SystemTap on Linux (probe names use double underscores instead of hyphens). Macro definitions in `src/include/utils/probes.h`.
- Built-in probes (Table 27.49) — complete list with parameters:
  - Transactions: `transaction-start(LocalTransactionId)`, `transaction-commit(LocalTransactionId)`, `transaction-abort(LocalTransactionId)`.
  - Query pipeline (mirrors parse -> rewrite -> plan -> execute): `query-start(const char *)`, `query-done`, `query-parse-start`, `query-parse-done`, `query-rewrite-start`, `query-rewrite-done` (all take query string), `query-plan-start()`, `query-plan-done()`, `query-execute-start()`, `query-execute-done()`, `statement-status(const char *)` (fires when a process updates its pg_stat_activity status).
  - Checkpoint (fire in this sequence): `checkpoint-start(int flags)` (flags distinguish shutdown, immediate, force), `clog-checkpoint-start(bool)`/`-done` (true = normal, false = shutdown checkpoint), `subtrans-checkpoint-start/done(bool)`, `multixact-checkpoint-start/done(bool)`, `buffer-checkpoint-start(int flags)`, `buffer-sync-start(int total_buffers, int dirty_to_write)`, `buffer-sync-written(int buffer_id)` (after each buffer), `buffer-sync-done(int total, int written_by_checkpointer, int expected)`, `buffer-checkpoint-sync-start()` (after dirty buffers written to kernel, before fsync requests), `buffer-checkpoint-done()`, `twophase-checkpoint-start()/done()`, `checkpoint-done(int buffers_written, int total_buffers, int wal_added, int wal_removed, int wal_recycled)`.
  - Buffers: `buffer-extend-start(ForkNumber, BlockNumber, Oid tablespace, Oid database, Oid relation, int backend, unsigned int nblocks)`, `buffer-extend-done(..., BlockNumber first_new_block)`, `buffer-read-start(ForkNumber, BlockNumber, Oid, Oid, Oid, int)`, `buffer-read-done(..., bool found_in_pool)`, `buffer-flush-start(ForkNumber, BlockNumber, Oid, Oid, Oid)`, `buffer-flush-done` (only time to hand data to kernel). Backend id = creator of temp relation for local buffer, or INVALID_PROC_NUMBER (-1) for shared buffer.
  - WAL: `wal-buffer-write-dirty-start()` (a server process writes a dirty WAL buffer because no WAL buffer space is available; frequent -> `wal_buffers` too small), `wal-buffer-write-dirty-done()`, `wal-insert(unsigned char rmid, unsigned char info)`, `wal-switch()`.
  - Storage manager: `smgr-md-read-start/done`, `smgr-md-write-start/done` (done: bytes actually read/written vs requested -> short read/write).
  - Sort: `sort-start(int kind [heap/index/datum], bool unique, int nkeys, int workmem_kB, bool random_access, int parallel [0 serial, 1 worker, 2 leader])`, `sort-done(bool external, long blocks_or_kB)`.
  - LWLocks: `lwlock-acquire(char *tranche, LWLockMode)`, `lwlock-release(char *)`, `lwlock-wait-start`, `lwlock-wait-done`, `lwlock-condacquire`, `lwlock-condacquire-fail`. Mode = exclusive or shared.
  - Heavyweight locks: `lock-wait-start(uint, uint, uint, uint tag fields, uint object type, LOCKMODE)`, `lock-wait-done`; `deadlock-found()`.
- Types (Table 27.50): LocalTransactionId = unsigned int; LWLockMode = int; LOCKMODE = int; BlockNumber = unsigned int; Oid = unsigned int; ForkNumber = int; bool = unsigned char.
- Defining a probe: add to `src/backend/utils/probes.d` (`probe transaction__start(LocalTransactionId);`), include `pg_trace.h`, call `TRACE_POSTGRESQL_TRANSACTION_START(vxid.localTransactionId);`. Arguments are evaluated even when not tracing -> guard expensive ones with `TRACE_POSTGRESQL_..._ENABLED()`.

### Monitoring disk usage  [M2, M7]  (source: diskusage.txt)
- Each table: primary heap file; maybe a TOAST table (with exactly one valid index); indexes. Each table and index is a separate disk file, more than one if it would exceed **one gigabyte**.
- Three ways: SQL size functions (Table 9.102, recommended), `oid2name`, catalog inspection.
- `SELECT pg_relation_filepath(oid), relpages FROM pg_class WHERE relname = 'customer';` -> `base/16384/16806 | 60`. Page typically 8 kB. `relpages` is only updated by VACUUM, ANALYZE and a few DDL commands such as CREATE INDEX.
- TOAST size query: join pg_class to `reltoastrelid` and its index via pg_index (`pg_toast_16806`, `pg_toast_16806_index`). Index sizes via pg_index (`indrelid`, `indexrelid`). Largest relations: `SELECT relname, relpages FROM pg_class ORDER BY relpages DESC;`
- Disk full: a filled data disk does not corrupt data but prevents activity; a full WAL disk can cause server PANIC and shutdown. Remedy: tablespaces on other file systems. Some file systems perform badly when almost full. Per-user disk quotas apply to the server's OS user.

### Reliability: caches, partial writes, what is checksummed  [M7, M2]  (source: wal.txt, wal-reliability.txt)
- Durability requirement: all data recorded by a committed transaction must be in nonvolatile storage safe from power loss, OS failure, hardware failure.
- Cache layers between RAM and platters: (1) OS buffer cache — PostgreSQL forces writes via `wal_sync_method`; (2) disk controller cache (RAID cards): write-through vs write-back; write-back is volatile unless it has a battery-backup unit (BBU); (3) drive cache — consumer IDE/SATA and many SSDs have volatile write-back caches.
- Disabling drive write cache: Linux `hdparm -I` (a `*` next to Write cache), `hdparm -W 0`; SCSI `sdparm --get=WCE`, `sdparm --clear=WCE`. FreeBSD `camcontrol identify`, `hw.ata.wc=0` in /boot/loader.conf. Solaris `format -e` (ZFS safe with write cache: issues its own flush). Windows: with `wal_sync_method = open_datasync` (default) uncheck "Enable write caching on the disk", or use `fdatasync` (NTFS only) or `fsync`. macOS: `wal_sync_method = fsync_writethrough`.
- SATA (ATAPI-6+) `FLUSH CACHE EXT`, SCSI `SYNCHRONIZE CACHE` — not directly accessible to PostgreSQL but file systems (ZFS, ext4) use them (write barriers). With BBU controllers this defeats the BBU benefit; `pg_test_fsync` detects; can turn off write barriers if battery is healthy.
- Many SSDs don't honor cache flush commands by default. Test with `diskchecker.pl`.
- **Partial page writes (torn pages)**: disk sectors are commonly 512 bytes; PostgreSQL typically writes 8192 bytes = 16 sectors at a time; power loss mid-write leaves some sectors new, some old. Guard: PostgreSQL periodically writes **full page images** to WAL before modifying the actual page on disk; crash recovery restores partially-written pages from WAL. If the file system prevents partial page writes (e.g. ZFS) you can set `full_page_writes = off`. BBU controllers do not prevent partial page writes unless they guarantee data is written to the BBU as full (8kB) pages.
- Corruption protection inventory:
  - Each WAL record: **CRC-32C** (32-bit), set at write, checked during crash recovery, archive recovery and replication.
  - Data pages: checksummed **by default** (PG18 tag UNVERIFIED); full page images in WAL records are always checksum-protected.
  - Not directly checksummed and not FPW-protected: `pg_xact`, `pg_subtrans`, `pg_multixact`, `pg_serial`, `pg_notify`, `pg_stat`, `pg_snapshots`; but where persistent, WAL records allow recent changes to be rebuilt at crash recovery.
  - `pg_twophase` state files: CRC-32C.
  - Temporary data files (sorts, materializations): not checksummed, not WAL-logged.
  - No protection against correctable memory errors: assume ECC RAM.

### Data checksums  [M2, M7]  (source: checksums.txt)
- By default data pages are protected by checksums (can be disabled at initdb). Checksum updated when the page is written and verified each time the page is read. Only data pages; not internal data structures or temp files.
- Cluster-level only (not per database/table). Enable/disable later only offline with `pg_checksums` (also verifies). `SHOW data_checksums` (read-only GUC). `ignore_checksum_failure` to bypass when recovering from corruption.

### WAL concept  [M7]  (source: wal-intro.txt)
- Central rule: changes to data files must be written only AFTER WAL records describing them have been flushed to permanent storage. Then data pages need not be flushed at every commit; after a crash, changes not applied to data pages are redone from WAL (**roll-forward recovery = REDO**).
- Tip: journaled file systems are not necessary for data/WAL reliability; journaling can reduce performance; e.g. mount ext3 with `data=writeback`. They do improve boot speed after crash.
- Fewer disk writes: only the WAL file must be flushed at commit; WAL is sequential so syncing is cheap; one fsync of WAL may commit many small concurrent transactions (group commit).
- Enables online backup and PITR; the physical backup need not be an instantaneous snapshot.

### Asynchronous commit  [M7]  (source: wal-async-commit.txt)
- Normal (synchronous) commit: server waits for the transaction's WAL records to be flushed before reporting success. Async commit: returns success as soon as the transaction is logically completed, before its WAL reaches disk. Big throughput gain for small transactions.
- Risk is **data loss, not corruption**: after a crash, recovery replays WAL up to the last flushed record -> self-consistent state lacking the last few transactions. Transactions replay in commit order, so if B depended on A, A cannot be lost while B is kept.
- Don't use when the client takes external actions assuming durability (bank ATM dispensing cash); fine for event logging.
- Controlled per transaction by user-settable `synchronous_commit`; the value at the time commit begins applies. Sync and async transactions can run concurrently.
- Some utility commands are forced synchronous regardless (e.g. `DROP TABLE` — to keep file system and logical state consistent). Two-phase commands such as `PREPARE TRANSACTION` are always synchronous.
- Risk window: the **WAL writer** flushes unwritten WAL every `wal_writer_delay` ms (default 200ms — UNVERIFIED, from prior knowledge, not stated on these pages); actual maximum risk window is **three times `wal_writer_delay`** because the WAL writer favors writing whole pages at a time during busy periods.
- Caution: immediate-mode shutdown = server crash -> loses unflushed async commits.
- vs `fsync = off`: fsync is server-wide, disables all write synchronization logic; an OS/hardware crash could cause arbitrarily bad corruption. Async commit gives most of the performance without corruption risk.
- vs `commit_delay`: commit_delay is a synchronous commit method (ignored during async commit); it delays just before the WAL flush so one flush can serve several transactions (group commit window).

### WAL configuration: checkpoints  [M7, M1]  (source: wal-configuration.txt)
- **Checkpoint** = point in the transaction sequence at which heap and index data files are guaranteed updated with all information written before it. At checkpoint time all dirty data pages are flushed to disk and a special checkpoint record is written to WAL. Crash recovery looks at the latest checkpoint record to find the **redo record** (point in WAL from which REDO starts). WAL segments preceding the one containing the redo record can be recycled or removed (after archiving if archiving).
- Checkpoint I/O is throttled: begins at checkpoint start, completes before the next is due.
- The **checkpointer** process starts a checkpoint every `checkpoint_timeout` seconds (default **5 minutes**) or when `max_wal_size` (default **1 GB**) is about to be exceeded, whichever first. If no WAL has been written since the previous checkpoint, new checkpoints are skipped even if checkpoint_timeout passed. `CHECKPOINT` SQL command forces one. To bound archive data loss use `archive_timeout`, not checkpoint parameters.
- Trade-off: more frequent checkpoints -> faster crash recovery but more dirty-page flushing; and with `full_page_writes` on (default) **the first modification of a data page after each checkpoint logs the entire page content** -> smaller checkpoint interval increases WAL volume.
- `checkpoint_warning`: if checkpoints happen closer together than this many seconds, a log message recommends increasing max_wal_size. Bulk COPY can trigger it.
- `checkpoint_completion_target` (default **0.9**): fraction of the checkpoint interval over which dirty buffer writes are spread; checkpoint finishes when that fraction of checkpoint_timeout has elapsed or before max_wal_size is exceeded, whichever sooner. Disadvantage: prolonging checkpoints means more WAL kept for recovery. Reducing it is not recommended (bursty I/O). Max 1.0 but not recommended above 0.9 (checkpoints include other activities; 1.0 likely causes late checkpoints).
- `checkpoint_flush_after` (Linux/POSIX): force OS to flush pages written by the checkpoint after a configurable number of bytes, avoiding a stall at the final fsync; can hurt workloads bigger than shared_buffers but smaller than OS page cache.
- **WAL segment count in pg_wal** depends on `min_wal_size`, `max_wal_size` and WAL generated in previous checkpoint cycles. Old segments are removed or **recycled** (renamed to become future segments). If max_wal_size is exceeded by a short peak, unneeded segments are removed until back under the limit. Below the limit, the system recycles enough files to cover the estimated need until the next checkpoint and removes the rest; estimate = moving average of WAL files used in previous cycles, raised immediately if actual usage exceeds it (tracks peak). `min_wal_size` = minimum amount always recycled for future use even when idle.
- `max_wal_size` is never a hard limit. Independently, the most recent `wal_keep_size` megabytes of WAL plus one additional WAL file are always kept. Segments are also retained until archived (archiving), until consumed by replication slots (slow/failed standby), and until summarized (WAL summarization).
- **Restartpoints** (archive recovery/standby): like checkpoints — force all state to disk, update `pg_control`, recycle old WAL in pg_wal. Can only be performed at checkpoint records, so not more often than checkpoints on the primary. Triggered by schedule (when a checkpoint record is reached and at least checkpoint_timeout seconds passed since the last restartpoint, or the previous attempt failed — then retried in 15 seconds) -> `restartpoints_timed`; or by request (mostly WAL size about to exceed max_wal_size) -> `restartpoints_req`; actually performed -> `restartpoints_done`. max_wal_size is often exceeded during recovery by up to one checkpoint cycle's worth of WAL. restartpoints_req can spike on a standby during massive INSERT on the primary (requests can't be performed until a safe checkpoint record is replayed) — normal.

### WAL configuration: internal functions, wal_buffers, group commit, sync method  [M7, M1]  (source: wal-configuration.txt)
- `XLogInsertRecord`: places a new record into the WAL buffers in shared memory. If no space, it must write (move to kernel cache) a few filled WAL buffers — undesirable because it runs on every low-level modification while an exclusive lock is held on affected data pages; may even force creation of a new WAL segment.
- `XLogFlush`: normally writes and flushes WAL buffers, mostly at transaction commit. With high WAL output, increase `wal_buffers` so XLogInsertRecord doesn't have to write. With full_page_writes and a busy system, higher wal_buffers smooths response times right after each checkpoint.
- `commit_delay` (microseconds, default 0): how long a **group commit leader** sleeps after acquiring a lock within XLogFlush while followers queue behind; lets others add commit records to WAL buffers to be flushed by the leader's sync. No sleep if `fsync` disabled or fewer than `commit_siblings` (default 5 — UNVERIFIED, from prior knowledge, not stated on these pages) other sessions are in active transactions. Sleep resolution may be 10 ms on some platforms (so 1..10000 µs behave the same).
  - Tuning: use `pg_test_fsync`; start at **half of the average time to flush after a single 8kB write**. Useful on high-latency rotating disks; can help on SSD/BBU too (use higher commit_siblings there). Too high increases latency and can reduce throughput.
  - With commit_delay = 0, group commit still occurs among sessions that reach the flush point while the previous flush is in progress ("gangway effect" at higher client counts).
- `wal_sync_method`: how the kernel is asked to force WAL to disk. Options: `open_datasync`, `open_sync` (the write in XLogWrite itself syncs; issue_xlog_fsync does nothing), `fdatasync`, `fsync`, `fsync_writethrough` (write moves buffers to kernel cache; issue_xlog_fsync syncs). All equally reliable except `fsync_writethrough` can force a disk cache flush when others don't. Irrelevant if `fsync` is off. Compare with `pg_test_fsync`.
- `wal_debug` (if compiled in): logs every XLogInsertRecord and XLogFlush call.
- `XLogWrite` (called by XLogInsertRecord when buffers are full, by XLogFlush, and by the WAL writer) writes WAL buffers to disk and calls `issue_xlog_fsync`. Counts appear in `pg_stat_io` for object `wal` as `writes`/`fsyncs` always, and `write_time`/`fsync_time` when `track_wal_io_timing` is on.
- `recovery_prefetch` (default `try`): during recovery asks the kernel to start reading blocks that will soon be needed and are not in the buffer pool; limited by `maintenance_io_concurrency` (concurrency) and `wal_decode_buffer_size` (distance).

### WAL internals: LSN, segments, pages, pg_control  [M7, M2]  (source: wal-internals.txt)
- WAL is always enabled. Records are appended; insert position = **Log Sequence Number (LSN)** = byte offset into the WAL, monotonically increasing. SQL type `pg_lsn`; subtracting two LSNs gives the WAL volume (bytes) between them -> measures replication/recovery progress.
- WAL files live in `pg_wal` under the data directory as **segment files, normally 16 MB** each (`initdb --wal-segsize`). Each segment is divided into **pages, normally 8 kB** (`--with-wal-blocksize` configure option). Record headers: `access/xlogrecord.h`; record content depends on the event type.
- Segment file names are ever-increasing numbers starting at `000000010000000000000001` (24 hex digits; leading 8 = timeline ID per 25.3.6; the split of the remaining 16 into high/low segment parts is UNVERIFIED, not stated on this page). Numbers do not wrap.
- Put WAL on a different disk: move `pg_wal` (server stopped) and symlink it.
- Disks that falsely report successful writes subvert WAL -> irrecoverable corruption on power failure.
- After a checkpoint is made and WAL flushed, the checkpoint's position is saved in **`pg_control`**. Recovery start: (1) read pg_control, (2) read the checkpoint record, (3) REDO by scanning forward from the WAL location indicated in the checkpoint record. Because whole pages are saved on the first modification after a checkpoint (full_page_writes), all pages changed since the checkpoint are restored to a consistent state.
- If pg_control is corrupt: scanning WAL segments in reverse to find the latest checkpoint is NOT implemented. pg_control is smaller than one disk page so not subject to partial-write problems.

### Logical replication: model and use cases  [M7]  (source: logical-replication.txt)
- Replicates data objects and their changes based on **replication identity** (usually a primary key). "Logical" vs physical replication (exact block addresses, byte-by-byte). Both can run concurrently.
- **Publish/subscribe** model: one or more subscribers subscribe to one or more publications on a publisher. Subscribers pull data and may re-publish (cascading).
- Flow: snapshot of the table's data on the publisher is copied to the subscriber; then changes since the copy are sent continually. The subscriber applies data in the same order as the publisher -> transactional consistency guaranteed for publications within a single subscription ("transactional replication").
- Use cases: incremental changes of a DB or subset; firing triggers on the subscriber per change; consolidating multiple databases; replicating between different major versions; between platforms (Linux to Windows); giving access to different user groups; sharing a subset between databases.
- Subscriber is a normal instance and can publish. If treated read-only there are no conflicts from a single subscription; other writes to the same tables can cause conflicts.

### Publications and replica identity  [M7]  (source: logical-replication-publication.txt)
- A publication can be defined on any physical replication primary (the **publisher**). It is a set of changes generated from a table or group of tables ("change set" / "replication set"). Each publication exists in only one database.
- A table can be in multiple publications. Publications may contain only tables and all tables in schema. Objects are added explicitly unless `FOR ALL TABLES`.
- Publications can limit changes to any combination of INSERT, UPDATE, DELETE, TRUNCATE (`WITH (publish = '...')`); default all. Applies to DML only, NOT to the initial data synchronization copy. Row filters have no effect for TRUNCATE.
- Commands: `CREATE PUBLICATION`, `ALTER PUBLICATION ... ADD TABLE / DROP TABLE` (transactional: table starts/stops replicating at the correct snapshot at commit), `DROP PUBLICATION`.
- **Replica identity**: required for a published table to replicate UPDATE and DELETE (to identify rows on the subscriber).
  - Default = primary key. Or another unique index (`USING INDEX`, with additional requirements). Or `FULL` = entire row is the key.
  - With FULL, the subscriber can use indexes to search rows: candidate indexes must be btree or hash, non-partial, leftmost field a column (not expression) referencing a published column. Without one the search is very inefficient -> FULL only as a fallback.
  - If publisher identity is not FULL, the subscriber needs a replica identity with the same or fewer columns.
  - Identity `NOTHING`, `DEFAULT` without a primary key, or `USING INDEX` with a dropped index: UPDATE/DELETE on the table raise an **error on the publisher** when the publication replicates those actions. INSERT always works.
  - Set via `ALTER TABLE ... REPLICA IDENTITY`.

### Subscriptions and slot management  [M7]  (source: logical-replication-subscription.txt)
- Subscription = downstream side; defines the connection to another database and the set of publications. The node is the **subscriber**. A subscriber may have multiple subscriptions; multiple subscriptions between one publisher-subscriber pair must not overlap in published objects.
- Each subscription receives changes via **one replication slot**. Extra slots may be needed for initial sync of pre-existing table data and are dropped at the end.
- A subscription can be a synchronous standby; standby name = subscription name by default (or `application_name` in the connection string).
- pg_dump dumps subscriptions only for superusers (others get a warning; cannot read all of `pg_subscription`).
- Commands: `CREATE SUBSCRIPTION`, `ALTER SUBSCRIPTION` (stop/resume), `DROP SUBSCRIPTION`. Dropping and recreating loses synchronization info -> data must be resynchronized.
- **Schema definitions are not replicated**; published tables must exist on the subscriber. Only regular tables can be targets (not views).
- Tables matched by fully qualified name (no renaming). Columns matched by name; order may differ; types need not match if the text representation converts (e.g. integer -> bigint); subscriber may have extra columns (filled with defaults). Binary format (`binary` option) is more restrictive.
- Table synchronization slots are transient, named `pg_%u_sync_%u_%llu` (subscription OID, table relid, system identifier).
- Normally the remote slot is created by CREATE SUBSCRIPTION and dropped by DROP SUBSCRIPTION. Special cases:
  - Slot already exists: `create_slot = false`.
  - Remote host unreachable: `connect = false` (no contact at all; what pg_dump uses); create the slot manually later.
  - Keep the slot when dropping the subscription (moving subscriber): disassociate with `ALTER SUBSCRIPTION ... SET (slot_name = NONE)` first.
  - Remote host unreachable on drop: disassociate first; if the remote still exists, drop the slot (and remaining table sync slots) manually, else they keep reserving WAL and may fill the disk.
- Worked example (docs): `CREATE PUBLICATION pub1 FOR TABLE t1;` `CREATE PUBLICATION pub2 FOR TABLE t2 WITH (publish = 'truncate');` `CREATE PUBLICATION pub3a FOR TABLE t3 WITH (publish = 'truncate');` `CREATE PUBLICATION pub3b FOR TABLE t3 WHERE (e > 5);` then `CREATE SUBSCRIPTION sub3 CONNECTION 'host=localhost dbname=test_pub application_name=sub3' PUBLICATION pub3a, pub3b;`. Result: initial copy brings ALL rows of t2 and t3 (copy ignores the `publish` setting, and pub3a has no row filter so the filter of pub3b is not applied to the copy); later inserts replicate only for t1 and for t3 rows with e > 5.
- Deferred slot creation (output plugin is **pgoutput**):
  1. `CREATE SUBSCRIPTION sub1 ... WITH (connect=false);` -> `WARNING:  subscription was created, but is not connected`. On publisher: `SELECT * FROM pg_create_logical_replication_slot('sub1', 'pgoutput');` (slot name = subscription name). On subscriber: `ALTER SUBSCRIPTION sub1 ENABLE;` `ALTER SUBSCRIPTION sub1 REFRESH PUBLICATION;`
  2. Same with `slot_name='myslot'`.
  3. `WITH (slot_name=NONE, enabled=false, create_slot=false)` (all three required together), create slot, `ALTER SUBSCRIPTION sub1 SET (slot_name='myslot');` then ENABLE and REFRESH.

### Logical replication failover  [M7]  (source: logical-replication-failover.txt)
- For subscribers to continue after the publisher goes down there must be a physical standby of the publisher; logical slots are synchronized to the standby when the subscription is created with `failover = true` (Section 47.2.3).
- Slot sync is asynchronous -> confirm slots are synced before failover. The standby must be ahead of the subscriber: configure `synchronized_standby_slots`.
- Verification steps:
  1. On subscriber: `SELECT array_agg(quote_literal(s.subslotname)) AS slots FROM pg_subscription s WHERE s.subfailover AND s.subslotname IS NOT NULL;`
  2. On subscriber (each database): table sync slots for finished copies: names `CONCAT('pg_', srsubid, '_sync_', srrelid, '_', ctl.system_identifier)` from `pg_control_system() ctl, pg_subscription_rel r, pg_subscription s WHERE r.srsubstate = 'f' AND s.oid = r.srsubid AND s.subfailover`.
  3. On standby: `SELECT slot_name, (synced AND NOT temporary AND invalidation_reason IS NULL) AS failover_ready FROM pg_replication_slots WHERE slot_name IN (...);`
- For planned failover covering all subscribers (including non-PostgreSQL): on primary `SELECT array_agg(quote_literal(r.slot_name)) AS slots FROM pg_replication_slots r WHERE r.failover AND NOT r.temporary;`

### Row filters  [M7]  (source: logical-replication-row-filter.txt)
- Per-table `WHERE (expr)` after the table name in CREATE PUBLICATION (parentheses required). A row is replicated only if the expression is true; false or NULL -> not replicated. Applied **before publishing** changes. Evaluated with the role of the replication connection (role in the subscription's CONNECTION). No effect on TRUNCATE.
- Expression restrictions: only simple expressions; no user-defined functions, operators, types, collations; no system column references; no non-immutable built-in functions.
- If the publication publishes UPDATE or DELETE, the WHERE clause may reference only columns covered by the **replica identity**. INSERT-only publications may use any column.
- **UPDATE transformation** (filter evaluated on both old and new row) — Table 29.1:

  | Old row | New row | Transformation |
  |---|---|---|
  | no match | no match | don't replicate |
  | no match | match | INSERT |
  | match | no match | DELETE |
  | match | match | UPDATE |
- Partitioned tables: `publish_via_partition_root = true` -> root's row filter used; `false` (default) -> each partition's filter.
- Initial sync: only rows satisfying the filter are copied; with several publications filtering the same table differently, rows satisfying ANY expression are copied. Warning: initial sync ignores the `publish` parameter, so some rows may be copied that DML replication would not send. Subscribers older than 15 copy the entire table ignoring filters.
- Combining: same table in several publications with different filters (same operation) -> filters are **ORed**. All other filters become redundant if one publication has no filter, or is `FOR ALL TABLES`, or is `FOR TABLES IN SCHEMA` containing the table (those forms don't allow filters).
- Docs example: `CREATE PUBLICATION p1 FOR TABLE t1 WHERE (a > 5 AND c = 'NSW');` On the publisher inserts (2,'NSW')...(9,'NSW') -> subscriber gets only a=6 and a=9; `UPDATE t1 SET a = 555 WHERE a = 2` becomes INSERT on the subscriber; `UPDATE t1 SET c = 'VIC' WHERE a = 9` becomes DELETE. `\dRp+` shows filters and columns `Owner | All tables | Inserts | Updates | Deletes | Truncates | Generated columns | Via root`.
- Partition example: `CREATE PUBLICATION p4 FOR TABLE parent WHERE (a < 5), child WHERE (a >= 5) WITH (publish_via_partition_root=true);` inserts 2,4,6 into parent and 3,5,7 into child -> subscriber parent gets 2,3,4 (root filter). With false and filter only on child -> subscriber child gets 5,6,7.

### Column lists  [M7]  (source: logical-replication-col-lists.txt)
- Optional per-table list of replicated columns: `CREATE PUBLICATION p1 FOR TABLE t1 (id, b, a, d);`. Subscriber table must have at least all published columns. No list = all columns, **including columns added later** (so a list naming all columns differs from no list).
- **Not a security feature**: a malicious subscriber can obtain unpublished columns; protect at the publisher.
- Only simple column references; order not preserved. Generated columns may be listed (publishes them regardless of `publish_generated_columns`).
- Not supported together with `FOR TABLES IN SCHEMA`.
- Partitioned tables: `publish_via_partition_root` picks root's or each partition's list.
- UPDATE/DELETE publications: list must include the replica identity columns; INSERT-only may omit them.
- No effect on TRUNCATE. Initial sync copies only published columns (subscribers < 15 copy all; subscribers < 18 do not copy generated columns).
- Warning: no support for one subscription combining publications where the same table has different column lists. CREATE SUBSCRIPTION disallows it, but altering lists later can cause subscriber errors. Fix: make the lists match, then recreate the subscription or `ALTER SUBSCRIPTION ... DROP PUBLICATION` and re-add.

### Generated column replication  [M7, M2]  (source: logical-replication-gencols.txt)
- When both sides have a generated column, the **subscriber's** generated value is used (e.g. pub `b = a + 1`, sub `b = a * 100` -> subscriber shows 100, 200, 300).
- Before 18.0 logical replication did not publish generated columns at all. In 18, stored generated columns can be published: set publication parameter `publish_generated_columns = stored` (current and future stored generated columns), or name them in a column list (column list takes precedence over the parameter). Not published by default. Useful for non-PostgreSQL targets via an output plugin.
- Table 29.2:

  | Publish generated? | Publisher column | Subscriber column | Result |
  |---|---|---|---|
  | No | GENERATED | GENERATED | not replicated; subscriber's generated value used |
  | No | GENERATED | regular | not replicated; subscriber column default used |
  | No | GENERATED | missing | not replicated; nothing happens |
  | Yes | GENERATED | GENERATED | ERROR, not supported |
  | Yes | GENERATED | regular | publisher value replicated |
  | Yes | GENERATED | missing | ERROR, column reported missing |
- Same multi-publication warning applies if one publication publishes generated columns and another doesn't for the same table.

### Logical replication conflicts  [M7, M5]  (source: logical-replication-conflicts.txt)
- Incoming changes are applied like normal DML, even if the row was changed locally on the subscriber. If incoming data violates any constraint, replication **stops** = a conflict. For UPDATE/DELETE, missing rows are also conflicts but cause no error; the operation is skipped.
- Logged and counted in `pg_stat_subscription_stats` (confl_* columns). The seven conflict types:

  | Conflict | Situation | Result |
  |---|---|---|
  | insert_exists | inserted row violates a NOT DEFERRABLE unique constraint | ERROR until resolved manually |
  | update_origin_differs | updating a row last modified by another origin (needs `track_commit_timestamp` on subscriber to detect) | update always applied |
  | update_exists | updated value violates a NOT DEFERRABLE unique constraint (a cross-partition update can raise insert_exists instead) | ERROR until resolved |
  | update_missing | row to update not found | skipped |
  | delete_origin_differs | deleting a row last modified by another origin (needs track_commit_timestamp) | delete always applied |
  | delete_missing | row to delete not found | skipped |
  | multiple_unique_conflicts | insert/update violates several NOT DEFERRABLE unique constraints | ERROR until resolved |
- Other scenarios (e.g. exclusion constraint violations) get no additional log details. Origin and commit timestamp of the conflicting local row appear only with `track_commit_timestamp` on the subscriber.
- Log format:
  ```
  LOG:  conflict detected on relation "schemaname.tablename": conflict=conflict_type
  DETAIL:  detailed_explanation.
  {detail_values [; ... ]}.
  ```
  detail_values: `Key (cols)=(vals)` (local key that violated a unique constraint), `existing local row [...]`, `remote row [...]` (for an update, unchanged TOASTed values show as null), `replica identity {(cols)=(vals) | full [...]}`. Column names are logged only if the user lacks privilege on all columns. Values truncated to **64 bytes**. multiple_unique_conflicts emits one explanation per constraint.
- Apply runs with the privileges of the **subscription owner**. Permission failures on target tables, and enabled row-level security that the owner is subject to (regardless of whether a policy would reject the change), also cause conflicts.
- Example error:
  ```
  ERROR:  conflict detected on relation "public.test": conflict=insert_exists
  DETAIL:  Key already exists in unique index "t_pkey", which was modified locally in transaction 740 at 2024-06-26 10:47:04.727375+08.
  Key (c)=(1); existing local row (1, 'local'); remote row (1, 'remote').
  CONTEXT:  processing remote data for replication origin "pg_16395" during "INSERT" for replication target relation "public.test" in transaction 725 finished at 0/14C0378
  ```
- Resolution: change data or permissions on the subscriber, or skip the conflicting transaction:
  - `ALTER SUBSCRIPTION ... SKIP (lsn = '0/14C0378')` using the **finish LSN** (where it committed or was prepared on the publisher), or
  - disable the subscription (`ALTER SUBSCRIPTION ... DISABLE` or the `disable_on_error` option), then `pg_replication_origin_advance('pg_16395', '0/14C0379')` (the LSN after the finish LSN). Origin positions are shown in `pg_replication_origin_status`.
  - Skipping drops the whole transaction, including non-conflicting changes, so the subscriber can become inconsistent.
- With `streaming = parallel` the finish LSN may not be logged; switch streaming to on/off and reproduce the conflict to get it.

### Logical replication restrictions  [M7]  (source: logical-replication-restrictions.txt)
- Schema and DDL are not replicated. Copy initial schema with `pg_dump --schema-only`; keep changes in sync manually (schemas need not be identical). Mismatched incoming data errors until the schema is fixed; apply additive changes to the subscriber first.
- Sequence data is not replicated (serial/identity column values are, but the sequence stays at its start value on the subscriber). Before switchover/failover to the subscriber, update sequences.
- TRUNCATE is replicated: the subscriber truncates the same table group (explicit or via CASCADE) minus tables not in the subscription. Fails if a table to truncate has foreign keys to tables outside the subscription.
- Large objects are not replicated (no workaround except normal tables).
- Only tables, including partitioned tables. Views, materialized views, foreign tables -> error.
- Partitioned tables replicate from the **leaf partitions** by default, so matching target tables must exist on the subscriber (leaf, subpartitioned, or independent tables). `publish_via_partition_root` uses the root's identity and schema instead.
- REPLICA IDENTITY FULL: UPDATE and DELETE cannot be applied if the table has columns with types lacking a default B-tree or Hash operator class (e.g. `point`, `box`). Fix: add a primary key or replica identity.

### Logical replication architecture  [M7, M1]  (source: logical-replication-architecture.txt)
- Similar to physical streaming. Implemented by **walsender** (publisher) and **apply** processes (subscriber). The walsender runs logical decoding of WAL (ch.47) and loads the standard output plugin **pgoutput**, which turns changes into the logical replication protocol (Section 54.5) and filters them by the publication. Data is streamed to the apply worker, which maps it to local tables and applies changes in correct transactional order.
- The apply process always runs with `session_replication_role = replica`, so by default triggers and rules do not fire on the subscriber. Enable per table with `ALTER TABLE ... ENABLE REPLICA TRIGGER` / `ENABLE ALWAYS TRIGGER` and the RULE equivalents (the page just says "ENABLE TRIGGER and ENABLE RULE clauses").
- Apply fires only **row** triggers, not statement triggers. Initial table sync works like COPY and fires both row and statement INSERT triggers.
- **Initial snapshot** algorithm:
  1. A dedicated **table synchronization worker** is spawned per table (in parallel, bounded by `max_sync_workers_per_subscription`).
  2. Each creates its own replication slot and copies existing data. Once the copy finishes, the table contents are visible to other backends.
  3. The worker enters synchronization mode: streams changes made during the copy via standard logical replication, applied and committed in publisher order.
  4. Control of the table goes back to the main apply process.
- The `publish` parameter only affects DML; initial sync ignores it. A failed sync worker is respawned by the apply worker (see `wal_retrieve_retry_interval`).

### Logical replication monitoring, security, configuration  [M7]  (source: logical-replication-monitoring.txt, logical-replication-security.txt, logical-replication-config.txt)
- Monitoring: publisher side like a physical primary (pg_stat_replication). Subscriber: `pg_stat_subscription`, one row per worker. Normally one apply worker per enabled subscription; disabled or crashed = zero rows; plus table sync workers during initial sync and parallel apply workers when streaming in parallel.
- Security:
  - Replication connection role needs `REPLICATION` (or superuser) and `LOGIN`, plus a pg_hba.conf entry. Without SUPERUSER and BYPASSRLS, publisher RLS policies can execute. If the role doesn't trust all table owners, put `options=-crow_security=off` in the connection string (replication then halts rather than running a newly added policy).
  - Output plugin must be listed in `output_plugin_libraries` (pgoutput for subscriptions); superusers may override per connection.
  - Initial copy needs SELECT on published tables.
  - CREATE PUBLICATION needs CREATE on the database. Adding a table needs table ownership. `FOR TABLES IN SCHEMA`, `FOR ALL TABLES` need superuser.
  - **There are no privileges on publications**: any subscription that can connect can read any publication, so filters/column lists don't hide data that another publication in the same DB exposes.
  - CREATE SUBSCRIPTION needs `pg_create_subscription` membership plus CREATE on the database.
  - Apply runs as the subscription owner at session level but switches to the **table owner** for each insert/update/delete/truncate, so the owner must be able to `SET ROLE` to each table owner. `run_as_owner = true`: no switching, owner needs only SELECT/INSERT/UPDATE/DELETE, but any table owner can then run arbitrary code as the subscription owner (e.g. via a trigger); avoid unless user security is of no concern.
  - Publisher checks privileges once at connection start. Subscriber re-checks the owner's privileges for each transaction; an in-flight transaction finishes under the old owner.
- Configuration — publishers: `wal_level = logical`; `max_replication_slots` >= expected subscriptions + reserve for table sync; `idle_replication_slot_timeout` affects logical slots; `max_wal_senders` >= max_replication_slots + concurrently connected physical replicas; `wal_sender_timeout`.
- Configuration — subscribers: `max_active_replication_origins` >= subscriptions + reserve for table sync; `max_logical_replication_workers` >= subscriptions (leader apply workers) + reserve for sync and parallel apply workers; `max_worker_processes` at least `max_logical_replication_workers + 1` (also used by extensions and parallel query); `max_sync_workers_per_subscription` (initial copy parallelism); `max_parallel_apply_workers_per_subscription` (for `streaming = parallel`); also `wal_receiver_timeout`, `wal_receiver_status_interval`, `wal_retrieve_retry_interval`.

### Logical replication upgrade and quick setup  [M7]  (source: logical-replication-upgrade.txt, logical-replication-quick-setup.txt)
- Migrating logical replication clusters with pg_upgrade is possible only when ALL members of the old cluster are **17.0 or later**. Slots/subscription dependencies on older clusters are silently ignored.
- Publisher: pg_upgrade migrates logical slots. Disable subscriptions (`ALTER SUBSCRIPTION ... DISABLE`) first, re-enable after. Prerequisites (else error): new cluster `wal_level = logical`; new `max_replication_slots` >= slots in old cluster; output plugins installed in the new bin dir and listed in `output_plugin_libraries`; old cluster has replicated all transactions and logical decoding messages; all old slots usable (none with `pg_replication_slots.conflicting` true — the page's wording is "no slots whose conflicting is not true", which reads as a typo); new cluster has no permanent logical slots (`temporary` false).
- Subscriber: pg_upgrade migrates `pg_subscription_rel` table info and the replication origin, so replication continues where it stopped. Prerequisites: all subscription tables in state `i` (initialize) or `r` (ready) in `pg_subscription_rel.srsubstate`; a replication origin exists per subscription (pg_subscription, pg_replication_origin); new `max_active_replication_origins` >= number of subscriptions.
- Writes on the publisher may continue while the subscriber is upgraded; they replicate after. Not all steps are transactional -> take backups.
- Two-node procedure (publisher node1, subscriber node2): (1) disable node2's subscriptions from node1; (2) stop node1; (3) initdb new version; (4) `pg_upgrade --old-datadir ... --new-datadir ... --old-bindir ... --new-bindir ...`; (5) start node1; (6) stop node2; (7) initdb; (8) pg_upgrade node2; (9) start node2; (10) create on node2 any tables created on node1 meanwhile; (11) `ALTER SUBSCRIPTION ... ENABLE`; (12) `ALTER SUBSCRIPTION ... REFRESH PUBLICATION`. Subscriber-first order also works.
- Cascaded (node1->node2->node3) and two-node circular procedures follow the same disable / upgrade / create missing tables / enable / refresh pattern node by node (circular: refresh to copy initial data from the other node before disabling the reverse subscription).
- Quick setup: `wal_level = logical` in postgresql.conf (other defaults suffice); pg_hba.conf `host all repuser 0.0.0.0/0 scram-sha-256`; publisher `CREATE PUBLICATION mypub FOR TABLE users, departments;`; subscriber `CREATE SUBSCRIPTION mysub CONNECTION 'dbname=foo host=bar user=repuser' PUBLICATION mypub;` -> initial sync then incremental changes.

### JIT compilation  [M4]  (source: jit.txt, jit-reason.txt, jit-decision.txt, jit-configuration.txt, jit-extensibility.txt)
- JIT = turning interpreted evaluation into native code at run time (e.g. a function specific to `WHERE a.col = 3`). Built-in support via **LLVM** when built `--with-llvm`; see `src/backend/jit/README`.
- Accelerated operations (currently two):
  1. **Expression evaluation**: WHERE clauses, target lists, aggregates, projections.
  2. **Tuple deforming**: converting an on-disk tuple (Section 66.6.1) to its in-memory form, with a function specific to the table layout and the number of columns extracted.
- **Inlining**: bodies of small functions/operators are inlined into expressions to remove function-call overhead from PostgreSQL's extensibility.
- **Optimization**: LLVM passes; some cheap enough for every JIT, others only for long queries.
- When: beneficial mainly for long-running CPU-bound (analytical) queries; for short queries overhead exceeds savings.
- Decision (made at **plan time** using total estimated plan cost):
  1. cost > `jit_above_cost` -> JIT compile.
  2. cost > `jit_inline_above_cost` -> also inline short functions and operators.
  3. cost > `jit_optimize_above_cost` -> also apply expensive optimizations.
  (Defaults are in ch.19, not stated on these pages.) With prepared statements using a generic plan, the settings at PREPARE time decide.
- `jit = off`, or no JIT implementation available -> no JIT; `jit = off` acts at both plan and execution time.
- EXPLAIN ANALYZE output when used (after `SET jit_above_cost = 10;` on `SELECT SUM(relpages) FROM pg_class`):
  ```
   JIT:
     Functions: 3
     Options: Inlining false, Optimization false, Expressions true, Deforming true
     Timing: Generation 1.259 ms (Deform 0.000 ms), Inlining 0.000 ms, Optimization 0.797 ms, Emission 5.048 ms, Total 7.104 ms
   Execution Time: 7.416 ms
  ```
  The same query took 0.365 ms without JIT: a concrete demo of JIT overhead on a cheap query.
- Config: `jit`, `jit_above_cost`, `jit_inline_above_cost`, `jit_optimize_above_cost`, `jit_provider` (rarely changed); debug params in Section 19.17.
- Extension inlining: functions of types C and internal (and operators built on them) can be inlined if their bitcode is available. PGXS builds install it into `$pkglibdir/bitcode/$extension/` with a summary at `$pkglibdir/bitcode/$extension.index.bc` (`pg_config --pkglibdir`). Core bitcode is in `$pkglibdir/bitcode/postgres`.
- Pluggable providers: shared library named by `jit_provider`, must export `_PG_jit_provider_init(JitProviderCallbacks *cb)` filling `struct JitProviderCallbacks { JitProviderResetAfterErrorCB reset_after_error; JitProviderReleaseContextCB release_context; JitProviderCompileExprCB compile_expr; };`. Only LLVM gets inlining support data from the build.

### Regression tests (compact)  [M1]  (source: regress.txt, regress-run.txt, regress-evaluation.txt, regress-variant.txt, regress-tap.txt, regress-coverage.txt)
- Purpose: comprehensive tests of the SQL implementation (standard SQL plus extensions). Modes: against a temporary install in the build tree or an existing running server; "parallel" (multiple server processes run groups of tests; exercises IPC and locking) or "sequential".
- `make check` (temp install; parallel tests prefixed `+`, sequential `-`; ends with e.g. `# All 213 tests passed.`). Won't work if built as root (server refuses to run as root). Older installed shared libraries can break it: build with `configure --disable-rpath` (not for final install). Max concurrency 20 test scripts = 40 processes (server + psql each) -> per-user process limit should be at least ~50; or `make MAX_CONNECTIONS=10 check`.
- `make installcheck` / `make installcheck-parallel`: uses PGHOST/PGPORT; runs in database `regression` (dropped if it exists); creates transient cluster-wide objects named `regress_*` (roles, tablespaces, subscriptions).
- `make check-world` / `make installcheck-world` run all suites (PLs under src/pl, contrib, libpq and ecpg tests, src/test/authentication, src/test/isolation for concurrent sessions, src/test/recovery for crash recovery and physical replication, src/test/subscription for logical replication, client programs under src/bin). Common developer recipe: `make check-world -j8 >/dev/null`. check-world builds a separate temp instance per module. src/test/modules runs only under check-world.
- TAP tests need `--enable-tap-tests` and Perl `IPC::Run`; run with `prove` (`PROVE_FLAGS`, `PROVE_TESTS='t/001_test1.pl ...'`). They start their own servers even under installcheck. `PG_TEST_NOCLEAN=1` keeps data directories (kept on failure anyway). Default timeout 180 s; raise with `PG_TEST_TIMEOUT_DEFAULT`.
- `PG_TEST_EXTRA` (whitespace list) enables suites off by default: `kerberos`, `ldap`, `libpq_encryption`, `load_balance`, `oauth`, `regress_dump_restore`, `sepgsql`, `ssl`, `wal_consistency_checking` (runs some recovery tests with `wal_consistency_checking=all`), `xid_wraparound` (src/test/modules/xid_wraparound; resource intensive).
- Locale/encoding: `make check LANG=C`, `LC_COLLATE=... LC_CTYPE=...` (LC_ALL does not work; the driver unsets it), `ENCODING=EUC_JP` (sensible only with locale C), `NO_LOCALE=1`.
- Custom settings: `PG_TEST_INITDB_EXTRA_OPTS='-k --wal-segsize=4 -c work_mem=50MB'`; `PGOPTIONS="-c debug_parallel_query=regress -c work_mem=50MB"`; `EXTRA_REGRESS_OPTS="--temp-config=test_postgresql.conf"`; `EXTRA_TESTS=numeric_big`. `debug_discard_caches` is mentioned as an extra run-time check.
- Evaluation: plain `diff` of `src/test/regress/results` against `src/test/regress/expected`; differences in `regression.diffs`; `PG_REGRESS_DIFF_OPTS='-c'`. Benign "failures": platform error messages; non-C collation sort order; time zone (expected files generated for `America/Los_Angeles`, driver sets `PGTZ`); float8/geometry differences ~10 places after the decimal point, `-0` vs `0`, pow()/exp() error signalling; row ordering without ORDER BY (not fully ordered on purpose so unordered plan types get exercised; non-C locale, work_mem, planner cost settings can change order); stack depth crash at `select infinite_recurse()` (raise stack limit, 4MB recommended with default `max_stack_depth`); the `random` test; non-default params like `enable_seqscan` changing EXPLAIN output.
- Variant comparison files: (1) `src/test/regress/resultmap` lines `testname:output:platformpattern=comparisonfilename` (e.g. `float4:out:.*-.*-cygwin.*=float4-misrounded-input.out`; pattern matched against config.guess with implicit `^`); (2) best match among `testname.out` and `testname_0.out` .. `testname_9.out`: exact match passes, else the shortest diff is reported (e.g. `char.out` for C/POSIX, `char_1.out` for other locales).
- Coverage (GCC + gcov + lcov): `./configure --enable-coverage`, `make`, `make check`, `make coverage-html` -> `coverage/index.html`; `make coverage` for .gcov text; counts accumulate; `make coverage-clean`. Meson: `meson setup -Db_coverage=true`, `meson compile`, `meson test`, `ninja coverage-html` -> `meson-logs/coveragereport/index.html`.

### WAL for extensions: generic WAL and custom resource managers  [M7, M6]  (source: wal-for-extensions.txt, generic-wal.txt, custom-rmgr.txt)
- Two options for extensions (mainly custom access methods) to be crash-safe:
  1. **Generic WAL**: a special record type describing page changes generically. Simple; needs no extension library loaded to apply. **Ignored by logical decoding.**
  2. **Custom resource manager**: more flexible, supports logical decoding, can produce much smaller records; more complex.
- Generic WAL API (`access/generic_xlog.h`, `access/transam/generic_xlog.c`), steps:
  1. `state = GenericXLogStart(relation)`.
  2. `page = GenericXLogRegisterBuffer(state, buffer, flags)` — returns a pointer to a **temporary copy** of the page; modify only that copy. Only flag: `GENERIC_XLOG_FULL_IMAGE` (log a full-page image instead of a delta; typically for new or fully rewritten pages). Repeat for multiple pages.
  3. Modify the page images.
  4. `GenericXLogFinish(state)` — applies changes to the buffers and emits the record.
  - `GenericXLogAbort(state)` cancels at any point and discards the copies.
- Rules: never modify buffers directly (don't call BufferGetPage yourself); caller still pins/unpins and locks; hold an **exclusive lock** on each target buffer from before GenericXLogRegisterBuffer until after GenericXLogFinish. Registration and modification may interleave; register buffers in the order locks should be taken during replay (redo locks in registration order and releases in the same order). Max buffers per record = `MAX_GENERIC_XLOG_PAGES` (error if exceeded). Pages must have standard layout with no useful data between `pd_lower` and `pd_upper`. GenericXLogStart does not start a critical section (allocation and errors are safe); the only critical section is inside GenericXLogFinish; no need to call Abort on error exit. Finish marks buffers dirty and sets their LSNs. Unlogged relations: same code, no WAL emitted. Without FULL_IMAGE the record holds a byte-by-byte **delta** of old vs new page (not compact for moving data within a page).
- Custom rmgr: define `RmgrData` (see `src/backend/access/transam/README`, `src/include/access/xlog_internal.h`):
  ```c
  typedef struct RmgrData {
      const char *rm_name;
      void        (*rm_redo) (XLogReaderState *record);
      void        (*rm_desc) (StringInfo buf, XLogReaderState *record);
      const char *(*rm_identify) (uint8 info);
      void        (*rm_startup) (void);
      void        (*rm_cleanup) (void);
      void        (*rm_mask) (char *pagedata, BlockNumber blkno);
      void        (*rm_decode) (struct LogicalDecodingContext *ctx, struct XLogRecordBuffer *buf);
  } RmgrData;
  ```
  `rm_identify` names a record from `xl_info` (e.g. XLOG_BTREE_VACUUM -> "VACUUM"); `rm_desc` gives extra detail; `rm_mask` masks bits that `wal_consistency_checking` shouldn't flag. RmgrTable[] is indexed by RmgrId (rmgrlist.h); NULL rm_name = invalid entry.
- Register with `RegisterCustomRmgr(RmgrId rmid, const RmgrData *rmgr)` from `_PG_init`. IDs must be globally unique: reserve one on the wiki page CustomWALResourceManagers; use `RM_EXPERIMENTAL_ID` during development. Example module: `src/test/modules/test_custom_rmgrs`.
- Module must be in `shared_preload_libraries`, and must **stay there as long as any custom WAL records may exist**, or the server cannot apply/decode them and may fail to start.

### Database file layout (PGDATA)  [M2, M1]  (source: storage.txt, storage-file-layout.txt)
- Cluster data directory = **PGDATA** (common location `/var/lib/pgsql/data`). Config files postgresql.conf, pg_hba.conf, pg_ident.conf traditionally live there but can be elsewhere.
- Table 66.1 Contents of PGDATA (complete):

  | Item | Description |
  |---|---|
  | PG_VERSION | file with the major version number |
  | base | per-database subdirectories |
  | current_logfiles | log file(s) currently written by the logging collector |
  | global | cluster-wide tables such as pg_database |
  | pg_commit_ts | transaction commit timestamp data |
  | pg_dynshmem | files used by the dynamic shared memory subsystem |
  | pg_logical | status data for logical decoding |
  | pg_multixact | multitransaction status data (shared row locks) |
  | pg_notify | LISTEN/NOTIFY status data |
  | pg_replslot | replication slot data |
  | pg_serial | information about committed serializable transactions |
  | pg_snapshots | exported snapshots |
  | pg_stat | permanent files for the statistics subsystem |
  | pg_stat_tmp | temporary files for the statistics subsystem |
  | pg_subtrans | subtransaction status data |
  | pg_tblspc | symbolic links to tablespaces |
  | pg_twophase | state files for prepared transactions |
  | pg_wal | WAL files |
  | pg_xact | transaction commit status data |
  | postgresql.auto.conf | parameters set by ALTER SYSTEM |
  | postmaster.opts | command-line options the server was last started with |
  | postmaster.pid | lock file: postmaster PID, data directory path, start timestamp, port, Unix socket directory (may be empty), first valid listen_address (IP, `*`, or empty), shared memory segment ID; absent after shutdown |
- Each database: `PGDATA/base/<database OID>` (default location; holds its system catalogs).
- Describes the built-in heap table AM and built-in index AMs; other AMs may differ.
- Each table and index is a separate file named by its **filenode** (`pg_class.relfilenode`). Temporary relations: `tBBB_FFF` (BBB = backend's process number, FFF = filenode).
- **Forks**: main fork (no suffix); **free space map** `_fsm` (tables and indexes); **visibility map** `_vm` (tables only; tracks pages known to have no dead tuples); **initialization fork** `_init` (unlogged tables and indexes).
- Caution: filenode often equals OID but not necessarily — TRUNCATE, REINDEX, CLUSTER and some ALTER TABLE forms change the filenode and keep the OID. For some catalogs including pg_class itself `relfilenode = 0`; the real filenode is in a lower-level structure (relation map, `pg_filenode.map`) -> use `pg_relation_filenode()`.
- Files larger than **1 GB** are split into segments: `filenode`, `filenode.1`, `filenode.2`, ... (segment size set by `--with-segsize` at build). FSM/VM could in principle need multiple segments.
- TOAST table linked via `pg_class.reltoastrelid`.
- Tablespaces: `PGDATA/pg_tblspc/<tablespace OID>` symlink -> physical directory -> version-specific subdirectory (e.g. `PG_9.0_201008051`, so versions can share a location) -> `<database OID>` -> filenode files. `pg_default` = `PGDATA/base`; `pg_global` = `PGDATA/global`.
- `pg_relation_filepath()` returns the path (relative to PGDATA) of the first segment of the main fork only; append `.N` and/or `_fsm`, `_vm`, `_init` for the others.
- Temporary files (e.g. sorts): `PGDATA/base/pgsql_tmp` or `pgsql_tmp` in a tablespace directory; named `pgsql_tmpPPP.NNN` (PPP = owning backend PID, NNN = sequence).

### TOAST  [M2]  (source: storage-toast.txt)
- **TOAST = The Oversized-Attribute Storage Technique** ("the best thing since sliced bread"). Fixed page size (commonly 8 kB) and tuples cannot span pages, so large field values are compressed and/or split into multiple physical rows, transparently.
- Only **varlena** types support TOAST: first 4-byte word normally holds total length in bytes including itself. C functions must detoast inputs (`PG_DETOAST_DATUM`).
- Varlena header encoding (TOAST takes **two bits** of the length word: high-order bits on big-endian, low-order on little-endian) -> max logical value size **1 GB (2^30 - 1 bytes)**:
  - Both bits zero: ordinary un-TOASTed value with 4-byte header; remaining bits = total size including header.
  - Highest/lowest bit set: **1-byte header**; remaining 7 bits = total size including the length byte -> space-efficient for values **shorter than 127 bytes**. 1-byte-header values are **not aligned**; 4-byte-header values are aligned on at least 4 bytes.
  - 1-byte header with remaining bits all zero (impossible as a self-inclusive length): **TOAST pointer** to out-of-line data; its type and size are given by a code in the **second byte**.
  - Highest/lowest bit clear but adjacent bit set: content is **compressed** in-line; remaining bits of the 4-byte word = compressed size. Compression of out-of-line data is recorded in the TOAST pointer, not the varlena header.
- Compression method per column: `COMPRESSION` option in CREATE/ALTER TABLE; default from `default_toast_compression` at insert time (pglz or lz4 — UNVERIFIED, not stated on this page).
- Pointer types: on-disk pointer to a TOAST table (created in `access/common/toast_internals.c`), or in-memory pointers (indirect, expanded).
- **On-disk TOAST storage**:
  - TOAST table OID in `pg_class.reltoastrelid`.
  - Values (after compression if used) are split into chunks of at most `TOAST_MAX_CHUNK_SIZE` bytes, chosen so **four chunk rows fit on a page (~2000 bytes)**.
  - TOAST table columns: `chunk_id` (OID of the TOASTed value), `chunk_seq` (sequence number within the value), `chunk_data`. Unique index on (chunk_id, chunk_seq).
  - On-disk TOAST pointer stores: TOAST table OID, value OID (chunk_id), logical (uncompressed) size, physical stored size, compression method. Total **18 bytes** including varlena header, regardless of value size.
  - Triggered only when a row value is wider than `TOAST_TUPLE_THRESHOLD` (normally **2 kB**); compresses and/or moves values out of line until the row is shorter than `TOAST_TUPLE_TARGET` (normally **2 kB**, adjustable per table with `ALTER TABLE ... SET (toast_tuple_target = N)`) or no more gains.
  - UPDATE normally preserves unchanged fields as-is: no TOAST cost if no out-of-line value changes.
- **Four storage strategies** (`ALTER TABLE ... ALTER COLUMN ... SET STORAGE`; each type has a default):

  | Strategy | Compression | Out-of-line | Notes |
  |---|---|---|---|
  | PLAIN | no | no | only option for non-TOAST-able types |
  | EXTENDED | yes | yes | default for most TOAST-able types; compress first, then out-of-line if still too big |
  | EXTERNAL | no | yes | faster substring ops on wide text/bytea (fetch only needed chunks of uncompressed value), more space |
  | MAIN | yes | last resort only | out-of-line only when no other way to fit the row on a page |
- Benefits: executor works mostly on the small main row; big values fetched only when sent to the client; main table smaller, more fits in shared buffers; sorts smaller. Test: table of HTML pages + URLs stored in about half the raw size including TOAST; main table only ~10% of data; no run-time difference vs a table with pages cut to 7 kB.
- **In-memory TOAST pointers** (never stored on disk; expanded to in-line varlena before storage, then maybe re-TOASTed):
  - **Indirect**: point to a non-indirect varlena in memory; used in logical decoding to avoid building tuples > 1 GB. Creator must keep referenced data alive.
  - **Expanded**: point to a type-specific in-memory "expanded/deconstructed" representation (e.g. arrays with element offsets identified; standard varlena array needs a scan to find the Nth variable-length element). Must follow `src/include/utils/expandeddatum.h`. Functions using PG_DETOAST_DATUM get the flat form, so support can be added one function at a time. **Read-write** pointers may be modified in place; **read-only** must be copied first.

### Free space map  [M2]  (source: storage-fsm.txt)
- Every heap and index relation **except hash indexes** has an FSM fork: `<filenode>_fsm` (e.g. `12345_fsm`) beside the main file.
- Organized as a **tree of FSM pages**. Bottom-level FSM pages store free space of each heap/index page using **one byte per page**; upper levels aggregate lower levels.
- Within each FSM page: a **binary tree stored in an array, one byte per node**. Each leaf = a heap page or a lower-level FSM page; each non-leaf node stores the **higher (max) of its children** -> root holds the maximum leaf value.
- Details: `src/backend/storage/freespace/README`. Inspect with `pg_freespacemap`.
- (One byte per page means free space is quantized to 1/256 of a page, i.e. 32-byte steps at 8 kB — derived, not stated on the page.)

### Visibility map  [M2, M5, M7]  (source: storage-vm.txt)
- Every **heap** relation has a VM fork `<filenode>_vm`. **Indexes do not have VMs.**
- **Two bits per heap page**:
  1. **all-visible**: page contains no tuples that need vacuuming; index-only scans can answer from the index tuple alone.
  2. **all-frozen**: all tuples on the page are frozen; even an anti-wraparound vacuum need not revisit the page.
- Conservative: a set bit means the condition is definitely true; a clear bit means it may or may not be true.
- Bits are **set only by vacuum** and **cleared by any data-modifying operation** on the page.
- Inspect with `pg_visibility`.

### Initialization fork  [M2]  (source: storage-init.txt)
- Each unlogged table and each index on an unlogged table has an `_init` fork = an empty table/index of the right type. After a crash, the init fork is copied over the main fork and other forks are erased (recreated as needed) -> unlogged tables come back empty.

### Database page layout  [M2]  (source: storage-page-layout.txt)
- Applies to tables and indexes; sequences and TOAST tables use the regular table format. Item = a row (table) or index entry (index). Byte = 8 bits.
- Relation = array of fixed-size pages (usually **8 kB**, compile-time selectable). All table pages are equivalent (a row can go anywhere). Indexes usually reserve the first page as a **metapage**, and can have several page types. The heap AM always uses this format; existing index AMs use the basic format but metapage data usually doesn't follow the item rules.
- Table 66.2 — five parts of a page (in physical order):

  | Part | Description |
  |---|---|
  | PageHeaderData | 24 bytes; general info including free space pointers |
  | ItemIdData | array of item identifiers, each an (offset, length) pair, **4 bytes per item** |
  | Free space | unallocated; new item identifiers taken from its start, new items from its end |
  | Items | the actual items |
  | Special space | access-method-specific data; empty in ordinary tables |
- Table 66.3 **PageHeaderData** (24 bytes total; `src/include/storage/bufpage.h`):

  | Field | Type | Length | Description |
  |---|---|---|---|
  | pd_lsn | PageXLogRecPtr | 8 bytes | LSN: next byte after last byte of WAL record for last change to this page |
  | pd_checksum | uint16 | 2 bytes | page checksum (if data checksums enabled) |
  | pd_flags | uint16 | 2 bytes | flag bits |
  | pd_lower | LocationIndex | 2 bytes | offset to start of free space |
  | pd_upper | LocationIndex | 2 bytes | offset to end of free space |
  | pd_special | LocationIndex | 2 bytes | offset to start of special space |
  | pd_pagesize_version | uint16 | 2 bytes | page size and layout version number |
  | pd_prune_xid | TransactionId | 4 bytes | oldest unpruned XMAX on page, or zero if none (hint whether pruning is likely profitable) |
  - Byte offsets: pd_lsn 0-7, pd_checksum 8-9, pd_flags 10-11, pd_lower 12-13, pd_upper 14-15, pd_special 16-17, pd_pagesize_version 18-19, pd_prune_xid 20-23 (derived from the sizes).
  - Layout version history: **4** since 8.3; 3 in 8.1-8.2; 2 in 8.0; 1 in 7.3-7.4; 0 before. Page size there is just a cross-check; only one page size per installation.
  - Ordinary tables have no special section: `pd_special = page size`.
- **ItemIdData** (line pointer, 4 bytes): byte offset to start of item, item length in bytes, and a few attribute bits affecting interpretation. Allocated from the start of free space; count derived from `pd_lower` (which increases as identifiers are added). An item identifier never moves until freed, so its index is a long-term reference even when the item itself is moved to compact free space. Every **ItemPointer / CTID** = (page number, item identifier index). (Bit split from bufpage/itemid.h, not on this page: lp_off 15 bits, lp_flags 2 bits, lp_len 15 bits; flags LP_UNUSED, LP_NORMAL, LP_REDIRECT, LP_DEAD.)
- Items are allocated backwards from the end of free space. Tables and sequences use **HeapTupleHeaderData**.
- Special section example: B-tree stores links to left and right sibling pages and other index data.
- **Table row layout**: fixed header (**23 bytes** on most machines), then optional null bitmap, optional object ID, then user data starting at `t_hoff` (always a multiple of **MAXALIGN**).
  - Null bitmap only if `HEAP_HASNULL` set in t_infomask; starts just after the fixed header; one bit per column (attribute count in t_infomask2); **1 = not-null, 0 = null**. Absent -> all columns not-null.
  - OID field only if `HEAP_HASOID_OLD` set; sits just before t_hoff. Padding to MAXALIGN goes between null bitmap and OID.
- Table 66.4 **HeapTupleHeaderData** (`src/include/access/htup_details.h`):

  | Field | Type | Length | Description |
  |---|---|---|---|
  | t_xmin | TransactionId | 4 bytes | insert XID stamp |
  | t_xmax | TransactionId | 4 bytes | delete XID stamp |
  | t_cid | CommandId | 4 bytes | insert and/or delete CID stamp (overlays with t_xvac) |
  | t_xvac | TransactionId | 4 bytes | XID for VACUUM operation moving a row version |
  | t_ctid | ItemPointerData | 6 bytes | current TID of this or newer row version |
  | t_infomask2 | uint16 | 2 bytes | number of attributes, plus various flag bits |
  | t_infomask | uint16 | 2 bytes | various flag bits |
  | t_hoff | uint8 | 1 byte | offset to user data |
  - Sum: 4+4+4+6+2+2+1 = **23 bytes** (t_cid and t_xvac share the same 4 bytes). With 8-byte MAXALIGN a row with no null bitmap starts user data at offset 24.
- Interpreting data needs pg_attribute (`attlen`, `attalign`). No direct access to an attribute unless all fields are fixed width and none are null. Code: `heap_getattr`, `fastgetattr`, `heap_getsysattr`. Algorithm (deforming): for each attribute in order: (1) check null bitmap, skip if null; (2) align per attalign; (3) fixed-width: copy attlen bytes; (4) variable length (`attlen = -1`): read the `struct varlena` header (length + flag bits); data may be inline, in TOAST, and/or compressed.

### Heap-Only Tuples (HOT)  [M2, M5]  (source: storage-hot.txt)
- MVCC downsides for UPDATE: a new row version per update, possibly new index entries for each, and expensive removal of old versions and their index entries.
- HOT is possible when BOTH:
  1. The update modifies **no columns referenced by the table's indexes**, not counting **summarizing indexes** (the only core summarizing index method is **BRIN**).
  2. There is **enough free space on the page holding the old row** for the new version.
- Then:
  1. No new index entries are needed (summarizing indexes may still need updating).
  2. When a row is updated multiple times, versions other than the oldest and newest can be removed during **normal operation, including SELECTs** (page pruning), without vacuum. Indexes always point at the item identifier of the **original** row version; that version's tuple data is removed and its item identifier becomes a **redirect** to the oldest version still possibly visible; intermediate versions no longer visible to anyone are removed and their item identifiers freed for reuse.
- Raise HOT likelihood by lowering the table's `fillfactor`. Monitor via `pg_stat_all_tables` (`n_tup_hot_upd` vs `n_tup_upd`, and `n_tup_newpage_upd`).

### Transactions and identifiers  [M5, M1]  (source: transactions.txt, transaction-id.txt)
- "xact" = transaction. Explicit `BEGIN` / `START TRANSACTION` ... `COMMIT` / `ROLLBACK`; statements outside explicit transactions use single-statement transactions.
- **VirtualTransactionId** (virtualXID, **vxid**): every transaction has one = backend's **procNumber** + a sequential backend-local **localXID**. Written `procNumber/localXID`, e.g. `4/12532`.
- **TransactionId (xid)**, e.g. 278394: assigned sequentially from a **global counter shared by all databases in the cluster**, and only **when a transaction first writes**. So lower xids started writing earlier; the order of first writes may differ from start order (e.g. a transaction that read first).
- `xid` is **32 bits**, wraps every ~4 billion transactions; a **32-bit epoch** is incremented at each wraparound. `xid8` (64-bit) includes the epoch, never wraps in an installation's life, castable to xid. The Table 9.84 functions (e.g. pg_current_xact_id) return xid8. Xids underlie MVCC and streaming replication.
- On commit of a top-level transaction with an xid, it is marked committed in **pg_xact**; commit timestamps in **pg_commit_ts** if `track_commit_timestamp`.
- Prepared transactions also get a **GID** (Global Transaction Identifier): string literal up to **200 bytes**, unique among currently prepared transactions; GID-to-xid mapping in `pg_prepared_xacts`.

### Transactions and locking  [M5]  (source: xact-locking.txt)
- `pg_locks` shows current transaction IDs in columns `virtualxid` and `transactionid`. Read-only transactions: virtualxid set, transactionid NULL. Read-write: both set.
- Some lock waits are on virtualxid, others on transactionid (cf. wait events `virtualxid`, `transactionid`).
- Row-level read and write locks are stored **in the locked rows** themselves (inspect with `pgrowlocks`); row-level read (share) locks may require **multixact IDs**.

### Subtransactions  [M5]  (source: subxacts.txt)
- "subxact". Commit or abort without affecting the parent. Started by `SAVEPOINT`, PL/pgSQL `EXCEPTION` blocks, PL/Python and PL/Tcl explicit subtransactions, and nested inside other subtransactions -> a tree under the **top-level transaction**.
- A subtransaction's non-virtual xid is a **subxid**. Read-only subtransactions get none; on first write it gets one and so do all its parents up to the top level. Invariant: **a parent xid is always lower than any of its child subxids**.
- `pg_subtrans` records the immediate parent xid of each subxid (no entries for top-level xids or read-only subtransactions).
- Subcommit: committing a subtransaction marks its committed children subcommitted; aborting it aborts all children. Top-level commit persistently records all subcommitted children as committed in pg_xact; top-level abort aborts all, even subcommitted ones.
- Overhead: **up to 64 open subxids per backend are cached in shared memory**; beyond that storage I/O rises significantly due to pg_subtrans lookups (the "subxid overflow"; see `pg_stat_get_backend_subxact()` -> `subxact_count`, `subxact_overflowed`, and the hot standby >64 subtransactions caveat).

### Two-phase transactions  [M5, M7]  (source: two-phase.txt)
- 2PC protocol for distributed systems: `PREPARE TRANSACTION`, `COMMIT PREPARED`, `ROLLBACK PREPARED`. Intended for external transaction managers; follows the **X/Open XA** model but omits some rarely used aspects.
- After PREPARE TRANSACTION the only possible next commands are COMMIT PREPARED or ROLLBACK PREPARED. Meant to be brief, but may linger.
- Short-lived prepared transactions live only in shared memory and WAL; those spanning checkpoints are written to `pg_twophase` (CRC-32C protected, per 28.1). Inspect with `pg_prepared_xacts`. (Old prepared transactions hold back xmin/freezing: step 1 of the wraparound recovery procedure.)


## Complete inventories

### INVENTORY: Wait event types (Table 27.4) and every wait event (Tables 27.5-27.13)  [M5, M7, M1]  (source: monitoring-stats.txt)
`pg_stat_activity.wait_event_type` / `wait_event`. Ten types:

| Wait Event Type | Meaning |
|---|---|
| Activity | Server process is idle, waiting for activity in its main processing loop. |
| BufferPin | Waiting for exclusive access to a data buffer. Can be protracted if another process holds an open cursor that last read data from the buffer. |
| Client | Waiting for activity on a socket connected to a user application (independent of internal processes). |
| Extension | Waiting for some condition defined by an extension module. |
| InjectionPoint | Waiting for an injection point to reach an outcome defined in a test. No predefined wait points. |
| IO | Waiting for an I/O operation to complete. |
| IPC | Waiting for some interaction with another server process. |
| Lock | Waiting for a heavyweight lock (lock manager locks; protect SQL-visible objects such as tables; also used for mutual exclusion of internal ops such as relation extension). |
| LWLock | Waiting for a lightweight lock (mostly protects a particular shared-memory data structure). Some have specific names, others are part of a group (tranche). |
| Timeout | Waiting for a timeout to expire. |

**Activity:** ArchiverMain (main loop of archiver), AutovacuumMain (main loop of autovacuum launcher), BgwriterHibernate (bgwriter hibernating), BgwriterMain, CheckpointerMain, CheckpointerShutdown (waiting for checkpointer to be terminated), IoWorkerMain (main loop of IO Worker process — PG18 AIO; tag UNVERIFIED), LogicalApplyMain, LogicalLauncherMain, LogicalParallelApplyMain, RecoveryWalStream (startup process waiting for WAL to arrive during streaming recovery), ReplicationSlotsyncMain (slot sync worker), ReplicationSlotsyncShutdown, SysloggerMain, WalReceiverMain, WalSenderMain, WalSummarizerWal (waiting for more WAL to be generated), WalWriterMain.

**BufferPin:** BufferPin (waiting to acquire an exclusive pin on a buffer).

**Client:** ClientRead (read data from client), ClientWrite (write data to client), GssOpenServer (reading from client while establishing GSSAPI session), LibpqwalreceiverConnect (WAL receiver establishing connection to remote server), LibpqwalreceiverReceive (WAL receiver receiving data), SslOpenServer (waiting for SSL while attempting connection), WaitForStandbyConfirmation (waiting for WAL to be received and flushed by the physical standby), WalSenderWaitForWal (waiting for WAL to be flushed in WAL sender), WalSenderWriteData (waiting for any activity when processing replies from WAL receiver).

**Extension:** Extension (waiting in an extension).

**IO:** AioIoCompletion (another process to complete IO), AioIoUringExecution (IO execution via io_uring), AioIoUringSubmit (IO submission via io_uring), BasebackupRead, BasebackupSync, BasebackupWrite, BuffileRead, BuffileTruncate, BuffileWrite (buffered [temp] file), ControlFileRead, ControlFileSync, ControlFileSyncUpdate, ControlFileWrite, ControlFileWriteUpdate (pg_control), CopyFileCopy, CopyFileRead, CopyFileWrite, DataFileExtend (relation data file being extended), DataFileFlush (relation data file to reach durable storage), DataFileImmediateSync, DataFilePrefetch (asynchronous prefetch), DataFileRead, DataFileSync, DataFileTruncate, DataFileWrite, DsmAllocate (dynamic shared memory segment allocation), DsmFillZeroWrite, LockFileAddtodatadirRead, LockFileAddtodatadirSync, LockFileAddtodatadirWrite, LockFileCreateRead, LockFileCreateSync, LockFileCreateWrite, LockFileRecheckdatadirRead (data directory lock file = postmaster.pid), LogicalRewriteCheckpointSync, LogicalRewriteMappingSync, LogicalRewriteMappingWrite, LogicalRewriteSync, LogicalRewriteTruncate, LogicalRewriteWrite, RelationMapRead, RelationMapReplace, RelationMapWrite (relation map file), ReorderBufferRead, ReorderBufferWrite, ReorderLogicalMappingRead, ReplicationSlotRead, ReplicationSlotRestoreSync, ReplicationSlotSync, ReplicationSlotWrite (replication slot control file), SlruFlushSync (SLRU data durable during checkpoint or shutdown), SlruRead, SlruSync, SlruWrite, SnapbuildRead, SnapbuildSync, SnapbuildWrite (serialized historical catalog snapshot), TimelineHistoryFileSync, TimelineHistoryFileWrite (history file received via streaming replication), TimelineHistoryRead, TimelineHistorySync, TimelineHistoryWrite (newly created timeline history file), TwophaseFileRead, TwophaseFileSync, TwophaseFileWrite (two phase state file), VersionFileSync, VersionFileWrite (PG_VERSION while creating a database), WalsenderTimelineHistoryRead, WalBootstrapSync, WalBootstrapWrite, WalCopyRead, WalCopySync, WalCopyWrite (new WAL segment created by copying an existing one), WalInitSync, WalInitWrite (newly initialized WAL file), WalRead, WalSummaryRead, WalSummaryWrite, WalSync (WAL file to reach durable storage), WalSyncMethodAssign, WalWrite.

**IPC:** AppendReady (subplan nodes of Append), ArchiveCleanupCommand, ArchiveCommand, BackendTermination, BackupWaitWalArchive (WAL files required for a backup to be archived), BgworkerShutdown, BgworkerStartup, BtreePage (page number needed to continue a parallel B-tree scan), BufferIo (buffer I/O to complete), CheckpointDelayComplete (a backend that blocks a checkpoint from completing), CheckpointDelayStart, CheckpointDone, CheckpointStart, ExecuteGather (activity from a child process while executing Gather), HashBatchAllocate, HashBatchElect, HashBatchLoad, HashBuildAllocate, HashBuildElect, HashBuildHashInner, HashBuildHashOuter, HashGrowBatchesDecide, HashGrowBatchesElect, HashGrowBatchesFinish, HashGrowBatchesReallocate, HashGrowBatchesRepartition, HashGrowBucketsElect, HashGrowBucketsReallocate, HashGrowBucketsReinsert (all Parallel Hash coordination), LogicalApplySendData, LogicalParallelApplyStateChange, LogicalSyncData (remote server to send data for initial table sync), LogicalSyncStateChange, MessageQueueInternal, MessageQueuePutMessage, MessageQueueReceive, MessageQueueSend (shared message queue), MultixactCreation, ParallelBitmapScan, ParallelCreateIndexScan, ParallelFinish (parallel workers to finish computing), ProcarrayGroupUpdate (group leader to clear the transaction ID at transaction end), ProcSignalBarrier (barrier event processed by all backends), Promote (standby promotion), RecoveryConflictSnapshot (recovery conflict resolution for a vacuum cleanup), RecoveryConflictTablespace, RecoveryEndCommand, RecoveryPause, ReplicationOriginDrop, ReplicationSlotDrop, RestoreCommand, SafeSnapshot (valid snapshot for a READ ONLY DEFERRABLE transaction), SyncRep (confirmation from a remote server during synchronous replication), WalReceiverExit, WalReceiverUpstreamCatchup, WalReceiverWaitStart, WalSummaryReady, XactGroupUpdate (group leader to update transaction status at transaction end).

**Lock (heavyweight lock target types): advisory (advisory user lock), applytransaction (lock on a remote transaction being applied by a logical replication subscriber), extend (extend a relation), frozenid (update pg_database.datfrozenxid and datminmxid), object (non-relation database object), page (page of a relation), relation, spectoken (speculative insertion lock), transactionid (waiting for a transaction to finish), tuple, userlock, virtualxid (virtual transaction ID lock).

**LWLock:** AddinShmemInit, AioUringCompletion, AioWorkerSubmissionQueue, AutoFile (postgresql.auto.conf), Autovacuum (state of autovacuum workers), AutovacuumSchedule (ensure a table selected for autovacuum still needs vacuuming), BackgroundWorker, BtreeVacuum, BufferContent (access a data page in memory), BufferMapping (associate a data block with a buffer in the buffer pool), CheckpointerComm (manage fsync requests), CommitTs, CommitTsBuffer, CommitTsSLRU, ControlFile (pg_control or create a new WAL file), DSMRegistry, DSMRegistryDSA, DSMRegistryHash, DynamicSharedMemoryControl, InjectionPoint, LockFastPath (a process' fast-path lock information), LockManager (heavyweight lock info), LogicalRepLauncherDSA, LogicalRepLauncherHash, LogicalRepWorker, MultiXactGen, MultiXactMemberBuffer, MultiXactMemberSLRU, MultiXactOffsetBuffer, MultiXactOffsetSLRU, MultiXactTruncation, NotifyBuffer, NotifyQueue, NotifyQueueTail, NotifySLRU, OidGen (allocate a new OID), ParallelAppend, ParallelBtreeScan, ParallelHashJoin, ParallelQueryDSA, ParallelVacuumDSA, PerSessionDSA, PerSessionRecordType, PerSessionRecordTypmod, PerXactPredicateList, PgStatsData, PgStatsDSA, PgStatsHash, PredicateLockManager (predicate locks for serializable transactions), ProcArray (shared per-process data; typically to get a snapshot or report a session's XID), RelationMapping (pg_filenode.map), RelCacheInit (pg_internal.init), ReplicationOrigin, ReplicationOriginState, ReplicationSlotAllocation, ReplicationSlotControl, ReplicationSlotIO, SerialBuffer, SerialControl (pg_serial), SerializableFinishedList, SerializablePredicateList, SerializableXactHash, SerialSLRU, SharedTidBitmap, SharedTupleStore, ShmemIndex (find or allocate space in shared memory), SInvalRead, SInvalWrite (shared catalog invalidation queue), SubtransBuffer, SubtransSLRU, SyncRep, SyncScan (starting location of a synchronized table scan), TablespaceCreate, TwoPhaseState, WaitEventCustom, WALBufMapping (replace a page in WAL buffers), WALInsert (insert WAL data into a memory buffer), WALSummarizer, WALWrite (WAL buffers to be written to disk), WrapLimitsVacuum (update limits on transaction id and multixact consumption), XactBuffer (I/O on a transaction status SLRU buffer), XactSLRU (transaction status SLRU cache), XactTruncation (pg_xact_status / oldest XID available to it), XidGen (allocate a new transaction ID).

**Timeout:** BaseBackupThrottle, CheckpointWriteDelay (waiting between writes while performing a checkpoint), PgSleep (pg_sleep or sibling), RecoveryApplyDelay (delay setting), RecoveryRetrieveRetryInterval (WAL not available from any source: pg_wal, archive or stream), RegisterSyncRequest (sync request queue to checkpointer full), SpinDelay (acquiring a contended spinlock), VacuumDelay (cost-based vacuum delay point), VacuumTruncate (waiting for exclusive lock to truncate empty pages at end of table), WalSummarizerError.

- Extensions can add Extension, InjectionPoint, and LWLock events; an extension LWLock name may show as just "extension" in some processes.
- Catalog view `pg_wait_events(type, name, description)` lists them. Example queries:
  ```sql
  SELECT pid, wait_event_type, wait_event FROM pg_stat_activity WHERE wait_event is NOT NULL;
  SELECT a.pid, a.wait_event, w.description
    FROM pg_stat_activity a JOIN pg_wait_events w ON (a.wait_event_type = w.type AND a.wait_event = w.name)
    WHERE a.wait_event is NOT NULL and a.state = 'active';
  ```

### INVENTORY: every pg_stat_* / pg_statio_* view (ch.27)  [M7, M1, M4]  (source: monitoring-stats.txt, progress-reporting.txt)

**Table 27.1 Dynamic statistics views (current state):**

| View | Rows | Purpose |
|---|---|---|
| pg_stat_activity | one per server process | current activity: state, current query, wait events |
| pg_stat_replication | one per WAL sender | replication to that sender's connected standby |
| pg_stat_wal_receiver | one row only | WAL receiver stats (on standby) |
| pg_stat_recovery_prefetch | one row only | blocks prefetched during recovery |
| pg_stat_subscription | at least one per subscription | subscription workers |
| pg_stat_ssl | one per connection (regular and replication) | SSL usage |
| pg_stat_gssapi | one per connection | GSSAPI auth/encryption |
| pg_stat_progress_analyze | one per backend (incl. autovacuum workers) running ANALYZE | progress |
| pg_stat_progress_create_index | one per backend running CREATE INDEX or REINDEX | progress |
| pg_stat_progress_vacuum | one per backend (incl. autovacuum workers) running VACUUM | progress |
| pg_stat_progress_cluster | one per backend running CLUSTER or VACUUM FULL | progress |
| pg_stat_progress_basebackup | one per WAL sender streaming a base backup | progress |
| pg_stat_progress_copy | one per backend running COPY | progress |

**Table 27.2 Collected (cumulative) statistics views:**

| View | Rows | Purpose |
|---|---|---|
| pg_stat_archiver | one row | WAL archiver activity |
| pg_stat_bgwriter | one row | background writer activity |
| pg_stat_checkpointer | one row | checkpointer activity |
| pg_stat_database | one per database (+ one for shared objects) | database-wide stats |
| pg_stat_database_conflicts | one per database | query cancels due to recovery conflicts on standbys |
| pg_stat_io | one per (backend type, context, target object) | cluster-wide I/O stats |
| pg_stat_replication_slots | one per (logical) replication slot | slot usage (spill/stream) |
| pg_stat_slru | one per SLRU | SLRU operations |
| pg_stat_subscription_stats | one per subscription | errors and conflicts |
| pg_stat_wal | one row | WAL activity |
| pg_stat_all_tables | one per table in current DB (incl. TOAST) | accesses to the table |
| pg_stat_sys_tables | | same, system tables only |
| pg_stat_user_tables | | same, user tables only |
| pg_stat_xact_all_tables | | like pg_stat_all_tables but counts actions so far in the current transaction (not yet in pg_stat_all_tables); no live/dead row, vacuum, analyze columns |
| pg_stat_xact_sys_tables | | same, system tables only |
| pg_stat_xact_user_tables | | same, user tables only |
| pg_stat_all_indexes | one per index in current DB | accesses to the index |
| pg_stat_sys_indexes | | indexes on system tables only |
| pg_stat_user_indexes | | indexes on user tables only |
| pg_stat_user_functions | one per tracked function | function executions |
| pg_stat_xact_user_functions | | calls during the current transaction only |
| pg_statio_all_tables | one per table in current DB | I/O on the table |
| pg_statio_sys_tables | | system tables only |
| pg_statio_user_tables | | user tables only |
| pg_statio_all_indexes | one per index | I/O on the index |
| pg_statio_sys_indexes | | indexes on system tables |
| pg_statio_user_indexes | | indexes on user tables |
| pg_statio_all_sequences | one per sequence | I/O on the sequence |
| pg_statio_sys_sequences | | system sequences (presently none defined -> always empty) |
| pg_statio_user_sequences | | user sequences |

**Column-level detail (every column):**

- **pg_stat_activity** (Table 27.3): `datid oid`, `datname name`, `pid integer`, `leader_pid integer` (parallel group leader PID if parallel query worker, or leader apply worker PID if parallel apply worker; NULL otherwise), `usesysid oid`, `usename name`, `application_name text`, `client_addr inet` (NULL = Unix socket or internal process such as autovacuum), `client_hostname text` (only with `log_hostname`), `client_port integer` (-1 for Unix socket; NULL internal process), `backend_start timestamptz`, `xact_start timestamptz` (NULL if no transaction active; equals query_start if current query is first of its transaction), `query_start timestamptz` (start of the currently active query, or of the last query if not active), `state_change timestamptz`, `wait_event_type text`, `wait_event text`, `state text`, `backend_xid xid` (top-level transaction identifier, if any), `backend_xmin xid` (the backend's xmin horizon), `query_id bigint` (NULL unless `compute_query_id` enabled or a module computes it), `query text` (most recent query; truncated at 1024 bytes by default — `track_activity_query_size`), `backend_type text`.
  - `state` values: `starting` (initial startup; client authentication performed in this phase — PG18 version tag UNVERIFIED), `active` (executing a query), `idle` (waiting for a new client command), `idle in transaction`, `idle in transaction (aborted)` (a statement in the transaction caused an error), `fastpath function call`, `disabled` (track_activities off in this backend).
  - `backend_type` values: autovacuum launcher, autovacuum worker, logical replication launcher, logical replication worker, parallel worker, background writer, client backend, checkpointer, archiver, standalone backend, startup, walreceiver, walsender, walwriter, walsummarizer (+ extension background workers).
  - Note: `wait_event` and `state` are independent: state active + wait_event non-null = query executing but blocked somewhere. Columns are not synchronized -> ephemeral discrepancies.
- **pg_stat_replication** (Table 27.14; only directly connected standbys): `pid`, `usesysid`, `usename`, `application_name`, `client_addr`, `client_hostname`, `client_port`, `backend_start`, `backend_xmin xid` (standby's xmin horizon reported by hot_standby_feedback), `state text` (`startup`, `catchup`, `streaming`, `backup`, `stopping`), `sent_lsn pg_lsn` (last WAL location sent), `write_lsn` (last written to disk by standby), `flush_lsn` (last flushed by standby), `replay_lsn` (last replayed on standby), `write_lag interval` (time between flushing WAL locally and notification that standby wrote it — gauges `remote_write` delay), `flush_lag` (… wrote and flushed — gauges `on`), `replay_lag` (… wrote, flushed and applied — gauges `remote_apply`), `sync_priority integer` (priority-based only), `sync_state text` (`async`, `potential`, `sync`, `quorum`), `reply_time timestamptz`.
  - Lag times are measurements for recent WAL, not predictions of catch-up time; on a fully caught-up idle system they show the last measured value briefly then NULL. Logical decoding plugins may optionally emit tracking messages; else NULL lag.
- **pg_stat_replication_slots** (Table 27.15; one row per logical replication slot): `slot_name text`, `spill_txns bigint` (transactions spilled to disk once decoding memory exceeded `logical_decoding_work_mem`; counts top-level and subtransactions), `spill_count` (times spilled; same txn may spill multiple times), `spill_bytes`, `stream_txns` (in-progress transactions streamed to the output plugin after exceeding logical_decoding_work_mem; top-level only), `stream_count`, `stream_bytes`, `total_txns` (decoded transactions sent to output plugin; top-level only; includes streamed/spilled), `total_bytes`, `stats_reset`.
- **pg_stat_wal_receiver** (Table 27.16): `pid`, `status text`, `receive_start_lsn pg_lsn`, `receive_start_tli integer`, `written_lsn` (received and written, not flushed; not for data integrity checks), `flushed_lsn`, `received_tli`, `last_msg_send_time`, `last_msg_receipt_time`, `latest_end_lsn` (last WAL location reported to origin WAL sender), `latest_end_time`, `slot_name text`, `sender_host text` (host name, IP, or absolute directory path for Unix socket), `sender_port integer`, `conninfo text` (security-sensitive fields obfuscated).
- **pg_stat_recovery_prefetch** (Table 27.17): `stats_reset`, `prefetch bigint` (blocks prefetched because not in buffer pool), `hit` (already in buffer pool), `skip_init` (would be zero-initialized), `skip_new` (didn't exist yet), `skip_fpw` (full page image included in WAL), `skip_rep` (already recently prefetched), `wal_distance int` (bytes ahead the prefetcher is looking), `block_distance int` (blocks ahead), `io_depth int` (prefetches initiated but not yet known completed). The last three are current values, others cumulative (reset via pg_stat_reset_shared).
- **pg_stat_subscription** (Table 27.18): `subid oid`, `subname name`, `worker_type text` (`apply`, `parallel apply`, `table synchronization`), `pid`, `leader_pid` (for parallel apply workers), `relid oid` (relation being synchronized; NULL for leader apply and parallel apply workers), `received_lsn pg_lsn` (initially 0), `last_msg_send_time`, `last_msg_receipt_time`, `latest_end_lsn`, `latest_end_time` (all NULL for parallel apply workers).
- **pg_stat_subscription_stats** (Table 27.19): `subid`, `subname`, `apply_error_count bigint` (a conflict causing an apply error is counted both here and in its confl_* counter), `sync_error_count` (errors during initial table synchronization), `confl_insert_exists`, `confl_update_origin_differs`, `confl_update_exists`, `confl_update_missing`, `confl_delete_origin_differs`, `confl_delete_missing`, `confl_multiple_unique_conflicts`, `stats_reset`.
- **pg_stat_ssl** (Table 27.20; joinable on pid): `pid`, `ssl boolean`, `version text`, `cipher text`, `bits integer`, `client_dn text` (truncated at NAMEDATALEN = 64 chars), `client_serial numeric`, `issuer_dn text`.
- **pg_stat_gssapi** (Table 27.21): `pid`, `gss_authenticated boolean`, `principal text`, `encrypted boolean`, `credentials_delegated boolean`.
- **pg_stat_archiver** (Table 27.22): `archived_count bigint`, `last_archived_wal text`, `last_archived_time`, `failed_count`, `last_failed_wal`, `last_failed_time`, `stats_reset`. WAL files are normally archived oldest to newest but that's not guaranteed (promotion, crash recovery) -> not safe to assume all files older than last_archived_wal are archived.
- **pg_stat_io** (Table 27.23): `backend_type text`, `object text` (`relation` = permanent relations, `temp relation`, `wal` = Write Ahead Logs — PG18 tag UNVERIFIED), `context text` (`normal` = default: reads/writes via shared buffers; `init` = I/O while creating WAL segments; `vacuum` = I/O outside shared buffers while vacuuming/analyzing permanent relations [temp table vacuums are `normal`]; `bulkread` = large reads outside shared buffers e.g. seq scan of a large table; `bulkwrite` = large writes outside shared buffers e.g. COPY), `reads bigint`, `read_bytes numeric`, `read_time double precision` (ms; needs `track_io_timing`, or `track_wal_io_timing` for object wal), `writes`, `write_bytes`, `write_time`, `writebacks bigint` (units of BLCKSZ the process asked the kernel to write out), `writeback_time`, `extends` (relation extend operations), `extend_bytes`, `extend_time`, `hits` (desired block found in a shared buffer), `evictions` (normal: block evicted from a buffer and replaced; bulkwrite/bulkread/vacuum: block evicted from shared buffers to add the buffer to a size-limited ring buffer), `reuses` (existing buffer in a ring buffer reused, in bulkread/bulkwrite/vacuum), `fsyncs` (only tracked in context normal), `fsync_time`, `stats_reset`.
  - Not tracked: relation I/O that bypasses shared buffers (e.g. moving a table between tablespaces). Nonsensical combinations omitted (e.g. no checkpointer + temp relation rows); impossible cells NULL (temp relation fsyncs; bgwriter reads).
  - For object wal: fsyncs/fsync_time = `issue_xlog_fsync`; writes/write_time = `XLogWrite`.
  - Tuning: high `evictions` -> increase shared_buffers; many `fsyncs` or `writes` by client backends -> shared buffers or checkpointer/bgwriter misconfigured.
- **pg_stat_bgwriter** (Table 27.24): `buffers_clean bigint` (buffers written by bgwriter), `maxwritten_clean` (times bgwriter stopped a cleaning scan because it had written too many buffers — bgwriter_lru_maxpages), `buffers_alloc` (buffers allocated), `stats_reset`.
- **pg_stat_checkpointer** (Table 27.25): `num_timed bigint` (scheduled checkpoints due to timeout), `num_requested`, `num_done` (actually performed — PG18 tag UNVERIFIED), `restartpoints_timed` (due to timeout or after a failed attempt), `restartpoints_req`, `restartpoints_done`, `write_time double precision` (ms writing files), `sync_time` (ms syncing files), `buffers_written` (shared buffers written during checkpoints and restartpoints), `slru_written` (SLRU buffers written — PG18 tag UNVERIFIED), `stats_reset`. Checkpoints may be skipped if the server was idle since the last one: num_timed/num_requested count completed + skipped; num_done only completed. Same for restartpoints.
- **pg_stat_wal** (Table 27.26): `wal_records bigint`, `wal_fpi bigint` (full page images), `wal_bytes numeric`, `wal_buffers_full bigint` (times WAL data was written to disk because WAL buffers became full), `stats_reset`. (UNVERIFIED from prior knowledge: in PG18 WAL write/sync counts and times live in pg_stat_io object=wal — consistent with the pg_stat_io and 28.5 text, which say so.)
- **pg_stat_database** (Table 27.27; one row per DB plus one for shared objects with datid 0 / datname NULL): `datid`, `datname`, `numbackends integer` (only column reflecting current state), `xact_commit`, `xact_rollback`, `blks_read`, `blks_hit` (PostgreSQL buffer cache hits only, not OS cache), `tup_returned` (live rows fetched by seq scans and index entries returned by index scans), `tup_fetched` (live rows fetched by index scans), `tup_inserted`, `tup_updated`, `tup_deleted`, `conflicts` (queries canceled due to recovery conflicts), `temp_files`, `temp_bytes` (regardless of log_temp_files), `deadlocks`, `checksum_failures` (NULL if checksums disabled), `checksum_last_failure`, `blk_read_time`, `blk_write_time` (ms, track_io_timing), `session_time`, `active_time` (states active and fastpath function call), `idle_in_transaction_time`, `sessions`, `sessions_abandoned` (client connection lost), `sessions_fatal`, `sessions_killed` (operator intervention), `parallel_workers_to_launch`, `parallel_workers_launched` (PG18 tag UNVERIFIED), `stats_reset`.
- **pg_stat_database_conflicts** (Table 27.28; standby only): `datid`, `datname`, `confl_tablespace` (dropped tablespaces), `confl_lock` (lock timeouts), `confl_snapshot` (old snapshots), `confl_bufferpin` (pinned buffers), `confl_deadlock`, `confl_active_logicalslot` (uses of logical slots canceled due to old snapshots or too low wal_level on primary).
- **pg_stat_all_tables** (Table 27.29): `relid`, `schemaname`, `relname`, `seq_scan`, `last_seq_scan timestamptz`, `seq_tup_read` (live rows fetched by sequential scans), `idx_scan`, `last_idx_scan`, `idx_tup_fetch` (live rows fetched by index scans), `n_tup_ins`, `n_tup_upd` (includes HOT and newpage updates), `n_tup_del`, `n_tup_hot_upd` (updates where no successor versions are required in indexes), `n_tup_newpage_upd` (successor version goes onto a new heap page, leaving an original with t_ctid pointing to a different heap page; always non-HOT), `n_live_tup` (estimated), `n_dead_tup` (estimated), `n_mod_since_analyze`, `n_ins_since_vacuum` (not counting VACUUM FULL), `last_vacuum` (manual, not VACUUM FULL), `last_autovacuum`, `last_analyze`, `last_autoanalyze`, `vacuum_count`, `autovacuum_count`, `analyze_count`, `autoanalyze_count`, `total_vacuum_time`, `total_autovacuum_time`, `total_analyze_time`, `total_autoanalyze_time` (ms, include cost-delay sleep; PG18 tag UNVERIFIED).
- **pg_stat_all_indexes** (Table 27.30): `relid`, `indexrelid`, `schemaname`, `relname`, `indexrelname`, `idx_scan`, `last_idx_scan`, `idx_tup_read` (index entries returned by scans), `idx_tup_fetch` (live table rows fetched by simple index scans using this index).
  - Bitmap scan increments pg_stat_all_indexes.idx_tup_read for the indexes used and pg_stat_all_tables.idx_tup_fetch for the table, but NOT pg_stat_all_indexes.idx_tup_fetch. The optimizer also accesses indexes to check constants outside the recorded stats range.
  - idx_tup_read vs idx_tup_fetch differ: read counts index entries; fetch counts live rows from the table (less if dead/uncommitted rows fetched, or heap fetches avoided by index-only scan).
  - One index scan node may perform multiple index searches, each incrementing idx_scan: `= ANY(array)`/IN lists, OR constructs converted to arrays, and B-tree **skip scan** (PG18 tag UNVERIFIED). EXPLAIN ANALYZE shows "Index Searches".
- **pg_statio_all_tables** (Table 27.31): `relid`, `schemaname`, `relname`, `heap_blks_read`, `heap_blks_hit`, `idx_blks_read`, `idx_blks_hit` (all indexes on the table), `toast_blks_read`, `toast_blks_hit`, `tidx_blks_read`, `tidx_blks_hit` (TOAST table's indexes).
- **pg_statio_all_indexes** (Table 27.32): `relid`, `indexrelid`, `schemaname`, `relname`, `indexrelname`, `idx_blks_read`, `idx_blks_hit`.
- **pg_statio_all_sequences** (Table 27.33): `relid`, `schemaname`, `relname`, `blks_read`, `blks_hit`.
- **pg_stat_user_functions** (Table 27.34; `track_functions`): `funcid`, `schemaname`, `funcname`, `calls bigint`, `total_time double precision` (ms, incl. called functions), `self_time` (ms, excluding called functions).
- **pg_stat_slru** (Table 27.35; SLRU = simple least-recently-used caches; each core SLRU has a `*_buffers` GUC): `name text`, `blks_zeroed`, `blks_hit`, `blks_read`, `blks_written`, `blks_exists` (blocks checked for existence), `flushes`, `truncates`, `stats_reset`. SLRU names accepted by pg_stat_reset_slru: `commit_timestamp`, `multixact_member`, `multixact_offset`, `notify`, `serializable`, `subtransaction`, `transaction`, plus `other` (all other e.g. extension-defined caches).

**Statistics functions (Table 27.36):** `pg_backend_pid()`; `pg_stat_get_backend_io(pid)` (same fields as pg_stat_io; not for checkpointer, bgwriter, startup, autovacuum launcher); `pg_stat_get_activity(pid|NULL)`; `pg_stat_get_backend_wal(pid)` (same fields as pg_stat_wal); `pg_stat_get_snapshot_timestamp()`; `pg_stat_get_xact_blocks_fetched(oid)` (minus hits = kernel read() calls); `pg_stat_get_xact_blocks_hit(oid)`; `pg_stat_clear_snapshot()`; `pg_stat_reset()` (current DB); `pg_stat_reset_shared([target])` targets: `archiver`, `bgwriter`, `checkpointer`, `io`, `recovery_prefetch`, `slru`, `wal`, NULL = all; `pg_stat_reset_single_table_counters(oid)`; `pg_stat_reset_backend_stats(pid)`; `pg_stat_reset_single_function_counters(oid)`; `pg_stat_reset_slru([target])`; `pg_stat_reset_replication_slot(text)`; `pg_stat_reset_subscription_stats(oid)`. Reset functions are superuser-only by default (EXECUTE grantable).
**Per-backend functions (Table 27.37; take backend ID from `pg_stat_get_backend_idset()`):** pg_stat_get_backend_activity, _activity_start, _client_addr, _client_port, _dbid, _idset, _pid, _start, _subxact (returns `subxact_count` = number of subtransactions in the backend's subtransaction cache, `subxact_overflowed` boolean), _userid, _wait_event, _wait_event_type, _xact_start.

### INVENTORY: XID / MXID thresholds and special values  [M5, M7]  (source: routine-vacuuming.txt, transaction-id.txt, subxacts.txt, hot-standby.txt)

| Item | Value |
|---|---|
| XID width | 32 bits (wraps ~every 4 billion); 32-bit epoch; `xid8` = 64-bit with epoch |
| InvalidTransactionId | 0 (from general knowledge; not stated on these pages) |
| BootstrapTransactionId | 1 (rows from initdb's first phase) |
| FrozenTransactionId | 2 (always older than any normal XID; literal xmin only in pre-9.4 pg_upgraded DBs) |
| Normal XID comparison | modulo 2^32: ~2 billion older, ~2 billion newer |
| Must vacuum every table at least once every | ~2 billion transactions |
| Max unvacuumed time | 2 billion minus `vacuum_freeze_min_age` at last aggressive vacuum |
| Aggressive vacuum trigger | age(relfrozenxid) > `vacuum_freeze_table_age` (effective cap 0.95 * `autovacuum_freeze_max_age`); or `vacuum_freeze_table_age = 0`; or FREEZE option |
| Forced anti-wraparound autovacuum | age(relfrozenxid) > `autovacuum_freeze_max_age` (runs even if autovacuum disabled; not auto-canceled by lock conflicts) |
| `autovacuum_freeze_max_age` default | 200 million (stated in 24.1.5); max two billion |
| pg_xact size | 2 bits per transaction: ~50MB at 200M, ~0.5GB at 2B |
| pg_commit_ts size | ~2GB at 200M, ~20GB at 2B |
| Warning threshold | 40 million transactions (XIDs or MXIDs) from wraparound |
| Hard stop | fewer than 3 million left: no new XIDs (or MXIDs) assigned |
| Multixact member storage | aggressive vacuums more often above ~10GB; wraparound at ~20GB |
| Multixact aggressive triggers | age(relminmxid) > `vacuum_multixact_freeze_table_age`; > `autovacuum_multixact_freeze_max_age` forced |
| Subxid cache per backend | 64 open subxids in shared memory; beyond -> pg_subtrans lookups |
| Hot standby snapshot caveat | write transactions with > 64 subtransactions delay read-only connections |
| GID length | up to 200 bytes |
| vxid format | procNumber/localXID, e.g. `4/12532` |

### INVENTORY: autovacuum formulae  [M7]  (source: routine-vacuuming.txt)
- vacuum threshold = Minimum(`autovacuum_vacuum_max_threshold`, `autovacuum_vacuum_threshold` + `autovacuum_vacuum_scale_factor` * reltuples); compared with dead tuples since last vacuum.
- vacuum insert threshold = `autovacuum_vacuum_insert_threshold` + `autovacuum_vacuum_insert_scale_factor` * reltuples * (1 - relallfrozen / relpages); compared with tuples inserted since last vacuum.
- analyze threshold = `autovacuum_analyze_threshold` + `autovacuum_analyze_scale_factor` * reltuples; compared with tuples inserted + updated + deleted since last ANALYZE.
- Launcher cadence: one worker per database every `autovacuum_naptime` / N seconds (N databases), at most `autovacuum_max_workers` concurrently.
- Numeric defaults of these GUCs are in ch.19 (not this slice) and are not restated here.

### INVENTORY: synchronous_commit levels  [M7]  (source: warm-standby.txt, wal-async-commit.txt, monitoring-stats.txt)

| Level | Commit waits for | Lag column that measures it | Loss possible if |
|---|---|---|---|
| off | nothing (async commit; WAL writer flushes within 3 x wal_writer_delay) | — | primary crashes in risk window (loss, not corruption) |
| local | local WAL flush | — | primary lost before standby received |
| remote_write | standby received and wrote to its OS (not flushed) | write_lag | both crash and primary DB corrupted at same time (or standby OS crash) |
| on (default) | standby flushed commit record to durable storage (with sync standbys configured; else local flush) | flush_lag | both crash simultaneously |
| remote_apply | standby replayed it (visible to queries) | replay_lag | both crash simultaneously |

- `synchronous_standby_names` forms: `FIRST n (s1, s2, ...)` (priority) and `ANY n (s1, s2, ...)` (quorum). `sync_state`: async, potential, sync, quorum.
- Never wait: read-only transactions, rollbacks, subtransaction commits. Always wait (with sync rep): both PREPARE TRANSACTION and COMMIT PREPARED. Always synchronous locally regardless of setting: DROP TABLE and other utility commands, two-phase commands.

### INVENTORY: GUCs referenced in this slice (defaults only where the slice pages state them)  [M7, M1]
- Vacuum/autovacuum: `vacuum_freeze_min_age`, `vacuum_freeze_table_age`, `vacuum_multixact_freeze_min_age`, `vacuum_multixact_freeze_table_age`, `vacuum_max_eager_freeze_failure_rate`, `autovacuum_freeze_max_age` (200 million), `autovacuum_multixact_freeze_max_age`, `autovacuum_naptime`, `autovacuum_max_workers`, `autovacuum_vacuum_threshold`, `autovacuum_vacuum_scale_factor`, `autovacuum_vacuum_max_threshold`, `autovacuum_vacuum_insert_threshold`, `autovacuum_vacuum_insert_scale_factor`, `autovacuum_analyze_threshold`, `autovacuum_analyze_scale_factor`, `autovacuum_vacuum_cost_delay`, `autovacuum_vacuum_cost_limit`, `autovacuum_work_mem`, `maintenance_work_mem`, `log_autovacuum_min_duration`, `default_statistics_target`, `track_counts`.
- Logging: `logging_collector`, `log_destination`, `cluster_name`, `update_process_title`, `log_hostname`, `log_recovery_conflict_waits`, `log_temp_files`, `log_checkpoints`.
- WAL/checkpoint: `wal_level` (minimal / replica / logical; restart only), `fsync`, `full_page_writes`, `wal_sync_method` (open_datasync [Windows default per 28.1], open_sync, fdatasync, fsync, fsync_writethrough), `synchronous_commit` (default on), `wal_writer_delay`, `commit_delay` (default 0), `commit_siblings`, `wal_buffers`, `checkpoint_timeout` (5 min), `max_wal_size` (1 GB), `min_wal_size`, `checkpoint_completion_target` (0.9), `checkpoint_warning`, `checkpoint_flush_after`, `wal_keep_size`, `wal_debug`, `track_wal_io_timing`, `recovery_prefetch` (try), `maintenance_io_concurrency`, `wal_decode_buffer_size`, `summarize_wal`, `data_checksums` (read-only), `ignore_checksum_failure`, `track_commit_timestamp`, `wal_consistency_checking`.
- Archiving/recovery: `archive_mode` (off / on / always), `archive_command`, `archive_library`, `archive_timeout`, `archive_cleanup_command`, `restore_command`, `recovery_end_command`, `recovery_target_*` (time, name, xid; timeline default `latest`), `recovery_target_timeline`.
- Replication: `primary_conninfo`, `primary_slot_name`, `max_wal_senders`, `max_replication_slots`, `max_slot_wal_keep_size`, `idle_replication_slot_timeout`, `wal_sender_timeout`, `wal_receiver_timeout`, `wal_receiver_status_interval`, `wal_retrieve_retry_interval`, `hot_standby` (on), `hot_standby_feedback`, `max_standby_archive_delay`, `max_standby_streaming_delay`, `synchronous_standby_names`, `synchronized_standby_slots`, `listen_addresses`, `tcp_keepalives_idle`, `tcp_keepalives_interval`, `tcp_keepalives_count`, `max_connections`, `max_prepared_transactions`, `max_locks_per_transaction`, `max_worker_processes`, `deadlock_timeout`.
- Logical replication: `max_active_replication_origins`, `max_logical_replication_workers`, `max_sync_workers_per_subscription`, `max_parallel_apply_workers_per_subscription`, `logical_decoding_work_mem`, `output_plugin_libraries`, `session_replication_role`.
- Statistics: `track_activities`, `track_activity_query_size` (query text truncated at 1024 bytes by default), `track_cost_delay_timing`, `track_functions`, `track_io_timing`, `stats_fetch_consistency` (cache / snapshot / none), `compute_query_id`.
- JIT: `jit`, `jit_above_cost`, `jit_inline_above_cost`, `jit_optimize_above_cost`, `jit_provider`.
- Storage: `default_toast_compression`, `toast_tuple_target` (table storage parameter), `fillfactor` (table storage parameter), `temp_tablespaces`.

### INVENTORY: progress views and phases  [M7]
- pg_stat_progress_analyze: initializing, acquiring sample rows, acquiring inherited sample rows, computing statistics, computing extended statistics, finalizing analyze.
- pg_stat_progress_cluster: initializing, seq scanning heap, index scanning heap, sorting tuples, writing new heap, swapping relation files, rebuilding index, performing final cleanup.
- pg_stat_progress_copy: no phases (command COPY FROM/TO; type FILE, PROGRAM, PIPE, CALLBACK).
- pg_stat_progress_create_index: initializing, waiting for writers before build, building index, waiting for writers before validation, index validation: scanning index, index validation: sorting tuples, index validation: scanning table, waiting for old snapshots, waiting for readers before marking dead, waiting for readers before dropping.
- pg_stat_progress_vacuum: initializing, scanning heap, vacuuming indexes, vacuuming heap, cleaning up indexes, truncating heap, performing final cleanup.
- pg_stat_progress_basebackup: initializing, waiting for checkpoint to finish, estimating backup size, streaming database files, waiting for wal archiving to finish, transferring wal files.

### INVENTORY: physical storage structures  [M2]  (source: storage-*.txt)

| Structure | Size | Key facts |
|---|---|---|
| Page (block) | 8 kB default (compile-time) | header, line pointers, free space, items, special space |
| PageHeaderData | 24 bytes | pd_lsn 8, pd_checksum 2, pd_flags 2, pd_lower 2, pd_upper 2, pd_special 2, pd_pagesize_version 2, pd_prune_xid 4 |
| Page layout version | 4 | since 8.3 |
| ItemIdData (line pointer) | 4 bytes | offset, length, flag bits; CTID = (block, line pointer index) |
| ItemPointerData (t_ctid) | 6 bytes | |
| HeapTupleHeaderData | 23 bytes fixed | t_xmin 4, t_xmax 4, t_cid/t_xvac 4 (overlaid), t_ctid 6, t_infomask2 2, t_infomask 2, t_hoff 1 |
| Null bitmap | 1 bit per column | present only if HEAP_HASNULL; 1 = not null |
| Varlena header | 4 bytes, or 1 byte for < 127 bytes | 2 bits reserved by TOAST; max value 1 GB (2^30 - 1) |
| On-disk TOAST pointer | 18 bytes | toast relid, chunk_id, raw size, stored size, compression method |
| TOAST chunk | TOAST_MAX_CHUNK_SIZE ~2000 bytes | 4 chunks per page; columns chunk_id, chunk_seq, chunk_data |
| TOAST_TUPLE_THRESHOLD / TARGET | ~2 kB each | target adjustable via toast_tuple_target |
| FSM | 1 byte per heap page | tree of FSM pages, binary max-tree per page; no FSM for hash indexes |
| VM | 2 bits per heap page | all-visible, all-frozen; heap only; set only by vacuum |
| Segment file | 1 GB default | `filenode`, `filenode.1`, ... (`--with-segsize`) |
| WAL segment / WAL page | 16 MB / 8 kB | `--wal-segsize`, `--with-wal-blocksize` |
| Forks | main, `_fsm`, `_vm`, `_init` | init only for unlogged relations |

- TOAST strategies: PLAIN (none), EXTENDED (compress then out-of-line; default), EXTERNAL (out-of-line, no compression), MAIN (compress; out-of-line only as last resort).
- TOAST pointer kinds: on-disk; in-memory indirect; in-memory expanded (read-write / read-only).

### INVENTORY: SQL functions and utilities referenced in this slice  [M7]
- Functions: `age()`, `mxid_age()`, `pg_get_multixact_members()`, `pg_terminate_backend()`, `pg_cancel_backend()`, `pg_switch_wal()`, `pg_backup_start(label, fast)`, `pg_backup_stop(wait_for_archive)`, `pg_current_wal_lsn()`, `pg_last_wal_receive_lsn()`, `pg_last_wal_replay_lsn()`, `pg_promote()`, `pg_create_physical_replication_slot()`, `pg_create_logical_replication_slot(name, 'pgoutput')`, `pg_replication_origin_advance()`, `pg_control_system()`, `pg_relation_filepath()`, `pg_relation_filenode()`, `pg_backend_pid()` and the pg_stat_* functions listed above.
- Views/catalogs: `pg_class` (relfrozenxid, relminmxid, relallfrozen, relpages, reltuples, reltoastrelid, relfilenode), `pg_database` (datfrozenxid, datminmxid), `pg_prepared_xacts`, `pg_replication_slots` (xmin, catalog_xmin, failover, synced, temporary, invalidation_reason, conflicting), `pg_locks` (virtualxid, transactionid), `pg_wait_events`, `pg_subscription` (subfailover, subslotname), `pg_subscription_rel` (srsubstate: i, r, f ...), `pg_replication_origin`, `pg_replication_origin_status`, `pg_index`.
- Programs: `pg_dump`, `pg_dumpall`, `pg_restore`, `psql`, `createdb`, `vacuumdb`, `pg_basebackup`, `pg_combinebackup`, `pg_archivecleanup`, `pg_rewind`, `pg_receivewal`, `pg_recvlogical`, `pg_ctl` (promote, logrotate), `pg_checksums`, `pg_test_fsync`, `pg_upgrade`, `oid2name`; external: check_postgres, pgBadger, rotatelogs, logrotate, diskchecker.pl, DRBD, Pgpool-II, Slony-I, Londiste, Bucardo, PL/Proxy.


## Lesson ideas

### Visualizers
- **8 kB heap page explorer** [M2]: draw PageHeaderData (24 bytes, the eight fields at their byte offsets), the line-pointer array growing up from pd_lower, tuples growing down from pd_upper, special space at pd_special. Drive it with live `page_header()` / `heap_page_items()` output from pageinspect after each INSERT/UPDATE/DELETE. Highlight a 23-byte tuple header padded to t_hoff = 24.
- **HOT chain animation** [M2, M5]: UPDATE a non-indexed column repeatedly on one page -> show new tuple versions on the same page, t_ctid chains, then pruning on a SELECT turning the root line pointer into LP_REDIRECT and freeing intermediate ones. Contrast with an update of an indexed column (new index entry) and with a full page (`n_tup_newpage_upd`). Slider for fillfactor.
- **XID clock** [M5, M7]: circular 2^32 XID space with the "2 billion older / 2 billion newer" halves rotating as the counter advances; place tuples by xmin; show freezing taking a tuple out of the circle; mark vacuum_freeze_min_age, vacuum_freeze_table_age, autovacuum_freeze_max_age, the 40-million warning band and the 3-million stop band.
- **Visibility map / freeze state per page** [M2, M7]: grid of heap pages with two bits (all-visible, all-frozen); animate how DML clears bits, normal vacuum sets all-visible, eager scanning and aggressive vacuum set all-frozen, and which pages a normal vs aggressive vacuum must read.
- **Autovacuum trigger calculator** [M7]: inputs reltuples, relpages, relallfrozen, the threshold/scale GUCs; outputs dead-tuple and insert thresholds per the documented formulae (including the Minimum with autovacuum_vacuum_max_threshold) and the analyze threshold.
- **VACUUM phase stepper** [M7]: the seven pg_stat_progress_vacuum phases, with the loop scanning heap -> vacuuming indexes -> vacuuming heap repeating when maintenance_work_mem fills (max_dead_tuple_bytes), then cleanup and tail truncation.
- **WAL and checkpoint timeline** [M7]: LSN axis with records appended, checkpoint markers, redo point, full page image emitted on first touch after a checkpoint; dirty buffers written gradually over checkpoint_completion_target; crash button -> recovery reads pg_control, finds checkpoint, replays from redo.
- **Commit path / synchronous_commit ladder** [M7]: animate a commit record travelling local WAL buffer -> local disk -> standby OS -> standby disk -> standby replay, stopping where each level (off, local, remote_write, on, remote_apply) releases the client; show the 3 x wal_writer_delay window for off.
- **Standby WAL source loop** [M7]: state machine archive -> pg_wal -> streaming -> back to archive, plus promote exit.
- **Hot standby conflict simulator** [M7]: primary vacuum removes a row a standby snapshot needs; timer for max_standby_streaming_delay measured from WAL receipt; toggle hot_standby_feedback to show bloat vs cancellations.
- **Row filter UPDATE transformation table** [M7]: pick old/new values against `WHERE (a > 5 AND c = 'NSW')` and show whether the change becomes UPDATE, INSERT, DELETE or nothing (Table 29.1).
- **TOAST decision flow** [M2]: row width vs TOAST_TUPLE_THRESHOLD; per column strategy (PLAIN/EXTENDED/EXTERNAL/MAIN) -> compress -> move out of line into ~2000-byte chunks -> 18-byte pointer left in the row.
- **Varlena header bit decoder** [M2]: show the 1-byte vs 4-byte header, compressed bit, TOAST pointer marker.
- **Subtransaction tree** [M5]: SAVEPOINTs nesting; xids assigned lazily on first write with parent < child; subcommit/abort propagation; counter turning red past 64 cached subxids.
- **Wait event explorer** [M1, M5]: filterable list of every wait event by type from the inventory, linked to the process that typically shows it.

### Playground SQL (PGlite, PostgreSQL 18, single session)
```sql
-- Page header and line pointers
CREATE EXTENSION IF NOT EXISTS pageinspect;
CREATE TABLE t (id int PRIMARY KEY, v text) WITH (fillfactor = 70);
INSERT INTO t SELECT g, 'row ' || g FROM generate_series(1, 5) g;
SELECT * FROM page_header(get_raw_page('t', 0));          -- lsn, checksum, flags, lower, upper, special, pagesize, version, prune_xid
SELECT lp, lp_off, lp_flags, lp_len, t_xmin, t_xmax, t_ctid, t_infomask2, t_infomask, t_hoff
  FROM heap_page_items(get_raw_page('t', 0));

-- HOT update: non-indexed column, same page
UPDATE t SET v = 'changed' WHERE id = 1;
SELECT lp, lp_flags, t_ctid, t_xmin, t_xmax FROM heap_page_items(get_raw_page('t', 0));
SELECT n_tup_upd, n_tup_hot_upd, n_tup_newpage_upd FROM pg_stat_user_tables WHERE relname = 't';
-- (stats flush lag: counters appear after the transaction ends; pg_stat_xact_user_tables shows them immediately)

-- Visibility map and freezing
CREATE EXTENSION IF NOT EXISTS pg_visibility;
SELECT * FROM pg_visibility_map('t');                     -- all_visible, all_frozen per block
VACUUM (VERBOSE) t;
SELECT * FROM pg_visibility_map('t');
VACUUM (FREEZE, VERBOSE) t;
SELECT * FROM pg_visibility_map_summary('t');
SELECT relname, age(relfrozenxid), mxid_age(relminmxid), relpages, reltuples, relallvisible, relallfrozen
  FROM pg_class WHERE relname = 't';
SELECT datname, age(datfrozenxid) FROM pg_database;

-- Free space map
CREATE EXTENSION IF NOT EXISTS pg_freespacemap;
DELETE FROM t WHERE id > 2; VACUUM t;
SELECT * FROM pg_freespace('t');

-- Files and forks
SELECT pg_relation_filepath('t'), pg_relation_filenode('t');
SELECT pg_relation_size('t', 'main'), pg_relation_size('t', 'fsm'), pg_relation_size('t', 'vm');

-- TOAST
CREATE TABLE big (id int, doc text);
INSERT INTO big VALUES (1, repeat('x', 10000)), (2, (SELECT string_agg(md5(g::text), '') FROM generate_series(1, 300) g));
SELECT reltoastrelid::regclass FROM pg_class WHERE relname = 'big';
SELECT id, pg_column_size(doc), octet_length(doc), pg_column_compression(doc) FROM big;
ALTER TABLE big ALTER COLUMN doc SET STORAGE EXTERNAL;

-- WAL: LSN arithmetic and records
CREATE EXTENSION IF NOT EXISTS pg_walinspect;
SELECT pg_current_wal_lsn() AS before \gset
INSERT INTO t VALUES (100, 'wal demo');
SELECT pg_wal_lsn_diff(pg_current_wal_lsn(), :'before') AS bytes;   -- \gset is psql-only; in PGlite store the LSN in a table instead
SELECT start_lsn, resource_manager, record_type, record_length, fpi_length
  FROM pg_get_wal_records_info(:'before', pg_current_wal_lsn());
CHECKPOINT;  -- then UPDATE a row and look for a non-zero fpi_length (full page image after checkpoint)
SELECT * FROM pg_stat_wal; SELECT * FROM pg_stat_checkpointer;

-- XIDs, vxids, subtransactions
BEGIN; SELECT pg_current_xact_id_if_assigned(); SELECT virtualxid, transactionid FROM pg_locks WHERE pid = pg_backend_pid() AND locktype IN ('virtualxid','transactionid');
INSERT INTO t VALUES (200, 'x'); SELECT pg_current_xact_id();
SAVEPOINT s1; INSERT INTO t VALUES (201, 'y'); SELECT pg_current_xact_id();  -- still the top-level xid; subxid is separate
SELECT * FROM pg_stat_get_backend_subxact((SELECT backendid FROM pg_stat_get_backend_idset() backendid WHERE pg_stat_get_backend_pid(backendid) = pg_backend_pid()));
ROLLBACK;

-- Progress and activity
SELECT pid, state, backend_type, wait_event_type, wait_event, backend_xid, backend_xmin FROM pg_stat_activity;
SELECT type, name, description FROM pg_wait_events WHERE type = 'IO' ORDER BY name;

-- Async commit (behaviour is per transaction)
SET synchronous_commit = off; INSERT INTO t VALUES (300, 'fast'); RESET synchronous_commit;

-- Logical replication objects can be created even without a subscriber
CREATE PUBLICATION p1 FOR TABLE t WHERE (id > 5);   -- needs wal_level=logical to be useful; creation itself may work
ALTER TABLE t REPLICA IDENTITY FULL;
SELECT * FROM pg_publication_tables;

-- JIT decision (only if PGlite build has LLVM; otherwise EXPLAIN shows no JIT section)
SET jit_above_cost = 10; EXPLAIN (ANALYZE) SELECT sum(relpages) FROM pg_class;
```
- PGlite caveats: no replication, archiving, standby, pg_basebackup, DTrace, regression tests or file access; teach those with simulated visualizers. Several functions above require superuser in a normal server; PGlite runs as superuser.

### Pitfalls the docs warn about (with documented fixes)
- Disabling autovacuum: unwise unless workload extremely predictable; anti-wraparound vacuums run anyway. Fix: tune thresholds instead.
- Regularly taking locks that conflict with SHARE UPDATE EXCLUSIVE (e.g. frequent ANALYZE) can stop autovacuum from ever completing.
- Autovacuum never ANALYZEs partitioned tables, inheritance parents (when only children change), or foreign tables; cannot touch temp tables. Fix: manual ANALYZE.
- Wraparound shutdown: don't use single-user mode, VACUUM FULL or VACUUM FREEZE; run VACUUM as superuser after clearing old prepared transactions, long transactions and stale slots.
- Large `autovacuum_freeze_max_age` costs pg_xact/pg_commit_ts space only; too-close `vacuum_freeze_table_age` causes needless anti-wraparound vacuums.
- `pg_stat_reset()` resets autovacuum's counters -> run database-wide ANALYZE afterwards.
- Statistics are reset after crash, immediate shutdown, base-backup start, PITR.
- Stats views lag up to ~1 s and are cached per transaction (`stats_fetch_consistency`); use `pg_stat_clear_snapshot()`.
- File-system backups need the server down or a simultaneous snapshot of all volumes incl. WAL; individual table files are useless without pg_xact.
- archive_command must return 0 only on success and must not overwrite existing different files; GNU `cp -i` returns 0 when target exists. Failed archiving fills pg_wal -> PANIC when full.
- Very short archive_timeout bloats the archive (files are always 16 MB); about a minute is reasonable.
- Stop point must be after the end of the base backup; incremental backup chains must be tracked manually.
- Omit pg_replslot from base backups, or standbys built from them retain WAL / cause primary bloat.
- Don't modify template databases or create/drop tablespaces during a base backup (take a new base backup after tablespace changes).
- Replication slots can fill pg_wal: set `max_slot_wal_keep_size`; drop abandoned slots (also hold back xmin).
- Synchronous replication: commits hang if required standbys are down; name potential standbys; run pg_backup_start/stop with synchronous_commit = off while waiting transactions exist.
- Hot standby: standby must have max_connections, max_prepared_transactions, max_locks_per_transaction, max_wal_senders, max_worker_processes >= primary (raise on standbys first); Serializable not available; no VACUUM/ANALYZE/CREATE INDEX on standby.
- Async commit is not `fsync = off`: fsync off can corrupt the database on OS/hardware crash.
- Write-back caches without battery and SSDs that ignore flush commands break durability; test with pg_test_fsync / diskchecker.pl.
- `full_page_writes = off` only if the storage prevents torn pages (e.g. ZFS); BBU alone is not enough.
- `checkpoint_completion_target = 1.0` likely causes late checkpoints; keep <= 0.9. Frequent "checkpoints too frequent" warnings -> raise max_wal_size.
- Logical replication: no DDL, sequences or large objects replicated; column lists are not a security feature; publications have no privileges; REPLICA IDENTITY FULL without a usable index is slow and fails for types like point/box; replica identity NOTHING blocks UPDATE/DELETE on the publisher; SKIP drops the whole transaction; dropping a subscription whose publisher is unreachable leaves a WAL-retaining slot.
- `run_as_owner = true` lets any table owner run code as the subscription owner.
- Filenode is not the OID (changes after TRUNCATE, REINDEX, CLUSTER); pg_class.relfilenode is 0 for mapped catalogs.
- `relpages` is updated only by VACUUM, ANALYZE and some DDL.
- Custom WAL rmgr extensions must stay in shared_preload_libraries while their records exist, or the server may not start.
- More than 64 open subtransactions per backend causes significant pg_subtrans I/O; and delays hot standby connections.
- JIT on short queries costs more than it saves (docs example 0.365 ms vs 7.416 ms); decisions are fixed at plan time for generic plans.

