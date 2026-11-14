# Plan: finish slice O (Appendix F contrib modules) research notes

## Status when plan mode began
- All 70 pages of the slice (idx 1045-1114) have been read in full.
- `/Users/vivek-14286/postgres-internals/curriculum/research/O-contrib-extensions.md` already contains
  "Notes by topic" for idx 1045-1102 (overview, amcheck ... postgres_fdw), about 620 lines.
- Still missing from that file:
  1. the coverage ledger (file currently holds the placeholder line `<!--LEDGER-->`),
  2. topic notes for idx 1103-1114 (seg, sepgsql, spi, sslinfo, tablefunc, tcn, test_decoding,
     tsm_system_rows, tsm_system_time, unaccent, uuid-ossp, xml2),
  3. "Complete inventories" and "Lesson ideas" sections.

## Steps once editing is allowed
1. Replace the `<!--LEDGER-->` placeholder in the output file with the block between
   `<!--BEGIN-LEDGER-->` and `<!--END-LEDGER-->` below.
2. Append the block between `<!--BEGIN-APPEND-->` and `<!--END-APPEND-->` below to the output file.
3. Sanity check: `grep -c '^### '` (expect about 50 topic headings), confirm the four top-level
   sections exist in brief order, confirm line count is within 600-1500.
4. Hand back: output path, 70 pages read, 5 most lesson-worthy findings.

No other files are touched.

## Drafted content (verbatim text to insert)

<!--BEGIN-LEDGER-->
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
<!--END-LEDGER-->

<!--BEGIN-APPEND-->
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
<!--END-APPEND-->

## Verification
- Section order in the output file: title, Coverage ledger, Notes by topic, Complete inventories, Lesson ideas.
- Ledger has 70 rows (idx 1045-1114).
- Inventory table has 50 module rows (F.1-F.50).
