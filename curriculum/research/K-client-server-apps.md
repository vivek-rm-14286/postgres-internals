# K — Part VI Reference: PostgreSQL Client Applications and PostgreSQL Server Applications

## Coverage ledger
| idx | file | one-line summary |
|---|---|---|
| 788 | reference-client.txt | Chapter TOC for the 21 client apps; client apps run on any host; user and database names keep their case, other identifiers do not |
| 789 | app-clusterdb.txt | clusterdb: wraps CLUSTER; re-clusters only previously clustered tables on their last index; -a, -t, --maintenance-db |
| 790 | app-createdb.txt | createdb: wraps CREATE DATABASE; locale and provider options, -S strategy, -T template, maintenance-db fallback postgres→template1 |
| 791 | app-createuser.txt | createuser: wraps CREATE ROLE; attribute flags and their defaults, -a/-m/-g membership, -P password hashed to SCRAM client-side |
| 792 | app-dropdb.txt | dropdb: wraps DROP DATABASE; -f/--force terminates connections; -i, --if-exists |
| 793 | app-dropuser.txt | dropuser: wraps DROP ROLE; needs CREATEROLE + ADMIN OPTION for non-superusers |
| 794 | app-ecpg.txt | ecpg: embedded SQL C preprocessor; .pgc→.c, -C compat modes, -r no_indicator/prepare/questionmarks, -t autocommit |
| 795 | app-pgamcheck.txt | pg_amcheck: runs amcheck over databases; selection patterns, heap options, btree options; --parent-check/--rootdescend take blocking locks |
| 796 | app-pgbasebackup.txt | pg_basebackup: physical backup over replication protocol; formats, -X none/fetch/stream, incremental, compression, manifest, standby limits |
| 797 | pgbench.txt | pgbench: TPC-B-like benchmark; init steps, run options, script language (meta-commands, operators, functions), logs, retries, practices |
| 798 | app-pgcombinebackup.txt | pg_combinebackup: rebuilds a synthetic full backup from an incremental chain; copy/link/clone/copy-file-range; checksum caveat |
| 799 | app-pgconfig.txt | pg_config: prints install directories and build flags (--pkglibdir, --pgxs, --configure ...) |
| 800 | app-pgdump.txt | pg_dump: consistent logical dump of one database; 4 formats, selection, sections, statistics, parallel locking protocol, version rules |
| 801 | app-pg-dumpall.txt | pg_dumpall: whole cluster plus globals (roles, tablespaces, parameter grants) as a psql script; --no-role-passwords reads pg_roles |
| 802 | app-pg-isready.txt | pg_isready: connection check; exit codes 0/1/2/3; default timeout 3 s |
| 803 | app-pgreceivewal.txt | pg_receivewal: streams WAL to a directory; start-point algorithm; --synchronous; remote_apply pitfall; slots |
| 804 | app-pgrecvlogical.txt | pg_recvlogical: create/drop/start logical slots; lazy confirmation; --endpos is not transaction-aware; SIGHUP rotates the file |
| 805 | app-pgrestore.txt | pg_restore: restores archives; -l/-L TOC editing, -j, -1, --transaction-size, filters, limitations |
| 806 | app-pgverifybackup.txt | pg_verifybackup: 4-stage check against backup_manifest; WAL parse via pg_waldump; tar needs -n |
| 807 | app-psql.txt | psql: options, exit codes, meta-command syntax, all meta-commands, \pset, patterns, variables, interpolation, prompts, environment, files |
| 808 | app-reindexdb.txt | reindexdb: wraps REINDEX; --concurrently, -j (not with --system), --tablespace |
| 809 | app-vacuumdb.txt | vacuumdb: wraps VACUUM/ANALYZE; VACUUM option flags, --min-xid-age/--min-mxid-age, --analyze-in-stages, --missing-stats-only |
| 810 | reference-server.txt | Chapter TOC for the 14 server apps; only useful on the server host |
| 811 | app-initdb.txt | initdb: creates shared catalogs and the postgres/template1/template0 databases; locale/encoding, auth default trust, checksums on by default, --wal-segsize |
| 812 | pgarchivecleanup.txt | pg_archivecleanup: archive_cleanup_command %r; removes WAL logically before a given file; .backup/.partial prefix handling |
| 813 | app-pgchecksums.txt | pg_checksums: offline check/enable/disable; disable only rewrites pg_control; replica consistency caveat |
| 814 | app-pgcontroldata.txt | pg_controldata: prints pg_control (catalog version, WAL and checkpoint info); cluster-wide |
| 815 | app-pgcreatesubscriber.txt | pg_createsubscriber: physical standby → logical replica without initial copy; prerequisites; 11-step algorithm; warnings |
| 816 | app-pg-ctl.txt | pg_ctl: init/start/stop/restart/reload/status/promote/logrotate/kill; smart/fast/immediate; wait logic via the PID file |
| 817 | app-pgresetwal.txt | pg_resetwal: last-resort WAL/pg_control reset; -f; safe-value formulas for XID/MXID/offsets; --wal-segsize, --char-signedness |
| 818 | app-pgrewind.txt | pg_rewind: block-level resync after timeline divergence; requirements; 5-step algorithm; omitted files |
| 819 | pgtestfsync.txt | pg_test_fsync: times each wal_sync_method in microseconds; -s default 5 s |
| 820 | pgtesttiming.txt | pg_test_timing: clock overhead histogram; EXPLAIN ANALYZE overhead demo; TSC/HPET/acpi_pm clock sources |
| 821 | pgupgrade.txt | pg_upgrade: reuses user data files with new catalogs; transfer modes incl. v18 --swap; 17-step procedure; statistics transfer; revert rules |
| 822 | pgwaldump.txt | pg_waldump: WAL decoder; filters (rmgr, relation, block, fork, xid, FPI), --stats, --save-fullpage name format |
| 823 | app-pgwalsummary.txt | pg_walsummary: prints WAL summary files (modified blocks per relation fork, limit block) used by incremental backup |
| 824 | app-postgres.txt | postgres: server options, semi-internal -f/-O/-P/-T, single-user mode, signal semantics, diagnostics |


## Notes by topic

### Common conventions for all client applications  [M1, M6]  (source: reference-client.txt, all app-*.txt)
- Client applications "can be run on any host, independent of where the database server resides". Server applications (second chapter) must run on the server host.
- On the command line, user and database names have case preserved (spaces/special chars may need shell quoting). Table names and other identifiers do NOT have case preserved, except where documented, and may need quoting.
- Shared connection options on nearly every client: `-h host`/`--host` (value starting with `/` = Unix-socket directory), `-p port`/`--port` (TCP port or socket file extension), `-U username`/`--username`, `-w`/`--no-password` (never prompt; fail if a password is needed and not available from e.g. `.pgpass`), `-W`/`--password` (force prompt; "never essential" — the tool auto-prompts, but without -W it "will waste a connection attempt finding out that the server wants a password").
- `--maintenance-db=dbname` (clusterdb, createdb, dropdb, reindexdb, vacuumdb, pg_amcheck): database used to discover the list of databases / run the CREATE/DROP DATABASE; default `postgres`, else `template1`. Can be a connection string; non-dbname connection-string params are reused for the other databases.
- `dbname` may be a connection string; "connection string parameters will override any conflicting command line options".
- Environment: `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER` plus all libpq env vars (Section 32.15); `PG_COLOR` = `always` | `auto` | `never` controls colored diagnostics.
- `-e`/`--echo` on the wrapper scripts shows the SQL they generate (great for teaching: each wrapper = one SQL command).
- `-V`/`--version`, `-?`/`--help` everywhere.

### SQL-wrapper utilities: clusterdb, createdb, createuser, dropdb, dropuser  [M1]  (source: app-clusterdb.txt, app-createdb.txt, app-createuser.txt, app-dropdb.txt, app-dropuser.txt)
- Every one of these is documented as "a wrapper around the SQL command X. There is no effective difference between ... via this utility and via other methods for accessing the server."
- **clusterdb** → `CLUSTER`. `clusterdb [connection-option...] [option...] [--table|-t table]... [dbname | -a | --all]`. Re-clusters only tables that were previously clustered, on the same index last used; never-clustered tables are not affected. Options: `-a/--all`, `[-d] dbname`, `-e/--echo`, `-q/--quiet`, `-t table/--table` (repeatable), `-v/--verbose`, `--maintenance-db`. Default db: `PGDATABASE`, else the connection user name.
- **createdb** → `CREATE DATABASE`. `createdb [connection-option...] [option...] [dbname [description]]`. Default dbname = current system user (PGDATABASE, then PGUSER). `description` becomes a comment. Options: `-D tablespace/--tablespace`, `-e`, `-E encoding/--encoding`, `-l locale/--locale` (equivalent to setting `--lc-collate`, `--lc-ctype`, and `--icu-locale` to the same value), `--lc-collate=`, `--lc-ctype=`, `--builtin-locale=`, `--icu-locale=`, `--icu-rules=` (ICU only), `--locale-provider={builtin|libc|icu}`, `-O owner/--owner`, `-S strategy/--strategy` (see CREATE DATABASE STRATEGY), `-T template/--template`, `--maintenance-db` (default `postgres`; `template1` if that doesn't exist or is the db being created). -D, -O, -T names are "processed as a double-quoted identifier".
  - Example: `createdb -p 5000 -h eden -T template0 -e demo` → `CREATE DATABASE demo TEMPLATE template0;`
- **createuser** → `CREATE ROLE`. Only superusers and CREATEROLE users can create users; creating SUPERUSER, REPLICATION, or BYPASSRLS roles requires connecting as a superuser. Options (defaults marked):
  - `-a role/--with-admin=role` (existing role added as member of new role WITH ADMIN OPTION; repeatable), `-m role/--with-member=role` (existing role added as member of new role; repeatable), `-g role/--member-of=role` (`--role` deprecated; new role becomes member of existing role; repeatable)
  - `-c number/--connection-limit` (default no limit), `-d/--createdb`, `-D/--no-createdb` (default), `-r/--createrole`, `-R/--no-createrole` (default), `-s/--superuser`, `-S/--no-superuser` (default), `-i/--inherit` (default), `-I/--no-inherit`, `-l/--login` (default), `-L/--no-login`, `--replication`, `--no-replication` (default), `--bypassrls`, `--no-bypassrls` (default)
  - `-P/--pwprompt` (prompt for new user's password), `-v timestamp/--valid-until` (password expiry; default none), `-E/--encrypted` (obsolete, accepted), `--interactive` (prompt for name and for unspecified -d/-D, -r/-R, -s/-S; "This was the default behavior up to PostgreSQL 9.1").
  - Examples: `createuser -h eden -p 5000 -S -D -R -e joe` → `CREATE ROLE joe NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT LOGIN;`. With `-P -s -e` the echoed command contains `PASSWORD 'SCRAM-SHA-256$4096:<salt>$<StoredKey>:<ServerKey>'` — "the password is encrypted before it is sent to the client" [sic] i.e. hashed client-side so the cleartext never reaches the server/log.
- **dropdb** → `DROP DATABASE`. Must be superuser or owner. Options: `-e`, `-f/--force` (terminate existing connections to the target db first), `-i/--interactive` (verification prompt: `Database "demo" will be permanently deleted. Are you sure? (y/n)`), `--if-exists` (notice instead of error), `--maintenance-db` (default `postgres`; `template1` if missing or it is the one being dropped).
- **dropuser** → `DROP ROLE`. Superusers can remove any role; otherwise only non-superuser roles, and only by a CREATEROLE user who has been granted ADMIN OPTION on the target role. Options: `-e`, `-i/--interactive` (confirm, and prompt for name if omitted), `--if-exists`.

### ecpg — embedded SQL C preprocessor  [M6]  (source: app-ecpg.txt)
- `ecpg [option...] file...`; converts C with `EXEC SQL` into plain C calling libecpg. Default input extension `.pgc` → output `.c`; input `-` = stdin (output stdout unless `-o`).
- Options: `-c` (auto-generate C code from SQL; currently works for `EXEC SQL TYPE`), `-C mode` (compat: `INFORMIX`, `INFORMIX_SE`, `ORACLE`), `-D symbol[=value]` (like `EXEC SQL DEFINE`; default value 1), `-h` (process header files: output `.h`, default input `.pgh`, forces `-c`), `-i` (parse system include files too), `-I directory` (include path for `EXEC SQL INCLUDE`; defaults in order: `.`, `/usr/local/include`, PostgreSQL include dir (default `/usr/local/pgsql/include`), `/usr/include`), `-o filename` (`-o -` = stdout), `-r option` with `no_indicator` (special values instead of indicators for NULL), `prepare` (prepare all statements before use; libecpg keeps a cache and frees the least-used statement when full), `questionmarks` (allow `?` placeholders), `-t` (autocommit: each command committed unless inside explicit transaction block; default mode commits only on `EXEC SQL COMMIT`), `-v` (version + include path), `--version`, `-?/--help`.
- Build recipe: `ecpg prog1.pgc; cc -I/usr/local/pgsql/include -c prog1.c; cc -o prog1 prog1.o -L/usr/local/pgsql/lib -lecpg`.

### pg_amcheck — corruption checker front-end for the amcheck extension  [M2, M4, M7]  (source: app-pgamcheck.txt)
- `pg_amcheck [option...] [dbname]`. Runs `amcheck`'s functions over one or more databases, optionally in parallel.
- Supported relation kinds: "ordinary and toast table relations, materialized views, sequences, and btree indexes". Other relation types are silently skipped.
- Database selection: positional `dbname` (single db, no other db-selection options), else `-a/--all`, `-d pattern/--database`, `-D pattern/--exclude-database`. Three-part relation patterns (`mydb*.myschema*.myrel*`) and two-part schema patterns (`mydb*.myschema*`) also add databases. With none: default database.
- Object selection (all repeatable, psql-style patterns): `-r/--relation`, `-R/--exclude-relation`, `-t/--table` (tables, matviews, sequences only), `-T/--exclude-table`, `-i/--index`, `-I/--exclude-index`, `-s/--schema`, `-S/--exclude-schema`.
- `--no-dependent-indexes`: by default checking a table also checks all its btree indexes. `--no-dependent-toast`: by default the table's toast table is also checked. `--no-strict-names`: a pattern for --database/--table/--index/--relation matching nothing is a fatal error by default; this downgrades to warning.
- Table (heap) checking options: `--exclude-toast-pointers` (skip the slow lookup validating each toast pointer against the toast table), `--on-error-stop` (after reporting all corruption on the first corrupt page of a table, move on; index checking *always* stops after first corrupt page), `--skip=all-frozen | all-visible | none` (skip pages so marked in the VM; default none), `--startblock=block`, `--endblock=block` (error if the table has fewer blocks; not for indexes; applies to both table and toast, but higher toast blocks may still be touched validating toast pointers).
- B-tree options: `--checkunique` (for unique indexes verify at most one of duplicate entries is visible), `--heapallindexed` (verify every heap tuple has an index tuple), `--parent-check` (use `bt_index_parent_check` instead of the default `bt_index_check`; adds parent/child checks), `--rootdescend` (re-find each leaf tuple by a fresh descent from the root; implies --parent-check; mostly a development aid, slow).
- WARNING (verbatim sense): the extra checks with `--parent-check` or `--rootdescend` "require relatively strong relation-level locks. These checks are the only checks that will block concurrent data modification from INSERT, UPDATE, and DELETE commands."
- Other: `-e/--echo`, `-j num/--jobs` (num connections or one per object, whichever is less; default 1), `-P/--progress` (relations done / total, sizes), `-v/--verbose`, `--install-missing[=schema]` (install missing `amcheck` extension; default schema `pg_catalog`), `--maintenance-db` (default `postgres`, else `template1`).
- Designed to work with PostgreSQL 14.0 and later.

### pg_basebackup — physical base backup over the replication protocol  [M7]  (source: app-pgbasebackup.txt)
- Takes a base backup of a *running* cluster without affecting other clients; usable for PITR and as the seed for a log-shipping/streaming standby. Always the entire cluster — "it is not possible to back up individual databases or database objects" (use pg_dump for selective).
- Full vs incremental: full = exact copy of cluster files. Incremental (`-i old_manifest_file/--incremental=`) uploads the reference backup's manifest to the server; some files are replaced with incremental versions "containing only those blocks that have been modified since the reference backup". An incremental backup cannot be used directly — `pg_combinebackup` must first combine it with the backups it depends on.
- The tool puts the server into and out of backup mode automatically.
- Requirements: regular connection using the replication protocol; role with `REPLICATION` or superuser; `pg_hba.conf` must permit the replication connection; `max_wal_senders` high enough for "at least one walsender for the backup plus one for WAL streaming (if used)".
- Multiple pg_basebackups can run concurrently, but usually better to take one and copy it.
- From a standby: needs `max_wal_senders`, `hot_standby`, pg_hba on standby, and `full_page_writes` enabled on the primary. Limitations: (1) backup history file is not created in the backed-up cluster; (2) cannot force the standby to switch WAL file at end of backup — with `-X none` and low write activity it may wait a long time for the last required WAL segment to be switched/archived (run `pg_switch_wal` on the primary); (3) if the standby is promoted during the backup, the backup fails; (4) all WAL needed must contain sufficient full-page writes.
- Progress: server view `pg_stat_progress_basebackup` (`backup_total` is NULL with `--no-estimate-size`).
- Output options:
  - `-D directory/--pgdata` (required; created with parents; must be empty if exists; `-` = tar to stdout).
  - `-F p|plain` (default; same layout as source; extra tablespaces go to the *same absolute path* as on the source unless `-T`), `-F t|tar` (`base.tar` + one tar per other tablespace named by tablespace OID; `-D -` only allowed when no additional tablespaces and WAL streaming not used).
  - `-R/--write-recovery-conf`: creates `standby.signal` and appends connection settings to `postgresql.auto.conf` (records the replication slot if one is used; dbname recorded only if given explicitly — used by logical replication slot synchronization).
  - `-t target/--target`: `client` (default), `server:/some/path` (store on server; needs superuser or `pg_write_server_files`), `blackhole` (discard; testing only). Cannot combine with `-X stream` (WAL streaming is implemented by pg_basebackup, not the server) → must specify `-Xfetch` or `-Xnone`.
  - `-T olddir=newdir/--tablespace-mapping` (absolute paths; `\=` to escape; repeatable; plain format only — ignored for tar; symlinks in data dir updated).
  - `--waldir=waldir` (absolute; plain format only; default is `pg_wal` in target).
  - `-X method/--wal-method`: `n|none` (no WAL); `f|fetch` (WAL collected at end — source needs `wal_keep_size` high enough or the backup "will fail and be unusable"; in tar format WAL goes inside `base.tar`); `s|stream` (DEFAULT; opens a second connection and streams WAL in parallel → needs two replication connections; tar format writes `pg_wal.tar`, or `pg_xlog.tar` for servers < 10). Unless `none`, the result is a completely standalone backup that can start without the WAL archive.
  - `-z/--gzip` (tar only; `.gz` suffix); `-Z level` or `-Z [{client|server}-]method[:detail]` — method `gzip`, `lz4`, `zstd`, `none`, or a plain integer (0 = none, >0 = gzip). Detail = integer level or comma list of `level`, `long`, `workers` keywords. Default location is client except with `--target` (then only server makes sense). With `-Xstream`, server-side compression is not applied to WAL; `pg_wal.tar` is compressed only with client-side gzip. Suffixes `.gz`, `.lz4`, `.zst`. In plain format client-side compression is not allowed but server-side is (compressed in transit, client decompresses).
- Generation/invocation options:
  - `-c {fast|spread}/--checkpoint` (default `spread`); the backup begins with a checkpoint on the source, during which pg_basebackup "will appear to be idle".
  - `-C/--create-slot` (create the slot named by `--slot` first; error if exists), `-S slotname/--slot` (only with `-X stream`; standby should then use the same name as `primary_slot_name` so the primary keeps WAL between end of backup and start of streaming), `--no-slot` (suppress the default *temporary* replication slot; default since v10 when streaming without -S; used when the server has no free slots).
  - `-l label/--label` (default `pg_basebackup base backup`), `-n/--no-clean` (keep partial output on error; tablespace dirs are never cleaned up), `-N/--no-sync`, `--sync-method=fsync|syncfs` (default fsync: recursively open+fsync every file; syncfs on Linux syncs whole filesystems; see `recovery_init_sync_method` caveats), `-P/--progress` (approximate; may not end at exactly 100%), `-r rate/--max-rate` (kB/s; `M` suffix; valid 32 kB/s .. 1024 MB/s; always throttles data dir, WAL only in fetch mode), `-v/--verbose`.
  - `--manifest-checksums=algorithm`: `NONE`, `CRC32C` (default), `SHA224`, `SHA256`, `SHA384`, `SHA512`. The manifest always contains a SHA256 checksum of its own contents. CRC32C is fast and catches accidental changes, not malicious ones. `--manifest-force-encode` (hex-encode all filenames; default only non-UTF8 names). `--no-manifest` (manifest lists every file except WAL files, with size, mtime, optional checksum). `--no-estimate-size` (not allowed with `--progress`).
  - `--no-verify-checksums`: by default data checksums (if enabled on server) are verified during backup; failures → non-zero exit status, but the backup is NOT removed (as if `--no-clean`), and failures are reported in `pg_stat_database`.
- Connection: `-d connstr/--dbname` (db name ignored by server, but overrides the default name `replication` for `~/.pgpass` lookup, and can be used by proxies and slot sync), `-h`, `-p`, `-s interval/--status-interval` (seconds between status packets; default 10; 0 disables periodic updates), `-U`, `-w`, `-W`.
- What is copied: all files in data dir and tablespaces including config files and third-party files, except certain temporary files and OS files. Only regular files and directories; tablespace symlinks preserved; symlinks to certain known directories copied as empty dirs; other symlinks and special device files skipped (see protocol Section 54.4).
- Tar format: user must unpack each tar before starting a server; tablespace symlinks are created by the server from the `tablespace_map` file inside `base.tar`.
- Version compatibility: works with servers same or older major, down to 9.1; `-X stream` needs server ≥ 9.3; tar format needs ≥ 9.5; `--incremental` needs ≥ 17. Group permissions on data files are preserved if enabled on the source.
- Plain-format backup on the same host as the server fails if tablespaces are used without `--tablespace-mapping`.
- Examples: `pg_basebackup -h mydbserver -D /usr/local/pgsql/data`; `pg_basebackup -D backup -Ft -z -P`; `pg_basebackup -D - -Ft -X fetch | bzip2 > backup.tar.bz2`; `pg_basebackup -D backup/data -T /opt/ts=$(pwd)/backup/ts`; `pg_basebackup -D backup -Ft --compress=gzip:9`.

### pgbench — benchmark driver  [M4, M5, M7]  (source: pgbench.txt)
- `pgbench -i [option...] [dbname]` (initialize) / `pgbench [option...] [dbname]` (run). Runs the same SQL script repeatedly in possibly many concurrent sessions and reports average TPS. Default scenario "loosely based on TPC-B": five SELECT, UPDATE, INSERT commands per transaction (seven commands counting BEGIN/END).
- Sample report lines: `transaction type`, `scaling factor`, `query mode`, `number of clients`, `number of threads`, `maximum number of tries`, `number of transactions per client`, `number of transactions actually processed: 10000/10000`, `number of failed transactions`, `latency average`, `latency stddev`, `initial connection time`, `tps = ... (without initial connection time)`.
- CAUTION: `pgbench -i` creates `pgbench_accounts`, `pgbench_branches`, `pgbench_history`, `pgbench_tellers`, "destroying any existing tables of these names".
- Rows at scale factor 1: `pgbench_branches` 1, `pgbench_tellers` 10, `pgbench_accounts` 100000, `pgbench_history` 0.
- Initialization options: `-i/--initialize`; `-I init_steps/--init-steps` (default `dtgvp`): `d` drop, `t` create tables, `g` client-side data generation (COPY; uses `FREEZE` for non-partitioned tables on server ≥ 14; one message per 100,000 rows) or `G` server-side generation (no progress messages), `v` vacuum, `p` primary keys, `f` foreign keys (not default); `-F fillfactor` (accounts, tellers, branches; default 100); `-n/--no-vacuum`; `-q/--quiet` (one progress message per 5 s); `-s scale_factor` (default 1; `-s 100` → 10,000,000 accounts; at scale ≥ 20,000 the `aid` columns become `bigint`); `--foreign-keys`; `--index-tablespace=`; `--partition-method=range|hash` (default range; needs `--partitions` nonzero); `--partitions=NUM` (default 0); `--tablespace=`; `--unlogged-tables`.
- Benchmark options:
  - `-b scriptname[@weight]/--builtin`: `tpcb-like`, `simple-update`, `select-only` (unambiguous prefixes OK; `list` shows them). `-N/--skip-some-updates` = `-b simple-update`; `-S/--select-only` = `-b select-only`.
  - `-c clients` (default 1), `-j threads` (default 1; clients spread evenly), `-t transactions` per client (default 10), `-T seconds` (mutually exclusive with -t), `-C/--connect` (new connection per transaction, measures connection overhead), `-D varname=value`, `-f filename[@weight]` (default weight 1; weight 0 ignored).
  - `-M querymode/--protocol`: `simple` (default), `extended`, `prepared` (extended + prepared statements; reuses parse analysis from the second iteration → faster).
  - `-l/--log` per-transaction log; `--log-prefix` (default `pgbench_log`); `--aggregate-interval=seconds` (only with -l); `--sampling-rate=rate` (fraction logged; 1.0 = all).
  - `-L limit/--latency-limit` (ms): slower transactions counted as *late*; with `--rate`, transactions already behind schedule by more than limit are not sent at all and counted as *skipped*; with `--max-tries`, a failed transaction is not retried if total time of all tries > limit.
  - `-R rate/--rate` (tps target): starts are scheduled along a Poisson-distributed timeline anchored at client start (not previous-transaction end); reported latency is measured from *scheduled* start so it includes *schedule lag*; average and max lag reported separately. Growing lag = system cannot sustain the rate.
  - `-P sec/--progress`, `--progress-timestamp` (Unix epoch, ms precision), `-r/--report-per-command` (per-statement average latency, failures, retries), `-s scale_factor` (only for reporting with custom scripts; otherwise detected by counting rows of `pgbench_branches`), `-n/--no-vacuum` (required for custom scenarios without the standard tables), `-v/--vacuum-all` (vacuum all four; default with neither -n nor -v: vacuum `pgbench_tellers` and `pgbench_branches`, truncate `pgbench_history`).
  - `--max-tries=number_of_tries` (default 1 = no retry; 0 = unlimited but then requires `--latency-limit` or `--time`), `--failures-detailed` (group failures as serialization / deadlock), `--verbose-errors`, `--exit-on-abort`, `--random-seed=time|rand|<unsigned int>` (default `time`; env `PGBENCH_RANDOM_SEED`), `--show-script=scriptname`, `--debug`.
- Exit status: 0 success; 1 static problems (bad options, internal errors, initial connection failures); 2 errors during the run (database errors, script problems) — partial results printed unless `--exit-on-abort`.
- Built-in `tpcb-like` full script:
  ```
  \set aid random(1, 100000 * :scale)
  \set bid random(1, 1 * :scale)
  \set tid random(1, 10 * :scale)
  \set delta random(-5000, 5000)
  BEGIN;
  UPDATE pgbench_accounts SET abalance = abalance + :delta WHERE aid = :aid;
  SELECT abalance FROM pgbench_accounts WHERE aid = :aid;
  UPDATE pgbench_tellers SET tbalance = tbalance + :delta WHERE tid = :tid;
  UPDATE pgbench_branches SET bbalance = bbalance + :delta WHERE bid = :bid;
  INSERT INTO pgbench_history (tid, bid, aid, delta, mtime) VALUES (:tid, :bid, :aid, :delta, CURRENT_TIMESTAMP);
  END;
  ```
  `simple-update` omits the tellers and branches UPDATEs (avoids update contention); `select-only` issues only the SELECT.
- Custom scripts: one script execution = one "transaction". SQL commands end with `;` (since 9.6; before, newline-terminated). Empty lines and `--` lines ignored. Scripts must not leave a transaction block incomplete (client aborted). Variables: letters (incl. non-Latin), digits, underscore, not starting with a digit; inserted as `:variablename`; per-client; max 255 variable uses in one statement.
- Automatic variables (Table 302): `client_id` (starts from zero), `default_seed` (seed for hash/permute functions), `random_seed` (unless overwritten with -D), `scale`.
- Meta commands (backslash; continue lines with backslash-return): `\gset [prefix]` (query must return exactly one row; columns → variables), `\aset [prefix]` (all combined `\;` queries; no row → no assignment; many rows → last value kept), neither usable in pipeline mode; `\if expr` / `\elif expr` / `\else` / `\endif` (nestable); `\set varname expression`; `\sleep number [us|ms|s]` (default seconds); `\setshell varname command [args]` (command must print an integer; `::` for a literal leading colon); `\shell command [args]`; `\startpipeline` / `\syncpipeline` / `\endpipeline` (pipeline mode requires extended query protocol).
- `\set` expression language: NULL, TRUE/FALSE, integer and double constants, `:var`, operators, functions, `CASE`. Functions and most operators return NULL on NULL input; nonzero = TRUE, zero/NULL = FALSE; integer overflow raises errors; CASE without ELSE → NULL.
- Operators (Table 303, increasing precedence): `OR`; `AND`; `NOT`; `IS [NOT] (NULL|TRUE|FALSE)`; `ISNULL|NOTNULL`; `=`; `<>`; `!=`; `<`; `<=`; `>`; `>=`; `|` (bitwise OR); `#` (XOR); `&`; `~`; `<<`; `>>`; `+`; `-`; `*`; `/` (truncates toward zero for integers); `%`; unary `-`. Two numeric inputs give double if either is double.
- Functions (Table 304): `abs`, `debug` (prints to stderr, returns arg), `double`, `exp`, `greatest`, `hash` (alias of `hash_murmur2`), `hash_fnv1a(value [, seed])`, `hash_murmur2(value [, seed])`, `int`, `least`, `ln`, `mod`, `permute(i, size [, seed])` (bijective pseudorandom permutation of [0,size); no collisions or holes; inputs taken modulo size), `pi`, `pow`/`power`, `random(lb, ub)` (uniform, inclusive), `random_exponential(lb, ub, parameter)` (parameter > 0; roughly the most frequent 1% of values near min are drawn parameter% of the time), `random_gaussian(lb, ub, parameter)` (parameter ≥ 2.0; ~67% of draws in the middle 1.0/parameter, 95% in middle 2.0/parameter), `random_zipfian(lb, ub, parameter)` (parameter in [1.001, 1000]; P(k)/P(k+1) = ((k+1)/k)**parameter; based on Devroye 1986 p. 550-551), `sqrt`.
  - Exponential: f(x) = exp(-parameter * (x - min) / (max - min + 1)) / (1 - exp(-parameter)); value i drawn with probability f(i) - f(i + 1).
  - Gaussian: f(x) = PHI(2.0 * parameter * (x - mu) / (max - min + 1)) / (2.0 * PHI(parameter) - 1), mu = (max + min) / 2.0; i drawn with probability f(i + 0.5) - f(i - 0.5).
  - Skewed-workload recipe: `\set size 1000000` / `\set r random_zipfian(1, :size, 1.07)` / `\set k 1 + permute(:r, :size)` (permute de-correlates hot keys from physical order).
- Per-transaction log (`-l`): file `prefix.nnn` (nnn = pgbench PID; extra threads `prefix.nnn.mmm`, mmm from 1). Fields: `client_id transaction_no time script_no time_epoch time_us [schedule_lag] [retries]` — `time` is elapsed µs, or the word `skipped`, `failed`, or (with --failures-detailed) `serialization` / `deadlock`.
- Aggregated log fields: `interval_start num_transactions sum_latency sum_latency_2 min_latency max_latency sum_lag sum_lag_2 min_lag max_lag skipped retried retries serialization_failures deadlock_failures`.
- Failure model: (1) main-program errors → immediate exit; (2) thread-level client-management errors → all clients of that thread stop; (3) direct client errors → that client aborted, others continue. Serialization and deadlock errors do NOT abort the client: the transaction is rolled back (client variables restored) and retried until success, `--max-tries`, `--latency-limit`, or `--time` is hit; then reported as failed. The *whole script* is retried, so scripts with multiple transactions may re-run already-committed ones; shell command effects are not rolled back. Latency is measured only for successful transactions and includes retries.
- Documented example under `PGOPTIONS='-c default_transaction_isolation=serializable'` with `--max-tries=10`: 6317/10000 processed, 3683 failed (36.830%), 7667 retried (76.670%), 45339 total retries; retries concentrated on the `pgbench_branches` UPDATE (41576) and tellers UPDATE (3762).
- Table access method for pgbench tables: `PGOPTIONS='-c default_table_access_method=wuzza'`.
- Good practices: run at least a few minutes (sometimes hours); scale factor `-s` ≥ max clients `-c` for the TPC-B-like test (only `-s` rows in `pgbench_branches` and every transaction updates one → otherwise you measure update contention); results depend on dead-row accumulation and autovacuum timing; pgbench itself can be the bottleneck with many clients (use `-j`, another machine, several instances); `-r` timing adds overhead.
- Security: don't run in a database where untrusted users exist and no secure schema usage pattern is adopted — pgbench uses unqualified names and doesn't set search_path.

### pg_combinebackup — rebuild a synthetic full backup from an incremental chain  [M7]  (source: app-pgcombinebackup.txt)
- `pg_combinebackup [option...] [backup_directory...]`. List ALL required backups oldest → newest: first = the full backup, last = the final incremental to restore. Output goes to `-o outputdir/--output` (required).
- It tries to verify the backups form a legal chain, but does not track dependencies for you (delete an ancestor and the incremental is unrestorable) and does NOT verify each backup is intact — use `pg_verifybackup` for that.
- The output is a synthetic full backup and can itself be used as the first input to a later pg_combinebackup in lieu of the chain.
- Options: `-d/--debug`, `-n/--dry-run`, `-N/--no-sync`, `--sync-method=fsync|syncfs`, `-T olddir=newdir/--tablespace-mapping` (olddir = absolute path as in the *final* backup on the command line), `--manifest-checksums=NONE|CRC32C|SHA224|SHA256|SHA384|SHA512` (default CRC32C; it writes a new manifest), `--no-manifest`.
- File-copy strategies: `--copy` (default regular copy); `-k/--link` (hard links; same filesystem required; modifying either input or output dirs — e.g. starting a server — affects the other; best when inputs are throwaway copies); `--clone` (reflinks; Linux kernel ≥ 4.5 on Btrfs and XFS-with-reflink, macOS APFS; errors if unsupported); `--copy-file-range` (the `copy_file_range` syscall; Linux and FreeBSD). In all three fast modes, if the manifest is missing or lacks the right checksum type, the file is still read block-by-block to compute the checksum.
- LIMITATION: does not recompute page checksums. If some input backups were taken with data checksums disabled but the final one with checksums enabled, the output may contain pages with invalid checksums. Fix: take a new full backup after changing checksum state with `pg_checksums`, or disable then re-enable checksums on the output directory.

### pg_config — installed-build information  [M6]  (source: app-pgconfig.txt)
- Prints build/install parameters; with no options prints everything with labels; multiple options print one per line in the order given.
- Options: `--bindir` (user executables), `--docdir`, `--htmldir`, `--includedir` (client-interface C headers), `--pkgincludedir` (other headers), `--includedir-server` (server-programming headers), `--libdir`, `--pkglibdir` (dynamically loadable modules — where the server searches for them), `--localedir` (empty string if built without locale support), `--mandir`, `--sharedir` (architecture-independent support files), `--sysconfdir`, `--pgxs` (extension makefiles), `--configure` (configure options used; `eval ./configure \`pg_config --configure\``), `--cc`, `--cppflags`, `--cflags`, `--cflags_sl`, `--ldflags`, `--ldflags_ex`, `--ldflags_sl`, `--libs`, `--version`.
- History: most options added in 8.1; `--htmldir` 8.4; `--ldflags_ex` 9.0.

### pg_dump — logical export of one database  [M7, M5, M6]  (source: app-pgdump.txt)
- Makes a *consistent* export even under concurrent use; "does not block other users accessing the database (readers or writers)". Docs caution: "except in simple cases, pg_dump is generally not the right choice for taking regular backups of production databases" (see Chapter 25).
- Dumps a single database only; roles, tablespaces and other globals need `pg_dumpall`.
- Formats (`-F`): `p|plain` (default; SQL script, restore with psql); `c|custom` (pg_restore; selection + reordering; compressed by default); `d|directory` (one file per table and large object + a machine-readable Table of Contents file; compressed with gzip by default; files can be manipulated with standard tools; the ONLY format supporting parallel dump); `t|tar` (extracting it yields a valid directory-format archive; no compression; relative order of table data items cannot be changed during restore).
- WARNING (security): "Restoring a dump causes the destination to execute arbitrary code of the source superusers' choice. Partial dumps and partial restores do not limit that." Inspect untrusted dumps (`pg_restore --file` for archives).
- Content-selection options:
  - `-a/--data-only` (table data, large objects, sequence values; similar-but-not-identical to `--section=data`), `-s/--schema-only` (similar-but-not-identical to `--section=pre-data --section=post-data`), `--no-data`, `--no-schema`, `--statistics` (dump optimizer statistics), `--no-statistics` (THE DEFAULT in pg_dump), `--statistics-only`, `--sequence-data`.
  - `-b/--large-objects` (`--blobs` deprecated): default ON except when `--schema`, `--table`, `--schema-only`, `--statistics-only`, or `--no-data` is given; `-B/--no-large-objects`.
  - `-n pattern/--schema`, `-N pattern/--exclude-schema`, `-t pattern/--table` (also views, matviews, foreign tables, sequences — definitions; -n/-N have no effect when -t is used), `-T pattern/--exclude-table`, `--table-and-children=`, `--exclude-table-and-children=`, `--exclude-table-data=`, `--exclude-table-data-and-children=`, `-e pattern/--extension`, `--exclude-extension=`, `--include-foreign-data=foreignserver` (empty pattern disallowed; not checked for writability). Patterns follow psql `\d` rules. With -n/-t/-e pg_dump does NOT dump dependencies — no guarantee the result restores into a clean database; with -n, non-schema objects such as large objects are not dumped.
  - `--filter=filename` (`-` = stdin): lines `{ include | exclude } { extension | foreign_data | table | table_and_children | table_data | table_data_and_children | schema } PATTERN`; `foreign_data` include-only; `table_data*` exclude-only; `#` comments.
  - `--strict-names`: each -e/-n/-t pattern must match at least one object (error even without it if *none* of the patterns match anything); does not apply to exclude patterns.
  - `--section=pre-data|data|post-data` (repeatable). data = table data, large-object contents, sequence values, and statistics for tables/matviews/foreign tables. post-data = indexes, triggers, rules, statistics for indexes, and constraints other than validated check and not-null constraints. pre-data = everything else.
- Script-shaping options: `-c/--clean` (emit DROPs first), `--if-exists` (only with --clean), `-C/--create` (CREATE DATABASE + reconnect; also database comment, `ALTER DATABASE ... SET`, `ALTER ROLE ... IN DATABASE ... SET`, and database ACL), `-O/--no-owner`, `-x/--no-privileges/--no-acl`, `--no-comments`, `--no-policies`, `--no-publications`, `--no-subscriptions`, `--no-security-labels`, `--no-table-access-method`, `--no-tablespaces`, `--no-toast-compression`, `--no-unlogged-table-data` (unlogged data is always excluded when dumping from a standby), `--use-set-session-authorization` (instead of `ALTER OWNER`; needs superuser to restore), `--disable-dollar-quoting`, `--quote-all-identifiers` (recommended cross-major-version; default quotes only reserved words of pg_dump's own version), `--disable-triggers` (data-only dumps; superuser; `-S username/--superuser`), `--enable-row-security` (default sets `row_security` off and errors if the user can't bypass RLS; with this option, dumps only visible rows — and you want INSERT format because COPY FROM does not support row security), `--binary-upgrade` (pg_upgrade only), `--restrict-key=restrict_key` (the psql `\restrict` key embedded in the dump; random by default; alphanumeric only; fixing it is for tests only — a malicious server knowing the key could inject code). `-c`, `-C`, `-O`, `--disable-triggers`, `--no-table-access-method`, `--no-tablespaces` are ignored for archive formats (give them to pg_restore instead).
  - Data representation: default COPY; `--inserts` (slow; fails if column order rearranged), `--column-inserts/--attribute-inserts` (explicit column names; safest/slowest), `--rows-per-insert=nrows` (>0), `--on-conflict-do-nothing` (only with one of the insert options), `--load-via-partition-root` (COPY/INSERT target the partition root so rows are re-routed — e.g. collation differences), `--extra-float-digits=ndigits` (not for backups), `-E encoding/--encoding` (default database encoding; or `PGCLIENTENCODING`).
- Output: `-f file/--file` (stdout if omitted; required for directory format where it names a directory that must not exist), `-Z level` or `-Z method[:detail]` (`gzip`, `lz4`, `zstd`, `none`; keywords `level`, `long`; custom/directory default = gzip at a moderate level per table-data segment; plain default = no compression; tar = no compression support), `--no-sync`, `--sync-method=fsync|syncfs` (directory format only), `-v/--verbose` (repeat for debug).
- Parallel dump `-j njobs/--jobs` (directory format only): opens njobs + 1 connections (check `max_connections`). Needs synchronized snapshots (primary ≥ 9.2, standby ≥ 10) so every worker sees the same data. Locking protocol and its failure mode:
  1. Leader takes `ACCESS SHARE` locks on every object the workers will dump.
  2. If another client then requests an exclusive lock on a table, it queues behind the leader's lock; any later lock request — including a worker's own `ACCESS SHARE` — would queue behind that exclusive request: a deadlock the server cannot see.
  3. So each worker requests its shared lock with `NOWAIT`; if not granted, someone asked for an exclusive lock meanwhile and pg_dump aborts the dump.
- Snapshot/isolation options: `--snapshot=snapshotname` (use an exported synchronized snapshot — e.g. to sync with a logical replication slot; used for parallel dump instead of taking a new one), `--serializable-deferrable` (SERIALIZABLE DEFERRABLE transaction: waits for a point with no possible anomalies so the dump neither fails nor causes serialization failures; start may be delayed indefinitely if read-write transactions are active; not beneficial for pure disaster-recovery dumps), `--lock-wait-timeout=timeout` (fail rather than wait forever for the shared table locks at start).
- Connection: `-d dbname/--dbname`, `-h`, `-p`, `-U`, `-w`, `-W`, `--role=rolename` (issues `SET ROLE` after connecting). Env: `PGDATABASE`, `PGHOST`, `PGOPTIONS`, `PGPORT`, `PGUSER`.
- Notes: pg_dump internally runs SELECTs; its activity is counted by the cumulative statistics system (disable with `track_counts=false` via PGOPTIONS or ALTER USER). Restore into a truly empty database (`CREATE DATABASE foo WITH TEMPLATE template0;`) or duplicates from template1 additions will error. `--statistics` does not include extended statistics (`CREATE STATISTICS`), extension custom stats, or cumulative stats → still run ANALYZE.
- Version rules: output expected to load into NEWER server versions; can dump from older servers (back to 9.2); "cannot dump from PostgreSQL servers newer than its own major version; it will refuse to even try"; loading into an older major version is not guaranteed.
- Subscriptions are dumped as `CREATE SUBSCRIPTION ... connect = false` (no remote connection, slot creation, or initial copy at restore); user must re-enable. If copying initial data during refresh, create the slot with `two_phase = false`; two_phase is auto-enabled after initial sync if originally `two_phase = true`.
- Restore plain scripts with `psql -X` (`--no-psqlrc`).
- Examples: `pg_dump mydb > db.sql`; `psql -X -d newdb -f db.sql`; `pg_dump -Fc mydb > db.dump`; `pg_dump -Fd mydb -j 5 -f dumpdir`; `pg_restore -d newdb db.dump`; `pg_restore -d postgres --clean --create db.dump`; `pg_dump -t 'detroit.emp*' -T detroit.employee_log mydb`; `pg_dump -n '(east|west)*gsm' -N '*test*' mydb`; `pg_dump -t "\"MixedCaseName\"" mydb` (names are folded to lower case unless double-quoted).

### pg_dumpall — whole-cluster SQL script, including globals  [M7, M1]  (source: app-pg-dumpall.txt)
- Calls `pg_dump` for each database and additionally dumps globals: "database roles, tablespaces, and privilege grants for configuration parameters". Output is a plain SQL script only (stdout or `-f`); restore with psql. Needs superuser to produce a complete dump and to restore (roles, databases). Connects once per database (password asked each time → use `~/.pgpass`).
- Selectors: `-g/--globals-only` (roles and tablespaces, no databases), `-r/--roles-only`, `-t/--tablespaces-only`, `-a/--data-only`, `-s/--schema-only`, `--no-data`, `--no-schema`, `--statistics`, `--no-statistics` (default), `--statistics-only`, `--sequence-data`, `--exclude-database=pattern`, `--filter=filename` (lines `exclude database PATTERN`).
- `--no-role-passwords`: roles restored with null password; role info read from `pg_roles` instead of `pg_authid` (helps when `pg_authid` access is restricted).
- Same script options as pg_dump: `-c/--clean` (DROP databases, roles, tablespaces), `--if-exists`, `-E`, `-O`, `-S`, `-x`, `--binary-upgrade`, `--column-inserts`, `--disable-dollar-quoting`, `--disable-triggers`, `--extra-float-digits`, `--inserts`, `--load-via-partition-root`, `--lock-wait-timeout`, `--no-comments`, `--no-policies`, `--no-publications`, `--no-security-labels`, `--no-subscriptions`, `--no-sync`, `--no-table-access-method`, `--no-tablespaces` (also no CREATE TABLESPACE), `--no-toast-compression`, `--no-unlogged-table-data`, `--on-conflict-do-nothing`, `--quote-all-identifiers`, `--restrict-key`, `--rows-per-insert`, `--use-set-session-authorization`, `-v`.
- Connection: `-d connstr/--dbname` (database name in it is ignored), `-l dbname/--database` (db for globals + discovery; default `postgres`, else `template1`), `-h`, `-p`, `-U`, `-w`, `-W`, `--role`.
- Notes: `--clean` is useful even for a fresh cluster — it authorizes dropping/recreating the built-in `postgres` and `template1` so they keep the source's locale/encoding. The script is expected to produce a harmless "role already exists" error for the bootstrap superuser. All tablespace directories must exist before restore. The script may contain psql meta-commands → may be incompatible with clients other than psql. With `--clean` you must connect to `postgres` initially.
- Examples: `pg_dumpall > db.out`; `psql -X -f db.out -d postgres`; post-restore `vacuumdb -a -z`.

### pg_restore — restore from custom/directory/tar archives  [M7]  (source: app-pgrestore.txt)
- Two modes: with `-d dbname` restore directly into the database; without, emit a SQL script (equivalent to pg_dump plain format) to `-f filename` / stdout (`-f -`). Input `filename` (file or directory; stdin if omitted). Format auto-detected (`-F c|d|t` optional). Cannot restore what isn't in the archive (e.g. INSERT-format data can't become COPY). Does NOT read `PGDATABASE`.
- Selection: `-a/--data-only`, `-s/--schema-only` (≈ `--section=pre-data --section=post-data --no-statistics`), `--no-data`, `--no-schema`, `--statistics` (DEFAULT in pg_restore: restore stats if present), `--no-statistics`, `--statistics-only`, `--section=pre-data|data|post-data`, `-n schema/--schema`, `-N schema/--exclude-schema` (-N wins over -n for the same name), `-t table/--table` (includes views, matviews, sequences, foreign tables since 9.6; NO wildcards, NO schema qualification, and unlike pg_dump's -t it does NOT include subsidiary objects such as indexes), `-I index/--index`, `-P 'function-name(argtype [, ...])'/--function` (spell exactly as in the TOC), `-T trigger/--trigger`, `--strict-names`, `--filter=filename` (lines `{ include | exclude } { function | index | schema | table | trigger } PATTERN`; function/index/table/trigger are include-only).
- TOC editing: `-l/--list` prints the table of contents; `-L list-file/--use-list` restores only listed items *in the listed order*; lines can be moved, removed, or commented with `;`. TOC header shows e.g. `; Archive created at ...`, `; dbname:`, `; TOC Entries: 81`, `; Compression: 9`, `; Dump Version: 1.10-0`, `; Format: CUSTOM`, `; Integer: 4 bytes`, `; Offset: 8 bytes`, dumped-from / dumped-by versions. Entry lines look like `3; 2615 2200 SCHEMA - public pasha` (archive ID; catalog OID; object OID; type; schema; name; owner).
- Actions: `-c/--clean`, `--if-exists`, `-C/--create` (the `-d` database is used only to issue DROP/CREATE DATABASE; data always goes into the database name recorded in the archive), `-O/--no-owner`, `-x/--no-acl`, `--no-comments`, `--no-policies`, `--no-publications`, `--no-subscriptions`, `--no-security-labels`, `--no-table-access-method`, `--no-tablespaces`, `--use-set-session-authorization`, `--disable-triggers` (+ `-S`), `--enable-row-security` (requires INSERT-format dump), `--no-data-for-failed-tables` (skip data when the CREATE TABLE failed, e.g. PostGIS auxiliary tables already present; only for direct-to-database), `--restrict-key` (only for script output).
- Error/transaction control: default continues past errors and prints a count at the end; `-e/--exit-on-error`; `-1/--single-transaction` (wrap everything in BEGIN/COMMIT; implies --exit-on-error); `--transaction-size=N` (series of transactions of up to N objects each; implies --exit-on-error; intermediate between default one-transaction-per-command and -1; a single huge transaction takes a lock on each restored object and can exhaust the lock table — "a few thousand objects" gives nearly the same speed with capped lock usage).
- Parallel restore `-j number-of-jobs`: parallelizes data load, index creation, constraint creation; each job = one process or thread with its own connection; custom and directory formats only; input must be a regular file/directory (not a pipe/stdin); cannot combine with `--single-transaction`; ignored when emitting a script. Starting point: number of server CPU cores.
- Limitations: `--disable-triggers` interrupted mid-way can leave catalogs in the wrong state; large objects cannot be restored selectively (all or none).
- Canonical recipes: `dropdb mydb; pg_restore -C -d postgres db.dump` and `createdb -T template0 newdb; pg_restore -d newdb db.dump` (clone from `template0`, not `template1`, so it's truly empty); `pg_restore -l db.dump > db.list`, edit, `pg_restore -L db.list db.dump`.

### pg_isready — connection health check  [M1, M7]  (source: app-pg-isready.txt)
- `pg_isready [connection-option...] [option...]`. Options: `-d dbname` (or conninfo), `-h`, `-p` (default `PGPORT` or compiled-in, usually 5432), `-U`, `-q/--quiet`, `-t seconds/--timeout` (default 3; 0 disables).
- Exit status: **0** accepting connections normally; **1** rejecting connections (e.g. during startup); **2** no response; **3** no attempt made (e.g. invalid parameters).
- Output form: `/tmp:5432 - accepting connections`, `localhost:5433 - rejecting connections`, `someremotehost:5432 - no response`.
- Correct user/password/dbname are NOT needed to get the status, but wrong values make the server log a failed connection attempt.

### pg_receivewal — stream physical WAL to a directory  [M7]  (source: app-pgreceivewal.txt)
- Streams WAL from a running cluster via the streaming replication protocol into local segment files; that directory can serve as the archive for PITR. Streams "in real time as it's being generated", not per completed segment like `archive_command`/`archive_library` → no need for `archive_timeout`.
- Needs REPLICATION role or superuser, pg_hba replication entry, and a free `max_wal_senders` slot.
- Flush behaviour: unlike a standby's WAL receiver, by default flushes WAL only when a WAL file is closed. `--synchronous` flushes immediately on receipt and sends a status packet right after each flush (regardless of `--status-interval`).
- Sync-rep pitfall: pg_receivewal does not *apply* WAL, so never let it be a synchronous standby when `synchronous_commit = remote_apply` — it would look like a standby that never catches up and commits would block. Fixes: set `synchronous_standby_names` appropriately, give pg_receivewal a non-matching `application_name`, or use a `synchronous_commit` other than `remote_apply`. If it IS a synchronous standby with a slot, without `--synchronous` flush position is only reported at file close → primary commits wait a long time.
- Start-point algorithm: (1) scan the target directory for the newest completed segment and start at the beginning of the next segment; (2) else, if a slot is used, issue `READ_REPLICATION_SLOT` and use the slot's `restart_lsn` (server ≥ 15); (3) else use the latest WAL flush location from `IDENTIFY_SYSTEM`.
- On lost/failed connection with a non-fatal error it retries indefinitely (`-n/--no-loop` to exit instead). Runs until SIGINT/SIGTERM; exit status 0 in that case (normal termination), nonzero for fatal errors/other signals.
- Options: `-D directory/--directory` (required), `-E lsn/--endpos` (stop with status 0 when reached; a record exactly at lsn is processed), `-S slotname/--slot` (use existing slot; reports flush position so the server can remove segments), `--create-slot` / `--drop-slot` (physical slot named by `--slot`, then exit), `--if-not-exists`, `--no-sync` (incompatible with `--synchronous`), `-s interval/--status-interval` (default 10 s; 0 disables periodic), `-v`, `-Z level | method[:detail]` (`gzip`, `lz4` (if built `--with-lz4`), `none`; only keyword `level`; suffixes `.gz`, `.lz4`), `-d connstr` (dbname ignored except for `.pgpass` lookup, default name `replication`), `-h`, `-p`, `-U`, `-w`, `-W`.
- Notes: when used instead of archive_command as the main WAL backup method, "it is strongly recommended to use replication slots" — otherwise the server may recycle WAL before it's received; but a slot fills the server's disk if the receiver falls behind. Group permissions preserved.

### pg_recvlogical — logical decoding stream client  [M7, M6]  (source: app-pgrecvlogical.txt)
- Controls logical decoding replication slots and streams decoded changes. Replication-mode connection → same constraints as pg_receivewal plus logical replication's.
- No equivalent of the SQL interface's peek/get modes: it "sends replay confirmations for data lazily as it receives it and on clean exit". To look without consuming use `pg_logical_slot_peek_changes`.
- SIGHUP → closes the current output file and reopens `--file` name (log rotation: rename, then SIGHUP). SIGINT/SIGTERM → exit 0.
- Actions (at least one): `--create-slot` (needs `--slot` and `--dbname`; uses `--plugin`; may add `--enable-two-phase`, `--enable-failover`), `--drop-slot` (needs `--slot`; cannot combine), `--start` (needs `--slot`, `--dbname`, `--file`; must connect to the same database where the slot was created; retries in a loop on disconnect unless `--no-loop`). `--create-slot` + `--start` may be combined.
- Options: `-E lsn/--endpos` (not transaction-boundary aware — may cut mid-transaction; a partially output transaction is not consumed and will be replayed next time; individual messages never truncated), `--enable-failover` (slot can be synchronized to standbys), `-f filename` (`-` stdout), `-F interval_seconds/--fsync-interval` (0 disables fsync but still reports progress → possible loss on crash), `-I lsn/--startpos`, `--if-not-exists`, `-n/--no-loop`, `-o name[=value]/--option` (passed to the output plugin), `-P plugin/--plugin` (no effect if slot exists), `-s/--status-interval`, `-S slot_name/--slot`, `-t/--enable-two-phase` (`--two-phase` deprecated; decode prepared transactions), `-v`, `-d dbname`, `-h`, `-p`, `-U` (default OS user), `-w`, `-W`.

### pg_verifybackup — check a base backup against its backup_manifest  [M7]  (source: app-pgverifybackup.txt)
- Verifies a pg_basebackup backup (plain or tar, including compressed tar) against the server-generated `backup_manifest`. WAL verification is supported only for plain format → use `-n/--no-parse-wal` for tar backups.
- It "does not and cannot include every check which will be performed by a running server" — still do test restores.
- Four stages:
  1. Read `backup_manifest`. Fatal if missing, unreadable, malformed, system identifier doesn't match the backup's `pg_control`, or it fails its own internal checksum.
  2. Compare files on disk to the manifest: detects extra and missing files (and size differences). Ignores presence/absence/modification of `postgresql.auto.conf`, `standby.signal`, `recovery.signal`; doesn't complain about `backup_manifest` itself or anything inside `pg_wal`. Only files are checked, not directories.
  3. Checksum every file and compare to manifest values (skipped for files that already failed stage 2 and for ignored files).
  4. Use the manifest's record of needed WAL ranges to invoke `pg_waldump --quiet` to confirm the WAL needed for recovery is present and parseable. Can't detect e.g. records with valid checksums but nonsensical actions. Extra WAL not needed for the backup is not checked.
- WAL verification is version-specific (use the matching pg_verifybackup/pg_waldump); data-file checks work with any server version that produces a manifest.
- Options: `-e/--exit-on-error` (default: keep going and report all problems), `-F p|plain | t|tar` (tar: `base.tar`, `pg_wal.tar`, and per-tablespace tar named by OID, plus compression suffix), `-i path/--ignore` (relative path; whole subtree for a directory; repeatable), `-m path/--manifest-path`, `-n/--no-parse-wal`, `-P/--progress` (not with --quiet), `-q/--quiet`, `-s/--skip-checksums` (still checks presence and sizes; much faster), `-w path/--wal-directory`.
- Examples: `pg_verifybackup /usr/local/pgsql/data`; move the manifest to a secure location and `pg_verifybackup -m /my/secure/location/backup_manifest.1234 /usr/local/pgsql/backup1234`; `pg_verifybackup --ignore=note.to.self --skip-checksums ...`.

### psql — command-line options and exit status  [M1, M6]  (source: app-psql.txt)
- `psql [option...] [dbname [username]]`. Prompt `testdb=>` (banner `psql (18.7)` / `Type "help" for help.`).
- Options:
  - Input: `-c command/--command` (repeatable, mixable with -f; each -c is either a fully server-parsable SQL string OR a single backslash command — cannot mix; psql then exits without reading stdin), `-f filename/--file` (like `\i`; `-` = stdin until EOF or `\q`; gives error messages with line numbers), `-1/--single-transaction` (only with -c/-f: BEGIN before the first, COMMIT after the last; ROLLBACK instead if a command fails and `ON_ERROR_STOP` is set; breaks if scripts contain their own BEGIN/COMMIT/ROLLBACK or commands that can't run in a transaction block), `-s/--single-step` (confirm each command), `-S/--single-line` (newline terminates a command), `-n/--no-readline`, `-X/--no-psqlrc`.
  - Echo: `-a/--echo-all` (ECHO=all), `-b/--echo-errors` (ECHO=errors), `-e/--echo-queries` (ECHO=queries), `-E/--echo-hidden` (ECHO_HIDDEN=on: show the catalog queries behind `\d` etc.), `-q/--quiet` (QUIET=on), `-L filename/--log-file`, `-o filename/--output`.
  - Formatting: `-A/--no-align`, `--csv`, `-H/--html`, `-t/--tuples-only`, `-x/--expanded`, `-F separator/--field-separator`, `-R separator/--record-separator`, `-z/--field-separator-zero`, `-0/--record-separator-zero` (for `xargs -0`), `-P assignment/--pset` (e.g. `-P format=latex`), `-T table_options/--table-attr`.
  - Connection: `-d dbname` (or conninfo/URI), `-h`, `-p` (default PGPORT or compiled-in, usually 5432), `-U`, `-w`, `-W` (both remain set for the whole session incl. `\connect`), `-l/--list` (list databases and exit; connects to `postgres` unless a db is named on the command line).
  - Variables: `-v assignment/--set/--variable` (`name=value`; no `=` unsets; `name=` sets empty).
  - `-V`, `-?/--help[=topic]` with topic `options` (default), `commands`, `variables`.
- **Single-request semantics of -c**: "Each SQL command string passed to -c is sent to the server as a single request. Because of this, the server executes it as a single transaction even if the string contains multiple SQL commands, unless there are explicit BEGIN/COMMIT commands". Same for `\;`-joined commands: `select 1\; select 2\; select 3;` is one request = one implicit transaction, whereas `select 1; select 2; select 3;` sends three separately.
- Exit status: **0** normal; **1** fatal error of its own (out of memory, file not found); **2** connection went bad and session not interactive; **3** error in a script with `ON_ERROR_STOP` set.
- Connecting: defaults — Unix-domain socket on local host (TCP to localhost on Windows), compiled-in port, OS user name as db user, db user name as database name. Conninfo forms: `psql "service=myservice sslmode=require"`, `psql postgresql://dbmaster:5433/mydb?sslmode=require`. If stdin and stdout are both terminals, client encoding is set to "auto" (from `LC_CTYPE`); override with `PGCLIENTENCODING`.
- Security: with untrusted users and no secure schema usage pattern, start sessions with `options=-csearch_path=` in the connection string or `SELECT pg_catalog.set_config('search_path', '', false)`.
- psql polls for `LISTEN`/`NOTIFY` notifications whenever a command is executed. C-style block comments are sent to the server; SQL-standard `--` comments are removed by psql.
- By default psql uses the **simple query protocol**; `\bind`, `\bind_named`, `\parse`, `\close_prepared`, and pipeline mode switch to the **extended query protocol** (for the next query only).

### psql — meta-command syntax rules  [M6]  (source: app-psql.txt)
- A meta-command = unquoted backslash + verb + whitespace-separated args, processed by psql itself; args cannot continue past end of line.
- Single-quoted args allow whitespace; `''` for a quote; C-like escapes `\n \t \b \r \f \digits` (octal) `\xdigits` (hex).
- `:name` in an arg is replaced by the variable; `:'name'` (SQL literal quoting) and `:"name"` (identifier quoting) also work; `:{?name}` → TRUE/FALSE if defined; `\:` escapes.
- Backquoted text is run in the shell and replaced by its output (trailing newline removed); inside it `:name` and `:'name'` (shell-quoted; refuses values containing CR/LF) are substituted.
- SQL-identifier args follow SQL rules: unquoted folded to lower case; `FOO"BAR"BAZ` → `fooBARbaz`; `"A weird"" name"` → `A weird" name`.
- `\\` ends a meta-command's args and resumes SQL parsing on the same line.
- The *query buffer* holds SQL typed but not yet sent; many commands act on it. Many commands accept an `x` suffix (expanded output for that command) plus `S` (include system objects) and `+` (more detail).
- Commands whose entire rest-of-line is the argument, with NO variable interpolation or backquote expansion: `\copy`, `\ef`, `\ev`, `\help`, `\sf`, `\sv`, `\!`, `\unrestrict`, and the `|command` forms of `\g`, `\o`, `\w`.

### psql — Patterns (used by \d commands, pg_dump -t/-n, pg_amcheck, etc.)  [M6]  (source: app-psql.txt)
- Pattern normally folded to lower case; double quotes preserve case and may wrap just part of a pattern (`\dt FOO"FOO"BAR` → `fooFOObar`); `""` inside quotes = literal quote.
- Omitted pattern = all objects *visible* in the search path (≡ `*`). Visible = schema is in search_path and no same-kind same-name object earlier in the path. `*.*` = everything regardless of visibility.
- `*` = any sequence (regex `.*`), `?` = any single char (regex `.`); literal inside double quotes.
- One dot → `schema-pattern.object-pattern`; two dots → `database.schema.object` where the database part is NOT a pattern and must equal the current database (else error). Schema patterns (`\dn`) may be `database.schema`.
- Regex features (character classes like `[0-9]`, alternation) work, except `.` is the separator, `*`→`.*`, `?`→`.`, `$` matched literally. Emulate: `?` for `.`, `(R+|)` for `R*`, `(R|)` for `R?`. Patterns are anchored (implicit `$`); write `*` at the ends to un-anchor. Regex specials are literal within double quotes and in operator-name patterns (`\do`).

### psql — Variables and SQL interpolation  [M6]  (source: app-psql.txt)
- Variables are name/value string pairs; names = letters (incl. non-Latin), digits, underscores; case-sensitive. `\set name value...` (multiple values concatenated; no value → empty string), `\unset name`, `\set` alone lists all. Unrelated to SQL `SET`.
- Special (all-uppercase) control variables generally can't be unset or set invalid: `\unset` resets to default; `\set X` with no value means `on` for boolean ones. Booleans accept `on/off/true/false` etc.
- Interpolation: `:foo` raw (unsafe — copied literally), `:'foo'` as quoted SQL literal, `:"foo"` as quoted identifier. No interpolation inside quoted SQL literals/identifiers (so `':foo'` does not work). `:name` is only replaced if the variable is currently set (colons are legal SQL: array slices, `::` casts). `:{?name}` always substituted. No NUL bytes in values.
- Load a file into a column: `\set content \`cat my_file.txt\`` then `INSERT INTO my_table VALUES (:'content');`.
- Query results into variables: `SELECT 'hello' AS var1, 10 AS var2 \gset` → `:var1`, `:var2` (optional prefix; exactly one row required; NULL column → variable unset; failure → nothing changed).

### psql — Prompting  [M5, M6]  (source: app-psql.txt)
- `PROMPT1` (new command), `PROMPT2` (continuation), `PROMPT3` (data rows for `COPY FROM STDIN`). Defaults: `'%/%R%x%# '` for prompts 1 and 2, `'>> '` for prompt 3.
- Escapes: `%M` full host (or `[local]`, `[local:/dir/name]`), `%m` host up to first dot, `%>` port, `%n` session user, `%s` service name, `%/` current database, `%~` like `%/` but `~` if default database, `%#` `#` if superuser else `>`, `%p` backend PID, `%P` pipeline status (`off`/`on`/`abort`), `%l` line number within the current statement, `%digits` octal char, `%:name:` psql variable, `` %`command` `` shell output, `%[ ... %]` wrap non-printing control chars, `%w` whitespace as wide as last PROMPT1, `%%` literal percent.
- `%R`: in prompt 1 `=` normally, `@` in an inactive `\if` branch, `^` in single-line mode, `!` if disconnected; in prompt 2: `-` unterminated command, `*` unfinished `/* */` comment, `'` unfinished string, `"` unfinished quoted identifier, `$` unfinished dollar-quote, `(` unmatched left paren; nothing in prompt 3.
- `%x` **transaction status**: empty = not in a transaction block; `*` = in a transaction block; `!` = in a FAILED transaction block; `?` = indeterminate (e.g. no connection). (Excellent visual cue for the M5 transaction-state lesson.)
- Example: `\set PROMPT1 '%[%033[1;33;40m%]%n@%/%R%[%033[0m%]%# '`.

### psql — environment, files, readline, version notes  [M6]  (source: app-psql.txt)
- Env: `COLUMNS`; `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`; `PG_COLOR`; `PSQL_EDITOR` → `EDITOR` → `VISUAL` (first set wins; default `vi`, `notepad.exe` on Windows); `PSQL_EDITOR_LINENUMBER_ARG` (default `+` on Unix); `PSQL_HISTORY`; `PSQL_PAGER` → `PAGER` (default `more`, `less` on Cygwin; empty string disables); `PSQL_WATCH_PAGER` (no pager for `\watch` by default; e.g. `pspg --stream`); `PSQLRC`; `SHELL` (for `\!`); `TMPDIR` (default `/tmp`); `PGSYSCONFDIR`.
- Startup files (unless `-X`): system-wide `psqlrc` (in `pg_config --sysconfdir`), then `~/.psqlrc` (`%APPDATA%\postgresql\psqlrc.conf` on Windows) — read after connecting, before accepting commands. Version-specific variants `~/.psqlrc-18` or `~/.psqlrc-18.7` (most specific match wins).
- History: `~/.psql_history` (`%APPDATA%\postgresql\psql_history`), overridable via `HISTFILE` variable or `PSQL_HISTORY`; per-database history: `\set HISTFILE ~/.psql_history-:DBNAME`.
- Readline/libedit: tab completion sends queries to the server — "after BEGIN it will be too late to issue SET TRANSACTION ISOLATION LEVEL if a tab-completion query is issued in between". Disable via `~/.inputrc` (`$if psql` / `set disable-completion on` / `$endif`) or `-n`.
- Compatibility: works best with same-or-older server major version; `\d`-family supported back to server 9.2; not guaranteed against newer servers. Before 9.6 `-c` implied `-X`.
- Windows: console code page (`cmd.exe /c chcp 1252`), Lucida Console font.

### psql — behaviourally important meta-commands (details; the full list is in "Complete inventories")  [M6, M5, M4]  (source: app-psql.txt)
- **`\c` / `\connect [-reuse-previous=on|off] [dbname [username] [host] [port] | conninfo]`**: `-` for a positional param = omitted. Positional syntax reuses previous params by default; conninfo does not. Password reused only if user, host, port unchanged; changing host positionally drops `hostaddr`. On failure: interactive → old connection kept; non-interactive script → old connection closed and error reported (safety against acting on the wrong database), and no parameters may be reused afterwards.
- **`\conninfo`**: "Client User" = user at connection time; "Superuser" = whether the *current* user (e.g. after `SET ROLE`) is superuser; SSL info shown.
- **`\copy`**: frontend COPY — psql reads/writes the file with the *local user's* privileges; no SQL superuser needed. Forms `from {'filename' | program 'command' | stdin | pstdin}` / `to {... | stdout | pstdout}`; `from stdin` reads until a line with only `\.` or EOF; `pstdin`/`pstdout` always mean psql's own stdin/stdout. Less efficient than server-side COPY since all data crosses the connection. Alternative: `COPY ... TO STDOUT \g filename` (allows multi-line and interpolation).
- **`\crosstabview [colV [colH [colD [sortcolH]]]]`**: executes the buffer and pivots; needs ≥ 3 columns; colV default column 1, colH column 2; sortcolH must be integers; more than one row per (x,y) cell → error.
- **`\d[Sx+] [pattern]`**: for each matching relation or composite type show columns, types, tablespace (if non-default), NOT NULL/defaults, plus indexes, constraints, rules, triggers; `+` adds comments, view definition, non-default replica identity, access method. Without a pattern ≡ `\dtvmsE`. `x` can't follow `\d` directly (`\dx` is another command) — `\d+x`.
- **`\dconfig[x+] [pattern]`**: without a pattern lists only parameters set to NON-DEFAULT values; `\dconfig *` shows all; `+` adds type, context, access privileges.
- **`\df[anptwSx+] [pattern [arg_pattern ...]]`**: type letters a/n/p/t/w = aggregate/normal/procedure/trigger/window; trailing `-` arg pattern forbids extra args; `+` shows volatility, parallel safety, owner, security, leakproof, ACL, language, internal name, description. Example `\df int*pl * bigint`.
- **`\dX`**: extended statistics; each kind column shows `defined` or NULL — use `pg_stats_ext` to see if ANALYZE has built them.
- **`\dP[itnx+]`**: partitioned relations; `n` = nested (shows parent); `+` shows total partition sizes.
- **`\drg`**: role membership grants with ADMIN / INHERIT / SET options and grantor. **`\drds`**: per-role/per-database settings (`ALTER ROLE/DATABASE ... SET`). **`\ddp`**: default privileges.
- **`\e` / `\edit [filename] [line_number]`**: edits file, or the buffer, or (if buffer empty) the last query; buffer re-parsed as a single line; complete queries run immediately. `\ef [function [line]]`, `\ev [view [line]]` produce `CREATE OR REPLACE` templates.
- **`\errverbose`**: repeat the last server error at maximum verbosity (as if VERBOSITY=verbose, SHOW_CONTEXT=always).
- **`\g [(option=value ...)] [filename | |command]`**: send buffer (or re-run last query if empty); one-shot `\pset` options in parentheses; output written only if the query returns tuples successfully. `\gx` = `\g` with expanded=on.
- **`\gdesc`**: show column names and types of the result WITHOUT executing the query (syntax errors still reported).
- **`\gexec`**: run the query, then execute each *cell* of the result as SQL (row order, then left-to-right; NULLs skipped; no meta-commands or variables in generated SQL; continues past failures unless ON_ERROR_STOP). Example: `SELECT format('create index on my_table(%I)', attname) FROM pg_attribute WHERE attrelid = 'my_table'::regclass AND attnum > 0 ORDER BY attnum \gexec`.
- **`\gset [prefix]`**: see Variables.
- **`\if expr` / `\elif` / `\else` / `\endif`**: nestable; expr after interpolation/backquote expansion must be an unambiguous case-insensitive prefix match of `true, false, 1, 0, on, off, yes, no` (else warning + treated false); skipped lines are parsed but not sent; whole block must be in one source file.
- **`\i` / `\include filename`**, **`\ir` / `\include_relative`** (relative to the script's directory when run from a script).
- **`\l[x+]`**: `+` adds sizes (need CONNECT privilege, superuser, or `pg_read_all_stats`), default tablespaces, descriptions.
- **`\lo_export loid filename`, `\lo_import filename [comment]`, `\lo_list[x+]` (`\dl`), `\lo_unlink loid`**: client-side large-object ops (local user and filesystem, unlike server-side `lo_import`/`lo_export`).
- **`\o` / `\out [filename | |command]`**: redirect query results (tables, command responses, notices, `\d` output — not error messages). `\qecho` writes to that channel; `\echo` to stdout (`-n` first arg suppresses newline); `\warn` to stderr.
- **`\password [username]`**: prompts, hashes client-side, sends `ALTER ROLE` — the cleartext never appears in history or server log.
- **`\prompt [text] name`**, **`\getenv psql_var env_var`**, **`\setenv name [value]`**.
- **Extended-protocol commands**: `\bind [parameter]...` (e.g. `INSERT INTO tbl1 VALUES ($1, $2) \bind 'first value' 'second value' \g`; extended protocol used even with zero params), `\parse statement_name` (issues a Parse (F) message; empty string = unnamed statement), `\bind_named statement_name [parameter]...`, `\close_prepared prepared_statement_name` (no-op if missing).
- **Pipeline commands**: `\startpipeline`, `\sendpipeline` (append current buffer), `\syncpipeline` (sync message without ending the pipeline), `\flushrequest` (append a flush so results can be read without sync), `\flush` (push unsent data), `\getresults [number_results]` (0/omitted = all pending), `\endpipeline`. All queries in a pipeline use the extended protocol; `\g`, `\gx`, `\gdesc` not allowed; COPY not supported. Variables `PIPELINE_COMMAND_COUNT`, `PIPELINE_SYNC_COUNT`, `PIPELINE_RESULT_COUNT`; prompt `%P`.
- **`\restrict restrict_key` / `\unrestrict restrict_key`**: restricted mode where the only allowed meta-command is `\unrestrict` with the matching alphanumeric key. Emitted in plain-text dumps by pg_dump/pg_dumpall/pg_restore so that restored data cannot smuggle in meta-commands (e.g. `\!`).
- **`\sf[+] function`**, **`\sv[+] view`**: show `CREATE OR REPLACE` source (`+` numbers lines; for functions line 1 = first line of the body).
- **`\timing [on|off]`**: milliseconds; > 1 s also shown as minutes:seconds (hours/days added if needed).
- **`\watch [i[nterval]=seconds] [c[ount]=times] [m[in_rows]=rows] [seconds]`**: re-run the buffer until interrupted, failure, count reached, or fewer than min_rows returned; default wait 2 s (`WATCH_INTERVAL`).
- **`\x [on|off|auto]`**; **`\!` [command]**; **`\?` [commands|options|variables]**; **`\h [command]`** (`*` = all; multi-word names needn't be quoted: `\help alter table`); **`\q`** (in a script only ends that script); **`\r`** reset buffer; **`\p`** print buffer; **`\w`** write buffer; **`\s [filename]`** history.
- **`\;`**: adds a semicolon to the buffer without dispatching → multi-statement single request (implicit single transaction). `SHOW_ALL_RESULTS` (default on) shows every result of such a combined query.

### reindexdb  [M4, M7]  (source: app-reindexdb.txt)
- Wrapper around `REINDEX`. `reindexdb [conn] [option...] [-S schema]... [-t table]... [-i index]... [-s|--system] [dbname | -a | --all]`.
- Options: `-a/--all`, `--concurrently` (REINDEX CONCURRENTLY — see its caveats), `[-d] dbname`, `-e/--echo`, `-i index/--index` (repeatable), `-j njobs/--jobs` (opens njobs connections; watch `max_connections`; incompatible with `--system`), `-q`, `-s/--system` (system catalogs only), `-S schema/--schema`, `-t table/--table`, `--tablespace=tablespace` (where indexes are rebuilt), `-v`, `--maintenance-db`.
- Examples: `reindexdb test`; `reindexdb --table=foo --index=bar abcd`.

### vacuumdb  [M7, M4]  (source: app-vacuumdb.txt)
- Wrapper around `VACUUM` (and ANALYZE). Three synopsis forms: by `-t table [(column [,...])]`, by `-n schema`, or by `-N exclude-schema`.
- Options mapping to VACUUM options: `-f/--full`, `-F/--freeze` (aggressive freeze), `-z/--analyze`, `-Z/--analyze-only`, `--disable-page-skipping` (ignore visibility map), `--force-index-cleanup` / `--no-index-cleanup`, `--no-process-main`, `--no-process-toast`, `--no-truncate`, `--skip-locked`, `-P parallel_workers/--parallel` (parallel index vacuum), `--buffer-usage-limit size` (Buffer Access Strategy ring size), `-v`.
- Selection: `-a/--all`, `[-d] dbname`, `-t table [(columns)]` (columns only with --analyze/--analyze-only; escape parens from the shell), `-n schema`, `-N schema`, `--min-xid-age xid_age` and `--min-mxid-age mxid_age` (only tables whose XID / multixact age ≥ value; age = greatest of main relation and its TOAST table — for prioritising wraparound prevention), `--missing-stats-only` (v18: only relations missing stats for a column, index expression, or extended statistics object; only with --analyze-only or --analyze-in-stages; needs SELECT on `pg_statistic` and `pg_statistic_ext_data`, superuser-only by default).
- `--analyze-in-stages`: analyze-only in three stages — first with the lowest possible statistics target (`default_statistics_target`) to get usable stats fast, later stages build full stats. Only for databases with no/wholly wrong stats (after restore or pg_upgrade); on a database with existing stats it can make plans transiently WORSE (avoid via `--missing-stats-only`).
- `-j njobs/--jobs`: njobs connections; with `-f` (FULL) "might cause deadlock failures if certain system catalogs are processed in parallel".
- Examples: `vacuumdb test`; `vacuumdb --analyze bigdb`; `vacuumdb --analyze --verbose --table='foo(bar)' xyzzy`; `vacuumdb --schema='foo' --schema='bar' xyzzy`.

### Server applications — general  [M1]  (source: reference-server.txt)
- "These commands can only be run usefully on the host where the database server resides." List: initdb, pg_archivecleanup, pg_checksums, pg_controldata, pg_createsubscriber, pg_ctl, pg_resetwal, pg_rewind, pg_test_fsync, pg_test_timing, pg_upgrade, pg_waldump, pg_walsummary, postgres.

### initdb — create a database cluster  [M1, M2, M7]  (source: app-initdb.txt)
- `initdb [option...] [--pgdata | -D] directory`. Steps: create the directories for cluster data, generate the **shared catalog tables** ("tables that belong to the whole cluster rather than to any particular database"), and create the `postgres`, `template1`, and `template0` databases.
  - `postgres`: default database for users, utilities, third-party apps. `template1` and `template0`: sources for later `CREATE DATABASE`; `template0` should never be modified; objects added to `template1` are copied into later-created databases by default.
- Must run as the OS user that will own the server process; refuses to run as root (server can't run as root). If the parent dir is root-owned: create the empty dir as root, `chown` it, `su` to the db user.
- Default access: cluster readable only by the owner; `-g/--allow-group-access` lets the owner's group read all files (for unprivileged backup; ignored on Windows).
- Locale/encoding: default locale provider `libc` (from the environment; encoding derived from locale). `--locale=`, `--lc-collate=`, `--lc-ctype=`, `--lc-messages=`, `--lc-monetary=`, `--lc-numeric=`, `--lc-time=`, `--no-locale` (= `--locale=C`), `--locale-provider={builtin|libc|icu}`, `--icu-locale=`, `--icu-rules=`, `--builtin-locale=` (builtin provider requires `C`, `C.UTF-8`, or `PG_UNICODE_FAST`). With ICU, libc locale settings are still selected and initialized. `-E encoding/--encoding`: default derived from locale; with `--no-locale`/C/POSIX the default is `UTF8` for the ICU provider and `SQL_ASCII` for libc. initdb prints the chosen locale settings.
- Auth: `-A authmethod/--auth` (default method for `local` and `host` lines in the generated `pg_hba.conf`, for both regular and replication connections; **`trust` is the default "for ease of installation" — do not use unless you trust all local users**), `--auth-host=`, `--auth-local=`, `-U username/--username` (bootstrap superuser name; default = OS user running initdb), `-W/--pwprompt`, `--pwfile=filename` (first line = password).
- **Data checksums**: `-k/--data-checksums` — "This is enabled by default" in v18; `--no-data-checksums` disables. Checksums computed for all objects in all databases; failures reported in `pg_stat_database`; small performance penalty.
- WAL: `-X directory/--waldir`; `--wal-segsize=size` in MB — default 16, must be a power of 2 between 1 and 1024; settable ONLY at initdb, cannot be changed later (except via pg_resetwal, see there). Larger segments reduce the number of WAL files; size sets the granularity of WAL shipping/archiving.
- Other: `-T config/--text-search-config` (`default_text_search_config`), `-c name=value/--set` (set a server parameter during initdb AND write it into the generated `postgresql.conf`; repeatable), `-d/--debug` (bootstrap backend debug output; "the bootstrap backend is the program initdb uses to create the catalog tables"), `--discard-caches` (`debug_discard_caches=1`), `-L directory` (input files location), `-n/--no-clean`, `-N/--no-sync`, `--no-sync-data-files` (skip syncing everything under `base` and tablespace dirs; `pg_wal`, `pg_xact` etc. still synced), `--no-instructions`, `-s/--show`, `--sync-method=fsync|syncfs`, `-S/--sync-only` (just fsync all database files and exit — useful after changing `fsync` from off to on).
- Env: `PGDATA`, `PG_COLOR`, `TZ` (default time zone of the created cluster; full zone name). Also invocable as `pg_ctl initdb`.

### pg_archivecleanup — prune a WAL archive  [M7]  (source: pgarchivecleanup.txt)
- `pg_archivecleanup [option...] archivelocation oldestkeptwalfile`. Designed as a standby's `archive_cleanup_command = 'pg_archivecleanup archivelocation %r'`; also standalone.
- Removes all WAL files *logically preceding* `%r` / `oldestkeptwalfile` from `archivelocation`. As `archive_cleanup_command` this "minimizes the number of files that need to be retained, while preserving crash-restart capability" — appropriate ONLY if the archive is a transient staging area for this one standby, not a long-term archive nor one shared by multiple standbys.
- Standalone: a `.partial` or `.backup` file name may be given; only the file prefix is used, so `pg_archivecleanup -d archive 000000010000003700000010.00000020.backup` keeps `000000010000003700000010` and later and removes `...0F`, `...0E` — i.e. everything archived before a specific base backup.
- Options: `-b/--clean-backup-history` (also remove backup history files), `-d/--debug`, `-n/--dry-run` (print names that would be removed), `-x extension/--strip-extension` (e.g. `-x .gz` for compressed archives), `-V`, `-?`.
- Works standalone with PostgreSQL ≥ 8.0; as an archive cleanup command with ≥ 9.0. Example: `archive_cleanup_command = 'pg_archivecleanup -d /mnt/standby/archive %r 2>>cleanup.log'`.

### pg_checksums — offline enable / disable / verify data checksums  [M2, M7]  (source: app-pgchecksums.txt)
- `pg_checksums [option...] [[-D|--pgdata] datadir]`. "The server must be shut down cleanly before running pg_checksums."
- Modes: `-c/--check` (DEFAULT; scans every file in the cluster; exit 0 if no checksum errors, nonzero if at least one failure), `-e/--enable` (each relation file block with a changed checksum is rewritten in place — can take a long time on large clusters), `-d/--disable` (only updates `pg_control`).
- Options: `-f filenode/--filenode` (validate only that relation), `-N/--no-sync` (no effect with --check), `-P/--progress`, `--sync-method=fsync|syncfs`, `-v/--verbose` (list all checked files). Env `PGDATA`.
- Caveats: while enabling, nothing else may write to the data directory ("or else data loss may occur"). In replication setups with block-copying tools (e.g. pg_rewind), checksum state must be switched consistently on all nodes — stop all clusters and switch them all, or destroy standbys, switch the primary, recreate standbys. If aborted/killed mid-way the cluster's checksum configuration remains unchanged and the tool can simply be re-run.

### pg_controldata — dump pg_control  [M1, M7]  (source: app-pgcontroldata.txt)
- `pg_controldata [option] [[-D|--pgdata] datadir]`: "prints information initialized during initdb, such as the catalog version. It also shows information about write-ahead logging and checkpoint processing. This information is cluster-wide, and not specific to any one database."
- Only runnable by the user who initialized the cluster (needs read access to the data directory). Data dir from the command line or `PGDATA`. Options only `-V/--version`, `-?/--help`. (The page does not list the output fields; the SQL equivalents are `pg_control_system()`, `pg_control_checkpoint()`, `pg_control_recovery()`, `pg_control_init()` documented elsewhere.)

### pg_createsubscriber — turn a physical standby into a logical replica  [M7]  (source: app-pgcreatesubscriber.txt)
- `pg_createsubscriber [option...] {-d|--database} dbname {-D|--pgdata} datadir {-P|--publisher-server} connstr`. Run on the *target* (standby) server. All tables in each specified database are included; one publication + subscription pair per database.
- Key idea: it "does not copy the initial table data. It does only the synchronization phase" — the standby already has the data physically. Aimed at large databases, where logical-replication setup time is dominated by the initial copy (and by the backlog accumulated during it). For small databases use normal `CREATE SUBSCRIPTION` with `copy_data`.
- Options: `-a/--all` (one subscription per database except templates and non-connectable ones; auto-generated names; incompatible with --database/--publication/--replication-slot/--subscription), `-d dbname` (repeatable; else taken from -P), `-D directory`, `-n/--dry-run`, `-p port/--subscriber-port` (target runs on port **50432** by default "to avoid unintended client connections"), `-P connstr/--publisher-server`, `-s dir/--socketdir` (default current directory), `-t seconds/--recovery-timeout` (default 0 = disabled), `-T/--enable-two-phase` (default false), `-U username/--subscriber-username`, `-v`, `--clean=publications` (drop all other publications replicated from the source too; the FOR ALL TABLES ones created for this run are always dropped on the target), `--config-file=filename`, `--publication=name`, `--replication-slot=name` (default = subscription name), `--subscription=name` (counts and order must match the -d switches).
- Prerequisites: source, target and tool all the same major version; target data directory has the same system identifier as the source; target user can create subscriptions and call `pg_replication_origin_advance()`. Target: must be a physical standby; `max_active_replication_origins` and `max_logical_replication_workers` ≥ number of databases; `max_worker_processes` > number of databases; accepts local connections; `max_prepared_transactions` set if using two-phase. Source: accepts connections from the target; not in recovery; `wal_level = logical`; `max_replication_slots` ≥ databases + existing slots; `max_wal_senders` ≥ databases + existing walsenders.
- How it works (documented steps):
  1. Start the target server with the given options (error if it is already running).
  2. Check that the target can be converted, plus a few checks on the source.
  3. On the source, create a publication (`FOR ALL TABLES`) and a replication slot for each database; default names follow `pg_createsubscriber_%u_%x` (database OID, random int). The LSN of the last slot created is the *replication start point*: it is used as `recovery_target_lsn` and as the subscriptions' start — "It guarantees that no transaction will be lost."
  4. Write recovery parameters to the target and restart it: `recovery_target_lsn`, action `promote`, plus parameters preventing recovery from ending early at consistency or conflicting recovery targets. Step ends when the server leaves standby mode and accepts read-write transactions (`--recovery-timeout` bounds it).
  5. Create a subscription per database on the target — no data copy, no slot creation (reuses the slot from step 3), created disabled.
  6. Drop publications on the target that were replicated from the source (no use on the subscriber).
  7. Set replication progress for each subscription to the start point using `pg_replication_origin_advance()` with the subscription's replication origin name.
  8. Enable each subscription; it applies from the start point.
  9. Drop the standby's `primary_slot_name` slot on the source if one was used.
  10. Drop failover replication slots on the target (they can no longer be synchronized).
  11. Stop the target and run `pg_resetwal` to change its system identifier (so it can never use the source's WAL files).
- Warnings: failure after promotion → data directory likely unrecoverable; create a new standby. Target runs with different connection settings during conversion. Avoid DDL on the source while running (DDL is not logically replicated). On failure, objects created on the source are removed (may fail if unreachable → warning lists leftovers). If the target is a synchronous replica, primary commits may wait. Without `--enable-two-phase`, prepared transactions are replicated at `COMMIT PREPARED`. A standby of the target breaks (system identifier changes). Source must set `max_slot_wal_keep_size = -1` so required WAL isn't removed.
- Example: `pg_createsubscriber -D /usr/local/pgsql/data -P "host=foo" -d hr -d finance`.

### pg_ctl — server lifecycle control  [M1, M7]  (source: app-pg-ctl.txt)
- Synopsis:
  - `pg_ctl init[db] [-D datadir] [-s] [-o initdb-options]`
  - `pg_ctl start [-D datadir] [-l filename] [-W] [-t seconds] [-s] [-o options] [-p path] [-c]`
  - `pg_ctl stop [-D datadir] [-m s[mart] | f[ast] | i[mmediate]] [-W] [-t seconds] [-s]`
  - `pg_ctl restart [-D datadir] [-m ...] [-W] [-t seconds] [-s] [-o options] [-c]`
  - `pg_ctl reload [-D datadir] [-s]`; `pg_ctl status [-D datadir]`; `pg_ctl promote [-D datadir] [-W] [-t seconds] [-s]`; `pg_ctl logrotate [-D datadir] [-s]`; `pg_ctl kill signal_name process_id`
  - Windows: `pg_ctl register [-D datadir] [-N servicename] [-U username] [-P password] [-S a[uto] | d[emand]] [-e source] [-W] [-t seconds] [-s] [-o options]`; `pg_ctl unregister [-N servicename]`
- `start`: server launched in the background with stdin from `/dev/null`; on Unix stdout+stderr go to pg_ctl's stdout unless `-l filename` (append to log file; created if missing; owner-only unless group access enabled). Use `-l` or redirection, else postgres writes to the controlling terminal and does not leave the shell's process group.
- **Shutdown modes** (`-m`, default **fast**):
  - **smart**: disallow new connections, then wait for all existing clients to disconnect. In hot standby, recovery and streaming replication are terminated once all clients have disconnected.
  - **fast**: do not wait; all active transactions are rolled back, clients forcibly disconnected, then server shut down.
  - **immediate**: abort all server processes immediately without clean shutdown → crash-recovery cycle on next start.
- `restart` = stop + start; reuses the previous command-line options from `postmaster.opts` unless `-o` is given (which replaces them); relative paths at start can break restart from another cwd.
- `reload`: sends `SIGHUP` to the postgres process → rereads `postgresql.conf`, `pg_hba.conf`, etc.
- `status`: prints PID and command line (`pg_ctl: server is running (PID: 13718)` + `/usr/local/pgsql/bin/postgres "-D" "/usr/local/pgsql/data" "-p" "5433" "-B" "128"`). Exit status **3** if server not running, **4** if no accessible data directory.
- `promote`: standby ends standby mode and begins read-write operation. `logrotate`: rotate server log file. `kill`: send a signal (mainly for Windows).
- Options: `-c/--core-files` (lift soft core-file limit), `-D datadir/--pgdata` (else `PGDATA`), `-l/--log`, `-m/--mode`, `-o options/--options` (passed to postgres or initdb; repeatable; quote them), `-p path` (postgres/initdb executable), `-s/--silent`, `-t seconds/--timeout` (default `PGCTLTIMEOUT` or **60 seconds**), `-w/--wait` (DEFAULT for start, stop, restart, promote, register), `-W/--no-wait` (was the default in old releases except for stop).
- Wait logic: pg_ctl polls the PID file. Startup is complete when the PID file indicates readiness to accept connections; shutdown is complete when the server removes the PID file. On timeout pg_ctl exits nonzero but "the operation might continue in the background and eventually succeed".
- Files: `postmaster.pid` (is a server running?), `postmaster.opts` (options used at last start; shown by `status`, reused by `restart`).
- Windows options: `-e source` (event source, default `PostgreSQL`), `-N servicename` (default `PostgreSQL`), `-P password`, `-S auto|demand` (default auto), `-U username` (`DOMAIN\username`).
- Examples: `pg_ctl start`; `pg_ctl -o "-F -p 5433" start` (port 5433, no fsync); `pg_ctl stop -m smart`; `pg_ctl restart`.

### pg_resetwal — last-resort WAL / pg_control reset  [M7, M5, M2]  (source: app-pgresetwal.txt)
- `pg_resetwal [-f|--force] [-n|--dry-run] [option...] [-D|--pgdata] datadir`. "clears the write-ahead log (WAL) and optionally resets some other control information stored in the pg_control file" — "only as a last resort, when the server will not start due to such corruption."
- On a cleanly shut down cluster with a sound control file it has no effect on database contents except clearing unused WAL files. `-f` is REQUIRED for a data directory in unclean-shutdown state or with a corrupted control file (plausible values are substituted).
- After use on a damaged cluster: the server should start, but data may be inconsistent due to partially-committed transactions → "immediately dump your data, run initdb, and restore", then check for inconsistencies. Don't run any data-modifying operations before dumping.
- The data directory must be given on the command line — `PGDATA` is deliberately NOT used. Refuses to run if a server lock file exists (remove it only after making "doubly certain" no server process is alive). Same major version only. Must be run by the server-owning user.
- `-n/--dry-run`: print values reconstructed from `pg_control` and values about to change, then exit.
- Manual-override options (hex with `0x` allowed; recipes assume the standard 8 kB block size):
  - `-x xid/--next-transaction-id`: safe value = (numerically largest file name in `pg_xact` + 1) × 1048576 (0x100000). E.g. largest `0011` → `-x 0x1200000`. (Each `pg_xact` segment file covers 1,048,576 transactions.)
  - `-u xid/--oldest-transaction-id` (oldest unfrozen XID): smallest file name in `pg_xact` × 1048576. E.g. `0007` → `-u 0x700000`.
  - `-m mxid,mxid/--multixact-ids` (next, oldest): next = (largest file name in `pg_multixact/offsets` + 1) × 65536 (0x10000); oldest = smallest file name × 65536 (append four hex zeroes).
  - `-O mxoff/--multixact-offset`: (largest file name in `pg_multixact/members` + 1) × 52352 (0xCC80).
  - `-c xid,xid/--commit-timestamp-ids` (oldest, newest XID with retrievable commit time): smallest / greatest file names in `pg_commit_ts`.
  - `-e xid_epoch/--epoch`: the XID epoch "is not actually stored anywhere in the database except in the field that is set by pg_resetwal"; matters for replication systems like Slony-I and Skytools.
  - `-l walfile/--next-wal-file`: name of the next WAL segment; must be larger than any existing name in `pg_wal`; three hex parts, the first is the timeline ID (usually keep). E.g. largest `00000001000000320000004A` → `-l 00000001000000320000004B`. Takes a file NAME, not an LSN (with non-default segment sizes file-name numbers differ from LSNs). pg_resetwal itself picks a default beyond the last existing file.
  - `-o oid/--next-oid`: no easy recipe, "fortunately it is not critical to get the next-OID setting right".
  - `--char-signedness=signed|unsigned`: default char signedness recorded in the control file (v18; exclusively for pg_upgrade — for clusters upgraded from pre-18, the signedness of the original platform).
  - `--wal-segsize=wal_segment_size` (MB; power of 2 between 1 and 1024): can change the WAL segment size of an EXISTING, sound cluster without re-initdb. Segment-size changes can cause earlier WAL file names to be reused → combine with `-l` if archive overlap matters.

### pg_rewind — resynchronize a diverged data directory  [M7]  (source: app-pgrewind.txt)
- `pg_rewind [option...] {-D|--target-pgdata} directory {--source-pgdata=directory | --source-server=connstr}`. Typical use: bring an old primary back as a standby of the new primary after failover (also: a promoted-then-written standby rewound to be a standby again).
- After success the target is "analogous to a base backup of the source data directory". Efficiency: "Only changed blocks from existing relation files are copied; all other files, including new relation files, configuration files, and WAL segments, are copied in full."
- Finds the divergence point from the timeline histories; needs WAL in the target's `pg_wal` back to the point of divergence (copy from the archive manually, or `-c/--restore-target-wal` to use the target's `restore_command`).
- Requirements: target must have `wal_log_hints = on` OR data checksums enabled (the initdb default); `full_page_writes = on` (default). Target must be cleanly shut down — by default, if not, pg_rewind starts it in single-user mode to complete crash recovery and stops it (`--no-ensure-shutdown` disables that and errors out). `--source-pgdata` requires the source cleanly shut down; `--source-server` requires it running, via a normal (non-replication) connection as superuser or a role with EXECUTE on `pg_ls_dir(text, boolean, boolean)`, `pg_stat_file(text, boolean)`, `pg_read_binary_file(text)`, `pg_read_binary_file(text, bigint, bigint, boolean)`.
- How it works:
  1. Scan the target's WAL starting from the last checkpoint before the point where the source's timeline forked off; record every data block touched → list of blocks changed on the target after the fork.
  2. Copy those blocks from source to target (file access or SQL). Relation files are now equivalent to the last completed checkpoint before divergence plus the source's current state of those blocks.
  3. Copy all other files (new relation files, WAL segments, `pg_xact`, configuration files) in full. Omitted directory contents: `pg_dynshmem/`, `pg_notify/`, `pg_replslot/`, `pg_serial/`, `pg_snapshots/`, `pg_stat_tmp/`, `pg_subtrans/`. Omitted files: `backup_label`, `tablespace_map`, `pg_internal.init`, `postmaster.opts`, `postmaster.pid`, `.DS_Store`, and anything beginning with `pgsql_tmp`.
  4. Create a `backup_label` to begin WAL replay at the checkpoint created at failover, and set `pg_control`'s minimum consistency LSN to `pg_current_wal_insert_lsn()` (live source) or the last checkpoint LSN (stopped source).
  5. On start, the target enters archive recovery and replays all WAL generated on the source from the last checkpoint before divergence → consistent state. WAL no longer on the source must be supplied via `recovery.signal` + `restore_command`.
- Other options: `-R/--write-recovery-conf` (`standby.signal` + `postgresql.auto.conf`; requires `--source-server`), `-n/--dry-run`, `-N/--no-sync`, `-P/--progress`, `--config-file=filename`, `--debug`, `--sync-method=fsync|syncfs`.
- Warnings: if it fails mid-way the target is likely unrecoverable → take a fresh backup. Configuration files are overwritten from the source — fix recovery config before restart or the target may diverge again. Fails immediately on files it cannot write (e.g. read-only SSL keys/certs shared by mapping) — remove them first.

### pg_test_fsync — compare wal_sync_method choices  [M7]  (source: pgtestfsync.txt)
- Gives "a reasonable idea of what the fastest wal_sync_method is on your specific system" and diagnostic info for I/O problems. Reports average file sync operation time in microseconds per `wal_sync_method`; this also informs tuning of `commit_delay`. Caveat: differences "might not make any significant difference in real database throughput", since many servers aren't limited by WAL speed.
- Options: `-f/--filename` (test file — should be on the same filesystem as `pg_wal`; default `pg_test_fsync.out` in the current directory), `-s/--secs-per-test` (default 5 seconds → whole run under 2 minutes), `-V`, `-?`.

### pg_test_timing — clock overhead and monotonicity  [M4]  (source: pgtesttiming.txt)
- Measures timing-call overhead and confirms system time never moves backwards. "Systems that are slow to collect timing data can give less accurate EXPLAIN ANALYZE results."
- Option: `-d duration/--duration` (seconds; default 3).
- Good result: > 90% of individual timing calls < 1 µs; average per-loop overhead below 100 ns. Example (Intel i7-860, TSC): `Per loop time including overhead: 35.96 ns`; histogram `< us / % of total / count`: 1 → 96.40465%, 2 → 3.59518%, 4 → 0.00015%, 8 → 0.00002%, 16 → 0.00000%. Per-loop is in ns, histogram buckets in µs.
- EXPLAIN ANALYZE overhead demo: `CREATE TABLE t AS SELECT * FROM generate_series(1,100000); \timing; SELECT COUNT(*) FROM t; EXPLAIN ANALYZE SELECT COUNT(*) FROM t;` → 9.8 ms vs 16.6 ms; the 6.8 ms difference = 68 ns per row (about twice what pg_test_timing estimated) and makes the timed statement take almost 70% longer.
- With the slow `acpi_pm` clock source: per loop 722.92 ns (27.8% < 1 µs, 72.06% < 2 µs); the same EXPLAIN ANALYZE takes 115.9 ms = 1061 ns of timing overhead per row.
- Clock sources: Linux `/sys/devices/system/clocksource/clocksource0/available_clocksource` (`tsc hpet acpi_pm`) and `current_clocksource`; FreeBSD `sysctl kern.timecounter.hardware=TSC`; old Linux `jiffies`.
- Hardware: **TSC** most accurate on current CPUs (can be unreliable: temperature-dependent on old systems, inconsistent across cores → time going backwards, aggressive power saving); **HPET** preferred when TSC isn't accurate (programmable up to 100 ns resolution); **ACPI PM timer** (`acpi_pm`) at best 300 ns resolution; older 8254 PIT, RTC, APIC timer, Cyclone timer aim for millisecond resolution. VMs have extra timer-emulation difficulties.

### pg_upgrade — in-place major-version upgrade  [M7, M2]  (source: pgupgrade.txt)
- `pg_upgrade -b oldbindir [-B newbindir] -d oldconfigdir -D newconfigdir [option...]` (formerly pg_migrator). Upgrades data files to a later MAJOR version without dump/restore; not needed for minor upgrades.
- Why it works: "Major PostgreSQL releases regularly add new features that often change the layout of the system tables, but the internal data storage format rarely changes. pg_upgrade uses this fact to perform rapid upgrades by creating new system tables and simply reusing the old user data files."
- Checks binary compatibility (compile-time settings, 32/64-bit) via `pg_controldata`; external modules must also be binary compatible (uncheckable). Supports upgrades from 9.2.X and later.
- WARNING: "Upgrading a cluster causes the destination to execute arbitrary code of the source superusers' choice."
- Options: `-b/--old-bindir` (`PGBINOLD`), `-B/--new-bindir` (`PGBINNEW`; default pg_upgrade's own dir), `-c/--check` (check only; may be run while the old server is still running), `-d/--old-datadir` (`PGDATAOLD`), `-D/--new-datadir` (`PGDATANEW`), `-j njobs/--jobs` (parallel across databases and tablespaces; start with number of CPU cores), `-N/--no-sync`, `-o/--old-options`, `-O/--new-options`, `-p/--old-port` (`PGPORTOLD`), `-P/--new-port` (`PGPORTNEW`), `-r/--retain` (keep SQL and log files), `-s dir/--socketdir` (`PGSOCKETDIR`; default cwd), `-U/--username` (`PGUSER`), `-v`, `--no-statistics`, `--set-char-signedness=signed|unsigned`, `--sync-method=fsync|syncfs`.
- File transfer modes:
  - `--copy` (default): old cluster untouched.
  - `-k/--link`: hard links; much faster, less disk; old and new data dirs must be on the same filesystem (tablespaces and `pg_wal` may differ); the old cluster becomes unusable once the NEW cluster is started.
  - `--clone`: reflinks — near-instant, old cluster untouched; Linux kernel ≥ 4.5 with Btrfs or XFS (reflink-enabled), macOS APFS; errors if unsupported; same filesystem.
  - `--copy-file-range`: `copy_file_range` syscall; Linux and FreeBSD.
  - `--swap` (v18): move the data directories from the old cluster to the new, then replace the catalog files with those generated for the new cluster; may be fastest with many relations; leaves many garbage files in the old cluster (prefer `--sync-method=fsync`); old cluster is destructively modified once file transfer begins; same filesystem.
- **char signedness** (v18): default signedness of C `char` varies (signed on x86, unsigned on ARM). "Starting from PostgreSQL 18, database clusters maintain their own default char signedness setting". pg_upgrade preserves it; when upgrading from ≤ 17 it adopts the signedness of the platform it was built on. Use `--set-char-signedness` only if the cluster was ALREADY migrated to a platform with different signedness (specify the original platform's), and pg_upgrade must be the first thing to start the cluster there.
- Upgrade procedure (documented steps):
  1. Optionally move the old cluster (`mv /usr/local/pgsql /usr/local/pgsql.old`) if the install dir isn't version-specific.
  2. For source installs, build the new version with compatible configure flags.
  3. Install the new binaries.
  4. `initdb` the new cluster with compatible flags; do not start it.
  5. Install extension shared object files (e.g. `pgcrypto.so`) for the new server — do NOT run `CREATE EXTENSION` (schema definitions come from the old cluster). pg_upgrade reports available extension updates and writes a script.
  6. Copy custom full-text search files (dictionary, synonym, thesaurus, stop words).
  7. Adjust authentication (`peer` in `pg_hba.conf` or `~/.pgpass`) — pg_upgrade connects many times.
  8. Stop both servers (`pg_ctl -D ... stop`); standbys must be running during this shutdown so they receive all changes.
  9. Prepare standby upgrades: with `pg_controldata` verify "Latest checkpoint location" matches on old primary and standbys; ensure `wal_level` is not `minimal` on the new primary.
  10. Run the NEW version's `pg_upgrade` (needs write permission in cwd; servers run on port **50432** by default to avoid unintended client connections). `--check` plus the mode flag enables mode-specific checks. If schema restore fails you must revert and fix the old cluster.
  11. Upgrade standbys (link mode only) with rsync run on the primary: `rsync --archive --delete --hard-links --size-only --no-inc-recursive old_cluster new_cluster remote_dir` (plus per-tablespace dirs like `/vol1/pg_tblsp/PG_12_201909212` → `PG_18_202307071`, and a relocated `pg_wal`). It reproduces the hard links on the standby. Slots: if the old primary is < 17.0 no slots are copied to the new standby; if ≥ 17.0 only logical slots on the primary are copied — recreate others manually.
  12. Restore `pg_hba.conf` and other config.
  13. Start the new server (then rsync'ed standbys).
  14. Post-upgrade processing: run generated scripts with `psql --username=postgres --file=script.sql postgres`. Tables referenced in rebuild scripts are unsafe to access until the scripts finish.
  15. Statistics: unless `--no-statistics`, most optimizer statistics are transferred (v18) — but not extended statistics (`CREATE STATISTICS`), extension custom stats, or cumulative stats. Then run `vacuumdb --all --analyze-in-stages --missing-stats-only`, followed by `vacuumdb --all --analyze-only` (to refresh cumulative stats that trigger autovacuum/autoanalyze); `--jobs` speeds up; `PGOPTIONS='-c vacuum_cost_delay=0' vacuumdb ...`.
  16. Delete the old cluster using the script pg_upgrade names.
  17. Reverting: after `--check` or without `--link`/`--swap` the old cluster is unmodified. With `--link`: if the new cluster was never started, remove the `.old` suffix from `$PGDATA/global/pg_control` and restart the old cluster; if the new cluster WAS started, the old cluster is unsafe → restore from backup. With `--swap`: safe only if pg_upgrade aborted before reporting that the old cluster is no longer safe to start.
- Notes: working files in `pg_upgrade_output.d/<ISO-8601 timestamp %Y%m%dT%H%M%S>/` inside the new cluster (removed on success). It launches short-lived postmasters in both data dirs (socket path length → `-s`). Post-upgrade steps depend on schema, not data. Deployment test: schema-only copy + dummy data.
- Unsupported: table columns of reg* types `regcollation`, `regconfig`, `regdictionary`, `regnamespace`, `regoper`, `regoperator`, `regproc`, `regprocedure` (`regclass`, `regrole`, `regtype` ARE upgradable).
- Tablespace directory naming visible in the docs: `PG_<major>_<catalog version>` e.g. `PG_18_202307071`.

### pg_waldump — human-readable WAL  [M7, M2]  (source: pgwaldump.txt)
- `pg_waldump [option...] [startseg [endseg]]` — "mainly useful for debugging or educational purposes". Needs read access to the data directory (server-owning user).
- `startseg` implicitly determines the search path and the timeline; `endseg` stops after that segment.
- Filters: `-s start/--start` (LSN; default first valid record in the earliest file found), `-e end/--end`, `-n limit/--limit`, `-t timeline/--timeline` (default from startseg, else 1; decimal or hex e.g. `17` or `0x11`), `-r rmgr/--rmgr` (repeatable; `-r list` prints valid resource manager names; custom rmgrs from extensions as `custom###` with the three-digit rmgr ID, since extension modules aren't loaded), `-R tblspc/db/rel/--relation` (tablespace OID / database OID / relfilenode, e.g. `1234/12345/12345` — same format as in the output), `-B block/--block` (requires -R), `-F fork/--fork` (`main`, `fsm`, `vm`, `init`), `-x xid/--xid`, `-w/--fullpage` (only records that include full page images).
- Output: `-b/--bkp-details` (detailed info about backup blocks), `-z/--stats[=record]` (summary statistics — number and size of records and full-page images — per rmgr, or per record type; on SIGINT prints stats so far; not on Windows), `-q/--quiet` (parse-check only), `-f/--follow` (after end of valid WAL keep polling once per second), `-p path/--path` (dir with WAL files or with a `pg_wal` subdirectory; default: cwd, `./pg_wal`, `$PGDATA/pg_wal`).
- `--save-fullpage=save_path`: extract FPIs to files named `TIMELINE-LSN.RELTABLESPACE.DATOID.RELNODE.BLKNO_FORK` — TIMELINE as `%08X`; LSN as `%08X-%08X`; tablespace OID; database OID; filenode; block number; fork name (`main`, `fsm`, `vm`, `init`).
- Notes: "Can give wrong results when the server is running." Only the specified timeline is displayed. Cannot read `.partial` files unless the suffix is removed.

### pg_walsummary — print WAL summary files  [M7]  (source: app-pgwalsummary.txt)
- WAL summary files are binary files in `pg_wal/summaries`; they "primarily exist to support incremental backup".
- Structure: indexed by tablespace OID, relation OID, and relation fork. For each relation fork: the list of blocks modified by WAL within the summarized LSN range, plus optionally a **limit block** — 0 if the fork was created or truncated within the range, otherwise the shortest length to which it was truncated; undefined/infinite (not printed) if not created, deleted, or truncated in the range.
- Options: `-i/--individual` (one line per modified block; default one line per range of consecutive modified blocks), `-q/--quiet` (parse-check only), `-V`, `-?`.

### postgres — the server executable  [M1, M7]  (source: app-postgres.txt)
- "In order for a client application to access a database it connects (over a network or locally) to a running postgres instance. The postgres instance then starts a separate server process to handle the connection." (process-per-connection model.)
- One postgres instance manages exactly one database cluster ("a collection of databases that is stored at a common file system location (the 'data area')"). Multiple instances can coexist with different data areas and ports. Data area via `-D` or `PGDATA` — no default. By default starts in the foreground and logs to stderr.
- General options (each mostly a short form of a GUC): `-B nbuffers` (`shared_buffers`; default chosen by initdb), `-c name=value` (any GUC; repeatable), `--name=value` (short form of -c; underscores may be written as dashes: `--work-mem=1234`), `-C name` (print a parameter's value and exit — from `postgresql.conf` plus this invocation's switches, NOT the running server's start-time switches; works while running for most, but the server must be shut down for runtime-computed ones like `shared_memory_size`, `shared_memory_size_in_huge_pages`, `wal_segment_size`; intended for tools like pg_ctl), `-d debug-level` (1–5; `-d 0` for one session prevents inheriting the parent's log level), `-D datadir`, `-e` (European DMY date style), `-F` (disable `fsync` — corruption risk on crash), `-h hostname` (`listen_addresses`; comma list, `*`, or empty; default localhost only), `-i` (deprecated; = listen_addresses `*`), `-k directory` (`unix_socket_directories`; default normally `/tmp`), `-l` (enable SSL), `-N max-connections` (`max_connections`; default chosen by initdb), `-p port` (default `PGPORT` or compiled-in, normally 5432), `-s` (print time info and statistics at end of each command), `-S work-mem` (`work_mem`), `--describe-config` (dump all GUCs with descriptions and defaults in tab-delimited COPY format), `-V`, `-?`.
- `PGOPTIONS`: libpq clients pass this string to the server, which interprets it as postgres command-line options for that session (safe options only).
- Semi-internal options (debugging/recovery only): `-f {s|i|o|b|t|n|m|h}` forbid plan types — s seqscan, i indexscan, o index-only scan, b bitmap index scan, t TID scan, n nested loop, m merge join, h hash join ("Neither sequential scans nor nested-loop joins can be disabled completely; the -fs and -fn options simply discourage the optimizer"); `-O` allow modifying system table structure (used by initdb); `-P` ignore system indexes when reading system tables but still update them (recover from damaged system indexes); `-t pa[rser]|pl[anner]|e[xecutor]` per-module timing stats (not with -s); `-T` send `SIGABRT` instead of `SIGQUIT` to sibling processes after a backend crash (to get core dumps); `-v protocol` (internal); `-W seconds` delay after authentication of a new server process (attach a debugger).
- Single-user mode options: `--single` (MUST be the first argument), `database` (MUST be the last argument; defaults to the user name), `-E` (echo commands), `-j` (terminator = semicolon followed by two newlines), `-r filename` (send server log output to file).
- **Single-user mode**: `postgres --single -D /usr/local/pgsql/data other-options my_database`. Primary use: bootstrapping by initdb; also debugging/disaster recovery — but "no realistic interprocess communication and locking will happen". Session user is set to the user with ID 1 with implicit superuser powers; "This user does not actually have to exist" → can repair accidental damage to system catalogs. Input: newline terminates a command (no semicolon intelligence); backslash-newline continues (even inside string literals/comments); with `-j`, `;` + empty line terminates. A semicolon not at the terminator is a command separator; multiple statements entered before a terminator execute as a single transaction. EOF (Ctrl+D) quits. No line editing/history. "Single-user mode also does not do any background processing, such as automatic checkpoints or replication."
- **Signals** to the main postgres process: `SIGTERM` = wait for all clients to terminate before quitting (smart); `SIGINT` = forcefully disconnect all clients (fast); `SIGQUIT` = quit immediately without proper shutdown → recovery run on restart (immediate); `SIGHUP` = reload configuration files. Never `SIGKILL` the main process: it cannot free shared memory and semaphores, which may prevent a fresh start.
- Signals to a backend: `SIGINT` cancels the running query (`pg_cancel_backend`); `SIGTERM` terminates the backend cleanly (`pg_terminate_backend`). The server itself uses `SIGQUIT` to tell children to terminate without cleanup — users shouldn't. `SIGKILL` on a backend is treated by the main process as a crash: it forces all sibling processes to quit as part of standard crash recovery.
- Diagnostics: `semget`/`shmget` failures → kernel shared memory/semaphore limits (or reduce `shared_buffers` / `max_connections`); "another server is already running" → check `ps`, then remove the lock file only if certain; cannot bind port → in use, just-released (wait a few seconds), or reserved (< 1024).
- Env: `PGCLIENTENCODING`, `PGDATA`, `PGDATESTYLE` (deprecated), `PGPORT`. Bug: `--name=value` options don't work on FreeBSD or OpenBSD — use `-c`.
- Examples: `nohup postgres >logfile 2>&1 </dev/null &`; `postgres -p 1234`; `postgres -c work_mem=1234` ≡ `postgres --work-mem=1234`.

## Complete inventories

### Program inventory (one row per program)
| program | kind | mechanism / wraps | server state needed | purpose | modules |
|---|---|---|---|---|---|
| clusterdb | client | SQL `CLUSTER` | running | re-cluster previously clustered tables | M4 |
| createdb | client | SQL `CREATE DATABASE` | running | create a database | M1 |
| createuser | client | SQL `CREATE ROLE` | running | create a role | M1 |
| dropdb | client | SQL `DROP DATABASE` | running | drop a database | M1 |
| dropuser | client | SQL `DROP ROLE` | running | drop a role | M1 |
| ecpg | client | C preprocessor (no connection) | n/a | embedded SQL in C → C + libecpg | M6 |
| pg_amcheck | client | amcheck functions over SQL | running | corruption check of heaps, toast, sequences, btrees | M2, M4 |
| pg_basebackup | client | replication protocol (walsender) | running | physical full or incremental base backup | M7 |
| pgbench | client | SQL (simple/extended/prepared) | running | benchmark (TPC-B-like or custom scripts) | M4, M5 |
| pg_combinebackup | client | files only | n/a | synthesize a full backup from an incremental chain | M7 |
| pg_config | client | build info only | n/a | print install paths and build flags | M6 |
| pg_dump | client | SQL SELECTs in one snapshot | running | logical dump of one database | M7 |
| pg_dumpall | client | runs pg_dump per database + globals | running | dump whole cluster as a psql script | M7 |
| pg_isready | client | connection attempt | either | report accept/reject/no response | M1 |
| pg_receivewal | client | replication protocol (physical) | running | stream WAL to local files | M7 |
| pg_recvlogical | client | replication protocol (logical) | running | manage logical slots, stream decoded changes | M7 |
| pg_restore | client | reads archive; SQL to server | running (or script output) | restore custom/directory/tar archives | M7 |
| pg_verifybackup | client | files + pg_waldump | n/a | verify a backup against backup_manifest | M7 |
| psql | client | libpq, simple protocol by default | running | interactive terminal and scripting | M1, M6 |
| reindexdb | client | SQL `REINDEX` | running | rebuild indexes | M4 |
| vacuumdb | client | SQL `VACUUM` / `ANALYZE` | running | vacuum and/or analyze | M7 |
| initdb | server | bootstrap backend | none exists yet | create a new cluster | M1, M2 |
| pg_archivecleanup | server | files only | either | delete old WAL from an archive directory | M7 |
| pg_checksums | server | data directory files | stopped cleanly | check / enable / disable data checksums | M2 |
| pg_controldata | server | reads `global/pg_control` | either | print control file info | M1, M7 |
| pg_createsubscriber | server | pg_ctl + SQL + pg_resetwal | target standby stopped at start | convert physical standby to logical replica | M7 |
| pg_ctl | server | spawns/signals postgres | either | start/stop/restart/reload/promote/status | M1 |
| pg_resetwal | server | rewrites pg_control, clears WAL | stopped (no lock file) | last-resort reset, change WAL segment size | M7 |
| pg_rewind | server | target files + source files or SQL | target stopped cleanly | resync a diverged former primary | M7 |
| pg_test_fsync | server | local file I/O | n/a | time each wal_sync_method | M7 |
| pg_test_timing | server | clock calls | n/a | measure timing overhead | M4 |
| pg_upgrade | server | starts both postmasters | both stopped | major-version upgrade reusing data files | M7 |
| pg_waldump | server | reads WAL segment files | either (wrong results possible if running) | decode WAL records | M7, M2 |
| pg_walsummary | server | reads `pg_wal/summaries` | either | print WAL summary files | M7 |
| postgres | server | the server itself | n/a | database server; single-user mode | M1 |

### psql meta-commands (complete, as documented)
Modifier legend: `S` = include system objects, `x` = expanded output, `+` = extra detail.

General, query buffer and output:
- `\a`: toggle aligned/unaligned (legacy).
- `\C [title]`: table title (= `\pset title`).
- `\cd [directory]`: change working directory (home if omitted).
- `\copyright`: show the copyright and distribution terms.
- `\crosstabview [colV [colH [colD [sortcolH]]]]`: run the buffer and show the result as a pivot grid.
- `\e`/`\edit [filename] [line_number]`: edit the buffer, a file, or the last query.
- `\ef [function_description [line_number]]`: edit a function as `CREATE OR REPLACE`.
- `\ev [view_name [line_number]]`: edit a view as `CREATE OR REPLACE VIEW`.
- `\echo text [...]`: print to stdout (`-n` = no newline).
- `\qecho text [...]`: print to the `\o` channel.
- `\warn text [...]`: print to stderr.
- `\encoding [encoding]`: show or set the client encoding.
- `\errverbose`: repeat the last error at maximum verbosity.
- `\f [string]`: unaligned field separator (default `|`).
- `\g [(option=value ...)] [filename | |command]`: execute the buffer, with optional one-shot `\pset` options and output destination.
- `\gx [...]`: `\g` in expanded mode.
- `\gdesc`: describe the result columns without executing.
- `\gexec`: execute each result cell as SQL.
- `\gset [prefix]`: store a one-row result in variables.
- `\h`/`\help [command]`: SQL syntax help (`*` = all).
- `\H`/`\html`: toggle HTML format.
- `\i`/`\include filename`: run a file.
- `\ir`/`\include_relative filename`: run a file relative to the current script.
- `\o`/`\out [filename | |command]`: redirect query output.
- `\p`/`\print`: print the buffer.
- `\q`/`\quit`: quit (in a script, ends that script).
- `\r`/`\reset`: clear the buffer.
- `\s [filename]`: print or save the history (needs Readline).
- `\t`: toggle tuples-only.
- `\T table_options`: HTML table attributes.
- `\timing [on|off]`: show statement duration.
- `\w`/`\write filename | |command`: write the buffer out.
- `\watch [i[nterval]=s] [c[ount]=n] [m[in_rows]=r] [seconds]`: re-run the query repeatedly.
- `\x [on|off|auto]`: expanded mode.
- `\! [command]`: shell escape.
- `\? [commands|options|variables]`: help.
- `\;`: literal semicolon that does not dispatch, so statements combine into one request.
- `\\`: separator between a meta-command and following SQL on the same line.

Connection and session:
- `\c`/`\connect [-reuse-previous=on|off] [dbname [username] [host] [port] | conninfo]`: open a new connection.
- `\conninfo`: describe the current connection.
- `\password [username]`: change a password (hashed client-side).

Variables and environment:
- `\set [name [value ...]]`: set or list variables.
- `\unset name`: remove a variable (control variables reset to their default).
- `\prompt [text] name`: read a value from the user into a variable.
- `\getenv psql_var env_var`: copy an environment variable into a psql variable.
- `\setenv name [value]`: set or unset an environment variable.

Conditionals: `\if expression`, `\elif expression`, `\else`, `\endif`.

COPY and large objects:
- `\copy ... from|to ...`: client-side COPY.
- `\lo_export loid filename`, `\lo_import filename [comment]`, `\lo_list[x+]` (alias `\dl[x+]`), `\lo_unlink loid`.

Extended protocol and pipelines:
- `\bind [parameter ...]`, `\bind_named statement_name [parameter ...]`, `\parse statement_name`, `\close_prepared prepared_statement_name`.
- `\startpipeline`, `\sendpipeline`, `\syncpipeline`, `\flushrequest`, `\flush`, `\getresults [number_results]`, `\endpipeline`.

Restricted mode: `\restrict restrict_key`, `\unrestrict restrict_key`.

Source display: `\sf[+] function_description`, `\sv[+] view_name`.

Formatting: `\pset [option [value]]` (see the next table).

Describe (`\d`) family:
| command | lists |
|---|---|
| `\d[Sx+] [pattern]` | describe relation or composite type; no pattern ≡ `\dtvmsE` |
| `\da[Sx]` | aggregate functions |
| `\dA[x+]` | access methods (`+` handler, description) |
| `\dAc[x+] [am [input-type]]` | operator classes |
| `\dAf[x+] [am [input-type]]` | operator families |
| `\dAo[x+] [am [opfamily]]` | operators of operator families |
| `\dAp[x+] [am [opfamily]]` | support functions of operator families |
| `\db[x+]` | tablespaces (`+` options, size, privileges) |
| `\dc[Sx+]` | encoding conversions |
| `\dconfig[x+]` | server parameters (no pattern = only non-default ones; `*` = all) |
| `\dC[x+]` | casts |
| `\dd[Sx]` | descriptions of constraints, opclasses, opfamilies, rules, triggers |
| `\dD[Sx+]` | domains |
| `\ddp[x]` | default privileges |
| `\dE`, `\di`, `\dm`, `\ds`, `\dt`, `\dv` `[Sx+]` | foreign tables, indexes, matviews, sequences, tables, views (combinable, e.g. `\dti`; `+` persistence, size, description) |
| `\des[x+]` | foreign servers |
| `\det[x+]` | foreign tables |
| `\deu[x+]` | user mappings (`+` may show remote passwords) |
| `\dew[x+]` | foreign-data wrappers |
| `\df[anptwSx+] [pattern [arg_pattern ...]]` | functions (agg, normal, procedure, trigger, window) |
| `\dF[x+]` | text search configurations |
| `\dFd[x+]` | text search dictionaries |
| `\dFp[x+]` | text search parsers |
| `\dFt[x+]` | text search templates |
| `\dg[Sx+]` / `\du[Sx+]` | roles (identical commands) |
| `\dl[x+]` | large objects (alias of `\lo_list`) |
| `\dL[Sx+]` | procedural languages |
| `\dn[Sx+]` | schemas |
| `\do[Sx+] [pattern [arg [arg]]]` | operators |
| `\dO[Sx+]` | collations (only those usable with the current database encoding) |
| `\dp[Sx]` / `\z[Sx]` | table/view/sequence privileges |
| `\dP[itnx+]` | partitioned tables and indexes |
| `\drds[x] [role-pattern [db-pattern]]` | per-role / per-database settings |
| `\drg[Sx]` | role membership grants (ADMIN/INHERIT/SET, grantor) |
| `\dRp[x+]` | publications |
| `\dRs[x+]` | subscriptions |
| `\dT[Sx+]` | data types (`+` internal name, size, enum values) |
| `\dx[x+]` | installed extensions (`+` member objects) |
| `\dX[x]` | extended statistics |
| `\dy[x+]` | event triggers |
| `\l[x+]` / `\list[x+]` | databases |

### psql `\pset` options
| option | values / default |
|---|---|
| `border` | number; 0 none, 1 internal lines, 2 frame (latex also 3); HTML → `border=` attribute |
| `columns` | target width for wrapped format and the pager/expanded-auto threshold; default 0 = use `COLUMNS` or the screen width |
| `csv_fieldsep` | default `,` |
| `expanded` (`x`) | `on` / `off` / `auto`; no value toggles; auto only effective in aligned and wrapped |
| `fieldsep` | unaligned separator; default `|` |
| `fieldsep_zero` | zero-byte field separator |
| `footer` | `on`/`off`; the `(n rows)` footer |
| `format` | `aligned` (default), `asciidoc`, `csv` (RFC 4180), `html`, `latex`, `latex-longtable`, `troff-ms`, `unaligned`, `wrapped`; unique abbreviations allowed |
| `linestyle` | `ascii` (default), `old-ascii`, `unicode` |
| `null` | string shown for NULL; default empty |
| `numericlocale` | `on`/`off`; locale digit grouping |
| `pager` | `off`, `on` (when output doesn't fit), `always` |
| `pager_min_lines` | default 0 |
| `recordsep` | default newline |
| `recordsep_zero` | zero-byte record separator |
| `tableattr` (`T`) | HTML table attributes; latex-longtable column widths |
| `title` (`C`) | table title |
| `tuples_only` (`t`) | `on`/`off` |
| `unicode_border_linestyle` | `single` / `double` |
| `unicode_column_linestyle` | `single` / `double` |
| `unicode_header_linestyle` | `single` / `double` |
| `xheader_width` | `full` (default), `column`, `page`, or an integer |

### psql special variables
| variable | meaning / default |
|---|---|
| `AUTOCOMMIT` | default on; off issues an implicit BEGIN before each command not already in a transaction block (not before VACUUM-like commands) |
| `COMP_KEYWORD_CASE` | `lower`, `upper`, `preserve-lower`, `preserve-upper` (default) |
| `DBNAME`, `HOST`, `PORT`, `USER`, `SERVICE`, `ENCODING` | connection state, set on each connect |
| `ECHO` | `none` (default), `all` (-a), `queries` (-e), `errors` (-b) |
| `ECHO_HIDDEN` | `off` (default), `on` (-E), `noexec` |
| `ERROR` | true/false for the last query |
| `FETCH_COUNT` | >0 fetch SELECT results in groups (100–1000 typical); default off |
| `HIDE_TABLEAM`, `HIDE_TOAST_COMPRESSION` | hide details (regression tests) |
| `HISTCONTROL` | `none` (default), `ignorespace`, `ignoredups`, `ignoreboth` |
| `HISTFILE` | default `~/.psql_history` (or `PSQL_HISTORY`) |
| `HISTSIZE` | default 500; negative = unlimited |
| `IGNOREEOF` | default 0; ≤1 means one EOF exits; non-numeric = 10 |
| `LASTOID` | last OID from INSERT or `\lo_import` (always 0 for INSERT on server ≥ 12) |
| `LAST_ERROR_MESSAGE`, `LAST_ERROR_SQLSTATE` | most recent error (empty and `00000` if none) |
| `ON_ERROR_ROLLBACK` | `off` (default), `on`, `interactive`; works via an implicit SAVEPOINT before each command |
| `ON_ERROR_STOP` | off by default; on → stop (exit 3 in scripts) |
| `PIPELINE_COMMAND_COUNT`, `PIPELINE_RESULT_COUNT`, `PIPELINE_SYNC_COUNT` | pipeline state |
| `PROMPT1`, `PROMPT2`, `PROMPT3` | defaults `'%/%R%x%# '`, `'%/%R%x%# '`, `'>> '` |
| `QUIET` | = -q |
| `ROW_COUNT` | rows returned/affected by the last query (0 on failure) |
| `SERVER_VERSION_NAME`, `SERVER_VERSION_NUM` | e.g. `11beta1` / `100001` |
| `SHELL_ERROR`, `SHELL_EXIT_CODE` | last shell command (0–127 exit codes, 128–255 signal, -1 launch failure) |
| `SHOW_ALL_RESULTS` | default on (show every result of a `\;` combined query) |
| `SHOW_CONTEXT` | `never`, `errors` (default), `always` |
| `SINGLELINE`, `SINGLESTEP` | = -S, -s |
| `SQLSTATE` | last error code or `00000` |
| `VERBOSITY` | `default`, `verbose`, `terse`, `sqlstate` |
| `VERSION`, `VERSION_NAME`, `VERSION_NUM` | psql's own version |
| `WATCH_INTERVAL` | default 2 s for `\watch` |

### Exit status codes
| tool | codes |
|---|---|
| psql | 0 ok; 1 fatal psql error; 2 connection lost (non-interactive); 3 script error with ON_ERROR_STOP |
| pg_isready | 0 accepting; 1 rejecting; 2 no response; 3 no attempt |
| pgbench | 0 ok; 1 static/early errors; 2 errors during the run |
| pg_ctl status | 3 not running; 4 no accessible data directory |
| pg_checksums --check | 0 no failures; nonzero if any failure |
| pg_receivewal, pg_recvlogical | 0 on SIGINT/SIGTERM or `--endpos` reached; nonzero on fatal errors or other signals |

### Shutdown modes and signals
| pg_ctl -m | signal to postmaster | behaviour |
|---|---|---|
| smart | SIGTERM | no new connections; wait for clients to disconnect |
| fast (default) | SIGINT | roll back active transactions, disconnect clients, shut down cleanly |
| immediate | SIGQUIT | abort all processes; crash recovery on next start |
| (reload) | SIGHUP | reread configuration files |
Backend-level: SIGINT = cancel query (`pg_cancel_backend`), SIGTERM = terminate backend (`pg_terminate_backend`); SIGKILL on any server process = treated as a crash → all siblings reset.

### Dump format capability matrix
| format | flag | restore with | default compression | parallel dump | parallel restore | selective/reorder |
|---|---|---|---|---|---|---|
| plain | `-Fp` | psql | none (gzip/lz4/zstd optional for the whole file) | no | no | no |
| custom | `-Fc` | pg_restore | gzip (moderate) per data segment | no | yes | yes |
| directory | `-Fd` | pg_restore | gzip per file | yes (`-j`) | yes | yes |
| tar | `-Ft` | pg_restore | not supported | no | no | selection yes; table-data order fixed |

### File-transfer modes (pg_upgrade / pg_combinebackup)
| mode | pg_upgrade | pg_combinebackup | notes |
|---|---|---|---|
| copy | `--copy` (default) | `--copy` (default) | old cluster / inputs untouched |
| hard link | `-k/--link` | `-k/--link` | same filesystem; pg_upgrade: old cluster unusable after the new one starts |
| clone (reflink) | `--clone` | `--clone` | Linux ≥ 4.5 Btrfs/XFS-reflink, macOS APFS; error if unsupported |
| copy_file_range | `--copy-file-range` | `--copy-file-range` | Linux, FreeBSD |
| swap | `--swap` (v18) | — | moves data dirs; old cluster destroyed once transfer begins |

### pgbench compact inventory
- Built-in scripts: `tpcb-like` (default), `simple-update` (`-N`), `select-only` (`-S`).
- Init steps (`-I`, default `dtgvp`): `d` drop, `t` tables, `g` client-side generation / `G` server-side generation, `v` vacuum, `p` primary keys, `f` foreign keys.
- Automatic variables: `client_id`, `default_seed`, `random_seed`, `scale`.
- Meta-commands: `\gset`, `\aset`, `\if`/`\elif`/`\else`/`\endif`, `\set`, `\sleep`, `\setshell`, `\shell`, `\startpipeline`/`\syncpipeline`/`\endpipeline`.
- Functions: abs, debug, double, exp, greatest, hash, hash_fnv1a, hash_murmur2, int, least, ln, mod, permute, pi, pow/power, random, random_exponential, random_gaussian, random_zipfian, sqrt.
- Operators (low→high precedence): OR, AND, NOT, IS [NOT] NULL/TRUE/FALSE, ISNULL/NOTNULL, =, <>, !=, <, <=, >, >=, |, #, &, ~, <<, >>, +, -, *, /, %, unary -.
- Defaults: -c 1, -j 1, -t 10, -s 1, -F 100, -M simple, --max-tries 1, --log-prefix pgbench_log, --random-seed time, weight 1.

### Key default numbers across tools
- Default port 5432; pg_upgrade and pg_createsubscriber run temporary servers on port 50432.
- pg_ctl wait timeout 60 s (`PGCTLTIMEOUT`); pg_isready timeout 3 s.
- `--status-interval` default 10 s (pg_basebackup, pg_receivewal, pg_recvlogical).
- WAL segment size 16 MB (power of 2, 1–1024 MB; set by initdb or pg_resetwal).
- pg_basebackup `--max-rate` between 32 kB/s and 1024 MB/s; manifest checksum default CRC32C; default label `pg_basebackup base backup`.
- psql `\watch` 2 s; HISTSIZE 500; pg_test_fsync 5 s per test; pg_test_timing 3 s.
- pgbench scale 1 = 100,000 accounts; aid becomes bigint at scale ≥ 20,000.

### pg_resetwal safe-value formulas (8 kB blocks)
| option | formula |
|---|---|
| `-x` next XID | (largest `pg_xact` file name + 1) × 0x100000 |
| `-u` oldest XID | smallest `pg_xact` file name × 0x100000 |
| `-m` next,oldest MXID | (largest `pg_multixact/offsets` name + 1) × 0x10000 , smallest × 0x10000 |
| `-O` multixact offset | (largest `pg_multixact/members` name + 1) × 0xCC80 (52352) |
| `-c` commit-ts XIDs | smallest , greatest `pg_commit_ts` file names |
| `-l` next WAL file | greater than the largest name in `pg_wal` (keep the timeline part) |

## Lesson ideas

### Visualizers
- **Parallel pg_dump lock dance** [M5, M7]: leader takes ACCESS SHARE on every table; another session queues an ACCESS EXCLUSIVE; the worker's NOWAIT lock attempt fails → dump aborts. Animate the lock queue to show why a plain wait would deadlock invisibly.
- **pg_rewind on forked timelines** [M7]: two timelines branching at an LSN; highlight blocks the target touched after the fork (from its WAL), copy just those from the source, then WAL replay from the checkpoint before the fork.
- **pg_basebackup WAL methods** [M7]: `-X stream` (second walsender, temporary slot) vs `-X fetch` (WAL collected at the end, at risk from `wal_keep_size`) vs `none`.
- **Incremental backup chain** [M7]: full ← incr1 ← incr2 with WAL summaries (modified blocks per fork, limit block) → pg_combinebackup synthesizes a full backup; deleting incr1 breaks the chain.
- **pg_verifybackup stages** [M7]: manifest → file presence/size → checksums → WAL parse, with sample failures at each stage.
- **pg_createsubscriber pipeline** [M7]: step through the 11 steps; mark the replication start LSN feeding both `recovery_target_lsn` and `pg_replication_origin_advance`.
- **Shutdown modes** [M1]: smart vs fast vs immediate timelines of clients, transactions and the next startup (crash recovery for immediate).
- **pg_upgrade transfer modes** [M7]: copy, link, clone, swap; show which files are shared and when the old cluster becomes unsafe.
- **psql prompt `%x` / `%R`** [M5]: live prompt changing `=>` → `=*>` → `=!>` as a transaction begins and fails.
- **pgbench rate limiting** [M4]: Poisson schedule versus actual start, growing schedule lag, late and skipped transactions under `-R` with `-L`.
- **pg_receivewal start point** [M7]: decision tree (local directory → slot restart_lsn → IDENTIFY_SYSTEM flush LSN).
- **pg_resetwal SLRU arithmetic** [M5, M7]: pg_xact file name → XID range (0x100000 XIDs per file).

### Playground SQL (PGlite; these are SQL analogues, since the binaries are not available)
```sql
-- What createdb/createuser/vacuumdb/reindexdb send (psql -e shows the same)
CREATE ROLE joe NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT LOGIN;
VACUUM (ANALYZE, VERBOSE) pg_class;
REINDEX TABLE pg_class;
-- pg_amcheck's underlying checks
CREATE EXTENSION IF NOT EXISTS amcheck;
CREATE TABLE t AS SELECT g AS id FROM generate_series(1,10000) g;
CREATE INDEX ON t(id);
SELECT bt_index_check('t_id_idx'::regclass, true);         -- heapallindexed
SELECT bt_index_parent_check('t_id_idx'::regclass);          -- stronger locks
SELECT * FROM verify_heapam('t');
-- pg_controldata analogue
SELECT * FROM pg_control_checkpoint();
SELECT * FROM pg_control_system();
-- pg_waldump analogue
CREATE EXTENSION IF NOT EXISTS pg_walinspect;
SELECT pg_current_wal_lsn() AS start \gset
UPDATE t SET id = id WHERE id < 10;
SELECT resource_manager, record_type, count(*)
FROM pg_get_wal_records_info(:'start', pg_current_wal_lsn()) GROUP BY 1,2;
-- pgbench TPC-B-like schema by hand (scale 1, small)
CREATE TABLE pgbench_branches(bid int PRIMARY KEY, bbalance int, filler char(88));
CREATE TABLE pgbench_tellers(tid int PRIMARY KEY, bid int, tbalance int, filler char(84));
CREATE TABLE pgbench_accounts(aid int PRIMARY KEY, bid int, abalance int, filler char(84));
CREATE TABLE pgbench_history(tid int, bid int, aid int, delta int, mtime timestamp, filler char(22));
INSERT INTO pgbench_branches SELECT 1, 0;
INSERT INTO pgbench_tellers SELECT g, 1, 0 FROM generate_series(1,10) g;
INSERT INTO pgbench_accounts SELECT g, 1, 0 FROM generate_series(1,100000) g;
BEGIN;
UPDATE pgbench_accounts SET abalance = abalance + 42 WHERE aid = 7;
SELECT abalance FROM pgbench_accounts WHERE aid = 7;
UPDATE pgbench_tellers SET tbalance = tbalance + 42 WHERE tid = 3;
UPDATE pgbench_branches SET bbalance = bbalance + 42 WHERE bid = 1;
INSERT INTO pgbench_history VALUES (3, 1, 7, 42, CURRENT_TIMESTAMP);
END;
-- pg_dump --snapshot idea: exported snapshot
BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT pg_export_snapshot(); COMMIT;
-- \dconfig equivalent: non-default settings
SELECT name, setting, source FROM pg_settings WHERE source <> 'default';
-- \gexec-style generated DDL
SELECT format('ANALYZE %I', relname) FROM pg_class WHERE relname LIKE 'pgbench_%' AND relkind = 'r';
```

### Pitfalls the docs explicitly warn about (with fixes)
- Restoring any dump, or upgrading, runs code of the source superusers' choice → inspect dumps from untrusted sources (`pg_restore --file`); trust source superusers before pg_upgrade.
- pg_dump is "generally not the right choice" for regular production backups → use physical backups and PITR (pg_basebackup + WAL archiving).
- Partial dumps (-n/-t/-e) don't include dependencies → no guarantee they restore into a clean database. Restore into a database created from `template0`.
- Parallel pg_dump fails if someone requests an exclusive lock mid-dump → avoid DDL during dumps; use `--lock-wait-timeout`.
- `pg_restore -1` on huge databases may exhaust the lock table → use `--transaction-size` of a few thousand objects.
- `-X fetch` backups fail if WAL is recycled first → raise `wal_keep_size` or use `-X stream` with a slot.
- pg_receivewal as a synchronous standby under `synchronous_commit = remote_apply` blocks commits → don't match `synchronous_standby_names`, or change `synchronous_commit`; use `--synchronous` if it is a sync standby.
- pg_receivewal without a slot may miss WAL; with a slot it may fill the server's disk → monitor the slot.
- pg_recvlogical `--endpos` may cut a transaction → the partial transaction is replayed next time.
- pg_combinebackup does not recompute page checksums → take a new full backup after changing checksum state.
- Changing checksums on one node of a block-copying replication setup corrupts checksums → switch all nodes consistently, or rebuild standbys.
- pg_resetwal is a last resort → dump, initdb and restore immediately afterwards; make no data changes first.
- pg_upgrade `--link`: after starting the new cluster the old one is unusable → use `--clone` or copy the old cluster first; revert before start by removing the `.old` suffix from `global/pg_control`.
- `vacuumdb --analyze-in-stages` on a database with stats temporarily worsens plans → add `--missing-stats-only`.
- `vacuumdb -j` with `-f` may deadlock on system catalogs.
- `pgbench -i` destroys existing `pgbench_*` tables; with `-c > -s` you measure branch-row update contention; runs of only seconds are meaningless.
- `psql -c 'a; b'` runs as one transaction; `-1` breaks with scripts containing their own BEGIN/COMMIT.
- Tab completion after BEGIN can send a query, so a later `SET TRANSACTION ISOLATION LEVEL` comes too late → disable completion or type carefully.
- `:foo` interpolation is unsafe → use `:'foo'` / `:"foo"`.
- initdb's default auth method is `trust` → set `-A`/`--auth-local`/`--auth-host`.
- `SIGKILL` on the postmaster leaks shared memory and semaphores; on a backend it forces a crash restart of all sessions → use pg_ctl or SIGTERM/SIGINT.
- Single-user mode does no automatic checkpoints or background processing, and provides no realistic locking → use only for repair.
