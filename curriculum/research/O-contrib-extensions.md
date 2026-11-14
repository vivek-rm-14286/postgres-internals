# O — Appendix F: Additional Supplied Modules and Extensions (every contrib module)

Source: PostgreSQL 18 docs, Appendix F (pages idx 1045-1114 of `_order.tsv`). All 70 pages read in full.

## Coverage ledger

| idx | file | one-line summary |
|---|---|---|
| 1045 | contrib.txt | Appendix F intro: building contrib, CREATE EXTENSION per database, list of 20 trusted extensions, non-extension modules |
| 1046 | amcheck.txt | bt_index_check / bt_index_parent_check / gin_index_check / verify_heapam, heapallindexed, locks, what checksums miss |
| 1047 | auth-delay.txt | Pause before reporting auth failure; auth_delay.milliseconds |
| 1048 | auto-explain.txt | Log plans of slow statements; 13 auto_explain.* GUCs |
| 1049 | basebackup-to-shell.txt | Example `shell` pg_basebackup target; command and required_role GUCs |
| 1050 | basic-archive.txt | Example archive module copying WAL segments to a directory |
| 1051 | bloom.txt | Bloom-filter index AM: length/colN params, benchmark vs btree, limitations |
| 1052 | btree-gin.txt | GIN opclasses with B-tree behaviour; multicolumn GIN use case |
| 1053 | btree-gist.txt | GiST opclasses with B-tree behaviour; `<>`, `<->` KNN, exclusion constraints |
| 1054 | citext.txt | Case-insensitive text type; behaviour, limitations, nondeterministic collations preferred |
| 1055 | cube.txt | Multidimensional cube type; operators, GiST/KNN, functions, 100-dimension limit |
| 1056 | dblink.txt | dblink overview, function list, wait events |
| 1057 | contrib-dblink-connect.txt | dblink_connect: persistent named/unnamed connections, dblink_fdw, security rules |
| 1058 | contrib-dblink-connect-u.txt | dblink_connect_u: insecure variant, revoked from PUBLIC |
| 1059 | contrib-dblink-disconnect.txt | dblink_disconnect |
| 1060 | contrib-dblink-function.txt | dblink(): remote query returning setof record, column definition list required |
| 1061 | contrib-dblink-exec.txt | dblink_exec: remote command, status string |
| 1062 | contrib-dblink-open.txt | dblink_open: remote cursor, implicit BEGIN |
| 1063 | contrib-dblink-fetch.txt | dblink_fetch: fetch rows from remote cursor |
| 1064 | contrib-dblink-close.txt | dblink_close: close cursor, implicit COMMIT |
| 1065 | contrib-dblink-get-connections.txt | dblink_get_connections: names of open named connections |
| 1066 | contrib-dblink-error-message.txt | dblink_error_message: last remote error |
| 1067 | contrib-dblink-send-query.txt | dblink_send_query: async dispatch |
| 1068 | contrib-dblink-is-busy.txt | dblink_is_busy: async status |
| 1069 | contrib-dblink-get-notify.txt | dblink_get_notify: LISTEN/NOTIFY over dblink |
| 1070 | contrib-dblink-get-result.txt | dblink_get_result: collect async results, extra empty-set call |
| 1071 | contrib-dblink-cancel-query.txt | dblink_cancel_query |
| 1072 | contrib-dblink-get-pkey.txt | dblink_get_pkey: primary key positions and names |
| 1073 | contrib-dblink-build-sql-insert.txt | dblink_build_sql_insert |
| 1074 | contrib-dblink-build-sql-delete.txt | dblink_build_sql_delete |
| 1075 | contrib-dblink-build-sql-update.txt | dblink_build_sql_update |
| 1076 | dict-int.txt | Example FTS dictionary for integers: maxlen, rejectlong, absval |
| 1077 | dict-xsyn.txt | Example extended synonym FTS dictionary: matchorig, matchsynonyms, keeporig, keepsynonyms, rules |
| 1078 | earthdistance.txt | Great-circle distances: cube-based `earth` domain and point-based `<@>` |
| 1079 | file-fdw.txt | FDW over server files/programs using COPY formats; options, privileges, csvlog example |
| 1080 | fuzzystrmatch.txt | soundex, daitch_mokotoff, levenshtein, metaphone, dmetaphone |
| 1081 | hstore.txt | Key/value type: syntax, operators, functions, subscripting, GiST/GIN/btree/hash indexes |
| 1082 | intagg.txt | Obsolete int_array_aggregate / int_array_enum wrappers |
| 1083 | intarray.txt | Null-free int[] functions/operators, query_int, gist__int_ops / gist__intbig_ops / gin__int_ops |
| 1084 | isn.txt | EAN13/ISBN/ISMN/ISSN/UPC types, casts, isn.weak |
| 1085 | lo.txt | `lo` domain over oid and lo_manage trigger to unlink orphaned large objects |
| 1086 | ltree.txt | ltree/lquery/ltxtquery, operators, functions, GiST signature opclasses |
| 1087 | pageinspect.txt | Raw page inspection: general, heap, B-tree, BRIN, GIN, GiST, hash functions |
| 1088 | passwordcheck.txt | Password strength check on CREATE/ALTER ROLE; min_password_length |
| 1089 | pgbuffercache.txt | pg_buffercache view, NUMA view, summary, usage counts, evict functions |
| 1090 | pgcrypto.txt | digest/hmac, crypt/gen_salt, PGP functions and options, raw encryption, random data |
| 1091 | pgfreespacemap.txt | pg_freespace: FSM values, 1/256 BLCKSZ granularity |
| 1092 | pglogicalinspect.txt | pg_get_logical_snapshot_meta / _info for serialized logical decoding snapshots |
| 1093 | pgoverexplain.txt | EXPLAIN (DEBUG) and EXPLAIN (RANGE_TABLE) |
| 1094 | pgprewarm.txt | pg_prewarm modes, autoprewarm worker and GUCs |
| 1095 | pgrowlocks.txt | pgrowlocks(): locked rows, lockers, modes |
| 1096 | pgstatstatements.txt | pg_stat_statements view (all columns), info view, reset function, GUCs, queryid semantics |
| 1097 | pgstattuple.txt | pgstattuple, pgstatindex, pgstatginindex, pgstathashindex, pg_relpages, pgstattuple_approx |
| 1098 | pgsurgery.txt | heap_force_kill / heap_force_freeze |
| 1099 | pgtrgm.txt | Trigram similarity functions, operators, thresholds, GiST/GIN opclasses, LIKE/regex support |
| 1100 | pgvisibility.txt | VM all-visible/all-frozen bits vs PD_ALL_VISIBLE; check and truncate functions |
| 1101 | pgwalinspect.txt | pg_get_wal_record_info / records_info / block_info / stats |
| 1102 | postgres-fdw.txt | postgres_fdw options, functions, connection and transaction management, pushdown rules |
| 1103 | seg.txt | seg interval type preserving precision; syntax, GiST operators |
| 1104 | sepgsql.txt | SELinux label-based MAC: install, GUCs, DML/DDL permissions, trusted procedures, limitations |
| 1105 | contrib-spi.txt | SPI example trigger extensions: refint, autoinc, insert_username, moddatetime |
| 1106 | sslinfo.txt | Client SSL certificate information functions |
| 1107 | tablefunc.txt | normal_rand, crosstab variants, crosstabN, connectby |
| 1108 | tcn.txt | triggered_change_notification trigger and NOTIFY payload format |
| 1109 | test-decoding.txt | Example logical decoding output plugin and its text output |
| 1110 | tsm-system-rows.txt | TABLESAMPLE SYSTEM_ROWS(n) |
| 1111 | tsm-system-time.txt | TABLESAMPLE SYSTEM_TIME(ms) |
| 1112 | unaccent.txt | Filtering FTS dictionary removing diacritics; rules file; unaccent() |
| 1113 | uuid-ossp.txt | UUID v1/v1mc/v3/v4/v5 generators and namespace constants |
| 1114 | xml2.txt | Deprecated XPath/XSLT functions; xpath_table |

## Notes by topic

### Appendix F overview: what contrib is, how modules are installed, trusted extensions  [M6, M1]  (source: contrib.txt)
- Appendix F = extensions and other server plug-in module libraries in `contrib/`; Appendix G = contrib utility programs. They are "not part of the core PostgreSQL system ... mainly because they address a limited audience or are too experimental".
- Not built automatically from source unless the `world` target is built. Build all: `make && make install` in `contrib/`; one module: same in its subdirectory. Tests: `make check` (before install) or `make installcheck` (against running server). Pre-packaged installs usually ship them as a subpackage such as `postgresql-contrib`.
- Most supply SQL objects packaged as extensions: `CREATE EXTENSION extension_name;` registers objects **in the current database only**; run in every DB needed, or in `template1` so later-created databases get it by default.
- `CREATE EXTENSION` must be run by a superuser **unless the extension is "trusted"**; trusted extensions can be installed by any user with `CREATE` privilege on the current database. "Generally, trusted extensions are ones that cannot provide access to outside-the-database functionality."
- Trusted in a default installation (exactly 20): `btree_gin`, `btree_gist`, `citext`, `cube`, `dict_int`, `fuzzystrmatch`, `hstore`, `intarray`, `isn`, `lo`, `ltree`, `pgcrypto`, `pg_trgm`, `seg`, `tablefunc`, `tcn`, `tsm_system_rows`, `tsm_system_time`, `unaccent`, `uuid-ossp`.
- `CREATE EXTENSION ... SCHEMA schema_name` places objects in a chosen schema (default: current creation target schema, which defaults to `public`).
- Some components are **not** extensions in this sense; they are loaded another way (e.g. `shared_preload_libraries`, `session_preload_libraries`, `LOAD`, `archive_library`): auth_delay, auto_explain, basebackup_to_shell, basic_archive, passwordcheck, pg_overexplain, sepgsql (library part), test_decoding (output plugin).

### amcheck — verify table and index consistency  [M4, M2, M7]  (source: amcheck.txt)
- Purpose: functions to verify the *logical consistency of the structure* of relations. B-Tree functions verify invariants (e.g. all B-Tree pages have items in "logical" order; if broken, binary searches on the page misguide index scans → wrong query answers). No error raised = structure appears valid. While running, `search_path` is temporarily set to `pg_catalog, pg_temp`.
- Verification uses the same procedures as index scans (possibly user-defined opclass code): B-Tree verification relies on B-Tree support function 1 (comparison) routines.
- B-Tree functions report corruption by **raising errors**; `verify_heapam` instead **returns a set of rows, one per corruption** (may still error if facilities it relies on are corrupt).
- Execute permission may be granted to non-superusers, but consider security: corruption messages could let an attacker infer data.
- `bt_index_check(index regclass, heapallindexed boolean, checkunique boolean) returns void`
  - Locks: `AccessShareLock` on index and its heap (same as plain SELECT). Usable on hot standby.
  - Does **not** verify invariants spanning child/parent relationships. With `heapallindexed => true` verifies presence of all heap tuples as index tuples. With `checkunique => true` checks that no more than one among duplicate entries in a unique index is visible.
  - Recommended lightweight production check ("best trade-off between thoroughness ... and limiting the impact").
  - Doc example query checks the 10 largest catalog btree indexes, filtering `c.relpersistence != 't'` (don't check other sessions' temp tables) and `c.relkind = 'i' AND i.indisready AND i.indisvalid` (function may error otherwise).
- `bt_index_parent_check(index regclass, heapallindexed boolean, rootdescend boolean, checkunique boolean) returns void`
  - Superset of bt_index_check: also checks parent/child invariants, including **no missing downlinks**. `rootdescend => true` re-finds each leaf tuple by a fresh search from the root page.
  - Locks: `ShareLock` on index and on heap → blocks INSERT/UPDATE/DELETE, VACUUM and all other utility commands. Lock held only while the function runs, not for the whole transaction.
  - **Cannot be used when hot standby mode is enabled** (read-only physical replicas), unlike bt_index_check.
  - More likely to catch incorrectly implemented opclasses or undiscovered nbtree bugs.
- `gin_index_check(index regclass) returns void` — checks a GIN index has consistent parent-child tuple relations (no parent tuples require tuple adjustment) and the page graph respects balanced-tree invariants (internal pages reference only leaf pages or only internal pages).
- Tip: bt_index_check / bt_index_parent_check emit progress at DEBUG1 and DEBUG2; `SET client_min_messages = DEBUG1;` to see it.
- `verify_heapam(relation regclass, on_error_stop boolean, check_toast boolean, skip text, startblock bigint, endblock bigint, blkno OUT bigint, offnum OUT integer, attnum OUT integer, msg OUT text) returns setof record`
  - Checks a table, sequence, or materialized view for *structural* corruption (invalidly formatted pages) and *logical* corruption (structurally valid pages inconsistent with the rest of the cluster).
  - `on_error_stop` (default false): stop at end of first block with any corruption.
  - `check_toast` (default false): check toasted values against the TOAST table. Slow; a corrupt toast table/index could conceivably crash the server.
  - `skip` (default `'none'`): `'all-visible'`, `'all-frozen'`, `'none'` — skip blocks so marked in the VM.
  - `startblock` / `endblock`: bounds (error if out of range). Default: whole table.
  - Output columns: `blkno` (block of the corrupt page), `offnum` (OffsetNumber of corrupt tuple), `attnum` (attribute number if column-specific), `msg`.
- heapallindexed verification mechanics: an extra phase that is a "dummy" `CREATE INDEX CONCURRENTLY`, checking each hypothetical new index tuple against a temporary in-memory summarizing structure (a Bloom-filter-like fingerprint of every tuple found in the target index, built during the first phase). Principle: an equivalent new index must only contain entries findable in the existing structure.
  - Verification typically takes several times longer; relation-level locks unchanged.
  - Structure bounded by `maintenance_work_mem`. ~**2 bytes of memory per tuple** gives ≤ **2% probability** of failing to detect an inconsistency per heap tuple; less memory → slowly increasing miss probability. Each run gives a fresh chance of detection.
- What amcheck catches that data checksums do not:
  1. Structural inconsistencies from incorrect operator class implementations — including OS collation rule changes (comparisons must be immutable). Commonly a primary/standby collation-order mismatch due to different OS major versions; usually only arises and is only detectable on the standby.
  2. Inconsistencies between indexes and heap (heapallindexed). There is no cross-checking of index vs heap in normal operation.
  3. Corruption from hypothetical bugs in AM code, sort code, or transaction management code.
  4. File system/storage faults when checksums are disabled. Note: amcheck examines the page as it is in shared buffers on a buffer hit, so it does not necessarily examine data read from disk at verification time; with checksums enabled, amcheck may raise a checksum-failure error when a corrupt block is read in.
  5. Faulty RAM. PostgreSQL does not protect against correctable memory errors; ECC assumed. heapallindexed greatly increases the chance of detecting single-bit errors (strict binary equality tested).
- Logical corruption examples undetectable by checksums: toasted values in the main table lacking a toast-table entry; tuples whose Transaction ID is older than the oldest valid XID in the database/cluster.
- "amcheck can only prove the presence of corruption; it cannot prove its absence." No amcheck corruption error should ever be a false positive.
- Repair: no general method. Seek root cause; `pageinspect` helps diagnose; **"A REINDEX may not be effective in repairing corruption."**

### auth_delay  [M1]  (source: auth-delay.txt)
- Pauses the server briefly before reporting authentication failure, to slow brute-force password attacks. Does nothing against DoS and may worsen it (waiting processes still consume connection slots).
- Must be loaded via `shared_preload_libraries`. GUC: `auth_delay.milliseconds` (integer, default `0`), must be set in postgresql.conf. Example: `auth_delay.milliseconds = '500'`.

### auto_explain — log execution plans of slow queries  [M4, M7]  (source: auto-explain.txt)
- No SQL-accessible functions. Load per session with `LOAD 'auto_explain';` (superuser), or via `session_preload_libraries` / `shared_preload_libraries`.
- **Default behaviour is to do nothing** — must set at least `auto_explain.log_min_duration`.
- All GUCs are superuser-only to change:

| GUC | type | default | meaning |
|---|---|---|---|
| `auto_explain.log_min_duration` | integer (ms) | `-1` (disabled) | minimum statement execution time to log the plan; `0` logs all plans |
| `auto_explain.log_parameter_max_length` | integer (bytes) | `-1` (log in full) | `0` disables logging parameter values; >0 truncates each value to that many bytes |
| `auto_explain.log_analyze` | boolean | off | log EXPLAIN ANALYZE output rather than EXPLAIN |
| `auto_explain.log_buffers` | boolean | off | = EXPLAIN BUFFERS; no effect unless log_analyze on |
| `auto_explain.log_wal` | boolean | off | = EXPLAIN WAL; no effect unless log_analyze on |
| `auto_explain.log_timing` | boolean | **on** | = EXPLAIN TIMING; no effect unless log_analyze on |
| `auto_explain.log_triggers` | boolean | off | include trigger execution statistics; no effect unless log_analyze on |
| `auto_explain.log_verbose` | boolean | off | = EXPLAIN VERBOSE |
| `auto_explain.log_settings` | boolean | off | print modified planner-affecting config options (those differing from built-in default) |
| `auto_explain.log_format` | enum | `text` | `text`, `xml`, `json`, `yaml` |
| `auto_explain.log_level` | enum | `LOG` | DEBUG5, DEBUG4, DEBUG3, DEBUG2, DEBUG1, INFO, NOTICE, WARNING, LOG |
| `auto_explain.log_nested_statements` | boolean | off | consider statements executed inside functions; off = only top-level plans |
| `auto_explain.sample_rate` | real | `1` | fraction of statements in each session to explain; for nested statements, all or none are explained |

- Caveat (Note): with `log_analyze` on, **per-plan-node timing occurs for all statements executed, whether or not they are slow enough to be logged** — "can have an extremely negative impact on performance". Turning off `auto_explain.log_timing` ameliorates this at the cost of less information.
- Typical config: `session_preload_libraries = 'auto_explain'` + `auto_explain.log_min_duration = '3s'`.
- Log output shape: `LOG:  duration: 3.651 ms  plan:` then `Query Text: ...` then the plan tree (PG18 shows `rows=92.00` fractional actual rows).

### basebackup_to_shell  [M7]  (source: basebackup-to-shell.txt)
- Adds a custom base backup target `shell`: `pg_basebackup --target=shell` or `--target=shell:DETAIL_STRING`; a server-admin-chosen command runs for each tar archive generated, receiving the archive on **standard input**. Primarily an example of adding backup targets via an extension module.
- Must be loaded via `shared_preload_libraries` or `local_preload_libraries`.
- `basebackup_to_shell.command` (string): `%f` → archive name (e.g. `base.tar`); `%d` → user-provided target detail (required if `%d` used, prohibited otherwise; alphanumeric only); `%%` → `%`; any other `%x` or trailing `%` is an error.
- `basebackup_to_shell.required_role` (string): role required to use the shell target; unset = any replication user.

### basic_archive  [M7]  (source: basic-archive.txt)
- Example archive module: copies completed WAL segment files to a directory. Loaded via `archive_library`, with `archive_mode` enabled.
- `basic_archive.archive_directory` (string): must already exist. Default empty string → effectively halts WAL archiving, but with archive_mode on the server accumulates WAL segments expecting a value soon.
- Config: `archive_mode = 'on'`, `archive_library = 'basic_archive'`, `basic_archive.archive_directory = '/path'`.
- Crashes may leave temp files prefixed `archtemp` in the archive directory; recommended to delete before restarting after a crash (safe to remove while running if unrelated to in-progress archiving).

### bloom — Bloom filter index access method  [M4]  (source: bloom.txt)
- An index AM based on Bloom filters: fast exclusion of non-matching tuples via **signatures** whose size is fixed at index creation. A signature is a lossy representation of the indexed attribute(s) → false positives → **results must always be rechecked against the heap**. Larger signatures → fewer false positives/useless heap visits but bigger, slower-to-scan index.
- Best when a table has many attributes and queries test arbitrary combinations. A btree is faster, but many btrees may be needed where one bloom index suffices. **Bloom supports only equality**; btree also supports inequality/range.
- `WITH` parameters:
  - `length`: signature (index entry) length in bits, rounded up to nearest multiple of 16. Default **80** bits, maximum **4096**.
  - `col1` … `col32`: number of bits generated for each index column. Default **2** bits, maximum **4095**. Params for unused columns are ignored. (So max 32 index columns.)
- Example: `CREATE INDEX bloomidx ON tbloom USING bloom (i1,i2,i3) WITH (length=80, col1=2, col2=2, col3=4);`
- Doc benchmark (10,000,000 rows, 6 int columns of random()*1000000; query `WHERE i2 = 898732 AND i5 = 123451`):
  - Seq Scan: 357 ms, `Buffers: shared hit=63744`.
  - 6-column btree `btreeidx` = **386 MB**; planner still picks Seq Scan (351 ms) because the condition doesn't constrain leading columns.
  - Bloom index on all 6 columns = **153 MB**; Bitmap Heap Scan 22.6 ms, `Rows Removed by Index Recheck: 2300`, `Heap Blocks: exact=2256`; the Bitmap Index Scan reads the whole index (`shared hit=19608`) — bloom search is a full index scan of signatures.
  - Six single-column btrees: each **88.5 MB**, total **531 MB** (>3x bloom); BitmapAnd of btreeidx5 and btreeidx2, 0.047 ms.
- Operator class interface: needs only a hash function for the type and an equality operator:
  `CREATE OPERATOR CLASS text_ops DEFAULT FOR TYPE text USING bloom AS OPERATOR 1 =(text, text), FUNCTION 1 hashtext(text);`
- Limitations: only opclasses for **int4 and text** are included; only `=` supported; no UNIQUE indexes; no searching for NULL values.

### btree_gin  [M4]  (source: btree-gin.txt)
- GIN operator classes with B-tree-equivalent behaviour for: `int2, int4, int8, float4, float8, timestamp with time zone, timestamp without time zone, time with time zone, time without time zone, date, interval, oid, money, "char", varchar, text, bytea, bit, varbit, macaddr, macaddr8, inet, cidr, uuid, name, bool, bpchar`, and all enum types. (Note: no `numeric`.)
- Will not outperform standard B-tree and **cannot enforce uniqueness**. Useful for GIN testing, as a base for other GIN opclasses, and — the practical case — a **multicolumn GIN index** mixing a GIN-indexable column with a B-tree-indexable column, which can beat two separate indexes combined by bitmap AND.
- Trusted. Example: `CREATE INDEX testidx ON test USING GIN (a); SELECT * FROM test WHERE a < 10;`

### btree_gist  [M4, M5]  (source: btree-gist.txt)
- GiST operator classes with B-tree-equivalent behaviour for: `int2, int4, int8, float4, float8, numeric, timestamp with time zone, timestamp without time zone, time with time zone, time without time zone, date, interval, oid, money, char, varchar, text, bytea, bit, varbit, macaddr, macaddr8, inet, cidr, uuid, bool` and all enum types.
- Will not outperform B-tree, cannot enforce uniqueness. Extra features:
  - Index support for `<>` ("not equals") — useful in exclusion constraints.
  - Distance operator `<->` with **KNN (nearest-neighbour) GiST support** for: int2, int4, int8, float4, float8, timestamp with time zone, timestamp without time zone, time without time zone, date, interval, oid, money.
  - Needed for multicolumn GiST indexes mixing GiST-only types with simple scalar types.
- By default builds the GiST index with sortsupport in **sorted mode** (much faster build); can revert to buffered build with the `buffering` index parameter.
- Trusted.
- Examples: `SELECT *, a <-> 42 AS dist FROM test ORDER BY a <-> 42 LIMIT 10;`
  Zoo exclusion constraint: `CREATE TABLE zoo (cage INTEGER, animal TEXT, EXCLUDE USING GIST (cage WITH =, animal WITH <>));` — inserting (123,'zebra') twice succeeds; (123,'lion') fails: `ERROR: conflicting key value violates exclusion constraint "zoo_cage_animal_excl"` / `DETAIL: Key (cage, animal)=(123, lion) conflicts with existing key (cage, animal)=(123, zebra).`

### citext — case-insensitive text type  [M2, M6]  (source: citext.txt)
- Type `citext`: internally calls `lower` when comparing; otherwise behaves almost exactly like `text`. Trusted.
- Tip: **consider nondeterministic collations instead** — they handle case-insensitive, accent-insensitive and more Unicode special cases correctly.
- Rationale vs `WHERE lower(col) = LOWER(?)`: verbose; no index use without a functional index on lower(); UNIQUE/PRIMARY KEY indexes are case-sensitive. citext allows a case-insensitive primary key. Locale-aware: case matching depends on the database's `LC_CTYPE`.
- Comparison: converts each string to lower case then compares normally; equal iff `lower()` gives identical results.
- citext-specific operator/function versions that match case-insensitively: `~`, `~*`, `!~`, `!~*`, LIKE operators `~~`, `~~*`, `!~~`, `!~~*`; functions `regexp_match()`, `regexp_matches()`, `regexp_replace()`, `regexp_split_to_array()`, `regexp_split_to_table()`, `replace()`, `split_part()`, `strpos()`, `translate()`. For case-sensitive: cast to `text`, or for regexp functions pass the `"c"` flag.
- Limitations:
  - Case folding depends on database `LC_CTYPE` (fixed at database creation); not truly case-insensitive per Unicode.
  - Since 9.1 a `COLLATE` can be attached; operators honour non-default COLLATE when comparing the folded strings, but the initial lower-casing always uses the database's LC_CTYPE (as though `COLLATE "default"`).
  - Less efficient than text (must copy and lower-case for comparisons); **only text supports B-Tree deduplication**. Slightly more efficient than using lower().
  - If both case-sensitive and case-insensitive searches are needed you need two indexes.
  - The schema containing the citext operators must be in `search_path` (typically public); otherwise the normal case-sensitive text operators are silently invoked.
  - Lower-casing doesn't handle some Unicode cases (one upper-case letter with two lower-case equivalents; case mapping vs case folding) — use nondeterministic collations.

### cube — multidimensional cube type  [M2, M4]  (source: cube.txt)
- Type `cube`; trusted. External representations: `x` or `(x)` = 1-D point; `x1,...,xn` or `(x1,...,xn)` = n-D point (zero-volume cube); `(x),(y)` or `[(x),(y)]` = 1-D interval; `(x1,...,xn),(y1,...,yn)` or bracketed = n-D cube by diagonally opposite corners. Corner order irrelevant (auto-swapped to "lower left — upper right"); when corners coincide only one corner is stored plus an "is point" flag. Whitespace ignored.
- Precision: stored as 64-bit floats (≈16 significant digits). Limit of **100 dimensions** (set in `cubedata.h`).
- Operators: `&&` overlap, `@>` contains, `<@` contained in, `cube -> integer` n-th coordinate (from 1), `cube ~> integer` (n = 2k-1 → lower bound of k-th dimension, n = 2k → upper bound; negative n = inverse value; designed for KNN-GiST), `<->` Euclidean distance, `<#>` taxicab (L-1), `<=>` Chebyshev (L-inf). Plus usual comparison operators (compare first coordinates, then second, ...) which exist mainly for a b-tree opclass (e.g. UNIQUE on a cube column).
- GiST opclass: supports `=`, `&&`, `@>`, `<@` in WHERE; KNN ordering with `<->`, `<#>`, `<=>` and `~>` in ORDER BY (e.g. `SELECT c FROM test ORDER BY c <-> cube(array[0.5,0.5,0.5]) LIMIT 1;`, `ORDER BY c ~> 1 LIMIT 5`, `ORDER BY c ~> 3 DESC LIMIT 5`).
- Functions: `cube(float8)`, `cube(float8, float8)`, `cube(float8[])`, `cube(float8[], float8[])`, `cube(cube, float8)`, `cube(cube, float8, float8)`, `cube_dim(cube)→integer`, `cube_ll_coord(cube, integer)`, `cube_ur_coord(cube, integer)`, `cube_is_point(cube)→boolean`, `cube_distance(cube, cube)`, `cube_subset(cube, integer[])`, `cube_union(cube, cube)`, `cube_inter(cube, cube)`, `cube_enlarge(c cube, r double, n integer)` (grow by radius r in at least n dims; negative shrinks; extra dims initialised to 0), also `cube_contains`.
- Defaults: in binary ops on differently-dimensioned cubes, the lower-dimensional one is treated as a Cartesian projection (zeroes for omitted coordinates).

### dblink — connect to other PostgreSQL databases from a session  [M6]  (source: dblink.txt, contrib-dblink-*.txt)
- Module supporting connections to other PostgreSQL databases from within a session. "See also postgres_fdw, which provides roughly the same functionality using a more modern and standards-compliant infrastructure." Not trusted.
- Wait events (type `Extension`): `DblinkConnect` (establishing a connection), `DblinkGetConnect` (establishing a connection when not found in the list of already-opened connections), `DblinkGetResult` (waiting to receive query results).
- **Connections**
  - `dblink_connect(text connstr) returns text`, `dblink_connect(text connname, text connstr) returns text` — persistent connection via a libpq connection string (e.g. `hostaddr=127.0.0.1 port=5432 dbname=mydb user=postgres password=mypasswd options=-csearch_path=`) **or the name of an existing foreign server** (recommended FDW: `dblink_fdw`). Multiple named connections may be open; only **one unnamed** connection (opening another replaces it). Persists until closed or session end. Returns `OK` always (errors are thrown).
  - `dblink_fdw` has Boolean option `use_scram_passthrough` (server or user mapping; user mapping overrides): uses SCRAM-hashed secrets instead of plain-text passwords, avoiding plain-text passwords in catalogs.
  - Only superusers may create connections that use neither password auth, SCRAM pass-through, nor GSSAPI. Otherwise: `ERROR: password is required / DETAIL: Non-superuser cannot connect if the server does not request a password. / HINT: Target server's authentication method must be changed.`
  - Security: add `options=-csearch_path=` to connstr when untrusted users exist. Avoid connection names containing `=` (confusable with connstrs).
  - `dblink_connect_u(...)` — identical but lets non-superusers connect using any auth method (impersonation / privilege-escalation risk: session appears to come from the OS user running the local server; passwords may come from the server's `~/.pgpass`). Installed with all privileges revoked from PUBLIC. Recommended: server user's `~/.pgpass` has no wildcard-host entries.
  - `dblink_disconnect() returns text`, `dblink_disconnect(text connname)` — returns `OK`.
  - `dblink_get_connections() returns text[]` — names of all open named connections, or NULL.
- **Synchronous execution**
  - `dblink(text connname, text sql [, bool fail_on_error]) returns setof record`; `dblink(text connstr, text sql [, bool fail_on_error])`; `dblink(text sql [, bool fail_on_error])`. With two text args the first is first looked up as a connection name; if not found it is treated as a connstr and a connection is made just for this command.
  - `fail_on_error` (default true): false → remote error reported locally as NOTICE and function returns no rows.
  - Returns `record` → caller **must supply a column definition list**: `SELECT * FROM dblink('dbname=mydb options=-csearch_path=', 'select proname, prosrc from pg_proc') AS t1(proname name, prosrc text) WHERE proname LIKE 'bytea%';`. Run-time error if column count differs; names need not match and types need not match exactly (returned strings must be valid input for the declared type). Tip: wrap in a view to bury the column types.
  - `dblink_exec(text connname, text sql [, bool fail_on_error]) returns text` (also connstr / unnamed forms) — for commands not returning rows; returns the command status string (e.g. `INSERT 943366 1`) or `ERROR` (when fail_on_error=false, with NOTICE).
- **Cursors**
  - `dblink_open([text connname,] text cursorname, text sql [, bool fail_on_error]) returns text` (OK/ERROR). Because a cursor only lives inside a transaction, **dblink_open issues BEGIN on the remote side** if not already in a transaction; the matching `dblink_close` (when it's the last open cursor on the connection) issues **COMMIT**. Pitfall: data changed by `dblink_exec` between open and close is lost if an error occurs or you `dblink_disconnect` before `dblink_close` (transaction aborted).
  - `dblink_fetch([text connname,] text cursorname, int howmany [, bool fail_on_error]) returns setof record` — next `howmany` rows forward. On column-count mismatch an error is thrown but the **remote cursor is still advanced**.
  - `dblink_close([text connname,] text cursorname [, bool fail_on_error]) returns text`.
- **Asynchronous**
  - `dblink_send_query(text connname, text sql) returns int` — 1 if dispatched, 0 otherwise; no async query may already be in progress on that connection.
  - `dblink_is_busy(text connname) returns int` — 1 busy / 0 not busy; 0 guarantees `dblink_get_result` won't block.
  - `dblink_get_result(text connname [, bool fail_on_error]) returns setof record` — waits if not complete. For commands returns one row, one text column with status string. **Must be called once for each query sent, plus one additional time to obtain an empty set**, before the connection is reusable (multi-statement strings yield one result per statement). Fetches the **entire** remote result before returning any (transient memory bloat) — prefer cursors, or plain `dblink()` which spools large results to disk.
  - `dblink_cancel_query(text connname) returns text` — `OK` if the cancel request was sent, else error text; not certain to succeed; must still complete the protocol (call dblink_get_result).
  - `dblink_error_message(text connname) returns text` — last error message or `OK`; with async queries call dblink_is_busy / dblink_get_result first so the error is visible.
  - `dblink_get_notify([text connname]) returns setof (notify_name text, be_pid int, extra text)` — must first `dblink_exec('LISTEN virtual')`.
- **SQL-building helpers (selective replication of a local table)**
  - `dblink_get_pkey(text relname) returns setof dblink_pkey_results` where `CREATE TYPE dblink_pkey_results AS (position int, colname text)`; `position` runs 1..N within the PK (not table column number).
  - `dblink_build_sql_insert(text relname, int2vector primary_key_attnums, integer num_primary_key_atts, text[] src_pk_att_vals_array, text[] tgt_pk_att_vals_array) returns text` — looks up the local row by src PK values (error if none), builds an INSERT with PK replaced by tgt values. e.g. `SELECT dblink_build_sql_insert('foo', '1 2', 2, '{"1", "a"}', '{"1", "b''a"}');` → `INSERT INTO foo(f1,f2,f3) VALUES('1','b''a','1')`.
  - `dblink_build_sql_delete(text relname, int2vector primary_key_attnums, integer num_primary_key_atts, text[] tgt_pk_att_vals_array) returns text` → `DELETE FROM "MyFoo" WHERE f1='1' AND f2='b'`.
  - `dblink_build_sql_update(...same 5 args as insert...) returns text` → `UPDATE foo SET f1='1',f2='b',f3='1' WHERE f1='1' AND f2='b'` (always assigns all fields).
  - `relname` is folded to lower case unless double-quoted. Since 9.0 `primary_key_attnums` are **logical** column numbers (position in `SELECT *`), not physical (differs when columns to the left were dropped).

### dict_int and dict_xsyn — example full-text search dictionary templates  [M6]  (source: dict-int.txt, dict-xsyn.txt)
- **dict_int** (trusted): controls indexing of integers to prevent excessive growth in number of unique words. Options: `maxlen` (max digits, default **6**), `rejectlong` (default false → return first maxlen digits; true → treat overlength integer as a stop word, so not indexed and not searchable), `absval` (default false; true strips leading `+`/`-` before maxlen applies). Creates template `intdict_template` and dictionary `intdict`. `ALTER TEXT SEARCH DICTIONARY intdict (MAXLEN = 4, REJECTLONG = true);` `select ts_lexize('intdict', '12345678');` → `{123456}`. `ALTER TEXT SEARCH CONFIGURATION english ALTER MAPPING FOR int, uint WITH intdict;`
- **dict_xsyn** (Extended Synonym Dictionary; NOT in trusted list): replaces words with groups of synonyms. Options: `matchorig` (default true), `matchsynonyms` (default false), `keeporig` (default true), `keepsynonyms` (default true), `rules` (base name of file in `$SHAREDIR/tsearch_data/`, must end `.rules`; lines `word syn1 syn2 syn3`; `#` comments; sample `xsyn_sample.rules`). Creates template `xsyn_template` and dictionary `xsyn`. `ALTER TEXT SEARCH DICTIONARY xsyn (RULES='my_rules', KEEPORIG=false);` `ts_lexize('xsyn','word')` → `{syn1,syn2,syn3}`; KEEPORIG=true → `{word,syn1,syn2,syn3}`; MATCHSYNONYMS=true lets `ts_lexize('xsyn','syn1')` match; `KEEPORIG=true, MATCHORIG=false, KEEPSYNONYMS=false` maps `syn1` → `{word}`. `ALTER TEXT SEARCH CONFIGURATION english ALTER MAPPING FOR word, asciiword WITH xsyn, english_stem;`

### earthdistance — great-circle distances  [M6]  (source: earthdistance.txt)
- Two approaches; Earth assumed perfectly spherical (PostGIS for accuracy). Requires `cube` (use `CREATE EXTENSION earthdistance CASCADE`). Not trusted. Caution: install earthdistance and cube in the same schema, one where untrusted users have no CREATE; search path should contain only trusted schemas.
- Cube-based: points stored as cubes with 3 coordinates (x, y, z distance from Earth's centre); domain `earth` over `cube` with constraint checks. Functions: `earth() → float8` (assumed radius, metres; change this function to change units — astronomers use `180/pi()` for degrees), `sec_to_gc(float8)`, `gc_to_sec(float8)`, `ll_to_earth(float8 lat, float8 lon) → earth`, `latitude(earth)`, `longitude(earth)`, `earth_distance(earth, earth) → float8`, `earth_box(earth, float8) → cube` (bounding box for indexed search with cube `@>`; lossy → add a second check with earth_distance).
- Point-based: `point <@> point → float8` distance in **statute miles**; points are **(longitude, latitude)**; units hard-wired (changing earth() has no effect); beware edge conditions near poles and ±180° longitude.

### file_fdw — read server-side files as foreign tables  [M6]  (source: file-fdw.txt)
- FDW `file_fdw`: reads data files in the server's file system, or executes programs on the server and reads their output; format must be readable by `COPY FROM`. **Read-only.** Not trusted.
- Foreign-table options: `filename` (relative paths are relative to the data directory) XOR `program` (stdout read as with `COPY FROM PROGRAM`; string executed by the shell — use a fixed command string); `format`, `header`, `delimiter`, `quote`, `escape`, `null`, `default`, `encoding`, `on_error`, `reject_limit`, `log_verbosity` — each same as the like-named COPY option. Unlike COPY, foreign-table option syntax always requires a value (pass `TRUE` for boolean options such as header).
- Column options: `force_not_null` (boolean; don't match column values against the null string; = COPY FORCE_NOT_NULL), `force_null` (boolean; values matching the null string are NULL even if quoted; = COPY FORCE_NULL). COPY's `FORCE_QUOTE` not supported.
- Options may only be given on the foreign table or its columns — not on the wrapper, server, or user mapping.
- Changing table-level options requires superuser or role `pg_read_server_files` (filename) / `pg_execute_server_program` (program).
- EXPLAIN shows the file name or program; for a file, unless `COSTS OFF`, the file size in bytes too.
- Example F.1 (CSV log as a table): `CREATE EXTENSION file_fdw; CREATE SERVER pglog FOREIGN DATA WRAPPER file_fdw; CREATE FOREIGN TABLE pglog (log_time timestamp(3) with time zone, user_name text, database_name text, process_id integer, connection_from text, session_id text, session_line_num bigint, command_tag text, session_start_time timestamp with time zone, virtual_transaction_id text, transaction_id bigint, error_severity text, sql_state_code text, message text, detail text, hint text, internal_query text, internal_query_pos integer, context text, query text, query_pos integer, location text, application_name text, backend_type text, leader_pid integer, query_id bigint) SERVER pglog OPTIONS ( filename 'log/pglog.csv', format 'csv' );` (26 csvlog columns in PG18).
- Example F.2: column option `rating text OPTIONS (force_null 'true')`.

### fuzzystrmatch — string similarity and distance  [M6]  (source: fuzzystrmatch.txt)
- Trusted. Caution: `soundex`, `metaphone`, `dmetaphone`, `dmetaphone_alt` **do not work well with multibyte encodings (UTF-8)**; use `daitch_mokotoff` or `levenshtein` for such data.
- Soundex: `soundex(text) returns text` (4-character code; not useful for non-English names); `difference(text, text) returns int` — number of matching Soundex code positions, 0 (no match) .. 4 (exact) — "misnamed; similarity would have been a better name". e.g. `SELECT * FROM s WHERE soundex(nm) = soundex('john');`, `WHERE difference(s.nm, 'john') > 2`.
- Daitch-Mokotoff Soundex: `daitch_mokotoff(source text) returns text[]` — code based on first **six** meaningful letters (not four); letters map to **ten** possible codes (not seven); two consecutive letters with a single sound coded as one number; multiple codes emitted when multiple pronunciations are plausible (hence array). Source should be a single word. Examples: `daitch_mokotoff('George')` → `{595000}`; `'John'` → `{160000,460000}`; `'Bierschbach'` → 8 codes `{794575,794574,794750,794740,745750,745740,747500,747400}`; `'Schwartzenegger'` → `{479465}`.
  - Match with array overlap `&&` and a GIN expression index: `CREATE INDEX ix_s_dm ON s USING gin (daitch_mokotoff(nm)) WITH (fastupdate = off); SELECT * FROM s WHERE daitch_mokotoff(nm) && daitch_mokotoff('Swartzenegger');`
  - Multi-name matching through FTS: SQL-standard-body functions `soundex_tsvector(v_name text) RETURNS tsvector BEGIN ATOMIC SELECT to_tsvector('simple', string_agg(array_to_string(daitch_mokotoff(n), ' '), ' ')) FROM regexp_split_to_table(v_name, '\s+') AS n; END;` and `soundex_tsquery` (`string_agg('(' || array_to_string(daitch_mokotoff(n), '|') || ')', '&')::tsquery`), index `USING gin (soundex_tsvector(nm))`, query `soundex_tsvector(nm) @@ soundex_tsquery('john public')`. To avoid recomputation during index rechecks use a stored generated column.
- Levenshtein: `levenshtein(source text, target text, ins_cost int, del_cost int, sub_cost int) returns int`; `levenshtein(source text, target text)` (costs default 1); `levenshtein_less_equal(source, target, ins_cost, del_cost, sub_cost, max_d int)`; `levenshtein_less_equal(source, target, max_d int)`. Strings non-null, **max 255 characters**. `levenshtein_less_equal` returns the correct distance if ≤ max_d, otherwise some value > max_d; negative max_d = same as levenshtein. Examples: `levenshtein('GUMBO','GAMBOL')` = 2; `levenshtein('GUMBO','GAMBOL',2,1,1)` = 3; `levenshtein_less_equal('extensive','exhaustive',2)` = 3; with max_d 4 → 4.
- Metaphone: `metaphone(source text, max_output_length int) returns text` (source ≤ 255 chars); `metaphone('GUMBO', 4)` → `KM`.
- Double Metaphone: `dmetaphone(source text) returns text` (primary), `dmetaphone_alt(source text) returns text` (alternate); no input length limit; `dmetaphone('gumbo')` → `KMP`.

### hstore — key/value type  [M2, M4, M6]  (source: hstore.txt)
- Type `hstore`: set of key/value pairs in a single value; keys and values are text strings. Trusted.
- Text representation: `k => v`, `foo => bar, baz => whatever`, `"1-a" => "anything at all"`. Pair order not significant (may not be reproduced). Whitespace around pairs/`=>` ignored. Double-quote keys/values containing whitespace, commas, `=` or `>`; backslash-escape `"` and `\`. Output always double-quotes keys and values.
- Keys are unique: `SELECT 'a=>1,a=>2'::hstore;` → `"a"=>"1"` (no guarantee which is kept). A value (not a key) may be SQL NULL (`key => NULL`, case-insensitive; `"NULL"` quoted is the string).
- Operators (Table F.6):
  - `hstore -> text → text` (value or NULL); `hstore -> text[] → text[]`
  - `hstore || hstore → hstore` (concatenate; right wins: `'a=>b, c=>d' || 'c=>x, d=>q'` → `"a"=>"b", "c"=>"x", "d"=>"q"`)
  - `hstore ? text → boolean` (contains key); `hstore ?& text[]` (all keys); `hstore ?| text[]` (any key)
  - `hstore @> hstore` (left contains right); `hstore <@ hstore`
  - `hstore - text`, `hstore - text[]`, `hstore - hstore` (delete key / keys / matching pairs)
  - `anyelement #= hstore → anyelement` (replace fields of a composite with matching values: `ROW(1,3) #= 'f1=>11'::hstore` → `(11,3)`)
  - `%% hstore → text[]` (alternating keys/values `{a,foo,b,bar}`); `%# hstore → text[]` (2-D `{{a,foo},{b,bar}}`)
- Functions (Table F.7): `hstore(record)`, `hstore(text[])` (key/value array or 2-D), `hstore(text[], text[])`, `hstore(text, text)`, `akeys(hstore)→text[]`, `skeys(hstore)→setof text`, `avals(hstore)→text[]`, `svals(hstore)→setof text`, `hstore_to_array(hstore)→text[]`, `hstore_to_matrix(hstore)→text[]`, `hstore_to_json(hstore)→json` (all non-null values become JSON strings; used implicitly for cast to json), `hstore_to_jsonb(hstore)→jsonb` (implicit cast to jsonb), `hstore_to_json_loose(hstore)→json` and `hstore_to_jsonb_loose(hstore)→jsonb` (numbers and booleans unquoted: `b=>t` → `true`, `d=>12345` → 12345, but `e=>012345` stays `"012345"`), `slice(hstore, text[])→hstore`, `each(hstore)→setof record(key text, value text)`, `exist(hstore, text)→boolean`, `defined(hstore, text)→boolean` (non-NULL value for key), `delete(hstore, text)`, `delete(hstore, text[])`, `delete(hstore, hstore)`, `populate_record(anyelement, hstore)→anyelement`.
- **Subscripting**: `SELECT h['a'] FROM mytable;` `UPDATE mytable SET h['c'] = 'new';` — single text subscript. Fetch returns NULL if subscript NULL or key missing; update fails if subscript NULL, otherwise replaces or adds the key. For multiple keys, concatenation `h || hstore(array['q','w'], array['11','12'])` is more efficient than subscripting.
- Indexes: GiST and GIN support `@>`, `?`, `?&`, `?|`. `CREATE INDEX hidx ON testhstore USING GIST (h);` / `USING GIN (h);`
  - `gist_hstore_ops` approximates the set of key/value pairs as a **bitmap signature**; optional integer param `siglen` = signature length in bytes, default **16**, valid **1..2024**. `CREATE INDEX hidx ON testhstore USING GIST (h gist_hstore_ops(siglen=32));` Longer = more precise, larger index.
  - btree and hash indexes for `=` (allows UNIQUE, GROUP BY, ORDER BY, DISTINCT; sort order "not particularly useful").
- Statistics idiom: `SELECT key, count(*) FROM (SELECT (each(h)).key FROM testhstore) AS stat GROUP BY key ORDER BY count DESC, key;`
- Compatibility: internal representation changed in 9.0; after binary upgrade old-format data is recognised with a slight penalty; force upgrade with `UPDATE tablename SET hstorecol = hstorecol || '';` or `ALTER TABLE tablename ALTER hstorecol TYPE hstore USING hstorecol || '';` (ACCESS EXCLUSIVE lock but no bloat from old row versions).
- Transforms: extensions `hstore_plperl`, `hstore_plperlu` (hstore ↔ Perl hash), `hstore_plpython3u` (hstore ↔ Python dict).

### intagg  [M3]  (source: intagg.txt)
- **Obsolete** compatibility wrapper. `int_array_aggregate(integer)` aggregate = wrapper around `array_agg`; `int_array_enum(integer[]) returns setof integer` = wrapper around `unnest`. Not in trusted list.
- Sample use: summary table for a many-to-many relation: `CREATE TABLE summary AS SELECT id_left, int_array_aggregate(id_right) AS rights FROM many_to_many GROUP BY id_left;` then `SELECT id_left, int_array_enum(rights) FROM summary WHERE id_left = item;` — fetches one row instead of an index scan + fetch per entry (doc anecdote: EXPLAIN cost 8488 → 329).

### intarray — null-free integer arrays  [M4, M2]  (source: intarray.txt)
- Trusted. All operations **error if the array contains any NULL elements**. Multi-dimensional input treated as linear in storage order.
- Functions (Table F.8): `icount(integer[])→integer`; `sort(integer[], dir text)` (dir `asc`/`desc`); `sort(integer[])`, `sort_asc(integer[])`; `sort_desc(integer[])`; `uniq(integer[])` (removes **adjacent** duplicates: `uniq('{1,2,2,3,1,1}')` → `{1,2,3,1}`; use `uniq(sort(...))`); `idx(integer[], item integer)→integer` (index of first match or 0); `subarray(integer[], start integer, len integer)`; `subarray(integer[], start integer)`; `intset(integer)→integer[]`.
- Operators (Table F.9): `&&` overlap, `@>` contains, `<@` contained; `# integer[]` (element count); `integer[] # integer` (idx); `integer[] + integer` (append), `integer[] + integer[]` (concat); `integer[] - integer` (remove matching), `integer[] - integer[]`; `integer[] | integer`, `integer[] | integer[]` (union); `integer[] & integer[]` (intersection); `integer[] @@ query_int` (array satisfies query); `query_int ~~ integer[]` (commutator).
- `&&`, `@>`, `<@` here are equivalent to the built-in array operators but only for null-free integer arrays, which makes them faster in many cases.
- Type `query_int`: integers combined with `&` (AND), `|` (OR), `!` (NOT), parentheses; e.g. `1&(2|3)`.
- Index support for `&&`, `@>`, `@@` and array equality:
  - GiST `gist__int_ops` (default; small-to-medium data sets): approximates an integer set as an **array of integer ranges**; param `numranges` max ranges per index key, default **100**, valid **1..253**.
  - GiST `gist__intbig_ops` (large data sets / many distinct array values): **bitmap signature**; param `siglen` bytes, default **16**, valid **1..2024**. Implementation is an **RD-tree** with built-in lossy compression.
  - GIN `gin__int_ops` (non-default): supports the same operators **plus `<@`**.
- Example: `CREATE INDEX message_rdtree_idx ON message USING GIST (sections gist__intbig_ops (siglen = 32));` `WHERE message.sections && '{1,2}'` (section 1 OR 2); `@> '{1,2}'` (1 AND 2); `@@ '1&2'::query_int`.
- Benchmark suite in `contrib/intarray/bench` (needs DBD::Pg): `create_test.pl | psql TEST; ./bench.pl`.

### isn — international standard numbers  [M2]  (source: isn.txt)
- Trusted. Types (Table F.10): `EAN13`, `ISBN13`, `ISMN13`, `ISSN13` (always EAN13 display format), `ISBN`, `ISMN`, `ISSN` (old short display format when possible, else 13 format), `UPC`. All share one internal representation — **a 64-bit integer** — and are interchangeable; multiple types exist for display formatting and tighter validation. Validated on input against a **hard-coded prefix list** (also used for hyphenation; may be out of date; only changeable by recompiling).
- UPC = subset of EAN13 (EAN13 without the first 0 digit). All UPC/ISBN/ISMN/ISSN are representable as EAN13.
- Casts: ISBN13<=>EAN13, ISMN13<=>EAN13, ISSN13<=>EAN13, ISBN<=>EAN13, ISMN<=>EAN13, ISSN<=>EAN13, UPC<=>EAN13, ISBN<=>ISBN13, ISMN<=>ISMN13, ISSN<=>ISSN13. Casting **from EAN13** has a run-time domain check (error if out of domain); others are relabelings.
- Standard comparison operators, B-tree and hash index support. Functions: `make_valid(isn)→isn` (clears invalid-check-digit flag), `is_valid(isn)→boolean`, `isn_weak(boolean)→boolean` and `isn_weak()→boolean` (backward compat; prefer the GUC).
- GUC `isn.weak` (boolean, default false): weak input mode accepts values with wrong check digit; stored with corrected check digit but displayed with trailing `!` (e.g. `0-11-000322-5!`). Can force a marked-invalid value outside weak mode by appending `!`. Writing `?` in place of the check digit auto-computes it (`INSERT INTO test VALUES('220500896?');`).
- Examples: `SELECT isbn('978-0-393-04002-9'); SELECT isbn13('0901690546'); SELECT issn('1436-4522'); SELECT upc(ean13('0220356483481')); SELECT ean13(upc('220356483481'));` — `isbn(ean13('0220356483481'))` does NOT work. `SELECT id FROM test WHERE NOT is_valid(id);`

### lo — large object management  [M2, M6]  (source: lo.txt)
- Trusted. Provides type `lo` (a **domain over `oid`**) and trigger function `lo_manage`.
- Rationale: JDBC/ODBC assume a BLOB referenced by a table entry is deleted when the entry changes; PostgreSQL treats large objects as independent objects referenced by OID (multiple references possible), so they become **orphans**. The trigger does `lo_unlink` whenever a referencing value is deleted or modified — assumes only one reference per large object.
- Usage: `CREATE TABLE image (title text, raster lo); CREATE TRIGGER t_raster BEFORE UPDATE OR DELETE ON image FOR EACH ROW EXECUTE FUNCTION lo_manage(raster);` One trigger per lo column; can restrict with `BEFORE UPDATE OF column_name`.
- Limitations: `DROP TABLE` and `TRUNCATE` still orphan objects (trigger not executed) — precede with `DELETE FROM table`. Run `vacuumlo` occasionally as a back-stop.

### ltree — hierarchical label-path type  [M2, M4, M6]  (source: ltree.txt)
- Trusted. **Label** = sequence of alphanumerics, underscores, hyphens (alphanumeric range depends on database locale; C locale: `A-Za-z0-9_-`); **max 1000 characters**. **Label path** = zero or more labels separated by dots (`Top.Countries.Europe.Russia`); **max 65535 labels**.
- Types:
  - `ltree` — stores a label path.
  - `lquery` — regex-like pattern that must match the **whole** path. `foo` (exact path foo), `*.foo.*` (any path containing label foo), `*.foo` (last label is foo). Quantifiers: `*{n}`, `*{n,}`, `*{n,m}`, `*{,m}` (= `*{0,m}`), `foo{n,m}`, `foo{,}`. Default: star = `{,}`; non-star = `{1}`. Modifiers at end of a non-star item: `@` case-insensitive (`a@` matches `A`), `*` prefix match (`foo*` matches `foobar`), `%` match initial underscore-separated words (`foo_bar%` matches `foo_bar_baz` but not `foo_barbaz`; `foo_bar%*` matches `foo1_bar2_baz` but not `foo1_br2_baz`). `|` (OR) between items; `!` (NOT) at the start of a non-star group; quantifier at end of group applies to the group.
    - Annotated: `Top.*{0,2}.sport*@.!football|tennis{1,}.Russ*|Spain` = begins with `Top`; then 0–2 labels; then a label with case-insensitive prefix `sport`; then one or more labels none matching football or tennis; then ends with a label beginning `Russ` or exactly `Spain`.
  - `ltxtquery` — full-text-search-like: words (with `@`, `*`, `%` modifiers) combined with `&`, `|`, `!`, parentheses; matches words **regardless of position** in the path. e.g. `Europe & Russia*@ & !Transportation`. ltxtquery allows whitespace between symbols; ltree and lquery do not.
- Comparison operators `=, <>, <, >, <=, >=` sort in tree-traversal order, children sorted by label text.
- Operators (Table F.12): `ltree @> ltree` (left is ancestor of right, or equal); `ltree <@ ltree` (descendant or equal); `ltree ~ lquery` / `lquery ~ ltree`; `ltree ? lquery[]` / `lquery[] ? ltree` (matches any); `ltree @ ltxtquery` / `ltxtquery @ ltree`; `ltree || ltree`, `ltree || text`, `text || ltree`; array forms `ltree[] @> ltree`, `ltree <@ ltree[]` (array contains an ancestor), `ltree[] <@ ltree`, `ltree @> ltree[]` (array contains a descendant), `ltree[] ~ lquery`, `lquery ~ ltree[]`, `ltree[] ? lquery[]`, `lquery[] ? ltree[]`, `ltree[] @ ltxtquery`, `ltxtquery @ ltree[]`; first-match returning ltree: `ltree[] ?@> ltree`, `ltree[] ?<@ ltree`, `ltree[] ?~ lquery`, `ltree[] ?@ ltxtquery` (NULL if none).
  - `^<@`, `^@>`, `^@`, `^~` = same but do not use indexes (testing only).
- Functions (Table F.13): `subltree(ltree, start integer, end integer)` (positions start..end-1, from 0: `subltree('Top.Child1.Child2', 1, 2)` → `Child1`); `subpath(ltree, offset integer, len integer)` (negative offset = from the end; negative len = leave that many off the end); `subpath(ltree, offset integer)`; `nlevel(ltree)→integer`; `index(a ltree, b ltree)→integer` (position of first occurrence of b in a, or -1; `index('0.1.2.3.5.4.5.6.8.5.6.8','5.6')` → 6); `index(a, b, offset integer)` (`..., '5.6', -4` → 9); `text2ltree(text)`; `ltree2text(ltree)`; `lca(ltree [, ltree [, ...]])` (longest common ancestor, up to **8** args; `lca('1.2.3','1.2.3.4.5.6')` → `1.2`); `lca(ltree[])`.
- Indexes:
  - B-tree over ltree: `<, <=, =, >=, >`. Hash over ltree: `=`.
  - GiST over ltree, opclass `gist_ltree_ops`: `<, <=, =, >=, >, @>, <@, @, ~, ?`. Approximates a set of path labels as a **bitmap signature**; param `siglen` bytes, default **8**; must be a positive multiple of int alignment (4 bytes on most machines) up to **2024**. `CREATE INDEX path_gist_idx ON test USING GIST (path gist_ltree_ops(siglen=100));`
  - GiST over ltree[], opclass `gist__ltree_ops`: `ltree[] <@ ltree`, `ltree @> ltree[]`, `@`, `~`, `?`. Default `siglen` **28** bytes. This index type is **lossy**.
- Example data (`contrib/ltree/ltreetest.sql`): 13 paths under `Top` (Science → Astronomy → Astrophysics/Cosmology; Hobbies → Amateurs_Astronomy; Collections → Pictures → Astronomy → Stars/Galaxies/Astronauts).
  - `WHERE path <@ 'Top.Science'` → 4 rows (subtree incl. itself). `WHERE path ~ '*.Astronomy.*'` → 7 rows. `WHERE path ~ '*.!pictures@.Astronomy.*'` → 3 rows. `WHERE path @ 'Astro*% & !pictures@'` → 4 rows (includes `Top.Hobbies.Amateurs_Astronomy` thanks to `%`); `'Astro* & !pictures@'` → 3 rows.
  - Path construction: `SELECT subpath(path,0,2)||'Space'||subpath(path,2) FROM test WHERE path <@ 'Top.Science.Astronomy';` → `Top.Science.Space.Astronomy...`; helper `CREATE FUNCTION ins_label(ltree, int, text) RETURNS ltree AS 'select subpath($1,0,$2) || $3 || subpath($1,$2);' LANGUAGE SQL IMMUTABLE;`
- Transform: `ltree_plpython3u` maps ltree → Python list (reverse not supported).

### pageinspect — low-level inspection of database pages  [M2, M4, M5, M7]  (source: pageinspect.txt)
- "All of these functions may be used only by superusers." Not trusted.

**General functions**
- `get_raw_page(relname text, fork text, blkno bigint) returns bytea` — reads the block and returns a copy as bytea: "a single time-consistent copy of the block". `fork` ∈ `'main'` (main data fork), `'fsm'` (free space map), `'vm'` (visibility map), `'init'` (initialization fork).
- `get_raw_page(relname text, blkno bigint) returns bytea` — shorthand for the main fork.
- `page_header(page bytea) returns record` — fields common to all heap and index pages, corresponding to `PageHeaderData` (`src/include/storage/bufpage.h`). Columns: **`lsn`, `checksum`, `flags`, `lower`, `upper`, `special`, `pagesize`, `version`, `prune_xid`**.
  - Example `SELECT * FROM page_header(get_raw_page('pg_class', 0));` → `lsn=0/24A1B50, checksum=0, flags=1, lower=232, upper=368, special=8192, pagesize=8192, version=4, prune_xid=0`. (special = 8192 = pagesize → heap page has no special space; page layout version is 4.)
  - `checksum` is the stored checksum (may be wrong if page corrupted); meaningless if data checksums are disabled.
- `page_checksum(page bytea, blkno bigint) returns smallint` — computes the checksum as if the page were located at the given block (**the checksum depends on the block number**). Compare to `page_header().checksum`; equal if data checksums are enabled.
- `fsm_page_contents(page bytea) returns text` — internal node structure of an FSM page: multiline string, one line per node of the binary tree within the page, only non-zero nodes printed, plus the "next" pointer (next slot to be returned from the page). `SELECT fsm_page_contents(get_raw_page('pg_class', 'fsm', 0));` See `src/backend/storage/freespace/README`.

**Heap functions**
- `heap_page_items(page bytea) returns setof record` — shows **all line pointers** on a heap page; for those in use, tuple headers and raw tuple data. **All tuples are shown, whether or not visible to any MVCC snapshot** when the raw page was copied (dead tuples included). See `src/include/storage/itemid.h` and `src/include/access/htup_details.h`.
  - The docs page does not print the column list. (Supplementary, not from this page — verify in the playground: `lp, lp_off, lp_flags, lp_len, t_xmin, t_xmax, t_field3, t_ctid, t_infomask2, t_infomask, t_hoff, t_bits, t_oid, t_data`.) The page itself confirms the names `t_data`, `t_infomask`, `t_infomask2`, `t_bits`, `t_ctid`.
- `tuple_data_split(rel_oid oid, t_data bytea, t_infomask integer, t_infomask2 integer, t_bits text [, do_detoast bool]) returns bytea[]` — splits tuple data into attributes the same way backend internals do; call with the heap_page_items output columns. `do_detoast` default false. `SELECT tuple_data_split('pg_class'::regclass, t_data, t_infomask, t_infomask2, t_bits) FROM heap_page_items(get_raw_page('pg_class', 0));`
- `heap_page_item_attrs(page bytea, rel_oid regclass [, do_detoast bool]) returns setof record` — like heap_page_items but returns raw tuple data as an array of attributes (optionally detoasted; default false).
- `heap_tuple_infomask_flags(t_infomask integer, t_infomask2 integer) returns record` — decodes into `raw_flags` and `combined_flags` (arrays of flag names). Combined flags are source-level macros spanning more than one raw bit, e.g. `HEAP_XMIN_FROZEN`. Usage: `SELECT t_ctid, raw_flags, combined_flags FROM heap_page_items(get_raw_page('pg_class', 0)), LATERAL heap_tuple_infomask_flags(t_infomask, t_infomask2) WHERE t_infomask IS NOT NULL OR t_infomask2 IS NOT NULL;`

**B-Tree functions**
- `bt_metap(relname text) returns record` — metapage. Columns: `magic` (340322), `version` (4), `root`, `level`, `fastroot`, `fastlevel`, `last_cleanup_num_delpages`, `last_cleanup_num_tuples`, `allequalimage`. Example for `pg_cast_oid_index`: root=1, level=0, fastroot=1, fastlevel=0, last_cleanup_num_delpages=0, last_cleanup_num_tuples=230, allequalimage=f.
- `bt_page_stats(relname text, blkno bigint) returns record` — Columns: `blkno`, `type` (e.g. `l` = leaf), `live_items`, `dead_items`, `avg_item_size`, `page_size`, `free_size`, `btpo_prev`, `btpo_next`, `btpo_level`, `btpo_flags`. Example: blkno 1, type l, live_items 224, dead_items 0, avg_item_size 16, page_size 8192, free_size 3668, btpo_prev 0, btpo_next 0, btpo_level 0, btpo_flags 3.
- `bt_multi_page_stats(relname text, blkno bigint, blk_count bigint) returns setof record` — same columns for each page in the range; negative `blk_count` = through the end of the index. Example shows sibling links: blkno 5 has btpo_prev 4 / btpo_next 6, blkno 6 has 5 / 7; 367 live items of 16 bytes, free_size 808.
- `bt_page_items(relname text, blkno bigint) returns setof record` and `bt_page_items(page bytea)` — Columns: **`itemoffset`, `ctid`, `itemlen`, `nulls`, `vars`, `data`, `dead`, `htid`, `tids`**.
  - Doc example (`tenk2_hundred`, block 5, a leaf): item 1 is the **high key** (`ctid (16,1)`, itemlen 16, data `30 00 00 00 00 00 00 00`, dead/htid/tids NULL); items 2–13 are **posting list tuples** (`ctid (16,8292)`, itemlen **616**, each storing a total of **100 6-byte TIDs**; `tids` is the posting list, `htid` the first heap TID).
  - On leaf pages `ctid` often stores a heap TID directly; for posting tuples it stores encoded info.
  - On internal pages the block-number part of `ctid` is a **downlink** (block number of another index page); the offset part stores encoded info such as the number of columns present (**suffix truncation** may have removed unneeded suffix columns). Truncated columns are treated as **"minus infinity"**.
  - `htid` = heap TID regardless of representation; NULL for internal-page tuples whose heap-TID column has been truncated away.
  - The first item on any **non-rightmost** page (`btpo_next` ≠ 0) is the page's **high key**: an upper bound on all items on the page; its ctid doesn't point to another block. On internal pages, the first real data item (first non-high-key item) has every column truncated away (no value in `data`) but a valid downlink in `ctid`.

**BRIN functions**
- `brin_page_type(page bytea) returns text` — e.g. `meta` (errors if not a valid BRIN page).
- `brin_metapage_info(page bytea) returns record` — Columns: `magic` (0xA8109CFA), `version` (1), `pagesperrange` (4 in example), `lastrevmappage` (2).
- `brin_revmap_data(page bytea) returns setof tid` — column `pages`: TIDs in a range map page, e.g. `(6,137)`, `(6,138)`...
- `brin_page_items(page bytea, index oid) returns setof record` — Columns: **`itemoffset`, `blknum`, `attnum`, `allnulls`, `hasnulls`, `placeholder`, `empty`, `value`** (BrinMemTuple / BrinValues structs, `src/include/access/brin_tuple.h`). Example values `{1 .. 88}`, `{89 .. 176}`, `{177 .. 264}` for blknum 0, 4, 8 (pagesperrange 4).

**GIN functions**
- `gin_metapage_info(page bytea) returns record` — Columns: `pending_head`, `pending_tail` (4294967295 = none), `tail_free_size`, `n_pending_pages`, `n_pending_tuples`, `n_total_pages`, `n_entry_pages`, `n_data_pages`, `n_entries`, `version` (2).
- `gin_page_opaque_info(page bytea) returns record` — Columns: `rightlink`, `maxoff`, `flags` (e.g. `{data,leaf,compressed}`).
- `gin_leafpage_items(page bytea) returns setof record` — data in a compressed GIN leaf (posting tree) page. Columns: `first_tid`, `nbytes`, `tids`.

**GiST functions**
- `gist_page_opaque_info(page bytea) returns record` — Columns: `lsn`, `nsn`, `rightlink`, `flags` (e.g. `{leaf}`).
- `gist_page_items(page bytea, index_oid regclass) returns setof record` — Columns: `itemoffset`, `ctid`, `itemlen`, `dead`, `keys` (decoded, e.g. `(p)=("(185,185),(1,1)")`; internal-page ctid like `(1,65535)` = downlink to block 1).
- `gist_page_items_bytea(page bytea) returns setof record` — Columns: `itemoffset`, `ctid`, `itemlen`, `dead`, `key_data` (raw bytea; no index needed).

**Hash functions**
- `hash_page_type(page bytea) returns text` — e.g. `metapage`.
- `hash_page_stats(page bytea) returns setof record` — for bucket or overflow page. Columns: `live_items`, `dead_items`, `page_size`, `free_size`, `hasho_prevblkno`, `hasho_nextblkno`, `hasho_bucket`, `hasho_flag`, `hasho_page_id` (65408 in example).
- `hash_page_items(page bytea) returns setof record` — Columns: `itemoffset`, `ctid`, `data` (the hash code, e.g. 1053474816).
- `hash_bitmap_info(index oid, blkno bigint) returns record` — status of the bitmap bit for an overflow page. Columns: `bitmapblkno`, `bitmapbit`, `bitstatus`.
- `hash_metapage_info(page bytea) returns record` — Columns: `magic` (105121344), `version` (4), `ntuples`, `ffactor`, `bsize`, `bmsize`, `bmshift`, `maxbucket`, `highmask`, `lowmask`, `ovflpoint`, `firstfree`, `nmaps`, `procid`, `spares`, `mapp`. Example: ntuples 500500, ffactor 40, bsize 8152, bmsize 4096, bmshift 15, maxbucket 12512, highmask 16383, lowmask 8191, ovflpoint 28, firstfree 1204, nmaps 1, procid 450.

### passwordcheck  [M1]  (source: passwordcheck.txt)
- Checks passwords whenever set with `CREATE ROLE` or `ALTER ROLE`; weak password → command fails with error. Enable: add `'$libdir/passwordcheck'` to `shared_preload_libraries`, restart. Can be built with CrackLib (uncomment two Makefile lines; not included by default for license reasons); otherwise "a few simple rules".
- Caution: clients often send **pre-encrypted** passwords, in which case the module can only try to guess the password → "not recommended if your security requirements are high"; prefer external auth such as GSSAPI.
- GUC `passwordcheck.min_password_length` (integer, bytes, default **8**, superuser-only; no effect on pre-encrypted passwords).

### pg_buffercache — inspect shared buffer cache  [M1, M2, M7]  (source: pgbuffercache.txt)
- Examine shared buffer cache in real time; plus low-level eviction for testing. Provides: `pg_buffercache_pages()` (wrapped in view `pg_buffercache`), `pg_buffercache_numa_pages()` (view `pg_buffercache_numa`), `pg_buffercache_summary()`, `pg_buffercache_usage_counts()`, `pg_buffercache_evict()`, `pg_buffercache_evict_relation()`, `pg_buffercache_evict_all()`.
- Permissions: views/summary/usage_counts restricted to superusers and roles with privileges of `pg_monitor` (GRANT-able). The three evict functions are **superuser only**.
- View `pg_buffercache` (Table F.14) — one row per shared buffer:

| column | type | description |
|---|---|---|
| `bufferid` | integer | ID, in the range 1..shared_buffers |
| `relfilenode` | oid (→ pg_class.relfilenode) | filenode number of the relation |
| `reltablespace` | oid (→ pg_tablespace.oid) | tablespace OID |
| `reldatabase` | oid (→ pg_database.oid) | database OID |
| `relforknumber` | smallint | fork number within the relation (see `common/relpath.h`) |
| `relblocknumber` | bigint | page number within the relation |
| `isdirty` | boolean | is the page dirty? |
| `usagecount` | smallint | clock-sweep access count |
| `pinning_backends` | integer | number of backends pinning this buffer |

  - Unused buffers: all fields NULL except `bufferid`. Shared system catalogs show as database **zero**.
  - Cache is shared across databases → when joining to `pg_class`, restrict to `reldatabase` = current DB OID or zero (otherwise missing/incorrect joins).
  - **No buffer manager locks are taken** to copy the state: less impact, but results are not consistent across all buffers (each buffer's row is self-consistent).
- View `pg_buffercache_numa` (Table F.15; new in 18): `bufferid integer`, `os_page_num bigint` (number of OS memory page for this buffer), `numa_node int`. Slow: NUMA inquiry requires pages to be paged in; first execution can take noticeable time; don't query at high frequency. Warning: touches all memory pages of the shared memory segment, forcing allocation (possibly all in a single NUMA node).
- `pg_buffercache_summary()` (Table F.16) → one row: `buffers_used int4`, `buffers_unused int4`, `buffers_dirty int4`, `buffers_pinned int4`, `usagecount_avg float8`. Much cheaper than the view; no locks (minor inaccuracies).
- `pg_buffercache_usage_counts()` (Table F.17) → `usage_count int4`, `buffers int4`, `dirty int4`, `pinned int4`; one row per possible usage count (sample output shows rows for 0..5 → usage count saturates at 5).
- `pg_buffercache_evict(bufferid)` → columns `buffer_evicted` (true on success; false if the buffer wasn't valid, was pinned, or became dirty again after an attempt to write it out) and `buffer_flushed` (true if flushed — not necessarily by us). Result immediately out of date. Developer testing only.
- `pg_buffercache_evict_relation(relation)` — tries to evict all buffers for all forks of the relation; returns number evicted, flushed, and number that could not be evicted.
- `pg_buffercache_evict_all()` — no argument; tries to evict every buffer; same three counts.
- Sample query (top relations by buffers):
  `SELECT n.nspname, c.relname, count(*) AS buffers FROM pg_buffercache b JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid) AND b.reldatabase IN (0, (SELECT oid FROM pg_database WHERE datname = current_database())) JOIN pg_namespace n ON n.oid = c.relnamespace GROUP BY n.nspname, c.relname ORDER BY 3 DESC LIMIT 10;`
- Sample summary: `buffers_used 248, buffers_unused 2096904, buffers_dirty 39, buffers_pinned 0, usagecount_avg 3.141129`.

### pg_freespacemap — examine the FSM  [M2, M7]  (source: pgfreespacemap.txt)
- Restricted to superusers and roles with privileges of `pg_stat_scan_tables` (GRANT-able).
- `pg_freespace(rel regclass IN, blkno bigint IN) returns int2` — free space on that page according to the FSM.
- `pg_freespace(rel regclass IN, blkno OUT bigint, avail OUT int2)` — set of `(blkno bigint, avail int2)`, one per page.
- FSM values are **not exact**: rounded to a precision of **1/256th of BLCKSZ (32 bytes with default BLCKSZ)**, and not kept fully up-to-date as tuples are inserted and updated.
- For **indexes**, what is tracked is entirely-unused pages, not free space within pages → values only mean in-use vs empty.
- Sample: `SELECT * FROM pg_freespace('foo');` → avail values 0, 32, 704, 1216, 3648 (all multiples of 32); `SELECT * FROM pg_freespace('foo', 7);` → 1216.

### pg_logicalinspect — inspect logical decoding snapshots  [M7]  (source: pglogicalinspect.txt)
- Inspect serialized logical snapshots of a running cluster (debugging/education). Restricted to superusers and members of `pg_read_server_files` (GRANT-able). Files live in `pg_logical/snapshots`; list with `pg_ls_logicalsnapdir()` (columns name, size, modification; e.g. `0-40796E18.snap`, 152 bytes).
- `pg_get_logical_snapshot_meta(filename text) returns record` → `magic` (1369563137), `checksum`, `version` (6). Errors if filename doesn't match a snapshot file.
- `pg_get_logical_snapshot_info(filename text) returns record` → `state` (e.g. `consistent`), `xmin`, `xmax`, `start_decoding_at` (LSN), `two_phase_at` (LSN), `initial_xmin_horizon`, `building_full_snapshot`, `in_slot_creation`, `last_serialized_snapshot` (LSN), `next_phase_at`, `committed_count`, `committed_xip` (xid[]), `catchange_count`, `catchange_xip` (e.g. `{751,752}`).
- Idiom: `SELECT ss.name, info.* FROM pg_ls_logicalsnapdir() AS ss, pg_get_logical_snapshot_info(ss.name) AS info;`

### pg_overexplain — extra EXPLAIN options (new in 18)  [M4]  (source: pgoverexplain.txt)
- Extends EXPLAIN with new options for planner debugging/development; output mirrors internal planner structs and may change whenever they do. Load: `LOAD 'pg_overexplain';` or via `session_preload_libraries` / `shared_preload_libraries`. No SQL objects.
- `EXPLAIN (DEBUG)`:
  - Per plan node (see `Plan` in `nodes/plannodes.h`): **Disabled Nodes** (raw counter; normal EXPLAIN shows a node as disabled when its count exceeds the sum of its children's counts), **Parallel Safe** (whether the node could appear beneath Gather/Gather Merge), **Plan Node ID** (unique per node; coordinates parallel query), **extParam** and **allParam** (numbered parameters affecting this node or its children; text mode shows only if non-empty).
  - Once per query (see `PlannedStmt`): **Command Type** (select, update, ...), **Flags** (true Boolean members among `hasReturning`, `hasModifyingCTE`, `canSetTag`, `transientPlan`, `dependsOnRole`, `parallelModeNeeded`), **Subplans Needing Rewind**, **Relation OIDs** (relations the plan depends on), **Executor Parameter Types** (type OID per executor parameter, e.g. nested-loop params; excludes prepared-statement parameters), **Parse Location** (`Unknown`, `NNN to end`, or `NNN for MMM bytes`).
- `EXPLAIN (RANGE_TABLE)`: range table entries correspond roughly to FROM items, with exceptions (unnecessary subqueries may be deleted; inheritance expansion adds child-table entries). Referenced by range table index (**RTI**). Per-node labels: `Scan RTI`, `Nominal RTI`, `Exclude Relation RTI`, `Append RTIs`. Per-query lists: `Unprunable RTIs`, `Result RTIs` (text mode: only if non-empty). Plus a dump of the entire range table: each entry labelled with RTI, kind (relation, subquery, join, ...) and fields such as `Eref` (all kinds) or `CTE Name` (only kind cte). See `RangeTblEntry` in `nodes/parsenodes.h`.

### pg_prewarm — preload relation data into caches  [M1, M7]  (source: pgprewarm.txt)
- Loads relation data into the OS buffer cache or PostgreSQL shared buffers. Manual via `pg_prewarm()`; automatic by adding `pg_prewarm` to `shared_preload_libraries` → a background worker periodically records the contents of shared buffers in file **`autoprewarm.blocks`** and, **using 2 background workers**, reloads those blocks after a restart.
- `pg_prewarm(regclass, mode text default 'buffer', fork text default 'main', first_block int8 default null, last_block int8 default null) RETURNS int8` — returns number of blocks prewarmed. first_block NULL = 0; last_block NULL = through last block.
  - Modes: `prefetch` (async prefetch requests to the OS; error if unsupported), `read` (synchronous read of the range; all platforms; may be slower), `buffer` (read into the database buffer cache).
  - Caveats: prewarming more than can be cached evicts lower-numbered blocks as higher ones are read; prewarmed data gets no protection from eviction; prewarming may evict other data → most useful at startup when caches are empty.
- `autoprewarm_start_worker() RETURNS void` — launch the main autoprewarm worker manually.
- `autoprewarm_dump_now() RETURNS int8` — update `autoprewarm.blocks` immediately; returns number of records written.
- GUCs: `pg_prewarm.autoprewarm` (boolean, default **on**, server start only); `pg_prewarm.autoprewarm_interval` (integer, default **300 seconds**; `0` = dump only at server shutdown).

### pgrowlocks — row-level lock information  [M5]  (source: pgrowlocks.txt)
- `pgrowlocks(text) returns setof record` — one row per **locked row** of the named table. Restricted to superusers, roles with privileges of `pg_stat_scan_tables`, and users with SELECT on the table.
- Output columns (Table F.21):

| name | type | description |
|---|---|---|
| `locked_row` | tid | TID of locked row |
| `locker` | xid | transaction ID of locker, or multixact ID if multitransaction |
| `multi` | boolean | true if locker is a multitransaction |
| `xids` | xid[] | transaction IDs of lockers (more than one if multitransaction) |
| `modes` | text[] | lock modes of lockers: an array of `For Key Share`, `For Share`, `For No Key Update`, `No Key Update`, `For Update`, `Update` |
| `pids` | integer[] | PIDs of locking backends |

- Takes `AccessShareLock` on the table and reads each row one by one (slow for large tables). Blocked by `ACCESS EXCLUSIVE`. Not a self-consistent snapshot. Doesn't show row contents; join: `SELECT * FROM accounts AS a, pgrowlocks('accounts') AS p WHERE p.locked_row = a.ctid;` (very inefficient).
- Sample: `(0,1) | 609 | f | {609} | {"For Share"} | {3161}`; `(0,3) | 607 | f | {607} | {"For Update"} | {3107}`.
- Teaching point: row locks are stored in the tuple (xmax/infomask), not in the shared lock table — which is why this module must scan the heap.

### pgcrypto — cryptographic functions  [M6]  (source: pgcrypto.txt)
- Trusted. Requires OpenSSL (not built/installed otherwise). With OpenSSL ≥ 3.0.0 the **legacy provider** must be activated in `openssl.cnf` for older ciphers like DES or Blowfish. Configure options affecting it: `--with-zlib`, `--with-ssl=openssl`.
- **General hashing**
  - `digest(data text, type text) returns bytea`; `digest(data bytea, type text) returns bytea`. Standard algorithms `md5, sha1, sha224, sha256, sha384, sha512` (plus any digest OpenSSL supports). Hex: `encode(digest($1, 'sha1'), 'hex')`.
  - `hmac(data text, key text, type text) returns bytea`; `hmac(data bytea, key bytea, type text)`. If key is larger than the hash block size it is hashed first.
- **Password hashing**: `crypt(password text, salt text) returns text` (crypt(3)-style) and `gen_salt(type text [, iter_count integer]) returns text`. Properties: slow; random salt; algorithm type embedded in the result; some adaptive.
  - Set: `UPDATE ... SET pswhash = crypt('new password', gen_salt('md5'));` Check: `SELECT (pswhash = crypt('entered password', pswhash)) AS pswmatch FROM ...;` (pass the stored hash as salt).
  - Table F.18 — crypt() algorithms:

| algorithm | max password length | adaptive? | salt bits | output length | description |
|---|---|---|---|---|---|
| `bf` | 72 | yes | 128 | 60 | Blowfish-based, variant 2a |
| `md5` | unlimited | no | 48 | 34 | MD5-based crypt |
| `xdes` | 8 | yes | 24 | 20 | Extended DES |
| `des` | 8 | no | 12 | 13 | Original UNIX crypt |
| `sha256crypt` | unlimited | yes | up to 32 | 80 | Unix crypt using SHA-256 |
| `sha512crypt` | unlimited | yes | up to 32 | 123 | Unix crypt using SHA-512 |

  - gen_salt types: `des, xdes, md5, bf, sha256crypt, sha512crypt`. Table F.19 iteration counts: `xdes` default 725, min 1, max 16777215 (must be **odd**); `bf` default 6, min 4, max 31; `sha256crypt`/`sha512crypt` default 5000, min 1000, max 999999999 (default 5000 "considered too low for modern hardware").
  - Guidance: slower than 4 hashes/sec dampens usability; faster than 100 hashes/sec is probably too fast.
  - Table F.20 speeds (Intel Mobile Core i3): crypt-bf/8 1792 hashes/sec (4 years for [a-z] 8 chars; 3927 years for [A-Za-z0-9]; 100k × md5); crypt-bf/7 3648 (2 years; 1929 years; 50k); crypt-bf/6 7168 (1 year; 982 years; 25k); crypt-bf/5 13504 (188 days; 521 years; 12.5k); crypt-md5 171584 (15 days; 41 years; 1k); crypt-des 23221568 (157.5 minutes; 108 days; 7); sha1 37774272 (90 minutes; 68 days; 4); md5 (hash) 150085504 (22.5 minutes; 17 days; 1).
- **PGP encryption** (encryption part of OpenPGP, RFC 4880; symmetric-key and public-key). Message = session-key packet + data packet encrypted with the session key.
  - Symmetric: password hashed with String2Key (S2K) (slow, salted, produces full-length binary key); either used directly as session key (default) or encrypts a random session key.
  - Public: new random session key encrypted with the public key.
  - Data processing: optional compression / UTF-8 conversion / line-ending conversion → prefix with a block of random bytes (equivalent to random IV) → append SHA-1 hash of prefix+data → encrypt with session key.
  - `pgp_sym_encrypt(data text, psw text [, options text]) returns bytea`; `pgp_sym_encrypt_bytea(data bytea, psw text [, options text]) returns bytea`
  - `pgp_sym_decrypt(msg bytea, psw text [, options text]) returns text`; `pgp_sym_decrypt_bytea(...) returns bytea` (decrypting bytea data with the text variant is disallowed)
  - `pgp_pub_encrypt(data text, key bytea [, options text]) returns bytea`; `pgp_pub_encrypt_bytea(data bytea, key bytea [, options text])` (secret key → error)
  - `pgp_pub_decrypt(msg bytea, key bytea [, psw text [, options text]]) returns text`; `pgp_pub_decrypt_bytea(...) returns bytea` (key = secret key; psw if password-protected; empty password to pass options)
  - `pgp_key_id(bytea) returns text` — key ID of a key, or of the key used for a message; special IDs `SYMKEY` (symmetric) and `ANYKEY` (key ID removed). Different keys may share an ID.
  - `armor(data bytea [, keys text[], values text[]]) returns text`; `dearmor(data text) returns bytea` (PGP ASCII armor = Base64 + CRC + formatting); `pgp_armor_headers(data text, key out text, value out text) returns setof record`.
  - Options string, GnuPG-like, e.g. `pgp_sym_encrypt(data, psw, 'compress-algo=1, cipher-algo=aes256')`. All except `convert-crlf` (and `ignore-cipher-failure`) apply only to encrypt functions:

| option | values | default | applies to |
|---|---|---|---|
| `cipher-algo` | bf, aes128, aes192, aes256, 3des, cast5 | aes128 | pgp_sym_encrypt, pgp_pub_encrypt |
| `compress-algo` | 0 none, 1 ZIP, 2 ZLIB (needs zlib build) | 0 | pgp_sym_encrypt, pgp_pub_encrypt |
| `compress-level` | 0, 1-9 | 6 | pgp_sym_encrypt, pgp_pub_encrypt |
| `convert-crlf` | 0, 1 (`\n`↔`\r\n`) | 0 | all four encrypt/decrypt |
| `disable-mdc` | 0, 1 (don't protect data with SHA-1) | 0 | pgp_sym_encrypt, pgp_pub_encrypt |
| `sess-key` | 0, 1 (separate session key) | 0 | pgp_sym_encrypt |
| `s2k-mode` | 0 no salt (dangerous), 1 salt + fixed iteration count, 3 variable iteration count | 3 | pgp_sym_encrypt |
| `s2k-count` | 1024 .. 65011712 | random between 65536 and 253952 | pgp_sym_encrypt, only with s2k-mode=3 |
| `s2k-digest-algo` | md5, sha1 | sha1 | pgp_sym_encrypt |
| `s2k-cipher-algo` | bf, aes, aes128, aes192, aes256 | use cipher-algo | pgp_sym_encrypt |
| `unicode-mode` | 0, 1 (convert to/from UTF-8 and tag) | 0 | pgp_sym_encrypt, pgp_pub_encrypt |
| `ignore-cipher-failure` | 0, 1 ("Dangerous!": ignore OpenSSL cipher failures to recover incorrectly-encrypted messages — historical behaviour prior to the fix for CVE-2026-14663; no key-holder guarantee) | 0 | pgp_sym_decrypt, pgp_pub_decrypt |

  - GnuPG key generation: `gpg --gen-key` (preferred type "DSA and Elgamal"); `gpg --list-secret-keys`; `gpg -a --export KEYID > public.key`; `gpg -a --export-secret-keys KEYID > secret.key`; `dearmor()` the keys first.
  - Limitations: no signing (so no check that the encryption subkey belongs to the master key); no encryption key as master key; no support for several subkeys.
- **Raw encryption** (discouraged: user key used directly as cipher key, no integrity checking, user manages IV, no text handling): `encrypt(data bytea, key bytea, type text) returns bytea`, `decrypt(...)`, `encrypt_iv(data bytea, key bytea, iv bytea, type text)`, `decrypt_iv(...)`. Type string `algorithm [ - mode ] [ /pad: padding ]`: algorithm `bf` (Blowfish) | `aes` (Rijndael-128/-192/-256); mode `cbc` (default) | `cfb` | `ecb` (testing only); padding `pkcs` (default, any length) | `none` (multiple of block size). `encrypt(data, 'fooz', 'bf')` ≡ `encrypt(data, 'fooz', 'bf-cbc/pad:pkcs')`. IV clipped or zero-padded to block size; defaults to all zeroes.
- **Random data**: `gen_random_bytes(count integer) returns bytea` (max **1024** bytes per call); `gen_random_uuid() returns uuid` (v4; **obsolete** — calls the core function of the same name).
- `fips_mode() returns boolean` — true if OpenSSL runs in FIPS mode.
- GUC `pgcrypto.builtin_crypto_enabled` (enum: `on` default, `off`, `fips`) — controls availability of `gen_salt()` and `crypt()`; `fips` disables them when OpenSSL is in FIPS mode. pgp_sym_encrypt/pgp_pub_encrypt unaffected.
- NULL handling: all functions return NULL if any argument is NULL ("may create security risks on careless usage").
- Security limitations: everything runs in the server, so data and passwords travel between client and pgcrypto **in clear text** → connect locally or use SSL, and trust the system and DB admin; otherwise do crypto in the client. Implementation does not resist side-channel attacks (decryption time varies among ciphertexts of a given size).

### pg_stat_statements — planning and execution statistics per statement  [M4, M7, M6]  (source: pgstatstatements.txt)
- Must be loaded via `shared_preload_libraries` (needs additional shared memory → restart to add/remove). Query identifier calculation must be enabled: automatic if `compute_query_id` is `auto` or `on`, or a third-party module computes query IDs.
- When active it tracks statistics across **all databases**; the views/functions exist only in databases where `CREATE EXTENSION pg_stat_statements` was run. Not trusted.
- View `pg_stat_statements`: one row per distinct combination of **database ID, user ID, query ID, and toplevel** (up to `pg_stat_statements.max`). Columns (Table F.22), in order:

| column | type | description |
|---|---|---|
| `userid` | oid (→ pg_authid.oid) | user who executed the statement |
| `dbid` | oid (→ pg_database.oid) | database in which executed |
| `toplevel` | bool | true if executed as a top-level statement (always true if track = top) |
| `queryid` | bigint | hash code identifying identical normalized queries |
| `query` | text | text of a representative statement |
| `plans` | bigint | times planned (0 unless track_planning) |
| `total_plan_time` | double precision | total planning time, ms (0 unless track_planning) |
| `min_plan_time` | double precision | min planning time, ms (0 if track_planning off, or after a minmax_only reset until planned again) |
| `max_plan_time` | double precision | max planning time, ms (same caveats) |
| `mean_plan_time` | double precision | mean planning time, ms |
| `stddev_plan_time` | double precision | population standard deviation of planning time, ms |
| `calls` | bigint | number of times executed |
| `total_exec_time` | double precision | total execution time, ms |
| `min_exec_time` | double precision | min execution time, ms (0 until first execution after a minmax_only reset) |
| `max_exec_time` | double precision | max execution time, ms (same) |
| `mean_exec_time` | double precision | mean execution time, ms |
| `stddev_exec_time` | double precision | population standard deviation of execution time, ms |
| `rows` | bigint | total rows retrieved or affected |
| `shared_blks_hit` | bigint | shared block cache hits |
| `shared_blks_read` | bigint | shared blocks read |
| `shared_blks_dirtied` | bigint | shared blocks dirtied |
| `shared_blks_written` | bigint | shared blocks written |
| `local_blks_hit` | bigint | local block cache hits |
| `local_blks_read` | bigint | local blocks read |
| `local_blks_dirtied` | bigint | local blocks dirtied |
| `local_blks_written` | bigint | local blocks written |
| `temp_blks_read` | bigint | temp blocks read |
| `temp_blks_written` | bigint | temp blocks written |
| `shared_blk_read_time` | double precision | time reading shared blocks, ms (needs track_io_timing, else 0) |
| `shared_blk_write_time` | double precision | time writing shared blocks, ms (track_io_timing) |
| `local_blk_read_time` | double precision | time reading local blocks, ms (track_io_timing) |
| `local_blk_write_time` | double precision | time writing local blocks, ms (track_io_timing) |
| `temp_blk_read_time` | double precision | time reading temp file blocks, ms (track_io_timing) |
| `temp_blk_write_time` | double precision | time writing temp file blocks, ms (track_io_timing) |
| `wal_records` | bigint | WAL records generated |
| `wal_fpi` | bigint | WAL full page images generated |
| `wal_bytes` | numeric | WAL generated, bytes |
| `wal_buffers_full` | bigint | number of times the WAL buffers became full |
| `jit_functions` | bigint | functions JIT-compiled |
| `jit_generation_time` | double precision | time generating JIT code, ms |
| `jit_inlining_count` | bigint | times functions have been inlined |
| `jit_inlining_time` | double precision | time inlining, ms |
| `jit_optimization_count` | bigint | times the statement has been optimized |
| `jit_optimization_time` | double precision | time optimizing, ms |
| `jit_emission_count` | bigint | times code has been emitted |
| `jit_emission_time` | double precision | time emitting code, ms |
| `jit_deform_count` | bigint | tuple deform functions JIT-compiled |
| `jit_deform_time` | double precision | time JIT-compiling tuple deform functions, ms |
| `parallel_workers_to_launch` | bigint | parallel workers planned to be launched |
| `parallel_workers_launched` | bigint | parallel workers actually launched |
| `stats_since` | timestamp with time zone | when statistics gathering started for this statement |
| `minmax_stats_since` | timestamp with time zone | when min/max statistics gathering started (min/max plan/exec time fields) |

  (52 columns.)
- Security: only superusers and roles with privileges of `pg_read_all_stats` see the SQL text and queryid of other users' queries; others still see the statistics.
- Normalization: plannable queries (SELECT, INSERT, UPDATE, DELETE, MERGE) and utility commands are combined into one entry when they have identical structure per an internal hash — typically semantically equivalent except for literal constants. Ignored constants are shown as parameter symbols `$1`...; the rest of the text is that of the **first** query with that queryid.
  - Constant-list squashing (PG18): `WHERE a IN (1,...,7)` and `IN (1,...,8)` merge into `SELECT * FROM test WHERE a IN ($1 /*, ... */)` with `calls | 2`.
  - Non-normalized constants may be observed with a high rate of entry deallocations → increase `pg_stat_statements.max`.
  - Small chance of hash collisions merging unrelated queries (never across different users or databases).
  - queryid is computed on the **post-parse-analysis** tree: identical texts can be separate entries (e.g. different `search_path`). It depends on internal OIDs: a function dropped and recreated → distinct entries; conversely a table dropped and recreated → may be considered the same; different table alias → distinct. Sensitive to machine architecture; **not stable across major versions**; generally stable across minor versions on the same architecture with matching catalog metadata. Physical (WAL-replay) replicas have identical queryids; logical replicas do not promise that.
  - Parameter symbols start after the highest `$n` in the original text; hidden parameters exist (PL/pgSQL `SELECT i + 1 INTO j` → `SELECT i + $2`).
  - Query texts live in an **external disk file**, not shared memory (arbitrarily long texts OK). If the file grows unmanageably, the module may discard texts: all existing entries show NULL `query` while statistics are preserved → reduce `pg_stat_statements.max`.
  - `plans` and `calls` need not match: each updated at the end of its phase and only on success (planned-then-failed → only planning stats; cached plan → only execution stats).
- View `pg_stat_statements_info` (single row; Table F.23): `dealloc bigint` (times entries about the least-executed statements were deallocated because more distinct statements than `pg_stat_statements.max` were observed), `stats_reset timestamp with time zone`.
- Functions:
  - `pg_stat_statements_reset(userid Oid, dbid Oid, queryid bigint, minmax_only boolean) returns timestamp with time zone` — discards stats matching the given userid/dbid/queryid; unspecified params default to 0 (invalid) = wildcard; no/all-zero params → discard everything (which also resets `pg_stat_statements_info`). `minmax_only` (default false) resets only min/max plan/exec times. Returns the reset time. Superuser-only by default (GRANT-able).
  - `pg_stat_statements(showtext boolean) returns setof record` — the view's underlying function; `showtext := false` returns NULL query text (for tools that cache texts; reduces physical I/O).
- GUCs:

| GUC | type | default | context / notes |
|---|---|---|---|
| `pg_stat_statements.max` | integer | 5000 | max statements tracked (rows in the view); least-executed discarded beyond that; server start only |
| `pg_stat_statements.track` | enum | `top` | `top` (issued directly by clients), `all` (also nested, e.g. inside functions), `none`; superuser |
| `pg_stat_statements.track_utility` | boolean | on | track utility commands (everything other than SELECT, INSERT, UPDATE, DELETE, MERGE); superuser |
| `pg_stat_statements.track_planning` | boolean | off | track planning operations and duration; may incur a noticeable penalty, esp. many concurrent connections running identical query structures competing to update few entries; superuser |
| `pg_stat_statements.save` | boolean | on | save stats across shutdowns; postgresql.conf or server command line only |

  - Shared memory proportional to `pg_stat_statements.max` is consumed whenever the module is loaded, even with `track = none`.
  - Typical config: `shared_preload_libraries = 'pg_stat_statements'`, `compute_query_id = on`, `pg_stat_statements.max = 10000`, `pg_stat_statements.track = all`.
- Sample query: `SELECT query, calls, total_exec_time, rows, 100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;` (pgbench `-c10 -t300`: `UPDATE pgbench_branches SET bbalance = bbalance + $1 WHERE bid = $2`, calls 3000, total_exec_time 25565.855387 ms). Reset one statement: `SELECT pg_stat_statements_reset(0,0,s.queryid) FROM pg_stat_statements AS s WHERE s.query = '...';` After a full reset the currently-running query appears with `calls | 0`.

### pgstattuple — tuple-level statistics (bloat measurement)  [M2, M7, M4]  (source: pgstattuple.txt)
- Access restricted: by default only role `pg_stat_scan_tables` has EXECUTE (superusers bypass); GRANT or add users to that role.
- `pgstattuple(regclass) returns record` (also legacy `pgstattuple(text)`, to be deprecated). Columns (Table F.24): `table_len bigint` (physical relation length, bytes), `tuple_count bigint` (live tuples), `tuple_len bigint` (total live tuple bytes), `tuple_percent float8`, `dead_tuple_count bigint`, `dead_tuple_len bigint`, `dead_tuple_percent float8`, `free_space bigint`, `free_percent float8`.
  - Example pg_proc: table_len 458752, tuple_count 1470, tuple_len 438896, tuple_percent 95.67, dead_tuple_count 11, dead_tuple_len 3157, dead_tuple_percent 0.69, free_space 8932, free_percent 1.95.
  - `table_len` is always greater than `tuple_len + dead_tuple_len + free_space`: the difference is fixed page overhead, the per-page line pointer table, and alignment padding.
  - Acquires only a read lock; results are not an instantaneous snapshot. A tuple is "dead" if **`HeapTupleSatisfiesDirty` returns false**. Always a full-table scan.
- `pgstatindex(regclass) returns record` (B-tree only; also legacy text form). Columns: `version integer` (B-tree version number), `tree_level integer` (level of the root page), `index_size bigint` (bytes), `root_block_no bigint` (0 if none), `internal_pages bigint`, `leaf_pages bigint`, `empty_pages bigint`, `deleted_pages bigint`, `avg_leaf_density float8`, `leaf_fragmentation float8`.
  - `index_size` normally = one more page than internal + leaf + empty + deleted, because of the **metapage**. Example pg_cast_oid_index: tree_level 0, index_size 16384, root_block_no 1, leaf_pages 1, avg_leaf_density 54.27, leaf_fragmentation 0. (Example prints `version | 2`.)
- `pgstatginindex(regclass) returns record` — `version integer`, `pending_pages integer` (pages in the pending list), `pending_tuples bigint`.
- `pgstathashindex(regclass) returns record` — `version integer`, `bucket_pages bigint`, `overflow_pages bigint`, `bitmap_pages bigint`, `unused_pages bigint`, `live_items bigint`, `dead_items bigint` (table text labels it `dead_tuples`; sample output column is `dead_items`), `free_percent float`.
- `pg_relpages(regclass) returns bigint` (and text form) — number of pages in the relation.
- `pgstattuple_approx(regclass) returns record` — faster, approximate. Algorithm:
  1. Skip pages whose VM all-visible bit is set (assumed to contain no dead tuples); for them take free space from the **FSM** and assume the rest is live tuples.
  2. For pages that can't be skipped, scan each tuple, recording presence/size and adding up the page free space.
  3. Estimate total live tuples from pages and tuples scanned (same way VACUUM estimates `pg_class.reltuples`).
  - Columns (Table F.25): `table_len bigint` (exact), `scanned_percent float8`, `approx_tuple_count bigint` (estimated), `approx_tuple_len bigint` (estimated), `approx_tuple_percent float8`, `dead_tuple_count bigint` (**exact**), `dead_tuple_len bigint` (exact), `dead_tuple_percent float8`, `approx_free_space bigint` (estimated), `approx_free_percent float8`. Free space may differ from pgstattuple because the FSM is not accurate to the byte.

### pg_surgery — last-resort heap surgery  [M5, M7, M2]  (source: pgsurgery.txt)
- "Unsafe by design": may corrupt or further corrupt the database — can make a table inconsistent with its indexes, cause UNIQUE/FOREIGN KEY violations, or make visible tuples that crash the server when read. Last resort only.
- `heap_force_kill(regclass, tid[]) returns void` — marks "used" line pointers as "dead" **without examining the tuples**; for forcibly removing inaccessible tuples. Scenario: `select * from t1 where ctid = '(0, 1)';` → `ERROR: could not access status of transaction 4007513275 / DETAIL: Could not open file "pg_xact/0EED": No such file or directory.` → `select heap_force_kill('t1'::regclass, ARRAY['(0, 1)']::tid[]);` → row gone.
- `heap_force_freeze(regclass, tid[]) returns void` — marks tuples frozen without examining tuple data; for tuples inaccessible or blocking vacuum due to corrupted visibility info. Scenario: `vacuum t1;` → `ERROR: found xmin 507 from before relfrozenxid 515 / CONTEXT: while scanning block 0 of relation "public.t1"` → `select heap_force_freeze('t1'::regclass, ARRAY['(0, 3)']::tid[]);` → afterwards `select ctid from t1 where xmin = 2;` returns `(0,3)` (xmin shown as **2 = FrozenTransactionId**).

### pg_trgm — trigram similarity and index support  [M4, M6]  (source: pgtrgm.txt)
- Trusted. A **trigram** = group of three consecutive characters. Similarity = count of shared trigrams.
- Extraction rules: non-word characters (non-alphanumerics) are ignored; each word is treated as having **two spaces prefixed and one space suffixed**. `cat` → `"  c"`, `" ca"`, `"cat"`, `"at "`. `foo|bar` → `"  f"`, `" fo"`, `"foo"`, `"oo "`, `"  b"`, `" ba"`, `"bar"`, `"ar "`.
- Functions (Table F.26):
  - `similarity(text, text) → real` — 0 (completely dissimilar) .. 1 (identical).
  - `show_trgm(text) → text[]` — all trigrams (debugging).
  - `word_similarity(text, text) → real` — greatest similarity between the trigram set of the first string and any **continuous extent of an ordered set of trigrams** in the second string. Does not pad the extent's boundaries, so extra characters in the second string aren't counted except for mismatched word boundaries. `word_similarity('word', 'two words')` = **0.8**: first set `{"  w"," wo","wor","ord","rd "}`; second ordered set `{"  t"," tw","two","wo ","  w"," wo","wor","ord","rds","ds "}`; best extent `{"  w"," wo","wor","ord"}`.
  - `strict_word_similarity(text, text) → real` — same but extent boundaries must match word boundaries (i.e. greatest similarity to any continuous extent of words). `strict_word_similarity('word','two words')` = **0.571429** = `similarity('word','words')`. Use strict for whole words, word_similarity for parts of words.
  - `show_limit() → real`, `set_limit(real) → real` — deprecated; use `SHOW/SET pg_trgm.similarity_threshold`.
- Operators (Table F.27):

| operator | returns | meaning |
|---|---|---|
| `text % text` | boolean | similarity > `pg_trgm.similarity_threshold` |
| `text <% text` | boolean | word similarity of first arg within second > `pg_trgm.word_similarity_threshold` |
| `text %> text` | boolean | commutator of `<%` |
| `text <<% text` | boolean | strict word similarity > `pg_trgm.strict_word_similarity_threshold` |
| `text %>> text` | boolean | commutator of `<<%` |
| `text <-> text` | real | distance = 1 − similarity() |
| `text <<-> text` | real | 1 − word_similarity() |
| `text <->> text` | real | commutator of `<<->` |
| `text <<<-> text` | real | 1 − strict_word_similarity() |
| `text <->>> text` | real | commutator of `<<<->` |

- GUCs (all real, between 0 and 1): `pg_trgm.similarity_threshold` default **0.3** (`%`); `pg_trgm.word_similarity_threshold` default **0.6** (`<%`, `%>`); `pg_trgm.strict_word_similarity_threshold` default **0.5** (`<<%`, `%>>`).
- Index support: GiST opclass `gist_trgm_ops` and GIN opclass `gin_trgm_ops` over text. Support the similarity operators plus trigram-based searches for **`LIKE`, `ILIKE`, `~`, `~*` and `=`**. Similarity comparisons are case-insensitive in a default build. **Inequality operators not supported.** May be less efficient than B-tree for equality.
  - `CREATE INDEX trgm_idx ON test_trgm USING GIST (t gist_trgm_ops);` or `USING GIN (t gin_trgm_ops);`
  - `gist_trgm_ops` approximates a trigram set as a **bitmap signature**; param `siglen` bytes, default **12**, valid **1..2024**: `USING GIST (t gist_trgm_ops(siglen=32))`.
  - Threshold query: `SELECT t, similarity(t, 'word') AS sml FROM test_trgm WHERE t % 'word' ORDER BY sml DESC, t;`
  - KNN: `SELECT t, t <-> 'word' AS dist FROM test_trgm ORDER BY dist LIMIT 10;` — efficient with **GiST but not GIN**; usually beats the first form when few closest matches are wanted. Likewise `'word' <<-> t` and `'word' <<<-> t` ordering (GiST only).
  - Word similarity: `WHERE 'word' <% t`, `WHERE 'word' <<% t`.
  - LIKE/ILIKE index search since 9.1 (`WHERE t LIKE '%foo%bar'`): trigrams extracted from the search string and looked up; more trigrams → more effective; pattern **need not be left-anchored** (unlike B-tree).
  - Regex (`~`, `~*`) since 9.3 (`WHERE t ~ '(foo|bar)'`): trigrams extracted from the regex.
  - Pitfall: a pattern with **no extractable trigrams degenerates to a full-index scan**.
- Text search integration (spelling suggestions): `CREATE TABLE words AS SELECT word FROM ts_stat('SELECT to_tsvector(''simple'', bodytext) FROM documents');` (simple config = unstemmed words) → `CREATE INDEX words_idx ON words USING GIN (word gin_trgm_ops);` → similarity query; also require similar length. The words table is static; regenerate periodically.

### pg_visibility — visibility map inspection  [M2, M5, M7]  (source: pgvisibility.txt)
- Three bits of page-level visibility:
  - **all-visible** bit in the VM: every tuple on the page is visible to every current and future transaction.
  - **all-frozen** bit in the VM: every tuple on the page is frozen; no future vacuum needs to modify the page until a tuple is inserted, updated, deleted, or locked on it.
  - **`PD_ALL_VISIBLE`** in the page header: same meaning as the VM all-visible bit but stored in the data page. Normally agree, but the page bit can be set while the VM bit is clear **after crash recovery**; they can also disagree due to a concurrent change between the two reads, or corruption.
- Functions that show PD_ALL_VISIBLE or check data blocks are much more costly (read data blocks rather than only the much smaller VM).
- Functions:
  - `pg_visibility_map(relation regclass, blkno bigint, all_visible OUT boolean, all_frozen OUT boolean) returns record` — VM bits for one block.
  - `pg_visibility(relation regclass, blkno bigint, all_visible OUT boolean, all_frozen OUT boolean, pd_all_visible OUT boolean) returns record` — plus PD_ALL_VISIBLE.
  - `pg_visibility_map(relation regclass, blkno OUT bigint, all_visible OUT boolean, all_frozen OUT boolean) returns setof record` — every block.
  - `pg_visibility(relation regclass, blkno OUT bigint, all_visible OUT boolean, all_frozen OUT boolean, pd_all_visible OUT boolean) returns setof record`.
  - `pg_visibility_map_summary(relation regclass, all_visible OUT bigint, all_frozen OUT bigint) returns record` — counts of all-visible and all-frozen pages per the VM.
  - `pg_check_frozen(relation regclass, t_ctid OUT tid) returns setof tid` — TIDs of non-frozen tuples in pages marked all-frozen; non-empty ⇒ **VM is corrupt**.
  - `pg_check_visible(relation regclass, t_ctid OUT tid) returns setof tid` — TIDs of non-all-visible tuples in pages marked all-visible; non-empty ⇒ VM corrupt.
  - `pg_truncate_visibility_map(relation regclass) returns void` — truncates the VM to force a rebuild; the first VACUUM afterwards scans every page and rebuilds it (until then queries treat the VM as all zeroes). **Superuser only.**
- Other functions: superusers and roles with privileges of `pg_stat_scan_tables`.

### pg_walinspect — WAL inspection via SQL  [M7]  (source: pgwalinspect.txt)
- SQL access to WAL contents of a running cluster; "similar to pg_waldump, but accessible through SQL". Uses the server's **current timeline ID**. Restricted to superusers and members of `pg_read_server_files` (GRANT-able).
- Note: functions take an LSN where a record of interest **begins**, but some functions such as `pg_logical_emit_message` return the LSN **after** the record just inserted.
- Tip: range functions accept an `end_lsn` after the server's current LSN without error; `FFFFFFFF/FFFFFFFF` (max valid pg_lsn) is equivalent to the current LSN.
- `pg_get_wal_record_info(in_lsn pg_lsn) returns record` — record at or after in_lsn (next valid record if in_lsn isn't a record start; error if none). Columns: `start_lsn`, `end_lsn`, `prev_lsn`, `xid`, `resource_manager`, `record_type`, `record_length`, `main_data_length`, `fpi_length`, `description`, `block_ref`.
  - Example: start_lsn 0/E419E28, end_lsn 0/E419E68, prev_lsn 0/E419D78, xid 0, resource_manager `Heap2`, record_type `VACUUM`, record_length 58, main_data_length 2, fpi_length 0, description `nunused: 5, unused: [1, 2, 3, 4, 5]`, block_ref `blkref #0: rel 1663/16385/1249 fork main blk 364`.
- `pg_get_wal_records_info(start_lsn pg_lsn, end_lsn pg_lsn) returns setof record` — one row per valid record, same columns. Example: `Standby` / `RUNNING_XACTS`, record_length 50, main_data_length 24, description `nextXid 33775 latestCompletedXid 33774 oldestRunningXid 33775`. Error if start_lsn is not available.
- `pg_get_wal_block_info(start_lsn pg_lsn, end_lsn pg_lsn, show_data boolean DEFAULT true) returns setof record` — one row per **block reference** per record. Columns: `start_lsn`, `end_lsn`, `prev_lsn`, `block_id`, `reltablespace`, `reldatabase`, `relfilenode`, `relforknumber`, `relblocknumber`, `xid`, `resource_manager`, `record_type`, `record_length`, `main_data_length`, `block_data_length`, `block_fpi_length`, `block_fpi_info`, `description`, `block_data`, `block_fpi_data`.
  - Example: block_id 0, reltablespace 1663, reldatabase 1, relfilenode 2658, relforknumber 0, relblocknumber 11, xid 341, `Btree` / `INSERT_LEAF`, record_length 64, main_data_length 2, block_data_length 16, block_fpi_length 0, description `off: 46`, block_data `\x00002a00070010402630000070696400`.
  - Unique on (`start_lsn`, `block_id`). Records with no block references (e.g. COMMIT) return no rows → may return fewer rows than pg_get_wal_records_info. `reltablespace`/`reldatabase`/`relfilenode` reference pg_tablespace.oid / pg_database.oid / pg_class.relfilenode; use `pg_filenode_relation` to find the relation. `show_data => false` omits `block_data` and `block_fpi_data` (NULL) for speed.
- `pg_get_wal_stats(start_lsn pg_lsn, end_lsn pg_lsn, per_record boolean DEFAULT false) returns setof record` — one row per resource_manager (or per record_type if per_record). Columns: `"resource_manager/record_type"`, `count`, `count_percentage`, `record_size`, `record_size_percentage`, `fpi_size`, `fpi_size_percentage`, `combined_size`, `combined_size_percentage`.

### postgres_fdw — foreign-data wrapper for remote PostgreSQL servers  [M6, M4, M5]  (source: postgres-fdw.txt)
- FDW `postgres_fdw`; overlaps the older `dblink` but with "more transparent and standards-compliant syntax" and often better performance. Not trusted.
- Setup steps: (1) `CREATE EXTENSION postgres_fdw`; (2) `CREATE SERVER` per remote database, with connection info **except user and password**; (3) `CREATE USER MAPPING` per local user, with remote `user` and `password`; (4) `CREATE FOREIGN TABLE` or `IMPORT FOREIGN SCHEMA`.
- Supports SELECT plus `INSERT`, `UPDATE`, `DELETE`, `COPY`, `TRUNCATE` on foreign tables. `ONLY` has no effect on the remote table.
- No support for `INSERT ... ON CONFLICT DO UPDATE`; `ON CONFLICT DO NOTHING` is supported only if the unique index inference specification is omitted (remote must be ≥ 9.5). Supports row movement by UPDATE on partitioned tables, except when the remote partition chosen for the moved row is also an UPDATE target partition updated elsewhere in the same command.
- Declare columns with exactly the same types and collations as remote (mismatch → "surprising semantic anomalies" because remote interprets conditions differently). A foreign table may have fewer columns or different order; **matching is by name, not position**.
- **Connection options**: server accepts libpq connection-string options except: `user`, `password`, `sslpassword` (user mapping or service file); `client_encoding` (set automatically from local server encoding); `application_name` (may be in the connection and/or GUC `postgres_fdw.application_name`; GUC overrides; escapes allowed); `fallback_application_name` (always `postgres_fdw`); `sslkey`/`sslcert` (connection and/or user mapping; mapping overrides; only superusers may set them on user mappings).
  - Non-superusers must use password authentication or GSSAPI delegated credentials. A superuser can set user-mapping option `password_required 'false'`: `ALTER USER MAPPING FOR some_non_superuser SERVER loopback_nopw OPTIONS (ADD password_required 'false');` — risk per CVE-2007-3278 / CVE-2007-6601; never set on the `public` role; mapped user could use client certs, `.pgpass`, `.pg_service.conf` of the OS user and peer/ident trust.
- **Object name options**: `schema_name` (foreign table; default = foreign table's schema name), `table_name` (foreign table; default = its name), `column_name` (column; default = column name).
- **Cost estimation options**:
  - `use_remote_estimate` (boolean; table or server, table overrides; default **false**) — issue remote `EXPLAIN` for cost estimates.
  - `fdw_startup_cost` (float; server; default **100**) — added to startup cost of any foreign scan (connection, remote parse/plan).
  - `fdw_tuple_cost` (float; server; default **0.2**) — extra per-tuple cost (data transfer).
  - With use_remote_estimate false, estimation is local and inaccurate unless local stats exist: `ANALYZE` on the foreign table scans the remote table and stores stats as for a local table (stale quickly if remote changes often).
  - `analyze_sampling` (string; table or server): `off` (transfer all, sample locally), `random` (remote sampling via `random()`; works on all versions), `system`, `bernoulli` (remote TABLESAMPLE; ≥ 9.5), `auto` (default; currently bernoulli or random depending on remote version).
- **Remote execution options**:
  - `extensions` (string; **server only**) — comma-separated list of extensions installed in compatible versions on both sides; their **immutable** functions/operators become shippable. User's responsibility that they behave identically.
  - `fetch_size` (integer; table or server; default **100**) — rows per fetch.
  - `batch_size` (integer; table or server; default **1**) — rows per insert operation. Batch runs as a single query; libpq limits a query to **65535 parameters**, so batch_size is reduced when columns × batch_size exceeds it. Also applies to COPY into foreign tables, capped at **1000**.
- **Asynchronous execution**: `async_capable` (boolean; table or server; default **false**) — run multiple parts of an `Append` concurrently. postgres_fdw opens only **one connection per foreign server** (per user mapping) and runs queries on it sequentially, so async over one server may just add overhead. With mixed sync/async subplans, async tuples aren't returned until at least one synchronous subplan has returned all its tuples.
- **Transaction management options** (server only): `parallel_commit` (boolean, default false), `parallel_abort` (boolean, default false) — commit/abort remote (sub)transactions in parallel instead of serially at local commit/abort; may hurt when one server has many remote transactions.
- **Updatability**: `updatable` (boolean; table or server; default **true**) — lets the error be thrown locally; `information_schema` reports per this option without checking remote. **Truncatability**: `truncatable` (boolean; table or server; default **true**).
- **Importing options** (in `IMPORT FOREIGN SCHEMA`): `import_collate` (default true; turn off if collation names differ, at severe risk of mismatch; remote-default-collation columns import as `COLLATE "default"` = local default), `import_default` (default **false**; beware `nextval()`; import fails if a default uses a function missing locally), `import_generated` (default true), `import_not_null` (default true). Constraints other than NOT NULL are never imported (CHECK semantics could differ). Partitions are imported only if explicitly named in `LIMIT TO`; otherwise excluded (access via the partitioned root).
- **Connection management options**: `keep_connections` (boolean; server only; default **on**; off → connections discarded at end of each transaction). `use_scram_passthrough` (boolean; server or user mapping; mapping overrides): uses SCRAM-hashed secrets instead of plain-text passwords. Requirements: remote must request `scram-sha-256`; remote may be any SCRAM-capable version; user mapping password unused; both servers must hold **identical SCRAM secrets** for the user (same salt and iterations, not merely same password); the incoming client connection to the FDW side must itself use SCRAM.
- **Functions**:
  - `postgres_fdw_get_connections(IN check_conn boolean DEFAULT false, OUT server_name text, OUT user_name text, OUT valid boolean, OUT used_in_xact boolean, OUT closed boolean, OUT remote_backend_pid int4) returns setof record` — open connections of this session. `server_name`/`user_name` NULL if server/mapping dropped while the connection remains (invalid); `user_name` is `public` for a public mapping; `valid` false = used in current transaction but server/mapping changed or dropped (closed at end of transaction); `closed` NULL unless check_conn (needs `POLLRDHUP`, e.g. Linux); `remote_backend_pid`. Roll back early if both `used_in_xact` and `closed` are true.
  - `postgres_fdw_disconnect(server_name text) returns boolean` — discards this session's connections to that server (may be several, one per user mapping); connections in use in the current transaction are kept with a warning; true if at least one disconnected; error if server unknown.
  - `postgres_fdw_disconnect_all() returns boolean`.
- **Connection lifecycle**: connection made during the first query using a foreign table of that server; kept and reused for the session; one connection per user mapping. Altering/dropping the server or mapping closes associated connections (after the current transaction if in use); re-established on demand.
- **Transaction semantics**:
  1. On first reference to a remote table, a remote transaction is opened if none corresponds to the current local transaction.
  2. Remote transaction commits/aborts when the local one does. Savepoints map to remote savepoints.
  3. Remote isolation level: **SERIALIZABLE if the local transaction is SERIALIZABLE; otherwise REPEATABLE READ** — so multiple remote scans in one query are snapshot-consistent. Consequence: successive queries in one local transaction see the same remote data even under **READ COMMITTED** locally ("might be surprising").
  4. **Two-phase commit of the remote transaction is not supported** (no atomic commit across servers).
- **Remote query optimization (pushdown)**:
  - WHERE clauses are shipped only if they use data types, operators and functions that are built-in or belong to an extension in the server's `extensions` option, and are **IMMUTABLE**. Only needed columns are fetched.
  - Whole `UPDATE`/`DELETE` is sent remotely ("direct modify") when: no unshippable WHERE clauses, no local joins, no row-level local BEFORE/AFTER triggers, no stored generated columns on the target, no `CHECK OPTION` constraints from parent views; and UPDATE target expressions use only built-in types and IMMUTABLE operators/functions.
  - Joins between foreign tables on the **same foreign server** are sent whole, unless estimated cheaper to fetch separately or the tables use different user mappings.
  - Inspect the remote SQL with **`EXPLAIN VERBOSE`**.
- **Remote session environment**: `search_path` = just `pg_catalog` (hazard for functions run by triggers/rules/views on the remote side → schema-qualify or attach `SET search_path`); `TimeZone` = `UTC`; `DateStyle` = `ISO`; `IntervalStyle` = `postgres`; `extra_float_digits` = `3` (remote ≥ 9.0) or `2` (older). Don't override these.
- **Cross-version**: remote servers back to **8.3**; read-only back to **8.1**. A built-in function newer than the remote may be shipped and fail ("function does not exist") → fence with a sub-SELECT with `OFFSET 0`.
- **Wait events** (type `Extension`): `PostgresFdwCleanupResult` (waiting for transaction abort on remote), `PostgresFdwConnect`, `PostgresFdwGetResult`.
- **GUC** `postgres_fdw.application_name` (string): overrides the server's application_name option; affects only newly established connections; truncated to less than NAMEDATALEN characters; non-printable-ASCII replaced with C-style hex escapes. Escapes: `%a` local application name, `%c` local session ID, `%C` local cluster name, `%u` local user name, `%d` local database name, `%p` local backend PID, `%%` literal %. No padding/alignment digits allowed. e.g. `'db=%d, user=%u'` → `'db=local_db, user=local_user'`.
- Example: `CREATE SERVER foreign_server FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host '192.83.123.89', port '5432', dbname 'foreign_db'); CREATE USER MAPPING FOR local_user SERVER foreign_server OPTIONS (user 'foreign_user', password 'password'); CREATE FOREIGN TABLE foreign_table (id integer NOT NULL, data text) SERVER foreign_server OPTIONS (schema_name 'some_schema', table_name 'some_table');`

### seg — line segments / floating-point intervals with preserved precision  [M2, M4]  (source: seg.txt)
- Trusted. Type `seg` represents an interval with uncertainty in its endpoints (laboratory measurements). Rationale: `select 6.50::float8` prints `6.5`, losing the recorded precision; `'6.25 .. 6.50'::seg` prints `6.25 .. 6.50`. Each value records its own precision.
- External representations (Table F.29): `x` (single value, zero-length interval); `x .. y`; `x (+-) delta` (x-delta to x+delta); `x ..` (open, lower bound x); `.. x` (open, upper bound x). Range operator may be `..` or `...`. Certainty indicators `<`, `>`, `~` may precede x and y (not delta); stored as a comment and **ignored by all operators**.
- Examples (Table F.30): `5.0` (point); `~5.0`, `<5.0`, `>5.0` (point, indicator preserved); `5(+-)0.3` → `4.7 .. 5.3` (the (+-) notation isn't preserved); `50 ..` (≥ 50); `.. 0` (≤ 0); `1.5e-2 .. 2E-2` → `0.015 .. 0.02`; `1 ... 2` = `1..2`.
- Because `...` is allowed, `0...23` would be ambiguous → **at least one digit is required before the decimal point** in seg input. Intervals with lower > upper (e.g. `5 .. 2`) are rejected.
- Precision: stored as **pairs of 32-bit floats**; more than 6 significant digits are truncated; 6 or fewer retain original precision (trailing zeroes are real; `0.0067` has 2 significant digits).
- GiST opclass operators (Table F.31): `<<` ([a,b] << [c,d] true if b < c), `>>` (a > d), `&<` (b <= d), `&>` (a >= c), `=`, `&&` (overlap), `@>` (contains), `<@` (contained in). Usual comparison operators compare (a) to (c), then (b) to (d) (useful for ORDER BY).
- Notes: `'10(+-)1'::seg` yields `9.0 .. 11` (should be `9 .. 11`) — (+-) conversion can add an extra digit when the interval includes a power of ten. R-tree index performance depends on initial input order; sort the table on the seg column (`sort-segments.pl`).

### sepgsql — SELinux label-based mandatory access control  [M1, M6]  (source: sepgsql.txt)
- Loadable module for label-based MAC based on SELinux policy. Warning: "significant limitations, and does not enforce mandatory access control for all actions."
- PostgreSQL acts as a user-space object manager: each table or function access by a DML query is checked against the system security policy **in addition to** normal SQL permission checks. Decisions use two security labels (subject and object), strings like `system_u:object_r:sepgsql_table_t:s0`. Labels assigned with `SECURITY LABEL`.
- Requirements: Linux 2.6.28+ with SELinux enabled, libselinux 2.1.10+, selinux-policy 3.9.13+. Build with `--with-selinux` (autoconf) or `-Dselinux={ auto | enabled | disabled }` (meson). Must be loaded via `shared_preload_libraries = 'sepgsql'` (no other way works), then run `sepgsql.sql` in each database, e.g. `for DBNAME in template0 template1 postgres; do postgres --single -F -c exit_on_error=true $DBNAME </usr/local/pgsql/share/contrib/sepgsql.sql >/dev/null; done`.
- Regression tests: run when `PG_TEST_EXTRA` contains `sepgsql`; manual run needs the `sepgsql-regtest` policy (`semodule`), `setsebool sepgsql_regression_test_mode on`, shell in `unconfined_t`, then `./test_sepgsql`.
- GUCs: `sepgsql.permissive` (boolean, default off; postgresql.conf / command line only; permissive mode regardless of system setting); `sepgsql.debug_audit` (boolean, default off; print audit messages regardless of policy — by default violations are logged, allowed accesses are not).
- Controlled object classes: labels on **schemas, tables, columns, sequences, views, functions**. Unlabeled objects are treated as `unlabeled_t`. Default label at creation is decided by policy from creator's label, parent object's label and optionally the object name; normally inherits the parent's label unless a type-transition rule applies. Parent: database for schemas; schema for tables/sequences/views/functions; table for columns.
- DML permissions: `db_table:select|insert|update|delete` on target tables; `db_table:select` also for tables whose columns are referenced in WHERE/RETURNING. Column-level `db_column:select|update|insert`. Example `UPDATE t1 SET x = 2, y = func1(y) WHERE z = 100;` → `db_column:update` on t1.x, `db_column:{select update}` on t1.y, `db_column:select` on t1.z, `db_table:{select update}` on t1. Sequences: `db_sequence:get_value` (not checked for `lastval()` etc.). Views: `db_view:expand`. Functions: `db_procedure:{execute}` (plus `db_procedure:{entrypoint}` for trusted procedures). Schemas: `db_schema:search` required (unqualified names skip schemas lacking it, like missing USAGE).
  - With sepgsql enabled, superusers are **prohibited** from modifying system catalogs with DML and from referencing/modifying toast tables.
- DDL permissions: `create` (plus `getattr` on the template for CREATE DATABASE; `add_name` on the parent schema; per-column create for tables; `install` for LEAKPROOF functions); `drop` (also for CASCADE; `remove_name` on the schema); `setattr` for ALTER (checked on the parent for indexes/triggers; moving schemas needs `remove_name` + `add_name`); `SECURITY LABEL` needs `relabelfrom` and `relabelto`.
- Trusted procedures (like SECURITY DEFINER / setuid): a function labelled e.g. `system_u:object_r:sepgsql_trusted_proc_exec_t:s0` runs with a different label. Example: column `customer.credit` labelled `sepgsql_secret_table_t`; `SELECT * FROM customer` → `ERROR: SELinux: security policy violation`; `show_credit(cid)` returns `1111-2222-3333-xxxx`.
- Dynamic domain transitions: `sepgsql_setcon()` switches the client label if policy grants `setcurrent` and `dyntransition`; only safe towards a smaller privilege set (example: MCS range `c0.c1023` → `c1.c4` allowed, widening back denied). Combined with trusted procedures this suits connection poolers (`sepgsql_setcon(NULL)` reverts).
- `LOAD` is rejected across the board.
- Functions (Table F.32): `sepgsql_getcon() → text`; `sepgsql_setcon(text) → boolean` (NULL = original domain); `sepgsql_mcstrans_in(text) → text`; `sepgsql_mcstrans_out(text) → text` (need the mcstrans daemon); `sepgsql_restorecon(text) → boolean` (initial labels for all objects in the current database; argument NULL or a specfile name).
- Limitations: some DDL operations unchecked; **DCL operations unchecked**; **no row-level access control**; covert channels (existence of objects can be inferred via PK conflicts, FK violations).

### spi — example SPI/trigger extensions (refint, autoinc, insert_username, moddatetime)  [M6]  (source: contrib-spi.txt)
- Each group is a separately installable extension; functions are general but table/column names are passed as trigger arguments.
- **refint**: `check_primary_key()` and `check_foreign_key()` — long superseded by built-in foreign keys; "**This module will be removed in PostgreSQL 20**". Requires a secure schema usage pattern and types whose equality operator is named `=`.
  - `check_primary_key()`: AFTER INSERT OR UPDATE trigger on the referencing table. Args: referencing column name(s), referenced table name, referenced column names. Referenced table/column args are copied as-is into generated SQL → must be double-quoted as needed; referencing column args must not be double-quoted. Example: `CREATE TRIGGER mytrigger AFTER INSERT OR UPDATE ON referencing_table FOR EACH ROW EXECUTE PROCEDURE check_primary_key ('column A', 'column B', 'myschema."referenced table"', '"column A"', '"column B"');`
  - `check_foreign_key()`: AFTER DELETE OR UPDATE trigger on the referenced table. Args: number of referencing tables, action (`cascade` delete referencing row, `restrict` abort, `setnull`), referenced key column names, then referencing table name and column names (repeated). Key columns should be NOT NULL with a unique index.
  - Pitfall: fired from another BEFORE trigger they can fail unexpectedly (the function won't see the row being inserted).
- **autoinc**: `autoinc()` BEFORE INSERT (or INSERT OR UPDATE) trigger storing a sequence's next value into an integer field **only if the value is zero or null**; if nextval is zero it is called again. Args: pairs of (integer column name, sequence name).
- **insert_username**: `insert_username()` BEFORE INSERT and/or UPDATE trigger storing the current user name in a text column (one arg).
- **moddatetime**: `moddatetime()` BEFORE UPDATE trigger storing the current time in a `timestamp` or `timestamp with time zone` column (one arg).

### sslinfo — client SSL certificate information  [M1, M6]  (source: sslinfo.txt)
- Functions return NULL (mostly) if the connection doesn't use SSL; some info also in view `pg_stat_ssl`. Builds only with `--with-ssl=openssl`. Not in the trusted list.
- `ssl_is_used() returns boolean`; `ssl_version() returns text` (TLSv1.0 .. TLSv1.3); `ssl_cipher() returns text` (e.g. `DHE-RSA-AES256-SHA`); `ssl_client_cert_present() returns boolean`; `ssl_client_serial() returns numeric` (serial + issuer uniquely identify a certificate); `ssl_client_dn() returns text` (e.g. `/CN=Somebody /C=Some country/O=Some organization`); `ssl_issuer_dn() returns text`; `ssl_client_dn_field(fieldname text) returns text`; `ssl_issuer_field(fieldname text) returns text`; `ssl_extension_info() returns setof record` (extension name, value, critical flag).
- Field names: `commonName` (CN), `surname` (SN), `name`, `givenName` (GN), `countryName` (C), `localityName` (L), `stateOrProvinceName` (ST), `organizationName` (O), `organizationalUnitName` (OU), `title`, `description`, `initials`, `postalCode`, `streetAddress`, `generationQualifier`, `dnQualifier`, `x500UniqueIdentifier`, `pseudonym`, `role`, `emailAddress`. Only `commonName` is mandatory.

### tablefunc — crosstab, connectby, normal_rand  [M3, M6]  (source: tablefunc.txt)
- Trusted. Functions returning tables; also examples of C set-returning functions.
- `normal_rand(numvals integer, mean float8, stddev float8) → setof float8` — Gaussian values: `SELECT * FROM normal_rand(1000, 5, 3);`
- `crosstab(sql text) → setof record` (and obsolete `crosstab(sql text, N integer)`, N ignored):
  - The source query must return exactly **row_name, category, value** columns.
  - Caller defines output columns: `SELECT * FROM crosstab('...') AS ct(row_name text, category_1 text, category_2 text);` — one row_name column (type of the first source column) followed by N value columns (all of the type of the third source column).
  - Algorithm: one output row per **consecutive group** of input rows with the same row_name; value columns filled **left to right**; too few rows → remaining columns NULL; too many → extra input rows skipped. **The category column is ignored** — it exists only to be ordered by. Always use `ORDER BY 1,2`.
  - Example: table `ct(id SERIAL, rowid TEXT, attribute TEXT, value TEXT)`; `SELECT * FROM crosstab('select rowid, attribute, value from ct where attribute = ''att2'' or attribute = ''att3'' order by 1,2') AS ct(row_name text, category_1 text, category_2 text, category_3 text);` → `test1 | val2 | val3 | (null)`, `test2 | val6 | val7 | (null)`.
  - See also psql `\crosstabview`.
- `crosstabN(sql text) → setof tablefunc_crosstab_N`: predefined `crosstab2`, `crosstab3`, `crosstab4` with `CREATE TYPE tablefunc_crosstab_N AS (row_name TEXT, category_1 TEXT, ... category_N TEXT)`. Custom wrappers: composite type + `CREATE OR REPLACE FUNCTION crosstab_float8_5_cols(text) RETURNS setof my_crosstab_float8_5_cols AS '$libdir/tablefunc','crosstab' LANGUAGE C STABLE STRICT;` or OUT parameters with `RETURNS setof record`.
- `crosstab(source_sql text, category_sql text) → setof record` (C function `crosstab_hash`): fixes the single-arg form's weakness (values go to the first free column regardless of category).
  - `source_sql`: row_name first; category and value are the **last two** columns; any columns between are "extra" (assumed equal within a row_name group; copied from the group's first row).
  - `category_sql`: exactly one column, at least one row, no duplicates (else error); its output order must match the output column order.
  - Output: first N-2 source columns, then one column per category (type of the source's last column). Values with a category not in category_sql are ignored; missing categories give NULL.
  - Use `ORDER BY 1` in source_sql; order within a group doesn't matter.
  - Example: `sales(year int, month int, qty int)` → `select * from crosstab('select year, month, qty from sales order by 1', 'select m from generate_series(1,12) m') as (year int, "Jan" int, "Feb" int, "Mar" int, "Apr" int, "May" int, "Jun" int, "Jul" int, "Aug" int, "Sep" int, "Oct" int, "Nov" int, "Dec" int);` → 2007 row has Jan 1000, Feb 1500, Jul 500, Nov 1500, Dec 2000; 2008 row has Jan 1000.
- `connectby(relname text, keyid_fld text, parent_keyid_fld text [, orderby_fld text ], start_with text, max_depth integer [, branch_delim text ]) → setof record` — hierarchical display (pre-recursive-CTE approach).
  - Parameters: source relation; key field; parent-key field; optional sibling ordering field; `start_with` key value (**always passed as text**); `max_depth` (0 = unlimited); optional branch delimiter.
  - Output columns: key, parent key (same type as the key field), `level int`, then `branch text` iff branch_delim given, then serial `int` iff orderby_fld given. `SELECT * FROM connectby('connectby_tree', 'keyid', 'parent_keyid', 'pos', 'row2', 0, '~') AS t(keyid text, parent_keyid text, level int, branch text, pos int);`
  - Table/field names are copied as-is into generated SQL (double-quote mixed case; schema-qualify). Poor performance without an index on the parent-key field. branch_delim must not appear in key values (false infinite-recursion error); default `~` is used for recursion detection even when not provided.
  - Example tree `connectby_tree(keyid text, parent_keyid text, pos int)` with row1..row9; from `row2`: row2 (level 0), row4 (1, `row2~row4`), row6 (2), row8 (3, `row2~row4~row6~row8`), row5 (1), row9 (2); with orderby `pos`, row5 comes before row4.

### tcn — triggered change notification  [M6]  (source: tcn.txt)
- Trusted. Trigger function `triggered_change_notification()`; must be an **AFTER** trigger **FOR EACH ROW**. Optional single argument = channel name (default `tcn`).
- Payload: table name, operation letter (`I`, `U`, `D`), then primary-key column name/value pairs, comma-separated; table and column names always in double quotes, values always in single quotes, embedded quotes doubled. Example: `"tcndata",I,"a"='1',"b"='2012-12-22'`.
- Example: `create trigger tcndata_tcn_trigger after insert or update or delete on tcndata for each row execute function triggered_change_notification(); listen tcn;` — an UPDATE of 2 rows sends 2 `U` notifications.

### test_decoding — example logical decoding output plugin  [M7]  (source: test-decoding.txt)
- Example output plugin: decodes WAL into text representations of operations; a starting point for writing your own.
- `SELECT * FROM pg_logical_slot_get_changes('test_slot', NULL, NULL, 'include-xids', '0');` → columns `lsn`, `xid`, `data`: `BEGIN`; `table public.data: INSERT: id[int4]:2 data[text]:'arg'`; `COMMIT`; `table public.data: DELETE: id[int4]:2`.
- In-progress transactions with option `'stream-changes', '1'`: `opening a streamed block for transaction TXN 503`, `streaming change for TXN 503`, `closing a streamed block for transaction TXN 503`.

### tsm_system_rows and tsm_system_time — extra TABLESAMPLE methods  [M3, M4]  (source: tsm-system-rows.txt, tsm-system-time.txt)
- Both trusted. Both do **block-level sampling** like built-in `SYSTEM` (not completely random; clustering effects, especially for small samples). **Neither supports `REPEATABLE`.**
- `SYSTEM_ROWS(n)`: integer = maximum number of rows to read; sample contains exactly that many rows unless the table has fewer. `SELECT * FROM my_table TABLESAMPLE SYSTEM_ROWS(100);`
- `SYSTEM_TIME(ms)`: floating-point = maximum milliseconds to spend reading; sample size unpredictable; returns whatever could be read in that time unless the whole table was read first. `SELECT * FROM my_table TABLESAMPLE SYSTEM_TIME(1000);`

### unaccent — accent-removing filtering dictionary  [M6]  (source: unaccent.txt)
- Trusted. A **filtering dictionary**: its output is always passed to the next dictionary (unlike normal dictionaries). Cannot be used as a normalizing dictionary for the thesaurus dictionary.
- Option `RULES`: base name of a file in `$SHAREDIR/tsearch_data/` ending `.rules`. Format: `accented<whitespace>unaccented` per line (e.g. `À A`, `Æ AE`); a line with one character deletes that character; each "character" may be any whitespace-free string; double quotes allow whitespace in the translation (`¼ " 1/4"`), a double quote is escaped by doubling. File must be UTF-8; lines untranslatable in the database encoding are silently ignored. Default `unaccent.rules` also expands ligatures.
- Installing creates text search template `unaccent` and dictionary `unaccent` (`RULES='unaccent'`). `ALTER TEXT SEARCH DICTIONARY unaccent (RULES='my_rules');` `select ts_lexize('unaccent','Hôtel');` → `{Hotel}`.
- Configuration: `CREATE TEXT SEARCH CONFIGURATION fr ( COPY = french ); ALTER TEXT SEARCH CONFIGURATION fr ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem;` → `to_tsvector('fr','Hôtels de la Mer')` = `'hotel':1 'mer':4`; `to_tsvector('fr','Hôtel de la Mer') @@ to_tsquery('fr','Hotels')` = t; `ts_headline` → `<b>Hôtel</b> de la Mer`.
- Function `unaccent([dictionary regdictionary, ] string text) returns text` — usable outside FTS; default dictionary is `unaccent` in the same schema as the function.

### uuid-ossp — UUID generators  [M2]  (source: uuid-ossp.txt)
- Trusted. "Only necessary for special requirements beyond what is available in core PostgreSQL." Standards (ITU-T X.667, ISO/IEC 9834-8:2005, RFC 4122) define versions 1, 3, 4, 5 (no version 2 algorithm).
- `uuid_generate_v1() → uuid` (MAC address + timestamp; reveals the machine and time); `uuid_generate_v1mc() → uuid` (random multicast MAC instead); `uuid_generate_v3(namespace uuid, name text) → uuid` (MD5 of name; reproducible, no random element; `SELECT uuid_generate_v3(uuid_ns_url(), 'http://www.postgresql.org');`); `uuid_generate_v4() → uuid` (entirely random); `uuid_generate_v5(namespace uuid, name text) → uuid` (like v3 with SHA-1; preferred over v3).
- Constants: `uuid_nil()`, `uuid_ns_dns()`, `uuid_ns_url()`, `uuid_ns_oid()` (ASN.1 OIDs, unrelated to PostgreSQL OIDs), `uuid_ns_x500()`.
- Building: `--with-uuid=bsd` | `--with-uuid=e2fs` (libuuid) | `--with-uuid=ossp`; configure does not choose automatically.

### xml2 — deprecated XPath/XSLT functions  [M6]  (source: xml2.txt)
- Deprecated since core SQL/XML support (8.3); planned for removal. Not in the trusted list.
- Functions (Table F.37): `xml_valid(document text) → boolean` (alias for `xml_is_well_formed()`); `xpath_string(document text, query text) → text`; `xpath_number(...) → real`; `xpath_bool(...) → boolean`; `xpath_nodeset(document, query, toptag, itemtag) → text` (also 3-arg without toptag, 2-arg without both); `xpath_list(document, query, separator) → text` (2-arg form uses `,`).
- `xpath_table(text key, text document, text relation, text xpaths, text criteria) returns setof record` — xpaths separated by `|`; criteria can't be omitted (use `true`); parameters are substituted into `SELECT <key>, <document> FROM <relation> WHERE <criteria>` → **SQL injection risk**. Must be used in FROM with an AS column list; extra XPaths ignored, extra columns NULL; result strings converted with type input functions (error on empty for non-text).
  - Multivalued results: row k holds the k-th result of each query; shorter result lists give NULLs, so a single-valued XPath appears only on the first row → join two xpath_table calls on the key.
- `xslt_process(text document, text stylesheet, text paramlist) returns text` (needs libxslt; paramlist `a=1,b=2`, values cannot contain commas; 2-arg form without params).

## Complete inventories

### Every Appendix F module (50)
Legend — Trusted: Y = in the docs' trusted list (installable by non-superusers with CREATE on the database). Kind: ext = CREATE EXTENSION; lib = loaded library with no SQL objects.

| # | module | kind / how loaded | trusted | purpose | key objects |
|---|---|---|---|---|---|
| F.1 | amcheck | ext | N | verify table/index structural consistency | bt_index_check, bt_index_parent_check, gin_index_check, verify_heapam |
| F.2 | auth_delay | lib, shared_preload_libraries | n/a | pause before reporting auth failure | auth_delay.milliseconds |
| F.3 | auto_explain | lib, LOAD / session_preload_libraries / shared_preload_libraries | n/a | log plans of slow statements | auto_explain.* GUCs |
| F.4 | basebackup_to_shell | lib, shared_preload_libraries or local_preload_libraries | n/a | example `shell` base backup target | basebackup_to_shell.command, .required_role |
| F.5 | basic_archive | lib, archive_library | n/a | example WAL archive module | basic_archive.archive_directory |
| F.6 | bloom | ext | N | Bloom-filter index access method | AM `bloom`, WITH (length, col1..col32) |
| F.7 | btree_gin | ext | Y | GIN opclasses with B-tree behaviour | opclasses for scalar types |
| F.8 | btree_gist | ext | Y | GiST opclasses with B-tree behaviour, `<>`, `<->` | opclasses, exclusion constraints |
| F.9 | citext | ext | Y | case-insensitive text type | type citext |
| F.10 | cube | ext | Y | multidimensional cube type | type cube, `<->` `<#>` `<=>` `~>`, cube_* functions |
| F.11 | dblink | ext | N | ad hoc connections to other PostgreSQL databases | dblink, dblink_connect, dblink_exec, dblink_open/fetch/close, dblink_send_query/get_result, dblink_fdw |
| F.12 | dict_int | ext | Y | example FTS dictionary for integers | intdict_template, intdict |
| F.13 | dict_xsyn | ext | N | example extended synonym FTS dictionary | xsyn_template, xsyn |
| F.14 | earthdistance | ext (requires cube) | N | great-circle distances | earth domain, ll_to_earth, earth_distance, earth_box, `<@>` |
| F.15 | file_fdw | ext | N | read server files / program output as foreign tables | FDW file_fdw; filename/program + COPY options |
| F.16 | fuzzystrmatch | ext | Y | string similarity/distance | soundex, difference, daitch_mokotoff, levenshtein, levenshtein_less_equal, metaphone, dmetaphone, dmetaphone_alt |
| F.17 | hstore | ext | Y | key/value type | type hstore, `->` `?` `?&` `?|` `@>` `||` `-` `#=`, gist_hstore_ops |
| F.18 | intagg | ext | N | obsolete integer aggregator/enumerator | int_array_aggregate, int_array_enum |
| F.19 | intarray | ext | Y | null-free int[] functions, operators, indexes | query_int, `@@`, gist__int_ops, gist__intbig_ops, gin__int_ops |
| F.20 | isn | ext | Y | product-number types | EAN13, ISBN13, ISMN13, ISSN13, ISBN, ISMN, ISSN, UPC; isn.weak |
| F.21 | lo | ext | Y | large object management | domain lo, trigger lo_manage |
| F.22 | ltree | ext | Y | hierarchical label paths | ltree, lquery, ltxtquery, gist_ltree_ops, gist__ltree_ops |
| F.23 | pageinspect | ext (superuser-only functions) | N | raw page inspection | get_raw_page, page_header, heap_page_items, bt_*, brin_*, gin_*, gist_*, hash_* |
| F.24 | passwordcheck | lib, shared_preload_libraries | n/a | password strength check | passwordcheck.min_password_length |
| F.25 | pg_buffercache | ext | N | shared buffer cache inspection/eviction | pg_buffercache, pg_buffercache_numa, pg_buffercache_summary, _usage_counts, _evict, _evict_relation, _evict_all |
| F.26 | pgcrypto | ext | Y | cryptographic functions | digest, hmac, crypt, gen_salt, pgp_sym_*/pgp_pub_*, encrypt/decrypt, gen_random_bytes |
| F.27 | pg_freespacemap | ext | N | examine the FSM | pg_freespace |
| F.28 | pg_logicalinspect | ext | N | inspect logical decoding snapshots | pg_get_logical_snapshot_meta, pg_get_logical_snapshot_info |
| F.29 | pg_overexplain | lib, LOAD / preload | n/a | extra EXPLAIN options | EXPLAIN (DEBUG), EXPLAIN (RANGE_TABLE) |
| F.30 | pg_prewarm | ext + optional shared_preload_libraries | N | preload relation data; autoprewarm | pg_prewarm, autoprewarm_start_worker, autoprewarm_dump_now |
| F.31 | pgrowlocks | ext | N | row lock information | pgrowlocks |
| F.32 | pg_stat_statements | ext + shared_preload_libraries (required) | N | per-statement planning/execution stats | pg_stat_statements, pg_stat_statements_info, pg_stat_statements_reset |
| F.33 | pgstattuple | ext | N | tuple-level statistics / bloat | pgstattuple, pgstattuple_approx, pgstatindex, pgstatginindex, pgstathashindex, pg_relpages |
| F.34 | pg_surgery | ext | N | last-resort heap surgery | heap_force_kill, heap_force_freeze |
| F.35 | pg_trgm | ext | Y | trigram similarity and indexes | similarity, word_similarity, `%`, `<->`, gist_trgm_ops, gin_trgm_ops |
| F.36 | pg_visibility | ext | N | visibility map inspection | pg_visibility_map, pg_visibility, pg_visibility_map_summary, pg_check_frozen, pg_check_visible, pg_truncate_visibility_map |
| F.37 | pg_walinspect | ext | N | WAL inspection via SQL | pg_get_wal_record_info, pg_get_wal_records_info, pg_get_wal_block_info, pg_get_wal_stats |
| F.38 | postgres_fdw | ext | N | FDW for remote PostgreSQL servers | FDW postgres_fdw, postgres_fdw_get_connections, postgres_fdw_disconnect(_all) |
| F.39 | seg | ext | Y | interval type preserving precision | type seg, GiST opclass |
| F.40 | sepgsql | lib, shared_preload_libraries + sepgsql.sql | n/a | SELinux label-based MAC | SECURITY LABEL provider, sepgsql_getcon, sepgsql_setcon, sepgsql_restorecon |
| F.41 | spi (refint, autoinc, insert_username, moddatetime) | 4 separate exts | N | example SPI triggers | check_primary_key, check_foreign_key, autoinc, insert_username, moddatetime |
| F.42 | sslinfo | ext | N | client SSL certificate info | ssl_is_used, ssl_version, ssl_cipher, ssl_client_dn, ssl_client_dn_field, ssl_extension_info |
| F.43 | tablefunc | ext | Y | pivot and hierarchy table functions | crosstab, crosstabN, connectby, normal_rand |
| F.44 | tcn | ext | Y | change notification trigger | triggered_change_notification |
| F.45 | test_decoding | output plugin (named when creating a logical slot) | n/a | example logical decoding output plugin | text output via pg_logical_slot_get_changes |
| F.46 | tsm_system_rows | ext | Y | TABLESAMPLE SYSTEM_ROWS | SYSTEM_ROWS(n) |
| F.47 | tsm_system_time | ext | Y | TABLESAMPLE SYSTEM_TIME | SYSTEM_TIME(ms) |
| F.48 | unaccent | ext | Y | accent-removing filtering dictionary | template/dictionary unaccent, unaccent() |
| F.49 | uuid-ossp | ext | Y | UUID generation | uuid_generate_v1, v1mc, v3, v4, v5; uuid_ns_* |
| F.50 | xml2 | ext | N | deprecated XPath/XSLT | xpath_string, xpath_table, xslt_process |

Related extra extensions named in the slice: `hstore_plperl`, `hstore_plperlu`, `hstore_plpython3u`, `ltree_plpython3u` (transforms), and FDW `dblink_fdw`.

### Every GUC defined in this slice
| GUC | default | notes |
|---|---|---|
| `auth_delay.milliseconds` | 0 | postgresql.conf |
| `auto_explain.log_min_duration` | -1 | ms; 0 = all |
| `auto_explain.log_parameter_max_length` | -1 | bytes; 0 = none |
| `auto_explain.log_analyze` | off | |
| `auto_explain.log_buffers` | off | needs log_analyze |
| `auto_explain.log_wal` | off | needs log_analyze |
| `auto_explain.log_timing` | on | needs log_analyze |
| `auto_explain.log_triggers` | off | needs log_analyze |
| `auto_explain.log_verbose` | off | |
| `auto_explain.log_settings` | off | |
| `auto_explain.log_format` | text | text, xml, json, yaml |
| `auto_explain.log_level` | LOG | DEBUG5..DEBUG1, INFO, NOTICE, WARNING, LOG |
| `auto_explain.log_nested_statements` | off | |
| `auto_explain.sample_rate` | 1 | |
| `basebackup_to_shell.command` | (none) | %f, %d, %% |
| `basebackup_to_shell.required_role` | (none) | |
| `basic_archive.archive_directory` | '' | must exist |
| `isn.weak` | false | |
| `passwordcheck.min_password_length` | 8 | bytes |
| `pgcrypto.builtin_crypto_enabled` | on | on, off, fips |
| `pg_prewarm.autoprewarm` | on | server start |
| `pg_prewarm.autoprewarm_interval` | 300s | 0 = only at shutdown |
| `pg_stat_statements.max` | 5000 | server start |
| `pg_stat_statements.track` | top | top, all, none |
| `pg_stat_statements.track_utility` | on | |
| `pg_stat_statements.track_planning` | off | |
| `pg_stat_statements.save` | on | |
| `pg_trgm.similarity_threshold` | 0.3 | `%` |
| `pg_trgm.word_similarity_threshold` | 0.6 | `<%`, `%>` |
| `pg_trgm.strict_word_similarity_threshold` | 0.5 | `<<%`, `%>>` |
| `postgres_fdw.application_name` | (none) | escapes %a %c %C %u %d %p %% |
| `sepgsql.permissive` | off | |
| `sepgsql.debug_audit` | off | |

### Index operator classes and index parameters defined in this slice
| module | AM | opclass | parameter (default; range) | representation / operators |
|---|---|---|---|---|
| bloom | bloom | int4, text only | `length` (80 bits; max 4096, rounded up to multiple of 16); `col1..col32` (2 bits; max 4095) | signature; `=` only |
| btree_gin | GIN | per scalar type | none | B-tree comparison operators |
| btree_gist | GiST | per scalar type | none (`buffering` to revert from sorted build) | B-tree operators, `<>`, `<->` KNN |
| cube | GiST | default for cube | none | `=`, `&&`, `@>`, `<@`; ORDER BY `<->`, `<#>`, `<=>`, `~>` |
| hstore | GiST | gist_hstore_ops | `siglen` (16 bytes; 1..2024) | bitmap signature; `@>`, `?`, `?&`, `?|` |
| hstore | GIN | default | none | `@>`, `?`, `?&`, `?|` |
| hstore | btree, hash | default | none | `=` |
| intarray | GiST | gist__int_ops (default) | `numranges` (100; 1..253) | array of integer ranges; `&&`, `@>`, `@@`, `=` |
| intarray | GiST | gist__intbig_ops | `siglen` (16 bytes; 1..2024) | bitmap signature (RD-tree) |
| intarray | GIN | gin__int_ops (non-default) | none | the above plus `<@` |
| ltree | GiST | gist_ltree_ops | `siglen` (8 bytes; multiple of 4, up to 2024) | `<`, `<=`, `=`, `>=`, `>`, `@>`, `<@`, `@`, `~`, `?` |
| ltree | GiST | gist__ltree_ops (ltree[]) | `siglen` (28 bytes) | `ltree[] <@ ltree`, `ltree @> ltree[]`, `@`, `~`, `?`; lossy |
| ltree | btree, hash | default | none | comparisons; `=` |
| pg_trgm | GiST | gist_trgm_ops | `siglen` (12 bytes; 1..2024) | similarity ops, KNN `<->` family, LIKE, ILIKE, `~`, `~*`, `=` |
| pg_trgm | GIN | gin_trgm_ops | none | same minus KNN ordering |
| seg | GiST | default for seg | none | `<<`, `>>`, `&<`, `&>`, `=`, `&&`, `@>`, `<@` |
| isn | btree, hash | default | none | comparisons |

### Default access rules for the inspection modules
| module | who may use by default |
|---|---|
| pageinspect | superusers only |
| pg_buffercache (views, summary, usage counts) | superusers, `pg_monitor` |
| pg_buffercache evict functions | superusers only |
| pg_freespacemap | superusers, `pg_stat_scan_tables` |
| pgstattuple | `pg_stat_scan_tables` (superusers bypass) |
| pg_visibility | superusers, `pg_stat_scan_tables`; `pg_truncate_visibility_map` superusers only |
| pgrowlocks | superusers, `pg_stat_scan_tables`, users with SELECT on the table |
| pg_walinspect | superusers, `pg_read_server_files` |
| pg_logicalinspect | superusers, `pg_read_server_files` |
| pg_stat_statements | everyone sees stats; text and queryid of other users only for superusers and `pg_read_all_stats`; reset superuser-only |
| file_fdw table options | superusers, `pg_read_server_files` (filename), `pg_execute_server_program` (program) |
| amcheck | grantable to non-superusers (with care) |

### Wait events defined in this slice (type Extension)
`DblinkConnect`, `DblinkGetConnect`, `DblinkGetResult`, `PostgresFdwCleanupResult`, `PostgresFdwConnect`, `PostgresFdwGetResult`.

### Hard limits and magic numbers
- bloom: signature 80 bits default / 4096 max; 2 bits per column default / 4095 max; 32 columns.
- cube: 100 dimensions; 64-bit floats. seg: 32-bit floats, 6 significant digits.
- ltree: label 1000 characters; path 65535 labels; `lca` up to 8 arguments.
- fuzzystrmatch: levenshtein and metaphone inputs 255 characters.
- pgcrypto: `gen_random_bytes` 1024 bytes per call; bf password 72 chars; des/xdes 8 chars.
- FSM granularity: 1/256 of BLCKSZ = 32 bytes.
- amcheck heapallindexed: about 2 bytes per tuple for a 2% miss probability.
- postgres_fdw: fetch_size 100, batch_size 1, 65535 parameters per query, COPY batch cap 1000, fdw_startup_cost 100, fdw_tuple_cost 0.2.
- pg_stat_statements.max 5000. pg_prewarm: 300 s dump interval, 2 workers reload.
- Signature opclass `siglen` upper bound 2024 bytes (hstore, intarray, ltree, pg_trgm).
- Magic numbers shown by pageinspect: btree `magic` 340322 version 4; BRIN `0xA8109CFA` version 1; hash `105121344` version 4; GIN metapage version 2; page layout `version` 4.

## Lesson ideas

### Visualizer ideas
- **Heap page X-ray (M2/M5)**: render an 8 kB page from `page_header` (`lower`, `upper`, `special`) plus `heap_page_items`; animate INSERT (line pointer grows down from `lower`, tuple placed up from `upper`), UPDATE (old tuple gets xmax, `t_ctid` points to the new version), DELETE, then VACUUM (line pointers become dead/unused). Decode flags with `heap_tuple_infomask_flags` (`raw_flags` vs `combined_flags` such as `HEAP_XMIN_FROZEN`).
- **B-tree explorer (M4)**: `bt_metap` (root, level, fastroot) → `bt_page_stats` per level → `bt_page_items`; highlight the high key (first item on any non-rightmost page), downlinks in internal-page `ctid`, the truncated "minus infinity" first item, and posting-list tuples (`tids`) produced by deduplication. Sibling links via `btpo_prev` / `btpo_next`.
- **Visibility map and freeze bits (M5/M7)**: grid of pages coloured from `pg_visibility(rel)` (all_visible, all_frozen, pd_all_visible); steps: fresh inserts (all false) → VACUUM (all_visible) → VACUUM FREEZE (all_frozen) → single UPDATE clears that page's bits.
- **FSM heat map (M2)**: `pg_freespace(rel)` values per block in 32-byte steps; show staleness after DELETE until VACUUM; optionally the FSM binary tree from `fsm_page_contents`.
- **Buffer pool clock sweep (M1)**: `pg_buffercache` rows as a ring coloured by `usagecount` (0..5) with dirty and pinned markers; `pg_buffercache_usage_counts()` as a histogram; evict a relation and watch buffers disappear.
- **WAL record stream (M7)**: run a statement, list records from `pg_get_wal_records_info` (resource_manager, record_type, record_length, fpi_length); show the full-page image appearing on the first touch of a page after a checkpoint; `pg_get_wal_stats` as a bar chart by resource manager.
- **Trigram matcher (M4)**: split two strings into padded trigrams (`show_trgm`), animate the set intersection for `similarity`, then the sliding extent for `word_similarity('word','two words')` = 0.8 vs `strict_word_similarity` = 0.571429; threshold sliders for 0.3 / 0.6 / 0.5.
- **Bloom signature (M4)**: show each column hashing into `colN` bits of an 80-bit signature; query = signature subset test; show false positives as "Rows Removed by Index Recheck".
- **Bloat meter (M7)**: `pgstattuple` live/dead/free percentages before and after UPDATE storm, VACUUM, VACUUM FULL; contrast with `pgstattuple_approx` skipping all-visible pages.
- **Row lock inspector (M5)**: `pgrowlocks` output for FOR SHARE vs FOR UPDATE, and the switch to a multixact (`multi = t`) when two sessions share-lock one row (needs two sessions; show as a recorded scenario).
- **postgres_fdw pushdown (M6)**: diagram of local plan vs "Remote SQL" from `EXPLAIN VERBOSE`; show which WHERE clauses ship (built-in, immutable) and the forced REPEATABLE READ remote transaction.
- **crosstab pivot (M3)**: animate rows grouped by row_name filling columns left to right (1-arg) vs by category (2-arg), showing the NULL gaps.

### Playground SQL (PGlite, single session)
Heap page internals (column names of `heap_page_items` are not listed on the docs page; verify in the playground):
```sql
CREATE EXTENSION IF NOT EXISTS pageinspect;
CREATE TABLE pi_demo(id int, v text);
INSERT INTO pi_demo SELECT g, 'row ' || g FROM generate_series(1,5) g;
SELECT * FROM page_header(get_raw_page('pi_demo', 0));
SELECT * FROM heap_page_items(get_raw_page('pi_demo', 0));
UPDATE pi_demo SET v = 'changed' WHERE id = 1;
DELETE FROM pi_demo WHERE id = 2;
SELECT t_ctid, raw_flags, combined_flags
  FROM heap_page_items(get_raw_page('pi_demo', 0)),
       LATERAL heap_tuple_infomask_flags(t_infomask, t_infomask2)
 WHERE t_infomask IS NOT NULL OR t_infomask2 IS NOT NULL;
```
B-tree pages:
```sql
CREATE TABLE bt_demo AS SELECT g AS id, g % 10 AS grp FROM generate_series(1,20000) g;
CREATE INDEX bt_demo_grp ON bt_demo(grp);
SELECT * FROM bt_metap('bt_demo_grp');
SELECT * FROM bt_page_stats('bt_demo_grp', 1);
SELECT itemoffset, ctid, itemlen, data, dead, htid, tids[0:2] AS some_tids
  FROM bt_page_items('bt_demo_grp', 1) LIMIT 10;
```
Visibility map, FSM, bloat:
```sql
CREATE EXTENSION IF NOT EXISTS pg_visibility;
CREATE EXTENSION IF NOT EXISTS pg_freespacemap;
SELECT * FROM pg_visibility('bt_demo') LIMIT 5;
VACUUM bt_demo;
SELECT * FROM pg_visibility_map_summary('bt_demo');
DELETE FROM bt_demo WHERE id % 2 = 0;
VACUUM bt_demo;
SELECT * FROM pg_freespace('bt_demo') LIMIT 10;
SELECT * FROM pg_check_visible('bt_demo');
```
Buffer cache:
```sql
CREATE EXTENSION IF NOT EXISTS pg_buffercache;
SELECT * FROM pg_buffercache_summary();
SELECT * FROM pg_buffercache_usage_counts();
SELECT c.relname, count(*) AS buffers
  FROM pg_buffercache b JOIN pg_class c ON b.relfilenode = pg_relation_filenode(c.oid)
 WHERE b.reldatabase IN (0, (SELECT oid FROM pg_database WHERE datname = current_database()))
 GROUP BY c.relname ORDER BY 2 DESC LIMIT 10;
```
WAL inspection (capture an LSN first; exact behaviour in PGlite to be verified):
```sql
CREATE EXTENSION IF NOT EXISTS pg_walinspect;
CREATE TABLE wal_mark AS SELECT pg_current_wal_insert_lsn() AS lsn;
INSERT INTO pi_demo VALUES (100, 'wal me');
SELECT start_lsn, resource_manager, record_type, record_length, fpi_length, description
  FROM pg_get_wal_records_info((SELECT lsn FROM wal_mark), 'FFFFFFFF/FFFFFFFF');
SELECT * FROM pg_get_wal_stats((SELECT lsn FROM wal_mark), 'FFFFFFFF/FFFFFFFF') WHERE count > 0;
```
Trigrams:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SELECT show_trgm('cat'), similarity('word', 'words'),
       word_similarity('word', 'two words'), strict_word_similarity('word', 'two words');
CREATE TABLE test_trgm (t text);
INSERT INTO test_trgm VALUES ('word'), ('words'), ('sword'), ('world'), ('banana');
CREATE INDEX trgm_idx ON test_trgm USING GIST (t gist_trgm_ops);
SELECT t, similarity(t, 'word') AS sml FROM test_trgm WHERE t % 'word' ORDER BY sml DESC, t;
SELECT t, t <-> 'word' AS dist FROM test_trgm ORDER BY dist LIMIT 3;
SELECT * FROM test_trgm WHERE t LIKE '%or%';
```
btree_gist exclusion constraint:
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE zoo (cage integer, animal text, EXCLUDE USING GIST (cage WITH =, animal WITH <>));
INSERT INTO zoo VALUES (123, 'zebra');
INSERT INTO zoo VALUES (123, 'zebra');
INSERT INTO zoo VALUES (123, 'lion');   -- fails: conflicting key value violates exclusion constraint
```
bloom:
```sql
CREATE EXTENSION IF NOT EXISTS bloom;
CREATE TABLE tbloom AS SELECT (random()*1000)::int AS i1, (random()*1000)::int AS i2,
       (random()*1000)::int AS i3 FROM generate_series(1,50000);
CREATE INDEX bloomidx ON tbloom USING bloom (i1, i2, i3) WITH (length=80, col1=2, col2=2, col3=4);
EXPLAIN ANALYZE SELECT * FROM tbloom WHERE i2 = 500 AND i3 = 7;
```
amcheck:
```sql
CREATE EXTENSION IF NOT EXISTS amcheck;
SELECT bt_index_check('bt_demo_grp', true);
SELECT * FROM verify_heapam('bt_demo');
```
hstore, ltree, citext, pgcrypto, tablefunc:
```sql
CREATE EXTENSION IF NOT EXISTS hstore;
SELECT 'a=>1, b=>2'::hstore -> 'a', 'a=>1'::hstore ? 'a', 'a=>1,b=>2'::hstore @> 'b=>2',
       hstore_to_jsonb_loose('a=>1, b=>t');
CREATE EXTENSION IF NOT EXISTS ltree;
SELECT 'Top.Science.Astronomy'::ltree <@ 'Top.Science', 'Top.Science.Astronomy'::ltree ~ '*.Astronomy.*',
       subpath('Top.Child1.Child2', 0, 2), lca('1.2.3', '1.2.3.4.5.6');
CREATE EXTENSION IF NOT EXISTS citext;
CREATE TABLE users (nick citext PRIMARY KEY);
INSERT INTO users VALUES ('larry');
SELECT * FROM users WHERE nick = 'Larry';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SELECT encode(digest('hello', 'sha256'), 'hex'), crypt('secret', gen_salt('bf', 6));
CREATE EXTENSION IF NOT EXISTS tablefunc;
CREATE TABLE sales(year int, month int, qty int);
INSERT INTO sales VALUES (2007,1,1000),(2007,2,1500),(2007,7,500),(2008,1,1000);
SELECT * FROM crosstab('select year, month, qty from sales order by 1',
                       'select m from generate_series(1,3) m')
  AS (year int, "Jan" int, "Feb" int, "Mar" int);
```
pg_stat_statements (works only if the module is preloaded in the PGlite build):
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
SELECT pg_stat_statements_reset();
SELECT count(*) FROM bt_demo WHERE grp IN (1, 2, 3);
SELECT count(*) FROM bt_demo WHERE grp IN (1, 2, 3, 4);
SELECT query, calls, rows, shared_blks_hit, shared_blks_read
  FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;
```

### Pitfalls the docs warn about (with the documented fix)
- **auto_explain.log_analyze** times every plan node of every statement, logged or not → turn off `auto_explain.log_timing`, or use `sample_rate`.
- **pg_stat_statements**: needs `shared_preload_libraries` and `compute_query_id`; entries evicted beyond `pg_stat_statements.max` (watch `pg_stat_statements_info.dealloc`, raise max); queryid is not stable across major versions or logical replicas; `track_planning` can hurt under concurrency.
- **bloom / signature indexes are lossy**: always rechecked; raise `length` / `siglen` to cut false positives; bloom has no UNIQUE, no NULL search, `=` only.
- **btree_gin / btree_gist** cannot enforce uniqueness and are slower than plain B-tree; use only for multicolumn GIN/GiST, exclusion constraints, or KNN.
- **citext**: operators must be on the `search_path` or case-sensitive text operators are silently used; no B-tree deduplication; prefer nondeterministic collations.
- **pg_trgm**: a LIKE/regex pattern with no extractable trigrams degenerates to a full index scan; KNN ordering works with GiST, not GIN.
- **amcheck**: `bt_index_parent_check` takes ShareLock and cannot run on hot standby → use `bt_index_check` in production; REINDEX may not fix corruption; absence of errors is not proof of health.
- **pg_surgery**: unsafe by design; last resort only.
- **pg_visibility**: non-empty `pg_check_frozen` / `pg_check_visible` means a corrupt VM → `pg_truncate_visibility_map` then VACUUM.
- **pg_freespacemap**: values are approximate (32-byte steps, lazily updated); meaningless for indexes beyond in-use vs empty.
- **pg_buffercache**: no locks taken, so cross-buffer results are inconsistent; filter joins by `reldatabase`; the NUMA view is expensive.
- **pgstattuple** does a full scan → use `pgstattuple_approx` on big tables.
- **pg_prewarm**: prewarming more than fits evicts earlier blocks; no protection from eviction.
- **postgres_fdw**: remote transactions run at REPEATABLE READ even when local is READ COMMITTED; no two-phase commit; remote `search_path` is `pg_catalog` only (schema-qualify functions used by remote views/triggers); non-built-in functions are not pushed down unless listed in `extensions`; local estimates need `ANALYZE` on the foreign table or `use_remote_estimate`; no `ON CONFLICT DO UPDATE`.
- **dblink**: must give a column definition list; `dblink_get_result` must be called until an empty set; cursors wrap a remote transaction that aborts on disconnect; `dblink_connect_u` is a privilege-escalation risk.
- **file_fdw**: `program` runs through the shell → fixed command string; every option needs a value (`header 'true'`).
- **pgcrypto**: data and keys travel in clear text to the server → use SSL or encrypt client-side; functions return NULL on NULL input; raw `encrypt()` has no integrity check → use PGP functions; `gen_random_uuid()` here is obsolete (core has it).
- **passwordcheck** cannot inspect pre-encrypted passwords; **auth_delay** can worsen DoS.
- **lo**: `DROP TABLE` / `TRUNCATE` bypass `lo_manage` → `DELETE FROM` first, run `vacuumlo`.
- **tablefunc**: `crosstab(text)` ignores the category column → always `ORDER BY 1,2`, or use the two-argument form when categories may be missing; `connectby` needs an index on the parent key and a delimiter absent from keys.
- **intarray**: errors on arrays containing NULLs; `uniq` only removes adjacent duplicates → `uniq(sort(...))`.
- **fuzzystrmatch**: soundex/metaphone/dmetaphone are unreliable with UTF-8 → `daitch_mokotoff` or `levenshtein`.
- **tsm_system_rows / tsm_system_time**: block-level sampling, no `REPEATABLE`.
- **xml2**: deprecated; `xpath_table` parameters are spliced into SQL (injection risk) → use core SQL/XML (`xmltable`, `xpath`).
- **refint** will be removed in PostgreSQL 20 → use real foreign keys. **intagg** is obsolete → `array_agg` / `unnest`.
